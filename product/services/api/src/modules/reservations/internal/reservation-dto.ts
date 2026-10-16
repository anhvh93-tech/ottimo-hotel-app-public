/**
 * OpenAPI `Reservation` / `ReservationSummary` JSON. Role filtering (x-visible-to: nightlyRates for CTV,
 * otaRef/internalNote/manualLongStay for non-FD…) is done by the global role serializer on the response;
 * this mapper only shapes the data. Absent values are omitted (never `null` placeholders for hidden data).
 */
import { maskPhone } from '../../guests/public/normalize';
import type { LocalDate } from '../../../shared/time';
import { nightsOf } from '../public/pricing';
import type { AllowedAction } from './allowed-actions';
import type { ReservationRow, SegmentRow } from './reservation-store';

export interface BookerRow {
  id: string;
  code: string;
  full_name: string;
  nationality_code: string | null;
  phone_e164: string | null;
  tags: string[] | null;
  possible_duplicate_at: Date | null;
}

export function guestSummary(g: BookerRow): Record<string, unknown> {
  return {
    id: g.id,
    code: g.code,
    displayName: g.full_name,
    ...(g.nationality_code ? { nationalityCode: g.nationality_code } : {}),
    ...(g.phone_e164 ? { phoneMasked: maskPhone(g.phone_e164) } : {}),
    ...(g.tags && g.tags.length ? { tags: g.tags } : {}),
    possibleDuplicate: !!g.possible_duplicate_at,
  };
}

/** BR-110 / BR-812: persons above the base occupancy of the assigned room (0 when unassigned). */
export function extraGuestCount(
  row: Pick<ReservationRow, 'adults' | 'children_6_11'>,
  baseOccupancy: number | null,
): number {
  if (baseOccupancy === null) return 0;
  return Math.max(0, row.adults + row.children_6_11 - baseOccupancy);
}

export interface DtoInput {
  row: ReservationRow;
  segments: SegmentRow[];
  booker: BookerRow | null;
  nights: Array<{ date: LocalDate; amountVnd: number; calendarRateVnd?: number }>;
  actions: AllowedAction[];
  iso(instant: Date): string;
  /** BR-311 mark time of the arrival day (confirmed, arrival ≤ business date) – 0.3.5 A-04. */
  noShowAvailableFrom: Date | null;
  /** Σ succeeded deposits (BR-305) – 0.3.5 A-13. */
  depositPaidVnd: number;
  /** 0.3.5 A-25: room group the OTA guest booked (unassigned lane). */
  requestedGroup?: { id: string; code: string } | null;
  /** US-022 AC1: persons recorded on the booking (booker + party members). */
  partyPresentCount?: number;
}

export function toReservationDto(d: DtoInput): Record<string, unknown> {
  const { row } = d;
  const current = d.segments[d.segments.length - 1];
  const manual = row.manual_long_stay as {
    monthly_rent_vnd?: number;
    external_contract_ref?: string;
    deposit_held_vnd?: number;
  } | null;
  return {
    id: row.id,
    code: row.code,
    status: row.status,
    stayType: row.stay_type,
    channelId: row.channel_id,
    channelCode: row.channel_code,
    directSource: row.direct_source,
    paymentModel: row.payment_model,
    ...(row.ota_ref ? { otaRef: row.ota_ref } : {}),
    ...(d.booker ? { booker: guestSummary(d.booker) } : {}),
    ...(row.closer_user_id ? { closerUserId: row.closer_user_id } : {}),
    ...(row.parent_reservation_id ? { parentReservationId: row.parent_reservation_id } : {}),
    ...(row.quote_id ? { quoteId: row.quote_id } : {}),
    ...(row.group_id ? { groupId: row.group_id } : {}),
    externalContract: row.external_contract,
    ...(row.external_contract && manual
      ? {
          manualLongStay: {
            ...(manual.monthly_rent_vnd !== undefined
              ? { monthlyRentVnd: manual.monthly_rent_vnd }
              : {}),
            ...(manual.external_contract_ref
              ? { externalContractRef: manual.external_contract_ref }
              : {}),
            ...(manual.deposit_held_vnd !== undefined
              ? { depositHeldVnd: manual.deposit_held_vnd }
              : {}),
          },
        }
      : {}),
    ...(row.folio_id ? { folioId: row.folio_id } : {}),
    segments: d.segments.map((s) => ({
      roomId: s.room_id,
      roomNo: s.room_no,
      fromDate: s.from_date,
      toDate: s.to_date,
    })),
    arrivalDate: row.arrival_date,
    departureDate: row.departure_date,
    nights: nightsOf(row.arrival_date, row.departure_date),
    adults: row.adults,
    children6to11: row.children_6_11,
    childrenUnder6: row.children_under_6,
    ...(d.partyPresentCount !== undefined
      ? {
          partyMissingCount: Math.max(
            0,
            row.adults + row.children_6_11 + row.children_under_6 - d.partyPresentCount,
          ),
        }
      : {}),
    extraGuestCount: extraGuestCount(row, current?.base_occupancy ?? null),
    ...(row.eta_time ? { etaTime: row.eta_time } : {}),
    ...(row.agreed_checkout_time ? { agreedCheckoutTime: row.agreed_checkout_time } : {}),
    // 0.3.6 bổ sung (ARC review S3 C): MGR+ accepted a short deposit (FD+ only – x-visible-to).
    depositShortfall:
      row.deposit_shortfall_accepted_at && row.deposit_shortfall_vnd !== null
        ? {
            shortfallVnd: Number(row.deposit_shortfall_vnd),
            acceptedAt: d.iso(row.deposit_shortfall_accepted_at),
            acceptedByName: row.deposit_shortfall_accepted_by_name ?? '',
            reason: row.deposit_shortfall_reason ?? '',
          }
        : null,
    ...(row.actual_checkin_at ? { actualCheckinAt: d.iso(row.actual_checkin_at) } : {}),
    ...(row.actual_checkout_at ? { actualCheckoutAt: d.iso(row.actual_checkout_at) } : {}),
    ...(row.hold_expires_at
      ? {
          hold: {
            ...(row.hold_hours !== null ? { hours: row.hold_hours } : {}),
            expiresAt: d.iso(row.hold_expires_at),
            extendedCount: row.hold_extended_count,
          },
        }
      : {}),
    depositRequiredVnd: row.deposit_required_vnd,
    depositPaidVnd: d.depositPaidVnd,
    noShowAvailableFrom: d.noShowAvailableFrom ? d.iso(d.noShowAvailableFrom) : null,
    ...(row.external_contract ? {} : { nightlyRates: d.nights }),
    totalRoomVnd: row.total_room_vnd,
    conflictState: row.conflict_state,
    capacityConflict: row.capacity_conflict_at !== null,
    ...(d.requestedGroup
      ? { requestedRoomGroupId: d.requestedGroup.id, requestedRoomGroupCode: d.requestedGroup.code }
      : {}),
    progress: progress(row, d.iso),
    ...(row.status === 'cancelled' && row.cancelled_at
      ? {
          cancellation: {
            cancelledAt: d.iso(row.cancelled_at),
            ...(row.cancel_reason_code ? { reasonCode: row.cancel_reason_code } : {}),
            ...(row.cancel_note ? { note: row.cancel_note } : {}),
          },
        }
      : {}),
    ...(row.internal_note ? { internalNote: row.internal_note } : {}),
    // B-28 / US-025 AC7: when the desk handed the door code/card over – never the code itself (SEC D2).
    ...(row.status === 'in_house' || row.status === 'checked_out'
      ? {
          doorAccessHandedOverAt: row.door_access_handed_over_at
            ? d.iso(row.door_access_handed_over_at)
            : null,
        }
      : {}),
    allowedActions: d.actions,
    version: row.version,
  };
}

function progress(row: ReservationRow, iso: (i: Date) => string) {
  const step = (name: string, at: Date | null, done: boolean) => ({
    step: name,
    done,
    ...(at ? { at: iso(at) } : {}),
  });
  if (row.stay_type === 'long') {
    return [
      step('confirmed', row.confirmed_at, row.confirmed_at !== null),
      step('checked_in', row.actual_checkin_at, row.actual_checkin_at !== null),
      step('checked_out', row.actual_checkout_at, row.actual_checkout_at !== null),
    ];
  }
  const confirmed = row.confirmed_at !== null;
  return [
    step('hold', row.hold_created_at, row.hold_created_at !== null || confirmed),
    step('deposit', row.hold_created_at ? row.confirmed_at : null, confirmed),
    step('confirmed', row.confirmed_at, confirmed),
    step('checked_in', row.actual_checkin_at, row.actual_checkin_at !== null),
    step('checked_out', row.actual_checkout_at, row.actual_checkout_at !== null),
  ];
}

export function toSummaryDto(
  row: ReservationRow & { room_no: string | null; guest_name: string | null },
  iso: (i: Date) => string,
): Record<string, unknown> {
  return {
    id: row.id,
    code: row.code,
    status: row.status,
    stayType: row.stay_type,
    roomNo: row.room_no,
    arrivalDate: row.arrival_date,
    departureDate: row.departure_date,
    nights: nightsOf(row.arrival_date, row.departure_date),
    ...(row.guest_name ? { guestDisplayName: row.guest_name } : {}),
    channelCode: row.channel_code,
    ...(row.eta_time ? { etaTime: row.eta_time } : {}),
    ...(row.status === 'hold' && row.hold_expires_at
      ? { holdExpiresAt: iso(row.hold_expires_at) }
      : {}),
    conflictState: row.conflict_state,
  };
}
