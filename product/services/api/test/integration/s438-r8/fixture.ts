/**
 * QA 18/10 (money recheck 8, "Việc chung"): copied from the critic's `test/s438/r8debt/fixture.ts` (tree f6803d0; lint only:
 * `performance.now()` for the lock-order wait instead of `Date.now()`, ADR-008)
 * to keep the BUG-R2-207 reproducers in the official suite; used by `r8debt-01.test.ts` / `r8ver-01.test.ts`.
 *
 * S4-38 recheck 8 (r8debt, commit f6803d0) – shared fixture for the debt / write-off attack (BUG-R2-202, 203, 206,
 * N-6, N-7). Built after test/integration/reversal-debt-g4.test.ts (same tenant shape, same DocsOk, same B18 path)
 * but standalone: real HTTP for every money step, the real J15 job (JobRunner.runOnce) or its one-folio unit in its
 * own transaction, a folio row-lock holder on a connection of its own to force the order of two real requests.
 * Fake clock and FAKE data only.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { randomBytes } from 'node:crypto';
import { appendFileSync } from 'node:fs';
import { v7 as uuidv7 } from 'uuid';
import { expect } from 'vitest';
import type { Database } from '../../../src/db/database';
import { JobRunner } from '../../../src/jobs/job-runner';
import { hasOpenDebtByNumber } from '../../../src/modules/folio/public/folio-close-job';
import { FolioService } from '../../../src/modules/folio/public/folio.service';
import {
  NoGuestAccessPort,
  NoMinibarPort,
} from '../../../src/modules/frontdesk/internal/default-ports';
import { FrontdeskPorts } from '../../../src/modules/frontdesk/internal/stay-support';
import {
  FD_CHILD_DATA_PORT,
  type CheckinDocumentStatus,
  type FrontdeskChildDataPort,
  type FrontdeskRegistrationPort,
} from '../../../src/modules/frontdesk/public/ports';
import { ReservationHooks } from '../../../src/modules/reservations/public/reservation-hooks';
import { sha256Hex } from '../../../src/shared/http/auth.guard';
import { addDays } from '../../../src/shared/time';
import {
  Client,
  type FeatureApp,
  type LightMyRequestResponse,
  P,
  TEST_PASSWORD,
  setPassword,
  startFeatureApp,
} from '../../helpers/feature-app';
import {
  type BookingIds,
  seedBooking,
  seedGuestRow,
  touchSessions,
} from '../../helpers/reservations-fixture';
import { type TestTenant, appDatabase, createTenant } from '../../helpers/tenant';

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

export const ROLES = {
  mgr: ['manager'],
  mgr2: ['manager'],
  fd: ['front_desk'],
  owner: ['owner'],
  sal: ['sales_staff'],
  ctv: ['collaborator'],
  // R3 S1 step 4 (BR-433 (c) – ESC-026 A): a lead deciding FOC of the desk.
  lead: ['front_desk_lead'],
};
const ROOMS = ['101', '102', '103', '201', '202', '203', '301', '302'];
export const TRANSFER = 100_000;

export type Res = LightMyRequestResponse;
export type Step = () => Promise<Res>;
export type Booking = { id: string; code: string; version: number; folioId: string };
export type Stay = Booking & {
  transferId: string;
  cashId: string;
  cashVnd: number;
  billNo: string;
  departure: string;
  bigTransferId?: string;
  bigLineId?: string;
};

export const log = (line: string) => {
  console.log(line);
  if (process.env.R8_LOG) appendFileSync(process.env.R8_LOG, `${line}\n`);
};

export const outcome = (r: Res) => {
  let code = '';
  if (r.statusCode >= 400) {
    try {
      const j = r.json();
      code = ` ${j.code}`;
      const errs = (j.errors ?? []) as Array<{ code?: string }>;
      if (errs.length) code += `/${errs.map((e) => e.code).join(',')}`;
      if (j.max !== undefined) code += ` max ${j.max}`;
    } catch {
      code = '';
    }
  } else if (r.statusCode < 300) {
    try {
      const j = r.json();
      if (j && typeof j === 'object' && 'status' in j && typeof j.status === 'string')
        code = ` ${j.status}`;
      if (j && typeof j === 'object' && j.effectiveAmountVnd !== undefined)
        code += ` eff ${j.effectiveAmountVnd}`;
      if (j && typeof j === 'object' && j.autoCancelReason) code += ` ${j.autoCancelReason}`;
    } catch {
      code = '';
    }
  }
  return `${r.statusCode}${code}`;
};

export async function startFixture() {
  const db: Database = appDatabase(12);
  const t: TestTenant = await createTenant(db, { users: ROLES });
  const ids: BookingIds = await seedBooking(db, t);
  const guest = await seedGuestRow(db, t, { name: 'Khách Công Nợ R8' });
  const fa: FeatureApp = await startFeatureApp(db, {
    override: (b) =>
      b.overrideProvider(FrontdeskPorts).useFactory({
        factory: (child: FrontdeskChildDataPort) =>
          new FrontdeskPorts(new DocsOk(), new NoGuestAccessPort(), child, new NoMinibarPort()),
        inject: [FD_CHILD_DATA_PORT],
      }),
  });
  const c: Record<string, Client> = {};
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
  for (const u of ['mgr', 'mgr2', 'owner', 'fd', 'lead']) await setPassword(db, t, u);

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
  const etagOf = async (folioId: string) =>
    (await c.mgr!.get(url(`/folios/${folioId}`))).headers.etag as string;
  const pay = (folioId: string, body: Record<string, unknown>, who = 'fd') =>
    c[who]!.send('POST', url(`/folios/${folioId}/payments`), body);
  const collect =
    (s: Booking, amountVnd: number, method = 'cash', who = 'fd'): Step =>
    () =>
      pay(s.folioId, { type: 'charge', method, amountVnd }, who);
  const reverse =
    (paymentId: string, reason = 'Chuyển khoản không về', who = 'mgr'): Step =>
    () =>
      c[who]!.send('POST', url(`/payments/${paymentId}/actions/reverse`), { reason });
  const writeOff =
    (
      s: Booking,
      lineId: string,
      amountVnd: number,
      o: { who?: string; reasonCode?: string } = {},
    ): Step =>
    () =>
      c[o.who ?? 'mgr']!.send('POST', url(`/folios/${s.folioId}/lines/${lineId}/foc`), {
        kind: 'foc',
        amountVnd,
        reasonCode: o.reasonCode ?? 'debt_write_off',
        note: 'Khách không liên lạc được',
        authMethod: 'password',
        secret: TEST_PASSWORD,
      });
  const decide =
    (id: string, verb: 'approve' | 'reject', who = 'owner'): Step =>
    () =>
      c[who]!.send('POST', url(`/approval-requests/${id}/actions/${verb}`), {
        authMethod: 'password',
        secret: TEST_PASSWORD,
        ...(verb === 'reject' ? { reason: 'Không đồng ý xóa nợ' } : {}),
      });
  const cancelReq =
    (id: string, who = 'mgr'): Step =>
    () =>
      c[who]!.send('POST', url(`/approval-requests/${id}/actions/cancel`), {});
  const adjust =
    (s: Booking, lineId: string, body: Record<string, unknown>, etag?: string, who = 'mgr'): Step =>
    async () =>
      c[who]!.send(
        'POST',
        url(`/folios/${s.folioId}/lines/${lineId}/adjustments`),
        { reason: 'Sửa theo khách', ...body },
        {
          'if-match': etag ?? (await etagOf(s.folioId)),
        },
      );
  const lateCharge = async (s: Booking, amountVnd: number, serviceDate: string) => {
    const r = await c.fd!.send('POST', url(`/folios/${s.folioId}/lines`), {
      category: 'fnb',
      description: 'Phát sinh sau trả phòng',
      quantity: 1,
      unitPriceVnd: amountVnd,
      serviceDate,
    });
    expect(r.statusCode, r.body).toBe(201);
    return (r.json().lines as any[])
      .filter((l) => l.category === 'fnb' && l.amountVnd === amountVnd && !l.reversalOfId)
      .pop().id as string;
  };
  const roomLineOf = async (s: Booking) =>
    ((await folio(s.folioId)).lines as any[]).find(
      (l) => l.category === 'room' && l.lineState === 'posted' && !l.reversalOfId,
    ).id as string;
  const liveLineIds = async (s: Booking, category: string) => {
    const lines = (await folio(s.folioId)).lines as any[];
    const reversed = new Set(lines.map((l) => l.reversalOfId).filter(Boolean));
    return lines.filter(
      (l) =>
        l.category === category &&
        l.lineState === 'posted' &&
        !l.reversalOfId &&
        !reversed.has(l.id),
    );
  };
  const hooks = () => fa.app.get(ReservationHooks);
  const openDebtOf = (s: Booking) =>
    db.withContext(t.ctx(), (tx) => hooks().openDebt(tx, s.folioId));
  const nightBasis = (lineId: string) =>
    db.withContext(t.ctx(), (tx) => fa.app.get(FolioService).nightRateBasis(tx, lineId));
  const runJ15 = async () => {
    const runner = fa.app.get(JobRunner, { strict: false });
    const p = (await runner.listProperties()).find((x: any) => x.propertyId === t.propertyIds[0])!;
    const out = await runner.runOnce('folio.close', p);
    expect(out.stats.failed, JSON.stringify(out.stats)).toBe(0);
    return out.stats as { closed: number; closedWithDebt: number; waitingRefund: number };
  };
  /** J15's unit for ONE folio, in its own transaction (as folio-close-job.ts runs it) – for races. */
  const j15Unit =
    (s: Booking): Step =>
    async () => {
      const h = hooks();
      const out = await db.withContext(
        { ...t.ctx(), userId: null, actorType: 'system' } as any,
        (one) =>
          fa.app.get(FolioService).closeAfterWindow(one, s.folioId, fa.clock.now(), {
            recordDebt: (folioId) =>
              h.debtOnCheckout(one, {
                folioId,
                reason: 'post_checkout_unpaid',
                actor: { userId: '00000000-0000-0000-0000-000000000000', roles: ['owner'] },
              }),
            hasOpenDebt: (folioId) => hasOpenDebtByNumber(h, one, folioId),
          }),
      );
      return {
        statusCode: 200,
        body: String(out),
        json: () => ({ status: out }),
      } as unknown as Res;
    };

  let seq = 0;
  /**
   * A direct 2-night stay paid at check-in (100.000 transfer + cash), optionally a `big` fnb line paid by ONE bank
   * transfer before B18; B18 at departure 11:00 → folio `settled`, due 0, window until D+1 11:00. Clock left at D 15:00.
   */
  const checkedOutStay = async (
    opts: { ctv?: boolean; big?: number; b18Debt?: { unpaid: number; finalPay: number } } = {},
  ): Promise<Stay> => {
    const k = seq++;
    const roomNo = ROOMS[k % ROOMS.length]!;
    const arrival = addDays('2026-11-02', 3 * Math.floor(k / ROOMS.length));
    const departure = addDays(arrival, 2);
    await at('2026-10-20T10:00:00+07:00');
    const body = {
      roomId: ids.rooms[roomNo],
      ...(opts.ctv
        ? { channelId: ids.channels.collaborator, closerUserId: t.users.ctv!.id }
        : { channelId: ids.channels.direct, directSource: 'zalo_phone' }),
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
    await q(`UPDATE room_status SET status = 'VC' WHERE room_id = $1`, [ids.rooms[roomNo]]);
    const due = (await folio(b.folioId)).totals.balanceDueVnd as number;
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
    let bigTransferId: string | undefined;
    let bigLineId: string | undefined;
    if (opts.big) {
      await at(`${departure}T10:00:00+07:00`);
      const l = await c.fd!.send('POST', url(`/folios/${b.folioId}/lines`), {
        category: 'fnb',
        description: 'Tiệc nhóm',
        quantity: 1,
        unitPriceVnd: opts.big,
        serviceDate: arrival,
      });
      expect(l.statusCode, l.body).toBe(201);
      bigLineId = (l.json().lines as any[]).find(
        (x) => x.category === 'fnb' && x.amountVnd === opts.big,
      ).id;
      const bt = await pay(b.folioId, {
        type: 'charge',
        method: 'bank_transfer',
        amountVnd: opts.big,
      });
      expect(bt.statusCode, bt.body).toBe(201);
      bigTransferId = bt.json().id;
    }
    if (opts.b18Debt) {
      await at(`${departure}T10:00:00+07:00`);
      const l = await c.fd!.send('POST', url(`/folios/${b.folioId}/lines`), {
        category: 'fnb',
        description: 'Tiệc chưa trả',
        quantity: 1,
        unitPriceVnd: opts.b18Debt.unpaid,
        serviceDate: arrival,
      });
      expect(l.statusCode, l.body).toBe(201);
      bigLineId = (l.json().lines as any[]).find(
        (x) => x.category === 'fnb' && x.amountVnd === opts.b18Debt!.unpaid,
      ).id;
    }
    await at(`${departure}T11:00:00+07:00`);
    const out = opts.b18Debt
      ? await act(
          b.id,
          'check-out',
          {
            checkoutTime: '11:00',
            ...(opts.b18Debt.finalPay > 0
              ? {
                  finalPayment: {
                    type: 'charge',
                    method: 'cash',
                    amountVnd: opts.b18Debt.finalPay,
                  },
                }
              : {}),
            debt: { dueDate: addDays(departure, 5), reason: 'Công ty hẹn chuyển khoản' },
          },
          'mgr',
        )
      : await act(b.id, 'check-out', { checkoutTime: '11:00' });
    expect(out.statusCode, out.body).toBe(200);
    const f = await folio(b.folioId);
    expect(f).toMatchObject({ status: 'settled' });
    if (!opts.b18Debt) expect(f.totals).toMatchObject({ balanceDueVnd: 0, creditVnd: 0 });
    await at(`${departure}T15:00:00+07:00`);
    return {
      ...b,
      transferId: tr.json().id,
      cashId: cash.json().id,
      cashVnd: due - TRANSFER,
      billNo: f.billNo,
      departure,
      ...(bigTransferId ? { bigTransferId } : {}),
      ...(bigLineId ? { bigLineId } : {}),
    };
  };

  /** Money + debt + requests of a stay, independent of ids/dates (compared between runs). */
  const state = async (s: Booking) => {
    const f = await folio(s.folioId);
    const [r] = await q(
      `SELECT checkout_mode AS mode, debt_settled_at IS NOT NULL AS settled, debt_recorded_vnd::bigint::int AS recorded
         FROM reservation WHERE id = $1`,
      [s.id],
    );
    const reqs = await q(
      `SELECT a.status, a.amount_vnd::int AS amount, a.applied_cap_vnd::int AS cap, a.auto_cancel_reason AS acr
         FROM approval_request a JOIN folio_line l ON l.id = a.folio_line_id
        WHERE l.folio_id = $1 AND a.reason_code = 'debt_write_off' ORDER BY a.requested_at, a.id`,
      [s.folioId],
    );
    const [foc] = await q(
      `SELECT COALESCE(-sum(l.amount_vnd), 0)::int AS v FROM folio_line l
        WHERE l.folio_id = $1 AND l.category = 'foc' AND l.line_state = 'posted'`,
      [s.folioId],
    );
    const [aud] = await q(
      `SELECT (SELECT count(*)::int FROM audit_event WHERE action = 'reservation.debt_settled' AND entity_id = $1) AS settled_n,
              (SELECT count(*)::int FROM audit_event WHERE action = 'reservation.debt_on_checkout' AND entity_id = $1) AS debt_n`,
      [s.id],
    );
    const od = await openDebtOf(s);
    return {
      folio: f.status as string,
      due: f.totals.balanceDueVnd as number,
      credit: f.totals.creditVnd as number,
      mode: r.mode as string | null,
      debtSettled: r.settled as boolean,
      openDebtVnd: od ? od.openDebtVnd : null,
      focNet: foc.v as number,
      writeOffs: reqs.map(
        (x: any) =>
          `${x.status}:${x.amount}${x.cap !== null ? `/cap ${x.cap}` : ''}${x.acr ? `:${x.acr}` : ''}`,
      ),
      settledAudits: aud.settled_n as number,
      debtAudits: aud.debt_n as number,
    };
  };

  // ───── forced order: steps queue behind a folio row lock held on a connection of its own ─────
  const interleaved = async (folioId: string, steps: Step[]): Promise<Res[]> => {
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
        const until = performance.now() + 4_000;
        while ((await waiting()) < pending.length) {
          if (performance.now() > until) throw new Error(`step ${pending.length} never waited`);
          await new Promise((r) => setTimeout(r, 15));
        }
      }
    } finally {
      await holder.query('ROLLBACK');
      holder.release();
    }
    return Promise.all(pending);
  };
  const deadlocks = async () =>
    (
      await q('SELECT deadlocks::int AS n FROM pg_stat_database WHERE datname = current_database()')
    )[0].n as number;

  /**
   * Race of two real requests on two connections, forced in BOTH orders behind the folio lock, `rounds` times each,
   * each compared with the same steps run one after the other on a fresh stay (money oracle = `state`).
   */
  const race = async (
    label: string,
    build: () => Promise<{ s: Booking; a: Step; b: Step }>,
    oracle: (
      order: 'A first' | 'B first',
      seq: string[],
      st: Awaited<ReturnType<typeof state>>,
    ) => void,
    rounds = 3,
  ) => {
    const before = await deadlocks();
    const bad: string[] = [];
    let c5xx = 0;
    for (const order of ['A first', 'B first'] as const) {
      for (let i = 0; i < rounds; i++) {
        const ctl = await build();
        const cs = order === 'A first' ? [ctl.a, ctl.b] : [ctl.b, ctl.a];
        const cres: Res[] = [];
        for (const s of cs) cres.push(await s());
        const cseq = cres.map(outcome);
        const cst = await state(ctl.s);
        // the oracle reads the outcomes in [a, b] order whatever ran first
        oracle(order, order === 'A first' ? [...cseq] : [...cseq].reverse(), cst);
        const run = await build();
        const rs = order === 'A first' ? [run.a, run.b] : [run.b, run.a];
        let got: string[];
        try {
          const res = await interleaved(run.s.folioId, rs);
          got = res.map(outcome);
          c5xx += res.filter((r) => r.statusCode >= 500).length;
        } catch (e) {
          got = [`ERR ${(e as Error).message}`];
        }
        const rst = await state(run.s);
        const same =
          JSON.stringify(cseq) === JSON.stringify(got) &&
          JSON.stringify(cst) === JSON.stringify(rst);
        log(
          `[r8debt] ${label} | ${order} #${i}: seq ${JSON.stringify(cseq)} | forced ${JSON.stringify(got)}` +
            (same
              ? ` = seq ${JSON.stringify(cst)}`
              : ` MISMATCH ${JSON.stringify(rst)} vs ${JSON.stringify(cst)}`),
        );
        if (!same) bad.push(`${order} #${i}`);
      }
    }
    await new Promise((r) => setTimeout(r, 1_500));
    const dl = (await deadlocks()) - before;
    log(`[r8debt] ${label}: deadlocks +${dl}, 5xx ${c5xx}, mismatches ${bad.length}`);
    expect({ bad, dl, c5xx }).toEqual({ bad: [], dl: 0, c5xx: 0 });
  };

  return {
    db,
    guest,
    fa,
    t,
    ids,
    c,
    url,
    q,
    at,
    get,
    act,
    folio,
    etagOf,
    pay,
    collect,
    reverse,
    writeOff,
    decide,
    cancelReq,
    adjust,
    lateCharge,
    roomLineOf,
    liveLineIds,
    openDebtOf,
    nightBasis,
    runJ15,
    j15Unit,
    checkedOutStay,
    state,
    interleaved,
    deadlocks,
    race,
    close: async () => {
      await fa?.close();
      await db?.close();
    },
  };
}
export type Fx = Awaited<ReturnType<typeof startFixture>>;
export { addDays };
