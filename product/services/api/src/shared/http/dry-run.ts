/**
 * FB-R2-SEC-BE-21 (fail-closed, per handler until the guard learns `supportsDryRun` from OpenAPI):
 * an operation that does not implement "tính thử" must refuse `dryRun` instead of ignoring it – otherwise the
 * guard/UoW skip Idempotency-Key for a request that then writes for real.
 * → 422 VALIDATION_FAILED errors[{ field: 'dryRun', code: 'NOT_ALLOWED' }].
 */
import { problem } from '../problem';

export function rejectDryRun(body: unknown): void {
  if (body && typeof body === 'object' && 'dryRun' in body) {
    throw problem('VALIDATION_FAILED', { errors: [{ field: 'dryRun', code: 'NOT_ALLOWED' }] });
  }
}
