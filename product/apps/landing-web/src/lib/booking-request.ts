// Room for the "Yêu cầu đặt phòng" (booking request) form – FB-INV-002 point 3, ESC-020 L7 = A, US-155,
// ADR-014 4.3–4.6. Not built yet: endpoint and contract come from ARC/BE (OpenAPI tag public-site), copy and
// layout from UXD (mock v1.2). Until then site.json features.bookingRequest = false and the page has no form.
//
// Rules the form must follow when it lands – scripts/dist-checks.mjs enforces them as soon as the flag is on:
//  - same-origin only: POST / fetch to /v1/public/… (CSP form-action 'self', connect-src 'self'); no third-party
//    script, captcha, widget or form service (SEC C-1, ESC-002);
//  - the script is a module under /_astro/ (no inline script or handler), sets no cookie;
//  - honeypot field, signed form token, consent box not pre-ticked, versioned privacy notice (ADR-014 4.4,
//    SEC C-2/C-3); a minimal set of fields (ADR-014 4.6);
//  - source "website", plus "facebook" when the visitor arrives from the fanpage "Book now" button
//    (utm_source=facebook – ADR-014 4.5 `utm`).
// Turning it on in production also needs US-155 AC4 (Desk live with real data, ESC-001 / Bộ Công Thương notice).
import { site } from '../content/site';

export const BOOKING_REQUEST_ENABLED = site.features.bookingRequest;

/** Only same-origin public API paths may receive the form (Caddy proxies exactly these – ADR-014 1.4). */
export const BOOKING_REQUEST_PATH_PREFIX = '/v1/public/';
