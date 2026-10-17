// E2E API Sprint 4 – S4-06 phần no-show (BR-311 v0.3.8, DOM-S4-14): đơn no-show giữ cọc theo cơ sở
// min(cọc đã thu, cọc yêu cầu, giá trị đơn); phần cọc thu vượt cọc yêu cầu là tiền thừa → hệ thống TỰ tạo MỘT yêu cầu
// hoàn + "Cần chú ý" `closed_reservation_credit`. Oracle BR-311-03 (cùng quy tắc BR-309-10 của hủy đơn – ca hủy ở
// `api/refund-credit.s4.api.spec.ts`). Project clock (MutableClock): đánh dấu no-show từ 23:00 ngày đến (BR-311-01).
// TC: product/tests/test-cases/r1-main-flows.md – TC-L2-106.
import { expect, test } from '@playwright/test';
import { call, propertyIdOf, sessionOrSkip, stackToday } from '../support/api.js';
import { needClock, resetClock, setClock } from '../support/clock.js';
import {
  action,
  addDays,
  cleanupTracked,
  createReservation,
  freeRoom,
  getReservation,
  newGuest,
  nightsOf,
  oracle,
  reservationBody,
  s2Context,
  track,
  vnTime,
} from '../support/s2.js';
import { approvalsOf } from '../support/s3-stay.js';
import { getFolio, liveLines, virtualDay } from '../support/s3.js';

type Json = Record<string, unknown>;
const num = (x: unknown) => x as number;

let realToday = '';
test.beforeAll(async ({ request }) => {
  await resetClock(request);
  realToday = await stackToday(request);
});
test.afterEach(async ({ request }) => cleanupTracked(request));
test.afterAll(async ({ request }) => resetClock(request));

test.describe(
  'S4-06 – no-show còn tiền dư: giữ cọc theo cơ sở min, tự tạo yêu cầu hoàn (BR-311-03, DOM-S4-14) – MutableClock',
  { tag: ['@clock', '@sprint4', '@money'] },
  () => {
    test('TC-L2-106 BR-311-03 no-show 2 đêm × 820.000, cọc yêu cầu 500.000, đã thu 800.000: giữ 500.000, MỘT yêu cầu hoàn 300.000 chờ duyệt + "Cần chú ý" closed_reservation_credit (S4-06)', async ({
      request,
    }) => {
      needClock('TC-L2-106');
      const ex = oracle('BR-311-03');
      const markAt = String(oracle('BR-311-01').expected.markNoShowFrom).slice(11, 16);
      const D = virtualDay(realToday, 3);
      await setClock(request, vnTime(D, '10:00'));
      const fd = await sessionOrSkip(request, 'qa.fd');
      const c = await s2Context(request);
      const departure = addDays(D, num(ex.input.nights));
      const rm = await freeRoom(request, fd, c.rooms, D, departure);
      const r = await createReservation(
        request,
        fd,
        reservationBody(c, {
          room: rm,
          arrival: D,
          departure,
          guestId: await newGuest(request, fd),
          extra: {
            nightlyRates: nightsOf(D, departure).map((date) => ({
              date,
              amountVnd: num(ex.input.nightRateVnd),
            })),
            initialPayment: {
              type: 'deposit',
              method: 'cash',
              amountVnd: num(ex.input.depositPaidVnd),
            },
          },
        }),
      );
      expect(r.status, `createReservation: ${JSON.stringify(r.body)}`).toBe(201);
      track('reservation', r.body.id);
      const res = r.body as typeof r.body & { folioId: string };
      expect(res.totalRoomVnd).toBe(num(ex.input.roomTotalVnd));
      expect(res.depositRequiredVnd, 'cọc yêu cầu BR-305').toBe(num(ex.input.depositRequiredVnd));

      // ⏱ 23:00 ngày đến – lễ tân đánh dấu không đến (đã gọi không được)
      await setClock(request, vnTime(D, markAt));
      const fd2 = await sessionOrSkip(request, 'qa.fd');
      const m = await action(request, fd2, res.id, 'mark-no-show', {
        contactAttemptNote: 'Da goi 3 lan khong nghe may',
      });
      expect(m.status, `markNoShow: ${JSON.stringify(m.body)}`).toBe(200);
      expect((await getReservation(request, fd2, res.id)).body.status).toBe('no_show');
      const f = await getFolio(request, fd2, res.folioId);
      expect(
        liveLines(f, 'no_show_fee').reduce((a, l) => a + l.amountVnd, 0),
        'giữ cọc = min(800.000, 500.000, 1.640.000)',
      ).toBe(num(ex.expected.retainedVnd));
      expect(
        liveLines(f, 'room').reduce((a, l) => a + l.amountVnd, 0),
        'đảo hết tiền phòng',
      ).toBe(0);
      expect(f.totals.balanceDueVnd).toBe(0);
      expect(f.totals.creditVnd, 'tiền thừa').toBe(num(ex.expected.autoRefundRequestVnd));
      const mgr = await sessionOrSkip(request, 'qa.mgr');
      const rq = (await approvalsOf(request, mgr, res.code)).filter((a) => a.type === 'refund');
      expect(
        rq.map((a) => [a.status, a.amountVnd]),
        'đúng MỘT yêu cầu hoàn tự tạo',
      ).toEqual([['pending', num(ex.expected.autoRefundRequestVnd)]]);
      const att = await call<{ data: Json[] }>(
        request,
        'GET',
        `/v1/properties/${propertyIdOf(fd2)}/attention`,
        { session: fd2 },
      );
      expect(att.status).toBe(200);
      expect(
        att.body.data.filter(
          (x) =>
            x.kind === 'closed_reservation_credit' &&
            (x.refCode === res.code ||
              ((x.reservationIds as string[] | undefined) ?? []).includes(res.id)),
        ),
        '"Cần chú ý" closed_reservation_credit mở cho đơn',
      ).toHaveLength(1);
    });
  },
);
