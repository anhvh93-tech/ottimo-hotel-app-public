// FB-INV-012 (OpenAPI 0.3.14, BE #190): billing endpoints moved out of admin-web (ARC-FE-189-05/06).
import { describe, expect, it, vi } from 'vitest';
import { createApiClient, createEndpoints } from './index';

function setup() {
  const fetchImpl = vi.fn(
    async () =>
      new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } }),
  );
  const api = createEndpoints(
    createApiClient({
      baseUrl: 'http://x',
      getCsrfToken: () => 'tok',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    }),
  );
  const call = (i: number) => fetchImpl.mock.calls[i] as unknown as [string, RequestInit];
  return { api, call };
}

describe('FB-INV-012 billing endpoints', () => {
  it('list: status as a comma list; issue: If-Match + Idempotency-Key; meter photo purpose', async () => {
    const { api, call } = setup();
    await api.listBillingPeriods(
      { propertyId: 'p' },
      { status: ['issued', 'paid'], overdue: true },
    );
    const listUrl = new URL(call(0)[0]);
    expect(listUrl.pathname).toBe('/v1/properties/p/billing-periods');
    expect(listUrl.searchParams.get('status')).toBe('issued,paid');
    expect(listUrl.searchParams.get('overdue')).toBe('true');
    await api.issueBillingPeriod({ propertyId: 'p' }, 'b', 3, true, 'k1');
    const [url, init] = call(1);
    expect(url).toBe('http://x/v1/properties/p/billing-periods/b/issue');
    expect(JSON.parse(String(init.body))).toEqual({ acknowledgeWarnings: true });
    expect(init.headers).toHaveProperty('Idempotency-Key', 'k1');
    expect(init.headers).toHaveProperty('If-Match');
    await api.uploadAttachment({ propertyId: 'p' }, new Blob(['x']), 'meter', 'k2', 'r');
    expect((call(2)[1].body as FormData).get('purpose')).toBe('meter');
  });
});
