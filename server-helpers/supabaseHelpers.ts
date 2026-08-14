import { SupabaseClient } from '@supabase/supabase-js';
import { JewelryCertificate, Customer } from '../src/types';

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
    const { data, error } = await supabase
      .from('jewelry_certificates')
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
