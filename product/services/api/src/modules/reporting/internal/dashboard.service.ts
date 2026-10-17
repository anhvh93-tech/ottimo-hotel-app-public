/**
 * EP01 reads of the reporting module (BE-D Sprint 4): getTonightKpi (US-010) and getArrivalsDepartures
 * (US-011, US-031 / S4-31 "khách trả phòng hôm nay"). Everything is computed at read time in the caller's
 * read-only transaction; other zones are reached through their public API only:
 * - balance: FolioService.balance (folio – same server-side number as getFolio, A-34);
 * - declaration status: ReservationHooks.registrationSummary (registration module provides it);
 * - departure reminder state: frontdesk/public stay-rules (BR-425 marks, REMINDER_ORDER).
 *
 * getArrivalsDepartures (EP01 2.1–2.4, OpenAPI 0.3.7 B-20):
 * - `date` absent = business date (BR-010: 01:30 on 21/10 is still 20/10 – US-011 AC3); a date outside
 *   business date ± 7 → 422 VALUE_OUT_OF_RANGE (`field` = date); a malformed date → DATE_INVALID;
 * - arrivals: not checked in first, unassigned (OTA conflict lane) first, then ETA (no ETA = standard
 *   check-in time) ascending; `allowedActions` = check_in when doable now (B9 needs a trusted device);
 * - departures: still in house first; a room with a guest arriving the same day first (US-031 AC2); then the
 *   BR-425 state (overdue > call_needed > reminded_waiting > replied); `allowedActions` = check_out;
 * - holdsArrivingToday: hold expiry ascending, never an action (SM-01: a hold cannot check in).
 */
import { Inject, Injectable } from '@nestjs/common';
import type { Tx } from '../../../db/database';
import { problem } from '../../../shared/problem';
import { type LocalDate, type LocalTime, addDays, localDate } from '../../../shared/time';
import { FolioService } from '../../folio/public/folio.service';
import {
  type CheckoutReminders,
  type DepartureReminderState,
  REMINDER_ORDER,
  businessMinutes,
  departureReminderState,
} from '../../frontdesk/public/stay-rules';
import { ParameterService } from '../../platform/public/parameter.service';
import { type PropertyNow, PropertyContextService } from '../../platform/public/property-context';
import { nightsOf } from '../../reservations/public/pricing';
import { ReservationHooks } from '../../reservations/public/reservation-hooks';
import { type RowAction, checkInAction, checkOutAction } from './stay-actions';
import {
  type StayListRow,
  arrivalRows,
  departureRows,
  holdRows,
  repliedBookings,
  roomsWithArrival,
} from './stay-lists';
import { type TonightKpi, tonightKpi } from './tonight-kpi';

/** EP01 2.4 / OpenAPI B-20: the list can look this many days around the business date. */
export const DATE_WINDOW_DAYS = 7;

export interface SummaryRow extends Record<string, unknown> {
  id: string;
  code: string;
  status: string;
}

function parseDate(raw: string | undefined, today: LocalDate): LocalDate {
  if (raw === undefined || raw === '') return today;
  const ok =
    /^\d{4}-\d{2}-\d{2}$/.test(raw) &&
    !Number.isNaN(Date.parse(`${raw}T00:00:00Z`)) &&
    addDays(raw, 0) === raw;
  if (!ok) {
    throw problem('VALIDATION_FAILED', { errors: [{ field: 'date', code: 'DATE_INVALID' }] });
  }
  const diff = nightsOf(today, raw);
  if (Math.abs(diff) > DATE_WINDOW_DAYS) {
    throw problem('VALIDATION_FAILED', {
      errors: [{ field: 'date', code: 'VALUE_OUT_OF_RANGE' }],
      extras: { min: addDays(today, -DATE_WINDOW_DAYS), max: addDays(today, DATE_WINDOW_DAYS) },
    });
  }
  return raw;
}

@Injectable()
export class DashboardService {
  constructor(
    @Inject(PropertyContextService) private readonly property: PropertyContextService,
    @Inject(ParameterService) private readonly params: ParameterService,
    @Inject(FolioService) private readonly folios: FolioService,
    @Inject(ReservationHooks) private readonly hooks: ReservationHooks,
  ) {}

  async tonight(tx: Tx): Promise<TonightKpi> {
    const p = await this.property.now(tx);
    return tonightKpi(tx, p.today);
  }

  async arrivalsDepartures(tx: Tx, roles: readonly string[], rawDate: string | undefined) {
    const p = await this.property.now(tx);
    const date = parseDate(rawDate, p.today);
    const checkinTime = await this.params.get<LocalTime>(tx, 'checkin_time', p.today);
    const rollover = await this.params.get<LocalTime>(tx, 'business_day_rollover', p.today);
    const arrivals = await arrivalRows(tx, date);
    const departures = await departureRows(tx, date);
    const holds = await holdRows(tx, date);

    const arrivalDtos: SummaryRow[] = [];
    for (const r of arrivals) {
      arrivalDtos.push({
        ...(await this.summary(tx, r, p)),
        allowedActions: checkInAction(roles, {
          status: r.status,
          conflictState: r.conflict_state,
          capacityConflict: r.capacity_conflict,
          arrivalDate: r.arrival_date,
          today: p.today,
        }),
      });
    }
    const arrivalOrder = (r: StayListRow) => [
      r.status === 'confirmed' ? 0 : 1,
      r.room_no === null || r.conflict_state === 'open' ? 0 : 1,
      businessMinutes(r.eta_time ?? checkinTime, rollover),
      r.code,
    ];
    const sortedArrivals = sortBy(arrivals, arrivalDtos, arrivalOrder);

    const departureDtos = await this.departures(tx, roles, date, departures, p);
    const holdDtos: SummaryRow[] = [];
    for (const r of holds) holdDtos.push(await this.summary(tx, r, p));
    return {
      date,
      arrivals: sortedArrivals,
      departures: departureDtos,
      holdsArrivingToday: holdDtos,
    };
  }

  private async departures(
    tx: Tx,
    roles: readonly string[],
    date: LocalDate,
    rows: StayListRow[],
    p: PropertyNow,
  ): Promise<SummaryRow[]> {
    if (rows.length === 0) return [];
    const reminders = await this.params.get<CheckoutReminders>(tx, 'checkout_reminders', p.today);
    const rollover = await this.params.get<LocalTime>(tx, 'business_day_rollover', p.today);
    const replied = await repliedBookings(
      tx,
      rows.map((r) => r.id),
    );
    const arrivingRooms = await roomsWithArrival(
      tx,
      date,
      rows.flatMap((r) => (r.room_id ? [r.room_id] : [])),
    );
    const nowTime = p.iso(p.now).slice(11, 16);
    const calendarDate = localDate(p.now, p.timezone);
    const out: Array<{
      row: StayListRow;
      dto: SummaryRow;
      sameDay: boolean;
      state: DepartureReminderState;
    }> = [];
    for (const r of rows) {
      const sameDay = !!(
        r.room_id && (arrivingRooms.get(r.room_id) ?? []).some((id) => id !== r.id)
      );
      const hasReply = replied.has(r.id) || r.agreed_checkout_time !== null;
      const state = reminderState({
        status: r.status,
        departure: r.effective_departure,
        today: p.today,
        replied: hasReply,
        sameDayArrival: sameDay,
        nowTime,
        rollover,
        reminders,
      });
      out.push({
        row: r,
        sameDay,
        state,
        dto: {
          ...(await this.summary(tx, r, p)),
          reminderState: state,
          hasArrivalSameRoomToday: sameDay,
          allowedActions: checkOutAction(roles, {
            status: r.status,
            departureDate: r.effective_departure,
            today: p.today,
            calendarDate,
          }) as RowAction[],
        },
      });
    }
    out.sort(
      (a, b) =>
        Number(a.row.status === 'checked_out') - Number(b.row.status === 'checked_out') ||
        Number(b.sameDay) - Number(a.sameDay) ||
        REMINDER_ORDER[a.state] - REMINDER_ORDER[b.state] ||
        (a.row.room_no ?? '').localeCompare(b.row.room_no ?? '') ||
        a.row.code.localeCompare(b.row.code),
    );
    return out.map((o) => o.dto);
  }

  /** OpenAPI ReservationSummary of a row (FD+ only – the operation is S02). */
  private async summary(tx: Tx, r: StayListRow, p: PropertyNow): Promise<SummaryRow> {
    const registration = await this.hooks.registrationSummary(tx, r.id);
    const balance = await this.folios.balance(tx, r.folio_id);
    return {
      id: r.id,
      code: r.code,
      status: r.status,
      stayType: r.stay_type,
      roomNo: r.room_no,
      arrivalDate: r.arrival_date,
      departureDate: r.effective_departure,
      nights: nightsOf(r.arrival_date, r.effective_departure),
      guestDisplayName: r.guest_name,
      channelCode: r.channel_code,
      ...(r.eta_time ? { etaTime: r.eta_time } : {}),
      ...(r.hold_expires_at ? { holdExpiresAt: p.iso(r.hold_expires_at) } : {}),
      conflictState: r.conflict_state,
      ...(registration ? { registrationStatus: registration.status } : {}),
      balanceDueVnd: balance.balanceDueVnd,
    };
  }
}

/** US-031 / BR-425 state of a departure row on the list date (frontdesk StayService.reminderState rules). */
export function reminderState(i: {
  status: string;
  departure: LocalDate;
  today: LocalDate;
  replied: boolean;
  sameDayArrival: boolean;
  nowTime: LocalTime;
  rollover: LocalTime;
  reminders: CheckoutReminders;
}): DepartureReminderState {
  if (i.status === 'checked_out') return 'checked_out';
  if (i.departure > i.today) return i.replied ? 'replied' : 'reminded_waiting';
  if (i.departure < i.today) return 'overdue';
  return departureReminderState({
    nowTime: i.nowTime,
    rollover: i.rollover,
    checkedOut: false,
    replied: i.replied,
    sameDayArrival: i.sameDayArrival,
    reminders: i.reminders,
  });
}

function sortBy<R, D>(rows: R[], dtos: D[], key: (r: R) => Array<string | number>): D[] {
  const idx = rows.map((r, i) => ({ k: key(r), i }));
  idx.sort((a, b) => {
    for (let j = 0; j < a.k.length; j++) {
      const x = a.k[j] as string | number;
      const y = b.k[j] as string | number;
      if (x === y) continue;
      if (typeof x === 'number' && typeof y === 'number') return x - y;
      return String(x).localeCompare(String(y));
    }
    return 0;
  });
  return idx.map((e) => dtos[e.i] as D);
}
