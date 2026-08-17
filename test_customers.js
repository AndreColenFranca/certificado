import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY.replace(/\s+/g, '').trim()
);

const { data, error } = await supabase.from('customers').select('*');
console.log('Total clientes:', data?.length);
console.log(JSON.stringify(data, null, 2));
if (error) console.error('Erro:', error);
