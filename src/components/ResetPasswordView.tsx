import { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, Crown, Sparkles, KeyRound, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ResetPasswordViewProps {
  onResetSuccess: () => void;
  companyName: string;
  companyLogoUrl: string;
  theme?: 'luxury-dark' | 'classic-light';
}

export const ResetPasswordView = ({
  onResetSuccess,
  companyName,
  companyLogoUrl,
  theme = 'luxury-dark'
}: ResetPasswordViewProps) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (newPassword !== confirmPassword) {
      setErrorMsg('As senhas não conferem');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        setErrorMsg(error.message);
        return;
      }

      setSuccessMsg('✅ Senha redefinida com sucesso! Redirecionando...');
      // Clear app state to force login
      try {
        localStorage.removeItem('aureum_logged_user');
        localStorage.removeItem('aureum_certificates');
        localStorage.removeItem('aureum_customers');
        localStorage.removeItem('aureum_theme');
      } catch (e) {
      }
      setTimeout(() => {
        // Redirect to login with logout flag
        window.location.href = '/?logout=true';
      }, 2000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao redefinir senha');
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
            <p className="text-sm opacity-60">
              Redefinir Senha
            </p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="mb-4 p-4 rounded-lg bg-red-500/30 border border-red-400 text-red-100 text-sm font-medium">
              ❌ {errorMsg}
            </div>
          )}

          {/* Success Message */}
          {successMsg && (
            <div className="mb-4 p-4 rounded-lg bg-green-500/30 border border-green-400 text-green-100 text-sm font-medium shadow-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              {successMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1 opacity-70">
                Nova Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 opacity-40" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl border transition-colors ${
                    isLight
                      ? 'bg-stone-100 border-amber-900/20 text-stone-900 placeholder:text-stone-400'
                      : 'bg-zinc-800 border-amber-900/40 text-amber-50 placeholder:text-zinc-500'
                  } focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute right-3 top-3 opacity-40 hover:opacity-100 transition-opacity disabled:opacity-20"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="relative">
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1 opacity-70">
                Confirmar Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 opacity-40" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl border transition-colors ${
                    isLight
                      ? 'bg-stone-100 border-amber-900/20 text-stone-900 placeholder:text-stone-400'
                      : 'bg-zinc-800 border-amber-900/40 text-amber-50 placeholder:text-zinc-500'
                  } focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  disabled={isLoading}
                  className="absolute right-3 top-3 opacity-40 hover:opacity-100 transition-opacity disabled:opacity-20"
                >
                  {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
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
                  Redefinir Senha
                </>
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};
