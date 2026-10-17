/**
 * BE-B Sprint 4 – DOM confirmations of the close of a booking (business-rules v0.3.8, oracle rows with
 * `pendingFix: DOM-S4-12…15`) on the real PostgreSQL through HTTP:
 * - DOM-S4-12 (BR-309-09): `performed` hint – cancel: service date < business date; no-show: ≤;
 * - DOM-S4-13 (BR-429-17): the OTA room-change difference of a voided night is reversed with it (cancel / no-show)
 *   and comes back with the night at B12;
 * - DOM-S4-14 (BR-522-05, BE-B part): open refund requests below the overpayment → supplementary request; above
 *   it → the pending ones auto-cancelled (requester told) and one request of the right amount again;
 * - DOM-S4-15 (BR-434-13): FOC on a service the desk KEPT – cancel → cancelled (the guest pays the line), no-show →
 *   suspended (back at B12); not kept → reversed with its line.
 * Fake clock and FAKE data only.
 */
import { randomBytes, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { v7 as uuidv7 } from 'uuid';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
import { ApprovalService } from '../../src/modules/approvals/public/approval.service';
import { FolioService, SERVICE_CATEGORIES } from '../../src/modules/folio/public/folio.service';
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
  pendingFix?: string;
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

type Booking = {
  id: string;
  code: string;
  version: number;
  folioId: string;
  depositRequiredVnd?: number;
};
type Line = {
  id: string;
  category: string;
  amountVnd: number;
  serviceDate?: string;
  relatedLineId?: string;
  reversalOfId?: string;
  lineState: string;
};

describe.skipIf(!HAS_DB)('close of a booking – DOM-S4-12…15 (BE-B Sprint 4, v0.3.8)', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let ids: BookingIds;
  let guest: string;
  const c: Record<string, Client> = {};

  beforeAll(async () => {
    db = appDatabase(6);
    t = await createTenant(db, { users: ROLES });
    ids = await seedBooking(db, t);
    guest = await seedGuestRow(db, t, { name: 'Khách Thử Hủy' });
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
    const res = await c.fd!.send('POST', url('/reservations'), body);
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
  const liveLines = async (b: Booking) => {
    const all = (await folio(b)).lines as Line[];
    const reversed = new Set(all.map((l) => l.reversalOfId).filter(Boolean));
    return all.filter((l) => l.lineState === 'posted' && !l.reversalOfId && !reversed.has(l.id));
  };
  const liveBy = async (b: Booking, category: string) =>
    (await liveLines(b)).filter((l) => l.category === category);
  const addLine = async (b: Booking, body: Record<string, unknown>) => {
    const r = await c.fd!.send('POST', url(`/folios/${b.folioId}/lines`), body);
    expect(r.statusCode, r.body).toBe(201);
    return ((await folio(b)).lines as Line[]).filter((l) => l.category === body.category).at(-1)!;
  };
  /** FOC approved by MGR on a line (BR-434). */
  const focApproved = async (b: Booking, lineId: string, amountVnd: number) => {
    const r = await c.fd!.send('POST', url(`/folios/${b.folioId}/lines/${lineId}/foc`), {
      kind: 'foc',
      amountVnd,
      reasonCode: 'regular_vip',
    });
    expect(r.statusCode, r.body).toBe(201);
    const a = await c.mgr!.send('POST', url(`/approval-requests/${r.json().id}/actions/approve`), {
      authMethod: 'password',
      secret: TEST_PASSWORD,
    });
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
        amount_vnd: number;
      }>(
        `SELECT status, foc_state, foc_cancel_reason, auto_cancel_reason, amount_vnd FROM approval_request WHERE id = $1`,
        [id],
      )
    )[0]!;
  const refunds = (b: Booking) =>
    q<{ id: string; status: string; amount_vnd: number; auto_cancel_reason: string | null }>(
      `SELECT id, status, amount_vnd, auto_cancel_reason FROM approval_request
        WHERE type = 'refund' AND target_id = $1 ORDER BY requested_at, id`,
      [b.id],
    ).then((rows) => rows.map((r) => ({ ...r, amount_vnd: Number(r.amount_vnd) })));
  /** The line + its live FOC (what the guest pays for it). */
  const netOf = async (b: Booking, lineId: string) => {
    const live = await liveLines(b);
    const line = live.find((l) => l.id === lineId);
    if (!line) return 0;
    return live
      .filter((l) => l.id === lineId || l.relatedLineId === lineId)
      .reduce((a, l) => a + l.amountVnd, 0);
  };

  it('DOM-S4-12 / BR-309-09: performed hint – cancel 09:00 on the arrival day → false; no-show 23:10 → true; service categories', async () => {
    const o = oracle('BR-309-09');
    const arrival = o.input.arrivalDate as string;
    await at('2026-10-15T10:00:00+07:00');
    const b = await direct(o.input.roomNo, arrival, '2026-10-21', 300_000);
    const svc = await addLine(b, {
      category: o.input.serviceLine.category,
      description: 'Đón sân bay',
      quantity: 1,
      unitPriceVnd: o.input.serviceLine.amountVnd,
      serviceDate: o.input.serviceLine.serviceDate,
    });
    const cancelAt = o.input.cases.find((x: { key: string }) => x.key === 'cancel').at as string;
    await at(cancelAt);
    const dry = await c.fd!.send('POST', url(`/reservations/${b.id}/actions/cancel`), {
      reasonCode: 'found_other',
      dryRun: true,
    });
    expect(dry.statusCode, dry.body).toBe(200);
    const line = (dry.json().cancellation.serviceLines as Array<Record<string, unknown>>).find(
      (x) => x.lineId === svc.id,
    );
    expect(line?.performed).toBe(o.expected.performed.cancel);
    // no-show: the same read the B11 write uses (FolioService.closeStayPreview, fee category no_show_fee)
    await at(o.input.cases.find((x: { key: string }) => x.key === 'noShow').at as string);
    const folios = fa.app.get(FolioService);
    const pv = await db.withContext(t.ctx(), (tx) =>
      folios.closeStayPreview(tx, b.folioId, b.id, {
        retainLines: [],
        feeVnd: 0,
        feeCategory: 'no_show_fee',
        today: arrival,
      }),
    );
    expect(pv.serviceLines.find((x) => x.lineId === svc.id)?.performed).toBe(
      o.expected.performed.noShow,
    );
    expect([...SERVICE_CATEGORIES].sort()).toEqual([...o.expected.serviceCategories].sort());
  });

  it('DOM-S4-13 / BR-429-17: Agoda 203 → 401 (guest request) difference reversed with the nights at the cancellation – nothing left due', async () => {
    const o = oracle('BR-429-17');
    await at('2026-10-20T10:00:00+07:00');
    const b = await agoda(
      o.input.originRoomNo,
      o.input.arrivalDate,
      o.input.departureDate,
      1_600_000,
    );
    const body = { roomId: ids.rooms[o.input.roomNo] as string, reasonCode: 'guest_request' };
    const pv = await c.fd!.get(
      url(`/reservations/${b.id}/move-preview?${new URLSearchParams(body)}`),
    );
    expect(pv.statusCode, pv.body).toBe(200);
    const mv = await act(b.id, 'move', {
      ...body,
      applyDifference: true,
      expectedDeltaVnd: pv.json().folioDeltaVnd,
    });
    expect(mv.statusCode, mv.body).toBe(200);
    const diffs = await liveBy(b, 'room_change_difference');
    expect(
      Object.fromEntries(diffs.map((l) => [l.serviceDate, l.amountVnd])),
      'difference per night of the oracle',
    ).toEqual(o.input.roomChangeDifferenceByDateVnd);
    await at(o.input.cancelledAt);
    const r = await act(b.id, 'cancel', {
      reasonCode: 'found_other',
      otaPenaltyVnd: o.input.otaPenaltyVnd,
    });
    expect(r.statusCode, r.body).toBe(200);
    expect(await liveBy(b, 'room_change_difference')).toEqual([]);
    const reversed = ((await folio(b)).lines as Line[])
      .filter((l) => l.category === 'room_change_difference' && l.reversalOfId)
      .reduce((a, l) => a - l.amountVnd, 0);
    expect(reversed).toBe(o.expected.differenceReversedVnd);
    expect((await folio(b)).totals.balanceDueVnd).toBe(o.expected.balanceDueAfterCancelVnd);
  });

  it('DOM-S4-13: no-show reverses the difference with the night, B12 posts it again (follows the night both ways)', async () => {
    await at('2026-10-20T10:00:00+07:00');
    const b = await agoda('203', '2026-12-15', '2026-12-17', 1_600_000);
    const body = { roomId: ids.rooms['401'] as string, reasonCode: 'guest_request' };
    const pv = await c.fd!.get(
      url(`/reservations/${b.id}/move-preview?${new URLSearchParams(body)}`),
    );
    const mv = await act(b.id, 'move', {
      ...body,
      applyDifference: true,
      expectedDeltaVnd: pv.json().folioDeltaVnd,
    });
    expect(mv.statusCode, mv.body).toBe(200);
    const before = (await liveBy(b, 'room_change_difference'))
      .map((l) => [l.serviceDate, l.amountVnd])
      .sort();
    expect(before.length).toBeGreaterThan(0);
    await at('2026-12-15T23:30:00+07:00');
    const ns = await act(b.id, 'mark-no-show', { contactAttemptNote: 'Gọi 3 lần không nghe' });
    expect(ns.statusCode, ns.body).toBe(200);
    const voidedDates = new Set((await liveBy(b, 'room')).map((l) => l.serviceDate));
    expect(
      (await liveBy(b, 'room_change_difference')).every((l) => voidedDates.has(l.serviceDate)),
    ).toBe(true);
    const rs = await act(b.id, 'restore-no-show', { reason: 'Khách đến muộn, xe trễ' }, 'mgr');
    expect(rs.statusCode, rs.body).toBe(200);
    expect(
      (await liveBy(b, 'room_change_difference')).map((l) => [l.serviceDate, l.amountVnd]).sort(),
    ).toEqual(before);
  });

  it('DOM-S4-15 / BR-434-13: kept service – cancel → FOC cancelled, guest pays 300.000; not kept → line + FOC reversed (0); no-show kept → FOC suspended, B12 brings it back', async () => {
    const o = oracle('BR-434-13');
    const svc = o.input.serviceLine as { category: string; amountVnd: number };
    const caseOf = (key: string) =>
      (o.input.cases as Array<{ key: string; retain: boolean; flow: string }>).find(
        (x) => x.key === key,
      )!;
    const run = async (key: string, from: string, to: string) => {
      const k = caseOf(key);
      await at('2026-10-20T10:00:00+07:00');
      const b = await direct(o.input.roomNo, from, to, 400_000);
      const line = await addLine(b, {
        category: svc.category,
        description: 'Đón sân bay',
        quantity: 1,
        unitPriceVnd: svc.amountVnd,
        serviceDate: from,
      });
      const foc = await focApproved(b, line.id, o.input.approvedFocVnd);
      expect(await netOf(b, line.id)).toBe(0);
      const retainLines = k.retain ? [{ lineId: line.id, reason: 'Xe đã đặt, không hoàn' }] : [];
      if (k.flow === 'cancel') {
        await at(`${from}T09:00:00+07:00`);
        const dry = await c.fd!.send('POST', url(`/reservations/${b.id}/actions/cancel`), {
          reasonCode: 'found_other',
          dryRun: true,
          retainLines,
        });
        expect(dry.statusCode, dry.body).toBe(200);
        expect(dry.json().cancellation.serviceRetainedVnd).toBe(
          k.retain ? o.expected.guestPaysVnd[key] : 0,
        );
        const r = await act(b.id, 'cancel', { reasonCode: 'found_other', retainLines });
        expect(r.statusCode, r.body).toBe(200);
      } else {
        await at(`${from}T23:30:00+07:00`);
        const r = await act(b.id, 'mark-no-show', {
          contactAttemptNote: 'Gọi 3 lần không nghe',
          retainLines,
        });
        expect(r.statusCode, r.body).toBe(200);
      }
      expect(await netOf(b, line.id)).toBe(o.expected.guestPaysVnd[key]);
      expect((await request(foc)).foc_state).toBe(o.expected.focState[key]);
      return { b, line, foc };
    };
    const retain = await run('retain', '2026-11-16', '2026-11-17');
    expect(await request(retain.foc)).toMatchObject({
      status: 'approved',
      foc_cancel_reason: 'reservation_cancelled',
    });
    await run('reverse', '2026-11-23', '2026-11-24');
    const ns = await run('noShowRetain', '2026-11-30', '2026-12-01');
    const log = await q<{ action: string }>(
      `SELECT action FROM audit_event WHERE entity_id = $1 AND category = 'money' ORDER BY occurred_at, id`,
      [ns.foc],
    );
    expect(log.map((e) => e.action)).toContain('folio.foc_suspended');
    // B12: the FOC on the kept service comes back with the booking
    const rs = await act(ns.b.id, 'restore-no-show', { reason: 'Khách đến muộn, xe trễ' });
    expect(rs.statusCode, rs.body).toBe(200);
    expect((await request(ns.foc)).foc_state).toBe('applied');
    expect(await netOf(ns.b, ns.line.id)).toBe(0);
  });

  it('DOM-S4-14 / BR-522-05: open refund 300.000 – cancel 5 days before → +350.000; 2 days → nothing new; open 700.000 with excess 0 → auto-cancelled, requester told', async () => {
    const o = oracle('BR-522-05');
    const caseOf = (key: string) =>
      (
        o.input.cases as Array<{
          key: string;
          depositPaidVnd: number;
          openRefundVnd: number;
          cancelledAt: string;
        }>
      ).find((x) => x.key === key)!;
    const approvals = fa.app.get(ApprovalService);
    const run = async (key: string) => {
      const k = caseOf(key);
      await at('2026-10-20T10:00:00+07:00');
      const b = await direct(o.input.roomNo, o.input.arrivalDate, '2026-11-13', k.depositPaidVnd);
      expect((await get(b.id)).depositRequiredVnd).toBe(o.input.depositRequiredVnd);
      expect((await get(b.id)).totalRoomVnd).toBe(o.input.roomTotalVnd);
      // the desk asked a refund before the cancellation (pending, MGR+ decides)
      const open = await db.withContext(t.ctx(), (tx) =>
        approvals.submit(
          tx,
          { userId: t.users.fd!.id, roles: ['front_desk'] },
          {
            type: 'refund',
            amountVnd: k.openRefundVnd,
            reasonCode: 'overpayment',
            targetType: 'reservation',
            targetId: b.id,
            targetCode: b.code,
          },
        ),
      );
      await at(k.cancelledAt);
      const r = await act(b.id, 'cancel', { reasonCode: 'found_other' });
      expect(r.statusCode, r.body).toBe(200);
      const fee = (await liveBy(b, 'cancellation_fee')).reduce((a, l) => a + l.amountVnd, 0);
      expect(fee, `fee ${key}`).toBe(o.expected.feeVnd[key]);
      const rows = await refunds(b);
      const created = rows.filter((x) => x.id !== open.id && x.status === 'pending');
      expect(
        created.reduce((a, x) => a + x.amount_vnd, 0),
        `new request ${key}`,
      ).toBe(o.expected.newRefundRequestVnd[key]);
      const first = rows.find((x) => x.id === open.id)!;
      expect(first.status === 'cancelled', `open request auto-cancelled ${key}`).toBe(
        o.expected.openRequestAutoCancelled[key],
      );
      const left = rows
        .filter((x) => x.status === 'pending' || x.status === 'approved')
        .reduce((a, x) => a + x.amount_vnd, 0);
      expect(left, `requests left = excess ${key}`).toBe(o.expected.excessAfterFeeVnd[key]);
      return { b, open, first };
    };
    await run('a');
    await run('b');
    const cRun = await run('c');
    expect(cRun.first.auto_cancel_reason).toBe('reservation_cancelled');
    const told = await q<{ user_id: string }>(
      `SELECT user_id FROM staff_notification WHERE kind = 'approval_cancelled' AND ref_id = $1`,
      [cRun.open.id],
    );
    expect(told.map((x) => x.user_id)).toContain(t.users.fd!.id);
  });
});
