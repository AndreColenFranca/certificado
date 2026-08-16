import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    let supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ success: false, error: 'Env vars not set' });
    }

    supabaseServiceKey = supabaseServiceKey.replace(/\s+/g, '');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar TODOS os certificados sem filtro
    const { data: allCerts } = await supabase
      .from('jewelry_certificates')
      .select('id, cert_code, org_id, title, is_root, created_at')
      .order('created_at', { ascending: false });

    // Buscar certificados com filtro (is_root=true)
    const { data: rootCerts } = await supabase
      .from('jewelry_certificates')
      .select('id, cert_code, org_id, title, is_root, created_at')
      .eq('is_root', true)
      .order('created_at', { ascending: false });

    // Buscar certificados da org padrão
    const defaultOrgId = '550e8400-e29b-41d4-a716-446655440000';
    const { data: orgCerts } = await supabase
      .from('jewelry_certificates')
      .select('id, cert_code, org_id, title, is_root, created_at')
      .eq('org_id', defaultOrgId)
      .order('created_at', { ascending: false });

    return res.status(200).json({
      success: true,
      totals: {
        allCertificates: allCerts?.length || 0,
        rootCertificates: rootCerts?.length || 0,
        organizationCertificates: orgCerts?.length || 0
      },
      orgIds: [...new Set(allCerts?.map(c => c.org_id))],
      isRootValues: [...new Set(allCerts?.map(c => c.is_root))],
      samples: {
        all: allCerts?.slice(0, 3),
        root: rootCerts?.slice(0, 3),
        org: orgCerts?.slice(0, 3)
      }
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
}
