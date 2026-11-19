/**
 * FB-INV-012 contract §12.4 (H3, BR-LS-07 – INV 19/11: Studio 150.000, Premium / Signature 200.000 per room) on the
 * real PostgreSQL through the HTTP API – Q19–Q21 of contract §12.11:
 * - Q19: empty `long_stay_cleaning_fee_by_room` → a long stay's ad-hoc clean = `adhoc_cleaning_fee`;
 * - Q20: table set → long stay Studio 150.000 / Signature 200.000 (catalogue `?folioId` + `priceSource`,
 *   addFolioLine, guest app request options); short stay unchanged; a request sent before keeps its price;
 * - Q21 / ARC-BE-197-03: unknown room, price not whole thousands, ≤ 0, > 5.000.000, not an object → 422; FDL → 403.
 * Fake clock (T0 = Thu 15/10/2026 09:00 VN). FAKE data only.
 */
import { v7 as uuidv7 } from 'uuid';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database, Tx } from '../../src/db/database';
import { GuestRequestsService } from '../../src/modules/guest-portal/internal/guest-requests.service';
import { GuestRequestStatusPort } from '../../src/modules/guest-portal/public/guest-request-status.port';
import {
  GUEST_REQUEST_WORK_PORT,
  type GuestRequestTaskInput,
  type GuestRequestWork,
  type LastFullCleanInput,
} from '../../src/modules/guest-portal/public/guest-request-ports';
import { Client, type FeatureApp, P, cookieValue, startFeatureApp } from '../helpers/feature-app';
import {
  GUEST_TEST_ORIGIN,
  guest,
  seedStay,
  setStayStatus,
  staff,
} from '../helpers/registration-fixture';
import { type BookingIds, seedBooking, touchSessions } from '../helpers/reservations-fixture';
import {
  HAS_DB,
  T0,
  type TestTenant,
  appDatabase,
  createTenant,
  setParam,
} from '../helpers/tenant';

type Json = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

const KEY = 'long_stay_cleaning_fee_by_room';
const ADHOC = 100_000; // DS-E adhoc_cleaning_fee

/** BE-C's port, faked: a real hk_task row per task (guest_request.hk_task_id FK). */
class FakeWorkPort implements GuestRequestWork {
  real: GuestRequestWork | null = null;
  async createTask(tx: Tx, i: GuestRequestTaskInput): Promise<{ hkTaskId: string }> {
    const id = uuidv7();
    await tx.query(
      `INSERT INTO hk_task (id, organization_id, property_id, room_id, reservation_id, type, status, due_date,
         source, guest_request_id, note, priority_rank, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'guest_request', 'open', $6, 'guest_app', $7, $8, 3, $9, $9)`,
      [
        id,
        tx.ctx.organizationId,
        tx.ctx.propertyId,
        i.roomId,
        i.reservationId,
        i.dueDate,
        i.guestRequestId,
        i.note,
        i.now,
      ],
    );
    return { hkTaskId: id };
  }
  async createWorkOrder(): Promise<null> {
    return null;
  }
  lastFullCleanAt(tx: Tx, i: LastFullCleanInput): Promise<Date | null> {
    return (this.real as GuestRequestWork).lastFullCleanAt(tx, i);
  }
  async cancelTask(): Promise<void> {}
}

describe.skipIf(!HAS_DB)(
  'FB-INV-012 §12.4 – long-stay extra cleaning price by room (Q19–Q21)',
  () => {
    let db: Database;
    let fa: FeatureApp;
    let t: TestTenant;
    let ids: BookingIds;
    const c: Record<string, Client> = {};
    const work = new FakeWorkPort();
    const stays: Record<string, { reservationId: string; folioId: string; sid: string }> = {};

    const url = (p = '') => `${P(t)}${p}`;
    const q = async <R extends Record<string, unknown>>(sql: string, p: unknown[] = []) =>
      (await db.withContext(t.ctx(), (tx) => tx.query<R>(sql, p))).rows;
    const cleaningItem = async (folioId?: string) => {
      const r = await c.fd!.get(url(`/charge-catalog${folioId ? `?folioId=${folioId}` : ''}`));
      expect(r.statusCode, r.body).toBe(200);
      return (r.json().data as Json[]).find((x) => x.code === 'adhoc_cleaning_fee')!;
    };
    const addCleaning = (folioId: string) =>
      c.fd!.send('POST', url(`/folios/${folioId}/lines`), {
        chargeCode: 'adhoc_cleaning_fee',
        quantity: 1,
        serviceDate: '2026-10-15',
      });
    const lineAmount = async (folioId: string) =>
      Number(
        (
          await q<{ a: string }>(
            `SELECT amount_vnd::text AS a FROM folio_line WHERE folio_id = $1 AND category = 'cleaning'
            ORDER BY posted_at DESC, id DESC LIMIT 1`,
            [folioId],
          )
        )[0]!.a,
      );
    const options = async (sid: string) => {
      const r = await guest(fa, sid, 'GET', '/v1/guest/request-options');
      expect(r.statusCode, r.body).toBe(200);
      return (r.json().data as Json[]).find((o) => o.type === 'extra_cleaning')!;
    };
    const put = (who: string, value: unknown) =>
      c[who]!.send('PUT', url(`/parameters/${KEY}`), {
        value,
        effectiveFrom: '2026-10-15',
        reason: 'Long-stay cleaning price by room class',
      });

    async function sessionOf(reservationId: string): Promise<string> {
      const link = await staff(
        fa,
        t.users.fd!.sessionToken,
        null,
        'POST',
        `${P(t)}/reservations/${reservationId}/guest-link`,
      );
      expect(link.statusCode, link.body).toBe(201);
      const token = new URL(link.json().url).pathname.slice(3);
      const open = await guest(fa, null, 'POST', '/v1/guest/sessions', {
        json: { token },
        headers: { 'x-forwarded-for': '9.9.9.9' },
      });
      expect(open.statusCode, open.body).toBe(200);
      return cookieValue(open, 'ottimo_gsid') as string;
    }

    beforeAll(async () => {
      db = appDatabase(6);
      t = await createTenant(db, {
        properties: 2, // property B: SEC-BE-200-02
        users: { own: ['owner'], mgr: ['manager'], fdl: ['front_desk_lead'], fd: ['front_desk'] },
      });
      ids = await seedBooking(db, t);
      idsB = await seedBooking(db, t, 1);
      // Q19 starts from an empty table (the DS-E seed carries the INV mapping from 01/10).
      await setParam(db, t, KEY, {}, '2026-10-02');
      fa = await startFeatureApp(db, { guestOrigins: [GUEST_TEST_ORIGIN] });
      work.real = fa.app.get<GuestRequestWork>(GUEST_REQUEST_WORK_PORT);
      (fa.app.get(GuestRequestsService) as unknown as { work: GuestRequestWork }).work = work;
      for (const u of ['own', 'mgr', 'fdl', 'fd']) c[u] = Client.of(fa, t, u);
      fa.clock.set(T0);
      await touchSessions(db, t, T0);
      for (const [name, roomNo, stayType] of [
        ['studio', '202', 'long'],
        ['signature', '301', 'long'],
        ['short', '203', 'short'],
      ] as const) {
        const s = await seedStay(db, t, ids, {
          status: 'in_house',
          roomNo,
          stayType,
          departure: stayType === 'long' ? '2026-12-15' : '2026-10-17',
        });
        await setStayStatus(db, t, s.reservationId, 'in_house', {
          actualCheckinAt: new Date('2026-10-15T08:00:00+07:00'),
        });
        const [f] = await q<{ folio_id: string }>(
          `SELECT folio_id FROM reservation WHERE id = $1`,
          [s.reservationId],
        );
        stays[name] = {
          reservationId: s.reservationId,
          folioId: f!.folio_id,
          sid: await sessionOf(s.reservationId),
        };
      }
    });
    afterAll(async () => {
      await fa?.close();
      await db?.close();
    });

    let before: string; // a request sent at the old price
    let idsB: BookingIds;

    it('Q19: empty table → a long stay pays adhoc_cleaning_fee (catalogue default, folio line, guest app)', async () => {
      expect(await cleaningItem(stays.studio!.folioId)).toMatchObject({
        defaultUnitPriceVnd: ADHOC,
        priceSource: 'default',
      });
      expect(await options(stays.studio!.sid)).toMatchObject({
        feeVnd: ADHOC,
        feeReason: 'long_stay_adhoc',
      });
      const r = await guest(fa, stays.studio!.sid, 'POST', '/v1/guest/requests', {
        json: { type: 'extra_cleaning', feeAccepted: true },
      });
      expect(r.statusCode, r.body).toBe(201);
      expect(r.json().feeVnd).toBe(ADHOC);
      before = r.json().id as string;
    });

    it('Q21 / ARC-BE-197-03: the table is checked at save – rooms of the property, whole thousands 1.000–5.000.000; FDL 403', async () => {
      const unknown = await put('own', { '202': 150_000, '909': 150_000 });
      expect(unknown.statusCode).toBe(422);
      expect(unknown.json()).toMatchObject({
        code: 'PARAM_OUT_OF_RANGE',
        errors: [{ field: 'value.909', code: 'NOT_IN_LIST' }],
      });
      for (const bad of [150_500, 0, -1000, 5_001_000, '150000', 150_000.5]) {
        const r = await put('own', { '202': bad });
        expect(r.statusCode, JSON.stringify(bad)).toBe(422);
        expect(r.json()).toMatchObject({
          code: 'PARAM_OUT_OF_RANGE',
          errors: [{ field: 'value.202', code: 'PARAM_OUT_OF_RANGE' }],
          min: 1_000,
          max: 5_000_000,
        });
      }
      for (const notObject of [[150_000], 'x', null]) {
        expect((await put('own', notObject)).statusCode).toBe(422);
      }
      expect((await put('fdl', { '202': 150_000 })).statusCode).toBe(403);
      expect((await put('fd', { '202': 150_000 })).statusCode).toBe(403);
      const rows = await q(`SELECT 1 FROM config_parameter WHERE key = $1`, [KEY]);
      expect(rows).toHaveLength(2); // DS-E seed + the empty table of Q19 – nothing saved
    });

    it('Q20: table set by MGR (A101) → Studio 150.000, Signature 200.000; short stay unchanged; earlier request keeps its price', async () => {
      const saved = await put('mgr', {
        '101': 150_000,
        '202': 150_000,
        '203': 150_000,
        '301': 200_000,
        '402': 200_000,
      });
      expect(saved.statusCode, saved.body).toBe(200);
      // SEC-BE-200-03 (a): one config.changed by the manager, before = the empty table, after = the new one.
      const audits = await q<{ actor_user_id: string; before: Json; after: Json; reason: string }>(
        `SELECT actor_user_id, before, after, reason FROM audit_event
          WHERE action = 'config.changed' AND entity_id = $1`,
        [KEY],
      );
      expect(audits).toHaveLength(1);
      expect(audits[0]).toMatchObject({
        actor_user_id: t.users.mgr!.id,
        before: { value: {} },
        after: { value: expect.objectContaining({ '202': 150_000, '301': 200_000 }) },
        reason: 'Long-stay cleaning price by room class',
      });

      expect(await cleaningItem(stays.studio!.folioId)).toMatchObject({
        defaultUnitPriceVnd: 150_000,
        priceSource: 'long_stay_room',
      });
      expect(await cleaningItem(stays.signature!.folioId)).toMatchObject({
        defaultUnitPriceVnd: 200_000,
        priceSource: 'long_stay_room',
      });
      // Short stay (room 203 is in the table): unchanged.
      expect(await cleaningItem(stays.short!.folioId)).toMatchObject({
        defaultUnitPriceVnd: ADHOC,
        priceSource: 'default',
      });
      // No folioId → as before, no priceSource.
      const plain = await cleaningItem();
      expect(plain.defaultUnitPriceVnd).toBe(ADHOC);
      expect(plain).not.toHaveProperty('priceSource');
      expect((await c.fd!.get(url('/charge-catalog?folioId=nope'))).statusCode).toBe(422);
      expect((await c.fd!.get(url(`/charge-catalog?folioId=${uuidv7()}`))).statusCode).toBe(404);

      // addFolioLine: the price is the server's (not editable), by room for a long stay.
      for (const [name, price] of [
        ['studio', 150_000],
        ['signature', 200_000],
        ['short', ADHOC],
      ] as const) {
        const r = await addCleaning(stays[name]!.folioId);
        expect(r.statusCode, r.body).toBe(201);
        expect(await lineAmount(stays[name]!.folioId)).toBe(price);
      }
      const typed = await c.fd!.send('POST', url(`/folios/${stays.studio!.folioId}/lines`), {
        chargeCode: 'adhoc_cleaning_fee',
        quantity: 1,
        unitPriceVnd: 100_000,
      });
      expect(typed.statusCode).toBe(422);
      expect(typed.json().errors).toEqual([{ field: 'unitPriceVnd', code: 'PRICE_NOT_EDITABLE' }]);

      // Guest app: the price shown is the room's; the request sent before keeps 100.000.
      expect(await options(stays.studio!.sid)).toMatchObject({ feeVnd: 150_000 });
      expect(await options(stays.signature!.sid)).toMatchObject({ feeVnd: 200_000 });
      const [old] = await q<{ fee: string }>(
        `SELECT fee_vnd_snapshot::text AS fee FROM guest_request WHERE id = $1`,
        [before],
      );
      expect(Number(old!.fee)).toBe(ADHOC);
      const after = await guest(fa, stays.signature!.sid, 'POST', '/v1/guest/requests', {
        json: { type: 'extra_cleaning', feeAccepted: true },
      });
      expect(after.statusCode, after.body).toBe(201);
      expect(after.json().feeVnd).toBe(200_000);

      // SEC-BE-200-03 (b): the old request, completed now, is charged its snapshotted price, not the new one.
      await db.withContext(t.ctx(), (tx) =>
        fa.app
          .get(GuestRequestStatusPort)
          .onLinkedWorkDone(tx, before, new Date(T0.getTime() + 3_600_000)),
      );
      const charged = await q<{ a: string; folio_id: string }>(
        `SELECT l.amount_vnd::text AS a, l.folio_id FROM guest_request g JOIN folio_line l ON l.id = g.fee_folio_line_id
          WHERE g.id = $1`,
        [before],
      );
      expect(charged.map((x) => [Number(x.a), x.folio_id])).toEqual([
        [ADHOC, stays.studio!.folioId],
      ]);
    });

    it("SEC-BE-200-02: a folio of another property, from this property's session → 404, no price", async () => {
      const b = await seedStay(db, t, idsB, {
        status: 'in_house',
        roomNo: '202',
        stayType: 'long',
        departure: '2026-12-15',
        propertyIndex: 1,
      });
      const [fb] = (
        await db.withContext(t.ctx(1), (tx) =>
          tx.query<{ folio_id: string }>(`SELECT folio_id FROM reservation WHERE id = $1`, [
            b.reservationId,
          ]),
        )
      ).rows;
      const r = await c.fd!.get(url(`/charge-catalog?folioId=${fb!.folio_id}`));
      expect(r.statusCode).toBe(404);
      expect(r.body).not.toContain('priceSource');
      expect(r.body).not.toContain('defaultUnitPriceVnd');
    });

    it('ARC-BE-200-S1: mid-stay room change Studio 101 → Premium 402 – each clean priced by the room of its day', async () => {
      const s = await seedStay(db, t, ids, {
        status: 'in_house',
        roomNo: '101',
        stayType: 'long',
        departure: '2026-12-15',
      });
      await setStayStatus(db, t, s.reservationId, 'in_house', {
        actualCheckinAt: new Date('2026-10-15T08:00:00+07:00'),
      });
      // Room change on 20/10: [15/10, 20/10) in 101, [20/10, 15/12) in 402.
      await q(`UPDATE reservation_segment SET to_date = '2026-10-20' WHERE reservation_id = $1`, [
        s.reservationId,
      ]);
      await q(
        `INSERT INTO reservation_segment (id, organization_id, property_id, reservation_id, room_id, from_date,
           to_date, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, '2026-10-20', '2026-12-15', $6, $6)`,
        [uuidv7(), t.organizationId, t.propertyIds[0], s.reservationId, ids.rooms['402'], T0],
      );
      const [f] = await q<{ folio_id: string }>(`SELECT folio_id FROM reservation WHERE id = $1`, [
        s.reservationId,
      ]);
      const priced = async (serviceDate: string) => {
        const r = await c.fd!.send('POST', url(`/folios/${f!.folio_id}/lines`), {
          chargeCode: 'adhoc_cleaning_fee',
          quantity: 1,
          serviceDate,
        });
        expect(r.statusCode, r.body).toBe(201);
        return lineAmount(f!.folio_id);
      };
      expect(await priced('2026-10-16')).toBe(150_000); // Studio 101
      expect(await priced('2026-10-25')).toBe(200_000); // Premium 402
    });

    it('a room missing from the table → adhoc_cleaning_fee (default)', async () => {
      const s = await seedStay(db, t, ids, {
        status: 'in_house',
        roomNo: '302',
        stayType: 'long',
        departure: '2026-12-15',
      });
      const [f] = await q<{ folio_id: string }>(`SELECT folio_id FROM reservation WHERE id = $1`, [
        s.reservationId,
      ]);
      expect(await cleaningItem(f!.folio_id)).toMatchObject({
        defaultUnitPriceVnd: ADHOC,
        priceSource: 'default',
      });
    });
  },
);
