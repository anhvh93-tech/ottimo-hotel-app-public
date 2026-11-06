/**
 * V5-15 – trả phòng đơn quá ngày đi (BE-A2, PR-A1b): OpenAPI 0.3.13 `checkOut` bổ sung 1 / 1d, contract 0.3.13 1.4,
 * 1.16 (H-01…H-04, H-09) and 1.18 (T15-9…T15-15), DOM rules-v1.0.5 7.1 (a), BE C0313-03 / 09 / 10. Real PostgreSQL
 * through HTTP, fake clock, FAKE data only (`@example.test`, no real guest):
 * - minibar gate (BE C0313-10, ARC review – inventory port): `countFrom` = the effective departure → a `checkout`
 *   count of a business day ≥ departure counts on an overdue stay; without the window K11-09 is unchanged;
 * - `listAuditEvents.overdueOnly` (SEC ARC-03): only `state` `reservation.checked_out` with `after.overdue`;
 * - B18 on an overdue stay: roles and the MGR cap before the body, one `access.denied` per refusal, nothing else
 *   written; `checkoutAt` + `overdueReason`; `nightsNotBilled` from the business day at the click; the times written
 *   (BE C0313-03); `allowedActions`, `getCheckoutSummary`, QR `check_out` (H-03).
 */
import { randomBytes, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { v7 as uuidv7 } from 'uuid';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
import { AuditService } from '../../src/modules/audit/public/audit.service';
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
import { HAS_DB, type TestTenant, appDatabase, createTenant } from '../helpers/tenant';

/** Documents OK; records the time B18 hands to the registration (BE C0313-03: `checkoutAt`, not the click). */
class DocsOk implements FrontdeskRegistrationPort {
  readonly checkedOut = new Map<string, Date>();
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
  async onCheckedOut(_tx: unknown, reservationId: string, at: Date) {
    this.checkedOut.set(reservationId, at);
  }
  async onReservationVoided() {}
  async earliestVisaValidUntil(): Promise<string | null> {
    return null;
  }
}

const ROLES = {
  own: ['owner'],
  mgr: ['manager'],
  mgr2: ['manager'],
  fdl: ['front_desk_lead'],
  fd: ['front_desk'],
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

describe.skipIf(!HAS_DB)('V5-15 overdue check-out (BE-A2)', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let ids: BookingIds;
  let guest: string;
  let minibar: FrontdeskMinibarPort;
  const docs = new DocsOk();
  const c: Record<string, Client> = {};
  const codeOf: Record<string, string> = {};

  beforeAll(async () => {
    db = appDatabase(6);
    t = await createTenant(db, { users: ROLES });
    ids = await seedBooking(db, t);
    guest = await seedGuestRow(db, t, { name: 'Khách Thử Quá Ngày' });
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
    fa = await startFeatureApp(db, {
      override: (b) =>
        b.overrideProvider(FrontdeskPorts).useFactory({
          factory: (port: FrontdeskMinibarPort) =>
            new FrontdeskPorts(docs, new NoGuestAccessPort(), new UnwiredChildDataPort(), port),
          inject: [FD_MINIBAR_PORT],
        }),
    });
    minibar = fa.app.get<FrontdeskMinibarPort>(FD_MINIBAR_PORT);
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
    for (const u of Object.keys(ROLES)) c[u]!.deviceToken = token;
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
  const get = async (id: string, who = 'fd') =>
    (await c[who]!.get(url(`/reservations/${id}`))).json();
  const folio = async (b: Booking) => (await c.fd!.get(url(`/folios/${b.folioId}`))).json();
  const totals = async (b: Booking) => (await folio(b)).totals as Record<string, number>;
  const vacant = (room: string) =>
    q(
      `INSERT INTO room_status (room_id, organization_id, property_id, status, since) VALUES ($1, $2, $3, 'VC', $4)
       ON CONFLICT (room_id) DO UPDATE SET status = 'VC'`,
      [ids.rooms[room], t.organizationId, t.propertyIds[0], new Date('2026-10-01T00:00:00Z')],
    );
  /** A direct stay `from` → `to` in `room`, paid in full and checked in at 15:00 on `from`. */
  const inHouse = async (room: string, from: string, to: string): Promise<Booking> => {
    await at(`${from}T15:00:00+07:00`);
    await vacant(room);
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
    });
    let res = await c.fd!.send('POST', url('/reservations'), body(100_000));
    if (res.statusCode === 422 && res.json().code === 'DEPOSIT_INSUFFICIENT') {
      res = await c.fd!.send('POST', url('/reservations'), body(res.json().depositRequiredVnd));
    }
    expect(res.statusCode, res.body).toBe(201);
    const b = res.json() as Booking;
    const due = (await totals(b)).balanceDueVnd as number;
    if (due > 0) {
      const p = await c.fd!.send('POST', url(`/folios/${b.folioId}/payments`), {
        type: 'charge',
        method: 'cash',
        amountVnd: due,
      });
      expect(p.statusCode, p.body).toBe(201);
    }
    const ci = await c.fd!.send(
      'POST',
      url(`/reservations/${b.id}/actions/check-in`),
      { cardsIssued: 1, houseRulesSent: true, checkinTime: '15:00' },
      { 'if-match': `"${(await get(b.id)).version}"` },
    );
    expect(ci.statusCode, ci.body).toBe(200);
    return b;
  };
  /** Checkout count of the fridge (nothing used unless `used`), by the desk. */
  const count = async (b: Booking, used: Record<string, number> = {}) => {
    const std = await c.fd!.get(url(`/reservations/${b.id}/minibar-standard`));
    expect(std.statusCode, std.body).toBe(200);
    const s = std.json() as {
      items: Array<{ itemId: string; standardQty: number }>;
      roomId: string;
      periodId: string | null;
    };
    const r = await c.fd!.send('POST', url(`/reservations/${b.id}/minibar-checks`), {
      mode: 'checkout',
      lines: s.items.map((i) => ({
        itemId: i.itemId,
        remainingQty: i.standardQty - (used[codeOf[i.itemId] ?? ''] ?? 0),
      })),
      roomId: s.roomId,
      periodId: s.periodId,
    });
    expect(r.statusCode, r.body).toBe(201);
  };
  const port = <R>(fn: (tx: Parameters<FrontdeskMinibarPort['checkoutStatus']>[0]) => Promise<R>) =>
    db.withContext(t.ctx(), fn);

  describe('minibar gate – MinibarCountWindow.countFrom (BE C0313-10, contract 1.4 – ARC review)', () => {
    it('a count of the departure business day counts on the overdue day only with countFrom; K11-09 unchanged without it', async () => {
      const b = await inHouse('101', '2028-12-01', '2028-12-03');
      await at('2028-12-03T10:00:00+07:00');
      await count(b, { bia: 1 });
      await at('2028-12-04T09:00:00+07:00'); // business day 04/12 – one night past the departure
      const room = ids.rooms['101']!;
      const plain = await port((tx) => minibar.checkoutStatus(tx, b.id, room));
      expect(plain).toEqual({ required: true, checked: false });
      const windowed = await port((tx) =>
        minibar.checkoutStatus(tx, b.id, room, { countFrom: '2028-12-03' }),
      );
      expect(windowed).toEqual({ required: true, checked: true });
      expect(await port((tx) => minibar.uncheckedRooms!(tx, b.id))).toEqual([
        { roomId: room, roomNo: '101', reason: 'not_today' },
      ]);
      expect(
        await port((tx) => minibar.uncheckedRooms!(tx, b.id, { countFrom: '2028-12-03' })),
      ).toEqual([]);
    });

    it('a count of a business day BEFORE the departure does not count, even with countFrom', async () => {
      const b = await inHouse('102', '2028-12-01', '2028-12-03');
      await at('2028-12-02T10:00:00+07:00');
      await count(b);
      await at('2028-12-04T09:00:00+07:00');
      const room = ids.rooms['102']!;
      expect(
        await port((tx) => minibar.checkoutStatus(tx, b.id, room, { countFrom: '2028-12-03' })),
      ).toEqual({ required: true, checked: false });
      expect(
        await port((tx) => minibar.uncheckedRooms!(tx, b.id, { countFrom: '2028-12-03' })),
      ).toEqual([{ roomId: room, roomNo: '102', reason: 'not_today' }]);
    });

    it('the desk counts the fridge after the guest has gone (overdue business day) – it counts in both modes', async () => {
      const b = await inHouse('103', '2028-12-01', '2028-12-03');
      await at('2028-12-05T09:00:00+07:00'); // two nights past
      const room = ids.rooms['103']!;
      expect(
        await port((tx) => minibar.uncheckedRooms!(tx, b.id, { countFrom: '2028-12-03' })),
      ).toEqual([{ roomId: room, roomNo: '103', reason: 'never_counted' }]);
      await count(b);
      expect(
        await port((tx) => minibar.checkoutStatus(tx, b.id, room, { countFrom: '2028-12-03' })),
      ).toEqual({ required: true, checked: true });
      expect(await port((tx) => minibar.checkoutStatus(tx, b.id, room))).toEqual({
        required: true,
        checked: true,
      });
    });
  });

  describe('listAuditEvents.overdueOnly (SEC ARC-03, contract 1.18)', () => {
    /** One audit row as `actor`, written the way the use cases write it (allowlist applied). */
    const record = (
      actor: string,
      entry: { category: 'state' | 'money'; action: string; after: Record<string, unknown> },
    ) =>
      db.withContext({ ...t.ctx(), userId: t.users[actor]!.id, actorType: 'user' }, (tx) =>
        fa.app.get(AuditService).record(tx, {
          ...entry,
          entityType: 'reservation',
          entityId: uuidv7(),
          entityCode: `OV-${actor}`,
          before: { status: 'in_house' },
        }),
      );
    const overdueAfter = (n: number) => ({
      status: 'checked_out',
      overdue: {
        departureDate: '2028-12-10',
        checkoutAt: '2028-12-10T11:00:00+07:00',
        recordedAt: '2028-12-11T09:00:00+07:00',
        reason: 'Khách đi đúng ngày, lễ tân quên bấm Trả phòng',
        nightsNotBilled: n,
      },
    });
    const list = async (who: string, qs: string) => {
      const r = await c[who]!.get(url(`/audit-events?from=2028-12-11&to=2028-12-11&${qs}`));
      expect(r.statusCode, r.body).toBe(200);
      return r.json().data as Array<{ action: string; entityCode?: string; after?: never }>;
    };

    beforeAll(async () => {
      await at('2028-12-11T09:00:00+07:00');
      await record('mgr', {
        category: 'state',
        action: 'reservation.checked_out',
        after: overdueAfter(1),
      });
      await record('own', {
        category: 'state',
        action: 'reservation.checked_out',
        after: overdueAfter(2),
      });
      // an ordinary B18, another state action carrying the key, and B18 of the desk: none is an overdue check-out
      await record('mgr2', {
        category: 'state',
        action: 'reservation.checked_out',
        after: { status: 'checked_out' },
      });
      await record('mgr2', {
        category: 'state',
        action: 'reservation.checked_in',
        after: overdueAfter(1),
      });
      await record('fd', {
        category: 'state',
        action: 'reservation.checked_out',
        after: { status: 'checked_out' },
      });
    });

    it('OWN: both overdue check-outs (MGR and OWN), nothing else – the overdue facts read back (nightsNotBilled kept by the allowlist)', async () => {
      const rows = await list('own', 'overdueOnly=true');
      expect(rows.map((r) => r.entityCode).sort()).toEqual(['OV-mgr', 'OV-own']);
      expect(rows.every((r) => r.action === 'reservation.checked_out')).toBe(true);
      const own = rows.find((r) => r.entityCode === 'OV-own') as unknown as {
        after: { overdue: { nightsNotBilled: number; departureDate: string } };
      };
      expect(own.after.overdue).toEqual(overdueAfter(2).overdue);
      // without the filter every row of the day is there
      expect((await list('own', 'overdueOnly=false')).length).toBeGreaterThanOrEqual(5);
    });

    it('MGR sees the overdue check-outs of every actor (OWN, MGR); a category sent with it still applies', async () => {
      expect((await list('mgr2', 'overdueOnly=true')).map((r) => r.entityCode).sort()).toEqual([
        'OV-mgr',
        'OV-own',
      ]);
      expect(await list('own', 'overdueOnly=true&category=money')).toEqual([]);
      expect((await list('own', 'overdueOnly=true&category=state')).length).toBe(2);
    });

    it('FD keeps its own scope (x-scope own): no overdue check-out of its own → empty', async () => {
      expect(await list('fd', 'overdueOnly=true')).toEqual([]);
      expect((await list('fd', '')).map((r) => r.entityCode)).toEqual(['OV-fd']);
    });

    it('overdueOnly other than true/false → 422 VALIDATION_FAILED on overdueOnly', async () => {
      const r = await c.own!.get(url('/audit-events?overdueOnly=yes'));
      expect(r.statusCode, r.body).toBe(422);
      expect(r.json().code).toBe('VALIDATION_FAILED');
      expect(r.json().errors).toEqual([{ field: 'overdueOnly', code: 'VALIDATION_FAILED' }]);
    });
  });

  describe('B18 on an overdue stay (contract 1.4, 1.16 H-01…H-04 / H-09, 1.18 T15-9…T15-15)', () => {
    const REASON = 'Khách đi đúng ngày, lễ tân quên bấm Trả phòng';
    const zoned = (iso: string) => new Date(iso).toISOString();
    const act = async (b: Booking, verb: string, body: unknown, who: string) =>
      c[who]!.send('POST', url(`/reservations/${b.id}/actions/${verb}`), body, {
        'if-match': `"${(await get(b.id)).version}"`,
      });
    const checkOut = (b: Booking, body: Record<string, unknown>, who: string) =>
      act(b, 'check-out', body, who);
    const summary = async (b: Booking, who = 'fd', qs = '') => {
      const r = await c[who]!.get(url(`/reservations/${b.id}/checkout-summary${qs}`));
      expect(r.statusCode, r.body).toBe(200);
      return r.json() as Record<string, unknown>;
    };
    const checkoutActions = async (b: Booking, who: string) =>
      ((await get(b.id, who)).allowedActions as Array<{ event: string; overdue?: boolean }>)
        .filter((a) => a.event === 'check_out')
        .map((a) => ({ event: a.event, overdue: a.overdue ?? false }));
    const denials = async (who: string) =>
      (
        await q<{ n: number }>(
          `SELECT count(*)::int AS n FROM audit_event
              WHERE action = 'access.denied' AND actor_user_id = $1 AND reason = 'OVERDUE_CHECKOUT'`,
          [t.users[who]!.id],
        )
      )[0]!.n;
    /** Booking + folio as they are – a refusal leaves both untouched. */
    const snapshot = async (b: Booking) => ({
      reservation: (
        await q('SELECT status, version, actual_checkout_at FROM reservation WHERE id = $1', [b.id])
      )[0],
      folio: (await q('SELECT status, version, bill_no FROM folio WHERE id = $1', [b.folioId]))[0],
      lines: (
        await q<{ n: number }>('SELECT count(*)::int AS n FROM folio_line WHERE folio_id = $1', [
          b.folioId,
        ])
      )[0]!.n,
      payments: (
        await q<{ n: number }>('SELECT count(*)::int AS n FROM payment WHERE folio_id = $1', [
          b.folioId,
        ])
      )[0]!.n,
    });
    /** 403 FORBIDDEN_ACTION with exactly `ext` beside the problem members (contract 1.16: no detail, no errors). */
    const forbidden = (
      r: { statusCode: number; body: string; json: () => Record<string, unknown> },
      ext: Record<string, unknown>,
    ) => {
      expect(r.statusCode, r.body).toBe(403);
      const body = r.json();
      expect(body.code).toBe('FORBIDDEN_ACTION');
      const PROBLEM = ['type', 'title', 'status', 'code', 'requestId'];
      expect(
        Object.fromEntries(Object.entries(body).filter(([k]) => !PROBLEM.includes(k))),
      ).toEqual(ext);
    };
    const fieldError = (
      r: { statusCode: number; body: string; json: () => Record<string, unknown> },
      field: string,
      code: string,
    ) => {
      expect(r.statusCode, r.body).toBe(422);
      expect(r.json().errors).toContainEqual({ field, code });
    };
    const overdueAudit = async (b: Booking) =>
      (
        await q<{ after: { overdue?: Record<string, unknown> } }>(
          `SELECT after FROM audit_event WHERE action = 'reservation.checked_out' AND entity_id = $1`,
          [b.id],
        )
      ).map((r) => r.after.overdue ?? null);

    // S1 – departure 10/01, one night past (business day 11/01): FD/FDL refused, MGR records it.
    let s1: Booking;
    const S1_LEFT = '2029-01-10T11:00:00+07:00';
    beforeAll(async () => {
      s1 = await inHouse('201', '2029-01-08', '2029-01-10');
      await at('2029-01-11T09:00:00+07:00');
    });

    it('T15-1 / H-01 / H-09: FD → 403 without any extension member, checked before the body; one access.denied; nothing written', async () => {
      const before = await snapshot(s1);
      const n0 = await denials('fd');
      forbidden(await checkOut(s1, { checkoutAt: S1_LEFT, overdueReason: REASON }, 'fd'), {});
      expect(await denials('fd')).toBe(n0 + 1);
      // an empty body: still the 403 (role before body), never a 422
      forbidden(await checkOut(s1, {}, 'fd'), {});
      expect(await denials('fd')).toBe(n0 + 2);
      expect(await snapshot(s1)).toEqual(before);
    });

    it('T15-13 / H-02: FDL → 403 without any extension member; one access.denied', async () => {
      const n0 = await denials('fdl');
      forbidden(await checkOut(s1, { checkoutAt: S1_LEFT, overdueReason: REASON }, 'fdl'), {});
      expect(await denials('fdl')).toBe(n0 + 1);
    });

    it('H-03: FD / FDL createVietQr purpose = check_out on the overdue stay → 403 before the state check; one access.denied', async () => {
      for (const who of ['fd', 'fdl']) {
        const n0 = await denials(who);
        const r = await c[who]!.send('POST', url(`/folios/${s1.folioId}/vietqr`), {
          amountVnd: 100_000,
          purpose: 'check_out',
          checkoutAt: S1_LEFT,
        });
        forbidden(r, {});
        expect(await denials(who)).toBe(n0 + 1);
      }
    });

    it('T15-7: allowedActions – check_out + overdue for MGR and OWN, none for FD/FDL; the summary (FD+) says overdue, nightsNotBilled = 1', async () => {
      expect(await checkoutActions(s1, 'mgr')).toEqual([{ event: 'check_out', overdue: true }]);
      expect(await checkoutActions(s1, 'own')).toEqual([{ event: 'check_out', overdue: true }]);
      expect(await checkoutActions(s1, 'fd')).toEqual([]);
      expect(await checkoutActions(s1, 'fdl')).toEqual([]);
      const s = await summary(s1, 'fd', `?checkoutAt=${encodeURIComponent(S1_LEFT)}`);
      expect(s).toMatchObject({
        overdue: true,
        nightsNotBilled: 1,
        checkoutTimeNoteRequired: false,
        checkoutTime: '11:00',
      });
    });

    it('T15-3: MGR – no checkoutAt → REQUIRED, checkoutAt of another business day → DATE_INVALID, no reason → REASON_REQUIRED', async () => {
      fieldError(
        await checkOut(s1, { checkoutTime: '11:00', overdueReason: REASON }, 'mgr'),
        'checkoutAt',
        'REQUIRED',
      );
      fieldError(
        await checkOut(
          s1,
          { checkoutAt: '2029-01-11T08:00:00+07:00', overdueReason: REASON },
          'mgr',
        ),
        'checkoutAt',
        'DATE_INVALID',
      );
      fieldError(
        await checkOut(s1, { checkoutAt: S1_LEFT }, 'mgr'),
        'overdueReason',
        'REASON_REQUIRED',
      );
      // checkoutTime sent with checkoutAt must match its local time
      fieldError(
        await checkOut(
          s1,
          { checkoutAt: S1_LEFT, checkoutTime: '10:00', overdueReason: REASON },
          'mgr',
        ),
        'checkoutTime',
        'VALIDATION_FAILED',
      );
    });

    it('T15-4: extraNight / lateFeeInsteadOfNight → 422 NOT_ALLOWED; leaving after the last tier → LATE_CHECKOUT_AFTER_LIMIT', async () => {
      fieldError(
        await checkOut(s1, { checkoutAt: S1_LEFT, overdueReason: REASON, extraNight: {} }, 'mgr'),
        'extraNight',
        'NOT_ALLOWED',
      );
      fieldError(
        await checkOut(
          s1,
          {
            checkoutAt: S1_LEFT,
            overdueReason: REASON,
            lateFeeInsteadOfNight: { amountVnd: 100_000, reason: 'Thử', postReview: true },
          },
          'mgr',
        ),
        'lateFeeInsteadOfNight',
        'NOT_ALLOWED',
      );
      fieldError(
        await checkOut(
          s1,
          { checkoutAt: '2029-01-10T19:00:00+07:00', overdueReason: REASON },
          'mgr',
        ),
        'checkoutAt',
        'LATE_CHECKOUT_AFTER_LIMIT',
      );
    });

    it('T15-14: overdueReason with a Luhn-valid test card number → 422 CARD_NUMBER_DETECTED on overdueReason', async () => {
      fieldError(
        await checkOut(
          s1,
          { checkoutAt: S1_LEFT, overdueReason: 'Khách để lại thẻ 4111 1111 1111 1111' },
          'mgr',
        ),
        'overdueReason',
        'CARD_NUMBER_DETECTED',
      );
    });

    it('SEC A1B-01: overdueReason is read without control / invisible characters – none left, or under 3 once removed → 422 REASON_REQUIRED', async () => {
      for (const overdueReason of ['\u0000\u200B\u202E\u202C\u0007', 'ab\u200B\u200B\u200B']) {
        fieldError(
          await checkOut(s1, { checkoutAt: S1_LEFT, overdueReason }, 'mgr'),
          'overdueReason',
          'REASON_REQUIRED',
        );
      }
    });

    it('minibar gate on the overdue path: no count → 409 MINIBAR_NOT_CHECKED; a count made after the guest left (overdue day) clears it', async () => {
      const r = await checkOut(s1, { checkoutAt: S1_LEFT, overdueReason: REASON }, 'mgr');
      expect(r.statusCode, r.body).toBe(409);
      expect(r.json().code).toBe('MINIBAR_NOT_CHECKED');
      await count(s1);
      expect(
        (await summary(s1, 'fd', `?checkoutAt=${encodeURIComponent(S1_LEFT)}`)).blockers,
      ).toEqual([]);
    });

    it('T15-2 / T15-9 / BE C0313-03: MGR, left 11:00 on the departure day, recorded 09:00 the day after → 200; no night sold after the departure; times written; audit after.overdue (read back)', async () => {
      const recordedAt = new Date('2029-01-11T09:00:00+07:00');
      const r = await checkOut(s1, { checkoutAt: S1_LEFT, overdueReason: REASON }, 'mgr');
      expect(r.statusCode, r.body).toBe(200);
      expect(r.json().reservation.status).toBe('checked_out');
      const [row] = await q<{ actual_checkout_at: Date }>(
        'SELECT actual_checkout_at FROM reservation WHERE id = $1',
        [s1.id],
      );
      expect(row!.actual_checkout_at.toISOString()).toBe(zoned(S1_LEFT));
      expect(docs.checkedOut.get(s1.id)?.toISOString()).toBe(zoned(S1_LEFT));
      const [f] = await q<{ post_checkout_window_until: Date }>(
        'SELECT post_checkout_window_until FROM folio WHERE id = $1',
        [s1.folioId],
      );
      // post_checkout_charge_hours = 24 from the time it was RECORDED, not from checkoutAt
      expect(f!.post_checkout_window_until.getTime()).toBe(recordedAt.getTime() + 24 * 3600_000);
      const nights = await q<{ service_date: string }>(
        `SELECT service_date::text AS service_date FROM folio_line
            WHERE folio_id = $1 AND category = 'room' ORDER BY service_date`,
        [s1.folioId],
      );
      expect(nights.map((n) => n.service_date)).toEqual(['2029-01-08', '2029-01-09']);
      const [overdue] = await overdueAudit(s1);
      expect(overdue).toMatchObject({
        departureDate: '2029-01-10',
        reason: REASON,
        nightsNotBilled: 1,
      });
      expect(new Date(overdue!.checkoutAt as string).toISOString()).toBe(zoned(S1_LEFT));
      expect(new Date(overdue!.recordedAt as string).getTime()).toBe(recordedAt.getTime());
    });

    // S2 – departure 10/01, counted on the departure day, recorded 06:30 on 12/01 (business day 12/01): 2 nights.
    let s2: Booking;
    it('T15-10 / H-04: MGR at 2 nights → 403 with ONLY requiredRole = owner and nightsNotBilled = 2; one access.denied; nothing written', async () => {
      s2 = await inHouse('202', '2029-01-08', '2029-01-10');
      await at('2029-01-10T10:00:00+07:00');
      await count(s2);
      await at('2029-01-12T06:30:00+07:00');
      expect((await summary(s2, 'mgr')).nightsNotBilled).toBe(2);
      expect(await checkoutActions(s2, 'mgr')).toEqual([]);
      expect(await checkoutActions(s2, 'own')).toEqual([{ event: 'check_out', overdue: true }]);
      const before = await snapshot(s2);
      const n0 = await denials('mgr');
      forbidden(
        await checkOut(
          s2,
          { checkoutAt: '2029-01-10T11:00:00+07:00', overdueReason: REASON },
          'mgr',
        ),
        { requiredRole: 'owner', nightsNotBilled: 2 },
      );
      expect(await denials('mgr')).toBe(n0 + 1);
      // the QR of the same stay: same role, same cap
      forbidden(
        await c.mgr!.send('POST', url(`/folios/${s2.folioId}/vietqr`), {
          amountVnd: 100_000,
          purpose: 'check_out',
          checkoutAt: '2029-01-10T11:00:00+07:00',
        }),
        { requiredRole: 'owner', nightsNotBilled: 2 },
      );
      expect(await denials('mgr')).toBe(n0 + 2);
      expect(await snapshot(s2)).toEqual(before);
    });

    it('FB-R5-ARC-BE-A2-01: S2 at 12/01 06:30 – minibar-standard latestCheck = the count of 10/01, the summary has no unchecked fridge (one rule, fridge.ts countInWindow)', async () => {
      const std = await c.mgr!.get(url(`/reservations/${s2.id}/minibar-standard`));
      expect(std.statusCode, std.body).toBe(200);
      expect(std.json().latestCheck).toMatchObject({ checkedAt: '2029-01-10T10:00:00.000+07:00' });
      const s = await summary(s2, 'mgr');
      expect(s.minibarUncheckedRooms).toBeUndefined();
      expect(s.blockers).not.toContain('minibar_not_checked');
    });

    it('T15-11: OWN, same stay → 200 with the late charge of checkoutAt (14:00 → tier 1) paid in the same B18; the count of the departure day counts', async () => {
      const left = '2029-01-10T14:00:00+07:00';
      const s = await summary(s2, 'own', `?checkoutAt=${encodeURIComponent(left)}`);
      expect(s).toMatchObject({ overdue: true, nightsNotBilled: 2, blockers: [] });
      const late = (s.lateCheckoutSurcharge as { amountVnd: number }).amountVnd;
      expect(late).toBeGreaterThan(0);
      const r = await checkOut(
        s2,
        {
          checkoutAt: left,
          overdueReason: REASON,
          applyLateSurcharge: true,
          expectedSurchargeVnd: late,
          finalPayment: {
            type: 'charge',
            method: 'cash',
            amountVnd: s.amountDueAtCheckoutVnd as number,
          },
        },
        'own',
      );
      expect(r.statusCode, r.body).toBe(200);
      const [overdue] = await overdueAudit(s2);
      expect(overdue).toMatchObject({ departureDate: '2029-01-10', nightsNotBilled: 2 });
    });

    // S3 – T15-5: the guest stayed one more night; B13 first, then B18 on this path at the new departure.
    it('T15-5: B13 to 11/01, then B18 overdue with checkoutAt on 11/01 → 200, the added night at the B13 price, nightsNotBilled from the new departure', async () => {
      const s3 = await inHouse('203', '2029-01-08', '2029-01-10');
      await at('2029-01-12T09:00:00+07:00');
      expect((await summary(s3, 'mgr')).nightsNotBilled).toBe(2);
      const ext = await act(s3, 'extend', { nights: 1 }, 'fd');
      expect(ext.statusCode, ext.body).toBe(200);
      expect((await summary(s3, 'mgr')).nightsNotBilled).toBe(1);
      await count(s3);
      const left = '2029-01-11T10:30:00+07:00';
      const due = (await summary(s3, 'mgr', `?checkoutAt=${encodeURIComponent(left)}`))
        .amountDueAtCheckoutVnd as number;
      const r = await checkOut(
        s3,
        {
          checkoutAt: left,
          overdueReason: 'Khách ở thêm một đêm, lễ tân quên gia hạn',
          ...(due > 0 ? { finalPayment: { type: 'charge', method: 'cash', amountVnd: due } } : {}),
        },
        'mgr',
      );
      expect(r.statusCode, r.body).toBe(200);
      const nights = await q<{ service_date: string }>(
        `SELECT service_date::text AS service_date FROM folio_line
            WHERE folio_id = $1 AND category = 'room' AND line_state = 'posted' ORDER BY service_date`,
        [s3.folioId],
      );
      expect(nights.map((n) => n.service_date)).toContain('2029-01-10');
      expect(nights.map((n) => n.service_date)).not.toContain('2029-01-11');
      const [overdue] = await overdueAudit(s3);
      expect(overdue).toMatchObject({ departureDate: '2029-01-11', nightsNotBilled: 1 });
    });

    // S4 – T15-6 + BE C0313-03 on the ordinary path (departure day).
    let s4: Booking;
    it('T15-6: not overdue + overdueReason → 422 NOT_ALLOWED; the ordinary B18 with checkoutAt writes actual_checkout_at = checkoutAt', async () => {
      s4 = await inHouse('301', '2029-01-13', '2029-01-15');
      // FB-R5-ARC-BE-A2-01: K11-09 unchanged on the ordinary path – a count of the day before is no count at 07:00
      // on the departure day, for the standard and for the summary alike.
      await at('2029-01-14T10:00:00+07:00');
      await count(s4);
      await at('2029-01-15T07:00:00+07:00');
      const std = await c.fd!.get(url(`/reservations/${s4.id}/minibar-standard`));
      expect(std.statusCode, std.body).toBe(200);
      expect(std.json().latestCheck).toBeNull();
      expect((await summary(s4)).blockers).toContain('minibar_not_checked');
      await at('2029-01-15T10:00:00+07:00');
      await count(s4);
      expect((await summary(s4)).overdue ?? false).toBe(false);
      expect((await summary(s4)).nightsNotBilled).toBeUndefined();
      fieldError(
        await checkOut(
          s4,
          { checkoutAt: '2029-01-15T09:50:00+07:00', overdueReason: REASON },
          'fd',
        ),
        'overdueReason',
        'NOT_ALLOWED',
      );
      const r = await checkOut(s4, { checkoutAt: '2029-01-15T09:50:00+07:00' }, 'fd');
      expect(r.statusCode, r.body).toBe(200);
      const [row] = await q<{ actual_checkout_at: Date }>(
        'SELECT actual_checkout_at FROM reservation WHERE id = $1',
        [s4.id],
      );
      expect(row!.actual_checkout_at.toISOString()).toBe(zoned('2029-01-15T09:50:00+07:00'));
      expect(docs.checkedOut.get(s4.id)?.toISOString()).toBe(zoned('2029-01-15T09:50:00+07:00'));
      expect(await overdueAudit(s4)).toEqual([null]);
    });

    it('FB-R5-DOM-BE-PR99-02 (ARC 3.2): B18 with checkoutTime only, 40 minutes before the press, with a note → actual_checkout_at and the registration = the typed time', async () => {
      const s5 = await inHouse('302', '2029-01-16', '2029-01-18');
      await at('2029-01-18T10:00:00+07:00');
      await count(s5);
      await at('2029-01-18T11:00:00+07:00');
      const r = await checkOut(
        s5,
        { checkoutTime: '10:20', checkoutTimeNote: 'Khách trả chìa 10:20, quầy ghi sau' },
        'fd',
      );
      expect(r.statusCode, r.body).toBe(200);
      const [row] = await q<{ actual_checkout_at: Date }>(
        'SELECT actual_checkout_at FROM reservation WHERE id = $1',
        [s5.id],
      );
      expect(row!.actual_checkout_at.toISOString()).toBe(zoned('2029-01-18T10:20:00+07:00'));
      expect(docs.checkedOut.get(s5.id)?.toISOString()).toBe(zoned('2029-01-18T10:20:00+07:00'));
      // the recording time stays for the folio (commission anchor, post-checkout window)
      const [f] = await q<{ settled_at: Date }>('SELECT settled_at FROM folio WHERE id = $1', [
        s5.folioId,
      ]);
      expect(f!.settled_at.toISOString()).toBe(zoned('2029-01-18T11:00:00+07:00'));
    });

    it('FB-R5-ARC-BE-A2-01: an OTA stay extended by a child – the overdue window starts at the CHILD departure (a count of the primary departure no longer counts)', async () => {
      await at('2029-01-20T15:00:00+07:00');
      await vacant('103');
      const res = await c.fd!.send('POST', url('/reservations'), {
        roomId: ids.rooms['103'],
        channelId: ids.channels.agoda,
        adults: 2,
        bookerGuestId: guest,
        paymentModel: 'ota_prepaid',
        otaRef: `AG${randomUUID().slice(0, 8)}`,
        otaRoomAmountVnd: 1_800_000,
        arrivalDate: '2029-01-20',
        departureDate: '2029-01-22',
      });
      expect(res.statusCode, res.body).toBe(201);
      const o = res.json() as Booking;
      const ci = await act(
        o,
        'check-in',
        { cardsIssued: 1, houseRulesSent: true, checkinTime: '15:00' },
        'fd',
      );
      expect(ci.statusCode, ci.body).toBe(200);
      await at('2029-01-21T10:00:00+07:00');
      const ext = await act(o, 'extend', { nights: 1 }, 'fd');
      expect(ext.statusCode, ext.body).toBe(200);
      expect(ext.json().childReservation).toMatchObject({ departureDate: '2029-01-23' });
      await at('2029-01-22T10:00:00+07:00');
      await count(o);
      // 24/01 07:00: one night past the EFFECTIVE departure 23/01 – the 22/01 count is before the window
      await at('2029-01-24T07:00:00+07:00');
      const before = await c.mgr!.get(url(`/reservations/${o.id}/minibar-standard`));
      expect(before.statusCode, before.body).toBe(200);
      expect(before.json().latestCheck).toBeNull();
      const s = await summary(o, 'mgr');
      expect(s).toMatchObject({ overdue: true, nightsNotBilled: 1 });
      expect(s.blockers).toContain('minibar_not_checked');
      // counted again after the guest left (overdue day) → both say counted
      await count(o);
      const after = await c.mgr!.get(url(`/reservations/${o.id}/minibar-standard`));
      expect(after.json().latestCheck).toMatchObject({
        checkedAt: '2029-01-24T07:00:00.000+07:00',
      });
      expect((await summary(o, 'mgr')).blockers).not.toContain('minibar_not_checked');
    });

    it('T15-12: listAuditEvents?overdueOnly=true has the B18 of T15-9 and T15-11 (and T15-5), not the ordinary B18', async () => {
      const r = await c.own!.get(
        url('/audit-events?from=2029-01-11&to=2029-01-15&overdueOnly=true'),
      );
      expect(r.statusCode, r.body).toBe(200);
      const ids2 = (r.json().data as Array<{ entityId: string }>).map((e) => e.entityId);
      expect(ids2).toContain(s1.id);
      expect(ids2).toContain(s2.id);
      expect(ids2).not.toContain(s4.id);
    });
  });
});
