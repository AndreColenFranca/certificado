/**
 * Backup completo: estrutura do banco + dados.
 *
 * Etapa 1 - estrutura (DDL): tabelas, colunas, constraints, índices,
 *   políticas de RLS, triggers e funções. Vem do `supabase db dump`, que roda
 *   o pg_dump dentro do Docker. É por isso que o Docker Desktop precisa estar
 *   aberto: a biblioteca do Supabase só lê dados, nunca a estrutura.
 *
 * Etapa 2 - dados: delega para o export-dados.js, que gera os INSERTs.
 *
 * Uso:  node backup-completo.js       (ou: npm run backup)
 */
import { spawnSync } from 'child_process';
import { existsSync, statSync } from 'fs';

const stamp = new Date().toISOString().slice(0, 19).replace('T', '_').replace(/:/g, '-');

// O sufixo _remote_schema.sql é coberto pelo .gitignore e segue o padrão
// dos dumps que a CLI do Supabase já gerou aqui.
const schemaFile = `supabase/migrations/${stamp}_remote_schema.sql`;

const run = (cmd, args) =>
  spawnSync(cmd, args, { stdio: 'inherit', shell: true }).status === 0;

console.log('\n=== 1/2  ESTRUTURA DO BANCO ===\n');

const schemaOk =
  run('npx', ['supabase', 'db', 'dump', '--schema', 'public', '-f', `"${schemaFile}"`]) &&
  existsSync(schemaFile) &&
  statSync(schemaFile).size > 0;

if (schemaOk) {
  console.log(`\nEstrutura salva em: ${schemaFile} (${(statSync(schemaFile).size / 1024).toFixed(1)} KB)`);
} else {
  console.error('\n!!  A ESTRUTURA NAO FOI GERADA.');
  console.error('    Causa mais comum: o Docker Desktop nao esta aberto.');
  console.error('    Abra o Docker Desktop, espere ficar "Running" e rode de novo.');
  console.error('    Sigo para os dados assim mesmo - um backup parcial vale mais que nenhum.');
}

console.log('\n=== 2/2  DADOS ===\n');

const dataOk = run('node', ['export-dados.js']);

console.log('\n=== RESUMO ===');
console.log(`Estrutura: ${schemaOk ? 'OK' : 'FALHOU'}`);
console.log(`Dados:     ${dataOk ? 'OK' : 'FALHOU'}`);

// Sai com erro se qualquer etapa falhou, para nao passar despercebido.
process.exit(schemaOk && dataOk ? 0 : 1);
