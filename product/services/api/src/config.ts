/**
 * Startup configuration check for api and worker (SEC FB-R1-SEC-OPS-09, SR-SECR-05, SR-KEY-03/08).
 * A wrong configuration must stop the process. Error messages name the variable, never its value.
 */
import { readFileSync } from 'node:fs';
import { isIP } from 'node:net';
import { findUnsafeIntegrationConfig } from '@ottimo/integrations/common';

export const APP_ENVS = ['dev', 'test', 'staging', 'production'] as const;
export type AppEnv = (typeof APP_ENVS)[number];

/**
 * false = trust no proxy; string[] = trusted proxy IPs/CIDRs.
 * Hop counts are rejected: Fastify >= 5.12 ignores them (cannot validate the peer, GHSA-3m5p-2c4r-xxw2).
 */
export type TrustProxy = false | string[];

export interface AppConfig {
  appEnv: AppEnv;
  databaseUrl: string;
  port: number;
  logLevel: string;
  trustProxy: TrustProxy;
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
const DISTINCT_KEYS = [...REQUIRED_SECRETS, 'DATA_KEK_CURRENT'] as const;
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

export function parseTrustProxy(raw: string | undefined): TrustProxy {
  const value = (raw ?? '').trim();
  if (value === '' || value === 'false') return false;
  if (value === 'true') {
    throw new ConfigError('TRUST_PROXY=true trusts any X-Forwarded-For; set the proxy IP/CIDR');
  }
  if (/^\d+$/.test(value)) {
    throw new ConfigError('TRUST_PROXY hop counts are not supported; set the proxy IP/CIDR list');
  }
  const list = value.split(',').map((s) => s.trim());
  if (!list.every(isIpOrCidr)) {
    throw new ConfigError('TRUST_PROXY must be empty or a comma list of IP/CIDR');
  }
  return list;
}

/** Strict IP or CIDR check (node:net), so a typo fails at startup instead of trusting the wrong peer. */
function isIpOrCidr(entry: string): boolean {
  const [addr, prefix, extra] = entry.split('/');
  if (extra !== undefined || !addr) return false;
  const family = isIP(addr);
  if (family === 0) return false;
  if (prefix === undefined) return true;
  if (!/^\d{1,3}$/.test(prefix)) return false;
  return Number(prefix) <= (family === 4 ? 32 : 128);
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

  if (appEnv === 'production' && env.CLOCK_OVERRIDE) {
    throw new ConfigError('CLOCK_OVERRIDE is forbidden in production');
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

  return { appEnv, databaseUrl, port, logLevel, trustProxy: parseTrustProxy(env.TRUST_PROXY) };
}
