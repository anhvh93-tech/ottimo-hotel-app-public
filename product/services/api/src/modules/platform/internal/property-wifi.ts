/**
 * V5-58 (BUG-R3-021 Desk part; OpenAPI 0.3.13 1.13, 1.23, bổ sung 1e) – rules and storage of the property Wi-Fi,
 * one network per property (BR-012 (7), ESC-022 B) in `property.wifi_info_i18n`, the column the guest page reads.
 * - Shape rules (pure, unit-tested): `ssid` trimmed, 1–32 bytes UTF-8, no control character; `password` '' (open
 *   network) or 8–63 printable ASCII (0x20–0x7E, WPA2-PSK).
 * - Property rules (DB): `ssid` holding a room number of the property as a word of its own → NOT_ALLOWED (the
 *   network name guests see never tells a room); `ssid` = the login name of a staff member of the property (any
 *   case, disabled accounts and revoked roles included – SEC ARC-04 (a)) → NOT_ALLOWED.
 * - Never a value in an error, a log line or an audit row: errors carry `field`, `code` (and `max` for `ssid`);
 *   the audit keeps `ssid` before/after and `passwordChanged` only.
 */
import type { Tx } from '../../../db/database';
import { type FieldError } from '../../../shared/problem';
import { type WifiInfo, wifiOf } from '../public/property-wifi';

export const WIFI_SSID_MAX_BYTES = 32;
/** `rate_limit_counter` key prefix of the Wi-Fi password comparison (ORC on BE C0313-24): `wifi_pw_cmp:<user_id>`. */
export const WIFI_PASSWORD_COMPARE_BUCKET = 'wifi_pw_cmp';
export const WIFI_PASSWORD_MIN = 8;
export const WIFI_PASSWORD_MAX = 63;

/** The Desk reads the older per-language form like a Vietnamese guest (`raw.vi`). */
const DESK_LOCALE = 'vi';

const CONTROL = /\p{Cc}/u;
const PRINTABLE_ASCII = /^[\x20-\x7e]*$/;

/** `ssid` after trimming: 1–32 bytes UTF-8 (Vietnamese letters take 2–3 bytes), no control character. */
export function ssidShapeOk(trimmed: string): boolean {
  const bytes = Buffer.byteLength(trimmed, 'utf8');
  return bytes >= 1 && bytes <= WIFI_SSID_MAX_BYTES && !CONTROL.test(trimmed);
}

/** '' (open network) or 8–63 printable ASCII characters. */
export function wifiPasswordShapeOk(password: string): boolean {
  if (password === '') return true;
  return (
    password.length >= WIFI_PASSWORD_MIN &&
    password.length <= WIFI_PASSWORD_MAX &&
    PRINTABLE_ASCII.test(password)
  );
}

/** Words of a network name: runs of letters/digits (`OTTIMO 401`, `OTTIMO-401` → OTTIMO, 401; `OTTIMO401` → one). */
export function ssidWords(ssid: string): string[] {
  return ssid
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w !== '')
    .map((w) => w.toUpperCase());
}

export function ssidHasRoomNumber(ssid: string, roomNos: readonly string[]): boolean {
  const rooms = new Set(roomNos.map((r) => r.toUpperCase()));
  return ssidWords(ssid).some((w) => rooms.has(w));
}

/** Shape errors of a parsed body, in field order. */
export function wifiShapeErrors(input: { ssid: string; password: string }): {
  errors: FieldError[];
  ssidOk: boolean;
  passwordOk: boolean;
} {
  const errors: FieldError[] = [];
  const ssidOk = ssidShapeOk(input.ssid);
  if (!ssidOk) errors.push({ field: 'ssid', code: 'VALUE_OUT_OF_RANGE' });
  const passwordOk = wifiPasswordShapeOk(input.password);
  if (!passwordOk) errors.push({ field: 'password', code: 'VALUE_OUT_OF_RANGE' });
  return { errors, ssidOk, passwordOk };
}

export async function readPropertyWifi(tx: Tx, forUpdate = false): Promise<WifiInfo | null> {
  const { rows } = await tx.query<{ wifi_info_i18n: Record<string, unknown> | null }>(
    `SELECT wifi_info_i18n FROM property WHERE id = $1${forUpdate ? ' FOR UPDATE' : ''}`,
    [tx.ctx.propertyId],
  );
  return wifiOf(rows[0]?.wifi_info_i18n ?? null, DESK_LOCALE);
}

/** The property rules on `ssid` (shape already valid). */
export async function ssidRefused(tx: Tx, ssid: string): Promise<boolean> {
  const { rows: rooms } = await tx.query<{ room_no: string }>(
    'SELECT room_no FROM room WHERE property_id = $1',
    [tx.ctx.propertyId],
  );
  if (
    ssidHasRoomNumber(
      ssid,
      rooms.map((r) => r.room_no),
    )
  ) {
    return true;
  }
  const { rows: staff } = await tx.query(
    `SELECT 1 FROM app_user u
      WHERE lower(u.username) = lower($1)
        AND EXISTS (SELECT 1 FROM user_property_role r WHERE r.user_id = u.id AND r.property_id = $2)
      LIMIT 1`,
    [ssid, tx.ctx.propertyId],
  );
  return staff.length > 0;
}

export async function writePropertyWifi(tx: Tx, wifi: WifiInfo, now: Date): Promise<void> {
  await tx.query(
    `UPDATE property SET wifi_info_i18n = $2::jsonb, updated_at = $3, version = version + 1 WHERE id = $1`,
    [tx.ctx.propertyId, JSON.stringify({ ssid: wifi.ssid, password: wifi.password }), now],
  );
}

/** `PropertyWifi` of getPropertyWifi (S36). */
export function wifiView(w: WifiInfo | null): Record<string, unknown> {
  if (!w) return { configured: false };
  return { configured: true, ssid: w.ssid, password: w.password, passwordSet: w.password !== '' };
}
