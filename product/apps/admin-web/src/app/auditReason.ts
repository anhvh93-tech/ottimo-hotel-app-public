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
};

export function auditReasonText(t: T, e: AuditEvent): string {
  const after = (e.after ?? {}) as Record<string, unknown>;
  // "Gửi yêu cầu duyệt" & co.: the reason the desk picked (and its note) when the event has no reason of its own.
  const raw =
    e.reason ??
    (typeof after.reasonCode === 'string' ? after.reasonCode : undefined) ??
    (typeof after.reason === 'string' ? after.reason : undefined);
  const note = typeof after.reasonNote === 'string' ? after.reasonNote.trim() : '';
  if (!raw) return note || '—';
  const key =
    SYSTEM_SENTENCES[raw] ??
    CODE_KEYS[raw] ??
    (hasKey(`mlog.reason.${raw}`) ? `mlog.reason.${raw}` : undefined) ??
    (hasKey(`move.reason.${raw}`) ? `move.reason.${raw}` : undefined);
  const text = key ? t(key) : raw;
  return note && note !== raw ? `${text} · "${note}"` : text;
}
