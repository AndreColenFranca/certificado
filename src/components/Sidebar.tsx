import React, { useState } from 'react';
import { ViewMode, AppUser } from '../types';
import { ROOT_USER_EMAIL } from '../config/constants';
import {
  ShieldCheck,
  Users,
  Search,
  LayoutDashboard,
  PlusCircle,
  Sun,
  Moon,
  X,
  Sparkles,
  LogOut,
  Crown,
  UserCheck,
  QrCode,
  ArrowRightLeft,
  FileText,
  ChevronDown,
  ChevronRight,
  Building2,
  Gem
} from 'lucide-react';

import { formatUserGreeting } from '../utils/customerUtils';

interface SidebarProps {
  currentMode: ViewMode;
  onSelectMode: (mode: ViewMode) => void;
  totalCertificatesCount: number;
  totalCustomersCount?: number;
  onOpenQueryCustomersModal?: () => void;
  onOpenLinkCustomerModal?: () => void;
  onOpenCompanyLogoModal?: () => void;
  isQueryModalOpen?: boolean;
  theme?: 'luxury-dark' | 'classic-light';
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  onToggleTheme?: () => void;
  currentUser?: AppUser | null;
  onOpenUsersModal?: () => void;
  onOpenOrganizationsView?: () => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentMode,
  onSelectMode,
  totalCertificatesCount,
  totalCustomersCount = 0,
  onOpenQueryCustomersModal,
  onOpenLinkCustomerModal,
  onOpenCompanyLogoModal,
  isQueryModalOpen = false,
  theme = 'luxury-dark',
  isOpenMobile = false,
  onCloseMobile,
  onToggleTheme,
  currentUser,
  onOpenUsersModal,
  onOpenOrganizationsView,
  onLogout
}) => {
  const isCustomer = currentUser?.role === 'customer';
  const [isDashboardSubmenuOpen, setIsDashboardSubmenuOpen] = useState(true);

  const navItems = isCustomer
    ? [
        {
          id: 'customer-portal',
          label: 'Minhas Joias Adquiridas',
          icon: ShieldCheck,
          onClick: () => {
            onSelectMode('customer-portal');
            if (onCloseMobile) onCloseMobile();
          },
          isActive: currentMode === 'customer-portal',
          badge: null
        },
        {
          id: 'scanner',
          label: 'Escanear QR Code',
          icon: QrCode,
          onClick: () => {
            onSelectMode('scanner');
            if (onCloseMobile) onCloseMobile();
          },
          isActive: currentMode === 'scanner',
          badge: null
        }
      ]
    : [
        {
          id: 'jeweler-dashboard',
          label: 'Painel Joalheria',
          icon: LayoutDashboard,
          onClick: () => {
            onSelectMode('jeweler-dashboard');
            setIsDashboardSubmenuOpen(prev => !prev);
            if (onCloseMobile) onCloseMobile();
          },
          isActive: currentMode === 'jeweler-dashboard' || currentMode === 'create-new',
          badge: totalCertificatesCount,
          hasSubmenu: true,
          submenuItems: [
            {
              id: 'sub-jeweler-dashboard',
              label: 'Acervo de Joias',
              icon: LayoutDashboard,
              onClick: () => {
                onSelectMode('jeweler-dashboard');
                if (onCloseMobile) onCloseMobile();
              },
              isActive: false
            },
            {
              id: 'sub-create-new',
              label: 'Cadastrar Nova Joia',
              icon: PlusCircle,
              onClick: () => {
                onSelectMode('create-new');
                if (onCloseMobile) onCloseMobile();
              },
              isActive: currentMode === 'create-new'
            },
            {
              id: 'sub-link-customer',
              label: 'Vincular Joia ao Cliente',
              icon: ArrowRightLeft,
              onClick: () => {
                if (onOpenLinkCustomerModal) onOpenLinkCustomerModal();
                if (onCloseMobile) onCloseMobile();
              },
              isActive: false
            },
            {
              id: 'sub-query-customer',
              label: 'Consultar Cliente por Joia',
              icon: Search,
              onClick: () => {
                if (onOpenQueryCustomersModal) onOpenQueryCustomersModal();
                if (onCloseMobile) onCloseMobile();
              },
              isActive: isQueryModalOpen
            },
            {
              id: 'sub-company-logo',
              label: 'Configurar Logotipo',
              icon: FileText,
              onClick: () => {
                if (onOpenCompanyLogoModal) onOpenCompanyLogoModal();
                if (onCloseMobile) onCloseMobile();
              },
              isActive: false
            },
            {
              id: 'sub-attributes',
              label: 'Atributos Peças',
              icon: Gem,
              onClick: () => {
                onSelectMode('attributes');
                if (onCloseMobile) onCloseMobile();
              },
              isActive: currentMode === 'attributes'
            }
          ]
        },
        {
          id: 'public-passport',
          label: 'Passaporte Público',
          icon: ShieldCheck,
          onClick: () => {
            onSelectMode('public-passport');
            if (onCloseMobile) onCloseMobile();
          },
          isActive: currentMode === 'public-passport',
          badge: null
        },
        {
          id: 'customers',
          label: 'Clientes',
          icon: Users,
          onClick: () => {
            onSelectMode('customers');
            if (onCloseMobile) onCloseMobile();
          },
          isActive: currentMode === 'customers',
          badge: totalCustomersCount
        }
      ];

  const sidebarContent = (
    <div className="flex flex-col h-full py-5 px-3 space-y-6">
      {/* Sidebar Header Title */}
      <div className="px-3 pb-2 border-b border-amber-900/20 flex items-center justify-between">
        <span className="text-[11px] font-bold tracking-widest text-amber-500 uppercase flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" /> Funcionalidades
        </span>
        {onCloseMobile && (
          <button 
            onClick={onCloseMobile}
            className="lg:hidden p-1 rounded-lg text-zinc-400 hover:text-amber-300 hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Primary Navigation List */}
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <React.Fragment key={item.id}>
              <button
                onClick={item.onClick}
                id={`sidebar-nav-${item.id}`}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold transition-all duration-200 border cursor-pointer ${
                  item.isActive
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-md shadow-amber-950/20'
                    : theme === 'classic-light'
                      ? 'bg-stone-100/90 text-stone-800 border-stone-200 hover:bg-amber-100/60 hover:text-amber-900 hover:border-amber-300'
                      : 'bg-zinc-900/80 text-zinc-300 border-amber-900/30 hover:bg-zinc-800 hover:text-amber-200 hover:border-amber-500/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 shrink-0 ${item.isActive ? 'text-amber-400' : 'text-amber-500/70'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {item.badge !== null && item.badge !== undefined && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      item.isActive
                        ? 'bg-amber-500/30 text-amber-200 border-amber-400/50'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                  {item.hasSubmenu && (
                    isDashboardSubmenuOpen ? (
                      <ChevronDown className="w-4 h-4 text-amber-400 shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0" />
                    )
                  )}
                </div>
              </button>

              {/* Submenu rendering */}
              {item.hasSubmenu && ((item.id === 'jeweler-dashboard' && isDashboardSubmenuOpen)) && item.submenuItems && (
                <div className="ml-4 pl-2 border-l-2 border-amber-500/30 space-y-1 my-1 animate-fade-in">
                  {item.submenuItems.map((sub: any) => {
                    const SubIcon = sub.icon;
                    const handleSubClick = () => {
                      if (sub.attributeKey) {
                        // For attributes: store in sessionStorage and navigate
                        sessionStorage.setItem('selectedAttributeKey', sub.attributeKey);
                        onSelectMode('attributes');
                      } else if (sub.onClick) {
                        sub.onClick();
                      }
                      if (onCloseMobile) onCloseMobile();
                    };
                    return (
                      <button
                        key={sub.id}
                        onClick={handleSubClick}
                        id={`sidebar-subnav-${sub.id}`}
                        className={`w-full flex items-start gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all border cursor-pointer text-left ${
                          sub.isActive
                            ? 'bg-amber-500/30 text-amber-200 border-amber-500/60 font-bold'
                            : theme === 'classic-light'
                              ? 'text-stone-700 border-transparent hover:bg-amber-100/50 hover:text-amber-900'
                              : 'text-zinc-400 border-transparent hover:bg-zinc-800/80 hover:text-amber-300'
                        }`}
                      >
                        <SubIcon className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span className="leading-snug break-words">{sub.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </nav>

      {/* Secondary Actions */}
      <div className="pt-4 border-t border-amber-900/20 space-y-2.5">
        
        {/* Logged User Info & User Management */}
        {currentUser && (
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
            <div className="flex items-center gap-2">
              {(currentUser.isRoot || currentUser.email.toLowerCase() === ROOT_USER_EMAIL.toLowerCase()) ? (
                <Crown className="w-4 h-4 text-amber-400 shrink-0" />
              ) : (
                <UserCheck className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <span className="block font-bold text-xs text-amber-100 truncate">{formatUserGreeting(currentUser)}</span>
                <span className="block text-[10px] text-zinc-400 truncate">{currentUser.email}</span>
              </div>
            </div>

            {onOpenUsersModal && !isCustomer && (
              <button
                onClick={() => {
                  onOpenUsersModal();
                  if (onCloseMobile) onCloseMobile();
                }}
                className="w-full py-1.5 px-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                id="sidebar-btn-users"
              >
                <Users className="w-3.5 h-3.5 text-amber-400" />
                <span>Gestão de Usuários</span>
              </button>
            )}

            {onOpenOrganizationsView && currentUser?.isRoot && (
              <button
                onClick={() => {
                  if (onOpenOrganizationsView) onOpenOrganizationsView();
                  if (onCloseMobile) onCloseMobile();
                }}
                className="w-full py-1.5 px-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                id="sidebar-btn-organizations"
              >
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Gerenciar Joalherias</span>
              </button>
            )}
          </div>
        )}



        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className={`w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
              theme === 'classic-light'
                ? 'bg-stone-100 text-stone-800 border-stone-300 hover:bg-stone-200'
                : 'bg-zinc-900 text-amber-300 border-amber-900/40 hover:bg-zinc-800'
            }`}
            id="sidebar-btn-theme"
          >
            {theme === 'luxury-dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span>Tema Claro</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-amber-600" />
                <span>Tema Escuro</span>
              </>
            )}
          </button>
        )}

        {/* Logout Button in Sidebar */}
        {onLogout && (
          <button
            onClick={() => {
              onLogout();
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 transition-all cursor-pointer"
            id="sidebar-btn-logout"
          >
            <LogOut className="w-4 h-4 text-red-400" />
            <span>Sair do Sistema</span>
          </button>
        )}

      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Permanent Left Sidebar */}
      <aside className={`hidden lg:block w-64 shrink-0 sticky top-20 h-[calc(100vh-80px)] border-r transition-colors duration-300 overflow-y-auto ${
        theme === 'classic-light'
          ? 'bg-stone-50/95 border-stone-200'
          : 'bg-zinc-950/95 border-amber-900/30'
      }`}>
        {sidebarContent}
      </aside>

      {/* Mobile Slide-over Overlay */}
      {isOpenMobile && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          {/* Drawer Panel */}
          <div className={`relative w-72 max-w-full h-full shadow-2xl transition-transform duration-300 overflow-y-auto ${
            theme === 'classic-light'
              ? 'bg-stone-50 text-stone-900'
              : 'bg-zinc-950 text-amber-50'
          }`}>
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
