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
import { Client as PgClient } from 'pg';
import { v7 as uuidv7 } from 'uuid';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
import { FolioService } from '../../src/modules/folio/public/folio.service';
import { resyncMinibarFocOnce } from '../../src/modules/folio/public/minibar-foc-resync';
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

const ROLES = {
  own: ['owner'],
  mgr: ['manager'],
  fdl: ['front_desk_lead'],
  fd: ['front_desk'],
  hk: ['housekeeping'],
};

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
      periodId?: string | null;
      roomId?: string;
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
    // ARC 16.14: never counted in the stay → never_counted
    expect((before.minibarUncheckedRooms as Array<{ reason?: string }>)[0]?.reason).toBe(
      'never_counted',
    );
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

  // ───────────── vòng sửa 4: BUG-R2-147, BUG-R2-152, BUG-R2-148 (phần BE-B) ─────────────

  it('BUG-R2-147: an open folio left by pre-0065 data with two FOC applied on one item (715.000) – the one-time re-sync gives 750.000 (A applied, B dormant, net 0), once per property', async () => {
    const { b, roomTotal } = await inHouse('102', '2028-12-25', '2028-12-26');
    await at('2028-12-26T09:00:00+07:00');
    await count(b, { bia: 1 });
    const A = await selfFoc(b, (await beer(b)).id, 35_000);
    await count(b, { bia: 2 });
    const B = await selfFoc(b, (await beer(b)).id, 35_000);
    expect(await mb(b)).toEqual({ gross: 70_000, foc: -70_000, net: 0 });
    // Pre-0065 state (BUG-R2-135 data): the beer re-counted to 1 can without a FOC sync – the 70.000 line
    // reversed, a 35.000 line posted, both FOC lines still live.
    const folios = fa.app.get(FolioService);
    await db.withContext(t.ctx(), async (tx) => {
      const old = (await folios.lines(tx, b.folioId)).find(
        (l) => l.category === 'minibar' && l.amount_vnd === 70_000,
      )!;
      await tx.query(
        `INSERT INTO folio_line (id, organization_id, property_id, folio_id, reservation_id, category, revenue_group,
           description, quantity, unit_price_vnd, amount_vnd, service_date, line_state, related_line_id,
           reversal_of_id, source, posted_at, created_at, charge_code)
         SELECT $2, organization_id, property_id, folio_id, reservation_id, category, revenue_group, description,
                quantity, -unit_price_vnd, -amount_vnd, service_date, 'posted', related_line_id, id, 'system', $3, $3,
                charge_code
           FROM folio_line WHERE id = $1`,
        [old.id, uuidv7(), new Date('2028-12-26T02:10:00Z')],
      );
      await folios.insertLine(tx, {
        folioId: b.folioId,
        reservationId: b.id,
        category: 'minibar',
        description: 'Bia Larue lon',
        quantity: 1,
        unitPriceVnd: 35_000,
        amountVnd: 35_000,
        serviceDate: '2028-12-26',
        stayNightId: null,
        source: 'minibar_check',
        postedBy: null,
        now: new Date('2028-12-26T02:10:00Z'),
        chargeCode: 'bia',
        relatedLineId: old.id,
      });
    });
    // both FOC lines (−70.000) still live while the beer is 35.000: the folio is 35.000 short
    expect((await totals(b)).totalVnd).toBe(roomTotal - 35_000);
    const first = await db.withContext(t.ctx(), (tx) =>
      resyncMinibarFocOnce(tx, folios, new Date('2028-12-26T02:15:00Z')),
    );
    expect(first).toBeGreaterThanOrEqual(1);
    expect([(await state(A)).foc_state, (await state(B)).foc_state]).toEqual([
      'applied',
      'dormant',
    ]);
    expect(await mb(b)).toEqual({ gross: 35_000, foc: -35_000, net: 0 });
    expect((await totals(b)).totalVnd).toBe(roomTotal);
    // the flag: a second run does nothing
    const again = await db.withContext(t.ctx(), (tx) =>
      resyncMinibarFocOnce(tx, folios, new Date('2028-12-26T02:16:00Z')),
    );
    expect(again).toBeNull();
    await at('2028-12-26T11:00:00+07:00');
    const co = await checkout(b, '11:00');
    expect(co.status, co.body).toBe(200);
    expect(co.due).toBe(0);
  });

  it('BUG-R2-152: B14 302 → 401 at 10:00; housekeeping counts the 302 fridge (roomId) at 11:00 – 201, 70.000 posted (no money shown to HK), one minibar_refill of 2', async () => {
    const { b } = await inHouse('302', '2029-03-26', '2029-03-29');
    await at('2029-03-27T10:00:00+07:00');
    await vacant('401');
    const body = {
      newRoomId: ids.rooms['401'],
      effectiveDate: '2029-03-27',
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
    await at('2029-03-27T11:00:00+07:00');
    const std = await c.hk!.get(
      url(`/reservations/${b.id}/minibar-standard?roomId=${ids.rooms['302']}`),
    );
    expect(std.statusCode, std.body).toBe(200);
    const items = std.json().items as Array<{ itemId: string; standardQty: number }>;
    // ARC 16.16 bổ sung 2 (ab): HK sees the period too and sends it back (the PWA does)
    expect(std.json()).toHaveProperty('periodId');
    const r = await c.hk!.send('POST', url(`/reservations/${b.id}/minibar-checks`), {
      mode: 'checkout',
      roomId: ids.rooms['302'],
      periodId: std.json().periodId,
      lines: items.map((i) => ({
        itemId: i.itemId,
        remainingQty: i.standardQty - (codeOf[i.itemId] === 'bia' ? 2 : 0),
      })),
    });
    expect(r.statusCode, r.body).toBe(201);
    expect(r.json()).not.toHaveProperty('totalVnd');
    expect((await mb(b)).gross).toBe(70_000);
    const tasks = await q<{ quantity: number }>(
      `SELECT quantity FROM hk_task WHERE reservation_id = $1 AND room_id = $2 AND type = 'minibar_refill'`,
      [b.id, ids.rooms['302']],
    );
    expect(tasks.map((x) => Number(x.quantity))).toEqual([2]);
    // not the departure day, no task in the room the guest is in: the current fridge stays out of HK's scope
    const own = await c.hk!.send('POST', url(`/reservations/${b.id}/minibar-checks`), {
      mode: 'checkout',
      lines: [],
    });
    expect(own.statusCode).toBe(404);
  });

  it('BUG-R2-148 (BE-B part): BR-433 basis of a `late_fee_as_night` line = the charge – MGR waives 911.000 in full (approved, not above the limit)', async () => {
    const { b } = await inHouse('203', '2030-09-18', '2030-09-20');
    const folios = fa.app.get(FolioService);
    const lineId = await db.withContext(t.ctx(), (tx) =>
      folios.insertLine(tx, {
        folioId: b.folioId,
        reservationId: b.id,
        category: 'late_checkout',
        description: 'late_fee_as_night',
        quantity: 1,
        unitPriceVnd: 911_000,
        amountVnd: 911_000,
        serviceDate: '2030-09-20',
        stayNightId: null,
        source: 'checkout',
        postedBy: null,
        now: new Date('2030-09-18T09:00:00Z'),
        chargeCode: 'late_fee_as_night',
      }),
    );
    expect(await db.withContext(t.ctx(), (tx) => folios.nightRateBasis(tx, lineId))).toBe(911_000);
    const r = await c.mgr!.send('POST', url(`/folios/${b.folioId}/lines/${lineId}/foc`), {
      kind: 'foc',
      amountVnd: 911_000,
      reasonCode: 'service_recovery',
    });
    expect(r.statusCode, r.body).toBe(201);
    expect(r.json().status).toBe('approved');
  });

  // ───────────── BUG-R2-144: periods of a fridge (ARC R1/R7/R9, DOM BR-703-02, cases 12–19) ─────────────

  const b14 = async (b: Booking, to: string, day: string) => {
    await vacant(to);
    const body = {
      newRoomId: ids.rooms[to],
      effectiveDate: day,
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
  };
  /**
   * HK finishes the open refill task(s) of a room through the API at `iso` (ARC 16.17 mục 2: "done" = the
   * processed `complete` – state_transition – never a bare hk_task row).
   */
  const refillDone = async (b: Booking, room: string, iso: string) => {
    const open = await q<{ id: string }>(
      `SELECT id FROM hk_task WHERE reservation_id = $1 AND room_id = $2 AND type = 'minibar_refill'
          AND status IN ('open', 'in_progress') ORDER BY created_at, id`,
      [b.id, ids.rooms[room]],
    );
    for (const t of open) await hkComplete(t.id, iso);
  };
  const blockers = async (b: Booking) =>
    (await c.fd!.get(url(`/reservations/${b.id}/checkout-summary?checkoutTime=11:00`))).json() as {
      blockers?: string[];
      minibarUncheckedRooms?: Array<{ roomId: string; reason?: string }>;
    };

  it('case 12 / BR-703-02 (b3): 202 → 203 → back to 202 after the refill – a new period: 1 beer → a separate 35.000, the 70.000 kept; B18 blocked until counted; total 2.481.000', async () => {
    const o = oracle('BR-703-02');
    const cse = (
      o.input.cases as Array<{ key: string; stay: [string, string]; roomTotalVnd: number }>
    ).find((x) => x.key === 'b3')!;
    const ex = o.expected.b3;
    const { b } = await inHouse('202', cse.stay[0], cse.stay[1]);
    expect((await totals(b)).totalVnd).toBe(cse.roomTotalVnd);
    await at('2029-03-20T10:00:00+07:00');
    await b14(b, '203', '2029-03-20');
    await count(b, { bia: 2 }, ids.rooms['202']);
    const tasks = await q<{ n: number }>(
      `SELECT count(*)::int AS n FROM hk_task WHERE reservation_id = $1 AND room_id = $2 AND type = 'minibar_refill'`,
      [b.id, ids.rooms['202']],
    );
    expect(tasks[0]!.n).toBe(ex.refillTaskAfterFirstCount);
    await refillDone(b, '202', '2029-03-20T14:00:00+07:00');
    await at('2029-03-21T10:00:00+07:00');
    await count(b, {}); // 203, nothing used
    await b14(b, '202', '2029-03-21');
    await at('2029-03-22T09:00:00+07:00');
    const before = await blockers(b);
    expect(before.blockers ?? []).toContain(ex.b18BeforeRecountBlocker);
    expect((before.minibarUncheckedRooms ?? []).map((r) => r.roomId)).toEqual([ids.rooms['202']]);
    // ARC 16.14: counted before, the stay went on in it (period opened by `refill`) → stay_continued
    expect((before.minibarUncheckedRooms ?? [])[0]).toMatchObject({ reason: 'stay_continued' });
    await at('2029-03-22T11:00:00+07:00');
    const blocked = await act(b.id, 'check-out', { checkoutTime: '11:00' });
    expect(blocked.statusCode).toBe(ex.b18BeforeRecountHttp);
    await count(b, { bia: 1 });
    const lines = (await liveLines(b))
      .filter((l) => l.category === 'minibar')
      .map((l) => l.amountVnd);
    expect(lines.sort()).toEqual([35_000, ex.firstPeriodLineKept].sort());
    expect((await mb(b)).gross).toBe(ex.minibarVnd);
    expect((await totals(b)).totalVnd).toBe(ex.folioTotalVnd);
    // control (case 17): a re-count of the same fridge in the same period replaces the count of that period
    await count(b, { bia: 1 });
    expect((await mb(b)).gross).toBe(ex.minibarVnd);
    const co = await checkout(b, '11:00');
    expect(co.status, co.body).toBe(200);
  });

  it('cases 13/14 / BR-703-02: second period after a refill – bia 2 + coca 1 then bia 1 → 130.000; bia 2 then bia 2 → 140.000 (no keep across periods)', async () => {
    const o = oracle('BR-703-02');
    const run = async (key: string, from: string, to: string, mid: string) => {
      const cse = (
        o.input.cases as Array<{
          key: string;
          roomNo: string;
          firstPeriod: Record<string, number>;
          secondPeriod: Record<string, number>;
        }>
      ).find((x) => x.key === key)!;
      const { b } = await inHouse(cse.roomNo, from, to);
      await at(`${mid}T10:00:00+07:00`);
      await b14(b, '302', mid);
      await count(b, cse.firstPeriod, ids.rooms[cse.roomNo]);
      await refillDone(b, cse.roomNo, `${mid}T14:00:00+07:00`);
      await at(`${mid}T16:00:00+07:00`);
      await count(b, {}); // 302, nothing used
      await b14(b, cse.roomNo, mid);
      await at(`${to}T09:00:00+07:00`);
      await count(b, cse.secondPeriod);
      expect((await mb(b)).gross, key).toBe(o.expected[key].minibarVnd);
      await at(`${to}T11:00:00+07:00`);
      const co = await checkout(b, '11:00');
      expect(co.status, co.body).toBe(200);
    };
    await run('twoItems', '2029-04-02', '2029-04-04', '2029-04-03');
    await run('samePeriodUse', '2029-04-09', '2029-04-11', '2029-04-10');
  });

  /** Refill tasks of a fridge, oldest first: status + items by code. */
  const refills = async (b: Booking, room: string) =>
    (
      await q<{
        id: string;
        status: string;
        refill_items: Array<{ itemId: string; quantity: number }> | null;
      }>(
        `SELECT id, status, refill_items FROM hk_task
          WHERE reservation_id = $1 AND room_id = $2 AND type = 'minibar_refill' ORDER BY created_at, id`,
        [b.id, ids.rooms[room]],
      )
    ).map((t) => ({
      id: t.id,
      status: t.status,
      items: Object.fromEntries((t.refill_items ?? []).map((i) => [codeOf[i.itemId], i.quantity])),
    }));
  /** HK completes a task through the API (setTaskStatus → MINIBAR_REFILL_DONE_PORT, ARC 16.16). */
  const hkComplete = async (taskId: string, iso: string) => {
    await at(iso);
    const r = await c.hk!.send('POST', url(`/hk-tasks/${taskId}/actions/complete`), {
      performedAt: new Date(iso).toISOString(),
    });
    expect(r.statusCode, r.body).toBe(200);
  };
  /** The latest fill (period) of a fridge: source, filled_at and its marks by code. */
  const lastFill = async (b: Booking, room: string) => {
    const [f] = await q<{ id: string; source: string; filled_at: Date }>(
      `SELECT id, source, filled_at FROM minibar_fill WHERE reservation_id = $1 AND room_id = $2
        ORDER BY created_at DESC, id DESC LIMIT 1`,
      [b.id, ids.rooms[room]],
    );
    const lines = await q<{ item_id: string; qty: number }>(
      'SELECT item_id, qty FROM minibar_fill_line WHERE fill_id = $1',
      [f!.id],
    );
    return {
      source: f!.source,
      filledAt: f!.filled_at,
      marks: Object.fromEntries(lines.map((l) => [codeOf[l.item_id], Number(l.qty)])),
    };
  };
  const minibarAmounts = async (b: Booking) =>
    (await liveLines(b))
      .filter((l) => l.category === 'minibar')
      .map((l) => l.amountVnd)
      .sort((x, y) => x - y);
  /** r9 base (DOM 18/10): 202, stay of 3 days; day 2 10:00 B14 → 203, 202 counted 2 beers (T1), back to 202. */
  const r9Base = async (from: string, mid: string, to: string) => {
    const { b } = await inHouse('202', from, to);
    await at(`${mid}T10:00:00+07:00`);
    await b14(b, '203', mid);
    await count(b, { bia: 2 }, ids.rooms['202']);
    await at(`${mid}T12:00:00+07:00`);
    await count(b, {}); // 203
    await b14(b, '202', mid);
    return b;
  };

  it('case 16 / r9_16 (DOM 18/10): back to 202 before the refill is done – `carry` period (beer mark 0), T1 KEPT open; 1 snack → 30.000 more, the 70.000 kept (100.000); after B18 T1 (2 bia) + T2 (1 snack)', async () => {
    const ex = oracle('BR-703-02').expected.r9_16;
    const b = await r9Base('2029-04-16', '2029-04-17', '2029-04-18');
    const t1 = await refills(b, '202');
    expect(t1.map((t) => t.status)).toEqual(['open']);
    expect(ex.refillTaskT1StillOpen).toBe(true);
    expect((await lastFill(b, '202')).source).toBe('carry');
    const std = await standard(b);
    expect(std.items.some((i) => i.itemId === items.bia)).toBe(false); // nothing left of the beer
    expect(std.latestCheck).toBeNull();
    await at('2029-04-18T09:00:00+07:00');
    await count(b, { snack: 1 });
    expect(await minibarAmounts(b)).toEqual([ex.newLineVnd, 70_000]);
    expect((await mb(b)).gross).toBe(ex.minibarVnd);
    await at('2029-04-18T11:00:00+07:00');
    const co = await checkout(b, '11:00');
    expect(co.status, co.body).toBe(200);
    expect(await refills(b, '202')).toEqual([
      { id: t1[0]!.id, status: 'open', items: { bia: 2 } },
      { id: expect.any(String), status: 'open', items: { snack: 1 } },
    ]);
    expect(ex.refillTasksAfterB18).toHaveLength(2);
  });

  it('case 16b / r9_16b: HK finishes T1 while the guest is back in 202 – a `refill` period, mark bia 0 + 2, snack 1 + 0 (1 snack eaten before, not counted yet); B18 bia 1, snack 0 → 35.000 + 30.000, 135.000', async () => {
    const ex = oracle('BR-703-02').expected.r9_16b;
    const b = await r9Base('2029-08-06', '2029-08-07', '2029-08-08');
    const [t1] = await refills(b, '202');
    await hkComplete(t1!.id, '2029-08-07T15:00:00+07:00');
    const f = await lastFill(b, '202');
    expect(f.source).toBe('refill');
    expect(f.filledAt.toISOString()).toBe(new Date('2029-08-07T15:00:00+07:00').toISOString());
    expect(f.marks).toMatchObject(ex.periodRefillMoc);
    // the stay went on in a counted fridge → stay_continued (ARC 16.14 – priority over new_fill)
    expect((await blockers(b)).minibarUncheckedRooms).toEqual([
      expect.objectContaining({ roomId: ids.rooms['202'], reason: 'stay_continued' }),
    ]);
    await at('2029-08-08T09:00:00+07:00');
    await count(b, { bia: 1, snack: 1 });
    expect(await minibarAmounts(b)).toEqual(
      [...ex.newLinesVnd, ex.firstPeriodLineKept].sort((x: number, y: number) => x - y),
    );
    expect((await mb(b)).gross).toBe(ex.minibarVnd);
    await at('2029-08-08T11:00:00+07:00');
    const co = await checkout(b, '11:00');
    expect(co.status, co.body).toBe(200);
  });

  it('case 16c / r9_16c (no double charge): 09:00 count in the `carry` period snack 0 → 30.000; 09:05 HK finishes T1 → mark bia 2, snack dropped; 11:00 B18 bia 2/2 → no new line; 100.000 (not 130.000); T2 (1 snack) from the 09:00 count', async () => {
    const ex = oracle('BR-703-02').expected.r9_16c;
    const b = await r9Base('2029-08-13', '2029-08-14', '2029-08-15');
    const [t1] = await refills(b, '202');
    await at('2029-08-15T09:00:00+07:00');
    await count(b, { snack: 1 });
    expect(await minibarAmounts(b)).toEqual([ex.carryLineVnd, 70_000]);
    await hkComplete(t1!.id, '2029-08-15T09:05:00+07:00');
    const f = await lastFill(b, '202');
    expect(f.source).toBe('refill');
    expect(f.marks).toMatchObject(ex.refillMoc);
    expect(f.marks).not.toHaveProperty('snack');
    await at('2029-08-15T11:00:00+07:00');
    await count(b, {});
    expect((await minibarAmounts(b)).length).toBe(2); // newLineAtB18 = false
    expect(ex.newLineAtB18).toBe(false);
    expect((await mb(b)).gross).toBe(ex.minibarVnd);
    expect((await mb(b)).gross).not.toBe(ex.wrongMinibarVnd);
    const co = await checkout(b, '11:00');
    expect(co.status, co.body).toBe(200);
    expect(await refills(b, '202')).toEqual([
      { id: t1!.id, status: 'done', items: { bia: 2 } },
      { id: expect.any(String), status: 'open', items: { snack: 1 } },
    ]);
  });

  it('cases 18/19: B13 after the count – charged count → recount needed, nothing more used → 70.000; count of nothing → recount, 1 beer → 35.000 (replaces it)', async () => {
    // 18 (r9_18 (a)): the count had no refill task yet → B13 raises T1 at once (DOM note 1); HK not done
    const ex18 = oracle('BR-703-02').expected.r9_18;
    const { b } = await inHouse('301', '2029-05-07', '2029-05-08');
    await at('2029-05-08T09:00:00+07:00');
    await count(b, { bia: 2 });
    expect(await refills(b, '301')).toEqual([]);
    const ext = await act(b.id, 'extend', { nights: 1 });
    expect(ext.statusCode, ext.body).toBe(200);
    expect(await refills(b, '301')).toEqual([
      { id: expect.any(String), status: 'open', items: { bia: 2 } },
    ]);
    expect(ex18.refillTaskCreatedOnB13).toContain('2 bia');
    expect((await blockers(b)).blockers ?? []).toContain('minibar_not_checked');
    await at('2029-05-09T09:00:00+07:00');
    await count(b, {});
    expect((await mb(b)).gross).toBe(ex18.minibarVnd.notRefilled);
    await at('2029-05-09T11:00:00+07:00');
    expect((await checkout(b, '11:00')).status).toBe(200);
    expect((await refills(b, '301')).length).toBe(1); // the B18 count used nothing – no second task
    // 19
    const s2 = await inHouse('302', '2029-05-14', '2029-05-15');
    await at('2029-05-15T09:00:00+07:00');
    await count(s2.b, {});
    const ext2 = await act(s2.b.id, 'extend', { nights: 1 });
    expect(ext2.statusCode, ext2.body).toBe(200);
    expect((await blockers(s2.b)).blockers ?? []).toContain('minibar_not_checked');
    await at('2029-05-16T09:00:00+07:00');
    await count(s2.b, { bia: 1 });
    expect((await mb(s2.b)).gross).toBe(35_000);
    const live = await q<{ n: number }>(
      `SELECT count(*)::int AS n FROM minibar_check WHERE reservation_id = $1 AND replaced_by_check_id IS NULL`,
      [s2.b.id],
    );
    expect(live[0]!.n).toBe(1);
  });

  it('case 18 (b) / r9_18: B13 after the count → T1 (2 bia); HK finishes it while the guest is in 301 → mark bia 0 + 2, snack 1; B18 counts bia 2, snack 1 → still 70.000, one task', async () => {
    const ex = oracle('BR-703-02').expected.r9_18;
    const { b } = await inHouse('301', '2029-08-20', '2029-08-21');
    await at('2029-08-21T09:00:00+07:00');
    await count(b, { bia: 2 });
    const ext = await act(b.id, 'extend', { nights: 1 });
    expect(ext.statusCode, ext.body).toBe(200);
    const [t1] = await refills(b, '301');
    await hkComplete(t1!.id, '2029-08-21T10:00:00+07:00');
    expect((await lastFill(b, '301')).marks).toMatchObject({ bia: 2, snack: 1 });
    await at('2029-08-22T09:00:00+07:00');
    await count(b, {});
    expect((await mb(b)).gross).toBe(ex.minibarVnd.refilled);
    await at('2029-08-22T11:00:00+07:00');
    expect((await checkout(b, '11:00')).status).toBe(200);
    expect(await refills(b, '301')).toEqual([{ id: t1!.id, status: 'done', items: { bia: 2 } }]);
  });

  it('case 20 / r9_t (DOM (t)): 2 beers counted, FOC 70.000 approved (net 0) – still a charged count by quantity: back in 202 → `carry` (mark bia 0); nothing more used → no new line; 70.000 − 70.000 = 0', async () => {
    const ex = oracle('BR-703-02').expected.r9_t;
    const { b } = await inHouse('202', '2029-08-27', '2029-08-29');
    await at('2029-08-28T10:00:00+07:00');
    await b14(b, '203', '2029-08-28');
    await count(b, { bia: 2 }, ids.rooms['202']);
    await approvedFoc(b, (await beer(b)).id, ex.focVnd);
    expect((await mb(b)).net).toBe(0);
    await at('2029-08-28T12:00:00+07:00');
    await count(b, {}); // 203
    await b14(b, '202', '2029-08-28');
    const f = await lastFill(b, '202');
    expect(f.source === 'carry').toBe(ex.carryPeriodOpened);
    expect(f.marks.bia).toBe(0);
    await at('2029-08-29T09:00:00+07:00');
    await count(b, {});
    expect((await minibarAmounts(b)).length).toBe(1); // newLineAtB18 = false
    expect(await mb(b)).toEqual({
      gross: ex.minibarVnd,
      foc: -ex.focVnd,
      net: ex.minibarNetVnd,
    });
    await at('2029-08-29T11:00:00+07:00');
    const co = await checkout(b, '11:00');
    expect(co.status, co.body).toBe(200);
  });

  it('ARC 16.15 (v): a count of nothing made stale by B13 (self-reference) – closed by the refill done in house (made live again), B18 counts the new period: a checked-out stay keeps no self-reference; the live-count index is NULLS NOT DISTINCT', async () => {
    const selfRefs = async (b: Booking) =>
      (
        await q<{ n: number }>(
          `SELECT count(*)::int AS n FROM minibar_check WHERE reservation_id = $1 AND replaced_by_check_id = id`,
          [b.id],
        )
      )[0]!.n;
    const { b } = await inHouse('302', '2029-09-03', '2029-09-04');
    await at('2029-09-04T09:00:00+07:00');
    await count(b, { bia: 2 });
    expect((await act(b.id, 'extend', { nights: 1 })).statusCode).toBe(200); // T1 + carry
    await at('2029-09-05T09:00:00+07:00');
    await count(b, {}); // nothing used in the carry period
    expect((await act(b.id, 'extend', { nights: 1 })).statusCode).toBe(200);
    expect(await selfRefs(b)).toBe(1);
    const [t1] = await refills(b, '302');
    await hkComplete(t1!.id, '2029-09-05T10:00:00+07:00');
    expect(await selfRefs(b)).toBe(0);
    expect((await lastFill(b, '302')).marks).toMatchObject({ bia: 2, snack: 1 });
    expect((await blockers(b)).blockers ?? []).toContain('minibar_not_checked');
    await at('2029-09-06T09:00:00+07:00');
    await count(b, {});
    expect((await mb(b)).gross).toBe(70_000);
    await at('2029-09-06T11:00:00+07:00');
    expect((await checkout(b, '11:00')).status).toBe(200);
    expect(await selfRefs(b)).toBe(0);
    expect((await refills(b, '302')).map((t) => t.items)).toEqual([{ bia: 2 }]);
    const [idx] = await q<{ def: string }>(
      `SELECT pg_get_indexdef(i.indexrelid) AS def FROM pg_index i JOIN pg_class c ON c.oid = i.indexrelid
        WHERE c.relname = 'minibar_check_live_checkout_key'`,
    );
    expect(idx!.def).toContain('NULLS NOT DISTINCT');
  });

  // ───────────── ARC 16.16 bổ sung: one lock per fridge – interleaved transactions = run in sequence ─────────────

  type Sent = Awaited<ReturnType<Client['send']>>;
  const fridgeKey = (b: Booking, room: string) => `minibar:${b.id}:${ids.rooms[room]}`;
  /**
   * Holds the fridge lock on a connection of its own and starts `steps` one by one – each once every earlier one
   * waits on that lock (directly, or behind a transaction that does) – then releases it: they go in that order.
   * A step that never waits (no fridge lock on its path) fails the test.
   */
  const interleaved = async (key: string, steps: Array<() => Promise<Sent>>): Promise<Sent[]> => {
    // The steps' own connections are opened before the hold (a cold pool would connect while the clock runs).
    await Promise.all(
      Array.from({ length: steps.length + 1 }, () =>
        db.withContext(t.ctx(), (tx) => tx.query('SELECT 1')),
      ),
    );
    const blocker = await db.pool.connect();
    const waiting = async () =>
      (
        await blocker.query<{ n: number }>(
          `WITH k AS (SELECT hashtextextended($1, 0) AS key),
                f AS (SELECT l.pid FROM pg_locks l, k
                       WHERE l.locktype = 'advisory' AND NOT l.granted AND l.objsubid = 1
                         AND l.classid::bigint = ((k.key >> 32) & 4294967295)
                         AND l.objid::bigint = (k.key & 4294967295))
           SELECT count(*)::int AS n FROM pg_stat_activity a
            WHERE a.pid IN (SELECT pid FROM f)
               OR EXISTS (SELECT 1 FROM f WHERE f.pid = ANY (pg_blocking_pids(a.pid)))`,
          [key],
        )
      ).rows[0]!.n;
    const pending: Array<Promise<Sent>> = [];
    try {
      await blocker.query('SELECT pg_advisory_lock(hashtextextended($1, 0))', [key]);
      for (const step of steps) {
        pending.push(step());
        const until = Date.now() + 3_000;
        while ((await waiting()) < pending.length) {
          if (Date.now() > until) throw new Error(`step ${pending.length} never waited on ${key}`);
          await new Promise((r) => setTimeout(r, 20));
        }
      }
    } finally {
      await blocker.query('SELECT pg_advisory_unlock(hashtextextended($1, 0))', [key]);
      blocker.release();
    }
    return Promise.all(pending);
  };
  const completeTask = (taskId: string, iso: string) => () =>
    c.hk!.send('POST', url(`/hk-tasks/${taskId}/actions/complete`), {
      performedAt: new Date(iso).toISOString(),
    });
  const sendCount =
    (
      b: Booking,
      lines: Array<{ itemId: string; remainingQty: number }>,
      period?: { periodId: string | null; roomId?: string },
    ) =>
    () =>
      c.fd!.send('POST', url(`/reservations/${b.id}/minibar-checks`), {
        mode: 'checkout',
        lines,
        ...(period ?? {}),
      });
  /** Lines of a checkout count on the fridge's CURRENT period: `used` per code. */
  const linesNow = async (b: Booking, used: Record<string, number>) =>
    (await standard(b)).items.map((i) => ({
      itemId: i.itemId,
      remainingQty: i.standardQty - (used[codeOf[i.itemId] ?? ''] ?? 0),
    }));
  /** B13 after 2 beers counted: T1 (2 bia) + a `carry` period (beer mark 0). */
  const extendedAfterBeers = async (room: string, from: string, to: string) => {
    const { b } = await inHouse(room, from, to);
    await at(`${to}T09:00:00+07:00`);
    await count(b, { bia: 2 });
    expect((await act(b.id, 'extend', { nights: 1 })).statusCode).toBe(200);
    const [t1] = await refills(b, room);
    return { b, t1: t1! };
  };

  it('race – refill done ‖ count, the refill first: the count prepared on the `carry` period meets the refill period under the lock → 422 MINIBAR_ITEMS_INCOMPLETE as in sequence (not a count in a closed period); recount → 100.000', async () => {
    const { b, t1 } = await extendedAfterBeers('301', '2029-09-10', '2029-09-11');
    const lines = await linesNow(b, { snack: 1 });
    await at('2029-09-11T10:00:00+07:00');
    const [done, counted] = await interleaved(fridgeKey(b, '301'), [
      completeTask(t1.id, '2029-09-11T10:00:00+07:00'),
      sendCount(b, lines),
    ]);
    expect(done!.statusCode, done!.body).toBe(200);
    expect(counted!.statusCode, counted!.body).toBe(422);
    expect(JSON.stringify(counted!.json().errors)).toContain('MINIBAR_ITEMS_INCOMPLETE');
    // = the refill alone: mark bia 0 + 2, snack 1 – and the new period is not counted
    expect((await lastFill(b, '301')).marks).toMatchObject({ bia: 2, snack: 1 });
    expect((await blockers(b)).blockers ?? []).toContain('minibar_not_checked');
    await count(b, { snack: 1 });
    expect((await mb(b)).gross).toBe(100_000);
  });

  it('race – count ‖ refill done, the count first: the refill reads that count under the lock → mark bia 0 + 2, snack 0 dropped (as in sequence, = 16c – not the stale snack 1); B18 → 100.000, T2 (1 snack)', async () => {
    const { b, t1 } = await extendedAfterBeers('302', '2029-09-17', '2029-09-18');
    const lines = await linesNow(b, { snack: 1 });
    await at('2029-09-18T10:00:00+07:00');
    const [counted, done] = await interleaved(fridgeKey(b, '302'), [
      sendCount(b, lines),
      completeTask(t1.id, '2029-09-18T10:00:00+07:00'),
    ]);
    expect(counted!.statusCode, counted!.body).toBe(201);
    expect(done!.statusCode, done!.body).toBe(200);
    const f = await lastFill(b, '302');
    expect(f.source).toBe('refill');
    expect(f.marks).toMatchObject({ bia: 2 });
    expect(f.marks).not.toHaveProperty('snack');
    await at('2029-09-19T09:00:00+07:00');
    await count(b, {});
    expect((await mb(b)).gross).toBe(100_000);
    await at('2029-09-19T11:00:00+07:00');
    expect((await checkout(b, '11:00')).status).toBe(200);
    expect((await refills(b, '302')).map((t) => [t.status, t.items])).toEqual([
      ['done', { bia: 2 }],
      ['open', { snack: 1 }],
    ]);
  });

  it('race – recount ‖ B13, the recount first: B13 (folio → fridge) opens the `carry` period from the NEW count (bia 0) and gives it its task (2 bia) – as in sequence; 70.000', async () => {
    const { b } = await inHouse('401', '2029-09-24', '2029-09-25');
    await at('2029-09-25T09:00:00+07:00');
    await count(b, { bia: 1 });
    const lines = await linesNow(b, { bia: 2 });
    const [counted, extended] = await interleaved(fridgeKey(b, '401'), [
      sendCount(b, lines),
      () => act(b.id, 'extend', { nights: 1 }),
    ]);
    expect(counted!.statusCode, counted!.body).toBe(201);
    expect(extended!.statusCode, extended!.body).toBe(200);
    expect((await mb(b)).gross).toBe(70_000);
    const f = await lastFill(b, '401');
    expect(f.source).toBe('carry');
    expect(f.marks.bia).toBe(0);
    expect((await refills(b, '401')).map((t) => [t.status, t.items])).toEqual([
      ['open', { bia: 2 }],
    ]);
  });

  it('race – refill done ‖ B13, the refill first: the refill (FK parents KEY SHARE, then the fridge) goes first, B13 waits on the booking – no 40P01; refill mark bia 0 + 2 (snack 0 dropped), then B13 gives the snack count its task', async () => {
    const { b, t1 } = await extendedAfterBeers('202', '2029-10-01', '2029-10-02');
    await at('2029-10-02T09:30:00+07:00');
    await count(b, { snack: 1 }); // the `carry` period: 30.000, no task yet
    await at('2029-10-02T10:00:00+07:00');
    const [done, extended] = await interleaved(fridgeKey(b, '202'), [
      completeTask(t1.id, '2029-10-02T10:00:00+07:00'),
      () => act(b.id, 'extend', { nights: 1 }),
    ]);
    expect(done!.statusCode, done!.body).toBe(200);
    expect(extended!.statusCode, extended!.body).toBe(200);
    const f = await lastFill(b, '202');
    expect(f.source).toBe('refill');
    expect(f.marks).toMatchObject({ bia: 2 });
    expect(f.marks).not.toHaveProperty('snack');
    expect((await mb(b)).gross).toBe(100_000);
    expect((await refills(b, '202')).map((t) => [t.status, t.items])).toEqual([
      ['done', { bia: 2 }],
      ['open', { snack: 1 }],
    ]);
  });

  // ───────────── ARC 16.16 bổ sung 2 (ab): MinibarStandard.periodId → 409 MINIBAR_PERIOD_CHANGED ─────────────

  const checkRows = async (b: Booking) =>
    (
      await q<{ n: number }>(
        'SELECT count(*)::int AS n FROM minibar_check WHERE reservation_id = $1',
        [b.id],
      )
    )[0]!.n;
  /** B13 after ONE beer counted: T1 (1 bia) + a `carry` period – bia mark 1, the same items as after the refill. */
  const extendedAfterOneBeer = async (room: string, from: string, to: string) => {
    const { b } = await inHouse(room, from, to);
    await at(`${to}T09:00:00+07:00`);
    await count(b, { bia: 1 });
    expect((await act(b.id, 'extend', { nights: 1 })).statusCode).toBe(200);
    const [t1] = await refills(b, room);
    return { b, t1: t1! };
  };

  it('(ab) count prepared on the `carry` period (bia left 0), HK finishes T1 meanwhile (bia 1 + 1 = 2, same items) → with that periodId 409 MINIBAR_PERIOD_CHANGED, nothing written (applied to the new period it would charge 2 beers); reload → same periodId → 201, 35.000 + 35.000', async () => {
    const { b, t1 } = await extendedAfterOneBeer('203', '2029-10-08', '2029-10-09');
    const old = await standard(b);
    expect(typeof old.periodId).toBe('string');
    const stale = await linesNow(b, { bia: 1 }); // the last beer gone – before the refill
    await hkComplete(t1.id, '2029-10-09T10:00:00+07:00');
    const fresh = await standard(b);
    expect(fresh.periodId).not.toBe(old.periodId);
    // the same items as the old period – only the beer mark changed (1 → 2): a 422 cannot catch it
    expect(fresh.items.map((i) => i.itemId).sort()).toEqual(old.items.map((i) => i.itemId).sort());
    expect(fresh.items.find((i) => i.itemId === items.bia)!.standardQty).toBe(2);
    const before = { totals: await totals(b), checks: await checkRows(b) };
    const r = await sendCount(b, stale, {
      periodId: old.periodId ?? null,
      roomId: ids.rooms['203']!,
    })();
    expect(r.statusCode, r.body).toBe(409);
    expect(r.json().code).toBe('MINIBAR_PERIOD_CHANGED');
    expect(await totals(b)).toEqual(before.totals);
    expect(await checkRows(b)).toBe(before.checks);
    expect((await lastFill(b, '203')).source).toBe('refill');
    // reload and count again: 1 beer drunk since the refill was booked (mark 2, left 1)
    const ok = await sendCount(b, await linesNow(b, { bia: 1 }), {
      periodId: fresh.periodId ?? null,
      roomId: ids.rooms['203']!,
    })();
    expect(ok.statusCode, ok.body).toBe(201);
    expect(await minibarAmounts(b)).toEqual([35_000, 35_000]);
  });

  it("(ab)/(ac) ARC 16.19 K11-03: periodId without roomId → 422 REQUIRED; null on a fridge never filled → 201, then null again (the fridge has its fill now) → 409; the fridge's periodId → 201; an unknown periodId → 409, nothing written; no periodId → not compared (201)", async () => {
    const { b } = await inHouse('101', '2029-10-15', '2029-10-16');
    await at('2029-10-16T09:00:00+07:00');
    const room = ids.rooms['101']!;
    const std = await standard(b);
    expect(std.periodId).toBeNull();
    expect(std.roomId ?? room).toBe(room); // MinibarStandard.roomId (ARC regenerates the contract after #12)
    const noRoom = await sendCount(b, await linesNow(b, { bia: 1 }), { periodId: null })();
    expect(noRoom.statusCode, noRoom.body).toBe(422);
    expect(noRoom.json().errors).toEqual([{ field: 'roomId', code: 'REQUIRED' }]);
    const first = await sendCount(b, await linesNow(b, { bia: 1 }), {
      periodId: null,
      roomId: room,
    })();
    expect(first.statusCode, first.body).toBe(201);
    const filled = (await standard(b)).periodId;
    expect(typeof filled).toBe('string'); // its check_in fill
    const checks = await checkRows(b);
    const nullAgain = await sendCount(b, await linesNow(b, { bia: 2 }), {
      periodId: null,
      roomId: room,
    })();
    expect(nullAgain.statusCode, nullAgain.body).toBe(409);
    expect(nullAgain.json().code).toBe('MINIBAR_PERIOD_CHANGED');
    expect(await checkRows(b)).toBe(checks);
    const recount = await sendCount(b, await linesNow(b, { bia: 2 }), {
      periodId: filled ?? null,
      roomId: room,
    })();
    expect(recount.statusCode, recount.body).toBe(201);
    const checks2 = await checkRows(b);
    const unknown = await sendCount(b, await linesNow(b, { bia: 2 }), {
      periodId: uuidv7(),
      roomId: room,
    })();
    expect(unknown.statusCode, unknown.body).toBe(409);
    expect(unknown.json().code).toBe('MINIBAR_PERIOD_CHANGED');
    expect(await checkRows(b)).toBe(checks2);
    const legacy = await sendCount(b, await linesNow(b, { bia: 2, snack: 1 }))();
    expect(legacy.statusCode, legacy.body).toBe(201);
    expect((await mb(b)).gross).toBe(100_000);
  });

  it('(ab) idempotency: a 409 MINIBAR_PERIOD_CHANGED rolls back – no completed key is kept; the SAME Idempotency-Key with the new count → 201 (not 422 IDEMPOTENCY_KEY_REUSED), then replayed', async () => {
    const { b, t1 } = await extendedAfterOneBeer('202', '2029-11-05', '2029-11-06');
    const old = await standard(b);
    const stale = await linesNow(b, { bia: 1 });
    await hkComplete(t1.id, '2029-11-06T10:00:00+07:00');
    const key = { 'idempotency-key': uuidv7() };
    const path = url(`/reservations/${b.id}/minibar-checks`);
    const r409 = await c.fd!.send(
      'POST',
      path,
      { mode: 'checkout', lines: stale, periodId: old.periodId ?? null, roomId: ids.rooms['202'] },
      key,
    );
    expect(r409.statusCode, r409.body).toBe(409);
    expect(r409.json().code).toBe('MINIBAR_PERIOD_CHANGED');
    const body = {
      mode: 'checkout',
      lines: await linesNow(b, { bia: 1 }),
      periodId: (await standard(b)).periodId ?? null,
      roomId: ids.rooms['202'],
    };
    const ok = await c.fd!.send('POST', path, body, key);
    expect(ok.statusCode, ok.body).toBe(201);
    expect(ok.headers['idempotent-replayed']).toBeUndefined();
    const again = await c.fd!.send('POST', path, body, key);
    expect(again.statusCode, again.body).toBe(201);
    expect(again.headers['idempotent-replayed']).toBe('true');
    expect(again.json().id).toBe(ok.json().id);
    expect(await minibarAmounts(b)).toEqual([35_000, 35_000]);
  });

  it('(ab) race with periodId – refill done ‖ count: refill first → 409 MINIBAR_PERIOD_CHANGED (compared under the fridge lock); count first → 201, then the refill reads it', async () => {
    const one = await extendedAfterOneBeer('301', '2029-10-22', '2029-10-23');
    const p1 = (await standard(one.b)).periodId ?? null;
    const l1 = await linesNow(one.b, { bia: 1 });
    await at('2029-10-23T10:00:00+07:00');
    const [done1, counted1] = await interleaved(fridgeKey(one.b, '301'), [
      completeTask(one.t1.id, '2029-10-23T10:00:00+07:00'),
      sendCount(one.b, l1, { periodId: p1, roomId: ids.rooms['301']! }),
    ]);
    expect(done1!.statusCode, done1!.body).toBe(200);
    expect(counted1!.statusCode, counted1!.body).toBe(409);
    expect(counted1!.json().code).toBe('MINIBAR_PERIOD_CHANGED');
    expect(await minibarAmounts(one.b)).toEqual([35_000]);

    const two = await extendedAfterOneBeer('302', '2029-10-29', '2029-10-30');
    const p2 = (await standard(two.b)).periodId ?? null;
    const l2 = await linesNow(two.b, { bia: 1 });
    await at('2029-10-30T10:00:00+07:00');
    const [counted2, done2] = await interleaved(fridgeKey(two.b, '302'), [
      sendCount(two.b, l2, { periodId: p2, roomId: ids.rooms['302']! }),
      completeTask(two.t1.id, '2029-10-30T10:00:00+07:00'),
    ]);
    expect(counted2!.statusCode, counted2!.body).toBe(201);
    expect(done2!.statusCode, done2!.body).toBe(200);
    expect(await minibarAmounts(two.b)).toEqual([35_000, 35_000]);
    // the refill took the count as its base: bia 0 + 1
    expect((await lastFill(two.b, '302')).marks).toMatchObject({ bia: 1 });
  });

  // ───────────── recheck 5: BUG-R2-158 (A1), BUG-R2-164 (0067) ─────────────

  const liveCountRows = async (b: Booking) =>
    (
      await q<{ n: number }>(
        `SELECT count(*)::int AS n FROM minibar_check
          WHERE reservation_id = $1 AND mode = 'checkout' AND replaced_by_check_id IS NULL`,
        [b.id],
      )
    )[0]!.n;
  const fillsOf = async (b: Booking) =>
    (
      await q<{ source: string }>(
        'SELECT source FROM minibar_fill WHERE reservation_id = $1 ORDER BY created_at, id',
        [b.id],
      )
    ).map((r) => r.source);

  it('BUG-R2-158 (A1): desk ‖ HK count a never-filled fridge at the same time (2 beers, departure day), both orders → one `check_in` fill, one live count, 70.000; latestCheck = B18 = 70.000; one task {bia: 2}', async () => {
    const cases = [
      { room: '102', from: '2030-01-02', to: '2030-01-03', first: 'fd' },
      { room: '401', from: '2030-01-09', to: '2030-01-10', first: 'hk' },
    ] as const;
    for (const k of cases) {
      const { b } = await inHouse(k.room, k.from, k.to);
      await at(`${k.to}T09:00:00+07:00`);
      expect((await standard(b)).periodId).toBeNull();
      const lines = await linesNow(b, { bia: 2 });
      const send = (who: 'fd' | 'hk') => () =>
        c[who]!.send('POST', url(`/reservations/${b.id}/minibar-checks`), {
          mode: 'checkout',
          lines,
        });
      const res = await interleaved(
        fridgeKey(b, k.room),
        k.first === 'fd' ? [send('fd'), send('hk')] : [send('hk'), send('fd')],
      );
      expect(
        res.map((r) => r.statusCode),
        res.map((r) => r.body).join(' | '),
      ).toEqual([201, 201]);
      expect(await fillsOf(b), k.room).toEqual(['check_in']);
      expect(await liveCountRows(b), k.room).toBe(1);
      expect((await mb(b)).gross, k.room).toBe(70_000);
      expect((await standard(b)).latestCheck?.totalVnd, k.room).toBe(70_000);
      await at(`${k.to}T11:00:00+07:00`);
      const co = await checkout(b, '11:00');
      expect(co.status, co.body).toBe(200);
      expect((await mb(b)).gross, k.room).toBe(70_000);
      expect((await refills(b, k.room)).map((t) => [t.status, t.items])).toEqual([
        ['open', { bia: 2 }],
      ]);
    }
  });

  /** Statements run as ottimo_owner (FORCE RLS: the tenant's property only), like the migrator would. */
  const asOwner = async (statements: Array<{ sql: string; params?: unknown[] }>) => {
    const pg = new PgClient({ connectionString: process.env.MIGRATION_DATABASE_URL });
    await pg.connect();
    try {
      await pg.query('SET ROLE ottimo_owner');
      await pg.query('BEGIN');
      await pg.query(
        `SELECT set_config('app.organization_id', $1, true), set_config('app.property_id', $2, true)`,
        [t.organizationId, t.propertyIds[0]],
      );
      for (const st of statements) await pg.query(st.sql, st.params ?? []);
      await pg.query('COMMIT');
    } catch (e) {
      await pg.query('ROLLBACK').catch(() => undefined);
      throw e;
    } finally {
      await pg.end();
    }
  };
  /** The data statements of a migration as shipped (its ALTER TABLE … RLS toggles left out – RLS stays on). */
  const migrationData = (file: string) =>
    readFileSync(join(__dirname, '../../src/db/migrations', file), 'utf8')
      .split('--> statement-breakpoint')
      .map((x) => x.replace(/^\s*--.*$/gm, '').trim())
      .filter((x) => x.length > 0 && !/^ALTER TABLE/i.test(x))
      .map((sql) => ({ sql }));

  it('BUG-R2-164 (0067, two phases): a 365486f count (no fill) → 0066 leaves fill_id NULL → 0067 back-fills the fill and the period → the desk re-confirms the same count: no new line (70.000, one live count); 1 → 35.000; B18 = room + 35.000', async () => {
    const { b, roomTotal } = await inHouse('402', '2030-02-04', '2030-02-05');
    await at('2030-02-05T09:00:00+07:00');
    await count(b, { bia: 2 });
    // phase 1 – the shape 365486f left: its record() wrote no fill for a fridge never filled
    await asOwner([
      { sql: 'UPDATE minibar_check SET fill_id = NULL WHERE reservation_id = $1', params: [b.id] },
      {
        sql: `DELETE FROM minibar_fill_line WHERE fill_id IN (SELECT id FROM minibar_fill WHERE reservation_id = $1)`,
        params: [b.id],
      },
      { sql: 'DELETE FROM minibar_fill WHERE reservation_id = $1', params: [b.id] },
    ]);
    // 0066 as shipped: no fill in force → fill_id stays NULL
    await asOwner(
      migrationData('0066_minibar_period.sql').filter((x) =>
        x.sql.includes('UPDATE minibar_check c'),
      ),
    );
    const periodOf = async () =>
      (
        await q<{ fill_id: string | null }>(
          'SELECT fill_id FROM minibar_check WHERE reservation_id = $1',
          [b.id],
        )
      ).map((r) => r.fill_id);
    expect(await periodOf()).toEqual([null]);
    // phase 2 – 0067
    const data67 = migrationData('0067_minibar_fill_backfill_unfilled.sql');
    expect(data67).toHaveLength(4);
    await asOwner(data67);
    expect(await invariants()).toEqual({ k1: 0, k2: 0, k3: 0, k4: 0 });
    expect(await fillsOf(b)).toEqual(['backfill']);
    const [fill] = await q<{ id: string; filled_at: Date }>(
      'SELECT id, filled_at FROM minibar_fill WHERE reservation_id = $1',
      [b.id],
    );
    expect(await periodOf()).toEqual([fill!.id]);
    expect((await lastFill(b, '402')).marks).toMatchObject({ bia: 2, snack: 1 });
    // the desk re-confirms the previous count (H16 step 1) → R6 keeps the line
    await count(b, { bia: 2 });
    expect(await minibarAmounts(b)).toEqual([70_000]);
    expect(await liveCountRows(b)).toBe(1);
    expect(await fillsOf(b)).toEqual(['backfill']);
    // a real new count of the same period → reversed and ONE line (R7)
    await count(b, { bia: 1 });
    expect(await minibarAmounts(b)).toEqual([35_000]);
    await at('2030-02-05T11:00:00+07:00');
    const co = await checkout(b, '11:00');
    expect(co.status, co.body).toBe(200);
    expect((await totals(b)).totalVnd).toBe(roomTotal + 35_000);
  });

  // ───────────── ARC 16.17 (BUG-R2-159/163): one live refill task per period – 16.4 cases 21–26 ─────────────

  /** The refill tasks of a fridge with their cancel note (16.17: transfer / cancel / duplicate). */
  const tasksOf = async (b: Booking, room: string) =>
    (
      await q<{
        status: string;
        refill_items: Array<{ itemId: string; quantity: number }> | null;
        cancel_note: string | null;
      }>(
        `SELECT status, refill_items, cancel_note FROM hk_task
          WHERE reservation_id = $1 AND room_id = $2 AND type = 'minibar_refill' ORDER BY created_at, id`,
        [b.id, ids.rooms[room]],
      )
    ).map((t) => ({
      status: t.status,
      items: Object.fromEntries((t.refill_items ?? []).map((i) => [codeOf[i.itemId], i.quantity])),
      ...(t.cancel_note ? { note: t.cancel_note } : {}),
    }));
  /** ARC 16.17 mục 3 – K1, K2, K3 (each must be empty), on the tenant's rows (RLS). */
  const invariants = async () => ({
    k1: (
      await q(
        `SELECT c.id FROM minibar_check c JOIN reservation r ON r.id = c.reservation_id
          WHERE r.status = 'in_house' AND c.mode = 'checkout'
            AND (c.replaced_by_check_id IS NULL OR c.replaced_by_check_id = c.id) AND c.fill_id IS NULL`,
      )
    ).length,
    k2: (
      await q(
        `SELECT c.reservation_id, c.room_id, c.fill_id, count(DISTINCT t.id) AS open_tasks
           FROM minibar_check c JOIN hk_task t ON t.id = c.refill_task_id
          WHERE t.type = 'minibar_refill' AND t.status IN ('open', 'in_progress')
          GROUP BY 1, 2, 3 HAVING count(DISTINCT t.id) > 1`,
      )
    ).length,
    k4: (
      await q(
        `SELECT c.id FROM minibar_check c JOIN reservation r ON r.id = c.reservation_id
          WHERE c.mode = 'checkout' AND (c.replaced_by_check_id IS NULL OR c.replaced_by_check_id = c.id)
            AND c.refill_task_id IS NULL
            AND EXISTS (SELECT 1 FROM minibar_check_line l WHERE l.check_id = c.id AND l.used_qty > 0)
            AND (r.status = 'checked_out'
                 OR (r.status = 'in_house' AND c.room_id IS DISTINCT FROM (
                       SELECT s.room_id FROM reservation_segment s
                        WHERE s.reservation_id = r.id AND s.active ORDER BY s.from_date DESC LIMIT 1)))`,
      )
    ).length,
    k3: (
      await q(
        `SELECT t.id FROM hk_task t
          WHERE t.type = 'minibar_refill' AND t.source = 'system' AND t.status IN ('open', 'in_progress')
            AND t.reservation_id IS NOT NULL
            AND NOT EXISTS (SELECT 1 FROM minibar_check c WHERE c.refill_task_id = t.id
                             AND (c.replaced_by_check_id IS NULL OR c.replaced_by_check_id = c.id))`,
      )
    ).length,
  });
  /** HK counts a fridge (the old room of the stay – its B14 clean is HK's "today" scope). */
  const hkCount = async (
    b: Booking,
    used: Record<string, number>,
    roomId: string,
    performedAt?: string,
  ) => {
    const std = await c.hk!.get(url(`/reservations/${b.id}/minibar-standard?roomId=${roomId}`));
    expect(std.statusCode, std.body).toBe(200);
    const r = await c.hk!.send('POST', url(`/reservations/${b.id}/minibar-checks`), {
      mode: 'checkout',
      roomId,
      lines: (std.json().items as Array<{ itemId: string; standardQty: number }>).map((i) => ({
        itemId: i.itemId,
        remainingQty: i.standardQty - (used[codeOf[i.itemId] ?? ''] ?? 0),
      })),
      ...(performedAt ? { performedAt: new Date(performedAt).toISOString() } : {}),
    });
    expect(r.statusCode, r.body).toBe(201);
  };
  /** 202 → 203 at `day` 10:00 (property fault); 10:30 the desk counts the 202 fridge: `used`. */
  const leftAndCounted = async (
    from: string,
    day: string,
    to: string,
    used: Record<string, number>,
  ) => {
    const { b } = await inHouse('202', from, to);
    await at(`${day}T10:00:00+07:00`);
    await b14(b, '203', day);
    await at(`${day}T10:30:00+07:00`);
    await count(b, used, ids.rooms['202']);
    return b;
  };

  it('case 21 / BUG-R2-159 D1: HK re-counts the old fridge with the same numbers → 201, 70.000 kept, T1 MOVED to the new count (1 open task {bia: 2}); back in 202, HK finishes T1 in the room → mark bia 0 + 2 = 2; 1 drunk → 105.000', async () => {
    const b = await leftAndCounted('2029-06-11', '2029-06-12', '2029-06-14', { bia: 2 });
    await at('2029-06-12T11:00:00+07:00');
    await hkCount(b, { bia: 2 }, ids.rooms['202']!);
    expect(await minibarAmounts(b)).toEqual([70_000]);
    expect(await tasksOf(b, '202')).toEqual([{ status: 'open', items: { bia: 2 } }]);
    await count(b, {}); // 203
    await b14(b, '202', '2029-06-12');
    expect((await lastFill(b, '202')).source).toBe('carry');
    await refillDone(b, '202', '2029-06-12T14:00:00+07:00');
    expect((await lastFill(b, '202')).marks).toMatchObject({ bia: 2 });
    await at('2029-06-13T09:00:00+07:00');
    await count(b, { bia: 1 });
    expect((await mb(b)).gross).toBe(105_000);
    expect(await invariants()).toEqual({ k1: 0, k2: 0, k3: 0, k4: 0 });
  });

  it('case 22 / BUG-R2-159 D2: the re-count corrects 2 → 1 → 70.000 reversed, 35.000 posted; T1 updated {bia: 1} – one task', async () => {
    const b = await leftAndCounted('2029-06-18', '2029-06-19', '2029-06-21', { bia: 2 });
    await at('2029-06-19T11:00:00+07:00');
    await count(b, { bia: 1 }, ids.rooms['202']);
    expect(await minibarAmounts(b)).toEqual([35_000]);
    expect(await tasksOf(b, '202')).toEqual([{ status: 'open', items: { bia: 1 } }]);
    expect(await invariants()).toEqual({ k1: 0, k2: 0, k3: 0, k4: 0 });
  });

  it('case 23 / BUG-R2-159 A4: HK 11:00 + desk 12:00 count the old fridge (2 beers); back in 302, HK finishes the task in the room; nothing more → one task {bia: 2}, mark bia 2, 70.000 (not 140.000)', async () => {
    const { b } = await inHouse('302', '2030-04-08', '2030-04-11');
    await at('2030-04-09T10:00:00+07:00');
    await b14(b, '401', '2030-04-09');
    await at('2030-04-09T11:00:00+07:00');
    await hkCount(b, { bia: 2 }, ids.rooms['302']!);
    await at('2030-04-09T12:00:00+07:00');
    await count(b, { bia: 2 }, ids.rooms['302']);
    expect(await tasksOf(b, '302')).toEqual([{ status: 'open', items: { bia: 2 } }]);
    await count(b, {}); // 401
    await b14(b, '302', '2030-04-09');
    await refillDone(b, '302', '2030-04-09T15:00:00+07:00');
    expect((await lastFill(b, '302')).marks).toMatchObject({ bia: 2 });
    await at('2030-04-11T09:00:00+07:00');
    await count(b, {});
    expect((await mb(b)).gross).toBe(70_000);
    expect(await tasksOf(b, '302')).toEqual([{ status: 'done', items: { bia: 2 } }]);
  });

  it('case 24 / BUG-R2-159: the re-count uses 0 → 70.000 reversed, T1 cancelled (reservation_changed, minibar_recount_zero), no open task', async () => {
    const b = await leftAndCounted('2029-06-25', '2029-06-26', '2029-06-28', { bia: 2 });
    await at('2029-06-26T11:00:00+07:00');
    await count(b, {}, ids.rooms['202']);
    expect(await minibarAmounts(b)).toEqual([]);
    expect(await tasksOf(b, '202')).toEqual([
      { status: 'cancelled', items: { bia: 2 }, note: 'minibar_recount_zero' },
    ]);
    const [t] = await q<{ cancel_reason_code: string }>(
      `SELECT cancel_reason_code FROM hk_task WHERE reservation_id = $1 AND type = 'minibar_refill'`,
      [b.id],
    );
    expect(t!.cancel_reason_code).toBe('reservation_changed');
    expect(await invariants()).toEqual({ k1: 0, k2: 0, k3: 0, k4: 0 });
  });

  it('case 25 / 16.17 1b: (a) HK finished T1 {bia: 1} (processed 10:05), the desk re-counts at 10:30 → 409 MINIBAR_PERIOD_CHANGED, 35.000 kept; (b) re-count 2 BEFORE the completion is processed → T1 {bia: 2}, 70.000, one task', async () => {
    const a = await leftAndCounted('2029-07-02', '2029-07-03', '2029-07-05', { bia: 1 });
    await refillDone(a, '202', '2029-07-03T10:35:00+07:00');
    await at('2029-07-03T10:40:00+07:00');
    const r = await countRaw(a, { bia: 2 }, ids.rooms['202']);
    expect(r.statusCode, r.body).toBe(409);
    expect(r.json().code).toBe('MINIBAR_PERIOD_CHANGED');
    expect(await minibarAmounts(a)).toEqual([35_000]);
    const b = await leftAndCounted('2029-07-09', '2029-07-10', '2029-07-12', { bia: 1 });
    await at('2029-07-10T10:40:00+07:00');
    await count(b, { bia: 2 }, ids.rooms['202']);
    expect(await tasksOf(b, '202')).toEqual([{ status: 'open', items: { bia: 2 } }]);
    await refillDone(b, '202', '2029-07-10T10:45:00+07:00');
    expect(await minibarAmounts(b)).toEqual([70_000]);
    expect(await tasksOf(b, '202')).toEqual([{ status: 'done', items: { bia: 2 } }]);
  });

  it('case 26 / BUG-R2-163 Z2 (HK offline): desk counts the old fridge 10:20 (T1); HK re-counts at 10:30 and finishes T1 at 10:45 offline, synced 12:00 / 12:05 → in processing time T1 was finished after the live count → back in 301: `refill` period, mark bia 2; 1 drunk → 105.000 (not 70.000)', async () => {
    const { b } = await inHouse('301', '2030-05-04', '2030-05-07');
    await at('2030-05-04T16:00:00+07:00');
    await b14(b, '302', '2030-05-04');
    await at('2030-05-04T16:20:00+07:00');
    await count(b, { bia: 2 }, ids.rooms['301']);
    const [t1] = await q<{ id: string }>(
      `SELECT id FROM hk_task WHERE reservation_id = $1 AND room_id = $2 AND type = 'minibar_refill'`,
      [b.id, ids.rooms['301']],
    );
    await at('2030-05-04T18:00:00+07:00'); // HK's queue synced: the count of 16:30, then T1 done at 16:45
    await hkCount(b, { bia: 2 }, ids.rooms['301']!, '2030-05-04T16:30:00+07:00');
    await at('2030-05-04T18:05:00+07:00');
    const done = await c.hk!.send('POST', url(`/hk-tasks/${t1!.id}/actions/complete`), {
      performedAt: new Date('2030-05-04T16:45:00+07:00').toISOString(),
    });
    expect(done.statusCode, done.body).toBe(200);
    await at('2030-05-06T10:00:00+07:00');
    await count(b, {}); // 302
    await b14(b, '301', '2030-05-06');
    const f = await lastFill(b, '301');
    expect(f.source).toBe('refill');
    expect(f.marks).toMatchObject({ bia: 2 });
    await at('2030-05-07T09:00:00+07:00');
    await count(b, { bia: 1 });
    expect((await mb(b)).gross).toBe(105_000);
  });

  // ───────────── recheck 5b (ARC 16.19): K11-02, K11-03/05, K11-04, K11-09 – money oracle + the order in sequence ─────────────

  /**
   * Like `interleaved`, the steps queue behind a lock held on a connection of its own – here row locks (`lockSql`,
   * in the tenant's context): each step starts once every earlier one waits on the holder (directly or behind a
   * transaction that does), then the holder rolls back and they go in that order.
   */
  const interleavedBehindRows = async (
    lockSql: string,
    params: unknown[],
    steps: Array<() => Promise<Sent>>,
  ): Promise<Sent[]> => {
    // The steps' own connections are opened before the hold (a cold pool would connect while the clock runs).
    await Promise.all(
      Array.from({ length: steps.length + 1 }, () =>
        db.withContext(t.ctx(), (tx) => tx.query('SELECT 1')),
      ),
    );
    const holder = await db.pool.connect();
    const pending: Array<Promise<Sent>> = [];
    try {
      await holder.query('BEGIN');
      await holder.query(
        `SELECT set_config('app.organization_id', $1, true), set_config('app.property_id', $2, true)`,
        [t.organizationId, t.propertyIds[0]],
      );
      await holder.query(lockSql, params);
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
            const act2 = await holder.query(
              `SELECT pid, state, wait_event_type, wait_event, pg_blocking_pids(pid) AS by, left(query, 90) AS q
               FROM pg_stat_activity WHERE datname = current_database()`,
            );
            throw new Error(
              `step ${pending.length} never waited (${done}) holder ${pid} pool ${db.pool.totalCount}/${db.pool.idleCount}/${db.pool.waitingCount} ${JSON.stringify(act2.rows)}`,
            );
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
  const createItem = (n: number) =>
    c.own!.send('POST', url('/items'), {
      code: `k11_${n}_${randomBytes(2).toString('hex')}`,
      name: { vi: `Món mới ${n}` },
      unit: 'gói',
      costPriceVnd: 5_000,
      salePriceVnd: 15_000,
      minibarStandardQty: 1,
    });
  const hkFirstCount =
    (b: Booking, room: string, lines: Array<{ itemId: string; remainingQty: number }>) => () =>
      c.hk!.send('POST', url(`/reservations/${b.id}/minibar-checks`), {
        mode: 'checkout',
        lines,
        periodId: null,
        roomId: ids.rooms[room],
      });

  it("K11-02 (ARC 16.19, 0069): HK's first count (2 beers, periodId null) ‖ OWN creates an item, both orders (forced on the beer row) → ONE check_in fill, the count in force, 70.000, one refill {bia: 2} – as in sequence", async () => {
    const cases = [
      { room: '201', from: '2030-03-04', to: '2030-03-05', first: 'count' },
      { room: '202', from: '2030-03-11', to: '2030-03-12', first: 'catalogue' },
    ] as const;
    let n = 0;
    for (const k of cases) {
      const { b } = await inHouse(k.room, k.from, k.to);
      await at(`${k.to}T09:00:00+07:00`);
      expect((await standard(b)).periodId).toBeNull();
      const lines = await linesNow(b, { bia: 2 });
      const count = hkFirstCount(b, k.room, lines);
      const cat = () => createItem((n += 1));
      const res = await interleavedBehindRows(
        'SELECT id FROM item WHERE id = $1 FOR UPDATE',
        [items.bia],
        k.first === 'count' ? [count, cat] : [cat, count],
      );
      expect(
        res.map((r) => r.statusCode),
        res.map((r) => r.body).join(' | '),
      ).toEqual([201, 201]);
      expect(await fillsOf(b), k.first).toEqual(['check_in']);
      expect(await liveCountRows(b), k.first).toBe(1);
      expect((await mb(b)).gross, k.first).toBe(70_000);
      expect((await blockers(b)).blockers ?? [], k.first).not.toContain('minibar_not_checked');
      await at(`${k.to}T11:00:00+07:00`);
      expect((await checkout(b, '11:00')).status).toBe(200);
      expect((await mb(b)).gross).toBe(70_000);
      expect((await refills(b, k.room)).map((x) => [x.status, x.items])).toEqual([
        ['open', { bia: 2 }],
      ]);
    }
  });

  it('K11-03 (ARC 16.19): the desk prepared the 202 fridge (roomId 202, periodId null), another desk moves the stay 202 → 203 → the count of 202 meets the fill B14 registered → 409, reload → 201 into the 202 fridge, 35.000 and its refill {bia: 1} at once; B18 asks for 203; 35.000 in all, K1–K4 = 0', async () => {
    const { b } = await inHouse('202', '2030-03-18', '2030-03-20');
    await at('2030-03-19T09:00:00+07:00');
    const room = ids.rooms['202']!;
    const std = await standard(b, room);
    expect(std.periodId).toBeNull();
    await at('2030-03-19T09:05:00+07:00');
    await b14(b, '203', '2030-03-19');
    await at('2030-03-19T09:06:00+07:00');
    const lines = std.items.map((i) => ({
      itemId: i.itemId,
      remainingQty: i.standardQty - (codeOf[i.itemId] === 'bia' ? 1 : 0),
    }));
    const stale = await sendCount(b, lines, { periodId: null, roomId: room })();
    expect(stale.statusCode, stale.body).toBe(409);
    expect(stale.json().code).toBe('MINIBAR_PERIOD_CHANGED');
    const again = await standard(b, room);
    const ok = await sendCount(b, lines, { periodId: again.periodId ?? null, roomId: room })();
    expect(ok.statusCode, ok.body).toBe(201);
    expect(await minibarAmounts(b)).toEqual([35_000]);
    expect(await refills(b, '202')).toEqual([
      { id: expect.any(String), status: 'open', items: { bia: 1 } },
    ]);
    await at('2030-03-20T09:00:00+07:00');
    expect((await blockers(b)).minibarUncheckedRooms).toEqual([
      expect.objectContaining({ roomId: ids.rooms['203'], reason: 'never_counted' }),
    ]);
    await count(b, {}); // 203
    await at('2030-03-20T11:00:00+07:00');
    expect((await checkout(b, '11:00')).status).toBe(200);
    expect((await mb(b)).gross).toBe(35_000);
    expect(await invariants()).toEqual({ k1: 0, k2: 0, k3: 0, k4: 0 });
  });

  it('K11-05 (ARC 16.19): a count without roomId/periodId (old client) waits while a B14 301 → 302 commits → the room is read again under the folio lock → 409 MINIBAR_PERIOD_CHANGED, nothing written (it was meant for 301); in sequence it would count 302 – never the wrong fridge silently', async () => {
    const { b } = await inHouse('301', '2030-03-25', '2030-03-27');
    await at('2030-03-26T10:00:00+07:00');
    const lines = await linesNow(b, { bia: 1 });
    await vacant('302');
    const body = {
      newRoomId: ids.rooms['302'],
      effectiveDate: '2030-03-26',
      cause: 'property_fault',
      reason: 'Hỏng điều hòa',
    };
    const dry = await act(b.id, 'change-room', { ...body, dryRun: true });
    expect(dry.statusCode, dry.body).toBe(200);
    const [moved, counted] = await interleaved(fridgeKey(b, '301'), [
      () => act(b.id, 'change-room', { ...body, expectedDeltaVnd: dry.json().folioDeltaVnd }),
      sendCount(b, lines),
    ]);
    expect(moved!.statusCode, moved!.body).toBe(200);
    expect(counted!.statusCode, counted!.body).toBe(409);
    expect(counted!.json().code).toBe('MINIBAR_PERIOD_CHANGED');
    expect(await checkRows(b)).toBe(0);
    expect((await mb(b)).gross).toBe(0);
  });

  it('K11-04 (ARC 16.19): B18 ‖ a re-count of the same fridge, B18 first (forced on the fridge lock) → the count waits on the room (KEY SHARE before the folio), no 40P01; B18 settles 35.000, the late count is refused with 409 and changes nothing – as in sequence', async () => {
    const { b, roomTotal } = await inHouse('401', '2030-04-15', '2030-04-16');
    await at('2030-04-16T09:00:00+07:00');
    await count(b, { bia: 1 });
    const lines = await linesNow(b, { bia: 2 });
    await at('2030-04-16T11:00:00+07:00');
    const s = await c.fd!.get(url(`/reservations/${b.id}/checkout-summary?checkoutTime=11:00`));
    const due = s.json().amountDueAtCheckoutVnd as number;
    const [out, late] = await interleaved(fridgeKey(b, '401'), [
      () =>
        act(b.id, 'check-out', {
          checkoutTime: '11:00',
          ...(due > 0 ? { finalPayment: { type: 'charge', method: 'cash', amountVnd: due } } : {}),
        }),
      sendCount(b, lines),
    ]);
    expect(out!.statusCode, out!.body).toBe(200);
    expect(late!.statusCode, late!.body).toBe(409);
    expect(['FOLIO_LOCKED', 'INVALID_TRANSITION']).toContain(late!.json().code);
    expect(await minibarAmounts(b)).toEqual([35_000]);
    expect((await totals(b)).totalVnd).toBe(roomTotal + 35_000);
  });

  it('case 29 / K11-09 (DOM BR-703 note 7): a count of nothing prepared before B13 and sent after it is live but of the old departure day → next day B18 asks again (reason not_today, latestCheck null); 1 beer → 35.000, not 0', async () => {
    const { b } = await inHouse('202', '2030-06-03', '2030-06-04');
    await at('2030-06-04T09:00:00+07:00');
    const lines = await linesNow(b, {});
    expect((await act(b.id, 'extend', { nights: 1 })).statusCode).toBe(200);
    const sent = await sendCount(b, lines)();
    expect(sent.statusCode, sent.body).toBe(201);
    expect((await blockers(b)).blockers ?? []).not.toContain('minibar_not_checked');
    await at('2030-06-05T09:00:00+07:00');
    const before = await blockers(b);
    expect(before.blockers ?? []).toContain('minibar_not_checked');
    expect(before.minibarUncheckedRooms).toEqual([
      expect.objectContaining({ roomId: ids.rooms['202'], reason: 'not_today' }),
    ]);
    expect((await standard(b)).latestCheck).toBeNull();
    await count(b, { bia: 1 });
    expect((await blockers(b)).blockers ?? []).not.toContain('minibar_not_checked');
    await at('2030-06-05T11:00:00+07:00');
    expect((await checkout(b, '11:00')).status).toBe(200);
    expect((await mb(b)).gross).toBe(35_000);
  });

  it('16.19 rule review (K11-01, damage line): MGR approves a damage line ‖ B18 without payment, the approval first (forced on the folio row) – the decision locks the folio before the request (pre-decision hook), B18 waits and sees the posted 400.000: 409 BALANCE_DUE, folio open, nothing settled – as in sequence', async () => {
    const { b } = await inHouse('302', '2030-05-20', '2030-05-21');
    await at('2030-05-21T09:00:00+07:00');
    await count(b, {});
    const f0 = await c.fd!.get(url(`/folios/${b.folioId}`));
    const dmg = await c.fd!.send(
      'POST',
      url(`/folios/${b.folioId}/lines`),
      {
        category: 'damage',
        description: 'Vỡ đèn ngủ',
        quantity: 1,
        proposedUnitPriceVnd: 400_000,
        note: 'Ảnh đính kèm',
      },
      { 'if-match': f0.headers.etag as string },
    );
    expect(dmg.statusCode, dmg.body).toBe(201);
    const line = (dmg.json().lines as Array<Line & { approvalRequestId?: string }>).find(
      (l) => l.category === 'damage',
    )!;
    const [ap] = await q<{ version: number }>(
      'SELECT version FROM approval_request WHERE id = $1',
      [line.approvalRequestId],
    );
    await at('2030-05-21T11:00:00+07:00');
    const [approved, out] = await interleavedBehindRows(
      'SELECT id FROM folio WHERE id = $1 FOR UPDATE',
      [b.folioId],
      [
        () =>
          c.mgr!.send('POST', url(`/approval-requests/${line.approvalRequestId}/actions/approve`), {
            expectedVersion: Number(ap!.version),
            authMethod: 'password',
            secret: TEST_PASSWORD,
          }),
        () => act(b.id, 'check-out', { checkoutTime: '11:00' }),
      ],
    );
    expect(approved!.statusCode, approved!.body).toBe(200);
    expect(out!.statusCode, out!.body).toBe(409);
    expect(out!.json().code).toBe('BALANCE_DUE');
    const f = await folio(b);
    expect(f.status).toBe('open');
    expect((f.lines as Line[]).find((l) => l.id === line.id)!.lineState).toBe('posted');
    expect((f.totals as Record<string, number>).balanceDueVnd).toBe(400_000);
    expect((await get(b.id)).status).toBe('in_house');
  });

  it('BUG-R2-178: Booking.com 203 + B13 child; S4-09 move to 302 until the OTA departure, then the room return – on the stay\'s departure day the 302 fridge (left) is not "the room the stay is in": B18 asks for 203 only; 203 counted today (1 beer) → B18 200, minibar 70.000 + 35.000', async () => {
    await at('2031-03-01T10:00:00+07:00');
    await vacant('203');
    const res = await c.fd!.send('POST', url('/reservations'), {
      roomId: ids.rooms['203'],
      channelId: ids.channels.booking,
      adults: 2,
      bookerGuestId: guest,
      paymentModel: 'ota_prepaid',
      otaRef: `BK${randomBytes(4).toString('hex')}`,
      otaRoomAmountVnd: 2_400_000,
      arrivalDate: '2031-03-10',
      departureDate: '2031-03-13',
    });
    expect(res.statusCode, res.body).toBe(201);
    const b = res.json() as Booking;
    await vacant('302');
    const blockBody = {
      roomId: ids.rooms['302'],
      channelId: ids.channels.direct,
      directSource: 'zalo_phone',
      adults: 2,
      bookerGuestId: guest,
      paymentModel: 'direct',
      arrivalDate: '2031-03-13',
      departureDate: '2031-03-15',
    };
    let next = await c.fd!.send('POST', url('/reservations'), {
      ...blockBody,
      initialPayment: { type: 'deposit', method: 'cash', amountVnd: 700_000 },
    });
    if (next.statusCode === 422 && next.json().code === 'DEPOSIT_INSUFFICIENT') {
      next = await c.fd!.send('POST', url('/reservations'), {
        ...blockBody,
        initialPayment: {
          type: 'deposit',
          method: 'cash',
          amountVnd: next.json().depositRequiredVnd,
        },
      });
    }
    expect(next.statusCode, next.body).toBe(201);
    await at('2031-03-10T15:00:00+07:00');
    const ci = await act(b.id, 'check-in', {
      cardsIssued: 1,
      houseRulesSent: true,
      checkinTime: '15:00',
    });
    expect(ci.statusCode, ci.body).toBe(200);
    await at('2031-03-11T09:00:00+07:00');
    const ext = await act(b.id, 'extend', { nights: 2 });
    expect(ext.statusCode, ext.body).toBe(200);
    const childId = ext.json().childReservation.id as string;
    const child = { ...b, id: childId } as Booking;
    const body = {
      newRoomId: ids.rooms['302'],
      effectiveDate: '2031-03-11',
      cause: 'property_fault',
      reason: 'Hỏng điều hòa',
      stayScope: 'until_parent_departure',
    };
    const dry = await act(b.id, 'change-room', { ...body, dryRun: true });
    expect(dry.statusCode, dry.body).toBe(200);
    const mv = await act(b.id, 'change-room', {
      ...body,
      expectedDeltaVnd: dry.json().folioDeltaVnd,
    });
    expect(mv.statusCode, mv.body).toBe(200);
    await at('2031-03-11T10:00:00+07:00');
    await count(b, { bia: 2 }, ids.rooms['203']); // the fridge left
    await refillDone(b, '203', '2031-03-11T14:00:00+07:00'); // refilled while the stay is in 302
    await at('2031-03-13T10:30:00+07:00');
    await count(b, {}, ids.rooms['302']); // the temporary room, before the return
    await vacant('203');
    const back = await c.fd!.send(
      'PATCH',
      url(`/reservations/${childId}`),
      { roomReturnRecorded: true },
      { 'if-match': `"${(await get(childId)).version}"` },
    );
    expect(back.statusCode, back.body).toBe(200);
    await at('2031-03-15T09:00:00+07:00');
    for (const who of [child, b]) {
      expect((await blockers(who)).minibarUncheckedRooms ?? [], who.id).toEqual([
        expect.objectContaining({ roomId: ids.rooms['203'] }),
      ]);
    }
    await count(child, { bia: 1 }, ids.rooms['203']);
    expect((await blockers(child)).blockers ?? []).not.toContain('minibar_not_checked');
    await at('2031-03-15T11:00:00+07:00');
    const co = await checkout(b, '11:00'); // B18 on the primary booking (children share its folio)
    expect(co.status, co.body).toBe(200);
    expect((await mb(b)).gross).toBe(105_000);
    expect(await invariants()).toEqual({ k1: 0, k2: 0, k3: 0, k4: 0 });
  });

  it('ARC 16.14: FolioLine.chargeCode – a minibar line carries the item code, the adjustFolioLine replacement keeps it; B13 after a count → minibarUncheckedRooms reason stay_continued', async () => {
    const { b } = await inHouse('401', '2029-06-04', '2029-06-05');
    await at('2029-06-05T09:00:00+07:00');
    await count(b, { bia: 2, coca: 1 });
    const codes = async () =>
      ((await folio(b)).lines as Array<Line & { chargeCode?: string; amountVnd: number }>)
        .filter((l) => l.category === 'minibar' && !l.reversalOfId)
        .map((l) => [l.amountVnd, l.chargeCode]);
    expect((await codes()).sort()).toEqual([
      [25_000, 'coca'],
      [70_000, 'bia'],
    ]);
    await adjust(b, (await liveLines(b)).find((l) => l.amountVnd === 70_000)!.id, {
      newUnitPriceVnd: 30_000,
    });
    const live = ((await folio(b)).lines as Array<Line & { chargeCode?: string }>).filter(
      (l) => l.category === 'minibar' && l.amountVnd === 60_000,
    );
    expect(live.map((l) => l.chargeCode)).toEqual(['bia']);
    // a room line has no code: the field is absent
    expect(
      ((await folio(b)).lines as Array<Line & { chargeCode?: string }>).find(
        (l) => l.category === 'room',
      ),
    ).not.toHaveProperty('chargeCode');
    const ext = await act(b.id, 'extend', { nights: 1 });
    expect(ext.statusCode, ext.body).toBe(200);
    const s = await c.fd!.get(url(`/reservations/${b.id}/checkout-summary?checkoutTime=11:00`));
    expect(s.json().minibarUncheckedRooms).toEqual([
      expect.objectContaining({ roomId: ids.rooms['401'], reason: 'stay_continued' }),
    ]);
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
