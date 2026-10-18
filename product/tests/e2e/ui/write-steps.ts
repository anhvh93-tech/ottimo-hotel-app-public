// Helpers for the UI cases that CLICK the write steps of the Desk (QC-S3-09, vòng sửa 9): the request the browser
// really sends is recorded and checked (status + body), money read from the screen is compared with the API.
// Not a spec file. Used by ui/desk-writes.s3.spec.ts (desk-chromium) and ui-clock/stay-writes.h15.spec.ts (desk-clock).
import { expect, test, type Browser, type Locator, type Page } from '@playwright/test';
import { WEB_URL } from '../support/env.js';
import { DEVICE_COOKIE, activeDeviceToken } from '../support/s3.js';
import { signIn, t } from './helpers.js';

/** One response of a write request the UI sent (never contains secrets: bodies of the Desk API, fake data). */
export interface Seen {
  status: number;
  path: string;
  /** JSON body of the request (undefined for multipart). */
  request: Record<string, unknown> | undefined;
  /** Response body (JSON text of the Desk API – fake data, no secrets). */
  body: string;
}

/** Record every response of `page` whose method and URL path match – the writes the screen really sent. */
export function recordWrites(page: Page, method: string, path: RegExp): Seen[] {
  const seen: Seen[] = [];
  page.on('response', async (r) => {
    const req = r.request();
    const p = new URL(r.url()).pathname;
    if (req.method() !== method || !path.test(p)) return;
    let request: Record<string, unknown> | undefined;
    try {
      request = req.postDataJSON() as Record<string, unknown> | undefined;
    } catch {
      request = undefined; // multipart
    }
    const body = await r.text().catch(() => '');
    seen.push({ status: r.status(), path: p, request, body });
  });
  return seen;
}

/**
 * Wait until a recorded write answered `status`; otherwise fail with what the server really answered (e.g.
 * `422 {"code":"VALIDATION_FAILED","errors":[{"field":"Idempotency-Key"…}]}`), so a red run names the bug.
 */
export async function waitWrite(
  seen: Seen[],
  what: string,
  status = 201,
  pick: (s: Seen) => boolean = () => true,
  timeoutMs = 15_000,
): Promise<Seen> {
  const end = Date.now() + timeoutMs;
  for (;;) {
    const hit = seen.find((s) => pick(s) && s.status === status);
    if (hit) return hit;
    if (Date.now() > end) break;
    await new Promise((ok) => setTimeout(ok, 200));
  }
  const got =
    seen
      .filter(pick)
      .map((s) => `${s.status} ${s.body.slice(0, 500)}`)
      .join(' | ') || 'giao diện không gửi request nào';
  expect(false, `${what}: mong đợi ${status}, thực tế: ${got}`).toBe(true);
  throw new Error('unreachable');
}

/** 450000 → "450.000" (vi-VN, the Desk's money format without unit). */
export const vnd = (n: number): string => n.toLocaleString('vi-VN');

/** Whole amount `n` as written on screen – not a piece of a larger number ("450.000" ≠ "1.450.000"). */
export function amountRe(n: number): RegExp {
  return new RegExp(`(^|[^\\d.])${vnd(n).replace(/\./g, '\\.')}(?![\\d.])`);
}

/** Digits of a money cell ("−1.416.000" → 1416000); the sign is the drawer's "deduction" look, not data. */
export const digits = (s: string): number => Number(s.replace(/[^\d]/g, '') || 'NaN');

/** Desk PC = granted device: the device cookie of the seed desk (or of the virtual device on the clock project). */
export async function trustedDesk(page: Page): Promise<void> {
  const token = activeDeviceToken();
  test.skip(!token, 'môi trường: thiếu token thiết bị được cấp (seed DS-E .out)');
  await page
    .context()
    .addCookies([
      { name: DEVICE_COOKIE, value: token!, url: WEB_URL, httpOnly: true, sameSite: 'Lax' },
    ]);
}

/** A second Desk (another person at the counter): own browser context, granted device, signed in as `user`. */
export async function deskAs(browser: Browser, user: string): Promise<Page> {
  const ctx = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh',
  });
  const page = await ctx.newPage();
  await trustedDesk(page);
  await signIn(page, user);
  return page;
}

/** Row "Đã thu" of the Folio block in the booking drawer (H10/H15): its amount, or null when not shown. */
export async function drawerPaid(page: Page): Promise<number | null> {
  const row = page
    .getByRole('row')
    .filter({ has: page.getByRole('cell', { name: t('drawer.folio.paid'), exact: true }) });
  if ((await row.count()) === 0) return null;
  return digits(await row.first().getByRole('cell').last().innerText());
}

/** Row "Còn phải thu" (first one – the Folio summary) of the drawer. */
export async function drawerBalance(page: Page): Promise<number | null> {
  const row = page
    .getByRole('row')
    .filter({ has: page.getByRole('cell', { name: t('drawer.folio.balance'), exact: true }) });
  if ((await row.count()) === 0) return null;
  return digits(await row.first().getByRole('cell').last().innerText());
}

/**
 * Every open dialog box (Modal = dialog, ConfirmDialog = alertdialog) – NOT the booking drawer, which is a Modal
 * `variant="drawer"` with role dialog too (its folio may show the same amount).
 */
export function dialogs(page: Page): Locator {
  return page.locator('[role="dialog"]:not(.drawer), [role="alertdialog"]');
}

/** A 16×16 PNG as a browser file (the api decodes and re-encodes it – PNG_16X16 of support/s3.ts). */
export function photo(
  buffer: Buffer,
  name = 'chung-tu.png',
): { name: string; mimeType: string; buffer: Buffer } {
  return { name, mimeType: 'image/png', buffer };
}

/**
 * H13/H14 "Nhập tay": chọn người có tên trên giấy tờ (SEC BE-73, ARC 16.22 – FE-A: giấy tờ mới luôn gắn người, không
 * mặc định người đặt). `booker` = người đặt, `new` = "Người ở chưa có trong đơn", chuỗi khác = tên người trong đoàn.
 * Bản Desk chưa có ô chọn người thì bỏ qua.
 */
export async function pickDocPerson(dlg: Locator, who: 'booker' | 'new' | string): Promise<void> {
  const sel = dlg.getByLabel(t('reg.link.member'));
  if (!(await sel.isVisible({ timeout: 3_000 }).catch(() => false))) return;
  // danh sách người tải sau khi hộp mở (listParty) – chờ có người đặt / đủ người trước khi chọn
  if (who !== 'new')
    await expect
      .poll(async () => (await sel.locator('option').count()) > 2, {
        timeout: 10_000,
        message: 'danh sách người trong đoàn đã tải',
      })
      .toBe(true);
  const labels = await sel.locator('option').allTextContents();
  const label =
    who === 'booker'
      ? labels.find((l) => l.includes(t('rsv.booker')))
      : who === 'new'
        ? labels.find((l) => l === t('reg.person_not_in_party'))
        : labels.find((l) => l.startsWith(who));
  expect(label, `chọn người (${who}) trong: ${labels.join(' | ')}`).toBeTruthy();
  await sel.selectOption({ label: label! });
}
