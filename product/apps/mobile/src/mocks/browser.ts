import { setupWorker } from 'msw/browser';
import { handlers, mockControl, MOCK_USERS } from './handlers';

/**
 * Dev only: answer /v1/* in the browser (OpenAPI 0.3.7) until BE-C ships the housekeeping module.
 * Sign in with a username from MOCK_USERS (hk.lan · mt.tung · fdl.hanh · sale.minh) and MOCK_PASSWORD.
 * `window.__ottimoStaffMock.control` drives scenarios (failNext, dropNext, latency).
 */
export async function startMockWorker() {
  (window as unknown as { __ottimoStaffMock: unknown }).__ottimoStaffMock = {
    control: mockControl,
    users: Object.keys(MOCK_USERS),
  };
  await setupWorker(...handlers).start({ onUnhandledRequest: 'bypass', quiet: true });
}
