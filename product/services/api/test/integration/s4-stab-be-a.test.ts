/**
 * BE-A – R2 tuần Ổn định (`qc/s4-gate-readiness.md` b6, b7; ARC `s4-ARC.md` S4-13; ARC 16.20):
 * - BUG-R2-123: `move-preview` of an OTA conflict booking (B7a through `move`) without `overbookingResolution`.
 * - BUG-R2-133: a B7a `upgraded` booking without a stored origin (rows before 0059) – the OTA difference is
 *   measured from the room booked; the count query for OPS/QA.
 * - FB-R2-ARC-BE-S4-13: the receipt image of a B2 initial payment is checked, bound and kept.
 * - BUG-R2-101: `Reservation.balanceDueVnd` absent while the folio has no posted line.
 * Fake clock and FAKE data only.
 */
import { randomBytes, randomUUID } from 'node:crypto';
import { v7 as uuidv7 } from 'uuid';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
import { AttachmentService } from '../../src/modules/files/public/attachment.service';
import { ReservationsService } from '../../src/modules/reservations/internal/reservations.service';
import { sha256Hex } from '../../src/shared/http/auth.guard';
import { Client, type FeatureApp, P, setPassword, startFeatureApp } from '../helpers/feature-app';
import {
  type BookingIds,
  seedBooking,
  seedGuestRow,
  touchSessions,
} from '../helpers/reservations-fixture';
import { HAS_DB, type TestTenant, appDatabase, createTenant } from '../helpers/tenant';

const ROLES = {
  mgr: ['manager'],
  fdl: ['front_desk_lead'],
  fd: ['front_desk'],
  sal: ['sales_staff'],
};
type Booking = { id: string; code: string; version: number; folioId: string };

/**
 * BUG-R2-133 – the count for OPS/QA (DB dùng thử): open bookings without a stored origin that an OTA conflict was
 * settled for by an upgrade (the only rows the fallback mis-read before this fix), and – wider – every open
 * booking without a stored origin that has a room change (rows that rely on the history fallback at all).
 */
const COUNT_133 = `
SELECT
  count(*) FILTER (WHERE EXISTS (SELECT 1 FROM overbooking_incident i
                                  WHERE i.reservation_id = r.id AND i.resolution = 'upgraded')) AS upgraded_without_origin,
  count(*) FILTER (WHERE EXISTS (SELECT 1 FROM reservation_change c
                                  WHERE c.reservation_id = r.id AND c.field = 'room')) AS moved_without_origin
  FROM reservation r
 WHERE r.origin_room_id IS NULL AND r.status IN ('hold', 'confirmed', 'in_house')`;

describe.skipIf(!HAS_DB)('BE-A – tuần Ổn định (123, 133, S4-13, 101)', () => {
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
    guest = await seedGuestRow(db, t, { name: 'Khách Tuần Ổn Định' });
    fa = await startFeatureApp(db);
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
    for (const u of Object.keys(ROLES)) {
      c[u] = Client.of(fa, t, u);
      c[u]!.deviceToken = token;
      await setPassword(db, t, u);
    }
    await at('2028-01-05T10:00:00+07:00');
  });
  afterAll(async () => {
    await fa?.close();
    await db?.close();
  });

  const url = (p = '') => `${P(t)}${p}`;
  const at = async (iso: string) => {
    const d = new Date(iso);
    fa.clock.set(d);
    await touchSessions(db, t, d);
  };
  const q = async <R extends Record<string, unknown>>(sql: string, p: unknown[] = []) =>
    (await db.withContext(t.ctx(), (tx) => tx.query<R>(sql, p))).rows;
  const get = async (id: string, who = 'fd') =>
    (await c[who]!.get(url(`/reservations/${id}`))).json();
  const act = async (id: string, verb: string, body: unknown, who = 'fd') =>
    c[who]!.send('POST', url(`/reservations/${id}/actions/${verb}`), body, {
      'if-match': `"${(await get(id)).version}"`,
    });
  const create = async (body: Record<string, unknown>, who = 'fd'): Promise<Booking> => {
    const res = await c[who]!.send('POST', url('/reservations'), body);
    expect(res.statusCode, res.body).toBe(201);
    return res.json() as Booking;
  };
  const agoda = (room: string, from: string, to: string, more: Record<string, unknown> = {}) =>
    create({
      roomId: ids.rooms[room],
      channelId: ids.channels.agoda,
      adults: 2,
      bookerGuestId: guest,
      paymentModel: 'ota_prepaid',
      otaRef: `ST${randomUUID().slice(0, 8)}`,
      otaRoomAmountVnd: 1_600_000,
      arrivalDate: from,
      departureDate: to,
      ...more,
    });
  const preview = (b: Booking, query: Record<string, string>, who = 'fd') =>
    c[who]!.get(url(`/reservations/${b.id}/move-preview?${new URLSearchParams(query)}`));

  it('BUG-R2-123: an OTA conflict booking previews B7a through move without overbookingResolution – same group = reassigned_same_group, a higher group = upgraded (FDL+); the write takes the amount shown and still requires the field', async () => {
    await agoda('203', '2028-02-07', '2028-02-09');
    const y = await agoda('203', '2028-02-07', '2028-02-09', { allowUnassigned: true });
    expect((await get(y.id)).conflictState).toBe('open');
    // Same group (2xx): the preview answers, the write needs the value.
    const same = await preview(y, {
      roomId: ids.rooms['202'] as string,
      reasonCode: 'overbooking',
    });
    expect(same.statusCode, same.body).toBe(200);
    const noValue = await act(y.id, 'move', {
      roomId: ids.rooms['202'],
      reasonCode: 'overbooking',
      applyDifference: true,
      expectedDeltaVnd: same.json().folioDeltaVnd,
    });
    expect(noValue.statusCode, noValue.body).toBe(422);
    expect(noValue.json().errors).toEqual([{ field: 'overbookingResolution', code: 'REQUIRED' }]);
    // An upgrade (401): FDL previews and saves with the amount shown.
    const up = await preview(
      y,
      { roomId: ids.rooms['401'] as string, reasonCode: 'overbooking' },
      'fdl',
    );
    expect(up.statusCode, up.body).toBe(200);
    const saved = await act(
      y.id,
      'move',
      {
        roomId: ids.rooms['401'],
        reasonCode: 'overbooking',
        overbookingResolution: 'upgraded',
        applyDifference: true,
        expectedDeltaVnd: up.json().folioDeltaVnd,
      },
      'fdl',
    );
    expect(saved.statusCode, saved.body).toBe(200);
    expect(saved.json().conflictState).not.toBe('open');
  });

  it('BUG-R2-133: a B7a `upgraded` booking (203 → 401) whose origin was not stored (before 0059) – the guest then asks 302: the OTA difference is measured from 203 (125.000 × 2), as for a booking with its origin; the count query finds exactly the legacy row', async () => {
    const run = async (from: string, legacy: boolean) => {
      await agoda('203', from, `2028-03-${String(Number(from.slice(8)) + 2).padStart(2, '0')}`);
      const y = await agoda(
        '203',
        from,
        `2028-03-${String(Number(from.slice(8)) + 2).padStart(2, '0')}`,
        {
          allowUnassigned: true,
        },
      );
      const as = await act(
        y.id,
        'assign-room',
        { roomId: ids.rooms['401'], resolution: 'upgraded' },
        'fdl',
      );
      expect(as.statusCode, as.body).toBe(200);
      const [o] = await q<{ origin: string | null }>(
        'SELECT origin_room_id::text AS origin FROM reservation WHERE id = $1',
        [y.id],
      );
      // Today's B7a stores the room booked as the origin.
      expect(o!.origin).toBe(ids.rooms['203']);
      if (legacy) {
        await q('UPDATE reservation SET origin_room_id = NULL WHERE id = $1', [y.id]);
      }
      const pv = await preview(y, {
        roomId: ids.rooms['302'] as string,
        reasonCode: 'guest_request',
      });
      expect(pv.statusCode, pv.body).toBe(200);
      return { y, delta: pv.json().folioDeltaVnd as number };
    };
    await at('2028-02-10T10:00:00+07:00');
    const before = (await q<{ upgraded_without_origin: string }>(COUNT_133))[0]!;
    const control = await run('2028-03-06', false);
    const legacy = await run('2028-03-13', true);
    expect(control.delta).toBe(2 * 125_000);
    expect(legacy.delta).toBe(control.delta);
    const after = (
      await q<{ upgraded_without_origin: string; moved_without_origin: string }>(COUNT_133)
    )[0]!;
    expect(Number(after.upgraded_without_origin) - Number(before.upgraded_without_origin)).toBe(1);
  });

  it('FB-R2-ARC-BE-S4-13 / ARC 16.23 (B): B2 takes no receipt image – any `initialPayment.attachmentId` (a real receipt, another purpose, not an id) → 422 NOT_ALLOWED and nothing is created; the image goes with recordPayment after the booking exists', async () => {
    const upload = (
      who: string,
      purpose: 'deposit_receipt' | 'penalty_evidence',
      reservationId: string,
    ) =>
      db.withContext(
        { ...t.ctx(), userId: t.users[who]!.id, actorType: 'user' },
        async (tx) =>
          (
            await fa.app
              .get(AttachmentService)
              .upload(
                tx,
                { userId: t.users[who]!.id, roles: t.users[who]!.roles },
                { purpose, reservationId },
                { data: Buffer.from('fake-jpeg-bytes'), mime: 'image/jpeg', width: 1, height: 1 },
              )
          ).id,
      );
    await at('2028-04-01T10:00:00+07:00');
    const body = (room: string, payment: Record<string, unknown>) => ({
      roomId: ids.rooms[room],
      channelId: ids.channels.direct,
      directSource: 'zalo_phone',
      paymentModel: 'direct',
      adults: 2,
      bookerGuestId: guest,
      arrivalDate: '2028-05-02',
      departureDate: '2028-05-04',
      initialPayment: { type: 'deposit', amountVnd: 500_000, ...payment },
    });
    // An existing booking and its receipts (a deposit receipt is uploaded FOR a booking – uploadAttachment).
    const other = await create(body('202', { method: 'cash' }));
    const otherReceipt = await upload('fd', 'deposit_receipt', other.id);
    const evidence = await upload('fd', 'penalty_evidence', other.id);
    const before = (await q<{ n: number }>('SELECT count(*)::int AS n FROM reservation'))[0]!.n;
    for (const bad of [otherReceipt, evidence, 'not-an-id', randomUUID()]) {
      const r = await c.fd!.send(
        'POST',
        url('/reservations'),
        body('203', { method: 'bank_transfer', attachmentId: bad }),
      );
      expect(r.statusCode, r.body).toBe(422);
      expect(r.json().errors).toEqual([
        { field: 'initialPayment.attachmentId', code: 'NOT_ALLOWED' },
      ]);
    }
    expect((await q<{ n: number }>('SELECT count(*)::int AS n FROM reservation'))[0]!.n).toBe(
      before,
    );
    // The way that works today: the receipt of the booking, recorded with its payment (BE-B recordPayment).
    const pay = await c.fd!.send('POST', url(`/folios/${other.folioId}/payments`), {
      type: 'deposit',
      method: 'bank_transfer',
      amountVnd: 100_000,
      attachmentId: otherReceipt,
    });
    expect(pay.statusCode, pay.body).toBe(201);
    expect(pay.json().attachmentId).toBe(otherReceipt);
  });

  it('BUG-R2-101 (ARC 16.20): a hold has no posted folio line – `balanceDueVnd` is absent; once confirmed (room lines posted) it is the folio balance', async () => {
    await at('2028-06-01T10:00:00+07:00');
    const svc = fa.app.get(ReservationsService);
    const hold = await db.withContext(
      { ...t.ctx(), userId: t.users.sal!.id, actorType: 'user' },
      async (tx) => {
        const ctx = await svc.context(tx, { userId: t.users.sal!.id, roles: ['sales_staff'] });
        return svc.createHold(tx, ctx, {
          roomId: ids.rooms['102']!,
          channelId: ids.channels.direct!,
          arrivalDate: '2028-07-03',
          departureDate: '2028-07-05',
          adults: 2,
          children6to11: 0,
          childrenUnder6: 0,
          bookerGuestId: guest,
          holdHours: 24,
        });
      },
    );
    const h = await get(hold.id);
    expect(h.status).toBe('hold');
    expect(h).not.toHaveProperty('balanceDueVnd');
    const confirmed = await create({
      roomId: ids.rooms['103'],
      channelId: ids.channels.direct,
      directSource: 'zalo_phone',
      paymentModel: 'direct',
      adults: 2,
      bookerGuestId: guest,
      arrivalDate: '2028-07-03',
      departureDate: '2028-07-05',
      initialPayment: { type: 'deposit', method: 'cash', amountVnd: 500_000 },
    });
    const r = await get(confirmed.id);
    const totals = (await c.fd!.get(url(`/folios/${confirmed.folioId}`))).json().totals;
    expect(r.status).toBe('confirmed');
    expect(r.balanceDueVnd).toBe(totals.balanceDueVnd);
    expect(r.balanceDueVnd).toBeGreaterThan(0);
  });
});
