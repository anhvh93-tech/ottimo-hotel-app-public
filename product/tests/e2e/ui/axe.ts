// axe-core scan shared by the UI specs (desk-chromium, desk-clock, guest-web). Threshold (QC Sprint 2, ĐK-S2-4):
// 0 critical/serious violations of WCAG 2.1 A/AA + 2.2 AA; moderate/minor go to an annotation + attachment.
import { AxeBuilder } from '@axe-core/playwright';
import { expect, type Page, type TestInfo } from '@playwright/test';
import { WEB_URL } from '../support/env.js';

export const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
export const BLOCKING = new Set(['critical', 'serious']);

export async function settle(page: Page): Promise<void> {
  await page.getByRole('main').first().waitFor({ timeout: 15_000 });
  await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => undefined);
  // Busy indicators (skeleton/spinner) gone before scanning
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: 10_000 });
}

export async function scan(page: Page, info: TestInfo, screen: string): Promise<void> {
  // dialogs fade in: scanning mid-animation reports false contrast failures (opacity < 1)
  await page
    .waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running'), null, {
      timeout: 5_000,
    })
    .catch(() => undefined);
  const res = await new AxeBuilder({ page }).withTags(WCAG).analyze();
  const brief = res.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    help: v.help,
    nodes: v.nodes.length,
    targets: v.nodes.slice(0, 5).map((n) => n.target.join(' ')),
    // color-contrast: fg/bg/ratio of the first nodes (for the bug report)
    data: v.nodes
      .slice(0, 5)
      .map((n) => n.any[0]?.data as Record<string, unknown> | undefined)
      .filter(Boolean)
      .map((d) => `${d!.fgColor ?? ''} on ${d!.bgColor ?? ''} = ${d!.contrastRatio ?? ''}`),
  }));
  await info.attach(`axe-${screen}.json`, {
    body: JSON.stringify(brief, null, 2),
    contentType: 'application/json',
  });
  const minor = brief.filter((v) => !BLOCKING.has(v.impact ?? ''));
  if (minor.length)
    info.annotations.push({
      type: 'axe-non-blocking',
      description: `${screen}: ${minor.map((v) => `${v.id}(${v.impact}×${v.nodes})`).join(', ')}`,
    });
  const blocking = brief.filter((v) => BLOCKING.has(v.impact ?? ''));
  expect(
    blocking,
    `${screen}: vi phạm critical/serious\n${blocking
      .map(
        (v) =>
          `- ${v.id} [${v.impact}] ${v.help} ×${v.nodes}: ${v.targets.join(' | ')} ${v.data.join('; ')}`,
      )
      .join('\n')}`,
  ).toEqual([]);
}

export async function go(page: Page, path: string): Promise<void> {
  await page.goto(`${WEB_URL}${path}`);
  await settle(page);
}
