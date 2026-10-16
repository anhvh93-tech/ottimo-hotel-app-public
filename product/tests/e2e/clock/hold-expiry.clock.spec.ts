// Project "clock" (serial, sau mọi project API) – giữ chỗ/báo giá theo mốc giờ với MutableClock + chạy job ngay.
// TC: TC-L5-022 (biên BR-302), TC-L5-026 (J1 hold.expire), TC-L5-028 (J2 hold.remind), TC-L5-029 (gia hạn, BR-303-02/03),
// TC-L5-030 (a) + TC-X-004 (cọc trước hạn đua với J1), TC-L5-015 (J3 quote.expire), TC-L5-017 (a) (báo giá hết hạn).
// Oracle: BR-302-01, BR-303-01/02/03. Kịch bản đặt ở ngày tương lai ngẫu nhiên > hôm nay + 365 (support/clock.ts).
import { expect, test } from '@playwright/test';
import {
  call,
  expectProblem,
  needSeedPassword,
  propertyIdOf,
  requireEndpoints,
  sessionOrSkip,
  stackToday,
} from '../support/api.js';
import {
  expectNear,
  needClock,
  resetClock,
  runJob,
  runJobIfAny,
  scenarioDate,
  setClock,
} from '../support/clock.js';
import {
  EP,
  action,
  addDays,
  cleanupTracked,
  createHold,
  getReservation,
  isRoomFree,
  makeHold,
  ms,
  newGuest,
  oracle,
  quoteInput,
  room,
  s2Context,
  saveQuote,
  statusOf,
  vnTime,
} from '../support/s2.js';

test.describe.configure({ mode: 'serial' });

let realToday = '';

test.beforeAll(async ({ request }) => {
  realToday = await stackToday(request);
});
test.afterEach(async ({ request }) => cleanupTracked(request));
test.afterAll(async ({ request }) => resetClock(request));

test.describe(
  'Giữ chỗ theo giờ (US-084, US-085) – MutableClock',
  { tag: ['@clock', '@sprint2'] },
  () => {
    test.beforeEach(() => needSeedPassword());

    test('TC-L5-022 hạn giữ chỗ = min(tạo + giờ giữ, 12:00 ngày đến) (BR-302-01, biên 12/24/48 giờ)', async ({
      request,
    }) => {
      needClock('TC-L5-022');
      await requireEndpoints(request, 'TC-L5-022', [EP.saveQuote, EP.createHoldFromQuote]);
      const D = scenarioDate(realToday);
      const c = await s2Context(request);
      // TC-L5-022: tạo 10:00
      await setClock(request, vnTime(D, '10:00'));
      const sal = await sessionOrSkip(request, 'qa.sal');
      const cases: Array<[arrivalOffset: number, hours: number, expected: string]> = [
        [5, 12, vnTime(D, '22:00')],
        [5, 24, vnTime(addDays(D, 1), '10:00')],
        [5, 48, vnTime(addDays(D, 2), '10:00')],
        [1, 48, vnTime(addDays(D, 1), '12:00')],
        [2, 48, vnTime(addDays(D, 2), '10:00')],
      ];
      for (const [off, hours, expected] of cases) {
        const { hold } = await makeHold(request, sal, c, {
          rooms: c.rooms,
          arrival: addDays(D, off),
          nights: 1,
          holdHours: hours,
        });
        expectNear(hold.hold?.expiresAt, expected, `đến D+${off}, ${hours} giờ`);
      }
      // oracle BR-302-01: tạo 20:00, 24 giờ, đến hôm sau → 12:00 ngày đến
      const o = oracle('BR-302-01');
      const createdHHMM = String(o.input.createdAt).slice(11, 16);
      await setClock(request, vnTime(D, createdHHMM));
      const ctv = await sessionOrSkip(request, 'qa.ctv1');
      const h1 = await makeHold(request, ctv, c, {
        rooms: c.rooms,
        arrival: addDays(D, 1),
        nights: 1,
        holdHours: Number(o.input.holdHours),
      });
      expectNear(
        h1.hold.hold?.expiresAt,
        vnTime(addDays(D, 1), String(o.expected.expiresAt).slice(11, 16)),
        'BR-302-01',
      );
    });

    test('TC-L5-026 J1 hold.expire: 1 giây trước hạn vẫn hold; tới hạn → cancelled hold_expired, mở phòng (BR-303-01)', async ({
      request,
    }) => {
      needClock('TC-L5-026');
      await requireEndpoints(request, 'TC-L5-026', [
        EP.saveQuote,
        EP.createHoldFromQuote,
        EP.getReservation,
        EP.searchAvailability,
      ]);
      const D = scenarioDate(realToday);
      const c = await s2Context(request);
      await setClock(request, vnTime(D, '10:00'));
      const sal = await sessionOrSkip(request, 'qa.sal');
      const { hold, room: rm } = await makeHold(request, sal, c, {
        rooms: c.rooms,
        arrival: addDays(D, 3),
        nights: 1,
        holdHours: 24,
      });
      const exp = hold.hold?.expiresAt ?? '';
      expectNear(exp, vnTime(addDays(D, 1), '10:00'), 'hạn 24 giờ');
      await setClock(request, new Date(ms(exp) - 1000).toISOString());
      await runJob(request, 'hold.expire');
      const fd = await sessionOrSkip(request, 'qa.fd');
      expect((await getReservation(request, fd, hold.id)).body.status).toBe('hold');
      await setClock(request, new Date(ms(exp) + 1000).toISOString());
      await runJob(request, 'hold.expire');
      const fd2 = await sessionOrSkip(request, 'qa.fd');
      const after = await getReservation(request, fd2, hold.id);
      expect(after.body.status).toBe('cancelled');
      expect(after.body.cancellation?.reasonCode).toBe(
        oracle('BR-303-01').expected.cancelReasonCode,
      );
      expect(await isRoomFree(request, fd2, rm, hold.arrivalDate, hold.departureDate)).toBe(true);
      // chạy lại cùng mốc không đổi gì (đúng một lần)
      const again = await runJob(request, 'hold.expire');
      expect(['done', 'skipped_already_ran']).toContain(again.status);
    });

    test('TC-L5-028 J2 hold.remind: trước mốc nhắc chưa có; đúng mốc → "Cần chú ý" hold_expiring (BR-303-01)', async ({
      request,
    }) => {
      needClock('TC-L5-028');
      await requireEndpoints(request, 'TC-L5-028', [
        EP.saveQuote,
        EP.createHoldFromQuote,
        EP.listAttentionItems,
      ]);
      const D = scenarioDate(realToday);
      const c = await s2Context(request);
      const o = oracle('BR-303-01');
      const leadMs = ms(String(o.input.expiresAt)) - ms(String(o.expected.reminderAt)); // 2 giờ
      await setClock(request, vnTime(D, '10:00'));
      const sal = await sessionOrSkip(request, 'qa.sal');
      const { hold } = await makeHold(request, sal, c, {
        rooms: c.rooms,
        arrival: addDays(D, 3),
        nights: 1,
        holdHours: 24,
      });
      const exp = ms(hold.hold?.expiresAt ?? '');
      const has = async () => {
        const fd = await sessionOrSkip(request, 'qa.fd');
        const r = await call<{ data: Array<{ kind: string; reservationIds?: string[] }> }>(
          request,
          'GET',
          `/v1/properties/${propertyIdOf(fd)}/attention`,
          { session: fd },
        );
        expect(r.status).toBe(200);
        return r.body.data.some(
          (x) => x.kind === 'hold_expiring' && (x.reservationIds ?? []).includes(hold.id),
        );
      };
      await setClock(request, new Date(exp - leadMs - 60_000).toISOString());
      await runJob(request, 'hold.remind');
      expect(await has()).toBe(false);
      await setClock(request, new Date(exp - leadMs).toISOString());
      await runJob(request, 'hold.remind');
      expect(await has()).toBe(true);
    });

    test('TC-L5-029 gia hạn: +24 giờ (BR-303-02); không vượt 12:00 ngày đến (BR-303-03); sau hạn → 409 HOLD_EXPIRED', async ({
      request,
    }) => {
      needClock('TC-L5-029');
      await requireEndpoints(request, 'TC-L5-029', [
        EP.saveQuote,
        EP.createHoldFromQuote,
        EP.extendHold,
      ]);
      const D = scenarioDate(realToday);
      const c = await s2Context(request);
      for (const ex of ['BR-303-02', 'BR-303-03']) {
        const o = oracle(ex);
        const created = String(o.input.createdAt);
        const arrivalOffset =
          (ms(`${String(o.input.arrivalDate)}T00:00:00Z`) -
            ms(`${created.slice(0, 10)}T00:00:00Z`)) /
          864e5;
        await setClock(request, vnTime(D, created.slice(11, 16)));
        const sal = await sessionOrSkip(request, 'qa.sal');
        const { hold } = await makeHold(request, sal, c, {
          rooms: c.rooms,
          arrival: addDays(D, arrivalOffset),
          nights: 1,
          holdHours: 24,
        });
        const e = await action(
          request,
          sal,
          hold.id,
          'extend-hold',
          { extraHours: Number(o.input.extendHours) },
          {
            version: hold.version,
          },
        );
        expect(e.status, `${ex}: ${statusOf(e)}`).toBe(200);
        const got = await getReservation(request, sal, hold.id);
        const newExp = String(o.expected.newExpiresAt);
        const dayShift =
          (ms(`${newExp.slice(0, 10)}T00:00:00Z`) - ms(`${created.slice(0, 10)}T00:00:00Z`)) /
          864e5;
        expectNear(
          got.body.hold?.expiresAt,
          vnTime(addDays(D, dayShift), newExp.slice(11, 16)),
          ex,
        );
      }
      // dữ liệu mới: gia hạn khi đã quá hạn (J1 chưa chạy) → 409 HOLD_EXPIRED
      await setClock(request, vnTime(D, '09:00'));
      const sal = await sessionOrSkip(request, 'qa.sal');
      const { hold } = await makeHold(request, sal, c, {
        rooms: c.rooms,
        arrival: addDays(D, 4),
        nights: 1,
        holdHours: 12,
      });
      await setClock(request, new Date(ms(hold.hold?.expiresAt ?? '') + 5_000).toISOString());
      const sal2 = await sessionOrSkip(request, 'qa.sal');
      const late = await action(request, sal2, hold.id, 'extend-hold', { extraHours: 12 });
      // worker có thể đã hủy trong lúc chờ (quét mỗi phút) → INVALID_TRANSITION cũng chứng minh không gia hạn được
      expect(late.status, statusOf(late)).toBe(409);
      expect(['HOLD_EXPIRED', 'INVALID_TRANSITION']).toContain(late.body.code);
    });

    test('TC-L5-030 (a) + TC-X-004 cọc ghi trước hạn, J1 chạy đúng lúc / sau hạn → vẫn confirmed, không bao giờ cancelled', async ({
      request,
    }) => {
      needClock('TC-X-004');
      await requireEndpoints(request, 'TC-X-004', [
        EP.saveQuote,
        EP.createHoldFromQuote,
        EP.confirmDeposit,
      ]);
      const D = scenarioDate(realToday);
      const c = await s2Context(request);
      await setClock(request, vnTime(D, '10:00'));
      const sal = await sessionOrSkip(request, 'qa.sal');
      const { hold } = await makeHold(request, sal, c, {
        rooms: c.rooms,
        arrival: addDays(D, 3),
        nights: 1,
        holdHours: 24,
      });
      const exp = ms(hold.hold?.expiresAt ?? '');
      await setClock(request, new Date(exp - 1000).toISOString());
      const sal2 = await sessionOrSkip(request, 'qa.sal');
      const [confirm] = await Promise.all([
        action(
          request,
          sal2,
          hold.id,
          'confirm-deposit',
          {
            payment: {
              type: 'deposit',
              method: 'bank_transfer',
              amountVnd: hold.depositRequiredVnd ?? 0,
            },
          },
          { version: hold.version },
        ),
        runJob(request, 'hold.expire'),
      ]);
      expect(confirm.status, statusOf(confirm)).toBe(200);
      await setClock(request, new Date(exp + 3 * 60_000).toISOString());
      await runJob(request, 'hold.expire');
      const fd2 = await sessionOrSkip(request, 'qa.fd');
      expect((await getReservation(request, fd2, hold.id)).body.status).toBe('confirmed');
    });

    for (const ex of ['BR-304-01', 'BR-304-02']) {
      test(`TC-L5-015 + TC-L5-017 (a) hạn báo giá theo ngày lịch lập (${ex}); 23:59:59 ngày cuối còn active, 00:00 hôm sau expired; tạo giữ chỗ → 409 QUOTE_EXPIRED`, async ({
        request,
      }) => {
        needClock('TC-L5-015');
        await requireEndpoints(request, 'TC-L5-015', [
          EP.saveQuote,
          EP.getQuote,
          EP.createHoldFromQuote,
        ]);
        const o = oracle(ex);
        const created = String(o.input.quoteCreatedAt); // 10:00 (BR-304-01) hoặc 01:30 – ngày nghiệp vụ hôm trước (BR-304-02)
        const lastOffset =
          (ms(`${String(o.expected.lastValidDate)}T00:00:00Z`) -
            ms(`${created.slice(0, 10)}T00:00:00Z`)) /
          864e5;
        const D = scenarioDate(realToday);
        const c = await s2Context(request);
        await setClock(request, vnTime(D, created.slice(11, 16)));
        const sal = await sessionOrSkip(request, 'qa.sal');
        const q = await saveQuote(request, sal, {
          ...quoteInput(c, { room: room(c, '101'), arrival: addDays(D, 10), nights: 1 }),
          guestId: await newGuest(request, sal),
        });
        expect(q.status, JSON.stringify(q.body)).toBe(201);
        // BR-304 v0.3.2: hết hiệu lực từ 00:00 ngày (ngày lịch lập + quote_validity_days + 1) – mốc nửa mở
        const lastDay = addDays(D, lastOffset);
        expectNear(q.body.expiresAt, vnTime(addDays(lastDay, 1), '00:00'), `${ex} expiresAt`, 0);
        const status = async () => {
          const s = await sessionOrSkip(request, 'qa.sal');
          const g = await call<{ status: string }>(
            request,
            'GET',
            `/v1/properties/${propertyIdOf(s)}/quotes/${q.body.id}`,
            { session: s },
          );
          return g.body.status;
        };
        // J3 quote.expire (architecture 9.1) – nếu build chưa đăng ký job, trạng thái phải tự đúng khi đọc
        await setClock(request, vnTime(lastDay, '23:59:59'));
        await runJobIfAny(request, 'quote.expire');
        expect(await status()).toBe('active');
        await setClock(request, vnTime(addDays(lastDay, 1), '00:00'));
        expect(await status()).toBe('expired');
        await setClock(request, vnTime(addDays(lastDay, 1), '00:05'));
        await runJobIfAny(request, 'quote.expire');
        expect(await status()).toBe('expired');
        const sal3 = await sessionOrSkip(request, 'qa.sal');
        const h = await createHold(request, sal3, q.body.id, 24);
        expectProblem(h, 409, 'QUOTE_EXPIRED');
      });
    }
  },
);
