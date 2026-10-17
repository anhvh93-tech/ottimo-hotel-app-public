/**
 * Registration routes (OpenAPI tag `registration` + listC3AccessLog; EP06 v0.2). Thin: parse/validate,
 * C3 gate (step-up before the transaction), one transaction per request, role serializer on the way out.
 * C3 responses: `Cache-Control: no-store` (SR-C3-03); idempotent replays store only the id (`storeBody:
 * false` – no C2/C3 in idempotency_key.response_body).
 */
import { createHash } from 'node:crypto';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { DATABASE, Database, type Tx } from '../../../db/database';
import {
  type GuardedRequest,
  type StaffPrincipal,
  tenantOf,
} from '../../../shared/http/auth.guard';
import { Operation } from '../../../shared/http/operation';
import { decodeCursor, page, parseLimit } from '../../../shared/http/pagination';
import { etag, expectedVersion } from '../../../shared/http/precondition';
import { UnitOfWork, applyResult, canonicalJson } from '../../../shared/http/unit-of-work';
import { type FieldError, problem } from '../../../shared/problem';
import { C3AccessGate, noStore } from '../../crypto/public/c3-access-gate';
import { CryptoService } from '../../crypto/public/crypto.service';
import { EncryptedBlobService } from '../../files/public/encrypted-blob.service';
import {
  type NormalizedImage,
  fileRejected,
  normalizeImage,
} from '../../files/public/image-pipeline';
import { fileParts, parseMultipart, textPart } from '../../files/public/multipart';
import { lockRegistration, documentById, readRegistration, type RegRow } from './registration.repo';
import {
  MAX_IMAGES_PER_PERSON,
  type ReasonCode,
  RegistrationService,
  type StaffActor,
} from './registration.service';
import { CHECK_CODES, type CheckCode, validateDocumentInput } from './rules';
import { C3LogService } from './c3-log.service';

/** A real calendar date YYYY-MM-DD (2026-02-31 refused). */
function isLocalDate(v: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

interface Reply {
  status(code: number): unknown;
  header(name: string, value: string): unknown;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * `updateGuestDocument` body `GuestDocumentLink` (0.3.7): exactly one key, `partyMemberId` → its value (422
 * `NOT_IN_LIST` when not a UUID); any other body → null (validated as `GuestDocumentInput`).
 */
function linkOnly(body: unknown): string | null {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const keys = Object.keys(body);
  if (keys.length !== 1 || keys[0] !== 'partyMemberId') return null;
  const v = (body as { partyMemberId: unknown }).partyMemberId;
  if (typeof v !== 'string' || !UUID.test(v)) {
    throw problem('VALIDATION_FAILED', {
      errors: [{ field: 'partyMemberId', code: v === null ? 'REQUIRED' : 'NOT_IN_LIST' }],
    });
  }
  return v.toLowerCase();
}
const REASONS: readonly ReasonCode[] = [
  'registration',
  'recheck',
  'guest_request',
  'authority_request',
];
const TRANSITIONS = ['mark-sent', 'mark-confirmed', 'mark-rejected', 'mark-updated'] as const;
type Transition = (typeof TRANSITIONS)[number];

function principal(req: GuardedRequest): StaffPrincipal {
  const p = req.ottimoAuth?.principal;
  if (!p) throw problem('UNAUTHENTICATED');
  return p;
}

function actorOf(req: GuardedRequest): StaffActor {
  return { principal: principal(req), requestId: req.id };
}

function id(raw: string): string {
  if (!UUID.test(raw)) throw problem('NOT_FOUND');
  return raw;
}

function reasonOf(raw: unknown): ReasonCode | null {
  if (raw === undefined || raw === '') return null;
  if (typeof raw === 'string' && (REASONS as readonly string[]).includes(raw))
    return raw as ReasonCode;
  throw problem('VALIDATION_FAILED', { errors: [{ field: 'reason', code: 'NOT_IN_LIST' }] });
}

function obj(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === 'object' && !Array.isArray(raw)
    ? (raw as Record<string, unknown>)
    : {};
}

@Controller('v1/properties/:propertyId')
export class RegistrationController {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(UnitOfWork) private readonly uow: UnitOfWork,
    @Inject(RegistrationService) private readonly regs: RegistrationService,
    @Inject(C3AccessGate) private readonly gate: C3AccessGate,
    @Inject(C3LogService) private readonly c3log: C3LogService,
    @Inject(EncryptedBlobService) private readonly blobs: EncryptedBlobService,
    @Inject(CryptoService) private readonly crypto: CryptoService,
  ) {}

  private async today(tx: Tx): Promise<string> {
    return (await this.regs.ctx(tx)).today;
  }

  @Get('registrations')
  @Operation('listRegistrations')
  async list(
    @Req() req: GuardedRequest,
    @Query('view') view?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    const v = view ?? 'action_needed';
    if (!['action_needed', 'needs_update', 'all'].includes(v)) {
      throw problem('VALIDATION_FAILED', { errors: [{ field: 'view', code: 'NOT_IN_LIST' }] });
    }
    const n = parseLimit(limit, 50);
    const key = decodeCursor(cursor, 2) as [string, string] | null;
    // Read-only (ARC FB-S3-27 (6)): bookings from before the module get their K1 record from J16.
    return this.db.withContext(
      tenantOf(principal(req)),
      async (tx) => {
        const out = await this.regs.list(tx, v as 'action_needed', key, n);
        const paged = page(
          out.rows.map((row, i) => ({ row, key: out.keys[i] as [string, string] })),
          n,
          (x) => x.key,
        );
        return { data: paged.data.map((x) => x.row), page: paged.page };
      },
      { readOnly: true },
    );
  }

  @Get('registrations/:registrationId')
  @Operation('getRegistration')
  async get(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('registrationId') registrationId: string,
  ) {
    const rid = id(registrationId);
    const body = await this.db.withContext(
      tenantOf(principal(req)),
      async (tx) => {
        const reg = await readRegistration(tx, rid);
        if (!reg) throw problem('NOT_FOUND');
        return this.regs.view(tx, reg);
      },
      { readOnly: true },
    );
    reply.header('ETag', etag(body.version as number));
    return body;
  }

  private async respond(reply: Reply, tx: Tx, reg: RegRow): Promise<Record<string, unknown>> {
    const body = await this.regs.view(tx, reg);
    reply.header('ETag', etag(body.version as number));
    return body;
  }

  @Post('registrations/:registrationId/documents')
  @Operation('addGuestDocument')
  async addDocument(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('registrationId') registrationId: string,
  ) {
    const rid = id(registrationId);
    const actor = actorOf(req);
    const parts = parseMultipart(req.body, headerOf(req, 'content-type'));
    const dataRaw = textPart(parts, 'data');
    if (dataRaw === undefined) {
      throw problem('VALIDATION_FAILED', { errors: [{ field: 'data', code: 'REQUIRED' }] });
    }
    let data: unknown;
    try {
      data = JSON.parse(dataRaw);
    } catch {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'data', code: 'VALIDATION_FAILED' }],
      });
    }
    const files = fileParts(parts, 'image');
    if (files.length > MAX_IMAGES_PER_PERSON) throw fileRejected('image', 'TOO_MANY_FILES');
    const today = await this.db.withContext(tenantOf(actor.principal), (tx) => this.today(tx), {
      readOnly: true,
    });
    const parsed = validateDocumentInput(data, today);
    if (!parsed.value) throw problem('VALIDATION_FAILED', { errors: parsed.errors });
    const input = parsed.value;
    // Idempotency over the SEMANTIC request (ARC FB-S3-19): the multipart boundary changes on every
    // browser retry. The fields (C3) only enter as a keyed hash – never a plain SHA-256 a database copy
    // could brute-force (12-digit numbers); each image by the SHA-256 of its bytes.
    req.body = {
      dataDigest: this.crypto.keyedHash('idempotency', canonicalJson(data)),
      images: files.map((f) => createHash('sha256').update(f).digest('hex')),
    };
    // This request already holds an upload slot: taken in readMultipart before its body was read (http.ts).
    const result = await (async () => {
      const images: NormalizedImage[] = [];
      for (const f of files) images.push(await normalizeImage(f, 'image'));
      return this.uow.run(
        req,
        async (tx) => {
          const reg = await this.regs.addDocument(tx, actor, rid, input, images);
          return { status: 201, body: await this.respond(reply, tx, reg) };
        },
        { storeBody: false },
      );
    })();
    return applyResult(reply, result);
  }

  @Patch('registrations/:registrationId/documents/:documentId')
  @Operation('updateGuestDocument')
  async updateDocument(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('registrationId') registrationId: string,
    @Param('documentId') documentId: string,
    @Body() body: unknown,
  ) {
    const rid = id(registrationId);
    const did = id(documentId);
    const actor = actorOf(req);
    const version = expectedVersion(req);
    return this.db.withContext(tenantOf(actor.principal), async (tx) => {
      // 0.3.7 (S4-39): `GuestDocumentLink` – a body with ONLY `partyMemberId` links the document to a person
      // without reading or re-sending any C3 field (SEC 9.6 e (2)).
      const link = linkOnly(body);
      if (link !== null) {
        const reg = await this.regs.linkDocument(tx, actor, rid, did, version, link);
        return this.respond(reply, tx, reg);
      }
      const parsed = validateDocumentInput(body, await this.today(tx));
      if (!parsed.value) throw problem('VALIDATION_FAILED', { errors: parsed.errors });
      const reg = await this.regs.updateDocument(tx, actor, rid, did, version, parsed.value);
      return this.respond(reply, tx, reg);
    });
  }

  @Get('registrations/:registrationId/documents/:documentId/sensitive')
  @Operation('getGuestDocumentSensitive')
  async sensitive(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('registrationId') registrationId: string,
    @Param('documentId') documentId: string,
    @Query('reason') reason?: string,
  ) {
    const rid = id(registrationId);
    const did = id(documentId);
    const actor = actorOf(req);
    // B3 order: device (guard) → step-up → role (guard) → record → reason → log → data.
    await this.gate.assertStepUp(actor.principal);
    const r = reasonOf(reason);
    noStore(reply);
    return this.db.withContext(tenantOf(actor.principal), (tx) =>
      this.regs.sensitive(tx, actor, rid, did, r),
    );
  }

  @Get('registrations/:registrationId/documents/:documentId/images/:imageId')
  @Operation('getDocumentImage')
  async image(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('registrationId') registrationId: string,
    @Param('documentId') documentId: string,
    @Param('imageId') imageId: string,
    @Query('reason') reason?: string,
  ) {
    const rid = id(registrationId);
    const did = id(documentId);
    const iid = id(imageId);
    const actor = actorOf(req);
    await this.gate.assertStepUp(actor.principal);
    const r = reasonOf(reason);
    const out = await this.db.withContext(tenantOf(actor.principal), (tx) =>
      this.regs.image(tx, actor, rid, did, iid, r),
    );
    noStore(reply);
    reply.header('Content-Type', out.mime);
    reply.header('Content-Disposition', 'inline; filename="document"');
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('Content-Security-Policy', "sandbox; default-src 'none'");
    reply.header('Cross-Origin-Resource-Policy', 'same-origin');
    return out.data;
  }

  @Delete('registrations/:registrationId/images')
  @HttpCode(204)
  @Operation('purgeRegistrationImages')
  async purge(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('registrationId') registrationId: string,
    @Query('reason') reason?: string,
  ) {
    const rid = id(registrationId);
    if (reason !== 'guest_request' && reason !== 'consent_withdrawn') {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'reason', code: reason ? 'NOT_IN_LIST' : 'REQUIRED' }],
      });
    }
    const actor = actorOf(req);
    const version = expectedVersion(req);
    const result = await this.uow.run(
      req,
      async (tx) => {
        await this.regs.purgeRequested(tx, actor, rid, version, reason);
        return { status: 204, body: undefined };
      },
      { storeBody: false },
    );
    await this.blobs.sweepAfterCommit(tenantOf(actor.principal)); // files go after COMMIT (ARC FB-S3-17)
    applyResult(reply, result);
  }

  @Post('registrations/:registrationId/consents')
  @Operation('recordImageConsent')
  async consent(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('registrationId') registrationId: string,
    @Body() body: unknown,
  ) {
    const rid = id(registrationId);
    const actor = actorOf(req);
    const b = obj(body);
    const errors: FieldError[] = [];
    // 0.3.7 nhóm D A (BR-955): P05_CRM – the person's own CRM consent at the desk (no image days involved).
    const crm = b.purpose === 'P05_CRM';
    if (b.purpose === undefined) errors.push({ field: 'purpose', code: 'REQUIRED' });
    else if (b.purpose !== 'P02B_ID_IMAGE_RETENTION' && !crm) {
      errors.push({ field: 'purpose', code: 'NOT_IN_LIST' });
    }
    if (b.decision !== 'granted' && b.decision !== 'refused') {
      errors.push({
        field: 'decision',
        code: b.decision === undefined ? 'REQUIRED' : 'NOT_IN_LIST',
      });
    }
    if (typeof b.noticeVersion !== 'string' || !/^[A-Za-z0-9._-]{1,64}$/.test(b.noticeVersion)) {
      errors.push({
        field: 'noticeVersion',
        code: b.noticeVersion === undefined ? 'REQUIRED' : 'VALIDATION_FAILED',
      });
    }
    if (
      !crm &&
      (typeof b.retentionDays !== 'number' ||
        !Number.isInteger(b.retentionDays) ||
        b.retentionDays < 1 ||
        b.retentionDays > 365)
    ) {
      errors.push({
        field: 'retentionDays',
        code: b.retentionDays === undefined ? 'REQUIRED' : 'VALIDATION_FAILED',
      });
    }
    if (b.locale !== 'vi' && b.locale !== 'en') {
      errors.push({ field: 'locale', code: b.locale === undefined ? 'REQUIRED' : 'NOT_IN_LIST' });
    }
    if (b.channel !== 'desk' && b.channel !== 'paper') {
      errors.push({ field: 'channel', code: b.channel === undefined ? 'REQUIRED' : 'NOT_IN_LIST' });
    }
    if (typeof b.partyMemberId !== 'string' || !UUID.test(b.partyMemberId)) {
      errors.push({
        field: 'partyMemberId',
        code: b.partyMemberId === undefined ? 'REQUIRED' : 'NOT_IN_LIST',
      });
    }
    if (errors.length) throw problem('VALIDATION_FAILED', { errors });
    const person = b.partyMemberId as string;
    const result = await this.uow.run(
      req,
      async (tx) => {
        const reg = await lockRegistration(tx, rid);
        if (!reg) throw problem('NOT_FOUND');
        // The person = a document of this registration: by party member, or the document id itself
        // (documents not linked to a party member yet – BE-A party table lands in Sprint 3).
        const { rows } = await tx.query<{ id: string }>(
          `SELECT id FROM guest_document WHERE registration_id = $1 AND removed_at IS NULL
              AND (party_member_id = $2 OR id = $2) ORDER BY created_at LIMIT 1`,
          [reg.id, person],
        );
        const doc = rows[0] ? await documentById(tx, reg.id, rows[0].id) : null;
        if (!doc) {
          throw problem('VALIDATION_FAILED', {
            errors: [{ field: 'partyMemberId', code: 'NOT_IN_LIST' }],
          });
        }
        if (crm) {
          if (doc.is_minor_data) {
            throw problem('VALIDATION_FAILED', {
              errors: [{ field: 'partyMemberId', code: 'NOT_IN_LIST' }],
            });
          }
          const out = await this.regs.recordCrmConsent(
            tx,
            { userId: actor.principal.userId, requestId: req.id },
            reg,
            doc,
            {
              decision: b.decision as 'granted' | 'refused',
              noticeVersion: b.noticeVersion as string,
              locale: b.locale as string,
              channel: b.channel as 'desk' | 'paper',
            },
          );
          return { status: 201, body: await this.respond(reply, tx, out) };
        }
        const { rows: img } = await tx.query(
          'SELECT 1 FROM document_image WHERE guest_document_id = $1 LIMIT 1',
          [doc.id],
        );
        if (img.length === 0 || doc.is_minor_data) {
          throw problem('VALIDATION_FAILED', {
            errors: [{ field: 'partyMemberId', code: 'NOT_IN_LIST' }],
          });
        }
        // SEC ĐK-2 17/10: the notice version and the days read in the consent sentence must be the parameters
        // in force – the ones `Registration.consentNotice` gave the desk (0.3.6 bổ sung 3).
        const notice = await this.regs.consentNotice(tx);
        const mismatch: FieldError[] = [];
        if (b.noticeVersion !== notice.currentNoticeVersion) {
          mismatch.push({ field: 'noticeVersion', code: 'NOT_IN_LIST' });
        }
        if (b.retentionDays !== notice.imageRetentionDays) {
          mismatch.push({ field: 'retentionDays', code: 'NOT_IN_LIST' });
        }
        if (mismatch.length) throw problem('VALIDATION_FAILED', { errors: mismatch });
        const out = await this.regs.recordConsent(
          tx,
          { type: 'user', userId: actor.principal.userId, requestId: req.id },
          reg,
          doc,
          {
            decision: b.decision as 'granted' | 'refused',
            noticeVersion: b.noticeVersion as string,
            locale: b.locale as string,
            channel: b.channel as 'desk' | 'paper',
            personIndex: null,
            retentionDays: b.retentionDays as number,
          },
        );
        return { status: 201, body: await this.respond(reply, tx, out) };
      },
      { storeBody: false },
    );
    await this.blobs.sweepAfterCommit(tenantOf(actor.principal));
    return applyResult(reply, result);
  }

  @Post('registrations/:registrationId/actions/complete-review')
  @HttpCode(200)
  @Operation('completeRegistrationReview')
  async completeReview(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('registrationId') registrationId: string,
    @Body() body: unknown,
  ) {
    const rid = id(registrationId);
    const actor = actorOf(req);
    const version = expectedVersion(req);
    const raw = obj(body).warningNotes;
    if (raw !== undefined && (!Array.isArray(raw) || raw.length > 100)) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'warningNotes', code: 'VALIDATION_FAILED' }],
      });
    }
    const errors: FieldError[] = [];
    const notes = ((raw as unknown[] | undefined) ?? []).map((n, i) => {
      const x = obj(n);
      if (typeof x.documentId !== 'string' || !UUID.test(x.documentId)) {
        errors.push({ field: `warningNotes[${i}].documentId`, code: 'NOT_IN_LIST' });
      }
      if (!(CHECK_CODES as readonly unknown[]).includes(x.checkCode)) {
        errors.push({ field: `warningNotes[${i}].checkCode`, code: 'NOT_IN_LIST' });
      }
      if (x.manualResult !== undefined && x.manualResult !== 'pass' && x.manualResult !== 'fail') {
        errors.push({ field: `warningNotes[${i}].manualResult`, code: 'NOT_IN_LIST' });
      }
      return {
        documentId: x.documentId as string,
        checkCode: x.checkCode as CheckCode,
        note: typeof x.note === 'string' ? x.note : '',
        manualResult: (x.manualResult as 'pass' | 'fail' | undefined) ?? null,
      };
    });
    if (errors.length) throw problem('VALIDATION_FAILED', { errors });
    const result = await this.uow.run(
      req,
      async (tx) => {
        const reg = await this.regs.completeReview(tx, actor, rid, version, notes);
        return { status: 200, body: await this.respond(reply, tx, reg) };
      },
      { storeBody: false },
    );
    return applyResult(reply, result);
  }

  @Put('registrations/:registrationId/documents/:documentId/checks/:checkCode')
  @Operation('recordDocumentCheck')
  async recordCheck(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('registrationId') registrationId: string,
    @Param('documentId') documentId: string,
    @Param('checkCode') checkCode: string,
    @Body() body: unknown,
  ) {
    const rid = id(registrationId);
    const did = id(documentId);
    if (!(CHECK_CODES as readonly string[]).includes(checkCode)) throw problem('NOT_FOUND');
    const actor = actorOf(req);
    const version = expectedVersion(req);
    const b = obj(body);
    if (b.manualResult !== undefined && b.manualResult !== 'pass' && b.manualResult !== 'fail') {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'manualResult', code: 'NOT_IN_LIST' }],
      });
    }
    return this.db.withContext(tenantOf(actor.principal), async (tx) => {
      const reg = await this.regs.recordCheck(
        tx,
        actor,
        rid,
        did,
        checkCode as CheckCode,
        version,
        {
          manualResult: (b.manualResult as 'pass' | 'fail' | undefined) ?? null,
          note: typeof b.note === 'string' ? b.note : '',
        },
      );
      return this.respond(reply, tx, reg);
    });
  }

  @Get('registrations/:registrationId/portal-data')
  @Operation('getPortalData')
  async portalData(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('registrationId') registrationId: string,
    @Query('kind') kind?: string,
  ) {
    const rid = id(registrationId);
    if (kind !== undefined && kind !== 'foreigner_temp_residence' && kind !== 'vn_citizen_stay') {
      throw problem('VALIDATION_FAILED', { errors: [{ field: 'kind', code: 'NOT_IN_LIST' }] });
    }
    const actor = actorOf(req);
    await this.gate.assertStepUp(actor.principal);
    noStore(reply);
    return this.db.withContext(tenantOf(actor.principal), (tx) =>
      this.regs.portalData(tx, actor, rid, kind ?? null),
    );
  }

  @Post('registrations/:registrationId/actions/:transition')
  @HttpCode(200)
  @Operation('transitionRegistration')
  async transition(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('registrationId') registrationId: string,
    @Param('transition') transition: string,
    @Body() body: unknown,
  ) {
    const rid = id(registrationId);
    if (!(TRANSITIONS as readonly string[]).includes(transition)) throw problem('NOT_FOUND');
    const actor = actorOf(req);
    const version = expectedVersion(req);
    const b = obj(body);
    const str = (k: string): string | undefined =>
      typeof b[k] === 'string' ? (b[k] as string) : undefined;
    const result = await this.uow.run(
      req,
      async (tx) => {
        const reg = await this.regs.transition(tx, actor, rid, transition as Transition, version, {
          portalReference: str('portalReference'),
          kind: str('kind'),
          rejectedReason: str('rejectedReason'),
          actualDepartureDate: str('actualDepartureDate'),
        });
        return { status: 200, body: await this.respond(reply, tx, reg) };
      },
      { storeBody: false },
    );
    await this.blobs.sweepAfterCommit(tenantOf(actor.principal));
    return applyResult(reply, result);
  }

  @Get('c3-access-log')
  @Operation('listC3AccessLog')
  async c3Log(
    @Req() req: GuardedRequest,
    // Contract parameters DateFrom/DateTo are named `from` / `to` (BUG-R2-048).
    @Query('from') dateFrom?: string,
    @Query('to') dateTo?: string,
    @Query('reservationId') reservationId?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    const errors: FieldError[] = [];
    const date = (k: string, v: string | undefined) => {
      if (v !== undefined && !isLocalDate(v)) errors.push({ field: k, code: 'DATE_INVALID' });
    };
    date('from', dateFrom);
    date('to', dateTo);
    if (dateFrom && dateTo && !errors.length && dateFrom > dateTo) {
      errors.push({ field: 'to', code: 'DATE_INVALID' });
    }
    if (reservationId !== undefined && !UUID.test(reservationId)) {
      errors.push({ field: 'reservationId', code: 'VALIDATION_FAILED' });
    }
    if (errors.length) throw problem('VALIDATION_FAILED', { errors });
    const n = parseLimit(limit, 50);
    const key = decodeCursor(cursor, 2) as [string, number] | null;
    return this.db.withContext(
      tenantOf(principal(req)),
      (tx) =>
        this.c3log.list(tx, {
          dateFrom: dateFrom ?? null,
          dateTo: dateTo ?? null,
          reservationId: reservationId ?? null,
          cursor: key,
          limit: n,
        }),
      { readOnly: true },
    );
  }
}

function headerOf(req: GuardedRequest, name: string): string | undefined {
  const v = req.headers[name];
  return Array.isArray(v) ? v[0] : v;
}
