/**
 * Sprint 4 (BE-B) – FOC keys on the real PostgreSQL and the real endpoints, replayed against QA/DOM's oracle
 * tests/fixtures/br-examples.json (BR-434 v0.3.5/v0.3.6, BR-433, BR-412, BR-315 (g)):
 * - S4-02 (BUG-R2-056): the FOC that follows a re-written line = min(**approved amount**, new line) – back up when
 *   the line comes back (BR-434-07); extra-person FOC dormant at 0 and restored (BR-434-08);
 * - S4-18 (BUG-R2-059): a PENDING FOC follows the new line and the approval applies min(asked, line at approval)
 *   (BR-434-09); no line left → auto-cancelled, requester told, no limit used (BR-434-10); an approved FOC
 *   cancelled by rule gives the monthly limit back + audit folio.foc_cancelled (BR-433-03);
 * - S4-23 (BR-434 v0.3.6): several reductions on one key in approval order, Σ = min(Σ approved, line), never a
 *   negative night (BR-434-11/12);
 * - S4-34 (BUG-R2-061): the late check-out FOC (one key per stay): dormant inside the grace, restored, pending
 *   follows (BR-412-15/16/17);
 * - S4-22 (BUG-R2-060): no-show suspends the FOC, restore brings it back (BR-315-06);
 * - S4-01 / S4-03 (BUG-R2-055): FOC above the new night price on a booking with a closer – no 500, commission on
 *   the nights net of the FOC moved.
 * Fake clock and FAKE data only.
 */
import { randomBytes, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { v7 as uuidv7 } from 'uuid';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
import {
  NoGuestAccessPort,
  NoMinibarPort,
  UnwiredChildDataPort,
} from '../../src/modules/frontdesk/internal/default-ports';
import { FrontdeskPorts } from '../../src/modules/frontdesk/internal/stay-support';
import { readDepositNotices } from '../../src/modules/payments/public/deposit-notices';
import type {
  CheckinDocumentStatus,
  FrontdeskRegistrationPort,
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

const ROLES = {
  own: ['owner'],
  mgr: ['manager'],
  fdl: ['front_desk_lead'],
  fd: ['front_desk'],
  sal: ['sales_staff'],
};

interface Oracle {
  id: string;
  pendingFix?: string;
  input: Record<string, unknown>;
  expected: Record<string, unknown>;
}
const ORACLES = JSON.parse(
  readFileSync(join(__dirname, '../../../../tests/fixtures/br-examples.json'), 'utf8'),
) as { examples: Oracle[] };
const oracle = (id: string): Oracle => {
  const o = ORACLES.examples.find((x) => x.id === id);
  if (!o) throw new Error(`oracle ${id} missing`);
  return o;
};

type Booking = { id: string; code: string; version: number; folioId: string };
type Line = {
  id: string;
  category: string;
  amountVnd: number;
  serviceDate?: string;
  relatedLineId?: string;
  reversalOfId?: string;
  approvalRequestId?: string;
  lineState: string;
};
type Approval = {
  id: string;
  type: string;
  status: string;
  amountVnd: number;
  folioLineId?: string;
  effectiveAmountVnd?: number;
  focState?: string;
  focCancelReason?: string;
  lineChangedNote?: {
    oldLineVnd: number;
    newLineVnd: number;
    fromServiceDate?: string;
    toServiceDate?: string;
    cause: string;
  } | null;
  autoCancelReason?: string;
  approverRemainingMonthlyVnd?: number;
  version?: number;
};

describe.skipIf(!HAS_DB)('S4 FOC keys (BE-B: S4-02, S4-18, S4-22, S4-23, S4-34, S4-01/03)', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let ids: BookingIds;
  let guest: string;
  const c: Record<string, Client> = {};

  beforeAll(async () => {
    db = appDatabase(8);
    t = await createTenant(db, { users: ROLES });
    ids = await seedBooking(db, t);
    guest = await seedGuestRow(db, t, { name: 'Lý Thử Khách' });
    fa = await startFeatureApp(db, {
      override: (b) =>
        b
          .overrideProvider(FrontdeskPorts)
          .useValue(
            new FrontdeskPorts(
              new DocsOk(),
              new NoGuestAccessPort(),
              new UnwiredChildDataPort(),
              new NoMinibarPort(),
            ),
          ),
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
          new Date('2027-06-30T00:00:00Z'),
        ],
      ),
    );
    c.fd!.deviceToken = token;
    c.fdl!.deviceToken = token;
    await setPassword(db, t, 'mgr');
    await setPassword(db, t, 'fdl');
    await setPassword(db, t, 'own');
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
  const version = async (id: string) =>
    (await c.fd!.get(url(`/reservations/${id}`))).json().version as number;
  const act = async (id: string, verb: string, body: unknown, who = 'fd') =>
    c[who]!.send('POST', url(`/reservations/${id}/actions/${verb}`), body, {
      'if-match': `"${await version(id)}"`,
    });
  const direct = async (
    room: string,
    from: string,
    to: string,
    more: Record<string, unknown> = {},
  ): Promise<Booking> => {
    const body = (amountVnd: number) => ({
      roomId: ids.rooms[room],
      channelId: ids.channels.direct,
      directSource: 'zalo_phone',
      adults: 2,
      bookerGuestId: guest,
      paymentModel: 'direct',
      arrivalDate: from,
      departureDate: to,
      initialPayment: { type: 'deposit', method: 'cash', amountVnd },
      ...more,
    });
    let res = await c.fd!.send('POST', url('/reservations'), body(100_000));
    if (res.statusCode === 422 && res.json().code === 'DEPOSIT_INSUFFICIENT') {
      res = await c.fd!.send('POST', url('/reservations'), body(res.json().depositRequiredVnd));
    }
    expect(res.statusCode, res.body).toBe(201);
    return res.json() as Booking;
  };
  const folio = async (b: Booking) => (await c.fd!.get(url(`/folios/${b.folioId}`))).json();
  /** Live posted lines (not reversals, not reversed). */
  const liveLines = async (b: Booking) => {
    const all = (await folio(b)).lines as Line[];
    const reversed = new Set(all.map((l) => l.reversalOfId).filter(Boolean));
    return all.filter((l) => l.lineState === 'posted' && !l.reversalOfId && !reversed.has(l.id));
  };
  const liveBy = async (b: Booking, category: string) =>
    (await liveLines(b))
      .filter((l) => l.category === category)
      .sort((x, y) => String(x.serviceDate).localeCompare(String(y.serviceDate)));
  /** Live reductions as [date of the reduced line, category of the reduced line, kind, amount]. */
  const reductions = async (b: Booking) => {
    const all = (await folio(b)).lines as Line[];
    const byId = new Map(all.map((l) => [l.id, l]));
    return (await liveLines(b))
      .filter((l) => l.category === 'foc' || l.category === 'discount')
      .map((r) => {
        const rel = byId.get(r.relatedLineId ?? '');
        return [rel?.serviceDate, rel?.category, r.category, -r.amountVnd] as const;
      })
      .sort((x, y) => `${x[0]}${x[1]}${x[2]}`.localeCompare(`${y[0]}${y[1]}${y[2]}`));
  };
  const totalOf = async (b: Booking) => (await folio(b)).totals.totalVnd as number;
  const requestReduction = async (
    b: Booking,
    lineId: string,
    amountVnd: number,
    kind: 'foc' | 'special_discount' = 'foc',
    who = 'fd',
  ) => {
    const r = await c[who]!.send('POST', url(`/folios/${b.folioId}/lines/${lineId}/foc`), {
      kind,
      amountVnd,
      reasonCode: kind === 'foc' ? 'service_recovery' : 'regular_vip',
    });
    expect(r.statusCode, r.body).toBe(201);
    return r.json() as Approval;
  };
  const decide = (who: string, id: string, verb: 'approve' | 'reject' = 'approve') =>
    c[who]!.send('POST', url(`/approval-requests/${id}/actions/${verb}`), {
      authMethod: 'password',
      secret: TEST_PASSWORD,
      ...(verb === 'reject' ? { reason: 'Không đủ lý do' } : {}),
    });
  const approved = async (
    b: Booking,
    lineId: string,
    amountVnd: number,
    kind?: 'foc' | 'special_discount',
  ) => {
    const r = await requestReduction(b, lineId, amountVnd, kind);
    const a = await decide('mgr', r.id);
    expect(a.statusCode, a.body).toBe(200);
    return a.json() as Approval;
  };
  /** One request as OWN sees it in the queue (S23 – the list carries the 0.3.7 FOC fields). */
  const approval = async (id: string, who = 'own'): Promise<Approval> => {
    const res = await c[who]!.get(url('/approval-requests?limit=100'));
    expect(res.statusCode, res.body).toBe(200);
    const row = (res.json().data as Approval[]).find((a) => a.id === id);
    expect(row, `approval ${id} visible to ${who}`).toBeDefined();
    return row as Approval;
  };
  const moneyLog = (entityId: string) =>
    q<{ action: string; after: Record<string, unknown> | null }>(
      `SELECT action, after FROM audit_event WHERE entity_id = $1 AND category = 'money' ORDER BY occurred_at, id`,
      [entityId],
    );
  /** B7 guest request through the preview (S4-21: the amount the desk showed). */
  const moveRoom = async (b: Booking, room: string) => {
    const qs = new URLSearchParams({
      roomId: ids.rooms[room] as string,
      reasonCode: 'guest_request',
    });
    const pv = await c.fd!.get(url(`/reservations/${b.id}/move-preview?${qs}`));
    expect(pv.statusCode, pv.body).toBe(200);
    const r = await act(b.id, 'move', {
      roomId: ids.rooms[room],
      reasonCode: 'guest_request',
      applyDifference: true,
      expectedDeltaVnd: pv.json().folioDeltaVnd,
    });
    expect(r.statusCode, r.body).toBe(200);
  };
  const moveDates = async (b: Booking, arrivalDate: string, departureDate: string) => {
    const r = await act(b.id, 'move', { arrivalDate, departureDate, reasonCode: 'guest_request' });
    expect(r.statusCode, r.body).toBe(200);
  };
  const patchPeople = async (b: Booking, body: Record<string, unknown>) => {
    const r = await c.fd!.send('PATCH', url(`/reservations/${b.id}`), body, {
      'if-match': `"${await version(b.id)}"`,
    });
    expect(r.statusCode, r.body).toBe(200);
  };
  const monthlyUsed = async (who: string) => {
    const res = await c[who]!.get(url('/approval-requests?limit=1'));
    return res.json().data[0]?.approverRemainingMonthlyVnd as number | undefined;
  };

  // ───────────── S4-02 (BUG-R2-056) ─────────────

  it('BR-434-07: FOC 100 % on 10/11 (402) follows 1.000.000 → 900.000 → back to 1.000.000 from the APPROVED amount – no re-approval', async () => {
    const o = oracle('BR-434-07');
    await at('2026-10-20T10:00:00+07:00');
    const b = await direct('402', '2026-11-10', '2026-11-13');
    const night = async () =>
      (await liveBy(b, 'room')).find((l) => l.serviceDate === '2026-11-10')!;
    expect((await night()).amountVnd).toBe(1_000_000);
    const ap = await approved(b, (await night()).id, o.input.approvedFocVnd as number);
    const seq = o.expected.focSequenceVnd as number[];
    const pays = o.expected.guestPaysSequenceVnd as number[];
    const check = async (i: number) => {
      const n = await night();
      expect(n.amountVnd).toBe((o.input.nightRateSequenceVnd as number[])[i]);
      const r = (await reductions(b)).filter((x) => x[0] === '2026-11-10');
      expect(r).toEqual([['2026-11-10', 'room', 'foc', seq[i]]]);
      expect(n.amountVnd - (seq[i] as number)).toBe(pays[i]);
      const a = await approval(ap.id);
      expect(a).toMatchObject({
        status: 'approved',
        focState: 'applied',
        effectiveAmountVnd: seq[i],
      });
      // stay_night (DATA): the night's discount = what is applied now.
      const [sn] = await q<{ discount_vnd: string }>(
        `SELECT discount_vnd::text FROM stay_night WHERE reservation_id = $1 AND stay_date = '2026-11-10'
            AND night_state <> 'void'`,
        [b.id],
      );
      expect(Number(sn!.discount_vnd)).toBe(seq[i]);
    };
    await check(0);
    await moveDates(b, '2026-11-10', '2026-11-17'); // 7 nights → BR-107 −10 %
    await check(1);
    await moveDates(b, '2026-11-10', '2026-11-16'); // 6 nights → full price again
    await check(2);
    // No second approval: one request, still the same.
    const [n] = await q<{ n: string }>(
      `SELECT count(*)::text AS n FROM approval_request WHERE target_id = $1 AND type = 'foc'`,
      [b.id],
    );
    expect(Number(n!.n)).toBe(1);
  });

  it('BR-434-08: extra-person FOC 150.000 on 20/1 (302): 4A → 3A+1C → 2A (dormant) → 4A (restored) = 3.051.000 → 2.951.000 → 2.751.000 → 3.051.000', async () => {
    const o = oracle('BR-434-08');
    await at('2026-10-20T10:00:00+07:00');
    const b = await direct('302', '2027-01-19', '2027-01-22', { adults: 4 });
    const fee = async () =>
      (await liveBy(b, 'extra_person')).find((l) => l.serviceDate === '2027-01-20');
    const ap = await approved(b, (await fee())!.id, 150_000);
    const totals = o.expected.totalSequenceVnd as number[];
    const focs = o.expected.focOnJan20SequenceVnd as number[];
    const states = o.expected.focStateSequence as string[];
    const check = async (i: number) => {
      expect(await totalOf(b)).toBe(totals[i]);
      const r = (await reductions(b)).filter((x) => x[1] === 'extra_person');
      expect(r).toEqual(focs[i] ? [['2027-01-20', 'extra_person', 'foc', focs[i]]] : []);
      const a = await approval(ap.id);
      expect(a).toMatchObject({
        status: 'approved',
        focState: states[i],
        effectiveAmountVnd: focs[i],
      });
    };
    await check(0);
    await patchPeople(b, { adults: 3, children6to11: 1 });
    await check(1);
    await patchPeople(b, { adults: 2, children6to11: 0 });
    await check(2);
    await patchPeople(b, { adults: 4, children6to11: 0 });
    await check(3);
    expect(await totalOf(b)).not.toBe(o.expected.wrongFinalTotalVnd);
    const log = (await moneyLog(ap.id)).map((e) => e.action);
    expect(log).toEqual(expect.arrayContaining(['folio.foc_dormant', 'folio.foc_restored']));
  });

  // ───────────── S4-18 (BUG-R2-059) ─────────────

  it('BR-434-09: a PENDING FOC 300.000 on 24/11 follows the re-priced line (792.000 → 713.000); the approval applies it – 4.905.000', async () => {
    const o = oracle('BR-434-09');
    await at('2026-10-20T10:00:00+07:00');
    const b = await direct('203', '2026-11-23', '2026-11-26');
    const n24 = async () => (await liveBy(b, 'room')).find((l) => l.serviceDate === '2026-11-24')!;
    const p = await requestReduction(b, (await n24()).id, o.input.requestedFocVnd as number);
    expect(p.status).toBe('pending');
    await moveDates(b, '2026-11-23', '2026-11-30');
    const line = await n24();
    expect(line.amountVnd).toBe(713_000);
    const queued = await approval(p.id);
    const note = o.expected.requestNoteRateVnd as { old: number; new: number };
    expect(queued).toMatchObject({
      status: 'pending',
      effectiveAmountVnd: 300_000,
      lineChangedNote: { oldLineVnd: note.old, newLineVnd: note.new, cause: 'move' },
    });
    // The "chờ duyệt" line follows the new line (folioLineId = the current FOC line).
    const pend = ((await folio(b)).lines as Line[]).find((l) => l.id === queued.folioLineId)!;
    expect(pend).toMatchObject({
      lineState: 'pending_approval',
      relatedLineId: line.id,
      amountVnd: -300_000,
    });
    expect((await folio(b)).pendingApprovals).toBe(1);
    const a = await decide('mgr', p.id);
    expect(a.statusCode, a.body).toBe(200);
    expect(a.json()).toMatchObject({
      status: 'approved',
      focState: 'applied',
      effectiveAmountVnd: 300_000,
    });
    const posted = ((await folio(b)).lines as Line[]).find((l) => l.id === a.json().folioLineId)!;
    expect(posted).toMatchObject({
      lineState: o.expected.focLineStatus,
      relatedLineId: line.id,
      amountVnd: -300_000,
    });
    expect(await totalOf(b)).toBe(o.expected.roomPayableVnd);
  });

  it('BR-434-10: a PENDING FOC on a night dropped without a counterpart is auto-cancelled, the requester and the approvers told, no limit used – 1.822.000', async () => {
    const o = oracle('BR-434-10');
    await at('2026-10-20T10:00:00+07:00');
    const b = await direct('203', '2026-12-03', '2026-12-06');
    const n3 = (await liveBy(b, 'room')).find((l) => l.serviceDate === '2026-12-03')!;
    const p = await requestReduction(b, n3.id, o.input.requestedFocVnd as number);
    const before = await monthlyUsed('fdl');
    await moveDates(b, '2026-12-04', '2026-12-06');
    const a = await approval(p.id);
    expect(a).toMatchObject({ status: o.expected.requestStatus, autoCancelReason: 'line_removed' });
    expect(await totalOf(b)).toBe(o.expected.roomPayableVnd);
    expect((await folio(b)).pendingApprovals).toBe(0);
    const told = await q<{ user_id: string }>(
      `SELECT user_id FROM staff_notification WHERE kind = 'approval_cancelled' AND ref_id = $1`,
      [p.id],
    );
    expect(told.map((x) => x.user_id)).toContain(t.users.fd!.id);
    expect(told.map((x) => x.user_id)).toContain(t.users.mgr!.id);
    expect(await monthlyUsed('fdl')).toBe(before);
    // A cancelled request cannot be decided any more.
    expect((await decide('mgr', p.id)).statusCode).toBe(409);
  });

  it('BR-433-03: an approved FOC 300.000 on 03/12 whose night is dropped without a counterpart → cancelled, audit folio.foc_cancelled, the lead gets the limit back – 1.822.000', async () => {
    const o = oracle('BR-433-03');
    await at('2026-12-01T09:00:00+07:00');
    const limit = o.input.monthlyLimitVnd as number;
    const remaining0 = (await monthlyUsed('fdl')) ?? limit;
    const b = await direct('202', '2026-12-03', '2026-12-06'); // 202 = same list price as 203
    const n3 = (await liveBy(b, 'room')).find((l) => l.serviceDate === '2026-12-03')!;
    // rbac 5.1: the special discount is MGR+ – the lead's monthly budget is exercised with a FOC (same BR-433).
    const r = await requestReduction(b, n3.id, o.input.approvedVnd as number);
    const a = await decide('fdl', r.id);
    expect(a.statusCode, a.body).toBe(200);
    expect(await monthlyUsed('fdl')).toBe(remaining0 - (o.input.approvedVnd as number));
    await moveDates(b, '2026-12-04', '2026-12-06');
    const after = await approval(r.id);
    expect(after).toMatchObject({
      status: 'approved',
      focState: 'cancelled',
      focCancelReason: 'night_removed',
      effectiveAmountVnd: 0,
    });
    expect((await moneyLog(r.id)).map((e) => e.action)).toContain(o.expected.auditEvent);
    expect(await monthlyUsed('fdl')).toBe(remaining0);
    expect(await reductions(b)).toEqual([]);
    expect(await totalOf(b)).toBe(o.expected.folioRoomTotalVnd);
  });

  // ───────────── S4-23 (BR-434 v0.3.6 – several reductions on one key, approval order) ─────────────

  it('BR-434-11: special discount 250.000 (approved first) + FOC 792.000 on 11/11, 401 → 302 → 101 → 401: 1.042.000 → 917.000 → 667.000 → 1.042.000, never a negative night', async () => {
    const o = oracle('BR-434-11');
    await at('2026-10-20T10:00:00+07:00');
    const b = await direct('401', '2026-11-11', '2026-11-13');
    const night = async () =>
      (await liveBy(b, 'room')).find((l) => l.serviceDate === '2026-11-11')!;
    const [d, f] = o.input.reductions as Array<{
      kind: 'foc' | 'special_discount';
      approvedVnd: number;
    }>;
    const disc = await approved(b, (await night()).id, d!.approvedVnd, d!.kind);
    const foc = await approved(b, (await night()).id, f!.approvedVnd, f!.kind);
    const rooms = o.input.roomSequence as string[];
    const totals = o.expected.roomTotalSequenceVnd as number[];
    const focSeq = o.expected.focAppliedSequenceVnd as number[];
    const discSeq = o.expected.specialDiscountAppliedSequenceVnd as number[];
    for (const [i, room] of rooms.entries()) {
      if (i > 0) await moveRoom(b, room);
      const n = await night();
      const r = (await reductions(b)).filter((x) => x[0] === '2026-11-11');
      expect(r).toEqual([
        ['2026-11-11', 'room', 'discount', discSeq[i]],
        ['2026-11-11', 'room', 'foc', focSeq[i]],
      ]);
      expect(n.amountVnd - (discSeq[i] as number) - (focSeq[i] as number)).toBe(
        (o.expected.reductionNightNetSequenceVnd as number[])[i],
      );
      expect(await totalOf(b)).toBe(totals[i]);
      expect((await approval(foc.id)).effectiveAmountVnd).toBe(focSeq[i]);
      expect((await approval(disc.id)).effectiveAmountVnd).toBe(discSeq[i]);
    }
    expect(totals[1]).not.toBe(o.expected.wrongIndependentMinRoomTotalAt302Vnd);
  });

  it('BR-434-11 (reversed order): FOC approved first, then the special discount – at 302 the split is FOC 792.000 + discount 125.000, the guest still pays 917.000', async () => {
    const o = oracle('BR-434-11');
    await at('2026-10-20T10:00:00+07:00');
    const b = await direct('401', '2026-11-18', '2026-11-20'); // Wed, Thu (same prices as 11–13/11)
    const night = async () =>
      (await liveBy(b, 'room')).find((l) => l.serviceDate === '2026-11-18')!;
    await approved(b, (await night()).id, 792_000, 'foc');
    await approved(b, (await night()).id, 250_000, 'special_discount');
    await moveRoom(b, '302');
    const split = o.expected.reversedOrderSplitAt302Vnd as { foc: number; specialDiscount: number };
    expect((await reductions(b)).filter((x) => x[0] === '2026-11-18')).toEqual([
      ['2026-11-18', 'room', 'discount', split.specialDiscount],
      ['2026-11-18', 'room', 'foc', split.foc],
    ]);
    expect(await totalOf(b)).toBe(o.expected.reversedOrderRoomTotalAt302Vnd);
  });

  it('BR-434-12: discount 250.000 approved, FOC 792.000 PENDING, move to 302 → queue "1.042.000 → 917.000, khi duyệt sẽ áp 667.000"; approve → 667.000 (917.000); nothing more can be asked; back to 401 → 792.000 (1.042.000)', async () => {
    const o = oracle('BR-434-12');
    await at('2026-10-20T10:00:00+07:00');
    const b = await direct('401', '2026-11-25', '2026-11-27'); // Wed, Thu
    const night = async () =>
      (await liveBy(b, 'room')).find((l) => l.serviceDate === '2026-11-25')!;
    await approved(b, (await night()).id, 250_000, 'special_discount');
    // S4-23 (6): at 401 the most that can still be asked = 1.042.000 − 250.000.
    const tooMuch = await c.fd!.send(
      'POST',
      url(`/folios/${b.folioId}/lines/${(await night()).id}/foc`),
      {
        kind: 'foc',
        amountVnd: (o.expected.maxRequestAt401Vnd as number) + 1_000,
        reasonCode: 'service_recovery',
      },
    );
    expect(tooMuch.statusCode).toBe(422);
    expect(tooMuch.json().max).toBe(o.expected.maxRequestAt401Vnd);
    const p = await requestReduction(b, (await night()).id, 792_000);
    await moveRoom(b, '302');
    const note = o.expected.queueNoteVnd as { oldLine: number; newLine: number; willApply: number };
    expect(await approval(p.id)).toMatchObject({
      status: 'pending',
      effectiveAmountVnd: note.willApply,
      lineChangedNote: { oldLineVnd: note.oldLine, newLineVnd: note.newLine },
    });
    const a = await decide('mgr', p.id);
    expect(a.statusCode, a.body).toBe(200);
    expect(a.json()).toMatchObject({
      status: o.expected.requestStatus,
      effectiveAmountVnd: o.expected.focAppliedAfterApprovalVnd,
      focState: 'applied',
    });
    expect(await totalOf(b)).toBe(o.expected.roomTotalAfterApprovalVnd);
    const more = await c.fd!.send(
      'POST',
      url(`/folios/${b.folioId}/lines/${(await night()).id}/foc`),
      {
        kind: 'foc',
        amountVnd: 1_000,
        reasonCode: 'service_recovery',
      },
    );
    expect(more.statusCode).toBe(422);
    expect(more.json().max).toBe(o.expected.maxNewRequestAt302Vnd);
    await moveRoom(b, '401');
    expect((await approval(p.id)).effectiveAmountVnd).toBe(
      o.expected.focAppliedAfterReturnTo401Vnd,
    );
    expect(await totalOf(b)).toBe(o.expected.roomTotalAfterReturnTo401Vnd);
  });

  // ───────────── S4-34 (BUG-R2-061) – late check-out: ONE key per stay (BR-412 v0.3.5) ─────────────

  const vacant = (room: string) =>
    q(
      `INSERT INTO room_status (room_id, organization_id, property_id, status, since) VALUES ($1, $2, $3, 'VC', $4)
       ON CONFLICT (room_id) DO UPDATE SET status = 'VC'`,
      [ids.rooms[room], t.organizationId, t.propertyIds[0], new Date('2026-10-01T00:00:00Z')],
    );
  const checkIn = async (b: Booking, time = '15:00') => {
    const due = (await folio(b)).totals.balanceDueVnd as number;
    if (due > 0) {
      const p = await c.fd!.send('POST', url(`/folios/${b.folioId}/payments`), {
        type: 'charge',
        method: 'cash',
        amountVnd: due,
      });
      expect(p.statusCode, p.body).toBe(201);
    }
    const r = await act(b.id, 'check-in', {
      cardsIssued: 1,
      houseRulesSent: true,
      checkinTime: time,
    });
    expect(r.statusCode, r.body).toBe(200);
  };
  /** B15 at `time` (the amount the desk saw – dryRun first); optional FOC request on the new charge. */
  const lateAt = async (b: Booking, time: string, focVnd?: number | 'all') => {
    const dry = await act(b.id, 'late-checkout', { checkoutTime: time, dryRun: true });
    expect(dry.statusCode, dry.body).toBe(200);
    const s = dry.json().surchargeVnd as number;
    const r = await act(b.id, 'late-checkout', {
      checkoutTime: time,
      ...(s > 0 ? { applySurcharge: true, expectedSurchargeVnd: s } : {}),
      ...(focVnd !== undefined
        ? {
            requestFocForSurcharge: {
              amountVnd: focVnd === 'all' ? s : focVnd,
              reasonCode: 'regular_vip',
            },
          }
        : {}),
    });
    expect(r.statusCode, r.body).toBe(200);
    return s;
  };
  const lateFoc = async (b: Booking) => {
    const late = await liveBy(b, 'late_checkout');
    const focs = (await liveLines(b)).filter(
      (l) =>
        (l.category === 'foc' || l.category === 'discount') &&
        late.some((x) => x.id === l.relatedLineId),
    );
    return {
      lateVnd: late.reduce((a, l) => a + l.amountVnd, 0),
      focVnd: focs.reduce((a, l) => a - l.amountVnd, 0),
    };
  };
  const lateRequest = async (b: Booking) =>
    (
      await q<{ id: string }>(
        `SELECT id FROM approval_request WHERE target_id = $1 AND type = 'foc' ORDER BY requested_at DESC LIMIT 1`,
        [b.id],
      )
    )[0]!.id;

  it('BR-412-15: late 15:00 + FOC (approved) → 12:30 inside the grace (FOC dormant) → 15:00 again: the FOC comes back from the approved amount, nothing to pay', async () => {
    const o = oracle('BR-412-15');
    await at('2026-11-16T15:00:00+07:00');
    await vacant('101');
    const b = await direct('101', '2026-11-16', '2026-11-17');
    await checkIn(b);
    await at('2026-11-17T09:00:00+07:00');
    const s15 = await lateAt(b, '15:00', 'all');
    const id = await lateRequest(b);
    expect((await decide('fdl', id)).statusCode).toBe(200);
    const states = o.expected.focStateSequence as string[];
    expect(await lateFoc(b)).toEqual({ lateVnd: s15, focVnd: s15 });
    expect((await approval(id)).focState).toBe(states[0]);
    expect(await lateAt(b, '12:30')).toBe(0);
    expect(await lateFoc(b)).toEqual({ lateVnd: 0, focVnd: 0 });
    expect(await approval(id)).toMatchObject({
      status: 'approved',
      focState: states[1],
      effectiveAmountVnd: 0,
    });
    expect(await lateAt(b, '15:00')).toBe(s15);
    expect(await lateFoc(b)).toEqual({ lateVnd: s15, focVnd: s15 }); // final guest pays 0
    expect(await approval(id)).toMatchObject({ focState: states[2], effectiveAmountVnd: s15 });
    const [n] = await q<{ n: string }>(
      `SELECT count(*)::text AS n FROM approval_request WHERE target_id = $1 AND type = 'foc'`,
      [b.id],
    );
    expect(Number(n!.n)).toBe(1); // reapprovalNeeded: false
  });

  it('BR-412-16: late 17:00 + FOC (approved, whole charge) → 15:00 (FOC = the 30 % charge) → 17:00 again: FOC back to the APPROVED amount, nothing to pay', async () => {
    await at('2026-11-18T15:00:00+07:00');
    await vacant('102');
    const b = await direct('102', '2026-11-18', '2026-11-19');
    await checkIn(b);
    await at('2026-11-19T09:00:00+07:00');
    const s17 = await lateAt(b, '17:00', 'all');
    const id = await lateRequest(b);
    expect((await decide('mgr', id)).statusCode).toBe(200);
    expect(await lateFoc(b)).toEqual({ lateVnd: s17, focVnd: s17 });
    const s15 = await lateAt(b, '15:00');
    expect(s15).toBeLessThan(s17);
    expect(await lateFoc(b)).toEqual({ lateVnd: s15, focVnd: s15 });
    expect(await lateAt(b, '17:00')).toBe(s17);
    expect(await lateFoc(b)).toEqual({ lateVnd: s17, focVnd: s17 }); // not s17 − s15 to pay
    expect((await approval(id)).effectiveAmountVnd).toBe(s17);
  });

  it('BR-412-17: FOC PENDING on the 15:00 charge → 17:00 → the lead approves: FOC = the asked 30 % on the new line, the rest due, the limit used once', async () => {
    const o = oracle('BR-412-17');
    await at('2026-11-23T15:00:00+07:00');
    await vacant('103');
    const b = await direct('103', '2026-11-23', '2026-11-24');
    await checkIn(b);
    await at('2026-11-24T09:00:00+07:00');
    const before = (await monthlyUsed('fdl')) as number;
    const s15 = await lateAt(b, '15:00', 'all');
    const id = await lateRequest(b);
    const s17 = await lateAt(b, '17:00');
    const queued = await approval(id);
    expect(queued).toMatchObject({
      status: 'pending',
      effectiveAmountVnd: s15,
      lineChangedNote: { oldLineVnd: s15, newLineVnd: s17, cause: 'checkout_time_change' },
    });
    const a = await decide('fdl', id);
    expect(a.statusCode, a.body).toBe(200);
    expect(a.json()).toMatchObject({ status: o.expected.requestStatus, focState: 'applied' });
    const posted = ((await folio(b)).lines as Line[]).find((l) => l.id === a.json().folioLineId)!;
    expect(posted.lineState).toBe(o.expected.focLineStatus);
    expect(await lateFoc(b)).toEqual({ lateVnd: s17, focVnd: s15 }); // guest pays s17 − s15
    expect(await monthlyUsed('fdl')).toBe(before - s15);
  });

  // ───────────── S4-22 (BUG-R2-060) – no-show suspends, restore brings back (BR-315 (g)) ─────────────

  it('BR-315-06: FOC 300.000 on 07/12 (103) → no-show 23:30 (suspended, out of the limit) → restored 01:30 by the night desk → 1.200.000, approved again in the limit', async () => {
    const o = oracle('BR-315-06');
    await at('2026-12-01T10:00:00+07:00');
    const remaining0 = (await monthlyUsed('fdl')) as number;
    const b = await direct('103', '2026-12-07', '2026-12-09');
    const n7 = (await liveBy(b, 'room')).find((l) => l.serviceDate === '2026-12-07')!;
    const r = await requestReduction(b, n7.id, 300_000);
    expect((await decide('fdl', r.id)).statusCode).toBe(200);
    expect(await totalOf(b)).toBe(o.expected.totalBeforeNoShowVnd);
    expect(await monthlyUsed('fdl')).toBe(remaining0 - 300_000);
    await at(o.input.noShowMarkedAt as string);
    const ns = await act(b.id, 'mark-no-show', { contactAttemptNote: 'Gọi 3 lần không nghe' });
    expect(ns.statusCode, ns.body).toBe(200);
    expect(await approval(r.id)).toMatchObject({
      status: 'approved',
      focState: o.expected.focWhileNoShow,
      effectiveAmountVnd: 0,
    });
    expect(await monthlyUsed('fdl')).toBe(remaining0);
    expect((await moneyLog(r.id)).map((e) => e.action)).toContain('folio.foc_suspended');
    await at(o.input.restoredAt as string);
    const rs = await act(b.id, 'restore-no-show', { reason: 'Khách đến muộn, xe trễ' });
    expect(rs.statusCode, rs.body).toBe(200);
    expect((await liveBy(b, 'room')).map((l) => l.serviceDate)).toEqual(
      o.expected.restoredNightDates,
    );
    expect(await reductions(b)).toEqual([['2026-12-07', 'room', 'foc', 300_000]]);
    const room = (await liveBy(b, 'room')).reduce((a, l) => a + l.amountVnd, 0) - 300_000;
    expect(room).toBe(o.expected.roomPayableAfterRestoreVnd);
    expect(await approval(r.id)).toMatchObject({
      status: o.expected.focApprovalStatus,
      focState: 'applied',
      effectiveAmountVnd: 300_000,
    });
    expect(await monthlyUsed('fdl')).toBe(remaining0 - 300_000);
    expect((await moneyLog(r.id)).map((e) => e.action)).toContain('folio.foc_restored');
  });

  it('S4-22: a PENDING FOC of a booking marked no-show is auto-cancelled (reservation_no_show) and the requester told', async () => {
    await at('2026-12-01T10:00:00+07:00');
    const b = await direct('102', '2026-12-07', '2026-12-09');
    const n7 = (await liveBy(b, 'room')).find((l) => l.serviceDate === '2026-12-07')!;
    const p = await requestReduction(b, n7.id, 200_000);
    await at('2026-12-07T23:30:00+07:00');
    const ns = await act(b.id, 'mark-no-show', { contactAttemptNote: 'Gọi 3 lần không nghe' });
    expect(ns.statusCode, ns.body).toBe(200);
    expect(await approval(p.id)).toMatchObject({
      status: 'cancelled',
      autoCancelReason: 'reservation_no_show',
    });
    const told = await q<{ user_id: string }>(
      `SELECT user_id FROM staff_notification WHERE kind = 'approval_cancelled' AND ref_id = $1`,
      [p.id],
    );
    expect(told.map((x) => x.user_id)).toContain(t.users.fd!.id);
  });

  // ───────────── S4-01 / S4-03 (BUG-R2-055) ─────────────

  it('S4-01: FOC 100 % on a night of a booking with a closer, B7 makes the night cheaper (BR-107) → 200 (no 500), FOC = min(approved, new price), commission on the net nights', async () => {
    await at('2026-10-20T10:00:00+07:00');
    const b = await direct('301', '2026-12-01', '2026-12-04', {
      directSource: 'sales_staff',
      closerUserId: t.users.sal!.id,
    });
    const n1 = (await liveBy(b, 'room')).find((l) => l.serviceDate === '2026-12-01')!;
    await approved(b, n1.id, n1.amountVnd);
    await moveDates(b, '2026-12-01', '2026-12-08'); // 7 nights → −10 %: the night is now below the FOC
    const night = (await liveBy(b, 'room')).find((l) => l.serviceDate === '2026-12-01')!;
    expect(night.amountVnd).toBeLessThan(n1.amountVnd);
    expect((await reductions(b)).filter((x) => x[0] === '2026-12-01')).toEqual([
      ['2026-12-01', 'room', 'foc', night.amountVnd],
    ]);
    const nights = await liveBy(b, 'room');
    const net = nights.reduce((a, l) => a + l.amountVnd, 0) - night.amountVnd;
    const [cm] = await q<{ base_amount_vnd: string; amount_vnd: string }>(
      `SELECT base_amount_vnd::text, amount_vnd::text FROM commission WHERE reservation_id = $1 AND status = 'projected'`,
      [b.id],
    );
    expect(Number(cm!.base_amount_vnd)).toBe(net);
    const sn = await q<{ room_revenue_vnd: string }>(
      `SELECT room_revenue_vnd::text FROM stay_night WHERE reservation_id = $1 AND night_state = 'sold'`,
      [b.id],
    );
    expect(sn.every((x) => Number(x.room_revenue_vnd) >= 0)).toBe(true);
    // Back to 3 nights: FOC back to 792.000 (approved), the night is free again.
    await moveDates(b, '2026-12-01', '2026-12-04');
    expect((await reductions(b)).filter((x) => x[0] === '2026-12-01')).toEqual([
      ['2026-12-01', 'room', 'foc', n1.amountVnd],
    ]);
  });

  it('S4-03: after B8 moves a FOC to another night, the commission base is read AFTER the move (net of the FOC on its new night)', async () => {
    await at('2026-10-20T10:00:00+07:00');
    const b = await direct('201', '2026-11-30', '2026-12-03', {
      directSource: 'sales_staff',
      closerUserId: t.users.sal!.id,
    });
    const n3 = (await liveBy(b, 'room')).find((l) => l.serviceDate === '2026-12-02')!;
    await approved(b, n3.id, 300_000);
    await moveDates(b, '2026-12-14', '2026-12-17'); // no date in common: night 3 → new night 3
    expect(await reductions(b)).toEqual([['2026-12-16', 'room', 'foc', 300_000]]);
    const nights = await liveBy(b, 'room');
    const [cm] = await q<{ base_amount_vnd: string }>(
      `SELECT base_amount_vnd::text FROM commission WHERE reservation_id = $1 AND status = 'projected'`,
      [b.id],
    );
    expect(Number(cm!.base_amount_vnd)).toBe(nights.reduce((a, l) => a + l.amountVnd, 0) - 300_000);
  });

  // ───────────── S4-13 – a decision racing a re-write of the line (B7 resync, B10, B11) ─────────────

  /**
   * BR-434 invariant (S4-18): never an `approved` request that is not applied, not dormant, not suspended and not
   * cancelled with a log; a live FOC line only for `applied`, on the CURRENT line of its key; a pending request
   * has exactly one "chờ duyệt" line; a cancelled one none.
   */
  const assertInvariant = async (b: Booking) => {
    const reqs = await q<{
      id: string;
      status: string;
      foc_state: string | null;
      amount_vnd: string;
    }>(
      `SELECT a.id, a.status, a.foc_state, a.amount_vnd::text FROM approval_request a
         JOIN folio_line f ON f.id = a.folio_line_id
        WHERE f.folio_id = $1 AND a.type IN ('foc', 'special_discount')`,
      [b.folioId],
    );
    const all = (await folio(b)).lines as Line[];
    const reversed = new Set(all.map((l) => l.reversalOfId).filter(Boolean));
    const isLive = (l: Line) => l.lineState === 'posted' && !l.reversalOfId && !reversed.has(l.id);
    for (const r of reqs) {
      const mine = all.filter((l) => l.approvalRequestId === r.id && !l.reversalOfId);
      const live = mine.filter(isLive);
      const pend = mine.filter((l) => l.lineState === 'pending_approval');
      if (r.status === 'approved') {
        expect(['applied', 'dormant', 'suspended', 'cancelled']).toContain(r.foc_state);
        if (r.foc_state === 'applied') {
          expect(live).toHaveLength(1);
          const rel = all.find((l) => l.id === live[0]!.relatedLineId)!;
          expect(isLive(rel), 'FOC on a live line').toBe(true);
          expect(-live[0]!.amountVnd).toBeLessThanOrEqual(
            Math.min(Number(r.amount_vnd), rel.amountVnd),
          );
        } else {
          expect(live).toHaveLength(0);
        }
        expect(pend).toHaveLength(0);
      } else if (r.status === 'pending' || r.status === 'escalated') {
        expect(pend).toHaveLength(1);
        expect(live).toHaveLength(0);
      } else {
        expect(pend).toHaveLength(0);
        expect(live).toHaveLength(0);
      }
    }
  };

  it('S4-13: approve ‖ B7 re-price (5 rounds) – whichever commits first, the later one reads it: FOC = min(asked, current line), invariant holds', async () => {
    await at('2026-10-20T10:00:00+07:00');
    for (let i = 0; i < 5; i += 1) {
      const from = `2027-02-${String(1 + i * 4).padStart(2, '0')}`;
      const to = `2027-02-${String(4 + i * 4).padStart(2, '0')}`;
      const longTo = `2027-02-${String(1 + i * 4 + 7).padStart(2, '0')}`;
      const b = await direct('402', from, to);
      const n1 = (await liveBy(b, 'room')).find((l) => l.serviceDate === from)!;
      const p = await requestReduction(b, n1.id, n1.amountVnd);
      const v = await version(b.id);
      const [ap, mv] = await Promise.all([
        decide('mgr', p.id),
        c.fd!.send(
          'POST',
          url(`/reservations/${b.id}/actions/move`),
          { arrivalDate: from, departureDate: longTo, reasonCode: 'guest_request' },
          { 'if-match': `"${v}"` },
        ),
      ]);
      expect(ap.statusCode, ap.body).toBe(200);
      expect(mv.statusCode, mv.body).toBe(200);
      await assertInvariant(b);
      const night = (await liveBy(b, 'room')).find((l) => l.serviceDate === from)!;
      expect(night.amountVnd).toBeLessThan(n1.amountVnd); // BR-107 −10 %
      expect((await reductions(b)).filter((x) => x[0] === from)).toEqual([
        [from, 'room', 'foc', Math.min(n1.amountVnd, night.amountVnd)],
      ]);
      // Cleanup: cancel so the next round has a free room.
      await act(b.id, 'cancel', { reasonCode: 'found_other' });
    }
  });

  it('S4-13: approve ‖ B10 cancel and approve ‖ B11 no-show – never an approved FOC applied on a void booking', async () => {
    for (const [i, verb] of (
      ['cancel', 'mark-no-show', 'cancel', 'mark-no-show'] as const
    ).entries()) {
      const day = 10 + i * 3;
      const from = `2027-03-${day}`;
      const to = `2027-03-${day + 2}`;
      await at('2027-02-20T10:00:00+07:00');
      const b = await direct('401', from, to);
      const n1 = (await liveBy(b, 'room')).find((l) => l.serviceDate === from)!;
      const p = await requestReduction(b, n1.id, 200_000);
      if (verb === 'mark-no-show') await at(`${from}T23:30:00+07:00`);
      const v = await version(b.id);
      const body =
        verb === 'cancel'
          ? { reasonCode: 'found_other' }
          : { contactAttemptNote: 'Gọi 3 lần không nghe' };
      const [ap, out] = await Promise.all([
        decide('mgr', p.id),
        c.fd!.send('POST', url(`/reservations/${b.id}/actions/${verb}`), body, {
          'if-match': `"${v}"`,
        }),
      ]);
      expect(out.statusCode, out.body).toBe(200);
      expect([200, 409]).toContain(ap.statusCode);
      await assertInvariant(b);
      const a = await approval(p.id);
      if (ap.statusCode === 200) {
        // Approved first, then the booking went void: cancelled (B10) / suspended (B11).
        expect(a.status).toBe('approved');
        expect(a.focState).toBe(verb === 'cancel' ? 'cancelled' : 'suspended');
      } else {
        expect(a).toMatchObject({
          status: 'cancelled',
          autoCancelReason: verb === 'cancel' ? 'reservation_cancelled' : 'reservation_no_show',
        });
      }
      expect(await reductions(b)).toEqual([]);
    }
  });

  // ───────────── S4-08 (BR-309 v0.3.4) – services on a cancellation / no-show ─────────────

  const addLine = async (b: Booking, body: Record<string, unknown>) => {
    const r = await c.fd!.send('POST', url(`/folios/${b.folioId}/lines`), body);
    expect(r.statusCode, r.body).toBe(201);
    const all = (await folio(b)).lines as Line[];
    return all.filter((l) => l.category === body.category).at(-1) as Line;
  };

  it('S4-08: cancellation dry run lists the services (net of FOC), retainLines keep one (reason required), the save reverses the others with their FOC – dry run = write', async () => {
    await at('2026-10-20T10:00:00+07:00');
    const b = await direct('202', '2026-12-21', '2026-12-23');
    const pickup = await addLine(b, {
      category: 'fnb',
      description: 'Đón sân bay',
      quantity: 1,
      unitPriceVnd: 300_000,
      serviceDate: '2026-12-21',
    });
    const fee = await addLine(b, {
      category: 'service_fee',
      description: 'Trang trí sinh nhật',
      quantity: 1,
      unitPriceVnd: 200_000,
      serviceDate: '2026-12-22',
    });
    const focOnFee = await approved(b, fee.id, 100_000);
    const cancel = (body: Record<string, unknown>, headers: Record<string, string> = {}) =>
      c.fd!.send('POST', url(`/reservations/${b.id}/actions/cancel`), body, headers);
    const dry = await cancel({ reasonCode: 'found_other', dryRun: true });
    expect(dry.statusCode, dry.body).toBe(200);
    const q0 = dry.json().cancellation;
    expect(
      (q0.serviceLines as Array<Record<string, unknown>>).map((x) => [
        x.lineId,
        x.category,
        x.amountVnd,
        x.performed,
        x.retained,
      ]),
    ).toEqual([
      [pickup.id, 'fnb', 300_000, false, false],
      [fee.id, 'service_fee', 100_000, false, false],
    ]);
    expect(q0).toMatchObject({ serviceReversedVnd: 400_000, serviceRetainedVnd: 0 });
    const bad = await cancel({
      reasonCode: 'found_other',
      dryRun: true,
      retainLines: [
        { lineId: (await liveBy(b, 'room'))[0]!.id, reason: 'Không phải dịch vụ' },
        { lineId: pickup.id, reason: 'ab' },
      ],
    });
    expect(bad.statusCode).toBe(422);
    expect(bad.json().errors).toEqual([
      { field: 'retainLines[0].lineId', code: 'NOT_IN_LIST' },
      { field: 'retainLines[1].reason', code: 'REASON_REQUIRED' },
    ]);
    const keep = [{ lineId: pickup.id, reason: 'Xe đã đón khách' }];
    const dry2 = (
      await cancel({ reasonCode: 'found_other', dryRun: true, retainLines: keep })
    ).json().cancellation;
    expect(dry2).toMatchObject({ serviceReversedVnd: 100_000, serviceRetainedVnd: 300_000 });
    expect(dry2.serviceLines[0]).toMatchObject({ retained: true, retainReason: 'Xe đã đón khách' });
    const done = await cancel(
      { reasonCode: 'found_other', retainLines: keep },
      { 'if-match': `"${await version(b.id)}"` },
    );
    expect(done.statusCode, done.body).toBe(200);
    expect(done.json().cancellation).toMatchObject({
      serviceReversedVnd: 100_000,
      serviceRetainedVnd: 300_000,
      refundRequestVnd: dry2.refundRequestVnd,
    });
    expect((await liveBy(b, 'fnb')).map((l) => l.id)).toEqual([pickup.id]);
    expect(await liveBy(b, 'service_fee')).toEqual([]);
    expect(await approval(focOnFee.id)).toMatchObject({
      status: 'approved',
      focState: 'cancelled',
      focCancelReason: 'reservation_cancelled',
    });
    expect(await reductions(b)).toEqual([]);
  });

  it('S4-08: no-show reverses the services too (BR-309 "áp cả no-show"), retainLines keep one; a bad line → 422 and nothing changes', async () => {
    await at('2027-01-05T10:00:00+07:00');
    const b = await direct('203', '2027-01-11', '2027-01-13');
    const pickup = await addLine(b, {
      category: 'fnb',
      description: 'Đón sân bay',
      quantity: 1,
      unitPriceVnd: 300_000,
      serviceDate: '2027-01-11',
    });
    const dinner = await addLine(b, {
      category: 'fnb',
      description: 'Bữa tối',
      quantity: 1,
      unitPriceVnd: 250_000,
      serviceDate: '2027-01-11',
    });
    await at('2027-01-11T23:30:00+07:00');
    const bad = await act(b.id, 'mark-no-show', {
      contactAttemptNote: 'Gọi 3 lần không nghe',
      retainLines: [{ lineId: (await liveBy(b, 'room'))[0]!.id, reason: 'Sai dòng' }],
    });
    expect(bad.statusCode).toBe(422);
    expect((await c.fd!.get(url(`/reservations/${b.id}`))).json().status).toBe('confirmed');
    const ok = await act(b.id, 'mark-no-show', {
      contactAttemptNote: 'Gọi 3 lần không nghe',
      retainLines: [{ lineId: pickup.id, reason: 'Xe đã ra sân bay' }],
    });
    expect(ok.statusCode, ok.body).toBe(200);
    expect((await liveBy(b, 'fnb')).map((l) => l.id)).toEqual([pickup.id]);
    expect((await liveBy(b, 'fnb')).some((l) => l.id === dinner.id)).toBe(false);
  });

  // ───────────── 0.3.7 bổ sung 1 – Reservation.depositNotices[] reader (payments, ARC 11.3 (2)) ─────────────

  it('depositNotices reader: newest first, updatedAt of the last report, createdByName, status', async () => {
    await at('2026-10-20T10:00:00+07:00');
    const b = await direct('101', '2027-02-22', '2027-02-24');
    const ins = (id: string, amount: number, status: string, at: string, upd: string | null) =>
      q(
        `INSERT INTO deposit_notice (id, organization_id, property_id, reservation_id, amount_vnd, note, status,
           created_at, created_by, updated_at)
         VALUES ($1, $2, $3, $4, $5, 'CK lúc 9h', $6, $7, $8, $9)`,
        [
          id,
          t.organizationId,
          t.propertyIds[0],
          b.id,
          amount,
          status,
          at,
          t.users.sal!.id,
          upd ?? at,
        ],
      );
    const a = uuidv7();
    const c2 = uuidv7();
    await ins(a, 500_000, 'handled', '2026-10-20T02:00:00Z', null);
    await ins(c2, 700_000, 'open', '2026-10-20T03:00:00Z', '2026-10-20T04:30:00Z');
    const out = await db.withContext(t.ctx(), (tx) => readDepositNotices(tx, b.id));
    expect(out.map((n) => [n.id, n.amountVnd, n.status])).toEqual([
      [c2, 700_000, 'open'],
      [a, 500_000, 'handled'],
    ]);
    expect(out[0]).toMatchObject({
      note: 'CK lúc 9h',
      attachmentId: null,
      createdAt: '2026-10-20T10:00:00.000+07:00',
      updatedAt: '2026-10-20T11:30:00.000+07:00',
      createdByName: expect.any(String),
    });
  });

  // ───────────── S4-37 (round-5 MONEY note) – cap of the OTA penalty ─────────────

  it('S4-37: the OTA penalty is capped by the OTA room amount (not + the desk extra-person fee): above → 422 VALUE_OUT_OF_RANGE, equal → 200', async () => {
    await at('2026-10-20T10:00:00+07:00');
    const res = await c.fd!.send('POST', url('/reservations'), {
      roomId: ids.rooms['102'],
      channelId: ids.channels.agoda,
      adults: 2,
      bookerGuestId: guest,
      paymentModel: 'ota_prepaid',
      otaRef: `AG${randomUUID().slice(0, 8)}`,
      otaRoomAmountVnd: 1_800_000,
      arrivalDate: '2027-02-01',
      departureDate: '2027-02-03',
    });
    expect(res.statusCode, res.body).toBe(201);
    const b = res.json() as Booking;
    const cancel = async (otaPenaltyVnd: number) =>
      c.fd!.send(
        'POST',
        url(`/reservations/${b.id}/actions/cancel`),
        { reasonCode: 'ota_cancelled', otaPenaltyVnd },
        { 'if-match': `"${await version(b.id)}"` },
      );
    const over = await cancel(1_800_001);
    expect(over.statusCode).toBe(422);
    expect(over.json().errors).toContainEqual({
      field: 'otaPenaltyVnd',
      code: 'VALUE_OUT_OF_RANGE',
    });
    const ok = await cancel(1_800_000);
    expect(ok.statusCode, ok.body).toBe(200);
    expect(ok.json().cancellation).toMatchObject({ retainedVnd: 1_800_000, refundRequestVnd: 0 });
  });
});
