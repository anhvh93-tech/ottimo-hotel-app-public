/**
 * J16 `retention.purge` – safety net of the immediate deletions (SEC C5, C6; SR-RET-02/03; EP06 6.1;
 * DOM G-17). Tick job (every minute per property). Steps 0–2 and 4 run on EVERY tick, so an image is never
 * kept more than a minute past its legal ceiling (BR-609-01 `purgeBackstopBy` = confirmed + 24 h –
 * BUG-R2-036); steps 3 and 5 (attachments, technical rows) and the `J16` heartbeat row run HOURLY
 * (throttled by the last retention_run of policy `J16`):
 *
 * 0. K1 backfill: bookings without a registration get their `none` record (moved out of the GET –
 *    ARC FB-S3-27 (6));
 * 1. T02 / SR-RET-02 images whose `delete_after` is due: consenting people of a declared registration →
 *    `retention`; a declaration never confirmed → `unconfirmed` (end of stay + id_image_unconfirmed_max_days,
 *    SEC FB-R2-SEC-BE-32) + a "Cần chú ý" item `registration_overdue` for FD/MGR;
 * 2. T01  images of people who did not consent / minors / void registrations still alive
 *    `id_image_purge_max_hours` after `confirmed`/`void`; registrations whose stay ended more than
 *    id_image_unconfirmed_max_days ago without `confirmed` (no `delete_after` – older data);
 * 3. SEC I5 / SEC BE-38 operational attachments past their retention or never bound to a record;
 * 4. files whose DEK was destroyed in a committed transaction (`blob_pending_delete`, ARC FB-S3-17);
 * 5. technical rows: expired guest sessions; idempotency keys older than `idempotency_ttl_hours`
 *    (SEC FB-R2-SEC-BE-39 – C2 may stay in a response body only that long).
 * Every item runs in its own SAVEPOINT: a poison row is skipped and reported, the run goes on; the hourly run
 * writes `retention_run` `J16` `failed` with the ids and error classes only – no personal data (ARC
 * FB-S3-27 (2), SEC BE-46). `stats.failures` is returned on every tick (worker log).
 * Registrations under `legal_hold` are skipped. OPS alerts when policy `J16` has no row for 26 hours (C6).
 */
import { Inject, Injectable, Optional } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import { CLOCK, type Clock } from '../../../clock';
import type { Tx } from '../../../db/database';
import { inSavepoint } from '../../../shared/savepoint';
import { localDate } from '../../../shared/time';
import { EventsService } from '../../events/public/events.service';
import { AttachmentService } from '../../files/public/attachment.service';
import { EncryptedBlobService } from '../../files/public/encrypted-blob.service';
import { ParameterService } from '../../platform/public/parameter.service';
import type { ImageRow } from './registration.repo';
import { type ImageDeleteReason, RegistrationService } from './registration.service';
import { SYSTEM_ACTOR, readStays } from './stay-reader';

/** Cadence of the hourly part of J16 (architecture 9.1 – technical, not a business parameter). */
export const J16_INTERVAL_MS = 55 * 60_000;

export interface RetentionStats {
  /** true when the hourly part (attachments, technical rows, heartbeat) did not run on this tick. */
  skipped?: boolean;
  backfilled: number;
  t02Images: number;
  unconfirmedImages: number;
  t01Images: number;
  attachments: number;
  blobFiles: number;
  guestSessions: number;
  idempotencyKeys: number;
  failures: number;
}

type DueImage = ImageRow & { reservation_id: string; registration_id: string; reason: string };

const IMAGE_COLUMNS = `i.id, i.guest_document_id, i.blob_key, i.mime, i.data_key_id, i.uploaded_via,
  i.uploaded_at, i.delete_after, i.deleted_at, i.delete_reason, x.reservation_id, x.id AS registration_id`;

@Injectable()
export class RetentionService {
  constructor(
    @Inject(RegistrationService) private readonly regs: RegistrationService,
    @Inject(ParameterService) private readonly params: ParameterService,
    @Inject(CLOCK) private readonly clock: Clock,
    @Optional() @Inject(AttachmentService) private readonly attachments?: AttachmentService,
    @Optional() @Inject(EncryptedBlobService) private readonly blobs?: EncryptedBlobService,
    @Optional() @Inject(EventsService) private readonly events?: EventsService,
  ) {}

  async run(tx: Tx, timezone: string, opts: { force?: boolean } = {}): Promise<RetentionStats> {
    const now = this.clock.now();
    const stats: RetentionStats = {
      backfilled: 0,
      t02Images: 0,
      unconfirmedImages: 0,
      t01Images: 0,
      attachments: 0,
      blobFiles: 0,
      guestSessions: 0,
      idempotencyKeys: 0,
      failures: 0,
    };
    const errors: string[] = [];
    // 0. K1 backfill on EVERY tick (1 min): bookings created by a path without a registration hook get their
    //    `none` record within a minute – the GET no longer writes (ARC FB-S3-27 (6)).
    const err0 = await inSavepoint(tx, async () => {
      stats.backfilled = await this.regs.backfill(tx);
    });
    if (err0) errors.push(`backfill: ${err0.name}`);
    let hourly = true;
    if (!opts.force) {
      const { rows } = await tx.query<{ last: Date | null }>(
        `SELECT max(run_at) AS last FROM retention_run WHERE policy_key = 'J16'`,
      );
      const last = rows[0]?.last;
      hourly = !last || now.getTime() - last.getTime() >= J16_INTERVAL_MS;
    }
    const today = localDate(now, timezone);
    const maxHours = await this.params.get<number>(tx, 'id_image_purge_max_hours', today);
    const unconfirmedDays = await this.params.get<number>(
      tx,
      'id_image_unconfirmed_max_days',
      today,
    );

    // 1. Scheduled deletions that are due (T02 retention / SR-RET-02 unconfirmed).
    const due = await tx.query<DueImage>(
      `SELECT ${IMAGE_COLUMNS},
              CASE WHEN x.status IN ('confirmed', 'needs_update', 'updated') THEN 'retention'
                   ELSE 'unconfirmed' END AS reason
         FROM document_image i JOIN registration x ON x.id = i.registration_id
        WHERE i.deleted_at IS NULL AND i.delete_after <= $1 AND NOT x.legal_hold
        ORDER BY i.id LIMIT 500 FOR UPDATE OF i SKIP LOCKED`,
      [now],
    );
    // 2a. Stay ended long ago, never confirmed, no deadline written (data from before 0053).
    const stale = await tx.query<DueImage>(
      `SELECT ${IMAGE_COLUMNS}, 'unconfirmed' AS reason
         FROM document_image i JOIN registration x ON x.id = i.registration_id
        WHERE i.deleted_at IS NULL AND i.delete_after IS NULL AND NOT x.legal_hold
          AND x.status NOT IN ('confirmed', 'needs_update', 'updated', 'void')
          AND x.stay_ended_at IS NOT NULL AND x.stay_ended_at + make_interval(days => $2) <= $1
        ORDER BY i.id LIMIT 500 FOR UPDATE OF i SKIP LOCKED`,
      [now, unconfirmedDays],
    );
    // 2b. T01: non-consenting people / minors / void, past confirmed_at|voided_at + max hours.
    const cutoff = new Date(now.getTime() - maxHours * 3_600_000);
    const late = await tx.query<DueImage>(
      `SELECT ${IMAGE_COLUMNS}, CASE WHEN x.status = 'void' THEN 'void' ELSE 'no_consent' END AS reason
         FROM document_image i
         JOIN registration x ON x.id = i.registration_id
         JOIN guest_document d ON d.id = i.guest_document_id
        WHERE i.deleted_at IS NULL AND NOT x.legal_hold
          AND ( (x.status = 'void' AND x.voided_at <= $1)
             OR (x.status IN ('confirmed', 'needs_update', 'updated') AND x.confirmed_at <= $1
                 AND (d.is_minor_data OR d.removed_at IS NOT NULL OR COALESCE((
                   SELECT c.decision FROM consent_record c
                    WHERE c.registration_id = x.id AND c.purpose = 'P02B_ID_IMAGE_RETENTION'
                      AND (c.guest_document_id = d.id
                           OR (c.guest_document_id IS NULL AND c.person_index = d.person_index))
                    ORDER BY c.recorded_at DESC, c.id DESC LIMIT 1), 'refused') = 'refused')))
        ORDER BY i.id LIMIT 500 FOR UPDATE OF i SKIP LOCKED`,
      [cutoff],
    );
    const seen = new Set<string>();
    const unconfirmedRegs = new Map<string, string>();
    for (const img of [...due.rows, ...stale.rows, ...late.rows]) {
      if (seen.has(img.id)) continue;
      seen.add(img.id);
      const reason = img.reason as ImageDeleteReason;
      const err = await inSavepoint(tx, async () => {
        await this.regs.purgeImages(
          tx,
          { id: img.registration_id, reservation_id: img.reservation_id },
          [img],
          reason,
        );
      });
      if (err) {
        errors.push(`document_image ${img.id}: ${err.name}`);
        continue;
      }
      if (reason === 'retention') stats.t02Images++;
      else if (reason === 'unconfirmed') {
        stats.unconfirmedImages++;
        unconfirmedRegs.set(img.registration_id, img.reservation_id);
      } else stats.t01Images++;
    }
    // SEC BE-32: a declaration that never reached `confirmed` is something FD/MGR must look at.
    if (this.events && unconfirmedRegs.size > 0) {
      const stays = await readStays(tx, [...unconfirmedRegs.values()], SYSTEM_ACTOR);
      for (const [registrationId, reservationId] of unconfirmedRegs) {
        const code = stays.get(reservationId)?.code;
        const err = await inSavepoint(tx, async () => {
          await this.events?.openAttention(tx, {
            kind: 'registration_overdue',
            severity: 'warning',
            dedupeKey: `registration_unconfirmed:${registrationId}`,
            refType: 'registration',
            refId: registrationId,
            ...(code ? { refCode: code } : {}),
            params: { count: 1 },
            now,
          });
        });
        if (err) errors.push(`attention ${registrationId}: ${err.name}`);
      }
    }

    // 4. Files of committed purges (cheap: an empty queue is one indexed DELETE).
    if (this.blobs) {
      const err = await inSavepoint(tx, async () => {
        stats.blobFiles = (await this.blobs?.sweepPending(tx, 500)) ?? 0;
      });
      if (err) errors.push(`blob sweep: ${err.name}`);
    }

    if (!hourly) {
      // Non-hourly tick: journal what was deleted; the `J16` row (heartbeat + failures, OPS C6) stays hourly so
      // a poison row cannot write a row a minute – its failure is recorded by the next hourly run (≤ 55 min).
      stats.failures = errors.length;
      await this.journalPolicies(tx, now, stats);
      return { ...stats, skipped: true };
    }

    // 3. Operational attachments (SEC I5, SEC BE-38).
    if (this.attachments) {
      const a = await this.attachments.purgeDue(tx, now, timezone);
      stats.attachments = a.purged;
      errors.push(...a.errors);
    }

    // 5. Technical rows.
    const gs = await tx.query('DELETE FROM guest_session WHERE expires_at < $1', [
      new Date(now.getTime() - 86_400_000),
    ]);
    stats.guestSessions = gs.rowCount ?? 0;
    const ttlHours = await this.params
      .get<number>(tx, 'idempotency_ttl_hours', today)
      .catch(() => null);
    if (ttlHours !== null) {
      const ik = await tx.query(
        `DELETE FROM idempotency_key WHERE organization_id = $1 AND state = 'completed' AND created_at < $2`,
        [tx.ctx.organizationId, new Date(now.getTime() - ttlHours * 3_600_000)],
      );
      stats.idempotencyKeys = ik.rowCount ?? 0;
    }

    stats.failures = errors.length;
    await this.journalPolicies(tx, now, stats);
    await this.journalJ16(tx, now, stats, errors);
    return stats;
  }

  private async journalPolicies(tx: Tx, now: Date, stats: RetentionStats): Promise<void> {
    for (const [policy, n] of [
      ['T02', stats.t02Images],
      ['SR-RET-02', stats.unconfirmedImages],
      ['T01', stats.t01Images],
      ['SEC-I5', stats.attachments],
    ] as const) {
      if (n > 0) await this.journal(tx, now, policy, n, 'done', null);
    }
  }

  private async journalJ16(
    tx: Tx,
    now: Date,
    stats: RetentionStats,
    errors: readonly string[],
  ): Promise<void> {
    const total = stats.t02Images + stats.unconfirmedImages + stats.t01Images + stats.attachments;
    await this.journal(
      tx,
      now,
      'J16',
      total,
      errors.length > 0 ? 'failed' : 'done',
      // ids and error classes only – never personal data (SEC 7).
      errors.length > 0 ? errors.slice(0, 20).join('; ').slice(0, 2000) : null,
    );
  }

  private async journal(
    tx: Tx,
    now: Date,
    policy: string,
    n: number,
    status: 'done' | 'failed',
    error: string | null,
  ): Promise<void> {
    await tx.query(
      `INSERT INTO retention_run (id, organization_id, property_id, run_at, policy_key, items_count, status, error)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [uuidv7(), tx.ctx.organizationId, tx.ctx.propertyId, now, policy, n, status, error],
    );
  }
}
