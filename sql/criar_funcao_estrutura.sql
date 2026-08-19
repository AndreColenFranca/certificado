-- ============================================================================
-- RODE ESTE ARQUIVO UMA VEZ no SQL Editor do Supabase (projeto CertificadoJoias).
--
-- Ele cria a funcao public.estrutura_do_banco(), que devolve o DDL do schema
-- public como texto. Com ela, o `npm run backup` passa a gerar a estrutura
-- usando a SERVICE_ROLE_KEY, sem depender de Docker nem da senha do banco.
--
-- Seguranca: a funcao e SOMENTE LEITURA (le apenas o catalogo do Postgres) e o
-- acesso e revogado de anon e authenticated no final - so a service_role chama.
-- ============================================================================

create or replace function public.estrutura_do_banco()
returns text
language sql
security definer
stable
set search_path = pg_catalog, public
as $$
  with tabelas as (
    select c.oid, c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
  ),
  colunas as (
    select t.oid, t.relname,
      string_agg(
        '    ' || quote_ident(a.attname)
        || ' ' || format_type(a.atttypid, a.atttypmod)
        || coalesce(' default ' || pg_get_expr(d.adbin, d.adrelid), '')
        || case when a.attnotnull then ' not null' else '' end,
        E',\n' order by a.attnum
      ) as defs
    from tabelas t
    join pg_attribute a on a.attrelid = t.oid and a.attnum > 0 and not a.attisdropped
    left join pg_attrdef d on d.adrelid = t.oid and d.adnum = a.attnum
    group by t.oid, t.relname
  ),
  restricoes as (
    select t.oid,
      string_agg('alter table ' || quote_ident(t.relname)
                 || ' add constraint ' || quote_ident(con.conname)
                 || ' ' || pg_get_constraintdef(con.oid) || ';',
                 E'\n' order by con.contype desc, con.conname) as defs
    from tabelas t
    join pg_constraint con on con.conrelid = t.oid
    group by t.oid
  ),
  indices as (
    select t.oid,
      string_agg(pg_get_indexdef(i.indexrelid) || ';', E'\n' order by i.indexrelid::regclass::text) as defs
    from tabelas t
    join pg_index i on i.indrelid = t.oid
    where not i.indisprimary
    group by t.oid
  ),
  politicas as (
    select t.oid,
      string_agg('-- policy ' || p.polname || ' em ' || t.relname, E'\n' order by p.polname) as nomes,
      string_agg(
        'create policy ' || quote_ident(p.polname) || ' on ' || quote_ident(t.relname)
        || ' for ' || case p.polcmd when 'r' then 'select' when 'a' then 'insert'
                                    when 'w' then 'update' when 'd' then 'delete'
                                    else 'all' end
        || coalesce(' using (' || pg_get_expr(p.polqual, p.polrelid) || ')', '')
        || coalesce(' with check (' || pg_get_expr(p.polwithcheck, p.polrelid) || ')', '')
        || ';',
        E'\n' order by p.polname) as defs
    from tabelas t
    join pg_policy p on p.polrelid = t.oid
    group by t.oid
  )
  select '-- Estrutura do banco (schema public)' || E'\n'
      || '-- Gerado em: ' || now()::text || E'\n\n'
      || string_agg(
           '-- =====================================================' || E'\n'
           || '-- Tabela: ' || t.relname || E'\n'
           || '-- =====================================================' || E'\n'
           || 'create table if not exists ' || quote_ident(t.relname) || ' (' || E'\n'
           || col.defs || E'\n);' || E'\n'
           || coalesce(E'\n' || r.defs || E'\n', '')
           || coalesce(E'\n' || i.defs || E'\n', '')
           || case when pol.defs is not null
                   then E'\n' || 'alter table ' || quote_ident(t.relname)
                        || ' enable row level security;' || E'\n' || pol.defs || E'\n'
                   else '' end,
           E'\n' order by t.relname)
  from tabelas t
  join colunas col on col.oid = t.oid
  left join restricoes r on r.oid = t.oid
  left join indices i on i.oid = t.oid
  left join politicas pol on pol.oid = t.oid;
$$;

-- Somente a service_role pode chamar. Sem isso, qualquer um com a chave
-- publica (anon) conseguiria ler a estrutura do banco.
revoke all on function public.estrutura_do_banco() from public, anon, authenticated;
grant execute on function public.estrutura_do_banco() to service_role;
