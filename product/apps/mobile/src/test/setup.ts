import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
import { cleanup, configure } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';
import { mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';

configure({ asyncUtilTimeout: 5_000 });

// jsdom has no object URLs (work order photos use them).
if (typeof URL !== 'undefined' && typeof URL.createObjectURL !== 'function') {
  let n = 0;
  URL.createObjectURL = () => `blob:mock/${++n}`;
  URL.revokeObjectURL = () => undefined;
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  mockControl.reset();
  if (typeof window === 'undefined') return;
  window.history.replaceState(null, '', '/');
  localStorage.clear();
});
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());
