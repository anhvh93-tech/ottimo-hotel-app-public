// "Request to book" (yêu cầu đặt phòng) – FB-INV-002 point 3, ESC-020 L7 = A, US-155, ADR-014 4.3–4.6, concept 5.
// INV 24/10 (decision-log): US-155 is in v1.0 and the form goes live on ottimo.vn the day the production Desk runs.
// Until then the production build keeps the Zalo/call block of concept 5.5 "chat" and ships no form and no form script.
//
// Three builds:
//  - production today (`pnpm build`, nothing set): no form – exactly what ottimo.vn serves now;
//  - review build (`pnpm build:booking-preview`, LANDING_BOOKING_PREVIEW=true): the form UI, the submit never sends;
//  - live form (LANDING_BOOKING_FORM=true + LANDING_PROPERTY_SLUG, optional PUBLIC_FORM_API_BASE): the form posts to
//    the public-site endpoints of the Desk API (OpenAPI 0.3.7 add-on 2: getPublicFormToken, createWebsiteBookingRequest).
//
// Rules the form follows – scripts/dist-checks.mjs enforces them whenever a form is rendered:
//  - SEC UXD-08: <form hidden> with no `action`; the module script removes `hidden`; no JS = never submitted;
//  - the contract route is SAME ORIGIN: the landing origin proxies `/v1/public/properties/{slug}/(form-token|
//    booking-requests)` to the API (OpenAPI info "Origin landing", SEC ARC-06 – no CORS), so CSP stays
//    `connect-src 'self'`. PUBLIC_FORM_API_BASE (an https origin) is only for a deployment where the API answers on
//    another origin – then CSP connect-src gains exactly that origin (scripts/headers.mjs) and the API must allow it;
//  - no third-party script, captcha, widget or form service (SEC C-1, ESC-002); the script is a module under /_astro/,
//    sets no cookie, keeps nothing in browser storage;
//  - honeypot, consent box not pre-ticked, versioned privacy notice (SEC UXD-04/05, C-2/C-3) published at
//    /privacy/ and /vi/privacy/ with the form (content/privacy.ts); one way to reach the guest; children counted by
//    age group, never exact ages (SEC ARC-14);
//  - source "website" (+ utm_source, e.g. facebook for the fanpage "Book now" link to /#book – concept 5.7).
// If the server switch `public_booking_requests_enabled` is off (or the property is not taking requests), the public
// endpoints answer 404 / 422 PUBLIC_FORM_NOT_READY and the page points to Zalo or a call instead (scripts/booking-form.ts).
import { site } from '../content/site';
import { PRIVACY_NOTICE } from '../content/privacy';
import { INDEXABLE } from './i18n';

const env = process.env;

/** Live form: LANDING_BOOKING_FORM=true (production switch, default off) – or the old site.json flag. */
export const BOOKING_REQUEST_ENABLED =
  env.LANDING_BOOKING_FORM === 'true' || site.features.bookingRequest;

/**
 * Review build of the form (`pnpm build:booking-preview` → dist-booking-preview/): renders the form UI of mock v1.2.1
 * for UXD/QA and the Playwright form cases. The submit validates, then says the request was NOT sent – nothing
 * leaves the page. Never indexable, never deployed.
 */
export const BOOKING_FORM_PREVIEW = env.LANDING_BOOKING_PREVIEW === 'true';
if (BOOKING_FORM_PREVIEW && INDEXABLE) {
  throw new Error(
    'LANDING_BOOKING_PREVIEW is a review build: it cannot be built with LANDING_INDEXABLE=true',
  );
}
if (BOOKING_FORM_PREVIEW && BOOKING_REQUEST_ENABLED) {
  throw new Error('LANDING_BOOKING_PREVIEW and LANDING_BOOKING_FORM cannot be combined');
}

/** The page renders the form (instead of the Zalo/call block of concept 5.5 "chat"). */
export const BOOKING_FORM_RENDERED = BOOKING_REQUEST_ENABLED || BOOKING_FORM_PREVIEW;

/** The privacy notice pages ship with the form (SEC C-3 (a)) – or once site.json says SEC published them alone. */
export const PRIVACY_PAGE_PUBLISHED = BOOKING_FORM_RENDERED || site.features.privacyPage;

/** Public API paths the form may call (the landing Caddy proxies exactly these – ADR-014 1.4). */
export const BOOKING_REQUEST_PATH_PREFIX = '/v1/public/';

/** `PropertySlug` of the contract: `^[a-z0-9-]{2,40}$`. */
export const PROPERTY_SLUG_PATTERN = /^[a-z0-9-]{2,40}$/;

/**
 * PUBLIC_FORM_API_BASE → '' (same origin – the contract route) or an origin `https://host[:port]` (no path, query or
 * trailing slash). Plain http is accepted only for a loopback host (local E2E). Anything else stops the build.
 */
export function parseApiBase(raw: string | undefined): string {
  const value = (raw ?? '').trim();
  if (!value) return '';
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(
      `PUBLIC_FORM_API_BASE must be an origin like https://desk.example.vn – got "${value}"`,
    );
  }
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  const okScheme = url.protocol === 'https:' || (url.protocol === 'http:' && loopback);
  if (!okScheme || url.username || url.password || url.search || url.hash || url.pathname !== '/')
    throw new Error(
      `PUBLIC_FORM_API_BASE must be an https origin without path, query or credentials – got "${value}"`,
    );
  return url.origin;
}

/** '' = same origin (default, contract); otherwise the API origin the form posts to. */
export const PUBLIC_FORM_API_BASE = BOOKING_REQUEST_ENABLED
  ? parseApiBase(env.PUBLIC_FORM_API_BASE)
  : '';

/** Property of the public endpoints (`/v1/public/properties/{propertySlug}/…`) – required for the live form. */
export const PUBLIC_PROPERTY_SLUG = BOOKING_REQUEST_ENABLED
  ? (env.LANDING_PROPERTY_SLUG ?? '').trim()
  : '';

/**
 * Version of the published privacy notice sent as `consentVersion` (SEC UXD-04, ARC-17): taken from the notice file
 * that ships with this build (content/privacy.ts), never typed by hand. The server must hold the same
 * `privacy_notice_version` for `vi` and `en`, otherwise the owner cannot switch the form on (PUBLIC_FORM_NOT_READY) and
 * requests get NOTICE_VERSION_INVALID.
 */
export const PRIVACY_NOTICE_VERSION = PRIVACY_NOTICE.version;

if (BOOKING_REQUEST_ENABLED) {
  if (!PROPERTY_SLUG_PATTERN.test(PUBLIC_PROPERTY_SLUG))
    throw new Error(
      'LANDING_BOOKING_FORM=true needs LANDING_PROPERTY_SLUG (the property slug of the public API, ^[a-z0-9-]{2,40}$)',
    );
  if (!/^\d{4}-\d{2}-\d{2}(\.\d{1,2})?$/.test(PRIVACY_NOTICE_VERSION))
    throw new Error('The live form needs a published privacy notice version (content/privacy.ts)');
}
