// Kiểm lại tiền lần 7 – phần Desk của BUG-R2-205 (ARC 16.29, FE-A `DocsPanel`): H14 cảnh báo đoàn thừa người khi một
// giấy tờ không khớp ai và server thêm người mới (project desk-chromium, đồng hồ thật, đơn ngày xa). Phần API: TC-L3-087
// (`e2e/api/r7-decisions.s5.api.spec.ts`). Oracle BR-601-02.
import { expect, test } from '@playwright/test';
import { needSeedPassword, sessionOrSkip, stackToday } from '../support/api.js';
import { SEED_PASSWORD, WEB_URL } from '../support/env.js';
import { cleanupTracked, oracle, s2Context } from '../support/s2.js';
import { addDocument, vnDoc } from '../support/s3.js';
import { farStay } from '../support/s3-checkin.js';
import { scan, settle } from './axe.js';
import { UI, signIn, t } from './helpers.js';
import { trustedDesk } from './write-steps.js';

type Json = Record<string, unknown>;
const tf = (key: string, vars: Record<string, string | number>): string =>
  t(key).replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));

test.describe(
  'UI – BUG-R2-205 cảnh báo vượt số khách trên H14',
  { tag: ['@ui', '@sprint4'] },
  () => {
    test.skip(!UI, 'Chạy với E2E_UI=1');
    test.skip(!SEED_PASSWORD, 'Thiếu QA_SEED_PASSWORD');
    test.beforeEach(() => needSeedPassword());
    test.afterEach(async ({ request }) => cleanupTracked(request));

    test('TC-L3-087 (E) BR-601-02 / BUG-R2-205 FE-A: đơn 1 người lớn, giấy tờ chính gửi không `partyMemberId` (hồ sơ người đặt thiếu ngày sinh) → H14 hiện cảnh báo "Đoàn đang thừa 1 người…" kèm "Bỏ người thừa" và "Gắn lại giấy tờ" + axe', async ({
      page,
      request,
    }) => {
      const exp = oracle('BR-601-02').expected as Json;
      const fd = await sessionOrSkip(request, 'qa.fd');
      const c = await s2Context(request);
      const st = await farStay(request, c, fd, await stackToday(request), {
        adults: 1,
        doc: false,
      });
      const r = await addDocument(request, fd, st.regId, vnDoc(st.guestName));
      expect(r.status, JSON.stringify(r.body).slice(0, 200)).toBe(Number(exp.status));
      expect((r.body as Json).partyOverCount).toBe(Number(exp.partyOverCount));
      await trustedDesk(page);
      await signIn(page, 'qa.fd');
      await page.goto(`${WEB_URL}/registration/${st.regId}`);
      // câu đầu của chuỗi UXD (`checkin.docs.over_party`) – Alert gồm cả nút, nên không so trọn chuỗi
      const first = tf('checkin.docs.over_party', { n: Number(exp.partyOverCount) }).split('.')[0]!;
      const warn = page.locator('.alert').filter({ hasText: first });
      await expect(warn, 'cảnh báo vượt số khách').toBeVisible({ timeout: 15_000 });
      await expect(
        warn.getByRole('button', { name: t('reg.over_party_remove'), exact: true }),
      ).toBeVisible();
      await expect(
        warn.getByRole('button', { name: t('reg.over_party_relink'), exact: true }),
      ).toBeVisible();
      await settle(page);
      await scan(page, test.info(), 'H14-over-party');
    });
  },
);
