/**
 * Backup completo do Certificado de Joias: estrutura do banco + dados.
 *
 * Uso:  npm run backup
 *
 * Gera dois arquivos em supabase/migrations/, ambos cobertos pelo .gitignore:
 *
 *   estrutura_<data>_<hora>.sql   DDL: tabelas, colunas, constraints,
 *                                 indices e politicas de RLS.
 *   dados_backup_<data>_<hora>.sql  Os registros, como DELETE + INSERT.
 *
 * A estrutura vem da funcao public.estrutura_do_banco(), criada uma vez pelo
 * SQL Editor (fonte em sql/criar_funcao_estrutura.sql). Roda apenas com a
 * SERVICE_ROLE_KEY: sem Docker e sem a senha do banco.
 *
 * Isso nao substitui o pg_dump, que tambem captura triggers, funcoes,
 * sequencias, extensoes e grants. Para restauracao garantida seria preciso
 * `supabase db dump`, que exige Docker aberto e a senha do banco.
 */
import 'dotenv/config';
import { writeFileSync, statSync } from 'fs';
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
// 1/2  ESTRUTURA
// ---------------------------------------------------------------------------
async function exportarEstrutura() {
  console.log('\n=== 1/2  ESTRUTURA DO BANCO ===\n');

  const { data: ddl, error } = await supabase.rpc('estrutura_do_banco');

  if (error) {
    console.error(`!!  Nao consegui ler a estrutura: ${error.message}`);
    console.error('    Se a funcao nao existe, rode uma vez no SQL Editor do Supabase');
    console.error('    o arquivo sql/criar_funcao_estrutura.sql.');
    return false;
  }
  if (!ddl || !ddl.trim()) {
    console.error('!!  A funcao respondeu vazio - nenhuma tabela no schema public.');
    return false;
  }

  const arquivo = `supabase/migrations/estrutura_${stamp()}.sql`;
  writeFileSync(arquivo, ddl, 'utf8');

  const tabelas = (ddl.match(/^-- Tabela: /gm) || []).length;
  console.log(`Estrutura salva em: ${arquivo}`);
  console.log(`${tabelas} tabela(s), ${(statSync(arquivo).size / 1024).toFixed(1)} KB`);
  return true;
}

// ---------------------------------------------------------------------------
// 2/2  DADOS
// ---------------------------------------------------------------------------
function valorParaSQL(val) {
  if (val === null) return 'NULL';
  if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
  return val;
}

async function exportarDados() {
  console.log('\n=== 2/2  DADOS ===\n');

  let sql = '-- Dump de Dados - Certificado de Joias\n';
  sql += `-- Exportado em: ${new Date().toISOString()}\n\n`;
  sql += '-- DESABILITAR TRIGGERS E CONSTRAINTS TEMPORARIAMENTE\n';
  sql += 'SET CONSTRAINTS ALL DEFERRED;\n\n';

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
    sql += `DELETE FROM "${tabela}";\n\n`;

    for (const linha of data) {
      const colunas = Object.keys(linha).map(c => `"${c}"`).join(', ');
      const valores = Object.values(linha).map(valorParaSQL).join(', ');
      sql += `INSERT INTO "${tabela}" (${colunas}) VALUES (${valores});\n`;
    }
    sql += '\n';

    console.log(`  ok      ${tabela.padEnd(22)} ${String(data.length).padStart(4)} registro(s)`);
  }

  sql += '\n-- REABILITAR CONSTRAINTS\n';
  sql += 'SET CONSTRAINTS ALL IMMEDIATE;\n';

  const arquivo = `supabase/migrations/dados_backup_${stamp()}.sql`;
  writeFileSync(arquivo, sql, 'utf8');

  console.log(`\nDados salvos em: ${arquivo}`);
  console.log(`${(sql.length / 1024 / 1024).toFixed(2)} MB`);

  // Uma tabela que falhou deixa o backup incompleto: isso e falha, nao aviso.
  return falhas === 0;
}

// ---------------------------------------------------------------------------

const estruturaOk = await exportarEstrutura();
const dadosOk = await exportarDados();

console.log('\n=== RESUMO ===');
console.log(`Estrutura: ${estruturaOk ? 'OK' : 'FALHOU'}`);
console.log(`Dados:     ${dadosOk ? 'OK' : 'FALHOU'}`);

process.exit(estruturaOk && dadosOk ? 0 : 1);
