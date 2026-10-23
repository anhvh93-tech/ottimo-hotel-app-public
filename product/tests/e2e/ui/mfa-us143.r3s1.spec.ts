// SEC A.7 #16 (S1-SEC-16, US-143 AC1–AC3 a) – admin-web in Chromium against the real api (project desk-chromium):
// turn on 2-step verification (reads the setup key on screen, computes the code in the test), 10 recovery codes
// shown once + "saved apart" tick, sign in with the TOTP step, sign in with a recovery code → restricted re-enrolment
// screen (SEC 06.4 / ARC 12.3), API answers 403 MFA_ENROLLMENT_REQUIRED meanwhile. axe on the three new screens.
// Throwaway account qa.e2e.ui2fa.* (front_desk_lead – voluntary 2FA, so MFA_ENFORCED=false stacks run it too).
// The secret and the codes stay in memory; nothing is printed or attached (SEC 06.22).
import { expect, test, type Browser, type Page } from '@playwright/test';
import {
  activateUser,
  call,
  createThrowawayUser,
  needSeedPassword,
  propertyIdOf,
  sessionOrSkip,
  type Problem,
} from '../support/api.js';
import { SESSION_COOKIE, WEB_URL } from '../support/env.js';
import { base32Decode, TotpUser } from '../support/totp.js';
import { scan } from './axe.js';
import { t, UI } from './helpers.js';

test.describe.configure({ mode: 'serial' });

async function fresh(browser: Browser): Promise<Page> {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 }, locale: 'vi-VN' });
  return ctx.newPage();
}

async function passwordStep(page: Page, username: string, password: string): Promise<void> {
  await page.goto(WEB_URL);
  await page
    .getByLabel(/Tên đăng nhập|Số điện thoại hoặc email/)
    .first()
    .fill(username);
  await page.getByLabel(t('login.password')).first().fill(password);
  await page.getByRole('button', { name: t('login.submit') }).click();
}

test.describe('S1-SEC-16 US-143 – đăng ký 2FA, đăng nhập 2 bước, mã khôi phục (admin-web)', () => {
  test('bật 2FA → đăng nhập bằng TOTP → đăng nhập bằng mã khôi phục → màn đăng ký lại (hạn chế)', async ({
    browser,
    request,
  }, info) => {
    test.skip(!UI, 'Cần E2E_UI=1 (Chromium + admin-web)');
    needSeedPassword();
    test.setTimeout(240_000);
    const owner = await sessionOrSkip(request, 'qa.owner');
    const pid = propertyIdOf(owner);
    const x = await createThrowawayUser(request, owner, 'front_desk_lead', 'qa.e2e.ui2fa');
    const { password } = await activateUser(request, x);

    // 1. Sign in (no 2FA yet) and open the enrolment screen
    const page = await fresh(browser);
    await passwordStep(page, x.username, password);
    await expect(page.getByRole('navigation').first()).toBeVisible({ timeout: 15_000 });
    await page.goto(`${WEB_URL}/enroll-2fa`);
    await expect(page.getByRole('heading', { name: t('auth.enroll.title') })).toBeVisible();
    await scan(page, info, 'H01-1.4-enroll-install');
    await page.getByRole('button', { name: t('mfa.installed') }).click();
    await page.getByLabel(t('auth.current_password')).fill(password);
    await page.getByRole('button', { name: t('mfa.enroll_start') }).click();
    const keyText = (await page.locator('code.mono').first().innerText()).replace(/\s+/g, '');
    const totp = new TotpUser(base32Decode(keyText));
    await scan(page, info, 'H01-1.4-enroll-scan');
    await page.getByLabel(t('auth.enroll.confirm')).fill(await totp.next());
    await page.getByRole('button', { name: t('auth.totp.submit') }).click();
    await expect(page.getByText(t('auth.enroll.done'))).toBeVisible({ timeout: 15_000 });

    // 2. 10 recovery codes once; "Hoàn tất" locked until the tick (US-143 AC3 a)
    const list = page.getByRole('list', { name: t('mfa.codes_list_label') });
    const codes = (await list.locator('li').allInnerTexts()).map((c) => c.trim());
    expect(codes).toHaveLength(10);
    await expect(page.getByRole('button', { name: t('mfa.finish_locked') })).toBeDisabled();
    await scan(page, info, 'H01-1.4-recovery-codes');
    await page.getByText(t('mfa.codes_ack_apart')).click();
    await page.getByRole('button', { name: t('mfa.finish') }).click();
    await page.context().close();

    // 3. Two steps: password → TOTP screen → in
    const p2 = await fresh(browser);
    await passwordStep(p2, x.username, password);
    await expect(p2.getByRole('heading', { name: t('auth.totp.title') })).toBeVisible();
    await scan(p2, info, 'H01-1.3-mfa-step');
    await p2.getByLabel(t('auth.code_label.totp')).fill(await totp.next());
    await p2.getByRole('button', { name: t('auth.totp.submit') }).click();
    await expect(p2.getByRole('navigation').first()).toBeVisible({ timeout: 15_000 });
    await p2.context().close();

    // 4. Lost phone: recovery code → restricted session, only the re-enrolment screen (ARC 12.3)
    const p3 = await fresh(browser);
    await passwordStep(p3, x.username, password);
    await p3.getByRole('button', { name: t('auth.totp.recovery') }).click();
    await p3.getByLabel(t('auth.code_label.recovery')).fill(codes[0]!);
    await p3.getByRole('button', { name: t('mfa.recovery_submit') }).click();
    await expect(p3.getByRole('heading', { name: t('mfa.reenroll_title') })).toBeVisible({
      timeout: 15_000,
    });
    await expect(p3.getByText(t('mfa.reenroll_lead'))).toBeVisible();
    await expect(p3.getByRole('navigation')).toHaveCount(0);
    await scan(p3, info, 'H01-1.4-reenroll');
    // the API refuses everything else with this restricted session (SEC 06.4)
    const cookie = (await p3.context().cookies(WEB_URL)).find((c) => c.name === SESSION_COOKIE);
    expect(cookie, 'phiên sau mã khôi phục').toBeTruthy();
    const r = await call<Problem>(request, 'GET', `/v1/properties/${pid}/guests`, {
      cookie: `${SESSION_COOKIE}=${cookie!.value}`,
      query: { q: 'qa' },
    });
    expect(r.status).toBe(403);
    expect(r.body.code).toBe('MFA_ENROLLMENT_REQUIRED');
    // going elsewhere lands back on the enrolment screen
    await p3.goto(`${WEB_URL}/overview`);
    await expect(p3).toHaveURL(/\/enroll-2fa/);
    await p3.context().close();
  });
});
