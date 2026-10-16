import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';
import { clearClientData } from '../app/clientData';
import { mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  mockControl.reset();
  clearClientData();
  if (typeof sessionStorage !== 'undefined') sessionStorage.clear();
  if (typeof localStorage !== 'undefined') localStorage.clear();
});
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());
