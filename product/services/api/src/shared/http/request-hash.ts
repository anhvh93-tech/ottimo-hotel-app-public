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
  return createHash('sha256')
    .update(`${method.toUpperCase()} ${path}\n${canonicalJson(withoutSecrets(body))}`)
    .digest('hex');
}
