import { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, Crown } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ResetPasswordViewProps {
  onResetSuccess: () => void;
  companyName: string;
  companyLogoUrl: string;
  theme?: 'luxury-dark' | 'classic-light';
}

export const ResetPasswordView = ({
  theme = 'luxury-dark'
}: ResetPasswordViewProps) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  // Estabelece a sessão de recovery a partir dos tokens no hash da URL.
  // O cliente PKCE não processa o hash implícito automaticamente, então
  // fazemos isso manualmente com setSession.
  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const type = params.get('type');

    if (accessToken && type === 'recovery') {
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || ''
      }).then(({ error }) => {
        if (error) {
          setErrorMsg('Link inválido ou expirado. Solicite um novo email de recuperação.');
        } else {
          setSessionReady(true);
          // Limpa o hash da URL sem recarregar a página
          window.history.replaceState(null, '', '/auth/reset-password');
        }
      });
    } else {
      // Sessão já pode estar ativa (ex: PKCE trocou o code antes de chegar aqui)
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setSessionReady(true);
        } else {
          setErrorMsg('Link inválido ou expirado. Solicite um novo email de recuperação.');
        }
      });
    }
  }, []);

  const handleSubmit = async (e: { preventDefault: () => void }) => {
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
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('different from the old password') || msg.includes('same as the old password')) {
          setErrorMsg('A nova senha deve ser diferente da senha atual.');
        } else if (msg.includes('at least') || msg.includes('characters')) {
          setErrorMsg('A senha deve ter pelo menos 6 caracteres.');
        } else if (msg.includes('weak') || msg.includes('strength')) {
          setErrorMsg('Senha muito fraca. Use letras, números e símbolos.');
        } else {
          setErrorMsg(error.message);
        }
        return;
      }

      setSuccessMsg('Senha redefinida com sucesso! Redirecionando...');
      try {
        sessionStorage.removeItem('aureum_logged_user');
        sessionStorage.removeItem('aureum_certificates');
        sessionStorage.removeItem('aureum_customers');
        sessionStorage.removeItem('aureum_theme');
      } catch (e) {}
      setTimeout(() => { window.location.href = '/'; }, 2000);
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

        <div className="absolute -top-12 -left-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className={`p-8 rounded-3xl border shadow-2xl relative overflow-hidden backdrop-blur-md ${
          isLight
            ? 'bg-white border-amber-900/20 shadow-amber-900/10'
            : 'bg-zinc-900 border-amber-900/50 shadow-amber-950/80'
        }`}>

          {/* Header — igual ao SupabaseLoginView */}
          <div className="text-center space-y-3 mb-8">
            <div className="inline-flex items-center justify-center mb-4">
              <Crown className="w-8 h-8 text-amber-500" />
            </div>
            <h1 className="text-xl font-semibold text-amber-700">
              Certificado de Joias
            </h1>
            <p className="text-sm opacity-60">Redefinir Senha</p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-sm">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-4 rounded-lg bg-green-600 border-2 border-green-300 text-white text-base font-bold shadow-xl animate-pulse">
              ✅ {successMsg}
            </div>
          )}

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
                  disabled={isLoading || !sessionReady}
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl border transition-colors ${
                    isLight
                      ? 'bg-stone-100 border-amber-900/20 text-stone-900 placeholder:text-stone-400'
                      : 'bg-zinc-800 border-amber-900/40 text-amber-50 placeholder:text-zinc-500'
                  } focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 opacity-40 hover:opacity-100 transition-opacity"
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
                  disabled={isLoading || !sessionReady}
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl border transition-colors ${
                    isLight
                      ? 'bg-stone-100 border-amber-900/20 text-stone-900 placeholder:text-stone-400'
                      : 'bg-zinc-800 border-amber-900/40 text-amber-50 placeholder:text-zinc-500'
                  } focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-3 opacity-40 hover:opacity-100 transition-opacity"
                >
                  {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !sessionReady}
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
