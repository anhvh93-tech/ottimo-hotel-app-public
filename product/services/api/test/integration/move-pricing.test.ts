/**
 * BE-A Sprint 4 – money of a room move, ONE calculation for the preview and the write (OpenAPI 0.3.7 D1, ARC
 * 10.4) on the real PostgreSQL through HTTP; numbers read from the QA oracle br-examples.json:
 * - S4-07 / BUG-R2-058 (BR-429 v0.3.4): BR-110 fee per night re-priced on B7/B7a by the cause (BR-429-08; (c) OTA
 *   guest_direct fee through two OTTIMO moves; (d) conflict booking priced when assigned).
 * - S4-21 (ESC-019 A, BR-429 v0.3.5/v0.3.6): guest-requested move → the new room's current calendar both ways,
 *   preview = write, "Đã báo khách" + expected amount (BR-429-03…07, 09, 10); OTTIMO keeps the prices.
 * - S4-05 / BUG-R2-057 (BR-424 v0.3.5): B14 OTA difference against the origin room, reversed and re-posted
 *   (BR-424-04: 203 → 401 → 203 → 401 = 250.000, not 750.000).
 * Fake clock and FAKE data only.
 */
import { randomBytes, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
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
import { StayNightPricingPort } from '../../src/modules/reservations/public/stay-night-pricing';
import { sha256Hex } from '../../src/shared/http/auth.guard';
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
};

const ORACLES = JSON.parse(
  readFileSync(join(__dirname, '../../../../tests/fixtures/br-examples.json'), 'utf8'),
) as {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  examples: Array<{ id: string; input: Record<string, any>; expected: Record<string, any> }>;
};
const oracle = (id: string) => {
  const o = ORACLES.examples.find((x) => x.id === id);
  if (!o) throw new Error(`oracle ${id} missing`);
  return o;
};

type Booking = { id: string; code: string; version: number; folioId: string };

describe.skipIf(!HAS_DB)(
  'room move money – one calculation (BE-A Sprint 4: S4-07, S4-21, S4-05)',
  () => {
    let db: Database;
    let fa: FeatureApp;
    let t: TestTenant;
    let ids: BookingIds;
    let guest: string;
    const c: Record<string, Client> = {};

    const device = async () => {
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
            new Date('2027-12-31T00:00:00Z'),
          ],
        ),
      );
      return token;
    };

    beforeAll(async () => {
      db = appDatabase(8);
      t = await createTenant(db, { users: ROLES });
      ids = await seedBooking(db, t);
      guest = await seedGuestRow(db, t, { name: 'Khách Đổi Căn' });
      fa = await startFeatureApp(db, {
        override: (b) =>
          b.overrideProvider(FrontdeskPorts).useFactory({
            factory: (child: FrontdeskChildDataPort) =>
              new FrontdeskPorts(new DocsOk(), new NoGuestAccessPort(), child, new NoMinibarPort()),
            inject: [FD_CHILD_DATA_PORT],
          }),
      });
      for (const u of Object.keys(ROLES)) c[u] = Client.of(fa, t, u);
      c.fd!.deviceToken = await device();
      await setPassword(db, t, 'mgr');
      await setPassword(db, t, 'fdl');
      await at('2026-10-20T10:00:00+07:00');
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
    const get = async (id: string) => (await c.fd!.get(url(`/reservations/${id}`))).json();
    const create = async (body: Record<string, unknown>): Promise<Booking> => {
      let res = await c.fd!.send('POST', url('/reservations'), body);
      if (res.statusCode === 422 && res.json().code === 'DEPOSIT_INSUFFICIENT') {
        res = await c.fd!.send('POST', url('/reservations'), {
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
    const direct = (
      room: string,
      from: string,
      to: string,
      deposit: number,
      more: Record<string, unknown> = {},
    ) =>
      create({
        roomId: ids.rooms[room],
        channelId: ids.channels.direct,
        directSource: 'zalo_phone',
        adults: 2,
        bookerGuestId: guest,
        paymentModel: 'direct',
        arrivalDate: from,
        departureDate: to,
        initialPayment: { type: 'deposit', method: 'cash', amountVnd: deposit },
        ...more,
      });
    const agoda = (room: string, from: string, to: string, amount: number, more = {}) =>
      create({
        roomId: ids.rooms[room],
        channelId: ids.channels.agoda,
        adults: 2,
        bookerGuestId: guest,
        paymentModel: 'ota_prepaid',
        otaRef: `AG${randomUUID().slice(0, 8)}`,
        otaRoomAmountVnd: amount,
        arrivalDate: from,
        departureDate: to,
        ...more,
      });
    const preview = async (id: string, params: Record<string, string>, who = 'fd') => {
      const qs = new URLSearchParams(params).toString();
      return c[who]!.get(url(`/reservations/${id}/move-preview?${qs}`));
    };
    const move = async (id: string, body: Record<string, unknown>, who = 'fd') =>
      c[who]!.send('POST', url(`/reservations/${id}/actions/move`), body, {
        'if-match': `"${(await get(id)).version}"`,
      });
    /** BR-429 (d1) v0.3.8 (DOM-S4-06): any B7/B8 that changes the money is saved with the amount shown. */
    const moveShown = async (id: string, body: Record<string, string>, who = 'fd') => {
      const pv = await preview(id, body, who);
      expect(pv.statusCode, pv.body).toBe(200);
      return move(
        id,
        { ...body, applyDifference: true, expectedDeltaVnd: pv.json().folioDeltaVnd },
        who,
      );
    };
    const patch = async (id: string, body: Record<string, unknown>) =>
      c.fd!.send('PATCH', url(`/reservations/${id}`), body, {
        'if-match': `"${(await get(id)).version}"`,
      });
    const act = async (id: string, verb: string, body: unknown, who = 'fd') =>
      c[who]!.send('POST', url(`/reservations/${id}/actions/${verb}`), body, {
        'if-match': `"${(await get(id)).version}"`,
      });
    /** Live posted lines of a category as [date, amount] (not reversals, not reversed). */
    const lines = (folioId: string, category: string) =>
      q<{ service_date: string; amount_vnd: number }>(
        `SELECT l.service_date::text AS service_date, l.amount_vnd FROM folio_line l
        WHERE l.folio_id = $1 AND l.category = $2 AND l.line_state = 'posted' AND l.reversal_of_id IS NULL
          AND NOT EXISTS (SELECT 1 FROM folio_line r WHERE r.reversal_of_id = l.id)
        ORDER BY l.service_date, l.posted_at`,
        [folioId, category],
      ).then((rows) => rows.map((r) => [r.service_date, Number(r.amount_vnd)]));
    const total = async (folioId: string, category: string) =>
      (await lines(folioId, category)).reduce((a, x) => a + (x[1] as number), 0);
    const totals = async (folioId: string) =>
      (await c.fd!.get(url(`/folios/${folioId}`))).json().totals as {
        totalVnd: number;
        balanceDueVnd: number;
        paidViaOtaVnd?: number;
      };
    const ready = (room: string) =>
      q(
        `INSERT INTO room_status (room_id, organization_id, property_id, status, since) VALUES ($1, $2, $3, 'VC', $4)
       ON CONFLICT (room_id) DO UPDATE SET status = 'VC'`,
        [ids.rooms[room], t.organizationId, t.propertyIds[0], new Date('2026-10-01T00:00:00Z')],
      );
    /** Preview then save with the amount the desk showed – never 409 (critic #10). */
    const previewThenMove = async (id: string, body: Record<string, string>, who = 'fd') => {
      const pv = await preview(id, body);
      expect(pv.statusCode, pv.body).toBe(200);
      const res = await move(
        id,
        { ...body, applyDifference: true, expectedDeltaVnd: pv.json().folioDeltaVnd },
        who,
      );
      expect(res.statusCode, res.body).toBe(200);
      return { preview: pv.json(), row: res.json() };
    };

    // ───────────────────────────── S4-21 – ESC-019 A (B7) ─────────────────────────────

    it('BR-429-03: guest asks 101 → 401 before arrival – preview 3.126.000 (+1.125.000), told + amount required, saved = preview, deposit kept, 2.526.000 due', async () => {
      const o = oracle('BR-429-03');
      const b = await direct(
        '101',
        o.input.arrivalDate,
        o.input.departureDate,
        o.input.depositPaidVnd,
      );
      expect((await get(b.id)).totalRoomVnd).toBe(o.expected.bookedRoomTotalVnd);
      const body = { roomId: ids.rooms['401'] as string, reasonCode: 'guest_request' };
      const pv = await preview(b.id, body);
      expect(pv.statusCode, pv.body).toBe(200);
      expect(pv.json()).toMatchObject({
        pricingBasis: 'new_room_rate',
        roomNo: '401',
        roomTotalOldVnd: o.expected.bookedRoomTotalVnd,
        roomTotalNewVnd: o.expected.newRoomTotalVnd,
        folioDeltaVnd: o.expected.differenceVnd,
        depositPaidVnd: o.expected.depositAfterMoveVnd,
        balanceDueAfterVnd: o.expected.balanceDueAtCheckInVnd,
      });
      expect(pv.json().nights.map((n: { newRateVnd: number }) => n.newRateVnd)).toEqual(
        Object.values(o.expected.newNightRatesVnd),
      );
      // Nothing written by the preview.
      expect((await get(b.id)).totalRoomVnd).toBe(o.expected.bookedRoomTotalVnd);
      // BR-429 (d): "Đã báo khách số tiền mới" + the amount shown are required.
      const untold = await move(b.id, body);
      expect(untold.statusCode).toBe(422);
      expect(untold.json().errors).toContainEqual({ field: 'applyDifference', code: 'REQUIRED' });
      const stale = await move(b.id, {
        ...body,
        applyDifference: true,
        expectedDeltaVnd: o.expected.differenceVnd - 1000,
      });
      expect(stale.statusCode).toBe(409);
      expect(stale.json()).toMatchObject({
        code: 'SURCHARGE_CHANGED',
        surchargeVnd: o.expected.differenceVnd,
      });
      const saved = await move(b.id, {
        ...body,
        applyDifference: true,
        expectedDeltaVnd: pv.json().folioDeltaVnd,
      });
      expect(saved.statusCode, saved.body).toBe(200);
      expect(saved.json()).toMatchObject({
        totalRoomVnd: o.expected.newRoomTotalVnd,
        depositPaidVnd: o.expected.depositAfterMoveVnd,
        roomDisclosedToGuest: true,
      });
      expect(await total(b.folioId, 'room')).toBe(o.expected.newRoomTotalVnd);
      expect((await totals(b.folioId)).balanceDueVnd).toBe(o.expected.balanceDueAtCheckInVnd);
      const audit = await q<{ action: string; reason: string }>(
        `SELECT action, reason FROM audit_event WHERE entity_id = $1 AND action = 'reservation.room_change_repriced'`,
        [b.id],
      );
      expect(audit).toEqual([
        { action: 'reservation.room_change_repriced', reason: 'guest_request' },
      ]);
    });

    it('BR-429-04: guest asks 401 → 101 – 2.001.000 (−1.125.000), deposit 900.000 kept, 1.101.000 due', async () => {
      const o = oracle('BR-429-04');
      // Same weekday nights one week later (rooms of BR-429-03 are taken on 10–13/11).
      const b = await direct('401', '2026-11-17', '2026-11-20', o.input.depositPaidVnd);
      expect((await get(b.id)).totalRoomVnd).toBe(o.expected.bookedRoomTotalVnd);
      const { preview: pv, row } = await previewThenMove(b.id, {
        roomId: ids.rooms['101'] as string,
        reasonCode: 'guest_request',
      });
      expect(pv).toMatchObject({
        folioDeltaVnd: o.expected.differenceVnd,
        depositPaidVnd: o.expected.depositAfterMoveVnd,
        balanceDueAfterVnd: o.expected.balanceDueAtCheckInVnd,
      });
      expect(row.totalRoomVnd).toBe(o.expected.newRoomTotalVnd);
      expect((await totals(b.folioId)).balanceDueVnd).toBe(o.expected.balanceDueAtCheckInVnd);
    });

    it('BR-429-05: 7 nights 202 → 302 – new room calendar then BR-107 −10 % → 6.025.000 (+820.000)', async () => {
      const o = oracle('BR-429-05');
      const b = await direct('202', o.input.arrivalDate, o.input.departureDate, 1_600_000);
      expect((await get(b.id)).totalRoomVnd).toBe(o.input.bookedRoomTotalVnd);
      const { preview: pv, row } = await previewThenMove(b.id, {
        roomId: ids.rooms['302'] as string,
        reasonCode: 'guest_request',
      });
      expect(pv.folioDeltaVnd).toBe(o.expected.differenceVnd);
      expect(pv.losDiscountPct).toBe(10);
      expect(
        Object.fromEntries(
          pv.nights.map((n: { date: string; newRateVnd: number }) => [n.date, n.newRateVnd]),
        ),
      ).toEqual(o.expected.newNightRatesVnd);
      expect(row.totalRoomVnd).toBe(o.expected.newRoomTotalVnd);
      expect(await total(b.folioId, 'room')).toBe(o.expected.newRoomTotalVnd);
    });

    it('BR-429-06: OTTIMO moves 202 → 401 (property_fault) – prices kept 2.376.000, 0 lines re-posted; `other` to a pricier room needs FDL+', async () => {
      const o = oracle('BR-429-06');
      const b = await direct('202', '2026-11-24', '2026-11-27', 800_000);
      const count = async () =>
        Number(
          (
            await q<{ n: string }>(
              'SELECT count(*)::text AS n FROM folio_line WHERE folio_id = $1',
              [b.folioId],
            )
          )[0]!.n,
        );
      const other = await move(b.id, {
        roomId: ids.rooms['401'],
        reasonCode: 'other',
        note: 'Khách quen, xếp căn đẹp',
      });
      expect(other.statusCode).toBe(403);
      const pv = await preview(b.id, {
        roomId: ids.rooms['401'] as string,
        reasonCode: 'property_fault',
      });
      expect(pv.json()).toMatchObject({
        pricingBasis: 'keep_booked_rate',
        folioDeltaVnd: o.expected.differenceVnd,
        roomTotalNewVnd: o.expected.newRoomTotalVnd,
      });
      const before = await count();
      const res = await move(b.id, { roomId: ids.rooms['401'], reasonCode: 'property_fault' });
      expect(res.statusCode, res.body).toBe(200);
      expect(res.json().totalRoomVnd).toBe(o.expected.newRoomTotalVnd);
      expect(await count()).toBe(before + o.expected.roomLinesReposted);
      // FDL+ may move `other` to the pricier room – prices kept as well.
      const back = await move(b.id, { roomId: ids.rooms['202'], reasonCode: 'property_fault' });
      expect(back.statusCode, back.body).toBe(200);
      const fdl = await move(
        b.id,
        { roomId: ids.rooms['401'], reasonCode: 'other', note: 'Khách quen, xếp căn đẹp' },
        'fdl',
      );
      expect(fdl.statusCode, fdl.body).toBe(200);
      expect(fdl.json().totalRoomVnd).toBe(o.expected.newRoomTotalVnd);
    });

    it('BR-429-07: Agoda 203 – guest asks 401 → 302 → 101 before arrival: difference 500.000 → 250.000 → 0, reversed then re-posted; OTA money unchanged', async () => {
      const o = oracle('BR-429-07');
      const rates = o.input.directCurrentRateByRoomVnd as Record<string, number>;
      // Same weekday nights 01–03/12 (other tests hold these rooms on 10–12/11).
      const b = await agoda('203', '2026-12-01', '2026-12-03', 1_640_000);
      const otaBefore = (await totals(b.folioId)).paidViaOtaVnd;
      const seen: number[] = [];
      for (const [i, room] of (o.input.moveSequence as string[]).entries()) {
        const { preview: pv, row } = await previewThenMove(b.id, {
          roomId: ids.rooms[room] as string,
          reasonCode: 'guest_request',
        });
        expect(pv.roomChangeDifferenceVnd).toBe(o.expected.differenceAfterEachMoveVnd[i]);
        expect(pv.folioDeltaVnd).toBe(
          o.expected.differenceAfterEachMoveVnd[i] - o.expected.reversedBeforeEachRepostVnd[i],
        );
        expect(row.totalRoomVnd).toBe(1_640_000); // OTA price kept (BR-429 (c))
        seen.push(await total(b.folioId, 'room_change_difference'));
        const perNight = Math.max(0, (rates[room] as number) - (rates['203'] as number));
        expect(await lines(b.folioId, 'room_change_difference')).toEqual(
          perNight > 0
            ? [
                ['2026-12-01', perNight],
                ['2026-12-02', perNight],
              ]
            : [],
        );
      }
      expect(seen).toEqual(o.expected.differenceAfterEachMoveVnd);
      expect((await totals(b.folioId)).paidViaOtaVnd).toBe(otaBefore);
      const grp = await q<{ revenue_group: string }>(
        `SELECT DISTINCT revenue_group FROM folio_line WHERE folio_id = $1 AND category = 'room_change_difference'`,
        [b.folioId],
      );
      expect(grp).toEqual([{ revenue_group: o.expected.revenueGroup }]);
    });

    it('BR-429-09: an agreed price 600.000 does not travel – 401 calendar 3.126.000, MANUAL_RATE_REPRICED with 937.000 suggested; OTTIMO keeps 1.800.000', async () => {
      const o = oracle('BR-429-09');
      // Same weekday nights 08–11/12 (Tue–Thu) – the rooms of BR-429-03 are taken on 10–13/11.
      const agreed = Object.values(o.input.bookedNightRatesVnd as Record<string, number>);
      const b = await direct('101', '2026-12-08', '2026-12-11', o.input.depositPaidVnd, {
        nightlyRates: ['2026-12-08', '2026-12-09', '2026-12-10'].map((date, i) => ({
          date,
          amountVnd: agreed[i],
        })),
      });
      expect((await get(b.id)).totalRoomVnd).toBe(o.expected.bookedRoomTotalVnd);
      const { preview: pv, row } = await previewThenMove(b.id, {
        roomId: ids.rooms['401'] as string,
        reasonCode: 'guest_request',
      });
      const g = o.expected.guestRequest;
      expect(pv).toMatchObject({
        roomTotalNewVnd: g.newRoomTotalVnd,
        folioDeltaVnd: g.differenceVnd,
        balanceDueAfterVnd: g.balanceDueAtCheckInVnd,
      });
      expect(pv.warnings).toHaveLength(3);
      expect(pv.warnings[0]).toEqual({ code: 'MANUAL_RATE_REPRICED', field: 'nights[0]' });
      expect(pv.nights.map((n: { suggestedRateVnd: number }) => n.suggestedRateVnd)).toEqual([
        o.expected.deskKeepsDeal.nightRateVnd,
        o.expected.deskKeepsDeal.nightRateVnd,
        o.expected.deskKeepsDeal.nightRateVnd,
      ]);
      expect(row.totalRoomVnd).toBe(g.newRoomTotalVnd);
      // OTTIMO's move keeps the agreed price (BR-429 (g) last part).
      const k = await direct('101', '2026-12-15', '2026-12-18', o.input.depositPaidVnd, {
        nightlyRates: ['2026-12-15', '2026-12-16', '2026-12-17'].map((date) => ({
          date,
          amountVnd: 600_000,
        })),
      });
      const kept = await move(k.id, { roomId: ids.rooms['401'], reasonCode: 'property_fault' });
      expect(kept.statusCode, kept.body).toBe(200);
      expect(kept.json().totalRoomVnd).toBe(o.expected.ottimoCause.newRoomTotalVnd);
    });

    it('BR-429-10: a manual long stay is never re-priced by a move – preview external_contract, difference 0', async () => {
      const o = oracle('BR-429-10');
      const res = await c.fd!.send('POST', url('/reservations'), {
        roomId: ids.rooms['202'],
        channelId: ids.channels.direct,
        directSource: 'zalo_phone',
        arrivalDate: '2027-03-01',
        departureDate: '2027-04-01',
        adults: 1,
        bookerGuestId: guest,
        paymentModel: 'direct',
        manualLongStay: { monthlyRentVnd: o.input.monthlyAmountVnd },
      });
      expect(res.statusCode, res.body).toBe(201);
      const b = res.json() as Booking;
      const pv = await preview(b.id, {
        roomId: ids.rooms['302'] as string,
        reasonCode: 'guest_request',
      });
      expect(pv.statusCode, pv.body).toBe(200);
      expect(pv.json()).toMatchObject({ pricingBasis: 'external_contract', folioDeltaVnd: 0 });
      const saved = await move(b.id, { roomId: ids.rooms['302'], reasonCode: 'guest_request' });
      expect(saved.statusCode, saved.body).toBe(200);
      expect(saved.json()).toMatchObject({
        manualLongStay: { monthlyRentVnd: o.expected.monthlyAmountAfterMoveVnd },
        segments: [expect.objectContaining({ roomNo: '302' })],
      });
    });

    // ───────────────────────────── S4-07 – BR-110 fee by the cause (B7/B7a) ─────────────────────────────

    it('BR-429-08: 3 adults, 2 nights – upgrade 202 → 302: 300.000 → 0; guest asks 302 → 202: 0 → 300.000; OTTIMO 302 → 202 (fault): 0 kept, also after the people change', async () => {
      const o = oracle('BR-429-08');
      const runs = [
        { from: '2027-01-05', to: '2027-01-07' },
        { from: '2027-01-12', to: '2027-01-14' },
        { from: '2027-01-19', to: '2027-01-21' },
      ];
      for (const [i, s] of (o.input.scenarios as Array<Record<string, string>>).entries()) {
        const b = await direct(s.fromRoomNo as string, runs[i]!.from, runs[i]!.to, 600_000, {
          adults: o.input.adults,
        });
        expect(await total(b.folioId, 'extra_person')).toBe(
          o.expected.extraPersonTotalBeforeVnd[i],
        );
        const body = {
          roomId: ids.rooms[s.toRoomNo as string] as string,
          reasonCode: s.cause as string,
        };
        const who = s.cause === 'upgrade' ? 'mgr' : 'fd';
        const pv = await preview(b.id, body, who);
        expect(pv.statusCode, pv.body).toBe(200);
        expect(pv.json().extraPersonNewVnd).toBe(o.expected.extraPersonTotalAfterVnd[i]);
        const res =
          s.cause === 'guest_request'
            ? await move(b.id, {
                ...body,
                applyDifference: true,
                expectedDeltaVnd: pv.json().folioDeltaVnd,
              })
            : await moveShown(b.id, body, who);
        expect(res.statusCode, res.body).toBe(200);
        expect(await total(b.folioId, 'extra_person')).toBe(o.expected.extraPersonTotalAfterVnd[i]);
        if (s.cause === 'property_fault') {
          // The protection stays on the nights: 3 → 2 → 3 adults in 202 (standard 2) still 0 (base 3 kept).
          expect((await patch(b.id, { adults: 2 })).statusCode).toBe(200);
          expect((await patch(b.id, { adults: 3 })).statusCode).toBe(200);
          expect(await total(b.folioId, 'extra_person')).toBe(0);
        }
      }
    });

    it('BUG-R2-058 (c): Agoda 101, the guest reports 3 adults (150.000 × 3 at the desk) → OTTIMO moves 101 → 102 → 301 (standard 4): fee 450.000 → 450.000 → 0, folio 2.100.000', async () => {
      const b = await agoda('101', '2027-01-26', '2027-01-29', 2_100_000);
      const p = await patch(b.id, { adults: 3, partyChangeSource: 'guest_direct' });
      expect(p.statusCode, p.body).toBe(200);
      expect(await total(b.folioId, 'extra_person')).toBe(450_000);
      expect(
        (await move(b.id, { roomId: ids.rooms['102'], reasonCode: 'property_fault' })).statusCode,
      ).toBe(200);
      expect(await total(b.folioId, 'extra_person')).toBe(450_000);
      // The OTTIMO move lowers the fee (−450.000): v0.3.8 (DOM-S4-06) – saved with the amount shown.
      const bare = await move(b.id, { roomId: ids.rooms['301'], reasonCode: 'property_fault' });
      expect(bare.json()).toMatchObject({
        errors: [{ field: 'applyDifference', code: 'REQUIRED' }],
        folioDeltaVnd: -450_000,
      });
      expect(
        (
          await moveShown(b.id, {
            roomId: ids.rooms['301'] as string,
            reasonCode: 'property_fault',
          })
        ).statusCode,
      ).toBe(200);
      expect(await total(b.folioId, 'extra_person')).toBe(0);
      expect((await totals(b.folioId)).totalVnd).toBe(2_100_000);
    });

    it('BUG-R2-058 (d): a conflict booking without a room keeps its OTA count on "khách báo trực tiếp" and is charged when B7a assigns the room (min of booked room, assigned room)', async () => {
      await agoda('203', '2027-02-16', '2027-02-18', 1_600_000);
      const res = await c.fd!.send('POST', url('/reservations'), {
        roomId: ids.rooms['203'],
        channelId: ids.channels.agoda,
        adults: 2,
        bookerGuestId: guest,
        paymentModel: 'ota_prepaid',
        otaRef: `AG${randomUUID().slice(0, 8)}`,
        otaRoomAmountVnd: 1_600_000,
        arrivalDate: '2027-02-16',
        departureDate: '2027-02-18',
        allowUnassigned: true,
      });
      expect(res.statusCode, res.body).toBe(201);
      const b = res.json() as Booking & { roomDisclosedToGuest: boolean };
      expect(b.roomDisclosedToGuest).toBe(false);
      const p = await patch(b.id, { adults: 3, partyChangeSource: 'guest_direct' });
      expect(p.statusCode, p.body).toBe(200);
      expect(p.json().otaGuestCount).toBe(2);
      const as = await act(b.id, 'assign-room', {
        roomId: ids.rooms['201'],
        resolution: 'reassigned_same_group',
      });
      expect(as.statusCode, as.body).toBe(200);
      expect(await lines(b.folioId, 'extra_person')).toEqual([
        ['2027-02-16', 150_000],
        ['2027-02-17', 150_000],
      ]);
      // Never in "Đã thu qua OTA": the OTA receipt still equals the room money.
      expect((await totals(b.folioId)).paidViaOtaVnd).toBe(1_600_000);
      // inventory_optimize only while the guest has not been told the room (BR-012 (4)).
      const told = await patch(b.id, { roomDisclosedToGuest: true });
      expect(told.statusCode, told.body).toBe(200);
      const opt = await move(b.id, { roomId: ids.rooms['202'], reasonCode: 'inventory_optimize' });
      expect(opt.statusCode).toBe(422);
      expect(opt.json().errors).toContainEqual({ field: 'reasonCode', code: 'NOT_IN_LIST' });
    });

    // ───────────────────────────── S4-05 – B14 OTA difference against the origin room ─────────────────────────────

    it('BR-424-04: Agoda 203 in house – 203 → 401, back to 203 the same day, 401 again the next day: 0 + 250.000 = 250.000 (not 750.000)', async () => {
      const o = oracle('BR-424-04');
      const rates = o.input.directRateByRoomVnd as Record<string, number>;
      await at('2027-04-20T10:00:00+07:00');
      await ready('203');
      const b = await agoda('203', o.input.arrivalDate, o.input.departureDate, 2_700_000);
      await at(`${o.input.arrivalDate}T15:00:00+07:00`);
      const ci = await act(b.id, 'check-in', {
        cardsIssued: 1,
        houseRulesSent: true,
        checkinTime: '15:00',
      });
      expect(ci.statusCode, ci.body).toBe(200);
      const change = async (date: string, room: string) => {
        await at(`${date}T10:00:00+07:00`);
        await ready(room);
        const body = {
          newRoomId: ids.rooms[room],
          effectiveDate: date,
          cause: 'guest_request',
          reason: 'Khách muốn đổi căn',
        };
        const dry = await act(b.id, 'change-room', { ...body, dryRun: true });
        expect(dry.statusCode, dry.body).toBe(200);
        const res = await act(b.id, 'change-room', {
          ...body,
          applyDifference: true,
          expectedDeltaVnd: dry.json().folioDeltaVnd,
        });
        expect(res.statusCode, res.body).toBe(200);
        return dry.json();
      };
      const [m1, m2, m3] = o.input.moves as Array<{ fromNight: string; toRoomNo: string }>;
      const d1 = await change(m1!.fromNight, m1!.toRoomNo);
      const diff = (rates['401'] as number) - (rates['203'] as number);
      expect(d1.folioDeltaVnd).toBe(2 * diff);
      const d2 = await change(m2!.fromNight, m2!.toRoomNo);
      expect(d2.folioDeltaVnd).toBe(-2 * diff); // reversed, re-posted against the origin room = 0
      expect(await lines(b.folioId, 'room_change_difference')).toEqual([]);
      await change(m3!.fromNight, m3!.toRoomNo);
      const expected = o.expected.differenceByDateVnd as Record<string, number>;
      expect(Object.fromEntries(await lines(b.folioId, 'room_change_difference'))).toEqual(
        Object.fromEntries(Object.entries(expected).filter(([, v]) => v > 0)),
      );
      expect(await total(b.folioId, 'room_change_difference')).toBe(o.expected.totalDifferenceVnd);
      const grp = await q<{ revenue_group: string }>(
        `SELECT DISTINCT revenue_group FROM folio_line WHERE folio_id = $1 AND category = 'room_change_difference'`,
        [b.folioId],
      );
      expect(grp).toEqual([{ revenue_group: o.expected.revenueGroup }]);
    });

    // ───────────────────────────── S4-04 / M2 – FOC that follows, preview = write ─────────────────────────────

    const lineId = async (folioId: string, category: string, date: string) =>
      (
        await q<{ id: string }>(
          `SELECT l.id FROM folio_line l
            WHERE l.folio_id = $1 AND l.category = $2 AND l.service_date = $3 AND l.line_state = 'posted'
              AND l.reversal_of_id IS NULL AND NOT EXISTS (SELECT 1 FROM folio_line r WHERE r.reversal_of_id = l.id)`,
          [folioId, category, date],
        )
      )[0]!.id;
    const askFoc = async (
      b: Booking,
      date: string,
      amountVnd: number,
      kind: 'foc' | 'special_discount' = 'foc',
    ) => {
      const r = await c.fd!.send(
        'POST',
        url(`/folios/${b.folioId}/lines/${await lineId(b.folioId, 'room', date)}/foc`),
        { kind, amountVnd, reasonCode: kind === 'foc' ? 'service_recovery' : 'regular_vip' },
      );
      expect(r.statusCode, r.body).toBe(201);
      return r.json().id as string;
    };
    const approve = async (who: string, id: string) => {
      const r = await c[who]!.send('POST', url(`/approval-requests/${id}/actions/approve`), {
        authMethod: 'password',
        secret: TEST_PASSWORD,
      });
      expect(r.statusCode, r.body).toBe(200);
    };
    /** Live FOC/discount on the room line of a date. */
    const focOn = async (folioId: string, date: string) =>
      Number(
        (
          await q<{ v: string }>(
            `SELECT COALESCE(-SUM(f.amount_vnd), 0)::text AS v FROM folio_line f JOIN folio_line l ON l.id = f.related_line_id
              WHERE f.folio_id = $1 AND f.category IN ('foc', 'discount') AND f.line_state = 'posted'
                AND f.reversal_of_id IS NULL AND NOT EXISTS (SELECT 1 FROM folio_line r WHERE r.reversal_of_id = f.id)
                AND l.category = 'room' AND l.service_date = $2`,
            [folioId, date],
          )
        )[0]!.v,
      );

    it('BR-434-06 (B7): FOC 792.000 on a 202 night – guest asks 302: FOC 792.000, the night 125.000, preview = write; OTTIMO move keeps everything', async () => {
      const o = oracle('BR-434-06');
      await at('2026-10-20T10:00:00+07:00');
      const b = await direct('202', '2027-06-22', '2027-06-24', 500_000);
      await approve('mgr', await askFoc(b, '2027-06-22', o.input.focApprovedVnd));
      const { preview: pv } = await previewThenMove(b.id, {
        roomId: ids.rooms['302'] as string,
        reasonCode: 'guest_request',
      });
      expect(pv.nights[0]).toMatchObject({
        date: '2027-06-22',
        newRateVnd: o.input.newNightRateVnd,
        focVnd: o.expected.b7GuestRequestFocVnd,
      });
      expect(await focOn(b.folioId, '2027-06-22')).toBe(o.expected.b7GuestRequestFocVnd);
      const t = await totals(b.folioId);
      expect(t.totalVnd).toBe(o.expected.b7GuestRequestRoomPayableVnd + o.input.newNightRateVnd);
      // OTTIMO's move: prices and the FOC stay, nothing re-posted (BR-434 / BR-429 (b)).
      const k = await direct('202', '2027-06-29', '2027-07-01', 500_000);
      await approve('mgr', await askFoc(k, '2027-06-29', o.input.focApprovedVnd));
      const count = async () =>
        Number(
          (
            await q<{ n: string }>(
              'SELECT count(*)::text AS n FROM folio_line WHERE folio_id = $1',
              [k.folioId],
            )
          )[0]!.n,
        );
      const before = await count();
      const kp = await preview(k.id, {
        roomId: ids.rooms['401'] as string,
        reasonCode: 'property_fault',
      });
      expect(kp.json()).toMatchObject({ folioDeltaVnd: 0 });
      const kept = await move(k.id, { roomId: ids.rooms['401'], reasonCode: 'property_fault' });
      expect(kept.statusCode, kept.body).toBe(200);
      expect(await count()).toBe(before + o.expected.b7OttimoCauseLinesReposted);
      expect(await focOn(k.folioId, '2027-06-29')).toBe(o.expected.b7OttimoCauseFocVnd);
    });

    it('BR-434-06 (B14) + S4-04: in house – guest asks 302: FOC 792.000 kept, +125.000; guest asks 201 (708.000) with FOC 792.000: preview −84.000 = what the folio really changes', async () => {
      const o = oracle('BR-434-06');
      const stay = async (from: string, to: string) => {
        await at(`${from}T09:00:00+07:00`);
        await ready('202');
        const b = await direct('202', from, to, 500_000);
        await approve('mgr', await askFoc(b, from, o.input.focApprovedVnd));
        // Pay what is left so check-in is allowed (BR-402 balance_paid).
        const due = (await totals(b.folioId)).balanceDueVnd;
        if (due > 0) {
          const p = await c.fd!.send('POST', url(`/folios/${b.folioId}/payments`), {
            type: 'charge',
            method: 'cash',
            amountVnd: due,
          });
          expect([200, 201], p.body).toContain(p.statusCode);
        }
        await at(`${from}T15:00:00+07:00`);
        const ci = await act(b.id, 'check-in', {
          cardsIssued: 1,
          houseRulesSent: true,
          checkinTime: '15:00',
        });
        expect(ci.statusCode, ci.body).toBe(200);
        return b;
      };
      const change = async (b: Booking, date: string, room: string) => {
        await ready(room);
        const body = {
          newRoomId: ids.rooms[room],
          effectiveDate: date,
          cause: 'guest_request',
          reason: 'Khách muốn đổi căn',
        };
        const before = (await totals(b.folioId)).totalVnd;
        const dry = await act(b.id, 'change-room', { ...body, dryRun: true });
        expect(dry.statusCode, dry.body).toBe(200);
        const res = await act(b.id, 'change-room', {
          ...body,
          applyDifference: true,
          expectedDeltaVnd: dry.json().folioDeltaVnd,
        });
        expect(res.statusCode, res.body).toBe(200);
        // Preview = write: the folio changed by exactly the amount shown.
        expect((await totals(b.folioId)).totalVnd - before).toBe(dry.json().folioDeltaVnd);
        return dry.json().folioDeltaVnd as number;
      };
      const up = await stay('2027-06-08', '2027-06-10');
      expect(await change(up, '2027-06-08', '302')).toBe(
        2 * (o.input.newNightRateVnd - o.input.oldNightRateVnd),
      );
      expect(await focOn(up.folioId, '2027-06-08')).toBe(o.expected.focVnd);
      // S4-04: the FOC (792.000) is above the new price (201 = 708.000) → FOC = 708.000, that night 0.
      const down = await stay('2027-06-15', '2027-06-17');
      expect(await change(down, '2027-06-15', '201')).toBe(708_000 - 792_000);
      expect(await focOn(down.folioId, '2027-06-15')).toBe(708_000);
    });

    it('BR-434-11 (S4-23 via B7): special discount 250.000 then FOC 792.000 on one 401 night, guest asks 302 → 101 → 401: stay 1.042.000 → 917.000 → 667.000 → 1.042.000 (preview = write)', async () => {
      const o = oracle('BR-434-11');
      await at('2026-10-20T10:00:00+07:00');
      const b = await direct('401', '2027-04-06', '2027-04-08', 700_000);
      const night = '2027-04-06';
      const [sd, foc] = o.input.reductions as Array<{
        kind: 'foc' | 'special_discount';
        approvedVnd: number;
      }>;
      // Approved in this order (S4-23 (1)): the special discount first, then the FOC.
      await approve('mgr', await askFoc(b, night, sd!.approvedVnd, sd!.kind));
      await approve('mgr', await askFoc(b, night, foc!.approvedVnd, foc!.kind));
      const seq = o.input.roomSequence as string[];
      const rate = o.input.nightRateByRoomVnd as Record<string, number>;
      expect(await focOn(b.folioId, night)).toBe(
        (o.expected.specialDiscountAppliedSequenceVnd[0] as number) +
          (o.expected.focAppliedSequenceVnd[0] as number),
      );
      for (const [i, room] of seq.entries()) {
        if (i === 0) continue;
        const { preview: pv } = await previewThenMove(b.id, {
          roomId: ids.rooms[room] as string,
          reasonCode: 'guest_request',
        });
        expect(pv.nights[0].focVnd).toBe(
          (o.expected.specialDiscountAppliedSequenceVnd[i] as number) +
            (o.expected.focAppliedSequenceVnd[i] as number),
        );
        expect(await focOn(b.folioId, night)).toBe(pv.nights[0].focVnd);
        // Two nights: the reduced night nets 0, the other is the room's price → the oracle's stay total.
        expect((await totals(b.folioId)).totalVnd).toBe(o.expected.roomTotalSequenceVnd[i]);
        expect(rate[room]).toBe(o.expected.roomTotalSequenceVnd[i]);
      }
    });

    it('BR-434-09 (S4-18 via B7): FOC 300.000 pending on 24/11, the stay grows to 7 nights – preview carries it as pending (not in the delta), approved afterwards → 4.905.000', async () => {
      const o = oracle('BR-434-09');
      await at('2026-10-20T10:00:00+07:00');
      const b = await direct('203', o.input.from.arrivalDate, o.input.from.departureDate, 800_000);
      const pending = await askFoc(b, o.input.requestNight, o.input.requestedFocVnd);
      const body = { departureDate: o.input.to.departureDate, reasonCode: 'guest_request' };
      const before = (await totals(b.folioId)).totalVnd;
      const pv = await preview(b.id, body);
      expect(pv.statusCode, pv.body).toBe(200);
      const n24 = pv.json().nights.find((n: { date: string }) => n.date === o.input.requestNight);
      expect(n24).toMatchObject({
        newRateVnd: o.input.nightRatesAfterVnd[o.input.requestNight],
        pendingFocVnd: o.expected.focAppliedVnd,
      });
      const res = await move(b.id, {
        ...body,
        applyDifference: true,
        expectedDeltaVnd: pv.json().folioDeltaVnd,
      });
      expect(res.statusCode, res.body).toBe(200);
      expect((await totals(b.folioId)).totalVnd - before).toBe(pv.json().folioDeltaVnd);
      await approve('mgr', pending);
      expect(await focOn(b.folioId, o.input.requestNight)).toBe(o.expected.focAppliedVnd);
      expect((await totals(b.folioId)).totalVnd).toBe(o.expected.roomPayableVnd);
    });

    // ───────────────────────────── S4-35 part A – StayNightPricingPort ─────────────────────────────

    it('S4-35 (A) / BR-429-09: the desk keeps the deal on the new room – setNightRate 937.000 (calendar), total 2.811.000, out of BR-105 → 422; a later move by OTTIMO keeps it', async () => {
      const o = oracle('BR-429-09');
      await at('2026-10-20T10:00:00+07:00');
      const b = await direct('101', '2027-07-06', '2027-07-09', o.input.depositPaidVnd, {
        nightlyRates: ['2027-07-06', '2027-07-07', '2027-07-08'].map((date) => ({
          date,
          amountVnd: 600_000,
        })),
      });
      await previewThenMove(b.id, {
        roomId: ids.rooms['401'] as string,
        reasonCode: 'guest_request',
      });
      expect((await get(b.id)).totalRoomVnd).toBe(o.expected.guestRequest.newRoomTotalVnd);
      const port = fa.app.get(StayNightPricingPort);
      const set = (
        serviceDate: string,
        unitPriceVnd: number,
        category: 'room' | 'extra_person' = 'room',
      ) =>
        db.withContext(t.ctx(), (tx) =>
          port.setNightRate(tx, {
            reservationId: b.id,
            serviceDate,
            category,
            unitPriceVnd,
            userId: t.users.fd!.id,
            reason: 'Giữ ưu đãi khách quen',
          }),
        );
      await expect(set('2027-07-06', 700_000)).rejects.toMatchObject({ code: 'RATE_OUT_OF_RANGE' });
      for (const d of ['2027-07-06', '2027-07-07', '2027-07-08']) {
        const r = await set(d, o.expected.deskKeepsDeal.nightRateVnd);
        expect(r).toMatchObject({
          lineAmountVnd: o.expected.deskKeepsDeal.nightRateVnd,
          calendarVnd: o.expected.deskKeepsDeal.nightRateVnd,
        });
      }
      const after = await get(b.id);
      expect(after.totalRoomVnd).toBe(o.expected.deskKeepsDeal.newRoomTotalVnd);
      // OTTIMO moves the booking afterwards: the typed prices stay (BR-429 (g) – never re-priced silently).
      const moved = await move(b.id, { roomId: ids.rooms['301'], reasonCode: 'property_fault' });
      expect(moved.statusCode, moved.body).toBe(200);
      expect(moved.json().totalRoomVnd).toBe(o.expected.deskKeepsDeal.newRoomTotalVnd);
      // extra_person: the fee of the night as typed.
      expect(await set('2027-07-06', 120_000, 'extra_person')).toMatchObject({
        lineAmountVnd: 120_000,
      });
      const [n] = await q<{ fee: number }>(
        `SELECT extra_person_fee_vnd AS fee FROM stay_night WHERE reservation_id = $1 AND stay_date = '2027-07-06'
            AND night_state <> 'void'`,
        [b.id],
      );
      expect(Number(n!.fee)).toBe(120_000);
    });

    // ───────────────────────────── BR-012 folio side (S4-52) ─────────────────────────────

    it('BR-012-01 (folio): lines and bill show room NAMES (The Valley), never the number; a settled bill keeps the name it had', async () => {
      const o = oracle('BR-012-01');
      const names = o.expected.provisionalNameByRoomNo as Record<string, string>;
      for (const [no, name] of Object.entries(names)) {
        await q('UPDATE room SET name = $2 WHERE id = $1', [ids.rooms[no], name]);
      }
      await at('2027-08-02T15:00:00+07:00');
      await ready('202');
      const b = await direct('202', '2027-08-02', '2027-08-05', 700_000);
      const folio = (await c.fd!.get(url(`/folios/${b.folioId}`))).json();
      const rooms = folio.lines.filter((l: { category: string }) => l.category === 'room');
      expect(rooms.map((l: { labelParams: { room: string } }) => l.labelParams.room)).toEqual([
        names['202'],
        names['202'],
        names['202'],
      ]);
      const bill = (await c.fd!.get(url(`/folios/${b.folioId}/bill`))).json();
      expect(bill.roomName).toBe(names['202']);
      expect(bill.settledAt).toBeNull(); // 0.3.7 bổ sung 1 – open folio
      // 0.3.7 bổ sung 1: getReservation always carries the deposit notices (none here).
      expect((await get(b.id)).depositNotices).toEqual([]);
      expect(JSON.stringify(bill.lines)).not.toContain('"202"');
      // Settle (B18) then rename the room: the bill keeps "The Valley" (BR-012 (5)).
      const due = (await totals(b.folioId)).balanceDueVnd;
      await c.fd!.send('POST', url(`/folios/${b.folioId}/payments`), {
        type: 'charge',
        method: 'cash',
        amountVnd: due,
      });
      expect(
        (
          await act(b.id, 'check-in', {
            cardsIssued: 1,
            houseRulesSent: true,
            checkinTime: '15:00',
          })
        ).statusCode,
      ).toBe(200);
      await at('2027-08-05T10:00:00+07:00');
      const out = await act(b.id, 'check-out', { checkoutTime: '10:00' });
      expect(out.statusCode, out.body).toBe(200);
      const [f] = await q<{ names: Record<string, string> }>(
        'SELECT settled_room_names AS names FROM folio WHERE id = $1',
        [b.folioId],
      );
      expect(f!.names).toEqual({ '202': names['202'] });
      await q('UPDATE room SET name = $2 WHERE id = $1', [ids.rooms['202'], 'The Valley Two']);
      const after = (await c.fd!.get(url(`/folios/${b.folioId}/bill`))).json();
      expect(after.roomName).toBe(names['202']);
      expect(after.settledAt).toBe('2027-08-05T10:00:00.000+07:00');
      expect(
        after.lines
          .filter((l: { category: string }) => l.category === 'room')
          .map((l: { labelParams: { room: string } }) => l.labelParams.room),
      ).toEqual([names['202'], names['202'], names['202']]);
      await q('UPDATE room SET name = $2 WHERE id = $1', [ids.rooms['202'], names['202']]);
    });

    // ───────────────────────────── S4-09 – "chỉ chuyển tới hết đơn gốc" ─────────────────────────────

    it('BR-424-05 (BE-A part): OTA 203 + child extension; 302 taken on the child night → 409 parentOnlyAvailable; until_parent_departure moves the primary only, no cleaning pre-generated; return recorded once → 302 VD + check-out cleaning, 203 OC', async () => {
      const o = oracle('BR-424-05');
      // Same pattern, other dates (the oracle's October 2026 is before this suite's clock): 2027-09-13…
      await at('2027-09-01T10:00:00+07:00');
      await ready('203');
      const b = await agoda('203', '2027-09-13', '2027-09-16', 2_400_000);
      // Another guest arrives in 302 on the return day (14:00 in the oracle).
      const other = await direct('302', '2027-09-16', '2027-09-18', 600_000);
      expect(other.id).toBeTruthy();
      await at('2027-09-13T15:00:00+07:00');
      const ci = await act(b.id, 'check-in', {
        cardsIssued: 1,
        houseRulesSent: true,
        checkinTime: '15:00',
      });
      expect(ci.statusCode, ci.body).toBe(200);
      await at('2027-09-14T09:00:00+07:00');
      await ready('302');
      const noChildYet = await act(b.id, 'change-room', {
        newRoomId: ids.rooms['302'],
        effectiveDate: '2027-09-14',
        cause: 'property_fault',
        reason: 'Sưởi 203 hỏng',
        stayScope: 'until_parent_departure',
        dryRun: true,
      });
      expect(noChildYet.statusCode).toBe(422);
      expect(noChildYet.json().errors).toContainEqual(
        expect.objectContaining({ field: 'stayScope', code: 'NOT_ALLOWED' }),
      );
      const ext = await act(b.id, 'extend', { nights: 2 });
      expect(ext.statusCode, ext.body).toBe(200);
      const childId = ext.json().childReservation.id as string;
      await ready('302');
      const body = {
        newRoomId: ids.rooms['302'],
        effectiveDate: '2027-09-14',
        cause: o.input.changeRoom.cause,
        reason: 'Sưởi 203 hỏng – khách đồng ý chuyển tới hết đơn gốc',
      };
      const whole = await act(b.id, 'change-room', { ...body, dryRun: true });
      expect(whole.statusCode).toBe(409);
      expect(whole.json()).toMatchObject({ code: 'ROOM_UNAVAILABLE', parentOnlyAvailable: true });
      const noChild = await act(other.id, 'change-room', {
        ...body,
        stayScope: 'until_parent_departure',
        dryRun: true,
      });
      expect(noChild.statusCode).toBe(409); // not in house – the 422 NOT_ALLOWED rule is checked on stays
      const dry = await act(b.id, 'change-room', {
        ...body,
        stayScope: 'until_parent_departure',
        dryRun: true,
      });
      expect(dry.statusCode, dry.body).toBe(200);
      expect(dry.json()).toMatchObject({
        stayScope: 'until_parent_departure',
        returnToRoomDate: '2027-09-16',
        folioDeltaVnd: 0,
      });
      const tasksBefore = await q<{ n: number }>(
        `SELECT count(*)::int AS n FROM hk_task WHERE room_id = $1 AND due_date = '2027-09-16'`,
        [ids.rooms['203']],
      );
      const moved = await act(b.id, 'change-room', {
        ...body,
        stayScope: 'until_parent_departure',
      });
      expect(moved.statusCode, moved.body).toBe(200);
      // (1) no priority clean pre-generated for the return day.
      expect(
        (
          await q<{ n: number }>(
            `SELECT count(*)::int AS n FROM hk_task WHERE room_id = $1 AND due_date = '2027-09-16'`,
            [ids.rooms['203']],
          )
        )[0]!.n,
      ).toBe(tasksBefore[0]!.n);
      // The child's night stays in 203; the primary's nights moved to 302.
      const rooms = await q<{ rid: string; d: string; room: string }>(
        `SELECT n.reservation_id AS rid, n.stay_date::text AS d, rm.room_no AS room FROM stay_night n
           JOIN room rm ON rm.id = n.room_id
          WHERE n.reservation_id = ANY($1::uuid[]) AND n.night_state <> 'void' ORDER BY n.stay_date`,
        [[b.id, childId]],
      );
      expect(rooms.map((r) => [r.d, r.room])).toEqual([
        ['2027-09-13', '203'],
        ['2027-09-14', '302'],
        ['2027-09-15', '302'],
        ['2027-09-16', '203'],
        ['2027-09-17', '203'],
      ]);
      // Return day 10:30 – the desk records the move back on the child booking.
      await at('2027-09-16T10:30:00+07:00');
      await ready('203');
      const patch = async (id: string, payload: Record<string, unknown>) =>
        c.fd!.send('PATCH', url(`/reservations/${id}`), payload, {
          'if-match': `"${(await get(id)).version}"`,
        });
      const onPrimary = await patch(b.id, { roomReturnRecorded: true });
      expect(onPrimary.statusCode).toBe(409);
      const back = await patch(childId, { roomReturnRecorded: true });
      expect(back.statusCode, back.body).toBe(200);
      const st = await q<{ room: string; status: string }>(
        `SELECT rm.room_no AS room, s.status FROM room_status s JOIN room rm ON rm.id = s.room_id
          WHERE s.room_id = ANY($1::uuid[]) ORDER BY rm.room_no`,
        [[ids.rooms['203'], ids.rooms['302']]],
      );
      expect(st).toEqual([
        { room: '203', status: o.expected.afterMoveBack.oldRoomStatus },
        { room: '302', status: o.expected.afterMoveBack.newRoomStatus },
      ]);
      const [task] = await q<{ type: string; rank: number }>(
        `SELECT type, priority_rank AS rank FROM hk_task WHERE room_id = $1 AND due_date = '2027-09-16' AND note = 'room_return'`,
        [ids.rooms['302']],
      );
      expect(task).toMatchObject({ type: o.expected.afterMoveBack.newRoomTask, rank: 2 });
      expect((await patch(childId, { roomReturnRecorded: true })).statusCode).toBe(409);
      expect(await lines(b.folioId, 'late_checkout')).toEqual([]);
    });

    // ───────────────────────────── BR v0.3.8 – DOM-S4-01…06, DOM-S4-14 (BE-A) ─────────────────────────────

    /** A confirmed booking made from a quote (POST /quotes → create-hold → confirm-deposit). */
    const fromQuote = async (body: Record<string, unknown>) => {
      const qr = await c.fd!.send('POST', url('/quotes'), {
        type: 'short',
        adults: 2,
        channelId: ids.channels.direct,
        guestId: guest,
        ...body,
      });
      expect(qr.statusCode, qr.body).toBe(201);
      const h = await c.fd!.send('POST', url(`/quotes/${qr.json().id}/actions/create-hold`), {
        holdHours: 48,
      });
      expect(h.statusCode, h.body).toBe(201);
      const hold = h.json() as Booking & { depositRequiredVnd: number };
      const ok = await act(hold.id, 'confirm-deposit', {
        payment: { type: 'deposit', method: 'cash', amountVnd: hold.depositRequiredVnd },
      });
      expect(ok.statusCode, ok.body).toBe(200);
      return { ...hold, quote: qr.json() as { nightlyRates: Array<{ amountVnd: number }> } };
    };

    it('BR-429-11 (DOM-S4-01, -06): force_majeure postpone + OTTIMO room 202 → 401 – the new nights take the OLD room calendar (1.822.000, not 2.396.000), +238.000 needs the tick', async () => {
      const o = oracle('BR-429-11');
      await at('2027-07-20T10:00:00+07:00');
      // Same pattern as the oracle: 2 weekday nights booked, postponed onto a Friday + Saturday.
      const b = await direct('202', '2027-11-09', '2027-11-11', 500_000);
      expect((await get(b.id)).totalRoomVnd).toBe(o.expected.bookedRoomTotalVnd);
      const body = {
        roomId: ids.rooms['401'] as string,
        arrivalDate: '2027-11-19',
        departureDate: '2027-11-21',
        mode: 'postpone_instead_of_cancel',
        reasonCode: o.input.reasonCode,
        note: 'Đèo Prenn đóng – ảnh thông báo',
      };
      const pv = await preview(b.id, body, 'mgr');
      expect(pv.statusCode, pv.body).toBe(200);
      expect(pv.json()).toMatchObject({
        roomTotalNewVnd: o.expected.newRoomTotalVnd,
        folioDeltaVnd: o.expected.folioDeltaVnd,
      });
      const bare = await move(b.id, body, 'mgr');
      expect(bare.statusCode).toBe(422);
      expect(bare.json().errors).toEqual([{ field: 'applyDifference', code: 'REQUIRED' }]);
      const noAmount = await move(b.id, { ...body, applyDifference: true }, 'mgr');
      expect(noAmount.json().errors).toEqual([{ field: 'expectedDeltaVnd', code: 'REQUIRED' }]);
      const res = await move(
        b.id,
        { ...body, applyDifference: true, expectedDeltaVnd: o.expected.folioDeltaVnd },
        'mgr',
      );
      expect(res.statusCode, res.body).toBe(200);
      expect(res.json().totalRoomVnd).toBe(o.expected.newRoomTotalVnd);
      expect(res.json().totalRoomVnd).not.toBe(o.expected.wrongNewRoomTotalVnd);
    });

    it('BR-429-12 (DOM-S4-06, BA E02-10): a guest date change keeping the room, +119.000 → tick + amount required; the stale amount → 409', async () => {
      const o = oracle('BR-429-12');
      await at('2027-07-20T10:00:00+07:00');
      const b = await direct('202', '2027-11-23', '2027-11-26', 800_000);
      const body = {
        arrivalDate: '2027-11-24',
        departureDate: '2027-11-27',
        reasonCode: 'guest_request',
      };
      const pv = await preview(b.id, body);
      expect(pv.statusCode, pv.body).toBe(200);
      expect(pv.json().nights.map((n: { newRateVnd: number }) => n.newRateVnd)).toEqual(
        Object.values(o.expected.newNightRatesVnd),
      );
      expect(pv.json()).toMatchObject({
        roomTotalNewVnd: o.expected.newRoomTotalVnd,
        folioDeltaVnd: o.expected.folioDeltaVnd,
      });
      expect((await move(b.id, body)).json().errors).toEqual([
        { field: 'applyDifference', code: 'REQUIRED' },
      ]);
      const stale = await move(b.id, { ...body, applyDifference: true, expectedDeltaVnd: 0 });
      expect(stale.statusCode).toBe(409);
      expect(stale.json()).toMatchObject({
        code: 'SURCHARGE_CHANGED',
        folioDeltaVnd: o.expected.folioDeltaVnd,
      });
      const res = await move(b.id, {
        ...body,
        applyDifference: true,
        expectedDeltaVnd: o.expected.folioDeltaVnd,
      });
      expect(res.statusCode, res.body).toBe(200);
      expect(res.json().totalRoomVnd).toBe(o.expected.newRoomTotalVnd);
    });

    it('BR-429-14 (DOM-S4-02): OTTIMO moves 202 → 203 – a fee the desk typed (100.000) is kept: min(fee recorded, fee at the protected base)', async () => {
      const o = oracle('BR-429-14');
      await at('2027-07-20T10:00:00+07:00');
      const b = await direct('202', '2027-12-07', '2027-12-09', 800_000, {
        adults: o.input.adults,
      });
      expect(await lines(b.folioId, 'extra_person')).toEqual([
        ['2027-12-07', o.input.computedFeeVnd],
        ['2027-12-08', o.input.computedFeeVnd],
      ]);
      const folio = (await c.fd!.get(url(`/folios/${b.folioId}`))).json();
      const typed = await c.fd!.send(
        'POST',
        url(
          `/folios/${b.folioId}/lines/${await lineId(b.folioId, 'extra_person', '2027-12-07')}/adjustments`,
        ),
        { newUnitPriceVnd: o.input.manualFeeVnd, reason: 'Thỏa thuận với khách' },
        { 'if-match': `"${folio.version}"` },
      );
      expect(typed.statusCode, typed.body).toBe(201);
      const body = { roomId: ids.rooms['203'] as string, reasonCode: o.input.reasonCode };
      const pv = await preview(b.id, body);
      expect(pv.statusCode, pv.body).toBe(200);
      expect(pv.json().folioDeltaVnd).toBe(0);
      const res = await move(b.id, body);
      expect(res.statusCode, res.body).toBe(200);
      expect(await lines(b.folioId, 'extra_person')).toEqual([
        ['2027-12-07', o.expected.feeAfterMoveVnd],
        ['2027-12-08', o.input.computedFeeVnd],
      ]);
      const [n] = await q<{ base: number | null }>(
        `SELECT COALESCE(n.extra_person_base, rm.base_occupancy) AS base FROM stay_night n
           JOIN room rm ON rm.id = n.room_id
          WHERE n.reservation_id = $1 AND n.stay_date = '2027-12-07' AND n.night_state <> 'void'`,
        [b.id],
      );
      expect(Number(n!.base)).toBe(o.expected.protectedBase);
    });

    it('BR-429-15 (DOM-S4-03): a quote with OTTIMO-BACK5, guest asks 101 → 401 – the 5 % applies again (1.980.000, not 2.084.000)', async () => {
      const o = oracle('BR-429-15');
      await at('2027-07-20T10:00:00+07:00');
      const b = await fromQuote({
        roomId: ids.rooms['101'],
        arrivalDate: '2027-12-14',
        nights: 2,
        returnGuestCode: o.input.returnGuestCode,
      });
      expect(b.quote.nightlyRates.map((n) => n.amountVnd)).toEqual([
        o.expected.bookedNightVnd,
        o.expected.bookedNightVnd,
      ]);
      const body = { roomId: ids.rooms['401'] as string, reasonCode: 'guest_request' };
      const pv = await preview(b.id, body);
      expect(pv.statusCode, pv.body).toBe(200);
      expect(pv.json()).toMatchObject({
        roomTotalOldVnd: o.expected.bookedRoomTotalVnd,
        roomTotalNewVnd: o.expected.newRoomTotalVnd,
        returningGuestDiscountPct: o.expected.returningGuestDiscountPct,
        losDiscountPct: 0,
        folioDeltaVnd: o.expected.folioDeltaVnd,
      });
      expect(pv.json().nights.map((n: { newRateVnd: number }) => n.newRateVnd)).toEqual([
        o.expected.newNightVnd,
        o.expected.newNightVnd,
      ]);
      const res = await move(b.id, {
        ...body,
        applyDifference: true,
        expectedDeltaVnd: o.expected.folioDeltaVnd,
      });
      expect(res.statusCode, res.body).toBe(200);
      expect(res.json().totalRoomVnd).toBe(o.expected.newRoomTotalVnd);
    });

    it('BR-429-16 (DOM-S4-04): a 7-night quote (−10 %) moved one day – the quote calendar and % are kept: 5.205.000, not 4.757.000', async () => {
      const o = oracle('BR-429-16');
      await at('2027-07-20T10:00:00+07:00');
      const b = await fromQuote({ roomId: ids.rooms['202'], arrivalDate: '2027-11-29', nights: 7 });
      const booked = await get(b.id);
      expect(booked.totalRoomVnd).toBe(o.expected.newRoomTotalVnd);
      expect(
        booked.nightlyRates.map((n: { calendarRateVnd?: number }) => n.calendarRateVnd),
      ).toEqual([792_000, 792_000, 792_000, 792_000, 911_000, 911_000, 792_000]);
      const body = {
        arrivalDate: '2027-11-30',
        departureDate: '2027-12-07',
        reasonCode: 'guest_request',
      };
      const pv = await preview(b.id, body);
      expect(pv.statusCode, pv.body).toBe(200);
      expect(pv.json().roomTotalNewVnd).toBe(o.expected.newRoomTotalVnd);
      expect(pv.json().nights.at(-1)).toMatchObject({
        date: '2027-12-06',
        newRateVnd: o.expected.addedNightVnd,
      });
      expect(pv.json().folioDeltaVnd).toBe(0);
      const res = await move(b.id, body);
      expect(res.statusCode, res.body).toBe(200);
      expect(res.json().totalRoomVnd).toBe(o.expected.newRoomTotalVnd);
      expect(res.json().totalRoomVnd).not.toBe(o.expected.wrongDoubleDiscountTotalVnd);
    });

    it('BR-402-02 (DOM-S4-05): OTA prepaid 203 → 401 (guest) – the 500.000 difference, and with B9a the direct night (1.542.000), are paid before the check-in', async () => {
      const o = oracle('BR-402-02');
      const due = o.expected.requiredForBalancePaidVnd as Record<string, number>;
      const toGuestRoom = async (from: string, to: string) => {
        await at('2027-07-20T10:00:00+07:00');
        const b = await agoda('203', from, to, 1_600_000);
        const body = { roomId: ids.rooms['401'] as string, reasonCode: 'guest_request' };
        const pv = await preview(b.id, body);
        expect(pv.json().folioDeltaVnd).toBe(o.input.roomChangeDifferenceVnd);
        const res = await move(b.id, {
          ...body,
          applyDifference: true,
          expectedDeltaVnd: o.input.roomChangeDifferenceVnd,
        });
        expect(res.statusCode, res.body).toBe(200);
        return b;
      };
      // (a) 14:00 on the arrival day.
      const a = await toGuestRoom('2027-12-21', '2027-12-23');
      await at('2027-12-21T14:00:00+07:00');
      await ready('401');
      const pa = (
        await c.fd!.get(url(`/reservations/${a.id}/check-in-preview?checkinTime=14:00`))
      ).json();
      expect(pa.amountDueAtCheckinVnd).toBe(due.a);
      expect(pa.conditions).toContainEqual(
        expect.objectContaining({ code: 'balance_paid', met: false }),
      );
      const ciBody = { cardsIssued: 1, houseRulesSent: true, checkinTime: '14:00' };
      const unpaid = await act(a.id, 'check-in', ciBody);
      expect(unpaid.statusCode).toBe(409);
      expect(unpaid.json()).toMatchObject({ unmet: ['balance_paid'], balanceDueVnd: due.a });
      const paid = await act(a.id, 'check-in', {
        ...ciBody,
        payment: { type: 'charge', method: 'cash', amountVnd: due.a },
      });
      expect(paid.statusCode, paid.body).toBe(200);
      // (b) 04:30 on the arrival day: the B9a night (direct child, 1.042.000) joins the difference.
      const b = await toGuestRoom('2027-12-28', '2027-12-30');
      await at('2027-12-28T04:30:00+07:00');
      await ready('401');
      const pb = (await c.fd!.get(url(`/reservations/${b.id}/check-in-preview`))).json();
      expect(pb.priorNight).toMatchObject({
        defaultRateVnd: 1_042_000,
        createsChildReservation: true,
      });
      expect(pb.amountDueAtCheckinVnd).toBe(due.b);
      const b9a = {
        cardsIssued: 1,
        houseRulesSent: true,
        addPriorNight: true,
        priorNightRateVnd: 1_042_000,
        expectedSurchargeVnd: 1_042_000,
      };
      const b9aUnpaid = await act(b.id, 'check-in', b9a);
      expect(b9aUnpaid.statusCode, b9aUnpaid.body).toBe(409);
      const ok = await act(b.id, 'check-in', {
        ...b9a,
        payment: { type: 'charge', method: 'cash', amountVnd: due.b },
      });
      expect(ok.statusCode, ok.body).toBe(200);
      expect((await totals(b.folioId)).balanceDueVnd).toBe(0);
    });

    it('BR-309-10 / BR-522-05 (DOM-S4-14, BE-A part): fee base = min(deposit paid, deposit REQUIRED, booking value); an open refund request never lowers the fee', async () => {
      const o309 = oracle('BR-309-10');
      const o522 = oracle('BR-522-05');
      const fees = o522.expected.feeVnd as Record<string, number>;
      const quote = async (
        from: string,
        to: string,
        paidVnd: number,
        openRefundVnd: number,
        cancelDay: string,
      ) => {
        await at('2027-07-20T10:00:00+07:00');
        const b = await direct('202', from, to, paidVnd);
        const booked = await get(b.id);
        expect(booked.totalRoomVnd).toBe(o309.input.roomTotalVnd);
        expect(booked.depositRequiredVnd).toBe(o309.input.depositRequiredVnd);
        if (openRefundVnd > 0) {
          // The oracle's "yêu cầu hoàn tạo nhầm": the API refuses a request above the credit of a folio that
          // still owes (REFUND_EXCEEDS_APPROVED) – the fixture writes the open request row itself.
          await q(
            `INSERT INTO approval_request (id, organization_id, property_id, type, status, target_type, target_id,
               target_code, amount_vnd, reason_code, requested_by, requested_at, required_role, created_at,
               updated_at)
             VALUES ($1, $2, $3, 'refund', 'pending', 'reservation', $4, $5, $6, 'other', $7, $8, 'manager', $8,
               $8)`,
            [
              uuidv7(),
              t.organizationId,
              t.propertyIds[0],
              b.id,
              b.code,
              openRefundVnd,
              t.users.fd!.id,
              new Date('2027-07-20T03:00:00Z'),
            ],
          );
        }
        await at(`${cancelDay}T10:00:00+07:00`);
        const res = await act(b.id, 'cancel', { reasonCode: 'found_other', dryRun: true });
        expect(res.statusCode, res.body).toBe(200);
        return res.json().cancellation as { retainedVnd: number; refundableVnd: number };
      };
      // BR-309-10: paid 1.000.000 (required 700.000), 2 days before → fee 700.000, 300.000 is excess.
      const q0 = await quote('2027-12-14', '2027-12-17', 1_000_000, 0, '2027-12-12');
      expect(q0).toMatchObject({
        retainedVnd: o309.expected.cancellationFeeVnd,
        refundableVnd: o309.expected.excessRefundVnd,
      });
      // BR-522-05 (a) 5 days before, an open 300.000 → fee 50 % of 700.000; (b) 2 days → 700.000;
      // (c) paid 700.000 with a pending 700.000 request → fee 700.000 (it used to be 0).
      const qa = await quote('2027-12-21', '2027-12-24', 1_000_000, 300_000, '2027-12-16');
      expect(qa.retainedVnd).toBe(fees.a);
      const qb = await quote('2027-12-28', '2027-12-31', 1_000_000, 300_000, '2027-12-26');
      expect(qb.retainedVnd).toBe(fees.b);
      const qc = await quote('2027-10-12', '2027-10-15', 700_000, 700_000, '2027-10-10');
      expect(qc.retainedVnd).toBe(fees.c);
    });

    it('BR-429-19 (DOM-S4-19): an amount sent when the tick is not required must match – OTTIMO 202 → 203 (delta 0) with 119.000 → 409, nothing saved; not sent → 200', async () => {
      const o = oracle('BR-429-19');
      await at('2027-07-20T10:00:00+07:00');
      const b = await direct('202', '2027-10-19', '2027-10-21', 500_000);
      const body = { roomId: ids.rooms['203'] as string, reasonCode: o.input.reasonCode };
      const pv = await preview(b.id, body);
      expect(pv.json().folioDeltaVnd).toBe(o.input.folioDeltaVndAtWrite);
      const stale = await move(b.id, { ...body, expectedDeltaVnd: o.input.expectedDeltaVndSent });
      expect(stale.statusCode).toBe(o.expected.httpStatus);
      expect(stale.json()).toMatchObject({ code: o.expected.code, folioDeltaVnd: 0 });
      expect((await get(b.id)).segments[0].roomNo).toBe('202'); // not saved
      const ok = await move(b.id, body);
      expect(ok.statusCode, ok.body).toBe(o.expected.whenNotSent.httpStatus);
    });

    it('BR-429-18 (BE-A (q)): a quote made while `stackable` = true (−10 % then −5 %) – the guest asks 101 → 401, re-priced stacked like the quote: weekday 891.000', async () => {
      const o = oracle('BR-429-18');
      // `stackable` = true only for quotes made on 21/07/2027 (a later row puts it back) – other cases unaffected.
      for (const [day, value] of [
        ['2027-07-21', true],
        ['2027-07-22', false],
      ] as const) {
        await q(
          `INSERT INTO config_parameter (id, organization_id, property_id, key, value, effective_from, reason,
             created_at, created_by, updated_at)
           VALUES ($1, $2, $3, 'stackable', $4, $5, 'BR-429-18 fixture', $6, $7, $6)`,
          [
            uuidv7(),
            t.organizationId,
            t.propertyIds[0],
            JSON.stringify(value),
            day,
            new Date('2027-07-21T03:00:00Z'),
            t.users.own!.id,
          ],
        );
      }
      await at('2027-07-21T10:00:00+07:00');
      const b = await fromQuote({
        roomId: ids.rooms['101'],
        arrivalDate: '2027-10-18',
        nights: o.input.nights,
        returnGuestCode: 'OTTIMO-BACK5',
      });
      await at('2027-07-22T10:00:00+07:00');
      const body = { roomId: ids.rooms['401'] as string, reasonCode: 'guest_request' };
      const pv = await preview(b.id, body);
      expect(pv.statusCode, pv.body).toBe(200);
      const monday = pv.json().nights.find((n: { date: string }) => n.date === '2027-10-18');
      expect(monday.newRateVnd).toBe(o.expected.newWeekdayNightVnd);
      expect(pv.json()).toMatchObject({
        losDiscountPct: o.input.losDiscountPct,
        returningGuestDiscountPct: 5, // `return_guest_pct` of the oracle params
      });
      const res = await move(b.id, {
        ...body,
        applyDifference: true,
        expectedDeltaVnd: pv.json().folioDeltaVnd,
      });
      expect(res.statusCode, res.body).toBe(200);
      expect(
        res.json().nightlyRates.find((n: { date: string }) => n.date === '2027-10-18').amountVnd,
      ).toBe(o.expected.newWeekdayNightVnd);
    });

    it('BR-311-03 (BE-A (n)): no-show keeps min(deposit paid, deposit required, booking value) = 500.000; the 300.000 above is excess → one refund request', async () => {
      const o = oracle('BR-311-03');
      await at('2027-07-20T10:00:00+07:00');
      const b = await direct('202', '2027-10-05', '2027-10-07', o.input.depositPaidVnd, {
        nightlyRates: ['2027-10-05', '2027-10-06'].map((date) => ({
          date,
          amountVnd: o.input.nightRateVnd,
        })),
      });
      const booked = await get(b.id);
      expect(booked.totalRoomVnd).toBe(o.input.roomTotalVnd);
      expect(booked.depositRequiredVnd).toBe(o.input.depositRequiredVnd);
      await at('2027-10-05T23:05:00+07:00');
      const ns = await act(b.id, 'mark-no-show', {
        contactAttemptNote: 'Gọi 2 lần không nghe máy',
      });
      expect(ns.statusCode, ns.body).toBe(200);
      expect((await lines(b.folioId, 'no_show_fee')).map((l) => l[1])).toEqual([
        o.expected.retainedVnd,
      ]);
      const asked = await q<{ amount: number }>(
        `SELECT amount_vnd AS amount FROM approval_request
          WHERE type = 'refund' AND target_id = $1 AND status IN ('pending', 'escalated', 'approved')`,
        [b.id],
      );
      expect(asked.map((r) => Number(r.amount))).toEqual([o.expected.autoRefundRequestVnd]);
    });
  },
);
