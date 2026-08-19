-- ============================================================================
-- RODE ESTE ARQUIVO NO SQL Editor do Supabase (projeto CertificadoJoias).
--
-- Cria/atualiza public.estrutura_do_banco(), que devolve o DDL do schema
-- public como texto. Com ela, o `npm run backup` gera a estrutura usando a
-- SERVICE_ROLE_KEY, sem depender de Docker nem da senha do banco.
--
-- Cobre: extensoes, sequencias, tabelas (colunas, defaults, constraints,
--        indices), politicas de RLS, funcoes, triggers e grants.
--
-- Seguranca: SOMENTE LEITURA (le apenas o catalogo do Postgres). O acesso e
-- revogado de anon e authenticated no final - so a service_role chama.
-- ============================================================================

create or replace function public.estrutura_do_banco()
returns text
language plpgsql
security definer
stable
set search_path = pg_catalog, public
as $func$
declare
  saida text := '';
  bloco text;
begin
  saida := '-- Estrutura do banco (schema public)' || E'\n'
        || '-- Gerado em: ' || now()::text || E'\n';

  -- ---------------------------------------------------------------- extensoes
  select string_agg('create extension if not exists ' || quote_ident(e.extname)
                    || ' with schema ' || quote_ident(n.nspname) || ';',
                    E'\n' order by e.extname)
    into bloco
  from pg_extension e
  join pg_namespace n on n.oid = e.extnamespace;

  if bloco is not null then
    saida := saida || E'\n-- ===== EXTENSOES =====\n' || bloco || E'\n';
  end if;

  -- --------------------------------------------------------------- sequencias
  select string_agg('create sequence if not exists ' || quote_ident(c.relname)
                    || ' as ' || format_type(s.seqtypid, null)
                    || ' increment by ' || s.seqincrement
                    || ' start with ' || s.seqstart || ';',
                    E'\n' order by c.relname)
    into bloco
  from pg_sequence s
  join pg_class c on c.oid = s.seqrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public';

  if bloco is not null then
    saida := saida || E'\n-- ===== SEQUENCIAS =====\n' || bloco || E'\n';
  end if;

  -- ------------------------------------------------------------------ tabelas
  select string_agg(corpo, E'\n' order by relname) into bloco
  from (
    select c.relname,
      '-- =====================================================' || E'\n'
      || '-- Tabela: ' || c.relname || E'\n'
      || '-- =====================================================' || E'\n'
      || 'create table if not exists ' || quote_ident(c.relname) || ' (' || E'\n'
      || (select string_agg('    ' || quote_ident(a.attname)
                            || ' ' || format_type(a.atttypid, a.atttypmod)
                            || coalesce(' default ' || pg_get_expr(d.adbin, d.adrelid), '')
                            || case when a.attnotnull then ' not null' else '' end,
                            E',\n' order by a.attnum)
          from pg_attribute a
          left join pg_attrdef d on d.adrelid = c.oid and d.adnum = a.attnum
          where a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped)
      || E'\n);\n'
      || coalesce(E'\n' || (select string_agg('alter table ' || quote_ident(c.relname)
                                   || ' add constraint ' || quote_ident(con.conname)
                                   || ' ' || pg_get_constraintdef(con.oid) || ';',
                                   E'\n' order by con.contype desc, con.conname)
                            from pg_constraint con where con.conrelid = c.oid) || E'\n', '')
      || coalesce(E'\n' || (select string_agg(pg_get_indexdef(i.indexrelid) || ';',
                                   E'\n' order by i.indexrelid::regclass::text)
                            from pg_index i where i.indrelid = c.oid and not i.indisprimary) || E'\n', '')
      || coalesce(E'\n' || 'alter table ' || quote_ident(c.relname)
                        || ' enable row level security;' || E'\n'
                        || (select string_agg('create policy ' || quote_ident(p.polname)
                                   || ' on ' || quote_ident(c.relname)
                                   || ' for ' || case p.polcmd when 'r' then 'select'
                                                               when 'a' then 'insert'
                                                               when 'w' then 'update'
                                                               when 'd' then 'delete'
                                                               else 'all' end
                                   || coalesce(' using (' || pg_get_expr(p.polqual, p.polrelid) || ')', '')
                                   || coalesce(' with check (' || pg_get_expr(p.polwithcheck, p.polrelid) || ')', '')
                                   || ';', E'\n' order by p.polname)
                            from pg_policy p where p.polrelid = c.oid) || E'\n', '')
      as corpo
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
  ) t;

  if bloco is not null then
    saida := saida || E'\n' || bloco;
  end if;

  -- ------------------------------------------------------------------ funcoes
  select string_agg(pg_get_functiondef(p.oid) || ';', E'\n\n' order by p.proname)
    into bloco
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.prokind = 'f';

  if bloco is not null then
    saida := saida || E'\n-- ===== FUNCOES =====\n' || bloco || E'\n';
  end if;

  -- ----------------------------------------------------------------- triggers
  select string_agg(pg_get_triggerdef(t.oid) || ';', E'\n' order by t.tgname)
    into bloco
  from pg_trigger t
  join pg_class c on c.oid = t.tgrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and not t.tgisinternal;

  if bloco is not null then
    saida := saida || E'\n-- ===== TRIGGERS =====\n' || bloco || E'\n';
  end if;

  -- ------------------------------------------------------------------- grants
  select string_agg('grant ' || g.privilege_type || ' on ' || quote_ident(g.table_name)
                    || ' to ' || quote_ident(g.grantee) || ';',
                    E'\n' order by g.table_name, g.grantee, g.privilege_type)
    into bloco
  from information_schema.role_table_grants g
  where g.table_schema = 'public';

  if bloco is not null then
    saida := saida || E'\n-- ===== GRANTS (TABELAS) =====\n' || bloco || E'\n';
  end if;

  -- ------------------------------------------------- grants de funcoes
  -- O padrao do Postgres e conceder execute a PUBLIC. Sem o revoke abaixo,
  -- restaurar este dump devolveria funcoes abertas a quem tem a chave anon,
  -- mesmo que hoje estejam trancadas.
  select string_agg('revoke all on function ' || quote_ident(p.proname)
                    || '() from public, anon, authenticated;'
                    || coalesce(E'\n' || (
                         select string_agg('grant ' || r.privilege_type
                                           || ' on function ' || quote_ident(p.proname)
                                           || '() to ' || quote_ident(r.grantee) || ';',
                                           E'\n' order by r.grantee)
                         from information_schema.role_routine_grants r
                         where r.routine_schema = 'public'
                           and r.routine_name = p.proname
                           and r.grantee not in ('PUBLIC', 'anon', 'authenticated')
                       ), ''),
                    E'\n' order by p.proname)
    into bloco
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.prokind = 'f';

  if bloco is not null then
    saida := saida || E'\n-- ===== GRANTS (FUNCOES) =====\n' || bloco || E'\n';
  end if;

  return saida;
end;
$func$;

-- Somente a service_role pode chamar. Sem isso, qualquer um com a chave
-- publica (anon) conseguiria ler a estrutura do banco.
revoke all on function public.estrutura_do_banco() from public, anon, authenticated;
grant execute on function public.estrutura_do_banco() to service_role;
