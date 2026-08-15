# Migração CPF para Numérico

Execute os comandos abaixo no **Supabase SQL Editor** em ordem:

## Passo 1: Remover constraint de unique
```sql
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_cpf_unique;
```

## Passo 2: Criar coluna temporária
```sql
ALTER TABLE customers ADD COLUMN cpf_numeric BIGINT;
```

## Passo 3: Converter dados existentes
```sql
UPDATE customers
SET cpf_numeric = CAST(REGEXP_REPLACE(cpf, '[^0-9]', '', 'g') AS BIGINT)
WHERE cpf IS NOT NULL AND cpf != '';
```

## Passo 4: Remover coluna antiga
```sql
ALTER TABLE customers DROP COLUMN cpf;
```

## Passo 5: Renomear coluna
```sql
ALTER TABLE customers RENAME COLUMN cpf_numeric TO cpf;
```

## Passo 6: Verificar dados
```sql
SELECT id, cpf FROM customers LIMIT 10;
```

## Passo 7 (Opcional): Criar constraint de unique
```sql
ALTER TABLE customers ADD CONSTRAINT customers_cpf_unique UNIQUE(cpf);
```

---

**Como executar:**
1. Acesse https://app.supabase.com
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Cole cada comando acima (um de cada vez) e clique em "Run"
