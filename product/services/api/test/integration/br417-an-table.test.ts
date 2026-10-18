/**
 * BE-A – BR-417 appendix 5A (DOM 18/10, vòng sửa 5): ONE case per row AN-01…AN-47 of the added-night decision
 * table, read straight from `product/tests/fixtures/br-examples.json` (BR-417-16…19 – one source of numbers;
 * BUG-R2-160 = AN-10/11/12, 161 = AN-34, 162 = AN-22/43, R5-02 = AN-35). Every row runs in its own tenant (the
 * table's own dates) through HTTP the way the Desk works: preview → the amount shown → the write (B9a, B13, B18,
 * B14, B7, B7a, B12, K12, S4-35, S4-09). A row the R2 commands cannot reach (AN-14: a guest request into the lane;
 * AN-36: the generic "no reference night") runs on the shared functions themselves.
 * ARC 16.18: night sources by the operation (`default` / `manual` + `anchorRoomId`), `NightRate.edited`.
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
import {
  boughtRoomOf,
  type RoomChange,
} from '../../src/modules/reservations/internal/room-history';
import {
  addedNightPrice,
  referenceNightRate,
} from '../../src/modules/reservations/public/added-night-price';
import { sha256Hex } from '../../src/shared/http/auth.guard';
import {
  Client,
  type FeatureApp,
  P,
  TEST_PASSWORD,
  setPassword,
  startFeatureApp,
} from '../helpers/feature-app';
import { seedBooking, seedGuestRow, touchSessions } from '../helpers/reservations-fixture';
import { HAS_DB, appDatabase, createTenant, setParam } from '../helpers/tenant';

/* eslint-disable @typescript-eslint/no-explicit-any */

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

type Row = Record<string, any> & { an: string; condition: string };
/** The back-fill statement of migration 0068, as written (ARC 16.18 – nights written before the sources). */
const BACKFILL_0068 = readFileSync(
  join(__dirname, '../../src/db/migrations/0068_night_source_backfill.sql'),
  'utf8',
)
  .split('--> statement-breakpoint')
  .map((x) => x.replace(/^\s*--.*$/gm, '').trim())
  .find((x) => x.startsWith('WITH nights AS'));
const FIXTURE = JSON.parse(
  readFileSync(join(__dirname, '../../../../tests/fixtures/br-examples.json'), 'utf8'),
) as { examples: Array<{ id: string; input: any; expected: { cases?: Row[] } }> };
const SOURCES = ['BR-417-16', 'BR-417-17', 'BR-417-18', 'BR-417-19'];
const ROWS: Array<Row & { source: string }> = SOURCES.flatMap((id) => {
  const ex = FIXTURE.examples.find((e) => e.id === id);
  if (!ex) throw new Error(`oracle ${id} missing`);
  return (ex.expected.cases ?? []).map((r) => ({ ...r, source: id }));
}).sort((a, b) => (a.an < b.an ? -1 : 1));
const INPUT = FIXTURE.examples.find((e) => e.id === 'BR-417-16')!.input as {
  calendarWeekdayVnd: Record<string, number>;
  floorVnd: Record<string, number>;
  ceilingVnd: Record<string, number>;
};

const ROLES = { own: ['owner'], mgr: ['manager'], fdl: ['front_desk_lead'], fd: ['front_desk'] };
const ACCOUNT = { bankBin: '970407', accountNo: '1903123456783', accountName: 'OTTIMO TEST' };
type Booking = { id: string; code: string; version: number; folioId: string };

const day = (from: string, n: number) => {
  const d = new Date(`${from}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

describe.skipIf(!HAS_DB)('BR-417 appendix 5A – the added-night decision table AN-01…AN-47', () => {
  let db: Database;
  let fa: FeatureApp;

  beforeAll(async () => {
    db = appDatabase(8);
    fa = await startFeatureApp(db, {
      override: (b) =>
        b.overrideProvider(FrontdeskPorts).useFactory({
          factory: (child: FrontdeskChildDataPort) =>
            new FrontdeskPorts(new DocsOk(), new NoGuestAccessPort(), child, new NoMinibarPort()),
          inject: [FD_CHILD_DATA_PORT],
        }),
    });
  });
  afterAll(async () => {
    await fa?.close();
    await db?.close();
  });

  /** One tenant per row: DS-E rooms and parameters, a desk PC, OWN/MGR/FDL/FD, a receiving account. */
  const world = async (params: Array<[string, unknown, string]> = []) => {
    const t = await createTenant(db, { users: ROLES });
    const ids = await seedBooking(db, t);
    for (const [k, v, from] of params) await setParam(db, t, k, v, from);
    const guest = await seedGuestRow(db, t, { name: 'Khách Bảng Giá Đêm Thêm' });
    const c: Record<string, Client> = {};
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
          new Date('2030-12-31T00:00:00Z'),
        ],
      ),
    );
    for (const u of Object.keys(ROLES)) {
      c[u] = Client.of(fa, t, u);
      c[u]!.deviceToken = token;
      await setPassword(db, t, u);
    }
    const url = (p = '') => `${P(t)}${p}`;
    const at = async (iso: string) => {
      const d = new Date(iso);
      fa.clock.set(d);
      await touchSessions(db, t, d);
    };
    await at('2026-10-15T09:00:00+07:00');
    const put = await c.own!.send('PUT', url('/parameters/payment_receiving_account'), {
      value: ACCOUNT,
      effectiveFrom: '2026-10-15',
      reason: 'Tài khoản nhận thử nghiệm',
      reauth: { authMethod: 'password', secret: TEST_PASSWORD },
    });
    expect(put.statusCode, put.body).toBe(200);
    const q = async <T = any>(sql: string, p: unknown[] = []) =>
      (await db.withContext(t.ctx(), (tx) => tx.query(sql, p))).rows as T[];
    const get = async (id: string) => (await c.fd!.get(url(`/reservations/${id}`))).json();
    const act = async (id: string, verb: string, body: unknown, who = 'fd') =>
      c[who]!.send('POST', url(`/reservations/${id}/actions/${verb}`), body, {
        'if-match': `"${(await get(id)).version}"`,
      });
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
    const typed = (from: string, n: number, amountVnd: number) =>
      Array.from({ length: n }, (_, i) => ({ date: day(from, i), amountVnd }));
    /** Direct booking made 40 days ahead; `rate` = agreed price typed on every night (B1). */
    const direct = async (
      room: string,
      from: string,
      to: string,
      rate?: number,
      more: Record<string, unknown> = {},
    ) => {
      await at(`${day(from, -40)}T09:00:00+07:00`);
      const n = Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);
      return create({
        roomId: ids.rooms[room],
        channelId: ids.channels.direct,
        directSource: 'zalo_phone',
        paymentModel: 'direct',
        adults: 2,
        bookerGuestId: guest,
        arrivalDate: from,
        departureDate: to,
        ...(rate ? { nightlyRates: typed(from, n, rate) } : {}),
        ...more,
      });
    };
    const agoda = async (
      room: string,
      from: string,
      to: string,
      amount: number,
      more: Record<string, unknown> = {},
    ) => {
      await at(`${day(from, -40)}T09:00:00+07:00`);
      return create({
        roomId: ids.rooms[room],
        channelId: ids.channels.agoda,
        adults: 2,
        bookerGuestId: guest,
        paymentModel: 'ota_prepaid',
        otaRef: `AN${randomUUID().slice(0, 8)}`,
        otaRoomAmountVnd: amount,
        arrivalDate: from,
        departureDate: to,
        ...more,
      });
    };
    const vc = (room: string) =>
      q(
        `INSERT INTO room_status (room_id, organization_id, property_id, status, since) VALUES ($1, $2, $3, 'VC', $4)
         ON CONFLICT (room_id) DO UPDATE SET status = 'VC'`,
        [ids.rooms[room], t.organizationId, t.propertyIds[0], new Date('2026-10-01T00:00:00Z')],
      );
    const folio = async (folioId: string) => (await c.fd!.get(url(`/folios/${folioId}`))).json();
    const totals = async (b: Booking) =>
      (await folio(b.folioId)).totals as { totalVnd: number; balanceDueVnd: number };
    const payDue = async (b: Booking) => {
      const due = (await totals(b)).balanceDueVnd;
      if (due > 0) {
        const r = await c.fd!.send('POST', url(`/folios/${b.folioId}/payments`), {
          type: 'charge',
          method: 'cash',
          amountVnd: due,
        });
        expect(r.statusCode, r.body).toBe(201);
      }
    };
    /** Plain B9 (the amount shown by the preview paid with it). */
    const stayIn = async (b: Booking, room: string, d: string, time = '15:00') => {
      await at(`${d}T${time}:00+07:00`);
      await vc(room);
      const pv = await c.fd!.get(url(`/reservations/${b.id}/check-in-preview?checkinTime=${time}`));
      expect(pv.statusCode, pv.body).toBe(200);
      const due = pv.json().amountDueAtCheckinVnd as number;
      const ci = await act(b.id, 'check-in', {
        cardsIssued: 1,
        houseRulesSent: true,
        checkinTime: time,
        ...(due > 0 ? { payment: { type: 'charge', method: 'cash', amountVnd: due } } : {}),
      });
      expect(ci.statusCode, ci.body).toBe(200);
    };
    /** B14 the Desk way: dry run, then the write with the delta shown. */
    const b14 = async (
      id: string,
      room: string,
      d: string,
      cause: 'guest_request' | 'property_fault',
      more: Record<string, unknown> = {},
      time = '10:00',
    ) => {
      await at(`${d}T${time}:00+07:00`);
      await vc(room);
      const body = {
        newRoomId: ids.rooms[room],
        effectiveDate: d,
        cause,
        reason: cause === 'guest_request' ? 'Khách xin đổi căn' : 'Điều hòa hỏng',
        ...more,
      };
      const dry = await act(id, 'change-room', { ...body, dryRun: true });
      expect(dry.statusCode, dry.body).toBe(200);
      const res = await act(id, 'change-room', {
        ...body,
        applyDifference: true,
        expectedDeltaVnd: dry.json().folioDeltaVnd,
      });
      expect(res.statusCode, res.body).toBe(200);
    };
    /** B7/B8 the Desk way: preview, then the move with the amount shown. */
    const move = async (b: Booking, body: Record<string, string>, who = 'fd') => {
      const pv = await c[who]!.get(
        url(`/reservations/${b.id}/move-preview?${new URLSearchParams(body)}`),
      );
      expect(pv.statusCode, pv.body).toBe(200);
      const res = await act(
        b.id,
        'move',
        { ...body, applyDifference: true, expectedDeltaVnd: pv.json().folioDeltaVnd },
        who,
      );
      expect(res.statusCode, res.body).toBe(200);
      return pv.json();
    };
    const options = async (b: Booking, d?: string) => {
      if (d) await at(`${d}T10:00:00+07:00`);
      const r = await c.fd!.get(url(`/reservations/${b.id}/extension-options`));
      expect(r.statusCode, r.body).toBe(200);
      return r.json();
    };
    const extend = async (
      b: Booking,
      n: number,
      rates?: Array<{ date: string; amountVnd: number; edited?: boolean }>,
    ) => {
      const r = await act(b.id, 'extend', { nights: n, ...(rates ? { nightlyRates: rates } : {}) });
      expect(r.statusCode, r.body).toBe(200);
    };
    const summary = async (b: Booking, d: string) => {
      await at(`${d}T19:00:00+07:00`);
      const r = await c.fd!.get(url(`/reservations/${b.id}/checkout-summary?checkoutTime=19:00`));
      expect(r.statusCode, r.body).toBe(200);
      return r.json();
    };
    /** B18 19:00 with the extra night left at its default (`extraNight: {}` – ARC 16.18): summary = QR cap = write. */
    const b18 = async (b: Booking, d: string) => {
      const s = await summary(b, d);
      expect(s.extraNightRequired).toBe(true);
      const due = s.amountDueAtCheckoutVnd as number;
      const cap = await c.fd!.send('POST', url(`/folios/${b.folioId}/vietqr`), {
        purpose: 'check_out',
        amountVnd: due + 1,
      });
      expect(cap.statusCode, cap.body).toBe(422);
      expect(cap.json().max).toBe(due);
      const out = await act(b.id, 'check-out', {
        checkoutTime: '19:00',
        extraNight: {},
        ...(due > 0 ? { finalPayment: { type: 'charge', method: 'cash', amountVnd: due } } : {}),
      });
      expect(out.statusCode, out.body).toBe(200);
      expect(await totals(b)).toMatchObject({ balanceDueVnd: 0 });
      return {
        def: s.extraNightDefaultRateVnd as number,
        range: [s.extraNightFloorVnd, s.extraNightCeilingVnd] as number[],
        due,
      };
    };
    /** B9a at 04:30 with the default prior night (no `priorNightRateVnd` – ARC 16.18): preview = QR cap = write. */
    const b9a = async (b: Booking, room: string, d: string) => {
      await at(`${d}T04:30:00+07:00`);
      await vc(room);
      const pv = (await c.fd!.get(url(`/reservations/${b.id}/check-in-preview`))).json();
      const def = pv.priorNight?.defaultRateVnd as number;
      const due = pv.amountDueAtCheckinVnd as number;
      const cap = await c.fd!.send('POST', url(`/folios/${b.folioId}/vietqr`), {
        purpose: 'check_in',
        amountVnd: due + 1,
        addPriorNight: true,
      });
      expect(cap.statusCode, cap.body).toBe(422);
      expect(cap.json().max).toBe(due);
      const ci = await act(b.id, 'check-in', {
        cardsIssued: 1,
        houseRulesSent: true,
        addPriorNight: true,
        expectedSurchargeVnd: def,
        ...(due > 0 ? { payment: { type: 'charge', method: 'cash', amountVnd: due } } : {}),
      });
      expect(ci.statusCode, ci.body).toBe(200);
      return {
        def,
        range: [pv.priorNight?.floorVnd, pv.priorNight?.ceilingVnd] as number[],
        due,
      };
    };
    /** S4-35: a new price on the room line of `date` (MGR). */
    const typeNight = async (b: Booking, date: string, price: number) => {
      const f = await folio(b.folioId);
      const [line] = await q<{ id: string }>(
        `SELECT l.id FROM folio_line l WHERE l.folio_id = $1 AND l.category = 'room' AND l.service_date = $2
            AND l.line_state = 'posted' AND l.reversal_of_id IS NULL
            AND NOT EXISTS (SELECT 1 FROM folio_line x WHERE x.reversal_of_id = l.id)`,
        [b.folioId, date],
      );
      expect(line, `room line ${date}`).toBeTruthy();
      const r = await c.mgr!.send(
        'POST',
        url(`/folios/${b.folioId}/lines/${line!.id}/adjustments`),
        { newUnitPriceVnd: price, reason: 'Giá thỏa thuận lại với khách' },
        { 'if-match': `"${f.version}"` },
      );
      expect(r.statusCode, r.body).toBeLessThan(300);
    };
    const children = async (b: Booking) =>
      (
        await q<{ id: string }>(
          'SELECT id FROM reservation WHERE parent_reservation_id = $1 ORDER BY created_at',
          [b.id],
        )
      ).map((r) => r.id);
    const returnRecorded = async (childId: string, room: string, d: string) => {
      await at(`${d}T10:00:00+07:00`);
      await vc(room);
      const r = await c.fd!.send(
        'PATCH',
        url(`/reservations/${childId}`),
        { roomReturnRecorded: true },
        { 'if-match': `"${(await get(childId)).version}"` },
      );
      expect(r.statusCode, r.body).toBe(200);
    };
    /** stay_night gross of `date` on the booking or one of its children. */
    const grossOn = async (b: Booking, date: string) =>
      Number(
        (
          await q<{ g: string }>(
            `SELECT n.room_revenue_gross_vnd::text AS g FROM stay_night n JOIN reservation r ON r.id = n.reservation_id
              WHERE (r.id = $1 OR r.parent_reservation_id = $1) AND n.stay_date = $2 AND n.night_state <> 'void'`,
            [b.id, date],
          )
        )[0]?.g ?? NaN,
      );
    /** Snapshot source (+ anchor) of a night of the booking or a child. */
    const sourceOf = async (b: Booking, date: string) =>
      (
        await q<{ source: string | null; anchor: string | null }>(
          `SELECT x->>'source' AS source, x->>'anchorRoomId' AS anchor
             FROM reservation r, jsonb_array_elements(r.pricing_snapshot->'nights') x
            WHERE (r.id = $1 OR r.parent_reservation_id = $1) AND x->>'date' = $2`,
          [b.id, date],
        )
      )[0] ?? { source: null, anchor: null };
    const roomTotal = async (b: Booking) => (await get(b.id)).totalRoomVnd as number;
    return {
      t,
      ids,
      c,
      at,
      q,
      get,
      act,
      direct,
      agoda,
      vc,
      totals,
      payDue,
      stayIn,
      b14,
      move,
      options,
      extend,
      summary,
      b18,
      b9a,
      typeNight,
      children,
      returnRecorded,
      grossOn,
      sourceOf,
      roomTotal,
    };
  };
  type W = Awaited<ReturnType<typeof world>>;

  /** The night of `options` (B13) compared with the row: price and the desk's range. */
  const rowNight = (row: Row, n: any, price = row.priceVnd, range = row.deskRangeVnd) => {
    expect(n.defaultRateVnd, `${row.an} price`).toBe(price);
    if (range) expect([n.floorVnd, n.ceilingVnd], `${row.an} range`).toEqual(range);
  };

  // ───────────── shared flows (rows that several rows reuse: AN-09/10/22/34, AN-44/45) ─────────────

  /** AN-09 / AN-44: S4-09 – Agoda 202 Mon–Wed + 2 child nights in 202, the guest asks `temp` until the OTA departure. */
  const s409 = async (
    w: W,
    mon: string,
    temp: string,
    opts: { record?: boolean; ottimoThu?: string; soldFri?: string } = {},
  ) => {
    const ota = await w.agoda('202', mon, day(mon, 2), 1_600_000);
    await w.direct(temp, day(mon, 2), day(mon, 6));
    if (opts.soldFri) await w.direct(opts.soldFri, day(mon, 4), day(mon, 6));
    await w.stayIn(ota, '202', mon);
    await w.at(`${mon}T18:00:00+07:00`);
    await w.extend(ota, 2);
    const [child] = await w.children(ota);
    await w.b14(ota.id, temp, day(mon, 1), 'guest_request', {
      stayScope: 'until_parent_departure',
    });
    if (opts.record !== false) await w.returnRecorded(child!, '202', day(mon, 2));
    if (opts.ottimoThu) await w.b14(ota.id, opts.ottimoThu, day(mon, 3), 'property_fault');
    return { ota, child: child!, fri: day(mon, 4) };
  };
  /** AN-22 / AN-43 / AN-45: agreed 202 at `rate` Tue–Thu, B13 +1 (default unless `typed`), then B18 Fri. */
  const an22 = async (w: W, tue: string, rate: number, typed?: number) => {
    const b = await w.direct('202', tue, day(tue, 2), rate);
    await w.stayIn(b, '202', tue);
    const o = await w.options(b, day(tue, 1));
    await w.extend(
      b,
      1,
      typed !== undefined ? [{ date: day(tue, 2), amountVnd: typed, edited: true }] : undefined,
    );
    return { b, o, thu: day(tue, 2), fri: day(tue, 3) };
  };
  /** AN-34 / AN-45: agreed `room` 650.000 14–16/04/2027, B13 onto Giỗ Tổ, OTTIMO B14 effective 16/04 → `to`. */
  const an34 = async (w: W, room: string, to: string) => {
    const b = await w.direct(room, '2027-04-14', '2027-04-16', 650_000);
    await w.stayIn(b, room, '2027-04-14');
    await w.options(b, '2027-04-15');
    await w.extend(b, 1);
    await w.b14(b.id, to, '2027-04-16', 'property_fault');
    const o = await w.options(b, '2027-04-16');
    return { b, o };
  };
  /** AN-03 / AN-45: agreed 201 at 700.000, 01–04/03/2027, the guest asks 401 on 02/03. */
  const an03 = async (w: W) => {
    const b = await w.direct('201', '2027-03-01', '2027-03-04', 700_000);
    await w.stayIn(b, '201', '2027-03-01');
    await w.b14(b.id, '401', '2027-03-02', 'guest_request');
    return { b, o: await w.options(b, '2027-03-03') };
  };
  /** AN-10 / AN-44 / AN-45: S4-09 back to 202, then OTTIMO 202 → 401 on Thursday. */
  const an10 = (w: W, mon: string, temp = '101', soldFri?: string) =>
    s409(w, mon, temp, { ottimoThu: '401', ...(soldFri ? { soldFri } : {}) });

  // ───────────────────────────── the rows ─────────────────────────────

  const S: Record<string, (row: Row) => Promise<void>> = {
    'AN-01': async (row) => {
      const w = await world();
      const b = await w.direct('202', '2028-01-07', '2028-01-09');
      await w.stayIn(b, '202', '2028-01-07');
      const o = await w.options(b, '2028-01-08');
      expect(o.nights[0].date).toBe('2028-01-09');
      rowNight(row, o.nights[0]);
      expect(o.currentBookingRateVnd).toBeNull();
      await w.extend(b, 1);
      expect(await w.grossOn(b, '2028-01-09')).toBe(row.priceVnd);
      expect((await w.sourceOf(b, '2028-01-09')).source).toBe('default');
    },
    'AN-02': async (row) => {
      const w = await world();
      const b = await w.direct('201', '2027-03-01', '2027-03-04', 700_000);
      await w.stayIn(b, '201', '2027-03-01');
      const o = await w.options(b, '2027-03-03');
      expect(o.nights[0].date).toBe('2027-03-04');
      rowNight(row, o.nights[0]);
      expect(o.currentBookingRateVnd).toBe(row.priceVnd);
    },
    'AN-03': async (row) => {
      const { o } = await an03(await world());
      rowNight(row, o.nights[0]);
      expect(o.currentBookingRateVnd).toBeNull();
    },
    'AN-04': async (row) => {
      const w = await world();
      const b = await w.direct('202', '2028-03-05', '2028-03-08');
      await w.stayIn(b, '202', '2028-03-05');
      await w.b14(b.id, '302', '2028-03-06', 'guest_request');
      await w.b14(b.id, '401', '2028-03-07', 'guest_request');
      const o = await w.options(b, '2028-03-07');
      expect(o.nights[0].date).toBe('2028-03-08');
      rowNight(row, o.nights[0]);
    },
    'AN-05': async (row) => {
      const w = await world();
      const b = await w.direct('201', '2027-03-01', '2027-03-04', 700_000);
      await w.stayIn(b, '201', '2027-03-01');
      await w.b14(b.id, '401', '2027-03-02', 'property_fault');
      rowNight(row, (await w.options(b, '2027-03-03')).nights[0]);
    },
    'AN-06': async (row) => {
      const w = await world();
      const b = await w.direct('302', '2028-03-06', '2028-03-09', 1_000_000);
      await w.stayIn(b, '302', '2028-03-06');
      await w.b14(b.id, '101', '2028-03-07', 'property_fault');
      await w.b14(b.id, '401', '2028-03-08', 'property_fault');
      rowNight(row, (await w.options(b, '2028-03-08')).nights[0]);
    },
    'AN-07': async (row) => {
      const w = await world();
      const b = await w.direct('202', '2028-03-06', '2028-03-09', 650_000);
      await w.stayIn(b, '202', '2028-03-06');
      await w.b14(b.id, '401', '2028-03-07', 'property_fault');
      await w.b14(b.id, '302', '2028-03-08', 'guest_request');
      const o = await w.options(b, '2028-03-08');
      rowNight(row, o.nights[0]);
      expect(o.currentBookingRateVnd).toBeNull();
    },
    'AN-08': async (row) => {
      const w = await world();
      const b = await w.direct('202', '2028-03-06', '2028-03-09');
      await w.stayIn(b, '202', '2028-03-06');
      await w.b14(b.id, '302', '2028-03-07', 'guest_request');
      await w.b14(b.id, '401', '2028-03-08', 'property_fault');
      const o = await w.options(b, '2028-03-08');
      rowNight(row, o.nights[0]);
      expect(o.nights[1]).toMatchObject({ date: '2028-03-10', defaultRateVnd: row.fridayPriceVnd });
    },
    'AN-09': async (row) => {
      const w = await world();
      const r = await s409(w, '2028-07-03', '101');
      const o = await w.options(r.ota, '2028-07-06');
      expect(o.nights[0].date).toBe(r.fri);
      rowNight(row, o.nights[0]);
      expect(o.currentBookingRateVnd).toBeNull();
      const x = await w.b18(r.ota, r.fri);
      expect(x.def).toBe(row.priceVnd);
      expect(await w.grossOn(r.ota, r.fri)).toBe(row.priceVnd);
      expect((await w.totals(r.ota)).totalVnd).toBe(row.totalVnd);
      // Temporary room 302 instead of 101 (an OTA guest moving to a dearer room).
      const w2 = await world();
      const r2 = await s409(w2, '2028-07-03', '302');
      expect((await w2.options(r2.ota, '2028-07-06')).nights[0].defaultRateVnd).toBe(
        row.tempRoom302PriceVnd,
      );
    },
    'AN-10': async (row) => {
      const w = await world();
      const r = await an10(w, '2029-07-02');
      const o = await w.options(r.ota, '2029-07-05');
      rowNight(row, o.nights[0]);
      expect(o.currentBookingRateVnd).toBe(row.currentBookingRateVnd);
      const x = await w.b18(r.ota, r.fri);
      expect(x.def).toBe(row.priceVnd);
      expect(x.range).toEqual(row.deskRangeVnd);
      expect((await w.totals(r.ota)).totalVnd).toBe(row.totalVnd);
      const w2 = await world();
      const r2 = await an10(w2, '2029-07-02', '302');
      expect((await w2.options(r2.ota, '2029-07-05')).nights[0].defaultRateVnd).toBe(
        row.tempRoom302PriceVnd,
      );
      await w2.b18(r2.ota, r2.fri);
      expect((await w2.totals(r2.ota)).totalVnd).toBe(row.tempRoom302FolioVnd);
    },
    'AN-11': async (row) => {
      const w = await world();
      const mon = '2028-08-07';
      const ota = await w.agoda('202', mon, day(mon, 2), 1_600_000);
      await w.direct('302', day(mon, 2), day(mon, 6));
      await w.stayIn(ota, '202', mon);
      await w.at(`${mon}T16:00:00+07:00`);
      await w.extend(ota, 2);
      const [child] = await w.children(ota);
      await w.b14(ota.id, '401', mon, 'property_fault', {}, '17:00');
      await w.b14(ota.id, '302', day(mon, 1), 'guest_request', {
        stayScope: 'until_parent_departure',
      });
      await w.returnRecorded(child!, '401', day(mon, 2));
      const o = await w.options(ota, day(mon, 3));
      expect(o.nights[0].date).toBe(day(mon, 4));
      rowNight(row, o.nights[0]);
    },
    'AN-12': async (row) => {
      const w = await world();
      const r = await s409(w, '2028-09-04', '101', { record: false });
      const o = await w.options(r.ota, '2028-09-06');
      expect(o.nights[0].date).toBe(r.fri);
      // "như AN-09": the Friday night of 202.
      rowNight(row, o.nights[0], 911_000);
      await w.extend(r.ota, 1);
      expect(await w.grossOn(r.ota, r.fri)).toBe(911_000);
    },
    'AN-13': async (row) => {
      const w = await world();
      const mon = '2028-10-02';
      const ota = await w.agoda('203', mon, day(mon, 2), 1_600_000);
      await w.at(`${mon}T23:30:00+07:00`);
      const ns = await w.act(ota.id, 'mark-no-show', {
        contactAttemptNote: 'Gọi 3 lần không nghe máy',
      });
      expect(ns.statusCode, ns.body).toBe(200);
      await w.direct('203', mon, day(mon, 2));
      await w.at(`${mon}T23:35:00+07:00`);
      const rs = await w.act(
        ota.id,
        'restore-no-show',
        { reason: 'Khách tới muộn', allowUnassigned: true },
        'mgr',
      );
      expect(rs.statusCode, rs.body).toBe(200);
      const as = await w.act(
        ota.id,
        'assign-room',
        { roomId: w.ids.rooms['401'], resolution: 'upgraded' },
        'fdl',
      );
      expect(as.statusCode, as.body).toBe(200);
      await w.stayIn(ota, '401', mon, '23:40');
      rowNight(row, (await w.options(ota, day(mon, 1))).nights[0]);
    },
    'AN-14': async (row) => {
      // No R2 command records a guest request into the lane: the shared functions on that history.
      const [r202, r401] = ['202', '401'];
      const at = new Date('2028-03-07T03:00:00Z');
      const history: RoomChange[] = [
        {
          oldRoomId: r202,
          newRoomId: null,
          oldBase: 2,
          newBase: null,
          guestRequest: true,
          changedAt: at,
        },
        {
          oldRoomId: null,
          newRoomId: r401,
          oldBase: null,
          newBase: 4,
          guestRequest: false,
          changedAt: at,
        },
      ];
      const bought = boughtRoomOf(history, r202);
      expect(bought).toBe(r401);
      const cal401 = {
        rateVnd: INPUT.calendarWeekdayVnd['401']!,
        floorVnd: INPUT.floorVnd['401']!,
        ceilingVnd: INPUT.ceilingVnd['401']!,
      };
      const p = addedNightPrice({
        bought: cal401,
        night: cal401,
        sameRoom: bought === r401,
        special: false,
        referenceVnd: null,
      });
      expect(p.rateVnd).toBe(row.priceVnd);
      expect([p.floorVnd, p.ceilingVnd]).toEqual(row.deskRangeVnd);
    },
    'AN-15': async (row) => {
      const w = await world();
      const mon = '2028-10-09';
      // (a) restored into its own room.
      const a = await w.direct('203', mon, day(mon, 2));
      // (b) its room sold again → the unassigned lane → 401 (BR-315 (c)).
      const b = await w.direct('202', mon, day(mon, 2));
      await w.at(`${mon}T23:30:00+07:00`);
      for (const x of [a, b]) {
        const ns = await w.act(x.id, 'mark-no-show', {
          contactAttemptNote: 'Gọi 3 lần không nghe máy',
        });
        expect(ns.statusCode, ns.body).toBe(200);
      }
      await w.direct('202', mon, day(mon, 2));
      await w.at(`${mon}T23:35:00+07:00`);
      expect(
        (await w.act(a.id, 'restore-no-show', { reason: 'Khách tới muộn' }, 'mgr')).statusCode,
      ).toBe(200);
      const rb = await w.act(
        b.id,
        'restore-no-show',
        { reason: 'Khách tới muộn', allowUnassigned: true },
        'mgr',
      );
      expect(rb.statusCode, rb.body).toBe(200);
      const as = await w.act(
        b.id,
        'assign-room',
        { roomId: w.ids.rooms['401'], resolution: 'upgraded' },
        'fdl',
      );
      expect(as.statusCode, as.body).toBe(200);
      await w.stayIn(a, '203', mon, '23:40');
      await w.stayIn(b, '401', mon, '23:45');
      rowNight(row, (await w.options(a, day(mon, 1))).nights[0], row.priceVnd, row.deskRangeAVnd);
      rowNight(
        row,
        (await w.options(b, day(mon, 1))).nights[0],
        row.variantBPriceVnd,
        row.deskRangeBVnd,
      );
    },
    'AN-16': async (row) => {
      // Same room again (B7 dates, S4-35 in 302) is not a move: 302's own range, the agreed (typed) price.
      const w = await world();
      const mon = '2028-11-06';
      const b = await w.direct('302', mon, day(mon, 2), 1_000_000);
      await w.move(b, { departureDate: day(mon, 3), reasonCode: 'guest_request' });
      await w.typeNight(b, day(mon, 2), 950_000);
      await w.stayIn(b, '302', mon);
      const o = await w.options(b, day(mon, 2));
      rowNight(row, o.nights[0], 950_000);
      expect(o.currentBookingRateVnd).toBe(950_000);
      const changes = await w.q(
        `SELECT 1 FROM reservation_change WHERE reservation_id = $1 AND field = 'room'`,
        [b.id],
      );
      expect(changes).toEqual([]);
    },
    'AN-17': async (row) => {
      const w = await world();
      const mon = '2028-11-20';
      const x = await w.direct('203', mon, day(mon, 2));
      const y = await w.agoda('203', mon, day(mon, 2), 1_600_000, { allowUnassigned: true });
      await w.at(`${day(mon, -20)}T10:00:00+07:00`);
      await w.move(x, { roomId: w.ids.rooms['202'] as string, reasonCode: 'property_fault' });
      const as = await w.act(
        y.id,
        'assign-room',
        { roomId: w.ids.rooms['203'], resolution: 'reassigned_same_group' },
        'fdl',
      );
      expect(as.statusCode, as.body).toBe(200);
      await w.stayIn(y, '203', mon);
      rowNight(row, (await w.options(y, day(mon, 1))).nights[0]);
    },
    'AN-18': async (row) => {
      const w = await world();
      const tue = '2028-12-05';
      const agreed = await w.direct('202', tue, day(tue, 3), 650_000);
      const cal = await w.direct('203', tue, day(tue, 3));
      await w.stayIn(agreed, '202', tue);
      await w.stayIn(cal, '203', tue, '15:10');
      await w.b14(agreed.id, '401', day(tue, 1), 'property_fault');
      await w.b14(cal.id, '402', day(tue, 1), 'property_fault', {}, '10:10');
      await w.b14(agreed.id, '202', day(tue, 2), 'property_fault');
      await w.b14(cal.id, '203', day(tue, 2), 'property_fault', {}, '10:10');
      rowNight(row, (await w.options(agreed, day(tue, 2))).nights[0]);
      rowNight(row, (await w.options(cal)).nights[0], row.calendarBookingPriceVnd);
    },
    'AN-19': async (row) => {
      const w = await world();
      const mon = '2029-01-08';
      const a = await w.direct('202', mon, day(mon, 2));
      const other = await w.direct('101', mon, day(mon, 2));
      await w.at(`${day(mon, -10)}T10:00:00+07:00`);
      const sw = await w.c.fdl!.send(
        'POST',
        `${P(w.t)}/reservations/${a.id}/actions/swap-room`,
        {
          otherReservationId: other.id,
          otherVersion: (await w.get(other.id)).version,
          reason: 'Sắp xếp lại căn',
        },
        { 'if-match': `"${(await w.get(a.id)).version}"` },
      );
      expect(sw.statusCode, sw.body).toBe(200);
      await w.stayIn(a, '101', mon);
      rowNight(row, (await w.options(a, day(mon, 1))).nights[0]);
    },
    'AN-20': async (row) => {
      const w = await world();
      // B9a 203 (calendar, S4-35 typed before arrival): the night's own calendar.
      const tue = '2029-01-16';
      const a = await w.direct('203', tue, day(tue, 2));
      await w.at(`${day(tue, -2)}T10:00:00+07:00`);
      await w.typeNight(a, tue, 700_000);
      expect((await w.b9a(a, '203', tue)).def).toBe(row.b9aPriceVnd);
      // B13 201 and B18 101 (calendar, S4-35 in house).
      const mon = '2029-01-22';
      const b = await w.direct('201', mon, day(mon, 2));
      const c = await w.direct('101', mon, day(mon, 2));
      await w.stayIn(b, '201', mon);
      await w.stayIn(c, '101', mon, '15:10');
      await w.at(`${day(mon, 1)}T09:00:00+07:00`);
      await w.typeNight(b, day(mon, 1), 650_000);
      await w.typeNight(c, day(mon, 1), 600_000);
      expect((await w.options(b, day(mon, 1))).nights[0].defaultRateVnd).toBe(row.b13PriceVnd);
      expect((await w.b18(c, day(mon, 2))).def).toBe(row.b18PriceVnd);
    },
    'AN-21': async (row) => {
      const w = await world();
      const mon = '2029-01-22';
      const b = await w.direct('101', mon, day(mon, 3));
      await w.stayIn(b, '101', mon);
      await w.b14(b.id, '401', day(mon, 1), 'property_fault');
      await w.typeNight(b, day(mon, 2), 950_000);
      rowNight(row, (await w.options(b, day(mon, 2))).nights[0]);
    },
    'AN-22': async (row) => {
      // BUG-R2-162: the default night of B13 is not a reference; B18 goes back to the typed 08/08.
      const w = await world();
      const r = await an22(w, '2029-08-07', 792_000);
      expect(r.o.nights[0]).toMatchObject({ date: r.thu, defaultRateVnd: 792_000 });
      expect((await w.sourceOf(r.b, r.thu)).source).toBe('default');
      const x = await w.b18(r.b, r.fri);
      expect(x.def).toBe(row.priceVnd);
      expect(x.range).toEqual(row.deskRangeVnd);
      expect(await w.grossOn(r.b, r.fri)).toBe(row.priceVnd);
      expect((await w.sourceOf(r.b, r.fri)).source).toBe('default');
      expect(await w.roomTotal(r.b)).toBe(row.totalVnd);
      // The desk types 792.000 at B13 (edited – even at the calendar number): a typed night, same price.
      const w2 = await world();
      const t2 = await an22(w2, '2029-08-07', 792_000, 792_000);
      expect((await w2.sourceOf(t2.b, t2.thu)).source).toBe('manual');
      expect((await w2.b18(t2.b, t2.fri)).def).toBe(row.typedSameAtB13PriceVnd);
      // Reverse: agreed 911.000 Thu–Fri, B13 Saturday (default), B18 Sunday.
      const w3 = await world();
      const thu = '2029-08-16';
      const b = await w3.direct('202', thu, day(thu, 2), 911_000);
      await w3.stayIn(b, '202', thu);
      await w3.options(b, day(thu, 1));
      await w3.extend(b, 1);
      expect((await w3.b18(b, day(thu, 3))).def).toBe(row.reverse.priceVnd);
      expect(await w3.roomTotal(b)).toBe(row.reverse.totalVnd);
    },
    'AN-23': async (row) => {
      const w = await world();
      const mon = '2029-09-03';
      const b = await w.direct('202', mon, day(mon, 2), 792_000);
      await w.stayIn(b, '202', mon);
      await w.options(b, day(mon, 1));
      await w.extend(b, 1, [{ date: day(mon, 2), amountVnd: 750_000, edited: true }]);
      const src = await w.sourceOf(b, day(mon, 2));
      expect(src.source).toBe('manual');
      const x = await w.b18(b, day(mon, 3));
      expect(x.def).toBe(row.priceVnd);
      expect(x.range).toEqual(row.deskRangeVnd);
    },
    'AN-24': async (row) => {
      const w = await world();
      const mon = '2029-09-10';
      const b = await w.direct('202', mon, day(mon, 2), 650_000);
      await w.stayIn(b, '202', mon);
      await w.at(`${day(mon, 1)}T09:00:00+07:00`);
      await w.typeNight(b, day(mon, 1), 600_000);
      rowNight(row, (await w.options(b, day(mon, 1))).nights[0]);
    },
    'AN-25': async (row) => {
      const w = await world();
      const mon = '2029-09-17';
      const b = await w.direct('202', mon, day(mon, 3), 650_000);
      await w.stayIn(b, '202', mon);
      await w.b14(b.id, '401', day(mon, 1), 'property_fault');
      await w.typeNight(b, day(mon, 2), 700_000);
      // Typed while the room bought was 202 (the origin): no anchor needed.
      expect(await w.sourceOf(b, day(mon, 2))).toEqual({ source: 'manual', anchor: null });
      rowNight(row, (await w.options(b, day(mon, 2))).nights[0]);
    },
    'AN-26': async (row) => {
      const w = await world();
      const mon = '2029-09-24';
      const b = await w.direct('202', mon, day(mon, 3), 650_000);
      await w.stayIn(b, '202', mon);
      await w.b14(b.id, '302', day(mon, 1), 'guest_request');
      await w.typeNight(b, day(mon, 1), 800_000);
      await w.typeNight(b, day(mon, 2), 800_000);
      expect(await w.sourceOf(b, day(mon, 2))).toEqual({
        source: 'manual',
        anchor: w.ids.rooms['302'],
      });
      rowNight(row, (await w.options(b, day(mon, 2))).nights[0]);
    },
    'AN-27': async (row) => {
      const w = await world();
      const mon = '2029-10-01';
      const ota = await w.agoda('401', mon, day(mon, 2), 2_000_000);
      await w.stayIn(ota, '401', mon);
      const o = await w.options(ota, day(mon, 1));
      rowNight(row, o.nights[0]);
      expect(o.nights[3]).toMatchObject({
        date: day(mon, 5),
        defaultRateVnd: row.saturdayPriceVnd,
      });
      expect(o.currentBookingRateVnd).toBeNull();
    },
    'AN-28': async (row) => {
      const w = await world();
      const mon = '2029-10-08';
      const ota = await w.agoda('203', mon, day(mon, 2), 1_600_000);
      await w.stayIn(ota, '203', mon);
      await w.b14(ota.id, '401', day(mon, 1), 'property_fault');
      rowNight(row, (await w.options(ota, day(mon, 1))).nights[0]);
      const w2 = await world();
      const g = await w2.agoda('202', mon, day(mon, 2), 1_600_000);
      await w2.stayIn(g, '202', mon);
      await w2.b14(g.id, '401', day(mon, 1), 'guest_request');
      expect((await w2.options(g, day(mon, 1))).nights[0].defaultRateVnd).toBe(
        row.guestRequestPriceVnd,
      );
    },
    'AN-29': async (row) => {
      const w = await world();
      const b = await w.direct('202', '2027-04-14', '2027-04-16', 650_000);
      await w.stayIn(b, '202', '2027-04-14');
      const o = await w.options(b, '2027-04-15');
      expect(o.nights[0].date).toBe('2027-04-16');
      rowNight(row, o.nights[0]);
      expect(o.currentBookingRateVnd).toBeNull();
    },
    'AN-30': async (row) => {
      const w = await world();
      const b = await w.direct('202', '2027-04-13', '2027-04-16');
      await w.stayIn(b, '202', '2027-04-13');
      await w.b14(b.id, '401', '2027-04-14', 'property_fault');
      const o = await w.options(b, '2027-04-15');
      expect(o.nights[0].date).toBe('2027-04-16');
      rowNight(row, o.nights[0]);
    },
    'AN-31': async (row) => {
      const w = await world();
      const b = await w.direct('202', '2027-04-14', '2027-04-16', 650_000);
      await w.stayIn(b, '202', '2027-04-14');
      await w.options(b, '2027-04-15');
      await w.extend(b, 1);
      expect(await w.grossOn(b, '2027-04-16')).toBe(1_030_000);
      const x = await w.b18(b, '2027-04-17');
      expect(x.def).toBe(row.priceVnd);
      expect(x.range).toEqual(row.deskRangeVnd);
      expect(await w.roomTotal(b)).toBe(row.totalVnd);
    },
    'AN-32': async (row) => {
      const w = await world();
      const b = await w.direct('201', '2027-04-16', '2027-04-18', 650_000);
      const x = await w.b9a(b, '201', '2027-04-16');
      expect(x.def).toBe(row.priceVnd);
      expect(x.range).toEqual(row.deskRangeVnd);
      expect(await w.grossOn(b, '2027-04-15')).toBe(row.priceVnd);
      expect((await w.sourceOf(b, '2027-04-15')).source).toBe('default');
    },
    'AN-33': async (row) => {
      const w = await world();
      const b = await w.direct('202', '2027-04-14', '2027-04-16', 650_000);
      await w.stayIn(b, '202', '2027-04-14');
      await w.options(b, '2027-04-15');
      await w.extend(b, 1);
      const o = await w.options(b, '2027-04-16');
      expect(o.nights[0]).toMatchObject({ date: '2027-04-17', defaultRateVnd: 650_000 });
      await w.extend(b, 1);
      expect((await w.sourceOf(b, '2027-04-17')).source).toBe('default');
      const x = await w.b18(b, '2027-04-18');
      expect(x.def).toBe(row.priceVnd);
      expect(x.range).toEqual(row.deskRangeVnd);
    },
    'AN-34': async (row) => {
      // BUG-R2-161: the reference night is bound to the room bought, not to the room it sits in now.
      const w = await world();
      const r = await an34(w, '202', '401');
      expect(r.o.nights[0].date).toBe('2027-04-17');
      rowNight(row, r.o.nights[0]);
      expect(r.o.currentBookingRateVnd).toBe(row.currentBookingRateVnd);
      const x = await w.b18(r.b, '2027-04-17');
      expect(x.def).toBe(row.priceVnd);
      expect(await w.roomTotal(r.b)).toBe(row.totalVnd);
      const v = await an34(w, '103', '101');
      expect(v.o.nights[0].defaultRateVnd).toBe(row.variant103to101PriceVnd);
    },
    'AN-35': async (row) => {
      // R5-02 ("ca B"): the default night written in the intermediate room 101 is skipped.
      const w = await world();
      const mon = '2029-07-09';
      const b = await w.direct('302', mon, day(mon, 2), 1_000_000);
      await w.stayIn(b, '302', mon);
      await w.b14(b.id, '101', day(mon, 1), 'property_fault');
      const o1 = await w.options(b, day(mon, 1));
      expect(o1.nights[0]).toMatchObject({ date: day(mon, 2), defaultRateVnd: 667_000 });
      await w.extend(b, 1);
      await w.b14(b.id, '401', day(mon, 2), 'property_fault');
      const o = await w.options(b, day(mon, 2));
      expect(o.nights[0].date).toBe(day(mon, 3));
      rowNight(row, o.nights[0]);
      const x = await w.b18(b, day(mon, 3));
      expect(x.def).toBe(row.priceVnd);
      expect(await w.roomTotal(b)).toBe(row.totalVnd);
    },
    'AN-36': async () => {
      // No reference night: typed nights bound to another room bought, special or default only → the
      // calendar of the room bought (min when the night's room is another).
      const special = (d: string) => d === '2027-04-16';
      const nights = [
        {
          date: '2027-04-13',
          calendarVnd: 650_000,
          source: 'manual' as const,
          anchorRoomId: '202',
        },
        { date: '2027-04-14', calendarVnd: 650_000, source: 'default' as const },
        { date: '2027-04-16', calendarVnd: 650_000, source: 'manual' as const },
      ];
      expect(referenceNightRate(nights, '2027-04-17', 'before', '302', '202', special)).toBeNull();
      const cal = (room: string) => ({
        rateVnd: INPUT.calendarWeekdayVnd[room]!,
        floorVnd: INPUT.floorVnd[room]!,
        ceilingVnd: INPUT.ceilingVnd[room]!,
      });
      expect(
        addedNightPrice({
          bought: cal('302'),
          night: cal('302'),
          sameRoom: true,
          special: false,
          referenceVnd: null,
        }),
      ).toMatchObject({ rateVnd: 917_000, keep: false });
      expect(
        addedNightPrice({
          bought: cal('302'),
          night: cal('401'),
          sameRoom: false,
          special: false,
          referenceVnd: null,
        }),
      ).toMatchObject({ rateVnd: 917_000, keep: true });
    },
    'AN-37': async (row) => {
      // 401's floor was 690.000 when the price was agreed (N base 985.000), 740.000 now.
      const w = await world([
        ['ota_base_rate', { L12: 760_000, N: 985_000, NPLUS: 980_000 }, '2026-10-02'],
        ['ota_base_rate', { L12: 760_000, N: 1_050_000, NPLUS: 980_000 }, '2028-03-01'],
      ]);
      const mon = '2028-03-13';
      const b = await w.direct('401', mon, day(mon, 2), 700_000);
      await w.stayIn(b, '401', mon);
      rowNight(row, (await w.options(b, day(mon, 1))).nights[0]);
    },
    'AN-38': async (row) => {
      const w = await world();
      const mon = '2029-11-05';
      const b = await w.direct('302', mon, day(mon, 3), 1_000_000);
      await w.stayIn(b, '302', mon);
      await w.b14(b.id, '101', day(mon, 1), 'property_fault');
      const o = await w.options(b, day(mon, 2));
      rowNight(row, o.nights[0]);
      expect(o.nights[1]).toMatchObject({ date: day(mon, 4), defaultRateVnd: row.fridayPriceVnd });
      expect(o.nights[0].defaultRateVnd).toBeLessThan(row.notClampedToFloorVnd);
    },
    'AN-39': async (row) => {
      const w = await world();
      const mon = '2029-11-12';
      const b = await w.direct('101', mon, day(mon, 3));
      await w.stayIn(b, '101', mon);
      await w.b14(b.id, '401', day(mon, 1), 'property_fault');
      const o = await w.options(b, day(mon, 2));
      rowNight(row, o.nights[0]);
      expect(o.nights[0].defaultRateVnd).toBeLessThan(row.notClampedToFloorVnd);
    },
    'AN-40': async (row) => {
      // 302's floor was lower when 650.000 was agreed (NPLUS base 920.000), 690.000 now: clamp, then min.
      const w = await world([
        ['ota_base_rate', { L12: 760_000, N: 1_050_000, NPLUS: 920_000 }, '2026-10-02'],
        ['ota_base_rate', { L12: 760_000, N: 1_050_000, NPLUS: 980_000 }, '2028-03-01'],
      ]);
      const mon = '2028-03-13';
      const b = await w.direct('302', mon, day(mon, 3), 650_000);
      await w.stayIn(b, '302', mon);
      await w.b14(b.id, '401', day(mon, 1), 'property_fault');
      rowNight(row, (await w.options(b, day(mon, 2))).nights[0]);
    },
    'AN-41': async (row) => {
      const w = await world();
      const b = await w.direct('101', '2026-11-22', '2026-11-28', undefined, {
        initialPayment: { type: 'deposit', method: 'cash', amountVnd: 1_200_000 },
      });
      const x = await w.b9a(b, '101', '2026-11-22');
      expect(x.def).toBe(row.priceVnd);
      expect(x.range).toEqual(row.deskRangeVnd);
      expect(x.due).toBe(row.amountDueAtCheckinVnd);
      expect(await w.roomTotal(b)).toBe(row.totalVnd);
    },
    'AN-42': async (row) => {
      const w = await world();
      const b = await w.direct('202', '2027-04-13', '2027-04-15', 650_000);
      await w.stayIn(b, '202', '2027-04-13');
      const o = await w.options(b, '2027-04-14');
      const want = row.nightsVnd as Record<string, number>;
      for (const [i, [date, vnd]] of Object.entries(want).entries()) {
        expect(o.nights[i]).toMatchObject({ date, defaultRateVnd: vnd });
        expect([o.nights[i].floorVnd, o.nights[i].ceilingVnd]).toEqual(row.deskRangeVnd);
      }
      await w.extend(b, 2);
      for (const [date, vnd] of Object.entries(want)) expect(await w.grossOn(b, date)).toBe(vnd);
    },
    'AN-43': async (row) => {
      const w = await world();
      const r = await an22(w, '2029-08-07', 792_000);
      const x = await w.b18(r.b, r.fri);
      // extraNightDefaultRateVnd = QR cap (checked in b18) = the night written.
      expect(x.def).toBe(row.priceVnd);
      expect(x.range).toEqual(row.deskRangeVnd);
      expect(await w.grossOn(r.b, r.fri)).toBe(row.priceVnd);
    },
    'AN-44': async (row) => {
      const want = row.lateFeeAsNightVnd as Record<string, number>;
      const [k203, k10, k09] = Object.keys(want);
      // 203 Tue–Thu, the Thursday night sold.
      const w = await world();
      const b = await w.direct('203', '2030-01-15', '2030-01-17');
      await w.direct('203', '2030-01-17', '2030-01-19');
      await w.stayIn(b, '203', '2030-01-15');
      expect((await w.summary(b, '2030-01-17')).lateFeeAsNightVnd).toBe(want[k203!]);
      // AN-10 with 401 sold from Friday.
      const w2 = await world();
      const r10 = await an10(w2, '2029-07-02', '101', '401');
      expect((await w2.summary(r10.ota, r10.fri)).lateFeeAsNightVnd).toBe(want[k10!]);
      // AN-09 with 202 sold from Friday.
      const w3 = await world();
      const r09 = await s409(w3, '2028-07-03', '101', { soldFri: '202' });
      expect((await w3.summary(r09.ota, r09.fri)).lateFeeAsNightVnd).toBe(want[k09!]);
    },
    'AN-45': async (row) => {
      const want = row.currentBookingRateVnd as Record<string, number>;
      const w34 = await world();
      expect((await an34(w34, '202', '401')).o.currentBookingRateVnd).toBe(want['AN-34']);
      const w10 = await world();
      const r10 = await an10(w10, '2029-07-02');
      expect((await w10.options(r10.ota, '2029-07-05')).currentBookingRateVnd).toBe(want['AN-10']);
      const w22 = await world();
      expect((await an22(w22, '2029-08-07', 792_000)).o.currentBookingRateVnd).toBe(want['AN-22']);
      expect(row.currentBookingRateNullFor).toEqual(['AN-09', 'AN-03', 'R5-03c (khách xin 302)']);
      const w09 = await world();
      const r09 = await s409(w09, '2028-07-03', '101');
      expect((await w09.options(r09.ota, '2028-07-06')).currentBookingRateVnd).toBeNull();
      expect((await an03(await world())).o.currentBookingRateVnd).toBeNull();
      const wc = await world();
      const c = await wc.direct('203', '2027-04-14', '2027-04-16', 650_000);
      await wc.stayIn(c, '203', '2027-04-14');
      await wc.options(c, '2027-04-15');
      await wc.extend(c, 1);
      await wc.b14(c.id, '302', '2027-04-16', 'guest_request');
      expect((await wc.options(c, '2027-04-16')).currentBookingRateVnd).toBeNull();
    },
    'AN-46': async (row) => {
      // force_majeure postpone into 401 (OTTIMO): the nights the move adds = B13's price (min with 101).
      const w = await world();
      const mon = '2029-12-03';
      const b = await w.direct('101', mon, day(mon, 3));
      const to = '2030-01-07';
      await w.at(`${day(mon, -20)}T10:00:00+07:00`);
      const pv = await w.move(
        b,
        {
          roomId: w.ids.rooms['401'] as string,
          arrivalDate: to,
          departureDate: day(to, 3),
          mode: 'postpone_instead_of_cancel',
          reasonCode: 'force_majeure',
          note: 'Đèo Prenn đóng – ảnh thông báo',
        },
        'mgr',
      );
      expect(pv.nights.map((n: any) => n.newRateVnd)).toEqual(row.moveThreeNightsVnd);
      await w.stayIn(b, '401', to);
      const o = await w.options(b, day(to, 2));
      rowNight(row, o.nights[0]);
      expect(row.movePlannerEqualsB13).toBe(true);
    },
    'AN-47': async () => {
      // Guest requests in the planner: the new room's calendar per night (no agreed price carried); a date move
      // keeping the room keeps its nights and prices the added one at the current calendar.
      const w = await world();
      const mon = '2030-02-04';
      const a = await w.direct('202', mon, day(mon, 2), 650_000);
      const b = await w.direct('203', mon, day(mon, 2), 650_000);
      await w.at(`${day(mon, -20)}T10:00:00+07:00`);
      const pa = await w.move(a, {
        roomId: w.ids.rooms['302'] as string,
        reasonCode: 'guest_request',
      });
      expect(pa.nights.map((n: any) => n.newRateVnd)).toEqual([917_000, 917_000]);
      await w.move(b, { departureDate: day(mon, 3), reasonCode: 'guest_request' });
      expect([
        await w.grossOn(b, mon),
        await w.grossOn(b, day(mon, 1)),
        await w.grossOn(b, day(mon, 2)),
      ]).toEqual([650_000, 650_000, 792_000]);
    },
  };

  it('the table has 47 rows AN-01…AN-47 and a case each', () => {
    expect(ROWS.map((r) => r.an)).toEqual(
      Array.from({ length: 47 }, (_, i) => `AN-${String(i + 1).padStart(2, '0')}`),
    );
    expect(Object.keys(S).sort()).toEqual(ROWS.map((r) => r.an));
  });

  for (const row of ROWS) {
    it(`${row.an} (${row.source}) – ${row.condition}`, async () => {
      await S[row.an]!(row);
    }, 120_000);
  }

  it('0068 (ARC 16.18): an open stay written before the sources – the S4-35 night typed after a guest move gets the room bought then, the B13 default written `manual` becomes `default`, the booking nights stay typed; B18 then takes the typed 800.000', async () => {
    expect(BACKFILL_0068).toBeDefined();
    const w = await world();
    const mon = '2029-03-05';
    const b = await w.direct('202', mon, day(mon, 3), 650_000);
    await w.stayIn(b, '202', mon);
    await w.b14(b.id, '302', day(mon, 1), 'guest_request');
    await w.typeNight(b, day(mon, 2), 800_000);
    await w.options(b, day(mon, 2));
    await w.extend(b, 1);
    // As the old code left it: no anchor, the B13 default (≠ calendar) written `manual`.
    await w.q(
      `UPDATE reservation SET pricing_snapshot = jsonb_set(pricing_snapshot, '{nights}', (
         SELECT jsonb_agg(CASE WHEN x->>'date' = $2 THEN x - 'anchorRoomId'
                               WHEN x->>'date' = $3 THEN x || '{"source":"manual"}'::jsonb ELSE x END ORDER BY o)
           FROM jsonb_array_elements(pricing_snapshot->'nights') WITH ORDINALITY AS t(x, o)))
        WHERE id = $1`,
      [b.id, day(mon, 2), day(mon, 3)],
    );
    expect(await w.sourceOf(b, day(mon, 2))).toEqual({ source: 'manual', anchor: null });
    expect((await w.sourceOf(b, day(mon, 3))).source).toBe('manual');
    await w.q(BACKFILL_0068 as string);
    expect(await w.sourceOf(b, mon)).toEqual({ source: 'manual', anchor: null });
    expect((await w.sourceOf(b, day(mon, 1))).source).toBe('calendar');
    expect(await w.sourceOf(b, day(mon, 2))).toEqual({
      source: 'manual',
      anchor: w.ids.rooms['302'],
    });
    expect(await w.sourceOf(b, day(mon, 3))).toEqual({ source: 'default', anchor: null });
    const amounts = await w.q<{ t: string }>(
      'SELECT total_room_vnd::text AS t FROM reservation WHERE id = $1',
      [b.id],
    );
    expect(Number(amounts[0]!.t)).toBe(650_000 + 917_000 + 800_000 + 800_000);
    expect((await w.b18(b, day(mon, 4))).def).toBe(800_000);
  }, 120_000);

  it('ARC 16.18 bổ sung: B1 `NightRate.edited` – false = calendar (not agreed), one true = manual_agreed; B13 `edited: false` = default', async () => {
    const w = await world();
    const mon = '2030-03-04';
    const rates = (edited: boolean[]) =>
      edited.map((e, i) => ({ date: day(mon, i), amountVnd: 792_000, edited: e }));
    const none = await w.direct('202', mon, day(mon, 2), undefined, {
      nightlyRates: rates([false, false]),
    });
    const one = await w.direct('203', mon, day(mon, 2), undefined, {
      nightlyRates: rates([false, true]),
    });
    const snap = async (b: Booking) =>
      (
        await w.q<{ s: any }>('SELECT pricing_snapshot AS s FROM reservation WHERE id = $1', [b.id])
      )[0]!.s;
    const s0 = await snap(none);
    expect(s0.bookingRateSource).toBe('calendar');
    expect(s0.nights.map((n: any) => n.source)).toEqual(['calendar', 'calendar']);
    const s1 = await snap(one);
    expect(s1.bookingRateSource).toBe('manual_agreed');
    expect(s1.nights.map((n: any) => n.source)).toEqual(['calendar', 'manual']);
    await w.stayIn(one, '203', mon);
    await w.options(one, day(mon, 1));
    await w.extend(one, 1, [{ date: day(mon, 2), amountVnd: 792_000, edited: false }]);
    expect((await w.sourceOf(one, day(mon, 2))).source).toBe('default');
  }, 120_000);
});
