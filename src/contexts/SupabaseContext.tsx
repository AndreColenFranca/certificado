import { createContext, useContext, ReactNode } from 'react';

interface SupabaseContextType {
  // Placeholder - contexto é mínimo para não causar re-renders
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export const SupabaseProvider = ({ children }: { children: ReactNode }) => {
  return (
    <SupabaseContext.Provider value={{}}>
      {children}
    </SupabaseContext.Provider>
  );
};

export const useSupabaseAuth = () => {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useSupabaseAuth deve ser usado dentro de SupabaseProvider');
  }
  return context;
};
