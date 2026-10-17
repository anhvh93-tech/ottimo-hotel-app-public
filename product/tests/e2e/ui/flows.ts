// Bước dùng chung của các E2E liền mạch (A1, A4 – s4-test-plan mục 5): Desk của từng người, PWA nhân viên cỡ điện
// thoại, trạng thái buồng, buồng phòng dọn + lễ tân trưởng kiểm trên PWA (VD → CL → VC → VI). Mọi bước ghi bấm thật;
// request trình duyệt gửi được ghi lại (write-steps.ts) và phải đúng mã.
import { expect, type APIRequestContext, type Browser, type Page } from '@playwright/test';
import { call, session } from '../support/api.js';
import { setClock } from '../support/clock.js';
import { SESSION_COOKIE, STAFF_URL } from '../support/env.js';
import { vnTime } from '../support/s2.js';
import { EP3, PNG_16X16, p3 } from '../support/s3.js';
import { signIn, t } from './helpers.js';
import { photo, recordWrites, trustedDesk, waitWrite } from './write-steps.js';

const esc = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const tf = (key: string, vars: Record<string, string | number>): string =>
  t(key).replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));

/** Desk của một người: ngữ cảnh trình duyệt riêng, máy quầy được cấp, giờ trình duyệt = giờ ảo của stack. */
export async function desk(browser: Browser, user: string, iso: string): Promise<Page> {
  const ctx = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh',
  });
  const page = await ctx.newPage();
  await page.clock.setFixedTime(new Date(iso));
  await trustedDesk(page);
  await signIn(page, user);
  return page;
}

/**
 * PWA nhân viên (apps/mobile) cỡ điện thoại. Giờ trình duyệt CHẠY từ giờ ảo (clock.install): hàng đợi PWA giữ mỗi
 * thao tác 10 giây để hoàn tác rồi mới gửi; `performedAt` phải trong [giờ server − 24 giờ, + 5 phút] và sau `since`
 * (B-02) – gọi với đúng giờ server hiện tại.
 */
export async function staffApp(
  browser: Browser,
  request: APIRequestContext,
  user: string,
  iso: string,
): Promise<Page> {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh',
  });
  const page = await ctx.newPage();
  await page.clock.install({ time: new Date(iso) });
  const s = await session(request, user);
  await ctx.addCookies([
    { name: SESSION_COOKIE, value: s.token, url: STAFF_URL, httpOnly: true, sameSite: 'Lax' },
  ]);
  return page;
}

/** Qua hết thời gian hoàn tác của hàng đợi PWA (UNDO_MS 10 giây) để lệnh được gửi. */
export async function pastUndo(page: Page): Promise<void> {
  await page.clock.fastForward('00:12');
}

/** Trạng thái SM-03 của căn (listRoomStatuses, phiên lễ tân mới – đồng hồ có thể vừa tua). */
export async function roomStatusOf(
  request: APIRequestContext,
  roomId: string,
): Promise<string | undefined> {
  const s = await session(request, 'qa.fd');
  const r = await call<{ data: Array<{ roomId: string; status: string }> }>(
    request,
    'GET',
    p3(EP3.listRoomStatuses, s),
    { session: s },
  );
  expect(r.status, `listRoomStatuses: ${JSON.stringify(r.body).slice(0, 200)}`).toBe(200);
  return r.body.data.find((x) => x.roomId === roomId)?.status;
}

/**
 * Buồng `VD` có việc dọn → PWA `qa.hk`: thẻ việc "Căn {số}" → Bắt đầu dọn (VD → CL) → Dọn xong (CL → VC);
 * PWA `qa.fdl`: Kiểm phòng – tick đủ checklist + ảnh → Kiểm đạt (VC → VI). `day` 11:30 / 12:00 theo giờ server.
 * `taskName` (tùy chọn): chữ phải có trên thẻ việc (vd. "Dọn sau sửa chữa").
 */
export async function pwaCleanInspect(
  browser: Browser,
  request: APIRequestContext,
  rm: { id: string; roomNo: string },
  day: string,
  opts: { taskName?: string; cleanAt?: string; inspectAt?: string } = {},
): Promise<void> {
  const statusOf = () => roomStatusOf(request, rm.id);
  await expect.poll(statusOf, { message: 'căn cần dọn' }).toBe('VD');
  const cleanAt = vnTime(day, opts.cleanAt ?? '11:30');
  await setClock(request, cleanAt);
  const hk = await staffApp(browser, request, 'qa.hk', cleanAt);
  const moves = recordWrites(hk, 'POST', /\/rooms\/[^/]+\/status-transitions$/);
  await hk.goto(`${STAFF_URL}/#/tasks`);
  // thẻ việc mang tên "Căn {số}, {tên}" (roomLabel); chữ trong thẻ dính liền số căn nên lọc theo tên thẻ
  let task = hk
    .getByRole('article', {
      name: new RegExp(`^${esc(tf('hk.room_title', { room: rm.roomNo }))}(,|$)`),
    })
    .filter({ has: hk.getByRole('button', { name: t('hk.action.start_cleaning') }) });
  if (opts.taskName) task = task.filter({ hasText: opts.taskName });
  await expect(task.first(), 'việc dọn của căn có trên PWA').toBeVisible({ timeout: 20_000 });
  await task
    .first()
    .getByRole('button', { name: t('hk.action.start_cleaning') })
    .click();
  await pastUndo(hk);
  const start = await waitWrite(moves, 'transitionRoomStatus start_cleaning', 200);
  expect(start.request).toMatchObject({ event: 'start_cleaning', expectedFrom: 'VD' });
  await expect.poll(statusOf).toBe('CL');
  const finish = hk.getByRole('button', { name: t('hk.action.finish_cleaning') });
  if (!(await finish.isVisible().catch(() => false))) await hk.goto(`${STAFF_URL}/#/room/${rm.id}`);
  await finish.click();
  await pastUndo(hk);
  const fin = await waitWrite(moves, 'transitionRoomStatus finish_cleaning', 200, (s) =>
    JSON.stringify(s.request).includes('finish_cleaning'),
  );
  expect(fin.request).toMatchObject({ event: 'finish_cleaning', expectedFrom: 'CL' });
  await expect.poll(statusOf).toBe('VC');
  await hk.context().close();

  const inspectAt = vnTime(day, opts.inspectAt ?? '12:00');
  await setClock(request, inspectAt);
  const fdl = await staffApp(browser, request, 'qa.fdl', inspectAt);
  const insp = recordWrites(fdl, 'POST', /\/rooms\/[^/]+\/inspections$/);
  await fdl.goto(`${STAFF_URL}/#/inspect/${rm.id}`);
  const legend = fdl.getByRole('group', { name: t('hk.insp.legend') });
  await expect(legend).toBeVisible({ timeout: 20_000 });
  for (const box of await legend.getByRole('checkbox').all()) await box.check();
  const pick = fdl.locator('input[type="file"]');
  if ((await pick.count()) > 0)
    await pick.first().setInputFiles(photo(PNG_16X16, 'kiem-phong.png'));
  const pass = fdl.getByRole('button', { name: t('hk.insp.pass') });
  await expect(pass).not.toHaveAttribute('aria-disabled', 'true', { timeout: 15_000 });
  await pass.click();
  await pastUndo(fdl);
  const ins = await waitWrite(insp, 'recordInspection đạt', 201);
  expect(
    ((ins.request as Record<string, unknown>).items as Array<{ passed: boolean }>).every(
      (i) => i.passed,
    ),
    'mọi mục checklist đạt',
  ).toBe(true);
  await expect.poll(statusOf, { message: 'căn sẵn sàng sau kiểm đạt' }).toBe('VI');
  await fdl.context().close();
}
