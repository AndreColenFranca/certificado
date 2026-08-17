import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey.replace(/\s+/g, '').trim());

async function checkCustomers() {
  console.log('\n📋 Clientes com cli01 no email:\n');

  const { data: customers, error } = await supabase
    .from('customers')
    .select('*')
    .ilike('email', '%cli01%');

  if (error) {
    console.error('❌ Erro:', error.message);
  } else if (customers && customers.length > 0) {
    console.log(`✅ Encontrados ${customers.length} cliente(s):\n`);
    customers.forEach(c => {
      console.log(`📧 Email: ${c.email}`);
      console.log(`   Nome: ${c.name}`);
      console.log(`   CPF: ${c.cpf}`);
      console.log(`   ID: ${c.id}`);
      console.log(`   Org: ${c.org_id}\n`);
    });
  } else {
    console.log('❌ Nenhum cliente encontrado com cli01');
    
    // Listar todos os clientes
    console.log('\n📋 TODOS os clientes:\n');
    const { data: allCustomers } = await supabase
      .from('customers')
      .select('email, name, cpf, id')
      .limit(20);
    
    if (allCustomers) {
      allCustomers.forEach(c => {
        console.log(`${c.email?.padEnd(25)} | ${c.name?.padEnd(30)} | CPF: ${c.cpf}`);
      });
    }
  }
}

checkCustomers().catch(console.error);
