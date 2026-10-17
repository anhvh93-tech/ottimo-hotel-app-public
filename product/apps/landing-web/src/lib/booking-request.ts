// "Request to book" (yêu cầu đặt phòng) – FB-INV-002 point 3, ESC-020 L7 = A, US-155, ADR-014 4.3–4.6, concept 5.
// The form UI of mock v1.2.1 is built (components/BookingForm.astro + scripts/booking-form.ts). The transport is NOT:
// the endpoint and contract come from ARC/BE (OpenAPI `WebsiteBookingRequestInput`, still open: concept 5.2 A1–A3).
// While site.json features.bookingRequest = false (production today) the #book section shows the Zalo/call block
// (concept 5.5 "chat") and the page ships no form and no form script.
//
// Rules the form follows – scripts/dist-checks.mjs enforces them whenever a form is rendered:
//  - SEC UXD-08: <form hidden> with no `action`; the module script removes `hidden`; no JS = never submitted;
//  - same-origin only (CSP form-action/connect-src 'self'); no third-party script, captcha, widget or form service
//    (SEC C-1, ESC-002); the script is a module under /_astro/, sets no cookie, keeps nothing in browser storage;
//  - honeypot, consent box not pre-ticked, versioned privacy notice (SEC UXD-04/05, C-2/C-3); one way to reach the
//    guest; children counted by age group, never exact ages (SEC ARC-14);
//  - source "website" (+ utm_source, e.g. facebook for the fanpage "Book now" link to /#book – concept 5.7).
// Turning it on in production also needs US-155 AC4 (Desk live with real data, ESC-001 / Bộ Công Thương notice).
import { site } from '../content/site';
import { INDEXABLE } from './i18n';

export const BOOKING_REQUEST_ENABLED = site.features.bookingRequest;

/**
 * Review build of the form (`pnpm build:booking-preview` → dist-booking-preview/): renders the form UI of mock v1.2.1
 * for UXD/QA and the Playwright form cases while the feature stays off. The submit validates, then says the request
 * was NOT sent – there is no endpoint yet and nothing leaves the page. Never indexable, never deployed.
 */
export const BOOKING_FORM_PREVIEW = process.env.LANDING_BOOKING_PREVIEW === 'true';
if (BOOKING_FORM_PREVIEW && INDEXABLE) {
  throw new Error(
    'LANDING_BOOKING_PREVIEW is a review build: it cannot be built with LANDING_INDEXABLE=true',
  );
}

/** The page renders the form (instead of the Zalo/call block of concept 5.5 "chat"). */
export const BOOKING_FORM_RENDERED = BOOKING_REQUEST_ENABLED || BOOKING_FORM_PREVIEW;

/** Only same-origin public API paths may receive the form (Caddy proxies exactly these – ADR-014 1.4). */
export const BOOKING_REQUEST_PATH_PREFIX = '/v1/public/';

/**
 * Version of the published privacy notice sent as `consentVersion` (SEC UXD-04, ARC-17) – comes from the notice file
 * SEC publishes with the build. Empty until then: the live form cannot be turned on without it.
 */
export const PRIVACY_NOTICE_VERSION = '';

/** Public API base of the property (ADR-014 4.8) – empty until BE-D ships the endpoints; the API transport then
 *  answers "not ready" and the page points to Zalo. */
export const PUBLIC_PROPERTY_SLUG = '';
