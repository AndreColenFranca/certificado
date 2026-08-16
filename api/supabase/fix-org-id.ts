import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const DEFAULT_ORG_ID = '550e8400-e29b-41d4-a716-446655440000';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    let supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ success: false, error: 'Env vars not configured' });
    }

    supabaseServiceKey = supabaseServiceKey.replace(/\s+/g, '');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Atualizar todos os clientes para o org_id padrão
    const { data, error } = await supabase
      .from('customers')
      .update({ org_id: DEFAULT_ORG_ID })
      .neq('org_id', DEFAULT_ORG_ID)
      .select();

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.status(200).json({
      success: true,
      message: `${data?.length || 0} customers updated to default org_id`,
      updated: data?.length || 0
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
