/**
 * Desk side of the website booking requests (US-155 AC2, AC3, AC8 – R3-Q06; OpenAPI listWebsiteBookingRequests,
 * getWebsiteBookingRequest, transitionWebsiteBookingRequest, lookupWebsiteBookingRequests; SM-18 WR1–WR8;
 * SEC ARC-12, 15, 16, 19, 21) – BE-D, R3 Sprint 1.
 *
 * Scope (in the query – SR-AZ-02): OWN/MGR/FDL/FD every request of the property; SAL `new` requests nobody holds
 * (WITHOUT the C2 fields – ARC-19) and the ones assigned to them; anything else → absent / 404.
 * C2 (`guestName`, `phone`, `email`, `note`, `declineNote`) never goes into a notification, SSE payload, audit,
 * state_transition or log; it is absent once `pii_purged_at` is set.
 * Lock order: one row `FOR UPDATE` (the request) – the conversion path (WebsiteRequestPort) runs inside the
 * quote / reservation transaction AFTER their own locks (16.19: L1 booking → L4 the request).
 */
import { Inject, Injectable } from '@nestjs/common';
import type { Tx } from '../../../db/database';
import { problem } from '../../../shared/problem';
import { decodeCursor, encodeCursor, parseLimit } from '../../../shared/http/pagination';
import { AuditService } from '../../audit/public/audit.service';
import { CryptoService } from '../../crypto/public/crypto.service';
import { EventsService, FD_PLUS } from '../../events/public/events.service';
import { staffChatState } from '../../events/public/staff-chat';
import { normalizeEmail, normalizePhone } from '../../guests/public/normalize';
import { displayNamesOf } from '../../identity/public/staff-directory';
import { ParameterService } from '../../platform/public/parameter.service';
import { PropertyContextService } from '../../platform/public/property-context';
import {
  looksLikeCard,
  looksLikeIdNumber,
  normalizeFreeText,
  normalizeRefCode,
  slugOf,
} from './website-request-rules';

export const WR_STATUSES = ['new', 'in_progress', 'converted', 'declined', 'spam'] as const;
export const STAFF_DECLINE_CODES = [
  'no_availability',
  'price_not_accepted',
  'guest_unreachable',
  'guest_not_proceeding',
  'duplicate',
  'policy_mismatch',
  'other',
] as const;
const SYSTEM_DECLINE_CODES = ['stale', 'erased_on_request'];
const ACTIONS = ['claim', 'release', 'decline', 'mark-spam', 'reopen', 'erase'] as const;
type Action = (typeof ACTIONS)[number];

const LEAD_PLUS = ['owner', 'manager', 'front_desk_lead'];
/** Local dates as text (node-pg would build a JS Date at local midnight). Later columns win in the row. */
const DATES = 'w.arrival_date::text AS arrival_date, w.departure_date::text AS departure_date';

export interface WebsiteRequestRow {
  id: string;
  ref_code: string;
  status: (typeof WR_STATUSES)[number];
  arrival_date: string;
  departure_date: string | null;
  stay_kind: 'short' | 'long';
  stay_months: number | null;
  adults: number;
  children: number;
  infants: number;
  room_type_slug: string | null;
  locale: string;
  preferred_channel: string;
  guest_name: string | null;
  phone_e164: string | null;
  email: string | null;
  note: string | null;
  contact_hmac: string | null;
  alias_ref_codes: string[];
  related_request_ids: string[];
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  ref_host: string | null;
  landing_path: string | null;
  sub_source: string | null;
  suspicious_flags: string[];
  duplicate_count: number;
  reply_by: Date;
  assigned_user_id: string | null;
  claimed_at: Date | null;
  decline_reason_code: string | null;
  decline_note: string | null;
  quote_id: string | null;
  reservation_id: string | null;
  converted_at: Date | null;
  last_activity_at: Date;
  pii_purged_at: Date | null;
  created_at: Date;
  updated_at: Date;
  version: number;
}

export interface Actor {
  userId: string;
  roles: readonly string[];
  requestId?: string;
}

interface Ctx {
  tz: string;
  now: Date;
  today: string;
  iso(d: Date): string;
}

const fieldError = (field: string, code: string) =>
  problem('VALIDATION_FAILED', { errors: [{ field, code }] });

const isDesk = (roles: readonly string[]) =>
  roles.some((r) => (FD_PLUS as readonly string[]).includes(r));
const isLead = (roles: readonly string[]) => roles.some((r) => LEAD_PLUS.includes(r));

/** AllowedAction of SM-18 (state-machines mục 19: event code = BA's WR event). */
const EVENT: Record<Action, { event: string; transition: string }> = {
  claim: { event: 'claim_website_request', transition: 'WR1' },
  release: { event: 'release_website_request', transition: 'WR2' },
  decline: { event: 'decline_website_request', transition: 'WR3' },
  'mark-spam': { event: 'mark_website_request_spam', transition: 'WR4' },
  reopen: { event: 'reopen_website_request', transition: 'WR5' },
  erase: { event: 'erase_website_request', transition: 'WR8' },
};

/** SSE audience of one request: FD+ floor; SAL when it is `new` and unassigned; the assignee. */
export function sseAudienceOf(r: Pick<WebsiteRequestRow, 'status' | 'assigned_user_id'>): {
  roles: string[];
  userIds: string[];
} {
  return {
    roles: r.status === 'new' && !r.assigned_user_id ? ['sales_staff'] : [],
    userIds: r.assigned_user_id ? [r.assigned_user_id] : [],
  };
}

@Injectable()
export class WebsiteRequestsService {
  constructor(
    @Inject(PropertyContextService) private readonly property: PropertyContextService,
    @Inject(ParameterService) private readonly params: ParameterService,
    @Inject(EventsService) private readonly events: EventsService,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(CryptoService) private readonly crypto: CryptoService,
  ) {}

  private async ctx(tx: Tx): Promise<Ctx> {
    const p = await this.property.now(tx);
    return { tz: p.timezone, now: p.now, today: p.today, iso: p.iso };
  }

  /** SAL scope filter (SQL fragment on alias `w`, parameter index `$n` = the caller id). */
  private scopeSql(actor: Actor, n: number): string {
    // FD+ see everything; the caller id is still referenced so the statement's parameters stay the same.
    if (isDesk(actor.roles)) return `$${n}::uuid IS NOT NULL`;
    return `((w.status = 'new' AND w.assigned_user_id IS NULL) OR w.assigned_user_id = $${n})`;
  }

  // ───────────────────────── reads ─────────────────────────

  async list(
    tx: Tx,
    actor: Actor,
    q: { status?: string; refCode?: string; cursor?: string; limit?: string },
  ): Promise<{
    data: Array<Record<string, unknown>>;
    page: { nextCursor: string | null; limit: number };
  }> {
    const c = await this.ctx(tx);
    let statuses: string[] = ['new', 'in_progress'];
    if (q.status !== undefined && q.status !== '') {
      statuses = q.status.split(',').map((s) => s.trim());
      if (statuses.some((s) => !(WR_STATUSES as readonly string[]).includes(s))) {
        throw fieldError('status', 'NOT_IN_LIST');
      }
    }
    let ref: string | null = null;
    if (q.refCode !== undefined && q.refCode !== '') {
      ref = normalizeRefCode(q.refCode);
      if (!ref) throw fieldError('refCode', 'VALIDATION_FAILED');
    }
    const limit = parseLimit(q.limit, 50);
    const cursor = decodeCursor(q.cursor, 3);
    // Sort: arriving today (still new) → other `new` by replyBy → the rest by updatedAt desc.
    const rank = `CASE WHEN w.status = 'new' AND w.arrival_date = $3::date THEN 0
                       WHEN w.status = 'new' THEN 1 ELSE 2 END`;
    const key = `CASE WHEN w.status = 'new' THEN extract(epoch FROM w.reply_by)
                      ELSE -extract(epoch FROM w.updated_at) END`;
    const params: unknown[] = [statuses, actor.userId, c.today, ref, limit + 1];
    let after = '';
    if (cursor) {
      params.push(cursor[0], cursor[1], cursor[2]);
      after = `AND (${rank}, ${key}, w.id) > ($6::int, $7::numeric, $8::uuid)`;
    }
    const { rows } = await tx.query<WebsiteRequestRow & { r: number; k: string }>(
      `SELECT w.*, ${DATES}, ${rank} AS r, ${key}::numeric AS k FROM website_booking_request w
        WHERE (w.status = ANY($1::text[]) OR $4::text IS NOT NULL)
          AND ($4::text IS NULL OR w.ref_code = $4 OR $4 = ANY(w.alias_ref_codes))
          AND ${this.scopeSql(actor, 2)} ${after}
        ORDER BY r, k, w.id LIMIT $5`,
      params,
    );
    const more = rows.length > limit;
    const pageRows = more ? rows.slice(0, limit) : rows;
    const data = await this.dtos(tx, actor, pageRows, c);
    const last = pageRows[pageRows.length - 1];
    return {
      data,
      page: {
        nextCursor: more && last ? encodeCursor([Number(last.r), String(last.k), last.id]) : null,
        limit,
      },
    };
  }

  async get(
    tx: Tx,
    actor: Actor,
    id: string,
  ): Promise<{ body: Record<string, unknown>; version: number }> {
    const c = await this.ctx(tx);
    const r = await this.visible(tx, actor, id);
    return {
      body: (await this.dtos(tx, actor, [r], c))[0] as Record<string, unknown>,
      version: r.version,
    };
  }

  private async visible(
    tx: Tx,
    actor: Actor,
    id: string,
    lock = false,
  ): Promise<WebsiteRequestRow> {
    const { rows } = await tx.query<WebsiteRequestRow>(
      `SELECT w.*, ${DATES} FROM website_booking_request w WHERE w.id = $1 AND ${this.scopeSql(actor, 2)}
        ${lock ? 'FOR UPDATE' : ''}`,
      [id, actor.userId],
    );
    if (!rows[0]) throw problem('NOT_FOUND');
    return rows[0];
  }

  private async dtos(
    tx: Tx,
    actor: Actor,
    rows: WebsiteRequestRow[],
    c: Ctx,
  ): Promise<Array<Record<string, unknown>>> {
    const names = await displayNamesOf(
      tx,
      rows.map((r) => r.assigned_user_id).filter((x): x is string => !!x),
    );
    const related = [...new Set(rows.flatMap((r) => r.related_request_ids))];
    const relatedCodes = new Map<string, string>();
    if (related.length > 0) {
      const { rows: rel } = await tx.query<{ id: string; ref_code: string }>(
        'SELECT id, ref_code FROM website_booking_request WHERE id = ANY($1::uuid[])',
        [related],
      );
      for (const x of rel) relatedCodes.set(x.id, x.ref_code);
    }
    const resIds = rows.map((r) => r.reservation_id).filter((x): x is string => !!x);
    const resCodes = new Map<string, string>();
    if (resIds.length > 0) {
      // Booking code only (display) – reservations reference data, read like the guest-portal room reads.
      const { rows: res } = await tx.query<{ id: string; code: string }>(
        'SELECT id, code FROM reservation WHERE id = ANY($1::uuid[])',
        [resIds],
      );
      for (const x of res) resCodes.set(x.id, x.code);
    }
    const types = await this.roomTypes(tx);
    const maxAgeDays = await this.params.get<number>(
      tx,
      'retention.web_request_max_age_days',
      c.today,
    );
    return rows.map((r) =>
      this.dto(r, actor, c, { names, relatedCodes, resCodes, types, maxAgeDays }),
    );
  }

  /** Public room types currently on sale: slug → label (Room.publicRoomType). */
  async roomTypes(tx: Tx): Promise<Map<string, string>> {
    const { rows } = await tx.query<{ label: string }>(
      `SELECT DISTINCT public_room_type AS label FROM room
        WHERE public_room_type IS NOT NULL AND is_sellable`,
    );
    return new Map(rows.map((x) => [slugOf(x.label), x.label]));
  }

  dto(
    r: WebsiteRequestRow,
    actor: Actor,
    c: Ctx,
    look: {
      names: Map<string, string>;
      relatedCodes: Map<string, string>;
      resCodes: Map<string, string>;
      types: Map<string, string>;
      maxAgeDays: number;
    },
  ): Record<string, unknown> {
    const salUnassigned = !isDesk(actor.roles) && r.status === 'new' && !r.assigned_user_id;
    const showC2 = !r.pii_purged_at && !salUnassigned;
    const nights =
      r.departure_date === null
        ? null
        : Math.round(
            (Date.parse(`${r.departure_date}T00:00:00Z`) -
              Date.parse(`${r.arrival_date}T00:00:00Z`)) /
              86_400_000,
          );
    return {
      id: r.id,
      refCode: r.ref_code,
      aliasRefCodes: r.alias_ref_codes,
      status: r.status,
      arrival: r.arrival_date,
      departure: r.departure_date,
      nights,
      stayKind: r.stay_kind,
      months: r.stay_months,
      adults: r.adults,
      children: r.children,
      infants: r.infants,
      roomType: r.room_type_slug,
      roomTypeLabel: r.room_type_slug ? (look.types.get(r.room_type_slug) ?? null) : null,
      ...(showC2 && r.guest_name ? { guestName: r.guest_name } : {}),
      ...(showC2 && r.phone_e164 ? { phone: `+${r.phone_e164}` } : {}),
      ...(showC2 && r.email ? { email: r.email } : {}),
      ...(showC2 && r.note ? { note: r.note } : {}),
      preferredChannel: r.preferred_channel,
      locale: r.locale,
      subSource: r.sub_source,
      utmSource: r.utm_source,
      utmMedium: r.utm_medium,
      utmCampaign: r.utm_campaign,
      refHost: r.ref_host,
      landingPath: r.landing_path,
      suspiciousFlags: r.suspicious_flags,
      relatedRefCodes: r.related_request_ids
        .map((id) => look.relatedCodes.get(id))
        .filter((x): x is string => !!x)
        .slice(0, 10),
      duplicateCount: r.duplicate_count,
      arrivesToday: r.arrival_date === c.today,
      replyBy: c.iso(r.reply_by),
      isReplyOverdue: r.status === 'new' && r.reply_by.getTime() <= c.now.getTime(),
      assignedUserId: r.assigned_user_id,
      assignedUserName: r.assigned_user_id ? (look.names.get(r.assigned_user_id) ?? null) : null,
      claimedAt: r.claimed_at ? c.iso(r.claimed_at) : null,
      declineReasonCode: r.decline_reason_code,
      ...(showC2 && r.decline_note ? { declineNote: r.decline_note } : {}),
      quoteId: r.quote_id,
      reservationId: r.reservation_id,
      reservationCode: r.reservation_id ? (look.resCodes.get(r.reservation_id) ?? null) : null,
      convertedAt: r.converted_at ? c.iso(r.converted_at) : null,
      offerSnapshot: null,
      createdAt: c.iso(r.created_at),
      updatedAt: c.iso(r.updated_at),
      piiPurgedAt: r.pii_purged_at ? c.iso(r.pii_purged_at) : null,
      version: r.version,
      allowedActions: this.allowed(r, actor, c, look.maxAgeDays),
    };
  }

  /** SM-18 / OpenAPI table of `transitionWebsiteBookingRequest` – what THIS caller may do now. */
  allowed(
    r: WebsiteRequestRow,
    actor: Actor,
    c: Ctx,
    maxAgeDays: number,
  ): Array<Record<string, string>> {
    const out: Action[] = [];
    const desk = isDesk(actor.roles);
    const mine = r.assigned_user_id === actor.userId;
    const open = r.status === 'new' || r.status === 'in_progress';
    if (r.status === 'new') out.push('claim');
    if (r.status === 'in_progress' && (mine || isLead(actor.roles))) out.push('release');
    if (open && (desk || mine)) out.push('decline', 'mark-spam');
    if (
      (r.status === 'declined' || r.status === 'spam') &&
      (desk || mine) &&
      this.reopenable(r, c, maxAgeDays)
    ) {
      out.push('reopen');
    }
    if (r.status !== 'converted' && !r.pii_purged_at && isLead(actor.roles)) out.push('erase');
    return out.map((a) => ({ ...EVENT[a], action: a }));
  }

  private reopenable(r: WebsiteRequestRow, c: Ctx, maxAgeDays: number): boolean {
    if (r.pii_purged_at) return false;
    if (r.decline_reason_code === 'erased_on_request') return false;
    return c.now.getTime() < r.created_at.getTime() + maxAgeDays * 86_400_000;
  }

  // ───────────────────────── transitions (WR1–WR5, WR8) ─────────────────────────

  async transition(
    tx: Tx,
    actor: Actor,
    id: string,
    action: string,
    body: Record<string, unknown>,
    ifMatch: number | undefined,
  ): Promise<{ body: Record<string, unknown>; version: number }> {
    if (!(ACTIONS as readonly string[]).includes(action)) throw problem('NOT_FOUND');
    const a = action as Action;
    const desk = isDesk(actor.roles);
    // WR8 erase: OWN/MGR/FDL only (FD, SAL → 403 FORBIDDEN_ACTION) – checked before the row.
    if (a === 'erase' && !isLead(actor.roles)) throw problem('FORBIDDEN_ACTION');
    const c = await this.ctx(tx);
    const maxAgeDays = await this.params.get<number>(
      tx,
      'retention.web_request_max_age_days',
      c.today,
    );
    const r = await this.visible(tx, actor, id, true);
    if (ifMatch !== undefined && ifMatch !== r.version) {
      throw problem('VERSION_CONFLICT', { extras: { currentVersion: r.version } });
    }
    const invalid = () => problem('INVALID_TRANSITION', { extras: { currentState: r.status } });
    const mine = r.assigned_user_id === actor.userId;
    let to = r.status;
    let set = '';
    const vals: unknown[] = [];
    const push = (v: unknown) => {
      vals.push(v);
      return `$${vals.length + 3}`;
    };
    switch (a) {
      case 'claim': {
        if (r.status !== 'new') throw invalid();
        to = 'in_progress';
        set = `assigned_user_id = ${push(actor.userId)}, claimed_at = $2`;
        break;
      }
      case 'release': {
        if (r.status !== 'in_progress') throw invalid();
        if (!mine && !isLead(actor.roles)) throw problem('FORBIDDEN_ACTION');
        to = 'new';
        set = 'assigned_user_id = NULL, claimed_at = NULL';
        break;
      }
      case 'decline': {
        if (r.status !== 'new' && r.status !== 'in_progress') throw invalid();
        if (!desk && !mine) throw problem('FORBIDDEN_ACTION');
        const code = body.reasonCode;
        if (code === undefined || code === null || code === '') {
          throw fieldError('reasonCode', 'REQUIRED');
        }
        if (
          typeof code !== 'string' ||
          !(STAFF_DECLINE_CODES as readonly string[]).includes(code)
        ) {
          throw fieldError('reasonCode', 'NOT_IN_LIST');
        }
        const note = this.declineNote(body.note, code === 'other');
        to = 'declined';
        // The decliner holds the request (SAL may reopen "the request they declined" – SM-18 WR5).
        set = `decline_reason_code = ${push(code)}, decline_note = ${push(note)},
               assigned_user_id = COALESCE(assigned_user_id, ${push(actor.userId)})`;
        break;
      }
      case 'mark-spam': {
        if (r.status !== 'new' && r.status !== 'in_progress') throw invalid();
        if (!desk && !mine) throw problem('FORBIDDEN_ACTION');
        to = 'spam';
        set = `assigned_user_id = COALESCE(assigned_user_id, ${push(actor.userId)})`;
        break;
      }
      case 'reopen': {
        if (r.status !== 'declined' && r.status !== 'spam') throw invalid();
        if (!desk && !mine) throw problem('FORBIDDEN_ACTION');
        if (!this.reopenable(r, c, maxAgeDays)) throw invalid();
        to = 'in_progress';
        set = `assigned_user_id = ${push(actor.userId)}, claimed_at = $2, decline_reason_code = NULL,
               decline_note = NULL`;
        break;
      }
      case 'erase': {
        if (r.status === 'converted') throw invalid();
        if (r.pii_purged_at) throw invalid();
        const method = body.verificationMethod;
        if (method === undefined || method === null || method === '') {
          throw fieldError('verificationMethod', 'REQUIRED');
        }
        if (method !== 'same_contact' && method !== 'called_back') {
          throw fieldError('verificationMethod', 'NOT_IN_LIST');
        }
        if (method === 'same_contact') {
          const h = this.contactHmac(body.verifiedContact, 'verifiedContact');
          if (!r.contact_hmac || h !== r.contact_hmac) {
            throw fieldError('verifiedContact', 'CONTACT_MISMATCH');
          }
        }
        to = 'declined';
        set = `decline_reason_code = 'erased_on_request', ${PII_NULLS}, pii_purged_at = $2, ip_hmac = NULL`;
        await tx.query(
          `INSERT INTO purge_journal (organization_id, property_id, subject_type, subject_id, policy_key, action,
             purged_at)
           VALUES ($1, $2, 'website_booking_request', $3, 'dsr_erase', 'null_columns', $4)`,
          [tx.ctx.organizationId, tx.ctx.propertyId, r.id, c.now],
        );
        await this.audit.record(tx, {
          category: 'security',
          action: 'website_request.erased',
          entityType: 'website_booking_request',
          entityId: r.id,
          entityCode: r.ref_code,
          after: { verificationMethod: method, status: to },
          ...(actor.requestId ? { requestId: actor.requestId } : {}),
        });
        break;
      }
    }
    await tx.query(
      `UPDATE website_booking_request SET status = $3, ${set}, last_activity_at = $2, updated_at = $2,
              version = version + 1
        WHERE id = $1`,
      [r.id, c.now, to, ...vals],
    );
    // WR8: the Google Chat copy cannot be deleted by the webhook – a notice in the request's thread tells the room
    // manager to delete the first message (ARC gchat-booking-request-notify 8.6, SEC N1). Only when that first
    // message was (or may still be) posted; the worker re-checks it was really posted before sending.
    if (a === 'erase' && (await staffChatState(tx, 'web_request_new', r.id)) !== 'none') {
      await this.events.enqueueStaffChat(tx, {
        kind: 'web_request_erased',
        refType: 'website_booking_request',
        refId: r.id,
        now: c.now,
      });
    }
    await this.history(tx, r.id, r.status, to, EVENT[a].event, c.now, 'user', actor.userId);
    await this.audit.record(tx, {
      category: 'state',
      action: `website_request.${a.replace('-', '_')}`,
      entityType: 'website_booking_request',
      entityId: r.id,
      entityCode: r.ref_code,
      before: { status: r.status },
      after: { status: to, ...(a === 'decline' ? { reasonCode: body.reasonCode } : {}) },
      ...(actor.requestId ? { requestId: actor.requestId } : {}),
    });
    const after = (await this.rowById(tx, r.id)) as WebsiteRequestRow;
    await this.publish(tx, r, after);
    return {
      body: (await this.dtos(tx, actor, [after], c))[0] as Record<string, unknown>,
      version: after.version,
    };
  }

  /** SSE to everyone who could see the request BEFORE or AFTER the change (SAL losing it gets the event too). */
  async publish(tx: Tx, before: WebsiteRequestRow | null, after: WebsiteRequestRow): Promise<void> {
    const a = sseAudienceOf(after);
    const b = before ? sseAudienceOf(before) : { roles: [], userIds: [] };
    await this.events.publish(tx, 'website_request.changed', after.id, {
      roles: [...new Set([...a.roles, ...b.roles])],
      userIds: [...new Set([...a.userIds, ...b.userIds])],
    });
  }

  async rowById(tx: Tx, id: string, lock = false): Promise<WebsiteRequestRow | null> {
    const { rows } = await tx.query<WebsiteRequestRow>(
      `SELECT w.*, ${DATES} FROM website_booking_request w WHERE w.id = $1${lock ? ' FOR UPDATE' : ''}`,
      [id],
    );
    return rows[0] ?? null;
  }

  async history(
    tx: Tx,
    id: string,
    from: string | null,
    to: string,
    event: string,
    now: Date,
    actorType: 'user' | 'guest' | 'system',
    userId: string | null,
  ): Promise<void> {
    await tx.query(
      `INSERT INTO state_transition (organization_id, property_id, machine, entity_id, from_state, to_state,
         event_code, actor_type, actor_user_id, occurred_at)
       VALUES ($1, $2, 'SM-18', $3, $4, $5, $6, $7, $8, $9)`,
      [tx.ctx.organizationId, tx.ctx.propertyId, id, from, to, event, actorType, userId, now],
    );
  }

  /** `note` of decline: 3–300, normalised like the form (ARC-21), V-09 card / ID numbers refused. */
  private declineNote(raw: unknown, required: boolean): string | null {
    if (raw === undefined || raw === null) {
      if (required) throw fieldError('note', 'REASON_REQUIRED');
      return null;
    }
    if (typeof raw !== 'string') throw fieldError('note', 'VALIDATION_FAILED');
    const text = normalizeFreeText(raw);
    if (text.length === 0) {
      if (required) throw fieldError('note', 'REASON_REQUIRED');
      return null;
    }
    if (text.length < 3) throw fieldError('note', 'REASON_REQUIRED');
    if (text.length > 300) throw fieldError('note', 'TOO_LONG');
    if (looksLikeCard(text)) throw fieldError('note', 'CARD_NUMBER_DETECTED');
    if (looksLikeIdNumber(text)) throw fieldError('note', 'ID_NUMBER_DETECTED');
    return text;
  }

  /** HMAC `web_request_contact` of a phone (E.164) or e-mail (BR-951) as typed – ARC-07/14. */
  contactHmac(raw: unknown, field: string): string {
    if (typeof raw !== 'string' || raw.trim() === '') throw fieldError(field, 'REQUIRED');
    const v = raw.trim();
    if (v.includes('@')) {
      const e = normalizeEmail(v);
      if (!e) throw fieldError(field, 'EMAIL_INVALID');
      return this.crypto.keyedHash('web_request_contact', `email:${e}`);
    }
    const p = normalizePhone(v);
    if (!p.ok) throw fieldError(field, p.code);
    return this.crypto.keyedHash('web_request_contact', `phone:${p.e164}`);
  }

  // ───────────────────────── lookup (SEC ARC-16) ─────────────────────────

  async lookup(tx: Tx, actor: Actor, body: Record<string, unknown>): Promise<{ data: unknown[] }> {
    const hasPhone = body.phone !== undefined && body.phone !== null;
    const hasEmail = body.email !== undefined && body.email !== null;
    for (const k of Object.keys(body)) {
      if (k !== 'phone' && k !== 'email') throw fieldError(k, 'NOT_ALLOWED');
    }
    if (hasPhone && hasEmail) throw fieldError('email', 'NOT_ALLOWED');
    if (!hasPhone && !hasEmail) throw fieldError('phone', 'REQUIRED');
    let h: string;
    if (hasPhone) {
      if (typeof body.phone !== 'string') throw fieldError('phone', 'VALIDATION_FAILED');
      const p = normalizePhone(body.phone);
      if (!p.ok) throw fieldError('phone', p.code);
      h = this.crypto.keyedHash('web_request_contact', `phone:${p.e164}`);
    } else {
      if (typeof body.email !== 'string') throw fieldError('email', 'VALIDATION_FAILED');
      const e = normalizeEmail(body.email);
      if (!e) throw fieldError('email', 'EMAIL_INVALID');
      h = this.crypto.keyedHash('web_request_contact', `email:${e}`);
    }
    const c = await this.ctx(tx);
    const { rows } = await tx.query<{
      id: string;
      ref_code: string;
      status: string;
      created_at: Date;
    }>(
      `SELECT id, ref_code, status, created_at FROM website_booking_request
        WHERE contact_hmac = $1 AND status <> 'converted' AND pii_purged_at IS NULL
        ORDER BY created_at DESC LIMIT 50`,
      [h],
    );
    await this.audit.record(tx, {
      category: 'security',
      action: 'website_request.lookup',
      entityType: 'website_booking_request',
      after: { resultCount: rows.length },
      ...(actor.requestId ? { requestId: actor.requestId } : {}),
    });
    return {
      data: rows.map((x) => ({
        id: x.id,
        refCode: x.ref_code,
        status: x.status,
        createdAt: c.iso(x.created_at),
      })),
    };
  }
}

/** The C2 columns NULLed by WR6 (converted), WR8 (erase) and the retention job (erd 4.14). */
export const PII_NULLS =
  'guest_name = NULL, phone_e164 = NULL, email = NULL, note = NULL, decline_note = NULL, contact_hmac = NULL';

export { SYSTEM_DECLINE_CODES };
