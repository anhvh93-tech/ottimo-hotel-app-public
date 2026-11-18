/**
 * FB-INV-012 go-live fix (contract §12) – rules without a database:
 * - §12.1 `backdateBounds` (T − 45 … T − 1; previous month only while its closing can still be typed late);
 * - §12.6 `migrationLockTimeout` (MIGRATION_LOCK_TIMEOUT = 1s–120s, default 10s);
 * - SEC FB-R5-SEC-ARC-12-03: no request body of the contract accepts `outside_desk` (every requestBody and every
 *   `in: query|path|header` parameter schema of every operation, `$ref`s followed, walked for enums), PaymentCreate
 *   uses PaymentMethodInput, and `checkPaymentShape` (the shape check of every receipt path) refuses it.
 *   The walk reads openapi.yaml, not `src/generated/openapi-schemas.ts`: the generated file carries response shapes
 *   only (no enum, no request body).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { MIGRATION_LOCK_TIMEOUT, migrationLockTimeout } from '../src/db/migrate';
import { checkPaymentShape } from '../src/modules/payments/public/payment.service';
import { BACKDATE_MAX_DAYS, backdateBounds, backdateRulesOf } from '../src/shared/backdate';

const OPENAPI = join(__dirname, '..', '..', '..', 'docs', 'api', 'openapi.yaml');
const RULES = { readingWindow: { daysAfter: 1, lateMaxDays: 10 } };

describe('§12.1 backdateBounds', () => {
  it('arrival = T → USE_CHECK_IN; future or older than T − 45 → BACKDATE_OUT_OF_RANGE with earliest', () => {
    expect(BACKDATE_MAX_DAYS).toBe(45);
    expect(backdateBounds('2026-11-24', '2026-11-24', RULES)).toEqual({ code: 'USE_CHECK_IN' });
    expect(backdateBounds('2026-11-24', '2026-11-25', RULES)).toEqual({
      code: 'BACKDATE_OUT_OF_RANGE',
      earliest: '2026-10-10',
    });
    expect(backdateBounds('2026-11-24', '2026-10-09', RULES)).toEqual({
      code: 'BACKDATE_OUT_OF_RANGE',
      earliest: '2026-10-10',
    });
  });

  it('same month → ok; previous month only until last day + daysAfter + lateMaxDays; two months back closed', () => {
    expect(backdateBounds('2026-11-24', '2026-11-01', RULES)).toBeNull();
    expect(backdateBounds('2026-11-24', '2026-11-23', RULES)).toBeNull();
    // 31/10 + 1 + 10 = 11/11.
    expect(backdateBounds('2026-11-11', '2026-10-15', RULES)).toBeNull();
    expect(backdateBounds('2026-11-12', '2026-10-15', RULES)).toEqual({
      code: 'PREVIOUS_MONTH_CLOSED',
      earliest: '2026-11-01',
    });
    expect(backdateBounds('2026-12-02', '2026-10-31', RULES)).toEqual({
      code: 'PREVIOUS_MONTH_CLOSED',
      earliest: '2026-12-01',
    });
    // January ← December across the year.
    expect(backdateBounds('2027-01-05', '2026-12-20', RULES)).toBeNull();
  });

  it('rules: catalogue defaults when the parameter is absent or partial', () => {
    expect(backdateRulesOf(null)).toEqual({ readingWindow: { daysAfter: 1, lateMaxDays: 10 } });
    expect(backdateRulesOf({ readingWindow: { daysAfter: 3 } })).toEqual({
      readingWindow: { daysAfter: 3, lateMaxDays: 10 },
    });
  });
});

describe('§12.6 migrationLockTimeout', () => {
  it('default 10s; 1s–120s accepted; anything else throws', () => {
    expect(MIGRATION_LOCK_TIMEOUT).toBe('10s');
    expect(migrationLockTimeout(undefined)).toBe('10s');
    expect(migrationLockTimeout('')).toBe('10s');
    expect(migrationLockTimeout('1s')).toBe('1s');
    expect(migrationLockTimeout('120s')).toBe('120s');
    for (const bad of ['0s', '121s', '10', '10ms', '1m', ' 10s', "10s'; DROP TABLE x; --"]) {
      expect(() => migrationLockTimeout(bad)).toThrow(/1s–120s/);
    }
  });
});

describe('SEC FB-R5-SEC-ARC-12-03 – outside_desk is response-only', () => {
  type Node = Record<string, unknown>;
  const spec = parse(readFileSync(OPENAPI, 'utf8')) as Node;
  const schemas = ((spec.components as Node).schemas ?? {}) as Record<string, Node>;
  const params = ((spec.components as Node).parameters ?? {}) as Record<string, Node>;

  /** Every enum reachable from `node`, `$ref`s followed once each. */
  function enums(node: unknown, seen = new Set<string>(), out: unknown[][] = []): unknown[][] {
    if (Array.isArray(node)) {
      for (const n of node) enums(n, seen, out);
      return out;
    }
    if (!node || typeof node !== 'object') return out;
    const n = node as Node;
    if (typeof n.$ref === 'string') {
      const ref = n.$ref;
      if (seen.has(ref)) return out;
      seen.add(ref);
      const name = ref.split('/').pop() as string;
      enums(ref.includes('/parameters/') ? params[name] : schemas[name], seen, out);
      return out;
    }
    if (Array.isArray(n.enum)) out.push(n.enum);
    for (const [k, v] of Object.entries(n)) {
      if (k === 'example' || k === 'examples' || k === 'description') continue;
      enums(v, seen, out);
    }
    return out;
  }

  const operations = (): Array<{ id: string; op: Node; pathParams: unknown[] }> => {
    const list: Array<{ id: string; op: Node; pathParams: unknown[] }> = [];
    for (const item of Object.values(spec.paths as Record<string, Node>)) {
      for (const [method, op] of Object.entries(item)) {
        if (!['get', 'post', 'put', 'patch', 'delete'].includes(method)) continue;
        list.push({
          id: String((op as Node).operationId),
          op: op as Node,
          pathParams: (item.parameters as unknown[]) ?? [],
        });
      }
    }
    return list;
  };

  it('no request body of any operation reaches an enum with outside_desk', () => {
    const offenders: string[] = [];
    let bodies = 0;
    for (const { id, op } of operations()) {
      if (!op.requestBody) continue;
      bodies += 1;
      if (enums(op.requestBody).some((e) => e.includes('outside_desk'))) offenders.push(id);
    }
    expect(bodies).toBeGreaterThan(50);
    expect(offenders).toEqual([]);
  });

  it('outside_desk appears only in PaymentMethod (responses) and the listPayments filter', () => {
    const paramUsers: string[] = [];
    for (const { id, op, pathParams } of operations()) {
      const ps = [...pathParams, ...((op.parameters as unknown[]) ?? [])];
      if (enums(ps).some((e) => e.includes('outside_desk'))) paramUsers.push(id);
    }
    expect(paramUsers).toEqual(['listPayments']);
    expect(schemas.PaymentMethod!.enum).toContain('outside_desk');
    expect(schemas.PaymentMethodInput!.enum).not.toContain('outside_desk');
    expect((schemas.PaymentCreate!.properties as Node).method).toEqual({
      $ref: '#/components/schemas/PaymentMethodInput',
    });
  });

  it('checkPaymentShape refuses outside_desk (every receipt path: recordPayment, B9, B18, confirm)', () => {
    const r = checkPaymentShape(
      { type: 'charge', method: 'outside_desk', amountVnd: 100_000 } as Parameters<
        typeof checkPaymentShape
      >[0],
      { fieldPrefix: 'payment.' },
    );
    expect(r.errors).toContainEqual({ field: 'payment.method', code: 'NOT_IN_LIST' });
  });
});
