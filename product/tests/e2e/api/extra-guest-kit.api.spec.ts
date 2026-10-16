// E2E API – BR-812 việc "Chuẩn bị bộ đồ dùng thêm" (người ngủ sofa) sinh từ đơn ở Sprint 2 + phụ thu người BR-110.
// TC: TC-L2-019, TC-L6-053 (a)(b)(c)(d)(f), TC-L6-055 (a)(e). Oracle: BR-110-0x, BR-812-01/04/05/06/07.
// Việc HK đọc bằng listHkTasks (EP07 – có thể đến Sprint 4): khi chưa có endpoint, phần kiểm việc tự skip có mã TC;
// phần kiểm `extraGuestCount` trên đơn vẫn chạy. Phụ thu trên folio cần getFolio (Sprint 3).
import { expect, test, type APIRequestContext } from '@playwright/test';
import {
  call,
  isAvailable,
  needSeedPassword,
  propertyIdOf,
  requireEndpoints,
  sessionOrSkip,
  stackToday,
  type StaffSession,
} from '../support/api.js';
import {
  EP,
  action,
  addDays,
  bookFree,
  cleanupTracked,
  getReservation,
  makeHold,
  oracle,
  paxOf,
  room,
  s2Context,
  statusOf,
  vnTime,
  type ChannelKind,
  type Reservation,
} from '../support/s2.js';

test.describe.configure({ mode: 'parallel' });

interface HkTask {
  id: string;
  type: string;
  status: string;
  reservationId?: string | null;
  roomNo: string;
  quantity?: number;
  dueAt?: string;
  source: string;
}

async function kitTasks(
  ctx: APIRequestContext,
  s: StaffSession,
  res: Reservation,
): Promise<HkTask[]> {
  const r = await call<{ data: HkTask[] }>(
    ctx,
    'GET',
    `/v1/properties/${propertyIdOf(s)}/hk-tasks`,
    { session: s, query: { date: res.arrivalDate } },
  );
  expect(r.status, JSON.stringify(r.body)).toBe(200);
  return r.body.data.filter(
    (t) => t.reservationId === res.id && t.type.startsWith('extra_guest_kit_'),
  );
}

async function hkListAvailable(ctx: APIRequestContext): Promise<boolean> {
  return isAvailable(ctx, 'GET', EP.listHkTasks[1]);
}

const CASES: Array<{ tc: string; ex: string; kind: ChannelKind; label: string }> = [
  {
    tc: 'TC-L6-053 (a) / TC-L2-019 (a)',
    ex: 'BR-110-01',
    kind: 'direct',
    label: '202, 3 người lớn',
  },
  { tc: 'TC-L6-053 (b)', ex: 'BR-812-04', kind: 'direct', label: '202, 2 người lớn + trẻ 4 tuổi' },
  {
    tc: 'TC-L6-053 (c) / TC-L2-019 (b)',
    ex: 'BR-110-03',
    kind: 'direct',
    label: '302, 3 người lớn',
  },
  { tc: 'TC-L2-019 (c)', ex: 'BR-812-05', kind: 'direct', label: '302, 4 người lớn' },
  {
    tc: 'TC-L6-053 (d) / TC-L2-019 (d)',
    ex: 'BR-812-07',
    kind: 'booking',
    label: 'Booking 202, 3 người lớn',
  },
];

test.describe(
  'BR-812 bộ đồ dùng thêm + BR-110 người vượt định mức',
  { tag: ['@api', '@sprint2'] },
  () => {
    test.beforeEach(() => needSeedPassword());
    test.afterEach(async ({ request }) => cleanupTracked(request));

    for (const k of CASES) {
      test(`${k.tc} ${k.label} → extraGuestCount + việc chuẩn bị (oracle ${k.ex})`, async ({
        request,
      }) => {
        await requireEndpoints(request, k.tc.split(' ')[0]!, [EP.createReservation]);
        const fd = await sessionOrSkip(request, 'qa.fd');
        const c = await s2Context(request);
        const today = await stackToday(request);
        const o = oracle(k.ex);
        const kits = Number(o.expected.extraGuestKits);
        const res = await bookFree(request, fd, c, {
          room: room(c, String(o.input.roomNo)),
          nights: 3,
          today,
          kind: k.kind,
          ...paxOf(o.input),
        });
        expect(res.status).toBe('confirmed');
        expect(res.extraGuestCount, JSON.stringify(res)).toBe(kits);

        if (await isAvailable(request, 'GET', EP.getFolio[1])) {
          // TC-L2-019: phụ thu người trên folio = oracle (đơn OTA: 0 – BR-812-07); không có dòng tiền bộ đồ dùng
          const f = await call<{
            lines?: Array<{ amountVnd: number; code?: string; type?: string }>;
          }>(request, 'GET', `/v1/properties/${propertyIdOf(fd)}/folios/${res.folioId}`, {
            session: fd,
          });
          if (f.status === 200 && o.expected.extraPersonFeeVnd !== undefined) {
            const extra = (f.body.lines ?? [])
              .filter((l) =>
                /extra_person|extra_guest|phu_thu_nguoi/i.test(`${l.code ?? ''} ${l.type ?? ''}`),
              )
              .reduce((s, l) => s + l.amountVnd, 0);
            expect(extra, JSON.stringify(f.body.lines)).toBe(o.expected.extraPersonFeeVnd);
          }
        }

        test.skip(
          !(await hkListAvailable(request)),
          `${k.tc}: chờ endpoint listHkTasks (phần việc HK)`,
        );
        const tasks = await kitTasks(request, fd, res);
        if (kits === 0) {
          expect(tasks, JSON.stringify(tasks)).toHaveLength(0);
          return;
        }
        expect(tasks, JSON.stringify(tasks)).toHaveLength(1);
        const t = tasks[0]!;
        expect(t.type).toBe('extra_guest_kit_prepare');
        expect(t.source).toBe('system');
        expect(t.quantity ?? 1).toBe(kits);
        expect(t.status).toBe('open');
        // hạn = 14:00 ngày đến (BR-812-01: đến 9/11 → 2026-11-09T14:00:00+07:00)
        const dueHHMM = String(oracle('BR-812-01').expected.dueAt).slice(11, 16);
        expect(new Date(t.dueAt ?? '').getTime()).toBe(
          new Date(vnTime(res.arrivalDate, dueHHMM)).getTime(),
        );
      });
    }

    test('TC-L6-053 (f) giữ chỗ chưa sinh việc; xác nhận cọc → sinh 1 việc', async ({
      request,
    }) => {
      await requireEndpoints(request, 'TC-L6-053', [
        EP.saveQuote,
        EP.createHoldFromQuote,
        EP.confirmDeposit,
        EP.listHkTasks,
      ]);
      const sal = await sessionOrSkip(request, 'qa.sal');
      const fd = await sessionOrSkip(request, 'qa.fd');
      const c = await s2Context(request);
      const today = await stackToday(request);
      const { hold } = await makeHold(request, sal, c, {
        rooms: [room(c, '202'), room(c, '203'), room(c, '201')],
        arrival: addDays(today, 50 + Math.floor(Math.random() * 150)),
        nights: 3,
        holdHours: 24,
        adults: 3,
      });
      expect(await kitTasks(request, fd, hold)).toHaveLength(0);
      const r = await action(
        request,
        sal,
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
      );
      expect(r.status, statusOf(r)).toBe(200);
      const tasks = await kitTasks(request, fd, hold);
      expect(tasks.map((t) => `${t.type}:${t.status}`)).toEqual(['extra_guest_kit_prepare:open']);
    });

    test('TC-L6-055 (a)(e) giảm còn 2 người lớn hoặc hủy trước khi chuẩn bị → việc cancelled, không trừ kho (BR-812-06)', async ({
      request,
    }) => {
      await requireEndpoints(request, 'TC-L6-055', [
        EP.createReservation,
        EP.updateReservation,
        EP.cancelReservation,
        EP.listHkTasks,
      ]);
      const fd = await sessionOrSkip(request, 'qa.fd');
      const c = await s2Context(request);
      const today = await stackToday(request);
      const o = oracle('BR-812-06');
      const rm = room(c, String(o.input.roomNo));
      // (a) sửa số người
      const a = await bookFree(request, fd, c, {
        room: rm,
        nights: 3,
        today,
        adults: Number(o.input.adultsBefore),
      });
      expect((await kitTasks(request, fd, a)).map((t) => t.status)).toEqual(['open']);
      const p = await call<Reservation>(
        request,
        'PATCH',
        `/v1/properties/${propertyIdOf(fd)}/reservations/${a.id}`,
        { session: fd, ifMatch: `"${a.version}"`, body: { adults: Number(o.input.adultsAfter) } },
      );
      expect(p.status, JSON.stringify(p.body)).toBe(200);
      expect(p.body.extraGuestCount).toBe(0);
      expect((await kitTasks(request, fd, a)).map((t) => t.status)).toEqual([o.expected.taskState]);
      // (e) hủy đơn
      const e = await bookFree(request, fd, c, { room: rm, nights: 3, today, adults: 3 });
      const cancel = await action(request, fd, e.id, 'cancel', { reasonCode: 'guest_cancelled' });
      expect(cancel.status, statusOf(cancel)).toBe(200);
      expect((await kitTasks(request, fd, e)).map((t) => t.status)).toEqual(['cancelled']);
      const after = await getReservation(request, fd, e.id);
      expect(after.body.status).toBe('cancelled');
    });
  },
);
