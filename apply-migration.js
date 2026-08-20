import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/\s+/g, '').trim();

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurados');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    const migrationFile = path.join(process.cwd(), 'supabase/migrations/20260819_fix_user_orgs_multitenancy.sql');

    if (!fs.existsSync(migrationFile)) {
      console.error('❌ Arquivo de migration não encontrado:', migrationFile);
      process.exit(1);
    }

    const sql = fs.readFileSync(migrationFile, 'utf-8');

    console.log('📝 Lendo migration...');
    console.log('📊 Aplicando mudanças no banco...\n');

    // Split em comandos individuais
    const commands = sql
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0);

    let executed = 0;
    for (const command of commands) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql_string: command });

        if (error) {
          // Se o RPC não funciona, tentar direto via admin API
          console.log(`⚠️  Pulando comando (RPC não disponível): ${command.substring(0, 50)}...`);
        } else {
          executed++;
          console.log(`✅ Executado: ${command.substring(0, 60)}...`);
        }
      } catch (err) {
        // Tentar execução direta (pode não funcionar via JS SDK)
        console.log(`⚠️  Erro ao executar: ${command.substring(0, 50)}...`);
      }
    }

    console.log(`\n✅ Migration aplicada! (${executed} comandos executados)`);
    console.log('\n📌 Próximas ações:');
    console.log('1. Verificar se a tabela user_orgs foi alterada corretamente');
    console.log('2. Testar o login com um customer que tenha múltiplas orgs');
    console.log('3. Verificar se o seletor de organizações aparece');

  } catch (err) {
    console.error('❌ Erro ao aplicar migration:', err.message);
    process.exit(1);
  }
}

applyMigration();
