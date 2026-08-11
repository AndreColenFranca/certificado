import React from 'react';
import { Customer } from '../types';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface CustomerDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerToDelete: Customer | null;
  onConfirmDelete: (id: string) => void;
  piecesCount?: number;
}

export const CustomerDeleteModal: React.FC<CustomerDeleteModalProps> = ({
  isOpen,
  onClose,
  customerToDelete,
  onConfirmDelete,
  piecesCount = 0
}) => {
  if (!isOpen || !customerToDelete) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-zinc-900 border border-rose-900/60 rounded-2xl shadow-2xl overflow-hidden text-amber-50">
        <div className="p-6 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-amber-100">Excluir Cadastro do Cliente?</h3>
            <p className="text-sm text-zinc-300 mt-2">
              Tem certeza que deseja remover o cadastro de <strong className="text-amber-200">{customerToDelete.name}</strong> (CPF: {customerToDelete.cpf})?
            </p>
            {piecesCount > 0 && (
              <div className="mt-3 p-3 bg-amber-950/40 border border-amber-800/40 rounded-xl text-xs text-amber-300 text-left">
                <strong>Atenção:</strong> Este cliente possui <strong>{piecesCount} peça(s)</strong> vinculada(s). Os certificados permanecerão registrados no sistema, porém o titular será desvinculado.
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                onConfirmDelete(customerToDelete.id);
                onClose();
              }}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/50 transition-all flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>Confirmar Exclusão</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
