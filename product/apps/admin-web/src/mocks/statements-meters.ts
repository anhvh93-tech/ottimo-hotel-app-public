// Meter-reading handlers of the FB-INV-012 mock (OpenAPI `recordMeterReading`, `listMeterReadings`,
// `voidMeterReading`) with the BE-190 decisions: the opening is its own reading (`period_start` / `checkin`);
// closing < opening → 422 METER_LOWER_THAN_PREVIOUS (exception FDL+, BR-LS-12); opening < previous closing → 422
// OPENING_BELOW_PREVIOUS_CLOSING, saved when sent again with `acknowledgeLowerThanPrevious` (any FD+, BE-190-01);
// outside the end-of-month window → 422 READING_OUT_OF_WINDOW, FDL+ may record late with `lateReason` (BE-190-03).
import type { Role } from '@ottimo/api-client';
import { http } from 'msw';
import { daysBetween } from '../app/dates';
import { isOpeningKind, monthOf, shiftMonth, type RecordMeterReadingBody } from '../app/statements';
import { LEADS, has, issuedReadingIds } from './statements-compute';
import {
  TYPES,
  initials,
  isClosingKind,
  openingOf,
  previousClosingOf,
  readingView,
  round1,
  uid,
  windowOf,
  type MockState,
  type StoredReading,
} from './statements-model';
import type { StatementsCtx } from './statements';

export const FD_PLUS: Role[] = ['owner', 'manager', 'front_desk_lead', 'front_desk'];
const KINDS = [
  'checkin',
  'period_start',
  'period_end',
  'room_change_out',
  'room_change_in',
  'checkout',
];

export function meterHandlers(
  ctx: StatementsCtx,
  state: () => MockState,
  today: () => string,
  window: () => { daysBeforeMonthEnd: number; daysAfter: number; lateMaxDays: number },
  idem: Map<string, unknown>,
  prop: string,
) {
  const stayOf = (id: string) => state().stays.find((s) => s.reservationId === id);
  const notLong = () => ctx.problem(422, 'NOT_LONG_STAY');
  const validation = (errors: Array<{ field: string; code: string }>) =>
    ctx.problem(422, 'VALIDATION_FAILED', { errors });
  const view = (x: StoredReading) => readingView(state(), x, issuedReadingIds(state()));

  return [
    http.get(`${prop}/reservations/:reservationId/meter-readings`, ({ request, params }) => {
      const g = ctx.guard(request, FD_PLUS);
      if (g instanceof Response) return g;
      if (!stayOf(String(params.reservationId))) return notLong();
      const items = state()
        .readings.filter((x) => x.reservationId === params.reservationId)
        .sort((a, b) => a.readOn.localeCompare(b.readOn) || a.seq - b.seq)
        .map(view);
      return ctx.json({ items });
    }),
    http.post(`${prop}/reservations/:reservationId/meter-readings`, async ({ request, params }) => {
      const g = ctx.guard(request, FD_PLUS);
      if (g instanceof Response) return g;
      const key = request.headers.get('idempotency-key');
      if (!key) return ctx.problem(428, 'PRECONDITION_REQUIRED');
      if (idem.has(key)) return ctx.json(idem.get(key), 201);
      const st = state();
      const stay = stayOf(String(params.reservationId));
      if (!stay) return notLong();
      if (stay.status !== 'in_house') return ctx.problem(409, 'INVALID_TRANSITION');
      const b = (await request.json()) as RecordMeterReadingBody;
      const errors: Array<{ field: string; code: string }> = [];
      if (!KINDS.includes(b.kind)) errors.push({ field: 'kind', code: 'REQUIRED' });
      const monthly = b.kind === 'period_start' || b.kind === 'period_end';
      if (monthly && !/^\d{4}-\d{2}$/.test(b.periodMonth ?? ''))
        errors.push({ field: 'periodMonth', code: 'REQUIRED' });
      if (!monthly && b.periodMonth) errors.push({ field: 'periodMonth', code: 'NOT_ALLOWED' });
      for (const type of TYPES) {
        const m = b[type];
        if (typeof m?.value !== 'number' || m.value < 0)
          errors.push({ field: `${type}.value`, code: 'REQUIRED' });
      }
      if (!b.photoAttachmentId && !b.photoWaived)
        errors.push({ field: 'photoAttachmentId', code: 'REQUIRED' });
      if (errors.length) return validation(errors);
      const lead = has(g.roles, LEADS);
      // A89 (contract §4): exceptions and a waived photo are FDL+; FD is told to call the lead.
      if (!lead && (b.electricity.exception || b.water.exception || b.photoWaived))
        return ctx.problem(403, 'FORBIDDEN_ACTION');
      // The check-in month has no period_start: its opening is the check-in reading.
      const checkin = st.readings.find(
        (x) => !x.voidedAt && x.reservationId === stay.reservationId && x.kind === 'checkin',
      );
      // Day-based readings: not before arrival, not in the future (contract: DATE_INVALID).
      if (
        !monthly &&
        (!/^\d{4}-\d{2}-\d{2}$/.test(b.readOn ?? '') ||
          b.readOn < stay.arrivalDate ||
          b.readOn > today())
      )
        return validation([{ field: 'readOn', code: 'DATE_INVALID' }]);
      // One check-in reading per stay.
      if (b.kind === 'checkin' && checkin) return ctx.problem(409, 'READING_EXISTS');
      if (b.kind === 'period_start' && checkin && monthOf(checkin.readOn) === b.periodMonth)
        return validation([{ field: 'periodMonth', code: 'NOT_ALLOWED' }]);
      // End-of-month window (BR-LS-10): period_end of M and period_start of M+1 share it.
      let lateReason: string | null = null;
      if (monthly) {
        const closes = b.kind === 'period_end' ? b.periodMonth! : shiftMonth(b.periodMonth!, -1);
        const w = window();
        const win = windowOf(closes, w);
        const day = today();
        if (day < win.from) return ctx.problem(422, 'READING_OUT_OF_WINDOW', { window: win });
        if (day > win.to) {
          const late = daysBetween(win.to, day);
          const reason = String(b.lateReason ?? '').trim();
          const lateAllowed = lead && late <= w.lateMaxDays;
          if (!lateAllowed || reason.length < 3 || reason.length > 300)
            return ctx.problem(422, 'READING_OUT_OF_WINDOW', { window: win, lateAllowed });
          lateReason = reason;
        }
      }
      const exists = st.readings.some(
        (x) =>
          !x.voidedAt &&
          x.reservationId === stay.reservationId &&
          x.roomId === b.roomId &&
          x.kind === b.kind &&
          (monthly ? x.periodMonth === b.periodMonth : x.readOn === b.readOn),
      );
      if (exists) return ctx.problem(409, 'READING_EXISTS');
      st.seq += 1;
      const x: StoredReading = {
        id: uid(83_100 + st.seq),
        seq: st.seq,
        reservationId: stay.reservationId,
        roomId: b.roomId,
        roomNo: stay.roomNo,
        kind: b.kind,
        periodMonth: monthly ? b.periodMonth! : null,
        readOn: b.readOn,
        electricity: {
          value: Math.floor(b.electricity.value),
          exception: b.electricity.exception ?? null,
        },
        water: {
          value: Math.floor(b.water.value * 10 + 1e-9) / 10,
          exception: b.water.exception ?? null,
        },
        photoAttachmentId: b.photoAttachmentId ?? null,
        photoWaived: !!b.photoWaived,
        note: b.note ?? null,
        readByRole: g.roles[0] ?? 'front_desk',
        readByInitials: initials(g.user.displayName),
        lateReason,
        acknowledgedLower: !!b.acknowledgeLowerThanPrevious,
        voidedAt: null,
        voidReason: null,
        createdAt: new Date().toISOString(),
        version: 1,
      };
      for (const type of TYPES) {
        const m = x[type];
        if (m.exception) continue;
        if (isClosingKind(x.kind)) {
          const open = openingOf(st, x);
          if (open && m.value < open[type].value)
            return ctx.problem(422, 'METER_LOWER_THAN_PREVIOUS', {
              meter: type,
              previousValue: open[type].value,
              errors: [{ field: `${type}.value`, code: 'METER_LOWER_THAN_PREVIOUS' }],
            });
        } else if (isOpeningKind(x.kind) && !b.acknowledgeLowerThanPrevious) {
          const prev = previousClosingOf(st, x);
          if (prev && m.value < prev[type].value)
            return ctx.problem(422, 'OPENING_BELOW_PREVIOUS_CLOSING', {
              meter: type,
              previousValue: type === 'water' ? round1(prev[type].value) : prev[type].value,
              previousReadingId: prev.id,
              previousKind: prev.kind,
            });
        }
      }
      st.readings.push(x);
      const out = view(x);
      idem.set(key, out);
      return ctx.json(out, 201);
    }),
    http.post(`${prop}/meter-readings/:readingId/void`, async ({ request, params }) => {
      const g = ctx.guard(request, FD_PLUS);
      if (g instanceof Response) return g;
      const x = state().readings.find((o) => o.id === params.readingId);
      if (!x) return ctx.problem(404, 'NOT_FOUND');
      const { reason } = (await request.json()) as { reason?: string };
      if (String(reason ?? '').trim().length < 3)
        return validation([{ field: 'reason', code: 'REASON_REQUIRED' }]);
      if (x.voidedAt) return ctx.problem(409, 'INVALID_TRANSITION');
      if (issuedReadingIds(state()).has(x.id))
        return ctx.problem(409, 'READING_ON_ISSUED_STATEMENT');
      x.voidedAt = new Date().toISOString();
      x.voidReason = String(reason).trim();
      x.version += 1;
      return ctx.json(view(x));
    }),
  ];
}
