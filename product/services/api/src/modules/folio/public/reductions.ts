/**
 * FOC / special discount on a KEY – the ONE calculation behind the folio sync (write) and every preview
 * (BR-434 v0.3.5/v0.3.6, BR-412, BR-433; S4-02, S4-18, S4-23, S4-34; OpenAPI 0.3.7 D1 – "xem trước và lệnh
 * ghi dùng chung một hàm"). Pure functions only: no database, no clock.
 *
 * Key (BR-434 "khóa FOC"): stay (the folio: primary booking + its children) × line category × service date for
 * room nights and extra-person fees; ONE key per stay for early check-in and late check-out (BR-412); any other
 * charge is its own line (followed through adjustFolioLine replacements).
 *
 * On a key, every sync recomputes from the APPROVED amounts (approval_request.amount_vnd – never from the FOC
 * line still on the folio):
 * - approved reductions apply in the order they were approved (S4-23 (1)): applied(i) = min(approved(i),
 *   line − Σ applied before it); Σ applied = min(Σ approved, line), never above the line (no negative night);
 * - applied 0 → the FOC is DORMANT (no FOC line, request stays `approved`); > 0 again later → restored;
 * - a pending request "will apply" X = min(asked, line − Σ applied of the approved ones) (S4-23 (5)) – 0 means
 *   "the line is already fully reduced by other reductions" / "the line is 0 now";
 * - a new request may ask at most line − Σ (applied + asked of the pending ones) (S4-23 (6)).
 */

export type FocKeyKind = 'night' | 'stay' | 'line';

/**
 * Categories whose key is (stay × category × service date). S438-FOC-03/04 (BR-434-14, v0.3.8): the OTA
 * room-change difference follows its night like the extra-person fee – its FOC finds the re-posted line of the
 * date (B7 again, B12), is suspended by a no-show and comes back at B12.
 */
export const DATED_KEY_CATEGORIES: ReadonlySet<string> = new Set([
  'room',
  'extra_person',
  'room_change_difference',
]);
/** Categories with ONE key per stay (BR-412: early check-in, late check-out). */
export const STAY_KEY_CATEGORIES: ReadonlySet<string> = new Set(['early_checkin', 'late_checkout']);

/** ARC R8: the item code of a minibar request (null = legacy minibar line without code → its own line key). */
export function itemKeyCode(r: { category: string; itemCode?: string | null }): string | null {
  return r.category === 'minibar' && r.itemCode ? r.itemCode : null;
}

export function keyKindOf(category: string): FocKeyKind {
  if (DATED_KEY_CATEGORIES.has(category)) return 'night';
  if (STAY_KEY_CATEGORIES.has(category)) return 'stay';
  return 'line';
}

/** One reduction (approved or pending) on a key, with what decides its place in the order. */
export interface KeyClaim {
  id: string;
  /** amount_vnd of the request: what was asked (pending) / "số đã duyệt" (approved). */
  amountVnd: number;
  /** Order of approval (S4-23 (1)): decided_at for approved (self-applied = at submission). */
  decidedAt?: Date | string | null;
  requestedAt: Date | string;
}

export interface KeyAllocation {
  /** Approved id → amount applied now (0 = dormant). */
  applied: Map<string, number>;
  /** Pending id → "khi duyệt sẽ áp X". */
  willApply: Map<string, number>;
  appliedTotalVnd: number;
}

const t = (v: Date | string | null | undefined): number =>
  v === null || v === undefined ? Number.POSITIVE_INFINITY : new Date(v).getTime();

/** Approval order (S4-23 (1)): time of approval, then the request created first, then id. */
export function approvalOrder(a: KeyClaim, b: KeyClaim): number {
  return (
    t(a.decidedAt) - t(b.decidedAt) ||
    t(a.requestedAt) - t(b.requestedAt) ||
    (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
  );
}

/**
 * S4-23 allocation of one key: `lineVnd` = value of the live line of the key now (0 when the key has no line).
 * Integer VND in, integer VND out; never negative, Σ applied ≤ lineVnd.
 */
export function allocateKey(
  lineVnd: number,
  approved: readonly KeyClaim[],
  pending: readonly KeyClaim[],
): KeyAllocation {
  if (!Number.isSafeInteger(lineVnd))
    throw new RangeError('allocateKey: line must be a safe integer');
  const value = Math.max(0, lineVnd);
  const applied = new Map<string, number>();
  let used = 0;
  for (const c of [...approved].sort(approvalOrder)) {
    const a = Math.max(0, Math.min(c.amountVnd, value - used));
    applied.set(c.id, a);
    used += a;
  }
  const willApply = new Map<string, number>();
  for (const c of pending) willApply.set(c.id, Math.max(0, Math.min(c.amountVnd, value - used)));
  return { applied, willApply, appliedTotalVnd: used };
}

/** S4-23 (6): the most a NEW request may ask on a key. */
export function maxNewRequestVnd(
  lineVnd: number,
  allocation: KeyAllocation,
  pending: readonly KeyClaim[],
): number {
  const asked = pending.reduce((a, c) => a + c.amountVnd, 0);
  return Math.max(0, Math.max(0, lineVnd) - allocation.appliedTotalVnd - asked);
}

/**
 * BR-434 when the set of nights changes (DOM 17/10, S4-14 – by DATE, whatever the flow: B7, B8, B16, extension;
 * room FOC and extra-person FOC alike): where the FOC of an old night goes.
 * - a date in both ranges keeps its own FOC (→ itself);
 * - dropped = old dates not in the new range, added = new dates not in the old range, both ascending, nights
 *   WITHOUT FOC counted too: dropped[i] → added[i];
 * - a dropped date without a counterpart is not in the map (its FOC is cancelled).
 * A move with no date in common is therefore night k → night k; a room change on the same dates maps every
 * date to itself.
 */
export function focDateMap(
  oldDates: readonly string[],
  newDates: readonly string[],
): Map<string, string> {
  // S4-23 (s3-round8 code-2): a line without a service date is no night – it must not take a slot of the map
  // (an empty date sorted first would shift every real dropped date by one).
  const before = new Set(oldDates.filter((d) => !!d));
  const after = new Set(newDates.filter((d) => !!d));
  const map = new Map<string, string>();
  for (const d of before) if (after.has(d)) map.set(d, d);
  const dropped = [...before].filter((d) => !after.has(d)).sort();
  const added = [...after].filter((d) => !before.has(d)).sort();
  dropped.forEach((d, i) => {
    const to = added[i];
    if (to !== undefined) map.set(d, to);
  });
  return map;
}

/** One request as the sync and the previews see it (folio side of approval_request). */
export interface ReductionRequest extends KeyClaim {
  type: 'foc' | 'special_discount';
  status: 'pending' | 'escalated' | 'approved';
  focState: 'applied' | 'dormant' | 'suspended' | null;
  /** Category of the line the request was made on (never changes). */
  category: string;
  /** Night / extra-person key: the current date of the key. */
  serviceDate: string | null;
  /** Line key: the line the request was made on (start of the adjustFolioLine replacement chain). */
  originLineId: string;
  /**
   * Mô hình minibar M-1 (ARC R8, BR-434-15/16 – BUG-R2-135): `charge_code` (= item code) of a minibar line – the
   * key is then stay × minibar × item (`item:minibar:<code>`), its value = Σ live minibar lines of the item.
   */
  itemCode?: string | null;
  reasonCode: string;
}

export const keyOf = (
  r: Pick<ReductionRequest, 'category' | 'serviceDate' | 'originLineId' | 'itemCode'>,
) => {
  const item = itemKeyCode(r);
  if (item) return `item:minibar:${item}`;
  const kind = keyKindOf(r.category);
  return kind === 'night'
    ? `night:${r.category}:${r.serviceDate ?? ''}`
    : kind === 'stay'
      ? `stay:${r.category}`
      : `line:${r.originLineId}`;
};

/**
 * Preview of the reductions of the nights of a booking after a change (B7/B14 `dryRun`, previewMoveReservation –
 * BE-A M2): same allocation as the write, on the proposed values. `requests` = the open requests of the folio
 * (FolioService.reductionRequests); `oldDates` = dates of the live room lines of the booking; `nights` = the
 * nights after the change with their room price and extra-person fee. Returns per new date the FOC/discount that
 * will be applied and the pending amounts that would apply if approved (MovePreview.nights[].focVnd /
 * pendingFocVnd).
 */
export function previewNightReductions(input: {
  requests: readonly ReductionRequest[];
  oldDates: readonly string[];
  nights: ReadonlyArray<{
    date: string;
    roomVnd: number;
    extraPersonVnd: number;
    /** S438-FOC-04: the OTA room-change difference of the night after the change (absent = 0). */
    differenceVnd?: number;
  }>;
}): Map<string, NightReductionPreview> {
  const goesTo = focDateMap(
    input.oldDates,
    input.nights.map((n) => n.date),
  );
  const old = new Set(input.oldDates);
  const byKey = new Map<string, { approved: KeyClaim[]; pending: KeyClaim[] }>();
  for (const r of input.requests) {
    if (keyKindOf(r.category) !== 'night' || !r.serviceDate || !old.has(r.serviceDate)) continue;
    if (r.status === 'approved' && r.focState === 'suspended') continue;
    const to = goesTo.get(r.serviceDate);
    if (to === undefined) continue; // dropped without a counterpart → cancelled
    const k = `${r.category}:${to}`;
    const slot = byKey.get(k) ?? { approved: [], pending: [] };
    (r.status === 'approved' ? slot.approved : slot.pending).push(r);
    byKey.set(k, slot);
  }
  const out = new Map<string, NightReductionPreview>();
  const sum = (m: Map<string, number>) => [...m.values()].reduce((a, v) => a + v, 0);
  const none = { approved: [], pending: [] };
  for (const n of input.nights) {
    const ra = allocateKey(n.roomVnd, ...claims(byKey.get(`room:${n.date}`) ?? none));
    const ea = allocateKey(
      n.extraPersonVnd,
      ...claims(byKey.get(`extra_person:${n.date}`) ?? none),
    );
    const da = allocateKey(
      n.differenceVnd ?? 0,
      ...claims(byKey.get(`room_change_difference:${n.date}`) ?? none),
    );
    out.set(n.date, {
      roomFocVnd: ra.appliedTotalVnd,
      roomPendingVnd: sum(ra.willApply),
      extraFocVnd: ea.appliedTotalVnd,
      extraPendingVnd: sum(ea.willApply),
      differenceFocVnd: da.appliedTotalVnd,
      differencePendingVnd: sum(da.willApply),
    });
  }
  return out;
}

function claims(slot: { approved: KeyClaim[]; pending: KeyClaim[] }): [KeyClaim[], KeyClaim[]] {
  return [slot.approved, slot.pending];
}

/** What the reductions of one night will be after a change (MovePreview.nights[] – BE-A M2). */
export interface NightReductionPreview {
  roomFocVnd: number;
  roomPendingVnd: number;
  extraFocVnd: number;
  extraPendingVnd: number;
  /** S438-FOC-04: FOC / discount applied on the room-change difference of the night (0 without one). */
  differenceFocVnd: number;
  differencePendingVnd: number;
}
