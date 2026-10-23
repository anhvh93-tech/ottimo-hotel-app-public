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

describe('Sprint 4 FE-A endpoints (OpenAPI 0.3.7)', () => {
  it('previewMoveReservation is a read: query only, neither Idempotency-Key nor If-Match (S4-21)', async () => {
    const { api, call } = setup();
    await api.previewMoveReservation(R, {
      roomId: 'room-401',
      reasonCode: 'guest_request',
      arrivalDate: undefined,
    });
    const [url, init] = call();
    expect(url).toBe(
      'http://x/v1/properties/p/reservations/r/move-preview?roomId=room-401&reasonCode=guest_request',
    );
    expect(init.method).toBe('GET');
    expect(init.headers).not.toHaveProperty('If-Match');
    expect(init.headers).not.toHaveProperty('Idempotency-Key');
  });

  it('moveReservation sends applyDifference + expectedDeltaVnd as given (ESC-019 A)', async () => {
    const { api, call } = setup();
    await api.moveReservation(
      R,
      {
        roomId: 'room-401',
        reasonCode: 'guest_request',
        applyDifference: true,
        expectedDeltaVnd: 1_125_000,
      },
      3,
      'k',
    );
    const [, init] = call();
    expect(JSON.parse(String(init.body))).toEqual({
      roomId: 'room-401',
      reasonCode: 'guest_request',
      applyDifference: true,
      expectedDeltaVnd: 1_125_000,
    });
    expect(init.headers).toMatchObject({ 'If-Match': '"3"', 'Idempotency-Key': 'k' });
  });

  it('removePartyMember sends the "Khách n" slot as a query (S4-39) – only when given', async () => {
    const { api, call } = setup();
    await api.removePartyMember(R, 'm1', 4, 'k1');
    await api.removePartyMember(R, 'm1', 4, 'k2', 2);
    await api.removePartyMember(R, 'm1', 4, 'k3', 'none');
    expect(call(0)[0]).toBe('http://x/v1/properties/p/reservations/r/party/m1');
    expect(call(1)[0]).toBe(
      'http://x/v1/properties/p/reservations/r/party/m1?guestUploadPersonIndex=2',
    );
    expect(call(2)[0]).toMatch(/\?guestUploadPersonIndex=none$/);
    expect(call(1)[1].method).toBe('DELETE');
    expect(call(1)[1].headers).toMatchObject({ 'If-Match': '"4"', 'Idempotency-Key': 'k2' });
  });

  it('updateGuestDocument accepts the link-only body GuestDocumentLink (S4-39)', async () => {
    const { api, call } = setup();
    await api.updateGuestDocument(
      { propertyId: 'p', registrationId: 'g' },
      'd',
      { partyMemberId: 'm' },
      7,
    );
    const [url, init] = call();
    expect(url).toBe('http://x/v1/properties/p/registrations/g/documents/d');
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(String(init.body))).toEqual({ partyMemberId: 'm' });
  });

  it('markNoShow keeps the old note-only call and sends retainLines (S4-08)', async () => {
    const { api, call } = setup();
    await api.markNoShow(R, 'Gọi không nghe máy', 2, 'k1');
    await api.markNoShow(
      R,
      {
        contactAttemptNote: 'Gọi không nghe máy',
        retainLines: [{ lineId: 'l1', reason: 'Xe đã đón' }],
      },
      2,
      'k2',
    );
    expect(JSON.parse(String(call(0)[1].body))).toEqual({
      contactAttemptNote: 'Gọi không nghe máy',
    });
    expect(JSON.parse(String(call(1)[1].body))).toEqual({
      contactAttemptNote: 'Gọi không nghe máy',
      retainLines: [{ lineId: 'l1', reason: 'Xe đã đón' }],
    });
  });
});

describe('Sprint 4 FE-B dashboard endpoints (EP01, OpenAPI 0.3.7)', () => {
  it('getTonightKpi / getArrivalsDepartures are plain reads (date only when asked)', async () => {
    const { api, call } = setup();
    await api.getTonightKpi({ propertyId: 'p' });
    await api.getArrivalsDepartures({ propertyId: 'p' });
    await api.getArrivalsDepartures({ propertyId: 'p' }, '2026-10-20');
    expect(call(0)[0]).toBe('http://x/v1/properties/p/dashboard/tonight');
    expect(call(1)[0]).toBe('http://x/v1/properties/p/arrivals-departures');
    expect(call(2)[0]).toBe('http://x/v1/properties/p/arrivals-departures?date=2026-10-20');
    for (const i of [0, 1, 2]) {
      expect(call(i)[1].method).toBe('GET');
      expect(call(i)[1].headers).not.toHaveProperty('Idempotency-Key');
    }
  });

  it('resolveAttentionEvent: POST with Idempotency-Key, no If-Match, note in the body', async () => {
    const { api, call } = setup();
    await api.resolveAttentionEvent(
      { propertyId: 'p', eventId: 'e1' },
      { note: 'Đã báo Agoda' },
      'k',
    );
    const [url, init] = call();
    expect(url).toBe('http://x/v1/properties/p/attention-events/e1/actions/resolve');
    expect(init.method).toBe('POST');
    expect(JSON.parse(String(init.body))).toEqual({ note: 'Đã báo Agoda' });
    expect(init.headers).toMatchObject({ 'Idempotency-Key': 'k' });
    expect(init.headers).not.toHaveProperty('If-Match');
  });
});

describe('Sprint 4 FE-B Desk ops endpoints (EP07/EP08/EP14/EP09, OpenAPI 0.3.7)', () => {
  it('transitionWorkOrder: If-Match + Idempotency-Key, action in the path', async () => {
    const { api, call } = setup();
    await api.transitionWorkOrder(
      { propertyId: 'p', workOrderId: 'w' },
      'wait-parts',
      { note: 'Bộ trộn', partsExpectedDate: '2026-10-20' },
      4,
      'k',
    );
    const [url, init] = call();
    expect(url).toBe('http://x/v1/properties/p/work-orders/w/actions/wait-parts');
    expect(init.headers).toMatchObject({ 'If-Match': '"4"', 'Idempotency-Key': 'k' });
  });

  it('updateRoomBlock sends only endDatePlanned with If-Match; transitionRoomBlock sends the reason', async () => {
    const { api, call } = setup();
    await api.updateRoomBlock({ propertyId: 'p', roomBlockId: 'b' }, '2026-10-20', 2);
    await api.transitionRoomBlock(
      { propertyId: 'p', roomBlockId: 'b' },
      'release',
      'Sửa xong sớm',
      'k',
    );
    expect(JSON.parse(String(call(0)[1].body))).toEqual({ endDatePlanned: '2026-10-20' });
    expect(call(0)[1].headers).toMatchObject({ 'If-Match': '"2"' });
    expect(call(1)[0]).toBe('http://x/v1/properties/p/room-blocks/b/actions/release');
    expect(JSON.parse(String(call(1)[1].body))).toEqual({ reason: 'Sửa xong sớm' });
  });

  it('listHkTasks / listGuestRequests / listItems are plain reads', async () => {
    const { api, call } = setup();
    await api.listHkTasks({ propertyId: 'p' }, { status: 'open' });
    await api.listGuestRequests({ propertyId: 'p' });
    await api.listItems({ propertyId: 'p' });
    expect(call(0)[0]).toBe('http://x/v1/properties/p/hk-tasks?status=open');
    expect(call(1)[0]).toBe('http://x/v1/properties/p/guest-requests');
    expect(call(2)[0]).toBe('http://x/v1/properties/p/items');
  });
});

describe('S35 website requests (US-155 Desk, OpenAPI 0.3.8)', () => {
  it('list joins status (style form), keeps only the code in the URL; transition sends If-Match + key', async () => {
    const { api, call } = setup();
    await api.listWebsiteBookingRequests({ propertyId: 'p' }, { status: ['new', 'in_progress'] });
    expect(call(0)[0]).toBe(
      'http://x/v1/properties/p/website-booking-requests?status=new%2Cin_progress',
    );
    await api.listWebsiteBookingRequests({ propertyId: 'p' }, { refCode: 'W7K3QX9P', status: [] });
    expect(call(1)[0]).toBe('http://x/v1/properties/p/website-booking-requests?refCode=W7K3QX9P');
    await api.transitionWebsiteBookingRequest(
      { propertyId: 'p', requestId: 'q' },
      'decline',
      { reasonCode: 'no_availability' },
      3,
      'key-9',
    );
    const [url, init] = call(2);
    expect(url).toBe('http://x/v1/properties/p/website-booking-requests/q/actions/decline');
    expect(JSON.parse(String(init.body))).toEqual({ reasonCode: 'no_availability' });
    expect(init.headers).toMatchObject({ 'If-Match': '"3"', 'Idempotency-Key': 'key-9' });
  });
});
