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
  };
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
  const gap = ref.windowOver && code.folioStatus !== 'closed';
  const soft = (inv: string, when: boolean) => (when ? `${inv}?` : inv);
  if (ref.windowOver && W !== 0)
    add(
      soft('I1', gap),
      `window over but W = ${W} (O ${O}, B ${codeB})${gap ? ' – J15 not run yet' : ''}`,
    );
  // I3 – code O = reference O
  if (O !== ref.O)
    add(
      soft('I3', !!ctx.ambiguousOrder || gap),
      `openDebtVnd ${O} ≠ ref ${ref.O} (R ${ref.R}, D ${ref.D}, B ${ref.B})` +
        (ctx.ambiguousOrder ? ' – race at one instant, critic orders it from the log' : ''),
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
  // I7 – A32 reduction on settled allowed ⇔ reduction ≤ W and window not over
  if (ctx.a32) {
    // O = 0 → as a stay without debt (oracle 208 rule); 403 = role gate (FD), 412 = stale If-Match: not I7
    const allowed =
      !ctx.a32.closedBefore &&
      !ctx.a32.windowOverBefore &&
      (ctx.a32.oBefore === 0 || ctx.a32.reduceVnd <= ctx.a32.wBefore);
    const ok = ctx.status >= 200 && ctx.status < 300;
    const roleOrStale = ctx.status === 403 || ctx.status === 412;
    // 210: a debt written before 0076 keeps the old N-7 (no reduction while it is open – SEC-01 b): warning only
    if (allowed && !ok && !roleOrStale)
      add(
        soft('I7', !!ctx.legacyCycle || !!ctx.ambiguousOrder),
        `A32 −${ctx.a32.reduceVnd} ≤ W ${ctx.a32.wBefore} refused ${ctx.status} ${ctx.code ?? ''}`,
      );
    if (!allowed && ok)
      add(
        'I7',
        `A32 −${ctx.a32.reduceVnd} > W ${ctx.a32.wBefore} (or window over) accepted ${ctx.status}`,
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

  if (g.be83) be83(raw, ref, v, nowIso, ctx.basisAtCreate);
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
  // I16 + I13 replay
  let woSum = 0;
  let staySum = 0;
  let top = 0;
  let crossed = false;
  for (const a of applied) {
    const t = a.requestedAt;
    const amt = appliedAt(raw, a.id, nowIso);
    const basis = basisOf(a.id, t);
    if (a.reasonCode === 'debt_write_off') {
      woSum += amt;
      if (woSum > basis && !told)
        add(
          'I16',
          `Σ write-off below OWN ${woSum} > basis ${basis} at ${t} (${a.id}), OWN not told`,
        );
    }
    staySum += amt;
    top = Math.max(top, RANK[a.approverRole!] ?? 0);
    const threshold = top === 3 ? basis : top === 2 ? 300_000 : 100_000;
    if (staySum > threshold) crossed = true;
  }
  if (crossed) {
    if (!told) add('I13', `Σ stay ${staySum} crossed its threshold, OWN not told`);
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
