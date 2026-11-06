/**
 * V5-30 – no commission rate in code (FB-R4-SEC-BE-01 Major, FB-R4-SEC-ORC-01 G3; contract 0.3.13 1.10, 1.24; DOM
 * rules-v1.0.5 4.1, 7.3). No DB.
 * - the pure rule of `QuoteCalculation.commission.status` (computed / rate_missing / not_applicable);
 * - T30-4: the production defaults carry no commission rate – checked on KEY NAMES, never on numbers;
 * - every read of a commission rate key goes through `folio/public/commission-rate.ts` (so it catches
 *   ParameterMissingError → rate_missing), and no code reads a commission from `lease_terms`; the key NAMES live in
 *   `platform/public/commission-keys.ts` (save rule FB-R5-ARC-BE-H1-02, OWN/MGR-only filter FB-R5-ARC-BE-H1-01);
 * - FB-R5-ARC-BE-H1-02: the save rule of `short_stay_commission_pct` (DOM 4.1).
 * SEC G3: the only rates in this file are test values named `test_rate_*` (not any real or old rate).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { INV_ENTERS_KEYS, PRODUCTION_PARAMETERS } from '../src/admin/production-defaults';
import {
  SHORT_STAY_COMMISSION_KEY,
  commissionPctFor,
  commissionRateOf,
  shortStayCommissionRate,
  shortStayCommissionTable,
} from '../src/modules/folio/public/commission-rate';
import { checkStructuredParameter } from '../src/modules/platform/internal/parameter-rules';
import { COMMISSION_RATE_KEYS } from '../src/modules/platform/public/commission-keys';
import {
  ParameterMissingError,
  type ParameterService,
} from '../src/modules/platform/public/parameter.service';
import { ProblemError } from '../src/shared/problem';
import type { Tx } from '../src/db/database';

/** Test-only rates (SEC G3) – deliberately odd values, unrelated to any real table. */
const test_rate_short = 1.37;
const test_rate_ctv = 2.41;

const SRC = join(__dirname, '..', 'src');

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? files(p) : p.endsWith('.ts') ? [p] : [];
  });
}
const rel = (f: string) => relative(SRC, f).split(sep).join('/');

/** Every object key anywhere inside a value (lists and nested objects). */
function keysDeep(v: unknown): string[] {
  if (Array.isArray(v)) return v.flatMap(keysDeep);
  if (v && typeof v === 'object') {
    return Object.entries(v).flatMap(([k, x]) => [k, ...keysDeep(x)]);
  }
  return [];
}

describe('V5-30 – commission status rule (contract 0.3.13 1.10)', () => {
  const table = { staff: test_rate_short, collaborator: test_rate_ctv };

  it('T30-2: a stored rate for the payee → computed with that rate', () => {
    expect(commissionRateOf(table, 'staff')).toEqual({
      status: 'computed',
      ratePct: test_rate_short,
    });
    expect(commissionRateOf(table, 'agent')).toEqual({
      status: 'computed',
      ratePct: test_rate_ctv,
    });
  });

  it('T30-1: no table, or no valid rate for the payee → rate_missing (never 0, never a number from code)', () => {
    for (const t of [
      undefined,
      null,
      {},
      [],
      { staff: test_rate_short },
      { collaborator: String(test_rate_ctv) },
      { collaborator: -1 },
      { collaborator: 101 },
      { collaborator: Number.NaN },
    ]) {
      expect(commissionRateOf(t, 'agent')).toEqual({ status: 'rate_missing' });
    }
    expect(commissionPctFor(undefined, 'staff')).toBeNull();
  });

  it('no payee (no closer, closer neither sale nor CTV) → not_applicable, whatever the table', () => {
    expect(commissionRateOf(table, null)).toEqual({ status: 'not_applicable' });
    expect(commissionRateOf(undefined, null)).toEqual({ status: 'not_applicable' });
  });

  it('T30-5: a property without the key reads rate_missing – ParameterMissingError is caught, other errors are not', async () => {
    const tx = {} as Tx;
    const missing = {
      get: async () => {
        throw new ParameterMissingError(SHORT_STAY_COMMISSION_KEY);
      },
    } as unknown as ParameterService;
    expect(await shortStayCommissionTable(missing, tx, '2026-11-09')).toBeUndefined();
    expect(await shortStayCommissionRate(missing, tx, 'staff', '2026-11-09')).toEqual({
      status: 'rate_missing',
    });

    const keys: string[] = [];
    const stored = {
      get: async (_tx: Tx, key: string) => {
        keys.push(key);
        return table;
      },
    } as unknown as ParameterService;
    expect(await shortStayCommissionRate(stored, tx, 'agent', '2026-11-09')).toEqual({
      status: 'computed',
      ratePct: test_rate_ctv,
    });
    expect(keys).toEqual([SHORT_STAY_COMMISSION_KEY]);
    // No payee: the table is not even read.
    expect(await shortStayCommissionRate(stored, tx, null, '2026-11-09')).toEqual({
      status: 'not_applicable',
    });
    expect(keys).toHaveLength(1);

    const broken = {
      get: async () => {
        throw new Error('connection lost');
      },
    } as unknown as ParameterService;
    await expect(shortStayCommissionRate(broken, tx, 'staff', '2026-11-09')).rejects.toThrow(
      'connection lost',
    );
  });
});

describe('FB-R5-ARC-BE-H1-02 – save rule of short_stay_commission_pct (DOM rules-v1.0.5 4.1 "Kiểm khi lưu")', () => {
  const save = async (value: unknown) => {
    try {
      await checkStructuredParameter(SHORT_STAY_COMMISSION_KEY, value, async () => null);
      return null;
    } catch (e) {
      if (!(e instanceof ProblemError)) throw e;
      return { code: e.code, errors: e.options.errors, extras: e.options.extras };
    }
  };

  it.each([
    ['not an object', [test_rate_short], 'value', 'VALIDATION_FAILED'],
    ['absent', null, 'value', 'REQUIRED'],
    [
      'a rate typed as text',
      { staff: String(test_rate_short), collaborator: test_rate_ctv },
      'value.staff',
      'VALIDATION_FAILED',
    ],
    ['the CTV rate missing', { staff: test_rate_short }, 'value.collaborator', 'REQUIRED'],
    [
      'an unknown payee',
      { staff: test_rate_short, collaborator: test_rate_ctv, agent: test_rate_ctv },
      'value.agent',
      'NOT_ALLOWED',
    ],
    [
      'above 100',
      { staff: test_rate_short, collaborator: 100.01 },
      'value.collaborator',
      'VALUE_OUT_OF_RANGE',
    ],
    [
      'below 0',
      { staff: -test_rate_short, collaborator: test_rate_ctv },
      'value.staff',
      'VALUE_OUT_OF_RANGE',
    ],
    [
      'a third decimal',
      { staff: test_rate_short + 0.001, collaborator: test_rate_ctv },
      'value.staff',
      'VALIDATION_FAILED',
    ],
  ] as const)('%s → 422 PARAM_OUT_OF_RANGE on %s', async (_name, value, field, code) => {
    const e = await save(value);
    expect(e?.code).toBe('PARAM_OUT_OF_RANGE');
    expect(e?.errors).toEqual([{ field, code }]);
  });

  it('accepted: both payees with a percent of at most 2 decimals, 0 and 100 included (0 = "no commission", DOM 7.3)', async () => {
    for (const v of [
      { staff: test_rate_short, collaborator: test_rate_ctv },
      { collaborator: test_rate_ctv, staff: test_rate_short },
      { staff: 0, collaborator: 0 },
      { staff: 100, collaborator: test_rate_ctv },
    ]) {
      expect(await save(v), JSON.stringify(v)).toBeNull();
    }
  });
});

describe('V5-30 – T30-4: no commission rate in the production defaults (key names only, no numbers)', () => {
  it('short_stay_commission_pct is a key INV enters on the Desk, never written by the bootstrap', () => {
    const keys = PRODUCTION_PARAMETERS.map((p) => p.key);
    expect(keys).not.toContain(SHORT_STAY_COMMISSION_KEY);
    expect(INV_ENTERS_KEYS).toContain(SHORT_STAY_COMMISSION_KEY);
    // The future H2 keys (contract 1.22, PR-M) must not appear with a value either.
    for (const k of ['long_stay_commission', 'manager_performance_bonus_pct']) {
      expect(keys).not.toContain(k);
    }
    // Only the payout calendar keys (days of the month, not rates) keep "commission" in their name.
    expect(keys.filter((k) => /commission|bonus/i.test(k)).sort()).toEqual([
      'commission_pay_by_day',
      'commission_payable_day',
    ]);
  });

  it('no parameter value has a commission field (lease_terms keeps only its term columns)', () => {
    const nested = PRODUCTION_PARAMETERS.flatMap((p) =>
      keysDeep(p.value)
        .filter((k) => /commission|bonus/i.test(k))
        .map((k) => `${p.key}.${k}`),
    );
    expect(nested).toEqual([]);
    const lease = PRODUCTION_PARAMETERS.find((p) => p.key === 'lease_terms');
    const columns = new Set((lease?.value as Array<Record<string, unknown>>).flatMap(Object.keys));
    expect([...columns].sort()).toEqual([
      'billingCycleMonths',
      'depositFactorForeign',
      'depositFactorVn',
      'discountPct',
      'months',
    ]);
  });
});

describe('V5-30 – code scan: every commission rate read goes through commission-rate.ts (BE C0313-17)', () => {
  const sources = files(join(SRC, 'modules')).map((f) => ({
    r: rel(f),
    text: readFileSync(f, 'utf8'),
  }));

  /** The code of a file without its comments (a doc comment may name the key). */
  const code = (text: string) => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

  it("the key 'short_stay_commission_pct' is named in platform/public/commission-keys.ts only", () => {
    const named = sources
      .filter(({ text }) => /['"`]short_stay_commission_pct['"`]/.test(code(text)))
      .map(({ r }) => r);
    expect(named).toEqual(['modules/platform/public/commission-keys.ts']);
  });

  it('SHORT_STAY_COMMISSION_KEY is read in commission-rate.ts only; the platform module names it for the save rule (FB-R5-ARC-BE-H1-02)', () => {
    const users = sources
      .filter(({ text }) => /\bSHORT_STAY_COMMISSION_KEY\b/.test(text))
      .map(({ r }) => r)
      .sort();
    expect(users).toEqual([
      'modules/folio/public/commission-rate.ts',
      'modules/platform/internal/parameter-rules.ts',
      'modules/platform/public/commission-keys.ts',
    ]);
    // A read of a parameter value (ParameterService.get / getOr) with the key: commission-rate.ts only.
    const reads = sources
      .filter(({ text }) => /\.get(Or)?(<[^>]*>)?\(\s*tx,\s*SHORT_STAY_COMMISSION_KEY/.test(text))
      .map(({ r }) => r);
    expect(reads).toEqual(['modules/folio/public/commission-rate.ts']);
  });

  it('COMMISSION_RATE_KEYS (OWN/MGR only – FB-R5-ARC-BE-H1-01) is used by the parameter visibility filter only', () => {
    const users = sources
      .filter(({ text }) => /\bCOMMISSION_RATE_KEYS\b/.test(text))
      .map(({ r }) => r)
      .sort();
    expect(users).toEqual([
      'modules/platform/internal/parameters.service.ts',
      'modules/platform/public/commission-keys.ts',
    ]);
    expect([...COMMISSION_RATE_KEYS].sort()).toEqual([
      'long_stay_commission',
      'manager_performance_bonus_pct',
      SHORT_STAY_COMMISSION_KEY,
    ]);
  });

  it('no code reads a commission from lease_terms (old commissionStaffPct / commissionCollaboratorPct)', () => {
    const all = files(SRC)
      .filter((f) => !rel(f).startsWith('db/migrations/'))
      .map((f) => ({ r: rel(f), text: readFileSync(f, 'utf8') }));
    expect(
      all.filter(({ text }) => /commission(Staff|Collaborator)Pct/.test(text)).map(({ r }) => r),
    ).toEqual([]);
  });
});
