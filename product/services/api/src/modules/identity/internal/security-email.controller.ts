/**
 * `PUT /v1/me/email` – setMyEmail (OpenAPI 0.3.10, R4 v1.0.3, BUG-R3-032): any staff sets / changes / removes
 * (`null`) their own security e-mail. S2 + Idempotency-Key (a TOTP code is single use: a network retry must get the
 * stored answer, not 401). Order (ARC v1.0.3-contract-email 3.1), after the guard (session, CSRF/Origin,
 * Idempotency-Key 428, restricted session 403):
 *   completed key → stored response (no S2 tried, nothing counted – BUG-R2-150 pattern)
 *   → body shape → EMAIL_INVALID / EMAIL_SHARED_MAILBOX (no S2, nothing written or counted)
 *   → v1.0.4 EM-09: 6th real change of the person in 24 h → 429 RATE_LIMITED + Retry-After (no S2)
 *   → S2 (missing → 422 STRONG_REAUTH_REQUIRED, wrong → 401 REAUTH_FAILED counted SR-RL-02)
 *   → unit of work: same address → 200, nothing written; otherwise write + side effects.
 */
import { Body, Controller, Inject, Put, Req, Res } from '@nestjs/common';
import { z } from 'zod';
import { DATABASE, Database } from '../../../db/database';
import { tenantOf } from '../../../shared/http/auth.guard';
import { Operation } from '../../../shared/http/operation';
import { UnitOfWork, applyResult } from '../../../shared/http/unit-of-work';
import { parseBody } from '../../platform/public/validation';
import { StrongReauthService, strongReauthSchema } from '../public/strong-reauth';
import { type HttpRequest, type Reply, principalOf } from './auth.controller';
import { SecurityEmailService } from './security-email.service';

const setMyEmailSchema = z
  .object({
    // Shape only here; the address rules answer EMAIL_INVALID (service.check), not TOO_LONG.
    email: z.string().nullable(),
    // Absent → StrongReauthService answers STRONG_REAUTH_REQUIRED (not zod REQUIRED), like every S2 operation.
    reauth: strongReauthSchema.optional(),
  })
  .strict();

@Controller('v1')
export class SecurityEmailController {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(UnitOfWork) private readonly uow: UnitOfWork,
    @Inject(StrongReauthService) private readonly strong: StrongReauthService,
    @Inject(SecurityEmailService) private readonly securityEmail: SecurityEmailService,
  ) {}

  @Put('me/email')
  @Operation('setMyEmail')
  async setMyEmail(
    @Req() req: HttpRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Body() body: unknown,
  ): Promise<{ email: string | null }> {
    reply.header('cache-control', 'no-store');
    const replay = await this.uow.completedReplay<{ email: string | null }>(req);
    if (replay) return applyResult(reply, replay);
    const input = parseBody(setMyEmailSchema, body);
    const email = this.securityEmail.check('email', input.email);
    const p = principalOf(req);
    await this.db.withContext(
      tenantOf(p),
      (tx) => this.securityEmail.assertChangeAllowed(tx, p.userId, email),
      { readOnly: true },
    );
    await this.strong.verify(tenantOf(p), input.reauth, {
      operationId: 'setMyEmail',
      requestId: req.id,
      sessionId: p.sessionId,
    });
    const result = await this.uow.run(req, async (tx) => ({
      status: 200,
      body: await this.securityEmail.setOwn(tx, p.userId, email, {
        requestId: req.id,
        sessionId: p.sessionId,
      }),
    }));
    return applyResult(reply, result);
  }
}
