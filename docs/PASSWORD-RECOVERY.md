# Recuperação de Senha - Documentação

**Status:** ✅ Endpoints implementados

## 🔄 Fluxo Completo

### 1. Usuário clica "Esqueci minha senha"
```
Tela de Login
    ↓
[Esqueci minha senha?] link
    ↓
Formulário com email
```

### 2. Supabase envia email
```bash
POST /api/auth/forgot-password
{
  "email": "user@example.com"
}

Response:
{
  "success": true,
  "message": "Password reset email sent. Check your inbox."
}
```

### 3. Email contém link de reset
```
Email: [Redefinir Senha]
  └→ https://seu-app.com/auth/reset-password?token=...&type=recovery
```

### 4. Usuário define nova senha
```bash
POST /api/auth/update-password
Header: Authorization: Bearer <token>
{
  "password": "nova_senha"
}

Response:
{
  "success": true,
  "message": "Password updated successfully"
}
```

---

## 📋 Endpoints Criados

### `POST /api/auth/forgot-password`
Envia email de recuperação de senha

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset email sent. Check your inbox."
}
```

### `POST /api/auth/update-password`
Atualiza senha com token de recuperação

**Request:**
```
Header: Authorization: Bearer <token_do_email>
Body: { "password": "nova_senha" }
```

**Response:**
```json
{
  "success": true,
  "message": "Password updated successfully"
}
```

---

## 🔧 Como Implementar no Frontend

### Opção 1: Link "Esqueci minha senha?" no Login
```tsx
<button 
  onClick={() => setShowForgotPassword(true)}
  className="text-amber-400 text-sm"
>
  Esqueci minha senha
</button>
```

### Opção 2: Modal de Recuperação
```tsx
// Mostrar modal com campo de email
// Ao enviar: POST /api/auth/forgot-password
// Mensagem: "Email enviado! Verifique sua caixa de entrada"
```

### Opção 3: Página separada
```
/auth/forgot-password
  - Email input
  - Botão "Enviar"
  - Mensagem de sucesso
```

---

## 📧 Email de Supabase

Supabase envia automaticamente um email com:
- Assunto: "Reset your password"
- Link que redireciona para sua app
- Link expira em 24 horas

**URL do link:**
```
https://seu-app.com/auth/reset-password?token=xxx&type=recovery
```

---

## ✅ Testes

### Teste 1: Solicitar Reset
```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

### Teste 2: Verificar Email
- Vá ao Supabase > Auth > Email Templates
- Copie o link do email de teste
- Use o token para atualizar senha

---

## 🚀 Próximos Passos

1. [ ] Adicionar UI "Esqueci minha senha" no SupabaseLoginView
2. [ ] Criar página de reset `/auth/reset-password`
3. [ ] Configurar redirect URL no Supabase
4. [ ] Testar fluxo completo
5. [ ] Documentar para usuários

---

## ⚙️ Configuração Supabase

Para ativar emails de recuperação:

1. Vá ao **Supabase Dashboard > Auth > Providers**
2. Habilite **Email/Password**
3. Em **Email Templates**, customize se necessário
4. Configure **Redirect URL** para: `https://seu-app.com/auth/reset-password`

---

## 📌 Notas

- Emails expiram em **24 horas**
- Supabase gerencia automaticamente os tokens
- Recuperação de senha é **grátis** no Supabase
- Funciona para qualquer usuário registrado

