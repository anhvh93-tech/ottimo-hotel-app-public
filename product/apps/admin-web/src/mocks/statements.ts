// MSW mock of FB-INV-012 monthly statements (ARC contract `rounds/round-05/fb-inv-012/contract.md` §4–§5, OpenAPI
// 0.3.14-draft on the BE branch + BE-190-01..04) until BE #190 merges. Model in `statements-model.ts`, maths in
// `statements-compute.ts`, meter readings in `statements-meters.ts`. Answers are checked against the OpenAPI
// schemas by `__tests__/fb012-mock-schema.test.ts`. Every guest, reading and amount here is made up.
import type { Parameter, Role } from '@ottimo/api-client';
import { http, HttpResponse, type DefaultBodyType, type StrictRequest } from 'msw';
import { businessDayLocal } from '../app/dates';
import { monthOf, shiftMonth, type BillingPeriodPrint } from '../app/statements';
import {
  LEADS,
  compute,
  has,
  issue,
  newPeriod,
  summaryOf,
  view,
  type Rates,
} from './statements-compute';
import { FD_PLUS, meterHandlers } from './statements-meters';
import {
  initials,
  periodClosing,
  periodOpening,
  seedState,
  statusOf,
  uid,
  type MockState,
  type StoredPeriod,
} from './statements-model';
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
export interface StatementsCtx extends Ctx {
  json: (body: unknown, status?: number) => Response;
}

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
    readingWindow: { daysBeforeMonthEnd: 0, daysAfter: 1, lateMaxDays: 10 },
  },
} as const;

/** The setParameter hook of the billing module (contract §3, BE-190-03 `lateMaxDays` 0–31) – null = valid. */
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
  if (key === 'monthly_statement_rules') {
    const w = (v?.readingWindow ?? {}) as Record<string, unknown>;
    return v &&
      ['advance', 'arrears'].includes(v.rentTiming as string) &&
      int(v.dueDay, 1, 28) &&
      [1, 100, 1000].includes(v.totalRoundingVnd as number) &&
      ['at_checkin', 'first_statement'].includes(v.partialFirstMonthRent as string) &&
      (w.lateMaxDays === undefined || int(w.lateMaxDays, 0, 31))
      ? null
      : 'PARAM_OUT_OF_RANGE';
  }
  return null;
}

export function createStatementsMock(c: Ctx) {
  const ctx: StatementsCtx = { ...c, json };
  let st: MockState = seedState();
  const today = () => businessDayLocal();
  const param = <K extends keyof typeof STATEMENT_PARAM_DEFAULTS>(key: K) =>
    (ctx.params().find((p) => p.key === key)?.value ??
      STATEMENT_PARAM_DEFAULTS[key]) as (typeof STATEMENT_PARAM_DEFAULTS)[K];
  const rates = (): Rates => ({
    rules: param('monthly_statement_rules'),
    price: param('utility_unit_price'),
    vat: param('utility_vat_rate'),
  });
  const readingWindow = () => ({
    ...STATEMENT_PARAM_DEFAULTS.monthly_statement_rules.readingWindow,
    ...param('monthly_statement_rules').readingWindow,
  });
  const stayOf = (id: string) => st.stays.find((s) => s.reservationId === id);
  const viewOf = (p: StoredPeriod, roles: Role[]) => view(st, p, roles, rates(), today());
  const notLong = () => ctx.problem(422, 'NOT_LONG_STAY');
  const validation = (errors: Array<{ field: string; code: string }>) =>
    ctx.problem(422, 'VALIDATION_FAILED', { errors });
  const idem = new Map<string, unknown>();

  // Statement P of room 302 is issued and unpaid (overdue on any day after day 05 of M).
  function seedIssued() {
    const p = newPeriod(st, st.stays[1]!.reservationId, st.P, null);
    st.periods.push(p);
    issue(st, p, rates(), `${st.P}-01T08:30:00+07:00`);
  }
  seedIssued();

  const handlers = [
    ...meterHandlers(ctx, () => st, today, readingWindow, idem, prop),
    http.get(`${prop}/billing-periods/candidates`, ({ request }) => {
      const g = ctx.guard(request, FD_PLUS);
      if (g instanceof Response) return g;
      const month = new URL(request.url).searchParams.get('month') ?? monthOf(today());
      const u = shiftMonth(month, -1);
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
          const opening = statusOf(periodOpening(st, s, u));
          const closing = statusOf(periodClosing(st, s, u));
          const next = st.readings.some(
            (x) =>
              !x.voidedAt &&
              x.reservationId === s.reservationId &&
              x.kind === 'period_start' &&
              x.periodMonth === month,
          );
          return {
            reservationId: s.reservationId,
            reservationCode: s.reservationCode,
            roomNos: [s.roomNo],
            rooms: [
              {
                roomId: s.roomId,
                roomNo: s.roomNo,
                opening,
                closing,
                nextOpening: next ? 'recorded' : 'missing',
              },
            ],
            guestDisplayName: s.guestDisplayName,
            kind: 'regular',
            readingStatus:
              opening === 'missing' || closing === 'missing'
                ? 'missing'
                : opening === 'exception' || closing === 'exception'
                  ? 'exception'
                  : 'recorded',
            draftId:
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
      if (g instanceof Response) return g;
      const q = new URL(request.url).searchParams;
      const statuses = q.get('status')?.split(',').filter(Boolean);
      const month = q.get('month');
      const overdue = q.get('overdue') === 'true';
      const roomId = q.get('roomId');
      const items = st.periods
        .filter((p) => !statuses || statuses.includes(p.status))
        .filter((p) => !month || p.month === month)
        .filter((p) => !roomId || stayOf(p.reservationId)?.roomId === roomId)
        .map((p) => summaryOf(viewOf(p, g.roles)))
        .filter((s) => !overdue || s.alertLevel)
        .sort(
          (a, b) => b.month.localeCompare(a.month) || a.roomNos[0]!.localeCompare(b.roomNos[0]!),
        );
      return json({ items, page: { nextCursor: null } });
    }),
    http.post(
      `${prop}/reservations/:reservationId/billing-periods`,
      async ({ request, params }) => {
        const g = ctx.guard(request, FD_PLUS);
        if (g instanceof Response) return g;
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
        const p = newPeriod(st, stay.reservationId, b.month, replaced?.id ?? null);
        st.periods.push(p);
        return json(viewOf(p, g.roles), 201);
      },
    ),
    http.get(`${prop}/billing-periods/:id/print`, ({ request, params }) => {
      const g = ctx.guard(request, FD_PLUS);
      if (g instanceof Response) return g;
      const p = st.periods.find((o) => o.id === params.id);
      if (!p) return ctx.problem(404, 'NOT_FOUND');
      if (p.status === 'draft') return ctx.problem(409, 'INVALID_TRANSITION');
      const v = viewOf(p, g.roles);
      const stay = stayOf(p.reservationId)!;
      const acc = ctx
        .receiving()
        .filter((a) => a.effectiveFrom <= today())
        .at(-1);
      const balance = v.totals.balanceVnd;
      const out: BillingPeriodPrint = {
        ...v,
        // OpenAPI 0.3.14: the property has no public e-mail column yet – always null.
        property: {
          displayName: 'OTTIMO Boutique Stay',
          addressLine: 'Đà Lạt, Lâm Đồng',
          hotline: '0900 000 000',
          email: null,
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
      if (g instanceof Response) return g;
      const p = st.periods.find((o) => o.id === params.id);
      if (!p) return ctx.problem(404, 'NOT_FOUND');
      return HttpResponse.json(viewOf(p, g.roles) as unknown as Record<string, unknown>, {
        headers: { etag: `"${p.version}"`, 'cache-control': 'no-store' },
      });
    }),
    http.patch(`${prop}/billing-periods/:id`, async ({ request, params }) => {
      const p = st.periods.find((o) => o.id === params.id);
      const g = ctx.guard(request, FD_PLUS, { ifMatch: p?.version ?? 0 });
      if (g instanceof Response) return g;
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
        const cur = compute(st, p, rates()).body;
        const period = [...cur.lines, ...cur.excludedLines]
          .map((l) => l.folioLineId)
          .filter(Boolean);
        if (b.excludedFolioLineIds.some((id) => !period.includes(id)))
          return validation([{ field: 'excludedFolioLineIds', code: 'NOT_IN_LIST' }]);
        p.excludedFolioLineIds = b.excludedFolioLineIds;
      }
      p.version += 1;
      return json(viewOf(p, g.roles));
    }),
    http.post(`${prop}/billing-periods/:id/issue`, async ({ request, params }) => {
      const p = st.periods.find((o) => o.id === params.id);
      const g = ctx.guard(request, FD_PLUS, { ifMatch: p?.version ?? 0 });
      if (g instanceof Response) return g;
      const key = request.headers.get('idempotency-key');
      if (!key) return ctx.problem(428, 'PRECONDITION_REQUIRED');
      if (idem.has(key)) return json(idem.get(key));
      if (!p) return ctx.problem(404, 'NOT_FOUND');
      if (p.status !== 'draft') return ctx.problem(409, 'INVALID_TRANSITION');
      const { acknowledgeWarnings } = (await request.json()) as { acknowledgeWarnings?: boolean };
      const cur = compute(st, p, rates());
      if (!cur.complete)
        return ctx.problem(422, 'METER_READING_MISSING', {
          missingReadings: cur.body.missingReadings,
        });
      if (cur.body.warnings.length && !acknowledgeWarnings)
        return ctx.problem(422, 'WARNINGS_NOT_ACKNOWLEDGED', { warnings: cur.body.warnings });
      if (cur.body.totals.totalVnd <= 0) return ctx.problem(422, 'AMOUNT_NOT_POSITIVE');
      issue(st, p, rates(), new Date().toISOString());
      const out = viewOf(p, g.roles);
      idem.set(key, out);
      return json(out);
    }),
    http.post(`${prop}/billing-periods/:id/void`, async ({ request, params }) => {
      const g = ctx.guard(request, FD_PLUS);
      if (g instanceof Response) return g;
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
      // OpenAPI `BillingPeriodVoided`: the statement, flat, + canReplace.
      return json({ ...viewOf(p, g.roles), canReplace: wasIssued });
    }),
    http.post(`${prop}/billing-periods/:id/payments`, async ({ request, params }) => {
      const g = ctx.guard(request, FD_PLUS);
      if (g instanceof Response) return g;
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
      st.seq += 1;
      const payment = {
        id: uid(87_000 + st.seq),
        method: b.method as 'cash' | 'vietqr',
        amountVnd: b.amountVnd,
        reconciliation: b.method === 'vietqr' ? 'pending' : 'not_needed',
      };
      p.payments.push(payment);
      p.paidVnd += b.amountVnd;
      p.status = p.paidVnd >= p.snapshot!.totals.totalVnd ? 'paid' : 'partially_paid';
      if (p.status === 'paid') p.paidAt = new Date().toISOString();
      p.version += 1;
      // OpenAPI `BillingPeriodPaymentResult`.
      const out = { billingPeriod: viewOf(p, g.roles), payment: { ...payment, status: 'posted' } };
      idem.set(key, out);
      return json(out, 201);
    }),
  ];

  return {
    handlers,
    reset() {
      st = seedState();
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
