import React, { useState, useEffect } from 'react';
import { JewelryCertificate, StoneDetail, Customer } from '../types';
import { X, Sparkles, Plus, Trash2, Edit3, Check, Upload, Loader2, Image as ImageIcon, Link as LinkIcon, GripVertical, ChevronLeft, ChevronRight, Star, Move, Users, CreditCard, Mail } from 'lucide-react';
import { formatImageUrl, DEFAULT_BRAND_LOGO_DRIVE_URL } from '../utils/imageUtils';
import { fetchWithAuth } from '../utils/fetchWithAuth';

interface CertificateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cert: JewelryCertificate) => void;
  initialCert?: JewelryCertificate | null;
  onDelete?: (cert: JewelryCertificate) => void;
  customers?: Customer[];
  selectedCustomerForNewCert?: Customer | null;
}

const DEFAULT_PURITIES: string[] = [];
const DEFAULT_COLORS: string[] = [];
const DEFAULT_COLLECTIONS: string[] = [];
const DEFAULT_MANUFACTURERS: string[] = [];
const DEFAULT_FINISHES: string[] = [];
const DEFAULT_STONE_TYPES: string[] = [];
const DEFAULT_SETTING_TYPES: string[] = [];
const DEFAULT_CUT_SHAPES: string[] = [];
const DEFAULT_COLOR_GRADES: string[] = [];
const DEFAULT_CLARITY_GRADES: string[] = [];

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

  const defaultCompanyName = 'Estilo Raro Joias';
  const defaultCompanyLogo = '';

  const [purityOptions, setPurityOptions] = useState<string[]>(DEFAULT_PURITIES);
  const [colorOptions, setColorOptions] = useState<string[]>(DEFAULT_COLORS);
  const [collectionOptions, setCollectionOptions] = useState<string[]>(DEFAULT_COLLECTIONS);
  const [manufacturerOptions, setManufacturerOptions] = useState<string[]>(DEFAULT_MANUFACTURERS);
  const [finishOptions, setFinishOptions] = useState<string[]>(DEFAULT_FINISHES);
  const [stoneTypeOptions, setStoneTypeOptions] = useState<string[]>(DEFAULT_STONE_TYPES);
  const [settingTypeOptions, setSettingTypeOptions] = useState<string[]>(DEFAULT_SETTING_TYPES);
  const [cutShapeOptions, setCutShapeOptions] = useState<string[]>(DEFAULT_CUT_SHAPES);
  const [colorGradeOptions, setColorGradeOptions] = useState<string[]>(DEFAULT_COLOR_GRADES);
  const [clarityGradeOptions, setClarityGradeOptions] = useState<string[]>(DEFAULT_CLARITY_GRADES);

  // Load attributes from Supabase
  useEffect(() => {
    const loadAttributes = async () => {
      try {
        const endpoints = [
          { key: 'metal_purities', setState: setPurityOptions },
          { key: 'metal_colors', setState: setColorOptions },
          { key: 'collections', setState: setCollectionOptions },
          { key: 'manufacturers', setState: setManufacturerOptions },
          { key: 'finishes', setState: setFinishOptions },
          { key: 'stone_types', setState: setStoneTypeOptions },
          { key: 'setting_types', setState: setSettingTypeOptions },
          { key: 'cut_shapes', setState: setCutShapeOptions },
          { key: 'color_grades', setState: setColorGradeOptions },
          { key: 'clarity_grades', setState: setClarityGradeOptions }
        ];

        for (const endpoint of endpoints) {
          try {
            const url = `/api/${endpoint.key.replace(/_/g, '-')}`;
            const res = await fetchWithAuth(url);
            const data = await res.json();
            if (data.success && Array.isArray(data.data)) {
              const sorted = [...data.data].sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
              const names = sorted.map((item: any) => item.name);
              if (endpoint.key === 'finishes') {
                console.log('[FORM DEBUG] Loaded finishes:', names);
              }
              endpoint.setState(names);

              // Se carregou coleções, atualiza o estado se estiver vazio
              if (endpoint.key === 'collections' && !initialCert?.collection && names.length > 0) {
                setCollection(names[0]);
              }
              // Se carregou fabricantes, atualiza o estado se estiver vazio
              if (endpoint.key === 'manufacturers' && !initialCert?.manufacturer && names.length > 0) {
                setManufacturer(names[0]);
              }
            }
          } catch (err: any) {
            console.error(`Erro ao carregar ${endpoint.key}:`, err);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar atributos:', err);
      }
    };

    loadAttributes();
  }, [initialCert]);

  // Certificate Fields
  const [title, setTitle] = useState(initialCert?.title || '');
  const [collection, setCollection] = useState(initialCert?.collection || collectionOptions[0] || '');
  const [model, setModel] = useState(initialCert?.model || '');
  const [manufacturer, setManufacturer] = useState(initialCert?.manufacturer || manufacturerOptions[0] || '');
  const [manufacturerLogoUrl, setManufacturerLogoUrl] = useState(
    initialCert?.manufacturerLogoUrl || defaultCompanyLogo || DEFAULT_BRAND_LOGO_DRIVE_URL
  );
  const [currentOwnerName, setCurrentOwnerName] = useState(initialCert?.current_owner_name || initialCert?.currentOwnerName || selectedCustomerForNewCert?.name || '');
  const [ownerCpf, setOwnerCpf] = useState(initialCert?.owner_cpf || initialCert?.ownerCpf || selectedCustomerForNewCert?.cpf || '');
  const [ownerEmail, setOwnerEmail] = useState(initialCert?.owner_email || initialCert?.ownerEmail || selectedCustomerForNewCert?.email || '');
  const [ownerId, setOwnerId] = useState(initialCert?.owner_id || initialCert?.ownerId || selectedCustomerForNewCert?.id || '');

  useEffect(() => {
    if (selectedCustomerForNewCert) {
      setCurrentOwnerName(selectedCustomerForNewCert.name);
      setOwnerCpf(selectedCustomerForNewCert.cpf);
      setOwnerEmail(selectedCustomerForNewCert.email);
      setOwnerId(selectedCustomerForNewCert.id);
    }
  }, [selectedCustomerForNewCert]);

  // Sync certificate fields when initialCert changes
  useEffect(() => {
    if (initialCert) {
      setTitle(initialCert.title || '');
      setCollection(initialCert.collection || 'Haute Joaillerie 2026');
      setModel(initialCert.model || '');
      setManufacturer(initialCert.manufacturer || defaultCompanyName);
      setManufacturerLogoUrl(initialCert.manufacturerLogoUrl || defaultCompanyLogo || DEFAULT_BRAND_LOGO_DRIVE_URL);
      setCurrentOwnerName(initialCert.current_owner_name || initialCert.currentOwnerName || '');
      setOwnerCpf(initialCert.owner_cpf || initialCert.ownerCpf || '');
      setOwnerEmail(initialCert.owner_email || initialCert.ownerEmail || '');
      setOwnerId(initialCert.owner_id || initialCert.ownerId || '');
      setMetalPurity(initialCert.metal_purity || initialCert.metalPurity || purityOptions[0] || '18K (750)');
      setMetalColor(initialCert.metal_color || initialCert.metalColor || colorOptions[0] || 'Ouro Amarelo');
      setGrossWeightGrams(initialCert.gross_weight_grams ?? initialCert.grossWeightGrams ?? '');
      setWidthCm(initialCert.width_cm ?? initialCert.widthCm ?? '');
      setFinish(initialCert.finish || '');
      setHasStones(initialCert.has_stones ?? initialCert.hasStones ?? true);
      if (initialCert.stones && initialCert.stones.length > 0) {
        setStones(initialCert.stones);
      }
      if (initialCert.images && initialCert.images.length > 0) {
        setImages(initialCert.images.map(formatImageUrl));
      }
      setWarrantyMonths(initialCert.warranty_months ?? initialCert.warrantyMonths ?? -1);
      setWarrantyTerms(initialCert.warranty_terms || initialCert.warrantyTerms || 'Garantia Vitalícia cobrindo autenticidade do ouro e gemas naturais.');
      setEstimatedValueBRL(initialCert.estimated_value_brl ?? initialCert.estimatedValueBRL ?? '');
    }
  }, [initialCert]);
  
  const [metalPurity, setMetalPurity] = useState<string>(initialCert?.metal_purity || initialCert?.metalPurity || purityOptions[0] || '18K (750)');
  const [metalColor, setMetalColor] = useState<string>(initialCert?.metal_color || initialCert?.metalColor || colorOptions[0] || 'Ouro Amarelo');
  const [grossWeightGrams, setGrossWeightGrams] = useState<number>(initialCert?.gross_weight_grams ?? initialCert?.grossWeightGrams ?? '');
  const [widthCm, setWidthCm] = useState<number>(initialCert?.width_cm ?? initialCert?.widthCm ?? '');
  const [finish, setFinish] = useState<string>(initialCert?.finish || '');

  const [hasStones, setHasStones] = useState<boolean>(initialCert?.has_stones ?? initialCert?.hasStones ?? true);
  const [stones, setStones] = useState<StoneDetail[]>(initialCert?.stones && initialCert.stones.length > 0 ? initialCert.stones : []);

  const [images, setImages] = useState<string[]>(
    initialCert?.images && initialCert.images.length > 0 
      ? initialCert.images.map(formatImageUrl) 
      : []
  );
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [draggedPhotoIndex, setDraggedPhotoIndex] = useState<number | null>(null);

  const [warrantyMonths, setWarrantyMonths] = useState<number>(initialCert?.warranty_months ?? initialCert?.warrantyMonths ?? -1);
  const [warrantyTerms, setWarrantyTerms] = useState(initialCert?.warranty_terms || initialCert?.warrantyTerms || 'Garantia Vitalícia cobrindo autenticidade do ouro e gemas naturais.');
  const [estimatedValueBRL, setEstimatedValueBRL] = useState<number>(initialCert?.estimated_value_brl ?? initialCert?.estimatedValueBRL ?? '');

  // Sync state if options change or initialCert changes
  useEffect(() => {
    const purityValue = initialCert?.metal_purity || initialCert?.metalPurity;
    if (purityValue && !purityOptions.includes(purityValue)) {
      setPurityOptions(prev => [...prev, purityValue]);
    }
    const colorValue = initialCert?.metal_color || initialCert?.metalColor;
    if (colorValue && !colorOptions.includes(colorValue)) {
      setColorOptions(prev => [...prev, colorValue]);
    }
    if (initialCert?.collection && !collectionOptions.includes(initialCert.collection)) {
      setCollectionOptions(prev => [...prev, initialCert.collection]);
    }
    if (initialCert?.finish && !finishOptions.includes(initialCert.finish)) {
      setFinishOptions(prev => [...prev, initialCert.finish]);
    }
    // Sync stone types from loaded certificate
    if (initialCert?.stones && Array.isArray(initialCert.stones)) {
      initialCert.stones.forEach(stone => {
        if (stone.type && !stoneTypeOptions.includes(stone.type)) {
          setStoneTypeOptions(prev => [...prev, stone.type]);
        }
      });
    }
  }, [initialCert]);

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
      warrantyMonths,
      warrantyTerms,
      warrantyStatus: 'Ativa',
      authenticityHash: initialCert?.authenticityHash || '', // Gerado apenas ao vincular cliente
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
      maintenanceHistory: initialCert?.maintenanceHistory || [],
      createdAt: initialCert?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('[FORM DEBUG] Saving certificate with finish:', certToSave.finish);
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

              {/* Coleção */}
              <div className="flex flex-col justify-between h-full space-y-1">
                <label className="block text-zinc-400 text-xs font-medium mb-0.5">Coleção</label>
                <select
                  value={collection}
                  onChange={(e) => setCollection(e.target.value)}
                  className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-amber-100 text-xs focus:outline-none focus:border-amber-500 mt-auto"
                >
                  {collectionOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

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
              <div className="flex flex-col justify-between h-full space-y-1">
                <label className="block text-zinc-400 text-xs font-medium mb-0.5">Fabricante / Marca</label>
                <select
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                  className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-amber-100 text-xs focus:outline-none focus:border-amber-500 mt-auto"
                >
                  {manufacturerOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

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
              <div className="flex flex-col justify-between h-full space-y-1">
                <label className="block text-zinc-400 text-xs font-medium mb-0.5">Metal</label>
                <select
                  value={metalPurity}
                  onChange={(e) => setMetalPurity(e.target.value)}
                  className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-amber-100 text-xs focus:outline-none focus:border-amber-500 mt-auto"
                >
                  {purityOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              {/* b) Cor do Metal */}
              <div className="flex flex-col justify-between h-full space-y-1">
                <label className="block text-zinc-400 text-xs font-medium mb-0.5">Cor</label>
                <select
                  value={metalColor}
                  onChange={(e) => setMetalColor(e.target.value)}
                  className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-amber-100 text-xs focus:outline-none focus:border-amber-500 mt-auto"
                >
                  {colorOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              {/* c) Peso Bruto */}
              <div className="flex flex-col justify-between h-full space-y-1">
                <div>
                  <label className="block text-zinc-400 text-xs font-medium mb-0.5">Peso Aprox. (Gramas)</label>
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
                  <label className="block text-zinc-400 text-xs font-medium mb-0.5">Largura Aprox. (cm)</label>
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
              <div className="flex flex-col justify-between h-full space-y-1">
                <label className="block text-zinc-400 text-xs font-medium mb-0.5">Acabamento</label>
                <select
                  value={finish}
                  onChange={(e) => setFinish(e.target.value)}
                  className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-amber-100 text-xs focus:outline-none focus:border-amber-500 mt-auto"
                >
                  {finishOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
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
                      {/* Tipo da Gema */}
                      <div className="flex flex-col justify-between h-full space-y-1">
                        <label className="block text-zinc-400 text-xs font-medium mb-0.5">Tipo da Gema</label>
                        <select
                          value={st.type}
                          onChange={(e) => {
                            const updated = [...stones];
                            updated[index].type = e.target.value;
                            setStones(updated);
                          }}
                          className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-amber-100 text-xs focus:outline-none focus:border-amber-500 mt-auto"
                        >
                          {stoneTypeOptions.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>

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
                      {/* Tipo de Cravação */}
                      <div className="flex flex-col justify-between h-full space-y-1">
                        <label className="block text-zinc-400 text-xs font-medium mb-0.5">Tipo de Cravação</label>
                        <select
                          value={st.settingType || settingTypeOptions[0] || 'Garra (Prong)'}
                          onChange={(e) => {
                            const updated = [...stones];
                            updated[index].settingType = e.target.value;
                            setStones(updated);
                          }}
                          className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-amber-100 text-xs focus:outline-none focus:border-amber-500 mt-auto"
                        >
                          {settingTypeOptions.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>

                      {/* Lapidação / Formato */}
                      <div className="flex flex-col justify-between h-full space-y-1">
                        <label className="block text-zinc-400 text-xs font-medium mb-0.5">Lapidação / Formato</label>
                        <select
                          value={st.cutShape || cutShapeOptions[0] || 'Brilhante Redondo'}
                          onChange={(e) => {
                            const updated = [...stones];
                            updated[index].cutShape = e.target.value;
                            setStones(updated);
                          }}
                          className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-amber-100 text-xs focus:outline-none focus:border-amber-500 mt-auto"
                        >
                          {cutShapeOptions.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>

                      {/* Cor / Graduação */}
                      <div className="flex flex-col justify-between h-full space-y-1">
                        <label className="block text-zinc-400 text-xs font-medium mb-0.5">Cor / Graduação</label>
                        <select
                          value={st.colorGrade || colorGradeOptions[0] || 'D - Incolor (Excepcional)'}
                          onChange={(e) => {
                            const updated = [...stones];
                            updated[index].colorGrade = e.target.value;
                            setStones(updated);
                          }}
                          className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-amber-100 text-xs focus:outline-none focus:border-amber-500 mt-auto"
                        >
                          {colorGradeOptions.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
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
