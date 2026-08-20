import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, Sparkles, KeyRound, User } from 'lucide-react';
import { AppUser } from '../types';
import { ROOT_USER_EMAIL } from '../config/constants';
import { OrgSelectView } from './OrgSelectView';

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
  const [pendingUser, setPendingUser] = useState<any>(null);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const inputToUse = email.trim();
    const passToUse = password.trim();

    setIsLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inputToUse,
          password: passToUse
        })
      });

      const data = await response.json();

      if (data && data.success && data.user) {
        // Se customer tem múltiplas orgs, mostrar seletor
        if (data.user.requiresOrgSelection) {
          setPendingUser(data.user);
        } else {
          onLoginSuccess(data.user);
        }
      } else {
        setErrorMsg(data?.error || 'Falha ao fazer login');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao conectar com servidor');
    } finally {
      setIsLoading(false);
    }
  };

  // Se há usuário pendente (escolhendo org), mostrar seletor
  if (pendingUser) {
    return (
      <OrgSelectView
        user={pendingUser}
        onOrgSelected={onLoginSuccess}
        onBack={() => setPendingUser(null)}
        companyName={companyName}
        companyLogoUrl={companyLogoUrl}
        theme={theme}
      />
    );
  }

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
                className="w-16 h-16 rounded-xl object-contain shadow-md"
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
