// QA – ESC-031 Desk H16 on a stack with MFA_ENFORCED=true (scratchpad only): one way only ("Ghi phụ thu – quản lý xem
// lại"), no password field, request body = exactly {amountVnd, reason, postReview}; screenshots: step 3, the confirm
// dialog (UXD FB-02), the message after a 409 SURCHARGE_CHANGED (number changed under the desk – simulated by
// rewriting the amount in the outgoing request, the server answers for real), and after a 422 when the night became
// sellable (next guest cancelled meanwhile). Screens go to SHOTS (rounds/round-03/outputs/FE/esc031-shots/).
import { mkdirSync } from 'node:fs';
import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { sessionOrSkip, stackToday } from '../support/api.js';
import { setClock } from '../support/clock.js';
import { action, addDays, room, s2Context, vnTime, getReservation } from '../support/s2.js';
import { cleanRooms, inHouse, makeStay, useVirtualDevice } from '../support/s3.js';
import { desk, openCheckOut } from '../ui/flows.js';
import { t } from '../ui/helpers.js';

// Only on a stack with MFA_ENFORCED=true (E2E_TOTP_DIR – README "Stack bật 2FA bắt buộc"): with 2FA off (CI) the desk path is
// offered on purpose, so "one way only" does not hold there.
test.skip(!process.env.E2E_TOTP_DIR, 'Chỉ chạy trên stack MFA_ENFORCED=true (đặt E2E_TOTP_DIR)');
const SHOTS = process.env.QA_ESC_SHOTS ?? 'test-results/qa-esc031-shots';
if (process.env.E2E_TOTP_DIR) mkdirSync(SHOTS, { recursive: true });
const esc = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const stem = (key: string): string => t(key).split('{')[0]!.trim();
const shot = (p: Page, name: string) =>
  p.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true });

async function at(request: APIRequestContext, date: string, hhmm: string): Promise<string> {
  const iso = await setClock(request, vnTime(date, hhmm));
  await useVirtualDevice(request, iso);
  return vnTime(date, hhmm);
}

async function payQr(page: Page, amount: string) {
  await page
    .getByRole('button', { name: t('pay.vietqr') })
    .first()
    .click();
  const create = page
    .getByRole('button', { name: new RegExp(esc(stem('pay.vietqr_create'))) })
    .first();
  await create.click();
  await expect(page.getByRole('img', { name: /VietQR/ }).first()).toBeVisible({ timeout: 15_000 });
  const rec = page.getByRole('button', { name: new RegExp(esc(stem('pay.record'))) }).first();
  await rec.click();
  await page.waitForTimeout(1500);
  console.log(`[ui] VietQR ${amount} ghi nhận đã thu`);
}

async function toBill(page: Page, id: string) {
  await openCheckOut(page, id);
  await expect(page.getByRole('table', { name: t('checkout.step.minibar') })).toBeVisible({
    timeout: 15_000,
  });
  await page.getByRole('button', { name: t('co.go_extras') }).click();
  await expect(
    page.getByText(new RegExp(esc(stem('co.late_fee_as_night_body')))).first(),
  ).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: t('co.go_bill') }).click();
}

test('QA ESC-031 UI – MFA bắt buộc: một cách, body 3 trường, ảnh 409/422/hộp xác nhận', async ({
  browser,
  request,
}) => {
  test.setTimeout(10 * 60_000);
  // after every instant the stack clock already reached (OWN/MGR TOTP steps only go forward): stack today + 14, a Tuesday
  let D = addDays(await stackToday(request), 14);
  while (new Date(`${D}T00:00:00Z`).getUTCDay() !== 2) D = addDays(D, 1);
  await at(request, D, '14:00');
  cleanRooms();
  const c = await s2Context(request);
  const fd = await sessionOrSkip(request, 'qa.fd');
  const st = await inHouse(request, c, fd, { room: room(c, '203'), arrival: D, nights: 1 });
  await makeStay(request, c, fd, {
    room: room(c, '203'),
    arrival: addDays(D, 1),
    nights: 1,
    pay: 'deposit',
    doc: false,
  });
  const st2 = await inHouse(request, c, fd, { room: room(c, '202'), arrival: D, nights: 1 });
  const next2 = await makeStay(request, c, fd, {
    room: room(c, '202'),
    arrival: addDays(D, 1),
    nights: 1,
    pay: 'deposit',
    doc: false,
  });
  const now = await at(request, addDays(D, 1), '20:35');

  // ── 1. Step 3: one way only, no password, the number read-only ──
  const page = await desk(browser, 'qa.fd', now);
  const bodies: string[] = [];
  page.on('request', (q) => {
    if (q.method() === 'POST' && /\/actions\/check-out$/.test(q.url()))
      bodies.push(q.postData() ?? '');
  });
  await toBill(page, st.res.id);
  const review = page.getByRole('region', {
    name: new RegExp(`^${esc(stem('co.late_fee_pr_title'))}`),
  });
  await expect(review).toBeVisible({ timeout: 15_000 });
  await page.waitForTimeout(1500); // getMy2fa answered
  const deskMode = await page.getByRole('button', { name: t('co.late_fee_mode_desk') }).count();
  const deskRadio = await page.getByRole('radio', { name: t('co.late_fee_mode_desk') }).count();
  const pw = await page.locator('input[type="password"]').count();
  console.log(`[ui] desk-mode buttons ${deskMode}, radios ${deskRadio}, password inputs ${pw}`);
  expect(deskMode + deskRadio, 'không có "Quản lý xác nhận tại quầy" khi 2FA bắt buộc').toBe(0);
  expect(pw).toBe(0);
  await review
    .getByLabel(new RegExp(`^${esc(t('co.late_fee_reason'))}`))
    .fill('Can co khach den dem nay, khong doi duoc');
  await shot(page, '01-buoc3-mot-cach-mfa');
  // pay what is due in cash – BUG-R3-017 (QA-3): the fee is posted by B18, so `recordPayment` refused cash (422 note
  // REASON_REQUIRED, no note box). Fixed (FE-A): cash above what the folio owes goes with "Hoàn tất" as `finalPayment`
  // – no POST /payments now, the panel says it was received.
  await page
    .getByRole('button', { name: t('pay.cash') })
    .first()
    .click();
  const record = page.getByRole('button', { name: new RegExp(stem('pay.record')) }).first();
  const cashResp = page
    .waitForResponse((r) => r.request().method() === 'POST' && /\/payments$/.test(r.url()), {
      timeout: 5_000,
    })
    .catch(() => null);
  const cashIn = page.getByLabel(t('co.cash_received')).first();
  if (await cashIn.isVisible().catch(() => false)) await cashIn.fill('1000000');
  await record.click();
  const cr = await cashResp;
  console.log(
    `[ui] tiền mặt 792.000 (bước 3) → ${cr ? cr.status() + ' ' + (await cr.text()).slice(0, 220) : 'không gửi request (ghi cùng Hoàn tất)'}`,
  );
  expect(cr, 'BUG-R3-017: không gọi recordPayment cho khoản B18 mới ghi').toBeNull();
  const received = t('co.pay_at_complete').replace('{method}', t('pay.cash')).split('{amount}')[0]!;
  await expect(page.getByText(new RegExp(`^${esc(received)}`)).first()).toBeVisible();
  await shot(page, '02-buoc3-tien-mat-ghi-khi-hoan-tat');

  // ── 2. Confirm dialog + 409 (amount changed under the desk) ──
  await page.route(/\/actions\/check-out$/, async (route) => {
    const b = JSON.parse(route.request().postData() ?? '{}');
    if (b.lateFeeInsteadOfNight) b.lateFeeInsteadOfNight.amountVnd += 1000;
    await route.continue({ postData: JSON.stringify(b) });
  });
  await page
    .getByRole('button', { name: /hoàn tất/i })
    .last()
    .click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toBeVisible();
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${SHOTS}/03-hop-xac-nhan-fb02.png` });
  console.log(
    `[ui] hộp xác nhận: ${(await dialog.innerText()).replace(/\s+/g, ' ').slice(0, 300)}`,
  );
  const r409 = page.waitForResponse(
    (r) => r.request().method() === 'POST' && /\/actions\/check-out$/.test(r.url()),
  );
  await dialog
    .getByRole('button', { name: /hoàn tất|Trả phòng/i })
    .last()
    .click();
  const resp409 = await r409;
  console.log(
    `[ui] check-out (số lệch) → ${resp409.status()} ${(await resp409.text()).slice(0, 160)}`,
  );
  await expect(page.getByText(new RegExp(esc(stem('co.late_fee_pr_changed')))).first()).toBeVisible(
    { timeout: 15_000 },
  );
  await shot(page, '04-sau-409-so-moi');
  expect(
    (await getReservation(request, await sessionOrSkip(request, 'qa.fd'), st.res.id)).body.status,
  ).toBe('in_house');
  await page.unroute(/\/actions\/check-out$/);

  // ── 3. Real submit: body = 3 fields ──
  await page
    .getByRole('button', { name: /hoàn tất/i })
    .last()
    .click();
  await expect(page.getByRole('alertdialog')).toBeVisible();
  const r200 = page.waitForResponse(
    (r) => r.request().method() === 'POST' && /\/actions\/check-out$/.test(r.url()),
  );
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: /hoàn tất|Trả phòng/i })
    .last()
    .click();
  const resp = await r200;
  const lastBody = JSON.parse(bodies.at(-1) ?? '{}');
  console.log(
    `[ui] check-out → ${resp.status()} ${(await resp.text()).slice(0, 300)}; bodies ${bodies.length}: ${bodies.map((b) => b.slice(0, 200)).join(' || ')}; lateFeeInsteadOfNight = ${JSON.stringify(lastBody.lateFeeInsteadOfNight)}; top keys ${Object.keys(lastBody).join(',')}`,
  );
  expect(resp.status()).toBe(200);
  expect(Object.keys(lastBody.lateFeeInsteadOfNight ?? {}).sort()).toEqual([
    'amountVnd',
    'postReview',
    'reason',
  ]);
  expect(lastBody.lateFeeInsteadOfNight.postReview).toBe(true);
  // BUG-R3-017: the cash taken on step 3 is written by B18 itself.
  expect(lastBody.finalPayment).toMatchObject({
    type: 'charge',
    method: 'cash',
    amountVnd: 792_000,
  });
  await page.waitForTimeout(1500);
  await shot(page, '05-tra-phong-xong');
  await page.context().close();

  // ── 4. 422: the next guest cancels while the desk is on step 3 ──
  const p2 = await desk(browser, 'qa.fd', now);
  await toBill(p2, st2.res.id);
  const rv2 = p2.getByRole('region', { name: new RegExp(`^${esc(stem('co.late_fee_pr_title'))}`) });
  await expect(rv2).toBeVisible({ timeout: 15_000 });
  await rv2
    .getByLabel(new RegExp(`^${esc(t('co.late_fee_reason'))}`))
    .fill('Can co khach den dem nay');
  const cur = await getReservation(request, await sessionOrSkip(request, 'qa.fd'), next2.res.id);
  const cx = await action(
    request,
    await sessionOrSkip(request, 'qa.fd'),
    next2.res.id,
    'cancel',
    { reasonCode: 'other', note: 'Khach bao huy' },
    { version: cur.body.version },
  );
  console.log(
    `[ui] hủy đơn khách đến sau → ${cx.status} ${cx.status >= 300 ? JSON.stringify(cx.body).slice(0, 200) : ''}`,
  );
  await p2.waitForTimeout(2500);
  await shot(p2, '06a-sau-khi-khach-den-huy');
  await payQr(p2, '792.000').catch((e) =>
    console.log(`[ui] VietQR sau khi hủy: ${String(e).slice(0, 120)}`),
  );
  await p2
    .getByRole('button', { name: /hoàn tất/i })
    .last()
    .click();
  if (
    await p2
      .getByRole('alertdialog')
      .isVisible()
      .catch(() => false)
  ) {
    const r422 = p2.waitForResponse(
      (r) => r.request().method() === 'POST' && /\/actions\/check-out$/.test(r.url()),
    );
    await p2
      .getByRole('alertdialog')
      .getByRole('button', { name: /hoàn tất|Trả phòng/i })
      .last()
      .click();
    const x = await r422;
    console.log(
      `[ui] check-out sau khi đêm bán lại được → ${x.status()} ${(await x.text()).slice(0, 200)}`,
    );
  }
  await p2.waitForTimeout(2000);
  await shot(p2, '06-sau-422-dem-ban-lai-duoc');
  console.log(
    `[ui] đơn 2 sau đó: ${(await getReservation(request, await sessionOrSkip(request, 'qa.fd'), st2.res.id)).body.status}`,
  );
  await p2.context().close();
});
