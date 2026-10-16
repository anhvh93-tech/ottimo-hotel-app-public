/** Minimal Cookie header parser (no dependency): name=value pairs, first occurrence wins. */
export function readCookie(header: string | undefined, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq < 0) continue;
    if (part.slice(0, eq).trim() !== name) continue;
    const raw = part.slice(eq + 1).trim();
    try {
      return decodeURIComponent(raw);
    } catch {
      return undefined;
    }
  }
  return undefined;
}

/** Cookie names (OpenAPI "Bảo mật"): __Host- prefix unless COOKIE_SECURE_PREFIX=false (dev over HTTP). */
export function cookieNames(securePrefix: boolean): { session: string; device: string } {
  const p = securePrefix ? '__Host-' : '';
  return { session: `${p}ottimo_sid`, device: `${p}ottimo_did` };
}
