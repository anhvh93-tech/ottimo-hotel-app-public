/**
 * Single source of "now" for the whole backend (ADR-008).
 * Business code must inject Clock instead of calling new Date()/Date.now() (lint rule).
 */
export const CLOCK = Symbol('CLOCK');

export interface Clock {
  now(): Date;
}

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}

/** Frozen clock for dev/staging/test (CLOCK_OVERRIDE=2026-10-15T09:00:00+07:00). Never in production. */
export class FixedClock implements Clock {
  constructor(private readonly fixed: Date) {}
  now(): Date {
    return new Date(this.fixed.getTime());
  }
}

/** APP_ENVs where CLOCK_OVERRIDE is honoured – APP_ENV, not NODE_ENV (FB-R1-SEC-OPS-09). */
const CLOCK_OVERRIDE_ENVS = ['dev', 'test', 'staging'];

export function clockFromEnv(env: NodeJS.ProcessEnv): Clock {
  const override = env.CLOCK_OVERRIDE;
  // Unknown or missing APP_ENV never enables the override (config.ts also rejects it at startup).
  if (override && CLOCK_OVERRIDE_ENVS.includes(env.APP_ENV ?? '')) {
    const d = new Date(override);
    if (Number.isNaN(d.getTime())) throw new Error('CLOCK_OVERRIDE is not a valid ISO date');
    return new FixedClock(d);
  }
  return new SystemClock();
}

/**
 * Format an instant as ISO-8601 with a fixed offset.
 * Asia/Ho_Chi_Minh is UTC+07:00 with no DST, so a fixed offset is exact for the MVP.
 * R2: replace with @date-fns/tz when properties in other zones are supported (ADR-007/008).
 */
export function toOffsetIso(instant: Date, offsetMinutes = 420): string {
  const shifted = new Date(instant.getTime() + offsetMinutes * 60_000);
  const base = shifted.toISOString().replace('Z', '');
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMinutes);
  const hh = String(Math.floor(abs / 60)).padStart(2, '0');
  const mm = String(abs % 60).padStart(2, '0');
  return `${base}${sign}${hh}:${mm}`;
}
