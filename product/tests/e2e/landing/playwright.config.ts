// Playwright – OTTIMO landing LP-v1 (ADR-014 9, concept 11, sprint-4-plan T11). Separate from the Desk config:
// no API stack, no login. Runs against the static build of apps/landing-web served by serve.mjs (same headers as
// ADR-014 1.4 – real CSP), so CSP violations, third-party requests and byte budgets show up before deploy.
//   pnpm --filter @ottimo/landing-web build && pnpm --filter @ottimo/landing-web build:booking-preview \
//     && pnpm --filter @ottimo/landing-web build:booking-live-test && pnpm --filter @ottimo/tests test:e2e:landing
import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.LANDING_PORT ?? 5186);
// Port of the booking-form review build (same default as helpers.ts FORM_URL)
const FORM_PORT = Number(process.env.LANDING_FORM_PORT ?? 5187);
// Port of the live-form test build (LANDING_BOOKING_FORM=true, slug dl01 – same default as helpers.ts LIVE_URL)
const LIVE_PORT = Number(process.env.LANDING_LIVE_PORT ?? 5188);
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: '.',
  testMatch: /.*\.landing\.spec\.ts$/,
  outputDir: '../test-results/landing',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI
    ? [
        ['list'],
        ['junit', { outputFile: '../test-results/landing-junit.xml' }],
        ['html', { open: 'never', outputFolder: '../playwright-report/landing' }],
      ]
    : [['list']],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      // production build (apps/landing-web/dist): booking form off
      command: `node serve.mjs --port ${PORT}`,
      url: `http://127.0.0.1:${PORT}/robots.txt`,
      reuseExistingServer: !isCI,
      timeout: 30_000,
    },
    {
      // review build with the booking form rendered (pnpm --filter @ottimo/landing-web build:booking-preview)
      command: `node serve.mjs --port ${FORM_PORT} --root ../../../apps/landing-web/dist-booking-preview`,
      url: `http://127.0.0.1:${FORM_PORT}/robots.txt`,
      reuseExistingServer: !isCI,
      timeout: 30_000,
    },
    {
      // live form (pnpm --filter @ottimo/landing-web build:booking-live-test): the public API is answered by the
      // tests (page.route) on the same origin, as the landing Caddy proxies it in production (contract route)
      command: `node serve.mjs --port ${LIVE_PORT} --root ../../../apps/landing-web/dist-booking-live`,
      url: `http://127.0.0.1:${LIVE_PORT}/robots.txt`,
      reuseExistingServer: !isCI,
      timeout: 30_000,
    },
  ],
  projects: [{ name: 'landing-chromium', use: { ...devices['Desktop Chrome'] } }],
});
