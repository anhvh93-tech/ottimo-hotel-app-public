/**
 * Folio – the money side of a booking (erd 4.6, SM-13; BR-008, BR-305, BR-434, BR-903/904; DATA erd 8).
 *
 * Public API for the reservations (BE-A) and payments modules, always in the caller's transaction:
 * - openForReservation()      one `open` folio per primary booking (reservation.folio_id points at it).
 * - onReservationConfirmed()  B2/B4/B12: room line per sold night (snapshot price, stay_night_id), extra-person
 *                             lines (BR-110), commission `projected` (SM-11, BR-903) and OTA channel fee
 *                             (BR-901), each allocated over the nights of stay_night (erd 8, Σ = total).
 * - resyncStay()              B7/B8/B13/B16/PATCH people: same full sync (reversal + repost – DOM BE-02/03).
 * - onReservationVoided()     B5/B6/B10/B11/relocation: commissions → `void` (SM-11).
 * - voidStay()                FOLIO_STAY_SYNC (BE-A port): reversal of the voided nights' lines + one fee line
 *                             for the retained money (DOM BE-01).
 * stay_night allocations go through reservations/public StayNightAllocationService (ARC S2-07).
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
import type { FolioStaySync, VoidStayInput } from '../../reservations/public/folio-sync-port';
import type { ConfirmedStay } from '../../reservations/public/sales-port';
import { StayNightAllocationService } from '../../reservations/public/stay-night-allocation';
import { allocate } from './allocate';

export type RevenueGroup = 'room' | 'other' | 'non_revenue';
export type PayeeType = 'agent' | 'staff';

/** Revenue group of a charge category (BR-904: room revenue excludes surcharges, minibar, fees). */
export function revenueGroupOf(category: FolioLineCategory): RevenueGroup {
  return category === 'room' ? 'room' : 'other';
}

export interface SyncResult {
  roomVnd: number;
  extraPersonVnd: number;
  reversedVnd: number;
  commissionVnd: number;
}

interface LiveLine {
  id: string;
  category: FolioLineCategory;
  revenue_group: RevenueGroup;
  description: string;
  quantity: string;
  unit_price_vnd: number;
  amount_vnd: number;
  service_date: string | null;
  stay_night_id: string | null;
  related_line_id: string | null;
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
export class FolioService implements FolioStaySync {
  constructor(
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(ParameterService) private readonly params: ParameterService,
    @Inject(ChannelsService) private readonly channels: ChannelsService,
    @Inject(StayNightAllocationService) private readonly nights: StayNightAllocationService,
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
   * B2 / B4 / B12 money postings (see header) – a full sync of the folio with the sold nights (`syncStay`):
   * idempotent, so a restore (B12) re-posts exactly the nights whose line was reversed at B11.
   */
  async onReservationConfirmed(
    tx: Tx,
    stay: ConfirmedStay,
    actor: { userId: string | null; requestId?: string },
  ): Promise<SyncResult> {
    return this.syncStay(tx, stay, actor, 'folio.charges_posted');
  }

  /**
   * B7 / B8 / B13 / B16 / PATCH people (FB-R2-DOM-BE-02): the booking changed nights, prices (BR-107 re-tier,
   * DOM D-8) or people. Same sync as onReservationConfirmed: lines of nights no longer sold and lines whose
   * price changed are REVERSED (BR-008), new nights / new prices / new extra-person fee are posted,
   * commission and OTA channel fee are recomputed and re-allocated.
   */
  async resyncStay(
    tx: Tx,
    stay: ConfirmedStay,
    actor: { userId: string | null; requestId?: string },
  ): Promise<void> {
    await this.syncStay(tx, stay, actor, 'folio.charges_resynced');
  }

  /** B5/B6/B10/B11/relocation: live commissions of the booking → void (SM-11). */
  async onReservationVoided(
    tx: Tx,
    input: { reservationId: string; reservationCode: string; reason: string; requestId?: string },
  ): Promise<number> {
    return this.voidCommissions(
      tx,
      input.reservationId,
      input.reservationCode,
      input.reason,
      this.clock.now(),
      input.requestId,
    );
  }

  /**
   * FOLIO_STAY_SYNC.voidStay – B10 / B11 / relocation (FB-R2-DOM-BE-01 Blocker):
   * - reverses the live `room` lines of `voidedStayNightIds` and the `extra_person` lines of the same dates,
   *   with the posted FOC/discount lines that reduced them (BR-008: reversal lines, never an edit);
   * - posts ONE line for the retained money (`retainedVnd` > 0): `cancellation_fee` (BR-309) or `no_show_fee`
   *   (BR-311), revenue "other" (BR-904); the refundable part stays in the refund approval flow (BR-522),
   *   so until it is paid back the balance shows it as a credit (negative balance);
   * - holds (B5/B6) have no posted lines → no-op. Money audit `folio.stay_reversed` in the same transaction.
   * Commissions are voided by onReservationVoided (called by reservations just before).
   */
  async voidStay(tx: Tx, input: VoidStayInput, who: { userId: string | null }): Promise<void> {
    const retained = input.retainedVnd;
    if (!Number.isSafeInteger(retained) || retained < 0) {
      throw new RangeError('retainedVnd must be a non-negative safe integer');
    }
    const folio = await this.lock(tx, input.folioId);
    if (!folio) throw new Error(`folio ${input.folioId} not visible for ${input.reservationCode}`);
    if (folio.status !== 'open') throw problem('FOLIO_LOCKED');
    const now = this.clock.now();
    const live = await this.liveLines(tx, folio.id, input.reservationId);
    const nightIds = new Set(input.voidedStayNightIds);
    const voidedRoom = live.filter(
      (l) => l.category === 'room' && l.stay_night_id !== null && nightIds.has(l.stay_night_id),
    );
    const dates = new Set(voidedRoom.map((l) => l.service_date));
    let reversedVnd = 0;
    for (const l of voidedRoom) {
      reversedVnd += await this.reverseWithReductions(tx, l, live, who.userId, now);
    }
    for (const l of live.filter(
      (x) => x.category === 'extra_person' && dates.has(x.service_date),
    )) {
      reversedVnd += await this.reverseWithReductions(tx, l, live, who.userId, now);
    }
    let feeVnd = 0;
    if (retained > 0) {
      const category =
        input.retainedKind ?? (input.reason === 'no_show' ? 'no_show_fee' : 'cancellation_fee');
      await this.insertLine(tx, {
        folioId: folio.id,
        reservationId: input.reservationId,
        category,
        description: category,
        quantity: 1,
        unitPriceVnd: retained,
        amountVnd: retained,
        serviceDate: localDate(now, await this.timezone(tx)),
        stayNightId: null,
        source: 'system',
        postedBy: who.userId,
        now,
      });
      feeVnd = retained;
    }
    if (reversedVnd !== 0 || feeVnd > 0) {
      await this.audit.recordMoney(tx, {
        action: 'folio.stay_reversed',
        entityType: 'folio',
        entityId: folio.id,
        entityCode: input.reservationCode,
        after: { reversedVnd, feeVnd, status: input.reason },
        ...(input.requestId ? { requestId: input.requestId } : {}),
      });
    }
  }

  // ───────────── sync (B2/B4/B7/B8/B12/B13/B16/PATCH) ─────────────

  private async syncStay(
    tx: Tx,
    stay: ConfirmedStay,
    who: { userId: string | null; requestId?: string },
    action: string,
  ): Promise<SyncResult> {
    const folio = await this.lock(tx, stay.folioId);
    if (!folio) throw new Error(`folio ${stay.folioId} not visible for ${stay.reservationCode}`);
    if (folio.status !== 'open') throw problem('FOLIO_LOCKED');
    const now = this.clock.now();
    const tz = await this.timezone(tx);
    const today = localDate(now, tz);
    const by = who.userId;
    let live = await this.liveLines(tx, folio.id, stay.reservationId);
    const result: SyncResult = { roomVnd: 0, extraPersonVnd: 0, reversedVnd: 0, commissionVnd: 0 };

    // B12: a restored no-show drops its fee (the nights are charged again below).
    for (const l of live.filter((x) => x.category === 'no_show_fee')) {
      result.reversedVnd += await this.reverseWithReductions(tx, l, live, by, now);
    }

    // Room nights: keep a live line whose gross (line − nothing) still equals the night, else reverse.
    const target = new Map(stay.nights.map((n) => [n.stayNightId, n]));
    const kept = new Set<string>();
    for (const l of live.filter((x) => x.category === 'room' && x.stay_night_id)) {
      const night = target.get(l.stay_night_id as string);
      const reduced = this.reductionOf(l, live);
      if (
        night &&
        !kept.has(night.stayNightId) &&
        l.amount_vnd === night.roomRevenueVnd + reduced
      ) {
        kept.add(night.stayNightId);
        continue;
      }
      result.reversedVnd += await this.reverseWithReductions(tx, l, live, by, now);
    }
    for (const n of stay.nights) {
      if (kept.has(n.stayNightId)) continue;
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
        postedBy: who.userId,
        now,
      });
      result.roomVnd += n.roomRevenueVnd;
    }

    // Extra-person fee (BR-110): one line per sold night at the current per-night fee.
    live = await this.liveLines(tx, folio.id, stay.reservationId);
    const perNight = stay.extraPersonPerNightVnd;
    const wanted = new Set(perNight > 0 ? stay.nights.map((n) => n.date) : []);
    const keptDates = new Set<string>();
    for (const l of live.filter((x) => x.category === 'extra_person')) {
      const d = l.service_date ?? '';
      if (wanted.has(d) && !keptDates.has(d) && l.amount_vnd === perNight) {
        keptDates.add(d);
        continue;
      }
      result.reversedVnd += await this.reverseWithReductions(tx, l, live, by, now);
    }
    for (const d of wanted) {
      if (keptDates.has(d)) continue;
      await this.insertLine(tx, {
        folioId: folio.id,
        reservationId: stay.reservationId,
        category: 'extra_person',
        description: `extra_guest x${stay.extraGuestCount}`,
        quantity: 1,
        unitPriceVnd: perNight,
        amountVnd: perNight,
        serviceDate: d,
        stayNightId: null,
        source: 'system',
        postedBy: who.userId,
        now,
      });
      result.extraPersonVnd += perNight;
    }

    result.commissionVnd = await this.syncCommission(tx, stay, today, now, who.requestId);
    await this.syncChannelFee(tx, stay, today, now, who.requestId);

    if (result.roomVnd !== 0 || result.extraPersonVnd !== 0 || result.reversedVnd !== 0) {
      await this.audit.recordMoney(tx, {
        action,
        entityType: 'folio',
        entityId: folio.id,
        entityCode: stay.reservationCode,
        after: {
          roomVnd: result.roomVnd,
          extraPersonVnd: result.extraPersonVnd,
          reversedVnd: result.reversedVnd,
          nights: stay.nights.length,
          commissionVnd: result.commissionVnd,
        },
        ...(who.requestId ? { requestId: who.requestId } : {}),
      });
    }
    return result;
  }

  /** Posted, non-reversal, not-yet-reversed lines of one booking on a folio. */
  private async liveLines(tx: Tx, folioId: string, reservationId: string): Promise<LiveLine[]> {
    const { rows } = await tx.query<LiveLine>(
      `SELECT l.id, l.category, l.revenue_group, l.description, l.quantity, l.unit_price_vnd, l.amount_vnd,
              l.service_date::text AS service_date, l.stay_night_id, l.related_line_id
         FROM folio_line l
        WHERE l.folio_id = $1 AND l.reservation_id = $2 AND l.line_state = 'posted'
          AND l.reversal_of_id IS NULL
          AND NOT EXISTS (SELECT 1 FROM folio_line r WHERE r.reversal_of_id = l.id)
        ORDER BY l.posted_at, l.id`,
      [folioId, reservationId],
    );
    return rows;
  }

  /** Σ of the posted FOC/discount lines that reduce `line` (positive VND). */
  private reductionOf(line: LiveLine, live: readonly LiveLine[]): number {
    return live
      .filter(
        (r) => r.related_line_id === line.id && (r.category === 'foc' || r.category === 'discount'),
      )
      .reduce((a, r) => a - r.amount_vnd, 0);
  }

  /**
   * Reversal of a line (BR-008: opposite amount, `reversal_of_id`) and of the posted FOC/discount lines that
   * reduced it; a reversed room discount is taken back from its night. Returns the net reversed amount.
   */
  private async reverseWithReductions(
    tx: Tx,
    line: LiveLine,
    live: readonly LiveLine[],
    by: string | null,
    now: Date,
  ): Promise<number> {
    let net = await this.reverse(tx, line, by, now);
    for (const r of live.filter(
      (x) => x.related_line_id === line.id && (x.category === 'foc' || x.category === 'discount'),
    )) {
      net += await this.reverse(tx, r, by, now);
      if (line.category === 'room' && line.stay_night_id) {
        await this.nights.addDiscount(tx, line.stay_night_id, r.amount_vnd);
      }
    }
    return net;
  }

  private async reverse(tx: Tx, l: LiveLine, by: string | null, now: Date): Promise<number> {
    const id = uuidv7();
    await tx.query(
      `INSERT INTO folio_line (id, organization_id, property_id, folio_id, reservation_id, category, adjusts_group,
         revenue_group, description, quantity, unit_price_vnd, amount_vnd, vat_rate_pct, service_date,
         stay_night_id, line_state, related_line_id, reversal_of_id, source, posted_at, posted_by, created_at)
       SELECT $2, organization_id, property_id, folio_id, reservation_id, category, adjusts_group, revenue_group,
              description, quantity, -unit_price_vnd, -amount_vnd, vat_rate_pct, service_date, stay_night_id,
              'posted', related_line_id, id, 'system', $3, $4, $3
         FROM folio_line WHERE id = $1`,
      [l.id, id, now, by],
    );
    return l.amount_vnd;
  }

  private async voidCommissions(
    tx: Tx,
    reservationId: string,
    code: string,
    reason: string,
    now: Date,
    requestId?: string,
  ): Promise<number> {
    const { rows } = await tx.query<{ id: string; amount_vnd: number }>(
      `UPDATE commission SET status = 'void', void_reason = $2, updated_at = $3, version = version + 1
        WHERE reservation_id = $1 AND status IN ('projected', 'earned')
        RETURNING id, amount_vnd`,
      [reservationId, reason, now],
    );
    for (const c of rows) {
      await this.audit.recordMoney(tx, {
        action: 'commission.voided',
        entityType: 'commission',
        entityId: c.id,
        entityCode: code,
        before: { status: 'projected', amountVnd: c.amount_vnd },
        after: { status: 'void', voidReason: reason },
        ...(requestId ? { requestId } : {}),
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

  /**
   * SM-11 (BR-903, BR-006): the live `projected` commission of the closer must equal % × room total of the
   * sold nights. Changed closer / base / rate → old row `void` (reason `resync`) + new row; always
   * re-allocated over the current nights (Σ = amount, remainder on the last night).
   */
  private async syncCommission(
    tx: Tx,
    stay: ConfirmedStay,
    today: LocalDate,
    now: Date,
    requestId?: string,
  ): Promise<number> {
    let desired: { payee: PayeeType; ratePct: number; base: number; amount: number } | null = null;
    if (stay.closerUserId && stay.stayType === 'short' && stay.nights.length > 0) {
      const { rows: roleRows } = await tx.query<{ role: string }>(
        `SELECT upr.role FROM user_property_role upr JOIN app_user u ON u.id = upr.user_id
          WHERE upr.user_id = $1 AND upr.property_id = $2 AND upr.revoked_at IS NULL AND u.status = 'active'`,
        [stay.closerUserId, tx.ctx.propertyId],
      );
      const payee = payeeTypeOf(roleRows.map((r) => r.role));
      const ratePct = payee
        ? (stay.commissionRatePctSnapshot ??
          commissionPctFor(await this.params.get(tx, 'short_stay_commission_pct', today), payee))
        : null;
      if (payee && ratePct !== null && ratePct > 0) {
        const base = stay.nights.reduce((a, n) => a + n.roomRevenueVnd, 0);
        desired = { payee, ratePct, base, amount: applyPct(base, ratePct, 1) };
      }
    }
    const { rows: liveRows } = await tx.query<{
      id: string;
      payee_user_id: string;
      payee_type: PayeeType;
      rate_pct_snapshot: string;
      base_amount_vnd: number;
      amount_vnd: number;
    }>(
      `SELECT id, payee_user_id, payee_type, rate_pct_snapshot, base_amount_vnd, amount_vnd FROM commission
        WHERE reservation_id = $1 AND status = 'projected' FOR UPDATE`,
      [stay.reservationId],
    );
    let current = liveRows.find(
      (c) =>
        desired &&
        c.payee_user_id === stay.closerUserId &&
        c.payee_type === desired.payee &&
        Number(c.rate_pct_snapshot) === desired.ratePct &&
        c.base_amount_vnd === desired.base,
    );
    for (const c of liveRows) {
      if (c === current) continue;
      await tx.query(
        `UPDATE commission SET status = 'void', void_reason = 'resync', updated_at = $2, version = version + 1
          WHERE id = $1`,
        [c.id, now],
      );
      await this.audit.recordMoney(tx, {
        action: 'commission.voided',
        entityType: 'commission',
        entityId: c.id,
        entityCode: stay.reservationCode,
        before: { status: 'projected', amountVnd: c.amount_vnd },
        after: { status: 'void', voidReason: 'resync' },
        ...(requestId ? { requestId } : {}),
      });
    }
    if (desired && !current) {
      const id = uuidv7();
      await tx.query(
        `INSERT INTO commission (id, organization_id, property_id, reservation_id, payee_type, payee_user_id,
           rate_pct_snapshot, base_amount_vnd, amount_vnd, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'projected', $10, $10)`,
        [
          id,
          tx.ctx.organizationId,
          tx.ctx.propertyId,
          stay.reservationId,
          desired.payee,
          stay.closerUserId,
          String(desired.ratePct),
          desired.base,
          desired.amount,
          now,
        ],
      );
      await this.audit.recordMoney(tx, {
        action: 'commission.projected',
        entityType: 'commission',
        entityId: id,
        entityCode: stay.reservationCode,
        after: {
          status: 'projected',
          payeeType: desired.payee,
          ratePct: desired.ratePct,
          baseVnd: desired.base,
          amountVnd: desired.amount,
        },
        ...(requestId ? { requestId } : {}),
      });
      current = {
        id,
        payee_user_id: stay.closerUserId as string,
        payee_type: desired.payee,
        rate_pct_snapshot: String(desired.ratePct),
        base_amount_vnd: desired.base,
        amount_vnd: desired.amount,
      };
    }
    if (stay.nights.length > 0) {
      const parts = current
        ? allocate(
            current.amount_vnd,
            stay.nights.map((n) => n.roomRevenueVnd),
          )
        : stay.nights.map(() => 0);
      await this.nights.setCommissions(
        tx,
        stay.nights.map((n, i) => ({
          stayNightId: n.stayNightId,
          agentVnd: current?.payee_type === 'agent' ? (parts[i] as number) : 0,
          staffVnd: current?.payee_type === 'staff' ? (parts[i] as number) : 0,
        })),
      );
    }
    return current?.amount_vnd ?? 0;
  }

  /** BR-901 / DATA FB-01: OTA channel fee (reported or estimated), money audit, allocated over the nights. */
  private async syncChannelFee(
    tx: Tx,
    stay: ConfirmedStay,
    today: LocalDate,
    now: Date,
    requestId?: string,
  ): Promise<void> {
    if (stay.nights.length === 0) return;
    const channel = await this.channels.byId(tx, stay.channelId, today);
    if (!channel || channel.channelGroup !== 'ota') return;
    const base = stay.nights.reduce((a, n) => a + n.roomRevenueVnd, 0);
    const { rows: existing } = await tx.query<{
      id: string;
      base_amount_vnd: number;
      rate_pct_snapshot: string;
      amount_estimated_vnd: number;
      amount_actual_vnd: number | null;
    }>(
      `SELECT id, base_amount_vnd, rate_pct_snapshot, amount_estimated_vnd, amount_actual_vnd
         FROM channel_fee WHERE reservation_id = $1 FOR UPDATE`,
      [stay.reservationId],
    );
    const old = existing[0];
    // The rate is snapshotted at the first posting (BR-006); a reported fee wins over the estimate.
    const ratePct = old ? Number(old.rate_pct_snapshot) : (channel.commissionRatePct ?? 0);
    const estimated = applyPct(base, ratePct, 1);
    const actual = stay.otaChannelFeeVnd ?? old?.amount_actual_vnd ?? null;
    let changed = false;
    if (!old) {
      await tx.query(
        `INSERT INTO channel_fee (id, organization_id, property_id, reservation_id, channel_id, base_amount_vnd,
           rate_pct_snapshot, amount_estimated_vnd, amount_actual_vnd, source, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11)`,
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
      changed = true;
    } else if (
      old.base_amount_vnd !== base ||
      old.amount_estimated_vnd !== estimated ||
      old.amount_actual_vnd !== actual
    ) {
      await tx.query(
        `UPDATE channel_fee SET base_amount_vnd = $2, amount_estimated_vnd = $3, amount_actual_vnd = $4,
            source = $5, updated_at = $6, version = version + 1
          WHERE id = $1`,
        [old.id, base, estimated, actual, actual === null ? 'estimate' : 'manual_reconcile', now],
      );
      changed = true;
    }
    if (changed) {
      await this.audit.recordMoney(tx, {
        action: old ? 'channel_fee.updated' : 'channel_fee.recorded',
        entityType: 'channel_fee',
        entityId: stay.reservationId,
        entityCode: stay.reservationCode,
        ...(old
          ? {
              before: {
                baseVnd: old.base_amount_vnd,
                amountEstimatedVnd: old.amount_estimated_vnd,
                amountActualVnd: old.amount_actual_vnd,
              },
            }
          : {}),
        after: {
          channelCode: channel.code,
          baseVnd: base,
          ratePct,
          amountEstimatedVnd: estimated,
          amountActualVnd: actual,
          source: actual === null ? 'estimate' : 'manual_reconcile',
        },
        ...(requestId ? { requestId } : {}),
      });
    }
    const parts = allocate(
      actual ?? estimated,
      stay.nights.map((n) => n.roomRevenueVnd),
    );
    await this.nights.setChannelFees(
      tx,
      stay.nights.map((n, i) => ({ stayNightId: n.stayNightId, amountVnd: parts[i] as number })),
      actual === null,
    );
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
