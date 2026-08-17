import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey.replace(/\s+/g, '').trim());

async function test() {
  const email = 'cli01@cli01.com';
  
  console.log(`\n🔍 Procurando: ${email}\n`);

  const { data, error } = await supabase
    .from('auth_users')
    .select('*')
    .eq('email', email.toLowerCase())
    .single();

  if (error) {
    console.error(`❌ Erro:`, error.message);
  } else if (data) {
    console.log(`✅ Encontrado em auth_users:`);
    console.log(`   ID: ${data.id}`);
    console.log(`   Email: ${data.email}`);
    console.log(`   Role: ${data.role}`);
  } else {
    console.log(`❌ Nenhum resultado`);
  }
}

test().catch(console.error);
