-- ============================================
-- FASE 4.1: JWT com org_id - SQL Setup
-- ============================================
-- Execute estas queries no Supabase Dashboard
-- Dashboard > SQL Editor > New Query
-- ============================================

-- ✅ PASSO 1: Criar função para buscar org_id do usuário
-- Execute isso PRIMEIRO

CREATE OR REPLACE FUNCTION public.get_user_org_id(user_id uuid)
RETURNS uuid AS $$
DECLARE
  user_org_id uuid;
BEGIN
  SELECT org_id INTO user_org_id FROM auth_users
  WHERE id = user_id
  LIMIT 1;

  -- Se usuário root (admin), retornar org default
  IF user_org_id IS NULL THEN
    SELECT id INTO user_org_id FROM organizations
    WHERE id = 'default'
    LIMIT 1;
  END IF;

  RETURN user_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verificar se função foi criada
SELECT routine_name FROM information_schema.routines
WHERE routine_name = 'get_user_org_id';


-- ✅ PASSO 2: Criar função para JWT Claims
-- Esta função será chamada no JWT Hook

CREATE OR REPLACE FUNCTION public.jwt_claim_org_id(auth_user auth.users)
RETURNS json AS $$
DECLARE
  user_org_id uuid;
  user_role text;
BEGIN
  -- Buscar org_id da tabela auth_users
  SELECT org_id, role INTO user_org_id, user_role
  FROM public.auth_users
  WHERE id = auth_user.id
  LIMIT 1;

  -- Se não encontrou, usar org default para root
  IF user_org_id IS NULL THEN
    SELECT id INTO user_org_id FROM organizations
    WHERE id = 'default'
    LIMIT 1;
    user_role := 'root';
  END IF;

  -- Retornar JSON com claims
  RETURN json_build_object(
    'org_id', user_org_id::text,
    'role', user_role,
    'user_id', auth_user.id::text
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verificar se função foi criada
SELECT routine_name FROM information_schema.routines
WHERE routine_name = 'jwt_claim_org_id';


-- ✅ PASSO 3: Verificar que auth_users tem org_id
-- Supabase Dashboard > Database > auth_users

-- Query: Ver estrutura de auth_users
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'auth_users'
ORDER BY ordinal_position;

-- Deve ter: id, org_id, email, name, role, cpf, created_at, updated_at


-- ✅ PASSO 4: Criar index para performance
-- Ajuda RLS a filtrar rapidamente por org_id

CREATE INDEX IF NOT EXISTS idx_auth_users_org_id
  ON auth_users(org_id);

CREATE INDEX IF NOT EXISTS idx_jewelry_certificates_org_id
  ON jewelry_certificates(org_id);

CREATE INDEX IF NOT EXISTS idx_customers_org_id
  ON customers(org_id);

CREATE INDEX IF NOT EXISTS idx_organizations_id
  ON organizations(id);

-- Verificar indexes
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE indexname LIKE 'idx_%org_id%' OR indexname LIKE 'idx_organizations%';


-- ✅ PASSO 5: Criar organização default (para testes)
-- Se ainda não existir

INSERT INTO organizations (id, name, cnpj, created_at, updated_at)
VALUES (
  'default',
  'Organização Padrão (Testes)',
  '00.000.000/0000-00',
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;

-- Verificar organizações
SELECT id, name FROM organizations LIMIT 10;


-- ✅ PASSO 6: Criar usuário ROOT de teste
-- IMPORTANTE: Use o email do admin!

-- Buscar usuário root pelo email
SELECT id, email, user_metadata
FROM auth.users
WHERE email = 'andreluiz.colen@gmail.com';

-- Se existir, criar entrada em auth_users
INSERT INTO auth_users (id, org_id, email, name, role, created_at, updated_at)
SELECT
  auth.users.id,
  'default',
  auth.users.email,
  COALESCE(auth.users.user_metadata->>'display_name', 'Administrador'),
  'root',
  auth.users.created_at,
  now()
FROM auth.users
WHERE email = 'andreluiz.colen@gmail.com'
ON CONFLICT (id) DO NOTHING;

-- Verificar auth_users
SELECT id, email, role, org_id FROM auth_users LIMIT 10;


-- ✅ PASSO 7: Verificar RLS está habilitado

-- Tabelas que DEVEM ter RLS:
-- - organizations ✅
-- - auth_users ✅
-- - jewelry_certificates ✅
-- - customers ✅
-- - maintenance_records ✅
-- - audit_logs (será criada na Fase 4.3) ✅

SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('organizations', 'auth_users', 'jewelry_certificates', 'customers', 'maintenance_records')
ORDER BY tablename;

-- Se rowsecurity = false, habilitar:
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE jewelry_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;


-- ✅ PASSO 8: Listar políticas RLS existentes

SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename IN ('organizations', 'auth_users', 'jewelry_certificates', 'customers')
ORDER BY tablename, policyname;


-- ✅ PASSO 9: Testar função JWT_CLAIM_ORG_ID

-- Chamada de teste (pode não funcionar se user não tiver org_id ainda)
-- SELECT jwt_claim_org_id(auth.users) FROM auth.users LIMIT 1;


-- ✅ PASSO 10: Configurar JWT Hook no Supabase
-- ⚠️  MANUAL STEP:
-- 1. Abra: https://app.supabase.com/project/[SEU-PROJECT-ID]/settings/auth
-- 2. Vá para: JWT Configuration
-- 3. JSON Web Token (JWT) > Custom Claims
-- 4. Cole esse código:
/*
{
  "org_id": "SELECT CASE WHEN EXISTS(SELECT 1 FROM public.auth_users WHERE id = auth.uid()) THEN (SELECT org_id::text FROM public.auth_users WHERE id = auth.uid()) ELSE 'default' END",
  "role": "SELECT CASE WHEN EXISTS(SELECT 1 FROM public.auth_users WHERE id = auth.uid()) THEN (SELECT role FROM public.auth_users WHERE id = auth.uid()) ELSE 'root' END",
  "email": "auth.email()"
}
*/

-- OU use via SQL Hook:
-- SELECT jwt_claim_org_id(auth.users);


-- ✅ VERIFICAÇÃO FINAL

-- 1. Funções criadas
SELECT routine_name FROM information_schema.routines
WHERE routine_name LIKE 'get_user%' OR routine_name LIKE 'jwt%'
ORDER BY routine_name;

-- 2. Tabelas com RLS
SELECT tablename, rowsecurity FROM pg_tables
WHERE tablename IN ('organizations', 'auth_users', 'jewelry_certificates', 'customers')
AND schemaname = 'public'
ORDER BY tablename;

-- 3. Organizações
SELECT id, name FROM organizations;

-- 4. Usuários auth
SELECT id, email, role, org_id FROM auth_users;

-- 5. Índices de performance
SELECT indexname FROM pg_indexes
WHERE indexname LIKE 'idx_%org_id%'
OR indexname LIKE 'idx_organizations%';

-- ✅ Se tudo passou, próximo passo:
-- Modificar backend (server.ts) para usar org_id do JWT
