import { useState, useEffect } from 'react';
import { Building2, Plus, Edit2, Trash2, X, Search, Mail, Globe } from 'lucide-react';
import { fetchWithAuth } from '../utils/fetchWithAuth';

interface Organization {
  id: string;
  name: string;
  display_name?: string;
  website?: string;
  country?: string;
  created_at?: string;
  responsible_name?: string;
  phone?: string;
  email?: string;
  internal_notes?: string;
}

interface OrganizationsViewProps {
  onClose: () => void;
  companyName: string;
  companyLogoUrl: string;
}

export const OrganizationsView = ({
  onClose,
  companyName,
  companyLogoUrl
}: OrganizationsViewProps) => {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    website: '',
    country: 'BR',
    internalNotes: '',
    responsibleName: '',
    phone: '',
    email: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const res = await fetchWithAuth('/api/organizations');
      const data = await res.json();
      if (data.success) {
        setOrgs(data.data);
      }
    } catch (err) {
      setError('Erro ao carregar organizações');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar organizations por busca (nome, email, website)
  const filteredOrgs = orgs.filter(org => {
    const searchLower = searchTerm.toLowerCase();
    return (
      org.name.toLowerCase().includes(searchLower) ||
      (org.email && org.email.toLowerCase().includes(searchLower)) ||
      (org.website && org.website.toLowerCase().includes(searchLower)) ||
      (org.responsible_name && org.responsible_name.toLowerCase().includes(searchLower))
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name) {
      setError('Nome é obrigatório');
      return;
    }

    try {
      const url = editingId ? `/api/organizations/${editingId}` : '/api/organizations';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(editingId ? 'Organização atualizada!' : 'Organização criada!');
        setFormData({ name: '', displayName: '', website: '', country: 'BR', internalNotes: '', responsibleName: '', phone: '', email: '' });
        setEditingId(null);
        setShowForm(false);
        setSearchTerm('');
        fetchOrganizations();
      } else {
        setError(data.error || 'Erro ao salvar');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar');
    }
  };

  const handleDelete = async (id: string) => {
    if (id === 'default') {
      setError('Não é possível deletar a organização padrão');
      return;
    }

    if (!confirm('Tem certeza que quer deletar essa organização?')) return;

    try {
      const res = await fetchWithAuth(`/api/organizations/${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (data.success) {
        setSuccess('Organização deletada!');
        fetchOrganizations();
      } else {
        setError(data.error || 'Erro ao deletar');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao deletar');
    }
  };

  const handleEdit = (org: any) => {
    setFormData({
      name: org.name,
      displayName: org.display_name || '',
      website: org.website || '',
      country: org.country || 'BR',
      internalNotes: org.internal_notes || '',
      responsibleName: org.responsible_name || '',
      phone: org.phone || '',
      email: org.email || ''
    });
    setEditingId(org.id);
    setShowForm(true);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-amber-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8 text-amber-500" />
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
                Gerenciar Joalherias
              </h1>
              <p className="text-xs text-zinc-400 mt-1">Consulte, crie, edite e delete joalherias</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-zinc-900 border border-amber-900/50 rounded-lg p-4">
            <p className="text-zinc-400 text-sm">Total de Joalherias</p>
            <p className="text-2xl font-bold text-amber-400">{orgs.length}</p>
          </div>
          <div className="bg-zinc-900 border border-amber-900/50 rounded-lg p-4">
            <p className="text-zinc-400 text-sm">Com Email Registrado</p>
            <p className="text-2xl font-bold text-amber-400">{orgs.filter(o => o.email).length}</p>
          </div>
          <div className="bg-zinc-900 border border-amber-900/50 rounded-lg p-4">
            <p className="text-zinc-400 text-sm">Com Website</p>
            <p className="text-2xl font-bold text-amber-400">{orgs.filter(o => o.website).length}</p>
          </div>
        </div>

        {/* Mensagens */}
        {error && (
          <div className="p-4 rounded-lg bg-red-700 border border-red-500 text-white font-bold">
            ❌ {error}
          </div>
        )}
        {success && (
          <div className="p-4 rounded-lg bg-green-700 border border-green-500 text-white font-bold">
            ✅ {success}
          </div>
        )}

        {/* Search Bar */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar por nome, email, website ou responsável..."
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
                setFormData({ name: '', displayName: '', website: '', country: 'BR', internalNotes: '', responsibleName: '', phone: '', email: '' });
              }}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-semibold rounded-lg transition flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Nova Joalheria
            </button>
          )}
        </div>

        {/* Form */}
        {showForm && (
          <div className="p-6 bg-zinc-900 border border-amber-900/50 rounded-lg">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? 'Editar Joalheria' : 'Nova Joalheria'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Nome da Joalheria *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Maison Lumière"
                  className="w-full px-3 py-2 bg-zinc-800 border border-amber-900/40 rounded text-amber-50"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Nome Exibição (máx 18 caracteres)</label>
                <input
                  type="text"
                  maxLength={18}
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value.substring(0, 18) })}
                  placeholder="Maison Lumière"
                  className="w-full px-3 py-2 bg-zinc-800 border border-amber-900/40 rounded text-amber-50"
                />
                <p className="text-xs text-zinc-500 mt-1">{formData.displayName.length}/18 caracteres</p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Nome do Responsável</label>
                <input
                  type="text"
                  value={formData.responsibleName}
                  onChange={(e) => setFormData({ ...formData, responsibleName: e.target.value })}
                  placeholder="João Silva"
                  className="w-full px-3 py-2 bg-zinc-800 border border-amber-900/40 rounded text-amber-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Telefone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(11) 9999-9999"
                    className="w-full px-3 py-2 bg-zinc-800 border border-amber-900/40 rounded text-amber-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contato@joalheria.com"
                    className="w-full px-3 py-2 bg-zinc-800 border border-amber-900/40 rounded text-amber-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Website</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://minha-joalheria.com"
                  className="w-full px-3 py-2 bg-zinc-800 border border-amber-900/40 rounded text-amber-50"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Informações Internas</label>
                <textarea
                  value={formData.internalNotes}
                  onChange={(e) => setFormData({ ...formData, internalNotes: e.target.value })}
                  placeholder="Notas internas, observações, dados importantes..."
                  className="w-full px-3 py-2 bg-zinc-800 border border-amber-900/40 rounded text-amber-50 resize-none"
                  rows={4}
                />
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

        {/* Organizations List */}
        {loading ? (
          <div className="text-center py-8">Carregando...</div>
        ) : filteredOrgs.length === 0 ? (
          <div className="text-center py-8 text-zinc-400">
            {searchTerm ? 'Nenhuma organização encontrada com os critérios de busca' : 'Nenhuma organização cadastrada'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOrgs.map((org) => (
              <div
                key={org.id}
                className="p-6 bg-zinc-900 border border-amber-900/50 rounded-lg hover:border-amber-500/50 transition space-y-4"
              >
                {/* Header */}
                <div>
                  <h3 className="text-lg font-bold text-amber-400">{org.name}</h3>
                  {org.display_name && (
                    <p className="text-xs text-amber-300 mt-1">📌 Exibição: <span className="font-semibold">{org.display_name}</span></p>
                  )}
                  {org.responsible_name && (
                    <p className="text-sm text-zinc-300 mt-1">👤 {org.responsible_name}</p>
                  )}
                </div>

                {/* Contact Info */}
                <div className="space-y-2 text-sm">
                  {org.email && (
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Mail className="w-4 h-4 text-amber-500" />
                      <a href={`mailto:${org.email}`} className="hover:text-amber-400">
                        {org.email}
                      </a>
                    </div>
                  )}
                  {org.phone && (
                    <div className="flex items-center gap-2 text-zinc-400">
                      <span className="text-amber-500">📞</span>
                      <span>{org.phone}</span>
                    </div>
                  )}
                  {org.website && (
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Globe className="w-4 h-4 text-amber-500" />
                      <a href={org.website} target="_blank" rel="noopener noreferrer" className="hover:text-amber-400">
                        {org.website}
                      </a>
                    </div>
                  )}
                </div>

                {/* Internal Notes */}
                {org.internal_notes && (
                  <div className="text-xs bg-zinc-800/50 border border-amber-900/30 rounded p-2 text-zinc-300">
                    <p className="font-semibold text-amber-400 mb-1">Notas:</p>
                    <p>{org.internal_notes}</p>
                  </div>
                )}

                {/* Meta Info */}
                <div className="text-xs text-zinc-500">
                  ID: {org.id}
                  {org.created_at && (
                    <p>Criado: {new Date(org.created_at).toLocaleDateString('pt-BR')}</p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleEdit(org)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded transition text-sm"
                  >
                    <Edit2 className="w-4 h-4" />
                    Editar
                  </button>
                  {org.id !== 'default' && (
                    <button
                      onClick={() => handleDelete(org.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded transition text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      Deletar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
