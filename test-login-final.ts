import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function test() {
  console.log('🔑 Testando login com test-final@a.com...\n');

  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'test-final@a.com',
    password: '123456'
  });

  if (error) {
    console.log('❌ Erro:', error.message);
  } else {
    console.log('✅ LOGIN BEM-SUCEDIDO!');
    if (data.session?.access_token) {
      console.log(`   User ID: ${data.user?.id}`);
      console.log(`   Email: ${data.user?.email}`);
    }
  }
}

test();
