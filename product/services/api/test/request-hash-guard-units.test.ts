/**
 * FB-R5-SEC-BE-S1-01 + FB-R5-ARC-BE-S1-04 – the request hash shared by AuthGuard and UnitOfWork, without a database:
 * - `request-hash.ts` is the one hash (UnitOfWork re-exports the same functions – no second copy);
 * - AuthGuard.hasCompletedKey looks a completed key up with method + path + `request_hash` (the claimKey hash), the
 *   query string left out, and never for a binary body (multipart: hashed by its upload controller after the guard –
 *   not a replay here, so 403, never a 422 / 500 thrown by the guard).
 */
import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { AuthGuard } from '../src/shared/http/auth.guard';
import { canonicalJson, isBinaryBody, requestHash } from '../src/shared/http/request-hash';
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

  it('a body the stored hash does not match is no replay (the database answers no row)', async () => {
    const { hasCompletedKey } = guardWith(false);
    await expect(
      hasCompletedKey(req({ nightlyRates: 'x' }), { idempotencyKey: true }, PRINCIPAL),
    ).resolves.toBe(false);
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
