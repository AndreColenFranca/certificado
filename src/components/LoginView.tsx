import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, Crown, Sparkles, KeyRound } from 'lucide-react';
import { AppUser } from '../types';

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

  const handleFillRootCredentials = () => {
    setEmail('andreluiz.colen@gmail.com');
    setPassword('fofa!@#');
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg('Por favor, informe seu e-mail e senha de acesso.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      // 1. Try Backend API login
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });

      const data = await response.json();

      if (response.ok && data.success && data.user) {
        onLoginSuccess(data.user);
        return;
      }

      // 2. Fallback check for ROOT credentials or stored users in localStorage
      const cleanEmail = email.trim().toLowerCase();
      if (cleanEmail === 'andreluiz.colen@gmail.com' && password === 'fofa!@#') {
        const rootUser: AppUser = {
          id: 'user-root-001',
          name: 'André Luiz Colen (Administrador Raiz)',
          email: 'andreluiz.colen@gmail.com',
          role: 'root',
          createdAt: new Date().toISOString(),
          isRoot: true
        };
        onLoginSuccess(rootUser);
        return;
      }

      // Check client-side persisted users
      const storedUsersRaw = localStorage.getItem('aureum_users_db');
      if (storedUsersRaw) {
        try {
          const storedUsers: any[] = JSON.parse(storedUsersRaw);
          const matched = storedUsers.find(
            u => u.email.toLowerCase() === cleanEmail && u.password === password
          );
          if (matched) {
            const { password: _, ...userSafe } = matched;
            onLoginSuccess(userSafe);
            return;
          }
        } catch (e) {
          // quiet catch
        }
      }

      setErrorMsg(data.message || 'E-mail ou senha inválidos. Verifique os dados digitados.');
    } catch (err) {
      // Fallback offline login check
      const cleanEmail = email.trim().toLowerCase();
      if (cleanEmail === 'andreluiz.colen@gmail.com' && password === 'fofa!@#') {
        const rootUser: AppUser = {
          id: 'user-root-001',
          name: 'André Luiz Colen (Administrador Raiz)',
          email: 'andreluiz.colen@gmail.com',
          role: 'root',
          createdAt: new Date().toISOString(),
          isRoot: true
        };
        onLoginSuccess(rootUser);
        return;
      }

      // Check client-side persisted users on network error
      const storedUsersRaw = localStorage.getItem('aureum_users_db');
      if (storedUsersRaw) {
        try {
          const storedUsers: any[] = JSON.parse(storedUsersRaw);
          const matched = storedUsers.find(
            u => u.email.toLowerCase() === cleanEmail && u.password === password
          );
          if (matched) {
            const { password: _, ...userSafe } = matched;
            onLoginSuccess(userSafe);
            return;
          }
        } catch (e) {}
      }

      setErrorMsg('Falha na conexão. Verifique suas credenciais.');
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

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Acesso Restrito & Autenticado</span>
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
            
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-amber-200 flex items-center justify-between">
                <span>E-mail do Usuário</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="seu-email@maison.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 rounded-2xl text-xs font-medium transition-all focus:outline-none focus:ring-2 ${
                    isLight 
                      ? 'bg-stone-50 border-stone-300 text-stone-900 focus:border-amber-600 focus:ring-amber-500/20 placeholder-stone-400' 
                      : 'bg-zinc-950 border-amber-900/50 text-amber-50 placeholder-zinc-400 focus:border-amber-500/80 focus:ring-amber-500/30'
                  }`}
                  id="login-input-email"
                />
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-amber-400" />
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
          <div className="mt-6 pt-4 border-t border-amber-900/30 space-y-2">
            <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 block text-center">
              Atalhos de Acesso para Teste
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => {
                  setEmail('andreluiz.colen@gmail.com');
                  setPassword('fofa!@#');
                  setErrorMsg('');
                }}
                className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-200 font-medium text-left truncate transition-colors cursor-pointer"
                title="Acesso como Administrador Raiz"
              >
                <div className="font-bold flex items-center gap-1 text-amber-400">
                  <Crown className="w-3 h-3" />
                  <span>Admin Raiz</span>
                </div>
                <div className="text-[9px] text-zinc-400 truncate">andreluiz.colen@gmail.com</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmail('helena.albuquerque@maisonlumiere.com.br');
                  setPassword('123456');
                  setErrorMsg('');
                }}
                className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700 text-amber-200 font-medium text-left truncate transition-colors cursor-pointer"
                title="Acesso como Cliente Helena Cavalcanti"
              >
                <div className="font-bold flex items-center gap-1 text-amber-300">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>Cliente Helena</span>
                </div>
                <div className="text-[9px] text-zinc-400 truncate">helena.albuquerque@...</div>
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
