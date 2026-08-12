import React, { useState, useEffect } from 'react';
import { JewelryCertificate, Customer } from '../types';
import { 
  X, Search, Gem, Users, User, ShieldCheck, Calendar, ArrowRightLeft, 
  Mail, Phone, CreditCard, Sparkles, CheckCircle2, History, PlusCircle, ExternalLink, Award, FileText
} from 'lucide-react';
import { formatImageUrl } from '../utils/imageUtils';
import { isRootCert, isChildCert, getChildCertificatesForParent } from '../utils/certHierarchy';

interface JewelryCustomerQueryModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificates: JewelryCertificate[];
  customers: Customer[];
  initialCertId?: string | null;
  onOpenLinkModal?: (cert: JewelryCertificate) => void;
  onSelectCustomer?: (customer: Customer) => void;
  onSelectCertForView?: (cert: JewelryCertificate) => void;
}

export const JewelryCustomerQueryModal: React.FC<JewelryCustomerQueryModalProps> = ({
  isOpen,
  onClose,
  certificates,
  customers,
  initialCertId,
  onOpenLinkModal,
  onSelectCustomer,
  onSelectCertForView
}) => {
  if (!isOpen) return null;

  // Root / Parent Certificates list for selection
  const rootCertificates = certificates.filter(isRootCert);

  // Find initial root cert ID
  const getInitialRootId = () => {
    if (!initialCertId) return rootCertificates[0]?.id || '';
    const found = certificates.find(c => c.id === initialCertId);
    if (!found) return rootCertificates[0]?.id || '';
    if (isRootCert(found)) return found.id;
    if (found.parentCertId) return found.parentCertId;
    // Fallback match root by title
    const matchRoot = rootCertificates.find(r => r.title.trim().toLowerCase() === found.title.trim().toLowerCase());
    return matchRoot ? matchRoot.id : rootCertificates[0]?.id || '';
  };

  const [selectedRootId, setSelectedRootId] = useState<string>(getInitialRootId());
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const initId = getInitialRootId();
    if (initId) {
      setSelectedRootId(initId);
    }
  }, [initialCertId, certificates, isOpen]);

  // Filter Root Certificates by search term
  const filteredRootCertificates = rootCertificates.filter(c => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase().trim();
    const children = getChildCertificatesForParent(c, certificates);
    const matchesChildCustomer = children.some(ch => 
      (ch.currentOwnerName && ch.currentOwnerName.toLowerCase().includes(q)) ||
      (ch.ownerCpf && ch.ownerCpf.toLowerCase().includes(q)) ||
      (ch.serialNumber && ch.serialNumber.toLowerCase().includes(q))
    );

    return (
      c.title.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q) ||
      c.serialNumber.toLowerCase().includes(q) ||
      c.collection.toLowerCase().includes(q) ||
      matchesChildCustomer
    );
  });

  const selectedRootCert = rootCertificates.find(c => c.id === selectedRootId) || rootCertificates[0] || null;

  // Retrieve all Child Certificates for selected Root Certificate
  const childCertificates = selectedRootCert 
    ? getChildCertificatesForParent(selectedRootCert, certificates)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in text-amber-50">
      <div className="relative w-full max-w-4xl bg-zinc-950 border border-amber-900/60 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-900/40 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Search className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-amber-100">
                Consulta por Joia Pai & Joias Filhas dos Clientes
              </h2>
              <p className="text-xs text-zinc-400">
                Selecione a Joia Pai / Raiz do catálogo para exibir todas as Joias Filhas emitidas para os clientes.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-amber-200 transition-colors"
            id="btn-close-query-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Selector Bar */}
        <div className="bg-zinc-900/90 p-4 rounded-2xl border border-amber-900/40 space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <input
                type="text"
                placeholder="Filtrar joias pai por título, ID, número de série ou cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-amber-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                id="query-cert-search"
              />
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-amber-500/60" />
            </div>

            <div className="w-full sm:w-auto">
              <select
                value={selectedRootId}
                onChange={(e) => setSelectedRootId(e.target.value)}
                className="w-full sm:w-96 p-2.5 bg-zinc-950 border border-amber-900/60 rounded-xl text-amber-200 font-bold text-xs focus:outline-none focus:border-amber-500"
                id="query-cert-select"
              >
                {filteredRootCertificates.map(c => {
                  const childrenCount = getChildCertificatesForParent(c, certificates).length;
                  return (
                    <option key={c.id} value={c.id}>
                      [Joia Pai] {c.title} ({c.id}) — {childrenCount} filha(s) emitida(s)
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>

        {selectedRootCert && (
          <div className="space-y-6">
            
            {/* JOIA PAI / RAIZ SELECIONADA CARD */}
            <div className="bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-amber-950/30 p-5 rounded-2xl border border-amber-900/50 flex flex-col sm:flex-row items-start sm:items-center gap-5 shadow-lg">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-black border border-zinc-800 p-1 shrink-0 overflow-hidden relative shadow-md">
                <img
                  src={formatImageUrl(selectedRootCert.images[0])}
                  alt={selectedRootCert.title}
                  className="w-full h-full object-cover rounded-lg"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute top-2 right-2 p-1 rounded-md bg-zinc-950/80 border border-amber-500/30 text-amber-300">
                  <Award className="w-3.5 h-3.5" />
                </span>
              </div>

              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                    Joia Pai / Modelo Base
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono text-zinc-300 bg-zinc-900 border border-zinc-800">
                    ID Raiz: {selectedRootCert.id}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800">
                    Série Base: {selectedRootCert.serialNumber}
                  </span>
                </div>

                <h3 className="text-xl font-bold font-serif text-amber-100 truncate">
                  {selectedRootCert.title}
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-zinc-300 pt-1">
                  <div>
                    <span className="text-zinc-500 block text-[10px]">Metal & Acabamento:</span>
                    <span className="font-semibold text-amber-200">
                      {selectedRootCert.metalPurity} ({selectedRootCert.grossWeightGrams}g{selectedRootCert.widthCm && selectedRootCert.widthCm > 0 ? `, ${selectedRootCert.widthCm}cm` : ''})
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">Coleção / Ateliê:</span>
                    <span className="font-semibold text-zinc-200">{selectedRootCert.collection}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">Valor Estimado Base:</span>
                    <span className="font-bold text-emerald-300">
                      {selectedRootCert.estimatedValueBRL 
                        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedRootCert.estimatedValueBRL)
                        : 'Sob Consulta'}
                    </span>
                  </div>
                </div>
              </div>

              {onOpenLinkModal && (
                <button
                  onClick={() => onOpenLinkModal(selectedRootCert)}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shrink-0 self-stretch sm:self-center justify-center shadow-lg transition-transform hover:scale-105 cursor-pointer"
                  id="btn-link-from-query"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Emitir / Vincular Joia Filha</span>
                </button>
              )}
            </div>

            {/* SEÇÃO: EXIBIÇÃO DE TODAS AS JOIAS FILHAS DOS CLIENTES */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-amber-900/30 pb-2">
                <h4 className="font-serif text-lg font-bold text-amber-200 flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-400" />
                  <span>Joias Filhas Emitidas para Clientes ({childCertificates.length})</span>
                </h4>
                <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
                  {childCertificates.length} Passaporte(s) Digital(is) de Clientes
                </span>
              </div>

              {childCertificates.length === 0 ? (
                <div className="bg-zinc-900/60 border border-dashed border-amber-900/50 p-8 rounded-2xl text-center space-y-3">
                  <User className="w-10 h-10 text-amber-500/50 mx-auto" />
                  <p className="text-sm text-amber-100 font-bold">
                    Nenhuma Joia Filha foi emitida para clientes ainda a partir desta Joia Pai.
                  </p>
                  <p className="text-xs text-zinc-400">
                    A Joia Pai permanece intacta como modelo base no catálogo. Você pode vincular e emitir uma Joia Filha para qualquer cliente agora mesmo.
                  </p>
                  {onOpenLinkModal && (
                    <button
                      onClick={() => onOpenLinkModal(selectedRootCert)}
                      className="px-4 py-2.5 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs inline-flex items-center gap-2 shadow-md hover:bg-amber-400 transition-colors cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Emitir Primeira Joia Filha para Cliente</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {childCertificates.map((child) => {
                    // Find customer object if available
                    const matchedCustomer = customers.find(c => 
                      (child.ownerId && c.id === child.ownerId) ||
                      (child.ownerCpf && c.cpf.replace(/\D/g, '') === child.ownerCpf.replace(/\D/g, '')) ||
                      (child.currentOwnerName && c.name.trim().toLowerCase() === child.currentOwnerName.trim().toLowerCase())
                    );

                    return (
                      <div 
                        key={child.id}
                        className="p-5 rounded-2xl space-y-3 shadow-xl transition-all border bg-zinc-900/90 border-amber-900/60 hover:border-amber-500/70"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-900/30 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/40 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Joia Filha (Passaporte do Cliente)</span>
                            </span>

                            <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                              N° Série Exclusivo: {child.serialNumber}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {onSelectCertForView && (
                              <button
                                onClick={() => {
                                  onSelectCertForView(child);
                                  onClose();
                                }}
                                className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-300 font-semibold text-xs flex items-center gap-1 border border-amber-900/40 transition-colors"
                              >
                                <span>Ver Passaporte Digital</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {matchedCustomer && onSelectCustomer && (
                              <button
                                onClick={() => {
                                  onSelectCustomer(matchedCustomer);
                                  onClose();
                                }}
                                className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold text-xs flex items-center gap-1 border border-amber-500/40 transition-colors"
                              >
                                <span>Ficha do Cliente</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          <div>
                            <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider block">Cliente Titular</span>
                            <p className="font-bold text-amber-100 text-sm flex items-center gap-2">
                              <User className="w-4 h-4 text-amber-400" />
                              <span>{child.currentOwnerName || 'Cliente Cadastrado'}</span>
                            </p>
                          </div>

                          <div>
                            <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider block">Documento CPF / E-mail</span>
                            <p className="font-mono font-semibold text-zinc-200 flex items-center gap-2">
                              <CreditCard className="w-4 h-4 text-amber-400" />
                              <span>{child.ownerCpf || 'CPF registrado'}</span>
                            </p>
                          </div>

                          <div>
                            <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider block">ID Passaporte & Emissão</span>
                            <p className="font-mono font-semibold text-amber-300 flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-amber-400" />
                              <span>{child.id} ({new Date(child.issueDate).toLocaleDateString('pt-BR')})</span>
                            </p>
                          </div>
                        </div>

                        {child.maintenanceHistory && child.maintenanceHistory.length > 0 && (
                          <p className="text-[11px] text-zinc-400 bg-zinc-950/80 p-2.5 rounded-xl border border-zinc-800">
                            <strong>Registro de Emissão:</strong> {child.maintenanceHistory[0].notes}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

            </div>

          </div>
        )}

      </div>
    </div>
  );
};

