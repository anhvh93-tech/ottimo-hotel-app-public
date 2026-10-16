import '@ottimo/ui/styles.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { apiMode } from './app/config';

async function start() {
  // Dev-only API mock (MSW). The dynamic import is dropped from production bundles.
  if (import.meta.env.DEV && apiMode() === 'mock') {
    const { startMockWorker } = await import('./mocks/browser');
    await startMockWorker();
  }
  const root = document.getElementById('root');
  if (!root) throw new Error('#root not found');
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void start();
