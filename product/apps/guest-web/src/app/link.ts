// Guest link handling (SR-GST-01/02, SEC ĐK-4).

/** Token alphabet/length of the contract (`openGuestSession.token`: 22–64, base64url). */
const TOKEN_RE = /^[A-Za-z0-9_-]{22,64}$/;

export type LinkRead = { kind: 'token'; token: string } | { kind: 'malformed' } | { kind: 'none' };

/**
 * Reads `/g/{token}` from the path. A malformed token is rejected locally – no request is sent, so
 * guessing links costs the attacker a server round trip only for well-formed tokens (rate-limited by IP).
 */
export function readLink(pathname: string): LinkRead {
  const m = /^\/g\/([^/?#]*)\/?$/.exec(pathname);
  if (!m) return pathname.startsWith('/g/') ? { kind: 'malformed' } : { kind: 'none' };
  const token = decodeURIComponent(m[1] ?? '');
  return TOKEN_RE.test(token) ? { kind: 'token', token } : { kind: 'malformed' };
}

/** Drop the token from the address bar and history entry right away (before any request). */
export function scrubLocation(): void {
  try {
    globalThis.history?.replaceState(null, '', '/');
  } catch {
    /* sandboxed iframe – nothing to scrub */
  }
}

const MAP_HOSTS = new Set([
  'maps.google.com',
  'www.google.com',
  'maps.app.goo.gl',
  'maps.apple.com',
  'www.openstreetmap.org',
]);

/** SEC E14-08: only https map links on an exact host allow-list; anything else is not rendered. */
export function safeMapUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const u = new URL(value);
    if (u.protocol !== 'https:' || !MAP_HOSTS.has(u.hostname)) return undefined;
    if (u.hostname === 'www.google.com' && !u.pathname.startsWith('/maps')) return undefined;
    return u.toString();
  } catch {
    return undefined;
  }
}

/** `tel:` href from a public phone number (digits and a leading + only). */
export function telHref(phone: string | undefined): string | undefined {
  if (!phone) return undefined;
  const digits = phone.replace(/[^\d+]/g, '');
  return /^\+?\d{6,15}$/.test(digits) ? `tel:${digits}` : undefined;
}
