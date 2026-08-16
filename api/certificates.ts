import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { getCertificates } from '../server-helpers/supabaseHelpers';

const DEFAULT_ORG_ID = '550e8400-e29b-41d4-a716-446655440000';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    let supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({
        success: false,
        error: 'Variáveis de ambiente Supabase não configuradas'
      });
    }

    // Remove quebras de linha e espaços em branco da chave
    supabaseServiceKey = supabaseServiceKey.replace(/\s+/g, '');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const userOrgId = DEFAULT_ORG_ID;

    const result = await getCertificates(supabase, userOrgId);

    if (result.success && result.data) {
      return res.status(200).json({
        success: true,
        count: result.data.length,
        data: result.data
      });
    }

    return res.status(200).json({
      success: true,
      count: 0,
      data: []
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message,
      data: []
    });
  }
}
