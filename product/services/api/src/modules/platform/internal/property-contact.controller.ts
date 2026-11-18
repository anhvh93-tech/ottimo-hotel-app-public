/**
 * FB-INV-012 contract §12.3 (ARC G5, A129 – OpenAPI 0.3.15-draft): the property's public address and hotline, the
 * source of the monthly statement footer (`getBillingPeriodPrint`), the public room page (`phonePublic`) and the
 * hotline exemption of the SENSITIVE_DATA_DETECTED filter (guest requests – read again at every check, no cache).
 * - getPropertyContact: OWN, MGR, FDL (S24 viewers) – x-roles through the guard.
 * - setPropertyContact: OWN only (x-roles) – MGR and others → 403 before the body.
 * Same pattern as Wi-Fi: columns `property.address`, `property.phone_public` (no parameter), no If-Match (last writer
 * wins, the audit keeps the previous values – public information), `Cache-Control: no-store`, no SSE.
 * Checks: `addressLine` trimmed, 5–200 characters, one line, no control / bidi / zero-width characters (SEC 12-04 b);
 * `hotline` matches `^\+?[0-9][0-9 .-]{7,19}$`, stored normalised (spaces, dots, dashes removed; `+` kept);
 * null = clear. A 422 never repeats the value sent.
 */
import { Body, Controller, Get, Inject, Put, Req, Res } from '@nestjs/common';
import { CLOCK, type Clock } from '../../../clock';
import { DATABASE, Database, type Tx } from '../../../db/database';
import { type GuardedRequest, tenantOf } from '../../../shared/http/auth.guard';
import { Operation } from '../../../shared/http/operation';
import { UnitOfWork, applyResult } from '../../../shared/http/unit-of-work';
import { type FieldError, problem } from '../../../shared/problem';
import { AuditService } from '../../audit/public/audit.service';

interface Reply {
  status(code: number): unknown;
  header(name: string, value: string): unknown;
}

type Req = GuardedRequest;

const NO_STORE = { 'Cache-Control': 'no-store' };
const HOTLINE = /^\+?[0-9][0-9 .-]{7,19}$/;
// C0/C1 controls, bidi marks and isolates, zero-width characters (SEC FB-R5-SEC-ARC-12-04 (b)).
/* eslint-disable no-control-regex -- the controls are what this pattern refuses */
const FORBIDDEN_CHARS = new RegExp(
  '[\\u0000-\\u001f\\u007f-\\u009f\\u200b-\\u200f\\u202a-\\u202e\\u2060-\\u2069\\ufeff]',
  'u',
);
/* eslint-enable no-control-regex */

export interface PropertyContact {
  addressLine: string | null;
  hotline: string | null;
}

function principal(req: Req) {
  const p = req.ottimoAuth?.principal;
  if (!p) throw new Error('handler reached without an authenticated principal');
  return p;
}

/** Body of setPropertyContact → normalised values, or the field errors (never the value sent). */
export function parseContact(raw: unknown): { value: PropertyContact; errors: FieldError[] } {
  const errors: FieldError[] = [];
  const body =
    raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : null;
  if (!body) {
    return {
      value: { addressLine: null, hotline: null },
      errors: [{ field: 'body', code: 'VALIDATION_FAILED' }],
    };
  }
  for (const k of Object.keys(body)) {
    if (k !== 'addressLine' && k !== 'hotline') errors.push({ field: k, code: 'NOT_ALLOWED' });
  }
  let addressLine: string | null = null;
  if (!('addressLine' in body)) errors.push({ field: 'addressLine', code: 'REQUIRED' });
  else if (body.addressLine !== null) {
    const a = typeof body.addressLine === 'string' ? body.addressLine.trim() : null;
    if (a === null || FORBIDDEN_CHARS.test(a) || a.length < 5 || a.length > 200) {
      errors.push({ field: 'addressLine', code: 'VALIDATION_FAILED' });
    } else addressLine = a;
  }
  let hotline: string | null = null;
  if (!('hotline' in body)) errors.push({ field: 'hotline', code: 'REQUIRED' });
  else if (body.hotline !== null) {
    const h = typeof body.hotline === 'string' ? body.hotline.trim() : null;
    if (h === null || !HOTLINE.test(h))
      errors.push({ field: 'hotline', code: 'VALIDATION_FAILED' });
    else hotline = h.replace(/[ .-]/g, '');
  }
  return { value: { addressLine, hotline }, errors };
}

async function readContact(tx: Tx, forUpdate = false): Promise<PropertyContact> {
  const { rows } = await tx.query<{ address: string | null; phone_public: string | null }>(
    `SELECT address, phone_public FROM property WHERE id = $1${forUpdate ? ' FOR UPDATE' : ''}`,
    [tx.ctx.propertyId],
  );
  return { addressLine: rows[0]?.address ?? null, hotline: rows[0]?.phone_public ?? null };
}

@Controller('v1/properties/:propertyId')
export class PropertyContactController {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(UnitOfWork) private readonly uow: UnitOfWork,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  @Get('contact')
  @Operation('getPropertyContact')
  async getPropertyContact(@Req() req: Req, @Res({ passthrough: true }) reply: Reply) {
    reply.header('cache-control', 'no-store');
    return this.db.withContext(tenantOf(principal(req)), (tx) => readContact(tx), {
      readOnly: true,
    });
  }

  @Put('contact')
  @Operation('setPropertyContact')
  async setPropertyContact(
    @Req() req: Req,
    @Res({ passthrough: true }) reply: Reply,
    @Body() body: unknown,
  ) {
    reply.header('cache-control', 'no-store');
    const p = principal(req);
    const { value, errors } = parseContact(body);
    if (errors.length > 0) throw problem('VALIDATION_FAILED', { errors, headers: NO_STORE });
    const result = await this.uow.run(req, async (tx) => {
      const before = await readContact(tx, true);
      await tx.query(
        `UPDATE property SET address = $2, phone_public = $3, updated_at = $4, version = version + 1
          WHERE id = $1`,
        [tx.ctx.propertyId, value.addressLine, value.hotline, this.clock.now()],
      );
      await this.audit.record(tx, {
        category: 'config',
        action: 'property.contact_changed',
        entityType: 'property',
        entityId: tx.ctx.propertyId as string,
        before: { ...before },
        after: { ...value },
        requestId: req.id,
        sessionId: p.sessionId,
      });
      return { status: 200, body: value };
    });
    return applyResult(reply, result);
  }
}
