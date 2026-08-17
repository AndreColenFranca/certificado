import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Env vars not configured');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey.replace(/\s+/g, '').trim());

async function checkUser() {
  console.log('\n🔍 Verificando usuários cli01...\n');

  // Buscar usuarios com cli01 no email
  const { data: users, error } = await supabase
    .from('auth_users')
    .select('*')
    .ilike('email', '%cli01%');

  if (error) {
    console.error('❌ Erro:', error.message);
  } else if (users && users.length > 0) {
    console.log(`✅ Encontrados ${users.length} usuário(s):\n`);
    users.forEach(u => {
      console.log(`📧 Email: ${u.email}`);
      console.log(`   ID: ${u.id}`);
      console.log(`   Role: ${u.role}`);
      console.log(`   Org: ${u.org_id}`);
      console.log(`   Criado: ${u.created_at}\n`);
    });
  } else {
    console.log('❌ Nenhum usuário encontrado com cli01');
  }
}

checkUser().catch(err => {
  console.error('❌ Erro fatal:', err.message);
  process.exit(1);
});
