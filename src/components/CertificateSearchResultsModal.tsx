import React from 'react';
import { JewelryCertificate } from '../types';
import { X, User, Gem } from 'lucide-react';
import { formatImageUrl } from '../utils/imageUtils';

interface CertificateSearchResultsModalProps {
  isOpen: boolean;
  results: JewelryCertificate[];
  query: string;
  onClose: () => void;
  onSelectCertificate: (cert: JewelryCertificate) => void;
}

export const CertificateSearchResultsModal: React.FC<CertificateSearchResultsModalProps> = ({
  isOpen,
  results,
  query,
  onClose,
  onSelectCertificate
}) => {
  if (!isOpen || results.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in text-amber-50">
      <div className="relative w-full max-w-2xl bg-zinc-950 border border-amber-900/60 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-900/40 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Gem className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-amber-100">
                Passaportes Encontrados
              </h2>
              <p className="text-xs text-zinc-400">
                Múltiplos certificados correspondem à sua busca. Selecione um para visualizar.
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

        {/* Search Query Info */}
        <div className="bg-zinc-900/60 border border-amber-900/40 rounded-xl p-4">
          <p className="text-sm text-zinc-400">
            <span className="font-semibold text-amber-200">Busca por:</span> "{query}"
          </p>
          <p className="text-sm text-amber-300 font-semibold mt-2">
            {results.length} passaporte(s) encontrado(s)
          </p>
        </div>

        {/* Results List */}
        <div className="space-y-3">
          {results.map((cert) => (
            <button
              key={cert.id}
              onClick={() => {
                onSelectCertificate(cert);
                onClose();
              }}
              className="w-full text-left p-4 rounded-2xl bg-zinc-900/70 border border-amber-900/50 hover:border-amber-500/70 hover:bg-zinc-900 transition-all shadow-lg group cursor-pointer"
            >
              <div className="flex gap-4">
                {/* Image */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-black border border-zinc-800 p-1 shrink-0 overflow-hidden">
                  {cert.images && cert.images.length > 0 ? (
                    <img
                      src={formatImageUrl(cert.images[0])}
                      alt={cert.title}
                      className="w-full h-full object-cover rounded"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                      <Gem className="w-8 h-8 text-amber-500/50" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="font-bold text-amber-100 font-serif text-lg truncate group-hover:text-amber-50">
                        {cert.title}
                      </h3>
                      <p className="text-xs text-zinc-400">{cert.collection}</p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 whitespace-nowrap shrink-0">
                      {cert.isRoot ? 'Joia Pai' : 'Passaporte'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {cert.certCode && (
                      <div>
                        <span className="text-zinc-500 text-[10px]">Código</span>
                        <p className="font-mono text-amber-300">{cert.certCode}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-zinc-500 text-[10px]">Série</span>
                      <p className="font-mono text-amber-300">{cert.serialNumber}</p>
                    </div>
                    {cert.currentOwnerName && (
                      <div className="col-span-2">
                        <span className="text-zinc-500 text-[10px] flex items-center gap-1">
                          <User className="w-3 h-3" /> Proprietário
                        </span>
                        <p className="text-zinc-200 truncate">{cert.currentOwnerName}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Footer Info */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-center">
          <p className="text-xs text-amber-200">
            Clique em qualquer certificado para visualizar seu passaporte digital completo
          </p>
        </div>
      </div>
    </div>
  );
};
