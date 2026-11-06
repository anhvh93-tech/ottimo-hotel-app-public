/**
 * FB-R5-DOM-BE-101-01 (Major) where ARC placed it (FB-R5-ARC-BE-H1-03), with FB-R5-ARC-BE-H1-01 and H1-02 (r5-h1b), on
 * Nest/Fastify + PostgreSQL, for a property where OWN types the short-stay commission table only AFTER bookings with a
 * sale closer were confirmed (`rate_missing` – no row, no snapshot):
 * - T-14-1 (DOM rules-v1.0.5 14.2): nothing edited on the booking, check-in, check-out paid in full → B18 creates the
 *   row and earns it at the rate in force (`ensureCommission` before the "earned" check);
 * - ARC H1-03 (4): rate typed AFTER a B18 with a debt → the guest pays the debt (payments `tryEarn`) → row `earned`;
 *   same with the debt written off by MGR (folio `afterWriteOff`);
 * - T-14-2: a row created at `test_rate_short`, OWN then changes the table to `test_rate_short_2`, the stay is extended
 *   → the new row keeps `test_rate_short` (BR-903 (5), pinned on the first commission row), the base follows the
 *   nights; the reservation's price snapshot is not written;
 * - H1-02: OWN saving a wrong table → 422 PARAM_OUT_OF_RANGE, nothing saved;
 * - H1-01: FDL never sees the key (list, missing, history → 404); MGR and OWN do.
 * SEC G3: the only rates are the test values `test_rate_short` / `test_rate_short_2`. FAKE data only.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { randomBytes } from 'node:crypto';
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
import { FolioService } from '../../src/modules/folio/public/folio.service';
import { applyPct } from '../../src/modules/reservations/public/pricing';
import {
  RESERVATION_SALES_PORT,
  type ReservationSalesPort,
} from '../../src/modules/reservations/public/sales-port';
import { sha256Hex } from '../../src/shared/http/auth.guard';
import { addDays } from '../../src/shared/time';
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

/** Test-only rates (SEC G3) – odd values unrelated to any real table. */
const test_rate_short = 1.37;
const test_rate_short_2 = 2.41;
const KEY = 'short_stay_commission_pct';

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

const ROLES = {
  owner: ['owner'],
  mgr: ['manager'],
  fdl: ['front_desk_lead'],
  fd: ['front_desk'],
  sal: ['sales_staff'],
};

interface Booking {
  id: string;
  code: string;
  folioId: string;
  arrival: string;
  departure: string;
  roomNo: string;
}

describe.skipIf(!HAS_DB)(
  'FB-R5-DOM-BE-101-01 / ARC H1-01…03 – commission row at the latest at "earned", rate pinned, OWN/MGR-only table',
  () => {
    let db: Database;
    let fa: FeatureApp;
    let t: TestTenant;
    let ids: BookingIds;
    let guest: string;
    const c: Record<string, Client> = {};

    beforeAll(async () => {
      db = appDatabase(10);
      t = await createTenant(db, { users: ROLES });
      ids = await seedBooking(db, t, 0, { skipParams: [KEY] });
      guest = await seedGuestRow(db, t, { name: 'Khách Hoa Hồng' });
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
            new Date('2030-12-31T00:00:00Z'),
          ],
        ),
      );
      c.fd!.deviceToken = token;
      for (const u of ['mgr', 'owner']) await setPassword(db, t, u);
    });
    afterAll(async () => {
      await fa?.close();
      await db?.close();
    });

    const url = (path = '') => `${P(t)}${path}`;
    const q = (sql: string, args: unknown[] = []) =>
      db.withContext(t.ctx(), async (tx) => (await tx.query(sql, args)).rows as any[]);
    const at = async (iso: string) => {
      const d = new Date(iso);
      fa.clock.set(d);
      await touchSessions(db, t, d);
    };
    const get = async (id: string) => (await c.fd!.get(url(`/reservations/${id}`))).json();
    const act = async (id: string, verb: string, body: unknown, who = 'fd') =>
      c[who]!.send('POST', url(`/reservations/${id}/actions/${verb}`), body, {
        'if-match': `"${(await get(id)).version}"`,
      });
    const folio = async (folioId: string) => (await c.mgr!.get(url(`/folios/${folioId}`))).json();
    const due = async (b: Booking) => (await folio(b.folioId)).totals.balanceDueVnd as number;
    const pay = (folioId: string, amountVnd: number, who = 'fd') =>
      c[who]!.send('POST', url(`/folios/${folioId}/payments`), {
        type: 'charge',
        method: 'cash',
        amountVnd,
      });
    const putRate = (value: unknown, effectiveFrom: string, who = 'owner') =>
      c[who]!.send('PUT', url(`/parameters/${KEY}`), {
        value,
        effectiveFrom,
        reason: 'Bảng nội bộ thử nghiệm',
      });
    const commissions = (b: Booking) =>
      q(
        `SELECT status, payee_type, rate_pct_snapshot::text AS rate, base_amount_vnd::int AS base,
                amount_vnd::int AS amount
           FROM commission WHERE reservation_id = $1 ORDER BY created_at, id`,
        [b.id],
      );
    /** Σ net room revenue of the sold nights – the commission base (BR-903). */
    const roomBase = async (b: Booking) =>
      (
        await q(
          `SELECT COALESCE(sum(room_revenue_vnd), 0)::int AS s FROM stay_night
            WHERE reservation_id = $1 AND night_state = 'sold'`,
          [b.id],
        )
      )[0].s as number;
    const snapshotRate = async (b: Booking) =>
      (
        await q(
          `SELECT pricing_snapshot->'commissionRatePct' AS a, pricing_snapshot->'quote'->'commissionRatePct' AS b
             FROM reservation WHERE id = $1`,
          [b.id],
        )
      )[0];

    /** FD books a direct stay a sale closed (BR-903 staff commission) – no rate in force yet. */
    const book = async (roomNo: string, arrival: string, nights: number): Promise<Booking> => {
      const departure = addDays(arrival, nights);
      const body = {
        roomId: ids.rooms[roomNo],
        channelId: ids.channels.direct,
        directSource: 'sales_staff',
        closerUserId: t.users.sal!.id,
        adults: 2,
        bookerGuestId: guest,
        paymentModel: 'direct',
        arrivalDate: arrival,
        departureDate: departure,
      };
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
      const r = res.json();
      return { id: r.id, code: r.code, folioId: r.folioId, arrival, departure, roomNo };
    };
    /** Arrival day 15:00: the guest pays what is due, B9. */
    const checkIn = async (b: Booking) => {
      await at(`${b.arrival}T15:00:00+07:00`);
      await q(`UPDATE room_status SET status = 'VC' WHERE room_id = $1`, [ids.rooms[b.roomNo]]);
      const owed = await due(b);
      if (owed > 0) expect((await pay(b.folioId, owed)).statusCode).toBe(201);
      const ci = await act(b.id, 'check-in', {
        cardsIssued: 1,
        houseRulesSent: true,
        checkinTime: '15:00',
      });
      expect(ci.statusCode, ci.body).toBe(200);
    };
    /** Departure day: an unpaid F&B line (`unpaidVnd` > 0) → MGR checks out with a debt; else paid in full, B18. */
    const checkOut = async (b: Booking, unpaidVnd = 0) => {
      await at(`${b.departure}T10:00:00+07:00`);
      let lineId: string | null = null;
      if (unpaidVnd > 0) {
        const l = await c.fd!.send('POST', url(`/folios/${b.folioId}/lines`), {
          category: 'fnb',
          description: 'Ăn tối chưa trả',
          quantity: 1,
          unitPriceVnd: unpaidVnd,
          serviceDate: b.arrival,
        });
        expect(l.statusCode, l.body).toBe(201);
        lineId = (l.json().lines as any[]).find(
          (x) => x.category === 'fnb' && x.amountVnd === unpaidVnd,
        ).id;
      } else {
        const owed = await due(b);
        if (owed > 0) expect((await pay(b.folioId, owed)).statusCode).toBe(201);
      }
      await at(`${b.departure}T11:00:00+07:00`);
      const out =
        unpaidVnd > 0
          ? await act(
              b.id,
              'check-out',
              {
                checkoutTime: '11:00',
                debt: { dueDate: addDays(b.departure, 5), reason: 'Khách hẹn chuyển khoản' },
              },
              'mgr',
            )
          : await act(b.id, 'check-out', { checkoutTime: '11:00' });
      expect(out.statusCode, out.body).toBe(200);
      expect((await get(b.id)).status).toBe('checked_out');
      return lineId;
    };

    // C: debt paid by the guest; D: debt written off; A: T-14-1; B: T-14-2. All confirmed while the rate is missing.
    let A: Booking;
    let B: Booking;
    let C: Booking;
    let D: Booking;
    let lineC: string | null = null;
    let lineD: string | null = null;
    const UNPAID = 50_000;

    it('bookings with a sale closer confirmed while the table is missing → no commission row, no snapshot', async () => {
      await at('2026-10-20T10:00:00+07:00');
      C = await book('101', '2026-10-21', 2);
      D = await book('102', '2026-10-21', 2);
      A = await book('103', '2026-10-24', 2);
      B = await book('201', '2026-10-27', 2);
      for (const b of [A, B, C, D]) {
        expect(await commissions(b)).toEqual([]);
        expect(await snapshotRate(b)).toEqual({ a: null, b: null });
      }
    });

    it('ARC H1-03 (4) set-up: C and D check out with a debt while the rate is still missing → B18 creates no row (rate_missing)', async () => {
      await checkIn(C);
      await checkIn(D);
      lineC = await checkOut(C, UNPAID);
      lineD = await checkOut(D, UNPAID);
      expect(await commissions(C)).toEqual([]);
      expect(await commissions(D)).toEqual([]);
      expect(await due(C)).toBe(UNPAID);
    });

    it('H1-02: OWN saving a wrong table → 422 PARAM_OUT_OF_RANGE, nothing saved; the right one → 200', async () => {
      await at('2026-10-23T12:00:00+07:00');
      for (const [value, field, code] of [
        [
          { staff: String(test_rate_short), collaborator: test_rate_short },
          'value.staff',
          'VALIDATION_FAILED',
        ],
        [{ staff: test_rate_short }, 'value.collaborator', 'REQUIRED'],
        [
          { staff: test_rate_short, collaborator: test_rate_short + 0.001 },
          'value.collaborator',
          'VALIDATION_FAILED',
        ],
        [
          { staff: test_rate_short, collaborator: test_rate_short, ctv: 1 },
          'value.ctv',
          'NOT_ALLOWED',
        ],
      ] as const) {
        const r = await putRate(value, '2026-10-23');
        expect(r.statusCode, `${JSON.stringify(value)} ${r.body}`).toBe(422);
        expect(r.json()).toMatchObject({ code: 'PARAM_OUT_OF_RANGE', errors: [{ field, code }] });
      }
      expect(await q(`SELECT 1 FROM config_parameter WHERE key = $1`, [KEY])).toEqual([]);
      const ok = await putRate(
        { staff: test_rate_short, collaborator: test_rate_short },
        '2026-10-23',
      );
      expect(ok.statusCode, ok.body).toBe(200);
    });

    it('H1-01: FDL sees neither the value, the name in missing[] nor the history (404); MGR and OWN do', async () => {
      const keysOf = (r: { json(): any }) =>
        (r.json().data as Array<{ key: string }>).map((p) => p.key);
      const fdl = await c.fdl!.get(url('/parameters'));
      expect(fdl.statusCode, fdl.body).toBe(200);
      expect(keysOf(fdl)).not.toContain(KEY);
      expect(keysOf(fdl).length).toBeGreaterThan(0);
      expect(fdl.json()).not.toHaveProperty('missing');
      const fdlHistory = await c.fdl!.get(url(`/parameters/${KEY}`));
      expect(fdlHistory.statusCode, fdlHistory.body).toBe(404);
      expect(fdlHistory.json().code).toBe('NOT_FOUND');
      // Same answer as a key that does not exist (no existence probe).
      expect((await c.fdl!.get(url('/parameters/no_such_key'))).statusCode).toBe(404);
      // As of a date before the table: OWN/MGR read the name in missing[], FDL still nothing.
      const before = await c.fdl!.get(url('/parameters?asOf=2026-10-20'));
      expect(keysOf(before)).not.toContain(KEY);
      expect(before.json()).not.toHaveProperty('missing');
      for (const who of ['owner', 'mgr']) {
        const list = await c[who]!.get(url('/parameters'));
        const row = (list.json().data as Array<{ key: string; value: unknown }>).find(
          (p) => p.key === KEY,
        );
        expect(row?.value, who).toEqual({ staff: test_rate_short, collaborator: test_rate_short });
        const h = await c[who]!.get(url(`/parameters/${KEY}`));
        expect(h.statusCode, `${who} ${h.body}`).toBe(200);
        expect(h.json().history).toHaveLength(1);
        expect((await c[who]!.get(url('/parameters?asOf=2026-10-20'))).json().missing).toContain(
          KEY,
        );
      }
    });

    it('ARC H1-03 (4): rate typed after B18, the guest pays the debt → the row is created and earned at the rate in force', async () => {
      await at('2026-10-23T15:00:00+07:00');
      const r = await pay(C.folioId, UNPAID);
      expect(r.statusCode, r.body).toBe(201);
      const base = await roomBase(C);
      expect(await commissions(C)).toEqual([
        {
          status: 'earned',
          payee_type: 'staff',
          rate: String(test_rate_short),
          base,
          amount: applyPct(base, test_rate_short, 1),
        },
      ]);
    });

    it('ARC H1-03 (1): rate typed after B18, MGR writes the debt off → the row is created and earned (folio afterWriteOff)', async () => {
      await at('2026-10-23T15:30:00+07:00');
      const w = await c.mgr!.send('POST', url(`/folios/${D.folioId}/lines/${lineD}/foc`), {
        kind: 'foc',
        amountVnd: UNPAID,
        reasonCode: 'debt_write_off',
        note: 'Khách không liên lạc được',
        authMethod: 'password',
        secret: TEST_PASSWORD,
      });
      expect(w.statusCode, w.body).toBe(201);
      expect(w.json().status).toBe('approved');
      expect(await due(D)).toBe(0);
      const base = await roomBase(D);
      expect(await commissions(D)).toEqual([
        {
          status: 'earned',
          payee_type: 'staff',
          rate: String(test_rate_short),
          base,
          amount: applyPct(base, test_rate_short, 1),
        },
      ]);
      expect(lineC).not.toBeNull();
    });

    it('T-14-1: nothing edited on the booking; check-in, check-out paid in full → one row earned at test_rate_short', async () => {
      await checkIn(A);
      expect(await commissions(A)).toEqual([]); // B9 does not resync – the row comes at the "earned" step
      await checkOut(A);
      const base = await roomBase(A);
      expect(await commissions(A)).toEqual([
        {
          status: 'earned',
          payee_type: 'staff',
          rate: String(test_rate_short),
          base,
          amount: applyPct(base, test_rate_short, 1),
        },
      ]);
      // Pinned on the folio side: the reservation's price snapshot is not written (ARC H1-03 (2)).
      expect(await snapshotRate(A)).toEqual({ a: null, b: null });
    });

    it('T-14-2: row at test_rate_short; OWN changes the table to test_rate_short_2; extension → the new row keeps test_rate_short, base on the new nights', async () => {
      // A people change before arrival resyncs the booking → its first row, at the rate in force (test_rate_short).
      await at('2026-10-23T16:00:00+07:00');
      const patch = await c.fd!.send(
        'PATCH',
        url(`/reservations/${B.id}`),
        { adults: 1 },
        { 'if-match': `"${(await get(B.id)).version}"` },
      );
      expect(patch.statusCode, patch.body).toBe(200);
      const first = await commissions(B);
      expect(first).toEqual([
        expect.objectContaining({ status: 'projected', rate: String(test_rate_short) }),
      ]);
      const ok = await putRate(
        { staff: test_rate_short_2, collaborator: test_rate_short_2 },
        '2026-10-27',
      );
      expect(ok.statusCode, ok.body).toBe(200);
      await checkIn(B);
      // The table did change: a new quote for a sale closer reads test_rate_short_2 today.
      const quote = await c.sal!.send('POST', url('/quotes/calculate'), {
        type: 'short',
        roomId: ids.rooms['202'],
        arrivalDate: '2026-11-10',
        nights: 2,
        adults: 2,
        channelId: ids.channels.direct,
      });
      expect(quote.statusCode, quote.body).toBe(200);
      expect(quote.json().commission).toMatchObject({
        status: 'computed',
        ratePct: test_rate_short_2,
      });
      const ext = await act(B.id, 'extend', { nights: 1 });
      expect(ext.statusCode, ext.body).toBe(200);
      const base = await roomBase(B);
      expect(base).toBeGreaterThan(first[0].base);
      expect(await commissions(B)).toEqual([
        { ...first[0], status: 'void' },
        {
          status: 'projected',
          payee_type: 'staff',
          rate: String(test_rate_short),
          base,
          amount: applyPct(base, test_rate_short, 1),
        },
      ]);
      B = { ...B, departure: addDays(B.departure, 1) };
      await checkOut(B);
      expect((await commissions(B)).map((x) => [x.status, x.rate])).toEqual([
        ['void', String(test_rate_short)],
        ['earned', String(test_rate_short)],
      ]);
      expect(await snapshotRate(B)).toEqual({ a: null, b: null });
    });

    it('ensureCommission never adds a second row: the "earned" step run again on an earned stay changes nothing', async () => {
      const before = await commissions(A);
      await at(`${A.departure}T16:00:00+07:00`);
      // The "earned" step again on a stay that owes nothing (no HTTP path pays a 0 due): the folio unit with the
      // sold nights from the sales port, as payments / B18 call it.
      const folios = fa.app.get(FolioService);
      const port = fa.app.get<symbol, ReservationSalesPort>(RESERVATION_SALES_PORT);
      await db.withContext(t.ctx(), async (tx) => {
        const stay = await port.confirmedStayOf(tx, A.id);
        expect(stay?.closerUserId).toBe(t.users.sal!.id);
        expect(await folios.ensureCommission(tx, stay!, { userId: null })).toBe(0);
        await folios.tryEarnCommissions(tx, {
          reservationId: A.id,
          reservationCode: A.code,
          status: 'checked_out',
          stay,
        });
      });
      expect(await commissions(A)).toEqual(before);
    });
  },
);
