/**
 * PR-C1 (OpenAPI 0.3.13) – unit, no database:
 * - V5-1A, BR-101 (4) v0.5.13 (addendum 1d): `nightlyPriceUnusual` = nightly × 30 < monthly OR nightly × 5 > monthly,
 *   integer comparison, exactly on a bound → no warning; the DOM examples for the monthly price 8.500.000.
 * - V5-44 (b), contract 1.11 + 1.24 (BE 19), T44-4: `cancelScheduledListPrice` maps ONLY the refusal of trigger
 *   0094 (SQLSTATE 23514 + its message) to 409 `effective` after ROLLBACK TO SAVEPOINT, with no audit; any other
 *   check_violation (or the same text under another SQLSTATE) is rethrown as is → 500.
 * FAKE data only.
 */
import { describe, expect, it, vi } from 'vitest';
import type { Tx } from '../src/db/database';
import type { AuditService } from '../src/modules/audit/public/audit.service';
import {
  RoomsService,
  isAppliedPriceRefusal,
} from '../src/modules/platform/internal/rooms.service';
import { nightlyPriceUnusual } from '../src/modules/platform/public/list-price-check';
import type {
  PropertyContextService,
  PropertyNow,
} from '../src/modules/platform/public/property-context';
import type { RoomCapacityCheck } from '../src/modules/platform/public/room-capacity';
import { ProblemError } from '../src/shared/problem';

describe('V5-1A nightlyPriceUnusual (BR-101 (4), contract 0.3.13 addendum 1d)', () => {
  it.each([
    // DOM BR-101 examples (v0.5.13) for the monthly price 8.500.000
    [283_000, true], // 283.000 × 30 = 8.490.000 < 8.500.000
    [284_000, false],
    [1_700_000, false], // exactly monthly ÷ 5 – on the bound, no warning
    [1_701_000, true],
    [8_000_000, true], // one zero too many
    [260_000, true], // BR-101-15
    [800_000, false], // price table 01/11 (101, 201)
  ])('monthly 8.500.000, nightly %i → unusual %s', (nightly, unusual) => {
    expect(nightlyPriceUnusual(nightly, 8_500_000)).toBe(unusual);
  });

  it('lower bound exactly: 9.000.000 ÷ 30 = 300.000 → no warning, 299.999 → warning', () => {
    expect(nightlyPriceUnusual(300_000, 9_000_000)).toBe(false);
    expect(nightlyPriceUnusual(299_999, 9_000_000)).toBe(true);
  });

  it('every price pair of the table 01/11 is usual', () => {
    for (const [m, n] of [
      [8_500_000, 800_000],
      [9_000_000, 800_000],
      [11_500_000, 1_100_000],
      [13_500_000, 1_300_000],
    ] as const) {
      expect(nightlyPriceUnusual(n, m)).toBe(false);
    }
  });

  it('no float, no overflow: MoneyVnd up to MAX_SAFE_INTEGER (× 30 is not a safe number)', () => {
    const max = Number.MAX_SAFE_INTEGER;
    expect(nightlyPriceUnusual(max, max)).toBe(true); // nightly × 5 > monthly
    // floor(max / 30) × 30 = max − 1 < max → just below the lower bound
    expect(nightlyPriceUnusual(Math.floor(max / 30), max)).toBe(true);
    expect(nightlyPriceUnusual(Math.floor(max / 30) + 1, max)).toBe(false);
    expect(() => nightlyPriceUnusual(0.5, 1)).toThrow(RangeError);
    expect(() => nightlyPriceUnusual(1, max + 1)).toThrow(RangeError);
  });
});

describe('V5-44 (b) cancelScheduledListPrice – trigger 0094 → 409 effective (T44-4)', () => {
  const ROOM = '0191f3a0-0000-7000-8000-000000000001';
  const REFUSAL = 'room_list_price: applied price row is append-only';
  const pgError = (code: string, message: string) =>
    Object.assign(new Error(message), { code, severity: 'ERROR' });

  /** A room with two rows; the cancelled one (2026-12-01) is future for the app clock. */
  function setup(deleteError: Error) {
    const statements: string[] = [];
    const tx = {
      ctx: { organizationId: 'org', propertyId: 'prop', userId: 'u1', actorType: 'user' },
      query: vi.fn(async (sql: string) => {
        statements.push(sql.trim().split(/\s+/).slice(0, 4).join(' '));
        if (sql.startsWith('DELETE FROM room_list_price')) throw deleteError;
        if (sql.includes('FROM room r') && sql.includes('FOR UPDATE')) {
          return { rows: [{ id: ROOM, version: 3 }], rowCount: 1 };
        }
        if (sql.includes('FROM room_list_price p WHERE p.room_id = $1 AND p.effective_from = $2')) {
          return {
            rows: [
              {
                id: 'row-2',
                monthly: 9_000_000,
                nightly: 800_000,
                reason: null,
                total: 2,
                earliest: '2026-10-01',
              },
            ],
            rowCount: 1,
          };
        }
        return { rows: [], rowCount: 0 };
      }),
    } as unknown as Tx;
    const pc: PropertyNow = {
      propertyId: 'prop',
      timezone: 'Asia/Ho_Chi_Minh',
      now: new Date('2026-11-07T03:00:00.000Z'),
      today: '2026-11-07',
      rollover: '06:00',
      iso: (d) => d.toISOString(),
    };
    const audit = { record: vi.fn() };
    const svc = new RoomsService(
      audit as unknown as AuditService,
      { now: vi.fn(async () => pc) } as unknown as PropertyContextService,
      {} as RoomCapacityCheck,
    );
    const run = () =>
      svc.cancelScheduledListPrice(
        tx,
        ROOM,
        3,
        { effectiveFrom: '2026-12-01', reason: 'Nhập nhầm giá đêm' },
        'req-1',
      );
    return { run, statements, audit };
  }

  it('the 0094 refusal (23514 + its message) → 409 INVALID_TRANSITION effective, rollback to savepoint, no audit', async () => {
    const { run, statements, audit } = setup(pgError('23514', REFUSAL));
    const err = await run().catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ProblemError);
    expect((err as ProblemError).status).toBe(409);
    expect((err as ProblemError).code).toBe('INVALID_TRANSITION');
    expect((err as ProblemError).options.extras).toEqual({ currentState: 'effective' });
    expect(statements).toContain('SAVEPOINT cancel_list_price');
    expect(statements).toContain('ROLLBACK TO SAVEPOINT cancel_list_price');
    expect(statements.some((s) => s.startsWith('UPDATE room'))).toBe(false);
    expect(audit.record).not.toHaveBeenCalled();
  });

  it('another check_violation stays the original error (→ 500), no rollback to savepoint, no audit', async () => {
    const other = pgError(
      '23514',
      'new row for relation "room_list_price" violates check constraint',
    );
    const { run, statements, audit } = setup(other);
    await expect(run()).rejects.toBe(other);
    expect(statements).not.toContain('ROLLBACK TO SAVEPOINT cancel_list_price');
    expect(audit.record).not.toHaveBeenCalled();
  });

  it('the same text under another SQLSTATE is not the trigger refusal either', async () => {
    const odd = pgError('P0001', REFUSAL);
    const { run } = setup(odd);
    await expect(run()).rejects.toBe(odd);
  });

  it('isAppliedPriceRefusal: SQLSTATE and message prefix both required', () => {
    expect(isAppliedPriceRefusal(pgError('23514', REFUSAL))).toBe(true);
    expect(isAppliedPriceRefusal(pgError('23514', `${REFUSAL} (extra)`))).toBe(true);
    expect(isAppliedPriceRefusal(pgError('23514', `x ${REFUSAL}`))).toBe(false);
    expect(isAppliedPriceRefusal(pgError('23505', REFUSAL))).toBe(false);
    expect(isAppliedPriceRefusal({ code: '23514' })).toBe(false);
    expect(isAppliedPriceRefusal(null)).toBe(false);
  });
});
