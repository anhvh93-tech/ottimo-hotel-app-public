// DS v0.4.1 tokens + hi-fi components + self-hosted fonts (Lora, Be Vietnam Pro, JetBrains Mono – B0 + B1
// in the same build, S4-49) all come from @ottimo/ui; nothing is loaded from a CDN (CSP).
import '@ottimo/ui/styles.css';
import './styles.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { apiMode } from './app/config';
import { openStore } from './data/store';

async function start() {
  if (import.meta.env.DEV && apiMode() === 'mock') {
    try {
      const { startMockWorker } = await import('./mocks/browser');
      await startMockWorker();
    } catch {
      /* dev only: render anyway, calls fail visibly */
    }
  } else if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    // App shell only (sw.js – SR-PWA-02); data offline lives in IndexedDB.
    navigator.serviceWorker.register('/sw.js').catch(() => undefined);
  }
  const root = document.getElementById('root');
  if (!root) throw new Error('#root not found');
  createRoot(root).render(
    <StrictMode>
      <App store={openStore()} />
    </StrictMode>,
  );
}

void start();
