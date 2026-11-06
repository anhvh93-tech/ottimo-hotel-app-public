/**
 * V5-30 – no commission rate in code (FB-R4-SEC-BE-01 Major, FB-R4-SEC-ORC-01 G3; contract 0.3.13 1.10, 1.24; DOM
 * rules-v1.0.5 4.1, 7.3). No DB.
 * - the pure rule of `QuoteCalculation.commission.status` (computed / rate_missing / not_applicable);
 * - T30-4: the production defaults carry no commission rate – checked on KEY NAMES, never on numbers;
 * - every read of a commission rate key goes through `folio/public/commission-rate.ts` (so it catches
 *   ParameterMissingError → rate_missing), and no code reads a commission from `lease_terms`.
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
import {
  ParameterMissingError,
  type ParameterService,
} from '../src/modules/platform/public/parameter.service';
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

  it("the key 'short_stay_commission_pct' is read in commission-rate.ts only", () => {
    const readers = sources
      .filter(({ text }) => /['"`]short_stay_commission_pct['"`]/.test(text))
      .map(({ r }) => r);
    expect(readers).toEqual(['modules/folio/public/commission-rate.ts']);
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
