/**
 * Faxina do bucket de fotos: apaga arquivo que nenhum registro referencia.
 *
 * Uso:  npm run faxina-fotos                  simula (nao apaga nada)
 *       npm run faxina-fotos -- --apagar      apaga de verdade
 *       npm run faxina-fotos -- --horas=48    muda a trava de idade
 *
 * POR QUE ISSO PRECISA EXISTIR
 * A foto sobe para o bucket no momento em que e escolhida, antes de o
 * certificado ser salvo. Entao quem abre o formulario, anexa fotos e fecha sem
 * salvar deixa arquivo para tras — e ninguem avisa o servidor disso. Apagar no
 * momento em que a foto sai do certificado nao resolveria esse caso, que e o
 * mais comum. Varrer e comparar resolve todos.
 *
 * A TRAVA DE IDADE E O QUE TORNA ISTO SEGURO
 * Um arquivo recem-enviado pode pertencer a um formulario aberto agora, ainda
 * nao salvo. Ele nao esta em lugar nenhum do banco e pareceria orfao. Por isso
 * so entra na conta arquivo com mais de HORAS_MINIMAS de vida.
 *
 * A busca por referencias varre TODAS as colunas de TODAS as tabelas, e nao so
 * jewelry_certificates.images. Se um dia outra coluna passar a guardar URL de
 * foto, a faxina nao vai apagar o arquivo dela por desconhecimento.
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').replace(/\s+/g, '');

const BUCKET = 'certificates-public';

// Mesma lista do backup, MENOS audit_logs — ver o porque logo abaixo.
//
// audit_logs guarda fotografias antigas das linhas em old_values/new_values,
// entao toda foto ja anexada aparece la para sempre (ou, aqui, ate a funcao
// limpar_audit_logs() aposentar o registro, o que acontece na 11a alteracao,
// porque ela mantem so os 10 mais recentes). Contar isso como "em uso" faria a
// faxina proteger justamente o arquivo que acabou de ser removido de um
// certificado — o caso 3, um dos que ela existe para resolver. Historico nao e
// referencia viva: audit_logs fica de fora de proposito.
const TABELAS = [
  'organizations',
  'auth_users',
  'customers',
  'user_orgs',
  'collections',
  'color_grades',
  'cut_shapes',
  'finishes',
  'manufacturers',
  'metal_colors',
  'metal_purities',
  'setting_types',
  'stone_types',
  'jewelry_certificates',
  'maintenance_records'
];

const argumentos = process.argv.slice(2);
const vaiApagar = argumentos.includes('--apagar');
const horasArg = argumentos.find((a) => a.startsWith('--horas='));
const HORAS_MINIMAS = horasArg ? Number(horasArg.split('=')[1]) : 24;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Faltam SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env');
  process.exit(1);
}
if (!Number.isFinite(HORAS_MINIMAS) || HORAS_MINIMAS < 0) {
  console.error('--horas precisa ser um numero de horas, ex: --horas=48');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const formatarMB = (bytes) => (bytes / 1048576).toFixed(2) + ' MB';

/** Todo caminho dentro do bucket citado em algum texto, venha de onde vier. */
function extrairCaminhos(texto, destino) {
  const marcador = '/' + BUCKET + '/';
  let posicao = texto.indexOf(marcador);
  while (posicao !== -1) {
    const resto = texto.slice(posicao + marcador.length);
    // Para no primeiro caractere que nao faz parte de uma URL de arquivo.
    const fim = resto.search(/["'\s<>)\]},]|$/);
    const caminho = resto.slice(0, fim === -1 ? undefined : fim);
    if (caminho) {
      try {
        destino.add(decodeURIComponent(caminho));
      } catch {
        destino.add(caminho);
      }
    }
    posicao = texto.indexOf(marcador, posicao + marcador.length);
  }
}

/** Desce por qualquer valor (texto, lista, jsonb) atras de referencias. */
function varrerValor(valor, destino) {
  if (typeof valor === 'string') {
    extrairCaminhos(valor, destino);
    return;
  }
  if (Array.isArray(valor)) {
    for (const item of valor) varrerValor(item, destino);
    return;
  }
  if (valor && typeof valor === 'object') {
    for (const item of Object.values(valor)) varrerValor(item, destino);
  }
}

async function referenciasNoBanco() {
  const referenciados = new Set();
  const porTabela = {};

  for (const tabela of TABELAS) {
    const { data, error } = await supabase.from(tabela).select('*');
    if (error) {
      // Uma tabela ilegivel torna a faxina cega: melhor parar do que apagar
      // arquivo que talvez estivesse citado nela.
      console.error(`Nao foi possivel ler a tabela ${tabela}: ${error.message}`);
      console.error('Faxina abortada — sem leitura completa, apagar e chute.');
      process.exit(1);
    }
    const antes = referenciados.size;
    for (const linha of data || []) varrerValor(linha, referenciados);
    const novos = referenciados.size - antes;
    if (novos > 0) porTabela[tabela] = novos;
  }

  return { referenciados, porTabela };
}

async function arquivosDoBucket(prefixo = '') {
  const encontrados = [];
  let deslocamento = 0;

  for (;;) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list(prefixo, { limit: 100, offset: deslocamento });

    if (error) {
      console.error(`Nao foi possivel listar "${prefixo || '/'}": ${error.message}`);
      process.exit(1);
    }
    if (!data || data.length === 0) break;

    for (const item of data) {
      const caminho = prefixo ? prefixo + '/' + item.name : item.name;
      // Pasta vem sem id; arquivo vem com id e metadata.
      if (!item.id) {
        encontrados.push(...(await arquivosDoBucket(caminho)));
      } else {
        encontrados.push({
          caminho,
          tamanho: item.metadata?.size || 0,
          criadoEm: item.created_at || item.updated_at || null
        });
      }
    }

    if (data.length < 100) break;
    deslocamento += data.length;
  }

  return encontrados;
}

async function faxinar() {
  console.log(vaiApagar ? '=== FAXINA (vai apagar) ===' : '=== FAXINA (simulacao) ===');
  console.log(`Bucket: ${BUCKET} | poupando arquivos com menos de ${HORAS_MINIMAS}h`);
  console.log('');

  const { referenciados, porTabela } = await referenciasNoBanco();
  const arquivos = await arquivosDoBucket();

  const limite = Date.now() - HORAS_MINIMAS * 3600 * 1000;
  const orfaos = [];
  const recentesPoupados = [];

  for (const arquivo of arquivos) {
    if (referenciados.has(arquivo.caminho)) continue;
    const nascimento = arquivo.criadoEm ? new Date(arquivo.criadoEm).getTime() : null;
    // Sem data confiavel, poupa: melhor sobrar arquivo que apagar foto viva.
    if (nascimento === null || nascimento > limite) {
      recentesPoupados.push(arquivo);
    } else {
      orfaos.push(arquivo);
    }
  }

  // Referencia que aponta para arquivo inexistente nao e problema desta faxina,
  // mas e sintoma de foto quebrada na tela — vale mostrar.
  const noBucket = new Set(arquivos.map((a) => a.caminho));
  const quebrados = [...referenciados].filter((c) => !noBucket.has(c));

  console.log('Referencias encontradas no banco:', referenciados.size);
  for (const [tabela, quantos] of Object.entries(porTabela)) {
    console.log(`   ${tabela}: ${quantos}`);
  }
  console.log('Arquivos no bucket:', arquivos.length, '|', formatarMB(arquivos.reduce((a, b) => a + b.tamanho, 0)));
  console.log('');

  if (recentesPoupados.length > 0) {
    console.log(`Poupados por serem recentes (${recentesPoupados.length}):`);
    for (const a of recentesPoupados) console.log(`   ${a.caminho}  ${(a.tamanho / 1024).toFixed(0)} KB  ${a.criadoEm}`);
    console.log('');
  }

  if (quebrados.length > 0) {
    console.log(`ATENCAO — referencias apontando para arquivo que nao existe (${quebrados.length}):`);
    for (const c of quebrados) console.log('   ' + c);
    console.log('   Estas fotos aparecem quebradas na tela. A faxina nao mexe nisso.');
    console.log('');
  }

  if (orfaos.length === 0) {
    console.log('Nenhum arquivo orfao. Nada a fazer.');
    return;
  }

  const pesoOrfaos = orfaos.reduce((a, b) => a + b.tamanho, 0);
  console.log(`Orfaos (${orfaos.length}, ${formatarMB(pesoOrfaos)}):`);
  for (const a of orfaos) console.log(`   ${a.caminho}  ${(a.tamanho / 1024).toFixed(0)} KB  ${a.criadoEm}`);
  console.log('');

  if (!vaiApagar) {
    console.log('Simulacao: nada foi apagado.');
    console.log('Para apagar de verdade:  npm run faxina-fotos -- --apagar');
    return;
  }

  // Em lotes, porque a API tem teto por chamada.
  let apagados = 0;
  const caminhos = orfaos.map((a) => a.caminho);
  for (let i = 0; i < caminhos.length; i += 100) {
    const lote = caminhos.slice(i, i + 100);
    const { error } = await supabase.storage.from(BUCKET).remove(lote);
    if (error) {
      console.error(`Falha ao apagar um lote: ${error.message}`);
      process.exitCode = 1;
    } else {
      apagados += lote.length;
    }
  }

  console.log(`Apagados: ${apagados} arquivo(s), ${formatarMB(pesoOrfaos)} liberados.`);
}

faxinar().catch((err) => {
  console.error('Erro inesperado:', err.message);
  process.exit(1);
});
