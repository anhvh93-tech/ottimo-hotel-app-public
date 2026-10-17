/**
 * BE-D Sprint 4 on the real PostgreSQL through the HTTP surface: EP01 Tổng quan / Hôm nay.
 * - getTonightKpi (US-010 AC1–AC3, US-019 AC2, US-003 AC4): 6/9 = 66,7 %, OOO active vs planned, hold-only,
 *   OTA conflict night unassigned (S1c), business date 01:30 = the previous night;
 * - getArrivalsDepartures (US-011 AC1–AC3, US-031 / S4-31): lists, order, allowedActions, date window,
 *   BR-425 states and "căn có khách đến" first, B18 post-midnight window;
 * - "Cần chú ý" (US-012): role filter (AC6), vip_arrival (AC7), foc_threshold (AC8, OWN only), no-show call with
 *   ETA (US-136 AC1), ota_no_show_report report/revoke + no_show_marked/restored (US-136 AC2/AC4),
 *   closed_reservation_credit (S4-06) shown and never closed by hand, resolveAttentionEvent rules;
 * - J2 hold.remind (US-085 AC2) exactly once per deadline;
 * - SSE through the real LISTEN connection: HK does not receive reservation hints, FD does.
 * Ports of BE-C zones in the check-in are fakes (as in frontdesk.test.ts). Fake clock, FAKE data only.
 */
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database, Tx } from '../../src/db/database';
import { JobRunner } from '../../src/jobs/job-runner';
import { SseHub } from '../../src/modules/events/internal/sse-hub';
import { EventsService, publishSse } from '../../src/modules/events/public/events.service';
import { FrontdeskPorts } from '../../src/modules/frontdesk/internal/stay-support';
import type {
  CheckinDocumentStatus,
  FrontdeskGuestAccessPort,
  FrontdeskMinibarPort,
  FrontdeskRegistrationPort,
} from '../../src/modules/frontdesk/public/ports';
import { HOLD_REMIND_JOB_KEY } from '../../src/modules/reporting/public/hold-reminder-job';
import { ReservationsService } from '../../src/modules/reservations/internal/reservations.service';
import {
  Client,
  type FeatureApp,
  P,
  TEST_PASSWORD,
  setPassword,
  startFeatureApp,
} from '../helpers/feature-app';
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

const ROLES = {
  own: ['owner'],
  mgr: ['manager'],
  fdl: ['front_desk_lead'],
  fd: ['front_desk'],
  hk: ['housekeeping'],
  mt: ['maintenance'],
  sal: ['sales_staff'],
};

interface Booking {
  id: string;
  code: string;
  version: number;
  folioId: string;
}

describe.skipIf(!HAS_DB)(
  'EP01 Tổng quan / Hôm nay + "Cần chú ý" + SSE roles (BE-D Sprint 4)',
  () => {
    let db: Database;
    let fa: FeatureApp;
    let t: TestTenant;
    let ids: BookingIds;
    let guest: string;
    let vip: string;
    const c: Record<string, Client> = {};
    const b: Record<string, Booking> = {};

    beforeAll(async () => {
      db = appDatabase(10);
      t = await createTenant(db, { users: ROLES });
      ids = await seedBooking(db, t);
      guest = await seedGuestRow(db, t, { name: 'Khách Thử Một' });
      vip = await seedGuestRow(db, t, { name: 'Khách Quen Thử' });
      await db.withContext(t.ctx(), (tx) =>
        tx.query(`UPDATE guest SET tags = ARRAY['Khách quen'] WHERE id = $1`, [vip]),
      );
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
      for (const u of Object.keys(ROLES)) c[u] = Client.of(fa, t, u);
      for (const u of ['fd', 'fdl', 'mgr', 'own']) c[u]!.deviceToken = await t.deviceToken();
      for (const u of ['fdl', 'mgr', 'own']) await setPassword(db, t, u);
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
    const book = async (room: string, over: Record<string, unknown> = {}, who = 'fd') => {
      const res = await c[who]!.send('POST', url('/reservations'), {
        roomId: ids.rooms[room],
        channelId: ids.channels.direct,
        directSource: 'zalo_phone',
        arrivalDate: '2026-10-15',
        departureDate: '2026-10-17',
        adults: 2,
        bookerGuestId: guest,
        paymentModel: 'direct',
        initialPayment: { type: 'deposit', method: 'cash', amountVnd: 1_600_000 },
        ...over,
      });
      expect(res.statusCode, res.body).toBe(201);
      return res.json() as Booking;
    };
    const ota = async (room: string, over: Record<string, unknown> = {}) => {
      const res = await c.fd!.send('POST', url('/reservations'), {
        roomId: ids.rooms[room],
        channelId: ids.channels.agoda,
        arrivalDate: '2026-10-15',
        departureDate: '2026-10-16',
        adults: 2,
        bookerGuestId: guest,
        paymentModel: 'ota_prepaid',
        otaRef: `AG${randomUUID().slice(0, 8)}`,
        otaRoomAmountVnd: 1_000_000,
        ...over,
      });
      expect(res.statusCode, res.body).toBe(201);
      return res.json() as Booking;
    };
    const act = (id: string, verb: string, version: number, body: unknown, who = 'fd') =>
      c[who]!.send('POST', url(`/reservations/${id}/actions/${verb}`), body, {
        'if-match': `"${version}"`,
      });
    /** Settle what the folio still owes (BR-402 "đã thu đủ" before B9). */
    const payAll = async (bk: Booking) => {
      const due = (await c.fd!.get(url(`/reservations/${bk.id}`))).json().balanceDueVnd as number;
      if (due > 0) {
        const r = await c.fd!.send('POST', url(`/folios/${bk.folioId}/payments`), {
          type: 'charge',
          method: 'cash',
          amountVnd: due,
        });
        expect([200, 201], r.body).toContain(r.statusCode);
      }
    };
    const version = async (id: string) =>
      (await c.fd!.get(url(`/reservations/${id}`))).json().version as number;
    const kpi = async (who = 'fd') => {
      const res = await c[who]!.get(url('/dashboard/tonight'));
      expect(res.statusCode, res.body).toBe(200);
      return res.json();
    };
    const lists = async (who = 'fd', date?: string) => {
      const res = await c[who]!.get(url(`/arrivals-departures${date ? `?date=${date}` : ''}`));
      expect(res.statusCode, res.body).toBe(200);
      return res.json();
    };
    const attention = async (who = 'fd') => {
      const res = await c[who]!.get(url('/attention'));
      expect(res.statusCode, res.body).toBe(200);
      return res.json().data as Array<Record<string, unknown>>;
    };
    const property = () => ({
      propertyId: t.propertyIds[0]!,
      organizationId: t.organizationId,
      timezone: 'Asia/Ho_Chi_Minh',
    });

    it('setup 14/10 09:00: a hold for 15→16 in 301 (taken yesterday – BR-302 refuses a hold for today)', async () => {
      // Expires 09:00 on 15/10; J1 is not run here, so it is still `hold` tonight → the hold-only room.
      await at('2026-10-14T09:00:00+07:00');
      const svc = fa.app.get(ReservationsService);
      const hold = await db.withContext(
        { ...t.ctx(), userId: t.users.sal!.id, actorType: 'user' },
        async (tx) => {
          const ctx = await svc.context(tx, { userId: t.users.sal!.id, roles: ['sales_staff'] });
          return svc.createHold(tx, ctx, {
            roomId: ids.rooms['301']!,
            channelId: ids.channels.direct!,
            arrivalDate: '2026-10-15',
            departureDate: '2026-10-16',
            adults: 2,
            children6to11: 0,
            childrenUnder6: 0,
            bookerGuestId: guest,
            holdHours: 24,
          });
        },
      );
      b.hold = { id: hold.id, code: hold.code, version: 1, folioId: hold.folio_id as string };
      expect(hold.hold_expires_at).toEqual(new Date('2026-10-15T09:00:00+07:00'));
    });

    it('J2 hold.remind (US-085 AC2): reminds the creator once per deadline, not before the 2 h mark', async () => {
      const runner = fa.app.get(JobRunner);
      await at('2026-10-15T06:59:00+07:00');
      expect((await runner.runOnce(HOLD_REMIND_JOB_KEY, property())).stats).toEqual({
        reminded: 0,
      });
      await at('2026-10-15T07:00:00+07:00');
      expect((await runner.runOnce(HOLD_REMIND_JOB_KEY, property())).stats).toEqual({
        reminded: 1,
      });
      await at('2026-10-15T07:05:00+07:00');
      expect((await runner.runOnce(HOLD_REMIND_JOB_KEY, property())).stats).toEqual({
        reminded: 0,
      });
      const inbox = (await c.sal!.get('/v1/me/notifications')).json();
      expect(inbox.data.filter((n: { kind: string }) => n.kind === 'hold_expiring')).toEqual([
        expect.objectContaining({
          refType: 'reservation',
          refId: b.hold!.id,
          refCode: b.hold!.code,
        }),
      ]);
      // "Cần chú ý" carries the time left (dueAt = the deadline).
      const items = await attention();
      expect(items).toContainEqual(
        expect.objectContaining({
          kind: 'hold_expiring',
          dueAt: '2026-10-15T09:00:00.000+07:00',
          reservationIds: [b.hold!.id],
        }),
      );
    });

    it('setup 15/10 09:00: 6 bookings tonight, OOO 401 active, OOO 402 planned, hold-only 301', async () => {
      await at('2026-10-15T09:00:00+07:00');
      for (const room of ['101', '102', '103', '201', '202']) b[room] = await book(room);
      b['203'] = await book('203', { bookerGuestId: vip });
      const blk = await c.fd!.send('POST', url('/room-blocks'), {
        roomId: ids.rooms['401'],
        startDate: '2026-10-15',
        endDatePlanned: '2026-10-17',
        reason: 'Hỏng bình nóng lạnh',
      });
      expect(blk.statusCode, blk.body).toBe(201);
      expect(blk.json().status).toBe('active');
      const planned = await c.fd!.send('POST', url('/room-blocks'), {
        roomId: ids.rooms['402'],
        startDate: '2026-10-16',
        endDatePlanned: '2026-10-18',
        reason: 'Sơn lại',
      });
      expect(planned.json().status).toBe('planned');
    });

    it('US-010 AC1 + US-019 AC2: 6 sold / (10 − 1 OOO) = 66,7 %, hold apart, planned OOO not deducted; FD sees no money (US-003 AC4)', async () => {
      await at('2026-10-15T15:00:00+07:00');
      await payAll(b['203']!);
      const ci = await act(b['203']!.id, 'check-in', await version(b['203']!.id), {
        cardsIssued: 1,
        houseRulesSent: true,
      });
      expect(ci.statusCode, ci.body).toBe(200);
      const k = await kpi('fd');
      expect(k).toMatchObject({
        businessDate: '2026-10-15',
        roomsTotal: 10,
        roomsSellable: 10,
        oooRooms: 1,
        availableRoomsNet: 9,
        occupiedRooms: 6,
        holdOnlyRooms: 1,
        occupancyPct: 66.7,
        arrivals: 6,
        arrivalsCheckedIn: 1,
        departures: 0,
        departuresCheckedOut: 0,
        inHouse: 1,
        unassignedConflictReservations: 0,
        metricRefs: {
          availableRoomsNet: 'K-01',
          occupiedRooms: 'K-02',
          occupancyPct: 'K-03',
          unassignedConflictReservations: 'S1c',
        },
      });
      expect(Object.keys(k).filter((key) => /vnd|revenue|adr|revpar/i.test(key))).toEqual([]);
      expect(await kpi('own')).toEqual(k);
    });

    it('US-011 AC1/AC2: arrivals confirmed + in house, holds apart, order and actions; date window ±7', async () => {
      const l = await lists('fd');
      expect(l.date).toBe('2026-10-15');
      expect(l.arrivals).toHaveLength(6);
      expect(l.arrivals.map((a: { status: string }) => a.status)).toEqual([
        'confirmed',
        'confirmed',
        'confirmed',
        'confirmed',
        'confirmed',
        'in_house',
      ]);
      const confirmed = l.arrivals[0];
      expect(confirmed).toMatchObject({
        stayType: 'short',
        nights: 2,
        channelCode: 'direct',
        conflictState: 'none',
        guestDisplayName: 'Khách Thử Một',
        allowedActions: [
          { event: 'check_in', transition: 'B9', action: 'check-in', requiresTrustedDevice: true },
        ],
      });
      expect(typeof confirmed.balanceDueVnd).toBe('number');
      expect(confirmed.registrationStatus).toBeDefined();
      const inHouse = l.arrivals[5];
      expect(inHouse).toMatchObject({ id: b['203']!.id, roomNo: '203', allowedActions: [] });
      expect(l.holdsArrivingToday).toEqual([
        expect.objectContaining({
          id: b.hold!.id,
          status: 'hold',
          holdExpiresAt: '2026-10-15T09:00:00.000+07:00',
        }),
      ]);
      expect(l.departures).toEqual([]);
      // Another date: rows only, no buttons (EP01 2.4).
      const later = await lists('fd', '2026-10-17');
      expect(later.departures.map((d: { id: string }) => d.id)).toEqual([b['203']!.id]);
      expect(later.departures[0]).toMatchObject({
        reminderState: 'reminded_waiting',
        allowedActions: [],
      });
      for (const [date, code] of [
        ['2026-10-23', 'VALUE_OUT_OF_RANGE'],
        ['2026-10-07', 'VALUE_OUT_OF_RANGE'],
        ['2026-02-30', 'DATE_INVALID'],
        ['15-10-2026', 'DATE_INVALID'],
      ] as const) {
        const res = await c.fd!.get(url(`/arrivals-departures?date=${date}`));
        expect(res.statusCode, date).toBe(422);
        expect(res.json().errors).toEqual([{ field: 'date', code }]);
      }
      expect((await c.fd!.get(url('/arrivals-departures?date=2026-10-22'))).statusCode).toBe(200);
      expect((await c.fd!.get(url('/arrivals-departures?date=2026-10-08'))).statusCode).toBe(200);
    });

    it('US-012 AC7 vip_arrival: one line per booking for a "Khách quen" arriving – no name in params', async () => {
      // 203 (vip booker) is in house already → no line; a second vip booking arriving today → one line.
      b['302'] = await book('302', { bookerGuestId: vip, departureDate: '2026-10-16' });
      const items = await attention('fd');
      const vipLines = items.filter((i) => i.kind === 'vip_arrival');
      expect(vipLines).toEqual([
        expect.objectContaining({
          source: 'computed',
          severity: 'info',
          refCode: b['302']!.code,
          roomNos: ['302'],
          reservationIds: [b['302']!.id],
        }),
      ]);
      expect(vipLines[0]!.params).toBeUndefined();
    });

    it('OTA bookings for the no-show cases (402 tonight, 301 tomorrow night)', async () => {
      await at('2026-10-15T15:05:00+07:00');
      b.otaA = await ota('402', { departureDate: '2026-10-16' });
      b.otaB = await ota('301', { arrivalDate: '2026-10-16', departureDate: '2026-10-17' });
    });

    it('US-136 AC1: no-show call from 18:00 – a guest with an ETA still ahead is left out', async () => {
      await at('2026-10-15T17:59:00+07:00');
      expect((await attention()).some((i) => i.kind === 'no_show_call')).toBe(false);
      await q(`UPDATE reservation SET eta_time = '20:00' WHERE id = $1`, [b['101']!.id]);
      await at('2026-10-15T18:00:00+07:00');
      const call = (await attention()).find((i) => i.kind === 'no_show_call')!;
      expect(call).toMatchObject({ severity: 'warning', params: { time: '18:00' } });
      expect(call.reservationIds).not.toContain(b['101']!.id);
      expect(call.count).toBe(6); // 102, 103, 201, 202, 302, 402 (101 has ETA 20:00; 203 is in)
      await at('2026-10-15T20:01:00+07:00');
      const later = (await attention()).find((i) => i.kind === 'no_show_call')!;
      expect(later.reservationIds).toContain(b['101']!.id);
      expect(later.count).toBe(7);
    });

    it('US-012 AC8 foc_threshold: OWN only – FOC > 3 % of month room revenue, approver above the count', async () => {
      await at('2026-10-15T20:30:00+07:00');
      const folio = (await c.fd!.get(url(`/folios/${b['102']!.folioId}`))).json();
      const roomLine = folio.lines.find(
        (l: { category: string; serviceDate?: string }) =>
          l.category === 'room' && l.serviceDate === '2026-10-15',
      );
      const own = await c.own!.send(
        'POST',
        url(`/folios/${b['102']!.folioId}/lines/${roomLine.id}/foc`),
        {
          kind: 'foc',
          amountVnd: 500_000,
          reasonCode: 'service_recovery',
        },
      );
      expect(own.statusCode, own.body).toBe(201);
      expect(own.json().status).toBe('approved');
      // Count threshold 0 from 02/10 → the owner's self-applied FOC is one approval above it.
      await setParam(db, t, 'foc_alert_count_per_approver', 0, '2026-10-02');
      const lines = (await attention('own')).filter((i) => i.kind === 'foc_threshold');
      expect(lines).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            severity: 'warning',
            params: expect.objectContaining({ check: 'foc_pct_of_room_revenue', threshold: 3 }),
          }),
          expect.objectContaining({
            params: { check: 'foc_count_per_approver', count: 1, max: 0 },
            link: expect.stringContaining(`approverId=${t.users.own!.id}`),
          }),
        ]),
      );
      const pct = lines.find(
        (l) => (l.params as Record<string, unknown>).check === 'foc_pct_of_room_revenue',
      )!;
      expect((pct.params as Record<string, number>).pct).toBeGreaterThan(3);
      for (const who of ['mgr', 'fdl', 'fd']) {
        expect(
          (await attention(who)).some((i) => i.kind === 'foc_threshold'),
          who,
        ).toBe(false);
      }
    });

    it('20:40: 101 checks in (ETA guest); a guest will arrive in 203 on 17/10', async () => {
      await at('2026-10-15T20:40:00+07:00');
      await payAll(b['101']!);
      const ci = await act(b['101']!.id, 'check-in', await version(b['101']!.id), {
        cardsIssued: 1,
        houseRulesSent: true,
      });
      expect(ci.statusCode, ci.body).toBe(200);
      b.next203 = await book('203', { arrivalDate: '2026-10-17', departureDate: '2026-10-19' });
    });

    it('US-136 AC2/AC4: OTA no-show → "Báo no-show trên kênh" (FD+) + no_show_marked (OWN, MGR); restore after the report → revoke', async () => {
      await at('2026-10-15T23:30:00+07:00');
      const ns = await act(b.otaA!.id, 'mark-no-show', await version(b.otaA!.id), {
        contactAttemptNote: 'Không liên lạc được',
      });
      expect(ns.statusCode, ns.body).toBe(200);
      for (const who of ['own', 'mgr']) {
        const inbox = (await c[who]!.get('/v1/me/notifications')).json().data;
        expect(inbox, who).toContainEqual(
          expect.objectContaining({
            kind: 'no_show_marked',
            refId: b.otaA!.id,
            refCode: b.otaA!.code,
          }),
        );
      }
      expect(
        (await c.fd!.get('/v1/me/notifications'))
          .json()
          .data.some((n: { kind: string }) => n.kind === 'no_show_marked'),
      ).toBe(false);
      const report = (await attention('fd')).find((i) => i.kind === 'ota_no_show_report')!;
      expect(report).toMatchObject({
        source: 'event',
        severity: 'warning',
        refCode: b.otaA!.code,
        reservationIds: [b.otaA!.id],
        params: { action: 'report' },
      });
      expect(typeof report.params).toBe('object');
      expect(String((report.params as Record<string, unknown>).channel)).toMatch(/^[a-z_]+$/);
      // The desk reports on the extranet, then closes the line (who/when kept).
      await at('2026-10-15T23:40:00+07:00');
      const done = await c.fd!.send(
        'POST',
        url(`/attention-events/${report.eventId}/actions/resolve`),
        { note: 'Đã báo trên extranet' },
      );
      expect(done.statusCode, done.body).toBe(204);
      expect((await attention('fd')).some((i) => i.kind === 'ota_no_show_report')).toBe(false);
      const again = await c.fd!.send(
        'POST',
        url(`/attention-events/${report.eventId}/actions/resolve`),
        {},
      );
      expect(again.statusCode).toBe(404);
      const row = (
        await q<{ resolved_by: string; resolution_note: string }>(
          'SELECT resolved_by, resolution_note FROM attention_event WHERE id = $1',
          [report.eventId],
        )
      )[0]!;
      expect(row).toEqual({ resolved_by: t.users.fd!.id, resolution_note: 'Đã báo trên extranet' });
      // 01:30 – still the business day of the arrival night: the manager restores.
      await at('2026-10-16T01:30:00+07:00');
      const mgr = await act(
        b.otaA!.id,
        'restore-no-show',
        ns.json().version,
        { reason: 'Khách tới muộn' },
        'mgr',
      );
      expect(mgr.statusCode, mgr.body).toBe(200);
      const revoke = (await attention('fd')).find((i) => i.kind === 'ota_no_show_report')!;
      expect(revoke).toMatchObject({ params: { action: 'revoke' }, reservationIds: [b.otaA!.id] });
      const ownInbox = (await c.own!.get('/v1/me/notifications')).json().data;
      expect(ownInbox).toContainEqual(
        expect.objectContaining({ kind: 'no_show_restored', refId: b.otaA!.id }),
      );
      // The person who restored is not told about their own action.
      expect(
        (await c.mgr!.get('/v1/me/notifications'))
          .json()
          .data.some((n: { kind: string }) => n.kind === 'no_show_restored'),
      ).toBe(false);
      // Marked again before the channel was told about the restore → the revoke line closes by itself.
      await at('2026-10-16T02:00:00+07:00');
      const ns2 = await act(b.otaA!.id, 'mark-no-show', await version(b.otaA!.id), {
        contactAttemptNote: 'Khách lại không tới',
      });
      expect(ns2.statusCode, ns2.body).toBe(200);
      expect((await attention('fd')).filter((i) => i.kind === 'ota_no_show_report')).toEqual([]);
      const closed = await q<{ resolved_by: string | null; note: string }>(
        `SELECT resolved_by, resolution_note AS note FROM attention_event
        WHERE kind = 'ota_no_show_report' AND ref_id = $1 AND details->>'action' = 'revoke'`,
        [b.otaA!.id],
      );
      expect(closed).toEqual([{ resolved_by: null, note: expect.stringMatching(/^auto:/) }]);
      // Restored again: the channel still has it as no-show (only a person's closure counts) → revoke again.
      await at('2026-10-16T02:05:00+07:00');
      const r2 = await act(
        b.otaA!.id,
        'restore-no-show',
        await version(b.otaA!.id),
        { reason: 'Đến' },
        'mgr',
      );
      expect(r2.statusCode, r2.body).toBe(200);
      const v2 = (await attention('fd')).find((i) => i.kind === 'ota_no_show_report')!;
      expect(v2).toMatchObject({ params: { action: 'revoke' } });
      expect(
        (await c.fd!.send('POST', url(`/attention-events/${v2.eventId}/actions/resolve`), {}))
          .statusCode,
      ).toBe(204);
      const rows = await q<{ action: string; by_person: boolean; open: boolean }>(
        `SELECT details->>'action' AS action, resolved_by IS NOT NULL AS by_person, resolved_at IS NULL AS open
         FROM attention_event WHERE kind = 'ota_no_show_report' AND ref_id = $1 ORDER BY created_at, id`,
        [b.otaA!.id],
      );
      expect(rows).toEqual([
        { action: 'report', by_person: true, open: false },
        { action: 'revoke', by_person: false, open: false },
        { action: 'revoke', by_person: true, open: false },
      ]);
    });

    it('US-010 AC3: at 02:15 on 16/10 "đêm nay" is still the night of 15/10; S1c unassigned night apart', async () => {
      await at('2026-10-16T02:15:00+07:00');
      // A conflict booking for tonight without a room (OTA lane, erd 7): its night is sold, not in occupancy.
      const svcRows = await q<{ id: string }>(
        `UPDATE stay_night SET room_id = NULL WHERE reservation_id = $1 AND stay_date = '2026-10-15'
       RETURNING id`,
        [b.otaA!.id],
      );
      expect(svcRows).toHaveLength(1);
      const k = await kpi('mgr');
      expect(k.businessDate).toBe('2026-10-15');
      expect(k.unassignedConflictReservations).toBe(1);
      // 6 + 302 = 7 assigned sold rooms; 402 (otaA, its night without room now) no longer counts; 401 OOO.
      expect(k).toMatchObject({ occupiedRooms: 7, availableRoomsNet: 9, occupancyPct: 77.8 });
      await q(
        `UPDATE stay_night SET room_id = $2 WHERE reservation_id = $1 AND stay_date = '2026-10-15'`,
        [b.otaA!.id, ids.rooms['402']],
      );
      // US-011 AC3: an arrival of 20/10-style business day at 01:30 is still listed and can be checked in.
      const l = await lists('fd');
      expect(l.date).toBe('2026-10-15');
      const row = l.arrivals.find((a: { id: string }) => a.id === b['102']!.id);
      expect(row.allowedActions).toEqual([
        { event: 'check_in', transition: 'B9', action: 'check-in', requiresTrustedDevice: true },
      ]);
    });

    it('S4-06 closed_reservation_credit shown to FD+ and never closed by hand; DATA checks OWN only; critical needs a note', async () => {
      const events = fa.app.get(EventsService);
      const ctx = { ...t.ctx(), actorType: 'system' as const };
      const now = new Date('2026-10-16T01:40:00+07:00');
      const [credit, dataCheck, partyDocs, security] = await db.withContext(ctx, async (tx) => [
        await events.openAttention(tx, {
          kind: 'closed_reservation_credit',
          severity: 'warning',
          dedupeKey: `credit:${b['101']!.id}`,
          refType: 'reservation',
          refId: b['101']!.id,
          refCode: b['101']!.code,
          now,
        }),
        await events.openAttention(tx, {
          kind: 'data_quality',
          severity: 'warning',
          dedupeKey: 'dq:r_05',
          params: { check: 'r_05_ooo_and_sold' },
          now,
        }),
        await events.openAttention(tx, {
          kind: 'data_quality',
          severity: 'warning',
          dedupeKey: 'dq:party',
          params: { check: 'registration_party_docs_unlinked' },
          now,
        }),
        await events.openAttention(tx, {
          kind: 'security_alert',
          severity: 'critical',
          dedupeKey: 'sec:1',
          params: { code: 'SEC-LOCKOUT' },
          now,
        }),
      ]);
      const fd = await attention('fd');
      expect(fd.map((i) => i.eventId)).toContain(credit);
      expect(fd.map((i) => i.eventId)).toContain(partyDocs);
      expect(fd.map((i) => i.eventId)).not.toContain(dataCheck);
      expect(fd.map((i) => i.eventId)).not.toContain(security);
      const mgr = await attention('mgr');
      expect(mgr.map((i) => i.eventId)).not.toContain(dataCheck);
      const own = await attention('own');
      expect(own.map((i) => i.eventId)).toEqual(
        expect.arrayContaining([credit, dataCheck, security]),
      );
      expect(own[0]).toMatchObject({ severity: 'critical' });
      const resolve = (who: string, id: string, body: unknown = {}) =>
        c[who]!.send('POST', url(`/attention-events/${id}/actions/resolve`), body);
      const byHand = await resolve('fd', credit!);
      expect(byHand.statusCode).toBe(409);
      expect(byHand.json().code).toBe('INVALID_TRANSITION');
      expect((await resolve('fd', dataCheck!)).statusCode).toBe(404);
      expect((await resolve('fd', security!)).statusCode).toBe(404);
      const noNote = await resolve('own', security!);
      expect(noNote.statusCode).toBe(422);
      expect(noNote.json().errors).toEqual([{ field: 'note', code: 'REASON_REQUIRED' }]);
      const card = await resolve('own', security!, { note: 'Thẻ 4111 1111 1111 1111' });
      expect(card.statusCode).toBe(422);
      expect(card.json().code).toBe('CARD_NUMBER_DETECTED');
      expect((await resolve('own', security!, { note: 'Đã kiểm tra, mở khóa' })).statusCode).toBe(
        204,
      );
      expect((await resolve('own', dataCheck!)).statusCode).toBe(204);
      expect((await resolve('fd', partyDocs!)).statusCode).toBe(204);
      expect((await resolve('fd', randomUUID())).statusCode).toBe(404);
      expect((await resolve('fd', 'not-a-uuid')).statusCode).toBe(404);
    });

    it('US-136: restored before anyone reported → the report line is closed by the system, no revoke', async () => {
      await at('2026-10-16T23:30:00+07:00');
      const ns = await act(b.otaB!.id, 'mark-no-show', await version(b.otaB!.id), {
        contactAttemptNote: 'Không liên lạc được',
      });
      expect(ns.statusCode, ns.body).toBe(200);
      expect((await attention('fd')).filter((i) => i.kind === 'ota_no_show_report')).toEqual([
        expect.objectContaining({ params: expect.objectContaining({ action: 'report' }) }),
      ]);
      await at('2026-10-16T23:45:00+07:00');
      const r = await act(
        b.otaB!.id,
        'restore-no-show',
        ns.json().version,
        { reason: 'Khách đến' },
        'mgr',
      );
      expect(r.statusCode, r.body).toBe(200);
      const rows = await q<{ action: string; resolved_by: string | null; open: boolean }>(
        `SELECT details->>'action' AS action, resolved_by, resolved_at IS NULL AS open FROM attention_event
        WHERE kind = 'ota_no_show_report' AND ref_id = $1 ORDER BY created_at, id`,
        [b.otaB!.id],
      );
      expect(rows).toEqual([{ action: 'report', resolved_by: null, open: false }]);
      expect((await attention('fd')).some((i) => i.kind === 'ota_no_show_report')).toBe(false);
    });

    it('S4-31 / US-031: departures of 17/10 – same-day arrival first, BR-425 states, check-out button; B18 window after midnight', async () => {
      // 01:00 on 17/10 = business day 16/10: the 17/10 list already offers check-out (post-midnight window).
      await at('2026-10-17T01:00:00+07:00');
      const night = await lists('fd', '2026-10-17');
      expect(night.departures.map((d: { allowedActions: unknown[] }) => d.allowedActions)).toEqual([
        [{ event: 'check_out', transition: 'B18', action: 'check-out' }],
        [{ event: 'check_out', transition: 'B18', action: 'check-out' }],
      ]);
      const states = async (iso: string) => {
        await at(iso);
        const l = await lists('fd');
        expect(l.date).toBe('2026-10-17');
        return l.departures.map(
          (d: { id: string; reminderState: string; hasArrivalSameRoomToday: boolean }) => [
            d.id === b['203']!.id ? '203' : '101',
            d.reminderState,
            d.hasArrivalSameRoomToday,
          ],
        );
      };
      expect(await states('2026-10-17T10:59:00+07:00')).toEqual([
        ['203', 'reminded_waiting', true],
        ['101', 'reminded_waiting', false],
      ]);
      expect(await states('2026-10-17T11:00:00+07:00')).toEqual([
        ['203', 'call_needed', true],
        ['101', 'call_needed', false],
      ]);
      expect(await states('2026-10-17T12:00:00+07:00')).toEqual([
        ['203', 'overdue', true],
        ['101', 'call_needed', false],
      ]);
      expect(await states('2026-10-17T12:31:00+07:00')).toEqual([
        ['203', 'overdue', true],
        ['101', 'overdue', false],
      ]);
      const l = await lists('mgr');
      expect(l.departures[0].allowedActions).toEqual([
        { event: 'check_out', transition: 'B18', action: 'check-out' },
      ]);
      const k = await kpi('fd');
      expect(k).toMatchObject({
        businessDate: '2026-10-17',
        departures: 2,
        departuresCheckedOut: 0,
      });
    });

    it('SSE by role through the real LISTEN connection: HK gets room status, not booking hints; FD gets both', async () => {
      const hub = fa.app.get(SseHub);
      const got: Record<string, string[]> = { hk: [], fd: [], sal: [] };
      const subs = await Promise.all(
        (['hk', 'fd', 'sal'] as const).map((who) =>
          hub.subscribe({
            propertyId: t.propertyIds[0]!,
            userId: t.users[who]!.id,
            roles: ROLES[who],
            send: (type, data) => {
              got[who]!.push(`${type}:${data.id}`);
              return true;
            },
            close: () => undefined,
          }),
        ),
      );
      try {
        const rsv = b['102']!.id;
        const room = ids.rooms['102']!;
        await db.withContext({ ...t.ctx(), actorType: 'system' }, async (tx) => {
          await publishSse(tx, 'reservation.changed', rsv);
          await publishSse(tx, 'room.status_changed', room);
          await publishSse(tx, 'attention.changed', room);
        });
        const deadline = Date.now() + 5_000;
        while (got.fd!.length < 3 && Date.now() < deadline)
          await new Promise((r) => setTimeout(r, 50));
        expect(got.fd).toEqual([
          `reservation.changed:${rsv}`,
          `room.status_changed:${room}`,
          `attention.changed:${room}`,
        ]);
        expect(got.hk).toEqual([`room.status_changed:${room}`]);
        expect(got.sal).toEqual([]);
      } finally {
        for (const u of subs) u();
      }
    });

    it('no secrets in fixtures: password helper used only for approvers', () => {
      expect(TEST_PASSWORD).toMatch(/^Fake-/);
    });
  },
);
