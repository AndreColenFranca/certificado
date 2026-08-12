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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in text-zinc-100">
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-5 overflow-hidden">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition-colors cursor-pointer"
          title="Fechar modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3.5 border-b border-zinc-800 pb-4">
          <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/30 text-red-400 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-bold text-red-500 font-serif">Excluir Cadastro do Cliente</h3>
            <p className="text-xs text-zinc-400">Confirmar exclusão permanente do cadastro</p>
          </div>
        </div>

        <div className="space-y-3.5 bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-left">
          <p className="text-sm text-zinc-200 leading-relaxed">
            Tem certeza que deseja remover o cadastro de <strong className="text-black font-bold bg-white px-2 py-0.5 rounded-md inline-block shadow-sm">{customerToDelete.name}</strong>?
          </p>
          
          <div className="text-xs font-mono text-zinc-300 bg-zinc-900 p-2.5 rounded-lg border border-zinc-800">
            CPF: {customerToDelete.cpf} • E-mail: {customerToDelete.email}
          </div>

          {piecesCount > 0 && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-red-400 font-bold text-sm border-b border-red-500/20 pb-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span className="text-red-400 font-bold">Exclusão de Passaportes Vinculados</span>
              </div>
              
              <p className="text-xs text-zinc-200 leading-relaxed">
                Este cliente possui <span className="inline-block px-2 py-0.5 mx-1 rounded bg-zinc-900 border border-amber-500/40 text-amber-300 font-bold text-xs">{piecesCount} passaporte(s) / joia(s)</span> vinculado(s).
              </p>

              <div className="p-3 bg-red-950/90 border border-red-500/50 rounded-lg text-xs text-white leading-relaxed">
                Ao confirmar a exclusão do cliente, <strong className="text-white font-extrabold underline underline-offset-2 decoration-white">todos os seus passaportes digitais também serão excluídos permanentemente</strong> do sistema.
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              onConfirmDelete(customerToDelete.id);
              onClose();
            }}
            className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Confirmar Exclusão</span>
          </button>
        </div>
      </div>
    </div>
  );
};


