/**
 * FB-INV-012 meter readings (contract 2.1, 5; DOM BR-LS-10…12; INV 17/11 bổ sung).
 *
 * INV 17/11 (deviation from contract 2.1 "chỉ số đầu kỳ không lưu, không cho gõ"): the OPENING reading of every
 * period is typed by the desk – `checkin`, `period_start` (period_month = the month it opens) or `room_change_in`.
 * The previous closing of the same room is only a reference (`previous_reading_id`); opening − previous closing is the
 * vacancy gap (viewings, housekeeping water) stored on the opening (`electricity_gap`, `water_gap`), never billed.
 * An opening below the previous closing (no exception) is a WARNING (ARC BE-190-01): 422
 * OPENING_BELOW_PREVIOUS_CLOSING, saved by any desk role when sent again with `acknowledgeLowerThanPrevious: true`
 * (negative gap kept, draft warning, issue must acknowledge it). A closing below its opening stays blocked (422
 * METER_LOWER_THAN_PREVIOUS, FDL+ exception – BR-LS-12). Billed usage = closing − opening of the same period.
 * A period reading after its window (ARC BE-190-03): FDL+ with `lateReason`, up to `readingWindow.lateMaxDays`.
 *
 * A wrong reading is voided and typed again (never rewritten). Exceptions (meter replaced / rollover) and a waived
 * photo need FDL+ (A89 simplified, contract mục 4) – FD gets 403 FORBIDDEN_ACTION.
 */
import { Inject, Injectable } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import type { Tx } from '../../../db/database';
import { problem } from '../../../shared/problem';
import { type LocalDate, addDays } from '../../../shared/time';
import { AuditService } from '../../audit/public/audit.service';
import { AttachmentService } from '../../files/public/attachment.service';
import { ParameterService } from '../../platform/public/parameter.service';
import { PropertyContextService } from '../../platform/public/property-context';
import { primaryRole } from '../../payments/public/payment.service';
import {
  type Meter,
  type MeterException,
  STATEMENT_RULES_KEY,
  addMonths,
  lateMaxDaysOf,
  exceptionIssue,
  fromScaled,
  monthEnd,
  monthOf,
  parseMonth,
  readRules,
  truncScaled,
  usageScaled,
} from './statement-math';
import {
  type BillingActor,
  UUID,
  freeText,
  isFdlPlus,
  isLocalDate,
  isUniqueViolation,
  loadLongStay,
  obj,
} from './stay';

export const OPENING_KINDS = ['checkin', 'period_start', 'room_change_in'] as const;
export const CLOSING_KINDS = ['period_end', 'room_change_out', 'checkout'] as const;
const KINDS = [...OPENING_KINDS, ...CLOSING_KINDS] as const;
type Kind = (typeof KINDS)[number];
const isOpening = (k: string): boolean => (OPENING_KINDS as readonly string[]).includes(k);

export interface ReadingRow {
  id: string;
  reservation_id: string;
  room_id: string;
  room_no: string;
  kind: Kind;
  period_month: string | null;
  read_on: string;
  electricity_value: string;
  water_value: string;
  electricity_exception: MeterException | null;
  water_exception: MeterException | null;
  previous_reading_id: string | null;
  electricity_gap: string | null;
  water_gap: string | null;
  photo_attachment_id: string | null;
  photo_waived_by: string | null;
  exception_approved_by: string | null;
  note: string | null;
  late_reason: string | null;
  read_by_name: string | null;
  on_issued_statement: boolean;
  read_by_role: string;
  voided_at: Date | null;
  void_reason: string | null;
  created_at: Date;
  version: number;
}

const READING_COLUMNS = `m.id, m.reservation_id, m.room_id, rm.room_no, m.kind, m.period_month::text, m.read_on::text,
  m.electricity_value::text, m.water_value::text, m.electricity_exception, m.water_exception, m.previous_reading_id,
  m.electricity_gap::text, m.water_gap::text, m.photo_attachment_id, m.photo_waived_by, m.exception_approved_by, m.note,
  m.late_reason, (SELECT u.display_name FROM app_user u WHERE u.id = m.read_by) AS read_by_name,
  EXISTS (SELECT 1 FROM billing_period_line l JOIN billing_period b ON b.id = l.billing_period_id
           WHERE l.active AND b.status IN ('issued', 'partially_paid', 'paid')
             AND (l.meter_from_reading_id = m.id OR l.meter_to_reading_id = m.id)) AS on_issued_statement,
  m.read_by_role, m.voided_at, m.void_reason, m.created_at, m.version`;

/** Initials of a staff display name (as `printedByInitials`): never the full name (ARC BE-190-04). */
export function initialsOf(name: string | null | undefined): string | null {
  const out = (name ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toLocaleUpperCase('vi'))
    .join('')
    .slice(0, 4);
  return out || null;
}

/** Stored value → scaled integer (electricity kWh, water tenths of m³). */
export function scaledOf(
  meter: Meter,
  row: Pick<ReadingRow, 'electricity_value' | 'water_value'>,
): number {
  return meter === 'electricity'
    ? Math.round(Number(row.electricity_value))
    : Math.round(Number(row.water_value) * 10);
}
export const exceptionOf = (meter: Meter, row: ReadingRow): MeterException | null =>
  meter === 'electricity' ? row.electricity_exception : row.water_exception;

const METERS: readonly Meter[] = ['electricity', 'water'];

/**
 * ARC BE-190-12: the real date a check-in / room-change reading belongs to. `checkin` – the arrival, only for the
 * room held on arrival; `room_change_in` – the day the stay moved into the room; `room_change_out` – the day it moved
 * out (the next segment is another room). With several moves the latest one on or before `readOn` (else the first).
 */
export function eventDateOf(
  segments: ReadonlyArray<{ roomId: string; from: LocalDate; to: LocalDate }>,
  arrival: LocalDate,
  roomId: string,
  kind: string,
  readOn: LocalDate,
): LocalDate | null {
  if (kind === 'checkin') return segments[0]?.roomId === roomId ? arrival : null;
  const dates: LocalDate[] = [];
  for (let i = 1; i < segments.length; i++) {
    const prev = segments[i - 1] as { roomId: string };
    const cur = segments[i] as { roomId: string; from: LocalDate };
    if (prev.roomId === cur.roomId) continue;
    if ((kind === 'room_change_in' ? cur.roomId : prev.roomId) === roomId) dates.push(cur.from);
  }
  if (dates.length === 0) return null;
  return [...dates].reverse().find((d) => d <= readOn) ?? (dates[0] as LocalDate);
}

/**
 * Reading window of the closing of month P (BR-LS-10): [last day of P − daysBeforeMonthEnd, last day + daysAfter].
 * The opening of P (`period_start`) is read in the same window as the closing of P−1.
 */
export function windowOf(
  kind: 'period_start' | 'period_end',
  periodMonth: LocalDate,
  rules: { readingWindow: { daysBeforeMonthEnd: number; daysAfter: number } },
): { from: LocalDate; to: LocalDate } {
  const closes = kind === 'period_end' ? periodMonth : addMonths(periodMonth, -1);
  const last = monthEnd(closes);
  return {
    from: addDays(last, -rules.readingWindow.daysBeforeMonthEnd),
    to: addDays(last, rules.readingWindow.daysAfter),
  };
}

@Injectable()
export class MeterReadingsService {
  constructor(
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(AttachmentService) private readonly attachments: AttachmentService,
    @Inject(ParameterService) private readonly params: ParameterService,
    @Inject(PropertyContextService) private readonly property: PropertyContextService,
  ) {}

  async readings(tx: Tx, reservationId: string): Promise<ReadingRow[]> {
    const { rows } = await tx.query<ReadingRow>(
      `SELECT ${READING_COLUMNS} FROM meter_reading m JOIN room rm ON rm.id = m.room_id
        WHERE m.reservation_id = $1 ORDER BY m.read_on, m.created_at, m.id`,
      [reservationId],
    );
    return rows;
  }

  /** Latest live closing of a room before an opening (any booking of the room – the vacancy gap spans guests). */
  private async previousClosing(
    tx: Tx,
    input: {
      reservationId: string;
      roomId: string;
      kind: Kind;
      periodMonth: LocalDate | null;
      readOn: LocalDate;
    },
  ): Promise<ReadingRow | null> {
    if (input.kind === 'period_start' && input.periodMonth) {
      // The closing of the previous month of the same booking, when typed (it may be read the same day or later).
      const prev = addMonths(input.periodMonth, -1);
      const { rows } = await tx.query<ReadingRow>(
        `SELECT ${READING_COLUMNS} FROM meter_reading m JOIN room rm ON rm.id = m.room_id
          WHERE m.reservation_id = $1 AND m.room_id = $2 AND m.kind = 'period_end' AND m.period_month = $3
            AND m.voided_at IS NULL`,
        [input.reservationId, input.roomId, prev],
      );
      if (rows[0]) return rows[0];
    }
    const { rows } = await tx.query<ReadingRow>(
      `SELECT ${READING_COLUMNS} FROM meter_reading m JOIN room rm ON rm.id = m.room_id
        WHERE m.room_id = $1 AND m.kind IN ('period_end', 'room_change_out', 'checkout') AND m.voided_at IS NULL
          AND m.read_on <= $2
        ORDER BY m.read_on DESC, m.created_at DESC LIMIT 1`,
      [input.roomId, input.readOn],
    );
    return rows[0] ?? null;
  }

  /**
   * The opening a closing is measured from: the latest live opening of the same booking and room, read on or before
   * the closing – for `period_end` of P only openings of P (`period_start` P, or `checkin` / `room_change_in` inside P).
   */
  async openingFor(
    tx: Tx,
    closing: {
      reservationId: string;
      roomId: string;
      kind: string;
      periodMonth: LocalDate | null;
      readOn: LocalDate;
    },
  ): Promise<ReadingRow | null> {
    const period =
      closing.kind === 'period_end' && closing.periodMonth ? closing.periodMonth : null;
    const { rows } = await tx.query<ReadingRow>(
      `SELECT ${READING_COLUMNS} FROM meter_reading m JOIN room rm ON rm.id = m.room_id
        WHERE m.reservation_id = $1 AND m.room_id = $2 AND m.voided_at IS NULL AND m.read_on <= $3
          AND ($4::date IS NULL
               OR (m.kind = 'period_start' AND m.period_month = $4)
               OR (m.kind IN ('checkin', 'room_change_in') AND m.read_on >= $4 AND m.read_on <= $5))
          AND m.kind IN ('checkin', 'period_start', 'room_change_in')
        ORDER BY m.read_on DESC, m.created_at DESC LIMIT 1`,
      [
        closing.reservationId,
        closing.roomId,
        closing.readOn,
        period,
        period ? monthEnd(period) : null,
      ],
    );
    return rows[0] ?? null;
  }

  async list(tx: Tx, reservationId: string): Promise<{ items: unknown[] }> {
    const stay = await loadLongStay(tx, reservationId);
    const rows = await this.readings(tx, stay.id);
    const byId = new Map(rows.map((r) => [r.id, r]));
    const items: unknown[] = [];
    for (const r of rows) {
      let reference: ReadingRow | null = null;
      if (r.voided_at === null) {
        reference = isOpening(r.kind)
          ? await this.previousClosing(tx, {
              reservationId: r.reservation_id,
              roomId: r.room_id,
              kind: r.kind,
              periodMonth: r.period_month,
              readOn: r.read_on,
            })
          : await this.openingFor(tx, {
              reservationId: r.reservation_id,
              roomId: r.room_id,
              kind: r.kind,
              periodMonth: r.period_month,
              readOn: r.read_on,
            });
      } else if (r.previous_reading_id) {
        reference = byId.get(r.previous_reading_id) ?? null;
      }
      items.push(this.view(r, reference));
    }
    return { items };
  }

  view(r: ReadingRow, reference: ReadingRow | null): Record<string, unknown> {
    const opening = isOpening(r.kind);
    const delta = (m: Meter) =>
      reference
        ? fromScaled(m, usageScaled(m, scaledOf(m, reference), scaledOf(m, r), exceptionOf(m, r)))
        : null;
    return {
      id: r.id,
      reservationId: r.reservation_id,
      roomId: r.room_id,
      roomNo: r.room_no,
      kind: r.kind,
      periodMonth: r.period_month ? r.period_month.slice(0, 7) : null,
      readOn: r.read_on,
      electricity: {
        value: fromScaled('electricity', scaledOf('electricity', r)),
        exception: r.electricity_exception,
      },
      water: { value: fromScaled('water', scaledOf('water', r)), exception: r.water_exception },
      // INV 17/11: the previous closing of the room is a reference for an opening; the gap is not billed.
      previousClosing:
        opening && reference
          ? {
              readingId: reference.id,
              readOn: reference.read_on,
              electricity: fromScaled('electricity', scaledOf('electricity', reference)),
              water: fromScaled('water', scaledOf('water', reference)),
            }
          : null,
      gap:
        opening && reference ? { electricity: delta('electricity'), water: delta('water') } : null,
      // A closing: usage since its opening (the billed figure of the period).
      consumption:
        !opening && reference
          ? {
              fromReadingId: reference.id,
              electricity: delta('electricity'),
              water: delta('water'),
            }
          : null,
      photoAttachmentId: r.photo_attachment_id,
      photoWaived: r.photo_waived_by !== null,
      exceptionApproved: r.exception_approved_by !== null,
      note: r.note,
      late: r.late_reason !== null,
      lateReason: r.late_reason,
      readByRole: r.read_by_role,
      readByInitials: initialsOf(r.read_by_name),
      onIssuedStatement: r.on_issued_statement,
      voided: r.voided_at !== null,
      voidedAt: r.voided_at ? r.voided_at.toISOString() : null,
      voidReason: r.void_reason,
      createdAt: r.created_at.toISOString(),
      version: r.version,
    };
  }

  async record(
    tx: Tx,
    actor: BillingActor,
    reservationId: string,
    raw: unknown,
  ): Promise<Record<string, unknown>> {
    const body = obj(raw);
    const stay = await loadLongStay(tx, reservationId, { lock: true });
    const errors: Array<{ field: string; code: string }> = [];
    const kind = body.kind;
    if (typeof kind !== 'string' || !(KINDS as readonly string[]).includes(kind)) {
      errors.push({ field: 'kind', code: kind === undefined ? 'REQUIRED' : 'NOT_IN_LIST' });
    }
    const roomId = body.roomId;
    const segment =
      typeof roomId === 'string' && UUID.test(roomId)
        ? stay.segments.find((s) => s.roomId === roomId)
        : undefined;
    if (!segment)
      errors.push({ field: 'roomId', code: roomId === undefined ? 'REQUIRED' : 'NOT_IN_LIST' });
    let periodMonth: LocalDate | null = null;
    if (kind === 'period_start' || kind === 'period_end') {
      periodMonth = parseMonth(body.periodMonth);
      if (!periodMonth) {
        errors.push({
          field: 'periodMonth',
          code: body.periodMonth === undefined ? 'REQUIRED' : 'DATE_INVALID',
        });
      }
    } else if (body.periodMonth !== undefined && body.periodMonth !== null) {
      errors.push({ field: 'periodMonth', code: 'NOT_ALLOWED' });
    }
    const readOn = body.readOn;
    if (!isLocalDate(readOn))
      errors.push({ field: 'readOn', code: readOn === undefined ? 'REQUIRED' : 'DATE_INVALID' });
    const values: Partial<Record<Meter, { scaled: number; exception: MeterException | null }>> = {};
    for (const m of METERS) {
      const part = obj(body[m]);
      const v = part.value;
      if (typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v >= 1e9) {
        errors.push({
          field: `${m}.value`,
          code: v === undefined ? 'REQUIRED' : 'VALIDATION_FAILED',
        });
        continue;
      }
      const issue = exceptionIssue(part.exception, m);
      if (issue) {
        errors.push(issue);
        continue;
      }
      values[m] = {
        scaled: truncScaled(m, v),
        exception: (part.exception ?? null) as MeterException | null,
      };
    }
    const photoWaived = body.photoWaived === true;
    const photoId = body.photoAttachmentId;
    if (!photoWaived && (typeof photoId !== 'string' || photoId === '')) {
      errors.push({ field: 'photoAttachmentId', code: 'REQUIRED' });
    }
    if (errors.length) throw problem('VALIDATION_FAILED', { errors });
    const note = freeText('note', body.note, { required: photoWaived });
    const acknowledgeLower = body.acknowledgeLowerThanPrevious === true;
    const k = kind as Kind;
    const day = readOn as LocalDate;
    const room = segment as NonNullable<typeof segment>;
    const exceptionGiven = METERS.some((m) => values[m]?.exception);
    const fdl = isFdlPlus(actor.roles);
    // A89 simplified (contract mục 4): FD is told to call the front desk lead.
    if ((exceptionGiven || photoWaived) && !fdl) throw problem('FORBIDDEN_ACTION');

    // Status: an in-house stay; after check-out only its closing readings (final statement / checkout bill).
    if (stay.status !== 'in_house' && !(stay.status === 'checked_out' && !isOpening(k))) {
      throw problem('INVALID_TRANSITION', { extras: { currentState: stay.status } });
    }
    const pc = await this.property.now(tx);
    if (day > pc.today || day < stay.arrival || day > stay.departure) {
      throw problem('VALIDATION_FAILED', { errors: [{ field: 'readOn', code: 'DATE_INVALID' }] });
    }
    const rules = readRules(await this.params.get(tx, STATEMENT_RULES_KEY, pc.today));
    let lateReason: string | null = null;
    // Window gate shared by every kind (ARC BE-190-03/12): `readOn` in [from, to] and typed by `to` (business day of
    // the property) – anyone; typed after `to` up to lateMaxDays – only FDL+ with a reason; otherwise 422
    // READING_OUT_OF_WINDOW. BUG-R5-008: lateness is judged on the entry day, so a back-dated `readOn` is still late.
    const gate = (w: { from: LocalDate; to: LocalDate }): string | null => {
      const lateUntil = addDays(w.to, lateMaxDaysOf(rules));
      const entered = pc.today;
      if (day >= w.from && day <= w.to && entered <= w.to) return null;
      const lateOk = day >= w.from && day <= lateUntil && entered > w.to && entered <= lateUntil;
      const out = {
        extras: {
          windowFrom: w.from,
          windowTo: w.to,
          ...(lateOk ? { lateUntil, lateNeedsRole: 'front_desk_lead' } : {}),
        },
      };
      if (!lateOk || !fdl) throw problem('READING_OUT_OF_WINDOW', out);
      const reason = freeText('lateReason', body.lateReason);
      if (reason === null) throw problem('READING_OUT_OF_WINDOW', out);
      return reason;
    };
    let anchor: LocalDate | null = null;
    if (periodMonth) {
      lateReason = gate(windowOf(k as 'period_start' | 'period_end', periodMonth, rules));
      if (k === 'period_start' && periodMonth <= monthOf(stay.arrival)) {
        // The opening of the arrival month is the check-in reading.
        throw problem('VALIDATION_FAILED', {
          errors: [{ field: 'periodMonth', code: 'NOT_ALLOWED' }],
        });
      }
    } else if (k !== 'checkout') {
      // ARC BE-190-12: check-in / room-change readings belong to the real check-in or move date.
      anchor = eventDateOf(stay.segments, stay.arrival, room.roomId, k, day);
      if (anchor === null) {
        throw problem('VALIDATION_FAILED', { errors: [{ field: 'kind', code: 'NOT_ALLOWED' }] });
      }
      lateReason = gate({ from: anchor, to: addDays(anchor, rules.readingWindow.daysAfter) });
    }
    if (photoId !== undefined && photoId !== null && photoId !== '') {
      await this.attachments.assertUsable(tx, actor, String(photoId), 'meter', {
        reservationId: stay.id,
        field: 'photoAttachmentId',
      });
    }

    // Reference reading + "lower than previous" check (BR-LS-12; INV 17/11 for openings).
    const input = {
      reservationId: stay.id,
      roomId: room.roomId,
      kind: k,
      periodMonth,
      readOn: day,
    };
    const reference = isOpening(k)
      ? await this.previousClosing(tx, input)
      : await this.openingFor(tx, input);
    const gap: Partial<Record<Meter, number>> = {};
    let acknowledgedLower = false;
    if (reference) {
      for (const m of METERS) {
        const v = values[m] as { scaled: number; exception: MeterException | null };
        const prev = scaledOf(m, reference);
        if (!v.exception && v.scaled < prev && isOpening(k)) {
          // ARC BE-190-01: a warning – the gap is not billed; a typo is caught again at issue (draft warning).
          if (!acknowledgeLower) {
            throw problem('OPENING_BELOW_PREVIOUS_CLOSING', {
              extras: {
                meter: m,
                previousValue: fromScaled(m, prev),
                previousReadingId: reference.id,
                previousKind: reference.kind,
              },
            });
          }
          acknowledgedLower = true;
        } else if (!v.exception && v.scaled < prev) {
          throw problem('METER_LOWER_THAN_PREVIOUS', {
            extras: {
              meter: m,
              previousValue: fromScaled(m, prev),
              previousReadingId: reference.id,
              previousKind: reference.kind,
            },
          });
        }
        if (isOpening(k)) gap[m] = usageScaled(m, prev, v.scaled, v.exception);
      }
    }
    const dup = await tx.query(
      `SELECT 1 FROM meter_reading WHERE reservation_id = $1 AND room_id = $2 AND kind = $3
          AND COALESCE(period_month, read_on) = COALESCE($4::date, $5::date) AND voided_at IS NULL`,
      [stay.id, room.roomId, k, periodMonth, day],
    );
    if (dup.rowCount) throw problem('READING_EXISTS');
    if (anchor !== null) {
      // One live check-in reading per stay and room; one live room-change reading per move.
      const again = await tx.query(
        `SELECT 1 FROM meter_reading WHERE reservation_id = $1 AND room_id = $2 AND kind = $3
            AND voided_at IS NULL AND ($3 = 'checkin' OR read_on BETWEEN $4::date AND $5::date)`,
        [
          stay.id,
          room.roomId,
          k,
          anchor,
          addDays(anchor, rules.readingWindow.daysAfter + lateMaxDaysOf(rules)),
        ],
      );
      if (again.rowCount) throw problem('READING_EXISTS');
    }

    const id = uuidv7();
    const e = values.electricity as { scaled: number; exception: MeterException | null };
    const w = values.water as { scaled: number; exception: MeterException | null };
    try {
      await tx.query(
        `INSERT INTO meter_reading (id, organization_id, property_id, reservation_id, room_id, kind, period_month,
           read_on, electricity_value, water_value, electricity_exception, water_exception, previous_reading_id,
           electricity_gap, water_gap, photo_attachment_id, photo_waived_by, exception_approved_by, note, read_by,
           read_by_role, created_at, created_by, updated_at, late_reason, late_approved_by)
         SELECT $1, p.organization_id, p.id, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
                $18, $19, $20, $18, $20, $22, $23
           FROM property p WHERE p.id = $21`,
        [
          id,
          stay.id,
          room.roomId,
          k,
          periodMonth,
          day,
          fromScaled('electricity', e.scaled),
          fromScaled('water', w.scaled),
          e.exception ? JSON.stringify(e.exception) : null,
          w.exception ? JSON.stringify(w.exception) : null,
          reference?.id ?? null,
          gap.electricity === undefined ? null : fromScaled('electricity', gap.electricity),
          gap.water === undefined ? null : fromScaled('water', gap.water),
          photoId ? String(photoId) : null,
          photoWaived ? actor.userId : null,
          exceptionGiven ? actor.userId : null,
          note,
          actor.userId,
          primaryRole(actor.roles) ?? 'front_desk',
          pc.now,
          pc.propertyId,
          lateReason,
          lateReason ? actor.userId : null,
        ],
      );
    } catch (err) {
      if (
        isUniqueViolation(err, 'meter_reading_live_key') ||
        isUniqueViolation(err, 'meter_reading_checkin_live_key')
      )
        throw problem('READING_EXISTS');
      throw err;
    }
    if (photoId) await this.attachments.bindTo(tx, String(photoId), { type: 'meter_reading', id });
    const after = {
      reservationId: stay.id,
      roomId: room.roomId,
      kind: k,
      periodMonth,
      readOn: day,
      electricity: fromScaled('electricity', e.scaled),
      water: fromScaled('water', w.scaled),
      electricityGap:
        gap.electricity === undefined ? null : fromScaled('electricity', gap.electricity),
      waterGap: gap.water === undefined ? null : fromScaled('water', gap.water),
      photoWaived,
      acknowledgedLower,
      late: lateReason !== null,
    };
    await this.audit.record(tx, {
      category: 'state',
      action: 'meter_reading.recorded',
      entityType: 'meter_reading',
      entityId: id,
      entityCode: stay.code,
      after,
      ...(actor.requestId ? { requestId: actor.requestId } : {}),
    });
    if (lateReason) {
      await this.audit.record(tx, {
        category: 'state',
        action: 'meter_reading.late',
        entityType: 'meter_reading',
        entityId: id,
        entityCode: stay.code,
        after,
        reason: lateReason,
        ...(actor.requestId ? { requestId: actor.requestId } : {}),
      });
    }
    if (exceptionGiven) {
      await this.audit.record(tx, {
        category: 'state',
        action: 'meter_reading.exception',
        entityType: 'meter_reading',
        entityId: id,
        entityCode: stay.code,
        after: {
          ...after,
          electricityException: e.exception?.type ?? null,
          waterException: w.exception?.type ?? null,
        },
        ...(actor.requestId ? { requestId: actor.requestId } : {}),
      });
    }
    const row = (await this.readings(tx, stay.id)).find((r) => r.id === id) as ReadingRow;
    return this.view(row, reference);
  }

  async void(
    tx: Tx,
    actor: BillingActor,
    readingId: string,
    raw: unknown,
  ): Promise<Record<string, unknown>> {
    if (!UUID.test(readingId)) throw problem('NOT_FOUND');
    const reason = freeText('reason', obj(raw).reason, { required: true });
    const { rows } = await tx.query<{ id: string; reservation_id: string; voided_at: Date | null }>(
      'SELECT id, reservation_id, voided_at FROM meter_reading WHERE id = $1',
      [readingId],
    );
    const r0 = rows[0];
    if (!r0) throw problem('NOT_FOUND');
    const stay = await loadLongStay(tx, r0.reservation_id, { lock: true });
    const locked = await tx.query<{ voided_at: Date | null }>(
      'SELECT voided_at FROM meter_reading WHERE id = $1 FOR UPDATE',
      [readingId],
    );
    if (locked.rows[0]?.voided_at)
      throw problem('INVALID_TRANSITION', { extras: { currentState: 'voided' } });
    const used = await tx.query<{ code: string | null }>(
      `SELECT b.code FROM billing_period_line l JOIN billing_period b ON b.id = l.billing_period_id
        WHERE l.active AND b.status IN ('issued', 'partially_paid', 'paid')
          AND (l.meter_from_reading_id = $1 OR l.meter_to_reading_id = $1) LIMIT 1`,
      [readingId],
    );
    if (used.rows[0]) {
      throw problem('READING_ON_ISSUED_STATEMENT', {
        extras: { statementCode: used.rows[0].code },
      });
    }
    const pc = await this.property.now(tx);
    await tx.query(
      `UPDATE meter_reading SET voided_at = $2, voided_by = $3, void_reason = $4, updated_at = $2, version = version + 1
        WHERE id = $1`,
      [readingId, pc.now, actor.userId, reason],
    );
    await this.audit.record(tx, {
      category: 'state',
      action: 'meter_reading.voided',
      entityType: 'meter_reading',
      entityId: readingId,
      entityCode: stay.code,
      before: { voided: false },
      after: { voided: true },
      reason: reason as string,
      ...(actor.requestId ? { requestId: actor.requestId } : {}),
    });
    const row = (await this.readings(tx, stay.id)).find((r) => r.id === readingId) as ReadingRow;
    const ref = row.previous_reading_id
      ? ((await this.readings(tx, stay.id)).find((r) => r.id === row.previous_reading_id) ?? null)
      : null;
    return this.view(row, ref);
  }
}
