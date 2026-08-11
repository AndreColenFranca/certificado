import React, { useState, useEffect } from 'react';
import { JewelryCertificate, Customer } from '../types';
import { 
  X, Search, Gem, Users, User, ShieldCheck, Calendar, ArrowRightLeft, 
  Mail, Phone, CreditCard, Sparkles, CheckCircle2, History, PlusCircle, ExternalLink 
} from 'lucide-react';
import { formatImageUrl } from '../utils/imageUtils';

interface JewelryCustomerQueryModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificates: JewelryCertificate[];
  customers: Customer[];
  initialCertId?: string | null;
  onOpenLinkModal?: (cert: JewelryCertificate) => void;
  onSelectCustomer?: (customer: Customer) => void;
}

export const JewelryCustomerQueryModal: React.FC<JewelryCustomerQueryModalProps> = ({
  isOpen,
  onClose,
  certificates,
  customers,
  initialCertId,
  onOpenLinkModal,
  onSelectCustomer
}) => {
  if (!isOpen) return null;

  const [selectedCertId, setSelectedCertId] = useState<string>(
    initialCertId || (certificates[0]?.id || '')
  );
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (initialCertId && certificates.some(c => c.id === initialCertId)) {
      setSelectedCertId(initialCertId);
    } else if (certificates.length > 0 && (!selectedCertId || !certificates.some(c => c.id === selectedCertId))) {
      setSelectedCertId(certificates[0].id);
    }
  }, [initialCertId, certificates, isOpen]);

  // Filter certificates for selector
  const filteredCertificates = certificates.filter(c => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase().trim();
    return (
      c.title.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q) ||
      c.serialNumber.toLowerCase().includes(q) ||
      c.collection.toLowerCase().includes(q) ||
      (c.currentOwnerName && c.currentOwnerName.toLowerCase().includes(q))
    );
  });

  const selectedCert = certificates.find(c => c.id === selectedCertId) || certificates[0] || null;

  // Helper to extract all customers who acquired this jewelry (current and historical)
  const getAcquiredClients = (): { customer: Customer; isCurrentOwner: boolean; acquisitionDate?: string; notes?: string }[] => {
    if (!selectedCert) return [];
    const map = new Map<string, { customer: Customer; isCurrentOwner: boolean; acquisitionDate?: string; notes?: string }>();

    // 1. Current owner
    if (selectedCert.currentOwnerName || selectedCert.ownerCpf || selectedCert.ownerEmail || selectedCert.ownerId) {
      const cleanCertCpf = selectedCert.ownerCpf ? selectedCert.ownerCpf.replace(/\D/g, '') : '';
      const matchedCust = customers.find(c => {
        if (selectedCert.ownerId && c.id === selectedCert.ownerId) return true;
        if (cleanCertCpf && c.cpf.replace(/\D/g, '') === cleanCertCpf) return true;
        if (selectedCert.ownerEmail && c.email.toLowerCase() === selectedCert.ownerEmail.toLowerCase()) return true;
        if (selectedCert.currentOwnerName && c.name.trim().toLowerCase() === selectedCert.currentOwnerName.trim().toLowerCase()) return true;
        return false;
      });

      const custObj: Customer = matchedCust || {
        id: selectedCert.ownerId || `cli-temp-current`,
        name: selectedCert.currentOwnerName || 'Cliente Cadastrado',
        cpf: selectedCert.ownerCpf || 'Não informado',
        email: selectedCert.ownerEmail || 'Não informado'
      };

      const key = custObj.id || custObj.name;
      map.set(key, {
        customer: custObj,
        isCurrentOwner: true,
        acquisitionDate: selectedCert.issueDate
      });
    }

    // 2. All customers linked via maintenanceHistory
    if (selectedCert.maintenanceHistory) {
      selectedCert.maintenanceHistory.forEach(rec => {
        const cleanRecCpf = rec.customerCpf ? rec.customerCpf.replace(/\D/g, '') : '';
        
        // Find matching customer object in customers list
        const matched = customers.find(c => {
          if (rec.customerId && c.id === rec.customerId) return true;
          if (cleanRecCpf && c.cpf.replace(/\D/g, '') === cleanRecCpf) return true;
          if (rec.customerEmail && c.email.toLowerCase() === rec.customerEmail.toLowerCase()) return true;
          if (rec.customerName && rec.customerName.trim().toLowerCase() === c.name.trim().toLowerCase()) return true;
          return false;
        });

        if (matched) {
          if (!map.has(matched.id)) {
            const isCurr = selectedCert.ownerId === matched.id ||
                           (cleanRecCpf && selectedCert.ownerCpf?.replace(/\D/g, '') === cleanRecCpf) ||
                           selectedCert.currentOwnerName?.trim().toLowerCase() === matched.name.trim().toLowerCase();
            map.set(matched.id, {
              customer: matched,
              isCurrentOwner: isCurr,
              acquisitionDate: rec.date,
              notes: rec.notes
            });
          }
        } else if (rec.customerName || (rec.notes && (rec.notes.toLowerCase().includes('cliente') || rec.notes.toLowerCase().includes('vínculo') || rec.notes.toLowerCase().includes('transferência')))) {
          // Extract name from quotes if present
          const extractedName = rec.customerName || rec.notes.match(/"([^"]+)"/)?.[1] || null;
          if (extractedName) {
            const key = `hist-${extractedName}`;
            if (!map.has(key)) {
              map.set(key, {
                customer: {
                  id: key,
                  name: extractedName,
                  cpf: rec.customerCpf || 'Registrado em histórico',
                  email: rec.customerEmail || 'Registrado em histórico'
                },
                isCurrentOwner: selectedCert.currentOwnerName?.trim().toLowerCase() === extractedName.trim().toLowerCase(),
                acquisitionDate: rec.date,
                notes: rec.notes
              });
            }
          }
        }
      });
    }

    return Array.from(map.values());
  };

  const acquiredClients = getAcquiredClients();

  // Extract all relevant ownership/link records from maintenance history
  const historyEvents = selectedCert?.maintenanceHistory.filter(
    m => m.type === 'Transferência de Posse' || m.type === 'Emissão de Certificado' || m.type === 'Certificação Inicial' || m.notes?.toLowerCase().includes('vínculo')
  ) || [];

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
                Consulta de Joia & Clientes Adquirentes
              </h2>
              <p className="text-xs text-zinc-400">
                Pesquise qualquer joia do acervo e visualize todos os clientes que a adquiriram.
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
                placeholder="Filtrar joias por título, ID, N° de Série ou Titular..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-amber-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                id="query-cert-search"
              />
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-amber-500/60" />
            </div>

            <div className="w-full sm:w-auto">
              <select
                value={selectedCertId}
                onChange={(e) => setSelectedCertId(e.target.value)}
                className="w-full sm:w-80 p-2.5 bg-zinc-950 border border-amber-900/60 rounded-xl text-amber-200 font-bold text-xs focus:outline-none focus:border-amber-500"
                id="query-cert-select"
              >
                {filteredCertificates.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.id}) — {c.currentOwnerName || 'Sem titular'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {selectedCert && (
          <div className="space-y-6">
            
            {/* JOIA SELECIONADA CARD */}
            <div className="bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-amber-950/30 p-5 rounded-2xl border border-amber-900/50 flex flex-col sm:flex-row items-start sm:items-center gap-5 shadow-lg">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl bg-black border border-zinc-800 p-1 shrink-0 overflow-hidden relative shadow-md">
                <img
                  src={formatImageUrl(selectedCert.images[0])}
                  alt={selectedCert.title}
                  className="w-full h-full object-cover rounded-lg"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute top-2 right-2 p-1 rounded-md bg-zinc-950/80 border border-amber-500/30 text-amber-300">
                  <Gem className="w-3.5 h-3.5" />
                </span>
              </div>

              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    ID: {selectedCert.id}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800">
                    Série: {selectedCert.serialNumber}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Garantia: {selectedCert.warrantyStatus}
                  </span>
                </div>

                <h3 className="text-xl font-bold font-serif text-amber-100 truncate">
                  {selectedCert.title}
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-zinc-300 pt-1">
                  <div>
                    <span className="text-zinc-500 block text-[10px]">Metal & Acabamento:</span>
                    <span className="font-semibold text-amber-200">
                      {selectedCert.metalPurity} ({selectedCert.grossWeightGrams}g{selectedCert.widthCm && selectedCert.widthCm > 0 ? `, ${selectedCert.widthCm}cm` : ''})
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">Coleção / Marca:</span>
                    <span className="font-semibold text-zinc-200">{selectedCert.collection}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">Valor Estimado:</span>
                    <span className="font-bold text-emerald-300">
                      {selectedCert.estimatedValueBRL 
                        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedCert.estimatedValueBRL)
                        : 'Sob Consulta'}
                    </span>
                  </div>
                </div>
              </div>

              {onOpenLinkModal && (
                <button
                  onClick={() => onOpenLinkModal(selectedCert)}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shrink-0 self-stretch sm:self-center justify-center shadow-lg transition-transform hover:scale-105"
                  id="btn-link-from-query"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>Vincular Novo Cliente</span>
                </button>
              )}
            </div>

            {/* LISTA DE TODAS AS UNIDADES / CERTIFICADOS EMITIDOS PARA ESTE MODELO DE JOIA */}
            {(() => {
              const sameModelCerts = selectedCert ? certificates.filter(c => c.title.trim().toLowerCase() === selectedCert.title.trim().toLowerCase()) : [];
              if (sameModelCerts.length <= 1) return null;
              return (
                <div className="bg-zinc-900/80 p-4 rounded-2xl border border-amber-900/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Unidades & Passaportes Individuais deste Modelo ({sameModelCerts.length})</span>
                    </h4>
                    <span className="text-[11px] text-zinc-400 font-medium">
                      Cada comprador possui seu N° de Série e Passaporte exclusivo
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {sameModelCerts.map(unit => {
                      const isSelected = unit.id === selectedCert.id;
                      return (
                        <div
                          key={unit.id}
                          onClick={() => setSelectedCertId(unit.id)}
                          className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between gap-2 ${
                            isSelected 
                              ? 'bg-amber-500/15 border-amber-500 text-amber-100 font-semibold shadow-md' 
                              : 'bg-zinc-950 border-zinc-800 hover:border-amber-900/60 text-zinc-300'
                          }`}
                        >
                          <div className="space-y-0.5 truncate">
                            <span className="font-mono text-[10px] text-amber-400 block font-bold">
                              N° SÉRIE: {unit.serialNumber}
                            </span>
                            <span className="truncate block font-serif font-bold text-amber-100">
                              Titular: {unit.currentOwnerName || 'Em Estoque'}
                            </span>
                          </div>
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-bold shrink-0 ${
                            isSelected ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400'
                          }`}>
                            {isSelected ? 'Selecionado' : 'Ver Passaporte'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* LISTA DE CLIENTES ADQUIRENTES DA JOIA */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-amber-900/30 pb-2">
                <h4 className="font-serif text-lg font-bold text-amber-200 flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-400" />
                  <span>Clientes que Adquiriram esta Joia ({acquiredClients.length})</span>
                </h4>
                <span className="text-xs font-semibold text-zinc-400">
                  {acquiredClients.filter(c => c.isCurrentOwner).length > 0 ? '1 Titular Ativo' : 'Nenhum titular ativo'}
                </span>
              </div>

              {acquiredClients.length === 0 ? (
                <div className="bg-zinc-900/60 border border-dashed border-amber-900/50 p-6 rounded-2xl text-center space-y-3">
                  <User className="w-10 h-10 text-zinc-600 mx-auto" />
                  <p className="text-sm text-zinc-300 font-medium">Esta joia ainda não possui nenhum cliente adquirente registrado.</p>
                  <p className="text-xs text-zinc-500">Você pode vincular o certificado ao cadastro de um cliente agora mesmo.</p>
                  {onOpenLinkModal && (
                    <button
                      onClick={() => onOpenLinkModal(selectedCert)}
                      className="px-4 py-2 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs inline-flex items-center gap-1.5 shadow-md"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Vincular Cliente a esta Joia</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {acquiredClients.map(({ customer, isCurrentOwner, acquisitionDate, notes }, idx) => (
                    <div 
                      key={customer.id || idx}
                      className={`p-5 rounded-2xl space-y-3 shadow-xl transition-all border ${
                        isCurrentOwner 
                          ? 'bg-zinc-900/90 border-2 border-amber-500/80' 
                          : 'bg-zinc-900/70 border border-zinc-800 hover:border-amber-900/60'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-900/30 pb-2.5">
                        <div className="flex items-center gap-2">
                          {isCurrentOwner ? (
                            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/40 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                              <span>Titular Atual (Adquirente Vigente)</span>
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 font-semibold text-xs border border-zinc-700 flex items-center gap-1.5">
                              <History className="w-3.5 h-3.5 text-zinc-400" />
                              <span>Adquirente Histórico / Posse Anterior</span>
                            </span>
                          )}

                          {acquisitionDate && (
                            <span className="text-xs font-mono text-zinc-400">
                              Data: {new Date(acquisitionDate).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </div>

                        {onSelectCustomer && customer.id && !customer.id.startsWith('cli-temp') && !customer.id.startsWith('hist-') && (
                          <button
                            onClick={() => {
                              onSelectCustomer(customer);
                              onClose();
                            }}
                            className="text-xs text-amber-300 hover:text-amber-100 underline underline-offset-2 font-semibold flex items-center gap-1"
                          >
                            <span>Ver Ficha do Cliente</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                          <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider block">Nome do Cliente</span>
                          <p className="font-bold text-amber-100 text-sm flex items-center gap-2">
                            <User className="w-4 h-4 text-amber-400" />
                            <span>{customer.name}</span>
                          </p>
                        </div>

                        <div>
                          <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider block">Documento CPF</span>
                          <p className="font-mono font-semibold text-zinc-200 flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-amber-400" />
                            <span>{customer.cpf || 'Não informado'}</span>
                          </p>
                        </div>

                        <div>
                          <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider block">E-mail de Contato</span>
                          <p className="font-semibold text-amber-300 flex items-center gap-2 truncate">
                            <Mail className="w-4 h-4 text-amber-400" />
                            <span className="truncate">{customer.email || 'Não informado'}</span>
                          </p>
                        </div>
                      </div>

                      {notes && (
                        <p className="text-[11px] text-zinc-400 bg-zinc-950/80 p-2.5 rounded-xl border border-zinc-800">
                          <strong>Observações do registro:</strong> {notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* HISTÓRICO DE AQUISIÇÕES / TRANSFERÊNCIAS / REGISTROS */}
              {historyEvents.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-amber-900/30">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                    <History className="w-4 h-4 text-amber-400" />
                    <span>Histórico Registrado de Vínculos e Posse ({historyEvents.length})</span>
                  </h5>

                  <div className="space-y-2">
                    {historyEvents.map((rec) => (
                      <div 
                        key={rec.id} 
                        className="bg-zinc-900/80 p-4 rounded-xl border border-zinc-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-bold">
                              {rec.type}
                            </span>
                            <span className="text-zinc-400 text-[11px] font-mono">
                              {new Date(rec.date).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          <p className="text-zinc-200 font-medium">{rec.notes}</p>
                        </div>

                        <div className="text-right sm:text-right text-[11px] text-zinc-400 shrink-0">
                          <span>Registrado por: </span>
                          <strong className="text-amber-200">{rec.performer}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

          </div>
        )}

      </div>
    </div>
  );
};
