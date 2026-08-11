import React, { useState } from 'react';
import { JewelryCertificate } from '../types';
import { X, Wrench, Calendar, CheckCircle2 } from 'lucide-react';

interface MaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  cert: JewelryCertificate | null;
  onAddMaintenance: (certId: string, record: any) => void;
}

export const MaintenanceModal: React.FC<MaintenanceModalProps> = ({
  isOpen,
  onClose,
  cert,
  onAddMaintenance
}) => {
  if (!isOpen || !cert) return null;

  const [serviceType, setServiceType] = useState<'Inspeção de Qualidade' | 'Polimento & Banho' | 'Ajuste de Aro' | 'Substituição de Garra' | 'Limpeza Ultrassônica'>('Polimento & Banho');
  const [preferredDate, setPreferredDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord = {
      id: `m-${Date.now()}`,
      date: preferredDate,
      type: serviceType,
      performer: cert.manufacturer,
      notes: notes || `Solicitação de ${serviceType} agendada pelo cliente.`,
      verifiedByAppraiser: 'Atelier de Assistência Técnica'
    };

    onAddMaintenance(cert.id, newRecord);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-zinc-950 border border-amber-900/50 rounded-3xl shadow-2xl p-6 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-900/40 pb-4">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-amber-400" />
            <h2 className="font-serif text-lg font-bold text-amber-100">
              Solicitar Assistência & Manutenção
            </h2>
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
            <h3 className="text-lg font-bold text-amber-200">Solicitação Confirmada!</h3>
            <p className="text-xs text-zinc-400 max-w-xs mx-auto">
              O agendamento de manutenção para a joia <strong className="text-amber-300">{cert.title}</strong> foi enviado ao atelier e registrado no histórico do certificado.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs text-zinc-200">
            
            <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 space-y-1">
              <span className="text-zinc-500 text-[10px] block font-semibold">Peça Selecionada:</span>
              <p className="font-bold text-amber-300">{cert.title}</p>
              <p className="text-[10px] text-zinc-400 font-mono">ID: {cert.id} • Garantia {cert.warrantyStatus}</p>
            </div>

            <div>
              <label className="block text-zinc-400 mb-1">Tipo de Serviço Solicitado</label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value as any)}
                className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-amber-100 focus:outline-none focus:border-amber-500"
              >
                <option value="Polimento & Banho">Polimento & Banho de Ródio / Brilho</option>
                <option value="Limpeza Ultrassônica">Limpeza Ultrassônica Profissional</option>
                <option value="Inspeção de Qualidade">Inspeção e Aperto de Garras</option>
                <option value="Ajuste de Aro">Ajuste de Aro do Anel</option>
                <option value="Substituição de Garra">Reparo de Estrutura</option>
              </select>
            </div>

            <div>
              <label className="block text-zinc-400 mb-1">Data Preferencial de Atendimento</label>
              <input
                type="date"
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-amber-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-zinc-400 mb-1">Observações ou Necessidades Específicas</label>
              <textarea
                rows={3}
                placeholder="Descreva detalhes como arranhões superficiais, ajuste de tamanho desejado, etc..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-amber-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-zinc-950 font-bold rounded-xl shadow-lg transition-all"
            >
              Confirmar Agendamento de Manutenção
            </button>

          </form>
        )}

      </div>
    </div>
  );
};
