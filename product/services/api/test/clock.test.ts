import { describe, expect, it } from 'vitest';
import { FixedClock, clockFromEnv, toOffsetIso } from '../src/clock';

describe('toOffsetIso', () => {
  it('formats an UTC instant in +07:00 (Asia/Ho_Chi_Minh)', () => {
    expect(toOffsetIso(new Date('2026-10-15T02:30:00.000Z'))).toBe('2026-10-15T09:30:00.000+07:00');
  });

  it('rolls the local date over midnight correctly', () => {
    expect(toOffsetIso(new Date('2026-10-15T17:30:00.000Z'))).toBe('2026-10-16T00:30:00.000+07:00');
  });
});

describe('clockFromEnv', () => {
  it('uses CLOCK_OVERRIDE outside production', () => {
    const clock = clockFromEnv({
      CLOCK_OVERRIDE: '2026-10-15T09:00:00+07:00',
      NODE_ENV: 'development',
    });
    expect(clock).toBeInstanceOf(FixedClock);
    expect(clock.now().toISOString()).toBe('2026-10-15T02:00:00.000Z');
  });

  it('ignores CLOCK_OVERRIDE in production', () => {
    const clock = clockFromEnv({
      CLOCK_OVERRIDE: '2026-10-15T09:00:00+07:00',
      NODE_ENV: 'production',
    });
    expect(clock).not.toBeInstanceOf(FixedClock);
  });
});
