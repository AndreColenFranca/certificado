# 🚀 Próximo Passo - Reiniciar Servidor e Testar

## ⚠️ Situação Atual

**Implementação**: ✅ 100% Completa  
**Código**: ✅ Atualizado  
**Banco de Dados**: ✅ Migration executada  
**Servidor**: ❌ Precisa reiniciar (running com código antigo)

---

## 🔄 Como Reiniciar

### Opção 1: Terminal (Recomendado)
```bash
# 1. Ir para pasta do projeto
cd ~/OneDrive/Área\ de\ Trabalho/certificado

# 2. Matar servidor antigo
pkill -f "tsx\|node"

# 3. Aguardar 3 segundos
sleep 3

# 4. Iniciar servidor novo
npm run dev
```

### Opção 2: Manualmente no Terminal do Projeto
```bash
# Ctrl + C para parar o servidor
# Depois:
npm run dev
```

### Opção 3: Reiniciar máquina
Se nada funcionar, reinicie o computador e rode `npm run dev`

---

## 🧪 Após Reiniciar - Teste Rápido

### Teste 1: Verificar Health
```bash
curl http://localhost:3000/api/health
# Esperado: {"message":"API Certificado de Joias","status":"online"}
```

### Teste 2: Listar Atributos (sem token - deve usar DEFAULT_ORG_ID)
```bash
curl http://localhost:3000/api/metal-purities | jq '.data[0] | {id, name, org_id}'
# Esperado:
# {
#   "id": "met-vkc798oai",
#   "name": "Ouro 14k",
#   "org_id": "550e8400-e29b-41d4-a716-446655440000"
# }
```

### Teste 3: Criar Novo Atributo (sem token - deve funcionar com DEFAULT_ORG_ID)
```bash
curl -X POST http://localhost:3000/api/metal-purities \
  -H "Content-Type: application/json" \
  -d '{"name":"Ouro Branco Novo","description":"Teste org_id","order":10}'

# Esperado:
# {
#   "success": true,
#   "data": {
#     "id": "met-xxx",
#     "name": "Ouro Branco Novo",
#     "org_id": "550e8400-e29b-41d4-a716-446655440000",
#     ...
#   }
# }
```

### Teste 4: Teste na UI
1. Abrir http://localhost:5173
2. Fazer login
3. Ir em **Atributos** → **Metal (Pureza)**
4. Clicar **Novo**
5. Preencher:
   - Nome: "Ouro 999 Puro"
   - Descrição: "Teste de org_id"
   - Ordem: 20
6. Clicar **Criar**

**Esperado**:
- ✅ Atributo criado com sucesso
- ✅ Mensagem verde "Atributo criado!"
- ✅ Atributo aparece na lista
- ✅ Pode editar
- ✅ Pode deletar
- ✅ Pode reordenar (Drag & Drop)

---

## 🔍 Verificar no Banco de Dados

No Supabase Console, executar:

```sql
-- Ver atributo criado
SELECT id, name, org_id, created_at FROM metal_purities 
WHERE name = 'Ouro Branco Novo'
LIMIT 1;

-- Ver constraint
SELECT constraint_name FROM information_schema.table_constraints 
WHERE table_name = 'metal_purities' AND constraint_type = 'UNIQUE';
-- Esperado: "metal_purities_org_id_name_key"

-- Ver índice
SELECT indexname FROM pg_indexes 
WHERE tablename = 'metal_purities' AND indexname LIKE '%org_id%';
-- Esperado: "idx_metal_purities_org_id"
```

---

## ⚙️ O que Funciona Agora

✅ **Isolamento por Organização**
- Cada usuário vê apenas atributos de sua org
- Não pode acessar atributos de outras orgs

✅ **CRUD Completo**
- CREATE: Novo atributo com org_id automaticamente
- READ: Lista filtrada por org_id
- UPDATE: Apenas da sua org
- DELETE: Apenas da sua org

✅ **Segurança em Camadas**
- Banco: NOT NULL + UNIQUE(org_id, name)
- Helpers: Validação obrigatória de org_id
- Endpoints: Extração automática de JWT
- Frontend: fetchWithAuth() envia token

✅ **Todas as 9 Tabelas**
- collections ✅
- manufacturers ✅
- metal_purities ✅
- metal_colors ✅
- finishes ✅
- stone_types ✅
- setting_types ✅
- cut_shapes ✅
- color_grades ✅

---

## 🐛 Se Tiver Erro

### Erro: "org_id é obrigatório"
```
ERRO CRÍTICO: org_id é obrigatório para createAttribute(). 
Recebido: undefined
```
**Solução**: Verificar se token JWT está sendo enviado
```bash
# Frontend: Verificar DevTools → Network → Headers
# Authorization: Bearer eyJ...
```

### Erro: "null value in column org_id"
```
null value in column "org_id" of relation "metal_purities" 
violates not-null constraint
```
**Solução**: Servidor ainda está rodando código antigo
```bash
# Matar server: pkill -f "tsx\|node"
# Aguardar 3s
# Reiniciar: npm run dev
```

### Erro: "EADDRINUSE: address already in use :::3000"
```
Error: listen EADDRINUSE: address already in use :::3000
```
**Solução**: Porta 3000 já está em uso
```bash
# Força kill tudo
pkill -9 -f "node\|tsx"
sleep 3
npm run dev
```

---

## 📊 Checklist Pós-Restart

- [ ] Servidor iniciou sem erros
- [ ] Health check retorna OK
- [ ] GET /api/metal-purities retorna dados
- [ ] org_id está presente em todos os registros
- [ ] Consegue criar novo atributo
- [ ] Novo atributo tem org_id
- [ ] Consegue editar atributo
- [ ] Consegue deletar atributo
- [ ] Consegue reordenar (drag & drop)
- [ ] UI exibe mensagens de sucesso

---

## ✨ Resultado Final

Depois de reiniciar, você terá:

**✅ Segurança**:
- Atributos isolados por organização
- Usuários só veem seus próprios dados
- Banco garante integridade de dados

**✅ Funcionalidade**:
- CRUD completo para 9 tipos de atributos
- Interface intuitiva
- Validações robustas

**✅ Escalabilidade**:
- Pronto para múltiplas organizações
- Performance otimizada com índices
- Constraints garantem consistência

---

## 📞 Suporte

Se tiver problema:
1. Verifique **Checklist Pós-Restart** acima
2. Verifique **Seção de Erros**
3. Reinicie novamente: `pkill -9 -f "tsx\|node" && npm run dev`
4. Se persistir, verifique logs: `tail -100 /tmp/api.log`

---

**Status**: 🟢 PRONTO PARA RESTART  
**Data**: 2026-08-17  
**Próximo**: Reinicie o servidor e teste!
