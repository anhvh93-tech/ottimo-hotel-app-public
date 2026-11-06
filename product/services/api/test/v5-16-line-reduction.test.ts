/**
 * V5-16 – BR-438 rule on its own (contract 0.3.13 1.20; DOM rules-v1.0.5 3.1, 7.2; US-177). No DB.
 * - what a reduction is (void / lower quantity / lower price of a non-night line; an increase is not);
 * - who is limited (FD/FDL without OWN/MGR);
 * - the facts of the ROOT line: typed by hand (A30 or a minibar count), by the caller, in the current business day (rollover
 *   06:00 – BR-438-03: posted 23:50, 00:20 the next calendar day is the same business day, 06:10 is not);
 * - a late check-out line posted by B15 with source `manual` is NOT an A30 line (BR-438-04, H-08).
 */
import { describe, expect, it } from 'vitest';
import {
  A30_CATEGORIES,
  BR438_DENIAL,
  FOC_REQUEST_FLOW,
  NIGHT_LINE_CATEGORIES,
  type RootLine,
  br438Refusal,
  frontDeskMayReduce,
  isLineReduction,
  limitedByBr438,
  reductionScope,
} from '../src/modules/folio/public/line-reduction';
import { GUEST_HIDDEN_REASONS, lineLabel } from '../src/modules/folio/public/line-labels';
import { FOC_REASON_CODES } from '../src/modules/approvals/public/approval.service';
import { businessDate } from '../src/shared/time';

const TZ = 'Asia/Ho_Chi_Minh';
const ROLLOVER = '06:00';
const HANH = '0192a1b0-0000-7000-8000-00000000a001';
const LAN = '0192a1b0-0000-7000-8000-00000000a002';
const dayAt = (iso: string) => ({
  today: businessDate(new Date(iso), TZ, ROLLOVER),
  tz: TZ,
  rollover: ROLLOVER,
});
const root = (over: Partial<RootLine> = {}): RootLine => ({
  id: '0192a1b0-0000-7000-8000-0000000b0001',
  source: 'manual',
  category: 'fnb',
  postedBy: HANH,
  postedAt: new Date('2026-11-12T10:15:00+07:00'),
  ...over,
});

describe('V5-16 – what a BR-438 reduction is', () => {
  it('void, lower quantity, lower price of a non-night line; never an increase or the same amount', () => {
    expect(isLineReduction('fnb', 105_000, 70_000)).toBe(true);
    expect(isLineReduction('laundry', 120_000, 0)).toBe(true);
    expect(isLineReduction('late_checkout', 300_000, 0)).toBe(true);
    expect(isLineReduction('fnb', 35_000, 70_000)).toBe(false); // T-16-8: increase
    expect(isLineReduction('fnb', 70_000, 70_000)).toBe(false);
  });

  it('night-derived lines stay outside (room, extra_person, room_change_difference)', () => {
    for (const c of NIGHT_LINE_CATEGORIES) expect(isLineReduction(c, 900_000, 800_000)).toBe(false);
    expect([...NIGHT_LINE_CATEGORIES].sort()).toEqual([
      'extra_person',
      'room',
      'room_change_difference',
    ]);
  });

  it('only FD/FDL without OWN/MGR are limited (BR-438 (3): OWN/MGR as before)', () => {
    expect(limitedByBr438(['front_desk'])).toBe(true);
    expect(limitedByBr438(['front_desk_lead'])).toBe(true);
    expect(limitedByBr438(['manager'])).toBe(false);
    expect(limitedByBr438(['owner'])).toBe(false);
    expect(limitedByBr438(['front_desk', 'manager'])).toBe(false);
  });
});

describe('V5-16 – facts of the root line (BR-438 (1) a–b)', () => {
  it('T16-6 / BR-438-01: own A30 line of today → all true, allowed', () => {
    const s = reductionScope(root(), HANH, dayAt('2026-11-12T10:20:00+07:00'));
    expect(s).toEqual({
      rootLineId: root().id,
      rootLineManual: true,
      postedByActor: true,
      sameBusinessDay: true,
    });
    expect(frontDeskMayReduce(s)).toBe(true);
  });

  it('T16-7 / BR-438-02: another front desk → postedByActor false, refused', () => {
    const s = reductionScope(root(), LAN, dayAt('2026-11-12T15:00:00+07:00'));
    expect(s.postedByActor).toBe(false);
    expect(frontDeskMayReduce(s)).toBe(false);
  });

  it('T16-8 / BR-438-03: posted 23:50 → 00:20 next day is the same business day, 06:10 is not', () => {
    const late = root({ category: 'laundry', postedAt: new Date('2026-11-12T23:50:00+07:00') });
    expect(reductionScope(late, HANH, dayAt('2026-11-13T00:20:00+07:00')).sameBusinessDay).toBe(
      true,
    );
    const next = reductionScope(late, HANH, dayAt('2026-11-13T06:10:00+07:00'));
    expect(next.sameBusinessDay).toBe(false);
    expect(frontDeskMayReduce(next)).toBe(false);
  });

  it('T16-10 / BR-438-04 / H-08: a B15 late check-out line (source manual, posted by the same FD) is a system line', () => {
    const s = reductionScope(
      root({ category: 'late_checkout' }),
      HANH,
      dayAt('2026-11-12T10:20:00+07:00'),
    );
    expect(s).toMatchObject({ rootLineManual: false, postedByActor: true, sameBusinessDay: true });
    expect(frontDeskMayReduce(s)).toBe(false);
  });

  it('BR-438-01 (DOM 3.3 minibar example): the minibar count the person typed is that person’s line', () => {
    const count = root({ source: 'minibar_check', category: 'minibar' });
    const own = reductionScope(count, HANH, dayAt('2026-11-12T10:20:00+07:00'));
    expect(own).toMatchObject({ rootLineManual: true, postedByActor: true, sameBusinessDay: true });
    expect(frontDeskMayReduce(own)).toBe(true);
    // BR-438-02: Lan (next shift) on Hạnh's count → refused.
    expect(frontDeskMayReduce(reductionScope(count, LAN, dayAt('2026-11-12T15:00:00+07:00')))).toBe(
      false,
    );
  });

  it('guest requests, check-in / check-out, system lines and odd source/category pairs are not typed by hand', () => {
    for (const [source, category] of [
      ['minibar_check', 'fnb'],
      ['manual', 'minibar'],
      ['manual', 'early_departure_fee'],
      ['guest_app', 'cleaning'],
      ['checkin', 'early_checkin'],
      ['checkout', 'late_checkout'],
      ['system', 'early_departure_fee'],
      ['system', 'cleaning'],
    ] as const) {
      const s = reductionScope(
        root({ source, category }),
        HANH,
        dayAt('2026-11-12T10:20:00+07:00'),
      );
      expect(s.rootLineManual, `${source}/${category}`).toBe(false);
    }
    // A line without a person (a job) is never "posted by the actor".
    expect(
      reductionScope(root({ postedBy: null }), HANH, dayAt('2026-11-12T10:20:00+07:00'))
        .postedByActor,
    ).toBe(false);
  });

  it('A30 categories = what addFolioLine posts (catalogue + typed-in F&B / service / damage)', () => {
    expect([...A30_CATEGORIES].sort()).toEqual([
      'cleaning',
      'damage',
      'fnb',
      'laundry',
      'penalty',
      'service_fee',
    ]);
  });

  it('the refusal: 403 FORBIDDEN_ACTION + requiredFlow foc_request; the audit reason stays server side', () => {
    const e = br438Refusal();
    expect(e.status).toBe(403);
    const body = e.toBody('req-1');
    expect(body).toMatchObject({ code: 'FORBIDDEN_ACTION', requiredFlow: FOC_REQUEST_FLOW });
    expect(body).not.toHaveProperty('auditReason');
    expect(e.options.auditReason).toBe(BR438_DENIAL);
  });
});

describe('V5-16 – reason "Ghi nhầm" (US-177 AC8, AC10)', () => {
  it('entered_in_error is a FOC reason', () => {
    expect(FOC_REASON_CODES).toContain('entered_in_error');
  });

  it('AC10: the guest bill prints only "Miễn phí" for entered_in_error; the Desk keeps the reason; other reasons print', () => {
    const foc = (reason: string) => ({
      category: 'foc',
      description: 'foc',
      service_date: '2026-11-12',
      quantity: 1,
      label_params: { reason },
    });
    expect(GUEST_HIDDEN_REASONS).toEqual(['entered_in_error']);
    expect(lineLabel(foc('entered_in_error'), { guestFacing: true })).toEqual({
      labelKey: 'bill.line.foc',
    });
    expect(lineLabel(foc('entered_in_error'))).toEqual({
      labelKey: 'bill.line.foc',
      labelParams: { reason: 'entered_in_error' },
    });
    expect(lineLabel(foc('regular_vip'), { guestFacing: true })).toEqual({
      labelKey: 'bill.line.foc',
      labelParams: { reason: 'regular_vip' },
    });
    // Same rule for a special discount, and for a reason read from the approval (reasonOf).
    expect(
      lineLabel(
        { ...foc('x'), category: 'discount', label_params: null },
        { guestFacing: true, reasonOf: () => 'entered_in_error' },
      ),
    ).toEqual({ labelKey: 'bill.line.discount' });
  });
});
