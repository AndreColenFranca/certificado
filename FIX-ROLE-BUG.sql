-- ============================================
-- FIX: Role sendo salvo como 'customer'
-- ============================================
-- Execute isto no Supabase SQL Editor

-- PASSO 1: Dropar a política problemática
DROP POLICY IF EXISTS "manage_org_users" ON auth_users;

-- PASSO 2: Criar nova política que permite admin criar operator e customer
CREATE POLICY "manage_org_users" ON auth_users
  FOR ALL
  USING (
    org_id::text = (auth.jwt() ->> 'org_id')
    AND (auth.jwt() ->> 'role') IN ('root', 'admin')
  )
  WITH CHECK (
    org_id::text = (auth.jwt() ->> 'org_id')
    AND (
      -- Root pode criar qualquer role
      (auth.jwt() ->> 'role') = 'root'
      OR
      -- Admin pode criar apenas customer/operator, NÃO admin
      ((auth.jwt() ->> 'role') = 'admin' AND role IN ('customer', 'operator'))
    )
  );

-- PASSO 3: Verificar se a policy foi criada
SELECT schemaname, tablename, policyname FROM pg_policies
WHERE tablename = 'auth_users' AND policyname = 'manage_org_users';

-- Se não aparecer nada, a policy não foi criada. Execute os passos acima.
-- Se aparecer, a correção foi aplicada com sucesso!
