/**
 * FB-R2-SEC-BE-23 / OpenAPI 0.3.5 §8.5: CONCURRENT_UPDATE (409) and SERVICE_UNAVAILABLE (503) come from the
 * OpenAPI code table (no local list); PostgreSQL lock/deadlock/serialization/timeout errors map onto them with
 * Retry-After, rendered as problem+json by the global filter.
 */
import type { ArgumentsHost } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { OPENAPI_META } from '../src/generated/openapi-meta';
import { ProblemFilter, concurrencyProblem, statusForCode } from '../src/shared/problem';

function render(exception: unknown) {
  const sent: { status?: number; headers: Record<string, string>; body?: Record<string, unknown> } =
    {
      headers: {},
    };
  const reply = {
    status(code: number) {
      sent.status = code;
      return reply;
    },
    header(name: string, value: string) {
      sent.headers[name.toLowerCase()] = value;
      return reply;
    },
    send(body: unknown) {
      sent.body = body as Record<string, unknown>;
      return reply;
    },
  };
  const host = {
    switchToHttp: () => ({ getResponse: () => reply, getRequest: () => ({ id: 'req-1' }) }),
  } as unknown as ArgumentsHost;
  new ProblemFilter({ error: () => undefined }).catch(exception, host);
  return sent;
}

describe('concurrency problem codes (SEC-BE-23, OpenAPI 0.3.5 §8.5)', () => {
  it('both codes are in the OpenAPI table and statusForCode reads only that table', () => {
    expect(OPENAPI_META.problemCodes.CONCURRENT_UPDATE).toBe(409);
    expect(OPENAPI_META.problemCodes.SERVICE_UNAVAILABLE).toBe(503);
    expect(statusForCode('CONCURRENT_UPDATE')).toBe(409);
    expect(statusForCode('SERVICE_UNAVAILABLE')).toBe(503);
    expect(statusForCode('INTERNAL_ERROR')).toBe(500);
    expect(() => statusForCode('NOT_A_CODE')).toThrow(/not in OpenAPI table/);
  });

  it.each([
    ['55P03', 'lock_not_available'],
    ['40P01', 'deadlock_detected'],
    ['40001', 'serialization_failure'],
  ])('pg %s (%s) → 409 CONCURRENT_UPDATE + Retry-After: 1', (code) => {
    expect(concurrencyProblem({ code })).toMatchObject({ code: 'CONCURRENT_UPDATE', status: 409 });
    const r = render(Object.assign(new Error('x'), { code }));
    expect(r.status).toBe(409);
    expect(r.headers['retry-after']).toBe('1');
    expect(r.headers['content-type']).toBe('application/problem+json');
    expect(r.body).toMatchObject({ code: 'CONCURRENT_UPDATE', status: 409, requestId: 'req-1' });
  });

  it('pg 57014 (statement timeout) → 503 SERVICE_UNAVAILABLE + Retry-After', () => {
    const r = render(
      Object.assign(new Error('canceling statement due to statement timeout'), { code: '57014' }),
    );
    expect(r.status).toBe(503);
    expect(r.headers['retry-after']).toBe('5');
    expect(r.body).toMatchObject({ code: 'SERVICE_UNAVAILABLE', status: 503 });
    expect(JSON.stringify(r.body)).not.toContain('statement timeout');
  });

  it('other database errors stay 500 INTERNAL_ERROR without detail', () => {
    expect(concurrencyProblem({ code: '23505' })).toBeNull();
    const r = render(Object.assign(new Error('duplicate key'), { code: '23505' }));
    expect(r.status).toBe(500);
    expect(r.body).toMatchObject({ code: 'INTERNAL_ERROR' });
  });
});
