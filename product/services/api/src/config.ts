/**
 * Startup configuration check for api and worker (SEC FB-R1-SEC-OPS-09, SR-SECR-05, SR-KEY-03/08).
 * A wrong configuration must stop the process. Error messages name the variable, never its value.
 */
import { readFileSync } from 'node:fs';
import { isIP } from 'node:net';
import { findUnsafeIntegrationConfig } from '@ottimo/integrations/common';
import { type AllowedOrigins, originOf } from './shared/http/csrf';

export const APP_ENVS = ['dev', 'test', 'staging', 'production'] as const;
export type AppEnv = (typeof APP_ENVS)[number];

/**
 * false = trust no proxy; string[] = trusted proxy IPs/CIDRs.
 * Hop counts are rejected: Fastify >= 5.12 ignores them (cannot validate the peer, GHSA-3m5p-2c4r-xxw2).
 */
export type TrustProxy = false | string[];

export const CLOCK_MODES = ['system', 'mutable'] as const;
export type ClockModeSetting = (typeof CLOCK_MODES)[number];

export interface AppConfig {
  appEnv: AppEnv;
  databaseUrl: string;
  port: number;
  logLevel: string;
  trustProxy: TrustProxy;
  /** system = real time; mutable = shared fake clock (dev_clock) – never in production (ADR-008). */
  clockMode: ClockModeSetting;
  /**
   * Test-only endpoints (openapi.test.yaml): loaded only when INCLUDE_TEST_SUPPORT=1, APP_ENV is not
   * production and the folder exists in the build (Dockerfile.api removes it by default).
   */
  testSupport: { enabled: boolean; token: string };
  /** Cookie names with the __Host- prefix (needs HTTPS). Only dev/test may turn it off. */
  cookieSecurePrefix: boolean;
  /** The 3 browser origins (SR-SES-04, SR-HDR-04): Origin check for write methods, no CORS. */
  allowedOrigins: AllowedOrigins;
}

/**
 * ADMIN_BASE_URL (admin-web), STAFF_BASE_URL (staff PWA), GUEST_BASE_URL (guest-web) – architecture 17.
 * APP_BASE_URL (older .env.example name) is accepted for the admin origin when ADMIN_BASE_URL is unset.
 * staging/production: all three required, https only. dev/test: optional; an empty list is not checked.
 */
export function parseAllowedOrigins(env: NodeJS.ProcessEnv, appEnv: AppEnv): AllowedOrigins {
  const strict = appEnv === 'staging' || appEnv === 'production';
  const read = (name: string, value: string | undefined): string[] => {
    const v = (value ?? '').trim();
    if (v === '') {
      if (strict) throw new ConfigError(`${name} is required when APP_ENV=${appEnv}`);
      return [];
    }
    let origin: string;
    try {
      origin = originOf(v);
    } catch {
      throw new ConfigError(`${name} must be an http(s) URL`);
    }
    if (strict && !origin.startsWith('https://')) {
      throw new ConfigError(`${name} must use https when APP_ENV=${appEnv}`);
    }
    return [origin];
  };
  const admin = read('ADMIN_BASE_URL', env.ADMIN_BASE_URL || env.APP_BASE_URL);
  const staff = read('STAFF_BASE_URL', env.STAFF_BASE_URL);
  const guest = read('GUEST_BASE_URL', env.GUEST_BASE_URL);
  return { staff: [...new Set([...admin, ...staff])], guest, admin, staffPwa: staff };
}

export class ConfigError extends Error {
  constructor(message: string) {
    super(`Invalid configuration: ${message}`);
    this.name = 'ConfigError';
  }
}

/**
 * Keys that must be at least 32 characters when set, and must be set outside dev/test.
 * One key per purpose (ADR-013 point 5, BUG-R1-SEC-07): rotating one key must not affect another.
 * - SESSION_SECRET: staff session cookie signing
 * - ID_HASH_KEY: HMAC of ID-document numbers (returning-guest matching) only
 * - LOG_IP_HMAC_KEY: HMAC of client IPs in logs/audit
 * - GUEST_CODE_SIGNING_KEY: HMAC of guest verification codes (guest_verification_code.code_hash)
 */
export const REQUIRED_SECRETS = [
  'SESSION_SECRET',
  'ID_HASH_KEY',
  'LOG_IP_HMAC_KEY',
  'GUEST_CODE_SIGNING_KEY',
] as const;
/** Every key material that must never be shared between purposes (includes the KEK). */
const DISTINCT_KEYS = [...REQUIRED_SECRETS, 'DATA_KEK_CURRENT', 'TEST_SUPPORT_TOKEN'] as const;
const LOG_LEVELS = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'];

/**
 * Docker/Compose secrets support: for every `X_FILE` variable, read the file into `X`
 * (file mounted 0400, so the value is not visible in `docker inspect`). FB-R1-SEC-OPS-10.
 */
export function resolveFileSecrets(
  env: NodeJS.ProcessEnv,
  readFile: (path: string) => string = (p) => readFileSync(p, 'utf8'),
): NodeJS.ProcessEnv {
  const out: NodeJS.ProcessEnv = { ...env };
  for (const [key, path] of Object.entries(env)) {
    if (!key.endsWith('_FILE') || !path) continue;
    const name = key.slice(0, -'_FILE'.length);
    if (env[name]) throw new ConfigError(`${name} and ${key} are both set – use only one`);
    out[name] = readFile(path).trim();
  }
  return out;
}

/** Narrowest accepted prefixes: anything wider is "trust (almost) everyone" (FB-R2-SEC-BE-01). */
const MIN_PREFIX = { 4: 8, 6: 16 } as const;

export function parseTrustProxy(raw: string | undefined, appEnv?: AppEnv): TrustProxy {
  const value = (raw ?? '').trim();
  if (value === '' || value === 'false') return false;
  if (value === 'true') {
    throw new ConfigError('TRUST_PROXY=true trusts any X-Forwarded-For; set the proxy IP/CIDR');
  }
  if (/^\d+$/.test(value)) {
    throw new ConfigError('TRUST_PROXY hop counts are not supported; set the proxy IP/CIDR list');
  }
  const list = value.split(',').map((s) => s.trim());
  const internalOnly = appEnv === 'staging' || appEnv === 'production';
  for (const entry of list) {
    const parsed = parseIpOrCidr(entry);
    if (!parsed) throw new ConfigError('TRUST_PROXY must be empty or a comma list of IP/CIDR');
    if (parsed.prefix < MIN_PREFIX[parsed.family]) {
      throw new ConfigError(
        `TRUST_PROXY entry is too wide (IPv4 needs /${MIN_PREFIX[4]} or narrower, IPv6 /${MIN_PREFIX[6]})`,
      );
    }
    // Caddy sits in the internal Docker network (hosting-plan): staging/production accept loopback,
    // RFC 1918 and fc00::/7 only. A CDN in front needs a SEC-approved change here.
    if (internalOnly && !isInternalRange(parsed)) {
      throw new ConfigError(
        `TRUST_PROXY must list internal addresses only (loopback, RFC 1918, fc00::/7) when APP_ENV=${appEnv}`,
      );
    }
  }
  return list;
}

interface ParsedCidr {
  family: 4 | 6;
  addr: bigint;
  prefix: number;
}

/** Strict IP or CIDR parse (node:net), so a typo fails at startup instead of trusting the wrong peer. */
function parseIpOrCidr(entry: string): ParsedCidr | null {
  const [addr, prefix, extra] = entry.split('/');
  if (extra !== undefined || !addr) return null;
  const family = isIP(addr);
  if (family !== 4 && family !== 6) return null;
  const max = family === 4 ? 32 : 128;
  if (prefix !== undefined && !/^\d{1,3}$/.test(prefix)) return null;
  const bits = prefix === undefined ? max : Number(prefix);
  if (bits > max) return null;
  return { family, addr: family === 4 ? ipv4ToBigint(addr) : ipv6ToBigint(addr), prefix: bits };
}

function ipv4ToBigint(a: string): bigint {
  return a.split('.').reduce((acc, octet) => (acc << 8n) + BigInt(Number(octet)), 0n);
}

function ipv6ToBigint(a: string): bigint {
  let text = a;
  // IPv4-embedded tail (::ffff:10.0.0.1) → two hextets.
  const v4 = /(\d+\.\d+\.\d+\.\d+)$/.exec(text);
  if (v4?.[1]) {
    const n = ipv4ToBigint(v4[1]);
    text = text.replace(v4[1], `${(n >> 16n).toString(16)}:${(n & 0xffffn).toString(16)}`);
  }
  const [head = '', tail] = text.split('::');
  const h = head ? head.split(':') : [];
  const t = tail !== undefined && tail !== '' ? tail.split(':') : [];
  const fill = tail !== undefined ? 8 - h.length - t.length : 0;
  const groups = [...h, ...Array<string>(fill).fill('0'), ...t];
  return groups.reduce((acc, g) => (acc << 16n) + BigInt(parseInt(g || '0', 16)), 0n);
}

const INTERNAL_RANGES: ParsedCidr[] = [
  { family: 4, addr: ipv4ToBigint('127.0.0.0'), prefix: 8 },
  { family: 4, addr: ipv4ToBigint('10.0.0.0'), prefix: 8 },
  { family: 4, addr: ipv4ToBigint('172.16.0.0'), prefix: 12 },
  { family: 4, addr: ipv4ToBigint('192.168.0.0'), prefix: 16 },
  { family: 6, addr: ipv6ToBigint('::1'), prefix: 128 },
  { family: 6, addr: ipv6ToBigint('fc00::'), prefix: 7 },
];

/** True when the whole CIDR lies inside one internal range (not just overlaps it). */
function isInternalRange(c: ParsedCidr): boolean {
  const width = c.family === 4 ? 32 : 128;
  return INTERNAL_RANGES.some((r) => {
    if (r.family !== c.family || c.prefix < r.prefix) return false;
    const shift = BigInt(width - r.prefix);
    return c.addr >> shift === r.addr >> shift;
  });
}

export function loadConfig(env: NodeJS.ProcessEnv): AppConfig {
  const appEnv = env.APP_ENV as AppEnv | undefined;
  if (!appEnv || !APP_ENVS.includes(appEnv)) {
    throw new ConfigError(`APP_ENV must be one of ${APP_ENVS.join(', ')}`);
  }
  const strict = appEnv === 'staging' || appEnv === 'production';

  const databaseUrl = env.DATABASE_URL ?? '';
  if (!databaseUrl) throw new ConfigError('DATABASE_URL is required (see product/.env.example)');

  for (const key of REQUIRED_SECRETS) {
    const v = env[key] ?? '';
    if (v === '' && strict) throw new ConfigError(`${key} is required when APP_ENV=${appEnv}`);
    if (v !== '' && v.length < 32) throw new ConfigError(`${key} must be at least 32 characters`);
  }

  // One key per purpose (ADR-013 point 5): reusing a value across purposes defeats separate rotation.
  // TEST_SUPPORT_TOKEN is included: the test token must never double as a real key.
  const seen = new Map<string, string>();
  for (const key of DISTINCT_KEYS) {
    const v = env[key] ?? '';
    if (v === '') continue;
    const other = seen.get(v);
    if (other) throw new ConfigError(`${key} must differ from ${other} (one key per purpose)`);
    seen.set(v, key);
  }

  const kek = env.DATA_KEK_CURRENT ?? '';
  if (kek === '' && strict) {
    throw new ConfigError(`DATA_KEK_CURRENT is required when APP_ENV=${appEnv}`);
  }
  if (kek !== '' && Buffer.from(kek, 'base64').length !== 32) {
    throw new ConfigError('DATA_KEK_CURRENT must be 32 bytes, base64-encoded');
  }

  // CLOCK_OVERRIDE (frozen clock read at startup) was replaced by CLOCK_MODE=mutable + the shared
  // dev_clock (ADR-008, architecture 13): refuse it everywhere so nobody believes it still works.
  if (env.CLOCK_OVERRIDE) {
    throw new ConfigError(
      'CLOCK_OVERRIDE is no longer supported – use CLOCK_MODE=mutable and the test-support clock endpoint',
    );
  }
  const clockMode = (env.CLOCK_MODE || 'system') as ClockModeSetting;
  if (!CLOCK_MODES.includes(clockMode)) {
    throw new ConfigError(`CLOCK_MODE must be one of ${CLOCK_MODES.join(', ')}`);
  }
  if (appEnv === 'production' && clockMode !== 'system') {
    throw new ConfigError('CLOCK_MODE must be system in production');
  }

  const includeTestSupport = env.INCLUDE_TEST_SUPPORT ?? '';
  if (!['', '0', '1'].includes(includeTestSupport)) {
    throw new ConfigError('INCLUDE_TEST_SUPPORT must be 0 or 1');
  }
  const testSupportEnabled = includeTestSupport === '1';
  if (testSupportEnabled && appEnv === 'production') {
    throw new ConfigError('INCLUDE_TEST_SUPPORT=1 is forbidden in production');
  }
  const testSupportToken = env.TEST_SUPPORT_TOKEN ?? '';
  if (testSupportEnabled && testSupportToken.length < 32) {
    throw new ConfigError(
      'TEST_SUPPORT_TOKEN (>= 32 characters) is required when INCLUDE_TEST_SUPPORT=1',
    );
  }
  if (appEnv === 'production' && testSupportToken !== '') {
    throw new ConfigError('TEST_SUPPORT_TOKEN must not be set in production');
  }

  const cookiePrefixRaw = env.COOKIE_SECURE_PREFIX ?? 'true';
  if (!['true', 'false'].includes(cookiePrefixRaw)) {
    throw new ConfigError('COOKIE_SECURE_PREFIX must be true or false');
  }
  if (cookiePrefixRaw === 'false' && strict) {
    throw new ConfigError(`COOKIE_SECURE_PREFIX=false is only allowed in dev/test`);
  }
  // Integration adapters (mock/sandbox in production, PAYMENT_METHODS_ENABLED, *_MOCK_SCENARIO,
  // allowed selector values): one shared rule set owned by INT – integrations README 1.3, W9.
  const unsafe = findUnsafeIntegrationConfig(env, appEnv);
  if (unsafe.length > 0) throw new ConfigError(unsafe.join('; '));

  const port = Number(env.PORT ?? 3000);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new ConfigError('PORT is invalid');
  }

  const logLevel = env.LOG_LEVEL ?? 'info';
  if (!LOG_LEVELS.includes(logLevel)) throw new ConfigError('LOG_LEVEL is invalid');

  const trustProxy = parseTrustProxy(env.TRUST_PROXY, appEnv);
  // Behind Caddy an empty TRUST_PROXY makes every client share Caddy's IP, so per-IP rate limits and
  // lockouts would merge everyone into one bucket (FB-R2-SEC-BE-02).
  if (strict && trustProxy === false) {
    throw new ConfigError(
      `TRUST_PROXY is required when APP_ENV=${appEnv}; set the reverse proxy IP/CIDR`,
    );
  }

  return {
    appEnv,
    databaseUrl,
    port,
    logLevel,
    trustProxy,
    clockMode,
    testSupport: { enabled: testSupportEnabled, token: testSupportToken },
    cookieSecurePrefix: cookiePrefixRaw === 'true',
    allowedOrigins: parseAllowedOrigins(env, appEnv),
  };
}
