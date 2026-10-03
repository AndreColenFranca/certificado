/**
 * Migra os logotipos das joalherias de base64 no banco para o Supabase Storage.
 *
 * Uso:  npm run migrar-logos -- --dry-run   (so mostra o que faria)
 *       npm run migrar-logos               (grava de verdade)
 *
 * Por que: organizations.logo_url guardava a imagem inteira em base64. O
 * logotipo de uma joalheria aqui chegou a 363 KB, e ele viaja a cada login e a
 * cada troca de loja - o front busca a organizacao para montar o cabecalho.
 * Nesse tamanho o proxy do servidor de desenvolvimento chega a devolver 503, e
 * o aplicativo cai no logotipo embutido, mostrando a marca errada. Depois desta
 * migracao a coluna guarda so a URL publica do bucket, ~100 caracteres.
 *
 * E o mesmo caminho que as fotos das joias ja seguiram em
 * migrar-imagens-storage.js, inclusive o bucket e a separacao por pasta de
 * organizacao.
 *
 * O script e seguro de rodar mais de uma vez: logotipo que ja e URL (nao comeca
 * com "data:") fica como esta.
 *
 * FACA `npm run backup` ANTES. A troca reescreve a coluna logo_url.
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').replace(/\s+/g, '');

const BUCKET = 'certificates-public';

// Os mesmos tipos que a rota de upload aceita. Um logotipo em SVG ou GIF nao
// passa por ela, entao tambem nao passa aqui - melhor parar e avisar do que
// gravar no bucket algo que a aplicacao nao aceitaria depois.
const TIPOS = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const ensaio = process.argv.includes('--dry-run');

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('!!  Faltam SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY no .env.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

const kb = n => `${(n / 1024).toFixed(1)} KB`;

async function migrar() {
  console.log(ensaio ? '=== ENSAIO (nada sera gravado) ===\n' : '=== MIGRANDO LOGOTIPOS ===\n');

  const { data: orgs, error } = await supabase
    .from('organizations')
    .select('id, name, display_name, logo_url')
    .order('created_at');

  if (error) {
    console.error(`!!  Nao consegui ler as organizacoes: ${error.message}`);
    return false;
  }

  let migrados = 0;
  let pulados = 0;
  let falhas = 0;

  for (const org of orgs) {
    const nome = org.display_name || org.name;
    const logo = org.logo_url;

    if (!logo) {
      console.log(`  --      ${nome.padEnd(20)} sem logotipo`);
      pulados++;
      continue;
    }
    if (!logo.startsWith('data:')) {
      console.log(`  ja ok   ${nome.padEnd(20)} ja e URL (${logo.slice(0, 48)}...)`);
      pulados++;
      continue;
    }

    const partes = logo.match(/^data:([^;,]+);base64,(.+)$/);
    if (!partes) {
      console.log(`  FALHOU  ${nome.padEnd(20)} data URI que nao reconheco`);
      falhas++;
      continue;
    }

    const contentType = partes[1].toLowerCase();
    const extensao = TIPOS[contentType];
    if (!extensao) {
      console.log(`  FALHOU  ${nome.padEnd(20)} tipo ${contentType} nao aceito (use JPEG, PNG ou WEBP)`);
      falhas++;
      continue;
    }

    const arquivo = Buffer.from(partes[2], 'base64');

    if (ensaio) {
      console.log(`  migraria ${nome.padEnd(19)} ${kb(logo.length)} no banco -> ${kb(arquivo.length)} no bucket`);
      migrados++;
      continue;
    }

    // Mesmo caminho da rota de upload: cada joalheria na sua pasta, o que
    // mantem a separacao entre lojas tambem no Storage.
    const caminho = `${org.id}/${randomUUID()}.${extensao}`;

    const { error: erroUpload } = await supabase.storage
      .from(BUCKET)
      .upload(caminho, arquivo, { contentType, upsert: false });

    if (erroUpload) {
      console.log(`  FALHOU  ${nome.padEnd(20)} envio: ${erroUpload.message}`);
      falhas++;
      continue;
    }

    const { data: publico } = supabase.storage.from(BUCKET).getPublicUrl(caminho);

    // A coluna so e reescrita depois do envio dar certo. Na ordem inversa, uma
    // falha no upload deixaria a organizacao apontando para o nada.
    const { error: erroUpdate } = await supabase
      .from('organizations')
      .update({ logo_url: publico.publicUrl, updated_at: new Date().toISOString() })
      .eq('id', org.id);

    if (erroUpdate) {
      console.log(`  FALHOU  ${nome.padEnd(20)} banco: ${erroUpdate.message}`);
      console.log(`          (a imagem ficou em ${caminho}, pode apagar do bucket)`);
      falhas++;
      continue;
    }

    console.log(`  ok      ${nome.padEnd(20)} ${kb(logo.length)} -> ${kb(publico.publicUrl.length)} na coluna`);
    migrados++;
  }

  console.log(`\n=== RESUMO ===`);
  console.log(`Migrados: ${migrados}  |  Pulados: ${pulados}  |  Falhas: ${falhas}`);
  if (ensaio) console.log('\nEnsaio. Para gravar: npm run migrar-logos');

  return falhas === 0;
}

const ok = await migrar();
process.exit(ok ? 0 : 1);
