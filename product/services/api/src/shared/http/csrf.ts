/**
 * CSRF + Origin for cookie sessions (SR-SES-04, OpenAPI "Bảo mật" + "Thứ tự kiểm", architecture 10 "Ba origin").
 *
 * The AuthGuard runs both checks right after authentication (before trusted device, Idempotency-Key,
 * If-Match and roles), for every WRITE method (POST/PUT/PATCH/DELETE):
 * - Origin: must be one of the configured origins (exact scheme://host[:port]). Staff operations accept the
 *   admin-web and staff-PWA origins; public operations (login, guest link exchange) any of the three.
 *   No CORS: each site proxies /v1 on its own origin, so a legitimate browser request is same-origin.
 *   Empty origin lists = not checked – only possible in dev/test (config.ts requires all three in
 *   staging/production). Webhooks (system principal) never reach this check (SR-PAY-05).
 * - X-CSRF-Token: synchronizer token bound to the session. The identity module owns the token
 *   (SessionService: HMAC-SHA256(SESSION_SECRET, "csrf:" + session id), returned in Me.csrfToken) and
 *   registers itself as CSRF_VERIFIER; the guard calls it. main.ts refuses to start in staging/production
 *   without a registered verifier.
 * A failure is 403 FORBIDDEN_ACTION + audit_event access.denied (reason ORIGIN / CSRF) when a session exists.
 */

export const CSRF_HEADER = 'x-csrf-token';
/** DI token: the identity module provides `{ provide: CSRF_VERIFIER, useExisting: SessionService }`. */
export const CSRF_VERIFIER = Symbol('CSRF_VERIFIER');

export interface CsrfVerifier {
  verifyCsrf(sessionId: string, token: string | undefined): boolean;
}

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export interface AllowedOrigins {
  /** admin-web (desk.<domain>) and staff PWA (staff.<domain>). */
  staff: string[];
  /** guest-web (g.<domain>). */
  guest: string[];
  /**
   * The two parts of `staff`, for the identity module's session classification (admin-web vs staff PWA –
   * session lifetime SR-SES-03, trusted devices SR-DEV-04). Same validated values as `staff`
   * (FB-R2-ARC-BE-12 b: one source of origins).
   */
  admin?: string[];
  staffPwa?: string[];
}

export function isWriteMethod(method: string): boolean {
  return WRITE_METHODS.has(method.toUpperCase());
}

/** Normalise a configured base URL to its origin (scheme://host[:port]); throws on anything else. */
export function originOf(url: string): string {
  const u = new URL(url);
  if (u.protocol !== 'https:' && u.protocol !== 'http:') throw new Error('origin must be http(s)');
  return u.origin;
}

/** Empty `allowed` = not configured (dev/test) → accepted. Otherwise exact match; "null" never matches. */
export function originAllowed(origin: string | undefined, allowed: readonly string[]): boolean {
  if (allowed.length === 0) return true;
  if (!origin || origin === 'null') return false;
  return allowed.includes(origin);
}
