/**
 * FB-INV-012 monthly statements of a long stay (contract 2.2–2.4, 5; DOM BR-LS-01…16; INV 17/11).
 *
 * A draft is computed on every read (= preview); issuing freezes it in one transaction – lock order: booking
 * `FOR KEY SHARE` → folio `FOR UPDATE` → statement `FOR UPDATE` – posts the folio lines the statement owns (rent,
 * electricity, water, rounding, prior adjustment – contract 2.4), snapshots `billing_period_line` and assigns the code.
 * Service lines already on the folio are referenced, never posted again. A statement never settles the folio.
 *
 * INV 17/11: partial first month collected at check-in (`partialFirstMonthRent=at_checkin` → the statement of the
 * arrival month carries the partial rent), no 200.000 service fee line, VAT 8 % electricity / 5 % water on unit prices
 * before VAT (4.000 đ/kWh, 25.000 đ/m³). Opening readings are typed each period (meter-readings.service.ts).
 */
import { Inject, Injectable, Optional } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import type { Tx } from '../../../db/database';
import { assertVersion } from '../../../shared/http/precondition';
import { decodeCursor, page, parseLimit } from '../../../shared/http/pagination';
import { problem } from '../../../shared/problem';
import { type LocalDate, addDays } from '../../../shared/time';
import { AuditService } from '../../audit/public/audit.service';
import {
  type FolioLineInput,
  FolioService,
  type RevenueGroup,
  SERVICE_CATEGORIES,
} from '../../folio/public/folio.service';
import { lineLabel } from '../../folio/public/line-labels';
import {
  ELECTRICITY_CHARGE_CODE,
  MONTHLY_RENT_CHARGE_CODE,
  STATEMENT_CHARGE_CODES,
  STATEMENT_PRIOR_ADJUSTMENT_CHARGE_CODE,
  STATEMENT_ROUNDING_CHARGE_CODE,
  WATER_CHARGE_CODE,
} from '../../folio/public/statement-codes';
import { EventsService } from '../../events/public/events.service';
import {
  OUTSIDE_DESK_METHOD,
  OUTSIDE_DESK_SOURCE,
  PaymentService,
} from '../../payments/public/payment.service';
import { assertNoCardNumber, assertNotCardNumberReference } from '../../../shared/validation';
import { atLocal, toZonedIso } from '../../../shared/time';
import { divideRoundVnd } from '../../platform/public/money';
import { ParameterMissingError, ParameterService } from '../../platform/public/parameter.service';
import { type PropertyNow, PropertyContextService } from '../../platform/public/property-context';
import { bankNameOf, receivingAccountInEffect } from '../../platform/public/receiving-account';
import { buildVietQrPayload, normalizeTransferContent } from '@ottimo/integrations/payment';
import {
  type Meter,
  type MeterException,
  type Period,
  STATEMENT_RULES_KEY,
  type StatementRules,
  UTILITY_UNIT_PRICE_KEY,
  UTILITY_VAT_RATE_KEY,
  addMonths,
  clip,
  contractRentVnd,
  fromScaled,
  last4Masked,
  monthEnd,
  monthOf,
  monthPeriod,
  overdueOf,
  parseMonth,
  readRules,
  readUnitPrice,
  readVatRate,
  rentFor,
  roundDownTotal,
  shortGuestName,
  statementCode,
  statementPeriods,
  usageScaled,
  utilityAmounts,
} from './statement-math';
import {
  type ReadingRow,
  MeterReadingsService,
  exceptionOf,
  initialsOf,
  scaledOf,
} from './meter-readings.service';
import {
  type BillingActor,
  type LongStay,
  UUID,
  freeText,
  isFdlPlus,
  isLocalDate,
  isUniqueViolation,
  loadLongStay,
  obj,
} from './stay';

type LineKind = 'rent' | 'electricity' | 'water' | 'service' | 'rounding' | 'prior_adjustment';
type Unit = 'month' | 'day' | 'kwh' | 'm3' | 'item';
type Status = 'draft' | 'issued' | 'partially_paid' | 'paid' | 'void';

export interface StatementLine {
  kind: LineKind;
  labelKey: string;
  labelParams: Record<string, string | number> | null;
  quantity: number;
  unit: Unit;
  unitPriceNetVnd: number;
  vatRatePct: number | null;
  netVnd: number;
  vatVnd: number;
  amountVnd: number;
  /** Existing folio line (service, rent already posted); null = posted at issue. */
  folioLineId: string | null;
  roomId: string | null;
  roomNo: string | null;
  meter: { from: number; to: number; exception: MeterException | null } | null;
  meterFromReadingId: string | null;
  meterToReadingId: string | null;
  serviceDate: LocalDate | null;
  /** Folio posting of a line owned by the statement. */
  posting: {
    category: 'room' | 'utilities' | 'adjustment';
    chargeCode: string;
    unitPriceVnd: number;
    adjustsGroup?: RevenueGroup;
    periodFrom?: LocalDate;
    periodTo?: LocalDate;
    reason?: string;
  } | null;
  sortOrder: number;
}

export interface Warning {
  code: string;
  [k: string]: unknown;
}

export interface MissingReading {
  roomId: string;
  roomNo: string;
  kind: 'opening' | 'period_end' | 'room_change_out';
  periodMonth: string;
}

interface Computed {
  rent: Period | null;
  utility: Period;
  service: Period;
  dueDate: LocalDate;
  lines: StatementLine[];
  /** ARC BE-190-04: service lines moved off this draft (BR-LS-14) – shown, never totalled. */
  excludedLines: StatementLine[];
  warnings: Warning[];
  missing: MissingReading[];
  netVnd: number;
  vatVnd: number;
  roundingVnd: number;
  totalVnd: number;
  rates: Record<string, unknown>;
}

interface BpRow {
  id: string;
  folio_id: string;
  reservation_id: string;
  code: string | null;
  statement_month: string;
  kind: 'regular' | 'final';
  rent_period_from: string | null;
  rent_period_to: string | null;
  utility_period_from: string | null;
  utility_period_to: string | null;
  service_period_from: string | null;
  service_period_to: string | null;
  due_date: string | null;
  status: Status;
  excluded_folio_line_ids: string[];
  prior_adjustment_vnd: string | null;
  prior_adjustment_reason: string | null;
  note: string | null;
  replaces_id: string | null;
  rates_snapshot: Record<string, unknown> | null;
  net_vnd: string | null;
  vat_vnd: string | null;
  rounding_vnd: string | null;
  total_vnd: string | null;
  paid_vnd: string;
  issued_at: Date | null;
  issued_by: string | null;
  paid_at: Date | null;
  voided_at: Date | null;
  void_reason: string | null;
  version: number;
}

const BP_COLUMNS = `b.id, b.folio_id, b.reservation_id, b.code, b.statement_month::text, b.kind,
  b.rent_period_from::text, b.rent_period_to::text, b.utility_period_from::text, b.utility_period_to::text,
  b.service_period_from::text, b.service_period_to::text, b.due_date::text, b.status, b.excluded_folio_line_ids,
  b.prior_adjustment_vnd::text, b.prior_adjustment_reason, b.note, b.replaces_id, b.rates_snapshot, b.net_vnd::text,
  b.vat_vnd::text, b.rounding_vnd::text, b.total_vnd::text, b.paid_vnd::text, b.issued_at, b.issued_by, b.paid_at,
  b.voided_at, b.void_reason, b.version`;

/** §12.2 `reference`: ≤ 64 of `[A-Za-z0-9 ./-]` (filtered like `bankReference`). */
const OUTSIDE_DESK_REFERENCE = /^[A-Za-z0-9 ./-]{1,64}$/;
/** auditReason of the manager's refusal outside the go-live scope (SEC FB-R5-SEC-ARC-12-02). */
export const OUTSIDE_DESK_OWNER_ONLY = 'OUTSIDE_DESK_OWNER_ONLY';

const LIVE_ISSUED: readonly Status[] = ['issued', 'partially_paid', 'paid'];
const n = (v: string | null): number => (v === null ? 0 : Number(v));
const monthLabel = (m: LocalDate): string => m.slice(0, 7);
const SORT = {
  rent: 10,
  electricity: 20,
  water: 30,
  service: 40,
  prior_adjustment: 50,
  rounding: 60,
} as const;

@Injectable()
export class StatementsService {
  constructor(
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(FolioService) private readonly folios: FolioService,
    @Inject(PaymentService) private readonly payments: PaymentService,
    @Inject(ParameterService) private readonly params: ParameterService,
    @Inject(PropertyContextService) private readonly property: PropertyContextService,
    @Inject(MeterReadingsService) private readonly meters: MeterReadingsService,
    @Optional() @Inject(EventsService) private readonly events?: EventsService,
  ) {}

  // ───────────────────────── parameters ─────────────────────────

  private async param<T>(tx: Tx, key: string, asOf: LocalDate, fallback: T): Promise<T> {
    try {
      const v = await this.params.get<T>(tx, key, asOf);
      return v === null || v === undefined ? fallback : v;
    } catch (err) {
      if (err instanceof ParameterMissingError) return fallback;
      throw err;
    }
  }

  private async intParam(tx: Tx, key: string, asOf: LocalDate, fallback: number): Promise<number> {
    const v = await this.param<unknown>(tx, key, asOf, fallback);
    return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : fallback;
  }

  private async rules(tx: Tx, today: LocalDate): Promise<StatementRules> {
    return readRules(await this.param<unknown>(tx, STATEMENT_RULES_KEY, today, null));
  }

  // ───────────────────────── allowed months / kinds ─────────────────────────

  /**
   * Months a statement may be made for, and its kind (BR-LS-01/03/04). `advance`: from the arrival month (partial rent
   * collected at check-in – INV 17/11) or the next one (`first_statement`) to the month of the last night; that month
   * is `final` when the stay ends inside it. `arrears`: from the month after the arrival to the month of the last night
   * (+1 when the stay ends on a month end).
   */
  expectedKind(
    stay: LongStay,
    month: LocalDate,
    rules: StatementRules,
  ): 'regular' | 'final' | null {
    const first = monthOf(stay.arrival);
    const last = monthOf(stay.lastNight);
    const endsOnMonthEnd = stay.lastNight === monthEnd(stay.lastNight);
    if (rules.rentTiming === 'advance') {
      const start =
        rules.partialFirstMonthRent === 'at_checkin' || stay.arrival === first
          ? first
          : addMonths(first, 1);
      if (month < start || month > last) return null;
      return month === last && !endsOnMonthEnd ? 'final' : 'regular';
    }
    const end = endsOnMonthEnd ? addMonths(last, 1) : last;
    if (month <= first || month > end) return null;
    return 'regular';
  }

  // ───────────────────────── computation ─────────────────────────

  async compute(
    tx: Tx,
    stay: LongStay,
    bp: {
      id: string | null;
      month: LocalDate;
      kind: 'regular' | 'final';
      excluded: readonly string[];
      priorAdjustmentVnd: number | null;
      priorAdjustmentReason: string | null;
    },
    pc: PropertyNow,
  ): Promise<Computed> {
    const today = pc.today;
    const rules = await this.rules(tx, today);
    const periods = statementPeriods(bp.month, rules, stay.arrival);
    const lines: StatementLine[] = [];
    const excludedLines: StatementLine[] = [];
    const warnings: Warning[] = [];
    const missing: MissingReading[] = [];
    const divisor = await this.intParam(tx, 'long_stay_daily_divisor', today, 30);
    const nightUnit = await this.intParam(tx, 'rounding.night_rate', today, 1000);
    const daily = divideRoundVnd(stay.monthlyRentVnd, divisor, nightUnit);
    const roomOf = (date: LocalDate): { roomId: string; roomNo: string } | null => {
      const s =
        stay.segments.find((x) => x.from <= date && date < x.to) ??
        stay.segments[stay.segments.length - 1];
      return s ? { roomId: s.roomId, roomNo: s.roomNo } : null;
    };

    // Rent (BR-LS-01/03/04/06).
    let rentPeriod: Period | null = null;
    const already = await this.postedRent(tx, stay, bp.id);
    const rentLine = (
      period: Period,
      quantity: number,
      unit: Unit,
      unitPrice: number,
      amount: number,
    ): StatementLine => ({
      kind: 'rent',
      labelKey: 'bill.line.monthly_rent',
      labelParams: { from: period.from, to: period.to },
      quantity,
      unit,
      unitPriceNetVnd: unitPrice,
      vatRatePct: null,
      netVnd: amount,
      vatVnd: 0,
      amountVnd: amount,
      folioLineId: null,
      roomId: null,
      roomNo: null,
      meter: null,
      meterFromReadingId: null,
      meterToReadingId: null,
      serviceDate: null,
      posting: {
        category: 'room',
        chargeCode: MONTHLY_RENT_CHARGE_CODE,
        unitPriceVnd: unitPrice,
        periodFrom: period.from,
        periodTo: period.to,
      },
      sortOrder: SORT.rent + lines.length,
    });
    const rentPeriods: Period[] = [];
    if (bp.kind === 'final') {
      const from = monthOf(stay.lastNight) < stay.arrival ? stay.arrival : monthOf(stay.lastNight);
      rentPeriods.push({ from, to: stay.lastNight });
    } else if (rules.rentTiming === 'advance') {
      const first = monthOf(stay.arrival);
      if (
        rules.partialFirstMonthRent === 'first_statement' &&
        stay.arrival !== first &&
        bp.month === addMonths(first, 1)
      ) {
        rentPeriods.push(monthPeriod(first));
      }
      rentPeriods.push(periods.rent);
    } else {
      rentPeriods.push(periods.rent);
    }
    for (const p of rentPeriods) {
      const c = clip(p, stay.arrival, stay.lastNight);
      if (!c) continue;
      rentPeriod = rentPeriod ? { from: rentPeriod.from, to: c.to } : c;
      const posted = already.filter((l) => l.period_from <= c.to && l.period_to >= c.from);
      if (posted.length > 0) {
        // Contract 2.4 (b): rent of this period already on the folio → referenced, not posted again.
        for (const l of posted) {
          const line = rentLine(c, Number(l.quantity), 'month', l.unit_price_vnd, l.amount_vnd);
          lines.push({ ...line, folioLineId: l.id, posting: null });
        }
        warnings.push({ code: 'RENT_ALREADY_POSTED', from: c.from, to: c.to });
        continue;
      }
      if (bp.kind === 'final') {
        // BR-LS-04: rent × contract months − rent of every earlier statement (rounding differences absorbed).
        const contract = contractRentVnd(stay.arrival, stay.departure, stay.monthlyRentVnd, daily);
        const prior = await this.priorRentVnd(tx, stay.id, bp.id);
        const amount = contract - prior;
        if (amount > 0) lines.push(rentLine(c, 1, 'month', amount, amount));
        continue;
      }
      const r = rentFor(c, stay, stay.monthlyRentVnd, daily);
      if (r) lines.push(rentLine(r.period, r.quantity, r.unit, r.unitPriceVnd, r.amountVnd));
    }

    // Utilities (BR-LS-07/08/10/11/12; INV 17/11: usage = closing − typed opening of the same period).
    const unitDate = periods.utility.to;
    const unitPrice = readUnitPrice(
      await this.param<unknown>(tx, UTILITY_UNIT_PRICE_KEY, unitDate, null),
    );
    const vat = readVatRate(await this.param<unknown>(tx, UTILITY_VAT_RATE_KEY, today, null));
    const u = clip(periods.utility, stay.arrival, stay.lastNight);
    if (u) {
      const readings = (await this.meters.readings(tx, stay.id)).filter(
        (r) => r.voided_at === null,
      );
      const pMonth = monthOf(u.from);
      const factor = await this.intParam(tx, 'meter_anomaly_factor', today, 2);
      const defaults = {
        electricity: await this.intParam(tx, 'meter_anomaly_default_kwh', today, 300),
        water: await this.intParam(tx, 'meter_anomaly_default_m3', today, 10),
      };
      const history = await this.usageHistory(tx, stay.id, bp.month);
      const rooms = stay.segments.filter((s) => s.from <= u.to && s.to > u.from);
      const seen = new Set<string>();
      for (const seg of rooms) {
        if (seen.has(seg.roomId)) continue;
        seen.add(seg.roomId);
        const roomSegs = rooms.filter((s) => s.roomId === seg.roomId);
        const closings = readings.filter(
          (r) =>
            r.room_id === seg.roomId &&
            ((r.kind === 'period_end' && r.period_month === pMonth) ||
              (r.kind === 'room_change_out' && r.read_on >= u.from && r.read_on <= u.to)),
        );
        const holdsAtEnd = roomSegs.some((s) => s.from <= u.to && u.to < s.to);
        if (holdsAtEnd && !closings.some((r) => r.kind === 'period_end')) {
          missing.push({
            roomId: seg.roomId,
            roomNo: seg.roomNo,
            kind: 'period_end',
            periodMonth: monthLabel(pMonth),
          });
        }
        for (const s of roomSegs) {
          const leaves = addDays(s.to, -1) >= u.from && s.to <= u.to;
          if (leaves && !closings.some((r) => r.kind === 'room_change_out' && r.read_on === s.to)) {
            missing.push({
              roomId: seg.roomId,
              roomNo: seg.roomNo,
              kind: 'room_change_out',
              periodMonth: monthLabel(pMonth),
            });
          }
        }
        for (const close of closings) {
          const open = await this.meters.openingFor(tx, {
            reservationId: stay.id,
            roomId: close.room_id,
            kind: close.kind,
            periodMonth: close.period_month,
            readOn: close.read_on,
          });
          if (!open) {
            missing.push({
              roomId: seg.roomId,
              roomNo: seg.roomNo,
              kind: 'opening',
              periodMonth: monthLabel(pMonth),
            });
            continue;
          }
          for (const r of [open, close]) {
            if (r.photo_waived_by)
              warnings.push({ code: 'PHOTO_WAIVED', roomNo: seg.roomNo, readingId: r.id });
            // ARC BE-190-03: typed after its window by FDL+ – confirmed again at issue.
            if (r.late_reason)
              warnings.push({
                code: 'READING_LATE',
                roomNo: seg.roomNo,
                readingId: r.id,
                kind: r.kind,
              });
          }
          // ARC BE-190-01: an opening saved below the previous closing makes the billed usage larger – a typo is
          // caught here, before it becomes money.
          for (const meter of ['electricity', 'water'] as const) {
            const g = meter === 'electricity' ? open.electricity_gap : open.water_gap;
            if (g === null || Number(g) >= 0 || exceptionOf(meter, open)) continue;
            const openingScaled = scaledOf(meter, open);
            const gapScaled =
              meter === 'electricity' ? Math.round(Number(g)) : Math.round(Number(g) * 10);
            warnings.push({
              code: 'OPENING_BELOW_PREVIOUS_CLOSING',
              roomNo: seg.roomNo,
              meter,
              opening: fromScaled(meter, openingScaled),
              previousClosing: fromScaled(meter, openingScaled - gapScaled),
              readingId: open.id,
            });
          }
          for (const meter of ['electricity', 'water'] as const) {
            const usage = usageScaled(
              meter,
              scaledOf(meter, open),
              scaledOf(meter, close),
              exceptionOf(meter, close),
            );
            if (usage <= 0) continue;
            const a = utilityAmounts(
              meter,
              usage,
              meter === 'electricity' ? unitPrice.electricityVndPerKwh : unitPrice.waterVndPerM3,
              vat[meter],
            );
            const consumption = fromScaled(meter, usage);
            const past = history[meter];
            const threshold =
              past.length > 0
                ? (factor * past.reduce((x, y) => x + y, 0)) / past.length
                : defaults[meter];
            if (consumption > threshold) {
              warnings.push({
                code: 'METER_ANOMALY',
                roomNo: seg.roomNo,
                meter,
                consumption,
                threshold: Math.round(threshold * 10) / 10,
              });
            }
            lines.push(
              this.utilityLine(meter, a, vat[meter], open, close, seg.roomNo, u, lines.length),
            );
          }
        }
      }
    }

    // Services of the service period, net of FOC / discounts, not moved, not on another live statement (BR-LS-14).
    const services = await this.serviceLines(tx, stay, periods.service, bp.id);
    for (const s of services) {
      if (s.onOtherStatement) {
        if (!bp.excluded.includes(s.id)) {
          warnings.push({
            code: 'SERVICE_LINE_ON_OTHER_STATEMENT',
            folioLineId: s.id,
            statementCode: s.onOtherStatement,
          });
        }
        continue;
      }
      const label = lineLabel({
        category: s.category,
        charge_code: s.charge_code,
        description: s.description,
        service_date: s.service_date,
        quantity: s.quantity,
        label_params: s.label_params,
      });
      (bp.excluded.includes(s.id) ? excludedLines : lines).push({
        kind: 'service',
        labelKey: label.labelKey,
        labelParams: label.labelParams ?? null,
        quantity: Number(s.quantity),
        unit: 'item',
        unitPriceNetVnd: s.unit_price_vnd,
        vatRatePct: null,
        netVnd: s.net,
        vatVnd: 0,
        amountVnd: s.net,
        folioLineId: s.id,
        roomId: null,
        roomNo: s.service_date ? (roomOf(s.service_date)?.roomNo ?? null) : null,
        meter: null,
        meterFromReadingId: null,
        meterToReadingId: null,
        serviceDate: s.service_date,
        posting: null,
        sortOrder: SORT.service + lines.length,
      });
    }

    // Prior-period adjustment (BR-LS-16, FDL+).
    if (bp.priorAdjustmentVnd !== null && bp.priorAdjustmentVnd !== 0) {
      lines.push({
        kind: 'prior_adjustment',
        labelKey: 'bill.line.statement_prior_adjustment',
        labelParams: null,
        quantity: 1,
        unit: 'item',
        unitPriceNetVnd: bp.priorAdjustmentVnd,
        vatRatePct: null,
        netVnd: bp.priorAdjustmentVnd,
        vatVnd: 0,
        amountVnd: bp.priorAdjustmentVnd,
        folioLineId: null,
        roomId: null,
        roomNo: null,
        meter: null,
        meterFromReadingId: null,
        meterToReadingId: null,
        serviceDate: null,
        posting: {
          category: 'adjustment',
          chargeCode: STATEMENT_PRIOR_ADJUSTMENT_CHARGE_CODE,
          unitPriceVnd: bp.priorAdjustmentVnd,
          adjustsGroup: 'other',
          reason: bp.priorAdjustmentReason ?? undefined,
        },
        sortOrder: SORT.prior_adjustment,
      });
    }

    // Totals: VAT per line, total rounded DOWN (BR-LS-09) – the remainder is a negative "Làm tròn" line.
    const netVnd = lines.reduce((s, l) => s + l.netVnd, 0);
    const vatVnd = lines.reduce((s, l) => s + l.vatVnd, 0);
    const { totalVnd, roundingVnd } = roundDownTotal(netVnd + vatVnd, rules.totalRoundingVnd);
    if (roundingVnd !== 0) {
      lines.push({
        kind: 'rounding',
        labelKey: 'bill.line.statement_rounding',
        labelParams: null,
        quantity: 1,
        unit: 'item',
        unitPriceNetVnd: roundingVnd,
        vatRatePct: null,
        netVnd: roundingVnd,
        vatVnd: 0,
        amountVnd: roundingVnd,
        folioLineId: null,
        roomId: null,
        roomNo: null,
        meter: null,
        meterFromReadingId: null,
        meterToReadingId: null,
        serviceDate: null,
        posting: {
          category: 'adjustment',
          chargeCode: STATEMENT_ROUNDING_CHARGE_CODE,
          unitPriceVnd: roundingVnd,
          adjustsGroup: 'other',
        },
        sortOrder: SORT.rounding,
      });
    }
    lines.sort((a, b) => a.sortOrder - b.sortOrder);
    return {
      rent: rentPeriod,
      utility: periods.utility,
      service: periods.service,
      dueDate: periods.dueDate,
      lines,
      excludedLines,
      warnings,
      missing,
      netVnd,
      vatVnd,
      roundingVnd,
      totalVnd,
      rates: {
        utilityUnitPrice: { ...unitPrice, asOf: unitDate },
        utilityVatRate: { ...vat, asOf: today },
        rules,
        dailyRentVnd: daily,
        dailyDivisor: divisor,
        monthlyRentVnd: stay.monthlyRentVnd,
      },
    };
  }

  private utilityLine(
    meter: Meter,
    a: ReturnType<typeof utilityAmounts>,
    vatPct: number,
    open: ReadingRow,
    close: ReadingRow,
    roomNo: string,
    u: Period,
    idx: number,
  ): StatementLine {
    const from = open.read_on > u.from ? open.read_on : u.from;
    return {
      kind: meter,
      labelKey: meter === 'electricity' ? 'bill.line.electricity' : 'bill.line.water',
      labelParams: { from, to: close.read_on < u.to ? close.read_on : u.to, room: roomNo },
      quantity: a.quantity,
      unit: meter === 'electricity' ? 'kwh' : 'm3',
      unitPriceNetVnd: a.unitPriceNetVnd,
      vatRatePct: vatPct,
      netVnd: a.netVnd,
      vatVnd: a.vatVnd,
      amountVnd: a.amountVnd,
      folioLineId: null,
      roomId: close.room_id,
      roomNo,
      meter: {
        from: fromScaled(meter, scaledOf(meter, open)),
        to: fromScaled(meter, scaledOf(meter, close)),
        exception: exceptionOf(meter, close),
      },
      meterFromReadingId: open.id,
      meterToReadingId: close.id,
      serviceDate: null,
      posting: {
        category: 'utilities',
        chargeCode: meter === 'electricity' ? ELECTRICITY_CHARGE_CODE : WATER_CHARGE_CODE,
        unitPriceVnd: a.unitPriceGrossVnd,
      },
      sortOrder: (meter === 'electricity' ? SORT.electricity : SORT.water) + idx,
    };
  }

  /** Live `monthly_rent` lines of the folio of this booking not on a live statement other than `exceptId`. */
  private async postedRent(
    tx: Tx,
    stay: LongStay,
    exceptId: string | null,
  ): Promise<
    Array<{
      id: string;
      quantity: string;
      unit_price_vnd: number;
      amount_vnd: number;
      period_from: string;
      period_to: string;
    }>
  > {
    const { rows } = await tx.query<{
      id: string;
      quantity: string;
      unit_price_vnd: string;
      amount_vnd: string;
      period_from: string;
      period_to: string;
    }>(
      `SELECT l.id, l.quantity::text, l.unit_price_vnd::text, l.amount_vnd::text, l.period_from::text,
              l.period_to::text
         FROM folio_line l
        WHERE l.folio_id = $1 AND (l.reservation_id IS NULL OR l.reservation_id = $2)
          AND l.category = 'room' AND l.charge_code = $3 AND l.line_state = 'posted' AND l.reversal_of_id IS NULL
          AND l.period_from IS NOT NULL AND l.period_to IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM folio_line r WHERE r.reversal_of_id = l.id)
          AND NOT EXISTS (SELECT 1 FROM billing_period_line bl JOIN billing_period b ON b.id = bl.billing_period_id
                           WHERE bl.folio_line_id = l.id AND bl.active AND b.status <> 'void'
                             AND ($4::uuid IS NULL OR b.id <> $4))`,
      [stay.folioId, stay.id, MONTHLY_RENT_CHARGE_CODE, exceptId],
    );
    return rows.map((r) => ({
      ...r,
      unit_price_vnd: Number(r.unit_price_vnd),
      amount_vnd: Number(r.amount_vnd),
    }));
  }

  private async priorRentVnd(
    tx: Tx,
    reservationId: string,
    exceptId: string | null,
  ): Promise<number> {
    const { rows } = await tx.query<{ s: string | null }>(
      `SELECT sum(l.amount_vnd)::text AS s FROM billing_period_line l JOIN billing_period b ON b.id = l.billing_period_id
        WHERE b.reservation_id = $1 AND b.status IN ('issued', 'partially_paid', 'paid') AND l.active
          AND l.kind = 'rent' AND ($2::uuid IS NULL OR b.id <> $2)`,
      [reservationId, exceptId],
    );
    return n(rows[0]?.s ?? null);
  }

  /** Usage of the last 3 issued statements before `month` (BR-LS-12 average). */
  private async usageHistory(
    tx: Tx,
    reservationId: string,
    month: LocalDate,
  ): Promise<Record<Meter, number[]>> {
    const { rows } = await tx.query<{ kind: Meter; q: string }>(
      `SELECT x.kind, x.q FROM (
         SELECT l.kind, sum(l.quantity)::text AS q, b.statement_month,
                row_number() OVER (PARTITION BY l.kind ORDER BY b.statement_month DESC) AS rn
           FROM billing_period_line l JOIN billing_period b ON b.id = l.billing_period_id
          WHERE b.reservation_id = $1 AND b.status IN ('issued', 'partially_paid', 'paid') AND l.active
            AND l.kind IN ('electricity', 'water') AND b.statement_month < $2
          GROUP BY l.kind, b.statement_month) x
        WHERE x.rn <= 3`,
      [reservationId, month],
    );
    const out: Record<Meter, number[]> = { electricity: [], water: [] };
    for (const r of rows) out[r.kind].push(Number(r.q));
    return out;
  }

  private async serviceLines(
    tx: Tx,
    stay: LongStay,
    period: Period,
    exceptId: string | null,
  ): Promise<
    Array<{
      id: string;
      category: string;
      charge_code: string | null;
      description: string;
      service_date: string | null;
      quantity: string;
      unit_price_vnd: number;
      label_params: Record<string, string | number> | null;
      net: number;
      onOtherStatement: string | null;
    }>
  > {
    const categories = [...SERVICE_CATEGORIES, 'penalty', 'damage'];
    const { rows } = await tx.query<{
      id: string;
      category: string;
      charge_code: string | null;
      description: string;
      service_date: string | null;
      quantity: string;
      unit_price_vnd: string;
      label_params: Record<string, string | number> | null;
      net: string;
      other: string | null;
    }>(
      `SELECT l.id, l.category, l.charge_code, l.description, l.service_date::text, l.quantity::text,
              l.unit_price_vnd::text, l.label_params,
              (l.amount_vnd + COALESCE((SELECT sum(d.amount_vnd) FROM folio_line d
                                         WHERE d.related_line_id = l.id AND d.category IN ('foc', 'discount')
                                           AND d.line_state = 'posted' AND d.reversal_of_id IS NULL
                                           AND NOT EXISTS (SELECT 1 FROM folio_line dr WHERE dr.reversal_of_id = d.id)),
                                        0))::text AS net,
              (SELECT COALESCE(b.code, 'draft') FROM billing_period_line bl JOIN billing_period b ON b.id = bl.billing_period_id
                WHERE bl.folio_line_id = l.id AND bl.active AND b.status IN ('issued', 'partially_paid', 'paid')
                  AND ($5::uuid IS NULL OR b.id <> $5) LIMIT 1) AS other
         FROM folio_line l
        WHERE l.folio_id = $1 AND (l.reservation_id IS NULL OR l.reservation_id = $2)
          AND l.category = ANY($3::text[]) AND l.line_state = 'posted' AND l.reversal_of_id IS NULL
          AND (l.charge_code IS NULL OR NOT (l.charge_code = ANY($4::text[])))
          AND NOT EXISTS (SELECT 1 FROM folio_line r WHERE r.reversal_of_id = l.id)
          AND l.service_date BETWEEN $6 AND $7
        ORDER BY l.service_date, l.posted_at, l.id`,
      [
        stay.folioId,
        stay.id,
        categories,
        [...STATEMENT_CHARGE_CODES],
        exceptId,
        period.from,
        period.to,
      ],
    );
    return rows
      .map((r) => ({
        id: r.id,
        category: r.category,
        charge_code: r.charge_code,
        description: r.description,
        service_date: r.service_date,
        quantity: r.quantity,
        unit_price_vnd: Number(r.unit_price_vnd),
        label_params: r.label_params,
        net: Number(r.net),
        onOtherStatement: r.other,
      }))
      .filter((r) => r.net > 0);
  }

  // ───────────────────────── reads ─────────────────────────

  private async row(tx: Tx, id: string, opts: { forUpdate?: boolean } = {}): Promise<BpRow | null> {
    if (!UUID.test(id)) return null;
    const { rows } = await tx.query<BpRow>(
      `SELECT ${BP_COLUMNS} FROM billing_period b WHERE b.id = $1${opts.forUpdate ? ' FOR UPDATE' : ''}`,
      [id],
    );
    return rows[0] ?? null;
  }

  private async frozenLines(tx: Tx, id: string): Promise<StatementLine[]> {
    const { rows } = await tx.query<{
      kind: LineKind;
      label_key: string;
      label_params: Record<string, string | number> | null;
      quantity: string;
      unit: Unit;
      unit_price_net_vnd: string;
      vat_rate_pct: string | null;
      net_vnd: string;
      vat_vnd: string;
      amount_vnd: string;
      folio_line_id: string;
      room_id: string | null;
      meter_from_reading_id: string | null;
      meter_to_reading_id: string | null;
      details: Record<string, unknown> | null;
      sort_order: number;
    }>(
      `SELECT kind, label_key, label_params, quantity::text, unit, unit_price_net_vnd::text, vat_rate_pct::text,
              net_vnd::text, vat_vnd::text, amount_vnd::text, folio_line_id, room_id, meter_from_reading_id,
              meter_to_reading_id, details, sort_order
         FROM billing_period_line WHERE billing_period_id = $1 ORDER BY sort_order, id`,
      [id],
    );
    return rows.map((r) => {
      const d = r.details ?? {};
      return {
        kind: r.kind,
        labelKey: r.label_key,
        labelParams: r.label_params,
        quantity: Number(r.quantity),
        unit: r.unit,
        unitPriceNetVnd: Number(r.unit_price_net_vnd),
        vatRatePct: r.vat_rate_pct === null ? null : Number(r.vat_rate_pct),
        netVnd: Number(r.net_vnd),
        vatVnd: Number(r.vat_vnd),
        amountVnd: Number(r.amount_vnd),
        folioLineId: r.folio_line_id,
        roomId: r.room_id,
        roomNo: (d.roomNo as string | undefined) ?? null,
        meter: (d.meter as StatementLine['meter'] | undefined) ?? null,
        meterFromReadingId: r.meter_from_reading_id,
        meterToReadingId: r.meter_to_reading_id,
        serviceDate: (d.serviceDate as string | undefined) ?? null,
        posting: null,
        sortOrder: r.sort_order,
      };
    });
  }

  private async overdueParams(
    tx: Tx,
    today: LocalDate,
  ): Promise<{ alert: number; escalate: number }> {
    return {
      alert: await this.intParam(tx, 'rent_overdue_alert_days', today, 3),
      escalate: await this.intParam(tx, 'rent_overdue_escalate_days', today, 10),
    };
  }

  /**
   * §12.2 offer of `settle_outside_desk` to a manager (not owner): condition (a) of SEC 12-02 (ARC-BE-197-02) and
   * the payment history of SEC-BE-197-02 (BUG-R5-015) – (b) and (c) depend on the amount / date and are checked at
   * write.
   */
  private async managerMayOffer(
    tx: Tx,
    actor: BillingActor,
    row: BpRow,
    stay: LongStay,
    pc: PropertyNow,
  ): Promise<boolean> {
    if (!actor.roles.includes('manager') || actor.roles.includes('owner')) return false;
    if (row.status !== 'issued' && row.status !== 'partially_paid') return false;
    if (!this.holdsBackdatedArrival(row, stay) || !stay.checkinBackdatedOn) return false;
    return !(await this.paymentHistoryBarsManager(
      tx,
      row.id,
      stay.checkinBackdatedOn,
      pc.timezone,
    ));
  }

  private actions(row: BpRow, actor: BillingActor, managerOffer: boolean): string[] {
    const fdl = isFdlPlus(actor.roles);
    // §12.2: OWN always; MGR only when managerMayOffer (ARC-BE-197-02, BUG-R5-015).
    const mgr = actor.roles.includes('owner') || managerOffer;
    const balance = n(row.total_vnd) - n(row.paid_vnd);
    switch (row.status) {
      case 'draft':
        return ['update', ...(fdl ? ['prior_adjustment'] : []), 'issue', 'void'];
      case 'issued':
        return [
          ...(balance > 0 ? ['record_payment'] : []),
          ...(balance > 0 && mgr ? ['settle_outside_desk'] : []),
          'print',
          ...(fdl ? ['void'] : []),
        ];
      case 'partially_paid':
        return [
          ...(balance > 0 ? ['record_payment'] : []),
          ...(balance > 0 && mgr ? ['settle_outside_desk'] : []),
          'print',
        ];
      case 'paid':
        return ['print'];
      default:
        return [];
    }
  }

  async view(
    tx: Tx,
    actor: BillingActor,
    row: BpRow,
    pc?: PropertyNow,
  ): Promise<Record<string, unknown>> {
    const now = pc ?? (await this.property.now(tx));
    const stay = await loadLongStay(tx, row.reservation_id);
    const draft = row.status === 'draft';
    let lines: StatementLine[];
    let excludedLines: StatementLine[] = [];
    let warnings: Warning[] = [];
    let missing: MissingReading[] = [];
    let periods: {
      rent: Period | null;
      utility: Period | null;
      service: Period | null;
      due: string | null;
    };
    let totals: { net: number; vat: number; rounding: number; total: number };
    if (draft) {
      const c = await this.compute(
        tx,
        stay,
        {
          id: row.id,
          month: row.statement_month,
          kind: row.kind,
          excluded: row.excluded_folio_line_ids,
          priorAdjustmentVnd:
            row.prior_adjustment_vnd === null ? null : Number(row.prior_adjustment_vnd),
          priorAdjustmentReason: row.prior_adjustment_reason,
        },
        now,
      );
      lines = c.lines;
      excludedLines = c.excludedLines;
      warnings = c.warnings;
      missing = c.missing;
      periods = {
        rent: c.rent,
        utility: shownPeriod(c.utility, stay.arrival),
        service: shownPeriod(c.service, stay.arrival),
        due: c.dueDate,
      };
      totals = { net: c.netVnd, vat: c.vatVnd, rounding: c.roundingVnd, total: c.totalVnd };
    } else {
      lines = await this.frozenLines(tx, row.id);
      const p = (from: string | null, to: string | null) => (from && to ? { from, to } : null);
      periods = {
        rent: p(row.rent_period_from, row.rent_period_to),
        utility: p(row.utility_period_from, row.utility_period_to),
        service: p(row.service_period_from, row.service_period_to),
        due: row.due_date,
      };
      totals = {
        net: n(row.net_vnd),
        vat: n(row.vat_vnd),
        rounding: n(row.rounding_vnd),
        total: n(row.total_vnd),
      };
    }
    const paid = n(row.paid_vnd);
    const balance = row.status === 'void' ? 0 : Math.max(0, totals.total - paid);
    const od = LIVE_ISSUED.includes(row.status)
      ? overdueOf(
          now.today,
          row.due_date,
          balance > 0,
          ...(Object.values(await this.overdueParams(tx, now.today)) as [number, number]),
        )
      : { overdueDays: 0, alertLevel: null };
    const roomNos = [...new Set(stay.segments.map((s) => s.roomNo))];
    const replaced = row.replaces_id
      ? await tx.query<{ code: string | null }>('SELECT code FROM billing_period WHERE id = $1', [
          row.replaces_id,
        ])
      : null;
    // ARC BE-190-08: receipts not yet confirmed by the bank (VietQR `pending`) or disputed – the status stays paid.
    const recon = await tx.query<{ u: string | null; d: boolean | null }>(
      `SELECT sum(amount_vnd) FILTER (WHERE reconciliation IN ('pending', 'disputed'))::text AS u,
              bool_or(reconciliation = 'disputed') AS d
         FROM payment WHERE billing_period_id = $1 AND status = 'succeeded' AND reversal_of_id IS NULL
          AND NOT EXISTS (SELECT 1 FROM payment r WHERE r.reversal_of_id = payment.id)`,
      [row.id],
    );
    return {
      id: row.id,
      code: row.code,
      status: row.status,
      kind: row.kind,
      month: monthLabel(row.statement_month),
      reservationId: row.reservation_id,
      reservationCode: stay.code,
      folioId: row.folio_id,
      roomNos,
      guestDisplayName: shortGuestName(stay.guestFullName),
      rentPeriod: periods.rent,
      utilityPeriod: periods.utility,
      servicePeriod: periods.service,
      dueDate: periods.due,
      overdueDays: od.overdueDays,
      alertLevel: od.alertLevel,
      lines: lines.map((l) => this.lineView(l)),
      totals: {
        netVnd: totals.net,
        vatVnd: totals.vat,
        roundingVnd: totals.rounding,
        totalVnd: totals.total,
        paidVnd: paid,
        balanceVnd: balance,
        unreconciledVnd: n(recon.rows[0]?.u ?? null),
        disputed: recon.rows[0]?.d === true,
      },
      warnings,
      missingReadings: missing,
      excludedFolioLineIds: row.excluded_folio_line_ids,
      excludedLines: excludedLines.map((l) => this.lineView(l)),
      priorAdjustment:
        row.prior_adjustment_vnd === null
          ? null
          : { amountVnd: Number(row.prior_adjustment_vnd), reason: row.prior_adjustment_reason },
      note: row.note,
      availableActions: this.actions(
        row,
        actor,
        await this.managerMayOffer(tx, actor, row, stay, now),
      ),
      ratesSnapshot: row.rates_snapshot,
      replacesId: row.replaces_id,
      replacesCode: replaced?.rows[0]?.code ?? null,
      issuedAt: row.issued_at ? now.iso(row.issued_at) : null,
      paidAt: row.paid_at ? now.iso(row.paid_at) : null,
      voidedAt: row.voided_at ? now.iso(row.voided_at) : null,
      voidReason: row.void_reason,
      version: row.version,
    };
  }

  /**
   * One statement line as returned. `periodMonth` (UXD FE-189-02): the month the line is for – rent: its rent period,
   * electricity / water: the utility period (M−1 in `advance`), service: its service date; null for rounding and the
   * prior adjustment. `netVnd` (before VAT) and `vatVnd` are separate so the print sums net lines + one VAT line.
   */
  private lineView(l: StatementLine): Record<string, unknown> {
    const from = l.labelParams?.from;
    const periodMonth =
      l.kind === 'service'
        ? (l.serviceDate?.slice(0, 7) ?? null)
        : (l.kind === 'rent' || l.kind === 'electricity' || l.kind === 'water') &&
            typeof from === 'string'
          ? from.slice(0, 7)
          : null;
    return {
      kind: l.kind,
      labelKey: l.labelKey,
      labelParams: l.labelParams,
      quantity: l.quantity,
      unit: l.unit,
      unitPriceNetVnd: l.unitPriceNetVnd,
      vatRatePct: this.vatOf(l),
      netVnd: l.netVnd,
      vatVnd: l.vatVnd,
      amountVnd: l.amountVnd,
      folioLineId: l.folioLineId,
      roomNo: l.roomNo,
      meter: l.meter,
      serviceDate: l.serviceDate,
      periodMonth,
    };
  }

  /** VAT % of a utility line (null = price including VAT: rent, services, rounding, adjustment). */
  private vatOf(l: StatementLine): number | null {
    return l.kind === 'electricity' || l.kind === 'water' ? l.vatRatePct : null;
  }

  async get(
    tx: Tx,
    actor: BillingActor,
    id: string,
  ): Promise<{ version: number; body: Record<string, unknown> }> {
    const row = await this.row(tx, id);
    if (!row) throw problem('NOT_FOUND');
    return { version: row.version, body: await this.view(tx, actor, row) };
  }

  async list(tx: Tx, actor: BillingActor, q: Record<string, string | undefined>): Promise<unknown> {
    const limit = parseLimit(q.limit, 50);
    const cursor = decodeCursor(q.cursor, 2);
    const errors: Array<{ field: string; code: string }> = [];
    const statuses: Status[] = ['draft', 'issued', 'partially_paid', 'paid', 'void'];
    const status = q.status ? q.status.split(',') : null;
    if (status && !status.every((s) => (statuses as string[]).includes(s)))
      errors.push({ field: 'status', code: 'NOT_IN_LIST' });
    const month = q.month ? parseMonth(q.month) : null;
    if (q.month && !month) errors.push({ field: 'month', code: 'DATE_INVALID' });
    if (q.roomId && !UUID.test(q.roomId))
      errors.push({ field: 'roomId', code: 'VALIDATION_FAILED' });
    const overdue = q.overdue === 'true';
    if (q.overdue !== undefined && q.overdue !== 'true' && q.overdue !== 'false') {
      errors.push({ field: 'overdue', code: 'VALIDATION_FAILED' });
    }
    if (errors.length) throw problem('VALIDATION_FAILED', { errors });
    const pc = await this.property.now(tx);
    const { rows } = await tx.query<BpRow & { room_nos: string[]; full_name: string | null }>(
      `SELECT ${BP_COLUMNS},
              ARRAY(SELECT DISTINCT rm.room_no FROM reservation_segment s JOIN room rm ON rm.id = s.room_id
                     WHERE s.reservation_id = b.reservation_id AND s.active ORDER BY rm.room_no) AS room_nos,
              g.full_name
         FROM billing_period b JOIN reservation r ON r.id = b.reservation_id
         LEFT JOIN guest g ON g.id = r.booker_guest_id
        WHERE ($1::text[] IS NULL OR b.status = ANY($1::text[]))
          AND ($2::date IS NULL OR b.statement_month = $2)
          AND ($3::uuid IS NULL OR EXISTS (SELECT 1 FROM reservation_segment s WHERE s.reservation_id = b.reservation_id
                                            AND s.active AND s.room_id = $3))
          AND (NOT $4 OR (b.status IN ('issued', 'partially_paid') AND b.due_date <= $5
                          AND COALESCE(b.total_vnd, 0) > b.paid_vnd))
          AND ($6::text IS NULL OR (b.statement_month::text, b.id::text) < ($6, $7))
        ORDER BY b.statement_month DESC, b.id DESC LIMIT $8`,
      [
        status,
        month,
        q.roomId ?? null,
        overdue,
        pc.today,
        cursor ? String(cursor[0]) : null,
        cursor ? String(cursor[1]) : null,
        limit + 1,
      ],
    );
    const od = await this.overdueParams(tx, pc.today);
    const items = rows.map((r) => {
      const total = n(r.total_vnd);
      const balance =
        r.status === 'void' || r.status === 'draft' ? 0 : Math.max(0, total - n(r.paid_vnd));
      const o = LIVE_ISSUED.includes(r.status)
        ? overdueOf(pc.today, r.due_date, balance > 0, od.alert, od.escalate)
        : { overdueDays: 0, alertLevel: null };
      return {
        id: r.id,
        code: r.code,
        reservationId: r.reservation_id,
        roomNos: r.room_nos,
        guestDisplayName: shortGuestName(r.full_name),
        month: monthLabel(r.statement_month),
        kind: r.kind,
        totalVnd: r.status === 'draft' ? null : total,
        balanceVnd: balance,
        dueDate: r.due_date,
        status: r.status,
        overdueDays: o.overdueDays,
        alertLevel: o.alertLevel,
      };
    });
    return page(items, limit, (i) => [`${i.month}-01`, i.id]);
  }

  async candidates(tx: Tx, actor: BillingActor, rawMonth: string | undefined): Promise<unknown> {
    const month = parseMonth(rawMonth);
    if (!month) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'month', code: rawMonth === undefined ? 'REQUIRED' : 'DATE_INVALID' }],
      });
    }
    const pc = await this.property.now(tx);
    const rules = await this.rules(tx, pc.today);
    // ARC BE-190-02 (3): a stay checked out within `readingWindow.daysAfter` still needs its final statement.
    const { rows } = await tx.query<{ id: string }>(
      `SELECT r.id FROM reservation r
        WHERE r.stay_type = 'long'
          AND (r.status = 'in_house' OR (r.status = 'checked_out' AND r.departure_date >= $2))
          AND (r.manual_long_stay->>'monthly_rent_vnd') IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM billing_period b WHERE b.reservation_id = r.id AND b.statement_month = $1
                           AND b.status NOT IN ('void', 'draft'))
        ORDER BY r.arrival_date, r.id`,
      [month, addDays(pc.today, -rules.readingWindow.daysAfter)],
    );
    type St = 'missing' | 'recorded' | 'exception' | 'not_needed';
    const statusOf = (r: ReadingRow | undefined | null): St =>
      !r
        ? 'missing'
        : r.electricity_exception || r.water_exception || r.photo_waived_by
          ? 'exception'
          : 'recorded';
    const items: unknown[] = [];
    for (const { id } of rows) {
      let stay: LongStay;
      try {
        stay = await loadLongStay(tx, id);
      } catch {
        continue;
      }
      const kind = this.expectedKind(stay, month, rules);
      if (!kind) continue;
      if (stay.status === 'checked_out' && kind !== 'final') continue;
      const draft = await tx.query<{ id: string }>(
        `SELECT id FROM billing_period WHERE reservation_id = $1 AND statement_month = $2 AND status = 'draft'`,
        [id, month],
      );
      // ARC BE-190-02: per room – the opening and the closing of the utility period on this statement (both
      // required since INV 17/11) and the opening of the next month (typed from the same end-of-month sheet).
      // `missing` follows the issue check (compute) so "ready" never ends in 422 METER_READING_MISSING.
      const u = clip(
        statementPeriods(month, rules, stay.arrival).utility,
        stay.arrival,
        stay.lastNight,
      );
      const rooms: Array<{
        roomId: string;
        roomNo: string;
        opening: St;
        closing: St;
        nextOpening: Exclude<St, 'exception'>;
        openingKind: 'checkin' | 'room_change_in' | 'period_start';
        segmentFrom: LocalDate;
      }> = [];
      if (u) {
        const pMonth = monthOf(u.from);
        const readings = (await this.meters.readings(tx, id)).filter((r) => r.voided_at === null);
        const c = await this.compute(
          tx,
          stay,
          {
            id: draft.rows[0]?.id ?? null,
            month,
            kind,
            excluded: [],
            priorAdjustmentVnd: null,
            priorAdjustmentReason: null,
          },
          pc,
        );
        const segs = stay.segments.filter((x) => x.from <= u.to && x.to > u.from);
        for (const seg of segs) {
          if (rooms.some((x) => x.roomId === seg.roomId)) continue;
          const open = await this.meters.openingFor(tx, {
            reservationId: id,
            roomId: seg.roomId,
            kind: 'period_end',
            periodMonth: pMonth,
            readOn: addDays(u.to, 62),
          });
          const closings = readings.filter(
            (r) =>
              r.room_id === seg.roomId &&
              ((r.kind === 'period_end' && r.period_month === pMonth) ||
                (r.kind === 'room_change_out' && r.read_on >= u.from && r.read_on <= u.to)),
          );
          const closingMissing = c.missing.some(
            (m) => m.roomId === seg.roomId && m.kind !== 'opening',
          );
          const closing: St = closingMissing
            ? 'missing'
            : closings.length === 0
              ? 'not_needed'
              : closings.some((r) => statusOf(r) === 'exception')
                ? 'exception'
                : 'recorded';
          const holdsAtEnd = stay.segments.some(
            (x) => x.roomId === seg.roomId && x.from <= u.to && u.to < x.to,
          );
          const next = addMonths(pMonth, 1);
          const nextOpening: Exclude<St, 'exception'> =
            holdsAtEnd && stay.lastNight > u.to
              ? readings.some(
                  (r) =>
                    r.room_id === seg.roomId &&
                    r.kind === 'period_start' &&
                    r.period_month === next,
                )
                ? 'recorded'
                : 'missing'
              : 'not_needed';
          // ARC BE-190-12: which opening the desk types for this room, and the day it belongs to.
          const idx = stay.segments.indexOf(seg);
          const movedIn = idx > 0 && stay.segments[idx - 1]?.roomId !== seg.roomId;
          const openingKind =
            seg.from < u.from
              ? 'period_start'
              : idx === 0
                ? 'checkin'
                : movedIn
                  ? 'room_change_in'
                  : 'period_start';
          rooms.push({
            roomId: seg.roomId,
            roomNo: seg.roomNo,
            opening: statusOf(open),
            closing,
            nextOpening,
            openingKind,
            segmentFrom: seg.from,
          });
        }
      }
      // Aggregate (kept for compatibility): missing when an opening or a closing of any room is missing.
      const readingStatus: St =
        rooms.length === 0
          ? 'not_needed'
          : rooms.some((r) => r.opening === 'missing' || r.closing === 'missing')
            ? 'missing'
            : rooms.some((r) => r.opening === 'exception' || r.closing === 'exception')
              ? 'exception'
              : 'recorded';
      items.push({
        reservationId: id,
        reservationCode: stay.code,
        roomNos: [...new Set(stay.segments.map((x) => x.roomNo))],
        rooms,
        guestDisplayName: shortGuestName(stay.guestFullName),
        kind,
        readingStatus,
        draftId: draft.rows[0]?.id ?? null,
      });
    }
    return { month: monthLabel(month), items };
  }

  // ───────────────────────── writes ─────────────────────────

  private billable(
    stay: LongStay,
    kind: 'regular' | 'final',
    rules: StatementRules,
    today: LocalDate,
  ): void {
    if (stay.status === 'in_house') return;
    if (
      kind === 'final' &&
      stay.status === 'checked_out' &&
      today <= addDays(stay.departure, rules.readingWindow.daysAfter)
    ) {
      return;
    }
    throw problem('INVALID_TRANSITION', { extras: { currentState: stay.status } });
  }

  async create(
    tx: Tx,
    actor: BillingActor,
    reservationId: string,
    raw: unknown,
  ): Promise<{ version: number; body: Record<string, unknown> }> {
    const body = obj(raw);
    const stay = await loadLongStay(tx, reservationId, { lock: true });
    const month = parseMonth(body.month);
    if (!month) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'month', code: body.month === undefined ? 'REQUIRED' : 'DATE_INVALID' }],
      });
    }
    if (body.kind !== undefined && body.kind !== 'regular' && body.kind !== 'final') {
      throw problem('VALIDATION_FAILED', { errors: [{ field: 'kind', code: 'NOT_IN_LIST' }] });
    }
    const pc = await this.property.now(tx);
    const rules = await this.rules(tx, pc.today);
    const expected = this.expectedKind(stay, month, rules);
    if (!expected)
      throw problem('VALIDATION_FAILED', { errors: [{ field: 'month', code: 'NOT_ALLOWED' }] });
    const kind = (body.kind as 'regular' | 'final' | undefined) ?? expected;
    if (kind !== expected) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'kind', code: 'NOT_ALLOWED' }],
        extras: { allowed: [expected] },
      });
    }
    this.billable(stay, kind, rules, pc.today);
    const live = await tx.query<{ id: string }>(
      `SELECT id FROM billing_period WHERE reservation_id = $1 AND statement_month = $2 AND kind = $3
          AND status <> 'void'`,
      [stay.id, month, kind],
    );
    if (live.rows[0])
      throw problem('STATEMENT_EXISTS', { extras: { billingPeriodId: live.rows[0].id } });
    // A voided issued statement of the same month is replaced (code -R<n>).
    const replaced = await tx.query<{ id: string }>(
      `SELECT b.id FROM billing_period b
        WHERE b.reservation_id = $1 AND b.statement_month = $2 AND b.kind = $3 AND b.status = 'void'
          AND b.code IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM billing_period x WHERE x.replaces_id = b.id)
        ORDER BY b.voided_at DESC LIMIT 1`,
      [stay.id, month, kind],
    );
    const id = uuidv7();
    try {
      await tx.query(
        `INSERT INTO billing_period (id, organization_id, property_id, folio_id, reservation_id, statement_month, kind,
           replaces_id, created_at, created_by, updated_at)
         SELECT $1, p.organization_id, p.id, $2, $3, $4, $5, $6, $7, $8, $7 FROM property p WHERE p.id = $9`,
        [
          id,
          stay.folioId,
          stay.id,
          month,
          kind,
          replaced.rows[0]?.id ?? null,
          pc.now,
          actor.userId,
          pc.propertyId,
        ],
      );
    } catch (err) {
      if (isUniqueViolation(err, 'billing_period_live_key')) throw problem('STATEMENT_EXISTS');
      throw err;
    }
    const row = (await this.row(tx, id)) as BpRow;
    return { version: row.version, body: await this.view(tx, actor, row, pc) };
  }

  /** Lock order of every statement write: booking KEY SHARE → folio FOR UPDATE → statement FOR UPDATE. */
  private async lockStatement(tx: Tx, id: string): Promise<{ stay: LongStay; row: BpRow }> {
    const first = await this.row(tx, id);
    if (!first) throw problem('NOT_FOUND');
    const stay = await loadLongStay(tx, first.reservation_id, { lock: true });
    await this.folios.lock(tx, first.folio_id);
    const row = (await this.row(tx, id, { forUpdate: true })) as BpRow;
    return { stay, row };
  }

  async update(
    tx: Tx,
    actor: BillingActor,
    id: string,
    raw: unknown,
    ifMatch: number | undefined,
  ): Promise<{ version: number; body: Record<string, unknown> }> {
    const body = obj(raw);
    const { stay, row } = await this.lockStatement(tx, id);
    if (ifMatch !== undefined) assertVersion(row.version, ifMatch);
    if (row.status !== 'draft')
      throw problem('INVALID_TRANSITION', { extras: { currentState: row.status } });
    const allowed = ['excludedFolioLineIds', 'priorAdjustment', 'note'];
    const extra = Object.keys(body).find((k) => !allowed.includes(k));
    if (extra)
      throw problem('VALIDATION_FAILED', { errors: [{ field: extra, code: 'NOT_ALLOWED' }] });
    const pc = await this.property.now(tx);
    let excluded = row.excluded_folio_line_ids;
    if (body.excludedFolioLineIds !== undefined) {
      const ids = body.excludedFolioLineIds;
      if (
        !Array.isArray(ids) ||
        ids.length > 200 ||
        !ids.every((x) => typeof x === 'string' && UUID.test(x))
      ) {
        throw problem('VALIDATION_FAILED', {
          errors: [{ field: 'excludedFolioLineIds', code: 'VALIDATION_FAILED' }],
        });
      }
      const rules = await this.rules(tx, pc.today);
      const periods = statementPeriods(row.statement_month, rules, stay.arrival);
      const services = await this.serviceLines(tx, stay, periods.service, row.id);
      const known = new Set(services.map((s) => s.id));
      const bad = (ids as string[]).findIndex((x) => !known.has(x));
      // SEC 4: a line of another folio, or outside the service period → NOT_IN_LIST.
      if (bad >= 0) {
        throw problem('VALIDATION_FAILED', {
          errors: [{ field: `excludedFolioLineIds[${bad}]`, code: 'NOT_IN_LIST' }],
        });
      }
      excluded = [...new Set(ids as string[])];
    }
    let priorVnd = row.prior_adjustment_vnd === null ? null : Number(row.prior_adjustment_vnd);
    let priorReason = row.prior_adjustment_reason;
    if (body.priorAdjustment !== undefined) {
      if (!isFdlPlus(actor.roles)) throw problem('FORBIDDEN_ACTION');
      if (body.priorAdjustment === null) {
        priorVnd = null;
        priorReason = null;
      } else {
        const p = obj(body.priorAdjustment);
        const amount = p.amountVnd;
        if (
          !Number.isSafeInteger(amount) ||
          amount === 0 ||
          Math.abs(amount as number) > 1_000_000_000
        ) {
          throw problem('VALIDATION_FAILED', {
            errors: [{ field: 'priorAdjustment.amountVnd', code: 'VALIDATION_FAILED' }],
          });
        }
        priorVnd = amount as number;
        priorReason = freeText('priorAdjustment.reason', p.reason, { required: true });
      }
    }
    const note = body.note !== undefined ? freeText('note', body.note) : row.note;
    await tx.query(
      `UPDATE billing_period SET excluded_folio_line_ids = $2, prior_adjustment_vnd = $3, prior_adjustment_reason = $4,
              note = $5, updated_at = $6, version = version + 1
        WHERE id = $1`,
      [id, excluded, priorVnd, priorReason, note, pc.now],
    );
    // SEC BE-190-02: money decided on a draft – who, when, before / after (the reason of the adjustment as reason).
    const beforePrior = row.prior_adjustment_vnd === null ? null : Number(row.prior_adjustment_vnd);
    const sameExcluded =
      excluded.length === row.excluded_folio_line_ids.length &&
      excluded.every((x) => row.excluded_folio_line_ids.includes(x));
    if (beforePrior !== priorVnd || priorReason !== row.prior_adjustment_reason || !sameExcluded) {
      await this.audit.record(tx, {
        category: 'state',
        action: 'billing_period.updated',
        entityType: 'billing_period',
        entityId: row.id,
        entityCode: stay.code,
        before: {
          priorAdjustmentVnd: beforePrior,
          excludedFolioLineCount: row.excluded_folio_line_ids.length,
        },
        after: { priorAdjustmentVnd: priorVnd, excludedFolioLineCount: excluded.length },
        ...(priorReason && priorReason !== row.prior_adjustment_reason
          ? { reason: priorReason }
          : {}),
        ...(actor.requestId ? { requestId: actor.requestId } : {}),
      });
    }
    const next = (await this.row(tx, id)) as BpRow;
    return { version: next.version, body: await this.view(tx, actor, next, pc) };
  }

  private async nextCode(tx: Tx, stay: LongStay, row: BpRow, roomNo: string): Promise<string> {
    const { rows } = await tx.query<{ c: number }>(
      `SELECT count(*)::int AS c FROM billing_period WHERE reservation_id = $1 AND statement_month = $2 AND kind = $3
          AND status = 'void' AND code IS NOT NULL`,
      [stay.id, row.statement_month, row.kind],
    );
    let r = rows[0]?.c ?? 0;
    for (;;) {
      const code = statementCode(row.statement_month, roomNo, r);
      const taken = await tx.query('SELECT 1 FROM billing_period WHERE code = $1', [code]);
      if (!taken.rowCount) return code;
      r += 1;
    }
  }

  async issue(
    tx: Tx,
    actor: BillingActor,
    id: string,
    raw: unknown,
    ifMatch: number | undefined,
  ): Promise<{ version: number; body: Record<string, unknown> }> {
    const body = obj(raw);
    if (body.acknowledgeWarnings !== undefined && typeof body.acknowledgeWarnings !== 'boolean') {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'acknowledgeWarnings', code: 'VALIDATION_FAILED' }],
      });
    }
    const { stay, row } = await this.lockStatement(tx, id);
    if (ifMatch !== undefined) assertVersion(row.version, ifMatch);
    if (row.status !== 'draft')
      throw problem('INVALID_TRANSITION', { extras: { currentState: row.status } });
    const pc = await this.property.now(tx);
    const rules = await this.rules(tx, pc.today);
    this.billable(stay, row.kind, rules, pc.today);
    const c = await this.compute(
      tx,
      stay,
      {
        id: row.id,
        month: row.statement_month,
        kind: row.kind,
        excluded: row.excluded_folio_line_ids,
        priorAdjustmentVnd:
          row.prior_adjustment_vnd === null ? null : Number(row.prior_adjustment_vnd),
        priorAdjustmentReason: row.prior_adjustment_reason,
      },
      pc,
    );
    if (c.missing.length > 0)
      throw problem('METER_READING_MISSING', { extras: { missingReadings: c.missing } });
    if (c.warnings.length > 0 && body.acknowledgeWarnings !== true) {
      throw problem('WARNINGS_NOT_ACKNOWLEDGED', { extras: { warnings: c.warnings } });
    }
    if (c.totalVnd <= 0) throw problem('AMOUNT_NOT_POSITIVE');
    const roomEnd = c.rent?.to ?? c.utility.to;
    const seg =
      stay.segments.find((s) => s.from <= roomEnd && roomEnd < s.to) ??
      stay.segments[stay.segments.length - 1];
    const code = await this.nextCode(tx, stay, row, seg?.roomNo ?? 'X');

    // Folio lines the statement owns (contract 2.4) – one postLines call, in display order.
    const owned = c.lines.filter((l) => l.posting !== null);
    const inputs: FolioLineInput[] = owned.map((l) => {
      const p = l.posting as NonNullable<StatementLine['posting']>;
      const params: Record<string, string | number> = {
        ...(l.labelParams ?? {}),
        statementCode: code,
      };
      return {
        reservationId: stay.id,
        category: p.category,
        description: `${l.kind} ${code}`,
        quantity: l.quantity,
        unitPriceVnd: p.unitPriceVnd,
        amountVnd: l.amountVnd,
        serviceDate: p.periodTo ?? c.utility.to,
        source: 'system',
        chargeCode: p.chargeCode,
        labelParams: params,
        ...(l.kind === 'electricity' || l.kind === 'water' ? { vatRatePct: this.vatOf(l) } : {}),
        ...(p.category === 'room'
          ? { limitRefVnd: p.unitPriceVnd, periodFrom: p.periodFrom, periodTo: p.periodTo }
          : {}),
        ...(p.adjustsGroup ? { adjustsGroup: p.adjustsGroup } : {}),
        ...(p.reason ? { reason: p.reason } : {}),
      };
    });
    const folioActor = {
      userId: actor.userId,
      reservationCode: stay.code,
      ...(actor.requestId ? { requestId: actor.requestId } : {}),
    };
    const postedIds = inputs.length
      ? await this.folios.postLines(tx, stay.folioId, inputs, folioActor)
      : [];
    let k = 0;
    for (const l of c.lines) {
      const folioLineId = l.posting ? (postedIds[k++] as string) : (l.folioLineId as string);
      const details: Record<string, unknown> = {};
      if (l.roomNo) details.roomNo = l.roomNo;
      if (l.meter) details.meter = l.meter;
      if (l.serviceDate) details.serviceDate = l.serviceDate;
      try {
        await tx.query(
          `INSERT INTO billing_period_line (id, organization_id, property_id, billing_period_id, kind, folio_line_id,
             posted_by_statement, meter_from_reading_id, meter_to_reading_id, room_id, quantity, unit, unit_price_net_vnd,
             vat_rate_pct, net_vnd, vat_vnd, amount_vnd, label_key, label_params, details, sort_order, created_at)
           SELECT $1, organization_id, property_id, id, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
                  $16, $17, $18, $19
             FROM billing_period WHERE id = $20`,
          [
            uuidv7(),
            l.kind,
            folioLineId,
            l.posting !== null,
            l.meterFromReadingId,
            l.meterToReadingId,
            l.roomId,
            l.quantity,
            l.unit,
            l.unitPriceNetVnd,
            this.vatOf(l),
            l.netVnd,
            l.vatVnd,
            l.amountVnd,
            l.labelKey,
            l.labelParams || l.posting
              ? JSON.stringify({ ...(l.labelParams ?? {}), statementCode: code })
              : null,
            Object.keys(details).length ? JSON.stringify(details) : null,
            l.sortOrder,
            pc.now,
            row.id,
          ],
        );
      } catch (err) {
        if (isUniqueViolation(err, 'billing_period_line_live_folio_line_key')) {
          throw problem('VERSION_CONFLICT', { extras: { currentVersion: row.version } });
        }
        throw err;
      }
    }
    await tx.query(
      `UPDATE billing_period SET status = 'issued', code = $2, rent_period_from = $3, rent_period_to = $4,
              utility_period_from = $5, utility_period_to = $6, service_period_from = $7, service_period_to = $8,
              due_date = $9, rates_snapshot = $10, net_vnd = $11, vat_vnd = $12, rounding_vnd = $13, total_vnd = $14,
              issued_at = $15, issued_by = $16, updated_at = $15, version = version + 1
        WHERE id = $1`,
      [
        row.id,
        code,
        c.rent?.from ?? null,
        c.rent?.to ?? null,
        shownPeriod(c.utility, stay.arrival)?.from ?? null,
        shownPeriod(c.utility, stay.arrival)?.to ?? null,
        shownPeriod(c.service, stay.arrival)?.from ?? null,
        shownPeriod(c.service, stay.arrival)?.to ?? null,
        c.dueDate,
        JSON.stringify(c.rates),
        c.netVnd,
        c.vatVnd,
        c.roundingVnd,
        c.totalVnd,
        pc.now,
        actor.userId,
      ],
    );
    await this.audit.record(tx, {
      category: 'state',
      action: 'billing_period.issued',
      entityType: 'billing_period',
      entityId: row.id,
      entityCode: code,
      before: { status: 'draft' },
      after: {
        status: 'issued',
        code,
        month: monthLabel(row.statement_month),
        kind: row.kind,
        totalVnd: c.totalVnd,
        warnings: c.warnings.map((w) => w.code),
        priorAdjustmentVnd:
          row.prior_adjustment_vnd === null ? null : Number(row.prior_adjustment_vnd),
        excludedFolioLineCount: row.excluded_folio_line_ids.length,
      },
      ...(actor.requestId ? { requestId: actor.requestId } : {}),
    });
    const next = (await this.row(tx, id)) as BpRow;
    return { version: next.version, body: await this.view(tx, actor, next, pc) };
  }

  async void(
    tx: Tx,
    actor: BillingActor,
    id: string,
    raw: unknown,
    ifMatch: number | undefined,
  ): Promise<{ version: number; body: Record<string, unknown> }> {
    const reason = freeText('reason', obj(raw).reason, { required: true }) as string;
    const { stay, row } = await this.lockStatement(tx, id);
    if (ifMatch !== undefined) assertVersion(row.version, ifMatch);
    if (row.status === 'void')
      throw problem('INVALID_TRANSITION', { extras: { currentState: 'void' } });
    const pc = await this.property.now(tx);
    const paid = await this.paidVnd(tx, row.id);
    if (row.status !== 'draft') {
      // SEC BE-190-06: the role first (403 before 409), so FD learns nothing from the order of the errors.
      if (!isFdlPlus(actor.roles)) throw problem('FORBIDDEN_ACTION');
      if (paid > 0 || row.status !== 'issued')
        throw problem('STATEMENT_HAS_PAYMENTS', { extras: { paidVnd: paid } });
      const { rows } = await tx.query<{ folio_line_id: string; posted_by_statement: boolean }>(
        `SELECT folio_line_id, posted_by_statement FROM billing_period_line
          WHERE billing_period_id = $1 AND active ORDER BY sort_order DESC, id DESC`,
        [row.id],
      );
      const folioActor = {
        userId: actor.userId,
        reservationCode: stay.code,
        ...(actor.requestId ? { requestId: actor.requestId } : {}),
      };
      for (const l of rows) {
        if (l.posted_by_statement) {
          await this.folios.reverseLine(
            tx,
            l.folio_line_id,
            `Statement ${row.code} voided: ${reason}`.slice(0, 500),
            folioActor,
          );
        }
      }
      await tx.query(
        'UPDATE billing_period_line SET active = false WHERE billing_period_id = $1 AND active',
        [row.id],
      );
    }
    await tx.query(
      `UPDATE billing_period SET status = 'void', voided_at = $2, voided_by = $3, void_reason = $4, updated_at = $2,
              version = version + 1
        WHERE id = $1`,
      [row.id, pc.now, actor.userId, reason],
    );
    await this.audit.record(tx, {
      category: 'state',
      action: 'billing_period.voided',
      entityType: 'billing_period',
      entityId: row.id,
      ...(row.code ? { entityCode: row.code } : {}),
      before: { status: row.status },
      after: { status: 'void', month: monthLabel(row.statement_month), kind: row.kind },
      reason,
      ...(actor.requestId ? { requestId: actor.requestId } : {}),
    });
    const next = (await this.row(tx, id)) as BpRow;
    const rules = await this.rules(tx, pc.today);
    const canReplace =
      row.code !== null && this.expectedKind(stay, row.statement_month, rules) === row.kind;
    return {
      version: next.version,
      body: { ...(await this.view(tx, actor, next, pc)), canReplace },
    };
  }

  private async paidVnd(tx: Tx, id: string): Promise<number> {
    const { rows } = await tx.query<{ s: string | null }>(
      `SELECT sum(amount_vnd)::text AS s FROM payment
        WHERE billing_period_id = $1 AND status = 'succeeded' AND reversal_of_id IS NULL`,
      [id],
    );
    return n(rows[0]?.s ?? null);
  }

  /** Recompute `paid_vnd` + status from the receipts (record, and the payments module's reversal listener). */
  async refreshPaid(tx: Tx, id: string): Promise<void> {
    const row = await this.row(tx, id, { forUpdate: true });
    if (!row || !LIVE_ISSUED.includes(row.status)) return;
    const paid = await this.paidVnd(tx, id);
    const total = n(row.total_vnd);
    const status: Status =
      paid >= total && total > 0 ? 'paid' : paid > 0 ? 'partially_paid' : 'issued';
    if (status === row.status && paid === n(row.paid_vnd)) return;
    const pc = await this.property.now(tx);
    await tx.query(
      `UPDATE billing_period SET paid_vnd = $2, status = $3,
              paid_at = CASE WHEN $3 = 'paid' THEN COALESCE(paid_at, $4) ELSE NULL END,
              updated_at = $4, version = version + 1
        WHERE id = $1`,
      [id, paid, status, pc.now],
    );
    if (status !== row.status) {
      await this.audit.record(tx, {
        category: 'state',
        action: 'billing_period.payment_status_changed',
        entityType: 'billing_period',
        entityId: id,
        ...(row.code ? { entityCode: row.code } : {}),
        before: { status: row.status, paidVnd: n(row.paid_vnd) },
        after: { status, paidVnd: paid },
      });
    }
  }

  async recordPayment(
    tx: Tx,
    actor: BillingActor,
    id: string,
    raw: unknown,
  ): Promise<{ billingPeriod: Record<string, unknown>; payment: Record<string, unknown> }> {
    const body = obj(raw);
    const allowedKeys = ['method', 'amountVnd', 'receivedAt', 'note', 'bankReference'];
    const extra = Object.keys(body).find((k) => !allowedKeys.includes(k));
    if (extra)
      throw problem('VALIDATION_FAILED', { errors: [{ field: extra, code: 'NOT_ALLOWED' }] });
    if (body.method !== 'cash' && body.method !== 'vietqr') {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'method', code: body.method === undefined ? 'REQUIRED' : 'NOT_IN_LIST' }],
      });
    }
    const amount = body.amountVnd;
    if (!Number.isSafeInteger(amount) || (amount as number) <= 0) {
      throw problem('VALIDATION_FAILED', {
        errors: [
          { field: 'amountVnd', code: amount === undefined ? 'REQUIRED' : 'VALIDATION_FAILED' },
        ],
      });
    }
    const { stay, row } = await this.lockStatement(tx, id);
    if (row.status !== 'issued' && row.status !== 'partially_paid') {
      throw problem('INVALID_TRANSITION', { extras: { currentState: row.status } });
    }
    const balance = n(row.total_vnd) - (await this.paidVnd(tx, row.id));
    if ((amount as number) > balance)
      throw problem('AMOUNT_OVER_BALANCE', { extras: { balanceVnd: Math.max(0, balance) } });
    const payment = await this.payments.recordInTx(
      tx,
      actor,
      row.folio_id,
      {
        type: 'charge',
        method: body.method,
        amountVnd: amount as number,
        receivedAt: (body.receivedAt as string | null | undefined) ?? null,
        note: (body.note as string | null | undefined) ?? null,
        ...(body.bankReference !== undefined
          ? { bankReference: body.bankReference as string | null }
          : {}),
      },
      {
        reservationId: stay.id,
        reservationCode: stay.code,
        outstandingCapVnd: balance,
        billingPeriodId: row.id,
      },
    );
    await this.refreshPaid(tx, row.id);
    await this.audit.record(tx, {
      category: 'state',
      action: 'billing_period.payment_recorded',
      entityType: 'billing_period',
      entityId: row.id,
      ...(row.code ? { entityCode: row.code } : {}),
      after: { paymentId: payment.id, method: body.method, amountVnd: amount },
      ...(actor.requestId ? { requestId: actor.requestId } : {}),
    });
    const next = (await this.row(tx, id)) as BpRow;
    return {
      billingPeriod: await this.view(tx, actor, next),
      payment: {
        id: payment.id,
        method: payment.method,
        amountVnd: payment.amount_vnd,
        status: payment.status,
        reconciliation: payment.reconciliation,
      },
    };
  }

  /**
   * FB-INV-012 §12.2 (A128, ARC G4) – "đã thu ngoài Desk": the statement (or part of it) was paid before Desk, on the
   * old platform. One `charge` receipt `outside_desk` (no shift, no reconciliation, not refundable), then `refreshPaid`.
   * Order: body shape → lock (booking → folio → statement) → status → balance → role scope (SEC FB-R5-SEC-ARC-12-02).
   * - OWN: any `issued`/`partially_paid` statement, any amount ≤ balance, any `receivedOn` ≤ T.
   * - MGR: only the go-live case – (a) the check-in statement of a backdated stay (`checkin_backdated_on` set, the rent
   *   period holds the arrival), (b) amount ≤ the unpaid part of its `rent` lines, (c) `receivedOn` ≤ the backdated
   *   check-in day. Otherwise 403 FORBIDDEN_ACTION "owner only" + one access.denied (controller, auditReason).
   */
  async settleOutsideDesk(
    tx: Tx,
    actor: BillingActor,
    id: string,
    raw: unknown,
    ifMatch?: number,
  ): Promise<{ billingPeriod: Record<string, unknown>; payment: Record<string, unknown> }> {
    const body = obj(raw);
    const allowedKeys = ['amountVnd', 'receivedOn', 'reason', 'reference'];
    const extra = Object.keys(body).find((k) => !allowedKeys.includes(k));
    if (extra)
      throw problem('VALIDATION_FAILED', { errors: [{ field: extra, code: 'NOT_ALLOWED' }] });
    const amountRaw = body.amountVnd;
    if (
      amountRaw !== undefined &&
      amountRaw !== null &&
      (!Number.isSafeInteger(amountRaw) || (amountRaw as number) <= 0)
    ) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'amountVnd', code: 'VALIDATION_FAILED' }],
      });
    }
    const receivedOn = body.receivedOn;
    if (!isLocalDate(receivedOn)) {
      throw problem('VALIDATION_FAILED', {
        errors: [
          { field: 'receivedOn', code: receivedOn === undefined ? 'REQUIRED' : 'DATE_INVALID' },
        ],
      });
    }
    const reason = freeText('reason', body.reason, { required: true }) as string;
    let reference: string | null = null;
    if (body.reference !== undefined && body.reference !== null) {
      const r = typeof body.reference === 'string' ? body.reference.trim() : null;
      if (r === null || !OUTSIDE_DESK_REFERENCE.test(r)) {
        throw problem('VALIDATION_FAILED', {
          errors: [{ field: 'reference', code: 'VALIDATION_FAILED' }],
        });
      }
      assertNotCardNumberReference('reference', r.replace(/ /g, '-'));
      // SEC-BE-197-01: the reference ends up in payment.note – the free-text rule (V-09) applies too.
      assertNoCardNumber('reference', r);
      // Only digits (9+, separators aside) is how an account number looks – the field never takes one (§12.2).
      if (/^[0-9]{9,}$/.test(r.replace(/[ ./-]/g, ''))) {
        throw problem('VALIDATION_FAILED', {
          errors: [{ field: 'reference', code: 'NOT_ALLOWED' }],
        });
      }
      reference = r;
    }

    const pc = await this.property.now(tx);
    if (receivedOn > pc.today) {
      throw problem('VALIDATION_FAILED', {
        errors: [{ field: 'receivedOn', code: 'DATE_IN_FUTURE' }],
      });
    }
    const { stay, row } = await this.lockStatement(tx, id);
    if (ifMatch !== undefined) assertVersion(row.version, ifMatch);
    if (row.status !== 'issued' && row.status !== 'partially_paid') {
      throw problem('INVALID_TRANSITION', { extras: { currentState: row.status } });
    }
    const paid = await this.paidVnd(tx, row.id);
    const balance = n(row.total_vnd) - paid;
    if (balance <= 0) {
      throw problem('INVALID_TRANSITION', { extras: { currentState: row.status } });
    }
    const amount = amountRaw === undefined || amountRaw === null ? balance : (amountRaw as number);
    if (amount > balance) {
      throw problem('AMOUNT_OVER_BALANCE', { extras: { balanceVnd: Math.max(0, balance) } });
    }
    if (!actor.roles.includes('owner')) {
      await this.assertManagerGoLiveScope(tx, row, stay, amount, paid, receivedOn, pc.timezone);
    }

    const payment = await this.payments.recordInTx(
      tx,
      actor,
      row.folio_id,
      {
        type: 'charge',
        method: OUTSIDE_DESK_METHOD,
        amountVnd: amount,
        receivedAt: toZonedIso(atLocal(receivedOn, '12:00', pc.timezone), pc.timezone),
        note: reference ? `${reason} | ref ${reference}` : reason,
      },
      {
        reservationId: stay.id,
        reservationCode: stay.code,
        outstandingCapVnd: balance,
        billingPeriodId: row.id,
        source: OUTSIDE_DESK_SOURCE,
      },
    );
    await this.refreshPaid(tx, row.id);
    await this.audit.record(tx, {
      category: 'money',
      action: 'billing_period.settled_outside_desk',
      entityType: 'billing_period',
      entityId: row.id,
      ...(row.code ? { entityCode: row.code } : {}),
      before: { status: row.status, paidVnd: paid },
      after: {
        paymentId: payment.id,
        method: OUTSIDE_DESK_METHOD,
        amountVnd: amount,
        receivedOn,
        balanceVnd: balance - amount,
      },
      reason,
      ...(actor.requestId ? { requestId: actor.requestId } : {}),
    });
    await this.events?.notify(
      tx,
      {
        kind: 'statement_settled_outside_desk',
        roles: ['owner'],
        refType: 'reservation',
        refId: stay.id,
        refCode: row.code ?? stay.code,
      },
      pc.now,
    );
    const next = (await this.row(tx, id)) as BpRow;
    return {
      billingPeriod: await this.view(tx, actor, next, pc),
      payment: {
        id: payment.id,
        method: payment.method,
        amountVnd: payment.amount_vnd,
        status: payment.status,
        reconciliation: payment.reconciliation,
      },
    };
  }

  /**
   * SEC-BE-197-02: a reversed payment on the statement, or a real (non-outside_desk) payment received after the
   * backdated check-in day (property time) – the statement is then the owner's to settle outside Desk.
   */
  private async paymentHistoryBarsManager(
    tx: Tx,
    billingPeriodId: string,
    backdatedOn: LocalDate,
    timezone: string,
  ): Promise<boolean> {
    const { rows } = await tx.query<{ c: string }>(
      `SELECT count(*)::text AS c FROM payment
        WHERE billing_period_id = $1
          AND (status = 'reversed'
               OR (method <> 'outside_desk' AND (received_at AT TIME ZONE $3)::date > $2::date))`,
      [billingPeriodId, backdatedOn, timezone],
    );
    return n(rows[0]?.c ?? null) > 0;
  }

  /** SEC 12-02 (a): the stay was checked in backdated and this statement's rent period holds its arrival. */
  private holdsBackdatedArrival(
    row: BpRow,
    stay: { arrival: LocalDate; checkinBackdatedOn?: LocalDate | null },
  ): boolean {
    if (!stay.checkinBackdatedOn) return false;
    const from = row.rent_period_from ?? row.statement_month;
    const to = row.rent_period_to ?? addDays(addMonths(row.statement_month, 1), -1);
    return stay.arrival >= from && stay.arrival <= to;
  }

  /** SEC FB-R5-SEC-ARC-12-02: the three conditions under which a manager may settle outside Desk. */
  private async assertManagerGoLiveScope(
    tx: Tx,
    row: BpRow,
    stay: LongStay,
    amount: number,
    paid: number,
    receivedOn: LocalDate,
    timezone: string,
  ): Promise<void> {
    const denied = () =>
      problem('FORBIDDEN_ACTION', {
        detail: 'owner only',
        auditReason: OUTSIDE_DESK_OWNER_ONLY,
      });
    const { rows } = await tx.query<{ backdated_on: string | null; arrival: string }>(
      `SELECT checkin_backdated_on::text AS backdated_on, arrival_date::text AS arrival
         FROM reservation WHERE id = $1`,
      [stay.id],
    );
    const r = rows[0];
    if (!r || r.backdated_on === null) throw denied();
    // (a) the statement whose rent period holds the arrival (the check-in statement).
    if (
      !this.holdsBackdatedArrival(row, { arrival: r.arrival, checkinBackdatedOn: r.backdated_on })
    )
      throw denied();
    // SEC-BE-197-02: no reversed payment on the statement, and no real payment taken after the backdated
    // check-in – otherwise a manager could reverse Desk money and re-record it as "outside Desk".
    if (await this.paymentHistoryBarsManager(tx, row.id, r.backdated_on, timezone)) throw denied();
    // (b) only the unpaid part of its rent lines.
    const { rows: rent } = await tx.query<{ s: string | null }>(
      `SELECT sum(amount_vnd)::text AS s FROM billing_period_line
        WHERE billing_period_id = $1 AND active AND kind = 'rent'`,
      [row.id],
    );
    if (amount > n(rent[0]?.s ?? null) - paid) throw denied();
    // (c) received before Desk.
    if (receivedOn > r.backdated_on) throw denied();
  }

  async print(tx: Tx, actor: BillingActor, id: string): Promise<Record<string, unknown>> {
    const row = await this.row(tx, id);
    if (!row) throw problem('NOT_FOUND');
    if (!LIVE_ISSUED.includes(row.status))
      throw problem('INVALID_TRANSITION', { extras: { currentState: row.status } });
    const pc = await this.property.now(tx);
    const statement = await this.view(tx, actor, row, pc);
    const stay = await loadLongStay(tx, row.reservation_id);
    const prop = await tx.query<{
      name: string;
      address: string | null;
      phone_public: string | null;
    }>('SELECT name, address, phone_public FROM property WHERE id = $1', [pc.propertyId]);
    const balance = (statement.totals as { balanceVnd: number }).balanceVnd;
    let vietqr: Record<string, unknown> | null = null;
    if (balance > 0 && row.code) {
      const acc = await receivingAccountInEffect(tx, pc.today, pc.timezone);
      if (acc) {
        const transferContent = normalizeTransferContent(row.code);
        vietqr = {
          payload: buildVietQrPayload({
            bankBin: acc.bankBin,
            accountNo: acc.accountNo,
            amountVnd: balance,
            transferContent,
          }),
          bankShortName: bankNameOf(acc.bankBin) ?? null,
          accountHolder: acc.accountName,
          accountNoMasked: last4Masked(acc.accountNo),
          amountVnd: balance,
          transferContent,
        };
      }
    }
    const who = await tx.query<{ display_name: string }>(
      'SELECT display_name FROM app_user WHERE id = $1',
      [actor.userId],
    );
    const initials = initialsOf(who.rows[0]?.display_name);
    await this.audit.record(tx, {
      category: 'state',
      action: 'billing_period.printed',
      entityType: 'billing_period',
      entityId: row.id,
      ...(row.code ? { entityCode: row.code } : {}),
      after: { status: row.status, balanceVnd: balance },
      ...(actor.requestId ? { requestId: actor.requestId } : {}),
    });
    // SEC BE-190-03: an allowlist of what the paper shows (contract 6.6) – no note, reason, rates, folio ids or
    // actions; a line keeps label, readings, quantity, prices, net / VAT / amount and its month (UXD FE-189-01/02).
    const lines = (statement.lines as Array<Record<string, unknown>>).map((l) => ({
      kind: l.kind,
      labelKey: l.labelKey,
      labelParams: l.labelParams,
      quantity: l.quantity,
      unit: l.unit,
      unitPriceNetVnd: l.unitPriceNetVnd,
      vatRatePct: l.vatRatePct,
      netVnd: l.netVnd,
      vatVnd: l.vatVnd,
      amountVnd: l.amountVnd,
      roomNo: l.roomNo,
      meter: l.meter,
      serviceDate: l.serviceDate,
      periodMonth: l.periodMonth,
    }));
    const t = statement.totals as Record<string, number>;
    // UXD FE-189-11: the guest-facing room name (The Mist…) next to each room number; null when none is set.
    const roomNos = statement.roomNos as string[];
    const named = await tx.query<{ room_no: string; name: string | null }>(
      'SELECT room_no, name FROM room WHERE room_no = ANY($1::text[])',
      [roomNos],
    );
    const roomNames = roomNos.map((no) => named.rows.find((r) => r.room_no === no)?.name ?? null);
    return {
      id: statement.id,
      code: statement.code,
      status: statement.status,
      kind: statement.kind,
      month: statement.month,
      roomNos,
      roomNames,
      rentPeriod: statement.rentPeriod,
      utilityPeriod: statement.utilityPeriod,
      servicePeriod: statement.servicePeriod,
      dueDate: statement.dueDate,
      issuedAt: statement.issuedAt,
      lines,
      totals: {
        netVnd: t.netVnd,
        vatVnd: t.vatVnd,
        roundingVnd: t.roundingVnd,
        totalVnd: t.totalVnd,
        paidVnd: t.paidVnd,
        balanceVnd: t.balanceVnd,
      },
      property: {
        displayName: prop.rows[0]?.name ?? null,
        addressLine: prop.rows[0]?.address ?? null,
        hotline: prop.rows[0]?.phone_public ?? null,
        email: null,
      },
      guest: { fullName: stay.guestFullName },
      vietqr,
      printedAt: pc.iso(pc.now),
      printedByInitials: initials || null,
    };
  }
}

/**
 * BUG-R5-013: the utilities / services period shown and stored on a statement – null when it ends before the arrival
 * (the check-in month bills no earlier month; FE then prints the rent period only). The computation keeps the period.
 */
function shownPeriod(p: Period, arrival: LocalDate): Period | null {
  return p.to < arrival ? null : p;
}
