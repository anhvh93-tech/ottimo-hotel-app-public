// Shared helpers for the admin-web UI specs (project desk-chromium). Not a spec file.
// Labels come from design/copy/strings-vi.json so a copy change breaks loudly here, not silently.
import { readFileSync } from 'node:fs';
import { expect, type Browser, type Page } from '@playwright/test';
import { resetRateLimits, session } from '../support/api.js';
import { SEED_PASSWORD, SESSION_COOKIE, WEB_URL } from '../support/env.js';

export const UI = process.env.E2E_UI === '1';

export const VI = JSON.parse(
  readFileSync(new URL('../../../design/copy/strings-vi.json', import.meta.url), 'utf8'),
) as Record<string, string>;

export const t = (key: string): string => {
  const v = VI[key];
  if (!v) throw new Error(`strings-vi.json thiếu ${key}`);
  return v;
};

/** Static part of a copy string with {placeholders} (for getByText). */
export const stem = (key: string): string => t(key).split('{')[0]!.trim();

const LOGIN_LABEL = /Số điện thoại hoặc email|Tên đăng nhập/;

export async function hasLoginForm(page: Page): Promise<boolean> {
  await page.goto(WEB_URL);
  return page
    .getByLabel(LOGIN_LABEL)
    .first()
    .waitFor({ timeout: 5_000 })
    .then(() => true)
    .catch(() => false);
}

/**
 * Log in through the real login screen (H01) and wait for the app shell (H02 navigation). Only for cases that
 * test the login itself: every form login counts against SR-RL-01 (20 logins/IP/15 min, the IP is Caddy's).
 * On "quá nhiều lần" the harness resets the limiter once (/__test__/rate-limits/reset, not prefix "qa.").
 */
export async function loginForm(page: Page, user: string): Promise<void> {
  for (let attempt = 0; attempt < 2; attempt++) {
    await page.goto(WEB_URL);
    await page.getByLabel(LOGIN_LABEL).first().fill(user);
    await page
      .getByLabel(/Mật khẩu/)
      .first()
      .fill(SEED_PASSWORD ?? '');
    await page.getByRole('button', { name: /Đăng nhập/ }).click();
    const nav = page.getByRole('navigation').first();
    const limited = page.getByText(/quá nhiều lần/).first();
    await expect(nav.or(limited)).toBeVisible({ timeout: 15_000 });
    if (await nav.isVisible()) return;
    if (attempt > 0 || !(await resetRateLimits(page.context().request, `UI login ${user}`)))
      throw new Error(`login ${user}: SR-RL-01 – quá nhiều lần đăng nhập từ IP của web`);
  }
}

/**
 * Open admin-web already signed in as `user`, reusing the harness session (global-setup, e2e/.auth): the
 * session cookie is put into the browser context, so no extra login is spent. Falls back to the form when
 * the cookie is not accepted.
 */
export async function signIn(page: Page, user: string): Promise<void> {
  const s = await session(page.context().request, user);
  await page
    .context()
    .addCookies([
      { name: SESSION_COOKIE, value: s.token, url: WEB_URL, httpOnly: true, sameSite: 'Lax' },
    ]);
  await page.goto(WEB_URL);
  const nav = page.getByRole('navigation').first();
  const ok = await nav
    .waitFor({ timeout: 10_000 })
    .then(() => true)
    .catch(() => false);
  if (!ok) await loginForm(page, user);
}

export async function newDesk(browser: Browser, user: string): Promise<Page> {
  const ctx = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh',
  });
  const page = await ctx.newPage();
  await signIn(page, user);
  return page;
}

/** Open Sơ đồ phòng (H08) from the menu; false when the screen is not on this build. */
export async function openRack(page: Page): Promise<boolean> {
  await page
    .getByRole('link', { name: t('nav.rack') })
    .first()
    .click();
  return page
    .getByRole('grid')
    .first()
    .waitFor({ timeout: 10_000 })
    .then(() => true)
    .catch(() => false);
}

/** Letters-only unique name (V-01: no digits in names). */
export function lettersOnly(len = 6): string {
  const a = 'abcdefghijklmnopqrstuvwxyz';
  let s = '';
  for (let i = 0; i < len; i++) s += a[Math.floor(Math.random() * a.length)];
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Unique VN mobile number 09xxxxxxxx (fake test data). */
export function fakePhone(): string {
  return `093${String(Math.floor(Math.random() * 1e7)).padStart(7, '0')}`;
}
