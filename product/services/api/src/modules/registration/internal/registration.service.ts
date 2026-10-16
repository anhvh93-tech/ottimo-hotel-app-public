/**
 * Registration use cases (EP06 v0.2; SM-05 K1…K13; BR-601…613; SEC s3-checklist B, C, E).
 * Every method runs in the caller's transaction. C3 access is logged with C3AccessGate/AuditService in the
 * same transaction, BEFORE any C3 value is returned (SR-C3-07).
 */
import { Inject, Injectable, Optional } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import { CLOCK, type Clock } from '../../../clock';
import { type Tx, pgCode } from '../../../db/database';
import type { StaffPrincipal } from '../../../shared/http/auth.guard';
import { assertVersion } from '../../../shared/http/precondition';
import { type FieldError, problem } from '../../../shared/problem';
import { type LocalDate, businessDate, localDate, toZonedIso } from '../../../shared/time';
import { containsCardNumber } from '../../../shared/validation';
import { AuditService } from '../../audit/public/audit.service';
import { C3AccessGate } from '../../crypto/public/c3-access-gate';
import { CryptoService, DataKeyDestroyedError } from '../../crypto/public/crypto.service';
import { EventsService } from '../../events/public/events.service';
import { AttachmentService } from '../../files/public/attachment.service';
import { BlobGoneError, EncryptedBlobService } from '../../files/public/encrypted-blob.service';
import { fileRejected, type NormalizedImage } from '../../files/public/image-pipeline';
import { ParameterService } from '../../platform/public/parameter.service';
import {
  type ConsentRow,
  type DocRow,
  ENC_COLUMNS,
  type ImageRow,
  type RegRow,
  REG_COLUMNS,
  consentsOf,
  decryptFields,
  documentById,
  documentsOf,
  encSetSql,
  encryptFields,
  imagesOf,
  isComplete,
  latestConsent,
  lockRegistration,
  lockRegistrationOfReservation,
  readRegistration,
  recordTransition,
} from './registration.repo';
import {
  type CheckCode,
  type DeadlineParams,
  type DocumentFields,
  type DocumentInput,
  type RegistrationStatusValue,
  type StoredCheck,
  ageAt,
  checkNoteError,
  computeChecks,
  deadlineLabel,
  docNumberCandidates,
  hasLongDigitRun,
  isBlocking,
  isForeigner,
  nextStatus,
  type PortalField,
  type PortalFormat,
  portalClipboard,
  portalFields,
  registrationDeadline,
  visaAlertOn,
} from './rules';
import { onlineCheckinSummary } from '../../guest-portal/public/online-checkin.read';
import { DEFAULT_PORTAL_URLS, PORTAL_URLS, type PortalUrls } from './portal-config';
import { RegistrationPartyLink } from '../public/party-port';
import {
  SYSTEM_ACTOR,
  type StayView,
  bookingsWithoutRegistration,
  readStay,
  readStays,
} from './stay-reader';

/** A party member id that is not a person of this booking (FK 0053) → 422 NOT_IN_LIST, never 500. */
async function partyMember<T>(write: Promise<T>): Promise<T> {
  try {
    return await write;
  } catch (err) {
    if (
      pgCode(err) === '23503' &&
      (err as { constraint?: string }).constraint === 'guest_document_party_member_fk'
    ) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'partyMemberId', code: 'NOT_IN_LIST' }],
      });
    }
    throw err;
  }
}

/** SR-FILE-02: images per person (technical constant). */
export const MAX_IMAGES_PER_PERSON = 4;

export type ImageDeleteReason =
  | 'retention'
  | 'no_consent'
  | 'consent_withdrawn'
  | 'guest_request'
  | 'void'
  | 'replaced'
  | 'party_removed'
  | 'unconfirmed';

const POLICY_OF: Record<ImageDeleteReason, string> = {
  retention: 'T02',
  no_consent: 'T01',
  consent_withdrawn: 'consent_withdrawn',
  guest_request: 'guest_request',
  void: 'T01',
  replaced: 'replaced',
  party_removed: 'party_removed',
  unconfirmed: 'SR-RET-02',
};
const SUMMARY_REASONS: readonly string[] = [
  'retention',
  'no_consent',
  'consent_withdrawn',
  'guest_request',
  'void',
];

const OPEN_STATUSES: readonly string[] = ['none', 'pre', 'partial', 'review'];
/** Technical cap of open registrations read for one list (a 10-room property has tens). */
const OPEN_CAP = 1000;
const VOIDABLE: readonly string[] = ['none', 'pre', 'partial', 'review', 'scanned'];
const AFTER_CONFIRMED: readonly string[] = ['confirmed', 'needs_update', 'updated'];

export interface StaffActor {
  principal: StaffPrincipal;
  requestId: string;
}

export type ReasonCode = 'registration' | 'recheck' | 'guest_request' | 'authority_request';

interface Ctx {
  now: Date;
  tz: string;
  today: LocalDate;
}

@Injectable()
export class RegistrationService {
  constructor(
    @Inject(CryptoService) private readonly crypto: CryptoService,
    @Inject(EncryptedBlobService) private readonly blobs: EncryptedBlobService,
    @Inject(C3AccessGate) private readonly gate: C3AccessGate,
    @Inject(ParameterService) private readonly params: ParameterService,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(CLOCK) private readonly clock: Clock,
    @Optional() @Inject(EventsService) private readonly events?: EventsService,
    @Optional() @Inject(AttachmentService) private readonly attachments?: AttachmentService,
    @Optional() @Inject(PORTAL_URLS) private readonly portalUrls: PortalUrls = DEFAULT_PORTAL_URLS,
    @Optional()
    @Inject(RegistrationPartyLink)
    private readonly party: RegistrationPartyLink = new RegistrationPartyLink(),
  ) {}

  // ───────────────────────── context helpers ─────────────────────────

  async ctx(tx: Tx): Promise<Ctx> {
    const { rows } = await tx.query<{ timezone: string }>(
      'SELECT timezone FROM property WHERE id = $1',
      [tx.ctx.propertyId],
    );
    const tz = rows[0]?.timezone ?? 'Asia/Ho_Chi_Minh';
    const now = this.clock.now();
    return { now, tz, today: localDate(now, tz) };
  }

  private async deadlineParams(tx: Tx, today: LocalDate): Promise<DeadlineParams> {
    return {
      vn: await this.params.get(tx, 'registration_deadline_vn', today),
      foreignerHours: await this.params.get<number>(
        tx,
        'registration_deadline_foreigner_hours',
        today,
      ),
      foreignerMode: await this.params.get(tx, 'registration_deadline_foreigner_mode', today),
    };
  }

  private async publish(tx: Tx, registrationId: string): Promise<void> {
    await this.events?.publish(tx, 'registration.changed', registrationId);
  }

  // ───────────────────────── K1: one record per root booking ─────────────────────────

  /** K1 (BR-608): creates the `none` record when missing; returns the row (not locked). */
  async ensure(tx: Tx, reservationId: string, personsTotal?: number): Promise<RegRow | null> {
    const existing = await tx.query<RegRow>(
      `SELECT ${REG_COLUMNS} FROM registration WHERE reservation_id = $1`,
      [reservationId],
    );
    if (existing.rows[0]) return existing.rows[0];
    let persons = personsTotal;
    if (persons === undefined) {
      const stay = await readStay(tx, reservationId, SYSTEM_ACTOR);
      if (!stay || stay.parentReservationId) return null; // extension child: no record (BR-608)
      persons = stay.personsTotal;
    }
    const now = this.clock.now();
    const id = uuidv7();
    await tx.query(
      `INSERT INTO registration (id, organization_id, property_id, reservation_id, status, required_count,
         created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'none', $5, $6, $6)
       ON CONFLICT (reservation_id) DO NOTHING`,
      [id, tx.ctx.organizationId, tx.ctx.propertyId, reservationId, persons, now],
    );
    const { rows } = await tx.query<RegRow>(
      `SELECT ${REG_COLUMNS} FROM registration WHERE reservation_id = $1`,
      [reservationId],
    );
    if (rows[0]?.id === id) await recordTransition(tx, id, null, 'none', 'K1', now);
    return rows[0] ?? null;
  }

  /** Bookings created before the module (Sprint 2 data) get their record on first listing. */
  async backfill(tx: Tx): Promise<number> {
    const missing = await bookingsWithoutRegistration(tx);
    for (const b of missing) await this.ensure(tx, b.id, b.persons);
    return missing.length;
  }

  // ───────────────────────── recompute (K2/K3/K4/K13, checks, kind, deadline) ─────────────────────────

  /**
   * Recomputes the derived state of a LOCKED registration: checks of every complete document, counts,
   * kind, blocksDoorCode, status K2/K3/K4/K13, deadline (actual arrival). Bumps the version.
   */
  async refresh(
    tx: Tx,
    reg: RegRow,
    opts: { requestId?: string; bump?: boolean } = {},
  ): Promise<RegRow> {
    const c = await this.ctx(tx);
    const stay = await readStay(tx, reg.reservation_id, SYSTEM_ACTOR);
    if (!stay) throw problem('NOT_FOUND');
    const docs = await documentsOf(tx, reg.id);
    const complete = docs.filter(isComplete);
    const submitted = complete.length;
    const longStay = stay.stayType === 'long';
    const warnDays = await this.params
      .get<number>(
        tx,
        longStay ? 'visa_expiry_warning_days.long_stay' : 'visa_expiry_warning_days.short_stay',
        c.today,
      )
      .catch(() => null);
    const ended = ['checked_out', 'cancelled', 'no_show'].includes(stay.status);
    let blocks = false;
    let foreign = 0;
    let vn = 0;
    for (const doc of complete) {
      const f = await decryptFields(tx, this.crypto, doc);
      const checks = computeChecks(
        {
          docType: doc.doc_type,
          fullNameOnDoc: doc.full_name_on_doc ?? '',
          nationalityCode: doc.nationality_code ?? 'VNM',
          passportExpiryDate: f.passportExpiryDate,
          visaKind: f.visaKind,
          visaValidUntil: f.visaValidUntil,
          entryDate: f.entryDate,
          noEntryRecord: f.noEntryRecord,
        },
        {
          arrivalDate: stay.arrivalDate,
          departureDate: stay.departureDate,
          bookingName: doc.is_main ? stay.bookerName : null,
          submittedCount: submitted,
          requiredCount: reg.required_count,
          isMain: doc.is_main,
        },
        doc.check_results,
      );
      if (checks.some((x) => x.blocking)) blocks = true;
      if (doc.is_foreigner) foreign++;
      else vn++;
      const alert =
        doc.is_foreigner && !ended && warnDays !== null
          ? visaAlertOn(f.visaValidUntil, warnDays)
          : null;
      await tx.query(
        `UPDATE guest_document SET check_results = $2, visa_alert_on = $3, updated_at = $4 WHERE id = $1`,
        [doc.id, JSON.stringify(checks), alert, c.now],
      );
    }
    const kind =
      foreign > 0 && vn > 0
        ? 'mixed'
        : foreign > 0
          ? 'foreigner_temp_residence'
          : vn > 0
            ? 'vn_citizen_stay'
            : null;
    const guestUploads = docs.filter(
      (d) => d.capture_method === 'guest_upload' && !isComplete(d),
    ).length;
    const status = nextStatus(reg.status as RegistrationStatusValue, {
      submitted,
      required: reg.required_count,
      guestUploads,
    });
    if (status !== reg.status) {
      const event =
        status === 'pre'
          ? 'K2'
          : status === 'review'
            ? 'K4'
            : reg.status === 'review'
              ? 'K13'
              : 'K3';
      await recordTransition(tx, reg.id, reg.status, status, event, c.now, {
        ...(opts.requestId ? { requestId: opts.requestId } : {}),
      });
    }
    let deadlineAt = reg.deadline_at;
    let basis = reg.deadline_basis;
    if (reg.actual_checkin_at && !['sent', 'confirmed', 'updated', 'void'].includes(status)) {
      const d = registrationDeadline(
        reg.actual_checkin_at,
        c.tz,
        kind,
        await this.deadlineParams(tx, c.today),
      );
      deadlineAt = d.at;
      basis = d.basis;
    }
    const { rows } = await tx.query<RegRow>(
      `UPDATE registration SET kind = $2, submitted_count = $3, blocks_door_code = $4, status = $5,
              deadline_at = $6, deadline_basis = $7, updated_at = $8,
              version = version + $9
        WHERE id = $1 RETURNING ${REG_COLUMNS}`,
      [
        reg.id,
        kind,
        submitted,
        blocks,
        status,
        deadlineAt,
        basis,
        c.now,
        opts.bump === false ? 0 : 1,
      ],
    );
    return rows[0] as RegRow;
  }

  private async moveTo(
    tx: Tx,
    reg: RegRow,
    to: RegistrationStatusValue,
    event: string,
    extra: { set?: string; params?: unknown[]; requestId?: string; reasonCode?: string } = {},
  ): Promise<RegRow> {
    const now = this.clock.now();
    const base = [reg.id, to, now];
    const { rows } = await tx.query<RegRow>(
      `UPDATE registration SET status = $2, updated_at = $3, version = version + 1${
        extra.set ? `, ${extra.set}` : ''
      } WHERE id = $1 RETURNING ${REG_COLUMNS}`,
      [...base, ...(extra.params ?? [])],
    );
    await recordTransition(tx, reg.id, reg.status, to, event, now, {
      ...(extra.requestId ? { requestId: extra.requestId } : {}),
      ...(extra.reasonCode ? { reasonCode: extra.reasonCode } : {}),
    });
    return rows[0] as RegRow;
  }

  /** K9: a declared registration must be updated on the portal (BR-604). */
  async requireUpdate(tx: Tx, reg: RegRow, reason: string): Promise<RegRow> {
    if (reg.status !== 'confirmed' && reg.status !== 'updated') return reg;
    return this.moveTo(tx, reg, 'needs_update', 'K9', {
      set: 'needs_update_reason = $4',
      params: [reason],
      reasonCode: reason,
    });
  }

  // ───────────────────────── image purge (C5) ─────────────────────────

  /**
   * Crypto-shredding of images (SEC C5): destroy DEK + purge_journal + c3_access_log `purge` (actor =
   * transaction actor: user, guest or system) in the same transaction; the ciphertext file is deleted after
   * COMMIT (EncryptedBlobService queue – ARC FB-S3-17). Skipped entirely under `legal_hold`.
   */
  async purgeImages(
    tx: Tx,
    reg: Pick<RegRow, 'id' | 'reservation_id'>,
    images: readonly ImageRow[],
    reason: ImageDeleteReason,
    opts: { requestId?: string; sessionId?: string; trustedDeviceId?: string } = {},
  ): Promise<number> {
    // SEC legal_hold (erd 4.7): no automatic or requested purge while a hold is set (ARC FB-S3-27 (1)).
    const hold = await tx.query<{ legal_hold: boolean }>(
      'SELECT legal_hold FROM registration WHERE id = $1',
      [reg.id],
    );
    if (hold.rows[0]?.legal_hold) return 0;
    const now = this.clock.now();
    let n = 0;
    for (const img of images) {
      if (img.deleted_at) continue;
      await this.blobs.purge(
        tx,
        {
          blobKey: img.blob_key,
          dataKeyId: img.data_key_id,
          subjectType: 'document_image',
          subjectId: img.id,
        },
        POLICY_OF[reason],
      );
      await tx.query(
        `UPDATE document_image SET deleted_at = $2, delete_reason = $3, delete_after = COALESCE(delete_after, $2)
          WHERE id = $1`,
        [img.id, now, reason],
      );
      await this.audit.recordC3Access(tx, {
        subjectType: 'document_image',
        subjectId: img.id,
        action: 'purge',
        reservationId: reg.reservation_id,
        reasonCode: reason,
        ...opts,
      });
      n++;
    }
    if (n > 0 && SUMMARY_REASONS.includes(reason)) {
      await tx.query(
        `UPDATE registration SET images_purged_at = $2, images_purge_reason = $3, updated_at = $2 WHERE id = $1`,
        [reg.id, now, reason],
      );
    }
    return n;
  }

  /** People whose images go at `confirmed`/`void`: refused, minors, never asked (BR-609, ĐK-5). */
  private noKeepDocs(docs: readonly DocRow[], consents: readonly ConsentRow[]): Set<string> {
    const out = new Set<string>();
    for (const d of docs) {
      const c = latestConsent(consents, d);
      if (d.is_minor_data || !c || c.decision === 'refused') out.add(d.id);
    }
    return out;
  }

  // ───────────────────────── K3/K4: documents ─────────────────────────

  async addDocument(
    tx: Tx,
    actor: StaffActor,
    registrationId: string,
    input: DocumentInput,
    images: readonly NormalizedImage[],
  ): Promise<RegRow> {
    let reg = await lockRegistration(tx, registrationId);
    if (!reg) throw problem('NOT_FOUND');
    if (reg.status === 'void') throw problem('INVALID_TRANSITION');
    const stay = await readStay(tx, reg.reservation_id, SYSTEM_ACTOR);
    if (!stay) throw problem('NOT_FOUND');
    const c = await this.ctx(tx);
    const docs = await documentsOf(tx, reg.id);
    const hmac = this.crypto.blindIndex(input.docNumber);
    if (docs.some((d) => d.doc_number_hmac === hmac)) throw problem('PARTY_DUPLICATE');
    if (input.partyMemberId && docs.some((d) => d.party_member_id === input.partyMemberId)) {
      throw problem('PARTY_DUPLICATE');
    }
    const hasMain = docs.some((d) => d.is_main && isComplete(d));
    if (input.isMain === true && hasMain) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'isMain', code: 'MAIN_GUEST_DUPLICATE' }],
      });
    }
    if (images.length > MAX_IMAGES_PER_PERSON) throw fileRejected('image', 'TOO_MANY_FILES');
    const isMain =
      input.isMain ??
      (!hasMain &&
        computeChecks(
          { ...input, noEntryRecord: input.noEntryRecord },
          {
            arrivalDate: stay.arrivalDate,
            departureDate: stay.departureDate,
            bookingName: stay.bookerName,
            submittedCount: 0,
            requiredCount: 1,
            isMain: true,
          },
        ).find((x) => x.code === 'name_match')?.result === 'pass');
    const docId = uuidv7();
    const minor = await this.isMinor(tx, input, stay.arrivalDate, c.today);
    // US-043 AC3 / BR-951 (BUG-R2-033): another person without `partyMemberId` → BE-A's party port matches
    // or creates the person (relationship `unknown`); not bound / undecided → the document stays unlinked.
    let memberId = input.partyMemberId;
    if (!memberId && !isMain) {
      const found = await this.party.memberForDocument(tx, {
        reservationId: reg.reservation_id,
        docNumberHmac: hmac,
        fullNameOnDoc: input.fullNameOnDoc,
        dateOfBirth: input.dateOfBirth,
        nationalityCode: input.nationalityCode,
        isMinor: minor,
        actor: { userId: actor.principal.userId, requestId: actor.requestId },
      });
      memberId = found && !docs.some((d) => d.party_member_id === found) ? found : null;
    }
    const dataKeyId = await this.crypto.createDataKey(tx, {
      purpose: 'guest_document',
      subjectId: docId,
    });
    const enc = await encryptFields(tx, this.crypto, docId, dataKeyId, input);
    const cols = Object.values(ENC_COLUMNS);
    await partyMember(
      tx.query(
        `INSERT INTO guest_document (id, organization_id, property_id, registration_id, reservation_id,
         party_member_id, doc_type, is_main, is_foreigner, is_minor_data, full_name_on_doc, nationality_code,
         gender, doc_number_last4, doc_number_hmac, capture_method, data_key_id, created_at, created_by,
         updated_at, ${cols.join(', ')})
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'manual', $16, $17, $18, $17,
         ${cols.map((_, i) => `$${19 + i}`).join(', ')})`,
        [
          docId,
          tx.ctx.organizationId,
          tx.ctx.propertyId,
          reg.id,
          reg.reservation_id,
          memberId,
          input.docType,
          isMain,
          isForeigner(input.docType, input.nationalityCode),
          minor,
          input.fullNameOnDoc,
          input.nationalityCode,
          input.gender,
          input.docNumber.slice(-4),
          hmac,
          dataKeyId,
          c.now,
          actor.principal.userId,
          ...cols.map((col) => enc[col]),
        ],
      ),
    );
    await this.storeImages(tx, reg, docId, images, 'desk', actor.principal.userId);
    await this.gate.record(tx, actor.principal, {
      subjectType: 'guest_document',
      subjectId: docId,
      action: 'create',
      reservationId: reg.reservation_id,
      requestId: actor.requestId,
    });
    reg = await this.refresh(tx, reg, { requestId: actor.requestId });
    reg = await this.requireUpdate(tx, reg, 'document_changed');
    await this.publish(tx, reg.id);
    return reg;
  }

  private async isMinor(
    tx: Tx,
    f: Pick<DocumentFields, 'dateOfBirth' | 'docType'>,
    arrival: LocalDate,
    today: LocalDate,
  ): Promise<boolean> {
    if (f.docType === 'child_personal_id') return true;
    if (!f.dateOfBirth) return false;
    const threshold = await this.params.get<number>(tx, 'minor_data_age_threshold', today);
    return ageAt(f.dateOfBirth, arrival) < threshold;
  }

  async storeImages(
    tx: Tx,
    reg: Pick<RegRow, 'id'>,
    docId: string,
    images: readonly NormalizedImage[],
    via: 'desk' | 'guest_app',
    userId: string | null,
  ): Promise<string[]> {
    const { rows } = await tx.query<{ n: number }>(
      `SELECT count(*)::int AS n FROM document_image WHERE guest_document_id = $1 AND deleted_at IS NULL`,
      [docId],
    );
    if ((rows[0]?.n ?? 0) + images.length > MAX_IMAGES_PER_PERSON) {
      throw fileRejected('image', 'TOO_MANY_FILES');
    }
    const ids: string[] = [];
    for (const image of images) {
      const id = uuidv7();
      const stored = await this.blobs.put(
        tx,
        { purpose: 'document_image', table: 'document_image', recordId: id },
        image,
      );
      await tx.query(
        `INSERT INTO document_image (id, organization_id, property_id, guest_document_id, registration_id,
           blob_key, mime, size_bytes, ciphertext_sha256, data_key_id, uploaded_via, uploaded_by, uploaded_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          id,
          tx.ctx.organizationId,
          tx.ctx.propertyId,
          docId,
          reg.id,
          stored.blobKey,
          stored.mime,
          stored.sizeBytes,
          stored.ciphertextSha256,
          stored.dataKeyId,
          via,
          userId,
          this.clock.now(),
        ],
      );
      ids.push(id);
    }
    return ids;
  }

  async updateDocument(
    tx: Tx,
    actor: StaffActor,
    registrationId: string,
    documentId: string,
    expectedVersion: number,
    input: DocumentInput,
  ): Promise<RegRow> {
    let reg = await lockRegistration(tx, registrationId);
    if (!reg) throw problem('NOT_FOUND');
    const doc = await documentById(tx, reg.id, documentId, { lock: true });
    if (!doc || doc.purged_at) throw problem('NOT_FOUND');
    assertVersion(reg.version, expectedVersion);
    if (reg.status === 'void') throw problem('INVALID_TRANSITION');
    const stay = await readStay(tx, reg.reservation_id, SYSTEM_ACTOR);
    if (!stay) throw problem('NOT_FOUND');
    const c = await this.ctx(tx);
    const docs = await documentsOf(tx, reg.id);
    const hmac = this.crypto.blindIndex(input.docNumber);
    if (docs.some((d) => d.id !== doc.id && d.doc_number_hmac === hmac)) {
      throw problem('PARTY_DUPLICATE');
    }
    if (
      input.partyMemberId &&
      docs.some((d) => d.id !== doc.id && d.party_member_id === input.partyMemberId)
    ) {
      throw problem('PARTY_DUPLICATE');
    }
    const isMain = input.isMain ?? doc.is_main;
    if (isMain && docs.some((d) => d.id !== doc.id && d.is_main && isComplete(d))) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'isMain', code: 'MAIN_GUEST_DUPLICATE' }],
      });
    }
    const enc = await encryptFields(tx, this.crypto, doc.id, doc.data_key_id, input);
    const set = encSetSql(12);
    const minor = await this.isMinor(tx, input, stay.arrivalDate, c.today);
    await partyMember(
      tx.query(
        `UPDATE guest_document SET doc_type = $2, is_main = $3, is_foreigner = $4, is_minor_data = $5,
              full_name_on_doc = $6, nationality_code = $7, gender = $8, doc_number_last4 = $9,
              doc_number_hmac = $10, party_member_id = COALESCE($11, party_member_id), ${set.sql},
              updated_at = $${12 + set.columns.length}
        WHERE id = $1`,
        [
          doc.id,
          input.docType,
          isMain,
          isForeigner(input.docType, input.nationalityCode),
          minor,
          input.fullNameOnDoc,
          input.nationalityCode,
          input.gender,
          input.docNumber.slice(-4),
          hmac,
          input.partyMemberId,
          ...set.columns.map((col) => enc[col]),
          c.now,
        ],
      ),
    );
    await this.gate.record(tx, actor.principal, {
      subjectType: 'guest_document',
      subjectId: doc.id,
      action: 'update',
      reservationId: reg.reservation_id,
      requestId: actor.requestId,
    });
    reg = await this.refresh(tx, reg, { requestId: actor.requestId });
    reg = await this.requireUpdate(tx, reg, 'document_changed');
    await this.publish(tx, reg.id);
    return reg;
  }

  // ───────────────────────── C3 reads (B3) ─────────────────────────

  /** rbac note 30 / EP06 0: a reason is needed outside the open flow of the booking. */
  private async assertReason(tx: Tx, reg: RegRow, reason: ReasonCode | null): Promise<void> {
    if (reason === 'recheck' || reason === 'guest_request' || reason === 'authority_request')
      return;
    const stay = await readStay(tx, reg.reservation_id, SYSTEM_ACTOR);
    const closed =
      AFTER_CONFIRMED.includes(reg.status) ||
      reg.status === 'void' ||
      !stay ||
      ['checked_out', 'cancelled', 'no_show'].includes(stay.status);
    if (!closed) return;
    // Outside the open flow only the three access reasons count (`registration` would bypass B4 – SEC BE-48).
    throw problem('VALIDATION_FAILED', {
      errors: [{ field: 'reason', code: reason ? 'NOT_IN_LIST' : 'REQUIRED' }],
    });
  }

  async sensitive(
    tx: Tx,
    actor: StaffActor,
    registrationId: string,
    documentId: string,
    reason: ReasonCode | null,
  ): Promise<Record<string, unknown>> {
    const reg = await readRegistration(tx, registrationId);
    if (!reg) throw problem('NOT_FOUND');
    const doc = await documentById(tx, reg.id, documentId);
    if (!doc || doc.purged_at) throw problem('NOT_FOUND');
    await this.assertReason(tx, reg, reason);
    await this.gate.record(
      tx,
      actor.principal,
      {
        subjectType: 'guest_document',
        subjectId: doc.id,
        action: 'view',
        reservationId: reg.reservation_id,
        requestId: actor.requestId,
        ...(reason ? { reasonCode: reason } : {}),
      },
      { stepUp: true },
    );
    let f: Awaited<ReturnType<typeof decryptFields>>;
    try {
      f = await decryptFields(tx, this.crypto, doc);
    } catch (err) {
      if (err instanceof DataKeyDestroyedError) throw problem('NOT_FOUND');
      throw err;
    }
    return {
      id: doc.id,
      docType: doc.doc_type,
      ...(doc.full_name_on_doc ? { fullNameOnDoc: doc.full_name_on_doc } : {}),
      docNumber: f.docNumber,
      ...(f.dateOfBirth ? { dateOfBirth: f.dateOfBirth } : {}),
      ...(doc.nationality_code ? { nationalityCode: doc.nationality_code } : {}),
      ...(f.passportIssueDate ? { passportIssueDate: f.passportIssueDate } : {}),
      ...(f.passportExpiryDate ? { passportExpiryDate: f.passportExpiryDate } : {}),
      ...(f.issuingPlace ? { issuingPlace: f.issuingPlace } : {}),
      ...(f.visaKind ? { visaKind: f.visaKind } : {}),
      ...(f.visaNumber ? { visaNumber: f.visaNumber } : {}),
      ...(f.visaValidUntil ? { visaValidUntil: f.visaValidUntil } : {}),
      ...(f.entryDate ? { entryDate: f.entryDate } : {}),
      ...(f.entryPort ? { entryPort: f.entryPort } : {}),
      ...(f.entryPurpose ? { entryPurpose: f.entryPurpose } : {}),
      ...(doc.is_foreigner ? { noEntryRecord: f.noEntryRecord } : {}),
      ...(f.address ? { address: f.address } : {}),
    };
  }

  async image(
    tx: Tx,
    actor: StaffActor,
    registrationId: string,
    documentId: string,
    imageId: string,
    reason: ReasonCode | null,
  ): Promise<{ data: Buffer; mime: string }> {
    const reg = await readRegistration(tx, registrationId);
    if (!reg) throw problem('NOT_FOUND');
    const { rows } = await tx.query<ImageRow>(
      `SELECT i.id, i.guest_document_id, i.blob_key, i.mime, i.data_key_id, i.uploaded_via, i.uploaded_at,
              i.delete_after, i.deleted_at, i.delete_reason
         FROM document_image i JOIN guest_document d ON d.id = i.guest_document_id
        WHERE i.id = $1 AND i.guest_document_id = $2 AND d.registration_id = $3 AND d.removed_at IS NULL`,
      [imageId, documentId, reg.id],
    );
    const img = rows[0];
    // E06-04: purged image → 404 and no `view` row (nothing is returned).
    if (!img || img.deleted_at) throw problem('NOT_FOUND');
    await this.assertReason(tx, reg, reason);
    await this.gate.record(
      tx,
      actor.principal,
      {
        subjectType: 'document_image',
        subjectId: img.id,
        action: 'view',
        reservationId: reg.reservation_id,
        requestId: actor.requestId,
        ...(reason ? { reasonCode: reason } : {}),
      },
      { stepUp: true },
    );
    try {
      const data = await this.blobs.read(tx, {
        table: 'document_image',
        recordId: img.id,
        blobKey: img.blob_key,
        dataKeyId: img.data_key_id,
      });
      return { data, mime: img.mime };
    } catch (err) {
      // Throwing rolls the `view` row back with the transaction.
      if (err instanceof BlobGoneError) throw problem('NOT_FOUND');
      throw err;
    }
  }

  // ───────────────────────── A74: early purge ─────────────────────────

  async purgeRequested(
    tx: Tx,
    actor: StaffActor,
    registrationId: string,
    expectedVersion: number,
    reason: 'guest_request' | 'consent_withdrawn',
  ): Promise<void> {
    const reg = await lockRegistration(tx, registrationId);
    if (!reg) throw problem('NOT_FOUND');
    assertVersion(reg.version, expectedVersion);
    if (reg.legal_hold) throw problem('INVALID_TRANSITION', { detail: 'legal hold' });
    const live = (await imagesOf(tx, reg.id)).filter((i) => !i.deleted_at);
    if (live.length === 0) throw problem('INVALID_TRANSITION', { detail: 'images already purged' });
    await this.purgeImages(tx, reg, live, reason, {
      requestId: actor.requestId,
      sessionId: actor.principal.sessionId,
      ...(actor.principal.trustedDeviceId
        ? { trustedDeviceId: actor.principal.trustedDeviceId }
        : {}),
    });
    await tx.query('UPDATE registration SET version = version + 1 WHERE id = $1', [reg.id]);
    await this.audit.record(tx, {
      category: 'data',
      action: 'registration.images_purged',
      entityType: 'registration',
      entityId: reg.id,
      after: { imagesPurgeReason: reason },
      requestId: actor.requestId,
    });
    await this.publish(tx, reg.id);
  }

  // ───────────────────────── P02b consent (US-045, ĐK-5) ─────────────────────────

  async recordConsent(
    tx: Tx,
    actor:
      { type: 'user'; userId: string; requestId: string } | { type: 'guest'; requestId: string },
    reg: RegRow,
    doc: DocRow | null,
    input: {
      decision: 'granted' | 'refused';
      noticeVersion: string;
      locale: string;
      channel: 'desk' | 'paper' | 'guest_app';
      personIndex: number | null;
      /** Days the person read in the P02b sentence (= `id_image_retention_days_after_checkout` now). */
      retentionDays: number;
    },
  ): Promise<RegRow> {
    const consents = await consentsOf(tx, reg.id);
    const current = doc
      ? latestConsent(consents, doc)
      : ([...consents].reverse().find((c) => c.person_index === input.personIndex) ?? null);
    const images = doc
      ? (await imagesOf(tx, reg.id)).filter((i) => i.guest_document_id === doc.id)
      : [];
    const declared = AFTER_CONFIRMED.includes(reg.status);
    if (input.decision === 'granted' && current?.decision === 'refused') {
      const purged = images.length > 0 && images.every((i) => i.deleted_at);
      if (declared || purged) throw problem('CONSENT_CHANGE_NOT_ALLOWED');
    }
    const now = this.clock.now();
    await tx.query(
      `INSERT INTO consent_record (id, organization_id, property_id, registration_id, guest_document_id,
         party_member_id, person_index, purpose, decision, notice_version, locale, channel, recorded_by_type,
         recorded_by, recorded_at, retention_days)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'P02B_ID_IMAGE_RETENTION', $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        uuidv7(),
        tx.ctx.organizationId,
        tx.ctx.propertyId,
        reg.id,
        doc?.id ?? null,
        doc?.party_member_id ?? null,
        doc?.person_index ?? input.personIndex,
        input.decision,
        input.noticeVersion,
        input.locale,
        input.channel,
        actor.type,
        actor.type === 'user' ? actor.userId : null,
        now,
        input.retentionDays,
      ],
    );
    let out = reg;
    if (input.decision === 'refused' && declared && doc) {
      // BR-609 (c): withdrawal after the declaration → images go now (J16 is only the safety net).
      await this.purgeImages(
        tx,
        reg,
        images,
        current?.decision === 'granted' ? 'consent_withdrawn' : 'no_consent',
        { requestId: actor.requestId },
      );
    } else if (input.decision === 'granted' && declared && doc) {
      await this.scheduleRetention(tx, reg, [doc.id]);
    }
    const { rows } = await tx.query<RegRow>(
      `UPDATE registration SET version = version + 1, updated_at = $2 WHERE id = $1 RETURNING ${REG_COLUMNS}`,
      [reg.id, now],
    );
    out = rows[0] as RegRow;
    await this.audit.record(tx, {
      category: 'data',
      action: 'consent.recorded',
      entityType: 'consent_record',
      entityId: reg.id,
      after: {
        purpose: 'P02B_ID_IMAGE_RETENTION',
        decision: input.decision,
        channel: input.channel,
      },
      requestId: actor.requestId,
    });
    await this.publish(tx, reg.id);
    return out;
  }

  /** Business date of the property (BR-010) – the consent notice parameters are read for it. */
  private async businessToday(tx: Tx): Promise<LocalDate> {
    const c = await this.ctx(tx);
    const rollover = await this.params.get<string>(tx, 'business_day_rollover', c.today);
    return businessDate(c.now, c.tz, rollover);
  }

  /** P02b days in force (same value as guest-web's OnlineCheckin.imageRetentionDays – SEC ĐK-2 17/10). */
  async retentionDaysParam(tx: Tx): Promise<number> {
    return this.params.get<number>(
      tx,
      'id_image_retention_days_after_checkout',
      await this.businessToday(tx),
    );
  }

  /**
   * `Registration.consentNotice` (OpenAPI 0.3.6 bổ sung 3, ARC 17/10): the notice version and the image
   * retention days the desk shows in the P02b sentence and sends back in `ConsentInput` – the same property
   * parameters (business date) as OnlineCheckin.currentNoticeVersion / imageRetentionDays.
   */
  async consentNotice(
    tx: Tx,
  ): Promise<{ currentNoticeVersion: string; imageRetentionDays: number }> {
    const day = await this.businessToday(tx);
    return {
      currentNoticeVersion: await this.params.get<string>(tx, 'privacy_notice_version', day),
      imageRetentionDays: await this.params.get<number>(
        tx,
        'id_image_retention_days_after_checkout',
        day,
      ),
    };
  }

  /**
   * BR-610/T02: images of consenting people are kept until the end of the stay + min(days they read,
   * days in force). `endedAt` = checkout / early departure / end by cancellation; without it nothing is
   * scheduled yet (the stay is still running).
   */
  private async scheduleRetention(
    tx: Tx,
    reg: RegRow,
    docIds: readonly string[],
    endedAt: Date | null = reg.stay_ended_at ?? reg.actual_checkout_at,
  ): Promise<void> {
    if (docIds.length === 0 || !endedAt) return;
    const param = await this.retentionDaysParam(tx);
    const consents = await consentsOf(tx, reg.id);
    const docs = (await documentsOf(tx, reg.id)).filter((d) => docIds.includes(d.id));
    let latest: Date | null = null;
    for (const d of docs) {
      const read = latestConsent(consents, d)?.retention_days ?? param;
      const until = new Date(endedAt.getTime() + Math.min(read, param) * 86_400_000);
      await tx.query(
        `UPDATE document_image SET delete_after = $2 WHERE guest_document_id = $1 AND deleted_at IS NULL`,
        [d.id, until],
      );
      if (!latest || until > latest) latest = until;
    }
    if (latest) {
      await tx.query(
        `UPDATE registration SET image_retention_until = $2,
                images_purge_scheduled_at = LEAST(COALESCE(images_purge_scheduled_at, $2), $2)
          WHERE id = $1`,
        [reg.id, latest],
      );
    }
  }

  /**
   * End of the stay (checkout, early departure, cancellation of a declaration in progress) – SEC
   * FB-R2-SEC-BE-32, SR-RET-02: EVERY live image gets a deadline. Declared (`confirmed`…): consenting
   * people → T02 (above); anyone else → now (J16 T01). Not declared: everybody → end +
   * `id_image_unconfirmed_max_days` (≤ 7); a later K7 re-schedules consenting people to T02.
   */
  private async scheduleAfterStay(tx: Tx, reg: RegRow, endedAt: Date): Promise<void> {
    await tx.query(
      'UPDATE registration SET stay_ended_at = COALESCE(stay_ended_at, $2) WHERE id = $1',
      [reg.id, endedAt],
    );
    const ended = { ...reg, stay_ended_at: reg.stay_ended_at ?? endedAt };
    const docs = await documentsOf(tx, reg.id);
    if (AFTER_CONFIRMED.includes(reg.status)) {
      const drop = this.noKeepDocs(docs, await consentsOf(tx, reg.id));
      await this.scheduleRetention(
        tx,
        ended,
        docs.filter((d) => !drop.has(d.id)).map((d) => d.id),
        ended.stay_ended_at,
      );
      await tx.query(
        `UPDATE document_image SET delete_after = LEAST(COALESCE(delete_after, $2), $2)
          WHERE registration_id = $1 AND deleted_at IS NULL AND guest_document_id = ANY($3::uuid[])`,
        [reg.id, endedAt, [...drop]],
      );
      return;
    }
    const c = await this.ctx(tx);
    const days = await this.params.get<number>(tx, 'id_image_unconfirmed_max_days', c.today);
    const until = new Date(endedAt.getTime() + days * 86_400_000);
    await tx.query(
      `UPDATE document_image SET delete_after = LEAST(COALESCE(delete_after, $2), $2)
        WHERE registration_id = $1 AND deleted_at IS NULL`,
      [reg.id, until],
    );
    await tx.query(
      `UPDATE registration SET images_purge_scheduled_at = LEAST(COALESCE(images_purge_scheduled_at, $2), $2)
        WHERE id = $1`,
      [reg.id, until],
    );
  }

  // ───────────────────────── K5 / checks ─────────────────────────

  async recordCheck(
    tx: Tx,
    actor: StaffActor,
    registrationId: string,
    documentId: string,
    code: CheckCode,
    expectedVersion: number,
    input: { manualResult: 'pass' | 'fail' | null; note: string },
  ): Promise<RegRow> {
    let reg = await lockRegistration(tx, registrationId);
    if (!reg) throw problem('NOT_FOUND');
    const doc = await documentById(tx, reg.id, documentId, { lock: true });
    if (!doc) throw problem('NOT_FOUND');
    assertVersion(reg.version, expectedVersion);
    if (['sent', 'confirmed', 'updated', 'void'].includes(reg.status))
      throw problem('INVALID_TRANSITION');
    const check = doc.check_results.find((x) => x.code === code);
    if (!check || check.result === 'pass' || check.result === 'not_applicable') {
      throw problem('INVALID_TRANSITION');
    }
    const errors: FieldError[] = [];
    if (check.result === 'unverified' && !input.manualResult) {
      errors.push({ field: 'manualResult', code: 'REQUIRED' });
    }
    if (check.result === 'fail' && input.manualResult) {
      errors.push({ field: 'manualResult', code: 'NOT_IN_LIST' });
    }
    const noteErr = checkNoteError(input.note);
    if (noteErr) errors.push({ field: 'note', code: noteErr });
    else if (this.noteIsSensitive(input.note, await documentsOf(tx, reg.id))) {
      errors.push({ field: 'note', code: 'SENSITIVE_DATA_DETECTED' });
    }
    if (errors.length) throw problem('VALIDATION_FAILED', { errors });
    const now = this.clock.now();
    const next = this.applyHandling(doc.check_results, code, {
      manualResult: input.manualResult,
      note: input.note.trim(),
      by: actor.principal.userId,
      at: now,
    });
    await tx.query('UPDATE guest_document SET check_results = $2, updated_at = $3 WHERE id = $1', [
      doc.id,
      JSON.stringify(next),
      now,
    ]);
    await this.audit.record(tx, {
      category: 'state',
      action: 'registration.check_recorded',
      entityType: 'registration',
      entityId: reg.id,
      after: { checkCode: code, manualResult: input.manualResult },
      requestId: actor.requestId,
    });
    reg = await this.refresh(tx, reg, { requestId: actor.requestId });
    await this.publish(tx, reg.id);
    return reg;
  }

  private applyHandling(
    checks: readonly StoredCheck[],
    code: CheckCode,
    h: { manualResult: 'pass' | 'fail' | null; note: string; by: string; at: Date },
  ): StoredCheck[] {
    return checks.map((x) =>
      x.code !== code
        ? x
        : {
            ...x,
            manualResult: x.result === 'unverified' ? h.manualResult : null,
            note: h.note,
            handledBy: h.by,
            handledAt: h.at.toISOString(),
            blocking: isBlocking(
              x.code,
              x.result,
              x.result === 'unverified' ? h.manualResult : null,
            ),
          },
    );
  }

  /** V-09 spirit: a handling note must not repeat the document number (blind-index comparison). */
  /**
   * A staff note must not carry document numbers or other long numbers (SEC BE-48, B-15): ≥ 6 digits in a
   * row after removing spaces/dots/dashes, or any window matching (blind index) a number of ANY document of
   * this declaration – separators and prefixes do not hide it.
   */
  private noteIsSensitive(note: string, docs: readonly DocRow[]): boolean {
    if (hasLongDigitRun(note)) return true;
    const hmacs = new Set(docs.map((d) => d.doc_number_hmac).filter((h): h is string => !!h));
    const last4s = new Set(docs.map((d) => d.doc_number_last4).filter((l): l is string => !!l));
    if (hmacs.size === 0) return false;
    return docNumberCandidates(note, last4s).some((t) => hmacs.has(this.crypto.blindIndex(t)));
  }

  async completeReview(
    tx: Tx,
    actor: StaffActor,
    registrationId: string,
    expectedVersion: number,
    notes: ReadonlyArray<{
      documentId: string;
      checkCode: CheckCode;
      note: string;
      manualResult: 'pass' | 'fail' | null;
    }>,
  ): Promise<RegRow> {
    let reg = await lockRegistration(tx, registrationId);
    if (!reg) throw problem('NOT_FOUND');
    assertVersion(reg.version, expectedVersion);
    if (reg.status !== 'review') throw problem('INVALID_TRANSITION');
    const now = this.clock.now();
    const docs = await documentsOf(tx, reg.id);
    const errors: FieldError[] = [];
    // Apply the notes sent with the request (all errors at once).
    for (const [i, n] of notes.entries()) {
      const doc = docs.find((d) => d.id === n.documentId);
      const check = doc?.check_results.find((x) => x.code === n.checkCode);
      if (!doc || !check || (check.result !== 'fail' && check.result !== 'unverified')) {
        errors.push({ field: `warningNotes[${i}].checkCode`, code: 'NOT_IN_LIST' });
        continue;
      }
      const noteErr = checkNoteError(n.note);
      if (noteErr) errors.push({ field: `warningNotes[${i}].note`, code: noteErr });
      else if (this.noteIsSensitive(n.note, docs)) {
        errors.push({ field: `warningNotes[${i}].note`, code: 'SENSITIVE_DATA_DETECTED' });
      }
      if (check.result === 'fail' && n.manualResult) {
        errors.push({ field: `warningNotes[${i}].manualResult`, code: 'NOT_IN_LIST' });
      }
      if (check.result === 'unverified' && !n.manualResult && !check.manualResult) {
        errors.push({ field: `warningNotes[${i}].manualResult`, code: 'REQUIRED' });
      }
      if (errors.length === 0) {
        doc.check_results = this.applyHandling(doc.check_results, n.checkCode, {
          manualResult: n.manualResult ?? check.manualResult,
          note: n.note.trim(),
          by: actor.principal.userId,
          at: now,
        });
      }
    }
    if (errors.length) throw problem('VALIDATION_FAILED', { errors });
    // Every fail/unverified item handled (note; manual result for unverified) – US-044 AC4.
    for (const doc of docs.filter(isComplete)) {
      for (const x of doc.check_results) {
        if (x.result !== 'fail' && x.result !== 'unverified') continue;
        if (!x.note || (x.result === 'unverified' && !x.manualResult)) {
          errors.push({
            field: `documents[${doc.id}].checks.${x.code}`,
            code: 'CHECK_NOTE_REQUIRED',
          });
        }
      }
    }
    if (errors.length) throw problem('VALIDATION_FAILED', { errors });
    // Enough people + a P02b decision for everybody with images (minors excluded) – K5.
    const missing: FieldError[] = [];
    if (reg.submitted_count < reg.required_count) {
      missing.push({ field: 'party_count', code: 'REGISTRATION_INCOMPLETE' });
    }
    const consents = await consentsOf(tx, reg.id);
    const images = await imagesOf(tx, reg.id);
    for (const doc of docs) {
      const hasImages = images.some((i) => i.guest_document_id === doc.id);
      if (hasImages && !doc.is_minor_data && !latestConsent(consents, doc)) {
        missing.push({ field: `documents[${doc.id}].imageConsent`, code: 'REQUIRED' });
      }
    }
    if (missing.length) throw problem('REGISTRATION_INCOMPLETE', { errors: missing });
    for (const doc of docs) {
      await tx.query(
        'UPDATE guest_document SET check_results = $2, updated_at = $3 WHERE id = $1',
        [doc.id, JSON.stringify(doc.check_results), now],
      );
    }
    reg = await this.refresh(tx, reg, { requestId: actor.requestId, bump: false });
    reg = await this.moveTo(tx, reg, 'scanned', 'K5', { requestId: actor.requestId });
    await this.publish(tx, reg.id);
    return reg;
  }

  // ───────────────────────── K6…K10 ─────────────────────────

  async transition(
    tx: Tx,
    actor: StaffActor,
    registrationId: string,
    transition: 'mark-sent' | 'mark-confirmed' | 'mark-rejected' | 'mark-updated',
    expectedVersion: number,
    body: {
      portalReference?: string | undefined;
      kind?: string | undefined;
      rejectedReason?: string | undefined;
      actualDepartureDate?: string | undefined;
    },
  ): Promise<RegRow> {
    let reg = await lockRegistration(tx, registrationId);
    if (!reg) throw problem('NOT_FOUND');
    assertVersion(reg.version, expectedVersion);
    const now = this.clock.now();
    const rid = { requestId: actor.requestId };
    switch (transition) {
      case 'mark-sent': {
        if (reg.status !== 'scanned') throw problem('INVALID_TRANSITION');
        const ref = (body.portalReference ?? '').trim();
        if (!/^[A-Za-z0-9\-/._]{3,64}$/.test(ref)) {
          throw problem('VALIDATION_FAILED', {
            errors: [{ field: 'portalReference', code: 'PORTAL_REFERENCE_REQUIRED' }],
          });
        }
        const kinds =
          reg.kind === 'mixed'
            ? (['foreigner_temp_residence', 'vn_citizen_stay'] as const)
            : ([reg.kind ?? 'vn_citizen_stay'] as const);
        let kind = body.kind ?? (reg.kind === 'mixed' ? undefined : kinds[0]);
        if (!kind) {
          throw problem('VALIDATION_FAILED', { errors: [{ field: 'kind', code: 'REQUIRED' }] });
        }
        if (!(kinds as readonly string[]).includes(kind)) {
          throw problem('VALIDATION_FAILED', { errors: [{ field: 'kind', code: 'NOT_IN_LIST' }] });
        }
        kind = kind as (typeof kinds)[number];
        await tx.query(
          `INSERT INTO registration_portal_submission (id, organization_id, property_id, registration_id, kind,
             reference, sent_at, sent_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (registration_id, kind) DO UPDATE SET reference = EXCLUDED.reference,
             sent_at = EXCLUDED.sent_at, sent_by = EXCLUDED.sent_by`,
          [
            uuidv7(),
            tx.ctx.organizationId,
            tx.ctx.propertyId,
            reg.id,
            kind,
            ref,
            now,
            actor.principal.userId,
          ],
        );
        // After a rejection (K8) every block is declared again: only submissions newer than the last send.
        const { rows } = await tx.query<{ kind: string; reference: string }>(
          `SELECT kind, reference FROM registration_portal_submission WHERE registration_id = $1
              AND sent_at > COALESCE($2::timestamptz, '-infinity'::timestamptz)`,
          [reg.id, reg.sent_at && reg.rejected_reason ? reg.sent_at : null],
        );
        const done = kinds.every((k) => rows.some((r) => r.kind === k));
        if (!done) {
          const r = await tx.query<RegRow>(
            `UPDATE registration SET version = version + 1, updated_at = $2 WHERE id = $1 RETURNING ${REG_COLUMNS}`,
            [reg.id, now],
          );
          reg = r.rows[0] as RegRow;
          break;
        }
        // erd 4.7: portal_reference = the foreigner block's code for a mixed declaration.
        const main =
          reg.kind === 'mixed'
            ? (rows.find((r) => r.kind === 'foreigner_temp_residence')?.reference ?? ref)
            : ref;
        reg = await this.moveTo(tx, reg, 'sent', 'K6', {
          set: 'sent_at = $4, sent_by = $5, portal_reference = COALESCE($6, portal_reference), rejected_reason = NULL',
          params: [now, actor.principal.userId, main],
          ...rid,
        });
        break;
      }
      case 'mark-confirmed': {
        if (reg.status !== 'sent') throw problem('INVALID_TRANSITION');
        reg = await this.moveTo(tx, reg, 'confirmed', 'K7', {
          set: 'confirmed_at = $4',
          params: [now],
          ...rid,
        });
        await this.applyConfirmedRetention(tx, reg, actor.requestId);
        break;
      }
      case 'mark-rejected': {
        if (reg.status !== 'sent') throw problem('INVALID_TRANSITION');
        const reason = (body.rejectedReason ?? '').trim().replace(/\s+/g, ' ');
        if (reason.length < 3 || reason.length > 500) {
          throw problem('VALIDATION_FAILED', {
            errors: [{ field: 'rejectedReason', code: 'REASON_REQUIRED' }],
          });
        }
        if (containsCardNumber(reason)) {
          throw problem('CARD_NUMBER_DETECTED', {
            errors: [{ field: 'rejectedReason', code: 'CARD_NUMBER_DETECTED' }],
          });
        }
        if (this.noteIsSensitive(reason, await documentsOf(tx, reg.id))) {
          throw problem('VALIDATION_FAILED', {
            errors: [{ field: 'rejectedReason', code: 'SENSITIVE_DATA_DETECTED' }],
          });
        }
        reg = await this.moveTo(tx, reg, 'scanned', 'K8', {
          set: 'rejected_reason = $4',
          params: [reason],
          ...rid,
        });
        break;
      }
      case 'mark-updated': {
        if (reg.status !== 'needs_update') throw problem('INVALID_TRANSITION');
        const d = body.actualDepartureDate;
        const stay = await readStay(tx, reg.reservation_id, SYSTEM_ACTOR);
        if (!d) {
          throw problem('VALIDATION_FAILED', {
            errors: [{ field: 'actualDepartureDate', code: 'REQUIRED' }],
          });
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || (stay && d < stay.arrivalDate)) {
          throw problem('VALIDATION_FAILED', {
            errors: [{ field: 'actualDepartureDate', code: 'DATE_INVALID' }],
          });
        }
        reg = await this.moveTo(tx, reg, 'updated', 'K10', {
          set: 'actual_departure_date = $4, updated_at_portal = $5, needs_update_reason = NULL',
          params: [d, now],
          ...rid,
        });
        break;
      }
    }
    await this.publish(tx, reg.id);
    return reg;
  }

  /** K7 consequences: images of people who did not consent go now; consenting people get T02. */
  private async applyConfirmedRetention(tx: Tx, reg: RegRow, requestId?: string): Promise<void> {
    const docs = await documentsOf(tx, reg.id);
    const consents = await consentsOf(tx, reg.id);
    const images = await imagesOf(tx, reg.id);
    const drop = this.noKeepDocs(docs, consents);
    const dropImages = images.filter((i) => drop.has(i.guest_document_id) && !i.deleted_at);
    // Images of documents no longer live (person removed) never stay either.
    const orphan = images.filter(
      (i) => !i.deleted_at && !docs.some((d) => d.id === i.guest_document_id),
    );
    await this.purgeImages(tx, reg, [...dropImages, ...orphan], 'no_consent', {
      ...(requestId ? { requestId } : {}),
    });
    await this.scheduleRetention(
      tx,
      reg,
      docs.filter((d) => !drop.has(d.id)).map((d) => d.id),
    );
  }

  // ───────────────────────── K6 data (E1) ─────────────────────────

  async portalData(
    tx: Tx,
    actor: StaffActor,
    registrationId: string,
    kindParam: 'foreigner_temp_residence' | 'vn_citizen_stay' | null,
  ): Promise<Record<string, unknown>> {
    const reg = await readRegistration(tx, registrationId);
    if (!reg) throw problem('NOT_FOUND');
    if (reg.status !== 'scanned' && reg.status !== 'needs_update')
      throw problem('INVALID_TRANSITION');
    let kind = kindParam;
    if (reg.kind === 'mixed' && !kind) {
      throw problem('VALIDATION_FAILED', { errors: [{ field: 'kind', code: 'REQUIRED' }] });
    }
    kind ??=
      reg.kind === 'foreigner_temp_residence' ? 'foreigner_temp_residence' : 'vn_citizen_stay';
    const stay = await readStay(tx, reg.reservation_id, SYSTEM_ACTOR);
    if (!stay) throw problem('NOT_FOUND');
    const docs = (await documentsOf(tx, reg.id)).filter(
      (d) => isComplete(d) && d.is_foreigner === (kind === 'foreigner_temp_residence'),
    );
    if (docs.length === 0) {
      throw problem('VALIDATION_FAILED', { errors: [{ field: 'kind', code: 'NOT_IN_LIST' }] });
    }
    // E1: one `view` row per call, BEFORE the data (failure → 503, nothing returned).
    await this.gate.record(
      tx,
      actor.principal,
      {
        subjectType: 'portal_data',
        subjectId: reg.id,
        action: 'view',
        reservationId: reg.reservation_id,
        requestId: actor.requestId,
      },
      { stepUp: true },
    );
    // DOM S3-5 [GIẢ ĐỊNH – chờ INV, ESC-018]: formats are parameters; "Ngày đến" = calendar date (property
    // time) of the ACTUAL check-in (BR-602, BR-417 (4), DOM BE-22), the booking's date before check-in.
    const c = await this.ctx(tx);
    const format: PortalFormat = {
      date: await this.params.get<PortalFormat['date']>(tx, 'portal_date_format', c.today),
      nationality: await this.params.get<PortalFormat['nationality']>(
        tx,
        'portal_nationality_format',
        c.today,
      ),
    };
    const checkedInAt = reg.actual_checkin_at ?? stay.actualCheckinAt;
    const arrivalDate = checkedInAt ? localDate(checkedInAt, c.tz) : stay.arrivalDate;
    const people: Array<{ fields: PortalField[] }> = [];
    for (const doc of docs) {
      let f: Awaited<ReturnType<typeof decryptFields>>;
      try {
        f = await decryptFields(tx, this.crypto, doc);
      } catch (err) {
        // Purged meanwhile (DEK destroyed): nothing to return – 404, never 500 (ARC FB-S3-27 (4)).
        if (err instanceof DataKeyDestroyedError) throw problem('NOT_FOUND');
        throw err;
      }
      people.push({
        fields: portalFields(
          kind,
          {
            fullNameOnDoc: doc.full_name_on_doc,
            dateOfBirth: f.dateOfBirth,
            gender: doc.gender,
            nationalityCode: doc.nationality_code,
            docNumber: f.docNumber,
            passportExpiryDate: f.passportExpiryDate,
            visaKind: f.visaKind,
            visaNumber: f.visaNumber,
            visaValidUntil: f.visaValidUntil,
            entryDate: f.entryDate,
            entryPort: f.entryPort,
            entryPurpose: f.entryPurpose,
            address: f.address,
            arrivalDate,
            departureDate: reg.actual_departure_date ?? stay.departureDate,
            roomNo: stay.roomNo,
          },
          format,
        ),
      });
    }
    return {
      kind,
      portalUrl: this.portalUrls[kind],
      people,
      clipboardText: portalClipboard(people),
    };
  }

  // ───────────────────────── reads (DTO) ─────────────────────────

  /**
   * listRegistrations without reading the reservations tables (ARC FB-S3-15 (e)): candidate registrations
   * come from this module, booking facts through BE-A's stay-view port. Open registrations of a property are
   * tens of rows, so the "action needed" filter + order by arrival run in memory over at most OPEN_CAP rows;
   * `all` pages by registration id (keyset in SQL). Read-only (no backfill here – J16 does it).
   */
  async list(
    tx: Tx,
    view: 'action_needed' | 'needs_update' | 'all',
    cursor: [string, string] | null,
    limit: number,
  ): Promise<{ rows: Array<Record<string, unknown>>; keys: Array<[string, string]> }> {
    const c = await this.ctx(tx);
    const deadline = await this.deadlineParams(tx, c.today).catch(() => null);
    if (view === 'all') {
      const { rows } = await tx.query<RegRow>(
        `SELECT ${REG_COLUMNS} FROM registration WHERE ($1::uuid IS NULL OR id > $1::uuid)
          ORDER BY id LIMIT $2`,
        [cursor?.[1] ?? null, limit + 1],
      );
      const stays = await readStays(
        tx,
        rows.map((r) => r.reservation_id),
        SYSTEM_ACTOR,
      );
      return {
        rows: rows.map((reg) =>
          this.summary(reg, stays.get(reg.reservation_id) ?? null, c, deadline),
        ),
        keys: rows.map((r) => [r.id, r.id]),
      };
    }
    const statuses =
      view === 'needs_update'
        ? ['needs_update']
        : ['none', 'pre', 'partial', 'review', 'scanned', 'sent'];
    const { rows } = await tx.query<RegRow>(
      `SELECT ${REG_COLUMNS} FROM registration WHERE status = ANY($1::text[]) ORDER BY id LIMIT $2`,
      [statuses, OPEN_CAP],
    );
    const stays = await readStays(
      tx,
      rows.map((r) => r.reservation_id),
      SYSTEM_ACTOR,
    );
    const visible = rows
      .map((reg) => ({ reg, stay: stays.get(reg.reservation_id) ?? null }))
      .filter(
        ({ stay }) =>
          view === 'needs_update' ||
          (!!stay &&
            (stay.status === 'in_house' ||
              (stay.status === 'confirmed' && stay.arrivalDate <= c.today))),
      )
      .map((x) => ({
        ...x,
        key: [x.stay?.arrivalDate ?? '9999-12-31', x.reg.id] as [string, string],
      }))
      .sort((a, b) =>
        a.key[0] < b.key[0] ? -1 : a.key[0] > b.key[0] ? 1 : a.key[1] < b.key[1] ? -1 : 1,
      )
      .filter(
        (x) => !cursor || x.key[0] > cursor[0] || (x.key[0] === cursor[0] && x.key[1] > cursor[1]),
      )
      .slice(0, limit + 1);
    return {
      rows: visible.map((x) => this.summary(x.reg, x.stay, c, deadline)),
      keys: visible.map((x) => x.key),
    };
  }

  private summary(
    reg: RegRow,
    stay: StayView | null,
    c: Ctx,
    deadline: DeadlineParams | null,
  ): Record<string, unknown> {
    let deadlineAt = reg.deadline_at;
    // AC3: the deadline of an undeclared registration follows the parameters in force (read time).
    if (
      reg.actual_checkin_at &&
      deadline &&
      !['sent', 'confirmed', 'updated', 'void'].includes(reg.status)
    ) {
      deadlineAt = registrationDeadline(reg.actual_checkin_at, c.tz, reg.kind, deadline).at;
    }
    const label = deadlineLabel(
      reg.status as RegistrationStatusValue,
      deadlineAt,
      !!reg.actual_checkin_at,
      c.now,
    );
    return {
      id: reg.id,
      reservationId: reg.reservation_id,
      reservationCode: stay?.code ?? '',
      ...(stay?.roomNo ? { roomNo: stay.roomNo } : {}),
      ...(stay ? { guestDisplayName: stay.bookerName, arrivalDate: stay.arrivalDate } : {}),
      kind: reg.kind ?? 'unknown',
      status: reg.status,
      requiredCount: reg.required_count,
      submittedCount: reg.submitted_count,
      ...(deadlineAt ? { deadlineAt: toZonedIso(deadlineAt, c.tz) } : {}),
      deadlineLabel: label,
      isOverdue: label === 'overdue',
    };
  }

  async view(tx: Tx, current: RegRow): Promise<Record<string, unknown>> {
    // Always the committed-so-far state of this transaction (side effects may have updated the row).
    const reg = (await readRegistration(tx, current.id)) ?? current;
    const c = await this.ctx(tx);
    const stay = await readStay(tx, reg.reservation_id, SYSTEM_ACTOR);
    const deadline = await this.deadlineParams(tx, c.today).catch(() => null);
    const docs = await documentsOf(tx, reg.id);
    const images = await imagesOf(tx, reg.id);
    const consents = await consentsOf(tx, reg.id);
    const iso = (d: Date | null) => (d ? toZonedIso(d, c.tz) : undefined);
    const userIds = [
      ...new Set(docs.flatMap((d) => d.check_results.map((x) => x.handledBy)).filter(Boolean)),
    ] as string[];
    const names = new Map<string, string>();
    if (userIds.length) {
      const { rows } = await tx.query<{ id: string; display_name: string }>(
        'SELECT id, display_name FROM app_user WHERE id = ANY($1::uuid[])',
        [userIds],
      );
      for (const r of rows) names.set(r.id, r.display_name);
    }
    const { rows: subs } = await tx.query<{
      kind: string;
      reference: string;
      sent_at: Date;
      display_name: string | null;
    }>(
      `SELECT s.kind, s.reference, s.sent_at, u.display_name FROM registration_portal_submission s
         LEFT JOIN app_user u ON u.id = s.sent_by WHERE s.registration_id = $1 ORDER BY s.kind`,
      [reg.id],
    );
    const o = await onlineCheckinSummary(tx, reg.reservation_id);
    const liveImages = images.filter((i) => !i.deleted_at);
    const scheduled = liveImages
      .map((i) => i.delete_after)
      .filter((d): d is Date => !!d)
      .sort((a, b) => a.getTime() - b.getTime())[0];
    const documents = docs.map((d) => {
      const own = liveImages.filter((i) => i.guest_document_id === d.id);
      const purgeAt = own
        .map((i) => i.delete_after)
        .filter((x): x is Date => !!x)
        .sort((a, b) => a.getTime() - b.getTime())[0];
      const consent = d.is_minor_data ? null : latestConsent(consents, d);
      return {
        id: d.id,
        ...(d.party_member_id ? { partyMemberId: d.party_member_id } : {}),
        docType: d.doc_type,
        isMain: d.is_main,
        ...(d.full_name_on_doc ? { fullNameOnDoc: d.full_name_on_doc } : {}),
        ...(d.nationality_code ? { nationalityCode: d.nationality_code } : {}),
        docNumberLast4: d.doc_number_last4 ?? '',
        imageIds: own.map((i) => i.id),
        ...(purgeAt ? { imagePurgeAt: iso(purgeAt) } : {}),
        imageConsent: consent?.decision ?? 'not_recorded',
        captureMethod: d.capture_method,
        checks: d.check_results.map((x) => ({
          code: x.code,
          result: x.result,
          blocking: x.blocking,
          manualResult: x.manualResult,
          ...(x.note ? { handledNote: x.note } : {}),
          ...(x.handledBy && names.get(x.handledBy)
            ? { handledByName: names.get(x.handledBy) }
            : {}),
          ...(x.handledAt ? { handledAt: toZonedIso(new Date(x.handledAt), c.tz) } : {}),
        })),
      };
    });
    return {
      ...this.summary(reg, stay, c, deadline),
      ...(reg.portal_reference ? { portalReference: reg.portal_reference } : {}),
      ...(reg.sent_at ? { sentAt: iso(reg.sent_at) } : {}),
      ...(reg.confirmed_at ? { confirmedAt: iso(reg.confirmed_at) } : {}),
      documents,
      ...(reg.image_retention_until ? { imageRetentionUntil: iso(reg.image_retention_until) } : {}),
      consentNotice: await this.consentNotice(tx),
      blocksDoorCode: reg.blocks_door_code,
      ...(scheduled ? { imagesPurgeScheduledAt: iso(scheduled) } : {}),
      ...(reg.images_purged_at ? { imagesPurgedAt: iso(reg.images_purged_at) } : {}),
      ...(reg.images_purge_reason ? { imagesPurgeReason: reg.images_purge_reason } : {}),
      portalReferences: subs.map((s) => ({
        kind: s.kind,
        reference: s.reference,
        sentAt: iso(s.sent_at),
        ...(s.display_name ? { sentByName: s.display_name } : {}),
      })),
      onlineCheckin: o
        ? {
            ...(o.completedAt ? { completedAt: iso(o.completedAt) } : {}),
            ...(o.etaTime ? { etaTime: o.etaTime } : {}),
            lateArrival: o.lateArrival,
            ...(o.arrivalNote ? { arrivalNote: o.arrivalNote } : {}),
            uploadedCount: docs.filter((d) => d.capture_method === 'guest_upload').length,
            requiredCount: reg.required_count,
            deferredPeople: o.deferredPeople,
          }
        : null,
      allowedActions: allowedActions(reg.status),
      version: reg.version,
    };
  }

  // ───────────────────────── booking life cycle (port + hooks) ─────────────────────────

  async onCheckedIn(tx: Tx, reservationId: string, at: Date): Promise<Date | null> {
    await this.ensure(tx, reservationId);
    const reg = await lockRegistrationOfReservation(tx, reservationId);
    if (!reg) return null;
    await tx.query('UPDATE registration SET actual_checkin_at = $2 WHERE id = $1', [reg.id, at]);
    const out = await this.refresh(tx, { ...reg, actual_checkin_at: at });
    await this.publish(tx, reg.id);
    return out.deadline_at;
  }

  async deadlinePreview(tx: Tx, reservationId: string, at: Date): Promise<Date | null> {
    const reg = await this.ensure(tx, reservationId);
    const c = await this.ctx(tx);
    const p = await this.deadlineParams(tx, c.today).catch(() => null);
    if (!p) return null;
    return registrationDeadline(at, c.tz, reg?.kind ?? null, p).at;
  }

  async onCheckInUndone(tx: Tx, reservationId: string): Promise<void> {
    await tx.query(
      `UPDATE registration SET actual_checkin_at = NULL, deadline_at = NULL, deadline_basis = NULL,
              version = version + 1 WHERE reservation_id = $1`,
      [reservationId],
    );
  }

  async onCheckedOut(tx: Tx, reservationId: string, at: Date): Promise<void> {
    const reg = await lockRegistrationOfReservation(tx, reservationId);
    if (!reg) return;
    await tx.query(
      `UPDATE registration SET actual_checkout_at = $2, updated_at = $3, version = version + 1 WHERE id = $1`,
      [reg.id, at, this.clock.now()],
    );
    const updated = { ...reg, actual_checkout_at: at };
    // E4 / SR-RET-06: the visa reminder date is not kept after the stay.
    await tx.query('UPDATE guest_document SET visa_alert_on = NULL WHERE registration_id = $1', [
      reg.id,
    ]);
    // SEC BE-32: every live image gets its deadline now, whatever the declaration status.
    await this.scheduleAfterStay(tx, updated, at);
    if (AFTER_CONFIRMED.includes(reg.status)) {
      const docs = await documentsOf(tx, reg.id);
      if (docs.some((d) => d.is_foreigner)) await this.requireUpdate(tx, updated, 'departure');
    }
    // SEC I5: penalty evidence of the stay is kept 12 months from checkout.
    await this.attachments?.setRetentionAnchor(
      tx,
      { reservationId, purpose: 'penalty_evidence' },
      at,
    );
    await this.publish(tx, reg.id);
  }

  async onDepartureChanged(tx: Tx, reservationId: string): Promise<void> {
    let reg = await lockRegistrationOfReservation(tx, reservationId);
    if (!reg) return;
    reg = await this.refresh(tx, reg);
    const docs = await documentsOf(tx, reg.id);
    if (docs.some((d) => d.is_foreigner)) await this.requireUpdate(tx, reg, 'departure');
    await this.publish(tx, reg.id);
  }

  async onPartyChanged(tx: Tx, reservationId: string, personsTotal?: number): Promise<void> {
    let reg = await lockRegistrationOfReservation(tx, reservationId);
    if (!reg) return;
    const persons = personsTotal ?? (await readStay(tx, reservationId, SYSTEM_ACTOR))?.personsTotal;
    if (persons === undefined || persons === reg.required_count) {
      reg = await this.refresh(tx, reg);
      await this.publish(tx, reg.id);
      return;
    }
    const grew = persons > reg.required_count;
    await tx.query('UPDATE registration SET required_count = $2 WHERE id = $1', [reg.id, persons]);
    reg = await this.refresh(tx, { ...reg, required_count: persons });
    if (grew) reg = await this.requireUpdate(tx, reg, 'party_added');
    await this.publish(tx, reg.id);
  }

  /** A-38: the removed person's C3 is destroyed now (DEK of the document and of each image). */
  async onPartyMemberRemoved(tx: Tx, reservationId: string, memberId: string): Promise<void> {
    let reg = await lockRegistrationOfReservation(tx, reservationId);
    if (!reg) return;
    const docs = (await documentsOf(tx, reg.id)).filter(
      (d) => d.party_member_id === memberId || d.id === memberId,
    );
    if (docs.length === 0) return;
    const images = await imagesOf(tx, reg.id);
    const now = this.clock.now();
    for (const d of docs) {
      await this.purgeImages(
        tx,
        reg,
        images.filter((i) => i.guest_document_id === d.id),
        'party_removed',
      );
      await this.destroyDocumentFields(tx, d, 'party_removed', now);
      await tx.query('UPDATE guest_document SET removed_at = $2 WHERE id = $1', [d.id, now]);
      await this.audit.recordC3Access(tx, {
        subjectType: 'guest_document',
        subjectId: d.id,
        action: 'delete',
        reservationId,
      });
    }
    reg = await this.refresh(tx, reg);
    reg = await this.requireUpdate(tx, reg, 'party_removed');
    await this.publish(tx, reg.id);
  }

  async destroyDocumentFields(tx: Tx, d: DocRow, policyKey: string, now: Date): Promise<void> {
    await this.crypto.destroy(tx, d.data_key_id, {
      subjectType: 'guest_document',
      subjectId: d.id,
      policyKey,
    });
    const set = Object.values(ENC_COLUMNS)
      .map((c) => `${c} = NULL`)
      .join(', ');
    await tx.query(
      `UPDATE guest_document SET ${set}, doc_number_hmac = NULL, visa_alert_on = NULL, purged_at = $2
        WHERE id = $1`,
      [d.id, now],
    );
    await tx.query(
      `INSERT INTO purge_journal (organization_id, property_id, subject_type, subject_id, policy_key, action,
         purged_at)
       VALUES ($1, $2, 'guest_document', $3, $4, 'null_columns', $5)`,
      [tx.ctx.organizationId, tx.ctx.propertyId, d.id, policyKey, now],
    );
  }

  /** K11 + BR-609 (b): cancelled / no-show before the declaration → void, images destroyed now. */
  async onReservationVoided(tx: Tx, reservationId: string): Promise<void> {
    const reg = await lockRegistrationOfReservation(tx, reservationId);
    if (!reg) return;
    await tx.query('UPDATE guest_document SET visa_alert_on = NULL WHERE registration_id = $1', [
      reg.id,
    ]);
    if (!VOIDABLE.includes(reg.status)) {
      // Cancelled / no-show while `sent` (or after): no void, but the images still get a deadline (SEC BE-32).
      if (reg.status !== 'void') await this.scheduleAfterStay(tx, reg, this.clock.now());
      return;
    }
    const now = this.clock.now();
    const out = await this.moveTo(tx, reg, 'void', 'K11', { set: 'voided_at = $4', params: [now] });
    const images = await imagesOf(tx, reg.id);
    await this.purgeImages(tx, out, images, 'void');
    await this.publish(tx, reg.id);
  }

  /** K12: restore of a no-show reuses the record; images purged at K11 are NOT restored. */
  async onReservationRestored(tx: Tx, reservationId: string): Promise<void> {
    const reg = await lockRegistrationOfReservation(tx, reservationId);
    if (!reg || reg.status !== 'void') return;
    const out = await this.moveTo(tx, reg, 'none', 'K12', { set: 'voided_at = NULL' });
    await this.refresh(tx, out);
    await this.publish(tx, reg.id);
  }

  /**
   * BUG-R2-037 (BR-605, US-050 AC2): earliest visa / temporary-residence validity of the foreign documents of
   * the booking – read inside the transaction for the soft block of a new departure (never returned to a
   * client, never logged: the caller only compares dates). Null = no foreign document with a validity.
   */
  async earliestVisaValidUntil(tx: Tx, reservationId: string): Promise<string | null> {
    const { rows } = await tx.query<{ id: string }>(
      'SELECT id FROM registration WHERE reservation_id = $1',
      [reservationId],
    );
    const regId = rows[0]?.id;
    if (!regId) return null;
    let earliest: string | null = null;
    for (const doc of (await documentsOf(tx, regId)).filter(isComplete)) {
      if (!doc.is_foreigner) continue;
      const f = await decryptFields(tx, this.crypto, doc);
      if (f.visaValidUntil && (earliest === null || f.visaValidUntil < earliest)) {
        earliest = f.visaValidUntil;
      }
    }
    return earliest;
  }

  async checkinDocumentStatus(tx: Tx, reservationId: string) {
    const reg = await this.ensure(tx, reservationId);
    if (!reg) {
      return {
        mainGuestDocument: false,
        documentCheckBlock: false,
        pendingOnlineCheckin: false,
        visaExpiresBeforeDeparture: false,
        passportExpiresDuringStay: false,
      };
    }
    const docs = await documentsOf(tx, reg.id);
    const complete = docs.filter(isComplete);
    const has = (code: CheckCode, pred: (r: StoredCheck) => boolean) =>
      complete.some((d) => d.check_results.some((x) => x.code === code && pred(x)));
    return {
      mainGuestDocument:
        !OPEN_STATUSES.slice(0, 2).includes(reg.status) &&
        reg.status !== 'void' &&
        complete.some((d) => d.is_main),
      documentCheckBlock: reg.blocks_door_code,
      pendingOnlineCheckin: docs.some((d) => d.capture_method === 'guest_upload' && !isComplete(d)),
      visaExpiresBeforeDeparture: has('visa_valid_through_departure', (x) => x.result === 'fail'),
      passportExpiresDuringStay: has(
        'passport_valid_through_departure',
        (x) => x.result === 'fail',
      ),
    };
  }

  // ───────────────────────── guest-web uploads (K2) ─────────────────────────

  /**
   * uploadGuestDocument: the document of person `personIndex` (created on first upload, captureMethod
   * guest_upload, no fields – the desk enters them). A new upload for the same person REPLACES the old
   * images (DEK destroyed in the same transaction – E06-07).
   */
  async guestUpload(
    tx: Tx,
    reservationId: string,
    personIndex: number,
    docType: DocumentFields['docType'],
    images: readonly NormalizedImage[],
    requestId: string,
  ): Promise<RegRow> {
    await this.ensure(tx, reservationId);
    let reg = await lockRegistrationOfReservation(tx, reservationId);
    if (!reg) throw problem('NOT_FOUND');
    const docs = await documentsOf(tx, reg.id);
    let doc = docs.find((d) => d.person_index === personIndex) ?? null;
    const now = this.clock.now();
    if (doc && isComplete(doc)) {
      // The desk already entered this person: the online flow is closed for them.
      throw problem('ONLINE_CHECKIN_CLOSED');
    }
    if (doc) {
      const old = (await imagesOf(tx, reg.id)).filter(
        (i) => i.guest_document_id === doc?.id && !i.deleted_at,
      );
      await this.purgeImages(tx, reg, old, 'replaced', { requestId });
      await tx.query('UPDATE guest_document SET doc_type = $2, updated_at = $3 WHERE id = $1', [
        doc.id,
        docType,
        now,
      ]);
    } else {
      const id = uuidv7();
      const dataKeyId = await this.crypto.createDataKey(tx, {
        purpose: 'guest_document',
        subjectId: id,
      });
      await tx.query(
        `INSERT INTO guest_document (id, organization_id, property_id, registration_id, reservation_id,
           person_index, doc_type, is_main, is_foreigner, capture_method, data_key_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'guest_upload', $10, $11, $11)`,
        [
          id,
          tx.ctx.organizationId,
          tx.ctx.propertyId,
          reg.id,
          reservationId,
          personIndex,
          docType,
          personIndex === 1,
          docType === 'passport',
          dataKeyId,
          now,
        ],
      );
      doc = { id, person_index: personIndex } as DocRow;
    }
    await this.storeImages(tx, reg, doc.id, images, 'guest_app', null);
    await this.audit.recordC3Access(tx, {
      subjectType: 'guest_document',
      subjectId: doc.id,
      action: 'create',
      reservationId,
      requestId,
    });
    if (!reg.pre_submitted_at) {
      await tx.query('UPDATE registration SET pre_submitted_at = $2 WHERE id = $1', [reg.id, now]);
    }
    reg = await this.refresh(tx, reg, { requestId });
    await this.publish(tx, reg.id);
    return reg;
  }

  /**
   * Read-only progress of the online check-in for guest-portal (ARC FB-S3-15 (f)): no write, no record
   * creation. `uploadedPeople` = person numbers with at least one LIVE image (ARC FB-S3-27 (5)).
   */
  /**
   * Declarations not yet sent to the portal (status < `sent`) of active stays, with the deadline in force
   * NOW (computed from the actual arrival and today's parameters – US-042 AC3; null before check-in).
   * Read-only; used by J5 `registration.deadline` and the "Cần chú ý" sources (BUG-R2-034/035).
   */
  async openDeclarations(
    tx: Tx,
  ): Promise<Array<{ reg: RegRow; stay: StayView; deadlineAt: Date | null }>> {
    const c = await this.ctx(tx);
    const params = await this.deadlineParams(tx, c.today).catch(() => null);
    const { rows } = await tx.query<RegRow>(
      `SELECT ${REG_COLUMNS} FROM registration
        WHERE status IN ('none', 'pre', 'partial', 'review', 'scanned') AND NOT legal_hold
        ORDER BY id LIMIT $1`,
      [OPEN_CAP],
    );
    const stays = await readStays(
      tx,
      rows.map((r) => r.reservation_id),
      SYSTEM_ACTOR,
    );
    const out: Array<{ reg: RegRow; stay: StayView; deadlineAt: Date | null }> = [];
    for (const reg of rows) {
      const stay = stays.get(reg.reservation_id);
      if (!stay || stay.parentReservationId) continue;
      if (!['confirmed', 'in_house', 'checked_out'].includes(stay.status)) continue;
      const arrived = reg.actual_checkin_at ?? stay.actualCheckinAt;
      const deadlineAt =
        arrived && params ? registrationDeadline(arrived, c.tz, reg.kind, params).at : null;
      out.push({ reg, stay, deadlineAt });
    }
    return out;
  }

  /**
   * BR-605 / EP01 3.1 `visa_expiring`: bookings (in house or still to arrive) with a foreign document whose
   * visa ends BEFORE the departure (check `visa_valid_through_departure` = fail, manual result included)
   * and whose reminder date (`visa_alert_on`, J14) has come. Booking ids only – the caller shows code + room
   * (SR-RET-06: no expiry date outside the document screen).
   */
  async visaExpiringReservations(tx: Tx): Promise<StayView[]> {
    const c = await this.ctx(tx);
    const { rows } = await tx.query<{ reservation_id: string }>(
      `SELECT DISTINCT x.reservation_id FROM guest_document d JOIN registration x ON x.id = d.registration_id
        WHERE d.is_foreigner AND d.removed_at IS NULL AND d.purged_at IS NULL AND x.status <> 'void'
          AND d.visa_alert_on IS NOT NULL AND d.visa_alert_on <= $1::date
          AND d.check_results @> '[{"code":"visa_valid_through_departure","result":"fail"}]'::jsonb
        LIMIT $2`,
      [c.today, OPEN_CAP],
    );
    const stays = await readStays(
      tx,
      rows.map((r) => r.reservation_id),
      SYSTEM_ACTOR,
    );
    return [...stays.values()]
      .filter((s) => s.status === 'in_house' || s.status === 'confirmed')
      .sort((a, b) => (a.code < b.code ? -1 : 1));
  }

  async guestProgress(
    tx: Tx,
    reservationId: string,
  ): Promise<{
    registration: RegRow | null;
    uploadedPeople: number[];
    /** Every image ever uploaded from guest-web for the booking (SR-RL-05: 30 files / booking). */
    guestUploads: number;
    consentPeople: Array<{
      personIndex: number;
      decision: 'granted' | 'refused';
      noticeVersion: string;
      retentionDays: number | null;
    }>;
  }> {
    const { rows } = await tx.query<RegRow>(
      `SELECT ${REG_COLUMNS} FROM registration WHERE reservation_id = $1`,
      [reservationId],
    );
    const reg = rows[0] ?? null;
    if (!reg) return { registration: null, uploadedPeople: [], guestUploads: 0, consentPeople: [] };
    const { rows: people } = await tx.query<{ person_index: number }>(
      `SELECT DISTINCT d.person_index FROM guest_document d
        WHERE d.registration_id = $1 AND d.removed_at IS NULL AND d.person_index IS NOT NULL
          AND EXISTS (SELECT 1 FROM document_image i WHERE i.guest_document_id = d.id AND i.deleted_at IS NULL)
        ORDER BY d.person_index`,
      [reg.id],
    );
    const { rows: uploads } = await tx.query<{ n: number }>(
      `SELECT count(*)::int AS n FROM document_image WHERE registration_id = $1 AND uploaded_via = 'guest_app'`,
      [reg.id],
    );
    const consents = await consentsOf(tx, reg.id);
    const latest = new Map<number, ConsentRow>();
    for (const c of consents) if (c.person_index !== null) latest.set(c.person_index, c);
    return {
      registration: reg,
      uploadedPeople: people.map((p) => p.person_index),
      guestUploads: uploads[0]?.n ?? 0,
      consentPeople: [...latest].map(([personIndex, c]) => ({
        personIndex,
        decision: c.decision,
        noticeVersion: c.notice_version,
        retentionDays: c.retention_days,
      })),
    };
  }

  async registrationOfReservation(tx: Tx, reservationId: string): Promise<RegRow | null> {
    return this.ensure(tx, reservationId);
  }

  async lockForGuest(tx: Tx, registrationId: string): Promise<RegRow> {
    const reg = await lockRegistration(tx, registrationId);
    if (!reg) throw problem('NOT_FOUND');
    return reg;
  }

  /** Document of a guest-web person number (null before the first upload). */
  async documentOfPerson(
    tx: Tx,
    registrationId: string,
    personIndex: number,
  ): Promise<DocRow | null> {
    const docs = await documentsOf(tx, registrationId);
    return docs.find((d) => d.person_index === personIndex) ?? null;
  }
}

/** Portal addresses (BR-606; R-REG-06: staff log in themselves – no credentials stored). */

function allowedActions(status: string) {
  const a = (event: string, transition: string, action: string) => ({
    event,
    transition,
    action,
    requiresTrustedDevice: true,
  });
  switch (status) {
    case 'review':
      return [a('complete_review', 'K5', 'complete-review')];
    case 'scanned':
      return [a('mark_sent', 'K6', 'mark-sent')];
    case 'sent':
      return [
        a('mark_confirmed', 'K7', 'mark-confirmed'),
        a('mark_rejected', 'K8', 'mark-rejected'),
      ];
    case 'needs_update':
      return [a('mark_updated', 'K10', 'mark-updated')];
    default:
      return [];
  }
}
