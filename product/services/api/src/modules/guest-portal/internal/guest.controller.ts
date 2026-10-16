/**
 * Guest-web routes, level 1 (ADR-006; SEC s3-checklist G1–G9). Registered on purpose: openGuestSession,
 * getGuestStay, setGuestLocale, get/updateOnlineCheckin, uploadGuestDocument, recordGuestConsent,
 * completeOnlineCheckin. NOT registered (ĐK-1 – Fastify answers 404): sendGuestOtp, verifyGuestSession,
 * getGuestFolio, withdrawGuestConsent, issueGuestVerificationCode.
 * Every response: `Referrer-Policy: no-referrer`; C3/C2 pages `Cache-Control: no-store`.
 */
import { createHash } from 'node:crypto';
import { Body, Controller, Get, HttpCode, Inject, Post, Put, Req, Res } from '@nestjs/common';
import { DATABASE, Database } from '../../../db/database';
import { type GuardedRequest, sha256Hex } from '../../../shared/http/auth.guard';
import type { GuestPrincipal } from '../../../shared/http/guest-session';
import { Operation } from '../../../shared/http/operation';
import { applyResult } from '../../../shared/http/unit-of-work';
import { problem } from '../../../shared/problem';
import { CLOCK, type Clock } from '../../../clock';
import {
  type NormalizedImage,
  fileRejected,
  normalizeImage,
} from '../../files/public/image-pipeline';
import { fileParts, parseMultipart, textPart } from '../../files/public/multipart';
import { RATE_LIMITER, RateLimiter } from '../../identity/public/rate-limiter';
import { GuestPortalService } from './guest-portal.service';
import { GuestSessionResolverService } from './guest-session.resolver';
import { GuestUnitOfWork, guestContext } from './guest-unit-of-work';

interface Reply {
  status(code: number): unknown;
  header(name: string, value: string): unknown;
}

/** SR-RL-03: openGuestSession per client IP (technical security constants). */
export const OPEN_SESSION_RULES = {
  perMinute: { limit: 10, windowMs: 60_000 },
  perDay: { limit: 100, windowMs: 86_400_000 },
} as const;

const DOC_TYPES = ['cccd', 'passport', 'child_personal_id', 'other'] as const;

function guestOf(req: GuardedRequest): GuestPrincipal {
  const g = req.ottimoAuth?.guest;
  if (!g) throw problem('UNAUTHENTICATED');
  return g;
}

function headerOf(req: GuardedRequest, name: string): string | undefined {
  const v = req.headers[name];
  return Array.isArray(v) ? v[0] : v;
}

function obj(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === 'object' && !Array.isArray(raw)
    ? (raw as Record<string, unknown>)
    : {};
}

function guestHeaders(reply: Reply, noStore = false): void {
  reply.header('Referrer-Policy', 'no-referrer');
  if (noStore) reply.header('Cache-Control', 'no-store');
}

@Controller('v1/guest')
export class GuestController {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(GuestPortalService) private readonly portal: GuestPortalService,
    @Inject(GuestUnitOfWork) private readonly uow: GuestUnitOfWork,
    @Inject(GuestSessionResolverService) private readonly sessions: GuestSessionResolverService,
    @Inject(RATE_LIMITER) private readonly limiter: RateLimiter,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  @Post('sessions')
  @HttpCode(200)
  @Operation('openGuestSession')
  async open(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Body() body: unknown,
  ) {
    guestHeaders(reply, true);
    const ip = (req as { ip?: string }).ip ?? 'unknown';
    this.limiter.consume(`guest-open:m:${ip}`, OPEN_SESSION_RULES.perMinute);
    this.limiter.consume(`guest-open:d:${ip}`, OPEN_SESSION_RULES.perDay);
    const token = obj(body).token;
    if (typeof token !== 'string' || token.length < 22 || token.length > 64) {
      throw problem('GUEST_LINK_INVALID');
    }
    const rows = await this.db.entry(async (tx) => {
      const r = await tx.query<{
        token_id: string;
        reservation_id: string;
        property_id: string;
        organization_id: string;
        expires_at: Date;
        revoked_at: Date | null;
      }>('SELECT * FROM guest_resolve_token($1)', [sha256Hex(token)]);
      return r.rows;
    });
    const t = rows[0];
    if (!t || t.revoked_at || t.expires_at.getTime() <= this.clock.now().getTime()) {
      throw problem('GUEST_LINK_INVALID');
    }
    const out = await this.db.withContext(
      {
        organizationId: t.organization_id,
        propertyId: t.property_id,
        userId: null,
        actorType: 'guest',
      },
      (tx) =>
        this.portal.openSession(
          tx,
          { id: t.token_id, reservationId: t.reservation_id, expiresAt: t.expires_at },
          headerOf(req, 'accept-language'),
        ),
    );
    // SR-GST-02: HttpOnly; Secure; SameSite=Strict; the token itself never becomes a cookie.
    const secure = this.sessions.cookieName().startsWith('__Host-') ? '; Secure' : '';
    reply.header(
      'set-cookie',
      `${this.sessions.cookieName()}=${out.sid}; HttpOnly${secure}; SameSite=Strict; Path=/; Expires=${out.expiresAt.toUTCString()}`,
    );
    return out.body;
  }

  @Get('stay')
  @Operation('getGuestStay')
  async stay(@Req() req: GuardedRequest, @Res({ passthrough: true }) reply: Reply) {
    guestHeaders(reply, true);
    const g = guestOf(req);
    return this.db.withContext(guestContext(g), (tx) => this.portal.stay(tx, g), {
      readOnly: true,
    });
  }

  @Put('locale')
  @HttpCode(204)
  @Operation('setGuestLocale')
  async locale(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Body() body: unknown,
  ) {
    guestHeaders(reply);
    const g = guestOf(req);
    const locale = obj(body).locale;
    await this.db.withContext(guestContext(g), (tx) =>
      this.portal.setLocale(tx, g, typeof locale === 'string' ? locale : ''),
    );
  }

  @Get('online-checkin')
  @Operation('getOnlineCheckin')
  async get(@Req() req: GuardedRequest, @Res({ passthrough: true }) reply: Reply) {
    guestHeaders(reply, true);
    const g = guestOf(req);
    return this.db.withContext(guestContext(g), (tx) => this.portal.get(tx, g));
  }

  @Put('online-checkin')
  @Operation('updateOnlineCheckin')
  async update(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Body() body: unknown,
  ) {
    guestHeaders(reply, true);
    const g = guestOf(req);
    return this.db.withContext(guestContext(g), (tx) => this.portal.update(tx, g, obj(body)));
  }

  @Post('online-checkin/documents')
  @Operation('uploadGuestDocument')
  async upload(@Req() req: GuardedRequest, @Res({ passthrough: true }) reply: Reply) {
    guestHeaders(reply, true);
    const g = guestOf(req);
    const parts = parseMultipart(req.body, headerOf(req, 'content-type'));
    const personIndex = Number(textPart(parts, 'personIndex'));
    const docType = textPart(parts, 'docType')?.trim();
    const errors = [];
    if (!Number.isInteger(personIndex) || personIndex < 1) {
      errors.push({ field: 'personIndex', code: 'NOT_IN_LIST' });
    }
    if (!docType || !(DOC_TYPES as readonly string[]).includes(docType)) {
      errors.push({ field: 'docType', code: docType ? 'NOT_IN_LIST' : 'REQUIRED' });
    }
    if (errors.length) throw problem('VALIDATION_FAILED', { errors });
    const files = fileParts(parts, 'image');
    if (files.length === 0)
      throw problem('VALIDATION_FAILED', { errors: [{ field: 'image', code: 'REQUIRED' }] });
    if (files.length > 4) throw fileRejected('image', 'TOO_MANY_FILES');
    // Re-encoded in memory before the transaction (SEC C1): HEIC/PDF/HTML → 422 FILE_REJECTED.
    const images: NormalizedImage[] = [];
    for (const f of files) images.push(await normalizeImage(f, 'image'));
    req.body = {
      personIndex,
      docType,
      multipartSha256: createHash('sha256').update(Buffer.concat(files)).digest('hex'),
    };
    const result = await this.uow.run(req, g, async (tx) => ({
      status: 201,
      body: await this.portal.upload(
        tx,
        g,
        { personIndex, docType: docType as (typeof DOC_TYPES)[number] },
        images,
        req.id,
      ),
    }));
    return applyResult(reply, result);
  }

  @Post('consents')
  @Operation('recordGuestConsent')
  async consent(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Body() body: unknown,
  ) {
    guestHeaders(reply, true);
    const g = guestOf(req);
    reply.status(201);
    return this.db.withContext(guestContext(g), (tx) =>
      this.portal.consent(tx, g, obj(body), req.id),
    );
  }

  @Post('online-checkin/complete')
  @HttpCode(200)
  @Operation('completeOnlineCheckin')
  async complete(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Body() body: unknown,
  ) {
    guestHeaders(reply, true);
    const g = guestOf(req);
    const result = await this.uow.run(req, g, async (tx) => ({
      status: 200,
      body: await this.portal.complete(tx, g, obj(body)),
    }));
    return applyResult(reply, result);
  }
}
