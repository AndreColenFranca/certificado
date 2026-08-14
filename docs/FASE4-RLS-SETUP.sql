-- ============================================
-- FASE 4.2: RLS (Row Level Security) - SQL Setup
-- ============================================
-- Execute estas queries no Supabase Dashboard
-- Dashboard > SQL Editor > New Query
-- ============================================

-- ✅ PASSO 1: Verificar que RLS está habilitado em todas as tabelas

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE jewelry_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;

-- Verificar
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('organizations', 'auth_users', 'jewelry_certificates', 'customers', 'maintenance_records')
AND schemaname = 'public'
ORDER BY tablename;
-- Todas devem retornar: rowsecurity = true


-- ✅ PASSO 2: DROPPAR políticas antigas se existirem (CUIDADO!)
-- Descomente só se precisar resetar:
/*
DROP POLICY IF EXISTS "view_own_org" ON organizations;
DROP POLICY IF EXISTS "update_own_org" ON organizations;
DROP POLICY IF EXISTS "view_org_users" ON auth_users;
DROP POLICY IF EXISTS "manage_org_users" ON auth_users;
DROP POLICY IF EXISTS "view_org_certs" ON jewelry_certificates;
DROP POLICY IF EXISTS "create_org_certs" ON jewelry_certificates;
DROP POLICY IF EXISTS "update_org_certs" ON jewelry_certificates;
DROP POLICY IF EXISTS "delete_org_certs" ON jewelry_certificates;
DROP POLICY IF EXISTS "public_view_certs" ON jewelry_certificates;
DROP POLICY IF EXISTS "view_org_customers" ON customers;
DROP POLICY IF EXISTS "create_org_customers" ON customers;
DROP POLICY IF EXISTS "update_org_customers" ON customers;
DROP POLICY IF EXISTS "delete_org_customers" ON customers;
DROP POLICY IF EXISTS "view_org_maintenance" ON maintenance_records;
DROP POLICY IF EXISTS "create_org_maintenance" ON maintenance_records;
*/


-- ✅ PASSO 3: RLS para ORGANIZATIONS

-- Ver própria organização (org_id é TEXT, não UUID)
CREATE POLICY "view_own_org" ON organizations
  FOR SELECT
  USING (id::text = (auth.jwt() ->> 'org_id'));

-- Atualizar própria organização (apenas admins)
CREATE POLICY "update_own_org" ON organizations
  FOR UPDATE
  USING (id::text = (auth.jwt() ->> 'org_id') AND (auth.jwt() ->> 'role') IN ('root', 'admin'))
  WITH CHECK (id::text = (auth.jwt() ->> 'org_id'));


-- ✅ PASSO 4: RLS para AUTH_USERS (usuários do sistema)

-- Ver usuários da própria organização
CREATE POLICY "view_org_users" ON auth_users
  FOR SELECT
  USING (org_id::text = (auth.jwt() ->> 'org_id'));

-- Gerenciar usuários (apenas admins)
CREATE POLICY "manage_org_users" ON auth_users
  FOR ALL
  USING (
    org_id::text = (auth.jwt() ->> 'org_id')
    AND (auth.jwt() ->> 'role') IN ('root', 'admin')
  )
  WITH CHECK (
    org_id::text = (auth.jwt() ->> 'org_id')
    AND (auth.jwt() ->> 'role') IN ('root', 'admin')
  );


-- ✅ PASSO 5: RLS para JEWELRY_CERTIFICATES (joias)

-- Ver certificados da própria organização
CREATE POLICY "view_org_certs" ON jewelry_certificates
  FOR SELECT
  USING (org_id::text = (auth.jwt() ->> 'org_id'));

-- Criar certificados na própria organização
CREATE POLICY "create_org_certs" ON jewelry_certificates
  FOR INSERT
  WITH CHECK (org_id::text = (auth.jwt() ->> 'org_id'));

-- Atualizar certificados da própria organização
CREATE POLICY "update_org_certs" ON jewelry_certificates
  FOR UPDATE
  USING (org_id::text = (auth.jwt() ->> 'org_id'))
  WITH CHECK (org_id::text = (auth.jwt() ->> 'org_id'));

-- Deletar certificados da própria organização
CREATE POLICY "delete_org_certs" ON jewelry_certificates
  FOR DELETE
  USING (org_id::text = (auth.jwt() ->> 'org_id'));

-- Permitir visualização PÚBLICA de certificados (sem filtro)
-- Isso permite que qualquer pessoa veja um certificado se conhecer o ID
CREATE POLICY "public_view_certs" ON jewelry_certificates
  FOR SELECT
  USING (true);


-- ✅ PASSO 6: RLS para CUSTOMERS (clientes)

-- Ver clientes da própria organização
CREATE POLICY "view_org_customers" ON customers
  FOR SELECT
  USING (org_id::text = (auth.jwt() ->> 'org_id'));

-- Criar clientes na própria organização
CREATE POLICY "create_org_customers" ON customers
  FOR INSERT
  WITH CHECK (org_id::text = (auth.jwt() ->> 'org_id'));

-- Atualizar clientes da própria organização
CREATE POLICY "update_org_customers" ON customers
  FOR UPDATE
  USING (org_id::text = (auth.jwt() ->> 'org_id'))
  WITH CHECK (org_id::text = (auth.jwt() ->> 'org_id'));

-- Deletar clientes da própria organização
CREATE POLICY "delete_org_customers" ON customers
  FOR DELETE
  USING (org_id::text = (auth.jwt() ->> 'org_id'));


-- ✅ PASSO 7: RLS para MAINTENANCE_RECORDS (manutenção)

-- Ver registros de manutenção da própria organização
CREATE POLICY "view_org_maintenance" ON maintenance_records
  FOR SELECT
  USING (org_id::text = (auth.jwt() ->> 'org_id'));

-- Criar registros de manutenção na própria organização
CREATE POLICY "create_org_maintenance" ON maintenance_records
  FOR INSERT
  WITH CHECK (org_id::text = (auth.jwt() ->> 'org_id'));

-- Atualizar registros de manutenção da própria organização
CREATE POLICY "update_org_maintenance" ON maintenance_records
  FOR UPDATE
  USING (org_id::text = (auth.jwt() ->> 'org_id'))
  WITH CHECK (org_id::text = (auth.jwt() ->> 'org_id'));

-- Deletar registros de manutenção da própria organização
CREATE POLICY "delete_org_maintenance" ON maintenance_records
  FOR DELETE
  USING (org_id::text = (auth.jwt() ->> 'org_id'));


-- ✅ PASSO 8: Verificar todas as políticas foram criadas

SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename IN ('organizations', 'auth_users', 'jewelry_certificates', 'customers', 'maintenance_records')
ORDER BY tablename, policyname;

-- Deve retornar ~20 políticas (4 por tabela)


-- ✅ PASSO 9: Testar RLS (VERIFICAÇÃO LOCAL)

-- Query: Ver se políticas estão funcionando
-- Isso só funciona se você estiver authenticado como um usuário real

-- SELECT * FROM jewelry_certificates;  -- Vai retornar apenas certs da sua org
-- SELECT * FROM customers;             -- Vai retornar apenas clientes da sua org
-- SELECT * FROM auth_users;            -- Vai retornar apenas usuários da sua org


-- ✅ PASSO 10: Documentação das Políticas

/*
RESUMO DAS POLÍTICAS RLS:

1. ORGANIZATIONS
   - SELECT: Só pode ver própria org
   - UPDATE: Só admins podem atualizar própria org

2. AUTH_USERS
   - SELECT: Pode ver usuários da mesma org
   - INSERT/UPDATE/DELETE: Só admins podem gerenciar

3. JEWELRY_CERTIFICATES
   - SELECT: Pode ver certs da mesma org + certs públicas
   - INSERT: Deve usar org_id da própria org
   - UPDATE: Só pode atualizar certs da própria org
   - DELETE: Só pode deletar certs da própria org

4. CUSTOMERS
   - SELECT: Pode ver clientes da mesma org
   - INSERT: Deve usar org_id da própria org
   - UPDATE: Só pode atualizar clientes da própria org
   - DELETE: Só pode deletar clientes da própria org

5. MAINTENANCE_RECORDS
   - Mesmo pattern que jewelry_certificates

SEGURANÇA:
- Filtro duplo: Backend (middleware) + Banco (RLS)
- Se JWT for forjado, RLS vai bloquear
- Se middleware falhar, RLS vai bloquear
- Usuário nunca consegue ver dados de outra org
*/


-- ✅ VERIFICAÇÃO FINAL

-- 1. RLS habilitado
SELECT tablename, rowsecurity FROM pg_tables
WHERE tablename IN ('organizations', 'auth_users', 'jewelry_certificates', 'customers', 'maintenance_records')
AND schemaname = 'public';

-- 2. Políticas criadas
SELECT COUNT(*) as total_policies FROM pg_policies
WHERE tablename IN ('organizations', 'auth_users', 'jewelry_certificates', 'customers', 'maintenance_records');

-- Esperado: rowsecurity = true para todas, total_policies >= 20

-- Se tudo passou, próximo passo:
-- Testar com curl usando tokens de diferentes users
