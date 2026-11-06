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
import { randomBytes } from 'node:crypto';
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

describe.skipIf(!HAS_DB)(
  'V5-15 overdue check-out (BE-A2, contract 0.3.13 1.4 / 1.16 / 1.18)',
  () => {
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
    const port = <R>(
      fn: (tx: Parameters<FrontdeskMinibarPort['checkoutStatus']>[0]) => Promise<R>,
    ) => db.withContext(t.ctx(), fn);

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
  },
);
