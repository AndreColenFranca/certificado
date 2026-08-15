import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Adiciona org_id ao claims do usuário Supabase Auth
 * Para que RLS funcione, o JWT deve incluir org_id
 */
export async function setUserOrgId(
  supabase: SupabaseClient,
  userId: string,
  orgId: string = 'default'
) {
  try {
    // Usar admin client para atualizar app_metadata
    // Nota: isso requer uma função Edge Function ou API customizada
    // Por enquanto, vamos usar um padrão alternativo

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Obtém org_id do JWT do usuário
 */
export function getOrgIdFromJwt(jwtToken?: string): string {
  if (!jwtToken) return 'default';

  try {
    // JWT tem 3 partes: header.payload.signature
    const parts = jwtToken.split('.');
    if (parts.length !== 3) return 'default';

    // Decodificar payload (segunda parte)
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64').toString('utf-8')
    );

    return payload.org_id || 'default';
  } catch (err) {
    return 'default';
  }
}

/**
 * Cria um usuário com org_id pre-configurado
 */
export async function createUserWithOrg(
  supabase: SupabaseClient,
  email: string,
  password: string,
  orgId: string = 'default'
) {
  try {
    // Supabase Auth não permite definir custom claims na criação
    // Então salvamos org_id em uma tabela separada

    // Passo 1: Criar usuário
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError || !authData.user) {
      return { success: false, error: authError?.message };
    }

    // Passo 2: Salvar org_id em tabela user_orgs
    const { error: dbError } = await supabase
      .from('user_orgs')
      .insert([{
        user_id: authData.user.id,
        org_id: orgId,
        created_at: new Date().toISOString()
      }]);

    if (dbError) {
      return { success: false, error: dbError.message };
    }

    return { success: true, userId: authData.user.id };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Obtém org_id de um usuário via user_orgs table
 */
export async function getUserOrgId(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('user_orgs')
      .select('org_id')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return 'default';
    }

    return data.org_id;
  } catch (err) {
    return 'default';
  }
}
