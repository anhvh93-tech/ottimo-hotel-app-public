/**
 * BE-B Sprint 4 – the pure FOC key allocation (folio/public/reductions.ts) against br-examples.json
 * (BR-434 v0.3.5/v0.3.6 – S4-02, S4-18, S4-23). Unit, no database: the write (FolioService.syncReductions) and
 * every preview (FolioService.previewStayReductions → MovePreview) use exactly these functions.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  type KeyClaim,
  type ReductionRequest,
  allocateKey,
  approvalOrder,
  focDateMap,
  keyKindOf,
  keyOf,
  maxNewRequestVnd,
  previewNightReductions,
} from '../src/modules/folio/public/reductions';

const ORACLES = JSON.parse(
  readFileSync(join(__dirname, '../../../tests/fixtures/br-examples.json'), 'utf8'),
) as {
  examples: Array<{
    id: string;
    input: Record<string, unknown>;
    expected: Record<string, unknown>;
  }>;
};
const oracle = (id: string) => {
  const o = ORACLES.examples.find((x) => x.id === id);
  if (!o) throw new Error(`oracle ${id} missing`);
  return o;
};

const at = (iso: string) => new Date(iso);
const claim = (
  id: string,
  amountVnd: number,
  decided: string | null,
  requested = decided,
): KeyClaim => ({
  id,
  amountVnd,
  decidedAt: decided ? at(decided) : null,
  requestedAt: at(requested ?? '2026-10-20T08:00:00Z'),
});

describe('allocateKey (S4-23 – BR-434 v0.3.6)', () => {
  it('BR-434-11: approval order, each reduction gets line − what the earlier ones apply; Σ = min(Σ, line)', () => {
    const o = oracle('BR-434-11');
    const [d, f] = o.input.reductions as Array<{ approvedVnd: number }>;
    const rates = o.input.nightRateByRoomVnd as Record<string, number>;
    const disc = claim('disc', d!.approvedVnd, '2026-10-20T09:00:00Z');
    const foc = claim('foc', f!.approvedVnd, '2026-10-20T10:00:00Z');
    (o.input.roomSequence as string[]).forEach((room, i) => {
      const a = allocateKey(rates[room] as number, [foc, disc], []);
      expect(a.applied.get('disc')).toBe(
        (o.expected.specialDiscountAppliedSequenceVnd as number[])[i],
      );
      expect(a.applied.get('foc')).toBe((o.expected.focAppliedSequenceVnd as number[])[i]);
      expect((rates[room] as number) - a.appliedTotalVnd).toBe(
        (o.expected.reductionNightNetSequenceVnd as number[])[i],
      );
    });
    // Reversed order: same money for the guest, another split.
    const foc1 = claim('foc', f!.approvedVnd, '2026-10-20T09:00:00Z');
    const disc2 = claim('disc', d!.approvedVnd, '2026-10-20T10:00:00Z');
    const r = allocateKey(rates['302'] as number, [disc2, foc1], []);
    const split = o.expected.reversedOrderSplitAt302Vnd as { foc: number; specialDiscount: number };
    expect([r.applied.get('foc'), r.applied.get('disc')]).toEqual([
      split.foc,
      split.specialDiscount,
    ]);
    expect(r.appliedTotalVnd).toBe(rates['302']);
  });

  it('BR-434-12: a pending request will apply min(asked, line − approved applied); nothing more can be asked', () => {
    const o = oracle('BR-434-12');
    const rates = o.input.nightRateByRoomVnd as Record<string, number>;
    const disc = claim('disc', 250_000, '2026-10-20T09:00:00Z');
    const pending = claim('foc', 792_000, null, '2026-10-20T10:00:00Z');
    const at302 = allocateKey(rates['302'] as number, [disc], [pending]);
    const note = o.expected.queueNoteVnd as { willApply: number };
    expect(at302.willApply.get('foc')).toBe(note.willApply);
    // After approval: applied in approval order.
    const approved = claim('foc', 792_000, '2026-10-20T11:00:00Z');
    const after = allocateKey(rates['302'] as number, [approved, disc], []);
    expect(after.applied.get('foc')).toBe(o.expected.focAppliedAfterApprovalVnd);
    expect(maxNewRequestVnd(rates['302'] as number, after, [])).toBe(
      o.expected.maxNewRequestAt302Vnd,
    );
    expect(allocateKey(rates['401'] as number, [approved, disc], []).applied.get('foc')).toBe(
      o.expected.focAppliedAfterReturnTo401Vnd,
    );
    expect(
      maxNewRequestVnd(rates['401'] as number, allocateKey(rates['401'] as number, [disc], []), []),
    ).toBe(o.expected.maxRequestAt401Vnd);
  });

  it('BR-434-07 / BR-412-15: the applied amount comes from the APPROVED amount, 0 = dormant, never negative', () => {
    const o = oracle('BR-434-07');
    const foc = claim('foc', o.input.approvedFocVnd as number, '2026-10-20T09:00:00Z');
    const seq = (o.input.nightRateSequenceVnd as number[]).map((rate) =>
      allocateKey(rate, [foc], []).applied.get('foc'),
    );
    expect(seq).toEqual(o.expected.focSequenceVnd);
    expect(allocateKey(0, [foc], []).applied.get('foc')).toBe(0);
    expect(allocateKey(-5, [foc], [claim('p', 10, null)]).willApply.get('p')).toBe(0);
  });

  it('approval order: decided time, then created first, then id; undecided last', () => {
    const a = claim('a', 1, '2026-10-20T10:00:00Z', '2026-10-20T07:00:00Z');
    const b = claim('b', 1, '2026-10-20T10:00:00Z', '2026-10-20T06:00:00Z');
    const c = claim('c', 1, '2026-10-20T09:00:00Z');
    expect([a, b, c].sort(approvalOrder).map((x) => x.id)).toEqual(['c', 'b', 'a']);
  });

  it('S4-23 (s3-round8 code-2): a line without a service date takes no slot of the date map', () => {
    expect([...focDateMap(['', '2026-12-17', '2026-12-18'], ['2026-12-20', '2026-12-21'])]).toEqual(
      [
        ['2026-12-17', '2026-12-20'],
        ['2026-12-18', '2026-12-21'],
      ],
    );
  });

  it('keys: room / extra-person by date, early / late one per stay, any other line by itself', () => {
    expect(keyKindOf('room')).toBe('night');
    expect(keyKindOf('extra_person')).toBe('night');
    expect(keyKindOf('late_checkout')).toBe('stay');
    expect(keyKindOf('early_checkin')).toBe('stay');
    expect(keyKindOf('minibar')).toBe('line');
    expect(keyOf({ category: 'room', serviceDate: '2026-11-11', originLineId: 'x' })).toBe(
      'night:room:2026-11-11',
    );
    expect(keyOf({ category: 'late_checkout', serviceDate: null, originLineId: 'x' })).toBe(
      'stay:late_checkout',
    );
    expect(keyOf({ category: 'fnb', serviceDate: null, originLineId: 'x' })).toBe('line:x');
  });
});

describe('previewNightReductions (BE-A M2 – xem trước = lệnh ghi)', () => {
  const req = (over: Partial<ReductionRequest>): ReductionRequest => ({
    id: 'r',
    type: 'foc',
    status: 'approved',
    focState: 'applied',
    amountVnd: 792_000,
    decidedAt: at('2026-10-20T09:00:00Z'),
    requestedAt: at('2026-10-20T08:00:00Z'),
    category: 'room',
    serviceDate: '2026-12-17',
    originLineId: 'l',
    reasonCode: 'service_recovery',
    ...over,
  });

  it('BR-434-03: a dropped date goes to the first added date (min with its new price)', () => {
    const o = oracle('BR-434-03');
    const rates = o.input.nightRatesVnd as Record<string, number>;
    const to = o.input.to as { arrivalDate: string; departureDate: string };
    const nights = Object.keys(rates)
      .filter((d) => d >= to.arrivalDate && d < to.departureDate)
      .map((d) => ({ date: d, roomVnd: rates[d] as number, extraPersonVnd: 0 }));
    const out = previewNightReductions({
      requests: [req({})],
      oldDates: ['2026-12-17', '2026-12-18', '2026-12-19'],
      nights,
    });
    const focs = Object.fromEntries(
      [...out].filter(([, v]) => v.roomFocVnd > 0).map(([d, v]) => [d, v.roomFocVnd]),
    );
    expect(focs).toEqual(o.expected.focByDateVnd);
  });

  it('BR-434-10: a pending request on a dropped date without a counterpart is not carried; a moved one shows "will apply"', () => {
    const pending = req({
      id: 'p',
      status: 'pending',
      focState: null,
      decidedAt: null,
      serviceDate: '2026-12-03',
    });
    const out = previewNightReductions({
      requests: [pending],
      oldDates: ['2026-12-03', '2026-12-04', '2026-12-05'],
      nights: [
        { date: '2026-12-04', roomVnd: 911_000, extraPersonVnd: 0 },
        { date: '2026-12-05', roomVnd: 911_000, extraPersonVnd: 0 },
      ],
    });
    expect([...out.values()].every((v) => v.roomPendingVnd === 0 && v.roomFocVnd === 0)).toBe(true);
    const moved = previewNightReductions({
      requests: [pending],
      oldDates: ['2026-12-03', '2026-12-04'],
      nights: [
        { date: '2026-12-10', roomVnd: 700_000, extraPersonVnd: 0 },
        { date: '2026-12-11', roomVnd: 700_000, extraPersonVnd: 0 },
      ],
    });
    expect(moved.get('2026-12-10')?.roomPendingVnd).toBe(700_000);
  });

  it('a FOC suspended by a no-show is not on the nights of a move preview', () => {
    const out = previewNightReductions({
      requests: [req({ focState: 'suspended' })],
      oldDates: ['2026-12-17'],
      nights: [{ date: '2026-12-17', roomVnd: 792_000, extraPersonVnd: 0 }],
    });
    expect(out.get('2026-12-17')?.roomFocVnd).toBe(0);
  });
});
