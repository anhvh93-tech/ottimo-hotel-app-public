// TC-RB-018 – cases of `logout` (x-roles any_staff). Logging out kills the cached session, so this file
// runs in project "rbac-logout", after every other API project (playwright.config dependencies), and drops
// the session from the cache. Also checks TC-NT-003 step 2: the old cookie after logout → 401.
import { expect, test } from '@playwright/test';
import {
  call,
  fakeGuestCookie,
  forgetSession,
  getMe,
  isAvailable,
  needSeedPassword,
  sessionOrSkip,
  type Problem,
} from '../support/api.js';
import { SPRINT1_CASES } from './cases.js';

test.describe('RBAC Sprint 1 – logout (chạy cuối)', { tag: ['@rbac'] }, () => {
  for (const c of SPRINT1_CASES.filter((x) => x.operationId === 'logout')) {
    test(`${c.id} logout ${c.subject} → ${c.expected}`, async ({ request }) => {
      test.skip(
        !(await isAvailable(request, c.method, c.path)),
        'pending: logout chưa có trên build',
      );
      if (c.expected === '401') {
        const r = await call<Problem>(request, 'POST', c.path, { cookie: fakeGuestCookie() });
        expect(r.status).toBe(401);
        return;
      }
      needSeedPassword();
      const s = await sessionOrSkip(request, c.subject);
      const r = await call<Problem>(request, 'POST', c.path, { session: s });
      forgetSession(c.subject);
      expect(r.status, JSON.stringify(r.body)).toBe(204);
      // TC-NT-003 (2): the cookie is dead server-side
      expect((await getMe(request, s.token)).status).toBe(401);
    });
  }
});
