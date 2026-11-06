// E2E UI v1.0.5 – V5-14 T14-6 (contract 0.3.13 1.3, 1.17; BUG-R4-041): Desk H09 Đặt phòng mới, lễ tân gõ giá đêm đầu
// → "Giữ chỗ đến …". Giá gõ đi vào báo giá (`calculateQuote` cho bản xem, `saveQuote` cho giữ chỗ) với cờ `edited`
// từng đêm; `createHoldFromQuote` không mang giá. Số cọc trên hộp (dòng "Cọc cần thu" của bản xem có giá gõ) = cọc
// máy chủ ghi cho đơn giữ chỗ, và đêm đầu của đơn = giá gõ.
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

    test('T14-6 (E) BUG-R4-041: H09 trực tiếp 2 đêm từ ngày mai, gõ giá đêm đầu → bản xem và báo giá mang `nightlyRates` (edited đêm đầu); Giữ chỗ → createHoldFromQuote không có giá; cọc của đơn giữ chỗ = cọc trên hộp; đêm đầu của đơn = giá gõ', async ({
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
        // giá gõ = giá lịch + 50.000 (trong sàn–trần của nhóm căn)
        const typed = digits(await first.inputValue()) + 50_000;
        const calendarSecond = digits(await second.inputValue());
        await first.fill(String(typed));

        // bản xem có giá gõ (calculateQuote + nightlyRates) – bất kể mã trả về, để biết máy chủ đã có V5-14 chưa
        await expect
          .poll(() => previews.some((s) => Array.isArray(s.request?.nightlyRates)), {
            message: 'calculateQuote có nightlyRates',
            timeout: 15_000,
          })
          .toBe(true);
        const pv = previews.find((s) => Array.isArray(s.request?.nightlyRates))!;
        expect(pv.request?.nightlyRates).toEqual([
          { date: arrival, amountVnd: typed, edited: true },
          { date: addDays(arrival, 1), amountVnd: calendarSecond, edited: false },
        ]);
        const pvBody = (pv.status === 200 ? JSON.parse(pv.body) : {}) as {
          depositVnd?: number;
          nightlyRates?: Array<{ date: string; calendarRateVnd?: number }>;
        };
        test.skip(
          pvBody.nightlyRates?.[0]?.calendarRateVnd !== typed,
          `máy chủ chưa có V5-14 (BE PR #103 r5-s1): bản xem trả ${pv.status} và bỏ qua giá gõ – chạy lại sau khi #103 gộp`,
        );
        await expect
          .poll(() => depositOnDialog(dlg), { message: 'cọc trên hộp theo bản xem có giá gõ' })
          .toBe(pvBody.depositVnd);
        const shown = await depositOnDialog(dlg);

        // ── Giữ chỗ ──
        const hold = dlg.getByRole('button', {
          name: new RegExp(`^${stem('booking.create_hold')}`),
        });
        await expect(hold).toBeEnabled();
        await expect(hold).not.toHaveAttribute('aria-disabled', 'true');
        await hold.click();
        const q = await waitWrite(quotes, 'saveQuote', 201);
        expect(q.request?.nightlyRates).toEqual(pv.request?.nightlyRates);
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
        expect(res.depositRequiredVnd, 'cọc của đơn giữ chỗ = cọc trên hộp').toBe(shown);
        expect(creates, 'không đi đường Tạo đơn').toHaveLength(0);

        const fd = await sessionOrSkip(request, 'qa.fd');
        const r = await call<{ nightlyRates?: Array<{ date: string; amountVnd: number }> }>(
          request,
          'GET',
          `/v1/properties/${propertyIdOf(fd)}/reservations/${res.id}`,
          { session: fd },
        );
        expect(r.status).toBe(200);
        expect(
          r.body.nightlyRates?.find((n) => n.date === arrival)?.amountVnd,
          'đêm đầu = giá gõ',
        ).toBe(typed);
      } finally {
        await page.context().close();
      }
    });
  },
);
