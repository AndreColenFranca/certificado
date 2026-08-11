import { JewelryCertificate } from '../types';

export const INITIAL_CERTIFICATES: JewelryCertificate[] = [
  {
    id: 'CERT-2026-A8F9',
    serialNumber: 'SN-18K-99042',
    title: 'Anel Solitário Étoile Royale',
    collection: 'High Jewelry Solitaires 2026',
    model: 'Solitaire Étoile 1.20ct',
    manufacturer: 'Maison Lumière Joias',
    manufacturerLogoUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=150&auto=format&fit=crop&q=80',
    manufacturingDate: '2026-02-14',
    issueDate: '2026-02-18',
    currentOwnerName: 'Helena Cavalcanti de Albuquerque',
    ownerCpf: '123.456.789-01',
    ownerEmail: 'helena.albuquerque@maisonlumiere.com.br',
    ownerId: 'CLI-1001',
    metalPurity: '18K (750)',
    metalColor: 'Ouro Amarelo',
    grossWeightGrams: 4.85,
    widthCm: 0.4,
    finish: 'Polido Espelhado',
    hasStones: true,
    stones: [
      {
        id: 'st-1',
        type: 'Diamante Natural',
        quantity: 1,
        caratWeight: 1.20,
        cutShape: 'Brilhante Redondo',
        colorGrade: 'F (Incolor Raro)',
        clarityGrade: 'VVS1 (Praticamente Impecável)',
        settingType: 'Garra'
      },
      {
        id: 'st-2',
        type: 'Diamante Natural',
        quantity: 12,
        caratWeight: 0.18,
        cutShape: 'Brilhante Redondo',
        colorGrade: 'G',
        clarityGrade: 'VS1',
        settingType: 'Pavê'
      }
    ],
    images: [
      'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1598560917505-59a3ad559071?w=1200&auto=format&fit=crop&q=80'
    ],
    frames360: [
      'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1598560917505-59a3ad559071?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80'
    ],
    warrantyMonths: -1,
    warrantyTerms: 'Garantia Vitalícia de Autenticidade do Ouro 18K e Diamantes Naturais. Inclui banho de polimento gratuito anual.',
    warrantyStatus: 'Vitalícia',
    authenticityHash: '0x8f9a2e4b7c1d90a5e3f21081977a45bc3829d10e',
    estimatedValueBRL: 42500,
    careGuide: [
      {
        category: 'Limpeza',
        title: 'Higienização de Diamantes',
        description: 'Lave suavemente com água morna, sabão neutro e uma escova de cerdas extra macias. Seque com flanela de microfibra sem fiapos.'
      },
      {
        category: 'Uso Diário',
        title: 'Evitar Impactos Diretos',
        description: 'Embora o diamante seja o mineral mais duro do mundo, a estrutura de garras do anel pode sofrer deformação sob forte pressão mecânica.'
      },
      {
        category: 'Armazenamento',
        title: 'Acomodação Individual',
        description: 'Guarde o anel em sua caixinha individual aveludada para evitar arranhões no metal 18K provocados por outras joias.'
      },
      {
        category: 'Inspeção Profissional',
        title: 'Revisão Anual de Garras',
        description: 'Recomendamos trazer o anel a uma de nossas ateliers a cada 12 meses para verificação do aperto das garras do brilhante principal.'
      }
    ],
    maintenanceHistory: [
      {
        id: 'm-1',
        date: '2026-02-18',
        type: 'Certificação Inicial',
        performer: 'Atelier Central Maison Lumière',
        notes: 'Emissão do certificado digital com análise gemológica e selo de garantia de origem.',
        verifiedByAppraiser: 'Dra. Sofia Martins (GIA Gemologist ID #8842)'
      },
      {
        id: 'm-2',
        date: '2026-06-10',
        type: 'Inspeção de Qualidade',
        performer: 'Maison Lumière Flagship SP',
        notes: 'Revisão das garras e limpeza ultrassônica preventiva executada com sucesso.',
        verifiedByAppraiser: 'Atelier Técnico SP'
      }
    ],
    createdAt: '2026-02-18T10:00:00.000Z',
    updatedAt: '2026-06-10T14:30:00.000Z'
  },
  {
    id: 'CERT-2026-B3K2',
    serialNumber: 'SN-PT-88310',
    title: 'Colar Esmeralda Imperial Colombiana',
    collection: 'Royal Emeralds & Platinum',
    model: 'Goutte d\'Émeraude 2.85ct',
    manufacturer: 'Royal Gem Craftsmen',
    manufacturerLogoUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=150&auto=format&fit=crop&q=80',
    manufacturingDate: '2026-01-20',
    issueDate: '2026-01-25',
    currentOwnerName: 'Dra. Beatriz Montebello',
    ownerCpf: '234.567.890-12',
    ownerEmail: 'beatriz.montebello@montebello.adv.br',
    ownerId: 'CLI-1002',
    metalPurity: 'Platina 950',
    metalColor: 'Platina',
    grossWeightGrams: 14.20,
    finish: 'Rodinado Premium',
    hasStones: true,
    stones: [
      {
        id: 'st-col-1',
        type: 'Esmeralda Colombiana',
        quantity: 1,
        caratWeight: 2.85,
        cutShape: 'Gota (Pear)',
        colorGrade: 'Verde Intenso (Vivid Green)',
        clarityGrade: 'Excelente Transparência Natural',
        settingType: 'Bisel/Inglês'
      },
      {
        id: 'st-col-2',
        type: 'Diamante Natural',
        quantity: 28,
        caratWeight: 1.45,
        cutShape: 'Baguete',
        colorGrade: 'E-F',
        clarityGrade: 'VVS2',
        settingType: 'Trilho'
      }
    ],
    images: [
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1611591475116-2c9398845e2c?w=1200&auto=format&fit=crop&q=80'
    ],
    frames360: [
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1611591475116-2c9398845e2c?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80'
    ],
    warrantyMonths: 60,
    warrantyTerms: '5 anos de garantia internacional cobrindo fecho, montagem de platina e banho protetor.',
    warrantyStatus: 'Ativa',
    authenticityHash: '0xb3k2f81a7d6e4c309081237ef82110c9a421b8d2',
    estimatedValueBRL: 89000,
    careGuide: [
      {
        category: 'Produtos Químicos',
        title: 'Cuidado Especial com Esmeraldas',
        description: 'NUNCA exponha a esmeralda a produtos químicos, perfumes, sprays de cabelo ou água fervente. Esmeraldas possuem microfissuras naturais preenchidas com óleo fino orgânico.',
        warning: 'Proibido uso de aparelhos de ultrassom ou vapor aquecido para limpeza desta joia.'
      },
      {
        category: 'Limpeza',
        title: 'Limpeza Manual Delicada',
        description: 'Utilize apenas pano macio levemente umedecido em água fria e sabão de glicerina neutra.'
      }
    ],
    maintenanceHistory: [
      {
        id: 'm-b3',
        date: '2026-01-25',
        type: 'Certificação Inicial',
        performer: 'Royal Gem Craftsmen Gemology Lab',
        notes: 'Certificação de origem colombiana Muzo Mine com laudo de autenticidade da esmeralda.',
        verifiedByAppraiser: 'Prof. Carlos Eduardo Siqueira'
      }
    ],
    createdAt: '2026-01-25T11:00:00.000Z',
    updatedAt: '2026-01-25T11:00:00.000Z'
  },
  {
    id: 'CERT-2026-C7M4',
    serialNumber: 'SN-18KW-44129',
    title: 'Brincos Safira Ceylon & Diamantes',
    collection: 'Océan Profond Haute Joaillerie',
    model: 'Boucles Ceylon Drops',
    manufacturer: 'Maison Lumière Joias',
    manufacturerLogoUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=150&auto=format&fit=crop&q=80',
    manufacturingDate: '2025-11-10',
    issueDate: '2025-11-15',
    currentOwnerName: 'Isabela Fontes de Mello',
    ownerCpf: '345.678.901-23',
    ownerEmail: 'isabela.mello@melloart.com',
    ownerId: 'CLI-1003',
    metalPurity: '18K (750)',
    metalColor: 'Ouro Branco',
    grossWeightGrams: 8.10,
    finish: 'Rodinado Premium',
    hasStones: true,
    stones: [
      {
        id: 'st-c1',
        type: 'Safira Ceylon',
        quantity: 2,
        caratWeight: 3.10,
        cutShape: 'Oval',
        colorGrade: 'Azul Cobre Royal Blue',
        clarityGrade: 'VVS',
        settingType: 'Garra'
      },
      {
        id: 'st-c2',
        type: 'Diamante Natural',
        quantity: 16,
        caratWeight: 0.80,
        cutShape: 'Marquise',
        colorGrade: 'F',
        clarityGrade: 'VS1',
        settingType: 'Pavê'
      }
    ],
    images: [
      'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=1200&auto=format&fit=crop&q=80'
    ],
    frames360: [
      'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80'
    ],
    warrantyMonths: 36,
    warrantyTerms: '3 anos de garantia cobrindo tarraxas de segurança Omega Lock e banho de ródio.',
    warrantyStatus: 'Ativa',
    authenticityHash: '0xc7m4a09e2b1d38742129038f88a91b2c4019e078',
    estimatedValueBRL: 36800,
    careGuide: [
      {
        category: 'Limpeza',
        title: 'Manutenção do Ouro Branco',
        description: 'O banho de ródio protege o brilho prateado do ouro branco. Higienize com sabão líquido neutro e água corrente.'
      },
      {
        category: 'Armazenamento',
        title: 'Cuidado com Tarraxas',
        description: 'Verifique se a travinha de segurança deu o clique característico ao vestir para evitar perdas acidentais.'
      }
    ],
    maintenanceHistory: [
      {
        id: 'm-c1',
        date: '2025-11-15',
        type: 'Certificação Inicial',
        performer: 'Maison Lumière Atelier',
        notes: 'Emissão do certificado e laudo gemológico das safiras do Sri Lanka.'
      }
    ],
    createdAt: '2025-11-15T09:00:00.000Z',
    updatedAt: '2025-11-15T09:00:00.000Z'
  },
  {
    id: 'CERT-2026-D9P1',
    serialNumber: 'SN-14KR-30211',
    title: 'Pulseira Riviera Ouro Rosa & Rubis',
    collection: 'Velvet Passion Riviera',
    model: 'Riviera Rubis 4.20ct',
    manufacturer: 'Aurelia Fine Jewelry',
    manufacturerLogoUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=150&auto=format&fit=crop&q=80',
    manufacturingDate: '2026-03-01',
    issueDate: '2026-03-05',
    currentOwnerName: 'Mariana Vasconcelos',
    ownerCpf: '456.789.012-34',
    ownerEmail: 'mariana.vasconcelos@design.com.br',
    ownerId: 'CLI-1004',
    metalPurity: '14K (585)',
    metalColor: 'Ouro Rosa',
    grossWeightGrams: 11.50,
    finish: 'Escovado Satinado',
    hasStones: true,
    stones: [
      {
        id: 'st-d1',
        type: 'Rubi Birmanês',
        quantity: 42,
        caratWeight: 4.20,
        cutShape: 'Brilhante Redondo',
        colorGrade: 'Vermelho Sangue de Pombo (Pigeon Blood)',
        clarityGrade: 'Alta Transparência',
        settingType: 'Garra'
      }
    ],
    images: [
      'https://images.unsplash.com/photo-1611591475116-2c9398845e2c?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1598560917505-59a3ad559071?w=1200&auto=format&fit=crop&q=80'
    ],
    frames360: [
      'https://images.unsplash.com/photo-1611591475116-2c9398845e2c?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1598560917505-59a3ad559071?w=800&auto=format&fit=crop&q=80'
    ],
    warrantyMonths: 24,
    warrantyTerms: '2 anos de garantia integral cobrindo fecho duplo com trava de segurança extra.',
    warrantyStatus: 'Ativa',
    authenticityHash: '0xd9p1290a187b5c401928374e201b903c81212abf',
    estimatedValueBRL: 28900,
    careGuide: [
      {
        category: 'Uso Diário',
        title: 'Flexibilidade e Articulação',
        description: 'Não dobre a pulseira Riviera além do seu raio de curvatura natural para preservar os pinos de articulação internos.'
      }
    ],
    maintenanceHistory: [
      {
        id: 'm-d1',
        date: '2026-03-05',
        type: 'Certificação Inicial',
        performer: 'Aurelia Fine Jewelry Studio',
        notes: 'Emissão e verificação de torque de fecho.'
      }
    ],
    createdAt: '2026-03-05T14:00:00.000Z',
    updatedAt: '2026-03-05T14:00:00.000Z'
  },
  {
    id: 'CERT-2026-E5R8',
    serialNumber: 'SN-18KP-11209',
    title: 'Gargantilha Ponto de Luz Diamante Fancy Pink',
    collection: 'High Jewelry Solitaires 2026',
    model: 'Gargantilha Étoile Rose 0.85ct',
    manufacturer: 'Maison Lumière Joias',
    manufacturerLogoUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=150&auto=format&fit=crop&q=80',
    manufacturingDate: '2026-03-10',
    issueDate: '2026-03-12',
    currentOwnerName: 'Helena Cavalcanti de Albuquerque',
    ownerCpf: '123.456.789-01',
    ownerEmail: 'helena.albuquerque@maisonlumiere.com.br',
    ownerId: 'CLI-1001',
    metalPurity: '18K (750)',
    metalColor: 'Ouro Rosa',
    grossWeightGrams: 5.20,
    finish: 'Polido Espelhado',
    hasStones: true,
    stones: [
      {
        id: 'st-e1',
        type: 'Diamante Natural',
        quantity: 1,
        caratWeight: 0.85,
        cutShape: 'Gota / Pera',
        colorGrade: 'Fancy Pink Natural',
        clarityGrade: 'VVS2',
        settingType: 'Garra (Prong)'
      }
    ],
    images: [
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=1200&auto=format&fit=crop&q=80'
    ],
    frames360: [
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&auto=format&fit=crop&q=80'
    ],
    warrantyMonths: -1,
    warrantyTerms: 'Garantia Vitalícia Maison Lumière para Diamantes Naturais Raros e liga de Ouro Rosa 18K.',
    warrantyStatus: 'Vitalícia',
    authenticityHash: '0xe5r89102c91a739d481230f8123bc910a9101ff2',
    estimatedValueBRL: 64000,
    careGuide: [
      {
        category: 'Limpeza',
        title: 'Manutenção de Ouro Rosa e Diamante Pink',
        description: 'Lave suavemente com flanela especial e solução neutra.'
      }
    ],
    maintenanceHistory: [
      {
        id: 'm-e1',
        date: '2026-03-12',
        type: 'Certificação Inicial',
        performer: 'Atelier Central Maison Lumière',
        notes: 'Emissão de certificado de diamante pink raro com laudo de autenticidade.'
      }
    ],
    createdAt: '2026-03-12T10:00:00.000Z',
    updatedAt: '2026-03-12T10:00:00.000Z'
  }
];
