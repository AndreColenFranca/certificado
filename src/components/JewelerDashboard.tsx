import React, { useState } from 'react';
import { JewelryCertificate } from '../types';
import { formatImageUrl } from '../utils/imageUtils';
import { isRootCert, isChildCert, getChildCertificatesForParent } from '../utils/certHierarchy';
import {
  PlusCircle,
  Search,
  Printer,
  Trash2,
  Edit3,
  ShieldCheck,
  Layers,
  DollarSign,
  Gem,
  Filter,
  FileText,
  Award,
  Sparkles,
  UserPlus,
  ArrowRightLeft,
  Users
} from 'lucide-react';

interface JewelerDashboardProps {
  certificates: JewelryCertificate[];
  onSelectCertificate: (cert: JewelryCertificate, tab?: 'photo-inspector' | 'specs' | 'history' | 'care') => void;
  onOpenCreateModal: () => void;
  onOpenPrintModal: (cert: JewelryCertificate) => void;
  onDeleteCertificate: (cert: JewelryCertificate) => void;
  onEditCertificate: (cert: JewelryCertificate) => void;
  onOpenCompanyLogoModal?: () => void;
  onOpenLinkCustomerModal?: (cert?: JewelryCertificate) => void;
  onOpenQueryCustomersModal?: (cert?: JewelryCertificate) => void;
}

export const JewelerDashboard: React.FC<JewelerDashboardProps> = ({
  certificates,
  onSelectCertificate,
  onOpenCreateModal,
  onOpenPrintModal,
  onDeleteCertificate,
  onEditCertificate,
  onOpenCompanyLogoModal,
  onOpenLinkCustomerModal,
  onOpenQueryCustomersModal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMetalFilter, setSelectedMetalFilter] = useState<string>('todos');
  const [selectedCollectionFilter, setSelectedCollectionFilter] = useState<string>('todas');

  // Strictly separate Root/Parent catalog items from Child certificates
  const rootCertificates = certificates.filter(isRootCert);
  const childCertificates = certificates.filter(isChildCert);

  // Metrics Calculations
  const totalRootCertificates = rootCertificates.length;
  const totalChildIssued = childCertificates.length;
  const totalValueBRL = rootCertificates.reduce((acc, c) => acc + (c.estimatedValueBRL || 0), 0);
  
  const collectionsList = Array.from(new Set(rootCertificates.map(c => c.collection)));

  // Filtered list of Root/Parent certificates for "Cadastro de Joias"
  const filteredCertificates = rootCertificates.filter(c => {
    const matchesSearch = 
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.manufacturer.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesMetal = selectedMetalFilter === 'todos' || c.metalPurity.includes(selectedMetalFilter);
    const matchesCollection = selectedCollectionFilter === 'todas' || c.collection === selectedCollectionFilter;

    return matchesSearch && matchesMetal && matchesCollection;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" id="jeweler-dashboard-view">
      
      {/* Dashboard Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/90 border border-amber-900/40 p-6 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Ateliê & Fabricante
            </span>
            <span className="text-xs text-zinc-400">Cadastro de Joias Pai / Matrizes</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-amber-100 mt-1">
            Cadastro e Acervo de Joias (Joias Pai / Raiz)
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Exibindo os modelos originais do acervo. As Joias Pai são a base para a emissão das Joias Filhas dos clientes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onOpenCreateModal}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-2 shadow-lg transition-transform hover:scale-105 cursor-pointer"
            id="btn-create-new-cert"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Cadastrar Nova Joia Pai</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-zinc-900/80 border border-amber-900/40 p-5 rounded-2xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-medium">Modelos Pai / Raiz</span>
            <Award className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-amber-100">{totalRootCertificates}</p>
          <span className="text-[10px] text-zinc-500">1 Joia Pai principal por modelo</span>
        </div>

        <div className="bg-zinc-900/80 border border-amber-900/40 p-5 rounded-2xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-medium">Joias Filhas Emitidas</span>
            <Users className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-amber-300">{totalChildIssued}</p>
          <span className="text-[10px] text-zinc-500">Passaportes vinculados a clientes</span>
        </div>

        <div className="bg-zinc-900/80 border border-amber-900/40 p-5 rounded-2xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-medium">Patrimônio Certificado</span>
            <DollarSign className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-emerald-300">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(totalValueBRL)}
          </p>
          <span className="text-[10px] text-zinc-500">Valor total estimado no acervo</span>
        </div>

        <div className="bg-zinc-900/80 border border-amber-900/40 p-5 rounded-2xl space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-medium">Coleções Ativas</span>
            <Layers className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-amber-300">{collectionsList.length}</p>
          <span className="text-[10px] text-zinc-500">Linhas de catálogo registradas</span>
        </div>

      </div>

      {/* Filter & Search Bar */}
      <div className="bg-zinc-900/80 border border-amber-900/40 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        
        {/* Search input */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Buscar joia pai por título, ID ou série..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-amber-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
            id="dash-search-input"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
        </div>

        {/* Filter selectors */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-zinc-400">
            <Filter className="w-3.5 h-3.5 text-amber-400" />
            <span>Filtros:</span>
          </div>

          <select
            value={selectedMetalFilter}
            onChange={(e) => setSelectedMetalFilter(e.target.value)}
            className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-amber-200 focus:outline-none focus:border-amber-500"
            id="dash-filter-metal"
          >
            <option value="todos">Todos os Metais</option>
            <option value="18K">Ouro 18K</option>
            <option value="14K">Ouro 14K</option>
            <option value="Platina">Platina</option>
            <option value="Prata">Prata</option>
          </select>

          <select
            value={selectedCollectionFilter}
            onChange={(e) => setSelectedCollectionFilter(e.target.value)}
            className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-amber-200 focus:outline-none focus:border-amber-500"
            id="dash-filter-collection"
          >
            <option value="todas">Todas as Coleções</option>
            {collectionsList.map(col => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Certificates Table */}
      <div className="bg-zinc-900/90 border border-amber-900/40 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-amber-900/40 text-amber-400 font-semibold uppercase tracking-wider bg-zinc-950/80">
                <th className="p-4">Peça</th>
                <th className="p-4">Certificado / SN</th>
                <th className="p-4">Teor do Metal</th>
                <th className="p-4">Certificados Emitidos</th>
                <th className="p-4">Coleção / Marca</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {filteredCertificates.map((cert) => {
                const childCerts = getChildCertificatesForParent(cert, certificates);
                return (
                  <tr key={cert.id} className="hover:bg-zinc-800/50 transition-colors text-zinc-200">
                    
                    {/* Title & Image */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-black border border-zinc-800 p-0.5 shrink-0 overflow-hidden relative">
                          {cert.images?.[0] ? (
                            <img
                              src={formatImageUrl(cert.images[0])}
                              alt={cert.title}
                              className="w-full h-full object-cover rounded"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                              <Gem className="w-6 h-6 text-zinc-600" />
                            </div>
                          )}
                        </div>
                        <div>
                          <span 
                            onClick={() => onSelectCertificate(cert)}
                            className="font-bold text-amber-200 hover:text-amber-100 hover:underline cursor-pointer text-sm block"
                          >
                            {cert.title}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* ID & Serial */}
                    <td className="p-4 font-mono">
                      <span className="block font-semibold text-amber-300">{cert.id}</span>
                      <span className="text-[10px] text-zinc-500">{cert.serialNumber}</span>
                    </td>

                    {/* Metal */}
                    <td className="p-4">
                      <span className="font-semibold text-zinc-300">{cert.metalPurity}</span>
                    </td>

                    {/* Child Certificates issued count */}
                    <td className="p-4">
                      {childCerts.length > 0 ? (
                        <div 
                          onClick={() => onOpenQueryCustomersModal && onOpenQueryCustomersModal(cert)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-semibold cursor-pointer hover:bg-amber-500/20 transition-colors"
                          title="Clique para ver todos os certificados emitidos"
                        >
                          <Users className="w-3.5 h-3.5 text-amber-400" />
                          <span>{childCerts.length} Certificado(s) Emitido(s)</span>
                        </div>
                      ) : (
                        <span className="text-zinc-500 italic text-[11px]">Nenhum certificado emitido</span>
                      )}
                    </td>

                    {/* Collection */}
                    <td className="p-4">
                      <span className="text-zinc-300 block">{cert.collection}</span>
                      <span className="text-[10px] text-zinc-500">{cert.manufacturer}</span>
                    </td>

                    {/* Action buttons */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {onOpenQueryCustomersModal && (
                          <button
                            onClick={() => onOpenQueryCustomersModal(cert)}
                            className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-colors"
                            title="Consultar Joia Pai e exibir todas as Joias Filhas dos clientes"
                            id={`btn-query-cust-${cert.id}`}
                          >
                            <Users className="w-4 h-4" />
                          </button>
                        )}

                        {onOpenLinkCustomerModal && (
                          <button
                            onClick={() => onOpenLinkCustomerModal(cert)}
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-300 transition-colors"
                            title="Emitir/Vincular nova Joia Filha a um Cliente"
                            id={`btn-link-cust-${cert.id}`}
                          >
                            <UserPlus className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => onOpenPrintModal(cert)}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-300 transition-colors cursor-pointer"
                          title="Imprimir Ficha de Matriz"
                          id={`btn-print-${cert.id}`}
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onEditCertificate(cert)}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                          title="Editar Joia Pai"
                          id={`btn-edit-${cert.id}`}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onDeleteCertificate(cert)}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-900/60 text-zinc-400 hover:text-red-300 transition-colors"
                          title="Excluir Joia Pai"
                          id={`btn-delete-${cert.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })}

              {filteredCertificates.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-500">
                    Nenhuma Joia Pai / Modelo Base encontrada para os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

