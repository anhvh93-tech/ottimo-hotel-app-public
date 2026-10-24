/**
 * R3-Q30 fuzz – invariants I1–I16 (DOM oracle mục 8 + mục 5.4 I16; SEC `reviews/s1-SEC-on-BE-B.md` "Ca QA phải đưa
 * vào fuzz" #2–#4). Checked after EVERY step. Each check returns the violations it found (empty = pass); a violation
 * is a money bug P0 until DOM + ARC show the invariant is wrong (oracle mục 0.1) – the harness never "fixes" it.
 *
 * Gating: I8, I13, I16 and the alert part of SEC #4 read BE-83 / ESC-026 A behaviour (lượt kiểm tiền bước 4). They
 * run only with FUZZ_BE83=1 (set once BE-B merges step 4 with the FB-R3-SEC-BE-B-07 fix) – before that main has the
 * R2 per-request limit and they would report the known gap, not a regression.
 * Not covered here (logged as "not checked"): I12 commission (needs CTV stays + reconciliation – family FZ-01 with
 * FUZZ_CTV=1 only), I14 serial equivalence beyond "invariants + ref O hold after the race" (see runner).
 */
import {
  type RawFolio,
  type RefView,
  addDaysIso,
  appliedAt,
  basisAt,
  businessDate,
} from './ref-ledger';

export interface CodeView {
  /** Folio.totals.unhandledCreditVnd (credit not yet routed to a refund request) */
  unhandledCreditVnd?: number;
  dueVnd: number;
  creditVnd: number;
  folioStatus: string;
  openDebtVnd: number | null;
  openDebtDueDate: string | null;
}

export interface StepCtx {
  op: string;
  status: number;
  code?: string;
  /** For A32 reductions: the reduction asked and W just before (I7). */
  a32?: {
    reduceVnd: number;
    wBefore: number;
    oBefore: number;
    windowOverBefore: boolean;
    closedBefore: boolean;
    /** ARC BUG012-02 (b): the API's own O and the (order-free) B just before the step – I7 judges on these. */
    apiOBefore?: number;
    bBefore?: number;
  };
  /** A sequential refund pay-out (I23): the request, the amount sent, what was left of it, the credit and B before. */
  refundPay?: {
    id: string;
    amountVnd: number;
    leftVnd: number;
    creditVnd: number;
    bBefore: number;
  };
  /** Refund requests before the step (I19: which ones a replacement replaced). */
  refundsBefore?: RawFolio['refunds'];
  /** The step was one op (not a race): I19 links a replacement to what the step superseded only then. */
  sequential?: boolean;
  /** Raw credit (max(0, −B)) just before the step. */
  creditBefore?: number;
  /** A sequential refund pay-out / destination change: who did it (I25 – SELF_REFUND_FORBIDDEN, ARC 13.4 point 2). */
  refundActor?: { userId: string; kind: 'pay' | 'destination' };
  /** The step was a money op done by a person on a settled folio – K11-06: 'payment' (collect, confirm a QR) or
   *  'a32' (reduction; asks only for ITS part – FZ02-8 min rule). */
  humanMoneyOnSettled?: 'payment' | 'a32';
  /** Folio.totals.unhandledCreditVnd just before the step. */
  unhandledBefore?: number;
  /** user id → role of the fixture accounts (who did what) */
  roleOf?: Record<string, string>;
  /** Chain started from a pre-0076 debt (210): `debt_recorded_vnd` holds X + new records (ARC 5.2), not Σ audits. */
  legacyCycle?: boolean;
  /**
   * A race of a debt-recording op with a reducing op happened in this chain (same fake instant): the reference
   * cannot order the two rows, so cycle-dependent checks (I3, I5, I6) become warnings ("?") for the rest of the
   * chain – the critic orders them from the raw log.
   */
  ambiguousOrder?: boolean;
  /** For a debt_write_off apply: O just before (I4). */
  writeOff?: { appliedVnd: number | null; oBefore: number };
  /** Debt records that existed before this step (I5/I6 only judge the new ones). */
  auditsBefore: number;
  /** The chain's own B18 with an explicit due date (I6 exempt for that one record). */
  b18ExplicitDueAt?: string | null;
  /** Due dates the chain itself typed at B18 (`debt.dueDate`) – I6 does not judge those records. */
  explicitDueDates?: string[];
  /**
   * Limit basis of each approval as the reference computed it AT THE STEP that created it (`stay_night` reference
   * rates are rewritten in place by B14/B7, so a later recomputation of an earlier instant is not reliable).
   */
  basisAtCreate?: Map<string, number>;
  http5xx: boolean;
}

/** `inv` ending in "?" = warning for the critic (not a failure): see `ambiguousOrder`, the J15 gap, 210 N-7. */
export interface Violation {
  inv: string;
  msg: string;
}
export const isWarning = (v: Violation) => v.inv.endsWith('?');

export interface Gates {
  be83: boolean;
  /** R3-Q23 (FB-R2-ARC-BE-S4-17, lượt tiền bước 6c): pending write-offs auto-cancelled `debt_cleared` in the SAME
   *  transaction that brings O to 0. Until merged (fixture BR-525-41 `pendingFix`), I9 is a warning. */
  q23?: boolean;
  /** BR-433 (e) v0.4.3 (SEC FZ-02): post-checkout A32 reductions = waivers – auto refund "Tự sinh từ A32", Σ > basis
   *  → OWN, counted in ESC-026 (I17). Until BE-B merges it, I17 is a warning. */
  fz02?: boolean;
  /** ARC 0.3.8 addendum 3 (FUZZ-01, K11-06): a HUMAN money op leaving credit on a settled folio creates the refund
   *  request in the same transaction. Until merged, the check is a warning. */
  k1106?: boolean;
  /** ADD3-01 (ARC + SEC Blocker, ORC 24/10): I18 – every refund of a settled folio with a post-checkout A32
   *  reduction below OWN is routed by the folio. Until BE-B merges it, I18 is a warning. */
  add3?: boolean;
}

export function check(
  raw: RawFolio,
  ref: RefView,
  code: CodeView,
  ctx: StepCtx,
  nowIso: string,
  g: Gates,
): Violation[] {
  const v: Violation[] = [];
  const add = (inv: string, msg: string) => v.push({ inv, msg });
  const codeB = code.dueVnd - code.creditVnd;
  const O = code.openDebtVnd ?? 0;
  const maxB = Math.max(0, codeB);

  // I15 sổ cân – the reference B (rows) = the API's B (totals); no line ever deleted is checked by the runner
  if (ref.B !== codeB) add('I15', `B rows ${ref.B} ≠ API ${codeB}`);
  // I1, I2
  const W = maxB - O;
  if (O < 0 || O > maxB) add('I2', `O ${O} outside [0, max(0,B) ${maxB}]`);
  if (W < 0) add('I2', `W ${W} < 0`);
  // J15 gap (208-F / N-15): past the window, J15 not run yet (≤ 1 h, the runner models the hourly job) – the API
  // reads O from the debt cycle, the definition says max(0, B): warning, card FB-R3-QA-ARC-01
  // only while J15 is not due yet (the runner runs it hourly): past window + 60 min a settled folio is a breach –
  // critic s1-money-critic-final B-1 showed J15 itself answering `waiting_refund` for ever (BUG-R3-012)
  const gap =
    ref.windowOver &&
    code.folioStatus !== 'closed' &&
    !!raw.folio.windowUntil &&
    new Date(nowIso).getTime() < new Date(raw.folio.windowUntil).getTime() + 60 * 60_000;
  const soft = (inv: string, when: boolean) => (when ? `${inv}?` : inv);
  if (ref.windowOver && W !== 0)
    add(
      soft('I1', gap),
      `window over but W = ${W} (O ${O}, B ${codeB})${gap ? ' – J15 not run yet' : ''}`,
    );
  // I3 – code O = reference O
  if (O !== ref.O)
    add(
      soft('I3', !!ctx.ambiguousOrder || gap || !!ctx.legacyCycle),
      `openDebtVnd ${O} ≠ ref ${ref.O} (R ${ref.R}, D ${ref.D}, B ${ref.B})` +
        (ctx.ambiguousOrder ? ' – race at one instant, critic orders it from the log' : '') +
        (ctx.legacyCycle
          ? ' – FZ-08 known: pre-0076 debt uses the legacy formula (ARC s1-ARC-on-fuzz-fixes, P3, not counted in G1)'
          : ''),
    );
  // I4
  if (code.folioStatus === 'closed' && codeB < 0) add('I4', `closed folio with credit ${-codeB}`);
  if (ctx.writeOff?.appliedVnd != null && ctx.writeOff.appliedVnd > ctx.writeOff.oBefore)
    add('I4', `write-off applied ${ctx.writeOff.appliedVnd} > O before ${ctx.writeOff.oBefore}`);
  // I5 – Σ audits of the current cycle = debt_recorded_vnd = R
  if (ref.cycleOpenedAt && !ctx.legacyCycle) {
    const cycleSum = raw.debtAudits
      .filter((a) => a.at >= ref.cycleOpenedAt!)
      .reduce((s, a) => s + a.debtVnd, 0);
    if (raw.reservation.debtRecordedVnd !== null && raw.reservation.debtRecordedVnd !== cycleSum)
      add(
        soft('I5', !!ctx.ambiguousOrder),
        `debt_recorded_vnd ${raw.reservation.debtRecordedVnd} ≠ Σ cycle audits ${cycleSum}`,
      );
    if (cycleSum !== ref.R)
      add(soft('I5', !!ctx.ambiguousOrder), `Σ cycle audits ${cycleSum} ≠ R ${ref.R}`);
  }
  // I6 – due date of each NEW record
  for (let i = ctx.auditsBefore; i < ref.oBeforeRecord.length; i++) {
    const r = ref.oBeforeRecord[i]!;
    if (ctx.b18ExplicitDueAt && r.at === ctx.b18ExplicitDueAt) continue;
    if (r.dueDate && ctx.explicitDueDates?.includes(r.dueDate) && i === 0) continue;
    if (r.oBefore > 0) {
      const prev = ref.oBeforeRecord[i - 1]?.dueDate ?? null;
      if (prev && r.dueDate && r.dueDate !== prev)
        add(
          soft('I6', !!ctx.ambiguousOrder),
          `record at ${r.at} with O ${r.oBefore} > 0 moved the due date ${prev} → ${r.dueDate}`,
        );
    } else {
      const want = addDaysIso(businessDate(r.at), 3);
      if (r.dueDate && r.dueDate !== want)
        add(
          soft('I6', !!ctx.ambiguousOrder),
          `new cycle at ${r.at}: due ${r.dueDate} ≠ business date + 3 = ${want}`,
        );
    }
  }
  // I7 – A32 reduction on settled allowed ⇔ reduction ≤ W and window not over. ARC BUG012-02 (b): W is the API's
  // own (max(0, B) − openDebtVnd read just before the step) – I7 is about the decision on the state the API has, not
  // about the order of history (a race the reference ordered the other way is I3's business: FZ-02 seed 1006 #29 was
  // a harness ordering fault, ARC s1-ARC-on-bug-012-013 (3)). When the reference W disagrees, a "?" note for the critic.
  if (ctx.a32) {
    const apiO = ctx.a32.apiOBefore ?? ctx.a32.oBefore;
    const apiW =
      ctx.a32.bBefore !== undefined ? Math.max(0, ctx.a32.bBefore) - apiO : ctx.a32.wBefore;
    const allowedBy = (o: number, w: number) =>
      !ctx.a32!.closedBefore && !ctx.a32!.windowOverBefore && (o === 0 || ctx.a32!.reduceVnd <= w);
    const allowed = allowedBy(apiO, apiW);
    const refAllowed = allowedBy(ctx.a32.oBefore, ctx.a32.wBefore);
    const ok = ctx.status >= 200 && ctx.status < 300;
    // O = 0 → as a stay without debt (oracle 208 rule); 403 = role gate (FD), 412 = stale If-Match: not I7
    const roleOrStale = ctx.status === 403 || ctx.status === 412;
    // 210: a debt written before 0076 keeps the old N-7 (no reduction while it is open – SEC-01 b): warning only
    if (allowed && !ok && !roleOrStale)
      add(
        soft('I7', !!ctx.legacyCycle),
        `A32 −${ctx.a32.reduceVnd} ≤ W ${apiW} (API O ${apiO}) refused ${ctx.status} ${ctx.code ?? ''}`,
      );
    if (!allowed && ok)
      add(
        'I7',
        `A32 −${ctx.a32.reduceVnd} > W ${apiW} (API O ${apiO}, or window over) accepted ${ctx.status}`,
      );
    if (allowed !== refAllowed && (ok || !roleOrStale))
      add(
        'I7?',
        `reference W ${ctx.a32.wBefore} (O ${ctx.a32.oBefore}) ≠ API W ${apiW} (O ${apiO}): API decision judged on its own W – O itself is I3`,
      );
    // I11 – closed ⇒ every A32 → 409
    if (ctx.a32.closedBefore && ok) add('I11', `A32 on a closed folio accepted ${ctx.status}`);
  }
  // I9 – no pending write-off when O = 0
  if (O === 0) {
    const pend = raw.approvals.filter(
      (a) =>
        a.reasonCode === 'debt_write_off' && (a.status === 'pending' || a.status === 'escalated'),
    );
    if (pend.length)
      add(
        g.q23 ? 'I9' : 'I9?',
        `O = 0 but ${pend.length} debt_write_off request(s) still pending${g.q23 ? '' : ' – R3-Q23 not merged (BR-525-41 pendingFix)'}`,
      );
  }
  // I10 – approved ⇒ FOC line exists (live, or cancelled with a reason)
  for (const a of raw.approvals.filter((x) => x.status === 'approved')) {
    const lines = raw.lines.filter((l) => l.category === 'foc' && l.approvalRequestId === a.id);
    if (
      !lines.length &&
      a.focState !== 'cancelled' &&
      a.focState !== 'dormant' &&
      a.focState !== 'paused'
    )
      add('I10', `approved ${a.id} without FOC line (foc_state ${a.focState})`);
  }
  // I14 – no 5xx (deadlocks are counted by the runner per chain)
  if (ctx.http5xx) add('I14', `${ctx.op} answered ${ctx.status}`);

  if (g.be83) be83(raw, ref, v, nowIso, ctx.basisAtCreate, g, ctx.roleOf);
  refundChecks(raw, ref, code, ctx, v, g);
  i18(raw, v, g);
  bug012Checks(raw, ref, code, ctx, nowIso, v);
  return v;
}

const SUB_OWNER = new Set(['front_desk', 'front_desk_lead', 'manager']);
const RANK: Record<string, number> = { front_desk: 1, front_desk_lead: 2, manager: 3 };

/**
 * BE-83 / ESC-026 A / BR-433 (d) (lượt kiểm tiền bước 4) – SEC "Ca QA đưa vào fuzz" (cập nhật) #1, #2, #4, #5:
 * - I8: a debt_write_off request that makes Σ (applied + pending) of the folio exceed the basis of its moment has
 *   required_role = owner (pending), never self-applied by a role below OWN.
 * - I16 (FB-07): replaying the applies in order, Σ write-off applied by roles below OWN ≤ basis AT EACH APPLY,
 *   unless OWN got `foc_stay_total_exceeded`; the basis the code stored on a request (`limit_basis_vnd`) is never
 *   above the protected basis of its moment.
 * - I13 / S1-11: replaying the applies, Σ stay waivers below OWN > threshold of that moment ⇒ OWN notified and
 *   exactly one open "Cần chú ý" item for the stay (the fuzz never resolves items).
 * - FB-09 (observation only, SEC): Σ now above the basis/threshold NOW (basis lowered after the applies) → warning.
 */
function be83(
  raw: RawFolio,
  ref: RefView,
  v: Violation[],
  nowIso: string,
  created?: Map<string, number>,
  g?: Gates,
  roleOf?: Record<string, string>,
): void {
  const basisOf = (id: string, t: string) => created?.get(id) ?? basisAt(raw, t);
  const add = (inv: string, msg: string) => v.push({ inv, msg });
  const told = (raw.ownerNotifications ?? 0) > 0;
  const applied = raw.approvals
    .filter((a) => a.status === 'approved' && a.approverRole && SUB_OWNER.has(a.approverRole))
    .sort((p, q) => (p.requestedAt < q.requestedAt ? -1 : 1));
  // the stored basis of every request ≤ protected basis of its moment
  for (const a of raw.approvals)
    if (a.limitBasisVnd !== null && a.limitBasisVnd > basisOf(a.id, a.requestedAt))
      add(
        'I16',
        `request ${a.id} stored basis ${a.limitBasisVnd} > protected ${basisOf(a.id, a.requestedAt)}`,
      );
  // I8 – requests above the basis wait for OWN
  for (const a of raw.approvals.filter((x) => x.reasonCode === 'debt_write_off')) {
    if (a.status !== 'pending' && a.status !== 'escalated') continue;
    const before = applied
      .filter((x) => x.reasonCode === 'debt_write_off' && x.requestedAt <= a.requestedAt)
      .reduce((s2, x) => s2 + appliedAt(raw, x.id, a.requestedAt), 0);
    if (before + a.amountVnd > basisOf(a.id, a.requestedAt) && a.requiredRole !== 'owner')
      add('I8', `request ${a.id} above the basis but required_role = ${a.requiredRole}`);
  }
  // debt_write_off never routed or approved below MGR (SEC fuzz-fixes #3, FB-R3-SEC-FZ-01; BUG-R3-003)
  for (const a of raw.approvals.filter((x) => x.reasonCode === 'debt_write_off')) {
    if (a.requiredRole && RANK[a.requiredRole] !== undefined && RANK[a.requiredRole]! < 3)
      add('I8', `debt_write_off ${a.id} routed to ${a.requiredRole}`);
    if (a.status === 'approved' && a.approverRole && RANK[a.approverRole]! < 3)
      add('I8', `debt_write_off ${a.id} approved by ${a.approverRole}`);
  }
  // I16 + I13 replay; BR-433 (e): post-checkout A32 reductions by roles below OWN count in Σ lượt. Each event is
  // judged with the amounts AS THEY WERE at that event (an FOC re-posted later by A32 is not an apply – fuzz final
  // run 24/10, FZ-10 63009 / FZ-11 63000).
  type W = { t: string; role: string; wo: boolean; id?: string; red?: number };
  const items: W[] = applied.map((a) => ({
    t: a.requestedAt,
    role: a.approverRole!,
    wo: a.reasonCode === 'debt_write_off',
    id: a.id,
  }));
  const out = raw.reservation.actualCheckoutAt;
  if (g?.fz02 && out)
    for (const r of raw.a32Reductions)
      if (r.at >= out && r.role && SUB_OWNER.has(r.role))
        items.push({ t: r.at, role: r.role, wo: false, red: r.reducedVnd });
  items.sort((p, q) => (p.t < q.t ? -1 : 1));
  void roleOf;
  let crossed = false;
  let top = 0;
  for (let k = 0; k < items.length; k++) {
    const it = items[k]!;
    const t = it.t;
    top = Math.max(top, RANK[it.role] ?? 0);
    const upTo = items.slice(0, k + 1);
    const woSum = upTo
      .filter((x) => x.wo && x.id)
      .reduce((s2, x) => s2 + appliedAt(raw, x.id!, t), 0);
    const staySum = upTo.reduce((s2, x) => s2 + (x.id ? appliedAt(raw, x.id, t) : (x.red ?? 0)), 0);
    const basis = it.id ? basisOf(it.id, t) : basisAt(raw, t);
    if (it.wo && woSum > basis && !told)
      add(
        'I16',
        `Σ write-off below OWN ${woSum} > basis ${basis} at ${t} (${it.id}), OWN not told`,
      );
    const threshold = top === 3 ? basis : top === 2 ? 300_000 : 100_000;
    if (staySum > threshold) crossed = true;
  }
  if (crossed) {
    if (!told)
      add('I13', `Σ stay (by roles below OWN) crossed its threshold at an apply, OWN not told`);
    if (raw.openAttention !== null && raw.openAttention !== 1)
      add(
        'I13',
        `Σ stay crossed its threshold, ${raw.openAttention} open attention item(s) (want 1)`,
      );
  }
  // FB-09 observation: above the basis / threshold of NOW only
  if (
    !crossed &&
    ref.stayThresholdVnd !== null &&
    ref.stayWaiverBySubOwnerVnd > ref.stayThresholdVnd
  )
    add(
      'FB09?',
      `Σ stay ${ref.stayWaiverBySubOwnerVnd} > threshold now ${ref.stayThresholdVnd} after the basis went down`,
    );
  if (ref.writeOffBySubOwnerVnd > ref.basisVnd && !told && !v.some((x) => x.inv === 'I16'))
    add(
      'FB09?',
      `Σ write-off ${ref.writeOffBySubOwnerVnd} > basis now ${ref.basisVnd} after the basis went down`,
    );
  void nowIso;
}

/**
 * Refunds after check-out (BUG-R3-002 fix, ARC addendum 3 – K11-06, BR-433 (e) v0.4.3 / I17, SEC fuzz-fixes #1–#2):
 * - I4+: a settled folio never keeps unhandled credit after a money op done by a person (the refund request is
 *   created in the same transaction); credit from a path without a person → J15 waits + closed_reservation_credit.
 * - I17: every refund request born from an A32 reduction: requested_by = the person of the A32, reason_note starts
 *   "Tự sinh từ A32"; Σ of those (not rejected/cancelled/superseded) > basis ⇒ required_role = owner.
 * - a refund request is never approved by its requester, nor by a role below MGR.
 */
export const isA32Refund = (r: RawFolio['refunds'][number]) =>
  r.source === 'a32' || (r.source === null && (r.reasonNote ?? '').startsWith('Tự sinh từ A32'));

function refundChecks(
  raw: RawFolio,
  ref: RefView,
  code: CodeView,
  ctx: StepCtx,
  v: Violation[],
  g: Gates,
): void {
  const add = (inv: string, msg: string) => v.push({ inv, msg });
  const unhandled = code.unhandledCreditVnd ?? 0;
  const ok2xx = ctx.status >= 200 && ctx.status < 300;
  // K11-06 (ARC addendum 3) with the min rule (FZ02-8, ARC + DOM): a receipt asks for ALL the unhandled credit;
  // an A32 reduction asks only for its own part → unhandled credit never grows through it. A refused step (4xx) is
  // not judged (BE-B s1-be-b 13 point 1).
  if (
    raw.folio.status === 'settled' &&
    ok2xx &&
    ctx.humanMoneyOnSettled === 'payment' &&
    unhandled > 0
  )
    add(
      g.k1106 ? 'I4' : 'I4?',
      `settled folio keeps ${unhandled} credit without a refund request after "${ctx.op}"${g.k1106 ? '' : ' – K11-06 not merged'}`,
    );
  if (
    raw.folio.status === 'settled' &&
    ok2xx &&
    ctx.humanMoneyOnSettled === 'a32' &&
    unhandled > (ctx.unhandledBefore ?? 0)
  )
    add(
      g.k1106 ? 'I4' : 'I4?',
      `A32 "${ctx.op}" left unhandled credit ${ctx.unhandledBefore ?? 0} → ${unhandled} (its own part must be requested)`,
    );
  if (
    raw.folio.status === 'settled' &&
    ref.windowOver &&
    unhandled > 0 &&
    raw.creditAttentionOpen === 0
  )
    add(
      'I4',
      `window over, credit ${unhandled} without refund request and no closed_reservation_credit item`,
    );
  const alive = (st: string) => !['rejected', 'cancelled', 'superseded'].includes(st);
  let sumA32 = 0;
  for (const r of raw.refunds) {
    if (r.status === 'approved' || r.status === 'paid' || r.status === 'executed') {
      if (r.approverId && r.approverId === r.requestedBy)
        add('I17', `refund ${r.id} approved by its requester`);
      if (r.approverRole && !['manager', 'owner'].includes(r.approverRole))
        add('I17', `refund ${r.id} approved by ${r.approverRole}`);
    }
    // refund_source = 'a32' (0085) – fallback to the note while the column is absent
    const fromA32 = isA32Refund(r);
    if (!fromA32) continue;
    if (!alive(r.status)) continue;
    sumA32 += r.amountVnd;
    const basis = basisAt(raw, r.requestedAt);
    if (sumA32 > basis && r.requiredRole !== 'owner')
      add(
        g.fz02 ? 'I17' : 'I17?',
        `Σ A32 refunds ${sumA32} > basis ${basis} but ${r.id} required_role = ${r.requiredRole}`,
      );
    // the requester of an A32 refund is one of the people who made an A32 reduction on the folio (a superseded
    // replacement keeps the requester of the oldest one it replaces – BE-B s1-be-b 13 point 2)
    if (r.originActorIds.length && r.requestedBy && !r.originActorIds.includes(r.requestedBy))
      add(g.fz02 ? 'I17' : 'I17?', `refund ${r.id} requested_by ∉ origin_actor_ids`);
  }
}

/**
 * I18 (ADD3-01; SEC s1-SEC-on-add3 FB-01 P1/P2, ARC s1-ARC-on-add3): on a settled folio with at least one
 * post-checkout A32 reduction by a role below OWN (the "A32 actors"):
 * (a) every refund request NOT born from the A32 (manual, recordPayment, confirmPaymentReceived) has
 *     required_role = owner;
 * (b) no A32 actor ever approves ANY refund request of that folio;
 * (c) an A32 actor cannot cancel the request born from his A32 (or the cancel does not lower Σ – then the request
 *     after it must still be owner); once OWN rejected a refund of the folio, every later one is owner.
 */
function i18(raw: RawFolio, v: Violation[], g: Gates): void {
  const inv = g.add3 ? 'I18' : 'I18?';
  const out = raw.reservation.actualCheckoutAt;
  if (!out) return;
  const reds = raw.a32Reductions.filter((r) => r.at >= out && r.role && SUB_OWNER.has(r.role));
  if (!reds.length) return;
  const actors = new Set(reds.map((r) => r.actorId).filter(Boolean) as string[]);
  const first = reds[0]!.at;
  const add = (msg: string) => v.push({ inv, msg });
  const fromA32 = isA32Refund;
  let ownerRejectedAt: string | null = null;
  let a32CancelledByActorAt: string | null = null;
  for (const r of raw.refunds) {
    if (r.requestedAt < first) continue;
    if (!fromA32(r) && r.requiredRole !== 'owner')
      add(`(a) refund ${r.id} not born from the A32 routed to ${r.requiredRole}`);
    if (ownerRejectedAt && r.requestedAt > ownerRejectedAt && r.requiredRole !== 'owner')
      add(`(c) refund ${r.id} after OWN rejected one routed to ${r.requiredRole}`);
    if (
      a32CancelledByActorAt &&
      r.requestedAt > a32CancelledByActorAt &&
      r.requiredRole !== 'owner'
    )
      add(
        `(c) refund ${r.id} after the A32 actor cancelled his request routed to ${r.requiredRole}`,
      );
    if (r.status === 'rejected' && r.approverRole === 'owner' && r.decidedAt)
      ownerRejectedAt = ownerRejectedAt ?? r.decidedAt;
    if (
      fromA32(r) &&
      r.status === 'cancelled' &&
      !r.autoCancelReason &&
      r.requestedBy &&
      actors.has(r.requestedBy)
    )
      a32CancelledByActorAt = a32CancelledByActorAt ?? r.decidedAt ?? r.requestedAt;
  }
  // (b) judged at the approval: the approver had ALREADY made an A32 reduction on the folio (an approval given
  // before one's own later A32 is not a breach – fuzz final run 24/10, 22/22 such cases checked)
  const firstRed = new Map<string, string>();
  for (const r of reds)
    if (r.actorId && (!firstRed.has(r.actorId) || r.at < firstRed.get(r.actorId)!))
      firstRed.set(r.actorId, r.at);
  for (const r of raw.refunds)
    if (
      ['approved', 'paid', 'executed'].includes(r.status) &&
      r.approverId &&
      firstRed.has(r.approverId) &&
      (!r.decidedAt || firstRed.get(r.approverId)! < r.decidedAt)
    )
      add(`(b) refund ${r.id} approved by a person who had made an A32 reduction on this folio`);
}

/**
 * BUG-R3-012 / 013 fix (`2f1d738`, merged 27c5dcc) – what the re-run must show (ORC 24/10):
 * - I19 (SEC s1-SEC-on-bug-012-013 #1): a replacement made when a step superseded open refund requests carries
 *   `origin_actor_ids` ⊇ the union of the ones it replaces, and source `a32` when any of them was `a32`. Judged on
 *   sequential steps (one op); in a race the step may also make an unrelated request → "?".
 * - I20 (SEC #2): no refund request is ever approved by its requester, by a person in its `origin_actor_ids`, or by
 *   a person below OWN who had already made a post-checkout A32 reduction on the folio – J15 replacements included,
 *   and requests later closed `superseded` after their approval included (I17 / I18 (b) look at live approvals only).
 * - I21 (SEC #3): a `closed` folio keeps no open refund request (pending / escalated / approved not fully paid) and
 *   no credit.
 * - I22 (critic final B-1 proposal 5): past the window and after the hourly J15 (window + 60 min), a folio still
 *   `settled` is only waiting to pay money back – credit > 0. Settled with credit 0 (B ≥ 0) = J15 waiting for ever.
 * - I24 (ARC 0.3.8 addendum 7 = s1-contracts 13.4 point 1, the K11-06 invariant; BUG-R3-014): after EVERY step on an
 *   `open` / `settled` folio, Σ (pending / escalated requests + what approved requests still have to pay) ≤ raw
 *   credit. Each money change keeps it under the folio lock, so a race ends in a state that holds it too – hard
 *   everywhere. (Supersedes the addendum 6 reading "only when the credit went down / to 0".)
 * - I25 (13.4 point 2): a person below OWN with a post-checkout A32 reduction on the folio never pays out a refund
 *   of that folio nor sets its destination – the step answers 403 SELF_REFUND_FORBIDDEN; on the rows: no refund
 *   payment recorded by, and no destination set by, such a person after his first reduction. OWN is not blocked.
 * - I23 (critic final §4 row 14, M-1): refund pay-out clamp – a pay-out accepted only for ≤ min(left of the
 *   request, credit before), never turns the folio into a debt (B after ≤ 0); one inside the clamp is not refused as
 *   REFUND_EXCEEDS_APPROVED; on every row, paid out ≤ approved and `refunded_vnd` = Σ its refund payments.
 */
function bug012Checks(
  raw: RawFolio,
  ref: RefView,
  code: CodeView,
  ctx: StepCtx,
  nowIso: string,
  v: Violation[],
): void {
  const add = (inv: string, msg: string) => v.push({ inv, msg });
  const openSt = (r: RawFolio['refunds'][number]) =>
    ['pending', 'escalated', 'approved'].includes(r.status) && r.refundedVnd < r.amountVnd;
  // I19
  if (ctx.refundsBefore) {
    const was = new Map(ctx.refundsBefore.map((r) => [r.id, r]));
    const superseded = raw.refunds.filter(
      (r) =>
        r.autoCancelReason === 'superseded' &&
        was.has(r.id) &&
        was.get(r.id)!.autoCancelReason !== 'superseded',
    );
    // a request born from a receipt (K11-06 "Tự sinh từ khoản thu …") is new money, never a replacement: in a race
    // "QR ‖ late charge" the charge may supersede without replacement, then the QR asks for its excess (61053 #21)
    const fresh = raw.refunds.filter(
      (r) => !was.has(r.id) && !(r.reasonNote ?? '').startsWith('Tự sinh từ khoản thu'),
    );
    if (superseded.length && fresh.length) {
      const union = new Set(superseded.flatMap((r) => r.originActorIds));
      const anyA32 = superseded.some(isA32Refund);
      const faults = (n: RawFolio['refunds'][number]) => [
        ...[...union]
          .filter((id) => !n.originActorIds.includes(id))
          .map((id) => `replacement ${n.id} lost origin actor ${id} of the superseded request(s)`),
        ...(anyA32 && !isA32Refund(n)
          ? [`replacement ${n.id} source ${n.source} although an a32 request was superseded`]
          : []),
      ];
      if (ctx.sequential && fresh.length === 1) for (const m of faults(fresh[0]!)) add('I19', m);
      // a race (or a step making several requests) may also make an unrelated one (e.g. QR ‖ late charge: the
      // replacement + an `other` request for the QR excess) – a breach only when NO new request is a faithful one
      else if (!fresh.some((n) => faults(n).length === 0))
        for (const m of faults(fresh[0]!)) add('I19?', m);
    }
  }
  // I20
  const reds = raw.a32Reductions.filter((r) => r.role && SUB_OWNER.has(r.role) && r.actorId);
  for (const r of raw.refunds) {
    if (!r.approverId || r.status === 'rejected') continue; // approver_id is set by approve (and reject) only
    if (r.approverId === r.requestedBy) add('I20', `refund ${r.id} approved by its requester`);
    if (r.originActorIds.includes(r.approverId))
      add('I20', `refund ${r.id} approved by a person of its origin_actor_ids`);
    if (reds.some((d) => d.actorId === r.approverId && (!r.decidedAt || d.at < r.decidedAt)))
      add(
        'I20',
        `refund ${r.id} approved by a person below OWN who had made an A32 reduction on the folio`,
      );
  }
  // I21
  if (code.folioStatus === 'closed') {
    const still = raw.refunds.filter(openSt);
    if (still.length)
      add(
        'I21',
        `closed folio keeps ${still.length} open refund request(s): ${still.map((r) => `${r.status} ${r.amountVnd - r.refundedVnd}`).join(', ')}`,
      );
    // the credit half ("tiền dư = 0") is I4 `closed folio with credit` – not counted twice
  }
  // I22
  if (
    code.folioStatus === 'settled' &&
    raw.folio.windowUntil &&
    new Date(nowIso).getTime() >= new Date(raw.folio.windowUntil).getTime() + 60 * 60_000 &&
    ref.B >= 0
  )
    add(
      'I22',
      `window over + J15 ran: folio still settled with credit 0 (B ${ref.B}, open refunds ${raw.refunds.filter(openSt).length}) – J15 must record the debt and close`,
    );
  // I24 – K11-06 invariant (13.4 point 1)
  if (code.folioStatus === 'settled' || code.folioStatus === 'open') {
    const credit = Math.max(0, -ref.B);
    const open = raw.refunds.filter(openSt);
    const left = (r: RawFolio['refunds'][number]) => r.amountVnd - r.refundedVnd;
    const total = open.reduce((a, r) => a + left(r), 0);
    if (total > credit)
      add(
        'I24',
        `after "${ctx.op}": open refunds ${total} > raw credit ${credit} (${open.map((r) => `${r.status} ${left(r)}`).join(', ')})`,
      );
  }
  // I25 – SELF_REFUND_FORBIDDEN (13.4 point 2)
  const firstRed = new Map<string, string>();
  for (const d of raw.a32Reductions)
    if (
      d.actorId &&
      d.role &&
      SUB_OWNER.has(d.role) &&
      (!firstRed.has(d.actorId) || d.at < firstRed.get(d.actorId)!)
    )
      firstRed.set(d.actorId, d.at);
  const makerAt = (id: string | null, t: string | null) =>
    !!id && !!t && firstRed.has(id) && firstRed.get(id)! < t;
  for (const pmt of raw.payments)
    if (pmt.type === 'refund' && makerAt(pmt.recordedBy, pmt.createdAt))
      add(
        'I25',
        `refund payment ${pmt.id} paid out by a person below OWN who made an A32 reduction on the folio`,
      );
  for (const r of raw.refunds)
    if (makerAt(r.destinationSetBy, r.destinationSetAt))
      add(
        'I25',
        `refund ${r.id} destination set by a person below OWN who made an A32 reduction on the folio`,
      );
  if (ctx.refundActor) {
    const ok = ctx.status >= 200 && ctx.status < 300;
    const maker = makerAt(ctx.refundActor.userId, nowIso);
    if (maker && ok)
      add(
        'I25',
        `A32 maker's ${ctx.refundActor.kind} accepted ${ctx.status} (13.4: 403 SELF_REFUND_FORBIDDEN)`,
      );
    if (
      !maker &&
      /SELF_REFUND_FORBIDDEN/.test(ctx.code ?? '') &&
      ctx.refundActor.kind === 'destination'
    )
      add(
        'I25?',
        `destination refused SELF_REFUND_FORBIDDEN for a person who made no A32 reduction`,
      );
  }
  // I23
  const p = ctx.refundPay;
  if (p) {
    const ok = ctx.status >= 200 && ctx.status < 300;
    const cap = Math.min(p.leftVnd, p.creditVnd);
    if (ok && p.amountVnd > cap)
      add(
        'I23',
        `pay-out ${p.amountVnd} accepted above min(left ${p.leftVnd}, credit ${p.creditVnd}) = ${cap}`,
      );
    if (ok && ref.B > 0)
      add('I23', `pay-out ${p.amountVnd} turned the folio into a debt: B ${p.bBefore} → ${ref.B}`);
    if (!ok && p.amountVnd <= cap && /REFUND_EXCEEDS_APPROVED/.test(ctx.code ?? ''))
      add('I23', `pay-out ${p.amountVnd} ≤ min(left, credit) ${cap} refused ${ctx.code}`);
  }
  for (const r of raw.refunds) {
    if (r.refundedVnd > r.amountVnd)
      add('I23', `refund ${r.id} paid ${r.refundedVnd} > approved ${r.amountVnd}`);
    const paid = raw.payments
      .filter(
        (x) =>
          x.type === 'refund' &&
          x.approvalRequestId === r.id &&
          x.status === 'succeeded' &&
          !x.reversalOfId,
      )
      .reduce((a, x) => a - x.amountVnd, 0);
    if (paid !== r.refundedVnd)
      add('I23', `refund ${r.id} refunded_vnd ${r.refundedVnd} ≠ Σ its refund payments ${paid}`);
  }
}
