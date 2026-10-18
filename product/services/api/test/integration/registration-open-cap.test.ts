/**
 * BUG-R2-170 (QA-VS5-01): "Cần khai báo" (`action_needed`), `needs_update`, "Cần chú ý" (`registration_due` /
 * `registration_overdue`) and J5 must not lose the NEWEST guests once a property holds more than 1,000 open
 * registrations. It was "first 1,000 by id (oldest first), then filter on the booking": a record stays open after
 * the checkout / cancellation, so on the QA stack (1,214 open: 719 in house, 478 checked out, 16 cancelled,
 * 1 confirmed) a guest checked in today was missing (TC-L3-004/044/046). Same sweep in housekeeping: "Cần chú ý"
 * read the 200 oldest open work orders, then filtered high / overdue.
 * The 1,214 old records are inserted directly (FAKE data); the new guest goes through the check-in port.
 */
import { v7 as uuidv7 } from 'uuid';
import { appendFileSync } from 'node:fs';
import type { PoolClient } from 'pg';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { Database, Tx } from '../../src/db/database';
import { JobRegistry } from '../../src/jobs/job-runner';
import { RegistrationService } from '../../src/modules/registration/internal/registration.service';
import { RegistrationPortService } from '../../src/modules/registration/public/registration.port';
import { addDays } from '../../src/shared/time';
import { type FeatureApp, P, startFeatureApp } from '../helpers/feature-app';
import { seedStay, setStayStatus, staff } from '../helpers/registration-fixture';
import {
  type BookingIds,
  seedBooking,
  seedGuestRow,
  touchSessions,
} from '../helpers/reservations-fixture';
import { HAS_DB, T0, type TestTenant, appDatabase, createTenant } from '../helpers/tenant';

const OLD_IN_HOUSE = 719;
const OLD_CHECKED_OUT = 478;
/** Of the checked-out ones: written before the checkout hook existed – no `actual_checkout_at` on the record. */
const OLD_CHECKED_OUT_NO_HOOK = 30;
const OLD_CANCELLED = 16;
const OLD_TOTAL = OLD_IN_HOUSE + OLD_CHECKED_OUT + OLD_CANCELLED + 1;

interface Row {
  reservationId: string;
  arrivalDate?: string;
  status: string;
  deadlineAt?: string;
  deadlineLabel: string;
  isOverdue: boolean;
}

describe.skipIf(!HAS_DB)('BUG-R2-170 – open lists filter before any cap', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let ids: BookingIds;
  let device: string;
  let fresh: { reservationId: string; code: string; registrationId: string };
  const oldIds = { inHouse: new Set<string>(), ended: new Set<string>(), confirmed: '' };
  const tok = (u: string) => t.users[u]!.sessionToken;

  /** 1,214 open records like the QA stack, all created (uuidv7) before the new guest. */
  async function seedOldOpenRecords(): Promise<void> {
    const booker = await seedGuestRow(db, t, { name: 'Khách Cũ Thử Nghiệm' });
    const channel = Object.values(ids.channels)[0];
    const at = (d: string, hhmmZ: string) => new Date(`${d}T${hhmmZ}:00.000Z`);
    type Old = {
      status: 'in_house' | 'checked_out' | 'cancelled' | 'confirmed';
      arrival: string;
      departure: string;
      checkinAt: Date | null;
      checkoutAt: Date | null;
      regStatus: string;
      regCheckoutAt: Date | null;
      stayEndedAt: Date | null;
    };
    const rows: Old[] = [];
    for (let i = 0; i < OLD_IN_HOUSE; i++) {
      const arrival = addDays('2026-08-01', i % 70); // ≤ 2026-10-09
      rows.push({
        status: 'in_house',
        arrival,
        departure: '2026-12-31',
        checkinAt: at(arrival, '07:00'),
        checkoutAt: null,
        regStatus: ['none', 'partial', 'review'][i % 3]!,
        regCheckoutAt: null,
        stayEndedAt: null,
      });
    }
    for (let i = 0; i < OLD_CHECKED_OUT; i++) {
      const arrival = addDays('2026-06-01', i % 100);
      const departure = addDays(arrival, 2);
      const hooked = i < OLD_CHECKED_OUT - OLD_CHECKED_OUT_NO_HOOK;
      rows.push({
        status: 'checked_out',
        arrival,
        departure,
        checkinAt: at(arrival, '07:00'),
        checkoutAt: at(departure, '04:00'),
        regStatus: ['partial', 'sent', 'review', 'none'][i % 4]!,
        regCheckoutAt: hooked ? at(departure, '04:00') : null,
        stayEndedAt: hooked ? at(departure, '04:00') : null,
      });
    }
    for (let i = 0; i < OLD_CANCELLED; i++) {
      rows.push({
        status: 'cancelled',
        arrival: addDays('2026-09-01', i),
        departure: addDays('2026-09-03', i),
        checkinAt: null,
        checkoutAt: null,
        regStatus: 'sent',
        regCheckoutAt: null,
        stayEndedAt: at('2026-08-20', '03:00'),
      });
    }
    // Never arrived, never marked no-show: still "to declare" (confirmed, arrival in the past).
    rows.push({
      status: 'confirmed',
      arrival: '2026-10-01',
      departure: '2026-10-03',
      checkinAt: null,
      checkoutAt: null,
      regStatus: 'none',
      regCheckoutAt: null,
      stayEndedAt: null,
    });
    const resIds = rows.map(() => uuidv7());
    const folioIds = rows.map(() => uuidv7());
    const regIds = rows.map(() => uuidv7());
    rows.forEach((r, i) => {
      if (r.status === 'in_house') oldIds.inHouse.add(resIds[i]!);
      else if (r.status === 'confirmed') oldIds.confirmed = resIds[i]!;
      else oldIds.ended.add(resIds[i]!);
    });
    await db.withContext(t.ctx(), async (tx) => {
      // reservation.folio_id ↔ folio.primary_reservation_id: deferred FKs, same transaction (erd 4.6).
      await tx.query(
        `INSERT INTO folio (id, organization_id, property_id, primary_reservation_id, created_at, updated_at)
         SELECT f, $1, $2, r, $5, $5 FROM unnest($3::uuid[], $4::uuid[]) AS u(f, r)`,
        [t.organizationId, t.propertyIds[0], folioIds, resIds, T0],
      );
      await tx.query(
        `INSERT INTO reservation (id, organization_id, property_id, code, status, stay_type, channel_id,
           payment_model, booker_guest_id, arrival_date, departure_date, adults, children_6_11,
           children_under_6, pricing_snapshot, cancel_reason_code, cancelled_at, status_before_cancel,
           actual_checkin_at, actual_checkout_at, created_at, updated_at, folio_id)
         SELECT u.id, $1, $2, 'OTM-O' || lpad(u.n::text, 5, '0'), u.status, 'short', $3, 'direct', $4,
                u.arrival, u.departure, 1, 0, 0, '{}',
                CASE WHEN u.status = 'cancelled' THEN 'guest_cancelled' END,
                CASE WHEN u.status = 'cancelled' THEN $5::timestamptz END,
                CASE WHEN u.status = 'cancelled' THEN 'confirmed' END,
                u.checkin, u.checkout, $5, $5, u.folio
           FROM unnest($6::uuid[], $7::text[], $8::date[], $9::date[], $10::timestamptz[],
                       $11::timestamptz[], $12::uuid[]) WITH ORDINALITY
                AS u(id, status, arrival, departure, checkin, checkout, folio, n)`,
        [
          t.organizationId,
          t.propertyIds[0],
          channel,
          booker,
          new Date('2026-08-20T03:00:00.000Z'),
          resIds,
          rows.map((r) => r.status),
          rows.map((r) => r.arrival),
          rows.map((r) => r.departure),
          rows.map((r) => r.checkinAt),
          rows.map((r) => r.checkoutAt),
          folioIds,
        ],
      );
      await tx.query(
        `INSERT INTO registration (id, organization_id, property_id, reservation_id, status, kind, required_count,
           actual_checkin_at, actual_checkout_at, stay_ended_at, created_at, updated_at)
         SELECT u.id, $1, $2, u.res, u.status, 'vn_citizen_stay', 1, u.checkin, u.checkout, u.ended, $3, $3
           FROM unnest($4::uuid[], $5::uuid[], $6::text[], $7::timestamptz[], $8::timestamptz[],
                       $9::timestamptz[]) AS u(id, res, status, checkin, checkout, ended)`,
        [
          t.organizationId,
          t.propertyIds[0],
          T0,
          regIds,
          resIds,
          rows.map((r) => r.regStatus),
          rows.map((r) => r.checkinAt),
          rows.map((r) => r.regCheckoutAt),
          rows.map((r) => r.stayEndedAt),
        ],
      );
    });
  }

  /** listRegistrations, every page (limit 100) – the way the desk / E2E `regRow` reads it. */
  async function listAll(view: 'action_needed' | 'needs_update'): Promise<Row[]> {
    await touchSessions(db, t, fa.clock.now());
    const out: Row[] = [];
    let cursor: string | null = null;
    for (let page = 0; page < 30; page++) {
      const q = `view=${view}&limit=100${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`;
      const res = await staff(fa, tok('fd'), device, 'GET', `${P(t)}/registrations?${q}`);
      expect(res.statusCode, res.body).toBe(200);
      const body = res.json() as { data: Row[]; page: { nextCursor: string | null } };
      out.push(...body.data);
      cursor = body.page.nextCursor;
      if (!cursor) break;
    }
    return out;
  }

  async function attention() {
    // The Clock moves hours ahead: keep the test sessions alive (idle timeout).
    await touchSessions(db, t, fa.clock.now());
    const res = await staff(fa, tok('fd'), device, 'GET', `${P(t)}/attention`);
    expect(res.statusCode, res.body).toBe(200);
    return res.json().data as Array<{
      kind: string;
      severity: string;
      count?: number;
      reservationIds?: string[];
      refCode?: string;
    }>;
  }

  beforeAll(async () => {
    db = appDatabase(10);
    t = await createTenant(db, { users: { fd: ['front_desk'] } });
    ids = await seedBooking(db, t);
    device = await t.deviceToken(0);
    fa = await startFeatureApp(db);
    await seedOldOpenRecords();
    // The new guest: checked in today 09:00 local through the front-desk port (K1 record created now – the
    // newest registration id), VN deadline 23:00 tonight.
    const s = await seedStay(db, t, ids, {
      adults: 1,
      arrival: '2026-10-15',
      departure: '2026-10-17',
      bookerName: 'Phạm Thị Lan',
    });
    await setStayStatus(db, t, s.reservationId, 'in_house', { actualCheckinAt: T0 });
    await db.withContext(t.ctx(), (tx) =>
      fa.app.get(RegistrationPortService).onCheckedIn(tx, s.reservationId, T0),
    );
    const reg = await db.withContext(t.ctx(), (tx) =>
      tx.query<{ id: string }>('SELECT id FROM registration WHERE reservation_id = $1', [
        s.reservationId,
      ]),
    );
    fresh = { ...s, registrationId: reg.rows[0]!.id };
  }, 120_000);

  // A failed Clock test must not leave the app in the future for the next one.
  afterEach(() => fa?.clock.set(T0));
  afterAll(async () => {
    await fa?.close();
    await db?.close();
  });

  it('precondition: more than 1,000 open records older than the new guest (the QA stack mix)', async () => {
    const { rows } = await db.withContext(t.ctx(), (tx) =>
      tx.query<{ open: number; older: number }>(
        `SELECT count(*)::int AS open, count(*) FILTER (WHERE id < $1::uuid)::int AS older
           FROM registration WHERE status IN ('none', 'pre', 'partial', 'review', 'scanned', 'sent')`,
        [fresh.registrationId],
      ),
    );
    expect(rows[0]).toEqual({ open: OLD_TOTAL + 1, older: OLD_TOTAL });
    expect(OLD_TOTAL).toBeGreaterThan(1000);
  });

  it('TC-L3-004/044: "Cần khai báo" lists the guest checked in today – every in-house record, nothing ended, arrival order, no duplicate across pages', async () => {
    const rows = await listAll('action_needed');
    const mine = rows.find((r) => r.reservationId === fresh.reservationId);
    expect(mine).toMatchObject({
      status: 'none',
      arrivalDate: '2026-10-15',
      deadlineAt: '2026-10-15T21:00:00.000+07:00',
      deadlineLabel: 'before_deadline_today',
      isOverdue: false,
    });
    // 719 in house + the confirmed one never marked + the new guest; checked out / cancelled left out.
    expect(rows).toHaveLength(OLD_IN_HOUSE + 2);
    expect(new Set(rows.map((r) => r.reservationId)).size).toBe(rows.length);
    expect(rows.filter((r) => oldIds.inHouse.has(r.reservationId))).toHaveLength(OLD_IN_HOUSE);
    expect(rows.map((r) => r.reservationId)).toContain(oldIds.confirmed);
    expect(rows.some((r) => oldIds.ended.has(r.reservationId))).toBe(false);
    const arrivals = rows.map((r) => r.arrivalDate ?? '');
    expect(arrivals).toEqual([...arrivals].sort());
    expect(rows.at(-1)?.reservationId).toBe(fresh.reservationId);
  });

  it('TC-L3-046: "Cần chú ý" due → overdue and the J5 reminder reach the guest checked in today', async () => {
    fa.clock.set(T0);
    const due = (await attention()).find((i) => i.kind === 'registration_due');
    expect(due?.reservationIds).toContain(fresh.reservationId);
    // Deadline in force (DS-E parameters): 21:00 local (14:00Z). J5 at 19:01 local, 119 min before: one
    // reminder for the new declaration (the old in-house ones are past their deadline).
    const job = fa.app.get(JobRegistry).get('registration.deadline');
    fa.clock.set(new Date('2026-10-15T12:01:00.000Z'));
    const stats = (await db.withContext(t.ctx(), (tx) =>
      job!.handler(tx, {
        now: fa.clock.now(),
        organizationId: t.organizationId,
        propertyId: t.propertyIds[0]!,
        timezone: 'Asia/Ho_Chi_Minh',
        date: '2026-10-15',
        slot: 'tick',
      }),
    )) as Record<string, number>;
    expect(stats.reminders).toBe(1);
    const notes = await db.withContext(t.ctx(), (tx) =>
      tx.query<{ n: number }>(
        `SELECT count(*)::int AS n FROM staff_notification
          WHERE kind = 'registration_due' AND ref_type = 'registration' AND ref_id = $1`,
        [fresh.registrationId],
      ),
    );
    expect(notes.rows[0]?.n).toBeGreaterThan(0);
    // 21:01 local: overdue (critical) – the new guest and every old in-house declaration past its deadline.
    fa.clock.set(new Date('2026-10-15T14:01:00.000Z'));
    const items = await attention();
    const over = items.find((i) => i.kind === 'registration_overdue' && i.severity === 'critical');
    expect(over?.reservationIds).toContain(fresh.reservationId);
    expect(over?.count).toBe(OLD_IN_HOUSE + 1);
    const open = await db.withContext(t.ctx(), (tx) =>
      fa.app.get(RegistrationService).openDeclarations(tx),
    );
    expect(open.map((o) => o.stay.reservationId)).toContain(fresh.reservationId);
    fa.clock.set(T0);
  });

  it('S4-36 (ARC-BE-S3-30): listRegistrations reads in batches – the queries per call do not grow with the page size or the rows (no N+1)', async () => {
    const regs = fa.app.get(RegistrationService);
    /** Statements the service sends for one list call (its own transaction excluded). */
    const queriesOf = async (view: 'action_needed' | 'needs_update', limit: number) => {
      let n = 0;
      await db.withContext(
        t.ctx(),
        (tx) =>
          regs.list(
            {
              ...tx,
              query: ((text: string, params?: readonly unknown[]) => {
                n++;
                return tx.query(text, params);
              }) as Tx['query'],
            },
            view,
            null,
            limit,
          ),
        { readOnly: true },
      );
      return n;
    };
    const one = await queriesOf('action_needed', 1);
    const hundred = await queriesOf('action_needed', 100);

    // End to end (auth + list) – statements on the pool and wall time of the first page the desk opens.
    const pool = db.pool as unknown as { connect: () => Promise<PoolClient> };
    const connect = pool.connect.bind(pool);
    let statements = 0;
    const spy = vi.spyOn(pool, 'connect').mockImplementation(async () => {
      const client = await connect();
      return new Proxy(client, {
        get(target, prop) {
          const v = Reflect.get(target, prop, target) as unknown;
          if (prop === 'query') {
            return (...args: unknown[]) => {
              statements++;
              return (v as (...a: unknown[]) => unknown).apply(target, args);
            };
          }
          return typeof v === 'function' ? (v as (...a: unknown[]) => unknown).bind(target) : v;
        },
      });
    });
    const times: number[] = [];
    let perCall = 0;
    try {
      await touchSessions(db, t, fa.clock.now());
      const url = `${P(t)}/registrations?view=action_needed&limit=50`;
      for (let i = 0; i < 40; i++) {
        statements = 0;
        const start = performance.now();
        const res = await staff(fa, tok('fd'), device, 'GET', url);
        times.push(performance.now() - start);
        expect(res.statusCode).toBe(200);
        perCall = statements;
      }
    } finally {
      spy.mockRestore();
    }
    times.sort((a, b) => a - b);
    const p = (q: number) => times[Math.min(times.length - 1, Math.ceil(q * times.length) - 1)]!;
    // Measurement for the S4-36 report: BEC_PERF=<file> appends the numbers (nothing printed otherwise).
    if (process.env.BEC_PERF) {
      appendFileSync(
        process.env.BEC_PERF,
        `S4-36 open=${OLD_TOTAL + 1} serviceQueries(limit1/100)=${one}/${hundred} ` +
          `httpStatements=${perCall} p50=${p(0.5).toFixed(1)}ms p95=${p(0.95).toFixed(1)}ms ` +
          `max=${times.at(-1)!.toFixed(1)}ms\n`,
      );
    }
    // Candidates of action_needed (not checked out per the record): in house, checked out without the hook,
    // cancelled, the confirmed one, the new guest. Per call: property time zone + 3 parameters + per page of
    // SCAN_PAGE (500) one registration read and one stay-view read. One read per row would be hundreds.
    const candidates = OLD_IN_HOUSE + OLD_CHECKED_OUT_NO_HOOK + OLD_CANCELLED + 2;
    expect(hundred).toBe(one);
    expect(hundred).toBeLessThanOrEqual(6 + 2 * Math.ceil(candidates / 500));
    expect(perCall).toBeLessThanOrEqual(hundred + 12);
    // Wall time is measured (BEC_PERF), not asserted: it depends on the machine and the parallel suite.
  });

  it('needs_update: the newest record is listed behind 1,214 others', async () => {
    await db.withContext(t.ctx(), (tx) =>
      tx.query(
        `UPDATE registration SET status = 'needs_update', needs_update_reason = 'departure'
          WHERE status <> 'void'`,
      ),
    );
    const rows = await listAll('needs_update');
    expect(rows).toHaveLength(OLD_TOTAL + 1);
    expect(new Set(rows.map((r) => r.reservationId)).size).toBe(rows.length);
    expect(rows.map((r) => r.reservationId)).toContain(fresh.reservationId);
  });

  it('housekeeping sweep: a new high / overdue work order is in "Cần chú ý" behind 520 older open ones', async () => {
    const room = ids.rooms['202']!;
    const old = Array.from({ length: 520 }, () => uuidv7());
    await db.withContext(t.ctx(), async (tx) => {
      await tx.query(
        `INSERT INTO work_order (id, organization_id, property_id, code, room_id, title, description, category,
           severity, status, source, created_at, updated_at)
         SELECT u.id, $1, $2, 'WO-OLD-' || lpad(u.n::text, 4, '0'), $3, 'Old low', 'Old low work order',
                'other', 'low', 'new', 'front_desk', $4::timestamptz + u.n * interval '1 minute',
                $4::timestamptz + u.n * interval '1 minute'
           FROM unnest($5::uuid[]) WITH ORDINALITY AS u(id, n)`,
        [t.organizationId, t.propertyIds[0], room, new Date('2026-09-01T02:00:00.000Z'), old],
      );
      await tx.query(
        `INSERT INTO work_order (id, organization_id, property_id, code, room_id, title, description, category,
           severity, status, source, resolve_due_at, created_at, updated_at)
         VALUES ($1, $3, $4, 'WO-NEW-HIGH', $5, 'No hot water', 'No hot water', 'hot_water', 'high', 'new',
                 'front_desk', NULL, $6, $6),
                ($2, $3, $4, 'WO-NEW-LATE', $5, 'Drain slow', 'Drain slow', 'drain', 'medium', 'in_progress',
                 'front_desk', $7, $6, $6)`,
        [
          uuidv7(),
          uuidv7(),
          t.organizationId,
          t.propertyIds[0],
          room,
          new Date('2026-10-15T01:00:00.000Z'),
          new Date('2026-10-15T01:30:00.000Z'),
        ],
      );
    });
    fa.clock.set(T0);
    const items = await attention();
    expect(items.filter((i) => i.kind === 'work_order_high_open').map((i) => i.refCode)).toEqual([
      'WO-NEW-HIGH',
    ]);
    expect(items.filter((i) => i.kind === 'work_order_overdue').map((i) => i.refCode)).toEqual([
      'WO-NEW-LATE',
    ]);
  });
});
