/**
 * uploadAttachment / getAttachment (OpenAPI 0.3.6 B-01; SEC I1–I3, I7). Multipart parsing, the role check
 * of the purpose and the image pipeline run BEFORE the unit of work (short transaction, no clear file on
 * disk); the transaction stores the encrypted blob + row.
 */
import { createHash } from 'node:crypto';
import { Controller, Get, Inject, Param, Post, Req, Res } from '@nestjs/common';
import type { AttachmentPurpose } from '../../../db/schema';
import { type GuardedRequest, tenantOf } from '../../../shared/http/auth.guard';
import { Operation } from '../../../shared/http/operation';
import { UnitOfWork, applyResult } from '../../../shared/http/unit-of-work';
import { problem } from '../../../shared/problem';
import { AuditService } from '../../audit/public/audit.service';
import { DATABASE, Database } from '../../../db/database';
import {
  ATTACHMENT_PURPOSES,
  AttachmentService,
  PURPOSES_ACCEPTED_NOW,
  canUpload,
} from '../public/attachment.service';
import { fileRejected, normalizeImage } from '../public/image-pipeline';
import { fileParts, parseMultipart, textPart } from '../public/multipart';

interface Reply {
  status(code: number): unknown;
  header(name: string, value: string): unknown;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function principal(req: GuardedRequest) {
  const p = req.ottimoAuth?.principal;
  if (!p) throw problem('UNAUTHENTICATED');
  return p;
}

@Controller('v1/properties/:propertyId/attachments')
export class AttachmentsController {
  constructor(
    @Inject(UnitOfWork) private readonly uow: UnitOfWork,
    @Inject(AttachmentService) private readonly attachments: AttachmentService,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(DATABASE) private readonly db: Database,
  ) {}

  @Post()
  @Operation('uploadAttachment')
  async upload(@Req() req: GuardedRequest, @Res({ passthrough: true }) reply: Reply) {
    const p = principal(req);
    const parts = parseMultipart(req.body, headerOf(req, 'content-type'));
    const purpose = textPart(parts, 'purpose')?.trim();
    if (!purpose || !(ATTACHMENT_PURPOSES as readonly string[]).includes(purpose)) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'purpose', code: purpose ? 'NOT_IN_LIST' : 'REQUIRED' }],
      });
    }
    const typed = purpose as AttachmentPurpose;
    if (!PURPOSES_ACCEPTED_NOW.includes(typed)) {
      throw problem('VALIDATION_FAILED', { errors: [{ field: 'purpose', code: 'NOT_IN_LIST' }] });
    }
    if (!canUpload(p.roles, typed)) {
      await this.audit.recordDenied(tenantOf(p), {
        action: 'access.denied',
        entityType: 'operation',
        entityId: 'uploadAttachment',
        reason: `purpose:${typed}`,
        requestId: req.id,
        sessionId: p.sessionId,
      });
      throw problem('FORBIDDEN_ACTION');
    }
    const reservationRaw = textPart(parts, 'reservationId')?.trim() || null;
    if (reservationRaw !== null && !UUID.test(reservationRaw)) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'reservationId', code: 'VALIDATION_FAILED' }],
      });
    }
    if ((typed === 'deposit_receipt' || typed === 'penalty_evidence') && !reservationRaw) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'reservationId', code: 'REQUIRED' }],
      });
    }
    const files = fileParts(parts, 'file');
    if (files.length === 0) {
      throw problem('VALIDATION_FAILED', { errors: [{ field: 'file', code: 'REQUIRED' }] });
    }
    if (files.length > 1) throw fileRejected('file', 'TOO_MANY_FILES');
    // This request already holds an upload slot: taken in readMultipart before its body was read (http.ts).
    const result = await (async () => {
      const image = await normalizeImage(files[0] as Buffer, 'file');
      // Idempotency hash over the logical request (never the multipart bytes as JSON).
      req.body = {
        purpose: typed,
        reservationId: reservationRaw,
        fileSha256: createHash('sha256')
          .update(files[0] as Buffer)
          .digest('hex'),
      };
      return this.uow.run(req, async (tx) => ({
        status: 201,
        body: await this.attachments.upload(
          tx,
          { userId: p.userId, roles: p.roles },
          { purpose: typed, reservationId: reservationRaw },
          image,
        ),
      }));
    })();
    return applyResult(reply, result);
  }

  @Get(':attachmentId')
  @Operation('getAttachment')
  async get(
    @Req() req: GuardedRequest,
    @Res({ passthrough: true }) reply: Reply,
    @Param('attachmentId') attachmentId: string,
  ) {
    const p = principal(req);
    if (!UUID.test(attachmentId)) throw problem('NOT_FOUND');
    const out = await this.db.withContext(
      tenantOf(p),
      (tx) => this.attachments.read(tx, { userId: p.userId, roles: p.roles }, attachmentId),
      { readOnly: true },
    );
    // SEC I3: inline under a neutral name, no sniffing, sandboxed, never cached, same origin only.
    reply.header('Content-Type', out.mime);
    reply.header('Cache-Control', 'private, no-store');
    reply.header('Content-Disposition', 'inline; filename="attachment"');
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('Content-Security-Policy', "sandbox; default-src 'none'");
    reply.header('Cross-Origin-Resource-Policy', 'same-origin');
    return out.data;
  }
}

function headerOf(req: GuardedRequest, name: string): string | undefined {
  const v = req.headers[name];
  return Array.isArray(v) ? v[0] : v;
}
