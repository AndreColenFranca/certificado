import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const user = users?.find((u: any) => u.email === 'test-new@a.com');

  console.log('test-new@a.com em Supabase Auth:', user ? '✅ SIM' : '❌ NÃO');
}

check();
