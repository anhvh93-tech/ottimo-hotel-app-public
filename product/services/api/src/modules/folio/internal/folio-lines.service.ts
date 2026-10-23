/**
 * Folio lines by staff (EP03-05 mục 3.2/3.3; US-032, US-006, US-038 AC2; BR-008, BR-427, BR-506/507/511/512):
 * getChargeCatalog, addFolioLine, adjustFolioLine, damage_pricing approval hook.
 * - Catalogue prices come from parameters (adhoc_cleaning_fee, laundry_price_per_kg, smoking_fee, key_card_fee,
 *   damage_catalog) – never from code; such items are not price-editable by staff (PRICE_NOT_EDITABLE);
 *   F&B / other services are typed in (> 0).
 * - Penalty / damage lines need evidence (≥ 1 image or a note ≥ 3 chars – EVIDENCE_REQUIRED).
 * - Damage outside the table: proposed price → line `pending_approval` + approval `damage_pricing` (MGR+);
 *   the hook posts it (approved) or rejects it.
 * - Adjustment = reversal + new line with the reason (BR-008); settled folio → MGR+ only (A32).
 * Settled folio: new charges only inside post_checkout_window_until (BR-427 c), flagged post_checkout.
 */
import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { CLOCK, type Clock } from '../../../clock';
import type { Tx } from '../../../db/database';
import type { FolioLineCategory } from '../../../db/schema/folio';
import { type FieldError, problem } from '../../../shared/problem';
import { type LocalDate, businessDate, localDate } from '../../../shared/time';
import {
  assertNoCardNumber,
  optionalText,
  requireReason,
  stripControlChars,
} from '../../../shared/validation';
import { actorRoleOf } from '../../audit/public/actor-role';
import { AuditService } from '../../audit/public/audit.service';
import { type ApprovalRow, ApprovalService } from '../../approvals/public/approval.service';
import { EventsService } from '../../events/public/events.service';
import { ATTACHMENT_USAGE, type AttachmentUsage } from '../../payments/public/attachment-usage';
import { ParameterMissingError, ParameterService } from '../../platform/public/parameter.service';
import { publishEvent } from '../../platform/public/staff-notify';
import { applyPct } from '../../reservations/public/pricing';
import { ReservationHooks } from '../../reservations/public/reservation-hooks';
import { StayNightPricingPort } from '../../reservations/public/stay-night-pricing';
import { FolioService } from '../public/folio.service';

export interface ChargeCatalogItem {
  code: string;
  category: FolioLineCategory;
  name: string;
  defaultUnitPriceVnd: number;
  unit: string;
  evidenceRequired: boolean;
  priceEditable: boolean;
  ruleRef?: string;
}

export interface FolioLineCreateInput {
  chargeCode?: string | undefined;
  category?: string | undefined;
  description?: string | undefined;
  quantity: number;
  unitPriceVnd?: number | undefined;
  serviceDate?: string | undefined;
  note?: string | undefined;
  evidenceAttachmentIds?: string[] | undefined;
  proposedUnitPriceVnd?: number | undefined;
}

interface Actor {
  userId: string;
  roles: readonly string[];
  requestId?: string;
}

/** Categories staff may type without a catalogue code (EP03-05 3.2). */
const FREE_CATEGORIES = ['fnb', 'service_fee', 'damage'] as const;
const MANAGERS = ['owner', 'manager'];
const logger = new Logger('FolioLines');

@Injectable()
export class FolioLinesService {
  constructor(
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(FolioService) private readonly folios: FolioService,
    @Inject(ParameterService) private readonly params: ParameterService,
    @Inject(ApprovalService) private readonly approvals: ApprovalService,
    @Inject(ATTACHMENT_USAGE) private readonly attachments: AttachmentUsage,
    // S4-35 part B (BE-B; part A BE-A): the ONE way to change the price of a stay night from the folio (required:
    // a wiring mistake fails at start-up, never as a 404 on a night line).
    @Inject(StayNightPricingPort) private readonly nightPricing: StayNightPricingPort,
    @Inject(ReservationHooks) private readonly hooks: ReservationHooks,
    @Optional() @Inject(EventsService) private readonly events?: EventsService,
  ) {}

  private async today(tx: Tx): Promise<{ today: LocalDate; tz: string; now: Date }> {
    const tz = await this.folios.timezone(tx);
    const now = this.clock.now();
    const rollover = await this.params.get<string>(tx, 'business_day_rollover', localDate(now, tz));
    return { today: businessDate(now, tz, rollover), tz, now };
  }

  private async param<T>(tx: Tx, key: string, day: LocalDate): Promise<T | null> {
    try {
      return await this.params.get<T>(tx, key, day);
    } catch (e) {
      if (e instanceof ParameterMissingError) return null;
      throw e;
    }
  }

  /** getChargeCatalog (US-032): parameter-priced items + typed-in F&B / service lines. */
  async catalog(tx: Tx): Promise<ChargeCatalogItem[]> {
    const { today } = await this.today(tx);
    const out: ChargeCatalogItem[] = [];
    const fixed: Array<[string, FolioLineCategory, string, string, string, boolean, string]> = [
      [
        'adhoc_cleaning_fee',
        'cleaning',
        'Dọn phòng lẻ',
        'adhoc_cleaning_fee',
        'lần',
        false,
        'BR-506',
      ],
      ['laundry', 'laundry', 'Giặt ủi (theo kg)', 'laundry_price_per_kg', 'kg', false, 'BR-507'],
      ['smoking_fee', 'penalty', 'Khử mùi thuốc lá', 'smoking_fee', 'lần', true, 'BR-511'],
      ['key_card_fee', 'penalty', 'Mất/hỏng thẻ phòng', 'key_card_fee', 'thẻ', true, 'BR-511'],
    ];
    for (const [code, category, name, key, unit, evidence, ruleRef] of fixed) {
      const price = await this.param<number>(tx, key, today);
      if (price === null) continue;
      out.push({
        code,
        category,
        name,
        defaultUnitPriceVnd: price,
        unit,
        evidenceRequired: evidence,
        priceEditable: false,
        ruleRef,
      });
    }
    const damage = await this.param<unknown>(tx, 'damage_catalog', today);
    if (Array.isArray(damage)) {
      for (const d of damage as Array<{ code?: unknown; name?: unknown; priceVnd?: unknown }>) {
        if (typeof d.code !== 'string' || typeof d.priceVnd !== 'number') continue;
        out.push({
          code: `damage.${d.code}`,
          category: 'damage',
          name: typeof d.name === 'string' ? d.name : d.code,
          defaultUnitPriceVnd: d.priceVnd,
          unit: 'cái',
          evidenceRequired: true,
          priceEditable: false,
          ruleRef: 'BR-512',
        });
      }
    }
    out.push(
      {
        code: 'fnb',
        category: 'fnb',
        name: 'Đồ ăn uống',
        defaultUnitPriceVnd: 0,
        unit: 'phần',
        evidenceRequired: false,
        priceEditable: true,
      },
      {
        code: 'service_fee',
        category: 'service_fee',
        name: 'Dịch vụ khác',
        defaultUnitPriceVnd: 0,
        unit: 'lần',
        evidenceRequired: false,
        priceEditable: true,
      },
    );
    return out;
  }

  /** addFolioLine (A30). Returns the folio id. */
  async add(
    tx: Tx,
    actor: Actor,
    folioId: string,
    input: FolioLineCreateInput,
    stay: { reservationId: string; code: string; arrivalDate: LocalDate; departureDate: LocalDate },
    /** Status of the booking (reservations stayInfo) – read under the folio lock (K11-06). */
    statusOf?: (reservationId: string) => Promise<string | null>,
  ): Promise<void> {
    // ARC 16.19 lock order: L1 the bookings of the folio KEY SHARE → L3 the folio; the booking's state is read after.
    await tx.query('SELECT id FROM reservation WHERE folio_id = $1 ORDER BY id FOR KEY SHARE', [
      folioId,
    ]);
    await this.folios.lockForPosting(tx, folioId, { allowPostCheckout: true });
    // K11-06 (DOM BR-522 18/10, ARC 16.19 bổ sung): a closed booking (cancelled / no-show) takes no manual line,
    // whatever the role – its refund request is the surplus (system lines and void/adjust stay as they are).
    const status = statusOf ? await statusOf(stay.reservationId) : null;
    if (status === 'cancelled' || status === 'no_show') {
      throw problem('INVALID_TRANSITION', { extras: { currentState: status } });
    }
    const errors: FieldError[] = [];
    const catalog = await this.catalog(tx);
    const item = input.chargeCode ? catalog.find((c) => c.code === input.chargeCode) : undefined;
    if (input.chargeCode && !item) errors.push({ field: 'chargeCode', code: 'NOT_IN_LIST' });
    let category: FolioLineCategory;
    let description: string;
    let unitPrice: number | null = null;
    let pendingApproval = false;
    let evidenceRequired = false;
    if (item) {
      category = item.category;
      description = stripControlChars(input.description ?? '').trim() || item.code;
      evidenceRequired = item.evidenceRequired;
      if (!item.priceEditable) {
        if (input.unitPriceVnd !== undefined) {
          errors.push({ field: 'unitPriceVnd', code: 'PRICE_NOT_EDITABLE' });
        }
        unitPrice = item.defaultUnitPriceVnd;
      } else {
        unitPrice = input.unitPriceVnd ?? item.defaultUnitPriceVnd;
        if (!(unitPrice > 0)) errors.push({ field: 'unitPriceVnd', code: 'AMOUNT_NOT_POSITIVE' });
      }
      if (input.proposedUnitPriceVnd !== undefined) {
        errors.push({ field: 'proposedUnitPriceVnd', code: 'NOT_ALLOWED' });
      }
    } else {
      const cat = input.category;
      if (!cat || !(FREE_CATEGORIES as readonly string[]).includes(cat)) {
        errors.push({ field: input.chargeCode ? 'chargeCode' : 'category', code: 'NOT_IN_LIST' });
      }
      category = (cat ?? 'service_fee') as FolioLineCategory;
      description = stripControlChars(input.description ?? '').trim();
      if (!description) errors.push({ field: 'description', code: 'REQUIRED' });
      else if (description.length < 3) errors.push({ field: 'description', code: 'REQUIRED' });
      else if (description.length > 200) errors.push({ field: 'description', code: 'TOO_LONG' });
      if (category === 'damage') {
        // US-032 AC4 / BR-512: damage outside the table → proposed price, approved by MGR+.
        evidenceRequired = true;
        pendingApproval = true;
        if (input.unitPriceVnd !== undefined) {
          errors.push({ field: 'unitPriceVnd', code: 'NOT_ALLOWED' });
        }
        unitPrice = input.proposedUnitPriceVnd ?? null;
        if (unitPrice === null) {
          errors.push({ field: 'proposedUnitPriceVnd', code: 'REQUIRED' });
        } else if (!(unitPrice > 0)) {
          errors.push({ field: 'proposedUnitPriceVnd', code: 'AMOUNT_NOT_POSITIVE' });
        }
      } else {
        unitPrice = input.unitPriceVnd ?? null;
        if (unitPrice === null) errors.push({ field: 'unitPriceVnd', code: 'REQUIRED' });
        else if (!(unitPrice > 0))
          errors.push({ field: 'unitPriceVnd', code: 'AMOUNT_NOT_POSITIVE' });
        if (input.proposedUnitPriceVnd !== undefined) {
          errors.push({ field: 'proposedUnitPriceVnd', code: 'NOT_ALLOWED' });
        }
      }
    }
    // Quantity: > 0; one decimal only for laundry (kg), integers otherwise.
    const q = input.quantity;
    const decimals = category === 'laundry' ? 10 : 1;
    if (!(q > 0) || !Number.isInteger(Math.round(q * decimals * 1000) / 1000) || q > 1000) {
      errors.push({ field: 'quantity', code: 'VALUE_OUT_OF_RANGE' });
    }
    // SEC-BE-44 (A4/SR-PAY-10): the description is printed on the bill and audited – never a card number.
    assertNoCardNumber('description', description);
    const note = optionalText('note', input.note, 500);
    const evidence = input.evidenceAttachmentIds ?? [];
    if (evidence.length > 20)
      errors.push({ field: 'evidenceAttachmentIds', code: 'VALUE_OUT_OF_RANGE' });
    if (evidenceRequired && evidence.length === 0 && (note ?? '').length < 3) {
      errors.push({ field: 'evidenceAttachmentIds', code: 'EVIDENCE_REQUIRED' });
    }
    const { today } = await this.today(tx);
    const serviceDate = (input.serviceDate ?? today) as LocalDate;
    if (serviceDate < stay.arrivalDate || serviceDate > stay.departureDate) {
      errors.push({ field: 'serviceDate', code: 'DATE_INVALID' });
    }
    if (errors.length) throw problem('VALIDATION_FAILED', { errors });
    for (const id of evidence) {
      await this.attachments.assertUsable(tx, actor, id, 'penalty_evidence', {
        reservationId: stay.reservationId,
        field: 'evidenceAttachmentIds',
      });
    }
    const amount = Math.round(q * (unitPrice as number));
    const [lineId] = await this.folios.postLines(
      tx,
      folioId,
      [
        {
          reservationId: stay.reservationId,
          category,
          description,
          quantity: q,
          unitPriceVnd: unitPrice as number,
          amountVnd: amount,
          serviceDate,
          source: 'manual',
          lineState: pendingApproval ? 'pending_approval' : 'posted',
          chargeCode: item?.code ?? null,
          note,
          evidenceAttachmentIds: evidence.length ? evidence : null,
        },
      ],
      {
        userId: actor.userId,
        reservationCode: stay.code,
        ...(actor.requestId ? { requestId: actor.requestId } : {}),
      },
      { allowPostCheckout: true },
    );
    for (const id of evidence) {
      await this.attachments.bindTo(tx, id, { type: 'folio_line', id: lineId as string });
    }
    if (pendingApproval) {
      const row = await this.approvals.submit(
        tx,
        { userId: actor.userId, roles: actor.roles },
        {
          type: 'damage_pricing',
          amountVnd: amount,
          reasonCode: 'damage_outside_table',
          reasonNote: description,
          targetType: 'reservation',
          targetId: stay.reservationId,
          targetCode: stay.code,
          folioLineId: lineId as string,
          ...(actor.requestId ? { requestId: actor.requestId } : {}),
        },
      );
      await tx.query('UPDATE folio_line SET approval_request_id = $2 WHERE id = $1', [
        lineId,
        row.id,
      ]);
    }
    await this.folios.touch(tx, folioId);
    await publishEvent(tx, this.events, 'reservation.changed', stay.reservationId);
  }

  /** SM-10 hook for `damage_pricing`: approved → line posted; rejected/cancelled → rejected. */
  async onDamageDecided(tx: Tx, request: ApprovalRow): Promise<void> {
    if (!request.folio_line_id) return;
    const next =
      request.status === 'approved'
        ? 'posted'
        : request.status === 'rejected' || request.status === 'cancelled'
          ? 'rejected'
          : null;
    if (!next) return;
    const { rows: changed } = await tx.query<{ folio_id: string }>(
      `UPDATE folio_line SET line_state = $2 WHERE id = $1 AND line_state = 'pending_approval'
       RETURNING folio_id`,
      [request.folio_line_id, next],
    );
    if (!changed[0]) return;
    await this.folios.touch(tx, changed[0].folio_id);
    await this.audit.recordMoney(tx, {
      action: next === 'posted' ? 'folio.damage_posted' : 'folio.damage_rejected',
      entityType: 'folio_line',
      entityId: request.folio_line_id,
      ...(request.target_code ? { entityCode: request.target_code } : {}),
      before: { lineState: 'pending_approval' },
      after: { lineState: next, amountVnd: request.amount_vnd, category: 'damage' },
    });
  }

  /** adjustFolioLine (A31/A32): reversal + new line, reason mandatory (BR-008). */
  async adjust(
    tx: Tx,
    actor: Actor,
    folioId: string,
    lineId: string,
    version: number,
    input: { newQuantity?: number; newUnitPriceVnd?: number; voidLine?: boolean; reason: unknown },
    stayCode: string | null,
    /** Status of the booking of a line (reservations stayInfo) – FB-R2-ARC-BE-S3-14 guard. */
    statusOf?: (reservationId: string) => Promise<string | null>,
  ): Promise<void> {
    const reason = requireReason('reason', input.reason);
    const given = [
      input.newQuantity !== undefined,
      input.newUnitPriceVnd !== undefined,
      !!input.voidLine,
    ];
    if (given.filter(Boolean).length !== 1) {
      throw problem('VALIDATION_FAILED', { errors: [{ field: 'newQuantity', code: 'REQUIRED' }] });
    }
    if (input.newUnitPriceVnd !== undefined && !(input.newUnitPriceVnd > 0)) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'newUnitPriceVnd', code: 'AMOUNT_NOT_POSITIVE' }],
      });
    }
    // S4-35 part B (OpenAPI 0.3.7 D1 adjustFolioLine; ARC D1 #14, BR-429 (g)): a night-derived line (room /
    // extra_person) of a booking still synced (hold/confirmed/in_house) changes the NIGHT first – the stay night's
    // price through StayNightPricingPort.setNightRate (BE-A: it locks the booking, so this runs before the folio
    // lock – order reservation → folio), then the line is reversed and re-posted at the amount the port returns
    // and the reductions of the key are recomputed (BR-434, S4-23). Only the price: newQuantity / voidLine → 422
    // NOT_ALLOWED (a night leaves the stay through B7/B8/B16).
    const { rows: pre } = await tx.query<{
      category: FolioLineCategory;
      reservation_id: string | null;
      service_date: string | null;
      folio_id: string;
    }>(
      `SELECT category, reservation_id, service_date::text AS service_date, folio_id FROM folio_line WHERE id = $1`,
      [lineId],
    );
    const target = pre[0];
    // 16.19 (FB-R2-ARC-BE-S4-16): L1 – every booking of the folio, id order – BEFORE the night branch, so that
    // `setNightRate` only re-locks a booking already held (a child booking's night never locks the child before the
    // primary); L3 below (`lockStay` re-takes L1 without waiting).
    if (target && target.folio_id === folioId) await this.folios.lockStayBookings(tx, folioId);
    let night: { amountVnd: number } | null = null;
    if (
      target &&
      target.folio_id === folioId &&
      (target.category === 'room' || target.category === 'extra_person') &&
      target.reservation_id &&
      statusOf
    ) {
      const status = await statusOf(target.reservation_id);
      if (status === 'hold' || status === 'confirmed' || status === 'in_house') {
        if (input.newUnitPriceVnd === undefined) {
          throw problem('VALIDATION_FAILED', {
            errors: [
              {
                field: input.newQuantity !== undefined ? 'newQuantity' : 'voidLine',
                code: 'NOT_ALLOWED',
              },
            ],
            detail: 'a night line only takes a new price – change the nights through the stay',
          });
        }
        if (!target.service_date) throw problem('NOT_FOUND');
        const r = await this.nightPricing.setNightRate(tx, {
          reservationId: target.reservation_id,
          serviceDate: target.service_date,
          category: target.category,
          unitPriceVnd: input.newUnitPriceVnd,
          userId: actor.userId,
          reason,
          ...(actor.requestId ? { requestId: actor.requestId } : {}),
        });
        night = { amountVnd: r.lineAmountVnd };
      }
    }
    // 16.19: L1 every booking of the folio (`NO KEY UPDATE`, id order) → L3 the folio – the open debt of a settled
    // folio is read under these locks (BR-525 N-7 below).
    const folio = await this.folios.lockStay(tx, folioId);
    if (!folio) throw problem('NOT_FOUND');
    if (folio.version !== version) {
      throw problem('VERSION_CONFLICT', { extras: { currentVersion: folio.version } });
    }
    const managers = actor.roles.some((r) => MANAGERS.includes(r));
    if (folio.status === 'closed') throw problem('FOLIO_LOCKED');
    // N-15 (ARC 16.31.1/16.31.4, BR-427 (d)): past `post_checkout_window_until` the folio is final even before J15
    // (hourly) has closed it – treated as `closed`.
    const windowUntil = folio.post_checkout_window_until ?? null;
    if (
      folio.status === 'settled' &&
      windowUntil !== null &&
      this.clock.now().getTime() >= windowUntil.getTime()
    ) {
      throw problem('FOLIO_LOCKED', { detail: 'post-checkout window over (BR-427 d)' });
    }
    // US-038 AC2 / A32: after checkout only MGR+ posts corrections.
    if (folio.status === 'settled' && !managers) throw problem('FORBIDDEN_ACTION');
    const { rows } = await tx.query<{
      id: string;
      folio_id: string;
      reservation_id: string | null;
      category: FolioLineCategory;
      revenue_group: 'room' | 'other' | 'non_revenue';
      description: string;
      quantity: string;
      unit_price_vnd: number;
      line_state: string;
      reversal_of_id: string | null;
      service_date: string | null;
      stay_night_id: string | null;
      charge_code: string | null;
      label_params: Record<string, string | number> | null;
      reversed: boolean;
    }>(
      `SELECT l.id, l.folio_id, l.reservation_id, l.category, l.revenue_group, l.description, l.quantity,
              l.unit_price_vnd, l.line_state, l.reversal_of_id, l.service_date::text AS service_date,
              l.stay_night_id, l.charge_code, l.label_params,
              EXISTS (SELECT 1 FROM folio_line r WHERE r.reversal_of_id = l.id) AS reversed
         FROM folio_line l WHERE l.id = $1`,
      [lineId],
    );
    const line = rows[0];
    if (!line || line.folio_id !== folio.id) throw problem('NOT_FOUND');
    if (
      line.line_state !== 'posted' ||
      line.reversed ||
      line.reversal_of_id ||
      ['foc', 'discount', 'adjustment'].includes(line.category)
    ) {
      throw problem('INVALID_TRANSITION', { extras: { currentState: line.line_state } });
    }
    const qty = input.newQuantity ?? Number(line.quantity);
    const price = input.newUnitPriceVnd ?? line.unit_price_vnd;
    // BR-525 N-7 by the number (ARC 16.31.1 – BUG-R2-208, DOM 18/10; SEC s1 D): on a settled folio inside its window
    // a correction that REDUCES a line (void, lower price, lower quantity; reduction = line before − after) is allowed
    // only up to W = max(0, còn phải thu) − `openDebtVnd` (the charges still in their window); above → 409, every
    // role, nothing written – the debt part only goes down through a FOC `debt_write_off` (BR-433) or a receipt.
    // `openDebtVnd` = 0 → as a stay without debt. An increase keeps A32. Read under L1 → L3 held above.
    let debtCheck: { openDebtVnd: number; windowVnd: number; reducedVnd: number } | null = null;
    if (folio.status === 'settled') {
      const before = Math.round(Number(line.quantity) * line.unit_price_vnd);
      const after = input.voidLine ? 0 : night ? night.amountVnd : Math.round(qty * price);
      if (after < before) {
        const debt = await this.hooks.openDebt(tx, folio.id);
        if (debt) {
          const openDebtVnd = debt.openDebtVnd;
          const windowVnd = Math.max(0, debt.balanceDueVnd) - openDebtVnd;
          // FB-R3-SEC-BE-B-01 (b): a debt written before 0076 (no cycle yet) keeps R2 N-7 – no reduction at all; the
          // right to reduce never rests on the number derived back from the lines.
          if (!debt.cycleOpened || before - after > windowVnd) {
            throw problem('FOLIO_LOCKED', {
              detail:
                'reduction above the charges still in their window – the debt goes down through a FOC debt_write_off (BR-525)',
            });
          }
          debtCheck = { openDebtVnd, windowVnd, reducedVnd: before - after };
        }
      }
    }
    if (input.newUnitPriceVnd !== undefined && !managers && !night) {
      if (line.category === 'room') {
        // A31: FD/FDL change a night price only inside BR-105 floor–ceiling (of the line's price).
        const { today } = await this.today(tx);
        const floor = await this.params.get<number>(tx, 'rate_floor_pct', today);
        const ceiling = await this.params.get<number>(tx, 'rate_ceiling_pct', today);
        const unit = await this.params.get<number>(tx, 'rounding.night_rate', today);
        const lo = applyPct(line.unit_price_vnd, floor, unit);
        const hi = applyPct(line.unit_price_vnd, ceiling, unit);
        if (price < lo || price > hi) {
          throw problem('VALIDATION_FAILED', {
            errors: [{ field: 'newUnitPriceVnd', code: 'RATE_OUT_OF_RANGE' }],
            extras: { min: lo, max: hi },
          });
        }
      } else if (
        line.charge_code &&
        line.charge_code !== 'fnb' &&
        line.charge_code !== 'service_fee' &&
        // mô hình minibar M-1: charge_code of a minibar line is the item code (FOC key), not a fixed-price service
        line.category !== 'minibar'
      ) {
        throw problem('VALIDATION_FAILED', {
          errors: [{ field: 'newUnitPriceVnd', code: 'PRICE_NOT_EDITABLE' }],
        });
      }
    }
    if (input.newQuantity !== undefined && (qty < 0 || qty > 1000)) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'newQuantity', code: 'VALUE_OUT_OF_RANGE' }],
      });
    }
    const actorInfo = {
      userId: actor.userId,
      ...(stayCode ? { reservationCode: stayCode } : {}),
      ...(actor.requestId ? { requestId: actor.requestId } : {}),
    };
    // The replacement is posted first, then the reductions of its key are recomputed once (BR-434).
    await this.folios.reverseLine(tx, line.id, reason, actorInfo, {
      allowSettled: true,
      skipReductionSync: true,
    });
    const newAmount = night ? night.amountVnd : Math.round(qty * price);
    if (!input.voidLine && qty > 0) {
      await this.folios.insertLine(tx, {
        folioId: folio.id,
        reservationId: line.reservation_id,
        category: line.category,
        revenueGroup: line.revenue_group,
        description: line.description,
        quantity: night ? 1 : qty,
        unitPriceVnd: night ? night.amountVnd : price,
        amountVnd: newAmount,
        serviceDate: line.service_date,
        stayNightId: line.stay_night_id,
        source: 'manual',
        postedBy: actor.userId,
        now: this.clock.now(),
        relatedLineId: line.id,
        chargeCode: line.charge_code,
        labelParams: line.label_params,
        reason,
        postCheckout: folio.status === 'settled',
      });
      // x-ota-prepaid-rule (re-verification 17/10): the replacement of an OTA-covered line moves the receipt.
      await this.folios.resyncOtaCollect(tx, folio.id, line.reservation_id, actorInfo);
      if (!debtCheck) {
        await this.audit.recordMoney(tx, {
          action: 'folio_line.adjusted',
          entityType: 'folio_line',
          entityId: line.id,
          ...(stayCode ? { entityCode: stayCode } : {}),
          before: {
            category: line.category,
            amountVnd: Math.round(Number(line.quantity) * line.unit_price_vnd),
          },
          after: { category: line.category, amountVnd: newAmount },
          reason,
          ...(actor.requestId ? { requestId: actor.requestId } : {}),
        });
      }
    }
    await this.folios.syncReductions(tx, folio.id, {
      userId: actor.userId,
      ...(actor.requestId ? { requestId: actor.requestId } : {}),
    });
    if (debtCheck) {
      // FB-R3-SEC-BE-B-03 (SEC s1 D.4): a reduction allowed while the stay owes a debt is audited with the role at the
      // time and the open debt MEASURED after the write (same transaction, same locks). BR-525 (ii) checked at run
      // time: the open debt never drops through A32 – otherwise everything is rolled back.
      const openAfterVnd = (await this.hooks.openDebt(tx, folio.id))?.openDebtVnd ?? 0;
      if (openAfterVnd < debtCheck.openDebtVnd) {
        logger.error(
          `BR-525 (ii): open debt dropped through A32 on folio ${folio.id} – rolled back`,
        );
        throw new Error('BR-525 (ii) invariant: open debt dropped through A32');
      }
      await this.audit.recordMoney(tx, {
        action: 'folio_line.adjusted',
        entityType: 'folio_line',
        entityId: line.id,
        ...(stayCode ? { entityCode: stayCode } : {}),
        before: {
          category: line.category,
          amountVnd: Math.round(Number(line.quantity) * line.unit_price_vnd),
          openDebtVnd: debtCheck.openDebtVnd,
          windowVnd: debtCheck.windowVnd,
          actorRole: actorRoleOf(actor.userId, actor.roles),
        },
        after: {
          category: line.category,
          amountVnd: input.voidLine || qty <= 0 ? 0 : newAmount,
          reducedVnd: debtCheck.reducedVnd,
          openDebtVnd: openAfterVnd,
        },
        reason,
        ...(actor.requestId ? { requestId: actor.requestId } : {}),
      });
    }
    await this.folios.touch(tx, folio.id);
    if (line.reservation_id)
      await publishEvent(tx, this.events, 'reservation.changed', line.reservation_id);
  }
}
