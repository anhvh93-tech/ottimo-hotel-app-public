// E2E API – ĐK-S2-2 / QC-S2-01 (BUG-R2-025): hạ sức chứa tối đa của căn xuống dưới số khách của đơn tương lai
// → 409 CAPACITY_BELOW_BOOKINGS kèm conflicts[] (US-004, BR-110; OpenAPI updateRoom). BE-A viết ca đầu (Sprint 3) –
// QA gán mã TC và đưa vào ma trận truy vết.
// An toàn trên stack dùng chung: ca chỉ mong 409 (căn không đổi). Nếu server lỗi mà lưu được, `finally` trả sức chứa
// về giá trị cũ để không làm hỏng các ca song song.
import { expect, test } from '@playwright/test';
import {
  call,
  expectProblem,
  propertyIdOf,
  requireEndpoints,
  sessionOrSkip,
  stackToday,
} from '../support/api.js';
import {
  EP,
  cleanupTracked,
  createReservation,
  freeWindow,
  newGuest,
  reservationBody,
  room,
  s2Context,
  track,
} from '../support/s2.js';

const UPDATE_ROOM: [string, string, string] = [
  'PATCH',
  '/v1/properties/{propertyId}/rooms/{roomId}',
  'updateRoom',
];

interface RoomRow {
  id: string;
  roomNo: string;
  maxOccupancy: number;
  baseOccupancy: number;
  version: number;
}
interface CapacityConflict {
  reservationCode: string;
  stayFrom: string;
  stayTo: string;
  guestCount: number;
}

test.describe(
  'L1 – sức chứa căn ↔ đơn tương lai (US-004, BR-110)',
  { tag: ['@api', '@sprint3'] },
  () => {
    test.afterEach(async ({ request }) => cleanupTracked(request));

    test('ĐK-S2-2 hạ maxOccupancy dưới số khách của đơn tương lai → 409 CAPACITY_BELOW_BOOKINGS, căn không đổi', async ({
      request,
    }) => {
      await requireEndpoints(request, 'ĐK-S2-2', [EP.createReservation, EP.listRooms, UPDATE_ROOM]);
      const owner = await sessionOrSkip(request, 'qa.owner');
      const fd = await sessionOrSkip(request, 'qa.fd');
      const c = await s2Context(request);
      const pid = propertyIdOf(owner);
      const today = await stackToday(request);
      const rm = room(c, '301'); // định mức 4, tối đa 5 (BR-110)
      const guestId = await newGuest(request, fd);
      const w = await freeWindow(request, fd, rm, 2, { today });
      // 4 người lớn + 1 trẻ 8 tuổi + 1 trẻ 3 tuổi → tính sức chứa 5 (trẻ dưới 6 không tính).
      const res = await createReservation(
        request,
        fd,
        reservationBody(c, {
          room: rm,
          ...w,
          guestId,
          adults: 4,
          children6to11: 1,
          childrenUnder6: 1,
        }),
      );
      expect(res.status, JSON.stringify(res.body)).toBe(201);
      track('reservation', res.body.id);

      const rooms = async () => {
        const r = await call<{ data: RoomRow[] }>(request, 'GET', `/v1/properties/${pid}/rooms`, {
          session: owner,
        });
        expect(r.status).toBe(200);
        return r.body.data.find((x) => x.id === rm.id)!;
      };
      const before = await rooms();
      test.skip(before.maxOccupancy !== 5, 'môi trường: căn 301 không còn sức chứa 5 (DS-E)');
      try {
        const r = await call(request, 'PATCH', `/v1/properties/${pid}/rooms/${rm.id}`, {
          session: owner,
          ifMatch: `"${before.version}"`,
          body: { maxOccupancy: 4 },
        });
        const p = expectProblem(r, 409, 'CAPACITY_BELOW_BOOKINGS') as unknown as {
          conflicts: CapacityConflict[];
        };
        expect(p.conflicts).toContainEqual({
          reservationCode: res.body.code,
          stayFrom: w.arrival,
          stayTo: w.departure,
          guestCount: 5,
        });
        const after = await rooms();
        expect(after).toMatchObject({ maxOccupancy: 5, version: before.version });
      } finally {
        const now = await rooms();
        if (now.maxOccupancy !== before.maxOccupancy) {
          await call(request, 'PATCH', `/v1/properties/${pid}/rooms/${rm.id}`, {
            session: owner,
            ifMatch: `"${now.version}"`,
            body: { maxOccupancy: before.maxOccupancy },
          });
        }
      }
    });
  },
);
