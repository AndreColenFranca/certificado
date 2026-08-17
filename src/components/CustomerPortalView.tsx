import React, { useState } from 'react';
import { JewelryCertificate, AppUser } from '../types';
import {
  ShieldCheck,
  Award,
  Search,
  Printer,
  Download,
  Sparkles,
  Gem,
  CheckCircle2,
  Eye,
  Layers,
  Clock,
  UserCheck
} from 'lucide-react';
import { formatImageUrl } from '../utils/imageUtils';
import { formatUserGreeting } from '../utils/customerUtils';

interface CustomerPortalViewProps {
  currentUser: AppUser;
  certificates: JewelryCertificate[];
  onSelectCertificate: (cert: JewelryCertificate, tab?: 'photo-inspector' | 'specs' | 'history' | 'care') => void;
  onOpenPrintModal: (cert: JewelryCertificate) => void;
  companyName: string;
  companyLogoUrl: string;
}

export const CustomerPortalView: React.FC<CustomerPortalViewProps> = ({
  currentUser,
  certificates,
  onSelectCertificate,
  onOpenPrintModal,
  companyName,
  companyLogoUrl
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter certificates that belong to this customer
  const myCertificates = certificates.filter(cert => {
    if (!currentUser) return false;
    const userEmail = currentUser.email?.toLowerCase().trim();
    const userCpf = currentUser.cpf?.replace(/\D/g, '');
    const custId = currentUser.customerId;
    const userName = currentUser.name?.toLowerCase().trim();

    const certOwnerEmail = cert.ownerEmail?.toLowerCase().trim();
    const certOwnerCpf = cert.ownerCpf?.replace(/\D/g, '');
    const certOwnerId = cert.ownerId;
    const certOwnerName = cert.currentOwnerName?.toLowerCase().trim();

    // Direct match
    if (
      (custId && certOwnerId === custId) ||
      (userEmail && certOwnerEmail === userEmail) ||
      (userCpf && certOwnerCpf && certOwnerCpf === userCpf) ||
      (userName && certOwnerName && certOwnerName === userName)
    ) {
      return true;
    }

    // Maintenance history match
    if (cert.maintenanceHistory && cert.maintenanceHistory.length > 0) {
      return cert.maintenanceHistory.some(m => {
        const mEmail = m.customerEmail?.toLowerCase().trim();
        const mCpf = m.customerCpf?.replace(/\D/g, '');
        const mId = m.customerId;
        const mName = m.customerName?.toLowerCase().trim();
        return (
          (custId && mId === custId) ||
          (userEmail && mEmail === userEmail) ||
          (userCpf && mCpf && mCpf === userCpf) ||
          (userName && mName && mName === userName)
        );
      });
    }

    return false;
  });

  // Apply search query filter among customer's pieces
  const filteredCertificates = myCertificates.filter(cert => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      cert.title.toLowerCase().includes(q) ||
      cert.serialNumber.toLowerCase().includes(q) ||
      cert.id.toLowerCase().includes(q) ||
      cert.collection.toLowerCase().includes(q) ||
      cert.metalPurity.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-12" id="customer-portal-view">
      
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-amber-500/40 p-6 sm:p-10 shadow-2xl">
        {/* Glow ambient background element */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wider">
                <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                Portal do Cliente Cadastrado
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Acesso Seguro Restrito
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold font-serif text-amber-100 tracking-tight">
              Olá, {formatUserGreeting(currentUser)}
            </h1>

            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-medium">
              Bem-vinda(o) à sua carteira digital privada da <strong className="text-amber-200">{companyName}</strong>. Abaixo estão listadas as joias adquiridas sob sua titularidade, com seus respectivos passaportes digitais de autenticidade e certificados de garantia.
            </p>
          </div>


        </div>

        {/* Quick Stats Strip */}
        <div className="mt-8 pt-6 border-t border-amber-900/40 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-amber-900/30 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Gem className="w-5 h-5" />
            </div>
            <div>
              <span className="text-zinc-400 text-[11px] block">Peças na sua Coleção</span>
              <span className="text-base font-bold text-amber-200">{myCertificates.length} joia(s) registrada(s)</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-amber-900/30 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-zinc-400 text-[11px] block">Selo de Autenticidade</span>
              <span className="text-base font-bold text-amber-200">100% Criptográfico</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-amber-900/30 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <span className="text-zinc-400 text-[11px] block">Garantia Ativa</span>
              <span className="text-base font-bold text-amber-200">Certificação Oficial</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
        <div>
          <h2 className="text-xl font-bold font-serif text-amber-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span>Minhas Joias Adquiridas ({myCertificates.length})</span>
          </h2>
          <p className="text-xs text-zinc-400">
            Clique em uma joia para visualizar seu passaporte digital completo ou gerar o certificado de garantia em PDF.
          </p>
        </div>

        {myCertificates.length > 0 && (
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Buscar em minhas joias..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-amber-900/40 rounded-xl text-xs text-amber-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              id="customer-search-input"
            />
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-amber-500/60" />
          </div>
        )}
      </div>

      {/* Jewelry Cards Grid */}
      {filteredCertificates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCertificates.map((cert) => {
            const coverImage = cert.images && cert.images.length > 0 ? cert.images[0] : '';
            
            return (
              <div
                key={cert.id}
                className="bg-zinc-900/90 border border-amber-900/40 hover:border-amber-500/60 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-amber-950/40 transition-all duration-300 flex flex-col group"
              >
                {/* Photo Preview - Clean Image without overlays */}
                <div className="relative h-56 bg-zinc-950 overflow-hidden border-b border-amber-900/20 flex items-center justify-center">
                  {coverImage ? (
                    <img
                      src={formatImageUrl(coverImage)}
                      alt={cert.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-zinc-600 gap-2 p-4">
                      <Gem className="w-10 h-10 text-zinc-700" />
                      <span className="text-[11px] font-medium text-zinc-500">Sem Foto Anexada</span>
                    </div>
                  )}
                </div>

                {/* Card Specs Body */}
                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  {/* Item Header & Badges Below Image */}
                  <div className="space-y-2">
                    {/* Top Badges Row */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                        N° {cert.serialNumber}
                      </span>

                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        {cert.warrantyStatus}
                      </span>
                    </div>

                    {/* Collection & Title */}
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                        {cert.collection}
                      </span>
                      <h3 className="text-lg font-bold font-serif text-amber-100 truncate">
                        {cert.title}
                      </h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-zinc-950/70 p-2.5 rounded-xl border border-zinc-800">
                      <span className="text-zinc-500 text-[10px] block font-medium">Teor do Metal</span>
                      <span className="font-bold text-amber-200">{cert.metalPurity}</span>
                    </div>

                    <div className="bg-zinc-950/70 p-2.5 rounded-xl border border-zinc-800">
                      <span className="text-zinc-500 text-[10px] block font-medium">Peso Bruto</span>
                      <span className="font-bold text-amber-200">
                        {cert.grossWeightGrams}g{cert.widthCm && Number(cert.widthCm) > 0 ? ` (${cert.widthCm}cm)` : ''}
                      </span>
                    </div>

                    <div className="bg-zinc-950/70 p-2.5 rounded-xl border border-zinc-800">
                      <span className="text-zinc-500 text-[10px] block font-medium">Acabamento</span>
                      <span className="font-medium text-zinc-300 truncate block">{cert.finish}</span>
                    </div>

                    <div className="bg-zinc-950/70 p-2.5 rounded-xl border border-zinc-800">
                      <span className="text-zinc-500 text-[10px] block font-medium">Gemas</span>
                      <span className="font-medium text-amber-300 truncate block">
                        {cert.hasStones && cert.stones.length > 0 ? `${cert.stones.length} tipo(s)` : 'Sem Pedras'}
                      </span>
                    </div>
                  </div>

                  {/* Authenticity Seal Footer */}
                  <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400">
                    <span className="flex items-center gap-1 font-mono text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Selo Verificado</span>
                    </span>
                    <span className="font-mono text-zinc-500 truncate max-w-[120px]">
                      {cert.id}
                    </span>
                  </div>

                  {/* Action Buttons for Customer */}
                  <div className="space-y-2 pt-1">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => onSelectCertificate(cert, 'photo-inspector')}
                        className="py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-200 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-amber-900/40"
                        id={`customer-btn-view-passport-${cert.id}`}
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate">Passaporte</span>
                      </button>

                      <button
                        onClick={() => onOpenPrintModal(cert)}
                        className="py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-200 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-amber-900/40"
                        id={`customer-btn-print-cert-${cert.id}`}
                      >
                        <Printer className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate">Imprimir</span>
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 rounded-3xl bg-zinc-900/60 border border-amber-900/30 text-center space-y-4">
          <div className="p-4 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 w-16 h-16 mx-auto flex items-center justify-center">
            <Gem className="w-8 h-8" />
          </div>
          
          <h3 className="text-lg font-bold text-amber-100 font-serif">
            {myCertificates.length === 0 
              ? 'Nenhuma Joia Vinculada ao seu Cadastro' 
              : 'Nenhuma Joia Encontrada para a Busca'}
          </h3>

          <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
            {myCertificates.length === 0 ? (
              <>
                Não localizamos certificados emitidos com o seu e-mail (<strong>{currentUser.email}</strong>) ou CPF. Caso tenha adquirido uma peça recentemente, peça ao ateliê para vincular o certificado ao seu e-mail ou CPF.
              </>
            ) : (
              `Nenhuma peça da sua coleção corresponde ao termo "${searchQuery}". Tente buscar por outro nome ou número de série.`
            )}
          </p>

        </div>
      )}

    </div>
  );
};
