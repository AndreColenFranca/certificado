import React, { useState } from 'react';
import QRCode from 'qrcode';
import { JewelryCertificate } from '../types';
import { Printer, Download, X, ShieldCheck, Award, Gem, User } from 'lucide-react';
import { formatImageUrl } from '../utils/imageUtils';
import { printElement, generateCertificatePdf } from '../utils/printUtils';
import { isCustomerLinkedToCertificate } from '../utils/customerUtils';

interface PrintCertificateModalProps {
  cert: JewelryCertificate | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PrintCertificateModal: React.FC<PrintCertificateModalProps> = ({
  cert,
  isOpen,
  onClose
}) => {
  const [qrUrl, setQrUrl] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-print-active');
    } else {
      document.body.classList.remove('modal-print-active');
    }
    return () => {
      document.body.classList.remove('modal-print-active');
    };
  }, [isOpen]);

  React.useEffect(() => {
    if (cert && isOpen) {
      // QR code on the certificate points directly to the Passaporte Digital
      const passportUrl = `${window.location.origin}/cert/${encodeURIComponent(cert.id)}`;
      QRCode.toDataURL(passportUrl, {
        width: 180,
        margin: 1,
        color: { dark: '#18181b', light: '#ffffff' }
      }).then(setQrUrl);
    }
  }, [cert, isOpen]);

  if (!isOpen || !cert) return null;

  const handleDownloadPdf = async () => {
    setIsProcessing(true);
    try {
      await generateCertificatePdf('printable-certificate-document', `Certificado_${cert.serialNumber || cert.id}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrint = async () => {
    setIsProcessing(true);
    try {
      await printElement('printable-certificate-document', `Certificado_${cert.serialNumber || cert.id}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const isLinked = isCustomerLinkedToCertificate(cert);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col print:static print:bg-white print:p-0">
      
      {/* Control Header Bar for Screen Only */}
      <div className="shrink-0 w-full bg-zinc-950/95 border-b border-amber-500/30 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4 shadow-2xl z-50 print:hidden">
        <div className="flex items-center gap-3 truncate">
          <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div className="truncate">
            <h2 className="text-amber-200 text-sm sm:text-base font-bold truncate">
              Certificado de Autenticidade #{cert.serialNumber || cert.id}
            </h2>
            <p className="text-[11px] text-zinc-400 hidden sm:block">
              Confira todos os dados do certificado antes de baixar ou imprimir
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleDownloadPdf}
            disabled={isProcessing}
            className="flex items-center gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-extrabold text-xs sm:text-sm rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-wait"
            id="btn-download-pdf"
            title="Baixar Certificado em PDF"
          >
            <Download className="w-4 h-4 text-zinc-950 shrink-0" />
            <span>{isProcessing ? 'A Gerar PDF...' : 'Baixar PDF'}</span>
          </button>

          <button
            onClick={handlePrint}
            disabled={isProcessing}
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 bg-zinc-800 hover:bg-zinc-700 text-amber-300 font-bold text-xs sm:text-sm rounded-xl border border-amber-500/30 shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
            id="btn-trigger-print"
            title="Imprimir Certificado"
          >
            <Printer className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="hidden sm:inline">Imprimir</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 sm:p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer border border-zinc-700 hover:text-white"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Document Viewer Container */}
      <div className="flex-1 overflow-y-auto px-2 sm:px-6 py-4 sm:py-8 flex flex-col items-center print:p-0 print:m-0 print:overflow-visible">
        
        {/* Luxury Printable Paper Layout */}
        <div 
          className="relative w-full max-w-3xl bg-white text-zinc-900 rounded-none shadow-2xl p-5 sm:p-8 overflow-hidden print:m-0 print:w-full print:max-w-none print:shadow-none print:bg-white print:border-none"
          id="printable-certificate-document"
        >
        {/* Watermark Background Logo */}
        {cert.manufacturerLogoUrl ? (
          <img 
            src={formatImageUrl(cert.manufacturerLogoUrl)} 
            alt={cert.manufacturer} 
            className="absolute inset-0 m-auto w-64 h-64 object-contain opacity-[0.04] pointer-events-none select-none grayscale"
            referrerPolicy="no-referrer"
          />
        ) : (
          <Gem className="absolute inset-0 m-auto w-80 h-80 text-zinc-900/[0.03] pointer-events-none -rotate-12" />
        )}

        <div className="relative z-10 space-y-3.5 text-center">
          
          {/* Certificate Header */}
          <div className="space-y-1.5 border-b border-amber-800/30 pb-2.5">
            {cert.manufacturerLogoUrl ? (
              <div className="flex items-center justify-center py-0.5">
                <img 
                  src={formatImageUrl(cert.manufacturerLogoUrl)} 
                  alt={cert.manufacturer} 
                  className="h-12 sm:h-14 max-w-[240px] object-contain mx-auto"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center gap-1.5 text-zinc-950 uppercase tracking-widest text-base font-serif font-bold">
                <Award className="w-4 h-4 text-amber-800" />
                <span>{cert.manufacturer}</span>
              </div>
            )}

            {/* Proportional, refined title smaller than logo above */}
            <h1 className="font-serif text-xs sm:text-sm font-extrabold tracking-widest text-zinc-900 uppercase py-1 max-w-lg mx-auto">
              Certificado de Autenticidade & Origem
            </h1>

            <p className="text-[10px] text-zinc-500 italic font-serif">
              Documento de Certificação Digital de Joias de Luxo e Garantia de Qualidade
            </p>
          </div>

          {/* Piece Identifier */}
          <div className="bg-zinc-50/80 border border-amber-800/30 p-2.5 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs shadow-xs">
            <div className="text-left">
              <span className="text-[9px] text-amber-900 uppercase tracking-wider block font-bold">Título da Joia</span>
              <strong className="text-xs sm:text-sm text-zinc-950 font-serif font-bold">{cert.title}</strong>
            </div>

            <div className="text-left font-mono">
              <span className="text-[9px] text-amber-900 uppercase tracking-wider block font-bold">Código do Certificado</span>
              <strong className="text-amber-900 font-bold text-sm sm:text-base break-all">{cert.certCode || cert.id}</strong>
            </div>

            <div className="text-left font-mono">
              <span className="text-[9px] text-amber-900 uppercase tracking-wider block font-bold">N° Passaporte Digital</span>
              <strong className="text-amber-900 font-bold text-xs text-zinc-600 break-all">{cert.id}</strong>
            </div>

            <div className="text-left font-mono">
              <span className="text-[9px] text-amber-900 uppercase tracking-wider block font-bold">Número de Série</span>
              <strong className="text-amber-900 font-bold text-xs sm:text-sm">{cert.serialNumber}</strong>
            </div>
          </div>

          {/* Registered Owner / Purchaser Section (Titular Atual) */}
          <div className="bg-amber-50/30 border border-amber-800/30 p-2.5 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs text-left shadow-xs">
            <div>
              <span className="text-[9px] text-amber-900 uppercase tracking-wider font-bold flex items-center gap-1">
                <User className="w-3 h-3 text-amber-800" />
                Comprador / Titular Registrado
              </span>
              <strong className="text-xs sm:text-sm font-bold text-zinc-950 block mt-0.5 font-serif">
                {cert.currentOwnerName || 'Ateliê Central (Em Estoque)'}
              </strong>
            </div>

            {cert.ownerCpf && (
              <div className="font-mono">
                <span className="text-[9px] text-amber-900 uppercase tracking-wider block font-bold">
                  CPF do Titular
                </span>
                <strong className="text-amber-950 font-bold text-xs">
                  {cert.ownerCpf}
                </strong>
              </div>
            )}
          </div>

          {/* Specifications Grid */}
          <div className="space-y-2 text-left">
            <h3 className="font-serif text-xs font-bold text-zinc-950 uppercase tracking-wider border-b border-amber-800/30 pb-1">
              Especificações Técnicas da Joia
            </h3>

            {(() => {
              const hasWeight = Boolean(cert.grossWeightGrams && Number(cert.grossWeightGrams) > 0);
              const hasWidth = Boolean(cert.widthCm && Number(cert.widthCm) > 0);
              return (
                <div className={`grid ${hasWeight || hasWidth ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5' : 'grid-cols-2 sm:grid-cols-4'} gap-2 text-xs`}>
                  <div className="p-2 bg-zinc-50 rounded-lg border border-zinc-200">
                    <span className="text-[9px] text-zinc-500 font-bold block uppercase tracking-wider">Metal:</span>
                    <strong className="text-zinc-950 font-bold text-xs block mt-0.5">{cert.metalPurity}</strong>
                  </div>

                  <div className="p-2 bg-zinc-50 rounded-lg border border-zinc-200">
                    <span className="text-[9px] text-zinc-500 font-bold block uppercase tracking-wider">Cor:</span>
                    <strong className="text-zinc-950 font-bold text-xs block mt-0.5">{cert.metalColor}</strong>
                  </div>

                  {hasWeight && (
                    <div className="p-2 bg-zinc-50 rounded-lg border border-zinc-200">
                      <span className="text-[9px] text-zinc-500 font-bold block uppercase tracking-wider">Peso Aprox.:</span>
                      <strong className="text-zinc-950 font-bold text-xs block mt-0.5">{cert.grossWeightGrams} gramas</strong>
                    </div>
                  )}

                  {hasWidth && (
                    <div className="p-2 bg-zinc-50 rounded-lg border border-zinc-200">
                      <span className="text-[9px] text-zinc-500 font-bold block uppercase tracking-wider">Largura Aprox.:</span>
                      <strong className="text-zinc-950 font-bold text-xs block mt-0.5">{cert.widthCm} cm</strong>
                    </div>
                  )}

                  <div className="p-2 bg-zinc-50 rounded-lg border border-zinc-200">
                    <span className="text-[9px] text-zinc-500 font-bold block uppercase tracking-wider">Acabamento:</span>
                    <strong className="text-zinc-950 font-bold text-xs block mt-0.5">{cert.finish}</strong>
                  </div>
                </div>
              );
            })()}

            {/* Gemstones Details */}
            {cert.hasStones && cert.stones.length > 0 && (
              <div className="pt-1">
                <span className="text-[11px] font-bold text-zinc-950 block mb-1">Análise Gemológica:</span>
                <table className="w-full text-left text-xs border border-zinc-200 bg-white rounded-lg overflow-hidden shadow-xs">
                  <thead className="bg-zinc-100 text-zinc-950 font-bold">
                    <tr>
                      <th className="p-1.5 border-b border-zinc-200 text-[10px]">Gema</th>
                      <th className="p-1.5 border-b border-zinc-200 text-[10px]">Qtd</th>
                      <th className="p-1.5 border-b border-zinc-200 text-[10px]">Carats</th>
                      <th className="p-1.5 border-b border-zinc-200 text-[10px]">Lapidação</th>
                      <th className="p-1.5 border-b border-zinc-200 text-[10px]">Cor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 text-zinc-900 text-[11px]">
                    {cert.stones.map((s, idx) => (
                      <tr key={idx} className="hover:bg-zinc-50/50">
                        <td className="p-1.5 font-bold text-zinc-950">{s.type}</td>
                        <td className="p-1.5 font-mono text-zinc-800">{s.quantity}x</td>
                        <td className="p-1.5 font-bold font-mono text-zinc-950">{s.caratWeight > 0 ? `${s.caratWeight} ct` : '-'}</td>
                        <td className="p-1.5 text-zinc-800">{s.cutShape || '-'}</td>
                        <td className="p-1.5 text-zinc-800">{s.colorGrade || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Bottom Stamp & QR Code */}
          <div className="pt-3 border-t border-amber-800/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
            
            {/* Stamp Seal & QR Code to Passport */}
            <div className="flex items-center gap-3">
              {qrUrl && (
                <img src={qrUrl} alt="QR Code do Passaporte" className="w-16 h-16 sm:w-20 sm:h-20 p-1 bg-white border border-zinc-300 rounded-lg shadow-xs shrink-0" />
              )}
              <div className="text-xs text-zinc-900 space-y-0.5">
                <span className="font-bold flex items-center gap-1 text-emerald-800 text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  Selo de Garantia Vitalícia
                </span>
                <p className="text-[9px] text-zinc-600 max-w-xs leading-tight">
                  Escaneie o código QR para consultar o passaporte digital interativo e histórico.
                </p>
                <span className="text-[9px] font-mono text-zinc-500 block truncate max-w-xs">
                  Hash: {cert.authenticityHash}
                </span>
              </div>
            </div>

            {/* Signature Line */}
            <div className="text-center space-y-1 min-w-[160px] shrink-0">
              <div className="border-b border-zinc-900 w-36 mx-auto" />
              <span className="text-xs font-serif font-bold block text-zinc-950">Estilo Raro Joias</span>
              <span className="text-[9px] text-zinc-500 block">Ateliê Central {cert.manufacturer}</span>
            </div>

          </div>

        </div>

      </div>
    </div>
  </div>
  );
};



