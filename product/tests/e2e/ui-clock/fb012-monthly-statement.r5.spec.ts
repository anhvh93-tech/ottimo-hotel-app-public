// E2E UI v1.0.5 – FB-INV-012 phiếu thanh toán tháng của khách dài hạn (hợp đồng ARC rounds/round-05/fb-inv-012/contract.md
// §6, §8 tiêu chí FE 2–4; INV 17/11: chỉ số đầu kỳ lễ tân nhập mỗi kỳ, chỉ số cuối gần nhất chỉ để so, hao hụt khoảng
// trống không tính và không in). Dữ liệu dựng bằng API trên ngày ảo riêng: một đơn dài hạn nhập tay nhận phòng ngày A
// (giữa tháng M). Desk: S12 nhập chỉ số nhận phòng ngày A → ngày cuối tháng M chốt cuối kỳ M + đầu kỳ M+1 → ngày 01 của
// M+1: S16 tạo nháp → xác nhận cảnh báo → Phát hành → in A5 và A4 (mỗi khổ một trang, ảnh đính kèm) → VietQR → Đã thu.
// Payload QR đọc lại bằng API: số tiền = còn nợ, nội dung = mã phiếu. Project desk-clock (MutableClock, tuần tự).
// Dữ liệu giả: khách mẫu của harness, tài khoản nhận THỬ (TEST_RECEIVING_ACCOUNT), ảnh đồng hồ PNG 16×16 của harness.
import { expect, test, type APIRequestContext, type Locator, type Page } from '@playwright/test';
import { call, needSeedPassword, sessionOrSkip, stackToday } from '../support/api.js';
import { needClock, resetClock, setClock } from '../support/clock.js';
import { SEED_PASSWORD, WEB_URL } from '../support/env.js';
import { addDays, cleanupTracked, room, s2Context, vnTime } from '../support/s2.js';
import { PNG_16X16, cleanRooms, inHouse, useVirtualDevice, virtualDay } from '../support/s3.js';
import { ensureReceivingAccount } from '../support/s3-stay.js';
import { desk } from '../ui/flows.js';
import { UI, t } from '../ui/helpers.js';
import { photo } from '../ui/write-steps.js';

const esc = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const tf = (key: string, vars: Record<string, string | number>): string =>
  t(key).replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));
const monthOf = (day: string) => day.slice(0, 7);
function lastDayOf(month: string): string {
  const [y, m] = month.split('-').map(Number) as [number, number];
  return `${month}-${String(new Date(Date.UTC(y, m, 0)).getUTCDate()).padStart(2, '0')}`;
}
const nextMonth = (month: string) => monthOf(addDays(lastDayOf(month), 1));

/** EMVCo top-level tags (+ `62.xx`) of a VietQR payload. */
function emv(payload: string): Record<string, string> {
  const out: Record<string, string> = {};
  const walk = (s: string, prefix: string) => {
    for (let i = 0; i + 4 <= s.length;) {
      const len = Number(s.slice(i + 2, i + 4));
      out[prefix + s.slice(i, i + 2)] = s.slice(i + 4, i + 4 + len);
      i += 4 + len;
    }
  };
  walk(payload, '');
  if (out['62']) walk(out['62'], '62.');
  return out;
}

/** The 16×16 PNG of the harness (the api decodes and re-encodes images). */
const METER_PHOTO = photo(PNG_16X16, 'dong-ho.png');

let realToday = '';
test.beforeAll(async ({ request }) => {
  needSeedPassword();
  await resetClock(request);
  realToday = await stackToday(request);
});
test.afterEach(async ({ request }) => cleanupTracked(request));
test.afterAll(async ({ request }) => resetClock(request));

async function at(request: APIRequestContext, date: string, hhmm: string): Promise<string> {
  const iso = await setClock(request, vnTime(date, hhmm));
  await useVirtualDevice(request, iso);
  return vnTime(date, hhmm);
}

/** S12 row of the room (row header "203 · N. Minh"). */
async function meterRow(page: Page, roomNo: string): Promise<Locator> {
  const head = page.getByRole('rowheader', { name: new RegExp(`^${esc(roomNo)} ·`) });
  await expect(head).toBeVisible({ timeout: 20_000 });
  return page.locator('tr', { has: head });
}

test.describe(
  'v1.0.5 FB-INV-012 – phiếu tháng dài hạn: chỉ số → nháp → phát hành → in → VietQR → đã thu',
  { tag: ['@ui', '@r5', '@clock', '@write', '@money'] },
  () => {
    test.skip(!UI, 'Chạy với E2E_UI=1');
    test.skip(!SEED_PASSWORD, 'Thiếu QA_SEED_PASSWORD');

    test('FB-012 (E) FE-2/3/4: S12 chỉ số nhận phòng + cuối kỳ/đầu kỳ → S16 nháp → cảnh báo → phát hành → in A5/A4 một trang → VietQR → Đã thu', async ({
      browser,
      request,
    }, info) => {
      test.slow();
      needClock('FB-012');
      // A: a weekday mid-month, far from the month end, on a virtual range of its own.
      let A = virtualDay(realToday, 80);
      while (Number(A.slice(8, 10)) > 20) A = addDays(A, 7);
      const M = monthOf(A);
      const E = lastDayOf(M);
      const N = nextMonth(M);
      await ensureReceivingAccount(request, A);
      await at(request, A, '14:00');
      cleanRooms();
      const c = await s2Context(request);
      const fd = await sessionOrSkip(request, 'qa.fd');
      const stay = await inHouse(request, c, fd, {
        room: room(c, '402'),
        alternatives: [room(c, '401'), room(c, '302'), room(c, '301')],
        arrival: A,
        nights: 75,
        extra: {
          manualLongStay: {
            monthlyRentVnd: 9000000,
            externalContractRef: 'HD-E2E-FB012',
            depositHeldVnd: 9000000,
          },
        },
      });
      const roomNo = stay.room.roomNo;

      // ---- Day A: the check-in reading (kind=checkin), date prefilled with the arrival.
      let page = await desk(browser, 'qa.fdl', await at(request, A, '15:00'));
      try {
        await page.goto(`${WEB_URL}/long-stay/meters`);
        await page.getByLabel(t('meters.month'), { exact: true }).fill(M);
        const row = await meterRow(page, roomNo);
        // One line per meter (electricity, water).
        await expect(row.getByText(t('meters.opening_missing'))).toHaveCount(2);
        await row.getByRole('button', { name: t('meters.checkin_enter') }).click();
        const dlg = page.getByRole('dialog', {
          name: tf('meters.checkin_title', { room: roomNo }),
        });
        await expect(dlg.locator('input[type=date]')).toHaveValue(A);
        await dlg.getByLabel(new RegExp(`^${esc(t('stmt.meter.electricity'))}`)).fill('1000');
        await dlg.getByLabel(new RegExp(`^${esc(t('stmt.meter.water'))}`)).fill('10');
        await dlg.locator('input[type=file]').setInputFiles(METER_PHOTO);
        await dlg.getByRole('button', { name: t('meters.save') }).click();
        // A stack reused by an earlier run may hold a higher closing on this room: the two-step warning
        // (422 OPENING_BELOW_PREVIOUS_CLOSING) → "Save anyway" (BE-190-01). A fresh CI stack saves at once.
        const below = page.getByRole('alertdialog');
        await expect(dlg.or(below).last()).toBeVisible();
        await expect
          .poll(async () => (await below.isVisible()) || !(await dlg.isVisible()), {
            timeout: 15_000,
          })
          .toBe(true);
        if (await below.isVisible())
          await below.getByRole('button', { name: t('meters.save_anyway') }).click();
        await expect(dlg).toBeHidden({ timeout: 15_000 });
        await expect(
          (await meterRow(page, roomNo)).getByText(tf('meters.opening_of', { value: '1.000' })),
        ).toBeVisible({ timeout: 15_000 });
      } finally {
        await page.context().close();
      }

      // ---- Last day of M: closing M + opening M+1 (typed, never prefilled), two photos.
      page = await desk(browser, 'qa.fdl', await at(request, E, '10:00'));
      try {
        await page.goto(`${WEB_URL}/long-stay/meters`);
        const row = await meterRow(page, roomNo);
        for (const [meter, closing, opening] of [
          ['electricity', '1142', '1142'],
          ['water', '13.4', '13.4'],
        ] as const) {
          const name = t(`stmt.meter.${meter}`);
          const open = row.getByLabel(`${name} – ${t('meters.opening')} – ${roomNo}`);
          await expect(open).toHaveValue('');
          await row.getByLabel(`${name} – ${t('meters.closing')} – ${roomNo}`).fill(closing);
          await open.fill(opening);
        }
        await row.locator('input[type=file]').setInputFiles(METER_PHOTO);
        await row.getByRole('button', { name: t('meters.save') }).click();
        await expect(
          (await meterRow(page, roomNo)).getByText(tf('meters.usage', { usage: '142' })),
        ).toBeVisible({ timeout: 15_000 });
      } finally {
        await page.context().close();
      }

      // ---- Day 01 of M+1: S16 draft → confirm warnings → Issue → print → payment.
      const D1 = addDays(E, 1);
      page = await desk(browser, 'qa.fdl', await at(request, D1, '10:00'));
      try {
        await page.goto(`${WEB_URL}/long-stay/statements`);
        await expect(page.getByLabel(t('stmt.month'), { exact: true })).toHaveValue(N);
        const ready = page.locator('section', {
          has: page.getByRole('heading', {
            name: new RegExp(esc(tf('stmt.ready_title', { month: '' }).trim())),
          }),
        });
        const item = ready.locator('li', { hasText: roomNo }).first();
        await item.getByRole('button', { name: t('stmt.create_draft') }).click();
        const dlg = page.getByRole('dialog');
        const issue = dlg.getByRole('button', { name: t('stmt.issue') });
        await expect(issue).toBeVisible({ timeout: 15_000 });
        for (const box of await dlg.getByRole('checkbox').all()) await box.check();
        await expect(issue).toBeEnabled();
        await issue.click();
        const print = dlg.getByRole('link', { name: t('stmt.print') });
        await expect(print).toBeVisible({ timeout: 15_000 });
        const href = (await print.getAttribute('href'))!;
        // FE-4: the URL holds only the id.
        expect(href).toMatch(/^\/print\/statements\/[0-9a-f-]{36}$/);
        const id = href.split('/').pop()!;

        // The server's print data: QR payload = balance + statement code.
        const fdl = await sessionOrSkip(request, 'qa.fdl');
        const pr = await call<{
          code: string;
          roomNos: string[];
          totals: { balanceVnd: number };
          vietqr: { payload: string; transferContent: string } | null;
        }>(
          request,
          'GET',
          `/v1/properties/${fdl.me.activePropertyId ?? fdl.me.properties[0]!.propertyId}/billing-periods/${id}/print`,
          {
            session: fdl,
          },
        );
        expect(pr.status, JSON.stringify(pr.body).slice(0, 300)).toBe(200);
        expect(pr.body.roomNos).toEqual([roomNo]);
        expect(pr.body.vietqr, 'VietQR (tài khoản nhận thử)').not.toBeNull();
        const tags = emv(pr.body.vietqr!.payload);
        expect(Number(tags['54'])).toBe(pr.body.totals.balanceVnd);
        // Transfer content = the statement code without separators (bank apps drop '-').
        expect(tags['62.08']).toBe(pr.body.vietqr!.transferContent);
        expect(tags['62.08']).toBe(pr.body.code.replace(/[^A-Za-z0-9]/g, ''));

        // Print page – A5 by default, then A4; one page each; no contact data, no vacancy gap, no emoji.
        const sheetPage = await page.context().newPage();
        await sheetPage.goto(`${WEB_URL}${href}`);
        const sheet = sheetPage.locator('.stmt-preview .stmt-sheet');
        await expect(sheet).toBeVisible({ timeout: 20_000 });
        await expect(sheetPage.locator('body > .print-root')).toHaveClass(/stmt-paper-a5/);
        await expect(sheet.getByText(pr.body.code).first()).toBeVisible();
        await info.attach('statement-a5.png', {
          body: await sheetPage.locator('.stmt-preview').screenshot(),
          contentType: 'image/png',
        });
        const pages = (pdf: Buffer) =>
          (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length;
        await sheetPage.emulateMedia({ media: 'print' });
        expect(pages(await sheetPage.pdf({ preferCSSPageSize: true, printBackground: true }))).toBe(
          1,
        );
        await sheetPage.emulateMedia({ media: 'screen' });
        await sheetPage.getByRole('button', { name: 'A4', exact: true }).click();
        await expect(sheetPage.locator('body > .print-root')).toHaveClass(/stmt-paper-a4/);
        await info.attach('statement-a4.png', {
          body: await sheetPage.locator('.stmt-preview').screenshot(),
          contentType: 'image/png',
        });
        await sheetPage.emulateMedia({ media: 'print' });
        expect(pages(await sheetPage.pdf({ preferCSSPageSize: true, printBackground: true }))).toBe(
          1,
        );
        const text = await sheet.innerText();
        expect(text).not.toMatch(/nationality|quốc tịch|passport|CCCD/i);
        expect(text).not.toContain(t('meters.gap_saved').split(':')[0]!);
        expect(text).not.toMatch(/\p{Extended_Pictographic}/u);
        await sheetPage.close();

        // Record the VietQR payment for the balance (default amount) → Paid.
        await dlg.getByRole('button', { name: t('stmt.record_payment') }).click();
        await dlg.getByRole('button', { name: t('stmt.pay_save') }).click();
        await expect(dlg.getByText(t('stmt.status.paid'), { exact: true }).first()).toBeVisible({
          timeout: 15_000,
        });
      } finally {
        await page.context().close();
      }
    });
  },
);
