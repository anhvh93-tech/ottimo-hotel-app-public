import '@ottimo/ui/styles.css';
import './styles.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { apiMode } from './app/config';
import { readLink, scrubLocation } from './app/link';

// SEC ĐK-4: read /g/{token} once and remove it from the address bar before anything else runs
// (no request, no render, no third-party script can see it in location.href afterwards).
const link = readLink(window.location.pathname);
if (link.kind !== 'none') scrubLocation();

async function start() {
  if (import.meta.env.DEV && apiMode() === 'mock') {
    try {
      const { startMockWorker } = await import('./mocks/browser');
      await startMockWorker();
    } catch {
      /* dev only: render anyway, calls fail visibly */
    }
  }
  const root = document.getElementById('root');
  if (!root) throw new Error('#root not found');
  createRoot(root).render(
    <StrictMode>
      <App link={link} />
    </StrictMode>,
  );
}

void start();
