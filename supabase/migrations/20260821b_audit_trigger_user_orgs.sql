-- ETAPA 2 de 2 — auditar `user_orgs`.
--
-- SO RODE DEPOIS da etapa 1 (20260821a_audit_func_tolerante.sql) e depois de
-- confirmar, cadastrando um cliente pela tela, que as tabelas de sempre
-- continuam registrando com `record_id` preenchido. Rodar esta antes da
-- etapa 1 quebra o cadastro de cliente em silencio.
--
-- A guarda abaixo faz essa verificacao e interrompe se a etapa 1 nao rodou.
--
-- POR QUE
-- `user_orgs` e quem responde de quais joalherias um cliente e cliente, e e a
-- unica das cinco tabelas do fluxo sem auditoria: nasceu com a multi-tenancy
-- em 2026-08-19, depois de os outros triggers terem sido criados.
--
-- O ponto cego e concreto: o cadastro de cliente trata falha ao gravar em
-- `user_orgs` como aviso e devolve 201 assim mesmo. Sem auditoria, um vinculo
-- que nao nasce nao deixa rastro em lugar nenhum — nem erro na tela, nem
-- linha no log. Foi um silencio dessa familia que deixou 6 clientes sem
-- vinculo ate o backfill de 2026-08-20.
--
-- Em `user_orgs` o `record_id` gravado sera o `user_id`, pela reserva que a
-- etapa 1 acrescentou. E o identificador certo: diz de quem e o vinculo, e a
-- joalheria ja vai na coluna `org_id` do proprio audit_logs.
--
-- EFEITO COLATERAL, de proposito
-- Cadastrar um cliente passa a gravar 3 linhas de auditoria em vez de 2. Como
-- `limpar_audit_logs()` mantem apenas as 10 linhas mais recentes do sistema
-- inteiro, o log passa a reciclar cerca de 50% mais rapido. Nao quebra nada,
-- mas encurta ainda mais um historico que ja e curto — ver a nota no fim.
--
-- ROLLBACK
--   DROP TRIGGER audit_user_orgs_trigger ON public.user_orgs;

DO $$
DECLARE
  corpo text;
BEGIN
  SELECT prosrc INTO corpo FROM pg_proc WHERE proname = 'audit_trigger_func';

  IF corpo IS NULL OR corpo NOT LIKE '%to_jsonb(NEW) ->> ''id''%' THEN
    RAISE EXCEPTION
      'A etapa 1 nao foi aplicada. Rode 20260821a_audit_func_tolerante.sql antes: sem ela este trigger quebra toda insercao em user_orgs, e o cadastro de cliente falha em silencio.';
  END IF;
END $$;

-- Mesmo formato dos outros quatro: AFTER, os tres eventos, FOR EACH ROW.
-- O nome segue a convencao `audit_<tabela>_trigger`.
DROP TRIGGER IF EXISTS audit_user_orgs_trigger ON public.user_orgs;

CREATE TRIGGER audit_user_orgs_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.user_orgs
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Conferencia: as cinco tabelas do fluxo, com um trigger de auditoria cada.
SELECT c.relname AS tabela, count(*) AS qtd, string_agg(t.tgname, ', ' ORDER BY t.tgname) AS triggers
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE NOT t.tgisinternal AND n.nspname = 'public'
GROUP BY c.relname
ORDER BY c.relname;

-- TESTE, pela tela: cadastre um cliente. `audit_logs` deve ganhar TRES linhas
-- (customers, auth_users e user_orgs), a de user_orgs com `record_id` igual ao
-- id do usuario. Se o cadastro passar mas a linha de user_orgs nao aparecer,
-- confira se o vinculo foi mesmo criado antes de concluir qualquer coisa.

-- NOTA, para quando quiser auditoria de verdade: hoje `limpar_audit_logs()`
-- roda a cada insercao e guarda so as 10 linhas mais recentes do sistema
-- inteiro. Isso torna a tabela um buffer de depuracao, nao um historico. Uma
-- janela por tempo seria mais util, algo como:
--   DELETE FROM audit_logs WHERE created_at < now() - interval '90 days';
-- Fica de sugestao; esta migration nao mexe nisso.
