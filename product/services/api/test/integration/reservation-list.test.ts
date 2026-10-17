/**
 * BE-A Sprint 4 – `listReservations` (OpenAPI 0.3.7): S4-44 search by the booker's name (2+ characters, accents
 * and case ignored, partial) and by room number / room name (BR-012 (2)); BUG-R2-078 `balanceDueVnd` on each row
 * (same number as `getReservation`). Real PostgreSQL through HTTP, fake clock, FAKE data.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
import { nameSearchKey } from '../../src/modules/guests/public/normalize';
import { Client, type FeatureApp, P, startFeatureApp } from '../helpers/feature-app';
import {
  type BookingIds,
  seedBooking,
  seedGuestRow,
  touchSessions,
} from '../helpers/reservations-fixture';
import { HAS_DB, type TestTenant, appDatabase, createTenant } from '../helpers/tenant';

const ROLES = { fd: ['front_desk'], sal: ['sales_staff'] };

type Booking = { id: string; code: string; folioId: string };
type Row = { id: string; balanceDueVnd?: number };

describe.skipIf(!HAS_DB)(
  'reservation list – S4-44 search, BUG-R2-078 balance (BE-A Sprint 4)',
  () => {
    let db: Database;
    let fa: FeatureApp;
    let t: TestTenant;
    let ids: BookingIds;
    const c: Record<string, Client> = {};
    let ha: Booking;
    let binh: Booking;

    const url = (path = '') => `${P(t)}${path}`;
    const guest = async (name: string) => {
      const id = await seedGuestRow(db, t, { name });
      await db.withContext(t.ctx(), (tx) =>
        tx.query('UPDATE guest SET name_search = $2 WHERE id = $1', [id, nameSearchKey(name)]),
      );
      return id;
    };
    const create = async (roomNo: string, bookerGuestId: string, depositVnd: number) => {
      const res = await c.fd!.send('POST', url('/reservations'), {
        roomId: ids.rooms[roomNo],
        channelId: ids.channels.direct,
        directSource: 'zalo_phone',
        adults: 2,
        bookerGuestId,
        paymentModel: 'direct',
        arrivalDate: '2026-11-20',
        departureDate: '2026-11-22',
        initialPayment: { type: 'deposit', method: 'cash', amountVnd: depositVnd },
      });
      expect(res.statusCode, res.body).toBe(201);
      return res.json() as Booking;
    };
    const search = async (q: string, who = 'fd', extra = '') => {
      const r = await c[who]!.get(url(`/reservations?q=${encodeURIComponent(q)}${extra}`));
      expect(r.statusCode, r.body).toBe(200);
      return (r.json().data as Row[]).map((d) => d.id);
    };

    beforeAll(async () => {
      db = appDatabase(4);
      t = await createTenant(db, { users: ROLES });
      ids = await seedBooking(db, t);
      fa = await startFeatureApp(db);
      for (const u of Object.keys(ROLES)) c[u] = Client.of(fa, t, u);
      const d = new Date('2026-10-20T10:00:00+07:00');
      fa.clock.set(d);
      await touchSessions(db, t, d);
      await db.withContext(t.ctx(), async (tx) => {
        await tx.query(`UPDATE room SET name = 'The Pine' WHERE id = $1`, [ids.rooms['401']]);
        await tx.query(`UPDATE room SET name = 'The Amber' WHERE id = $1`, [ids.rooms['101']]);
      });
      ha = await create('401', await guest('Nguyễn Thu Hà'), 1_000_000);
      binh = await create('101', await guest('Trần Văn Bình'), 500_000);
    });
    afterAll(async () => {
      await fa?.close();
      await db?.close();
    });

    it('S4-44: booker name from 2 characters, accents/case ignored, partial; 1 character → no name match; SAL still own only', async () => {
      for (const q of ['ha', 'Hà', 'thu hà', 'NGUYEN']) {
        const found = await search(q);
        expect(found, q).toContain(ha.id);
        expect(found, q).not.toContain(binh.id);
      }
      expect(await search('bình')).toEqual(expect.arrayContaining([binh.id]));
      expect(await search('à')).not.toContain(ha.id); // one letter after normalising
      expect(await search('ha', 'sal')).toEqual([]); // x-scope own (US-087) – not their bookings
      // The existing matches still work (code).
      expect(await search(ha.code)).toEqual([ha.id]);
    });

    it('S4-44 + BR-012 (2): room number exact, room name partial from 3 characters without "The"; union with names', async () => {
      expect(await search('401')).toEqual([ha.id]);
      for (const q of ['pine', 'The Pine', 'PIN', 'amber']) {
        expect(await search(q), q).toEqual([q === 'amber' ? binh.id : ha.id]);
      }
      expect(await search('pi')).toEqual([]); // name part below 3 characters
      // The room's segment must meet the stay window when one is given.
      expect(await search('401', 'fd', '&stayFrom=2026-12-01')).toEqual([]);
      expect(await search('401', 'fd', '&stayFrom=2026-11-21&stayTo=2026-11-21')).toEqual([ha.id]);
    });

    it('BUG-R2-078: every row carries balanceDueVnd – the same number as getReservation (FD+)', async () => {
      const r = await c.fd!.get(url('/reservations?stayFrom=2026-11-20&stayTo=2026-11-21'));
      expect(r.statusCode, r.body).toBe(200);
      const rows = r.json().data as Row[];
      for (const b of [ha, binh]) {
        const row = rows.find((x) => x.id === b.id);
        const detail = (await c.fd!.get(url(`/reservations/${b.id}`))).json();
        expect(row?.balanceDueVnd).toBe(detail.balanceDueVnd);
        expect(row?.balanceDueVnd).toBeGreaterThan(0);
      }
      const ha2 = rows.find((x) => x.id === ha.id)!;
      const bi2 = rows.find((x) => x.id === binh.id)!;
      expect(ha2.balanceDueVnd).not.toBe(bi2.balanceDueVnd);
    });
  },
);
