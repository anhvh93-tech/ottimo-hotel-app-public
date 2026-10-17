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

  // UXR #3: the API reads `data`, `purpose`, `reservationId` with `textPart` – only parts WITHOUT a
  // filename (services/api multipart.ts). Checked on the real wire format, for every multipart call.
  it('every multipart text field goes on the wire without a filename; files keep theirs', async () => {
    const { api, call } = setup();
    await api.addGuestDocument(
      { propertyId: 'p', registrationId: 'g' },
      { docType: 'cccd', fullNameOnDoc: 'A B', docNumber: '079123456789' },
      [new Blob(['x'], { type: 'image/jpeg' })],
      'k-doc',
    );
    await api.uploadAttachment(
      { propertyId: 'p' },
      new Blob(['y'], { type: 'image/jpeg' }),
      'refund_proof',
      'k-up',
      'r1',
    );
    const wire = async (i: number) => {
      const form = call(i)[1].body as FormData;
      const res = new Response(form);
      const text = await res.text();
      const boundary = /boundary=(.+)$/.exec(res.headers.get('content-type') ?? '')![1]!;
      return text
        .split(`--${boundary}`)
        .slice(1, -1)
        .map((part) => {
          const head = part.slice(0, part.indexOf('\r\n\r\n'));
          return {
            name: /name="([^"]+)"/.exec(head)![1]!,
            isFile: /filename=/.test(head),
            value: part.slice(part.indexOf('\r\n\r\n') + 4, -2),
          };
        });
    };
    const doc = await wire(0);
    expect(doc.find((p) => p.name === 'data')).toMatchObject({ isFile: false });
    expect(JSON.parse(doc.find((p) => p.name === 'data')!.value)).toMatchObject({
      docType: 'cccd',
      docNumber: '079123456789',
    });
    expect(doc.filter((p) => p.name === 'image').every((p) => p.isFile)).toBe(true);
    const up = await wire(1);
    expect(up.find((p) => p.name === 'purpose')).toMatchObject({
      isFile: false,
      value: 'refund_proof',
    });
    expect(up.find((p) => p.name === 'reservationId')).toMatchObject({
      isFile: false,
      value: 'r1',
    });
    expect(up.find((p) => p.name === 'file')).toMatchObject({ isFile: true });
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

  it('getDocumentImage asks for a Blob with a reason and `cache: no-store`; JSON reads keep the default (SEC B5)', async () => {
    const { api, call } = setup();
    await api.getDocumentImage({ propertyId: 'p', registrationId: 'g' }, 'd', 'i', 'registration');
    await api.listAttentionItems({ propertyId: 'p' });
    const [url, init] = call(0);
    expect(url).toBe(
      'http://x/v1/properties/p/registrations/g/documents/d/images/i?reason=registration',
    );
    expect(init.cache).toBe('no-store');
    const [aurl, ainit] = call(1);
    expect(aurl).toBe('http://x/v1/properties/p/attention');
    expect(ainit.cache).toBeUndefined();
  });
});
