# Supabase Authentication - Guia de Implementação

**Data:** 2026-08-13  
**Status:** ✅ Implementado

## O que foi criado

### 1. Utilitário de Autenticação
**Arquivo:** `src/utils/supabaseAuth.ts`

Funções disponíveis:
- `supabaseAuth.signUp(email, password, name)` - Cria novo usuário
- `supabaseAuth.signIn(email, password)` - Faz login
- `supabaseAuth.signOut()` - Faz logout
- `supabaseAuth.getSession()` - Obtém sessão atual
- `supabaseAuth.isAuthenticated()` - Verifica autenticação

### 2. Novo Componente de Login
**Arquivo:** `src/components/SupabaseLoginView.tsx`

Características:
- ✅ Interface elegante (mesmo design do LoginView original)
- ✅ Sign Up (criar conta) e Sign In (entrar)
- ✅ Validação de campos
- ✅ Mensagens de erro
- ✅ Loading states
- ✅ Tema claro/escuro

### 3. Endpoint de Registro
**Endpoint:** `POST /api/auth/register`

Body:
```json
{
  "email": "usuario@email.com",
  "password": "senha123",
  "name": "Nome Completo"
}
```

## Fluxo de Autenticação

```
┌─────────────────────────────────────────────┐
│         Usuário acessa a app                │
└────────────────┬────────────────────────────┘
                 │
                 ▼
        ┌─────────────────┐
        │ LoginView       │
        │ (Original)      │
        └─────────────────┘
                 │
        ┌────────┴────────┐
        │ Usar original   │ Usar Supabase
        │ (localStorage)  │ (novo)
        │                 │
        ▼                 ▼
    ┌────────┐      ┌──────────────────┐
    │ Local  │      │ SupabaseLoginView│
    │ Auth   │      │ (novo componente)│
    └────────┘      └────────┬─────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
                    ▼                 ▼
            ┌─────────────┐  ┌──────────────┐
            │ Sign In     │  │ Sign Up      │
            │ (supabase.  │  │ (supabase.   │
            │ auth.sign   │  │ auth.signUp) │
            │ InWithPass) │  └──────────────┘
            └─────────────┘
                    │
                    ▼
         ┌────────────────────┐
         │ Supabase PostgreSQL│
         │ auth_users table   │
         └────────────────────┘
                    │
                    ▼
         ┌────────────────────┐
         │ onLoginSuccess()   │
         │ App.tsx atualiza   │
         │ currentUser state  │
         └────────────────────┘
```

## Como integrar no App.tsx

Para usar o novo SupabaseLoginView, atualize `src/App.tsx`:

```tsx
import { SupabaseLoginView } from './components/SupabaseLoginView';

// No JSX, substitua:
{!currentUser ? (
  <LoginView {...props} />
) : (
  // resto da app
)}

// Por:
{!currentUser ? (
  <SupabaseLoginView {...props} />
) : (
  // resto da app
)}
```

## Testes Recomendados

### 1. Sign Up (Criar Conta)
```bash
# Via SupabaseLoginView UI
- Clique em "Criar nova conta"
- Preencha: Email, Senha, Nome
- Clique em "Criar Conta"
- Verifique se user é criado em Supabase dashboard
```

### 2. Sign In (Fazer Login)
```bash
# Via SupabaseLoginView UI
- Volte para Sign In
- Use email/password da conta criada
- Clique em "Entrar"
- Verifique se login é bem-sucedido
```

### 3. Via API
```bash
# Testar endpoint de registro
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@email.com",
    "password": "senha123",
    "name": "Teste User"
  }'

# Resposta esperada:
# {
#   "success": true,
#   "user": {
#     "id": "uuid",
#     "email": "teste@email.com",
#     "name": "Teste User",
#     "role": "customer"
#   }
# }
```

## Próximos Passos

### Fase 3: Migração de Dados
- [ ] Conectar `/api/certificates` ao Supabase
- [ ] Conectar `/api/customers` ao Supabase
- [ ] Implementar RLS policies
- [ ] Remover localStorage completamente

### Fase 4: Produção
- [ ] Testar multi-tenant isolation
- [ ] Configurar email confirmação
- [ ] Implementar password reset
- [ ] Deploy em staging
- [ ] Deploy em produção

## Troubleshooting

### Erro: "supabaseKey is required"
✅ **Resolvido** - Adicione `import 'dotenv/config'` no server.ts

### Erro: "User auth_users not found"
- Esperado na primeira vez (RLS pode bloquear)
- Sign In ainda funciona via Supabase Auth
- Perfil será criado após migração completa

### Erro: "Email already registered"
- Usuário já existe no Supabase
- Tente sign in em vez de sign up

## Notas Importantes

1. **Supabase Auth é o source of truth** - sessions vêm de `supabase.auth.getSession()`
2. **auth_users table** - armazena perfil estendido do usuário
3. **RLS está habilitado** - somente admin pode inserir via servidor
4. **Backward compatibility** - LoginView original ainda funciona para fallback

## Status das Tabelas Supabase

Checklist se você precisa conferir o banco:

- [ ] `organizations` - tabela criada (1 registro)
- [ ] `auth_users` - tabela criada (vazia inicialmente)
- [ ] `customers` - tabela criada (vazia inicialmente)
- [ ] `jewelry_certificates` - tabela criada (vazia inicialmente)
- [ ] `maintenance_records` - tabela criada (vazia inicialmente)
- [ ] RLS habilitado em todas as tabelas
- [ ] Políticas de segurança configuradas

