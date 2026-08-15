export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: 'root' | 'admin' | 'operator' | 'customer';
  createdAt: string;
  isRoot?: boolean;
  customerId?: string;
  cpf?: string;
  orgId?: string;
}

export type MetalPurity = string;

export type MetalColor = string;

export type FinishType = string;

export type StoneType = string;

export interface StoneDetail {
  id: string;
  type: StoneType;
  quantity: number;
  caratWeight: number; // total carats or per stone
  cutShape?: string;
  colorGrade?: string;
  clarityGrade?: string;
  settingType?: string;
}

export interface MaintenanceRecord {
  id: string;
  date: string; // ISO date or "YYYY-MM-DD"
  type: 'Inspeção de Qualidade' | 'Polimento & Banho' | 'Ajuste de Aro' | 'Substituição de Garra' | 'Limpeza Ultrassônica' | 'Certificação Inicial' | 'Transferência de Posse' | 'Emissão de Certificado';
  performer: string; // e.g., "Maison Lumière Atelier Central"
  notes: string;
  verifiedByAppraiser?: string;
  customerId?: string;
  customerName?: string;
  customerCpf?: string;
  customerEmail?: string;
}

export interface CareGuideItem {
  category: 'Limpeza' | 'Armazenamento' | 'Uso Diário' | 'Produtos Químicos' | 'Inspeção Profissional';
  title: string;
  description: string;
  warning?: string;
}

export interface Customer {
  id: string; // e.g., "CLI-1001"
  name: string; // Alphanumeric
  cpf: string | number; // 11 dígitos (BIGINT no banco, mas flexível aqui)
  email: string; // Email
  phone?: string;
  notes?: string;
  password?: string; // Senha de acesso para o cliente efetuar login
  createdAt?: string;
  updatedAt?: string;
}

export interface JewelryCertificate {
  id: string; // UUID
  certCode?: string; // e.g. "CERT-2026-A8F9" (unique human-readable code)
  isRoot?: boolean; // true = Joia Pai/Raiz/Base (Catalog Model, unlinked to any customer)
  parentCertId?: string; // ID of Parent Root Joia if this is a Joia Filha (Child certificate assigned to customer)
  serialNumber: string; // e.g. "SN-18K-99042"
  title: string; // e.g. "Anel Solitário Étoile Royale"
  collection: string; // e.g. "High Jewelry Solitaires"
  model: string; // e.g. "Étoile-V18"
  manufacturer: string; // e.g. "Maison Lumière Joias"
  manufacturerLogoUrl?: string;
  manufacturingDate: string; // "YYYY-MM-DD"
  issueDate: string; // "YYYY-MM-DD"
  currentOwnerName?: string;
  ownerCpf?: string;
  ownerEmail?: string;
  ownerId?: string;
  
  // Metal specifications
  metalPurity: MetalPurity;
  metalColor: MetalColor;
  grossWeightGrams: number; // e.g. 4.85
  widthCm?: number; // e.g. 0.5 (largura da peça em cm; se 0 ou não informado, não exibe)
  finish: FinishType;

  // Gemological details
  hasStones: boolean;
  stones: StoneDetail[];

  // Media
  images: string[]; // High-res images

  // Warranty & Auth
  warrantyMonths: number; // e.g. 60 or 0 for lifetime (-1)
  warrantyTerms: string;
  warrantyStatus: 'Ativa' | 'Expirada' | 'Em Manutenção' | 'Vitalícia';
  authenticityHash: string; // Cryptographic seal string

  // Extra details
  estimatedValueBRL?: number;
  careGuide: CareGuideItem[];
  maintenanceHistory: MaintenanceRecord[];

  createdAt: string;
  updatedAt: string;
}

export type ViewMode = 'public-passport' | 'public-certificate' | 'jeweler-dashboard' | 'scanner' | 'create-new' | 'customers' | 'customer-portal' | 'attributes';
