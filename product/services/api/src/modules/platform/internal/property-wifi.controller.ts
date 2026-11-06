/**
 * V5-58 (BUG-R3-021 Desk part; OpenAPI 0.3.13 1.13, 1.23, bổ sung 1d/1e): getPropertyWifi (S36: OWN, MGR, FDL, FD
 * read only), setPropertyWifi (A101: OWN, MGR). Roles come from x-roles through the guard (403 before the body).
 * - `Cache-Control: no-store` on every answer of both, 422 included. No SSE (no configuration event kind).
 * - setPropertyWifi order: body shape → property rules (room number, staff login name) → comparison with the
 *   caller's OWN login password, limited by `CALLER_PASSWORD_COMPARE_RULE` (only when the password passed its shape
 *   check, is not empty and differs from the stored one; own committed transaction – CallerPasswordMatch) → any
 *   error: 422, nothing written, no config audit → unit of work: flat `{ssid, password}` + audit `config`
 *   `property.wifi_changed`.
 * - The answer of setPropertyWifi never holds the password (`passwordSet` instead – BE C0313-21). Last writer wins
 *   (no If-Match; the audit keeps `before.ssid`).
 */
import { Body, Controller, Get, Inject, Put, Req, Res } from '@nestjs/common';
import { z } from 'zod';
import { CLOCK, type Clock } from '../../../clock';
import { DATABASE, Database } from '../../../db/database';
import { type GuardedRequest, tenantOf } from '../../../shared/http/auth.guard';
import { Operation } from '../../../shared/http/operation';
import { UnitOfWork, applyResult } from '../../../shared/http/unit-of-work';
import { problem } from '../../../shared/problem';
import { AuditService } from '../../audit/public/audit.service';
import { CallerPasswordMatch } from '../../identity/public/caller-password-match';
import { parseBody } from '../public/validation';
import {
  WIFI_PASSWORD_COMPARE_BUCKET,
  WIFI_SSID_MAX_BYTES,
  readPropertyWifi,
  ssidRefused,
  wifiShapeErrors,
  wifiView,
  writePropertyWifi,
} from './property-wifi';

interface Reply {
  status(code: number): unknown;
  header(name: string, value: string): unknown;
}

type Req = GuardedRequest;

/** OpenAPI setPropertyWifi body (additionalProperties: false); lengths are checked after parsing (bytes, ASCII). */
const wifiBody = z.object({ ssid: z.string(), password: z.string() }).strict();

const NO_STORE = { 'Cache-Control': 'no-store' };

function principal(req: Req) {
  const p = req.ottimoAuth?.principal;
  if (!p) throw new Error('handler reached without an authenticated principal');
  return p;
}

@Controller('v1/properties/:propertyId')
export class PropertyWifiController {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(UnitOfWork) private readonly uow: UnitOfWork,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(CallerPasswordMatch) private readonly callerPassword: CallerPasswordMatch,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  @Get('wifi')
  @Operation('getPropertyWifi')
  async getPropertyWifi(@Req() req: Req, @Res({ passthrough: true }) reply: Reply) {
    reply.header('cache-control', 'no-store');
    return this.db.withContext(
      tenantOf(principal(req)),
      async (tx) => wifiView(await readPropertyWifi(tx)),
      { readOnly: true },
    );
  }

  @Put('wifi')
  @Operation('setPropertyWifi')
  async setPropertyWifi(
    @Req() req: Req,
    @Res({ passthrough: true }) reply: Reply,
    @Body() body: unknown,
  ) {
    reply.header('cache-control', 'no-store');
    const p = principal(req);
    const ctx = tenantOf(p);
    const raw = parseBody(wifiBody, body);
    const input = { ssid: raw.ssid.trim(), password: raw.password };
    const { errors, ssidOk, passwordOk } = wifiShapeErrors(input);
    const checked = await this.db.withContext(
      ctx,
      async (tx) => ({
        current: await readPropertyWifi(tx),
        ssidRefused: ssidOk ? await ssidRefused(tx, input.ssid) : false,
      }),
      { readOnly: true },
    );
    if (checked.ssidRefused) errors.unshift({ field: 'ssid', code: 'NOT_ALLOWED' });
    // CALLER_PASSWORD_COMPARE_RULE: compare (and count) only a well-formed, non-empty password that differs from
    // the stored one; an open network or a change of `ssid` alone never compares.
    if (passwordOk && input.password !== '' && input.password !== checked.current?.password) {
      const outcome = await this.callerPassword.check(ctx, input.password, {
        bucket: WIFI_PASSWORD_COMPARE_BUCKET,
        entityType: 'property',
        entityId: ctx.propertyId as string,
        matchAction: 'property.wifi_password_matches_login',
        skippedAction: 'property.wifi_password_check_skipped',
        requestId: req.id,
        sessionId: p.sessionId,
      });
      if (outcome === 'match') errors.push({ field: 'password', code: 'NOT_ALLOWED' });
    }
    if (errors.length > 0) {
      const ssidRange = errors.some((e) => e.field === 'ssid' && e.code === 'VALUE_OUT_OF_RANGE');
      throw problem('VALIDATION_FAILED', {
        errors,
        headers: NO_STORE,
        ...(ssidRange ? { extras: { max: WIFI_SSID_MAX_BYTES } } : {}),
      });
    }
    const result = await this.uow.run(req, async (tx) => {
      const before = await readPropertyWifi(tx, true);
      await writePropertyWifi(tx, input, this.clock.now());
      await this.audit.record(tx, {
        category: 'config',
        action: 'property.wifi_changed',
        entityType: 'property',
        entityId: tx.ctx.propertyId as string,
        before: { ssid: before?.ssid ?? null },
        after: { ssid: input.ssid, passwordChanged: (before?.password ?? null) !== input.password },
        requestId: req.id,
        sessionId: p.sessionId,
      });
      return {
        status: 200,
        body: { configured: true, ssid: input.ssid, passwordSet: input.password !== '' },
      };
    });
    return applyResult(reply, result);
  }
}
