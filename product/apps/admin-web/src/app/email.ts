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
 * Resend rules of `sendWithOneKey` (ARC FB-R4-ARC-FE-31-03). Mutable only so tests can shorten the wait.
 * - `networkRetries`: a dropped connection → resend at once with the same key and body.
 * - `inProgressRetries` / `inProgressDelayMs`: `409 IDEMPOTENCY_IN_PROGRESS` (the first request is still
 *   running server side) → wait (`Retry-After` when given, capped at 10 s) and resend with the same key.
 */
export const RESEND = { networkRetries: 1, inProgressRetries: 2, inProgressDelayMs: 1500 };

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * One Save = one Idempotency-Key (OpenAPI 0.3.10 `setMyEmail`). A TOTP code works once, so the SAME request
 * (same key, same body) is resent: once at once when the connection drops, and up to `RESEND.inProgressRetries`
 * times after a short wait while the server answers `409 IDEMPOTENCY_IN_PROGRESS` (the first one is still
 * running). Once it is done the server answers it again (`Idempotent-Replayed`) instead of `401` for a spent
 * code. Any other answer ends it; the next Save gets a new key. The caller reloads `Me` when it still fails.
 */
export async function sendWithOneKey<R>(send: (idempotencyKey: string) => Promise<R>): Promise<R> {
  const key = newIdempotencyKey();
  let network = 0;
  let inProgress = 0;
  for (;;) {
    try {
      return await send(key);
    } catch (err) {
      if (!isApiError(err)) throw err;
      if (err.isNetwork && network < RESEND.networkRetries) {
        network += 1;
        continue;
      }
      if (err.code === 'IDEMPOTENCY_IN_PROGRESS' && inProgress < RESEND.inProgressRetries) {
        inProgress += 1;
        const s = err.retryAfterSeconds;
        await wait(
          s === undefined ? RESEND.inProgressDelayMs : Math.min(10, Math.max(0, s)) * 1000,
        );
        continue;
      }
      throw err;
    }
  }
}
