-- ============================================================================
-- RODE ESTE ARQUIVO NO SQL Editor do Supabase (projeto CertificadoJoias).
--
-- Cria a coluna do termo de garantia padrao da joalheria.
--
-- POR QUE: o texto de garantia que vai em cada certificado nascia chumbado no
-- codigo (CertificateFormModal.tsx, em duas copias de 35 linhas) e citava
-- "Estilo Raro Joias" por extenso. Resultado: toda peca emitida por qualquer
-- loja prometia garantia em nome dela - inclusive as 5 da Vivara. Nao e so
-- identidade visual: e a promessa legal que o cliente final le no passaporte.
--
-- Com esta coluna, cada joalheria escreve o proprio termo na tela de
-- Organizacoes, e a peca nova nasce com ele.
--
-- Seguro para re-executar: IF NOT EXISTS.
--
-- A coluna nasce nula de proposito. Joalheria sem termo cadastrado emite peca
-- sem termo, e o passaporte ja tem um texto de reserva para esse caso
-- (CertificatePublicView / CertificateOnlyView). Melhor que herdar a promessa
-- de outra empresa, que era o que acontecia.
-- ============================================================================

alter table public.organizations
  add column if not exists warranty_terms_default text;

comment on column public.organizations.warranty_terms_default is
  'Termo de garantia padrao desta joalheria. Preenche o campo do certificado '
  'no momento da emissao; cada peca pode ajustar o seu. Mudar aqui NAO altera '
  'certificados ja emitidos - cada um guarda a copia do que foi prometido.';
