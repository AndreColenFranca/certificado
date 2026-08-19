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
import 'dotenv/config';
import { spawnSync } from 'child_process';
import { existsSync, statSync, rmSync } from 'fs';

const stamp = new Date().toISOString().slice(0, 19).replace('T', '_').replace(/:/g, '-');

// O sufixo _remote_schema.sql é coberto pelo .gitignore e segue o padrão
// dos dumps que a CLI do Supabase já gerou aqui.
const schemaFile = `supabase/migrations/${stamp}_remote_schema.sql`;

const run = (cmd, args) =>
  spawnSync(cmd, args, { stdio: 'inherit', shell: true }).status === 0;

console.log('\n=== 1/2  ESTRUTURA DO BANCO ===\n');

// Sem a senha do banco a CLI tenta provisionar um papel de acesso pela API de
// gerenciamento, e isso responde 401. Passando -p ela conecta direto.
const dbPassword = process.env.SUPABASE_DB_PASSWORD;

let schemaOk = false;

if (!dbPassword) {
  console.error('!!  SUPABASE_DB_PASSWORD nao esta no .env - a estrutura sera pulada.');
  console.error('    Pegue em: Supabase > Project Settings > Database > Database password');
  console.error('    (se nao lembrar, de Reset database password) e acrescente ao .env:');
  console.error('    SUPABASE_DB_PASSWORD=sua-senha');
} else {
  const args = ['supabase', 'db', 'dump', '--schema', 'public',
                '-p', `"${dbPassword}"`, '-f', `"${schemaFile}"`];
  schemaOk = run('npx', args) && existsSync(schemaFile) && statSync(schemaFile).size > 0;
}

if (schemaOk) {
  console.log(`\nEstrutura salva em: ${schemaFile} (${(statSync(schemaFile).size / 1024).toFixed(1)} KB)`);
} else {
  // Nao deixa para tras o arquivo de 0 byte que o pg_dump cria antes de falhar.
  if (existsSync(schemaFile) && statSync(schemaFile).size === 0) rmSync(schemaFile);
  console.error('\n!!  A ESTRUTURA NAO FOI GERADA.');
  console.error('    Verifique: Docker Desktop aberto e SUPABASE_DB_PASSWORD no .env.');
  console.error('    Sigo para os dados assim mesmo - um backup parcial vale mais que nenhum.');
}

console.log('\n=== 2/2  DADOS ===\n');

const dataOk = run('node', ['export-dados.js']);

console.log('\n=== RESUMO ===');
console.log(`Estrutura: ${schemaOk ? 'OK' : 'FALHOU'}`);
console.log(`Dados:     ${dataOk ? 'OK' : 'FALHOU'}`);

// Sai com erro se qualquer etapa falhou, para nao passar despercebido.
process.exit(schemaOk && dataOk ? 0 : 1);
