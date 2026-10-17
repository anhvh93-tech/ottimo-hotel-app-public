/**
 * Key material of the crypto module (ADR-013 point 2, SR-KEY-03/05/07). Read ONCE at startup from the
 * resolved environment (bootstrap → resolveFileSecrets: `X_FILE` Docker secrets become `X`):
 *
 * - DATA_KEK_CURRENT  – KEK in force, 32 bytes base64 (config.ts already refuses a missing/short one in
 *                       staging/production);
 * - DATA_KEK_VERSION  – its version number (integer ≥ 1, default 1);
 * - DATA_KEK_<n>      – older KEK versions kept during a rotation (SR-KEY-05) so old DEKs still unwrap;
 * - ID_HASH_KEY       – HMAC-SHA256 key for document numbers only (blind index, SR-KEY-07).
 *
 * dev/test without values: a random per-process key (data written by that process is unreadable after a
 * restart – acceptable for local work, never for staging/production, which config.ts refuses); the process
 * logs one `warn` line naming the missing variables (S4-46).
 * Nothing here is ever logged or returned; errors name the variable, never the value.
 */
import { randomBytes } from 'node:crypto';

export class KeyringError extends Error {
  constructor(message: string) {
    super(`Invalid crypto configuration: ${message}`);
    this.name = 'KeyringError';
  }
}

export interface Keyring {
  readonly currentVersion: number;
  /** KEK of a version; throws when that version is not loaded. */
  kek(version: number): Buffer;
  readonly versions: readonly number[];
  readonly idHashKey: Buffer;
  /** True when the keys were generated for this process (dev/test without configuration). */
  readonly ephemeral: boolean;
}

const KEK_BYTES = 32;

function decodeKek(name: string, value: string): Buffer {
  const buf = Buffer.from(value.trim(), 'base64');
  if (buf.length !== KEK_BYTES) throw new KeyringError(`${name} must be 32 bytes, base64-encoded`);
  return buf;
}

/**
 * S4-46: the warning line of a dev/test process running on temporary random keys – names of the missing
 * variables only, never a value. null = all keys set (or staging/production, which refuse to start instead).
 */
export function temporaryKeyWarning(env: NodeJS.ProcessEnv): string | null {
  const appEnv = env.APP_ENV ?? 'dev';
  if (appEnv === 'staging' || appEnv === 'production') return null;
  const missing = (['DATA_KEK_CURRENT', 'ID_HASH_KEY'] as const).filter((k) => !env[k]);
  if (missing.length === 0) return null;
  return JSON.stringify({
    level: 'warn',
    msg: 'crypto: temporary random keys – documents encrypted by this process cannot be read after a restart; set the variables in product/.env (S4-46)',
    appEnv,
    missing,
  });
}

let temporaryKeysWarned = false;

export function keyringFromEnv(env: NodeJS.ProcessEnv): Keyring {
  const appEnv = env.APP_ENV ?? 'dev';
  const strict = appEnv === 'staging' || appEnv === 'production';
  const raw = env.DATA_KEK_CURRENT ?? '';
  const idRaw = env.ID_HASH_KEY ?? '';
  if (strict && (raw === '' || idRaw === '')) {
    throw new KeyringError(`DATA_KEK_CURRENT and ID_HASH_KEY are required when APP_ENV=${appEnv}`);
  }
  const versionRaw = env.DATA_KEK_VERSION ?? '1';
  const currentVersion = Number(versionRaw);
  if (!Number.isInteger(currentVersion) || currentVersion < 1 || currentVersion > 65_535) {
    throw new KeyringError('DATA_KEK_VERSION must be an integer 1…65535');
  }
  const keks = new Map<number, Buffer>();
  const ephemeral = raw === '';
  keks.set(currentVersion, ephemeral ? randomBytes(KEK_BYTES) : decodeKek('DATA_KEK_CURRENT', raw));
  for (const [name, value] of Object.entries(env)) {
    const m = /^DATA_KEK_(\d{1,5})$/.exec(name);
    if (!m || !value) continue;
    const v = Number(m[1]);
    if (v === currentVersion) {
      throw new KeyringError(`${name} duplicates DATA_KEK_CURRENT (version ${v})`);
    }
    keks.set(v, decodeKek(name, value));
  }
  if (idRaw !== '' && idRaw.length < 32) throw new KeyringError('ID_HASH_KEY is too short');
  const idHashKey = idRaw === '' ? randomBytes(32) : Buffer.from(idRaw, 'utf8');
  const warning = temporaryKeyWarning(env);
  // Once per process (api and worker each say it at startup); not in the unit/integration test runner.
  if (warning && !temporaryKeysWarned && !process.env.VITEST) {
    temporaryKeysWarned = true;
    console.warn(warning);
  }
  return staticKeyring(currentVersion, keks, idHashKey, ephemeral || idRaw === '');
}

/** Keyring from explicit material (tests, rotation drills). */
export function staticKeyring(
  currentVersion: number,
  keks: ReadonlyMap<number, Buffer>,
  idHashKey: Buffer,
  ephemeral = false,
): Keyring {
  if (!keks.has(currentVersion)) throw new KeyringError('current KEK version is not loaded');
  for (const k of keks.values()) {
    if (k.length !== KEK_BYTES) throw new KeyringError('every KEK must be 32 bytes');
  }
  const copy = new Map(keks);
  return {
    currentVersion,
    versions: [...copy.keys()].sort((a, b) => a - b),
    idHashKey: Buffer.from(idHashKey),
    ephemeral,
    kek(version: number): Buffer {
      const k = copy.get(version);
      if (!k) throw new KeyringError(`KEK version ${version} is not loaded`);
      return k;
    },
  };
}

/** Fresh random keyring (tests). */
export function randomKeyring(version = 1): Keyring {
  return staticKeyring(version, new Map([[version, randomBytes(KEK_BYTES)]]), randomBytes(32));
}
