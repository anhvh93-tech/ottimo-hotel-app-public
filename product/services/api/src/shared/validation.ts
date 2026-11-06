/**
 * Shared input checks of BA EP00 0.3 used by many modules (server side – the client dialog never protects data,
 * US-135 "Server không dựa vào hộp để bảo vệ dữ liệu").
 *
 * - V-08 reason: trim, length per operation (default 3–500) → 422 VALIDATION_FAILED errors[{code REASON_REQUIRED}]
 * - V-09 free text: a payment card number → 422 CARD_NUMBER_DETECTED (R-PAY-07). One rule for every module: the card
 *   half of `shared/sensitive-number.ts` OR the original rule (13–19 digits, one space/dash allowed between, Luhn)
 * - V-09 for a bank transfer REFERENCE field (C0313-25, SEC-responses 4.1 option (a); FB-R5-SEC-BE-119-01, ARC-BE-119-03):
 *   a value that STARTS with a card number, alone or followed by expiry / CVV groups → 422 CARD_NUMBER_DETECTED
 *   (`isCardNumberReference`); free text keeps the rule above
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
 * Control / invisible characters – removed from free text before it is stored, printed or audited (SEC-BE-44, A4;
 * SR-INP-05): every control character (Cc) except tab, newline and CR; every format character (Cf: bidi marks and
 * overrides, zero-width, soft hyphen, Arabic letter mark, tag characters…); every default-ignorable code point
 * (word joiner, Hangul fillers, variation selectors…) – the same "invisible" set the card / ID detector ignores
 * (shared/sensitive-number.ts) – and lone surrogates (Cs: PostgreSQL refuses them in jsonb, 22P02). Vietnamese
 * combining tone marks (Mn) are kept. FB-R5-SEC-BE-127-01 (the hand-written list missed U+2060, U+00AD, tags, U+D800…).
 */
const CONTROL_CHARS = /[^\P{Cc}\t\n\r]|[\p{Cf}\p{Default_Ignorable_Code_Point}\p{Cs}]/gu;

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

/**
 * Separators a bank transfer reference may carry: `PaymentCreate.bankReference` and `executeRefund.bankReference` both
 * take `^[A-Za-z0-9./_-]{1,64}$` (blanks trimmed by the controller), checked by the caller BEFORE this rule.
 */
const REFERENCE_SEPARATOR = /[./_-]/;
const CARD_MIN_DIGITS = 13;
const CARD_MAX_DIGITS = 19;

/**
 * C0313-25 (SEC-responses 4.1, option (a) as SEC adjusted it) + FB-R5-SEC-BE-119-01 + FB-R5-ARC-BE-119-03 – V-09 for a
 * bank transfer reference field. The groups of the value, cut at `.` `/` `_` `-`, are joined from the start; true when
 * the join reaches 13–19 characters, all digits, passing Luhn at some group boundary:
 * - the whole value (all groups) – a card number pasted as it is, with or without separators (C0313-25);
 * - a leading part of it – a card number followed by its expiry or CVV, digits or letters (`4111111111111111/1228`,
 *   `4111-1111-1111-1111-123`, `4111111111111111-EXP1228`), which "the whole value" alone let through (119-01,
 *   119-03; v1.0.4 refused them).
 * A letter spoils every boundary after it (`luhnValid` is false on a non-digit), so a code that starts with letters
 * (`FT…`) is a reference; a card behind letters (`REF4111…`, `FT-4111…`) stays the residual risk SEC accepted, and so
 * does a card glued to letters with no separator (`4111111111111111EXP1228`, SEC-on-pr-119-delta 1.1). Digits failing
 * Luhn at every boundary, or more than 19 characters before the first passing boundary, make a reference too.
 * Deliberately NOT `containsCardNumber` (every 13–19 digit window – false hits on numeric bank codes, BUG-R5-006) and
 * NOT `looksLikeCard` (it scans digit runs inside the value: the same false hits; what it adds – hidden characters,
 * full-width digits, commas – the field pattern already refuses). About 10 % of codes starting with digits are refused
 * at each boundary within 13–19 digits (way out for the guest: the last 8 characters).
 */
export function isCardNumberReference(reference: string): boolean {
  let digits = '';
  for (const group of reference.split(REFERENCE_SEPARATOR)) {
    digits += group;
    if (digits.length > CARD_MAX_DIGITS) return false;
    if (digits.length >= CARD_MIN_DIGITS && luhnValid(digits)) return true;
  }
  return false;
}

/**
 * V-09 for a reference field: throws 422 CARD_NUMBER_DETECTED (errors[] points at the field, the value is never
 * repeated, stored or logged). The caller has checked the field pattern first.
 */
export function assertNotCardNumberReference(
  field: string,
  reference: string | null | undefined,
): void {
  if (reference && isCardNumberReference(reference)) {
    throw problem('CARD_NUMBER_DETECTED', {
      errors: [{ field, code: 'CARD_NUMBER_DETECTED' }],
    });
  }
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
