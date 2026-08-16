import { supabase } from '../lib/supabase';
import { AppUser } from '../types';
import { ROOT_USER_EMAIL } from '../config/constants';
import { fetchWithAuth } from './fetchWithAuth';

export interface AuthResponse {
  success: boolean;
  user?: AppUser;
  error?: string;
}

export const supabaseAuth = {
  // Sign up with email and password
  async signUp(email: string, password: string, name: string, orgId?: string): Promise<AuthResponse> {
    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: name,
            role: 'customer'
          }
        }
      });

      if (signUpError) {
        return { success: false, error: signUpError.message };
      }

      if (!authData.user) {
        return { success: false, error: 'Usuário não criado' };
      }

      const userOrgId = orgId || '550e8400-e29b-41d4-a716-446655440000';

      try {
        await fetch('/api/auth/register-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: authData.user.id,
            email,
            name,
            orgId: userOrgId,
            role: 'customer'
          })
        });
      } catch (e) {
      }

      return {
        success: true,
        user: {
          id: authData.user.id,
          name: name || authData.user.user_metadata?.display_name || email,
          email: authData.user.email || email,
          role: 'customer',
          isRoot: false,
          createdAt: new Date().toISOString()
        }
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
  },

  // Sign in with email and password
  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        return { success: false, error: signInError.message };
      }

      if (!authData.user) {
        return { success: false, error: 'Falha ao autenticar usuário' };
      }

      const isRootEmail = email === ROOT_USER_EMAIL;

      try {
        const meRes = await fetchWithAuth('/api/auth/me', {
          method: 'POST',
          body: JSON.stringify({ email })
        });

        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.success && meData.data) {
            return {
              success: true,
              user: {
                id: authData.user.id,
                name: meData.data.name || authData.user.user_metadata?.display_name || email,
                email: authData.user.email || email,
                role: meData.data.role,
                isRoot: isRootEmail || meData.data.role === 'root',
                orgId: meData.data.orgId,
                createdAt: authData.user.created_at || new Date().toISOString()
              }
            };
          }
        }
      } catch (e) {
      }

      return {
        success: true,
        user: {
          id: authData.user.id,
          name: authData.user.user_metadata?.display_name || (isRootEmail ? 'André Luiz Colen (Administrador Raiz)' : email),
          email: authData.user.email || email,
          role: isRootEmail ? 'root' : 'customer',
          isRoot: isRootEmail,
          orgId: '550e8400-e29b-41d4-a716-446655440000',
          createdAt: authData.user.created_at || new Date().toISOString()
        }
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
  },

  // Sign out
  async signOut(): Promise<AuthResponse> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
    }
  },

  // Get current session
  async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    } catch (err) {
      return null;
    }
  },

  // Check if user is authenticated
  async isAuthenticated() {
    const session = await this.getSession();
    return !!session;
  }
};
