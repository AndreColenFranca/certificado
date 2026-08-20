import React, { useState, useEffect } from 'react';
import { Customer } from '../types';
import { AppUser } from '../types';
import { isValidCPF, formatCPF } from '../utils/cpfUtils';
import { X, UserPlus, UserCheck, ShieldCheck, Mail, CreditCard, Phone, FileText, Lock, Eye, EyeOff, KeyRound } from 'lucide-react';

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customer: Customer) => void;
  onError?: (error: string) => void;
  serverErrorMessage?: string;
  onClearError?: () => void;
  initialCustomer?: Customer | null;
  existingCustomers?: Customer[];
  currentUser?: AppUser | null;
}

export const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onError,
  serverErrorMessage,
  onClearError,
  initialCustomer,
  existingCustomers = [],
  currentUser = null
}) => {
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; cpf?: string; email?: string; password?: string }>({});
  const [serverError, setServerError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      if (initialCustomer) {
        setName(initialCustomer.name || '');
        setCpf(String(initialCustomer.cpf || ''));
        setEmail(initialCustomer.email || '');
        setPhone(initialCustomer.phone || '');
        setNotes(initialCustomer.notes || '');
        setPassword(initialCustomer.password || '');
      } else {
        setName('');
        setCpf('');
        setEmail('');
        setPhone('');
        setNotes('');
        setPassword('');
      }
      setShowPassword(false);
    } else {
      setErrors({});
      setServerError('');
    }
  }, [initialCustomer, isOpen]);

  useEffect(() => {
    if (serverErrorMessage) {
      if (serverErrorMessage.toLowerCase().includes('e-mail') || serverErrorMessage.toLowerCase().includes('email')) {
        setErrors(prev => ({
          ...prev,
          email: serverErrorMessage
        }));
      } else {
        setErrors(prev => ({
          ...prev,
          cpf: serverErrorMessage
        }));
      }
    }
  }, [serverErrorMessage]);

  if (!isOpen) return null;


  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numericOnly = e.target.value.replace(/\D/g, '').slice(0, 11);
    setCpf(numericOnly);
    if (errors.cpf) {
      setErrors(prev => ({ ...prev, cpf: undefined }));
    }
    // Limpar erro do servidor quando usuário muda o CPF
    if (serverErrorMessage && onClearError) {
      onClearError();
    }
    // Garante que não ultrapasse 11 dígitos
    if (numericOnly.length > 11) {
      e.target.value = numericOnly.slice(0, 11);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { name?: string; cpf?: string; email?: string; password?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Nome é obrigatório (campo alfanumérico).';
    }

    if (!cpf.trim()) {
      newErrors.cpf = 'CPF é obrigatório.';
    } else if (cpf.length !== 11) {
      newErrors.cpf = 'CPF deve conter 11 dígitos.';
    } else if (!isValidCPF(cpf)) {
      newErrors.cpf = 'CPF inválido.';
    } else {
      const duplicateCpf = existingCustomers.find(
        c => c.id !== initialCustomer?.id && String(c.cpf) === String(cpf)
      );
      if (duplicateCpf) {
        // "nesta joalheria" nao e enfeite: a mesma pessoa pode ser cliente de
        // varias, e a lista conferida aqui so tem a joalheria logada. Sem isso
        // a mensagem parece dizer que o CPF esta bloqueado em todo lugar.
        newErrors.cpf = 'CPF já cadastrado nesta joalheria.';
      }
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!email.trim()) {
      newErrors.email = 'E-mail é obrigatório.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Insira um e-mail válido.';
    } else {
      // Check duplicate Email in existing customers
      const duplicateEmail = existingCustomers.find(
        c => c.id !== initialCustomer?.id && c.email.trim().toLowerCase() === cleanEmail
      );
      if (duplicateEmail) {
        newErrors.email = 'E-mail já cadastrado nesta joalheria.';
      }
    }

    if (!password.trim()) {
      newErrors.password = 'Senha de acesso é obrigatória para o login do cliente.';
    } else if (password.trim().length < 4) {
      newErrors.password = 'A senha deve conter no mínimo 4 caracteres.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Texto, nunca número: CPF tem zeros à esquerda significativos, e
    // Number('00100000011') vira 100000011 — dois dígitos a menos.
    const cpfDigitos = cpf.replace(/\D/g, '');

    const customerToSave: any = {
      id: initialCustomer?.id || `CLI-${Math.floor(1000 + Math.random() * 9000)}`,
      name: name.trim(),
      cpf: cpfDigitos,
      email: email.trim().toLowerCase(),
      phone: phone.trim() || undefined,
      notes: notes.trim() || undefined,
      password: password.trim(),
      orgId: currentUser?.orgId || '550e8400-e29b-41d4-a716-446655440000',
      createdAt: initialCustomer?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(customerToSave);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-amber-900/50 rounded-2xl shadow-2xl shadow-amber-950/40 overflow-hidden text-amber-50">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-amber-900/40 bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              {initialCustomer ? <UserCheck className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg font-bold font-serif text-amber-100">
                {initialCustomer ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}
              </h2>
              <p className="text-xs text-zinc-400">
                {initialCustomer ? 'Atualize os dados cadastrais do titular' : 'Insira os dados do titular para vincular joias e certificados'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-amber-300 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* Nome */}
          <div>
            <label className="block text-xs font-semibold text-amber-200 mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Nome Completo (Alfanumérico) *</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors(prev => ({ ...prev, name: undefined }));
              }}
              placeholder="Ex: Helena Cavalcanti de Albuquerque"
              className={`w-full px-3.5 py-2.5 bg-zinc-950 border rounded-xl text-sm text-amber-100 placeholder-zinc-600 focus:outline-none focus:ring-1 transition-all ${
                errors.name 
                  ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/50' 
                  : 'border-zinc-800 focus:border-amber-500/80 focus:ring-amber-500/50'
              }`}
            />
            {errors.name && <p className="text-xs text-rose-400 mt-1">{errors.name}</p>}
          </div>

          {/* CPF */}
          <div>
            <label className="block text-xs font-semibold text-amber-200 mb-1 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-amber-400" />
              <span>CPF (11 dígitos) *</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={14}
              value={formatCPF(cpf)}
              onChange={handleCpfChange}
              placeholder="123.456.789-01"
              className={`w-full px-3.5 py-2.5 bg-zinc-950 border rounded-xl text-sm font-mono text-amber-100 placeholder-zinc-600 focus:outline-none focus:ring-1 transition-all ${
                errors.cpf
                  ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/50'
                  : 'border-zinc-800 focus:border-amber-500/80 focus:ring-amber-500/50'
              }`}
            />
            {errors.cpf ? (
              <p className="text-xs text-rose-400 mt-1">{errors.cpf}</p>
            ) : (
              <p className="text-[11px] text-zinc-500 mt-1">Digite 11 dígitos (apenas números).</p>
            )}
          </div>

          {/* E-mail */}
          <div>
            <label className="block text-xs font-semibold text-amber-200 mb-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-amber-400" />
              <span>E-mail de Contato {initialCustomer ? '(Não editável)' : ''} *</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
              }}
              disabled={initialCustomer ? true : false}
              readOnly={initialCustomer ? true : false}
              placeholder="cliente@exemplo.com.br"
              className={`w-full px-3.5 py-2.5 bg-zinc-950 border rounded-xl text-sm text-amber-100 placeholder-zinc-600 focus:outline-none focus:ring-1 transition-all ${
                initialCustomer
                  ? 'bg-zinc-900 border-zinc-700 text-zinc-400 cursor-not-allowed opacity-60'
                  : errors.email
                  ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/50'
                  : 'border-zinc-800 focus:border-amber-500/80 focus:ring-amber-500/50'
              }`}
              title={initialCustomer ? "Email não pode ser alterado após cadastro (é a identidade do usuário)" : ""}
            />
            {initialCustomer && (
              <p className="text-[11px] text-amber-300/80 mt-1">⚠️ Email é a identidade do usuário e não pode ser alterado por motivos de segurança.</p>
            )}
            {errors.email && !initialCustomer && <p className="text-xs text-rose-400 mt-1">{errors.email}</p>}
          </div>

          {/* Senha */}
          <div>
            <label className="block text-xs font-semibold text-amber-200 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Senha de Acesso do Cliente *</span>
              </span>
              <span className="text-[10px] text-amber-400/80 font-normal">Para login no sistema</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
                }}
                placeholder="Informe a senha de acesso (ex: 123456)"
                className={`w-full pl-3.5 pr-10 py-2.5 bg-zinc-950 border rounded-xl text-sm text-amber-100 placeholder-zinc-600 focus:outline-none focus:ring-1 transition-all ${
                  errors.password 
                    ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/50' 
                    : 'border-zinc-800 focus:border-amber-500/80 focus:ring-amber-500/50'
                }`}
                id="input-customer-form-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-zinc-400 hover:text-amber-300 transition-colors cursor-pointer"
                title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password ? (
              <p className="text-xs text-rose-400 mt-1">{errors.password}</p>
            ) : (
              <p className="text-[11px] text-zinc-500 mt-1">O cliente utilizará este e-mail e senha para realizar login no sistema e visualizar suas joias.</p>
            )}
          </div>

          {/* Telefone & Observações */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-amber-200 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>Telefone (Opcional)</span>
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-amber-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-amber-200 mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Notas / Perfil</span>
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Colecionadora Haute Joaillerie"
                className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-amber-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/50"
              />
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-amber-900/30">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-amber-200 hover:bg-zinc-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 shadow-lg shadow-amber-950/50 transition-all flex items-center gap-1.5"
            >
              <UserCheck className="w-4 h-4" />
              <span>{initialCustomer ? 'Salvar Alterações' : 'Cadastrar Cliente'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
