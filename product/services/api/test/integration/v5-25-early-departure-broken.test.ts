/**
 * V5-25 (DOM rules-v1.0.5 13.2, ARC review #96 10, QA T-13-8): an `early_departure_refund` of the wrong shape
 * already stored (written before the save rule) blocks the early departure with 409 PAYMENT_NOT_CONFIGURED – never
 * a 500, never a guessed refund. The detail names the key only. Nothing of the booking changes. FAKE data only.
 */
import { randomBytes } from 'node:crypto';
import { v7 as uuidv7 } from 'uuid';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
import { FrontdeskPorts } from '../../src/modules/frontdesk/internal/stay-support';
import type {
  CheckinDocumentStatus,
  FrontdeskRegistrationPort,
} from '../../src/modules/frontdesk/public/ports';
import {
  NoGuestAccessPort,
  NoMinibarPort,
  UnwiredChildDataPort,
} from '../../src/modules/frontdesk/internal/default-ports';
import { sha256Hex } from '../../src/shared/http/auth.guard';
import { Client, type FeatureApp, P, startFeatureApp } from '../helpers/feature-app';
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

describe.skipIf(!HAS_DB)(
  'V5-25 – a broken early_departure_refund already stored → 409, not 500 (QA T-13-8)',
  () => {
    let db: Database;
    let fa: FeatureApp;
    let t: TestTenant;
    let ids: BookingIds;
    let guest: string;
    let fd: Client;

    beforeAll(async () => {
      db = appDatabase(5);
      t = await createTenant(db, { users: { fd: ['front_desk'] } });
      ids = await seedBooking(db, t);
      guest = await seedGuestRow(db, t, { name: 'Khách Thử T138' });
      fa = await startFeatureApp(db, {
        override: (b) =>
          b
            .overrideProvider(FrontdeskPorts)
            .useValue(
              new FrontdeskPorts(
                new DocsOk(),
                new NoGuestAccessPort(),
                new UnwiredChildDataPort(),
                new NoMinibarPort(),
              ),
            ),
      });
      fd = Client.of(fa, t, 'fd');
      // Trusted desk device valid for the whole test (the tenant helper's device lives 1 day from T0).
      const token = randomBytes(32).toString('base64url');
      await db.withContext(t.ctx(), (tx) =>
        tx.query(
          `INSERT INTO trusted_device (id, organization_id, property_id, name, device_kind, token_hash, created_at,
             expires_at)
           VALUES ($1, $2, $3, 'desk', 'desk', $4, $5, $6)`,
          [
            uuidv7(),
            t.organizationId,
            t.propertyIds[0],
            sha256Hex(token),
            new Date('2026-10-01T00:00:00Z'),
            new Date('2026-12-31T00:00:00Z'),
          ],
        ),
      );
      fd.deviceToken = token;
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
    const act = (id: string, verb: string, version: number, body: unknown) =>
      fd.send('POST', url(`/reservations/${id}/actions/${verb}`), body, {
        'if-match': `"${version}"`,
      });

    // One week and one room per case (Mon → Fri, notice on Tue for Wed); each broken row replaces the one before.
    it.each([
      ['a number', 50, 2, '203'],
      ['a refund above 100 %', { minNoticeDays: 1, refundPct: 150 }, 9, '301'],
      ['a notice in text', { minNoticeDays: '1', refundPct: 50 }, 16, '302'],
    ])(
      'early_departure_refund stored as %s → early departure 409 PAYMENT_NOT_CONFIGURED, nothing changes',
      async (_label, broken, mon, roomNo) => {
        const day = (d: number) => `2026-11-${String(d).padStart(2, '0')}`;
        await at(`${day(mon)}T15:00:00+07:00`);
        const created = await fd.send('POST', url('/reservations'), {
          channelId: ids.channels.direct,
          directSource: 'zalo_phone',
          adults: 2,
          bookerGuestId: guest,
          paymentModel: 'direct',
          roomId: ids.rooms[roomNo],
          arrivalDate: day(mon),
          departureDate: day(mon + 4),
          initialPayment: { type: 'deposit', method: 'cash', amountVnd: 2_000_000 },
        });
        expect(created.statusCode, created.body).toBe(201);
        const b = created.json() as {
          id: string;
          version: number;
          folioId: string;
          totalRoomVnd: number;
        };
        const rest = await fd.send('POST', url(`/folios/${b.folioId}/payments`), {
          type: 'charge',
          method: 'cash',
          amountVnd: b.totalRoomVnd - 2_000_000,
        });
        expect([200, 201], rest.body).toContain(rest.statusCode);
        const ci = await act(b.id, 'check-in', b.version, { cardsIssued: 1, houseRulesSent: true });
        expect(ci.statusCode, ci.body).toBe(200);
        // The broken value, in force from the notice day (written another way than the Desk save).
        await setParam(db, t, 'early_departure_refund', broken, day(mon + 1));
        await at(`${day(mon + 1)}T10:00:00+07:00`);
        const res = await act(b.id, 'early-departure', ci.json().version, {
          newDepartureDate: day(mon + 2),
          noticeGivenAt: `${day(mon + 1)}T10:00:00+07:00`,
        });
        expect(res.statusCode, res.body).toBe(409);
        expect(res.json()).toMatchObject({
          code: 'PAYMENT_NOT_CONFIGURED',
          detail: 'early_departure_refund (BR-428) is not usable',
        });
        // The broken value never reaches the answer. FB-R5-ARC-BE-96-01: the random requestId / instance may hold
        // "150" (~0.7 % red runs) – leave them out, and match 150 as a number of its own.
        const shown = JSON.stringify({ ...res.json(), requestId: undefined, instance: undefined });
        expect(shown).not.toMatch(/\b150\b|minNoticeDays|refundPct/);
        const after = (await fd.get(url(`/reservations/${b.id}`))).json();
        expect(after).toMatchObject({ status: 'in_house', departureDate: day(mon + 4) });
        const refunds = await db.withContext(t.ctx(), (tx) =>
          tx.query(`SELECT 1 FROM approval_request WHERE target_id = $1`, [b.id]),
        );
        expect(refunds.rows).toEqual([]);
      },
    );
  },
);
