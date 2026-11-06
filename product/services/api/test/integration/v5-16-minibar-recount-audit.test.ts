/**
 * V5-16 – FB-R5-SEC-BE-V516-01 ý 2 (Major, v1.0.5): an R7 minibar re-count that makes the live line of an item smaller
 * writes ONE `folio_line.adjusted` on that line, like adjustFolioLine (contract 0.3.13 1.5, 1.20; DOM rules-v1.0.5
 * 7.2; BR-438 (4)). Real inventory minibar port, Nest/Fastify + PostgreSQL, fake clock, FAKE data only.
 * - Room 201: HK counts, Lan (FD) counts lower → 201 + one audit (`postedByActor` false – the BR-438 403 on this
 *   path is ý 1, not in this PR); HK counts 0 → audit with `actorRole: housekeeping`, in `removalsOnly`; an increase
 *   and a confirmation (R6) write none.
 * - Room 202: Hạnh lowers her own count of two items → one audit per line; a count of the day before → `sameBusinessDay`
 *   false.
 * - Room 203: a line the manager raised through adjustFolioLine, counted lower → audit on the live replacement,
 *   measured on the root count line.
 * - "Cần chú ý" `line_reduction_count` counts the front-desk re-counts (test threshold 2), not HK's.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { Client, type FeatureApp, P, setPassword, startFeatureApp } from '../helpers/feature-app';
import {
  type BookingIds,
  seedBooking,
  seedGuestRow,
  touchSessions,
} from '../helpers/reservations-fixture';
import { HAS_DB, type TestTenant, appDatabase, createTenant, setParam } from '../helpers/tenant';

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
  hanh: ['front_desk'],
  lan: ['front_desk'],
  hk: ['housekeeping'],
};
const DESK_USERS = ['own', 'mgr', 'hanh', 'lan'];
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
const price = (code: string) => DS_E.minibarItems.find((m) => m.code === code)!.salePriceVnd;
const BIA = price('bia');
const COCA = price('coca');
const ARRIVAL = '2026-11-20';
const DEPARTURE = '2026-11-22';

type Booking = { id: string; code: string; folioId: string };

describe.skipIf(!HAS_DB)('V5-16 – minibar re-count audit (FB-R5-SEC-BE-V516-01 ý 2)', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let ids: BookingIds;
  let guest: string;
  const c: Record<string, Client> = {};
  const codeOf: Record<string, string> = {};
  const nameOf: Record<string, string> = {};
  const stays: Record<string, Booking> = {};

  beforeAll(async () => {
    db = appDatabase(6);
    t = await createTenant(db, { users: ROLES });
    ids = await seedBooking(db, t);
    // "Cần chú ý" test threshold (shared BR-435 count key): more than 2 front-desk reductions in the month alert.
    await setParam(db, t, 'foc_alert_count_per_approver', 2, '2026-10-02');
    guest = await seedGuestRow(db, t, { name: 'Khách Thử Đếm Lại' });
    await db.withContext(t.ctx(), async (tx) => {
      for (const m of DS_E.minibarItems) {
        const id = uuidv7();
        codeOf[id] = m.code;
        nameOf[m.code] = m.name;
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
          new Date('2036-12-31T00:00:00Z'),
        ],
      ),
    );
    for (const u of DESK_USERS) c[u]!.deviceToken = token;
    for (const u of Object.keys(ROLES)) await setPassword(db, t, u);
    for (const room of ['201', '202', '203']) stays[room] = await inHouse(room);
  }, 180_000);
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
  const q = (sql: string, a: unknown[] = []) =>
    db.withContext(t.ctx(), async (tx) => (await tx.query(sql, a)).rows as any[]);
  const folio = async (b: Booking) => (await c.mgr!.get(url(`/folios/${b.folioId}`))).json();

  async function inHouse(room: string): Promise<Booking> {
    await at(`${ARRIVAL}T15:00:00+07:00`);
    await q(
      `INSERT INTO room_status (room_id, organization_id, property_id, status, since) VALUES ($1, $2, $3, 'VC', $4)
       ON CONFLICT (room_id) DO UPDATE SET status = 'VC'`,
      [ids.rooms[room], t.organizationId, t.propertyIds[0], new Date('2026-10-01T00:00:00Z')],
    );
    const body = {
      roomId: ids.rooms[room],
      channelId: ids.channels.direct,
      directSource: 'zalo_phone',
      adults: 2,
      bookerGuestId: guest,
      paymentModel: 'direct',
      arrivalDate: ARRIVAL,
      departureDate: DEPARTURE,
    };
    let res = await c.hanh!.send('POST', url('/reservations'), body);
    if (res.statusCode === 422 && res.json().code === 'DEPOSIT_INSUFFICIENT') {
      res = await c.hanh!.send('POST', url('/reservations'), {
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
    const due = (await folio(b)).totals.balanceDueVnd as number;
    if (due > 0) {
      const p = await c.hanh!.send('POST', url(`/folios/${b.folioId}/payments`), {
        type: 'charge',
        method: 'cash',
        amountVnd: due,
      });
      expect(p.statusCode, p.body).toBe(201);
    }
    const v = (await c.hanh!.get(url(`/reservations/${b.id}`))).json().version;
    const ci = await c.hanh!.send(
      'POST',
      url(`/reservations/${b.id}/actions/check-in`),
      { cardsIssued: 1, houseRulesSent: true, checkinTime: '15:00' },
      { 'if-match': `"${v}"` },
    );
    expect(ci.statusCode, ci.body).toBe(200);
    return b;
  }

  /** Checkout count by `who`: `used` per item code over the items of the fridge (GET minibar-standard). */
  async function count(who: string, b: Booking, used: Record<string, number>) {
    const std = await c[who]!.get(url(`/reservations/${b.id}/minibar-standard`));
    expect(std.statusCode, std.body).toBe(200);
    const s = std.json();
    const r = await c[who]!.send('POST', url(`/reservations/${b.id}/minibar-checks`), {
      mode: 'checkout',
      lines: (s.items as any[]).map((i) => ({
        itemId: i.itemId,
        remainingQty: i.standardQty - (used[codeOf[i.itemId] ?? ''] ?? 0),
      })),
      roomId: s.roomId,
      periodId: s.periodId ?? null,
    });
    expect(r.statusCode, r.body).toBe(201);
    return r;
  }
  /** The live minibar line of an item (by its name on the folio). */
  async function live(b: Booking, code: string) {
    const all = (await folio(b)).lines as any[];
    const reversed = new Set(all.map((l) => l.reversalOfId).filter(Boolean));
    return all.find(
      (l) =>
        l.category === 'minibar' &&
        l.description === nameOf[code] &&
        l.lineState === 'posted' &&
        !l.reversalOfId &&
        !reversed.has(l.id),
    ) as any;
  }
  const adjusted = (lineId: string) =>
    q(
      `SELECT actor_user_id, before, after, reason, entity_code FROM audit_event
        WHERE category = 'money' AND action = 'folio_line.adjusted' AND entity_id = $1 ORDER BY id`,
      [lineId],
    );
  const adjustedOnFolio = async (b: Booking) =>
    (
      await q(
        `SELECT count(*)::int AS n FROM audit_event e
          WHERE e.action = 'folio_line.adjusted'
            AND e.entity_id IN (SELECT id::text FROM folio_line WHERE folio_id = $1)`,
        [b.folioId],
      )
    )[0].n as number;
  const listed = async (query: string) => {
    const r = await c.mgr!.get(
      url(`/audit-events?from=${ARRIVAL}&to=${DEPARTURE}&limit=100&${query}`),
    );
    expect(r.statusCode, r.body).toBe(200);
    return (r.json().data as any[]).map((e) => e.entityId as string);
  };

  it('201: HK count lowered by Lan (FD) → one folio_line.adjusted on the HK line, root facts, in reductionsOnly only', async () => {
    const b = stays['201']!;
    await at(`${DEPARTURE}T10:00:00+07:00`);
    await count('hk', b, { bia: 2 });
    const hkLine = await live(b, 'bia');
    expect(hkLine.amountVnd).toBe(2 * BIA);

    await at(`${DEPARTURE}T10:30:00+07:00`);
    await count('lan', b, { bia: 1 });
    expect((await live(b, 'bia')).amountVnd).toBe(BIA);
    const rows = await adjusted(hkLine.id);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      actor_user_id: t.users.lan!.id,
      reason: 'minibar_recount',
      entity_code: b.code,
      before: {
        category: 'minibar',
        amountVnd: 2 * BIA,
        actorRole: 'front_desk',
        rootLineId: hkLine.id,
        rootLineManual: true,
        postedByActor: false,
        sameBusinessDay: true,
      },
      after: { category: 'minibar', amountVnd: BIA },
    });
    // ids and booleans only – the allowlist keeps nothing else
    expect(Object.keys(rows[0].before).sort()).toEqual(
      [
        'actorRole',
        'amountVnd',
        'category',
        'postedByActor',
        'rootLineId',
        'rootLineManual',
        'sameBusinessDay',
      ].sort(),
    );
    expect(await listed('reductionsOnly=true')).toContain(hkLine.id);
    expect(await listed('removalsOnly=true')).not.toContain(hkLine.id);
  });

  it('201: HK counts 0 → audit with actorRole housekeeping, after 0, in removalsOnly; an increase and an R6 confirmation write none', async () => {
    const b = stays['201']!;
    const lanLine = await live(b, 'bia');
    await at(`${DEPARTURE}T11:00:00+07:00`);
    await count('hk', b, {});
    expect(await live(b, 'bia')).toBeUndefined();
    const rows = await adjusted(lanLine.id);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      actor_user_id: t.users.hk!.id,
      before: {
        category: 'minibar',
        amountVnd: BIA,
        actorRole: 'housekeeping',
        rootLineId: lanLine.id,
        rootLineManual: true,
        postedByActor: false,
        sameBusinessDay: true,
      },
      after: { category: 'minibar', amountVnd: 0 },
    });
    expect(await listed('removalsOnly=true')).toContain(lanLine.id);
    expect(await listed('reductionsOnly=true')).toContain(lanLine.id);
    expect(await adjustedOnFolio(b)).toBe(2);

    // increase from no line, then the same count again (R6 keeps the line) → no folio_line.adjusted
    await at(`${DEPARTURE}T11:10:00+07:00`);
    await count('lan', b, { bia: 2 });
    await at(`${DEPARTURE}T11:20:00+07:00`);
    await count('lan', b, { bia: 2 });
    expect((await live(b, 'bia')).amountVnd).toBe(2 * BIA);
    expect(await adjustedOnFolio(b)).toBe(2);
  });

  it('202: Hạnh lowers her own count of two items → one audit per line; a count of the day before → sameBusinessDay false', async () => {
    const b = stays['202']!;
    await at(`${ARRIVAL}T16:00:00+07:00`);
    await count('hanh', b, { bia: 2, coca: 1 });
    const bia = await live(b, 'bia');
    const coca = await live(b, 'coca');
    await at(`${ARRIVAL}T16:30:00+07:00`);
    await count('hanh', b, {});
    for (const [line, before] of [
      [bia, 2 * BIA],
      [coca, COCA],
    ] as const) {
      const rows = await adjusted(line.id);
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        actor_user_id: t.users.hanh!.id,
        before: {
          amountVnd: before,
          actorRole: 'front_desk',
          rootLineId: line.id,
          rootLineManual: true,
          postedByActor: true,
          sameBusinessDay: true,
        },
        after: { amountVnd: 0 },
      });
    }

    await at('2026-11-21T09:00:00+07:00');
    await count('hanh', b, { bia: 2 });
    const yesterday = await live(b, 'bia');
    await at(`${DEPARTURE}T09:00:00+07:00`);
    await count('hanh', b, { bia: 1 });
    const rows = await adjusted(yesterday.id);
    expect(rows).toHaveLength(1);
    expect(rows[0].before).toMatchObject({
      amountVnd: 2 * BIA,
      rootLineId: yesterday.id,
      postedByActor: true,
      sameBusinessDay: false,
    });
    expect(rows[0].after).toMatchObject({ amountVnd: BIA });
  });

  it('203: a line the manager raised through adjustFolioLine, counted lower → audit on the replacement, measured on the root count line', async () => {
    const b = stays['203']!;
    await at('2026-11-21T10:00:00+07:00');
    await count('hanh', b, { bia: 2 });
    const root = await live(b, 'bia');
    await at('2026-11-21T10:10:00+07:00');
    const etag = (await c.mgr!.get(url(`/folios/${b.folioId}`))).headers.etag as string;
    const up = await c.mgr!.send(
      'POST',
      url(`/folios/${b.folioId}/lines/${root.id}/adjustments`),
      { reason: 'Khách báo dùng thêm 1 lon', newQuantity: 3 },
      { 'if-match': etag },
    );
    expect(up.statusCode, up.body).toBe(201);
    const raised = await live(b, 'bia');
    expect(raised.amountVnd).toBe(3 * BIA);
    await at('2026-11-21T10:20:00+07:00');
    await count('hanh', b, { bia: 1 });
    const rows = await adjusted(raised.id);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      reason: 'minibar_recount',
      before: {
        amountVnd: 3 * BIA,
        actorRole: 'front_desk',
        rootLineId: root.id,
        rootLineManual: true,
        postedByActor: true,
        sameBusinessDay: true,
      },
      after: { amountVnd: BIA },
    });
  });

  it('"Cần chú ý" line_reduction_count: the front-desk re-counts are counted (Hạnh 4 > 2), HK and Lan (1) are not', async () => {
    await at(`${DEPARTURE}T12:00:00+07:00`);
    const own = await c.own!.get(url('/attention'));
    expect(own.statusCode, own.body).toBe(200);
    const cut = (own.json().data as any[]).filter(
      (i) => i.kind === 'foc_threshold' && i.params?.check === 'line_reduction_count',
    );
    expect(cut).toEqual([
      expect.objectContaining({
        count: 4,
        params: { check: 'line_reduction_count', count: 4, max: 2 },
        link: `/audit?reductionsOnly=true&month=2026-11&actorUserId=${t.users.hanh!.id}`,
      }),
    ]);
  });
});
