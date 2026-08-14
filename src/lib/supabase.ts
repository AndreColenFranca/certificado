import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('VITE_SUPABASE_URL is required in .env');
}

if (!supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_ANON_KEY is required in .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          cnpj?: string;
          logo_url?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          cnpj?: string;
          logo_url?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          cnpj?: string;
          logo_url?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      auth_users: {
        Row: {
          id: string;
          org_id: string;
          email: string;
          name: string;
          role: 'root' | 'admin' | 'operator' | 'customer';
          cpf?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          email: string;
          name: string;
          role?: 'root' | 'admin' | 'operator' | 'customer';
          cpf?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          org_id?: string;
          email?: string;
          name?: string;
          role?: 'root' | 'admin' | 'operator' | 'customer';
          cpf?: string;
          updated_at?: string;
        };
      };
      customers: {
        Row: {
          id: string;
          org_id: string;
          customer_code: string;
          name: string;
          cpf: string;
          email: string;
          phone?: string;
          notes?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          customer_code: string;
          name: string;
          cpf: string;
          email: string;
          phone?: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          customer_code?: string;
          name?: string;
          cpf?: string;
          email?: string;
          phone?: string;
          notes?: string;
          updated_at?: string;
        };
      };
      jewelry_certificates: {
        Row: {
          id: string;
          org_id: string;
          cert_code: string;
          serial_number: string;
          is_root: boolean;
          parent_cert_id?: string;
          title: string;
          collection?: string;
          model?: string;
          manufacturer?: string;
          manufacturer_logo_url?: string;
          manufacturing_date?: string;
          issue_date?: string;
          metal_purity?: string;
          metal_color?: string;
          gross_weight_grams?: number;
          width_cm?: number;
          finish?: string;
          has_stones: boolean;
          stones?: any;
          warranty_months?: number;
          warranty_terms?: string;
          warranty_status?: string;
          authenticity_hash: string;
          estimated_value_brl?: number;
          care_guide?: any;
          current_owner_name?: string;
          owner_cpf?: string;
          owner_email?: string;
          owner_id?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          cert_code: string;
          serial_number: string;
          is_root?: boolean;
          parent_cert_id?: string;
          title: string;
          collection?: string;
          model?: string;
          manufacturer?: string;
          manufacturer_logo_url?: string;
          manufacturing_date?: string;
          issue_date?: string;
          metal_purity?: string;
          metal_color?: string;
          gross_weight_grams?: number;
          width_cm?: number;
          finish?: string;
          has_stones?: boolean;
          stones?: any;
          warranty_months?: number;
          warranty_terms?: string;
          warranty_status?: string;
          authenticity_hash: string;
          estimated_value_brl?: number;
          care_guide?: any;
          current_owner_name?: string;
          owner_cpf?: string;
          owner_email?: string;
          owner_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          cert_code?: string;
          serial_number?: string;
          title?: string;
          collection?: string;
          model?: string;
          manufacturer?: string;
          manufacturer_logo_url?: string;
          manufacturing_date?: string;
          issue_date?: string;
          metal_purity?: string;
          metal_color?: string;
          gross_weight_grams?: number;
          width_cm?: number;
          finish?: string;
          has_stones?: boolean;
          stones?: any;
          warranty_months?: number;
          warranty_terms?: string;
          warranty_status?: string;
          estimated_value_brl?: number;
          care_guide?: any;
          current_owner_name?: string;
          owner_cpf?: string;
          owner_email?: string;
          owner_id?: string;
          updated_at?: string;
        };
      };
      maintenance_records: {
        Row: {
          id: string;
          cert_id: string;
          org_id: string;
          maintenance_date: string;
          maintenance_type?: string;
          performer?: string;
          notes?: string;
          verified_by_appraiser?: string;
          customer_name?: string;
          customer_cpf?: string;
          customer_email?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          cert_id: string;
          org_id: string;
          maintenance_date: string;
          maintenance_type?: string;
          performer?: string;
          notes?: string;
          verified_by_appraiser?: string;
          customer_name?: string;
          customer_cpf?: string;
          customer_email?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          maintenance_date?: string;
          maintenance_type?: string;
          performer?: string;
          notes?: string;
          verified_by_appraiser?: string;
          customer_name?: string;
          customer_cpf?: string;
          customer_email?: string;
          updated_at?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
};
