import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const DEFAULT_ORG_ID = '550e8400-e29b-41d4-a716-446655440000';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    let supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({
        success: false,
        error: 'Env vars not set'
      });
    }

    supabaseServiceKey = supabaseServiceKey.replace(/\s+/g, '');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('org_id', DEFAULT_ORG_ID);

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
        data: []
      });
    }

    return res.status(200).json({
      success: true,
      count: data?.length || 0,
      data: data || []
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message,
      data: []
    });
  }
}
