import { supabase } from '../lib/supabase';

// Organização em que o usuário está trabalhando agora. Para quase todo mundo é
// a única que ele tem; para um cliente de várias joalherias, é a que ele
// escolheu ao entrar.
function getOrgIdAtual(): string | null {
  try {
    const guardado = sessionStorage.getItem('aureum_logged_user');
    if (!guardado) return null;
    return JSON.parse(guardado).orgId || null;
  } catch {
    return null;
  }
}

/**
 * Faz requisições fetch automaticamente adicionando o token de autenticação
 * Isso garante que o backend receba org_id do usuário no JWT
 */
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  try {
    let token: string | null = null;

    // Pega token do sessionStorage separado (mais seguro)
    token = sessionStorage.getItem('session_token');

    // Se não houver, tenta Supabase session (fallback)
    if (!token) {
      const { data: { session } } = await supabase.auth.getSession();
      token = session?.access_token;
    }

    if (!token) {
      // Se não houver token, faz requisição sem autenticação
      return fetch(url, options);
    }

    // Adiciona o token no header Authorization
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Cliente em várias joalherias: avisa qual delas ele escolheu na tela de
    // seleção. O servidor só aceita depois de conferir que ele pertence a ela.
    const orgId = getOrgIdAtual();
    if (orgId) headers['X-Org-Id'] = orgId;

    return fetch(url, {
      ...options,
      headers
    });
  } catch (error) {
    // Se algo der errado, faz requisição sem token
    return fetch(url, options);
  }
}
