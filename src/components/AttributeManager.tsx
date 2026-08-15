import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Search, GripVertical } from 'lucide-react';

export interface Attribute {
  id: string;
  name: string;
  description?: string;
  order?: number;
  created_at?: string;
  updated_at?: string;
}

interface AttributeManagerProps {
  title: string;
  endpoint: string; // ex: '/api/collections', '/api/manufacturers'
  onBack?: () => void;
}

export const AttributeManager: React.FC<AttributeManagerProps> = ({
  title,
  endpoint,
  onBack
}) => {
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', order: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [draggedId, setDraggedId] = useState<string | null>(null);

  useEffect(() => {
    fetchAttributes();
  }, []);

  const fetchAttributes = async () => {
    try {
      const res = await fetch(endpoint);
      const data = await res.json();
      if (data.success) {
        const sorted = [...data.data].sort((a, b) => (a.order || 0) - (b.order || 0));
        setAttributes(sorted);
      }
    } catch (err: any) {
      setError('Erro ao carregar atributos');
    } finally {
      setLoading(false);
    }
  };

  const filteredAttributes = attributes.filter(attr =>
    attr.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (attr.description && attr.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name.trim()) {
      setError('Nome é obrigatório');
      return;
    }

    try {
      const url = editingId ? `${endpoint}/${editingId}` : endpoint;
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(editingId ? 'Atributo atualizado!' : 'Atributo criado!');
        setFormData({ name: '', description: '', order: (Math.max(...attributes.map(a => a.order || 0), 0)) + 1 });
        setEditingId(null);
        setShowForm(false);
        fetchAttributes();
      } else {
        setError(data.error || 'Erro ao salvar');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que quer deletar?')) return;

    try {
      const res = await fetch(`${endpoint}/${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (data.success) {
        setSuccess('Atributo deletado!');
        fetchAttributes();
      } else {
        setError(data.error || 'Erro ao deletar');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao deletar');
    }
  };

  const handleEdit = (attr: Attribute) => {
    setFormData({ name: attr.name, description: attr.description || '', order: attr.order || 0 });
    setEditingId(attr.id);
    setShowForm(true);
  };

  const updateOrder = async (id: string, newOrder: number): Promise<boolean> => {
    try {
      const attr = attributes.find(a => a.id === id);
      if (!attr) {
        console.warn('Atributo não encontrado:', id);
        return false;
      }
      console.log('Atualizando ordem:', { id, newOrder, name: attr.name });
      const payload = {
        name: attr.name,
        description: attr.description || '',
        order: newOrder
      };
      console.log('Payload:', payload);
      const res = await fetch(`${endpoint}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      console.log('Resposta:', { ok: res.ok, status: res.status, data });
      if (!res.ok) {
        console.error('Erro ao atualizar ordem:', data);
        setError(`Erro ao atualizar: ${data.error}`);
        return false;
      }
      return true;
    } catch (err: any) {
      console.error('Erro ao atualizar ordem:', err);
      setError(`Erro: ${err.message}`);
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-amber-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
              {title}
            </h1>
            <p className="text-xs text-zinc-400 mt-1">Gerenciar valores de {title.toLowerCase()}</p>
          </div>
          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-amber-50 rounded-lg transition"
            >
              ← Voltar
            </button>
          )}
        </div>

        {/* Messages */}
        {error && (
          <div className="p-4 rounded-lg bg-red-700 border border-red-500 text-white font-bold mb-6">
            ❌ {error}
          </div>
        )}
        {success && (
          <div className="p-4 rounded-lg bg-green-700 border border-green-500 text-white font-bold mb-6">
            ✅ {success}
          </div>
        )}

        {/* Search and Add Button */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-amber-900/40 rounded-lg text-amber-50 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
            />
          </div>
          {!showForm && (
            <button
              onClick={() => {
                setShowForm(true);
                setEditingId(null);
                setFormData({ name: '', description: '', order: (Math.max(...attributes.map(a => a.order || 0), 0)) + 1 });
              }}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-semibold rounded-lg transition flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Novo
            </button>
          )}
        </div>

        {/* Form */}
        {showForm && (
          <div className="p-6 bg-zinc-900 border border-amber-900/50 rounded-lg mb-6">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? `Editar ${title}` : `Novo ${title}`}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Nome *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={`Ex: Ouro 18K`}
                  className="w-full px-3 py-2 bg-zinc-800 border border-amber-900/40 rounded text-amber-50 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Descrição (opcional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detalhes adicionais..."
                  className="w-full px-3 py-2 bg-zinc-800 border border-amber-900/40 rounded text-amber-50 resize-none focus:outline-none focus:border-amber-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Ordem (número)</label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-zinc-800 border border-amber-900/40 rounded text-amber-50 focus:outline-none focus:border-amber-500"
                  min="0"
                />
                <p className="text-xs text-zinc-400 mt-1">Números menores aparecem primeiro (0, 1, 2...)</p>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-semibold rounded transition"
                >
                  {editingId ? 'Atualizar' : 'Criar'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData({ name: '', description: '', order: (Math.max(...attributes.map(a => a.order || 0), 0)) + 1 });
                    setError('');
                    setSuccess('');
                  }}
                  className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-amber-50 rounded transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="text-center py-8 text-zinc-400">Carregando...</div>
        ) : filteredAttributes.length === 0 ? (
          <div className="text-center py-8 text-zinc-400">
            {searchTerm ? 'Nenhum atributo encontrado' : 'Nenhum atributo cadastrado'}
          </div>
        ) : (
          <div className="space-y-2 border border-amber-900/30 rounded-lg divide-y divide-amber-900/30 overflow-hidden">
            {filteredAttributes.map((attr) => (
              <div
                key={attr.id}
                draggable
                onDragStart={() => setDraggedId(attr.id)}
                onDragOver={(e) => e.preventDefault()}
                onDragLeave={() => {}}
                onDrop={async () => {
                  if (!draggedId || draggedId === attr.id) {
                    setDraggedId(null);
                    return;
                  }
                  const draggedAttr = attributes.find(a => a.id === draggedId);
                  if (!draggedAttr) {
                    setDraggedId(null);
                    return;
                  }
                  const draggedOrder = draggedAttr.order || 0;
                  const targetOrder = attr.order || 0;

                  await updateOrder(draggedId, targetOrder);
                  await updateOrder(attr.id, draggedOrder);

                  setDraggedId(null);
                  setSuccess('Ordem atualizada!');
                  setTimeout(() => setSuccess(''), 2000);

                  // Recarregar para sincronizar com servidor
                  await fetchAttributes();
                }}
                onDragEnd={() => setDraggedId(null)}
                className={`p-4 transition flex items-center justify-between ${
                  draggedId === attr.id ? 'bg-amber-500/30 cursor-grabbing' : 'bg-zinc-900/50 hover:bg-zinc-900 cursor-grab'
                }`}
              >
                <GripVertical className="w-4 h-4 text-amber-500 mr-3 shrink-0" />
                <div className="flex-1">
                  <h3 className="font-bold text-amber-200">{attr.name}</h3>
                  {attr.description && (
                    <p className="text-sm text-zinc-400 mt-1">{attr.description}</p>
                  )}
                  <p className="text-xs text-zinc-500 mt-1">Ordem: {attr.order ?? 0}</p>
                  {attr.created_at && (
                    <p className="text-xs text-zinc-500">
                      Criado em: {new Date(attr.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(attr)}
                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(attr.id)}
                    className="p-2 bg-red-600 hover:bg-red-700 text-white rounded transition"
                    title="Deletar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
