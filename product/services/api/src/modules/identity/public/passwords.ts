/**
 * Password hashing and policy (SR-AUTH-02/03, BA V-10).
 * - argon2id with the library defaults (m = 19 MiB, t = 2, p = 1 – SR-AUTH-03 minimum).
 * - Policy: 10–256 characters; must not contain the username or "ottimo"; must differ from the current
 *   password; must not be a well-known password. The full ≥ 10.000-entry offline list of SR-AUTH-02 is not
 *   in the repo yet (asked from SEC) – COMMON_PASSWORDS below is the interim list.
 */
import { hash, verify } from '@node-rs/argon2';
import type { FieldError } from '../../../shared/problem';

export const PASSWORD_MIN = 10;
export const PASSWORD_MAX = 256;

const COMMON_PASSWORDS = new Set([
  '1234567890',
  '12345678910',
  '0123456789',
  '1111111111',
  '0000000000',
  'qwertyuiop',
  'password123',
  'password1234',
  'matkhau123',
  'matkhau1234',
  'abcd123456',
  'abc1234567',
  'iloveyou123',
  '123456789a',
  'a123456789',
  'qwerty12345',
  'admin12345',
  'administrator',
  'khachsan123',
  'hotel12345',
]);

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
  const lower = password.toLowerCase();
  if (username && lower.includes(username.toLowerCase())) {
    return [{ field, code: 'PASSWORD_SAME_AS_USERNAME' }];
  }
  if (current !== undefined && password === current) return [{ field, code: 'PASSWORD_REUSED' }];
  if (lower.includes('ottimo') || COMMON_PASSWORDS.has(lower)) {
    return [{ field, code: 'PASSWORD_TOO_COMMON' }];
  }
  return [];
}
