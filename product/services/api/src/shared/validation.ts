/**
 * Shared input checks of BA EP00 0.3 used by many modules (server side – the client dialog never protects data,
 * US-135 "Server không dựa vào hộp để bảo vệ dữ liệu").
 *
 * - V-08 reason: trim, length per operation (default 3–500) → 422 VALIDATION_FAILED errors[{code REASON_REQUIRED}]
 * - V-09 free text: a payment card number → 422 CARD_NUMBER_DETECTED (R-PAY-07). One rule for every module: the card
 *   half of `shared/sensitive-number.ts` OR the original rule (13–19 digits, one space/dash allowed between, Luhn)
 * - dryRun flag (OpenAPI "dryRun"): computes consequences without writing – used by irreversible actions
 *   to show the confirmation dialog content (US-135 AC1).
 */
import { type FieldError, problem } from './problem';
import { luhnValid } from './redact';
import { looksLikeCard } from './sensitive-number';

export interface ReasonOptions {
  min?: number;
  max?: number;
}

export { luhnValid };

/**
 * Control / invisible formatting characters (C0 except tab/newline/CR, DEL, C1, zero-width, bidi overrides) –
 * removed from free text before it is stored, printed or audited (SEC-BE-44, A4).
 */
const CONTROL_CHARS =
  // eslint-disable-next-line no-control-regex -- matching control characters is the point here
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2066-\u2069]/g;

export function stripControlChars(text: string): string {
  return text.replace(CONTROL_CHARS, '');
}

/**
 * True when `text` contains something that looks like a payment card number (V-09) – the ONE card rule of the API
 * (ARC FB-R4-ARC-BE-PR24PM-01). The card half of the shared detector (`looksLikeCard`: hidden characters, full-width
 * digits, `_` `/` `,` joins, digit-by-digit cards – BUG-R3-058) OR the original rule below, so no text caught before
 * is let through (e.g. `4111 1111 11-11 1111`, a known miss of the detector – SEC-on-v104-be-d 2.1). The ID half is
 * NOT applied here (registration has legitimate document-number fields; guest-portal only after SEC – PR24PM-01 (3)).
 * The single copy: platform/public/validation.ts re-exports this module (FB-R2-ARC-BE-18).
 */
export function containsCardNumber(text: string): boolean {
  return containsCardNumberOriginalRule(text) || looksLikeCard(text);
}

/** The V-09 rule as it was before PR24PM-01: any 13–19 digit window (one space/dash allowed between) passing Luhn. */
function containsCardNumberOriginalRule(text: string): boolean {
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
  const text =
    typeof value === 'string' ? stripControlChars(value).trim().replace(/\s+/g, ' ') : '';
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
  const text = stripControlChars(value).trim();
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
