// Response headers of the landing origin (ADR-014 1.4) for `astro preview` and the Playwright server
// (tests/e2e/landing/serve.mjs). Production sets the same headers in infra/caddy/Caddyfile.landing (OPS).
//
// CSP `connect-src` is 'self' – the booking form posts to the public API through the landing origin (contract route,
// no CORS). Only when the live build names another API origin (PUBLIC_FORM_API_BASE, lib/booking-request.ts) does
// connect-src gain EXACTLY that origin – nothing else changes (no inline script, no other source).
import { readFileSync } from 'node:fs';

const base = JSON.parse(
  readFileSync(new URL('../src/lib/security-headers.json', import.meta.url), 'utf8'),
);

/**
 * `https://host[:port]` (or http on a loopback host for local tests) → that origin; anything else → null.
 * @param {string | null | undefined} raw
 * @returns {string | null}
 */
export function apiOriginOf(raw) {
  const value = (raw ?? '').trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    if (url.protocol === 'https:' || (url.protocol === 'http:' && loopback)) return url.origin;
  } catch {
    // fall through
  }
  return null;
}

/**
 * Security headers (keys starting with "$" are notes, not headers).
 * @param {{ apiOrigin?: string | null }} [opts]
 * @returns {Record<string, string>}
 */
export function securityHeaders({ apiOrigin = null } = {}) {
  const out = Object.fromEntries(Object.entries(base).filter(([name]) => !name.startsWith('$')));
  const origin = apiOriginOf(apiOrigin);
  if (origin)
    out['Content-Security-Policy'] = out['Content-Security-Policy'].replace(
      "connect-src 'self'",
      `connect-src 'self' ${origin}`,
    );
  return out;
}
