import { useState, useEffect } from 'react';
import { Gem, ChevronRight, Settings } from 'lucide-react';
import { AttributeManager } from './AttributeManager';

type AttributeType = 'collections' | 'manufacturers' | 'metal_purities' | 'metal_colors' | 'finishes' | 'stone_types' | 'setting_types' | 'cut_shapes' | 'color_grades';

interface Attribute {
  key: AttributeType;
  label: string;
  description: string;
  icon: string;
}

const ATTRIBUTES: Attribute[] = [
  {
    key: 'collections',
    label: 'Coleção',
    description: 'Gerenciar coleções de joias',
    icon: '💎'
  },
  {
    key: 'manufacturers',
    label: 'Fabricante / Marca',
    description: 'Gerenciar fabricantes e marcas',
    icon: '🏭'
  },
  {
    key: 'metal_purities',
    label: 'Metal',
    description: 'Gerenciar pureza do metal (ex: 18K, 14K)',
    icon: '⚙️'
  },
  {
    key: 'metal_colors',
    label: 'Cor',
    description: 'Gerenciar cores de metal (ex: ouro, prata)',
    icon: '🎨'
  },
  {
    key: 'finishes',
    label: 'Acabamento',
    description: 'Gerenciar tipos de acabamento',
    icon: '✨'
  },
  {
    key: 'stone_types',
    label: 'Tipo da Gema',
    description: 'Gerenciar tipos de gemas (ex: diamante, esmeralda)',
    icon: '💠'
  },
  {
    key: 'setting_types',
    label: 'Tipo de Cravação',
    description: 'Gerenciar tipos de cravação (ex: garras, pavê)',
    icon: '🔗'
  },
  {
    key: 'cut_shapes',
    label: 'Lapidação / Formato',
    description: 'Gerenciar formatos de lapidação (ex: redondo, oval)',
    icon: '💎'
  },
  {
    key: 'color_grades',
    label: 'Cor / Graduação',
    description: 'Gerenciar graduações de cor de diamantes',
    icon: '🌈'
  }
];

interface AttributesViewProps {
  onSelectAttribute?: (attributeKey: AttributeType) => void;
}

const ATTRIBUTE_CONFIG: Record<AttributeType, { endpoint: string; label: string }> = {
  collections: { endpoint: '/api/collections', label: 'Coleção' },
  manufacturers: { endpoint: '/api/manufacturers', label: 'Fabricante / Marca' },
  metal_purities: { endpoint: '/api/metal-purities', label: 'Metal' },
  metal_colors: { endpoint: '/api/metal-colors', label: 'Cor' },
  finishes: { endpoint: '/api/finishes', label: 'Acabamento' },
  stone_types: { endpoint: '/api/stone-types', label: 'Tipo da Gema' },
  setting_types: { endpoint: '/api/setting-types', label: 'Tipo de Cravação' },
  cut_shapes: { endpoint: '/api/cut-shapes', label: 'Lapidação / Formato' },
  color_grades: { endpoint: '/api/color-grades', label: 'Cor / Graduação' }
};

export const AttributesView: React.FC<AttributesViewProps> = ({ onSelectAttribute }) => {
  const [selectedAttribute, setSelectedAttribute] = useState<AttributeType | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('selectedAttributeKey');
    if (stored && stored in ATTRIBUTE_CONFIG) {
      setSelectedAttribute(stored as AttributeType);
    }
  }, []);

  if (selectedAttribute) {
    const config = ATTRIBUTE_CONFIG[selectedAttribute];
    return (
      <AttributeManager
        title={config.label}
        endpoint={config.endpoint}
        onBack={() => {
          setSelectedAttribute(null);
          sessionStorage.removeItem('selectedAttributeKey');
        }}
      />
    );
  }

  const handleSelectAttribute = (attr: AttributeType) => {
    setSelectedAttribute(attr);
    sessionStorage.setItem('selectedAttributeKey', attr);
    onSelectAttribute?.(attr);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-amber-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Gem className="w-8 h-8 text-amber-500" />
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
                Atributos de Peças
              </h1>
              <p className="text-xs text-zinc-400 mt-1">Gerencie todos os atributos utilizados no cadastro de joias</p>
            </div>
          </div>
        </div>

        {/* Attributes List */}
        <div className="space-y-3">
          {ATTRIBUTES.map((attr) => (
            <button
              key={attr.key}
              onClick={() => handleSelectAttribute(attr.key)}
              className={`w-full p-4 rounded-lg border-2 transition-all text-left flex items-center justify-between group cursor-pointer ${
                selectedAttribute === attr.key
                  ? 'bg-amber-500/20 border-amber-500 shadow-lg shadow-amber-950/30'
                  : 'bg-zinc-900/50 border-amber-900/30 hover:bg-zinc-900 hover:border-amber-500/60'
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="text-2xl">{attr.icon}</span>
                <div>
                  <h3 className="font-bold text-amber-100 group-hover:text-amber-300 transition">{attr.label}</h3>
                  <p className="text-xs text-zinc-400 mt-1">{attr.description}</p>
                </div>
              </div>
              <ChevronRight className={`w-5 h-5 text-amber-500 transition-transform ${
                selectedAttribute === attr.key ? 'translate-x-2' : ''
              }`} />
            </button>
          ))}
        </div>

        {/* Info Box */}
        <div className="mt-8 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg flex gap-3">
          <Settings className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-200">
            <p className="font-semibold">Dica:</p>
            <p className="text-xs mt-1">
              Selecione um atributo para gerenciar (adicionar, editar ou remover) seus valores.
              Essas informações serão utilizadas nos formulários de cadastro de joias.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
