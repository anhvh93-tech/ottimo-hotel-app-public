/**
 * Runtime options of the identity module (built in main.ts from the environment).
 * - sessionSecret: key of the CSRF token HMAC (SESSION_SECRET; dev/test without it get a random
 *   per-process key – config.ts already refuses a missing/weak key in staging/production).
 * - adminOrigins / pwaOrigins: allowed `Origin` values (SR-SES-04, SR-HDR-04). Empty lists = Origin not
 *   checked (only allowed for APP_ENV dev/test – main.ts refuses that elsewhere).
 * - ipHmacKey: LOG_IP_HMAC_KEY for user_session.ip_hmac / audit (SR-KEY-08); empty = not recorded.
 * - appEnv: APP_ENV – staging/production refuse to start without the full common-password list (SR-AUTH-02).
 */
export const IDENTITY_OPTIONS = Symbol('IDENTITY_OPTIONS');

export interface IdentityOptions {
  sessionSecret: string;
  cookieSecurePrefix: boolean;
  adminOrigins: string[];
  pwaOrigins: string[];
  ipHmacKey: string;
  appEnv?: string;
}
