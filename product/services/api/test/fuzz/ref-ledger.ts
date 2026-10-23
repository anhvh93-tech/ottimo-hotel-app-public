/**
 * R3-Q30 fuzz – reference ledger (`refLedger`, QA test plan `rounds/round-03/qa/s1-test-plan.md` mục 3.2).
 *
 * INDEPENDENT of the product code on purpose: no import from `src/`. It reads the stored rows (read-only SQL) and
 * recomputes B, R, D, O, W, the write-off sum and the protected limit basis from the DOM definitions in
 * `rounds/round-03/outputs/DOM/s1-money-oracle.md` mục 1 (+ 5.4 BR-433 (d) for the basis). Where the definition
 * needs a judgement the code may have made differently, the choice is written here so the critic can check it
 * against the raw log instead of trusting this file (mục 3.5).
 *
 *   B  còn phải thu (signed) = Σ posted lines − Σ live receipts (succeeded, not reversed, not a security deposit,
 *      not a refund) + Σ refunds paid (refund rows are negative amounts → subtract them)
 *   R  debt recorded in the current cycle = Σ `reservation.debt_on_checkout`.after.debtVnd since the cycle opened
 *   D  reduced since the cycle opened = Σ receipts received at/after the cycle opened (reversed later or not – the
 *      reversal is in R)
 *      + Σ live `debt_write_off` FOC lines posted at/after the cycle opened (posted, not a reversal row, not reversed)
 *   O  open debt = clamp(R − D, 0, max(0, B)); window over (folio `closed` or now ≥ post_checkout_window_until)
 *      → O = max(0, B)
 *   W  = max(0, B) − O
 *   cycle: a debt record while O (just before it) = 0 opens a new cycle (R restarts at that record); otherwise it
 *      adds to the open cycle. O "just before" is computed with the same formula on rows created before the record
 *      (receipts reversed LATER still count as live before their reversal: `updated_at` of a reversed receipt is
 *      taken as its reversal time – [GIẢ ĐỊNH QA], critic checks on the raw log).
 *   basis (BR-433 (d), v0.4.1 – oracle mục 5.4): per night, protected rate = min(live night line price, reference
 *      rate of that night (`stay_night.reference_rate_vnd` – the system price, INPUT data; a late_fee_as_night line
 *      uses the price the system wrote)); a night without a live line protects 0; basis = highest protected night.
 *      From B18: basis = min(basis recomputed on the lines live at checkout, basis now). Computed here from the rows
 *      – NOT read from `folio.limit_basis_checkout_vnd` / `folio_line.limit_ref_vnd` (those are the code's answer).
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

export type Q = (sql: string, args?: unknown[]) => Promise<any[]>;

export interface RawFolio {
  folio: {
    id: string;
    status: string;
    windowUntil: string | null;
    closedAt: string | null;
    settledAt: string | null;
  };
  reservation: {
    id: string;
    checkoutMode: string | null;
    debtDueDate: string | null;
    debtRecordedVnd: number | null;
    debtOpenedAt: string | null;
    actualCheckoutAt: string | null;
  };
  lines: Array<{
    id: string;
    category: string;
    source: string;
    postCheckout: boolean;
    relatedLineId: string | null;
    reversalOfId: string | null;
    approvalRequestId: string | null;
    amountVnd: number;
    unitPriceVnd: number;
    lineState: string;
    postedAt: string;
    serviceDate: string | null;
    referenceRateVnd: number | null;
  }>;
  payments: Array<{
    id: string;
    type: string;
    status: string;
    amountVnd: number;
    reversalOfId: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  debtAudits: Array<{ at: string; id: string; debtVnd: number; dueDate: string | null }>;
  approvals: Array<{
    id: string;
    reasonCode: string;
    status: string;
    amountVnd: number;
    appliedCapVnd: number | null;
    requiredRole: string | null;
    selfApplied: boolean;
    approverRole: string | null;
    focState: string | null;
    autoCancelReason: string | null;
    folioLineId: string | null;
    requestedAt: string;
    limitBasisVnd: number | null;
  }>;
  /** Present only when the table exists (BE-83 / ESC-026 A merged – migration 0082). */
  stayAlerts: Array<{ id: string; alertCount: number; attentionEventId: string | null }> | null;
  ownerNotifications: number | null;
  /** Open "Cần chú ý" items `foc_stay_total_exceeded` of this stay. */
  openAttention: number | null;
}

const num = (v: unknown) => (v === null || v === undefined ? 0 : Number(v));
const iso = (v: unknown) => (v ? new Date(v as string).toISOString() : null);

export async function readRaw(q: Q, folioId: string, reservationId: string): Promise<RawFolio> {
  const [f] = await q(
    `SELECT id, status, post_checkout_window_until, closed_at, settled_at FROM folio WHERE id = $1`,
    [folioId],
  );
  const [r] = await q(
    `SELECT id, checkout_mode, debt_due_date::text AS due, debt_recorded_vnd, debt_opened_at, actual_checkout_at
       FROM reservation WHERE id = $1`,
    [reservationId],
  );
  const lines = await q(
    `SELECT l.id, l.category, l.source, l.post_checkout, l.related_line_id, l.reversal_of_id, l.approval_request_id,
            l.amount_vnd, l.unit_price_vnd, l.line_state, l.posted_at, l.service_date::text AS service_date,
            n.reference_rate_vnd
       FROM folio_line l LEFT JOIN stay_night n ON n.id = l.stay_night_id
      WHERE l.folio_id = $1 ORDER BY l.posted_at, l.id`,
    [folioId],
  );
  const pays = await q(
    `SELECT id, type, status, amount_vnd, reversal_of_id, created_at, updated_at
       FROM payment WHERE folio_id = $1 ORDER BY created_at, id`,
    [folioId],
  );
  const audits = await q(
    `SELECT id, occurred_at, after FROM audit_event
      WHERE action = 'reservation.debt_on_checkout' AND entity_id = $1 ORDER BY occurred_at, id`,
    [reservationId],
  );
  const appr = await q(
    `SELECT a.id, a.reason_code, a.status, a.amount_vnd, a.applied_cap_vnd, a.required_role, a.self_applied,
            a.approver_role_snapshot, a.foc_state, a.auto_cancel_reason, a.folio_line_id, a.requested_at,
            a.limit_basis_vnd
       FROM approval_request a JOIN folio_line l ON l.id = a.folio_line_id
      WHERE l.folio_id = $1 ORDER BY a.requested_at, a.id`,
    [folioId],
  );
  let stayAlerts: RawFolio['stayAlerts'] = null;
  let ownerNotifications: number | null = null;
  let openAttention: number | null = null;
  const [has] = await q(`SELECT to_regclass('foc_stay_alert') IS NOT NULL AS ok`);
  if (has?.ok) {
    stayAlerts = (
      await q(
        `SELECT stay_root_reservation_id AS id, alert_count, attention_event_id FROM foc_stay_alert
          WHERE stay_root_reservation_id = $1`,
        [reservationId],
      )
    ).map((x: any) => ({
      id: x.id,
      alertCount: num(x.alert_count),
      attentionEventId: x.attention_event_id,
    }));
    const [n] = await q(
      `SELECT count(*)::int AS n FROM staff_notification
        WHERE kind = 'foc_stay_total_exceeded' AND ref_id = $1`,
      [reservationId],
    );
    ownerNotifications = n?.n ?? 0;
    const [a] = await q(
      `SELECT count(*)::int AS n FROM attention_event
        WHERE kind = 'foc_stay_total_exceeded' AND ref_id = $1 AND resolved_at IS NULL`,
      [reservationId],
    );
    openAttention = a?.n ?? 0;
  }
  return {
    folio: {
      id: f.id,
      status: f.status,
      windowUntil: iso(f.post_checkout_window_until),
      closedAt: iso(f.closed_at),
      settledAt: iso(f.settled_at),
    },
    reservation: {
      id: r.id,
      checkoutMode: r.checkout_mode,
      debtDueDate: r.due,
      debtRecordedVnd: r.debt_recorded_vnd === null ? null : num(r.debt_recorded_vnd),
      debtOpenedAt: iso(r.debt_opened_at),
      actualCheckoutAt: iso(r.actual_checkout_at),
    },
    lines: lines.map((l: any) => ({
      id: l.id,
      category: l.category,
      source: l.source,
      postCheckout: !!l.post_checkout,
      relatedLineId: l.related_line_id,
      reversalOfId: l.reversal_of_id,
      approvalRequestId: l.approval_request_id,
      amountVnd: num(l.amount_vnd),
      unitPriceVnd: num(l.unit_price_vnd),
      lineState: l.line_state,
      postedAt: iso(l.posted_at)!,
      serviceDate: l.service_date ?? null,
      referenceRateVnd: l.reference_rate_vnd === null ? null : num(l.reference_rate_vnd),
    })),
    payments: pays.map((p: any) => ({
      id: p.id,
      type: p.type,
      status: p.status,
      amountVnd: num(p.amount_vnd),
      reversalOfId: p.reversal_of_id,
      createdAt: iso(p.created_at)!,
      updatedAt: iso(p.updated_at)!,
    })),
    debtAudits: audits.map((a: any) => ({
      id: a.id,
      at: iso(a.occurred_at)!,
      // B18 records the whole amount owed without `debtVnd` (only balanceDueVnd + dueDate) – later records
      // (G-4, J15) carry `debtVnd` = the increase
      debtVnd: num(a.after?.debtVnd ?? a.after?.balanceDueVnd),
      dueDate: a.after?.dueDate ?? null,
    })),
    approvals: appr.map((a: any) => ({
      id: a.id,
      reasonCode: a.reason_code,
      status: a.status,
      amountVnd: num(a.amount_vnd),
      appliedCapVnd: a.applied_cap_vnd === null ? null : num(a.applied_cap_vnd),
      requiredRole: a.required_role,
      selfApplied: !!a.self_applied,
      approverRole: a.approver_role_snapshot,
      focState: a.foc_state,
      autoCancelReason: a.auto_cancel_reason,
      folioLineId: a.folio_line_id,
      requestedAt: iso(a.requested_at)!,
      limitBasisVnd: a.limit_basis_vnd === null ? null : num(a.limit_basis_vnd),
    })),
    stayAlerts,
    ownerNotifications,
    openAttention,
  };
}

export interface RefView {
  B: number;
  R: number;
  D: number;
  O: number;
  W: number;
  windowOver: boolean;
  cycleOpenedAt: string | null;
  /** per debt record: O just before it (for I6) */
  oBeforeRecord: Array<{ at: string; oBefore: number; dueDate: string | null }>;
  writeOffLiveVnd: number;
  writeOffBySubOwnerVnd: number;
  writeOffPendingVnd: number;
  basisVnd: number;
  stayWaiverBySubOwnerVnd: number;
  /** ESC-026 threshold = limit of the highest role below OWN with a waiver applied on the stay (BR-433 (c)). */
  stayThresholdVnd: number | null;
}

/** Receipt alive at `t`: succeeded and not a reversal row, or reversed later than `t` (its updated_at). */
function receiptLiveAt(p: RawFolio['payments'][number], t: string): boolean {
  if (p.reversalOfId) return false;
  if (p.type === 'security_deposit' || p.type === 'refund') return false;
  if (p.createdAt > t) return false;
  if (p.status === 'succeeded') return true;
  if (p.status === 'reversed') return p.updatedAt > t;
  return false;
}

function lineLiveAt(raw: RawFolio, l: RawFolio['lines'][number], t: string): boolean {
  if (l.lineState !== 'posted' || l.reversalOfId || l.postedAt > t) return false;
  const rev = raw.lines.find((x) => x.reversalOfId === l.id);
  return !rev || rev.postedAt > t;
}

function signedBAt(raw: RawFolio, t: string): number {
  let total = 0;
  for (const l of raw.lines) if (l.lineState === 'posted' && l.postedAt <= t) total += l.amountVnd;
  let paid = 0;
  let refunded = 0;
  for (const p of raw.payments) {
    if (p.type === 'refund') {
      if (p.status === 'succeeded' && !p.reversalOfId && p.createdAt <= t) refunded -= p.amountVnd;
      continue;
    }
    if (receiptLiveAt(p, t)) paid += p.amountVnd;
  }
  return total - paid + refunded;
}

const writeOffIds = (raw: RawFolio) =>
  new Set(raw.approvals.filter((a) => a.reasonCode === 'debt_write_off').map((a) => a.id));

/**
 * D counts every receipt RECEIVED in the cycle, also one reversed later: the reversal itself is a debt record
 * (G-4 "phần tăng", in R). Counting it out of D as well would add the same money twice (fuzz FZ-01 seed 1000
 * step 31: reverse a 1.000 receipt → O +2.000). Oracle mục 1 says "khoản thu" without saying which – [GIẢ ĐỊNH QA],
 * card to DOM (FB-R3-QA-DOM-01) to write it in the definition.
 */
function dSince(raw: RawFolio, from: string, t: string): number {
  let d = 0;
  for (const p of raw.payments)
    if (
      p.createdAt >= from &&
      p.createdAt <= t &&
      !p.reversalOfId &&
      p.type !== 'refund' &&
      p.type !== 'security_deposit' &&
      (p.status === 'succeeded' || p.status === 'reversed')
    )
      d += p.amountVnd;
  const wo = writeOffIds(raw);
  for (const l of raw.lines)
    if (
      l.category === 'foc' &&
      l.approvalRequestId &&
      wo.has(l.approvalRequestId) &&
      l.postedAt >= from &&
      lineLiveAt(raw, l, t)
    )
      d += -l.amountVnd;
  // a write-off of an EARLIER cycle undone in this one (its FOC reversed, e.g. A32 void of the line carrying it):
  // the forgiven debt comes back – [GIẢ ĐỊNH QA, FB-R3-QA-DOM-02] (fuzz FZ-01 seed 10094 step 30: code O +13.000)
  for (const l of raw.lines)
    if (
      l.category === 'foc' &&
      l.reversalOfId &&
      l.postedAt >= from &&
      l.postedAt <= t &&
      l.amountVnd > 0
    ) {
      const orig = raw.lines.find((x) => x.id === l.reversalOfId);
      if (orig && orig.approvalRequestId && wo.has(orig.approvalRequestId) && orig.postedAt < from)
        d -= l.amountVnd;
    }
  return d;
}

export function refView(raw: RawFolio, nowIso: string): RefView {
  const B = signedBAt(raw, nowIso);
  const windowOver =
    raw.folio.status === 'closed' || (!!raw.folio.windowUntil && nowIso >= raw.folio.windowUntil);
  let cycleOpenedAt: string | null = null;
  let R = 0;
  const oBeforeRecord: RefView['oBeforeRecord'] = [];
  for (const a of raw.debtAudits) {
    // O just before this record (same formula on the rows of that moment; t − 1 ms)
    const tBefore = new Date(new Date(a.at).getTime() - 1).toISOString();
    const bBefore = signedBAt(raw, tBefore);
    const oBefore =
      cycleOpenedAt === null
        ? 0
        : Math.max(0, Math.min(R - dSince(raw, cycleOpenedAt, tBefore), Math.max(0, bBefore)));
    oBeforeRecord.push({ at: a.at, oBefore, dueDate: a.dueDate });
    if (oBefore === 0) {
      cycleOpenedAt = a.at;
      R = a.debtVnd;
    } else R += a.debtVnd;
  }
  const D = cycleOpenedAt ? dSince(raw, cycleOpenedAt, nowIso) : 0;
  const O = windowOver
    ? Math.max(0, B)
    : cycleOpenedAt
      ? Math.max(0, Math.min(R - D, Math.max(0, B)))
      : 0;
  const W = Math.max(0, B) - O;

  // write-offs: live FOC lines of debt_write_off approvals
  const wo = raw.approvals.filter((a) => a.reasonCode === 'debt_write_off');
  let writeOffLiveVnd = 0;
  let writeOffBySubOwnerVnd = 0;
  for (const a of wo) {
    const live = raw.lines
      .filter(
        (l) => l.category === 'foc' && l.approvalRequestId === a.id && lineLiveAt(raw, l, nowIso),
      )
      .reduce((s, l) => s - l.amountVnd, 0);
    writeOffLiveVnd += live;
    if (a.approverRole && a.approverRole !== 'owner') writeOffBySubOwnerVnd += live;
  }
  const writeOffPendingVnd = wo
    .filter((a) => a.status === 'pending' || a.status === 'escalated')
    .reduce((s, a) => s + a.amountVnd, 0);

  // BR-433 (d) protected basis
  const basisVnd = basisAt(raw, nowIso);

  // ESC-026 Σ on the stay by roles below OWN: live FOC lines approved by a non-owner (any reason)
  let stayWaiverBySubOwnerVnd = 0;
  for (const a of raw.approvals) {
    if (!a.approverRole || a.approverRole === 'owner') continue;
    stayWaiverBySubOwnerVnd += raw.lines
      .filter(
        (l) => l.category === 'foc' && l.approvalRequestId === a.id && lineLiveAt(raw, l, nowIso),
      )
      .reduce((s, l) => s - l.amountVnd, 0);
  }
  const rank: Record<string, number> = { front_desk: 1, front_desk_lead: 2, manager: 3 };
  let top = 0;
  for (const a of raw.approvals)
    if (a.status === 'approved' && a.approverRole && rank[a.approverRole])
      top = Math.max(top, rank[a.approverRole]!);
  // BR-433 (c): MGR → basis; FDL → 300.000; FD → 100.000 (BR mục 13 defaults – DS-E seed)
  const stayThresholdVnd = top === 3 ? basisVnd : top === 2 ? 300_000 : top === 1 ? 100_000 : null;
  return {
    B,
    R,
    D,
    O,
    W,
    windowOver,
    cycleOpenedAt,
    oBeforeRecord,
    writeOffLiveVnd,
    writeOffBySubOwnerVnd,
    writeOffPendingVnd,
    basisVnd,
    stayWaiverBySubOwnerVnd,
    stayThresholdVnd,
  };
}

/** BR-433 (d) limit basis at instant `t` (B18 snapshot rule included). */
export function basisAt(raw: RawFolio, t: string): number {
  const now = protectedBasisAt(raw, t);
  const out = raw.reservation.actualCheckoutAt;
  return out && out <= t ? Math.min(protectedBasisAt(raw, out), now) : now;
}

/** Live amount of the FOC line(s) of approval `id` at `t`. */
export function appliedAt(raw: RawFolio, id: string, t: string): number {
  return raw.lines
    .filter((l) => l.category === 'foc' && l.approvalRequestId === id && lineLiveAt(raw, l, t))
    .reduce((s, l) => s - l.amountVnd, 0);
}

/** Highest protected night rate with the lines live at `t` (BR-433 (d)). */
function protectedBasisAt(raw: RawFolio, t: string): number {
  const nightCats = new Set(['room', 'late_fee_as_night']);
  const byNight = new Map<string, { ref: number; live: number | null }>();
  for (const l of raw.lines) {
    if (!nightCats.has(l.category) || l.amountVnd <= 0 || l.reversalOfId || l.postedAt > t)
      continue;
    const key = `${l.category}:${l.serviceDate ?? l.id}`;
    const cur = byNight.get(key) ?? { ref: 0, live: null };
    // reference: the night's system reference rate; a late_fee_as_night line: the price the system wrote
    const ref =
      l.referenceRateVnd ?? (l.source === 'system' && !l.relatedLineId ? l.unitPriceVnd : 0);
    cur.ref = Math.max(cur.ref, ref);
    if (lineLiveAt(raw, l, t)) cur.live = Math.max(cur.live ?? 0, l.unitPriceVnd);
    byNight.set(key, cur);
  }
  let best = 0;
  // BR-433 (a): "đêm `room` còn sống … không có đêm nào → chờ OWN": a night without a live line protects nothing
  // (critic s1-money-critic M-2 – fuzz run 1 had read this right; QA's FB-R3-QA-DOM-02 point 1 is withdrawn)
  for (const n of byNight.values())
    best = Math.max(best, n.live === null ? 0 : Math.min(n.ref, n.live));
  return best;
}

/** Business date (BR-010): Asia/Ho_Chi_Minh, the day changes at 06:00. */
export function businessDate(isoTs: string, rollover = 6): string {
  const local = new Date(new Date(isoTs).getTime() + 7 * 3600_000 - rollover * 3600_000);
  return local.toISOString().slice(0, 10);
}

export function addDaysIso(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
