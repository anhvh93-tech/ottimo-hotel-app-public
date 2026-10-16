// E2E API – login limits (US-001; SR-AUTH-04 lockout, SR-RL-01 20 logins/IP/15 min). TC: r1-main-flows.md.
// Project "limits" (playwright.config.ts): runs AFTER rbac + api, one test at a time (serial), because
//  - every other spec may reset the limiter on a 429 (support/api.ts freshSession), which would wipe a
//    lockout these cases are building up;
//  - the lockout / IP-window cases themselves must not push the rest of the suite into 429.
// The limiter is reset before and after the file (and inside TC-NT-043 (c)), never relaxed in the API code.
import { expect, test } from '@playwright/test';
import {
  createThrowawayUser,
  expectProblem,
  loginRaw as login,
  needSeedPassword,
  requireEndpoints,
  RESET_PREFIXES,
  resetRateLimits,
  sessionOrSkip,
  testClock,
  uniq,
  type Problem,
} from '../support/api.js';
import { TEST_TOKEN, WEB_URL } from '../support/env.js';

const LOGIN: [string, string, string] = ['POST', '/v1/auth/login', 'login'];
const ME: [string, string, string] = ['GET', '/v1/me', 'getMe'];
const USERS: [string, string, string] = ['POST', '/v1/users', 'createUser'];
const RESET: [string, string, string] = [
  'POST',
  '/__test__/rate-limits/reset',
  'testResetRateLimits',
];
/** DS-E accounts + the throwaway lockout accounts of this file (never "qa." – see RESET_PREFIXES). */
const PREFIXES = [...RESET_PREFIXES, 'qa.e2e.lock'];

test.describe.configure({ mode: 'serial' });

test.describe(
  'L1 – khóa đăng nhập và giới hạn theo IP (tuần tự)',
  { tag: ['@api', '@sprint1'] },
  () => {
    test.beforeAll(async ({ request }) => {
      await resetRateLimits(request, 'trước nhóm limits', PREFIXES);
    });
    test.afterAll(async ({ request }) => {
      await resetRateLimits(request, 'sau nhóm limits', PREFIXES);
    });
    test.beforeEach(() => needSeedPassword());

    test('TC-NT-043 sai mật khẩu 5 lần → lần 6 bị khóa 429 RATE_LIMITED, kể cả mật khẩu đúng', async ({
      request,
    }) => {
      await requireEndpoints(request, 'TC-NT-043', [LOGIN, ME, USERS]);
      const owner = await sessionOrSkip(request, 'qa.owner');
      const u = await createThrowawayUser(request, owner, 'front_desk', 'qa.e2e.lock');
      const unknown = await login(request, `nobody.${uniq()}`, 'Wrong-password-123', WEB_URL);
      test.skip(
        unknown.status === 429,
        'môi trường: IP qua Caddy đã chạm SR-RL-01 và stack không có /__test__/rate-limits/reset',
      );
      for (let i = 1; i <= 5; i++) {
        const r = await login(request, u.username, `Wrong-password-${i}`, WEB_URL);
        expect(r.status, `lần ${i}: ${JSON.stringify(r.body)}`).toBe(401);
        // generic message, never "n lần còn lại" (content-guide auth.login.error_generic)
        expect((r.body as Problem).code).toBe((unknown.body as Problem).code);
        expect(JSON.stringify(r.body)).not.toMatch(/remaining|còn lại|attempt/i);
      }
      const sixth = await login(request, u.username, u.password, WEB_URL);
      expectProblem(sixth, 429, 'RATE_LIMITED');
      expect(sixth.token).toBeUndefined();
    });

    test('TC-NT-043 (b) hết 15 phút khóa → đăng nhập lại được (MutableClock)', async ({
      request,
    }) => {
      test.skip(
        process.env.E2E_CLOCK_CONTROL !== '1' || !TEST_TOKEN,
        'Cần E2E_CLOCK_CONTROL=1 + TEST_SUPPORT_TOKEN (tua đồng hồ dùng chung – chỉ stack dùng một lần)',
      );
      await requireEndpoints(request, 'TC-NT-043', [
        LOGIN,
        ME,
        USERS,
        ['GET', '/__test__/clock', 'testClock'],
      ]);
      const owner = await sessionOrSkip(request, 'qa.owner');
      const u = await createThrowawayUser(request, owner, 'front_desk', 'qa.e2e.lock');
      for (let i = 1; i <= 5; i++) await login(request, u.username, `Wrong-password-${i}`, WEB_URL);
      expect((await login(request, u.username, u.password, WEB_URL)).status).toBe(429);
      try {
        expect(
          (await testClock(request, owner, TEST_TOKEN!, { op: 'advance', advanceMs: 14 * 60_000 }))
            .status,
        ).toBe(200);
        expect((await login(request, u.username, u.password, WEB_URL)).status).toBe(429);
        expect(
          (await testClock(request, owner, TEST_TOKEN!, { op: 'advance', advanceMs: 61_000 }))
            .status,
        ).toBe(200);
        expect((await login(request, u.username, u.password, WEB_URL)).status).toBe(200);
      } finally {
        await testClock(request, owner, TEST_TOKEN!, { op: 'reset' });
      }
    });

    test('TC-NT-043 (c) SR-RL-01: lần đăng nhập thứ 21 từ một IP trong 15 phút → 429; reset (test-support) → hết chặn', async ({
      request,
    }) => {
      test.skip(!TEST_TOKEN, 'Cần TEST_SUPPORT_TOKEN để đặt lại bộ đếm trước/sau ca');
      await requireEndpoints(request, 'TC-NT-043', [LOGIN, RESET]);
      await sessionOrSkip(request, 'qa.owner'); // owner session cached BEFORE the IP window fills up
      expect(await resetRateLimits(request, 'TC-NT-043 (c) trước', PREFIXES)).toBe(true);
      // Unknown usernames through Caddy (its own client IP): no account counter is touched, only the IP window.
      const statuses: number[] = [];
      for (let i = 1; i <= 21; i++) {
        statuses.push(
          (await login(request, `nobody.rl.${uniq()}`, 'Wrong-password-123', WEB_URL)).status,
        );
      }
      expect(statuses.slice(0, 20), 'lần 1–20: từ chối chung 401, chưa bị giới hạn').toEqual(
        Array(20).fill(401),
      );
      const blocked = await login(request, `nobody.rl.${uniq()}`, 'Wrong-password-123', WEB_URL);
      expect([statuses[20], blocked.status], 'lần 21, 22 → 429').toEqual([429, 429]);
      expectProblem(blocked, 429, 'RATE_LIMITED');
      expect(await resetRateLimits(request, 'TC-NT-043 (c) sau', PREFIXES)).toBe(true);
      const after = await login(request, `nobody.rl.${uniq()}`, 'Wrong-password-123', WEB_URL);
      expect(after.status, 'sau reset: lại là 401 chung').toBe(401);
    });
  },
);
