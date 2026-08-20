-- Backfill de user_orgs, e o papel passa a se chamar 'customer'.
--
-- Duas coisas num arquivo so porque uma sem a outra deixa o dado inconsistente:
-- nao adianta gravar 'customer' nos vinculos novos e deixar 'member' nos velhos.
--
-- 1) BACKFILL
-- Quando a multi-tenancy entrou (5d00728, 2026-08-19), passou a ser `user_orgs`
-- quem responde de quais joalherias um cliente e cliente. Os clientes que ja
-- existiam nunca ganharam essa linha: em 2026-08-20, 6 dos 7 estavam sem ela.
-- Isso nao quebra o login - ele cai no `auth_users.org_id` quando nao acha
-- vinculo - mas trava o cadastro numa segunda joalheria, porque o cabecalho
-- `X-Org-Id` so e aceito depois de conferido em `user_orgs`.
--
-- Cada cliente e vinculado a joalheria que ja esta em `auth_users.org_id`, que
-- e a dele hoje. Nada muda de lugar; o que existia continua onde estava.
--
-- 2) 'member' -> 'customer'
-- So cliente entra em `user_orgs`; staff nunca. Chamar o papel de 'member'
-- sugeria uma distincao que nao existe. Nenhum codigo le esse campo para
-- decidir nada - ele e selecionado no login mas so o `org_id` e usado - entao
-- a troca e de nomenclatura, sem efeito em comportamento.
--
-- Idempotente: pode rodar de novo sem efeito.

BEGIN;

-- O DEFAULT vem antes do resto: assim qualquer linha criada daqui em diante
-- ja nasce certa, mesmo vinda de codigo que nao informa o papel.
ALTER TABLE user_orgs ALTER COLUMN role SET DEFAULT 'customer';

UPDATE user_orgs SET role = 'customer', updated_at = now()
WHERE role = 'member';

INSERT INTO user_orgs (user_id, org_id, role, created_at, updated_at)
SELECT au.id, au.org_id, 'customer', now(), now()
FROM auth_users au
JOIN auth.users u ON u.id = au.id   -- evita violar a FK se sobrar perfil sem conta
WHERE au.role = 'customer'
  AND au.org_id IS NOT NULL
ON CONFLICT (user_id, org_id) DO NOTHING;

COMMIT;

-- Conferencia: todo cliente com vinculo preenchido, e nenhum 'member' restante.
SELECT au.email, o.name AS joalheria, uo.role AS vinculo
FROM auth_users au
LEFT JOIN organizations o ON o.id = au.org_id
LEFT JOIN user_orgs uo ON uo.user_id = au.id AND uo.org_id = au.org_id
WHERE au.role = 'customer'
ORDER BY au.email;
