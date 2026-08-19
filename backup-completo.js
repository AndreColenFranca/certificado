/**
 * Backup completo: estrutura do banco + dados.
 *
 * Etapa 1 - estrutura (DDL): tabelas, colunas, constraints, indices e
 *   politicas de RLS. Vem da funcao public.estrutura_do_banco(), criada uma
 *   vez pelo SQL Editor (ver sql/criar_funcao_estrutura.sql). Usa a
 *   SERVICE_ROLE_KEY, sem Docker e sem a senha do banco.
 *
 *   Nao substitui o pg_dump, que tambem captura triggers, funcoes, sequencias,
 *   extensoes e grants. Para restauracao garantida, use
 *   `supabase db dump` (exige Docker aberto e SUPABASE_DB_PASSWORD no .env).
 *
 * Etapa 2 - dados: delega para o export-dados.js, que gera os INSERTs.
 *
 * Uso:  npm run backup
 */
import 'dotenv/config';
import { spawnSync } from 'child_process';
import { writeFileSync, statSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const stamp = new Date().toISOString().slice(0, 19).replace('T', '_').replace(/:/g, '-');
const schemaFile = `supabase/migrations/estrutura_${stamp}.sql`;

console.log('\n=== 1/2  ESTRUTURA DO BANCO ===\n');

let schemaOk = false;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { data: ddl, error } = await supabase.rpc('estrutura_do_banco');

if (error) {
  console.error(`!!  Nao consegui ler a estrutura: ${error.message}`);
  console.error('    Se a funcao nao existe, rode uma vez no SQL Editor do Supabase');
  console.error('    o arquivo sql/criar_funcao_estrutura.sql.');
} else if (!ddl || !ddl.trim()) {
  console.error('!!  A funcao respondeu vazio - nenhuma tabela encontrada no schema public.');
} else {
  writeFileSync(schemaFile, ddl, 'utf8');
  const tabelas = (ddl.match(/^-- Tabela: /gm) || []).length;
  console.log(`Estrutura salva em: ${schemaFile}`);
  console.log(`${tabelas} tabela(s), ${(statSync(schemaFile).size / 1024).toFixed(1)} KB`);
  schemaOk = true;
}

console.log('\n=== 2/2  DADOS ===\n');

const dataOk =
  spawnSync('node', ['export-dados.js'], { stdio: 'inherit', shell: true }).status === 0;

console.log('\n=== RESUMO ===');
console.log(`Estrutura: ${schemaOk ? 'OK' : 'FALHOU'}`);
console.log(`Dados:     ${dataOk ? 'OK' : 'FALHOU'}`);

// Sai com erro se qualquer etapa falhou, para nao passar despercebido.
process.exit(schemaOk && dataOk ? 0 : 1);
