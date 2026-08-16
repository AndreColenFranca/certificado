import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  try {
    console.log('🔍 Verificando admins...\n');

    // 1. Verificar na tabela auth_users
    const { data: authUsers, error: err1 } = await supabase
      .from('auth_users')
      .select('id, email, name, role')
      .eq('role', 'admin');

    console.log('📋 Admins na tabela auth_users:');
    if (authUsers) {
      console.log(JSON.stringify(authUsers, null, 2));
    } else {
      console.log('❌ Erro:', err1?.message);
    }

    // 2. Verificar no Supabase Auth
    console.log('\n🔐 Verificando Supabase Auth (auth.users)...');
    const { data: { users: authUsersAll }, error: err2 } = await supabase.auth.admin.listUsers();

    if (authUsersAll) {
      const adminsInAuth = authUsersAll.filter(u => u.email?.includes('adm'));
      console.log(`\n📋 Admins no Supabase Auth (${adminsInAuth.length} encontrados):`);
      adminsInAuth.forEach(u => {
        console.log(`  - ${u.email} (ID: ${u.id})`);
      });
    } else {
      console.log('❌ Erro:', err2?.message);
    }

  } catch (err: any) {
    console.error('❌ Exception:', err.message);
  }
}

check();
