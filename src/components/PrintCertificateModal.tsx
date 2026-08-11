import React, { useState } from 'react';
import QRCode from 'qrcode';
import { JewelryCertificate } from '../types';
import { Printer, X, ShieldCheck, Award, Gem, User } from 'lucide-react';
import { formatImageUrl } from '../utils/imageUtils';
import { printElement } from '../utils/printUtils';

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
  if (!isOpen || !cert) return null;

  const [qrUrl, setQrUrl] = useState<string>('');
  const [isPrinting, setIsPrinting] = useState(false);

  React.useEffect(() => {
    if (cert) {
      QRCode.toDataURL(`${window.location.origin}/cert/${cert.id}`, {
        width: 180,
        margin: 1,
        color: { dark: '#18181b', light: '#ffffff' }
      }).then(setQrUrl);
    }
  }, [cert]);

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      await printElement('printable-certificate-document', `Certificado_${cert.serialNumber || cert.id}`);
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col print:static print:bg-white print:p-0">
      
      {/* Control Header Bar for Screen Only */}
      <div className="shrink-0 w-full bg-zinc-950/95 border-b border-amber-500/30 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4 shadow-2xl z-50 print:hidden">
        <div className="flex items-center gap-3 truncate">
          <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0">
            <Printer className="w-5 h-5" />
          </div>
          <div className="truncate">
            <h2 className="text-amber-200 text-sm sm:text-base font-bold truncate">
              Certificado de Autenticidade #{cert.serialNumber || cert.id}
            </h2>
            <p className="text-[11px] text-zinc-400 hidden sm:block">
              Confira todos os dados do certificado antes de imprimir ou salvar
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handlePrint}
            disabled={isPrinting}
            className="flex items-center gap-2 px-4 sm:px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-extrabold text-xs sm:text-sm rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-wait"
            id="btn-trigger-print"
            title="Imprimir Certificado"
          >
            <Printer className="w-4 h-4 text-zinc-950 shrink-0" />
            <span>{isPrinting ? 'A Gerar Certificado...' : 'Imprimir Certificado'}</span>
          </button>

          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer border border-zinc-700 hover:text-white"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Document Viewer Container */}
      <div className="flex-1 overflow-y-auto px-2 sm:px-6 py-6 sm:py-10 flex justify-center print:p-0 print:overflow-visible">
        
        {/* Luxury Printable Paper Layout */}
        <div 
          className="relative w-full max-w-3xl bg-white text-zinc-900 rounded-2xl shadow-2xl p-6 sm:p-12 border-8 border-double border-amber-700/90 my-auto overflow-hidden print:m-0 print:w-full print:max-w-none print:shadow-none print:border-amber-700 print:bg-white"
          id="printable-certificate-document"
        >
        {/* Decorative Corner Ornaments */}
        <div className="absolute top-2 left-2 w-12 h-12 border-t-2 border-l-2 border-amber-800 pointer-events-none" />
        <div className="absolute top-2 right-2 w-12 h-12 border-t-2 border-r-2 border-amber-800 pointer-events-none" />
        <div className="absolute bottom-2 left-2 w-12 h-12 border-b-2 border-l-2 border-amber-800 pointer-events-none" />
        <div className="absolute bottom-2 right-2 w-12 h-12 border-b-2 border-r-2 border-amber-800 pointer-events-none" />

        {/* Watermark Background Logo */}
        {cert.manufacturerLogoUrl ? (
          <img 
            src={formatImageUrl(cert.manufacturerLogoUrl)} 
            alt={cert.manufacturer} 
            className="absolute inset-0 m-auto w-80 h-80 object-contain opacity-[0.05] pointer-events-none select-none grayscale"
            referrerPolicy="no-referrer"
          />
        ) : (
          <Gem className="absolute inset-0 m-auto w-96 h-96 text-zinc-900/[0.03] pointer-events-none -rotate-12" />
        )}

        <div className="relative z-10 space-y-8 text-center">
          
          {/* Certificate Header */}
          <div className="space-y-4 border-b-2 border-amber-800/30 pb-6">
            {cert.manufacturerLogoUrl ? (
              <div className="flex items-center justify-center py-1">
                <img 
                  src={formatImageUrl(cert.manufacturerLogoUrl)} 
                  alt={cert.manufacturer} 
                  className="h-16 sm:h-20 max-w-sm object-contain mx-auto"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-zinc-950 uppercase tracking-widest text-lg font-serif font-bold">
                <Award className="w-5 h-5 text-amber-800" />
                <span>{cert.manufacturer}</span>
              </div>
            )}

            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-zinc-950 uppercase font-serif">
              Certificado de Autenticidade & Origem
            </h1>

            <p className="text-xs text-zinc-600 italic font-serif">
              Documento de Certificação Digital de Joias de Luxo e Garantia de Qualidade
            </p>
          </div>

          {/* Piece Identifier */}
          <div className="bg-zinc-50 border border-amber-800/30 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4 text-xs shadow-xs">
            <div className="text-left">
              <span className="text-[10px] text-amber-900 uppercase tracking-wider block font-bold">Título da Joia</span>
              <strong className="text-base text-zinc-950 font-serif font-bold">{cert.title}</strong>
            </div>

            <div className="text-left font-mono">
              <span className="text-[10px] text-amber-900 uppercase tracking-wider block font-bold">N° do Certificado</span>
              <strong className="text-amber-900 font-bold text-sm">{cert.id}</strong>
            </div>

            <div className="text-left font-mono">
              <span className="text-[10px] text-amber-900 uppercase tracking-wider block font-bold">Número de Série</span>
              <strong className="text-amber-900 font-bold text-sm">{cert.serialNumber}</strong>
            </div>
          </div>

          {/* Registered Owner / Purchaser Section (Titular Atual) */}
          <div className="bg-amber-50/40 border border-amber-800/30 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4 text-xs text-left shadow-xs">
            <div>
              <span className="text-[10px] text-amber-900 uppercase tracking-wider font-bold flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-800" />
                Comprador / Titular Registrado
              </span>
              <strong className="text-sm font-bold text-zinc-950 block mt-0.5 font-serif">
                {cert.currentOwnerName || 'Ateliê Central (Em Estoque)'}
              </strong>
            </div>

            {cert.ownerCpf && (
              <div className="font-mono">
                <span className="text-[10px] text-amber-900 uppercase tracking-wider block font-bold">
                  CPF do Titular
                </span>
                <strong className="text-amber-950 font-bold text-xs">
                  {cert.ownerCpf}
                </strong>
              </div>
            )}
          </div>

          {/* Specifications Grid */}
          <div className="space-y-3 text-left">
            <h3 className="font-serif text-sm font-bold text-zinc-950 uppercase tracking-wider border-b border-amber-800/30 pb-1.5">
              Especificações Técnicas da Joia
            </h3>

            {(() => {
              const hasWidth = Boolean(cert.widthCm && Number(cert.widthCm) > 0);
              return (
                <div className={`grid ${hasWidth ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5' : 'grid-cols-2 sm:grid-cols-4'} gap-3.5 text-xs`}>
                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                    <span className="text-[10px] text-zinc-500 font-bold block uppercase tracking-wider">Metal Nobre:</span>
                    <strong className="text-zinc-950 font-bold text-xs block mt-0.5">{cert.metalPurity}</strong>
                  </div>

                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                    <span className="text-[10px] text-zinc-500 font-bold block uppercase tracking-wider">Coloração da Liga:</span>
                    <strong className="text-zinc-950 font-bold text-xs block mt-0.5">{cert.metalColor}</strong>
                  </div>

                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                    <span className="text-[10px] text-zinc-500 font-bold block uppercase tracking-wider">Peso Bruto:</span>
                    <strong className="text-zinc-950 font-bold text-xs block mt-0.5">{cert.grossWeightGrams} gramas</strong>
                  </div>

                  {hasWidth && (
                    <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                      <span className="text-[10px] text-zinc-500 font-bold block uppercase tracking-wider">Largura da Peça:</span>
                      <strong className="text-zinc-950 font-bold text-xs block mt-0.5">{cert.widthCm} cm</strong>
                    </div>
                  )}

                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                    <span className="text-[10px] text-zinc-500 font-bold block uppercase tracking-wider">Acabamento:</span>
                    <strong className="text-zinc-950 font-bold text-xs block mt-0.5">{cert.finish}</strong>
                  </div>
                </div>
              );
            })()}

            {/* Gemstones Details */}
            {cert.hasStones && cert.stones.length > 0 && (
              <div className="pt-2">
                <span className="text-xs font-bold text-zinc-950 block mb-2">Análise Gemológica:</span>
                <table className="w-full text-left text-xs border border-zinc-200 bg-white rounded-xl overflow-hidden shadow-xs">
                  <thead className="bg-zinc-100 text-zinc-950 font-bold">
                    <tr>
                      <th className="p-2.5 border-b border-zinc-200">Gema</th>
                      <th className="p-2.5 border-b border-zinc-200">Qtd</th>
                      <th className="p-2.5 border-b border-zinc-200">Carats</th>
                      <th className="p-2.5 border-b border-zinc-200">Lapidação</th>
                      <th className="p-2.5 border-b border-zinc-200">Cor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 text-zinc-900">
                    {cert.stones.map((s, idx) => (
                      <tr key={idx} className="hover:bg-zinc-50/50">
                        <td className="p-2.5 font-bold text-zinc-950">{s.type}</td>
                        <td className="p-2.5 font-mono text-zinc-800">{s.quantity}x</td>
                        <td className="p-2.5 font-bold font-mono text-zinc-950">{s.caratWeight > 0 ? `${s.caratWeight} ct` : '-'}</td>
                        <td className="p-2.5 text-zinc-800">{s.cutShape}</td>
                        <td className="p-2.5 text-zinc-800">{s.colorGrade || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Bottom Stamp & QR Code */}
          <div className="pt-6 border-t-2 border-amber-800/30 flex flex-col sm:flex-row items-center justify-between gap-6 text-left">
            
            {/* Stamp Seal */}
            <div className="flex items-center gap-4">
              {qrUrl && (
                <img src={qrUrl} alt="QR" className="w-24 h-24 p-1 bg-white border border-zinc-300 rounded-xl shadow-xs" />
              )}
              <div className="text-xs text-zinc-900 space-y-1">
                <span className="font-bold flex items-center gap-1 text-emerald-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  Selo de Garantia Vitalícia
                </span>
                <p className="text-[10px] text-zinc-600 max-w-xs leading-tight">
                  Escaneie o código QR ao lado para consultar o passaporte digital interativo e histórico de manutenção.
                </p>
                <span className="text-[10px] font-mono text-zinc-500 block truncate max-w-xs">
                  Hash: {cert.authenticityHash}
                </span>
              </div>
            </div>

            {/* Signature Line */}
            <div className="text-center space-y-2 min-w-[200px]">
              <div className="border-b-2 border-zinc-900 w-48 mx-auto" />
              <span className="text-xs font-serif font-bold block text-zinc-950">Estilo Raro Joias</span>
              <span className="text-[10px] text-zinc-500 block">Ateliê Central {cert.manufacturer}</span>
            </div>

          </div>

        </div>

      </div>
    </div>
  </div>
  );
};



