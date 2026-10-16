// Runs once, before workers start:
//  1. clears the stack's rate limits (POST /__test__/rate-limits/reset – needs TEST_SUPPORT_TOKEN and a
//     qa.owner session): every CI login comes from ONE IP and SR-RL-01 allows 20 logins/IP/15 min, so a
//     re-run on the same stack, or a previous project's logins, must not turn into 429 reds;
//  2. logs the DS-E accounts in sequentially and caches the sessions in e2e/.auth/sessions.json (gitignored,
//     0600). Workers reuse them (getMe re-validates) and log in again only when a session was revoked.
// No API / no login endpoint / no password → the specs skip with their own reason. In CI (CI=true) a stack
// whose DS-E accounts cannot log in (401: seed not loaded / wrong QA_SEED_PASSWORD) fails HERE with one
// clear message instead of hundreds of red cases.
import { request as pwRequest } from '@playwright/test';
import { isAvailable, LoginRateLimited, resetRateLimits, session } from './support/api.js';
import { API_URL, SEED_PASSWORD, SUBJECTS, TEST_TOKEN } from './support/env.js';

export default async function globalSetup(): Promise<void> {
  const ctx = await pwRequest.newContext();
  try {
    const health = await ctx
      .get(`${API_URL}/health`, { failOnStatusCode: false })
      .catch(() => null);
    if (!health || health.status() !== 200) {
      console.log(`[e2e setup] API ${API_URL} không phản hồi /health – bỏ qua đăng nhập trước`);
      return;
    }
    if (!(await isAvailable(ctx, 'POST', '/v1/auth/login'))) {
      console.log('[e2e setup] login chưa có trên build – ca cần đăng nhập sẽ pending');
      return;
    }
    if (!SEED_PASSWORD) {
      console.log('[e2e setup] thiếu QA_SEED_PASSWORD – ca cần đăng nhập sẽ skip');
      return;
    }
    if (!TEST_TOKEN) {
      console.log(
        '[e2e setup] thiếu TEST_SUPPORT_TOKEN – không reset được giới hạn đăng nhập (429 sẽ thành skip)',
      );
    } else if (await resetRateLimits(ctx, 'global setup')) {
      console.log('[e2e setup] đã reset giới hạn đăng nhập/khóa của tài khoản DS-E');
    }
    let ok = 0;
    const failures: string[] = [];
    for (const u of SUBJECTS) {
      try {
        await session(ctx, u);
        ok++;
      } catch (e) {
        const msg = e instanceof Error ? e.message.split('\n')[0]! : String(e);
        failures.push(`${u}: ${msg}`);
        console.log(`[e2e setup] ${u}: ${msg}`);
        if (e instanceof LoginRateLimited) break;
      }
    }
    console.log(`[e2e setup] phiên DS-E sẵn sàng: ${ok}/${SUBJECTS.length}`);
    if (process.env.CI && ok === 0 && failures.some((f) => /UNAUTHENTICATED|\b401\b/.test(f))) {
      throw new Error(
        '[e2e setup] Không tài khoản DS-E nào đăng nhập được (401): stack chưa nạp seed DS-E ' +
          '(docker compose … run --rm seed) hoặc QA_SEED_PASSWORD khác với lúc nạp seed.',
      );
    }
  } finally {
    await ctx.dispose();
  }
}
