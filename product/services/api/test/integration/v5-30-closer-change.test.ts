/**
 * Contract 0.3.13 bổ sung 1h – DOM FB-R5-DOM-BE-131-01 (Major), ARC FB-R5-ARC-BE-131-02 (Major) and ARC FB-R5-ARC-BE-131-03,
 * on Nest/Fastify + PostgreSQL. Changing the closer (`closerUserId`) moves the commission in the same transaction:
 * - (a) MGR before arrival → the earlier closer's row `void` (`closer_changed`), the new closer's row at the pinned rate,
 *   on the Commission screen at once; B18 earns the NEW closer's row (DOM 131-01 3 (a), ARC 4.2 first extra case);
 *   FD / FDL before arrival → 403 + ONE access.denied each (`CLOSER_CHANGE_BEFORE_CHECKIN`, SEC FB-R5-SEC-ARC-1H-03);
 * - (b) after check-in only OWN, with `closerChangeReason`: MGR / FDL / FD → 403 FORBIDDEN_ACTION + ONE access.denied
 *   (also with a reason: 403 before 422), nothing changed; OWN without / with a short reason → 422; OWN with a reason →
 *   old row `void` (`closer_corrected`), new row; the reason (cleaned) in the audit `reason` COLUMN of
 *   `reservation.closer_changed`, `after` = `{ closerUserId }` only – no `reason` key in the `reservation` allowlist
 *   (SEC FB-R5-SEC-ARC-1H-01);
 * - T-30-3: a closer added after check-in → none by MGR (403); OWN's correction with a reason → commission;
 * - `rate_missing` booking, MGR's change after check-in refused → B18 creates the row for the ORIGINAL closer only;
 * - checked out: OWN's correction of an `earned` row → old `void`, new `earned` (B18 rule); anything else than the
 *   closer on a checked-out booking → 409; a row already `payable` → 409 INVALID_TRANSITION, nothing written;
 * - safety net (ARC 131-02 (3)): a closer changed BEFORE this fix (row of the earlier closer still `projected`) → the
 *   "earned" step voids it and earns the current closer's row;
 * - ARC 131-03: the debt on a ROOM line written off while `ensureCommission` creates the row at that step → base = room
 *   revenue − the write-off, `earned`;
 * - DOM FB-R5-DOM-ARC-1H-04: money the OLD closer recorded and nobody confirmed yet (cash not handed over, a transfer
 *   not reconciled) keeps the NEW closer's row `projected` – at B18 after an in-house correction and at OWN's correction
 *   after check-out – until the desk confirms the cash / MGR reconciles the transfer;
 * - r5-h1d (ARC FB-R5-ARC-BE-154-01, SEC FB-R5-SEC-BE-154-02, DOM FB-R5-DOM-BE-154-02): `recognized_at` of the new
 *   closer's `earned` row = the exact time of OWN's edit; below OWN on a `payable` commission → 403 (no `currentState`),
 *   never the 409; a combined edit (closer + head count) voids the earlier closer's row with `closer_changed` /
 *   `closer_corrected`, not `resync`; 1H-04 counts the payees of THIS booking only.
 * SEC G3: the only rate is the test value `test_rate_short`. FAKE data only.
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
import { PaymentService } from '../../src/modules/payments/public/payment.service';
import {
  FD_CHILD_DATA_PORT,
  type CheckinDocumentStatus,
  type FrontdeskChildDataPort,
  type FrontdeskRegistrationPort,
} from '../../src/modules/frontdesk/public/ports';
import { auditFieldsOf } from '../../src/modules/audit/public/audit-fields';
import { applyPct } from '../../src/modules/reservations/public/pricing';
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

/** Test-only rate (SEC G3) – an odd value unrelated to any real table. */
const test_rate_short = 1.37;
const RATE_PARAM = 'short_stay_commission_pct';
const DENIAL = 'CLOSER_CHANGE_AFTER_CHECKIN';
const DENIAL_BEFORE = 'CLOSER_CHANGE_BEFORE_CHECKIN';

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
  sal2: ['sales_staff'],
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
  'contract 0.3.13 1h (DOM 131-01, ARC 131-02, 131-03) – the commission follows the closer; after check-in only OWN',
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
      ids = await seedBooking(db, t, 0, { skipParams: [RATE_PARAM] });
      guest = await seedGuestRow(db, t, { name: 'Khách Người Chốt' });
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
    const patch = async (b: Booking, body: Record<string, unknown>, who: string) =>
      c[who]!.send('PATCH', url(`/reservations/${b.id}`), body, {
        'if-match': `"${(await get(b.id)).version}"`,
      });
    const folio = async (folioId: string) => (await c.mgr!.get(url(`/folios/${folioId}`))).json();
    const due = async (b: Booking) => (await folio(b.folioId)).totals.balanceDueVnd as number;
    const pay = (folioId: string, amountVnd: number, who = 'fd') =>
      c[who]!.send('POST', url(`/folios/${folioId}/payments`), {
        type: 'charge',
        method: 'cash',
        amountVnd,
      });
    const commissions = (b: Booking) =>
      q(
        `SELECT c.status, u.display_name AS payee, c.rate_pct_snapshot::text AS rate,
                c.base_amount_vnd::int AS base, c.amount_vnd::int AS amount, c.void_reason
           FROM commission c JOIN app_user u ON u.id = c.payee_user_id
          WHERE c.reservation_id = $1 ORDER BY c.created_at, c.id`,
        [b.id],
      );
    const closerOf = async (b: Booking) =>
      (await q(`SELECT closer_user_id FROM reservation WHERE id = $1`, [b.id]))[0].closer_user_id;
    /** Σ room revenue of the sold nights, net of what is applied on them (BR-903 base) – or `gross`. */
    const roomBase = async (b: Booking, column = 'room_revenue_vnd') =>
      (
        await q(
          `SELECT COALESCE(sum(${column}), 0)::int AS s FROM stay_night
            WHERE reservation_id = $1 AND night_state = 'sold'`,
          [b.id],
        )
      )[0].s as number;
    const denials = async (reason = DENIAL) =>
      (
        await q(
          `SELECT count(*)::int AS n FROM audit_event
            WHERE action = 'access.denied' AND entity_id = 'updateReservation' AND reason = $1`,
          [reason],
        )
      )[0].n as number;
    const closerAudits = (b: Booking) =>
      q(
        `SELECT before, after, reason FROM audit_event
          WHERE action = 'reservation.closer_changed' AND entity_id = $1::text ORDER BY occurred_at, id`,
        [b.id],
      );
    const voidAudits = (b: Booking) =>
      q(
        `SELECT before, after FROM audit_event
          WHERE action = 'commission.voided' AND entity_code = $1 ORDER BY occurred_at, id`,
        [b.code],
      );
    const putRate = (effectiveFrom: string) =>
      c.owner!.send('PUT', url(`/parameters/${RATE_PARAM}`), {
        value: { staff: test_rate_short, collaborator: test_rate_short },
        effectiveFrom,
        reason: 'Bảng nội bộ thử nghiệm',
      });
    const row = (
      payee: string,
      status: string,
      base: number,
      voidReason: string | null = null,
    ) => ({
      status,
      payee,
      rate: String(test_rate_short),
      base,
      amount: applyPct(base, test_rate_short, 1),
      void_reason: voidReason,
    });

    /** FD books a direct stay; `closer` = the sale who closed it (BR-903 staff commission), none = Zalo/phone. */
    const book = async (
      roomNo: string,
      arrival: string,
      nights: number,
      closer: 'sal' | null = 'sal',
    ): Promise<Booking> => {
      const departure = addDays(arrival, nights);
      const body = {
        roomId: ids.rooms[roomNo],
        channelId: ids.channels.direct,
        ...(closer
          ? { directSource: 'sales_staff', closerUserId: t.users[closer]!.id }
          : { directSource: 'zalo_phone' }),
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
    /** Departure day: paid in full, B18 at 11:00 – or `withDebt`: MGR checks out with what is still owed. */
    const checkOut = async (b: Booking, withDebt = false) => {
      await at(`${b.departure}T10:00:00+07:00`);
      if (!withDebt) {
        const owed = await due(b);
        if (owed > 0) expect((await pay(b.folioId, owed)).statusCode).toBe(201);
      }
      await at(`${b.departure}T11:00:00+07:00`);
      const out = withDebt
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
    };
    const expect403 = async (b: Booking, body: Record<string, unknown>, who: string) => {
      const r = await patch(b, body, who);
      expect(r.statusCode, `${who} ${r.body}`).toBe(403);
      expect(r.json().code).toBe('FORBIDDEN_ACTION');
      expect(r.json()).not.toHaveProperty('requiredFlow');
    };
    const reasonError = async (b: Booking, body: Record<string, unknown>) => {
      const r = await patch(b, body, 'owner');
      expect(r.statusCode, r.body).toBe(422);
      return r.json();
    };

    // W: ARC 131-03 (room-line write-off); R: rate_missing + MGR refused in house; A: (a); N: T-30-3; O: (b);
    // X: correction of an earned row; Y: payable → 409; S: safety net; E: early departure, then OWN's correction.
    let W: Booking;
    let R: Booking;
    let A: Booking;
    let N: Booking;
    let O: Booking;
    let X: Booking;
    let Y: Booking;
    let S: Booking;
    let E: Booking;
    const sal = () => t.users.sal!.id;
    const sal2 = () => t.users.sal2!.id;

    it('set-up: W and R confirmed with a sale closer while the table is missing → no commission row', async () => {
      await at('2026-10-14T10:00:00+07:00');
      W = await book('101', '2026-10-14', 2);
      R = await book('102', '2026-10-14', 4);
      expect(await commissions(W)).toEqual([]);
      expect(await commissions(R)).toEqual([]);
      await checkIn(W);
      await checkIn(R);
    });

    it('rate_missing booking in house: MGR changing the closer → 403 + one access.denied, closer unchanged', async () => {
      await at('2026-10-15T10:00:00+07:00');
      const before = await denials();
      await expect403(R, { closerUserId: sal2() }, 'mgr');
      expect(await denials()).toBe(before + 1);
      expect(await closerOf(R)).toBe(sal());
      expect(await closerAudits(R)).toEqual([]);
      // W stays one more night while the table is still missing – no row on the resync.
      const ext = await act(W.id, 'extend', { nights: 1 });
      expect(ext.statusCode, ext.body).toBe(200);
      W = { ...W, departure: addDays(W.departure, 1) };
      expect(await commissions(W)).toEqual([]);
    });

    it('ARC 131-03: W leaves owing its added room night; OWN types the table; MGR writes that room line off → row created at the write-off, base = room revenue − write-off, earned', async () => {
      await checkOut(W, true);
      const owed = await due(W);
      expect(owed).toBeGreaterThan(0);
      expect(await commissions(W)).toEqual([]);
      await at('2026-10-17T12:00:00+07:00');
      const rate = await putRate('2026-10-17');
      expect(rate.statusCode, rate.body).toBe(200);
      const lines = (await folio(W.folioId)).lines as any[];
      const roomLine = lines.find(
        (l) => l.category === 'room' && l.serviceDate === '2026-10-16' && l.lineState === 'posted',
      );
      expect(roomLine?.amountVnd).toBe(owed);
      await at('2026-10-17T12:30:00+07:00');
      const w = await c.mgr!.send('POST', url(`/folios/${W.folioId}/lines/${roomLine.id}/foc`), {
        kind: 'foc',
        amountVnd: owed,
        reasonCode: 'debt_write_off',
        note: 'Khách không liên lạc được',
        authMethod: 'password',
        secret: TEST_PASSWORD,
      });
      expect(w.statusCode, w.body).toBe(201);
      expect(w.json().status).toBe('approved');
      expect(await due(W)).toBe(0);
      const gross = await roomBase(W, 'room_revenue_gross_vnd');
      expect(await roomBase(W)).toBe(gross - owed);
      expect(await commissions(W)).toEqual([row('sal', 'earned', gross - owed)]);
    });

    it('R checks out paid → B18 creates the row of the ORIGINAL closer only (the refused change left no trace)', async () => {
      await checkOut(R);
      expect(await commissions(R)).toEqual([row('sal', 'earned', await roomBase(R))]);
    });

    it('set-up: A, S (arrive 25/10), N (no closer), O, X, Y (arrive 19/10) confirmed at test_rate_short', async () => {
      await at('2026-10-18T12:00:00+07:00');
      A = await book('103', '2026-10-25', 2);
      S = await book('203', '2026-10-25', 2);
      E = await book('401', '2026-10-19', 4);
      N = await book('201', '2026-10-19', 2, null);
      O = await book('202', '2026-10-19', 2);
      X = await book('301', '2026-10-19', 2);
      Y = await book('302', '2026-10-19', 2);
      for (const b of [A, S, O, X, Y, E]) {
        expect(await commissions(b)).toEqual([row('sal', 'projected', await roomBase(b))]);
      }
      expect(await commissions(N)).toEqual([]);
    });

    it('(a) before arrival: FD/FDL → 403 + ONE access.denied each (CLOSER_CHANGE_BEFORE_CHECKIN, a reason does not help); MGR → sal void (closer_changed), sal2 projected at the same rate, on the Commission screen at once', async () => {
      await at('2026-10-18T13:00:00+07:00');
      const before = await denials();
      const beforeArrival = await denials(DENIAL_BEFORE);
      await expect403(A, { closerUserId: sal2() }, 'fd');
      await expect403(A, { closerUserId: sal2(), closerChangeReason: 'x' }, 'fdl');
      expect(await denials()).toBe(before);
      expect(await denials(DENIAL_BEFORE)).toBe(beforeArrival + 2);
      const [last] = await q(
        `SELECT after FROM audit_event WHERE action = 'access.denied' AND reason = $1
          ORDER BY occurred_at DESC, id DESC LIMIT 1`,
        [DENIAL_BEFORE],
      );
      // Never the reason the caller typed.
      expect(last.after).toEqual({ operationId: 'updateReservation', roles: ['front_desk_lead'] });
      expect(await closerOf(A)).toBe(sal());
      const base = await roomBase(A);
      const r = await patch(
        A,
        { closerUserId: sal2(), closerChangeReason: '  Ghi nhầm người chốt lúc tạo đơn  ' },
        'mgr',
      );
      expect(r.statusCode, r.body).toBe(200);
      expect(r.json().closerUserId).toBe(sal2());
      expect(r.json()).not.toHaveProperty('closerChangeReason');
      expect(await commissions(A)).toEqual([
        row('sal', 'void', base, 'closer_changed'),
        row('sal2', 'projected', base),
      ]);
      expect(await closerAudits(A)).toEqual([
        {
          before: { closerUserId: sal() },
          after: { closerUserId: sal2() },
          reason: 'Ghi nhầm người chốt lúc tạo đơn',
        },
      ]);
      expect(await voidAudits(A)).toEqual([
        {
          before: { status: 'projected', amountVnd: applyPct(base, test_rate_short, 1) },
          after: { status: 'void', voidReason: 'closer_changed' },
        },
      ]);
      // The Commission screen (listCommissions, own scope): sal2 sees the booking's row now, sal only the void one.
      const codeRows = async (who: string) =>
        ((await c[who]!.get(url('/commissions'))).json().data as any[])
          .filter((x) => x.reservationCode === A.code)
          .map((x) => x.status);
      expect(await codeRows('sal2')).toEqual(['projected']);
      expect(await codeRows('sal')).toEqual(['void']);
    });

    it('SEC 1H-01: the reservation allowlist keeps closerUserId (an id) and has no free-text reason key', () => {
      expect(auditFieldsOf('reservation')?.has('closerUserId')).toBe(true);
      expect(auditFieldsOf('reservation')?.has('reason')).toBe(false);
    });

    it('closerChangeReason without a closer change → 422 NOT_ALLOWED, nothing written', async () => {
      for (const body of [
        { closerUserId: sal2(), closerChangeReason: 'Không đổi gì' },
        { closerChangeReason: 'Không đổi gì' },
      ]) {
        const r = await patch(A, body, 'mgr');
        expect(r.statusCode, r.body).toBe(422);
        expect(r.json()).toMatchObject({
          code: 'VALIDATION_FAILED',
          errors: [{ field: 'closerChangeReason', code: 'NOT_ALLOWED' }],
        });
      }
      expect(await closerAudits(A)).toHaveLength(1);
      expect(await commissions(A)).toHaveLength(2);
    });

    it('(b) in house: MGR, FDL, FD → 403 + ONE access.denied each (a reason does not help: 403 before 422), nothing changed', async () => {
      await checkIn(N);
      await checkIn(O);
      await checkIn(X);
      await checkIn(Y);
      await checkIn(E);
      await at('2026-10-19T16:00:00+07:00');
      const rows = await commissions(O);
      const before = await denials();
      await expect403(O, { closerUserId: sal2() }, 'mgr');
      await expect403(O, { closerUserId: sal2(), closerChangeReason: 'x' }, 'mgr');
      await expect403(O, { closerUserId: sal2(), closerChangeReason: 'Quản lý sửa lại' }, 'mgr');
      await expect403(O, { closerUserId: sal2() }, 'fdl');
      await expect403(O, { closerUserId: sal2() }, 'fd');
      expect(await denials()).toBe(before + 5);
      const [last] = await q(
        `SELECT after FROM audit_event WHERE action = 'access.denied' AND reason = $1
          ORDER BY occurred_at DESC, id DESC LIMIT 1`,
        [DENIAL],
      );
      expect(last.after).toEqual({ operationId: 'updateReservation', roles: ['front_desk'] });
      expect(await closerOf(O)).toBe(sal());
      expect(await commissions(O)).toEqual(rows);
      expect(await closerAudits(O)).toEqual([]);
    });

    it('(b) OWN after check-in: no reason / too short → 422 REASON_REQUIRED; a card number → 422 CARD_NUMBER_DETECTED; with a reason → sal void (closer_corrected), sal2 projected', async () => {
      expect(await reasonError(O, { closerUserId: sal2() })).toMatchObject({
        code: 'VALIDATION_FAILED',
        errors: [{ field: 'closerChangeReason', code: 'REASON_REQUIRED' }],
      });
      expect(
        await reasonError(O, { closerUserId: sal2(), closerChangeReason: ' a\u0000b ' }),
      ).toMatchObject({
        code: 'VALIDATION_FAILED',
        errors: [{ field: 'closerChangeReason', code: 'REASON_REQUIRED' }],
      });
      expect(
        await reasonError(O, {
          closerUserId: sal2(),
          closerChangeReason: 'Thẻ 4111 1111 1111 1111',
        }),
      ).toMatchObject({ code: 'CARD_NUMBER_DETECTED' });
      expect(await closerOf(O)).toBe(sal());
      const base = await roomBase(O);
      const r = await patch(
        O,
        { closerUserId: sal2(), closerChangeReason: 'Sale 2 chốt đơn, ghi nhầm lúc tạo' },
        'owner',
      );
      expect(r.statusCode, r.body).toBe(200);
      expect(await commissions(O)).toEqual([
        row('sal', 'void', base, 'closer_corrected'),
        row('sal2', 'projected', base),
      ]);
      expect(await closerAudits(O)).toEqual([
        {
          before: { closerUserId: sal() },
          after: { closerUserId: sal2() },
          reason: 'Sale 2 chốt đơn, ghi nhầm lúc tạo',
        },
      ]);
    });

    it('T-30-3: a closer added after check-in – MGR → 403, no commission; OWN with a reason → the commission comes', async () => {
      await at('2026-10-19T16:30:00+07:00');
      await expect403(N, { closerUserId: sal() }, 'mgr');
      expect(await closerOf(N)).toBeNull();
      expect(await commissions(N)).toEqual([]);
      const r = await patch(
        N,
        { closerUserId: sal(), closerChangeReason: 'Sale chốt qua Zalo, chưa ghi' },
        'owner',
      );
      expect(r.statusCode, r.body).toBe(200);
      expect(await commissions(N)).toEqual([row('sal', 'projected', await roomBase(N))]);
      expect(await closerAudits(N)).toEqual([
        {
          before: { closerUserId: null },
          after: { closerUserId: sal() },
          reason: 'Sale chốt qua Zalo, chưa ghi',
        },
      ]);
    });

    it('ARC #114 12.3 (mutation D1): B16 posts the early-departure fee; OWN then corrects the closer → the recomputed base is the nights kept, never the fee', async () => {
      await at('2026-10-20T10:00:00+07:00');
      const b16 = await act(E.id, 'early-departure', {
        newDepartureDate: '2026-10-21',
        noticeGivenAt: '2026-10-20T10:00:00+07:00',
      });
      expect(b16.statusCode, b16.body).toBe(200);
      const fees = await q(
        `SELECT amount_vnd::int AS amount FROM folio_line
          WHERE folio_id = $1 AND category = 'early_departure_fee' AND reversal_of_id IS NULL`,
        [E.folioId],
      );
      // The case only means something while the fee line exists and is not 0 (BR-428, DS-E refund table).
      expect(fees).toHaveLength(1);
      expect(fees[0].amount).toBeGreaterThan(0);
      const kept = await roomBase(E);
      expect(
        (
          await q(
            `SELECT count(*)::int AS n FROM stay_night WHERE reservation_id = $1 AND night_state = 'sold'`,
            [E.id],
          )
        )[0].n,
      ).toBe(2);
      expect((await commissions(E)).filter((x) => x.status !== 'void')).toEqual([
        row('sal', 'projected', kept),
      ]);
      // A recompute AFTER the fee line is written (B16 resyncs before it): the correction rebuilds the row.
      await at('2026-10-20T11:00:00+07:00');
      const r = await patch(
        E,
        { closerUserId: sal2(), closerChangeReason: 'Sale 2 chốt đơn, chủ đầu tư sửa' },
        'owner',
      );
      expect(r.statusCode, r.body).toBe(200);
      const live = (await commissions(E)).filter((x) => x.status !== 'void');
      expect(live).toEqual([row('sal2', 'projected', kept)]);
      expect(live[0].base).not.toBe(kept + fees[0].amount);
    });

    it('B18: N, O, X, Y paid → each booking earns the row of its CURRENT closer', async () => {
      for (const b of [N, O, X, Y]) await checkOut(b);
      expect((await commissions(N)).map((x) => [x.payee, x.status])).toEqual([['sal', 'earned']]);
      expect((await commissions(O)).map((x) => [x.payee, x.status])).toEqual([
        ['sal', 'void'],
        ['sal2', 'earned'],
      ]);
      for (const b of [X, Y]) {
        expect((await commissions(b)).map((x) => [x.payee, x.status])).toEqual([['sal', 'earned']]);
      }
    });

    it('checked out: MGR → 403 + access.denied; a field other than the closer → 409, nothing written (BE 1H-01, SEC 2.2: OWN with closerUserId + adults); OWN with a reason → sal void (closer_corrected), sal2 earned', async () => {
      await at('2026-10-21T12:00:00+07:00');
      const before = await denials();
      await expect403(X, { closerUserId: sal2(), closerChangeReason: 'Quản lý sửa lại' }, 'mgr');
      expect(await denials()).toBe(before + 1);
      const rows = await commissions(X);
      const version = (await get(X.id)).version;
      const lines = (await folio(X.folioId)).lines.length;
      for (const body of [
        { etaTime: '14:00' },
        { adults: 3 },
        { closerUserId: sal2(), closerChangeReason: 'Sửa người chốt', adults: 3 },
        { closerUserId: sal2(), closerChangeReason: 'Sửa người chốt', internalNote: 'ghi chú' },
        { closerUserId: sal(), closerChangeReason: 'Không đổi gì' },
      ]) {
        const r = await patch(X, body, 'owner');
        expect(r.statusCode, `${JSON.stringify(body)} ${r.body}`).toBe(409);
        expect(r.json()).toMatchObject({ code: 'INVALID_TRANSITION', currentState: 'checked_out' });
      }
      expect(await closerOf(X)).toBe(sal());
      expect((await get(X.id)).adults).toBe(2);
      expect((await get(X.id)).version).toBe(version);
      expect(await commissions(X)).toEqual(rows);
      expect((await folio(X.folioId)).lines.length).toBe(lines);
      expect(await closerAudits(X)).toEqual([]);
      expect(await reasonError(X, { closerUserId: sal2() })).toMatchObject({
        errors: [{ field: 'closerChangeReason', code: 'REASON_REQUIRED' }],
      });
      const base = await roomBase(X);
      const r = await patch(
        X,
        { closerUserId: sal2(), closerChangeReason: 'Sale 2 chốt đơn, chủ đầu tư sửa' },
        'owner',
      );
      expect(r.statusCode, r.body).toBe(200);
      expect(await commissions(X)).toEqual([
        row('sal', 'void', base, 'closer_corrected'),
        row('sal2', 'earned', base),
      ]);
      expect(await voidAudits(X)).toEqual([
        {
          before: { status: 'earned', amountVnd: applyPct(base, test_rate_short, 1) },
          after: { status: 'void', voidReason: 'closer_corrected' },
        },
      ]);
      const recognized = await q(
        `SELECT status, recognized_at FROM commission WHERE reservation_id = $1 ORDER BY created_at, id`,
        [X.id],
      );
      expect(recognized.map((x) => x.status)).toEqual(['void', 'earned']);
      // DOM 154-01 (ARC chose): the voided row keeps the date it was earned on – the B18 of 21/10 11:00.
      expect(new Date(recognized[0].recognized_at).toISOString()).toBe(
        new Date('2026-10-21T11:00:00+07:00').toISOString(),
      );
      // DOM 154-02 (ARC R1): the new closer earns at the time OWN made the correction, not at the B18 of 21/10 11:00.
      expect(new Date(recognized[1].recognized_at).toISOString()).toBe(
        new Date('2026-10-21T12:00:00+07:00').toISOString(),
      );
    });

    it('a commission already payable → 409 INVALID_TRANSITION (currentState payable), nothing written', async () => {
      await at('2026-10-21T12:30:00+07:00');
      await q(`UPDATE commission SET status = 'payable' WHERE reservation_id = $1`, [Y.id]);
      const rows = await commissions(Y);
      const version = (await get(Y.id)).version;
      // ARC 154-01 (c) / SEC 154-02 (1i: 403 → 422 → 409): below OWN the permission answers first – a refused role
      // never learns that someone else's commission is in a pay-out (no currentState), and each try is logged once.
      const before = await denials();
      for (const who of ['mgr', 'fdl', 'fd']) {
        const denied = await patch(
          Y,
          { closerUserId: sal2(), closerChangeReason: 'Sale 2 chốt đơn, sửa lại' },
          who,
        );
        expect(denied.statusCode, `${who} ${denied.body}`).toBe(403);
        expect(denied.json().code).toBe('FORBIDDEN_ACTION');
        expect(denied.json()).not.toHaveProperty('currentState');
      }
      expect(await denials()).toBe(before + 3);
      expect(await closerOf(Y)).toBe(sal());
      expect(await commissions(Y)).toEqual(rows);
      const r = await patch(
        Y,
        { closerUserId: sal2(), closerChangeReason: 'Sale 2 chốt đơn, chủ đầu tư sửa' },
        'owner',
      );
      expect(r.statusCode, r.body).toBe(409);
      expect(r.json()).toMatchObject({ code: 'INVALID_TRANSITION', currentState: 'payable' });
      expect(await closerOf(Y)).toBe(sal());
      expect(await commissions(Y)).toEqual(rows);
      expect(await closerAudits(Y)).toEqual([]);
      expect((await get(Y.id)).version).toBe(version);
    });

    it('safety net (ARC 131-02 (3)): closer changed before this fix (sal still projected) and A changed by MGR → B18 earns the current closer, sal void', async () => {
      // As a PATCH before r5-h1c did: the closer column only, the commission row left to the earlier closer.
      await q(`UPDATE reservation SET closer_user_id = $2 WHERE id = $1`, [S.id, sal2()]);
      expect((await commissions(S)).map((x) => [x.payee, x.status])).toEqual([
        ['sal', 'projected'],
      ]);
      await checkIn(A);
      await checkIn(S);
      await checkOut(A);
      await checkOut(S);
      for (const b of [A, S]) {
        const base = await roomBase(b);
        expect(await commissions(b)).toEqual([
          row('sal', 'void', base, 'closer_changed'),
          row('sal2', 'earned', base),
        ]);
      }
    });

    it('legacy: the earned row belongs to sal2 while the column says sal (pre-fix change); OWN sets sal2 back → the earned row stays, nothing added', async () => {
      await at('2026-10-27T12:00:00+07:00');
      await q(`UPDATE reservation SET closer_user_id = $2 WHERE id = $1`, [S.id, sal()]);
      const rows = await commissions(S);
      const voided = (await voidAudits(S)).length;
      const r = await patch(
        S,
        { closerUserId: sal2(), closerChangeReason: 'Sale 2 chốt đơn, chủ đầu tư sửa' },
        'owner',
      );
      expect(r.statusCode, r.body).toBe(200);
      expect(await closerOf(S)).toBe(sal2());
      expect(await commissions(S)).toEqual(rows);
      expect(await voidAudits(S)).toHaveLength(voided);
    });

    it('DOM 1H-04: money the OLD closer recorded, still pending (cash not handed over / a transfer), keeps the NEW closer projected (B18 after an in-house correction; OWN correction after check-out) until it is confirmed', async () => {
      await at('2026-10-27T13:00:00+07:00');
      const K1 = await book('101', '2026-10-28', 2);
      const K2 = await book('102', '2026-10-28', 2);
      // The sale takes a deposit from each guest the day of arrival: cash on K1 (not handed over to the desk yet),
      // a transfer on K2. A sale's receipt always waits for the desk / bank check (BR-527, A46a).
      await at('2026-10-28T14:00:00+07:00');
      const receipts: Record<string, string> = {};
      for (const [b, method] of [
        [K1, 'cash'],
        [K2, 'bank_transfer'],
      ] as const) {
        const r = await db.withContext({ ...t.ctx(), userId: sal(), actorType: 'user' }, (tx) =>
          fa.app.get(PaymentService).recordManual(tx, {
            folioId: b.folioId,
            reservationId: b.id,
            reservationCode: b.code,
            type: 'deposit',
            method,
            amountVnd: 100_000,
            receivedAt: new Date('2026-10-28T14:00:00+07:00'),
            recordedBy: sal(),
          } as never),
        );
        receipts[b.id] = r.id;
        const [p] = await q(`SELECT reconciliation FROM payment WHERE id = $1`, [r.id]);
        expect(p.reconciliation).toBe('pending');
      }
      await checkIn(K1);
      await checkIn(K2);
      await at('2026-10-29T10:00:00+07:00');
      const base1 = await roomBase(K1);
      const r1 = await patch(
        K1,
        { closerUserId: sal2(), closerChangeReason: 'Sale 2 chốt đơn, chủ đầu tư sửa' },
        'owner',
      );
      expect(r1.statusCode, r1.body).toBe(200);
      expect(await commissions(K1)).toEqual([
        row('sal', 'void', base1, 'closer_corrected'),
        row('sal2', 'projected', base1),
      ]);
      await checkOut(K1);
      await checkOut(K2);
      expect(await due(K1)).toBe(0);
      // B18: sal2 recorded nothing, but sal's cash on the folio is still pending → sal2 stays projected.
      expect(await commissions(K1)).toEqual([
        row('sal', 'void', base1, 'closer_corrected'),
        row('sal2', 'projected', base1),
      ]);
      expect((await commissions(K2)).map((x) => [x.payee, x.status])).toEqual([
        ['sal', 'projected'],
      ]);
      await at('2026-10-30T12:00:00+07:00');
      const base2 = await roomBase(K2);
      const r2 = await patch(
        K2,
        { closerUserId: sal2(), closerChangeReason: 'Sale 2 chốt đơn, chủ đầu tư sửa' },
        'owner',
      );
      expect(r2.statusCode, r2.body).toBe(200);
      expect(await commissions(K2)).toEqual([
        row('sal', 'void', base2, 'closer_corrected'),
        row('sal2', 'projected', base2),
      ]);
      // The desk confirms sal's cash on K1, MGR reconciles sal's transfer on K2 → sal2 earned on each, on that day.
      await at('2026-10-31T09:00:00+07:00');
      for (const [b, base, who, verb, body] of [
        [K1, base1, 'fd', 'confirm-cash-handover', { result: 'received' }],
        [K2, base2, 'mgr', 'reconcile', { result: 'reconciled' }],
      ] as const) {
        const id = receipts[b.id]!;
        const [p] = await q(`SELECT version FROM payment WHERE id = $1`, [id]);
        const rec = await c[who]!.send('POST', url(`/payments/${id}/actions/${verb}`), body, {
          'if-match': `"${p.version}"`,
        });
        expect(rec.statusCode, rec.body).toBe(200);
        expect(await commissions(b)).toEqual([
          row('sal', 'void', base, 'closer_corrected'),
          row('sal2', 'earned', base),
        ]);
        const [earned] = await q(
          `SELECT recognized_at FROM commission WHERE reservation_id = $1 AND status = 'earned'`,
          [b.id],
        );
        expect(new Date(earned.recognized_at).toISOString()).toBe(
          new Date('2026-10-31T09:00:00+07:00').toISOString(),
        );
      }
    });

    it('ARC 154-01 (a): a combined edit (closer + adults) – MGR before arrival → closer_changed, OWN in house → closer_corrected; one live row of the new closer, never a resync void', async () => {
      await at('2026-11-01T10:00:00+07:00');
      const G1 = await book('201', '2026-11-02', 2);
      const G2 = await book('202', '2026-11-02', 2);
      const reasons = async (b: Booking) =>
        (await commissions(b)).map((x) => [x.payee, x.status, x.void_reason]);
      const live = async (b: Booking) => (await commissions(b)).filter((x) => x.status !== 'void');
      const r1 = await patch(G1, { closerUserId: sal2(), adults: 1 }, 'mgr');
      expect(r1.statusCode, r1.body).toBe(200);
      expect(r1.json().adults).toBe(1);
      expect(await reasons(G1)).toEqual([
        ['sal', 'void', 'closer_changed'],
        ['sal2', 'projected', null],
      ]);
      expect(await live(G1)).toEqual([row('sal2', 'projected', await roomBase(G1))]);
      await checkIn(G2);
      await at('2026-11-02T16:00:00+07:00');
      const r2 = await patch(
        G2,
        { closerUserId: sal2(), closerChangeReason: 'Sale 2 chốt đơn, chủ đầu tư sửa', adults: 1 },
        'owner',
      );
      expect(r2.statusCode, r2.body).toBe(200);
      expect(r2.json().adults).toBe(1);
      expect(await reasons(G2)).toEqual([
        ['sal', 'void', 'closer_corrected'],
        ['sal2', 'projected', null],
      ]);
      expect(await live(G2)).toEqual([row('sal2', 'projected', await roomBase(G2))]);
    });

    it('ARC 154-01 (b): 1H-04 counts the payees of THIS booking only – a pending cash deposit of a sale who earns on OTHER bookings does not hold this closer', async () => {
      await at('2026-11-01T11:00:00+07:00');
      const Q = await book('203', '2026-11-02', 2);
      // sal2 is a payee on other bookings (A, O, X…), never on Q.
      expect(
        (await q(`SELECT count(*)::int AS n FROM commission WHERE payee_user_id = $1`, [sal2()]))[0]
          .n,
      ).toBeGreaterThan(0);
      await at('2026-11-02T14:00:00+07:00');
      const r = await db.withContext({ ...t.ctx(), userId: sal2(), actorType: 'user' }, (tx) =>
        fa.app.get(PaymentService).recordManual(tx, {
          folioId: Q.folioId,
          reservationId: Q.id,
          reservationCode: Q.code,
          type: 'deposit',
          method: 'cash',
          amountVnd: 100_000,
          receivedAt: new Date('2026-11-02T14:00:00+07:00'),
          recordedBy: sal2(),
        } as never),
      );
      const [p] = await q(`SELECT reconciliation FROM payment WHERE id = $1`, [r.id]);
      expect(p.reconciliation).toBe('pending');
      await checkIn(Q);
      await checkOut(Q);
      expect(await commissions(Q)).toEqual([row('sal', 'earned', await roomBase(Q))]);
    });
  },
);
