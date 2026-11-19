import React from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// Register PWA service worker only over HTTP(S) (never inside Electron app:// or file://)
if (
  typeof window !== 'undefined' &&
  !window.electronAPI &&
  (window.location.protocol === 'https:' || window.location.protocol === 'http:')
) {
  registerSW({
    immediate: true,
    onOfflineReady() {
      // Cached assets ready for offline launch
    },
  });
}

interface ErrorBoundaryState {
  error: Error | null;
}

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#1b1109] text-[#f6e2be] p-6">
          <div className="max-w-md w-full rounded-2xl border border-[#c9954c]/60 bg-[#2a1509] p-6 shadow-2xl space-y-4 text-center">
            <h1 className="font-display text-xl text-[#ffebc2]">
              Ocurrió un problema al abrir el estudio
            </h1>
            <p className="text-xs text-[#dfc499] break-words">
              {this.state.error.message || 'Error inesperado de renderizado.'}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg bg-[#b47422] hover:bg-[#c8842c] text-xs font-semibold text-white cursor-pointer"
            >
              Recargar Cuaderno del Artista
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>
);
