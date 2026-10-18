/**
 * BE-B – G-4 / BR-525 v0.3.8 (DOM 18/10, BUG-R2-200, oracle BR-525-01): `reversePayment` on a checked-out stay
 * whose folio is `settled` and now owes money records the debt in the SAME transaction through
 * `ReservationHooks.debtAfterReversal` (front desk – BE-A: `checkout_mode = debt`, reason, due date, `debt_recorded`
 * to OWN + MGR, "Cần chú ý" `checkout_debt`), only when the reversal raised what is owed; no `post_checkout` line,
 * folio and bill unchanged; due ≤ 0 → no debt. An overpayment that fell below the open refund requests runs refundPlan again
 * (BR-522). Lock order ARC 16.19 (stay bookings L1 → folio L3 → payment / refund requests L4) proven by races
 * whose money and debt calls equal the same steps run one after the other, in both orders – including the refund
 * decision (preLock `refund` → folio, BUG-R2-198). Real B18 through HTTP; BE-A's real debt handler runs behind a
 * spy that records what payments hands over and what the folio looks like inside that call. Fake clock and FAKE
 * data only.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { v7 as uuidv7 } from 'uuid';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { Database, Tx } from '../../src/db/database';
import { ApprovalService } from '../../src/modules/approvals/public/approval.service';
import { FolioService } from '../../src/modules/folio/public/folio.service';
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
import {
  type DebtAfterReversalHandler,
  type DebtAfterReversalInput,
  type DebtAfterReversalResult,
  ReservationHooks,
} from '../../src/modules/reservations/public/reservation-hooks';
import { sha256Hex } from '../../src/shared/http/auth.guard';
import { addDays } from '../../src/shared/time';
import {
  Client,
  type FeatureApp,
  type LightMyRequestResponse,
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

/**
 * Spy in front of the front desk's debt handler: records what reversePayment hands over, what the folio looks
 * like inside that call (status, post-checkout lines, balance in the reversal's own transaction) and the answer.
 */
class DebtSpy {
  folios?: FolioService;
  real: DebtAfterReversalHandler | null = null;
  /** Test hook: throw after the real handler wrote (the reversal must roll back with it). */
  failAfter = false;
  calls: Array<
    DebtAfterReversalInput & {
      folioStatus: string;
      postCheckoutLines: number;
      dueInTxVnd: number;
      result: DebtAfterReversalResult;
    }
  > = [];
  readonly handler: DebtAfterReversalHandler = async (tx: Tx, input) => {
    const { rows } = await tx.query<{ status: string; pc: number }>(
      `SELECT f.status, (SELECT count(*)::int FROM folio_line l
                          WHERE l.folio_id = f.id AND l.post_checkout) AS pc
         FROM folio f WHERE f.id = $1`,
      [input.folioId],
    );
    const dueInTxVnd = (await this.folios!.balance(tx, input.folioId)).balanceDueVnd;
    if (!this.real) throw new Error('front desk debt handler not bound (BE-A)');
    const result = await this.real(tx, input);
    this.calls.push({
      ...input,
      folioStatus: rows[0]!.status,
      postCheckoutLines: rows[0]!.pc,
      dueInTxVnd,
      result,
    });
    if (this.failAfter) throw new Error('test: failure after the debt was written');
    return result;
  };
}

/** Oracle BR-525-01 (QA `tests/fixtures/br-examples.json`, DOM 18/10 G-4). */
const BR525 = (
  JSON.parse(
    readFileSync(join(__dirname, '../../../../tests/fixtures/br-examples.json'), 'utf8'),
  ) as { examples: Array<{ id: string; pendingFix?: string; input: any; expected: any }> }
).examples.find((x) => x.id === 'BR-525-01')!;

// mgr reverses; mgr2 is the other manager the debt is told to (BR-525: OWN + MGR, never the one who reversed).
const ROLES = {
  mgr: ['manager'],
  mgr2: ['manager'],
  fd: ['front_desk'],
  owner: ['owner'],
  sal: ['sales_staff'],
};
const ROOMS = ['101', '102', '103', '201', '202', '203', '301', '302'];
/** The transfer of the oracle's B18 money (900.000 cash + 100.000 transfer) – the receipt reversed. */
const TRANSFER: number = BR525.input.b18PaymentsVnd.bankTransfer;

type Booking = { id: string; code: string; version: number; folioId: string };
type Stay = Booking & { transferId: string; cashId: string; cashVnd: number; billNo: string };
type Res = LightMyRequestResponse;

describe.skipIf(!HAS_DB)('G-4 / BR-525 – reversal after check-out records the debt (BE-B)', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let ids: BookingIds;
  let guest: string;
  const debt = new DebtSpy();
  const c: Record<string, Client> = {};

  beforeAll(async () => {
    db = appDatabase(10);
    t = await createTenant(db, { users: ROLES });
    ids = await seedBooking(db, t);
    guest = await seedGuestRow(db, t, { name: 'Khách Công Nợ' });
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
    await setPassword(db, t, 'mgr');
    await setPassword(db, t, 'owner');
    debt.folios = fa.app.get(FolioService);
    const hooks = fa.app.get(ReservationHooks);
    // The handler the front desk module bound at init (BE-A) – kept behind the spy.
    debt.real = (
      hooks as unknown as { debtAfterReversalHandler: DebtAfterReversalHandler | null }
    ).debtAfterReversalHandler;
    hooks.provideDebtAfterReversal(debt.handler);
  });
  afterAll(async () => {
    await fa?.close();
    await db?.close();
  });
  beforeEach(() => {
    debt.calls = [];
    debt.failAfter = false;
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
  const pay = async (folioId: string, body: Record<string, unknown>, who = 'fd') =>
    c[who]!.send('POST', url(`/folios/${folioId}/payments`), body);
  const reverse =
    (paymentId: string, reason = 'Chuyển khoản không về') =>
    () =>
      c.mgr!.send('POST', url(`/payments/${paymentId}/actions/reverse`), { reason });

  let seq = 0;
  /**
   * A direct 2-night stay, paid in full at check-in (a transfer of 100.000 + cash for the rest), checked out at
   * the desk (B18 – folio `settled`, bill number, due 0). Every call uses its own room/dates.
   */
  const checkedOutStay = async (
    beforeCheckout?: (b: Booking) => Promise<void>,
    opts: { closer?: boolean } = {},
  ): Promise<Stay & { departure: string }> => {
    const k = seq++;
    const roomNo = ROOMS[k % ROOMS.length]!;
    const arrival = addDays('2026-11-02', 3 * Math.floor(k / ROOMS.length));
    const departure = addDays(arrival, 2);
    await at('2026-10-20T10:00:00+07:00');
    const body = {
      roomId: ids.rooms[roomNo],
      channelId: ids.channels.direct,
      // A sale closed it (3 % staff commission, BR-903) – or a phone booking without commission.
      ...(opts.closer
        ? { directSource: 'sales_staff', closerUserId: t.users.sal!.id }
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
    const b = res.json() as Booking;
    await at(`${arrival}T15:00:00+07:00`);
    // A room re-used by an earlier case of this file is cleaned (its B18 left it VD).
    await q(`UPDATE room_status SET status = 'VC' WHERE room_id = $1`, [ids.rooms[roomNo]]);
    const due = (await folio(b.folioId)).totals.balanceDueVnd as number;
    expect(due).toBeGreaterThan(TRANSFER);
    const tr = await pay(b.folioId, {
      type: 'charge',
      method: 'bank_transfer',
      amountVnd: TRANSFER,
    });
    expect(tr.statusCode, tr.body).toBe(201);
    const cash = await pay(b.folioId, {
      type: 'charge',
      method: 'cash',
      amountVnd: due - TRANSFER,
    });
    expect(cash.statusCode, cash.body).toBe(201);
    const ci = await act(b.id, 'check-in', {
      cardsIssued: 1,
      houseRulesSent: true,
      checkinTime: '15:00',
    });
    expect(ci.statusCode, ci.body).toBe(200);
    await at(`${departure}T10:00:00+07:00`);
    await beforeCheckout?.(b);
    await at(`${departure}T11:00:00+07:00`);
    const out = await act(b.id, 'check-out', { checkoutTime: '11:00' });
    expect(out.statusCode, out.body).toBe(200);
    const f = await folio(b.folioId);
    expect(f).toMatchObject({ status: 'settled' });
    // Folio.totals.creditVnd = the overpayment (routed to a refund request by `beforeCheckout` or none).
    expect(f.totals).toMatchObject({
      balanceDueVnd: 0,
      ...(beforeCheckout ? {} : { creditVnd: 0 }),
    });
    await at(`${departure}T15:00:00+07:00`);
    return {
      ...b,
      transferId: tr.json().id,
      cashId: cash.json().id,
      cashVnd: due - TRANSFER,
      billNo: f.billNo,
      departure,
    };
  };

  /**
   * Money, debt calls and refund requests of a stay – the oracle compared between runs. Runs use different rooms
   * (different prices): the cash receipt of the stay reads `cash`, cash + the 100.000 transfer `cash+transfer`.
   */
  const outcome = async (s: Stay) => {
    const sym = (v: number): number | string =>
      v === s.cashVnd ? 'cash' : v === s.cashVnd + TRANSFER ? 'cash+transfer' : v;
    const f = await folio(s.folioId);
    const refunds = await q(
      `SELECT status, amount_vnd::int AS amount, auto_cancel_reason AS reason FROM approval_request
        WHERE type = 'refund' AND target_id = $1 ORDER BY amount_vnd DESC, status`,
      [s.id],
    );
    const [r] = await q(
      `SELECT checkout_mode AS mode, debt_reason AS reason, debt_due_date::text AS due,
              debt_settled_at IS NOT NULL AS settled
         FROM reservation WHERE id = $1`,
      [s.id],
    );
    return {
      folioStatus: f.status as string,
      dueVnd: sym(f.totals.balanceDueVnd),
      creditVnd: f.totals.creditVnd as number,
      // Each debt recorded: [what this reversal added, what the folio owed in that transaction].
      debt: debt.calls
        .filter((x) => x.folioId === s.folioId)
        .map((x) => [sym(x.result.debtVnd), sym(x.dueInTxVnd)]),
      checkoutMode: r.mode as string,
      debtReason: r.reason as string | null,
      debtDue: r.due as string | null,
      debtSettled: r.settled as boolean,
      refunds,
      commissions: (await commissions(s)).map((x) => x.status),
    };
  };
  const commissions = (s: Booking) =>
    q(
      `SELECT status, amount_vnd::int AS amount, recognized_at FROM commission
        WHERE reservation_id = $1 AND status <> 'void' ORDER BY id`,
      [s.id],
    );
  const lineCount = async (folioId: string) =>
    Number(
      (await q('SELECT count(*)::int AS n FROM folio_line WHERE folio_id = $1', [folioId]))[0].n,
    );

  /**
   * The steps queue behind a row lock held on a connection of its own (the folio, in the tenant's context): each
   * step starts once every earlier one waits on the holder (directly or behind a transaction that does), then the
   * holder rolls back and they run in that order.
   */
  const interleavedBehindFolio = async (
    folioId: string,
    steps: Array<() => Promise<Res>>,
  ): Promise<Res[]> => {
    await Promise.all(
      Array.from({ length: steps.length + 1 }, () =>
        db.withContext(t.ctx(), (tx) => tx.query('SELECT 1')),
      ),
    );
    const holder = await db.pool.connect();
    const pending: Array<Promise<Res>> = [];
    try {
      await holder.query('BEGIN');
      await holder.query(
        `SELECT set_config('app.organization_id', $1, true), set_config('app.property_id', $2, true)`,
        [t.organizationId, t.propertyIds[0]],
      );
      await holder.query('SELECT id FROM folio WHERE id = $1 FOR UPDATE', [folioId]);
      const pid = (await holder.query<{ pid: number }>('SELECT pg_backend_pid() AS pid')).rows[0]!
        .pid;
      const waiting = async () =>
        (
          await holder.query<{ n: number }>(
            `WITH RECURSIVE w(pid) AS (
               SELECT a.pid FROM pg_stat_activity a WHERE $1 = ANY (pg_blocking_pids(a.pid))
               UNION
               SELECT a.pid FROM pg_stat_activity a JOIN w ON w.pid = ANY (pg_blocking_pids(a.pid)))
             SELECT count(*)::int AS n FROM w`,
            [pid],
          )
        ).rows[0]!.n;
      for (const step of steps) {
        pending.push(step());
        const until = Date.now() + 3_000;
        while ((await waiting()) < pending.length) {
          if (Date.now() > until) {
            const done = await Promise.race([
              pending[pending.length - 1]!.then((r) => `${r.statusCode} ${r.body}`),
              new Promise<string>((r) => setTimeout(() => r('pending'), 50)),
            ]);
            throw new Error(`step ${pending.length} never waited (${done})`);
          }
          await new Promise((r) => setTimeout(r, 20));
        }
      }
    } finally {
      await holder.query('ROLLBACK');
      holder.release();
    }
    return Promise.all(pending);
  };
  const inSequence = async (steps: Array<() => Promise<Res>>): Promise<Res[]> => {
    const out: Res[] = [];
    for (const s of steps) out.push(await s());
    return out;
  };

  it('BR-525-01 (oracle): MGR reverses the transfer after B18 → in the same transaction a debt of exactly the amount due (checkout_mode debt, reason = reversal reason, default due date), OWN + MGR told (not the reverser), "Cần chú ý" checkout_debt open; no post_checkout line, folio settled, bill unchanged; the guest pays → debt closed, item gone; due ≤ 0 after a reversal → no debt', async () => {
    const o1 = BR525;
    expect(o1.pendingFix).toBeUndefined();
    const ex = o1.expected.afterReversal;
    const reason: string = o1.input.reversal.reason;
    const s = await checkedOutStay();
    expect(s.cashVnd + TRANSFER).toBeGreaterThan(0); // B18 left due 0 (checked in checkedOutStay)
    const lines = await lineCount(s.folioId);
    const fdTry = await c.fd!.send('POST', url(`/payments/${s.transferId}/actions/reverse`), {
      reason,
    });
    expect(fdTry.statusCode).toBe(403); // MGR+ only
    const r = await reverse(s.transferId, reason)();
    expect(r.statusCode, r.body).toBe(200);
    expect(r.json().status).toBe('reversed');
    expect(debt.calls).toHaveLength(1);
    expect(debt.calls[0]).toMatchObject({
      folioId: s.folioId,
      paymentId: s.transferId,
      reason,
      // Inside the call (same transaction): the reversal is written, the folio still settled, no post-checkout line.
      dueInTxVnd: ex.amountDueVnd,
      folioStatus: ex.folioStatus,
      postCheckoutLines: ex.postCheckoutLines,
      dueBeforeVnd: 0,
      result: {
        recorded: true,
        reservationId: s.id,
        debtVnd: ex.debtVnd,
        balanceDueVnd: ex.amountDueVnd,
      },
    });
    const o = await outcome(s);
    expect(o).toMatchObject({
      folioStatus: ex.folioStatus,
      dueVnd: ex.amountDueVnd,
      creditVnd: 0,
      checkoutMode: 'debt',
      debtReason: ex.debtReason,
    });
    expect(o.debtDue! > s.departure).toBe(true); // "hạn công nợ mặc định" – after the business day
    expect((await folio(s.folioId)).billNo).toBe(s.billNo); // invoiceUnchanged
    expect(await lineCount(s.folioId)).toBe(lines);
    const [audit] = await q(
      `SELECT after FROM audit_event WHERE action = 'payment.reversed' AND entity_id = $1`,
      [s.transferId],
    );
    expect(audit.after).toMatchObject({ amountVnd: -TRANSFER, debtVnd: ex.debtVnd });
    const told = await q(
      `SELECT n.user_id FROM staff_notification n WHERE n.kind = 'debt_recorded' AND n.ref_id = $1
        ORDER BY n.user_id`,
      [s.id],
    );
    const roleOf = (id: string) =>
      Object.entries(t.users).find(([, u]) => u.id === id)![1].roles[0];
    expect(told.map((x) => roleOf(x.user_id)).sort()).toEqual([...ex.notified].sort());
    expect(told.map((x) => x.user_id)).not.toContain(t.users.mgr!.id);
    const attention = async () =>
      ((await c.mgr2!.get(url('/attention'))).json().data as any[]).filter(
        (i) => i.kind === 'checkout_debt',
      );
    expect(JSON.stringify(await attention()).includes(s.code)).toBe(ex.attentionOpen);

    // The guest pays the amount back (FD records it on the settled folio) → debt closed, item gone, no new call.
    const back = await pay(s.folioId, {
      type: 'charge',
      method: 'cash',
      amountVnd: o1.input.thenGuestPaysVnd,
    });
    expect(back.statusCode, back.body).toBe(201);
    const paid = o1.expected.afterGuestPays;
    expect((await folio(s.folioId)).totals).toMatchObject({
      balanceDueVnd: paid.debtVnd,
      creditVnd: 0,
    });
    expect(JSON.stringify(await attention()).includes(s.code)).toBe(paid.attentionOpen);
    // noDebtWhenDueNotPositive: an extra receipt (credit 50.000) reversed → due 0 after the reversal → no debt.
    expect(o1.expected.noDebtWhenDueNotPositive).toBe(true);
    const extra = await pay(s.folioId, {
      type: 'charge',
      method: 'cash',
      amountVnd: 50_000,
      note: 'Khách trả dư',
    });
    expect(extra.statusCode, extra.body).toBe(201);
    expect((await reverse(extra.json().id, 'Ghi nhầm số tiền')()).statusCode).toBe(200);
    expect(debt.calls).toHaveLength(1);
    expect((await folio(s.folioId)).totals).toMatchObject({ balanceDueVnd: 0, creditVnd: 0 });
  });

  it('a stay already owing: a second reversal adds only its increase to the debt (reason and due date of the first kept)', async () => {
    const s = await checkedOutStay();
    expect((await reverse(s.transferId)()).statusCode).toBe(200);
    expect((await reverse(s.cashId, 'Tiền giả')()).statusCode).toBe(200);
    const o = await outcome(s);
    // DOM 18/10: each debt = only what that reversal added (max(0, after) − max(0, before)).
    expect(o.debt).toEqual([
      [100_000, 100_000],
      ['cash', 'cash+transfer'],
    ]);
    expect((await folio(s.folioId)).totals.balanceDueVnd).toBe(100_000 + s.cashVnd);
    expect(o).toMatchObject({
      dueVnd: 'cash+transfer',
      checkoutMode: 'debt',
      debtReason: 'Chuyển khoản không về',
    });
  });

  it('same transaction: the debt handler fails after writing → the reversal is rolled back with it (500; no reversal row, no debt, no notification)', async () => {
    const s = await checkedOutStay();
    debt.failAfter = true;
    const r = await reverse(s.transferId)();
    expect(r.statusCode).toBe(500);
    expect(debt.calls).toHaveLength(1); // the handler did write – inside the reversal's transaction
    expect(await q('SELECT 1 FROM payment WHERE reversal_of_id = $1', [s.transferId])).toEqual([]);
    expect((await q('SELECT status FROM payment WHERE id = $1', [s.transferId]))[0].status).toBe(
      'succeeded',
    );
    const o = await outcome(s);
    expect(o).toMatchObject({ dueVnd: 0, checkoutMode: 'desk', debtReason: null });
    expect(
      await q(`SELECT 1 FROM staff_notification WHERE kind = 'debt_recorded' AND ref_id = $1`, [
        s.id,
      ]),
    ).toEqual([]);
  });

  /**
   * Before B18: two extra cash receipts (120.000 + 80.000 – credit 200.000) and FD's refund request of 200.000
   * (in house – a settled folio takes no new request); B18 leaves it open (credit already routed).
   */
  const withOpenRefund = async () => {
    let small = '';
    let requestId = '';
    const s = await checkedOutStay(async (b) => {
      const x = await pay(b.folioId, {
        type: 'charge',
        method: 'cash',
        amountVnd: 120_000,
        note: 'Thu dư',
      });
      const y = await pay(b.folioId, {
        type: 'charge',
        method: 'cash',
        amountVnd: 80_000,
        note: 'Thu dư',
      });
      expect([x.statusCode, y.statusCode]).toEqual([201, 201]);
      small = y.json().id;
      const req = await c.fd!.send('POST', url(`/folios/${b.folioId}/refund-requests`), {
        amountVnd: 200_000,
        reason: 'Trả dư tiền phòng',
      });
      expect(req.statusCode, req.body).toBe(201);
      requestId = req.json().id;
    });
    const version = Number(
      (await q('SELECT version FROM approval_request WHERE id = $1', [requestId]))[0].version,
    );
    return { s, small, requestId, version };
  };

  it('BR-522 / BR-525: the reversal leaves 120.000 overpaid under a pending request of 200.000 → refundPlan again: the request auto-cancelled (superseded), one request of 120.000; no debt', async () => {
    const { s, small } = await withOpenRefund();
    expect((await reverse(small, 'Ghi trùng')()).statusCode).toBe(200);
    const o = await outcome(s);
    expect(o.debt).toEqual([]);
    expect(o.refunds).toEqual([
      { status: 'cancelled', amount: 200_000, reason: 'superseded' },
      { status: 'pending', amount: 120_000, reason: null },
    ]);
    expect(o).toMatchObject({ dueVnd: 0, creditVnd: 120_000, folioStatus: 'settled' });
  });

  it("BR-903 / BR-525 G-4 (3): the sale's commission earned at B18 goes back to projected when a reversal leaves money owed, and is earned again on the day the debt is paid; payable → projected; paid is never touched", async () => {
    const s = await checkedOutStay(undefined, { closer: true });
    const [earned] = await commissions(s);
    expect(earned).toMatchObject({ status: 'earned' });
    expect(new Date(earned.recognized_at).toISOString()).toBe(
      new Date(`${s.departure}T11:00:00+07:00`).toISOString(),
    );
    // Reversed later that day → owed again: projected, no recognition date.
    expect((await reverse(s.transferId)()).statusCode).toBe(200);
    expect(await commissions(s)).toEqual([
      { status: 'projected', amount: earned.amount, recognized_at: null },
    ]);
    const [audit] = await q(
      `SELECT before, after, reason FROM audit_event
        WHERE action = 'commission.projected' AND entity_type = 'commission' AND before IS NOT NULL
          AND entity_code = $1`,
      [s.code],
    );
    expect(audit).toMatchObject({
      before: { status: 'earned' },
      after: { status: 'projected' },
      reason: 'Chuyển khoản không về',
    });
    // The guest pays the next morning → earned again, dated then. (Inside the 24-hour post-checkout window: a
    // receipt on a settled folio after it is 409 FOLIO_LOCKED today – reported to ORC/DOM, not changed here.)
    await at(`${addDays(s.departure, 1)}T10:00:00+07:00`);
    expect(
      (await pay(s.folioId, { type: 'charge', method: 'cash', amountVnd: TRANSFER })).statusCode,
    ).toBe(201);
    const [again] = await commissions(s);
    expect(again).toMatchObject({ status: 'earned', amount: earned.amount });
    expect(new Date(again.recognized_at).toISOString()).toBe(
      new Date(`${addDays(s.departure, 1)}T10:00:00+07:00`).toISOString(),
    );

    // payable (monthly run, R3) → projected as well; paid stays paid (R2 never takes it back).
    const s2 = await checkedOutStay(undefined, { closer: true });
    await q(`UPDATE commission SET status = 'payable' WHERE reservation_id = $1`, [s2.id]);
    expect((await reverse(s2.transferId)()).statusCode).toBe(200);
    expect((await commissions(s2)).map((x) => x.status)).toEqual(['projected']);
    expect(
      (await pay(s2.folioId, { type: 'charge', method: 'cash', amountVnd: TRANSFER })).statusCode,
    ).toBe(201);
    expect((await commissions(s2)).map((x) => x.status)).toEqual(['earned']);
    await q(`UPDATE commission SET status = 'paid' WHERE reservation_id = $1`, [s2.id]);
    expect((await reverse(s2.cashId, 'Tiền giả')()).statusCode).toBe(200);
    expect((await folio(s2.folioId)).totals.balanceDueVnd).toBeGreaterThan(0);
    expect((await commissions(s2)).map((x) => x.status)).toEqual(['paid']);
  });

  // ───────────── ARC 16.26: collecting the debt after check-out (recordPayment, debt branch) ─────────────

  /** FD collects on the stay's folio (settled after its window / closed) – the debt branch of recordPayment. */
  const collect =
    (s: Booking, amountVnd: number, method = 'cash', who = 'fd') =>
    () =>
      pay(s.folioId, { type: 'charge', method, amountVnd }, who);

  it('ARC 16.26 / ORC example: commission earned at B18 (D), receipt reversed D+1, the guest pays D+3 (window over) → 201 debt collection: debt closed, "Cần chú ý" gone, folio and bill unchanged, commission earned again on D+3; over the due → 422 max, deposit → 422, sale → 403; no debt → 409', async () => {
    const s = await checkedOutStay(undefined, { closer: true });
    expect((await commissions(s)).map((x) => x.status)).toEqual(['earned']);
    await at(`${addDays(s.departure, 1)}T10:00:00+07:00`);
    expect((await reverse(s.transferId)()).statusCode).toBe(200);
    expect((await commissions(s)).map((x) => x.status)).toEqual(['projected']);
    await at(`${addDays(s.departure, 3)}T10:00:00+07:00`);
    const lines = await lineCount(s.folioId);
    const over = await pay(s.folioId, {
      type: 'charge',
      method: 'cash',
      amountVnd: TRANSFER + 1_000,
      note: 'Khách trả dư',
    });
    expect(over.statusCode).toBe(422);
    expect(over.json()).toMatchObject({
      errors: [{ field: 'amountVnd', code: 'AMOUNT_EXCEEDS_BALANCE' }],
      max: TRANSFER,
    });
    const dep = await pay(s.folioId, { type: 'deposit', method: 'cash', amountVnd: 1_000 });
    expect(dep.json().errors).toEqual([{ field: 'type', code: 'NOT_IN_LIST' }]);
    expect((await collect(s, 1_000, 'cash', 'sal')()).statusCode).toBe(403);
    const ok = await collect(s, TRANSFER)();
    expect(ok.statusCode, ok.body).toBe(201);
    const o = await outcome(s);
    expect(o).toMatchObject({
      folioStatus: 'settled',
      dueVnd: 0,
      creditVnd: 0,
      checkoutMode: 'debt',
      debtSettled: true,
      commissions: ['earned'],
    });
    expect((await folio(s.folioId)).billNo).toBe(s.billNo);
    expect(await lineCount(s.folioId)).toBe(lines);
    const [c1] = await commissions(s);
    expect(new Date(c1.recognized_at).toISOString()).toBe(
      new Date(`${addDays(s.departure, 3)}T10:00:00+07:00`).toISOString(),
    );
    const [audit] = await q(
      `SELECT after FROM audit_event WHERE action = 'payment.recorded' AND entity_id = $1`,
      [ok.json().id],
    );
    expect(audit.after).toMatchObject({ amountVnd: TRANSFER, debtCollection: true });
    const attention = ((await c.mgr2!.get(url('/attention'))).json().data as any[]).filter(
      (i) => i.kind === 'checkout_debt',
    );
    expect(JSON.stringify(attention)).not.toContain(s.code);
    // Debt closed: the settled folio past its window takes no receipt any more.
    expect((await collect(s, 1_000)()).json().code).toBe('FOLIO_LOCKED');
  });

  it('DOM 18/10 (BR-525 / BR-903): debt 100.000 paid 60.000 cash (debt open, 40.000 left, due date kept) + 40.000 transfer (debt closed) → commission earned only when the transfer is reconciled (D+4)', async () => {
    const s = await checkedOutStay(undefined, { closer: true });
    await at(`${addDays(s.departure, 1)}T10:00:00+07:00`);
    expect((await reverse(s.transferId)()).statusCode).toBe(200);
    const opened = await outcome(s);
    await at(`${addDays(s.departure, 3)}T10:00:00+07:00`);
    expect((await collect(s, 60_000)()).statusCode).toBe(201);
    expect(await outcome(s)).toMatchObject({
      dueVnd: 40_000,
      checkoutMode: 'debt',
      debtSettled: false,
      debtDue: opened.debtDue,
      commissions: ['projected'],
    });
    const tr = await collect(s, 40_000, 'bank_transfer')();
    expect(tr.statusCode, tr.body).toBe(201);
    expect(tr.json().reconciliation).toBe('pending');
    expect(await outcome(s)).toMatchObject({
      dueVnd: 0,
      debtSettled: true,
      commissions: ['projected'],
    });
    await at(`${addDays(s.departure, 4)}T09:00:00+07:00`);
    const rec = await c.mgr!.send(
      'POST',
      url(`/payments/${tr.json().id}/actions/reconcile`),
      { result: 'reconciled' },
      { 'if-match': `"${tr.json().version}"` },
    );
    expect(rec.statusCode, rec.body).toBe(200);
    const [cm] = await commissions(s);
    expect(cm.status).toBe('earned');
    expect(new Date(cm.recognized_at).toISOString()).toBe(
      new Date(`${addDays(s.departure, 4)}T09:00:00+07:00`).toISOString(),
    );
  });

  // ───────────── races (ARC 16.19): each forced order = the same steps one after the other ─────────────

  const pairs: Array<{
    name: string;
    setup: () => Promise<{ s: Stay; steps: Array<() => Promise<Res>> }>;
  }> = [
    {
      name: "reverse the transfer ‖ the guest pays 100.000 (FD, with a note) – the sale's commission",
      setup: async () => {
        const s = await checkedOutStay(undefined, { closer: true });
        return {
          s,
          steps: [
            reverse(s.transferId),
            () =>
              pay(s.folioId, {
                type: 'charge',
                method: 'cash',
                amountVnd: 100_000,
                note: 'Khách chuyển lại',
              }),
          ],
        };
      },
    },
    {
      name: 'reverse the transfer ‖ reverse the cash (two managers)',
      setup: async () => {
        const s = await checkedOutStay();
        return { s, steps: [reverse(s.transferId), reverse(s.cashId, 'Tiền giả')] };
      },
    },
    {
      name: 'reverse 80.000 ‖ MGR approves the pending refund of 200.000 (preLock refund → folio, BUG-R2-198)',
      setup: async () => {
        const { s, small, requestId, version } = await withOpenRefund();
        return {
          s,
          steps: [
            reverse(small, 'Ghi trùng'),
            () =>
              c.mgr!.send('POST', url(`/approval-requests/${requestId}/actions/approve`), {
                expectedVersion: version,
                authMethod: 'password',
                secret: TEST_PASSWORD,
              }),
          ],
        };
      },
    },
  ];

  /** A checked-out stay (sale's commission) whose transfer was reversed the next day – debt 100.000, window over. */
  const inDebt = async () => {
    const s = await checkedOutStay(undefined, { closer: true });
    await at(`${addDays(s.departure, 1)}T10:00:00+07:00`);
    expect((await reverse(s.transferId)()).statusCode).toBe(200);
    await at(`${addDays(s.departure, 3)}T10:00:00+07:00`);
    return s;
  };
  pairs.push(
    {
      name: 'ARC 16.26: two desks collect the debt of 100.000 at once (one 201, the other 409 – debt closed)',
      setup: async () => {
        const s = await inDebt();
        return { s, steps: [collect(s, TRANSFER), collect(s, TRANSFER)] };
      },
    },
    {
      name: 'ARC 16.26: collect the debt of 100.000 ‖ MGR reverses the cash receipt',
      setup: async () => {
        const s = await inDebt();
        return { s, steps: [collect(s, TRANSFER), reverse(s.cashId, 'Tiền giả')] };
      },
    },
  );

  for (const pair of pairs) {
    it(`race: ${pair.name} – both orders equal the sequence (money, debt, refunds, statuses), no 500 / deadlock`, async () => {
      for (const order of [
        [0, 1],
        [1, 0],
      ] as const) {
        const seqRun = await pair.setup();
        const seqRes = await inSequence(order.map((i) => seqRun.steps[i]!));
        const expected = await outcome(seqRun.s);
        const raceRun = await pair.setup();
        const raceRes = await interleavedBehindFolio(
          raceRun.s.folioId,
          order.map((i) => raceRun.steps[i]!),
        );
        expect(raceRes.map((r) => r.statusCode)).toEqual(seqRes.map((r) => r.statusCode));
        for (const r of raceRes) expect(r.statusCode, r.body).toBeLessThan(500);
        const got = await outcome(raceRun.s);
        expect(got).toEqual(expected);
        // Money oracle: each debt recorded is exactly what the folio owed in that transaction.
        for (const call of debt.calls.filter((x) => x.folioId === raceRun.s.folioId)) {
          expect(call.result).toMatchObject({
            recorded: true,
            balanceDueVnd: call.dueInTxVnd,
            debtVnd: call.dueInTxVnd - call.dueBeforeVnd,
          });
        }
      }
    });
  }

  // ───────────── BUG-R2-198 (ARC 16.19 bổ sung 4): preLock per type, refund → folio before the request ─────────────

  /**
   * Types whose onDecided writes outside approvals and whose typed preLock is still owed. Empty since 18/10: BE-A
   * declared late_checkout_conflict / no_show_restore by type, sales (BE-B) quote_extension (the quote before the
   * request – sales.test). It stays empty: a NEW type with an onDecided and no typed preLock fails here.
   */
  const PRELOCK_OWED: Record<string, string> = {};

  it('BUG-R2-198 structure: every request type with an onDecided declares its preLock by type (the owed list is empty)', () => {
    const hooks = fa.app.get(ApprovalService).decisionHooks();
    const byType = Object.fromEntries(hooks.map((h) => [h.type, h.preLock]));
    expect(byType).toMatchObject({
      refund: true,
      foc: true,
      special_discount: true,
      damage_pricing: true,
      late_checkout_conflict: true,
      no_show_restore: true,
      quote_extension: true,
    });
    expect(PRELOCK_OWED).toEqual({});
    const missing = hooks.filter((h) => !h.preLock).map((h) => h.type);
    for (const type of missing)
      expect(Object.keys(PRELOCK_OWED), `${type} has no typed preLock`).toContain(type);
  });

  it('BUG-R2-198 refund: approve / reject / cancel take the folio (L3) BEFORE the request row (L4) – while a transaction holds the folio the decision waits and the request row is still free; then it completes', async () => {
    const requestFree = (approvalId: string) =>
      db.withContext(t.ctx(), async (tx) => {
        try {
          await tx.query('SELECT id FROM approval_request WHERE id = $1 FOR UPDATE NOWAIT', [
            approvalId,
          ]);
          return true;
        } catch {
          return false;
        }
      });
    const decide: Record<string, (id: string, version: number) => Promise<Res>> = {
      approve: (id, v) =>
        c.mgr!.send('POST', url(`/approval-requests/${id}/actions/approve`), {
          expectedVersion: v,
          authMethod: 'password',
          secret: TEST_PASSWORD,
        }),
      reject: (id, v) =>
        c.mgr!.send('POST', url(`/approval-requests/${id}/actions/reject`), {
          expectedVersion: v,
          authMethod: 'password',
          secret: TEST_PASSWORD,
          reason: 'Khách đổi ý',
        }),
      cancel: (id, v) =>
        c.fd!.send('POST', url(`/approval-requests/${id}/actions/cancel`), { expectedVersion: v }),
    };
    for (const [name, run] of Object.entries(decide)) {
      const { s, requestId, version } = await withOpenRefund();
      const holder = await db.pool.connect();
      let pending: Promise<Res> | undefined;
      try {
        await holder.query('BEGIN');
        await holder.query(
          `SELECT set_config('app.organization_id', $1, true), set_config('app.property_id', $2, true)`,
          [t.organizationId, t.propertyIds[0]],
        );
        await holder.query('SELECT id FROM folio WHERE id = $1 FOR UPDATE', [s.folioId]);
        const pid = (await holder.query<{ pid: number }>('SELECT pg_backend_pid() AS pid')).rows[0]!
          .pid;
        pending = run(requestId, version);
        let waits = 0;
        for (let i = 0; i < 200 && waits === 0; i += 1) {
          waits = (
            await holder.query<{ n: number }>(
              'SELECT count(*)::int AS n FROM pg_stat_activity WHERE $1 = ANY (pg_blocking_pids(pid))',
              [pid],
            )
          ).rows[0]!.n;
          if (waits === 0) await new Promise((r) => setTimeout(r, 15));
        }
        expect(waits, `${name} waits on the folio`).toBe(1);
        expect(await requestFree(requestId), `${name}: request row not locked yet`).toBe(true);
      } finally {
        await holder.query('ROLLBACK');
        holder.release();
      }
      const res = await pending!;
      expect(res.statusCode, `${name} ${res.body}`).toBe(200);
    }
  });
});
