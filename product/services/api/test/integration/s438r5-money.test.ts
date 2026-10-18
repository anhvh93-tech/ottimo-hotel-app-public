/**
 * BE-A – S4-38 re-verification round 5 (`s4-money-recheck5.md`; SEC `s4-SEC-lateFee-reauth.md` mục 12) on the real
 * PostgreSQL through HTTP:
 * - BUG-R2-165 (SEC 12.1, BE-64): every B18 body field, If-Match and the FOC headroom answer before the approver's
 *   password – the same answer with a wrong and a right password, nothing counted.
 * - BUG-R2-166 (SEC 12.2, accepted): the same key while the first B18 is still in its transaction.
 * - BUG-R2-167 (SEC 12.3, BE-62): a right password for another user leaves its trace (security audit
 *   `late_fee_as_night.reauth_succeeded` + one `account_security_change`) also when B18 fails afterwards.
 * Fake clock and FAKE data only.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { randomBytes, randomUUID } from 'node:crypto';
import { v7 as uuidv7 } from 'uuid';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
import { NoGuestAccessPort } from '../../src/modules/frontdesk/internal/default-ports';
import { FrontdeskPorts } from '../../src/modules/frontdesk/internal/stay-support';
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

const ROLES = { own: ['owner'], mgr: ['manager'], fdl: ['front_desk_lead'], fd: ['front_desk'] };
const WRONG = 'Sai-mat-khau-R5';
const FEE = 792_000;

type Booking = { id: string; code: string; version: number; folioId: string };

describe.skipIf(!HAS_DB)('S4-38 re-verification round 5 – lateFeeInsteadOfNight (BE-A)', () => {
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
    guest = await seedGuestRow(db, t, { name: 'Khách Kiểm Lần Năm' });
    fa = await startFeatureApp(db, {
      override: (b) =>
        b.overrideProvider(FrontdeskPorts).useFactory({
          factory: (child: FrontdeskChildDataPort) =>
            new FrontdeskPorts(new DocsOk(), new NoGuestAccessPort(), child, new MinibarCounted()),
          inject: [FD_CHILD_DATA_PORT],
        }),
    });
    for (const u of Object.keys(ROLES)) {
      c[u] = Client.of(fa, t, u);
      await setPassword(db, t, u);
    }
    // The desk PC (check-in is a desk action – SEC trusted device).
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
  const get = async (id: string) => (await c.fd!.get(url(`/reservations/${id}`))).json();
  const act = async (id: string, verb: string, body: unknown, who = 'fd', ifMatch?: string) =>
    c[who]!.send('POST', url(`/reservations/${id}/actions/${verb}`), body, {
      'if-match': ifMatch ?? `"${(await get(id)).version}"`,
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
  const totals = async (b: Booking) =>
    (await c.fd!.get(url(`/folios/${b.folioId}`))).json().totals as {
      balanceDueVnd: number;
      creditVnd: number;
      totalVnd: number;
    };
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
  /** 203/202 Tue → Thu, the Thursday night sold to another booking: the departure night cannot be sold. */
  const unsellableStay = async (room: string, from: string, to: string, after: string) => {
    await at(`${from.slice(0, 8)}01T10:00:00+07:00`);
    const b = await direct(room, from, to, 500_000);
    await direct(room, to, after, 300_000);
    await stayIn(b, room, from);
    return b;
  };
  const resetCounters = () =>
    q('UPDATE app_user SET approval_pin_failed_count = 0, approval_pin_locked_until = NULL');
  const counters = async () =>
    Object.fromEntries(
      (
        await q<{ id: string; n: number }>(
          'SELECT id::text AS id, approval_pin_failed_count AS n FROM app_user WHERE id = ANY($1::uuid[])',
          [[t.users.fd!.id, t.users.mgr!.id]],
        )
      ).map((r) => [r.id === t.users.fd!.id ? 'fd' : 'mgr', Number(r.n)]),
    ) as { fd: number; mgr: number };
  const succeeded = (u = 'mgr') =>
    q<{ after: Record<string, unknown>; requestId: string | null; actor: string | null }>(
      `SELECT after, request_id AS "requestId", actor_user_id::text AS actor FROM audit_event
        WHERE category = 'security' AND action = 'late_fee_as_night.reauth_succeeded' AND entity_id = $1
        ORDER BY occurred_at, id`,
      [t.users[u]!.id],
    );
  const securityAudits = async () =>
    Number(
      (
        await q<{ n: number }>(
          `SELECT count(*)::int AS n FROM audit_event WHERE category = 'security' AND action LIKE 'late_fee_as_night.%'`,
        )
      )[0]!.n,
    );
  const told = async (b: Booking, u = 'mgr') =>
    Number(
      (
        await q<{ n: number }>(
          `SELECT count(*)::int AS n FROM staff_notification
            WHERE user_id = $1 AND kind = 'account_security_change' AND ref_id = $2`,
          [t.users[u]!.id, b.id],
        )
      )[0]!.n,
    );
  const lateFeeBody = (
    secret: string,
    more: Record<string, unknown> = {},
    top: Record<string, unknown> = {},
    approver: string | null = 'mgr',
  ) => ({
    checkoutTime: '19:00',
    lateFeeInsteadOfNight: {
      amountVnd: FEE,
      reason: 'Căn có khách đến, không dời được',
      ...(approver ? { approverUsername: t.users[approver]!.username } : {}),
      authMethod: 'password',
      secret,
      ...more,
    },
    ...top,
  });

  // ───────────────────────────── BUG-R2-165 – BE-64: every body field before the password ─────────────────────────────

  it('BUG-R2-165 (SEC 12.1): bitcoin, −1, note "x", overpayment "keep", applyLateSurcharge "yes", FOC 792.001 and a stale If-Match – a wrong and a right password get the same 422/412, counters 0/0, no audit, no notification', async () => {
    const b = await unsellableStay('203', '2030-01-15', '2030-01-17', '2030-01-18');
    await at('2030-01-17T19:00:00+07:00');
    expect((await summary(b)).lateFeeAsNightVnd).toBe(FEE);
    const foc = (amountVnd: number) => ({
      requestFoc: { kind: 'foc', amountVnd, reasonCode: 'service_recovery', note: 'Khách quen' },
    });
    const cases: Array<
      [
        string,
        (pw: string) => Promise<{ statusCode: number; json(): any; body: string }>,
        number,
        unknown,
      ]
    > = [
      [
        'finalPayment.method bitcoin',
        (pw) =>
          act(
            b.id,
            'check-out',
            lateFeeBody(
              pw,
              {},
              { finalPayment: { type: 'charge', method: 'bitcoin', amountVnd: FEE } },
            ),
          ),
        422,
        [{ field: 'finalPayment.method', code: 'NOT_IN_LIST' }],
      ],
      [
        'finalPayment.amountVnd −1',
        (pw) =>
          act(
            b.id,
            'check-out',
            lateFeeBody(
              pw,
              {},
              { finalPayment: { type: 'charge', method: 'cash', amountVnd: -1 } },
            ),
          ),
        422,
        [{ field: 'finalPayment.amountVnd', code: 'AMOUNT_NOT_POSITIVE' }],
      ],
      [
        'checkoutTimeNote "x"',
        (pw) => act(b.id, 'check-out', lateFeeBody(pw, {}, { checkoutTimeNote: 'x' })),
        422,
        [expect.objectContaining({ field: 'checkoutTimeNote' })],
      ],
      [
        'overpaymentHandling.mode "keep"',
        (pw) =>
          act(
            b.id,
            'check-out',
            lateFeeBody(pw, {}, { overpaymentHandling: { mode: 'keep', reason: 'abc' } }),
          ),
        422,
        [{ field: 'overpaymentHandling.mode', code: 'NOT_IN_LIST' }],
      ],
      [
        'applyLateSurcharge "yes"',
        (pw) => act(b.id, 'check-out', lateFeeBody(pw, {}, { applyLateSurcharge: 'yes' })),
        422,
        [expect.objectContaining({ field: 'applyLateSurcharge' })],
      ],
      [
        'requestFoc 792.001 (VALUE_OUT_OF_RANGE)',
        (pw) => act(b.id, 'check-out', lateFeeBody(pw, foc(FEE + 1))),
        422,
        [{ field: 'lateFeeInsteadOfNight.requestFoc.amountVnd', code: 'VALUE_OUT_OF_RANGE' }],
      ],
      [
        'stale If-Match (412)',
        async (pw) =>
          act(b.id, 'check-out', lateFeeBody(pw), 'fd', `"${(await get(b.id)).version - 1}"`),
        412,
        undefined,
      ],
    ];
    const a0 = await securityAudits();
    for (const [name, send, status, errors] of cases) {
      await resetCounters();
      const wrong = await send(WRONG);
      const right = await send(TEST_PASSWORD);
      expect(wrong.statusCode, `${name}: ${wrong.body}`).toBe(status);
      expect(right.statusCode, `${name}: ${right.body}`).toBe(status);
      expect(right.json().code, name).toBe(wrong.json().code);
      expect(right.json().errors, name).toEqual(wrong.json().errors);
      if (errors) expect(wrong.json().errors, name).toEqual(errors);
      if (name.startsWith('requestFoc')) expect(wrong.json()).toMatchObject({ max: FEE });
      if (status === 412) expect(wrong.json().code).toBe('VERSION_CONFLICT');
      expect(await counters(), `${name}: not counted`).toEqual({ fd: 0, mgr: 0 });
    }
    expect(await securityAudits(), 'no password was checked').toBe(a0);
    expect(await told(b)).toBe(0);
    expect(await get(b.id)).toMatchObject({ status: 'in_house' });
    // The same body, clean: the right password checks out (cash = what is due).
    const due = (await totals(b)).balanceDueVnd + FEE;
    const ok = await act(
      b.id,
      'check-out',
      lateFeeBody(
        TEST_PASSWORD,
        foc(FEE),
        due - FEE > 0
          ? { finalPayment: { type: 'charge', method: 'cash', amountVnd: due - FEE } }
          : {},
      ),
    );
    expect(ok.statusCode, ok.body).toBe(200);
    expect(await totals(b)).toMatchObject({ balanceDueVnd: 0, creditVnd: 0 });
  });

  it('BUG-R2-165 (SEC 12.1 (2), BR-434): an approved FOC 100.000 on the late key (B15 15:00) leaves 692.000 – 692.001 → 422 max 692.000 before the password (wrong = right, 0/0); 692.000 → 200, due 0', async () => {
    const b = await unsellableStay('202', '2030-01-22', '2030-01-24', '2030-01-25');
    await at('2030-01-24T09:00:00+07:00');
    const dry = await act(b.id, 'late-checkout', { checkoutTime: '15:00', dryRun: true });
    expect(dry.statusCode, dry.body).toBe(200);
    const s15 = dry.json().surchargeVnd as number;
    expect(s15).toBeGreaterThan(100_000);
    const late = await act(b.id, 'late-checkout', {
      checkoutTime: '15:00',
      applySurcharge: true,
      expectedSurchargeVnd: s15,
      requestFocForSurcharge: { amountVnd: 100_000, reasonCode: 'regular_vip' },
    });
    expect(late.statusCode, late.body).toBe(200);
    const [req] = await q<{ id: string; status: string }>(
      `SELECT id::text AS id, status FROM approval_request WHERE target_id = $1 AND type = 'foc'`,
      [b.id],
    );
    if (req!.status !== 'approved') {
      const ok = await c.mgr!.send('POST', url(`/approval-requests/${req!.id}/actions/approve`), {
        authMethod: 'password',
        secret: TEST_PASSWORD,
      });
      expect(ok.statusCode, ok.body).toBe(200);
    }
    await at('2030-01-24T19:00:00+07:00');
    expect((await summary(b)).lateFeeAsNightVnd).toBe(FEE);
    const foc = (amountVnd: number) => ({
      requestFoc: { kind: 'foc', amountVnd, reasonCode: 'service_recovery' },
    });
    await resetCounters();
    const a0 = await securityAudits();
    const wrong = await act(b.id, 'check-out', lateFeeBody(WRONG, foc(692_001)));
    const right = await act(b.id, 'check-out', lateFeeBody(TEST_PASSWORD, foc(692_001)));
    for (const r of [wrong, right]) {
      expect(r.statusCode, r.body).toBe(422);
      expect(r.json()).toMatchObject({
        errors: [
          { field: 'lateFeeInsteadOfNight.requestFoc.amountVnd', code: 'VALUE_OUT_OF_RANGE' },
        ],
        max: 692_000,
      });
    }
    expect(await counters()).toEqual({ fd: 0, mgr: 0 });
    expect(await securityAudits()).toBe(a0);
    // The write path takes the same max: the whole 692.000 left is accepted, the late charge nets to 0.
    const before = (await totals(b)).balanceDueVnd;
    const out = await act(
      b.id,
      'check-out',
      lateFeeBody(
        TEST_PASSWORD,
        foc(692_000),
        before - (s15 - 100_000) > 0
          ? {
              finalPayment: { type: 'charge', method: 'cash', amountVnd: before - (s15 - 100_000) },
            }
          : {},
      ),
    );
    expect(out.statusCode, out.body).toBe(200);
    expect(await totals(b)).toMatchObject({ balanceDueVnd: 0, creditVnd: 0 });
  });

  // ───────────────────────────── BUG-R2-167 – a right password always leaves a trace ─────────────────────────────

  it('BUG-R2-167 (SEC 12.3): right password, then B18 refused – 409 BALANCE_DUE, 403 debt by FD, 422 AMOUNT_EXCEEDS_BALANCE, 412 (version moved after the password): each +1 reauth_succeeded (confirmingFor = caller, failedCountCleared) and +1 notification; MGR self: none; success: exactly 1 + 1 + money audit, one requestId', async () => {
    const b = await unsellableStay('203', '2030-03-12', '2030-03-14', '2030-03-15');
    await at('2030-03-14T19:00:00+07:00');
    expect((await summary(b)).lateFeeAsNightVnd).toBe(FEE);
    const due = (await totals(b)).balanceDueVnd + FEE;
    expect(due).toBe(FEE);
    await resetCounters();
    await q('UPDATE app_user SET approval_pin_failed_count = 2 WHERE id = $1', [t.users.mgr!.id]);
    const step = async (
      name: string,
      send: () => Promise<{ statusCode: number; json(): any; body: string }>,
      status: number,
      code: string,
      trace: 0 | 1,
    ) => {
      const a0 = (await succeeded()).length;
      const n0 = await told(b);
      const r = await send();
      expect(r.statusCode, `${name}: ${r.body}`).toBe(status);
      expect(r.json().code, name).toBe(code);
      expect((await succeeded()).length - a0, `${name}: reauth_succeeded`).toBe(trace);
      expect((await told(b)) - n0, `${name}: account_security_change`).toBe(trace);
      expect(await get(b.id), name).toMatchObject({ status: 'in_house' });
      return r;
    };
    const earlier = (await succeeded()).length;
    await step(
      '409 BALANCE_DUE',
      () => act(b.id, 'check-out', lateFeeBody(TEST_PASSWORD)),
      409,
      'BALANCE_DUE',
      1,
    );
    const first = (await succeeded())[earlier]!;
    expect(first.after).toEqual({
      authMethod: 'password',
      confirmingFor: t.users.fd!.id,
      failedCountCleared: 2,
    });
    expect(first.actor).toBe(t.users.fd!.id);
    expect(await counters()).toEqual({ fd: 0, mgr: 0 });
    await step(
      '403 debt by FD',
      () =>
        act(
          b.id,
          'check-out',
          lateFeeBody(
            TEST_PASSWORD,
            {},
            { debt: { dueDate: '2030-03-20', reason: 'Khách nợ tạm' } },
          ),
        ),
      403,
      'FORBIDDEN_ACTION',
      1,
    );
    await step(
      '422 AMOUNT_EXCEEDS_BALANCE',
      () =>
        act(
          b.id,
          'check-out',
          lateFeeBody(
            TEST_PASSWORD,
            {},
            { finalPayment: { type: 'charge', method: 'cash', amountVnd: due + 1 } },
          ),
        ),
      422,
      'VALIDATION_FAILED',
      1,
    );
    // 412 after the password: another transaction moves the version while this B18 waits on the booking lock.
    const v = (await get(b.id)).version as number;
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    let held!: () => void;
    const isHeld = new Promise<void>((r) => (held = r));
    const holder = db.withContext(t.ctx(), async (tx) => {
      await tx.query('UPDATE reservation SET version = version + 1 WHERE id = $1', [b.id]);
      held();
      await gate;
    });
    await isHeld;
    const pending = step(
      '412 after the password',
      () => act(b.id, 'check-out', lateFeeBody(TEST_PASSWORD), 'fd', `"${v}"`),
      412,
      'VERSION_CONFLICT',
      1,
    );
    for (let i = 0; i < 100; i++) {
      const [w] = await q<{ n: number }>(
        `SELECT count(*)::int AS n FROM pg_stat_activity WHERE wait_event_type = 'Lock' AND datname = current_database()`,
      );
      if (Number(w!.n) > 0) break;
      await new Promise((r) => setTimeout(r, 20));
    }
    release();
    await holder;
    await pending;
    const mine = (await succeeded()).slice(earlier);
    expect(mine.length).toBe(4);
    expect(mine.every((a) => a.after.confirmingFor === t.users.fd!.id)).toBe(true);
    expect(mine.slice(1).every((a) => a.after.failedCountCleared === undefined)).toBe(true);
    // A manager confirming their own B18: their session – no trace of this kind (SEC 12.3 (4)).
    const a1 = (await succeeded()).length;
    const n1 = await told(b);
    const self = await act(b.id, 'check-out', lateFeeBody(TEST_PASSWORD, {}, {}, null), 'mgr');
    expect(self.statusCode, self.body).toBe(409);
    expect(self.json().code).toBe('BALANCE_DUE');
    expect((await succeeded()).length).toBe(a1);
    expect(await told(b)).toBe(n1);
    // Success: exactly one notification, one reauth_succeeded and the money audit, joined by requestId.
    const ok = await act(
      b.id,
      'check-out',
      lateFeeBody(
        TEST_PASSWORD,
        {},
        { finalPayment: { type: 'charge', method: 'cash', amountVnd: due } },
      ),
    );
    expect(ok.statusCode, ok.body).toBe(200);
    expect(await told(b)).toBe(n1 + 1);
    const all = await succeeded();
    expect(all.length).toBe(a1 + 1);
    const money = await q<{ requestId: string | null }>(
      `SELECT request_id AS "requestId" FROM audit_event
        WHERE entity_id = $1 AND action = 'reservation.late_fee_instead_of_night'`,
      [b.id],
    );
    expect(money.length).toBe(1);
    expect(money[0]!.requestId).toBeTruthy();
    expect(all[all.length - 1]!.requestId).toBe(money[0]!.requestId);
    expect(all[all.length - 1]!.after).toEqual({
      authMethod: 'password',
      confirmingFor: t.users.fd!.id,
    });
    expect(await totals(b)).toMatchObject({ totalVnd: 2_376_000, balanceDueVnd: 0, creditVnd: 0 });
  });

  // ───────────────────────────── BUG-R2-166 – the same key while the first B18 is still running ─────────────────────────────

  it('BUG-R2-166 (SEC 12.2, accepted): the first B18 holds its key in an open transaction – the same key with a WRONG password is a real failed try (401, counted +1/+1, accepted); with the RIGHT password → 409 IDEMPOTENCY_IN_PROGRESS or the stored 200, nothing counted; the first → 200, folio 2.376.000, written once', async () => {
    const b = await unsellableStay('203', '2030-03-19', '2030-03-21', '2030-03-22');
    await at('2030-03-21T19:00:00+07:00');
    expect((await summary(b)).lateFeeAsNightVnd).toBe(FEE);
    const due = (await totals(b)).balanceDueVnd + FEE;
    await resetCounters();
    const key = randomUUID();
    const v = `"${(await get(b.id)).version}"`;
    const body = (secret: string) =>
      lateFeeBody(secret, {}, { finalPayment: { type: 'charge', method: 'cash', amountVnd: due } });
    const send = (secret: string) =>
      c.fd!.send('POST', url(`/reservations/${b.id}/actions/check-out`), body(secret), {
        'idempotency-key': key,
        'if-match': v,
      });
    const waiting = async (n: number) => {
      for (let i = 0; i < 150; i++) {
        const [w] = await q<{ n: number }>(
          `SELECT count(*)::int AS n FROM pg_stat_activity WHERE wait_event_type = 'Lock' AND datname = current_database()`,
        );
        if (Number(w!.n) >= n) return Number(w!.n);
        await new Promise((r) => setTimeout(r, 20));
      }
      return 0;
    };
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    let held!: () => void;
    const isHeld = new Promise<void>((r) => (held = r));
    const holder = db.withContext(t.ctx(), async (tx) => {
      await tx.query('SELECT id FROM reservation WHERE id = $1 FOR UPDATE', [b.id]);
      held();
      await gate;
    });
    await isHeld;
    const first = send(TEST_PASSWORD);
    expect(await waiting(1)).toBeGreaterThan(0);
    // Accepted (SEC 12.2): the key in progress is not visible yet – a wrong password is a real failed try.
    const wrong = await send(WRONG);
    expect(wrong.statusCode, wrong.body).toBe(401);
    expect(wrong.json().code).toBe('REAUTH_FAILED');
    expect(await counters()).toEqual({ fd: 1, mgr: 1 });
    await resetCounters();
    const right = send(TEST_PASSWORD);
    await waiting(2);
    release();
    await holder;
    const r1 = await first;
    const r2 = await right;
    expect(r1.statusCode, r1.body).toBe(200);
    const second =
      r2.statusCode === 200
        ? [200, r2.headers['idempotent-replayed']]
        : [r2.statusCode, r2.json().code];
    expect([
      [200, 'true'],
      [409, 'IDEMPOTENCY_IN_PROGRESS'],
    ]).toContainEqual(second);
    expect(await counters()).toEqual({ fd: 0, mgr: 0 });
    expect(await totals(b)).toMatchObject({ totalVnd: 2_376_000, balanceDueVnd: 0, creditVnd: 0 });
    const written = await q<{ n: number }>(
      `SELECT count(*)::int AS n FROM folio_line WHERE folio_id = $1 AND charge_code = 'late_fee_as_night'`,
      [b.folioId],
    );
    expect(Number(written[0]!.n)).toBe(1);
    const money = await q(
      `SELECT 1 FROM audit_event WHERE entity_id = $1 AND action = 'reservation.late_fee_instead_of_night'`,
      [b.id],
    );
    expect(money.length).toBe(1);
  });
});
