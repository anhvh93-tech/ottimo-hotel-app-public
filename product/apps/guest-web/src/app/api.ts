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
 */
export type GuestStay = Omit<GuestStayRaw, 'guestFullName' | 'doorCode' | 'doorCodeAvailableFrom'>;

export function pickStayLevel1(raw: GuestStayRaw): GuestStay {
  const p = raw.property ?? {};
  return {
    reservationCode: raw.reservationCode,
    status: raw.status,
    stayType: raw.stayType,
    roomNo: raw.roomNo ?? null,
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

/** GuestSession keys used by the page (ĐK-2) – `verification` is ignored (ĐK-1: no level-2 buttons). */
export function pickSession(raw: GuestSession): GuestSession {
  return {
    level: 1,
    reservationCode: raw.reservationCode,
    stayEnded: raw.stayEnded,
    guestFirstName: raw.guestFirstName,
    roomNo: raw.roomNo,
    locale: raw.locale,
    expiresAt: raw.expiresAt,
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
  openSession: async (token: string) =>
    pickSession(
      (
        await client.request<GuestSession>('POST', '/v1/guest/sessions', {
          body: { token },
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
