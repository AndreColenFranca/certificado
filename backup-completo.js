/**
 * Backup completo do Certificado de Joias, em UM comando.
 *
 * Uso:  npm run backup
 *
 * Tres etapas, tudo dentro da pasta de backups (ver backup-dir.js):
 *
 *   1/3  pgdump_schema_<data>.sql   Schema completo: tabelas, constraints,
 *                                   indices, RLS e politicas, funcoes,
 *                                   triggers. Sai por pg_dump, num container.
 *   2/3  dados_backup_<data>.sql    Os registros, como DELETE + INSERT.
 *   3/3  fotos_<data>/              Os tres buckets de imagens.
 *
 * POR QUE OS DADOS NAO SAEM PELO pg_dump TAMBEM
 * Sairiam, mas em COPY, e o restaurar-completo.js so le INSERT - e ele precisa
 * ler, porque e quem troca os ids das contas recriadas. Um dump de dados do
 * pg_dump nao pode ser aplicado num projeto novo: os ids vem fixos e esbarram
 * na FK para auth.users. Dai a divisao: pg_dump entrega a estrutura, a API
 * entrega os dados.
 *
 * SE O DOCKER ESTIVER FECHADO, a etapa 1 cai para a funcao
 * public.estrutura_do_banco() (fonte em sql/criar_funcao_estrutura.sql), que
 * roda so com a SERVICE_ROLE_KEY. Ela enxerga tabelas e colunas, e mais nada:
 * o backup continua util para consulta, mas nao serve para restaurar sozinho.
 * O aviso aparece na tela e no resumo.
 *
 * O QUE ESTE BACKUP NAO COBRE: o schema auth do Supabase, onde ficam as
 * credenciais. A API de administracao devolve emails e papeis, nunca os hashes
 * de senha. Numa restauracao as contas sao recriadas com senha provisoria, e
 * como user_orgs tem FK para auth.users(id), os ids precisam ser trocados -
 * quem faz isso e o restaurar-completo.js.
 */
import 'dotenv/config';
import { writeFileSync, statSync } from 'fs';
import { spawnSync } from 'child_process';
import { join } from 'path';
import { pastaDeBackup } from './backup-dir.js';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Ordem importa na restauracao: as tabelas referenciadas vem antes das que
// apontam para elas, para os INSERTs nao esbarrarem em chave estrangeira.
const TABELAS = [
  'organizations',
  'auth_users',
  'customers',
  'user_orgs',
  'audit_logs',
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

const stamp = () =>
  new Date().toISOString().slice(0, 19).replace('T', '_').replace(/:/g, '-');

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('!!  Faltam SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY no .env.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ---------------------------------------------------------------------------
// 1/3  ESTRUTURA
// ---------------------------------------------------------------------------

/** O identificador do projeto vive dentro da propria URL do Supabase. */
function refDoProjeto() {
  const m = String(SUPABASE_URL || '').match(/https:\/\/([a-z0-9-]+)\.supabase\.co/i);
  return m ? m[1] : null;
}

/**
 * Schema completo por pg_dump, num container.
 *
 * Vai pelo session pooler (porta 5432), nao pelo host direto: o direto so tem
 * endereco IPv6 e esta rede nao tem IPv6. A porta 6543 do pooler tambem nao
 * serve - e transaction mode, e o pg_dump precisa de estado de sessao.
 *
 * A senha vai por PGPASSWORD, e nao embutida na URL, para nao depender de
 * URL-encoding quando ela tiver caractere especial.
 */
function estruturaPorPgDump(arquivo) {
  const ref = refDoProjeto();
  const senha = (process.env.SUPABASE_DB_PASSWORD || '').replace(/\s+/g, '');
  if (!ref) return { ok: false, motivo: 'SUPABASE_URL nao parece uma URL de projeto Supabase' };
  if (!senha) return { ok: false, motivo: 'falta SUPABASE_DB_PASSWORD no .env' };

  const host = process.env.SUPABASE_DB_HOST || 'aws-0-sa-east-1.pooler.supabase.com';

  const r = spawnSync('docker', [
    'run', '--rm', '-e', `PGPASSWORD=${senha}`, 'postgres:17', 'pg_dump',
    '-h', host, '-p', '5432', '-U', `postgres.${ref}`, '-d', 'postgres',
    '--schema=public', '--schema-only', '--no-owner', '--no-privileges',
    '--quote-all-identifiers',
  ], { encoding: 'utf8', maxBuffer: 128 * 1024 * 1024 });

  if (r.error) return { ok: false, motivo: `docker nao respondeu (${r.error.message})` };
  if (r.status !== 0) {
    const ultima = String(r.stderr || '').trim().split('\n').filter(Boolean).pop();
    return { ok: false, motivo: ultima || `pg_dump saiu com codigo ${r.status}` };
  }
  if (!r.stdout || !r.stdout.trim()) return { ok: false, motivo: 'pg_dump devolveu vazio' };

  // Num projeto Supabase novo o schema public ja existe: essa linha derrubaria
  // a aplicacao logo no comeco. Fica comentada, nao removida, para o arquivo
  // continuar sendo um retrato fiel do que o pg_dump viu.
  const sql = r.stdout.replace(
    /^CREATE SCHEMA "public";$/m,
    '-- CREATE SCHEMA "public";  -- comentado: o schema ja existe num projeto Supabase novo'
  );

  writeFileSync(arquivo, sql, 'utf8');

  const conta = p => (sql.match(new RegExp(`^${p}`, 'gm')) || []).length;
  return {
    ok: true,
    resumo: `${conta('CREATE TABLE')} tabela(s), ${conta('CREATE POLICY')} politica(s), ` +
            `${conta('CREATE TRIGGER')} trigger(s), ${conta('CREATE FUNCTION')} funcao(oes), ` +
            `${conta('CREATE INDEX')} indice(s)`,
  };
}

/** Plano B, sem Docker: a funcao no banco. So enxerga tabelas e colunas. */
async function estruturaPorFuncao(arquivo) {
  const { data: ddl, error } = await supabase.rpc('estrutura_do_banco');

  if (error) {
    return { ok: false, motivo: `${error.message} (se a funcao nao existe, rode sql/criar_funcao_estrutura.sql no SQL Editor)` };
  }
  if (!ddl || !ddl.trim()) {
    return { ok: false, motivo: 'a funcao respondeu vazio - nenhuma tabela no schema public' };
  }

  writeFileSync(arquivo, ddl, 'utf8');
  const tabelas = (ddl.match(/^-- Tabela: /gm) || []).length;
  return { ok: true, resumo: `${tabelas} tabela(s), so nomes e colunas` };
}

async function exportarEstrutura() {
  console.log('\n=== 1/3  ESTRUTURA DO BANCO ===\n');

  const arquivoCompleto = join(pastaDeBackup(), `pgdump_schema_${stamp()}.sql`);
  const viaPgDump = estruturaPorPgDump(arquivoCompleto);

  if (viaPgDump.ok) {
    console.log(`Estrutura salva em: ${arquivoCompleto}`);
    console.log(`${viaPgDump.resumo}, ${(statSync(arquivoCompleto).size / 1024).toFixed(1)} KB`);
    return { ok: true, completa: true, arquivo: arquivoCompleto };
  }

  console.log(`pg_dump nao rodou: ${viaPgDump.motivo}`);
  console.log('Caindo para a funcao no banco (abra o Docker Desktop para o schema completo).\n');

  const arquivoSimples = join(pastaDeBackup(), `estrutura_${stamp()}.sql`);
  const viaFuncao = await estruturaPorFuncao(arquivoSimples);

  if (!viaFuncao.ok) {
    console.error(`!!  Nao consegui ler a estrutura: ${viaFuncao.motivo}`);
    return { ok: false, completa: false, arquivo: null };
  }

  console.log(`Estrutura salva em: ${arquivoSimples}`);
  console.log(`${viaFuncao.resumo}, ${(statSync(arquivoSimples).size / 1024).toFixed(1)} KB`);
  return { ok: true, completa: false, arquivo: arquivoSimples };
}

// ---------------------------------------------------------------------------
// 2/3  DADOS
// ---------------------------------------------------------------------------
function valorParaSQL(val) {
  if (val === null) return 'NULL';
  if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
  return val;
}

async function exportarDados() {
  console.log('\n=== 2/3  DADOS ===\n');

  let sql = '-- Dump de Dados - Certificado de Joias\n';
  sql += `-- Exportado em: ${new Date().toISOString()}\n\n`;
  // Sem SET CONSTRAINTS ALL DEFERRED: ele so adia constraints declaradas
  // DEFERRABLE, e nenhuma aqui e. Dava falsa sensacao de seguranca.
  // A limpeza sai na ordem inversa (filho -> pai); os INSERTs, na ordem direta.
  sql += '-- Limpeza na ordem inversa das dependencias\n';
  for (const tabela of [...TABELAS].reverse()) {
    sql += `DELETE FROM "${tabela}";\n`;
  }
  sql += '\n';

  let falhas = 0;

  for (const tabela of TABELAS) {
    const { data, error } = await supabase.from(tabela).select('*').limit(10000);

    if (error) {
      console.warn(`  FALHOU  ${tabela.padEnd(22)} ${error.message}`);
      falhas++;
      continue;
    }
    if (!data || data.length === 0) {
      console.log(`  vazia   ${tabela}`);
      sql += `\n-- Tabela: ${tabela} (vazia)\n\n`;
      continue;
    }

    sql += `\n-- ========================================\n`;
    sql += `-- Tabela: ${tabela} (${data.length} registros)\n`;
    sql += `-- ========================================\n`;

    for (const linha of data) {
      const colunas = Object.keys(linha).map(c => `"${c}"`).join(', ');
      const valores = Object.values(linha).map(valorParaSQL).join(', ');
      sql += `INSERT INTO "${tabela}" (${colunas}) VALUES (${valores});\n`;
    }
    sql += '\n';

    console.log(`  ok      ${tabela.padEnd(22)} ${String(data.length).padStart(4)} registro(s)`);
  }

  sql += '\n-- Fim do dump\n';

  const arquivo = join(pastaDeBackup(), `dados_backup_${stamp()}.sql`);
  writeFileSync(arquivo, sql, 'utf8');

  console.log(`\nDados salvos em: ${arquivo}`);
  console.log(`${(sql.length / 1024 / 1024).toFixed(2)} MB`);

  // Uma tabela que falhou deixa o backup incompleto: isso e falha, nao aviso.
  return falhas === 0;
}

// ---------------------------------------------------------------------------
// 3/3  FOTOS
// ---------------------------------------------------------------------------

/**
 * Delega ao backup-fotos.js em vez de repetir o codigo aqui. Ele continua
 * valendo sozinho (`npm run backup-fotos`) para quando so as imagens
 * interessam.
 */
function exportarFotos() {
  console.log('\n=== 3/3  FOTOS ===\n');

  const r = spawnSync(process.execPath, ['backup-fotos.js'], { stdio: 'inherit' });

  if (r.error) {
    console.error(`!!  Nao consegui rodar backup-fotos.js: ${r.error.message}`);
    return false;
  }
  return r.status === 0;
}

// ---------------------------------------------------------------------------

const estrutura = await exportarEstrutura();
const dadosOk = await exportarDados();
const fotosOk = exportarFotos();

console.log('\n=== RESUMO ===');
console.log(`Estrutura: ${estrutura.ok ? (estrutura.completa ? 'OK (schema completo)' : 'OK (so tabelas e colunas)') : 'FALHOU'}`);
console.log(`Dados:     ${dadosOk ? 'OK' : 'FALHOU'}`);
console.log(`Fotos:     ${fotosOk ? 'OK' : 'FALHOU'}`);

// Estrutura incompleta nao e falha do backup, mas muda o que ele serve para
// fazer: quem tentar restaurar com esse arquivo sobe as tabelas sem RLS.
if (estrutura.ok && !estrutura.completa) {
  console.log('\nAtencao: a estrutura saiu sem politicas de seguranca, triggers');
  console.log('nem indices. Para restaurar de verdade, abra o Docker Desktop e');
  console.log('rode de novo.');
}

process.exit(estrutura.ok && dadosOk && fotosOk ? 0 : 1);
