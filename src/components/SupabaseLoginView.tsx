import { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, Crown, Sparkles, KeyRound } from 'lucide-react';
import { AppUser } from '../types';
import { supabaseAuth } from '../utils/supabaseAuth';

interface SupabaseLoginViewProps {
  onLoginSuccess: (user: AppUser) => void;
  companyName: string;
  companyLogoUrl: string;
  theme?: 'luxury-dark' | 'classic-light';
}

export const SupabaseLoginView = ({
  onLoginSuccess,
  companyName,
  companyLogoUrl,
  theme = 'luxury-dark'
}: SupabaseLoginViewProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      if (isForgotPassword) {
        // Send password reset email
        try {
          const response = await fetch('/api/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Erro ao enviar email' }));
            setErrorMsg(errorData.error || 'Erro ao enviar email');
            return;
          }

          const data = await response.json();
          if (data.success) {
            setSuccessMsg('Email de recuperação enviado! Verifique sua caixa de entrada.');
            setEmail('');
          } else {
            setErrorMsg(data.error || 'Erro ao enviar email');
          }
        } catch (err) {
          setErrorMsg(err instanceof Error ? err.message : 'Erro ao enviar email');
        }
      } else {
        let result: { success: boolean; user?: AppUser; error?: string };

        if (isSignUp) {
          if (!name.trim()) {
            setErrorMsg('Nome é obrigatório');
            return;
          }
          result = await supabaseAuth.signUp(email, password, name);
        } else {
          result = await supabaseAuth.signIn(email, password);
        }

        if (result.success && result.user) {
          onLoginSuccess(result.user);
        } else {
          setErrorMsg(result.error || 'Erro na autenticação');
        }
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro desconhecido');
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

        {/* Glow background */}
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Card */}
        <div className={`p-8 rounded-3xl border shadow-2xl relative overflow-hidden backdrop-blur-md ${
          isLight
            ? 'bg-white border-amber-900/20 shadow-amber-900/10'
            : 'bg-zinc-900 border-amber-900/50 shadow-amber-950/80'
        }`}>

          {/* Header */}
          <div className="text-center space-y-3 mb-8">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-amber-500/15 border border-amber-500/40 mb-2 shadow-inner">
              {companyLogoUrl ? (
                <img src={companyLogoUrl} alt="Logo" className="h-8 w-auto" />
              ) : (
                <Crown className="w-6 h-6 text-amber-500" />
              )}
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
              {companyName || 'Maison Lumière'}
            </h1>
            {isSignUp && (
              <p className="text-sm opacity-60">
                Crie sua conta
              </p>
            )}
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-sm">
              {errorMsg}
            </div>
          )}

          {/* Success Message */}
          {successMsg && (
            <div className="mb-4 p-4 rounded-lg bg-green-600 border-2 border-green-300 text-white text-base font-bold shadow-xl animate-pulse">
              ✅ {successMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="relative">
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1 opacity-70">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  className={`w-full px-4 py-2.5 rounded-xl border transition-colors ${
                    isLight
                      ? 'bg-stone-100 border-amber-900/20 text-stone-900 placeholder:text-stone-400'
                      : 'bg-zinc-800 border-amber-900/40 text-amber-50 placeholder:text-zinc-500'
                  } focus:outline-none focus:ring-2 focus:ring-amber-500`}
                />
              </div>
            )}

            <div className="relative">
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1 opacity-70">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 opacity-40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border transition-colors ${
                    isLight
                      ? 'bg-stone-100 border-amber-900/20 text-stone-900 placeholder:text-stone-400'
                      : 'bg-zinc-800 border-amber-900/40 text-amber-50 placeholder:text-zinc-500'
                  } focus:outline-none focus:ring-2 focus:ring-amber-500`}
                />
              </div>
            </div>

            <div className="relative">
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1 opacity-70">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 opacity-40" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={isForgotPassword}
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl border transition-colors ${
                    isLight
                      ? 'bg-stone-100 border-amber-900/20 text-stone-900 placeholder:text-stone-400'
                      : 'bg-zinc-800 border-amber-900/40 text-amber-50 placeholder:text-zinc-500'
                  } focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50`}
                />
                {!isForgotPassword && (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 opacity-40 hover:opacity-100 transition-opacity"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                )}
              </div>

              {!isSignUp && !isForgotPassword && (
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(true);
                    setErrorMsg('');
                    setPassword('');
                  }}
                  className="mt-2 text-xs text-amber-400 hover:text-amber-300 transition-colors"
                >
                  Esqueci minha senha
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-950 font-bold transition-all duration-200 flex items-center justify-center gap-2 mt-6"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  {isForgotPassword ? 'Recuperar Senha' : (isSignUp ? 'Criar Conta' : 'Entrar')}
                </>
              )}
            </button>
          </form>

          {/* Toggle Forgot Password */}
          <div className="mt-6 text-center text-sm opacity-70">
            {isForgotPassword && (
              <>
                Lembrou a senha?{' '}
                <button
                  onClick={() => {
                    setIsForgotPassword(false);
                    setErrorMsg('');
                    setSuccessMsg('');
                    setEmail('');
                  }}
                  className="text-amber-400 hover:text-amber-300 font-semibold"
                >
                  Voltar ao login
                </button>
              </>
            )}
          </div>

          {/* Footer Info */}
          <div className="mt-8 pt-6 border-t border-amber-900/20 flex items-center justify-center gap-2 text-xs opacity-50">
            <Sparkles className="w-4 h-4" />
            <span>Autenticado via Supabase</span>
            <KeyRound className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};
