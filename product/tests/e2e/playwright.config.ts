// Playwright – OTTIMO Desk E2E (test-strategy section 2, tier E; plan R2 W8).
//
// Target = a running stack. Local: `pnpm dev` (docker compose) then `pnpm test:e2e`.
// CI: the docker-build job's stack. Staging: set E2E_API_URL / E2E_WEB_URL.
//
// Projects
//   smoke            – the (S) suite, every PR (API-level checks need no browser)
//   rbac             – role-gate runner over fixtures/rbac-cases.json (Sprint 1 operations, rbac/)
//   api              – E2E API flows per story (api/*.api.spec.ts) – Playwright request API, no browser
//   limits           – login lockout + per-IP limit (limits/), serial, after rbac + api
//   rbac-logout      – logout cases; kill the cached sessions, so they run after rbac + api + limits
//   db-outage        – TC-X-050c stops PostgreSQL: runs after every other project
//   desk-chromium    – front desk PC 1366×768 (flows/, ui/ – UI smoke needs E2E_UI=1 + chromium)
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
    { name: 'rbac', testMatch: /rbac\/rbac-sprint1\.spec\.ts$/ },
    { name: 'api', testMatch: /api\/.*\.api\.spec\.ts$/ },
    // TC-NT-043 lockout / SR-RL-01 IP window: serial, after every project that logs in through the
    // harness (a 429 there triggers /__test__/rate-limits/reset, which would wipe a lockout in progress).
    {
      name: 'limits',
      testMatch: /limits\/.*\.spec\.ts$/,
      fullyParallel: false,
      dependencies: ['rbac', 'api'],
    },
    {
      name: 'rbac-logout',
      testMatch: /rbac\/rbac-logout\.spec\.ts$/,
      dependencies: ['rbac', 'api', 'limits'],
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
      dependencies: ['smoke', 'rbac-logout', 'desk-chromium', 'mobile-webkit', 'android-chromium'],
    },
  ],
});
