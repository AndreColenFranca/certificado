/**
 * Restaura um backup do Certificado de Joias num projeto Supabase VAZIO.
 *
 * Uso:  npm run restaurar -- --ler        (so confere o backup, sem banco algum)
 *       npm run restaurar                (ensaio: mostra o que faria, sem gravar)
 *       npm run restaurar -- --confirmar (grava para valer)
 *
 * O destino NUNCA e o projeto do .env. Ele vem de variaveis proprias, e o
 * script recusa rodar se as duas apontarem para o mesmo lugar:
 *
 *   RESTORE_SUPABASE_URL=https://<projeto-novo>.supabase.co
 *   RESTORE_SUPABASE_SERVICE_ROLE_KEY=<service_role do projeto novo>
 *
 * A razao dessa cerca: o dump de dados comeca com DELETE FROM em todas as
 * tabelas. Apontar para producao por engano apagaria tudo.
 *
 * A ESTRUTURA E APLICADA PELO PROPRIO SCRIPT, se voce der a ele a senha do
 * banco de destino:
 *
 *   RESTORE_DB_PASSWORD=<senha do banco do projeto novo>
 *   RESTORE_DB_HOST=<opcional; so se o projeto novo nao for sa-east-1>
 *
 * Ela vai pelo session pooler (porta 5432) num container postgres:17, porque
 * DDL nao passa pela API do Supabase - mas passa por uma conexao Postgres.
 * Sem essa variavel o script volta ao jeito antigo: confere se as tabelas
 * existem e manda voce colar o SQL no SQL Editor.
 *
 * AS FOTOS VAO JUNTO no fim, delegadas ao restaurar-fotos.js. Banco e imagens
 * precisam pousar no mesmo projeto, senao os certificados apontam para fotos
 * que ficaram para tras.
 *
 * O QUE ESTE SCRIPT RESOLVE, e que uma restauracao a mao erra:
 *
 *   As senhas nao estao no backup (ficam no schema auth, que a API nao
 *   exporta). As contas precisam ser recriadas, e cada conta nova nasce com
 *   um id novo. So que `user_orgs.user_id` tem FK para auth.users(id), e
 *   `auth_users.id` precisa casar com a conta: os ids do backup apontariam
 *   para contas que nao existem mais, e os INSERTs falhariam. Por isso aqui
 *   as contas sao recriadas primeiro e os ids antigos sao trocados pelos
 *   novos em auth_users, user_orgs e audit_logs.
 *
 * Todo mundo volta com a mesma senha provisoria (SENHA_PROVISORIA) e precisa
 * troca-la. O script lista as contas no fim.
 */
import 'dotenv/config';
import { readFileSync, readdirSync, statSync } from 'fs';
import { spawnSync } from 'child_process';
import { join } from 'path';
import { pastaDeBackup } from './backup-dir.js';
import { createClient } from '@supabase/supabase-js';

const SENHA_PROVISORIA = 'TrocarSenha!2026';

// Mesma ordem do backup: pai antes de filho, para os INSERTs nao esbarrarem
// em chave estrangeira.
const TABELAS = [
  'organizations', 'auth_users', 'customers', 'user_orgs', 'audit_logs',
  'collections', 'color_grades', 'cut_shapes', 'finishes', 'manufacturers',
  'metal_colors', 'metal_purities', 'setting_types', 'stone_types',
  'jewelry_certificates', 'maintenance_records',
];

// Onde mora um id de usuario. Sao estas as colunas que precisam do
// de-para depois que as contas forem recriadas.
const COLUNAS_DE_USUARIO = {
  auth_users: 'id',
  user_orgs: 'user_id',
  audit_logs: 'user_id',
};

const confirmado = process.argv.includes('--confirmar');
// Confere se o backup esta legivel, sem tocar em banco nenhum.
const somenteLer = process.argv.includes('--ler');

// ---------------------------------------------------------------------------
// Leitura do dump
// ---------------------------------------------------------------------------

/**
 * Quebra o arquivo em comandos SQL.
 *
 * Nao da para cortar por linha: um texto livre (uma observacao, por exemplo)
 * pode ter quebra de linha dentro das aspas, e o comando ocupa varias linhas.
 * Entao o corte e no ';' que estiver FORA de aspas, e '' dentro de uma string
 * conta como aspas escapada, nao como fim dela.
 *
 * Comentarios sao descartados aqui, e nao depois: o dump abre cada tabela com
 * um cabecalho comentado, que grudaria no primeiro INSERT dela e faria esse
 * INSERT ser ignorado - um registro por tabela sumindo calado.
 */
function separarComandos(sql) {
  const comandos = [];
  let atual = '';
  let dentroDeAspas = false;

  for (let i = 0; i < sql.length; i++) {
    const c = sql[i];

    if (c === "'") {
      if (dentroDeAspas && sql[i + 1] === "'") { atual += "''"; i++; continue; }
      dentroDeAspas = !dentroDeAspas;
      atual += c;
      continue;
    }

    // '--' fora de aspas comenta ate o fim da linha. Dentro de aspas e texto
    // comum (um telefone '11--2222', por exemplo) e nao pode ser cortado.
    if (c === '-' && sql[i + 1] === '-' && !dentroDeAspas) {
      const fimDaLinha = sql.indexOf('\n', i);
      if (fimDaLinha === -1) break;
      i = fimDaLinha;
      atual += '\n';
      continue;
    }

    if (c === ';' && !dentroDeAspas) {
      const limpo = atual.trim();
      if (limpo) comandos.push(limpo);
      atual = '';
      continue;
    }

    atual += c;
  }

  const resto = atual.trim();
  if (resto) comandos.push(resto);
  return comandos;
}

/** Separa a lista de valores de um INSERT, respeitando aspas e parenteses. */
function separarValores(texto) {
  const valores = [];
  let atual = '';
  let dentroDeAspas = false;
  let profundidade = 0;

  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];

    if (c === "'") {
      if (dentroDeAspas && texto[i + 1] === "'") { atual += "''"; i++; continue; }
      dentroDeAspas = !dentroDeAspas;
      atual += c;
      continue;
    }

    if (!dentroDeAspas) {
      if (c === '(') profundidade++;
      if (c === ')') profundidade--;
      if (c === ',' && profundidade === 0) { valores.push(atual.trim()); atual = ''; continue; }
    }

    atual += c;
  }

  valores.push(atual.trim());
  return valores;
}

/** Converte um valor SQL de volta para JavaScript. */
function valorParaJS(bruto) {
  const v = bruto.trim();
  if (v.toUpperCase() === 'NULL') return null;
  if (v === 'true') return true;
  if (v === 'false') return false;

  if (v.startsWith("'") && v.endsWith("'")) {
    const texto = v.slice(1, -1).replace(/''/g, "'");
    // O backup grava objetos e listas como JSON dentro de aspas; desfaz aqui.
    if (/^[[{]/.test(texto)) {
      try { return JSON.parse(texto); } catch { return texto; }
    }
    return texto;
  }

  const numero = Number(v);
  return Number.isNaN(numero) ? v : numero;
}

/** Le o dump e devolve { tabela: [registros] }. */
function lerDump(caminho) {
  const sql = readFileSync(caminho, 'utf8');
  const registros = {};

  for (const comando of separarComandos(sql)) {
    const m = comando.match(/^INSERT INTO "([^"]+)"\s*\(([\s\S]*?)\)\s*VALUES\s*\(([\s\S]*)\)$/i);
    if (!m) continue;

    const [, tabela, colunasBrutas, valoresBrutos] = m;
    const colunas = colunasBrutas.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
    const valores = separarValores(valoresBrutos).map(valorParaJS);

    if (colunas.length !== valores.length) {
      throw new Error(`${tabela}: ${colunas.length} colunas para ${valores.length} valores - dump possivelmente corrompido`);
    }

    const linha = {};
    colunas.forEach((c, i) => { linha[c] = valores[i]; });
    (registros[tabela] ||= []).push(linha);
  }

  return registros;
}

/** Pega o backup mais recente de cada tipo. */
function backupMaisRecente(prefixo) {
  const dir = pastaDeBackup();
  const arquivos = readdirSync(dir).filter(f => f.startsWith(prefixo) && f.endsWith('.sql')).sort();
  if (arquivos.length === 0) throw new Error(`nenhum arquivo ${prefixo}*.sql em ${dir}/`);
  return join(dir, arquivos[arquivos.length - 1]);
}

/**
 * Qual arquivo de estrutura usar.
 *
 * O pgdump_schema_* ganha do estrutura_* sempre que existir: o segundo vem da
 * funcao no banco e so tem tabelas e colunas. Restaurar com ele deixa o
 * projeto novo sem politicas de seguranca - de pe, mas com as tabelas
 * destrancadas e sem separacao entre organizacoes.
 */
function arquivoDeEstrutura() {
  try {
    return { caminho: backupMaisRecente('pgdump_schema_'), completo: true };
  } catch {
    return { caminho: backupMaisRecente('estrutura_'), completo: false };
  }
}

/** A pasta de fotos mais recente, ou null se nunca rodou o backup de fotos. */
function pastaDeFotosMaisRecente() {
  const dir = pastaDeBackup();
  const pastas = readdirSync(dir)
    .filter(f => f.startsWith('fotos_') && statSync(join(dir, f)).isDirectory())
    .sort();
  return pastas.length ? join(dir, pastas[pastas.length - 1]) : null;
}

// ---------------------------------------------------------------------------
// Estrutura no destino (DDL)
// ---------------------------------------------------------------------------

/**
 * Aplica o SQL de estrutura no projeto de destino, por psql num container.
 *
 * DDL nao passa pela API do Supabase, mas passa por uma conexao Postgres. O
 * caminho e o session pooler na porta 5432 - o host direto so existe em IPv6,
 * e a porta 6543 e transaction mode, que nao aguenta um script inteiro.
 *
 * Devolve { ok, motivo } em vez de lancar: quem chama decide se cai para o
 * jeito manual ou para tudo.
 */
function aplicarEstruturaNoDestino(arquivo) {
  const senha = (process.env.RESTORE_DB_PASSWORD || '').replace(/\s+/g, '');
  if (!senha) return { ok: false, motivo: 'RESTORE_DB_PASSWORD nao esta no .env', configuravel: true };

  const m = String(process.env.RESTORE_SUPABASE_URL || '').match(/https:\/\/([a-z0-9-]+)\.supabase\.co/i);
  if (!m) return { ok: false, motivo: 'RESTORE_SUPABASE_URL nao parece uma URL de projeto Supabase', configuravel: true };

  const host = process.env.RESTORE_DB_HOST || 'aws-0-sa-east-1.pooler.supabase.com';
  const sql = readFileSync(arquivo, 'utf8');

  // ON_ERROR_STOP para nao seguir adiante depois de um comando falhar: meia
  // estrutura aplicada e pior que nenhuma, porque parece que deu certo.
  const r = spawnSync('docker', [
    'run', '--rm', '-i', '-e', `PGPASSWORD=${senha}`, 'postgres:17', 'psql',
    '-h', host, '-p', '5432', '-U', `postgres.${m[1]}`, '-d', 'postgres',
    '-v', 'ON_ERROR_STOP=1', '-f', '-',
  ], { input: sql, encoding: 'utf8', maxBuffer: 128 * 1024 * 1024 });

  if (r.error) return { ok: false, motivo: `docker nao respondeu (${r.error.message})` };
  if (r.status !== 0) {
    const erro = String(r.stderr || '').trim().split('\n').filter(Boolean).slice(-3).join('\n     ');
    return { ok: false, motivo: erro || `psql saiu com codigo ${r.status}` };
  }
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Fotos no destino
// ---------------------------------------------------------------------------

/** Delega ao restaurar-fotos.js, sempre com --destino. */
function restaurarFotos(pasta) {
  const r = spawnSync(process.execPath, ['restaurar-fotos.js', pasta, '--destino'], { stdio: 'inherit' });
  if (r.error) {
    console.log(`     FALHOU  nao consegui rodar restaurar-fotos.js: ${r.error.message}`);
    return false;
  }
  return r.status === 0;
}

// ---------------------------------------------------------------------------
// Destino
// ---------------------------------------------------------------------------

function conectarDestino() {
  const url = process.env.RESTORE_SUPABASE_URL;
  const key = (process.env.RESTORE_SUPABASE_SERVICE_ROLE_KEY || '').replace(/\s+/g, '').trim();

  if (!url || !key) {
    throw new Error(
      'defina RESTORE_SUPABASE_URL e RESTORE_SUPABASE_SERVICE_ROLE_KEY com o projeto de DESTINO.\n' +
      '  Sao variaveis separadas de proposito: o restore apaga todas as tabelas antes de gravar.'
    );
  }

  const origem = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  if (origem && new URL(url).host === new URL(origem).host) {
    throw new Error(
      'o destino e o MESMO projeto do .env. Recusando: isso apagaria os dados de verdade.\n' +
      '  RESTORE_SUPABASE_URL deve apontar para um projeto novo e vazio.'
    );
  }

  return createClient(url, key, { auth: { persistSession: false } });
}

/** Confere se a estrutura ja foi aplicada no destino. */
async function conferirEstrutura(destino) {
  const faltando = [];
  for (const tabela of TABELAS) {
    const { error } = await destino.from(tabela).select('*', { count: 'exact', head: true });
    if (error) faltando.push(tabela);
  }
  return faltando;
}

// ---------------------------------------------------------------------------
// Restauracao
// ---------------------------------------------------------------------------

/**
 * Recria as contas de login e devolve o de-para id_antigo -> id_novo.
 * As contas saem do proprio auth_users do backup: e de la que vem os e-mails.
 */
async function recriarContas(destino, linhasAuthUsers) {
  const dePara = new Map();
  const criadas = [];
  const falhas = [];

  const { data: existentes } = await destino.auth.admin.listUsers();
  const porEmail = new Map((existentes?.users || []).map(u => [u.email?.toLowerCase(), u.id]));

  for (const linha of linhasAuthUsers) {
    const email = String(linha.email || '').toLowerCase();
    if (!email) continue;

    // Se a conta ja existe no destino, aproveita em vez de duplicar.
    if (porEmail.has(email)) {
      dePara.set(linha.id, porEmail.get(email));
      continue;
    }

    const { data, error } = await destino.auth.admin.createUser({
      email,
      password: SENHA_PROVISORIA,
      email_confirm: true,
      user_metadata: { display_name: linha.name, role: linha.role },
    });

    if (error || !data?.user) {
      falhas.push(`${email}: ${error?.message || 'sem resposta'}`);
      continue;
    }

    dePara.set(linha.id, data.user.id);
    criadas.push(email);
  }

  return { dePara, criadas, falhas };
}

/**
 * Reescreve o endereco do projeto dentro das URLs guardadas.
 *
 * As fotos entram no banco como URL completa, com o host do projeto dentro:
 * https://<projeto>.supabase.co/storage/v1/object/public/...
 * Restaurando num projeto novo, essas URLs continuariam apontando para o
 * projeto velho - as joias apareceriam vindas do lugar errado, ou nao
 * apareceriam se ele nao existir mais. Aqui o host antigo vira o novo.
 */
function trocarHostDasUrls(valor, hostAntigo, hostNovo) {
  if (typeof valor === 'string') {
    return valor.split(hostAntigo).join(hostNovo);
  }
  if (Array.isArray(valor)) {
    return valor.map(v => trocarHostDasUrls(v, hostAntigo, hostNovo));
  }
  if (valor && typeof valor === 'object') {
    const saida = {};
    for (const [k, v] of Object.entries(valor)) saida[k] = trocarHostDasUrls(v, hostAntigo, hostNovo);
    return saida;
  }
  return valor;
}

/** Descobre o host do projeto de origem olhando as URLs do proprio dump. */
function descobrirHostDeOrigem(registros) {
  for (const linhas of Object.values(registros)) {
    for (const linha of linhas) {
      const achado = JSON.stringify(linha).match(/https:\/\/([a-z0-9-]+\.supabase\.co)/i);
      if (achado) return achado[1];
    }
  }
  return null;
}

/** Troca os ids antigos pelos novos nas colunas que guardam usuario. */
function aplicarDePara(tabela, linhas, dePara) {
  const coluna = COLUNAS_DE_USUARIO[tabela];
  if (!coluna) return { linhas, orfas: 0 };

  const mantidas = [];
  let orfas = 0;

  for (const linha of linhas) {
    const antigo = linha[coluna];
    if (antigo === null || antigo === undefined) { mantidas.push(linha); continue; }

    const novo = dePara.get(antigo);
    if (!novo) {
      // Sem conta correspondente, a FK para auth.users derrubaria o INSERT.
      // Em audit_logs o id e so informativo, entao vale deixar em branco;
      // nas outras, a linha nao tem como existir.
      if (tabela === 'audit_logs') { mantidas.push({ ...linha, [coluna]: null }); continue; }
      orfas++;
      continue;
    }

    mantidas.push({ ...linha, [coluna]: novo });
  }

  return { linhas: mantidas, orfas };
}

async function restaurar() {
  const arquivoDados = backupMaisRecente('dados_backup_');
  const estrutura = arquivoDeEstrutura();
  const pastaFotos = pastaDeFotosMaisRecente();

  console.log('=== RESTAURACAO ===\n');
  console.log(`Dados     : ${arquivoDados}`);
  console.log(`Estrutura : ${estrutura.caminho}${estrutura.completo ? '' : '   (so tabelas e colunas)'}`);
  console.log(`Fotos     : ${pastaFotos || 'nenhuma pasta fotos_* encontrada'}`);

  if (!estrutura.completo) {
    console.log('\nAviso: esse arquivo de estrutura veio da funcao no banco, entao nao');
    console.log('traz politicas de seguranca, triggers nem indices. O projeto restaurado');
    console.log('subiria com as tabelas destrancadas. Rode `npm run backup` com o Docker');
    console.log('aberto para gerar um pgdump_schema_*.sql antes de restaurar de verdade.');
  }

  // A leitura vem antes de qualquer conexao: conferir se o backup esta
  // integro nao deveria exigir um projeto de destino.
  const registros = lerDump(arquivoDados);
  const total = Object.values(registros).reduce((s, l) => s + l.length, 0);
  console.log(`\nLidos ${total} registro(s) em ${Object.keys(registros).length} tabela(s):`);
  for (const tabela of TABELAS) {
    const n = registros[tabela]?.length || 0;
    if (n) console.log(`  ${tabela.padEnd(22)} ${String(n).padStart(4)}`);
  }

  if (somenteLer) {
    console.log('\nBackup lido sem erros. Nenhum banco foi acessado.');
    return true;
  }

  const destino = conectarDestino();
  console.log(`\nDestino   : ${process.env.RESTORE_SUPABASE_URL}`);
  console.log(confirmado ? 'Modo      : GRAVANDO\n' : 'Modo      : ensaio (nada sera gravado)\n');

  let faltando = await conferirEstrutura(destino);
  const precisaDeEstrutura = faltando.length > 0;

  if (!confirmado) {
    console.log('Ensaio - o que seria feito:');
    if (precisaDeEstrutura) {
      console.log(`  aplicar ${estrutura.caminho} no destino (${faltando.length} tabela(s) faltando)`);
    } else {
      console.log('  a estrutura ja existe no destino, nada a aplicar');
    }
    console.log(`  recriar ${registros.auth_users?.length || 0} conta(s) de login (senha "${SENHA_PROVISORIA}")`);
    for (const tabela of TABELAS) {
      const n = registros[tabela]?.length || 0;
      if (n) console.log(`  apagar e gravar ${String(n).padStart(4)} em ${tabela}`);
    }
    console.log(`  enviar as fotos de ${pastaFotos || '(nenhuma pasta encontrada)'}`);
    console.log('\nPara valer: npm run restaurar -- --confirmar');
    return true;
  }

  // 1) Estrutura: sem tabela nao ha onde gravar.
  console.log('1/4  Estrutura no destino...');
  if (!precisaDeEstrutura) {
    console.log('     ja existe, nada a aplicar');
  } else {
    const aplicada = aplicarEstruturaNoDestino(estrutura.caminho);

    if (!aplicada.ok) {
      console.log(`     nao consegui aplicar: ${aplicada.motivo}\n`);
      if (aplicada.configuravel) {
        console.log('  Para o script aplicar sozinho, ponha no .env a senha do banco do');
        console.log('  projeto de destino (Project Settings > Database > Reset database');
        console.log('  password):\n');
        console.log('    RESTORE_DB_PASSWORD=<senha do projeto novo>');
        console.log('    RESTORE_DB_HOST=<so se o projeto novo nao for sa-east-1>\n');
      }
      console.log(`  Ou faca a mao: abra o SQL Editor do destino e cole ${estrutura.caminho}`);
      console.log('  inteiro. Depois rode este script de novo.');
      return false;
    }

    faltando = await conferirEstrutura(destino);
    if (faltando.length > 0) {
      console.log(`     psql terminou sem erro, mas ainda faltam: ${faltando.join(', ')}`);
      return false;
    }
    console.log(`     ${TABELAS.length} tabela(s) criada(s) a partir de ${estrutura.caminho}`);
  }
  console.log('');

  // 2) Contas: os ids novos so existem depois disso.
  console.log('2/4  Recriando contas de login...');
  const { dePara, criadas, falhas } = await recriarContas(destino, registros.auth_users || []);
  console.log(`     ${criadas.length} criada(s), ${dePara.size} id(s) mapeado(s)`);
  falhas.forEach(f => console.log(`     FALHOU  ${f}`));

  // 3) Limpeza na ordem inversa (filho antes do pai), e gravacao logo apos.
  console.log('\n3/4  Limpando o destino...');
  for (const tabela of [...TABELAS].reverse()) {
    const { error } = await destino.from(tabela).delete().not('id', 'is', null);
    if (error && !/no rows/i.test(error.message)) console.log(`     aviso  ${tabela}: ${error.message}`);
  }

  // Gravacao na ordem direta, com os ids trocados e as URLs apontando
  // para o projeto novo.
  console.log('\n     Gravando os dados...');
  let problemas = 0;

  const hostAntigo = descobrirHostDeOrigem(registros);
  const hostNovo = new URL(process.env.RESTORE_SUPABASE_URL).host;
  if (hostAntigo && hostAntigo !== hostNovo) {
    console.log(`     URLs de fotos: ${hostAntigo} -> ${hostNovo}`);
  }

  for (const tabela of TABELAS) {
    const originais = registros[tabela];
    if (!originais || originais.length === 0) continue;

    let { linhas, orfas } = aplicarDePara(tabela, originais, dePara);
    if (orfas > 0) console.log(`     aviso  ${tabela}: ${orfas} linha(s) sem conta correspondente, deixadas de fora`);

    if (hostAntigo && hostAntigo !== hostNovo) {
      linhas = linhas.map(l => trocarHostDasUrls(l, hostAntigo, hostNovo));
    }

    // Em lotes: um INSERT unico com tudo estoura em tabelas grandes.
    for (let i = 0; i < linhas.length; i += 500) {
      const lote = linhas.slice(i, i + 500);
      const { error } = await destino.from(tabela).insert(lote);
      if (error) { console.log(`     FALHOU  ${tabela}: ${error.message}`); problemas++; break; }
    }

    console.log(`     ok      ${tabela.padEnd(22)} ${String(linhas.length).padStart(4)} registro(s)`);
  }

  // 4) Fotos por ultimo: as URLs ja estao no banco apontando para o projeto
  //    novo, agora os arquivos precisam existir la.
  console.log('\n4/4  Enviando as fotos...');
  let fotosOk = true;
  if (!pastaFotos) {
    console.log(`     nenhuma pasta fotos_* em ${pastaDeBackup()} - pulando`);
    console.log('     (rode `npm run backup` para gerar uma)');
  } else {
    fotosOk = restaurarFotos(pastaFotos);
  }

  console.log('\n=== RESUMO ===');
  console.log(problemas === 0 ? 'Dados restaurados.' : `${problemas} tabela(s) com falha.`);
  console.log(fotosOk ? 'Fotos enviadas.' : 'Fotos: houve falha no envio.');
  if (criadas.length > 0) {
    console.log(`\n${criadas.length} conta(s) recriada(s) com a senha provisoria "${SENHA_PROVISORIA}".`);
    console.log('Todas precisam trocar a senha:');
    criadas.forEach(e => console.log(`  ${e}`));
  }

  return problemas === 0 && fotosOk;
}

// Erro de configuracao e recado para quem chamou, nao defeito do programa:
// sai com a mensagem limpa, sem despejar a pilha de chamadas.
let ok = false;
try {
  ok = await restaurar();
} catch (err) {
  console.error(`\n${err.message}`);
  process.exit(1);
}
process.exit(ok ? 0 : 1);
