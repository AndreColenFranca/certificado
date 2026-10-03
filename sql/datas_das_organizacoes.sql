-- ============================================================================
-- RODE ESTE ARQUIVO NO SQL Editor do Supabase (projeto CertificadoJoias).
--
-- Da valor padrao as datas de `organizations`.
--
-- POR QUE: as colunas created_at/updated_at nao tinham DEFAULT, e a rota de
-- criacao tambem nao as preenchia. Toda joalheria criada pelo aplicativo
-- nascia com data nula, e a tela de Organizacoes omitia a linha "Criado:" so
-- para elas - as duas antigas mostravam data porque vieram de semente, com
-- valor explicito.
--
-- A rota ja foi corrigida para gravar as duas. O DEFAULT aqui e a segunda
-- tranca: qualquer outro caminho que insira uma organizacao (um script, uma
-- carga, uma rota futura) passa a ter data sem precisar lembrar.
--
-- Seguro para re-executar.
-- ============================================================================

alter table public.organizations
  alter column created_at set default now(),
  alter column updated_at set default now();
