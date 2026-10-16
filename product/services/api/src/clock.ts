/**
 * Single source of "now" for the whole backend (ADR-008).
 * Business code must inject Clock instead of calling new Date()/Date.now() (lint rule: this file is the
 * only one allowed to read the system time).
 *
 * - SystemClock: production (CLOCK_MODE=system, the default).
 * - MutableClock: dev/test/staging (CLOCK_MODE=mutable). Offset/freeze live in the one-row table
 *   dev_clock shared by api and worker; each process caches the state ≤ 1 s and reloads at once on
 *   NOTIFY clock_changed. Set/advanced through the test-support endpoints (openapi.test.yaml).
 * - FixedClock: unit tests only (never selected by configuration).
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

/** Frozen clock for unit tests. Configuration never selects it (CLOCK_OVERRIDE was removed – ADR-008). */
export class FixedClock implements Clock {
  constructor(private fixed: Date) {}
  now(): Date {
    return new Date(this.fixed.getTime());
  }
  set(at: Date): void {
    this.fixed = new Date(at.getTime());
  }
  advance(ms: number): void {
    this.fixed = new Date(this.fixed.getTime() + ms);
  }
}

/** Persisted fake-clock state. No row in dev_clock = system time. */
export interface ClockState {
  offsetMs: number;
  frozenAt: Date | null;
}

export type ClockMode = 'system' | 'offset' | 'frozen';

/** Storage of the shared state (dev_clock in PostgreSQL – src/db/clock-store.ts). */
export interface ClockStateStore {
  load(): Promise<ClockState | null>;
  /** null = delete the row (back to system time). Must notify other processes. */
  save(state: ClockState | null): Promise<void>;
  /** Calls onChange whenever another process saved a new state. Returns an unsubscribe function. */
  subscribe(onChange: () => void): Promise<() => Promise<void>>;
}

export interface ClockSnapshot {
  now: Date;
  mode: ClockMode;
  offsetMs: number;
}

export class MutableClock implements Clock {
  private state: ClockState | null = null;
  private loadedAt = Number.NEGATIVE_INFINITY;
  private refreshing: Promise<void> | null = null;
  private unsubscribe: (() => Promise<void>) | null = null;

  constructor(
    private readonly store: ClockStateStore,
    private readonly base: Clock = new SystemClock(),
    private readonly cacheMs = 1_000,
    private readonly onError: (err: unknown) => void = () => undefined,
  ) {}

  /** Load the state and start listening for changes made by other processes. */
  async start(): Promise<void> {
    await this.refresh();
    this.unsubscribe = await this.store.subscribe(() => {
      this.loadedAt = Number.NEGATIVE_INFINITY;
      void this.refresh().catch(this.onError);
    });
  }

  async stop(): Promise<void> {
    await this.unsubscribe?.();
    this.unsubscribe = null;
  }

  now(): Date {
    const real = this.base.now().getTime();
    if (real - this.loadedAt > this.cacheMs && !this.refreshing) {
      // Stale cache: reload in the background; this call still answers from the last known state.
      void this.refresh().catch(this.onError);
    }
    return new Date(this.compute(real));
  }

  snapshot(): ClockSnapshot {
    const now = this.now();
    return {
      now,
      mode: this.mode(),
      offsetMs: this.state ? now.getTime() - this.base.now().getTime() : 0,
    };
  }

  mode(): ClockMode {
    if (!this.state) return 'system';
    return this.state.frozenAt ? 'frozen' : 'offset';
  }

  async refresh(): Promise<void> {
    if (this.refreshing) return this.refreshing;
    const startedAt = this.base.now().getTime();
    this.refreshing = this.store
      .load()
      .then((s) => {
        this.state = s;
        this.loadedAt = startedAt;
      })
      .finally(() => {
        this.refreshing = null;
      });
    return this.refreshing;
  }

  /** Jump to `at` and keep running from there. */
  async set(at: Date): Promise<ClockSnapshot> {
    const frozen = this.state?.frozenAt ? at : null;
    return this.apply({ offsetMs: at.getTime() - this.base.now().getTime(), frozenAt: frozen });
  }

  /** Move forward (or back, with a negative value) by `ms`; a frozen clock stays frozen. */
  async advance(ms: number): Promise<ClockSnapshot> {
    const current = this.state ?? { offsetMs: 0, frozenAt: null };
    return this.apply({
      offsetMs: current.offsetMs + ms,
      frozenAt: current.frozenAt ? new Date(current.frozenAt.getTime() + ms) : null,
    });
  }

  async freeze(): Promise<ClockSnapshot> {
    const now = this.now();
    return this.apply({ offsetMs: now.getTime() - this.base.now().getTime(), frozenAt: now });
  }

  async unfreeze(): Promise<ClockSnapshot> {
    const now = this.now();
    return this.apply({ offsetMs: now.getTime() - this.base.now().getTime(), frozenAt: null });
  }

  async reset(): Promise<ClockSnapshot> {
    return this.apply(null);
  }

  private async apply(state: ClockState | null): Promise<ClockSnapshot> {
    await this.store.save(state);
    this.state = state;
    this.loadedAt = this.base.now().getTime();
    return this.snapshot();
  }

  private compute(realMs: number): number {
    if (!this.state) return realMs;
    if (this.state.frozenAt) return this.state.frozenAt.getTime();
    return realMs + this.state.offsetMs;
  }
}

/**
 * Format an instant as ISO-8601 with a fixed offset (used by /health).
 * Property-aware formatting with a real time zone: src/shared/time.ts toZonedIso().
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
