import '@testing-library/jest-dom/vitest';
import { loadLocale } from '@ottimo/i18n';
import { cleanup, configure } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';
import { clearClientData } from '../app/clientData';
import { mockControl } from '../mocks/handlers';
import { server } from '../mocks/node';

// CI runs many workers at once: the first test of a file also pays the on-demand transform of the
// lazy route chunks (rack / reservations / quotes). 1 s (default) was too short there – 5 s keeps
// findBy*/waitFor deterministic without slowing green runs (they resolve as soon as the UI is ready).
configure({ asyncUtilTimeout: 5_000 });

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
});
afterAll(() => server.close());
