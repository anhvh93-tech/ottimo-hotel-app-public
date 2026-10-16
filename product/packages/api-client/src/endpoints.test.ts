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

describe('Sprint 3 endpoints (OpenAPI 0.3.6)', () => {
  it('late-checkout dry run is read-only: no If-Match, no Idempotency-Key (SEC A3)', async () => {
    const { api, call } = setup();
    await api.setLateCheckout(
      R,
      { checkoutTime: '15:00', dryRun: true, applySurcharge: false },
      3,
      'k',
    );
    expect(call()[0]).toBe('http://x/v1/properties/p/reservations/r/actions/late-checkout');
    expect(call()[1].headers).not.toHaveProperty('If-Match');
    expect(call()[1].headers).not.toHaveProperty('Idempotency-Key');
  });

  it('check-in carries If-Match + Idempotency-Key', async () => {
    const { api, call } = setup();
    await api.checkIn(R, { cardsIssued: 1, houseRulesSent: true }, 7, 'k-ci');
    expect(call()[1].headers).toMatchObject({ 'If-Match': '"7"', 'Idempotency-Key': 'k-ci' });
  });

  it('documents are multipart (browser sets the boundary – no JSON content type)', async () => {
    const { api, call } = setup();
    await api.addGuestDocument(
      { propertyId: 'p', registrationId: 'g' },
      { docType: 'cccd', fullNameOnDoc: 'A B', docNumber: '079123456789' },
      [new Blob(['x'], { type: 'image/jpeg' })],
      'k-doc',
    );
    const init = call()[1];
    expect(init.body).toBeInstanceOf(FormData);
    expect(init.headers).not.toHaveProperty('Content-Type');
    expect((init.body as FormData).getAll('image')).toHaveLength(1);
  });

  it('executeRefund (transfer) and executeCashRefund are separate operations (A47 / A47a)', async () => {
    const { api, call } = setup();
    await api.executeCashRefund(
      { propertyId: 'p', approvalId: 'a' },
      { amountVnd: 1, paidAt: 'x', attachmentId: 'f' },
      'k1',
    );
    await api.executeRefund(
      { propertyId: 'p', approvalId: 'a' },
      { amountVnd: 1, paidAt: 'x' },
      'k2',
    );
    expect(call(0)[0]).toMatch(/approval-requests\/a\/actions\/execute-cash-refund$/);
    expect(call(1)[0]).toMatch(/approval-requests\/a\/actions\/execute-refund$/);
  });
});
