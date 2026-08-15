#!/usr/bin/env node

/**
 * Teste de Diagnóstico - Supabase Data Retrieval
 * Execute este script para diagnosticar por que os dados não aparecem
 */

const BASE_URL = 'http://localhost:3000';

async function test(name, url) {
  console.log(`\n========== TESTE: ${name} ==========`);
  try {
    const response = await fetch(`${BASE_URL}${url}`);
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error(`ERRO: ${error.message}`);
  }
}

async function main() {
  console.log('🔍 Iniciando Diagnóstico de Supabase...\n');

  // Test 1: Connection
  console.log('1️⃣  Testando conexão com Supabase...');
  await test('Supabase Connection', '/api/supabase/test');

  // Test 2: Environment
  console.log('\n2️⃣  Verificando ambiente...');
  await test('Environment Debug', '/api/debug/env');

  // Test 2.5: Diagnostic (ALL data without org filter)
  console.log('\n2️⃣.5️⃣  Diagnóstico completo (sem filtro org_id)...');
  const diagData = await test('Supabase Diagnostic', '/api/supabase/diagnostic');

  // Test 3: Get Certificates
  console.log('\n3️⃣  Buscando certificados (com filtro org_id)...');
  const certsData = await test('Get Certificates', '/api/certificates');

  // Test 4: Get Customers
  console.log('\n4️⃣  Buscando clientes (com filtro org_id)...');
  const custsData = await test('Get Customers', '/api/customers');

  // Test 5: Get Organizations
  console.log('\n5️⃣  Buscando organizações...');
  await test('Get Organizations', '/api/organizations');

  // Summary
  console.log('\n\n📊 RESUMO DO DIAGNÓSTICO:');
  console.log('==========================');

  if (diagData) {
    console.log(`\n📦 DADOS NO SUPABASE (sem filtro):`);
    console.log(`   - Total Certificados: ${diagData.totalCertificates}`);
    console.log(`   - Total Clientes: ${diagData.totalCustomers}`);
    console.log(`   - Total Organizações: ${diagData.totalOrganizations}`);
    if (diagData.certificateOrgIds?.length > 0) {
      console.log(`   - Org IDs dos Certificados: ${diagData.certificateOrgIds.join(', ')}`);
    }
    if (diagData.customerOrgIds?.length > 0) {
      console.log(`   - Org IDs dos Clientes: ${diagData.customerOrgIds.join(', ')}`);
    }
    console.log(`   - Org ID da Requisição Atual: ${diagData.currentRequestOrgId}`);
  }

  console.log(`\n🔍 COM FILTRO ORG_ID:`);
  console.log(`   - Certificados retornados: ${certsData?.data?.length || 0}`);
  console.log(`   - Clientes retornados: ${custsData?.data?.length || 0}`);

  if ((diagData?.totalCertificates || 0) > 0 && (certsData?.data?.length || 0) === 0) {
    console.log('\n⚠️  PROBLEMA IDENTIFICADO: Dados existem no Supabase mas não estão sendo retornados!');
    console.log('\n🔧 SOLUÇÃO:');
    console.log('   O org_id da requisição NÃO corresponde ao org_id dos dados.');
    console.log(`   - Org IDs esperados: ${diagData.certificateOrgIds?.join(', ')}`);
    console.log(`   - Org ID enviado: ${diagData.currentRequestOrgId}`);
  } else if ((diagData?.totalCertificates || 0) === 0 && (diagData?.totalCustomers || 0) === 0) {
    console.log('\n❌ NENHUM DADO NO SUPABASE: Os dados ainda não foram salvos no banco!');
  } else if ((certsData?.data?.length || 0) > 0 || (custsData?.data?.length || 0) > 0) {
    console.log('\n✅ SUCESSO: Dados estão sendo retornados corretamente!');
  }
}

main().catch(console.error);
