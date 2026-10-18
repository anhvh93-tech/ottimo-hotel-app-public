/**
 * QA 18/10 (money recheck 8, "Việc chung"): copied from the critic's `test/s438/v8-r8ver-0-1/h.ts` (tree f6803d0; lint only:
 * `performance.now()` for the lock-order wait instead of `Date.now()`, ADR-008)
 * to keep the BUG-R2-207 reproducers in the official suite; used by `r8debt-01.test.ts` / `r8ver-01.test.ts`.
 *
 * r8ver (S4-38 recheck 8) – shared harness on f6803d0: real HTTP app, real ports (child data B9a, minibar),
 * receiving account for VietQR, memory blob store for refund receipts, trusted desk device. FAKE data, fake clock.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { appendFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { v7 as uuidv7 } from 'uuid';
import { expect } from 'vitest';
import type { Database, Tx } from '../../../src/db/database';
import { JobRunner } from '../../../src/jobs/job-runner';
import { FolioService } from '../../../src/modules/folio/public/folio.service';
import { AttachmentService } from '../../../src/modules/files/public/attachment.service';
import { NoGuestAccessPort } from '../../../src/modules/frontdesk/internal/default-ports';
import { FrontdeskPorts } from '../../../src/modules/frontdesk/internal/stay-support';
import {
  FD_CHILD_DATA_PORT,
  FD_MINIBAR_PORT,
  type CheckinDocumentStatus,
  type FrontdeskChildDataPort,
  type FrontdeskMinibarPort,
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

export class DocsOk implements FrontdeskRegistrationPort {
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
  owner: ['owner'],
  mgr: ['manager'],
  mgr2: ['manager'],
  fd: ['front_desk'],
  fd2: ['front_desk'],
  sal: ['sales_staff'],
  hk: ['housekeeping'],
};
export const ROOMS = ['101', '102', '103', '201', '202', '203', '301', '302'];
export type Booking = { id: string; code: string; version: number; folioId: string };
export type Res = LightMyRequestResponse;
const DS_E = JSON.parse(
  readFileSync(join(__dirname, '../../../../../tests/fixtures/seed/ds-e.json'), 'utf8'),
) as {
  minibarItems: Array<{
    code: string;
    name: string;
    unit: string;
    unitCostVnd: number;
    salePriceVnd: number;
    standardQtyPerRoom: number;
  }>;
};
export const LOG = process.env.V8_LOG ?? '/dev/null';
export const log = (tag: string, x: unknown) =>
  appendFileSync(LOG, `${tag} ${JSON.stringify(x)}\n`);

export async function setup(poolMax = 12) {
  process.env.BLOBSTORE_PROVIDER = 'memory';
  const db: Database = appDatabase(poolMax);
  const t: TestTenant = await createTenant(db, { users: ROLES });
  const ids: BookingIds = await seedBooking(db, t);
  const guest = await seedGuestRow(db, t, { name: 'Khách Kiểm Tám' });
  const codeOf: Record<string, string> = {};
  await db.withContext(t.ctx(), async (tx) => {
    for (const m of DS_E.minibarItems) {
      const id = uuidv7();
      codeOf[id] = m.code;
      await tx.query(
        `INSERT INTO item (id, organization_id, property_id, code, kind, name, unit, cost_price_vnd,
           sale_price_vnd, minibar_standard_qty, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'minibar', $5, $6, $7, $8, $9, $10, $10)`,
        [
          id,
          t.organizationId,
          t.propertyIds[0],
          m.code,
          m.name,
          m.unit,
          m.unitCostVnd,
          m.salePriceVnd || null,
          m.standardQtyPerRoom,
          new Date('2026-10-01T00:00:00Z'),
        ],
      );
    }
  });
  const fa: FeatureApp = await startFeatureApp(db, {
    override: (b) =>
      b.overrideProvider(FrontdeskPorts).useFactory({
        factory: (child: FrontdeskChildDataPort, minibar: FrontdeskMinibarPort) =>
          new FrontdeskPorts(new DocsOk(), new NoGuestAccessPort(), child, minibar),
        inject: [FD_CHILD_DATA_PORT, FD_MINIBAR_PORT],
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
        new Date('2031-12-31T00:00:00Z'),
      ],
    ),
  );
  for (const u of ['fd', 'fd2', 'mgr', 'mgr2', 'owner']) c[u]!.deviceToken = token;
  for (const u of Object.keys(ROLES)) await setPassword(db, t, u);
  return { ...kit(db, fa, t, ids, guest, c, codeOf), deviceToken: token };
}

export type Saved = {
  organizationId: string;
  propertyIds: string[];
  users: TestTenant['users'];
  ids: BookingIds;
  guest: string;
  codeOf: Record<string, string>;
  deviceToken: string;
};
/** Phase 2 of a migration pipeline: the tenant written by an older tree, re-opened with THIS tree's app. */
export async function restore(sv: Saved, poolMax = 12) {
  process.env.BLOBSTORE_PROVIDER = 'memory';
  const db: Database = appDatabase(poolMax);
  const t = {
    organizationId: sv.organizationId,
    propertyIds: sv.propertyIds,
    users: sv.users,
    ctx: (i = 0) => ({
      organizationId: sv.organizationId,
      propertyId: sv.propertyIds[i] ?? null,
      userId: null,
      actorType: 'system',
    }),
    deviceToken: async () => sv.deviceToken,
  } as unknown as TestTenant;
  const fa: FeatureApp = await startFeatureApp(db, {
    override: (b) =>
      b.overrideProvider(FrontdeskPorts).useFactory({
        factory: (child: FrontdeskChildDataPort, minibar: FrontdeskMinibarPort) =>
          new FrontdeskPorts(new DocsOk(), new NoGuestAccessPort(), child, minibar),
        inject: [FD_CHILD_DATA_PORT, FD_MINIBAR_PORT],
      }),
  });
  const c: Record<string, Client> = {};
  for (const u of Object.keys(ROLES)) c[u] = Client.of(fa, t, u);
  for (const u of ['fd', 'fd2', 'mgr', 'mgr2', 'owner']) c[u]!.deviceToken = sv.deviceToken;
  return { ...kit(db, fa, t, sv.ids, sv.guest, c, sv.codeOf), deviceToken: sv.deviceToken };
}

export function kit(
  db: Database,
  fa: FeatureApp,
  t: TestTenant,
  ids: BookingIds,
  guest: string,
  c: Record<string, Client>,
  codeOf: Record<string, string>,
) {
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
  const ver = async (folioId: string) =>
    Number((await q('SELECT version FROM folio WHERE id = $1', [folioId]))[0].version);
  const pay = (folioId: string, body: Record<string, unknown>, who = 'fd') =>
    c[who]!.send('POST', url(`/folios/${folioId}/payments`), body);
  const reverse = (paymentId: string, reason = 'Chuyển khoản không về', who = 'mgr') =>
    c[who]!.send('POST', url(`/payments/${paymentId}/actions/reverse`), { reason });
  const vacant = (room: string) =>
    q(
      `INSERT INTO room_status (room_id, organization_id, property_id, status, since) VALUES ($1, $2, $3, 'VC', $4)
       ON CONFLICT (room_id) DO UPDATE SET status = 'VC'`,
      [ids.rooms[room], t.organizationId, t.propertyIds[0], new Date('2026-10-01T00:00:00Z')],
    );
  const addLine = async (folioId: string, amountVnd: number, serviceDate: string, who = 'fd') => {
    const r = await c[who]!.send('POST', url(`/folios/${folioId}/lines`), {
      category: 'fnb',
      description: 'Đồ uống',
      quantity: 1,
      unitPriceVnd: amountVnd,
      serviceDate,
    });
    expect(r.statusCode, r.body).toBe(201);
    const ls = (r.json().lines as any[]).filter(
      (l) => l.category === 'fnb' && l.amountVnd === amountVnd && !l.reversalOfId,
    );
    return { res: r, id: ls[ls.length - 1].id as string };
  };
  const adjust = (
    folioId: string,
    lineId: string,
    body: Record<string, unknown>,
    etag: string,
    who = 'mgr',
  ) =>
    c[who]!.send('POST', url(`/folios/${folioId}/lines/${lineId}/adjustments`), body, {
      'if-match': etag,
    });
  /** Money of a folio as stored (posted lines, payments) – what a refused stale call must leave identical. */
  const money = async (folioId: string) => {
    const [m] = await q(
      `SELECT (SELECT count(*)::int FROM folio_line WHERE folio_id = $1) AS lines,
              (SELECT COALESCE(sum(amount_vnd), 0)::text FROM folio_line WHERE folio_id = $1 AND line_state = 'posted') AS posted,
              (SELECT count(*)::int FROM payment WHERE folio_id = $1) AS pays,
              (SELECT COALESCE(sum(amount_vnd) FILTER (WHERE status = 'succeeded'), 0)::text FROM payment WHERE folio_id = $1) AS paid,
              (SELECT status FROM folio WHERE id = $1) AS status`,
      [folioId],
    );
    const f = await folio(folioId);
    return {
      ...m,
      due: f.totals.balanceDueVnd,
      credit: f.totals.creditVnd,
      total: f.totals.totalVnd,
    };
  };
  const standard = async (b: Booking, roomId?: string) => {
    const r = await c.fd!.get(
      url(`/reservations/${b.id}/minibar-standard${roomId ? `?roomId=${roomId}` : ''}`),
    );
    expect(r.statusCode, r.body).toBe(200);
    return r.json() as {
      items: Array<{ itemId: string; standardQty: number }>;
      periodId?: string | null;
      roomId?: string;
    };
  };
  const count = async (b: Booking, used: Record<string, number>, roomId?: string) => {
    const std = await standard(b, roomId);
    return c.fd!.send('POST', url(`/reservations/${b.id}/minibar-checks`), {
      mode: 'checkout',
      lines: std.items.map((i) => ({
        itemId: i.itemId,
        remainingQty: i.standardQty - (used[codeOf[i.itemId] ?? ''] ?? 0),
      })),
      roomId: std.roomId ?? roomId,
      periodId: std.periodId ?? null,
    });
  };
  let seq = 0;
  const nextSlot = (base = '2026-11-02') => {
    const k = seq++;
    return {
      room: ROOMS[k % ROOMS.length]!,
      arrival: addDays(base, 4 * Math.floor(k / ROOMS.length)),
    };
  };
  /** Direct stay created by FD (deposit when required), checked in at 15:00 with what is due paid by transfer 100.000 + cash. */
  const inHouse = async (nights = 2, o: { pay?: boolean; base?: string } = {}) => {
    const { room, arrival } = nextSlot(o.base);
    const departure = addDays(arrival, nights);
    await at('2026-10-20T10:00:00+07:00');
    const body = {
      roomId: ids.rooms[room],
      channelId: ids.channels.direct,
      directSource: 'zalo_phone',
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
    await vacant(room);
    let transferId = '';
    let cashId = '';
    if (o.pay !== false) {
      const due = (await folio(b.folioId)).totals.balanceDueVnd as number;
      const tr = await pay(b.folioId, {
        type: 'charge',
        method: 'bank_transfer',
        amountVnd: 100_000,
      });
      expect(tr.statusCode, tr.body).toBe(201);
      transferId = tr.json().id;
      const cash = await pay(b.folioId, {
        type: 'charge',
        method: 'cash',
        amountVnd: due - 100_000,
      });
      expect(cash.statusCode, cash.body).toBe(201);
      cashId = cash.json().id;
    }
    const ci = await act(b.id, 'check-in', {
      cardsIssued: 1,
      houseRulesSent: true,
      checkinTime: '15:00',
    });
    expect(ci.statusCode, ci.body).toBe(200);
    return { ...b, room, arrival, departure, transferId, cashId };
  };
  type Stay = Awaited<ReturnType<typeof inHouse>>;
  const checkOut = async (s: Stay) => {
    await at(`${s.departure}T10:30:00+07:00`);
    const cnt = await count(s, {});
    expect([201, 409], cnt.body).toContain(cnt.statusCode);
    await at(`${s.departure}T11:00:00+07:00`);
    const out = await act(s.id, 'check-out', { checkoutTime: '11:00' });
    expect(out.statusCode, out.body).toBe(200);
    return out;
  };
  const checkedOut = async () => {
    const s = await inHouse();
    await checkOut(s);
    await at(`${s.departure}T15:00:00+07:00`);
    return s;
  };
  const runJ15 = async () => {
    const runner = fa.app.get(JobRunner, { strict: false });
    const p = (await runner.listProperties()).find((x) => x.propertyId === t.propertyIds[0])!;
    const out = await runner.runOnce('folio.close', p);
    expect(out.stats.failed, JSON.stringify(out.stats)).toBe(0);
    return out.stats as { closed: number; closedWithDebt: number; waitingRefund: number };
  };
  /** J15's unit for one folio in its own transaction (folio-close-job.ts). */
  const j15One = async (folioId: string): Promise<Res> => {
    const hooks = fa.app.get(ReservationHooks);
    const out = await db.withContext(t.ctx(), (one: Tx) =>
      fa.app.get(FolioService).closeAfterWindow(one, folioId, fa.clock.now(), {
        recordDebt: (id) =>
          hooks.debtOnCheckout(one, {
            folioId: id,
            reason: 'post_checkout_unpaid',
            actor: { userId: '00000000-0000-0000-0000-000000000000', roles: ['owner'] },
          }),
        hasOpenDebt: async (id) => (await hooks.openDebt(one, id)) !== null,
      }),
    );
    return { statusCode: 200, body: String(out), json: () => out } as unknown as Res;
  };
  const openDebtOf = (folioId: string) =>
    db.withContext(t.ctx(), (tx) => fa.app.get(ReservationHooks).openDebt(tx, folioId));
  const writeOff = (folioId: string, lineId: string, amountVnd: number, who = 'mgr') =>
    c[who]!.send('POST', url(`/folios/${folioId}/lines/${lineId}/foc`), {
      kind: 'foc',
      amountVnd,
      reasonCode: 'debt_write_off',
      note: 'Khách không liên lạc được',
      authMethod: 'password',
      secret: TEST_PASSWORD,
    });
  const foc = (
    folioId: string,
    lineId: string,
    amountVnd: number,
    who = 'mgr',
    reasonCode = 'service_recovery',
  ) =>
    c[who]!.send('POST', url(`/folios/${folioId}/lines/${lineId}/foc`), {
      kind: 'foc',
      amountVnd,
      reasonCode,
      note: 'Bù cho khách',
      authMethod: 'password',
      secret: TEST_PASSWORD,
    });
  const approve = async (approvalId: string, who = 'owner') => {
    const v = Number(
      (await q('SELECT version FROM approval_request WHERE id = $1', [approvalId]))[0].version,
    );
    return c[who]!.send('POST', url(`/approval-requests/${approvalId}/actions/approve`), {
      expectedVersion: v,
      authMethod: 'password',
      secret: TEST_PASSWORD,
    });
  };
  const reject = async (approvalId: string, who = 'owner') => {
    const v = Number(
      (await q('SELECT version FROM approval_request WHERE id = $1', [approvalId]))[0].version,
    );
    return c[who]!.send('POST', url(`/approval-requests/${approvalId}/actions/reject`), {
      expectedVersion: v,
      reason: 'Không đồng ý',
      decisionNote: 'Không đồng ý',
      authMethod: 'password',
      secret: TEST_PASSWORD,
    });
  };
  const attach = (who: string, reservationId: string) =>
    db.withContext(
      { ...t.ctx(), userId: t.users[who]!.id, actorType: 'user' },
      async (tx) =>
        (
          await fa.app
            .get(AttachmentService)
            .upload(
              tx,
              { userId: t.users[who]!.id, roles: t.users[who]!.roles },
              { purpose: 'refund_proof', reservationId },
              { data: Buffer.from('fake-jpeg-bytes'), mime: 'image/jpeg', width: 1, height: 1 },
            )
        ).id,
    );
  const setAccount = async () => {
    const r = await c.owner!.send('PUT', url('/parameters/payment_receiving_account'), {
      value: { bankBin: '970407', accountNo: '1903123456789', accountName: 'OTTIMO TEST' },
      effectiveFrom: '2026-10-15',
      reason: 'Tài khoản nhận thử nghiệm',
      reauth: { authMethod: 'password', secret: TEST_PASSWORD },
    });
    expect(r.statusCode, r.body).toBe(200);
  };
  const deadlocks = async () => {
    await new Promise((r) => setTimeout(r, 1_100));
    const [d] = await q(
      `SELECT pg_stat_clear_snapshot(), (SELECT deadlocks::int FROM pg_stat_database WHERE datname = current_database()) AS n`,
    );
    return d.n as number;
  };
  /**
   * Steps queue behind a row lock held on a connection of its own (default: the folio). Each step starts once all
   * earlier ones wait on the holder (directly or through a chain); then the holder rolls back.
   */
  const interleaved = async (
    folioId: string,
    steps: Array<() => Promise<Res>>,
    hold?: { sql: string; params: unknown[] },
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
      if (hold) await holder.query(hold.sql, hold.params);
      else await holder.query('SELECT id FROM folio WHERE id = $1 FOR UPDATE', [folioId]);
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
          if (performance.now() > until) {
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
  return {
    db,
    fa,
    t,
    ids,
    guest,
    c,
    codeOf,
    url,
    q,
    at,
    get,
    act,
    folio,
    etagOf,
    ver,
    pay,
    reverse,
    vacant,
    addLine,
    adjust,
    money,
    nextSlot,
    inHouse,
    checkOut,
    checkedOut,
    runJ15,
    j15One,
    openDebtOf,
    writeOff,
    foc,
    approve,
    reject,
    attach,
    setAccount,
    standard,
    count,
    deadlocks,
    interleaved,
    inSequence,
    TEST_PASSWORD,
  };
}
export type Kit = ReturnType<typeof kit> & { deviceToken: string };
