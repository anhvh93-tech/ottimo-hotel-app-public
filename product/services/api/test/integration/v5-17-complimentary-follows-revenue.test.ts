/**
 * V5-17 (BUG-R4-043 P2, FB-R4-SEC-OPS-ROPACK-06): the complimentary flag follows the money, not the channel
 * (BR-904 v0.5.5, DOM lượt 6 05/11; DATA Q-05, K-02, K-04; migration 0097).
 * - Night: `stay_night.is_complimentary` = `room_revenue_vnd = 0` (room money after discounts), every channel, every
 *   write path: booking, B13 typed, A31 up and back to 0, FOC / special discount 100 % vs partial.
 * - Booking: `reservation.is_complimentary` = the stay's room money is 0 (Σ of its live nights; a closed booking keeps
 *   the value of the nights it closed with) – `reservation_is_complimentary()` of 0097.
 * - The database holds the rule on any write (0097 triggers), e.g. a write of the v1.0.4 image after a rollback.
 * - The read-only count `scripts/v5-17-complimentary-check.sql` (runbook M4d) and the back-fill of 0097 as shipped:
 *   wrong flags counted "before", recomputed once (counts only), 0|0 "after", a second run writes nothing.
 * Real PostgreSQL through HTTP the way the Desk calls it. Fake clock, FAKE data only.
 */
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Client as PgClient } from 'pg';
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

const ROLES = { own: ['owner'], mgr: ['manager'], fd: ['front_desk'] };
const MIGRATION = readFileSync(
  join(__dirname, '../../src/db/migrations/0097_complimentary_follows_revenue.sql'),
  'utf8',
);
/** The back-fill of 0097 exactly as shipped (its RLS toggles, functions and triggers left out). */
const BACKFILL = MIGRATION.split('--> statement-breakpoint')
  .map((x) => x.replace(/^\s*--.*$/gm, '').trim())
  .find((x) => x.startsWith('DO $$'));
const CHECK = readFileSync(join(__dirname, '../../scripts/v5-17-complimentary-check.sql'), 'utf8');

type Booking = { id: string; code: string; version: number; folioId: string };
interface NightRow {
  stay_date: string;
  night_state: string;
  revenue: number;
  is_complimentary: boolean;
}
type Result = {
  command: string;
  fields: Array<{ name: string }>;
  rows: Array<Record<string, unknown>>;
};

describe.skipIf(!HAS_DB)(
  'V5-17 – is_complimentary follows the money (BUG-R4-043, BR-904 v0.5.5, migration 0097)',
  () => {
    let db: Database;
    let fa: FeatureApp;
    let t: TestTenant;
    let ids: BookingIds;
    let guest: string;
    let owner: PgClient;
    const notices: string[] = [];
    const c: Record<string, Client> = {};

    beforeAll(async () => {
      expect(BACKFILL, 'the DO block of 0097').toBeDefined();
      db = appDatabase(6);
      t = await createTenant(db, { users: ROLES });
      ids = await seedBooking(db, t);
      guest = await seedGuestRow(db, t, { name: 'Khách Thử Miễn Phí' });
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
      // The owner role under forced RLS, scoped to this tenant – like the migrator (and the M4d run on production,
      // which uses ottimo_readonly, BYPASSRLS).
      owner = new PgClient({ connectionString: process.env.MIGRATION_DATABASE_URL });
      await owner.connect();
      owner.on('notice', (n) => notices.push(n.message ?? ''));
      await owner.query('SET ROLE ottimo_owner');
      await owner.query(
        `SELECT set_config('app.organization_id', $1, false), set_config('app.property_id', $2, false)`,
        [t.organizationId, t.propertyIds[0]],
      );
    });
    afterAll(async () => {
      await owner?.end();
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
    const act = async (id: string, verb: string, body: unknown, who = 'fd') =>
      c[who]!.send('POST', url(`/reservations/${id}/actions/${verb}`), body, {
        'if-match': `"${(await get(id)).version}"`,
      });
    const folio = async (folioId: string) =>
      (await c.fd!.get(url(`/folios/${folioId}`))).json() as {
        version: number;
        totals: { balanceDueVnd: number };
        lines: Array<{
          id: string;
          category: string;
          amountVnd: number;
          lineState: string;
          serviceDate: string;
        }>;
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
        internalNote: 'Người nhà nhân viên ở thử',
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
    /** B9 at 15:00 on the arrival day, paying what is due first (0 for an Internal stay at 0 ₫). */
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
        `SELECT stay_date::text AS stay_date, night_state, room_revenue_vnd::int AS revenue, is_complimentary
           FROM stay_night WHERE reservation_id = $1 ORDER BY stay_date, created_at`,
        [id],
      );
    const live = async (id: string) => (await nights(id)).filter((n) => n.night_state !== 'void');
    const flagOf = async (id: string) =>
      (
        await q<{ f: boolean }>('SELECT is_complimentary AS f FROM reservation WHERE id = $1', [id])
      )[0]!.f;
    /** The live room line of one night (A31 / FOC target). */
    const roomLine = async (b: Booking, date: string) => {
      const [line] = await q<{ id: string; amount: number }>(
        `SELECT l.id, l.amount_vnd::int AS amount FROM folio_line l
          WHERE l.folio_id = $1 AND l.category = 'room' AND l.service_date = $2
            AND l.line_state = 'posted' AND l.reversal_of_id IS NULL
            AND NOT EXISTS (SELECT 1 FROM folio_line x WHERE x.reversal_of_id = l.id)`,
        [b.folioId, date],
      );
      expect(line, `room line ${date}`).toBeTruthy();
      return line!;
    };
    const adjust = async (who: 'fd' | 'mgr', b: Booking, lineId: string, newUnitPriceVnd: number) =>
      c[who]!.send(
        'POST',
        url(`/folios/${b.folioId}/lines/${lineId}/adjustments`),
        { newUnitPriceVnd, reason: 'Nội bộ – sửa giá theo ghi chú (V5-17 thử)' },
        { 'if-match': `"${(await folio(b.folioId)).version}"` },
      );
    const foc = (b: Booking, lineId: string, amountVnd: number) =>
      c.own!.send('POST', url(`/folios/${b.folioId}/lines/${lineId}/foc`), {
        kind: 'special_discount',
        amountVnd,
        reasonCode: 'regular_vip',
      });
    /** Both rules over this tenant: 0 nights and 0 bookings off the money (the invariant 0097 keeps). */
    const expectInvariant = async () => {
      const [r] = await q<{ nights: number; bookings: number }>(
        `SELECT (SELECT count(*)::int FROM stay_night WHERE is_complimentary IS DISTINCT FROM (room_revenue_vnd = 0))
                  AS nights,
                (SELECT count(*)::int FROM reservation r
                  WHERE r.is_complimentary IS DISTINCT FROM reservation_is_complimentary(r.id)) AS bookings`,
      );
      expect(r).toEqual({ nights: 0, bookings: 0 });
    };
    /** The M4d count as OPS runs it: the two count lines of the script (the guard prints no row). */
    const m4d = async (client: PgClient = owner) => {
      let results: Result[];
      try {
        results = (await client.query(CHECK)) as unknown as Result[];
      } catch (err) {
        await client.query('ROLLBACK').catch(() => undefined);
        throw err;
      }
      const select = results.filter((r) => r.command === 'SELECT');
      expect(select.map((s) => s.fields.map((f) => f.name))).toEqual([
        ['guard'],
        ['co_mien_phi_ma_co_tien', 'khong_co_mien_phi_ma_0d'],
        ['don_mien_phi_ma_co_tien', 'don_khong_mien_phi_ma_0d'],
      ]);
      expect(select[0]!.rows).toEqual([]);
      expect(results[0]!.command).toBe('BEGIN');
      expect(results.at(-1)!.command).toBe('ROLLBACK');
      const line = (s: Result) => Object.values(s.rows[0]!).map(Number).join('|');
      return { nights: line(select[1]!), bookings: line(select[2]!) };
    };

    it('BUG-R4-043 steps 1–2 (create): Internal at 0 ₫ is complimentary, "Internal with a charge" 300.000 is a sold night with money – night and booking; Direct is not', async () => {
      await at('2026-10-20T10:00:00+07:00');
      const zero = await internal('101', '2026-11-02', '2026-11-04');
      expect(await live(zero.id)).toEqual([
        { stay_date: '2026-11-02', night_state: 'sold', revenue: 0, is_complimentary: true },
        { stay_date: '2026-11-03', night_state: 'sold', revenue: 0, is_complimentary: true },
      ]);
      expect(await flagOf(zero.id)).toBe(true);
      const paid = await internal('102', '2026-11-02', '2026-11-03', 300_000);
      expect(await live(paid.id)).toEqual([
        { stay_date: '2026-11-02', night_state: 'sold', revenue: 300_000, is_complimentary: false },
      ]);
      expect(await flagOf(paid.id)).toBe(false);
      const d = await direct('103', '2026-11-02', '2026-11-03');
      expect((await live(d.id)).map((n) => n.is_complimentary)).toEqual([false]);
      expect(await flagOf(d.id)).toBe(false);
      await expectInvariant();
    });

    it('BUG-R4-043 step 3 (B13): extending an Internal 0 ₫ stay – typed 0 keeps it complimentary; typed 300.000 makes that night and the booking money', async () => {
      await at('2026-10-20T10:00:00+07:00');
      const b = await internal('201', '2026-11-05', '2026-11-06');
      await stay(b, '201', '2026-11-05');
      await at('2026-11-05T20:00:00+07:00');
      const zero = await act(b.id, 'extend', {
        nights: 1,
        nightlyRates: [{ date: '2026-11-06', amountVnd: 0, edited: true }],
      });
      expect(zero.statusCode, zero.body).toBe(200);
      expect((await live(b.id)).map((n) => [n.revenue, n.is_complimentary])).toEqual([
        [0, true],
        [0, true],
      ]);
      expect(await flagOf(b.id)).toBe(true);
      const paid = await act(b.id, 'extend', {
        nights: 1,
        nightlyRates: [{ date: '2026-11-07', amountVnd: 300_000, edited: true }],
      });
      expect(paid.statusCode, paid.body).toBe(200);
      expect((await live(b.id)).map((n) => [n.revenue, n.is_complimentary])).toEqual([
        [0, true],
        [0, true],
        [300_000, false],
      ]);
      expect(await flagOf(b.id)).toBe(false);
      await expectInvariant();
    });

    it('A31: an Internal night raised 0 → 300.000 (FD) is money (false, booking false); brought back to 0 by MGR it is complimentary again (true, booking true)', async () => {
      await at('2026-10-20T10:00:00+07:00');
      const b = await internal('202', '2026-11-08', '2026-11-09');
      await stay(b, '202', '2026-11-08');
      const up = await adjust('fd', b, (await roomLine(b, '2026-11-08')).id, 300_000);
      expect(up.statusCode, up.body).toBe(201);
      expect(await live(b.id)).toMatchObject([{ revenue: 300_000, is_complimentary: false }]);
      expect(await flagOf(b.id)).toBe(false);
      const down = await adjust('mgr', b, (await roomLine(b, '2026-11-08')).id, 0);
      expect(down.statusCode, down.body).toBe(201);
      expect(await live(b.id)).toMatchObject([{ revenue: 0, is_complimentary: true }]);
      expect(await flagOf(b.id)).toBe(true);
      await expectInvariant();
    });

    it('FOC / special discount: 100 % of the room line makes the night (and a one-night booking) complimentary; a partial one keeps a sold night with money', async () => {
      await at('2026-10-20T10:00:00+07:00');
      const full = await direct('203', '2026-11-10', '2026-11-11');
      const l1 = await roomLine(full, '2026-11-10');
      const all = await foc(full, l1.id, l1.amount);
      expect(all.statusCode, all.body).toBe(201);
      expect(all.json().status).toBe('approved');
      expect(await live(full.id)).toMatchObject([{ revenue: 0, is_complimentary: true }]);
      expect(await flagOf(full.id)).toBe(true);
      const part = await direct('301', '2026-11-10', '2026-11-11');
      const l2 = await roomLine(part, '2026-11-10');
      const half = await foc(part, l2.id, Math.floor(l2.amount / 2000) * 1000);
      expect(half.statusCode, half.body).toBe(201);
      expect(half.json().status).toBe('approved');
      const [n] = await live(part.id);
      expect(n!.revenue).toBeGreaterThan(0);
      expect(n!.is_complimentary).toBe(false);
      expect(await flagOf(part.id)).toBe(false);
      await expectInvariant();
    });

    it('closing a booking moves no money, so it keeps its flag: Internal 0 ₫ cancelled stays true, "Internal with a charge" cancelled stays false', async () => {
      await at('2026-10-20T10:00:00+07:00');
      const zero = await internal('302', '2026-11-12', '2026-11-13');
      const paid = await internal('401', '2026-11-12', '2026-11-13', 300_000);
      for (const b of [zero, paid]) {
        const r = await act(b.id, 'cancel', { reasonCode: 'found_other' });
        expect(r.statusCode, r.body).toBe(200);
        expect(await live(b.id)).toEqual([]);
      }
      expect(await flagOf(zero.id)).toBe(true);
      expect(await flagOf(paid.id)).toBe(false);
      expect((await nights(paid.id)).map((n) => [n.night_state, n.is_complimentary])).toEqual([
        ['void', false],
      ]);
      await expectInvariant();
    });

    it('0097 triggers: a write of the old rule (the v1.0.4 image after a rollback) is stored by the money – night UPDATE and INSERT, booking recomputed from its nights', async () => {
      await at('2026-10-20T10:00:00+07:00');
      const paid = await internal('402', '2026-11-14', '2026-11-15', 300_000);
      const zero = await internal('101', '2026-11-14', '2026-11-15');
      // v1.0.4 wrote the flag by channel: true on every Internal night.
      await q(`UPDATE stay_night SET is_complimentary = true WHERE reservation_id = $1`, [paid.id]);
      await q(`UPDATE stay_night SET is_complimentary = false WHERE reservation_id = $1`, [
        zero.id,
      ]);
      expect((await live(paid.id)).map((n) => n.is_complimentary)).toEqual([false]);
      expect((await live(zero.id)).map((n) => n.is_complimentary)).toEqual([true]);
      // An INSERT naming the old value (a void copy of the night – the unique key is on live nights only).
      const [src] = await q<{ id: string }>(
        `SELECT id FROM stay_night WHERE reservation_id = $1 AND night_state = 'sold'`,
        [paid.id],
      );
      const copy = uuidv7();
      await q(
        `INSERT INTO stay_night (id, organization_id, property_id, reservation_id, reservation_segment_id, room_id,
           stay_date, night_state, room_revenue_gross_vnd, discount_vnd, room_revenue_vnd, sold_at, voided_at,
           void_reason, prev_state, is_complimentary, rate_source, channel_id, stay_type, created_at, updated_at,
           calendar_rate_vnd, reference_rate_vnd)
         SELECT $2, organization_id, property_id, reservation_id, reservation_segment_id, room_id, stay_date, 'void',
                room_revenue_gross_vnd, discount_vnd, room_revenue_vnd, sold_at, updated_at, 'date_change', 'sold',
                true, rate_source, channel_id, stay_type, created_at, updated_at, calendar_rate_vnd, reference_rate_vnd
           FROM stay_night WHERE id = $1`,
        [src!.id, copy],
      );
      expect(
        (
          await q<{ f: boolean }>('SELECT is_complimentary AS f FROM stay_night WHERE id = $1', [
            copy,
          ])
        )[0]!.f,
      ).toBe(false);
      // The booking follows its nights: the money of the live night goes to 0 and back (a raw money write).
      await q(
        `UPDATE stay_night SET discount_vnd = room_revenue_gross_vnd, room_revenue_vnd = 0
          WHERE reservation_id = $1 AND night_state = 'sold'`,
        [paid.id],
      );
      expect(await flagOf(paid.id)).toBe(true);
      await q(
        `UPDATE stay_night SET discount_vnd = 0, room_revenue_vnd = room_revenue_gross_vnd
          WHERE reservation_id = $1 AND night_state = 'sold'`,
        [paid.id],
      );
      expect(await flagOf(paid.id)).toBe(false);
      // A write that moves no money (here: the commission columns) leaves the booking row alone.
      await q(`UPDATE reservation SET is_complimentary = true WHERE id = $1`, [paid.id]);
      await q(`UPDATE stay_night SET staff_commission_vnd = 0 WHERE reservation_id = $1`, [
        paid.id,
      ]);
      expect(await flagOf(paid.id)).toBe(true);
      await q(`UPDATE reservation SET is_complimentary = false WHERE id = $1`, [paid.id]);
      await expectInvariant();
    });

    it('M4d (scripts/v5-17-complimentary-check.sql): counts only; stops without a tenant under RLS; 0|0 and 0|0 when every flag follows the money', async () => {
      expect(await m4d()).toEqual({ nights: '0|0', bookings: '0|0' });
      const app = new PgClient({ connectionString: process.env.DATABASE_URL });
      await app.connect();
      try {
        await expect(app.query(CHECK)).rejects.toThrow(
          /"v5-17 check stopped: run as ottimo_readonly \(BYPASSRLS\)/,
        );
      } finally {
        await app.end();
      }
      // Nothing but counts is printed: m4d() pins the output columns of every SELECT of the file.
    });

    it('0097 back-fill as shipped: the flags v1.0.4 left are counted by M4d "before", recomputed once with counts only, 0|0 "after"; a second run writes nothing', async () => {
      await at('2026-10-20T10:00:00+07:00');
      const paid = await internal('102', '2026-11-23', '2026-11-24', 300_000);
      const zero = await internal('103', '2026-11-23', '2026-11-24');
      const fullFoc = await direct('201', '2026-11-23', '2026-11-24');
      const l = await roomLine(fullFoc, '2026-11-23');
      expect((await foc(fullFoc, l.id, l.amount)).json().status).toBe('approved');
      const cancelled = await internal('202', '2026-11-23', '2026-11-24', 300_000);
      expect((await act(cancelled.id, 'cancel', { reasonCode: 'found_other' })).statusCode).toBe(
        200,
      );
      await expectInvariant();

      // What v1.0.4 left: Internal with a charge = true (night and booking, also once cancelled); the booking of a
      // night FOC'd 100 % = false; plus one 0 ₫ night written false. Written with the 0097 triggers disabled INSIDE
      // one transaction (other sessions never see them disabled; lock_timeout keeps parallel test files moving).
      const wrong = async () => {
        await owner.query('BEGIN');
        try {
          await owner.query(`SET LOCAL lock_timeout = '5s'`);
          await owner.query(
            'ALTER TABLE stay_night DISABLE TRIGGER stay_night_complimentary_follows_revenue',
          );
          await owner.query(
            'ALTER TABLE stay_night DISABLE TRIGGER stay_night_reservation_complimentary',
          );
          await owner.query(
            'UPDATE stay_night SET is_complimentary = true WHERE reservation_id = ANY($1::uuid[])',
            [[paid.id, cancelled.id]],
          );
          await owner.query(
            'UPDATE stay_night SET is_complimentary = false WHERE reservation_id = $1',
            [zero.id],
          );
          await owner.query(
            'UPDATE reservation SET is_complimentary = true WHERE id = ANY($1::uuid[])',
            [[paid.id, cancelled.id]],
          );
          await owner.query('UPDATE reservation SET is_complimentary = false WHERE id = $1', [
            fullFoc.id,
          ]);
          await owner.query(
            'ALTER TABLE stay_night ENABLE TRIGGER stay_night_reservation_complimentary',
          );
          await owner.query(
            'ALTER TABLE stay_night ENABLE TRIGGER stay_night_complimentary_follows_revenue',
          );
          await owner.query('COMMIT');
        } catch (err) {
          await owner.query('ROLLBACK').catch(() => undefined);
          throw err;
        }
      };
      for (let attempt = 1; ; attempt += 1) {
        try {
          await wrong();
          break;
        } catch (err) {
          if ((err as { code?: string }).code !== '55P03' || attempt === 5) throw err;
        }
      }
      // The triggers are back, enabled ('O'), for every session.
      const { rows: trg } = await owner.query<{ tgname: string; tgenabled: string }>(
        `SELECT tgname, tgenabled FROM pg_trigger WHERE tgrelid = 'stay_night'::regclass
            AND tgname IN ('stay_night_complimentary_follows_revenue', 'stay_night_reservation_complimentary')
          ORDER BY tgname`,
      );
      expect(trg).toEqual([
        { tgname: 'stay_night_complimentary_follows_revenue', tgenabled: 'O' },
        { tgname: 'stay_night_reservation_complimentary', tgenabled: 'O' },
      ]);

      // M4d "before": the paid live night (true, > 0) | the 0 ₫ night (false); bookings: paid + cancelled (true, > 0)
      // | the FOC'd one (false, 0). The cancelled booking's night is void: not in the night line (SEC's query).
      expect(await m4d()).toEqual({ nights: '1|1', bookings: '2|1' });
      // The script's booking rule is the function's (reservation_is_complimentary of 0097).
      const { rows: fn } = await owner.query<{ a: number; b: number }>(
        `SELECT count(*) FILTER (WHERE is_complimentary AND NOT reservation_is_complimentary(id))::int AS a,
                count(*) FILTER (WHERE NOT is_complimentary AND reservation_is_complimentary(id))::int AS b
           FROM reservation`,
      );
      expect(fn).toEqual([{ a: 2, b: 1 }]);

      notices.length = 0;
      await owner.query(BACKFILL as string);
      // Counts only (no id, code, amount): nights = paid, the void night of the cancelled one (→ false), the 0 ₫
      // night (→ true); bookings = paid, cancelled (→ false), FOC'd (→ true).
      expect(notices).toEqual([
        '0097 is_complimentary recomputed: nights 3 (to true 1, to false 2), bookings 3 (to true 1, to false 2)',
      ]);
      expect(await m4d()).toEqual({ nights: '0|0', bookings: '0|0' });
      await expectInvariant();
      expect(await flagOf(paid.id)).toBe(false);
      expect(await flagOf(cancelled.id)).toBe(false);
      expect(await flagOf(fullFoc.id)).toBe(true);
      expect(await flagOf(zero.id)).toBe(true);

      // Idempotent: the second run writes nothing and changes nothing.
      const snapshot = () =>
        q<{ id: string; f: boolean }>(
          `SELECT id, is_complimentary AS f FROM stay_night UNION ALL
           SELECT id, is_complimentary FROM reservation ORDER BY 1`,
        );
      const before = await snapshot();
      notices.length = 0;
      await owner.query(BACKFILL as string);
      expect(notices).toEqual([
        '0097 is_complimentary recomputed: nights 0 (to true 0, to false 0), bookings 0 (to true 0, to false 0)',
      ]);
      expect(await snapshot()).toEqual(before);
      expect(await m4d()).toEqual({ nights: '0|0', bookings: '0|0' });
    });
  },
);
