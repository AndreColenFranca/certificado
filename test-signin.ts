import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!.replace(/\s+/g, '').trim()
);

async function test() {
  console.log('\n🧪 Testando signInWithPassword...\n');

  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'cli01@cli01.com',
    password: '123456'
  });

  console.log('Resultado:');
  console.log(`  Sucesso: ${!error}`);
  if (error) {
    console.log(`  Erro: ${error.message}`);
    console.log(`  Status: ${error.status}`);
  } else if (data?.user) {
    console.log(`  ✅ User ID: ${data.user.id}`);
    console.log(`  Email: ${data.user.email}`);
  }
}

test().catch(console.error);
