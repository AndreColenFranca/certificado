# Checklist de Implementação RLS

## 📋 Ordem de Execução

### Fase 1: Preparar Banco de Dados

- [ ] **Criar tabela `user_orgs`**
  ```
  Arquivo: CREATE-USER-ORGS-TABLE.sql
  Local: Supabase Dashboard > SQL Editor
  ```
  
- [ ] **Adicionar `org_id` padrão aos usuários existentes**
  ```sql
  -- Após criar user_orgs table
  INSERT INTO user_orgs (user_id, org_id, role)
  SELECT id, 'default', 'member'
  FROM auth.users
  WHERE id NOT IN (SELECT user_id FROM user_orgs);
  ```

- [ ] **Adicionar org_id ao usuário raiz**
  ```sql
  -- Substitua seu-user-id
  INSERT INTO user_orgs (user_id, org_id, role)
  VALUES ('seu-user-id-do-andreluiz', 'default', 'owner')
  ON CONFLICT (user_id) DO UPDATE SET role = 'owner';
  ```

### Fase 2: Ativar RLS

- [ ] **Executar políticas RLS**
  ```
  Arquivo: RLS-POLICIES.sql
  Local: Supabase Dashboard > SQL Editor
  ```

- [ ] **Verificar que RLS está ativado**
  ```sql
  SELECT tablename, rowsecurity
  FROM pg_tables
  WHERE schemaname = 'public';
  ```

### Fase 3: Atualizar Backend

- [ ] **Adicionar import de rlsHelpers em server.ts**
  ```typescript
  import { getOrgIdFromJwt } from './server-helpers/rlsHelpers';
  ```

- [ ] **Atualizar criação de certificados com org_id**
  ```typescript
  const orgId = getOrgIdFromJwt(authToken);
  await createCertificate(supabase, {
    ...cert,
    org_id: orgId
  });
  ```

- [ ] **Atualizar criação de clientes com org_id**
  ```typescript
  const orgId = getOrgIdFromJwt(authToken);
  await createCustomer(supabase, {
    ...customer,
    org_id: orgId
  });
  ```

### Fase 4: Testar Isolamento

- [ ] **Test 1: Um usuário vê apenas seus dados**
  ```bash
  # Login como cliente1
  TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"client1@test.com","password":"pass"}' | jq -r '.token')
  
  # Deve retornar apenas certificados de cliente1
  curl -H "Authorization: Bearer $TOKEN" \
    http://localhost:3000/api/certificates
  ```

- [ ] **Test 2: RLS bloqueia acesso a dados de outra org**
  ```bash
  # Tentar deletar certificado de outra org
  curl -X DELETE \
    -H "Authorization: Bearer $TOKEN_CLIENT1" \
    http://localhost:3000/api/certificates/cert-from-other-org
  # Esperado: 403 Forbidden
  ```

- [ ] **Test 3: Backend (service role) pode acessar tudo**
  ```bash
  # Backend sempre consegue acessar (ignora RLS)
  curl -s http://localhost:3000/api/certificates | jq '.count'
  ```

### Fase 5: Validação Final

- [ ] **Confirmar que todos os testes passaram**
- [ ] **Documentar org_ids usados**
- [ ] **Treinar time sobre RLS**
- [ ] **Planejar rotinas de auditoria**

---

## 🔧 Comandos Úteis

### Ver todas as políticas RLS
```sql
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Desativar RLS temporariamente (DEBUG ONLY)
```sql
ALTER TABLE jewelry_certificates DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_orgs DISABLE ROW LEVEL SECURITY;
```

### Reativar RLS
```sql
ALTER TABLE jewelry_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_orgs ENABLE ROW LEVEL SECURITY;
```

### Limpar policies
```sql
DROP POLICY IF EXISTS "Users can view their org certificates" ON jewelry_certificates;
DROP POLICY IF EXISTS "Users can create certificates in their org" ON jewelry_certificates;
-- etc...
```

---

## 📊 Roadmap Pós-RLS

- [ ] **Passo 5: Testes Completos** (próximo)
  - Testar fluxo completo de sign up → create cert → view → delete
  - Verificar isolamento de dados
  - Testar performance com muitos usuários

- [ ] **Passo 6: Auditoria e Logs**
  - Implementar audit logs
  - Rastrear quem criou/modificou dados

- [ ] **Passo 7: Backup e Disaster Recovery**
  - Configurar backups automáticos
  - Testar restore

---

## ⚠️ Notas Importantes

1. **JWT Claims**: Para RLS funcionar, `auth.jwt() ->> 'org_id'` deve retornar algo
   - Solução atual: Usar tabela `user_orgs` e query-la no backend
   - Solução ideal: Custom claims no JWT (requer Supabase Premium)

2. **Service Role Bypassa RLS**: Nunca exponha service role key no frontend
   - Apenas no backend (server.ts)
   - Sempre use anon key no frontend

3. **Migração de Dados**: Dados antigos sem `org_id` precisam ser preenchidos
   ```sql
   UPDATE jewelry_certificates SET org_id = 'default' WHERE org_id IS NULL;
   UPDATE customers SET org_id = 'default' WHERE org_id IS NULL;
   ```

4. **Performance**: Adicione índices em `org_id` para queries rápidas
   ```sql
   CREATE INDEX idx_jewelry_certificates_org_id ON jewelry_certificates(org_id);
   CREATE INDEX idx_customers_org_id ON customers(org_id);
   ```

---

## 🆘 Troubleshooting

### "Permission denied" ao atualizar/deletar
- ✅ RLS está bloqueando porque `org_id` não corresponde
- ✅ Verificar que token JWT tem org_id correto
- ✅ Verificar que política RLS está escrita corretamente

### "NULL valor em coluna org_id"
- ✅ INSERT não incluiu org_id
- ✅ Adicionar org_id obrigatório: `ALTER TABLE ... ALTER COLUMN org_id SET NOT NULL;`

### "Role anonymous has no permissions"
- ✅ RLS ativada mas sem políticas para anonymous role
- ✅ Adicionar políticas específicas para anonymous se necessário

---

## 📚 Referências

- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [JWT no Supabase](https://supabase.com/docs/guides/auth/jwts)
