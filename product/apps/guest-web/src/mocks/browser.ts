import { setupWorker } from 'msw/browser';
import { handlers, mockControl, MOCK_TOKENS } from './handlers';

/**
 * Dev only: answer /v1/guest/* in the browser. Open http://localhost:5175/g/<token> with a token from
 * MOCK_TOKENS (ok · expired · ended · closed · inHouse). Mock state lives in memory: reloading the page
 * drops the mock session ("link expired") – the real API keeps it in the cookie.
 */
export async function startMockWorker() {
  (window as unknown as { __ottimoGuestMock: unknown }).__ottimoGuestMock = {
    control: mockControl,
    tokens: MOCK_TOKENS,
  };
  await setupWorker(...handlers).start({ onUnhandledRequest: 'bypass', quiet: true });
}
