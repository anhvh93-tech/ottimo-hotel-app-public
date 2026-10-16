/**
 * Password hashing and policy (SR-AUTH-02/03, BA V-10).
 * - argon2id with the library defaults (m = 19 MiB, t = 2, p = 1 – SR-AUTH-03 minimum).
 * - Policy: 10–256 characters; must not contain the username or "ottimo"; must differ from the current
 *   password; must not be a well-known password (PASSWORD_TOO_COMMON).
 * - Well-known passwords (SEC s1-decisions mục 2, FB-R2-SEC-BE-08): offline file common-passwords.txt next
 *   to this module (built by scripts/build-common-passwords.mjs; sources and licence in
 *   common-passwords.SOURCE.md), loaded once into a Set. Candidate = NFKC + lower case + trim; refused when
 *   (a) it is in the list, (b) without its trailing digits/symbols it is in the list or is one of the
 *   source-B base words (`Dalat123456!` → `dalat`), (c) its letters alone (digits/symbols removed
 *   everywhere) are empty or a base word (`12345678abc` → `abc`, `1234567890`), (d) it contains the
 *   username or "ottimo".
 * - Staging/production refuse to start when the file is missing or has < 10.000 entries
 *   (assertCommonPasswordList, called by IdentityModule at start-up).
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { hash, verify } from '@node-rs/argon2';
import type { FieldError } from '../../../shared/problem';

export const PASSWORD_MIN = 10;
export const PASSWORD_MAX = 256;
/** SR-AUTH-02: minimum size of the offline list outside dev/test. */
export const COMMON_PASSWORDS_MIN = 10_000;

const LIST_FILE = join(__dirname, 'common-passwords.txt');
const BASES_FILE = join(__dirname, 'common-password-bases.json');

export function normalizePasswordCandidate(s: string): string {
  return s.normalize('NFKC').toLowerCase().trim();
}

function loadList(): Set<string> {
  if (!existsSync(LIST_FILE)) return new Set();
  const out = new Set<string>();
  for (const line of readFileSync(LIST_FILE, 'utf8').split('\n')) {
    const n = normalizePasswordCandidate(line);
    if (n) out.add(n);
  }
  return out;
}

const COMMON_PASSWORDS: ReadonlySet<string> = loadList();
const BASE_WORDS: ReadonlySet<string> = new Set(
  existsSync(BASES_FILE)
    ? (JSON.parse(readFileSync(BASES_FILE, 'utf8')) as { words: string[] }).words.map(
        normalizePasswordCandidate,
      )
    : [],
);

export function commonPasswordCount(): number {
  return COMMON_PASSWORDS.size;
}

/** Start-up check (SR-AUTH-02): staging/production stop when the offline list is missing or too small. */
export function assertCommonPasswordList(appEnv: string | undefined): void {
  if (appEnv !== 'staging' && appEnv !== 'production') return;
  if (COMMON_PASSWORDS.size < COMMON_PASSWORDS_MIN) {
    throw new Error(
      `common-passwords.txt has ${COMMON_PASSWORDS.size} entries (< ${COMMON_PASSWORDS_MIN}) – ` +
        'refusing to start (SR-AUTH-02); rebuild it with scripts/build-common-passwords.mjs --seclists',
    );
  }
}

/** True when the password is a well-known one (rules a, b above). */
export function isCommonPassword(password: string): boolean {
  const n = normalizePasswordCandidate(password);
  if (COMMON_PASSWORDS.has(n)) return true;
  const stripped = n.replace(/[^\p{L}]+$/u, '');
  if (stripped !== n && (COMMON_PASSWORDS.has(stripped) || BASE_WORDS.has(stripped))) return true;
  const letters = n.replace(/[^\p{L}]/gu, '');
  return letters === '' || BASE_WORDS.has(letters);
}

export function hashPassword(plain: string): Promise<string> {
  return hash(plain);
}

/** Constant-ish time: a missing/invalid hash still runs one argon2 verification (no user enumeration). */
const DUMMY_HASH =
  '$argon2id$v=19$m=19456,t=2,p=1$daba2KQmUiKigIQ3utyViw$82/j0jw9/OsMdTwswwNLHKT9rSEG3eOMTzBuenv+FPA';

export async function verifyPassword(
  hashed: string | null | undefined,
  plain: string,
): Promise<boolean> {
  const target = hashed && hashed.startsWith('$argon2') ? hashed : DUMMY_HASH;
  try {
    const ok = await verify(target, plain);
    return ok && target !== DUMMY_HASH;
  } catch {
    return false;
  }
}

/** V-10 checks of a new password → field errors (empty = accepted). `current` = plain current password. */
export function passwordPolicyErrors(
  field: string,
  password: string,
  username: string,
  current?: string,
): FieldError[] {
  if (password.length < PASSWORD_MIN) return [{ field, code: 'PASSWORD_TOO_SHORT' }];
  if (password.length > PASSWORD_MAX) return [{ field, code: 'TOO_LONG' }];
  const lower = normalizePasswordCandidate(password);
  if (username && lower.includes(username.toLowerCase())) {
    return [{ field, code: 'PASSWORD_SAME_AS_USERNAME' }];
  }
  if (current !== undefined && password === current) return [{ field, code: 'PASSWORD_REUSED' }];
  if (lower.includes('ottimo') || isCommonPassword(password)) {
    return [{ field, code: 'PASSWORD_TOO_COMMON' }];
  }
  return [];
}
