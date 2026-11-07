/**
 * FB-R5-SEC-BE-S1-01 + FB-R5-ARC-BE-S1-04 – the request hash shared by AuthGuard and UnitOfWork, without a database:
 * - `request-hash.ts` is the one hash (UnitOfWork re-exports the same functions – no second copy);
 * - AuthGuard.hasCompletedKey looks a completed key up with method + path + `request_hash` (the claimKey hash), the
 *   query string left out, and never for a binary body (multipart: hashed by its upload controller after the guard –
 *   not a replay here, so 403, never a 422 / 500 thrown by the guard);
 * - ARC FB-R5-ARC-BE-123-02: the "no match" case runs the guard against a stored completed key that answers only when
 *   the SQL filters on `request_hash = $5` AND `$5` is the hash of the stored body – not a database that always says no;
 * - SEC FB-R5-SEC-BE-123-01: a body nested deeper than MAX_BODY_DEPTH (32; openapi.yaml's deepest body is 5) → 422
 *   from requestHash, and never a replay at the guard (false, no lookup, no throw) – never a RangeError / 500.
 */
import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { AuthGuard } from '../src/shared/http/auth.guard';
import {
  MAX_BODY_DEPTH,
  bodyTooDeep,
  canonicalJson,
  isBinaryBody,
  requestHash,
} from '../src/shared/http/request-hash';
import * as uow from '../src/shared/http/unit-of-work';

type HasCompletedKey = (
  req: unknown,
  operation: { idempotencyKey?: boolean },
  p: { userId: string; organizationId: string; propertyId: string | null; roles: string[] },
) => Promise<boolean>;

const KEY = '0190f5a4-6b3c-7d2e-8f10-1a2b3c4d5e6f';
const PRINCIPAL = {
  userId: '0190f5a4-0000-7000-8000-000000000001',
  organizationId: '0190f5a4-0000-7000-8000-000000000002',
  propertyId: '0190f5a4-0000-7000-8000-000000000003',
  roles: ['sales_staff'],
};

/** A guard whose database records the lookup and answers `found`. */
function guardWith(found: boolean) {
  const calls: Array<{ sql: string; params: unknown[] }> = [];
  const db = {
    withContext: async (_ctx: unknown, fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        query: async (sql: string, params: unknown[]) => {
          calls.push({ sql, params });
          return { rowCount: found ? 1 : 0, rows: found ? [{}] : [] };
        },
      }),
  };
  const guard = new AuthGuard(
    {} as never,
    db as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  );
  const hasCompletedKey = (
    guard as unknown as { hasCompletedKey: HasCompletedKey }
  ).hasCompletedKey.bind(guard);
  return { hasCompletedKey, calls };
}

/**
 * ARC 123-02: a guard whose database holds ONE completed key (method, path, hash of `storedBody`) and answers a row only
 * when the lookup filters on all of them – as PostgreSQL would.
 */
function guardWithStored(storedBody: unknown, path = '/v1/properties/p/quotes') {
  const stored = { method: 'POST', path, hash: requestHash('POST', path, storedBody) };
  const calls: Array<{ sql: string; params: unknown[] }> = [];
  const db = {
    withContext: async (_ctx: unknown, fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        query: async (sql: string, params: unknown[]) => {
          calls.push({ sql, params });
          const hit =
            /method = \$3/.test(sql) &&
            /path = \$4/.test(sql) &&
            /request_hash = \$5/.test(sql) &&
            params[2] === stored.method &&
            params[3] === stored.path &&
            params[4] === stored.hash;
          return { rowCount: hit ? 1 : 0, rows: hit ? [{}] : [] };
        },
      }),
  };
  const guard = new AuthGuard(
    {} as never,
    db as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  );
  const hasCompletedKey = (
    guard as unknown as { hasCompletedKey: HasCompletedKey }
  ).hasCompletedKey.bind(guard);
  return { hasCompletedKey, calls, stored };
}

/** `{ a: { a: … { a: leaf } } }` with `levels` objects. */
function nested(levels: number, leaf: unknown = 1): unknown {
  let v: unknown = leaf;
  for (let i = 0; i < levels; i++) v = { a: v };
  return v;
}

const req = (body: unknown, url = '/v1/properties/p/quotes') => ({
  method: 'post',
  url,
  body,
  headers: { 'idempotency-key': KEY },
});

describe('request-hash.ts (FB-R5-SEC-BE-S1-01)', () => {
  it('UnitOfWork re-exports the same functions (one hash for the guard and the unit of work)', () => {
    expect(uow.requestHash).toBe(requestHash);
    expect(uow.canonicalJson).toBe(canonicalJson);
  });

  it('isBinaryBody: Buffer, typed array, ArrayBuffer – not JSON values', () => {
    expect(isBinaryBody(Buffer.from('x'))).toBe(true);
    expect(isBinaryBody(new Uint8Array(2))).toBe(true);
    expect(isBinaryBody(new ArrayBuffer(2))).toBe(true);
    for (const v of [null, undefined, {}, [], 'x', 0, { data: [1, 2] }]) {
      expect(isBinaryBody(v)).toBe(false);
    }
  });

  it('requestHash still refuses a binary body (VALIDATION_FAILED), ignores key order and secret fields', () => {
    expect(() => requestHash('POST', '/v1/x', Buffer.from('x'))).toThrow(
      expect.objectContaining({ code: 'VALIDATION_FAILED' }),
    );
    expect(requestHash('post', '/v1/x', { a: 1, b: 2 })).toBe(
      requestHash('POST', '/v1/x', { b: 2, a: 1 }),
    );
    expect(requestHash('POST', '/v1/x', { a: 1, password: 'one' })).toBe(
      requestHash('POST', '/v1/x', { a: 1, password: 'two' }),
    );
    expect(requestHash('POST', '/v1/x', { a: 1 })).not.toBe(requestHash('POST', '/v1/x', { a: 2 }));
  });
});

describe('SEC FB-R5-SEC-BE-123-01 – body depth', () => {
  it('MAX_BODY_DEPTH is 32 (the deepest openapi.yaml body nests 5 levels)', () => {
    expect(MAX_BODY_DEPTH).toBe(32);
  });

  it('bodyTooDeep counts objects and arrays as levels; scalars and binary values do not count', () => {
    expect(bodyTooDeep(nested(31))).toBe(false); // 31 objects + the leaf
    expect(bodyTooDeep(nested(32))).toBe(false);
    expect(bodyTooDeep(nested(33))).toBe(true);
    let arr: unknown = 'x';
    for (let i = 0; i < 33; i++) arr = [arr];
    expect(bodyTooDeep(arr)).toBe(true);
    expect(bodyTooDeep(nested(31, [1, 2]))).toBe(false); // 31 objects + 1 array = 32
    expect(bodyTooDeep(nested(32, [1, 2]))).toBe(true);
    expect(bodyTooDeep(nested(31, Buffer.from('x')))).toBe(false);
    for (const v of [null, undefined, 'x', 0, {}, []]) expect(bodyTooDeep(v)).toBe(false);
    // Wide is fine, only depth counts.
    expect(bodyTooDeep({ list: Array.from({ length: 5000 }, (_, i) => ({ i })) })).toBe(false);
  });

  it('requestHash: deeper than the limit → 422 VALIDATION_FAILED, also 20.000 levels (no RangeError); at the limit → a hash', () => {
    for (const body of [nested(33), nested(20_000)]) {
      expect(() => requestHash('POST', '/v1/x', body)).toThrow(
        expect.objectContaining({ code: 'VALIDATION_FAILED' }),
      );
    }
    expect(requestHash('POST', '/v1/x', nested(32))).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('AuthGuard.hasCompletedKey (FB-R5-SEC-BE-S1-01 / FB-R5-ARC-BE-S1-04)', () => {
  it('looks up method + path (no query string) + the request hash of THIS body', async () => {
    const { hasCompletedKey, calls } = guardWith(true);
    const body = { type: 'short', nightlyRates: [] };
    await expect(
      hasCompletedKey(
        req(body, '/v1/properties/p/quotes?x=1'),
        { idempotencyKey: true },
        PRINCIPAL,
      ),
    ).resolves.toBe(true);
    expect(calls).toHaveLength(1);
    expect(calls[0]!.sql).toContain('request_hash = $5');
    expect(calls[0]!.params).toEqual([
      PRINCIPAL.userId,
      KEY,
      'POST',
      '/v1/properties/p/quotes',
      requestHash('POST', '/v1/properties/p/quotes', body),
    ]);
  });

  it('ARC 123-02: same key, same path, ANOTHER body → no replay; the stored body → replay (the hash is what decides)', async () => {
    const savedQuote = { type: 'short', nights: 2 };
    const { hasCompletedKey, calls, stored } = guardWithStored(savedQuote);
    await expect(
      hasCompletedKey(
        req({ ...savedQuote, nightlyRates: [{ date: '2026-11-20', amountVnd: 1 }] }),
        { idempotencyKey: true },
        PRINCIPAL,
      ),
    ).resolves.toBe(false);
    expect(calls).toHaveLength(1);
    expect(calls[0]!.params[4]).not.toBe(stored.hash);
    // Key order does not matter, the query string is left out: the same request is a replay.
    await expect(
      hasCompletedKey(
        req({ nights: 2, type: 'short' }, '/v1/properties/p/quotes?x=1'),
        { idempotencyKey: true },
        PRINCIPAL,
      ),
    ).resolves.toBe(true);
    expect(calls[1]!.params[4]).toBe(stored.hash);
  });

  it('a binary body is never a replay: false without a lookup and without throwing', async () => {
    const { hasCompletedKey, calls } = guardWith(true);
    for (const body of [Buffer.from('--boundary'), new Uint8Array(4), new ArrayBuffer(4)]) {
      await expect(hasCompletedKey(req(body), { idempotencyKey: true }, PRINCIPAL)).resolves.toBe(
        false,
      );
    }
    expect(calls).toHaveLength(0);
  });

  it('SEC 123-01: a body nested deeper than MAX_BODY_DEPTH is never a replay – false, no lookup, no throw', async () => {
    const { hasCompletedKey, calls } = guardWith(true);
    for (const body of [nested(MAX_BODY_DEPTH + 1), nested(20_000)]) {
      await expect(hasCompletedKey(req(body), { idempotencyKey: true }, PRINCIPAL)).resolves.toBe(
        false,
      );
    }
    // Anything else requestHash throws on is no replay either (the guard never throws).
    const throwing = {
      get a(): never {
        throw new Error('getter');
      },
    };
    await expect(hasCompletedKey(req(throwing), { idempotencyKey: true }, PRINCIPAL)).resolves.toBe(
      false,
    );
    expect(calls).toHaveLength(0);
    // At the limit it is still looked up.
    await expect(
      hasCompletedKey(req(nested(MAX_BODY_DEPTH - 1)), { idempotencyKey: true }, PRINCIPAL),
    ).resolves.toBe(true);
    expect(calls).toHaveLength(1);
  });

  it('no key, a malformed key or an operation without Idempotency-Key: no lookup', async () => {
    const { hasCompletedKey, calls } = guardWith(true);
    const noKey = { ...req({}), headers: {} };
    const badKey = { ...req({}), headers: { 'idempotency-key': 'not-a-uuid' } };
    await expect(hasCompletedKey(noKey, { idempotencyKey: true }, PRINCIPAL)).resolves.toBe(false);
    await expect(hasCompletedKey(badKey, { idempotencyKey: true }, PRINCIPAL)).resolves.toBe(false);
    await expect(hasCompletedKey(req({}), {}, PRINCIPAL)).resolves.toBe(false);
    expect(calls).toHaveLength(0);
  });
});
