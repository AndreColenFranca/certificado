import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://pjjwjnkrvfvaftkgvabq.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqandqbmtydmZ2YWZ0a2d2YWJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDAwODY3OTAsImV4cCI6MTcxNTY2NDc5MH0.4k0pDaA5_BN4rp4bJj8e_s7w5A8XlE0jPNvMXPZNy80';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
  const { data, error } = await supabase
    .from('jewelry_certificates')
    .select('*')
    .limit(0);
  
  if (error) {
    console.error('Erro:', error);
    return;
  }

  // Pegar informações das colunas
  const { data: columns, error: colError } = await supabase
    .rpc('get_columns', { table_name: 'jewelry_certificates' });
  
  console.log('Colunas disponíveis na tabela jewelry_certificates:');
  if (data) {
    console.log(Object.keys(data[0] || {}));
  }
}

checkSchema();
