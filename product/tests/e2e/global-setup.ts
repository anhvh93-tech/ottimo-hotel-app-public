// Logs the DS-E accounts in once, sequentially, before workers start (SR-RL-01 allows 20 logins/IP/15 min;
// parallel workers would otherwise each log in every account). Sessions are cached in e2e/.auth/sessions.json
// (gitignored, 0600) and re-validated with getMe, so repeated runs within the idle window log in 0 times.
// Never fails the run: no API / no login endpoint / no password → the specs skip with their own reason.
import { request as pwRequest } from '@playwright/test';
import { isAvailable, LoginRateLimited, session } from './support/api.js';
import { API_URL, SEED_PASSWORD, SUBJECTS } from './support/env.js';

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
    let ok = 0;
    for (const u of SUBJECTS) {
      try {
        await session(ctx, u);
        ok++;
      } catch (e) {
        const msg = e instanceof Error ? e.message.split('\n')[0] : String(e);
        console.log(`[e2e setup] ${u}: ${msg}`);
        if (e instanceof LoginRateLimited) break;
      }
    }
    console.log(`[e2e setup] phiên DS-E sẵn sàng: ${ok}/${SUBJECTS.length}`);
  } finally {
    await ctx.dispose();
  }
}
