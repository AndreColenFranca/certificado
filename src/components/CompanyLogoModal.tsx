import React, { useState } from 'react';
import { X, Upload, Check, Image as ImageIcon, Sparkles, Building2, ShieldCheck, Loader2 } from 'lucide-react';
import { formatImageUrl } from '../utils/imageUtils';

interface CompanyLogoModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyName: string;
  companyLogoUrl: string;
  onSaveCompanyConfig: (name: string, logoUrl: string) => void;
}

const LUXURY_LOGO_PRESETS = [
  {
    name: 'Monograma M - Dourado Imperial',
    url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=300&auto=format&fit=crop&q=80'
  },
  {
    name: 'Brasão Solitário - Haute Joaillerie',
    url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=300&auto=format&fit=crop&q=80'
  },
  {
    name: 'Selo Diamante - Ateliê de Luxo',
    url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=300&auto=format&fit=crop&q=80'
  },
  {
    name: 'Emblema Coroa de Ouro 18K',
    url: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=300&auto=format&fit=crop&q=80'
  }
];

// Canvas Image Optimizer for high-definition rendering (preserves sharp vector details, transparency, and prevents quality degradation)
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

        // Enable high-quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Optimized PNG format preserving alpha transparency and crispness
        const dataUrl = canvas.toDataURL('image/png', 0.98);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Erro ao carregar formato da imagem'));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo local'));
    reader.readAsDataURL(file);
  });
};

export const CompanyLogoModal: React.FC<CompanyLogoModalProps> = ({
  isOpen,
  onClose,
  companyName,
  companyLogoUrl,
  onSaveCompanyConfig
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState(companyName || 'Estilo Raro Joias');
  const [logoUrl, setLogoUrl] = useState(companyLogoUrl || LUXURY_LOGO_PRESETS[0].url);
  const [inputUrl, setInputUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [imgLoadError, setImgLoadError] = useState(false);
  const [previewBg, setPreviewBg] = useState<'white' | 'dark'>('white');
  const [successMsg, setSuccessMsg] = useState(false);

  // Handle local image file upload with compression
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessing(true);
      setImgLoadError(false);
      try {
        const compressedUrl = await compressAndResizeImage(file);
        setLogoUrl(compressedUrl);
      } catch (err) {
        alert('Erro ao carregar a imagem. Certifique-se de enviar uma imagem PNG, JPG ou WEBP válida.');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleApplyUrl = () => {
    if (inputUrl.trim()) {
      setImgLoadError(false);
      setLogoUrl(formatImageUrl(inputUrl.trim()));
      setInputUrl('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSaveCompanyConfig(name.trim(), logoUrl);
    setSuccessMsg(true);
    setTimeout(() => {
      setSuccessMsg(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-xl bg-zinc-950 border border-amber-500/40 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-900/40 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-300">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-amber-100">
                Logotipo & Identidade da Sua Empresa
              </h2>
              <p className="text-xs text-zinc-400">
                O logotipo será inserido nos cabeçalhos, certificados digitais e impressão em PDF
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-amber-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {successMsg ? (
          <div className="py-10 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400 animate-bounce">
              <Check className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-amber-200">Logotipo Atualizado com Sucesso!</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Sua marca <strong className="text-amber-300">{name}</strong> agora exibe o logotipo oficial em toda a aplicação e nos documentos emitidos.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 text-xs text-zinc-200">
            
            {/* Logo Preview Badge */}
            <div className="p-4 bg-zinc-900/90 rounded-2xl border border-amber-900/40 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-semibold">Pré-visualização do Seu Logotipo:</span>
                <strong className="text-sm font-serif font-bold text-amber-200 block">{name || 'Nome da Empresa'}</strong>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] text-zinc-500">Fundo para prévia:</span>
                  <button
                    type="button"
                    onClick={() => setPreviewBg('white')}
                    className={`px-2 py-0.5 text-[10px] rounded border ${previewBg === 'white' ? 'bg-white text-zinc-950 font-bold border-amber-400' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}
                  >
                    Claro
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewBg('dark')}
                    className={`px-2 py-0.5 text-[10px] rounded border ${previewBg === 'dark' ? 'bg-zinc-800 text-amber-200 font-bold border-amber-400' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}
                  >
                    Escuro
                  </button>
                </div>
              </div>

              {/* Preview Box */}
              <div className={`w-20 h-20 rounded-2xl border-2 border-amber-500/50 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-lg shadow-amber-900/30 transition-colors ${previewBg === 'white' ? 'bg-white' : 'bg-zinc-900'}`}>
                {isProcessing ? (
                  <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
                ) : logoUrl && !imgLoadError ? (
                  <img
                    src={formatImageUrl(logoUrl)}
                    alt="Logo Preview"
                    className="w-full h-full object-contain rounded-xl"
                    referrerPolicy="no-referrer"
                    onError={() => setImgLoadError(true)}
                  />
                ) : (
                  <div className="text-center p-1">
                    <Building2 className={`w-7 h-7 mx-auto ${previewBg === 'white' ? 'text-zinc-800' : 'text-amber-400'}`} />
                    <span className="text-[8px] text-amber-600 block mt-0.5">Sem Imagem</span>
                  </div>
                )}
              </div>
            </div>

            {/* Field: Company Name */}
            <div>
              <label className="block text-zinc-300 font-medium mb-1">Nome da Joalheria / Empresa *</label>
              <input
                type="text"
                required
                placeholder="Ex: Montebello Haute Joaillerie"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-amber-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Option A: Upload File */}
            <div className="space-y-2">
              <label className="block text-zinc-300 font-medium">1. Enviar Arquivo de Logotipo (PNG, JPG, SVG)</label>
              <label className="flex items-center justify-center gap-3 p-4 bg-zinc-900/80 border-2 border-dashed border-amber-500/40 rounded-2xl cursor-pointer hover:border-amber-400 hover:bg-zinc-900 transition-all text-amber-300">
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
                    <span className="font-semibold text-xs">Otimizando e processando imagem...</span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-amber-400" />
                    <span className="font-semibold text-xs">Clique para selecionar o arquivo do seu computador</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={isProcessing}
                  className="hidden"
                />
              </label>
            </div>

            {/* Option B: Enter Image URL */}
            <div className="space-y-2">
              <label className="block text-zinc-300 font-medium">2. Ou Cole a URL Direta da Imagem</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://exemplo.com/meu-logotipo.png"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  className="flex-1 p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-amber-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-amber-200 font-semibold rounded-xl shrink-0"
                >
                  Usar URL
                </button>
              </div>
            </div>

            {/* Option C: Presets */}
            <div className="space-y-2">
              <label className="block text-zinc-300 font-medium">3. Ou Escolha um Emblema Luxuoso Modelo</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {LUXURY_LOGO_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setImgLoadError(false);
                      setLogoUrl(preset.url);
                    }}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-2 bg-zinc-900 text-left transition-all ${
                      logoUrl === preset.url
                        ? 'border-amber-400 ring-2 ring-amber-500/50 bg-amber-500/10'
                        : 'border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <img src={preset.url} alt={preset.name} className="w-10 h-10 object-cover rounded-lg" />
                    <span className="text-[10px] text-zinc-400 text-center line-clamp-1">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-zinc-950 font-bold rounded-xl shadow-xl transition-all text-xs uppercase tracking-wider disabled:opacity-50"
            >
              Aplicar Logotipo em Todos os Certificados
            </button>

          </form>
        )}

      </div>
    </div>
  );
};
