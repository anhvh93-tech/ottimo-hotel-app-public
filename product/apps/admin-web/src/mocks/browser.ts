import { setupWorker } from 'msw/browser';
import { handlers, mockControl, restoreMockSession } from './handlers';

/** Dev only: answer /v1 in the browser. Test accounts: qa.owner, qa.mgr, qa.fdl, qa.fd, qa.hk, qa.mt, qa.sal, qa.ctv1 (password in seed.ts). */
export async function startMockWorker() {
  restoreMockSession();
  (window as unknown as { __ottimoMock: typeof mockControl }).__ottimoMock = mockControl;
  await setupWorker(...handlers).start({ onUnhandledRequest: 'bypass', quiet: true });
}
