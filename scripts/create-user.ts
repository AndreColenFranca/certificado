import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import 'dotenv/config';

async function createUser() {
  const supabaseUrl = process.env.SUPABASE_URL;
  let supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Env vars not set');
    process.exit(1);
  }

  supabaseServiceKey = supabaseServiceKey.replace(/\s+/g, '');
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // 1. Buscar user ID do Auth
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error('Erro ao listar usuários:', listError.message);
      process.exit(1);
    }

    const authUser = users.find(u => u.email === 'andreluiz.colen@gmail.com');

    if (!authUser) {
      console.error('Usuário não encontrado no Supabase Auth');
      process.exit(1);
    }

    console.log('✅ Usuário encontrado no Auth:', authUser.id);

    // 2. Verificar se já existe na tabela
    const { data: existing } = await supabase
      .from('auth_users')
      .select('*')
      .eq('email', 'andreluiz.colen@gmail.com');

    if (existing && existing.length > 0) {
      console.log('✅ Usuário já existe na tabela auth_users');
      console.log('Dados:', existing[0]);
      return;
    }

    // 3. Inserir na tabela auth_users
    const { data, error } = await supabase
      .from('auth_users')
      .insert([{
        id: authUser.id,
        email: 'andreluiz.colen@gmail.com',
        name: 'André Luiz Colen',
        role: 'root',
        org_id: '550e8400-e29b-41d4-a716-446655440000'
      }])
      .select();

    if (error) {
      console.error('Erro ao inserir na tabela:', error.message);
      process.exit(1);
    }

    console.log('✅ Usuário inserido na tabela auth_users com sucesso!');
    console.log('Dados:', data);
  } catch (err: any) {
    console.error('Erro:', err.message);
    process.exit(1);
  }
}

createUser();
