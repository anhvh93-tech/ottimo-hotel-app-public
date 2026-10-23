/**
 * US-143 endpoints (OpenAPI 0.3.8): loginMfa, getMy2fa, startMy2faSetup, confirmMy2fa, disableMy2fa,
 * regenerateMyRecoveryCodes, resetUser2fa. Responses carrying a secret/URI/codes are `Cache-Control: no-store`
 * and never go through the idempotency store (SEC 06.9 – those operations have no Idempotency-Key).
 */
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { z } from 'zod';
import { tenantOf } from '../../../shared/http/auth.guard';
import { readCookie } from '../../../shared/http/cookies';
import { Operation } from '../../../shared/http/operation';
import { UnitOfWork } from '../../../shared/http/unit-of-work';
import { problem } from '../../../shared/problem';
import { parseBody } from '../../platform/public/validation';
import { MfaStore } from '../public/mfa-store';
import { PasswordReauth } from '../public/password-reauth';
import { SessionService } from '../public/session.service';
import { StrongReauthService, strongReauthSchema } from '../public/strong-reauth';
import { type HttpRequest, type Reply, headerOf, principalOf } from './auth.controller';
import { AuthService } from './auth.service';
import type { Me } from './me.service';
import { type My2fa, MfaService } from './mfa.service';
import { UsersService } from './users.service';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const totpCode = z.string().regex(/^[0-9]{6}$/);
const recoveryCode = z
  .string()
  .regex(/^[0-9A-Za-z]{4}[- ]?[0-9A-Za-z]{4}[- ]?[0-9A-Za-z]{4}[- ]?[0-9A-Za-z]{4}$/);

const loginMfaSchema = z
  .object({
    mfaToken: z.string().min(32).max(128),
    totpCode: totpCode.optional(),
    recoveryCode: recoveryCode.optional(),
  })
  .strict()
  .refine((b) => (b.totpCode === undefined) !== (b.recoveryCode === undefined), {
    params: { code: 'ONE_OF_REQUIRED' },
    path: ['totpCode'],
  });

const setupSchema = z.object({ currentPassword: z.string().min(1).max(256) });
const confirmSchema = z.object({ totpCode }).strict();
const resetSchema = z
  .object({ reauth: strongReauthSchema, reason: z.string().trim().min(3).max(300) })
  .strict();

@Controller('v1')
export class MfaController {
  constructor(
    @Inject(AuthService) private readonly auth: AuthService,
    @Inject(MfaService) private readonly mfa: MfaService,
    @Inject(MfaStore) private readonly store: MfaStore,
    @Inject(SessionService) private readonly sessions: SessionService,
    @Inject(PasswordReauth) private readonly reauth: PasswordReauth,
    @Inject(StrongReauthService) private readonly strong: StrongReauthService,
    @Inject(UnitOfWork) private readonly uow: UnitOfWork,
    @Inject(UsersService) private readonly users: UsersService,
  ) {}

  @Post('auth/login/mfa')
  @HttpCode(200)
  @Operation('loginMfa')
  async loginMfa(
    @Req() req: HttpRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Body() body: unknown,
  ): Promise<Me> {
    const input = parseBody(loginMfaSchema, body);
    const { me, session } = await this.auth.loginMfa({
      ...input,
      ip: req.ip,
      userAgent: headerOf(req, 'user-agent'),
      origin: headerOf(req, 'origin'),
      deviceToken: readCookie(headerOf(req, 'cookie'), this.sessions.names.device),
      requestId: req.id,
    });
    reply.header('set-cookie', this.sessions.sessionCookie(session));
    reply.header('cache-control', 'no-store');
    return me;
  }

  @Get('me/2fa')
  @Operation('getMy2fa')
  async getMy2fa(
    @Req() req: HttpRequest,
    @Res({ passthrough: true }) reply: Reply,
  ): Promise<My2fa> {
    const p = principalOf(req);
    reply.header('cache-control', 'no-store');
    return this.mfa.status(tenantOf(p), p.userId);
  }

  @Post('me/2fa/setup')
  @HttpCode(200)
  @Operation('startMy2faSetup')
  async startSetup(
    @Req() req: HttpRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Body() body: unknown,
  ): Promise<{ otpauthUri: string; expiresAt: string }> {
    const input = parseBody(setupSchema, body);
    const p = principalOf(req);
    await this.reauth.verify(tenantOf(p), input.currentPassword, {
      field: 'currentPassword',
      purpose: 'mfa_setup',
      requestId: req.id,
    });
    const out = await this.mfa.startSetup(tenantOf(p), p.userId, {
      requestId: req.id,
      sessionId: p.sessionId,
    });
    reply.header('cache-control', 'no-store');
    return { otpauthUri: out.otpauthUri, expiresAt: out.expiresAt.toISOString() };
  }

  @Post('me/2fa/confirm')
  @HttpCode(200)
  @Operation('confirmMy2fa')
  async confirm(
    @Req() req: HttpRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Body() body: unknown,
  ): Promise<{ recoveryCodes: string[] }> {
    const input = parseBody(confirmSchema, body);
    const p = principalOf(req);
    const out = await this.mfa.confirm(tenantOf(p), {
      userId: p.userId,
      sessionId: p.sessionId,
      totpCode: input.totpCode,
      requestId: req.id,
    });
    reply.header('set-cookie', this.sessions.sessionCookie(out.session));
    reply.header('cache-control', 'no-store');
    return { recoveryCodes: out.recoveryCodes };
  }

  @Delete('me/2fa')
  @HttpCode(204)
  @Operation('disableMy2fa')
  async disable(
    @Req() req: HttpRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Body() body: unknown,
  ): Promise<void> {
    const input = parseBody(strongReauthSchema, body);
    const p = principalOf(req);
    await this.mfa.assertState(tenantOf(p), p.userId, 'disable');
    await this.strong.verify(tenantOf(p), input, {
      operationId: 'disableMy2fa',
      passwordField: 'password',
      factorField: 'totpCode',
      requestId: req.id,
      sessionId: p.sessionId,
    });
    await this.mfa.disable(tenantOf(p), p.userId, req.id);
    reply.header('set-cookie', this.sessions.clearSessionCookie());
  }

  @Post('me/2fa/recovery-codes')
  @HttpCode(200)
  @Operation('regenerateMyRecoveryCodes')
  async regenerate(
    @Req() req: HttpRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Body() body: unknown,
  ): Promise<{ recoveryCodes: string[] }> {
    const input = parseBody(strongReauthSchema, body);
    const p = principalOf(req);
    await this.mfa.assertState(tenantOf(p), p.userId, 'regenerate');
    await this.strong.verify(tenantOf(p), input, {
      operationId: 'regenerateMyRecoveryCodes',
      passwordField: 'password',
      factorField: 'totpCode',
      requestId: req.id,
      sessionId: p.sessionId,
    });
    const recoveryCodes = await this.mfa.regenerate(tenantOf(p), p.userId, req.id);
    reply.header('cache-control', 'no-store');
    return { recoveryCodes };
  }

  @Post('users/:userId/2fa/actions/reset')
  @HttpCode(204)
  @Operation('resetUser2fa')
  async resetUser2fa(
    @Req() req: HttpRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('userId') userId: string,
    @Body() body: unknown,
  ): Promise<void> {
    if (!UUID.test(userId)) throw problem('NOT_FOUND');
    const input = parseBody(resetSchema, body);
    const p = principalOf(req);
    if (userId === p.userId) {
      throw problem('VALIDATION_FAILED', { errors: [{ field: 'userId', code: 'NOT_ALLOWED' }] });
    }
    await this.strong.verify(tenantOf(p), input.reauth, {
      operationId: 'resetUser2fa',
      requestId: req.id,
      sessionId: p.sessionId,
    });
    let pendingKey: { dataKeyId: string; propertyId: string } | null = null;
    const result = await this.uow.run(req, async (tx) => {
      const owned = await this.users.ownedProperties(tx, p.userId);
      const out = await this.mfa.resetByOwner(tx, {
        ownerId: p.userId,
        targetId: userId,
        reason: input.reason,
        requestId: req.id,
        owned,
      });
      pendingKey = out.pendingKey;
      return { status: 204, body: null };
    });
    if (pendingKey) await this.store.destroyKeyLater(tenantOf(p), pendingKey, userId);
    reply.status(result.status);
  }
}
