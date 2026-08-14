# 🚀 Guia de Deploy para Produção

## Pré-requisitos
- Node.js 18+ instalado no servidor
- Variáveis de ambiente configuradas
- Acesso ao Supabase

## 1️⃣ Variáveis de Ambiente (.env)

```bash
# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=seu-service-role-key

# Opcional
NODE_ENV=production
```

## 2️⃣ Build para Produção

```bash
# Instalar dependências
npm install

# Build (cria pasta dist e server.cjs)
npm run build

# Verificar se criou corretamente
ls dist/
```

## 3️⃣ Iniciar em Produção

```bash
# Opção 1: Node direto
node dist/server.cjs

# Opção 2: Com npm
npm start

# Servidor rodará em http://localhost:3000
```

## 4️⃣ Verificar se Funcionou

```bash
curl http://localhost:3000
# Resposta esperada:
# {"message":"API Certificado de Joias","status":"online","version":"1.0"}

curl http://localhost:3000/api/customers
# Resposta esperada:
# {"success":true,"count":0,"data":[]}
```

## 5️⃣ Configurar Reverse Proxy (nginx/Apache)

Se usar nginx, adicione:

```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 6️⃣ Usar PM2 para Manter Rodando

```bash
npm install -g pm2

# Iniciar
pm2 start dist/server.cjs --name "certificado"

# Salvar para restart automático
pm2 save

# Configurar startup
pm2 startup
```

## ⚠️ Importante em Produção

✅ **Dados vêm 100% do Supabase**
- Nenhum dado hardcoded
- Arquivo `data_store.json` é apenas cache local
- Se Supabase falhar, APIs retornam vazio

✅ **Verificar Conexão Supabase**
```bash
curl http://localhost:3000/api/supabase/test
```

✅ **Limpeza Periódica** (opcional)
```bash
npm run clean  # Remove dist e build antigos
```

## 🔍 Troubleshooting

| Erro | Solução |
|------|---------|
| `Cannot GET /` | Rota raiz adicionada, deve funcionar |
| `SUPABASE_URL not set` | Configurar `.env` |
| `Port 3000 already in use` | Mudar porta ou parar outro processo |
| `0 customers returned` | Normal - dados vêm do Supabase |

## ✨ Status

- ✅ Backend: Pronto para produção
- ✅ Dados: Apenas Supabase
- ✅ Build script: Configurado
- ⏳ Frontend: Compilado automaticamente no build
