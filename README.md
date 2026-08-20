# Certificado de Joias

Sistema de certificados de joias, com Supabase (banco, autenticação e storage de
imagens) e front-end em React.

Este arquivo é o manual de operação: como salvar os dados e como trazê-los de
volta. Não depende de nenhuma ferramenta além do que está listado abaixo.

---

## O que você precisa antes

| | Para quê |
|---|---|
| **Node.js** | Rodar os scripts. `npm install` uma vez, numa máquina nova. |
| **Docker Desktop aberto** | O `pg_dump` e o `psql` rodam dentro de um container. Sem ele o backup fica incompleto e o restore não cria as tabelas. |
| **Arquivo `.env`** | As chaves de acesso ao Supabase. **Não está no git** — veja o aviso no fim. |

Os comandos rodam no terminal, na pasta do projeto. No Windows, use o **Git
Bash** (botão direito dentro da pasta → *Open Git Bash here*).

---

## Backup

```
npm run backup
```

Um comando, três etapas, tudo gravado em `~/Downloads/certificado-backups/`:

| Etapa | Arquivo gerado | De onde vem |
|---|---|---|
| Estrutura | `pgdump_schema_<data>.sql` | `pg_dump`, num container |
| Dados | `dados_backup_<data>.sql` | API do Supabase, como `INSERT` |
| Fotos | `fotos_<data>/` | os três buckets de storage |

A estrutura sai completa: tabelas, constraints, índices, políticas de segurança
(RLS), triggers e funções.

**Se o Docker estiver fechado**, a primeira etapa cai sozinha para uma função
dentro do banco e gera um `estrutura_<data>.sql` que só tem tabelas e colunas.
O backup continua servindo para consulta, mas **não serve para restaurar** — um
projeto criado a partir dele sobe com as tabelas destrancadas, sem separação
entre organizações. O script avisa na tela e no resumo. Abra o Docker e rode de
novo.

### Por que os dados não saem pelo `pg_dump` também

Sairiam, mas no formato `COPY`, e o `restaurar-completo.js` só lê `INSERT` — e
ele precisa ler, porque é quem refaz os identificadores das contas recriadas.
Um dump de dados do `pg_dump` também não pode ser aplicado num projeto novo: os
identificadores vêm fixos e esbarram na chave estrangeira para `auth.users`.

Daí a divisão de trabalho: **o `pg_dump` entrega a estrutura, a API entrega os
dados.**

---

## Restauração

Sempre num projeto Supabase **novo e vazio**. O restore começa apagando todas as
tabelas do destino, e o script recusa rodar se o destino for o mesmo projeto do
`.env`.

### 1. Criar o projeto novo (no painel do Supabase)

Em *Project Settings → API*, anote a URL e a chave `service_role`.
Em *Project Settings → Database*, clique em **Reset database password** e guarde
a senha — é ela que permite ao script criar as tabelas sozinho.

### 2. Criar os três buckets (no painel, em Storage)

- `certificates-public` — marcado como **público**
- `certificates-private`
- `logos`

O envio das fotos não cria bucket, só preenche.

### 3. Apontar para o destino

No `.env` (há um bloco comentado no fim do arquivo com esses nomes):

```
RESTORE_SUPABASE_URL=https://<projeto-novo>.supabase.co
RESTORE_SUPABASE_SERVICE_ROLE_KEY=<service_role do projeto novo>
RESTORE_DB_PASSWORD=<senha do banco do projeto novo>
RESTORE_DB_HOST=<opcional; só se o projeto novo não for sa-east-1>
```

São variáveis separadas das de produção de propósito: apontar para o projeto
real por engano apagaria tudo.

### 4. Conferir, ensaiar, restaurar

```
npm run restaurar -- --ler        # só lê os arquivos; não acessa banco nenhum
npm run restaurar                 # ensaio: mostra o que faria, sem gravar
npm run restaurar -- --confirmar  # grava para valer
```

Os quatro hifens são dois pares: o `--` avisa o npm que o resto é para o script,
e o `--ler` é a opção em si. **Sem o primeiro par o npm engole a opção** e você
cai no ensaio sem perceber.

O `--confirmar` faz quatro etapas em sequência: cria a estrutura no destino,
recria as contas de login, grava os dados e envia as fotos. Ele acerta sozinho
duas coisas que uma restauração manual erra — as referências às contas, que
ganham identificadores novos, e o endereço do projeto dentro das URLs das fotos.

Sem `RESTORE_DB_PASSWORD` no `.env`, ele para na primeira etapa e explica como
colar o SQL à mão no SQL Editor.

### 5. Trocar as senhas (no painel)

Todas as contas voltam com a senha provisória `TrocarSenha!2026`. O script lista
quem foi recriado ao terminar.

---

## Todos os comandos

| Comando | O que faz | Risco |
|---|---|---|
| `npm run backup` | Salva estrutura, dados e fotos | só lê |
| `npm run backup-fotos` | Só as imagens | só lê |
| `npm run faxina-fotos` | Lista fotos órfãs no bucket (simulação) | só lê |
| `npm run faxina-fotos -- --apagar` | Apaga as órfãs de verdade | apaga arquivos |
| `npm run restaurar -- --ler` | Confere se o backup está legível | só lê |
| `npm run restaurar` | Ensaio: mostra o que faria | só lê |
| `npm run restaurar -- --confirmar` | Restaura tudo no destino | **apaga o destino** |
| `npm run restaurar-fotos -- <pasta>` | Repõe fotos no projeto do `.env` | escreve |
| `npm run lint` | Checagem de tipos; deve sair sem erro | só lê |

---

## O que o backup não cobre

- **As senhas.** Ficam no schema `auth` do Supabase, que nenhum backup daqui
  exporta. As contas são recriadas com senha provisória.
- **Criar o projeto e os buckets.** São ações de painel, sem equivalente em
  comando.

---

## Avisos

**Os backups são gravados fora do repositório**, em
`~/Downloads/certificado-backups/`, justamente para não haver como commitá-los
por engano. Para mudar o destino, defina `BACKUP_DIR` no `.env` — não mexa em
código. O caminho fica centralizado em `backup-dir.js`.

Cuidado ao escolher: **o `Downloads` não é sincronizado com nuvem nenhuma**, e
costuma ser a primeira pasta que se esvazia quando falta espaço. Se quiser uma
cópia fora da máquina, aponte `BACKUP_DIR` para dentro do OneDrive.

Isso já deu problema duas vezes, e as duas por o backup gravar dentro de pasta
versionada: 12 fotos de clientes foram parar num commit enquanto o repositório
era público, e o `.env.production` — com a chave `service_role` — ficou
commitado por cinco dias. Nos dois casos o histórico teve de ser reescrito. O
repositório é privado desde então.

**Se algum dia um arquivo sensível entrar mesmo assim**, o `.gitignore` não
resolve: ele só vale para arquivos que ainda não foram rastreados. É preciso
remover do histórico e reescrever. Antes de commitar qualquer coisa nova,
confirme com:

```
git check-ignore -v <arquivo>
```

**O `.env` é o ponto único de falha.** Ele não está no git e existe só nesta
máquina, sincronizado pelo OneDrive. Sem ele, nenhum comando funciona — nem o
backup, nem o restore. Guarde uma cópia num gerenciador de senhas.

Se perdê-lo e o projeto Supabase ainda existir, dá para reconstruí-lo pelo
painel: a `service_role` está em *Project Settings → API* e a senha do banco se
reseta em *Project Settings → Database*.

**Uma restauração completa nunca foi testada de ponta a ponta.** O procedimento
acima é plausível, não comprovado. Um backup que nunca foi restaurado é uma
suposição — vale testar num projeto descartável antes de precisar.

---

## Detalhe de conexão

A conexão direta ao banco (`db.<projeto>.supabase.co`) só existe em IPv6, e nem
toda rede tem. Por isso tanto o `pg_dump` quanto o `psql` vão pelo **session
pooler**, na porta **5432**:

```
-h aws-0-<região>.pooler.supabase.com -p 5432 -U postgres.<project-ref>
```

O `<project-ref>` é o subdomínio da sua `SUPABASE_URL`. A porta 6543 é
*transaction mode* e **não serve** — nem para o dump, nem para aplicar um script
inteiro. A senha vai pela variável `PGPASSWORD`, e não embutida na URL, para não
depender de codificação quando ela tiver caractere especial.
