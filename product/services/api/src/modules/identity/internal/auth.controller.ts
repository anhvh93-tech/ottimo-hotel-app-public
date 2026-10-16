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
import { PasswordReauth } from '../public/password-reauth';
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
});

@Controller('v1')
export class AuthController {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(AuthService) private readonly auth: AuthService,
    @Inject(MeService) private readonly me: MeService,
    @Inject(SessionService) private readonly sessions: SessionService,
    @Inject(UnitOfWork) private readonly uow: UnitOfWork,
    @Inject(PasswordReauth) private readonly reauth: PasswordReauth,
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
    await this.reauth.verify(tenantOf(p), input.currentPassword, {
      field: 'currentPassword',
      purpose: 'password_change',
      requestId: req.id,
    });
    const result = await this.uow.run(req, async (tx) => {
      const session = await this.auth.changeMyPassword(tx, {
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
