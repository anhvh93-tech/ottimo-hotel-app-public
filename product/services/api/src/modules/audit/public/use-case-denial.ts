/**
 * A 403 FORBIDDEN_ACTION that a use case raises INSIDE its unit of work, on a fact the role guard cannot see from
 * the operation alone (OpenAPI 0.3.13 bổ sung 1, V5-15: the overdue check-out – `checkOut`, `createVietQr`
 * `purpose = check_out`; SEC ARC-02, contract 1.16 H-01…H-04 and H-09 "exactly one access.denied").
 *
 * The use case marks the refusal with `ProblemError.options.auditReason`; the controller calls this after the
 * transaction rolled back (access.denied is written in its own transaction – AuditService.recordDenied). Same row
 * shape as the guard's refusal (entity `operation`, `after = { operationId, roles }`) plus the reason. Only the
 * reasons the controller lists are written, so a 403 another path already logs is never logged twice.
 */
import { type GuardedRequest, tenantOf } from '../../../shared/http/auth.guard';
import { ProblemError } from '../../../shared/problem';
import type { AuditService } from './audit.service';

export async function recordUseCaseDenial(
  audit: AuditService,
  req: GuardedRequest,
  err: unknown,
  operationId: string,
  reasons: readonly string[],
): Promise<void> {
  if (!(err instanceof ProblemError) || err.code !== 'FORBIDDEN_ACTION') return;
  const reason = err.options.auditReason;
  if (!reason || !reasons.includes(reason)) return;
  const p = req.ottimoAuth?.principal;
  if (!p) return;
  await audit.recordDenied(tenantOf(p), {
    action: 'access.denied',
    entityType: 'operation',
    entityId: operationId,
    reason,
    requestId: req.id,
    sessionId: p.sessionId,
    ...(p.trustedDeviceId ? { trustedDeviceId: p.trustedDeviceId } : {}),
    after: { operationId, roles: p.roles },
  });
}
