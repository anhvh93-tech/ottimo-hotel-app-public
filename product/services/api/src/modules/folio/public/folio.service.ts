/**
 * Folio – the money side of a booking (erd 4.6, SM-13; BR-008, BR-305, BR-434, BR-903/904; DATA erd 8).
 *
 * Public API for the reservations (BE-A) and payments modules, always in the caller's transaction:
 * - openForReservation()      one `open` folio per primary booking (reservation.folio_id points at it).
 * - onReservationConfirmed()  B2/B4/B12: room line per sold night (snapshot price, stay_night_id), extra-person
 *                             lines (BR-110), commission `projected` (SM-11, BR-903) and OTA channel fee
 *                             (BR-901), each allocated over the nights of stay_night (erd 8, Σ = total).
 * - onReservationVoided()     B5/B6/B10/B11: live commissions → `void` (SM-11).
 * - lock()/totals()/view()    for payments (deposit B4) and getFolio.
 * FOC/discount lines are linked to approvals (SM-10) by FolioFocService (approval hooks, BR-434).
 *
 * Line `description` of system lines is a neutral code (`room_night`, `extra_guest xN`); clients render by
 * category + serviceDate in the UI language (erd `description_i18n` – R3).
 * Rules: lines are only INSERTed (amounts never updated – a correction is a reversal + new line, BR-008); every
 * posting writes `audit_event` category money in the same transaction (recordMoney); lock order
 * reservation (caller) → folio FOR UPDATE; numbers come from parameters/snapshots, never from code.
 */
import { Inject, Injectable } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import { CLOCK, type Clock } from '../../../clock';
import type { Tx } from '../../../db/database';
import type { FolioLineCategory } from '../../../db/schema/folio';
import { problem } from '../../../shared/problem';
import { type LocalDate, localDate, toZonedIso } from '../../../shared/time';
import { AuditService } from '../../audit/public/audit.service';
import { ChannelsService } from '../../platform/public/channels';
import { ParameterService } from '../../platform/public/parameter.service';
import { applyPct } from '../../reservations/public/pricing';
import type { ConfirmedStay } from '../../reservations/public/sales-port';
import { allocate } from './allocate';

export type RevenueGroup = 'room' | 'other' | 'non_revenue';
export type PayeeType = 'agent' | 'staff';

/** Revenue group of a charge category (BR-904: room revenue excludes surcharges, minibar, fees). */
export function revenueGroupOf(category: FolioLineCategory): RevenueGroup {
  return category === 'room' ? 'room' : 'other';
}

export interface FolioRow {
  id: string;
  property_id: string;
  primary_reservation_id: string;
  status: 'open' | 'settled' | 'closed';
  bill_no: string | null;
  post_checkout_window_until: Date | null;
  version: number;
}

export interface FolioLineRow {
  id: string;
  folio_id: string;
  reservation_id: string | null;
  category: FolioLineCategory;
  revenue_group: RevenueGroup;
  description: string;
  service_date: string | null;
  quantity: string;
  unit_price_vnd: number;
  amount_vnd: number;
  vat_rate_pct: string | null;
  line_state: 'posted' | 'pending_approval' | 'rejected';
  related_line_id: string | null;
  reversal_of_id: string | null;
  approval_request_id: string | null;
  stay_night_id: string | null;
  posted_at: Date;
  posted_by: string | null;
  posted_by_name: string | null;
}

export interface PaymentRowLite {
  id: string;
  code: string;
  type: string;
  method: string;
  amount_vnd: number;
  status: string;
  received_at: Date | null;
  recorded_by: string | null;
  recorded_by_name: string | null;
  reconciliation: string;
  reconciled_at: Date | null;
  reconciliation_note: string | null;
  payer_name: string | null;
  card_brand: string | null;
  card_last4: string | null;
  reversal_of_id: string | null;
  expires_at: Date | null;
  method_detail: string | null;
  note: string | null;
  attachment_id: string | null;
  confirmed_at: Date | null;
  confirmed_by: string | null;
  reservation_id: string | null;
  version: number;
}

export interface FolioTotals {
  roomVnd: number;
  otherVnd: number;
  focVnd: number;
  totalVnd: number;
  paidVnd: number;
  paidViaOtaVnd: number;
  depositHeldVnd: number;
  balanceDueVnd: number;
}

/** Σ of the posted lines and succeeded payments (erd 4.6: balances are computed, never stored). */
export function computeTotals(
  lines: ReadonlyArray<
    Pick<FolioLineRow, 'category' | 'revenue_group' | 'amount_vnd' | 'line_state'>
  >,
  payments: ReadonlyArray<Pick<PaymentRowLite, 'type' | 'method' | 'amount_vnd' | 'status'>>,
): FolioTotals {
  let roomVnd = 0;
  let otherVnd = 0;
  let focVnd = 0;
  let totalVnd = 0;
  for (const l of lines) {
    if (l.line_state !== 'posted') continue;
    totalVnd += l.amount_vnd;
    if (l.category === 'foc' || l.category === 'discount') focVnd -= l.amount_vnd;
    else if (l.revenue_group === 'room') roomVnd += l.amount_vnd;
    else otherVnd += l.amount_vnd;
  }
  let paidVnd = 0;
  let paidViaOtaVnd = 0;
  let depositHeldVnd = 0;
  for (const p of payments) {
    if (p.status !== 'succeeded') continue;
    // A security deposit (long stay) is held, not a payment of the bill (BR-206).
    if (p.type === 'security_deposit') continue;
    paidVnd += p.amount_vnd;
    if (p.method === 'ota_collect') paidViaOtaVnd += p.amount_vnd;
    if (p.type === 'deposit') depositHeldVnd += p.amount_vnd;
  }
  return {
    roomVnd,
    otherVnd,
    focVnd,
    totalVnd,
    paidVnd,
    paidViaOtaVnd,
    depositHeldVnd,
    balanceDueVnd: totalVnd - paidVnd,
  };
}

/** Commission payee of a closer by role in the property (BR-903): CTV → agent, sale → staff. */
export function payeeTypeOf(roles: readonly string[]): PayeeType | null {
  if (roles.includes('collaborator')) return 'agent';
  if (roles.includes('sales_staff')) return 'staff';
  return null;
}

/** short_stay_commission_pct key of a payee type ({collaborator: 8, staff: 3}). */
export function commissionPctFor(table: unknown, payee: PayeeType): number | null {
  if (!table || typeof table !== 'object') return null;
  const v = (table as Record<string, unknown>)[payee === 'agent' ? 'collaborator' : 'staff'];
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null;
}

@Injectable()
export class FolioService {
  constructor(
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(ParameterService) private readonly params: ParameterService,
    @Inject(ChannelsService) private readonly channels: ChannelsService,
  ) {}

  /** One open folio per primary booking. `folioId` lets the caller pre-generate it (deferred FK). */
  async openForReservation(
    tx: Tx,
    input: { reservationId: string; folioId?: string; createdBy: string | null },
  ): Promise<string> {
    const id = input.folioId ?? uuidv7();
    const now = this.clock.now();
    await tx.query(
      `INSERT INTO folio (id, organization_id, property_id, primary_reservation_id, status, created_at,
         created_by, updated_at)
       VALUES ($1, $2, $3, $4, 'open', $5, $6, $5)`,
      [id, tx.ctx.organizationId, tx.ctx.propertyId, input.reservationId, now, input.createdBy],
    );
    return id;
  }

  /** `SELECT … FOR UPDATE` (lock order: reservation → room → folio). Null when not visible. */
  async lock(tx: Tx, folioId: string): Promise<FolioRow | null> {
    const { rows } = await tx.query<FolioRow>(
      `SELECT id, property_id, primary_reservation_id, status, bill_no, post_checkout_window_until, version
         FROM folio WHERE id = $1 FOR UPDATE`,
      [folioId],
    );
    return rows[0] ?? null;
  }

  async get(tx: Tx, folioId: string): Promise<FolioRow | null> {
    const { rows } = await tx.query<FolioRow>(
      `SELECT id, property_id, primary_reservation_id, status, bill_no, post_checkout_window_until, version
         FROM folio WHERE id = $1`,
      [folioId],
    );
    return rows[0] ?? null;
  }

  async lines(tx: Tx, folioId: string): Promise<FolioLineRow[]> {
    const { rows } = await tx.query<FolioLineRow>(
      `SELECT l.id, l.folio_id, l.reservation_id, l.category, l.revenue_group, l.description,
              l.service_date::text AS service_date, l.quantity, l.unit_price_vnd, l.amount_vnd, l.vat_rate_pct,
              l.line_state, l.related_line_id, l.reversal_of_id, l.approval_request_id, l.stay_night_id,
              l.posted_at, l.posted_by, u.display_name AS posted_by_name
         FROM folio_line l LEFT JOIN app_user u ON u.id = l.posted_by
        WHERE l.folio_id = $1
        ORDER BY l.posted_at, l.service_date NULLS LAST, l.id`,
      [folioId],
    );
    return rows;
  }

  async payments(tx: Tx, folioId: string): Promise<PaymentRowLite[]> {
    const { rows } = await tx.query<PaymentRowLite>(
      `SELECT p.id, p.code, p.type, p.method, p.amount_vnd, p.status, p.received_at, p.recorded_by,
              u.display_name AS recorded_by_name, p.reconciliation, p.reconciled_at, p.reconciliation_note,
              p.payer_name, p.card_brand, p.card_last4, p.reversal_of_id, p.expires_at, p.method_detail,
              p.note, p.attachment_id, p.confirmed_at, p.confirmed_by, p.reservation_id, p.version
         FROM payment p LEFT JOIN app_user u ON u.id = p.recorded_by
        WHERE p.folio_id = $1
        ORDER BY p.received_at NULLS LAST, p.id`,
      [folioId],
    );
    return rows;
  }

  async totals(tx: Tx, folioId: string): Promise<FolioTotals> {
    return computeTotals(await this.lines(tx, folioId), await this.payments(tx, folioId));
  }

  /** Σ succeeded deposit payments of a folio (B4 sufficiency, BR-305). */
  async depositPaid(tx: Tx, folioId: string): Promise<number> {
    const { rows } = await tx.query<{ total: string | number }>(
      `SELECT COALESCE(SUM(amount_vnd), 0) AS total FROM payment
        WHERE folio_id = $1 AND type = 'deposit' AND status = 'succeeded'`,
      [folioId],
    );
    return Number(rows[0]?.total ?? 0);
  }

  /**
   * B2 / B4 / B12 money postings (see header). Idempotent per night: a night that already has a live room
   * line is skipped, so restoring a booking never doubles its charges.
   */
  async onReservationConfirmed(
    tx: Tx,
    stay: ConfirmedStay & { commissionRatePctSnapshot?: number | null },
    actor: { userId: string | null; requestId?: string },
  ): Promise<{ roomVnd: number; extraPersonVnd: number; commissionVnd: number }> {
    const folio = await this.lock(tx, stay.folioId);
    if (!folio) throw new Error(`folio ${stay.folioId} not visible for ${stay.reservationCode}`);
    if (folio.status !== 'open') throw problem('FOLIO_LOCKED');
    const now = this.clock.now();
    const tz = await this.timezone(tx);
    const today = localDate(now, tz);

    const { rows: posted } = await tx.query<{ stay_night_id: string }>(
      `SELECT l.stay_night_id FROM folio_line l
        WHERE l.folio_id = $1 AND l.category = 'room' AND l.stay_night_id = ANY($2::uuid[])
          AND l.reversal_of_id IS NULL
          AND NOT EXISTS (SELECT 1 FROM folio_line r WHERE r.reversal_of_id = l.id)`,
      [folio.id, stay.nights.map((n) => n.stayNightId)],
    );
    const already = new Set(posted.map((p) => p.stay_night_id));
    const nights = stay.nights.filter((n) => !already.has(n.stayNightId));

    let roomVnd = 0;
    let extraPersonVnd = 0;
    for (const n of nights) {
      await this.insertLine(tx, {
        folioId: folio.id,
        reservationId: stay.reservationId,
        category: 'room',
        description: 'room_night',
        quantity: 1,
        unitPriceVnd: n.roomRevenueVnd,
        amountVnd: n.roomRevenueVnd,
        serviceDate: n.date,
        stayNightId: n.stayNightId,
        source: 'system',
        postedBy: actor.userId,
        now,
      });
      roomVnd += n.roomRevenueVnd;
      if (stay.extraPersonPerNightVnd > 0) {
        await this.insertLine(tx, {
          folioId: folio.id,
          reservationId: stay.reservationId,
          category: 'extra_person',
          description: `extra_guest x${stay.extraGuestCount}`,
          quantity: 1,
          unitPriceVnd: stay.extraPersonPerNightVnd,
          amountVnd: stay.extraPersonPerNightVnd,
          serviceDate: n.date,
          stayNightId: null,
          source: 'system',
          postedBy: actor.userId,
          now,
        });
        extraPersonVnd += stay.extraPersonPerNightVnd;
      }
    }

    const commissionVnd = await this.projectCommission(tx, stay, today, now);
    await this.channelFee(tx, stay, today, now);

    if (nights.length > 0 || commissionVnd > 0) {
      await this.audit.recordMoney(tx, {
        action: 'folio.charges_posted',
        entityType: 'folio',
        entityId: folio.id,
        entityCode: stay.reservationCode,
        after: { roomVnd, extraPersonVnd, nights: nights.length, commissionVnd },
        ...(actor.requestId ? { requestId: actor.requestId } : {}),
      });
    }
    return { roomVnd, extraPersonVnd, commissionVnd };
  }

  /** B5/B6/B10/B11: live commissions of the booking → void (SM-11). */
  async onReservationVoided(
    tx: Tx,
    input: { reservationId: string; reservationCode: string; reason: string; requestId?: string },
  ): Promise<number> {
    const now = this.clock.now();
    const { rows } = await tx.query<{ id: string; amount_vnd: number }>(
      `UPDATE commission SET status = 'void', void_reason = $2, updated_at = $3, version = version + 1
        WHERE reservation_id = $1 AND status IN ('projected', 'earned')
        RETURNING id, amount_vnd`,
      [input.reservationId, input.reason, now],
    );
    for (const c of rows) {
      await this.audit.recordMoney(tx, {
        action: 'commission.voided',
        entityType: 'commission',
        entityId: c.id,
        entityCode: input.reservationCode,
        before: { status: 'projected', amountVnd: c.amount_vnd },
        after: { status: 'void', voidReason: input.reason },
        ...(input.requestId ? { requestId: input.requestId } : {}),
      });
    }
    return rows.length;
  }

  /** Append one line (never updates an amount – BR-008). */
  async insertLine(
    tx: Tx,
    l: {
      folioId: string;
      reservationId: string | null;
      category: FolioLineCategory;
      revenueGroup?: RevenueGroup;
      description: string;
      quantity: number;
      unitPriceVnd: number;
      amountVnd: number;
      serviceDate: LocalDate | null;
      stayNightId: string | null;
      source:
        'manual' | 'system' | 'minibar_check' | 'extension' | 'checkin' | 'checkout' | 'guest_app';
      postedBy: string | null;
      now: Date;
      lineState?: 'posted' | 'pending_approval';
      relatedLineId?: string | null;
      vatRatePct?: number | null;
    },
  ): Promise<string> {
    if (!Number.isSafeInteger(l.amountVnd) || !Number.isSafeInteger(l.unitPriceVnd)) {
      throw new RangeError('folio line amounts must be safe integers');
    }
    const id = uuidv7();
    await tx.query(
      `INSERT INTO folio_line (id, organization_id, property_id, folio_id, reservation_id, category,
         revenue_group, description, quantity, unit_price_vnd, amount_vnd, vat_rate_pct, service_date,
         stay_night_id, line_state, related_line_id, source, posted_at, posted_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $18)`,
      [
        id,
        tx.ctx.organizationId,
        tx.ctx.propertyId,
        l.folioId,
        l.reservationId,
        l.category,
        l.revenueGroup ?? revenueGroupOf(l.category),
        l.description,
        String(l.quantity),
        l.unitPriceVnd,
        l.amountVnd,
        l.vatRatePct === undefined || l.vatRatePct === null ? null : String(l.vatRatePct),
        l.serviceDate,
        l.stayNightId,
        l.lineState ?? 'posted',
        l.relatedLineId ?? null,
        l.source,
        l.now,
        l.postedBy,
      ],
    );
    return id;
  }

  /** SM-11 [*] → projected (BR-903): CTV/sale closer, % × room total, allocated over the nights. */
  private async projectCommission(
    tx: Tx,
    stay: ConfirmedStay & { commissionRatePctSnapshot?: number | null },
    today: LocalDate,
    now: Date,
  ): Promise<number> {
    if (!stay.closerUserId || stay.stayType !== 'short' || stay.nights.length === 0) return 0;
    const { rows: roleRows } = await tx.query<{ role: string }>(
      `SELECT role FROM user_property_role WHERE user_id = $1 AND property_id = $2 AND revoked_at IS NULL`,
      [stay.closerUserId, tx.ctx.propertyId],
    );
    const payee = payeeTypeOf(roleRows.map((r) => r.role));
    if (!payee) return 0;
    const ratePct =
      stay.commissionRatePctSnapshot ??
      commissionPctFor(await this.params.get(tx, 'short_stay_commission_pct', today), payee);
    if (ratePct === null || ratePct <= 0) return 0;
    const base = stay.nights.reduce((a, n) => a + n.roomRevenueVnd, 0);
    const amount = applyPct(base, ratePct, 1);
    const id = uuidv7();
    const { rowCount } = await tx.query(
      `INSERT INTO commission (id, organization_id, property_id, reservation_id, payee_type, payee_user_id,
         rate_pct_snapshot, base_amount_vnd, amount_vnd, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'projected', $10, $10)
       ON CONFLICT DO NOTHING`,
      [
        id,
        tx.ctx.organizationId,
        tx.ctx.propertyId,
        stay.reservationId,
        payee,
        stay.closerUserId,
        String(ratePct),
        base,
        amount,
        now,
      ],
    );
    if (!rowCount) return 0; // a live commission already exists for this payee
    const parts = allocate(
      amount,
      stay.nights.map((n) => n.roomRevenueVnd),
    );
    const column = payee === 'agent' ? 'agent_commission_vnd' : 'staff_commission_vnd';
    for (const [i, n] of stay.nights.entries()) {
      await tx.query(`UPDATE stay_night SET ${column} = $2, updated_at = $3 WHERE id = $1`, [
        n.stayNightId,
        parts[i],
        now,
      ]);
    }
    await this.audit.recordMoney(tx, {
      action: 'commission.projected',
      entityType: 'commission',
      entityId: id,
      entityCode: stay.reservationCode,
      after: { status: 'projected', payeeType: payee, ratePct, baseVnd: base, amountVnd: amount },
    });
    return amount;
  }

  /** BR-901 / DATA FB-01: OTA channel fee (reported or estimated) allocated over the nights. */
  private async channelFee(
    tx: Tx,
    stay: ConfirmedStay,
    today: LocalDate,
    now: Date,
  ): Promise<void> {
    if (stay.nights.length === 0) return;
    const channel = await this.channels.byId(tx, stay.channelId, today);
    if (!channel || channel.channelGroup !== 'ota') return;
    const base = stay.nights.reduce((a, n) => a + n.roomRevenueVnd, 0);
    const ratePct = channel.commissionRatePct ?? 0;
    const estimated = applyPct(base, ratePct, 1);
    const actual = stay.otaChannelFeeVnd ?? null;
    const amount = actual ?? estimated;
    await tx.query(
      `INSERT INTO channel_fee (id, organization_id, property_id, reservation_id, channel_id, base_amount_vnd,
         rate_pct_snapshot, amount_estimated_vnd, amount_actual_vnd, source, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11)
       ON CONFLICT (reservation_id) DO NOTHING`,
      [
        uuidv7(),
        tx.ctx.organizationId,
        tx.ctx.propertyId,
        stay.reservationId,
        stay.channelId,
        base,
        String(ratePct),
        estimated,
        actual,
        actual === null ? 'estimate' : 'manual_reconcile',
        now,
      ],
    );
    const parts = allocate(
      amount,
      stay.nights.map((n) => n.roomRevenueVnd),
    );
    for (const [i, n] of stay.nights.entries()) {
      await tx.query(
        `UPDATE stay_night SET channel_fee_vnd = $2, channel_fee_is_estimate = $3, updated_at = $4 WHERE id = $1`,
        [n.stayNightId, parts[i], actual === null, now],
      );
    }
  }

  async timezone(tx: Tx): Promise<string> {
    const { rows } = await tx.query<{ timezone: string }>(
      'SELECT timezone FROM property WHERE id = $1',
      [tx.ctx.propertyId],
    );
    const tz = rows[0]?.timezone;
    if (!tz) throw problem('NOT_FOUND');
    return tz;
  }

  iso(instant: Date | null, tz: string): string | undefined {
    return instant ? toZonedIso(instant, tz) : undefined;
  }
}
