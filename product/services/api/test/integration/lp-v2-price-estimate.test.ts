/**
 * R4 gói LP-v2 – BE on the real PostgreSQL: getPublicPriceEstimate (OpenAPI 0.3.9-draft; ARC lp-v2-design 2, 4.1
 * BE-2…BE-6; DOM BR-115/116 mục 11; SEC SR-PE-01…14 / 9.5), the estimate stored with a website request, the new
 * landing languages (LandingLocale, LANDING_LOCALES, PUBLIC_FORM_NOT_READY, unexpected_script by language) and the
 * `public_show_prices` switch. Fake clock: Sun 01/11/2026 09:00 VN (the "today" of DOM mục 11). FAKE data only.
 * Every public GET moves the fake clock 200 ms (the whole-api limit is 10 per second of that clock).
 */
import { randomUUID } from 'node:crypto';
import { Client as PgClient } from 'pg';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { Database } from '../../src/db/database';
import { PriceEstimateService } from '../../src/modules/public-site/internal/price-estimate.service';
import { PublicSiteController } from '../../src/modules/public-site/internal/public-site.controller';
import { PublicRatePort } from '../../src/modules/reservations/public/public-rate.port';
import { type FeatureApp, P, startFeatureApp } from '../helpers/feature-app';
import { staff } from '../helpers/registration-fixture';
import { type BookingIds, seedBooking, touchSessions } from '../helpers/reservations-fixture';
import { HAS_DB, type TestTenant, appDatabase, createTenant } from '../helpers/tenant';

const LANDING = 'https://ottimo.example.invalid';
const SIGNING_KEY = 'test-public-form-signing-key-0123456789abcdef';
const NOTICE = '2026-10-31';
const GARDEN = 'standard-studio-garden-view';
const PREMIUM = 'premium-one-bedroom-1';
const NOW = '2026-11-01T09:00:00+07:00';

describe.skipIf(!HAS_DB)('LP-v2 BE – public price estimate + landing languages (R4)', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let ids: BookingIds;
  let slug: string;
  let service: PriceEstimateService;
  const env = { ...process.env };
  const tok = (u: string) => t.users[u]!.sessionToken;
  const q = async <R extends Record<string, unknown>>(sql: string, p: unknown[] = []) =>
    (await db.withContext(t.ctx(), (tx) => tx.query<R>(sql, p))).rows;
  const net = `10.${Math.floor(Math.random() * 250)}`;
  let ipSeq = 10;
  const nextIp = () => `${net}.${Math.floor(ipSeq / 250)}.${(ipSeq += 1) % 250}`;
  const tick = (ms = 200) => fa.clock.set(new Date(fa.clock.now().getTime() + ms));

  const estimate = (
    query: Record<string, string | number>,
    opts: {
      ip?: string;
      headers?: Record<string, string>;
      raw?: string;
      method?: 'GET' | 'POST';
    } = {},
  ) => {
    tick();
    const qs =
      opts.raw ??
      Object.entries(query)
        .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
        .join('&');
    return fa.app.inject({
      method: opts.method ?? 'GET',
      url: `/v1/public/properties/${slug}/price-estimate?${qs}`,
      headers: opts.headers ?? {},
      remoteAddress: opts.ip ?? nextIp(),
    });
  };
  const garden = { roomType: GARDEN, arrival: '2026-11-10', departure: '2026-11-13', adults: 2 };

  const formToken = async (): Promise<string> => {
    const r = await fa.app.inject({
      method: 'GET',
      url: `/v1/public/properties/${slug}/form-token`,
      remoteAddress: nextIp(),
    });
    expect(r.statusCode, r.body).toBe(200);
    fa.clock.set(new Date(fa.clock.now().getTime() + 5_000));
    return r.json().token as string;
  };
  let phoneSeq = 100;
  const form = (token: string, extra: Record<string, unknown> = {}) => ({
    formToken: token,
    stayType: 'short',
    arrival: '2026-11-10',
    departure: '2026-11-13',
    adults: 2,
    children: 0,
    infants: 0,
    roomType: GARDEN,
    guestName: 'Test Guest',
    phone: `0905 ${(phoneSeq += 1)} 222`,
    preferredChannel: 'zalo',
    locale: 'en',
    consent: true,
    consentVersion: NOTICE,
    landingPath: '/',
    ...extra,
  });
  const submit = (body: Record<string, unknown>, opts: { key?: string; ip?: string } = {}) =>
    fa.app.inject({
      method: 'POST',
      url: `/v1/public/properties/${slug}/booking-requests`,
      headers: {
        'content-type': 'application/json',
        'idempotency-key': opts.key ?? randomUUID(),
        origin: LANDING,
      },
      payload: JSON.stringify(body),
      remoteAddress: opts.ip ?? nextIp(),
    });
  const desk = (id: string) =>
    staff(fa, tok('fdl'), null, 'GET', `${P(t)}/website-booking-requests/${id}`);
  const putParam = (who: string, key: string, value: unknown, effectiveFrom = '2026-11-01') =>
    staff(fa, tok(who), null, 'PUT', `${P(t)}/parameters/${key}`, {
      json: { value, effectiveFrom, reason: 'LP-v2 test' },
    });
  const rowOf = async (refCode: string) =>
    (
      await q<{
        id: string;
        price_estimate: { atSubmit?: Record<string, unknown> } | null;
        suspicious_flags: string[];
        locale: string;
      }>(
        `SELECT id, price_estimate, suspicious_flags, locale FROM website_booking_request WHERE ref_code = $1`,
        [refCode],
      )
    )[0]!;

  beforeAll(async () => {
    process.env.LANDING_BASE_URL = `${LANDING}/`;
    process.env.PUBLIC_FORM_SIGNING_KEY = SIGNING_KEY;
    process.env.LANDING_LOCALES = 'en,vi,ko';
    db = appDatabase(10);
    t = await createTenant(db, {
      users: { own: ['owner'], mgr: ['manager'], fdl: ['front_desk_lead'] },
    });
    ids = await seedBooking(db, t);
    slug = `lp-${randomUUID().slice(0, 8)}`;
    await q(`UPDATE property SET code = $2 WHERE id = $1`, [t.propertyIds[0], slug.toUpperCase()]);
    // BR-012 public types (production-defaults.ts, INV 26/10).
    const types: Array<[string, string[]]> = [
      ['Standard Studio · City View', ['101', '201']],
      ['Standard Studio · Garden View', ['102', '103', '202', '203']],
      ['Premium · One Bedroom + 1', ['302', '402']],
      ['Signature · Two Bedrooms', ['301', '401']],
    ];
    for (const [label, rooms] of types) {
      await q(`UPDATE room SET public_room_type = $1 WHERE room_no = ANY($2::text[])`, [
        label,
        rooms,
      ]);
    }
    fa = await startFeatureApp(db);
    fa.clock.set(new Date(NOW));
    await touchSessions(db, t, new Date(NOW));
    service = fa.app.get(PriceEstimateService);
  });
  afterAll(async () => {
    for (const k of ['LANDING_BASE_URL', 'PUBLIC_FORM_SIGNING_KEY', 'LANDING_LOCALES'] as const) {
      if (env[k] === undefined) delete process.env[k];
      else process.env[k] = env[k];
    }
    await fa?.close();
    await db?.close();
  });

  it('OFF by default: form off and prices off → 404 (no price block); unknown property → 404', async () => {
    expect((await estimate(garden)).statusCode).toBe(404);
    const unknown = await fa.app.inject({
      method: 'GET',
      url: `/v1/public/properties/nope-99/price-estimate?roomType=${GARDEN}`,
    });
    expect(unknown.statusCode).toBe(404);
  });

  it('BE-5 readiness: LANDING_LOCALES=en,vi,ko → switching the form on needs the ko notice too (PUBLIC_FORM_NOT_READY)', async () => {
    const refused = await putParam('own', 'public_booking_requests_enabled', true);
    expect(refused.statusCode, refused.body).toBe(422);
    expect(refused.json()).toMatchObject({
      code: 'PUBLIC_FORM_NOT_READY',
      missing: [
        'privacy_notice_version.vi',
        'privacy_notice_version.en',
        'privacy_notice_version.ko',
      ],
    });
    // Landing release (OPS, owner role): en, vi, ko – NOT zh (migration 0090 accepts ko/zh in the CHECK).
    const pg = new PgClient({ connectionString: process.env.MIGRATION_DATABASE_URL });
    await pg.connect();
    try {
      await pg.query('BEGIN');
      await pg.query('SET LOCAL ROLE ottimo_owner');
      await pg.query(`SELECT set_config('app.organization_id', $1, true)`, [t.organizationId]);
      for (const [i, locale] of ['vi', 'en', 'ko'].entries()) {
        await pg.query(
          `INSERT INTO privacy_notice_version (organization_id, version, locale, body_sha256, url_path, published_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            t.organizationId,
            NOTICE,
            locale,
            String(i + 1).repeat(64),
            locale === 'en' ? '/privacy/' : `/${locale}/privacy/`,
            '2026-10-31T00:00:00Z',
          ],
        );
      }
      await pg.query('COMMIT');
    } finally {
      await pg.end();
    }
    const ok = await putParam('own', 'public_booking_requests_enabled', true);
    expect(ok.statusCode, ok.body).toBe(200);
  });

  it('form on, prices still off → 404 (public_show_prices default false)', async () => {
    expect((await estimate(garden)).statusCode).toBe(404);
  });

  it('BE-6: public_show_prices – MGR 403; OWN turns it on, audited in the security log', async () => {
    expect((await putParam('mgr', 'public_show_prices', true)).statusCode).toBe(403);
    const ok = await putParam('own', 'public_show_prices', true);
    expect(ok.statusCode, ok.body).toBe(200);
    const audit = await q<{ category: string }>(
      `SELECT category FROM audit_event WHERE action = 'config.changed' AND entity_id = 'public_show_prices'`,
    );
    expect(audit.map((a) => a.category)).toEqual(['security']);
  });

  it('ca 1 (ota_floor default): 200, numbers of DOM mục 11, contract keys only, no forbidden data, headers', async () => {
    const r = await estimate(garden);
    expect(r.statusCode, r.body).toBe(200);
    expect(r.headers['cache-control']).toBe('no-store');
    expect(r.headers['x-robots-tag']).toBe('noindex');
    const b = r.json();
    expect(b).toMatchObject({
      estimate: true,
      currency: 'VND',
      taxIncluded: true,
      roomType: GARDEN,
      stayKind: 'short',
      arrival: '2026-11-10',
      departure: '2026-11-13',
      priceAvailable: true,
      shortStay: { nights: 3, totalVnd: 2_280_000, losDiscountPct: 0, extraPersonFeeVnd: 0 },
      notes: [],
    });
    expect(Object.keys(b).sort()).toEqual(
      [
        'estimate',
        'currency',
        'taxIncluded',
        'roomType',
        'stayKind',
        'arrival',
        'departure',
        'priceAvailable',
        'shortStay',
        'notes',
        'computedAt',
        'estimateToken',
        'expiresAt',
      ].sort(),
    );
    expect(b.estimateToken).toMatch(/^pe1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
    const json = r.body;
    for (const no of ['101', '102', '103', '201', '202', '203', '301', '302', '401', '402']) {
      expect(json).not.toContain(`"${no}"`);
    }
    for (const f of [
      'otaBase',
      'commission',
      'floor',
      'ceiling',
      'roomId',
      'toTotal',
      'L12',
      '2376000',
    ]) {
      expect(json).not.toContain(f);
    }
    for (const id of Object.values(ids.rooms)) expect(json).not.toContain(id);
  });

  it('ca 9 – OOO block on 302 (09–12/11) → Premium 10–13/11 = 3.000.000 (402 only)', async () => {
    await q(
      `INSERT INTO room_block (id, organization_id, property_id, room_id, status, reason, start_date, end_date_planned,
         created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'planned', 'test leak', '2026-11-09', '2026-11-12', now(), now())`,
      [randomUUID(), t.organizationId, t.propertyIds[0], ids.rooms['302']],
    );
    service.invalidate();
    const r = await estimate({ ...garden, roomType: PREMIUM });
    expect(r.statusCode, r.body).toBe(200);
    expect(r.json().shortStay.totalVnd).toBe(3_000_000);
  });

  it('no-number cases: party over capacity (ca 7), min stay (ca 8), after open_until (ca 4c), unknown slug', async () => {
    const over = (await estimate({ ...garden, adults: 4 })).json();
    expect(over).toMatchObject({ priceAvailable: false, unavailableReason: 'party_exceeds_room' });
    expect(over).not.toHaveProperty('estimateToken');
    const min = (
      await estimate({
        roomType: 'standard-studio-city-view',
        arrival: '2026-11-14',
        departure: '2026-11-15',
        adults: 2,
      })
    ).json();
    expect(min).toMatchObject({
      priceAvailable: false,
      unavailableReason: 'on_request',
      notes: [{ code: 'min_stay', minNights: 2 }],
    });
    const late = (
      await estimate({
        roomType: PREMIUM,
        arrival: '2026-12-31',
        departure: '2027-01-03',
        adults: 2,
      })
    ).json();
    expect(late).toMatchObject({ priceAvailable: false, unavailableReason: 'on_request' });
    const unknown = (await estimate({ ...garden, roomType: 'penthouse-sea-view' })).json();
    expect(unknown).toMatchObject({ priceAvailable: false, unavailableReason: 'on_request' });
  });

  it('long stay (ca 5): from 8.280.000/month, monthly_excludes_utilities', async () => {
    const r = await estimate({
      roomType: GARDEN,
      stayType: 'long',
      arrival: '2026-12-01',
      months: 6,
      adults: 2,
    });
    expect(r.statusCode, r.body).toBe(200);
    expect(r.json()).toMatchObject({
      stayKind: 'long',
      priceAvailable: true,
      longStay: { months: 6, monthlyFromVnd: 8_280_000 },
      notes: [{ code: 'monthly_excludes_utilities' }],
    });
  });

  it('422 field codes; unknown / repeated parameter; Sec-Fetch-Site cross-site → 403; POST → 404', async () => {
    const codes = async (query: Record<string, string | number>, raw?: string) =>
      (await estimate(query, raw ? { raw } : {})).json().errors;
    expect(await codes({ ...garden, arrival: '2026-10-30', departure: '2026-11-02' })).toEqual([
      { field: 'arrival', code: 'DATE_IN_PAST' },
    ]);
    expect(await codes({ ...garden, arrival: '2027-12-01', departure: '2027-12-03' })).toEqual([
      { field: 'arrival', code: 'OUTSIDE_BOOKING_WINDOW' },
    ]);
    expect(await codes({ ...garden, departure: '2026-11-09' })).toEqual([
      { field: 'departure', code: 'DATE_ORDER' },
    ]);
    expect(await codes({ ...garden, adults: 0 })).toEqual([
      { field: 'adults', code: 'VALUE_OUT_OF_RANGE' },
    ]);
    expect(await codes({ roomType: GARDEN, arrival: '2026-11-10', adults: 2 })).toEqual([
      { field: 'departure', code: 'REQUIRED' },
    ]);
    const unknown = await estimate({ ...garden, channel: 'ota' });
    expect(unknown.statusCode).toBe(422);
    expect(unknown.body).not.toContain('2280000');
    const dup = await estimate(
      {},
      { raw: `roomType=${GARDEN}&arrival=2026-11-10&departure=2026-11-13&adults=2&adults=3` },
    );
    expect(dup.statusCode).toBe(422);
    const cross = await estimate(garden, { headers: { 'sec-fetch-site': 'cross-site' } });
    expect(cross.statusCode).toBe(403);
    expect((await estimate(garden, { method: 'POST' })).statusCode).toBe(404);
  });

  it('cache: a second identical call touches no database; a price parameter change drops it (number changes at once)', async () => {
    await estimate(garden);
    const spy = vi.spyOn(db, 'withContext');
    const entry = vi.spyOn(db, 'entry');
    const again = await estimate(garden);
    expect(again.json().shortStay.totalVnd).toBe(2_280_000);
    expect(spy).not.toHaveBeenCalled();
    expect(entry).not.toHaveBeenCalled();
    spy.mockRestore();
    entry.mockRestore();
    // BR-116 (3): OWN switches to `direct` (ESC-043 answered) – the next view shows the direct price (ca 1).
    const put = await putParam('own', 'web_estimate.parity_mode', 'direct');
    expect(put.statusCode, put.body).toBe(200);
    expect((await estimate(garden)).json().shortStay.totalVnd).toBe(2_250_000);
  });

  it('BE-4: a verified token → 202; the Desk sees what the guest saw; the server recomputation keeps from/to', async () => {
    const shown = (await estimate(garden)).json();
    expect(shown.shortStay.totalVnd).toBe(2_250_000);
    const key = randomUUID();
    const body = form(await formToken(), { priceEstimateToken: shown.estimateToken });
    const r = await submit(body, { key });
    expect(r.statusCode, r.body).toBe(202);
    const row = await rowOf(r.json().refCode);
    expect(row.suspicious_flags).not.toContain('offer_unverified');
    expect(row.price_estimate?.atSubmit).toMatchObject({
      status: 'ok',
      fromTotalVnd: 2_250_000,
      toTotalVnd: 2_376_000,
      parityMode: 'direct',
    });
    const d = await desk(row.id);
    expect(d.statusCode, d.body).toBe(200);
    expect(d.json().priceEstimate).toEqual({
      roomType: GARDEN,
      stayKind: 'short',
      arrival: '2026-11-10',
      departure: '2026-11-13',
      months: null,
      adults: 2,
      children: 0,
      infants: 0,
      nights: 3,
      totalVnd: 2_250_000,
      losDiscountPct: 0,
      extraPersonFeeVnd: 0,
      monthlyFromVnd: null,
      currency: 'VND',
      computedAt: shown.computedAt,
      priceVersion: expect.stringMatching(/^[0-9a-f]{16}$/),
    });
    expect(JSON.stringify(d.json().priceEstimate)).not.toContain('toTotal');
    // Idempotent replay of the same body → same answer.
    const replay = await submit(body, { key });
    expect(replay.statusCode).toBe(202);
    expect(replay.headers['idempotent-replayed']).toBe('true');
    expect(replay.json().refCode).toBe(r.json().refCode);
    // Kept after the C2 erase (not personal data – DATA).
    const v = Number(String(d.headers.etag).replace(/"/g, ''));
    const erase = await staff(
      fa,
      tok('fdl'),
      null,
      'POST',
      `${P(t)}/website-booking-requests/${row.id}/actions/erase`,
      {
        ifMatch: v,
        json: { verificationMethod: 'called_back' },
      },
    );
    expect(erase.statusCode, erase.body).toBe(200);
    expect(erase.json().piiPurgedAt).not.toBeNull();
    expect(erase.json().priceEstimate).toMatchObject({ totalVnd: 2_250_000 });
  });

  it('BE-4: tampered / other party / expired token → still 202, nothing stored, offer_unverified; no token → null, no flag', async () => {
    const shown = (await estimate(garden)).json();
    const [h, b, s] = String(shown.estimateToken).split('.') as [string, string, string];
    const tampered = `${h}.${b}.${s[0] === 'A' ? 'B' : 'A'}${s.slice(1)}`;
    for (const [token, extra] of [
      [tampered, {}],
      [shown.estimateToken, { adults: 3 }],
      [shown.estimateToken, { departure: '2026-11-14' }],
      ['not-a-token', {}],
    ] as Array<[string, Record<string, unknown>]>) {
      const r = await submit(form(await formToken(), { ...extra, priceEstimateToken: token }));
      expect(r.statusCode, r.body).toBe(202);
      const row = await rowOf(r.json().refCode);
      expect(row.price_estimate).toBeNull();
      expect(row.suspicious_flags).toContain('offer_unverified');
      expect((await desk(row.id)).json().priceEstimate).toBeNull();
    }
    const plain = await submit(form(await formToken()));
    expect(plain.statusCode).toBe(202);
    const row = await rowOf(plain.json().refCode);
    expect(row.price_estimate).toBeNull();
    expect(row.suspicious_flags).not.toContain('offer_unverified');
    // 24 h later the same token has expired.
    fa.clock.set(new Date(new Date(NOW).getTime() + 25 * 3_600_000));
    await touchSessions(db, t, fa.clock.now());
    const late = await submit(form(await formToken(), { priceEstimateToken: shown.estimateToken }));
    expect(late.statusCode, late.body).toBe(202);
    expect((await rowOf(late.json().refCode)).suspicious_flags).toContain('offer_unverified');
    fa.clock.set(new Date(NOW));
    await touchSessions(db, t, new Date(NOW));
  });

  it('BE-5: ko with a notice → 202 (Korean note not flagged); en with Korean → flagged; zh without notice → 422 PUBLIC_FORM_NOT_READY; ja → NOT_IN_LIST; full-width card → refused', async () => {
    const ko = await submit(
      form(await formToken(), {
        locale: 'ko',
        note: '늦게 도착할 예정입니다 (around 22:00)',
        landingPath: '/ko/',
      }),
    );
    expect(ko.statusCode, ko.body).toBe(202);
    const koRow = await rowOf(ko.json().refCode);
    expect(koRow.locale).toBe('ko');
    expect(koRow.suspicious_flags).not.toContain('unexpected_script');
    expect((await desk(koRow.id)).json().locale).toBe('ko');
    const en = await submit(form(await formToken(), { note: '늦게 도착할 예정입니다' }));
    expect(en.statusCode).toBe(202);
    expect((await rowOf(en.json().refCode)).suspicious_flags).toContain('unexpected_script');
    const zh = await submit(form(await formToken(), { locale: 'zh', landingPath: '/zh/' }));
    expect(zh.statusCode, zh.body).toBe(422);
    expect(zh.json().code).toBe('PUBLIC_FORM_NOT_READY');
    const ja = await submit(form(await formToken(), { locale: 'ja' }));
    expect(ja.json().errors).toEqual([{ field: 'locale', code: 'NOT_IN_LIST' }]);
    const card = await submit(
      form(await formToken(), {
        locale: 'ko',
        note: '카드 ４１１１　１１１１　１１１１　１１１１',
      }),
    );
    expect(card.statusCode).toBe(422);
    expect(card.json().errors).toEqual([{ field: 'note', code: 'CARD_NUMBER_DETECTED' }]);
    expect(card.body).not.toContain('１１１１');
  });

  it('SR-PE-07: 31st call in 10 minutes from one IP → 429, while the form from that IP is still accepted (own buckets)', async () => {
    const ip = '198.51.100.77';
    for (let i = 0; i < 30; i += 1) {
      const r = await estimate(garden, { ip });
      expect(r.statusCode, `call ${i + 1}`).toBe(200);
    }
    const over = await estimate(garden, { ip });
    expect(over.statusCode).toBe(429);
    expect(Number(over.headers['retry-after'])).toBeGreaterThan(0);
    const r = await submit(form(await formToken()), { ip });
    expect(r.statusCode, r.body).toBe(202);
    const counters = await q<{ n: number }>(
      `SELECT count(*)::int AS n FROM rate_limit_counter WHERE bucket_key LIKE 'pubest%'`,
    );
    expect(counters[0]?.n).toBe(0);
    fa.app.get(PublicSiteController).resetEstimateLimits();
  });

  it('own bulkhead: 2 estimates in flight → the 3rd gets 503, the form still answers 202', async () => {
    const port = fa.app.get(PublicRatePort);
    const real = port.estimate.bind(port);
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const spy = vi.spyOn(port, 'estimate').mockImplementation(async (...a) => {
      await gate;
      return real(...a);
    });
    service.invalidate();
    const slow = [
      estimate({ ...garden, adults: 1 }),
      estimate({ ...garden, adults: 1, children: 1 }),
    ];
    await new Promise((r) => setTimeout(r, 50));
    const third = await estimate({ ...garden, adults: 1, infants: 1 });
    expect(third.statusCode).toBe(503);
    expect(third.headers['retry-after']).toBe('5');
    const f = await submit(form(await formToken()));
    expect(f.statusCode, f.body).toBe(202);
    release();
    for (const s of await Promise.all(slow)) expect(s.statusCode).toBe(200);
    spy.mockRestore();
  });

  it('kill switch: OWN sets public_show_prices = false today → 404 at once, the form still works', async () => {
    const off = await putParam('own', 'public_show_prices', false);
    expect(off.statusCode, off.body).toBe(200);
    expect((await estimate(garden)).statusCode).toBe(404);
    const f = await submit(form(await formToken()));
    expect(f.statusCode, f.body).toBe(202);
  });

  it('a room without a list price: left out, and the log line is written once per room and day', async () => {
    // Back on (seed-like: today's row of the kill switch is set to true again – the Desk would need tomorrow).
    await q(
      `UPDATE config_parameter SET value = 'true'::jsonb WHERE key = 'public_show_prices' AND effective_from = '2026-11-01'`,
    );
    await q(
      `UPDATE room SET public_room_type = 'Standard Studio · City View' WHERE room_no = '103'`,
    );
    await q(`UPDATE room_list_price SET effective_from = '2027-06-01' WHERE room_id = $1`, [
      ids.rooms['103'],
    ]);
    service.invalidate();
    const warn = vi.spyOn(
      (service as unknown as { log: { warn: (m: string) => void } }).log,
      'warn',
    );
    for (let i = 0; i < 3; i += 1) {
      service.invalidate();
      const r = await estimate({ ...garden, roomType: 'standard-studio-city-view' });
      expect(r.statusCode, r.body).toBe(200);
      expect(r.json().shortStay.totalVnd).toBe(3 * 667_000);
    }
    expect(
      warn.mock.calls.filter((c) => String(c[0]).includes('public_price_missing')),
    ).toHaveLength(1);
    warn.mockRestore();
  });
});
