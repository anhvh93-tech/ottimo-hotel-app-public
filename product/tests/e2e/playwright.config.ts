// Playwright – OTTIMO Desk E2E (test-strategy section 2, tier E; plan R2 W8).
//
// Target = a running stack. Local: `pnpm dev` (docker compose) then `pnpm test:e2e`.
// CI: the docker-build job's stack. Staging: set E2E_API_URL / E2E_WEB_URL.
//
// Projects
//   smoke            – the (S) suite, every PR (API-level checks need no browser)
//   desk-chromium    – front desk PC 1366×768 (flows/, from sprint 1)
//   mobile-webkit    – Safari iOS 390×844 (housekeeping PWA, guest-web)
//   android-chromium – Chrome Android 360×800
import { defineConfig, devices } from '@playwright/test';

const API_URL = process.env.E2E_API_URL ?? 'http://127.0.0.1:3000';
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: '.',
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
    {
      name: 'desk-chromium',
      testMatch: /flows\/.*\.spec\.ts$/,
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
  ],
});
