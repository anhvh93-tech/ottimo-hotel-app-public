/**
 * R4 gói LP-v2 – BE units (no database): BR-115/116 public price estimate (the 12 numbered cases of DOM
 * `rounds/round-04/outputs/DOM/web-price-estimate-rules.md` mục 11 – expected numbers copied from that table, not
 * recomputed here), the public DTO allowlist (SEC SR-PE-01/05), the query rules (SR-PE-02/03), the `pe1` token
 * (ARC lp-v2-design 2.7), LANDING_LOCALES, `unexpected_script` by page language and NFKC number detection (3.4).
 * Prices = DS-E / BR-101 initial table (= DOM mục 2); parameters = DS-E (weekend +15 %, Giáng sinh – Năm mới +30 %,
 * 7/14 nights −10/−15 %, 150.000/100.000 extra persons, lease terms 1/3/6/12/24).
 */
import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { ProblemError } from '../src/shared/problem';
import {
  ESTIMATE_TOKEN,
  issueEstimateToken,
  tokenMatches,
  verifyEstimateToken,
  type EstimatePayload,
} from '../src/modules/public-site/internal/estimate-token';
import {
  checkEstimateDates,
  parseEstimateQuery,
  publicEstimateDto,
  type EstimateQuery,
} from '../src/modules/public-site/internal/price-estimate.service';
import {
  LANDING_LOCALE_VALUES,
  landingLocalesFrom,
  publicSiteOptionsFrom,
} from '../src/modules/public-site/internal/public-site.options';
import {
  hasUnexpectedScript,
  looksLikeCard,
  looksLikeIdNumber,
} from '../src/modules/public-site/internal/website-request-rules';
import type { PricingParams } from '../src/modules/reservations/public/pricing.service';
import {
  type ParityMode,
  type PublicRateRoom,
  estimatePublicRate,
  termDiscountPct,
} from '../src/modules/reservations/public/public-rate';
import { DS_E } from './helpers/reservations-fixture';

const param = <T>(k: string): T => {
  const p = DS_E.parameters.find((x) => x.param === k);
  if (!p) throw new Error(`DS-E has no ${k}`);
  return p.value as T;
};

const LEASE_TERMS = (
  DS_E as unknown as { leaseTerms: Array<{ months: number; discountPct: number }> }
).leaseTerms;

const PRICING: PricingParams = {
  asOf: '2026-11-01',
  nightRateUnit: param<number>('rounding.night_rate'),
  otaRateUnit: param<number>('rounding.ota_rate'),
  depositUnit: param<number>('rounding.deposit'),
  feeUnit: param<number>('rounding.fee'),
  calendar: {
    weekendNights: param('weekend_nights'),
    weekendUpliftPct: param('weekend_uplift_pct'),
    weekendChannels: param('weekend_uplift_channels'),
    specialDates: param('special_dates'),
    specialUpliftPct: param('special_uplift_pct'),
    specialChannels: param('special_uplift_channels'),
  },
  losTiers: param('los_discount'),
  extraAdultFeeVnd: param('extra_adult_fee'),
  child611FeeVnd: param('child_fee_6_11'),
  depositPct: param('short_stay_deposit_pct'),
  rateFloorPct: param('rate_floor_pct'),
  rateCeilingPct: param('rate_ceiling_pct'),
  minStay: param('min_stay'),
  minStayOrphanException: true,
  bookingWindowDays: 365,
  shortStayMaxNights: 27,
  longStayRequiredFromNights: 28,
  cancelPolicy: param('cancel_policy_direct'),
  cancelPeakNoRefund: true,
  rescheduleWindowMonths: 3,
  rescheduleMaxTimes: 1,
  checkinTime: '14:00',
  otaBaseRates: param('ota_base_rate'),
};

/** DOM mục 2 – rooms of each public type with the BR-101 prices (nightly = DS-E monthly ÷ 12 rounded). */
const ROOMS = Object.fromEntries(
  DS_E.rooms.map((r) => [
    r.roomNo,
    {
      roomId: `room-${r.roomNo}`,
      groupCode: r.group,
      baseOccupancy: r.baseOccupancy,
      maxOccupancy: r.maxOccupancy,
      blocked: false,
      listPrices: [
        {
          effectiveFrom: '2026-10-01',
          nightlyVnd: (r as unknown as { expectedNightlyListPriceVnd: number })
            .expectedNightlyListPriceVnd,
          monthlyVnd: r.monthlyListPriceVnd,
        },
      ],
    } satisfies PublicRateRoom,
  ]),
) as Record<string, PublicRateRoom>;
const TYPE: Record<string, string[]> = {
  city: ['101', '201'],
  garden: ['102', '103', '202', '203'],
  premium: ['302', '402'],
  signature: ['301', '401'],
};
const roomsOf = (t: string, patch: (r: PublicRateRoom) => PublicRateRoom = (r) => r) =>
  (TYPE[t] as string[]).map((no) => patch(ROOMS[no] as PublicRateRoom));

const params = (parityMode: ParityMode) => ({
  pricing: PRICING,
  parityMode,
  openUntil: '2027-01-01',
  leaseTerms: LEASE_TERMS.map((x) => ({ months: x.months, discountPct: x.discountPct })),
  monthlyUnit: param<number>('rounding.monthly_rent'),
});
const short = (arrival: string, departure: string, adults: number, c = 0, i = 0) => ({
  stayType: 'short' as const,
  arrival,
  departure,
  months: null,
  party: { adults, children6to11: c, childrenUnder6: i },
});

describe('BR-115/116 – DOM mục 11, the 12 QA cases (pure engine, same functions as the desk)', () => {
  const run = (mode: ParityMode, t: string, r: ReturnType<typeof short>, rooms = roomsOf(t)) =>
    estimatePublicRate(params(mode), rooms, r);

  it('ca 1 – Garden Studio, 2 NL, Tue 10/11 – Fri 13/11: direct 2.250.000 (to 2.376.000), ota_floor 2.280.000', () => {
    const d = run('direct', 'garden', short('2026-11-10', '2026-11-13', 2));
    expect(d.status).toBe('ok');
    expect(d.shortStay).toMatchObject({ nights: 3, totalVnd: 2_250_000, toTotalVnd: 2_376_000 });
    expect(d.shortStay?.lines).toEqual([{ nights: 3, nightlyVnd: 750_000 }]);
    const f = run('ota_floor', 'garden', short('2026-11-10', '2026-11-13', 2));
    expect(f.shortStay?.totalVnd).toBe(2_280_000);
  });

  it('ca 2 – City Studio, 3 NL, Fri 13 – Sun 15/11: direct 1.834.000 (to 1.928.000), ota_floor 2.040.000', () => {
    const d = run('direct', 'city', short('2026-11-13', '2026-11-15', 3));
    expect(d.shortStay).toMatchObject({
      totalVnd: 1_834_000,
      toTotalVnd: 1_928_000,
      roomSubtotalVnd: 1_534_000,
      upliftNights: 2,
      extraPersonFeeVnd: 300_000,
      losDiscountPct: 0,
      losDiscountVnd: 0,
    });
    expect(run('ota_floor', 'city', short('2026-11-13', '2026-11-15', 3)).shortStay?.totalVnd).toBe(
      2_040_000,
    );
  });

  it('ca 3 – Signature, 4 NL + child 8 + child 3, 16–23/11 (7 nights): direct 6.994.000 (to 7.546.000), ota_floor 8.370.000', () => {
    const d = run('direct', 'signature', short('2026-11-16', '2026-11-23', 4, 1, 1));
    expect(d.shortStay).toMatchObject({
      nights: 7,
      totalVnd: 6_994_000,
      toTotalVnd: 7_546_000,
      losDiscountPct: 10,
      extraPersonFeeVnd: 700_000,
      upliftNights: 2,
    });
    expect(d.shortStay?.lines).toEqual([
      { nights: 5, nightlyVnd: 862_000 },
      { nights: 2, nightlyVnd: 992_000 },
    ]);
    const f = run('ota_floor', 'signature', short('2026-11-16', '2026-11-23', 4, 1, 1));
    expect(f.shortStay?.totalVnd).toBe(8_370_000);
    // The floor beats the discount on every night: no discount shown (BR-116 – never under the floor).
    expect(f.shortStay).toMatchObject({ losDiscountPct: 0, losDiscountVnd: 0 });
  });

  it('ca 4 – Premium, 2 NL, 31/12/2026 – 02/01/2027 (2 special nights): direct 2.384.000 (to 2.600.000), ota_floor 2.540.000', () => {
    const d = run('direct', 'premium', short('2026-12-31', '2027-01-02', 2));
    expect(d.shortStay).toMatchObject({ totalVnd: 2_384_000, toTotalVnd: 2_600_000 });
    expect(
      run('ota_floor', 'premium', short('2026-12-31', '2027-01-02', 2)).shortStay?.totalVnd,
    ).toBe(2_540_000);
  });

  it('ca 4b – same arrival, 1 night: no number, min stay 2 (BR-113), both modes', () => {
    for (const mode of ['direct', 'ota_floor'] as const) {
      const e = run(mode, 'premium', short('2026-12-31', '2027-01-01', 2));
      expect(e).toMatchObject({ status: 'min_stay', minNights: 2 });
      expect(e.shortStay).toBeUndefined();
    }
  });

  it('ca 4c – departure 03/01/2027 (night 02/01 after open_until 01/01/2027): no number', () => {
    const e = run('direct', 'premium', short('2026-12-31', '2027-01-03', 2));
    expect(e.status).toBe('not_open');
    expect(e.shortStay).toBeUndefined();
  });

  it('ca 5 – Garden Studio, 6 months from 01/12/2026: from 8.280.000/month (to 8.740.000), no floor', () => {
    for (const mode of ['direct', 'ota_floor'] as const) {
      const e = estimatePublicRate(params(mode), roomsOf('garden'), {
        stayType: 'long',
        arrival: '2026-12-01',
        departure: null,
        months: 6,
        party: { adults: 2, children6to11: 0, childrenUnder6: 0 },
      });
      expect(e).toMatchObject({ status: 'ok', stayKind: 'long' });
      expect(e.longStay).toEqual({
        months: 6,
        termDiscountPct: 8,
        monthlyFromVnd: 8_280_000,
        monthlyToVnd: 8_740_000,
      });
    }
  });

  it('ca 5b – 4 months → the 3-month tier (−5 %): from 8.550.000/month', () => {
    expect(termDiscountPct(4, LEASE_TERMS)).toBe(5);
    const e = estimatePublicRate(params('direct'), roomsOf('garden'), {
      stayType: 'long',
      arrival: '2026-12-01',
      departure: null,
      months: 4,
      party: { adults: 2, children6to11: 0, childrenUnder6: 0 },
    });
    expect(e.longStay?.monthlyFromVnd).toBe(8_550_000);
  });

  it('ca 6 – City Studio 30/11 – 02/12, OWN scheduled 101 = 650.000 from 01/12: direct 1.317.000 (to 1.416.000), ota_floor 1.520.000', () => {
    const scheduled = (r: PublicRateRoom): PublicRateRoom =>
      r.roomId === 'room-101'
        ? {
            ...r,
            listPrices: [
              ...r.listPrices,
              { effectiveFrom: '2026-12-01', nightlyVnd: 650_000, monthlyVnd: 8_000_000 },
            ],
          }
        : r;
    const rooms = roomsOf('city', scheduled);
    const d = run('direct', 'city', short('2026-11-30', '2026-12-02', 2), rooms);
    expect(d.shortStay).toMatchObject({ totalVnd: 1_317_000, toTotalVnd: 1_416_000 });
    expect(
      run('ota_floor', 'city', short('2026-11-30', '2026-12-02', 2), rooms).shortStay?.totalVnd,
    ).toBe(1_520_000);
  });

  it('ca 7 – Garden Studio, 4 NL: no number, "max 3 guests" (party_exceeds_room)', () => {
    expect(run('direct', 'garden', short('2026-11-10', '2026-11-13', 4)).status).toBe(
      'over_capacity',
    );
  });

  it('ca 8 – City Studio, 2 NL, Sat 14/11, 1 night: no number, min stay 2 (no orphan-night exception on the web)', () => {
    expect(run('direct', 'city', short('2026-11-14', '2026-11-15', 2))).toMatchObject({
      status: 'min_stay',
      minNights: 2,
    });
  });

  it('ca 9 – Premium, 2 NL, 10–13/11, room 302 OOO 09–12/11: 3.000.000 (402 only), both modes', () => {
    const rooms = roomsOf('premium', (r) =>
      r.roomId === 'room-302' ? { ...r, blocked: true } : r,
    );
    for (const mode of ['direct', 'ota_floor'] as const) {
      const e = run(mode, 'premium', short('2026-11-10', '2026-11-13', 2), rooms);
      expect(e.shortStay).toMatchObject({ totalVnd: 3_000_000, toTotalVnd: 3_000_000 });
    }
  });

  it('BR-115 (6): a room without a list price is left out (never "from 0") and reported; none left → unavailable', () => {
    const gap = roomsOf('city', (r) => (r.roomId === 'room-101' ? { ...r, listPrices: [] } : r));
    const e = run('direct', 'city', short('2026-11-10', '2026-11-13', 2), gap);
    expect(e.shortStay?.totalVnd).toBe(3 * 708_000);
    expect(e.priceGapRoomIds).toEqual(['room-101']);
    const none = run('direct', 'city', short('2026-11-10', '2026-11-13', 2), [
      { ...(ROOMS['101'] as PublicRateRoom), listPrices: [] },
    ]);
    expect(none).toMatchObject({ status: 'unavailable', priceGapRoomIds: ['room-101'] });
  });

  it('≥ 28 nights is a long stay (BR-108): monthly "from", flagged long_stay_required', () => {
    const e = run('direct', 'garden', short('2026-11-10', '2026-12-10', 2));
    expect(e).toMatchObject({ status: 'ok', stayKind: 'long', longStayRequired: true });
    expect(e.longStay?.monthlyFromVnd).toBe(9_000_000);
  });
});

// ───────────────────────── public DTO allowlist (SEC SR-PE-01/05, ARC 2.4) ─────────────────────────

interface JsonSchema {
  type?: string;
  enum?: string[];
  required?: string[];
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
}
const SPEC = parse(readFileSync(join(__dirname, '../../../docs/api/openapi.yaml'), 'utf8')) as {
  components: { schemas: Record<string, JsonSchema> };
};
const SCHEMA = SPEC.components.schemas.PublicPriceEstimate as JsonSchema;

function keysAllowed(obj: Record<string, unknown>, schema: JsonSchema): string[] {
  const bad: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const s = schema.properties?.[k];
    if (!s) {
      bad.push(k);
      continue;
    }
    if (k === 'notes') {
      for (const n of v as Array<Record<string, unknown>>) {
        bad.push(...keysAllowed(n, s.items as JsonSchema).map((x) => `notes.${x}`));
      }
    } else if (s.type === 'object' && v && typeof v === 'object') {
      bad.push(...keysAllowed(v as Record<string, unknown>, s).map((x) => `${k}.${x}`));
    }
  }
  return bad;
}

/** ARC 2.4 / SEC 9.2 "never" list – as key fragments (lower case) and as values. */
const FORBIDDEN_KEYS = [
  'otabase',
  'otarate',
  'commission',
  'remaining',
  'floor',
  'ceiling',
  'roomid',
  'roomno',
  'groupcode',
  'tototal',
  'parity',
  'pricegap',
  'lines',
];
const FORBIDDEN_VALUES = [
  'ota_floor',
  'direct',
  'room-',
  'L12',
  'NPLUS',
  ...DS_E.rooms.map((r) => r.roomNo),
];

function allKeys(v: unknown): string[] {
  if (Array.isArray(v)) return v.flatMap(allKeys);
  if (v && typeof v === 'object') {
    return Object.entries(v).flatMap(([k, x]) => [k, ...allKeys(x)]);
  }
  return [];
}
function allStrings(v: unknown): string[] {
  if (typeof v === 'string') return [v];
  if (Array.isArray(v)) return v.flatMap(allStrings);
  if (v && typeof v === 'object') return Object.values(v).flatMap(allStrings);
  return [];
}

describe('public answer = allowlist (SR-PE-01, SR-PE-05)', () => {
  const q = (o: Partial<EstimateQuery> = {}): EstimateQuery => ({
    roomType: 'standard-studio-garden-view',
    stayType: 'short',
    arrival: '2026-11-10',
    departure: '2026-11-13',
    months: null,
    adults: 2,
    children: 0,
    infants: 0,
    ...o,
  });
  const cases: Array<[string, ReturnType<typeof estimatePublicRate>, EstimateQuery]> = [
    [
      'ok short',
      estimatePublicRate(
        params('ota_floor'),
        roomsOf('garden'),
        short('2026-11-10', '2026-11-13', 2),
      ),
      q(),
    ],
    [
      'ok long',
      estimatePublicRate(params('direct'), roomsOf('garden'), {
        stayType: 'long',
        arrival: '2026-12-01',
        departure: null,
        months: 6,
        party: { adults: 2, children6to11: 0, childrenUnder6: 0 },
      }),
      q({ stayType: 'long', arrival: '2026-12-01', departure: null, months: 6 }),
    ],
    [
      'min stay',
      estimatePublicRate(params('direct'), roomsOf('city'), short('2026-11-14', '2026-11-15', 2)),
      q(),
    ],
    [
      'over capacity',
      estimatePublicRate(params('direct'), roomsOf('garden'), short('2026-11-10', '2026-11-13', 4)),
      q(),
    ],
    [
      'not open',
      estimatePublicRate(
        params('direct'),
        roomsOf('premium'),
        short('2026-12-31', '2027-01-03', 2),
      ),
      q(),
    ],
    [
      'unavailable',
      estimatePublicRate(params('direct'), [], short('2026-11-10', '2026-11-13', 2)),
      q(),
    ],
  ];

  it.each(cases)(
    '%s: every key (nested too) is in the schema, no forbidden string',
    (_n, e, query) => {
      const dto = publicEstimateDto(
        query,
        { estimate: e, computedAt: '2026-11-01T10:00:00.000+07:00', taxIncluded: true },
        e.status === 'ok'
          ? { estimateToken: 'pe1.abc.def', expiresAt: '2026-11-02T10:00:00.000+07:00' }
          : null,
      );
      expect(keysAllowed(dto, SCHEMA)).toEqual([]);
      for (const r of SCHEMA.required ?? []) expect(dto, r).toHaveProperty(r);
      for (const k of allKeys(dto)) {
        expect(k).not.toBe('available');
        for (const f of FORBIDDEN_KEYS) expect(k.toLowerCase(), k).not.toContain(f);
      }
      for (const v of allStrings(dto)) for (const f of FORBIDDEN_VALUES) expect(v, f).not.toBe(f);
      for (const v of allStrings(dto)) expect(v).not.toMatch(/room-|ota_floor/);
    },
  );

  it('status → contract: min_stay = on_request + note, over capacity = party_exceeds_room, not_open/unavailable = on_request', () => {
    const dto = (i: number) =>
      publicEstimateDto(
        cases[i]![2],
        { estimate: cases[i]![1], computedAt: 'x', taxIncluded: true },
        null,
      );
    expect(dto(2)).toMatchObject({
      priceAvailable: false,
      unavailableReason: 'on_request',
      notes: [{ code: 'min_stay', minNights: 2 }],
    });
    expect(dto(3)).toMatchObject({ unavailableReason: 'party_exceeds_room' });
    expect(dto(4)).toMatchObject({ unavailableReason: 'on_request', notes: [] });
    expect(dto(5)).toMatchObject({ unavailableReason: 'on_request' });
    expect(dto(1)).toMatchObject({
      stayKind: 'long',
      longStay: { months: 6, monthlyFromVnd: 8_280_000 },
      notes: [{ code: 'monthly_excludes_utilities' }],
    });
    expect(dto(1)).not.toHaveProperty('departure');
  });

  it('SR-PE-04: the port never reads bookings, holds, occupancy or room statuses', () => {
    const src = readFileSync(
      join(__dirname, '../src/modules/reservations/public/public-rate.port.ts'),
      'utf8',
    );
    const sql = (src.match(/`[^`]*`/g) ?? []).join('\n');
    expect(sql).toMatch(/FROM room rm/);
    for (const t of [
      'reservation',
      'room_occupancy',
      'stay_night',
      'hold',
      'room_status',
      'hk_task',
      'quote',
    ]) {
      expect(sql, t).not.toMatch(new RegExp(`\\b${t}\\b`));
    }
  });
});

// ───────────────────────── query rules (SR-PE-02/03) ─────────────────────────

describe('getPublicPriceEstimate query', () => {
  const codes = (raw: string) => {
    try {
      parseEstimateQuery(raw);
      return [];
    } catch (e) {
      expect(e).toBeInstanceOf(ProblemError);
      expect((e as ProblemError).code).toBe('VALIDATION_FAILED');
      return (
        (e as ProblemError & { options?: { errors?: unknown[] } }).options?.errors ??
        (e as unknown as { errors?: unknown[] }).errors ??
        []
      );
    }
  };
  const ok =
    'roomType=standard-studio-garden-view&arrival=2026-11-10&departure=2026-11-13&adults=2';

  it('a normal query parses (defaults short, children 0, infants 0)', () => {
    expect(parseEstimateQuery(ok)).toEqual({
      roomType: 'standard-studio-garden-view',
      stayType: 'short',
      arrival: '2026-11-10',
      departure: '2026-11-13',
      months: null,
      adults: 2,
      children: 0,
      infants: 0,
    });
  });

  it.each([
    ['channel=ota'],
    ['promoCode=OTTIMO-BACK5'],
    ['nationality=KR'],
    ['roomId=1'],
    ['currency=USD'],
    ['adults=3'],
  ])('an unknown or repeated parameter (%s) → 422', (extra) => {
    expect(() => parseEstimateQuery(`${ok}&${extra}`)).toThrow(ProblemError);
  });

  it('query over 256 bytes → 422', () => {
    expect(() => parseEstimateQuery(`${ok}&roomType=${'a'.repeat(300)}`)).toThrow(ProblemError);
  });

  it('field codes like the form', () => {
    expect(JSON.stringify(codes('arrival=2026-11-10&departure=2026-11-13'))).toContain('REQUIRED');
    expect(JSON.stringify(codes(`${ok.replace('adults=2', 'adults=13')}`))).toContain(
      'VALUE_OUT_OF_RANGE',
    );
    expect(
      JSON.stringify(
        codes('roomType=x-y&stayType=long&arrival=2026-12-01&departure=2026-12-20&adults=2'),
      ),
    ).toContain('NOT_ALLOWED');
    expect(JSON.stringify(codes('roomType=x-y&arrival=2026-11-10&adults=2'))).toContain(
      '"departure"',
    );
    expect(() => checkEstimateDates(parseEstimateQuery(ok), '2026-11-11', 365)).toThrow(/./);
    expect(() =>
      checkEstimateDates(
        parseEstimateQuery(ok.replace('departure=2026-11-13', 'departure=2026-11-09')),
        '2026-11-01',
        365,
      ),
    ).toThrow(/./);
    expect(() => checkEstimateDates(parseEstimateQuery(ok), '2026-11-01', 365)).not.toThrow();
  });
});

// ───────────────────────── token pe1 ─────────────────────────

describe('estimate token pe1 (ARC 2.7)', () => {
  const sign = (m: string) => createHmac('sha256', 'unit-key').update(m).digest('hex');
  const now = new Date('2026-11-01T03:00:00Z');
  const payload: EstimatePayload = {
    rt: 'standard-studio-garden-view',
    st: 'short',
    a: '2026-11-10',
    d: '2026-11-13',
    m: null,
    ad: 2,
    c: 0,
    i: 0,
    tot: 2_280_000,
    n: 3,
    los: 0,
    xp: 0,
    pv: '0123456789abcdef',
    iat: Math.floor(now.getTime() / 1000),
    exp: Math.floor(now.getTime() / 1000) + 24 * 3600,
  };
  const token = issueEstimateToken(sign, 'prop-1', payload);
  const req = {
    roomType: 'standard-studio-garden-view',
    stayType: 'short' as const,
    arrival: '2026-11-10',
    departure: '2026-11-13',
    months: null,
    adults: 2,
    children: 0,
    infants: 0,
  };

  it('format, size, no personal data, round trip', () => {
    expect(token).toMatch(ESTIMATE_TOKEN);
    expect(token.length).toBeLessThan(400);
    const check = verifyEstimateToken(sign, 'prop-1', token, now);
    expect(check).toEqual({ ok: true, payload });
    expect(tokenMatches(payload, req)).toBe(true);
  });

  it('one byte changed / other property / expired / not a string → refused', () => {
    const [h, b, s] = token.split('.') as [string, string, string];
    const flip = (x: string) => (x[0] === 'A' ? `B${x.slice(1)}` : `A${x.slice(1)}`);
    expect(verifyEstimateToken(sign, 'prop-1', `${h}.${flip(b)}.${s}`, now).ok).toBe(false);
    expect(verifyEstimateToken(sign, 'prop-1', `${h}.${b}.${flip(s)}`, now).ok).toBe(false);
    expect(verifyEstimateToken(sign, 'prop-2', token, now).ok).toBe(false);
    expect(
      verifyEstimateToken(sign, 'prop-1', token, new Date(now.getTime() + 24 * 3600_000)),
    ).toEqual({ ok: false, reason: 'expired' });
    expect(verifyEstimateToken(sign, 'prop-1', 12345, now).ok).toBe(false);
  });

  it('every input must match the request (dates, party, type, stay type)', () => {
    expect(tokenMatches(payload, { ...req, departure: '2026-11-14' })).toBe(false);
    expect(tokenMatches(payload, { ...req, adults: 3 })).toBe(false);
    expect(tokenMatches(payload, { ...req, infants: 1 })).toBe(false);
    expect(tokenMatches(payload, { ...req, roomType: 'premium-one-bedroom-1' })).toBe(false);
    expect(tokenMatches(payload, { ...req, roomType: null })).toBe(false);
  });
});

// ───────────────────────── locales (FB-INV-008) ─────────────────────────

describe('LandingLocale + LANDING_LOCALES (ARC 3.4)', () => {
  it('the server list = OpenAPI LandingLocale enum', () => {
    expect([...LANDING_LOCALE_VALUES].sort()).toEqual(
      [...(SPEC.components.schemas.LandingLocale?.enum ?? [])].sort(),
    );
  });

  it('LANDING_LOCALES: default en,vi; duplicates dropped; an unknown item stops the api', () => {
    expect(landingLocalesFrom(undefined)).toEqual(['en', 'vi']);
    expect(landingLocalesFrom(' en, vi ,ko,zh,ru,ko ')).toEqual(['en', 'vi', 'ko', 'zh', 'ru']);
    expect(() => landingLocalesFrom('en,xx')).toThrow(/LANDING_LOCALES/);
    expect(() => publicSiteOptionsFrom({ LANDING_LOCALES: 'en,ja' })).toThrow(/LANDING_LOCALES/);
    expect(publicSiteOptionsFrom({}).landingLocales).toEqual(['en', 'vi']);
  });

  it('unexpected_script by the page language', () => {
    const ko = '늦게 도착할 예정입니다 (around 22:00)';
    const zh = '我们大约晚上十点到达，谢谢。';
    const ru = 'Приедем поздно, около 22:00.';
    expect(hasUnexpectedScript(ko, 'ko')).toBe(false);
    expect(hasUnexpectedScript(ko, 'en')).toBe(true);
    expect(hasUnexpectedScript(zh, 'zh')).toBe(false);
    expect(hasUnexpectedScript(zh, 'ko')).toBe(true);
    expect(hasUnexpectedScript(ru, 'ru')).toBe(false);
    expect(hasUnexpectedScript(ru, 'vi')).toBe(true);
    expect(hasUnexpectedScript('Phòng có view vườn không ạ? Ｈｅｌｌｏ', 'vi')).toBe(false);
    expect(hasUnexpectedScript('ありがとう', 'zh')).toBe(true);
  });

  it('NFKC: full-width card digits are caught; foreign ID numbers too (fake numbers)', () => {
    expect(
      looksLikeCard('卡号 １２３４ ５６７８ ９０１２ ３４５６'.replace(/１２３４/, '４１１１')),
    ).toBe(looksLikeCard('4111 5678 9012 3456'));
    expect(looksLikeCard('４１１１ １１１１ １１１１ １１１１')).toBe(true);
    expect(looksLikeCard('１２３４ ５６７８ ９０１２ ３４５６'.normalize('NFKC'))).toBe(
      looksLikeCard('１２３４ ５６７８ ９０１２ ３４５６'),
    );
    expect(looksLikeIdNumber('주민번호 900101-1234567')).toBe(true);
    expect(looksLikeIdNumber('身份证 11010519491231002X')).toBe(true);
    expect(looksLikeIdNumber('паспорт 45 07 123456')).toBe(true);
    expect(looksLikeIdNumber('０７９２０３０１２３４５')).toBe(true);
    // Not IDs: phones and dates stay allowed.
    expect(looksLikeIdNumber('Zalo 0905 111 222, đến 23/11/2026 lúc 22:30')).toBe(false);
    expect(looksLikeIdNumber('+82 10 1234 5678')).toBe(false);
  });
});
