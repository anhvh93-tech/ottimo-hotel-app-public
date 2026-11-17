// E2E UI – FB-INV-012 monthly statement of a long stay (ARC contract rounds/round-05/fb-inv-012/contract.md §6, §8 FE
// criteria 2–4; INV 17/11: opening reading typed each period, the last closing only a reference, vacancy gap not
// billed and not printed). Flow: S12 readings → S16 draft → confirm warnings → Issue → print (A5 and A4, one page each,
// screenshots attached) → VietQR payment → Paid. The QR payload is read back by API: amount = balance, content = code.
// Needs the BE PR r5-fb012-be-statements on the stack (its dev/e2e seed: one long stay in house); until then every case
// skips through `requireEndpoints`. Project desk-chromium (ui/), real clock. Written by FE (17/11) for QA's R5 run.
import { expect, test } from '@playwright/test';
import { call, requireEndpoints, session } from '../support/api.js';
import { SEED_PASSWORD } from '../support/env.js';
import { UI, signIn, t } from './helpers.js';

const tf = (key: string, vars: Record<string, string | number>): string =>
  t(key).replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));

/** EMVCo top-level tags (+ `62.xx`) of a VietQR payload. */
function emv(payload: string): Record<string, string> {
  const out: Record<string, string> = {};
  const walk = (s: string, prefix: string) => {
    for (let i = 0; i + 4 <= s.length;) {
      const len = Number(s.slice(i + 2, i + 4));
      out[prefix + s.slice(i, i + 2)] = s.slice(i + 4, i + 4 + len);
      i += 4 + len;
    }
  };
  walk(payload, '');
  if (out['62']) walk(out['62'], '62.');
  return out;
}

test.describe(
  'UI round 5 – FB-INV-012: monthly statement from readings to Paid',
  { tag: ['@ui', '@write', '@money'] },
  () => {
    test.skip(!UI, 'Chạy với E2E_UI=1');
    test.skip(!SEED_PASSWORD, 'Thiếu QA_SEED_PASSWORD');

    test('FB-012 FE-2/3/4: readings → draft → warnings → issue → print A5/A4 → VietQR → Paid', async ({
      page,
      request,
    }, info) => {
      await requireEndpoints(request, 'FB-012', [
        ['GET', '/v1/properties/{propertyId}/billing-periods/candidates', 'listBillingCandidates'],
        ['GET', '/v1/properties/{propertyId}/billing-periods/{id}/print', 'getBillingPeriodPrint'],
      ]);
      const fdl = await session(request, 'qa.fdl');
      const propertyId = fdl.me.activePropertyId ?? fdl.me.properties[0]!.propertyId;
      await signIn(page, 'qa.fdl');

      // S12 – a room without a closing reading: opening typed (not pre-filled), closing above it.
      await page.getByRole('link', { name: t('nav.meters') }).click();
      const row = page
        .locator('tr', { has: page.getByText(t('meters.missing'), { exact: true }) })
        .first();
      test.skip(
        (await row.count()) === 0,
        'FB-012: không còn căn dài hạn chưa chốt (seed đã dùng)',
      );
      const head = (await row.getByRole('rowheader').innerText()).trim();
      const roomNo = head.split('·')[0]!.trim();
      for (const meter of ['electricity', 'water'] as const) {
        const name = t(`stmt.meter.${meter}`);
        const opening = row.getByLabel(`${name} – ${t('meters.opening')} – ${roomNo}`);
        await expect(opening).toHaveValue('');
        await opening.fill(meter === 'electricity' ? '1000' : '10.0');
        await row
          .getByLabel(`${name} – ${t('meters.closing')} – ${roomNo}`)
          .fill(meter === 'electricity' ? '1142' : '13.4');
      }
      await row.locator('input[type=file]').setInputFiles({
        name: 'meter.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from([0xff, 0xd8, 0xff, 0xd9]),
      });
      await row.getByRole('button', { name: t('meters.save') }).click();
      await expect(row.getByText(tf('meters.usage', { usage: '142' }))).toBeVisible();

      // S16 – draft → confirm each warning → Issue.
      await page.getByRole('link', { name: t('nav.statements') }).click();
      const cand = page.locator('li', { hasText: roomNo }).first();
      await cand.getByRole('button', { name: t('stmt.create_draft') }).click();
      const dlg = page.getByRole('dialog');
      const issue = dlg.getByRole('button', { name: t('stmt.issue') });
      await expect(issue).toBeVisible();
      for (const box of await dlg.getByRole('checkbox').all()) await box.check();
      await issue.click();
      const print = dlg.getByRole('link', { name: t('stmt.print') });
      await expect(print).toBeVisible();
      const href = (await print.getAttribute('href'))!;
      // FE-4: the URL holds only the id.
      expect(href).toMatch(/^\/print\/statements\/[0-9a-f-]{36}$/);
      const id = href.split('/').pop()!;

      // Print page – A5 by default, then A4; one page each.
      await print.click();
      const sheet = page.locator('.stmt-preview .stmt-sheet');
      await expect(sheet).toHaveAttribute('data-paper', 'a5');
      await expect(page.locator('body > .print-root')).toHaveClass(/stmt-paper-a5/);
      await info.attach('statement-a5.png', {
        body: await page.locator('.stmt-preview').screenshot(),
        contentType: 'image/png',
      });
      await page.emulateMedia({ media: 'print' });
      const pages = (pdf: Buffer) =>
        (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length;
      expect(pages(await page.pdf({ preferCSSPageSize: true, printBackground: true }))).toBe(1);
      await page.emulateMedia({ media: 'screen' });
      await page.getByRole('button', { name: 'A4' }).click();
      await expect(sheet).toHaveAttribute('data-paper', 'a4');
      await info.attach('statement-a4.png', {
        body: await page.locator('.stmt-preview').screenshot(),
        contentType: 'image/png',
      });
      await page.emulateMedia({ media: 'print' });
      expect(pages(await page.pdf({ preferCSSPageSize: true, printBackground: true }))).toBe(1);
      await page.emulateMedia({ media: 'screen' });
      // No personal contact data, no vacancy gap on paper.
      const text = await sheet.innerText();
      expect(text).not.toMatch(/nationality|quốc tịch|passport|CCCD/i);
      expect(text).not.toContain(t('meters.gap_saved').split(':')[0]!);
      expect(text).not.toMatch(/\p{Extended_Pictographic}/u);

      // QR: the server's payload carries the balance and the statement code.
      const pr = await call<{
        code: string;
        totals: { balanceVnd: number };
        vietqr: { payload: string } | null;
      }>(request, 'GET', `/v1/properties/${propertyId}/billing-periods/${id}/print`, {
        session: fdl,
      });
      expect(pr.status).toBe(200);
      const tags = emv(pr.body.vietqr!.payload);
      expect(Number(tags['54'])).toBe(pr.body.totals.balanceVnd);
      expect(tags['62.08']).toBe(pr.body.code);

      // Back → record the VietQR payment for the balance → Paid.
      await page.getByRole('link', { name: t('common.back') }).click();
      await page.getByRole('button', { name: t('stmt.tab.issued') }).click();
      await page.getByRole('button', { name: pr.body.code }).click();
      await dlg.getByRole('button', { name: t('stmt.record_payment') }).click();
      await dlg.getByRole('button', { name: t('stmt.pay_save') }).click();
      await expect(dlg.getByText(t('stmt.status.paid'), { exact: true })).toBeVisible();
    });
  },
);
