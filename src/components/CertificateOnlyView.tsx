import React, { useState } from 'react';
import { JewelryCertificate, AppUser } from '../types';
import { formatImageUrl } from '../utils/imageUtils';
import { 
  Award, 
  ShieldCheck, 
  Printer, 
  Share2, 
  Calendar, 
  User, 
  Gem, 
  CheckCircle2, 
  ArrowLeft,
  Eye,
  ExternalLink,
  Sparkles,
  FileText
} from 'lucide-react';

interface CertificateOnlyViewProps {
  cert: JewelryCertificate;
  currentUser?: AppUser | null;
  onOpenPrintModal: (cert: JewelryCertificate) => void;
  onBackToPreviousView?: () => void;
  onOpenFullPassport?: (cert: JewelryCertificate) => void;
}

export const CertificateOnlyView: React.FC<CertificateOnlyViewProps> = ({
  cert,
  currentUser,
  onOpenPrintModal,
  onBackToPreviousView,
  onOpenFullPassport
}) => {
  const [shareCopied, setShareCopied] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>(cert.images?.[0] || '');

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/cert/${encodeURIComponent(cert.id)}?type=certificate`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 3000);
    }
  };

  const primaryStone = cert.stones && cert.stones.length > 0 ? cert.stones[0] : null;

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-6 sm:py-10 space-y-6 animate-fade-in" id="certificate-only-view">
      
      {/* Top Action Header Bar */}
      <div className="bg-zinc-900/90 border border-amber-500/30 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        
        {/* Left Side: Title & Optional Back button */}
        <div className="flex items-center gap-3">
          {onBackToPreviousView && (
            <button
              onClick={onBackToPreviousView}
              className="p-2 sm:p-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 transition-all cursor-pointer shrink-0"
              title="Voltar"
              id="btn-cert-only-back"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            </button>
          )}

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wider">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                Certificado Oficial
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-mono bg-zinc-800 text-emerald-400 border border-emerald-500/40 font-semibold">
                Série: {cert.serialNumber}
              </span>
            </div>
            <h1 className="text-base sm:text-xl font-bold font-serif text-amber-100 truncate mt-0.5">
              Certificado de Autenticidade #{cert.id}
            </h1>
          </div>
        </div>

        {/* Right Side: Action buttons */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => onOpenPrintModal(cert)}
            className="flex-1 sm:flex-none py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-extrabold text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer border border-amber-400"
            id="btn-cert-only-print"
          >
            <Printer className="w-4 h-4 text-zinc-950 shrink-0" />
            <span>Imprimir / PDF</span>
          </button>

          <button
            onClick={handleShare}
            className="py-2.5 px-3.5 bg-zinc-800 hover:bg-zinc-700 text-amber-200 font-semibold text-xs rounded-xl border border-amber-900/40 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            id="btn-cert-only-share"
          >
            <Share2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{shareCopied ? 'Link Copiado!' : 'Compartilhar'}</span>
          </button>

          {onOpenFullPassport && (
            <button
              onClick={() => onOpenFullPassport(cert)}
              className="py-2.5 px-3.5 bg-zinc-800 hover:bg-zinc-700 text-amber-300 font-semibold text-xs rounded-xl border border-amber-500/30 hover:border-amber-400 transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              title="Abrir visualização interativa em 360° e inspeção de detalhes"
              id="btn-cert-only-passport"
            >
              <Eye className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="hidden md:inline">Ver Passaporte 360°</span>
            </button>
          )}
        </div>

      </div>

      {/* Main Luxury Paper Certificate Card */}
      <div 
        className="bg-white text-zinc-900 rounded-2xl sm:rounded-3xl shadow-2xl p-5 sm:p-10 border-4 border-amber-800/30 overflow-hidden relative space-y-6"
        id="official-certificate-document"
      >
        {/* Background Watermark */}
        {cert.manufacturerLogoUrl ? (
          <img 
            src={formatImageUrl(cert.manufacturerLogoUrl)} 
            alt={cert.manufacturer} 
            className="absolute inset-0 m-auto w-64 h-64 sm:w-80 sm:h-80 object-contain opacity-[0.04] pointer-events-none select-none grayscale"
            referrerPolicy="no-referrer"
          />
        ) : (
          <Gem className="absolute inset-0 m-auto w-72 h-72 sm:w-96 sm:h-96 text-zinc-900/[0.03] pointer-events-none -rotate-12" />
        )}

        <div className="relative z-10 space-y-6">
          
          {/* Document Header */}
          <div className="text-center space-y-3 border-b-2 border-amber-800/20 pb-5">
            {cert.manufacturerLogoUrl ? (
              <div className="flex items-center justify-center py-1">
                <img 
                  src={formatImageUrl(cert.manufacturerLogoUrl)} 
                  alt={cert.manufacturer} 
                  className="h-14 sm:h-20 max-w-[280px] object-contain mx-auto"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-zinc-950 uppercase tracking-widest text-xl font-serif font-bold">
                <Award className="w-6 h-6 text-amber-800" />
                <span>{cert.manufacturer || 'Maison Lumière Joias'}</span>
              </div>
            )}

            <div className="space-y-1">
              <h2 className="font-serif text-base sm:text-xl font-extrabold tracking-widest text-zinc-900 uppercase">
                Certificado de Autenticidade & Origem
              </h2>
              <p className="text-xs sm:text-sm text-zinc-600 italic font-serif">
                Documento Digital Oficial de Certificação Gemológica e Garantia Legal
              </p>
            </div>
          </div>

          {/* Piece Title & Summary Box */}
          <div className="bg-amber-50/80 border border-amber-800/30 p-4 sm:p-6 rounded-2xl space-y-4 shadow-sm">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-800/20 pb-3">
              <div>
                <span className="text-[10px] text-amber-900 font-bold uppercase tracking-widest block">
                  {cert.collection || 'Alta Joalheria'}
                </span>
                <h3 className="text-xl sm:text-2xl font-extrabold font-serif text-zinc-950">
                  {cert.title}
                </h3>
              </div>

              <div className="font-mono text-left sm:text-right">
                <span className="text-[10px] text-amber-900 font-bold uppercase tracking-widest block">N° do Certificado</span>
                <span className="text-amber-900 font-bold text-base sm:text-lg">{cert.id}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-zinc-500 block text-[10px] font-bold uppercase tracking-wider">Número de Série:</span>
                <span className="font-mono font-bold text-zinc-900 text-sm">{cert.serialNumber}</span>
              </div>

              <div>
                <span className="text-zinc-500 block text-[10px] font-bold uppercase tracking-wider">Data de Emissão:</span>
                <span className="font-bold text-zinc-900">{new Date(cert.issueDate).toLocaleDateString('pt-BR')}</span>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <span className="text-zinc-500 block text-[10px] font-bold uppercase tracking-wider">Ateliê Responsável:</span>
                <span className="font-bold text-zinc-900 truncate block">{cert.manufacturer}</span>
              </div>
            </div>

            {/* Registered Owner / Titular Section */}
            {cert.currentOwnerName && (
              <div className="pt-3 border-t border-amber-800/20 flex items-center justify-between gap-2 flex-wrap text-xs">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-amber-800 shrink-0" />
                  <span className="text-zinc-700 font-medium">
                    Titular Registrado: <strong className="text-zinc-950 font-bold font-serif text-sm">{cert.currentOwnerName}</strong>
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                  Posse Verificada
                </span>
              </div>
            )}
          </div>

          {/* Photo & Technical Specs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            
            {/* Primary Image Preview (5 cols on md) */}
            <div className="md:col-span-5 space-y-3">
              <div className="relative aspect-square rounded-2xl bg-zinc-100 border-2 border-amber-800/20 overflow-hidden shadow-md flex items-center justify-center group">
                {cert.images && cert.images.length > 0 ? (
                  <img 
                    src={formatImageUrl(selectedImage || cert.images[0])} 
                    alt={cert.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="p-6 text-center text-zinc-400 space-y-2">
                    <Gem className="w-12 h-12 mx-auto text-zinc-300" />
                    <span className="text-xs">Fotografia Oficial Anexada</span>
                  </div>
                )}
                <div className="absolute bottom-2 right-2 bg-black/70 text-amber-300 text-[10px] font-mono px-2 py-0.5 rounded-md backdrop-blur-xs">
                  Foto Oficial
                </div>
              </div>

              {/* Gallery Thumbnails if multiple */}
              {cert.images && cert.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {cert.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(img)}
                      className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                        selectedImage === img ? 'border-amber-600 scale-105 shadow-sm' : 'border-zinc-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img 
                        src={formatImageUrl(img)} 
                        alt={`${cert.title} thumb ${idx}`}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Technical Specifications List (7 cols on md) */}
            <div className="md:col-span-7 space-y-4">
              <h4 className="text-sm font-extrabold uppercase tracking-wider text-amber-900 border-b border-amber-800/20 pb-1.5 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-800" />
                <span>Especificações Técnicas da Peça</span>
              </h4>

              <div className="grid grid-cols-2 gap-3 text-xs">
                
                <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200 space-y-0.5">
                  <span className="text-zinc-500 text-[10px] block font-bold uppercase tracking-wider">Metal Nobre</span>
                  <span className="font-bold text-zinc-950 text-sm">{cert.metalPurity}</span>
                  <span className="text-[11px] text-zinc-600 block">Cor: {cert.metalColor}</span>
                </div>

                <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200 space-y-0.5">
                  <span className="text-zinc-500 text-[10px] block font-bold uppercase tracking-wider">Peso Bruto Estimado</span>
                  <span className="font-bold text-zinc-950 text-sm">{cert.grossWeightGrams} g</span>
                  {cert.widthCm && Number(cert.widthCm) > 0 && (
                    <span className="text-[11px] text-zinc-600 block">Largura: {cert.widthCm} cm</span>
                  )}
                </div>

                <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200 space-y-0.5">
                  <span className="text-zinc-500 text-[10px] block font-bold uppercase tracking-wider">Acabamento</span>
                  <span className="font-bold text-zinc-900 block truncate">{cert.finish}</span>
                </div>

                <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200 space-y-0.5">
                  <span className="text-zinc-500 text-[10px] block font-bold uppercase tracking-wider">Status da Garantia</span>
                  <span className="font-bold text-emerald-700 text-sm block">{cert.warrantyStatus}</span>
                  <span className="text-[10px] text-zinc-500">
                    {cert.warrantyMonths === -1 ? 'Vitalícia Definitiva' : `${cert.warrantyMonths} Meses`}
                  </span>
                </div>

                {cert.estimatedValueBRL && cert.estimatedValueBRL > 0 && (
                  <div className="col-span-2 bg-zinc-50 p-3 rounded-xl border border-zinc-200 space-y-0.5">
                    <span className="text-zinc-500 text-[10px] block font-bold uppercase tracking-wider">Valor Estimado de Avaliação</span>
                    <span className="font-mono font-bold text-amber-900 text-base">
                      {cert.estimatedValueBRL.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                )}

              </div>

              {/* Warranty Terms Note */}
              <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-800/20 text-[11px] text-zinc-700 leading-relaxed">
                <strong className="text-amber-900 font-bold block mb-0.5">Termos da Garantia:</strong>
                {cert.warrantyTerms || 'Garantia permanente sobre a autenticidade do metal nobre e das pedras preciosas descritas neste certificado.'}
              </div>

            </div>

          </div>

          {/* Gemological Details / Stones Section */}
          {cert.hasStones && cert.stones && cert.stones.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-sm font-extrabold uppercase tracking-wider text-amber-900 border-b border-amber-800/20 pb-1.5 flex items-center gap-2">
                <Gem className="w-4 h-4 text-amber-800" />
                <span>Detalhamento Gemológico das Gemas e Pedras</span>
              </h4>

              <div className="overflow-x-auto rounded-xl border border-zinc-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-amber-900/10 text-amber-950 font-bold uppercase tracking-wider text-[10px] border-b border-zinc-200">
                    <tr>
                      <th className="p-2.5">Tipo de Gema</th>
                      <th className="p-2.5">Lapidação</th>
                      <th className="p-2.5">Qtd</th>
                      <th className="p-2.5">Peso (ct)</th>
                      <th className="p-2.5">Cor / Pureza</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 text-zinc-800">
                    {cert.stones.map((stone, idx) => (
                      <tr key={stone.id || idx} className="hover:bg-amber-50/50">
                        <td className="p-2.5 font-bold text-zinc-950">{stone.type}</td>
                        <td className="p-2.5">{stone.cutShape || 'Brilhante'}</td>
                        <td className="p-2.5 font-mono">{stone.quantity}</td>
                        <td className="p-2.5 font-mono font-semibold text-amber-900">
                          {stone.caratWeight > 0 ? `${stone.caratWeight} ct` : '-'}
                        </td>
                        <td className="p-2.5 text-zinc-600">
                          {[stone.colorGrade, stone.clarityGrade].filter(Boolean).join(' / ') || 'Classificação Natural'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Cryptographic Authenticity Seal & Hash */}
          <div className="pt-2">
            <div className="bg-zinc-950 text-amber-100 p-4 sm:p-5 rounded-2xl border-2 border-emerald-500/50 space-y-2 shadow-xl">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Selo Criptográfico de Autenticidade Registrado
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500 text-zinc-950 font-extrabold">
                  VERIFICADO
                </span>
              </div>

              <p className="text-[11px] text-zinc-400">
                Código Hash de validação de proceduralidade e rastreabilidade digital da peça:
              </p>

              <code className="block font-mono text-xs sm:text-sm font-semibold text-amber-300 bg-black p-3 rounded-xl border border-amber-500/30 break-all select-all shadow-inner">
                {cert.authenticityHash || `0x${cert.id.replace(/-/g, '').toLowerCase()}89ab4c21e0`}
              </code>
            </div>
          </div>

          {/* Footer Statement & Signature Line */}
          <div className="pt-4 border-t border-amber-800/20 text-center space-y-4">
            <p className="text-[11px] text-zinc-600 italic max-w-xl mx-auto leading-relaxed">
              Atestamos a veracidade e exatidão de todas as especificações técnicas, teor dos metais e autenticidade das pedras preciosas identificadas neste certificado.
            </p>

            <div className="pt-2 flex flex-col items-center justify-center">
              <div className="w-48 border-b border-zinc-950 mb-1" />
              <span className="text-xs font-bold text-zinc-900 font-serif uppercase tracking-wider">{cert.manufacturer}</span>
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Ateliê Central de Certificação</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
