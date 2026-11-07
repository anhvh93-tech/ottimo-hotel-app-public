import type { AuditEvent, CancelReasonCode, Folio } from '@ottimo/api-client';
import { hasKey, type Args } from '@ottimo/i18n';
import { FOC_REASON } from './folio';

type T = (key: string, args?: Args) => string;

/**
 * UXR P-19 / BUG-R2-100: the "Lý do" of the money log in words. The server writes a reason code (cancellation,
 * move, FOC, system events) or – for a few system steps – an English sentence of its own; the desk shows a
 * Vietnamese / English sentence for each, never the code or the developer's sentence. A reason the user typed is
 * shown as typed. The server should send codes only (BE: one code per system reason) – the sentences below map the
 * ones it sends today.
 */
const SYSTEM_SENTENCES: Record<string, string> = {
  'FOC on the current line of its key (BR-434)': 'mlog.reason.foc_current_line',
  'FOC follows its key (BR-434)': 'mlog.reason.foc_follows',
  'FOC recomputed on its key (BR-434)': 'mlog.reason.foc_recomputed',
  'B12 – night sold again (BR-429 (c))': 'mlog.reason.night_resold',
  'checked out (B18)': 'mlog.reason.checked_out',
  'extended (B13)': 'mlog.reason.extended',
  'superseded by early departure (B16)': 'mlog.reason.superseded_early_departure',
  'superseded by extension (B13)': 'mlog.reason.superseded_extension',
  // SEC BE-80: `approval.applied_capped` before BE-B sent a code (old rows).
  'debt write-off applied up to the open debt (BR-525)': 'foc.r_debt_write_off',
};

/** Codes whose sentence lives with the screen that asks for them. */
const CODE_KEYS: Record<string, string> = {
  // cancellation (CancelReasonCode)
  guest_changed_mind: 'cancel.reason.changed_mind',
  found_other: 'cancel.reason.found_other',
  price: 'cancel.reason.price',
  date_change: 'cancel.reason.dates',
  unreachable: 'cancel.reason.unreachable',
  ota_cancelled: 'cancel.reason.ota_cancelled',
  // FOC / special discount (FocRequestInput.reasonCode)
  regular_vip: 'foc.r_regular',
  room_ready_no_impact: 'foc.r_room_ready',
  service_recovery: 'foc.r_recovery',
  long_stay_guest: 'foc.r_long',
  debt_write_off: 'foc.r_debt_write_off',
  // SEC BE-80: `approval.applied_capped` – part of the debt was collected while the write-off waited.
  debt_collected_before_approval: 'foc.r_debt_write_off',
  // v1.0.4 BUG-R4-026: refund of what the guest overpaid (B18, manual request, A32, closing a credit, and the
  // request that replaces one closed by itself) – one label for every case.
  overpayment: 'audit.reason.overpayment',
};

/**
 * v1.0.4 BUG-R4-026, v1.0.5 V5-13 (UXD copy-v1.0.5 9.12, DOM FB-R5-DOM-UXD-112-01): the reason codes of a REFUND
 * request (`ApprovalRequest.reasonCode` with `type = refund`, `OpenRefund.reasonCode`) that have a label of their own.
 * Kept apart from `CODE_KEYS` because `early_departure` on a folio line means "Trả phòng sớm" (`mlog.reason.*`), while
 * on a refund request it is "Hoàn khi trả sớm".
 */
const REFUND_OWN_LABEL: Record<string, string> = {
  early_departure: 'audit.reason.early_departure',
  overpayment: 'audit.reason.overpayment',
  // BR-312 – also a `CancelReasonCode`, so it is looked up before the cancellation group.
  overbooking_relocated: 'audit.reason.overbooking_relocated',
  payment_after_cancel: 'audit.reason.payment_after_cancel',
};

/**
 * Every `CancelReasonCode` of the contract (B5, B10 refund what is left with the cancellation's own reason). Typed on
 * the generated union, so a code added to or dropped from the contract fails the type check here – the list is never
 * kept by hand.
 */
const CANCEL_REASON: Record<CancelReasonCode, true> = {
  guest_cancelled: true,
  guest_changed_mind: true,
  found_other: true,
  price: true,
  date_change: true,
  unreachable: true,
  hold_expired: true,
  ota_cancelled: true,
  overbooking_relocated: true,
  group_partial: true,
  other: true,
};

const REFUND_CANCELLATION = 'audit.reason.cancellation';
const REFUND_OTHER = 'audit.reason.refund_other';

/**
 * V5-13 (UXD 9.12): the label key of a refund reason, in three steps – (1) a code with its own label
 * (`overbooking_relocated` before step 2); (2) a cancellation code or `no_show` (B11) → one label; (3) anything else
 * (a code typed in A32, an unknown or missing code) → "Hoàn tiền". Never the code itself.
 */
export function refundReasonKey(code: string | null | undefined): string {
  const c = code ?? '';
  if (Object.hasOwn(REFUND_OWN_LABEL, c)) return REFUND_OWN_LABEL[c]!;
  if (c === 'no_show' || Object.hasOwn(CANCEL_REASON, c)) return REFUND_CANCELLATION;
  return REFUND_OTHER;
}

/** UXD 9.12: the fixed order of the refund groups on screen (the server sorts `openRefunds` by code). */
const REFUND_GROUP_ORDER = [
  'audit.reason.early_departure',
  'audit.reason.overpayment',
  'audit.reason.overbooking_relocated',
  'audit.reason.payment_after_cancel',
  REFUND_CANCELLATION,
  REFUND_OTHER,
];

export type OpenRefund = NonNullable<Folio['totals']['openRefunds']>[number];

/**
 * V5-13 (ARC A1 (b), UXD 9.12): `openRefunds` (one row per server code) summed per label – e.g. `found_other` and
 * `price` make ONE "Hoàn khi hủy hoặc không đến" – in the fixed order; groups at 0 are left out.
 */
export function openRefundGroups(list: readonly OpenRefund[]): Array<{ key: string; vnd: number }> {
  const sums = new Map<string, number>();
  for (const x of list) {
    const key = refundReasonKey(x.reasonCode);
    sums.set(key, (sums.get(key) ?? 0) + x.openVnd);
  }
  return REFUND_GROUP_ORDER.filter((key) => (sums.get(key) ?? 0) > 0).map((key) => ({
    key,
    vnd: sums.get(key)!,
  }));
}

/**
 * The reason of an approval request in words (Cần duyệt, Hoàn tiền): FOC / discount codes, refund codes. A refund
 * always has a label (V5-13 – "Hoàn tiền" for a code without one). Null for another type with no code or none we
 * know – the row then shows only the note the sender typed, never a code.
 */
export function requestReasonText(
  t: T,
  a: { type?: string; reasonCode?: string | null },
): string | null {
  if (a.type === 'refund') return t(refundReasonKey(a.reasonCode));
  const key = FOC_REASON[a.reasonCode ?? ''];
  return key ? t(key) : null;
}

/**
 * 0.3.7 D1 / SEC BE-80: why the server closed a request by itself (`ApprovalRequest.autoCancelReason`, e.g.
 * `debt_cleared` – the debt was collected while writing it off waited). A value without its own sentence → the
 * generic one (never the code).
 */
export function autoCancelText(t: T, reason: string | null | undefined): string {
  const key = `approval.auto_cancel.${reason ?? ''}`;
  return reason && hasKey(key) ? t(key) : t('approval.auto_cancel.other');
}

/** The `autoCancelReason` of an `approval.cancelled` the server wrote by itself (reason `auto: <code>`). */
export function autoCancelCode(reason: string | null | undefined): string | undefined {
  return reason ? /^auto:\s*(\S+)$/.exec(reason)?.[1] : undefined;
}

/**
 * SEC BE-80 (BE-B s4-be-b mục 25): a debt write-off approved while the guest paid part of the debt is applied
 * only up to what was still owed – `effectiveAmountVnd` < `amountVnd`. The sentence, or null when not capped.
 */
export function appliedCappedText(
  t: T,
  money: (n: number) => string,
  a: { status: string; reasonCode?: string; amountVnd: number; effectiveAmountVnd?: number | null },
): string | null {
  return a.status === 'approved' &&
    a.reasonCode === 'debt_write_off' &&
    typeof a.effectiveAmountVnd === 'number' &&
    a.effectiveAmountVnd < a.amountVnd
    ? t('approval.applied_capped', {
        amount: money(a.effectiveAmountVnd),
        requested: money(a.amountVnd),
      })
    : null;
}

/** Status chip text of a request: "closed automatically" is not "withdrawn" by its sender. */
export function approvalStatusText(
  t: T,
  a: { status: string; autoCancelReason?: string | null },
): string {
  return a.status === 'cancelled' && a.autoCancelReason
    ? t('approval.status.auto_closed')
    : t(`approval.status.${a.status}`);
}

export function auditReasonText(t: T, e: AuditEvent): string {
  const after = (e.after ?? {}) as Record<string, unknown>;
  // "Gửi yêu cầu duyệt" & co.: the reason the desk picked (and its note) when the event has no reason of its own.
  const raw =
    e.reason ??
    (typeof after.reasonCode === 'string' ? after.reasonCode : undefined) ??
    (typeof after.reason === 'string' ? after.reason : undefined);
  const note = typeof after.reasonNote === 'string' ? after.reasonNote.trim() : '';
  if (!raw) return note || '—';
  // `approval.cancelled` by the server itself: reason `auto: <autoCancelReason>`.
  const auto = autoCancelCode(raw);
  if (auto)
    return hasKey(`approval.auto_cancel.${auto}`) || !hasKey(`mlog.reason.${auto}`)
      ? autoCancelText(t, auto)
      : t(`mlog.reason.${auto}`);
  // BUG-R4-026, V5-13: "Gửi yêu cầu duyệt" of a refund – the refund label (one code, one label everywhere).
  const refundKey =
    !e.reason && after.type === 'refund' && typeof after.reasonCode === 'string'
      ? refundReasonKey(raw)
      : undefined;
  const key =
    refundKey ??
    SYSTEM_SENTENCES[raw] ??
    CODE_KEYS[raw] ??
    (hasKey(`mlog.reason.${raw}`) ? `mlog.reason.${raw}` : undefined) ??
    (hasKey(`move.reason.${raw}`) ? `move.reason.${raw}` : undefined);
  const text = key ? t(key) : raw;
  return note && note !== raw ? `${text} · "${note}"` : text;
}
