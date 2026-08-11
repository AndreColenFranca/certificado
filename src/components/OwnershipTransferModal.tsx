import React, { useState } from 'react';
import { JewelryCertificate, Customer } from '../types';
import { X, ArrowRightLeft, ShieldCheck, CheckCircle2, User, Users, CreditCard, Mail } from 'lucide-react';

interface OwnershipTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  cert: JewelryCertificate | null;
  customers?: Customer[];
  onTransferOwner: (certId: string, newOwnerName: string, ownerCpf?: string, ownerEmail?: string, ownerId?: string) => void;
}

export const OwnershipTransferModal: React.FC<OwnershipTransferModalProps> = ({
  isOpen,
  onClose,
  cert,
  customers = [],
  onTransferOwner
}) => {
  if (!isOpen || !cert) return null;

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newOwnerCpf, setNewOwnerCpf] = useState('');
  const [newOwnerEmail, setNewOwnerEmail] = useState('');
  const [transferCode, setTransferCode] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleCustomerSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const custId = e.target.value;
    setSelectedCustomerId(custId);
    if (custId) {
      const found = customers.find(c => c.id === custId);
      if (found) {
        setNewOwnerName(found.name);
        setNewOwnerCpf(found.cpf);
        setNewOwnerEmail(found.email);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOwnerName.trim()) return;

    onTransferOwner(
      cert.id, 
      newOwnerName.trim(), 
      newOwnerCpf.trim() || undefined, 
      newOwnerEmail.trim() || undefined, 
      selectedCustomerId || undefined
    );
    
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-zinc-950 border border-amber-900/50 rounded-3xl shadow-2xl p-6 space-y-6 text-amber-50">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-900/40 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-amber-100">
                Transferir Titularidade do Certificado
              </h2>
              <p className="text-xs text-zinc-400">Atualize o proprietário legal da peça no acervo</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-amber-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <h3 className="text-lg font-bold text-amber-200">Transferência Concluída!</h3>
            <p className="text-xs text-zinc-400 max-w-xs mx-auto">
              O passaporte digital da joia <strong className="text-amber-300">{cert.title}</strong> foi transferido com sucesso para <strong className="text-amber-300">{newOwnerName}</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs text-zinc-200">
            
            <div className="p-3.5 bg-zinc-900 rounded-xl border border-zinc-800 space-y-1">
              <span className="text-zinc-500 text-[10px] block font-semibold">Titular Atual Registrado:</span>
              <p className="font-bold text-amber-300 flex items-center gap-1.5 text-sm">
                <User className="w-4 h-4 text-amber-400" />
                {cert.currentOwnerName || 'Sem titular cadastrado'}
              </p>
            </div>

            {/* Select existing customer if available */}
            {customers.length > 0 && (
              <div>
                <label className="block text-amber-200 font-semibold mb-1 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-amber-400" />
                  <span>Selecionar do Cadastro de Clientes</span>
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={handleCustomerSelect}
                  className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-amber-100 focus:outline-none focus:border-amber-500 text-xs"
                >
                  <option value="">-- Selecionar Cliente Cadastrado (ou digitar manualmente abaixo) --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} - CPF: {c.cpf} ({c.email})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-zinc-300 font-semibold mb-1">Nome Completo do Novo Proprietário *</label>
              <input
                type="text"
                required
                placeholder="Ex: Dra. Beatriz Montebello"
                value={newOwnerName}
                onChange={(e) => setNewOwnerName(e.target.value)}
                className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-amber-100 focus:outline-none focus:border-amber-500 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-400 mb-1">CPF do Novo Proprietário</label>
                <input
                  type="text"
                  placeholder="999.999.999-99"
                  value={newOwnerCpf}
                  onChange={(e) => setNewOwnerCpf(e.target.value)}
                  className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-amber-100 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-zinc-400 mb-1">E-mail de Contato</label>
                <input
                  type="email"
                  placeholder="cliente@exemplo.com"
                  value={newOwnerEmail}
                  onChange={(e) => setNewOwnerEmail(e.target.value)}
                  className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-amber-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-zinc-400 mb-1">Código de Segurança do Certificado (Opcional)</label>
              <input
                type="text"
                placeholder="Ex: AUTH-8890-SEC"
                value={transferCode}
                onChange={(e) => setTransferCode(e.target.value)}
                className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-amber-100 focus:outline-none focus:border-amber-500"
              />
              <span className="text-[10px] text-zinc-500 mt-1 block">
                Garante que a transferência seja assinada e validada no histórico do servidor.
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-zinc-950 font-bold rounded-xl shadow-lg transition-all text-sm mt-2"
            >
              Assinar & Transferir Certificado Digital
            </button>

          </form>
        )}

      </div>
    </div>
  );
};
