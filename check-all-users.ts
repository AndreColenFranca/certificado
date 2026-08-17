import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey.replace(/\s+/g, '').trim());

async function checkUsers() {
  console.log('\n📋 Todos os usuários em auth_users:\n');

  const { data: users, error } = await supabase
    .from('auth_users')
    .select('email, role, org_id, created_at')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('❌ Erro:', error.message);
  } else if (users) {
    console.log(`Total: ${users.length} usuários\n`);
    users.forEach(u => {
      console.log(`${u.email.padEnd(30)} | Role: ${u.role?.padEnd(10)} | Org: ${u.org_id}`);
    });
  }
}

checkUsers().catch(console.error);
