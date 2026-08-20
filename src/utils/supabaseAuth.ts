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
      // Use backend /api/login for proper multi-tenancy support
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { success: false, error: errorData.error || 'Falha ao autenticar' };
      }

      const data = await response.json();

      if (!data.success || !data.user) {
        return { success: false, error: data.error || 'Falha ao autenticar usuário' };
      }

      // Add multi-tenancy support fields
      const user = data.user as AppUser;
      if (data.user.orgs) {
        user.orgs = data.user.orgs;
      }
      if (data.user.requiresOrgSelection !== undefined) {
        user.requiresOrgSelection = data.user.requiresOrgSelection;
      }

      return { success: true, user };
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
