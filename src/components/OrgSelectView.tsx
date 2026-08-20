import React, { useState } from 'react';
import { Building2, ChevronRight, Crown } from 'lucide-react';
import { AppUser } from '../types';
import { fetchWithAuth } from '../utils/fetchWithAuth';

interface OrgSelectViewProps {
  user: any;
  onOrgSelected: (user: AppUser) => void;
  onBack: () => void;
  companyName: string;
  companyLogoUrl: string;
  theme?: 'luxury-dark' | 'classic-light';
}

export const OrgSelectView: React.FC<OrgSelectViewProps> = ({
  user,
  onOrgSelected,
  onBack,
  companyName,
  companyLogoUrl,
  theme = 'luxury-dark'
}) => {
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSelectOrg = async (orgId: string) => {
    setIsLoading(true);
    setErrorMsg('');

    try {
      // O servidor identifica quem escolhe pelo token, entao aqui vai so a
      // joalheria escolhida.
      const response = await fetchWithAuth('/api/customer/select-org', {
        method: 'POST',
        body: JSON.stringify({ orgId })
      });

      const data = await response.json();

      if (data && data.success && data.user) {
        if (data.token) {
          sessionStorage.setItem('session_token', data.token);
        }
        onOrgSelected(data.user);
      } else {
        setErrorMsg(data?.error || 'Falha ao selecionar organização');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao conectar com servidor');
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

          <div className="text-center space-y-4 mb-8">
            {/* Mesmo bloco do login: a logo em altura fixa e largura livre.
                Antes ela era espremida num quadrado de 64px dentro de uma
                caixa, o que encolhia logos largas ate ficarem ilegiveis. */}
            <div className="inline-flex items-center justify-center mb-4">
              {companyLogoUrl ? (
                <img src={companyLogoUrl} alt={companyName || 'Logo'} className="h-20 w-auto max-w-xs" />
              ) : (
                <Crown className="w-8 h-8 text-amber-500" />
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold font-serif text-amber-100 tracking-tight">
              Selecione a Joalheria
            </h1>
            <p className="text-xs text-zinc-300 max-w-xs mx-auto leading-relaxed font-medium">
              Você é cliente em múltiplas organizações. Escolha qual deseja acessar.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-3.5 rounded-2xl bg-red-500/15 border border-red-500/50 text-red-200 text-xs font-bold flex items-center gap-2.5 animate-shake">
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {user.orgs && user.orgs.length > 0 ? (
              user.orgs.map((org: any) => (
                <button
                  key={org.id}
                  onClick={() => handleSelectOrg(org.id)}
                  disabled={isLoading}
                  className={`p-6 rounded-2xl border transition-all flex flex-col items-center justify-center text-center group cursor-pointer h-48 ${
                    isLight
                      ? 'bg-white border-amber-900/20 hover:border-amber-600 hover:shadow-lg hover:shadow-amber-900/20'
                      : 'bg-gradient-to-br from-zinc-800 to-zinc-900 border-amber-900/40 hover:border-amber-500/80 hover:shadow-lg hover:shadow-amber-950/50'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {/* Logo ou Ícone */}
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 ${
                    isLight
                      ? 'bg-amber-50 border border-amber-900/20'
                      : 'bg-amber-500/15 border border-amber-500/40'
                  }`}>
                    <Building2 className={`w-8 h-8 ${isLight ? 'text-amber-700' : 'text-amber-400'}`} />
                  </div>

                  {/* Nome da Organização */}
                  <p className={`font-bold text-sm mb-2 line-clamp-2 ${
                    isLight ? 'text-stone-900' : 'text-amber-100'
                  }`}>
                    {org.name}
                  </p>

                  {/* Indicador de acesso */}
                  <div className={`flex items-center gap-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity ${
                    isLight ? 'text-amber-600' : 'text-amber-400'
                  }`}>
                    <span>Acessar</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </button>
              ))
            ) : (
              <p className="col-span-full text-center text-zinc-400 text-xs py-8">Nenhuma organização disponível</p>
            )}
          </div>

          <button
            onClick={onBack}
            disabled={isLoading}
            className={`w-full py-2.5 px-4 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all ${
              isLight
                ? 'bg-stone-200 text-stone-800 hover:bg-stone-300'
                : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
};
