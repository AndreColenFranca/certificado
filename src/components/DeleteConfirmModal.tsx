import React from 'react';
import { Trash2, AlertTriangle, X, ShieldAlert, UserCheck } from 'lucide-react';
import { JewelryCertificate } from '../types';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  certToDelete: JewelryCertificate | null;
  onConfirmDelete: (id: string) => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  certToDelete,
  onConfirmDelete
}) => {
  if (!isOpen || !certToDelete) return null;

  const linkedCustomerName = certToDelete.currentOwnerName?.trim();
  const linkedCpf = certToDelete.ownerCpf?.trim();
  const linkedOwnerId = certToDelete.ownerId?.trim();
  const linkedEmail = certToDelete.ownerEmail?.trim();

  const isCustomerLinked = Boolean(
    (linkedCustomerName && linkedCustomerName.length > 0 && linkedCustomerName.toLowerCase() !== 'sem proprietário') ||
    (linkedCpf && linkedCpf.length > 0) ||
    (linkedOwnerId && linkedOwnerId.length > 0) ||
    (linkedEmail && linkedEmail.length > 0)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className={`bg-zinc-950 border ${isCustomerLinked ? 'border-amber-500/50' : 'border-red-500/40'} rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative space-y-6 text-center`}>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-zinc-900 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        {isCustomerLinked ? (
          <div className="w-16 h-16 rounded-2xl bg-amber-950/80 border-2 border-amber-500/80 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-950/50">
            <ShieldAlert className="w-8 h-8" />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-red-950/60 border-2 border-red-500/50 text-red-400 flex items-center justify-center mx-auto shadow-lg shadow-red-950/50">
            <Trash2 className="w-8 h-8" />
          </div>
        )}

        {/* Modal Info */}
        <div className="space-y-2">
          <h2 className={`text-xl font-bold font-serif ${isCustomerLinked ? 'text-amber-300' : 'text-red-200'}`}>
            {isCustomerLinked ? 'Exclusão Proibida' : 'Excluir Certificado de Joia?'}
          </h2>
          {isCustomerLinked ? (
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-left space-y-2">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                <UserCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Cliente Vinculado: {linkedCustomerName || 'Cadastrado'}</span>
              </div>
              {linkedCpf && (
                <p className="text-[11px] text-zinc-400 font-mono">
                  CPF: {linkedCpf}
                </p>
              )}
              <p className="text-xs text-amber-100/90 leading-relaxed pt-1">
                Não é permitido excluir uma joia/certificado enquanto houver um cliente vinculado. Esta regra protege o histórico de propriedade e a validade jurídica da garantia.
              </p>
            </div>
          ) : (
            <p className="text-xs text-zinc-400 leading-relaxed">
              Esta ação é irreversível. O certificado e histórico digital de <strong className="text-amber-200">"{certToDelete.title}"</strong> (ID: {certToDelete.id}) serão removidos permanentemente.
            </p>
          )}
        </div>

        {/* Thumbnail preview */}
        <div className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800 flex items-center gap-3 text-left">
          {certToDelete.images && certToDelete.images.length > 0 ? (
            <img 
              src={certToDelete.images[0]} 
              alt={certToDelete.title} 
              className="w-12 h-12 rounded-xl object-cover border border-zinc-700 shrink-0" 
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-500 shrink-0">
              <Trash2 className="w-5 h-5 text-zinc-600" />
            </div>
          )}
          <div className="overflow-hidden">
            <span className="font-bold text-amber-200 text-xs block truncate">{certToDelete.title}</span>
            <span className="text-[10px] text-zinc-400 font-mono block">N° Série: {certToDelete.serialNumber}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          {isCustomerLinked ? (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer"
            >
              Entendido / Fechar
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() => {
                  onConfirmDelete(certToDelete.id);
                  onClose();
                }}
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-red-900/40 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                id="btn-confirm-delete"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sim, Excluir Joia</span>
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
};
