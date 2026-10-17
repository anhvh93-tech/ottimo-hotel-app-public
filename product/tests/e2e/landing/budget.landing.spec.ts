// LP-v1 – page weight per DPR (concept 11.2; QA re-measures "the same way"): Chromium, empty cache, CDP
// Network.loadingFinished.encodedDataLength summed over every response – "open" = after load + network idle
// without scrolling (includes the lazy photos Chromium fetches near the viewport), "full" = after scrolling to the
// end. Text is gzip-compressed by the test server as Caddy does in production.
// Counted: compressed response bodies. Response headers are left out: this HTTP/1.1 test server repeats the full
// security headers (~0.8 kB, mostly CSP) on each of ~25 responses, while production serves HTTP/2 where HPACK
// sends them once. KB = 1024 B, as in the concept's figures (hero 960 w = 49 321 B = "48 KB").
// VI pages get +70 KB for the Vietnamese font subsets (concept 11.2).
import { expect, test, type Browser } from '@playwright/test';

interface Case {
  name: string;
  path: string;
  width: number;
  height: number;
  dpr: number;
  mobile: boolean;
  hero: number;
  open: number;
  full: number;
}

const KB = 1024;
const VI_EXTRA = 70;
const PHONE = { width: 375, height: 812, mobile: true };
const DESKTOP = { width: 1280, height: 800, mobile: false };
const CASES: Case[] = [
  { name: 'phone EN DPR1', path: '/', ...PHONE, dpr: 1, hero: 20, open: 250, full: 350 },
  { name: 'phone EN DPR2', path: '/', ...PHONE, dpr: 2, hero: 50, open: 320, full: 600 },
  { name: 'phone EN DPR3', path: '/', ...PHONE, dpr: 3, hero: 50, open: 400, full: 700 },
  {
    name: 'phone VI DPR2',
    path: '/vi/',
    ...PHONE,
    dpr: 2,
    hero: 50,
    open: 320 + VI_EXTRA,
    full: 600 + VI_EXTRA,
  },
  {
    name: 'phone VI DPR3',
    path: '/vi/',
    ...PHONE,
    dpr: 3,
    hero: 50,
    open: 400 + VI_EXTRA,
    full: 700 + VI_EXTRA,
  },
  { name: 'desktop EN DPR1', path: '/', ...DESKTOP, dpr: 1, hero: 50, open: 400, full: 600 },
  { name: 'desktop EN DPR2', path: '/', ...DESKTOP, dpr: 2, hero: 120, open: 700, full: 1100 },
];

async function measure(browser: Browser, c: Case) {
  const context = await browser.newContext({
    viewport: { width: c.width, height: c.height },
    deviceScaleFactor: c.dpr,
    isMobile: c.mobile,
    hasTouch: c.mobile,
    locale: c.path === '/vi/' ? 'vi-VN' : 'en-US',
  });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  const urls = new Map<string, string>();
  const headerBytes = new Map<string, number>();
  let bytes = 0;
  let hero = 0;
  let heroFetches = 0;
  cdp.on('Network.requestWillBeSent', (e) => urls.set(e.requestId, e.request.url));
  // At responseReceived, encodedDataLength = bytes received so far = the response headers.
  cdp.on('Network.responseReceived', (e) =>
    headerBytes.set(e.requestId, e.response.encodedDataLength),
  );
  cdp.on('Network.loadingFinished', (e) => {
    const body = e.encodedDataLength - (headerBytes.get(e.requestId) ?? 0);
    bytes += body;
    if (/hero-facade-dusk/.test(urls.get(e.requestId) ?? '')) {
      hero += body;
      heroFetches += 1;
    }
  });
  await page.goto(c.path, { waitUntil: 'load' });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(300);
  const open = bytes;
  await page.evaluate(async () => {
    const step = Math.floor(window.innerHeight * 0.8);
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 80));
    }
  });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(300);
  const full = bytes;
  await context.close();
  return { open, full, hero, heroFetches };
}

for (const c of CASES) {
  test(`TC-LP-009 budget ${c.name}: hero ≤ ${c.hero} KB, open ≤ ${c.open} KB, full scroll ≤ ${c.full} KB`, async ({
    browser,
  }, info) => {
    const m = await measure(browser, c);
    const kb = (n: number) => Math.round((n / KB) * 10) / 10;
    info.annotations.push({
      type: 'bytes',
      description: `${c.name}: hero ${kb(m.hero)} KB (${m.heroFetches}×), open ${kb(m.open)} KB, full ${kb(m.full)} KB`,
    });
    expect(m.heroFetches, 'hero fetched once (preload matches <source>)').toBe(1);
    expect(kb(m.hero)).toBeLessThanOrEqual(c.hero);
    expect(kb(m.open)).toBeLessThanOrEqual(c.open);
    expect(kb(m.full)).toBeLessThanOrEqual(c.full);
  });
}
