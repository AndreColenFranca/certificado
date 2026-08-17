import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!.replace(/\s+/g, '').trim()
);

async function verify() {
  console.log('\n🔍 Verificando usuário em Supabase Auth (auth.users)...\n');

  const { data: users, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error('❌ Erro:', error.message);
    return;
  }

  const user = users?.users?.find(u => u.email === 'cli01@cli01.com');

  if (user) {
    console.log('✅ Usuário encontrado em Supabase Auth:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Email confirmado: ${user.email_confirmed_at ? 'Sim' : 'Não'}`);
    console.log(`   Metadata: ${JSON.stringify(user.user_metadata)}\n`);
  } else {
    console.log('❌ Usuário NÃO encontrado em Supabase Auth');
    console.log('\n📋 Usuários disponíveis:');
    users?.users?.forEach(u => {
      console.log(`   - ${u.email}`);
    });
  }
}

verify().catch(console.error);
