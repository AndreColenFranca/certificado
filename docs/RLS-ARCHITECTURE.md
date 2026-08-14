# RLS Architecture - Como Funciona o Isolamento de Dados

## 🔐 Diagrama de Fluxo

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                             │
├─────────────────────────────────────────────────────────────────┤
│  User: cliente@example.com                                       │
│  Token JWT: eyJhbGc...org_id: "default"...}                      │
│                                                                   │
│  ↓ GET /api/certificates                                         │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js)                             │
├─────────────────────────────────────────────────────────────────┤
│  1. Recebe requisição com token JWT                              │
│  2. Extrai org_id do token                                       │
│  3. Chama: getCertificates(supabase)                             │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                  SUPABASE (PostgreSQL)                           │
├─────────────────────────────────────────────────────────────────┤
│  SELECT * FROM jewelry_certificates                             │
│  WHERE auth.jwt() ->> 'org_id' = '...'                          │
│                                                                   │
│  ✅ RLS Policy: "Users can view their org certificates"         │
│     ✓ Filtra automaticamente por org_id                         │
│     ✓ Bloqueia acesso a outras organizações                     │
│     ✓ Retorna apenas dados da org_id do usuário                 │
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                             │
├─────────────────────────────────────────────────────────────────┤
│  Response: [ Cert1, Cert2, ... ]                                 │
│  (Apenas certificados da organização do usuário)                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Exemplo Prático

### Cenário: Duas Organizações

```
┌─────────────────────────┐         ┌──────────────────────────┐
│  Organização A          │         │  Organização B           │
├─────────────────────────┤         ├──────────────────────────┤
│ org_id: "org-a"         │         │ org_id: "org-b"          │
│ Usuários:               │         │ Usuários:                │
│  • alice@org-a.com      │         │  • bob@org-b.com         │
│  • charlie@org-a.com    │         │  • diana@org-b.com       │
│                         │         │                          │
│ Certificados:           │         │ Certificados:            │
│  ✓ CERT-A-001           │         │  ✓ CERT-B-001           │
│  ✓ CERT-A-002           │         │  ✓ CERT-B-002           │
│  ✓ CERT-A-003           │         │  ✓ CERT-B-003           │
└─────────────────────────┘         └──────────────────────────┘
```

### Query sem RLS (perigoso!)
```sql
SELECT * FROM jewelry_certificates;
-- Retorna: CERT-A-001, CERT-A-002, CERT-A-003, CERT-B-001, CERT-B-002, CERT-B-003
-- ❌ Qualquer usuário vê certificados de TODAS as orgs!
```

### Query com RLS (seguro!)
```sql
-- Como alice@org-a.com
SELECT * FROM jewelry_certificates;
-- RLS filtra automaticamente:
-- Retorna: CERT-A-001, CERT-A-002, CERT-A-003
-- ✅ alice só vê seus certificados

-- Como bob@org-b.com
SELECT * FROM jewelry_certificates;
-- RLS filtra automaticamente:
-- Retorna: CERT-B-001, CERT-B-002, CERT-B-003
-- ✅ bob só vê seus certificados
```

---

## 🔑 JWT e Claims

### Exemplo de JWT Decodificado

```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "email": "alice@org-a.com",
  "email_verified": true,
  "aud": "authenticated",
  "iat": 1672531200,
  "exp": 1672617600,
  
  "org_id": "org-a",     // ← Claim customizado
  "role": "admin",        // ← Claim customizado
  "user_metadata": {
    "full_name": "Alice Silva"
  }
}
```

### Como RLS Usa o JWT

```sql
-- Na política RLS:
CREATE POLICY "Users can view their org certificates"
  ON jewelry_certificates
  FOR SELECT
  USING (
    -- auth.jwt() extrai os claims do token
    -- ->> 'org_id' pega o valor de org_id
    org_id = (auth.jwt() ->> 'org_id')::text
  );
```

---

## 🔄 Diferentes Cenários

### Scenario 1: Usuário Tenta Ver Dados de Outra Org

```
alice@org-a.com tenta GET /api/certificates

Seu token JWT tem: org_id = "org-a"
Tenta query: SELECT * FROM jewelry_certificates WHERE id = 'CERT-B-001'

RLS Valida:
  - jewelry_certificates.org_id = 'org-b'
  - auth.jwt() ->> 'org_id' = 'org-a'
  - 'org-b' ≠ 'org-a' → ❌ BLOQUEADO

Response: 403 Forbidden
```

### Scenario 2: Backend (Service Role) Acessa Dados

```
Backend chama com SERVICE_ROLE_KEY

Service Role Key bypass RLS automaticamente!
Portanto:
  - SELECT * FROM jewelry_certificates → retorna TUDO
  - INSERT certificado em qualquer org → sucesso
  - DELETE de qualquer org → sucesso

⚠️ IMPORTANTE: Nunca expor SERVICE_ROLE_KEY no frontend!
```

### Scenario 3: Novo Usuário Criado

```
1. Usuário faz sign up: novo@org-a.com
2. Backend cria usuário no Supabase Auth
3. Backend insere em user_orgs:
   INSERT INTO user_orgs (user_id, org_id) VALUES ('...', 'org-a')
4. Próximo login:
   - JWT inclui org_id = 'org-a'
   - RLS filtra dados por 'org-a'
   - Usuário vê apenas dados da sua org
```

---

## 🛡️ Segurança em Camadas

```
┌─────────────────────────────────────────┐
│  Camada 1: Frontend (React)              │
│  - Usa ANON_KEY (público, com RLS)      │
│  - Não pode contornar RLS               │
├─────────────────────────────────────────┤
│  Camada 2: API (Node.js)                │
│  - Valida autenticação                  │
│  - Extrai org_id do token               │
│  - Passa org_id para queries Supabase   │
├─────────────────────────────────────────┤
│  Camada 3: Database (PostgreSQL)        │
│  - RLS policies aplicadas               │
│  - Filtra dados por org_id              │
│  - Service Role bypassa (admin only)    │
├─────────────────────────────────────────┤
│  Camada 4: Network                      │
│  - SSL/TLS encryption                   │
│  - HTTPS only                           │
└─────────────────────────────────────────┘
```

---

## ✅ Checklist de Segurança

- [ ] RLS habilitado em `jewelry_certificates`
- [ ] RLS habilitado em `customers`
- [ ] Políticas implementadas para SELECT, INSERT, UPDATE, DELETE
- [ ] SERVICE_ROLE_KEY não exposto no frontend
- [ ] ANON_KEY configurada com RLS policies
- [ ] JWT inclui org_id em todos os tokens
- [ ] Tabela `user_orgs` mapeando usuários → orgs
- [ ] Índices criados em colunas org_id (performance)
- [ ] Testes de isolamento de dados passando
- [ ] Documentação clara para o time

---

## 🚀 Próximos Passos

1. **Executar SQL**: CREATE-USER-ORGS-TABLE.sql
2. **Executar SQL**: RLS-POLICIES.sql
3. **Atualizar Backend**: Adicionar org_id a inserts
4. **Testar**: Isolamento de dados
5. **Documentar**: Processos para novas orgs

---

## 📚 Recursos

- [Como funciona RLS](https://supabase.com/docs/guides/auth/row-level-security-guide)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/sql-security-label.html)
- [JWT Claims Customizados](https://supabase.com/docs/guides/auth/jwts)
