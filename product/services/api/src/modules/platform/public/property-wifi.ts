/**
 * The ONE reading rule of `property.wifi_info_i18n` (OpenAPI 0.3.13 getPropertyWifi, bổ sung 1 – BE C0313-16): the
 * guest page (`getGuestStay.wifi`) and the Desk (`getPropertyWifi`, V5-58) read the same way.
 * - Flat form `{ ssid, password }` – what `setPropertyWifi` writes (one network per property, ESC-022 B).
 * - Older per-language form `{ vi: { ssid, password }, en: … }` → `raw[locale]`, then `raw.vi`.
 * Moved from guest-portal.service.ts (V5-58) so both modules share it. Never logs a value.
 */

export interface WifiInfo {
  ssid: string;
  /** '' = open network. */
  password: string;
}

export function wifiOf(raw: Record<string, unknown> | null, locale: string): WifiInfo | null {
  if (!raw) return null;
  const pick = (o: unknown) =>
    o && typeof o === 'object' && typeof (o as { ssid?: unknown }).ssid === 'string'
      ? {
          ssid: (o as { ssid: string }).ssid,
          password: String((o as { password?: unknown }).password ?? ''),
        }
      : null;
  return pick(raw) ?? pick(raw[locale]) ?? pick(raw.vi);
}
