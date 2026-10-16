// Shared client-side checks of EP00 §0.3 (V-01…V-04). The server re-checks everything (source of truth).

/** Returns the FieldError-like code or null. */
export type Check = string | null;

export function normalizeSpaces(s: string): string {
  return s.trim().replace(/\s+/g, ' ');
}

/** V-01 full name: 1–max chars, at least one letter (any script), no digits; space - ' . allowed. */
export function checkName(raw: string, max = 120): Check {
  const s = normalizeSpaces(raw);
  if (!s) return 'REQUIRED';
  if (s.length > max) return 'TOO_LONG';
  if (/\d/.test(s) || !/\p{L}/u.test(s) || !/^[\p{L}\p{M} .'-]+$/u.test(s)) return 'NAME_INVALID';
  return null;
}

/** V-02 phone → normalised `84…` / country digits (no "+"), or an error code. */
export function normalizePhone(raw: string): { value: string } | { error: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { error: 'REQUIRED' };
  const plus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  let n: string;
  if (plus) n = digits;
  else if (digits.startsWith('0')) n = `84${digits.slice(1)}`;
  else if (digits.startsWith('84')) n = digits;
  else return { error: 'PHONE_COUNTRY_CODE_REQUIRED' };
  if (n.startsWith('84')) {
    const rest = n.slice(2);
    if ((rest.length === 9 || rest.length === 10) && !rest.startsWith('0')) return { value: n };
    return { error: 'PHONE_INVALID' };
  }
  return n.length >= 8 && n.length <= 15 ? { value: n } : { error: 'PHONE_INVALID' };
}

/** V-03 email (lower-cased, one @, dotted domain, TLD ≥ 2 letters). */
export function checkEmail(raw: string): Check {
  const s = raw.trim().toLowerCase();
  if (s.length > 254) return 'EMAIL_INVALID';
  const m = /^([^\s@]{1,64})@([^\s@]+)$/.exec(s);
  if (!m) return 'EMAIL_INVALID';
  const labels = m[2]!.split('.');
  if (labels.length < 2) return 'EMAIL_INVALID';
  if (!labels.every((l) => /^[a-z0-9-]{1,63}$/.test(l))) return 'EMAIL_INVALID';
  if (!/^[a-z]{2,}$/.test(labels[labels.length - 1]!)) return 'EMAIL_INVALID';
  return null;
}

/** V-04 tax code: 10 digits or 13 for a branch (with/without "-"). */
export function checkTaxCode(raw: string): Check {
  return /^[0-9]{10}(-?[0-9]{3})?$/.test(raw.replace(/\s/g, '')) ? null : 'TAX_CODE_INVALID';
}

export function looksLikeContact(q: string): 'phone' | 'email' | null {
  if (q.includes('@')) return 'email';
  return q.replace(/\D/g, '').length >= 8 ? 'phone' : null;
}

/** Vietnamese-insensitive compare key ("Đỗ Mai Anh" → "DO MAI ANH") – mirrors server name_search (BR-951). */
export function nameSearchKey(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();
}
