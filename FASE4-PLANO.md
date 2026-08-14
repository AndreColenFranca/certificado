# Fase 4: JWT + RLS + Audit Logs - PLANO

**Data:** 2026-08-14  
**Objetivo:** Implementar segurança multi-tenant completa  
**Tempo estimado:** 3-4 horas  

---

## 🎯 Fases

### FASE 4.1: JWT com org_id (45 min)
- [ ] Criar função Supabase `get_claims()`
- [ ] Modificar `signIn()` para retornar org_id
- [ ] Atualizar backend para validar org_id
- [ ] Teste: Login com 2 usuários de orgs diferentes

### FASE 4.2: RLS Completo (60 min)
- [ ] Habilitar RLS em tabelas
- [ ] Criar políticas SELECT/INSERT/UPDATE/DELETE
- [ ] Teste: Usuário A não vê dados de Usuário B
- [ ] Teste: API rejeta requests sem org_id válido

### FASE 4.3: Audit Logs (45 min)
- [ ] Criar tabela `audit_logs`
- [ ] Implementar triggers para CRUD
- [ ] Endpoint GET /api/audit-logs?org_id=...
- [ ] Visualizar logs na UI (AdminPanel)

### FASE 4.4: Testes + Documentação (30 min)
- [ ] Testes de segurança
- [ ] Documentação de deployment
- [ ] Commit final

---

## 📊 Estrutura Detalhada

### FASE 4.1: JWT com org_id

#### Passo 1.1: Criar Função Supabase
```sql
-- Supabase Dashboard > SQL Editor > New Query

CREATE OR REPLACE FUNCTION public.get_user_org_id(user_id uuid)
RETURNS uuid AS $$
BEGIN
  RETURN (
    SELECT org_id FROM auth_users 
    WHERE id = user_id 
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Hook JWT: Quando usuário faz login, adicione org_id ao token
-- Settings > Auth > Providers > Supabase > JWT > Add org_id claim
```

**O que vai fazer:**
- Token JWT terá: `{"sub":"user-123","org_id":"org-456"}`
- RLS policies vão usar: `auth.jwt() ->> 'org_id'`

#### Passo 1.2: Modificar signIn() backend
```typescript
// src/utils/supabaseAuth.ts - modificar signIn()

// Após login bem-sucedido, fazer:
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;
// Decodificar JWT para extrair org_id
const decoded = jwt_decode(token);
// Retornar user com org_id
```

#### Passo 1.3: Validar no Backend
```typescript
// server.ts - middleware novo

// Antes de retornar dados, validar:
const userOrgId = auth.jwt() ->> 'org_id';
if (!userOrgId) return 401 Unauthorized;

// Filtrar dados por userOrgId
const certificates = await supabase
  .from('jewelry_certificates')
  .select('*')
  .eq('org_id', userOrgId);
```

---

### FASE 4.2: RLS (Row Level Security)

#### Passo 2.1: Políticas para Organizations
```sql
-- Já está no schema, mas vamos validar

-- Ver própria organização
CREATE POLICY "View own org"
  ON organizations
  FOR SELECT
  USING (id = (auth.jwt() ->> 'org_id')::uuid);

-- Atualizar própria organização
CREATE POLICY "Update own org"
  ON organizations
  FOR UPDATE
  USING (id = (auth.jwt() ->> 'org_id')::uuid);
```

#### Passo 2.2: Políticas para Certificados
```sql
-- Ver certificados da própria org
CREATE POLICY "View org certificates"
  ON jewelry_certificates
  FOR SELECT
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- Criar certificados na própria org
CREATE POLICY "Create org certificates"
  ON jewelry_certificates
  FOR INSERT
  WITH CHECK (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- Atualizar certificados da própria org
CREATE POLICY "Update org certificates"
  ON jewelry_certificates
  FOR UPDATE
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- Deletar certificados da própria org
CREATE POLICY "Delete org certificates"
  ON jewelry_certificates
  FOR DELETE
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);
```

#### Passo 2.3: Políticas para Clientes
```sql
-- Mesmo padrão para customers, auth_users, etc.
CREATE POLICY "View org customers"
  ON customers
  FOR SELECT
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

CREATE POLICY "Create org customers"
  ON customers
  FOR INSERT
  WITH CHECK (org_id = (auth.jwt() ->> 'org_id')::uuid);
-- ... UPDATE, DELETE ...
```

#### Passo 2.4: Teste
```bash
# User A (org-maison-lumiere)
curl -H "Authorization: Bearer TOKEN_A" \
  http://localhost:3000/api/certificates

# Retorna: Só certificados de org-maison-lumiere ✅

---

# User B (org-joias-imperatriz)
curl -H "Authorization: Bearer TOKEN_B" \
  http://localhost:3000/api/certificates

# Retorna: Só certificados de org-joias-imperatriz ✅

---

# User A tenta ver de User B (deve FALHAR)
curl -H "Authorization: Bearer TOKEN_A" \
  http://localhost:3000/api/certificates?org_id=org-joias-imperatriz

# Retorna: 403 Forbidden ou vazio (RLS bloqueou) ✅
```

---

### FASE 4.3: Audit Logs

#### Passo 3.1: Criar Tabela
```sql
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  table_name TEXT NOT NULL,
  operation TEXT CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  record_id UUID NOT NULL,
  user_id UUID REFERENCES auth_users(id) ON DELETE SET NULL,
  old_values JSONB,
  new_values JSONB,
  timestamp TIMESTAMP DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View org audit logs"
  ON audit_logs
  FOR SELECT
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);
```

#### Passo 3.2: Implementar Triggers
```sql
-- Trigger para certificates
CREATE OR REPLACE FUNCTION audit_certificates()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (org_id, table_name, operation, record_id, user_id, old_values, new_values)
  VALUES (
    COALESCE(NEW.org_id, OLD.org_id),
    'jewelry_certificates',
    TG_OP,
    COALESCE(NEW.id, OLD.id),
    auth.uid(),
    to_jsonb(OLD),
    to_jsonb(NEW)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_certificates_trigger
AFTER INSERT OR UPDATE OR DELETE ON jewelry_certificates
FOR EACH ROW EXECUTE FUNCTION audit_certificates();

-- Mesmo pattern para customers, auth_users, etc.
```

#### Passo 3.3: Endpoint GET
```typescript
// server.ts - novo endpoint

app.get('/api/audit-logs', async (req, res) => {
  const userOrgId = req.user?.org_id; // Do JWT
  
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('org_id', userOrgId)
    .order('timestamp', { ascending: false })
    .limit(100);

  if (error) return res.status(400).json({ error: error.message });
  
  res.json({ success: true, data });
});
```

#### Passo 3.4: Visualizar na UI
```tsx
// src/components/AuditLogsView.tsx - novo

export const AuditLogsView = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    fetch('/api/audit-logs')
      .then(r => r.json())
      .then(d => setLogs(d.data));
  }, []);

  return (
    <table>
      <thead>
        <tr>
          <th>Data/Hora</th>
          <th>Operação</th>
          <th>Tabela</th>
          <th>Usuário</th>
          <th>Detalhes</th>
        </tr>
      </thead>
      <tbody>
        {logs.map(log => (
          <tr key={log.id}>
            <td>{new Date(log.timestamp).toLocaleString()}</td>
            <td>{log.operation}</td>
            <td>{log.table_name}</td>
            <td>{log.user_id}</td>
            <td>{JSON.stringify(log.new_values)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
```

---

## 🔄 Fluxo Completo (Com Segurança)

```
1. Login
   ↓
User clicks "Entrar"
   ↓
signIn(email, password)
   ↓
Supabase Auth verifica
   ↓
JWT Hook adiciona org_id ao token
   ↓
Token: {"sub":"user-123","org_id":"org-456","role":"admin"}
   ↓
Frontend salva token

2. Request Autenticado
   ↓
GET /api/certificates
Header: Authorization: Bearer TOKEN
   ↓
Backend extrai org_id do JWT
   ↓
Query: SELECT * FROM jewelry_certificates 
       WHERE org_id = 'org-456'
   ↓
RLS políticas validam
   ↓
Retorna apenas dados de org-456 ✅

3. Audit
   ↓
Trigger registra em audit_logs
   ↓
{
  org_id: 'org-456',
  table_name: 'jewelry_certificates',
  operation: 'INSERT',
  user_id: 'user-123',
  new_values: {...},
  timestamp: '2026-08-14T10:00:00Z'
}
   ↓
Logs disponíveis em GET /api/audit-logs
```

---

## 📋 Checklist Implementação

### FASE 4.1: JWT
- [ ] Funcao `get_user_org_id()` criada no Supabase
- [ ] JWT Hook configurado (Settings > Auth > JWT)
- [ ] signIn() retorna org_id
- [ ] Token testado (decode jwt)
- [ ] Backend valida org_id

### FASE 4.2: RLS
- [ ] RLS habilitado em todas as tabelas
- [ ] Políticas SELECT para todas as tabelas
- [ ] Políticas INSERT/UPDATE/DELETE
- [ ] Teste: User A vs User B
- [ ] Teste: Request sem JWT rejeitado
- [ ] Teste: Request com org_id errado rejeitado

### FASE 4.3: Audit
- [ ] Tabela `audit_logs` criada
- [ ] Triggers para INSERT/UPDATE/DELETE
- [ ] Endpoint GET /api/audit-logs funcionando
- [ ] UI para visualizar logs
- [ ] Logs corretamente formatados

### FASE 4.4: Testes
- [ ] Testes de segurança (curl com tokens errados)
- [ ] Documentação atualizada
- [ ] Commit final
- [ ] README.md com instruções de deploy

---

## ⏱️ Timeline Estimada

| Fase | Tarefa | Tempo |
|------|--------|-------|
| 4.1 | JWT + org_id | 45 min |
| 4.2 | RLS + Testes | 60 min |
| 4.3 | Audit Logs + UI | 45 min |
| 4.4 | Testes + Docs | 30 min |
| **Total** | | **3h 30m** |

---

## 🚀 Próximas Etapas (Fase 5+)

1. **WebSocket Sync** - Real-time updates entre usuários
2. **2FA** - Autenticação de dois fatores
3. **API Keys** - Integração com sistemas externos
4. **Backup Automático** - Snapshots diários

---

**Status:** Pronto para começar  
**Próximo passo:** Executar FASE 4.1 (JWT)
