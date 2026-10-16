import type { Args } from '@ottimo/i18n';
import { isApiError } from '@ottimo/api-client';

type T = (key: string, args?: Args) => string;

/** Page-level outcomes that replace the whole page (EP06 8.4, EP14 2.3, H18 18.5). */
export type Terminal = 'link_invalid' | 'stay_ended' | 'checkin_closed';

export function terminalOf(error: unknown): Terminal | undefined {
  if (!isApiError(error)) return undefined;
  if (error.status === 401) return 'link_invalid';
  if (error.code === 'GUEST_STAY_ENDED') return 'stay_ended';
  if (error.code === 'ONLINE_CHECKIN_CLOSED') return 'checkin_closed';
  return undefined;
}

export function retryMinutes(error: unknown): number {
  if (isApiError(error) && error.retryAfterSeconds !== undefined) {
    return Math.max(1, Math.ceil(error.retryAfterSeconds / 60));
  }
  return 10;
}

/** `INVALID_TRANSITION.currentState` → the step the server says is still missing. */
export function missingStep(error: unknown): string | undefined {
  if (!isApiError(error) || error.code !== 'INVALID_TRANSITION') return undefined;
  const s = (error.problem as Record<string, unknown>).currentState;
  return typeof s === 'string' ? s : undefined;
}

/** Request-level codes a guest can meet, each with its literal key (the bundle ships only named keys). */
const GUEST_CODE_KEYS: Record<string, string> = {
  FILE_REJECTED: 'error.FILE_REJECTED',
  PAYLOAD_TOO_LARGE: 'error.PAYLOAD_TOO_LARGE',
  CARD_NUMBER_DETECTED: 'error.CARD_NUMBER_DETECTED',
  CONCURRENT_UPDATE: 'error.CONCURRENT_UPDATE',
  SERVICE_UNAVAILABLE: 'error.SERVICE_UNAVAILABLE',
  ONLINE_CHECKIN_CLOSED: 'error.ONLINE_CHECKIN_CLOSED',
};

/** Field codes of `uploadGuestDocument` / client-side photo checks (E06-07). */
export const FIELD_KEYS: Record<string, string> = {
  FILE_TYPE: 'field.FILE_TYPE',
  FILE_TOO_LARGE: 'field.FILE_TOO_LARGE',
  TOO_MANY_FILES: 'field.TOO_MANY_FILES',
};

/**
 * One sentence for a failed call. Only guest-safe strings: never the raw `detail`, never staff
 * wording (the INVALID_TRANSITION sentence talks about "the booking status" to front-desk staff).
 */
export function problemText(t: T, error: unknown): string {
  if (!isApiError(error) || error.isNetwork) return t('guest.error_body');
  const code = error.code;
  if (code === 'RATE_LIMITED') return t('error.RATE_LIMITED', { minutes: retryMinutes(error) });
  if (code === 'FILE_REJECTED' || code === 'VALIDATION_FAILED') {
    const fe = error.fieldErrors.find((f) => FIELD_KEYS[f.code]);
    if (fe) return t(FIELD_KEYS[fe.code]!);
  }
  if (error.fieldErrors.some((f) => f.code === 'CARD_NUMBER_DETECTED')) {
    return t('error.CARD_NUMBER_DETECTED');
  }
  const key = GUEST_CODE_KEYS[code];
  if (key) return t(key);
  if (error.status >= 500 && error.requestId) {
    return t('gw.error_server', { request_id: error.requestId });
  }
  return t('guest.error_body');
}
