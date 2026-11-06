import type { AuditEvent } from '@ottimo/api-client';

/**
 * V5-58 (BUG-R3-021 Desk part, OpenAPI 0.3.13 `setPropertyWifi`, bổ sung 1): the shape checks the server runs
 * before anything else, done here first so the owner fixes a typo before the review step. The server stays the
 * authority – room numbers and staff sign-in names in `ssid` and "same as your sign-in password" (SR-RL-15) are
 * only known there (422 `NOT_ALLOWED`).
 */
export const WIFI_SSID_MAX_BYTES = 32; // Wi-Fi standard: 1–32 bytes of UTF-8
export const WIFI_PASSWORD_MIN = 8; // WPA2-PSK passphrase: 8–63 printable ASCII
export const WIFI_PASSWORD_MAX = 63;
/** `listAuditEvents` refuses a longer range (server AUDIT_MAX_RANGE_DAYS). */
export const WIFI_LOG_DAYS = 92;

export type WifiField = 'ssid' | 'password';
export type WifiFieldError = 'required' | 'range' | 'not_allowed';

/** Bytes of `s` in UTF-8 (an accented Vietnamese letter takes 2–3). */
export function utf8Bytes(s: string): number {
  return new TextEncoder().encode(s).length;
}

// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u001f\u007f-\u009f]/;
const PRINTABLE_ASCII = /^[\x20-\x7e]*$/;

/**
 * Client copy of the server's shape rules: `ssid` trimmed, 1–32 bytes, no control character; `password` empty
 * (open network) or 8–63 printable ASCII. The password is NOT trimmed – a WPA2 passphrase may hold spaces and must
 * match the router character for character (DOM review #120, section 2).
 */
export function wifiShapeErrors(
  ssid: string,
  password: string,
): Partial<Record<WifiField, WifiFieldError>> {
  const out: Partial<Record<WifiField, WifiFieldError>> = {};
  const name = ssid.trim();
  if (name === '') out.ssid = 'required';
  else if (utf8Bytes(name) > WIFI_SSID_MAX_BYTES || CONTROL.test(name)) out.ssid = 'range';
  if (
    password !== '' &&
    (password.length < WIFI_PASSWORD_MIN ||
      password.length > WIFI_PASSWORD_MAX ||
      !PRINTABLE_ASCII.test(password))
  )
    out.password = 'range';
  return out;
}

/** 422 `errors[]` of `setPropertyWifi` → the Desk's own kinds (codes outside the contract → `range`). */
export function wifiServerErrors(
  errors: ReadonlyArray<{ field: string; code: string }>,
): Partial<Record<WifiField, WifiFieldError>> {
  const out: Partial<Record<WifiField, WifiFieldError>> = {};
  for (const e of errors) {
    const field = e.field.replace(/^body\./, '');
    if (field !== 'ssid' && field !== 'password') continue;
    if (out[field]) continue;
    out[field] =
      e.code === 'NOT_ALLOWED' ? 'not_allowed' : e.code === 'REQUIRED' ? 'required' : 'range';
  }
  return out;
}

/** String key of a Wi-Fi field error (UXD to review – PR V5-58 Desk). */
export function wifiErrorKey(field: WifiField, kind: WifiFieldError): string {
  if (field === 'ssid')
    return kind === 'required'
      ? 'wifi.err_ssid_required'
      : kind === 'not_allowed'
        ? 'wifi.err_ssid_not_allowed'
        : 'wifi.err_ssid_long';
  return kind === 'not_allowed' ? 'wifi.err_password_login' : 'wifi.err_password_range';
}

/**
 * `property.wifi_changed` audit row → what changed (DOM FB-R5-DOM-UXD-120-03 ý 2). The row only holds
 * `before.ssid`, `after.ssid`, `after.passwordChanged` – never a password (SR-AUD-03).
 */
export type WifiChange =
  | { kind: 'first'; to: string }
  | { kind: 'unchanged' }
  | { kind: 'changed'; ssid?: { from: string; to: string }; password: boolean };

export function wifiChangeOf(e: AuditEvent): WifiChange {
  const before = (e.before ?? {}) as Record<string, unknown>;
  const after = (e.after ?? {}) as Record<string, unknown>;
  const from = typeof before.ssid === 'string' ? before.ssid : null;
  const to = typeof after.ssid === 'string' ? after.ssid : '';
  const password = after.passwordChanged === true;
  if (from === null) return { kind: 'first', to };
  if (from === to && !password) return { kind: 'unchanged' };
  return { kind: 'changed', ...(from !== to ? { ssid: { from, to } } : {}), password };
}
