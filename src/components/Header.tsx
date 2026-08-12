import React, { useState } from 'react';
import { ViewMode, AppUser } from '../types';
import { Search, Gem, PlusCircle, QrCode, Sun, Moon, LogOut, Users, Crown, Menu, ArrowLeft } from 'lucide-react';
import { formatImageUrl } from '../utils/imageUtils';
import { formatUserGreeting } from '../utils/customerUtils';

interface HeaderProps {
  currentMode: ViewMode;
  onSelectMode: (mode: ViewMode) => void;
  onSearchCert: (query: string) => void;
  activeCertId: string | null;
  totalCertificatesCount: number;
  totalCustomersCount?: number;
  companyName?: string;
  companyLogoUrl?: string;
  onOpenCompanyLogoModal?: () => void;
  onOpenQueryCustomersModal?: () => void;
  isQueryModalOpen?: boolean;
  theme?: 'luxury-dark' | 'classic-light';
  onToggleTheme?: () => void;
  onToggleMobileMenu?: () => void;
  currentUser?: AppUser | null;
  onOpenUsersModal?: () => void;
  onLogout?: () => void;
  onGoBack?: () => void;
  canGoBack?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onSelectMode,
  onSearchCert,
  activeCertId,
  totalCertificatesCount,
  totalCustomersCount,
  companyName = 'Maison Lumière Joias',
  companyLogoUrl,
  onOpenCompanyLogoModal,
  onOpenQueryCustomersModal,
  isQueryModalOpen = false,
  theme = 'luxury-dark',
  onToggleTheme,
  onToggleMobileMenu,
  currentUser,
  onOpenUsersModal,
  onLogout,
  onGoBack,
  canGoBack = false
}) => {
  const [searchInput, setSearchInput] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearchCert(searchInput.trim());
      setSearchInput('');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-amber-900/30 text-amber-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* Mobile Menu Toggle & Brand Logo & Mobile Go Back */}
          <div className="flex items-center gap-2 sm:gap-3">
            {onToggleMobileMenu && (
              <button
                onClick={onToggleMobileMenu}
                className="lg:hidden p-2 rounded-xl bg-zinc-900 border border-amber-900/40 text-amber-400 hover:bg-zinc-800 transition-colors"
                title="Abrir Menu Lateral"
                id="header-mobile-menu-btn"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            {canGoBack && onGoBack && (
              <button
                onClick={onGoBack}
                className="sm:hidden p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/50 hover:bg-amber-500/30 transition-all"
                title="Voltar para a página anterior"
                id="header-mobile-btn-go-back"
              >
                <ArrowLeft className="w-5 h-5 text-amber-400" />
              </button>
            )}

            <div 
              onClick={() => onSelectMode(currentUser?.role === 'customer' ? 'customer-portal' : 'public-passport')}
              className="flex items-center cursor-pointer group select-none"
              id="header-brand-logo"
            >
              <div className="relative flex items-center justify-center h-14 sm:h-16 w-auto min-w-[130px] max-w-[240px] sm:max-w-[320px] rounded-2xl bg-zinc-900/90 border border-amber-500/50 p-2 shadow-xl shadow-amber-900/20 group-hover:border-amber-400 group-hover:scale-[1.02] transition-all duration-300">
                <div className="w-full h-full bg-white rounded-xl flex items-center justify-center overflow-hidden px-3 py-1.5 shadow-inner">
                  {companyLogoUrl ? (
                    <img 
                      src={formatImageUrl(companyLogoUrl)} 
                      alt={companyName || 'Logotipo'} 
                      className="max-h-full max-w-full w-auto h-auto object-contain rounded drop-shadow"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }} 
                    />
                  ) : (
                    <div className="flex items-center gap-2.5 text-zinc-950 font-bold font-serif text-base sm:text-lg px-2">
                      <Gem className="w-7 h-7 text-amber-600 group-hover:rotate-12 transition-transform duration-300 shrink-0" />
                      <span className="uppercase tracking-wider">{companyName || 'LOGOTIPO'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Search Input & Go Back Button */}
          <div className="hidden sm:flex items-center gap-2.5 flex-1 max-w-md mx-2 sm:mx-4">
            {canGoBack && onGoBack && (
              <button
                onClick={onGoBack}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 text-amber-200 border border-amber-500/60 rounded-full text-xs font-bold transition-all shadow-md shrink-0 cursor-pointer hover:border-amber-400 active:scale-95"
                title="Voltar para a página anterior"
                id="header-btn-go-back"
              >
                <ArrowLeft className="w-4 h-4 text-amber-400" />
                <span>Voltar</span>
              </button>
            )}

            <form 
              onSubmit={handleSearchSubmit} 
              className="flex-1 relative"
              id="header-search-form"
            >
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Buscar por ID ou N° de Série..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-10 pr-22 py-2 bg-zinc-900/80 border border-amber-900/40 rounded-full text-xs text-amber-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/50 transition-all"
                  id="header-search-input"
                />
                <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-amber-500/60" />
                <button
                  type="submit"
                  className="absolute right-1 top-1 bottom-1 px-3.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold rounded-full transition-all shadow-sm flex items-center justify-center cursor-pointer"
                  id="header-search-submit"
                >
                  Buscar
                </button>
              </div>
            </form>
          </div>

          {/* Header Right Actions */}
          <div className="flex items-center gap-2">
            
            {/* User Badge & Management (If Root user or logged in) */}
            {currentUser && (
              <div className="hidden md:flex items-center gap-2 pr-2 border-r border-amber-900/30">
                {currentUser.role === 'customer' ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs font-semibold">
                    <Users className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="max-w-[120px] truncate">{formatUserGreeting(currentUser).split(' ')[0]}</span>
                    <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 text-[9px] font-bold rounded uppercase">Cliente</span>
                  </div>
                ) : (
                  <button
                    onClick={onOpenUsersModal}
                    title={currentUser.isRoot || currentUser.email.toLowerCase() === 'andreluiz.colen@gmail.com' ? "Gestão de Usuários (Acesso Raiz)" : "Usuário Autenticado"}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-200 text-xs font-semibold transition-all cursor-pointer"
                    id="header-btn-users"
                  >
                    {(currentUser.isRoot || currentUser.email.toLowerCase() === 'andreluiz.colen@gmail.com') ? (
                      <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    ) : (
                      <Users className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    )}
                    <span className="max-w-[120px] truncate">{formatUserGreeting(currentUser).split(' ')[0]}</span>
                    {(currentUser.isRoot || currentUser.email.toLowerCase() === 'andreluiz.colen@gmail.com') && (
                      <span className="px-1.5 py-0.2 bg-amber-500/30 text-amber-300 text-[9px] font-bold rounded uppercase">Raiz</span>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Cadastrar Nova Joia (Hidden for Customer) */}
            {currentUser?.role !== 'customer' && (
              <button
                onClick={() => onSelectMode('create-new')}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 shadow-md shadow-amber-900/30 transition-all cursor-pointer"
                id="header-btn-create"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Cadastrar Nova Joia</span>
              </button>
            )}

            {/* Theme Switcher Toggle */}
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                title={theme === 'luxury-dark' ? "Alternar para tema Claro" : "Alternar para tema Escuro"}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-amber-300 border border-amber-500/40 transition-all shadow-sm cursor-pointer"
                id="header-btn-theme-switcher"
              >
                {theme === 'luxury-dark' ? (
                  <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                ) : (
                  <Moon className="w-4 h-4 text-amber-600 shrink-0" />
                )}
              </button>
            )}

            {/* Logout Button */}
            {onLogout && (
              <button
                onClick={onLogout}
                title="Sair da Conta (Logout)"
                className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 transition-all cursor-pointer"
                id="header-btn-logout"
              >
                <LogOut className="w-4 h-4 text-red-400" />
              </button>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
