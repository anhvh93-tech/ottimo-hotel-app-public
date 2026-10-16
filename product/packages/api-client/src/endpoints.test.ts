import { describe, expect, it, vi } from 'vitest';
import { createApiClient, createEndpoints, eventStreamPath } from './index';

function setup() {
  const fetchImpl = vi.fn(
    async () =>
      new Response('{"reservation":{},"cancellation":{}}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
  );
  const api = createEndpoints(
    createApiClient({
      baseUrl: 'http://x',
      getCsrfToken: () => 'tok',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    }),
  );
  const call = (i = 0) => fetchImpl.mock.calls[i] as unknown as [string, RequestInit];
  return { api, call };
}

const R = { propertyId: 'p', reservationId: 'r' };

describe('EP02 endpoints (OpenAPI 0.3.4)', () => {
  it('cancel dry run sends neither Idempotency-Key nor If-Match (US-021 AC3)', async () => {
    const { api, call } = setup();
    await api.cancelReservationPreview(R, { reasonCode: 'guest_changed_mind' });
    const [url, init] = call();
    expect(url).toBe('http://x/v1/properties/p/reservations/r/actions/cancel');
    expect(JSON.parse(String(init.body))).toEqual({
      reasonCode: 'guest_changed_mind',
      dryRun: true,
    });
    expect(init.headers).not.toHaveProperty('If-Match');
    expect(init.headers).not.toHaveProperty('Idempotency-Key');
  });

  it('real cancel carries If-Match + Idempotency-Key and dryRun=false', async () => {
    const { api, call } = setup();
    await api.cancelReservation(R, { reasonCode: 'price' }, 4, 'key-1');
    const [, init] = call();
    expect(JSON.parse(String(init.body))).toMatchObject({ dryRun: false });
    expect(init.headers).toMatchObject({ 'If-Match': '"4"', 'Idempotency-Key': 'key-1' });
  });

  it('listReservations joins status as a comma list (style: form, explode: false)', async () => {
    const { api, call } = setup();
    await api.listReservations(
      { propertyId: 'p' },
      { status: ['hold', 'confirmed'], externalContract: true },
    );
    expect(call()[0]).toBe(
      'http://x/v1/properties/p/reservations?status=hold%2Cconfirmed&externalContract=true',
    );
  });

  it('rack defaults to the server range when no query is given', async () => {
    const { api, call } = setup();
    await api.getRack({ propertyId: 'p' });
    expect(call()[0]).toBe('http://x/v1/properties/p/rack');
  });

  it('SSE path is encoded', () => {
    expect(eventStreamPath('a b')).toBe('/v1/properties/a%20b/events');
  });
});
