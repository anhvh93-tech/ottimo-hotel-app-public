/**
 * V5-14 – hold at the price typed at the desk (BUG-R4-041, FB-R4-ARC-FE-PR75-01; OpenAPI 0.3.13 QuoteInput.nightlyRates,
 * createHoldFromQuote; contract-0.3.13 1.3 + 1.17, SEC ARC-01/ARC-06, BE C0313-05), on the real modules + PostgreSQL:
 * - T14-1  typed nights → saved quote → hold: the hold's nights, total and deposit are the typed ones, `manual` nights,
 *          `bookingRateSource = manual_agreed`; T14-11 a night with `edited = false` keeps the server calendar;
 * - T14-2  typed price outside BR-105 → 422 RATE_OUT_OF_RANGE with `dates[]`, `min`, `max`, nothing saved;
 * - T14-4  `type = long` + nightlyRates → 422 NOT_ALLOWED; OTA channel → 422 NOT_IN_LIST (`channelId`);
 * - T14-5  createHoldFromQuote with a price field → 422 NOT_ALLOWED per field, no booking, quote still active; the
 *          order (FB-R5-SEC-BE-S1-03): the same 422 for the caller's quote, another SAL's and an unknown id;
 * - T14-7  oracle: calculateQuote total/deposit = createReservation of the same stay with the same typed prices
 *          (typed price = calendar price BEFORE the BR-107 tier and the BR-111 return code) – a table
 *          (FB-R5-ARC-BE-S1-01): direct, agent, extra persons, a list price changing inside the stay, every night typed;
 * - T14-8/9 internal channel → 422 NOT_IN_LIST with or without typed prices (FD, SAL), nothing saved;
 * - T14-10 a night missing → 422 REQUIRED; dates outside the stay or twice → 422 DATE_INVALID at `nightlyRates[i].date`;
 *          amount ≤ 0 → 422 AMOUNT_NOT_POSITIVE; body rules come before the channel check;
 * T22-1 (createReservation, V5-22) is in v5-22-rate-bounds.test.ts.
 * T14-3/T14-12 (SAL/CTV refused, FD ∪ SAL allowed) are in write-roles-gate.test.ts. FAKE data only.
 */
import { randomBytes } from 'node:crypto';
import { v7 as uuidv7 } from 'uuid';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
import { Client, type FeatureApp, P, startFeatureApp } from '../helpers/feature-app';
import { type SalesIds, seedGuest, seedSales } from '../helpers/sales-fixture';
import { HAS_DB, T0, type TestTenant, appDatabase, createTenant } from '../helpers/tenant';

/** Lầu 1–2 (L12) bounds from `ota_base_rate` 760.000 × 70 % / 250 %, OTA unit 10.000 (BR-105, BUG-R2-018). */
const L12_FLOOR = 530_000;
const L12_CEILING = 1_900_000;
/** Room 202 calendar on a weekday: 9.500.000 / 12 → 792.000 (DS-E, rounding.night_rate 1.000). */
const R202_WEEKDAY = 792_000;

interface Night {
  date: string;
  amountVnd: number;
  calendarRateVnd?: number;
}

/**
 * T14-7 rows (FB-R5-ARC-BE-S1-01): room "305" of Căn N+ with base 2 / max 4 (3 adults + 1 child 6–11 → one extra
 * adult and one extra child, BR-110), list price 11.000.000 / month; and a second list price row of room 301 from
 * 21/01/2027 (1.200.000 / night) so one stay spans two prices. FAKE data only.
 */
async function seedOracleRooms(db: Database, t: TestTenant, ids: SalesIds): Promise<string> {
  return db.withContext(t.ctx(), async (tx) => {
    const id = uuidv7();
    await tx.query(
      `INSERT INTO room (id, organization_id, property_id, room_group_id, room_no, name, base_occupancy,
         max_occupancy, public_slug, active_from, created_at, updated_at)
       VALUES ($1, $2, $3, $4, '305', 'Studio 305', 2, 4, $5, '2026-10-01', $6, $6)`,
      [
        id,
        t.organizationId,
        t.propertyIds[0],
        ids.groups.NPLUS,
        randomBytes(9).toString('base64url'),
        T0,
      ],
    );
    for (const [roomId, from, monthly, nightly] of [
      [id, '2026-10-01', 11_000_000, 917_000],
      [ids.rooms['301'], '2027-01-21', 14_400_000, 1_200_000],
    ] as const) {
      await tx.query(
        `INSERT INTO room_list_price (id, organization_id, property_id, room_id, effective_from,
           monthly_list_price_vnd, nightly_list_price_vnd, reason, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'test', $8, $8)`,
        [uuidv7(), t.organizationId, t.propertyIds[0], roomId, from, monthly, nightly, T0],
      );
    }
    return id;
  });
}

describe.skipIf(!HAS_DB)('V5-14 typed quote prices', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let ids: SalesIds;
  let guestFd: string;
  let guestSal: string;
  let guestSal2: string;
  /** T14-7: a base-2 / max-4 room (BR-110 extra adult + child). */
  let roomX: string;

  beforeAll(async () => {
    db = appDatabase(10);
    t = await createTenant(db, {
      users: {
        owner: ['owner'],
        mgr: ['manager'],
        fdl: ['front_desk_lead'],
        fd: ['front_desk'],
        sal: ['sales_staff'],
        sal2: ['sales_staff'],
        ctv: ['collaborator'],
      },
    });
    ids = await seedSales(db, t);
    guestFd = await seedGuest(db, t, t.users.fd!.id);
    guestSal = await seedGuest(db, t, t.users.sal!.id);
    guestSal2 = await seedGuest(db, t, t.users.sal2!.id);
    roomX = await seedOracleRooms(db, t, ids);
    fa = await startFeatureApp(db);
  });
  afterAll(async () => {
    await fa?.close();
    await db.close();
  });

  const send = (who: string, path: string, body: unknown) =>
    Client.of(fa, t, who).send('POST', `${P(t)}${path}`, body);
  const calc = (who: string, body: Record<string, unknown>) => send(who, '/quotes/calculate', body);
  const short = (extra: Record<string, unknown> = {}) => ({
    type: 'short',
    roomId: ids.rooms['202'],
    arrivalDate: '2026-11-09',
    nights: 3,
    adults: 2,
    channelId: ids.channels.direct,
    ...extra,
  });
  const quoteCount = async (): Promise<number> =>
    Number(
      (
        await db.withContext(t.ctx(), (tx) =>
          tx.query<{ n: string }>('SELECT count(*) AS n FROM quote'),
        )
      ).rows[0]!.n,
    );
  const reservationCount = async (): Promise<number> =>
    Number(
      (
        await db.withContext(t.ctx(), (tx) =>
          tx.query<{ n: string }>('SELECT count(*) AS n FROM reservation'),
        )
      ).rows[0]!.n,
    );

  interface Snapshot {
    bookingRateSource?: string;
    nights?: Array<{ date: string; source: string; amountVnd?: number; calendarVnd?: number }>;
    calendarRatesVnd?: number[];
  }
  const quoteSnapshot = async (id: string): Promise<Snapshot> =>
    (
      await db.withContext(t.ctx(), (tx) =>
        tx.query<{ s: Snapshot }>('SELECT pricing_snapshot AS s FROM quote WHERE id = $1', [id]),
      )
    ).rows[0]!.s;
  const booking = async (id: string) =>
    (
      await db.withContext(t.ctx(), (tx) =>
        tx.query<{
          total_room_vnd: number;
          deposit_required_vnd: number;
          status: string;
          pricing_snapshot: Snapshot;
        }>(
          `SELECT total_room_vnd::int AS total_room_vnd, deposit_required_vnd::int AS deposit_required_vnd,
                  status, pricing_snapshot FROM reservation WHERE id = $1`,
          [id],
        ),
      )
    ).rows[0]!;
  const nightAmounts = async (id: string): Promise<number[]> =>
    (
      await db.withContext(t.ctx(), (tx) =>
        tx.query<{ a: number }>(
          `SELECT room_revenue_gross_vnd::int AS a FROM stay_night WHERE reservation_id = $1
            ORDER BY stay_date`,
          [id],
        ),
      )
    ).rows.map((r) => r.a);

  // ───────────── T14-1 / T14-11 ─────────────
  it('T14-1: typed nights → saveQuote → hold at the typed prices (manual, manual_agreed, deposit on the typed total)', async () => {
    const nightlyRates = [
      { date: '2026-11-09', amountVnd: 700_000, edited: true },
      { date: '2026-11-10', amountVnd: 650_000, edited: true },
      // T14-11: not edited → the server's own calendar, the amount sent is ignored (SEC ARC-06)
      { date: '2026-11-11', amountVnd: 1, edited: false },
    ];
    const preview = await calc('fd', short({ nightlyRates }));
    expect(preview.statusCode, preview.body).toBe(200);
    const q = preview.json();
    expect(q.nightlyRates.map((n: Night) => n.amountVnd)).toEqual([700_000, 650_000, R202_WEEKDAY]);
    expect(q.nightlyRates.map((n: Night) => n.calendarRateVnd)).toEqual([
      700_000,
      650_000,
      R202_WEEKDAY,
    ]);
    expect(q.totalVnd).toBe(2_142_000);
    // BR-305: 30 % of the TYPED room total, rounding.deposit 100.000 (the calendar total 2.376.000 → 700.000)
    expect(q.depositVnd).toBe(600_000);

    const saved = await send('fd', '/quotes', { ...short({ nightlyRates }), guestId: guestFd });
    expect(saved.statusCode, saved.body).toBe(201);
    expect(saved.json()).toMatchObject({ totalVnd: 2_142_000, depositVnd: 600_000 });
    const snap = await quoteSnapshot(saved.json().id);
    expect(snap.bookingRateSource).toBe('manual_agreed');
    expect(snap.nights?.map((n) => n.source)).toEqual(['manual', 'manual', 'calendar']);
    expect(snap.calendarRatesVnd).toEqual([700_000, 650_000, R202_WEEKDAY]);

    const hold = await send('fd', `/quotes/${saved.json().id}/actions/create-hold`, {
      holdHours: 24,
    });
    expect(hold.statusCode, hold.body).toBe(201);
    expect(hold.json()).toMatchObject({
      status: 'hold',
      depositRequiredVnd: 600_000,
      totalRoomVnd: 2_142_000,
    });
    const b = await booking(hold.json().id);
    expect(b).toMatchObject({ total_room_vnd: 2_142_000, deposit_required_vnd: 600_000 });
    expect(await nightAmounts(hold.json().id)).toEqual([700_000, 650_000, R202_WEEKDAY]);
    expect(b.pricing_snapshot.bookingRateSource).toBe('manual_agreed');
    expect(b.pricing_snapshot.nights?.map((n) => [n.source, n.calendarVnd])).toEqual([
      ['manual', 700_000],
      ['manual', 650_000],
      ['calendar', R202_WEEKDAY],
    ]);
  });

  it('a quote without typed prices still holds at the calendar (`calendar`, no manual night)', async () => {
    const saved = await send('fd', '/quotes', {
      ...short({ arrivalDate: '2026-11-23', roomId: ids.rooms['101'] }),
      guestId: guestFd,
    });
    expect(saved.statusCode, saved.body).toBe(201);
    const snap = await quoteSnapshot(saved.json().id);
    expect(snap.bookingRateSource).toBe('calendar');
    expect(snap.nights?.every((n) => n.source === 'calendar')).toBe(true);
    const hold = await send('fd', `/quotes/${saved.json().id}/actions/create-hold`, {
      holdHours: 24,
    });
    expect(hold.statusCode, hold.body).toBe(201);
    const b = await booking(hold.json().id);
    expect(b.pricing_snapshot.bookingRateSource).toBe('calendar');
    expect(b.pricing_snapshot.nights?.every((n) => n.source === 'calendar')).toBe(true);
  });

  // ───────────── T14-2 on the quote ─────────────
  it('T14-2: a typed price outside BR-105 → 422 RATE_OUT_OF_RANGE with dates[], min, max; nothing saved', async () => {
    const quotes = await quoteCount();
    for (const [amount, dates] of [
      [L12_FLOOR - 1_000, ['2026-11-17', '2026-11-18']],
      [L12_CEILING + 1_000, ['2026-11-17', '2026-11-18']],
    ] as const) {
      const body = {
        ...short({
          arrivalDate: '2026-11-16',
          nightlyRates: [
            { date: '2026-11-16', amountVnd: 700_000, edited: true },
            { date: '2026-11-17', amountVnd: amount, edited: true },
            { date: '2026-11-18', amountVnd: amount, edited: true },
          ],
        }),
        guestId: guestFd,
      };
      for (const path of ['/quotes/calculate', '/quotes']) {
        const res = await send('fd', path, body);
        expect(res.statusCode, res.body).toBe(422);
        expect(res.json()).toMatchObject({
          code: 'RATE_OUT_OF_RANGE',
          errors: [{ field: 'nightlyRates', code: 'RATE_OUT_OF_RANGE' }],
          dates,
          min: L12_FLOOR,
          max: L12_CEILING,
        });
      }
    }
    // exactly at the bounds is fine
    const edge = await calc(
      'fd',
      short({
        arrivalDate: '2026-11-16',
        nightlyRates: [
          { date: '2026-11-16', amountVnd: L12_FLOOR, edited: true },
          { date: '2026-11-17', amountVnd: L12_CEILING, edited: true },
          { date: '2026-11-18', amountVnd: R202_WEEKDAY, edited: false },
        ],
      }),
    );
    expect(edge.statusCode, edge.body).toBe(200);
    expect(await quoteCount()).toBe(quotes);
  });

  it('T14-4: typed prices on a long stay → 422 NOT_ALLOWED; OTA channel → 422 NOT_IN_LIST (channelId)', async () => {
    const long = await calc('fd', {
      type: 'long',
      roomId: ids.rooms['202'],
      arrivalDate: '2026-12-01',
      termMonths: 3,
      adults: 1,
      channelId: ids.channels.direct,
      nightlyRates: [{ date: '2026-12-01', amountVnd: 700_000, edited: true }],
    });
    expect(long.statusCode).toBe(422);
    expect(long.json().errors).toEqual([{ field: 'nightlyRates', code: 'NOT_ALLOWED' }]);
    const ota = await calc(
      'fd',
      short({
        channelId: ids.channels.airbnb,
        nightlyRates: [
          { date: '2026-11-09', amountVnd: 700_000, edited: true },
          { date: '2026-11-10', amountVnd: 700_000, edited: true },
          { date: '2026-11-11', amountVnd: 700_000, edited: true },
        ],
      }),
    );
    expect(ota.statusCode).toBe(422);
    expect(ota.json().errors).toEqual([{ field: 'channelId', code: 'NOT_IN_LIST' }]);
  });

  // ───────────── T14-5 ─────────────
  it('T14-5: createHoldFromQuote with a price field → 422 NOT_ALLOWED per field, no booking, quote still active', async () => {
    const saved = await send('sal', '/quotes', {
      ...short({ arrivalDate: '2026-11-30', roomId: ids.rooms['301'] }),
      guestId: guestSal,
    });
    expect(saved.statusCode, saved.body).toBe(201);
    const id = saved.json().id as string;
    const bookings = await reservationCount();
    for (const field of [
      'nightlyRates',
      'rates',
      'rateVnd',
      'amountVnd',
      'totalVnd',
      'depositVnd',
    ]) {
      for (const value of [[], null, 1_000]) {
        const res = await send('sal', `/quotes/${id}/actions/create-hold`, {
          holdHours: 24,
          [field]: value,
        });
        expect(res.statusCode, `${field}=${JSON.stringify(value)} ${res.body}`).toBe(422);
        expect(res.json().errors).toEqual([{ field, code: 'NOT_ALLOWED' }]);
      }
    }
    const several = await send('fd', `/quotes/${id}/actions/create-hold`, {
      holdHours: 24,
      depositVnd: 1,
      nightlyRates: [],
    });
    expect(several.statusCode).toBe(422);
    expect(several.json().errors).toEqual([
      { field: 'nightlyRates', code: 'NOT_ALLOWED' },
      { field: 'depositVnd', code: 'NOT_ALLOWED' },
    ]);
    expect(await reservationCount()).toBe(bookings);
    expect((await Client.of(fa, t, 'sal').get(`${P(t)}/quotes/${id}`)).json()).toMatchObject({
      status: 'active',
    });
    // other unknown fields are still ignored, as before
    const ok = await send('sal', `/quotes/${id}/actions/create-hold`, {
      holdHours: 24,
      note: 'x',
    });
    expect(ok.statusCode, ok.body).toBe(201);
  });

  // ───────────── T14-5 order (FB-R5-SEC-BE-S1-03) ─────────────
  it("T14-5 order: the price-field 422 never depends on the quote (own, another SAL's, none); without the field → 404", async () => {
    const own = await send('sal', '/quotes', {
      ...short({ arrivalDate: '2027-03-01', roomId: ids.rooms['301'] }),
      guestId: guestSal,
    });
    expect(own.statusCode, own.body).toBe(201);
    const other = await send('sal2', '/quotes', {
      ...short({ arrivalDate: '2027-03-08', roomId: ids.rooms['301'] }),
      guestId: guestSal2,
    });
    expect(other.statusCode, other.body).toBe(201);
    const bookings = await reservationCount();
    const unknown = '0190f5a4-1111-7222-8333-444455556666';
    const bodies: string[] = [];
    for (const id of [own.json().id as string, other.json().id as string, unknown]) {
      const res = await send('sal', `/quotes/${id}/actions/create-hold`, {
        holdHours: 24,
        depositVnd: 1,
      });
      expect(res.statusCode, `${id} ${res.body}`).toBe(422);
      const { requestId: _r, ...rest } = res.json();
      bodies.push(JSON.stringify(rest));
    }
    // the same answer for the three quotes: the 422 runs before any read of the quote (no existence probe)
    expect(new Set(bodies).size).toBe(1);
    expect(JSON.parse(bodies[0]!).errors).toEqual([{ field: 'depositVnd', code: 'NOT_ALLOWED' }]);
    // without a price field: another SAL's quote and an unknown id are both 404 (scope M), nothing held
    for (const id of [other.json().id as string, unknown]) {
      const res = await send('sal', `/quotes/${id}/actions/create-hold`, { holdHours: 24 });
      expect(res.statusCode, `${id} ${res.body}`).toBe(404);
    }
    expect(await reservationCount()).toBe(bookings);
  });

  // ───────────── T14-7 oracle (FB-R5-ARC-BE-S1-01 (1): one row per money branch of the quote) ─────────────
  interface OracleCase {
    name: string;
    room: '101' | '202' | '301' | 'X';
    arrivalDate: string;
    departureDate: string;
    nights: number;
    channel: 'direct' | 'agent';
    adults: number;
    children6to11?: number;
    /** typed calendar price per night; 'all' = every night typed (`typedAll`, in date order) */
    typed: Record<string, number> | 'all';
    typedAll?: number[];
    /** quoted amounts of the typed nights after the BR-107 tier (typed price × 90 %) */
    expectTypedVnd: number[];
    /** BR-110 fee per night (0 = no extra person) */
    extraPerNightVnd: number;
  }
  const T14_7: OracleCase[] = [
    {
      name: 'direct, 2 adults, one list price, 2 nights typed + 5 calendar',
      room: '101',
      arrivalDate: '2026-12-07',
      departureDate: '2026-12-14',
      nights: 7,
      channel: 'direct',
      adults: 2,
      typed: { '2026-12-07': 700_000, '2026-12-08': 690_000 },
      expectTypedVnd: [630_000, 621_000],
      extraPerNightVnd: 0,
    },
    {
      name: 'agent channel (CTV closer)',
      room: '202',
      arrivalDate: '2027-01-04',
      departureDate: '2027-01-11',
      nights: 7,
      channel: 'agent',
      adults: 2,
      typed: { '2027-01-04': 800_000, '2027-01-05': 760_000 },
      expectTypedVnd: [720_000, 684_000],
      extraPerNightVnd: 0,
    },
    {
      name: '3 adults + 1 child 6–11 on a base-2 room (BR-110 extra persons)',
      room: 'X',
      arrivalDate: '2027-01-04',
      departureDate: '2027-01-11',
      nights: 7,
      channel: 'direct',
      adults: 3,
      children6to11: 1,
      typed: { '2027-01-05': 900_000 },
      expectTypedVnd: [810_000],
      // DS-E: extra_adult_fee 150.000 + child_fee_6_11 100.000 (adults fill the base first)
      extraPerNightVnd: 250_000,
    },
    {
      name: 'list price changes inside the stay (two effective_from rows)',
      room: '301',
      arrivalDate: '2027-01-18',
      departureDate: '2027-01-25',
      nights: 7,
      channel: 'direct',
      adults: 2,
      typed: { '2027-01-19': 1_000_000 },
      expectTypedVnd: [900_000],
      extraPerNightVnd: 0,
    },
    {
      name: 'every night typed',
      room: '101',
      arrivalDate: '2027-01-11',
      departureDate: '2027-01-18',
      nights: 7,
      channel: 'direct',
      adults: 2,
      typed: 'all',
      typedAll: [700_000, 720_000, 740_000, 760_000, 780_000, 800_000, 820_000],
      expectTypedVnd: [630_000, 648_000, 666_000, 684_000, 702_000, 720_000, 738_000],
      extraPerNightVnd: 0,
    },
  ];
  /**
   * The booking's BR-110 money: the booking-level fee of the pricing snapshot (createReservation – PricingService
   * `extraPersonFeeVnd`); no night carries its own fee here (`stay_night.extra_person_fee_vnd` NULL – only a moved
   * night does, S4-07).
   */
  const extraFees = async (id: string): Promise<number> => {
    const { rows } = await db.withContext(t.ctx(), (tx) =>
      tx.query<{ snap: string | null; own: string | null }>(
        `SELECT r.pricing_snapshot->>'extraPersonFeeVnd' AS snap,
                (SELECT sum(n.extra_person_fee_vnd) FROM stay_night n WHERE n.reservation_id = r.id) AS own
           FROM reservation r WHERE r.id = $1`,
        [id],
      ),
    );
    expect(rows[0]!.own).toBeNull();
    return Number(rows[0]!.snap ?? 0);
  };

  it.each(T14_7)(
    'T14-7 ($name): calculateQuote with typed prices = createReservation of the same stay',
    async (c) => {
      const roomId = c.room === 'X' ? roomX : ids.rooms[c.room];
      const channelId = c.channel === 'agent' ? ids.channels.collaborator : ids.channels.direct;
      const party = { adults: c.adults, children6to11: c.children6to11 ?? 0 };
      const stay = { roomId, arrivalDate: c.arrivalDate, nights: c.nights, channelId, ...party };
      const plain = (await calc('fd', short(stay))).json();
      expect(plain.losDiscountPct).toBe(10);
      const calendar = plain.nightlyRates as Night[];
      expect(calendar).toHaveLength(c.nights);
      const typedAt: Record<string, number> =
        c.typed === 'all'
          ? Object.fromEntries(calendar.map((n, i) => [n.date, c.typedAll![i]!]))
          : c.typed;
      const nightlyRates = calendar.map((n) =>
        typedAt[n.date] !== undefined
          ? { date: n.date, amountVnd: typedAt[n.date]!, edited: true }
          : { date: n.date, amountVnd: n.calendarRateVnd!, edited: false },
      );
      const q = await calc('fd', short({ ...stay, nightlyRates }));
      expect(q.statusCode, q.body).toBe(200);
      const quoted = q.json();
      expect(quoted.losDiscountPct).toBe(10);
      const typedIdx = calendar
        .map((n, i) => (typedAt[n.date] !== undefined ? i : -1))
        .filter((i) => i >= 0);
      expect(typedIdx.map((i) => quoted.nightlyRates[i].amountVnd)).toEqual(c.expectTypedVnd);
      // the nights not typed are the server calendar, as in the plain quote
      calendar.forEach((n, i) => {
        if (!typedIdx.includes(i)) expect(quoted.nightlyRates[i]).toEqual(n);
      });
      expect(quoted.extraPersonFeeVnd).toBe(c.extraPerNightVnd * c.nights);

      const created = await send('fd', '/reservations', {
        roomId,
        channelId,
        ...(c.channel === 'direct' ? { directSource: 'zalo_phone' } : {}),
        ...(c.channel === 'agent' ? { closerUserId: t.users.ctv!.id } : {}),
        arrivalDate: c.arrivalDate,
        departureDate: c.departureDate,
        ...party,
        bookerGuestId: guestFd,
        paymentModel: 'direct',
        nightlyRates,
        initialPayment: { type: 'deposit', method: 'cash', amountVnd: quoted.depositVnd },
      });
      expect(created.statusCode, created.body).toBe(201);
      const id = created.json().id as string;
      const b = await booking(id);
      // total = room money + BR-110 extra persons; the deposit (BR-305) is on the room money only
      expect(b.total_room_vnd + (await extraFees(id))).toBe(quoted.totalVnd);
      expect(await extraFees(id)).toBe(quoted.extraPersonFeeVnd);
      expect(b.deposit_required_vnd).toBe(quoted.depositVnd);
      expect(await nightAmounts(id)).toEqual(quoted.nightlyRates.map((n: Night) => n.amountVnd));
      expect(b.pricing_snapshot.bookingRateSource).toBe('manual_agreed');
    },
  );

  it('T14-7 (list price row): the calendar of room 301 changes on 21/01 – the case above spans two prices', async () => {
    const plain = (
      await calc('fd', short({ roomId: ids.rooms['301'], arrivalDate: '2027-01-18', nights: 7 }))
    ).json();
    const byDate = Object.fromEntries(
      (plain.nightlyRates as Night[]).map((n) => [n.date, n.calendarRateVnd]),
    );
    // Wed 20/01 on 11.500.000 / 12 → 958.000; Thu 21/01 on the new row 1.200.000 (weekdays, no uplift)
    expect(byDate['2027-01-20']).toBe(958_000);
    expect(byDate['2027-01-21']).toBe(1_200_000);
  });

  it('BR-111: the return-guest % applies on the typed price (typed = calendar price)', async () => {
    const q = await calc(
      'fd',
      short({
        arrivalDate: '2026-12-21',
        returnGuestCode: 'OTTIMO-BACK5',
        nightlyRates: [
          { date: '2026-12-21', amountVnd: 700_000, edited: true },
          { date: '2026-12-22', amountVnd: R202_WEEKDAY, edited: false },
          { date: '2026-12-23', amountVnd: R202_WEEKDAY, edited: false },
        ],
      }),
    );
    expect(q.statusCode, q.body).toBe(200);
    expect(q.json().losDiscountPct).toBe(5);
    expect(q.json().nightlyRates.map((n: Night) => [n.amountVnd, n.calendarRateVnd])).toEqual([
      [665_000, 700_000],
      [752_000, R202_WEEKDAY],
      [752_000, R202_WEEKDAY],
    ]);
  });

  // ───────────── T14-8 / T14-9 ─────────────
  it('T14-8 / T14-9: internal channel → 422 NOT_IN_LIST with or without typed prices; nothing saved', async () => {
    const quotes = await quoteCount();
    const typed = [
      { date: '2026-11-09', amountVnd: 700_000, edited: true },
      { date: '2026-11-10', amountVnd: 700_000, edited: true },
      { date: '2026-11-11', amountVnd: 700_000, edited: true },
    ];
    for (const [who, extra, guestId] of [
      ['fd', { nightlyRates: typed }, guestFd],
      ['fd', {}, guestFd],
      ['sal', {}, guestSal],
    ] as const) {
      for (const path of ['/quotes/calculate', '/quotes']) {
        const res = await send(who, path, {
          ...short({ channelId: ids.channels.internal, ...extra }),
          guestId,
        });
        expect(res.statusCode, `${who} ${path} ${res.body}`).toBe(422);
        expect(res.json().errors).toEqual([{ field: 'channelId', code: 'NOT_IN_LIST' }]);
      }
    }
    expect(await quoteCount()).toBe(quotes);
  });

  // ───────────── T14-10 and body rules ─────────────
  it('T14-10: a night missing → 422 REQUIRED (also `[]`); body rules come before the channel check', async () => {
    for (const nightlyRates of [
      [
        { date: '2026-11-09', amountVnd: 700_000, edited: true },
        { date: '2026-11-10', amountVnd: 700_000, edited: true },
      ],
      [],
    ]) {
      for (const channelId of [ids.channels.direct, ids.channels.internal]) {
        const res = await calc('fd', short({ channelId, nightlyRates }));
        expect(res.statusCode).toBe(422);
        expect(res.json().errors).toEqual([{ field: 'nightlyRates', code: 'REQUIRED' }]);
      }
    }
  });

  it('a date outside the stay or twice → 422 DATE_INVALID at nightlyRates[i].date', async () => {
    const outside = await calc(
      'fd',
      short({
        nightlyRates: [
          { date: '2026-11-09', amountVnd: 700_000, edited: true },
          { date: '2026-11-10', amountVnd: 700_000, edited: true },
          { date: '2026-11-12', amountVnd: 700_000, edited: true },
        ],
      }),
    );
    expect(outside.statusCode).toBe(422);
    expect(outside.json().errors).toEqual([
      { field: 'nightlyRates[2].date', code: 'DATE_INVALID' },
    ]);
    const twice = await calc(
      'fd',
      short({
        nightlyRates: [
          { date: '2026-11-09', amountVnd: 700_000, edited: true },
          { date: '2026-11-09', amountVnd: 710_000, edited: true },
          { date: '2026-11-10', amountVnd: 700_000, edited: true },
          { date: '2026-11-11', amountVnd: 700_000, edited: true },
        ],
      }),
    );
    expect(twice.statusCode).toBe(422);
    expect(twice.json().errors).toEqual([{ field: 'nightlyRates[1].date', code: 'DATE_INVALID' }]);
  });

  it('amount ≤ 0 → 422 AMOUNT_NOT_POSITIVE (typed or not); a non-integer amount → 422', async () => {
    for (const [amount, edited] of [
      [0, true],
      [-700_000, true],
      [0, false],
    ] as const) {
      const res = await calc(
        'fd',
        short({
          nightlyRates: [
            { date: '2026-11-09', amountVnd: amount, edited },
            { date: '2026-11-10', amountVnd: 700_000, edited: true },
            { date: '2026-11-11', amountVnd: 700_000, edited: true },
          ],
        }),
      );
      expect(res.statusCode).toBe(422);
      expect(res.json().errors).toEqual([{ field: 'nightlyRates', code: 'AMOUNT_NOT_POSITIVE' }]);
    }
    const frac = await calc(
      'fd',
      short({ nightlyRates: [{ date: '2026-11-09', amountVnd: 700_000.5, edited: true }] }),
    );
    expect(frac.statusCode).toBe(422);
    expect(frac.json().code).toBe('VALIDATION_FAILED');
  });
});
