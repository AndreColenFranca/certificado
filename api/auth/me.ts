import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Obter email do body da requisição (enviado pelo frontend após login)
    const { email } = req.body || {};

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email é obrigatório'
      });
    }

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

    // Buscar usuário no banco
    const { data: user, error } = await supabase
      .from('auth_users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    // Buscar organização do usuário
    const { data: org } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', user.org_id)
      .single();

    return res.status(200).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        orgId: user.org_id,
        orgName: org?.display_name || org?.name || 'Organização'
      }
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
}
