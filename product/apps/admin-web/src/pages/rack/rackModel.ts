import type { Rack, RackBar } from '@ottimo/api-client';
import { addDays, nightsBetween } from '../../app/reservations';

/** RackBar 0.3.5 (A-01 manual badge / sofa / hold countdown / code, A-24 capacityConflict, A-25 group). */
export type RackBarX = RackBar;

export interface Slot {
  /** First day column (0-based) the slot covers. */
  col: number;
  span: number;
  bar?: RackBarX;
  /** Bar starts before / ends after the visible range (‹ prefix like the hi-fi). */
  clippedStart?: boolean;
  clippedEnd?: boolean;
}

export const dayIndex = (from: string, date: string) => nightsBetween(from, date);

/**
 * One rack row → non-overlapping slots covering every day column: a bar spans [from, to) clipped to
 * the range; free nights are 1-day empty slots. Overlapping bars (should not happen – the server
 * prevents double booking) are pushed after the previous one so nothing renders on top of another.
 */
export function layoutRow(bars: RackBarX[], from: string, days: number): Slot[] {
  const sorted = [...bars].sort((a, b) => a.from.localeCompare(b.from));
  const out: Slot[] = [];
  let cursor = 0;
  const fill = (until: number) => {
    for (; cursor < until; cursor++) out.push({ col: cursor, span: 1 });
  };
  for (const bar of sorted) {
    const start = Math.max(dayIndex(from, bar.from), cursor, 0);
    const end = Math.min(dayIndex(from, bar.to), days);
    if (end <= start) continue;
    fill(start);
    out.push({
      col: start,
      span: end - start,
      bar,
      clippedStart: dayIndex(from, bar.from) < 0,
      clippedEnd: dayIndex(from, bar.to) > days,
    });
    cursor = end;
  }
  fill(days);
  return out;
}

/** Unassigned OTA bars (US-139) packed into as few lane rows as possible (greedy, by start date). */
export function packLanes(bars: RackBarX[]): RackBarX[][] {
  const lanes: RackBarX[][] = [];
  for (const bar of [...bars].sort((a, b) => a.from.localeCompare(b.from))) {
    const lane = lanes.find((l) => l[l.length - 1]!.to <= bar.from);
    if (lane) lane.push(bar);
    else lanes.push([bar]);
  }
  return lanes;
}

export const rangeDays = (rack: Pick<Rack, 'from' | 'days'>) =>
  Array.from({ length: rack.days }, (_, i) => addDays(rack.from, i));

export const slotAt = (slots: Slot[], col: number) =>
  slots.find((s) => col >= s.col && col < s.col + s.span);
