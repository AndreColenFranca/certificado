-- Remove o trigger de auditoria duplicado em `customers`.
--
-- A tabela tinha DOIS triggers idênticos gravando em `audit_logs`:
--
--   CREATE TRIGGER audit_customers_trigger AFTER INSERT OR DELETE OR UPDATE
--     ON public.customers FOR EACH ROW EXECUTE FUNCTION audit_trigger_func()
--   CREATE TRIGGER audit_trigger           AFTER INSERT OR DELETE OR UPDATE
--     ON public.customers FOR EACH ROW EXECUTE FUNCTION audit_trigger_func()
--
-- Mesmo momento, mesmos eventos, mesmo nível, mesma função — só o nome muda.
-- Por isso todo evento de cliente virava duas linhas de auditoria: em
-- 2026-08-21, as 6 linhas de `customers` eram 3 eventos reais gravados em
-- dobro. Nenhuma outra tabela tem isso; as outras quatro têm um trigger só.
--
-- Fica o `audit_customers_trigger`, que segue o padrão de nome das demais
-- (`audit_auth_users_trigger`, `audit_jewelry_certificates_trigger`,
-- `audit_maintenance_records_trigger`). Sai o `audit_trigger`, de nome
-- genérico e provavelmente o primeiro, criado antes de a convenção existir.
--
-- Reversível: para desfazer, basta recriar o trigger com o CREATE acima.
-- Nenhuma auditoria se perde — o que sobra registra exatamente o mesmo.

BEGIN;

DROP TRIGGER IF EXISTS audit_trigger ON public.customers;

-- Limpa as duplicatas que o trigger extra já gravou.
--
-- Cada par tem `record_id`, `operation` e `created_at` idênticos, porque as
-- duas linhas nascem da mesma transação. Mantém a de menor `id` e apaga a
-- outra; qual das duas fica não importa, o conteúdo é o mesmo.
DELETE FROM audit_logs a
USING audit_logs b
WHERE a.table_name = 'customers'
  AND b.table_name = 'customers'
  AND a.record_id  = b.record_id
  AND a.operation  = b.operation
  AND a.created_at = b.created_at
  AND a.id > b.id;

COMMIT;

-- Conferência 1: deve sobrar um trigger por tabela.
SELECT c.relname AS tabela, count(*) AS triggers, string_agg(t.tgname, ', ') AS nomes
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE NOT t.tgisinternal AND n.nspname = 'public'
GROUP BY c.relname
ORDER BY c.relname;

-- Conferência 2: nenhum par duplicado deve restar.
SELECT count(*) AS pares_duplicados_restantes FROM (
  SELECT record_id, operation, created_at
  FROM audit_logs
  WHERE table_name = 'customers'
  GROUP BY record_id, operation, created_at
  HAVING count(*) > 1
) x;
