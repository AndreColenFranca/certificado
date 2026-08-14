import { supabase } from '../lib/supabase';

export const testSupabaseConnection = async () => {
  try {
    console.log('🔍 Testando conexão com Supabase...');

    // Test 1: Verificar se consegue fazer uma query simples
    const { data, error } = await supabase.from('organizations').select('count()');

    if (error) {
      console.error('❌ Erro ao conectar com Supabase:', error);
      return {
        success: false,
        error: error.message,
        details: error
      };
    }

    console.log('✅ Conexão com Supabase OK');
    console.log('📊 Dados de teste:', data);

    return {
      success: true,
      message: 'Conexão com Supabase estabelecida com sucesso',
      data
    };
  } catch (err) {
    console.error('❌ Erro inesperado:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro desconhecido',
      details: err
    };
  }
};

export const testSupabaseAuth = async () => {
  try {
    console.log('🔍 Testando autenticação Supabase...');

    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error('❌ Erro na autenticação:', error);
      return {
        success: false,
        error: error.message,
        details: error
      };
    }

    if (data.session) {
      console.log('✅ Usuário autenticado:', data.session.user.email);
    } else {
      console.log('ℹ️  Nenhum usuário autenticado (esperado se não fez login)');
    }

    return {
      success: true,
      authenticated: !!data.session,
      user: data.session?.user
    };
  } catch (err) {
    console.error('❌ Erro inesperado na autenticação:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro desconhecido',
      details: err
    };
  }
};

export const diagnosticSupabase = async () => {
  console.log('🚀 Iniciando diagnóstico Supabase...\n');

  const connTest = await testSupabaseConnection();
  console.log('\n---\n');
  const authTest = await testSupabaseAuth();

  return {
    connection: connTest,
    authentication: authTest,
    timestamp: new Date().toISOString()
  };
};
