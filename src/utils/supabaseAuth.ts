import { supabase } from '../lib/supabase';
import { AppUser } from '../types';
import { ROOT_USER_EMAIL } from '../config/constants';

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

      // Associar usuário a organização (usar default se não especificada)
      const userOrgId = orgId || '550e8400-e29b-41d4-a716-446655440000'; // UUID da org default

      const { error: authUserError } = await supabase
        .from('auth_users')
        .insert({
          id: authData.user.id,
          email: email,
          name: name,
          org_id: userOrgId,
          role: 'operator',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      return {
        success: true,
        user: {
          id: authData.user.id,
          name: name || authData.user.user_metadata?.display_name || email,
          email: authData.user.email || email,
          role: 'operator',
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

      // Special case for root user
      const isRootEmail = email === ROOT_USER_EMAIL;

      // Get user profile from auth_users table
      const { data: userProfile, error: profileError } = await supabase
        .from('auth_users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      return {
        success: true,
        user: {
          id: authData.user.id,
          name: userProfile?.name || authData.user.user_metadata?.display_name || (isRootEmail ? 'André Luiz Colen (Administrador Raiz)' : email),
          email: authData.user.email || email,
          role: isRootEmail ? 'root' : (userProfile?.role || 'customer'),
          cpf: userProfile?.cpf,
          isRoot: isRootEmail || userProfile?.role === 'root' || false,
          orgId: userProfile?.org_id || '550e8400-e29b-41d4-a716-446655440000',
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
