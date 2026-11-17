// MSW mock of FB-INV-012 monthly statements (ARC contract `rounds/round-05/fb-inv-012/contract.md` §4–§5, OpenAPI
// 0.3.14-draft) until the BE PR `r5-fb012-be-statements` ships. Numbers follow DOM-rules BR-LS-01..16 with the INV
// decisions of 17/11: rent of month M in advance, electricity/water/services of M−1, electricity 4.000 đ/kWh + 8 %,
// water 25.000 đ/m³ + 5 % (parameters, OWN), no 200.000 service fee, total rounded DOWN to 1.000 with a "Rounding"
// line, due end of day 05. INV 17/11 "bổ sung": the opening reading is typed every period; the previous closing is
// answered as a reference and the gap (opening − previous closing) is vacancy loss, never billed.
// Every guest, room reading and amount here is made up (no real guest data).
import type { Parameter, Role } from '@ottimo/api-client';
import { http, HttpResponse, type DefaultBodyType, type StrictRequest } from 'msw';
import { businessDayLocal, daysBetween } from '../app/dates';
import {
  lastDayOf,
  meterUsage,
  monthOf,
  shiftMonth,
  type BillingPeriod,
  type BillingPeriodPrint,
  type BillingPeriodSummary,
  type MeterException,
  type MeterReading,
  type MeterType,
  type MeterValue,
  type RecordMeterReadingBody,
  type StatementAction,
  type StatementLine,
  type StatementWarning,
} from '../app/statements';
import type { MockUser } from './seed';

type Guard = { user: MockUser; roles: Role[] } | Response;
interface ReceivingRow {
  bankBin: string;
  accountNo: string;
  accountName: string;
  effectiveFrom: string;
}
interface Ctx {
  guard: (
    request: StrictRequest<DefaultBodyType>,
    allowed: Role[] | 'any',
    opts?: { ifMatch?: number },
  ) => Guard;
  problem: (status: number, code: string, extra?: Record<string, unknown>) => Response;
  params: () => Parameter[];
  receiving: () => ReceivingRow[];
}

const FD_PLUS: Role[] = ['owner', 'manager', 'front_desk_lead', 'front_desk'];
const LEADS: Role[] = ['owner', 'manager', 'front_desk_lead'];
const has = (roles: Role[], set: Role[]) => roles.some((r) => set.includes(r));
const isResponse = (g: Guard): g is Response => g instanceof Response;
const uid = (n: number) => `0192a1b0-0000-7000-8000-${String(n).padStart(12, '0')}`;
const base = '*/v1';
const prop = `${base}/properties/:propertyId`;
const json = (body: unknown, status = 200) =>
  HttpResponse.json(body as Record<string, unknown>, {
    status,
    headers: { 'cache-control': 'no-store' },
  });

/** Defaults of contract §3 (production bootstrap writes no row – the API answers `default_value`). */
export const STATEMENT_PARAM_DEFAULTS = {
  utility_unit_price: { electricityVndPerKwh: 4000, waterVndPerM3: 25000 },
  utility_vat_rate: { electricity: 8, water: 5 },
  monthly_statement_rules: {
    rentTiming: 'advance',
    dueDay: 5,
    totalRoundingVnd: 1000,
    partialFirstMonthRent: 'at_checkin',
    readingWindow: { daysBeforeMonthEnd: 0, daysAfter: 1 },
  },
} as const;

/** The setParameter hook of the billing module (contract §3) – null = valid. */
export function statementParamErrors(key: string, value: unknown): string | null {
  const v = value as Record<string, unknown> | null;
  const int = (x: unknown, min: number, max: number) =>
    typeof x === 'number' && Number.isInteger(x) && x >= min && x <= max;
  if (key === 'utility_unit_price')
    return v && int(v.electricityVndPerKwh, 1, 20_000) && int(v.waterVndPerM3, 1, 200_000)
      ? null
      : 'PARAM_OUT_OF_RANGE';
  if (key === 'utility_vat_rate')
    return v && [v.electricity, v.water].every((x) => [0, 5, 8, 10].includes(x as number))
      ? null
      : 'PARAM_OUT_OF_RANGE';
  if (key === 'monthly_statement_rules')
    return v &&
      ['advance', 'arrears'].includes(v.rentTiming as string) &&
      int(v.dueDay, 1, 28) &&
      [1, 100, 1000].includes(v.totalRoundingVnd as number) &&
      ['at_checkin', 'first_statement'].includes(v.partialFirstMonthRent as string)
      ? null
      : 'PARAM_OUT_OF_RANGE';
  return null;
}

interface LeaseStay {
  reservationId: string;
  folioId: string;
  roomId: string;
  roomNo: string;
  guestDisplayName: string;
  guestFullName: string;
  monthlyRentVnd: number;
  status: 'in_house' | 'checked_out';
}

interface ServiceFolioLine {
  id: string;
  reservationId: string;
  serviceDate: string;
  labelKey: string;
  labelParams: Record<string, string | number>;
  amountVnd: number;
}

interface StoredReading {
  id: string;
  reservationId: string;
  roomId: string;
  roomNo: string;
  kind: MeterReading['kind'];
  periodMonth: string | null;
  readOn: string;
  electricity: { opening: number; value: number; exception: MeterException | null };
  water: { opening: number; value: number; exception: MeterException | null };
  photoAttachmentId: string | null;
  photoWaived: boolean;
  note: string | null;
  readAt: string;
  readByInitials: string;
  voidedAt: string | null;
  voidReason: string | null;
}

interface StoredPeriod {
  id: string;
  reservationId: string;
  month: string;
  kind: 'regular' | 'final';
  status: BillingPeriod['status'];
  code: string | null;
  excludedFolioLineIds: string[];
  priorAdjustment: { amountVnd: number; reason: string } | null;
  replacesId: string | null;
  /** Snapshot at issue (D4: drafts are computed on read). */
  snapshot: Omit<
    BillingPeriod,
    'availableActions' | 'overdueDays' | 'alertLevel' | 'version'
  > | null;
  readingIds: string[];
  paidVnd: number;
  payments: Array<{ method: 'cash' | 'vietqr'; amountVnd: number; reconciliation: string }>;
  issuedAt: string | null;
  paidAt: string | null;
  voidedAt: string | null;
  voidReason: string | null;
  version: number;
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0]!.toUpperCase())
    .join('');

/** Seed relative to the business day so every test date works: month M = this month, P = M − 1. */
function seed() {
  const today = businessDayLocal();
  const M = monthOf(today);
  const P = shiftMonth(M, -1);
  const P2 = shiftMonth(M, -2);
  const stays: LeaseStay[] = [
    {
      reservationId: uid(81_001),
      folioId: uid(82_001),
      roomId: uid(206),
      roomNo: '203',
      guestDisplayName: 'N. Minh',
      guestFullName: 'Nguyễn Minh',
      monthlyRentVnd: 8_500_000,
      status: 'in_house',
    },
    {
      reservationId: uid(81_002),
      folioId: uid(82_002),
      roomId: uid(208),
      roomNo: '302',
      guestDisplayName: 'T. Lan',
      guestFullName: 'Trần Lan',
      monthlyRentVnd: 7_000_000,
      status: 'in_house',
    },
  ];
  const r = (
    n: number,
    stay: LeaseStay,
    kind: StoredReading['kind'],
    periodMonth: string | null,
    readOn: string,
    e: [number, number],
    w: [number, number],
  ): StoredReading => ({
    id: uid(83_000 + n),
    reservationId: stay.reservationId,
    roomId: stay.roomId,
    roomNo: stay.roomNo,
    kind,
    periodMonth,
    readOn,
    electricity: { opening: e[0], value: e[1], exception: null },
    water: { opening: w[0], value: w[1], exception: null },
    photoAttachmentId: uid(84_000 + n),
    photoWaived: false,
    note: null,
    readAt: `${readOn}T09:00:00+07:00`,
    readByInitials: 'H',
    voidedAt: null,
    voidReason: null,
  });
  const readings: StoredReading[] = [
    // Room 203: checked in on day 20 of M−2, closed M−2 at 1.250 kWh / 35,2 m³.
    r(1, stays[0]!, 'checkin', null, `${P2}-20`, [1100, 1100], [30, 30]),
    r(2, stays[0]!, 'period_end', P2, lastDayOf(P2), [1100, 1250], [30, 35.2]),
    // Room 302: closed M−2 at 800 / 20,0 and M−1 is already billed (statement P issued, unpaid → overdue).
    r(3, stays[1]!, 'checkin', null, `${P2}-01`, [640, 640], [12, 12]),
    r(4, stays[1]!, 'period_end', P2, lastDayOf(P2), [640, 800], [12, 20]),
  ];
  const services: ServiceFolioLine[] = [
    {
      id: uid(85_001),
      reservationId: stays[0]!.reservationId,
      serviceDate: `${P}-12`,
      labelKey: 'bill.line.adhoc_cleaning',
      labelParams: { qty: 1 },
      amountVnd: 150_000,
    },
    {
      id: uid(85_002),
      reservationId: stays[0]!.reservationId,
      serviceDate: `${P}-26`,
      labelKey: 'bill.line.adhoc_cleaning',
      labelParams: { qty: 1 },
      amountVnd: 150_000,
    },
  ];
  return { stays, readings, services, periods: [] as StoredPeriod[], seq: 1, M, P };
}

export function createStatementsMock(ctx: Ctx) {
  let st = seed();
  const today = () => businessDayLocal();
  const next = () => ++st.seq;

  /** Effective value of a parameter on `day` (history not modelled – current row, else the contract default). */
  const param = <K extends keyof typeof STATEMENT_PARAM_DEFAULTS>(key: K) =>
    (ctx.params().find((p) => p.key === key)?.value ??
      STATEMENT_PARAM_DEFAULTS[key]) as (typeof STATEMENT_PARAM_DEFAULTS)[K];

  const stayOf = (reservationId: string) => st.stays.find((s) => s.reservationId === reservationId);
  const valid = (x: StoredReading) => !x.voidedAt;

  /** Previous valid reading of the same room before `x` (by read date, then creation). */
  function previousOf(x: StoredReading): StoredReading | undefined {
    const list = st.readings.filter(
      (o) => valid(o) && o.roomId === x.roomId && o.reservationId === x.reservationId,
    );
    const i = list.findIndex((o) => o.id === x.id);
    const before = i >= 0 ? list.slice(0, i) : list;
    return before[before.length - 1];
  }

  function meterView(x: StoredReading, type: MeterType): MeterValue {
    const m = x[type];
    const prevReading = x.kind === 'checkin' ? undefined : previousOf(x);
    const previousClosing = prevReading ? prevReading[type].value : null;
    const rawGap = previousClosing === null ? null : m.opening - previousClosing;
    const gap =
      rawGap === null || rawGap <= 0
        ? null
        : type === 'water'
          ? Math.round(rawGap * 10) / 10
          : rawGap;
    return { ...m, previousClosing, gap, consumption: meterUsage(m, type) };
  }

  const issuedReadingIds = () =>
    new Set(
      st.periods
        .filter((p) => p.status !== 'void' && p.status !== 'draft')
        .flatMap((p) => p.readingIds),
    );

  function readingView(x: StoredReading): MeterReading {
    return {
      ...x,
      electricity: meterView(x, 'electricity'),
      water: meterView(x, 'water'),
      onIssuedStatement: issuedReadingIds().has(x.id),
    };
  }

  const closingReading = (stay: LeaseStay, utilityMonth: string) =>
    st.readings.find(
      (x) =>
        valid(x) &&
        x.reservationId === stay.reservationId &&
        x.kind === 'period_end' &&
        x.periodMonth === utilityMonth,
    );

  const liveLineIds = (exceptPeriodId: string) =>
    new Set(
      st.periods
        .filter((p) => p.id !== exceptPeriodId && p.status !== 'void' && p.snapshot)
        .flatMap((p) => p.snapshot!.lines.map((l) => l.folioLineId).filter(Boolean)),
    );

  /** D4: a draft is computed when read; issuing freezes the result. */
  function compute(p: StoredPeriod) {
    const stay = stayOf(p.reservationId)!;
    const rules = param('monthly_statement_rules');
    const price = param('utility_unit_price');
    const vat = param('utility_vat_rate');
    const utilityMonth = shiftMonth(p.month, -1);
    const rentMonth = rules.rentTiming === 'advance' ? p.month : utilityMonth;
    const rentPeriod = { from: `${rentMonth}-01`, to: lastDayOf(rentMonth) };
    const utilityPeriod = { from: `${utilityMonth}-01`, to: lastDayOf(utilityMonth) };
    const servicePeriod = utilityPeriod;
    const lines: StatementLine[] = [];
    const warnings: StatementWarning[] = [];
    lines.push({
      kind: 'rent',
      labelKey: 'bill.line.monthly_rent',
      labelParams: { from: rentPeriod.from, to: rentPeriod.to },
      quantity: 1,
      unit: 'month',
      unitPriceNetVnd: stay.monthlyRentVnd,
      vatRatePct: null,
      netVnd: stay.monthlyRentVnd,
      vatVnd: 0,
      amountVnd: stay.monthlyRentVnd,
      folioLineId: null,
    });
    const reading = closingReading(stay, utilityMonth);
    const readingIds: string[] = [];
    if (reading) {
      readingIds.push(reading.id);
      const view = readingView(reading);
      for (const type of ['electricity', 'water'] as const) {
        const m = view[type];
        const unit = type === 'electricity' ? price.electricityVndPerKwh : price.waterVndPerM3;
        const rate = vat[type];
        const net = Math.round(m.consumption * unit);
        const v = Math.round((net * rate) / 100);
        lines.push({
          kind: type,
          labelKey: `bill.line.${type}`,
          roomNo: stay.roomNo,
          meter: { from: m.opening, to: m.value, exception: m.exception },
          quantity: m.consumption,
          unit: type === 'electricity' ? 'kwh' : 'm3',
          unitPriceNetVnd: unit,
          vatRatePct: rate,
          netVnd: net,
          vatVnd: v,
          amountVnd: net + v,
          folioLineId: null,
        });
        const threshold = type === 'electricity' ? 300 : 10;
        if (m.consumption > threshold)
          warnings.push({
            code: 'METER_ANOMALY',
            roomNo: stay.roomNo,
            meter: type,
            consumption: m.consumption,
            threshold,
          });
      }
      if (reading.photoWaived) warnings.push({ code: 'PHOTO_WAIVED', roomNo: stay.roomNo });
    }
    const elsewhere = liveLineIds(p.id);
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
      const line: StatementLine = {
        kind: 'service',
        labelKey: s.labelKey,
        labelParams: s.labelParams,
        serviceDate: s.serviceDate,
        quantity: 1,
        unit: 'item',
        unitPriceNetVnd: s.amountVnd,
        vatRatePct: null,
        netVnd: s.amountVnd,
        vatVnd: 0,
        amountVnd: s.amountVnd,
        folioLineId: s.id,
      };
      (p.excludedFolioLineIds.includes(s.id) ? excludedLines : lines).push(line);
    }
    if (p.priorAdjustment)
      lines.push({
        kind: 'prior_adjustment',
        labelKey: 'bill.line.statement_prior_adjustment',
        labelParams: { reason: p.priorAdjustment.reason },
        quantity: 1,
        unit: 'item',
        unitPriceNetVnd: p.priorAdjustment.amountVnd,
        vatRatePct: null,
        netVnd: p.priorAdjustment.amountVnd,
        vatVnd: 0,
        amountVnd: p.priorAdjustment.amountVnd,
        folioLineId: null,
      });
    const netVnd = lines.reduce((s, l) => s + l.netVnd, 0);
    const vatVnd = lines.reduce((s, l) => s + l.vatVnd, 0);
    const gross = netVnd + vatVnd;
    const step = rules.totalRoundingVnd;
    const totalVnd = Math.floor(gross / step) * step;
    const roundingVnd = totalVnd - gross;
    if (roundingVnd !== 0)
      lines.push({
        kind: 'rounding',
        labelKey: 'bill.line.statement_rounding',
        quantity: 1,
        unit: 'item',
        unitPriceNetVnd: roundingVnd,
        vatRatePct: null,
        netVnd: roundingVnd,
        vatVnd: 0,
        amountVnd: roundingVnd,
        folioLineId: null,
      });
    const [y, mo] = p.month.split('-');
    return {
      id: p.id,
      code: p.code,
      status: p.status,
      kind: p.kind,
      month: p.month,
      reservationId: p.reservationId,
      folioId: stay.folioId,
      roomNos: [stay.roomNo],
      guestDisplayName: stay.guestDisplayName,
      rentPeriod,
      utilityPeriod,
      servicePeriod,
      dueDate: `${y}-${mo}-${String(rules.dueDay).padStart(2, '0')}`,
      lines,
      excludedLines,
      priorAdjustment: p.priorAdjustment,
      totals: {
        netVnd,
        vatVnd,
        roundingVnd,
        totalVnd,
        paidVnd: 0,
        balanceVnd: totalVnd,
      },
      warnings,
      replacesId: p.replacesId,
      replacesCode: st.periods.find((o) => o.id === p.replacesId)?.code ?? null,
      issuedAt: null,
      paidAt: null,
      voidedAt: null,
      voidReason: null,
      readingIds,
      hasReading: !!reading,
    };
  }

  /** The computed statement without the mock's own bookkeeping fields. */
  function publicPart(c: ReturnType<typeof compute>) {
    const out: Partial<typeof c> = { ...c };
    delete out.readingIds;
    delete out.hasReading;
    return out as Omit<typeof c, 'readingIds' | 'hasReading'>;
  }

  /** BR-LS-02 / D6: overdue is derived, never stored. */
  function alertOf(p: StoredPeriod, dueDate: string | null) {
    if (!dueDate || (p.status !== 'issued' && p.status !== 'partially_paid'))
      return { overdueDays: 0, alertLevel: null };
    const d = daysBetween(dueDate, today());
    if (d < 0) return { overdueDays: 0, alertLevel: null };
    if (d === 0) return { overdueDays: 0, alertLevel: 'due_today' as const };
    return {
      overdueDays: d,
      alertLevel:
        d >= 10 ? ('escalate' as const) : d >= 3 ? ('alert' as const) : ('overdue' as const),
    };
  }

  function actionsOf(p: StoredPeriod, roles: Role[]): StatementAction[] {
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

  function view(p: StoredPeriod, roles: Role[]): BillingPeriod {
    const body = p.snapshot ?? publicPart(compute(p));
    const totals = {
      ...body.totals,
      paidVnd: p.paidVnd,
      balanceVnd: body.totals.totalVnd - p.paidVnd,
    };
    return {
      ...body,
      status: p.status,
      code: p.code,
      totals,
      issuedAt: p.issuedAt,
      paidAt: p.paidAt,
      voidedAt: p.voidedAt,
      voidReason: p.voidReason,
      ...alertOf(p, body.dueDate),
      availableActions: actionsOf(p, roles),
      version: p.version,
    };
  }

  function summaryOf(p: StoredPeriod, roles: Role[]): BillingPeriodSummary {
    const v = view(p, roles);
    return {
      id: v.id,
      code: v.code,
      roomNos: v.roomNos,
      guestDisplayName: v.guestDisplayName,
      month: v.month,
      totalVnd: v.totals.totalVnd,
      balanceVnd: v.totals.balanceVnd,
      dueDate: v.dueDate,
      status: v.status,
      overdueDays: v.overdueDays,
      alertLevel: v.alertLevel,
    };
  }

  function newPeriod(
    reservationId: string,
    month: string,
    replacesId: string | null,
  ): StoredPeriod {
    return {
      id: uid(86_000 + next()),
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

  function issue(p: StoredPeriod, by: MockUser) {
    const c = compute(p);
    const yymm = p.month.slice(2, 4) + p.month.slice(5, 7);
    const replaced = st.periods.filter(
      (o) =>
        o.reservationId === p.reservationId && o.month === p.month && o.status === 'void' && o.code,
    ).length;
    p.code = `TT-${yymm}-${c.roomNos[0]}${replaced ? `-R${replaced}` : ''}`;
    p.status = 'issued';
    p.issuedAt = new Date().toISOString();
    p.readingIds = c.readingIds;
    p.snapshot = { ...publicPart(c), code: p.code, status: 'issued', issuedAt: p.issuedAt };
    p.version += 1;
    void by;
  }

  // Statement P of room 302 is issued and unpaid (overdue on any day after day 05 of M).
  function seedIssued() {
    const p = newPeriod(st.stays[1]!.reservationId, st.P, null);
    st.periods.push(p);
    // Its closing reading of P.
    st.readings.push({
      ...st.readings[3]!,
      id: uid(83_010),
      periodMonth: st.P,
      readOn: lastDayOf(st.P),
      electricity: { opening: 800, value: 905, exception: null },
      water: { opening: 20, value: 23.4, exception: null },
    });
    // P is billed with the utilities of P−1 (the seed reading 4), so issue it as computed now.
    issue(p, { displayName: 'Hạnh' } as MockUser);
    p.issuedAt = `${st.P}-01T08:30:00+07:00`;
    p.snapshot!.issuedAt = p.issuedAt;
  }
  seedIssued();

  const notLong = () => ctx.problem(422, 'NOT_LONG_STAY');
  const validation = (errors: Array<{ field: string; code: string }>) =>
    ctx.problem(422, 'VALIDATION_FAILED', { errors });
  const idem = new Map<string, unknown>();

  const handlers = [
    http.get(`${prop}/reservations/:reservationId/meter-readings`, ({ request, params }) => {
      const g = ctx.guard(request, FD_PLUS);
      if (isResponse(g)) return g;
      if (!stayOf(String(params.reservationId))) return notLong();
      return json({
        items: st.readings.filter((x) => x.reservationId === params.reservationId).map(readingView),
      });
    }),
    http.post(`${prop}/reservations/:reservationId/meter-readings`, async ({ request, params }) => {
      const g = ctx.guard(request, FD_PLUS);
      if (isResponse(g)) return g;
      const key = request.headers.get('idempotency-key');
      if (!key) return ctx.problem(428, 'PRECONDITION_REQUIRED');
      if (idem.has(key)) return json(idem.get(key), 201);
      const stay = stayOf(String(params.reservationId));
      if (!stay) return notLong();
      if (stay.status !== 'in_house') return ctx.problem(409, 'INVALID_TRANSITION');
      const b = (await request.json()) as RecordMeterReadingBody;
      const errors: Array<{ field: string; code: string }> = [];
      for (const type of ['electricity', 'water'] as const) {
        const m = b[type];
        if (typeof m?.opening !== 'number' || m.opening < 0)
          errors.push({ field: `${type}.opening`, code: 'REQUIRED' });
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
      for (const type of ['electricity', 'water'] as const) {
        const m = b[type];
        if (m.value < m.opening && !m.exception)
          return ctx.problem(422, 'METER_LOWER_THAN_PREVIOUS', {
            meter: type,
            previousValue: m.opening,
            errors: [{ field: `${type}.value`, code: 'METER_LOWER_THAN_PREVIOUS' }],
          });
      }
      const exists = st.readings.some(
        (x) =>
          valid(x) &&
          x.reservationId === stay.reservationId &&
          x.roomId === b.roomId &&
          x.kind === b.kind &&
          (b.kind === 'period_end' ? x.periodMonth === b.periodMonth : x.readOn === b.readOn),
      );
      if (exists) return ctx.problem(409, 'READING_EXISTS');
      const water = (v: number) => Math.floor(v * 10 + 1e-9) / 10;
      const x: StoredReading = {
        id: uid(83_100 + next()),
        reservationId: stay.reservationId,
        roomId: b.roomId,
        roomNo: stay.roomNo,
        kind: b.kind,
        periodMonth: b.periodMonth,
        readOn: b.readOn,
        electricity: {
          opening: Math.floor(b.electricity.opening),
          value: Math.floor(b.electricity.value),
          exception: b.electricity.exception,
        },
        water: {
          opening: water(b.water.opening),
          value: water(b.water.value),
          exception: b.water.exception,
        },
        photoAttachmentId: b.photoAttachmentId,
        photoWaived: !!b.photoWaived,
        note: b.note,
        readAt: new Date().toISOString(),
        readByInitials: initials(g.user.displayName),
        voidedAt: null,
        voidReason: null,
      };
      st.readings.push(x);
      const out = readingView(x);
      idem.set(key, out);
      return json(out, 201);
    }),
    http.post(`${prop}/meter-readings/:readingId/void`, async ({ request, params }) => {
      const g = ctx.guard(request, FD_PLUS);
      if (isResponse(g)) return g;
      const x = st.readings.find((o) => o.id === params.readingId);
      if (!x) return ctx.problem(404, 'NOT_FOUND');
      const { reason } = (await request.json()) as { reason?: string };
      if (String(reason ?? '').trim().length < 3)
        return validation([{ field: 'reason', code: 'REASON_REQUIRED' }]);
      if (x.voidedAt) return ctx.problem(409, 'INVALID_TRANSITION');
      if (issuedReadingIds().has(x.id)) return ctx.problem(409, 'READING_ON_ISSUED_STATEMENT');
      x.voidedAt = new Date().toISOString();
      x.voidReason = String(reason).trim();
      return json(readingView(x));
    }),
    http.get(`${prop}/billing-periods/candidates`, ({ request }) => {
      const g = ctx.guard(request, FD_PLUS);
      if (isResponse(g)) return g;
      const month = new URL(request.url).searchParams.get('month') ?? monthOf(today());
      const utilityMonth = shiftMonth(month, -1);
      const items = st.stays
        .filter((s) => s.status === 'in_house')
        .filter(
          (s) =>
            !st.periods.some(
              (p) =>
                p.reservationId === s.reservationId &&
                p.month === month &&
                p.status !== 'void' &&
                p.status !== 'draft',
            ),
        )
        .map((s) => {
          const rd = closingReading(s, utilityMonth);
          return {
            reservationId: s.reservationId,
            roomId: s.roomId,
            roomNos: [s.roomNo],
            guestDisplayName: s.guestDisplayName,
            readingStatus: !rd
              ? 'missing'
              : rd.electricity.exception || rd.water.exception
                ? 'exception'
                : 'recorded',
            draftBillingPeriodId:
              st.periods.find(
                (p) =>
                  p.reservationId === s.reservationId && p.month === month && p.status === 'draft',
              )?.id ?? null,
          };
        });
      return json({ month, items });
    }),
    http.get(`${prop}/billing-periods`, ({ request }) => {
      const g = ctx.guard(request, FD_PLUS);
      if (isResponse(g)) return g;
      const q = new URL(request.url).searchParams;
      const statuses = q.get('status')?.split(',').filter(Boolean);
      const month = q.get('month');
      const overdue = q.get('overdue') === 'true';
      const roomId = q.get('roomId');
      const items = st.periods
        .filter((p) => !statuses || statuses.includes(p.status))
        .filter((p) => !month || p.month === month)
        .filter((p) => !roomId || stayOf(p.reservationId)?.roomId === roomId)
        .map((p) => summaryOf(p, g.roles))
        .filter((s) => !overdue || s.alertLevel !== null)
        .sort(
          (a, b) => b.month.localeCompare(a.month) || a.roomNos[0]!.localeCompare(b.roomNos[0]!),
        );
      return json({ items, page: { nextCursor: null } });
    }),
    http.post(
      `${prop}/reservations/:reservationId/billing-periods`,
      async ({ request, params }) => {
        const g = ctx.guard(request, FD_PLUS);
        if (isResponse(g)) return g;
        if (!request.headers.get('idempotency-key'))
          return ctx.problem(428, 'PRECONDITION_REQUIRED');
        const stay = stayOf(String(params.reservationId));
        if (!stay) return notLong();
        if (stay.status !== 'in_house') return ctx.problem(409, 'INVALID_TRANSITION');
        const b = (await request.json()) as { month?: string; kind?: string };
        if (!b.month || !/^\d{4}-\d{2}$/.test(b.month))
          return validation([{ field: 'month', code: 'REQUIRED' }]);
        const live = st.periods.find(
          (p) =>
            p.reservationId === stay.reservationId && p.month === b.month && p.status !== 'void',
        );
        if (live) return ctx.problem(409, 'STATEMENT_EXISTS', { billingPeriodId: live.id });
        const replaced = [...st.periods]
          .reverse()
          .find(
            (p) =>
              p.reservationId === stay.reservationId && p.month === b.month && p.status === 'void',
          );
        const p = newPeriod(stay.reservationId, b.month, replaced?.id ?? null);
        st.periods.push(p);
        return json(view(p, g.roles), 201);
      },
    ),
    http.get(`${prop}/billing-periods/:id/print`, ({ request, params }) => {
      const g = ctx.guard(request, FD_PLUS);
      if (isResponse(g)) return g;
      const p = st.periods.find((o) => o.id === params.id);
      if (!p) return ctx.problem(404, 'NOT_FOUND');
      if (p.status === 'draft') return ctx.problem(409, 'INVALID_TRANSITION');
      const v = view(p, g.roles);
      const stay = stayOf(p.reservationId)!;
      const acc = ctx
        .receiving()
        .filter((a) => a.effectiveFrom <= today())
        .at(-1);
      const balance = v.totals.balanceVnd;
      const out: BillingPeriodPrint = {
        ...v,
        property: {
          displayName: 'OTTIMO Boutique Stay',
          addressLine: 'Đà Lạt, Lâm Đồng',
          hotline: '0900 000 000',
          email: 'stay@example.test',
        },
        guest: { fullName: stay.guestFullName },
        vietqr:
          balance > 0 && acc && p.status !== 'void'
            ? {
                payload: buildVietQrPayload(acc.bankBin, acc.accountNo, balance, p.code!),
                bankShortName: 'Vietcombank',
                accountHolder: acc.accountName,
                accountNoMasked: `•••• ${acc.accountNo.slice(-4)}`,
                amountVnd: balance,
                transferContent: p.code!,
              }
            : null,
        printedAt: new Date().toISOString(),
        printedByInitials: initials(g.user.displayName),
      };
      return json(out);
    }),
    http.get(`${prop}/billing-periods/:id`, ({ request, params }) => {
      const g = ctx.guard(request, FD_PLUS);
      if (isResponse(g)) return g;
      const p = st.periods.find((o) => o.id === params.id);
      if (!p) return ctx.problem(404, 'NOT_FOUND');
      return HttpResponse.json(view(p, g.roles) as unknown as Record<string, unknown>, {
        headers: { etag: `"${p.version}"`, 'cache-control': 'no-store' },
      });
    }),
    http.patch(`${prop}/billing-periods/:id`, async ({ request, params }) => {
      const p = st.periods.find((o) => o.id === params.id);
      const g = ctx.guard(request, FD_PLUS, { ifMatch: p?.version ?? 0 });
      if (isResponse(g)) return g;
      if (!p) return ctx.problem(404, 'NOT_FOUND');
      if (p.status !== 'draft') return ctx.problem(409, 'INVALID_TRANSITION');
      const b = (await request.json()) as {
        excludedFolioLineIds?: string[];
        priorAdjustment?: { amountVnd: number; reason: string } | null;
      };
      if (b.priorAdjustment !== undefined) {
        if (!has(g.roles, LEADS)) return ctx.problem(403, 'FORBIDDEN_ACTION');
        if (b.priorAdjustment && String(b.priorAdjustment.reason ?? '').trim().length < 3)
          return validation([{ field: 'priorAdjustment.reason', code: 'REASON_REQUIRED' }]);
        p.priorAdjustment = b.priorAdjustment;
      }
      if (b.excludedFolioLineIds) {
        const c = compute(p);
        const period = [...c.lines, ...c.excludedLines].map((l) => l.folioLineId).filter(Boolean);
        if (b.excludedFolioLineIds.some((id) => !period.includes(id)))
          return validation([{ field: 'excludedFolioLineIds', code: 'NOT_IN_LIST' }]);
        p.excludedFolioLineIds = b.excludedFolioLineIds;
      }
      p.version += 1;
      return json(view(p, g.roles));
    }),
    http.post(`${prop}/billing-periods/:id/issue`, async ({ request, params }) => {
      const p = st.periods.find((o) => o.id === params.id);
      const g = ctx.guard(request, FD_PLUS, { ifMatch: p?.version ?? 0 });
      if (isResponse(g)) return g;
      const key = request.headers.get('idempotency-key');
      if (!key) return ctx.problem(428, 'PRECONDITION_REQUIRED');
      if (idem.has(key)) return json(idem.get(key));
      if (!p) return ctx.problem(404, 'NOT_FOUND');
      if (p.status !== 'draft') return ctx.problem(409, 'INVALID_TRANSITION');
      const { acknowledgeWarnings } = (await request.json()) as { acknowledgeWarnings?: boolean };
      const c = compute(p);
      if (!c.hasReading) return ctx.problem(422, 'METER_READING_MISSING');
      if (c.warnings.length && !acknowledgeWarnings)
        return ctx.problem(422, 'WARNINGS_NOT_ACKNOWLEDGED', { warnings: c.warnings });
      if (c.totals.totalVnd <= 0) return ctx.problem(422, 'AMOUNT_NOT_POSITIVE');
      issue(p, g.user);
      const out = view(p, g.roles);
      idem.set(key, out);
      return json(out);
    }),
    http.post(`${prop}/billing-periods/:id/void`, async ({ request, params }) => {
      const g = ctx.guard(request, FD_PLUS);
      if (isResponse(g)) return g;
      const p = st.periods.find((o) => o.id === params.id);
      if (!p) return ctx.problem(404, 'NOT_FOUND');
      const { reason } = (await request.json()) as { reason?: string };
      const text = String(reason ?? '').trim();
      if (text.length < 3 || text.length > 300)
        return validation([{ field: 'reason', code: 'REASON_REQUIRED' }]);
      if (p.status === 'void') return ctx.problem(409, 'INVALID_TRANSITION');
      if (p.paidVnd > 0) return ctx.problem(409, 'STATEMENT_HAS_PAYMENTS');
      if (p.status !== 'draft' && !has(g.roles, LEADS)) return ctx.problem(403, 'FORBIDDEN_ACTION');
      const wasIssued = p.status !== 'draft';
      p.status = 'void';
      p.voidedAt = new Date().toISOString();
      p.voidReason = text;
      p.version += 1;
      return json({ billingPeriod: view(p, g.roles), canReplace: wasIssued });
    }),
    http.post(`${prop}/billing-periods/:id/payments`, async ({ request, params }) => {
      const g = ctx.guard(request, FD_PLUS);
      if (isResponse(g)) return g;
      const key = request.headers.get('idempotency-key');
      if (!key) return ctx.problem(428, 'PRECONDITION_REQUIRED');
      if (idem.has(key)) return json(idem.get(key), 201);
      const p = st.periods.find((o) => o.id === params.id);
      if (!p) return ctx.problem(404, 'NOT_FOUND');
      if (p.status !== 'issued' && p.status !== 'partially_paid')
        return ctx.problem(409, 'INVALID_TRANSITION');
      const b = (await request.json()) as { method?: string; amountVnd?: number };
      if (b.method !== 'cash' && b.method !== 'vietqr')
        return validation([{ field: 'method', code: 'REQUIRED' }]);
      if (typeof b.amountVnd !== 'number' || !Number.isInteger(b.amountVnd) || b.amountVnd <= 0)
        return validation([{ field: 'amountVnd', code: 'AMOUNT_NOT_POSITIVE' }]);
      const balance = p.snapshot!.totals.totalVnd - p.paidVnd;
      if (b.amountVnd > balance)
        return ctx.problem(422, 'AMOUNT_OVER_BALANCE', {
          max: balance,
          errors: [{ field: 'amountVnd', code: 'AMOUNT_OVER_BALANCE' }],
        });
      p.payments.push({
        method: b.method,
        amountVnd: b.amountVnd,
        reconciliation: b.method === 'vietqr' ? 'pending' : 'n/a',
      });
      p.paidVnd += b.amountVnd;
      p.status = p.paidVnd >= p.snapshot!.totals.totalVnd ? 'paid' : 'partially_paid';
      if (p.status === 'paid') p.paidAt = new Date().toISOString();
      p.version += 1;
      const out = view(p, g.roles);
      idem.set(key, out);
      return json(out, 201);
    }),
  ];

  return {
    handlers,
    reset() {
      st = seed();
      idem.clear();
      seedIssued();
    },
    get state() {
      return st;
    },
  };
}

// ---------- EMVCo / NAPAS VietQR (the server's `buildVietQrPayload`, mock only) ----------
const tlv = (id: string, value: string) => `${id}${String(value.length).padStart(2, '0')}${value}`;

function crc16(s: string): string {
  let crc = 0xffff;
  for (const ch of new TextEncoder().encode(s)) {
    crc ^= ch << 8;
    for (let i = 0; i < 8; i++)
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function buildVietQrPayload(
  bankBin: string,
  accountNo: string,
  amountVnd: number,
  content: string,
): string {
  const merchant = tlv(
    '38',
    tlv('00', 'A000000727') +
      tlv('01', tlv('00', bankBin) + tlv('01', accountNo)) +
      tlv('02', 'QRIBFTTA'),
  );
  const body =
    tlv('00', '01') +
    tlv('01', '12') +
    merchant +
    tlv('53', '704') +
    tlv('54', String(amountVnd)) +
    tlv('58', 'VN') +
    tlv('62', tlv('08', content)) +
    '6304';
  return body + crc16(body);
}

/** Parse the top-level (and `62`) EMVCo tags of a payload – tests read amount and transfer content back. */
export function parseEmv(payload: string): Record<string, string> {
  const out: Record<string, string> = {};
  const walk = (s: string, prefix: string) => {
    let i = 0;
    while (i + 4 <= s.length) {
      const id = s.slice(i, i + 2);
      const len = Number(s.slice(i + 2, i + 4));
      out[prefix + id] = s.slice(i + 4, i + 4 + len);
      i += 4 + len;
    }
  };
  walk(payload, '');
  if (out['62']) walk(out['62'], '62.');
  return out;
}
