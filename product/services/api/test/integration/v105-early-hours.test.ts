/**
 * BE-A v1.0.5 – V5-11 (OpenAPI 0.3.13 bổ sung 1 `earlyDeparture`; contract 0.3.13 1.21; DOM rules v1.0.5 2, 7.6;
 * BR-010, BR-309, BR-311, BR-428; BUG-R3-036, FB-R4-ARC-DOM-B16-01) on the real PostgreSQL through HTTP: from 00:00
 * to the 06:00 rollover of calendar day D+1 (business date D) night D is a night stayed – B16 refuses a new
 * departure ≤ D (409 + `minNewDepartureDate`) and a stay ending on D+1 (409 + `useCheckout`), before every other
 * date check, dry run included; the retained fee lines are dated the business date of the action.
 * Oracles BR-428-14…17, BR-309-27, BR-311-04 (tests/fixtures/br-examples.json); DOM cases T-11-1…T-11-5, T-11-7,
 * T-11-8; DOM FB-R5-DOM-BE-PR114-01 (the commission of a sale's booking keeps night D, not the early-departure fee –
 * BR-903 (2), test rate `test_rate_short` only, SEC G3). Fake clock, FAKE data.
 */
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { v7 as uuidv7 } from 'uuid';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
import {
  NoGuestAccessPort,
  NoMinibarPort,
} from '../../src/modules/frontdesk/internal/default-ports';
import { FrontdeskPorts } from '../../src/modules/frontdesk/internal/stay-support';
import {
  FD_CHILD_DATA_PORT,
  type CheckinDocumentStatus,
  type FrontdeskChildDataPort,
  type FrontdeskRegistrationPort,
} from '../../src/modules/frontdesk/public/ports';
import { applyPct } from '../../src/modules/reservations/public/pricing';
import { sha256Hex } from '../../src/shared/http/auth.guard';
import { Client, type FeatureApp, P, startFeatureApp } from '../helpers/feature-app';
import {
  type BookingIds,
  seedBooking,
  seedGuestRow,
  touchSessions,
} from '../helpers/reservations-fixture';
import { HAS_DB, type TestTenant, appDatabase, createTenant, setParam } from '../helpers/tenant';

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

const ROLES = { mgr: ['manager'], fd: ['front_desk'], sal: ['sales_staff'] };
/** Test-only commission rate (SEC G3) – an odd value unrelated to any real table. */
const test_rate_short = 1.37;

// Oracle rows are free-form JSON (QA fixture) – read field by field below.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type OracleRow = { id: string; input: any; expected: any };
const ORACLES = JSON.parse(
  readFileSync(join(__dirname, '../../../../tests/fixtures/br-examples.json'), 'utf8'),
) as { examples: OracleRow[] };
const oracle = (id: string) => {
  const o = ORACLES.examples.find((x) => x.id === id);
  if (!o) throw new Error(`oracle ${id} missing`);
  return o;
};

type Booking = { id: string; code: string; version: number; folioId: string };
type Res = Awaited<ReturnType<Client['get']>>;

describe.skipIf(!HAS_DB)('V5-11 – early departure and retained fees 00:00–05:59 (BE-A)', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let ids: BookingIds;
  let guest: string;
  const c: Record<string, Client> = {};

  const url = (path = '') => `${P(t)}${path}`;
  const at = async (iso: string) => {
    const d = new Date(iso);
    fa.clock.set(d);
    await touchSessions(db, t, d);
  };
  const q = async <R extends Record<string, unknown>>(sql: string, p: unknown[] = []) =>
    (await db.withContext(t.ctx(), (tx) => tx.query<R>(sql, p))).rows;

  beforeAll(async () => {
    db = appDatabase(6);
    t = await createTenant(db, { users: ROLES });
    ids = await seedBooking(db, t);
    guest = await seedGuestRow(db, t, { name: 'Khách Rời Sớm' });
    fa = await startFeatureApp(db, {
      override: (b) =>
        b.overrideProvider(FrontdeskPorts).useFactory({
          factory: (child: FrontdeskChildDataPort) =>
            new FrontdeskPorts(new DocsOk(), new NoGuestAccessPort(), child, new NoMinibarPort()),
          inject: [FD_CHILD_DATA_PORT],
        }),
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
          new Date('2026-09-01T00:00:00Z'),
          new Date('2027-12-31T00:00:00Z'),
        ],
      ),
    );
    c.fd!.deviceToken = token;
    c.mgr!.deviceToken = token;
  });
  afterAll(async () => {
    await fa?.close();
    await db?.close();
  });

  const get = async (id: string) => (await c.fd!.get(url(`/reservations/${id}`))).json();
  const act = async (id: string, verb: string, body: unknown, who = 'fd') =>
    c[who]!.send('POST', url(`/reservations/${id}/actions/${verb}`), body, {
      'if-match': `"${(await get(id)).version}"`,
    });
  /** The desk's dry run: no Idempotency-Key, no If-Match. */
  const preview = (id: string, body: Record<string, unknown>): Promise<Res> =>
    fa.app.inject({
      method: 'POST',
      url: url(`/reservations/${id}/actions/early-departure`),
      headers: c.fd!.headers({}, true),
      payload: { ...body, dryRun: true },
    });
  const totals = async (folioId: string) =>
    (await c.fd!.get(url(`/folios/${folioId}`))).json().totals as { balanceDueVnd: number };
  const dates = (from: string, to: string) => {
    const out: string[] = [];
    for (let d = new Date(`${from}T00:00:00Z`); d < new Date(`${to}T00:00:00Z`);) {
      out.push(d.toISOString().slice(0, 10));
      d.setUTCDate(d.getUTCDate() + 1);
    }
    return out;
  };
  /**
   * Direct booking at a fixed nightly rate, booked ahead with the deposit required paid in cash (`extra`: e.g. a sale
   * closing it).
   */
  const direct = async (
    room: string,
    from: string,
    to: string,
    rate: number,
    extra: Record<string, unknown> = {},
  ) => {
    await at('2026-10-10T10:00:00+07:00');
    const body = {
      roomId: ids.rooms[room],
      channelId: ids.channels.direct,
      directSource: 'zalo_phone',
      adults: 2,
      bookerGuestId: guest,
      paymentModel: 'direct',
      arrivalDate: from,
      departureDate: to,
      nightlyRates: dates(from, to).map((date) => ({ date, amountVnd: rate })),
      ...extra,
    };
    // A token payment below the deposit → 422 with the deposit required (then paid exactly – the oracles' deposit).
    const quote = await c.fd!.send('POST', url('/reservations'), {
      ...body,
      initialPayment: { type: 'deposit', method: 'cash', amountVnd: 100_000 },
    });
    expect(quote.statusCode, quote.body).toBe(422);
    expect(quote.json().code).toBe('DEPOSIT_INSUFFICIENT');
    const res = await c.fd!.send('POST', url('/reservations'), {
      ...body,
      initialPayment: {
        type: 'deposit',
        method: 'cash',
        amountVnd: quote.json().depositRequiredVnd,
      },
    });
    expect(res.statusCode, res.body).toBe(201);
    return res.json() as Booking & { depositRequiredVnd: number; depositPaidVnd: number };
  };
  /** Check-in at 15:00 on the arrival day with the folio paid in full (+ `extra` paid above it). */
  const stay = async (b: Booking, from: string, extra = 0) => {
    await at(`${from}T15:00:00+07:00`);
    const due = (await totals(b.folioId)).balanceDueVnd + extra;
    if (due > 0) {
      const p = await c.fd!.send('POST', url(`/folios/${b.folioId}/payments`), {
        type: 'charge',
        method: 'cash',
        amountVnd: due,
        ...(extra > 0 ? { note: 'Khách trả dư tiền mặt' } : {}),
      });
      expect([200, 201], p.body).toContain(p.statusCode);
    }
    const ci = await act(b.id, 'check-in', {
      cardsIssued: 1,
      houseRulesSent: true,
      checkinTime: '15:00',
    });
    expect(ci.statusCode, ci.body).toBe(200);
  };
  const events = (r: { allowedActions?: Array<{ event: string }> }) =>
    (r.allowedActions ?? []).map((a) => a.event);
  /** What B16 may change: the booking, its nights, its folio lines, payments, requests, audit. */
  const footprint = async (b: Booking) => ({
    reservation: await q(
      `SELECT version, status, departure_date::text AS dep, updated_at FROM reservation WHERE id = $1`,
      [b.id],
    ),
    nights: await q(
      `SELECT stay_date::text AS d, night_state FROM stay_night WHERE reservation_id = $1 ORDER BY 1, 2`,
      [b.id],
    ),
    lines: await q(
      `SELECT id, category, amount_vnd, line_state, service_date::text AS d FROM folio_line
        WHERE folio_id = $1 ORDER BY id`,
      [b.folioId],
    ),
    requests: await q(`SELECT id FROM approval_request WHERE target_id = $1 ORDER BY id`, [b.id]),
    audit: await q(`SELECT id FROM audit_event WHERE entity_id IN ($1, $2) ORDER BY id`, [
      b.id,
      b.folioId,
    ]),
  });
  const feeLines = (b: Booking, category: string) =>
    q<{ amount_vnd: number; d: string }>(
      `SELECT amount_vnd, service_date::text AS d FROM folio_line
        WHERE folio_id = $1 AND category = $2 AND reversal_of_id IS NULL ORDER BY created_at`,
      [b.folioId, category],
    );
  const roomNightLive = async (b: Booking, d: string) =>
    (
      await q<{ n: number }>(
        `SELECT count(*)::int AS n FROM folio_line l
          WHERE l.folio_id = $1 AND l.category = 'room' AND l.service_date = $2 AND l.reversal_of_id IS NULL
            AND NOT EXISTS (SELECT 1 FROM folio_line r WHERE r.reversal_of_id = l.id)`,
        [b.folioId, d],
      )
    )[0]!.n;

  it('T-11-1, T-11-3 (BR-428-14, BR-428-16): 03:00 on 21/10, new departure 21/10 → night 20/10 kept, 1 day notice, 1.050.000 refunded; fee dated 20/10', async () => {
    const o = oracle('BR-428-14');
    const o16 = oracle('BR-428-16');
    const i = o.input;
    const b = await direct('101', i.arrivalDate, i.departureDate, i.nightRateVnd);
    await stay(b, i.arrivalDate);
    await at(i.notifiedAt);
    // B16 offered from the calendar date (min 21/10 < 24/10); B18 not (departure 24/10).
    const r = await get(b.id);
    expect(events(r)).toContain('early_departure');
    expect(events(r)).not.toContain('check_out');
    const body = { newDepartureDate: i.newDepartureDate, noticeGivenAt: i.notifiedAt };
    const dry = await preview(b.id, body);
    expect(dry.statusCode, dry.body).toBe(200);
    expect(dry.json()).toMatchObject({
      noticeDays: o.expected.noticeDays,
      refundVnd: o.expected.refundVnd,
      earlyDepartureFeeVnd: o.expected.earlyDepartureFeeVnd,
    });
    expect((dry.json().droppedNights as Array<{ date: string }>).map((n) => n.date)).toEqual(
      o.expected.cancelledNights,
    );
    const wr = await act(b.id, 'early-departure', {
      ...body,
      expectedRefundVnd: dry.json().refundVnd,
      expectedFeeVnd: dry.json().earlyDepartureFeeVnd,
    });
    expect(wr.statusCode, wr.body).toBe(200);
    expect(wr.json()).toMatchObject({
      refundVnd: o.expected.refundVnd,
      earlyDepartureFeeVnd: o.expected.earlyDepartureFeeVnd,
      reservation: { departureDate: i.newDepartureDate },
    });
    // BR-428-16: the fee line is dated the business date of the action, not the new departure / calendar date.
    expect(await feeLines(b, 'early_departure_fee')).toEqual([
      { amount_vnd: o16.expected.earlyDepartureFeeVnd, d: o16.expected.feeServiceDate },
    ]);
    // The night stayed is kept on the folio.
    for (const d of o.expected.keptNights as string[]) expect(await roomNightLive(b, d)).toBe(1);
    for (const d of o.expected.cancelledNights as string[])
      expect(await roomNightLive(b, d)).toBe(0);
  });

  it('T-11-2 (BR-428-15): 03:00 on 21/10, new departure 20/10 → 409 minNewDepartureDate 21/10 (dry run and write), nothing changed', async () => {
    const o = oracle('BR-428-15');
    const i = o.input;
    const b = await direct('102', i.arrivalDate, i.departureDate, i.nightRateVnd);
    await stay(b, i.arrivalDate);
    await at(i.actionAt);
    const before = await footprint(b);
    const body = { newDepartureDate: i.newDepartureDate, noticeGivenAt: i.actionAt };
    const expectRefused = (res: Res) => {
      expect(res.statusCode, res.body).toBe(o.expected.httpStatus);
      expect(res.json()).toMatchObject({
        code: 'INVALID_TRANSITION',
        currentState: 'in_house',
        minNewDepartureDate: o.expected.hintNewDepartureDate,
      });
      expect(res.json().useCheckout).toBeUndefined();
    };
    expect(i.dryRun).toEqual([true, false]);
    expectRefused(await preview(b.id, body));
    expectRefused(
      await act(b.id, 'early-departure', { ...body, expectedRefundVnd: 0, expectedFeeVnd: 0 }),
    );
    expect(await footprint(b)).toEqual(before);
    expect(o.expected).toMatchObject({ bookingChanged: false, folioChanged: false });
  });

  it('BR-428-15 note: in the window the hint comes before "new departure ≤ arrival" – a stay arrived 20/10 sending 20/10 gets 409, not 422', async () => {
    const b = await direct('201', '2026-10-20', '2026-10-24', 700_000);
    await stay(b, '2026-10-20');
    await at('2026-10-21T03:00:00+07:00');
    const before = await footprint(b);
    const res = await preview(b.id, {
      newDepartureDate: '2026-10-20',
      noticeGivenAt: '2026-10-21T03:00:00+07:00',
    });
    expect(res.statusCode, res.body).toBe(409);
    expect(res.json()).toMatchObject({
      code: 'INVALID_TRANSITION',
      minNewDepartureDate: '2026-10-21',
    });
    expect(await footprint(b)).toEqual(before);
  });

  it('T-11-4 (BR-428-17): stay 20–21/10 at 03:00 on 21/10 → no B16 (409 useCheckout, dry run and write); B18 offered and done without surcharge', async () => {
    const o = oracle('BR-428-17');
    const i = o.input;
    const b = await direct('103', i.arrivalDate, i.departureDate, 700_000);
    await stay(b, i.arrivalDate);
    await at(i.actionAt);
    const r = await get(b.id);
    expect(events(r)).toContain('check_out');
    expect(events(r)).not.toContain('early_departure');
    const before = await footprint(b);
    const body = { newDepartureDate: '2026-10-21', noticeGivenAt: i.actionAt };
    for (const res of [
      await preview(b.id, body),
      await act(b.id, 'early-departure', { ...body, expectedRefundVnd: 0, expectedFeeVnd: 0 }),
    ]) {
      expect(res.statusCode, res.body).toBe(409);
      expect(res.json()).toMatchObject({
        code: 'INVALID_TRANSITION',
        currentState: 'in_house',
        useCheckout: true,
      });
      expect(o.expected.earlyDepartureAllowed).toBe(false);
    }
    expect(await footprint(b)).toEqual(before);
    // The hint: Trả phòng (B18, V5-10) – available now, no surcharge, no extra night.
    expect(o.expected).toMatchObject({ hint: 'checkout', checkoutAvailable: true });
    const s = (
      await c.fd!.get(url(`/reservations/${b.id}/checkout-summary?checkoutTime=03:00`))
    ).json();
    expect(s).toMatchObject({
      checkoutAt: '2026-10-21T03:00:00.000+07:00',
      postMidnightWindow: true,
      extraNightRequired: false,
      lateCheckoutSurcharge: { amountVnd: o.expected.extraNightChargeVnd },
      amountDueAtCheckoutVnd: 0,
    });
    const out = await act(b.id, 'check-out', { checkoutTime: '03:00', checkoutAt: s.checkoutAt });
    expect(out.statusCode, out.body).toBe(200);
  });

  it('T-11-5 (BR-428-12/13 boundary): 05:59 → minimum 21/10 (20/10 → 409, 21/10 → 1 day notice); 06:00 → minimum 21/10 by the business date, 0 day notice, 20/10 → 422 as before', async () => {
    const b = await direct('202', '2026-10-20', '2026-10-24', 700_000);
    await stay(b, '2026-10-20');
    await at('2026-10-21T05:59:00+07:00');
    const at559 = '2026-10-21T05:59:00+07:00';
    const early = await preview(b.id, { newDepartureDate: '2026-10-20', noticeGivenAt: at559 });
    expect(early.statusCode, early.body).toBe(409);
    expect(early.json().minNewDepartureDate).toBe('2026-10-21');
    const ok = await preview(b.id, { newDepartureDate: '2026-10-21', noticeGivenAt: at559 });
    expect(ok.statusCode, ok.body).toBe(200);
    expect(ok.json()).toMatchObject({ noticeDays: 1, refundVnd: 1_050_000 });
    await at('2026-10-21T06:00:00+07:00');
    const at600 = '2026-10-21T06:00:00+07:00';
    const day = await preview(b.id, { newDepartureDate: '2026-10-21', noticeGivenAt: at600 });
    expect(day.statusCode, day.body).toBe(200);
    expect(day.json()).toMatchObject({ noticeDays: 0, refundVnd: 0 });
    const past = await preview(b.id, { newDepartureDate: '2026-10-20', noticeGivenAt: at600 });
    expect(past.statusCode, past.body).toBe(422);
    expect(past.json().errors).toEqual([{ field: 'newDepartureDate', code: 'DATE_INVALID' }]);
  });

  it('T-11-7 (BR-309-27): cancel at 01:30 on 22/10 (business date 21/10), arrival 25/10, deposit 700.000 → 4 days, 350.000 kept, fee line dated 21/10', async () => {
    const o = oracle('BR-309-27');
    const i = o.input;
    // 3 nights × 800.000 → deposit 30 % = 720.000 → 700.000 (rounding.deposit 100.000) = the oracle's deposit.
    const b = await direct('203', i.arrivalDate, '2026-10-28', 800_000);
    expect(b.depositRequiredVnd).toBe(i.requiredDepositVnd);
    expect((await get(b.id)).depositPaidVnd).toBe(i.depositCollectedVnd);
    await at(i.cancelledAt);
    const dry = await c.fd!.send('POST', url(`/reservations/${b.id}/actions/cancel`), {
      reasonCode: 'found_other',
      dryRun: true,
    });
    expect(dry.statusCode, dry.body).toBe(200);
    // 4 days' notice from the business date (21/10 → 25/10): cancel_policy_direct band ≥ 3 days → 50 % kept.
    expect(o.expected.noticeDays).toBe(4);
    expect(dry.json().cancellation).toMatchObject({
      retainedVnd: o.expected.cancellationFeeVnd,
      refundableVnd: o.expected.refundVnd,
    });
    const r = await act(b.id, 'cancel', { reasonCode: 'found_other' });
    expect(r.statusCode, r.body).toBe(200);
    expect(await feeLines(b, 'cancellation_fee')).toEqual([
      { amount_vnd: o.expected.cancellationFeeVnd, d: o.expected.feeServiceDate },
    ]);
    expect(o.expected.businessDate).toBe(o.expected.feeServiceDate);
  });

  it('T-11-8 (BR-311-04): no-show marked 00:40 on 21/10 (business date 20/10), deposit 500.000 → 500.000 kept, fee line dated 20/10', async () => {
    const o = oracle('BR-311-04');
    const i = o.input;
    // 1 night × 1.600.000 → deposit 30 % = 480.000 → 500.000 = the oracle's deposit.
    const b = await direct('301', i.arrivalDate, '2026-10-21', 1_600_000);
    expect(b.depositRequiredVnd).toBe(i.requiredDepositVnd);
    await at(i.markedNoShowAt);
    const r = await act(b.id, 'mark-no-show', { contactAttemptNote: 'Gọi 3 lần không nghe' });
    expect(r.statusCode, r.body).toBe(200);
    expect(await feeLines(b, 'no_show_fee')).toEqual([
      { amount_vnd: o.expected.noShowFeeVnd, d: o.expected.feeServiceDate },
    ]);
    expect(o.expected.businessDate).toBe(o.expected.feeServiceDate);
  });

  it('DOM 2.1 (5): an overpayment the guest leaves at a B18 at 02:00 (deposit_forfeit) is dated the business date (the eve)', async () => {
    const b = await direct('302', '2026-10-20', '2026-10-21', 700_000);
    await stay(b, '2026-10-20', 100_000);
    await at('2026-10-21T02:00:00+07:00');
    const s = (
      await c.mgr!.get(url(`/reservations/${b.id}/checkout-summary?checkoutTime=02:00`))
    ).json();
    expect(s).toMatchObject({
      checkoutAt: '2026-10-21T02:00:00.000+07:00',
      postMidnightWindow: true,
    });
    const out = await act(
      b.id,
      'check-out',
      {
        checkoutTime: '02:00',
        checkoutAt: s.checkoutAt,
        overpaymentHandling: {
          mode: 'retain_with_guest_consent',
          reason: 'Khách để lại tiền thừa',
        },
      },
      'mgr',
    );
    expect(out.statusCode, out.body).toBe(200);
    expect(await feeLines(b, 'deposit_forfeit')).toEqual([
      { amount_vnd: 100_000, d: '2026-10-20' },
    ]);
  });

  it('DOM PR114-01 (BR-428-14 on a booking a sale closed): 03:00 on 21/10 → the commission base keeps night 20/10 (700.000), never the 1.050.000 fee', async () => {
    // Test rate only (SEC G3), in force before the booking is made.
    await setParam(
      db,
      t,
      'short_stay_commission_pct',
      { staff: test_rate_short, collaborator: test_rate_short },
      '2026-10-02',
    );
    const o = oracle('BR-428-14');
    const i = o.input;
    const b = await direct('402', i.arrivalDate, i.departureDate, i.nightRateVnd, {
      directSource: 'sales_staff',
      closerUserId: t.users.sal!.id,
    });
    const rows = () =>
      q<{ status: string; payee_type: string; rate: string; base: number; amount: number }>(
        `SELECT status, payee_type, rate_pct_snapshot::text AS rate, base_amount_vnd AS base,
                amount_vnd AS amount
           FROM commission WHERE reservation_id = $1 AND status <> 'void' ORDER BY created_at`,
        [b.id],
      );
    const nights = dates(i.arrivalDate, i.departureDate).length;
    const row = (base: number) => ({
      status: 'projected',
      payee_type: 'staff',
      rate: String(test_rate_short),
      base,
      amount: applyPct(base, test_rate_short, 1),
    });
    expect(await rows()).toEqual([row(nights * i.nightRateVnd)]);
    await stay(b, i.arrivalDate);
    await at(i.notifiedAt);
    const body = { newDepartureDate: i.newDepartureDate, noticeGivenAt: i.notifiedAt };
    const dry = await preview(b.id, body);
    expect(dry.statusCode, dry.body).toBe(200);
    expect(dry.json().earlyDepartureFeeVnd).toBe(o.expected.earlyDepartureFeeVnd);
    const wr = await act(b.id, 'early-departure', {
      ...body,
      expectedRefundVnd: dry.json().refundVnd,
      expectedFeeVnd: dry.json().earlyDepartureFeeVnd,
    });
    expect(wr.statusCode, wr.body).toBe(200);
    // One night kept (20/10): base 700.000 – the early-departure fee (other revenue, BR-904) is not in it.
    const kept = nights - o.expected.cancelledNights.length;
    expect(kept).toBe(1);
    expect(await rows()).toEqual([row(kept * i.nightRateVnd)]);
    expect((await feeLines(b, 'early_departure_fee')).map((l) => l.amount_vnd)).toEqual([
      o.expected.earlyDepartureFeeVnd,
    ]);
  });
});
