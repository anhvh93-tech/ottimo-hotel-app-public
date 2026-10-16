/**
 * Leads – SM-09, minimal R2 (US-087; kanban R3): createLead, listLeads, changeLeadStage + the system
 * transitions driven by quotes / holds / deposits:
 *   Q1 quote saved      new → quoted          (sales)
 *   B1 hold from quote  new|quoted → holding  (sales)
 *   B4 deposit          holding → won         (payments)
 *   B5/B6 hold ended    holding → quoted      (reservations – BE-A calls onHoldEnded with the quote id)
 * Manual moves (changeLeadStage): new ↔ quoted, new|quoted → lost (reason from BR-308, note for `other`),
 * lost → new|quoted (re-open). Scope M: SAL/CTV only see/move leads they own (404 otherwise).
 */
import { Inject, Injectable } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import { CLOCK, type Clock } from '../../../clock';
import type { Tx } from '../../../db/database';
import type { LeadStatus } from '../../../db/schema/sales';
import { type PageInfo, decodeCursor, page } from '../../../shared/http/pagination';
import { problem } from '../../../shared/problem';
import { toZonedIso } from '../../../shared/time';
import { optionalText, requireReason } from '../../../shared/validation';
import { AuditService } from '../../audit/public/audit.service';

const FULL_SCOPE = ['owner', 'manager', 'front_desk_lead', 'front_desk'];
/** BR-308 reasons a person may pick (system codes excluded). */
export const LOST_REASON_CODES = [
  'guest_changed_mind',
  'found_other',
  'price',
  'date_change',
  'unreachable',
  'other',
] as const;

const MANUAL: Record<LeadStatus, readonly LeadStatus[]> = {
  new: ['quoted', 'lost'],
  quoted: ['new', 'lost'],
  holding: [],
  won: [],
  lost: ['new', 'quoted'],
};

export interface LeadCaller {
  userId: string;
  roles: readonly string[];
}

interface LeadRow {
  id: string;
  guest_id: string;
  guest_name: string | null;
  need: string | null;
  status: LeadStatus;
  owner_user_id: string;
  estimated_value_vnd: number | null;
  last_interaction_at: Date;
  version: number;
}

function ownScope(c: LeadCaller): string | null {
  return c.roles.some((r) => FULL_SCOPE.includes(r)) ? null : c.userId;
}

const COLUMNS = `l.id, l.guest_id, g.full_name AS guest_name, l.need, l.status, l.owner_user_id,
  l.estimated_value_vnd, l.last_interaction_at, l.version`;

@Injectable()
export class LeadsService {
  constructor(
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  dto(r: LeadRow, tz: string): Record<string, unknown> {
    return {
      id: r.id,
      guestId: r.guest_id,
      ...(r.guest_name ? { guestDisplayName: r.guest_name } : {}),
      ...(r.need ? { need: r.need } : {}),
      status: r.status,
      ownerUserId: r.owner_user_id,
      ...(r.estimated_value_vnd !== null ? { estimatedValueVnd: r.estimated_value_vnd } : {}),
      lastInteractionAt: toZonedIso(r.last_interaction_at, tz),
      version: r.version,
    };
  }

  /** Guest visible to the caller: SAL/CTV only guests they created (rbac scope M, US-073). */
  async assertGuestInScope(
    tx: Tx,
    c: LeadCaller,
    guestId: string,
    field = 'guestId',
  ): Promise<void> {
    const own = ownScope(c);
    const { rows } = await tx.query<{ id: string }>(
      `SELECT id FROM guest WHERE id = $1 AND merged_into_id IS NULL AND anonymized_at IS NULL
          AND ($2::uuid IS NULL OR created_by = $2)`,
      [guestId, own],
    );
    if (!rows[0]) {
      throw problem('VALIDATION_FAILED', { errors: [{ field, code: 'NOT_IN_LIST' }] });
    }
  }

  async create(
    tx: Tx,
    c: LeadCaller,
    input: { guestId: string; need?: string | undefined; source?: string | undefined },
    tz: string,
    requestId?: string,
  ): Promise<Record<string, unknown>> {
    await this.assertGuestInScope(tx, c, input.guestId);
    const need = optionalText('need', input.need, 500);
    const source = optionalText('source', input.source, 40);
    const row = await this.insert(tx, c.userId, input.guestId, need, source, 'new');
    await this.audit.record(tx, {
      category: 'state',
      action: 'lead.created',
      entityType: 'lead',
      entityId: row.id,
      after: { status: 'new', source },
      ...(requestId ? { requestId } : {}),
    });
    return this.dto(row, tz);
  }

  /** The open lead of this owner and guest (new/quoted/holding), or a new one – for saveQuote (Q1). */
  async openLeadFor(tx: Tx, ownerUserId: string, guestId: string): Promise<string> {
    const { rows } = await tx.query<{ id: string }>(
      `SELECT id FROM lead WHERE owner_user_id = $1 AND guest_id = $2 AND status IN ('new', 'quoted', 'holding')
        ORDER BY id DESC LIMIT 1`,
      [ownerUserId, guestId],
    );
    if (rows[0]) return rows[0].id;
    return (await this.insert(tx, ownerUserId, guestId, null, 'quote', 'new')).id;
  }

  /** A lead given with a quote must be visible to the caller and belong to the same guest. */
  async assertLeadForQuote(tx: Tx, c: LeadCaller, leadId: string, guestId: string): Promise<void> {
    const own = ownScope(c);
    const { rows } = await tx.query<{ id: string }>(
      `SELECT id FROM lead WHERE id = $1 AND guest_id = $2 AND status <> 'won'
          AND ($3::uuid IS NULL OR owner_user_id = $3)`,
      [leadId, guestId, own],
    );
    if (!rows[0]) {
      throw problem('VALIDATION_FAILED', { errors: [{ field: 'leadId', code: 'NOT_IN_LIST' }] });
    }
  }

  async list(
    tx: Tx,
    c: LeadCaller,
    q: { cursor?: string | undefined; limit: number },
    tz: string,
  ): Promise<{ data: Record<string, unknown>[]; page: PageInfo }> {
    const cur = decodeCursor(q.cursor, 1);
    const { rows } = await tx.query<LeadRow>(
      `SELECT ${COLUMNS} FROM lead l LEFT JOIN guest g ON g.id = l.guest_id
        WHERE ($1::uuid IS NULL OR l.owner_user_id = $1) AND ($2::uuid IS NULL OR l.id < $2)
        ORDER BY l.id DESC LIMIT $3`,
      [ownScope(c), cur ? String(cur[0]) : null, q.limit + 1],
    );
    const p = page(rows, q.limit, (r) => [r.id]);
    return { data: p.data.map((r) => this.dto(r, tz)), page: p.page };
  }

  async changeStage(
    tx: Tx,
    c: LeadCaller,
    leadId: string,
    version: number,
    input: { toStage: LeadStatus; lostReasonCode?: string | undefined; note?: string | undefined },
    tz: string,
    requestId?: string,
  ): Promise<Record<string, unknown>> {
    const { rows } = await tx.query<LeadRow>(
      `SELECT ${COLUMNS} FROM lead l LEFT JOIN guest g ON g.id = l.guest_id
        WHERE l.id = $1 AND ($2::uuid IS NULL OR l.owner_user_id = $2) FOR UPDATE OF l`,
      [leadId, ownScope(c)],
    );
    const lead = rows[0];
    if (!lead) throw problem('NOT_FOUND');
    if (lead.version !== version) {
      throw problem('VERSION_CONFLICT', { extras: { currentVersion: lead.version } });
    }
    if (!MANUAL[lead.status].includes(input.toStage)) throw problem('INVALID_TRANSITION');
    let reason: string | null = null;
    let note: string | null = null;
    if (input.toStage === 'lost') {
      if (!input.lostReasonCode) {
        throw problem('VALIDATION_FAILED', {
          errors: [{ field: 'lostReasonCode', code: 'REQUIRED' }],
        });
      }
      if (!(LOST_REASON_CODES as readonly string[]).includes(input.lostReasonCode)) {
        throw problem('VALIDATION_FAILED', {
          errors: [{ field: 'lostReasonCode', code: 'NOT_IN_LIST' }],
        });
      }
      reason = input.lostReasonCode;
      note =
        reason === 'other'
          ? requireReason('note', input.note, { max: 300 })
          : optionalText('note', input.note, 300);
    } else {
      note = optionalText('note', input.note, 300);
    }
    const now = this.clock.now();
    const { rows: updated } = await tx.query<{ version: number }>(
      `UPDATE lead SET status = $2, lost_reason_code = $3, lost_note = $4, last_interaction_at = $5,
          updated_at = $5, version = version + 1
        WHERE id = $1 RETURNING version`,
      [lead.id, input.toStage, input.toStage === 'lost' ? reason : null, note, now],
    );
    await this.audit.record(tx, {
      category: 'state',
      action: 'lead.stage_changed',
      entityType: 'lead',
      entityId: lead.id,
      before: { status: lead.status },
      after: { status: input.toStage, lostReasonCode: reason },
      ...(note ? { reason: note } : {}),
      ...(requestId ? { requestId } : {}),
    });
    return this.dto(
      {
        ...lead,
        status: input.toStage,
        last_interaction_at: now,
        version: updated[0]?.version ?? lead.version + 1,
      },
      tz,
    );
  }

  // ───────────── system transitions (SYS – SM-09) ─────────────

  async onQuoteSaved(tx: Tx, leadId: string): Promise<void> {
    await this.systemMove(tx, leadId, ['new'], 'quoted', 'lead.quoted');
  }

  async onHoldCreated(tx: Tx, leadId: string): Promise<void> {
    await this.systemMove(tx, leadId, ['new', 'quoted'], 'holding', 'lead.holding');
  }

  /** B4 (payments): the lead of the booking's quote → won. */
  async onDepositConfirmed(tx: Tx, quoteId: string | null): Promise<void> {
    const leadId = await this.leadOfQuote(tx, quoteId);
    if (leadId) await this.systemMove(tx, leadId, ['holding', 'quoted', 'new'], 'won', 'lead.won');
  }

  /** B5/B6 (reservations, BE-A): a hold from a quote was cancelled or expired → quoted. */
  async onHoldEnded(tx: Tx, quoteId: string | null): Promise<void> {
    const leadId = await this.leadOfQuote(tx, quoteId);
    if (leadId) await this.systemMove(tx, leadId, ['holding'], 'quoted', 'lead.hold_ended');
  }

  private async leadOfQuote(tx: Tx, quoteId: string | null): Promise<string | null> {
    if (!quoteId) return null;
    const { rows } = await tx.query<{ lead_id: string | null }>(
      'SELECT lead_id FROM quote WHERE id = $1',
      [quoteId],
    );
    return rows[0]?.lead_id ?? null;
  }

  private async systemMove(
    tx: Tx,
    leadId: string,
    from: readonly LeadStatus[],
    to: LeadStatus,
    action: string,
  ): Promise<void> {
    const now = this.clock.now();
    const { rows } = await tx.query<{ id: string }>(
      `UPDATE lead SET status = $3, last_interaction_at = $4, updated_at = $4, version = version + 1
        WHERE id = $1 AND status = ANY($2::text[])
        RETURNING id`,
      [leadId, from, to, now],
    );
    if (rows.length === 0) return;
    await this.audit.record(tx, {
      category: 'state',
      action,
      entityType: 'lead',
      entityId: leadId,
      after: { status: to },
    });
  }

  private async insert(
    tx: Tx,
    ownerUserId: string,
    guestId: string,
    need: string | null,
    source: string | null,
    status: LeadStatus,
  ): Promise<LeadRow> {
    const id = uuidv7();
    const now = this.clock.now();
    await tx.query(
      `INSERT INTO lead (id, organization_id, property_id, guest_id, need, source, status, owner_user_id,
         last_interaction_at, created_at, created_by, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9, $8, $9)`,
      [
        id,
        tx.ctx.organizationId,
        tx.ctx.propertyId,
        guestId,
        need,
        source,
        status,
        ownerUserId,
        now,
      ],
    );
    const { rows } = await tx.query<LeadRow>(
      `SELECT ${COLUMNS} FROM lead l LEFT JOIN guest g ON g.id = l.guest_id WHERE l.id = $1`,
      [id],
    );
    return rows[0] as LeadRow;
  }
}
