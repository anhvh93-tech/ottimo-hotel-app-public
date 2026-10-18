import type { AuditEvent } from '@ottimo/api-client';
import { hasKey, type Args } from '@ottimo/i18n';

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
};

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
  const key =
    SYSTEM_SENTENCES[raw] ??
    CODE_KEYS[raw] ??
    (hasKey(`mlog.reason.${raw}`) ? `mlog.reason.${raw}` : undefined) ??
    (hasKey(`move.reason.${raw}`) ? `move.reason.${raw}` : undefined);
  const text = key ? t(key) : raw;
  return note && note !== raw ? `${text} · "${note}"` : text;
}
