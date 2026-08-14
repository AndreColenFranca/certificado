import { useEffect, useState } from 'react';
import { diagnosticSupabase } from '../utils/supabaseTest';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';

export const SupabaseDiagnostic = () => {
  const [diagnostic, setDiagnostic] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const runDiagnostics = async () => {
      const result = await diagnosticSupabase();
      setDiagnostic(result);
      setLoading(false);
    };

    runDiagnostics();
  }, []);

  if (loading) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2">
          <Loader className="w-5 h-5 animate-spin text-yellow-600" />
          <span className="text-yellow-800">Testando conexão com Supabase...</span>
        </div>
      </div>
    );
  }

  if (!diagnostic) return null;

  const connectionOk = diagnostic.connection.success;
  const authOk = diagnostic.authentication.success;

  if (connectionOk && authOk) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2 text-green-800">
          <CheckCircle className="w-5 h-5" />
          <span>Supabase conectado com sucesso!</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-semibold text-red-800 mb-2">Erro de Conexão com Supabase</h3>
          <div className="space-y-2 text-sm text-red-700">
            {!connectionOk && (
              <div>
                <p className="font-medium">Conexão:</p>
                <p>{diagnostic.connection.error}</p>
              </div>
            )}
            {!authOk && (
              <div>
                <p className="font-medium">Autenticação:</p>
                <p>{diagnostic.authentication.error}</p>
              </div>
            )}
            <p className="text-xs text-red-600 mt-4">
              Verifique o console do navegador (F12) para mais detalhes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
