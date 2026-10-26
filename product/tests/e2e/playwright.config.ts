// Playwright – OTTIMO Desk E2E (test-strategy section 2, tier E; plan R2 W8).
//
// Target = a running stack. Local: `pnpm dev` (docker compose) then `pnpm test:e2e`.
// CI: the docker-build job's stack. Staging: set E2E_API_URL / E2E_WEB_URL.
//
// Projects
//   smoke            – the (S) suite, every PR (API-level checks need no browser)
//   rbac             – role-gate runner over fixtures/rbac-cases.json (Sprint 1 + Sprint 2 operations, rbac/)
//   api              – E2E API flows per story (api/*.api.spec.ts) – Playwright request API, no browser
//   limits           – login lockout + per-IP limit (limits/), serial, after rbac + api
//   rbac-logout      – logout cases; kill the cached sessions, so they run after rbac + api + limits
//   serial           – live shared-state changes (serial/): one worker, before clock
//   clock            – MutableClock scenarios (hold expiry J1/J2, quote J3, no-show J6/J7, OOO J9 – clock/): serial,
//                      after every other project; enabled in CI or with E2E_CLOCK_CONTROL=1 (moves the shared clock)
//   db-outage        – TC-X-050c stops PostgreSQL: runs after every other project
//   desk-clock       – UI cases needing the MutableClock (ui-clock/: H16 trả phòng 3 bước + axe): serial, after clock
//   desk-chromium    – front desk PC 1366×768 (flows/, ui/ – UI smoke + axe H01–H12 need E2E_UI=1 + chromium;
//                      reuses the harness sessions; limits + rbac-logout run after it)
//   mobile-webkit    – Safari iOS 390×844 (housekeeping PWA, guest-web)
//   android-chromium – Chrome Android 360×800
import { defineConfig, devices } from '@playwright/test';

const API_URL = process.env.E2E_API_URL ?? 'http://127.0.0.1:3000';
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: '.',
  // Resets the login limiter (/__test__/rate-limits/reset) and logs the DS-E accounts in once
  // (SR-RL-01: 20 logins/IP/15 min) – sessions cached in e2e/.auth/, reused until revoked.
  globalSetup: './global-setup.ts',
  outputDir: './test-results',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI
    ? [
        ['list'],
        ['junit', { outputFile: './test-results/junit.xml' }],
        ['html', { open: 'never', outputFolder: './playwright-report' }],
      ]
    : [['list'], ['html', { open: 'never', outputFolder: './playwright-report' }]],
  use: {
    baseURL: API_URL,
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh',
    trace: 'retain-on-failure',
    extraHTTPHeaders: { 'x-e2e': 'ottimo-qa' },
  },
  projects: [
    { name: 'smoke', testMatch: /smoke\/.*\.spec\.ts$/ },
    // Production read-only smoke after a deploy (QA-3, BUG-R3-015): GET only, + one optional login/logout of a smoke
    // account given by the person running it. Needs E2E_PROD_SMOKE=1, otherwise every case skips.
    {
      name: 'smoke-prod',
      testMatch: /smoke-prod\/.*\.prod\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 768 } },
    },
    { name: 'rbac', testMatch: /rbac\/rbac-sprint\d\.spec\.ts$/ },
    { name: 'api', testMatch: /api\/.*\.api\.spec\.ts$/ },
    // TC-NT-043 lockout / SR-RL-01 IP window: serial, after every project that logs in through the
    // harness (a 429 there triggers /__test__/rate-limits/reset, which would wipe a lockout in progress).
    {
      name: 'limits',
      testMatch: /limits\/.*\.spec\.ts$/,
      fullyParallel: false,
      // desk-chromium too: its form logins (TC-NT-001/006) reset the limiter on 429 (ui/helpers.ts loginForm)
      dependencies: ['rbac', 'api', 'desk-chromium'],
    },
    {
      name: 'rbac-logout',
      testMatch: /rbac\/rbac-logout\.spec\.ts$/,
      // desk-chromium reuses the cached sessions (cookie injected – ui/helpers.ts signIn)
      dependencies: ['rbac', 'api', 'limits', 'desk-chromium'],
    },
    // Live shared-state changes (parameter effective today, room price/sellable/capacity – serial/): one worker,
    // after every project that books or prices, before clock. Each case restores what it changed.
    {
      name: 'serial',
      testMatch: /serial\/.*\.serial\.spec\.ts$/,
      fullyParallel: false,
      workers: 1,
      dependencies: ['smoke', 'rbac', 'api', 'limits', 'rbac-logout', 'desk-chromium'],
    },
    // Moving the clock changes "today" and expires every session: serial, after every project that uses the API
    // (UI included). Each test sets/freezes the clock itself; afterAll resets it (support/clock.ts).
    {
      name: 'clock',
      testMatch: /clock\/.*\.clock\.spec\.ts$/,
      fullyParallel: false,
      // one worker: two clock files in parallel would move the shared clock under each other
      workers: 1,
      dependencies: ['smoke', 'rbac', 'api', 'limits', 'rbac-logout', 'desk-chromium', 'serial'],
    },
    // UI cases that need the MutableClock (H16 trả phòng: đơn đi hôm nay đã nhận phòng hôm trước) – serial, after
    // clock (same rule: moving the clock changes "today" for the whole stack). Each case resets the clock.
    {
      name: 'desk-clock',
      testMatch: /ui-clock\/.*\.spec\.ts$/,
      fullyParallel: false,
      workers: 1,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 768 } },
      dependencies: [
        'smoke',
        'rbac',
        'api',
        'limits',
        'rbac-logout',
        'desk-chromium',
        'serial',
        'clock',
      ],
    },
    {
      name: 'desk-chromium',
      testMatch: /(flows|ui)\/.*\.spec\.ts$/,
      testIgnore: /\.mobile\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 768 } },
    },
    {
      name: 'mobile-webkit',
      testMatch: /flows\/.*\.mobile\.spec\.ts$/,
      use: { ...devices['iPhone 13'], viewport: { width: 390, height: 844 } },
    },
    {
      name: 'android-chromium',
      testMatch: /flows\/.*\.mobile\.spec\.ts$/,
      use: { ...devices['Pixel 5'], viewport: { width: 360, height: 800 } },
    },
    // TC-X-050c stops PostgreSQL (E2E_COMPOSE_CONTROL=1 only): last, after every project using the DB.
    {
      name: 'db-outage',
      testMatch: /outage\/.*\.spec\.ts$/,
      dependencies: [
        'smoke',
        'rbac-logout',
        'serial',
        'clock',
        'desk-clock',
        'desk-chromium',
        'mobile-webkit',
        'android-chromium',
      ],
    },
  ],
});
