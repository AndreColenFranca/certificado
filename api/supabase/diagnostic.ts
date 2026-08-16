import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    let supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({
        success: false,
        error: 'Variáveis de ambiente Supabase não configuradas',
        timestamp: new Date().toISOString()
      });
    }

    // Remove quebras de linha e espaços em branco da chave
    supabaseServiceKey = supabaseServiceKey.replace(/\s+/g, '');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: allCerts, error: certsError } = await supabase
      .from('jewelry_certificates')
      .select('id, cert_code, org_id, title, current_owner_name, created_at');

    const { data: allCustomers, error: custsError } = await supabase
      .from('customers')
      .select('id, customer_code, org_id, name, email, created_at');

    const { data: allOrgs, error: orgsError } = await supabase
      .from('organizations')
      .select('id, name, display_name, created_at');

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      supabaseConnected: !certsError && !custsError && !orgsError,
      totalCertificates: allCerts?.length || 0,
      totalCustomers: allCustomers?.length || 0,
      totalOrganizations: allOrgs?.length || 0,
      certificateOrgIds: [...new Set(allCerts?.map(c => c.org_id) || [])],
      customerOrgIds: [...new Set(allCustomers?.map(c => c.org_id) || [])],
      currentRequestOrgId: '550e8400-e29b-41d4-a716-446655440000',
      certificates: allCerts?.slice(0, 5),
      customers: allCustomers?.slice(0, 5),
      organizations: allOrgs?.slice(0, 5),
      errors: {
        certificates: certsError?.message,
        customers: custsError?.message,
        organizations: orgsError?.message
      }
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || 'Erro desconhecido',
      timestamp: new Date().toISOString()
    });
  }
}
