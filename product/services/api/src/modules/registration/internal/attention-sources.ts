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
 * Codes, counts, booking ids and room numbers only (SEC J / B-21).
 */
import type {
  AttentionItem,
  AttentionSource,
  AttentionSourceContext,
} from '../../events/public/events.service';
import type { RegistrationService } from './registration.service';
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

  return [declarations, visa];
}
