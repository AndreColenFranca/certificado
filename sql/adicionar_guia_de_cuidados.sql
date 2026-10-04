-- ============================================================================
-- RODE ESTE ARQUIVO NO SQL Editor do Supabase (projeto CertificadoJoias).
--
-- Guia de cuidados por joalheria, nos mesmos moldes do termo de garantia.
--
-- POR QUE: a aba "Manual de Cuidados" do passaporte publico era ~190 linhas
-- de texto escritas dentro do JSX (CertificatePublicView), e citavam a loja
-- pelo nome: "As joias da Estilo Raro sao feitas para durar a vida toda...".
-- Quem abrisse o passaporte de uma peca da Vivara lia que quem cuida dela e a
-- Estilo Raro. Mesmo defeito do termo de garantia, com o agravante de nem
-- estar num campo editavel.
--
-- DUAS COLUNAS, pelo mesmo motivo que a garantia tem duas:
--
--   organizations.care_guide_default      o padrao da loja, editavel na tela
--                                         de Organizacoes
--   jewelry_certificates.care_guide_terms a copia que a peca leva na emissao
--
-- A copia na peca nao e redundancia: o passaporte publico e aberto por quem
-- nao esta logado, e nessa situacao o aplicativo nao busca a organizacao - so
-- tem o certificado em maos. Sem a copia, o visitante nao veria guia nenhum.
--
-- NAO se usa a coluna `care_guide` (jsonb) que ja existe: ela nunca foi
-- gravada pela API, esta vazia nos 12 certificados e nenhuma tela a lia. O
-- codigo que a preenchia foi removido.
--
-- Seguro para re-executar.
-- ============================================================================

alter table public.organizations
  add column if not exists care_guide_default text;

alter table public.jewelry_certificates
  add column if not exists care_guide_terms text;

comment on column public.organizations.care_guide_default is
  'Manual de cuidados padrao desta joalheria. Preenche o campo do certificado '
  'na emissao; cada peca pode ajustar o seu.';

comment on column public.jewelry_certificates.care_guide_terms is
  'Manual de cuidados desta peca, copiado do padrao da joalheria na emissao. '
  'Mesmo formato do termo de garantia: **negrito**, - item, [icon:nome].';
