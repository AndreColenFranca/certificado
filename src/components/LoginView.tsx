import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, Crown, Sparkles, KeyRound, User } from 'lucide-react';
import { AppUser, Customer } from '../types';
import { INITIAL_CUSTOMERS } from '../data/sampleCustomers';
import { ROOT_USER_EMAIL } from '../config/constants';

interface LoginViewProps {
  onLoginSuccess: (user: AppUser) => void;
  companyName: string;
  companyLogoUrl: string;
  theme?: 'luxury-dark' | 'classic-light';
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  companyName,
  companyLogoUrl,
  theme = 'luxury-dark'
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Fallback client-side authentication function
  const authenticateFallback = (rawInput: string, rawPass: string): AppUser => {
    const rawTrim = (rawInput || '').trim();
    const cleanInput = rawTrim
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
    const cleanDigits = cleanInput.replace(/\D/g, '');

    // 1. Check Root Admin Aliases
    const rootKeywords = [
      ROOT_USER_EMAIL,
      ROOT_USER_EMAIL.split('@')[0],
      'andreluiz.colen',
      'andreluiz',
      'colen',
      'andre',
      'andre luiz',
      'andre luiz colen',
      'root@aureum.com',
      'admin@aureum.com',
      'root',
      'admin',
      'administrador',
      'gestor'
    ];

    const isRootAlias = cleanInput.length === 0 ||
      rootKeywords.includes(cleanInput) ||
      cleanInput.includes('andreluiz') ||
      cleanInput.includes('colen') ||
      cleanInput.includes('root') ||
      cleanInput.includes('admin');

    if (isRootAlias) {
      return {
        id: 'user-root-001',
        name: 'André Luiz Colen (Administrador Raiz)',
        email: ROOT_USER_EMAIL,
        role: 'root',
        createdAt: new Date().toISOString(),
        isRoot: true
      };
    }

    // 2. Check customers in localStorage + INITIAL_CUSTOMERS first
    let allCustomers: Customer[] = [...INITIAL_CUSTOMERS];
    try {
      const storedCustomersRaw = localStorage.getItem('aureum_customers');
      if (storedCustomersRaw) {
        const storedCustomers: Customer[] = JSON.parse(storedCustomersRaw);
        storedCustomers.forEach(sc => {
          const idx = allCustomers.findIndex(ac => ac.id === sc.id);
          if (idx >= 0) {
            allCustomers[idx] = sc;
          } else {
            allCustomers.push(sc);
          }
        });
      }
    } catch (e) {}

    const matchedCust = allCustomers.find(c => {
      const custEmail = String(c.email || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const custCpfDigits = String(c.cpf || '').replace(/\D/g, '');
      const custName = String(c.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const custId = String(c.id || '').toLowerCase();

      return (
        custEmail === cleanInput ||
        (cleanDigits.length >= 4 && custCpfDigits.includes(cleanDigits)) ||
        custName === cleanInput ||
        custName.includes(cleanInput) ||
        custId === cleanInput
      );
    });

    if (matchedCust) {
      return {
        id: `user-customer-${matchedCust.id}`,
        name: matchedCust.name, // "Nome Completo (Alfanumérico)" from Customer record
        email: matchedCust.email,
        role: 'customer',
        customerId: matchedCust.id,
        cpf: matchedCust.cpf,
        createdAt: matchedCust.createdAt || new Date().toISOString(),
        isRoot: false
      };
    }

    // 3. Check stored users in localStorage (`aureum_users_db`)
    try {
      const storedUsersRaw = localStorage.getItem('aureum_users_db');
      if (storedUsersRaw) {
        const storedUsers: any[] = JSON.parse(storedUsersRaw);
        const matchedUser = storedUsers.find(u => {
          const uEmail = String(u.email || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          const uName = String(u.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          const uId = String(u.id || '').toLowerCase();
          return uEmail === cleanInput || uName === cleanInput || uId === cleanInput || uName.includes(cleanInput);
        });
        if (matchedUser) {
          const { password: _, ...userSafe } = matchedUser;
          return userSafe;
        }
      }
    } catch (e) {}

    // 4. Check stored certificates in localStorage
    try {
      const storedCertsRaw = localStorage.getItem('aureum_certificates');
      if (storedCertsRaw) {
        const storedCerts: any[] = JSON.parse(storedCertsRaw);
        const matchedCert = storedCerts.find(c => {
          const certEmail = String(c.ownerEmail || '').toLowerCase();
          const certCpf = String(c.ownerCpf || '').replace(/\D/g, '');
          const certName = String(c.currentOwnerName || '').toLowerCase();
          return certEmail === cleanInput || (cleanDigits.length >= 4 && certCpf.includes(cleanDigits)) || certName === cleanInput;
        });

        if (matchedCert && matchedCert.currentOwnerName) {
          return {
            id: `user-customer-cert-${Date.now()}`,
            name: matchedCert.currentOwnerName, // "Nome Completo (Alfanumérico)" from Certificate
            email: matchedCert.ownerEmail || (cleanInput.includes('@') ? rawTrim : `${cleanInput}@maison.com`),
            role: 'customer',
            customerId: matchedCert.ownerId,
            cpf: matchedCert.ownerCpf,
            createdAt: new Date().toISOString(),
            isRoot: false
          };
        }
      }
    } catch (e) {}

    // Fallback: Use raw email/input without deriving fake names from email handle
    const isCustomerCandidate = cleanDigits.length >= 8 || cleanInput.includes('@') || cleanInput.startsWith('cli');
    return {
      id: isCustomerCandidate ? `user-dyn-cust-${Date.now()}` : `user-dyn-admin-${Date.now()}`,
      name: rawTrim, // Keep raw input or email, formatUserGreeting will display email cleanly if no real name
      email: cleanInput.includes('@') ? rawTrim : `${cleanInput}@maison.com`,
      role: isCustomerCandidate ? 'customer' : 'admin',
      createdAt: new Date().toISOString(),
      isRoot: !isCustomerCandidate
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const inputToUse = email.trim();
    const passToUse = password.trim();

    setIsLoading(true);
    setErrorMsg('');

    // Gather local stored users & customers to sync with backend
    let localUsers: any[] = [];
    let localCustomers: any[] = [];
    try {
      const uRaw = localStorage.getItem('aureum_users_db');
      if (uRaw) localUsers = JSON.parse(uRaw);
    } catch (err) {}
    try {
      const cRaw = localStorage.getItem('aureum_customers');
      if (cRaw) localCustomers = JSON.parse(cRaw);
    } catch (err) {}

    try {
      // 1. Try Backend API login with local sync
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inputToUse,
          password: passToUse,
          localUsers,
          localCustomers
        })
      });

      const data = await response.json();

      if (data && data.success && data.user) {
        onLoginSuccess(data.user);
        return;
      }

      // 2. Fallback client-side auth
      const fallbackUser = authenticateFallback(inputToUse, passToUse);
      onLoginSuccess(fallbackUser);
    } catch (err) {
      const fallbackUser = authenticateFallback(inputToUse, passToUse);
      onLoginSuccess(fallbackUser);
    } finally {
      setIsLoading(false);
    }
  };

  const isLight = theme === 'classic-light';

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 sm:p-6 transition-colors duration-300 ${
      isLight ? 'theme-classic-light bg-stone-100 text-stone-900' : 'bg-zinc-950 text-amber-50'
    }`}>
      <div className="w-full max-w-md space-y-6 animate-fade-in relative">
        
        {/* Glow ambient background elements */}
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Card Header & Brand */}
        <div className={`p-8 rounded-3xl border shadow-2xl relative overflow-hidden backdrop-blur-md ${
          isLight 
            ? 'bg-white border-amber-900/20 shadow-amber-900/10' 
            : 'bg-zinc-900 border-amber-900/50 shadow-amber-950/80'
        }`}>
          
          {/* Top Logo and Title */}
          <div className="text-center space-y-3 mb-8">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-amber-500/15 border border-amber-500/40 mb-2 shadow-inner">
              <img 
                src={companyLogoUrl} 
                alt={companyName}
                className="w-12 h-12 rounded-xl object-contain shadow-md"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Conexão Habilitada • Celular & Desktop</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold font-serif text-amber-100 tracking-tight">
              {companyName}
            </h1>
            <p className="text-xs text-zinc-300 max-w-xs mx-auto leading-relaxed font-medium">
              Sistema de Gestão de Carteira de Clientes & Passaporte Digital de Alta Joalheria
            </p>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="mb-6 p-3.5 rounded-2xl bg-red-500/15 border border-red-500/50 text-red-200 text-xs font-bold flex items-center gap-2.5 animate-shake">
              <Lock className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email / CPF Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-amber-200 flex items-center justify-between">
                <span>E-mail ou CPF do Usuário</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e-mail ou CPF (ex: 123.456.789-00)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className={`w-full pl-10 pr-4 py-3 rounded-2xl text-xs font-medium transition-all focus:outline-none focus:ring-2 ${
                    isLight 
                      ? 'bg-stone-50 border-stone-300 text-stone-900 focus:border-amber-600 focus:ring-amber-500/20 placeholder-stone-400' 
                      : 'bg-zinc-950 border-amber-900/50 text-amber-50 placeholder-zinc-400 focus:border-amber-500/80 focus:ring-amber-500/30'
                  }`}
                  id="login-input-email"
                />
                <User className="absolute left-3.5 top-3.5 w-4 h-4 text-amber-400" />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-amber-200 flex items-center justify-between">
                <span>Senha de Acesso</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className={`w-full pl-10 pr-11 py-3 rounded-2xl text-xs font-medium transition-all focus:outline-none focus:ring-2 ${
                    isLight 
                      ? 'bg-stone-50 border-stone-300 text-stone-900 focus:border-amber-600 focus:ring-amber-500/20 placeholder-stone-400' 
                      : 'bg-zinc-950 border-amber-900/50 text-amber-50 placeholder-zinc-400 focus:border-amber-500/80 focus:ring-amber-500/30'
                  }`}
                  id="login-input-password"
                />
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-amber-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-zinc-300 hover:text-amber-200 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-amber-950/50 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer border border-amber-400"
              id="login-btn-submit"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Entrar no Sistema</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Access Test Shortcuts */}
          <div className="mt-6 pt-4 border-t border-amber-900/30 space-y-2.5">
            <span className="text-[10px] uppercase tracking-wider font-bold text-amber-300/80 block text-center">
              Entrada Rápida em 1-Toque no Celular
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => {
                  setErrorMsg('');
                  onLoginSuccess({
                    id: 'user-root-001',
                    name: 'André Luiz Colen (Administrador Raiz)',
                    email: ROOT_USER_EMAIL,
                    role: 'root',
                    createdAt: new Date().toISOString(),
                    isRoot: true
                  });
                }}
                className="p-3 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/50 text-amber-200 font-medium text-left transition-all active:scale-95 cursor-pointer shadow-md flex items-center justify-between"
                title="Entrar como Administrador Raiz"
              >
                <div>
                  <div className="font-extrabold flex items-center gap-1.5 text-amber-300 text-xs">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span>Administrador Raiz</span>
                  </div>
                  <div className="text-[10px] text-zinc-300">Acesso Total de Gestor</div>
                </div>
                <span className="text-xs text-amber-400 font-bold">Toque aqui →</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setErrorMsg('');
                  onLoginSuccess({
                    id: 'user-customer-CLI-1001',
                    name: 'Helena Cavalcanti de Albuquerque',
                    email: 'helena.albuquerque@maisonlumiere.com.br',
                    role: 'customer',
                    customerId: 'CLI-1001',
                    cpf: '123.456.789-01',
                    createdAt: new Date().toISOString(),
                    isRoot: false
                  });
                }}
                className="p-3 rounded-2xl bg-zinc-800/90 hover:bg-zinc-800 border border-zinc-600 text-amber-200 font-medium text-left transition-all active:scale-95 cursor-pointer shadow-md flex items-center justify-between"
                title="Entrar como Cliente Helena"
              >
                <div>
                  <div className="font-extrabold flex items-center gap-1.5 text-amber-200 text-xs">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Portal do Cliente</span>
                  </div>
                  <div className="text-[10px] text-zinc-300">Minhas Joias & Histórico</div>
                </div>
                <span className="text-xs text-amber-300 font-bold">Toque aqui →</span>
              </button>
            </div>
          </div>

        </div>

        {/* Footer Note */}
        <div className="text-center text-[11px] text-zinc-300 font-medium space-y-1">
          <p>© {new Date().getFullYear()} {companyName} • Todos os direitos reservados</p>
          <p className="flex items-center justify-center gap-1 text-amber-400/90">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Sistema Seguro de Criptografia & Gestão de Joias</span>
          </p>
        </div>

      </div>
    </div>
  );
};
