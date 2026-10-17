/**
 * DOM BE-13 (reopened by the blocker verification 17/10) and DOM BE-14 (d) – end to end on the real
 * PostgreSQL through HTTP, no SQL shortcuts for the money:
 * - An Agoda prepaid booking (POST /reservations, `paymentModel=ota_prepaid`) carries ONE system receipt
 *   `ota_collect` = the room charge the OTA billed. Direct child bookings on the same folio (B13 extension,
 *   B9a prior night, E05-11 extra night at check-out) never touch it; the desk owes only their nights.
 * - DOM 17/10 (BR-110/BR-307): a person above the OTA guest count pays the extra-person fee at the desk – it is
 *   NOT covered by `ota_collect`.
 * - B18 closes with the balance of the desk only; the bill prints "Đã thu qua Agoda" for the OTA part.
 * - DOM BE-14 (d): B16 then B18 through the real endpoints → exactly one refund request.
 * Fake clock and FAKE data only.
 */
import { randomBytes, randomUUID } from 'node:crypto';
import { v7 as uuidv7 } from 'uuid';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
import {
  NoGuestAccessPort,
  NoMinibarPort,
  UnwiredChildDataPort,
} from '../../src/modules/frontdesk/internal/default-ports';
import { FrontdeskPorts } from '../../src/modules/frontdesk/internal/stay-support';
import type {
  CheckinDocumentStatus,
  FrontdeskRegistrationPort,
} from '../../src/modules/frontdesk/public/ports';
import { FolioService } from '../../src/modules/folio/public/folio.service';
import { sha256Hex } from '../../src/shared/http/auth.guard';
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

class DocsOk implements FrontdeskRegistrationPort {
  async checkinDocumentStatus(): Promise<CheckinDocumentStatus> {
    return {
      mainGuestDocument: true,
      documentCheckBlock: false,
      pendingOnlineCheckin: false,
      visaExpiresBeforeDeparture: false,
      passportExpiresDuringStay: false,
    };
  }
  async deadlinePreview(): Promise<Date | null> {
    return null;
  }
  async onCheckedIn(): Promise<Date | null> {
    return null;
  }
  async onCheckInUndone() {}
  async onDepartureChanged() {}
  async onRoomChanged() {}
  async onPartyChanged() {}
  async onPartyMemberRemoved() {}
  async onCheckedOut() {}
  async onReservationVoided() {}
  async earliestVisaValidUntil(): Promise<string | null> {
    return null;
  }
}

const ROLES = { own: ['owner'], mgr: ['manager'], fd: ['front_desk'] };

type Booking = { id: string; code: string; version: number; folioId: string };

describe.skipIf(!HAS_DB)('OTA prepaid stay end to end (DOM BE-13, BE-14 d)', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let ids: BookingIds;
  let guest: string;
  const companions: string[] = [];
  const c: Record<string, Client> = {};

  beforeAll(async () => {
    db = appDatabase(8);
    t = await createTenant(db, { users: ROLES });
    ids = await seedBooking(db, t);
    guest = await seedGuestRow(db, t, { name: 'Kim Ota Khách' });
    companions.push(await seedGuestRow(db, t, { name: 'Lê Bạn Một' }));
    companions.push(await seedGuestRow(db, t, { name: 'Lê Bạn Hai' }));
    fa = await startFeatureApp(db, {
      override: (b) =>
        b
          .overrideProvider(FrontdeskPorts)
          .useValue(
            new FrontdeskPorts(
              new DocsOk(),
              new NoGuestAccessPort(),
              new UnwiredChildDataPort(),
              new NoMinibarPort(),
            ),
          ),
    });
    for (const u of Object.keys(ROLES)) c[u] = Client.of(fa, t, u);
    const token = randomBytes(32).toString('base64url');
    await db.withContext(t.ctx(), (tx) =>
      tx.query(
        `INSERT INTO trusted_device (id, organization_id, property_id, name, device_kind, token_hash, created_at, expires_at)
         VALUES ($1, $2, $3, 'desk', 'desk', $4, $5, $6)`,
        [
          uuidv7(),
          t.organizationId,
          t.propertyIds[0],
          sha256Hex(token),
          new Date('2026-10-01T00:00:00Z'),
          new Date('2027-01-31T00:00:00Z'),
        ],
      ),
    );
    c.fd!.deviceToken = token;
    await setPassword(db, t, 'mgr');
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
  const version = async (id: string) =>
    (await c.fd!.get(url(`/reservations/${id}`))).json().version as number;
  const act = async (id: string, verb: string, body: unknown, who = 'fd') =>
    c[who]!.send('POST', url(`/reservations/${id}/actions/${verb}`), body, {
      'if-match': `"${await version(id)}"`,
    });
  const create = async (body: Record<string, unknown>) => {
    const res = await c.fd!.send('POST', url('/reservations'), body);
    expect(res.statusCode, res.body).toBe(201);
    return res.json() as Booking;
  };
  const vacant = (room: string) =>
    q(`UPDATE room_status SET status = 'VC' WHERE room_id = $1`, [ids.rooms[room]]);
  const ota = (room: string, from: string, to: string, amount: number) =>
    create({
      roomId: ids.rooms[room],
      channelId: ids.channels.agoda,
      adults: 2,
      bookerGuestId: guest,
      paymentModel: 'ota_prepaid',
      otaRef: `AG${randomUUID().slice(0, 8)}`,
      otaRoomAmountVnd: amount,
      arrivalDate: from,
      departureDate: to,
    });
  const folio = async (b: Booking) => (await c.fd!.get(url(`/folios/${b.folioId}`))).json();
  /** Live system receipts `ota_collect` of the folio, with the booking they belong to. */
  const otaCollect = (b: Booking) =>
    q<{ reservation_id: string; amount_vnd: number }>(
      `SELECT reservation_id, amount_vnd FROM payment
        WHERE folio_id = $1 AND method = 'ota_collect' AND status = 'succeeded' AND reversal_of_id IS NULL`,
      [b.folioId],
    );
  /** Σ live lines of the folio by booking (parent / children). */
  const liveOf = (b: Booking, reservationId: string, category: string) =>
    q<{ total: string }>(
      `SELECT COALESCE(SUM(l.amount_vnd), 0)::text AS total FROM folio_line l
        WHERE l.folio_id = $1 AND l.reservation_id = $2 AND l.category = $3 AND l.line_state = 'posted'
          AND l.reversal_of_id IS NULL AND NOT EXISTS (SELECT 1 FROM folio_line r WHERE r.reversal_of_id = l.id)`,
      [b.folioId, reservationId, category],
    ).then((r) => Number(r[0]?.total ?? 0));
  const children = (b: Booking) =>
    q<{ id: string }>(
      'SELECT id FROM reservation WHERE parent_reservation_id = $1 ORDER BY arrival_date',
      [b.id],
    );

  it('B13 extension (direct child) keeps the OTA receipt; B18 asks only for the child night; bill "Đã thu qua Agoda"', async () => {
    await at('2026-11-02T15:00:00+07:00');
    await vacant('401');
    const o = await ota('401', '2026-11-02', '2026-11-04', 1_800_000);
    expect(await otaCollect(o)).toEqual([{ reservation_id: o.id, amount_vnd: 1_800_000 }]);
    expect((await folio(o)).totals).toMatchObject({ balanceDueVnd: 0, paidViaOtaVnd: 1_800_000 });
    const ci = await act(o.id, 'check-in', { cardsIssued: 1, houseRulesSent: true });
    expect(ci.statusCode, ci.body).toBe(200);
    await at('2026-11-03T10:00:00+07:00');
    const ext = await act(o.id, 'extend', { nights: 1 });
    expect(ext.statusCode, ext.body).toBe(200);
    const [kid] = await children(o);
    const childNight = await liveOf(o, kid!.id, 'room');
    expect(childNight).toBeGreaterThan(0);
    // The child sync (paymentModel direct) leaves the parent's receipt alone.
    expect(await otaCollect(o)).toEqual([{ reservation_id: o.id, amount_vnd: 1_800_000 }]);
    expect((await folio(o)).totals).toMatchObject({
      balanceDueVnd: childNight,
      creditVnd: 0,
      otaExcessVnd: 0,
    });
    await at('2026-11-05T11:00:00+07:00');
    const s = (await c.fd!.get(url(`/reservations/${o.id}/checkout-summary`))).json();
    expect(s.balanceDueVnd).toBe(childNight);
    const out = await act(o.id, 'check-out', {
      checkoutTime: '11:00',
      finalPayment: { type: 'charge', method: 'cash', amountVnd: childNight },
    });
    expect(out.statusCode, out.body).toBe(200);
    const f = await folio(o);
    expect(f.totals).toMatchObject({ balanceDueVnd: 0, creditVnd: 0 });
    const bill = (await c.fd!.get(url(`/folios/${o.folioId}/bill`))).json();
    expect(bill).toMatchObject({ otaPrepaidVnd: 1_800_000, balanceDueVnd: 0 });
    expect(bill.otaPrepaidNote).toContain('Đã thu qua');
    // The child night is printed (paid at the desk), the OTA nights are not.
    expect(bill.totalVnd).toBe(childNight);
  });

  it('B9a prior night + a person above the OTA count (desk surcharge) + E05-11 extra night at B18: the OTA receipt never moves', async () => {
    await at('2026-11-10T04:40:00+07:00');
    // Room 201: standard occupancy 2 (DS-E) – the 3rd adult is above max(standard 2, OTA count 2).
    await vacant('201');
    const o = await ota('201', '2026-11-10', '2026-11-12', 1_800_000);
    const pv = (await c.fd!.get(url(`/reservations/${o.id}/check-in-preview`))).json();
    expect(pv.priorNight).toMatchObject({ available: true, createsChildReservation: true });
    const rate = pv.priorNight.defaultRateVnd as number;
    const ci = await act(o.id, 'check-in', {
      cardsIssued: 1,
      houseRulesSent: true,
      addPriorNight: true,
      priorNightRateVnd: rate,
      expectedSurchargeVnd: rate,
    });
    expect(ci.statusCode, ci.body).toBe(200);
    expect(await otaCollect(o)).toEqual([{ reservation_id: o.id, amount_vnd: 1_800_000 }]);
    expect((await folio(o)).totals.balanceDueVnd).toBe(rate);

    // People: the 2nd booked adult is in the OTA count (no fee); a 3rd adult is above it → desk surcharge.
    await at('2026-11-10T10:00:00+07:00');
    const add = (guestId: string, more: Record<string, unknown> = {}) =>
      c.fd!.send('POST', url(`/reservations/${o.id}/party`), {
        role: 'companion',
        guestId,
        effectiveFrom: '2026-11-10',
        ...more,
      });
    expect((await add(companions[0]!)).statusCode).toBe(201);
    let third = await add(companions[1]!, { applyExtraPersonSurcharge: true });
    if (third.statusCode === 422) {
      // The desk confirms the amount it was shown (expectedSurchargeVnd – DOM S3-12).
      const shown = third.json().extraPersonSurchargeVnd ?? third.json().expectedSurchargeVnd;
      third = await add(companions[1]!, {
        applyExtraPersonSurcharge: true,
        expectedSurchargeVnd: shown ?? 300_000,
      });
    }
    expect(third.statusCode, third.body).toBe(201);
    const extra = await liveOf(o, o.id, 'extra_person');
    expect(extra).toBeGreaterThan(0);
    // DOM 17/10: the fee is not covered by the OTA receipt – it stays due at the desk.
    expect(await otaCollect(o)).toEqual([{ reservation_id: o.id, amount_vnd: 1_800_000 }]);
    expect((await folio(o)).totals.balanceDueVnd).toBe(rate + extra);

    // B18 at 19:00 on the departure day: E05-11 "charge one more night" → a direct child in the same transaction.
    await at('2026-11-12T19:00:00+07:00');
    const s = (
      await c.fd!.get(url(`/reservations/${o.id}/checkout-summary?checkoutTime=19:00`))
    ).json();
    expect(s.extraNightRequired, JSON.stringify(s)).toBe(true);
    const night = s.extraNightDefaultRateVnd as number;
    expect(s.balanceDueVnd).toBe(rate + extra);
    // The extra night is a direct night for 3 adults in a room for 2 → its own BR-110 fee (same per night).
    const perNightFee = extra / 2;
    const out = await act(o.id, 'check-out', {
      checkoutTime: '19:00',
      extraNight: { rateVnd: night },
      finalPayment: {
        type: 'charge',
        method: 'cash',
        amountVnd: rate + extra + night + perNightFee,
      },
    });
    expect(out.statusCode, out.body).toBe(200);
    expect(await otaCollect(o)).toEqual([{ reservation_id: o.id, amount_vnd: 1_800_000 }]);
    expect((await folio(o)).totals).toMatchObject({ balanceDueVnd: 0, creditVnd: 0 });
    const st = await q<{ status: string }>(
      'SELECT status FROM reservation WHERE id = $1 OR parent_reservation_id = $1',
      [o.id],
    );
    expect(st.every((x) => x.status === 'checked_out')).toBe(true);
    const bill = (await c.fd!.get(url(`/folios/${o.folioId}/bill`))).json();
    expect(bill.totalVnd).toBe(rate + extra + night + perNightFee); // desk part only
    expect(
      (bill.lines as Array<{ labelKey: string }>).some(
        (l) => l.labelKey === 'bill.line.extra_night',
      ),
    ).toBe(true);
  });

  it('DOM BE-14 (d): B16 early departure then B18 through the endpoints → exactly one refund request', async () => {
    await at('2026-11-16T15:00:00+07:00');
    await vacant('203');
    const b = await create({
      roomId: ids.rooms['203'],
      channelId: ids.channels.direct,
      directSource: 'zalo_phone',
      adults: 2,
      bookerGuestId: guest,
      paymentModel: 'direct',
      arrivalDate: '2026-11-16',
      departureDate: '2026-11-20',
      initialPayment: { type: 'deposit', method: 'cash', amountVnd: 3_000_000 },
    });
    const due = (await folio(b)).totals.balanceDueVnd as number;
    if (due > 0) {
      const r = await c.fd!.send('POST', url(`/folios/${b.folioId}/payments`), {
        type: 'charge',
        method: 'cash',
        amountVnd: due,
      });
      expect(r.statusCode, r.body).toBe(201);
    }
    const ci = await act(b.id, 'check-in', { cardsIssued: 1, houseRulesSent: true });
    expect(ci.statusCode, ci.body).toBe(200);
    await at('2026-11-17T10:00:00+07:00');
    const ed = await act(b.id, 'early-departure', {
      newDepartureDate: '2026-11-18',
      noticeGivenAt: '2026-11-17T10:00:00+07:00',
    });
    expect(ed.statusCode, ed.body).toBe(200);
    expect(ed.json().refundRequestId).toEqual(expect.any(String));
    const refunds = () =>
      q<{ id: string }>(
        `SELECT id FROM approval_request WHERE type = 'refund' AND target_id = $1`,
        [b.id],
      );
    expect(await refunds()).toHaveLength(1);
    await at('2026-11-18T11:00:00+07:00');
    const s = (await c.fd!.get(url(`/reservations/${b.id}/checkout-summary`))).json();
    expect(s.unhandledCreditVnd ?? 0).toBe(0);
    expect(s.blockers ?? []).not.toContain('credit_balance');
    const out = await act(b.id, 'check-out', { checkoutTime: '11:00' });
    expect(out.statusCode, out.body).toBe(200);
    expect(await refunds()).toHaveLength(1);
  });
  it('Re-verification 17/10: B16 on an OTA booking, MGR edits the OTA-kept fee, FD voids it – the OTA receipt follows every edit; B18 200', async () => {
    await at('2026-11-24T15:00:00+07:00');
    await vacant('402');
    const o = await ota('402', '2026-11-24', '2026-11-27', 2_700_000);
    const ci = await act(o.id, 'check-in', { cardsIssued: 1, houseRulesSent: true });
    expect(ci.statusCode, ci.body).toBe(200);
    await at('2026-11-25T10:00:00+07:00');
    const ed = await act(o.id, 'early-departure', {
      newDepartureDate: '2026-11-26',
      noticeGivenAt: '2026-11-25T10:00:00+07:00',
      otaRetainedVnd: 450_000,
    });
    expect(ed.statusCode, ed.body).toBe(200);
    const nights = await liveOf(o, o.id, 'room');
    const collected = async () => (await otaCollect(o)).reduce((a, p) => a + p.amount_vnd, 0);
    expect(await collected()).toBe(nights + 450_000);
    const feeLine = async () =>
      (
        (await folio(o)).lines as Array<{
          id: string;
          category: string;
          lineState: string;
          reversalOfId?: string;
          amountVnd: number;
        }>
      ).filter(
        (l) => l.category === 'early_departure_fee' && l.lineState === 'posted' && !l.reversalOfId,
      );
    const live = async () => {
      const all = await feeLine();
      const reversed = new Set(
        ((await folio(o)).lines as Array<{ reversalOfId?: string }>)
          .map((l) => l.reversalOfId)
          .filter(Boolean),
      );
      return all.filter((l) => !reversed.has(l.id));
    };
    // MGR corrects the fee the OTA keeps (extranet showed 600.000).
    const [fee] = await live();
    const f1 = await folio(o);
    const mgrEdit = await c.mgr!.send(
      'POST',
      url(`/folios/${o.folioId}/lines/${fee!.id}/adjustments`),
      { newUnitPriceVnd: 600_000, reason: 'Extranet Agoda ghi 600.000' },
      { 'if-match': `"${f1.version}"` },
    );
    expect(mgrEdit.statusCode, mgrEdit.body).toBe(201);
    expect(await collected()).toBe(nights + 600_000);
    expect((await folio(o)).totals).toMatchObject({ balanceDueVnd: 0, otaExcessVnd: 0 });
    // FD voids the fee line: the receipt drops with it, the bill prints the right "Đã thu qua Agoda".
    const [fee2] = await live();
    const f2 = await folio(o);
    const fdVoid = await c.fd!.send(
      'POST',
      url(`/folios/${o.folioId}/lines/${fee2!.id}/adjustments`),
      { voidLine: true, reason: 'OTA không giữ phí' },
      { 'if-match': `"${f2.version}"` },
    );
    expect(fdVoid.statusCode, fdVoid.body).toBe(201);
    expect(await collected()).toBe(nights);
    const bill = (await c.fd!.get(url(`/folios/${o.folioId}/bill`))).json();
    expect(bill.otaPrepaidVnd).toBe(nights);
    expect(bill.balanceDueVnd).toBe(0);
    await at('2026-11-26T11:00:00+07:00');
    const out = await act(o.id, 'check-out', { checkoutTime: '11:00' });
    expect(out.statusCode, out.body).toBe(200);
  });
  // ───────────── DOM 17/10 (BR-307/310/428 v0.3.4 bổ sung) ─────────────

  const otaOn = (
    channel: 'agoda' | 'booking',
    model: 'ota_prepaid' | 'ota_pay_at_property',
    room: string,
    from: string,
    to: string,
    amount: number,
    adults = 2,
  ) =>
    create({
      roomId: ids.rooms[room],
      channelId: ids.channels[channel],
      adults,
      bookerGuestId: guest,
      paymentModel: model,
      otaRef: `OT${randomUUID().slice(0, 8)}`,
      otaRoomAmountVnd: amount,
      arrivalDate: from,
      departureDate: to,
    });
  const approve = (who: string, id: string) =>
    c[who]!.send('POST', url(`/approval-requests/${id}/actions/approve`), {
      authMethod: 'password',
      secret: TEST_PASSWORD,
    });

  it('BR-307-03 / BR-307-04: no FOC on an OTA prepaid night (FOC on minibar is fine, "Đã thu qua" stays the nights); MGR edits a night after check-out → receipt follows, balance 0', async () => {
    await at('2026-12-01T15:00:00+07:00');
    await vacant('103');
    const o = await ota('103', '2026-12-01', '2026-12-03', 1_800_000);
    expect((await act(o.id, 'check-in', { cardsIssued: 1, houseRulesSent: true })).statusCode).toBe(
      200,
    );
    const [mb] = await db.withContext(
      { ...t.ctx(), userId: t.users.fd!.id, actorType: 'user' },
      (tx) =>
        fa.app.get(FolioService).postLines(
          tx,
          o.folioId,
          [
            {
              reservationId: o.id,
              category: 'minibar',
              description: 'Bia',
              quantity: 2,
              unitPriceVnd: 35_000,
              amountVnd: 70_000,
              serviceDate: '2026-12-01',
              source: 'minibar_check',
            },
          ],
          { userId: t.users.fd!.id, reservationCode: o.code },
        ),
    );
    const lines = (await folio(o)).lines as Array<{
      id: string;
      category: string;
      amountVnd: number;
    }>;
    const night = lines.find((l) => l.category === 'room')!;
    const foc = (lineId: string, amountVnd: number) =>
      c.fd!.send('POST', url(`/folios/${o.folioId}/lines/${lineId}/foc`), {
        kind: 'foc',
        amountVnd,
        reasonCode: 'service_recovery',
      });
    const onNight = await foc(night.id, 900_000);
    expect(onNight.statusCode).toBe(422);
    expect(onNight.json().errors).toEqual([{ field: 'kind', code: 'FOC_NOT_ALLOWED_OTA_PREPAID' }]);
    const onMinibar = await foc(mb as string, 70_000);
    expect(onMinibar.statusCode, onMinibar.body).toBe(201);
    expect((await approve('mgr', onMinibar.json().id)).statusCode).toBe(200);
    expect((await folio(o)).totals).toMatchObject({ paidViaOtaVnd: 1_800_000, balanceDueVnd: 0 });
    await at('2026-12-03T11:00:00+07:00');
    expect((await act(o.id, 'check-out', { checkoutTime: '11:00' })).statusCode).toBe(200);
    // BR-307-04: settled folio, MGR follows the extranet (900.000 → 850.000) – same transaction.
    const f = await folio(o);
    const adj = await c.mgr!.send(
      'POST',
      url(`/folios/${o.folioId}/lines/${night.id}/adjustments`),
      { newUnitPriceVnd: night.amountVnd - 50_000, reason: 'Extranet Agoda ghi 850.000' },
      { 'if-match': `"${f.version}"` },
    );
    expect(adj.statusCode, adj.body).toBe(201);
    expect((await folio(o)).totals).toMatchObject({
      paidViaOtaVnd: 1_800_000 - 50_000,
      balanceDueVnd: 0,
      creditVnd: 0,
    });
  });

  it('BR-310-01 / BR-310-02: OTA cancellation penalty is other revenue – prepaid also "Đã thu qua OTA" (balance 0, channel fee on the penalty, no sold night); pay at property → due; penalty 0 → no line', async () => {
    await at('2026-10-20T10:00:00+07:00');
    const cancel = async (b: Booking, penalty: number) =>
      act(b.id, 'cancel', { reasonCode: 'ota_cancelled', otaPenaltyVnd: penalty });
    const fees = (b: Booking) =>
      q<{ amount_vnd: number; revenue_group: string }>(
        `SELECT amount_vnd, revenue_group FROM folio_line WHERE folio_id = $1 AND category = 'cancellation_fee'`,
        [b.folioId],
      );
    const pre = await otaOn('booking', 'ota_prepaid', '102', '2026-12-10', '2026-12-12', 1_800_000);
    const out = await cancel(pre, 900_000);
    expect(out.statusCode, out.body).toBe(200);
    expect(await fees(pre)).toEqual([{ amount_vnd: 900_000, revenue_group: 'other' }]);
    expect((await folio(pre)).totals).toMatchObject({ paidViaOtaVnd: 900_000, balanceDueVnd: 0 });
    const [rate] = await q<{ pct: string }>(
      `SELECT rate_pct_snapshot::text AS pct, base_amount_vnd, amount_estimated_vnd FROM channel_fee
        WHERE reservation_id = $1`,
      [pre.id],
    );
    const fee = await q<{ base_amount_vnd: number; amount_estimated_vnd: number }>(
      'SELECT base_amount_vnd, amount_estimated_vnd FROM channel_fee WHERE reservation_id = $1',
      [pre.id],
    );
    expect(fee[0]).toMatchObject({
      base_amount_vnd: 900_000,
      amount_estimated_vnd: Math.round((900_000 * Number(rate!.pct)) / 100),
    });
    expect(
      await q(`SELECT 1 FROM stay_night WHERE reservation_id = $1 AND night_state = 'sold'`, [
        pre.id,
      ]),
    ).toHaveLength(0);
    expect(
      await q(`SELECT 1 FROM commission WHERE reservation_id = $1 AND status <> 'void'`, [pre.id]),
    ).toHaveLength(0);
    // Pay at the property: the penalty is due at the desk.
    const pap = await otaOn(
      'booking',
      'ota_pay_at_property',
      '103',
      '2026-12-10',
      '2026-12-12',
      1_800_000,
    );
    expect((await cancel(pap, 900_000)).statusCode).toBe(200);
    expect((await folio(pap)).totals).toMatchObject({ paidViaOtaVnd: 0, balanceDueVnd: 900_000 });
    // The actual OTA fee on the penalty wins over the rate (otaPenaltyChannelFeeVnd, 0.3.6 bổ sung 4).
    const rep = await otaOn('booking', 'ota_prepaid', '202', '2026-12-10', '2026-12-12', 1_800_000);
    const noPenalty = await act(rep.id, 'cancel', {
      reasonCode: 'ota_cancelled',
      otaPenaltyChannelFeeVnd: 120_000,
    });
    expect(noPenalty.json().errors).toContainEqual({
      field: 'otaPenaltyChannelFeeVnd',
      code: 'NOT_ALLOWED',
    });
    const withFee = await act(rep.id, 'cancel', {
      reasonCode: 'ota_cancelled',
      otaPenaltyVnd: 900_000,
      otaPenaltyChannelFeeVnd: 120_000,
    });
    expect(withFee.statusCode, withFee.body).toBe(200);
    expect(
      (
        await q<{ amount_actual_vnd: number; base_amount_vnd: number }>(
          'SELECT amount_actual_vnd, base_amount_vnd FROM channel_fee WHERE reservation_id = $1',
          [rep.id],
        )
      )[0],
    ).toEqual({ amount_actual_vnd: 120_000, base_amount_vnd: 900_000 });
    // Prepaid, penalty 0: no line, nothing collected, nothing due.
    const zero = await otaOn(
      'booking',
      'ota_prepaid',
      '201',
      '2026-12-10',
      '2026-12-12',
      1_800_000,
    );
    expect((await cancel(zero, 0)).statusCode).toBe(200);
    expect(await fees(zero)).toEqual([]);
    expect((await folio(zero)).totals).toMatchObject({ paidViaOtaVnd: 0, balanceDueVnd: 0 });
  });

  it('BR-428-06: B16 on an OTA booking – the extra-person fee collected for the dropped nights is the ONE refund request; B18 adds none', async () => {
    await at('2026-12-20T15:00:00+07:00');
    await vacant('302');
    // Room 302: standard 3 (DS-E); OTA count 3 → the 4th adult pays BR-110 at the desk.
    const o = await otaOn('agoda', 'ota_prepaid', '302', '2026-12-20', '2026-12-24', 3_600_000, 3);
    expect((await act(o.id, 'check-in', { cardsIssued: 1, houseRulesSent: true })).statusCode).toBe(
      200,
    );
    const add = (guestId: string, more: Record<string, unknown> = {}) =>
      c.fd!.send('POST', url(`/reservations/${o.id}/party`), {
        role: 'companion',
        guestId,
        effectiveFrom: '2026-12-20',
        ...more,
      });
    expect((await add(companions[0]!)).statusCode).toBe(201);
    const extraCompanion = await seedGuestRow(db, t, { name: 'Lê Bạn Ba' });
    expect((await add(companions[1]!)).statusCode).toBe(201);
    const fourth = await add(extraCompanion, {
      applyExtraPersonSurcharge: true,
      expectedSurchargeVnd: 600_000,
    });
    expect(fourth.statusCode, fourth.body).toBe(201);
    expect(await liveOf(o, o.id, 'extra_person')).toBe(600_000);
    const paid = await c.fd!.send('POST', url(`/folios/${o.folioId}/payments`), {
      type: 'charge',
      method: 'cash',
      amountVnd: 600_000,
    });
    expect(paid.statusCode, paid.body).toBe(201);
    await at('2026-12-22T10:00:00+07:00');
    const ed = await act(o.id, 'early-departure', {
      newDepartureDate: '2026-12-22',
      noticeGivenAt: '2026-12-22T10:00:00+07:00',
      otaRetainedVnd: 0,
    });
    expect(ed.statusCode, ed.body).toBe(200);
    const refunds = () =>
      q<{ amount_vnd: number }>(
        `SELECT amount_vnd FROM approval_request WHERE type = 'refund' AND target_id = $1`,
        [o.id],
      );
    expect(await refunds()).toEqual([{ amount_vnd: 300_000 }]);
    await at('2026-12-22T11:00:00+07:00');
    const out = await act(o.id, 'check-out', { checkoutTime: '11:00' });
    expect(out.statusCode, out.body).toBe(200);
    expect(await refunds()).toEqual([{ amount_vnd: 300_000 }]);
  });
  it('Round 5 (A): no FOC on an OTA-kept fee of an OTA prepaid booking (it would eat the surcharge paid at the desk)', async () => {
    await at('2026-12-26T15:00:00+07:00');
    await vacant('202');
    // Room 202: standard 2 (DS-E); OTA count 2 → a 3rd adult pays BR-110 at the desk.
    const o = await otaOn('agoda', 'ota_prepaid', '202', '2026-12-26', '2026-12-29', 2_700_000);
    expect((await act(o.id, 'check-in', { cardsIssued: 1, houseRulesSent: true })).statusCode).toBe(
      200,
    );
    const add = (guestId: string, more: Record<string, unknown> = {}) =>
      c.fd!.send('POST', url(`/reservations/${o.id}/party`), {
        role: 'companion',
        guestId,
        effectiveFrom: '2026-12-26',
        ...more,
      });
    expect((await add(companions[0]!)).statusCode).toBe(201);
    let third = await add(companions[1]!, { applyExtraPersonSurcharge: true });
    if (third.statusCode === 422) {
      third = await add(companions[1]!, {
        applyExtraPersonSurcharge: true,
        expectedSurchargeVnd: 450_000,
      });
    }
    expect(third.statusCode, third.body).toBe(201);
    const surcharge = await liveOf(o, o.id, 'extra_person');
    const paid = await c.fd!.send('POST', url(`/folios/${o.folioId}/payments`), {
      type: 'charge',
      method: 'cash',
      amountVnd: surcharge,
    });
    expect(paid.statusCode, paid.body).toBe(201);
    await at('2026-12-27T10:00:00+07:00');
    const ed = await act(o.id, 'early-departure', {
      newDepartureDate: '2026-12-28',
      noticeGivenAt: '2026-12-27T10:00:00+07:00',
      otaRetainedVnd: 450_000,
    });
    expect(ed.statusCode, ed.body).toBe(200);
    const before = (await folio(o)).totals as { creditVnd: number; unhandledCreditVnd: number };
    const fee = (
      (await folio(o)).lines as Array<{ id: string; category: string; reversalOfId?: string }>
    ).find((l) => l.category === 'early_departure_fee' && !l.reversalOfId)!;
    const foc = await c.fd!.send('POST', url(`/folios/${o.folioId}/lines/${fee.id}/foc`), {
      kind: 'foc',
      amountVnd: 450_000,
      reasonCode: 'service_recovery',
    });
    expect(foc.statusCode).toBe(422);
    expect(foc.json().errors).toEqual([{ field: 'kind', code: 'FOC_NOT_ALLOWED_OTA_PREPAID' }]);
    const after = (await folio(o)).totals as { creditVnd: number; unhandledCreditVnd: number };
    expect(after).toMatchObject({
      creditVnd: before.creditVnd,
      unhandledCreditVnd: 0,
    });
  });
});
