import React, { useState, useEffect } from 'react';
import { JewelryCertificate, Customer } from '../types';
import { 
  X, ArrowRightLeft, ShieldCheck, CheckCircle2, User, Users, Gem, 
  Sparkles, Calendar, FileText, ExternalLink, AlertCircle, Award 
} from 'lucide-react';
import { formatImageUrl } from '../utils/imageUtils';
import { isRootCert } from '../utils/certHierarchy';

interface JewelryCustomerLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  certificates: JewelryCertificate[];
  preSelectedCustomer?: Customer | null;
  preSelectedCert?: JewelryCertificate | null;
  onConfirmLink: (
    certId: string, 
    customer: Customer, 
    notes?: string, 
    customIssueDate?: string
  ) => void;
}

export const JewelryCustomerLinkModal: React.FC<JewelryCustomerLinkModalProps> = ({
  isOpen,
  onClose,
  customers,
  certificates,
  preSelectedCustomer,
  preSelectedCert,
  onConfirmLink
}) => {
  if (!isOpen) return null;

  // Filter root certs for priority display in dropdown
  const rootCertificates = certificates.filter(isRootCert);

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(preSelectedCustomer?.id || (customers[0]?.id || ''));
  const [selectedCertId, setSelectedCertId] = useState<string>(
    preSelectedCert?.id || (rootCertificates[0]?.id || (certificates[0]?.id || ''))
  );
  const [notes, setNotes] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitted, setSubmitted] = useState(false);

  // Sync props when modal opens or selections change
  useEffect(() => {
    if (preSelectedCustomer) {
      setSelectedCustomerId(preSelectedCustomer.id);
    } else if (customers.length > 0 && !selectedCustomerId) {
      setSelectedCustomerId(customers[0].id);
    }

    if (preSelectedCert) {
      setSelectedCertId(preSelectedCert.id);
    } else if (rootCertificates.length > 0 && (!selectedCertId || !certificates.some(c => c.id === selectedCertId))) {
      setSelectedCertId(rootCertificates[0].id);
    }
  }, [preSelectedCustomer, preSelectedCert, isOpen]);

  // Derived objects from selection
  const currentCustomer = customers.find(c => c.id === selectedCustomerId) || null;
  const currentCert = certificates.find(c => c.id === selectedCertId) || null;
  const isSelectedRoot = currentCert ? isRootCert(currentCert) : false;

  const handleCertSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const certId = e.target.value;
    setSelectedCertId(certId);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCustomer || !currentCert) return;

    onConfirmLink(
      currentCert.id,
      currentCustomer,
      notes.trim() || undefined,
      issueDate
    );

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-zinc-950 border border-amber-900/60 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 text-amber-50 max-h-[90vh] overflow-y-auto custom-scrollbar">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-900/40 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <ArrowRightLeft className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-bold text-amber-100">
                Emitir Joia Filha & Vincular ao Cliente
              </h2>
              <p className="text-xs text-zinc-400">
                Selecione a Joia Pai/Raiz do acervo e o cliente. O sistema criará uma Joia Filha com Passaporte Digital exclusivo.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-amber-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-12 text-center space-y-4">
            <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto animate-bounce" />
            <h3 className="text-2xl font-bold text-amber-200 font-serif">Joia Filha Emitida com Sucesso!</h3>
            <p className="text-sm text-zinc-300 max-w-md mx-auto">
              A nova Joia Filha baseada em <strong className="text-amber-300">{currentCert?.title}</strong> foi gerada e vinculada com sucesso a <strong className="text-amber-300">{currentCustomer?.name}</strong>. A Joia Pai permaneceu intacta no catálogo.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* ETAPA 1: SELEÇÃO DO CLIENTE */}
            <div className="space-y-2 bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800">
              <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <span>1. Selecionar Cliente Beneficiário</span>
              </label>

              {customers.length === 0 ? (
                <p className="text-xs text-rose-400">Nenhum cliente cadastrado no sistema. Cadastre um cliente primeiro.</p>
              ) : (
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-amber-100 text-sm focus:outline-none focus:border-amber-500 font-semibold"
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} — CPF: {c.cpf} ({c.email})
                    </option>
                  ))}
                </select>
              )}

              {currentCustomer && (
                <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800/80 text-xs text-zinc-300 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-amber-200">{currentCustomer.name}</span>
                    <span className="font-mono text-zinc-400 ml-2">({currentCustomer.cpf})</span>
                  </div>
                  <span className="text-amber-400 font-medium">{currentCustomer.email}</span>
                </div>
              )}
            </div>

            {/* ETAPA 2: SELEÇÃO DA JOIA PAI / RAIZ */}
            <div className="space-y-2 bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800">
              <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <Gem className="w-4 h-4 text-amber-400" />
                <span>2. Selecionar Joia Pai / Raiz do Catálogo</span>
              </label>

              {certificates.length === 0 ? (
                <p className="text-xs text-rose-400">Nenhuma joia cadastrada no acervo. Cadastre joias no Cadastro de Joias primeiro.</p>
              ) : (
                <select
                  value={selectedCertId}
                  onChange={handleCertSelectChange}
                  className="w-full p-3 bg-zinc-950 border border-amber-900/60 rounded-xl text-amber-100 text-sm focus:outline-none focus:border-amber-500 font-bold"
                >
                  <option value="">-- Selecione a Joia Pai (Matriz) --</option>
                  {rootCertificates.map(cert => (
                    <option key={cert.id} value={cert.id}>
                      [Joia Pai] {cert.title} ({cert.id}) — Série: {cert.serialNumber}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* ETAPA 3: PREENCHIMENTO AUTOMÁTICO DAS INFORMAÇÕES DA JOIA E AJUSTES */}
            {currentCert ? (
              <div className="space-y-4 bg-zinc-900/90 p-5 rounded-2xl border border-amber-900/50 shadow-inner">
                <div className="flex items-center justify-between border-b border-amber-900/30 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>3. Especificações Herdados da Joia Pai</span>
                  </span>
                  <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                    * Joia Pai intacta no catálogo
                  </span>
                </div>

                {/* Resumo Visual da Joia Selecionada */}
                <div className="flex items-start gap-4 bg-zinc-950 p-3.5 rounded-xl border border-zinc-800">
                  <div className="w-20 h-20 rounded-xl bg-zinc-900 overflow-hidden border border-zinc-800 shrink-0 relative">
                    <img 
                      src={formatImageUrl(currentCert.images[0])} 
                      alt={currentCert.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    {isSelectedRoot && (
                      <span className="absolute bottom-1 right-1 bg-amber-500 text-zinc-950 p-0.5 rounded text-[9px] font-bold">
                        Pai
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-amber-400 text-[11px] font-bold">
                        ID RAIZ: {currentCert.id}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px] border border-amber-500/30">
                        Matriz Base
                      </span>
                    </div>
                    <h4 className="font-serif font-bold text-amber-100 text-base truncate">
                      {currentCert.title}
                    </h4>
                    <p className="text-zinc-400">
                      <strong>Coleção:</strong> {currentCert.collection || 'Alta Joalheria'} | <strong>Metal:</strong> {currentCert.metalPurity} ({currentCert.metalColor})
                    </p>
                    <p className="text-zinc-400">
                      <strong>Gemas:</strong> {currentCert.stones?.map(s => `${s.type} (${s.caratWeight}ct)`).join(', ') || 'Sem gemas registradas'}
                    </p>
                  </div>
                </div>

                {/* Informative Badge about Child Certificate Generation */}
                {currentCustomer && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/40 rounded-xl flex items-start gap-2.5 text-xs text-amber-200">
                    <Award className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold text-amber-300 text-sm">Geração de Joia Filha Individual</strong>
                      Ao confirmar, o sistema gerará uma <strong>Joia Filha</strong> com N° de Série e Passaporte Digital exclusivos para o cliente <span className="font-bold text-amber-100 underline">{currentCustomer.name}</span>. A Joia Pai (<span className="font-mono text-amber-300">{currentCert.title}</span>) permanecerá no acervo como modelo principal, sem ser alterada ou vinculada diretamente.
                    </div>
                  </div>
                )}

                {/* Ajustes / Personalização do Vínculo */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-amber-200 mb-1 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      <span>Data de Emissão / Entrega ao Cliente</span>
                    </label>
                    <input
                      type="date"
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                      className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-amber-100 text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-amber-200 mb-1 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-amber-400" />
                      <span>Observações da Emissão para o Cliente</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Emissão especial / Presente de Aniversário de Casamento"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-amber-100 text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

              </div>
            ) : (
              <div className="p-4 bg-amber-950/20 border border-amber-900/30 rounded-2xl text-xs text-amber-300/80 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Selecione uma joia pai no menu acima para visualizar os dados herdados.</span>
              </div>
            )}

            {/* Submissão */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-amber-900/40">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-amber-200 hover:bg-zinc-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!currentCustomer || !currentCert}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-zinc-950 font-bold text-xs shadow-lg shadow-amber-950/60 transition-all flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Emitir Joia Filha & Passaporte</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};

