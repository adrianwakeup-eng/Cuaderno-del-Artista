import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// Register PWA service worker for offline Windows/Desktop app support
if (typeof window !== 'undefined' && !window.electronAPI) {
  registerSW({
    immediate: true,
    onOfflineReady() {
      // Cached assets ready for offline launch
    },
  });
}

createRoot(document.getElementById('root')!).render(<App />);
