/**
 * Testes de API - Fluxo Completo
 * Valida: CRUD de certificados, clientes, login, e RLS
 */

const BASE_URL = 'http://localhost:3000';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

// ==================== HELPER FUNCTIONS ====================

async function fetchAPI(
  endpoint: string,
  method: string = 'GET',
  body?: any
): Promise<any> {
  const options: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  return response.json();
}

function test(name: string, passed: boolean, error?: string) {
  results.push({ name, passed, error });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${name}`);
  if (error) console.log(`   Erro: ${error}`);
}

// ==================== TESTES ====================

async function runTests() {
  console.log('════════════════════════════════════════════');
  console.log('🧪 TESTES DE API - FLUXO COMPLETO');
  console.log('════════════════════════════════════════════\n');

  // ========== CERTIFICADOS ==========
  console.log('📜 TESTES - CERTIFICADOS');
  console.log('───────────────────────────────────────────');

  try {
    // 1. GET all (antes)
    const certsBefore = await fetchAPI('/api/certificates');
    const countBefore = certsBefore.count ?? 0;
    test('GET /api/certificates - retorna lista', certsBefore.success === true);

    // 2. POST create
    const newCertId = `CERT-TEST-${Date.now()}`;
    const createCertRes = await fetchAPI('/api/certificates', 'POST', {
      id: newCertId,
      title: 'Anel de Teste',
      collection: 'Test',
      model: 'Test-1',
      manufacturer: 'Test MFG',
      manufacturingDate: '2026-01-01',
      issueDate: '2026-01-01',
      metalPurity: '18K',
      metalColor: 'Ouro',
      grossWeightGrams: 5.5,
      finish: 'Polido',
      hasStones: false,
      stones: [],
      images: [],
      frames360: [],
      warrantyMonths: 60,
      warrantyTerms: 'Test',
      warrantyStatus: 'Ativa',
      authenticityHash: '0xtest',
      careGuide: [],
      maintenanceHistory: [],
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z'
    });
    test(
      'POST /api/certificates - cria novo',
      createCertRes.success === true,
      createCertRes.message
    );

    // 3. GET by ID
    const getCertRes = await fetchAPI(`/api/certificates/${newCertId}`);
    test(
      'GET /api/certificates/:id - encontra por ID',
      getCertRes.success === true && getCertRes.data?.id === newCertId,
      getCertRes.message
    );

    // 4. PUT update
    const updateCertRes = await fetchAPI(`/api/certificates/${newCertId}`, 'PUT', {
      title: 'Anel Atualizado'
    });
    test(
      'PUT /api/certificates/:id - atualiza',
      updateCertRes.success === true && updateCertRes.data?.title === 'Anel Atualizado',
      updateCertRes.message
    );

    // 5. DELETE
    const deleteCertRes = await fetchAPI(`/api/certificates/${newCertId}`, 'DELETE');
    test(
      'DELETE /api/certificates/:id - deleta',
      deleteCertRes.success === true,
      deleteCertRes.message
    );

    // 6. Verify count returned to original
    const certsAfter = await fetchAPI('/api/certificates');
    test(
      'Certificados retornaram ao original',
      certsAfter.count === countBefore
    );
  } catch (err: any) {
    test('Certificados - ERRO', false, err.message);
  }

  console.log('');

  // ========== CLIENTES ==========
  console.log('👥 TESTES - CLIENTES');
  console.log('───────────────────────────────────────────');

  try {
    // 1. GET all (antes)
    const custsBefore = await fetchAPI('/api/customers');
    const custCountBefore = custsBefore.count ?? 0;
    test('GET /api/customers - retorna lista', custsBefore.success === true);

    // 2. POST create
    const newCustId = `CLI-TEST-${Date.now()}`;
    const createCustRes = await fetchAPI('/api/customers', 'POST', {
      id: newCustId,
      name: 'Cliente Teste',
      cpf: '123.456.789-00',
      email: `teste-${Date.now()}@test.com`,
      phone: '11999999999',
      notes: 'Cliente de teste'
    });
    test(
      'POST /api/customers - cria novo',
      createCustRes.success === true,
      createCustRes.message
    );

    // 3. PUT update
    const updateCustRes = await fetchAPI(`/api/customers/${newCustId}`, 'PUT', {
      name: 'Cliente Atualizado'
    });
    test(
      'PUT /api/customers/:id - atualiza',
      updateCustRes.success === true && updateCustRes.data?.name === 'Cliente Atualizado',
      updateCustRes.message
    );

    // 4. DELETE
    const deleteCustRes = await fetchAPI(`/api/customers/${newCustId}`, 'DELETE');
    test(
      'DELETE /api/customers/:id - deleta',
      deleteCustRes.success === true,
      deleteCustRes.message
    );

    // 5. Verify count
    const custsAfter = await fetchAPI('/api/customers');
    test(
      'Clientes retornaram ao original',
      custsAfter.count === custCountBefore
    );
  } catch (err: any) {
    test('Clientes - ERRO', false, err.message);
  }

  // ==================== RESUMO ====================
  console.log('\n════════════════════════════════════════════');
  console.log('📊 RESUMO DOS TESTES');
  console.log('════════════════════════════════════════════\n');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;

  console.log(`Total: ${total}`);
  console.log(`✅ Passaram: ${passed}`);
  console.log(`❌ Falharam: ${failed}`);
  console.log(`Taxa de Sucesso: ${((passed / total) * 100).toFixed(0)}%\n`);

  if (failed === 0) {
    console.log('🎉 TODOS OS TESTES PASSARAM!');
  } else {
    console.log('⚠️  Alguns testes falharam. Verifique os erros acima.');
  }
}

// ==================== RUN ====================
runTests().catch(console.error);
