import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { SupabaseProvider } from './contexts/SupabaseContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SupabaseProvider>
      <App />
    </SupabaseProvider>
  </StrictMode>,
);
