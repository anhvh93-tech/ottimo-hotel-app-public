/**
 * ARC openapi-0.3.7.md 16.27 (2) / BR-525 (DOM 18/10, R7LOCK-02): a FOC with reason `debt_write_off` writes off a
 * debt after check-out – it is not a free service to a staying guest, so the BR-435 monthly FOC alert
 * (`foc_threshold`, OWN only) leaves it out: (a) the reduction value vs `foc_alert_pct_of_room_revenue` % of the
 * month's room revenue, and (b) the count of live FOC decisions per approver.
 * The write-off FOC itself is posted by BE-B (open debt on a settled / closed folio); here an ordinary self-applied
 * OWN FOC is relabelled `debt_write_off` in the data (as ottimo_owner – the app role has no UPDATE on the reason)
 * – the read model only looks at the reason code.
 * Oracle: X = 100.000 `service_recovery` alone is under 15 % of the room revenue R (K-06, net of the FOC applied
 * to the nights) and one decision ≤ the limit 1; X + W (W = 400.000) is over 15 % and two decisions > 1 → with W as
 * `service_recovery` both alert lines show, with W as `debt_write_off` neither does; at 5 % the value line comes
 * back with pct = X / R only.
 * Ports of BE-C zones are fakes (as in dashboard-s4-bed.test.ts). Fake clock, FAKE data only.
 */
import { Client as PgClient } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database, Tx } from '../../src/db/database';
import { FrontdeskPorts } from '../../src/modules/frontdesk/internal/stay-support';
import type {
  CheckinDocumentStatus,
  FrontdeskGuestAccessPort,
  FrontdeskMinibarPort,
  FrontdeskRegistrationPort,
} from '../../src/modules/frontdesk/public/ports';
import { Client, type FeatureApp, P, setPassword, startFeatureApp } from '../helpers/feature-app';
import {
  type BookingIds,
  seedBooking,
  seedGuestRow,
  touchSessions,
} from '../helpers/reservations-fixture';
import { HAS_DB, type TestTenant, appDatabase, createTenant, setParam } from '../helpers/tenant';

class FakeRegistration implements FrontdeskRegistrationPort {
  docs: CheckinDocumentStatus = {
    mainGuestDocument: true,
    documentCheckBlock: false,
    pendingOnlineCheckin: false,
    visaExpiresBeforeDeparture: false,
    passportExpiresDuringStay: false,
  };
  async checkinDocumentStatus(): Promise<CheckinDocumentStatus> {
    return this.docs;
  }
  async deadlinePreview(_tx: Tx, _id: string, at: Date): Promise<Date | null> {
    return new Date(at.getTime() + 12 * 3_600_000);
  }
  async onCheckedIn(_tx: Tx, _id: string, at: Date): Promise<Date | null> {
    return new Date(at.getTime() + 12 * 3_600_000);
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
class FakeGuestAccess implements FrontdeskGuestAccessPort {
  async revokeAllForReservation(): Promise<number> {
    return 0;
  }
}
class FakeMinibar implements FrontdeskMinibarPort {
  async checkoutStatus() {
    return { required: false, checked: true };
  }
  async onCheckedOut() {
    return null;
  }
}

const X = 100_000;
const W = 400_000;

describe.skipIf(!HAS_DB)('BR-435 alert without debt write-offs (ARC 16.27, BR-525 – BE-D)', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let ids: BookingIds;
  let guest: string;
  const c: Record<string, Client> = {};
  const bookings: Record<string, { id: string; folioId: string }> = {};
  let writeOffId = '';

  beforeAll(async () => {
    db = appDatabase(5);
    t = await createTenant(db, { users: { own: ['owner'], fd: ['front_desk'] } });
    ids = await seedBooking(db, t);
    guest = await seedGuestRow(db, t, { name: 'Khách Thử FOC' });
    fa = await startFeatureApp(db, {
      override: (bld) =>
        bld.overrideProvider(FrontdeskPorts).useFactory({
          factory: () =>
            new FrontdeskPorts(
              new FakeRegistration(),
              new FakeGuestAccess(),
              { encryptChild: async () => ({}) as never, destroy: async () => undefined },
              new FakeMinibar(),
            ),
        }),
    });
    for (const u of ['own', 'fd']) {
      c[u] = Client.of(fa, t, u);
      c[u]!.deviceToken = await t.deviceToken();
    }
    await setPassword(db, t, 'own');
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
  /** One statement as ottimo_owner (FORCE RLS: the tenant's property only), like minibar-m1.test.ts. */
  const asOwner = async (sql: string, params: unknown[]) => {
    const pg = new PgClient({ connectionString: process.env.MIGRATION_DATABASE_URL });
    await pg.connect();
    try {
      await pg.query('SET ROLE ottimo_owner');
      await pg.query('BEGIN');
      await pg.query(
        `SELECT set_config('app.organization_id', $1, true), set_config('app.property_id', $2, true)`,
        [t.organizationId, t.propertyIds[0]],
      );
      const r = await pg.query(sql, params);
      await pg.query('COMMIT');
      expect(r.rowCount).toBe(1);
    } finally {
      await pg.end();
    }
  };
  const focLines = async () =>
    ((await c.own!.get(url('/attention'))).json().data as Array<Record<string, unknown>>).filter(
      (i) => i.kind === 'foc_threshold',
    );
  const checks = async () =>
    (await focLines()).map((l) => (l.params as Record<string, unknown>).check).sort();
  /** OWN FOC on the room line of 15/10 – self-applied (approved at once). */
  const foc = async (room: string, amountVnd: number) => {
    const b = bookings[room]!;
    const folio = (await c.fd!.get(url(`/folios/${b.folioId}`))).json();
    const line = folio.lines.find(
      (l: { category: string; serviceDate?: string }) =>
        l.category === 'room' && l.serviceDate === '2026-10-15',
    );
    const r = await c.own!.send('POST', url(`/folios/${b.folioId}/lines/${line.id}/foc`), {
      kind: 'foc',
      amountVnd,
      reasonCode: 'service_recovery',
    });
    expect(r.statusCode, r.body).toBe(201);
    expect(r.json().status).toBe('approved');
    return r.json().id as string;
  };

  it('setup 15/10: two stays 15→17/10; alert at 15 % of the room revenue, 1 decision per approver', async () => {
    await at('2026-10-15T09:00:00+07:00');
    for (const room of ['101', '102']) {
      const body: Record<string, unknown> = {
        roomId: ids.rooms[room],
        channelId: ids.channels.direct,
        directSource: 'zalo_phone',
        arrivalDate: '2026-10-15',
        departureDate: '2026-10-17',
        adults: 2,
        bookerGuestId: guest,
        paymentModel: 'direct',
        initialPayment: { type: 'deposit', method: 'cash', amountVnd: 1_600_000 },
      };
      let res = await c.fd!.send('POST', url('/reservations'), body);
      if (res.statusCode !== 201 && res.json().depositRequiredVnd) {
        body.initialPayment = {
          type: 'deposit',
          method: 'cash',
          amountVnd: res.json().depositRequiredVnd,
        };
        res = await c.fd!.send('POST', url('/reservations'), body);
      }
      expect(res.statusCode, res.body).toBe(201);
      bookings[room] = res.json();
    }
    await setParam(db, t, 'foc_alert_pct_of_room_revenue', 15, '2026-10-02');
    await setParam(db, t, 'foc_alert_count_per_approver', 1, '2026-10-02');
  });

  it('BR-435 (a)(b): X alone → no line; X + W as an ordinary FOC → value and count lines; W relabelled debt_write_off → no line', async () => {
    await at('2026-10-15T10:00:00+07:00');
    // K-06 = room revenue of the month's sold nights, NET of the FOC applied to them (read after each FOC).
    const revenue = async () =>
      Number(
        (
          await q<{ room: string }>(
            `SELECT COALESCE(SUM(room_revenue_vnd), 0)::text AS room FROM stay_night
              WHERE night_state = 'sold' AND stay_date BETWEEN '2026-10-01' AND '2026-10-15'`,
          )
        )[0]!.room,
      );
    await foc('101', X);
    expect(X * 100 <= 15 * (await revenue())).toBe(true);
    expect(await focLines()).toEqual([]);
    writeOffId = await foc('102', W);
    const net = await revenue();
    expect(X * 100 <= 15 * net && (X + W) * 100 > 15 * net, `R = ${net}`).toBe(true);
    expect(await checks()).toEqual(['foc_count_per_approver', 'foc_pct_of_room_revenue']);
    // BE-B's write-off path posts the same FOC line with reason `debt_write_off` (16.27 (2)).
    await asOwner(`UPDATE approval_request SET reason_code = 'debt_write_off' WHERE id = $1`, [
      writeOffId,
    ]);
    expect(await focLines()).toEqual([]);
    // At 5 % the value line is back – with X only in the reduction.
    await setParam(db, t, 'foc_alert_pct_of_room_revenue', 5, '2026-10-15');
    const lines = await focLines();
    expect(lines).toEqual([
      expect.objectContaining({
        severity: 'warning',
        params: {
          check: 'foc_pct_of_room_revenue',
          pct: Math.round((X * 1000) / net) / 10,
          threshold: 5,
        },
      }),
    ]);
    expect((lines[0]!.params as { pct: number }).pct).not.toBe(
      Math.round(((X + W) * 1000) / net) / 10,
    );
  });
});
