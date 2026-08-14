import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Customer, JewelryCertificate } from '../types';
import { 
  Users, UserPlus, Search, Edit3, Trash2, ShieldCheck, Mail, CreditCard, 
  Gem, PlusCircle, ExternalLink, ArrowRightLeft, Sparkles, Phone, FileText, CheckCircle2, ChevronRight,
  QrCode, Copy, Check, X, Unlink, Printer
} from 'lucide-react';
import { formatImageUrl } from '../utils/imageUtils';

interface CustomerManagementViewProps {
  customers: Customer[];
  certificates: JewelryCertificate[];
  initialCustomerId?: string;
  onOpenCreateCustomer: () => void;
  onEditCustomer: (customer: Customer) => void;
  onDeleteCustomer: (customer: Customer) => void;
  onSelectCertificate: (cert: JewelryCertificate, tab?: 'photo-inspector' | 'specs' | 'history' | 'care') => void;
  onEditCertificate: (cert: JewelryCertificate) => void;
  onTransferCertificate: (cert: JewelryCertificate) => void;
  onUnlinkCertificate: (cert: JewelryCertificate, customerId?: string) => void;
  onCreateCertForCustomer: (customer: Customer) => void;
  onOpenLinkCustomerModal?: (customer?: Customer) => void;
  onOpenPrintModal?: (cert: JewelryCertificate) => void;
}

export const CustomerManagementView: React.FC<CustomerManagementViewProps> = ({
  customers,
  certificates,
  initialCustomerId,
  onOpenCreateCustomer,
  onEditCustomer,
  onDeleteCustomer,
  onSelectCertificate,
  onEditCertificate,
  onTransferCertificate,
  onUnlinkCertificate,
  onCreateCertForCustomer,
  onOpenLinkCustomerModal,
  onOpenPrintModal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(initialCustomerId || '');
  const [qrCertModal, setQrCertModal] = useState<JewelryCertificate | null>(null);
  const [unlinkCertModal, setUnlinkCertModal] = useState<JewelryCertificate | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (qrCertModal) {
      const certUrl = `${window.location.origin}/cert/${encodeURIComponent(qrCertModal.id)}?type=certificate`;
      QRCode.toDataURL(certUrl, {
        width: 360,
        margin: 4,
        color: { dark: '#18181b', light: '#ffffff' }
      }).then(rawDataUrl => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // Draw base QR code image
            ctx.drawImage(img, 0, 0);

            // Draw clean black border around the QR code as part of the image
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 4;
            ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);

            setQrDataUrl(canvas.toDataURL('image/png'));
          } else {
            setQrDataUrl(rawDataUrl);
          }
        };
        img.onerror = () => setQrDataUrl(rawDataUrl);
        img.src = rawDataUrl;
      }).catch(err => console.error(err));
    } else {
      setQrDataUrl('');
      setCopiedLink(false);
    }
  }, [qrCertModal]);

  const handleCopyCertLink = () => {
    if (!qrCertModal) return;
    const certUrl = `${window.location.origin}/cert/${encodeURIComponent(qrCertModal.id)}?type=certificate`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(certUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Filter customers by name, CPF, or email
  const filteredCustomers = customers.filter(c => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase().trim();
    const cleanQ = q.replace(/\D/g, ''); // for numeric CPF match
    const cleanCpf = c.cpf.replace(/\D/g, '');

    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.cpf.toLowerCase().includes(q) ||
      (cleanQ.length > 2 && cleanCpf.includes(cleanQ))
    );
  });

  // Sync selected customer when initialCustomerId changes from parent
  useEffect(() => {
    if (initialCustomerId) {
      setSelectedCustomerId(initialCustomerId);
    }
  }, [initialCustomerId]);

  // Ensure a customer is selected when list changes or initially
  useEffect(() => {
    if (initialCustomerId && filteredCustomers.some(c => c.id === initialCustomerId)) {
      setSelectedCustomerId(initialCustomerId);
    } else if (filteredCustomers.length > 0) {
      if (!selectedCustomerId || !filteredCustomers.some(c => c.id === selectedCustomerId)) {
        setSelectedCustomerId(filteredCustomers[0].id);
      }
    } else {
      setSelectedCustomerId('');
    }
  }, [searchTerm, customers, initialCustomerId]);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId) || filteredCustomers[0] || null;

  // Helper to find all pieces belonging to a customer (where customer is current owner)
  const getCustomerPieces = (customer: Customer | null): JewelryCertificate[] => {
    if (!customer) return [];
    const cleanCustCpf = customer.cpf ? customer.cpf.replace(/\D/g, '') : '';
    const custNameLower = customer.name.trim().toLowerCase();
    const custEmailLower = customer.email ? customer.email.trim().toLowerCase() : '';

    return certificates.filter(cert => {
      // 1. Direct current owner match
      if (cert.ownerId && cert.ownerId === customer.id) return true;
      if (cleanCustCpf && cert.ownerCpf && cert.ownerCpf.replace(/\D/g, '') === cleanCustCpf) return true;
      if (custEmailLower && cert.ownerEmail && cert.ownerEmail.trim().toLowerCase() === custEmailLower) return true;
      if (cert.currentOwnerName && cert.currentOwnerName.trim().toLowerCase() === custNameLower) return true;

      return false;
    });
  };

  const selectedCustomerPieces = getCustomerPieces(selectedCustomer);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in text-amber-50">
      
      {/* Top Header Banner */}
      <div 
        id="customer-header-banner"
        className="bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-amber-950/50 p-6 sm:p-8 rounded-3xl border border-amber-900/40 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div className="space-y-2.5 max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase tracking-wider" id="customer-header-badge">
            <Users className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Gestão da Carteira de Clientes</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-serif text-amber-100 tracking-tight" id="customer-header-title">
            Cadastro e Histórico de Clientes
          </h1>
          <p className="text-sm text-zinc-300 font-medium leading-relaxed" id="customer-header-description">
            Selecione um cliente na lista lateral para visualizar sua ficha cadastral legível e o acervo de joias vinculadas.
          </p>
        </div>

        <button
          onClick={onOpenCreateCustomer}
          className="px-5 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold text-sm shadow-xl shadow-amber-950/60 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2.5 shrink-0 self-start md:self-center border border-amber-400 cursor-pointer relative z-10"
          id="btn-add-new-customer"
        >
          <UserPlus className="w-5 h-5 text-zinc-950" />
          <span>Cadastrar Novo Cliente</span>
        </button>
      </div>

      {/* Main Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* COLUNA ESQUERDA: Lista de Clientes & Busca (4 colunas no lg) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Caixa de Pesquisa */}
          <div className="bg-zinc-900/90 p-4 rounded-2xl border border-amber-900/40 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5" />
                <span>Buscar Cliente</span>
              </label>
              <span className="text-xs font-semibold text-zinc-400">
                {filteredCustomers.length} cadastrados
              </span>
            </div>

            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Pesquisar por Nome, CPF ou E-mail..."
                className="w-full pl-10 pr-8 py-3 bg-zinc-950 border border-amber-900/50 rounded-xl text-amber-100 text-sm placeholder-zinc-500 focus:outline-none focus:border-amber-500/80 transition-all"
                id="input-customer-search"
              />
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-amber-500/60" />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-3 text-[11px] font-semibold text-zinc-400 hover:text-amber-200"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>

          {/* Lista Selecionável de Clientes */}
          <div className="bg-zinc-900/90 p-3 rounded-2xl border border-amber-900/30 shadow-lg space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar">
            {filteredCustomers.length === 0 ? (
              <div className="p-6 text-center space-y-3">
                <Users className="w-8 h-8 text-zinc-600 mx-auto" />
                <p className="text-xs text-zinc-400">Nenhum cliente localizado para "{searchTerm}"</p>
                <button
                  onClick={onOpenCreateCustomer}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 text-zinc-950 font-bold text-xs"
                >
                  + Cadastrar Cliente
                </button>
              </div>
            ) : (
              filteredCustomers.map(cust => {
                const piecesCount = getCustomerPieces(cust).length;
                const isSelected = selectedCustomer?.id === cust.id;

                return (
                  <div
                    key={cust.id}
                    className={`w-full p-3.5 rounded-xl transition-all border flex items-center justify-between gap-3 group ${
                      isSelected
                        ? 'bg-amber-950/60 border-amber-500 shadow-md shadow-amber-950/40 text-amber-50'
                        : 'bg-zinc-950/60 border-zinc-800/80 hover:border-amber-900/60 hover:bg-zinc-900 text-zinc-300'
                    }`}
                  >
                    <button
                      onClick={() => setSelectedCustomerId(cust.id)}
                      className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer"
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold font-serif text-sm border ${
                        isSelected 
                          ? 'bg-amber-500 text-zinc-950 border-amber-400' 
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30 group-hover:bg-amber-500/20'
                      }`}>
                        {cust.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold font-serif text-amber-100 truncate group-hover:text-amber-200">
                          {cust.name}
                        </h3>
                        <p className="text-xs font-mono text-zinc-400 truncate">
                          CPF: {cust.cpf}
                        </p>
                      </div>
                    </button>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                        piecesCount > 0 
                          ? 'bg-amber-500/15 border-amber-500/30 text-amber-300' 
                          : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                      }`}>
                        {piecesCount} {piecesCount === 1 ? 'joia' : 'joias'}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteCustomer(cust);
                        }}
                        className="p-2 rounded-lg bg-red-500/15 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/40 transition-colors cursor-pointer"
                        title={`Excluir cliente ${cust.name}`}
                        id={`btn-delete-cust-list-${cust.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* COLUNA DIREITA: Ficha Cadastral do Cliente & Suas Joias (8 colunas no lg) */}
        <div className="lg:col-span-8 space-y-6">
          
          {!selectedCustomer ? (
            <div className="bg-zinc-900/50 p-12 rounded-3xl border border-dashed border-amber-900/30 text-center space-y-4">
              <Users className="w-12 h-12 text-zinc-600 mx-auto" />
              <h3 className="text-lg font-bold text-amber-200">Nenhum cliente selecionado</h3>
              <p className="text-xs text-zinc-400">Selecione um cliente na lista à esquerda para carregar sua ficha cadastral.</p>
            </div>
          ) : (
            <>
              {/* FICHA CADASTRAL DO CLIENTE (MUITO MAIS LEGÍVEL) */}
              <div className="bg-zinc-900/90 border border-amber-900/50 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
                
                {/* Header da Ficha */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-amber-900/30">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-300 font-bold font-serif text-2xl shadow-inner shrink-0">
                      {selectedCustomer.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-xs font-semibold">
                          ID: {selectedCustomer.id}
                        </span>
                        <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Cadastro Ativo no Acervo
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <h2 className="text-2xl font-bold font-serif text-amber-100 truncate">
                          {selectedCustomer.name}
                        </h2>
                      </div>
                    </div>
                  </div>

                  {/* Ações do Cliente */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => onCreateCertForCustomer(selectedCustomer)}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Emitir Nova Peça</span>
                    </button>

                    {onOpenLinkCustomerModal && (
                      <button
                        onClick={() => onOpenLinkCustomerModal(selectedCustomer)}
                        className="px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                        title="Vincular uma joia do acervo a este cliente"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400" />
                        <span>Vincular Joia Existente</span>
                      </button>
                    )}

                    <button
                      onClick={() => onEditCustomer(selectedCustomer)}
                      className="px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-zinc-700 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>

                    <button
                      onClick={() => onDeleteCustomer(selectedCustomer)}
                      className="px-3.5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs border border-red-400 transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                      title="Excluir cadastro do cliente"
                      id={`btn-delete-cust-action-${selectedCustomer.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-white shrink-0" />
                      <span>Excluir Cliente</span>
                    </button>
                  </div>
                </div>

                {/* Grade dos Dados Cadastrais em destaque legível */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  
                  {/* CPF */}
                  <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 space-y-1">
                    <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                      CPF
                    </span>
                    <p className="font-mono text-base font-bold text-amber-100">
                      {selectedCustomer.cpf}
                    </p>
                  </div>

                  {/* E-mail */}
                  <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 space-y-1">
                    <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-amber-400" />
                      E-mail de Contato
                    </span>
                    <p className="text-sm font-semibold text-amber-100 truncate">
                      {selectedCustomer.email}
                    </p>
                  </div>

                  {/* Telefone */}
                  <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 space-y-1">
                    <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-amber-400" />
                      Telefone / WhatsApp
                    </span>
                    <p className="text-sm font-semibold text-amber-100">
                      {selectedCustomer.phone || 'Não informado'}
                    </p>
                  </div>

                  {/* Observações / Perfil */}
                  <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 space-y-1 sm:col-span-2 lg:col-span-3">
                    <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-amber-400" />
                      Notas do Cliente / Perfil
                    </span>
                    <p className="text-sm text-zinc-300 leading-relaxed">
                      {selectedCustomer.notes || 'Sem observações adicionais cadastradas.'}
                    </p>
                  </div>

                </div>

              </div>

              {/* SEÇÃO DE PEÇAS / CARTEIRA DE JOIAS DO CLIENTE SELECIONADO */}
              <div className="bg-zinc-900/90 border border-amber-900/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-amber-900/30">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold font-serif text-amber-100 flex items-center gap-2">
                      <Gem className="w-5 h-5 text-amber-400" />
                      <span>Carteira de Joias de {selectedCustomer.name}</span>
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Exibindo as peças registradas sob a posse deste titular ({selectedCustomerPieces.length} joias no total).
                    </p>
                  </div>

                  <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold text-xs shrink-0 self-start sm:self-center">
                    {selectedCustomerPieces.length} {selectedCustomerPieces.length === 1 ? 'Peça Registrada' : 'Peças Registradas'}
                  </span>
                </div>

                {selectedCustomerPieces.length === 0 ? (
                  <div className="bg-zinc-950/60 p-8 rounded-2xl border border-dashed border-zinc-800 text-center space-y-4">
                    <Gem className="w-10 h-10 text-zinc-600 mx-auto" />
                    <div className="space-y-1">
                      <h4 className="text-base font-bold text-amber-200">Nenhuma joia vinculada a este cliente</h4>
                      <p className="text-xs text-zinc-400 max-w-md mx-auto">
                        Você pode emitir um novo certificado digital diretamente para {selectedCustomer.name} agora mesmo.
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-2.5 flex-wrap pt-1">
                      <button
                        onClick={() => onCreateCertForCustomer(selectedCustomer)}
                        className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow transition-all inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <PlusCircle className="w-4 h-4" />
                        <span>Cadastrar Primeira Peça para {selectedCustomer.name}</span>
                      </button>

                      {onOpenLinkCustomerModal && (
                        <button
                          onClick={() => onOpenLinkCustomerModal(selectedCustomer)}
                          className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-amber-500/30 font-bold text-xs shadow transition-all inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <ArrowRightLeft className="w-4 h-4 text-amber-400" />
                          <span>Vincular Joia Existente do Acervo</span>
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {selectedCustomerPieces.map((cert) => {
                      const primaryStone = cert.stones && cert.stones.length > 0 ? cert.stones[0] : null;

                      return (
                        <div 
                          key={cert.id}
                          className="bg-zinc-950 border border-amber-900/50 rounded-2xl p-5 space-y-4 hover:border-amber-500/60 transition-all flex flex-col justify-between group shadow-lg"
                        >
                          <div className="space-y-3">
                            
                            {/* Thumbnail & Identificação */}
                            <div className="flex items-start gap-3.5">
                              <div className="w-20 h-20 rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden shrink-0 relative group-hover:scale-105 transition-transform shadow-inner">
                                <img 
                                  src={formatImageUrl(cert.images[0])} 
                                  alt={cert.title}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="text-xs font-mono text-amber-400 font-semibold block truncate">
                                  {cert.serialNumber}
                                </span>
                                <h4 className="text-base font-bold text-amber-100 font-serif truncate group-hover:text-amber-300 transition-colors mt-0.5">
                                  {cert.title}
                                </h4>
                                <p className="text-xs text-zinc-400 truncate mt-0.5">
                                  {cert.collection || 'Alta Joalheria'}
                                </p>
                              </div>
                            </div>

                            {/* Detalhes Técnicos em letras legíveis */}
                            <div className="grid grid-cols-2 gap-2 text-xs bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
                              <div>
                                <span className="text-zinc-500 block text-[11px] font-medium">Metal:</span>
                                <span className="font-semibold text-amber-200">{cert.metalPurity} ({cert.metalColor})</span>
                              </div>
                              <div>
                                <span className="text-zinc-500 block text-[11px] font-medium">Gema Principal:</span>
                                <span className="font-semibold text-amber-200 truncate block">
                                  {primaryStone ? `${primaryStone.type}${primaryStone.caratWeight > 0 ? ` (${primaryStone.caratWeight}ct)` : ''}` : 'Sem pedras'}
                                </span>
                              </div>
                              <div>
                                <span className="text-zinc-500 block text-[11px] font-medium">Garantia:</span>
                                <span className="font-bold text-emerald-400">{cert.warrantyStatus}</span>
                              </div>
                              <div>
                                <span className="text-zinc-500 block text-[11px] font-medium">Valor Estimado:</span>
                                <span className="font-mono font-bold text-amber-300">
                                  {cert.estimatedValueBRL ? `R$ ${cert.estimatedValueBRL.toLocaleString('pt-BR')}` : 'Sob Consulta'}
                                </span>
                              </div>
                            </div>

                          </div>

                          {/* Botões de Ação */}
                          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-zinc-800 w-full">
                            <button
                              onClick={() => onSelectCertificate(cert, 'photo-inspector')}
                              className="py-2.5 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span className="truncate">Passaporte</span>
                            </button>
                            {onOpenPrintModal && (
                              <button
                                onClick={() => onOpenPrintModal(cert)}
                                className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-zinc-950 border border-amber-400 text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                                title="Imprimir Certificado"
                                id={`btn-print-mgmt-${cert.id}`}
                              >
                                <Printer className="w-3.5 h-3.5 text-zinc-950 shrink-0" />
                                <span className="truncate">Imprimir Certificado</span>
                              </button>
                            )}
                            <button
                              onClick={() => onEditCertificate(cert)}
                              className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                              title="Editar especificações desta peça"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                              <span className="truncate">Editar</span>
                            </button>
                            <button
                              onClick={() => onTransferCertificate(cert)}
                              className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-zinc-700 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                              title="Transferir posse desta peça para outro cliente"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span className="truncate">Transferir</span>
                            </button>
                            <button
                              onClick={() => setQrCertModal(cert)}
                              className="col-span-2 py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-amber-900/60 text-amber-300 hover:text-amber-200 border border-zinc-700 hover:border-amber-500/50 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                              title="Gerar QRCode do Certificado do Cliente"
                              id={`btn-qrcode-cert-${cert.id}`}
                            >
                              <QrCode className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span className="truncate">QRCode do Certificado</span>
                            </button>
                            <button
                              onClick={() => setUnlinkCertModal(cert)}
                              className="col-span-2 py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-red-950/80 text-red-400 hover:text-red-300 border border-zinc-700 hover:border-red-500/50 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                              title="Desvincular esta joia da carteira do cliente atual"
                            >
                              <Unlink className="w-3.5 h-3.5 text-red-400 shrink-0" />
                              <span className="truncate">Desvincular Joia</span>
                            </button>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}

              </div>
            </>
          )}

        </div>

      </div>

      {/* Modal de Confirmação de Desvinculação de Joia */}
      {unlinkCertModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-zinc-950 border border-red-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 relative">
            <button 
              onClick={() => setUnlinkCertModal(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-2 rounded-full bg-zinc-900 border border-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-red-500/20 pb-4">
              <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/30 text-red-400">
                <Unlink className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-amber-100 font-serif">Desvincular Joia</h3>
                <p className="text-xs text-zinc-400">Remover peça da carteira do cliente</p>
              </div>
            </div>

            <div className="bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800 space-y-3">
              <div className="flex items-center gap-3.5">
                <img 
                  src={formatImageUrl(unlinkCertModal.images[0])} 
                  alt={unlinkCertModal.title} 
                  className="w-14 h-14 rounded-xl object-cover border border-zinc-800 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-mono text-amber-400 block font-semibold">{unlinkCertModal.serialNumber}</span>
                  <h4 className="text-sm font-bold text-amber-100 font-serif truncate">{unlinkCertModal.title}</h4>
                  <p className="text-xs text-zinc-400 truncate mt-0.5">
                    Titular atual: <strong className="text-amber-200">{selectedCustomer.name}</strong>
                  </p>
                </div>
              </div>

              <div className="text-xs text-zinc-300 leading-relaxed pt-3 border-t border-zinc-800/80 space-y-1">
                <p>
                  Deseja realmente desvincular a joia <strong className="text-amber-200">{unlinkCertModal.title}</strong>?
                </p>
                <p className="text-zinc-400 text-[11px]">
                  A peça deixará de estar associada ao cliente <strong>{selectedCustomer.name}</strong> e retornará para o acervo geral/estoque da joalheria.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setUnlinkCertModal(null)}
                className="flex-1 py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold border border-zinc-800 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (selectedCustomer) {
                    setSelectedCustomerId(selectedCustomer.id);
                  }
                  onUnlinkCertificate(unlinkCertModal, selectedCustomer?.id);
                  setUnlinkCertModal(null);
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer border border-red-500"
              >
                <Unlink className="w-4 h-4" />
                <span>Desvincular Agora</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de QRCode do Certificado da Joia */}
      {qrCertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-zinc-950 border border-amber-500/50 rounded-3xl p-6 shadow-2xl space-y-5">
            <button
              onClick={() => setQrCertModal(null)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full bg-zinc-900/80 border border-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-amber-500/20 pb-4">
              <div className="p-2.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-amber-100 font-serif">
                  QRCode do Certificado
                </h3>
                <p className="text-xs text-zinc-400">
                  {qrCertModal.title} ({qrCertModal.serialNumber})
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center space-y-3 bg-zinc-900/90 p-5 rounded-2xl border border-zinc-800">
              {qrDataUrl ? (
                <div className="p-3 bg-white rounded-2xl shadow-xl border border-zinc-300">
                  <img
                    src={qrDataUrl}
                    alt={`QRCode de ${qrCertModal.title}`}
                    className="w-56 h-56 object-contain"
                  />
                </div>
              ) : (
                <div className="w-56 h-56 flex items-center justify-center text-amber-400 animate-pulse font-mono text-xs">
                  Gerando QRCode...
                </div>
              )}
              {selectedCustomer && (
                <p className="text-xs font-semibold text-amber-300">
                  Cliente: {selectedCustomer.name}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-zinc-400 block">
                Link direto do Certificado do Cliente:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/cert/${qrCertModal.id}?type=certificate`}
                  className="flex-1 bg-black/80 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-amber-200 focus:outline-none"
                />
                <button
                  onClick={handleCopyCertLink}
                  className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-950" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copiar Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              {onOpenPrintModal && (
                <button
                  onClick={() => {
                    const certToPrint = qrCertModal;
                    setQrCertModal(null);
                    onOpenPrintModal(certToPrint);
                  }}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-zinc-950 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                >
                  <Printer className="w-4 h-4 text-zinc-950" />
                  <span>Imprimir Certificado</span>
                </button>
              )}
              <button
                onClick={() => setQrCertModal(null)}
                className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold text-xs rounded-xl border border-zinc-800 transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
