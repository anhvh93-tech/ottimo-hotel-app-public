/**
 * V5-25 (P1, v1.0.5) – BUG-R5-001 (`weekend_nights`) and BUG-R5-003 (`min_stay`), no database:
 * - the save rules of `setParameter` (`checkStructuredParameter`) against the DOM oracle BR-113-06…28
 *   (`product/tests/fixtures/br-examples.json`, DOM rules-v1.0.5 12.6) and QA's cases BUG-R5-001 (a), BUG-R5-003 (a);
 * - the defensive read (DOM 12.3): `minStayNights` / `readMinStay` / the web estimate never throw on a stored value
 *   of the wrong shape (BUG-R5-003 (b), oracle BR-113-29/30);
 * - the other structured keys of the quote / booking / web / check-in / check-out paths (BUG-R5-003 (f)): the
 *   production value and the DS-E value are accepted, a wrong shape is refused;
 * - every value the team ships (production-defaults.ts, DS-E) passes the new rules (plan V5-25 AC2).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Logger } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PRODUCTION_PARAMETERS } from '../src/admin/production-defaults';
import { ParameterMissingError } from '../src/modules/platform/public/parameter.service';
import {
  type ScheduledValues,
  checkStructuredParameter,
} from '../src/modules/platform/internal/parameter-rules';
import { WEEKDAY_CODES, logSafeField } from '../src/modules/platform/public/parameter-shapes';
import { readMinStay, resetMinStayReadLog } from '../src/modules/reservations/public/min-stay-read';
import { type MinStayRule, minStayNights } from '../src/modules/reservations/public/pricing';
import { estimatePublicRate } from '../src/modules/reservations/public/public-rate';
import type { PricingParams } from '../src/modules/reservations/public/pricing.service';
import { ProblemError } from '../src/shared/problem';
import {
  BAD_SHAPES,
  GOOD_SHAPES,
  MIN_STAY_BAD,
  PROD_MIN_STAY,
} from './helpers/parameter-shape-cases';
import { DS_E } from './helpers/reservations-fixture';

interface OracleRow {
  id: string;
  params?: Record<string, unknown>;
  pendingFix?: string;
  input: Record<string, unknown>;
  expected: Record<string, unknown>;
}
const oracle = JSON.parse(
  readFileSync(join(__dirname, '../../../tests/fixtures/br-examples.json'), 'utf8'),
) as { examples: OracleRow[] };
const row = (id: string) => oracle.examples.find((e) => e.id === id) as OracleRow;
const ids = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => `BR-113-${String(from + i).padStart(2, '0')}`);

const PRODUCTION = new Map(PRODUCTION_PARAMETERS.map((p) => [p.key, p.value]));
const DSE = new Map<string, unknown>([
  ...DS_E.parameters.map((p) => [p.param, p.value] as [string, unknown]),
  ['lease_terms', (DS_E as unknown as { leaseTerms: unknown }).leaseTerms],
]);

const others =
  (m: ReadonlyMap<string, unknown> | Record<string, unknown>) =>
  async (k: string): Promise<unknown> => {
    const map = m instanceof Map ? m : new Map(Object.entries(m));
    if (map.has(k)) return map.get(k);
    // What ParameterService.get throws for a key with no row in force (ARC FB-R5-ARC-BE-06: only this reads as null).
    throw new ParameterMissingError(k);
  };

/** The 422 of a refused save (or null when accepted). */
async function save(
  key: string,
  value: unknown,
  other: Record<string, unknown> | ReadonlyMap<string, unknown> = {},
  scheduled?: ScheduledValues,
): Promise<ProblemError | null> {
  try {
    await checkStructuredParameter(key, value, others(other), async () => [], scheduled);
    return null;
  } catch (e) {
    if (e instanceof ProblemError) return e;
    throw e;
  }
}
const extrasOf = (e: ProblemError | null) => (e?.options.extras ?? {}) as Record<string, unknown>;
const fieldOf = (e: ProblemError | null) => e?.options.errors?.[0];

describe('BUG-R5-001 – weekend_nights takes weekday codes (DOM 8.4)', () => {
  it('(a) ["FRI","SAT"] (production, DS-E) is accepted', async () => {
    expect(await save('weekend_nights', ['FRI', 'SAT'])).toBeNull();
    expect(await save('weekend_nights', PRODUCTION.get('weekend_nights'))).toBeNull();
    expect(await save('weekend_nights', ['SUN'])).toBeNull();
    expect(await save('weekend_nights', [...WEEKDAY_CODES])).toBeNull();
  });

  it.each([
    ['[]', [], 'value', 'REQUIRED'],
    ['["FRI","FRI"]', ['FRI', 'FRI'], 'value[1]', 'DUPLICATE'],
    ['["FRX"]', ['FRX'], 'value[0]', 'NOT_IN_LIST'],
    [
      '[5,6] (ISO numbers – the form the v1.0.4 Desk message led to)',
      [5, 6],
      'value[0]',
      'NOT_IN_LIST',
    ],
    ['"FRI" (not a list)', 'FRI', 'value', 'VALIDATION_FAILED'],
    ['["fri"] (lower case)', ['fri'], 'value[0]', 'NOT_IN_LIST'],
    ['null', null, 'value', 'REQUIRED'],
  ])('(a) %s → 422 PARAM_OUT_OF_RANGE, allowed = the 7 codes', async (_l, value, field, code) => {
    const e = await save('weekend_nights', value);
    expect(e?.code).toBe('PARAM_OUT_OF_RANGE');
    expect(fieldOf(e)).toEqual({ field, code });
    // The Desk sentence "Chọn một trong: {allowed}" now lists the codes, never 1…7.
    expect(extrasOf(e)).toEqual({ allowed: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] });
  });
});

describe('BUG-R5-003 – min_stay save rules (DOM 12.1–12.2, oracle BR-113-06…28)', () => {
  it('the oracle rows of V5-25 are no longer pending (DOM 12.6: pendingFix removed when BUG-R5-003 closes)', () => {
    for (const id of ids(6, 30)) {
      expect(row(id), id).toBeDefined();
      expect(row(id).pendingFix, id).toBeUndefined();
    }
  });

  // UXD copy v1.0.5 9.2: a refusal without allowed/min/max shows the "shape" sentence – these rows must carry none.
  const SHAPE_ONLY = new Set([
    'BR-113-07',
    'BR-113-08',
    'BR-113-09',
    'BR-113-20',
    'BR-113-22',
    'BR-113-27',
  ]);

  it.each(ids(6, 28).map((id) => [id, row(id)] as const))('%s', async (id, e) => {
    expect(e.input.operation).toBe('setParameter');
    const res = await save(e.input.key as string, e.input.value, e.params ?? {});
    if (e.expected.accepted === true) {
      expect(res, `${id}: ${JSON.stringify(res?.options)}`).toBeNull();
      return;
    }
    expect(res?.code, id).toBe(e.expected.problemCode);
    expect(res?.status).toBe(422);
    if (e.expected.extras) expect(extrasOf(res)).toEqual(e.expected.extras);
    if (SHAPE_ONLY.has(id)) {
      expect(extrasOf(res)).not.toHaveProperty('allowed');
      expect(extrasOf(res)).not.toHaveProperty('min');
      expect(extrasOf(res)).not.toHaveProperty('max');
    }
  });

  it('(a) QA list: number, object, nights 0, FRX, FRI twice, channel outside the list, no channels, internal → 422', async () => {
    const bad = MIN_STAY_BAD;
    for (const v of bad) {
      expect(
        (await save('min_stay', v, { short_stay_max_nights: 29 }))?.code,
        JSON.stringify(v),
      ).toBe('PARAM_OUT_OF_RANGE');
    }
    expect(await save('min_stay', PROD_MIN_STAY, { short_stay_max_nights: 29 })).toBeNull();
    expect(await save('min_stay', PRODUCTION.get('min_stay'), PRODUCTION)).toBeNull();
    expect(await save('min_stay', DSE.get('min_stay'), DSE)).toBeNull();
  });

  it('field paths follow ARC 1.24 (value[<i>].<key>)', async () => {
    const e = await save('min_stay', [PROD_MIN_STAY[0], { nights: 2, arrivalWeekdays: ['FRI'] }], {
      short_stay_max_nights: 29,
    });
    expect(fieldOf(e)).toEqual({ field: 'value[1].channels', code: 'REQUIRED' });
    expect(
      fieldOf(await save('min_stay', [{ nights: 2, channels: 'all', arrivalWeekday: ['FRI'] }])),
    ).toEqual({ field: 'value[0].arrivalWeekday', code: 'NOT_ALLOWED' });
    expect(fieldOf(await save('min_stay', null))).toEqual({ field: 'value', code: 'REQUIRED' });
    expect(fieldOf(await save('min_stay', 2))).toEqual({
      field: 'value',
      code: 'VALIDATION_FAILED',
    });
  });

  it('at most 20 rules (DOM 12.1) → 422 max 20; 20 rules are accepted', async () => {
    const rule = { nights: 2, channels: 'all', arrivalWeekdays: ['FRI'] };
    expect(
      await save(
        'min_stay',
        Array.from({ length: 20 }, () => rule),
      ),
    ).toBeNull();
    const e = await save(
      'min_stay',
      Array.from({ length: 21 }, () => rule),
    );
    expect(e?.code).toBe('PARAM_OUT_OF_RANGE');
    expect(extrasOf(e)).toEqual({ max: 20 });
  });

  it('no short_stay_max_nights in force (fresh property) → the cap is 7', async () => {
    const r = (n: number) => [{ nights: n, channels: 'all', arrivalWeekdays: ['FRI'] }];
    expect(await save('min_stay', r(7), {})).toBeNull();
    expect(extrasOf(await save('min_stay', r(8), {}))).toEqual({ min: 1, max: 7 });
  });

  it('cap and reverse check also see the rows already scheduled (DOM 12.2, both ways)', async () => {
    const rule = (n: number) => [{ nights: n, channels: 'all', arrivalWeekdays: ['FRI'] }];
    // short_stay_max_nights 29 today, 4 scheduled from 01/12; min_stay saved for 10/11 (no later min_stay row):
    // the 4 will be in force while this rule is → 5 nights refused, max 4.
    const sched =
      (rows: Record<string, Array<{ effectiveFrom: string; value: unknown }>>): ScheduledValues =>
      async (k) =>
        rows[k] ?? [];
    const later = sched({ short_stay_max_nights: [{ effectiveFrom: '2026-12-01', value: 4 }] });
    expect(extrasOf(await save('min_stay', rule(5), { short_stay_max_nights: 29 }, later))).toEqual(
      { min: 1, max: 4 },
    );
    // A later min_stay row (20/11) replaces this one before 01/12 → the 4 never meets it → accepted.
    const replaced = sched({
      short_stay_max_nights: [{ effectiveFrom: '2026-12-01', value: 4 }],
      min_stay: [{ effectiveFrom: '2026-11-20', value: rule(2) }],
    });
    expect(await save('min_stay', rule(5), { short_stay_max_nights: 29 }, replaced)).toBeNull();
    // Reverse: short_stay_max_nights 3 while a 5-night min_stay rule is scheduled → 422 min 5.
    const msLater = sched({ min_stay: [{ effectiveFrom: '2026-12-01', value: rule(5) }] });
    const e = await save('short_stay_max_nights', 3, { min_stay: rule(2) }, msLater);
    expect(e?.code).toBe('PARAM_OUT_OF_RANGE');
    expect(extrasOf(e)).toEqual({ min: 5 });
    expect(fieldOf(e)).toEqual({ field: 'value', code: 'VALUE_OUT_OF_RANGE' });
    expect(await save('short_stay_max_nights', 5, { min_stay: rule(2) }, msLater)).toBeNull();
    // Production pair: 29 / two 2-night rules → fine both ways; [] in force → any value.
    expect(await save('short_stay_max_nights', 29, { min_stay: PROD_MIN_STAY })).toBeNull();
    expect(await save('short_stay_max_nights', 1, { min_stay: [] })).toBeNull();
    // A broken stored min_stay (direct DB write) does not block the other key: only whole `nights` count.
    expect(await save('short_stay_max_nights', 1, { min_stay: 2 })).toBeNull();
  });
});

describe('BUG-R5-003 – defensive read (DOM 12.3; oracle BR-113-29/30)', () => {
  let warn: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    resetMinStayReadLog();
    warn = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });
  afterEach(() => warn.mockRestore());

  const FRIDAY = '2026-11-13';
  const SPECIALS = DSE.get('special_dates') as never;

  it('(b) minStayNights never throws on a value of the wrong shape → 0 (not a list)', () => {
    for (const v of [2, { nights: 2 }, null, undefined, 'all', true]) {
      expect(minStayNights(FRIDAY, 'direct', v as never, SPECIALS), JSON.stringify(v)).toBe(0);
    }
    // A broken rule next to a good one: the good one still applies (the engine guard alone, no reader).
    expect(
      minStayNights(
        FRIDAY,
        'direct',
        [PROD_MIN_STAY[0], { nights: 3, arrivalWeekdays: ['FRI'] }, null] as never,
        SPECIALS,
      ),
    ).toBe(2);
  });

  it('BR-113-29: stored 2 → no minimum stay, one warning, none on the next read of the same value', () => {
    const e = row('BR-113-29');
    const rules = readMinStay(e.params?.min_stay, 29, { propertyId: 'p-1' });
    expect(rules).toEqual([]);
    expect(minStayNights(e.input.arrivalDate as string, 'direct', rules, SPECIALS)).toBe(
      e.expected.minStayNights,
    );
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0]?.[0])).toMatch(/min_stay is not a list/);
    readMinStay(e.params?.min_stay, 29, { propertyId: 'p-1' });
    expect(warn).toHaveBeenCalledTimes(1);
    // Another property with the same broken value logs its own line.
    readMinStay(e.params?.min_stay, 29, { propertyId: 'p-2' });
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it('BR-113-30: the broken 3-night rule (no channels) is left out, the 2-night rule still blocks', () => {
    const e = row('BR-113-30');
    const rules = readMinStay(e.params?.min_stay, 29, { propertyId: 'p-1' });
    expect(rules).toEqual([e.params?.min_stay && (e.params.min_stay as MinStayRule[])[0]]);
    expect(minStayNights(e.input.arrivalDate as string, 'direct', rules, SPECIALS)).toBe(
      e.expected.minStayNights,
    );
    expect(warn).toHaveBeenCalledTimes(1);
    const line = String(warn.mock.calls[0]?.[0]);
    expect(line).toMatch(/1 of 2 rules left out, first value\[1\]\.channels REQUIRED/);
    // The log never carries the value itself.
    expect(line).not.toContain('arrivalWeekdays');
    expect(line).not.toContain('FRI');
  });

  it('a good value reads as it is, without a warning', () => {
    expect(readMinStay(PROD_MIN_STAY, 29)).toEqual(PROD_MIN_STAY);
    expect(readMinStay([], 29)).toEqual([]);
    expect(warn).not.toHaveBeenCalled();
  });

  it('web estimate (public-rate): a stored min_stay of the wrong shape never throws', () => {
    const pricing = {
      minStay: 2,
      longStayRequiredFromNights: 28,
      losTiers: [],
      nightRateUnit: 1000,
      extraAdultFeeVnd: 0,
      child611FeeVnd: 0,
      calendar: {
        weekendNights: ['FRI', 'SAT'],
        weekendUpliftPct: 0,
        weekendChannels: 'all',
        specialDates: [],
        specialUpliftPct: 0,
        specialChannels: 'all',
      },
    } as unknown as PricingParams;
    const est = estimatePublicRate(
      { pricing, openUntil: null },
      [
        {
          roomId: 'r1',
          baseOccupancy: 2,
          maxOccupancy: 3,
          blocked: false,
          listPrices: [{ effectiveFrom: '2026-10-01', nightlyVnd: 800_000 }],
        },
      ],
      {
        stayType: 'short',
        arrival: FRIDAY,
        departure: '2026-11-14',
        months: null,
        party: { adults: 2, children6to11: 0, childrenUnder6: 0 },
      },
    );
    expect(est.status).toBe('ok');
    expect(est.shortStay?.totalVnd).toBe(800_000);
  });
});

describe('BUG-R5-003 (f) – the other structured keys on the quote / booking / web / check-in / check-out paths', () => {
  const ROLLOVER = { business_day_rollover: '06:00' };

  it.each(BAD_SHAPES.map(([k, v, f]) => [k, JSON.stringify(v), v, f] as const))(
    '%s %s → 422 PARAM_OUT_OF_RANGE',
    async (key, _shown, value, field) => {
      const e = await save(key, value, ROLLOVER);
      expect(e?.code).toBe('PARAM_OUT_OF_RANGE');
      expect(fieldOf(e)?.field).toBe(field);
    },
  );

  it('still accepted: empty lists that mean "none", the DOM dictionary proposals, the business-day axis', async () => {
    for (const [k, v] of GOOD_SHAPES) {
      expect(await save(k, v, ROLLOVER), `${k} ${JSON.stringify(v)}`).toBeNull();
    }
  });
});

describe('plan V5-25 AC2 – every value the team ships passes the new rules', () => {
  it.each([...PRODUCTION.entries()].map(([k, v]) => [k, v] as const))(
    'production-defaults.ts %s',
    async (key, value) => {
      const res = await save(key, value, PRODUCTION);
      expect(res, `${key}: ${JSON.stringify(res?.options)}`).toBeNull();
    },
  );

  it.each([...DSE.entries()].map(([k, v]) => [k, v] as const))('DS-E %s', async (key, value) => {
    // ota_base_rate needs the room groups of the property – checked by its own tests.
    if (key === 'ota_base_rate') return;
    const res = await save(key, value, DSE);
    expect(res, `${key}: ${JSON.stringify(res?.options)}`).toBeNull();
  });

  it('the production min_stay value of 06/11 (ORC read-only check, DOM 12.4) and ["FRI","SAT"]', async () => {
    expect(await save('min_stay', PROD_MIN_STAY, { short_stay_max_nights: 29 })).toBeNull();
    expect(await save('weekend_nights', ['FRI', 'SAT'])).toBeNull();
  });
});

describe('DOM rules-v1.0.5 13.1 (FB-R5-DOM-BE-PR96-01; QA T-13-2…4) – three save rules tightened', () => {
  it('T-13-3: a percent takes at most 2 decimals (12,5 and 12,34 ok; 12,345 → VALIDATION_FAILED min 0 max 100)', async () => {
    expect(await save('los_discount', [{ minNights: 7, pct: 12.5 }])).toBeNull();
    expect(await save('los_discount', [{ minNights: 7, pct: 12.34 }])).toBeNull();
    const e = await save('los_discount', [{ minNights: 7, pct: 12.345 }]);
    expect(e?.code).toBe('PARAM_OUT_OF_RANGE');
    expect(fieldOf(e)).toEqual({ field: 'value[0].pct', code: 'VALIDATION_FAILED' });
    expect(extrasOf(e)).toEqual({ min: 0, max: 100 });
  });

  it('T-13-2: cancel_policy_direct [] → REQUIRED at value; [{minDays 0, refundPct 0}] (no refund at all) is accepted', async () => {
    const e = await save('cancel_policy_direct', []);
    expect(fieldOf(e)).toEqual({ field: 'value', code: 'REQUIRED' });
    expect(await save('cancel_policy_direct', [{ minDays: 0, refundPct: 0 }])).toBeNull();
  });

  it('T-13-4: max_open_holds_per_user needs both roles (a missing role read as "no limit" lost SEC-BE-28); 0 is accepted', async () => {
    expect(fieldOf(await save('max_open_holds_per_user', { collaborator: 3 }))).toEqual({
      field: 'value.sales_staff',
      code: 'REQUIRED',
    });
    expect(fieldOf(await save('max_open_holds_per_user', {}))).toEqual({
      field: 'value.collaborator',
      code: 'REQUIRED',
    });
    expect(await save('max_open_holds_per_user', { collaborator: 0, sales_staff: 5 })).toBeNull();
  });
});

describe('ARC FB-R5-ARC-BE-06 – only "no row in force" reads as null in the cross checks', () => {
  it('another error of the lookup is not swallowed', async () => {
    const boom = new Error('connection lost');
    const fail = async (): Promise<unknown> => {
      throw boom;
    };
    await expect(checkStructuredParameter('min_stay', PROD_MIN_STAY, fail)).rejects.toBe(boom);
    await expect(checkStructuredParameter('late_checkout_tiers', [], fail)).rejects.toBe(boom);
  });
});

describe('SEC FB-R5-SEC-BE-V525-01 – the warning of the defensive read never carries text of the stored value', () => {
  let warn: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    resetMinStayReadLog();
    warn = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });
  afterEach(() => warn.mockRestore());

  it('an unknown key with a line break and a marker → "<unknown key>", no marker, no line break, no JSON', () => {
    const forged = 'x\nERROR fake log line ZZMARK-V525';
    readMinStay([PROD_MIN_STAY[0], { ...PROD_MIN_STAY[1], [forged]: 1 }], 29, {
      propertyId: 'p-1',
    });
    expect(warn).toHaveBeenCalledTimes(1);
    const line = String(warn.mock.calls[0]?.[0]);
    expect(line).toContain('1 of 2 rules left out, first value[1].<unknown key> NOT_ALLOWED');
    expect(line).not.toContain('ZZMARK');
    expect(line).not.toContain('\n');
    expect(line).not.toMatch(/[{}"]/);
  });

  it('logSafeField keeps only paths made of the fixed names of the rules', () => {
    expect(logSafeField('value[1].channels', 'REQUIRED', 1)).toBe('value[1].channels');
    expect(logSafeField('value[0].channels[2]', 'NOT_IN_LIST', 0)).toBe('value[0].channels[2]');
    expect(logSafeField('value[3].x y', 'NOT_ALLOWED', 3)).toBe('value[3].<unknown key>');
    expect(logSafeField('value[3].a\nb', 'REQUIRED', 3)).toBe('value[3]');
    expect(logSafeField('value', 'VALIDATION_FAILED')).toBe('value');
  });
});
