import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';
import { mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';

configure({ asyncUtilTimeout: 5_000 });

const DOM = typeof window !== 'undefined'; // bundle.test.ts runs in the node environment

// jsdom reports en-US; the guest default follows the browser (EP06 8.5) – tests run as a Vietnamese phone.
if (DOM) {
  Object.defineProperty(window.navigator, 'languages', { value: ['vi-VN'], configurable: true });
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  mockControl.reset();
  if (!DOM) return;
  window.history.replaceState(null, '', '/');
  sessionStorage.clear();
  localStorage.clear();
});
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());
