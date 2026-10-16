/**
 * Shared input checks of BA EP00 0.3 used by many modules (server side – the client dialog never protects data,
 * US-135 "Server không dựa vào hộp để bảo vệ dữ liệu").
 *
 * - V-08 reason: trim, length per operation (default 3–500) → 422 VALIDATION_FAILED errors[{code REASON_REQUIRED}]
 * - V-09 free text: 13–19 digits (spaces/dashes allowed between) passing Luhn → 422 CARD_NUMBER_DETECTED (R-PAY-07)
 * - dryRun flag (OpenAPI "dryRun"): computes consequences without writing – used by irreversible actions
 *   to show the confirmation dialog content (US-135 AC1).
 */
import { type FieldError, problem } from './problem';

export interface ReasonOptions {
  min?: number;
  max?: number;
}

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

/** True when `text` contains something that looks like a payment card number (V-09). */
export function containsCardNumber(text: string): boolean {
  // Same rule as platform/public/validation.ts (BE-B): any 13–19 digit window (spaces/dashes allowed
  // between digits) that passes Luhn. Both must stay identical until one re-exports the other.
  const candidates = text.match(/\d(?:[ -]?\d){12,18}/g) ?? [];
  for (const c of candidates) {
    const digits = c.replace(/[ -]/g, '');
    for (let len = 13; len <= Math.min(19, digits.length); len++) {
      for (let start = 0; start + len <= digits.length; start++) {
        if (luhnValid(digits.slice(start, start + len))) return true;
      }
    }
  }
  return false;
}

/** V-09: throws 422 CARD_NUMBER_DETECTED (errors[] points at the field). */
export function assertNoCardNumber(field: string, text: string | null | undefined): void {
  if (text && containsCardNumber(text)) {
    throw problem('CARD_NUMBER_DETECTED', {
      errors: [{ field, code: 'CARD_NUMBER_DETECTED' }],
    });
  }
}

/**
 * V-08 + V-09 for a mandatory reason. Returns the trimmed value.
 * Missing/short → 422 VALIDATION_FAILED with errors[{field, code: REASON_REQUIRED}]; too long → TOO_LONG.
 */
export function requireReason(field: string, value: unknown, opts: ReasonOptions = {}): string {
  const min = opts.min ?? 3;
  const max = opts.max ?? 500;
  const text = typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
  const errors: FieldError[] = [];
  if (text.length < min) errors.push({ field, code: 'REASON_REQUIRED' });
  else if (text.length > max) errors.push({ field, code: 'TOO_LONG' });
  if (errors.length > 0) throw problem('VALIDATION_FAILED', { errors });
  assertNoCardNumber(field, text);
  return text;
}

/** Optional free text (V-09 + max length). Returns trimmed text or null. */
export function optionalText(field: string, value: unknown, max: number): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') {
    throw problem('VALIDATION_FAILED', { errors: [{ field, code: 'VALIDATION_FAILED' }] });
  }
  const text = value.trim();
  if (text.length > max) {
    throw problem('VALIDATION_FAILED', { errors: [{ field, code: 'TOO_LONG' }] });
  }
  assertNoCardNumber(field, text);
  return text === '' ? null : text;
}

/** `dryRun: true` in a JSON body (computes the consequences, writes nothing, needs no Idempotency-Key). */
export function isDryRun(body: unknown): boolean {
  return !!body && typeof body === 'object' && (body as { dryRun?: unknown }).dryRun === true;
}
