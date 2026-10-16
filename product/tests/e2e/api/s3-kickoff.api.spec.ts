// E2E API – ca bổ sung bằng chứng nghiệm thu Sprint 2 (PO acceptance mục 4, N-2) viết ở đầu Sprint 3:
// TC-L2-079 (a1–a3) theo ARC s2-contract 3.3, TC-NT-004 (US-001 AC3), TC-NT-009 (US-002 AC3), TC-L2-055 (US-021 AC5),
// TC-L5-016 (US-083 AC2, gồm `ru` – BUG-R2-027), TC-L5-020 (US-082 AC2), TC-L5-035 (US-086 AC5),
// TC-L5-052 (ESC-017 A: tiền sale ghi chờ đối soát, hoa hồng người ghi chỉ đạt sau đối soát – BR-527).
// Dữ liệu tự tạo trên khoảng ngày trống (support/s2.ts), hủy ở afterEach.
import { expect, test } from '@playwright/test';
import {
  call,
  expectProblem,
  isAvailable,
  needSeedPassword,
  propertyIdOf,
  requireEndpoints,
  sessionOrSkip,
  stackToday,
  type Problem,
} from '../support/api.js';
import {
  EP,
  action,
  addDays,
  bookFree,
  calculateQuote,
  cleanupTracked,
  createReservation,
  fieldCodes,
  freeRoom,
  freeWindow,
  getReservation,
  makeHold,
  newGuest,
  quoteInput,
  reservationBody,
  room,
  s2Context,
  saveQuote,
  statusOf,
  track,
  type ProblemFields,
  type Reservation,
} from '../support/s2.js';

const R = '/v1/properties/{propertyId}';
type Ep = [string, string, string];
const QUOTE_TEXT: Ep = ['GET', `${R}/quotes/{quoteId}/text`, 'getQuoteText'];
const LIST_QUOTES: Ep = ['GET', `${R}/quotes`, 'listQuotes'];
const LIST_COMMISSIONS: Ep = ['GET', `${R}/commissions`, 'listCommissions'];
const LIST_PAYMENTS: Ep = ['GET', `${R}/payments`, 'listPayments'];
const RECONCILE: Ep = ['POST', `${R}/payments/{paymentId}/actions/reconcile`, 'reconcilePayment'];

/** Set E2E_BUG_R2_027_FIXED=1 once UXD/BE-B ship the 5 RU strings: the RU case then runs as a normal test. */

function rows<T = Record<string, unknown>>(body: unknown): T[] {
  if (Array.isArray(body)) return body as T[];
  for (const v of Object.values((body ?? {}) as Record<string, unknown>))
    if (Array.isArray(v)) return v as T[];
  return [];
}

test.describe(
  'Sprint 3 kickoff – bằng chứng AC Sprint 2 còn thiếu',
  { tag: ['@api', '@sprint2'] },
  () => {
    test.beforeEach(() => needSeedPassword());
    test.afterEach(async ({ request }) => cleanupTracked(request));

    test('TC-L2-079 (a1)(a2)(a3) đêm lẻ BR-113: căn không lẻ → 422 MIN_STAY_NOT_MET + gợi ý 202 orphanNight; chọn 202 → 201; báo giá theo nhóm → 202', async ({
      request,
    }) => {
      await requireEndpoints(request, 'TC-L2-079', [EP.createReservation, EP.calculateQuote]);
      const fd = await sessionOrSkip(request, 'qa.fd');
      const sal = await sessionOrSkip(request, 'qa.sal');
      const c = await s2Context(request);
      const today = await stackToday(request);
      const r202 = room(c, '202');
      // 202 trống T5 → T3 tuần sau; đặt [T5, T7) và [CN, T3) → đêm T7 là đêm lẻ duy nhất của 202
      const w = await freeWindow(request, fd, r202, 5, {
        today,
        minOffset: 30,
        maxOffset: 300,
        dow: 4,
      });
      const thu = w.arrival;
      const sat = addDays(thu, 2);
      const sun = addDays(thu, 3);
      for (const [a, d] of [
        [thu, sat],
        [sun, addDays(sun, 2)],
      ] as const) {
        const r = await createReservation(
          request,
          fd,
          reservationBody(c, {
            room: r202,
            arrival: a,
            departure: d,
            guestId: await newGuest(request, fd),
          }),
        );
        expect(r.status, `đặt 202 ${a}→${d}: ${JSON.stringify(r.body)}`).toBe(201);
        track('reservation', r.body.id);
      }
      // căn cùng nhóm Lầu 1–2 trống cả T6 → T2 (đêm T7 không lẻ)
      const others = c.rooms.filter(
        (x) => x.roomGroupId === r202.roomGroupId && x.roomNo !== '202',
      );
      const plain = await freeRoom(request, fd, others, addDays(thu, 1), addDays(thu, 4));
      const guestId = await newGuest(request, fd);
      // (a1)
      const a1 = await createReservation(
        request,
        fd,
        reservationBody(c, { room: plain, arrival: sat, departure: sun, guestId }),
      );
      if (a1.status === 201) track('reservation', a1.body.id);
      expect(a1.status, JSON.stringify(a1.body)).toBe(422);
      expect(
        fieldCodes(a1.body as ProblemFields).join(',') + (a1.body as ProblemFields).code,
      ).toContain('MIN_STAY_NOT_MET');
      const sug = rows<{ roomNo?: string; orphanNight?: boolean }>(
        (a1.body as ProblemFields).suggestions ?? [],
      );
      expect(
        sug.find((s) => s.roomNo === '202'),
        `suggestions[] có 202 orphanNight=true: ${JSON.stringify(sug)}`,
      ).toMatchObject({ orphanNight: true });
      // (a2)
      const a2 = await createReservation(
        request,
        fd,
        reservationBody(c, { room: r202, arrival: sat, departure: sun, guestId }),
      );
      expect(a2.status, JSON.stringify(a2.body)).toBe(201);
      track('reservation', a2.body.id);
      expect(a2.body.segments?.[0]?.roomNo ?? '202').toBe('202');
      // (a3) báo giá theo nhóm: sau khi (a2) lấp đêm lẻ, dùng tuần khác → đặt lại cấu hình đêm lẻ trên 202 rồi báo giá
      await action(request, fd, a2.body.id, 'cancel', {
        reasonCode: 'other',
        note: 'E2E TC-L2-079 a3',
      });
      const q = await calculateQuote(request, sal, {
        type: 'short',
        roomGroupId: r202.roomGroupId,
        arrivalDate: sat,
        nights: 1,
        adults: 2,
        channelId: c.channels.find((x) => x.channelGroup === 'direct')?.id,
      });
      expect(q.status, JSON.stringify(q.body)).toBe(200);
      expect(q.body.roomNo, `QuoteCalculation chọn căn đêm lẻ: ${JSON.stringify(q.body)}`).toBe(
        '202',
      );
    });

    test('TC-NT-004 nhật ký đơn ghi đúng người tạo/sửa (qa.fd), trường cũ/mới, không ghi "hệ thống"', async ({
      request,
    }) => {
      await requireEndpoints(request, 'TC-NT-004', [
        EP.createReservation,
        EP.updateReservation,
        EP.getReservationHistory,
      ]);
      const fd = await sessionOrSkip(request, 'qa.fd');
      const c = await s2Context(request);
      const today = await stackToday(request);
      const res = await bookFree(request, fd, c, { room: room(c, '203'), nights: 2, today });
      const path = `/v1/properties/${propertyIdOf(fd)}/reservations/${res.id}`;
      const up = await call<Reservation>(request, 'PATCH', path, {
        session: fd,
        ifMatch: `"${res.version}"`,
        body: { adults: 1 },
      });
      expect(up.status, JSON.stringify(up.body)).toBe(200);
      const h = await call(request, 'GET', `${path}/history`, { session: fd });
      expect(h.status).toBe(200);
      const items = rows<Record<string, unknown>>(h.body);
      expect(items.length, JSON.stringify(h.body).slice(0, 400)).toBeGreaterThanOrEqual(2);
      const actorOf = (e: Record<string, unknown>) =>
        JSON.stringify([e.actorName, e.actorUserId, e.actor, e.changedBy, e.byName, e.by]);
      for (const e of items)
        expect(actorOf(e), `mọi dòng lịch sử ghi người = qa.fd: ${JSON.stringify(e)}`).toMatch(
          new RegExp(`${fd.me.id}|${fd.me.displayName}`),
        );
      const change = items.find((e) => JSON.stringify(e).includes('adults'));
      expect(change, 'có dòng đổi số khách').toBeTruthy();
      expect(JSON.stringify(change)).toMatch(/2[^0-9][\s\S]*1|"from":2|"old":2/);
      expect(JSON.stringify(items)).not.toMatch(/"(system|hệ thống)"/i);
    });

    test('TC-NT-009 qa.fdsal (FD + SAL): tạo đơn được; màn Sale chỉ thấy báo giá của mình; thấy mọi đơn; hoa hồng của mình', async ({
      request,
    }) => {
      await requireEndpoints(request, 'TC-NT-009', [
        EP.createReservation,
        LIST_QUOTES,
        EP.listReservations,
        EP.saveQuote,
      ]);
      const fdsal = await sessionOrSkip(request, 'qa.fdsal');
      const sal = await sessionOrSkip(request, 'qa.sal');
      const fd = await sessionOrSkip(request, 'qa.fd');
      const c = await s2Context(request);
      const today = await stackToday(request);
      // (1) quyền FD
      const mine = await bookFree(request, fdsal, c, { room: room(c, '101'), nights: 2, today });
      const other = await bookFree(request, fd, c, { room: room(c, '102'), nights: 2, today });
      // (2) báo giá: một của qa.fdsal, một của qa.sal
      const mk = async (s: typeof sal, roomNo: string) => {
        const rm = room(c, roomNo);
        const w = await freeWindow(request, s, rm, 2, { today });
        const q = await saveQuote(request, s, {
          ...quoteInput(c, { room: rm, arrival: w.arrival, nights: 2 }),
          guestId: await newGuest(request, s),
        });
        expect(q.status, JSON.stringify(q.body)).toBe(201);
        return q.body.id;
      };
      const qMine = await mk(fdsal, '103');
      const qSal = await mk(sal, '201');
      const quotes = await call(request, 'GET', `/v1/properties/${propertyIdOf(fdsal)}/quotes`, {
        session: fdsal,
        query: { limit: 100 },
      });
      expect(quotes.status).toBe(200);
      const ids = rows<{ id: string }>(quotes.body).map((x) => x.id);
      expect(ids).toContain(qMine);
      // rbac quy tắc 2: quyền = FD ∪ SAL; "chỉ của mình" áp ở MÀN Sale. listQuotes không có tham số màn/phạm vi →
      // API trả hợp (FD xem mọi báo giá). Phần "màn Sale chỉ của mình" kiểm ở UI (H12) – câu hỏi Q-QA-S3-01 cho BA/ARC.
      expect(ids, 'API listQuotes theo quyền hợp FD ∪ SAL').toContain(qSal);
      test.info().annotations.push({
        type: 'open-question',
        description:
          'Q-QA-S3-01: màn Sale của người FD+SAL lọc "của mình" bằng gì? listQuotes chưa có tham số scope',
      });
      // (3) màn Lễ tân: thấy đơn của người khác
      const g = await getReservation(request, fdsal, other.id);
      expect(g.status, 'quyền FD xem mọi đơn').toBe(200);
      expect(mine.id).toBeTruthy();
      // (4) hoa hồng: chỉ của mình (endpoint có thể chưa có – Sprint 3)
      if (await isAvailable(request, LIST_COMMISSIONS[0], LIST_COMMISSIONS[1])) {
        const cm = await call(request, 'GET', `/v1/properties/${propertyIdOf(fdsal)}/commissions`, {
          session: fdsal,
          query: { limit: 100 },
        });
        expect(cm.status).toBe(200);
        for (const x of rows<Record<string, unknown>>(cm.body))
          expect(JSON.stringify(x), 'chỉ hoa hồng của qa.fdsal').not.toMatch(/QA SAL\b/);
      } else
        test
          .info()
          .annotations.push({ type: 'pending', description: 'listCommissions chưa có trên build' });
    });

    test('TC-L2-055 dời ngày (đổi thay hủy): FD 403; MGR lần 1 giữ confirmed + cọc; lần 2 bị chặn', async ({
      request,
    }) => {
      await requireEndpoints(request, 'TC-L2-055', [EP.createReservation, EP.moveReservation]);
      const fd = await sessionOrSkip(request, 'qa.fd');
      const mgr = await sessionOrSkip(request, 'qa.mgr');
      const c = await s2Context(request);
      const today = await stackToday(request);
      const rm = room(c, '201');
      // dời trong reschedule_window_months (DS-E 3 tháng) TÍNH TỪ NGÀY ĐẾN CŨ (B8, BR-309): đơn gốc 30–120 ngày
      // tới, ngày mới = ngày đến cũ + 20…60 ngày (bản cũ chọn ngẫu nhiên 150–200 ngày từ hôm nay → có lúc vượt
      // cửa sổ so với đơn gốc gần → 422 VALUE_OUT_OF_RANGE, ca chập chờn)
      const orig = await freeWindow(request, fd, rm, 2, { today, minOffset: 30, maxOffset: 120 });
      const created = await createReservation(
        request,
        fd,
        reservationBody(c, {
          room: rm,
          arrival: orig.arrival,
          departure: orig.departure,
          guestId: await newGuest(request, fd),
        }),
      );
      test.skip(created.status === 409, 'môi trường: khoảng vừa kiểm trống đã bị ca song song lấy');
      expect(created.status, JSON.stringify(created.body)).toBe(201);
      track('reservation', created.body.id);
      const res = created.body;
      const fromOrig = Math.round((Date.parse(orig.arrival) - Date.parse(today)) / 86_400_000);
      const target = await freeWindow(request, fd, rm, 2, {
        today,
        minOffset: fromOrig + 20,
        maxOffset: fromOrig + 60,
      });
      const body = {
        mode: 'postpone_instead_of_cancel',
        arrivalDate: target.arrival,
        departureDate: target.departure,
        reasonCode: 'guest_request',
      };
      // (1) FD → 403
      expectProblem(await action(request, fd, res.id, 'move', body), 403);
      // (2) MGR lần 1
      const before = await getReservation(request, mgr, res.id);
      const m1 = await action(request, mgr, res.id, 'move', body);
      expect(m1.status, JSON.stringify(m1.body)).toBe(200);
      const after = await getReservation(request, mgr, res.id);
      expect(after.body.status).toBe('confirmed');
      expect(after.body.arrivalDate).toBe(target.arrival);
      expect(after.body.depositPaidVnd, 'giữ nguyên cọc').toBe(before.body.depositPaidVnd);
      // (3) lần 2 → chặn (chỉ 1 lần – BR-309)
      const again = await freeWindow(request, fd, rm, 2, {
        today,
        minOffset: fromOrig + 65,
        maxOffset: fromOrig + 85,
      });
      const m2 = await action(request, mgr, res.id, 'move', {
        ...body,
        arrivalDate: again.arrival,
        departureDate: again.departure,
      });
      expect([409, 422], statusOf(m2)).toContain(m2.status);
    });

    test('TC-L5-016 (en) văn bản báo giá tiếng Anh: không lẫn tiếng Việt, có ngày hết hiệu lực', async ({
      request,
    }) => {
      await requireEndpoints(request, 'TC-L5-016', [EP.saveQuote, QUOTE_TEXT]);
      const sal = await sessionOrSkip(request, 'qa.sal');
      const c = await s2Context(request);
      const today = await stackToday(request);
      const rm = room(c, '301');
      const w = await freeWindow(request, sal, rm, 2, { today });
      const q = await saveQuote(request, sal, {
        ...quoteInput(c, { room: rm, arrival: w.arrival, nights: 2 }),
        guestId: await newGuest(request, sal),
      });
      expect(q.status, JSON.stringify(q.body)).toBe(201);
      const r = await call<{ locale: string; text: string }>(
        request,
        'GET',
        `/v1/properties/${propertyIdOf(sal)}/quotes/${q.body.id}/text`,
        { session: sal, query: { locale: 'en' } },
      );
      expect(r.status, JSON.stringify(r.body)).toBe(200);
      expect(r.body.locale).toBe('en');
      expect(r.body.text, 'không lẫn chữ tiếng Việt có dấu').not.toMatch(
        /[ăâđêôơưạảấầẩẫậắằẳẵặẹẻẽếềểễệịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i,
      );
      // expiresAt là mốc LOẠI TRỪ (vd. 2026-10-21T00:00+07:00) – văn bản ghi thời điểm cuối còn hiệu lực
      // ("23:59 20/10/2026"): so ngày của (expiresAt − 1 ms) theo giờ VN, đủ dd/mm/yyyy (bản cũ so "20" lọt cả "2026")
      const last = new Date(Date.parse(q.body.expiresAt) - 1).toLocaleDateString('en-GB', {
        timeZone: 'Asia/Ho_Chi_Minh',
      });
      expect(r.body.text, `có ngày hết hiệu lực ${last}`).toContain(last);
    });

    test('TC-L5-016 (ru) văn bản báo giá tiếng Nga: chữ Kirin, không rơi về mẫu tiếng Anh (hồi quy BUG-R2-027)', async ({
      request,
    }) => {
      // BUG-R2-027 Closed (S3 testing 17/10): BE-B sinh lại quote-copy.ts với 5 chuỗi RU của UXD – ca chạy thường
      await requireEndpoints(request, 'TC-L5-016', [EP.saveQuote, QUOTE_TEXT]);
      const sal = await sessionOrSkip(request, 'qa.sal');
      const c = await s2Context(request);
      const today = await stackToday(request);
      const rm = room(c, '401');
      const w = await freeWindow(request, sal, rm, 2, { today });
      const q = await saveQuote(request, sal, {
        ...quoteInput(c, { room: rm, arrival: w.arrival, nights: 2 }),
        guestId: await newGuest(request, sal),
      });
      expect(q.status, JSON.stringify(q.body)).toBe(201);
      const get = (locale: string) =>
        call<{ locale: string; text: string }>(
          request,
          'GET',
          `/v1/properties/${propertyIdOf(sal)}/quotes/${q.body.id}/text`,
          { session: sal, query: { locale } },
        );
      const en = await get('en');
      const ru = await get('ru');
      expect(ru.status, JSON.stringify(ru.body)).toBe(200);
      expect(ru.body.text, 'có chữ Kirin').toMatch(/[А-Яа-яЁё]{3,}/);
      // không còn câu mẫu EN: lấy các từ Latin ≥ 5 chữ của bản EN (bỏ tên căn/số), không được xuất hiện trong bản RU
      const enWords = [...new Set(en.body.text.match(/\b[A-Za-z]{5,}\b/g) ?? [])].filter(
        (x) =>
          !/^(OTTIMO|Boutique|Stay|Valley|Velvet|Ivory|Ember|Pine|Amber|Fern|Bloom|Mist|Sage|Zalo|VietQR)$/i.test(
            x,
          ),
      );
      const leaked = enWords.filter((x) => ru.body.text.includes(x));
      expect(leaked, `câu mẫu EN lọt vào bản RU: ${leaked.join(', ')}`).toEqual([]);
    });

    test('TC-L5-020 ngày đến đã qua: calculateQuote/saveQuote từ chối, không tạo được giữ chỗ', async ({
      request,
    }) => {
      await requireEndpoints(request, 'TC-L5-020', [EP.calculateQuote, EP.saveQuote]);
      const sal = await sessionOrSkip(request, 'qa.sal');
      const c = await s2Context(request);
      const today = await stackToday(request);
      const input = quoteInput(c, { room: room(c, '103'), arrival: addDays(today, -1), nights: 1 });
      const calc = await calculateQuote(request, sal, input);
      expect(calc.status, JSON.stringify(calc.body)).toBe(422);
      const save = await saveQuote(request, sal, {
        ...input,
        guestId: await newGuest(request, sal),
      });
      if (save.status === 201) track('reservation', save.body.id);
      expect(save.status, JSON.stringify(save.body)).toBe(422);
      test.info().annotations.push({
        type: 'actual-code',
        description: `${(calc.body as Problem).code} ${JSON.stringify((calc.body as Problem).errors ?? [])}`,
      });
    });

    test('TC-L5-035 nhật ký tiền: SAL xác nhận cọc → dòng có số tiền, cách thanh toán, người xác nhận qa.sal, thời điểm', async ({
      request,
    }) => {
      await requireEndpoints(request, 'TC-L5-035', [
        EP.saveQuote,
        EP.createHoldFromQuote,
        EP.confirmDeposit,
        EP.listAuditEvents,
      ]);
      const sal = await sessionOrSkip(request, 'qa.sal');
      const owner = await sessionOrSkip(request, 'qa.owner');
      const c = await s2Context(request);
      const today = await stackToday(request);
      const { hold } = await makeHold(request, sal, c, {
        rooms: c.rooms,
        arrival: addDays(today, 40 + Math.floor(Math.random() * 100)),
        nights: 2,
        holdHours: 24,
      });
      const amount = hold.depositRequiredVnd ?? 0;
      const r = await action(
        request,
        sal,
        hold.id,
        'confirm-deposit',
        { payment: { type: 'deposit', method: 'bank_transfer', amountVnd: amount } },
        { version: hold.version },
      );
      expect(r.status, JSON.stringify(r.body)).toBe(200);
      const a = await call(request, 'GET', `/v1/properties/${propertyIdOf(owner)}/audit-events`, {
        session: owner,
        query: { limit: 100, actorUserId: sal.me.id },
      });
      expect(a.status).toBe(200);
      // mọi dòng nhật ký của đơn này (xác nhận cọc + giao dịch tiền nếu tách dòng)
      const hits = rows<Record<string, unknown>>(a.body).filter((e) =>
        JSON.stringify(e).includes(hold.code),
      );
      const txt = JSON.stringify(hits);
      test.info().annotations.push({ type: 'audit', description: txt.slice(0, 800) });
      expect(hits.length, `nhật ký tiền có dòng của ${hold.code}`).toBeGreaterThan(0);
      expect(txt, 'số tiền').toContain(String(amount));
      expect(txt, 'người xác nhận').toMatch(new RegExp(`${sal.me.id}|${sal.me.displayName}`));
      expect(txt, 'cách thanh toán').toContain('bank_transfer');
      expect(txt).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);
    });

    test('TC-L5-052 ESC-017 A: tiền SAL ghi → chờ đối soát, hoa hồng chưa đạt; SAL tự đối soát 403; MGR đối soát → đạt', async ({
      request,
    }) => {
      await requireEndpoints(request, 'TC-L5-052', [
        EP.saveQuote,
        EP.createHoldFromQuote,
        EP.confirmDeposit,
        LIST_PAYMENTS,
        RECONCILE,
      ]);
      const sal = await sessionOrSkip(request, 'qa.sal');
      const mgr = await sessionOrSkip(request, 'qa.mgr');
      const c = await s2Context(request);
      const today = await stackToday(request);
      const { hold } = await makeHold(request, sal, c, {
        rooms: c.rooms,
        arrival: addDays(today, 40 + Math.floor(Math.random() * 100)),
        nights: 2,
        holdHours: 24,
      });
      const amount = hold.depositRequiredVnd ?? 0;
      const r = await action(
        request,
        sal,
        hold.id,
        'confirm-deposit',
        { payment: { type: 'deposit', method: 'bank_transfer', amountVnd: amount } },
        { version: hold.version },
      );
      expect(r.status, JSON.stringify(r.body)).toBe(200);
      const pid = propertyIdOf(mgr);
      const pending = await call(request, 'GET', `/v1/properties/${pid}/payments`, {
        session: mgr,
        query: { reconciliation: 'pending', limit: 100 },
      });
      expect(pending.status).toBe(200);
      const pay = rows<{
        id: string;
        reservationCode?: string;
        amountVnd: number;
        version?: number;
      }>(pending.body).find((p) => p.reservationCode === hold.code && p.amountVnd === amount);
      expect(pay, 'giao dịch SAL ghi nằm ở danh sách chờ đối soát').toBeTruthy();
      const comm = async () =>
        rows<{ reservationCode?: string; status?: string }>(
          (
            await call(request, 'GET', `/v1/properties/${pid}/commissions`, {
              session: mgr,
              query: { limit: 100 },
            })
          ).body,
        ).find((x) => x.reservationCode === hold.code)?.status;
      expect(await comm(), 'hoa hồng người ghi chưa đạt khi tiền chưa đối soát').not.toBe('earned');
      const rec = (s: typeof sal) =>
        call(request, 'POST', `/v1/properties/${pid}/payments/${pay!.id}/actions/reconcile`, {
          session: s,
          idempotencyKey: true,
          ifMatch: `"${pay!.version ?? 0}"`,
          body: { result: 'reconciled', note: 'E2E khớp sao kê' },
        });
      expectProblem(await rec(sal), 403);
      const ok = await rec(mgr);
      expect(ok.status, JSON.stringify(ok.body)).toBe(200);
      expect(await comm(), 'hoa hồng đạt sau đối soát (BR-527)').toBe('earned');
    });
  },
);
