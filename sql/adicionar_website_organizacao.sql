-- ============================================================================
-- RODE ESTE ARQUIVO NO SQL Editor do Supabase (projeto CertificadoJoias).
--
-- Cria a coluna do site da joalheria.
--
-- POR QUE: a tela de Organizacoes ja oferece o campo "Site", ja procura por
-- ele na busca ("Buscar por nome, email, website ou responsavel...") e ja
-- conta quantas joalherias tem site. So a coluna nunca existiu - entao quem
-- preenchia o campo via o valor ser descartado em silencio. Pior: antes de
-- 2026-10-03 a API tentava gravar assim mesmo, e preencher o site derrubava o
-- salvamento inteiro com "column does not exist".
--
-- Seguro para re-executar.
--
-- NAO se cria coluna para `country` de proposito. Ele existia so no codigo,
-- nascia fixo em 'BR' e nunca teve campo na tela - guardar isso seria gravar
-- o mesmo valor para todos, para sempre, sem ninguem poder mudar. As mencoes
-- foram removidas. Se um dia houver joalheria fora do Brasil, cria-se a coluna
-- junto com a tela.
-- ============================================================================

alter table public.organizations
  add column if not exists website text;

comment on column public.organizations.website is
  'Site da joalheria. Aparece na busca e na contagem da tela de Organizacoes.';
