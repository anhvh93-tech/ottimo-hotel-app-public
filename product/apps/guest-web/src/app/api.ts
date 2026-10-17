// Guest-portal calls (OpenAPI 0.3.6 tag `guest-portal`). Only level-1 operations exist here on purpose:
// sendGuestOtp, verifyGuestSession, getGuestFolio, withdrawGuestConsent are NOT called in R2 (SEC ĐK-1).
import {
  ApiError,
  createApiClient,
  isApiError,
  networkError,
  newIdempotencyKey,
  parseRetryAfter,
  syntheticProblem,
  type BodyOf,
  type components,
  type Problem,
  type ResponseOf,
} from '@ottimo/api-client';

type Schemas = components['schemas'];
export type GuestSession = Schemas['GuestSession'];
export type GuestRequest = Schemas['GuestRequestForGuest'];
export type GuestRequestType = Schemas['GuestRequestType'];
export interface GuestRequestOption {
  type: GuestRequestType;
  available: boolean;
  unavailableReason?:
    'outside_service_hours' | 'not_in_house' | 'paid_limit_reached' | 'not_offered' | null;
  feeVnd?: number | null;
  feeReason?: 'second_full_clean' | 'long_stay_adhoc' | null;
  lastFullCleanTime?: string | null;
  noteRequired: boolean;
}
export type GuestStayRaw = Schemas['GuestStay'];
export type OnlineCheckin = Schemas['OnlineCheckin'];
export type DocType = Schemas['DocType'];
export type ConsentInput = Schemas['ConsentInput'];
export type UpdateOnlineCheckinBody = BodyOf<'updateOnlineCheckin'>;
export type CompleteOnlineCheckinBody = BodyOf<'completeOnlineCheckin'>;
export type CheckinStep = OnlineCheckin['currentStep'];

/**
 * Level-1 view of GuestStay (SEC ĐK-2). Built by whitelisting keys, so a server bug that leaked
 * `guestFullName` / `doorCode` would still never reach React state or the DOM.
 * BR-012 (1) (0.3.7): the guest sees the room NAME, never the room number – `roomNo` is not copied even
 * if an older server still sends it.
 */
export type GuestStay = Omit<
  GuestStayRaw,
  'guestFullName' | 'doorCode' | 'doorCodeAvailableFrom' | 'roomNo'
>;

export function pickStayLevel1(raw: GuestStayRaw): GuestStay {
  const p = raw.property ?? {};
  return {
    reservationCode: raw.reservationCode,
    status: raw.status,
    stayType: raw.stayType,
    roomName: raw.roomName ?? null,
    publicRoomType: raw.publicRoomType ?? null,
    arrivalDate: raw.arrivalDate,
    departureDate: raw.departureDate,
    checkinTime: raw.checkinTime,
    checkoutTime: raw.checkoutTime,
    property: { name: p.name, address: p.address, mapUrl: p.mapUrl, phone: p.phone },
    houseRules: raw.houseRules,
    wifi: raw.wifi ? { ssid: raw.wifi.ssid, password: raw.wifi.password } : null,
    onlineCheckinAvailable: raw.onlineCheckinAvailable,
  };
}

/** Keys of OnlineCheckin allowed at level 1 (s3-checklist G2; 9 → 11 with the 0.3.6 addendum, SEC ĐK-2 17/10). */
const CHECKIN_KEYS = [
  'currentStep',
  'requiredPeople',
  'uploadedPeople',
  'etaTime',
  'consentRecorded',
  'completedAt',
  'noticeAccepted',
  'lateArrival',
  'deferredPeople',
  'currentNoticeVersion',
  'imageRetentionDays',
] as const;

export function pickCheckin(raw: OnlineCheckin): OnlineCheckin {
  const out: Record<string, unknown> = {};
  for (const k of CHECKIN_KEYS) if (raw[k] !== undefined) out[k] = raw[k];
  return out as OnlineCheckin;
}

/**
 * GuestSession keys used by the page (ĐK-2) – `verification` is ignored (ĐK-1: no level-2 buttons);
 * `roomNo` is dropped (BR-012 – deprecated in 0.3.7), the room name comes with the stay.
 */
export function pickSession(raw: GuestSession): GuestSession {
  return {
    level: 1,
    reservationCode: raw.reservationCode,
    stayEnded: raw.stayEnded,
    guestFirstName: raw.guestFirstName,
    roomName: raw.roomName ?? null,
    publicRoomType: raw.publicRoomType ?? null,
    locale: raw.locale,
    localeChosenByGuest: raw.localeChosenByGuest === true,
    expiresAt: raw.expiresAt,
  };
}

/** Level-1 keys of a guest request (SM-15) – whitelisted like the stay. */
export function pickRequest(raw: GuestRequest): GuestRequest {
  return {
    id: raw.id,
    type: raw.type,
    note: raw.note,
    status: raw.status,
    statusLabel: raw.statusLabel,
    autoReply: raw.autoReply,
    declinedReasonCode: raw.declinedReasonCode,
    replyNote: raw.replyNote,
    feeVnd: raw.feeVnd ?? null,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

const client = createApiClient();

const RETRY_ONCE = new Set(['CONCURRENT_UPDATE', 'SERVICE_UNAVAILABLE']);

/** DS 6.21: CONCURRENT_UPDATE / SERVICE_UNAVAILABLE are retried once, keeping the guest on the same step. */
async function withRetry<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (e) {
    if (isApiError(e) && RETRY_ONCE.has(e.code)) return run();
    throw e;
  }
}

export const guestApi = {
  /**
   * The server picks the session language (0.3.7 bổ sung 1 #12, P-S4-10): the guest's own earlier choice →
   * booking profile → `Accept-Language`. We send the browser's first preference already reduced to the
   * same rule (`vi*` → vi, `ru*` → ru, else en) – the result the server would reach, and testable.
   */
  openSession: async (token: string, browserLanguage: Schemas['Locale']) =>
    pickSession(
      (
        await client.request<GuestSession>('POST', '/v1/guest/sessions', {
          body: { token },
          acceptLanguage: browserLanguage,
          local: true,
        })
      ).data,
    ),
  getStay: async () =>
    pickStayLevel1((await client.request<GuestStayRaw>('GET', '/v1/guest/stay')).data),
  setLocale: async (locale: Schemas['Locale']) => {
    await client.request<void>('PUT', '/v1/guest/locale', { body: { locale } });
  },
  getCheckin: async () =>
    pickCheckin((await client.request<OnlineCheckin>('GET', '/v1/guest/online-checkin')).data),
  updateCheckin: (body: UpdateOnlineCheckinBody) =>
    withRetry(async () =>
      pickCheckin(
        (await client.request<OnlineCheckin>('PUT', '/v1/guest/online-checkin', { body })).data,
      ),
    ),
  recordConsent: (body: ConsentInput) =>
    withRetry(async () =>
      pickCheckin(
        (
          await client.request<ResponseOf<'recordGuestConsent'>>('POST', '/v1/guest/consents', {
            body,
          })
        ).data,
      ),
    ),
  // US-109 (H23): requests of this stay + the options with the fee the server works out for THIS guest now
  // (ESC-016 A) – the page never computes a fee itself (DS 6.19).
  listRequests: async () =>
    (await client.request<{ data: GuestRequest[] }>('GET', '/v1/guest/requests')).data.data.map(
      pickRequest,
    ),
  listRequestOptions: async () =>
    (await client.request<{ data: GuestRequestOption[] }>('GET', '/v1/guest/request-options')).data
      .data,
  createRequest: (
    body: { type: GuestRequestType; note?: string; feeAccepted?: boolean },
    idempotencyKey: string,
  ) =>
    withRetry(async () =>
      pickRequest(
        (
          await client.request<GuestRequest>('POST', '/v1/guest/requests', {
            body,
            idempotencyKey,
          })
        ).data,
      ),
    ),
  completeCheckin: (body: CompleteOnlineCheckinBody, idempotencyKey: string) =>
    withRetry(async () =>
      pickCheckin(
        (
          await client.request<OnlineCheckin>('POST', '/v1/guest/online-checkin/complete', {
            body,
            idempotencyKey,
          })
        ).data,
      ),
    ),
};

export interface UploadInput {
  personIndex: number;
  docType: DocType;
  images: Blob[];
  idempotencyKey: string;
  onProgress?: (pct: number) => void;
}

function problemFromXhr(xhr: XMLHttpRequest): Problem {
  const requestId = xhr.getResponseHeader('x-request-id') ?? undefined;
  try {
    const body = JSON.parse(xhr.responseText) as Partial<Problem>;
    if (body && typeof body.code === 'string') return { ...body, requestId } as Problem;
  } catch {
    /* non-JSON body */
  }
  if (xhr.status === 413) {
    return { type: 'about:blank', title: '413', status: 413, code: 'PAYLOAD_TOO_LARGE', requestId };
  }
  return syntheticProblem(xhr.status, requestId);
}

/**
 * `uploadGuestDocument` (multipart). XHR instead of fetch only to report upload progress
 * (`guest.oci.uploading`). The images live in this call's memory only – never in any storage (ĐK-3).
 */
export function uploadGuestDocument(input: UploadInput): Promise<OnlineCheckin> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append('personIndex', String(input.personIndex));
    form.append('docType', input.docType);
    input.images.forEach((img, i) =>
      form.append('image', img, `p${input.personIndex}-${i + 1}.jpg`),
    );

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/v1/guest/online-checkin/documents');
    xhr.timeout = 120_000; // 4 photos on a weak 3G link; then the in-memory retry takes over
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.setRequestHeader('Idempotency-Key', input.idempotencyKey);
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable && input.onProgress) {
        input.onProgress(Math.min(99, Math.round((ev.loaded / ev.total) * 100)));
      }
    };
    xhr.onerror = () => reject(networkError());
    xhr.ontimeout = () => reject(networkError());
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        input.onProgress?.(100);
        try {
          resolve(pickCheckin(JSON.parse(xhr.responseText) as OnlineCheckin));
        } catch {
          reject(new ApiError(xhr.status, syntheticProblem(500)));
        }
        return;
      }
      reject(
        new ApiError(
          xhr.status,
          problemFromXhr(xhr),
          parseRetryAfter(xhr.getResponseHeader('retry-after')),
        ),
      );
    };
    xhr.send(form);
  });
}

export { isApiError, newIdempotencyKey, ApiError };
