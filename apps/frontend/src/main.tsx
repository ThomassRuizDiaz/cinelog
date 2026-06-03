import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/global.css';
import App from './App';

/* Restore saved DEV layout debug values before first render */
if (import.meta.env.DEV) {
  const { restoreDebugLayout } = await import('./lib/debugLayout');
  restoreDebugLayout();
}

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
