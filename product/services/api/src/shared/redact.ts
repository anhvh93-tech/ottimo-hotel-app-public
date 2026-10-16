/**
 * Free-text redaction for log lines (SR-LOG-04/05, FB-R2-SEC-BE-13). Pino `redact` only works on keys;
 * error messages (PostgreSQL, JSON parser, zod…) can quote input values, so every free-text string that goes
 * to a log passes through `redactText()` first. Patterns: payment card numbers (13–19 digits passing Luhn),
 * 12-digit CCCD / 9-digit CMND, passport numbers, MRZ lines, e-mail addresses, Vietnamese phone numbers.
 */

/** Luhn check on a digit string. */
export function luhnValid(digits: string): boolean {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (d < 0 || d > 9) return false;
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

function hasLuhnWindow(digits: string): boolean {
  for (let len = 13; len <= Math.min(19, digits.length); len++) {
    for (let start = 0; start + len <= digits.length; start++) {
      if (luhnValid(digits.slice(start, start + len))) return true;
    }
  }
  return false;
}

const MRZ = /[A-Z0-9<]{2,}<{2,}[A-Z0-9<]*/g;
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const CARD = /\d(?:[ -]?\d){12,18}/g;
const PHONE_VN = /(?:\+?84|\b0)(?:[ .-]?\d){9,10}\b/g;
const ID_NUMBER = /\b(?:\d{12}|\d{9})\b/g;
const PASSPORT = /\b[A-Z]{1,2}\d{6,8}\b/g;

/** Replace personal/payment data in a free-text string (never throws). */
export function redactText(text: string): string {
  return text
    .replace(MRZ, '[mrz]')
    .replace(EMAIL, '[email]')
    .replace(CARD, (m) => (hasLuhnWindow(m.replace(/[ -]/g, '')) ? '[card]' : m))
    .replace(PHONE_VN, '[phone]')
    .replace(ID_NUMBER, '[id]')
    .replace(PASSPORT, '[passport]');
}

/**
 * Loggable description of an unexpected error: PostgreSQL errors keep only code/constraint/routine (their
 * message and detail quote row values); other errors keep class + redacted message.
 */
export function describeError(err: unknown): string {
  if (err && typeof err === 'object' && 'code' in err && 'severity' in err) {
    const pg = err as { code?: unknown; constraint?: unknown; routine?: unknown };
    return `PostgresError code=${String(pg.code)} constraint=${String(pg.constraint ?? '-')} routine=${String(pg.routine ?? '-')}`;
  }
  if (err instanceof Error) return `${err.name}: ${redactText(err.message)}`;
  return typeof err;
}
