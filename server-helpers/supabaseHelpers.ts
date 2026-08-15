import { SupabaseClient } from '@supabase/supabase-js';
import { JewelryCertificate, Customer } from '../src/types';

// ==================== HELPERS ====================

// Convert snake_case from Supabase to camelCase for frontend
export function transformCertificateFromDb(dbCert: any): JewelryCertificate {
  if (!dbCert) return dbCert;

  const cert: any = {
    // Try camelCase first (if frontend saved it), then snake_case (from Supabase)
    id: dbCert.id,
    isRoot: dbCert.isRoot ?? dbCert.is_root ?? false,
    parentCertId: dbCert.parentCertId ?? dbCert.parent_cert_id,
    serialNumber: dbCert.serialNumber ?? dbCert.serial_number,
    title: dbCert.title,
    collection: dbCert.collection,
    model: dbCert.model,
    manufacturer: dbCert.manufacturer,
    manufacturerLogoUrl: dbCert.manufacturerLogoUrl ?? dbCert.manufacturer_logo_url,
    manufacturingDate: dbCert.manufacturingDate ?? dbCert.manufacturing_date,
    issueDate: dbCert.issueDate ?? dbCert.issue_date,
    currentOwnerName: dbCert.currentOwnerName ?? dbCert.current_owner_name,
    ownerCpf: dbCert.ownerCpf ?? dbCert.owner_cpf,
    ownerEmail: dbCert.ownerEmail ?? dbCert.owner_email,
    ownerId: dbCert.ownerId ?? dbCert.owner_id,
    metalPurity: dbCert.metalPurity ?? dbCert.metal_purity,
    metalColor: dbCert.metalColor ?? dbCert.metal_color,
    grossWeightGrams: dbCert.grossWeightGrams ?? dbCert.gross_weight_grams,
    widthCm: dbCert.widthCm ?? dbCert.width_cm,
    finish: dbCert.finish,
    hasStones: dbCert.hasStones ?? dbCert.has_stones ?? false,
    stones: dbCert.stones || [],
    images: dbCert.images || [],
    warrantyMonths: dbCert.warrantyMonths ?? dbCert.warranty_months,
    warrantyTerms: dbCert.warrantyTerms ?? dbCert.warranty_terms,
    warrantyStatus: dbCert.warrantyStatus ?? dbCert.warranty_status,
    authenticityHash: dbCert.authenticityHash ?? dbCert.authenticity_hash,
    estimatedValueBRL: dbCert.estimatedValueBRL ?? dbCert.estimated_value_brl,
    careGuide: (dbCert.careGuide ?? dbCert.care_guide) || [],
    maintenanceHistory: (dbCert.maintenanceHistory ?? dbCert.maintenance_history) || [],
    createdAt: dbCert.createdAt ?? dbCert.created_at,
    updatedAt: dbCert.updatedAt ?? dbCert.updated_at
  };

  return cert as JewelryCertificate;
}

// ==================== CERTIFICATES ====================

export async function getCertificates(
  supabase: SupabaseClient,
  orgId?: string
) {
  try {
    let query = supabase.from('jewelry_certificates').select('*');

    if (orgId) {
      query = query.eq('org_id', orgId);
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, error: error.message, data: null };
    }

    return { success: true, data: data || [] };
  } catch (err: any) {
    return { success: false, error: err.message, data: null };
  }
}

export async function getCertificateById(
  supabase: SupabaseClient,
  id: string
) {
  try {
    const { data, error } = await supabase
      .from('jewelry_certificates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return { success: false, error: error.message, data: null };
    }

    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message, data: null };
  }
}

export async function createCertificate(
  supabase: SupabaseClient,
  certificate: Partial<JewelryCertificate> & { org_id: string }
) {
  try {
    const now = new Date().toISOString();
    const cert = {
      ...certificate,
      created_at: now,
      updated_at: now
    };

    const { data, error } = await supabase
      .from('jewelry_certificates')
      .insert([cert])
      .select();

    if (error) {
      return { success: false, error: error.message, data: null };
    }

    return { success: true, data: data?.[0] || null };
  } catch (err: any) {
    return { success: false, error: err.message, data: null };
  }
}

export async function updateCertificate(
  supabase: SupabaseClient,
  id: string,
  updates: Partial<JewelryCertificate>
) {
  try {
    // Convert camelCase to snake_case for Supabase
    const snakeCaseUpdates: any = {
      serial_number: updates.serialNumber,
      title: updates.title,
      collection: updates.collection,
      model: updates.model,
      manufacturer: updates.manufacturer,
      manufacturer_logo_url: updates.manufacturerLogoUrl,
      metal_purity: updates.metalPurity,
      metal_color: updates.metalColor,
      gross_weight_grams: updates.grossWeightGrams,
      width_cm: updates.widthCm,
      finish: updates.finish,
      has_stones: updates.hasStones,
      stones: updates.stones,
      images: updates.images,
      warranty_months: updates.warrantyMonths,
      warranty_terms: updates.warrantyTerms,
      warranty_status: updates.warrantyStatus,
      estimated_value_brl: updates.estimatedValueBRL,
      current_owner_name: updates.currentOwnerName,
      owner_cpf: updates.ownerCpf,
      owner_email: updates.ownerEmail,
      owner_id: updates.ownerId,
      updated_at: new Date().toISOString()
    };

    // Remove undefined values
    Object.keys(snakeCaseUpdates).forEach(key =>
      snakeCaseUpdates[key] === undefined && delete snakeCaseUpdates[key]
    );

    const { data, error } = await supabase
      .from('jewelry_certificates')
      .update(snakeCaseUpdates)
      .eq('id', id)
      .select();

    if (error) {
      return { success: false, error: error.message, data: null };
    }

    return { success: true, data: data?.[0] || null };
  } catch (err: any) {
    return { success: false, error: err.message, data: null };
  }
}

export async function deleteCertificate(
  supabase: SupabaseClient,
  id: string
) {
  try {
    const { error } = await supabase
      .from('jewelry_certificates')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ==================== CUSTOMERS ====================

export async function getCustomers(
  supabase: SupabaseClient,
  orgId?: string
) {
  try {
    let query = supabase.from('customers').select('*');

    if (orgId) {
      query = query.eq('org_id', orgId);
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, error: error.message, data: null };
    }

    return { success: true, data: data || [] };
  } catch (err: any) {
    return { success: false, error: err.message, data: null };
  }
}

export async function getCustomerById(
  supabase: SupabaseClient,
  id: string
) {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return { success: false, error: error.message, data: null };
    }

    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message, data: null };
  }
}

export async function createCustomer(
  supabase: SupabaseClient,
  customer: Partial<Customer> & { org_id: string; customer_code: string; name: string; cpf: string; email: string }
) {
  try {
    const now = new Date().toISOString();
    const cust = {
      ...customer,
      created_at: now,
      updated_at: now
    };

    const { data, error } = await supabase
      .from('customers')
      .insert([cust])
      .select();

    if (error) {
      return { success: false, error: error.message, data: null };
    }

    return { success: true, data: data?.[0] || null };
  } catch (err: any) {
    return { success: false, error: err.message, data: null };
  }
}

export async function updateCustomer(
  supabase: SupabaseClient,
  id: string,
  updates: Partial<Customer>
) {
  try {
    const { data, error } = await supabase
      .from('customers')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (error) {
      return { success: false, error: error.message, data: null };
    }

    return { success: true, data: data?.[0] || null };
  } catch (err: any) {
    return { success: false, error: err.message, data: null };
  }
}

export async function deleteCustomer(
  supabase: SupabaseClient,
  id: string
) {
  try {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
