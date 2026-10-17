/**
 * EP11 R2 (BE-B Sprint 2) on Nest/Fastify + PostgreSQL: listChannels, calculateQuote (oracle
 * tests/fixtures/br-examples.json – BR-107, 108, 110, 111, 113, 305, 903), saveQuote / list / get / text /
 * withdraw (BR-304, BR-006, scope M), createHoldFromQuote (BR-302, US-084) through BE-A's reservations
 * port (real module: occupancy, hold nights, folio hook), leads (SM-09).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
import {
  Client,
  type FeatureApp,
  P,
  TEST_PASSWORD,
  setPassword,
  startFeatureApp,
} from '../helpers/feature-app';
import { type SalesIds, refreshSessions, seedGuest, seedSales } from '../helpers/sales-fixture';
import { HAS_DB, T0, type TestTenant, appDatabase, createTenant } from '../helpers/tenant';

interface Example {
  id: string;
  expected: Record<string, unknown>;
}
const oracle = JSON.parse(
  readFileSync(join(__dirname, '../../../../tests/fixtures/br-examples.json'), 'utf8'),
) as { examples: Example[] };
const ex = (id: string) => {
  const e = oracle.examples.find((x) => x.id === id);
  if (!e) throw new Error(`oracle ${id} missing`);
  return e.expected;
};

describe.skipIf(!HAS_DB)('sales – quotes, holds, leads (EP11 R2)', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let ids: SalesIds;
  let guestSal: string;
  let guestCtv: string;
  let guestFd: string;
  let guestNoPhone: string;

  beforeAll(async () => {
    db = appDatabase(10);
    t = await createTenant(db, {
      users: {
        owner: ['owner'],
        mgr: ['manager'],
        fd: ['front_desk'],
        sal: ['sales_staff'],
        sal2: ['sales_staff'],
        ctv: ['collaborator'],
        hk: ['housekeeping'],
      },
    });
    ids = await seedSales(db, t);
    guestSal = await seedGuest(db, t, t.users.sal!.id, { name: 'Mai Anh' });
    guestCtv = await seedGuest(db, t, t.users.ctv!.id, { name: 'Minh Anh' });
    guestFd = await seedGuest(db, t, t.users.fd!.id);
    guestNoPhone = await seedGuest(db, t, t.users.sal!.id, { phone: null });
    fa = await startFeatureApp(db);
  });
  afterAll(async () => {
    await fa?.close();
    await db.close();
  });

  const calc = (who: string, body: Record<string, unknown>) =>
    Client.of(fa, t, who).send('POST', `${P(t)}/quotes/calculate`, body);
  const at = async (iso: string) => {
    const d = new Date(iso);
    await refreshSessions(db, t, d);
    fa.clock.set(d);
  };
  const back = () => at(T0.toISOString());
  const short = (extra: Record<string, unknown> = {}) => ({
    type: 'short',
    roomId: ids.rooms['202'],
    arrivalDate: '2026-11-09',
    nights: 7,
    adults: 2,
    channelId: ids.channels.direct,
    ...extra,
  });

  /** A hold on a room (FD quote + hold) – occupies the room for the availability tests. */
  async function holdOn(room: '101' | '202', arrivalDate: string, nights: number): Promise<string> {
    const c = Client.of(fa, t, 'fd');
    const q = await c.send('POST', `${P(t)}/quotes`, {
      ...short({ roomId: ids.rooms[room], arrivalDate, nights }),
      guestId: guestFd,
    });
    expect(q.statusCode, q.body).toBe(201);
    const h = await c.send('POST', `${P(t)}/quotes/${q.json().id}/actions/create-hold`, {
      holdHours: 48,
    });
    expect(h.statusCode, h.body).toBe(201);
    return h.json().id;
  }

  // ───────────── channels ─────────────
  it('listChannels: FD sees the channel fee rate (BR-901), SAL/CTV do not (x-visible-to)', async () => {
    const fd = (await Client.of(fa, t, 'fd').get(`${P(t)}/channels`)).json();
    const airbnb = fd.data.find((c: { code: string }) => c.code === 'airbnb');
    expect(airbnb).toMatchObject({
      channelGroup: 'ota',
      requiresOtaRef: true,
      commissionRatePct: 15.5,
    });
    const sal = (await Client.of(fa, t, 'sal').get(`${P(t)}/channels`)).json();
    expect(sal.data.find((c: { code: string }) => c.code === 'airbnb')).not.toHaveProperty(
      'commissionRatePct',
    );
    expect((await Client.of(fa, t, 'hk').get(`${P(t)}/channels`)).statusCode).toBe(403);
  });

  // ───────────── calculateQuote – oracle ─────────────
  it('BR-107-01 / BR-305-01: 202, 7 nights 9–16/11 direct → 5.205.000, nightly 713/820k, deposit 1.600.000', async () => {
    const res = await calc('fd', short());
    expect(res.statusCode, res.body).toBe(200);
    const q = res.json();
    const e107 = ex('BR-107-01');
    expect(q.nightlyRates.map((n: { amountVnd: number }) => n.amountVnd)).toEqual(
      e107.discountedNightlyRatesVnd,
    );
    expect(q.totalVnd).toBe(e107.roomTotalVnd);
    expect(q.losDiscountPct * 100).toBe(e107.discountBp);
    expect(q.depositVnd).toBe(ex('BR-305-01').depositVnd);
    // FD/FDL never see commission (SR-AZ-04); no closer → no commission at all.
    expect(q).not.toHaveProperty('commission');
    expect(q.ottimoRemainingVnd).toBe(5_205_000);
    expect(q.availability).toEqual({ available: true, alternatives: ['101', '301', '302'] });
  });

  it('BR-107-02: 14 nights → 9.826.000 (−15 %)', async () => {
    const q = (await calc('fd', short({ nights: 14 }))).json();
    expect(q.totalVnd).toBe(ex('BR-107-02').roomTotalVnd);
    expect(q.losDiscountPct).toBe(15);
  });

  it('BR-108-01: 20 nights → 14.066.000 + one-month alternative 9.800.000 (not mandatory)', async () => {
    const q = (await calc('fd', short({ nights: 20 }))).json();
    const e = ex('BR-108-01');
    expect(q.totalVnd).toBe(e.shortStayTotalVnd);
    expect(q.longStayAlternative).toEqual({
      termMonths: 1,
      totalVnd: e.oneMonthRentPlusServiceVnd,
      mandatory: false,
    });
  });

  it('BR-903-01 / US-080 AC2: CTV closer 8 % = 416.400, no "OTTIMO còn lại"; SAL sees 3 % and the remainder', async () => {
    const ctv = (await calc('ctv', short({ channelId: ids.channels.collaborator }))).json();
    expect(ctv.commission).toEqual({
      ratePct: 8,
      baseVnd: 5_205_000,
      amountVnd: ex('BR-903-01').commissionVnd,
      ruleRef: 'BR-903',
    });
    expect(ctv).not.toHaveProperty('ottimoRemainingVnd');
    const sal = (await calc('sal', short())).json();
    expect(sal.commission.amountVnd).toBe(156_150);
    expect(sal.ottimoRemainingVnd).toBe(5_205_000 - 156_150);
    // A SAL/CTV quotes as the closer – naming another closer is refused.
    const other = await calc('sal', short({ closerUserId: t.users.sal2!.id }));
    expect(other.statusCode).toBe(422);
    expect(other.json().errors).toEqual([{ field: 'closerUserId', code: 'NOT_IN_LIST' }]);
  });

  it('BR-110: extra persons by room base occupancy, under-6 not counted, capacity = base + 1', async () => {
    const tue = { arrivalDate: '2026-11-10', nights: 3 };
    const r202 = (await calc('fd', short({ ...tue, adults: 3 }))).json();
    expect(r202.totalVnd - 3 * 792_000).toBe(ex('BR-110-01').extraPersonFeeVnd);
    expect(r202.depositVnd).toBe(700_000); // 30 % of 2.376.000 room only (BR-305)
    const r302 = (await calc('fd', short({ ...tue, roomId: ids.rooms['302'], adults: 3 }))).json();
    expect(r302.totalVnd - 3 * 917_000).toBe(ex('BR-110-03').extraPersonFeeVnd);
    const r301 = (
      await calc('fd', short({ ...tue, roomId: ids.rooms['301'], adults: 4, children6to11: 1 }))
    ).json();
    expect(r301.totalVnd - 3 * 958_000).toBe(ex('BR-110-02').extraPersonFeeVnd);
    const under6 = (await calc('fd', short({ ...tue, adults: 2, childrenUnder6: 1 }))).json();
    expect(under6.totalVnd).toBe(3 * 792_000);
    const tooMany = await calc('fd', short({ ...tue, adults: 4 }));
    expect(tooMany.statusCode).toBe(422);
    expect(tooMany.json()).toMatchObject({
      roomNo: '202',
      max: 3,
      code: 'CAPACITY_EXCEEDED',
      errors: [{ field: 'adults', code: 'CAPACITY_EXCEEDED' }],
    });
  });

  it('BR-305-02: one extra adult in 202 for 7 nights – deposit unchanged, total + 1.050.000', async () => {
    const q = (await calc('fd', short({ adults: 3 }))).json();
    const e = ex('BR-305-02');
    expect(q.depositVnd).toBe(e.depositVnd);
    expect(q.totalVnd).toBe(5_205_000 + 1_050_000);
    expect(q.totalVnd - q.depositVnd).toBe(e.dueAtCheckinVnd);
  });

  it('BR-111: return code not stacked with LOS (7 nights keeps −10 %), applied alone on 3 nights, invalid/agent refused', async () => {
    const seven = (await calc('fd', short({ returnGuestCode: 'OTTIMO-BACK5' }))).json();
    expect(seven.losDiscountPct * 100).toBe(ex('BR-111-01').appliedDiscountBp);
    expect(seven.warnings).toContain('return_code_not_applied');
    const three = (
      await calc(
        'fd',
        short({ arrivalDate: '2026-11-10', nights: 3, returnGuestCode: 'ottimo-back5' }),
      )
    ).json();
    expect(three.losDiscountPct).toBe(5);
    expect(three.totalVnd).toBe(3 * 752_000); // 792.000 × 0,95 = 752.400 → 752.000
    const bad = await calc('fd', short({ returnGuestCode: 'WRONG' }));
    expect(bad.json().errors).toEqual([{ field: 'returnGuestCode', code: 'RETURN_CODE_INVALID' }]);
    const agent = await calc(
      'ctv',
      short({ channelId: ids.channels.collaborator, returnGuestCode: 'OTTIMO-BACK5' }),
    );
    expect(agent.statusCode).toBe(422);
  });

  it('BR-113: Saturday arrival for 1 night → MIN_STAY_NOT_MET, unless it fills an orphan gap', async () => {
    const sat = short({ arrivalDate: '2026-10-24', nights: 1 });
    const res = await calc('fd', sat);
    expect(res.statusCode).toBe(422);
    expect(res.json().errors).toEqual([{ field: 'nights', code: 'MIN_STAY_NOT_MET' }]);
    // 202 booked 22–24/10 and 25–27/10: the night of 24/10 is an orphan gap (BR-113-02).
    await holdOn('202', '2026-10-22', 2);
    await holdOn('202', '2026-10-25', 2);
    const ok = await calc('fd', sat);
    expect(ok.statusCode, ok.body).toBe(200);
    expect(ok.json().warnings).toContain('min_stay_orphan_night_exception');
    // 101 has no neighbours that night → still refused (BR-113-03 spirit).
    const r101 = await calc('fd', { ...sat, roomId: ids.rooms['101'] });
    expect(r101.statusCode).toBe(422);
    // 0.3.5 A-02/A-05: minimum + the room whose gap fits (orphan night) as a suggestion.
    expect(r101.json()).toMatchObject({
      minStayNights: 2,
      suggestions: [expect.objectContaining({ roomNo: '202', orphanNight: true })],
    });
    // A-05: a GROUP quote below the minimum stay picks the orphan-night room (202, not the first free 101).
    const group = await calc('fd', { ...sat, roomId: undefined, roomGroupId: ids.groups.L12 });
    expect(group.statusCode, group.body).toBe(200);
    expect(group.json()).toMatchObject({ roomId: ids.rooms['202'], roomNo: '202' });
  });

  it('dates, window, long stay, channel, type: field errors (US-080 AC4)', async () => {
    const past = await calc('fd', short({ arrivalDate: '2026-10-14' }));
    expect(past.json().errors).toEqual([{ field: 'arrivalDate', code: 'DATE_IN_PAST' }]);
    const far = await calc('fd', short({ arrivalDate: '2027-10-15' }));
    expect(far.json().code).toBe('OUTSIDE_BOOKING_WINDOW');
    const lastDay = await calc('fd', short({ arrivalDate: '2027-10-14', nights: 2 }));
    expect(lastDay.statusCode, lastDay.body).toBe(200);
    const long = await calc('fd', short({ nights: 28 }));
    expect(long.json().errors).toEqual([{ field: 'nights', code: 'LONG_STAY_REQUIRES_CONTRACT' }]);
    const ota = await calc('fd', short({ channelId: ids.channels.airbnb }));
    expect(ota.json().errors).toEqual([{ field: 'channelId', code: 'NOT_IN_LIST' }]);
    const longType = await calc('fd', short({ type: 'long', termMonths: 6 }));
    expect(longType.json().errors).toEqual([{ field: 'type', code: 'NOT_IN_LIST' }]);
    expect((await calc('hk', short())).statusCode).toBe(403);
  });

  it('US-082: booked room → not available + alternatives; group quote takes the first free room', async () => {
    await holdOn('202', '2026-12-01', 3);
    const dec = { arrivalDate: '2026-12-01', nights: 3 };
    const q = (await calc('fd', short(dec))).json();
    expect(q.availability.available).toBe(false);
    expect(q.availability.alternatives[0]).toBe('101');
    const g = (
      await calc('fd', short({ ...dec, roomId: undefined, roomGroupId: ids.groups.L12 }))
    ).json();
    expect(g.availability.available).toBe(true);
    expect(g.totalVnd).toBe(3 * 667_000); // room 101 (BR-101: 8.000.000 ÷ 12)
  });

  // ───────────── saveQuote / list / get / text / withdraw ─────────────
  let salQuote: { id: string; code: string; leadId: string };

  it('saveQuote (Q1): BG- code, active, expires 00:00 three days later (BR-304-01), lead created → quoted', async () => {
    const res = await Client.of(fa, t, 'sal').send('POST', `${P(t)}/quotes`, {
      ...short(),
      guestId: guestSal,
    });
    expect(res.statusCode, res.body).toBe(201);
    const q = res.json();
    expect(q.code).toMatch(/^BG-\d{5}$/);
    expect(q.status).toBe('active');
    expect(q.totalVnd).toBe(5_205_000);
    expect(q.commission.amountVnd).toBe(156_150);
    expect(q.expiresAt).toBe(
      `${ex('BR-304-01').expiredFrom}`.replace(':00+07:00', ':00.000+07:00'),
    );
    expect(q.leadId).toBeDefined();
    salQuote = { id: q.id, code: q.code, leadId: q.leadId };
    const leads = (await Client.of(fa, t, 'sal').get(`${P(t)}/leads`)).json();
    expect(leads.data.find((l: { id: string }) => l.id === q.leadId)).toMatchObject({
      status: 'quoted',
      guestId: guestSal,
      guestDisplayName: 'Mai Anh',
    });
    // Audit (state) with the quote code.
    const { rows } = await db.withContext(t.ctx(), (tx) =>
      tx.query(`SELECT action FROM audit_event WHERE entity_code = $1`, [q.code]),
    );
    expect(rows.map((r) => r.action)).toContain('quote.saved');
  });

  it('saveQuote: SAL cannot quote a guest of someone else; replay of the same key returns the same quote', async () => {
    const other = await Client.of(fa, t, 'sal').send('POST', `${P(t)}/quotes`, {
      ...short(),
      guestId: guestCtv,
    });
    expect(other.statusCode).toBe(422);
    expect(other.json().errors).toEqual([{ field: 'guestId', code: 'NOT_IN_LIST' }]);
    const key = '0192a1b0-0000-7000-8000-00000000aa01';
    const c = Client.of(fa, t, 'fd');
    const a = await c.send(
      'POST',
      `${P(t)}/quotes`,
      { ...short(), guestId: guestFd },
      { 'idempotency-key': key },
    );
    const b = await c.send(
      'POST',
      `${P(t)}/quotes`,
      { ...short(), guestId: guestFd },
      { 'idempotency-key': key },
    );
    expect(b.statusCode).toBe(201);
    expect(b.headers['idempotent-replayed']).toBe('true');
    expect(b.json().id).toBe(a.json().id);
  });

  it('scope M (US-087): CTV sees only own quotes, 404 on others; FD sees all', async () => {
    const ctvQuote = (
      await Client.of(fa, t, 'ctv').send('POST', `${P(t)}/quotes`, {
        ...short({ channelId: ids.channels.collaborator }),
        guestId: guestCtv,
      })
    ).json();
    const ctvList = (await Client.of(fa, t, 'ctv').get(`${P(t)}/quotes`)).json();
    expect(ctvList.data.map((q: { id: string }) => q.id)).toEqual([ctvQuote.id]);
    expect(ctvList.data[0]).not.toHaveProperty('ottimoRemainingVnd');
    expect((await Client.of(fa, t, 'ctv').get(`${P(t)}/quotes/${salQuote.id}`)).statusCode).toBe(
      404,
    );
    expect((await Client.of(fa, t, 'sal2').get(`${P(t)}/quotes/${salQuote.id}`)).statusCode).toBe(
      404,
    );
    const fdList = (await Client.of(fa, t, 'fd').get(`${P(t)}/quotes?limit=2`)).json();
    expect(fdList.data).toHaveLength(2);
    expect(fdList.page.nextCursor).toBeTruthy();
    const fdQuote = (await Client.of(fa, t, 'fd').get(`${P(t)}/quotes/${salQuote.id}`)).json();
    expect(fdQuote).not.toHaveProperty('commission'); // SR-AZ-04
  });

  it('getQuoteText (US-083 AC2): VI/EN with expiry 23:59 18/10, no commission, RU falls back to EN copy', async () => {
    const vi = (
      await Client.of(fa, t, 'sal').get(`${P(t)}/quotes/${salQuote.id}/text?locale=vi`)
    ).json();
    expect(vi.locale).toBe('vi');
    expect(vi.text).toContain(salQuote.code);
    expect(vi.text).toContain('5.205.000 đ');
    expect(vi.text).toContain('1.600.000 đ');
    expect(vi.text).toContain('23:59 18/10/2026');
    expect(vi.text).toContain('09/11/2026 → 16/11/2026');
    expect(vi.text).not.toContain('156');
    const en = (
      await Client.of(fa, t, 'sal').get(`${P(t)}/quotes/${salQuote.id}/text?locale=en`)
    ).json();
    expect(en.text).toContain('5,205,000 VND');
    expect(en.text).toContain('valid until 23:59 18/10/2026');
    const ru = (
      await Client.of(fa, t, 'sal').get(`${P(t)}/quotes/${salQuote.id}/text?locale=ru`)
    ).json();
    expect(ru.locale).toBe('ru');
    const bad = await Client.of(fa, t, 'sal').get(`${P(t)}/quotes/${salQuote.id}/text?locale=fr`);
    expect(bad.statusCode).toBe(422);
  });

  it('lazy expiry (Q3/BR-304): after 00:00 19/10 the quote is expired, hold refused 409 QUOTE_EXPIRED', async () => {
    const q = (
      await Client.of(fa, t, 'fd').send('POST', `${P(t)}/quotes`, { ...short(), guestId: guestFd })
    ).json();
    await at('2026-10-18T16:59:00.000Z'); // 23:59 18/10 VN – still valid
    try {
      expect((await Client.of(fa, t, 'fd').get(`${P(t)}/quotes/${q.id}`)).json().status).toBe(
        'active',
      );
      await at('2026-10-18T17:00:00.000Z'); // 00:00 19/10
      expect((await Client.of(fa, t, 'fd').get(`${P(t)}/quotes/${q.id}`)).json().status).toBe(
        'expired',
      );
      const expired = (await Client.of(fa, t, 'fd').get(`${P(t)}/quotes?status=expired`)).json();
      expect(expired.data.map((x: { id: string }) => x.id)).toContain(q.id);
      const hold = await Client.of(fa, t, 'fd').send(
        'POST',
        `${P(t)}/quotes/${q.id}/actions/create-hold`,
        {
          holdHours: 24,
        },
      );
      expect(hold.statusCode).toBe(409);
      expect(hold.json().code).toBe('QUOTE_EXPIRED');
      expect(hold.json().expiredAt).toBe('2026-10-19T00:00:00.000+07:00');
    } finally {
      await back();
    }
  });

  it('withdrawQuote (Q5): active → withdrawn, again → 409 INVALID_TRANSITION', async () => {
    const q = (
      await Client.of(fa, t, 'fd').send('POST', `${P(t)}/quotes`, { ...short(), guestId: guestFd })
    ).json();
    const w = await Client.of(fa, t, 'fd').send('POST', `${P(t)}/quotes/${q.id}/actions/withdraw`);
    expect(w.statusCode).toBe(200);
    expect(w.json().status).toBe('withdrawn');
    const again = await Client.of(fa, t, 'fd').send(
      'POST',
      `${P(t)}/quotes/${q.id}/actions/withdraw`,
    );
    expect(again.json().code).toBe('INVALID_TRANSITION');
  });

  // ───────────── createHoldFromQuote ─────────────
  it('BR-302-01 / US-084: created 20:00 15/10 for 16/10, 24 h → deadline 12:00 16/10; quote converted, lead holding', async () => {
    await at('2026-10-15T13:00:00.000Z'); // 20:00 VN
    try {
      const q = (
        await Client.of(fa, t, 'sal').send('POST', `${P(t)}/quotes`, {
          ...short({ arrivalDate: '2026-10-16', nights: 2 }),
          guestId: guestSal,
        })
      ).json();
      const res = await Client.of(fa, t, 'sal').send(
        'POST',
        `${P(t)}/quotes/${q.id}/actions/create-hold`,
        { holdHours: 24, depositMethod: 'vietqr' },
      );
      expect(res.statusCode, res.body).toBe(201);
      expect(res.json()).toMatchObject({ status: 'hold', quoteId: q.id });
      const r = res.json();
      expect(new Date(r.hold.expiresAt).toISOString()).toBe(
        new Date(String(ex('BR-302-01').expiresAt)).toISOString(),
      );
      expect(r).toMatchObject({
        arrivalDate: '2026-10-16',
        departureDate: '2026-10-18',
        depositRequiredVnd: q.depositVnd,
        totalRoomVnd: q.totalVnd,
        closerUserId: t.users.sal!.id,
      });
      // BR-006 snapshot of the quote; BR-429 (a1) v0.3.8 (DOM-S4-04, BE-A): the calendar price of each night is
      // kept too (2 nights – no BR-107 tier, so calendar = price).
      const rates = r.nightlyRates as Array<{
        date: string;
        amountVnd: number;
        calendarRateVnd: number;
      }>;
      // S4-38 (FE-A H09): the quote's nights carry their calendar price too – the hold keeps exactly them.
      expect(rates).toEqual(q.nightlyRates);
      expect(rates.map((n) => n.calendarRateVnd)).toEqual(rates.map((n) => n.amountVnd));
      expect(r).not.toHaveProperty('commission');
      const after = (await Client.of(fa, t, 'sal').get(`${P(t)}/quotes/${q.id}`)).json();
      expect(after.status).toBe('converted');
      expect(after.convertedReservationId).toBe(res.json().id);
      const lead = (await Client.of(fa, t, 'sal').get(`${P(t)}/leads`)).json();
      expect(lead.data.find((l: { id: string }) => l.id === q.leadId).status).toBe('holding');
      // Folio opened by the reservation-created hook; hold nights (not sold – BR-904) on stay_night.
      const { rows } = await db.withContext(t.ctx(), (tx) =>
        tx.query(
          `SELECT f.status, (SELECT array_agg(n.night_state || ':' || n.room_revenue_vnd ORDER BY n.stay_date)
                               FROM stay_night n WHERE n.reservation_id = f.primary_reservation_id) AS nights
             FROM folio f WHERE f.primary_reservation_id = $1 AND f.id = $2`,
          [r.id, r.folioId],
        ),
      );
      expect(rows).toEqual([
        {
          status: 'open',
          nights: q.nightlyRates.map((n: { amountVnd: number }) => `hold:${n.amountVnd}`),
        },
      ]);
      const twice = await Client.of(fa, t, 'sal').send(
        'POST',
        `${P(t)}/quotes/${q.id}/actions/create-hold`,
        {
          holdHours: 24,
        },
      );
      expect(twice.json().code).toBe('INVALID_TRANSITION');
    } finally {
      await back();
    }
  });

  it('create-hold refusals: arrival today (HOLD_NOT_ALLOWED_TODAY), no phone, hold hours not in BR-302, VNPay in R2', async () => {
    const save = (guestId: string, extra: Record<string, unknown> = {}) =>
      Client.of(fa, t, 'sal')
        .send('POST', `${P(t)}/quotes`, { ...short(extra), guestId })
        .then((r) => r.json());
    const hold = (id: string, body: Record<string, unknown>) =>
      Client.of(fa, t, 'sal').send('POST', `${P(t)}/quotes/${id}/actions/create-hold`, body);
    const today = await save(guestSal, { arrivalDate: '2026-10-15', nights: 2 });
    expect((await hold(today.id, { holdHours: 24 })).json().code).toBe('HOLD_NOT_ALLOWED_TODAY');
    const noPhone = await save(guestNoPhone);
    expect((await hold(noPhone.id, { holdHours: 24 })).json().code).toBe('PHONE_REQUIRED');
    const ok = await save(guestSal);
    expect((await hold(ok.id, { holdHours: 6 })).json().errors).toEqual([
      { field: 'holdHours', code: 'NOT_IN_LIST' },
    ]);
    expect((await hold(ok.id, { holdHours: 24, depositMethod: 'vnpay' })).json().errors).toEqual([
      { field: 'depositMethod', code: 'NOT_IN_LIST' },
    ]);
    expect(
      (
        await Client.of(fa, t, 'ctv').send('POST', `${P(t)}/quotes/${ok.id}/actions/create-hold`, {
          holdHours: 24,
        })
      ).statusCode,
    ).toBe(404);
  });

  it('US-018 via quotes: two holds on the same room and nights at once → exactly one 201, the other 409 ROOM_UNAVAILABLE', async () => {
    const save = () =>
      Client.of(fa, t, 'fd')
        .send('POST', `${P(t)}/quotes`, {
          ...short({ arrivalDate: '2027-02-15', nights: 3 }),
          guestId: guestFd,
        })
        .then((r) => r.json());
    const [a, b] = [await save(), await save()];
    const res = await Promise.all(
      [a, b].map((q) =>
        Client.of(fa, t, 'fd').send('POST', `${P(t)}/quotes/${q.id}/actions/create-hold`, {
          holdHours: 24,
        }),
      ),
    );
    expect(res.map((r) => r.statusCode).sort()).toEqual([201, 409]);
    const lost = res.find((r) => r.statusCode === 409)!;
    expect(lost.json().code).toBe('ROOM_UNAVAILABLE');
    // The losing quote stays active (the failed hold rolled back with it).
    const loser = res[0]!.statusCode === 409 ? a : b;
    expect((await Client.of(fa, t, 'fd').get(`${P(t)}/quotes/${loser.id}`)).json().status).toBe(
      'active',
    );
  });

  it('RLS: another organisation never sees these quotes, leads or folios (404 / empty list)', async () => {
    const other = await createTenant(db, { users: { fd: ['front_desk'] } });
    await seedSales(db, other);
    const c = Client.of(fa, other, 'fd');
    expect((await c.get(`${P(other)}/quotes/${salQuote.id}`)).statusCode).toBe(404);
    expect((await c.get(`${P(other)}/quotes`)).json().data).toEqual([]);
    expect((await c.get(`${P(other)}/leads`)).json().data).toEqual([]);
    expect((await c.get(`${P(t)}/quotes/${salQuote.id}`)).statusCode).toBe(404); // not their property
  });

  it('0.3.5 A-14: calculation splits room total / extra-person fee / extra guests and names the room', async () => {
    const q = (await calc('fd', short({ adults: 3 }))).json();
    expect(q).toMatchObject({
      roomId: ids.rooms['202'],
      roomNo: '202',
      roomTotalVnd: 5_205_000,
      extraPersonFeeVnd: 1_050_000,
      extraGuestCount: 1,
      totalVnd: 6_255_000,
    });
  });

  it('extendQuote (Q4, A-18): MGR → 200 active with a new expiry; SAL → 202 approval, MGR approves → active; refusals', async () => {
    const save = (who: string, guestId: string) =>
      Client.of(fa, t, who)
        .send('POST', `${P(t)}/quotes`, { ...short(), guestId })
        .then((r) => r.json());
    const mgrQuote = await save('fd', guestFd);
    const salQuote2 = await save('sal', guestSal);
    const ext = (who: string, id: string, version: number, body: unknown = {}) =>
      Client.of(fa, t, who).send('POST', `${P(t)}/quotes/${id}/actions/extend`, body, {
        'if-match': `"${version}"`,
      });
    // Still active → 409 + currentState.
    const early = await ext('mgr', mgrQuote.id, mgrQuote.version);
    expect(early.json()).toMatchObject({ code: 'INVALID_TRANSITION', currentState: 'active' });
    await at('2026-10-20T03:00:00.000Z'); // 10:00 20/10 – both expired (lazy)
    try {
      const ok = await ext('mgr', mgrQuote.id, mgrQuote.version);
      expect(ok.statusCode, ok.body).toBe(200);
      expect(ok.json()).toMatchObject({
        status: 'active',
        expiresAt: '2026-10-24T00:00:00.000+07:00',
      });
      expect(ok.json().totalVnd).toBe(mgrQuote.totalVnd); // BR-006 snapshot kept
      expect((await ext('fd', mgrQuote.id, ok.json().version)).statusCode).toBe(403);
      expect((await ext('sal', salQuote2.id, salQuote2.version)).json().errors).toEqual([
        { field: 'reason', code: 'REASON_REQUIRED' },
      ]);
      const req = await ext('sal', salQuote2.id, salQuote2.version, {
        reason: 'Khách xin thêm 2 ngày',
      });
      expect(req.statusCode, req.body).toBe(202);
      expect(req.json()).toMatchObject({ type: 'quote_extension', status: 'pending' });
      expect(
        (await ext('sal2', salQuote2.id, salQuote2.version, { reason: 'abc' })).statusCode,
      ).toBe(404);
      await setPassword(db, t, 'mgr');
      const approve = await Client.of(fa, t, 'mgr').send(
        'POST',
        `${P(t)}/approval-requests/${req.json().id}/actions/approve`,
        { authMethod: 'password', secret: TEST_PASSWORD },
      );
      expect(approve.statusCode, approve.body).toBe(200);
      const after = (await Client.of(fa, t, 'sal').get(`${P(t)}/quotes/${salQuote2.id}`)).json();
      expect(after).toMatchObject({ status: 'active', expiresAt: '2026-10-24T00:00:00.000+07:00' });
    } finally {
      await back();
    }
  });

  it('SEC-BE-21: dryRun on write endpoints that do not compute → 422, nothing saved', async () => {
    const before = (await Client.of(fa, t, 'fd').get(`${P(t)}/quotes?limit=100`)).json().data
      .length;
    const res = await Client.of(fa, t, 'fd').send('POST', `${P(t)}/quotes`, {
      ...short(),
      guestId: guestFd,
      dryRun: true,
    });
    expect(res.json().errors).toEqual([{ field: 'dryRun', code: 'NOT_ALLOWED' }]);
    expect((await Client.of(fa, t, 'fd').get(`${P(t)}/quotes?limit=100`)).json().data.length).toBe(
      before,
    );
    const lead = await Client.of(fa, t, 'sal').send('POST', `${P(t)}/leads`, {
      guestId: guestSal,
      dryRun: true,
    });
    expect(lead.statusCode).toBe(422);
  });

  it('SEC-BE-29: another sale cannot withdraw or hold my quote (404)', async () => {
    const q = (
      await Client.of(fa, t, 'sal').send('POST', `${P(t)}/quotes`, {
        ...short(),
        guestId: guestSal,
      })
    ).json();
    expect(
      (await Client.of(fa, t, 'sal2').send('POST', `${P(t)}/quotes/${q.id}/actions/withdraw`))
        .statusCode,
    ).toBe(404);
    expect(
      (
        await Client.of(fa, t, 'sal2').send('POST', `${P(t)}/quotes/${q.id}/actions/create-hold`, {
          holdHours: 24,
        })
      ).statusCode,
    ).toBe(404);
  });

  it('listCloserCandidates (A-06, SEC-BE-26): active users with a live role, kind agent/staff, no PII', async () => {
    await db.withContext(t.ctx(), async (tx) => {
      await tx.query(`UPDATE app_user SET status = 'disabled' WHERE id = $1`, [t.users.sal2!.id]);
    });
    try {
      const all = (await Client.of(fa, t, 'fd').get(`${P(t)}/closer-candidates`)).json().data;
      const byId = new Map(all.map((c: { userId: string; kind: string }) => [c.userId, c]));
      expect(byId.get(t.users.ctv!.id)).toMatchObject({ kind: 'agent', displayName: 'ctv' });
      expect(byId.get(t.users.sal!.id)).toMatchObject({ kind: 'staff' });
      expect(byId.has(t.users.sal2!.id)).toBe(false); // disabled
      expect(byId.has(t.users.hk!.id)).toBe(false); // no closer role
      expect(Object.keys(all[0]).sort()).toEqual(['displayName', 'kind', 'userId']);
      const agents = (
        await Client.of(fa, t, 'fd').get(`${P(t)}/closer-candidates?kind=agent`)
      ).json().data;
      expect(agents.map((c: { userId: string }) => c.userId)).toEqual([t.users.ctv!.id]);
      expect((await Client.of(fa, t, 'sal').get(`${P(t)}/closer-candidates`)).statusCode).toBe(403);
      expect(
        (await Client.of(fa, t, 'fd').get(`${P(t)}/closer-candidates?kind=x`)).statusCode,
      ).toBe(422);
    } finally {
      await db.withContext(t.ctx(), (tx) =>
        tx.query(`UPDATE app_user SET status = 'active' WHERE id = $1`, [t.users.sal2!.id]),
      );
    }
  });

  // ───────────── leads ─────────────
  it('leads (SM-09): create, own scope, manual moves, lost needs a reason, If-Match', async () => {
    const created = await Client.of(fa, t, 'ctv').send('POST', `${P(t)}/leads`, {
      guestId: guestCtv,
      need: 'Studio 3 đêm cuối tháng',
    });
    expect(created.statusCode, created.body).toBe(201);
    const lead = created.json();
    expect(lead).toMatchObject({ status: 'new', ownerUserId: t.users.ctv!.id });
    const v = created.headers.etag as string;
    const move = (who: string, body: Record<string, unknown>, ifMatch = v) =>
      Client.of(fa, t, who).send('POST', `${P(t)}/leads/${lead.id}/actions/change-stage`, body, {
        'if-match': ifMatch,
      });
    expect((await move('sal', { toStage: 'quoted' })).statusCode).toBe(404); // not hers
    expect((await move('ctv', { toStage: 'won' })).json().code).toBe('INVALID_TRANSITION');
    expect((await move('ctv', { toStage: 'lost' })).json().errors).toEqual([
      { field: 'lostReasonCode', code: 'REQUIRED' },
    ]);
    expect((await move('ctv', { toStage: 'lost', lostReasonCode: 'other' })).json().errors).toEqual(
      [{ field: 'note', code: 'REASON_REQUIRED' }],
    );
    const lost = await move('ctv', { toStage: 'lost', lostReasonCode: 'price' });
    expect(lost.statusCode, lost.body).toBe(200);
    expect(lost.json().status).toBe('lost');
    expect((await move('ctv', { toStage: 'new' })).json().code).toBe('VERSION_CONFLICT');
    const reopened = await move('ctv', { toStage: 'new' }, lost.headers.etag as string);
    expect(reopened.json().status).toBe('new');
    const sal = (await Client.of(fa, t, 'sal').get(`${P(t)}/leads`)).json();
    expect(sal.data.map((l: { id: string }) => l.id)).not.toContain(lead.id);
    const foreign = await Client.of(fa, t, 'ctv').send('POST', `${P(t)}/leads`, {
      guestId: guestSal,
    });
    expect(foreign.json().errors).toEqual([{ field: 'guestId', code: 'NOT_IN_LIST' }]);
  });
});
