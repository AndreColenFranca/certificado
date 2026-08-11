import React, { useState, useEffect } from 'react';
import { JewelryCertificate, StoneDetail, Customer } from '../types';
import { X, Sparkles, Plus, Trash2, Edit3, Check, Upload, Loader2, Image as ImageIcon, Link as LinkIcon, GripVertical, ChevronLeft, ChevronRight, Star, Move, Users, CreditCard, Mail } from 'lucide-react';
import { formatImageUrl, DEFAULT_BRAND_LOGO_DRIVE_URL } from '../utils/imageUtils';

interface CertificateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cert: JewelryCertificate) => void;
  initialCert?: JewelryCertificate | null;
  onDelete?: (cert: JewelryCertificate) => void;
  customers?: Customer[];
  selectedCustomerForNewCert?: Customer | null;
}

const DEFAULT_PURITIES = ['18K (750)', '14K (585)', '10K (417)', '22K (916)', '24K (999)', 'Platina 950', 'Prata 925'];
const DEFAULT_COLORS = ['Ouro Amarelo', 'Ouro Branco', 'Ouro Rosa', 'Ouro Negro', 'Platina', 'Prata Prateada'];
const DEFAULT_COLLECTIONS = ['Haute Joaillerie 2026', 'Solitaires Prestige', 'Classic Diamonds', 'Coleção Romântica', 'Edição Limitada', 'Acervo Exclusivo'];
const DEFAULT_MANUFACTURERS = ['Maison Lumière Joias', 'Aureum Haute Joaillerie', 'Ateliê Orivesaria Fina', 'Ateliê & Fabricante', 'Lumière Joias Ateliê'];
const DEFAULT_FINISHES = ['Polido Espelhado', 'Escovado Satinado', 'Diamantado', 'Rodinado Premium', 'Fosco Texturizado', 'Martelado Hand-crafted'];
const DEFAULT_STONE_TYPES = ['Diamante Natural', 'Esmeralda Colombiana', 'Rubi Birmanês', 'Safira Ceylon', 'Diamante Lab-Grown', 'Pérola South Sea', 'Tanzanita', 'Ônix Natural', 'Turmalina Paraíba'];
const DEFAULT_SETTING_TYPES = ['Garra (Prong)', 'Garra Dupla', 'Pavê (Pave)', 'Bisel / Inglês (Bezel)', 'Trilho (Channel)', 'Invisível (Invisible)', 'Crivo / Ilha', 'Tensão (Tension)'];
const DEFAULT_CUT_SHAPES = ['Brilhante Redondo', 'Princesa (Quadrada)', 'Esmeralda', 'Oval', 'Gota / Pera', 'Marquise', 'Cushion', 'Coração', 'Radiante', 'Baguete'];
const DEFAULT_COLOR_GRADES = ['D - Incolor (Excepcional)', 'E - Incolor', 'F - Incolor', 'G-H - Quase Incolor', 'I-J - Amarelado Suave', 'Fancy Yellow', 'Fancy Blue', 'Gema Colorida Intensa', 'Não Aplicável'];
const DEFAULT_CLARITY_GRADES = ['FL (Flawless / Perfeito)', 'IF (Internally Flawless)', 'VVS1 (Muitíssimo Poucas Inclusões)', 'VVS2', 'VS1 (Poucas Inclusões)', 'VS2', 'SI1 (Pequenas Inclusões)', 'SI2', 'I1 (Inclusões Visíveis)', 'Não Aplicável'];

// Helper to compress local uploaded image for high-definition rendering
const compressAndResizeImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/png', 0.95);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Formato de imagem inválido'));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsDataURL(file);
  });
};

// Reusable component to Manage (Cadastrar, Alterar, Excluir) options for metal purities, colors, finishes & gem types
interface OptionManagerSelectProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: string[];
  onAddOption: (newOpt: string) => void;
  onEditOption: (oldOpt: string, newOpt: string) => void;
  onDeleteOption: (optToDelete: string) => void;
}

const OptionManagerSelect: React.FC<OptionManagerSelectProps> = ({
  label,
  value,
  onChange,
  options,
  onAddOption,
  onEditOption,
  onDeleteOption
}) => {
  const [mode, setMode] = useState<'select' | 'add' | 'edit'>('select');
  const [inputVal, setInputVal] = useState('');

  const handleStartAdd = () => {
    setInputVal('');
    setMode('add');
  };

  const handleStartEdit = () => {
    setInputVal(value);
    setMode('edit');
  };

  const handleSaveAdd = () => {
    const trimmed = inputVal.trim();
    if (trimmed) {
      onAddOption(trimmed);
      onChange(trimmed);
    }
    setMode('select');
  };

  const handleSaveEdit = () => {
    const trimmed = inputVal.trim();
    if (trimmed && trimmed !== value) {
      onEditOption(value, trimmed);
      onChange(trimmed);
    }
    setMode('select');
  };

  const handleDelete = () => {
    if (options.length <= 1) {
      alert('Você precisa ter pelo menos uma opção cadastrada.');
      return;
    }
    onDeleteOption(value);
  };

  return (
    <div className="flex flex-col justify-between h-full space-y-1">
      <div>
        <label className="block text-zinc-400 text-xs font-medium mb-0.5">{label}</label>

        {mode === 'select' && (
          <div className="flex items-center justify-start gap-1 flex-wrap pb-0.5 min-h-[24px]">
            <button
              type="button"
              onClick={handleStartAdd}
              className="px-1 py-0.5 rounded hover:bg-zinc-800 text-amber-400 text-[10px] flex items-center gap-0.5 transition-colors whitespace-nowrap"
              title="Cadastrar nova opção"
            >
              <Plus className="w-3 h-3" />
              <span>Cadastrar</span>
            </button>

            {options.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="px-1 py-0.5 rounded hover:bg-zinc-800 text-zinc-300 text-[10px] flex items-center gap-0.5 transition-colors whitespace-nowrap"
                  title="Alterar opção selecionada"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Alterar</span>
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-1 py-0.5 rounded hover:bg-red-950/60 text-red-400 text-[10px] flex items-center gap-0.5 transition-colors whitespace-nowrap"
                  title="Excluir opção selecionada"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Excluir</span>
                </button>
              </>
            )}
          </div>
        )}

        {mode === 'add' && (
          <div className="flex items-center gap-1.5 pt-0.5 min-h-[24px]">
            <input
              type="text"
              autoFocus
              placeholder={`Novo ${label}...`}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSaveAdd())}
              className="flex-1 p-2 bg-zinc-900 border border-amber-500/50 rounded-xl text-amber-100 text-xs focus:outline-none"
            />
            <button
              type="button"
              onClick={handleSaveAdd}
              className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-xs"
            >
              Salvar
            </button>
            <button
              type="button"
              onClick={() => setMode('select')}
              className="px-2 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {mode === 'edit' && (
          <div className="flex items-center gap-1.5 pt-0.5 min-h-[24px]">
            <input
              type="text"
              autoFocus
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSaveEdit())}
              className="flex-1 p-2 bg-zinc-900 border border-amber-500/50 rounded-xl text-amber-100 text-xs focus:outline-none"
            />
            <button
              type="button"
              onClick={handleSaveEdit}
              className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-xs"
            >
              Salvar
            </button>
            <button
              type="button"
              onClick={() => setMode('select')}
              className="px-2 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="mt-auto">
        {mode === 'select' && (
          <select
            value={value}
            onChange={(e) => {
              if (e.target.value === '__ADD_NEW__') {
                handleStartAdd();
              } else {
                onChange(e.target.value);
              }
            }}
            className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-amber-100 focus:outline-none focus:border-amber-500 text-xs"
          >
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
            <option value="__ADD_NEW__">+ Cadastrar Novo...</option>
          </select>
        )}
      </div>
    </div>
  );
};

export const CertificateFormModal: React.FC<CertificateFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialCert,
  onDelete,
  customers = [],
  selectedCustomerForNewCert
}) => {
  if (!isOpen) return null;

  const defaultCompanyName = localStorage.getItem('aureum_company_name') || 'Maison Lumière Joias';
  const defaultCompanyLogo = localStorage.getItem('aureum_company_logo_url') || '';

  // Custom Options Management State
  const [purityOptions, setPurityOptions] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('aureum_purities');
      return saved ? JSON.parse(saved) : DEFAULT_PURITIES;
    } catch { return DEFAULT_PURITIES; }
  });

  const [colorOptions, setColorOptions] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('aureum_colors');
      return saved ? JSON.parse(saved) : DEFAULT_COLORS;
    } catch { return DEFAULT_COLORS; }
  });

  const [collectionOptions, setCollectionOptions] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('aureum_collections');
      return saved ? JSON.parse(saved) : DEFAULT_COLLECTIONS;
    } catch { return DEFAULT_COLLECTIONS; }
  });

  const [manufacturerOptions, setManufacturerOptions] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('aureum_manufacturers');
      return saved ? JSON.parse(saved) : DEFAULT_MANUFACTURERS;
    } catch { return DEFAULT_MANUFACTURERS; }
  });

  const [finishOptions, setFinishOptions] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('aureum_finishes');
      return saved ? JSON.parse(saved) : DEFAULT_FINISHES;
    } catch { return DEFAULT_FINISHES; }
  });

  const [stoneTypeOptions, setStoneTypeOptions] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('aureum_stone_types');
      return saved ? JSON.parse(saved) : DEFAULT_STONE_TYPES;
    } catch { return DEFAULT_STONE_TYPES; }
  });

  const [settingTypeOptions, setSettingTypeOptions] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('aureum_setting_types');
      return saved ? JSON.parse(saved) : DEFAULT_SETTING_TYPES;
    } catch { return DEFAULT_SETTING_TYPES; }
  });

  const [cutShapeOptions, setCutShapeOptions] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('aureum_cut_shapes');
      return saved ? JSON.parse(saved) : DEFAULT_CUT_SHAPES;
    } catch { return DEFAULT_CUT_SHAPES; }
  });

  const [colorGradeOptions, setColorGradeOptions] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('aureum_color_grades');
      return saved ? JSON.parse(saved) : DEFAULT_COLOR_GRADES;
    } catch { return DEFAULT_COLOR_GRADES; }
  });

  const [clarityGradeOptions, setClarityGradeOptions] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('aureum_clarity_grades');
      return saved ? JSON.parse(saved) : DEFAULT_CLARITY_GRADES;
    } catch { return DEFAULT_CLARITY_GRADES; }
  });

  // Certificate Fields
  const [title, setTitle] = useState(initialCert?.title || '');
  const [collection, setCollection] = useState(initialCert?.collection || 'Haute Joaillerie 2026');
  const [model, setModel] = useState(initialCert?.model || 'Modelo V1');
  const [manufacturer, setManufacturer] = useState(initialCert?.manufacturer || defaultCompanyName);
  const [manufacturerLogoUrl, setManufacturerLogoUrl] = useState(
    initialCert?.manufacturerLogoUrl || defaultCompanyLogo || DEFAULT_BRAND_LOGO_DRIVE_URL
  );
  const [currentOwnerName, setCurrentOwnerName] = useState(initialCert?.currentOwnerName || selectedCustomerForNewCert?.name || '');
  const [ownerCpf, setOwnerCpf] = useState(initialCert?.ownerCpf || selectedCustomerForNewCert?.cpf || '');
  const [ownerEmail, setOwnerEmail] = useState(initialCert?.ownerEmail || selectedCustomerForNewCert?.email || '');
  const [ownerId, setOwnerId] = useState(initialCert?.ownerId || selectedCustomerForNewCert?.id || '');

  useEffect(() => {
    if (selectedCustomerForNewCert) {
      setCurrentOwnerName(selectedCustomerForNewCert.name);
      setOwnerCpf(selectedCustomerForNewCert.cpf);
      setOwnerEmail(selectedCustomerForNewCert.email);
      setOwnerId(selectedCustomerForNewCert.id);
    }
  }, [selectedCustomerForNewCert]);
  
  const [metalPurity, setMetalPurity] = useState<string>(initialCert?.metalPurity || purityOptions[0] || '18K (750)');
  const [metalColor, setMetalColor] = useState<string>(initialCert?.metalColor || colorOptions[0] || 'Ouro Amarelo');
  const [grossWeightGrams, setGrossWeightGrams] = useState<number>(initialCert?.grossWeightGrams || 5.2);
  const [widthCm, setWidthCm] = useState<number>(initialCert?.widthCm ?? 0);
  const [finish, setFinish] = useState<string>(initialCert?.finish || finishOptions[0] || 'Polido Espelhado');

  const [hasStones, setHasStones] = useState<boolean>(initialCert?.hasStones ?? true);
  const [stones, setStones] = useState<StoneDetail[]>(initialCert?.stones || [
    {
      id: 'st-new-1',
      type: stoneTypeOptions[0] || 'Diamante Natural',
      quantity: 1,
      caratWeight: 1.0,
      settingType: 'Garra'
    }
  ]);

  const [images, setImages] = useState<string[]>(
    initialCert?.images && initialCert.images.length > 0 
      ? initialCert.images.map(formatImageUrl) 
      : []
  );
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [draggedPhotoIndex, setDraggedPhotoIndex] = useState<number | null>(null);

  const [warrantyMonths, setWarrantyMonths] = useState<number>(initialCert?.warrantyMonths ?? -1);
  const [warrantyTerms, setWarrantyTerms] = useState(initialCert?.warrantyTerms || 'Garantia Vitalícia cobrindo autenticidade do ouro e gemas naturais.');
  const [estimatedValueBRL, setEstimatedValueBRL] = useState<number>(initialCert?.estimatedValueBRL || 25000);

  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Sync state if options change or initialCert changes
  useEffect(() => {
    if (initialCert?.metalPurity && !purityOptions.includes(initialCert.metalPurity)) {
      setPurityOptions(prev => [...prev, initialCert.metalPurity]);
    }
    if (initialCert?.metalColor && !colorOptions.includes(initialCert.metalColor)) {
      setColorOptions(prev => [...prev, initialCert.metalColor]);
    }
    if (initialCert?.collection && !collectionOptions.includes(initialCert.collection)) {
      setCollectionOptions(prev => [...prev, initialCert.collection]);
    }
    if (initialCert?.finish && !finishOptions.includes(initialCert.finish)) {
      setFinishOptions(prev => [...prev, initialCert.finish]);
    }
  }, [initialCert]);

  // Option Handlers: Purities
  const handleAddPurity = (newOpt: string) => {
    const updated = [...purityOptions, newOpt];
    setPurityOptions(updated);
    localStorage.setItem('aureum_purities', JSON.stringify(updated));
  };
  const handleEditPurity = (oldOpt: string, newOpt: string) => {
    const updated = purityOptions.map(p => p === oldOpt ? newOpt : p);
    setPurityOptions(updated);
    localStorage.setItem('aureum_purities', JSON.stringify(updated));
  };
  const handleDeletePurity = (optToDelete: string) => {
    const updated = purityOptions.filter(p => p !== optToDelete);
    setPurityOptions(updated);
    localStorage.setItem('aureum_purities', JSON.stringify(updated));
    if (metalPurity === optToDelete && updated.length > 0) {
      setMetalPurity(updated[0]);
    }
  };

  // Option Handlers: Colors
  const handleAddColor = (newOpt: string) => {
    const updated = [...colorOptions, newOpt];
    setColorOptions(updated);
    localStorage.setItem('aureum_colors', JSON.stringify(updated));
  };
  const handleEditColor = (oldOpt: string, newOpt: string) => {
    const updated = colorOptions.map(c => c === oldOpt ? newOpt : c);
    setColorOptions(updated);
    localStorage.setItem('aureum_colors', JSON.stringify(updated));
  };
  const handleDeleteColor = (optToDelete: string) => {
    const updated = colorOptions.filter(c => c !== optToDelete);
    setColorOptions(updated);
    localStorage.setItem('aureum_colors', JSON.stringify(updated));
    if (metalColor === optToDelete && updated.length > 0) {
      setMetalColor(updated[0]);
    }
  };

  // Option Handlers: Collections
  const handleAddCollection = (newOpt: string) => {
    const updated = [...collectionOptions, newOpt];
    setCollectionOptions(updated);
    localStorage.setItem('aureum_collections', JSON.stringify(updated));
  };
  const handleEditCollection = (oldOpt: string, newOpt: string) => {
    const updated = collectionOptions.map(c => c === oldOpt ? newOpt : c);
    setCollectionOptions(updated);
    localStorage.setItem('aureum_collections', JSON.stringify(updated));
  };
  const handleDeleteCollection = (optToDelete: string) => {
    const updated = collectionOptions.filter(c => c !== optToDelete);
    setCollectionOptions(updated);
    localStorage.setItem('aureum_collections', JSON.stringify(updated));
    if (collection === optToDelete && updated.length > 0) {
      setCollection(updated[0]);
    }
  };

  // Option Handlers: Finishes
  const handleAddFinish = (newOpt: string) => {
    const updated = [...finishOptions, newOpt];
    setFinishOptions(updated);
    localStorage.setItem('aureum_finishes', JSON.stringify(updated));
  };
  const handleEditFinish = (oldOpt: string, newOpt: string) => {
    const updated = finishOptions.map(f => f === oldOpt ? newOpt : f);
    setFinishOptions(updated);
    localStorage.setItem('aureum_finishes', JSON.stringify(updated));
  };
  const handleDeleteFinish = (optToDelete: string) => {
    const updated = finishOptions.filter(f => f !== optToDelete);
    setFinishOptions(updated);
    localStorage.setItem('aureum_finishes', JSON.stringify(updated));
    if (finish === optToDelete && updated.length > 0) {
      setFinish(updated[0]);
    }
  };

  // Option Handlers: Manufacturer (Fabricante / Marca)
  const handleAddManufacturer = (newOpt: string) => {
    const updated = [...manufacturerOptions, newOpt];
    setManufacturerOptions(updated);
    setManufacturer(newOpt);
    localStorage.setItem('aureum_manufacturers', JSON.stringify(updated));
  };
  const handleEditManufacturer = (oldOpt: string, newOpt: string) => {
    const updated = manufacturerOptions.map(s => (s === oldOpt ? newOpt : s));
    setManufacturerOptions(updated);
    if (manufacturer === oldOpt) setManufacturer(newOpt);
    localStorage.setItem('aureum_manufacturers', JSON.stringify(updated));
  };
  const handleDeleteManufacturer = (optToDelete: string) => {
    const updated = manufacturerOptions.filter(s => s !== optToDelete);
    setManufacturerOptions(updated);
    if (manufacturer === optToDelete) setManufacturer(updated[0] || '');
    localStorage.setItem('aureum_manufacturers', JSON.stringify(updated));
  };

  // Option Handlers: Stone Types
  const handleAddStoneType = (newOpt: string) => {
    const updated = [...stoneTypeOptions, newOpt];
    setStoneTypeOptions(updated);
    localStorage.setItem('aureum_stone_types', JSON.stringify(updated));
  };
  const handleEditStoneType = (oldOpt: string, newOpt: string) => {
    const updated = stoneTypeOptions.map(s => s === oldOpt ? newOpt : s);
    setStoneTypeOptions(updated);
    localStorage.setItem('aureum_stone_types', JSON.stringify(updated));
  };
  const handleDeleteStoneType = (optToDelete: string) => {
    const updated = stoneTypeOptions.filter(s => s !== optToDelete);
    setStoneTypeOptions(updated);
    localStorage.setItem('aureum_stone_types', JSON.stringify(updated));
  };

  // Option Handlers: Setting Types (Tipos de Cravação)
  const handleAddSettingType = (newOpt: string) => {
    const updated = [...settingTypeOptions, newOpt];
    setSettingTypeOptions(updated);
    localStorage.setItem('aureum_setting_types', JSON.stringify(updated));
  };
  const handleEditSettingType = (oldOpt: string, newOpt: string) => {
    const updated = settingTypeOptions.map(s => s === oldOpt ? newOpt : s);
    setSettingTypeOptions(updated);
    localStorage.setItem('aureum_setting_types', JSON.stringify(updated));
  };
  const handleDeleteSettingType = (optToDelete: string) => {
    const updated = settingTypeOptions.filter(s => s !== optToDelete);
    setSettingTypeOptions(updated);
    localStorage.setItem('aureum_setting_types', JSON.stringify(updated));
  };

  // Option Handlers: Cut Shapes (Lapidações/Formatos)
  const handleAddCutShape = (newOpt: string) => {
    const updated = [...cutShapeOptions, newOpt];
    setCutShapeOptions(updated);
    localStorage.setItem('aureum_cut_shapes', JSON.stringify(updated));
  };
  const handleEditCutShape = (oldOpt: string, newOpt: string) => {
    const updated = cutShapeOptions.map(s => s === oldOpt ? newOpt : s);
    setCutShapeOptions(updated);
    localStorage.setItem('aureum_cut_shapes', JSON.stringify(updated));
  };
  const handleDeleteCutShape = (optToDelete: string) => {
    const updated = cutShapeOptions.filter(s => s !== optToDelete);
    setCutShapeOptions(updated);
    localStorage.setItem('aureum_cut_shapes', JSON.stringify(updated));
  };

  // Option Handlers: Color Grades (Cor / Graduação)
  const handleAddColorGrade = (newOpt: string) => {
    const updated = [...colorGradeOptions, newOpt];
    setColorGradeOptions(updated);
    localStorage.setItem('aureum_color_grades', JSON.stringify(updated));
  };
  const handleEditColorGrade = (oldOpt: string, newOpt: string) => {
    const updated = colorGradeOptions.map(s => s === oldOpt ? newOpt : s);
    setColorGradeOptions(updated);
    localStorage.setItem('aureum_color_grades', JSON.stringify(updated));
  };
  const handleDeleteColorGrade = (optToDelete: string) => {
    const updated = colorGradeOptions.filter(s => s !== optToDelete);
    setColorGradeOptions(updated);
    localStorage.setItem('aureum_color_grades', JSON.stringify(updated));
  };

  // Option Handlers: Clarity Grades (Pureza / Clarity)
  const handleAddClarityGrade = (newOpt: string) => {
    const updated = [...clarityGradeOptions, newOpt];
    setClarityGradeOptions(updated);
    localStorage.setItem('aureum_clarity_grades', JSON.stringify(updated));
  };
  const handleEditClarityGrade = (oldOpt: string, newOpt: string) => {
    const updated = clarityGradeOptions.map(s => s === oldOpt ? newOpt : s);
    setClarityGradeOptions(updated);
    localStorage.setItem('aureum_clarity_grades', JSON.stringify(updated));
  };
  const handleDeleteClarityGrade = (optToDelete: string) => {
    const updated = clarityGradeOptions.filter(s => s !== optToDelete);
    setClarityGradeOptions(updated);
    localStorage.setItem('aureum_clarity_grades', JSON.stringify(updated));
  };

  // Add Stone row
  const handleAddStone = () => {
    const newStone: StoneDetail = {
      id: `st-${Date.now()}`,
      type: stoneTypeOptions[0] || 'Diamante Natural',
      quantity: 1,
      caratWeight: 0.5,
      settingType: settingTypeOptions[0] || 'Garra (Prong)',
      cutShape: cutShapeOptions[0] || 'Brilhante Redondo',
      colorGrade: colorGradeOptions[0] || 'D - Incolor (Excepcional)',
      clarityGrade: clarityGradeOptions[0] || 'VVS1 (Muitíssimo Poucas Inclusões)'
    };
    setStones([...stones, newStone]);
  };

  const handleRemoveStone = (id: string) => {
    setStones(stones.filter(s => s.id !== id));
  };

  // Helper to process FileList or File[] for uploads
  const processFileList = async (files: FileList | File[]) => {
    if (files && files.length > 0) {
      setIsProcessingUpload(true);
      try {
        const newUrls: string[] = [];
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (file.type.startsWith('image/')) {
            const url = await compressAndResizeImage(file);
            newUrls.push(url);
          }
        }
        if (newUrls.length > 0) {
          setImages(prev => [...prev, ...newUrls]);
        }
      } catch (err) {
        alert('Erro ao processar imagem local. Selecione imagens PNG, JPG ou WEBP válidas.');
      } finally {
        setIsProcessingUpload(false);
      }
    }
  };

  // Local File Upload Handler for High-Res Photos
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await processFileList(e.target.files);
    }
  };

  // Drag & Drop File Upload Handlers
  const handleFileDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(true);
  };

  const handleFileDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
  };

  const handleFileDrop = async (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFileList(e.dataTransfer.files);
    }
  };

  // Image Reordering Functions
  const moveImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= images.length) return;
    const updated = [...images];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setImages(updated);
  };

  const handlePhotoDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
    setDraggedPhotoIndex(index);
  };

  const handlePhotoDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handlePhotoDrop = (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
    e.preventDefault();
    if (draggedPhotoIndex !== null && draggedPhotoIndex !== targetIndex) {
      moveImage(draggedPhotoIndex, targetIndex);
    }
    setDraggedPhotoIndex(null);
  };

  // AI Description Generator (Gemini)
  const handleGenerateAIHelper = async () => {
    setIsGeneratingAI(true);
    try {
      const response = await fetch('/api/gemini/analyze-jewel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          metalPurity,
          metalColor,
          stones: hasStones ? stones : [],
          collection
        })
      });

      const res = await response.json();
      if (res.success && res.data) {
        if (res.data.marketingHighlight) {
          setCollection(`${collection} - ${res.data.marketingHighlight}`);
        }
        if (res.data.description) {
          setWarrantyTerms(`[Laudo Pericial IA]: ${res.data.description}\n\n${warrantyTerms}`);
        }
      }
    } catch (e) {
      console.error('Error generating AI text:', e);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const certId = initialCert?.id || `CERT-${new Date().getFullYear()}-${randomHex}`;
    const serialNum = initialCert?.serialNumber || `SN-${Math.floor(100000 + Math.random() * 900000)}`;

    const certToSave: JewelryCertificate = {
      id: certId,
      serialNumber: serialNum,
      title,
      collection,
      model,
      manufacturer,
      manufacturerLogoUrl: formatImageUrl(manufacturerLogoUrl),
      manufacturingDate: initialCert?.manufacturingDate || new Date().toISOString().split('T')[0],
      issueDate: new Date().toISOString().split('T')[0],
      currentOwnerName,
      ownerCpf: ownerCpf || undefined,
      ownerEmail: ownerEmail || undefined,
      ownerId: ownerId || undefined,
      metalPurity,
      metalColor,
      grossWeightGrams,
      widthCm: widthCm > 0 ? widthCm : 0,
      finish,
      hasStones,
      stones: hasStones ? stones : [],
      images: images.map(formatImageUrl),
      frames360: images.map(formatImageUrl),
      warrantyMonths,
      warrantyTerms,
      warrantyStatus: 'Ativa',
      authenticityHash: initialCert?.authenticityHash || '0x' + Array.from({ length: 20 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      estimatedValueBRL,
      careGuide: initialCert?.careGuide || [
        {
          category: 'Limpeza',
          title: 'Higienização Recomendada',
          description: `Lave com água morna e sabão neutro. Seque com pano macio específico para ${metalPurity}.`
        },
        {
          category: 'Armazenamento',
          title: 'Acondicionamento de Segurança',
          description: 'Guarde em estojo individual aveludado para evitar atritos.'
        }
      ],
      maintenanceHistory: initialCert?.maintenanceHistory || [
        {
          id: `maint-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          type: 'Certificação Inicial',
          performer: manufacturer || 'Atelier Oficial',
          notes: 'Certificado e selo digital NFT gerados e homologados.',
          verifiedByAppraiser: 'Mestre Gemólogo Responsável'
        }
      ],
      createdAt: initialCert?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(certToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-zinc-950 border border-amber-900/40 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-amber-900/30 flex items-center justify-between bg-zinc-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 rounded-2xl border border-amber-500/30 text-amber-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-serif text-amber-100">
                {initialCert ? 'Editar Certificado da Joia' : 'Cadastrar Nova Joia & Emitir Certificado'}
              </h2>
              <p className="text-xs text-zinc-400">
                Gere o passaporte digital rastreável com selo de autenticidade NFT e QR Code
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-zinc-800 text-zinc-400 hover:text-amber-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-zinc-200">
          
          {/* AI Assist Button */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-amber-400 shrink-0" />
              <div>
                <span className="font-bold text-amber-200 block text-sm">Assistente Gemólogo Gemini IA</span>
                <span className="text-zinc-400 text-xs">Gere descrições técnicas e laudos de joalheria automaticamente com base nos metais e gemas selecionados.</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGenerateAIHelper}
              disabled={isGeneratingAI}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-zinc-950 font-bold rounded-xl shrink-0 transition-all shadow-md text-xs disabled:opacity-50"
            >
              {isGeneratingAI ? 'Analisando Joia...' : 'Preencher com IA'}
            </button>
          </div>

          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <h3 className="text-amber-300 font-bold uppercase tracking-wider text-[11px]">
              1. Identificação da Peça & Coleção
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
              {/* Título da Joia */}
              <div className="flex flex-col justify-between h-full space-y-1">
                <div>
                  <label className="block text-zinc-400 text-xs font-medium mb-0.5">Título da Joia *</label>
                  <div className="min-h-[24px] pb-0.5" />
                </div>
                <div className="mt-auto">
                  <input
                    type="text"
                    required
                    placeholder="Ex: Anel Solitário Étoile Royale"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-amber-100 text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Coleção (OptionManagerSelect) */}
              <OptionManagerSelect
                label="Coleção"
                value={collection}
                onChange={setCollection}
                options={collectionOptions}
                onAddOption={handleAddCollection}
                onEditOption={handleEditCollection}
                onDeleteOption={handleDeleteCollection}
              />

              {/* Modelo / Referência */}
              <div className="flex flex-col justify-between h-full space-y-1">
                <div>
                  <label className="block text-zinc-400 text-xs font-medium mb-0.5">Modelo / Referência</label>
                  <div className="min-h-[24px] pb-0.5" />
                </div>
                <div className="mt-auto">
                  <input
                    type="text"
                    placeholder="Ex: Solitaire-V18"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-amber-100 text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Fabricante / Marca */}
              <OptionManagerSelect
                label="Fabricante / Marca"
                value={manufacturer}
                onChange={setManufacturer}
                options={manufacturerOptions}
                onAddOption={handleAddManufacturer}
                onEditOption={handleEditManufacturer}
                onDeleteOption={handleDeleteManufacturer}
              />

              {/* Logotipo da Marca */}
              <div className="flex flex-col justify-between h-full space-y-1">
                <div>
                  <label className="block text-zinc-400 text-xs font-medium mb-0.5">Logotipo da Marca (URL)</label>
                  <div className="min-h-[24px] pb-0.5" />
                </div>
                <div className="mt-auto">
                  <input
                    type="url"
                    placeholder="https://exemplo.com/logotipo.png"
                    value={manufacturerLogoUrl}
                    onChange={(e) => setManufacturerLogoUrl(e.target.value)}
                    className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-amber-100 text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Valor Estimado (BRL) */}
              <div className="flex flex-col justify-between h-full space-y-1">
                <div>
                  <label className="block text-zinc-400 text-xs font-medium mb-0.5">Valor Estimado (BRL)</label>
                  <div className="min-h-[24px] pb-0.5" />
                </div>
                <div className="mt-auto">
                  <input
                    type="number"
                    placeholder="Ex: 35000"
                    value={estimatedValueBRL}
                    onChange={(e) => setEstimatedValueBRL(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-amber-100 text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Noble Metal Specifications with Custom Option Management */}
          <div className="space-y-4 pt-2 border-t border-zinc-800">
            <h3 className="text-amber-300 font-bold uppercase tracking-wider text-[11px]">
              2. Especificações do Metal Nobre
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-stretch">
              {/* a) Teor do Metal */}
              <OptionManagerSelect
                label="Teor do Metal (Purity)"
                value={metalPurity}
                onChange={setMetalPurity}
                options={purityOptions}
                onAddOption={handleAddPurity}
                onEditOption={handleEditPurity}
                onDeleteOption={handleDeletePurity}
              />

              {/* b) Cor do Metal */}
              <OptionManagerSelect
                label="Cor do Metal"
                value={metalColor}
                onChange={setMetalColor}
                options={colorOptions}
                onAddOption={handleAddColor}
                onEditOption={handleEditColor}
                onDeleteOption={handleDeleteColor}
              />

              {/* c) Peso Bruto */}
              <div className="flex flex-col justify-between h-full space-y-1">
                <div>
                  <label className="block text-zinc-400 text-xs font-medium mb-0.5">Peso Bruto (Gramas)</label>
                  <div className="min-h-[24px] pb-0.5" />
                </div>
                <div className="mt-auto">
                  <input
                    type="number"
                    step="0.01"
                    value={grossWeightGrams}
                    onChange={(e) => setGrossWeightGrams(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-amber-100 text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* d) Largura da Peça (cm) */}
              <div className="flex flex-col justify-between h-full space-y-1">
                <div>
                  <label className="block text-zinc-400 text-xs font-medium mb-0.5">Largura da Peça (cm)</label>
                  <div className="min-h-[24px] pb-0.5 text-[10px] text-zinc-500 font-normal">0 = não exibir</div>
                </div>
                <div className="mt-auto">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ex: 0.5 (ou 0)"
                    value={widthCm || ''}
                    onChange={(e) => setWidthCm(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-amber-100 text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* e) Acabamento */}
              <OptionManagerSelect
                label="Acabamento"
                value={finish}
                onChange={setFinish}
                options={finishOptions}
                onAddOption={handleAddFinish}
                onEditOption={handleEditFinish}
                onDeleteOption={handleDeleteFinish}
              />
            </div>
          </div>

          {/* Section 3: Gemstones Builder */}
          <div className="space-y-4 pt-2 border-t border-zinc-800">
            <div className="flex items-center justify-between">
              <h3 className="text-amber-300 font-bold uppercase tracking-wider text-[11px]">
                3. Pedras Preciosas & Gemologia
              </h3>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasStones}
                  onChange={(e) => setHasStones(e.target.checked)}
                  className="rounded accent-amber-500"
                />
                <span className="text-zinc-300 font-medium">Esta joia possui pedras cravadas</span>
              </label>
            </div>

            {hasStones && (
              <div className="space-y-3">
                {stones.map((st, index) => (
                  <div key={st.id} className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between text-xs border-b border-zinc-800 pb-2">
                      <span className="font-semibold text-amber-300">Pedra #{index + 1}</span>
                      {stones.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveStone(st.id)}
                          className="text-red-400 hover:text-red-300 flex items-center gap-1 text-[11px]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remover</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-stretch">
                      {/* Tipo da Gema com Cadastrar/Alterar/Excluir */}
                      <OptionManagerSelect
                        label="Tipo da Gema"
                        value={st.type}
                        onChange={(newVal) => {
                          const updated = [...stones];
                          updated[index].type = newVal;
                          setStones(updated);
                        }}
                        options={stoneTypeOptions}
                        onAddOption={handleAddStoneType}
                        onEditOption={handleEditStoneType}
                        onDeleteOption={handleDeleteStoneType}
                      />

                      {/* Quantidade */}
                      <div className="flex flex-col justify-between h-full space-y-1">
                        <div>
                          <label className="block text-zinc-400 text-xs font-medium mb-0.5">Quantidade</label>
                          <div className="min-h-[24px] pb-0.5" />
                        </div>
                        <div className="mt-auto">
                          <input
                            type="number"
                            value={st.quantity}
                            onChange={(e) => {
                              const updated = [...stones];
                              updated[index].quantity = parseInt(e.target.value) || 1;
                              setStones(updated);
                            }}
                            className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-amber-100 text-xs"
                          />
                        </div>
                      </div>

                      {/* Peso em Quilates */}
                      <div className="flex flex-col justify-between h-full space-y-1">
                        <div>
                          <label className="block text-zinc-400 text-xs font-medium mb-0.5">Peso (Quilates / ct)</label>
                          <div className="min-h-[24px] pb-0.5" />
                        </div>
                        <div className="mt-auto">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={st.caratWeight === 0 ? 0 : (st.caratWeight ?? '')}
                            onChange={(e) => {
                              const raw = e.target.value;
                              const val = raw === '' ? 0 : parseFloat(raw);
                              const updated = [...stones];
                              updated[index].caratWeight = isNaN(val) ? 0 : val;
                              setStones(updated);
                            }}
                            className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-amber-100 text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Linha 2: Tipo de Cravação, Lapidação/Formato, Cor e Pureza */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-stretch pt-2 border-t border-zinc-800/60">
                      {/* Tipo de Cravação com Cadastrar/Alterar/Excluir */}
                      <OptionManagerSelect
                        label="Tipo de Cravação"
                        value={st.settingType || settingTypeOptions[0] || 'Garra (Prong)'}
                        onChange={(newVal) => {
                          const updated = [...stones];
                          updated[index].settingType = newVal;
                          setStones(updated);
                        }}
                        options={settingTypeOptions}
                        onAddOption={handleAddSettingType}
                        onEditOption={handleEditSettingType}
                        onDeleteOption={handleDeleteSettingType}
                      />

                      {/* Lapidação / Formato com Cadastrar/Alterar/Excluir */}
                      <OptionManagerSelect
                        label="Lapidação / Formato"
                        value={st.cutShape || cutShapeOptions[0] || 'Brilhante Redondo'}
                        onChange={(newVal) => {
                          const updated = [...stones];
                          updated[index].cutShape = newVal;
                          setStones(updated);
                        }}
                        options={cutShapeOptions}
                        onAddOption={handleAddCutShape}
                        onEditOption={handleEditCutShape}
                        onDeleteOption={handleDeleteCutShape}
                      />

                      {/* Cor / Graduação com Cadastrar/Alterar/Excluir */}
                      <OptionManagerSelect
                        label="Cor / Graduação"
                        value={st.colorGrade || colorGradeOptions[0] || 'D - Incolor (Excepcional)'}
                        onChange={(newVal) => {
                          const updated = [...stones];
                          updated[index].colorGrade = newVal;
                          setStones(updated);
                        }}
                        options={colorGradeOptions}
                        onAddOption={handleAddColorGrade}
                        onEditOption={handleEditColorGrade}
                        onDeleteOption={handleDeleteColorGrade}
                      />
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddStone}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-amber-300 border border-amber-900/40 text-xs font-semibold transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Outro Tipo de Pedra</span>
                </button>
              </div>
            )}
          </div>

          {/* Section 4: High-Res Media & Local Upload */}
          <div className="space-y-4 pt-2 border-t border-zinc-800">
            <h3 className="text-amber-300 font-bold uppercase tracking-wider text-[11px]">
              4. Fotografia em Alta Resolução
            </h3>

            <div className="space-y-4">
              {/* Local File Drag & Drop Upload Zone */}
              <div>
                <label className="block text-zinc-300 font-semibold mb-2 text-xs">
                  Upload e Arrasto de Fotos do Seu Computador:
                </label>
                <label
                  onDragOver={handleFileDragOver}
                  onDragLeave={handleFileDragLeave}
                  onDrop={handleFileDrop}
                  className={`flex flex-col items-center justify-center gap-2.5 p-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
                    isDraggingFile
                      ? 'bg-amber-500/15 border-amber-400 ring-4 ring-amber-500/20 scale-[1.01]'
                      : 'bg-zinc-900/90 border-amber-500/40 hover:border-amber-400 hover:bg-zinc-900'
                  }`}
                >
                  {isProcessingUpload ? (
                    <div className="flex items-center gap-2 py-1">
                      <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
                      <span className="font-semibold text-xs text-amber-300">Otimizando e processando imagens locais...</span>
                    </div>
                  ) : (
                    <>
                      <div className="p-3 rounded-full bg-amber-500/10 text-amber-400">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div className="text-center space-y-1">
                        <p className="font-semibold text-xs text-amber-200">
                          {isDraggingFile ? 'Solte as fotos aqui para fazer o upload!' : 'Arraste e solte as fotos da joia aqui'}
                        </p>
                        <p className="text-[11px] text-zinc-400">
                          ou clique para selecionar arquivos do seu dispositivo (PNG, JPG, WEBP)
                        </p>
                      </div>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    disabled={isProcessingUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Preview & Reorder Attached Photos */}
              {images.length > 0 && (
                <div className="space-y-2.5 p-3.5 bg-zinc-950/80 rounded-2xl border border-zinc-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                    <span className="text-amber-200 font-semibold flex items-center gap-1.5">
                      <Move className="w-3.5 h-3.5 text-amber-400" />
                      Fotos Anexadas ao Certificado ({images.length}):
                    </span>
                    <span className="text-zinc-400 text-[11px]">
                      💡 Arraste os cards para alterar a ordem. A <b>1ª foto</b> é a capa principal!
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-1">
                    {images.map((imgUrl, idx) => (
                      <div
                        key={idx}
                        draggable
                        onDragStart={(e) => handlePhotoDragStart(e, idx)}
                        onDragOver={handlePhotoDragOver}
                        onDrop={(e) => handlePhotoDrop(e, idx)}
                        className={`relative group aspect-square rounded-xl overflow-hidden border bg-black transition-all cursor-grab active:cursor-grabbing ${
                          idx === 0 
                            ? 'border-amber-400 ring-2 ring-amber-500/40 shadow-lg shadow-amber-500/10' 
                            : 'border-zinc-800 hover:border-amber-500/60'
                        } ${draggedPhotoIndex === idx ? 'opacity-40 scale-95 border-amber-400 border-dashed' : ''}`}
                      >
                        <img 
                          src={formatImageUrl(imgUrl)} 
                          alt={`Foto ${idx + 1}`} 
                          className="w-full h-full object-cover pointer-events-none" 
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />

                        {/* Position Badge */}
                        <div className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold shadow-md flex items-center gap-1 ${
                          idx === 0 ? 'bg-amber-500 text-zinc-950' : 'bg-black/70 text-zinc-300 backdrop-blur-sm'
                        }`}>
                          <GripVertical className="w-2.5 h-2.5 opacity-70" />
                          <span>{idx === 0 ? '1ª (Capa)' : `${idx + 1}ª`}</span>
                        </div>

                        {/* Quick Control Overlay */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between px-2 pointer-events-auto">
                          {/* Left / Make Primary Button */}
                          <div className="flex gap-1">
                            {idx > 0 && (
                              <button
                                type="button"
                                onClick={() => moveImage(idx, idx - 1)}
                                className="p-1.5 bg-zinc-800 hover:bg-amber-500 hover:text-zinc-950 text-amber-300 rounded-lg transition-colors"
                                title="Mover para esquerda"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {idx > 0 && (
                              <button
                                type="button"
                                onClick={() => moveImage(idx, 0)}
                                className="p-1.5 bg-zinc-800 hover:bg-amber-500 hover:text-zinc-950 text-amber-300 rounded-lg transition-colors"
                                title="Definir como Capa Principal"
                              >
                                <Star className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          {/* Right / Delete Button */}
                          <div className="flex gap-1">
                            {idx < images.length - 1 && (
                              <button
                                type="button"
                                onClick={() => moveImage(idx, idx + 1)}
                                className="p-1.5 bg-zinc-800 hover:bg-amber-500 hover:text-zinc-950 text-amber-300 rounded-lg transition-colors"
                                title="Mover para direita"
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setImages(images.filter((_, i) => i !== idx))}
                              className="p-1.5 bg-red-600/90 hover:bg-red-600 text-white rounded-lg transition-colors"
                              title="Remover foto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* URL Input with Google Drive Support */}
              <div className="space-y-2 pt-1">
                <label className="block text-zinc-300 font-semibold text-xs">
                  Ou adicione por link de imagem (URL da web ou Google Drive):
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="Cole o link da foto (Ex: Google Drive, Unsplash, Imgur...)"
                    value={customImageUrl}
                    onChange={(e) => setCustomImageUrl(e.target.value)}
                    className="flex-1 p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-amber-100 focus:outline-none focus:border-amber-500 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customImageUrl.trim()) {
                        const formatted = formatImageUrl(customImageUrl.trim());
                        if (!images.includes(formatted)) {
                          setImages([...images, formatted]);
                        }
                        setCustomImageUrl('');
                      }
                    }}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Adicionar Link</span>
                  </button>
                </div>
                
                <div className="p-3.5 bg-zinc-900 border border-amber-500/40 rounded-xl space-y-1.5 shadow-sm">
                  <p className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Suporte a links do Google Drive e fotos de alta resolução</span>
                  </p>
                  <p className="text-zinc-200 text-xs font-normal leading-relaxed">
                    Links do Google Drive (<code className="text-amber-300 font-mono font-semibold bg-zinc-800 px-1.5 py-0.5 rounded border border-amber-500/30 text-[11px]">drive.google.com/file/d/...</code>) são convertidos automaticamente para renderização direta.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-6 border-t border-zinc-800 flex items-center justify-between gap-3">
            {initialCert && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  onDelete(initialCert);
                  onClose();
                }}
                className="px-4 py-2.5 rounded-xl bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-500/40 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                id="btn-form-delete-cert"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
                <span>Excluir Joia</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-zinc-950 font-bold text-xs shadow-lg shadow-amber-900/40"
              >
                {initialCert ? 'Salvar Alterações' : 'Emitir Certificado com QR Code'}
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
