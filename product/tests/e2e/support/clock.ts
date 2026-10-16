// MutableClock + job runner (docs/api/openapi.test.yaml): /__test__/clock, /__test__/jobs/{jobKey}/run.
// Used ONLY by project "clock" (serial, after every other API project): moving the clock changes "today" for the
// whole stack and expires every session (idle/absolute timeouts follow Clock.now()) – session() re-validates
// with getMe and logs in again after each jump.
//
// Enabled when TEST_SUPPORT_TOKEN is known AND (CI – disposable stack – OR E2E_CLOCK_CONTROL=1). On the shared dev
// stack the clock tests stay skipped unless someone opts in (other people/agents use the same api + worker).
import { expect, test, type APIRequestContext } from '@playwright/test';
import { call, propertyIdOf, session, type StaffSession } from './api.js';
import { TEST_TOKEN } from './env.js';
import { weekdayArrival } from './s2.js';

export const CLOCK_ENABLED =
  !!TEST_TOKEN && (!!process.env.CI || process.env.E2E_CLOCK_CONTROL === '1');

export function needClock(tc: string): void {
  test.skip(
    !CLOCK_ENABLED,
    `${tc}: cần đồng hồ giả – TEST_SUPPORT_TOKEN + (CI hoặc E2E_CLOCK_CONTROL=1); stack dev dùng chung không tua giờ`,
  );
}

async function owner(ctx: APIRequestContext): Promise<StaffSession> {
  return session(ctx, 'qa.owner');
}

/**
 * {op:freeze} then {op:set, at} – MutableClock.set keeps a frozen clock frozen at exactly `at` (clock.ts), so
 * "1 giây trước hạn" and "tạo lúc 10:00 + 12 giờ" are deterministic. Both calls use the owner session that is
 * valid BEFORE the jump; after it, session() logs in again where needed (sessions follow Clock.now()).
 */
export async function setClock(ctx: APIRequestContext, at: string): Promise<string> {
  const o = await owner(ctx);
  let now = '';
  for (const body of [{ op: 'freeze' }, { op: 'set', at }]) {
    const r = await call<{ now: string; mode: string }>(ctx, 'POST', '/__test__/clock', {
      session: o,
      headers: { 'x-test-token': TEST_TOKEN! },
      body,
    });
    expect(r.status, `clock ${JSON.stringify(body)}: ${JSON.stringify(r.body)}`).toBe(200);
    now = r.body.now;
  }
  expectNear(now, at, 'clock set');
  // api/worker đọc dev_clock qua cache ≤ 1 giây (openapi.test.yaml): chờ tới khi /health trả đúng giờ mới
  for (let i = 0; i < 20; i++) {
    const h = await call<{ time: string }>(ctx, 'GET', '/health');
    if (Math.abs(new Date(h.body.time).getTime() - new Date(at).getTime()) <= 2000) break;
    await new Promise((r) => setTimeout(r, 200));
  }
  return now;
}

/** |actual − expected| ≤ tolMs (frozen clock: set + freeze are two calls, a few ms apart). */
export function expectNear(
  actual: string | undefined,
  expected: string,
  what = '',
  tolMs = 2000,
): void {
  const a = new Date(actual ?? '').getTime();
  const e = new Date(expected).getTime();
  expect(Math.abs(a - e), `${what} ${actual} ≠ ${expected}`).toBeLessThanOrEqual(tolMs);
}

export async function resetClock(ctx: APIRequestContext): Promise<void> {
  if (!CLOCK_ENABLED) return;
  try {
    await call(ctx, 'POST', '/__test__/clock', {
      session: await owner(ctx),
      headers: { 'x-test-token': TEST_TOKEN! },
      body: { op: 'reset' },
    });
  } catch {
    /* best effort – next run resets again */
  }
}

export interface JobRun {
  status: 'done' | 'skipped_already_ran' | 'skipped_catchup_window';
  stats?: Record<string, unknown>;
}

/**
 * Job keys: architecture 9.1 names first, then the names the build registered (BE-A dùng
 * `reservation.hold_expiry`, `room_block.activation` – BUG-R2-021). Bỏ alias khi hai bên thống nhất.
 */
const JOB_ALIASES: Record<string, string[]> = {
  'hold.expire': ['hold.expire', 'reservation.hold_expiry'],
  'ooo.activate': ['ooo.activate', 'room_block.activation'],
};

/** Run job `jobKey` now; null when no alias is registered on the build (404). */
export async function runJobIfAny(
  ctx: APIRequestContext,
  jobKey: string,
  propertyId?: string,
): Promise<JobRun | null> {
  const o = await owner(ctx);
  for (const key of JOB_ALIASES[jobKey] ?? [jobKey]) {
    const r = await call<JobRun>(ctx, 'POST', `/__test__/jobs/${key}/run`, {
      session: o,
      headers: { 'x-test-token': TEST_TOKEN! },
      body: { propertyId: propertyId ?? propertyIdOf(o) },
    });
    if (r.status === 404) continue;
    expect(r.status, `run job ${key}: ${JSON.stringify(r.body)}`).toBe(200);
    return r.body;
  }
  return null;
}

/** Run job `jobKey` (architecture 9.1) now; skips the test when the job is not registered on the build. */
export async function runJob(
  ctx: APIRequestContext,
  jobKey: string,
  propertyId?: string,
): Promise<JobRun> {
  const r = await runJobIfAny(ctx, jobKey, propertyId);
  test.skip(r === null, `job ${jobKey} chưa đăng ký trên build (404)`);
  return r!;
}

/** A random future business date for a clock scenario (far from the dates the api project books). */
export function scenarioDate(realToday: string, minOffset = 380, maxOffset = 700): string {
  // Beyond today+365: the api project never books there (booking window), so clock scenarios never collide
  // with leftovers of the parallel projects. The clock is moved there first, so the window is relative to it.
  const d = new Date(`${realToday}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + minOffset + Math.floor(Math.random() * (maxOffset - minOffset)));
  // T2–T5, không phải ngày đặc biệt: 1 đêm từ D không vướng ở tối thiểu BR-113
  return weekdayArrival(d.toISOString().slice(0, 10));
}
