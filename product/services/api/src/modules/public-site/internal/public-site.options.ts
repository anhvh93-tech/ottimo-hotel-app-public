/**
 * Runtime options of the public-site module (environment – never a business parameter):
 * - LANDING_BASE_URL → the ONLY Origin accepted on the public form calls (`x-allowed-origins: [landing]`);
 *   unset → the public form answers 404 (nothing to accept from);
 * - PUBLIC_FORM_SIGNING_KEY (from PUBLIC_FORM_SIGNING_KEY_FILE – bootstrap reads X_FILE secrets), ≥ 32 chars,
 *   its own key (ADR-013 point 5) – unset → no form token (404) and the switch cannot be turned on
 *   (422 PUBLIC_FORM_NOT_READY);
 * - LOG_IP_HMAC_KEY → HMAC of the client IP for the rate-limit buckets and `ip_hmac` (never the clear IP).
 */
export const PUBLIC_SITE_OPTIONS = Symbol('PUBLIC_SITE_OPTIONS');

export interface PublicSiteOptions {
  landingOrigin: string | null;
  signingKey: string | null;
  ipHmacKey: string;
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
  };
}
