/**
 * v1.0.5 PR-D1 (BE-D) – unit, no database:
 * - `departuresDateFor` (OpenAPI 0.3.13 bổ sung 1, BE C0313-02, BUG-R4-036; contract 1.19 T10-10): the departures list
 *   of getArrivalsDepartures follows the CALENDAR date in the post-midnight window when `date` is absent.
 * The DB cases (T10-10 on the real lists, KPI on the business date) are in integration/dashboard-s4-bed.test.ts.
 */
import { describe, expect, it } from 'vitest';
import { departuresDateFor } from '../src/modules/reporting/internal/dashboard.service';

describe('departuresDateFor (BE C0313-02)', () => {
  it('post-midnight window (calendar = business + 1) and no `date` → the calendar date', () => {
    expect(departuresDateFor(undefined, '2026-11-23', '2026-11-23', '2026-11-24')).toBe(
      '2026-11-24',
    );
    expect(departuresDateFor('', '2026-11-23', '2026-11-23', '2026-11-24')).toBe('2026-11-24');
    // month / year ends
    expect(departuresDateFor(undefined, '2026-11-30', '2026-11-30', '2026-12-01')).toBe(
      '2026-12-01',
    );
    expect(departuresDateFor(undefined, '2026-12-31', '2026-12-31', '2027-01-01')).toBe(
      '2027-01-01',
    );
  });

  it('a `date` sent → that date, also in the window (Desk asked for a day on purpose)', () => {
    expect(departuresDateFor('2026-11-23', '2026-11-23', '2026-11-23', '2026-11-24')).toBe(
      '2026-11-23',
    );
    expect(departuresDateFor('2026-11-20', '2026-11-20', '2026-11-23', '2026-11-24')).toBe(
      '2026-11-20',
    );
  });

  it('outside the window (calendar = business date) → the business date', () => {
    expect(departuresDateFor(undefined, '2026-11-24', '2026-11-24', '2026-11-24')).toBe(
      '2026-11-24',
    );
  });
});
