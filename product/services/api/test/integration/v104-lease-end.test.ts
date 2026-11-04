/**
 * v1.0.4 P4-11 (BE-C) – HTTP + DB:
 * - ARC plan v1.0.4 decision 6.1: check-in (B9) freezes `lease_end_date` in `manual_long_stay` (same transaction),
 *   B13 moves only `departure_date`, undo check-in (B17) removes the key; a PATCH before check-in is the lease end;
 * - FB-R4-DOM-BE-A-04: the B16 money log says BR-313 when a manual long stay leaves before its lease end, BR-428
 *   when it leaves inside the B13 extension;
 * - decision 6.2 (V3-09): `If-Match: "n-gzip"` / `"n-zstd"` / `"n-br"` → accepted; another suffix → 422.
 * Fake clock and FAKE data only.
 */
import { randomBytes } from 'node:crypto';
import { v7 as uuidv7 } from 'uuid';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
import { NoGuestAccessPort } from '../../src/modules/frontdesk/internal/default-ports';
import { FrontdeskPorts } from '../../src/modules/frontdesk/internal/stay-support';
import {
  FD_CHILD_DATA_PORT,
  type CheckinDocumentStatus,
  type FrontdeskChildDataPort,
  type FrontdeskMinibarPort,
  type FrontdeskRegistrationPort,
  type MinibarCheckoutStatus,
} from '../../src/modules/frontdesk/public/ports';
import { leaseEndDateOf } from '../../src/modules/reservations/public/lease-end';
import { sha256Hex } from '../../src/shared/http/auth.guard';
import { Client, type FeatureApp, P, startFeatureApp } from '../helpers/feature-app';
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
class MinibarCounted implements FrontdeskMinibarPort {
  async checkoutStatus(): Promise<MinibarCheckoutStatus> {
    return { required: false, checked: true };
  }
  async onCheckedOut(): Promise<string | null> {
    return null;
  }
}

describe.skipIf(!HAS_DB)('v1.0.4 P4-11 – lease end of a manual long stay (HTTP)', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let ids: BookingIds;
  let guest: string;
  const c: Record<string, Client> = {};
  const ROLES = { mgr: ['manager'], fd: ['front_desk'] };

  beforeAll(async () => {
    db = appDatabase(6);
    t = await createTenant(db, { users: ROLES });
    ids = await seedBooking(db, t);
    guest = await seedGuestRow(db, t, { name: 'Khách Thuê Tháng' });
    fa = await startFeatureApp(db, {
      override: (b) =>
        b.overrideProvider(FrontdeskPorts).useFactory({
          factory: (child: FrontdeskChildDataPort) =>
            new FrontdeskPorts(new DocsOk(), new NoGuestAccessPort(), child, new MinibarCounted()),
          inject: [FD_CHILD_DATA_PORT],
        }),
    });
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
    }
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
  const get = async (id: string) => (await c.fd!.get(url(`/reservations/${id}`))).json();
  const act = async (id: string, verb: string, body: unknown, who = 'fd') =>
    c[who]!.send('POST', url(`/reservations/${id}/actions/${verb}`), body, {
      'if-match': `"${(await get(id)).version}"`,
    });
  const lease = async (room: string, from: string, to: string, rent = 8_500_000) => {
    const r = await c.fd!.send('POST', url('/reservations'), {
      roomId: ids.rooms[room],
      channelId: ids.channels.direct,
      directSource: 'zalo_phone',
      arrivalDate: from,
      departureDate: to,
      adults: 1,
      bookerGuestId: guest,
      paymentModel: 'direct',
      manualLongStay: { monthlyRentVnd: rent, depositHeldVnd: rent },
    });
    expect(r.statusCode, r.body).toBe(201);
    return r.json() as { id: string; folioId: string };
  };
  const ready = (room: string) =>
    q(
      `INSERT INTO room_status (room_id, organization_id, property_id, status, since) VALUES ($1, $2, $3, 'VC', $4)
       ON CONFLICT (room_id) DO UPDATE SET status = 'VC'`,
      [ids.rooms[room], t.organizationId, t.propertyIds[0], new Date('2026-10-01T00:00:00Z')],
    );
  const checkIn = async (id: string) => {
    const r = await act(id, 'check-in', {
      cardsIssued: 1,
      houseRulesSent: true,
      checkinTime: '15:00',
    });
    expect(r.statusCode, r.body).toBe(200);
  };
  /** The stored row as the lease-end reader sees it. */
  const stored = async (id: string) => {
    const [r] = await q<{
      stay_type: 'short' | 'long';
      external_contract: boolean;
      manual_long_stay: Record<string, unknown> | null;
      actual_checkin_at: Date | null;
      departure_date: string;
      booked_departure_date: string | null;
    }>(
      `SELECT stay_type, external_contract, manual_long_stay, actual_checkin_at,
              departure_date::text AS departure_date, booked_departure_date::text AS booked_departure_date
         FROM reservation WHERE id = $1`,
      [id],
    );
    return r!;
  };
  const audit = async (id: string) =>
    (
      await q<{ after: Record<string, unknown>; reason: string }>(
        `SELECT after, reason FROM audit_event WHERE entity_id = $1 AND action = 'reservation.early_departure'`,
        [id],
      )
    )[0];

  it('dates of a manual long stay cannot change before check-in (lease end = departure); check-in freezes it; B13 moves only the departure; B16 inside the extension → BR-428 in the money log', async () => {
    await at('2027-02-01T10:00:00+07:00');
    const b = await lease('202', '2027-03-01', '2027-05-01');
    let s = await stored(b.id);
    expect(s.manual_long_stay).not.toHaveProperty('lease_end_date');
    expect(leaseEndDateOf(s)).toBe('2027-05-01');
    // ARC 6.1 "known limit" check: B7 refuses new dates on a manual long stay (reservations.service prepareMove) and
    // PATCH has no date field – so before check-in departure_date = booked_departure_date = the lease end.
    const mv = await act(b.id, 'move', {
      arrivalDate: '2027-03-01',
      departureDate: '2027-05-10',
      reasonCode: 'guest_request',
    });
    expect(mv.statusCode).toBe(422);
    s = await stored(b.id);
    expect(s.departure_date).toBe('2027-05-01');
    expect(s.booked_departure_date).toBe('2027-05-01');

    await at('2027-03-01T15:00:00+07:00');
    await ready('202');
    await checkIn(b.id);
    s = await stored(b.id);
    expect(s.manual_long_stay).toMatchObject({
      monthly_rent_vnd: 8_500_000,
      deposit_held_vnd: 8_500_000,
      lease_end_date: '2027-05-01',
    });

    await at('2027-04-28T10:00:00+07:00');
    const ext = await act(b.id, 'extend', { nights: 10 });
    expect(ext.statusCode, ext.body).toBe(200);
    s = await stored(b.id);
    expect(s.departure_date).toBe('2027-05-11');
    expect(s.manual_long_stay).toMatchObject({ lease_end_date: '2027-05-01' });
    expect(leaseEndDateOf(s)).toBe('2027-05-01');

    // Leaves on 06/05: the lease was served in full (01/05), only extension nights are dropped → BR-428.
    await at('2027-05-03T10:00:00+07:00');
    const ed = await act(b.id, 'early-departure', {
      newDepartureDate: '2027-05-06',
      noticeGivenAt: '2027-05-03T10:00:00+07:00',
    });
    expect(ed.statusCode, ed.body).toBe(200);
    const a = await audit(b.id);
    expect(a!.reason).toMatch(/^BR-428 notice 3d/);
    expect(a!.after).toMatchObject({ earlyDepartureRule: 'BR-428', leaseEndDate: '2027-05-01' });
    expect((await stored(b.id)).manual_long_stay).toMatchObject({ lease_end_date: '2027-05-01' });
  });

  it('B16 before the lease end of an extended lease → BR-313 in the money log (no notice days), no fee line, no refund request', async () => {
    await at('2027-06-01T10:00:00+07:00');
    const b = await lease('203', '2027-06-01', '2027-08-01');
    await at('2027-06-01T15:00:00+07:00');
    await ready('203');
    await checkIn(b.id);
    await at('2027-07-25T10:00:00+07:00');
    expect((await act(b.id, 'extend', { nights: 7 })).statusCode).toBe(200);
    await at('2027-07-26T10:00:00+07:00');
    const before = (
      await q<{ n: number }>('SELECT count(*)::int AS n FROM folio_line WHERE folio_id = $1', [
        b.folioId,
      ])
    )[0]!.n;
    const ed = await act(b.id, 'early-departure', {
      newDepartureDate: '2027-07-28',
      noticeGivenAt: '2027-07-26T10:00:00+07:00',
    });
    expect(ed.statusCode, ed.body).toBe(200);
    expect(ed.json()).toMatchObject({ refundVnd: 0, earlyDepartureFeeVnd: 0 });
    const a = await audit(b.id);
    expect(a!.reason).toBe('BR-313 lease early end – deposit per lease');
    expect(a!.after).toMatchObject({ earlyDepartureRule: 'BR-313', leaseEndDate: '2027-08-01' });
    expect(
      (
        await q<{ n: number }>('SELECT count(*)::int AS n FROM folio_line WHERE folio_id = $1', [
          b.folioId,
        ])
      )[0]!.n,
    ).toBe(before);
    expect(
      await q(`SELECT 1 FROM approval_request WHERE target_id = $1 AND type = 'refund'`, [b.id]),
    ).toEqual([]);
  });

  it('undo check-in (B17) removes the key: the lease end follows departure_date again', async () => {
    await at('2027-09-01T10:00:00+07:00');
    const b = await lease('301', '2027-09-01', '2027-10-15');
    await at('2027-09-01T15:00:00+07:00');
    await ready('301');
    await checkIn(b.id);
    expect((await stored(b.id)).manual_long_stay).toMatchObject({ lease_end_date: '2027-10-15' });
    const undo = await act(b.id, 'undo-check-in', { reason: 'Nhầm khách' }, 'mgr');
    expect(undo.statusCode, undo.body).toBe(200);
    const s = await stored(b.id);
    expect(s.actual_checkin_at).toBeNull();
    expect(s.manual_long_stay).not.toHaveProperty('lease_end_date');
    expect(s.manual_long_stay).toMatchObject({ monthly_rent_vnd: 8_500_000 });
    expect(leaseEndDateOf(s)).toBe('2027-10-15');
  });

  it.each(['gzip', 'zstd', 'br'])(
    'If-Match "<version>-%s" (Caddy encode) is accepted on a PATCH (V3-09)',
    async (coding) => {
      await at('2027-12-01T10:00:00+07:00');
      const b = await lease('302', '2028-01-01', '2028-02-15');
      const r = await get(b.id);
      const res = await c.fd!.send(
        'PATCH',
        url(`/reservations/${b.id}`),
        { adults: 2 },
        { 'if-match': `"${r.version}-${coding}"` },
      );
      expect(res.statusCode, res.body).toBe(200);
      // a stale version with a suffix is still a version conflict
      const stale = await c.fd!.send(
        'PATCH',
        url(`/reservations/${b.id}`),
        { adults: 1 },
        { 'if-match': `W/"${r.version}-${coding}"` },
      );
      expect(stale.statusCode).toBe(412);
      expect(stale.json()).toMatchObject({
        code: 'VERSION_CONFLICT',
        currentVersion: r.version + 1,
      });
      await c.mgr!.send(
        'POST',
        url(`/reservations/${b.id}/actions/cancel`),
        { reasonCode: 'found_other' },
        {
          'if-match': `"${r.version + 1}"`,
        },
      );
    },
  );

  it('If-Match with another suffix ("6-deflate") → 422 on If-Match', async () => {
    await at('2027-12-01T10:00:00+07:00');
    const b = await lease('402', '2028-03-01', '2028-04-15');
    const r = await get(b.id);
    const res = await c.fd!.send(
      'PATCH',
      url(`/reservations/${b.id}`),
      { adults: 2 },
      { 'if-match': `"${r.version}-deflate"` },
    );
    expect(res.statusCode).toBe(422);
    expect(res.json().errors).toContainEqual({ field: 'If-Match', code: 'VALIDATION_FAILED' });
  });
});
