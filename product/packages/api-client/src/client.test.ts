import { describe, expect, it, vi } from 'vitest';
import {
  ApiError,
  NETWORK_ERROR,
  createApiClient,
  deriveIdempotencyKey,
  isIdempotencyKey,
  newIdempotencyKey,
} from './index';

describe('Idempotency-Key (UXR #2 – the API accepts only a UUID)', () => {
  it('a derived key is a UUID, stable for the same action and different per purpose', () => {
    const base = newIdempotencyKey();
    const up = deriveIdempotencyKey(base, 'attachment');
    expect(isIdempotencyKey(base)).toBe(true);
    expect(isIdempotencyKey(up)).toBe(true);
    expect(up).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-8[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    // Same click resent (DS 6.21) → same upload key; never the action's own key.
    expect(deriveIdempotencyKey(base, 'attachment')).toBe(up);
    expect(up).not.toBe(base);
    expect(deriveIdempotencyKey(base, 'other')).not.toBe(up);
    expect(deriveIdempotencyKey(newIdempotencyKey(), 'attachment')).not.toBe(up);
    expect(isIdempotencyKey(`${base}-a`)).toBe(false);
  });

  it('1 000 derived keys: all UUIDs, no collision', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      const k = deriveIdempotencyKey(newIdempotencyKey(), 'attachment');
      expect(isIdempotencyKey(k)).toBe(true);
      seen.add(k);
    }
    expect(seen.size).toBe(1000);
  });
});

function res(status: number, body?: unknown, headers: Record<string, string> = {}) {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/problem+json', ...headers },
  });
}

describe('api client', () => {
  it('sends CSRF, If-Match and Idempotency-Key on writes', async () => {
    const fetchImpl = vi.fn(async () => new Response('{}', { status: 200 }));
    const api = createApiClient({
      baseUrl: 'http://x',
      getCsrfToken: () => 'tok',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    await api.request('PATCH', '/v1/properties/{propertyId}/rooms/{roomId}', {
      path: { propertyId: 'p', roomId: 'r 1' },
      body: { name: 'A' },
      ifMatch: 3,
      idempotencyKey: 'k',
    });
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('http://x/v1/properties/p/rooms/r%201');
    expect(init.headers).toMatchObject({
      'X-CSRF-Token': 'tok',
      'If-Match': '"3"',
      'Idempotency-Key': 'k',
    });
  });

  it('turns problem+json into ApiError with code, requestId and Retry-After', async () => {
    const onError = vi.fn();
    const api = createApiClient({
      baseUrl: 'http://x',
      onError,
      fetchImpl: (async () =>
        res(
          429,
          { type: 't', title: 't', status: 429, code: 'RATE_LIMITED', requestId: 'r1' },
          {
            'retry-after': '900',
          },
        )) as unknown as typeof fetch,
    });
    const err = await api.request('POST', '/v1/auth/login').catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).code).toBe('RATE_LIMITED');
    expect((err as ApiError).requestId).toBe('r1');
    expect((err as ApiError).retryAfterSeconds).toBe(900);
    expect(onError).toHaveBeenCalledOnce();
  });

  it('synthesises INTERNAL_ERROR for a 500 without body and keeps X-Request-Id', async () => {
    const api = createApiClient({
      baseUrl: 'http://x',
      fetchImpl: (async () =>
        new Response('oops', {
          status: 500,
          headers: { 'x-request-id': 'req-9' },
        })) as unknown as typeof fetch,
    });
    const err = (await api.request('GET', '/v1/me').catch((e: unknown) => e)) as ApiError;
    expect(err.code).toBe('INTERNAL_ERROR');
    expect(err.requestId).toBe('req-9');
  });

  it('maps fetch failures to NETWORK_ERROR', async () => {
    const api = createApiClient({
      baseUrl: 'http://x',
      fetchImpl: (async () => {
        throw new TypeError('Failed to fetch');
      }) as unknown as typeof fetch,
    });
    const err = (await api.request('GET', '/v1/me').catch((e: unknown) => e)) as ApiError;
    expect(err.code).toBe(NETWORK_ERROR);
    expect(err.isNetwork).toBe(true);
  });
});
