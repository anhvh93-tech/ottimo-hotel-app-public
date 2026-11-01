/**
 * Runtime options of the public-site module (environment – never a business parameter):
 * - LANDING_BASE_URL → the ONLY Origin accepted on the public form calls (`x-allowed-origins: [landing]`);
 *   unset → the public form answers 404 (nothing to accept from);
 * - PUBLIC_FORM_SIGNING_KEY (from PUBLIC_FORM_SIGNING_KEY_FILE – bootstrap reads X_FILE secrets), ≥ 32 chars,
 *   its own key (ADR-013 point 5) – unset → no form token (404) and the switch cannot be turned on
 *   (422 PUBLIC_FORM_NOT_READY);
 * - LOG_IP_HMAC_KEY → HMAC of the client IP for the rate-limit buckets and `ip_hmac` (never the clear IP);
 * - LANDING_LOCALES (R4 LP-v2, ARC lp-v2-design 3.4) → the landing languages ON SALE: each needs a published
 *   privacy notice before the form can be switched on (PUBLIC_FORM_NOT_READY). Default `en,vi`; every item must be
 *   a `LandingLocale` (OpenAPI 0.3.9) – anything else stops the api at start. The server `.env` is the one source
 *   for the api and the OPS scripts (publish-privacy-notice, deploy-landing).
 */
export const PUBLIC_SITE_OPTIONS = Symbol('PUBLIC_SITE_OPTIONS');

/** OpenAPI 0.3.9 `LandingLocale` (en, vi, ko, zh, ru – `zh` = simplified Chinese). Only ADD values. */
export const LANDING_LOCALE_VALUES = ['en', 'vi', 'ko', 'zh', 'ru'] as const;
export type LandingLocale = (typeof LANDING_LOCALE_VALUES)[number];

export const isLandingLocale = (v: unknown): v is LandingLocale =>
  typeof v === 'string' && (LANDING_LOCALE_VALUES as readonly string[]).includes(v);

export interface PublicSiteOptions {
  landingOrigin: string | null;
  signingKey: string | null;
  ipHmacKey: string;
  /** LANDING_LOCALES – languages on sale (readiness of the form switch). */
  landingLocales: readonly LandingLocale[];
}

/** `LANDING_LOCALES` → distinct LandingLocale list; empty/unset → en,vi; an unknown item → start-up error. */
export function landingLocalesFrom(raw: string | undefined): LandingLocale[] {
  const items = (raw ?? '')
    .split(',')
    .map((x) => x.trim())
    .filter((x) => x !== '');
  if (items.length === 0) return ['en', 'vi'];
  const out: LandingLocale[] = [];
  for (const x of items) {
    if (!isLandingLocale(x)) {
      throw new Error(
        `Invalid configuration: LANDING_LOCALES item "${x}" is not one of ${LANDING_LOCALE_VALUES.join(',')}`,
      );
    }
    if (!out.includes(x)) out.push(x);
  }
  return out;
}

export function publicSiteOptionsFrom(env: NodeJS.ProcessEnv): PublicSiteOptions {
  const landing = (env.LANDING_BASE_URL ?? '').trim();
  let landingOrigin: string | null = null;
  if (landing) {
    try {
      landingOrigin = new URL(landing).origin;
    } catch {
      throw new Error('Invalid configuration: LANDING_BASE_URL must be an http(s) URL');
    }
    const strict = env.APP_ENV === 'staging' || env.APP_ENV === 'production';
    if (strict && !landingOrigin.startsWith('https://')) {
      throw new Error('Invalid configuration: LANDING_BASE_URL must use https outside dev/test');
    }
  }
  const key = (env.PUBLIC_FORM_SIGNING_KEY ?? '').trim();
  if (key && key.length < 32) {
    throw new Error(
      'Invalid configuration: PUBLIC_FORM_SIGNING_KEY must be at least 32 characters',
    );
  }
  const ipKey = (env.LOG_IP_HMAC_KEY ?? '').trim();
  return {
    landingOrigin,
    signingKey: key || null,
    // dev/test without the key still never stores a clear IP: a fixed local key keeps the buckets apart.
    ipHmacKey: ipKey || 'dev-only-ip-hmac-key-not-for-production',
    landingLocales: landingLocalesFrom(env.LANDING_LOCALES),
  };
}
