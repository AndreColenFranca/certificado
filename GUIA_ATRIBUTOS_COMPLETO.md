# 📚 Guia Completo - Funcionalidade de Atributos

**Data**: 2026-08-17  
**Status**: ✅ Totalmente Implementado

---

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Tabelas de Banco de Dados](#tabelas-de-banco-de-dados)
3. [Arquitetura](#arquitetura)
4. [Endpoints da API](#endpoints-da-api)
5. [Componentes Frontend](#componentes-frontend)
6. [Fluxo de Dados](#fluxo-de-dados)
7. [Exemplos de Uso](#exemplos-de-uso)

---

## 🎯 Visão Geral

A funcionalidade de **Atributos** permite gerenciar os valores/opções que são utilizados no formulário de criação e edição de certificados de joias.

### Atributos Disponíveis (9 tipos)

| # | Tabela | Label | Descrição |
|---|--------|-------|-----------|
| 1 | `collections` | Coleção | Coleções de joias |
| 2 | `manufacturers` | Fabricante/Marca | Marcas e fabricantes |
| 3 | `metal_purities` | Metal | Pureza do metal (18K, 14K, etc) |
| 4 | `metal_colors` | Cor | Cores de metal (ouro, prata, platina) |
| 5 | `finishes` | Acabamento | Tipos de acabamento (polido, fosco, escovado) |
| 6 | `stone_types` | Tipo da Gema | Tipos de pedras (diamante, esmeralda, etc) |
| 7 | `setting_types` | Tipo de Cravação | Tipos de cravação (garras, pavê, etc) |
| 8 | `cut_shapes` | Lapidação/Formato | Formatos de corte (redondo, oval, marquês) |
| 9 | `color_grades` | Cor/Graduação | Graduações de cor de diamantes |

---

## 🗄️ Tabelas de Banco de Dados

### Estrutura Comum (7 tabelas)
```sql
CREATE TABLE attribute_table (
    id TEXT PRIMARY KEY,           -- Ex: 'col-a1b2c3d4e5'
    name TEXT NOT NULL UNIQUE,     -- Ex: 'Ouro 18K'
    description TEXT,              -- Opcional
    created_at TIMESTAMP,          -- Auto-gerado
    updated_at TIMESTAMP,          -- Auto-gerado
    order INTEGER DEFAULT 0        -- Para ordenação customizada
);
```

### Tabelas Diferentes (com UUID e org_id)
- **collections** - Com UUID, tem org_id
- **manufacturers** - Com UUID, tem org_id

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                         │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  AttributesView.tsx                                  │  │
│  │  - Tela de seleção de atributos                      │  │
│  │  - Exibe lista de 9 tipos de atributos              │  │
│  │  - Gerencia estado da seleção                        │  │
│  └──────────────────┬───────────────────────────────────┘  │
│                     │ onClick                                │
│  ┌──────────────────▼───────────────────────────────────┐  │
│  │  AttributeManager.tsx                                │  │
│  │  - Interface CRUD completa                           │  │
│  │  - Busca/Filtro                                      │  │
│  │  - Reordenação Drag & Drop                           │  │
│  │  - Criar/Editar/Deletar                              │  │
│  └──────────────────┬───────────────────────────────────┘  │
│                     │ fetch()                               │
└─────────────────────┼───────────────────────────────────────┘
                      │
        ┌─────────────┴────────────────┐
        │                              │
┌───────▼────────────────┐   ┌────────▼──────────────────┐
│  Express.js API        │   │   Browser (sessionStorage)│
│  (Node.js)             │   │   - Seleção persistida    │
│                        │   └───────────────────────────┘
│ POST   /api/{attr}     │
│ GET    /api/{attr}     │
│ GET    /api/{attr}/:id │
│ PUT    /api/{attr}/:id │
│ DELETE /api/{attr}/:id │
└───────┬────────────────┘
        │
┌───────▼────────────────┐
│  Supabase              │
│  (PostgreSQL)          │
│                        │
│  - color_grades        │
│  - cut_shapes          │
│  - finishes            │
│  - metal_colors        │
│  - metal_purities      │
│  - setting_types       │
│  - stone_types         │
│  - collections         │
│  - manufacturers       │
└────────────────────────┘
```

---

## 🔌 Endpoints da API

### Padrão: `/api/{table_name}`

#### 1️⃣ Listar Todos (com filtro por order)
```
GET /api/{attribute}

Response:
{
  "success": true,
  "data": [
    {
      "id": "col-abc123",
      "name": "Ouro 18K",
      "description": "Ouro puro 750/1000",
      "order": 1,
      "created_at": "2026-08-17T10:30:00Z",
      "updated_at": "2026-08-17T10:30:00Z"
    }
  ],
  "count": 5
}
```

#### 2️⃣ Obter Um Específico
```
GET /api/{attribute}/{id}

Response:
{
  "success": true,
  "data": { /* AttributeRecord */ }
}
```

#### 3️⃣ Criar Novo
```
POST /api/{attribute}

Request Body:
{
  "name": "Novo Valor",
  "description": "Descrição opcional",
  "order": 5
}

Response:
{
  "success": true,
  "data": { /* AttributeRecord com ID gerado */ }
}
```

#### 4️⃣ Atualizar
```
PUT /api/{attribute}/{id}

Request Body:
{
  "name": "Valor Atualizado",
  "description": "Descrição nova",
  "order": 3
}

Response:
{
  "success": true,
  "data": { /* AttributeRecord atualizado */ }
}
```

#### 5️⃣ Deletar
```
DELETE /api/{attribute}/{id}

Response:
{
  "success": true,
  "message": "Atributo deletado com sucesso"
}
```

### URLs Reais por Atributo

```
# Collections
GET    /api/collections
POST   /api/collections
GET    /api/collections/:id
PUT    /api/collections/:id
DELETE /api/collections/:id

# Manufacturers
GET    /api/manufacturers
POST   /api/manufacturers
...

# Metal Purities
GET    /api/metal-purities
POST   /api/metal-purities
...

# Metal Colors
GET    /api/metal-colors
POST   /api/metal-colors
...

# Finishes
GET    /api/finishes
POST   /api/finishes
...

# Stone Types
GET    /api/stone-types
POST   /api/stone-types
...

# Setting Types
GET    /api/setting-types
POST   /api/setting-types
...

# Cut Shapes
GET    /api/cut-shapes
POST   /api/cut-shapes
...

# Color Grades
GET    /api/color-grades
POST   /api/color-grades
...
```

---

## 🎨 Componentes Frontend

### 1. `AttributesView.tsx`
**Localização**: `src/components/AttributesView.tsx`

**Responsabilidades**:
- Exibir menu com 9 atributos disponíveis
- Gerenciar estado de seleção
- Renderizar `<AttributeManager />` quando um atributo é selecionado
- Persistir seleção em `sessionStorage`

**Props**:
```typescript
interface AttributesViewProps {
  onSelectAttribute?: (attributeKey: AttributeType) => void;
}
```

**Estado**:
- `selectedAttribute: AttributeType | null` - Atributo selecionado
- `sessionStorage['selectedAttributeKey']` - Persiste seleção

### 2. `AttributeManager.tsx`
**Localização**: `src/components/AttributeManager.tsx`

**Responsabilidades**:
- Interface CRUD completa
- Busca/Filtro de atributos
- Criar novos atributos
- Editar atributos existentes
- Deletar atributos
- Reordenar via Drag & Drop

**Props**:
```typescript
interface AttributeManagerProps {
  title: string;              // Ex: "Metal"
  endpoint: string;           // Ex: "/api/metal-purities"
  onBack?: () => void;        // Callback para voltar
}
```

**Funcionalidades**:
- ✅ Busca por nome e descrição
- ✅ Validação de campo obrigatório (name)
- ✅ Reordenação Drag & Drop com atualização no banco
- ✅ Mensagens de sucesso/erro
- ✅ Loading state
- ✅ Edição inline

---

## 🔄 Fluxo de Dados

### Fluxo de Criação de Atributo

```
1. Usuário clica em "Novo"
   ↓
2. Form aparece (name, description, order)
   ↓
3. Usuário preenche e clica "Criar"
   ↓
4. Frontend faz POST /api/{attribute}
   ↓
5. Backend:
   - Gera ID único: "${table.slice(0,3)}-${random}"
   - Insere em Supabase com timestamp
   ↓
6. Response com novo registro
   ↓
7. Frontend recarrega lista
   ↓
8. Mensagem de sucesso exibida
```

### Fluxo de Reordenação

```
1. Usuário arrasta um item
   ↓
2. onDragStart captura o ID
   ↓
3. Usuário solta em novo local
   ↓
4. onDrop:
   - Pega order do item arrastado
   - Pega order do alvo
   - Inverte os dois values
   ↓
5. Frontend faz PUT /api/{attribute}/{id} para ambos
   ↓
6. Backend atualiza order no Supabase
   ↓
7. Frontend recarrega lista (refresh)
```

---

## 💡 Exemplos de Uso

### Exemplo 1: Adicionar Nova Cor de Metal

**Passo a Passo**:
1. Ir a Atributos → Cor (metal_colors)
2. Clicar "Novo"
3. Preencher:
   - Nome: "Ouro Rosa"
   - Descrição: "Ouro com toque de cobre"
   - Ordem: 3
4. Clicar "Criar"

**O que acontece**:
```bash
POST /api/metal-colors
{
  "name": "Ouro Rosa",
  "description": "Ouro com toque de cobre",
  "order": 3
}
```

**Resposta**:
```json
{
  "success": true,
  "data": {
    "id": "met-xyz789",
    "name": "Ouro Rosa",
    "description": "Ouro com toque de cobre",
    "order": 3,
    "created_at": "2026-08-17T14:30:00Z",
    "updated_at": "2026-08-17T14:30:00Z"
  }
}
```

### Exemplo 2: Reordenar Acabamentos

**Ordem Atual**:
1. Polido (order: 0)
2. Fosco (order: 1)
3. Escovado (order: 2)

**Ação**: Arrastar "Escovado" para o topo

**Requests Gerados**:
```bash
PUT /api/finishes/fin-escovado
{ "name": "Escovado", "description": "...", "order": 0 }

PUT /api/finishes/fin-polido
{ "name": "Polido", "description": "...", "order": 2 }
```

**Nova Ordem**:
1. Escovado (order: 0)
2. Polido (order: 2)
3. Fosco (order: 1)

### Exemplo 3: Integração no Certificado

No `CertificateFormModal.tsx`, os atributos são carregados:

```typescript
// Carregar tipos de pedra
const { data: stoneTypes } = await fetch('/api/stone-types')

// Usar em select
<select name="stone_type">
  {stoneTypes.map(stone => (
    <option key={stone.id} value={stone.name}>
      {stone.name}
    </option>
  ))}
</select>
```

---

## 🔧 Helpers Utilizados

**Arquivo**: `server-helpers/attributesHelpers.ts`

```typescript
// Buscar todos (ordenado por 'order')
getAttributes(supabase, tableName): Promise<AttributeRecord[]>

// Buscar um por ID
getAttribute(supabase, tableName, id): Promise<AttributeRecord>

// Criar novo (gera ID automático)
createAttribute(supabase, tableName, attr): Promise<AttributeRecord>

// Atualizar existente
updateAttribute(supabase, tableName, id, attr): Promise<AttributeRecord>

// Deletar por ID
deleteAttribute(supabase, tableName, id): Promise<void>
```

---

## 📊 Tipos TypeScript

### AttributeRecord
```typescript
interface AttributeRecord {
  id: string;
  name: string;
  description?: string;
  order?: number;
  created_at?: string;
  updated_at?: string;
}
```

### AttributeType
```typescript
type AttributeType = 
  | 'collections'
  | 'manufacturers'
  | 'metal_purities'
  | 'metal_colors'
  | 'finishes'
  | 'stone_types'
  | 'setting_types'
  | 'cut_shapes'
  | 'color_grades';
```

---

## 🎯 Funcionalidades

### ✅ Implementadas

- [x] CRUD completo (Create, Read, Update, Delete)
- [x] 9 tipos de atributos
- [x] Interface visual intuitiva
- [x] Busca e filtro
- [x] Reordenação Drag & Drop
- [x] Validações de entrada
- [x] Mensagens de sucesso/erro
- [x] Persistência de seleção (sessionStorage)
- [x] Loading states
- [x] Integração com certificados

### 🔮 Possíveis Melhorias

- [ ] Validação de duplicata antes de criar
- [ ] Confirmação de delete com modal
- [ ] Reorder Drag & Drop mais suave
- [ ] Bulk operations (deletar múltiplos)
- [ ] Export/Import de atributos
- [ ] Histórico de mudanças
- [ ] Controle de permissões (admin only)
- [ ] Paginação para listas grandes

---

## 📝 Notas Importantes

1. **ID Format**: Automaticamente gerado como `${tableName.slice(0,3)}-${random}`
   - Exemplo: `col-abc123`, `met-xyz789`, `fin-rst012`

2. **Order**: Números menores aparecem primeiro (0, 1, 2, ...)
   - Padrão: 0
   - Usado para ordenação nos selects do formulário

3. **Name Unique**: Cada atributo deve ter um nome único por tabela
   - Banco garante via constraint UNIQUE

4. **Timestamps**: Automaticamente adicionados
   - `created_at`: preenchido na criação
   - `updated_at`: preenchido em toda mudança

5. **SessionStorage**: Persiste seleção de atributo na sessão
   - Chave: `selectedAttributeKey`
   - Limpa ao refrescar página

---

## 🚀 Para Começar

1. **Acessar Atributos**:
   - Ir à seção "Atributos" do app
   - Clique em um tipo de atributo

2. **Criar Atributo**:
   - Clique "Novo"
   - Preencha nome (obrigatório)
   - Clique "Criar"

3. **Editar Atributo**:
   - Clique no botão azul "Editar"
   - Altere os dados
   - Clique "Atualizar"

4. **Deletar Atributo**:
   - Clique no botão vermelho "Deletar"
   - Confirme na popup

5. **Reordenar**:
   - Arraste um item
   - Solte na nova posição
   - Ordem é atualizada automaticamente

---

**Última atualização**: 2026-08-17  
**Desenvolvedor**: André Colen  
**Email**: andreluiz.colen@gmail.com
