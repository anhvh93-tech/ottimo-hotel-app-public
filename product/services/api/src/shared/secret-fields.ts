/**
 * Request body fields that carry a secret (password, PIN, one-time code). One list for every place that
 * must never keep them: the idempotency request hash (SR-AUTH-03, SR-C3-02, FB-R2-SEC-BE-06) and the log
 * redactor (http.ts REDACT_PATHS). Add a field here when an operation gains a new secret input.
 */
export const SECRET_BODY_FIELDS: ReadonlySet<string> = new Set([
  'password',
  'currentPassword',
  'newPassword',
  'initialPassword',
  'resetPassword',
  'secret',
  'pin',
  'newPin',
  'totpCode',
  'otp',
]);

export const SECRET_PLACEHOLDER = '[secret]';

/**
 * Copy of a JSON value with every secret field (any depth) replaced by a constant. The result still
 * identifies the request (same method/path/key/other fields) without containing anything that can be
 * brute-forced offline from a database copy.
 */
export function withoutSecrets(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(withoutSecrets);
  if (value === null || typeof value !== 'object') return value;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = SECRET_BODY_FIELDS.has(k) && v !== undefined ? SECRET_PLACEHOLDER : withoutSecrets(v);
  }
  return out;
}
