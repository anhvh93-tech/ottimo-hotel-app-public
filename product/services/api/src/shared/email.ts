/**
 * Staff security e-mail helpers (R4 v1.0.3, BUG-R3-032, OpenAPI 0.3.10 `setMyEmail` / `updateUser.email`).
 * - `normalizeSecurityEmail` – THE rule for a staff security address (SEC FB-R4-SEC-ARC-EM-05): after trim + lower
 *   case, printable ASCII only, exactly one `@`, local part `[a-z0-9._%+-]{1,64}`, domain = ≥ 2 labels
 *   `[a-z0-9-]{1,63}`, TLD `[a-z]{2,}`, total 3–254. null = invalid (→ EMAIL_INVALID). Chosen so that
 *   every accepted address is also accepted by the SMTP adapter (`isEmailAddress`) and fully masked by the log
 *   redactor (`redactText` → `[email]`) – test/be-a-v103-email-units.test.ts runs one case table through all three.
 *   (`nguyễn@example.test`, `"x"@example.test`, `a@b.c,d@e.f`, `a@localhost` → invalid.)
 * - `mailboxAddress`: the address part of EMAIL_FROM (`Name <addr>` or a bare address), lower case.
 * - `maskEmail`: the only form an address may take in audit (`o***@e***.test`); never log or audit a full address.
 * - `EMAIL_CHANGED_TEMPLATE`: the one name of the `email_changed` template, shared by the identity module (enqueue)
 *   and `jobs/email-dispatch` (which may not import `identity/internal`). Typed against INT's real template list
 *   (`StaffEmailTemplate` of `@ottimo/integrations/notification`), so a rename there fails `tsc` (ARC FB-R4-ARC-BE-31-05).
 */
import type { StaffEmailTemplate } from '@ottimo/integrations/notification';

export const EMAIL_CHANGED_TEMPLATE = 'email_changed' satisfies StaffEmailTemplate;

export const SECURITY_EMAIL_MAX = 254;

const LOCAL = /^[a-z0-9._%+-]{1,64}$/;
const LABEL = /^[a-z0-9-]{1,63}$/;
const TLD = /^[a-z]{2,}$/;

export function normalizeSecurityEmail(raw: string): string | null {
  const email = raw.trim().toLowerCase();
  // Printable ASCII only (no control, no space, no Unicode – the redactor and the adapter agree on ASCII).
  if (!/^[\x21-\x7e]+$/.test(email)) return null;
  if (email.length < 3 || email.length > SECURITY_EMAIL_MAX) return null;
  const at = email.split('@');
  if (at.length !== 2) return null;
  const [local, domain] = at as [string, string];
  if (!LOCAL.test(local)) return null;
  const labels = domain.split('.');
  if (labels.length < 2) return null;
  if (!labels.every((l) => LABEL.test(l))) return null;
  if (!TLD.test(labels[labels.length - 1] as string)) return null;
  return email;
}

/** EMAIL_FROM → its address in lower case (`OTTIMO <info@example.test>` → `info@example.test`); '' / unset → null. */
export function mailboxAddress(from: string | undefined | null): string | null {
  const v = (from ?? '').trim();
  if (!v) return null;
  const m = /<([^<>]+)>\s*$/.exec(v);
  const addr = (m ? (m[1] as string) : v).trim().toLowerCase();
  return addr || null;
}

/** `owner@example.test` → `o***@e***.test`; null → null. Shape only – nothing of the address beyond 2 letters. */
export function maskEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const at = email.lastIndexOf('@');
  if (at < 1) return '***';
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const dot = domain.lastIndexOf('.');
  const suffix = dot > 0 ? domain.slice(dot) : '';
  const head = dot > 0 ? domain.slice(0, dot) : domain;
  return `${local.slice(0, 1)}***@${head.slice(0, 1)}***${suffix}`;
}
