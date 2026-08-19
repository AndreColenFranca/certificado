/**
 * Migra as fotos dos certificados de base64 no banco para o Supabase Storage.
 *
 * Uso:  npm run migrar-imagens -- --dry-run   (so mostra o que faria)
 *       npm run migrar-imagens               (grava de verdade)
 *
 * Por que: jewelry_certificates.images guardava a imagem inteira em base64,
 * cerca de 1 MB por certificado. Isso inchava o banco e o backup e deixava a
 * listagem lenta. Depois desta migracao a coluna guarda so a URL publica do
 * bucket certificates-public, ~100 caracteres.
 *
 * O script e seguro de rodar mais de uma vez: entradas que ja sao URL (nao
 * comecam com "data:") sao mantidas como estao.
 *
 * FACA `npm run backup` ANTES. A troca reescreve a coluna images.
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').replace(/\s+/g, '');

const BUCKET = 'certificates-public';
const ORG_SEM_DONO = 'sem-org';

// So estes formatos entram no bucket; qualquer outra coisa fica no banco e e
// relatada no fim, para ninguem perder foto em silencio.
const EXTENSOES = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
};

const modoTeste = process.argv.includes('--dry-run');

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Faltam SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function formatarMB(bytes) {
  return (bytes / 1048576).toFixed(2) + ' MB';
}

async function migrar() {
  const { data: certificados, error } = await supabase
    .from('jewelry_certificates')
    .select('id, cert_code, org_id, images');

  if (error) {
    console.error('Nao foi possivel ler os certificados:', error.message);
    process.exit(1);
  }

  let totalImagens = 0;
  let enviadas = 0;
  let jaEramUrl = 0;
  let bytesLiberados = 0;
  const problemas = [];

  for (const cert of certificados) {
    const imagens = Array.isArray(cert.images) ? cert.images : [];
    if (imagens.length === 0) continue;

    const novas = [];
    let mudou = false;

    for (const imagem of imagens) {
      totalImagens++;

      if (typeof imagem !== 'string' || !imagem.startsWith('data:')) {
        jaEramUrl++;
        novas.push(imagem);
        continue;
      }

      const partes = imagem.match(/^data:([^;,]+);base64,(.+)$/);
      if (!partes) {
        problemas.push(`${cert.cert_code}: dataURL em formato inesperado, mantida no banco`);
        novas.push(imagem);
        continue;
      }

      const contentType = partes[1].toLowerCase();
      const extensao = EXTENSOES[contentType];
      if (!extensao) {
        problemas.push(`${cert.cert_code}: tipo ${contentType} nao suportado, mantida no banco`);
        novas.push(imagem);
        continue;
      }

      const arquivo = Buffer.from(partes[2], 'base64');
      const caminho = `${cert.org_id || ORG_SEM_DONO}/${randomUUID()}.${extensao}`;

      if (modoTeste) {
        console.log(`  [teste] ${cert.cert_code}: ${formatarMB(arquivo.length)} -> ${caminho}`);
        enviadas++;
        bytesLiberados += imagem.length;
        novas.push(imagem);
        continue;
      }

      const { error: erroUpload } = await supabase.storage
        .from(BUCKET)
        .upload(caminho, arquivo, { contentType, upsert: false });

      if (erroUpload) {
        problemas.push(`${cert.cert_code}: falha no upload (${erroUpload.message}), mantida no banco`);
        novas.push(imagem);
        continue;
      }

      const { data: publico } = supabase.storage.from(BUCKET).getPublicUrl(caminho);
      console.log(`  ${cert.cert_code}: ${formatarMB(arquivo.length)} -> ${caminho}`);
      novas.push(publico.publicUrl);
      enviadas++;
      bytesLiberados += imagem.length;
      mudou = true;
    }

    // So grava se alguma imagem virou URL. Assim rodar de novo nao encosta em
    // certificado ja migrado.
    if (mudou && !modoTeste) {
      const { error: erroUpdate } = await supabase
        .from('jewelry_certificates')
        .update({ images: novas })
        .eq('id', cert.id);

      if (erroUpdate) {
        problemas.push(`${cert.cert_code}: imagens subiram mas o UPDATE falhou (${erroUpdate.message})`);
      }
    }
  }

  console.log('');
  console.log(modoTeste ? '--- Simulacao (nada foi gravado) ---' : '--- Migracao concluida ---');
  console.log(`Certificados lidos: ${certificados.length}`);
  console.log(`Imagens encontradas: ${totalImagens}`);
  console.log(`Enviadas ao Storage: ${enviadas}`);
  console.log(`Ja eram URL: ${jaEramUrl}`);
  console.log(`Texto retirado do banco: ${formatarMB(bytesLiberados)}`);

  if (problemas.length > 0) {
    console.log('');
    console.log(`Pendencias (${problemas.length}):`);
    for (const p of problemas) console.log('  - ' + p);
    process.exitCode = 1;
  }
}

migrar().catch((err) => {
  console.error('Erro inesperado:', err.message);
  process.exit(1);
});
