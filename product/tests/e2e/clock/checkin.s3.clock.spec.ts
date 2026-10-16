// Project "clock" (tuần tự, sau mọi project API) – L3 nhận phòng / hạn khai báo / xóa ảnh theo mốc giờ (Sprint 3).
// Mỗi ca chạy trên NGÀY ẢO riêng (support/s3.ts virtualDay – > hôm nay + 800, không dùng lại), tự đặt đồng hồ
// (MutableClock, đóng băng ở mốc chính xác), cấp thiết bị quầy ảo (useVirtualDevice) và đưa mọi căn về VC
// (cleanRooms – stack dùng một lần; dọn buồng thật là Sprint 4). Đơn tạo ra ở trạng thái hold/confirmed được hủy
// ở afterEach; đơn đã nhận phòng nằm ở ngày ảo nên không ảnh hưởng ca khác.
// TC: TC-L3-001…008, 073, 010…016 (4.1), TC-L3-037, 039, 044…049, 051, 053, 054, 056 (4.2), TC-L3-070 (4.3) –
// product/tests/test-cases/r1-main-flows.md mục 4. Ca L3 không cần tua giờ: api/checkin.s3.api.spec.ts.
// Số tiền/mốc giờ có ví dụ BR đọc từ oracle (fixtures/br-examples.json) và chuyển sang ngày ảo (onDay).
import { expect, test, type APIRequestContext } from '@playwright/test';
import {
  call,
  expectProblem,
  isAvailable,
  needSeedPassword,
  requireEndpoints,
  sessionOrSkip,
  stackToday,
  versionTag,
} from '../support/api.js';
import { expectNear, needClock, resetClock, runJob, runJobIfAny } from '../support/clock.js';
import {
  EP,
  addDays,
  cleanupTracked,
  getReservation,
  oracle,
  oracleNum,
  room,
  s2Context,
  vnTime,
  type Room,
  type S2Context,
} from '../support/s2.js';
import {
  EP3,
  addDocument,
  addLine,
  checkIn,
  cleanRooms,
  dev,
  foreignDoc,
  getFolio,
  liveLines,
  makeStay,
  namedGuest,
  needCleanRooms,
  nightRate,
  p3,
  preview,
  recordPayment,
  stayAction,
  transitionReg,
  unmetOf,
  virtualDay,
  vnDoc,
  type Stay,
  type StayInput,
  portalDate,
} from '../support/s3.js';
import {
  at,
  attention,
  c3Log,
  checkOf,
  checkOutStay,
  childOf,
  getImage,
  historyOf,
  mainDoc,
  onDay,
  patchReservation,
  roomStatusOf,
  regAttentionOf,
  regOf,
  regRow,
  setParam,
  simulateRoomStatus,
  sqlValue,
  stepUp,
  toConfirmed,
  toScanned,
} from '../support/s3-checkin.js';

// Mỗi ca chạy trên ngày ảo riêng, độc lập: KHÔNG dùng mode 'serial' (một ca đỏ sẽ bỏ qua mọi ca sau và CI chạy
// lại cả file). Thứ tự tuần tự đã do project clock/desk-clock bảo đảm (workers 1, fullyParallel false).
test.describe.configure({ mode: 'default' });

let realToday = '';
test.beforeAll(async ({ request }) => {
  realToday = await stackToday(request);
});
test.afterEach(async ({ request }) => cleanupTracked(request));
test.afterAll(async ({ request }) => resetClock(request));

const story = (s: string) => ({ type: 'story', description: s });
const eps = (s: string) => ({ type: 'endpoints', description: s });
type Ep = [string, string, string];
const J5 = 'registration.deadline';
const J16 = 'retention.purge';
const SIM = (what: string) =>
  test.info().annotations.push({
    type: 'giả lập',
    description: `${what} – ghi room_status trên stack dùng một lần (chuyển trạng thái buồng là Sprint 4)`,
  });
const SPRINT4 = (what: string) =>
  test.info().annotations.push({
    type: 'Sprint 4',
    description: `${what}: listHkTasks/listRoomStatuses chưa có trên build – kiểm qua DB stack dùng một lần`,
  });

/** Ngày ảo riêng của ca + đồng hồ đóng băng ở `time` + thiết bị quầy ảo + mọi căn VC. */
async function begin(
  request: APIRequestContext,
  tc: string,
  endpoints: Ep[],
  time: string,
  span = 4,
): Promise<{ D: string; c: S2Context }> {
  needSeedPassword();
  needClock(tc);
  needCleanRooms(tc);
  await requireEndpoints(request, tc, endpoints);
  const D = virtualDay(realToday, span);
  await at(request, vnTime(D, time));
  cleanRooms();
  const c = await s2Context(request);
  return { D, c };
}

const fdOf = (request: APIRequestContext) => sessionOrSkip(request, 'qa.fd');

/** Giờ của một Instant theo giờ VN (HH:MM). */
const hhmm = (iso: string | undefined) =>
  new Date(new Date(String(iso)).getTime() + 7 * 3_600_000).toISOString().slice(11, 16);

/** Số giờ BR-603 (giờ đến + N) suy từ ví dụ BR-603-01 (08:00 → 20:00). */
function foreignHours(): number {
  const o = oracle('BR-603-01');
  return (
    (new Date(String(o.expected.deadline)).getTime() -
      new Date(String(o.input.arrivedAt)).getTime()) /
    3_600_000
  );
}

/** Giá đêm 700.000 của ví dụ BR-411 (kênh Trực tiếp cho nhập giá trong sàn–trần BR-105). */
const RATE_700 = () => Number(oracle('BR-411-01').input.firstNightRateVnd);
const at700 = (D: string, nights = 1): Partial<StayInput> => ({
  nights,
  extra: {
    nightlyRates: Array.from({ length: nights }, (_, i) => ({
      date: addDays(D, i),
      amountVnd: RATE_700(),
    })),
  },
});

async function setDoor(request: APIRequestContext, reservationId: string) {
  const fd = await fdOf(request);
  return call(request, 'PUT', p3(EP3.setDoorCredential, fd, { reservationId }), {
    session: fd,
    idempotencyKey: true,
    body: { code: '1203472' },
  });
}

/** Đơn đã nhận phòng (FD, buồng VC) – kiểm 200. */
async function checkedIn(
  request: APIRequestContext,
  c: S2Context,
  i: StayInput & { checkIn?: Record<string, unknown> },
): Promise<Stay> {
  const fd = await fdOf(request);
  const st = await makeStay(request, c, fd, i);
  const r = await checkIn(request, fd, st.res.id, i.checkIn ?? {});
  expect(r.status, `checkIn ${st.res.code}: ${JSON.stringify(r.body).slice(0, 400)}`).toBe(200);
  expect(r.body.status).toBe('in_house');
  return { ...st, res: r.body as Stay['res'] };
}

test.describe(
  'L3 – nhận phòng, hạn khai báo, xóa ảnh theo mốc giờ (EP03, EP06 – Sprint 3) – MutableClock',
  { tag: ['@clock', '@sprint3'] },
  () => {
    test.describe('4.1 Nhận phòng và phụ thu nhận sớm', () => {
      test(
        'TC-L3-001 US-025/AC1 [A+E · Cao (S)]',
        { annotation: [story('US-025/AC1'), eps('previewCheckIn, checkIn')] },
        async ({ request }) => {
          const { D, c } = await begin(
            request,
            'TC-L3-001',
            [EP3.previewCheckIn, EP3.checkIn],
            '14:30',
          );
          const fd = await fdOf(request);
          const st = await makeStay(request, c, fd, { room: room(c, '203'), arrival: D });
          const f0 = await getFolio(request, fd, String(st.res.folioId));
          const pv = await preview(request, fd, st.res.id);
          expect(pv.status, JSON.stringify(pv.body)).toBe(200);
          expect(pv.body.checkinTime, 'giữ giờ mặc định = giờ chuẩn').toBe(
            pv.body.standardCheckinTime,
          );
          for (const x of pv.body.conditions as Array<{ code: string; met: boolean }>) {
            expect(x.met, x.code).toBe(true);
          }
          expect(['VI', 'VC']).toContain(pv.body.roomStatus);
          expect((pv.body.earlyCheckinSurcharge as { amountVnd: number }).amountVnd).toBe(0);
          const r = await checkIn(request, fd, st.res.id);
          expect(r.status, JSON.stringify(r.body)).toBe(200);
          expect(r.body.status).toBe('in_house');
          expectNear(String(r.body.actualCheckinAt), vnTime(D, '14:30'), 'giờ nhận thực tế');
          SPRINT4('trạng thái buồng SM-03 (room_status)');
          expect(roomStatusOf(room(c, '203').id)).toBe('OC');
          const f = await getFolio(request, fd, String(st.res.folioId));
          expect(liveLines(f, 'early_checkin'), 'không có dòng phụ thu').toHaveLength(0);
          expect(f.totals.totalVnd).toBe(f0.totals.totalVnd);
        },
      );

      test(
        'TC-L3-002 US-025/AC2 [A+E · Cao]',
        {
          annotation: [story('US-025/AC2'), eps('checkIn, listApprovalRequests, listHkTasks')],
        },
        async ({ request }) => {
          const { D, c } = await begin(
            request,
            'TC-L3-002',
            [EP3.checkIn, EP3.listApprovalRequests],
            '14:30',
          );
          const fd = await fdOf(request);
          const rm = room(c, '203');
          const st = await makeStay(request, c, fd, { room: rm, arrival: D });
          SIM('buồng 203 = VD (khách trước vừa trả, chưa dọn)');
          simulateRoomStatus(rm.id, 'VD');
          const pv = await preview(request, fd, st.res.id);
          const cond = (pv.body.conditions as Array<Record<string, unknown>>).find(
            (x) => x.code === 'room_ready',
          );
          expect(cond).toMatchObject({ met: false, detail: 'VD' });
          expect(cond?.overridableBy).toEqual(expect.arrayContaining(['front_desk_lead']));
          // (a) FD: không nhận trực tiếp – gửi FDL+ xác nhận (A12 = D)
          const a0 = await checkIn(request, fd, st.res.id);
          expectProblem(a0, 409, 'CHECKIN_CONDITIONS_NOT_MET');
          expect(unmetOf(a0)).toEqual(['room_ready']);
          const a1 = await checkIn(request, fd, st.res.id, {
            roomNotReadyOverride: { reason: 'Khach den som, buong dang cho don' },
          });
          expect(a1.status, JSON.stringify(a1.body)).toBe(202);
          const approval = a1.body as unknown as { id: string; type: string; status: string };
          expect(approval).toMatchObject({ type: 'checkin_room_not_ready', status: 'pending' });
          const fdl = await sessionOrSkip(request, 'qa.fdl');
          const list = await call<{ data: Array<{ id: string; status: string }> }>(
            request,
            'GET',
            p3(EP3.listApprovalRequests, fdl),
            { session: fdl },
          );
          expect(list.status).toBe(200);
          expect(list.body.data.find((x) => x.id === approval.id)?.status).toBe('pending');
          expect((await getReservation(request, fd, st.res.id)).body.status).toBe('confirmed');
          // (b) FDL nhận phòng kèm lý do → in_house, buồng OD, việc dọn ưu tiên, nhật ký có lý do
          const reason = 'Khach VIP, nhan truoc khi don xong';
          const b = await checkIn(request, fdl, st.res.id, { roomNotReadyOverride: { reason } });
          expect(b.status, JSON.stringify(b.body)).toBe(200);
          expect(b.body.status).toBe('in_house');
          SPRINT4('trạng thái buồng SM-03 (room_status)');
          expect(roomStatusOf(room(c, '203').id)).toBe('OD');
          const h = await historyOf(request, fd, st.res.id);
          const ev = h.find((x) => x.action === 'reservation.checked_in');
          expect(ev, JSON.stringify(h).slice(0, 500)).toMatchObject({
            actorName: fdl.me.displayName,
            reason,
          });
          SPRINT4('việc dọn ưu tiên (R7)');
          expect(
            sqlValue(
              `SELECT type || '|' || priority_rank FROM hk_task WHERE reservation_id = '${st.res.id}' AND type = 'priority_clean';`,
            ),
          ).toBe('priority_clean|1');
        },
      );

      test(
        'TC-L3-003 US-025/AC3 [A+E · Cao (S)]',
        {
          annotation: [story('US-025/AC3'), eps('previewCheckIn, checkIn, setDoorCredential')],
        },
        async ({ request }) => {
          const { D, c } = await begin(
            request,
            'TC-L3-003',
            [EP3.previewCheckIn, EP3.checkIn, EP3.recordPayment],
            '14:30',
          );
          const fd = await fdOf(request);
          // (a) đơn Trực tiếp còn phải thu 1.000
          const a = await makeStay(request, c, fd, {
            room: room(c, '201'),
            arrival: D,
            pay: 'deposit',
          });
          const fa = await getFolio(request, fd, String(a.res.folioId));
          const pay = await recordPayment(request, fd, String(a.res.folioId), {
            type: 'charge',
            method: 'cash',
            amountVnd: fa.totals.balanceDueVnd - 1000,
          });
          expect(pay.status, JSON.stringify(pay.body)).toBe(201);
          expect((await getFolio(request, fd, String(a.res.folioId))).totals.balanceDueVnd).toBe(
            1000,
          );
          const ra = await checkIn(request, fd, a.res.id);
          expectProblem(ra, 409, 'CHECKIN_CONDITIONS_NOT_MET');
          expect(unmetOf(ra)).toEqual(['balance_paid']);
          // (b) đủ tiền nhưng chưa có giấy tờ người đứng tên
          const b = await makeStay(request, c, fd, {
            room: room(c, '202'),
            arrival: D,
            doc: false,
          });
          const rb = await checkIn(request, fd, b.res.id);
          expectProblem(rb, 409, 'CHECKIN_CONDITIONS_NOT_MET');
          expect(unmetOf(rb)).toEqual(['main_guest_document']);
          // cả hai: không giao/nhập được mã cửa (R2 không có chức năng – US-128 dời R3)
          for (const x of [a, b]) {
            expect((await setDoor(request, x.res.id)).status).toBe(404);
            const g = await getReservation(request, fd, x.res.id);
            expect(g.body.status).toBe('confirmed');
            expect(JSON.stringify(g.body)).not.toMatch(/door(Code|Credential)/);
          }
          // (c) Airbnb "OTA thu hộ", còn phải thu = 0 → nhận được
          const cc = await makeStay(request, c, fd, {
            room: room(c, '203'),
            arrival: D,
            kind: 'airbnb',
          });
          expect(cc.res.paymentModel).toBe('ota_prepaid');
          const rc = await checkIn(request, fd, cc.res.id);
          expect(rc.status, JSON.stringify(rc.body)).toBe(200);
          expect(rc.body.status).toBe('in_house');
        },
      );

      test(
        'TC-L3-004 US-025/AC4 [A · Cao]',
        {
          annotation: [story('US-025/AC4'), eps('checkIn, listAttentionItems, getRegistration')],
        },
        async ({ request }) => {
          const { D, c } = await begin(
            request,
            'TC-L3-004',
            [EP3.checkIn, EP3.listAttentionItems, EP3.getRegistration],
            '10:00',
          );
          const fd = await fdOf(request);
          const st = await makeStay(request, c, fd, {
            room: room(c, '203'),
            arrival: D,
            adults: 1,
            doc: 'foreign',
          });
          expect((await regOf(request, fd, st.regId)).status).toBe('review');
          // hạn = giờ nhận thực tế + N giờ (BR-603; N suy từ ví dụ BR-603-01)
          const due = new Date(
            new Date(vnTime(D, '10:00')).getTime() + foreignHours() * 3_600_000,
          ).toISOString();
          const pv = await preview(request, fd, st.res.id);
          expectNear(
            String(pv.body.registrationDeadlinePreview),
            due,
            'hạn dự kiến trên màn nhận phòng',
          );
          const r = await checkIn(request, fd, st.res.id);
          expect(r.status, JSON.stringify(r.body)).toBe(200);
          const reg = await regOf(request, fd, st.regId);
          expectNear(reg.deadlineAt, due, 'hạn khai báo tính từ giờ nhận thực tế');
          expect(reg.deadlineLabel).toBe('before_deadline_today');
          expect(reg.isOverdue).toBe(false);
          const row = await regRow(request, fd, st.res.id, 'action_needed');
          expectNear(row?.deadlineAt, due, 'danh sách cần khai báo');
          // đơn vào "Cần chú ý" mục khai báo
          const items = await attention(request, fd);
          test.fail(
            true,
            'BUG-R2-034: "Cần chú ý" không có mục khai báo (registration_due/registration_overdue/visa_expiring)',
          );
          expect(
            regAttentionOf(items, st.res.id).length,
            `listAttentionItems: ${JSON.stringify(items.map((x) => x.kind))}`,
          ).toBeGreaterThan(0);
        },
      );

      test(
        'TC-L3-005 US-025/AC5 [A · Cao]',
        { annotation: [story('US-025/AC5'), eps('undoCheckIn')] },
        async ({ request }) => {
          const { D, c } = await begin(
            request,
            'TC-L3-005',
            [EP3.undoCheckIn, EP3.checkIn, EP3.addFolioLine],
            '14:00',
          );
          // đơn tạo + thu tiền lúc 14:00, nhận phòng lúc 14:30 (đồng hồ đóng băng: dòng tiền phòng phải ghi TRƯỚC
          // giờ nhận – điều kiện "chưa có dòng folio mới sau nhận phòng" so posted_at ≥ actualCheckinAt)
          let fd = await fdOf(request);
          const a = await makeStay(request, c, fd, { room: room(c, '203'), arrival: D });
          const b = await makeStay(request, c, fd, { room: room(c, '202'), arrival: D });
          const d = await makeStay(request, c, fd, { room: room(c, '201'), arrival: D, nights: 2 });
          await at(request, vnTime(D, '14:30'));
          fd = await fdOf(request);
          const ca = await checkIn(request, fd, a.res.id, { doorAccessHandedOver: true });
          expect(ca.status, JSON.stringify(ca.body)).toBe(200);
          expect(ca.body.doorAccessHandedOverAt).toBeTruthy();
          const mgr = await sessionOrSkip(request, 'qa.mgr');
          // (a) FD không có "Hoàn tác" (A13)
          const ua = await stayAction(request, fd, a.res.id, 'undo-check-in', {
            reason: 'Nhan nham don',
          });
          expect(ua.status, JSON.stringify(ua.body)).toBe(403);
          // (b) MGR hoàn tác kèm lý do → confirmed, buồng về trạng thái trước, "mã cửa" (dấu đã giao) hủy
          const reason = 'Nhan nham don, khach khac cung ten';
          const ub = await stayAction(request, mgr, a.res.id, 'undo-check-in', { reason });
          expect(ub.status, JSON.stringify(ub.body)).toBe(200);
          expect(ub.body.status).toBe('confirmed');
          expect(ub.body.actualCheckinAt ?? null).toBeNull();
          expect(ub.body.doorAccessHandedOverAt ?? null).toBeNull();
          SPRINT4('trạng thái buồng SM-03 (room_status)');
          expect(roomStatusOf(room(c, '203').id)).toBe('VC');
          const h = await historyOf(request, fd, a.res.id);
          expect(h.find((x) => x.action === 'reservation.check_in_undone')).toMatchObject({
            actorName: mgr.me.displayName,
            reason,
          });
          // R2 không có mã cửa trong app (US-128 dời R3): không có mã nào để hủy
          expect(JSON.stringify(ub.body)).not.toMatch(/door(Code|Credential)/);
          // (c) có dòng folio mới sau nhận phòng → chặn
          const cb = await checkIn(request, fd, b.res.id);
          expect(cb.status, JSON.stringify(cb.body)).toBe(200);
          const line = await addLine(request, fd, String(b.res.folioId), {
            category: 'fnb',
            description: 'Nuoc cam',
            quantity: 1,
            unitPriceVnd: 40000,
          });
          expect(line.status, JSON.stringify(line.body)).toBe(201);
          const uc = await stayAction(request, mgr, b.res.id, 'undo-check-in', { reason });
          expectProblem(uc, 409, 'INVALID_TRANSITION');
          // (d) hôm sau → chặn
          const cd = await checkIn(request, fd, d.res.id);
          expect(cd.status, JSON.stringify(cd.body)).toBe(200);
          await at(request, vnTime(addDays(D, 1), '10:00'));
          const mgr2 = await sessionOrSkip(request, 'qa.mgr');
          const ud = await stayAction(request, mgr2, d.res.id, 'undo-check-in', { reason });
          expectProblem(ud, 409, 'INVALID_TRANSITION');
        },
      );

      test(
        'TC-L3-006 US-025/– [A · TB]',
        { annotation: [story('US-025/–'), eps('checkIn')] },
        async ({ request }) => {
          const { D, c } = await begin(request, 'TC-L3-006', [EP3.checkIn], '14:30');
          const fd = await fdOf(request);
          const rm = room(c, '203');
          const a = await makeStay(request, c, fd, { room: rm, arrival: D });
          SIM('căn 203 OOO đột xuất (createRoomBlock trên căn có đơn → 409)');
          simulateRoomStatus(rm.id, 'OOO');
          const pv = await preview(request, fd, a.res.id);
          const cond = (pv.body.conditions as Array<Record<string, unknown>>).find(
            (x) => x.code === 'room_ready',
          );
          expect(cond).toMatchObject({ met: false, detail: 'OOO' });
          expect(cond?.overridableBy, 'OOO không có ngoại lệ').toBeUndefined();
          const ra = await checkIn(request, fd, a.res.id);
          expectProblem(ra, 409, 'CHECKIN_CONDITIONS_NOT_MET');
          expect(unmetOf(ra)).toEqual(['room_ready']);
          const fdl = await sessionOrSkip(request, 'qa.fdl');
          const rl = await checkIn(request, fdl, a.res.id, {
            roomNotReadyOverride: { reason: 'Thu ghi de buong OOO' },
          });
          expectProblem(rl, 409, 'CHECKIN_CONDITIONS_NOT_MET');
          expect(unmetOf(rl)).toEqual(['room_ready']);
          // đơn confirmed đến ngày mai → 409 INVALID_TRANSITION
          const b = await makeStay(request, c, fd, {
            room: room(c, '202'),
            arrival: addDays(D, 1),
          });
          const rb = await checkIn(request, fd, b.res.id);
          expectProblem(rb, 409, 'INVALID_TRANSITION');
        },
      );

      test(
        'TC-L3-007 US-025/AC3 [A+E · Cao (S)]',
        {
          annotation: [
            story('US-025/AC3'),
            eps('previewCheckIn, checkIn, setDoorCredential, recordPayment'),
          ],
        },
        async ({ request }) => {
          const { D, c } = await begin(
            request,
            'TC-L3-007',
            [EP3.previewCheckIn, EP3.checkIn, EP3.recordPayment],
            '14:30',
            5,
          );
          const fd = await fdOf(request);
          const st = await makeStay(request, c, fd, {
            room: room(c, '203'),
            arrival: D,
            nights: 3,
            kind: 'booking',
            pay: 'deposit',
            extra: { paymentModel: 'ota_pay_at_property' },
          });
          expect(st.res.paymentModel).toBe('ota_pay_at_property');
          // còn phải thu = tiền phòng (TC: 3 × 820.000 = 2.460.000 – giá đêm nhập theo extranet)
          const roomVnd = (st.res.nightlyRates as Array<{ amountVnd: number }>).reduce(
            (s, n) => s + n.amountVnd,
            0,
          );
          const f0 = await getFolio(request, fd, String(st.res.folioId));
          expect(f0.totals.balanceDueVnd).toBe(roomVnd);
          // 1. nhận phòng → chặn, không coi là "OTA đã trả"
          const r1 = await checkIn(request, fd, st.res.id);
          expectProblem(r1, 409, 'CHECKIN_CONDITIONS_NOT_MET');
          expect(unmetOf(r1)).toEqual(['balance_paid']);
          // 2. không nhập/giao được mã cửa
          expect((await setDoor(request, st.res.id)).status).toBe(404);
          // 3. ghi thu đủ rồi nhận phòng
          const p = await recordPayment(request, fd, String(st.res.folioId), {
            type: 'charge',
            method: 'cash',
            amountVnd: roomVnd,
          });
          expect(p.status, JSON.stringify(p.body)).toBe(201);
          const r3 = await checkIn(request, fd, st.res.id);
          expect(r3.status, JSON.stringify(r3.body)).toBe(200);
          expect(r3.body.status).toBe('in_house');
        },
      );

      test(
        'TC-L3-008 US-025/AC6; US-026/AC3 [A · Cao]',
        { annotation: [story('US-025/AC6; US-026/AC3'), eps('previewCheckIn, checkIn')] },
        async ({ request }) => {
          const { D, c } = await begin(
            request,
            'TC-L3-008',
            [EP3.previewCheckIn, EP3.checkIn],
            '20:00',
          );
          let fd = await fdOf(request);
          // (a) đơn Trực tiếp đến D, khách tới 01:30 ngày D+1 (ngày nghiệp vụ vẫn là D)
          const vn = await makeStay(request, c, fd, { room: room(c, '203'), arrival: D });
          const fo = await makeStay(request, c, fd, {
            room: room(c, '202'),
            arrival: D,
            adults: 1,
            doc: 'foreign',
          });
          const D1 = addDays(D, 1);
          const [vnAt, vnDue] = onDay(
            D1,
            String(oracle('BR-602-02').input.arrivedAt),
            String(oracle('BR-602-02').expected.deadline),
          );
          const [, foDue] = onDay(
            D1,
            String(oracle('BR-603-04').input.arrivedAt),
            String(oracle('BR-603-04').expected.deadline),
          );
          await at(request, vnAt);
          fd = await fdOf(request);
          // (a) chạy hết trước, lỗi (nếu có) báo ở cuối ca để phần (b) B9a vẫn được kiểm
          let lateArrival = '';
          for (const st of [vn, fo]) {
            const pv = await preview(request, fd, st.res.id);
            expect(pv.status, JSON.stringify(pv.body)).toBe(200);
            expect(
              (pv.body.earlyCheckinSurcharge as { amountVnd: number }).amountVnd,
              'không phụ thu',
            ).toBe(0);
            const r = await checkIn(request, fd, st.res.id);
            if (r.status !== 200) {
              lateArrival = `B9 ${st.res.code} lúc 01:30 ngày D+1: HTTP ${r.status} ${JSON.stringify(r.body)}`;
              break;
            }
            expect(r.body.arrivalDate, 'không đổi ngày đến').toBe(D);
            expectNear(String(r.body.actualCheckinAt), vnAt, 'giờ nhận ghi đúng 01:30 ngày D+1');
          }
          // hạn khai báo: theo ngày lịch của giờ đến thực tế (BR-602-02) / giờ đến + N giờ (BR-603-04)
          if (!lateArrival) {
            expectNear((await regOf(request, fd, vn.regId)).deadlineAt, vnDue, 'VN');
            expectNear((await regOf(request, fd, fo.regId)).deadlineAt, foDue, 'NN');
          }
          // vẫn ở "Khách đến hôm nay" của ngày nghiệp vụ D (getArrivalsDepartures – EP01, Sprint 4)
          if (
            await isAvailable(request, EP3.getArrivalsDepartures[0], EP3.getArrivalsDepartures[1])
          ) {
            const ad = await call<{ date: string; arrivals: Array<{ id: string }> }>(
              request,
              'GET',
              p3(EP3.getArrivalsDepartures, fd),
              { session: fd },
            );
            expect(ad.status, JSON.stringify(ad.body).slice(0, 300)).toBe(200);
            expect(ad.body.date).toBe(D);
            expect(ad.body.arrivals.map((x) => x.id)).toEqual(
              expect.arrayContaining([vn.res.id, fo.res.id]),
            );
          } else {
            test.info().annotations.push({
              type: 'Sprint 4',
              description: 'getArrivalsDepartures (EP01 "Khách đến hôm nay") chưa có trên build',
            });
          }
          // (b) B9a – đơn OTA, khách tới trước 06:00 của ngày đến, đêm trước trống (ví dụ BR-417-01)
          const o = oracle('BR-417-01');
          const oc = o.expected.childReservation as Record<string, unknown>;
          const D2 = addDays(D, 2);
          await at(request, vnTime(addDays(D, 1), '20:00'));
          fd = await fdOf(request);
          const ota = await makeStay(request, c, fd, {
            room: room(c, String(o.input.room)),
            arrival: D2,
            kind: String(o.input.channel) as StayInput['kind'],
          });
          const [checkinAt] = onDay(D2, String(o.input.checkinAt), String(o.input.checkinAt));
          await at(request, checkinAt);
          fd = await fdOf(request);
          const pv = await preview(request, fd, ota.res.id);
          expect(pv.status, JSON.stringify(pv.body)).toBe(200);
          expect(
            (pv.body.earlyCheckinSurcharge as { addsPreviousNight: boolean }).addsPreviousNight,
          ).toBe(true);
          const prior = pv.body.priorNight as Record<string, unknown>;
          expect(prior).toMatchObject({
            date: addDays(D2, -1),
            available: true,
            createsChildReservation: true,
          });
          expect(prior.defaultRateVnd, 'giá Trực tiếp hiện hành (BR-417-01)').toBe(oc.rateVnd);
          // 0.3.6 bổ sung 2: B9a bắt buộc expectedSurchargeVnd = priorNightRateVnd (số đang hiển thị)
          const r = await checkIn(request, fd, ota.res.id, {
            addPriorNight: true,
            priorNightRateVnd: Number(prior.defaultRateVnd),
            expectedSurchargeVnd: Number(prior.defaultRateVnd),
          });
          expect(r.status, JSON.stringify(r.body)).toBe(200);
          expect(r.body.status).toBe('in_house');
          expect(r.body.arrivalDate, 'đơn OTA giữ ngày đến').toBe(D2);
          const child = await childOf(request, fd, ota.res.id, addDays(D2, -1), D2);
          expect(child, 'đơn con kênh Trực tiếp cho đêm trước').toBeTruthy();
          expect(child).toMatchObject({
            status: String(oc.status),
            channelCode: String(oc.channel),
            arrivalDate: addDays(D2, -1),
            departureDate: D2,
          });
          expectNear(String(child!.actualCheckinAt), checkinAt, 'đơn con in_house cùng lúc');
          expect(nightRate(child as never, addDays(D2, -1))).toBe(oc.rateVnd);
          // khai báo dùng chung bản ghi đơn gốc: đơn con không có bản ghi riêng
          expect(await regRow(request, fd, String(child!.id))).toBeUndefined();
          expect(await regRow(request, fd, ota.res.id)).toBeTruthy();
          // (a) khách đến sau nửa đêm của ngày đến (ngày nghiệp vụ vẫn = ngày đến): B9 thường, không phụ thu
          test.fail(
            !!lateArrival,
            'BUG-R2-052: nhận phòng lúc 01:30 ngày D+1 (ngày nghiệp vụ = ngày đến D) bị tính như nhận sớm trước 06:00 → 422 addPriorNight REQUIRED (preview cùng lúc báo phụ thu 0)',
          );
          expect(lateArrival, 'US-025 AC6 / BR-602-02').toBe('');
        },
      );

      test(
        'TC-L3-073 US-025/AC7 [A+E · Cao]',
        {
          annotation: [story('US-025/AC7'), eps('checkIn, updateReservation, getReservation')],
        },
        async ({ request }) => {
          const { D, c } = await begin(
            request,
            'TC-L3-073',
            [EP3.checkIn, EP.updateReservation, EP.getReservation],
            '14:30',
          );
          // (a) không tick "Đã giao mã cửa/thẻ" → vẫn in_house, doorAccessHandedOverAt rỗng
          const a = await checkedIn(request, c, { room: room(c, '203'), arrival: D });
          expect(a.res.doorAccessHandedOverAt ?? null).toBeNull();
          // (b) tick bổ sung từ chi tiết đơn lúc 15:10 [GIẢ ĐỊNH QA – E03-06: ReservationPatch.doorAccessHandedOver]
          await at(request, vnTime(D, '15:10'));
          let fd = await fdOf(request);
          const cur = await getReservation(request, fd, a.res.id);
          const up = await patchReservation(request, fd, a.res.id, cur.body.version, {
            doorAccessHandedOver: true,
          });
          expect(up.status, JSON.stringify(up.body)).toBe(200);
          expectNear(String(up.body.doorAccessHandedOverAt), vnTime(D, '15:10'), 'thời điểm tick');
          const h = await historyOf(request, fd, a.res.id);
          const tick = h.filter((x) => JSON.stringify(x).includes('doorAccessHandedOver'));
          expect(tick.length, JSON.stringify(h).slice(0, 600)).toBeGreaterThan(0);
          expect(tick.some((x) => x.actorName === fd.me.displayName)).toBe(true);
          // (c) đơn 2 tick ngay khi nhận phòng lúc 15:20 → thời điểm = giờ nhận, người = qa.fd
          await at(request, vnTime(D, '15:20'));
          fd = await fdOf(request);
          const b = await checkedIn(request, c, {
            room: room(c, '202'),
            arrival: D,
            checkIn: { doorAccessHandedOver: true },
          });
          expectNear(String(b.res.doorAccessHandedOverAt), String(b.res.actualCheckinAt), 'tick');
          const hb = await historyOf(request, fd, b.res.id);
          expect(hb.find((x) => x.action === 'reservation.checked_in')).toMatchObject({
            actorName: fd.me.displayName,
            after: expect.objectContaining({ doorAccessHandedOver: true }),
          });
          // (d) không có mã cửa trong phản hồi API (R2), không có chức năng nhập mã
          for (const body of [
            a.res,
            up.body,
            b.res,
            (await getReservation(request, fd, b.res.id)).body,
          ]) {
            expect(JSON.stringify(body)).not.toMatch(/door(Code|Credential)/);
          }
          expect((await setDoor(request, b.res.id)).status).toBe(404);
        },
      );

      test(
        'TC-L3-010 US-026/AC1 [A+E · Cao]',
        { annotation: [story('US-026/AC1'), eps('previewCheckIn')] },
        async ({ request }) => {
          const o = oracle('BR-414-01');
          const { D, c } = await begin(
            request,
            'TC-L3-010',
            [EP3.previewCheckIn],
            String(o.input.formOpenedAt).slice(11, 16),
          );
          const fd = await fdOf(request);
          const st = await makeStay(request, c, fd, { room: room(c, '203'), arrival: D });
          const f0 = await getFolio(request, fd, String(st.res.folioId));
          const pv = await preview(request, fd, st.res.id);
          expect(pv.status, JSON.stringify(pv.body)).toBe(200);
          expect(pv.body.checkinTime, 'giờ chuẩn, không phải giờ mở form').toBe(
            o.expected.defaultCheckinTime,
          );
          expect((pv.body.earlyCheckinSurcharge as { amountVnd: number }).amountVnd).toBe(
            oracleNum('BR-414-01', 'suggestedSurchargeVnd'),
          );
          const f1 = await getFolio(request, fd, String(st.res.folioId));
          expect(f1.lines.length, 'previewCheckIn không tạo dòng folio').toBe(f0.lines.length);
          expect(f1.version).toBe(f0.version);
        },
      );

      test(
        'TC-L3-011 US-026/AC2 [A+E · Cao]',
        { annotation: [story('US-026/AC2'), eps('previewCheckIn, checkIn')] },
        async ({ request }) => {
          const o = oracle('BR-411-01');
          const time = String(o.input.checkinTime);
          const amount = oracleNum('BR-411-01', 'surchargeVnd');
          const { D, c } = await begin(
            request,
            'TC-L3-011',
            [EP3.previewCheckIn, EP3.checkIn],
            time,
          );
          const fd = await fdOf(request);
          const st = await makeStay(request, c, fd, {
            room: room(c, '203'),
            arrival: D,
            ...at700(D),
          });
          expect(nightRate(st.res, D)).toBe(RATE_700());
          const pv = await preview(request, fd, st.res.id, time);
          expect((pv.body.earlyCheckinSurcharge as { amountVnd: number }).amountVnd).toBe(amount);
          const folio = String(st.res.folioId);
          expect(liveLines(await getFolio(request, fd, folio), 'early_checkin')).toHaveLength(0);
          // (b) số xác nhận lệch số server tính → từ chối, không ghi
          const bad = await checkIn(request, fd, st.res.id, {
            checkinTime: time,
            applyEarlySurcharge: true,
            expectedSurchargeVnd: amount - 1000,
          });
          expectProblem(bad, 409, 'SURCHARGE_CHANGED');
          expect(liveLines(await getFolio(request, fd, folio), 'early_checkin')).toHaveLength(0);
          expect((await getReservation(request, fd, st.res.id)).body.status).toBe('confirmed');
          // (a) xác nhận đúng số đang hiển thị → 1 dòng (thu luôn khoản phụ thu tại bước nhận phòng – EP03-05 1.3)
          const pay = await recordPayment(request, fd, folio, {
            type: 'charge',
            method: 'cash',
            amountVnd: amount,
            note: 'Thu phu thu nhan som truoc khi nhan phong',
          });
          expect(pay.status, JSON.stringify(pay.body)).toBe(201);
          const ok = await checkIn(request, fd, st.res.id, {
            checkinTime: time,
            applyEarlySurcharge: true,
            expectedSurchargeVnd: amount,
          });
          expect(ok.status, JSON.stringify(ok.body)).toBe(200);
          const lines = liveLines(await getFolio(request, fd, folio), 'early_checkin');
          expect(lines).toHaveLength(1);
          expect(lines[0]!.amountVnd).toBe(amount);
          // EP03-05 1.3: balance_paid tính cả phụ thu nhận sớm sắp ghi – chưa thu thì chưa nhận phòng
          const st2 = await makeStay(request, c, fd, {
            room: room(c, '202'),
            arrival: D,
            ...at700(D),
          });
          const r2 = await checkIn(request, fd, st2.res.id, {
            checkinTime: time,
            applyEarlySurcharge: true,
            expectedSurchargeVnd: amount,
          });
          test.fail(
            true,
            'BUG-R2-038: điều kiện balance_paid không cộng phụ thu nhận sớm/đêm B9a sắp ghi (EP03-05 1.3) – nhận phòng xong còn nợ phụ thu',
          );
          expectProblem(r2, 409, 'CHECKIN_CONDITIONS_NOT_MET');
          expect(unmetOf(r2)).toEqual(['balance_paid']);
        },
      );

      test(
        'TC-L3-012 US-026/AC2 [U+A · Cao]',
        { annotation: [story('US-026/AC2'), eps('previewCheckIn')] },
        async ({ request }) => {
          const { D, c } = await begin(request, 'TC-L3-012', [EP3.previewCheckIn], '09:00');
          const fd = await fdOf(request);
          const st = await makeStay(request, c, fd, {
            room: room(c, '203'),
            arrival: D,
            ...at700(D),
          });
          // 13:59 cùng bậc 30% với 11:00 (BR-411-01); các mốc khác có ví dụ riêng
          const cases: Array<[string, number]> = [
            [String(oracle('BR-411-03').input.checkinTime), oracleNum('BR-411-03', 'surchargeVnd')],
            ['13:59', oracleNum('BR-411-01', 'surchargeVnd')],
            ...['BR-411-04', 'BR-411-05', 'BR-411-02', 'BR-411-06'].map(
              (id) =>
                [String(oracle(id).input.checkinTime), oracleNum(id, 'surchargeVnd')] as [
                  string,
                  number,
                ],
            ),
          ];
          for (const [time, want] of cases) {
            const pv = await preview(request, fd, st.res.id, time);
            expect(pv.status, JSON.stringify(pv.body)).toBe(200);
            expect(
              (pv.body.earlyCheckinSurcharge as { amountVnd: number }).amountVnd,
              `nhận ${time}`,
            ).toBe(want);
          }
        },
      );

      test(
        'TC-L3-013 US-026/AC3 [A · Cao]',
        { annotation: [story('US-026/AC3'), eps('previewCheckIn, checkIn')] },
        async ({ request }) => {
          const o = oracle('BR-411-07');
          const { D, c } = await begin(
            request,
            'TC-L3-013',
            [EP3.previewCheckIn, EP3.checkIn],
            String(o.input.checkinTime),
          );
          // D = ngày đến; 05:30 ngày D thuộc ngày nghiệp vụ D − 1
          const prev = addDays(D, -1);
          let fd = await fdOf(request);
          const s1 = await makeStay(request, c, fd, {
            room: room(c, '203'),
            arrival: D,
            ...at700(D),
          });
          const s2 = await makeStay(request, c, fd, {
            room: room(c, '202'),
            arrival: D,
            ...at700(D),
          });
          const occ = await makeStay(request, c, fd, { room: room(c, '201'), arrival: prev });
          const s3 = await makeStay(request, c, fd, {
            room: room(c, '201'),
            arrival: D,
            ...at700(D),
          });
          const s4 = await makeStay(request, c, fd, {
            room: room(c, '103'),
            arrival: D,
            ...at700(D),
          });
          expect(occ.res.status).toBe('confirmed');
          const priorNight = async (st: Stay) => {
            const pv = await preview(request, fd, st.res.id);
            expect(pv.status, JSON.stringify(pv.body)).toBe(200);
            const e = pv.body.earlyCheckinSurcharge as {
              addsPreviousNight: boolean;
              amountVnd: number;
            };
            expect(e.addsPreviousNight, 'B9a – thêm đêm trước').toBe(true);
            expect(e.amountVnd, 'không phải phụ thu nhận sớm').toBe(
              oracleNum('BR-411-07', 'surchargeVnd'),
            );
            return pv.body.priorNight as Record<string, unknown>;
          };
          const addNight = async (st: Stay, label: string) => {
            const p = await priorNight(st);
            expect(p).toMatchObject({
              date: prev,
              available: true,
              createsChildReservation: false,
            });
            expect(p.defaultRateVnd).toBe(oracleNum('BR-411-07', 'extraNightRateVnd'));
            const r = await checkIn(request, fd, st.res.id, {
              addPriorNight: true,
              priorNightRateVnd: Number(p.defaultRateVnd),
              expectedSurchargeVnd: Number(p.defaultRateVnd),
            });
            expect(r.status, `${label}: ${JSON.stringify(r.body)}`).toBe(200);
            expect(r.body.arrivalDate, `${label}: ngày đến = D − 1`).toBe(prev);
            expect(nightRate(r.body, prev)).toBe(oracleNum('BR-411-07', 'extraNightRateVnd'));
            const f = await getFolio(request, fd, String(st.res.folioId));
            expect(liveLines(f, 'early_checkin'), `${label}: không có dòng phụ thu`).toHaveLength(
              0,
            );
            expect(
              liveLines(f, 'room').some((l) => l.serviceDate === prev),
              `${label}: đêm bán`,
            ).toBe(true);
          };
          await addNight(s1, '05:30');
          await at(request, vnTime(D, '05:59'));
          fd = await fdOf(request);
          await addNight(s2, '05:59');
          // đêm trước đã có khách → không cho nhận (gợi ý gửi hành lý – BR-417-02)
          const p3n = await priorNight(s3);
          expect(p3n.available).toBe(oracle('BR-417-02').expected.accepted);
          const r3 = await checkIn(request, fd, s3.res.id, {
            addPriorNight: true,
            priorNightRateVnd: RATE_700(),
            expectedSurchargeVnd: RATE_700(),
          });
          expectProblem(r3, 409, 'ROOM_UNAVAILABLE');
          expect((await getReservation(request, fd, s3.res.id)).body.status).toBe('confirmed');
          // 06:00 → ngày nghiệp vụ D: B9 thường, phụ thu nhận sớm theo TC-L3-012 (BR-411-06)
          await at(request, vnTime(D, String(oracle('BR-411-06').input.checkinTime)));
          fd = await fdOf(request);
          const pv4 = await preview(request, fd, s4.res.id);
          expect(
            (pv4.body.earlyCheckinSurcharge as { addsPreviousNight: boolean }).addsPreviousNight,
          ).toBe(false);
          const t6 = String(oracle('BR-411-06').input.checkinTime);
          const amt = oracleNum('BR-411-06', 'surchargeVnd');
          const pv6 = await preview(request, fd, s4.res.id, t6);
          expect((pv6.body.earlyCheckinSurcharge as { amountVnd: number }).amountVnd).toBe(amt);
          await recordPayment(request, fd, String(s4.res.folioId), {
            type: 'charge',
            method: 'cash',
            amountVnd: amt,
            note: 'Thu phu thu nhan som',
          });
          const r4 = await checkIn(request, fd, s4.res.id, {
            checkinTime: t6,
            applyEarlySurcharge: true,
            expectedSurchargeVnd: amt,
          });
          expect(r4.status, JSON.stringify(r4.body)).toBe(200);
          expect(r4.body.arrivalDate).toBe(D);
          const l4 = liveLines(
            await getFolio(request, fd, String(s4.res.folioId)),
            'early_checkin',
          );
          expect(l4.map((l) => l.amountVnd)).toEqual([amt]);
        },
      );

      test(
        'TC-L3-014 US-026/AC4 [A · TB]',
        { annotation: [story('US-026/AC4'), eps('requestFoc')] },
        async ({ request }) => {
          const time = String(oracle('BR-411-01').input.checkinTime);
          const amount = oracleNum('BR-411-01', 'surchargeVnd');
          const { D, c } = await begin(request, 'TC-L3-014', [EP3.checkIn, EP3.requestFoc], time);
          const fd = await fdOf(request);
          const st = await makeStay(request, c, fd, {
            room: room(c, '203'),
            arrival: D,
            ...at700(D),
          });
          await recordPayment(request, fd, String(st.res.folioId), {
            type: 'charge',
            method: 'cash',
            amountVnd: amount,
            note: 'Thu phu thu nhan som',
          });
          const ci = await checkIn(request, fd, st.res.id, {
            checkinTime: time,
            applyEarlySurcharge: true,
            expectedSurchargeVnd: amount,
          });
          expect(ci.status, JSON.stringify(ci.body)).toBe(200);
          const folioId = String(st.res.folioId);
          const line = liveLines(await getFolio(request, fd, folioId), 'early_checkin')[0];
          expect(line?.amountVnd).toBe(amount);
          // lễ tân muốn miễn → yêu cầu FOC (pending), dòng phụ thu giữ nguyên chờ duyệt (US-007)
          const foc = await call<Record<string, unknown>>(
            request,
            'POST',
            p3(EP3.requestFoc, fd, { folioId, lineId: line!.id }),
            {
              session: fd,
              idempotencyKey: true,
              body: {
                kind: 'foc',
                amountVnd: amount,
                reasonCode: 'service_recovery',
                note: 'Khach cho lau, xin mien phu thu',
              },
            },
          );
          expect(foc.status, JSON.stringify(foc.body)).toBe(201);
          expect(foc.body.status).toBe('pending');
          const after = liveLines(await getFolio(request, fd, folioId), 'early_checkin');
          expect(
            after.map((l) => l.amountVnd),
            'dòng phụ thu không bị sửa/xóa thẳng',
          ).toEqual([amount]);
          // "không bỏ qua": giờ nhận có phụ thu mà không quyết định ghi → 422 SURCHARGE_DECISION_REQUIRED
          // (OpenAPI 0.3.6 bảng mã lỗi, DOM S3-12, BR-414 v0.3.4)
          const st2 = await makeStay(request, c, fd, {
            room: room(c, '202'),
            arrival: D,
            ...at700(D),
          });
          const skip = await checkIn(request, fd, st2.res.id, {
            checkinTime: time,
            applyEarlySurcharge: false,
          });
          // BUG-R2-039 đã sửa (229db99) – kiểm lại 17/10, bỏ test.fail
          expect(skip.status, JSON.stringify(skip.body).slice(0, 300)).toBe(422);
          expect(JSON.stringify(skip.body)).toContain('SURCHARGE_DECISION_REQUIRED');
        },
      );

      test(
        'TC-L3-015 US-027/AC1 [U+A · Cao]',
        { annotation: [story('US-027/AC1'), eps('setLateCheckout')] },
        async ({ request }) => {
          const o = oracle('BR-413-01');
          const { D, c } = await begin(
            request,
            'TC-L3-015',
            [EP3.setLateCheckout, EP3.setParameter],
            '14:30',
            33,
          );
          const st = await longStay(request, c, D, '402', Number(o.input.leaseMonthlyRentVnd));
          const dep = st.res.departureDate;
          await at(request, vnTime(dep, '09:00'));
          const owner = await sessionOrSkip(request, 'qa.owner');
          // chính sách miễn phí dài hạn TẮT: mốc miễn phí = giờ trả chuẩn (12:00)
          const off = await setParam(request, owner, 'long_stay_free_late_until', '12:00', dep);
          expect(off.status, JSON.stringify(off.body)).toBeLessThan(300);
          try {
            const fd = await fdOf(request);
            const q = await stayAction<Record<string, unknown>>(
              request,
              fd,
              st.res.id,
              'late-checkout',
              { checkoutTime: String(o.input.checkoutTime) },
              { dryRun: true },
            );
            expect(q.status, JSON.stringify(q.body)).toBe(200);
            // cơ sở = tiền thuê tháng ÷ 30 (BR-102-01) – không phải tiền thuê tháng
            expect(q.body.surchargeVnd).toBe(oracleNum('BR-413-01', 'surchargeVnd'));
            expect(q.body.surchargeVnd).not.toBe(
              Math.round((Number(o.input.leaseMonthlyRentVnd) * Number(q.body.tierPct)) / 100),
            );
            expect(oracleNum('BR-102-01', 'longStayNightRateVnd')).toBe(
              oracleNum('BR-413-01', 'baseNightRateVnd'),
            );
          } finally {
            // tham số đã có hiệu lực hôm nay không sửa được (parameter.service) → khôi phục từ ngày mai
            const back = await setParam(
              request,
              owner,
              'long_stay_free_late_until',
              '15:00',
              addDays(dep, 1),
            );
            expect(back.status, JSON.stringify(back.body)).toBeLessThan(300);
          }
        },
      );

      test(
        'TC-L3-016 US-027/AC2 [A · TB]',
        { annotation: [story('US-027/AC2'), eps('setLateCheckout, setParameter')] },
        async ({ request }) => {
          const o = oracle('BR-413-01');
          const { D, c } = await begin(
            request,
            'TC-L3-016',
            [EP3.setLateCheckout, EP3.setParameter],
            '14:30',
            33,
          );
          const rent = Number(o.input.leaseMonthlyRentVnd);
          const a = await longStay(request, c, D, '402', rent);
          const b = await longStay(request, c, D, '401', rent);
          const dep = a.res.departureDate;
          // (b) căn 401 có khách đến cùng ngày trả
          let fd = await fdOf(request);
          await makeStay(request, c, fd, { room: room(c, '401'), arrival: dep, doc: false });
          await at(request, vnTime(dep, '09:00'));
          fd = await fdOf(request);
          const quote = async (st: Stay, t: string) => {
            const q = await stayAction<Record<string, unknown>>(
              request,
              fd,
              st.res.id,
              'late-checkout',
              { checkoutTime: t },
              { dryRun: true },
            );
            expect(q.status, JSON.stringify(q.body)).toBe(200);
            return Number(q.body.surchargeVnd);
          };
          const t = String(o.input.checkoutTime);
          // (a) chính sách miễn phí đến 15:00 bật, không có khách đến → 0
          expect(await quote(a, t)).toBe(0);
          // (b) có khách đến cùng ngày → phụ thu như BR-413-01
          expect(await quote(b, t)).toBe(oracleNum('BR-413-01', 'surchargeVnd'));
          // (c) OWN đổi mốc miễn phí 15:00 → 13:00, trả 14:00 → phụ thu (chỉ đổi tham số)
          const owner = await sessionOrSkip(request, 'qa.owner');
          const ch = await setParam(request, owner, 'long_stay_free_late_until', '13:00', dep);
          expect(ch.status, JSON.stringify(ch.body)).toBeLessThan(300);
          try {
            expect(await quote(a, '14:00')).toBe(oracleNum('BR-413-01', 'surchargeVnd'));
          } finally {
            // tham số đã có hiệu lực hôm nay không sửa được (parameter.service) → khôi phục từ ngày mai
            const back = await setParam(
              request,
              owner,
              'long_stay_free_late_until',
              '15:00',
              addDays(dep, 1),
            );
            expect(back.status, JSON.stringify(back.body)).toBeLessThan(300);
          }
        },
      );
    });

    test.describe('4.2 Giấy tờ, đối chiếu, đồng ý, khai báo', () => {
      test(
        'TC-L3-037 US-044/AC4 [A+E · Cao]',
        {
          annotation: [
            story('US-044/AC4'),
            eps('completeRegistrationReview, checkIn, listAttentionItems'),
          ],
        },
        async ({ request }) => {
          const { D, c } = await begin(
            request,
            'TC-L3-037',
            [EP3.completeRegistrationReview, EP3.checkIn, EP3.listAttentionItems],
            '14:30',
            5,
          );
          let fd = await fdOf(request);
          // khách NN, thị thực hết D+1, trả phòng D+3 (TC: hết 20/10, trả 22/10)
          const g = await namedGuest(request, fd, { fullName: 'Daniel Weber' });
          const st = await makeStay(request, c, fd, {
            room: room(c, '203'),
            arrival: D,
            nights: 3,
            adults: 1,
            guestId: g.id,
            doc: false,
          });
          const visa = addDays(D, 1);
          const add = await addDocument(
            request,
            fd,
            st.regId,
            foreignDoc('Daniel Weber', st.res.departureDate, { visaValidUntil: visa }),
          );
          expect(add.status, JSON.stringify(add.body)).toBe(201);
          // 1. đối chiếu: cảnh báo đỏ (Không đạt), không chặn (BR-613 a)
          const d = mainDoc(add.body);
          expect(checkOf(d, 'visa_valid_through_departure')).toBe('fail');
          expect(d.checks.find((x) => x.code === 'visa_valid_through_departure')?.blocking).toBe(
            false,
          );
          expect(add.body.blocksDoorCode).toBe(false);
          const pv = await preview(request, fd, st.res.id);
          expect((pv.body.warnings as Array<{ code: string }>).map((w) => w.code)).toContain(
            'visa_expires_before_departure',
          );
          // 2. nhận phòng không bị chặn
          const ci = await checkIn(request, fd, st.res.id);
          expect(ci.status, JSON.stringify(ci.body)).toBe(200);
          // 3. "Đối chiếu xong" không ghi chú → từ chối (OpenAPI: 409 REGISTRATION_INCOMPLETE hoặc 422 CHECK_NOTE_REQUIRED)
          fd = await fdOf(request);
          const cur = await regOf(request, fd, st.regId);
          const none = await call<Record<string, unknown> & { code?: string; errors?: unknown[] }>(
            request,
            'POST',
            p3(EP3.completeRegistrationReview, fd, { registrationId: st.regId }),
            { session: fd, idempotencyKey: true, ifMatch: versionTag(cur.version), body: {} },
          );
          expect([409, 422]).toContain(none.status);
          expect(JSON.stringify(none.body)).toMatch(/REGISTRATION_INCOMPLETE|CHECK_NOTE_REQUIRED/);
          expect((await regOf(request, fd, st.regId)).status).toBe('review');
          // có ghi chú xử lý → scanned
          const sc = await toScanned(request, fd, st.regId);
          expect(sc.status).toBe('scanned');
          // ngày đi khai báo đề xuất = ngày hết hạn thị thực (BR-605, BR-613-02 declareUntil)
          await stepUp(request, fd);
          const pd = await call<{
            people: Array<{ fields: Array<{ label: string; value: string }> }>;
          }>(request, 'GET', p3(EP3.getPortalData, fd, { registrationId: st.regId }), dev(fd));
          expect(pd.status, JSON.stringify(pd.body).slice(0, 300)).toBe(200);
          expect(
            pd.body.people[0]!.fields.find((f) => f.label === 'reg.field.departure_date')?.value,
          ).toBe(portalDate(visa));
          // đơn vào "Cần chú ý"
          const items = await attention(request, fd);
          test.fail(
            true,
            'BUG-R2-034: "Cần chú ý" không có mục khai báo/thị thực (registration_due/registration_overdue/visa_expiring)',
          );
          expect(
            regAttentionOf(items, st.res.id).length,
            `listAttentionItems: ${JSON.stringify(items.map((x) => x.kind))}`,
          ).toBeGreaterThan(0);
        },
      );

      test(
        'TC-L3-039 US-045/AC2 [A · Cao (S)]',
        { annotation: [story('US-045/AC2'), eps('transitionRegistration, getDocumentImage')] },
        async ({ request }) => {
          const o = oracle('BR-609-01');
          const { D, c } = await begin(
            request,
            'TC-L3-039',
            [EP3.transitionRegistration, EP3.getDocumentImage],
            '14:00',
          );
          const [confirmAt, purgeAt] = onDay(
            D,
            String(o.input.confirmedAt),
            String(o.expected.purgeAt),
          );
          const [, backstop] = onDay(
            D,
            String(o.input.confirmedAt),
            String(o.expected.purgeBackstopBy),
          );
          let fd = await fdOf(request);
          // khai báo chọn "Không" đồng ý lưu ảnh, có 2 ảnh – đã gửi cổng
          const prep = async (rm: Room, decision: 'granted' | 'refused') => {
            const st = await makeStay(request, c, fd, {
              room: rm,
              arrival: addDays(D, 1),
              adults: 1,
              doc: false,
            });
            const r = await addDocument(request, fd, st.regId, vnDoc(st.guestName), 2);
            expect(r.status, JSON.stringify(r.body)).toBe(201);
            await toScanned(request, fd, st.regId, decision);
            const s = await transitionReg(request, fd, st.regId, 'mark-sent', {
              portalReference: `E2E-039-${decision}`,
            });
            expect(s.status, JSON.stringify(s.body)).toBe(200);
            return { st, doc: mainDoc(r.body) };
          };
          const a = await prep(room(c, '203'), 'refused');
          // dữ liệu mới cho bước 3: "xóa ngay bị lỗi" – giả lập bằng quyết định đổi thành "Không" sau confirmed
          const b = await prep(room(c, '202'), 'granted');
          // 1. ⏱ confirmedAt: sent → confirmed
          await at(request, confirmAt);
          fd = await fdOf(request);
          const ca = await transitionReg(request, fd, a.st.regId, 'mark-confirmed');
          expect(ca.status, JSON.stringify(ca.body)).toBe(200);
          // 2. gọi ngay getDocumentImage → đã xóa (không chờ J16)
          await stepUp(request, fd);
          for (const id of a.doc.imageIds!) {
            expect((await getImage(request, fd, a.st.regId, a.doc.id, id, 'recheck')).status).toBe(
              404,
            );
          }
          expect(ca.body.imagesPurgeReason).toBe('no_consent');
          expectNear(String(ca.body.imagesPurgedAt), purgeAt, 'xóa lúc confirmed (BR-609-01)');
          // trường văn bản cần thiết còn
          const sens = await call<{ docNumber?: string }>(
            request,
            'GET',
            p3(EP3.getGuestDocumentSensitive, fd, {
              registrationId: a.st.regId,
              documentId: a.doc.id,
            }),
            { ...dev(fd), query: { reason: 'recheck' } },
          );
          expect(sens.status, JSON.stringify(sens.body)).toBe(200);
          expect(String(sens.body.docNumber)).toHaveLength(12);
          const purgeLog = (await c3Log(request, a.st.res.id)).filter(
            (e) => e.subjectType === 'document_image' && e.action === 'purge',
          );
          expect(purgeLog).toHaveLength(2);
          // 3. ảnh của B còn sau confirmed (đồng ý) → giả lập lệnh xóa ngay bị lỗi: quyết định thành "Không"
          const cb = await transitionReg(request, fd, b.st.regId, 'mark-confirmed');
          expect(cb.status).toBe(200);
          test.info().annotations.push({
            type: 'giả lập',
            description:
              'xóa ngay khi confirmed bị lỗi: consent_record của B đổi thành refused trực tiếp trong DB stack dùng một lần',
          });
          sqlValue(
            `UPDATE consent_record SET decision = 'refused' WHERE registration_id = '${b.st.regId}';`,
          );
          const bImg = b.doc.imageIds![0]!;
          expect((await getImage(request, fd, b.st.regId, b.doc.id, bImg, 'recheck')).status).toBe(
            200,
          );
          // ⏱ 1 phút trước hạn trên ▶ J16 → còn
          const before = new Date(new Date(backstop).getTime() - 60_000).toISOString();
          await at(request, before);
          const j1 = await runJob(request, J16);
          test
            .info()
            .annotations.push({ type: 'J16 trước hạn trên', description: JSON.stringify(j1) });
          fd = await fdOf(request);
          await stepUp(request, fd);
          expect((await getImage(request, fd, b.st.regId, b.doc.id, bImg, 'recheck')).status).toBe(
            200,
          );
          // ⏱ đúng hạn trên (confirmed + id_image_purge_max_hours) ▶ J16 → phải đã xóa
          await at(request, backstop);
          const j2 = await runJob(request, J16);
          test
            .info()
            .annotations.push({ type: 'J16 tại hạn trên', description: JSON.stringify(j2) });
          fd = await fdOf(request);
          await stepUp(request, fd);
          const late = await getImage(request, fd, b.st.regId, b.doc.id, bImg, 'recheck');
          test.fail(
            j2.stats?.skipped === true,
            'BUG-R2-036: J16 chặn 55 phút (chạy hằng giờ) – lượt tại hạn trên bị bỏ qua, ảnh người không đồng ý còn quá 24 giờ sau confirmed (BR-609-01 purgeBackstopBy)',
          );
          expect(late.status, 'sau hạn trên ảnh còn = lỗi (BR-609)').toBe(404);
        },
      );

      test(
        'TC-L3-044 US-042/AC1 [A+U · Cao (S)]',
        {
          annotation: [story('US-042/AC1'), eps('listRegistrations, listAttentionItems')],
        },
        async ({ request }) => {
          const o = oracle('BR-603-01');
          const time = String(o.input.arrivedAt).slice(11, 16);
          const { D, c } = await begin(
            request,
            'TC-L3-044',
            [EP3.listRegistrations, EP3.checkIn],
            time,
          );
          const [, foDue] = onDay(D, String(o.input.arrivedAt), String(o.expected.deadline));
          // VN đến trong ngày trước 23:00 → hạn 23:00 cùng ngày (BR-602, như BR-602-03)
          const vnDue = vnTime(D, String(oracle('BR-602-03').expected.deadline).slice(11, 16));
          const vn = await checkedIn(request, c, { room: room(c, '203'), arrival: D, adults: 1 });
          const fo = await checkedIn(request, c, {
            room: room(c, '202'),
            arrival: D,
            adults: 1,
            doc: 'foreign',
          });
          let fd = await fdOf(request);
          const rv = await regRow(request, fd, vn.res.id, 'action_needed');
          const rf = await regRow(request, fd, fo.res.id, 'action_needed');
          expectNear(rv?.deadlineAt, vnDue, 'VN – BR-602');
          expectNear(rf?.deadlineAt, foDue, 'NN – BR-603-01');
          // ⏱ đúng hạn NN: chưa quá hạn
          await at(request, foDue);
          fd = await fdOf(request);
          const r20 = await regRow(request, fd, fo.res.id, 'action_needed');
          expect(r20).toMatchObject({ isOverdue: false, deadlineLabel: 'before_deadline_today' });
          // ⏱ +1 giây: hồ sơ NN trước sent → "Đã quá hạn" (nhãn chữ deadlineLabel + cờ isOverdue)
          await at(request, new Date(new Date(foDue).getTime() + 1000).toISOString());
          fd = await fdOf(request);
          const r21 = await regRow(request, fd, fo.res.id, 'action_needed');
          expect(r21).toMatchObject({ isOverdue: true, deadlineLabel: 'overdue' });
          expect((await regRow(request, fd, vn.res.id, 'action_needed'))?.isOverdue).toBe(false);
          // ▶ J5 (nhắc/quá hạn → "Cần chú ý")
          const j5 = await runJobIfAny(request, J5);
          test.fail(
            j5 === null,
            `BUG-R2-035: job J5 ${J5} chưa đăng ký trên build (architecture 9.1, R2) – không có nhắc hạn/quá hạn khai báo`,
          );
          expect(j5, `J5 ${J5}`).not.toBeNull();
          const items = await attention(request, fd);
          expect(regAttentionOf(items, fo.res.id).map((x) => x.kind)).toContain(
            'registration_overdue',
          );
        },
      );

      test(
        'TC-L3-045 US-042/AC1 [U+A · Cao]',
        { annotation: [story('US-042/AC1'), eps('checkIn, getRegistration')] },
        async ({ request }) => {
          const ids = ['BR-602-03', 'BR-602-04', 'BR-602-01'];
          const { D, c } = await begin(
            request,
            'TC-L3-045',
            [EP3.checkIn, EP3.getRegistration],
            '20:00',
          );
          const rooms = ['203', '202', '201'];
          const stays: Array<[Stay, string]> = [];
          let fd = await fdOf(request);
          for (const [i, id] of ids.entries()) {
            const st = await makeStay(request, c, fd, {
              room: room(c, rooms[i]!),
              arrival: D,
              adults: 1,
            });
            const [arr, due] = onDay(
              D,
              String(oracle(id).input.arrivedAt),
              String(oracle(id).expected.deadline),
            );
            stays.push([st, due]);
            await at(request, arr);
            fd = await fdOf(request);
            const r = await checkIn(request, fd, st.res.id);
            expect(r.status, `${id}: ${JSON.stringify(r.body)}`).toBe(200);
          }
          for (const [i, [st, due]] of stays.entries()) {
            const reg = await regOf(request, fd, st.regId);
            expectNear(
              reg.deadlineAt,
              due,
              `${ids[i]} (nhận ${hhmm(String(oracle(ids[i]!).input.arrivedAt))})`,
            );
          }
        },
      );

      test(
        'TC-L3-046 US-042/AC1 [U+A · Cao]',
        {
          annotation: [story('US-042/AC1'), eps('checkIn, getRegistration, listAttentionItems')],
        },
        async ({ request }) => {
          const o = oracle('BR-603-02');
          const { D, c } = await begin(
            request,
            'TC-L3-046',
            [EP3.checkIn, EP3.getRegistration],
            String(o.input.arrivedAt).slice(11, 16),
          );
          const [, due] = onDay(D, String(o.input.arrivedAt), String(o.expected.deadline));
          const st = await checkedIn(request, c, {
            room: room(c, '203'),
            arrival: D,
            adults: 1,
            doc: 'foreign',
          });
          let fd = await fdOf(request);
          const reg = await regOf(request, fd, st.regId);
          expectNear(reg.deadlineAt, due, 'BR-603-02');
          // không còn chế độ earlier_of (BR-603-05 là chế độ cũ)
          const [, old] = onDay(
            D,
            String(oracle('BR-603-05').input.arrivedAt),
            String(oracle('BR-603-05').expected.deadline),
          );
          expect(Math.abs(Date.parse(String(reg.deadlineAt)) - Date.parse(old))).toBeGreaterThan(
            60_000,
          );
          // ⏱ 1 phút trước hạn: chưa quá hạn
          await at(request, new Date(Date.parse(due) - 60_000).toISOString());
          fd = await fdOf(request);
          expect(await regOf(request, fd, st.regId)).toMatchObject({
            isOverdue: false,
            deadlineLabel: 'before_deadline_today',
          });
          // ⏱ hạn + 1 giây: "Đã quá hạn"
          await at(request, new Date(Date.parse(due) + 1000).toISOString());
          fd = await fdOf(request);
          expect(await regOf(request, fd, st.regId)).toMatchObject({
            isOverdue: true,
            deadlineLabel: 'overdue',
          });
          // ▶ J5
          const j5 = await runJobIfAny(request, J5);
          test.fail(
            j5 === null,
            `BUG-R2-035: job J5 ${J5} chưa đăng ký trên build – không có nhắc/quá hạn khai báo`,
          );
          expect(j5, `J5 ${J5}`).not.toBeNull();
          const items = await attention(request, fd);
          expect(regAttentionOf(items, st.res.id).map((x) => x.kind)).toContain(
            'registration_overdue',
          );
        },
      );

      test(
        'TC-L3-047 US-042/– [U · TB]',
        { annotation: [story('US-042/–'), eps('getRegistration')] },
        async ({ request }) => {
          const { D, c } = await begin(
            request,
            'TC-L3-047',
            [EP3.checkIn, EP3.getRegistration],
            '10:00',
          );
          let fd = await fdOf(request);
          // đơn 1 NN (người đứng tên) + 1 VN
          const st = await makeStay(request, c, fd, {
            room: room(c, '203'),
            arrival: D,
            adults: 2,
            doc: 'foreign',
          });
          const v = await addDocument(
            request,
            fd,
            st.regId,
            vnDoc('Pham Thi Lan', { isMain: false }),
          );
          expect(v.status, JSON.stringify(v.body)).toBe(201);
          expect(v.body.kind).toBe('mixed');
          const r = await checkIn(request, fd, st.res.id);
          expect(r.status, JSON.stringify(r.body)).toBe(200);
          fd = await fdOf(request);
          // VN 23:00 (BR-602), NN 10:00 + N giờ (BR-603) → hạn hồ sơ = hạn sớm nhất
          const vnDue = Date.parse(
            vnTime(D, String(oracle('BR-602-03').expected.deadline).slice(11, 16)),
          );
          const foDue = Date.parse(vnTime(D, '10:00')) + foreignHours() * 3_600_000;
          const want = new Date(Math.min(vnDue, foDue)).toISOString();
          const reg = await regOf(request, fd, st.regId);
          expectNear(reg.deadlineAt, want, 'hồ sơ hỗn hợp – hạn sớm nhất');
          expectNear((await regRow(request, fd, st.res.id))?.deadlineAt, want, 'danh sách');
        },
      );

      test(
        'TC-L3-048 US-042/AC2 [A · Cao]',
        { annotation: [story('US-042/AC2'), eps('listAttentionItems')] },
        async ({ request }) => {
          const { D, c } = await begin(
            request,
            'TC-L3-048',
            [EP3.checkIn, EP3.listMyNotifications],
            '14:30',
          );
          // 2 hồ sơ chưa khai (đã nhận phòng)
          const a = await checkedIn(request, c, { room: room(c, '203'), arrival: D, adults: 1 });
          const b = await checkedIn(request, c, { room: room(c, '202'), arrival: D, adults: 1 });
          expect(a.res.status).toBe('in_house');
          expect(b.res.status).toBe('in_house');
          // ⏱ 21:59 ▶ J5 – chưa tới mốc tổng hợp (registration_digest_times 22:00, 07:00)
          await at(request, vnTime(D, '21:59'));
          const j = await runJobIfAny(request, J5);
          test.fail(
            j === null,
            `BUG-R2-035: job J5 ${J5} chưa đăng ký – không có thông báo tổng hợp hồ sơ chưa khai (BR-611) cho FD + MGR`,
          );
          expect(j, `J5 ${J5}`).not.toBeNull();
          const unread = async (u: string) => {
            const s = await sessionOrSkip(request, u);
            const n = await call<{ data: Array<{ kind: string; createdAt: string }> }>(
              request,
              'GET',
              '/v1/me/notifications',
              { session: s, query: { limit: 100 } },
            );
            expect(n.status).toBe(200);
            return n.body.data.filter((x) => x.kind === 'registration_due');
          };
          const fd0 = (await unread('qa.fd')).length;
          await at(request, vnTime(D, '22:00'));
          await runJob(request, J5);
          expect((await unread('qa.fd')).length).toBeGreaterThan(fd0);
          expect((await unread('qa.mgr')).length).toBeGreaterThan(0);
          const n22 = (await unread('qa.fd')).length;
          await runJob(request, J5);
          expect((await unread('qa.fd')).length, 'chạy lại cùng mốc không gửi trùng').toBe(n22);
          await at(request, vnTime(addDays(D, 1), '07:00'));
          await runJob(request, J5);
          expect((await unread('qa.fd')).length).toBeGreaterThan(n22);
        },
      );

      test(
        'TC-L3-049 US-042/AC3 [A · TB]',
        { annotation: [story('US-042/AC3'), eps('setParameter, getRegistration')] },
        async ({ request }) => {
          const { D, c } = await begin(
            request,
            'TC-L3-049',
            [EP3.setParameter, EP3.getRegistration, EP3.checkIn],
            '10:00',
          );
          const hours = foreignHours();
          const a = await checkedIn(request, c, {
            room: room(c, '203'),
            arrival: D,
            adults: 1,
            doc: 'foreign',
          });
          const b = await checkedIn(request, c, {
            room: room(c, '202'),
            arrival: D,
            adults: 1,
            doc: 'foreign',
          });
          let fd = await fdOf(request);
          const dueA = new Date(
            Date.parse(String(a.res.actualCheckinAt)) + hours * 3_600_000,
          ).toISOString();
          expectNear((await regOf(request, fd, a.regId)).deadlineAt, dueA, 'A trước khi đổi');
          // B đã khai (sent)
          await toScanned(request, fd, b.regId);
          const sent = await transitionReg(request, fd, b.regId, 'mark-sent', {
            portalReference: 'E2E-049-B',
          });
          expect(sent.status, JSON.stringify(sent.body)).toBe(200);
          const dueB = (await regOf(request, fd, b.regId)).deadlineAt;
          // OWN đổi registration_deadline_foreigner_hours 12 → 24 (giả lập kết luận luật sư)
          await at(request, vnTime(D, '11:00'));
          const owner = await sessionOrSkip(request, 'qa.owner');
          const ch = await setParam(request, owner, 'registration_deadline_foreigner_hours', 24, D);
          expect(ch.status, JSON.stringify(ch.body)).toBeLessThan(300);
          try {
            fd = await fdOf(request);
            const newA = new Date(
              Date.parse(String(a.res.actualCheckinAt)) + 24 * 3_600_000,
            ).toISOString();
            expectNear(
              (await regOf(request, fd, a.regId)).deadlineAt,
              newA,
              'A tính lại theo tham số mới',
            );
            expectNear(
              (await regRow(request, fd, a.res.id))?.deadlineAt,
              newA,
              'A trong danh sách',
            );
            const rb = await regOf(request, fd, b.regId);
            expect(rb.deadlineAt, 'B (đã sent) giữ nguyên').toBe(dueB);
            expect(rb.deadlineLabel).toBe('done');
          } finally {
            const back = await setParam(
              request,
              owner,
              'registration_deadline_foreigner_hours',
              hours,
              addDays(D, 1),
            );
            expect(back.status, JSON.stringify(back.body)).toBeLessThan(300);
          }
        },
      );

      test(
        'TC-L3-051 US-047/AC2 [A · TB]',
        { annotation: [story('US-047/AC2'), eps('extendStay, listRegistrations')] },
        async ({ request }) => {
          const { D, c } = await begin(
            request,
            'TC-L3-051',
            [EP3.extendStay, EP3.listRegistrations],
            '14:30',
          );
          const st = await checkedIn(request, c, {
            room: room(c, '203'),
            arrival: D,
            adults: 1,
            kind: 'booking',
            doc: 'foreign',
          });
          const fd = await fdOf(request);
          await toScanned(request, fd, st.regId);
          await toConfirmed(request, fd, st.regId);
          const ex = await stayAction<{
            reservation: Record<string, unknown>;
            childReservation?: { id: string };
          }>(request, fd, st.res.id, 'extend', { nights: 1 });
          expect(ex.status, JSON.stringify(ex.body)).toBe(200);
          const child = ex.body.childReservation;
          expect(child, 'đơn con kênh Trực tiếp (BR-422)').toBeTruthy();
          // đơn con không có bản ghi khai báo mới
          expect(await regRow(request, fd, child!.id)).toBeUndefined();
          // việc "Cập nhật ngày đi": khai báo gốc → needs_update, nằm trong danh sách cần cập nhật
          const reg = await regOf(request, fd, st.regId);
          expect(reg.status).toBe('needs_update');
          expect(reg.deadlineLabel).toBe('needs_update');
          expect((await regRow(request, fd, st.res.id, 'needs_update'))?.id).toBe(st.regId);
        },
      );

      test(
        'TC-L3-053 US-050/AC1 [A · Cao]',
        {
          annotation: [
            story('US-050/AC1'),
            eps('extendStay, earlyDeparture, checkOut, transitionRegistration'),
          ],
        },
        async ({ request }) => {
          const { D, c } = await begin(
            request,
            'TC-L3-053',
            [EP3.extendStay, EP3.earlyDeparture, EP3.checkOut, EP3.transitionRegistration],
            '14:30',
            5,
          );
          const s1 = await checkedIn(request, c, {
            room: room(c, '203'),
            arrival: D,
            adults: 1,
            doc: 'foreign',
          });
          const s2 = await checkedIn(request, c, {
            room: room(c, '202'),
            arrival: D,
            nights: 2,
            adults: 1,
            doc: 'foreign',
          });
          const s3 = await checkedIn(request, c, {
            room: room(c, '201'),
            arrival: D,
            adults: 1,
            doc: 'foreign',
          });
          let fd = await fdOf(request);
          for (const s of [s1, s2, s3]) {
            await toScanned(request, fd, s.regId);
            await toConfirmed(request, fd, s.regId);
          }
          // gia hạn đơn 1
          const e1 = await stayAction(request, fd, s1.res.id, 'extend', { nights: 1 });
          expect(e1.status, JSON.stringify(e1.body)).toBe(200);
          // trả sớm đơn 2 (đi D+1 thay vì D+2)
          const e2 = await stayAction(request, fd, s2.res.id, 'early-departure', {
            newDepartureDate: addDays(D, 1),
            noticeGivenAt: vnTime(D, '14:30'),
          });
          expect(e2.status, JSON.stringify(e2.body)).toBe(200);
          // trả phòng đơn 3 (ngày đi D+1)
          await at(request, vnTime(addDays(D, 1), '11:00'));
          fd = await fdOf(request);
          const co = await checkOutStay(request, fd, s3.res.id, '11:00');
          expect(co.status, JSON.stringify(co.body).slice(0, 400)).toBe(200);
          const deps: Array<[Stay, string]> = [
            [s1, addDays(D, 2)],
            [s2, addDays(D, 1)],
            [s3, addDays(D, 1)],
          ];
          for (const [s] of deps) {
            const reg = await regOf(request, fd, s.regId);
            expect(reg.status, s.res.code).toBe('needs_update');
            expect(reg.deadlineLabel).toBe('needs_update');
            expect(
              (await regRow(request, fd, s.res.id, 'needs_update'))?.id,
              'việc "Cập nhật ngày đi"',
            ).toBe(s.regId);
          }
          // nhập ngày đi thực tế → updated
          for (const [s, dep] of deps) {
            const u = await transitionReg(request, fd, s.regId, 'mark-updated', {
              actualDepartureDate: dep,
            });
            expect(u.status, JSON.stringify(u.body)).toBe(200);
            expect(u.body.status).toBe('updated');
            expect(await regRow(request, fd, s.res.id, 'needs_update')).toBeUndefined();
          }
        },
      );

      test(
        'TC-L3-054 US-050/AC2 [A+E · Cao]',
        {
          annotation: [story('US-050/AC2'), eps('extendStay, getRegistration, listAttentionItems')],
        },
        async ({ request }) => {
          const o = oracle('BR-605-02');
          const remindDays = Math.round(
            (Date.parse(String(o.input.visaExpiry)) - Date.parse(String(o.expected.remindFrom))) /
              86_400_000,
          );
          const { D, c } = await begin(
            request,
            'TC-L3-054',
            [EP3.extendStay, EP3.getRegistration, EP3.getPortalData],
            '14:30',
            9,
          );
          let fd = await fdOf(request);
          // khách NN ngắn ngày, thị thực đến D+3; đơn D → D+2
          const visa = addDays(D, 3);
          const g = await namedGuest(request, fd, { fullName: 'Daniel Weber' });
          const st = await makeStay(request, c, fd, {
            room: room(c, '203'),
            arrival: D,
            nights: 2,
            adults: 1,
            guestId: g.id,
            doc: false,
          });
          const add = await addDocument(
            request,
            fd,
            st.regId,
            foreignDoc('Daniel Weber', st.res.departureDate, { visaValidUntil: visa }),
          );
          expect(add.status, JSON.stringify(add.body)).toBe(201);
          const ci = await checkIn(request, fd, st.res.id);
          expect(ci.status, JSON.stringify(ci.body)).toBe(200);
          fd = await fdOf(request);
          await toScanned(request, fd, st.regId);
          // gia hạn vượt hạn thị thực kèm lý do → lưu được; ngày đi khai báo không vượt hạn thị thực
          const e1 = await stayAction(request, fd, st.res.id, 'extend', {
            nights: 2,
            visaWarningAckReason: 'Khach dang lam thu tuc gia han thi thuc',
          });
          expect(e1.status, JSON.stringify(e1.body)).toBe(200);
          await stepUp(request, fd);
          const pd = await call<{
            people: Array<{ fields: Array<{ label: string; value: string }> }>;
          }>(request, 'GET', p3(EP3.getPortalData, fd, { registrationId: st.regId }), dev(fd));
          expect(pd.status, JSON.stringify(pd.body).slice(0, 300)).toBe(200);
          expect(
            pd.body.people[0]!.fields.find((f) => f.label === 'reg.field.departure_date')?.value,
            'declareUntil = hạn thị thực (BR-605-02)',
          ).toBe(portalDate(visa));
          expect(remindDays).toBeGreaterThan(0);
          // gia hạn thêm mà không nhập lý do → chặn mềm 422 VISA_EXPIRES_BEFORE_DEPARTURE (OpenAPI E04-01)
          const e2 = await stayAction(request, fd, st.res.id, 'extend', { nights: 1 });
          test.fail(
            true,
            'BUG-R2-037: extendStay không chặn mềm khi ngày đi mới vượt hạn thị thực (thiếu 422 VISA_EXPIRES_BEFORE_DEPARTURE); kèm BUG-R2-034 (không có nhắc visa_expiring trong "Cần chú ý")',
          );
          expect(e2.status, JSON.stringify(e2.body).slice(0, 300)).toBe(422);
          expect(JSON.stringify(e2.body)).toContain('VISA_EXPIRES_BEFORE_DEPARTURE');
          const items = await attention(request, fd);
          const visaItem = items.find(
            (x) => x.kind === 'visa_expiring' && (x.reservationIds ?? []).includes(st.res.id),
          );
          expect(visaItem, `nhắc gia hạn thị thực từ hạn − ${remindDays} ngày`).toBeTruthy();
        },
      );

      test(
        'TC-L3-056 US-022/AC4 [A+E · Cao]',
        { annotation: [story('US-022/AC4'), eps('addPartyMember, getFolio, listHkTasks')] },
        async ({ request }) => {
          const o = oracle('BR-812-09');
          const { D, c } = await begin(
            request,
            'TC-L3-056',
            [EP3.addPartyMember, EP3.getFolio],
            '14:30',
            5,
          );
          // đơn Trực tiếp 302 in_house D → D+3, 3 người lớn (đủ định mức 3)
          const st = await checkedIn(request, c, {
            room: room(c, '302'),
            arrival: D,
            nights: 3,
            adults: 3,
          });
          // đơn Booking căn khác, 2 người lớn
          const ota = await checkedIn(request, c, {
            room: room(c, '203'),
            arrival: D,
            nights: 3,
            adults: 2,
            kind: 'booking',
          });
          const D1 = addDays(D, 1);
          const [confirmAt, kitDue] = onDay(
            D1,
            String(o.input.midStayConfirmedAt),
            String(o.expected.dueAt),
          );
          await at(request, confirmAt);
          const fd = await fdOf(request);
          const addMember = async (resId: string, extra: Record<string, unknown> = {}) => {
            const g = await namedGuest(request, fd);
            return call<
              Record<string, unknown> & { code?: string; occupancyChange?: Record<string, unknown> }
            >(request, 'POST', p3(EP3.addPartyMember, fd, { reservationId: resId }), {
              session: fd,
              idempotencyKey: !extra.dryRun,
              body: {
                role: 'companion',
                guestId: g.id,
                relationship: 'friend',
                effectiveFrom: D1,
                ...extra,
              },
            });
          };
          // người đã khai báo trong đơn (2 người đi cùng – chưa đổi số khách)
          for (let i = 0; i < 2; i++) {
            const r = await addMember(st.res.id);
            expect(r.status, JSON.stringify(r.body)).toBe(201);
            expect(r.body.occupancyChange ?? null).toBeNull();
          }
          // (a) người lớn thứ 4 từ đêm D+1: đề xuất 150.000 × 2 đêm (BR-110 – 302 định mức 3)
          const perNight =
            oracleNum('BR-110-06', 'extraPersonFeeVnd') / Number(oracle('BR-110-06').input.nights);
          const want = perNight * 2;
          const g4 = await namedGuest(request, fd);
          const body4 = {
            role: 'companion',
            guestId: g4.id,
            relationship: 'friend',
            effectiveFrom: D1,
          };
          const dry = await call<{ occupancyChange?: Record<string, unknown> }>(
            request,
            'POST',
            p3(EP3.addPartyMember, fd, { reservationId: st.res.id }),
            { session: fd, body: { ...body4, dryRun: true } },
          );
          // dryRun không ghi gì → 200 [GIẢ ĐỊNH QA: OpenAPI chỉ ghi 201 cho lần thêm thật]
          expect(dry.status, JSON.stringify(dry.body)).toBe(200);
          expect(dry.body.occupancyChange).toMatchObject({
            surchargeVnd: want,
            nights: 2,
            surchargeApplied: false,
          });
          const folioId = String(st.res.folioId);
          expect(
            liveLines(await getFolio(request, fd, folioId), 'extra_person'),
            'chưa ghi trước khi xác nhận',
          ).toHaveLength(0);
          const ok = await call<{ occupancyChange?: Record<string, unknown> }>(
            request,
            'POST',
            p3(EP3.addPartyMember, fd, { reservationId: st.res.id }),
            {
              session: fd,
              idempotencyKey: true,
              body: { ...body4, applyExtraPersonSurcharge: true, expectedSurchargeVnd: want },
            },
          );
          expect(ok.status, JSON.stringify(ok.body)).toBe(201);
          expect(ok.body.occupancyChange).toMatchObject({
            surchargeApplied: true,
            extraGuestKitTaskCreated: true,
          });
          const extra = liveLines(await getFolio(request, fd, folioId), 'extra_person');
          expect(extra.reduce((s, l) => s + l.amountVnd, 0)).toBe(want);
          SPRINT4('việc bộ đồ dùng thêm (BR-812-09)');
          const due = sqlValue(
            `SELECT to_char(due_at AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD"T"HH24:MI') FROM hk_task WHERE reservation_id = '${st.res.id}' AND type IN ('extra_guest_kit_prepare','extra_guest_kit_transfer') ORDER BY created_at DESC LIMIT 1;`,
          );
          expect(due).toBe(kitDue.slice(0, 16));
          // (b) người thứ 5 – vượt sức chứa 4
          const r5 = await addMember(st.res.id, { applyExtraPersonSurcharge: true });
          expectProblem(r5 as never, 422, 'CAPACITY_EXCEEDED');
          // (c) đơn Booking 2 NL: thêm người trong số khách của đơn OTA → chỉ cập nhật người/số khách, không phụ thu.
          // EP03-05 4.7 (BR-110): đơn OTA chỉ phụ thu khi số người thực tế VƯỢT số khách trên đơn OTA.
          const r1 = await addMember(ota.res.id);
          expect(r1.status, JSON.stringify(r1.body)).toBe(201);
          expect(r1.body.occupancyChange ?? null).toBeNull();
          expect((await getReservation(request, fd, ota.res.id)).body.adults).toBe(2);
          expect(
            liveLines(await getFolio(request, fd, String(ota.res.folioId)), 'extra_person'),
          ).toHaveLength(0);
          const rc = await addMember(ota.res.id, { dryRun: true });
          expect(rc.status, JSON.stringify(rc.body)).toBe(200);
          expect(
            Number(rc.body.occupancyChange?.surchargeVnd ?? 0),
            'người thứ 3 vượt số khách OTA → phụ thu từ đêm effectiveFrom (203 định mức 2)',
          ).toBe(perNight * 2);
        },
      );
    });

    test.describe('4.3 Mã cửa, xóa ảnh giấy tờ theo hạn', () => {
      test(
        'TC-L3-070 US-049/AC1 [A · Cao (S)]',
        { annotation: [story('US-049/AC1'), eps('getDocumentImage')] },
        async ({ request }) => {
          const { D, c } = await begin(
            request,
            'TC-L3-070',
            [EP3.getDocumentImage, EP3.checkOut],
            '14:30',
            33,
          );
          let fd = await fdOf(request);
          const prep = async (rm: Room) => {
            const st = await makeStay(request, c, fd, {
              room: rm,
              arrival: D,
              adults: 1,
              doc: false,
            });
            const r = await addDocument(request, fd, st.regId, vnDoc(st.guestName), 1);
            expect(r.status, JSON.stringify(r.body)).toBe(201);
            const ci = await checkIn(request, fd, st.res.id);
            expect(ci.status, JSON.stringify(ci.body)).toBe(200);
            await toScanned(request, fd, st.regId, 'granted');
            await toConfirmed(request, fd, st.regId);
            return { st, doc: mainDoc(r.body) };
          };
          const a = await prep(room(c, '203'));
          const b = await prep(room(c, '202'));
          const out = addDays(D, 1);
          // (a) trả phòng 10:30, (b) trả phòng 23:59 cùng ngày (giờ khai báo 12:00 – không phụ thu)
          await at(request, vnTime(out, '10:30'));
          fd = await fdOf(request);
          expect((await checkOutStay(request, fd, a.st.res.id, '10:30')).status).toBe(200);
          await at(request, vnTime(out, '23:59'));
          fd = await fdOf(request);
          // giờ nhập sớm hơn giờ thao tác quá manual_time_tolerance_minutes → bắt buộc ghi chú (0.3.6 bổ sung 2, E03-07)
          const outB = await checkOutStay(request, fd, b.st.res.id, '12:00', {
            checkoutTimeNote: 'E2E: khách trả 12:00, lễ tân ghi lúc 23:59',
          });
          expect(outB.status, JSON.stringify(outB.body)).toBe(200);
          const days = 30; // id_image_retention_days_after_checkout (DS-E) – BR-610
          const img = async (x: typeof a) => {
            fd = await fdOf(request);
            await stepUp(request, fd);
            return (
              await getImage(request, fd, x.st.regId, x.doc.id, x.doc.imageIds![0]!, 'recheck')
            ).status;
          };
          const regA = await regOf(request, fd, a.st.regId);
          expectNear(
            regA.imageRetentionUntil as string,
            new Date(Date.parse(vnTime(out, '10:30')) + days * 86_400_000).toISOString(),
            'hạn lưu ảnh (a)',
          );
          // ⏱ ngày thứ 29 sau ngày trả, 03:00 ▶ J16 → còn cả hai
          await at(request, vnTime(addDays(out, days - 1), '03:00'));
          await runJob(request, J16);
          expect(await img(a)).toBe(200);
          expect(await img(b)).toBe(200);
          // ⏱ ngày trả + 30, 03:00 ▶ J16 – EP06 6.1: hạn = thời điểm trả phòng + 30 ngày (giả định QA "00:00 ngày
          // +30" của TC chờ DOM BA-DOM-07 – xem báo cáo) → chưa tới hạn của (a) 10:30 và (b) 23:59
          await at(request, vnTime(addDays(out, days), '03:00'));
          await runJob(request, J16);
          expect(await img(a)).toBe(200);
          expect(await img(b)).toBe(200);
          // ⏱ ngày trả + 30, 10:31 ▶ J16 → (a) bị xóa, (b) còn
          await at(request, vnTime(addDays(out, days), '10:31'));
          await runJob(request, J16);
          expect(await img(a)).toBe(404);
          expect(await img(b)).toBe(200);
          // ⏱ ngày trả + 31, 00:00 ▶ J16 → (b) bị xóa
          await at(request, vnTime(addDays(out, days + 1), '00:00'));
          await runJob(request, J16);
          expect(await img(b)).toBe(404);
          // dữ liệu khai báo dạng chữ còn; nhật ký xóa (system, retention); retention_run ghi lần xóa
          fd = await fdOf(request);
          for (const x of [a, b]) {
            const reg = await regOf(request, fd, x.st.regId);
            expect(reg.imagesPurgeReason).toBe('retention');
            expect(mainDoc(reg).imageIds ?? []).toHaveLength(0);
            expect(mainDoc(reg).docNumberLast4).toHaveLength(4);
            const log = (await c3Log(request, x.st.res.id)).filter((e) => e.action === 'purge');
            expect(log, JSON.stringify(log)).toHaveLength(1);
            expect(log[0]).toMatchObject({
              actorType: 'system',
              reasonCode: 'retention',
              subjectType: 'document_image',
            });
          }
          expect(
            Number(
              sqlValue(
                `SELECT count(*) FROM retention_run WHERE policy_key = 'T02' AND items_count > 0;`,
              ),
            ),
          ).toBeGreaterThanOrEqual(2);
        },
      );
    });
  },
);

/** Đơn dài hạn nhập tay (AC5a – HĐ thật R3) 30 đêm, đã nhận phòng lúc này. */
async function longStay(
  request: APIRequestContext,
  c: S2Context,
  D: string,
  roomNo: string,
  monthlyRentVnd: number,
): Promise<Stay> {
  return checkedIn(request, c, {
    room: room(c, roomNo),
    arrival: D,
    nights: 30,
    adults: 2,
    extra: {
      manualLongStay: {
        monthlyRentVnd,
        externalContractRef: `HD-E2E-${roomNo}`,
        depositHeldVnd: monthlyRentVnd,
      },
    },
  });
}
