-- ============================================
-- Row Level Security (RLS) Policies
-- Garante isolamento de dados por organização
-- ============================================

-- ==================== ENABLE RLS ====================

-- Habilitar RLS na tabela jewelry_certificates
ALTER TABLE jewelry_certificates ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS na tabela customers
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- ==================== jewelry_certificates POLICIES ====================

-- Policy: Usuários podem VER certificados de sua organização
CREATE POLICY "Users can view their org certificates"
  ON jewelry_certificates
  FOR SELECT
  USING (org_id = (auth.jwt() ->> 'org_id')::text);

-- Policy: Usuários podem CRIAR certificados em sua organização
CREATE POLICY "Users can create certificates in their org"
  ON jewelry_certificates
  FOR INSERT
  WITH CHECK (org_id = (auth.jwt() ->> 'org_id')::text);

-- Policy: Usuários podem ATUALIZAR certificados de sua organização
CREATE POLICY "Users can update their org certificates"
  ON jewelry_certificates
  FOR UPDATE
  USING (org_id = (auth.jwt() ->> 'org_id')::text)
  WITH CHECK (org_id = (auth.jwt() ->> 'org_id')::text);

-- Policy: Usuários podem DELETAR certificados de sua organização
CREATE POLICY "Users can delete their org certificates"
  ON jewelry_certificates
  FOR DELETE
  USING (org_id = (auth.jwt() ->> 'org_id')::text);

-- ==================== customers POLICIES ====================

-- Policy: Usuários podem VER clientes de sua organização
CREATE POLICY "Users can view their org customers"
  ON customers
  FOR SELECT
  USING (org_id = (auth.jwt() ->> 'org_id')::text);

-- Policy: Usuários podem CRIAR clientes em sua organização
CREATE POLICY "Users can create customers in their org"
  ON customers
  FOR INSERT
  WITH CHECK (org_id = (auth.jwt() ->> 'org_id')::text);

-- Policy: Usuários podem ATUALIZAR clientes de sua organização
CREATE POLICY "Users can update their org customers"
  ON customers
  FOR UPDATE
  USING (org_id = (auth.jwt() ->> 'org_id')::text)
  WITH CHECK (org_id = (auth.jwt() ->> 'org_id')::text);

-- Policy: Usuários podem DELETAR clientes de sua organização
CREATE POLICY "Users can delete their org customers"
  ON customers
  FOR DELETE
  USING (org_id = (auth.jwt() ->> 'org_id')::text);

-- ==================== SERVICE ROLE BYPASS ====================

-- IMPORTANTE: Service Role Key bypassa RLS automaticamente
-- Portanto, qualquer call com service role key não precisa validar org_id

-- ==================== VERIFICAÇÃO ====================

-- Verificar se RLS está habilitado
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('jewelry_certificates', 'customers');

-- Listar todas as policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  qual
FROM pg_policies
WHERE tablename IN ('jewelry_certificates', 'customers')
ORDER BY tablename, policyname;
