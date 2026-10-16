/**
 * Identity-key normalisation (BR-951, BA V-01…V-04). Public: reservations/registration reuse it when they
 * match a booker or an OTA guest to a profile.
 */

/** V-01: trim + collapse inner whitespace (stored as typed, accents kept). */
export function normalizeName(raw: string): string {
  return raw.normalize('NFC').trim().replace(/\s+/g, ' ');
}

/** V-01 validity: at least one letter (any script), no digits, only letters/marks/space/-'. */
export function isValidName(name: string): boolean {
  return /\p{L}/u.test(name) && /^[\p{L}\p{M} .'-]+$/u.test(name);
}

/** BR-951 search key: accents removed (đ/Đ → D), upper case, single spaces. "Đỗ Mai Anh" → "DO MAI ANH". */
export function nameSearchKey(raw: string): string {
  return normalizeName(raw)
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[đĐ]/g, 'd')
    .toUpperCase();
}

export type PhoneResult =
  { ok: true; e164: string } | { ok: false; code: 'PHONE_INVALID' | 'PHONE_COUNTRY_CODE_REQUIRED' };

/**
 * V-02 / BR-951: keep digits (and a leading +). "0905 123 456" and "+84 905 123 456" → "84905123456".
 * Vietnam: after 84 → 9 digits (mobile) or 10 (landline 2xx), first digit ≠ 0. Foreign: typed with +,
 * country code ≠ 84, 8–15 digits in total (E.164). No + and not starting with 0/84 → country code required.
 */
export function normalizePhone(raw: string): PhoneResult {
  const trimmed = raw.trim();
  const plus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return { ok: false, code: 'PHONE_INVALID' };
  let e164: string;
  if (plus) e164 = digits;
  else if (digits.startsWith('0')) e164 = `84${digits.slice(1)}`;
  else if (digits.startsWith('84')) e164 = digits;
  else return { ok: false, code: 'PHONE_COUNTRY_CODE_REQUIRED' };

  if (e164.startsWith('84')) {
    const national = e164.slice(2);
    const ok =
      /^[1-9]\d{8}$/.test(national) || (/^2\d{9}$/.test(national) && national.length === 10);
    return ok ? { ok: true, e164 } : { ok: false, code: 'PHONE_INVALID' };
  }
  return /^[1-9]\d{7,14}$/.test(e164) ? { ok: true, e164 } : { ok: false, code: 'PHONE_INVALID' };
}

/** "84905123456" → "0905***456" (VN) / "+7912***789" (foreign) – GuestSummary.phoneMasked. */
export function maskPhone(e164: string): string {
  const display = e164.startsWith('84') ? `0${e164.slice(2)}` : `+${e164}`;
  if (display.length <= 7) return display;
  return `${display.slice(0, 4)}***${display.slice(-3)}`;
}

/** Stored E.164 digits → API value with "+" ("+84905123456"). */
export function phoneForApi(e164: string): string {
  return `+${e164}`;
}

/** V-03: trim + lower case; one @, local 1–64 without spaces, domain labels 1–63, TLD ≥ 2 letters. */
export function normalizeEmail(raw: string): string | null {
  const email = raw.trim().toLowerCase();
  if (email.length > 254) return null;
  const at = email.split('@');
  if (at.length !== 2) return null;
  const [local, domain] = at as [string, string];
  if (local.length < 1 || local.length > 64 || /\s/.test(local)) return null;
  const labels = domain.split('.');
  if (labels.length < 2) return null;
  if (!labels.every((l) => /^[a-z0-9-]{1,63}$/.test(l))) return null;
  if (!/^[a-z]{2,}$/.test(labels[labels.length - 1] as string)) return null;
  return email;
}

/** V-04: spaces removed; 10 digits, or 13 with an optional dash (branch). */
export function normalizeTaxCode(raw: string): string | null {
  const v = raw.replace(/\s/g, '');
  return /^[0-9]{10}(-?[0-9]{3})?$/.test(v) ? v : null;
}

/** BR-952 helper: Levenshtein distance (small strings only – names ≤ 120 chars). */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0] as number;
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j] as number;
      prev[j] = Math.min(
        (prev[j] as number) + 1,
        (prev[j - 1] as number) + 1,
        diag + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      diag = tmp;
    }
  }
  return prev[b.length] as number;
}

/**
 * BR-952: near-identical names on the normalised key, word order ignored ("WEBER DANIEL" ≈ "DANIEL WEBER").
 * Words are compared as a sorted word list (not sorted letters – BR-952), allowing small typos:
 * distance ≤ 1 for keys up to 10 characters, ≤ 2 above.
 */
export function namesLookAlike(a: string, b: string): boolean {
  const ka = a.split(' ').filter(Boolean).sort().join(' ');
  const kb = b.split(' ').filter(Boolean).sort().join(' ');
  if (!ka || !kb) return false;
  const allowed = Math.max(ka.length, kb.length) > 10 ? 2 : 1;
  return levenshtein(ka, kb) <= allowed;
}
