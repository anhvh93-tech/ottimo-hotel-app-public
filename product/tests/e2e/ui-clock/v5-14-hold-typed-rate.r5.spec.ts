// E2E UI v1.0.5 – V5-14 T14-6 (contract 0.3.13 1.3, 1.17; BUG-R4-041): Desk H09 Đặt phòng mới, lễ tân gõ giá đêm đầu
// → "Giữ chỗ đến …". Giá gõ đi vào báo giá (`calculateQuote` cho bản xem, `saveQuote` cho giữ chỗ) với cờ `edited`
// từng đêm; `createHoldFromQuote` không mang giá.
// Oracle QA (QA-on-be-pr-103-s1 2.2, TC-V105-S1-06) – "cọc trên hộp = số máy chủ" không đủ: Desk quên `edited: true`
// thì máy chủ bỏ giá gõ, hộp vẫn khớp máy chủ. Nên ca kiểm:
//   (a) `saveQuote`: `edited: true` ở ô đã gõ, `edited: false` kèm giá lịch máy chủ ở ô không gõ, không đêm nào 0;
//   (b) cọc trên hộp = cọc tính từ GIÁ GÕ (BR-305: % cọc × tổng tiền phòng, làm tròn 100.000 nửa lên)
//       = `depositRequiredVnd` của đơn; giá gõ chọn sao cho cọc theo giá gõ khác cọc theo lịch;
//   (c) mọi đêm của đơn = giá gõ / giá lịch.
// Cần máy chủ có V5-14 (BE PR #103 `r5-s1`): khi bản xem không phản ánh giá gõ, ca bỏ qua và nói rõ lý do.
// Project desk-clock (giờ ảo: giữ chỗ chỉ từ ngày mai, ngày riêng của ca). Dữ liệu giả.
import { expect, test, type APIRequestContext, type Locator } from '@playwright/test';
import { call, needSeedPassword, propertyIdOf, sessionOrSkip, stackToday } from '../support/api.js';
import { needClock, resetClock, setClock } from '../support/clock.js';
import { SEED_PASSWORD } from '../support/env.js';
import { addDays, cleanupTracked, track, vnTime } from '../support/s2.js';
import { cleanRooms, useVirtualDevice, virtualDay } from '../support/s3.js';
import { desk } from '../ui/flows.js';
import { UI, fakePhone, fillBooking, lettersOnly, openRack, t } from '../ui/helpers.js';
import { recordWrites, waitWrite } from '../ui/write-steps.js';

const ddmm = (iso: string): string => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
const digits = (s: string | null): number => Number((s ?? '').replace(/\D/g, ''));
const stem = (key: string): string => t(key).split('{')[0]!.trim();
/** BR-305: cọc ngắn ngày = pct × tiền phòng, làm tròn `rounding.deposit` (seed 100.000, QA-on-be-pr-103 mục 3) nửa lên. */
const DEPOSIT_UNIT = 100_000;
const depositOf = (roomTotal: number, pct: number): number =>
  Math.round((roomTotal * pct) / (100 * DEPOSIT_UNIT)) * DEPOSIT_UNIT;

type Preview = {
  roomTotalVnd?: number;
  depositVnd?: number;
  losDiscountPct?: number;
  nightlyRates?: Array<{ date: string; amountVnd: number; calendarRateVnd?: number }>;
};

let realToday = '';
test.beforeAll(async ({ request }) => {
  needSeedPassword();
  await resetClock(request);
  realToday = await stackToday(request);
});
test.afterEach(async ({ request }) => cleanupTracked(request));
test.afterAll(async ({ request }) => resetClock(request));

async function at(request: APIRequestContext, date: string, hhmm: string): Promise<void> {
  await useVirtualDevice(request, await setClock(request, vnTime(date, hhmm)));
}

/** "Cọc cần thu" of the price table on the dialog. */
async function depositOnDialog(dlg: Locator): Promise<number> {
  const row = dlg
    .getByRole('table', { name: t('booking.summary.total') })
    .getByRole('row')
    .filter({ hasText: stem('bk.deposit_line') });
  return digits(await row.getByRole('cell').last().textContent());
}

test.describe(
  'v1.0.5 V5-14 – giữ chỗ theo đúng giá đã gõ (T14-6)',
  { tag: ['@ui', '@r5', '@clock', '@money'] },
  () => {
    test.skip(!UI, 'Chạy với E2E_UI=1');
    test.skip(!SEED_PASSWORD, 'Thiếu QA_SEED_PASSWORD');

    test('T14-6 (E) BUG-R4-041: H09 trực tiếp 2 đêm từ ngày mai, gõ giá đêm đầu → bản xem và báo giá mang `nightlyRates` (edited: true đêm gõ, false + giá lịch máy chủ đêm kia, không 0); Giữ chỗ → createHoldFromQuote không có giá; cọc trên hộp = cọc tính từ giá gõ = cọc của đơn; đêm của đơn = giá gõ', async ({
      browser,
      request,
    }) => {
      test.slow();
      needClock('T14-6');
      const D = virtualDay(realToday, 4);
      await at(request, D, '10:00');
      cleanRooms();
      const page = await desk(browser, 'qa.fd', vnTime(D, '10:00'));
      try {
        const previews = recordWrites(page, 'POST', /\/quotes\/calculate$/);
        const quotes = recordWrites(page, 'POST', /\/quotes$/);
        const holds = recordWrites(page, 'POST', /\/quotes\/[^/]+\/actions\/create-hold$/);
        const creates = recordWrites(page, 'POST', /\/reservations$/);
        expect(await openRack(page), 'màn Sơ đồ phòng').toBe(true);
        const arrival = addDays(D, 1);
        await fillBooking(page, {
          roomNo: '202',
          arrival,
          departure: addDays(D, 3),
          guest: `Khach Giucho ${lettersOnly()}`,
          phone: fakePhone(),
        });
        const dlg = page.getByRole('dialog', { name: t('booking.new.title') });
        const first = dlg.getByRole('textbox', { name: `${t('rate.pre_tier')} ${ddmm(arrival)}` });
        const second = dlg.getByRole('textbox', {
          name: `${t('rate.pre_tier')} ${ddmm(addDays(arrival, 1))}`,
        });
        await expect(first).not.toHaveValue('', { timeout: 15_000 });
        await expect(second).not.toHaveValue('');
        // giá lịch của máy chủ: bản xem theo lịch (không `nightlyRates`) của đúng lượt này
        const calendarPreview = (): Preview | undefined => {
          const s = previews.findLast(
            (x) =>
              x.status === 200 &&
              x.request?.arrivalDate === arrival &&
              x.request?.nights === 2 &&
              !('nightlyRates' in (x.request ?? {})),
          );
          return s ? (JSON.parse(s.body) as Preview) : undefined;
        };
        await expect
          .poll(() => calendarPreview()?.nightlyRates?.length, { message: 'bản xem theo lịch' })
          .toBe(2);
        const cal = calendarPreview()!.nightlyRates!.map((n) => n.calendarRateVnd ?? n.amountVnd);
        expect(cal.every((n) => n > 0)).toBe(true);
        expect(digits(await first.inputValue()), 'ô đêm đầu = giá lịch máy chủ').toBe(cal[0]);
        expect(digits(await second.inputValue()), 'ô đêm hai = giá lịch máy chủ').toBe(cal[1]);
        const calendarSecond = cal[1]!;

        const fd = await sessionOrSkip(request, 'qa.fd');
        const rules = await call<{ shortStayDepositPct: number }>(
          request,
          'GET',
          `/v1/properties/${propertyIdOf(fd)}/booking-rules`,
          { session: fd },
        );
        expect(rules.status).toBe(200);
        const pct = rules.body.shortStayDepositPct;
        expect(pct).toBeGreaterThan(0);
        // giá gõ = giá lịch + bước 50.000 nhỏ nhất làm cọc đổi (để oracle (b) phân biệt giá gõ với giá lịch)
        const calendarDeposit = depositOf(cal[0]! + calendarSecond, pct);
        let delta = 50_000;
        while (depositOf(cal[0]! + delta + calendarSecond, pct) === calendarDeposit)
          delta += 50_000;
        const typed = cal[0]! + delta;
        const expectedDeposit = depositOf(typed + calendarSecond, pct);
        expect(expectedDeposit).not.toBe(calendarDeposit);
        await first.fill(String(typed));
        const nights = [
          { date: arrival, amountVnd: typed, edited: true },
          { date: addDays(arrival, 1), amountVnd: calendarSecond, edited: false },
        ];

        // bản xem có giá gõ (calculateQuote + nightlyRates) – bất kể mã trả về, để biết máy chủ đã có V5-14 chưa
        await expect
          .poll(() => previews.some((s) => Array.isArray(s.request?.nightlyRates)), {
            message: 'calculateQuote có nightlyRates',
            timeout: 15_000,
          })
          .toBe(true);
        const pv = previews.find((s) => Array.isArray(s.request?.nightlyRates))!;
        expect(pv.request?.nightlyRates).toEqual(nights);
        const pvBody = (pv.status === 200 ? JSON.parse(pv.body) : {}) as Preview;
        test.skip(
          pvBody.nightlyRates?.[0]?.calendarRateVnd !== typed,
          `máy chủ chưa có V5-14 (BE PR #103 r5-s1): bản xem trả ${pv.status} và bỏ qua giá gõ – chạy lại sau khi #103 gộp`,
        );
        expect(pvBody.roomTotalVnd, 'tiền phòng của bản xem = tổng giá gõ').toBe(
          typed + calendarSecond,
        );
        // (b) cọc trên hộp = cọc tính từ giá gõ (không chỉ "= số máy chủ")
        await expect
          .poll(() => depositOnDialog(dlg), { message: 'cọc trên hộp = cọc tính từ giá gõ' })
          .toBe(expectedDeposit);
        expect(pvBody.depositVnd).toBe(expectedDeposit);

        // ── Giữ chỗ ──
        const hold = dlg.getByRole('button', {
          name: new RegExp(`^${stem('booking.create_hold')}`),
        });
        await expect(hold).toBeEnabled();
        await expect(hold).not.toHaveAttribute('aria-disabled', 'true');
        await hold.click();
        const q = await waitWrite(quotes, 'saveQuote', 201);
        // (a) edited: true ở đêm gõ, false + giá lịch máy chủ ở đêm kia, không đêm nào 0
        expect(q.request?.nightlyRates).toEqual(nights);
        const h = await waitWrite(holds, 'createHoldFromQuote', 201);
        for (const k of ['nightlyRates', 'rates', 'rateVnd', 'amountVnd', 'totalVnd', 'depositVnd'])
          expect(h.request ?? {}, `createHoldFromQuote không mang ${k}`).not.toHaveProperty(k);
        const res = JSON.parse(h.body) as {
          id: string;
          status: string;
          depositRequiredVnd: number;
        };
        track('reservation', res.id);
        expect(res.status).toBe('hold');
        expect(res.depositRequiredVnd, 'cọc của đơn = cọc tính từ giá gõ = cọc trên hộp').toBe(
          expectedDeposit,
        );
        expect(creates, 'không đi đường Tạo đơn').toHaveLength(0);

        // (c) đêm của đơn = giá gõ / giá lịch
        const r = await call<{ nightlyRates?: Array<{ date: string; amountVnd: number }> }>(
          request,
          'GET',
          `/v1/properties/${propertyIdOf(fd)}/reservations/${res.id}`,
          { session: fd },
        );
        expect(r.status).toBe(200);
        expect(
          r.body.nightlyRates?.map((n) => [n.date, n.amountVnd]),
          'đêm của đơn = giá gõ, giá lịch',
        ).toEqual(nights.map((n) => [n.date, n.amountVnd]));
      } finally {
        await page.context().close();
      }
    });
  },
);
