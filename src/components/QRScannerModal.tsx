import React, { useState } from 'react';
import { JewelryCertificate } from '../types';
import { X, QrCode, Search, Camera, Sparkles, CheckCircle2 } from 'lucide-react';
import { findCertificateByQuery, extractCertIdFromInput } from '../utils/certUtils';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificates: JewelryCertificate[];
  onSelectCert: (cert: JewelryCertificate, tab?: 'photo-inspector' | 'specs' | 'certificate' | 'history' | 'care') => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  certificates,
  onSelectCert
}) => {
  if (!isOpen) return null;

  const [inputCode, setInputCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isScanningSim, setIsScanningSim] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;

    const found = findCertificateByQuery(certificates, inputCode);

    if (found) {
      if (typeof window !== 'undefined') {
        window.history.pushState(null, '', `/cert/${encodeURIComponent(found.id)}?type=certificate`);
      }
      onSelectCert(found, 'certificate');
      onClose();
    } else {
      const extracted = extractCertIdFromInput(inputCode) || inputCode;
      setErrorMsg(`Nenhum certificado encontrado para o código ou link: "${extracted}"`);
    }
  };

  const handleSimulateScan = (cert: JewelryCertificate) => {
    setIsScanningSim(true);
    setTimeout(() => {
      setIsScanningSim(false);
      if (typeof window !== 'undefined') {
        window.history.pushState(null, '', `/cert/${encodeURIComponent(cert.id)}?type=certificate`);
      }
      onSelectCert(cert, 'certificate');
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-zinc-950 border border-amber-900/50 rounded-3xl shadow-2xl overflow-hidden p-6 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-900/40 pb-4">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-amber-400" />
            <h2 className="font-serif text-lg font-bold text-amber-100">
              Verificador & Leitor de QR Code
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-amber-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Visualizer Box */}
        <div className="relative bg-zinc-900 rounded-2xl border-2 border-dashed border-amber-500/40 p-6 flex flex-col items-center justify-center min-h-[220px] text-center space-y-3 overflow-hidden group">
          
          {/* Animated Scanning Laser Line */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_15px_#f59e0b] animate-bounce" />

          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
            <Camera className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold text-amber-200 block">
              Aproxime o QR Code da Tag da Joia
            </span>
            <p className="text-[11px] text-zinc-400 max-w-xs">
              Aponte a câmera para a etiqueta física ou código impresso no certificado para carregar instantaneamente o passaporte da joia.
            </p>
          </div>
        </div>

        {/* Code Manual Search */}
        <form onSubmit={handleSearch} className="space-y-3 text-xs">
          <label className="block text-zinc-400 font-medium">Ou digite o ID do Certificado / N° de Série:</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ex: CERT-2026-A8F9 ou SN-18K-99042"
              value={inputCode}
              onChange={(e) => {
                setInputCode(e.target.value);
                setErrorMsg('');
              }}
              className="flex-1 p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-amber-100 focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-zinc-950 font-bold rounded-xl flex items-center gap-1.5 shrink-0"
            >
              <Search className="w-4 h-4" />
              <span>Verificar</span>
            </button>
          </div>

          {errorMsg && (
            <p className="text-red-400 text-[11px] font-medium pt-1">{errorMsg}</p>
          )}
        </form>

        {/* Demo Fast Selector list */}
        <div className="space-y-2 pt-2 border-t border-zinc-900">
          <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block">
            Ou selecione uma joia para simular a leitura do QR Code:
          </span>

          <div className="max-h-44 overflow-y-auto space-y-2 pr-1">
            {certificates.map((c) => (
              <button
                key={c.id}
                onClick={() => handleSimulateScan(c)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800/80 hover:border-amber-500/40 text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <img src={c.images[0]} alt={c.title} className="w-8 h-8 rounded object-cover border border-zinc-700" />
                  <div>
                    <span className="font-bold text-amber-200 text-xs block">{c.title}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">{c.id} • {c.metalPurity}</span>
                  </div>
                </div>

                <Sparkles className="w-4 h-4 text-amber-400" />
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
