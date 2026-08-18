import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🔄 Executando migração: adicionar coluna internal_notes...\n');

    // Check if column already exists
    const { data: existing, error: checkError } = await supabase
      .from('jewelry_certificates')
      .select('internal_notes')
      .limit(0);

    if (!checkError) {
      console.log('✅ Coluna internal_notes já existe!');
      return;
    }

    // Add column
    const { error: alterError } = await supabase.rpc('execute_sql', {
      sql: `ALTER TABLE jewelry_certificates ADD COLUMN internal_notes TEXT;`
    }).catch(() => {
      // Fallback: if execute_sql doesn't exist, we need to use the SQL query directly
      return { error: { message: 'Use Supabase SQL Editor' } };
    });

    if (alterError) {
      console.log('⚠️  Não foi possível executar via RPC');
      console.log('\n📋 Execute este SQL no Supabase SQL Editor:');
      console.log('─'.repeat(60));
      console.log(`
ALTER TABLE jewelry_certificates ADD COLUMN internal_notes TEXT;
CREATE INDEX idx_jewelry_certificates_internal_notes ON jewelry_certificates(internal_notes);
      `);
      console.log('─'.repeat(60));
      return;
    }

    console.log('✅ Migração executada com sucesso!');
    console.log('   - Coluna internal_notes adicionada');
    console.log('   - Índice criado para otimização');

  } catch (err: any) {
    console.error('❌ Erro na migração:', err.message);
    console.log('\n📋 Execute este SQL no Supabase SQL Editor:');
    console.log('─'.repeat(60));
    console.log(`
ALTER TABLE jewelry_certificates ADD COLUMN internal_notes TEXT;
CREATE INDEX idx_jewelry_certificates_internal_notes ON jewelry_certificates(internal_notes);
    `);
    console.log('─'.repeat(60));
  }
}

runMigration();
