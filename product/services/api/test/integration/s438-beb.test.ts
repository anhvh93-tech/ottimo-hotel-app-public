/**
 * BE-B Sprint 4 – S4-38 "Phản hồi & sửa" (rounds/round-02/reviews/s4-38-findings-raw.md) on the real PostgreSQL
 * through HTTP, from the skeptic scenarios and DOM's oracle (business-rules v0.3.8):
 * - S438-FOC-01 + BUG-R2-095 (S4-50): a minibar recount keeps the line when the count did not change and posts a
 *   changed count as the REPLACEMENT of the old line – the FOC follows min(approved, new line) (BR-434);
 * - S438-FOC-03 (BR-434-14): the OTA room-change difference is a key per night – no-show suspends its FOC, B12
 *   brings it back;
 * - S438-FOC-04: a second guest move re-posts the difference – the FOC follows the night (write), and
 *   previewStayReductions({ differences: true }) gives the same FOC change (preview = write);
 * - S438-CANCEL-03: B12 cancels the refund request the no-show created above the overpayment and resolves
 *   "Cần chú ý" closed_reservation_credit;
 * - S438-CANCEL-04: cancel dry run and write return the same refundRequestVnd (request already open = excess).
 * Fake clock and FAKE data only.
 */
import { randomBytes, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { v7 as uuidv7 } from 'uuid';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
import { ApprovalService } from '../../src/modules/approvals/public/approval.service';
import { FolioService } from '../../src/modules/folio/public/folio.service';
import {
  NoGuestAccessPort,
  NoMinibarPort,
  UnwiredChildDataPort,
} from '../../src/modules/frontdesk/internal/default-ports';
import { FrontdeskPorts } from '../../src/modules/frontdesk/internal/stay-support';
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

const ROLES = { own: ['owner'], mgr: ['manager'], fdl: ['front_desk_lead'], fd: ['front_desk'] };

interface Oracle {
  id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  input: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  expected: Record<string, any>;
}
const ORACLES = JSON.parse(
  readFileSync(join(__dirname, '../../../../tests/fixtures/br-examples.json'), 'utf8'),
) as { examples: Oracle[] };
const oracle = (id: string): Oracle => {
  const o = ORACLES.examples.find((x) => x.id === id);
  if (!o) throw new Error(`oracle ${id} missing`);
  return o;
};
const DS_E = JSON.parse(
  readFileSync(join(__dirname, '../../../../tests/fixtures/seed/ds-e.json'), 'utf8'),
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

type Booking = { id: string; code: string; version: number; folioId: string };
type Line = {
  id: string;
  category: string;
  amountVnd: number;
  serviceDate?: string;
  relatedLineId?: string;
  reversalOfId?: string;
  lineState: string;
};

describe.skipIf(!HAS_DB)('S4-38 fixes (BE-B): FOC-01, FOC-03, FOC-04, CANCEL-03, CANCEL-04', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let ids: BookingIds;
  let guest: string;
  const c: Record<string, Client> = {};
  const items: Record<string, string> = {};

  beforeAll(async () => {
    db = appDatabase(6);
    t = await createTenant(db, { users: ROLES });
    ids = await seedBooking(db, t);
    guest = await seedGuestRow(db, t, { name: 'Khách Thử S438' });
    await db.withContext(t.ctx(), async (tx) => {
      for (const m of DS_E.minibarItems) {
        const id = uuidv7();
        items[m.code] = id;
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
            m.salePriceVnd,
            m.standardQtyPerRoom,
            new Date('2026-10-01T00:00:00Z'),
          ],
        );
      }
    });
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
          new Date('2029-06-30T00:00:00Z'),
        ],
      ),
    );
    c.fd!.deviceToken = token;
    c.fdl!.deviceToken = token;
    for (const u of Object.keys(ROLES)) await setPassword(db, t, u);
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
  const act = async (id: string, verb: string, body: unknown, who = 'fd') =>
    c[who]!.send('POST', url(`/reservations/${id}/actions/${verb}`), body, {
      'if-match': `"${(await get(id)).version}"`,
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
  const direct = (room: string, from: string, to: string, deposit = 100_000) =>
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
  const agoda = (room: string, from: string, to: string, amount: number) =>
    create({
      roomId: ids.rooms[room],
      channelId: ids.channels.agoda,
      adults: 2,
      bookerGuestId: guest,
      paymentModel: 'ota_prepaid',
      otaRef: `AG${randomUUID().slice(0, 8)}`,
      otaRoomAmountVnd: amount,
      arrivalDate: from,
      departureDate: to,
    });
  const folio = async (b: Booking) => (await c.fd!.get(url(`/folios/${b.folioId}`))).json();
  const totals = async (b: Booking) => (await folio(b)).totals as Record<string, number>;
  const allLines = async (b: Booking) => (await folio(b)).lines as Line[];
  const liveLines = async (b: Booking) => {
    const all = await allLines(b);
    const reversed = new Set(all.map((l) => l.reversalOfId).filter(Boolean));
    return all.filter((l) => l.lineState === 'posted' && !l.reversalOfId && !reversed.has(l.id));
  };
  const liveBy = async (b: Booking, category: string) =>
    (await liveLines(b))
      .filter((l) => l.category === category)
      .sort((x, y) => String(x.serviceDate).localeCompare(String(y.serviceDate)));
  /** Σ of the live lines of a category and of the live reductions on them. */
  const netOf = async (b: Booking, category: string) => {
    const live = await liveLines(b);
    const own = new Set(live.filter((l) => l.category === category).map((l) => l.id));
    return live
      .filter((l) => own.has(l.id) || (!!l.relatedLineId && own.has(l.relatedLineId)))
      .reduce((a, l) => a + l.amountVnd, 0);
  };
  const decide = (who: string, id: string) =>
    c[who]!.send('POST', url(`/approval-requests/${id}/actions/approve`), {
      authMethod: 'password',
      secret: TEST_PASSWORD,
    });
  const focOn = async (b: Booking, lineId: string, amountVnd: number, approver = 'mgr') => {
    const r = await c.fd!.send('POST', url(`/folios/${b.folioId}/lines/${lineId}/foc`), {
      kind: 'foc',
      amountVnd,
      reasonCode: 'service_recovery',
    });
    expect(r.statusCode, r.body).toBe(201);
    const a = await decide(approver, r.json().id);
    expect(a.statusCode, a.body).toBe(200);
    return r.json().id as string;
  };
  const request = async (id: string) =>
    (
      await q<{
        status: string;
        foc_state: string | null;
        foc_cancel_reason: string | null;
        auto_cancel_reason: string | null;
      }>(
        `SELECT status, foc_state, foc_cancel_reason, auto_cancel_reason FROM approval_request WHERE id = $1`,
        [id],
      )
    )[0]!;
  const vacant = (room: string) =>
    q(
      `INSERT INTO room_status (room_id, organization_id, property_id, status, since) VALUES ($1, $2, $3, 'VC', $4)
       ON CONFLICT (room_id) DO UPDATE SET status = 'VC'`,
      [ids.rooms[room], t.organizationId, t.propertyIds[0], new Date('2026-10-01T00:00:00Z')],
    );
  const checkIn = async (b: Booking) => {
    const due = (await totals(b)).balanceDueVnd as number;
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
      checkinTime: '15:00',
    });
    expect(r.statusCode, r.body).toBe(200);
  };
  const minibarCheck = async (b: Booking, used: Record<string, number>) => {
    const r = await c.fd!.send('POST', url(`/reservations/${b.id}/minibar-checks`), {
      mode: 'checkout',
      lines: DS_E.minibarItems.map((m) => ({
        itemId: items[m.code],
        remainingQty: m.standardQtyPerRoom - (used[m.code] ?? 0),
      })),
    });
    expect(r.statusCode, r.body).toBe(201);
  };
  const moveRoom = async (b: Booking, room: string) => {
    const body = { roomId: ids.rooms[room] as string, reasonCode: 'guest_request' };
    const pv = await c.fd!.get(
      url(`/reservations/${b.id}/move-preview?${new URLSearchParams(body)}`),
    );
    expect(pv.statusCode, pv.body).toBe(200);
    const r = await act(b.id, 'move', {
      ...body,
      applyDifference: true,
      expectedDeltaVnd: pv.json().folioDeltaVnd,
    });
    expect(r.statusCode, r.body).toBe(200);
  };

  // ───────────── S438-FOC-01 + BUG-R2-095: minibar recount ─────────────

  it('FOC-01 / BUG-R2-095: same count → the line and its FOC stay (no reversal); after B18 the FOC is still applied, the guest pays 35.000 for 2 beers', async () => {
    await at('2026-11-16T15:00:00+07:00');
    await vacant('201');
    const b = await direct('201', '2026-11-16', '2026-11-17');
    await checkIn(b);
    await at('2026-11-17T09:00:00+07:00');
    await minibarCheck(b, { bia: 2 });
    const beer = (await liveBy(b, 'minibar'))[0]!;
    expect(beer.amountVnd).toBe(70_000);
    const self = await c.fd!.send('POST', url(`/folios/${b.folioId}/lines/${beer.id}/foc`), {
      kind: 'foc',
      amountVnd: 35_000,
      reasonCode: 'regular_vip',
      authMethod: 'password',
      secret: TEST_PASSWORD,
    });
    expect(self.statusCode, self.body).toBe(201);
    expect(self.json().status).toBe('approved'); // BR-436 self-application
    const reversalsBefore = (await allLines(b)).filter((l) => l.reversalOfId).length;
    await minibarCheck(b, { bia: 2 }); // H16 step 1 again
    expect((await liveBy(b, 'minibar')).map((l) => l.id)).toEqual([beer.id]);
    expect((await allLines(b)).filter((l) => l.reversalOfId).length).toBe(reversalsBefore);
    expect((await request(self.json().id)).foc_state).toBe('applied');
    await at('2026-11-17T11:00:00+07:00');
    const s = await c.fd!.get(url(`/reservations/${b.id}/checkout-summary?checkoutTime=11:00`));
    expect(s.statusCode, s.body).toBe(200);
    expect(s.json().amountDueAtCheckoutVnd).toBe(35_000);
    const out = await act(b.id, 'check-out', {
      checkoutTime: '11:00',
      finalPayment: { type: 'charge', method: 'cash', amountVnd: 35_000 },
    });
    expect(out.statusCode, out.body).toBe(200);
    expect((await request(self.json().id)).foc_state).toBe('applied');
    expect(await netOf(b, 'minibar')).toBe(35_000);
  });

  it('FOC-01: approved FOC 70.000 on 2 beers, recount 1 beer → the new line replaces the old one, FOC = min(70.000, 35.000) = 35.000; recount 0 → dormant', async () => {
    await at('2026-11-18T15:00:00+07:00');
    await vacant('202');
    const b = await direct('202', '2026-11-18', '2026-11-19');
    await checkIn(b);
    await at('2026-11-19T09:00:00+07:00');
    await minibarCheck(b, { bia: 2 });
    const beer = (await liveBy(b, 'minibar'))[0]!;
    const foc = await focOn(b, beer.id, 70_000, 'fdl');
    await minibarCheck(b, { bia: 1 });
    const now = await liveBy(b, 'minibar');
    expect(now.map((l) => l.amountVnd)).toEqual([35_000]);
    expect(now[0]!.relatedLineId).toBe(beer.id);
    expect((await request(foc)).foc_state).toBe('applied');
    expect(await netOf(b, 'minibar')).toBe(0);
    await minibarCheck(b, {});
    expect(await liveBy(b, 'minibar')).toEqual([]);
    expect((await request(foc)).foc_state).toBe('dormant');
  });

  // ───────────── S438-FOC-03 (BR-434-14) / FOC-04: difference = key per night ─────────────

  it('FOC-03 / BR-434-14: FOC on the 1st night difference – no-show → suspended, B12 → applied 250.000, due back to 250.000', async () => {
    const o = oracle('BR-434-14');
    const [from, to] = o.input.stay as [string, string];
    await at('2027-11-20T10:00:00+07:00');
    const b = await agoda('203', from, to, 1_600_000);
    await moveRoom(b, '401');
    const diffs = await liveBy(b, 'room_change_difference');
    expect(Object.fromEntries(diffs.map((l) => [l.serviceDate, l.amountVnd]))).toEqual(
      o.input.roomChangeDifferenceByDateVnd,
    );
    const [date, amount] = Object.entries(o.input.approvedFocVnd as Record<string, number>)[0]!;
    const foc = await focOn(b, diffs.find((l) => l.serviceDate === date)!.id, amount);
    await at(`${from}T23:30:00+07:00`);
    const ns = await act(b.id, 'mark-no-show', { contactAttemptNote: 'Gọi 3 lần không nghe' });
    expect(ns.statusCode, ns.body).toBe(200);
    expect((await request(foc)).foc_state).toBe(o.expected.focStateAfterNoShow);
    const rs = await act(b.id, 'restore-no-show', { reason: 'Khách đến muộn, xe trễ' }, 'mgr');
    expect(rs.statusCode, rs.body).toBe(200);
    expect((await request(foc)).foc_state).toBe('applied');
    const live = await liveLines(b);
    const onDiff = live.filter(
      (l) =>
        l.category === 'foc' &&
        live.some((d) => d.id === l.relatedLineId && d.category === 'room_change_difference'),
    );
    expect(onDiff.reduce((a, l) => a - l.amountVnd, 0)).toBe(o.expected.focAppliedAfterRestoreVnd);
    expect((await totals(b)).balanceDueVnd).toBe(o.expected.dueAfterRestoreVnd);
  });

  it('FOC-04: second guest move 401 → 402 re-posts the difference – FOC = min(250.000, 208.000) on the night; previewStayReductions(differences) gives the same FOC change', async () => {
    await at('2027-11-20T10:00:00+07:00');
    const b = await agoda('203', '2027-12-20', '2027-12-22', 1_600_000);
    await moveRoom(b, '401');
    const d1 = (await liveBy(b, 'room_change_difference')).find(
      (l) => l.serviceDate === '2027-12-20',
    )!;
    expect(d1.amountVnd).toBe(250_000);
    const foc = await focOn(b, d1.id, 250_000, 'fdl');
    // the move planner (BE-A) passes the differences after the change: 402 → 208.000 a night (seed rates)
    const folios = fa.app.get(FolioService);
    const pv = await db.withContext(t.ctx(), async (tx) => {
      const nights = (await folios.lines(tx, b.folioId))
        .filter((l) => l.category === 'room' && l.stay_night_id)
        .map((l) => ({
          date: l.service_date as string,
          roomVnd: l.amount_vnd,
          extraPersonVnd: 0,
          differenceVnd: 208_000,
        }));
      return folios.previewStayReductions(tx, b.folioId, b.id, nights, { differences: true });
    });
    expect(pv.oldAppliedVnd).toBe(250_000);
    expect(pv.newAppliedVnd).toBe(208_000);
    expect(pv.byDate.get('2027-12-20')?.differenceFocVnd).toBe(208_000);
    // without `differences` the preview keeps its former totals (callers not re-pricing differences)
    const plain = await db.withContext(t.ctx(), async (tx) =>
      folios.previewStayReductions(tx, b.folioId, b.id, [
        { date: '2027-12-20', roomVnd: 800_000, extraPersonVnd: 0 },
        { date: '2027-12-21', roomVnd: 800_000, extraPersonVnd: 0 },
      ]),
    );
    expect([plain.oldAppliedVnd, plain.newAppliedVnd]).toEqual([0, 0]);
    await moveRoom(b, '402');
    expect((await liveBy(b, 'room_change_difference')).map((l) => l.amountVnd)).toEqual([
      208_000, 208_000,
    ]);
    expect((await request(foc)).foc_state).toBe('applied');
    expect(await netOf(b, 'room_change_difference')).toBe(208_000);
    expect((await totals(b)).balanceDueVnd).toBe(208_000);
  });

  // ───────────── S438-CANCEL-03 / CANCEL-04 ─────────────

  it('CANCEL-03: no-show keeps 500.000, refund 300.000 + attention; FD restores (B12) → request auto-cancelled (superseded, requester told), attention resolved, due = total − paid', async () => {
    await at('2026-10-20T10:00:00+07:00');
    const b = await direct('201', '2026-11-20', '2026-11-22', 800_000);
    const total = (await get(b.id)).totalRoomVnd as number;
    await at('2026-11-20T23:30:00+07:00');
    const ns = await act(b.id, 'mark-no-show', { contactAttemptNote: 'Gọi 3 lần không nghe' });
    expect(ns.statusCode, ns.body).toBe(200);
    const refunds = () =>
      q<{ id: string; status: string; amount_vnd: string; auto_cancel_reason: string | null }>(
        `SELECT id, status, amount_vnd::text, auto_cancel_reason FROM approval_request
          WHERE type = 'refund' AND target_id = $1 ORDER BY requested_at`,
        [b.id],
      );
    const before = await refunds();
    expect(before.map((r) => [r.status, Number(r.amount_vnd)])).toEqual([['pending', 300_000]]);
    const attention = () =>
      q<{ resolved_at: Date | null }>(
        `SELECT resolved_at FROM attention_event WHERE dedupe_key = $1`,
        [`closed_reservation_credit:${b.id}`],
      );
    expect((await attention()).some((a) => a.resolved_at === null)).toBe(true);
    await at('2026-11-21T01:30:00+07:00');
    const rs = await act(b.id, 'restore-no-show', { reason: 'Khách đến muộn, xe trễ' });
    expect(rs.statusCode, rs.body).toBe(200);
    const after = await refunds();
    expect(after.map((r) => [r.status, r.auto_cancel_reason])).toEqual([
      ['cancelled', 'superseded'],
    ]);
    expect((await attention()).every((a) => a.resolved_at !== null)).toBe(true);
    expect((await totals(b)).balanceDueVnd).toBe(total - 800_000);
    const told = await q<{ user_id: string }>(
      `SELECT user_id FROM staff_notification WHERE kind = 'approval_cancelled' AND ref_id = $1`,
      [before[0]!.id],
    );
    expect(told.length).toBeGreaterThan(0);
  });

  it('CANCEL-04 / BR-522-05 (b): open request 300.000 = excess → dry run and write both refundRequestVnd 0, the open request linked', async () => {
    const o = oracle('BR-522-05');
    await at('2026-10-20T10:00:00+07:00');
    const b = await direct(o.input.roomNo, o.input.arrivalDate, '2026-11-13', 1_000_000);
    const approvals = fa.app.get(ApprovalService);
    const open = await db.withContext(t.ctx(), (tx) =>
      approvals.submit(
        tx,
        { userId: t.users.fd!.id, roles: ['front_desk'] },
        {
          type: 'refund',
          amountVnd: 300_000,
          reasonCode: 'overpayment',
          targetType: 'reservation',
          targetId: b.id,
          targetCode: b.code,
        },
      ),
    );
    await at('2026-11-08T10:00:00+07:00');
    const dry = await c.fd!.send('POST', url(`/reservations/${b.id}/actions/cancel`), {
      reasonCode: 'found_other',
      dryRun: true,
    });
    expect(dry.statusCode, dry.body).toBe(200);
    const r = await act(b.id, 'cancel', { reasonCode: 'found_other' });
    expect(r.statusCode, r.body).toBe(200);
    expect(dry.json().cancellation.refundRequestVnd).toBe(o.expected.newRefundRequestVnd.b);
    expect(r.json().cancellation.refundRequestVnd).toBe(dry.json().cancellation.refundRequestVnd);
    expect(r.json().cancellation.refundApprovalRequestId).toBe(open.id);
  });
});
