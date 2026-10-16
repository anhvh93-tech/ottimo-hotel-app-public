// Project "clock" – L4 (EP04 lưu trú, EP05 trả phòng 3 bước + bill, EP15 thu tiền/VietQR) – các ca cần đơn in_house,
// trả phòng hoặc mốc giờ: gia hạn, trả muộn, nhắc trả phòng, trả sớm, phát sinh trên đơn đang ở, minibar, trả phòng
// + bill, VietQR đã cấu hình (tài khoản nhận THỬ hiệu lực từ NGÀY ẢO) + J24 payment.expire, sau trả phòng.
// Mỗi ca một ngày ảo riêng (support/s3.ts virtualDay), thiết bị được cấp ảo, buồng sạch (cleanRooms – stack dùng một lần).
// TC: product/tests/test-cases/r1-main-flows.md mục 5 (L4). Oracle: fixtures/br-examples.json. Tham số không có trong
// oracle đọc từ seed DS-E (support/s3-stay.ts dsParam) – không gõ cứng.
// Phần chạy đồng hồ thật (không nhận phòng): e2e/api/stay-checkout.s3.api.spec.ts.
import { expect, test, type APIRequestContext } from '@playwright/test';
import {
  call,
  expectProblem,
  isAvailable,
  needSeedPassword,
  propertyIdOf,
  requireEndpoints,
  stackToday,
  versionTag,
  type StaffSession,
} from '../support/api.js';
import { needClock, resetClock, runJob, runJobIfAny } from '../support/clock.js';
import {
  EP,
  action,
  addDays,
  cleanupTracked,
  createReservation,
  fieldCodes,
  getReservation,
  isRoomFree,
  makeHold,
  newGuest,
  nightsOf,
  oracle,
  oracleNum,
  reservationBody,
  room,
  track,
  vnTime,
  weekday,
  withDeposit,
  type ProblemFields,
  type Reservation,
  type S2Context,
} from '../support/s2.js';
import {
  CAN_CLEAN_ROOMS,
  EP3,
  addLine,
  approve,
  dev,
  getFolio,
  getRegistration,
  inHouse,
  liveLines,
  p3,
  payBalance,
  recordPayment,
  stackSql,
  type Folio,
  type Payment,
  type Registration,
  type Stay,
  type StayInput,
} from '../support/s3.js';
import {
  adjustLine,
  approvalsOf,
  at,
  checkOut,
  checkoutSummary,
  crc16,
  dsParam,
  emv,
  ensureReceivingAccount,
  fresh,
  lateCheckout,
  minibarCheck,
  minibarItem,
  minibarStandard,
  setParam,
  TEST_RECEIVING_ACCOUNT,
  upload,
  vday,
  type Approval,
} from '../support/s3-stay.js';

// Mỗi ca chạy trên ngày ảo riêng, độc lập: KHÔNG dùng mode 'serial' (một ca đỏ sẽ bỏ qua mọi ca sau và CI chạy
// lại cả file). Thứ tự tuần tự đã do project clock bảo đảm (workers 1, fullyParallel false).
test.describe.configure({ mode: 'default' });

let realToday = '';
test.beforeAll(async ({ request }) => {
  realToday = await stackToday(request);
});
test.afterEach(async ({ request }) => cleanupTracked(request));
test.afterAll(async ({ request }) => resetClock(request));

// ───────────────────────── helpers của file ─────────────────────────

/** Mọi đêm của [arrival, arrival + nights) giá `rate` (nhập tay, kênh Trực tiếp – trong sàn–trần BR-105). */
function rates(arrival: string, nights: number, rate: number): Record<string, unknown> {
  return {
    nightlyRates: nightsOf(arrival, addDays(arrival, nights)).map((date) => ({
      date,
      amountVnd: rate,
    })),
  };
}

/** Đơn in_house nhận phòng NGAY (đồng hồ đang ở ngày đến). */
async function stay(
  request: APIRequestContext,
  c: S2Context,
  fd: StaffSession,
  roomNo: string,
  arrival: string,
  nights: number,
  o: Partial<StayInput> & { rate?: number } = {},
): Promise<Stay> {
  const { rate, ...rest } = o;
  return inHouse(request, c, fd, {
    room: room(c, roomNo),
    arrival,
    nights,
    ...rest,
    ...(rate !== undefined
      ? { extra: { ...(rest.extra ?? {}), ...rates(arrival, nights, rate) } }
      : {}),
  });
}

/** Đơn confirmed khác chiếm căn (đến `arrival`, `nights` đêm) – khách đến cùng ngày / chặn đêm. */
async function blockRoom(
  request: APIRequestContext,
  c: S2Context,
  s: StaffSession,
  roomNo: string,
  arrival: string,
  nights = 1,
  extra: Record<string, unknown> = {},
): Promise<Reservation> {
  const r = await createReservation(
    request,
    s,
    reservationBody(c, {
      room: room(c, roomNo),
      arrival,
      departure: addDays(arrival, nights),
      guestId: await newGuest(request, s),
      extra,
    }),
  );
  expect(r.status, `createReservation ${roomNo} ${arrival}: ${JSON.stringify(r.body)}`).toBe(201);
  track('reservation', r.body.id);
  return r.body;
}

async function extensionOptions(
  request: APIRequestContext,
  s: StaffSession,
  reservationId: string,
) {
  return call<{
    maxNights: number;
    exceedsShortStayLimit?: boolean;
    createsChildReservation?: boolean;
    channelFeeSavingsVnd?: number;
    repricing?: Array<{ nights: number; repricedTotalVnd: number; deltaVnd?: number }>;
    nights: Array<{
      date: string;
      available: boolean;
      defaultRateVnd?: number;
      floorVnd?: number;
      ceilingVnd?: number;
    }>;
  }>(request, 'GET', p3(EP3.getExtensionOptions, s, { reservationId }), { session: s });
}

async function extend(
  request: APIRequestContext,
  s: StaffSession,
  reservationId: string,
  body: Record<string, unknown>,
) {
  const cur = await getReservation(request, s, reservationId);
  return call<
    {
      reservation: Reservation & ProblemFields;
      childReservation?: Record<string, unknown> & { id: string; channelCode?: string };
    } & ProblemFields
  >(request, 'POST', p3(EP3.extendStay, s, { reservationId }), {
    session: s,
    idempotencyKey: true,
    ifMatch: versionTag(cur.body.version),
    body,
  });
}

async function reminders(request: APIRequestContext, s: StaffSession, reservationId: string) {
  const r = await call<{
    state: string;
    data: Array<{
      at: string;
      channel: string;
      replyType?: string;
      confirmedTime?: string;
      note?: string;
      recordedBy?: string;
    }>;
  }>(request, 'GET', p3(EP3.listCheckoutReminders, s, { reservationId }), { session: s });
  expect(r.status, JSON.stringify(r.body)).toBe(200);
  return r.body;
}

/** Folio line sum of a category (live lines). */
function sumOf(f: Folio, category: string): number {
  return liveLines(f, category).reduce((a, l) => a + l.amountVnd, 0);
}

/** Phụ thu theo bậc (BR-412/411): pct × giá đêm, làm tròn đơn vị phí (rounding.fee). */
function pctOf(base: number, pct: number): number {
  const unit = dsParam<number>('rounding.fee');
  return Math.round((base * pct) / 100 / unit) * unit;
}

/** Khai báo lưu trú → confirmed (K5 complete-review → K6 mark-sent → K7 mark-confirmed), thiết bị được cấp. */
async function confirmRegistration(
  request: APIRequestContext,
  s: StaffSession,
  regId: string,
): Promise<Registration> {
  for (let i = 0; i < 6; i++) {
    const reg = (await getRegistration(request, s, regId)).body;
    if (reg.status === 'confirmed') return reg;
    const act = reg.allowedActions.find((a) =>
      ['complete-review', 'mark-sent', 'mark-confirmed'].includes(a.action),
    );
    expect(act, `khai báo ${reg.status}: không có thao tác tiếp`).toBeTruthy();
    const path =
      act!.action === 'complete-review'
        ? p3(EP3.completeRegistrationReview, s, { registrationId: regId })
        : p3(EP3.transitionRegistration, s, { registrationId: regId, transition: act!.action });
    let body: Record<string, unknown> = {};
    if (act!.action === 'mark-sent') body = { portalReference: `E2E-${Date.now()}` };
    if (act!.action === 'complete-review') {
      const notes = reg.documents.flatMap((d) =>
        d.checks
          .filter((ch) => ch.result !== 'pass')
          .map((ch) => ({
            documentId: d.id,
            checkCode: ch.code,
            note: 'E2E: da kiem tra truc tiep',
          })),
      );
      if (notes.length) body = { warningNotes: notes };
    }
    const r = await call(request, 'POST', path, {
      ...dev(s),
      idempotencyKey: true,
      ifMatch: versionTag(reg.version),
      body,
    });
    expect(r.status, `${act!.action}: ${JSON.stringify(r.body)}`).toBe(200);
  }
  const reg = (await getRegistration(request, s, regId)).body;
  expect(reg.status).toBe('confirmed');
  return reg;
}

/** Số lệnh outbox đồng bộ tồn phòng của một topic sau mốc `since` (stack dùng một lần – psql). */
function outboxCount(topicLike: string, since: string): number {
  if (!CAN_CLEAN_ROOMS) return -1;
  return Number(
    stackSql(
      `SELECT count(*) FROM outbox_message WHERE (topic LIKE '${topicLike}' OR payload::text LIKE '%${topicLike}%')
          AND created_at >= '${since}'::timestamptz;`,
    ).trim(),
  );
}

/** Trạng thái buồng lưu ở SM-03 (room_status) – đọc thẳng DB (listRoomStatuses là Sprint 4). */
function storedRoomStatus(c: S2Context, roomNo: string): string | null {
  if (!CAN_CLEAN_ROOMS) return null;
  const out = stackSql(
    `SELECT status FROM room_status WHERE room_id = '${room(c, roomNo).id}';`,
  ).trim();
  return out || null;
}

function note(text: string): void {
  test.info().annotations.push({ type: 'note', description: text });
}

test.describe(
  'L4 – Lưu trú, trả phòng 3 bước, bill, VietQR, thu tiền (EP04, EP05, EP15 – Sprint 3) – MutableClock',
  { tag: ['@clock', '@sprint3'] },
  () => {
    test.beforeEach(() => needSeedPassword());

    test.describe('5.1 Gia hạn, trả muộn, nhắc trả phòng, phát sinh', () => {
      test(
        'TC-L4-001 US-028/AC1 [A+E · Cao]',
        {
          annotation: [
            { type: 'story', description: 'US-028/AC1' },
            { type: 'endpoints', description: 'getExtensionOptions' },
          ],
        },
        async ({ request }) => {
          // Tiền điều kiện: DS-E; đơn Trực tiếp 201 in_house 13→16/10; 201 trống 16, 17, 18/10, đêm 19/10 đã có
          //   đơn
          // Bước: Mở gia hạn; thử chọn 4 đêm; (dữ liệu mới, 201 trống 10 đêm) thử 8 đêm
          // Kỳ vọng: Chọn tối đa 3 đêm, mỗi đêm ghi "Trống"; 4 đêm → không chọn được (đêm 19/10 kín); 8 đêm →
          //   vượt giới hạn 7 đêm BR-421, hướng sang báo giá dài hạn
          // Quy tắc: BR-421, BR-108
          needClock('TC-L4-001');
          await requireEndpoints(request, 'TC-L4-001', [EP3.getExtensionOptions, EP3.extendStay]);
          const { D, c } = await vday(request, realToday, 14);
          const fd = await fresh(request, 'qa.fd');
          // 201: ở D → D+3 (3 đêm như 13→16), trống D+3..D+5, đêm D+6 đã có đơn
          const a = await stay(request, c, fd, '201', D, 3);
          await blockRoom(request, c, fd, '201', addDays(D, 6));
          const o = await extensionOptions(request, fd, a.res.id);
          expect(o.status, JSON.stringify(o.body)).toBe(200);
          expect(o.body.maxNights).toBe(3);
          for (let i = 0; i < 3; i++) {
            expect(o.body.nights[i]).toMatchObject({ date: addDays(D, 3 + i), available: true });
          }
          expect(o.body.nights[3]).toMatchObject({ date: addDays(D, 6), available: false });
          // 4 đêm → không được (đêm D+6 kín – kiểm trùng ở server)
          const four = await extend(request, fd, a.res.id, { nights: 4 });
          expectProblem(four, 409, 'ROOM_UNAVAILABLE');
          expect((await getReservation(request, fd, a.res.id)).body.departureDate).toBe(
            addDays(D, 3),
          );
          // dữ liệu mới: 202 trống ≥ 10 đêm sau ngày đi → tối đa extension_max_nights, 8 đêm vượt giới hạn
          const max = dsParam<number>('extension_max_nights');
          const b = await stay(request, c, fd, '202', D, 1);
          const o2 = await extensionOptions(request, fd, b.res.id);
          expect(o2.status).toBe(200);
          expect(o2.body.maxNights).toBe(max);
          expect(o2.body.exceedsShortStayLimit, 'hướng sang báo giá dài hạn (BR-108)').toBe(true);
          const eight = await extend(request, fd, b.res.id, { nights: max + 1 });
          expect(eight.status, JSON.stringify(eight.body)).toBe(422);
          expect(fieldCodes(eight.body)).toContain('nights:EXTENSION_LIMIT_EXCEEDED');
        },
      );
      test(
        'TC-L4-002 US-028/AC2 [A+U · Cao]',
        {
          annotation: [
            { type: 'story', description: 'US-028/AC2' },
            { type: 'endpoints', description: 'getExtensionOptions, extendStay' },
          ],
        },
        async ({ request }) => {
          // Tiền điều kiện: Đơn Trực tiếp 201 giá 700.000; (dữ liệu mới) đơn Trực tiếp có đêm gia hạn rơi vào
          //   24/12
          // Bước: Gia hạn 2 đêm ngày thường; gia hạn qua 24/12
          // Kỳ vọng: 2 đêm = 1.400.000 (giữ giá đơn – ví dụ BR-421); đêm 24/12 lấy giá ngày đặc biệt của lịch giá
          //   kênh Trực tiếp
          // Quy tắc: BR-421, BR-104, SM-01 B13
          needClock('TC-L4-002');
          await requireEndpoints(request, 'TC-L4-002', [
            EP3.getExtensionOptions,
            EP3.extendStay,
            EP3.setParameter,
          ]);
          const { D, c } = await vday(request, realToday, 6);
          const fd = await fresh(request, 'qa.fd');
          const o421 = oracle('BR-421-01');
          const rate = Number(o421.input.nightRateVnd);
          const extra = Number(o421.input.extraNights);
          // (a) 201 giá đơn 700.000 – DOM S3-6 (17/10): giá mặc định đêm thêm = lịch Trực tiếp, lễ tân giữ giá đơn
          //     bằng cách nhập giá đơn (trong sàn–trần BR-105)
          const a = await stay(request, c, fd, '201', D, 1, { rate });
          const o = await extensionOptions(request, fd, a.res.id);
          expect(o.status).toBe(200);
          expect(o.body.nights[0]!.floorVnd!).toBeLessThanOrEqual(rate);
          expect(o.body.nights[0]!.ceilingVnd!).toBeGreaterThanOrEqual(rate);
          const before = await getFolio(request, fd, a.res.folioId!);
          const r = await extend(request, fd, a.res.id, {
            nights: extra,
            nightlyRates: nightsOf(addDays(D, 1), addDays(D, 1 + extra)).map((date) => ({
              date,
              amountVnd: rate,
            })),
          });
          expect(r.status, JSON.stringify(r.body)).toBe(200);
          expect(r.body.reservation.departureDate).toBe(addDays(D, 1 + extra));
          const after = await getFolio(request, fd, a.res.folioId!);
          expect(sumOf(after, 'room') - sumOf(before, 'room')).toBe(
            oracleNum('BR-421-01', 'extensionVnd'),
          );
          // (b) đêm thêm rơi vào ngày đặc biệt → giá ngày đặc biệt của lịch Trực tiếp (BR-104): ngày 24/12 của
          //     oracle được thay bằng một ngày đặc biệt riêng của ngày ảo (special_dates hiệu lực D…D+1, trả lại D+2)
          const special = addDays(D, 1);
          const orig = dsParam<Array<Record<string, unknown>>>('special_dates');
          const set = await setParam(
            request,
            'special_dates',
            [...orig, { name: 'E2E ngay dac biet', from: special, to: addDays(special, 1) }],
            D,
          );
          expect(set.status, JSON.stringify(set.body)).toBe(200);
          try {
            const o104 = oracle('BR-104-03'); // 202, giá niêm yết 792.000, ngày đặc biệt → 1.030.000
            const b = await stay(request, c, fd, String(o104.input.roomNo), D, 1, { rate });
            const ob = await extensionOptions(request, fd, b.res.id);
            expect(ob.status).toBe(200);
            expect(ob.body.nights[0]).toMatchObject({
              date: special,
              defaultRateVnd: oracleNum('BR-104-03', 'rateVnd'),
            });
            const f0 = await getFolio(request, fd, b.res.folioId!);
            const rb = await extend(request, fd, b.res.id, { nights: 1 });
            expect(rb.status, JSON.stringify(rb.body)).toBe(200);
            const f1 = await getFolio(request, fd, b.res.folioId!);
            expect(sumOf(f1, 'room') - sumOf(f0, 'room')).toBe(oracleNum('BR-104-03', 'rateVnd'));
          } finally {
            const back = await setParam(request, 'special_dates', orig, addDays(D, 2));
            expect(back.status, JSON.stringify(back.body)).toBe(200);
          }
        },
      );
      test(
        'TC-L4-003 US-028/AC3 [A · Cao]',
        {
          annotation: [
            { type: 'story', description: 'US-028/AC3' },
            { type: 'endpoints', description: 'extendStay, getReservation, getFolio' },
          ],
        },
        async ({ request }) => {
          // Tiền điều kiện: (a) Đơn Booking.com 401 giá 990.000 in_house; (b) đơn Airbnb in_house
          // Bước: (a) Gia hạn 1 đêm; (b) gia hạn 2 đêm
          // Kỳ vọng: (a) tạo đơn con kênh Trực tiếp liên kết đơn gốc, giá 1.042.000 (giá trực tiếp hiện hành),
          //   folio chung, đơn OTA gốc không đổi; (b) thông báo "tiết kiệm 15,5% phí kênh ≈ 323.000" – tỷ lệ đọc
          //   từ cấu hình kênh (đổi tỷ lệ cấu hình → thông báo đổi theo)
          // Quy tắc: BR-422, BR-421, BR-901, BL #12, BL #13
          needClock('TC-L4-003');
          await requireEndpoints(request, 'TC-L4-003', [EP3.extendStay, EP3.getExtensionOptions]);
          const { D: D0, c } = await vday(request, realToday, 10);
          // đêm thêm phải là ngày thường (oracle: thứ Tư) → ngày đến T2/T3 để D+1, D+2 không phải T6/T7
          const D = [1, 2].includes(weekday(D0)) ? D0 : addDays(D0, 5);
          if (D !== D0) await at(request, vnTime(D, '14:30'));
          const fd = await fresh(request, 'qa.fd');
          const o = oracle('BR-421-02');
          // (a) Booking.com 401 giá OTA 990.000/đêm
          const a = await stay(request, c, fd, '401', D, 1, {
            kind: 'booking',
            extra: rates(D, 1, Number(o.input.nightRateVnd)),
          });
          const before = await getReservation(request, fd, a.res.id);
          const r = await extend(request, fd, a.res.id, { nights: 1 });
          expect(r.status, JSON.stringify(r.body)).toBe(200);
          const child = r.body.childReservation;
          expect(child, 'đơn con BR-422').toBeTruthy();
          expect(child!.channelCode).toBe('direct');
          expect(child!.arrivalDate).toBe(addDays(D, 1));
          const ch = await getReservation(request, fd, child!.id);
          expect(ch.body.parentReservationId).toBe(a.res.id);
          expect(ch.body.status).toBe('in_house');
          expect(ch.body.folioId, 'folio chung').toBe(a.res.folioId);
          // đơn OTA gốc không đổi (ngày đi, giá đêm)
          const parent = await getReservation(request, fd, a.res.id);
          expect(parent.body.departureDate).toBe(before.body.departureDate);
          expect(parent.body.nightlyRates).toEqual(before.body.nightlyRates);
          // giá đêm thêm = giá Trực tiếp hiện hành của 401 (oracle BR-421-02)
          const f = await getFolio(request, fd, a.res.folioId!);
          const childNight = liveLines(f, 'room').filter((l) => l.serviceDate === addDays(D, 1));
          expect(childNight.reduce((x, l) => x + l.amountVnd, 0)).toBe(
            oracleNum('BR-421-02', 'extensionVnd'),
          );
          // (b) Airbnb (căn 301): tiết kiệm phí kênh = tỷ lệ hoa hồng kênh trong cấu hình (oracle BR-422-01:
          //     15,5 %) × tiền gia hạn 2 đêm (giá Trực tiếp hiện hành, server tính ở repricing)
          const o422 = oracle('BR-422-01');
          const air = await stay(request, c, fd, '301', D, 1, { kind: 'airbnb' });
          const ob = await extensionOptions(request, fd, air.res.id);
          expect(ob.status, JSON.stringify(ob.body)).toBe(200);
          expect(ob.body.createsChildReservation).toBe(true);
          const two = ob.body.repricing?.find((x) => x.nights === 2);
          expect(two, 'repricing 2 đêm').toBeTruthy();
          const pct = Number(o422.expected.savingBp) / 100;
          const expectedSaving = pctOf(two!.repricedTotalVnd, pct);
          note(
            '(b) "đổi tỷ lệ cấu hình → thông báo đổi theo": chưa kiểm (đổi hoa hồng kênh là cấu hình dùng chung toàn cơ sở)',
          );
          test.fail(
            ob.body.channelFeeSavingsVnd === pctOf(ob.body.nights[0]!.defaultRateVnd!, pct),
            'BUG-R2-045: getExtensionOptions.channelFeeSavingsVnd = phí kênh của 1 đêm đầu, không theo số đêm gia hạn (BR-422-01: 2 đêm 2.084.000 → tiết kiệm 323.000)',
          );
          expect(ob.body.channelFeeSavingsVnd).toBe(expectedSaving);
        },
      );
      test(
        'TC-L4-004 US-028/AC4 [A · Cao]',
        {
          annotation: [
            { type: 'story', description: 'US-028/AC4' },
            { type: 'endpoints', description: 'extendStay, listHkTasks, getRegistration' },
          ],
        },
        async ({ request }) => {
          // Tiền điều kiện: Đơn khách NN in_house, khai báo confirmed, buồng OC, có việc "Dọn trả phòng" ngày đi
          // Bước: Gia hạn 1 đêm
          // Kỳ vọng: Ngày đi cập nhật; buồng → OD; việc "Dọn trả phòng" đổi thành "Dọn phòng khách đang ở"; 1
          //   lệnh outbox; khai báo → needs_update; hạn thu tiền gia hạn = muộn nhất 14:00 ngày đầu phần gia hạn
          //   (BR-423)
          // Quy tắc: BR-802, BR-423, BR-604, BR-905
          needClock('TC-L4-004');
          await requireEndpoints(request, 'TC-L4-004', [
            EP3.extendStay,
            EP3.getRegistration,
            EP3.transitionRegistration,
          ]);
          const { D, c } = await vday(request, realToday, 6);
          const fd = await fresh(request, 'qa.fd');
          const a = await stay(request, c, fd, '203', D, 1, { doc: 'foreign', adults: 1 });
          await confirmRegistration(request, fd, a.regId);
          expect(storedRoomStatus(c, '203') ?? 'OC').toBe('OC');
          const since = new Date().toISOString();
          const r = await extend(request, fd, a.res.id, { nights: 1 });
          expect(r.status, JSON.stringify(r.body)).toBe(200);
          expect(r.body.reservation.departureDate).toBe(addDays(D, 2));
          const reg = (await getRegistration(request, fd, a.regId)).body;
          expect(reg.status, 'khai báo NN → needs_update (BR-604)').toBe('needs_update');
          const ob = outboxCount('%reservation.extended%', since);
          if (ob >= 0) expect(ob, 'lệnh outbox đồng bộ kênh (BR-905)').toBe(1);
          // đổi việc dọn: việc HK là Sprint 4 (listHkTasks chưa có trên build); hạn thu tiền gia hạn BR-423 do màn
          // hình tính từ tham số extension_payment_deadline (không có trường API)
          note(
            'Sprint 4: đổi việc "Dọn trả phòng" → "Dọn phòng khách đang ở" chưa kiểm (listHkTasks)',
          );
          note(
            'BR-423: hạn thu tiền gia hạn hiển thị phía giao diện (extend.pay_by) – không có trường API',
          );
          // buồng → OD (SM-01 B13, BR-802 "gia hạn → OD"): trạng thái buồng lưu SM-03 (listRoomStatuses là Sprint 4
          // → đọc DB của stack dùng một lần)
          const st = storedRoomStatus(c, '203');
          if (st !== null) {
            test.fail(
              st === 'OC',
              'BUG-R2-047: gia hạn (B13) không chuyển buồng OC → OD (SM-01 B13, BR-802 "gia hạn → OD") – room_status vẫn OC',
            );
            expect(st, 'buồng sau gia hạn').toBe('OD');
          }
        },
      );
      test(
        'TC-L4-005 US-028/AC5 [P+A · Cao]',
        {
          annotation: [
            { type: 'story', description: 'US-028/AC5' },
            { type: 'endpoints', description: 'extendStay, createReservation' },
          ],
        },
        async ({ request }) => {
          // Tiền điều kiện: Đơn in_house 201 đi 16/10; 201 trống 16/10
          // Bước: Đồng thời: qa.fd gia hạn đêm 16/10 và qa.fd2 tạo đơn mới 201 đêm 16/10 (lặp 20 lần)
          // Kỳ vọng: Mỗi lần đúng 1 thao tác thành công, thao tác kia 409 ROOM_UNAVAILABLE
          // Quy tắc: BR-906
          test.setTimeout(240_000);
          needClock('TC-L4-005');
          await requireEndpoints(request, 'TC-L4-005', [EP3.extendStay, EP.createReservation]);
          const { D, c } = await vday(request, realToday, 6);
          const fd = await fresh(request, 'qa.fd');
          const fd2 = await fresh(request, 'qa.fd2');
          const guest = await newGuest(request, fd2);
          // 10 căn × 2 vòng = 20 lần; mỗi căn một đơn in_house D → D+1
          const stays: Stay[] = [];
          for (const rm of c.rooms) stays.push(await stay(request, c, fd, rm.roomNo, D, 1));
          let wins = 0;
          const outcomes: string[] = [];
          for (let round = 0; round < 2; round++) {
            for (const st of stays) {
              const cur = await getReservation(request, fd, st.res.id);
              const dep = cur.body.departureDate;
              const body = await withDeposit(
                request,
                fd2,
                reservationBody(c, {
                  room: st.room,
                  arrival: dep,
                  departure: addDays(dep, 2),
                  guestId: guest,
                }),
              );
              const [ext, cre] = await Promise.all([
                call<ProblemFields>(
                  request,
                  'POST',
                  p3(EP3.extendStay, fd, { reservationId: st.res.id }),
                  {
                    session: fd,
                    idempotencyKey: true,
                    ifMatch: versionTag(cur.body.version),
                    body: { nights: 1 },
                  },
                ),
                createReservation(request, fd2, body, true, { autoDeposit: false }),
              ]);
              const ok = [ext.status === 200, cre.status === 201].filter(Boolean).length;
              outcomes.push(
                `${st.room.roomNo}: extend ${ext.status} ${ext.body?.code ?? ''} / create ${cre.status} ${cre.body?.code ?? ''}`,
              );
              expect(ok, outcomes.at(-1)).toBe(1);
              const loser = ext.status === 200 ? cre : ext;
              expect(loser.status, outcomes.at(-1)).toBe(409);
              expect(loser.body?.code, outcomes.at(-1)).toBe('ROOM_UNAVAILABLE');
              wins += 1;
              if (cre.status === 201) {
                // nhả lại đêm cho vòng sau
                const owner = await fresh(request, 'qa.owner');
                const cancel = await action(request, owner, cre.body.id, 'cancel', {
                  reasonCode: 'other',
                  note: 'E2E TC-L4-005 nha dem',
                });
                expect(cancel.status, JSON.stringify(cancel.body)).toBe(200);
              }
            }
          }
          expect(wins).toBe(20);
        },
      );
      test(
        'TC-L4-010 US-029/AC1 [A+E · Cao]',
        {
          annotation: [
            { type: 'story', description: 'US-029/AC1' },
            { type: 'endpoints', description: 'setLateCheckout' },
          ],
        },
        async ({ request }) => {
          // Tiền điều kiện: Đơn giá đêm cuối 700.000, đi hôm nay, căn không có khách đến
          // Bước: Đặt trả muộn 15:00 (dryRun rồi ghi); dữ liệu mới: 17:00
          // Kỳ vọng: 15:00 → 210.000, 17:00 → 350.000 (ví dụ BR-412); số tiền hiện trước khi lưu (dryRun không
          //   ghi dữ liệu); chỉ ghi folio khi lễ tân xác nhận
          // Quy tắc: BR-412, BR-414, SM-01 B15
          needClock('TC-L4-010');
          await requireEndpoints(request, 'TC-L4-010', [EP3.setLateCheckout]);
          const { D, c } = await vday(request, realToday, 4);
          let fd = await fresh(request, 'qa.fd');
          const rate = Number(oracle('BR-412-01').input.lastNightRateVnd);
          const a = await stay(request, c, fd, '203', D, 1, { rate });
          const b = await stay(request, c, fd, '202', D, 1, { rate });
          await at(request, vnTime(addDays(D, 1), '10:00'));
          fd = await fresh(request, 'qa.fd');
          for (const [st, ex] of [
            [a, 'BR-412-01'],
            [b, 'BR-412-02'],
          ] as const) {
            const time = String(oracle(ex).input.checkoutTime);
            const amount = oracleNum(ex, 'surchargeVnd');
            const f0 = await getFolio(request, fd, st.res.folioId!);
            const v0 = (await getReservation(request, fd, st.res.id)).body.version;
            const dry = await lateCheckout(request, fd, st.res.id, { checkoutTime: time }, true);
            expect(dry.status, JSON.stringify(dry.body)).toBe(200);
            expect(dry.body).toMatchObject({
              checkoutTime: time,
              surchargeVnd: amount,
              saved: false,
            });
            // dryRun không ghi gì (SEC A3): folio + version giữ nguyên
            const f1 = await getFolio(request, fd, st.res.folioId!);
            expect(f1.lines.length).toBe(f0.lines.length);
            expect(f1.version).toBe(f0.version);
            expect((await getReservation(request, fd, st.res.id)).body.version).toBe(v0);
            // xác nhận thiếu / sai số tiền → không ghi
            const noExp = await lateCheckout(request, fd, st.res.id, {
              checkoutTime: time,
              applySurcharge: true,
            });
            expect(noExp.status).toBe(422);
            expect(fieldCodes(noExp.body)).toContain('expectedSurchargeVnd:REQUIRED');
            const wrong = await lateCheckout(request, fd, st.res.id, {
              checkoutTime: time,
              applySurcharge: true,
              expectedSurchargeVnd: amount - 1000,
            });
            expectProblem(wrong, 409, 'SURCHARGE_CHANGED');
            expect(sumOf(await getFolio(request, fd, st.res.folioId!), 'late_checkout')).toBe(0);
            // lễ tân xác nhận đúng số → ghi folio
            const save = await lateCheckout(request, fd, st.res.id, {
              checkoutTime: time,
              applySurcharge: true,
              expectedSurchargeVnd: amount,
            });
            expect(save.status, JSON.stringify(save.body)).toBe(200);
            expect(save.body.saved).toBe(true);
            expect(save.body.reservation?.agreedCheckoutTime).toBe(time);
            expect(sumOf(await getFolio(request, fd, st.res.folioId!), 'late_checkout')).toBe(
              amount,
            );
          }
        },
      );
      test(
        'TC-L4-011 US-029/AC1 [U+A · Cao]',
        {
          annotation: [
            { type: 'story', description: 'US-029/AC1' },
            { type: 'endpoints', description: 'setLateCheckout, setParameter' },
          ],
        },
        async ({ request }) => {
          // Tiền điều kiện: Như trên; giá đêm cuối 700.000; ân hạn mặc định 12:30
          // Bước: Căn không có khách đến hôm nay, giờ trả: 12:00; 12:30; 12:31; 15:00; 15:01; 18:00. Căn có khách
          //   đến hôm nay: 12:01; 12:20. Sau đó qa.owner đặt ân hạn 13:00, thử 13:00 và 13:01 (không có khách
          //   đến)
          // Kỳ vọng: Không có khách đến: 12:00 → 0; 12:30 → 0; 12:31 → 210.000; 15:00 → 210.000; 15:01 → 350.000;
          //   18:00 → 350.000 (oracle BR-412-01…11). Có khách đến: 12:01 → 210.000; 12:20 → 210.000 (không ân
          //   hạn). Ân hạn 13:00: 13:00 → 0; 13:01 → 210.000 (ân hạn không dời mốc bậc)
          // Quy tắc: BR-412 (biên, INV quyết ESC-007), late_grace_until, late_grace_requires_no_same_day_arrival,
          //   BL #4
          needClock('TC-L4-011');
          await requireEndpoints(request, 'TC-L4-011', [EP3.setLateCheckout, EP3.setParameter]);
          const { D, c } = await vday(request, realToday, 4);
          let fd = await fresh(request, 'qa.fd');
          const rate = Number(oracle('BR-412-01').input.lastNightRateVnd);
          const free = await stay(request, c, fd, '203', D, 1, { rate });
          const busy = await stay(request, c, fd, '202', D, 1, { rate });
          await blockRoom(request, c, fd, '202', addDays(D, 1)); // khách đến 202 ngày đi
          await at(request, vnTime(addDays(D, 1), '09:00'));
          fd = await fresh(request, 'qa.fd');
          const dry = async (st: Stay, time: string) => {
            const r = await lateCheckout(request, fd, st.res.id, { checkoutTime: time }, true);
            expect(r.status, `${time}: ${JSON.stringify(r.body)}`).toBe(200);
            return r.body;
          };
          for (const ex of [
            'BR-412-03',
            'BR-412-10',
            'BR-412-11',
            'BR-412-01',
            'BR-412-05',
            'BR-412-06',
            'BR-412-08',
          ]) {
            const o = oracle(ex);
            expect(o.input.sameDayArrival).toBe(false);
            const r = await dry(free, String(o.input.checkoutTime));
            expect(r.surchargeVnd, `${ex} ${String(o.input.checkoutTime)}`).toBe(
              oracleNum(ex, 'surchargeVnd'),
            );
            expect(r.treatAsExtension ?? false).toBe(false);
          }
          for (const ex of ['BR-412-04', 'BR-412-09']) {
            const o = oracle(ex);
            expect(o.input.sameDayArrival).toBe(true);
            const r = await dry(busy, String(o.input.checkoutTime));
            expect(r.surchargeVnd, `${ex} có khách đến`).toBe(oracleNum(ex, 'surchargeVnd'));
            expect(r.arrivalSameDay, 'cảnh báo khách đến cùng ngày').toBeTruthy();
          }
          // qa.owner đặt ân hạn 13:00 cho hôm nay; 13:00 → 0, 13:01 → bậc 30 % (mốc bậc không dời)
          const D1 = addDays(D, 1);
          const set = await setParam(request, 'late_grace_until', '13:00', D1);
          expect(set.status, JSON.stringify(set.body)).toBe(200);
          try {
            fd = await fresh(request, 'qa.fd');
            expect((await dry(free, '13:00')).surchargeVnd).toBe(0);
            expect((await dry(free, '13:01')).surchargeVnd).toBe(
              oracleNum('BR-412-11', 'surchargeVnd'),
            );
          } finally {
            const back = await setParam(
              request,
              'late_grace_until',
              dsParam<string>('late_grace_until'),
              addDays(D1, 1),
            );
            expect(back.status, JSON.stringify(back.body)).toBe(200);
          }
        },
      );
      test(
        'TC-L4-012 US-029/AC2 [A · Cao]',
        {
          annotation: [
            { type: 'story', description: 'US-029/AC2' },
            { type: 'endpoints', description: 'setLateCheckout' },
          ],
        },
        async ({ request }) => {
          // Tiền điều kiện: Căn 203 trả muộn 15:00; có khách đến 203 hôm nay ETA 14:00; (a) không còn căn Lầu 1–2
          //   trống; (b) còn 202 trống
          // Bước: (a) qa.fd đặt trả muộn; qa.mgr đặt trả muộn. (b) qa.fd đặt trả muộn
          // Kỳ vọng: (a) qa.fd: 409 LATE_CHECKOUT_CONFLICT; qa.mgr: được (duyệt). (b) được kèm cảnh báo nêu tên
          //   khách đến và giờ đến dự kiến 14:00
          // Quy tắc: BR-416, A16
          needClock('TC-L4-012');
          await requireEndpoints(request, 'TC-L4-012', [EP3.setLateCheckout, EP3.approveRequest]);
          const { D, c } = await vday(request, realToday, 4);
          let fd = await fresh(request, 'qa.fd');
          const D1 = addDays(D, 1);
          const a = await stay(request, c, fd, '203', D, 1);
          const b = await stay(request, c, fd, '103', D, 1);
          const eta = String(oracle('BR-416-01').input.sameDayArrivalTime); // 14:00
          await blockRoom(request, c, fd, '203', D1, 1, { etaTime: eta });
          await blockRoom(request, c, fd, '103', D1, 1, { etaTime: eta });
          // (b) còn 202 trống → qa.fd đặt được, kèm cảnh báo tên khách đến + giờ đến dự kiến
          await at(request, vnTime(D1, '09:00'));
          fd = await fresh(request, 'qa.fd');
          // 0.3.6: không còn "đặt giờ, không ghi phụ thu" (applySurcharge=false → 422 SURCHARGE_DECISION_REQUIRED) –
          // ca này kiểm cảnh báo khách đến, phụ thu theo mặc định của quầy (support lateCheckout)
          const okB = await lateCheckout(request, fd, b.res.id, { checkoutTime: '15:00' });
          expect(okB.status, JSON.stringify(okB.body)).toBe(200);
          expect(okB.body.saved).toBe(true);
          expect(okB.body.arrivalSameDay).toMatchObject({
            etaTime: eta,
            alternativeRoomAvailable: true,
          });
          expect(okB.body.arrivalSameDay?.guestDisplayName, 'tên khách đến').toBeTruthy();
          // (a) mọi căn Lầu 1–2 khác kín đêm nay → qa.fd: 409; qa.fd xin duyệt → 202; qa.mgr: được
          for (const no of ['101', '102', '201', '202']) await blockRoom(request, c, fd, no, D1);
          const fdTry = await lateCheckout(request, fd, a.res.id, { checkoutTime: '15:00' });
          expectProblem(fdTry, 409, 'LATE_CHECKOUT_CONFLICT');
          const ask = await lateCheckout(request, fd, a.res.id, {
            checkoutTime: '15:00',
            requestApproval: true,
          });
          expect(ask.status, JSON.stringify(ask.body)).toBe(202);
          expect((ask.body as unknown as Approval).type).toBe('late_checkout_conflict');
          const mgr = await fresh(request, 'qa.mgr');
          const ok = await approve(request, mgr, (ask.body as unknown as Approval).id);
          expect(ok.status, JSON.stringify(ok.body)).toBe(200);
          expect((await getReservation(request, mgr, a.res.id)).body.agreedCheckoutTime).toBe(
            '15:00',
          );
          // qa.mgr tự đặt (giờ khác) → được ngay
          const mgrSet = await lateCheckout(request, mgr, a.res.id, { checkoutTime: '14:30' });
          expect(mgrSet.status, JSON.stringify(mgrSet.body)).toBe(200);
          expect(mgrSet.body.saved).toBe(true);
          expect(mgrSet.body.arrivalSameDay?.alternativeRoomAvailable).toBe(false);
        },
      );
      test(
        'TC-L4-013 US-029/AC3 [A · Cao]',
        {
          annotation: [
            { type: 'story', description: 'US-029/AC3' },
            { type: 'endpoints', description: 'setLateCheckout, getExtensionOptions' },
          ],
        },
        async ({ request }) => {
          // Tiền điều kiện: Đơn đi hôm nay
          // Bước: Đặt trả muộn 18:01; 19:00
          // Kỳ vọng: Không ghi phụ thu; chuyển sang luồng gia hạn 1 đêm (kiểm trùng, khóa đêm trên kênh)
          // Quy tắc: BR-416, BR-421
          needClock('TC-L4-013');
          await requireEndpoints(request, 'TC-L4-013', [EP3.setLateCheckout, EP3.extendStay]);
          const { D, c } = await vday(request, realToday, 4);
          let fd = await fresh(request, 'qa.fd');
          const o = oracle('BR-412-07');
          const rate = Number(o.input.lastNightRateVnd);
          const a = await stay(request, c, fd, '203', D, 1, { rate });
          await at(request, vnTime(addDays(D, 1), '10:00'));
          fd = await fresh(request, 'qa.fd');
          for (const t of ['18:01', String(o.input.checkoutTime)]) {
            const dry = await lateCheckout(request, fd, a.res.id, { checkoutTime: t }, true);
            expect(dry.status).toBe(200);
            expect(dry.body).toMatchObject({ surchargeVnd: 0, treatAsExtension: true });
            const save = await lateCheckout(request, fd, a.res.id, {
              checkoutTime: t,
              applySurcharge: true,
              expectedSurchargeVnd: 0,
            });
            expect(save.status).toBe(422);
            expect(fieldCodes(save.body)).toContain('checkoutTime:LATE_CHECKOUT_AFTER_LIMIT');
          }
          const f0 = await getFolio(request, fd, a.res.folioId!);
          expect(sumOf(f0, 'late_checkout')).toBe(0);
          // luồng gia hạn 1 đêm: còn đêm trống, giữ giá đơn (oracle BR-412-07 extensionVnd)
          const opt = await extensionOptions(request, fd, a.res.id);
          expect(opt.body.maxNights).toBeGreaterThanOrEqual(Number(o.expected.extensionNights));
          const since = new Date().toISOString();
          const r = await extend(request, fd, a.res.id, {
            nights: Number(o.expected.extensionNights),
            nightlyRates: [{ date: addDays(D, 1), amountVnd: rate }],
          });
          expect(r.status, JSON.stringify(r.body)).toBe(200);
          const f1 = await getFolio(request, fd, a.res.folioId!);
          expect(sumOf(f1, 'room') - sumOf(f0, 'room')).toBe(
            oracleNum('BR-412-07', 'extensionVnd'),
          );
          expect(sumOf(f1, 'late_checkout')).toBe(0);
          const ob = outboxCount('%reservation.extended%', since);
          if (ob >= 0) expect(ob, 'khóa đêm trên kênh (outbox)').toBe(1);
        },
      );
      test(
        'TC-L4-014 US-029/AC4 [A · TB]',
        {
          annotation: [
            { type: 'story', description: 'US-029/AC4' },
            {
              type: 'endpoints',
              description: 'setLateCheckout, listHkTasks, getDoorCredential, listCheckoutReminders',
            },
          ],
        },
        async ({ request }) => {
          // Tiền điều kiện: Như TC-L4-010 (15:00)
          // Bước: Lưu trả muộn
          // Kỳ vọng: Việc dọn của căn ghi "dọn sau 15:00"; hiệu lực mã cửa kéo tới 15:00; nhật ký nhắc ghi giờ
          //   trả đã chốt
          // Quy tắc: BR-403, SM-14
          needClock('TC-L4-014');
          await requireEndpoints(request, 'TC-L4-014', [
            EP3.setLateCheckout,
            EP3.listCheckoutReminders,
          ]);
          const { D, c } = await vday(request, realToday, 4);
          let fd = await fresh(request, 'qa.fd');
          const o = oracle('BR-412-01');
          const a = await stay(request, c, fd, '203', D, 1, {
            rate: Number(o.input.lastNightRateVnd),
          });
          await at(request, vnTime(addDays(D, 1), '09:30'));
          fd = await fresh(request, 'qa.fd');
          const time = String(o.input.checkoutTime);
          const save = await lateCheckout(request, fd, a.res.id, {
            checkoutTime: time,
            applySurcharge: true,
            expectedSurchargeVnd: oracleNum('BR-412-01', 'surchargeVnd'),
          });
          expect(save.status, JSON.stringify(save.body)).toBe(200);
          // việc dọn của căn: "dọn sau 15:00" (cleaningNotBefore – việc HK là Sprint 4)
          expect(save.body.cleaningNotBefore).toBe(time);
          // nhật ký nhắc: giờ trả đã chốt → thẻ "đã trả lời"
          const rem = await reminders(request, fd, a.res.id);
          expect(rem.state).toBe('replied');
          expect((await getReservation(request, fd, a.res.id)).body.agreedCheckoutTime).toBe(time);
          // mã cửa: US-128 dời R3 – endpoint chưa đăng ký, đơn không mang mã cửa (SEC D2)
          const door = await call(
            request,
            'GET',
            p3(EP3.getDoorCredential, fd, { reservationId: a.res.id }),
            dev(fd),
          );
          expect(door.status).toBe(404);
          expect(JSON.stringify((await getReservation(request, fd, a.res.id)).body)).not.toMatch(
            /doorCode|door_code|"pin"/i,
          );
          note(
            'R3: hiệu lực mã cửa tới 15:00 (US-128 dời R3); Sprint 4: việc HK "dọn sau 15:00" (listHkTasks)',
          );
        },
      );
      test(
        'TC-L4-020 US-030/AC1 [A+E · TB]',
        {
          annotation: [
            { type: 'story', description: 'US-030/AC1' },
            { type: 'endpoints', description: 'recordCheckoutConfirmation, listCheckoutReminders' },
          ],
        },
        async ({ request }) => {
          // Tiền điều kiện: Đơn đi hôm nay
          // Bước: Lễ tân chọn giờ 11:00, ghi chú "Gọi điện"
          // Kỳ vọng: Nhật ký nhắc có dòng "Gọi điện – khách trả lúc 11:00", người ghi, thời điểm
          // Quy tắc: UC-14
          needClock('TC-L4-020');
          await requireEndpoints(request, 'TC-L4-020', [
            EP3.recordCheckoutConfirmation,
            EP3.listCheckoutReminders,
          ]);
          const { D, c } = await vday(request, realToday, 4);
          let fd = await fresh(request, 'qa.fd');
          const a = await stay(request, c, fd, '201', D, 1);
          const now = await at(request, vnTime(addDays(D, 1), '08:15'));
          fd = await fresh(request, 'qa.fd');
          const post = (body: Record<string, unknown>) =>
            call<Record<string, string> & ProblemFields>(
              request,
              'POST',
              p3(EP3.recordCheckoutConfirmation, fd, { reservationId: a.res.id }),
              { session: fd, idempotencyKey: true, body },
            );
          // giờ "time" phải ≤ giờ trả chuẩn; "late" phải sau giờ chuẩn
          const bad = await post({ channel: 'phone', replyType: 'time', confirmedTime: '12:30' });
          expect(bad.status).toBe(422);
          expect(fieldCodes(bad.body)).toContain('confirmedTime:DATE_INVALID');
          const r = await post({
            channel: 'phone',
            replyType: 'time',
            confirmedTime: '11:00',
            note: 'Gọi điện',
          });
          expect(r.status, JSON.stringify(r.body)).toBe(201);
          expect(r.body).toMatchObject({
            channel: 'phone',
            confirmedTime: '11:00',
            note: 'Gọi điện',
          });
          expect(r.body.recordedBy, 'người ghi').toBe(fd.me.displayName);
          expect(Math.abs(new Date(r.body.at!).getTime() - new Date(now).getTime())).toBeLessThan(
            5000,
          );
          const rem = await reminders(request, fd, a.res.id);
          expect(rem.data).toHaveLength(1);
          expect(rem.data[0]).toMatchObject({
            channel: 'phone',
            confirmedTime: '11:00',
            note: 'Gọi điện',
            recordedBy: fd.me.displayName,
          });
        },
      );
      test(
        'TC-L4-021 US-030/AC2 [A+E · TB]',
        {
          annotation: [
            { type: 'story', description: 'US-030/AC2' },
            { type: 'endpoints', description: 'getArrivalsDepartures' },
          ],
        },
        async ({ request }) => {
          // Tiền điều kiện: Sau TC-L4-020
          // Bước: Xem thẻ "khách trả phòng hôm nay"
          // Kỳ vọng: Thẻ đơn đó chuyển "đã trả lời"
          // Quy tắc: –
          needClock('TC-L4-021');
          await requireEndpoints(request, 'TC-L4-021', [
            EP3.recordCheckoutConfirmation,
            EP3.listCheckoutReminders,
          ]);
          const hasCards = await isAvailable(request, 'GET', EP3.getArrivalsDepartures[1]);
          const { D, c } = await vday(request, realToday, 4);
          let fd = await fresh(request, 'qa.fd');
          const a = await stay(request, c, fd, '201', D, 1);
          await at(request, vnTime(addDays(D, 1), '08:15'));
          fd = await fresh(request, 'qa.fd');
          expect((await reminders(request, fd, a.res.id)).state).toBe('reminded_waiting');
          const r = await call(
            request,
            'POST',
            p3(EP3.recordCheckoutConfirmation, fd, { reservationId: a.res.id }),
            {
              session: fd,
              idempotencyKey: true,
              body: {
                channel: 'phone',
                replyType: 'time',
                confirmedTime: '11:00',
                note: 'Gọi điện',
              },
            },
          );
          expect(r.status).toBe(201);
          // trạng thái thẻ tính ở server – cùng giá trị getArrivalsDepartures.departures[].reminderState
          expect((await reminders(request, fd, a.res.id)).state).toBe('replied');
          // thẻ "khách trả phòng hôm nay": getArrivalsDepartures (EP01 dashboard – Sprint 4) chưa có trên build
          test.skip(
            !hasCards,
            'TC-L4-021: chờ endpoint getArrivalsDepartures (EP01 dashboard – Sprint 4) – thẻ khách đi; trạng thái nhắc đã kiểm qua listCheckoutReminders',
          );
          const ad = await call<{ departures: Array<{ id: string; reminderState?: string }> }>(
            request,
            'GET',
            p3(EP3.getArrivalsDepartures, fd),
            { session: fd },
          );
          expect(ad.body.departures.find((x) => x.id === a.res.id)?.reminderState).toBe('replied');
        },
      );
      test(
        'TC-L4-022 US-031/AC1 [A · Cao]',
        {
          annotation: [
            { type: 'story', description: 'US-031/AC1' },
            { type: 'endpoints', description: 'getArrivalsDepartures, listCheckoutReminders' },
          ],
        },
        async ({ request }) => {
          // Tiền điều kiện: Đơn in_house đi 16/10, khách chưa trả lời
          // Bước: ⏱ 15/10 19:59, 20:00; 16/10 08:59, 09:00; 10:59, 11:00; 11:59, 12:00 – mỗi mốc ▶ J4
          // Kỳ vọng: Thẻ đổi đúng thứ tự: (20:00) nhắc lần 1 → (09:00) "Đã nhắc, chờ khách trả lời" → (11:00)
          //   "Chưa trả lời – lễ tân gọi xác nhận" → (12:00) "Quá giờ trả phòng" báo đỏ cho qa.fd + qa.mgr; trước
          //   mỗi mốc 1 phút chưa đổi; chạy J4 hai lần cùng mốc không nhắc trùng
          // Quy tắc: BR-425, BR-001, J4
          test.setTimeout(180_000);
          needClock('TC-L4-022');
          await requireEndpoints(request, 'TC-L4-022', [EP3.listCheckoutReminders]);
          const { D, c } = await vday(request, realToday, 4);
          const fd0 = await fresh(request, 'qa.fd');
          const D1 = addDays(D, 1);
          // A: không có khách đến; B: căn có khách đến ngày đi (quá giờ sớm hơn – BR-425)
          const a = await stay(request, c, fd0, '201', D, 1);
          const b = await stay(request, c, fd0, '202', D, 1);
          await blockRoom(request, c, fd0, '202', D1);
          const marks = dsParam<{
            before: string[];
            overdueWithSameDayArrival: string;
            overdueOtherwise: string;
          }>('checkout_reminders');
          const evening = marks.before.find((m) => m.endsWith('-1d'))!.replace('-1d', '');
          const sameDay = marks.before.filter((m) => !m.endsWith('-1d'));
          const call1 = sameDay[sameDay.length - 1]!; // mốc "lễ tân gọi xác nhận"
          const minus1 = (hhmm: string) => {
            const [h, m] = hhmm.split(':').map(Number) as [number, number];
            const t = h * 60 + m - 1;
            return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
          };
          let j4: boolean | null = null;
          const check = async (date: string, hhmm: string, stA: string, stB: string) => {
            await at(request, vnTime(date, hhmm));
            for (let k = 0; k < 2; k++) {
              const run = await runJobIfAny(request, 'checkout.reminders');
              j4 = run !== null;
            }
            const fd = await fresh(request, 'qa.fd');
            expect((await reminders(request, fd, a.res.id)).state, `A ${date} ${hhmm}`).toBe(stA);
            expect((await reminders(request, fd, b.res.id)).state, `B ${date} ${hhmm}`).toBe(stB);
          };
          await check(D, minus1(evening), 'reminded_waiting', 'reminded_waiting');
          await check(D, evening, 'reminded_waiting', 'reminded_waiting');
          for (const m of sameDay.slice(0, -1)) {
            await check(D1, minus1(m), 'reminded_waiting', 'reminded_waiting');
            await check(D1, m, 'reminded_waiting', 'reminded_waiting');
          }
          await check(D1, minus1(call1), 'reminded_waiting', 'reminded_waiting');
          await check(D1, call1, 'call_needed', 'call_needed');
          await check(D1, minus1(marks.overdueWithSameDayArrival), 'call_needed', 'call_needed');
          await check(D1, marks.overdueWithSameDayArrival, 'call_needed', 'overdue');
          await check(D1, minus1(marks.overdueOtherwise), 'call_needed', 'overdue');
          await check(D1, marks.overdueOtherwise, 'overdue', 'overdue');
          if (!j4) {
            note(
              'J4 checkout.reminders chưa đăng ký trên build: trạng thái thẻ tính lúc đọc đã kiểm; gửi nhắc 20:00 + báo đỏ qa.fd/qa.mgr + chạy 2 lần không trùng chưa kiểm được (BE-A: nhắc tự động US-034 R3)',
            );
          }
        },
      );
      test(
        'TC-L4-023 US-031/AC2 [A+E · TB]',
        {
          annotation: [
            { type: 'story', description: 'US-031/AC2' },
            { type: 'endpoints', description: 'getArrivalsDepartures' },
          ],
        },
        async ({ request }) => {
          // Tiền điều kiện: 2 đơn đi hôm nay chưa trả lời; căn của đơn thứ 2 có khách đến hôm nay
          // Bước: Xem danh sách thẻ
          // Kỳ vọng: Đơn thứ 2 được xếp lên đầu
          // Quy tắc: BR-425
          needClock('TC-L4-023');
          await requireEndpoints(request, 'TC-L4-023', [EP3.listCheckoutReminders]);
          const hasCards = await isAvailable(request, 'GET', EP3.getArrivalsDepartures[1]);
          const { D, c } = await vday(request, realToday, 4);
          let fd = await fresh(request, 'qa.fd');
          const D1 = addDays(D, 1);
          const first = await stay(request, c, fd, '101', D, 1);
          const second = await stay(request, c, fd, '102', D, 1);
          await blockRoom(request, c, fd, '102', D1);
          const marks = dsParam<{ overdueWithSameDayArrival: string }>('checkout_reminders');
          await at(request, vnTime(D1, marks.overdueWithSameDayArrival));
          fd = await fresh(request, 'qa.fd');
          // căn có khách đến quá giờ sớm hơn → ưu tiên (REMINDER_ORDER: overdue trước call_needed)
          expect((await reminders(request, fd, second.res.id)).state).toBe('overdue');
          expect((await reminders(request, fd, first.res.id)).state).toBe('call_needed');
          // thứ tự thẻ: getArrivalsDepartures (EP01 dashboard – Sprint 4) chưa có trên build
          test.skip(
            !hasCards,
            'TC-L4-023: chờ endpoint getArrivalsDepartures (EP01 dashboard – Sprint 4) – danh sách thẻ; trạng thái nhắc đã kiểm qua listCheckoutReminders',
          );
          const ad = await call<{ departures: Array<{ id: string }> }>(
            request,
            'GET',
            p3(EP3.getArrivalsDepartures, fd),
            { session: fd },
          );
          const ids = ad.body.departures.map((x) => x.id);
          expect(ids.indexOf(second.res.id)).toBeLessThan(ids.indexOf(first.res.id));
        },
      );
      test(
        'TC-L4-024 US-031/– [A · Thấp]',
        {
          annotation: [
            { type: 'story', description: 'US-031/–' },
            { type: 'endpoints', description: 'listCheckoutReminders' },
          ],
        },
        async ({ request }) => {
          // Tiền điều kiện: Worker dừng từ 19:00 đến 08:30 hôm sau
          // Bước: Khởi động worker lúc 08:30
          // Kỳ vọng: Nhắc "20:00 hôm trước" không gửi bù (trễ > job_catchup_minutes), job_run ghi skipped
          // Quy tắc: BR-425, architecture 9.1 J4 (bắt kịp)
          needClock('TC-L4-024');
          await requireEndpoints(request, 'TC-L4-024', [EP3.listCheckoutReminders]);
          const { D, c } = await vday(request, realToday, 4);
          const fd = await fresh(request, 'qa.fd');
          const a = await stay(request, c, fd, '201', D, 1);
          await at(request, vnTime(D, '19:00'));
          // J4 checkout.reminders (architecture 9.1) – runJob bỏ qua ca khi job chưa đăng ký
          await runJob(request, 'checkout.reminders');
          await at(request, vnTime(addDays(D, 1), '08:30'));
          const run = await runJob(request, 'checkout.reminders');
          expect(run.status).toBe('skipped_catchup_window');
          expect((await reminders(request, await fresh(request, 'qa.fd'), a.res.id)).state).toBe(
            'reminded_waiting',
          );
        },
      );
      test(
        'TC-L4-025 US-137/– [A · TB]',
        {
          annotation: [
            { type: 'story', description: 'US-137/–' },
            { type: 'endpoints', description: 'earlyDeparture, listApprovalRequests' },
          ],
        },
        async ({ request }) => {
          // Tiền điều kiện: Đơn Trực tiếp 4 đêm × 700.000 in_house; story Should R2
          // Bước: (a) Khách báo trước 1 ngày, bỏ 2 đêm cuối; (b) dữ liệu mới: báo trong ngày
          // Kỳ vọng: (a) hoàn 700.000 (50% của 2 đêm – ví dụ BR-428), yêu cầu hoàn chờ qa.mgr duyệt, 2 đêm mở bán
          //   + outbox, khai báo NN needs_update; (b) không hoàn, các đêm còn lại vẫn mở bán
          // Quy tắc: BR-428, SM-01 B16, BR-522, BR-011 (ngày mốc = ngày rời đi mới)
          test.setTimeout(150_000);
          needClock('TC-L4-025');
          await requireEndpoints(request, 'TC-L4-025', [
            EP3.earlyDeparture,
            EP3.listApprovalRequests,
          ]);
          const { D, c } = await vday(request, realToday, 6);
          let fd = await fresh(request, 'qa.fd');
          const o1 = oracle('BR-428-01');
          const rate = Number(o1.input.nightRateVnd);
          const nights =
            (new Date(String(o1.input.departureDate)).getTime() -
              new Date(String(o1.input.arrivalDate)).getTime()) /
            864e5;
          // ánh xạ ngày oracle (20/10 → D)
          const map = (iso: string) =>
            addDays(
              D,
              (new Date(iso.slice(0, 10)).getTime() -
                new Date(String(o1.input.arrivalDate)).getTime()) /
                864e5,
            );
          const sa = await stay(request, c, fd, '201', D, nights, {
            rate,
            doc: 'foreign',
            adults: 1,
          });
          const sb = await stay(request, c, fd, '202', D, nights, { rate });
          const sc = await stay(request, c, fd, '203', D, nights, { rate });
          await confirmRegistration(request, fd, sa.regId);
          const early = async (st: Stay, ex: string) => {
            const o = oracle(ex);
            const noticeAt = vnTime(
              map(String(o.input.notifiedAt)),
              String(o.input.notifiedAt).slice(11, 16),
            );
            await at(request, noticeAt);
            const s = await fresh(request, 'qa.fd');
            const since = new Date().toISOString();
            const cur = await getReservation(request, s, st.res.id);
            // 0.3.6 bổ sung 2 (E04-06): phản hồi EarlyDepartureResult {reservation, earlyDepartureFeeVnd, refundVnd, refundRequestId}
            const r = await call<
              {
                reservation: Reservation;
                earlyDepartureFeeVnd: number;
                refundVnd?: number;
                refundRequestId?: string | null;
              } & ProblemFields
            >(request, 'POST', p3(EP3.earlyDeparture, s, { reservationId: st.res.id }), {
              session: s,
              idempotencyKey: true,
              ifMatch: versionTag(cur.body.version),
              body: {
                newDepartureDate: map(String(o.input.newDepartureDate)),
                noticeGivenAt: new Date(noticeAt).toISOString(),
              },
            });
            expect(r.status, `${ex}: ${JSON.stringify(r.body)}`).toBe(200);
            expect(r.body.reservation?.departureDate).toBe(map(String(o.input.newDepartureDate)));
            expect(r.body.refundVnd ?? 0, `${ex}: refundVnd`).toBe(oracleNum(ex, 'refundVnd'));
            expect(!!r.body.refundRequestId, `${ex}: refundRequestId`).toBe(
              oracleNum(ex, 'refundVnd') > 0,
            );
            // các đêm bỏ mở bán lại (searchAvailability) + lệnh đồng bộ kênh
            const dropped = (o.expected.cancelledNights as string[]).map(map);
            expect(
              await isRoomFree(
                request,
                s,
                st.room,
                dropped[0]!,
                addDays(dropped[dropped.length - 1]!, 1),
              ),
              `${ex}: đêm bỏ mở bán`,
            ).toBe(true);
            const ob = outboxCount('%early_departure%', since);
            if (ob >= 0) expect(ob, `${ex}: outbox`).toBeGreaterThanOrEqual(1);
            const refunds = await approvalsOf(
              request,
              await fresh(request, 'qa.mgr'),
              st.res.code,
              'refund',
            );
            return { r, refunds, s };
          };
          // (a) báo trước 1 ngày (BR-428-01) → yêu cầu hoàn 700.000 chờ MGR duyệt; khai báo NN needs_update
          const a = await early(sa, 'BR-428-01');
          expect(a.refunds).toHaveLength(1);
          expect(a.refunds[0]).toMatchObject({
            status: 'pending',
            amountVnd: oracleNum('BR-428-01', 'refundVnd'),
            requiredRole: 'manager',
          });
          expect((await getRegistration(request, a.s, sa.regId)).body.status).toBe('needs_update');
          // (c) báo lúc 01:00 (trước mốc đổi ngày) = ngày nghiệp vụ hôm trước → vẫn đủ 1 ngày (BR-428-03)
          const cc = await early(sc, 'BR-428-03');
          expect(cc.refunds.map((x) => x.amountVnd)).toEqual([oracleNum('BR-428-03', 'refundVnd')]);
          // (b) báo trong ngày (BR-428-02) → không hoàn
          const b = await early(sb, 'BR-428-02');
          expect(oracleNum('BR-428-02', 'refundVnd')).toBe(0);
          expect(b.refunds, 'không có yêu cầu hoàn').toHaveLength(0);
          fd = await fresh(request, 'qa.fd');
          const fb = await getFolio(request, fd, sb.res.folioId!);
          expect(sumOf(fb, 'early_departure_fee'), 'giữ lại toàn bộ 2 đêm').toBe(2 * rate);
        },
      );
      test(
        'TC-L4-030 US-032/AC1 [A+E · Cao]',
        {
          annotation: [
            { type: 'story', description: 'US-032/AC1' },
            { type: 'endpoints', description: 'getChargeCatalog, addFolioLine, adjustFolioLine' },
          ],
        },
        async ({ request }) => {
          // Tiền điều kiện: Đơn in_house; danh mục phí BR-511
          // Bước: Thêm "Khử mùi thuốc lá" và "Mất/hỏng thẻ phòng" (kèm ảnh); sửa số lượng thẻ 1 → 2
          // Kỳ vọng: Giá mặc định 500.000 và 200.000/thẻ; loại dòng "Phí phạt" (không vào doanh thu phòng); sửa
          //   số lượng được, có nhật ký; 1 khử mùi + 1 thẻ = 700.000
          // Quy tắc: BR-511, BR-904, BR-008
          needClock('TC-L4-030');
          await requireEndpoints(request, 'TC-L4-030', [
            EP3.getChargeCatalog,
            EP3.addFolioLine,
            EP3.adjustFolioLine,
            EP3.uploadAttachment,
          ]);
          const { D, c } = await vday(request, realToday, 4);
          const fd = await fresh(request, 'qa.fd');
          const a = await stay(request, c, fd, '203', D, 1);
          const cat = await call<{
            data: Array<{ code: string; category: string; defaultUnitPriceVnd: number }>;
          }>(request, 'GET', p3(EP3.getChargeCatalog, fd), { session: fd });
          expect(cat.status).toBe(200);
          const smoking = cat.body.data.find((x) => x.code === 'smoking_fee');
          const card = cat.body.data.find((x) => x.code === 'key_card_fee');
          expect(smoking).toMatchObject({
            category: 'penalty',
            defaultUnitPriceVnd: dsParam<number>('smoking_fee'),
          });
          expect(card).toMatchObject({
            category: 'penalty',
            defaultUnitPriceVnd: dsParam<number>('key_card_fee'),
          });
          const o = oracle('BR-511-02'); // 2 thẻ phát, trả 1 + hút thuốc → 700.000
          expect(o.input.smoking).toBe(true);
          const lost = Number(o.input.cardsIssued) - Number(o.input.cardsReturned);
          for (const [code, qty] of [
            ['smoking_fee', 1],
            ['key_card_fee', lost],
          ] as const) {
            const img = await upload(request, fd, 'penalty_evidence', a.res.id);
            const r = await addLine(request, fd, a.res.folioId!, {
              chargeCode: code,
              quantity: qty,
              evidenceAttachmentIds: [img],
            });
            expect(r.status, `${code}: ${JSON.stringify(r.body)}`).toBe(201);
          }
          let f = await getFolio(request, fd, a.res.folioId!);
          const pen = liveLines(f, 'penalty');
          expect(pen).toHaveLength(2);
          for (const l of pen)
            expect(l.revenueGroup, 'phí phạt không vào doanh thu phòng').not.toBe('room');
          expect(sumOf(f, 'penalty')).toBe(oracleNum('BR-511-02', 'penaltyVnd'));
          // FD không sửa được đơn giá của khoản trong danh mục
          const cardLine = pen.find((l) => l.unitPriceVnd === dsParam<number>('key_card_fee'))!;
          const price = await adjustLine(request, fd, a.res.folioId!, cardLine.id, {
            newUnitPriceVnd: 1000,
            reason: 'Thu sua gia',
          });
          expect(price.status).toBe(422);
          expect(fieldCodes(price.body)).toContain('newUnitPriceVnd:PRICE_NOT_EDITABLE');
          // sửa số lượng thẻ 1 → 2: bút toán đảo + dòng mới có lý do (BR-008)
          const adj = await adjustLine(request, fd, a.res.folioId!, cardLine.id, {
            newQuantity: 2,
            reason: 'Khach lam mat them 1 the',
          });
          expect(adj.status, JSON.stringify(adj.body)).toBe(201);
          f = await getFolio(request, fd, a.res.folioId!);
          expect(
            f.lines.some((l) => l.reversalOfId === cardLine.id),
            'dòng đảo',
          ).toBe(true);
          const replaced = liveLines(f, 'penalty').find((l) => l.relatedLineId === cardLine.id);
          expect(replaced?.amountVnd).toBe(2 * dsParam<number>('key_card_fee'));
          // nhật ký tiền: folio_line.adjusted
          const owner = await fresh(request, 'qa.owner');
          const log = await call<{
            data: Array<{ action: string; entityId?: string; reason?: string }>;
          }>(request, 'GET', `/v1/properties/${propertyIdOf(owner)}/audit-events`, {
            session: owner,
            query: { category: 'money', limit: 100 },
          });
          expect(log.status, JSON.stringify(log.body).slice(0, 300)).toBe(200);
          expect(
            log.body.data.some(
              (e) => e.action === 'folio_line.adjusted' && e.entityId === cardLine.id,
            ),
            'nhật ký sửa dòng',
          ).toBe(true);
        },
      );
      test(
        'TC-L4-031 US-032/AC2 [A · Cao]',
        {
          annotation: [
            { type: 'story', description: 'US-032/AC2' },
            { type: 'endpoints', description: 'addFolioLine' },
          ],
        },
        async ({ request }) => {
          // Tiền điều kiện: Như trên
          // Bước: Thêm dòng phí phạt/hư hỏng không ảnh và không ghi chú
          // Kỳ vọng: 422 VALIDATION_FAILED (thiếu bằng chứng)
          // Quy tắc: BR-511, BR-512
          needClock('TC-L4-031');
          await requireEndpoints(request, 'TC-L4-031', [EP3.addFolioLine]);
          const { D, c } = await vday(request, realToday, 4);
          const fd = await fresh(request, 'qa.fd');
          const a = await stay(request, c, fd, '203', D, 1);
          const f0 = await getFolio(request, fd, a.res.folioId!);
          for (const body of [
            { chargeCode: 'smoking_fee', quantity: 1 },
            { chargeCode: 'key_card_fee', quantity: 1, note: 'ab' },
            { chargeCode: 'damage.remote', quantity: 1 },
          ]) {
            const r = await addLine(request, fd, a.res.folioId!, body);
            expect(r.status, JSON.stringify(r.body)).toBe(422);
            expect(r.body.code).toBe('VALIDATION_FAILED');
            expect(fieldCodes(r.body)).toContain('evidenceAttachmentIds:EVIDENCE_REQUIRED');
          }
          expect((await getFolio(request, fd, a.res.folioId!)).lines.length).toBe(f0.lines.length);
        },
      );
      test(
        'TC-L4-032 US-032/AC3 [A+E · Cao]',
        {
          annotation: [
            { type: 'story', description: 'US-032/AC3' },
            { type: 'endpoints', description: 'addFolioLine, getFolio, getGuestFolio' },
          ],
        },
        async ({ request }) => {
          // Tiền điều kiện: Đơn còn phải thu 0
          // Bước: Thêm phí 200.000
          // Kỳ vọng: "Còn phải thu" = 200.000 ở chi tiết đơn và app khách (cùng số)
          // Quy tắc: –
          needClock('TC-L4-032');
          await requireEndpoints(request, 'TC-L4-032', [EP3.addFolioLine, EP3.getCheckoutSummary]);
          const { D, c } = await vday(request, realToday, 4);
          const fd = await fresh(request, 'qa.fd');
          const a = await stay(request, c, fd, '203', D, 1);
          expect((await getFolio(request, fd, a.res.folioId!)).totals.balanceDueVnd).toBe(0);
          const fee = dsParam<number>('key_card_fee'); // 200.000
          const r = await addLine(request, fd, a.res.folioId!, {
            chargeCode: 'key_card_fee',
            quantity: 1,
            note: 'Khach lam mat the phong',
          });
          expect(r.status, JSON.stringify(r.body)).toBe(201);
          expect(r.body.totals.balanceDueVnd).toBe(fee);
          expect((await getFolio(request, fd, a.res.folioId!)).totals.balanceDueVnd).toBe(fee);
          const sum = await checkoutSummary(request, fd, a.res.id);
          expect(sum.status).toBe(200);
          expect(sum.body.balanceDueVnd).toBe(fee);
          // app khách: getGuestFolio (US-111) dời R3 theo R-C – route ĐK-1 không đăng ký ở R2
          expect(await isAvailable(request, 'GET', EP3.getGuestFolio[1])).toBe(false);
          note(
            'R3: "Còn phải thu" trên app khách (getGuestFolio – US-111 dời R3, route ĐK-1 404 ở R2)',
          );
        },
      );
      test(
        'TC-L4-033 US-032/AC4 [A · TB]',
        {
          annotation: [
            { type: 'story', description: 'US-032/AC4' },
            { type: 'endpoints', description: 'addFolioLine, listApprovalRequests' },
          ],
        },
        async ({ request }) => {
          // Tiền điều kiện: Món hư "Đèn ngủ" không có trong bảng BR-512
          // Bước: Lễ tân thêm dòng
          // Kỳ vọng: Tạo yêu cầu định giá cho qa.mgr/qa.owner (SM-10), chưa có số tiền trên folio
          // Quy tắc: BR-512, SM-10
          needClock('TC-L4-033');
          await requireEndpoints(request, 'TC-L4-033', [
            EP3.addFolioLine,
            EP3.listApprovalRequests,
          ]);
          const { D, c } = await vday(request, realToday, 4);
          const fd = await fresh(request, 'qa.fd');
          const a = await stay(request, c, fd, '203', D, 1);
          const f0 = await getFolio(request, fd, a.res.folioId!);
          const proposed = 350000;
          const r = await addLine(request, fd, a.res.folioId!, {
            category: 'damage',
            description: 'Đèn ngủ',
            quantity: 1,
            proposedUnitPriceVnd: proposed,
            note: 'Bien ban: den ngu vo',
          });
          expect(r.status, JSON.stringify(r.body)).toBe(201);
          const line = r.body.lines.find((l) => l.description === 'Đèn ngủ');
          expect(line?.lineState).toBe('pending_approval');
          expect(line?.approvalRequestId).toBeTruthy();
          // chưa có số tiền trên folio
          expect(r.body.totals.totalVnd).toBe(f0.totals.totalVnd);
          expect(r.body.totals.balanceDueVnd).toBe(f0.totals.balanceDueVnd);
          expect(r.body.pendingApprovals).toBe(1);
          const mgr = await fresh(request, 'qa.mgr');
          const reqs = await approvalsOf(request, mgr, a.res.code, 'damage_pricing');
          expect(reqs).toHaveLength(1);
          expect(reqs[0]).toMatchObject({
            status: 'pending',
            amountVnd: proposed,
            requiredRole: 'manager',
          });
          // FD không tự duyệt được
          expect((await approve(request, fd, reqs[0]!.id)).status).toBe(403);
          // MGR duyệt → dòng vào folio
          const ok = await approve(request, mgr, reqs[0]!.id);
          expect(ok.status, JSON.stringify(ok.body)).toBe(200);
          const f1 = await getFolio(request, fd, a.res.folioId!);
          expect(f1.totals.balanceDueVnd).toBe(f0.totals.balanceDueVnd + proposed);
        },
      );
    });
    test.describe('5.2 Trả phòng 3 bước, bill, thu tiền', () => {
      test(
        'TC-L4-040 US-035/AC1 [A+E · Cao]',
        {
          annotation: [
            { type: 'story', description: 'US-035/AC1' },
            { type: 'endpoints', description: 'recordMinibarCheck, getCheckoutSummary' },
          ],
        },
        async ({ request }) => {
          // Tiền điều kiện: Căn 201 tủ chuẩn có 2 lon Coca
          // Bước: Bước 1: nhập Coca còn 0
          // Kỳ vọng: Đã dùng 2; tiền = 2 × giá bán Coca trong danh mục
          // Quy tắc: BR-702, BR-703, BR-426
          needClock('TC-L4-040');
          await requireEndpoints(request, 'TC-L4-040', [
            EP3.recordMinibarCheck,
            EP3.getMinibarStandard,
            EP3.getCheckoutSummary,
          ]);
          const { D, c } = await vday(request, realToday, 4);
          let fd = await fresh(request, 'qa.fd');
          const a = await stay(request, c, fd, '201', D, 1);
          await at(request, vnTime(addDays(D, 1), '10:30'));
          fd = await fresh(request, 'qa.fd');
          const coca = minibarItem('coca');
          const std = await minibarStandard(request, fd, a.res.id);
          const item = std.items.find((i) => i.itemName === coca.name)!;
          expect(item).toMatchObject({ standardQty: coca.standardQtyPerRoom, isFree: false });
          expect(item.unitPriceVnd).toBe(coca.salePriceVnd);
          const s0 = await checkoutSummary(request, fd, a.res.id);
          expect(s0.body.blockers).toContain('minibar_not_checked');
          const r = await minibarCheck(request, fd, a.res.id, { coca: coca.standardQtyPerRoom });
          expect(r.status, JSON.stringify(r.body)).toBe(201);
          const l = r.body.lines.find((x) => x.itemId === item.itemId)!;
          expect(l).toMatchObject({ remainingQty: 0, usedQty: coca.standardQtyPerRoom });
          expect(l.amountVnd).toBe(coca.standardQtyPerRoom * coca.salePriceVnd);
          const s1 = await checkoutSummary(request, fd, a.res.id);
          expect(s1.body.blockers ?? []).not.toContain('minibar_not_checked');
          const mb = s1.body.lines.filter((x) => x.category === 'minibar');
          expect(mb.reduce((x, y) => x + y.amountVnd, 0)).toBe(
            coca.standardQtyPerRoom * coca.salePriceVnd,
          );
          expect(s1.body.balanceDueVnd).toBe(
            s0.body.balanceDueVnd + coca.standardQtyPerRoom * coca.salePriceVnd,
          );
        },
      );
      test(
        'TC-L4-041 US-035/AC2 [A · TB]',
        {
          annotation: [
            { type: 'story', description: 'US-035/AC2' },
            { type: 'endpoints', description: 'recordMinibarCheck' },
          ],
        },
        async ({ request }) => {
          // Tiền điều kiện: Nước suối "miễn phí", chuẩn 2
          // Bước: Nhập còn 0
          // Kỳ vọng: Dòng ghi "Miễn phí", 0 đ; tiêu hao 2 vẫn ghi (trừ kho)
          // Quy tắc: BR-701
          needClock('TC-L4-041');
          await requireEndpoints(request, 'TC-L4-041', [
            EP3.recordMinibarCheck,
            EP3.getMinibarStandard,
          ]);
          const { D, c } = await vday(request, realToday, 4);
          const fd = await fresh(request, 'qa.fd');
          const a = await stay(request, c, fd, '202', D, 1);
          const nuoc = minibarItem('nuoc');
          expect(nuoc.complimentary).toBe(true);
          const f0 = await getFolio(request, fd, a.res.folioId!);
          const r = await minibarCheck(request, fd, a.res.id, { nuoc: nuoc.standardQtyPerRoom });
          expect(r.status, JSON.stringify(r.body)).toBe(201);
          const l = r.body.lines.find((x) => x.itemName === nuoc.name)!;
          expect(l).toMatchObject({ isFree: true, amountVnd: 0, usedQty: nuoc.standardQtyPerRoom });
          expect(r.body.totalVnd).toBe(0);
          const f1 = await getFolio(request, fd, a.res.folioId!);
          expect(sumOf(f1, 'minibar')).toBe(0);
          expect(f1.totals.totalVnd).toBe(f0.totals.totalVnd);
          note(
            'Tồn kho (trừ kho món miễn phí): listItems/stock chưa có trên build – chỉ kiểm tiêu hao trên phiếu kiểm',
          );
        },
      );
      test(
        'TC-L4-042 US-035/AC3 [A+E · TB]',
        {
          annotation: [
            { type: 'story', description: 'US-035/AC3' },
            { type: 'endpoints', description: 'recordMinibarCheck' },
          ],
        },
        async ({ request }) => {
          // Tiền điều kiện: Chuẩn Coca 2
          // Bước: Nhập còn 3; nhập −1
          // Kỳ vọng: Bị chặn (422); giao diện dùng nút +/− không cho vượt khoảng 0…chuẩn
          // Quy tắc: BR-702
          needClock('TC-L4-042');
          await requireEndpoints(request, 'TC-L4-042', [
            EP3.recordMinibarCheck,
            EP3.getMinibarStandard,
          ]);
          const { D, c } = await vday(request, realToday, 4);
          const fd = await fresh(request, 'qa.fd');
          const a = await stay(request, c, fd, '203', D, 1);
          const std = await minibarStandard(request, fd, a.res.id);
          const coca = minibarItem('coca');
          const idx = std.items.findIndex((i) => i.itemName === coca.name);
          const lines = (remaining: number) =>
            std.items.map((i, k) => ({
              itemId: i.itemId,
              remainingQty: k === idx ? remaining : i.standardQty,
            }));
          const over = await minibarCheck(
            request,
            fd,
            a.res.id,
            {},
            { raw: lines(coca.standardQtyPerRoom + 1) },
          );
          expect(over.status, JSON.stringify(over.body)).toBe(422);
          expect(fieldCodes(over.body)).toContain(
            `lines[${idx}].remainingQty:MINIBAR_QTY_OVER_STANDARD`,
          );
          const neg = await minibarCheck(request, fd, a.res.id, {}, { raw: lines(-1) });
          expect(neg.status, JSON.stringify(neg.body)).toBe(422);
          expect(
            fieldCodes(neg.body).some(
              (x) =>
                x.startsWith(`lines.${idx}.remainingQty`) ||
                x.startsWith(`lines[${idx}].remainingQty`),
            ),
          ).toBe(true);
          // thiếu món của tủ chuẩn khi kiểm trả phòng
          const part = await minibarCheck(request, fd, a.res.id, {}, { raw: lines(0).slice(0, 2) });
          expect(part.status).toBe(422);
          expect(fieldCodes(part.body)).toContain('lines:MINIBAR_ITEMS_INCOMPLETE');
          expect(sumOf(await getFolio(request, fd, a.res.folioId!), 'minibar')).toBe(0);
        },
      );
      test(
        'TC-L4-043 US-035/– [U · Cao]',
        {
          annotation: [
            { type: 'story', description: 'US-035/–' },
            { type: 'endpoints', description: 'recordMinibarCheck' },
          ],
        },
        async ({ request }) => {
          // Tiền điều kiện: Bia 35.000, snack 30.000, nước suối miễn phí
          // Bước: Dùng 2 bia, 1 snack, 2 nước
          // Kỳ vọng: Tổng 100.000
          // Quy tắc: BR-702 (ví dụ)
          needClock('TC-L4-043');
          await requireEndpoints(request, 'TC-L4-043', [EP3.recordMinibarCheck]);
          const { D, c } = await vday(request, realToday, 4);
          const fd = await fresh(request, 'qa.fd');
          const a = await stay(request, c, fd, '102', D, 1);
          const used = oracle('BR-702-01').input.used as Record<string, number>;
          const r = await minibarCheck(request, fd, a.res.id, used);
          expect(r.status, JSON.stringify(r.body)).toBe(201);
          expect(r.body.totalVnd).toBe(oracleNum('BR-702-01', 'amountVnd'));
          expect(sumOf(await getFolio(request, fd, a.res.folioId!), 'minibar')).toBe(
            oracleNum('BR-702-01', 'amountVnd'),
          );
          // kiểm lại (bản checkout thứ hai) thay bản cũ: dòng cũ đảo, tổng không cộng dồn (BR-008)
          const again = await minibarCheck(request, fd, a.res.id, used);
          expect(again.status).toBe(201);
          expect(again.body.replacesCheckId).toBe(r.body.id);
          expect(sumOf(await getFolio(request, fd, a.res.folioId!), 'minibar')).toBe(
            oracleNum('BR-702-01', 'amountVnd'),
          );
        },
      );
      test(
        'TC-L4-044 US-036/AC1 [A+E · Cao]',
        {
          annotation: [
            { type: 'story', description: 'US-036/AC1' },
            { type: 'endpoints', description: 'getCheckoutSummary' },
          ],
        },
        async ({ request }) => {
          // Tiền điều kiện: (a) đơn đã hẹn trả muộn 15:00 giá đêm cuối 700.000; (b) đơn không hẹn
          // Bước: Mở bước 2
          // Kỳ vọng: (a) giờ trả mặc định 15:00, phụ thu 210.000; (b) giờ trả mặc định 12:00, phụ thu 0
          // Quy tắc: BR-412, BR-414, BR-401
          needClock('TC-L4-044');
          await requireEndpoints(request, 'TC-L4-044', [
            EP3.getCheckoutSummary,
            EP3.setLateCheckout,
          ]);
          const { D, c } = await vday(request, realToday, 4);
          let fd = await fresh(request, 'qa.fd');
          const o = oracle('BR-412-01');
          const a = await stay(request, c, fd, '203', D, 1, {
            rate: Number(o.input.lastNightRateVnd),
          });
          const b = await stay(request, c, fd, '202', D, 1, {
            rate: Number(o.input.lastNightRateVnd),
          });
          await at(request, vnTime(addDays(D, 1), '09:00'));
          fd = await fresh(request, 'qa.fd');
          const set = await lateCheckout(request, fd, a.res.id, {
            checkoutTime: String(o.input.checkoutTime),
          });
          expect(set.status, JSON.stringify(set.body)).toBe(200);
          const sa = await checkoutSummary(request, fd, a.res.id);
          expect(sa.status, JSON.stringify(sa.body)).toBe(200);
          expect(sa.body.checkoutTime).toBe(String(o.input.checkoutTime));
          expect(sa.body.lateCheckoutSurcharge?.amountVnd).toBe(
            oracleNum('BR-412-01', 'surchargeVnd'),
          );
          const sb = await checkoutSummary(request, fd, b.res.id);
          expect(sb.body.checkoutTime).toBe(dsParam<string>('checkout_time'));
          expect(sb.body.standardCheckoutTime).toBe(dsParam<string>('checkout_time'));
          expect(sb.body.lateCheckoutSurcharge?.amountVnd ?? 0).toBe(0);
        },
      );
      test(
        'TC-L4-045 US-036/AC2 [E · TB]',
        {
          annotation: [
            { type: 'story', description: 'US-036/AC2' },
            { type: 'endpoints', description: 'getCheckoutSummary' },
          ],
        },
        async ({ request }) => {
          // Tiền điều kiện: Bước 2
          // Bước: Nhập giặt ủi 120.000, chọn "Chuyển khoản QR"
          // Kỳ vọng: Bảng tóm tắt "Còn phải thu" tăng 120.000 ngay (không cần lưu)
          // Quy tắc: BR-521, BR-507
          needClock('TC-L4-045');
          await requireEndpoints(request, 'TC-L4-045', [
            EP3.getCheckoutSummary,
            EP3.addFolioLine,
            EP3.createVietQr,
            EP3.setParameter,
          ]);
          const { D, c } = await vday(request, realToday, 4);
          let fd = await fresh(request, 'qa.fd');
          const a = await stay(request, c, fd, '203', D, 1);
          await ensureReceivingAccount(request, D);
          await at(request, vnTime(addDays(D, 1), '10:00'));
          fd = await fresh(request, 'qa.fd');
          const s0 = await checkoutSummary(request, fd, a.res.id);
          // giặt ủi 120.000 = 4 kg × laundry_price_per_kg (BR-507)
          const perKg = dsParam<number>('laundry_price_per_kg');
          const amount = 120000;
          const add = await addLine(request, fd, a.res.folioId!, {
            chargeCode: 'laundry',
            quantity: amount / perKg,
          });
          expect(add.status, JSON.stringify(add.body)).toBe(201);
          const s1 = await checkoutSummary(request, fd, a.res.id);
          expect(s1.body.balanceDueVnd - s0.body.balanceDueVnd).toBe(amount);
          // chọn "Chuyển khoản QR": QR đúng số còn phải thu
          const qr = await call<{ payment: Payment; qrPayload: string }>(
            request,
            'POST',
            p3(EP3.createVietQr, fd, { folioId: a.res.folioId! }),
            { session: fd, idempotencyKey: true, body: { amountVnd: s1.body.balanceDueVnd } },
          );
          expect(qr.status, JSON.stringify(qr.body)).toBe(201);
          expect(emv(qr.body.qrPayload).get('54')).toBe(String(s1.body.balanceDueVnd));
          note(
            '"tăng ngay không cần lưu": giao diện tính trước khi lưu (tầng E) – API kiểm sau khi ghi dòng',
          );
        },
      );
      test(
        'TC-L4-046 US-036/AC3 [A+E · TB]',
        {
          annotation: [
            { type: 'story', description: 'US-036/AC3' },
            { type: 'endpoints', description: 'getCheckoutSummary' },
          ],
        },
        async ({ request }) => {
          // Tiền điều kiện: Đơn Airbnb "OTA thu hộ" có minibar 50.000
          // Bước: Mở bước 2, bước 3
          // Kỳ vọng: Tiền phòng không nằm trong "Còn phải thu"; chỉ còn 50.000 phát sinh tại quầy
          // Quy tắc: BR-307
          needClock('TC-L4-046');
          await requireEndpoints(request, 'TC-L4-046', [EP3.getCheckoutSummary, EP3.getBill]);
          const { D, c } = await vday(request, realToday, 4);
          let fd = await fresh(request, 'qa.fd');
          const a = await stay(request, c, fd, '203', D, 1, { kind: 'airbnb' });
          expect(a.res.paymentModel).toBe('ota_prepaid');
          await at(request, vnTime(addDays(D, 1), '10:00'));
          fd = await fresh(request, 'qa.fd');
          const coca = minibarItem('coca');
          const r = await minibarCheck(request, fd, a.res.id, { coca: 2 });
          expect(r.status, JSON.stringify(r.body)).toBe(201);
          const minibar = 2 * coca.salePriceVnd; // 50.000
          const bill = await call<{
            lines: Array<{ category: string }>;
            otaPrepaidNote?: string | null;
            balanceDueVnd: number;
          }>(request, 'GET', p3(EP3.getBill, fd, { folioId: a.res.folioId! }), { session: fd });
          expect(bill.status).toBe(200);
          expect(
            bill.body.lines.some((l) => l.category === 'room'),
            'bill không in tiền phòng OTA thu hộ',
          ).toBe(false);
          expect(bill.body.otaPrepaidNote).toContain('Đã thu qua');
          const sum = await checkoutSummary(request, fd, a.res.id);
          expect(sum.status).toBe(200);
          // BUG-R2-044 đã sửa ở 229db99 – QA kiểm lại 17/10, đóng; bỏ test.fail có điều kiện để hồi quy báo đỏ
          expect(sum.body.balanceDueVnd).toBe(minibar);
          expect(bill.body.balanceDueVnd).toBe(minibar);
        },
      );
      test(
        'TC-L4-047 US-036/AC3 [A · TB]',
        {
          annotation: [
            { type: 'story', description: 'US-036/AC3' },
            { type: 'endpoints', description: 'getCheckoutSummary' },
          ],
        },
        async ({ request }) => {
          // Tiền điều kiện: Đơn Booking.com "OTA thu hộ", giá đêm cuối 760.000, trả muộn 15:00 đã hẹn
          // Bước: Mở bước 2 và 3
          // Kỳ vọng: Phụ thu trả muộn tính theo chính sách OTTIMO trên giá đêm cuối của đơn (30% = 228.000), là
          //   khoản thu trực tiếp tại quầy; tiền phòng vẫn "Đã thu qua OTA"
          // Quy tắc: BR-415, BR-412
          // GHI CHÚ: BR-415 v0.2 (INV ESC-007 16/10) – cơ sở phụ thu đơn OTA = giá kênh Trực tiếp hiện hành của đêm
          //   đó, KHÔNG phải giá OTA → 30 % × 792.000 (203, ngày thường) = 238.000 (oracle BR-415-01 cùng cơ sở,
          //   cùng bậc 30 %). Số 228.000 của TC (30 % × 760.000) đã cũ – đề nghị QA chính sửa TC.
          needClock('TC-L4-047');
          await requireEndpoints(request, 'TC-L4-047', [
            EP3.getCheckoutSummary,
            EP3.setLateCheckout,
          ]);
          const { D, c } = await vday(request, realToday, 4);
          let fd = await fresh(request, 'qa.fd');
          const o = oracle('BR-415-01');
          const a = await stay(request, c, fd, '203', D, 1, {
            kind: 'booking',
            extra: rates(D, 1, 760000),
          });
          await at(request, vnTime(addDays(D, 1), '09:00'));
          fd = await fresh(request, 'qa.fd');
          const expected = oracleNum('BR-415-01', 'surchargeVnd');
          expect(pctOf(Number(o.input.directCurrentRateVnd), 30)).toBe(expected);
          const set = await lateCheckout(request, fd, a.res.id, {
            checkoutTime: '15:00',
            applySurcharge: true,
            expectedSurchargeVnd: expected,
          });
          expect(set.status, JSON.stringify(set.body)).toBe(200);
          const sum = await checkoutSummary(request, fd, a.res.id);
          expect(sum.body.checkoutTime).toBe('15:00');
          expect(sum.body.lateCheckoutSurcharge?.amountVnd).toBe(expected);
          const late = sum.body.lines.filter((l) => l.category === 'late_checkout');
          expect(late.reduce((x, l) => x + l.amountVnd, 0)).toBe(expected);
          // BUG-R2-044 đã sửa ở 229db99 – QA kiểm lại 17/10, đóng; bỏ test.fail có điều kiện để hồi quy báo đỏ
          expect(sum.body.balanceDueVnd, 'chỉ còn phụ thu thu tại quầy').toBe(expected);
        },
      );
      test(
        'TC-L4-048 US-036/AC3 [A · Cao]',
        {
          annotation: [
            { type: 'story', description: 'US-036/AC3' },
            { type: 'endpoints', description: 'getCheckoutSummary, checkOut' },
          ],
        },
        async ({ request }) => {
          // Tiền điều kiện: Đơn Booking.com khách trả tại chỗ in_house, chưa thu tiền phòng 2.460.000, minibar
          //   50.000
          // Bước: Mở bước 2, 3; hoàn tất khi chưa thu; khách bấm "trả phòng nhanh" trên app
          // Kỳ vọng: "Còn phải thu" = 2.460.000 + 50.000 (khác TC-L4-046 kiểu OTA thu hộ); hoàn tất → 409
          //   BALANCE_DUE; trả phòng nhanh của khách bị chặn (BR-427)
          // Quy tắc: BR-307, SM-01 B18
          needClock('TC-L4-048');
          await requireEndpoints(request, 'TC-L4-048', [
            EP3.getCheckoutSummary,
            EP3.checkOut,
            EP3.reversePayment,
          ]);
          const { D, c } = await vday(request, realToday, 6);
          let fd = await fresh(request, 'qa.fd');
          const nights = 3;
          const rate = 820000; // 3 × 820.000 = 2.460.000
          // nhận phòng cần đủ tiền (BR-402) → thu rồi MGR đảo giao dịch "thu nhầm" để có đơn in_house chưa thu
          const a = await stay(request, c, fd, '203', D, nights, {
            kind: 'booking',
            extra: { paymentModel: 'ota_pay_at_property', ...rates(D, nights, rate) },
          });
          expect(a.res.paymentModel).toBe('ota_pay_at_property');
          const mgr = await fresh(request, 'qa.mgr');
          for (const p of (await getFolio(request, mgr, a.res.folioId!)).payments.filter(
            (x) => x.status === 'succeeded' && !x.reversalOfId,
          )) {
            const rv = await call(
              request,
              'POST',
              p3(EP3.reversePayment, mgr, { paymentId: p.id }),
              {
                session: mgr,
                idempotencyKey: true,
                body: { reason: 'Thu nham – khach tra khi tra phong' },
              },
            );
            expect(rv.status, JSON.stringify(rv.body)).toBe(200);
          }
          await at(request, vnTime(addDays(D, nights), '10:00'));
          fd = await fresh(request, 'qa.fd');
          const coca = minibarItem('coca');
          expect((await minibarCheck(request, fd, a.res.id, { coca: 2 })).status).toBe(201);
          const sum = await checkoutSummary(request, fd, a.res.id);
          expect(sum.body.balanceDueVnd).toBe(nights * rate + 2 * coca.salePriceVnd);
          expect(sum.body.blockers).toContain('balance_due');
          const out = await checkOut(request, fd, a.res.id, { checkoutTime: '10:00' });
          expectProblem(out, 409, 'BALANCE_DUE');
          expect((out.body as { balanceDueVnd?: number }).balanceDueVnd).toBe(
            nights * rate + 2 * coca.salePriceVnd,
          );
          expect((await getReservation(request, fd, a.res.id)).body.status).toBe('in_house');
          note(
            'Trả phòng nhanh của khách trên app (BR-427, US-138 Should) chưa có endpoint ở R2 – không kiểm',
          );
        },
      );
      test(
        'TC-L4-050 US-037/AC1 [A+U · Cao (S)]',
        {
          annotation: [
            { type: 'story', description: 'US-037/AC1' },
            { type: 'endpoints', description: 'getCheckoutSummary, getBill' },
          ],
        },
        async ({ request }) => {
          // Tiền điều kiện: Đơn 3 đêm × 820.000; minibar 25.000; phụ thu trả muộn 210.000 có FOC approved; chưa
          //   cọc
          // Bước: Mở bước 3 – bill
          // Kỳ vọng: Bill: 3 dòng tiền phòng 820.000; 1 dòng minibar 25.000; 1 dòng phụ thu 210.000; 1 dòng FOC
          //   −210.000; tổng 2.485.000; còn phải thu 2.485.000
          // Quy tắc: BR-412, BR-434, BR-008
          // GHI CHÚ: giá đêm cuối 820.000 → phụ thu 15:00 = 30 % × 820.000 = 246.000 (BR-412); 210.000 của TC là của
          //   giá 700.000 (BR-434-01). FOC trừ đúng bằng phụ thu nên tổng vẫn 2.485.000 như TC.
          test.setTimeout(150_000);
          needClock('TC-L4-050');
          await requireEndpoints(request, 'TC-L4-050', [
            EP3.getBill,
            EP3.getCheckoutSummary,
            EP3.setLateCheckout,
            EP3.reversePayment,
          ]);
          const { D, c } = await vday(request, realToday, 6);
          let fd = await fresh(request, 'qa.fd');
          const nights = 3;
          const rate = 820000;
          const a = await stay(request, c, fd, '203', D, nights, { rate });
          // "chưa cọc": nhận phòng cần đủ tiền (BR-402) → MGR đảo các khoản đã thu (ghi nhầm) sau khi nhận phòng
          const mgr = await fresh(request, 'qa.mgr');
          for (const p of (await getFolio(request, mgr, a.res.folioId!)).payments.filter(
            (x) => x.status === 'succeeded' && !x.reversalOfId,
          )) {
            const rv = await call(
              request,
              'POST',
              p3(EP3.reversePayment, mgr, { paymentId: p.id }),
              {
                session: mgr,
                idempotencyKey: true,
                body: { reason: 'Ghi nham – khach chua tra' },
              },
            );
            expect(rv.status, JSON.stringify(rv.body)).toBe(200);
          }
          const D3 = addDays(D, nights);
          await at(request, vnTime(D3, '09:00'));
          fd = await fresh(request, 'qa.fd');
          const coca = minibarItem('coca');
          expect((await minibarCheck(request, fd, a.res.id, { coca: 1 })).status).toBe(201);
          const tier = dsParam<Array<{ until: string; pct: number }>>('late_checkout_tiers')[0]!;
          const late = pctOf(rate, tier.pct);
          const o434 = oracle('BR-434-01');
          const set = await lateCheckout(request, fd, a.res.id, {
            checkoutTime: tier.until,
            applySurcharge: true,
            expectedSurchargeVnd: late,
            requestFocForSurcharge: {
              kind: 'foc',
              amountVnd: late,
              reasonCode: 'regular_vip',
              note: String(o434.input.focReason),
            },
          });
          expect(set.status, JSON.stringify(set.body)).toBe(200);
          const reqs = await approvalsOf(
            request,
            await fresh(request, 'qa.mgr'),
            a.res.code,
            'foc',
          );
          expect(reqs.length).toBeGreaterThan(0);
          // FOC ≤ hạn mức FDL/lần (BR-433-01: 210.000 trong hạn mức FDL) → qa.fdl duyệt
          expect(late).toBeLessThanOrEqual(
            dsParam<{ front_desk_lead: { perTimeVnd: number } }>('foc_limits').front_desk_lead
              .perTimeVnd,
          );
          expect(oracle('BR-433-01').expected.withinLimit).toBe(true);
          const ok = await approve(request, await fresh(request, 'qa.fdl'), reqs[0]!.id);
          expect(ok.status, JSON.stringify(ok.body)).toBe(200);
          const bill = await call<{
            lines: Array<{
              category: string;
              amountVnd: number;
              relatedLineId?: string;
              id: string;
            }>;
            totalVnd: number;
            paidVnd: number;
            balanceDueVnd: number;
          }>(request, 'GET', p3(EP3.getBill, fd, { folioId: a.res.folioId! }), { session: fd });
          expect(bill.status, JSON.stringify(bill.body)).toBe(200);
          const L = bill.body.lines;
          expect(L.filter((l) => l.category === 'room').map((l) => l.amountVnd)).toEqual([
            rate,
            rate,
            rate,
          ]);
          expect(L.filter((l) => l.category === 'minibar').map((l) => l.amountVnd)).toEqual([
            coca.salePriceVnd,
          ]);
          // BR-434-01: dòng phụ thu rồi ngay dưới là FOC âm cùng số, ròng 0
          const i = L.findIndex((l) => l.category === 'late_checkout');
          expect(L[i]!.amountVnd).toBe(late);
          expect(L[i + 1]).toMatchObject({
            category: 'foc',
            amountVnd: -late,
            relatedLineId: L[i]!.id,
          });
          expect(L[i]!.amountVnd + L[i + 1]!.amountVnd).toBe(oracleNum('BR-434-01', 'netVnd'));
          const total = nights * rate + coca.salePriceVnd; // 2.485.000
          expect(bill.body.totalVnd).toBe(total);
          expect(bill.body.paidVnd).toBe(0);
          expect(bill.body.balanceDueVnd).toBe(total);
          const sum = await checkoutSummary(request, fd, a.res.id);
          expect(sum.body.balanceDueVnd).toBe(total);
        },
      );
      test(
        'TC-L4-052 US-037/AC3 [A · Cao]',
        {
          annotation: [
            { type: 'story', description: 'US-037/AC3' },
            { type: 'endpoints', description: 'getBill' },
          ],
        },
        async ({ request }) => {
          // Tiền điều kiện: Đơn có giao dịch: cọc 700.000 succeeded; 300.000 failed; 200.000 reversed (+ dòng
          //   đảo); 100.000 pending
          // Bước: Xem bill
          // Kỳ vọng: "Đã thu" = 700.000 (chỉ succeeded thuần, đã trừ giao dịch đảo)
          // Quy tắc: SM-12, US-119
          // GIẢ ĐỊNH: R2 không sinh được giao dịch `failed` (cổng VNPay/MoMo – R3) → dùng VietQR 300.000 đã
          //   `expired` (cũng không phải succeeded) thay cho khoản failed.
          needClock('TC-L4-052');
          await requireEndpoints(request, 'TC-L4-052', [
            EP3.getBill,
            EP3.createVietQr,
            EP3.reversePayment,
          ]);
          const { D, c } = await vday(request, realToday, 4);
          await ensureReceivingAccount(request, D);
          const fd = await fresh(request, 'qa.fd');
          const deposit = 700000;
          const r = await createReservation(request, fd, {
            ...reservationBody(c, {
              room: room(c, '203'),
              arrival: addDays(D, 1),
              departure: addDays(D, 3),
              guestId: await newGuest(request, fd),
            }),
            initialPayment: { type: 'deposit', method: 'cash', amountVnd: deposit },
          });
          expect(r.status, JSON.stringify(r.body)).toBe(201);
          track('reservation', r.body.id);
          const folioId = r.body.folioId!;
          const qr = (amountVnd: number) =>
            call<{ payment: Payment }>(request, 'POST', p3(EP3.createVietQr, fd, { folioId }), {
              session: fd,
              idempotencyKey: true,
              body: { amountVnd },
            });
          const q300 = await qr(300000);
          expect(q300.status, JSON.stringify(q300.body)).toBe(201);
          const cash = await recordPayment(request, fd, folioId, {
            type: 'charge',
            method: 'cash',
            amountVnd: 200000,
          });
          expect(cash.status).toBe(201);
          const mgr = await fresh(request, 'qa.mgr');
          const rv = await call(
            request,
            'POST',
            p3(EP3.reversePayment, mgr, { paymentId: cash.body.id }),
            {
              session: mgr,
              idempotencyKey: true,
              body: { reason: 'Ghi nham so tien' },
            },
          );
          expect(rv.status).toBe(200);
          const q100 = await qr(100000); // QR mới → QR 300.000 cũ hết hạn ngay (1 QR chờ/folio)
          expect(q100.status).toBe(201);
          const f = await getFolio(request, fd, folioId);
          const st = (id: string) => f.payments.find((p) => p.id === id)?.status;
          expect(st(q300.body.payment.id)).toBe('expired');
          expect(st(cash.body.id)).toBe('reversed');
          expect(st(q100.body.payment.id)).toBe('pending');
          const bill = await call<{ paidVnd: number }>(
            request,
            'GET',
            p3(EP3.getBill, fd, { folioId }),
            {
              session: fd,
            },
          );
          expect(bill.status).toBe(200);
          expect(bill.body.paidVnd).toBe(deposit);
          expect(f.totals.paidVnd).toBe(deposit);
        },
      );
      test(
        'TC-L4-053 US-038/AC1 [A+E · Cao (S)]',
        {
          annotation: [
            { type: 'story', description: 'US-038/AC1' },
            { type: 'endpoints', description: 'getCheckoutSummary, checkOut' },
          ],
        },
        async ({ request }) => {
          // Tiền điều kiện: Đơn khách NN in_house 201, đã thu đủ X, có tiêu hao minibar; ⏱ 15/10 11:40
          // Bước: Bấm "Đã thu X đ – hoàn tất" + xác nhận
          // Kỳ vọng: Đơn checked_out; folio settled với số bill dạng F26-nnnnnn (BR-007); buồng VD; mã cửa "đã
          //   hủy"; việc "Dọn trả phòng" + "Bổ sung minibar"; khai báo → needs_update
          // Quy tắc: SM-01 B18, SM-13 open→settled, SM-14 *→open, SM-11 projected→earned, BR-007, BR-604, SM-03
          //   R9
          needClock('TC-L4-053');
          await requireEndpoints(request, 'TC-L4-053', [EP3.getCheckoutSummary, EP3.checkOut]);
          const { D, c } = await vday(request, realToday, 4);
          let fd = await fresh(request, 'qa.fd');
          const a = await stay(request, c, fd, '201', D, 1, { doc: 'foreign', adults: 1 });
          await confirmRegistration(request, fd, a.regId);
          const D1 = addDays(D, 1);
          await at(request, vnTime(D1, '11:40'));
          fd = await fresh(request, 'qa.fd');
          expect((await minibarCheck(request, fd, a.res.id, { coca: 1, nuoc: 1 })).status).toBe(
            201,
          );
          const sum = await checkoutSummary(request, fd, a.res.id);
          expect(sum.body.blockers).toEqual(['balance_due']);
          const X = sum.body.balanceDueVnd;
          const out = await checkOut(request, fd, a.res.id, {
            checkoutTime: '11:40',
            finalPayment: { type: 'charge', method: 'cash', amountVnd: X },
          });
          expect(out.status, JSON.stringify(out.body)).toBe(200);
          expect(out.body.reservation.status).toBe('checked_out');
          // số bill F{yy}-nnnnnn (BR-007-04: năm theo ngày cấp)
          const tpl = String(oracle('BR-007-04').expected.code); // F26-000123
          const yy = D1.slice(2, 4);
          expect(out.body.billNo).toMatch(
            new RegExp(`^F${yy}-\\d{${tpl.split('-')[1]!.length},}$`),
          );
          const f = await getFolio(request, fd, a.res.folioId!);
          expect(f.status).toBe('settled');
          expect(f.billNo).toBe(out.body.billNo);
          expect(f.totals.balanceDueVnd).toBe(0);
          // buồng VD (SM-03 R9) + việc "Dọn trả phòng" + "Bổ sung minibar"
          expect(storedRoomStatus(c, '201') ?? 'VD').toBe('VD');
          expect(out.body.createdTaskIds).toHaveLength(2);
          // khách NN: khai báo → needs_update (BR-604)
          expect((await getRegistration(request, fd, a.regId)).body.status).toBe('needs_update');
          note(
            'R3: mã cửa "đã hủy" (US-128 dời R3); Sprint 4: tên/loại việc HK (listHkTasks) – kiểm qua createdTaskIds',
          );
        },
      );
      test(
        'TC-L4-054 US-038/AC2 [A · Cao]',
        {
          annotation: [
            { type: 'story', description: 'US-038/AC2' },
            { type: 'endpoints', description: 'addFolioLine, adjustFolioLine' },
          ],
        },
        async ({ request }) => {
          // Tiền điều kiện: Folio settled
          // Bước: (a) qa.fd thêm/sửa dòng; (b) qa.mgr tạo bút toán điều chỉnh có lý do; (c) qa.mgr không lý do
          // Kỳ vọng: (a) 409 FOLIO_LOCKED (hoặc 403); (b) được, dòng adjustment, nhật ký; (c) 422
          // Quy tắc: A32, ERD K7
          // GHI CHÚ: US-038 AC2 chặn FD "sửa" dòng; "thêm" phát sinh sau trả phòng trong cửa sổ BR-427 (c) là
          //   hợp lệ (xem TC-L4-068) – ca này kiểm FD thêm SAU cửa sổ → 409 FOLIO_LOCKED.
          needClock('TC-L4-054');
          await requireEndpoints(request, 'TC-L4-054', [
            EP3.addFolioLine,
            EP3.adjustFolioLine,
            EP3.checkOut,
          ]);
          const { D, c } = await vday(request, realToday, 4);
          let fd = await fresh(request, 'qa.fd');
          const a = await stay(request, c, fd, '202', D, 1);
          const D1 = addDays(D, 1);
          const outAt = await at(request, vnTime(D1, '11:00'));
          fd = await fresh(request, 'qa.fd');
          expect((await minibarCheck(request, fd, a.res.id, { coca: 1 })).status).toBe(201);
          const sum = await checkoutSummary(request, fd, a.res.id);
          const out = await checkOut(request, fd, a.res.id, {
            checkoutTime: '11:00',
            finalPayment: { type: 'charge', method: 'cash', amountVnd: sum.body.balanceDueVnd },
          });
          expect(out.status, JSON.stringify(out.body)).toBe(200);
          const f0 = await getFolio(request, fd, a.res.folioId!);
          expect(f0.status).toBe('settled');
          const line = liveLines(f0, 'minibar')[0]!;
          // (a) FD sửa dòng → 403 (A32); sau cửa sổ BR-427 FD thêm dòng → 409 FOLIO_LOCKED
          const fdAdj = await adjustLine(request, fd, a.res.folioId!, line.id, {
            newQuantity: 2,
            reason: 'Sua so luong',
          });
          expect(fdAdj.status, JSON.stringify(fdAdj.body)).toBe(403);
          const hours = dsParam<number>('post_checkout_charge_hours');
          await at(
            request,
            new Date(new Date(outAt).getTime() + hours * 3_600_000 + 60_000).toISOString(),
          );
          fd = await fresh(request, 'qa.fd');
          const fdAdd = await addLine(request, fd, a.res.folioId!, {
            category: 'fnb',
            description: 'Nuoc ep',
            quantity: 1,
            unitPriceVnd: 30000,
            serviceDate: D1,
          });
          expectProblem(fdAdd, 409, 'FOLIO_LOCKED');
          // (c) MGR không lý do → 422
          const mgr = await fresh(request, 'qa.mgr');
          const noReason = await adjustLine(request, mgr, a.res.folioId!, line.id, {
            newQuantity: 2,
            reason: '',
          });
          expect(noReason.status).toBe(422);
          expect(fieldCodes(noReason.body)).toContain('reason:REASON_REQUIRED');
          // (b) MGR có lý do → bút toán đảo + dòng mới có lý do, nhật ký tiền
          const ok = await adjustLine(request, mgr, a.res.folioId!, line.id, {
            newQuantity: 2,
            reason: 'Kiem lai minibar: dung 2 lon',
          });
          expect(ok.status, JSON.stringify(ok.body)).toBe(201);
          const f1 = await getFolio(request, mgr, a.res.folioId!);
          expect(f1.lines.some((l) => l.reversalOfId === line.id)).toBe(true);
          expect(liveLines(f1, 'minibar').find((l) => l.relatedLineId === line.id)?.amountVnd).toBe(
            2 * line.unitPriceVnd,
          );
          const owner = await fresh(request, 'qa.owner');
          const log = await call<{ data: Array<{ action: string; entityId?: string }> }>(
            request,
            'GET',
            `/v1/properties/${propertyIdOf(owner)}/audit-events`,
            { session: owner, query: { category: 'money', limit: 100 } },
          );
          expect(
            log.body.data.some((e) => e.action === 'folio_line.adjusted' && e.entityId === line.id),
          ).toBe(true);
        },
      );
      test(
        'TC-L4-055 US-038/AC3 [A · Cao (S)]',
        {
          annotation: [
            { type: 'story', description: 'US-038/AC3' },
            { type: 'endpoints', description: 'checkOut' },
          ],
        },
        async ({ request }) => {
          // Tiền điều kiện: Còn phải thu 500.000, chưa ghi giao dịch
          // Bước: (a) qa.fd hoàn tất; (b) qa.mgr ghi công nợ có hạn thanh toán rồi hoàn tất
          // Kỳ vọng: (a) 409 BALANCE_DUE; (b) hoàn tất được, folio có debt_due_date, người duyệt qa.mgr
          // Quy tắc: BR-426, BR-525, A19
          needClock('TC-L4-055');
          await requireEndpoints(request, 'TC-L4-055', [EP3.checkOut]);
          const { D, c } = await vday(request, realToday, 4);
          let fd = await fresh(request, 'qa.fd');
          const a = await stay(request, c, fd, '203', D, 1);
          const D1 = addDays(D, 1);
          await at(request, vnTime(D1, '10:00'));
          fd = await fresh(request, 'qa.fd');
          const due = 500000;
          const add = await addLine(request, fd, a.res.folioId!, {
            category: 'service_fee',
            description: 'Dua don san bay',
            quantity: 1,
            unitPriceVnd: due,
          });
          expect(add.status).toBe(201);
          expect((await minibarCheck(request, fd, a.res.id)).status).toBe(201);
          // (a) FD hoàn tất → 409 BALANCE_DUE; FD ghi công nợ → 403 (A19)
          const fdOut = await checkOut(request, fd, a.res.id, { checkoutTime: '10:00' });
          expectProblem(fdOut, 409, 'BALANCE_DUE');
          expect((fdOut.body as { balanceDueVnd?: number }).balanceDueVnd).toBe(due);
          const debt = { dueDate: addDays(D1, 7), reason: 'Cong ty thanh toan chuyen khoan sau' };
          expect(
            (await checkOut(request, fd, a.res.id, { checkoutTime: '10:00', debt })).status,
          ).toBe(403);
          // (b) MGR ghi công nợ có hạn → hoàn tất
          const mgr = await fresh(request, 'qa.mgr');
          const out = await checkOut(request, mgr, a.res.id, { checkoutTime: '10:00', debt });
          expect(out.status, JSON.stringify(out.body)).toBe(200);
          expect(out.body.reservation.status).toBe('checked_out');
          const f = await getFolio(request, mgr, a.res.folioId!);
          expect(f.status).toBe('settled');
          expect(f.totals.balanceDueVnd).toBe(due);
          // công nợ + hạn + người duyệt: nhật ký tiền reservation.debt_on_checkout (actor qa.mgr)
          const owner = await fresh(request, 'qa.owner');
          const log = await call<{
            data: Array<{
              action: string;
              entityId?: string;
              actorName?: string;
              actorUserId?: string;
              after?: Record<string, unknown>;
              reason?: string;
            }>;
          }>(request, 'GET', `/v1/properties/${propertyIdOf(owner)}/audit-events`, {
            session: owner,
            query: { category: 'money', limit: 100 },
          });
          const e = log.body.data.find(
            (x) => x.action === 'reservation.debt_on_checkout' && x.entityId === a.res.id,
          );
          expect(e, 'nhật ký công nợ').toBeTruthy();
          expect(JSON.stringify(e)).toContain(debt.dueDate);
          expect(e!.actorName, 'người duyệt công nợ').toBe(mgr.me.displayName);
        },
      );
      test(
        'TC-L4-056 US-038/AC4 [A · Cao]',
        {
          annotation: [
            { type: 'story', description: 'US-038/AC4' },
            { type: 'endpoints', description: 'checkOut' },
          ],
        },
        async ({ request }) => {
          // Tiền điều kiện: Folio có FOC escalated
          // Bước: Hoàn tất trả phòng
          // Kỳ vọng: 409 PENDING_APPROVALS
          // Quy tắc: SM-10
          needClock('TC-L4-056');
          await requireEndpoints(request, 'TC-L4-056', [EP3.checkOut, EP3.requestFoc]);
          const { D, c } = await vday(request, realToday, 4);
          let fd = await fresh(request, 'qa.fd');
          const a = await stay(request, c, fd, '203', D, 1);
          const D1 = addDays(D, 1);
          await at(request, vnTime(D1, '10:00'));
          fd = await fresh(request, 'qa.fd');
          const fee = 500000;
          const add = await addLine(request, fd, a.res.folioId!, {
            category: 'service_fee',
            description: 'Tour Langbiang',
            quantity: 1,
            unitPriceVnd: fee,
          });
          expect(add.status).toBe(201);
          const line = add.body.lines.find(
            (l) => l.amountVnd === fee && l.category === 'service_fee',
          )!;
          await payBalance(request, fd, a.res.folioId!);
          // FOC vượt hạn mức FDL (foc_limits.front_desk_lead.perTimeVnd) → lên MGR (escalated)
          const fdl = dsParam<{ front_desk_lead: { perTimeVnd: number } }>('foc_limits')
            .front_desk_lead.perTimeVnd;
          const foc = await call<Approval>(
            request,
            'POST',
            p3(EP3.requestFoc, fd, { folioId: a.res.folioId!, lineId: line.id }),
            {
              session: fd,
              idempotencyKey: true,
              body: {
                kind: 'foc',
                amountVnd: fdl + 100000,
                reasonCode: 'service_recovery',
                note: 'Tour huy do mua',
              },
            },
          );
          expect(foc.status, JSON.stringify(foc.body)).toBe(201);
          expect(['pending', 'escalated']).toContain(foc.body.status);
          expect(foc.body.requiredRole).not.toBe('front_desk_lead');
          expect((await minibarCheck(request, fd, a.res.id)).status).toBe(201);
          const sum = await checkoutSummary(request, fd, a.res.id);
          expect(sum.body.blockers).toContain('pending_approvals');
          const out = await checkOut(request, fd, a.res.id, { checkoutTime: '10:00' });
          expectProblem(out, 409, 'PENDING_APPROVALS');
          expect((out.body as { pendingApprovals?: number }).pendingApprovals).toBe(1);
          // FOC vượt hạn mức FDL lên MGR; MGR duyệt trong hạn mức "một đêm giá phòng" (BR-433, foc_limits
          // manager.perTime = one_night_rate – oracle BR-433-02 escalateTo manager)
          const night = Number((await getReservation(request, fd, a.res.id)).body.totalRoomVnd); // 1 đêm
          expect(fdl + 100000).toBeLessThanOrEqual(night);
          const mgr = await fresh(request, 'qa.mgr');
          const dec = await approve(request, mgr, foc.body.id);
          test.fail(
            dec.status === 403 && dec.body.code === 'APPROVAL_LIMIT_EXCEEDED',
            'BUG-R2-046: MGR không duyệt được FOC trong hạn mức một đêm (foc_limits manager one_night_rate) khi dòng không phải tiền phòng – limitBasisVnd = null → 403 APPROVAL_LIMIT_EXCEEDED, phải lên OWN (BR-433)',
          );
          expect(dec.status, JSON.stringify(dec.body)).toBe(200);
          expect((await checkoutSummary(request, fd, a.res.id)).body.blockers ?? []).not.toContain(
            'pending_approvals',
          );
        },
      );
      test(
        'TC-L4-057 US-038/– [A · Cao]',
        {
          annotation: [
            { type: 'story', description: 'US-038/–' },
            { type: 'endpoints', description: 'checkOut' },
          ],
        },
        async ({ request }) => {
          // Tiền điều kiện: Đơn đủ điều kiện trả phòng
          // Bước: Bấm hoàn tất 2 lần nhanh (cùng Idempotency-Key); gửi lại sau mất mạng
          // Kỳ vọng: Chỉ 1 lần chuyển trạng thái, 1 số bill; lần 2 trả phản hồi cũ Idempotent-Replayed: true
          // Quy tắc: ADR-009 mục 8
          needClock('TC-L4-057');
          await requireEndpoints(request, 'TC-L4-057', [EP3.checkOut]);
          const { D, c } = await vday(request, realToday, 4);
          let fd = await fresh(request, 'qa.fd');
          const a = await stay(request, c, fd, '203', D, 1);
          await at(request, vnTime(addDays(D, 1), '11:00'));
          fd = await fresh(request, 'qa.fd');
          expect((await minibarCheck(request, fd, a.res.id)).status).toBe(201);
          const key = crypto.randomUUID();
          const version = (await getReservation(request, fd, a.res.id)).body.version;
          const body = { checkoutTime: '11:00' };
          const [r1, r2] = await Promise.all([
            checkOut(request, fd, a.res.id, body, { idempotencyKey: key, version }),
            checkOut(request, fd, a.res.id, body, { idempotencyKey: key, version }),
          ]);
          const oks = [r1, r2].filter((r) => r.status === 200);
          expect(
            oks.length,
            `${r1.status} ${JSON.stringify(r1.body)} / ${r2.status} ${JSON.stringify(r2.body)}`,
          ).toBeGreaterThanOrEqual(1);
          for (const r of [r1, r2]) {
            if (r.status !== 200) expectProblem(r, 409, 'IDEMPOTENCY_IN_PROGRESS');
          }
          const billNo = oks[0]!.body.billNo;
          for (const r of oks) expect(r.body.billNo).toBe(billNo);
          // gửi lại sau "mất mạng" (cùng khóa) → phản hồi cũ, Idempotent-Replayed: true
          const again = await checkOut(request, fd, a.res.id, body, {
            idempotencyKey: key,
            version,
          });
          expect(again.status).toBe(200);
          expect(again.headers['idempotent-replayed']).toBe('true');
          expect(again.body.billNo).toBe(billNo);
          const f = await getFolio(request, fd, a.res.folioId!);
          expect(f.billNo).toBe(billNo);
          // đúng một lần chuyển B18
          const h = await call<{ data: Array<{ action?: string }> }>(
            request,
            'GET',
            `/v1/properties/${propertyIdOf(fd)}/reservations/${a.res.id}/history`,
            { session: fd },
          );
          expect(h.status).toBe(200);
          expect(h.body.data.filter((x) => x.action === 'reservation.transition.B18')).toHaveLength(
            1,
          );
          expect(h.body.data.filter((x) => x.action === 'reservation.checked_out')).toHaveLength(1);
        },
      );
      test(
        'TC-L4-064 US-120/AC1 [A+U · Cao]',
        {
          annotation: [
            { type: 'story', description: 'US-120/AC1' },
            { type: 'endpoints', description: 'createVietQr' },
          ],
        },
        async ({ request }) => {
          // Tiền điều kiện: Đã cấu hình tài khoản nhận (dữ liệu test); còn phải thu 1.660.000; mã đơn OTM-00171
          // Bước: Chọn chuyển khoản → tạo VietQR
          // Kỳ vọng: Chuỗi QR theo chuẩn VietQR/EMVCo (CRC hợp lệ), số tiền 1660000, nội dung OTM00171 (không dấu
          //   cách, không gạch)
          // Quy tắc: BR-521, I2, SM-12 *→pending
          needClock('TC-L4-064');
          await requireEndpoints(request, 'TC-L4-064', [EP3.createVietQr, EP3.setParameter]);
          const { D, c } = await vday(request, realToday, 4);
          await ensureReceivingAccount(request, D);
          const fd = await fresh(request, 'qa.fd');
          // đơn 3 đêm × 820.000 đã cọc BR-305 → còn phải thu (= 1.660.000 với cọc 800.000)
          const r = await createReservation(
            request,
            fd,
            reservationBody(c, {
              room: room(c, '203'),
              arrival: addDays(D, 1),
              departure: addDays(D, 4),
              guestId: await newGuest(request, fd),
              extra: rates(addDays(D, 1), 3, 820000),
            }),
          );
          expect(r.status, JSON.stringify(r.body)).toBe(201);
          track('reservation', r.body.id);
          const folioId = r.body.folioId!;
          const due = (await getFolio(request, fd, folioId)).totals.balanceDueVnd;
          expect(due).toBe(3 * 820000 - (r.body.depositPaidVnd ?? 0));
          // vượt còn phải thu → 422 AMOUNT_EXCEEDS_BALANCE (SEC F1)
          const over = await call<ProblemFields & { max?: number }>(
            request,
            'POST',
            p3(EP3.createVietQr, fd, { folioId }),
            {
              session: fd,
              idempotencyKey: true,
              body: { amountVnd: due + 1000 },
            },
          );
          expect(over.status).toBe(422);
          expect(fieldCodes(over.body)).toContain('amountVnd:AMOUNT_EXCEEDS_BALANCE');
          expect(over.body.max).toBe(due);
          const q = await call<{
            payment: Payment;
            qrPayload: string;
            transferContent: string;
            receivingAccountMasked?: string;
          }>(request, 'POST', p3(EP3.createVietQr, fd, { folioId }), {
            session: fd,
            idempotencyKey: true,
            body: { amountVnd: due },
          });
          expect(q.status, JSON.stringify(q.body)).toBe(201);
          // nội dung = mã đơn bỏ dấu gạch (BR-521; mã dạng BR-007-01 OTM-00171 → OTM00171)
          expect(String(oracle('BR-007-01').expected.code)).toMatch(/^OTM-\d+$/);
          const content = r.body.code.replace(/-/g, '');
          expect(q.body.transferContent).toBe(content);
          expect(content).toMatch(/^OTM\d+$/);
          // EMVCo: CRC-16/CCITT-FALSE hợp lệ (tính độc lập), số tiền, tiền tệ, quốc gia, tài khoản nhận, nội dung
          const p = q.body.qrPayload;
          expect(crc16('123456789')).toBe('29B1');
          expect(p.slice(-8, -4)).toBe('6304');
          expect(p.slice(-4)).toBe(crc16(p.slice(0, -4)));
          const t = emv(p);
          expect(t.get('00')).toBe('01');
          expect(t.get('53')).toBe('704');
          expect(t.get('58')).toBe('VN');
          expect(t.get('54')).toBe(String(due));
          const acc = emv(t.get('38')!);
          expect(acc.get('00')).toBe('A000000727');
          const ben = emv(acc.get('01')!);
          expect(ben.get('00')).toBe(TEST_RECEIVING_ACCOUNT.bankBin);
          expect(ben.get('01')).toBe(TEST_RECEIVING_ACCOUNT.accountNo);
          expect(emv(t.get('62')!).get('08')).toBe(content);
          // giao dịch pending, hết hạn ở mốc đổi ngày nghiệp vụ kế tiếp; tài khoản chỉ hiện dạng che
          expect(q.body.payment).toMatchObject({
            method: 'vietqr',
            status: 'pending',
            amountVnd: due,
          });
          expect(new Date(q.body.payment.expiresAt!).getTime()).toBe(
            new Date(vnTime(addDays(D, 1), dsParam<string>('business_day_rollover'))).getTime(),
          );
          expect(q.body.receivingAccountMasked).toBe(
            `${TEST_RECEIVING_ACCOUNT.bankBin.slice(0, 4)}••••${TEST_RECEIVING_ACCOUNT.accountNo.slice(-4)}`,
          );
          expect(JSON.stringify({ ...q.body, qrPayload: undefined })).not.toContain(
            TEST_RECEIVING_ACCOUNT.accountNo,
          );
        },
      );
      test(
        'TC-L4-067 US-038/– [A · TB]',
        {
          annotation: [
            { type: 'story', description: 'US-038/–' },
            { type: 'endpoints', description: 'checkOut, listRoomStatuses, listHkTasks' },
          ],
        },
        async ({ request }) => {
          // Tiền điều kiện: Đơn in_house 201, buồng CL (HK đang dọn phòng khách đang ở)
          // Bước: Hoàn tất trả phòng
          // Kỳ vọng: Đơn checked_out; buồng CL → VD (không kẹt ở CL); việc dọn đang làm chuyển thành "Dọn trả
          //   phòng" hoặc sinh việc mới, qa.hk được báo
          // Quy tắc: SM-03 R9 (từ CL), SM-01 B18
          // GHI CHÚ: state-machines v0.2.2 SM-03 R9: "Nếu đang CL khi khách trả: giữ CL, khi dọn xong → VC" – kỳ
          //   vọng "CL → VD" của TC đã cũ; ca kiểm theo SM-03 hiện hành. Buồng CL giả lập qua DB (HK Sprint 4).
          needClock('TC-L4-067');
          test.skip(
            !CAN_CLEAN_ROOMS,
            'TC-L4-067: cần stack dùng một lần (E2E_COMPOSE_CONTROL=1) để đặt buồng CL – HK Sprint 4',
          );
          await requireEndpoints(request, 'TC-L4-067', [EP3.checkOut]);
          const { D, c } = await vday(request, realToday, 4);
          let fd = await fresh(request, 'qa.fd');
          const a = await stay(request, c, fd, '201', D, 1);
          await at(request, vnTime(addDays(D, 1), '10:00'));
          fd = await fresh(request, 'qa.fd');
          stackSql(`UPDATE room_status SET status = 'CL' WHERE room_id = '${room(c, '201').id}';`);
          expect(storedRoomStatus(c, '201')).toBe('CL');
          expect((await minibarCheck(request, fd, a.res.id)).status).toBe(201);
          const out = await checkOut(request, fd, a.res.id, { checkoutTime: '10:00' });
          expect(out.status, JSON.stringify(out.body)).toBe(200);
          expect(out.body.reservation.status).toBe('checked_out');
          expect(storedRoomStatus(c, '201'), 'SM-03 R9: đang CL giữ CL').toBe('CL');
          expect(
            out.body.createdTaskIds?.length ?? 0,
            'việc "Dọn trả phòng"',
          ).toBeGreaterThanOrEqual(1);
          note(
            'Sprint 4: đổi việc dọn đang làm / báo qa.hk (listHkTasks, listRoomStatuses chưa có trên build)',
          );
        },
      );
      test(
        'TC-L4-068 US-038/– [A · TB]',
        {
          annotation: [
            { type: 'story', description: 'US-038/–' },
            {
              type: 'endpoints',
              description: 'getFolio, addFolioLine, adjustFolioLine, listAttentionItems',
            },
          ],
        },
        async ({ request }) => {
          // Tiền điều kiện: Folio F1 settled ⏱ 15/10 11:40, còn phải thu 0; folio F2 settled, còn phải thu
          //   50.000, không ghi công nợ
          // Bước: ⏱ ngay trước và ngay sau hết thời hạn phát sinh BR-427 ▶ job đóng folio; qa.fd thêm dòng vào
          //   F1; qa.mgr điều chỉnh F1 có lý do
          // Kỳ vọng: Trước hạn: F1 settled, FD ghi phát sinh sau trả phòng nhanh được; sau hạn: F1 closed, FD
          //   thêm dòng → 409 FOLIO_LOCKED, MGR điều chỉnh có lý do được; F2 không tự closed, vào "Cần chú ý"
          // Quy tắc: SM-13 settled→closed, BR-427
          needClock('TC-L4-068');
          await requireEndpoints(request, 'TC-L4-068', [
            EP3.checkOut,
            EP3.addFolioLine,
            EP3.adjustFolioLine,
          ]);
          const { D, c } = await vday(request, realToday, 4);
          let fd = await fresh(request, 'qa.fd');
          const s1 = await stay(request, c, fd, '201', D, 1);
          const s2 = await stay(request, c, fd, '202', D, 1);
          const D1 = addDays(D, 1);
          const outAt = await at(request, vnTime(D1, '11:40'));
          fd = await fresh(request, 'qa.fd');
          for (const s of [s1, s2]) {
            expect((await minibarCheck(request, fd, s.res.id)).status).toBe(201);
            const out = await checkOut(request, fd, s.res.id, { checkoutTime: '11:40' });
            expect(out.status, JSON.stringify(out.body)).toBe(200);
          }
          // F2: phát sinh 50.000 sau trả phòng, không ghi công nợ
          const f2add = await addLine(request, fd, s2.res.folioId!, {
            category: 'fnb',
            description: 'Mini bar ngoai',
            quantity: 1,
            unitPriceVnd: 50000,
          });
          expect(f2add.status, JSON.stringify(f2add.body)).toBe(201);
          expect(f2add.body.totals.balanceDueVnd).toBe(50000);
          const windowEnd =
            new Date(outAt).getTime() + dsParam<number>('post_checkout_charge_hours') * 3_600_000;
          // ngay trước hạn: FD ghi phát sinh sau trả phòng vào F1 được (BR-427 c) – thu luôn để F1 về 0
          await at(request, new Date(windowEnd - 60_000).toISOString());
          await runJobIfAny(request, 'folio.close');
          fd = await fresh(request, 'qa.fd');
          const late = await addLine(request, fd, s1.res.folioId!, {
            category: 'fnb',
            description: 'Do an goi mang ve',
            quantity: 1,
            unitPriceVnd: 40000,
            serviceDate: D1, // ngày dịch vụ trong kỳ ở (hôm nay đã qua ngày đi)
          });
          expect(late.status, JSON.stringify(late.body)).toBe(201);
          expect(late.body.status).toBe('settled');
          await payBalance(request, fd, s1.res.folioId!);
          // ngay sau hạn: FD thêm dòng → 409 FOLIO_LOCKED; MGR điều chỉnh có lý do được
          await at(request, new Date(windowEnd + 60_000).toISOString());
          const job = await runJobIfAny(request, 'folio.close');
          fd = await fresh(request, 'qa.fd');
          const locked = await addLine(request, fd, s1.res.folioId!, {
            category: 'fnb',
            description: 'Them sau han',
            quantity: 1,
            unitPriceVnd: 10000,
            serviceDate: D1,
          });
          expectProblem(locked, 409, 'FOLIO_LOCKED');
          const mgr = await fresh(request, 'qa.mgr');
          const f1 = await getFolio(request, mgr, s1.res.folioId!);
          const target = liveLines(f1, 'fnb')[0]!;
          const adj = await adjustLine(request, mgr, s1.res.folioId!, target.id, {
            newUnitPriceVnd: 30000,
            reason: 'Giam gia mon an theo khieu nai',
          });
          expect(adj.status, JSON.stringify(adj.body)).toBe(201);
          expect(
            (await getFolio(request, mgr, s2.res.folioId!)).status,
            'F2 còn nợ không tự đóng',
          ).not.toBe('closed');
          // J15 folio.close (SM-13 settled→closed, F2 vào "Cần chú ý") chưa đăng ký trên build
          test.skip(
            job === null,
            'J15 folio.close chưa đăng ký trên build – F1 closed / F2 vào "Cần chú ý" chưa kiểm được (phần cửa sổ BR-427 đã kiểm ở trên)',
          );
          expect((await getFolio(request, mgr, s1.res.folioId!)).status).toBe('closed');
          const att = await call<{ data: Array<{ reservationIds?: string[] }> }>(
            request,
            'GET',
            `/v1/properties/${propertyIdOf(mgr)}/attention`,
            { session: mgr },
          );
          expect(att.body.data.some((x) => (x.reservationIds ?? []).includes(s2.res.id))).toBe(
            true,
          );
        },
      );
      test(
        'TC-L4-069 US-120/–; US-119/AC6 [A · Cao]',
        {
          annotation: [
            { type: 'story', description: 'US-120/–; US-119/AC6' },
            { type: 'endpoints', description: 'createVietQr, recordPayment, getFolio' },
          ],
        },
        async ({ request }) => {
          // Tiền điều kiện: VietQR 1.660.000 tạo ⏱ 15/10 10:00 (pending)
          // Bước: (a) qa.fd xác nhận đã thấy tiền; (b) dữ liệu mới: để quá hạn link ▶ job; (c) qa.mgr đối soát
          //   giao dịch (a) với sao kê; (d) qa.fd thử đối soát; (e) ghi thu tiền mặt 500.000; (f) giao dịch
          //   chuyển khoản ghi tay, quá mốc BR-526 không thấy trên sao kê, qa.mgr đánh dấu; (g) qa.sal ghi cọc
          //   chuyển khoản "đã nhận"; qa.mgr lọc danh sách chờ đối soát theo ngày và người ghi
          // Kỳ vọng: (a) succeeded, reconciliation = pending, còn phải thu giảm 1.660.000; (b) expired, còn phải
          //   thu không đổi, tạo được QR mới; (c) reconciled, có reconciled_by, reconciled_at; (d) 403; (e)
          //   reconciliation = not_required, gắn ca đang mở; (f) disputed, cảnh báo đỏ OWN + MGR, đơn giữ trạng
          //   thái; (g) giao dịch mang cờ "chờ đối soát" tới khi MGR/OWN tick; lọc theo ngày/người ghi trả đúng
          //   danh sách
          // Quy tắc: SM-12 pending→succeeded, SM-12 pending→expired, SM-12 pending→reconciled, SM-12
          //   *→not_required, SM-12 pending→disputed, BR-526
          // + tách nhiệm (SEC F5, A46/A46a): tự đối soát → 403 SELF_RECONCILE_FORBIDDEN (OWN được, cờ self);
          //   sale tự xác nhận tiền mặt nộp quầy → 403 (oracle BR-527-05); BR-527-01 quá hạn đối soát → "Cần chú ý"
          test.setTimeout(240_000);
          needClock('TC-L4-069');
          await requireEndpoints(request, 'TC-L4-069', [
            EP3.createVietQr,
            EP3.confirmPaymentReceived,
            EP3.reconcilePayment,
            EP3.confirmCashHandover,
            EP3.listPayments,
            EP3.recordPayment,
          ]);
          const { D, c } = await vday(request, realToday, 6);
          await at(request, vnTime(D, '10:00'));
          await ensureReceivingAccount(request, D);
          let fd = await fresh(request, 'qa.fd');
          let mgr = await fresh(request, 'qa.mgr');
          const book = async (roomNo: string, arrivalOffset: number) => {
            const r = await createReservation(
              request,
              fd,
              reservationBody(c, {
                room: room(c, roomNo),
                arrival: addDays(D, arrivalOffset),
                departure: addDays(D, arrivalOffset + 3),
                guestId: await newGuest(request, fd),
                extra: rates(addDays(D, arrivalOffset), 3, 820000),
              }),
            );
            expect(r.status, JSON.stringify(r.body)).toBe(201);
            track('reservation', r.body.id);
            return r.body as Reservation & { folioId: string };
          };
          const pay = (
            s: StaffSession,
            id: string,
            act: string,
            body: Record<string, unknown>,
            ifMatch?: number,
          ) =>
            call<Payment & ProblemFields>(
              request,
              'POST',
              `/v1/properties/${propertyIdOf(s)}/payments/${id}/actions/${act}`,
              {
                session: s,
                idempotencyKey: true,
                ...(ifMatch !== undefined ? { ifMatch: versionTag(ifMatch) } : {}),
                body,
              },
            );
          const qr = (s: StaffSession, folioId: string, amountVnd: number) =>
            call<{ payment: Payment }>(request, 'POST', p3(EP3.createVietQr, s, { folioId }), {
              session: s,
              idempotencyKey: true,
              body: { amountVnd },
            });
          const A = await book('203', 3);
          const due = (await getFolio(request, fd, A.folioId)).totals.balanceDueVnd; // 1.660.000
          const qa = await qr(fd, A.folioId, due);
          expect(qa.status, JSON.stringify(qa.body)).toBe(201);
          await test.step('(a) FD xác nhận đã thấy tiền → succeeded, chờ đối soát, còn phải thu giảm', async () => {
            const r = await pay(fd, qa.body.payment.id, 'confirm-received', {});
            expect(r.status, JSON.stringify(r.body)).toBe(200);
            expect(r.body).toMatchObject({ status: 'succeeded', reconciliation: 'pending' });
            expect(r.body.confirmedByName).toBe(fd.me.displayName);
            expect((await getFolio(request, fd, A.folioId)).totals.balanceDueVnd).toBe(0);
          });
          await test.step('(d) FD đối soát → 403; (c) MGR đối soát → reconciled', async () => {
            const cur = (await getFolio(request, mgr, A.folioId)).payments.find(
              (p) => p.id === qa.body.payment.id,
            )!;
            expectProblem(
              await pay(fd, cur.id, 'reconcile', { result: 'reconciled' }, cur.version),
              403,
            );
            const r = await pay(mgr, cur.id, 'reconcile', { result: 'reconciled' }, cur.version);
            expect(r.status, JSON.stringify(r.body)).toBe(200);
            expect(r.body.reconciliation).toBe('reconciled');
            expect(r.body.reconciledByName).toBe(mgr.me.displayName);
            expect(r.body.reconciledAt).toBeTruthy();
          });
          await test.step('tách nhiệm: MGR tự đối soát khoản mình ghi → 403; OWN được (cờ self)', async () => {
            const B = await book('202', 3);
            const m = await recordPayment(request, mgr, B.folioId, {
              type: 'charge',
              method: 'bank_transfer',
              amountVnd: 100000,
              note: 'CK E2E MGR',
            });
            expect(m.status).toBe(201);
            expectProblem(
              await pay(mgr, m.body.id, 'reconcile', { result: 'reconciled' }, m.body.version),
              403,
              'SELF_RECONCILE_FORBIDDEN',
            );
            const owner = await fresh(request, 'qa.owner');
            const o = await recordPayment(request, owner, B.folioId, {
              type: 'charge',
              method: 'bank_transfer',
              amountVnd: 100000,
              note: 'CK E2E OWN',
            });
            expect(o.status).toBe(201);
            const self = await pay(
              owner,
              o.body.id,
              'reconcile',
              { result: 'reconciled' },
              o.body.version,
            );
            expect(self.status, JSON.stringify(self.body)).toBe(200);
            expect(self.body.reconciliation).toBe('reconciled');
            // cờ self_reconciled (không có trong DTO – đọc DB của stack dùng một lần) để báo cáo/nhật ký
            if (CAN_CLEAN_ROOMS) {
              expect(
                stackSql(`SELECT self_reconciled FROM payment WHERE id = '${o.body.id}';`).trim(),
              ).toBe('t');
            }
          });
          await test.step('(e) tiền mặt 500.000 → not_required (chưa có ca – R3)', async () => {
            const B = await book('201', 3);
            const r = await recordPayment(request, fd, B.folioId, {
              type: 'charge',
              method: 'cash',
              amountVnd: 500000,
            });
            expect(r.status).toBe(201);
            expect(r.body.reconciliation).toBe('not_required');
            note('(e) "gắn ca đang mở": đóng ca US-124 ở R3 – shiftId chưa có');
          });
          await test.step('(f) CK ghi tay không thấy trên sao kê → MGR disputed, cảnh báo OWN + MGR, đơn giữ trạng thái', async () => {
            const B = await book('103', 3);
            const r = await recordPayment(request, fd, B.folioId, {
              type: 'charge',
              method: 'bank_transfer',
              amountVnd: 300000,
              note: 'CK khach bao da chuyen',
            });
            expect(r.status).toBe(201);
            const noNote = await pay(
              mgr,
              r.body.id,
              'reconcile',
              { result: 'disputed' },
              r.body.version,
            );
            expect(noNote.status).toBe(422);
            const d = await pay(
              mgr,
              r.body.id,
              'reconcile',
              { result: 'disputed', note: 'Khong thay tren sao ke' },
              r.body.version,
            );
            expect(d.status, JSON.stringify(d.body)).toBe(200);
            expect(d.body.reconciliation).toBe('disputed');
            expect(d.body.status, 'không tự đảo').toBe('succeeded');
            expect((await getReservation(request, fd, B.id)).body.status).toBe('confirmed');
            const owner = await fresh(request, 'qa.owner');
            const n = await call<{ data: Array<{ kind: string; refId?: string }> }>(
              request,
              'GET',
              '/v1/me/notifications',
              {
                session: owner,
              },
            );
            expect(
              n.body.data.some((x) => x.kind === 'payment_disputed' && x.refId === r.body.id),
              'cảnh báo OWN',
            ).toBe(true);
          });
          await test.step('(g) SAL ghi cọc CK "đã nhận" → chờ đối soát; MGR lọc theo ngày + người ghi', async () => {
            const sal = await fresh(request, 'qa.sal');
            const { hold } = await makeHold(request, sal, c, {
              rooms: [room(c, '301')],
              arrival: addDays(D, 2),
              nights: 1,
              holdHours: 12,
            });
            const dep = await action(request, sal, hold.id, 'confirm-deposit', {
              payment: {
                type: 'deposit',
                method: 'bank_transfer',
                amountVnd: hold.depositRequiredVnd ?? 0,
                note: 'Khach CK coc',
              },
            });
            expect(dep.status, JSON.stringify(dep.body)).toBe(200);
            mgr = await fresh(request, 'qa.mgr');
            const list = await call<{ data: Array<Payment & { recordedByUserId?: string }> }>(
              request,
              'GET',
              p3(EP3.listPayments, mgr),
              {
                session: mgr,
                query: {
                  reconciliation: 'pending',
                  receivedFrom: D,
                  receivedTo: D,
                  recordedBy: sal.me.id,
                },
              },
            );
            expect(list.status, JSON.stringify(list.body).slice(0, 300)).toBe(200);
            expect(list.body.data.length).toBe(1);
            expect(list.body.data[0]!.recordedByUserId).toBe(sal.me.id);
            expect(list.body.data[0]!.recordedByRole).toBe('sales_staff');
            const salPaymentId = list.body.data[0]!.id;
            const ok = await pay(
              mgr,
              salPaymentId,
              'reconcile',
              { result: 'reconciled' },
              list.body.data[0]!.version,
            );
            expect(ok.status, JSON.stringify(ok.body)).toBe(200);
            const after = await call<{ data: Payment[] }>(
              request,
              'GET',
              p3(EP3.listPayments, mgr),
              {
                session: mgr,
                query: {
                  reconciliation: 'pending',
                  receivedFrom: D,
                  receivedTo: D,
                  recordedBy: sal.me.id,
                },
              },
            );
            expect(after.body.data).toHaveLength(0);
          });
          await test.step('tiền mặt sale nộp quầy (BR-527-05): sale tự xác nhận → 403; FD xác nhận → reconciled', async () => {
            const o = oracle('BR-527-05');
            const sal = await fresh(request, 'qa.sal');
            const { hold } = await makeHold(request, sal, c, {
              rooms: [room(c, '401')],
              arrival: addDays(D, 2),
              nights: 3,
              holdHours: 12,
            });
            const dep = await action(request, sal, hold.id, 'confirm-deposit', {
              payment: { type: 'deposit', method: 'cash', amountVnd: Number(o.input.amountVnd) },
            });
            expect(dep.status, JSON.stringify(dep.body)).toBe(200);
            fd = await fresh(request, 'qa.fd');
            const pending = await call<{ data: Array<Payment & { folioId?: string }> }>(
              request,
              'GET',
              p3(EP3.listPayments, fd),
              {
                session: fd,
                query: { method: 'cash', recordedByRole: 'sales_staff', reconciliation: 'pending' },
              },
            );
            const p = pending.body.data.find((x) => x.reservationCode === hold.code)!;
            expect(p, 'FD thấy tiền mặt sale chờ nộp (own_or_cash_handover)').toBeTruthy();
            const results: string[] = [];
            const self = await pay(
              sal,
              p.id,
              'confirm-cash-handover',
              { result: 'received' },
              p.version,
            );
            expect(self.status).toBe(403);
            results.push('rejected_self_confirm');
            const ok = await pay(
              fd,
              p.id,
              'confirm-cash-handover',
              { result: 'received' },
              p.version,
            );
            expect(ok.status, JSON.stringify(ok.body)).toBe(200);
            expect(ok.body.reconciliation).toBe('reconciled');
            results.push(ok.body.reconciliation!);
            // người đối soát (x-visible-to OWN/MGR): qa.fd – BR-527-05 reconciledBy = lễ tân ca chiều
            const m = await fresh(request, 'qa.mgr');
            const seen = (await getFolio(request, m, String(ok.body.folioId))).payments.find(
              (x) => x.id === p.id,
            );
            expect(seen?.reconciledByName).toBe(fd.me.displayName);
            expect(results).toEqual(o.expected.confirmResults);
          });
          // BR-527-01: khoản CK ghi 15:00 chưa đối soát → "Cần chú ý" đúng sau bank_reconcile_alert_days × 24 giờ
          const o527 = oracle('BR-527-01');
          const recAt = String(o527.input.recordedAt).slice(11, 16);
          await at(request, vnTime(D, recAt));
          fd = await fresh(request, 'qa.fd');
          const B = await book('102', 3);
          const late = await recordPayment(request, fd, B.folioId, {
            type: 'charge',
            method: 'bank_transfer',
            amountVnd: Number(o527.input.amountVnd),
            note: 'CK lon cho doi soat',
          });
          expect(late.status, JSON.stringify(late.body)).toBe(201);
          // (b) QR mới của đơn khác tạo lúc này → quá hạn ở mốc đổi ngày kế tiếp ▶ J24 payment.expire
          const C = await book('101', 3);
          const qc = await qr(fd, C.folioId, 500000);
          expect(qc.status).toBe(201);
          const dueC = (await getFolio(request, fd, C.folioId)).totals.balanceDueVnd;
          await at(
            request,
            new Date(new Date(qc.body.payment.expiresAt!).getTime() + 60_000).toISOString(),
          );
          await runJob(request, 'payment.expire');
          fd = await fresh(request, 'qa.fd');
          await test.step('(b) quá hạn link ▶ J24 → expired, còn phải thu không đổi, tạo được QR mới', async () => {
            const fc = await getFolio(request, fd, C.folioId);
            expect(fc.payments.find((p) => p.id === qc.body.payment.id)?.status).toBe('expired');
            expect(fc.totals.balanceDueVnd).toBe(dueC);
            const confirmLate = await pay(fd, qc.body.payment.id, 'confirm-received', {});
            expect(confirmLate.status).toBe(409);
            const again = await qr(fd, C.folioId, 500000);
            expect(again.status, JSON.stringify(again.body)).toBe(201);
            expect(again.body.payment.status).toBe('pending');
          });
          await test.step('BR-527-01: chờ đối soát quá hạn → reconcileOverdue + "Cần chú ý" reconcile_overdue', async () => {
            const attentionAt = String(o527.expected.attentionAt);
            const days =
              (new Date(attentionAt).getTime() -
                new Date(String(o527.input.recordedAt)).getTime()) /
              864e5;
            expect(days).toBe(dsParam<number>('bank_reconcile_alert_days'));
            const listed = async () => {
              const m = await fresh(request, 'qa.mgr');
              const l = await call<{ data: Array<Payment & { reconcileOverdue?: boolean }> }>(
                request,
                'GET',
                p3(EP3.listPayments, m),
                {
                  session: m,
                  query: { reconciliation: 'pending', method: 'bank_transfer' },
                },
              );
              return { m, row: l.body.data.find((x) => x.id === late.body.id)! };
            };
            await at(
              request,
              new Date(new Date(vnTime(addDays(D, days), recAt)).getTime() - 60_000).toISOString(),
            );
            expect((await listed()).row.reconcileOverdue).toBe(false);
            await at(request, vnTime(addDays(D, days), recAt));
            const { m, row } = await listed();
            expect(row.reconcileOverdue).toBe(true);
            const att = await call<{ data: Array<{ kind: string; count?: number }> }>(
              request,
              'GET',
              `/v1/properties/${propertyIdOf(m)}/attention`,
              { session: m },
            );
            expect(
              att.body.data.some((x) => x.kind === 'reconcile_overdue' && (x.count ?? 0) >= 1),
            ).toBe(true);
          });
        },
      );
      test(
        'TC-L4-070 US-066/AC1 [A · TB]',
        {
          annotation: [
            { type: 'story', description: 'US-066/AC1' },
            { type: 'endpoints', description: 'createItem, recordMinibarCheck' },
          ],
        },
        async ({ request }) => {
          // Tiền điều kiện: qa.owner
          // Bước: Thêm mặt hàng "Trà gừng" giá "miễn phí", chuẩn 2; kiểm minibar dùng 1
          // Kỳ vọng: Không tính tiền, vẫn ghi tiêu hao
          // Quy tắc: BR-701
          needClock('TC-L4-070');
          await requireEndpoints(request, 'TC-L4-070', [EP3.createItem, EP3.recordMinibarCheck]);
          const { D, c } = await vday(request, realToday, 4);
          const owner = await fresh(request, 'qa.owner');
          const item = await call<{ id: string; isFree: boolean }>(
            request,
            'POST',
            p3(EP3.createItem, owner),
            {
              session: owner,
              idempotencyKey: true,
              body: {
                code: `tra_gung_${Date.now()}`,
                name: { vi: 'Trà gừng', en: 'Ginger tea' },
                unit: 'túi',
                costPriceVnd: 3000,
                salePriceVnd: null,
                minibarStandardQty: 2,
              },
            },
          );
          expect(item.status, JSON.stringify(item.body)).toBe(201);
          expect(item.body.isFree).toBe(true);
          const fd = await fresh(request, 'qa.fd');
          const a = await stay(request, c, fd, '203', D, 1);
          const std = await minibarStandard(request, fd, a.res.id);
          const r = await minibarCheck(
            request,
            fd,
            a.res.id,
            {},
            {
              raw: std.items.map((i) => ({
                itemId: i.itemId,
                remainingQty: i.itemId === item.body.id ? 1 : i.standardQty,
              })),
            },
          );
          expect(r.status, JSON.stringify(r.body)).toBe(201);
          expect(r.body.lines.find((l) => l.itemId === item.body.id)).toMatchObject({
            usedQty: 1,
            isFree: true,
            amountVnd: 0,
          });
        },
      );
      test(
        'TC-L4-071 US-066/AC2 [A · TB]',
        {
          annotation: [
            { type: 'story', description: 'US-066/AC2' },
            { type: 'endpoints', description: 'updateItem, recordMinibarCheck, getFolio' },
          ],
        },
        async ({ request }) => {
          // Tiền điều kiện: Folio đã có dòng Coca giá cũ
          // Bước: qa.owner đổi giá Coca; kiểm minibar đơn khác
          // Kỳ vọng: Lần kiểm sau dùng giá mới; dòng folio cũ giữ giá cũ
          // Quy tắc: BR-006
          needClock('TC-L4-071');
          await requireEndpoints(request, 'TC-L4-071', [
            EP3.updateItem,
            EP3.listItems,
            EP3.recordMinibarCheck,
          ]);
          const { D, c } = await vday(request, realToday, 4);
          const fd = await fresh(request, 'qa.fd');
          const coca = minibarItem('coca');
          const a = await stay(request, c, fd, '203', D, 1);
          const b = await stay(request, c, fd, '202', D, 1);
          expect((await minibarCheck(request, fd, a.res.id, { coca: 1 })).status).toBe(201);
          const owner = await fresh(request, 'qa.owner');
          const items = await call<{ data: Array<{ id: string; code: string; version: number }> }>(
            request,
            'GET',
            p3(EP3.listItems, owner),
            { session: owner },
          );
          const it = items.body.data.find((x) => x.code === coca.code)!;
          const newPrice = coca.salePriceVnd + 5000;
          const upd = await call(request, 'PATCH', p3(EP3.updateItem, owner, { itemId: it.id }), {
            session: owner,
            idempotencyKey: true,
            ifMatch: versionTag(it.version),
            body: {
              code: coca.code,
              name: { vi: coca.name },
              unit: 'lon',
              salePriceVnd: newPrice,
              minibarStandardQty: coca.standardQtyPerRoom,
            },
          });
          expect(upd.status, JSON.stringify(upd.body)).toBe(200);
          try {
            expect((await minibarCheck(request, fd, b.res.id, { coca: 1 })).status).toBe(201);
            expect(sumOf(await getFolio(request, fd, b.res.folioId!), 'minibar')).toBe(newPrice);
            expect(sumOf(await getFolio(request, fd, a.res.folioId!), 'minibar')).toBe(
              coca.salePriceVnd,
            );
          } finally {
            const cur = await call<{ data: Array<{ id: string; code: string; version: number }> }>(
              request,
              'GET',
              p3(EP3.listItems, owner),
              { session: owner },
            );
            const v = cur.body.data.find((x) => x.code === coca.code)!.version;
            await call(request, 'PATCH', p3(EP3.updateItem, owner, { itemId: it.id }), {
              session: owner,
              idempotencyKey: true,
              ifMatch: versionTag(v),
              body: {
                code: coca.code,
                name: { vi: coca.name },
                unit: 'lon',
                salePriceVnd: coca.salePriceVnd,
                minibarStandardQty: coca.standardQtyPerRoom,
              },
            });
          }
        },
      );
    });
  },
);
