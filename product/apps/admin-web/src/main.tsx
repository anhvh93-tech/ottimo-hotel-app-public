import '@ottimo/ui/styles.css';
import './print.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { apiMode } from './app/config';

/** Dev-only notice when the MSW worker cannot register (e.g. an embedded browser pane) – not translated. */
function MockFailedBar() {
  return (
    <div role="alert" className="alert warn" style={{ margin: 0, borderRadius: 0 }}>
      <div className="txt">
        DEV: Không chạy được API giả (MSW) – mở bằng Chrome/Safari, hoặc dùng{' '}
        <code>pnpm --filter @ottimo/admin-web dev:server</code> với API thật.
      </div>
    </div>
  );
}

async function start() {
  let mockFailed = false;
  // Dev-only API mock (MSW). The dynamic import is dropped from production bundles.
  if (import.meta.env.DEV && apiMode() === 'mock') {
    try {
      const { startMockWorker } = await import('./mocks/browser');
      await startMockWorker();
    } catch {
      // FB-R2-UXD-FE-14: still render the app (calls will fail visibly) instead of a blank page.
      mockFailed = true;
    }
  }
  const root = document.getElementById('root');
  if (!root) throw new Error('#root not found');
  createRoot(root).render(
    <StrictMode>
      {mockFailed ? <MockFailedBar /> : null}
      <App />
    </StrictMode>,
  );
}

void start();
