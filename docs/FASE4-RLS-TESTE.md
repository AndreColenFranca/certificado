# FASE 4.2: RLS - Guia de Teste

**Objetivo:** Verificar que usuários de organizações diferentes não conseguem ver dados uns dos outros.

---

## 📋 Pré-requisitos

1. ✅ SQL de Fase 4.1 executado (JWT setup)
2. ✅ SQL de Fase 4.2 executado (RLS políticas)
3. ✅ 2 usuários criados em orgs diferentes
4. ✅ Backend rodando: `npm run dev`

---

## 🔑 Preparação: Criar 2 Usuários em Orgs Diferentes

### Opção 1: Criar via Supabase Dashboard (Recomendado)

1. Abrir: https://app.supabase.com/project/[ID]/auth/users
2. Criar User 1:
   - Email: `user-org1@test.com`
   - Password: `Test123!@#`
3. Ir para: SQL Editor > New Query
4. Executar:
   ```sql
   INSERT INTO auth_users (id, org_id, email, name, role, created_at, updated_at)
   SELECT 
     auth.users.id,
     'org-maison-lumiere',
     'user-org1@test.com',
     'Usuário Org 1',
     'admin',
     auth.users.created_at,
     now()
   FROM auth.users
   WHERE email = 'user-org1@test.com';
   ```

5. Criar User 2:
   - Email: `user-org2@test.com`
   - Password: `Test123!@#`
6. Executar:
   ```sql
   INSERT INTO auth_users (id, org_id, email, name, role, created_at, updated_at)
   SELECT 
     auth.users.id,
     'org-joias-imperatriz',
     'user-org2@test.com',
     'Usuário Org 2',
     'admin',
     auth.users.created_at,
     now()
   FROM auth.users
   WHERE email = 'user-org2@test.com';
   ```

7. Criar Org 2 (se não existir):
   ```sql
   INSERT INTO organizations (id, name, created_at, updated_at)
   VALUES ('org-joias-imperatriz', 'Joias Imperatriz', now(), now())
   ON CONFLICT (id) DO NOTHING;
   ```

---

## 🧪 Teste 1: Login e Obter Token

### Terminal - User 1

```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user-org1@test.com",
    "password": "Test123!@#"
  }' | jq .

# Salvar o token retornado
export TOKEN_ORG1="seu-token-aqui"

# Ou decodificar manualmente:
# 1. Copiar o token
# 2. Ir para: https://jwt.io/
# 3. Colar no "Encoded" e verificar org_id
# Deve retornar: "org_id": "org-maison-lumiere"
```

### Terminal - User 2

```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user-org2@test.com",
    "password": "Test123!@#"
  }' | jq .

export TOKEN_ORG2="seu-token-aqui"

# Verificar org_id no jwt.io
# Deve retornar: "org_id": "org-joias-imperatriz"
```

---

## 🧪 Teste 2: User 1 Vê Dados de Sua Org

```bash
# User 1 vê certificados da org-maison-lumiere
curl -H "Authorization: Bearer $TOKEN_ORG1" \
  http://localhost:3000/api/certificates | jq .

# ESPERADO: Array com certificados de org-maison-lumiere ✅
# {
#   "success": true,
#   "count": 3,
#   "data": [
#     { "id": "CERT-...", "org_id": "org-maison-lumiere", ... },
#     ...
#   ]
# }
```

---

## 🧪 Teste 3: User 2 Vê APENAS Dados de Sua Org

```bash
# User 2 vê certificados - mas APENAS de org-joias-imperatriz
curl -H "Authorization: Bearer $TOKEN_ORG2" \
  http://localhost:3000/api/certificates | jq .

# ESPERADO: Array VAZIO ou com certificados de org-joias-imperatriz APENAS ✅
# {
#   "success": true,
#   "count": 0,
#   "data": []
# }
# OU se houver certs em org-joias-imperatriz:
# {
#   "success": true,
#   "count": 2,
#   "data": [
#     { "id": "CERT-...", "org_id": "org-joias-imperatriz", ... }
#   ]
# }
```

---

## 🚨 Teste 4: User 1 Tenta Acessar com Outro org_id (DEVE FALHAR)

```bash
# Simular token forjado (se conseguisse)
# Na realidade, o RLS vai bloquear mesmo que o middleware não valide

curl -H "Authorization: Bearer TOKEN_INVALIDO" \
  http://localhost:3000/api/certificates | jq .

# ESPERADO: 401 Unauthorized ou erro de autenticação ✅
```

---

## 🧪 Teste 5: Criar Certificado e Verificar org_id

### User 1 Cria Certificado

```bash
curl -X POST http://localhost:3000/api/certificates \
  -H "Authorization: Bearer $TOKEN_ORG1" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Anel Ouro Org1",
    "serialNumber": "SN-ORG1-001",
    "metal_purity": "18K",
    "gross_weight_grams": 5.5
  }' | jq .

# ESPERADO: Certificado criado com org_id: "org-maison-lumiere" ✅
```

### User 2 Tenta Ver (DEVE FALHAR ou não ver)

```bash
# User 2 faz GET de certificados
curl -H "Authorization: Bearer $TOKEN_ORG2" \
  http://localhost:3000/api/certificates | jq .

# ESPERADO: NÃO vê o certificado de User 1 ✅
# Ele só vê certificados da org-joias-imperatriz
```

---

## 🧪 Teste 6: RLS no Banco Verificado via SQL

### Verificar que RLS está bloqueando

```sql
-- Execute no SQL Editor como admin (com service role key)

-- Query 1: Ver certificados de User 1 (org-maison-lumiere)
SELECT org_id, title FROM jewelry_certificates
WHERE org_id = 'org-maison-lumiere';

-- Query 2: Ver certificados de User 2 (org-joias-imperatriz)
SELECT org_id, title FROM jewelry_certificates
WHERE org_id = 'org-joias-imperatriz';

-- Query 3: Ver clientes de User 1
SELECT org_id, name FROM customers
WHERE org_id = 'org-maison-lumiere';

-- Query 4: Ver clientes de User 2
SELECT org_id, name FROM customers
WHERE org_id = 'org-joias-imperatriz';
```

---

## ✅ Checklist: Testes Passaram?

- [ ] User 1 faz login e recebe token com org_id correto
- [ ] User 2 faz login e recebe token com org_id correto
- [ ] User 1 vê APENAS dados de org-maison-lumiere
- [ ] User 2 vê APENAS dados de org-joias-imperatriz
- [ ] User 1 não consegue ver dados de User 2
- [ ] User 2 não consegue ver dados de User 1
- [ ] Certificado criado por User 1 tem org_id correto
- [ ] Certificado de User 1 não aparece para User 2

---

## 🐛 Se Algo Não Funcionar

### Problema: User vê dados de outra org

**Possível causa:** RLS não está habilitado ou políticas estão erradas

```bash
# 1. Verificar RLS habilitado
SELECT tablename, rowsecurity FROM pg_tables
WHERE tablename = 'jewelry_certificates';
# Deve retornar: rowsecurity = true

# 2. Verificar políticas
SELECT policyname FROM pg_policies
WHERE tablename = 'jewelry_certificates';
# Deve retornar: ~4 políticas
```

### Problema: Erro 401 Unauthorized

**Possível causa:** JWT não tem org_id ou está inválido

```bash
# 1. Decodificar token em jwt.io
# 2. Verificar se tem "org_id" no payload
# 3. Verificar se org_id é UUID válido

# 3. Verificar se user tem entry em auth_users
SELECT * FROM auth_users WHERE email = 'seu-email';
# Deve retornar um row com org_id preenchido
```

### Problema: Erro 500 no backend

**Possível causa:** Função get_user_org_id() não existe

```bash
# Executar FASE4-JWT-SETUP.sql novamente
# Especialmente os passos 1 e 2
```

---

## 📊 Resumo: O que RLS Protege

```
Sem RLS:
  User 1 (org-maison-lumiere)
    ↓
  GET /api/certificates
    ↓
  Recebe TODOS os certificados (todas as orgs) ❌

Com RLS:
  User 1 (org-maison-lumiere)
    ↓
  GET /api/certificates
    ↓
  Middleware extrai org_id do JWT
    ↓
  Backend filtra: WHERE org_id = 'org-maison-lumiere'
    ↓
  RLS políticas confirmam: org_id deve ser 'org-maison-lumiere'
    ↓
  Recebe APENAS certificados de org-maison-lumiere ✅
```

---

## 🎯 Próximo Passo

Após confirmar que RLS funciona:
1. Documentar resultados dos testes
2. Continuar para FASE 4.3 (Audit Logs)

---

**Status:** Pronto para testar 🚀
