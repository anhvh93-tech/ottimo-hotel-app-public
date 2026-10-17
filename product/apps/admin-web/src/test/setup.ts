import '@testing-library/jest-dom/vitest';
import { isIdempotencyKey } from '@ottimo/api-client';
import { loadLocale } from '@ottimo/i18n';
import { cleanup, configure } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach, expect } from 'vitest';
import { clearClientData } from '../app/clientData';
import { mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';

// CI runs many workers at once: the first test of a file also pays the on-demand transform of the
// lazy route chunks (rack / reservations / quotes). 1 s (default) was too short there – 5 s keeps
// findBy*/waitFor deterministic without slowing green runs (they resolve as soon as the UI is ready).
configure({ asyncUtilTimeout: 5_000 });

// UXR #2: every Idempotency-Key any test sends must be a UUID (the API answers 422 otherwise) – checked
// for every request of every test, not only the screens that upload.
const badKeys: string[] = [];
server.events.on('request:start', ({ request }) => {
  const key = request.headers.get('idempotency-key');
  if (key !== null && !isIdempotencyKey(key))
    badKeys.push(`${request.method} ${new URL(request.url).pathname} → ${key}`);
});

beforeAll(async () => {
  server.listen({ onUnhandledRequest: 'error' });
  // EN is a lazy chunk in the app; tests that read EN strings get it up front.
  await loadLocale('en');
  // Warm the lazy route chunks so no single test carries the module-transform cost.
  await Promise.all([
    import('../pages/rack/RackPage'),
    import('../pages/reservations/ReservationsPage'),
    import('../pages/quotes/QuotesPage'),
    import('../pages/registration/RegistrationPage'),
    import('../pages/approvals/ApprovalsPage'),
    import('../pages/money/MoneyPage'),
  ]);
}, 30_000);
beforeEach(() => {
  mockControl.reset();
  clearClientData();
  if (typeof sessionStorage !== 'undefined') sessionStorage.clear();
  if (typeof localStorage !== 'undefined') localStorage.clear();
});
afterEach(() => {
  cleanup();
  server.resetHandlers();
  const bad = badKeys.splice(0);
  expect(bad, 'Idempotency-Key must be a UUID').toEqual([]);
});
afterAll(() => server.close());
