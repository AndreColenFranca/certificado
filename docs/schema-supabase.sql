-- ============================================
-- Supabase Schema for Certificado de Joias
-- ============================================
-- Execute this SQL in Supabase SQL Editor
-- ============================================

-- 1. ORGANIZATIONS (Joalheiros/Empresas)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cnpj TEXT UNIQUE,
  logo_url TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization"
  ON organizations FOR SELECT
  USING (id = (auth.jwt() ->> 'org_id')::uuid);

CREATE POLICY "Organization admins can update"
  ON organizations FOR UPDATE
  USING (id = (auth.jwt() ->> 'org_id')::uuid);

-- 2. AUTH_USERS (Usuários do Sistema)
CREATE TABLE IF NOT EXISTS auth_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'operator' CHECK (role IN ('root', 'admin', 'operator', 'customer')),
  cpf TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

ALTER TABLE auth_users ENABLE ROW LEVEL SECURITY;

-- NOTA: Políticas RLS para auth_users estão em FASE4-RLS-SETUP.sql
-- Não defina aqui para evitar conflitos com a configuração completa
-- Descomente abaixo só se não estiver usando FASE4-RLS-SETUP.sql:

/*
CREATE POLICY "view_org_users" ON auth_users
  FOR SELECT
  USING (org_id::text = (auth.jwt() ->> 'org_id'));

CREATE POLICY "manage_org_users" ON auth_users
  FOR ALL
  USING (
    org_id::text = (auth.jwt() ->> 'org_id')
    AND (auth.jwt() ->> 'role') IN ('root', 'admin')
  )
  WITH CHECK (
    org_id::text = (auth.jwt() ->> 'org_id')
  );
*/

-- 3. CUSTOMERS (Clientes dos Joalheiros)
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_code TEXT NOT NULL,
  name TEXT NOT NULL,
  cpf TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(org_id, customer_code)
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations can view their customers"
  ON customers FOR SELECT
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

CREATE POLICY "Organizations can manage their customers"
  ON customers FOR ALL
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- 4. JEWELRY_CERTIFICATES (Certificados de Joias)
CREATE TABLE IF NOT EXISTS jewelry_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  cert_code TEXT NOT NULL,
  serial_number TEXT NOT NULL,

  -- Hierarchy
  is_root BOOLEAN DEFAULT false,
  parent_cert_id UUID REFERENCES jewelry_certificates(id) ON DELETE SET NULL,

  -- Joia Info
  title TEXT NOT NULL,
  collection TEXT,
  model TEXT,
  manufacturer TEXT,
  manufacturer_logo_url TEXT,
  manufacturing_date DATE,
  issue_date DATE,

  -- Metal Specs
  metal_purity TEXT,
  metal_color TEXT,
  gross_weight_grams NUMERIC(10, 2),
  width_cm NUMERIC(5, 2),
  finish TEXT,

  -- Gemological
  has_stones BOOLEAN DEFAULT false,
  stones JSONB,

  -- Warranty
  warranty_months INTEGER,
  warranty_terms TEXT,
  warranty_status TEXT DEFAULT 'Ativa' CHECK (warranty_status IN ('Ativa', 'Expirada', 'Em Manutenção', 'Vitalícia')),

  -- Security
  authenticity_hash TEXT NOT NULL UNIQUE,

  -- Extra
  estimated_value_brl NUMERIC(15, 2),
  care_guide JSONB,

  -- Owner
  current_owner_name TEXT,
  owner_cpf TEXT,
  owner_email TEXT,
  owner_id UUID REFERENCES customers(id) ON DELETE SET NULL,

  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(org_id, cert_code)
);

ALTER TABLE jewelry_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations can view their certificates"
  ON jewelry_certificates FOR SELECT
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

CREATE POLICY "Organizations can manage their certificates"
  ON jewelry_certificates FOR ALL
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- Public certificate verification (anyone can view by cert_code)
CREATE POLICY "Anyone can view public certificate info"
  ON jewelry_certificates FOR SELECT
  USING (true);

-- 5. MAINTENANCE_RECORDS (Histórico de Manutenção)
CREATE TABLE IF NOT EXISTS maintenance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cert_id UUID NOT NULL REFERENCES jewelry_certificates(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  maintenance_date DATE NOT NULL,
  maintenance_type TEXT,
  performer TEXT,
  notes TEXT,
  verified_by_appraiser TEXT,

  -- Customer info (denormalized)
  customer_name TEXT,
  customer_cpf TEXT,
  customer_email TEXT,

  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations can view their maintenance records"
  ON maintenance_records FOR SELECT
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

CREATE POLICY "Organizations can manage their maintenance records"
  ON maintenance_records FOR ALL
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- ============================================
-- INDEXES (Performance)
-- ============================================

CREATE INDEX idx_auth_users_org_id ON auth_users(org_id);
CREATE INDEX idx_auth_users_email ON auth_users(email);

CREATE INDEX idx_customers_org_id ON customers(org_id);
CREATE INDEX idx_customers_cpf ON customers(cpf);

CREATE INDEX idx_jewelry_certs_org_id ON jewelry_certificates(org_id);
CREATE INDEX idx_jewelry_certs_cert_code ON jewelry_certificates(cert_code);
CREATE INDEX idx_jewelry_certs_serial ON jewelry_certificates(serial_number);
CREATE INDEX idx_jewelry_certs_owner_id ON jewelry_certificates(owner_id);
CREATE INDEX idx_jewelry_certs_parent ON jewelry_certificates(parent_cert_id);
CREATE INDEX idx_jewelry_certs_authenticity ON jewelry_certificates(authenticity_hash);

CREATE INDEX idx_maintenance_cert_id ON maintenance_records(cert_id);
CREATE INDEX idx_maintenance_org_id ON maintenance_records(org_id);
CREATE INDEX idx_maintenance_date ON maintenance_records(maintenance_date);

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Insert a test organization
INSERT INTO organizations (name, cnpj)
VALUES ('Maison Lumière Joias', '12.345.678/0001-90')
ON CONFLICT DO NOTHING;

-- Get the org_id for the insert
WITH org AS (
  SELECT id FROM organizations WHERE cnpj = '12.345.678/0001-90' LIMIT 1
)
INSERT INTO customers (org_id, customer_code, name, cpf, email, phone)
SELECT
  org.id,
  'CLI-1001',
  'Helena Cavalcanti de Albuquerque',
  '123.456.789-01',
  'helena.albuquerque@maisonlumiere.com.br',
  '(11) 98765-4321'
FROM org
ON CONFLICT DO NOTHING;

-- ============================================
-- Storage Buckets (Configure in Supabase UI)
-- ============================================
-- Create these buckets manually in Supabase Storage:
-- 1. certificates-public (Public, for certificate images)
-- 2. certificates-private (Private, for high-res images)
-- 3. logos (Public, for company logos)
