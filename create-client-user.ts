import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey.replace(/\s+/g, '').trim());

async function createClientUser() {
  const email = 'cli01@cli01.com';
  const password = '123456';
  const name = 'V01-cli';

  console.log(`\n🔐 Criando usuário Supabase Auth para cliente...\n`);

  try {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        display_name: name,
        role: 'customer'
      },
      email_confirm: true
    });

    if (authError) {
      console.error(`❌ Erro ao criar em Supabase Auth:`, authError.message);
      return;
    }

    if (!authData.user) {
      console.error(`❌ Falha ao criar usuário`);
      return;
    }

    console.log(`✅ Usuário criado em Supabase Auth:`);
    console.log(`   ID: ${authData.user.id}`);
    console.log(`   Email: ${authData.user.email}`);
    console.log(`   Confirmado: ${authData.user.email_confirmed_at ? 'Sim' : 'Não'}\n`);

    // Agora criar registro em auth_users table
    console.log(`📝 Criando registro em auth_users...\n`);

    const { data: insertedUser, error: insertError } = await supabase
      .from('auth_users')
      .insert({
        id: authData.user.id,
        email,
        name,
        role: 'customer',
        org_id: '550e8401-e29b-41d4-a716-446655440001',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error(`❌ Erro ao criar em auth_users:`, insertError.message);
      return;
    }

    console.log(`✅ Usuário vinculado em auth_users`);
    console.log(`   ID: ${insertedUser.id}`);
    console.log(`   Email: ${insertedUser.email}`);
    console.log(`   Role: ${insertedUser.role}`);
    console.log(`   Org: ${insertedUser.org_id}\n`);

    console.log(`🎉 Cliente pronto para fazer login!\n`);
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Senha: ${password}\n`);

  } catch (err: any) {
    console.error(`❌ Erro fatal:`, err.message);
  }
}

createClientUser();
