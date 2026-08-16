import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function test() {
  console.log('🧪 Testando Supabase Auth...\n');

  try {
    console.log('1️⃣  Tentando criar usuário com email: test-admin-001@a.com');

    const { data, error } = await supabase.auth.admin.createUser({
      email: 'test-admin-001@a.com',
      password: '123456',
      user_metadata: {
        display_name: 'Test Admin',
        role: 'admin'
      },
      email_confirm: true
    });

    if (error) {
      console.log(`❌ ERRO: ${error.message}`);
      console.log(`Code: ${error.status}`);
      return;
    }

    if (data.user) {
      console.log(`✅ SUCESSO! Usuário criado com ID: ${data.user.id}`);

      // Tentar fazer login
      console.log('\n2️⃣  Tentando fazer login...');
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: 'test-admin-001@a.com',
        password: '123456'
      });

      if (loginError) {
        console.log(`❌ ERRO no login: ${loginError.message}`);
      } else {
        console.log(`✅ Login OK!`);
      }
    }
  } catch (err: any) {
    console.error('❌ EXCEPTION:', err.message);
  }
}

test();
