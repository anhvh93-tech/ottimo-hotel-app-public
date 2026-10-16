/**
 * stepUp – POST /v1/me/step-up (SR-C3-09, OpenAPI `stepUp`): re-enter the password to open the sliding
 * window `c3_stepup_minutes` for C3 operations. R2: password only – `pin` is R3 (SR-AUTH-09) → 422
 * NOT_IN_LIST, as approveRequest. Wrong password → 401 REAUTH_FAILED, 5 failures → 429 (shared counter of
 * PasswordReauth, SR-RL-02). Lives in the crypto module because it gates C3 access (C3AccessGate); the
 * route belongs to the `auth` tag of the contract.
 */
import { Body, Controller, HttpCode, Inject, Post, Req } from '@nestjs/common';
import { DATABASE, Database } from '../../../db/database';
import { type GuardedRequest, tenantOf } from '../../../shared/http/auth.guard';
import { Operation } from '../../../shared/http/operation';
import { problem } from '../../../shared/problem';
import { AuditService } from '../../audit/public/audit.service';
import { PasswordReauth } from '../../identity/public/password-reauth';
import { C3AccessGate } from '../public/c3-access-gate';

@Controller('v1/me/step-up')
export class StepUpController {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(PasswordReauth) private readonly reauth: PasswordReauth,
    @Inject(C3AccessGate) private readonly gate: C3AccessGate,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  @Post()
  @HttpCode(200)
  @Operation('stepUp')
  async stepUp(@Req() req: GuardedRequest, @Body() body: unknown) {
    const p = req.ottimoAuth?.principal;
    if (!p) throw problem('UNAUTHENTICATED');
    const b =
      body && typeof body === 'object' && !Array.isArray(body)
        ? (body as Record<string, unknown>)
        : {};
    if (b.pin !== undefined) {
      throw problem('VALIDATION_FAILED', { errors: [{ field: 'pin', code: 'NOT_IN_LIST' }] });
    }
    const password = b.password;
    if (typeof password !== 'string' || password.length < 1 || password.length > 256) {
      throw problem('VALIDATION_FAILED', {
        errors: [
          { field: 'password', code: password === undefined ? 'REQUIRED' : 'VALIDATION_FAILED' },
        ],
      });
    }
    if (!p.propertyId) throw problem('NOT_FOUND');
    await this.reauth.verify(tenantOf(p), password, {
      field: 'password',
      purpose: 'step_up',
      requestId: req.id,
    });
    const until = await this.db.withContext(tenantOf(p), async (tx) => {
      const end = await this.gate.openWindow(tx, p);
      await this.audit.record(tx, {
        category: 'security',
        action: 'c3.step_up',
        entityType: 'operation',
        entityId: p.userId,
        requestId: req.id,
        sessionId: p.sessionId,
        ...(p.trustedDeviceId ? { trustedDeviceId: p.trustedDeviceId } : {}),
      });
      return end;
    });
    return { validUntil: until.toISOString() };
  }
}
