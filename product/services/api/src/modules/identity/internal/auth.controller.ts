/** US-001 endpoints: login, logout, getMe, changeMyPassword (OpenAPI tag auth). */
import { Body, Controller, Get, HttpCode, Inject, Post, Req, Res } from '@nestjs/common';
import { z } from 'zod';
import { DATABASE, Database } from '../../../db/database';
import { type GuardedRequest, tenantOf } from '../../../shared/http/auth.guard';
import { readCookie } from '../../../shared/http/cookies';
import { Operation } from '../../../shared/http/operation';
import { UnitOfWork } from '../../../shared/http/unit-of-work';
import { parseBody } from '../../platform/public/validation';
import { SessionService } from '../public/session.service';
import { IdentityParamsService } from '../public/identity-params';
import { StrongReauthService } from '../public/strong-reauth';
import { AuthService } from './auth.service';
import { type Me, MeService } from './me.service';

export interface Reply {
  status(code: number): unknown;
  header(name: string, value: string | string[]): unknown;
}

export type HttpRequest = GuardedRequest & { ip?: string };

export function headerOf(req: GuardedRequest, name: string): string | undefined {
  const v = req.headers[name];
  return Array.isArray(v) ? v[0] : v;
}

export function principalOf(req: GuardedRequest) {
  const p = req.ottimoAuth?.principal;
  if (!p) throw new Error('handler reached without an authenticated principal');
  return p;
}

const loginSchema = z.object({
  username: z
    .string()
    .transform((s) => s.trim().toLowerCase())
    .pipe(z.string().min(3).max(64)),
  password: z.string().min(8).max(256),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(256),
  newPassword: z.string().min(1).max(256),
  // 0.3.8 (SEC 06.25 – S2): required when the caller has 2FA (one of them).
  totpCode: z
    .string()
    .regex(/^[0-9]{6}$/)
    .optional(),
  recoveryCode: z.string().min(16).max(19).optional(),
});

@Controller('v1')
export class AuthController {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(AuthService) private readonly auth: AuthService,
    @Inject(MeService) private readonly me: MeService,
    @Inject(SessionService) private readonly sessions: SessionService,
    @Inject(UnitOfWork) private readonly uow: UnitOfWork,
    @Inject(StrongReauthService) private readonly strong: StrongReauthService,
    @Inject(IdentityParamsService) private readonly identityParams: IdentityParamsService,
  ) {}

  @Post('auth/login')
  @HttpCode(200)
  @Operation('login')
  async login(
    @Req() req: HttpRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Body() body: unknown,
  ): Promise<Me> {
    const input = parseBody(loginSchema, body);
    const { me, session } = await this.auth.login({
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

  @Post('auth/logout')
  @HttpCode(204)
  @Operation('logout')
  async logout(@Req() req: HttpRequest, @Res({ passthrough: true }) reply: Reply): Promise<void> {
    const p = principalOf(req);
    await this.db.withContext(tenantOf(p), (tx) => this.auth.logout(tx, p.sessionId, req.id));
    reply.header('set-cookie', this.sessions.clearSessionCookie());
  }

  @Get('me')
  @Operation('getMe')
  async getMe(@Req() req: HttpRequest, @Res({ passthrough: true }) reply: Reply): Promise<Me> {
    const p = principalOf(req);
    reply.header('cache-control', 'no-store');
    return this.db.withContext(
      tenantOf(p),
      (tx) =>
        this.me.build(tx, {
          userId: p.userId,
          sessionId: p.sessionId,
          activePropertyId: p.propertyId,
          deviceToken: readCookie(headerOf(req, 'cookie'), this.sessions.names.device),
        }),
      { readOnly: true },
    );
  }

  @Post('me/password')
  @HttpCode(204)
  @Operation('changeMyPassword')
  async changeMyPassword(
    @Req() req: HttpRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Body() body: unknown,
  ): Promise<void> {
    const input = parseBody(changePasswordSchema, body);
    const p = principalOf(req);
    // S2 (0.3.8, SEC 06.25): current password, plus TOTP/recovery code once 2FA is on.
    const proof = await this.strong.verify(
      tenantOf(p),
      {
        password: input.currentPassword,
        totpCode: input.totpCode,
        recoveryCode: input.recoveryCode,
      },
      {
        operationId: 'changeMyPassword',
        passwordField: 'currentPassword',
        factorField: 'totpCode',
        requestId: req.id,
        sessionId: p.sessionId,
      },
    );
    // Own transactions → before the unit of work (no nested connection, FB-R2-ARC-BE-01).
    const { session: sessionPolicy } = await this.identityParams.forUser(tenantOf(p));
    const result = await this.uow.run(req, async (tx) => {
      const session = await this.auth.changeMyPassword(tx, {
        sessionPolicy,
        amr: proof.method === 'password' ? 'pwd' : proof.method,
        userId: p.userId,
        sessionId: p.sessionId,
        currentPassword: input.currentPassword,
        newPassword: input.newPassword,
        ip: req.ip,
        userAgent: headerOf(req, 'user-agent'),
        requestId: req.id,
      });
      return { status: 204, body: session };
    });
    reply.header('set-cookie', this.sessions.sessionCookie(result.body));
  }
}
