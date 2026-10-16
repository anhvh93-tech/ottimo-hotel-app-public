/**
 * Unit: ReservationCapacityCheck (ĐK-S2-2) – parameters sent to the query, row → CapacityConflict mapping,
 * and the module wiring (the platform module no longer ships the NO_BOOKINGS_YET stub – QC-S2-01).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { FixedClock } from '../src/clock';
import type { Tx } from '../src/db/database';
import * as roomCapacity from '../src/modules/platform/public/room-capacity';
import {
  OVER_CAPACITY_SQL,
  ReservationCapacityCheck,
} from '../src/modules/reservations/public/room-capacity-check';
import type { LocalDate } from '../src/shared/time';

function fakeTx(rows: unknown[]) {
  const calls: Array<{ sql: string; params: unknown[] }> = [];
  const tx = {
    query: async (sql: string, params: unknown[]) => {
      calls.push({ sql, params });
      return { rows };
    },
  } as unknown as Tx;
  return { tx, calls };
}

describe('ReservationCapacityCheck (US-004, BR-110)', () => {
  const now = new Date('2026-10-15T02:00:00.000Z');

  it('passes room, new max, business date and the clock instant (live holds) to the query', async () => {
    const { tx, calls } = fakeTx([]);
    const check = new ReservationCapacityCheck(new FixedClock(now));
    const out = await check.overCapacity(tx, 'room-1', 4, '2026-10-15' as LocalDate);
    expect(out).toEqual([]);
    expect(calls).toHaveLength(1);
    expect(calls[0]!.sql).toBe(OVER_CAPACITY_SQL);
    expect(calls[0]!.params).toEqual(['room-1', 4, '2026-10-15', now]);
  });

  it('maps rows to conflicts[] (reservationCode, stayFrom, stayTo, guestCount)', async () => {
    const { tx } = fakeTx([
      {
        reservation_code: 'OTM-0152',
        stay_from: '2026-10-15',
        stay_to: '2026-10-19',
        guest_count: 4,
      },
      {
        reservation_code: 'OTM-0160',
        stay_from: '2026-11-01',
        stay_to: '2026-11-03',
        guest_count: '5',
      },
    ]);
    const out = await new ReservationCapacityCheck(new FixedClock(now)).overCapacity(
      tx,
      'room-1',
      3,
      '2026-10-15' as LocalDate,
    );
    expect(out).toEqual([
      { reservationCode: 'OTM-0152', stayFrom: '2026-10-15', stayTo: '2026-10-19', guestCount: 4 },
      { reservationCode: 'OTM-0160', stayFrom: '2026-11-01', stayTo: '2026-11-03', guestCount: 5 },
    ]);
  });

  it('query encodes the rule: counted = adults + children 6–11, live hold, active segment, night ≥ today', () => {
    const sql = OVER_CAPACITY_SQL.replace(/\s+/g, ' ');
    expect(sql).toContain('r.adults + r.children_6_11 > $2');
    expect(sql).not.toContain('children_under_6');
    expect(sql).toContain("r.status IN ('confirmed', 'in_house')");
    expect(sql).toContain("r.status = 'hold' AND r.hold_expires_at > $4");
    expect(sql).toContain('s.active');
    expect(sql).toContain('s.to_date > $3::date');
  });

  it('platform ships no default implementation any more; reservations provides the token', () => {
    expect('NO_BOOKINGS_YET' in roomCapacity).toBe(false);
    const root = join(__dirname, '../src/modules');
    const platform = readFileSync(join(root, 'platform/platform.module.ts'), 'utf8');
    expect(platform).not.toMatch(/provide:\s*ROOM_CAPACITY_CHECK/);
    const reservations = readFileSync(join(root, 'reservations/reservations.module.ts'), 'utf8');
    expect(reservations).toMatch(
      /provide:\s*ROOM_CAPACITY_CHECK,\s*useExisting:\s*ReservationCapacityCheck/,
    );
  });
});
