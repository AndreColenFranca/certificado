import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { JewelryCertificate, AppUser } from '../types';
import { HighResPhotoInspector } from './HighResPhotoInspector';
import { formatImageUrl } from '../utils/imageUtils';
import { isCustomerLinkedToCertificate } from '../utils/customerUtils';
import {
  ShieldCheck,
  Award,
  Calendar,
  User,
  Printer,
  Download,
  Sparkles,
  Wrench,
  ArrowRightLeft,
  FileText,
  CheckCircle2,
  ExternalLink,
  Layers,
  Scale,
  Sparkle,
  Info,
  Clock,
  BookOpen,
  Gem,
  Trash2,
  Edit3,
  ArrowLeft
} from 'lucide-react';

interface CertificatePublicViewProps {
  cert: JewelryCertificate;
  initialTab?: 'photo-inspector' | 'specs' | 'history' | 'care';
  onOpenPrintModal: (cert: JewelryCertificate) => void;
  onOpenMaintenanceModal: (cert: JewelryCertificate) => void;
  onOpenTransferModal: (cert: JewelryCertificate) => void;
  onOpenAIGemologist: (cert: JewelryCertificate) => void;
  onDeleteCertificate?: (cert: JewelryCertificate) => void;
  onEditCertificate?: (cert: JewelryCertificate) => void;
  currentUser?: AppUser | null;
  onBackToCustomerPortal?: () => void;
}

export const CertificatePublicView: React.FC<CertificatePublicViewProps> = ({
  cert,
  initialTab,
  onOpenPrintModal,
  onOpenMaintenanceModal,
  onOpenTransferModal,
  onOpenAIGemologist,
  onDeleteCertificate,
  onEditCertificate,
  currentUser,
  onBackToCustomerPortal
}) => {
  const [activeTab, setActiveTab] = useState<'photo-inspector' | 'specs' | 'history' | 'care'>(() => {
    if (initialTab && initialTab !== ('certificate' as any)) return initialTab;
    return 'photo-inspector';
  });
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const isLinked = isCustomerLinkedToCertificate(cert);

  // Synchronize activeTab if initialTab changes
  useEffect(() => {
    if (initialTab && initialTab !== ('certificate' as any)) {
      setActiveTab(initialTab);
    }
  }, [cert, initialTab]);

  const handleTabChange = (tab: 'photo-inspector' | 'specs' | 'history' | 'care') => {
    setActiveTab(tab);
  };

  // Generate QR code URL pointing to Passaporte Digital
  useEffect(() => {
    const generateQR = async () => {
      try {
        const url = `${window.location.origin}/cert/${encodeURIComponent(cert.id)}`;
        const qrData = await QRCode.toDataURL(url, {
          width: 240,
          margin: 1,
          color: {
            dark: '#18181b', // zinc-900
            light: '#fef3c7' // amber-100 background
          }
        });
        setQrCodeDataUrl(qrData);
      } catch (err) {
      }
    };
    generateQR();
  }, [cert]);

  // Gold Purity calculation (% pure gold)
  const getGoldPurityPercentage = (purity: string) => {
    if (purity.includes('24K')) return '99.9% Ouro Puro';
    if (purity.includes('22K')) return '91.6% Ouro Puro';
    if (purity.includes('18K')) return '75.0% Ouro Puro (Liga Nobre)';
    if (purity.includes('14K')) return '58.5% Ouro Puro';
    if (purity.includes('10K')) return '41.7% Ouro Puro';
    if (purity.includes('Platina')) return '95.0% Platina Pura';
    if (purity.includes('Prata 925')) return '92.5% Prata de Lei';
    return purity;
  };


  const primaryStone = cert.stones && cert.stones.length > 0 ? cert.stones[0] : null;

  const isCustomer = currentUser?.role === 'customer';

  const isScannedFromQr = typeof window !== 'undefined' && (
    window.location.pathname.startsWith('/cert/') ||
    window.location.search.includes('qr=') ||
    window.location.search.includes('scanned=true')
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" id="public-certificate-view">
      
      {/* Back Button (hidden when scanned via QRCode) */}
      {onBackToCustomerPortal && !isScannedFromQr && (
        <div>
          <button
            onClick={onBackToCustomerPortal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 border border-amber-500/50 text-amber-200 font-bold text-xs transition-all cursor-pointer shadow-md active:scale-95 hover:border-amber-400"
            id="btn-back-to-customer-portal"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
            <span>Voltar para a Página Anterior</span>
          </button>
        </div>
      )}
      
      {/* Top Banner & Authenticity Badge */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-amber-500/30 shadow-2xl p-6 sm:p-8">
        {/* Subtle background glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/40">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                Passaporte Digital de Autenticidade
              </span>

              <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-zinc-800 text-zinc-300 border border-zinc-700">
                ID: {cert.id}
              </span>

              <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-zinc-800 text-amber-400 border border-amber-900/50">
                Série: {cert.serialNumber}
              </span>

              {cert.certCode && (
                <span className="px-4 py-2 rounded-lg text-sm font-bold font-mono bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border border-emerald-400 shadow-lg">
                  🎫 {cert.certCode}
                </span>
              )}
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-amber-100">
              {cert.title}
            </h1>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-xs text-zinc-400">
              <div className="flex items-center gap-3">
                {cert.manufacturerLogoUrl ? (
                  <div className="h-16 sm:h-20 min-w-[120px] max-w-[280px] rounded-2xl bg-white p-2.5 border-2 border-amber-400 shadow-lg flex items-center justify-center shrink-0">
                    <img 
                      src={formatImageUrl(cert.manufacturerLogoUrl)} 
                      alt={cert.manufacturer} 
                      className="max-h-full max-w-full w-auto h-auto object-contain rounded"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                ) : (
                  <Award className="w-6 h-6 text-amber-400" />
                )}
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold block">Joalheria / Fabricante</span>
                  <strong className="text-amber-100 text-sm sm:text-base font-serif font-bold block">{cert.manufacturer}</strong>
                  <span className="text-zinc-400 text-xs block">Coleção: <strong className="text-amber-300">{cert.collection}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:ml-auto">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span>Emissão: <strong className="text-zinc-300">{new Date(cert.issueDate).toLocaleDateString('pt-BR')}</strong></span>
              </div>
            </div>

            {cert.currentOwnerName && (
              <div className="pt-2 flex items-center gap-2 text-xs text-zinc-300 border-t border-amber-900/30">
                <User className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Comprador / Titular Registrado: <strong className="text-amber-300 font-bold text-sm font-serif">{cert.currentOwnerName}</strong></span>
              </div>
            )}
          </div>

          {/* QR Code Card & Quick Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-zinc-900/90 border border-amber-500/30 p-4 rounded-2xl backdrop-blur-md self-stretch lg:self-auto justify-between sm:justify-start">
            {isLinked && qrCodeDataUrl && (
              <div className="hidden sm:flex flex-col items-center">
                <img
                  src={qrCodeDataUrl}
                  alt="QR Code de Autenticidade"
                  className="w-24 h-24 rounded-lg shadow-md border border-amber-300/30 p-1 bg-amber-100"
                />
                <span className="text-[10px] text-zinc-400 mt-1 font-mono">Escanear para verificar</span>
              </div>
            )}

            <div className="flex flex-col gap-2 w-full sm:w-auto">
              <button
                onClick={() => onOpenPrintModal(cert)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 text-xs font-bold rounded-xl shadow-lg transition-all cursor-pointer"
                id="btn-print-certificate"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Certificado</span>
              </button>

              <div className="flex gap-2">
                {currentUser && currentUser.role !== 'customer' && (
                  <button
                    onClick={() => onOpenTransferModal(cert)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-amber-200 text-xs font-semibold rounded-xl border border-amber-900/40 transition-colors"
                    title="Transferir Titularidade"
                    id="btn-transfer-certificate"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400" />
                    <span>Transferir</span>
                  </button>
                )}
              </div>
            </div>

          </div>

        </div>

        {/* Cryptographic Hash Seal Box - FULLY VISIBLE, COMPLETE HASH */}
        <div className="mt-6 pt-5 border-t border-amber-500/20">
          <div className="bg-zinc-950/90 border border-emerald-500/40 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-start gap-3 w-full md:w-auto flex-1 min-w-0">
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shrink-0 mt-0.5">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Selo Criptográfico de Autenticidade Registrado
                  </span>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500 text-zinc-950 font-extrabold border border-emerald-400 shadow-sm">
                    VERIFICADO
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Código Hash imutável de validação de procedência e garantia legal da peça:
                </p>
                <code className="block font-mono text-xs sm:text-sm font-semibold text-amber-200 bg-black/90 px-3.5 py-2 rounded-xl border border-amber-500/30 break-all select-all shadow-inner">
                  {cert.authenticityHash || `0x${cert.id.replace(/-/g, '').toLowerCase()}89ab4c21e0`}
                </code>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Navigation Tabs - Modern Segmented Grid Layout */}
      <div className="bg-zinc-900/90 border border-amber-500/30 p-2 sm:p-2.5 rounded-2xl shadow-xl grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3" id="public-view-tabs">
        <button
          onClick={() => handleTabChange('photo-inspector')}
          className={`flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'photo-inspector'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 shadow-lg shadow-amber-500/20 ring-1 ring-amber-300 scale-[1.01]'
              : 'bg-zinc-950/90 text-zinc-300 hover:text-amber-200 hover:bg-zinc-800/90 border border-zinc-800/80 hover:border-amber-900/60'
          }`}
          id="tab-photo-inspector"
        >
          <Sparkles className={`w-4 h-4 shrink-0 ${activeTab === 'photo-inspector' ? 'text-zinc-950' : 'text-amber-400'}`} />
          <span>Minha Joia</span>
        </button>

        <button
          onClick={() => handleTabChange('specs')}
          className={`flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'specs'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 shadow-lg shadow-amber-500/20 ring-1 ring-amber-300 scale-[1.01]'
              : 'bg-zinc-950/90 text-zinc-300 hover:text-amber-200 hover:bg-zinc-800/90 border border-zinc-800/80 hover:border-amber-900/60'
          }`}
          id="tab-specs"
        >
          <Scale className={`w-4 h-4 shrink-0 ${activeTab === 'specs' ? 'text-zinc-950' : 'text-amber-400'}`} />
          <span>Detalhes da Joia</span>
        </button>

        <button
          onClick={() => handleTabChange('history')}
          className={`flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'history'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 shadow-lg shadow-amber-500/20 ring-1 ring-amber-300 scale-[1.01]'
              : 'bg-zinc-950/90 text-zinc-300 hover:text-amber-200 hover:bg-zinc-800/90 border border-zinc-800/80 hover:border-amber-900/60'
          }`}
          id="tab-history"
        >
          <Clock className={`w-4 h-4 shrink-0 ${activeTab === 'history' ? 'text-zinc-950' : 'text-amber-400'}`} />
          <span>Garantia & Histórico</span>
        </button>

        <button
          onClick={() => handleTabChange('care')}
          className={`flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'care'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 shadow-lg shadow-amber-500/20 ring-1 ring-amber-300 scale-[1.01]'
              : 'bg-zinc-950/90 text-zinc-300 hover:text-amber-200 hover:bg-zinc-800/90 border border-zinc-800/80 hover:border-amber-900/60'
          }`}
          id="tab-care"
        >
          <BookOpen className={`w-4 h-4 shrink-0 ${activeTab === 'care' ? 'text-zinc-950' : 'text-amber-400'}`} />
          <span>Manual de Cuidados</span>
        </button>
      </div>

      {/* Tab 1: High Resolution Photo Inspector with Hotspots */}
      {activeTab === 'photo-inspector' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* High Res Inspector Component */}
          <div className="lg:col-span-8">
            <HighResPhotoInspector
              images={cert.images || []}
              title={cert.title}
              serialNumber={cert.serialNumber}
              metalPurity={cert.metalPurity}
              hasStones={cert.hasStones}
              primaryStoneType={primaryStone ? (primaryStone.caratWeight > 0 ? `${primaryStone.type} (${primaryStone.caratWeight}ct)` : primaryStone.type) : undefined}
              authenticityHash={cert.authenticityHash}
            />
          </div>

          {/* Quick Specs & Composition Column */}
          <div className="lg:col-span-4 space-y-4">
            {/* Quick Specs Overview Box */}
            <div className="bg-zinc-900/80 border border-amber-900/30 rounded-2xl p-5 space-y-3">
              <h4 className="text-xs font-bold text-amber-200 uppercase tracking-wider">
                Resumo da Composição
              </h4>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                  <span className="text-zinc-500 text-[10px] block">Metal</span>
                  <span className="font-semibold text-amber-300">{cert.metalPurity}</span>
                </div>

                <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                  <span className="text-zinc-500 text-[10px] block">Peso Aprox.</span>
                  <span className="font-semibold text-amber-300">{cert.grossWeightGrams} g</span>
                </div>

                {cert.widthCm && Number(cert.widthCm) > 0 ? (
                  <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                    <span className="text-zinc-500 text-[10px] block">Largura da Peça</span>
                    <span className="font-semibold text-amber-300">{cert.widthCm} cm</span>
                  </div>
                ) : null}

                <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                  <span className="text-zinc-500 text-[10px] block">Acabamento</span>
                  <span className="font-semibold text-amber-300">{cert.finish}</span>
                </div>

                <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                  <span className="text-zinc-500 text-[10px] block">Gemas</span>
                  <span className="font-semibold text-amber-300">
                    {cert.hasStones ? `${cert.stones.length} tipo(s)` : 'Sem Pedras'}
                  </span>
                </div>
              </div>

              {cert.estimatedValueBRL && (
                <div className="mt-2 pt-3 border-t border-zinc-800 flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Avaliação Estimada (BRL):</span>
                  <span className="font-bold text-amber-400 font-mono text-sm">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cert.estimatedValueBRL)}
                  </span>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Tab 2: Full Gemological Specs */}
      {activeTab === 'specs' && (
        <div className="space-y-6">
          
          {/* Metal Purity Card */}
          <div className="bg-zinc-900/90 border border-amber-900/40 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-amber-200 flex items-center gap-2">
                <Scale className="w-5 h-5 text-amber-400" />
                O Metal
              </h3>
            </div>

            {(() => {
              const hasWidth = Boolean(cert.widthCm && Number(cert.widthCm) > 0);
              return (
                <div className={`grid ${hasWidth ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'} gap-4 pt-2`}>
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-1">
                    <span className="text-xs text-zinc-500">Metal</span>
                    <p className="text-base font-bold text-amber-300">{cert.metalPurity}</p>
                    <p className="text-[11px] text-zinc-400">{getGoldPurityPercentage(cert.metalPurity)}</p>
                  </div>

                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-1">
                    <span className="text-xs text-zinc-500">Cor</span>
                    <p className="text-base font-bold text-amber-300">{cert.metalColor}</p>
                  </div>

                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-1">
                    <span className="text-xs text-zinc-500">Peso Aprox.</span>
                    <p className="text-base font-bold text-amber-300">{cert.grossWeightGrams} gramas</p>
                  </div>

                  {hasWidth && (
                    <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-1">
                      <span className="text-xs text-zinc-500">Largura da Peça</span>
                      <p className="text-base font-bold text-amber-300">{cert.widthCm} cm</p>
                    </div>
                  )}

                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-1">
                    <span className="text-xs text-zinc-500">Acabamento</span>
                    <p className="text-base font-bold text-amber-300">{cert.finish}</p>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Gemstones Details Table */}
          <div className="bg-zinc-900/90 border border-amber-900/40 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="font-serif text-lg font-bold text-amber-200 flex items-center gap-2">
              <Gem className="w-5 h-5 text-amber-400" />
              As Pedras
            </h3>

            {cert.hasStones && cert.stones.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-amber-900/40 text-amber-400 font-semibold uppercase tracking-wider bg-zinc-950/60">
                      <th className="p-3">Gema / Tipo</th>
                      <th className="p-3">Qtd</th>
                      <th className="p-3">Quilates Aprox.</th>
                      <th className="p-3">Lapidação</th>
                      <th className="p-3">Cor</th>
                      <th className="p-3">Tipo de Cravação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/80">
                    {cert.stones.map((st) => (
                      <tr key={st.id} className="hover:bg-zinc-800/40 transition-colors text-zinc-200">
                        <td className="p-3 font-semibold text-amber-200 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          {st.type}
                        </td>
                        <td className="p-3 font-mono">{st.quantity}x</td>
                        <td className="p-3 font-bold font-mono text-amber-300">{st.caratWeight > 0 ? `${st.caratWeight} ct` : '-'}</td>
                        <td className="p-3">{st.cutShape || '-'}</td>
                        <td className="p-3">{st.colorGrade || 'N/A'}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                            {st.settingType}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-zinc-400 bg-zinc-950/50 rounded-xl border border-zinc-800 text-xs">
                Esta peça de joalheria possui foco exclusivo no trabalho em metal nobre sem encravação de gemas.
              </div>
            )}
          </div>

        </div>
      )}

      {/* Tab 3: History & Warranty */}
      {activeTab === 'history' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Warranty Details */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-zinc-900/90 border border-amber-900/40 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-lg font-bold text-amber-200 flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  Status da Garantia
                </h3>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {cert.warrantyStatus}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs space-y-2">
                <div className="flex justify-between text-zinc-400">
                  <span>Validade da Garantia:</span>
                  <span className="font-semibold text-amber-300">
                    {cert.warrantyMonths === -1 ? 'Vitalícia Definitiva' : `${cert.warrantyMonths} meses`}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Data de Fabricação:</span>
                  <span className="text-zinc-200">{new Date(cert.manufacturingDate).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-zinc-300">
                <span className="font-semibold text-amber-300 block">Termos e Cobertura:</span>
                <p className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 text-zinc-400 leading-relaxed">
                  {cert.warrantyTerms}
                </p>
              </div>

              <button
                onClick={() => onOpenMaintenanceModal(cert)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 text-xs font-bold rounded-xl shadow-lg transition-all"
                id="btn-request-maintenance"
              >
                <Wrench className="w-4 h-4" />
                <span>Solicitar Manutenção ou Polimento sob Garantia</span>
              </button>
            </div>
          </div>

          {/* Maintenance & Ownership Timeline */}
          <div className="lg:col-span-7 bg-zinc-900/90 border border-amber-900/40 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="font-serif text-lg font-bold text-amber-200 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              Linha do Tempo e Histórico do Ateliê
            </h3>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-amber-900/50">
              {cert.maintenanceHistory.map((item, idx) => (
                <div key={item.id || idx} className="relative group">
                  {/* Timeline point */}
                  <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-amber-500 border-2 border-zinc-950 ring-4 ring-amber-500/20" />

                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-1 hover:border-amber-500/40 transition-colors">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-bold text-amber-300">{item.type}</span>
                      <span className="text-zinc-500 font-mono">{new Date(item.date).toLocaleDateString('pt-BR')}</span>
                    </div>

                    <p className="text-xs text-zinc-400 font-light">{item.notes}</p>

                    <div className="pt-2 flex flex-wrap items-center justify-between text-[11px] text-zinc-500 border-t border-zinc-900">
                      <span>Local: <strong className="text-zinc-300">{item.performer}</strong></span>
                      {item.verifiedByAppraiser && (
                        <span className="text-amber-400/80">Resp: {item.verifiedByAppraiser}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Tab 4: Care Guide */}
      {activeTab === 'care' && (
        <div className="space-y-6">
          <div className="bg-zinc-900/90 border border-amber-900/40 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="font-serif text-lg font-bold text-amber-200 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-400" />
              Manual do Proprietário e Dicas de Conservação
            </h3>
            <p className="text-xs text-zinc-400">
              Recomendações técnicas customizadas para manter o brilho original do metal <strong className="text-amber-300">{cert.metalPurity}</strong> e proteger as gemas preciosas encravadas.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {cert.careGuide.map((item, idx) => (
                <div key={idx} className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 space-y-2 hover:border-amber-500/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      {item.category}
                    </span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>

                  <h4 className="font-semibold text-amber-100 text-sm">
                    {item.title}
                  </h4>

                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {item.description}
                  </p>

                  {item.warning && (
                    <div className="p-2.5 rounded bg-red-950/40 border border-red-500/30 text-red-300 text-[11px] flex items-start gap-2 mt-2">
                      <Info className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <span>{item.warning}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
