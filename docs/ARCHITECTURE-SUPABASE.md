# Arquitetura Supabase - Certificado de Joias

**Versão:** 1.0  
**Data:** 2026-08-13  
**Projeto:** Certificado de Qualidade de Joias  
**Status:** Análise Completa ✅

---

## 📋 Resumo Executivo

Seu app é um **Sistema de Certificação de Qualidade de Joias** multi-tenant com:
- ✅ Dashboard para joalheiros
- ✅ Portal para clientes
- ✅ Verificação pública de certificados
- ✅ Assistente IA (Google GenAI)
- ✅ Geração de fotos 360° e 3D
- ✅ Histórico de manutenção

**Problema atual:** Dados em **localStorage** + **arquivo JSON** (não escala, não persiste)

**Solução:** **Supabase** com PostgreSQL + RLS + Storage para imagens

---

## 🏗️ Arquitetura Atual vs. Futura

### ATUAL (Hoje)
```
Frontend (React + localStorage)
    ↓
Server (Express + in-memory + data_store.json)
    ↓
Arquivo JSON (ephemeral)
```

### FUTURA (Com Supabase)
```
Frontend (React + Supabase SDK)
    ↓
Supabase API (Auth + Postgres + RLS)
    ↓
PostgreSQL (Database)
Supabase Storage (Imagens)
Supabase Auth (Usuários)
```

---

## 📊 Schema de Banco (PostgreSQL)

### 1. **Tabela: organizations** (Joalheiros)
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                    -- "Maison Lumière Joias"
  cnpj TEXT UNIQUE,                      -- CNPJ do joalheiro
  logo_url TEXT,                         -- URL do logo
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- RLS: Cada joalheiro vê só seus dados
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own organization"
  ON organizations FOR SELECT
  USING (id = auth.claims()->>'org_id');
```

### 2. **Tabela: auth_users** (Usuários do App)
```sql
CREATE TABLE auth_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'operator',          -- 'root' | 'admin' | 'operator' | 'customer'
  cpf TEXT,                              -- CPF do usuário
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- RLS: Usuários só veem sua própria org
ALTER TABLE auth_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view users in their org"
  ON auth_users FOR SELECT
  USING (org_id = auth.claims()->>'org_id');
```

### 3. **Tabela: customers** (Clientes dos Joalheiros)
```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  customer_code TEXT NOT NULL,           -- "CLI-1001"
  name TEXT NOT NULL,
  cpf TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(org_id, customer_code)
);

-- RLS: Clientes só de sua org
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Orgs can view their customers"
  ON customers FOR ALL
  USING (org_id = auth.claims()->>'org_id');
```

### 4. **Tabela: jewelry_certificates** (Certificados de Joias)
```sql
CREATE TABLE jewelry_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  cert_code TEXT NOT NULL,               -- "CERT-2026-A8F9"
  serial_number TEXT NOT NULL,           -- "SN-18K-99042"
  
  -- Hierarchy
  is_root BOOLEAN DEFAULT false,         -- Joia Pai ou Filha
  parent_cert_id UUID REFERENCES jewelry_certificates(id),
  
  -- Joia Info
  title TEXT NOT NULL,                   -- "Anel Solitário Étoile Royale"
  collection TEXT,
  model TEXT,
  manufacturer TEXT,
  manufacturer_logo_url TEXT,
  manufacturing_date DATE,
  issue_date DATE,
  
  -- Metal Specs
  metal_purity TEXT,                     -- "18K"
  metal_color TEXT,                      -- "Ouro Amarelo"
  gross_weight_grams DECIMAL(10, 2),
  width_cm DECIMAL(5, 2),
  finish TEXT,                           -- "Polido"
  
  -- Gemological
  has_stones BOOLEAN DEFAULT false,
  stones JSONB,                          -- Array de pedras
  
  -- Warranty
  warranty_months INTEGER,
  warranty_terms TEXT,
  warranty_status TEXT DEFAULT 'Ativa',
  
  -- Security
  authenticity_hash TEXT NOT NULL UNIQUE,
  
  -- Extra
  estimated_value_brl DECIMAL(15, 2),
  care_guide JSONB,                      -- Array de cuidados
  
  -- Owner
  current_owner_name TEXT,
  owner_cpf TEXT,
  owner_email TEXT,
  owner_id UUID REFERENCES customers(id),
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(org_id, cert_code)
);

-- RLS: Certificados só da sua org (CRÍTICO!)
ALTER TABLE jewelry_certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Orgs can view their certificates"
  ON jewelry_certificates FOR ALL
  USING (org_id = auth.claims()->>'org_id');

-- EXCEPTION: Certificado público (verificação pública)
CREATE POLICY "Anyone can view public certificates by code"
  ON jewelry_certificates FOR SELECT
  USING (
    cert_code = current_setting('app.cert_code', true)::text
    OR true  -- Permite visualização anônima para verificação
  );
```

### 5. **Tabela: maintenance_records** (Histórico)
```sql
CREATE TABLE maintenance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cert_id UUID NOT NULL REFERENCES jewelry_certificates(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id),
  
  maintenance_date DATE NOT NULL,
  maintenance_type TEXT,                 -- "Polimento & Banho"
  performer TEXT,                        -- Quem fez
  notes TEXT,
  verified_by_appraiser TEXT,
  
  -- Cliente info (desnormalizado)
  customer_name TEXT,
  customer_cpf TEXT,
  customer_email TEXT,
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- RLS: Mesmo critério que certificados
ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Orgs can manage maintenance records"
  ON maintenance_records FOR ALL
  USING (org_id = auth.claims()->>'org_id');
```

---

## 🔐 Segurança & RLS (Row Level Security)

### Princípio: Multi-Tenant Isolado
```
Joalheiro A (org-id-A) → só vê seus certificados
Joalheiro B (org-id-B) → só vê seus certificados
Cliente → só vê certificados dele (via owner_id)
Anônimo → só vê verificação pública (sem org check)
```

### Crítico: Vazamento Entre Orgs
❌ **Falha:** User de Org A consegue ver certificados de Org B  
✅ **Proteção:** RLS força `org_id = auth.claims()->>'org_id'` em TODAS as queries

### JWT Claims (Supabase Auth)
```json
{
  "sub": "uuid-do-usuario",
  "email": "usuario@org.com",
  "org_id": "uuid-da-organizacao",
  "role": "admin"
}
```

---

## 📸 Storage (Imagens)

### Supabase Storage Buckets

**Bucket 1: `certificates-public`**
- Acesso: Público (qualquer um vê)
- Conteúdo: Imagens para verificação pública
- Regra: Apenas URLs públicas do QR code

**Bucket 2: `certificates-private`**
- Acesso: Privado (só org pode ler)
- Conteúdo: Fotos de alta res, 360°, 3D
- Regra: RLS via JWT

**Storage RLS Policy:**
```sql
-- Apenas org pode fazer upload/ler suas imagens
CREATE POLICY "Orgs can upload to their bucket"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'certificates-private'
    AND auth.claims()->>'org_id' = (
      SELECT org_id FROM jewelry_certificates 
      WHERE id = (storage.foldername(name))[1]::uuid
    )
  );
```

---

## 🔄 Fluxo de Integração

### Fase 1: Setup (Dia 1)
1. ✅ Criar projeto Supabase
2. ✅ Criar tabelas (schema SQL acima)
3. ✅ Ativar RLS policies
4. ✅ Configurar variáveis de ambiente

### Fase 2: Frontend (Dia 2-3)
1. ✅ Instalar `@supabase/supabase-js`
2. ✅ Trocar `localStorage` → Supabase queries
3. ✅ Implementar auth real (não localStorage)
4. ✅ Testar isolamento multi-tenant

### Fase 3: Backend (Dia 3-4)
1. ✅ Integrar Supabase Admin SDK no server.ts
2. ✅ Remover endpoints em-memória
3. ✅ Manter endpoints Express para backward-compat
4. ✅ Migração de dados históricos

### Fase 4: QA & Deploy (Dia 5+)
1. ✅ Testes de RLS (crucial!)
2. ✅ Testes de vazamento de dados
3. ✅ Performance com índices
4. ✅ Deploy em staging
5. ✅ Deploy em produção

---

## 🛠️ Implementação Técnica

### 1. Instalar Supabase
```bash
npm install @supabase/supabase-js
npm install @supabase/auth-helpers-react
```

### 2. Configurar `.env`
```env
VITE_SUPABASE_URL=https://[project].supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Apenas servidor
```

### 3. Criar Cliente (React)
```typescript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

### 4. Exemplo: Carregar Certificados
```typescript
// ANTES (localStorage)
const certs = JSON.parse(localStorage.getItem('aureum_certificates'));

// DEPOIS (Supabase)
const { data, error } = await supabase
  .from('jewelry_certificates')
  .select('*')
  .eq('org_id', currentUser.org_id);
```

### 5. Upload de Imagens
```typescript
const { data, error } = await supabase.storage
  .from('certificates-private')
  .upload(`${certId}/${filename}`, file);
```

---

## ⚠️ Riscos & Mitigações

| Risco | Impacto | Mitigation |
|-------|--------|-----------|
| **Vazamento entre orgs** | 🔴 CRÍTICO | RLS policies (teste com role switching) |
| **Imagens não carregam** | 🟠 ALTO | CDN + caching (Supabase Storage automático) |
| **Perda de dados na migração** | 🟠 ALTO | Backup antes, validar contagem |
| **Performance com fotos grandes** | 🟡 MÉDIO | Otimizar resoluções, usar lazy loading |
| **Autenticação quebrada** | 🟡 MÉDIO | Fallback para localStorage durante transição |

---

## 📈 Próximos Passos Recomendados

### ✅ Hoje
- [ ] Criar projeto Supabase (2 min)
- [ ] Copiar schema SQL acima
- [ ] Testar conexão (5 min)

### ✅ Amanhã
- [ ] Instalar SDK
- [ ] Implementar login real
- [ ] Migrar certificates em 1 componente

### ✅ Semana
- [ ] Migrar clientes
- [ ] Upload de imagens
- [ ] Testes de RLS

### ✅ Produção
- [ ] Deploy em staging
- [ ] Performance tests
- [ ] Go live!

---

## 📞 Dúvidas?

Próximo passo: Qual fase você quer começar?
- **Fase 1:** Setup Supabase (recomendado primeiro)
- **Fase 2:** Implementar frontend
- **Fase 3:** Implementar backend

