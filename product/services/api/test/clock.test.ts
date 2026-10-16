import { describe, expect, it } from 'vitest';
import {
  type ClockState,
  type ClockStateStore,
  FixedClock,
  MutableClock,
  toOffsetIso,
} from '../src/clock';

describe('toOffsetIso', () => {
  it('formats an UTC instant in +07:00 (Asia/Ho_Chi_Minh)', () => {
    expect(toOffsetIso(new Date('2026-10-15T02:30:00.000Z'))).toBe('2026-10-15T09:30:00.000+07:00');
  });

  it('rolls the local date over midnight correctly', () => {
    expect(toOffsetIso(new Date('2026-10-15T17:30:00.000Z'))).toBe('2026-10-16T00:30:00.000+07:00');
  });
});

/** In-memory store standing in for dev_clock; `external()` simulates another process writing. */
class MemoryStore implements ClockStateStore {
  state: ClockState | null = null;
  loads = 0;
  private listeners: Array<() => void> = [];
  async load() {
    this.loads++;
    return this.state;
  }
  async save(s: ClockState | null) {
    this.state = s;
  }
  async subscribe(cb: () => void) {
    this.listeners.push(cb);
    return async () => undefined;
  }
  external(s: ClockState | null) {
    this.state = s;
    for (const l of this.listeners) l();
  }
}

describe('MutableClock (ADR-008)', () => {
  const real = new FixedClock(new Date('2026-10-15T02:00:00.000Z'));

  async function make() {
    const store = new MemoryStore();
    const clock = new MutableClock(store, real, 1_000);
    await clock.start();
    return { store, clock };
  }

  it('follows the system clock when dev_clock has no row', async () => {
    const { clock } = await make();
    expect(clock.now().toISOString()).toBe('2026-10-15T02:00:00.000Z');
    expect(clock.mode()).toBe('system');
  });

  it('set() keeps running from the new time; advance() moves forward', async () => {
    const { clock, store } = await make();
    await clock.set(new Date('2026-10-15T15:59:00.000Z')); // 22:59 +07:00
    expect(store.state?.frozenAt).toBeNull();
    real.advance(30_000);
    expect(clock.now().toISOString()).toBe('2026-10-15T15:59:30.000Z');
    await clock.advance(120_000);
    expect(clock.now().toISOString()).toBe('2026-10-15T16:01:30.000Z');
    expect(clock.mode()).toBe('offset');
    real.set(new Date('2026-10-15T02:00:00.000Z'));
  });

  it('freeze() stops time, unfreeze() resumes, reset() returns to system time', async () => {
    const { clock } = await make();
    await clock.set(new Date('2026-10-16T04:59:00.000Z'));
    await clock.freeze();
    real.advance(60_000);
    expect(clock.now().toISOString()).toBe('2026-10-16T04:59:00.000Z');
    await clock.advance(60_000);
    expect(clock.now().toISOString()).toBe('2026-10-16T05:00:00.000Z');
    expect(clock.mode()).toBe('frozen');
    await clock.unfreeze();
    real.advance(1_000);
    expect(clock.now().toISOString()).toBe('2026-10-16T05:00:01.000Z');
    await clock.reset();
    expect(clock.now().getTime()).toBe(real.now().getTime());
    real.set(new Date('2026-10-15T02:00:00.000Z'));
  });

  it('picks up a change made by another process (NOTIFY clock_changed)', async () => {
    const { clock, store } = await make();
    store.external({ offsetMs: 3_600_000, frozenAt: null });
    await clock.refresh();
    expect(clock.now().toISOString()).toBe('2026-10-15T03:00:00.000Z');
  });

  it('reloads a stale cache (> 1 s) in the background', async () => {
    const { clock, store } = await make();
    const before = store.loads;
    store.state = { offsetMs: 60_000, frozenAt: null };
    real.advance(1_500);
    clock.now(); // triggers background reload
    await clock.refresh();
    expect(store.loads).toBeGreaterThan(before);
    expect(clock.now().toISOString()).toBe('2026-10-15T02:01:01.500Z');
    real.set(new Date('2026-10-15T02:00:00.000Z'));
  });
});
