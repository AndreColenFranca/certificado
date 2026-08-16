import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  try {
    console.log('🔍 Verificando adm01@a.com...\n');

    // 1. Na tabela auth_users
    const { data: user, error: err1 } = await supabase
      .from('auth_users')
      .select('*')
      .eq('email', 'adm01@a.com')
      .single();

    console.log('📋 Na tabela auth_users:');
    if (user) {
      console.log('  ✅ Encontrado');
      console.log(`  ID: ${user.id}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Role: ${user.role}`);
    } else {
      console.log('  ❌ NÃO encontrado');
      if (err1?.code === 'PGRST116') {
        console.log('     (Nenhum registro com este email)');
      }
    }

    // 2. No Supabase Auth
    console.log('\n🔐 No Supabase Auth (auth.users):');
    const { data: { users }, error: err2 } = await supabase.auth.admin.listUsers();
    const authUser = users?.find(u => u.email === 'adm01@a.com');

    if (authUser) {
      console.log('  ✅ Encontrado');
      console.log(`  ID: ${authUser.id}`);
      console.log(`  Email: ${authUser.email}`);
      console.log(`  Confirmed: ${authUser.email_confirmed_at ? 'Sim' : 'Não'}`);
    } else {
      console.log('  ❌ NÃO encontrado');
      console.log('     👉 ESTE É O PROBLEMA! Usuário foi criado em auth_users mas NÃO em auth.users');
    }

    // 3. Tentar fazer login para ver o erro exato
    console.log('\n🔑 Testando login:');
    const { data: loginData, error: loginErr } = await supabase.auth.signInWithPassword({
      email: 'adm01@a.com',
      password: '123456'
    });

    if (loginErr) {
      console.log(`  ❌ Erro: ${loginErr.message}`);
    } else if (loginData.user) {
      console.log(`  ✅ Login bem-sucedido!`);
    }

  } catch (err: any) {
    console.error('❌ Exception:', err.message);
  }
}

check();
