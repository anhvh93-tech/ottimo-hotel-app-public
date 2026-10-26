/**
 * BE-B – v1.0 patch ESC-031 (INV 26/10 "vá luôn"), ESC-024 B (INV 22/10), BR-416 (1)–(4), on the real PostgreSQL
 * through HTTP. Production runs MFA_ENFORCED=true, so the manager password typed at the desk (`verifyApprover`) is
 * refused for every OWN/MGR with 2FA (fail-closed, kept – SEC-sprint1 3.6). `lateFeeInsteadOfNight.postReview`:
 * - the desk records EXACTLY the server's number (unsellable night only), reason required, no credentials of anyone,
 *   no FOC in the command – all refused 422/409 before anything is written;
 * - money audit `channel = post_review` (actor = the desk user, nobody "confirmed"), `late_fee_post_review` to OWN +
 *   MGR, ONE "Cần chú ý" item MGR+ due at the end of the post-checkout window;
 * - the review: MGR waives with A32 on the settled folio (→ refund request, K11-06) and marks the item seen; past the
 *   window unreviewed → the overdue job tells OWN once.
 * Fake clock and FAKE data only.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { randomBytes, randomUUID } from 'node:crypto';
import { v7 as uuidv7 } from 'uuid';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type Database } from '../../src/db/database';
import { JobRunner } from '../../src/jobs/job-runner';
import { NoGuestAccessPort } from '../../src/modules/frontdesk/internal/default-ports';
import { FrontdeskPorts } from '../../src/modules/frontdesk/internal/stay-support';
import { LATE_FEE_REVIEW_OVERDUE_JOB_KEY } from '../../src/modules/frontdesk/public/late-fee-review-job';
import {
  FD_CHILD_DATA_PORT,
  type CheckinDocumentStatus,
  type FrontdeskChildDataPort,
  type FrontdeskMinibarPort,
  type FrontdeskRegistrationPort,
  type MinibarCheckoutStatus,
} from '../../src/modules/frontdesk/public/ports';
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

class MinibarCounted implements FrontdeskMinibarPort {
  async checkoutStatus(): Promise<MinibarCheckoutStatus> {
    return { required: false, checked: true };
  }
  async onCheckedOut(): Promise<string | null> {
    return null;
  }
}

const ROLES = {
  own: ['owner'],
  mgr: ['manager'],
  mfa: ['manager'],
  fdl: ['front_desk_lead'],
  fd: ['front_desk'],
};
const FEE = 792_000;
const REASON = 'Căn có khách đến đêm nay, không dời được';

type Booking = { id: string; code: string; version: number; folioId: string };

describe.skipIf(!HAS_DB)(
  'ESC-031 – late charge of one night recorded for post review (ESC-024 B)',
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
      ids = await seedBooking(db, t);
      guest = await seedGuestRow(db, t, { name: 'Khách Hậu Kiểm' });
      fa = await startFeatureApp(db, {
        override: (b) =>
          b.overrideProvider(FrontdeskPorts).useFactory({
            factory: (child: FrontdeskChildDataPort) =>
              new FrontdeskPorts(
                new DocsOk(),
                new NoGuestAccessPort(),
                child,
                new MinibarCounted(),
              ),
            inject: [FD_CHILD_DATA_PORT],
          }),
      });
      for (const u of Object.keys(ROLES)) {
        c[u] = Client.of(fa, t, u);
        await setPassword(db, t, u);
      }
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
      for (const u of Object.keys(ROLES)) c[u]!.deviceToken = token;
      // The manager of production: 2FA on (MFA_ENFORCED=true) – a password alone never confirms at the desk.
      await q(
        "UPDATE app_user SET mfa_enabled = true, mfa_secret_enc = '\\x00'::bytea WHERE id = $1",
        [t.users.mfa!.id],
      );
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
    async function q<R extends Record<string, unknown>>(sql: string, p: unknown[] = []) {
      return (await db.withContext(t.ctx(), (tx) => tx.query<R>(sql, p))).rows;
    }
    const get = async (id: string) => (await c.fd!.get(url(`/reservations/${id}`))).json();
    const act = async (
      id: string,
      verb: string,
      body: unknown,
      who = 'fd',
      headers: Record<string, string> = {},
    ) =>
      c[who]!.send('POST', url(`/reservations/${id}/actions/${verb}`), body, {
        'if-match': `"${(await get(id)).version}"`,
        ...headers,
      });
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
    const direct = (room: string, from: string, to: string, deposit: number) =>
      create({
        roomId: ids.rooms[room],
        channelId: ids.channels.direct,
        directSource: 'zalo_phone',
        adults: 2,
        bookerGuestId: guest,
        paymentModel: 'direct',
        arrivalDate: from,
        departureDate: to,
        initialPayment: { type: 'deposit', method: 'cash', amountVnd: deposit },
      });
    const ready = (room: string) =>
      q(
        `INSERT INTO room_status (room_id, organization_id, property_id, status, since) VALUES ($1, $2, $3, 'VC', $4)
       ON CONFLICT (room_id) DO UPDATE SET status = 'VC'`,
        [ids.rooms[room], t.organizationId, t.propertyIds[0], new Date('2026-10-01T00:00:00Z')],
      );
    const summary = async (b: Booking, time = '19:00') => {
      const r = await c.fd!.get(url(`/reservations/${b.id}/checkout-summary?checkoutTime=${time}`));
      expect(r.statusCode, r.body).toBe(200);
      return r.json();
    };
    const stayIn = async (b: Booking, room: string, day: string) => {
      await at(`${day}T15:00:00+07:00`);
      await ready(room);
      const pv = await c.fd!.get(url(`/reservations/${b.id}/check-in-preview?checkinTime=15:00`));
      expect(pv.statusCode, pv.body).toBe(200);
      const due = pv.json().amountDueAtCheckinVnd as number;
      const ci = await act(b.id, 'check-in', {
        cardsIssued: 1,
        houseRulesSent: true,
        checkinTime: '15:00',
        ...(due > 0 ? { payment: { type: 'charge', method: 'cash', amountVnd: due } } : {}),
      });
      expect(ci.statusCode, ci.body).toBe(200);
    };
    /** Tue → Thu, the Thursday night already sold to another booking: the departure night cannot be sold. */
    const unsellableStay = async (room: string, from: string, to: string, after: string) => {
      await at(`${from.slice(0, 8)}01T10:00:00+07:00`);
      const b = await direct(room, from, to, 500_000);
      await direct(room, to, after, 300_000);
      await stayIn(b, room, from);
      return b;
    };
    const postReview = (more: Record<string, unknown> = {}, top: Record<string, unknown> = {}) => ({
      checkoutTime: '19:00',
      lateFeeInsteadOfNight: { amountVnd: FEE, reason: REASON, postReview: true, ...more },
      ...top,
    });
    const told = async (b: Booking) => {
      const out: Record<string, number> = Object.fromEntries(Object.keys(ROLES).map((u) => [u, 0]));
      const rows = await q<{ user_id: string; n: number }>(
        `SELECT user_id::text AS user_id, count(*)::int AS n FROM staff_notification
        WHERE kind = 'late_fee_post_review' AND ref_id = $1 GROUP BY user_id`,
        [b.id],
      );
      for (const r of rows) {
        const who = Object.keys(ROLES).find((u) => t.users[u]!.id === r.user_id)!;
        out[who] = Number(r.n);
      }
      return out;
    };
    const lateFeeAudits = (b: Booking) =>
      q<{ after: Record<string, unknown>; actor: string; reason: string | null }>(
        `SELECT after, actor_user_id::text AS actor, reason FROM audit_event
        WHERE action = 'reservation.late_fee_instead_of_night' AND entity_id = $1 ORDER BY occurred_at, id`,
        [b.id],
      );
    const attention = async (who: string) => {
      const r = await c[who]!.get(url('/attention'));
      expect(r.statusCode, r.body).toBe(200);
      return (r.json().data as any[]).filter((i) => i.kind === 'late_fee_post_review');
    };
    const runJob = async () => {
      const runner = fa.app.get(JobRunner, { strict: false });
      const p = (await runner.listProperties()).find(
        (x: any) => x.propertyId === t.propertyIds[0],
      )!;
      return (await runner.runOnce(LATE_FEE_REVIEW_OVERDUE_JOB_KEY, p)).stats as { told: number };
    };
    const folioLines = async (b: Booking) =>
      (await c.mgr!.get(url(`/folios/${b.folioId}`))).json().lines as any[];

    it("FD records 792.000 without anyone's password: B18 done, money audit `post_review` (actor FD, nobody confirmed), OWN + MGR told, one MGR+ item due at the end of the window; FD sees no item; no re-auth trace", async () => {
      const b = await unsellableStay('203', '2030-01-15', '2030-01-17', '2030-01-18');
      await at('2030-01-17T19:00:00+07:00');
      const s = await summary(b);
      expect(s.lateFeeAsNightVnd).toBe(FEE);
      const due = s.amountDueAtCheckoutVnd as number;
      const res = await act(
        b.id,
        'check-out',
        postReview(
          {},
          due > 0 ? { finalPayment: { type: 'charge', method: 'cash', amountVnd: due } } : {},
        ),
      );
      expect(res.statusCode, res.body).toBe(200);
      expect(res.json().reservation.status).toBe('checked_out');
      const lines = await folioLines(b);
      const late = lines.filter((l) => l.chargeCode === 'late_fee_as_night' && !l.reversalOfId);
      expect(late.map((l) => l.amountVnd)).toEqual([FEE]);
      expect(lines.filter((l) => l.category === 'foc')).toEqual([]);
      const [audit, ...more] = await lateFeeAudits(b);
      expect(more).toEqual([]);
      expect(audit!.actor).toBe(t.users.fd!.id);
      expect(audit!.reason).toBe(REASON);
      expect(audit!.after).toEqual({
        amountVnd: FEE,
        checkoutTime: '19:00',
        date: '2030-01-17',
        channel: 'post_review',
        reviewDueAt: '2030-01-18T12:00:00.000Z',
      });
      expect(await told(b)).toEqual({ own: 1, mgr: 1, mfa: 1, fdl: 0, fd: 0 });
      const items = await attention('mgr');
      expect(items).toHaveLength(1);
      expect(items[0]).toMatchObject({
        source: 'event',
        severity: 'warning',
        refCode: b.code,
        reservationIds: [b.id],
      });
      expect(Date.parse(items[0].dueAt)).toBe(Date.parse('2030-01-18T19:00:00+07:00'));
      expect(await attention('own')).toHaveLength(1);
      expect(await attention('fd')).toEqual([]);
      expect(await attention('fdl')).toEqual([]);
      const sec = await q<{ n: number }>(
        `SELECT count(*)::int AS n FROM audit_event WHERE category = 'security' AND action LIKE 'late_fee_as_night.%'`,
      );
      expect(Number(sec[0]!.n)).toBe(0);
      const counters = await q<{ n: number }>(
        'SELECT COALESCE(sum(approval_pin_failed_count), 0)::int AS n FROM app_user',
      );
      expect(Number(counters[0]!.n)).toBe(0);
      // Folio settled, the post-checkout window = the review window.
      const [f] = await q<{ status: string; until: Date }>(
        'SELECT status, post_checkout_window_until AS until FROM folio WHERE id = $1',
        [b.folioId],
      );
      expect(f!.status).toBe('settled');
      expect(new Date(f!.until).toISOString()).toBe('2030-01-18T12:00:00.000Z');
    });

    it('production manager with 2FA at the desk stays refused (401, fail-closed); the same check-out with `postReview` goes through', async () => {
      const b = await unsellableStay('202', '2030-02-12', '2030-02-14', '2030-02-15');
      await at('2030-02-14T19:00:00+07:00');
      const s = await summary(b);
      expect(s.lateFeeAsNightVnd).toBe(FEE);
      const due = s.amountDueAtCheckoutVnd as number;
      const pay =
        due > 0 ? { finalPayment: { type: 'charge', method: 'cash', amountVnd: due } } : {};
      const desk = await act(b.id, 'check-out', {
        checkoutTime: '19:00',
        lateFeeInsteadOfNight: {
          amountVnd: FEE,
          reason: REASON,
          approverUsername: t.users.mfa!.username,
          authMethod: 'password',
          secret: TEST_PASSWORD,
        },
        ...pay,
      });
      expect(desk.statusCode, desk.body).toBe(401);
      expect(desk.json().code).toBe('REAUTH_FAILED');
      expect((await get(b.id)).status).toBe('in_house');
      expect(await lateFeeAudits(b)).toEqual([]);
      const ok = await act(b.id, 'check-out', postReview({}, pay));
      expect(ok.statusCode, ok.body).toBe(200);
      expect((await lateFeeAudits(b)).map((a) => a.after.channel)).toEqual(['post_review']);
    });

    it('refused before anything is written: FOC, password, approver, TOTP or a confirmation with `postReview` (422 NOT_ALLOWED), a non-boolean flag, no reason, another number (409), a sellable night', async () => {
      const b = await unsellableStay('101', '2030-03-12', '2030-03-14', '2030-03-15');
      await at('2030-03-14T19:00:00+07:00');
      const fee = (await summary(b)).lateFeeAsNightVnd as number;
      const send = (more: Record<string, unknown>, who = 'fd') =>
        act(
          b.id,
          'check-out',
          {
            checkoutTime: '19:00',
            lateFeeInsteadOfNight: { amountVnd: fee, reason: REASON, postReview: true, ...more },
          },
          who,
        );
      const cases: Array<[Record<string, unknown>, number, string, string]> = [
        [
          { requestFoc: { kind: 'foc', amountVnd: 100_000, reasonCode: 'service_recovery' } },
          422,
          'lateFeeInsteadOfNight.requestFoc',
          'NOT_ALLOWED',
        ],
        [
          { authMethod: 'password', secret: TEST_PASSWORD },
          422,
          'lateFeeInsteadOfNight.authMethod',
          'NOT_ALLOWED',
        ],
        [
          { approverUsername: t.users.mgr!.username },
          422,
          'lateFeeInsteadOfNight.approverUsername',
          'NOT_ALLOWED',
        ],
        [{ totpCode: '123456' }, 422, 'lateFeeInsteadOfNight.totpCode', 'NOT_ALLOWED'],
        [
          { confirmationId: randomUUID() },
          422,
          'lateFeeInsteadOfNight.confirmationId',
          'NOT_ALLOWED',
        ],
        [{ postReview: 'yes' }, 422, 'lateFeeInsteadOfNight.postReview', 'VALIDATION_FAILED'],
        [{ reason: undefined }, 422, 'lateFeeInsteadOfNight.reason', 'REASON_REQUIRED'],
      ];
      for (const [more, status, field, code] of cases) {
        const r = await send(more);
        expect(r.statusCode, `${field} ${r.body}`).toBe(status);
        expect(r.json().errors, r.body).toContainEqual({ field, code });
      }
      // The desk cannot type another number (lower or higher).
      for (const amountVnd of [fee - 100_000, fee + 1]) {
        const r = await send({ amountVnd });
        expect(r.statusCode, r.body).toBe(409);
        expect(r.json().code).toBe('SURCHARGE_CHANGED');
      }
      // A manager calling gets the same answers (no "own password" shortcut on this path).
      const own = await send({ secret: TEST_PASSWORD, authMethod: 'password' }, 'mgr');
      expect(own.statusCode, own.body).toBe(422);
      // Nothing written by any of them.
      expect((await get(b.id)).status).toBe('in_house');
      expect(await lateFeeAudits(b)).toEqual([]);
      expect(await told(b)).toEqual({ own: 0, mgr: 0, mfa: 0, fdl: 0, fd: 0 });
      expect((await attention('mgr')).filter((i) => i.refCode === b.code)).toEqual([]);
      expect((await folioLines(b)).filter((l) => l.chargeCode === 'late_fee_as_night')).toEqual([]);

      // A night that can be sold: the path does not open (sell the extra night instead).
      const free = await (async () => {
        await at('2030-04-01T10:00:00+07:00');
        const x = await direct('102', '2030-04-09', '2030-04-11', 500_000);
        await stayIn(x, '102', '2030-04-09');
        return x;
      })();
      await at('2030-04-11T19:00:00+07:00');
      const sellable = await summary(free);
      expect(sellable.extraNightAvailable).toBe(true);
      const r = await act(free.id, 'check-out', {
        checkoutTime: '19:00',
        lateFeeInsteadOfNight: {
          amountVnd: sellable.extraNightDefaultRateVnd,
          reason: REASON,
          postReview: true,
        },
      });
      expect(r.statusCode, r.body).toBe(422);
      expect(r.json().errors).toContainEqual({
        field: 'lateFeeInsteadOfNight',
        code: 'NOT_ALLOWED',
      });
      expect(await lateFeeAudits(free)).toEqual([]);
    });

    it('a replay of the same Idempotency-Key answers the stored 200 – no second charge, audit or notification', async () => {
      const b = await unsellableStay('201', '2030-05-14', '2030-05-16', '2030-05-17');
      await at('2030-05-16T19:00:00+07:00');
      const s = await summary(b);
      const due = s.amountDueAtCheckoutVnd as number;
      const body = postReview(
        { amountVnd: s.lateFeeAsNightVnd },
        due > 0 ? { finalPayment: { type: 'charge', method: 'cash', amountVnd: due } } : {},
      );
      const key = randomUUID();
      const ifMatch = `"${(await get(b.id)).version}"`;
      const first = await c.fd!.send('POST', url(`/reservations/${b.id}/actions/check-out`), body, {
        'if-match': ifMatch,
        'idempotency-key': key,
      });
      expect(first.statusCode, first.body).toBe(200);
      const again = await c.fd!.send('POST', url(`/reservations/${b.id}/actions/check-out`), body, {
        'if-match': ifMatch,
        'idempotency-key': key,
      });
      expect(again.statusCode, again.body).toBe(200);
      expect(again.headers['idempotent-replayed']).toBe('true');
      expect(await lateFeeAudits(b)).toHaveLength(1);
      expect(await told(b)).toEqual({ own: 1, mgr: 1, mfa: 1, fdl: 0, fd: 0 });
      expect(
        (await folioLines(b)).filter(
          (l) => l.chargeCode === 'late_fee_as_night' && !l.reversalOfId,
        ),
      ).toHaveLength(1);
    });

    it('the review: MGR waives 50 % with A32 on the settled folio inside the window → refund request 396.000; marks the item seen → gone; the overdue job tells nobody', async () => {
      const b = await unsellableStay('203', '2030-06-11', '2030-06-13', '2030-06-14');
      await at('2030-06-13T20:30:00+07:00');
      const s = await summary(b, '20:30');
      const due = s.amountDueAtCheckoutVnd as number;
      const res = await act(b.id, 'check-out', {
        checkoutTime: '20:30',
        lateFeeInsteadOfNight: { amountVnd: FEE, reason: REASON, postReview: true },
        ...(due > 0 ? { finalPayment: { type: 'charge', method: 'cash', amountVnd: due } } : {}),
      });
      expect(res.statusCode, res.body).toBe(200);
      // Next morning, inside the window: the manager reviews.
      await at('2030-06-14T09:00:00+07:00');
      const line = (await folioLines(b)).find(
        (l) => l.chargeCode === 'late_fee_as_night' && !l.reversalOfId,
      );
      const etag = (await c.mgr!.get(url(`/folios/${b.folioId}`))).headers.etag as string;
      const a32 = await c.mgr!.send(
        'POST',
        url(`/folios/${b.folioId}/lines/${line.id}/adjustments`),
        { reason: 'Khách đến muộn do OTTIMO – miễn 50 %', newUnitPriceVnd: FEE / 2 },
        { 'if-match': etag },
      );
      expect(a32.statusCode, a32.body).toBe(201);
      const refunds = await q<{ amount: number; requested_by: string; status: string }>(
        `SELECT amount_vnd::int AS amount, requested_by::text AS requested_by, status FROM approval_request
        WHERE type = 'refund' AND target_id = $1 AND status IN ('pending', 'approved')`,
        [b.id],
      );
      expect(refunds).toEqual([
        { amount: 396_000, requested_by: t.users.mgr!.id, status: 'pending' },
      ]);
      const mine = (await attention('mgr')).find((i) => i.refCode === b.code)!;
      expect(mine).toBeDefined();
      const seen = await c.mgr!.send(
        'POST',
        url(`/attention-events/${mine.eventId}/actions/resolve`),
        { note: 'Đã xem, miễn 50 %' },
      );
      expect(seen.statusCode, seen.body).toBe(204);
      expect((await attention('mgr')).filter((i) => i.refCode === b.code)).toEqual([]);
      // FD can never close it (not visible → 404).
      const fdSeen = await c.fd!.send(
        'POST',
        url(`/attention-events/${mine.eventId}/actions/resolve`),
        {},
      );
      expect(fdSeen.statusCode).toBe(404);
      await at('2030-06-15T09:00:00+07:00');
      await runJob();
      expect((await told(b)).own).toBe(1);
    });

    it('not reviewed within the window → the overdue job tells every OWN once (not before the deadline, never twice)', async () => {
      const b = await unsellableStay('202', '2030-07-09', '2030-07-11', '2030-07-12');
      await at('2030-07-11T19:00:00+07:00');
      const due = (await summary(b)).amountDueAtCheckoutVnd as number;
      const res = await act(
        b.id,
        'check-out',
        postReview(
          {},
          due > 0 ? { finalPayment: { type: 'charge', method: 'cash', amountVnd: due } } : {},
        ),
      );
      expect(res.statusCode, res.body).toBe(200);
      expect(await told(b)).toEqual({ own: 1, mgr: 1, mfa: 1, fdl: 0, fd: 0 });
      await at('2030-07-12T18:59:00+07:00');
      await runJob();
      expect((await told(b)).own).toBe(1);
      await at('2030-07-12T19:00:00+07:00');
      await runJob();
      expect(await told(b)).toEqual({ own: 2, mgr: 1, mfa: 1, fdl: 0, fd: 0 });
      await at('2030-07-12T19:30:00+07:00');
      await runJob();
      await runJob();
      expect((await told(b)).own).toBe(2);
      // The item stays for OWN/MGR (overdue first in the list order – dueAt passed).
      expect((await attention('own')).filter((i) => i.refCode === b.code)).toHaveLength(1);
    });
  },
);
