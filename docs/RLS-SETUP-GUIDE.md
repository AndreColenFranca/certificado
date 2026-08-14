# Row Level Security (RLS) - Guia de Implementação

## 🔒 O que é RLS?

Row Level Security é um recurso PostgreSQL que permite restringir quais linhas cada usuário pode ver/modificar em uma tabela. É essencial para multi-tenancy.

**Exemplo:**
- Usuário da Org A só vê certificados onde `org_id = 'org-a'`
- Usuário da Org B só vê certificados onde `org_id = 'org-b'`
- Service Role (backend) vê tudo (bypassa RLS)

---

## 📋 Pré-requisitos

1. ✅ Tabelas com coluna `org_id` (já criadas)
2. ✅ Usuários com claim `org_id` no JWT (implementar)
3. ✅ Políticas SQL (ver `RLS-POLICIES.sql`)

---

## 🚀 Como Implementar

### Passo 1: Executar SQL no Supabase

1. Vá para **Supabase Dashboard > SQL Editor**
2. Cole o conteúdo de `RLS-POLICIES.sql`
3. Clique em **Run**

**Ou use o script:**
```bash
# Substitua os valores
SUPABASE_URL=https://seu-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=seu_service_role_key

curl -X POST "${SUPABASE_URL}/rest/v1/rpc/exec" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d @RLS-POLICIES.sql
```

### Passo 2: Adicionar `org_id` ao JWT

Quando um usuário faz login, seu token JWT deve incluir:
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "org_id": "default"  // ← IMPORTANTE
}
```

**No Supabase, adicione via:**
1. **Auth > Providers > Email/Password**
2. **JWT Settings** (adicionar custom claim)
3. Ou via função SQL `handle_new_user()`

### Passo 3: Testar RLS

#### Test 1: Login como Cliente
```bash
# Cliente faz login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"cliente@test.com","password":"pass123"}'

# Pegue o token JWT da resposta
# Decodifique em jwt.io para verificar org_id
```

#### Test 2: Verificar Isolamento
```bash
# Como cliente1 (org_id = 'org-1')
curl -X GET http://localhost:3000/api/certificates \
  -H "Authorization: Bearer ${TOKEN_CLIENT_1}"
# Retorna apenas certificados onde org_id = 'org-1'

# Como cliente2 (org_id = 'org-2')
curl -X GET http://localhost:3000/api/certificates \
  -H "Authorization: Bearer ${TOKEN_CLIENT_2}"
# Retorna apenas certificados onde org_id = 'org-2'
```

#### Test 3: Tentar Acessar Dados de Outra Org (deve falhar)
```bash
# Cliente1 tenta deletar certificado da org-2
curl -X DELETE http://localhost:3000/api/certificates/CERT-ORG2-123 \
  -H "Authorization: Bearer ${TOKEN_CLIENT_1}"
# Erro: 403 Forbidden (RLS bloqueou)
```

---

## 🔄 Como RLS Funciona no Código

### Frontend (React)
```typescript
// useSupabaseQuery hook
const { data } = await supabase
  .from('jewelry_certificates')
  .select('*');
  
// Supabase automaticamente filtra por org_id do token JWT
// Usuário vê apenas seus certificados
```

### Backend (Node)
```typescript
// Service Role (bypassa RLS)
const result = await createCertificate(supabase, {
  ...cert,
  org_id: 'default'
});
// Salva em qualquer org_id

// Frontend (respeita RLS)
const result = await createCertificate(supabaseClient, {
  ...cert,
  org_id: 'default'  // Será bloqueado se org_id != token.org_id
});
```

---

## ⚠️ Cuidados Importantes

### 1. Não esqueça `org_id` ao Inserir
```typescript
// ❌ ERRADO - vai falhar com RLS
await supabase.from('certificates').insert([{ title: '...' }]);

// ✅ CORRETO
await supabase.from('certificates').insert([{
  title: '...',
  org_id: userOrgId  // Obrigatório!
}]);
```

### 2. Service Role Key Bypassa RLS
```typescript
// No servidor (Node), usar service role
const supabaseAdmin = createClient(URL, SERVICE_ROLE_KEY);
// Pode acessar qualquer org_id

// No cliente (React), usar anon key
const supabaseClient = createClient(URL, ANON_KEY);
// Respeita RLS automaticamente
```

### 3. Migração de Dados Existentes
Após ativar RLS, dados antigos sem `org_id` podem ficar invisíveis:
```sql
-- Adicionar org_id a todos os registros existentes
UPDATE jewelry_certificates
SET org_id = 'default'
WHERE org_id IS NULL;

UPDATE customers
SET org_id = 'default'
WHERE org_id IS NULL;
```

---

## 🛠️ Desativar RLS (Apenas para Debug)

```sql
-- ❌ Desativar RLS (APENAS EM DESENVOLVIMENTO!)
ALTER TABLE jewelry_certificates DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;

-- Reativar
ALTER TABLE jewelry_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
```

---

## 📊 Status da Implementação

- [ ] Executar SQL no Supabase
- [ ] Adicionar `org_id` ao JWT dos usuários
- [ ] Testar isolamento de dados
- [ ] Verificar que não pode acessar dados de outras orgs
- [ ] Documentar para time

---

## 🔗 Referências

- [Supabase RLS Docs](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [JWT Custom Claims](https://supabase.com/docs/guides/auth/jwt)
