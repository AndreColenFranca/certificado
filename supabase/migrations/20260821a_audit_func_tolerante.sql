-- ETAPA 1 de 2 — tornar audit_trigger_func() tolerante a tabela sem `id`.
--
-- NAO adiciona trigger nenhum. Depois de rodar esta, confira as tabelas atuais
-- (a conferencia no fim faz isso) e so entao rode a etapa 2.
--
-- POR QUE
-- A funcao monta `record_id` com `COALESCE(NEW.id, OLD.id)`. Toda tabela
-- auditada hoje tem coluna `id`, entao funciona. `user_orgs` nao tem: a chave
-- e composta (user_id + org_id). Ligar o trigger nela como esta faria a funcao
-- estourar em toda insercao — e o cadastro de cliente trata falha em
-- `user_orgs` como simples aviso, devolvendo 201 de sucesso sem criar o
-- vinculo. A quebra seria silenciosa, que e o pior formato.
--
-- O QUE MUDA
-- `NEW.id` estoura quando a coluna nao existe. `to_jsonb(NEW) ->> 'id'`
-- devolve nulo. Dai o `user_id` como reserva, para `user_orgs` ter o que
-- gravar em `record_id`.
--
-- Nas quatro tabelas que ja funcionam o resultado e identico: `id`,
-- `record_id`, `user_id` e `org_id` sao todos `uuid` (conferido em
-- information_schema), e o COALESCE continua tentando `id` primeiro.
--
-- CUIDADOS EMBUTIDOS
-- - SECURITY DEFINER repetido. CREATE OR REPLACE nao herda atributos: omitir
--   rebaixaria para SECURITY INVOKER em silencio, e a auditoria das quatro
--   tabelas passaria a rodar com a permissao de quem dispara.
-- - CREATE OR REPLACE mantem o mesmo OID, entao os triggers existentes
--   continuam apontando para ela. Nao e preciso recria-los.
-- - Em DELETE o NEW e nulo e em INSERT o OLD e nulo; `to_jsonb` de nulo e
--   nulo, e o COALESCE segue adiante sem erro.
--
-- ROLLBACK
-- Trocar as quatro linhas do COALESCE de volta por `COALESCE(NEW.id, OLD.id)`.
-- Nada mais muda.

CREATE OR REPLACE FUNCTION public.audit_trigger_func()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO audit_logs (org_id, table_name, operation, record_id, user_id, user_email, old_values, new_values, created_at)
  VALUES (
    COALESCE(NEW.org_id, OLD.org_id, '550e8400-e29b-41d4-a716-446655440000'),
    TG_TABLE_NAME,
    TG_OP,
    COALESCE(
      (to_jsonb(NEW) ->> 'id')::uuid,
      (to_jsonb(OLD) ->> 'id')::uuid,
      (to_jsonb(NEW) ->> 'user_id')::uuid,
      (to_jsonb(OLD) ->> 'user_id')::uuid
    ),
    (auth.jwt() ->> 'sub')::uuid,
    (auth.jwt() ->> 'email'),
    CASE WHEN TG_OP IN ('DELETE', 'UPDATE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    now()
  );
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Conferencia 1: a funcao continua SECURITY DEFINER e dona do mesmo OID.
SELECT p.proname, p.prosecdef AS security_definer, p.oid AS oid_da_funcao,
       pg_get_userbyid(p.proowner) AS dono
FROM pg_proc p WHERE p.proname = 'audit_trigger_func';

-- Conferencia 2: os triggers existentes continuam apontando para ela.
SELECT c.relname AS tabela, t.tgname AS trigger
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_proc p ON p.oid = t.tgfoid
WHERE NOT t.tgisinternal AND p.proname = 'audit_trigger_func'
ORDER BY c.relname;

-- DEPOIS DE RODAR ESTA ETAPA, faca um teste pela tela antes da etapa 2:
-- cadastre um cliente e confirme que `audit_logs` ganhou as DUAS linhas de
-- sempre (customers e auth_users), com `record_id` preenchido. Se vier nulo
-- ou nao vier linha, pare e faca o rollback.
