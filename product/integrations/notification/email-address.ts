// THE e-mail address rule of OTTIMO (R4 v1.0.4, INT FB-R4-INT-BE-31-04; SEC FB-R4-SEC-ARC-EM-05). Owner: INT.
// One rule, two uses:
// - the API normalises what a person types (`normalizeEmailAddress` → stored form, null = EMAIL_INVALID);
// - the SMTP adapter, its config (EMAIL_FROM, EMAIL_SMTP_USER) and `infra/server/mail-test.mjs` check an address
//   before it reaches an envelope (`isEmailAddress`).
// The rule (unchanged from v1.0.3 `normalizeSecurityEmail`, so every stored address stays valid): after trim + lower
// case, printable ASCII only, exactly one `@`, local part `[a-z0-9._%+-]{1,64}`, domain = at least 2 labels
// `[a-z0-9-]{1,63}`, the last one letters only (`[a-z]{2,}`), total 3–254 characters.
// Why ASCII only: the log redactor (`redactText` → `[email]`) and `ops-check email_ascii` agree on exactly this set,
// and no CR/LF, space, quote, `<>`, `,` or `;` can reach a mail header (no header injection, no extra recipient).
// The adapter enforces it since v1.0.4: `ops-check email_ascii` = 0 on staging and production (04/11/2026, K9), the
// condition INT set in v1.0.3. `ops-check email_ascii` (infra/server/bin/ops-check.sh) mirrors this rule in SQL –
// change both together. No dependency, no logging: safe to import anywhere (API, worker, scripts).

export const EMAIL_ADDRESS_MAX = 254;

const LOCAL = /^[a-z0-9._%+-]{1,64}$/;
const LABEL = /^[a-z0-9-]{1,63}$/;
const TLD = /^[a-z]{2,}$/;
const PRINTABLE_ASCII = /^[\x21-\x7e]+$/;

/**
 * Typed input → stored form (trimmed, lower case), or null when the address breaks the rule.
 * `'  Owner@Example.TEST '` → `'owner@example.test'`; `'nguyễn@example.test'`, `'"x"@example.test'`,
 * `'a@b.c,d@e.f'`, `'a@localhost'` → null.
 */
export function normalizeEmailAddress(raw: string): string | null {
  if (typeof raw !== 'string') return null;
  const email = raw.trim().toLowerCase();
  if (!PRINTABLE_ASCII.test(email)) return null;
  if (email.length < 3 || email.length > EMAIL_ADDRESS_MAX) return null;
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

/**
 * Check only (adapter, config, scripts): true when `v` follows the rule as it is. Letter case is not part of the
 * rule (`Info@Example.test` passes – a mailbox is case-insensitive in practice and EMAIL_FROM may be written so);
 * surrounding whitespace is refused, not trimmed – a trailing CR/LF must never reach an envelope.
 */
export function isEmailAddress(v: string): boolean {
  return typeof v === 'string' && v.trim() === v && normalizeEmailAddress(v) !== null;
}
