import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  console.log('🔍 Verificando adm1@a.com...\n');

  // 1. Na tabela auth_users
  const { data: user } = await supabase
    .from('auth_users')
    .select('*')
    .eq('email', 'adm1@a.com')
    .single();

  console.log('📋 auth_users:');
  if (user) {
    console.log('  ✅ Encontrado');
    console.log(`  ID: ${user.id}`);
    console.log(`  Role: ${user.role}`);
  } else {
    console.log('  ❌ NÃO encontrado');
  }

  // 2. No Supabase Auth
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const authUser = users?.find((u: any) => u.email === 'adm1@a.com');

  console.log('\n🔐 Supabase Auth:');
  if (authUser) {
    console.log('  ✅ Encontrado');
    console.log(`  Email: ${authUser.email}`);
    console.log(`  Confirmado: ${authUser.email_confirmed_at ? 'Sim' : 'Não'}`);
  } else {
    console.log('  ❌ NÃO encontrado - PROBLEMA!');
  }
}

check();
