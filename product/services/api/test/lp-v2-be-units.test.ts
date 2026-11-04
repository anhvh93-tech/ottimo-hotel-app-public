/**
 * R4 gói LP-v2 – BE units (no database): BR-115/116 public price estimate (the 12 numbered cases of DOM
 * `rounds/round-04/outputs/DOM/web-price-estimate-rules.md` mục 11 – expected numbers copied from that table, not
 * recomputed here – plus the INV price table 01/11 cases of BR v0.5.0 / DOM pricing-spec-2026-11-01-reconcile), the public DTO allowlist (SEC SR-PE-01/05), the query rules (SR-PE-02/03), the `pe1` token
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
  type PublicRateRoom,
  estimatePublicRate,
} from '../src/modules/reservations/public/public-rate';
import { DS_E } from './helpers/reservations-fixture';

const param = <T>(k: string): T => {
  const p = DS_E.parameters.find((x) => x.param === k);
  if (!p) throw new Error(`DS-E has no ${k}`);
  return p.value as T;
};

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
      baseOccupancy: r.baseOccupancy,
      maxOccupancy: r.maxOccupancy,
      blocked: false,
      listPrices: [
        {
          effectiveFrom: '2026-10-01',
          nightlyVnd: (r as unknown as { expectedNightlyListPriceVnd: number })
            .expectedNightlyListPriceVnd,
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

const params = (pricing: PricingParams = PRICING) => ({
  pricing,
  openUntil: '2027-01-01',
});
const short = (arrival: string, departure: string, adults: number, c = 0, i = 0) => ({
  stayType: 'short' as const,
  arrival,
  departure,
  months: null,
  party: { adults, children6to11: c, childrenUnder6: i },
});

// INV 01/11 "one price for every channel" (BR-116 v0.5.0, ARC FB-R4-ARC-BE-LPV2-04): no OTA floor, no parity mode –
// the engine is the Desk DIRECT quote. The DOM mục 11 numbers below are the old `direct` column (engine check on the
// DS-E table; the old `ota_floor` column no longer exists).
describe('BR-115 – DOM mục 11 cases on the DS-E table (pure engine, same functions as the desk, direct only)', () => {
  const run = (t: string, r: ReturnType<typeof short>, rooms = roomsOf(t)) =>
    estimatePublicRate(params(), rooms, r);

  it('ca 1 – Garden Studio, 2 NL, Tue 10/11 – Fri 13/11: 2.250.000 (to 2.376.000)', () => {
    const d = run('garden', short('2026-11-10', '2026-11-13', 2));
    expect(d.status).toBe('ok');
    expect(d.shortStay).toMatchObject({ nights: 3, totalVnd: 2_250_000, toTotalVnd: 2_376_000 });
    expect(d.shortStay?.lines).toEqual([{ nights: 3, nightlyVnd: 750_000 }]);
  });

  it('ca 2 – City Studio, 3 NL, Fri 13 – Sun 15/11: 1.834.000 (to 1.928.000)', () => {
    const d = run('city', short('2026-11-13', '2026-11-15', 3));
    expect(d.shortStay).toMatchObject({
      totalVnd: 1_834_000,
      toTotalVnd: 1_928_000,
      roomSubtotalVnd: 1_534_000,
      upliftNights: 2,
      extraPersonFeeVnd: 300_000,
      losDiscountPct: 0,
      losDiscountVnd: 0,
    });
  });

  it('ca 3 – Signature, 4 NL + child 8 + child 3, 16–23/11 (7 nights): 6.994.000 (to 7.546.000)', () => {
    const d = run('signature', short('2026-11-16', '2026-11-23', 4, 1, 1));
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
  });

  it('ca 4 – Premium, 2 NL, 31/12/2026 – 02/01/2027 (2 special nights): 2.384.000 (to 2.600.000)', () => {
    const d = run('premium', short('2026-12-31', '2027-01-02', 2));
    expect(d.shortStay).toMatchObject({ totalVnd: 2_384_000, toTotalVnd: 2_600_000 });
  });

  it('ca 4b – same arrival, 1 night: no number, min stay 2 (BR-113)', () => {
    const e = run('premium', short('2026-12-31', '2027-01-01', 2));
    expect(e).toMatchObject({ status: 'min_stay', minNights: 2 });
    expect(e.shortStay).toBeUndefined();
  });

  it('ca 4c – departure 03/01/2027 (night 02/01 after open_until 01/01/2027): no number', () => {
    const e = run('premium', short('2026-12-31', '2027-01-03', 2));
    expect(e.status).toBe('not_open');
    expect(e.shortStay).toBeUndefined();
  });

  // ESC-043 câu 2 (INV 01/11): the web shows NO monthly price – DOM ca 5/5b (8.280.000 / 8.550.000) now answer
  // `monthly_offer` without any amount; the monthly numbers stay in the private quote only.
  it('ca 5 / 5b – Garden Studio, 6 or 4 months or no length: monthly_offer, no amount at all', () => {
    for (const months of [6, 4, null]) {
      const e = estimatePublicRate(params(), roomsOf('garden'), {
        stayType: 'long',
        arrival: '2026-12-01',
        departure: null,
        months,
        party: { adults: 2, children6to11: 0, childrenUnder6: 0 },
      });
      expect(e).toEqual({ status: 'monthly_offer', stayKind: 'long', priceGapRoomIds: [] });
    }
  });

  it('monthly: over capacity still says so; a type without sellable room → unavailable', () => {
    const base = {
      stayType: 'long' as const,
      arrival: '2026-12-01',
      departure: null,
      months: 6,
      party: { adults: 4, children6to11: 0, childrenUnder6: 0 },
    };
    expect(estimatePublicRate(params(), roomsOf('garden'), base).status).toBe('over_capacity');
    expect(estimatePublicRate(params(), [], base).status).toBe('unavailable');
  });

  it('ca 6 – City Studio 30/11 – 02/12, OWN scheduled 101 = 650.000 from 01/12: 1.317.000 (to 1.416.000)', () => {
    const scheduled = (r: PublicRateRoom): PublicRateRoom =>
      r.roomId === 'room-101'
        ? {
            ...r,
            listPrices: [...r.listPrices, { effectiveFrom: '2026-12-01', nightlyVnd: 650_000 }],
          }
        : r;
    const rooms = roomsOf('city', scheduled);
    const d = run('city', short('2026-11-30', '2026-12-02', 2), rooms);
    expect(d.shortStay).toMatchObject({ totalVnd: 1_317_000, toTotalVnd: 1_416_000 });
  });

  it('ca 7 – Garden Studio, 4 NL: no number, "max 3 guests" (party_exceeds_room)', () => {
    expect(run('garden', short('2026-11-10', '2026-11-13', 4)).status).toBe('over_capacity');
  });

  it('ca 8 – City Studio, 2 NL, Sat 14/11, 1 night: no number, min stay 2 (no orphan-night exception on the web)', () => {
    expect(run('city', short('2026-11-14', '2026-11-15', 2))).toMatchObject({
      status: 'min_stay',
      minNights: 2,
    });
  });

  it('ca 9 – Premium, 2 NL, 10–13/11, room 302 OOO 09–12/11: 3.000.000 (402 only)', () => {
    const rooms = roomsOf('premium', (r) =>
      r.roomId === 'room-302' ? { ...r, blocked: true } : r,
    );
    const e = run('premium', short('2026-11-10', '2026-11-13', 2), rooms);
    expect(e.shortStay).toMatchObject({ totalVnd: 3_000_000, toTotalVnd: 3_000_000 });
  });

  it('no OTA floor any more: an empty ota_base_rate changes nothing (old G4 rule gone)', () => {
    const r = short('2026-11-16', '2026-11-23', 4, 1, 1);
    const withBase = run('signature', r);
    const noBase = estimatePublicRate(
      params({ ...PRICING, otaBaseRates: {} }),
      roomsOf('signature'),
      r,
    );
    expect(noBase).toEqual(withBase);
    expect(noBase.status).toBe('ok');
  });

  it('BR-115 (6): a room without a list price is left out (never "from 0") and reported; none left → unavailable', () => {
    const gap = roomsOf('city', (r) => (r.roomId === 'room-101' ? { ...r, listPrices: [] } : r));
    const e = run('city', short('2026-11-10', '2026-11-13', 2), gap);
    expect(e.shortStay?.totalVnd).toBe(3 * 708_000);
    expect(e.priceGapRoomIds).toEqual(['room-101']);
    const none = run('city', short('2026-11-10', '2026-11-13', 2), [
      { ...(ROOMS['101'] as PublicRateRoom), listPrices: [] },
    ]);
    expect(none).toMatchObject({ status: 'unavailable', priceGapRoomIds: ['room-101'] });
  });

  it('≥ long_stay_required_from_nights (28 in DS-E) is a long stay (BR-108): monthly_offer, flagged', () => {
    const e = run('garden', short('2026-11-10', '2026-12-10', 2));
    expect(e).toEqual({
      status: 'monthly_offer',
      stayKind: 'long',
      longStayRequired: true,
      priceGapRoomIds: [],
    });
  });
});

// ───────── INV price table 01/11/2026 (BR v0.5.0 mục 2.0; DOM pricing-spec-2026-11-01-reconcile 2.2–2.4) ─────────
// OWN parameters after the switch (DOM 2.3 B1–B6, ESC-045 câu 1 = A): no weekend/holiday uplift, no LOS tier,
// 30 nights → monthly, extra adult 150.000, child 6–11 100.000. One nightly price per type for every channel:
// Studio (City/Garden) 800.000 · Premium 1.100.000 · Signature 1.300.000; base/max = 2/3 · 3/4 · 4/5.
const TABLE_0111: PricingParams = {
  ...PRICING,
  calendar: { ...PRICING.calendar, weekendUpliftPct: 0, specialUpliftPct: 0 },
  losTiers: [],
  extraAdultFeeVnd: 150_000,
  child611FeeVnd: 100_000,
  shortStayMaxNights: 29,
  longStayRequiredFromNights: 30,
  otaBaseRates: { L12: 800_000, N: 1_300_000, NPLUS: 1_100_000 },
};
const NIGHTLY_0111: Record<string, number> = {
  city: 800_000,
  garden: 800_000,
  premium: 1_100_000,
  signature: 1_300_000,
};
/** OWN enters the new price with "effective from" = the switch day 03/11 (DOM 2.1); earlier nights keep the old one. */
const rooms0111 = (t: string) =>
  roomsOf(t, (r) => ({
    ...r,
    listPrices: [
      ...r.listPrices,
      { effectiveFrom: '2026-11-03', nightlyVnd: NIGHTLY_0111[t] as number },
    ],
  }));

describe('BR-115 on the INV price table 01/11 (ARC FB-R4-ARC-BE-LPV2-05)', () => {
  const run = (t: string, r: ReturnType<typeof short>) =>
    estimatePublicRate(params(TABLE_0111), rooms0111(t), r);

  it('Garden Studio, 3 NL, Tue 10 – Fri 13/11 (3 nights): 3 × 800.000 + 3 × 150.000 = 2.850.000', () => {
    const e = run('garden', short('2026-11-10', '2026-11-13', 3));
    expect(e.status).toBe('ok');
    expect(e.shortStay).toMatchObject({
      nights: 3,
      roomSubtotalVnd: 2_400_000,
      extraPersonFeeVnd: 450_000,
      totalVnd: 2_850_000,
      toTotalVnd: 2_850_000,
      losDiscountPct: 0,
      losDiscountVnd: 0,
      upliftNights: 0,
    });
    expect(e.shortStay?.lines).toEqual([{ nights: 3, nightlyVnd: 800_000 }]);
  });

  it('weekend parameter = 0: Studio Fri 06 – Sun 08/11, 2 NL → 1.600.000, no uplift night (DOM C2)', () => {
    const e = run('city', short('2026-11-06', '2026-11-08', 2));
    expect(e.shortStay).toMatchObject({
      totalVnd: 1_600_000,
      upliftNights: 0,
      nightlyAvgVnd: 800_000,
    });
  });

  it('no LOS discount: Signature, 5 NL, 7 nights 09 – 16/11 → 7 × 1.300.000 + 7 × 150.000 = 10.150.000 (DOM C3)', () => {
    const e = run('signature', short('2026-11-09', '2026-11-16', 5));
    expect(e.shortStay).toMatchObject({
      nights: 7,
      roomSubtotalVnd: 9_100_000,
      extraPersonFeeVnd: 1_050_000,
      totalVnd: 10_150_000,
      losDiscountPct: 0,
      losDiscountVnd: 0,
    });
  });

  it('no LOS discount at 14 nights: Garden, 2 NL → 14 × 800.000 = 11.200.000 (DOM C4)', () => {
    expect(run('garden', short('2026-11-04', '2026-11-18', 2)).shortStay?.totalVnd).toBe(
      11_200_000,
    );
  });

  it('Premium, 3 NL + 1 child 8, 2 nights → 2 × 1.100.000 + 2 × 100.000 = 2.400.000 (DOM 2.4 #4)', () => {
    const e = run('premium', short('2026-11-10', '2026-11-12', 3, 1));
    expect(e.shortStay).toMatchObject({ totalVnd: 2_400_000, extraPersonFeeVnd: 200_000 });
  });

  it('holiday parameter = 0: Premium 31/12 – 02/01, 2 NL → 2.200.000, no uplift night', () => {
    const e = run('premium', short('2026-12-31', '2027-01-02', 2));
    expect(e.shortStay).toMatchObject({ totalVnd: 2_200_000, upliftNights: 0 });
  });

  it('29 nights is still a short stay with a number: City Studio, 2 NL → 23.200.000 (DOM 2.4 #3)', () => {
    const e = run('city', short('2026-11-10', '2026-12-09', 2));
    expect(e).toMatchObject({ status: 'ok', stayKind: 'short' });
    expect(e.longStayRequired).toBeUndefined();
    expect(e.shortStay).toMatchObject({ nights: 29, totalVnd: 23_200_000 });
  });

  it('30 nights → monthly_offer, no amount, long_stay_required (BR-108 = 30)', () => {
    expect(run('city', short('2026-11-10', '2026-12-10', 2))).toEqual({
      status: 'monthly_offer',
      stayKind: 'long',
      longStayRequired: true,
      priceGapRoomIds: [],
    });
  });

  it('a stay across the switch day prices each night by its own list price (BR-101)', () => {
    // Garden 102 old list price 750.000 on 02/11, the new 800.000 from 03/11.
    const e = run('garden', short('2026-11-02', '2026-11-04', 2));
    expect(e.shortStay?.totalVnd).toBe(750_000 + 800_000);
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
      estimatePublicRate(params(), roomsOf('garden'), short('2026-11-10', '2026-11-13', 2)),
      q(),
    ],
    [
      'monthly offer',
      estimatePublicRate(params(), roomsOf('garden'), {
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
      estimatePublicRate(params(), roomsOf('city'), short('2026-11-14', '2026-11-15', 2)),
      q(),
    ],
    [
      'over capacity',
      estimatePublicRate(params(), roomsOf('garden'), short('2026-11-10', '2026-11-13', 4)),
      q(),
    ],
    [
      'not open',
      estimatePublicRate(params(), roomsOf('premium'), short('2026-12-31', '2027-01-03', 2)),
      q(),
    ],
    ['unavailable', estimatePublicRate(params(), [], short('2026-11-10', '2026-11-13', 2)), q()],
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
      if (dto.priceAvailable === false) {
        // No amount at all when there is no price (monthly_offer included – ESC-043 câu 2).
        expect(allKeys(dto).filter((k) => k.endsWith('Vnd') || k === 'estimateToken')).toEqual([]);
        expect(Object.values(dto).filter((v) => typeof v === 'number')).toEqual([]);
      }
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
    // ESC-043 câu 2: monthly → no amount, no token, the page shows the special-offer invitation.
    expect(dto(1)).toEqual({
      estimate: true,
      currency: 'VND',
      taxIncluded: true,
      roomType: 'standard-studio-garden-view',
      stayKind: 'long',
      arrival: '2026-12-01',
      priceAvailable: false,
      unavailableReason: 'monthly_offer',
      notes: [],
      computedAt: 'x',
    });
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
