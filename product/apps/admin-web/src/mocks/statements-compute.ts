// Statement maths of the FB-INV-012 mock (DOM-rules BR-LS-01..16, INV 17/11): rent of month M in advance,
// electricity / water / services of M−1, VAT per utility line (8 % / 5 % parameters), total rounded DOWN to 1.000 with
// a "Rounding" line, due end of day 05. Drafts are computed on read (D4), issuing freezes the result.
import type { Role } from '@ottimo/api-client';
import { daysBetween } from '../app/dates';
import {
  lastDayOf,
  shiftMonth,
  type BillingPeriod,
  type BillingPeriodSummary,
  type MissingMeterReading,
  type StatementAction,
  type StatementLine,
  type StatementWarning,
} from '../app/statements';
import {
  TYPES,
  periodClosing,
  periodOpening,
  readingView,
  uid,
  type LeaseStay,
  type MockState,
  type StoredPeriod,
} from './statements-model';

export const LEADS: Role[] = ['owner', 'manager', 'front_desk_lead'];
export const has = (roles: Role[], set: Role[]) => roles.some((r) => set.includes(r));

export interface Rates {
  rules: {
    rentTiming: string;
    dueDay: number;
    totalRoundingVnd: number;
  };
  price: { electricityVndPerKwh: number; waterVndPerM3: number };
  vat: { electricity: number; water: number };
}

export const issuedReadingIds = (st: MockState) =>
  new Set(
    st.periods
      .filter((p) => p.status !== 'void' && p.status !== 'draft')
      .flatMap((p) => p.readingIds),
  );

const flat = (
  kind: StatementLine['kind'],
  labelKey: string,
  amountVnd: number,
  extra: Partial<StatementLine> = {},
): StatementLine => ({
  kind,
  labelKey,
  labelParams: null,
  roomNo: null,
  serviceDate: null,
  meter: null,
  quantity: 1,
  unit: 'item',
  unitPriceNetVnd: amountVnd,
  vatRatePct: null,
  netVnd: amountVnd,
  vatVnd: 0,
  amountVnd,
  folioLineId: null,
  ...extra,
});

export function compute(st: MockState, p: StoredPeriod, rates: Rates) {
  const stay = st.stays.find((s) => s.reservationId === p.reservationId)!;
  const { rules, price, vat } = rates;
  const u = shiftMonth(p.month, -1);
  const rentMonth = rules.rentTiming === 'advance' ? p.month : u;
  const rentPeriod = { from: `${rentMonth}-01`, to: lastDayOf(rentMonth) };
  const utilityPeriod = { from: `${u}-01`, to: lastDayOf(u) };
  const servicePeriod = utilityPeriod;
  const lines: StatementLine[] = [
    flat('rent', 'bill.line.monthly_rent', stay.monthlyRentVnd, {
      labelParams: { from: rentPeriod.from, to: rentPeriod.to },
      unit: 'month',
    }),
  ];
  const warnings: StatementWarning[] = [];
  const missingReadings: MissingMeterReading[] = [];
  const open = periodOpening(st, stay, u);
  const close = periodClosing(st, stay, u);
  if (!open)
    missingReadings.push({ roomId: stay.roomId, roomNo: stay.roomNo, kind: 'opening', periodMonth: u });
  if (!close)
    missingReadings.push({
      roomId: stay.roomId,
      roomNo: stay.roomNo,
      kind: 'period_end',
      periodMonth: u,
    });
  const issued = issuedReadingIds(st);
  const readingIds: string[] = [];
  if (open && close) {
    readingIds.push(open.id, close.id);
    const used = readingView(st, close, issued).consumption;
    const openView = readingView(st, open, issued);
    for (const type of TYPES) {
      const qty = used?.[type] ?? 0;
      const unit = type === 'electricity' ? price.electricityVndPerKwh : price.waterVndPerM3;
      const rate = vat[type];
      const net = Math.round(qty * unit);
      const v = Math.round((net * rate) / 100);
      lines.push({
        kind: type,
        labelKey: `bill.line.${type}`,
        labelParams: { month: u },
        roomNo: stay.roomNo,
        serviceDate: null,
        meter: { from: open[type].value, to: close[type].value, exception: close[type].exception },
        quantity: qty,
        unit: type === 'electricity' ? 'kwh' : 'm3',
        unitPriceNetVnd: unit,
        vatRatePct: rate,
        netVnd: net,
        vatVnd: v,
        amountVnd: net + v,
        folioLineId: null,
      });
      const threshold = type === 'electricity' ? 300 : 10;
      if (qty > threshold)
        warnings.push({
          code: 'METER_ANOMALY',
          roomNo: stay.roomNo,
          meter: type,
          consumption: qty,
          threshold,
        });
      const gap = openView.gap?.[type];
      if (typeof gap === 'number' && gap < 0 && openView.previousClosing)
        warnings.push({
          code: 'OPENING_BELOW_PREVIOUS_CLOSING',
          roomNo: stay.roomNo,
          meter: type,
          opening: open[type].value,
          previousClosing: openView.previousClosing[type],
        });
    }
    for (const x of [open, close]) {
      if (x.photoWaived)
        warnings.push({ code: 'PHOTO_WAIVED', roomNo: stay.roomNo, readingId: x.id });
      if (x.lateReason)
        warnings.push({ code: 'READING_LATE', roomNo: stay.roomNo, readingId: x.id, kind: x.kind });
    }
  }
  const elsewhere = new Set(
    st.periods
      .filter((o) => o.id !== p.id && o.status !== 'void' && o.snapshot)
      .flatMap((o) => o.snapshot!.lines.map((l) => l.folioLineId).filter(Boolean)),
  );
  const excludedLines: StatementLine[] = [];
  for (const s of st.services.filter(
    (x) =>
      x.reservationId === p.reservationId &&
      x.serviceDate >= servicePeriod.from &&
      x.serviceDate <= servicePeriod.to &&
      x.amountVnd > 0,
  )) {
    if (elsewhere.has(s.id)) {
      warnings.push({ code: 'SERVICE_LINE_ON_OTHER_STATEMENT', roomNo: stay.roomNo });
      continue;
    }
    const line = flat('service', s.labelKey, s.amountVnd, {
      serviceDate: s.serviceDate,
      folioLineId: s.id,
    });
    (p.excludedFolioLineIds.includes(s.id) ? excludedLines : lines).push(line);
  }
  if (p.priorAdjustment)
    lines.push(
      flat('prior_adjustment', 'bill.line.statement_prior_adjustment', p.priorAdjustment.amountVnd),
    );
  const netVnd = lines.reduce((s, l) => s + l.netVnd, 0);
  const vatVnd = lines.reduce((s, l) => s + l.vatVnd, 0);
  const gross = netVnd + vatVnd;
  const totalVnd = Math.floor(gross / rules.totalRoundingVnd) * rules.totalRoundingVnd;
  const roundingVnd = totalVnd - gross;
  if (roundingVnd !== 0) lines.push(flat('rounding', 'bill.line.statement_rounding', roundingVnd));
  const [y, mo] = p.month.split('-');
  const body: BillingPeriod = {
    id: p.id,
    code: p.code,
    status: p.status,
    kind: p.kind,
    month: p.month,
    reservationId: p.reservationId,
    reservationCode: stay.reservationCode,
    folioId: stay.folioId,
    roomNos: [stay.roomNo],
    guestDisplayName: stay.guestDisplayName,
    rentPeriod,
    utilityPeriod,
    servicePeriod,
    dueDate: `${y}-${mo}-${String(rules.dueDay).padStart(2, '0')}`,
    overdueDays: 0,
    alertLevel: null,
    lines,
    excludedLines,
    excludedFolioLineIds: [...p.excludedFolioLineIds],
    missingReadings,
    priorAdjustment: p.priorAdjustment,
    note: null,
    totals: { netVnd, vatVnd, roundingVnd, totalVnd, paidVnd: 0, balanceVnd: totalVnd },
    warnings,
    availableActions: [],
    replacesId: p.replacesId,
    replacesCode: st.periods.find((o) => o.id === p.replacesId)?.code ?? null,
    issuedAt: null,
    paidAt: null,
    voidedAt: null,
    voidReason: null,
    version: p.version,
  };
  return { body, readingIds, complete: !!(open && close) };
}

/** BR-LS-02 / D6: overdue is derived, never stored. */
export function alertOf(p: StoredPeriod, dueDate: string | null | undefined, today: string) {
  if (!dueDate || (p.status !== 'issued' && p.status !== 'partially_paid'))
    return { overdueDays: 0, alertLevel: null };
  const d = daysBetween(dueDate, today);
  if (d < 0) return { overdueDays: 0, alertLevel: null };
  if (d === 0) return { overdueDays: 0, alertLevel: 'due_today' as const };
  return {
    overdueDays: d,
    alertLevel:
      d >= 10 ? ('escalate' as const) : d >= 3 ? ('alert' as const) : ('overdue' as const),
  };
}

export function actionsOf(p: StoredPeriod, roles: Role[]): StatementAction[] {
  const lead = has(roles, LEADS);
  switch (p.status) {
    case 'draft':
      return ['update', 'issue', 'void', ...(lead ? (['prior_adjustment'] as const) : [])];
    case 'issued':
      return ['print', 'record_payment', ...(lead ? (['void'] as const) : [])];
    case 'partially_paid':
      return ['print', 'record_payment'];
    case 'paid':
      return ['print'];
    default:
      return [];
  }
}

export function view(
  st: MockState,
  p: StoredPeriod,
  roles: Role[],
  rates: Rates,
  today: string,
): BillingPeriod {
  const body = p.snapshot ?? compute(st, p, rates).body;
  return {
    ...body,
    status: p.status,
    code: p.code,
    totals: { ...body.totals, paidVnd: p.paidVnd, balanceVnd: body.totals.totalVnd - p.paidVnd },
    issuedAt: p.issuedAt,
    paidAt: p.paidAt,
    voidedAt: p.voidedAt,
    voidReason: p.voidReason,
    ...alertOf(p, body.dueDate, today),
    availableActions: actionsOf(p, roles),
    version: p.version,
  };
}

export function summaryOf(v: BillingPeriod): BillingPeriodSummary {
  return {
    id: v.id,
    code: v.code ?? null,
    reservationId: v.reservationId,
    roomNos: v.roomNos,
    guestDisplayName: v.guestDisplayName ?? null,
    month: v.month,
    kind: v.kind,
    totalVnd: v.totals.totalVnd,
    balanceVnd: v.totals.balanceVnd,
    dueDate: v.dueDate ?? null,
    status: v.status,
    overdueDays: v.overdueDays ?? 0,
    alertLevel: v.alertLevel ?? null,
  };
}

export function newPeriod(
  st: MockState,
  reservationId: string,
  month: string,
  replacesId: string | null,
): StoredPeriod {
  st.seq += 1;
  return {
    id: uid(86_000 + st.seq),
    reservationId,
    month,
    kind: 'regular',
    status: 'draft',
    code: null,
    excludedFolioLineIds: [],
    priorAdjustment: null,
    replacesId,
    snapshot: null,
    readingIds: [],
    paidVnd: 0,
    payments: [],
    issuedAt: null,
    paidAt: null,
    voidedAt: null,
    voidReason: null,
    version: 1,
  };
}

export function issue(st: MockState, p: StoredPeriod, rates: Rates, issuedAt: string) {
  const c = compute(st, p, rates);
  const yymm = p.month.slice(2, 4) + p.month.slice(5, 7);
  const replaced = st.periods.filter(
    (o) =>
      o.reservationId === p.reservationId && o.month === p.month && o.status === 'void' && o.code,
  ).length;
  p.code = `TT-${yymm}-${c.body.roomNos[0]}${replaced ? `-R${replaced}` : ''}`;
  p.status = 'issued';
  p.issuedAt = issuedAt;
  p.readingIds = c.readingIds;
  p.snapshot = { ...c.body, code: p.code, status: 'issued', issuedAt, excludedLines: [] };
  p.version += 1;
}

export type StayOf = (reservationId: string) => LeaseStay | undefined;
