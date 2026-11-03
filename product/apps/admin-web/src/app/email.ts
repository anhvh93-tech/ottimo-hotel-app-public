import { isApiError, newIdempotencyKey, type FieldError } from '@ottimo/api-client';
import type { Args } from '@ottimo/i18n';
import { fieldErrorText } from './problem';

type T = (key: string, args?: Args) => string;

/** Anchor of the block on /security – the shell reminder links to `/security#security-email` (no address in the URL). */
export const SECURITY_EMAIL_ANCHOR = 'security-email';

/** Longest address the API keeps (RFC 5321, OpenAPI 0.3.10 `maxLength: 254`). */
export const EMAIL_MAX = 254;

/** Like the server (V-03): trim + lower case. An empty field is `''`, never `null` (removing is its own action). */
export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Client check before S2 so no TOTP code is spent on a sure refusal – deliberately as loose as the server's
 * `local@domain` rule (the server stays the judge: `EMAIL_INVALID` / `EMAIL_SHARED_MAILBOX`).
 */
export function isEmailShape(email: string): boolean {
  if (!email || email.length > EMAIL_MAX) return false;
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f]/.test(email)) return false;
  return /^[^\s@]+@[^\s@]+$/.test(email);
}

/** Same address as the one on file (case-insensitive; `null` = `null`) → nothing to send. */
export function sameEmail(a: string | null | undefined, b: string | null | undefined): boolean {
  return (a ?? null)?.toLowerCase() === (b ?? null)?.toLowerCase();
}

/** The `email` field error of a 422, if any (`EMAIL_INVALID`, `EMAIL_SHARED_MAILBOX`, `NOT_ALLOWED_FOR_SELF`). */
export function emailFieldError(err: unknown): FieldError | undefined {
  if (!isApiError(err)) return undefined;
  return err.fieldErrors.find((f) => f.field.replace(/^body\./, '') === 'email');
}

/** Sentence for an email field error: our own wording for the format, the shared table for the rest. */
export function emailErrorText(t: T, fe: FieldError): string {
  return fe.code === 'EMAIL_INVALID' ? t('secmail.invalid') : fieldErrorText(t, fe);
}

/**
 * One Save = one Idempotency-Key (OpenAPI 0.3.10 `setMyEmail`). A TOTP code works once, so when the
 * connection drops the SAME request (same key, same body) is sent once more: if the first one was saved,
 * the server answers it again (`Idempotent-Replayed`) instead of `401` for a spent code. Any answer from
 * the server ends it; the next Save gets a new key.
 */
export async function sendWithOneKey<R>(send: (idempotencyKey: string) => Promise<R>): Promise<R> {
  const key = newIdempotencyKey();
  try {
    return await send(key);
  } catch (err) {
    if (isApiError(err) && err.isNetwork) return send(key);
    throw err;
  }
}
