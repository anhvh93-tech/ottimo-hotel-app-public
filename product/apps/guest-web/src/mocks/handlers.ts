// MSW mock of the guest portal (OpenAPI 0.3.6-draft, tag guest-portal) while BE-C builds the real one.
// Behaviour follows the contract + SEC s3-checklist G1–G9 so the UI is exercised against the same rules.
import { http, HttpResponse, delay } from 'msw';
import type { components } from '@ottimo/api-client';

type Schemas = components['schemas'];
type OnlineCheckin = Schemas['OnlineCheckin'];

/** Dev links: http://localhost:5175/g/<token> */
export const MOCK_TOKENS = {
  ok: 'demo-guest-link-0123456789abcdef',
  expired: 'demo-expired-link-0123456789abcd',
  ended: 'demo-ended-stay-link-0123456789ab',
  closed: 'demo-closed-checkin-0123456789ab',
  inHouse: 'demo-in-house-link-0123456789abc',
} as const;

interface Scenario {
  stayEnded: boolean;
  closed: boolean;
  inHouse: boolean;
  /** Next upload fails with this (then clears). */
  uploadFail?: 'FILE_TYPE' | 'network' | 'TOO_MANY_FILES' | 'rate' | 'busy';
  /** Notice version the server reports (`null` = field missing → guest-web must fail closed). */
  noticeVersion: string | null;
  /** `id_image_retention_days_after_checkout` the server reports (`null` = field missing). */
  retentionDays: number | null;
  /** Simulate a server bug that leaks level-2 keys – the client must drop them (ĐK-2). */
  leakLevel2: boolean;
  /** ESC-016 A fee the server works out for "Dọn phòng thêm" (0 = make-up clean, free). */
  cleaningFee: number;
  cleaningFeeReason: 'second_full_clean' | 'long_stay_adhoc' | null;
  /** Next createGuestRequest fails with this field code (then clears). */
  requestFail?: 'FEE_NOT_ACCEPTED' | 'RATE_LIMITED' | 'CARD_NUMBER_DETECTED';
  requiredPeople: number;
  latencyMs: number;
}

interface State {
  session: boolean;
  locale: Schemas['Locale'];
  /** The guest picked the language in an earlier session of this booking (`setGuestLocale`). */
  localeChosen: boolean;
  oci: OnlineCheckin;
  consents: Schemas['ConsentInput'][];
  uploads: { personIndex: number; docType: string; images: number; bytes: number }[];
  notes: string[];
  calls: string[];
  requests: Schemas['GuestRequestForGuest'][];
  requestBodies: unknown[];
}

const scenario: Scenario = {
  stayEnded: false,
  closed: false,
  inHouse: false,
  leakLevel2: false,
  requiredPeople: 2,
  latencyMs: 0,
  noticeVersion: 'privacy-2026-10-v1',
  retentionDays: 30,
  cleaningFee: 100_000,
  cleaningFeeReason: 'second_full_clean',
};

function freshOci(required: number): OnlineCheckin {
  return {
    currentStep: 'notice',
    requiredPeople: required,
    uploadedPeople: [],
    noticeAccepted: false,
    consentRecorded: false,
  };
}

const state: State = {
  session: false,
  locale: 'en',
  localeChosen: false,
  oci: freshOci(2),
  consents: [],
  uploads: [],
  notes: [],
  calls: [],
  requests: [],
  requestBodies: [],
};

export const mockControl = {
  state,
  scenario,
  reset(patch: Partial<Scenario> = {}) {
    Object.assign(scenario, {
      stayEnded: false,
      closed: false,
      inHouse: false,
      uploadFail: undefined,
      leakLevel2: false,
      requiredPeople: 2,
      latencyMs: 0,
      noticeVersion: 'privacy-2026-10-v1',
      retentionDays: 30,
      cleaningFee: 100_000,
      cleaningFeeReason: 'second_full_clean',
      requestFail: undefined,
      ...patch,
    });
    state.session = false;
    state.locale = 'en';
    state.localeChosen = false;
    state.oci = freshOci(scenario.requiredPeople);
    state.consents = [];
    state.uploads = [];
    state.notes = [];
    state.calls = [];
    state.requests = [];
    state.requestBodies = [];
  },
  /** Pretend a session cookie already exists (page reloaded after the token was exchanged). */
  openSession() {
    state.session = true;
  },
};

const problem = (status: number, code: string, extra: Record<string, unknown> = {}) =>
  HttpResponse.json(
    {
      type: `/problems/${code.toLowerCase()}`,
      title: code,
      status,
      code,
      requestId: 'req-mock',
      ...extra,
    },
    { status, headers: { 'Content-Type': 'application/problem+json' } },
  );

const noStore = { 'Cache-Control': 'no-store' };

async function guard(name: string) {
  state.calls.push(name);
  if (scenario.latencyMs) await delay(scenario.latencyMs);
  if (!state.session) return problem(401, 'GUEST_LINK_INVALID');
  if (scenario.stayEnded) return problem(403, 'GUEST_STAY_ENDED');
  return undefined;
}

function closedGuard() {
  return scenario.closed || scenario.inHouse ? problem(409, 'ONLINE_CHECKIN_CLOSED') : undefined;
}

function stayBody() {
  const inHouse = scenario.inHouse;
  const body: Record<string, unknown> = {
    reservationCode: 'OTM-0150',
    status: inHouse ? 'in_house' : 'confirmed',
    stayType: 'short',
    // 0.3.7 (BR-012): name + public room type; the server no longer sends roomNo to guests.
    roomName: 'The Bloom',
    publicRoomType: 'Standard Studio · Garden View',
    arrivalDate: '2026-10-19',
    departureDate: '2026-10-22',
    checkinTime: '14:00',
    checkoutTime: '12:00',
    property: {
      name: 'OTTIMO Boutique Stay',
      address: '12 Đường Mẫu, Phường 3, Đà Lạt',
      // Google Maps pin INV sent 17/10 (P-S4-7) – one source for guest-web, landing and messages.
      mapUrl: 'https://maps.app.goo.gl/oYos42G5YvUEcDCc6',
      phone: '+84 000 000 000',
    },
    houseRules:
      state.locale === 'vi'
        ? 'Không hút thuốc trong căn (phí vệ sinh 1.000.000 đ).\nGiữ yên lặng sau 22:00.'
        : 'No smoking inside the unit (cleaning fee 1,000,000 VND).\nQuiet hours after 22:00.',
    wifi: inHouse ? { ssid: 'OTTIMO-Guest', password: 'mock-wifi-pass' } : null,
    onlineCheckinAvailable: !(scenario.closed || inHouse),
  };
  if (scenario.leakLevel2) {
    body.guestFullName = 'Anna Martin';
    body.doorCode = {
      code: '582913',
      validFrom: '2026-10-19T14:00:00+07:00',
      validTo: '2026-10-22T12:00:00+07:00',
    };
  }
  return body;
}

function missingStep(): string | undefined {
  const o = state.oci;
  if (!o.noticeAccepted) return 'notice';
  const done = new Set([...(o.uploadedPeople ?? []), ...(o.deferredPeople ?? [])]);
  for (let p = 1; p <= o.requiredPeople; p++) if (!done.has(p)) return 'documents';
  if (!o.etaTime) return 'eta';
  if (!o.consentRecorded) return 'consent';
  return undefined;
}

const CARD_RE = /\d[\d -]{11,}\d/;

/** Every OnlineCheckin response carries the 0.3.6-addendum fields (unless a scenario removes them). */
function oci(): OnlineCheckin {
  return {
    ...state.oci,
    ...(scenario.noticeVersion ? { currentNoticeVersion: scenario.noticeVersion } : {}),
    ...(scenario.retentionDays ? { imageRetentionDays: scenario.retentionDays } : {}),
  };
}

export const handlers = [
  http.post('/v1/guest/sessions', async ({ request }) => {
    state.calls.push('openGuestSession');
    if (scenario.latencyMs) await delay(scenario.latencyMs);
    const { token } = (await request.json()) as { token?: string };
    if (!token || token === MOCK_TOKENS.expired) return problem(401, 'GUEST_LINK_INVALID');
    if (token === MOCK_TOKENS.ended) scenario.stayEnded = true;
    if (token === MOCK_TOKENS.closed) scenario.closed = true;
    if (token === MOCK_TOKENS.inHouse) scenario.inHouse = true;
    if (!Object.values(MOCK_TOKENS).includes(token as never))
      return problem(401, 'GUEST_LINK_INVALID');
    state.session = true;
    // 0.3.7 bổ sung 1 #12 (P-S4-10): guest's earlier choice → (profile: none in the mock) → Accept-Language
    // first tag: vi* → vi, ru* → ru, anything else / missing → en.
    if (!state.localeChosen) {
      const first = (request.headers.get('accept-language') ?? '')
        .split(',')[0]!
        .trim()
        .toLowerCase();
      state.locale = first.startsWith('vi') ? 'vi' : first.startsWith('ru') ? 'ru' : 'en';
    }
    // ĐK-1: always level 1, no OTP offer, no level-2 expiry.
    return HttpResponse.json({
      level: 1,
      reservationCode: 'OTM-0150',
      stayEnded: scenario.stayEnded,
      verification: { emailOtpAvailable: false, locked: false },
      guestFirstName: 'Anna',
      roomName: 'The Bloom',
      locale: state.locale,
      localeChosenByGuest: state.localeChosen,
      expiresAt: '2026-10-23T12:00:00+07:00',
      level2ExpiresAt: null,
    });
  }),

  http.get('/v1/guest/stay', async () => {
    const g = await guard('getGuestStay');
    if (g) return g;
    return HttpResponse.json(stayBody(), { headers: noStore });
  }),

  http.put('/v1/guest/locale', async ({ request }) => {
    state.calls.push('setGuestLocale');
    if (!state.session) return problem(401, 'GUEST_LINK_INVALID');
    const { locale } = (await request.json()) as { locale: Schemas['Locale'] };
    if (!['vi', 'en', 'ru'].includes(locale)) {
      return problem(422, 'VALIDATION_FAILED', {
        errors: [{ field: 'locale', code: 'NOT_IN_LIST' }],
      });
    }
    state.locale = locale;
    state.localeChosen = true;
    return new HttpResponse(null, { status: 204 });
  }),

  http.get('/v1/guest/online-checkin', async () => {
    const g = await guard('getOnlineCheckin');
    if (g) return g;
    return HttpResponse.json(oci());
  }),

  http.put('/v1/guest/online-checkin', async ({ request }) => {
    const g = (await guard('updateOnlineCheckin')) ?? closedGuard();
    if (g) return g;
    const body = (await request.json()) as Record<string, unknown>;
    if (body.noticeVersion !== undefined) {
      if (body.noticeVersion !== scenario.noticeVersion) {
        return problem(422, 'VALIDATION_FAILED', {
          errors: [{ field: 'noticeVersion', code: 'NOT_IN_LIST' }],
        });
      }
      state.oci.noticeAccepted = true;
    }
    if (!state.oci.noticeAccepted) {
      return problem(409, 'INVALID_TRANSITION', { currentState: 'notice' });
    }
    if (typeof body.arrivalNote === 'string') {
      if (body.arrivalNote.length > 300 || CARD_RE.test(body.arrivalNote)) {
        return problem(422, 'VALIDATION_FAILED', {
          errors: [{ field: 'arrivalNote', code: 'CARD_NUMBER_DETECTED' }],
        });
      }
      state.notes.push(body.arrivalNote); // write-only: never echoed back (ĐK-2)
    }
    if (typeof body.etaTime === 'string')
      state.oci.etaTime = body.lateArrival ? '22:00' : body.etaTime;
    if (typeof body.lateArrival === 'boolean') state.oci.lateArrival = body.lateArrival;
    if (typeof body.currentStep === 'string') {
      state.oci.currentStep = body.currentStep as OnlineCheckin['currentStep'];
    }
    return HttpResponse.json(oci());
  }),

  http.post('/v1/guest/online-checkin/documents', async ({ request }) => {
    const g = (await guard('uploadGuestDocument')) ?? closedGuard();
    if (g) return g;
    if (!request.headers.get('idempotency-key')) return problem(400, 'IDEMPOTENCY_KEY_REQUIRED');
    const fail = scenario.uploadFail;
    scenario.uploadFail = undefined;
    if (fail === 'network') return HttpResponse.error();
    if (fail === 'rate') return problem(429, 'RATE_LIMITED');
    if (fail === 'busy') {
      const r = problem(503, 'SERVICE_UNAVAILABLE');
      r.headers.set('Retry-After', '1');
      return r;
    }
    if (fail === 'FILE_TYPE' || fail === 'TOO_MANY_FILES') {
      return problem(422, 'FILE_REJECTED', { errors: [{ field: 'image', code: fail }] });
    }
    const form = await request.formData();
    const personIndex = Number(form.get('personIndex'));
    const docType = String(form.get('docType') ?? '');
    const images = form.getAll('image');
    if (!personIndex || personIndex > state.oci.requiredPeople) {
      return problem(422, 'VALIDATION_FAILED', {
        errors: [{ field: 'personIndex', code: 'NOT_IN_LIST' }],
      });
    }
    if (!['cccd', 'passport', 'child_personal_id', 'other'].includes(docType)) {
      return problem(422, 'VALIDATION_FAILED', {
        errors: [{ field: 'docType', code: 'NOT_IN_LIST' }],
      });
    }
    if (!images.length || images.length > 4) {
      return problem(422, 'FILE_REJECTED', {
        errors: [{ field: 'image', code: 'TOO_MANY_FILES' }],
      });
    }
    let bytes = 0;
    for (const img of images) bytes += typeof img === 'string' ? img.length : img.size;
    state.uploads.push({ personIndex, docType, images: images.length, bytes });
    const up = new Set(state.oci.uploadedPeople ?? []);
    up.add(personIndex);
    state.oci.uploadedPeople = [...up].sort((a, b) => a - b);
    return HttpResponse.json(oci(), { status: 201 });
  }),

  http.post('/v1/guest/consents', async ({ request }) => {
    const g = (await guard('recordGuestConsent')) ?? closedGuard();
    if (g) return g;
    const body = (await request.json()) as Schemas['ConsentInput'];
    // ĐK-5: only guest 1 decides through the app; nothing else.
    if (
      body.personIndex !== 1 ||
      body.channel !== 'guest_app' ||
      body.purpose !== 'P02B_ID_IMAGE_RETENTION'
    ) {
      return problem(422, 'VALIDATION_FAILED', {
        errors: [{ field: 'personIndex', code: 'NOT_IN_LIST' }],
      });
    }
    if (body.noticeVersion !== scenario.noticeVersion) {
      return problem(422, 'VALIDATION_FAILED', {
        errors: [{ field: 'noticeVersion', code: 'NOT_IN_LIST' }],
      });
    }
    // 0.3.6 addendum (SEC ĐK-2 17/10): the days the guest read must be the current parameter.
    if (body.retentionDays !== scenario.retentionDays) {
      return problem(422, 'VALIDATION_FAILED', {
        errors: [{ field: 'retentionDays', code: 'NOT_IN_LIST' }],
      });
    }
    state.consents.push(body);
    state.oci.consentRecorded = true;
    return HttpResponse.json(oci(), { status: 201 });
  }),

  http.post('/v1/guest/online-checkin/complete', async ({ request }) => {
    const g = (await guard('completeOnlineCheckin')) ?? closedGuard();
    if (g) return g;
    const text = await request.text();
    const body = (text ? JSON.parse(text) : {}) as { deferredPeople?: unknown };
    if (body.deferredPeople !== undefined) {
      const list = body.deferredPeople;
      const ok =
        Array.isArray(list) &&
        list.every((n) => Number.isInteger(n) && n >= 1 && n <= state.oci.requiredPeople) &&
        new Set(list).size === list.length;
      if (!ok) {
        return problem(422, 'VALIDATION_FAILED', {
          errors: [{ field: 'deferredPeople', code: 'NOT_IN_LIST' }],
        });
      }
      // ĐK-2: the server drops indices that already have a photo.
      const up = new Set(state.oci.uploadedPeople ?? []);
      state.oci.deferredPeople = (list as number[]).filter((n) => !up.has(n));
    }
    const missing = missingStep();
    if (missing) return problem(409, 'INVALID_TRANSITION', { currentState: missing });
    state.oci.currentStep = 'done';
    state.oci.completedAt = '2026-10-16T20:10:00+07:00';
    return HttpResponse.json(oci());
  }),

  // US-109/US-110 (H23) – OpenAPI 0.3.7 listMyRequests / listGuestRequestOptions / createGuestRequest.
  http.get('/v1/guest/request-options', async () => {
    const g = await guard('listGuestRequestOptions');
    if (g) return g;
    const inHouse = scenario.inHouse;
    const front = (type: string) => ({
      type,
      available: true,
      unavailableReason: null,
      feeVnd: null,
      feeReason: null,
      noteRequired: type === 'other',
    });
    const hk = (type: string, fee: number | null, reason: string | null) =>
      inHouse
        ? {
            type,
            available: true,
            unavailableReason: null,
            feeVnd: fee,
            feeReason: reason,
            noteRequired: false,
            lastFullCleanTime: reason === 'second_full_clean' ? '10:15' : null,
          }
        : {
            type,
            available: false,
            unavailableReason: 'not_in_house',
            feeVnd: null,
            feeReason: null,
            noteRequired: false,
          };
    return HttpResponse.json({
      data: [
        hk(
          'extra_cleaning',
          scenario.cleaningFee,
          scenario.cleaningFee ? scenario.cleaningFeeReason : null,
        ),
        hk('amenities', 0, null),
        inHouse
          ? {
              type: 'report_issue',
              available: true,
              unavailableReason: null,
              feeVnd: null,
              feeReason: null,
              noteRequired: true,
            }
          : {
              type: 'report_issue',
              available: false,
              unavailableReason: 'not_in_house',
              feeVnd: null,
              feeReason: null,
              noteRequired: true,
            },
        front('transport_tour'),
        front('late_checkout'),
        front('other'),
      ],
    });
  }),

  http.get('/v1/guest/requests', async () => {
    const g = await guard('listMyRequests');
    if (g) return g;
    return HttpResponse.json({ data: state.requests }, { headers: noStore });
  }),

  http.post('/v1/guest/requests', async ({ request }) => {
    const g = await guard('createGuestRequest');
    if (g) return g;
    if (!request.headers.get('idempotency-key')) return problem(400, 'IDEMPOTENCY_KEY_REQUIRED');
    const body = (await request.json()) as { type: string; note?: string; feeAccepted?: boolean };
    state.requestBodies.push(body);
    const fail = scenario.requestFail;
    scenario.requestFail = undefined;
    if (fail === 'RATE_LIMITED') return problem(429, 'RATE_LIMITED');
    if (fail)
      return problem(422, 'VALIDATION_FAILED', {
        errors: [{ field: fail === 'FEE_NOT_ACCEPTED' ? 'feeAccepted' : 'note', code: fail }],
      });
    const fee = body.type === 'extra_cleaning' && scenario.inHouse ? scenario.cleaningFee : 0;
    if (fee > 0 && body.feeAccepted !== true) {
      return problem(422, 'VALIDATION_FAILED', {
        errors: [{ field: 'feeAccepted', code: 'FEE_NOT_ACCEPTED' }],
      });
    }
    if (body.note && CARD_RE.test(body.note)) {
      return problem(422, 'VALIDATION_FAILED', {
        errors: [{ field: 'note', code: 'CARD_NUMBER_DETECTED' }],
      });
    }
    const created = {
      id: `req-${state.requests.length + 1}`,
      type: body.type as Schemas['GuestRequestType'],
      note: body.note,
      status: 'new' as const,
      statusLabel: state.locale === 'vi' ? 'Đã gửi' : 'Sent',
      feeVnd: fee > 0 ? fee : null,
      createdAt: '2026-10-19T20:10:00+07:00',
    };
    state.requests = [created, ...state.requests];
    return HttpResponse.json(created, { status: 201 });
  }),

  // ĐK-1 tripwires: guest-web must never call these in R2.
  ...[
    '/v1/guest/sessions/otp',
    '/v1/guest/sessions/verify',
    '/v1/guest/folio',
    '/v1/guest/consents/:purpose/withdraw',
  ].map((path) =>
    http.all(path, () => {
      state.calls.push(`FORBIDDEN ${path}`);
      return problem(403, 'GUEST_VERIFICATION_REQUIRED');
    }),
  ),
];
