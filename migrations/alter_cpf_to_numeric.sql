-- Alterar coluna CPF para tipo BIGINT (apenas números)
-- Executar no Supabase SQL Editor

-- 1. Backup dos dados atuais (opcional)
-- CREATE TABLE customers_backup AS SELECT * FROM customers;

-- 2. Remover a constraint de unique se existir
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_cpf_unique;

-- 3. Criar nova coluna temporária
ALTER TABLE customers ADD COLUMN cpf_numeric BIGINT;

-- 4. Converter dados existentes (remover formatação)
UPDATE customers
SET cpf_numeric = CAST(REGEXP_REPLACE(cpf, '[^0-9]', '', 'g') AS BIGINT)
WHERE cpf IS NOT NULL AND cpf != '';

-- 5. Remover coluna antiga
ALTER TABLE customers DROP COLUMN cpf;

-- 6. Renomear coluna nova
ALTER TABLE customers RENAME COLUMN cpf_numeric TO cpf;

-- 7. Adicionar constraint de unique
ALTER TABLE customers ADD CONSTRAINT customers_cpf_unique UNIQUE(cpf);

-- 8. Confirmar mudanças
SELECT cpf, COUNT(*) FROM customers GROUP BY cpf HAVING COUNT(*) > 1;
