require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL ||
    'postgresql://postgres:[PASSWORD]@db.btnxzffcuvwhuxdeshpk.supabase.co:5432/postgres'
});

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('🚀 Iniciando migração do CPF para numérico...\n');

    // 1. Remover constraint de unique
    console.log('1️⃣ Removendo constraint de unique...');
    try {
      await client.query('ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_cpf_unique;');
      console.log('✅ Constraint removida');
    } catch (e) {
      console.warn('⚠️ (ok):', e.message);
    }

    // 2. Criar coluna temporária
    console.log('\n2️⃣ Criando coluna temporária cpf_numeric...');
    try {
      await client.query('ALTER TABLE customers ADD COLUMN cpf_numeric BIGINT;');
      console.log('✅ Coluna criada');
    } catch (e) {
      console.warn('⚠️ Coluna já existe, continuando...');
    }

    // 3. Converter dados
    console.log('\n3️⃣ Convertendo dados existentes...');
    const result = await client.query(
      `UPDATE customers
       SET cpf_numeric = CAST(REGEXP_REPLACE(cpf, '[^0-9]', '', 'g') AS BIGINT)
       WHERE cpf IS NOT NULL AND cpf != ''
       RETURNING id, cpf, cpf_numeric;`
    );
    console.log(`✅ ${result.rowCount} registros convertidos`);

    // 4. Remover coluna antiga
    console.log('\n4️⃣ Removendo coluna cpf antiga...');
    await client.query('ALTER TABLE customers DROP COLUMN cpf;');
    console.log('✅ Coluna antiga removida');

    // 5. Renomear coluna
    console.log('\n5️⃣ Renomeando cpf_numeric para cpf...');
    await client.query('ALTER TABLE customers RENAME COLUMN cpf_numeric TO cpf;');
    console.log('✅ Coluna renomeada');

    // 6. Verificar duplicatas
    console.log('\n6️⃣ Verificando duplicatas...');
    const dupResult = await client.query(
      `SELECT cpf, COUNT(*) as count FROM customers WHERE cpf IS NOT NULL GROUP BY cpf HAVING COUNT(*) > 1;`
    );

    if (dupResult.rows.length > 0) {
      console.warn('⚠️ Duplicatas encontradas:');
      dupResult.rows.forEach(row => {
        console.warn(`   CPF ${row.cpf}: ${row.count} registros`);
      });
    } else {
      console.log('✅ Nenhuma duplicata encontrada');
    }

    console.log('\n✅ Migração concluída com sucesso!');
  } catch (err) {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

runMigration();
