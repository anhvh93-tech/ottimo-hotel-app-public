// SEC A.7 #16 – phần đồng hồ giả (G1 trong rounds/round-03/reviews/s1-SEC-on-2FA.md; QC v1-gate-checklist G2-2).
// Ca 16 gốc (ui/mfa-us143.r3s1.spec.ts) phủ đăng ký, đăng nhập TOTP, mã khôi phục, màn hạn chế, axe – theo giờ thật.
// Tệp này thêm các mốc giờ của bước nhập mã trên Desk (admin-web Chromium + api thật), đồng hồ stack (MutableClock)
// và đồng hồ trình duyệt (page.clock) cùng đặt:
// - S1-CLK-17: `mfaToken` sống 5 phút (SEC 06.17, `MFA_TOKEN_TTL_MS`): 4:59 nhập mã đúng → vào; 5:00 server trả
//   401 MFA_INVALID (cùng một câu, SEC 06.20), Desk tự quay về bước mật khẩu kèm câu "Bước nhập mã đã hết hạn".
// - S1-CLK-14: cửa sổ ±1 bước 30 giây (SEC 06.18): mã bước −2 và +2 bị từ chối, +1 và −1 được nhận.
// - S1-CLK-15: chống phát lại – mã của bước ≤ bước đã dùng bị từ chối dù còn trong cửa sổ.
// Tài khoản: qa.e2e.clk2fa.* (lễ tân trưởng, bật 2FA tự nguyện – chạy được cả trên stack MFA_ENFORCED=false).
// MFA_ENFORCED=true với OWN/MGR chưa đăng ký: QA chạy trên staging rc.1 26/10 (rounds/round-03/qa/qa3-rc1.md mục 3).
// Secret và mã chỉ nằm trong bộ nhớ ca, không in, không đính kèm (SEC 06.22).
import { expect, test, type Browser, type Page } from '@playwright/test';
import {
  activateUser,
  call,
  createThrowawayUser,
  getMe,
  needSeedPassword,
  sessionOrSkip,
  sessionTokenFrom,
  stackToday,
  type StaffSession,
} from '../support/api.js';
import { needClock, resetClock, setClock } from '../support/clock.js';
import { SEED_PASSWORD, WEB_URL } from '../support/env.js';
import { vnTime } from '../support/s2.js';
import { virtualDay } from '../support/s3.js';
import { secretOfUri, stepOf, totpAt } from '../support/totp.js';
import { UI, t } from '../ui/helpers.js';

const plus = (iso: string, ms: number): string =>
  new Date(new Date(iso).getTime() + ms).toISOString();
const MIN = 60_000;

let realToday = '';
test.beforeAll(async ({ request }) => {
  needSeedPassword();
  await resetClock(request);
  realToday = await stackToday(request);
});
test.afterAll(async ({ request }) => resetClock(request));

/**
 * Desk ở 1366×768, đồng hồ trình duyệt cài tại `at` rồi DỪNG (timer 5 phút của bước mã chỉ chạy khi ca gọi
 * `runFor`) – giây thật trôi trong lúc ca thao tác không làm timer chạy sớm.
 */
async function deskAt(browser: Browser, at: string): Promise<Page> {
  const ctx = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh',
  });
  const page = await ctx.newPage();
  await page.clock.install({ time: new Date(at) });
  await page.clock.pauseAt(new Date(new Date(at).getTime() + 1_000));
  return page;
}

async function passwordStep(page: Page, username: string, password: string): Promise<void> {
  await page.goto(WEB_URL);
  await page
    .getByLabel(/Tên đăng nhập|Số điện thoại hoặc email/)
    .first()
    .fill(username);
  await page.getByLabel(t('login.password')).first().fill(password);
  await page.getByRole('button', { name: t('login.submit') }).click();
  await expect(page.getByRole('heading', { name: t('auth.totp.title') })).toBeVisible({
    timeout: 15_000,
  });
}

/** Gửi một mã ở bước TOTP; trả về mã HTTP của `loginMfa`. */
async function submitCode(page: Page, code: string): Promise<number> {
  const res = page.waitForResponse(
    (r) => r.request().method() === 'POST' && /\/v1\/auth\/login\/mfa$/.test(r.url()),
    { timeout: 15_000 },
  );
  await page.getByLabel(t('auth.code_label.totp')).fill(code);
  await page.getByRole('button', { name: t('auth.totp.submit') }).click();
  return (await res).status();
}

async function expectRefused(page: Page, status: number, what: string): Promise<void> {
  expect(status, what).toBe(401);
  await expect(page.getByText(t('error.MFA_INVALID')), what).toBeVisible();
  await expect(page.getByRole('navigation'), what).toHaveCount(0);
}

async function expectIn(page: Page, status: number, what: string): Promise<void> {
  expect(status, what).toBe(200);
  await expect(page.getByRole('navigation').first(), what).toBeVisible({ timeout: 15_000 });
}

test.describe(
  'SEC A.7 #16 (đồng hồ giả) – US-143 bước nhập mã 2FA trên Desk: mfaToken 5 phút, cửa sổ ±1 bước, chống phát lại',
  { tag: ['@ui', '@clock', '@r3'] },
  () => {
    test.skip(!UI, 'Chạy với E2E_UI=1');
    test.skip(!SEED_PASSWORD, 'Thiếu QA_SEED_PASSWORD');

    test('S1-CLK-17, S1-CLK-14, S1-CLK-15 (E) US-143 AC2 SEC 06.17–06.20: 4:59 vào được, 5:00 bị từ chối và Desk về bước mật khẩu; mã ±2 bước bị từ chối, ±1 được nhận; mã đã dùng không dùng lại được', async ({
      browser,
      request,
    }) => {
      test.slow();
      needClock('S1-CLK-17');
      const D = virtualDay(realToday, 1);
      // Giây 00 của một phút: bước 30 giây bắt đầu đúng ở T0, các mốc dưới đây không rơi vào ranh giới bước.
      const T0 = vnTime(D, '10:00');
      await setClock(request, T0);

      // 0. Tài khoản tạm + bật 2FA qua API ở T0 (bước s0)
      const owner = await sessionOrSkip(request, 'qa.owner');
      const u = await createThrowawayUser(request, owner, 'front_desk_lead', 'qa.e2e.clk2fa');
      const { session: s, password } = await activateUser(request, u);
      const setup = await call<{ otpauthUri: string }>(request, 'POST', '/v1/me/2fa/setup', {
        session: s,
        body: { currentPassword: password },
      });
      expect(setup.status, 'startMy2faSetup').toBe(200);
      const key = secretOfUri(setup.body.otpauthUri);
      const s0 = stepOf(new Date(T0).getTime());
      const conf = await call<{ recoveryCodes: string[] }>(request, 'POST', '/v1/me/2fa/confirm', {
        session: s,
        body: { totpCode: totpAt(key, s0) },
      });
      expect(conf.status, 'confirmMy2fa').toBe(200);
      const token = sessionTokenFrom(conf.setCookies);
      const enrolled: StaffSession = {
        ...s,
        token: token!,
        me: (await getMe(request, token!)).body,
      };
      expect(enrolled.me.mfaEnabled, 'đã bật 2FA').toBe(true);

      await test.step('S1-CLK-17 – 4:59 sau bước mật khẩu: mã đúng → vào Desk', async () => {
        const T1 = plus(T0, 1 * MIN);
        await setClock(request, T1);
        const page = await deskAt(browser, T1);
        await passwordStep(page, u.username, password);
        await page.clock.runFor(4 * MIN + 59_000); // timer 5 phút của Desk chưa chạy
        await expect(page.getByRole('heading', { name: t('auth.totp.title') })).toBeVisible();
        const at = plus(T1, 4 * MIN + 59_000);
        await setClock(request, at);
        await expectIn(
          page,
          await submitCode(page, totpAt(key, stepOf(new Date(at).getTime()))),
          '4:59',
        );
        await page.context().close();
      });

      await test.step('S1-CLK-17 – 5:00: server từ chối (401 MFA_INVALID), Desk tự về bước mật khẩu', async () => {
        const T2 = plus(T0, 7 * MIN);
        await setClock(request, T2);
        const page = await deskAt(browser, T2);
        await passwordStep(page, u.username, password);
        // Máy chủ đã tới 5:00; trình duyệt chậm 1 giây (tab ngủ) – Desk còn ở bước mã, gửi mã ĐÚNG của bước hiện tại.
        const at = plus(T2, 5 * MIN);
        await setClock(request, at);
        await page.clock.runFor(4 * MIN + 59_000);
        await expectRefused(
          page,
          await submitCode(page, totpAt(key, stepOf(new Date(at).getTime()))),
          'mfaToken 5:00 – mã đúng vẫn bị từ chối',
        );
        await page.clock.runFor(1_000); // trình duyệt tới 5:00
        await expect(page.getByText(t('mfa.step_expired'))).toBeVisible({ timeout: 10_000 });
        await expect(page.getByLabel(t('login.password')).first()).toBeVisible();
        await expect(page.getByRole('heading', { name: t('auth.totp.title') })).toHaveCount(0);
        await page.context().close();
      });

      await test.step('S1-CLK-14 – cửa sổ ±1 bước: −2 và +2 từ chối, +1 nhận', async () => {
        const T3 = plus(T0, 14 * MIN);
        await setClock(request, T3);
        const s3 = stepOf(new Date(T3).getTime());
        const page = await deskAt(browser, T3);
        await passwordStep(page, u.username, password);
        await expectRefused(page, await submitCode(page, totpAt(key, s3 - 2)), 'bước −2');
        await expectRefused(page, await submitCode(page, totpAt(key, s3 + 2)), 'bước +2');
        await expectIn(page, await submitCode(page, totpAt(key, s3 + 1)), 'bước +1');
        await page.context().close();
      });

      await test.step('S1-CLK-14, S1-CLK-15 – 90 giây sau: bước −1 nhận; dùng lại đúng mã đó → từ chối; bước 0 nhận', async () => {
        const T4 = plus(T0, 14 * MIN + 90_000); // bước s3 + 3; lần trước đã dùng s3 + 1
        await setClock(request, T4);
        const s4 = stepOf(new Date(T4).getTime());
        const p1 = await deskAt(browser, T4);
        await passwordStep(p1, u.username, password);
        await expectIn(p1, await submitCode(p1, totpAt(key, s4 - 1)), 'bước −1');
        await p1.context().close();
        const p2 = await deskAt(browser, T4);
        await passwordStep(p2, u.username, password);
        await expectRefused(
          p2,
          await submitCode(p2, totpAt(key, s4 - 1)),
          'phát lại mã bước −1 vừa dùng (còn trong cửa sổ)',
        );
        await expectIn(p2, await submitCode(p2, totpAt(key, s4)), 'bước 0, chưa dùng');
        await p2.context().close();
      });
    });
  },
);
