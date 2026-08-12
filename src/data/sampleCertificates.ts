import { JewelryCertificate } from '../types';

export const INITIAL_CERTIFICATES: JewelryCertificate[] = [
  // --- JOIAS RAIZ / PAI / MODELOS BASE DO ACERVO (isRoot: true, NUNCA vinculadas a clientes) ---
  {
    id: 'CERT-2026-A8F9',
    isRoot: true,
    serialNumber: 'SN-18K-99042',
    title: 'Anel Solitário Étoile Royale',
    collection: 'High Jewelry Solitaires 2026',
    model: 'Solitaire Étoile 1.20ct',
    manufacturer: 'Maison Lumière Joias',
    manufacturerLogoUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=150&auto=format&fit=crop&q=80',
    manufacturingDate: '2026-02-14',
    issueDate: '2026-02-14',
    currentOwnerName: undefined,
    ownerCpf: undefined,
    ownerEmail: undefined,
    ownerId: undefined,
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
      'https://images.unsplash.com/photo-1598560917505-59a3ad559071?w=800&auto=format&fit=crop&q=80'
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
        description: 'Lave suavemente com água morna, sabão neutro e uma escova de cerdas extra macias.'
      }
    ],
    maintenanceHistory: [
      {
        id: 'm-root-1',
        date: '2026-02-14',
        type: 'Certificação Inicial',
        performer: 'Atelier Central Maison Lumière',
        notes: 'Cadastro do Modelo Raiz / Matriz no acervo da joalheria.'
      }
    ],
    createdAt: '2026-02-14T10:00:00.000Z',
    updatedAt: '2026-02-14T10:00:00.000Z'
  },
  {
    id: 'CERT-2026-B3K2',
    isRoot: true,
    serialNumber: 'SN-PT-88310',
    title: 'Colar Esmeralda Imperial Colombiana',
    collection: 'Royal Emeralds & Platinum',
    model: 'Goutte d\'Émeraude 2.85ct',
    manufacturer: 'Royal Gem Craftsmen',
    manufacturerLogoUrl: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=150&auto=format&fit=crop&q=80',
    manufacturingDate: '2026-01-20',
    issueDate: '2026-01-20',
    currentOwnerName: undefined,
    ownerCpf: undefined,
    ownerEmail: undefined,
    ownerId: undefined,
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
      }
    ],
    images: [
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1611591475116-2c9398845e2c?w=1200&auto=format&fit=crop&q=80'
    ],
    frames360: [],
    warrantyMonths: 60,
    warrantyTerms: '5 anos de garantia internacional cobrindo fecho, montagem de platina e banho protetor.',
    warrantyStatus: 'Ativa',
    authenticityHash: '0xb3k2f81a7d6e4c309081237ef82110c9a421b8d2',
    estimatedValueBRL: 89000,
    careGuide: [],
    maintenanceHistory: [
      {
        id: 'm-root-2',
        date: '2026-01-20',
        type: 'Certificação Inicial',
        performer: 'Royal Gem Craftsmen Gemology Lab',
        notes: 'Cadastro do Modelo Raiz / Matriz de Esmeralda Colombiana.'
      }
    ],
    createdAt: '2026-01-20T11:00:00.000Z',
    updatedAt: '2026-01-20T11:00:00.000Z'
  },
  {
    id: 'CERT-2026-C7M4',
    isRoot: true,
    serialNumber: 'SN-18KW-44129',
    title: 'Brincos Safira Ceylon & Diamantes',
    collection: 'Océan Profond Haute Joaillerie',
    model: 'Boucles Ceylon Drops',
    manufacturer: 'Maison Lumière Joias',
    manufacturerLogoUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=150&auto=format&fit=crop&q=80',
    manufacturingDate: '2025-11-10',
    issueDate: '2025-11-10',
    currentOwnerName: undefined,
    ownerCpf: undefined,
    ownerEmail: undefined,
    ownerId: undefined,
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
      }
    ],
    images: [
      'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=1200&auto=format&fit=crop&q=80'
    ],
    frames360: [],
    warrantyMonths: 36,
    warrantyTerms: '3 anos de garantia cobrindo tarraxas de segurança Omega Lock e banho de ródio.',
    warrantyStatus: 'Ativa',
    authenticityHash: '0xc7m4a09e2b1d38742129038f88a91b2c4019e078',
    estimatedValueBRL: 36800,
    careGuide: [],
    maintenanceHistory: [],
    createdAt: '2025-11-10T09:00:00.000Z',
    updatedAt: '2025-11-10T09:00:00.000Z'
  },
  {
    id: 'CERT-2026-D9P1',
    isRoot: true,
    serialNumber: 'SN-14KR-30211',
    title: 'Pulseira Riviera Ouro Rosa & Rubis',
    collection: 'Velvet Passion Riviera',
    model: 'Riviera Rubis 4.20ct',
    manufacturer: 'Aurelia Fine Jewelry',
    manufacturerLogoUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=150&auto=format&fit=crop&q=80',
    manufacturingDate: '2026-03-01',
    issueDate: '2026-03-01',
    currentOwnerName: undefined,
    ownerCpf: undefined,
    ownerEmail: undefined,
    ownerId: undefined,
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
      'https://images.unsplash.com/photo-1611591475116-2c9398845e2c?w=1200&auto=format&fit=crop&q=80'
    ],
    frames360: [],
    warrantyMonths: 24,
    warrantyTerms: '2 anos de garantia integral cobrindo fecho duplo com trava de segurança extra.',
    warrantyStatus: 'Ativa',
    authenticityHash: '0xd9p1290a187b5c401928374e201b903c81212abf',
    estimatedValueBRL: 28900,
    careGuide: [],
    maintenanceHistory: [],
    createdAt: '2026-03-01T14:00:00.000Z',
    updatedAt: '2026-03-01T14:00:00.000Z'
  },
  {
    id: 'CERT-2026-E5R8',
    isRoot: true,
    serialNumber: 'SN-18KP-11209',
    title: 'Gargantilha Ponto de Luz Diamante Fancy Pink',
    collection: 'High Jewelry Solitaires 2026',
    model: 'Gargantilha Étoile Rose 0.85ct',
    manufacturer: 'Maison Lumière Joias',
    manufacturerLogoUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=150&auto=format&fit=crop&q=80',
    manufacturingDate: '2026-03-10',
    issueDate: '2026-03-10',
    currentOwnerName: undefined,
    ownerCpf: undefined,
    ownerEmail: undefined,
    ownerId: undefined,
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
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1200&auto=format&fit=crop&q=80'
    ],
    frames360: [],
    warrantyMonths: -1,
    warrantyTerms: 'Garantia Vitalícia Maison Lumière para Diamantes Naturais Raros e liga de Ouro Rosa 18K.',
    warrantyStatus: 'Vitalícia',
    authenticityHash: '0xe5r89102c91a739d481230f8123bc910a9101ff2',
    estimatedValueBRL: 64000,
    careGuide: [],
    maintenanceHistory: [],
    createdAt: '2026-03-10T10:00:00.000Z',
    updatedAt: '2026-03-10T10:00:00.000Z'
  },

  // --- JOIAS FILHAS DOS CLIENTES (isRoot: false, vinculadas ao modelo pai por parentCertId) ---
  {
    id: 'CERT-2026-A8F9-CLI1001',
    isRoot: false,
    parentCertId: 'CERT-2026-A8F9',
    serialNumber: 'SN-18K-99042-01',
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
      }
    ],
    images: [
      'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=1200&auto=format&fit=crop&q=80'
    ],
    frames360: [],
    warrantyMonths: -1,
    warrantyTerms: 'Garantia Vitalícia de Autenticidade do Ouro 18K e Diamantes Naturais.',
    warrantyStatus: 'Vitalícia',
    authenticityHash: '0x8f9a2e4b7c1d90a5e3f21081977a45bc3829d10e-cli1',
    estimatedValueBRL: 42500,
    careGuide: [],
    maintenanceHistory: [
      {
        id: 'm-cli1-1',
        date: '2026-02-18',
        type: 'Emissão de Certificado',
        performer: 'Atelier Central Maison Lumière',
        notes: 'Emissão de passaporte digital individual para Helena Cavalcanti de Albuquerque.',
        customerId: 'CLI-1001',
        customerName: 'Helena Cavalcanti de Albuquerque'
      }
    ],
    createdAt: '2026-02-18T10:00:00.000Z',
    updatedAt: '2026-02-18T10:00:00.000Z'
  },
  {
    id: 'CERT-2026-B3K2-CLI1002',
    isRoot: false,
    parentCertId: 'CERT-2026-B3K2',
    serialNumber: 'SN-PT-88310-01',
    title: 'Colar Esmeralda Imperial Colombiana',
    collection: 'Royal Emeralds & Platinum',
    model: 'Goutte d\'Émeraude 2.85ct',
    manufacturer: 'Royal Gem Craftsmen',
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
      }
    ],
    images: [
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1200&auto=format&fit=crop&q=80'
    ],
    frames360: [],
    warrantyMonths: 60,
    warrantyTerms: '5 anos de garantia internacional.',
    warrantyStatus: 'Ativa',
    authenticityHash: '0xb3k2f81a7d6e4c309081237ef82110c9a421b8d2-cli2',
    estimatedValueBRL: 89000,
    careGuide: [],
    maintenanceHistory: [
      {
        id: 'm-cli2-1',
        date: '2026-01-25',
        type: 'Emissão de Certificado',
        performer: 'Royal Gem Craftsmen Gemology Lab',
        notes: 'Emissão do passaporte digital de aquisição para Dra. Beatriz Montebello.',
        customerId: 'CLI-1002',
        customerName: 'Dra. Beatriz Montebello'
      }
    ],
    createdAt: '2026-01-25T11:00:00.000Z',
    updatedAt: '2026-01-25T11:00:00.000Z'
  },
  {
    id: 'CERT-2026-C7M4-CLI1003',
    isRoot: false,
    parentCertId: 'CERT-2026-C7M4',
    serialNumber: 'SN-18KW-44129-01',
    title: 'Brincos Safira Ceylon & Diamantes',
    collection: 'Océan Profond Haute Joaillerie',
    model: 'Boucles Ceylon Drops',
    manufacturer: 'Maison Lumière Joias',
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
      }
    ],
    images: [
      'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=1200&auto=format&fit=crop&q=80'
    ],
    frames360: [],
    warrantyMonths: 36,
    warrantyTerms: '3 anos de garantia cobrindo tarraxas de segurança Omega Lock.',
    warrantyStatus: 'Ativa',
    authenticityHash: '0xc7m4a09e2b1d38742129038f88a91b2c4019e078-cli3',
    estimatedValueBRL: 36800,
    careGuide: [],
    maintenanceHistory: [
      {
        id: 'm-cli3-1',
        date: '2025-11-15',
        type: 'Emissão de Certificado',
        performer: 'Maison Lumière Atelier',
        notes: 'Emissão do passaporte para Isabela Fontes de Mello.',
        customerId: 'CLI-1003',
        customerName: 'Isabela Fontes de Mello'
      }
    ],
    createdAt: '2025-11-15T09:00:00.000Z',
    updatedAt: '2025-11-15T09:00:00.000Z'
  },
  {
    id: 'CERT-2026-D9P1-CLI1004',
    isRoot: false,
    parentCertId: 'CERT-2026-D9P1',
    serialNumber: 'SN-14KR-30211-01',
    title: 'Pulseira Riviera Ouro Rosa & Rubis',
    collection: 'Velvet Passion Riviera',
    model: 'Riviera Rubis 4.20ct',
    manufacturer: 'Aurelia Fine Jewelry',
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
      'https://images.unsplash.com/photo-1611591475116-2c9398845e2c?w=1200&auto=format&fit=crop&q=80'
    ],
    frames360: [],
    warrantyMonths: 24,
    warrantyTerms: '2 anos de garantia integral.',
    warrantyStatus: 'Ativa',
    authenticityHash: '0xd9p1290a187b5c401928374e201b903c81212abf-cli4',
    estimatedValueBRL: 28900,
    careGuide: [],
    maintenanceHistory: [
      {
        id: 'm-cli4-1',
        date: '2026-03-05',
        type: 'Emissão de Certificado',
        performer: 'Aurelia Fine Jewelry Studio',
        notes: 'Emissão do passaporte digital para Mariana Vasconcelos.',
        customerId: 'CLI-1004',
        customerName: 'Mariana Vasconcelos'
      }
    ],
    createdAt: '2026-03-05T14:00:00.000Z',
    updatedAt: '2026-03-05T14:00:00.000Z'
  },
  {
    id: 'CERT-2026-E5R8-CLI1001',
    isRoot: false,
    parentCertId: 'CERT-2026-E5R8',
    serialNumber: 'SN-18KP-11209-01',
    title: 'Gargantilha Ponto de Luz Diamante Fancy Pink',
    collection: 'High Jewelry Solitaires 2026',
    model: 'Gargantilha Étoile Rose 0.85ct',
    manufacturer: 'Maison Lumière Joias',
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
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1200&auto=format&fit=crop&q=80'
    ],
    frames360: [],
    warrantyMonths: -1,
    warrantyTerms: 'Garantia Vitalícia Maison Lumière para Diamantes Naturais Raros.',
    warrantyStatus: 'Vitalícia',
    authenticityHash: '0xe5r89102c91a739d481230f8123bc910a9101ff2-cli1',
    estimatedValueBRL: 64000,
    careGuide: [],
    maintenanceHistory: [
      {
        id: 'm-cli1-2',
        date: '2026-03-12',
        type: 'Emissão de Certificado',
        performer: 'Atelier Central Maison Lumière',
        notes: 'Emissão do passaporte digital de diamante pink raro para Helena Cavalcanti de Albuquerque.',
        customerId: 'CLI-1001',
        customerName: 'Helena Cavalcanti de Albuquerque'
      }
    ],
    createdAt: '2026-03-12T10:00:00.000Z',
    updatedAt: '2026-03-12T10:00:00.000Z'
  }
];
