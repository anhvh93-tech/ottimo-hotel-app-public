/**
 * S4-36 (ARC FB-R2-ARC-BE-S3-30, plan R2 mục 6, budget `architecture.md` mục 16: API p95 read < 300 ms, write
 * < 500 ms): p95 of `getExtensionOptions` and `extendStay` (B13) at their largest – a manual long stay scanning 62
 * nights (extend by 62), and a short agreed stay moved by OTTIMO (the BR-417 appendix 5A rate of 7 nights, two
 * rooms' calendars per night). In-process HTTP (Fastify inject) against the real PostgreSQL, fake clock, FAKE data.
 * Not part of the normal run: `PERF=1 vitest run test/perf` (prints p50 / p95 / max per operation).
 */
import { randomBytes } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import pg from 'pg';
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

type Booking = { id: string; code: string; version: number; folioId: string };
const ROOMS = ['101', '102', '103', '201', '202', '203', '301', '302', '401', '402'];
const day = (from: string, n: number) => {
  const d = new Date(`${from}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
/** Round trips to PostgreSQL (every `pg.Client#query` of the process – the app runs in-process). */
let queries = 0;
const original = pg.Client.prototype.query;
(pg.Client.prototype as unknown as { query: (...a: unknown[]) => unknown }).query = function (
  this: pg.Client,
  ...a: unknown[]
) {
  queries += 1;
  return (original as (...x: unknown[]) => unknown).apply(this, a);
};
const stats = (ms: number[]) => {
  const s = [...ms].sort((a, b) => a - b);
  const at = (p: number) =>
    s[Math.min(s.length - 1, Math.ceil((p / 100) * s.length) - 1)] as number;
  return {
    n: s.length,
    p50: Math.round(at(50)),
    p95: Math.round(at(95)),
    max: Math.round(at(100)),
  };
};

describe.skipIf(!HAS_DB || !process.env.PERF)('S4-36 – p95 of B13 (62 nights)', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let ids: BookingIds;
  let guest: string;
  let fd: Client;
  const report: Record<string, ReturnType<typeof stats> & { queries?: number }> = {};
  const roundTrips: Record<string, number[]> = {};

  beforeAll(async () => {
    db = appDatabase(8);
    t = await createTenant(db, { users: { fd: ['front_desk'] } });
    ids = await seedBooking(db, t);
    guest = await seedGuestRow(db, t, { name: 'Khách Đo Hiệu Năng' });
    fa = await startFeatureApp(db, {
      override: (b) =>
        b.overrideProvider(FrontdeskPorts).useFactory({
          factory: (child: FrontdeskChildDataPort) =>
            new FrontdeskPorts(new DocsOk(), new NoGuestAccessPort(), child, new MinibarCounted()),
          inject: [FD_CHILD_DATA_PORT],
        }),
    });
    fd = Client.of(fa, t, 'fd');
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
    fd.deviceToken = token;
  });
  afterAll(async () => {
    console.log('[S4-36]', JSON.stringify(report));
    await fa?.close();
    await db?.close();
  });

  const url = (p = '') => `${P(t)}${p}`;
  const at = async (iso: string) => {
    const d = new Date(iso);
    fa.clock.set(d);
    await touchSessions(db, t, d);
  };
  const get = async (id: string) => (await fd.get(url(`/reservations/${id}`))).json();
  const act = async (id: string, verb: string, body: unknown) =>
    fd.send('POST', url(`/reservations/${id}/actions/${verb}`), body, {
      'if-match': `"${(await get(id)).version}"`,
    });
  const timed = async <T>(fn: () => Promise<T>, key?: string): Promise<[T, number]> => {
    const q0 = queries;
    const t0 = performance.now();
    const r = await fn();
    const ms = performance.now() - t0;
    if (key) (roundTrips[key] ??= []).push(queries - q0);
    return [r, ms];
  };
  const withQueries = (key: string, ms: number[]) => {
    const n = roundTrips[key] ?? [];
    return {
      ...stats(ms),
      queries: Math.round(n.reduce((a, x) => a + x, 0) / Math.max(1, n.length)),
    };
  };
  const ready = (room: string) =>
    db.withContext(t.ctx(), (tx) =>
      tx.query(
        `INSERT INTO room_status (room_id, organization_id, property_id, status, since) VALUES ($1, $2, $3, 'VC', $4)
         ON CONFLICT (room_id) DO UPDATE SET status = 'VC'`,
        [ids.rooms[room], t.organizationId, t.propertyIds[0], new Date('2026-10-01T00:00:00Z')],
      ),
    );
  const create = async (body: Record<string, unknown>): Promise<Booking> => {
    let res = await fd.send('POST', url('/reservations'), body);
    if (res.statusCode === 422 && res.json().code === 'DEPOSIT_INSUFFICIENT') {
      res = await fd.send('POST', url('/reservations'), {
        ...body,
        initialPayment: {
          type: 'deposit',
          method: 'cash',
          amountVnd: res.json().depositRequiredVnd,
        },
      });
    }
    expect(res.statusCode, res.body).toBe(201);
    return res.json() as Booking;
  };
  const checkIn = async (b: Booking, room: string, d: string) => {
    await at(`${d}T15:00:00+07:00`);
    await ready(room);
    const pv = (
      await fd.get(url(`/reservations/${b.id}/check-in-preview?checkinTime=15:00`))
    ).json();
    const due = pv.amountDueAtCheckinVnd as number;
    const ci = await act(b.id, 'check-in', {
      cardsIssued: 1,
      houseRulesSent: true,
      checkinTime: '15:00',
      ...(due > 0 ? { payment: { type: 'charge', method: 'cash', amountVnd: due } } : {}),
    });
    expect(ci.statusCode, ci.body).toBe(200);
  };

  it('manual long stay (external contract) – options scan 62 nights; extend 62 nights', async () => {
    const arrival = '2031-01-06';
    const departure = day(arrival, 30);
    const stays: Array<{ b: Booking; room: string }> = [];
    await at('2030-12-01T10:00:00+07:00');
    for (const room of ROOMS) {
      stays.push({
        room,
        b: await create({
          roomId: ids.rooms[room],
          channelId: ids.channels.direct,
          directSource: 'zalo_phone',
          arrivalDate: arrival,
          departureDate: departure,
          adults: 1,
          bookerGuestId: guest,
          paymentModel: 'direct',
          manualLongStay: { monthlyRentVnd: 9_000_000 },
        }),
      });
    }
    for (const s of stays) await checkIn(s.b, s.room, arrival);
    await at(`${day(arrival, 10)}T10:00:00+07:00`);
    const reads: number[] = [];
    for (let i = 0; i < 30; i += 1) {
      const s = stays[i % stays.length]!;
      const [r, ms] = await timed(
        () => fd.get(url(`/reservations/${s.b.id}/extension-options`)),
        'longOptions',
      );
      expect(r.statusCode, r.body).toBe(200);
      expect(r.json().maxNights).toBe(62);
      reads.push(ms);
    }
    report.longOptions = withQueries('longOptions', reads);
    const writes: number[] = [];
    for (const s of stays) {
      const v = (await get(s.b.id)).version;
      const [r, ms] = await timed(
        () =>
          fd.send(
            'POST',
            url(`/reservations/${s.b.id}/actions/extend`),
            { nights: 62 },
            { 'if-match': `"${v}"` },
          ),
        'longExtend62',
      );
      expect(r.statusCode, r.body).toBe(200);
      writes.push(ms);
    }
    report.longExtend62 = withQueries('longExtend62', writes);
    expect(report.longOptions.p95).toBeLessThan(300);
    expect(report.longExtend62.p95).toBeLessThan(500);
  }, 300_000);

  it('short agreed stay moved by OTTIMO (BR-417 appendix 5A, two calendars per night) – options 7 nights; extend 7 nights', async () => {
    const pairs: Array<[string, string]> = [
      ['101', '102'],
      ['103', '201'],
      ['202', '203'],
      ['301', '302'],
      ['401', '402'],
    ];
    const stays: Booking[] = [];
    for (const mon of ['2031-06-02', '2031-06-23']) {
      await at(`${day(mon, -30)}T10:00:00+07:00`);
      const made: Array<{ b: Booking; from: string; to: string }> = [];
      for (const [from, to] of pairs) {
        made.push({
          from,
          to,
          b: await create({
            roomId: ids.rooms[from],
            channelId: ids.channels.direct,
            directSource: 'zalo_phone',
            arrivalDate: mon,
            departureDate: day(mon, 2),
            adults: 2,
            bookerGuestId: guest,
            paymentModel: 'direct',
            nightlyRates: [0, 1].map((i) => ({ date: day(mon, i), amountVnd: 760_000 })),
          }),
        });
      }
      for (const m of made) await checkIn(m.b, m.from, mon);
      await at(`${day(mon, 1)}T10:00:00+07:00`);
      for (const m of made) {
        await ready(m.to);
        const body = {
          newRoomId: ids.rooms[m.to],
          effectiveDate: day(mon, 1),
          cause: 'property_fault',
          reason: 'Điều hòa hỏng',
        };
        const dry = await act(m.b.id, 'change-room', { ...body, dryRun: true });
        expect(dry.statusCode, dry.body).toBe(200);
        const res = await act(m.b.id, 'change-room', {
          ...body,
          applyDifference: true,
          expectedDeltaVnd: dry.json().folioDeltaVnd,
        });
        expect(res.statusCode, res.body).toBe(200);
        stays.push(m.b);
      }
    }
    // Reads on the first window's day (its stays), then the writes in each window.
    await at('2031-06-03T11:00:00+07:00');
    const reads: number[] = [];
    for (let i = 0; i < 30; i += 1) {
      const b = stays[i % 5]!;
      const [r, ms] = await timed(
        () => fd.get(url(`/reservations/${b.id}/extension-options`)),
        'shortOptions',
      );
      expect(r.statusCode, r.body).toBe(200);
      reads.push(ms);
    }
    report.shortOptions = withQueries('shortOptions', reads);
    const writes: number[] = [];
    for (const [i, b] of stays.entries()) {
      await at(`${i < 5 ? '2031-06-03' : '2031-06-24'}T11:00:00+07:00`);
      const v = (await get(b.id)).version;
      const [r, ms] = await timed(
        () =>
          fd.send(
            'POST',
            url(`/reservations/${b.id}/actions/extend`),
            { nights: 7 },
            {
              'if-match': `"${v}"`,
            },
          ),
        'shortExtend7',
      );
      expect(r.statusCode, r.body).toBe(200);
      writes.push(ms);
    }
    report.shortExtend7 = withQueries('shortExtend7', writes);
    expect(report.shortOptions.p95).toBeLessThan(300);
    expect(report.shortExtend7.p95).toBeLessThan(500);
  }, 300_000);
});
