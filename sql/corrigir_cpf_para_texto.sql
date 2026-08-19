-- ============================================================================
-- RODE NO SQL Editor do Supabase (projeto CertificadoJoias).
--
-- Problema: customers.cpf e bigint. CPF nao e numero - tem zeros a esquerda
-- significativos, e numero nao guarda zero a esquerda. Um CPF 00100000011
-- virava 100000011, perdendo dois digitos.
--
-- Correcao: mudar a coluna para text e, no mesmo passo, restaurar os zeros.
-- Como CPF tem sempre 11 digitos, um valor com 9 perdeu exatamente 2 zeros -
-- o lpad reconstroi com certeza, nao e adivinhacao.
--
-- jewelry_certificates.owner_cpf ja e text; so o cadastro de cliente estava
-- com o tipo errado.
-- ============================================================================

-- 1) Confira ANTES o que sera alterado (nao muda nada, so mostra)
select
  name,
  email,
  cpf                             as cpf_atual,
  lpad(cpf::text, 11, '0')        as cpf_corrigido,
  length(cpf::text)               as digitos_atuais
from customers
order by length(cpf::text), name;

-- 2) Converte a coluna para text restaurando os zeros a esquerda.
--    Rode depois de conferir o resultado da consulta acima.
alter table customers
  alter column cpf type text using lpad(cpf::text, 11, '0');

-- 3) Garante que so entrem CPFs com 11 digitos daqui em diante.
--    O servidor nao validava nada; esta e a rede de seguranca no banco.
alter table customers
  add constraint customers_cpf_11_digitos check (cpf ~ '^[0-9]{11}$');

-- 4) Confira DEPOIS
select name, email, cpf, length(cpf) as digitos
from customers
order by name;
