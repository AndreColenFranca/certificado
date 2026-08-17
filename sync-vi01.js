import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/\s+/g, '').trim();

const supabase = createClient(supabaseUrl, supabaseKey);

const main = async () => {
  console.log('🔄 Sincronizando vi01@vi01.com...\n');

  try {
    // 1. Find vi01 in auth.users
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const vi01Auth = authUsers.users.find(u => u.email?.toLowerCase() === 'vi01@vi01.com');

    if (!vi01Auth) {
      console.log('❌ vi01@vi01.com não encontrado em auth.users');
      return;
    }

    console.log('✅ Encontrado em auth.users:');
    console.log('   ID:', vi01Auth.id);
    console.log('   Email:', vi01Auth.email);

    // 2. Update user_metadata with org_id
    console.log('\n🔧 Atualizando user_metadata...');
    const { data: updated, error: updateErr } = await supabase.auth.admin.updateUserById(vi01Auth.id, {
      user_metadata: {
        ...(vi01Auth.user_metadata || {}),
        org_id: '550e8401-e29b-41d4-a716-446655440001',
        role: vi01Auth.user_metadata?.role || 'operator'
      }
    });

    if (updateErr) {
      console.error('❌ Erro ao atualizar metadata:', updateErr.message);
      return;
    }

    console.log('✅ Metadata atualizado');

    // 3. Update or create auth_users record
    console.log('\n📝 Atualizando auth_users table...');

    const { data: existing } = await supabase
      .from('auth_users')
      .select('*')
      .eq('id', vi01Auth.id)
      .single();

    if (existing) {
      // Update
      const { error: updateAuthError } = await supabase
        .from('auth_users')
        .update({
          org_id: '550e8401-e29b-41d4-a716-446655440001',
          role: existing.role || 'operator',
          updated_at: new Date().toISOString()
        })
        .eq('id', vi01Auth.id);

      if (updateAuthError) {
        console.error('❌ Erro ao atualizar auth_users:', updateAuthError.message);
        return;
      }
      console.log('✅ Registro de auth_users atualizado');
    } else {
      // Insert
      const { error: insertError } = await supabase
        .from('auth_users')
        .insert({
          id: vi01Auth.id,
          email: vi01Auth.email,
          name: vi01Auth.user_metadata?.display_name || 'Operador VI01',
          org_id: '550e8401-e29b-41d4-a716-446655440001',
          role: vi01Auth.user_metadata?.role || 'operator',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('❌ Erro ao criar auth_users:', insertError.message);
        return;
      }
      console.log('✅ Registro de auth_users criado');
    }

    // 4. Verify
    console.log('\n✅ Sincronização concluída!');
    const { data: verify } = await supabase
      .from('auth_users')
      .select('*')
      .eq('email', 'vi01@vi01.com')
      .single();

    console.log('\n📊 Dados finais:');
    console.log('   ID:', verify.id);
    console.log('   Email:', verify.email);
    console.log('   org_id:', verify.org_id);
    console.log('   role:', verify.role);
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
};

main();
