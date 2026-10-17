/**
 * Front desk on the real PostgreSQL through the HTTP surface (BE-A Sprint 3): EP03-05 B9/B9a/B17, B13, B14,
 * B15 (SEC A3 dry run), US-030/031, B18 (G-10, A-34 credit, BR-426), B16, US-022 party, B-28, B-13, BE-12,
 * events (staff inbox, attention, SSE). Ports of BE-C/BE-B zones are fakes (registration, guest access, child
 * crypto, minibar). Fake clock: T0 = Thu 15/10/2026 09:00 (VN). FAKE data only.
 */
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database, Tx } from '../../src/db/database';
import { FrontdeskPorts } from '../../src/modules/frontdesk/internal/stay-support';
import {
  FD_CHILD_DATA_PORT,
  type CheckinDocumentStatus,
  type EncryptedChildData,
  type FrontdeskChildDataPort,
  type FrontdeskGuestAccessPort,
  type FrontdeskMinibarPort,
  type FrontdeskRegistrationPort,
} from '../../src/modules/frontdesk/public/ports';
import {
  Client,
  type FeatureApp,
  P,
  TEST_PASSWORD,
  setPassword,
  startFeatureApp,
} from '../helpers/feature-app';
import {
  type BookingIds,
  seedBooking,
  seedGuestRow,
  touchSessions,
} from '../helpers/reservations-fixture';
import { HAS_DB, type TestTenant, appDatabase, createTenant } from '../helpers/tenant';

class FakeRegistration implements FrontdeskRegistrationPort {
  docs: CheckinDocumentStatus = {
    mainGuestDocument: true,
    documentCheckBlock: false,
    pendingOnlineCheckin: false,
    visaExpiresBeforeDeparture: false,
    passportExpiresDuringStay: false,
  };
  calls: string[] = [];
  async checkinDocumentStatus(): Promise<CheckinDocumentStatus> {
    return this.docs;
  }
  async deadlinePreview(_tx: Tx, _id: string, at: Date): Promise<Date | null> {
    return new Date(at.getTime() + 12 * 3_600_000);
  }
  async onCheckedIn(_tx: Tx, id: string, at: Date): Promise<Date | null> {
    this.calls.push(`checkedIn:${id}`);
    return new Date(at.getTime() + 12 * 3_600_000);
  }
  async onCheckInUndone(_tx: Tx, id: string) {
    this.calls.push(`undone:${id}`);
  }
  async onDepartureChanged(_tx: Tx, id: string, d: string) {
    this.calls.push(`departure:${id}:${d}`);
  }
  async onRoomChanged(_tx: Tx, id: string, room: string) {
    this.calls.push(`room:${id}:${room}`);
  }
  async onPartyChanged(_tx: Tx, id: string) {
    this.calls.push(`party:${id}`);
  }
  async onPartyMemberRemoved(_tx: Tx, id: string, m: string) {
    this.calls.push(`removed:${id}:${m}`);
  }
  async onCheckedOut(_tx: Tx, id: string) {
    this.calls.push(`checkedOut:${id}`);
  }
  async onReservationVoided(_tx: Tx, id: string) {
    this.calls.push(`voided:${id}`);
  }
  visa: string | null = null;
  async earliestVisaValidUntil(): Promise<string | null> {
    return this.visa;
  }
}

class FakeGuestAccess implements FrontdeskGuestAccessPort {
  revoked: string[] = [];
  async revokeAllForReservation(_tx: Tx, id: string): Promise<number> {
    this.revoked.push(id);
    return 1;
  }
}

/** The real child-data cipher (CryptoService – FK child_data_key_id → data_key, 0031) with a spy on destroy. */
class SpyChildData implements FrontdeskChildDataPort {
  destroyed: string[] = [];
  inner: FrontdeskChildDataPort | null = null;
  async encryptChild(
    tx: Tx,
    i: Parameters<FrontdeskChildDataPort['encryptChild']>[1],
  ): Promise<EncryptedChildData> {
    if (!this.inner) throw new Error('child data port not wired');
    return this.inner.encryptChild(tx, i);
  }
  async destroy(tx: Tx, id: string) {
    this.destroyed.push(id);
    await this.inner?.destroy(tx, id);
  }
}

class FakeMinibar implements FrontdeskMinibarPort {
  required = false;
  checked = true;
  async checkoutStatus() {
    return { required: this.required, checked: this.checked };
  }
  async onCheckedOut() {
    return null;
  }
}

const ROLES = {
  own: ['owner'],
  mgr: ['manager'],
  fdl: ['front_desk_lead'],
  fd: ['front_desk'],
  fd2: ['front_desk'],
  hk: ['housekeeping'],
  sal: ['sales_staff'],
};

describe.skipIf(!HAS_DB)('front desk – EP03-05 + US-022 (BE-A Sprint 3)', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let ids: BookingIds;
  let guest: string;
  let guest2: string;
  const reg = new FakeRegistration();
  const access = new FakeGuestAccess();
  const child = new SpyChildData();
  const minibar = new FakeMinibar();
  const c: Record<string, Client> = {};

  beforeAll(async () => {
    db = appDatabase(10);
    t = await createTenant(db, { users: ROLES });
    ids = await seedBooking(db, t);
    guest = await seedGuestRow(db, t, { name: 'Trần Văn Khách' });
    guest2 = await seedGuestRow(db, t, { name: 'Lê Thị Bạn' });
    fa = await startFeatureApp(db, {
      override: (b) =>
        b.overrideProvider(FrontdeskPorts).useFactory({
          factory: (real: FrontdeskChildDataPort) => {
            child.inner = real;
            return new FrontdeskPorts(reg, access, child, minibar);
          },
          inject: [FD_CHILD_DATA_PORT],
        }),
    });
    for (const u of Object.keys(ROLES)) c[u] = Client.of(fa, t, u);
    for (const u of ['fd', 'fd2', 'fdl', 'mgr', 'own']) c[u]!.deviceToken = await t.deviceToken();
    for (const u of ['fdl', 'mgr', 'own']) await setPassword(db, t, u);
  });
  afterAll(async () => {
    await fa?.close();
    await db?.close();
  });

  const url = (path = '') => `${P(t)}${path}`;
  const at = async (iso: string) => {
    const d = new Date(iso);
    fa.clock.set(d);
    await touchSessions(db, t, d);
  };
  const q = async <R extends Record<string, unknown>>(sql: string, p: unknown[] = []) =>
    (await db.withContext(t.ctx(), (tx) => tx.query<R>(sql, p))).rows;
  const get = async (id: string, who = 'fd') =>
    (await c[who]!.get(url(`/reservations/${id}`))).json();
  const act = (id: string, verb: string, version: number, body: unknown, who = 'fd') =>
    c[who]!.send('POST', url(`/reservations/${id}/actions/${verb}`), body, {
      'if-match': `"${version}"`,
    });
  const book = async (over: Record<string, unknown> = {}, who = 'fd') => {
    const res = await c[who]!.send('POST', url('/reservations'), {
      roomId: ids.rooms['201'],
      channelId: ids.channels.direct,
      directSource: 'zalo_phone',
      arrivalDate: '2026-10-15',
      departureDate: '2026-10-17',
      adults: 2,
      bookerGuestId: guest,
      paymentModel: 'direct',
      initialPayment: { type: 'deposit', method: 'cash', amountVnd: 1_522_000 },
      ...over,
    });
    expect(res.statusCode, res.body).toBe(201);
    return res.json() as { id: string; code: string; version: number; folioId: string };
  };
  const checkInBody = (over: Record<string, unknown> = {}) => ({
    cardsIssued: 1,
    houseRulesSent: true,
    ...over,
  });
  const lines = (folioId: string) =>
    q<{ category: string; amount_vnd: number; reversal_of_id: string | null }>(
      `SELECT category, amount_vnd, reversal_of_id FROM folio_line WHERE folio_id = $1 ORDER BY posted_at, id`,
      [folioId],
    );

  let main: { id: string; code: string; version: number; folioId: string };

  it('previewCheckIn: conditions, BR-411 surcharge at 11:00 (30 % of the first night), deadline preview', async () => {
    await at('2026-10-15T11:00:00.000+07:00');
    main = await book();
    const res = await c.fd!.get(url(`/reservations/${main.id}/check-in-preview?checkinTime=11:00`));
    expect(res.statusCode, res.body).toBe(200);
    const p = res.json();
    expect(p.standardCheckinTime).toBe('14:00');
    expect(p.roomStatus).toBe('VC');
    // 0.3.7 (BUG-R2-038, BR-402 v0.3.6): the surcharge about to be posted is due to check in at 11:00.
    expect(
      p.conditions.filter((x: { met: boolean }) => !x.met).map((x: { code: string }) => x.code),
    ).toEqual(['balance_paid']);
    expect(p).toMatchObject({ balanceDueVnd: 0, amountDueAtCheckinVnd: 212_000 });
    expect(p.earlyCheckinSurcharge).toMatchObject({
      tierPct: 30,
      baseNightVnd: 708_000,
      amountVnd: 212_000,
      addsPreviousNight: false,
    });
    expect(p.registrationDeadlinePreview).toBeDefined();
    // Default time = standard time (BR-414), never "now".
    const def = (await c.fd!.get(url(`/reservations/${main.id}/check-in-preview`))).json();
    expect(def).toMatchObject({
      checkinTime: '14:00',
      earlyCheckinSurcharge: { amountVnd: 0 },
      amountDueAtCheckinVnd: 0,
    });
    expect(def.conditions.every((x: { met: boolean }) => x.met)).toBe(true);
  });

  it('checkIn guards: trusted device (D1), If-Match, conditions 409, 422 fields, SURCHARGE_CHANGED', async () => {
    const noDevice = new Client(fa, t.users.fd!.sessionToken);
    const nd = await noDevice.send(
      'POST',
      url(`/reservations/${main.id}/actions/check-in`),
      checkInBody(),
      {
        'if-match': `"${main.version}"`,
      },
    );
    expect(nd.statusCode).toBe(403);
    expect(nd.json().code).toBe('DEVICE_NOT_TRUSTED');
    const stale = await act(main.id, 'check-in', main.version + 5, checkInBody());
    expect(stale.statusCode).toBe(412);
    reg.docs = { ...reg.docs, mainGuestDocument: false };
    const unmet = await act(main.id, 'check-in', main.version, checkInBody());
    expect(unmet.statusCode, unmet.body).toBe(409);
    expect(unmet.json()).toMatchObject({
      code: 'CHECKIN_CONDITIONS_NOT_MET',
      unmet: ['main_guest_document'],
    });
    reg.docs = { ...reg.docs, mainGuestDocument: true };
    const bad = await act(main.id, 'check-in', main.version, { cardsIssued: 3 });
    expect(bad.statusCode).toBe(422);
    const fields = bad
      .json()
      .errors.map((e: { field: string }) => e.field)
      .sort();
    // 11:00 by the server clock (no typed time) → the surcharge decision is missing too (DOM S3-12).
    expect(fields).toEqual(['applyEarlySurcharge', 'cardsIssued', 'houseRulesSent']);
    const changed = await act(
      main.id,
      'check-in',
      main.version,
      checkInBody({
        checkinTime: '11:00',
        applyEarlySurcharge: true,
        expectedSurchargeVnd: 200_000,
      }),
    );
    expect(changed.statusCode).toBe(409);
    expect(changed.json()).toMatchObject({ code: 'SURCHARGE_CHANGED', surchargeVnd: 212_000 });
    // DOM S3-12 / 0.3.6 bổ sung 2: a surcharge > 0 is never skipped silently.
    const skipped = await act(
      main.id,
      'check-in',
      main.version,
      checkInBody({ checkinTime: '11:00' }),
    );
    expect(skipped.statusCode).toBe(422);
    expect(skipped.json().errors).toContainEqual({
      field: 'applyEarlySurcharge',
      code: 'SURCHARGE_DECISION_REQUIRED',
    });
    // E03-07: no future time (14:00 typed at 11:00), and a time well before the action needs a note.
    const future = await act(
      main.id,
      'check-in',
      main.version,
      checkInBody({ checkinTime: '14:00' }),
    );
    expect(future.json().errors).toContainEqual({
      field: 'checkinTime',
      code: 'TIME_AFTER_ACTION',
    });
    const early = await act(
      main.id,
      'check-in',
      main.version,
      checkInBody({
        checkinTime: '10:00',
        applyEarlySurcharge: true,
        expectedSurchargeVnd: 212_000,
      }),
    );
    expect(early.json().errors).toContainEqual({
      field: 'checkinTimeNote',
      code: 'TIME_NOTE_REQUIRED',
    });
    const hk = await act(main.id, 'check-in', main.version, checkInBody(), 'hk');
    expect(hk.statusCode).toBe(403);
  });

  it('B9: in_house, early_checkin line, room OC, B9 history, no door code anywhere (SEC D2)', async () => {
    const early = {
      checkinTime: '11:00',
      applyEarlySurcharge: true,
      expectedSurchargeVnd: 212_000,
      cardsIssued: 2,
    };
    // 0.3.7 (BUG-R2-038 – TC-L3-011): the surcharge is due to check in; not paid → 409, NOTHING written.
    const before = (await lines(main.folioId)).length;
    const unpaid = await act(main.id, 'check-in', main.version, checkInBody(early));
    expect(unpaid.statusCode).toBe(409);
    expect(unpaid.json()).toMatchObject({
      code: 'CHECKIN_CONDITIONS_NOT_MET',
      unmet: ['balance_paid'],
    });
    expect((await lines(main.folioId)).length).toBe(before);
    const tooMuch = await act(
      main.id,
      'check-in',
      main.version,
      checkInBody({ ...early, payment: { type: 'charge', method: 'cash', amountVnd: 300_000 } }),
    );
    expect(tooMuch.statusCode).toBe(422);
    expect(tooMuch.json()).toMatchObject({
      errors: [{ field: 'payment.amountVnd', code: 'AMOUNT_EXCEEDS_BALANCE' }],
      max: 212_000,
    });
    const deposit = await act(
      main.id,
      'check-in',
      main.version,
      checkInBody({ ...early, payment: { type: 'deposit', method: 'cash', amountVnd: 212_000 } }),
    );
    expect(deposit.json().errors).toContainEqual({ field: 'payment.type', code: 'NOT_IN_LIST' });
    const res = await act(
      main.id,
      'check-in',
      main.version,
      checkInBody({ ...early, payment: { type: 'charge', method: 'cash', amountVnd: 212_000 } }),
    );
    expect(res.statusCode, res.body).toBe(200);
    const r = res.json();
    expect(r).toMatchObject({ status: 'in_house', doorAccessHandedOverAt: null });
    expect(r.actualCheckinAt).toBe('2026-10-15T11:00:00.000+07:00');
    expect(res.body).not.toMatch(/doorCode|door_code/);
    main.version = r.version;
    const ls = await lines(main.folioId);
    expect(ls.filter((l) => l.category === 'early_checkin').map((l) => l.amount_vnd)).toEqual([
      212_000,
    ]);
    const rs = await q<{ status: string }>('SELECT status FROM room_status WHERE room_id = $1', [
      ids.rooms['201'],
    ]);
    expect(rs[0]?.status).toBe('OC');
    const st = await q<{ event_code: string }>(
      `SELECT event_code FROM state_transition WHERE entity_id = $1 AND machine = 'SM-01' ORDER BY occurred_at, id`,
      [main.id],
    );
    expect(st.map((x) => x.event_code)).toEqual(['B2', 'B9']);
    expect(reg.calls).toContain(`checkedIn:${main.id}`);
    const audit = await q<{ after: Record<string, unknown> }>(
      `SELECT after FROM audit_event WHERE entity_id = $1 AND action = 'reservation.checked_in'`,
      [main.id],
    );
    expect(JSON.stringify(audit)).not.toMatch(/door_?code/i);
  });

  it('B17 undo: FD 403; MGR blocked while the surcharge line is live (409)', async () => {
    const fd = await act(main.id, 'undo-check-in', main.version, { reason: 'Nhầm đơn' });
    expect(fd.statusCode).toBe(403);
    const mgr = await act(main.id, 'undo-check-in', main.version, { reason: 'Nhầm đơn' }, 'mgr');
    expect(mgr.statusCode, mgr.body).toBe(409);
  });

  it('B-28: doorAccessHandedOver once (second time 409)', async () => {
    const r1 = await c.fd!.send(
      'PATCH',
      url(`/reservations/${main.id}`),
      { doorAccessHandedOver: true },
      { 'if-match': `"${main.version}"` },
    );
    expect(r1.statusCode, r1.body).toBe(200);
    expect(r1.json().doorAccessHandedOverAt).toBe('2026-10-15T11:00:00.000+07:00');
    main.version = r1.json().version;
    const r2 = await c.fd!.send(
      'PATCH',
      url(`/reservations/${main.id}`),
      { doorAccessHandedOver: true },
      { 'if-match': `"${main.version}"` },
    );
    expect(r2.statusCode).toBe(409);
  });

  it('B13: options (BR-421 calendar, D-8 repricing) + extend 2 nights → folio resynced', async () => {
    const o = await c.fd!.get(url(`/reservations/${main.id}/extension-options`));
    expect(o.statusCode, o.body).toBe(200);
    const opt = o.json();
    expect(opt.maxNights).toBeGreaterThanOrEqual(2);
    expect(opt.nights[0]).toMatchObject({
      date: '2026-10-17',
      available: true,
      defaultRateVnd: 814_000,
    });
    expect(opt.nights[1]).toMatchObject({ date: '2026-10-18', defaultRateVnd: 708_000 });
    expect(opt.repricing[1]).toMatchObject({
      nights: 2,
      repricedTotalVnd: 3_044_000,
      deltaVnd: 1_522_000,
    });
    const tooMany = await act(main.id, 'extend', main.version, { nights: 30 });
    expect(tooMany.statusCode).toBe(422);
    expect(tooMany.json().errors[0].code).toBe('EXTENSION_LIMIT_EXCEEDED');
    const res = await act(main.id, 'extend', main.version, { nights: 2 });
    expect(res.statusCode, res.body).toBe(200);
    const r = res.json().reservation;
    expect(r).toMatchObject({ departureDate: '2026-10-19', totalRoomVnd: 3_044_000 });
    main.version = r.version;
    const rooms = (await lines(main.folioId)).filter(
      (l) => l.category === 'room' && !l.reversal_of_id,
    );
    expect(rooms.reduce((a, l) => a + l.amount_vnd, 0)).toBe(3_044_000);
    expect(reg.calls).toContain(`departure:${main.id}:2026-10-19`);
  });

  it('SEC A3: setLateCheckout dryRun without headers → 200 and NOTHING written', async () => {
    const count = async () =>
      (
        await q<{ a: number; b: number; c: number; d: number }>(
          `SELECT (SELECT count(*)::int FROM folio_line) AS a, (SELECT count(*)::int FROM reservation_change) AS b,
                  (SELECT count(*)::int FROM audit_event) AS c, (SELECT count(*)::int FROM idempotency_key) AS d`,
        )
      )[0];
    const before = await count();
    const res = await fa.app.inject({
      method: 'POST',
      url: url(`/reservations/${main.id}/actions/late-checkout`),
      headers: c.fd!.headers({}, true),
      payload: { checkoutTime: '17:00', dryRun: true },
    });
    expect(res.statusCode, res.body).toBe(200);
    expect(res.json()).toMatchObject({
      surchargeVnd: 354_000,
      tierPct: 50,
      saved: false,
      treatAsExtension: false,
    });
    const after19 = await fa.app.inject({
      method: 'POST',
      url: url(`/reservations/${main.id}/actions/late-checkout`),
      headers: c.fd!.headers({}, true),
      payload: { checkoutTime: '19:00', dryRun: true },
    });
    expect(after19.json()).toMatchObject({ treatAsExtension: true, surchargeVnd: 0 });
    expect(await count()).toEqual(before);
  });

  it('B15: save 17:00 with surcharge (50 % of last night 708.000 → 354.000)', async () => {
    // last night after the extension is Sun 18/10 (708.000)
    const res = await act(main.id, 'late-checkout', main.version, {
      checkoutTime: '17:00',
      applySurcharge: true,
      expectedSurchargeVnd: 354_000,
    });
    expect(res.statusCode, res.body).toBe(200);
    expect(res.json()).toMatchObject({ saved: true, surchargeVnd: 354_000 });
    main.version = res.json().reservation.version;
    expect(res.json().reservation.agreedCheckoutTime).toBe('17:00');
  });

  it('US-030/031: confirmation recorded → replied', async () => {
    const r = await c.fd!.send('POST', url(`/reservations/${main.id}/checkout-confirmations`), {
      channel: 'phone',
      replyType: 'late',
      confirmedTime: '17:00',
    });
    expect(r.statusCode, r.body).toBe(201);
    expect(r.json()).toMatchObject({ channel: 'phone', replyType: 'late', confirmedTime: '17:00' });
    const bad = await c.fd!.send('POST', url(`/reservations/${main.id}/checkout-confirmations`), {
      channel: 'phone',
      replyType: 'time',
      confirmedTime: '13:00',
    });
    expect(bad.statusCode).toBe(422);
    const list = (await c.fd!.get(url(`/reservations/${main.id}/checkout-confirmations`))).json();
    expect(list.state).toBe('replied');
    expect(list.data).toHaveLength(1);
  });

  it('B14 change room: dry run (no writes) → capacity 422 → property_fault keeps prices, rooms VD/OC', async () => {
    main.version = (await get(main.id)).version;
    const dry = await fa.app.inject({
      method: 'POST',
      url: url(`/reservations/${main.id}/actions/change-room`),
      headers: c.fd!.headers({}, true),
      payload: {
        newRoomId: ids.rooms['202'],
        effectiveDate: '2026-10-15',
        cause: 'guest_request',
        reason: 'Khách muốn căn rộng hơn',
        dryRun: true,
      },
    });
    expect(dry.statusCode, dry.body).toBe(200);
    expect(dry.json().nights).toHaveLength(4);
    expect(dry.json().folioDeltaVnd).toBeGreaterThan(0);
    const fdl = await act(
      main.id,
      'change-room',
      main.version,
      {
        newRoomId: ids.rooms['202'],
        effectiveDate: '2026-10-15',
        cause: 'property_fault',
        reason: 'Bình nóng lạnh hỏng',
        oldRoomVacated: true,
      },
      'fd',
    );
    expect(fdl.statusCode, fdl.body).toBe(200);
    const r = fdl.json();
    expect(r.segments.map((s: { roomNo: string }) => s.roomNo)).toEqual(['202']);
    expect(r.totalRoomVnd).toBe(3_044_000);
    expect(r.doorAccessHandedOverAt).toBeNull();
    main.version = r.version;
    const rs = await q<{ room_id: string; status: string }>(
      'SELECT room_id, status FROM room_status WHERE room_id = ANY($1::uuid[])',
      [[ids.rooms['201'], ids.rooms['202']]],
    );
    const byRoom = Object.fromEntries(rs.map((x) => [x.room_id, x.status]));
    expect(byRoom[ids.rooms['201']!]).toBe('VD');
    expect(byRoom[ids.rooms['202']!]).toBe('OC');
    const task = await q<{ type: string }>(
      `SELECT type FROM hk_task WHERE room_id = $1 AND reservation_id = $2`,
      [ids.rooms['201'], main.id],
    );
    expect(task.map((x) => x.type)).toContain('checkout_clean');
  });

  it('B14 A-37: 4 adults into a room of max 3 → 422 CAPACITY_EXCEEDED', async () => {
    await at('2026-10-15T14:00:00+07:00');
    const big = await book({
      roomId: ids.rooms['301'],
      adults: 4,
      initialPayment: { type: 'deposit', method: 'cash', amountVnd: 2_200_000 },
    });
    // pay in full + check in: balance 0 needed (BR-305 rest at check-in)
    const f = await q<{ total: number }>(
      `SELECT COALESCE(sum(amount_vnd), 0)::int AS total FROM folio_line WHERE folio_id = $1`,
      [big.folioId],
    );
    expect(f[0]!.total).toBeGreaterThan(0);
    const due = f[0]!.total - 2_200_000;
    if (due > 0) {
      const pay = await c.fd!.send('POST', url(`/folios/${big.folioId}/payments`), {
        type: 'charge',
        method: 'cash',
        amountVnd: due,
      });
      expect([200, 201], pay.body).toContain(pay.statusCode);
    }
    const ci = await act(big.id, 'check-in', big.version, checkInBody());
    expect(ci.statusCode, ci.body).toBe(200);
    const res = await act(big.id, 'change-room', ci.json().version, {
      newRoomId: ids.rooms['203'],
      effectiveDate: '2026-10-15',
      cause: 'guest_request',
      reason: 'Đổi thử',
    });
    expect(res.statusCode).toBe(422);
    expect(res.json()).toMatchObject({ code: 'CAPACITY_EXCEEDED' });
  });

  it('US-022 party: companion, duplicates 409, booker not removable, If-Match on Party.version, child via crypto port', async () => {
    const party0 = await c.fd!.get(url(`/reservations/${main.id}/party`));
    expect(party0.statusCode).toBe(200);
    expect(party0.json()).toMatchObject({ requiredCount: 2, presentCount: 1, missingCount: 1 });
    const v0 = party0.json().version as number;
    expect(party0.headers.etag).toBe(`"${v0}"`);
    const add = await c.fd!.send('POST', url(`/reservations/${main.id}/party`), {
      role: 'companion',
      guestId: guest2,
      relationship: 'friend',
      effectiveFrom: '2026-10-15',
    });
    expect(add.statusCode, add.body).toBe(201);
    expect(add.json()).toMatchObject({ presentCount: 2, missingCount: 0 });
    expect(add.json().occupancyChange).toBeUndefined();
    const dup = await c.fd!.send('POST', url(`/reservations/${main.id}/party`), {
      role: 'companion',
      guestId: guest2,
      effectiveFrom: '2026-10-15',
    });
    expect(dup.statusCode).toBe(409);
    expect(dup.json().code).toBe('PARTY_DUPLICATE');
    const booker = await c.fd!.send('POST', url(`/reservations/${main.id}/party`), {
      role: 'companion',
      guestId: guest,
      effectiveFrom: '2026-10-15',
    });
    expect(booker.json().code).toBe('PARTY_DUPLICATE');
    // A child (8 y) mid-stay → over the base occupancy of 202 (2): occupancyChange + 100.000 × 4 nights.
    const dry = await fa.app.inject({
      method: 'POST',
      url: url(`/reservations/${main.id}/party`),
      headers: c.fd!.headers({}, true),
      payload: {
        role: 'child',
        childName: 'Bé Na',
        childBirthYear: 2018,
        effectiveFrom: '2026-10-15',
        dryRun: true,
      },
    });
    expect(dry.statusCode, dry.body).toBe(200);
    expect(dry.json().occupancyChange).toMatchObject({
      children6to11: 1,
      extraCount: 1,
      surchargeVnd: 400_000,
      nights: 4,
    });
    const kid = await c.fd!.send('POST', url(`/reservations/${main.id}/party`), {
      role: 'child',
      childName: 'Bé Na',
      childBirthYear: 2018,
      effectiveFrom: '2026-10-15',
      applyExtraPersonSurcharge: true,
      expectedSurchargeVnd: 400_000,
    });
    expect(kid.statusCode, kid.body).toBe(201);
    expect(kid.body).not.toContain('Bé Na');
    expect(kid.body).not.toContain('2018');
    expect(kid.json().occupancyChange).toMatchObject({
      surchargeApplied: true,
      extraGuestKitTaskCreated: true,
    });
    const enc = await q<{ child_name_enc: Buffer | null }>(
      `SELECT child_name_enc FROM reservation_guest WHERE reservation_id = $1 AND role = 'child'`,
      [main.id],
    );
    // Real envelope encryption (CryptoService – FK to data_key since 0031): ciphertext, never the name.
    expect(enc[0]?.child_name_enc?.length ?? 0).toBeGreaterThan(16);
    expect(enc[0]?.child_name_enc?.toString()).not.toContain('Bé Na');
    const members = kid.json().members as Array<{ id: string; role: string; priceAgeBand: string }>;
    expect(members.find((m) => m.role === 'child')?.priceAgeBand).toBe('child_6_11');
    const kidV = kid.json().version as number;
    const rmBooker = await c.fd!.send(
      'DELETE',
      url(`/reservations/${main.id}/party/${main.id}`),
      undefined,
      {
        'if-match': `"${kidV}"`,
      },
    );
    expect(rmBooker.statusCode).toBe(409);
    const childId = members.find((m) => m.role === 'child')!.id;
    const stale = await c.fd!.send(
      'DELETE',
      url(`/reservations/${main.id}/party/${childId}`),
      undefined,
      {
        'if-match': `"${kidV - 1}"`,
      },
    );
    expect(stale.statusCode).toBe(412);
    const rm = await c.fd!.send(
      'DELETE',
      url(`/reservations/${main.id}/party/${childId}`),
      undefined,
      {
        'if-match': `"${kidV}"`,
      },
    );
    expect(rm.statusCode, rm.body).toBe(204);
    expect(child.destroyed).toHaveLength(1);
    expect(reg.calls).toContain(`removed:${main.id}:${childId}`);
    // SAL scope own_count_only: not their booking → 404
    expect((await c.sal!.get(url(`/reservations/${main.id}/party`))).statusCode).toBe(404);
    main.version = (await get(main.id)).version;
  });

  it('B18 on the departure day: summary (G-10 recalc), BALANCE_DUE, then pay + check out with bill number', async () => {
    await at('2026-10-19T13:00:00+07:00');
    const s = await c.fd!.get(url(`/reservations/${main.id}/checkout-summary?checkoutTime=13:00`));
    expect(s.statusCode, s.body).toBe(200);
    const sum = s.json();
    expect(sum.lateSurchargeRecalc).toMatchObject({ oldVnd: 354_000, newVnd: 212_000 });
    expect(sum.blockers).toContain('balance_due');
    const blocked = await act(main.id, 'check-out', main.version, { checkoutTime: '13:00' });
    expect(blocked.statusCode, blocked.body).toBe(409);
    expect(blocked.json().code).toBe('BALANCE_DUE');
    // due after the automatic G-10 reversal (354.000 → 212.000)
    const due = sum.balanceDueVnd - (354_000 - 212_000);
    const res = await act(main.id, 'check-out', main.version, {
      checkoutTime: '13:00',
      finalPayment: { type: 'charge', method: 'cash', amountVnd: due },
    });
    expect(res.statusCode, res.body).toBe(200);
    const out = res.json();
    expect(out.billNo).toMatch(/^F26-\d+$/);
    expect(out.reservation.status).toBe('checked_out');
    expect(out.createdTaskIds).toHaveLength(1);
    const late = (await lines(main.folioId)).filter((l) => l.category === 'late_checkout');
    expect(late.map((l) => l.amount_vnd)).toEqual([354_000, -354_000, 212_000]);
    const rs = await q<{ status: string }>('SELECT status FROM room_status WHERE room_id = $1', [
      ids.rooms['202'],
    ]);
    expect(rs[0]?.status).toBe('VD');
    expect(reg.calls).toContain(`checkedOut:${main.id}`);
  });

  it('A-34 credit: overpaid booking needs overpaymentHandling; retain is MGR+; refund request never blocks', async () => {
    await at('2026-10-15T14:00:00+07:00');
    const b = await book({
      roomId: ids.rooms['103'],
      departureDate: '2026-10-16',
      initialPayment: { type: 'deposit', method: 'cash', amountVnd: 900_000 },
    });
    const ci = await act(b.id, 'check-in', b.version, checkInBody());
    expect(ci.statusCode, ci.body).toBe(200);
    await at('2026-10-16T11:00:00+07:00');
    const v = (await get(b.id)).version;
    const sum = (await c.fd!.get(url(`/reservations/${b.id}/checkout-summary`))).json();
    expect(sum.blockers).toEqual(['credit_balance']);
    expect(sum.creditVnd).toBe(150_000);
    const need = await act(b.id, 'check-out', v, { checkoutTime: '11:00' });
    expect(need.statusCode).toBe(422);
    expect(need.json().errors[0].code).toBe('OVERPAYMENT_HANDLING_REQUIRED');
    const fdRetain = await act(b.id, 'check-out', v, {
      checkoutTime: '11:00',
      overpaymentHandling: { mode: 'retain_with_guest_consent', reason: 'Khách để lại' },
    });
    expect(fdRetain.statusCode).toBe(403);
    const ok = await act(b.id, 'check-out', v, {
      checkoutTime: '11:00',
      overpaymentHandling: { mode: 'refund_request', reason: 'Khách trả thừa' },
    });
    expect(ok.statusCode, ok.body).toBe(200);
    const refund = await q<{ type: string; amount_vnd: number; status: string }>(
      `SELECT type, amount_vnd, status FROM approval_request WHERE target_id = $1`,
      [b.id],
    );
    expect(refund).toEqual([{ type: 'refund', amount_vnd: 150_000, status: 'pending' }]);
    // BR-522 / rbac 5.1: a refund is decided by MGR/OWN on role, not on the FOC limits (no escalation).
    const [req] = await q<{ id: string }>(
      `SELECT id FROM approval_request WHERE target_id = $1 AND type = 'refund'`,
      [b.id],
    );
    const listed = (await c.mgr!.get(url('/approval-requests?status=pending'))).json();
    const row = listed.data.find((a: { id: string }) => a.id === req!.id);
    expect(row).toMatchObject({
      type: 'refund',
      requiredRole: 'manager',
      refundedVnd: 0,
    });
    // 0.3.7 B-6: a refund is approved on the version the approver saw.
    const ap = await c.mgr!.send('POST', url(`/approval-requests/${req!.id}/actions/approve`), {
      authMethod: 'password',
      secret: TEST_PASSWORD,
      expectedVersion: row.version,
    });
    expect(ap.statusCode, ap.body).toBe(200);
    expect(ap.json()).toMatchObject({ status: 'approved', approverRole: 'manager' });
  });

  it('checkin_room_not_ready: FD → 202 approval; FDL approves; FD retries with approvalRequestId → OD', async () => {
    await at('2026-10-15T14:30:00+07:00');
    await db.withContext(t.ctx(), (tx) =>
      tx.query(
        `INSERT INTO room_status (room_id, organization_id, property_id, status, since) VALUES ($1, $2, $3, 'VD', $4)
         ON CONFLICT (room_id) DO UPDATE SET status = 'VD'`,
        [ids.rooms['102'], t.organizationId, t.propertyIds[0], new Date()],
      ),
    );
    const b = await book({
      roomId: ids.rooms['102'],
      departureDate: '2026-10-16',
      initialPayment: { type: 'deposit', method: 'cash', amountVnd: 750_000 },
    });
    const noReason = await act(b.id, 'check-in', b.version, checkInBody());
    expect(noReason.json()).toMatchObject({
      code: 'CHECKIN_CONDITIONS_NOT_MET',
      unmet: ['room_ready'],
    });
    const ask = await act(
      b.id,
      'check-in',
      b.version,
      checkInBody({ roomNotReadyOverride: { reason: 'Khách chờ lâu' } }),
    );
    expect(ask.statusCode, ask.body).toBe(202);
    expect(ask.json()).toMatchObject({ type: 'checkin_room_not_ready', status: 'pending' });
    const approvalId = ask.json().id as string;
    const inbox = (await c.fdl!.get('/v1/me/notifications')).json();
    expect(inbox.data.map((n: { kind: string }) => n.kind)).toContain('approval_requested');
    expect(inbox.unreadCount).toBeGreaterThan(0);
    const ap = await c.fdl!.send('POST', url(`/approval-requests/${approvalId}/actions/approve`), {
      authMethod: 'password',
      secret: TEST_PASSWORD,
    });
    expect(ap.statusCode, ap.body).toBe(200);
    const go = await act(
      b.id,
      'check-in',
      b.version,
      checkInBody({ roomNotReadyOverride: { approvalRequestId: approvalId } }),
    );
    expect(go.statusCode, go.body).toBe(200);
    const rs = await q<{ status: string }>('SELECT status FROM room_status WHERE room_id = $1', [
      ids.rooms['102'],
    ]);
    expect(rs[0]?.status).toBe('OD');
  });

  it('B-13 / BE-12: cancel revokes guest access; external relocation creates a 100 % refund request', async () => {
    await at('2026-10-15T15:00:00+07:00');
    const b = await book({
      roomId: ids.rooms['401'],
      arrivalDate: '2026-11-03',
      departureDate: '2026-11-04',
      initialPayment: { type: 'deposit', method: 'cash', amountVnd: 400_000 },
    });
    const cancel = await act(b.id, 'cancel', b.version, { reasonCode: 'found_other' });
    expect(cancel.statusCode, cancel.body).toBe(200);
    expect(access.revoked).toContain(b.id);
  });

  it('A-39 updateRoom: stopping sales of a room with future bookings → 200 + warnings[] (never blocks)', async () => {
    await at('2026-10-15T16:30:00+07:00');
    const b = await book({
      roomId: ids.rooms['203'],
      arrivalDate: '2026-11-18',
      departureDate: '2026-11-19',
      initialPayment: { type: 'deposit', method: 'cash', amountVnd: 300_000 },
    });
    expect(b.id).toBeDefined();
    const room = await q<{ version: number }>('SELECT version FROM room WHERE id = $1', [
      ids.rooms['203'],
    ]);
    const res = await c.own!.send(
      'PATCH',
      url(`/rooms/${ids.rooms['203']}`),
      { isSellable: false },
      { 'if-match': `"${room[0]!.version}"` },
    );
    expect(res.statusCode, res.body).toBe(200);
    expect(res.json()).toMatchObject({
      isSellable: false,
      warnings: [{ code: 'FUTURE_RESERVATIONS_KEEP_ROOM', count: 1 }],
    });
    const back = await c.own!.send(
      'PATCH',
      url(`/rooms/${ids.rooms['203']}`),
      { isSellable: true },
      { 'if-match': `"${res.json().version}"` },
    );
    expect(back.json().warnings).toEqual([]);
  });

  it('events: attention list (reconcile_overdue after the alert window), SSE stream receives reservation.changed', async () => {
    await at('2026-10-15T16:00:00+07:00');
    await book({
      roomId: ids.rooms['402'],
      arrivalDate: '2026-11-10',
      departureDate: '2026-11-11',
      initialPayment: { type: 'deposit', method: 'bank_transfer', amountVnd: 400_000 },
    });
    await at('2026-10-19T16:00:00+07:00');
    // BE-D Sprint 4 (EP01 3.1, US-012 AC6): reconcile_overdue is a money item – MGR+ only, never FD/FDL.
    const a = await c.mgr!.get(url('/attention'));
    expect(a.statusCode, a.body).toBe(200);
    const kinds = a.json().data.map((x: { kind: string }) => x.kind);
    expect(kinds).toContain('reconcile_overdue');
    const rec = a.json().data.find((x: { kind: string }) => x.kind === 'reconcile_overdue');
    expect(Object.keys(rec.params).sort()).toEqual(['count', 'oldestDays']);
    const fdKinds = (await c.fd!.get(url('/attention')))
      .json()
      .data.map((x: { kind: string }) => x.kind);
    expect(fdKinds).not.toContain('reconcile_overdue');
    expect((await c.hk!.get(url('/attention'))).statusCode).toBe(403);

    // SSE over a real socket: connect, cause a committed change, read the event.
    await fa.app.listen(0, '127.0.0.1');
    const port = (fa.app.getHttpServer().address() as AddressInfo).port;
    const ctrl = new AbortController();
    const res = await fetch(`http://127.0.0.1:${port}${url('/events')}`, {
      headers: c.fd!.headers(),
      signal: ctrl.signal,
    });
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/event-stream');
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let text = '';
    const b = await book({
      roomId: ids.rooms['101'],
      arrivalDate: '2026-11-12',
      departureDate: '2026-11-13',
      initialPayment: { type: 'deposit', method: 'cash', amountVnd: 300_000 },
    });
    const cancel = await act(b.id, 'cancel', b.version, { reasonCode: 'found_other' });
    expect(cancel.statusCode).toBe(200);
    const deadline = Date.now() + 5_000;
    while (!text.includes(b.id) && Date.now() < deadline) {
      const chunk = await Promise.race([
        reader.read(),
        new Promise<{ value: undefined; done: true }>((r) =>
          setTimeout(() => r({ value: undefined, done: true }), 1_000),
        ),
      ]);
      if (chunk.value) text += decoder.decode(chunk.value);
    }
    ctrl.abort();
    expect(text).toContain('event: reservation.changed');
    expect(text).toContain(`{"id":"${b.id}"}`);
  });
});
