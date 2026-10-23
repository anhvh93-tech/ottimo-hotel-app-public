/** US-142 endpoints: listTrustedDevices, trustCurrentDevice, revokeTrustedDevice (owner only). */
import { Body, Controller, Get, Inject, Param, Post, Req, Res } from '@nestjs/common';
import { z } from 'zod';
import { DATABASE, Database } from '../../../db/database';
import { tenantOf } from '../../../shared/http/auth.guard';
import { readCookie } from '../../../shared/http/cookies';
import { Operation } from '../../../shared/http/operation';
import { UnitOfWork, applyResult } from '../../../shared/http/unit-of-work';
import { problem } from '../../../shared/problem';
import { assertNoCardNumber, parseBody } from '../../platform/public/validation';
import { SessionService } from '../public/session.service';
import { type HttpRequest, type Reply, headerOf, principalOf } from './auth.controller';
import { StrongReauthService } from '../public/strong-reauth';
import { DevicesService, type TrustedDeviceDto } from './devices.service';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const trustSchema = z.object({
  name: z
    .string()
    .transform((s) => s.trim().replace(/\s+/g, ' '))
    .pipe(z.string().min(1).max(80)),
  deviceKind: z.enum(['desk', 'facility_mobile']),
  currentPassword: z.string().min(1).max(256),
  totpCode: z
    .string()
    .regex(/^[0-9]{6}$/)
    .optional(),
  recoveryCode: z.string().min(16).max(19).optional(),
  hardeningChecklistConfirmed: z.boolean(),
});

const revokeSchema = z.object({
  reason: z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().max(200))
    .optional(),
});

@Controller('v1/properties/:propertyId/trusted-devices')
export class DevicesController {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(DevicesService) private readonly devices: DevicesService,
    @Inject(SessionService) private readonly sessions: SessionService,
    @Inject(UnitOfWork) private readonly uow: UnitOfWork,
    @Inject(StrongReauthService) private readonly strong: StrongReauthService,
  ) {}

  private deviceToken(req: HttpRequest): string | undefined {
    return readCookie(headerOf(req, 'cookie'), this.sessions.names.device);
  }

  @Get()
  @Operation('listTrustedDevices')
  async list(@Req() req: HttpRequest): Promise<{ data: TrustedDeviceDto[] }> {
    const p = principalOf(req);
    return this.db.withContext(tenantOf(p), (tx) => this.devices.list(tx, this.deviceToken(req)), {
      readOnly: true,
    });
  }

  @Post()
  @Operation('trustCurrentDevice')
  async trust(
    @Req() req: HttpRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Body() body: unknown,
  ): Promise<TrustedDeviceDto> {
    const input = parseBody(trustSchema, body);
    const p = principalOf(req);
    // SR-DEV-02 re-authentication at level S2 (0.3.8, SEC 06.27): password + TOTP/recovery code when the
    // owner has 2FA; counted in its own transaction (shared with approvals, SR-RL-02).
    await this.strong.verify(
      tenantOf(p),
      {
        password: input.currentPassword,
        totpCode: input.totpCode,
        recoveryCode: input.recoveryCode,
      },
      {
        operationId: 'trustCurrentDevice',
        passwordField: 'currentPassword',
        factorField: 'totpCode',
        requestId: req.id,
        sessionId: p.sessionId,
      },
    );
    let cookie: string | null = null;
    const result = await this.uow.run(req, async (tx) => {
      const r = await this.devices.trustCurrent(tx, {
        userId: p.userId,
        sessionId: p.sessionId,
        origin: headerOf(req, 'origin'),
        currentDeviceToken: this.deviceToken(req),
        name: input.name,
        deviceKind: input.deviceKind,
        hardeningChecklistConfirmed: input.hardeningChecklistConfirmed,
        requestId: req.id,
      });
      cookie = this.sessions.deviceCookie(r.token, r.expiresAt);
      return { status: 201, body: r.device };
    });
    // A replay (same Idempotency-Key) returns the stored device without a new cookie.
    if (cookie && !result.replayed) reply.header('set-cookie', cookie);
    reply.header('cache-control', 'no-store');
    return applyResult(reply, result);
  }

  @Post(':deviceId/actions/revoke')
  @Operation('revokeTrustedDevice')
  async revoke(
    @Req() req: HttpRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('deviceId') deviceId: string,
    @Body() body: unknown,
  ): Promise<TrustedDeviceDto> {
    if (!UUID.test(deviceId)) throw problem('NOT_FOUND');
    const input = parseBody(revokeSchema, body);
    assertNoCardNumber('reason', input.reason);
    const p = principalOf(req);
    const result = await this.uow.run(req, async (tx) => ({
      status: 200,
      body: await this.devices.revoke(tx, {
        userId: p.userId,
        deviceId,
        reason: input.reason || undefined,
        currentDeviceToken: this.deviceToken(req),
        requestId: req.id,
      }),
    }));
    return applyResult(reply, result);
  }
}
