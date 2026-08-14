-- ============================================
-- Tabela: user_orgs
-- Mapeia usuários para organizações
-- Necessária para RLS funcionar com JWT
-- ============================================

-- Criar tabela user_orgs
CREATE TABLE IF NOT EXISTS user_orgs (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id TEXT NOT NULL DEFAULT 'default',
  role TEXT NOT NULL DEFAULT 'member', -- member, admin, owner
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para queries rápidas
CREATE INDEX IF NOT EXISTS idx_user_orgs_org_id ON user_orgs(org_id);
CREATE INDEX IF NOT EXISTS idx_user_orgs_user_id ON user_orgs(user_id);

-- Permitir que usuários vejam sua própria organização
ALTER TABLE user_orgs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own org mapping"
  ON user_orgs
  FOR SELECT
  USING (auth.uid() = user_id::text);

-- ============================================
-- Tabela: organizations
-- Metadados das organizações
-- ============================================

CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  website TEXT,
  country TEXT DEFAULT 'BR',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_organizations_id ON organizations(id);

-- RLS para organizations
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org details"
  ON organizations
  FOR SELECT
  USING (
    id IN (
      SELECT org_id FROM user_orgs WHERE user_id::text = auth.uid()
    )
  );

-- ============================================
-- DADOS INICIAIS
-- ============================================

-- Inserir organização padrão
INSERT INTO organizations (id, name, description, website, country)
VALUES (
  'default',
  'Default Organization',
  'Organização padrão do sistema',
  'https://example.com',
  'BR'
)
ON CONFLICT (id) DO NOTHING;

-- Inserir dados de usuário raiz
-- Nota: Você precisa conseguir o user_id do seu usuário raiz via Supabase Auth
-- Exemplo: andreluiz.colen@gmail.com
-- INSERT INTO user_orgs (user_id, org_id, role)
-- VALUES ('seu-user-id-aqui', 'default', 'owner')
-- ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- TRIGGER para atualizar updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para organizations
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para user_orgs
DROP TRIGGER IF EXISTS update_user_orgs_updated_at ON user_orgs;
CREATE TRIGGER update_user_orgs_updated_at
  BEFORE UPDATE ON user_orgs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VERIFICAÇÃO
-- ============================================

-- Ver estrutura da tabela
SELECT * FROM user_orgs LIMIT 0;
SELECT * FROM organizations LIMIT 0;

-- Ver dados existentes
SELECT * FROM organizations;
SELECT * FROM user_orgs;
