import { describe, expect, it, vi } from 'vitest';
import { ApiError, NETWORK_ERROR, createApiClient } from './index';

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
