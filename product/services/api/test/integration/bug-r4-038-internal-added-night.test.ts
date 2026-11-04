/**
 * BUG-R4-038 (P0, v1.0.4 hotfix – QA 04/11, DOM mục 1.8): a night ADDED to an Internal-channel stay (B13 extension,
 * the B9a prior night, B18's extra night after the last late tier) took the Direct calendar instead of 0 ₫ – the
 * complimentary booking (`is_complimentary`) got a room total, folio lines and `stay_night` revenue > 0, and the
 * desk could not bring it back to 0 (AMOUNT_NOT_POSITIVE, RATE_OUT_OF_RANGE under the Direct floor).
 * Rule (EP02 kênh Nội bộ, BR-904 / DOM D-7, metrics Q-05; DOM 04/11): the added night of an Internal stay is 0 ₫ by
 * default, source `complimentary`, no Direct floor–ceiling, 0 may be typed; the rare "Internal with a charge" is a
 * typed price > 0 (source `manual`). Other channels keep their behaviour (control case). A31 (DOM R5): OWN/MGR bring
 * an Internal night back to 0 ₫ (`complimentary`, audited with the role); FD typing 1 ₫ is intended (no floor).
 * Real PostgreSQL through HTTP the way the Desk calls it. Fake clock, FAKE data only.
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
import { sha256Hex } from '../../src/shared/http/auth.guard';
import { Client, type FeatureApp, P, startFeatureApp } from '../helpers/feature-app';
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

const ROLES = { mgr: ['manager'], fd: ['front_desk'] };

/** BR-421 v0.5.3 Internal branch – DOM's numbers (QA oracle rows BR-421-04…11, recomputed by validate-fixtures). */
const ORACLES = JSON.parse(
  readFileSync(join(__dirname, '../../../../tests/fixtures/br-examples.json'), 'utf8'),
) as {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  examples: Array<{ id: string; input: Record<string, any>; expected: Record<string, any> }>;
};
const oracle = (id: string) => {
  const o = ORACLES.examples.find((x) => x.id === id);
  if (!o) throw new Error(`oracle ${id} missing`);
  return o;
};

type Booking = { id: string; code: string; version: number; folioId: string };

interface NightRow {
  stay_date: string;
  gross: number;
  revenue: number;
  is_complimentary: boolean;
  rate_source: string;
}

describe.skipIf(!HAS_DB)(
  'BUG-R4-038 – added nights of an Internal stay are 0 ₫ (B13, B9a, B18; BR-421 v0.5.3)',
  () => {
    let db: Database;
    let fa: FeatureApp;
    let t: TestTenant;
    let ids: BookingIds;
    let guest: string;
    const c: Record<string, Client> = {};

    beforeAll(async () => {
      db = appDatabase(6);
      t = await createTenant(db, { users: ROLES });
      ids = await seedBooking(db, t);
      guest = await seedGuestRow(db, t, { name: 'Khách Nội Bộ Thử' });
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
            new Date('2026-10-01T00:00:00Z'),
            new Date('2027-12-31T00:00:00Z'),
          ],
        ),
      );
      c.fd!.deviceToken = token;
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
    const q = async <T>(sql: string, p: unknown[] = []) =>
      (await db.withContext(t.ctx(), (tx) => tx.query(sql, p))).rows as T[];
    const ready = (room: string) =>
      q(
        `INSERT INTO room_status (room_id, organization_id, property_id, status, since) VALUES ($1, $2, $3, 'VC', $4)
       ON CONFLICT (room_id) DO UPDATE SET status = 'VC'`,
        [ids.rooms[room], t.organizationId, t.propertyIds[0], new Date('2026-10-01T00:00:00Z')],
      );
    const get = async (id: string) => (await c.fd!.get(url(`/reservations/${id}`))).json();
    const act = async (id: string, verb: string, body: unknown) =>
      c.fd!.send('POST', url(`/reservations/${id}/actions/${verb}`), body, {
        'if-match': `"${(await get(id)).version}"`,
      });
    const folio = async (folioId: string) =>
      (await c.fd!.get(url(`/folios/${folioId}`))).json() as {
        version: number;
        totals: { totalVnd: number; balanceDueVnd: number; creditVnd: number };
        lines: Array<{ category: string; amountVnd: number; lineState: string }>;
      };
    const create = async (body: Record<string, unknown>): Promise<Booking> => {
      let res = await c.fd!.send('POST', url('/reservations'), body);
      if (res.statusCode === 422 && res.json().code === 'DEPOSIT_INSUFFICIENT') {
        res = await c.fd!.send('POST', url('/reservations'), {
          ...body,
          initialPayment: {
            type: 'deposit',
            method: 'cash',
            amountVnd: res.json().depositRequiredVnd,
          },
        });
      }
      expect(res.statusCode, res.body).toBe(201);
      return res.json() as Booking;
    };
    /** `typedVnd`: "Internal with a charge" – the price typed at creation (`manual`, no range – EP02). */
    const internal = (
      room: string,
      arrivalDate: string,
      departureDate: string,
      typedVnd?: number,
    ) =>
      create({
        roomId: ids.rooms[room],
        channelId: ids.channels.internal,
        adults: 1,
        bookerGuestId: guest,
        paymentModel: 'direct',
        arrivalDate,
        departureDate,
        internalNote: 'Người nhà chủ đầu tư ở thử',
        ...(typedVnd === undefined
          ? {}
          : { nightlyRates: [{ date: arrivalDate, amountVnd: typedVnd, edited: true }] }),
      });
    const direct = (room: string, arrivalDate: string, departureDate: string) =>
      create({
        roomId: ids.rooms[room],
        channelId: ids.channels.direct,
        directSource: 'zalo_phone',
        adults: 2,
        bookerGuestId: guest,
        paymentModel: 'direct',
        arrivalDate,
        departureDate,
        initialPayment: { type: 'deposit', method: 'cash', amountVnd: 500_000 },
      });
    /** B9 at 15:00 on the arrival day, paying what is due first (0 for an Internal stay). */
    const stay = async (b: Booking, room: string, from: string) => {
      await at(`${from}T15:00:00+07:00`);
      await ready(room);
      const due = (await folio(b.folioId)).totals.balanceDueVnd;
      if (due > 0) {
        const p = await c.fd!.send('POST', url(`/folios/${b.folioId}/payments`), {
          type: 'charge',
          method: 'cash',
          amountVnd: due,
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
    const nights = (id: string) =>
      q<NightRow>(
        `SELECT stay_date::text AS stay_date, room_revenue_gross_vnd::int AS gross, room_revenue_vnd::int AS revenue,
              is_complimentary, rate_source
         FROM stay_night WHERE reservation_id = $1 AND night_state <> 'void' ORDER BY stay_date`,
        [id],
      );
    const booking = async (id: string) =>
      (
        await q<{
          is_complimentary: boolean;
          total_room_vnd: number;
          nights: Array<{ date: string; amountVnd: number; source: string }>;
        }>(
          `SELECT is_complimentary, total_room_vnd::int AS total_room_vnd, pricing_snapshot->'nights' AS nights
           FROM reservation WHERE id = $1`,
          [id],
        )
      )[0]!;
    const snapSource = async (id: string, date: string) =>
      (await booking(id)).nights.find((n) => n.date === date)?.source;
    /** The complimentary invariants of an Internal booking whose every night is 0 ₫ (DATA Q-05). */
    const expectComplimentary = async (b: Booking) => {
      const r = await booking(b.id);
      expect(r.is_complimentary).toBe(true);
      expect(r.total_room_vnd).toBe(0);
      for (const n of await nights(b.id)) {
        expect(n, n.stay_date).toMatchObject({ gross: 0, revenue: 0, is_complimentary: true });
      }
      const f = await folio(b.folioId);
      expect(f.totals).toMatchObject({ totalVnd: 0, balanceDueVnd: 0, creditVnd: 0 });
      const room = f.lines.filter((l) => l.category === 'room' && l.lineState === 'posted');
      expect(room.reduce((a, l) => a + l.amountVnd, 0)).toBe(0);
    };
    const summary = async (b: Booking, time: string) =>
      (await c.fd!.get(url(`/reservations/${b.id}/checkout-summary?checkoutTime=${time}`))).json();
    const lateLines = async (b: Booking) =>
      (await folio(b.folioId)).lines.filter(
        (l) => l.category === 'late_checkout' && l.lineState === 'posted',
      );
    /** The live room line of one night (A31 target). */
    const roomLine = async (b: Booking, date: string) => {
      const [line] = await q<{ id: string }>(
        `SELECT l.id FROM folio_line l WHERE l.folio_id = $1 AND l.category = 'room' AND l.service_date = $2
          AND l.line_state = 'posted' AND l.reversal_of_id IS NULL
          AND NOT EXISTS (SELECT 1 FROM folio_line x WHERE x.reversal_of_id = l.id)`,
        [b.folioId, date],
      );
      expect(line, `room line ${date}`).toBeTruthy();
      return line!.id;
    };
    const ZERO_REASON = 'Đơn Nội bộ – đưa đêm về 0 đ (BUG-R4-038)';
    const adjust = async (
      who: 'fd' | 'mgr',
      b: Booking,
      lineId: string,
      newUnitPriceVnd: number,
      reason = ZERO_REASON,
    ) =>
      c[who]!.send(
        'POST',
        url(`/folios/${b.folioId}/lines/${lineId}/adjustments`),
        { newUnitPriceVnd, reason },
        { 'if-match': `"${(await folio(b.folioId)).version}"` },
      );
    /** Money audit rows of one entity (SEC FB-R4-SEC-BE-PR71-01). */
    const audits = (action: string, entityId: string) =>
      q<{
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        after: Record<string, any>;
        actor: string;
        reason: string | null;
      }>(
        `SELECT after, actor_user_id::text AS actor, reason FROM audit_event
          WHERE action = $1 AND entity_id = $2 ORDER BY occurred_at, id`,
        [action, entityId],
      );

    it('B13: extending an Internal stay by 1 night – the night is 0 ₫, source `complimentary`, no Direct range, nothing left to collect', async () => {
      await at('2026-10-20T10:00:00+07:00');
      const b = await internal('301', '2026-11-16', '2026-11-17');
      await stay(b, '301', '2026-11-16');
      await at('2026-11-16T20:00:00+07:00');
      const o = (await c.fd!.get(url(`/reservations/${b.id}/extension-options`))).json();
      expect(o.nights[0]).toMatchObject({ date: '2026-11-17', available: true, defaultRateVnd: 0 });
      expect(o.nights[0].floorVnd).toBeUndefined();
      expect(o.nights[0].ceilingVnd).toBeUndefined();
      expect(o.currentBookingRateVnd).toBeNull();
      expect(o.repricing[0]).toMatchObject({ nights: 1, repricedTotalVnd: 0, deltaVnd: 0 });
      const ext = await act(b.id, 'extend', { nights: 1 });
      expect(ext.statusCode, ext.body).toBe(200);
      expect(ext.json().reservation).toMatchObject({
        departureDate: '2026-11-18',
        totalRoomVnd: 0,
      });
      const added = (await nights(b.id)).find((n) => n.stay_date === '2026-11-17');
      expect(added).toMatchObject({ gross: 0, rate_source: 'extension', is_complimentary: true });
      expect(await snapSource(b.id, '2026-11-17')).toBe('complimentary');
      await expectComplimentary(b);
    });

    it('B13: an Internal night typed at 0 is accepted (`complimentary`); "Internal with a charge" typed under the Direct floor is `manual`', async () => {
      await at('2026-10-20T10:00:00+07:00');
      const b = await internal('302', '2026-11-16', '2026-11-17');
      await stay(b, '302', '2026-11-16');
      await at('2026-11-16T20:00:00+07:00');
      const zero = await act(b.id, 'extend', {
        nights: 1,
        nightlyRates: [{ date: '2026-11-17', amountVnd: 0, edited: true }],
      });
      expect(zero.statusCode, zero.body).toBe(200);
      expect(await snapSource(b.id, '2026-11-17')).toBe('complimentary');
      await expectComplimentary(b);
      // The rare charged Internal night: a typed price > 0, below the Direct floor – no Direct range applies.
      const paid = await act(b.id, 'extend', {
        nights: 1,
        nightlyRates: [{ date: '2026-11-18', amountVnd: 100_000, edited: true }],
      });
      expect(paid.statusCode, paid.body).toBe(200);
      const n18 = (await nights(b.id)).find((n) => n.stay_date === '2026-11-18');
      expect(n18).toMatchObject({ gross: 100_000, rate_source: 'extension' });
      expect(await snapSource(b.id, '2026-11-18')).toBe('manual');
      expect((await booking(b.id)).total_room_vnd).toBe(100_000);
      expect((await folio(b.folioId)).totals.balanceDueVnd).toBe(100_000);
      // A negative amount is still refused.
      const neg = await act(b.id, 'extend', {
        nights: 1,
        nightlyRates: [{ date: '2026-11-19', amountVnd: -1, edited: true }],
      });
      expect(neg.statusCode).toBe(422);
      expect(neg.json().errors).toEqual([{ field: 'nightlyRates', code: 'AMOUNT_NOT_POSITIVE' }]);
    });

    it('B9a: an Internal guest arriving at 04:30 – the prior night is 0 ₫ (`complimentary`), checked in the way the Desk sends it', async () => {
      await at('2026-10-20T10:00:00+07:00');
      const b = await internal('401', '2026-11-20', '2026-11-21');
      await at('2026-11-20T04:30:00+07:00');
      await ready('401');
      const pv = (await c.fd!.get(url(`/reservations/${b.id}/check-in-preview`))).json();
      expect(pv.earlyCheckinSurcharge.addsPreviousNight).toBe(true);
      expect(pv.priorNight).toMatchObject({
        date: '2026-11-19',
        available: true,
        defaultRateVnd: 0,
      });
      expect(pv.priorNight.floorVnd).toBeUndefined();
      expect(pv.priorNight.ceilingVnd).toBeUndefined();
      expect(pv.amountDueAtCheckinVnd).toBe(0);
      // H13 with a 0 ₫ night: nothing to tell the guest – no `expectedSurchargeVnd`, no rate (CheckInPage).
      const ci = await act(b.id, 'check-in', {
        cardsIssued: 1,
        houseRulesSent: true,
        checkinTime: '04:30',
        addPriorNight: true,
      });
      expect(ci.statusCode, ci.body).toBe(200);
      expect((await get(b.id)).arrivalDate).toBe('2026-11-19');
      const prior = (await nights(b.id)).find((n) => n.stay_date === '2026-11-19');
      expect(prior).toMatchObject({ gross: 0, rate_source: 'extra_night_early_late' });
      expect(await snapSource(b.id, '2026-11-19')).toBe('complimentary');
      await expectComplimentary(b);
    });

    it('B9a typed on an Internal stay (ARC FB-R4-ARC-BE-PR71-02 (2)(3)): 0 → `complimentary`; 150.000 under the Direct floor → `manual`, collected before the keys', async () => {
      await at('2026-10-20T10:00:00+07:00');
      const zero = await internal('301', '2026-11-25', '2026-11-26');
      const paid = await internal('302', '2026-11-25', '2026-11-26');
      await at('2026-11-25T04:30:00+07:00');
      await ready('301');
      await ready('302');
      const ci0 = await act(zero.id, 'check-in', {
        cardsIssued: 1,
        houseRulesSent: true,
        checkinTime: '04:30',
        addPriorNight: true,
        priorNightRateVnd: 0,
      });
      expect(ci0.statusCode, ci0.body).toBe(200);
      expect((await nights(zero.id)).find((n) => n.stay_date === '2026-11-24')?.gross).toBe(0);
      expect(await snapSource(zero.id, '2026-11-24')).toBe('complimentary');
      await expectComplimentary(zero);
      // "Internal with a charge": typed 150.000 – no Direct range; the night is money, so it is told and collected.
      const ci = await act(paid.id, 'check-in', {
        cardsIssued: 1,
        houseRulesSent: true,
        checkinTime: '04:30',
        addPriorNight: true,
        priorNightRateVnd: 150_000,
        expectedSurchargeVnd: 150_000,
        payment: { type: 'charge', method: 'cash', amountVnd: 150_000 },
      });
      expect(ci.statusCode, ci.body).toBe(200);
      const prior = (await nights(paid.id)).find((n) => n.stay_date === '2026-11-24');
      expect(prior).toMatchObject({ gross: 150_000, rate_source: 'extra_night_early_late' });
      expect(await snapSource(paid.id, '2026-11-24')).toBe('manual');
      expect((await booking(paid.id)).total_room_vnd).toBe(150_000);
      expect((await folio(paid.folioId)).totals.balanceDueVnd).toBe(0);
    });

    it('B18: an Internal guest leaving at 19:00 – the extra night is 0 ₫ (`complimentary`); typed 0 accepted; the stay closes at 0', async () => {
      await at('2026-10-20T10:00:00+07:00');
      const b = await internal('402', '2026-11-16', '2026-11-17');
      await stay(b, '402', '2026-11-16');
      await at('2026-11-17T19:00:00+07:00');
      const s = (
        await c.fd!.get(url(`/reservations/${b.id}/checkout-summary?checkoutTime=19:00`))
      ).json();
      expect(s).toMatchObject({
        extraNightRequired: true,
        extraNightAvailable: true,
        extraNightDefaultRateVnd: 0,
        amountDueAtCheckoutVnd: 0,
      });
      expect(s.extraNightFloorVnd).toBeUndefined();
      expect(s.extraNightCeilingVnd).toBeUndefined();
      const out = await act(b.id, 'check-out', {
        checkoutTime: '19:00',
        extraNight: { rateVnd: 0 },
      });
      expect(out.statusCode, out.body).toBe(200);
      const extra = (await nights(b.id)).find((n) => n.stay_date === '2026-11-17');
      expect(extra).toMatchObject({ gross: 0, rate_source: 'extra_night_early_late' });
      expect(await snapSource(b.id, '2026-11-17')).toBe('complimentary');
      await expectComplimentary(b);
    });

    it('B18: Internal stay, the departure-day night is sold to another guest – the late charge of one night is 0 ₫, B18 needs no manager confirmation', async () => {
      await at('2026-10-20T10:00:00+07:00');
      const b = await internal('103', '2026-11-16', '2026-11-17');
      await direct('103', '2026-11-17', '2026-11-19');
      await stay(b, '103', '2026-11-16');
      await at('2026-11-17T19:00:00+07:00');
      const s = (
        await c.fd!.get(url(`/reservations/${b.id}/checkout-summary?checkoutTime=19:00`))
      ).json();
      expect(s).toMatchObject({
        extraNightRequired: true,
        extraNightAvailable: false,
        lateFeeAsNightVnd: 0,
        amountDueAtCheckoutVnd: 0,
      });
      // ARC FB-R4-ARC-BE-PR71-02 (1): nothing to confirm – a `lateFeeInsteadOfNight` sent anyway is refused (422)
      // before any password check (never 401), on every confirmation path; nothing is written.
      const REASON = 'Khách trả muộn, căn có khách đến';
      const refused: Array<[Record<string, unknown>, { field: string; code: string }]> = [
        [
          { amountVnd: 0, reason: REASON, postReview: true },
          { field: 'lateFeeInsteadOfNight.amountVnd', code: 'AMOUNT_NOT_POSITIVE' },
        ],
        [
          { amountVnd: 1, reason: REASON, postReview: true },
          { field: 'lateFeeInsteadOfNight', code: 'NOT_ALLOWED' },
        ],
        [
          {
            amountVnd: 1,
            reason: REASON,
            approverUsername: t.users.mgr!.username,
            authMethod: 'password',
            secret: 'not-the-password',
          },
          { field: 'lateFeeInsteadOfNight', code: 'NOT_ALLOWED' },
        ],
      ];
      for (const [lateFeeInsteadOfNight, error] of refused) {
        const r = await act(b.id, 'check-out', { checkoutTime: '19:00', lateFeeInsteadOfNight });
        expect(r.statusCode, r.body).toBe(422);
        expect(r.json().errors).toContainEqual(error);
      }
      expect((await get(b.id)).status).toBe('in_house');
      expect(await audits('reservation.late_fee_instead_of_night', b.id)).toEqual([]);
      const out = await act(b.id, 'check-out', { checkoutTime: '19:00' });
      expect(out.statusCode, out.body).toBe(200);
      const f = await folio(b.folioId);
      expect(f.lines.filter((l) => l.category === 'late_checkout')).toEqual([]);
      await expectComplimentary(b);
    });

    it('BR-421-04/05/06 (DOM numbers): Internal 202 + 2 nights → 0 ₫, due 0; typed 0 accepted; typed 300.000 → `manual`; A31 brings it back to 0 (OWN/MGR only)', async () => {
      const o4 = oracle('BR-421-04');
      const o5 = oracle('BR-421-05');
      const o6 = oracle('BR-421-06');
      await at('2026-10-20T10:00:00+07:00');
      const b = await internal(o4.input.roomNo, '2026-11-10', '2026-11-11');
      await stay(b, '202', '2026-11-10');
      await at('2026-11-10T20:00:00+07:00');
      // (a) default, 2 nights.
      const o = (await c.fd!.get(url(`/reservations/${b.id}/extension-options`))).json();
      expect(o.repricing[o4.input.extraNights - 1]).toMatchObject({
        nights: o4.input.extraNights,
        repricedTotalVnd: o4.expected.extensionVnd,
        deltaVnd: o4.expected.extensionVnd,
      });
      const two = await act(b.id, 'extend', { nights: o4.input.extraNights });
      expect(two.statusCode, two.body).toBe(200);
      const added = ['2026-11-11', '2026-11-12'];
      const n4 = (await nights(b.id)).filter((n) => added.includes(n.stay_date));
      expect(n4.map((n) => n.gross)).toEqual(o4.expected.nightsVnd);
      for (const [k, d] of added.entries()) {
        expect(await snapSource(b.id, d)).toBe(o4.expected.nightSources[k]);
      }
      expect((await folio(b.folioId)).totals.balanceDueVnd).toBe(o4.expected.amountDueAfterVnd);
      // (a) typed 0 on both nights is accepted.
      const typed0 = ['2026-11-13', '2026-11-14'];
      const zero = await act(b.id, 'extend', {
        nights: o5.input.extraNights,
        nightlyRates: typed0.map((date, k) => ({
          date,
          amountVnd: o5.input.typedRatesVnd[k],
          edited: true,
        })),
      });
      expect(zero.statusCode, zero.body).toBe(200);
      for (const [k, d] of typed0.entries()) {
        expect(await snapSource(b.id, d)).toBe(o5.expected.nightSources[k]);
      }
      expect((await folio(b.folioId)).totals.balanceDueVnd).toBe(o5.expected.amountDueAfterVnd);
      await expectComplimentary(b);
      // (b) "Internal with a charge": 300.000 typed, under the Direct floor of 202 – no range, `manual`.
      const paid = await act(b.id, 'extend', {
        nights: o6.input.extraNights,
        nightlyRates: [{ date: '2026-11-15', amountVnd: o6.input.typedRatesVnd[0], edited: true }],
      });
      expect(paid.statusCode, paid.body).toBe(200);
      const n15 = (await nights(b.id)).find((n) => n.stay_date === '2026-11-15');
      expect(n15?.gross).toBe(o6.expected.extensionVnd);
      expect(await snapSource(b.id, '2026-11-15')).toBe(o6.expected.nightSources[0]);
      expect((await booking(b.id)).total_room_vnd).toBe(o6.expected.extensionVnd);
      // R5 (DOM lượt 3): A31 can bring an Internal night back to 0 ₫ – OWN/MGR only, reason mandatory.
      const repriced = () => audits('reservation.repriced', b.id);
      const before = (await repriced()).length;
      const line = await roomLine(b, '2026-11-15');
      const byFd = await adjust('fd', b, line, 0);
      expect(byFd.statusCode, byFd.body).toBe(403);
      expect(byFd.json().code).toBe('FORBIDDEN_ACTION');
      // Refused in the transaction: no audit, the night and the folio are as they were.
      expect(await repriced()).toHaveLength(before);
      expect(await audits('folio_line.adjusted', line)).toEqual([]);
      expect((await nights(b.id)).find((n) => n.stay_date === '2026-11-15')?.gross).toBe(
        o6.expected.extensionVnd,
      );
      expect((await folio(b.folioId)).totals.balanceDueVnd).toBe(o6.expected.extensionVnd);
      // INTENDED (SEC FB-R4-SEC-BE-PR71-01, ARC 3.2): FD may still type 1 ₫ – an Internal night has no BR-105 floor
      // (DOM, BR-421 (b): "Internal with a charge" is any typed price > 0). It stays `manual`, audited with FD as
      // the actor. Making 0 and > 0 consistent is FB-R4-ARC-BE-PR71-03 (v1.0.5).
      const oneVnd = await adjust('fd', b, line, 1, 'Nội bộ có thu – sửa giá theo ghi chú');
      expect(oneVnd.statusCode, oneVnd.body).toBe(201);
      expect(await snapSource(b.id, '2026-11-15')).toBe('manual');
      const [fdAudit] = (await repriced()).slice(before);
      expect(fdAudit).toMatchObject({
        actor: t.users.fd!.id,
        reason: 'Nội bộ có thu – sửa giá theo ghi chú',
        after: { nightlyRates: [{ date: '2026-11-15', amountVnd: 1 }], rateSource: 'manual' },
      });
      expect(fdAudit!.after.actorRole).toBeUndefined();
      const line1 = await roomLine(b, '2026-11-15');
      const byMgr = await adjust('mgr', b, line1, 0);
      expect(byMgr.statusCode, byMgr.body).toBe(201);
      expect(await snapSource(b.id, '2026-11-15')).toBe('complimentary');
      // One money audit for the night (with the role at the time – SEC PR71-02) and one for the folio line.
      const after = (await repriced()).slice(before + 1);
      expect(after).toHaveLength(1);
      expect(after[0]).toMatchObject({
        actor: t.users.mgr!.id,
        reason: ZERO_REASON,
        after: {
          nightlyRates: [{ date: '2026-11-15', amountVnd: 0 }],
          rateSource: 'complimentary',
          actorRole: 'manager',
        },
      });
      const adjusted = await audits('folio_line.adjusted', line1);
      expect(adjusted).toHaveLength(1);
      expect(adjusted[0]).toMatchObject({
        actor: t.users.mgr!.id,
        reason: ZERO_REASON,
        after: { category: 'room', amountVnd: 0 },
      });
      await expectComplimentary(b);
    });

    it('BR-421-07 (DOM numbers): Internal, last night 0 ₫, leaving at 15:00 with a guest arriving → surcharge 0, no line', async () => {
      const o7 = oracle('BR-421-07');
      await at('2026-10-20T10:00:00+07:00');
      const b = await internal('203', '2026-11-16', '2026-11-17');
      await direct('203', '2026-11-17', '2026-11-19');
      await stay(b, '203', '2026-11-16');
      await at(`2026-11-17T${o7.input.checkoutTime}:00+07:00`);
      const s = await summary(b, o7.input.checkoutTime);
      expect(s.lateCheckoutSurcharge.amountVnd).toBe(o7.expected.surchargeVnd);
      expect(s.amountDueAtCheckoutVnd).toBe(0);
      const out = await act(b.id, 'check-out', { checkoutTime: o7.input.checkoutTime });
      expect(out.statusCode, out.body).toBe(200);
      expect((await lateLines(b)).length > 0).toBe(o7.expected.surchargeLineWritten);
      await expectComplimentary(b);
    });

    it('BR-421-08/09/10 (DOM numbers): Internal with a charge, last night 300.000 → 15:00 = 90.000, 17:00 = 150.000 (its own night, not Direct); 19:00 → extra night 0 ₫', async () => {
      const o8 = oracle('BR-421-08');
      const o9 = oracle('BR-421-09');
      const o10 = oracle('BR-421-10');
      await at('2026-10-20T10:00:00+07:00');
      const b = await internal('101', '2026-11-16', '2026-11-17', o8.input.lastNightRateVnd);
      expect(await snapSource(b.id, '2026-11-16')).toBe('manual');
      const before = await booking(b.id);
      expect(before.total_room_vnd).toBe(o8.input.lastNightRateVnd);
      await stay(b, '101', '2026-11-16');
      for (const o of [o8, o9]) {
        await at(`2026-11-17T${o.input.checkoutTime}:00+07:00`);
        const s = await summary(b, o.input.checkoutTime);
        expect(s.lateCheckoutSurcharge.amountVnd, o.input.checkoutTime).toBe(
          o.expected.surchargeVnd,
        );
      }
      await at(`2026-11-17T${o10.input.checkoutTime}:00+07:00`);
      const s = await summary(b, o10.input.checkoutTime);
      expect(s).toMatchObject({
        extraNightRequired: o10.expected.convertToExtension,
        extraNightAvailable: o10.input.departureNightSellable,
        extraNightDefaultRateVnd: o10.expected.extensionVnd,
        amountDueAtCheckoutVnd: 0,
      });
      const out = await act(b.id, 'check-out', {
        checkoutTime: o10.input.checkoutTime,
        extraNight: {},
      });
      expect(out.statusCode, out.body).toBe(200);
      const extra = (await nights(b.id)).find((n) => n.stay_date === '2026-11-17');
      expect(extra).toMatchObject({ gross: o10.expected.extensionVnd, is_complimentary: true });
      expect(await snapSource(b.id, '2026-11-17')).toBe(o10.expected.extraNightSource);
      expect(await lateLines(b)).toEqual([]);
      const after = await booking(b.id);
      // The booking's own flag and total stay as they were: only the added night is 0 ₫.
      expect(after.is_complimentary).toBe(before.is_complimentary);
      expect(after.total_room_vnd).toBe(o8.input.lastNightRateVnd);
      expect((await folio(b.folioId)).totals.balanceDueVnd).toBe(0);
    });

    it('BR-421-11 (DOM numbers): Internal with a charge, 19:00, the night is sold → late charge of one night 0 ₫, no line', async () => {
      const o11 = oracle('BR-421-11');
      await at('2026-10-20T10:00:00+07:00');
      const b = await internal('102', '2026-11-16', '2026-11-17', o11.input.lastNightRateVnd);
      await direct('102', '2026-11-17', '2026-11-19');
      await stay(b, '102', '2026-11-16');
      // B15 in the morning: the guest agreed 17:00 – 50 % of its own night (BR-421-09) is posted now.
      const o9 = oracle('BR-421-09');
      await at('2026-11-17T10:00:00+07:00');
      const late = await act(b.id, 'late-checkout', {
        checkoutTime: o9.input.checkoutTime,
        applySurcharge: true,
        expectedSurchargeVnd: o9.expected.surchargeVnd,
      });
      expect(late.statusCode, late.body).toBe(200);
      const liveLate = async () => (await lateLines(b)).reduce((a, l) => a + l.amountVnd, 0);
      expect(await liveLate()).toBe(o9.expected.surchargeVnd);
      await at(`2026-11-17T${o11.input.checkoutTime}:00+07:00`);
      const s = await summary(b, o11.input.checkoutTime);
      // Contract (checkout summary `lateFeeAsNightVnd`, ORC 05/11): with 0 the amount to collect is
      // `amountDueAtCheckoutVnd` – the B15 charge B18 will reverse is already out of it – not the folio balance.
      expect(s).toMatchObject({
        extraNightRequired: true,
        extraNightAvailable: o11.input.departureNightSellable,
        lateFeeAsNightVnd: o11.expected.lateFeeAsNightVnd,
        amountDueAtCheckoutVnd: 0,
        balanceDueVnd: o9.expected.surchargeVnd,
      });
      const out = await act(b.id, 'check-out', { checkoutTime: o11.input.checkoutTime });
      expect(out.statusCode, out.body).toBe(200);
      expect((await liveLate()) > 0).toBe(o11.expected.surchargeLineWritten);
      expect((await booking(b.id)).total_room_vnd).toBe(o11.input.lastNightRateVnd);
      expect((await folio(b.folioId)).totals.balanceDueVnd).toBe(0);
    });

    it('control – Direct stay unchanged: B13 default = Direct calendar (`default`, with its range), 0 refused; B18 extra night 0 refused; B9a 0 refused', async () => {
      await at('2026-10-20T10:00:00+07:00');
      const b = await direct('201', '2026-11-16', '2026-11-18');
      await stay(b, '201', '2026-11-16');
      await at('2026-11-17T20:00:00+07:00');
      const o = (await c.fd!.get(url(`/reservations/${b.id}/extension-options`))).json();
      const n0 = o.nights[0];
      expect(n0.date).toBe('2026-11-18');
      expect(n0.defaultRateVnd).toBeGreaterThan(0);
      expect(n0.floorVnd).toBeGreaterThan(0);
      expect(n0.ceilingVnd).toBeGreaterThanOrEqual(n0.defaultRateVnd);
      const zero = await act(b.id, 'extend', {
        nights: 1,
        nightlyRates: [{ date: '2026-11-18', amountVnd: 0, edited: true }],
      });
      expect(zero.statusCode).toBe(422);
      expect(zero.json().errors).toEqual([{ field: 'nightlyRates', code: 'AMOUNT_NOT_POSITIVE' }]);
      const under = await act(b.id, 'extend', {
        nights: 1,
        nightlyRates: [{ date: '2026-11-18', amountVnd: 100_000, edited: true }],
      });
      expect(under.statusCode).toBe(422);
      expect(under.json().code).toBe('RATE_OUT_OF_RANGE');
      const ext = await act(b.id, 'extend', { nights: 1 });
      expect(ext.statusCode, ext.body).toBe(200);
      const added = (await nights(b.id)).find((n) => n.stay_date === '2026-11-18');
      expect(added).toMatchObject({
        gross: n0.defaultRateVnd,
        rate_source: 'extension',
        is_complimentary: false,
      });
      expect(await snapSource(b.id, '2026-11-18')).toBe('default');
      expect((await booking(b.id)).is_complimentary).toBe(false);
      // A31 0 ₫ stays Internal-only: a Direct night at 0 is refused, also for a manager.
      const a0 = await adjust('mgr', b, await roomLine(b, '2026-11-18'), 0);
      expect(a0.statusCode, a0.body).toBe(422);
      expect(a0.json().errors).toEqual([{ field: 'newUnitPriceVnd', code: 'AMOUNT_NOT_POSITIVE' }]);
      // B18 after the last tier: the Direct range is shown and a 0 rate is refused (422 on the field).
      await at('2026-11-19T19:00:00+07:00');
      const s = (
        await c.fd!.get(url(`/reservations/${b.id}/checkout-summary?checkoutTime=19:00`))
      ).json();
      expect(s.extraNightRequired).toBe(true);
      expect(s.extraNightDefaultRateVnd).toBeGreaterThan(0);
      expect(s.extraNightFloorVnd).toBeGreaterThan(0);
      expect(s.extraNightCeilingVnd).toBeGreaterThan(0);
      const out0 = await act(b.id, 'check-out', {
        checkoutTime: '19:00',
        extraNight: { rateVnd: 0 },
      });
      expect(out0.statusCode).toBe(422);
      expect(out0.json().errors).toEqual([
        { field: 'extraNight.rateVnd', code: 'AMOUNT_NOT_POSITIVE' },
      ]);
      // B9a on a Direct booking: a 0 prior-night rate is refused, the default is the Direct calendar.
      await at('2026-10-20T10:00:00+07:00');
      const e = await direct('202', '2026-11-25', '2026-11-27');
      await at('2026-11-25T04:30:00+07:00');
      await ready('202');
      const pv = (await c.fd!.get(url(`/reservations/${e.id}/check-in-preview`))).json();
      expect(pv.priorNight.defaultRateVnd).toBeGreaterThan(0);
      expect(pv.priorNight.floorVnd).toBeGreaterThan(0);
      const ci0 = await act(e.id, 'check-in', {
        cardsIssued: 1,
        houseRulesSent: true,
        addPriorNight: true,
        priorNightRateVnd: 0,
        expectedSurchargeVnd: pv.priorNight.defaultRateVnd,
      });
      expect(ci0.statusCode).toBe(422);
      expect(ci0.json().errors).toEqual([
        { field: 'priorNightRateVnd', code: 'AMOUNT_NOT_POSITIVE' },
      ]);
      // …and without `expectedSurchargeVnd` it is still required for a night > 0.
      const ciNo = await act(e.id, 'check-in', {
        cardsIssued: 1,
        houseRulesSent: true,
        addPriorNight: true,
      });
      expect(ciNo.statusCode).toBe(422);
      expect(ciNo.json().errors).toEqual([{ field: 'expectedSurchargeVnd', code: 'REQUIRED' }]);
    });
  },
);
