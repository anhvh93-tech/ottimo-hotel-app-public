/**
 * J16 `retention.purge` – safety net of the immediate deletions (SEC C5, C6; SR-RET-02/03; EP06 6.1;
 * DOM G-17), run HOURLY per property (tick job, throttled by the last retention_run of policy `J16`):
 *
 * 1. T02  images with `delete_after` ≤ now (consenting people: checkout + id_image_retention_days_after_checkout);
 * 2. T01  images of people who did not consent / minors / void registrations still alive
 *         `id_image_purge_max_hours` after `confirmed`/`void` (the immediate purge failed or was missed);
 * 3. SEC I5 operational attachments past their retention (AttachmentService.purgeDue);
 * 4. technical rows: expired guest sessions (erd 12).
 * Registrations under `legal_hold` are skipped. Every run writes `retention_run` rows (counts only, no
 * personal data); OPS alerts when policy `J16` has no row for 26 hours (C6).
 * Deletion = destroy DEK + delete blob + purge_journal + c3_access_log `purge` (actor system).
 */
import { Inject, Injectable, Optional } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import { CLOCK, type Clock } from '../../../clock';
import type { Tx } from '../../../db/database';
import { localDate } from '../../../shared/time';
import { AttachmentService } from '../../files/public/attachment.service';
import { ParameterService } from '../../platform/public/parameter.service';
import type { ImageRow } from './registration.repo';
import { RegistrationService } from './registration.service';

/** Hourly cadence of J16 (architecture 9.1 – technical, not a business parameter). */
export const J16_INTERVAL_MS = 55 * 60_000;

export interface RetentionStats {
  skipped?: boolean;
  t02Images: number;
  t01Images: number;
  attachments: number;
  guestSessions: number;
}

@Injectable()
export class RetentionService {
  constructor(
    @Inject(RegistrationService) private readonly regs: RegistrationService,
    @Inject(ParameterService) private readonly params: ParameterService,
    @Inject(CLOCK) private readonly clock: Clock,
    @Optional() @Inject(AttachmentService) private readonly attachments?: AttachmentService,
  ) {}

  async run(tx: Tx, timezone: string, opts: { force?: boolean } = {}): Promise<RetentionStats> {
    const now = this.clock.now();
    if (!opts.force) {
      const { rows } = await tx.query<{ last: Date | null }>(
        `SELECT max(run_at) AS last FROM retention_run WHERE policy_key = 'J16'`,
      );
      const last = rows[0]?.last;
      if (last && now.getTime() - last.getTime() < J16_INTERVAL_MS) {
        return { skipped: true, t02Images: 0, t01Images: 0, attachments: 0, guestSessions: 0 };
      }
    }
    const today = localDate(now, timezone);
    const maxHours = await this.params
      .get<number>(tx, 'id_image_purge_max_hours', today)
      .catch(() => 24);

    // 1. T02 – scheduled deletions that are due.
    const due = await tx.query<ImageRow & { reservation_id: string; registration_id: string }>(
      `SELECT i.id, i.guest_document_id, i.blob_key, i.mime, i.data_key_id, i.uploaded_via, i.uploaded_at,
              i.delete_after, i.deleted_at, i.delete_reason, x.reservation_id, x.id AS registration_id
         FROM document_image i JOIN registration x ON x.id = i.registration_id
        WHERE i.deleted_at IS NULL AND i.delete_after <= $1 AND NOT x.legal_hold
        ORDER BY i.id LIMIT 500 FOR UPDATE OF i`,
      [now],
    );
    const t02 = await this.purgeGrouped(tx, due.rows, 'retention');

    // 2. T01 safety net: non-consenting people / minors / void, past confirmed_at|voided_at + max hours.
    const cutoff = new Date(now.getTime() - maxHours * 3_600_000);
    const late = await tx.query<
      ImageRow & { reservation_id: string; registration_id: string; reason: string }
    >(
      `SELECT i.id, i.guest_document_id, i.blob_key, i.mime, i.data_key_id, i.uploaded_via, i.uploaded_at,
              i.delete_after, i.deleted_at, i.delete_reason, x.reservation_id, x.id AS registration_id,
              CASE WHEN x.status = 'void' THEN 'void' ELSE 'no_consent' END AS reason
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
        ORDER BY i.id LIMIT 500 FOR UPDATE OF i`,
      [cutoff],
    );
    let t01 = 0;
    for (const reason of ['void', 'no_consent'] as const) {
      t01 += await this.purgeGrouped(
        tx,
        late.rows.filter((r) => r.reason === reason),
        reason,
      );
    }

    // 3. Operational attachments (SEC I5).
    const attachments = this.attachments ? await this.attachments.purgeDue(tx, now, timezone) : 0;

    // 4. Expired guest sessions (technical rows).
    const gs = await tx.query('DELETE FROM guest_session WHERE expires_at < $1', [
      new Date(now.getTime() - 86_400_000),
    ]);

    const stats: RetentionStats = {
      t02Images: t02,
      t01Images: t01,
      attachments,
      guestSessions: gs.rowCount ?? 0,
    };
    for (const [policy, n] of [
      ['T02', t02],
      ['T01', t01],
      ['SEC-I5', attachments],
      ['J16', t02 + t01 + attachments],
    ] as const) {
      if (n === 0 && policy !== 'J16') continue;
      await tx.query(
        `INSERT INTO retention_run (id, organization_id, property_id, run_at, policy_key, items_count, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'done')`,
        [uuidv7(), tx.ctx.organizationId, tx.ctx.propertyId, now, policy, n],
      );
    }
    return stats;
  }

  private async purgeGrouped(
    tx: Tx,
    rows: ReadonlyArray<ImageRow & { reservation_id: string; registration_id: string }>,
    reason: 'retention' | 'void' | 'no_consent',
  ): Promise<number> {
    const byReg = new Map<string, typeof rows>();
    for (const r of rows)
      byReg.set(r.registration_id, [...(byReg.get(r.registration_id) ?? []), r]);
    let n = 0;
    for (const [registrationId, images] of byReg) {
      n += await this.regs.purgeImages(
        tx,
        { id: registrationId, reservation_id: images[0]?.reservation_id ?? '' },
        images,
        reason,
      );
    }
    return n;
  }
}
