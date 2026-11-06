/**
 * SEC FB-R5-SEC-BE-131-01 + ARC FB-R5-ARC-BE-131-01 (closes SEC V530-02 and ARC H1-01): the commission of a sale /
 * CTV is OWN/MGR only in BOTH audit reads – listAuditEvents (FD/FDL: their own rows) and getReservationHistory (FD/FDL:
 * every row of the booking). Real Nest/Fastify + PostgreSQL, fake clock, FAKE data only (test rate of the tenant).
 * - FD creates a sale's booking (closerUserId = SAL) → `commission.projected` (ratePct, baseVnd, amountVnd) and
 *   `folio.line_posted` (commissionVnd) under FD's name; FD records B18 → `commission.earned` under FD's name. A second
 *   booking is created and checked out by the FDL the same way.
 * - FD / FDL: listAuditEvents and getReservationHistory show no `commission.*` row and no `commissionVnd` key; the
 *   night-sync row itself stays (roomVnd kept). The rows ARE in the table (checked first – the test is not empty).
 * - MGR / OWN: both reads show the commission rows (ratePct…) and `commissionVnd`, as before.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { randomBytes } from 'node:crypto';
import { v7 as uuidv7 } from 'uuid';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
import {
  NoGuestAccessPort,
  NoMinibarPort,
} from '../../src/modules/frontdesk/internal/default-ports';
import { FrontdeskPorts } from '../../src/modules/frontdesk/internal/stay-support';
import {
  FD_CHILD_DATA_PORT,
  type CheckinDocumentStatus,
  type FrontdeskChildDataPort,
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
  sal: ['sales_staff'],
};
const DESK = ['own', 'mgr', 'fdl', 'fd'];
const ARRIVAL = '2026-11-20';
const DEPARTURE = '2026-11-22';
const RANGE = 'from=2026-11-08&to=2026-11-23';

type Booking = { id: string; code: string; folioId: string };
type Row = {
  action: string;
  entityType?: string;
  entityCode?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
};

const hasCommissionKey = (r: Row) =>
  (r.before !== undefined && 'commissionVnd' in r.before) ||
  (r.after !== undefined && 'commissionVnd' in r.after);
const isCommissionRow = (r: Row) =>
  r.entityType === 'commission' || r.action.startsWith('commission.');

describe.skipIf(!HAS_DB)('SEC 131-01 / ARC 131-01 – commission audit is OWN/MGR only', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let ids: BookingIds;
  let guest: string;
  const c: Record<string, Client> = {};
  let byFd: Booking;
  let byFdl: Booking;

  const url = (path = '') => `${P(t)}${path}`;
  async function at(when: string) {
    const d = new Date(when);
    fa.clock.set(d);
    await touchSessions(db, t, d);
  }
  const q = (sql: string, a: unknown[] = []) =>
    db.withContext(t.ctx(), async (tx) => (await tx.query(sql, a)).rows as any[]);
  async function act(b: Booking, verb: string, body: unknown, who: string) {
    const v = (await c[who]!.get(url(`/reservations/${b.id}`))).json().version;
    return c[who]!.send('POST', url(`/reservations/${b.id}/actions/${verb}`), body, {
      'if-match': `"${v}"`,
    });
  }

  /** A sale's booking made, paid in full, checked in and checked out by `who` (FD or FDL). */
  async function saleStay(room: string, who: 'fd' | 'fdl'): Promise<Booking> {
    await at('2026-11-10T10:00:00+07:00');
    const body = {
      roomId: ids.rooms[room],
      channelId: ids.channels.direct,
      directSource: 'sales_staff',
      closerUserId: t.users.sal!.id,
      adults: 2,
      bookerGuestId: guest,
      paymentModel: 'direct',
      arrivalDate: ARRIVAL,
      departureDate: DEPARTURE,
    };
    let res = await c[who]!.send('POST', url('/reservations'), body);
    if (res.statusCode === 422 && res.json().code === 'DEPOSIT_INSUFFICIENT') {
      res = await c[who]!.send('POST', url('/reservations'), {
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
    await at(`${ARRIVAL}T15:00:00+07:00`);
    await q(
      `INSERT INTO room_status (room_id, organization_id, property_id, status, since) VALUES ($1, $2, $3, 'VC', $4)
       ON CONFLICT (room_id) DO UPDATE SET status = 'VC'`,
      [ids.rooms[room], t.organizationId, t.propertyIds[0], new Date('2026-10-01T00:00:00Z')],
    );
    const due = (await c.mgr!.get(url(`/folios/${b.folioId}`))).json().totals
      .balanceDueVnd as number;
    if (due > 0) {
      const p = await c[who]!.send('POST', url(`/folios/${b.folioId}/payments`), {
        type: 'charge',
        method: 'cash',
        amountVnd: due,
      });
      expect(p.statusCode, p.body).toBe(201);
    }
    const ci = await act(
      b,
      'check-in',
      { cardsIssued: 1, houseRulesSent: true, checkinTime: '15:00' },
      who,
    );
    expect(ci.statusCode, ci.body).toBe(200);
    await at(`${DEPARTURE}T11:00:00+07:00`);
    const out = await act(b, 'check-out', { checkoutAt: `${DEPARTURE}T11:00:00+07:00` }, who);
    expect(out.statusCode, out.body).toBe(200);
    return b;
  }

  /** Every page of listAuditEvents for `who` (with `extra` query). */
  async function auditList(who: string, extra = ''): Promise<Row[]> {
    const rows: Row[] = [];
    let cursor: string | undefined;
    for (let i = 0; i < 20; i++) {
      const res = await c[who]!.get(
        url(
          `/audit-events?${RANGE}&limit=100${extra}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`,
        ),
      );
      expect(res.statusCode, res.body).toBe(200);
      rows.push(...(res.json().data as Row[]));
      cursor = res.json().page.nextCursor ?? undefined;
      if (!cursor) break;
    }
    return rows;
  }
  async function history(who: string, b: Booking): Promise<Row[]> {
    const res = await c[who]!.get(url(`/reservations/${b.id}/history`));
    expect(res.statusCode, res.body).toBe(200);
    return res.json().data as Row[];
  }

  beforeAll(async () => {
    db = appDatabase(6);
    t = await createTenant(db, { users: ROLES });
    ids = await seedBooking(db, t);
    guest = await seedGuestRow(db, t, { name: 'Khách Thử Hoa Hồng' });
    fa = await startFeatureApp(db, {
      override: (b) =>
        b.overrideProvider(FrontdeskPorts).useFactory({
          factory: (child: FrontdeskChildDataPort) =>
            new FrontdeskPorts(new DocsOk(), new NoGuestAccessPort(), child, new NoMinibarPort()),
          inject: [FD_CHILD_DATA_PORT],
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
    for (const u of DESK) c[u]!.deviceToken = token;
    for (const u of Object.keys(ROLES)) await setPassword(db, t, u);
    byFd = await saleStay('201', 'fd');
    byFdl = await saleStay('202', 'fdl');
  }, 240_000);
  afterAll(async () => {
    await fa?.close();
    await db?.close();
  });

  it('the commission rows and keys ARE in the table, under the FD / FDL who made the stay', async () => {
    for (const [who, b] of [
      ['fd', byFd],
      ['fdl', byFdl],
    ] as const) {
      const rows = await q(
        `SELECT action FROM audit_event WHERE actor_user_id = $1 AND entity_code = $2
            AND (entity_type = 'commission' OR after ? 'commissionVnd') ORDER BY occurred_at, id`,
        [t.users[who]!.id, b.code],
      );
      const actions = rows.map((r) => r.action);
      expect(actions, who).toContain('commission.projected');
      expect(actions, who).toContain('commission.earned');
      expect(actions, who).toContain('folio.line_posted');
    }
    const [cm] = await q(
      `SELECT status FROM commission WHERE reservation_id = $1 AND status <> 'void'`,
      [byFd.id],
    );
    expect(cm).toMatchObject({ status: 'earned' });
  });

  it('FD and FDL: listAuditEvents (own rows) shows no commission row and no commissionVnd; the night sync stays', async () => {
    for (const [who, b] of [
      ['fd', byFd],
      ['fdl', byFdl],
    ] as const) {
      const rows = await auditList(who);
      const mine = rows.filter((r) => r.entityCode === b.code);
      expect(mine.length, who).toBeGreaterThan(0);
      expect(rows.filter(isCommissionRow), who).toEqual([]);
      expect(rows.filter(hasCommissionKey), who).toEqual([]);
      const sync = mine.find((r) => r.action === 'folio.line_posted');
      expect(sync?.after, who).toMatchObject({ sync: 'confirmed' });
      expect(typeof sync?.after?.roomVnd, who).toBe('number');
      // Asking for the actions by name gives nothing either.
      expect(
        await auditList(who, '&action=commission.projected&action=commission.earned'),
        who,
      ).toEqual([]);
    }
  });

  it('FD and FDL: getReservationHistory shows no commission row and no commissionVnd, on their own stay and the other', async () => {
    for (const who of ['fd', 'fdl']) {
      for (const b of [byFd, byFdl]) {
        const rows = await history(who, b);
        expect(
          rows.some((r) => r.action === 'folio.line_posted'),
          `${who} ${b.code}`,
        ).toBe(true);
        expect(rows.filter(isCommissionRow), `${who} ${b.code}`).toEqual([]);
        expect(rows.filter(hasCommissionKey), `${who} ${b.code}`).toEqual([]);
      }
    }
  });

  it('MGR and OWN read both in full: commission rows with ratePct / amountVnd and the commissionVnd key', async () => {
    for (const who of ['mgr', 'own']) {
      const listed = await auditList(
        who,
        `&actorUserId=${t.users.fd!.id}&action=commission.projected&action=commission.earned`,
      );
      expect(listed.map((r) => r.action).sort(), who).toEqual([
        'commission.earned',
        'commission.projected',
      ]);
      const projected = listed.find((r) => r.action === 'commission.projected');
      expect(projected?.entityType, who).toBe('commission');
      expect(Object.keys(projected?.after ?? {}), who).toEqual(
        expect.arrayContaining(['ratePct', 'baseVnd', 'amountVnd']),
      );
      const all = await auditList(who, `&actorUserId=${t.users.fdl!.id}`);
      expect(all.some(hasCommissionKey), who).toBe(true);
      for (const b of [byFd, byFdl]) {
        const rows = await history(who, b);
        expect(
          rows.some((r) => r.action === 'commission.projected'),
          `${who} ${b.code}`,
        ).toBe(true);
        expect(
          rows.some((r) => r.action === 'commission.earned'),
          `${who} ${b.code}`,
        ).toBe(true);
        expect(rows.some(hasCommissionKey), `${who} ${b.code}`).toBe(true);
      }
    }
  });
});
