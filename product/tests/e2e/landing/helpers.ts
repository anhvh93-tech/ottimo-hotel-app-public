// Shared helpers of the landing E2E (LP-v1).
import { AxeBuilder } from '@axe-core/playwright';
import type { Page, TestInfo } from '@playwright/test';

export const PAGES = { en: '/', vi: '/vi/' } as const;
export type Lang = keyof typeof PAGES;
// 320 (dưới mốc 360 của US-153 AC6), 375, 768 (US-153 AC6), 1280
export const WIDTHS = [320, 375, 768, 1280] as const;
export const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/** Errors seen by the page: console errors (CSP violations are logged there), uncaught exceptions, CSP events. */
export function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console: ${m.text()}`);
  });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  return errors;
}

/** Every request that leaves the landing origin (must stay 0 – SEC C-1, ADR-014 2.6). */
export function watchForeignRequests(page: Page, baseURL: string): string[] {
  const origin = new URL(baseURL).origin;
  const foreign: string[] = [];
  page.on('request', (r) => {
    const url = r.url();
    if (url.startsWith('data:') || url.startsWith('blob:')) return;
    if (new URL(url).origin !== origin) foreign.push(url);
  });
  return foreign;
}

export async function cspViolations(page: Page): Promise<string[]> {
  return page.evaluate(() => (window as unknown as { __csp?: string[] }).__csp ?? []);
}

/** Records securitypolicyviolation events from the first byte of every document. */
export async function recordCsp(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const w = window as unknown as { __csp: string[] };
    w.__csp = [];
    document.addEventListener('securitypolicyviolation', (e) =>
      w.__csp.push(`${e.violatedDirective} ${e.blockedURI}`),
    );
  });
}

/** Scroll to the bottom in viewport steps so lazy images load (concept 11.2 "cuộn hết"). */
export async function scrollThrough(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const step = Math.max(200, Math.floor(window.innerHeight * 0.8));
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, document.documentElement.scrollHeight);
  });
  await page.waitForLoadState('networkidle').catch(() => undefined);
}

export async function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
}

/** axe-core, WCAG 2.0/2.1 A+AA and 2.2 AA: the landing gate is 0 violations of any impact (concept 11.1). */
export async function axeViolations(page: Page, info: TestInfo, name: string) {
  const res = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  const brief = res.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    help: v.help,
    targets: v.nodes.slice(0, 5).map((n) => n.target.join(' ')),
  }));
  await info.attach(`axe-${name}.json`, {
    body: JSON.stringify(brief, null, 2),
    contentType: 'application/json',
  });
  return brief;
}
