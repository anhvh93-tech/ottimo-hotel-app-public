/**
 * The Idempotency-Key request hash (ADR-009; erd 4.12 `idempotency_key.request_hash`): SHA-256 of method, path and
 * the canonical body WITHOUT secret fields (shared/secret-fields – FB-R2-SEC-BE-06). One file for every reader:
 * UnitOfWork (claimKey, completedReplay), the guest and public unit of work, and AuthGuard (FB-R5-SEC-BE-S1-01 /
 * FB-R5-ARC-BE-S1-04: only a replay of the SAME request defers the role decision). No Nest import here: AuthGuard
 * importing unit-of-work.ts would make a cycle Nest cannot resolve (UnitOfWork injects AuthGuard).
 */
import { createHash } from 'node:crypto';
import { problem } from '../problem';
import { withoutSecrets } from '../secret-fields';

/**
 * SEC FB-R5-SEC-BE-123-01 (ARC 4.3, contract 0.3.13 1h (e)): the deepest request body of openapi.yaml nests 5 levels
 * (`createReservationGroup`); 32 leaves room for any schema without letting canonicalJson / withoutSecrets recurse
 * until the stack overflows (a 500). Counted iteratively: an object or an array is one level.
 */
export const MAX_BODY_DEPTH = 32;

/** True when `value` nests objects / arrays deeper than `max` levels – walked with an explicit stack, never recursion. */
export function bodyTooDeep(value: unknown, max = MAX_BODY_DEPTH): boolean {
  const stack: Array<[unknown, number]> = [[value, 1]];
  while (stack.length > 0) {
    const [v, depth] = stack.pop() as [unknown, number];
    if (v === null || typeof v !== 'object' || isBinaryBody(v)) continue;
    if (depth > max) return true;
    for (const child of Array.isArray(v) ? v : Object.values(v as Record<string, unknown>)) {
      if (child !== null && typeof child === 'object') stack.push([child, depth + 1]);
    }
  }
  return false;
}

/** Stable JSON (sorted keys) so the same logical body always hashes the same. */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value ?? null);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(',')}}`;
}

/** A raw binary body (multipart Buffer, typed array, ArrayBuffer) – never walked key by key. */
export function isBinaryBody(body: unknown): boolean {
  return Buffer.isBuffer(body) || ArrayBuffer.isView(body) || body instanceof ArrayBuffer;
}

export function requestHash(method: string, path: string, body: unknown): string {
  // A raw binary body is never walked key by key: canonicalJson over a 40 MB Buffer would block the event loop
  // (ARC FB-R2-ARC-BE-S3-03). Upload controllers replace the body by its semantic digest before the unit of work;
  // anything else binary is refused.
  if (isBinaryBody(body)) {
    throw problem('VALIDATION_FAILED', { detail: 'Binary request body' });
  }
  // SEC 123-01: a body nested deeper than MAX_BODY_DEPTH → 422 for every caller (UnitOfWork, guest and public units of
  // work), checked before the recursive walks below.
  if (bodyTooDeep(body)) {
    throw problem('VALIDATION_FAILED', { detail: 'Request body nested too deep' });
  }
  return createHash('sha256')
    .update(`${method.toUpperCase()} ${path}\n${canonicalJson(withoutSecrets(body))}`)
    .digest('hex');
}
