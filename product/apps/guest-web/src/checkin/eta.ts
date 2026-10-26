// Arrival-time choices of H18 18.3 (UXD hi-fi, updated S3): 2-hour windows from the standard check-in
// time up to 18:00 (at most 4 windows), one evening window up to 22:00, then "After 22:00".
// Check-in from 12:00 (FB-INV-004, BR-401 v0.4.6; DOM v1-production-defaults F4) gives
// 12–14, 14–16, 16–18, 18–22, 22:00+; 14:00 keeps the hi-fi set 14–16, 16–18, 18–22, 22:00+.
// `etaTime` = start of the window; "After 22:00" stores 22:00 + `lateArrival` (contract 0.3.3,
// BA assumption). [GIẢ ĐỊNH MOB – start of window]

export interface EtaChoice {
  id: string;
  label: string;
  etaTime: string;
  late: boolean;
}

const LATE_FROM = 22 * 60;
/** Last 2-hour window ends here; the evening window runs on to 22:00. */
const EVENING_FROM = 18 * 60;
const MAX_WINDOWS = 4;
/** Start of "After 22:00" (H18 18.3) – also the time in `gw.oci_unavailable_late`. */
export const LATE_ARRIVAL_FROM = '22:00';

function toMin(hhmm: string): number | undefined {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(hhmm);
  return m ? Number(m[1]) * 60 + Number(m[2]) : undefined;
}

function toHhmm(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
}

export function etaSlots(checkinTime: string): EtaChoice[] {
  const start = Math.min(toMin(checkinTime) ?? 14 * 60, LATE_FROM - 60);
  const bounds = [start];
  for (let b = start + 120; b <= EVENING_FROM && bounds.length < MAX_WINDOWS; b += 120)
    bounds.push(b);
  bounds.push(LATE_FROM);
  const out: EtaChoice[] = [];
  for (let i = 0; i < bounds.length - 1; i++) {
    const from = toHhmm(bounds[i]!);
    const to = toHhmm(bounds[i + 1]!);
    out.push({ id: from, label: `${from} – ${to}`, etaTime: from, late: false });
  }
  out.push({ id: 'late', label: '22:00+', etaTime: toHhmm(LATE_FROM), late: true });
  return out;
}

/** Re-select the saved choice when the guest reopens the link (US-107 AC2). */
export function slotOf(
  slots: EtaChoice[],
  etaTime: string | undefined,
  late: boolean | undefined,
): string | undefined {
  if (late) return 'late';
  if (!etaTime) return undefined;
  const t = toMin(etaTime);
  if (t === undefined) return undefined;
  // The window that contains the saved time (a desk edit may not sit on a window start).
  const hit = [...slots].reverse().find((s) => !s.late && (toMin(s.etaTime) ?? 0) <= t);
  return hit?.id;
}
