import { supabase } from '../lib/supabase';

/**
 * Faz requisições fetch automaticamente adicionando o token de autenticação
 * Isso garante que o backend receba org_id do usuário no JWT
 */
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  try {
    // Pega a sessão atual do Supabase
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      // Se não houver token, faz requisição sem autenticação
      return fetch(url, options);
    }

    // Adiciona o token no header Authorization
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    };

    return fetch(url, {
      ...options,
      headers
    });
  } catch (error) {
    // Se algo der errado, faz requisição sem token
    return fetch(url, options);
  }
}
