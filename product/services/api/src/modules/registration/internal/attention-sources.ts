/**
 * "Cần chú ý" items of the registration module, computed at read time (EP01 3.1, BR-907; BUG-R2-034 –
 * registered through EventsService.registerAttentionSource like BE-A's sources):
 * - `registration_due` (warning): declarations not yet sent of guests in house, or of bookings arriving
 *   today (deadline not started yet – AC1), whose deadline has not passed; earliest deadline in `params`.
 * - `registration_overdue` (critical): the deadline in force (actual arrival + today's parameters – US-042
 *   AC3) has passed and the declaration is still not sent (in house, or checked out within
 *   `id_image_unconfirmed_max_days` – after that J16 removes the images and opens its own event item).
 * - `visa_expiring` (warning): one item per booking, reservation code + room ONLY (SR-RET-06, PO 16/10 – the
 *   expiry date is read on the document screen with its C3 log).
 * - `data_quality` / `registration_stay_not_closed` (warning): a booking still hold/confirmed/in house after its
 *   planned departure that holds document images – J16 deletes them id_image_unconfirmed_max_days later.
 * - `data_quality` / `registration_party_docs_unlinked` (warning, BUG-R2-083): a person left the party while
 *   guest-link documents ("Khách 2"…) were linked to nobody – link the ones of people still staying
 *   (document → person), otherwise J16 removes them at `dueAt` (24 h after the removal).
 * Codes, counts, booking ids and room numbers only (SEC J / B-21).
 */
import type {
  AttentionItem,
  AttentionSource,
  AttentionSourceContext,
} from '../../events/public/events.service';
import { type RegistrationService, UNCLAIMED_DOCUMENTS_CHECK } from './registration.service';
import type { StayView } from './stay-reader';

const DAY_MS = 86_400_000;

function roomsOf(stays: readonly StayView[]): string[] {
  return [...new Set(stays.map((s) => s.roomNo).filter((r): r is string => !!r))];
}

export function registrationAttentionSources(regs: RegistrationService): AttentionSource[] {
  const declarations: AttentionSource = async (tx, ctx: AttentionSourceContext) => {
    const open = await regs.openDeclarations(tx);
    const now = ctx.now.getTime();
    const keepDays = (await ctx.param<number>('id_image_unconfirmed_max_days')) ?? 7;
    const due = open
      .filter(
        (o) =>
          (o.stay.status === 'in_house' && o.deadlineAt && o.deadlineAt.getTime() > now) ||
          (o.stay.status === 'confirmed' && o.stay.arrivalDate === ctx.today),
      )
      .sort(
        (a, b) =>
          (a.deadlineAt?.getTime() ?? Number.MAX_SAFE_INTEGER) -
          (b.deadlineAt?.getTime() ?? Number.MAX_SAFE_INTEGER),
      );
    const overdue = open
      .filter(
        (o) =>
          !!o.deadlineAt &&
          o.deadlineAt.getTime() <= now &&
          (o.stay.status === 'in_house' ||
            (o.stay.status === 'checked_out' &&
              !!o.stay.actualCheckoutAt &&
              now - o.stay.actualCheckoutAt.getTime() <= keepDays * DAY_MS)),
      )
      .sort((a, b) => (a.deadlineAt?.getTime() ?? 0) - (b.deadlineAt?.getTime() ?? 0));
    const items: AttentionItem[] = [];
    if (due.length > 0) {
      const earliest = due.find((o) => o.deadlineAt)?.deadlineAt ?? null;
      items.push({
        kind: 'registration_due',
        source: 'computed',
        severity: 'warning',
        count: due.length,
        reservationIds: due.map((o) => o.stay.reservationId),
        roomNos: roomsOf(due.map((o) => o.stay)),
        ...(earliest ? { dueAt: ctx.iso(earliest) } : {}),
        ...(due.length === 1 && due[0] ? { refCode: due[0].stay.code } : {}),
        link: '/registrations',
        params: { count: due.length, ...(earliest ? { deadline: ctx.iso(earliest) } : {}) },
      });
    }
    if (overdue.length > 0) {
      const first = overdue[0]?.deadlineAt ?? null;
      items.push({
        kind: 'registration_overdue',
        source: 'computed',
        severity: 'critical',
        count: overdue.length,
        reservationIds: overdue.map((o) => o.stay.reservationId),
        roomNos: roomsOf(overdue.map((o) => o.stay)),
        ...(first ? { dueAt: ctx.iso(first) } : {}),
        ...(overdue.length === 1 && overdue[0] ? { refCode: overdue[0].stay.code } : {}),
        link: '/registrations?view=action_needed',
        params: { count: overdue.length },
      });
    }
    return items;
  };

  const visa: AttentionSource = async (tx) => {
    const stays = await regs.visaExpiringReservations(tx);
    return stays.map((s) => ({
      kind: 'visa_expiring' as const,
      source: 'computed' as const,
      severity: 'warning' as const,
      count: 1,
      reservationIds: [s.reservationId],
      ...(s.roomNo ? { roomNos: [s.roomNo] } : {}),
      refCode: s.code,
      link: '/registrations',
    }));
  };

  // Re-verification Major a: a booking never closed after its departure that still holds document images.
  const notClosed: AttentionSource = async (tx) => {
    const stays = await regs.staysNotClosed(tx);
    if (stays.length === 0) return [];
    return [
      {
        kind: 'data_quality' as const,
        source: 'computed' as const,
        severity: 'warning' as const,
        count: stays.length,
        reservationIds: stays.map((st) => st.reservationId),
        roomNos: roomsOf(stays),
        ...(stays.length === 1 && stays[0] ? { refCode: stays[0].code } : {}),
        params: { check: 'registration_stay_not_closed' },
      },
    ];
  };

  // BUG-R2-083 (SEC-BE-53 fallback): unclaimed guest-link documents waiting for the desk.
  const unclaimed: AttentionSource = async (tx, ctx) => {
    const found = await regs.unclaimedDocumentStays(tx);
    if (found.length === 0) return [];
    const first = found[0];
    return [
      {
        kind: 'data_quality' as const,
        source: 'computed' as const,
        severity: 'warning' as const,
        count: found.length,
        reservationIds: found.map((f) => f.stay.reservationId),
        roomNos: roomsOf(found.map((f) => f.stay)),
        ...(first ? { dueAt: ctx.iso(first.dueAt) } : {}),
        ...(found.length === 1 && first ? { refCode: first.stay.code } : {}),
        link: '/registrations',
        params: { check: UNCLAIMED_DOCUMENTS_CHECK },
      },
    ];
  };

  return [declarations, visa, notClosed, unclaimed];
}
