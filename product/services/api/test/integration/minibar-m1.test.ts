/**
 * BE-B – mô hình minibar M-1 (ARC `openapi-0.3.7.md` mục 16, cases 16.4) + DOM (f) QR confirmation, on the real
 * PostgreSQL through HTTP, with the oracles BR-434-16, BR-702-02/03, BR-703-01 (business-rules v0.3.8 18/10):
 * - BUG-R2-135 (BR-434-16): FOC minibar keyed by item – Σ FOC ≤ the item's live lines, the later FOC dormant;
 * - BUG-R2-136 (BR-703-01): B14 mid-stay → two fridges, two counts; the old room's refill task; FOC across both;
 * - BUG-R2-137 (BR-702-03): an item made free after the fill keeps the price of the fill;
 * - BUG-R2-138 (BR-702-02): the mark is the level of the fill (catalogue change kept copy-on-write);
 * - BUG-R2-140: the count shows the live folio amount;
 * - DOM (e) cases 8/9, new item (case 10), two catalogue changes (case 11), other room → NOT_IN_LIST;
 * - DOM (f): createVietQr keeps its purpose; confirmPaymentReceived above what is due now for that purpose needs a
 *   note (422 REASON_REQUIRED + max); Payment.qrPurpose / amountDueNowVnd.
 * Real inventory minibar port (B18 blocker, refill tasks). Fake clock and FAKE data only.
 */
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { v7 as uuidv7 } from 'uuid';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
import {
  NoGuestAccessPort,
  UnwiredChildDataPort,
} from '../../src/modules/frontdesk/internal/default-ports';
import { FrontdeskPorts } from '../../src/modules/frontdesk/internal/stay-support';
import {
  FD_MINIBAR_PORT,
  type CheckinDocumentStatus,
  type FrontdeskMinibarPort,
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
  relatedLineId?: string;
  reversalOfId?: string;
  lineState: string;
};

describe.skipIf(!HAS_DB)('minibar M-1 + QR confirmation (BE-B, ARC 16 / DOM (f))', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let ids: BookingIds;
  let guest: string;
  const c: Record<string, Client> = {};
  const items: Record<string, string> = {};
  const codeOf: Record<string, string> = {};

  beforeAll(async () => {
    db = appDatabase(6);
    t = await createTenant(db, { users: ROLES });
    ids = await seedBooking(db, t);
    guest = await seedGuestRow(db, t, { name: 'Khách Thử Tủ' });
    await db.withContext(t.ctx(), async (tx) => {
      for (const m of DS_E.minibarItems) {
        const id = uuidv7();
        items[m.code] = id;
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
    fa = await startFeatureApp(db, {
      override: (b) =>
        b.overrideProvider(FrontdeskPorts).useFactory({
          factory: (minibar: FrontdeskMinibarPort) =>
            new FrontdeskPorts(
              new DocsOk(),
              new NoGuestAccessPort(),
              new UnwiredChildDataPort(),
              minibar,
            ),
          inject: [FD_MINIBAR_PORT],
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
          new Date('2031-06-30T00:00:00Z'),
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
  const folio = async (b: Booking) => (await c.fd!.get(url(`/folios/${b.folioId}`))).json();
  const totals = async (b: Booking) => (await folio(b)).totals as Record<string, number>;
  const liveLines = async (b: Booking) => {
    const all = (await folio(b)).lines as Line[];
    const reversed = new Set(all.map((l) => l.reversalOfId).filter(Boolean));
    return all.filter((l) => l.lineState === 'posted' && !l.reversalOfId && !reversed.has(l.id));
  };
  /** Minibar gross / FOC / net of the folio. */
  const mb = async (b: Booking) => {
    const live = await liveLines(b);
    const ids = new Set(live.filter((l) => l.category === 'minibar').map((l) => l.id));
    const gross = live.filter((l) => ids.has(l.id)).reduce((a, l) => a + l.amountVnd, 0);
    const foc = live
      .filter(
        (l) =>
          (l.category === 'foc' || l.category === 'discount') && ids.has(l.relatedLineId ?? ''),
      )
      .reduce((a, l) => a + l.amountVnd, 0);
    return { gross, foc, net: gross + foc };
  };
  const beer = async (b: Booking) =>
    (await liveLines(b)).filter((l) => l.category === 'minibar')[0]!;
  const state = async (id: string) =>
    (
      await q<{ foc_state: string | null; foc_cancel_reason: string | null }>(
        'SELECT foc_state, foc_cancel_reason FROM approval_request WHERE id = $1',
        [id],
      )
    )[0]!;
  const vacant = (room: string) =>
    q(
      `INSERT INTO room_status (room_id, organization_id, property_id, status, since) VALUES ($1, $2, $3, 'VC', $4)
       ON CONFLICT (room_id) DO UPDATE SET status = 'VC'`,
      [ids.rooms[room], t.organizationId, t.propertyIds[0], new Date('2026-10-01T00:00:00Z')],
    );
  const inHouse = async (room: string, from: string, to: string) => {
    await at(`${from}T15:00:00+07:00`);
    await vacant(room);
    const res = await c.fd!.send('POST', url('/reservations'), {
      roomId: ids.rooms[room],
      channelId: ids.channels.direct,
      directSource: 'zalo_phone',
      adults: 2,
      bookerGuestId: guest,
      paymentModel: 'direct',
      arrivalDate: from,
      departureDate: to,
      initialPayment: { type: 'deposit', method: 'cash', amountVnd: 100_000 },
    });
    let b = res.json() as Booking;
    if (res.statusCode === 422 && res.json().code === 'DEPOSIT_INSUFFICIENT') {
      const again = await c.fd!.send('POST', url('/reservations'), {
        roomId: ids.rooms[room],
        channelId: ids.channels.direct,
        directSource: 'zalo_phone',
        adults: 2,
        bookerGuestId: guest,
        paymentModel: 'direct',
        arrivalDate: from,
        departureDate: to,
        initialPayment: {
          type: 'deposit',
          method: 'cash',
          amountVnd: res.json().depositRequiredVnd,
        },
      });
      expect(again.statusCode, again.body).toBe(201);
      b = again.json() as Booking;
    } else {
      expect(res.statusCode, res.body).toBe(201);
    }
    const due = (await totals(b)).balanceDueVnd as number;
    if (due > 0) {
      const p = await c.fd!.send('POST', url(`/folios/${b.folioId}/payments`), {
        type: 'charge',
        method: 'cash',
        amountVnd: due,
      });
      expect(p.statusCode, p.body).toBe(201);
    }
    const ci = await act(b.id, 'check-in', {
      cardsIssued: 1,
      houseRulesSent: true,
      checkinTime: '15:00',
    });
    expect(ci.statusCode, ci.body).toBe(200);
    return { b, roomTotal: (await totals(b)).totalVnd as number };
  };
  const standard = async (b: Booking, roomId?: string, who = 'fd') => {
    const r = await c[who]!.get(
      url(`/reservations/${b.id}/minibar-standard${roomId ? `?roomId=${roomId}` : ''}`),
    );
    expect(r.statusCode, r.body).toBe(200);
    return r.json() as {
      items: Array<Record<string, unknown> & { itemId: string; standardQty: number }>;
      latestCheck: Record<string, unknown> | null;
    };
  };
  /** Checkout count: `used` per item code over the items of the FRIDGE (GET minibar-standard). */
  const countRaw = async (b: Booking, used: Record<string, number>, roomId?: string) => {
    const std = await standard(b, roomId);
    return c.fd!.send('POST', url(`/reservations/${b.id}/minibar-checks`), {
      mode: 'checkout',
      lines: std.items.map((i) => ({
        itemId: i.itemId,
        remainingQty: i.standardQty - (used[codeOf[i.itemId] ?? ''] ?? 0),
      })),
      ...(roomId ? { roomId } : {}),
    });
  };
  const count = async (b: Booking, used: Record<string, number>, roomId?: string) => {
    const r = await countRaw(b, used, roomId);
    expect(r.statusCode, r.body).toBe(201);
    return r.json() as { totalVnd: number; lines: Array<{ itemId: string; amountVnd: number }> };
  };
  const selfFoc = async (b: Booking, lineId: string, amountVnd: number) => {
    const r = await c.fd!.send('POST', url(`/folios/${b.folioId}/lines/${lineId}/foc`), {
      kind: 'foc',
      amountVnd,
      reasonCode: 'regular_vip',
      authMethod: 'password',
      secret: TEST_PASSWORD,
    });
    expect(r.statusCode, r.body).toBe(201);
    expect(r.json().status).toBe('approved');
    return r.json().id as string;
  };
  const approvedFoc = async (b: Booking, lineId: string, amountVnd: number, who = 'fdl') => {
    const r = await c.fd!.send('POST', url(`/folios/${b.folioId}/lines/${lineId}/foc`), {
      kind: 'foc',
      amountVnd,
      reasonCode: 'service_recovery',
    });
    expect(r.statusCode, r.body).toBe(201);
    const a = await c[who]!.send('POST', url(`/approval-requests/${r.json().id}/actions/approve`), {
      authMethod: 'password',
      secret: TEST_PASSWORD,
    });
    expect(a.statusCode, a.body).toBe(200);
    return r.json().id as string;
  };
  const adjust = async (b: Booking, lineId: string, body: Record<string, unknown>) => {
    const f = await c.fd!.get(url(`/folios/${b.folioId}`));
    const r = await c.fd!.send(
      'POST',
      url(`/folios/${b.folioId}/lines/${lineId}/adjustments`),
      { reason: 'Lễ tân sửa theo khách', ...body },
      { 'if-match': f.headers.etag as string },
    );
    expect(r.statusCode, r.body).toBe(201);
  };
  /** OWN edits an item through updateItem (US-066) – the fridges in house are kept first (ARC D1). */
  const editItem = async (code: string, change: Record<string, unknown>) => {
    const listed = await c.own!.get(url('/items'));
    expect(listed.statusCode, listed.body).toBe(200);
    const it = (listed.json().data as Array<Record<string, unknown>>).find((x) => x.code === code)!;
    const r = await c.own!.send(
      'PATCH',
      url(`/items/${it.id}`),
      {
        code: it.code,
        name: { vi: it.name },
        unit: it.unit,
        salePriceVnd: it.salePriceVnd ?? null,
        costPriceVnd: it.costPriceVnd,
        minibarStandardQty: it.minibarStandardQty,
        minStockQty: it.minStockQty,
        isActive: it.isActive,
        ...change,
      },
      { 'if-match': `"${it.version}"` },
    );
    expect(r.statusCode, r.body).toBe(200);
  };
  const checkout = async (b: Booking, time: string) => {
    const s = await c.fd!.get(url(`/reservations/${b.id}/checkout-summary?checkoutTime=${time}`));
    expect(s.statusCode, s.body).toBe(200);
    const due = s.json().amountDueAtCheckoutVnd as number;
    const out = await act(b.id, 'check-out', {
      checkoutTime: time,
      ...(due > 0 ? { finalPayment: { type: 'charge', method: 'cash', amountVnd: due } } : {}),
    });
    return { status: out.statusCode, body: out.body, due };
  };

  // ───────────── R8: FOC keyed by item (BR-434-15/16) ─────────────

  it('case 1 (095/109/129): FOC 70.000 approved on 2 beers – used 0 → dormant; used 2 again → restored 70.000, net 0, limit once', async () => {
    const { b } = await inHouse('101', '2028-09-04', '2028-09-05');
    await at('2028-09-05T09:00:00+07:00');
    await count(b, { bia: 2 });
    const foc = await approvedFoc(b, (await beer(b)).id, 70_000);
    const limit = (await c.fdl!.get(url('/approval-requests?limit=1'))).json().data[0]
      ?.approverRemainingMonthlyVnd;
    await count(b, {});
    expect((await state(foc)).foc_state).toBe('dormant');
    await count(b, { bia: 2 });
    expect((await state(foc)).foc_state).toBe('applied');
    expect(await mb(b)).toEqual({ gross: 70_000, foc: -70_000, net: 0 });
    expect(
      (await c.fdl!.get(url('/approval-requests?limit=1'))).json().data[0]
        ?.approverRemainingMonthlyVnd,
    ).toBe(limit);
  });

  it('case 2 / BR-434-16 (BUG-R2-135): two FOCs on the beer – Σ FOC ≤ the live beer; A applied, B dormant; B18 collects 0, B cancelled at settle', async () => {
    const o = oracle('BR-434-16');
    const run = async (key: string, room: string, stay: [string, string]) => {
      const { b } = await inHouse(room, stay[0], stay[1]);
      await at(`${stay[1]}T09:00:00+07:00`);
      if (key === 'zeroPath') {
        await count(b, { bia: 2 });
        const A = await selfFoc(b, (await beer(b)).id, o.input.focEachVnd);
        await count(b, {});
        await count(b, { bia: 2 });
        const B = await selfFoc(b, (await beer(b)).id, o.input.focEachVnd);
        await count(b, { bia: 1 });
        return { b, A, B };
      }
      await count(b, { bia: 1 });
      const A = await selfFoc(b, (await beer(b)).id, o.input.focEachVnd);
      if (key === 'recount') await count(b, { bia: 2 });
      else await adjust(b, (await beer(b)).id, { newQuantity: 2 });
      const B = await selfFoc(b, (await beer(b)).id, o.input.focEachVnd);
      if (key === 'recount') await count(b, { bia: 1 });
      else await adjust(b, (await beer(b)).id, { newQuantity: 1 });
      return { b, A, B };
    };
    for (const cse of o.input.cases as Array<{
      key: string;
      roomNo: string;
      stay: [string, string];
    }>) {
      const { b, A, B } = await run(cse.key, cse.roomNo, cse.stay);
      expect([(await state(A)).foc_state, (await state(B)).foc_state], cse.key).toEqual([
        o.expected.focState.A,
        o.expected.focState.B,
      ]);
      expect((await mb(b)).net, cse.key).toBe(o.expected.minibarNetVnd);
      expect((await totals(b)).totalVnd, cse.key).toBe(o.expected.folioTotalVnd[cse.key]);
      await at(`${cse.stay[1]}T11:00:00+07:00`);
      const co = await checkout(b, '11:00');
      expect(co.status, co.body).toBe(o.expected.b18HttpStatus);
      expect(co.due).toBe(o.expected.b18CollectVnd);
      expect(await state(B)).toMatchObject({
        foc_state: o.expected.afterSettle.B,
        foc_cancel_reason: o.expected.afterSettle.cancelReason,
      });
    }
  });

  // ───────────── R1/R9: two fridges across B14 (BR-703-01) ─────────────

  it('case 3 / BR-703-01 (BUG-R2-136): 202 → 203 (property fault) – two fridges, two counts: 105.000 (a), 70.000 (b), FOC 70.000 on the 202 beer → net 35.000 (c); old room refill task; B18 blocks until every fridge is counted', async () => {
    const o = oracle('BR-703-01');
    const days: Record<string, [string, string]> = {
      a: ['2028-10-02', '2028-10-04'],
      b: ['2028-10-09', '2028-10-11'],
      c: ['2028-10-16', '2028-10-18'],
    };
    for (const cse of o.input.cases as Array<{
      key: string;
      usedOld: number;
      usedNew: number;
      approvedBeerFocVnd?: number;
    }>) {
      const [from, to] = days[cse.key]!;
      const { b } = await inHouse(o.input.from, from, to);
      await at(`${from}T20:00:00+07:00`);
      await count(b, { bia: cse.usedOld });
      const foc = cse.approvedBeerFocVnd
        ? await approvedFoc(b, (await beer(b)).id, cse.approvedBeerFocVnd)
        : null;
      await vacant(o.input.to);
      const body = {
        newRoomId: ids.rooms[o.input.to],
        effectiveDate: from,
        cause: o.input.reasonCode,
        reason: 'Hỏng điều hòa',
      };
      const dry = await act(b.id, 'change-room', { ...body, dryRun: true });
      expect(dry.statusCode, dry.body).toBe(200);
      const mv = await act(b.id, 'change-room', {
        ...body,
        expectedDeltaVnd: dry.json().folioDeltaVnd,
      });
      expect(mv.statusCode, mv.body).toBe(200); // never blocked by the old fridge (BR-703-01)
      // the count of 202 (taken before the move) has its refill task
      const tasks = await q<{ n: number }>(
        `SELECT count(*)::int AS n FROM hk_task WHERE reservation_id = $1 AND room_id = $2 AND type = 'minibar_refill'`,
        [b.id, ids.rooms[o.input.from]],
      );
      expect(tasks[0]!.n > 0, 'old room refill task').toBe(o.expected.oldRoomRestockTask);
      await at(`${to}T09:00:00+07:00`);
      // B18 asks for the 203 fridge until it is counted (the 202 one is)
      const before = await c.fd!.get(
        url(`/reservations/${b.id}/checkout-summary?checkoutTime=11:00`),
      );
      expect(before.json().blockers ?? []).toContain('minibar_not_checked');
      await count(b, { bia: cse.usedNew });
      const checks = await q<{ room_id: string; replaced: boolean }>(
        `SELECT room_id, replaced_by_check_id IS NOT NULL AS replaced FROM minibar_check
          WHERE reservation_id = $1 ORDER BY checked_at`,
        [b.id],
      );
      expect(
        checks.map((x) => x.replaced),
        'two fridges never replace each other',
      ).toEqual([false, false]);
      const m = await mb(b);
      expect(m.gross, cse.key).toBe(o.expected.minibarVnd[cse.key]);
      if (foc) {
        expect((await state(foc)).foc_state).toBe('applied');
        expect(m.net).toBe(o.expected.minibarNetVnd[cse.key]);
      }
      // the count of the old fridge from the desk after the move (roomId) replaces only that fridge
      const again = await count(b, { bia: cse.usedOld }, ids.rooms[o.input.from]);
      expect(again.totalVnd).toBe(cse.usedOld * o.input.beerUnitVnd);
      await at(`${to}T11:00:00+07:00`);
      const co = await checkout(b, '11:00');
      expect(co.status, co.body).toBe(200);
    }
    // another stay's room → NOT_IN_LIST
    const { b } = await inHouse('301', '2028-10-23', '2028-10-24');
    const r = await c.fd!.send('POST', url(`/reservations/${b.id}/minibar-checks`), {
      mode: 'checkout',
      lines: [],
      roomId: ids.rooms['302'],
    });
    expect(r.statusCode).toBe(422);
    expect(r.json().errors).toContainEqual({ field: 'roomId', code: 'NOT_IN_LIST' });
  });

  it('ARC (o) – B14 on the FIRST night, old fridge never counted, catalogue unchanged: the old fridge stays a fridge of the stay – B18 blocked (minibarUncheckedRooms) until it is counted', async () => {
    const { b } = await inHouse('202', '2028-10-30', '2028-11-01');
    await at('2028-10-30T20:00:00+07:00');
    await vacant('203');
    const body = {
      newRoomId: ids.rooms['203'],
      effectiveDate: '2028-10-30',
      cause: 'property_fault',
      reason: 'Hỏng điều hòa',
    };
    const dry = await act(b.id, 'change-room', { ...body, dryRun: true });
    expect(dry.statusCode, dry.body).toBe(200);
    const mv = await act(b.id, 'change-room', {
      ...body,
      expectedDeltaVnd: dry.json().folioDeltaVnd,
    });
    expect(mv.statusCode, mv.body).toBe(200);
    // the first night's segment now says 203 – the 202 fridge is known through its fill (registered at B14)
    const segs = await q<{ room_id: string }>(
      'SELECT room_id FROM reservation_segment WHERE reservation_id = $1 AND active',
      [b.id],
    );
    expect(segs.map((x) => x.room_id)).not.toContain(ids.rooms['202']);
    await at('2028-11-01T09:00:00+07:00');
    await count(b, {}); // the 203 fridge (the room the guest is in)
    const summary = async () => {
      const s = await c.fd!.get(url(`/reservations/${b.id}/checkout-summary?checkoutTime=11:00`));
      expect(s.statusCode, s.body).toBe(200);
      return s.json();
    };
    const before = await summary();
    expect(
      (before.minibarUncheckedRooms as Array<{ roomId: string }> | undefined)?.map((r) => r.roomId),
    ).toEqual([ids.rooms['202']]);
    expect(before.blockers).toContain('minibar_not_checked');
    await at('2028-11-01T11:00:00+07:00');
    const blocked = await act(b.id, 'check-out', { checkoutTime: '11:00' });
    expect(blocked.statusCode).toBe(409);
    // the old fridge counted (roomId) → its refill task, B18 passes
    await count(b, { bia: 1 }, ids.rooms['202']);
    const after = await summary();
    expect(after.minibarUncheckedRooms ?? []).toEqual([]);
    const co = await checkout(b, '11:00');
    expect(co.status, co.body).toBe(200);
    expect(co.due).toBe(35_000);
    const tasks = await q<{ n: number }>(
      `SELECT count(*)::int AS n FROM hk_task WHERE reservation_id = $1 AND room_id = $2 AND type = 'minibar_refill'`,
      [b.id, ids.rooms['202']],
    );
    expect(tasks[0]!.n).toBeGreaterThan(0);
  });

  // ───────────── R2/R5/R6: the fill (BR-702-02/03, BUG-R2-137/138/140) ─────────────

  it('case 4 / BR-702-03 (BUG-R2-137): beer made free (null / 0) after check-in, re-count 2 → keeps 70.000 (folio 987.000 / 1.070.000); 3 → 105.000 at the fill price', async () => {
    const o = oracle('BR-702-03');
    for (const cse of o.input.cases as Array<{
      key: string;
      roomNo: string;
      stay: [string, string];
      newPrice: number | null;
    }>) {
      const { b } = await inHouse(cse.roomNo, cse.stay[0], cse.stay[1]);
      await at(`${cse.stay[1]}T09:00:00+07:00`);
      await count(b, { bia: o.input.used });
      await editItem('bia', { salePriceVnd: cse.newPrice });
      try {
        await count(b, { bia: o.input.used });
        expect((await mb(b)).gross, cse.key).toBe(o.expected.minibarVnd);
        expect((await totals(b)).totalVnd, cse.key).toBe(o.expected.folioTotalVnd[cse.key]);
      } finally {
        await editItem('bia', { salePriceVnd: 35_000 });
      }
      await at(`${cse.stay[1]}T11:00:00+07:00`);
      const co = await checkout(b, '11:00');
      expect(co.status, co.body).toBe(200);
      expect(co.due).toBe(o.expected.b18CollectVnd);
    }
  });

  it('BR-702-04 (R5, Q1/Q2): one price per fill – 1 beer counted, price → 40.000 or free, then 2 used → 70.000, folio 862.000', async () => {
    const o = oracle('BR-702-04');
    const days: Record<string, [string, string]> = {
      priceChange: ['2028-12-11', '2028-12-12'],
      madeFree: ['2028-12-18', '2028-12-19'],
    };
    for (const [key, price] of Object.entries(o.input.cases as Record<string, number | null>)) {
      const [from, to] = days[key]!;
      const { b } = await inHouse(o.input.roomNo, from, to);
      expect((await totals(b)).totalVnd).toBe(o.input.roomTotalVnd);
      await at(`${to}T09:00:00+07:00`);
      await count(b, { bia: o.input.firstCountUsed });
      await editItem('bia', { salePriceVnd: price });
      try {
        await count(b, { bia: o.input.secondCountUsedTotal });
        expect((await mb(b)).gross, key).toBe(o.expected.minibarVnd[key]);
        expect((await totals(b)).totalVnd, key).toBe(o.expected.folioTotalVnd);
      } finally {
        await editItem('bia', { salePriceVnd: o.input.priceAtRestockVnd });
      }
    }
  });

  it('case 5 / BR-702-02 (BUG-R2-138): mark = level of the fill – standard 2 → 1 keeps 70.000 (folio 820.000); snack 1 → 2 → 30.000; dispute: the desk-edited folio wins', async () => {
    const o = oracle('BR-702-02');
    const { b } = await inHouse(o.input.roomNo, '2028-11-06', '2028-11-07');
    await at('2028-11-07T09:00:00+07:00');
    await count(b, { bia: o.input.beer.standardAtRestock - o.input.beer.countLeft });
    await editItem('bia', { minibarStandardQty: o.input.beer.catalogStandardNow });
    await editItem('snack', { minibarStandardQty: o.input.snack.catalogStandardNow });
    try {
      const std = await standard(b);
      expect(std.items.find((i) => i.itemId === items.bia)?.standardQty).toBe(
        o.input.beer.standardAtRestock,
      );
      expect(std.items.find((i) => i.itemId === items.snack)?.standardQty).toBe(
        o.input.snack.standardAtRestock,
      );
      // fridge emptied: beer used 2 (mark 2), snack used 1 (mark 1)
      await count(b, { bia: 2, snack: 1 });
      const lines = (await liveLines(b)).filter((l) => l.category === 'minibar');
      expect(lines.map((l) => l.amountVnd).sort()).toEqual(
        [o.expected.beerVnd, o.expected.snackVnd].sort(),
      );
      expect((await totals(b)).totalVnd).toBe(750_000 + o.expected.beerVnd + o.expected.snackVnd);
      // dispute (DOM (e)): the desk sets the beer line to 1 can; HK re-submits 2 used → the folio (35.000) stays
      await adjust(b, (await beer(b)).id, { newQuantity: o.input.dispute.folioEditedQty });
      const std2 = await standard(b);
      expect(std2.items.find((i) => i.itemId === items.bia)).toMatchObject({
        lastCheckUsedQty: 2,
        folioUsedQty: 1,
        folioAmountVnd: 35_000,
        adjustedAfterLastCheck: o.expected.deskWarnsWhenFolioDiffersFromLatestCheck,
      });
      await count(b, { bia: 2, snack: 1 });
      expect(
        (await liveLines(b))
          .filter((l) => l.category === 'minibar')
          .find((l) => l.amountVnd !== o.expected.snackVnd)?.amountVnd,
      ).toBe(o.expected.disputeFolioVnd);
      // case 8: a new count (3 used) is a real new count → 105.000
      await count(b, { bia: 2, snack: 1 }); // re-count again: kept
      await editItem('bia', { minibarStandardQty: 3 }); // case 11: second change → the mark stays 2
      expect((await standard(b)).items.find((i) => i.itemId === items.bia)?.standardQty).toBe(2);
    } finally {
      await editItem('bia', { minibarStandardQty: 2 });
      await editItem('snack', { minibarStandardQty: 1 });
    }
  });

  it('case 6 (BUG-R2-140): beer price 40.000 after the fill, re-count 2 → keeps 70.000; count totalVnd = latestCheck.totalVnd = 70.000, unitPriceVnd 35.000', async () => {
    const { b } = await inHouse('301', '2028-11-13', '2028-11-14');
    await at('2028-11-14T09:00:00+07:00');
    await count(b, { bia: 2 });
    await editItem('bia', { salePriceVnd: 40_000 });
    try {
      const r = await count(b, { bia: 2 });
      expect(r.totalVnd).toBe(70_000);
      const std = await standard(b);
      expect(std.latestCheck?.totalVnd).toBe(70_000);
      expect(std.items.find((i) => i.itemId === items.bia)?.unitPriceVnd).toBe(35_000);
      expect((await mb(b)).gross).toBe(70_000);
    } finally {
      await editItem('bia', { salePriceVnd: 35_000 });
    }
  });

  it('cases 8/9/10: desk edit then used 3 → 105.000; void then same count → no line, 1 → 35.000; an item added after the fill → NOT_IN_LIST', async () => {
    const { b } = await inHouse('302', '2028-11-20', '2028-11-21');
    await at('2028-11-21T09:00:00+07:00');
    await count(b, { bia: 2 });
    await adjust(b, (await beer(b)).id, { newQuantity: 1 });
    await count(b, { bia: 1 }); // = folio → kept
    expect((await mb(b)).gross).toBe(35_000);
    await count(b, { bia: 2 }); // = previous count of this fridge (the kept 1-can count) is 1 → 2 is new
    expect((await mb(b)).gross).toBe(70_000);
    // void (case 9): same count keeps "no line", a new count of 1 → 35.000
    await adjust(b, (await beer(b)).id, { voidLine: true });
    await count(b, { bia: 2 });
    expect((await mb(b)).gross).toBe(0);
    await count(b, { bia: 1 });
    expect((await mb(b)).gross).toBe(35_000);
    // case 10: an item created after the fill is not in this fridge
    const created = await c.own!.send('POST', url('/items'), {
      code: 'banh',
      name: { vi: 'Bánh quy' },
      unit: 'gói',
      salePriceVnd: 20_000,
      costPriceVnd: 5_000,
      minibarStandardQty: 1,
      minStockQty: 0,
    });
    expect(created.statusCode, created.body).toBe(201);
    const std = await standard(b);
    expect(std.items.some((i) => i.itemId === created.json().id)).toBe(false);
    const bad = await c.fd!.send('POST', url(`/reservations/${b.id}/minibar-checks`), {
      mode: 'checkout',
      lines: [
        ...std.items.map((i) => ({ itemId: i.itemId, remainingQty: i.standardQty })),
        { itemId: created.json().id, remainingQty: 0 },
      ],
    });
    expect(bad.statusCode).toBe(422);
    expect(bad.json().errors).toContainEqual({
      field: `lines[${std.items.length}].itemId`,
      code: 'NOT_IN_LIST',
    });
    await editItem('banh', { isActive: false });
  });

  // ───────────── DOM (f): QR purpose kept, confirmation above what is due ─────────────

  it('DOM (f): QR balance 300.000 when 200.000 is due → confirm without note 422 REASON_REQUIRED max 200.000; Payment.qrPurpose / amountDueNowVnd; lateFeeAsNight only with check_out', async () => {
    const { b } = await inHouse('401', '2028-12-04', '2028-12-05');
    await at('2028-12-04T16:00:00+07:00');
    await c.own!.send('PUT', url('/parameters/payment_receiving_account'), {
      value: { bankBin: '970407', accountNo: '1903123456789', accountName: 'OTTIMO TEST' },
      effectiveFrom: '2028-12-04',
      reason: 'Tài khoản nhận thử nghiệm',
      reauth: { authMethod: 'password', secret: TEST_PASSWORD },
    });
    const add = await c.fd!.send('POST', url(`/folios/${b.folioId}/lines`), {
      category: 'fnb',
      description: 'Bữa tối',
      quantity: 1,
      unitPriceVnd: 200_000,
    });
    expect(add.statusCode, add.body).toBe(201);
    const notAllowed = await c.fd!.send('POST', url(`/folios/${b.folioId}/vietqr`), {
      amountVnd: 100_000,
      purpose: 'balance',
      lateFeeAsNight: true,
    });
    expect(notAllowed.statusCode).toBe(422);
    expect(notAllowed.json().errors).toContainEqual({
      field: 'lateFeeAsNight',
      code: 'NOT_ALLOWED',
    });
    const qr = await c.fd!.send('POST', url(`/folios/${b.folioId}/vietqr`), {
      amountVnd: 300_000,
      purpose: 'balance',
      overBalanceReason: 'Khách gửi trước tiền dịch vụ',
    });
    expect(qr.statusCode, qr.body).toBe(201);
    const pid = qr.json().payment.id as string;
    const listed = ((await folio(b)).payments as Array<Record<string, unknown>>).find(
      (p) => p.id === pid,
    );
    expect(listed).toMatchObject({ qrPurpose: 'balance', amountDueNowVnd: 200_000 });
    const noNote = await c.fd!.send('POST', url(`/payments/${pid}/actions/confirm-received`), {});
    expect(noNote.statusCode).toBe(422);
    expect(noNote.json()).toMatchObject({
      errors: [{ field: 'note', code: 'REASON_REQUIRED' }],
      max: 200_000,
    });
    const ok = await c.fd!.send('POST', url(`/payments/${pid}/actions/confirm-received`), {
      note: 'FT2812040001 – khách gửi trước',
    });
    expect(ok.statusCode, ok.body).toBe(200);
    expect((await totals(b)).creditVnd).toBe(100_000);
    const audit = await q<{ after: Record<string, unknown> }>(
      `SELECT after FROM audit_event WHERE action = 'payment.confirmed_received' AND entity_id = $1`,
      [pid],
    );
    expect(audit[0]!.after).toMatchObject({ overVnd: 100_000 });
  });
});
