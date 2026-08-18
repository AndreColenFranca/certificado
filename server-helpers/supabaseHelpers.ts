import { SupabaseClient } from '@supabase/supabase-js';
import { JewelryCertificate, Customer } from '../src/types';

// ==================== HELPERS ====================

// Convert snake_case from Supabase to camelCase for frontend
export function transformCertificateFromDb(dbCert: any): JewelryCertificate {
  if (!dbCert) return dbCert;

  const cert: any = {
    // Try camelCase first (if frontend saved it), then snake_case (from Supabase)
    id: dbCert.id,
    orgId: dbCert.orgId ?? dbCert.org_id,
    certCode: dbCert.certCode ?? dbCert.cert_code,
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
    grossWeightGrams: Number(dbCert.grossWeightGrams ?? dbCert.gross_weight_grams) || undefined,
    widthCm: Number(dbCert.widthCm ?? dbCert.width_cm) || undefined,
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
  orgId: string
) {
  if (!orgId) {
    throw new Error('ERRO CRÍTICO: org_id é obrigatório para getCertificates()');
  }

  try {
    // Optimize query by selecting essential fields only (avoid large arrays)
    const query = supabase
      .from('jewelry_certificates')
      .select('id,cert_code,serial_number,title,collection,model,manufacturer,manufacturer_logo_url,metal_purity,metal_color,gross_weight_grams,width_cm,finish,has_stones,warranty_months,warranty_status,estimated_value_brl,current_owner_name,owner_cpf,owner_email,owner_id,issue_date,manufacturing_date,authenticity_hash,is_root,parent_cert_id,org_id,created_at,updated_at')
      .eq('org_id', orgId);

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
  id: string,
  orgId?: string
) {
  try {
    let query = supabase
      .from('jewelry_certificates')
      .select('*')
      .eq('id', id);

    if (orgId) {
      query = query.eq('org_id', orgId);
    }

    const { data, error } = await query.single();

    if (error) {
      return { success: false, error: error.message, data: null };
    }

    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message, data: null };
  }
}

export async function getCertificateByQuery(
  supabase: SupabaseClient,
  query: string,
  orgId?: string
) {
  try {
    const normalizedQuery = query.trim().toUpperCase();
    console.log(`[CERT SEARCH] Searching for: "${normalizedQuery}" in org: ${orgId}`);

    // Try to find by cert_code first (human-readable) - case-insensitive
    let searchQuery = supabase
      .from('jewelry_certificates')
      .select('id, cert_code, serial_number, org_id')
      .ilike('cert_code', `%${normalizedQuery}%`);

    if (orgId) {
      searchQuery = searchQuery.eq('org_id', orgId);
    }

    let { data, error } = await searchQuery;

    console.log(`[CERT SEARCH] cert_code query result:`, { error: error?.message, dataLength: data?.length });

    if (!error && data && data.length > 0) {
      console.log(`[CERT SEARCH] Found by cert_code:`, data[0].id, data[0].cert_code);
      // Get full record with org_id filter
      let fullQuery = supabase
        .from('jewelry_certificates')
        .select('*')
        .eq('id', data[0].id);

      if (orgId) {
        fullQuery = fullQuery.eq('org_id', orgId);
      }

      const { data: fullData } = await fullQuery.single();
      return { success: true, data: fullData };
    }

    console.log(`[CERT SEARCH] cert_code exact match failed, trying serial_number...`);

    // Try by serial_number - exact match
    let serialQuery = supabase
      .from('jewelry_certificates')
      .select('*')
      .ilike('serial_number', `%${normalizedQuery}%`);

    if (orgId) {
      serialQuery = serialQuery.eq('org_id', orgId);
    }

    const { data: data2, error: error2 } = await serialQuery;

    if (!error2 && data2 && data2.length > 0) {
      console.log(`[CERT SEARCH] Found by serial_number:`, data2[0].id, data2[0].serial_number);
      return { success: true, data: data2[0] };
    }

    // Try by UUID id
    let idQuery = supabase
      .from('jewelry_certificates')
      .select('*')
      .eq('id', normalizedQuery);

    if (orgId) {
      idQuery = idQuery.eq('org_id', orgId);
    }

    const { data: data3, error: error3 } = await idQuery;

    if (!error3 && data3 && data3.length > 0) {
      console.log(`[CERT SEARCH] Found by id:`, data3[0].id);
      return { success: true, data: data3[0] };
    }

    console.log(`[CERT SEARCH] Not found: "${normalizedQuery}"`);
    return { success: false, error: 'Certificado não encontrado', data: null };
  } catch (err: any) {
    console.log(`[CERT SEARCH] Exception:`, err.message);
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
  updates: Partial<JewelryCertificate>,
  orgId?: string
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
      manufacturing_date: updates.manufacturingDate,
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

    // Convert empty strings to null and remove undefined values
    Object.keys(snakeCaseUpdates).forEach(key => {
      if (snakeCaseUpdates[key] === undefined) {
        delete snakeCaseUpdates[key];
      } else if (snakeCaseUpdates[key] === '') {
        // For numeric fields, use 0 instead of null
        if (['gross_weight_grams', 'width_cm', 'estimated_value_brl', 'warranty_months'].includes(key)) {
          snakeCaseUpdates[key] = 0;
        }
        // For UUID fields, convert empty strings to null
        else if (['owner_id', 'parent_cert_id'].includes(key)) {
          snakeCaseUpdates[key] = null;
        }
        // For finish and other text fields, keep empty strings as-is (don't convert to null)
        // This ensures they are explicitly updated to empty if the user clears them
      }
    });

    console.log(`[UPDATE DEBUG] Updating cert ${id} with finish='${snakeCaseUpdates.finish}' (type: ${typeof snakeCaseUpdates.finish}):`, snakeCaseUpdates);

    let query = supabase
      .from('jewelry_certificates')
      .update(snakeCaseUpdates)
      .eq('id', id);

    // Validate org_id if provided (important for RLS compliance)
    if (orgId) {
      query = query.eq('org_id', orgId);
    }

    const { data, error } = await query.select();

    if (error) {
      console.log(`[UPDATE ERROR] Update failed for ${id}:`, error.message);
      return { success: false, error: error.message, data: null };
    }

    console.log(`[UPDATE SUCCESS] Updated cert ${id}, returned:`, data?.[0]);
    return { success: true, data: data?.[0] || null };
  } catch (err: any) {
    console.log(`[UPDATE EXCEPTION] Error updating ${id}:`, err.message);
    return { success: false, error: err.message, data: null };
  }
}

export async function deleteCertificate(
  supabase: SupabaseClient,
  id: string,
  orgId?: string
) {
  try {
    let query = supabase
      .from('jewelry_certificates')
      .delete()
      .eq('id', id);

    // Validate org_id if provided (important for RLS compliance)
    if (orgId) {
      query = query.eq('org_id', orgId);
    }

    const { error } = await query;

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
  orgId: string
) {
  if (!orgId) {
    throw new Error('ERRO CRÍTICO: org_id é obrigatório para getCustomers()');
  }

  try {
    const query = supabase.from('customers').select('*').eq('org_id', orgId);

    const { data, error } = await query;

    if (error) {
      return { success: false, error: error.message, data: null };
    }

    // Transform: map customer_code to id for frontend compatibility, keep UUID internal
    const transformed = (data || []).map((cust: any) => ({
      ...cust,
      id: cust.customer_code || cust.id,
      _uuid: cust.id // Store UUID for backend operations
    }));

    return { success: true, data: transformed };
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

// ==================== MAINTENANCE RECORDS ====================

export async function createMaintenanceRecord(
  supabase: SupabaseClient,
  certId: string,
  orgId: string,
  maintenanceDate: string,
  maintenanceType: string,
  performer: string,
  notes?: string,
  customerName?: string,
  customerCpf?: string,
  customerEmail?: string
) {
  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('maintenance_records')
      .insert([{
        cert_id: certId,
        org_id: orgId,
        maintenance_date: maintenanceDate,
        maintenance_type: maintenanceType,
        performer,
        notes: notes || null,
        customer_name: customerName || null,
        customer_cpf: customerCpf || null,
        customer_email: customerEmail || null,
        created_at: now,
        updated_at: now
      }])
      .select();

    if (error) {
      console.error('Erro ao criar maintenance record:', error.message);
      return { success: false, error: error.message, data: null };
    }

    return { success: true, data: data?.[0] || null };
  } catch (err: any) {
    console.error('Exceção em createMaintenanceRecord:', err.message);
    return { success: false, error: err.message, data: null };
  }
}
