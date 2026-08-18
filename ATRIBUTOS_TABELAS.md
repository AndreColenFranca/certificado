# Tabelas de Atributos - Certificado de Joias

## Resumo
Existem **7 tabelas de atributos** no banco de dados que armazenam os valores/opções disponíveis para os certificados de joias.

---

## 1. **color_grades** (Notas de Cor)
Armazena as notas/graus de cor das pedras.

```sql
CREATE TABLE color_grades (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    order INTEGER DEFAULT 0
);
```
- **Campos**: id, name, description, order, timestamps
- **PK**: id (TEXT)
- **Uso**: Classificação de cor de diamantes e outras pedras

---

## 2. **cut_shapes** (Formas de Corte)
Armazena as diferentes formas/tipos de corte de pedras.

```sql
CREATE TABLE cut_shapes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    order INTEGER DEFAULT 0
);
```
- **Campos**: id, name, description, order, timestamps
- **PK**: id (TEXT)
- **Uso**: Ex: Brilhante, Esmeralda, Marquês, Almofada, etc.

---

## 3. **finishes** (Acabamentos)
Armazena os tipos de acabamento do metal da joia.

```sql
CREATE TABLE finishes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    order INTEGER DEFAULT 0
);
```
- **Campos**: id, name, description, order, timestamps
- **PK**: id (TEXT)
- **Uso**: Ex: Polido, Fosco, Escovado, Espelhado, etc.

---

## 4. **metal_colors** (Cores de Metal)
Armazena as cores disponíveis dos metais.

```sql
CREATE TABLE metal_colors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    order INTEGER DEFAULT 0
);
```
- **Campos**: id, name, description, order, timestamps
- **PK**: id (TEXT)
- **Uso**: Ex: Ouro Amarelo, Ouro Branco, Ouro Rosa, Prata, Platina, etc.

---

## 5. **metal_purities** (Purezas de Metal)
Armazena os níveis de pureza dos metais.

```sql
CREATE TABLE metal_purities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    order INTEGER DEFAULT 0
);
```
- **Campos**: id, name, description, order, timestamps
- **PK**: id (TEXT)
- **Uso**: Ex: 750 (18K), 900 (21.6K), 950 (Platina), 925 (Prata), etc.

---

## 6. **setting_types** (Tipos de Anel/Configuração)
Armazena os tipos de configuração ou montagem de joias.

```sql
CREATE TABLE setting_types (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    order INTEGER DEFAULT 0
);
```
- **Campos**: id, name, description, order, timestamps
- **PK**: id (TEXT)
- **Uso**: Ex: Anel, Pingente, Brinco, Colar, Pulseira, etc.

---

## 7. **stone_types** (Tipos de Pedra)
Armazena os tipos de pedras preciosas e semipreciosas.

```sql
CREATE TABLE stone_types (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    order INTEGER DEFAULT 0
);
```
- **Campos**: id, name, description, order, timestamps
- **PK**: id (TEXT)
- **Uso**: Ex: Diamante, Esmeralda, Rubi, Safira, Topázio, etc.

---

## Características Comuns

Todas as **7 tabelas de atributos** compartilham:
- ✅ Estrutura idêntica
- ✅ ID em TEXT (não UUID)
- ✅ Nome único (UNIQUE constraint)
- ✅ Descrição opcional
- ✅ Campo `order` para ordenação customizada
- ✅ Timestamps (created_at, updated_at)
- ✅ Sem org_id (são atributos globais da aplicação)

## Tabelas Relacionadas

### jewelry_certificates
A tabela principal que referencia esses atributos:
- `metal_purity` (TEXT) → referencia metal_purities.name
- `metal_color` (TEXT) → referencia metal_colors.name
- `finish` (TEXT) → referencia finishes.name
- `stones` (JSONB) → array com pedras (tipos de stone_types)

### collections e manufacturers
Também são atributos mas com estrutura ligeiramente diferente:
- Usam UUID como PK
- Têm `org_id` (são específicos por organização)

---

## Implementação Atual

### ✅ Backend (Node.js/Express + Supabase)

**Arquivo**: `api/index.ts`

#### CRUD Endpoints Implementados
```
GET    /api/{attribute}         - Listar todos os atributos (ordenado por 'order')
GET    /api/{attribute}/:id     - Obter atributo específico
POST   /api/{attribute}         - Criar novo atributo
PUT    /api/{attribute}/:id     - Atualizar atributo
DELETE /api/{attribute}/:id     - Deletar atributo
```

**Endpoints disponíveis**:
- `/api/collections`
- `/api/manufacturers`
- `/api/metal-purities`
- `/api/metal-colors`
- `/api/finishes`
- `/api/stone-types`
- `/api/setting-types`
- `/api/cut-shapes`
- `/api/color-grades`

**Arquivo de Helpers**: `server-helpers/attributesHelpers.ts`

Funções exportadas:
- `getAttributes(supabase, tableName)` - Busca todos ordenados por 'order'
- `getAttribute(supabase, tableName, id)` - Busca um por ID
- `createAttribute(supabase, tableName, attr)` - Cria novo (gera ID automático)
- `updateAttribute(supabase, tableName, id, attr)` - Atualiza existente
- `deleteAttribute(supabase, tableName, id)` - Deleta por ID

### ✅ Frontend (React/TypeScript)

**Arquivo**: `src/components/AttributesView.tsx`

#### Funcionalidades
1. **Tela de Seleção** - Menu para escolher qual atributo gerenciar
2. **Componente Manager** - `<AttributeManager />` para CRUD visual
3. **Persistência** - Usa sessionStorage para manter seleção
4. **Validação** - Valida se atributo selecionado é válido

#### Tipos e Configuração
```typescript
type AttributeType = 'collections' | 'manufacturers' | 'metal_purities' | 
                     'metal_colors' | 'finishes' | 'stone_types' | 
                     'setting_types' | 'cut_shapes' | 'color_grades'

interface Attribute {
  key: AttributeType
  label: string         // Ex: "Metal"
  description: string   // Ex: "Gerenciar pureza do metal"
  icon: string         // Emoji
}
```

#### Componente AttributeManager
**Arquivo**: `src/components/AttributeManager.tsx`

Gerencia a UI para adicionar, editar e remover atributos de uma tabela específica.

## Status da Implementação

| Funcionalidade | Status | Localização |
|---|---|---|
| Tabelas DB | ✅ Completo | `backup_completo.sql` |
| CRUD Backend | ✅ Completo | `api/index.ts` + `server-helpers/attributesHelpers.ts` |
| UI - Seleção | ✅ Completo | `src/components/AttributesView.tsx` |
| UI - Manager | ✅ Completo | `src/components/AttributeManager.tsx` |
| Integração Certificados | ✅ Completo | `src/components/CertificateFormModal.tsx` |

## Próximos Passos (se necessário)

1. 🔍 Validações adicionais (ex: impedir duplicatas)
2. 🔄 Reordenação drag-and-drop
3. 📊 Relatório de uso de atributos
4. 🔐 Controle de permissões (admin only?)
5. 📋 Backup/restore de atributos
