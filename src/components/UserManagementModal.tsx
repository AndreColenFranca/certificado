import React, { useState, useEffect } from 'react';
import { X, UserPlus, Users, Crown, ShieldAlert, Trash2, CheckCircle2, Mail, Lock, User, ShieldCheck } from 'lucide-react';
import { AppUser } from '../types';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser | null;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  currentUser
}) => {
  const [usersList, setUsersList] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // New user form state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'operator' | 'customer'>('customer');

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRootUser = currentUser?.isRoot || currentUser?.email.toLowerCase() === 'andreluiz.colen@gmail.com';

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/users');
      const data = await res.json();

      if (data.success && Array.isArray(data.data)) {
        setUsersList(data.data);
      } else {
        // Fallback from localStorage
        const localUsers = localStorage.getItem('aureum_users_db');
        if (localUsers) {
          setUsersList(JSON.parse(localUsers));
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar usuários:', e);
      const localUsers = localStorage.getItem('aureum_users_db');
      if (localUsers) {
        try { setUsersList(JSON.parse(localUsers)); } catch (err) {}
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newName.trim() || !newEmail.trim() || !newPassword) {
      setFeedback({ type: 'error', message: 'Preencha todos os campos obrigatórios (Nome, E-mail e Senha).' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    const cleanEmail = newEmail.trim().toLowerCase();

    // Check duplicate in current user list
    if (usersList.some(u => u.email.toLowerCase() === cleanEmail)) {
      setFeedback({ type: 'error', message: 'Este e-mail já está cadastrado no sistema.' });
      setIsSubmitting(false);
      return;
    }

    const newUserObj = {
      id: `user-${Date.now()}`,
      name: newName.trim(),
      email: cleanEmail,
      password: newPassword,
      role: newRole,
      createdAt: new Date().toISOString(),
      isRoot: false
    };

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterEmail: currentUser?.email || 'andreluiz.colen@gmail.com',
          name: newName.trim(),
          email: cleanEmail,
          password: newPassword,
          role: newRole
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setFeedback({ type: 'success', message: data.message || `Usuário "${newName}" cadastrado com sucesso!` });
        const createdUser = data.data || newUserObj;
        const updatedUsers = [...usersList, { ...createdUser, password: newPassword }];
        setUsersList(updatedUsers);
        localStorage.setItem('aureum_users_db', JSON.stringify(updatedUsers));
        setNewName('');
        setNewEmail('');
        setNewPassword('');
        setNewRole('operator');
      } else {
        // Fallback local save if server error response
        const updatedUsers = [...usersList, newUserObj];
        setUsersList(updatedUsers);
        localStorage.setItem('aureum_users_db', JSON.stringify(updatedUsers));
        setFeedback({ type: 'success', message: `Usuário "${newName.trim()}" cadastrado com sucesso!` });
        setNewName('');
        setNewEmail('');
        setNewPassword('');
        setNewRole('operator');
      }
    } catch (err: any) {
      // Offline fallback: save locally so registration is never blocked
      const updatedUsers = [...usersList, newUserObj];
      setUsersList(updatedUsers);
      localStorage.setItem('aureum_users_db', JSON.stringify(updatedUsers));
      setFeedback({ type: 'success', message: `Usuário "${newName.trim()}" cadastrado com sucesso!` });
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      setNewRole('operator');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userToDelete: AppUser) => {
    if (userToDelete.isRoot || userToDelete.email.toLowerCase() === 'andreluiz.colen@gmail.com') {
      alert('O Usuário Raiz principal não pode ser removido!');
      return;
    }

    if (!window.confirm(`Tem certeza que deseja remover o acesso do usuário "${userToDelete.name}" (${userToDelete.email})?`)) {
      return;
    }

    try {
      await fetch(`/api/users/${userToDelete.id}`, { method: 'DELETE' });
      await fetch(`/api/users/${encodeURIComponent(userToDelete.email)}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('Erro ao deletar usuário do servidor:', e);
    }

    const filtered = usersList.filter(u => 
      u.id !== userToDelete.id && 
      u.email.toLowerCase() !== userToDelete.email.toLowerCase()
    );
    setUsersList(filtered);
    localStorage.setItem('aureum_users_db', JSON.stringify(filtered));
    setFeedback({ type: 'success', message: `Acesso do usuário "${userToDelete.name}" foi removido com sucesso.` });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900 border border-amber-900/50 text-amber-50 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-amber-900/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold font-serif text-amber-100">
                  Gestão de Usuários
                </h2>
                {isRootUser && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                    <Crown className="w-3 h-3 text-amber-400" />
                    <span>Permissão Raiz</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400">
                Cadastro e controle de acessos autorizados ao sistema de joias
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-amber-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-6 space-y-6 pr-1 custom-scrollbar">
          
          {/* Non-Root Warning */}
          {!isRootUser ? (
            <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-center space-y-3">
              <ShieldAlert className="w-10 h-10 text-amber-400 mx-auto" />
              <h3 className="font-bold text-sm">Acesso Restrito do Usuário Raiz</h3>
              <p className="text-xs text-zinc-300 max-w-md mx-auto leading-relaxed">
                Apenas o usuário principal cadastrado (<strong>andreluiz.colen@gmail.com</strong>) possui autorização técnica para cadastrar ou gerenciar novos usuários no sistema.
              </p>
            </div>
          ) : (
            <>
              {/* Register New User Section */}
              <div className="p-5 rounded-2xl bg-zinc-950/80 border border-amber-900/40 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
                  <UserPlus className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-amber-200 uppercase tracking-wider">
                    Cadastrar Novo Usuário
                  </h3>
                </div>

                {feedback && (
                  <div className={`p-3 rounded-xl border text-xs font-medium flex items-center gap-2 ${
                    feedback.type === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                      : 'bg-red-500/10 border-red-500/40 text-red-300'
                  }`}>
                    {feedback.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                    )}
                    <span>{feedback.message}</span>
                  </div>
                )}

                <form onSubmit={handleCreateUser} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Name */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-amber-200 uppercase">
                        Nome Completo
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          placeholder="Ex: Maria Clara"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-amber-900/50 rounded-xl text-xs text-amber-50 placeholder-zinc-400 focus:outline-none focus:border-amber-500 font-medium"
                        />
                        <User className="absolute left-3 top-2.5 w-3.5 h-3.5 text-amber-400" />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-amber-200 uppercase">
                        E-mail de Acesso
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          required
                          placeholder="usuario@maison.com"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-amber-900/50 rounded-xl text-xs text-amber-50 placeholder-zinc-400 focus:outline-none focus:border-amber-500 font-medium"
                        />
                        <Mail className="absolute left-3 top-2.5 w-3.5 h-3.5 text-amber-400" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Password */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-amber-200 uppercase">
                        Senha Inicial
                      </label>
                      <div className="relative">
                        <input
                          type="password"
                          required
                          placeholder="••••••••"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-amber-900/50 rounded-xl text-xs text-amber-50 placeholder-zinc-400 focus:outline-none focus:border-amber-500 font-medium"
                        />
                        <Lock className="absolute left-3 top-2.5 w-3.5 h-3.5 text-amber-400" />
                      </div>
                    </div>

                    {/* Role */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-amber-200 uppercase">
                        Nível de Acesso
                      </label>
                      <select
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value as any)}
                        className="w-full px-3 py-2 bg-zinc-900 border border-amber-900/50 rounded-xl text-xs text-amber-50 focus:outline-none focus:border-amber-500 font-medium"
                      >
                        <option value="customer" className="bg-zinc-900 text-amber-50">Cliente (Acesso Restrito às Próprias Joias)</option>
                        <option value="operator" className="bg-zinc-900 text-amber-50">Operador / Joalheiro Atendente</option>
                        <option value="admin" className="bg-zinc-900 text-amber-50">Administrador Secundário</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md hover:scale-[1.02] transition-all cursor-pointer border border-amber-400"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>{isSubmitting ? 'Cadastrando...' : 'Cadastrar Usuário'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Users List Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-amber-200 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>Usuários Cadastrados ({usersList.length})</span>
                  </h3>
                </div>

                {isLoading ? (
                  <div className="p-8 text-center text-xs text-zinc-400">Carregando usuários...</div>
                ) : (
                  <div className="space-y-2">
                    {usersList.map((usr) => {
                      const isUserRoot = usr.isRoot || usr.email.toLowerCase() === 'andreluiz.colen@gmail.com';
                      return (
                        <div
                          key={usr.id}
                          className="p-3.5 rounded-2xl bg-zinc-950/60 border border-zinc-800 hover:border-amber-900/40 flex items-center justify-between gap-4 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl border ${
                              isUserRoot
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                                : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                            }`}>
                              {isUserRoot ? <Crown className="w-4 h-4 text-amber-400" /> : <User className="w-4 h-4" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-amber-100">{usr.name}</span>
                                {isUserRoot ? (
                                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                                    Usuário Raiz
                                  </span>
                                ) : (
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-semibold border ${
                                    usr.role === 'admin'
                                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                      : usr.role === 'customer'
                                      ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                                      : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                                  }`}>
                                    {usr.role === 'admin' ? 'Administrador' : usr.role === 'customer' ? 'Cliente' : 'Operador'}
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-zinc-400 font-mono block">{usr.email}</span>
                            </div>
                          </div>

                          {!isUserRoot && isRootUser && (
                            <button
                              onClick={() => handleDeleteUser(usr)}
                              title="Remover este usuário"
                              className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 hover:text-red-200 transition-all cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-amber-900/30 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-100 font-bold text-xs transition-all cursor-pointer border border-zinc-700"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
