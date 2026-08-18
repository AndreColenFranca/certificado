import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { JewelryCertificate, AppUser } from '../types';
import { HighResPhotoInspector } from './HighResPhotoInspector';
import { WarrantyRenderer } from './WarrantyRenderer';
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
  onOpenTransferModal: (cert: JewelryCertificate) => void;
  onDeleteCertificate?: (cert: JewelryCertificate) => void;
  onEditCertificate?: (cert: JewelryCertificate) => void;
  currentUser?: AppUser | null;
  onBackToCustomerPortal?: () => void;
}

export const CertificatePublicView: React.FC<CertificatePublicViewProps> = ({
  cert,
  initialTab,
  onOpenPrintModal,
  onOpenTransferModal,
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
          <span>Garantia</span>
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
                    <span className="text-zinc-500 text-[10px] block">Largura Aprox.</span>
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
                      <span className="text-xs text-zinc-500">Largura Aprox.</span>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Termos e Cobertura */}
          <div className="bg-zinc-900/90 border border-amber-900/40 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="font-serif text-lg font-bold text-amber-200 flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-400" />
              Termos e Cobertura
            </h3>

            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-zinc-400 leading-relaxed text-sm">
              <WarrantyRenderer text={cert.warrantyTerms} />
            </div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-8">
            {/* Status da Garantia */}
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

              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs space-y-3">
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
            </div>

            {/* O que não é coberto */}
            <div className="bg-zinc-900/90 border border-red-900/40 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="font-serif text-lg font-bold text-red-400 flex items-center gap-2">
                <Info className="w-5 h-5 text-red-500" />
                O que não é coberto pela Garantia da Estilo Raro?
              </h3>

              <div className="space-y-2">
                <div className="flex gap-2 items-start p-3 bg-zinc-950 rounded-lg border border-red-900/30">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                  <span className="text-xs text-zinc-300">Danos decorrentes de quedas</span>
                </div>

                <div className="flex gap-2 items-start p-3 bg-zinc-950 rounded-lg border border-red-900/30">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                  <span className="text-xs text-zinc-300">Uso inadequado</span>
                </div>

                <div className="flex gap-2 items-start p-3 bg-zinc-950 rounded-lg border border-red-900/30">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                  <span className="text-xs text-zinc-300">Acidentes de qualquer natureza</span>
                </div>

                <div className="flex gap-2 items-start p-3 bg-zinc-950 rounded-lg border border-red-900/30">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                  <span className="text-xs text-zinc-300">Contato com agentes químicos que possam danificar os materiais da peça</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Care Guide */}
      {activeTab === 'care' && (
        <div className="bg-zinc-900/90 border border-amber-900/40 rounded-2xl p-8 shadow-xl space-y-6">
          <div className="space-y-2">
            <h3 className="font-serif text-2xl font-bold text-amber-200 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-amber-400" />
              Manual de Cuidados
            </h3>
          </div>

          <div className="space-y-6 text-sm text-zinc-300 leading-relaxed">
            {/* Intro */}
            <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800">
              <p>
                As joias da Estilo Raro são feitas para durar a vida toda — e ainda passar adiante. Mas, como tudo o que é valioso, elas pedem alguns cuidados simples para continuar lindas como no primeiro dia.
              </p>
            </div>

            {/* Prata */}
            <div>
              <h4 className="font-bold text-amber-300 mb-2 flex items-center gap-2"><Sparkles className="w-5 h-5" /> Prata</h4>
              <p className="mb-3">
                A prata 950 é composta por 95% de prata pura. Um metal nobre, porém maleável e sensível. Com o tempo, é natural que ela escureça. Isso acontece porque a prata reage com o enxofre presente no ar, formando uma camada escura na superfície. O suor, cosméticos e umidade também aceleram esse processo. Não é defeito é a natureza do metal.
              </p>
              <p className="mb-3">
                Limpe com flanela própria após cada uso, antes de guardar. Isso remove o suor e resíduos que aceleram o escurecimento.
              </p>
              <p className="mb-3">
                Para limpeza mais profunda: água morna, sabão neutro e escova de cerdas macias. Seque bem com pano macio.
              </p>
              <p className="mb-3">
                Guarde separada de outras joias e metais, em local seco, pois o contato com outros metais pode acelerar a oxidação. Evite contato com perfume, cremes, cloro, produtos de limpeza e água do mar.
              </p>
              <div className="p-3 bg-red-950/20 border-l-4 border-red-500 rounded mb-3 italic">
                <p className="text-sm text-zinc-300">
                  Não use líquidos para polir prata. Eles podem estragar os detalhes e o acabamento da peça.
                </p>
              </div>
              <p className="text-sm text-zinc-300 italic">
                Dica extra: se for guardar por um tempo sem usar, envolva a peça em flanela. Quanto menos contato com o ar, mais tempo ela mantém o brilho.
              </p>
            </div>

            {/* Garantia - Citação */}
            <div className="pl-4 border-l-4 border-red-500 bg-red-950/10 py-4 pr-4 italic">
              <p className="mb-2">A garantia não cobre:</p>
              <ul className="space-y-1 ml-4 mb-3">
                <li className="flex gap-2">
                  <span className="shrink-0">•</span>
                  <span>Danos decorrentes de quedas</span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0">•</span>
                  <span>Uso inadequado</span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0">•</span>
                  <span>Acidentes de qualquer natureza</span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0">•</span>
                  <span>Contato com agentes químicos que possam danificar os materiais da peça</span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0">•</span>
                  <span>Gemas, pedras e pérolas não são cobertas pela garantia</span>
                </li>
              </ul>
              <p>
                Na entrega, confira sua joia com calma. Se algo não estiver certo, resolveremos na hora. Precisou de reparo fora da garantia? Fazemos um orçamento justo e transparente. Para trocas, basta enviar a peça sem uso, no estojo original, com nota fiscal e certificado de garantia, em até 90 dias após a compra.
              </p>
            </div>

            {/* Ouro 18K */}
            <div>
              <h4 className="font-bold text-amber-300 mb-2 flex items-center gap-2"><Layers className="w-5 h-5" /> Ouro 18K</h4>
              <p>
                O ouro é um metal nobre e maleável e por isso é lindo, mas também delicado. No Brasil, o padrão é o ouro 18 quilates (18K ou teor 750): 75% de ouro puro e 25% de ligas (geralmente prata e cobre). Essa combinação garante durabilidade sem perder a beleza. Sua joia pode ter acabamento polido (brilhante) ou fosco (texturizado). O uso diário vai marcando a superfície com o tempo que é natural. Uma dica importante: não exagere no polimento, pois a peça perde um pouquinho do peso em ouro a cada vez.
              </p>
            </div>

            {/* Ouro Branco */}
            <div>
              <h4 className="font-bold text-amber-300 mb-2 flex items-center gap-2"><Gem className="w-5 h-5" /> Ouro Branco</h4>
              <p>
                A joia em ouro branco, no estado natural, é levemente amarelada. Aquele brilho prateado que você ama vem do banho de ródio. Com o uso diário, esse banho vai se desgastando e a peça pode voltar ao tom amarelado original. É completamente normal. Na Estilo Raro você tem um <strong>Banho de Ródio gratuito</strong> para manter suas joias sempre renovadas e brilhantes.
              </p>
            </div>

            {/* Pérolas */}
            <div>
              <h4 className="font-bold text-amber-300 mb-2 flex items-center gap-2"><Sparkle className="w-5 h-5" /> Joias com Pérolas</h4>
              <p className="mb-2">
                Pérolas são gemas orgânicas — vivas, sensíveis e únicas. Por isso, mantenha-as longe de:
              </p>
              <ul className="space-y-1 ml-4 mb-2">
                <li className="flex gap-2">
                  <span className="text-amber-400 shrink-0">•</span>
                  <span>Detergentes e produtos químicos</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-400 shrink-0">•</span>
                  <span>Sprays e produtos para cabelo</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-400 shrink-0">•</span>
                  <span>Secador de cabelo</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-400 shrink-0">•</span>
                  <span>Piscina, água quente, água salgada e areia</span>
                </li>
              </ul>
              <p>
                Depois de usar: limpe com uma flanela macia levemente úmida para tirar suor, cremes e maquiagem. Guarde envolta em flanela, separada das outras joias.
              </p>
            </div>

            {/* Diamantes */}
            <div>
              <h4 className="font-bold text-amber-300 mb-2 flex items-center gap-2"><Scale className="w-5 h-5" /> Diamantes</h4>
              <p>
                O diamante é o material mais duro da natureza mas nem por isso é indestrutível. Guarde separado das outras joias para evitar arranhões. Mantenha sempre limpo, principalmente após usar hidratantes, cremes e protetor solar. Nunca use produtos químicos para limpar. Para limpar em casa: escova de cerdas macias, água e sabão neutro, friccionando com delicadeza. Simples assim.
              </p>
            </div>

            {/* Gemas */}
            <div>
              <h4 className="font-bold text-amber-300 mb-2 flex items-center gap-2"><Gem className="w-5 h-5" /> Joias com Gemas</h4>
              <p className="mb-2">
                Gemas são delicadas e pedem atenção redobrada. Impactos podem afetar as garras e a estrutura da peça, causando quebras ou arranhões e isso faz você perder a garantia de fábrica. Alguns pontos de atenção:
              </p>
              <ul className="space-y-1 ml-4">
                <li className="flex gap-2">
                  <span className="text-amber-400 shrink-0">•</span>
                  <span>Calor excessivo e choques térmicos podem manchar certas pedras</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-400 shrink-0">•</span>
                  <span>Pedras como ametista, citrino, água-marinha e berilo são sensíveis ao sol. Evite exposição prolongada</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-400 shrink-0">•</span>
                  <span>Esmeralda é uma das mais sensíveis a impactos: não use em situações de risco</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-400 shrink-0">•</span>
                  <span>Anéis com pedras merecem cuidado extra — uma batida pode soltar a gema</span>
                </li>
              </ul>
            </div>

            {/* Cuidados Especiais */}
            <div>
              <h4 className="font-bold text-amber-300 mb-2 flex items-center gap-2"><ShieldCheck className="w-5 h-5" /> Cuidados Especiais — Resumo Prático</h4>
              <ul className="space-y-1 ml-4">
                <li className="flex gap-2">
                  <span className="text-amber-400 shrink-0">•</span>
                  <span>Limpe suas joias periodicamente com flanela macia</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-400 shrink-0">•</span>
                  <span>Para limpeza mais profunda: água, sabão neutro e escova de cerdas macias. Seque com papel macio</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-400 shrink-0">•</span>
                  <span>Evite contato com perfume, cremes, laquê, cloro, enxofre, xampu, detergentes, sabonete e bronzeadores</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-400 shrink-0">•</span>
                  <span>Tire as joias para banho de mar ou piscina, tarefas domésticas e atividades esportivas</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-400 shrink-0">•</span>
                  <span>Não passe perfume ou cremes com as joias no corpo. Coloque-as só depois que a pele estiver seca</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-400 shrink-0">•</span>
                  <span>Mantenha sua joia longe de mercúrio (como o de termômetros), pois o dano pode ser irreversível</span>
                </li>
              </ul>
            </div>

            {/* Fechamento */}
            <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 italic">
              <p>
                Sua joia conta uma história. Vamos cuidar dela juntos. 🤍 Se tiver qualquer dúvida sobre cuidados, manutenção ou garantia, fale com a gente. A Estilo Raro está aqui não só na hora da compra. Estamos com você sempre que precisar.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
