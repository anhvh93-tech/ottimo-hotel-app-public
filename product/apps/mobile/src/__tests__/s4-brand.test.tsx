// UXD Sprint 4 brand review (rounds/round-02/reviews/s4-UXD-brand.md):
// - FB-R2-UXD-MOB-S4-02: icon buttons wear the DS `.btn` shell (`btn icon-btn`, hi-fi H20–H22), never the
//   browser's own button face (#EFEFEF / dark #6B6B6B + black border – off the OTTIMO palette, G8.3).
// - FB-R2-UXD-MOB-S4-03: status chips are plain sentences in the PWA – they wrap inside their background.
// - Room screen: no empty bordered info card (seen on room 101 in the same screenshots).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockControl } from '../mocks/handlers';
import { setOnline, start } from './helpers';

// Canvas is not available in jsdom: compression is a pass-through here.
vi.mock('../app/image', async (orig) => ({
  ...(await orig<typeof import('../app/image')>()),
  compressPhoto: vi.fn(async () => new Blob([new Uint8Array(2000)], { type: 'image/jpeg' })),
}));

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  setOnline(true);
});
afterEach(() => {
  vi.useRealTimers();
});

const SRC = join(__dirname, '..');

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return f === '__tests__' ? [] : sources(p);
    return p.endsWith('.tsx') ? [p] : [];
  });
}

/** Every `className="… icon-btn …"` with the tag it sits on. */
function iconButtons(): { file: string; tag: string; cls: string }[] {
  return sources(SRC).flatMap((file) => {
    const text = readFileSync(file, 'utf8');
    return [...text.matchAll(/className="([^"]*\bicon-btn\b[^"]*)"/g)].map((m) => {
      const before = text.slice(0, m.index);
      const tags = [...before.matchAll(/<([a-zA-Z][\w.]*)\b/g)];
      return { file: file.slice(SRC.length), tag: tags.at(-1)?.[1] ?? '?', cls: m[1]! };
    });
  });
}

/** Declarations of one rule in the app stylesheet (exact selector). */
function rule(css: string, selector: string): Record<string, string> {
  const esc = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = new RegExp(`(?:^|\\n)${esc}\\s*\\{([^}]*)\\}`).exec(css);
  if (!m) throw new Error(`no rule ${selector}`);
  return Object.fromEntries(
    m[1]!
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split(';')
      .map((d) => d.split(':').map((s) => s.trim()))
      .filter((d) => d.length === 2 && d[0])
      .map(([k, v]) => [k!, v!]),
  );
}

describe('FB-R2-UXD-MOB-S4-02 – icon buttons are DS buttons', () => {
  it('H20 room 101: Back is `btn icon-btn` (surface + line-strong shell, DS focus ring)', async () => {
    const { user } = await start();
    await user.click(await screen.findByRole('link', { name: 'Các căn' }));
    await user.click(await screen.findByRole('link', { name: /^Căn 101, The Amber/ }));
    const back = await screen.findByRole('button', { name: 'Quay lại' });
    expect(back).toHaveClass('btn', 'icon-btn', 'hk-back');
  });

  it('H21 photo picker: "Bỏ ảnh 1" is `btn icon-btn` and still removes the photo', async () => {
    const { user } = await start();
    await user.click(await screen.findByRole('link', { name: 'Báo sự cố' }));
    await user.upload(
      await waitFor(() => document.querySelector<HTMLInputElement>('input[type=file]')!),
      new File([new Uint8Array(9)], 'a.jpg', { type: 'image/jpeg' }),
    );
    const remove = await screen.findByRole('button', { name: 'Bỏ ảnh 1' });
    expect(remove).toHaveClass('btn', 'icon-btn', 'photo-x');
    await user.click(remove);
    expect(screen.queryByRole('button', { name: 'Bỏ ảnh 1' })).not.toBeInTheDocument();
  });

  it('source guard: every `icon-btn` (button or link) also has `btn`', () => {
    const found = iconButtons();
    expect(found.length).toBeGreaterThanOrEqual(3); // back, photo remove, bell
    const bare = found.filter((b) => !/(^|\s)btn(\s|$)/.test(b.cls));
    expect(bare).toEqual([]);
    // FB-R2-UXD-MOB-S4-04: the bell (a link) is framed like the Desk bell and the Back button next to it.
    expect(found.filter((b) => b.tag !== 'button').map((b) => b.cls)).toEqual([
      'btn icon-btn hk-bell',
    ]);
  });
});

describe('FB-R2-UXD-MOB-S4-03 – PWA chips wrap inside their background', () => {
  const css = readFileSync(join(SRC, 'styles.css'), 'utf8');

  it('chips may wrap (hifi.css `.chip` is nowrap for short Desk chips) and never grow past the card', () => {
    const chip = rule(css, '.staff-app .chip');
    expect(chip['white-space']).toBe('normal');
    expect(chip['max-width']).toBe('100%');
    expect(chip['overflow-wrap']).toBe('break-word');
    // Icon on the first line: half of (line-height 1.6em − 16 px `.hk` icon).
    expect(chip['align-items']).toBe('flex-start');
    expect(rule(css, '.staff-app .chip > .ico')['margin-top']).toBe('calc(0.8em - 8px)');
  });

  it('"Các căn" card text column does not stretch the chip across the card (hi-fi H19: inline chip)', () => {
    const grow = rule(css, '.hk-card.rowlink .grow');
    expect(grow['flex-direction']).toBe('column');
    expect(grow['align-items']).toBe('flex-start');
    expect(grow['min-width']).toBe('0');
  });

  it('"Các căn": the status chip sits inside the card link – the card is the touch target, not the chip', async () => {
    const { user } = await start();
    await user.click(await screen.findByRole('link', { name: 'Các căn' }));
    const card = await screen.findByRole('link', { name: /^Căn 101, The Amber/ });
    const chip = card.querySelector('.grow > .chip')!;
    expect(chip).toHaveTextContent('Khách đang ở – cần dọn');
    expect(chip.querySelector(':scope > .ico')).not.toBeNull();
    expect(card.querySelectorAll('a, button')).toHaveLength(0);
  });
});

describe('H20 room screen – info card only when it has something to say', () => {
  it('room 101 (guest staying, nothing to add) has no empty card; room 103 shows today’s arrival', async () => {
    const { user } = await start();
    await user.click(await screen.findByRole('link', { name: 'Các căn' }));
    await user.click(await screen.findByRole('link', { name: /^Căn 101, The Amber/ }));
    await screen.findByRole('button', { name: 'Quay lại' });
    expect(document.querySelector('.hk-info')).toBeNull();
    await user.click(screen.getByRole('link', { name: 'Các căn' }));
    await user.click(await screen.findByRole('link', { name: /^Căn 103, The Bloom/ }));
    await waitFor(() =>
      expect(document.querySelector('.hk-info')).toHaveTextContent(/Có khách đến hôm nay/),
    );
  });
});

describe('CI TC-X-079 (axe target-size, 18/10) – no button can sit half under a bar', () => {
  const css = readFileSync(join(SRC, 'styles.css'), 'utf8');
  const hifi = readFileSync(
    join(SRC, '..', '..', '..', 'design', 'hifi', 'assets', 'hifi.css'),
    'utf8',
  );

  it('header, screen body, action bar and tab bar are stacked: only the body scrolls, no sticky/fixed bar', () => {
    expect(rule(css, '.staff-app')).toMatchObject({ height: '100dvh', 'flex-direction': 'column' });
    expect(rule(css, '.staff-main')).toMatchObject({ flex: '1', 'min-height': '0' });
    expect(rule(css, '.staff-main > :not(.m-body)')).toMatchObject({ flex: 'none' });
    expect(rule(css, '.staff-app .m-body')).toMatchObject({
      flex: '1',
      'min-height': '0',
      'overflow-y': 'auto',
    });
    expect(rule(css, '.staff-app .m-nav')).toMatchObject({ flex: 'none' });
    for (const sel of ['.staff-app .m-top', '.staff-app .m-nav', '.staff-app .wiz-foot.hk-foot']) {
      expect(rule(css, sel).position, sel).toBeUndefined();
    }
    // The only fixed layer is the toast dock (it holds its own buttons, above the tab bar).
    const positioned = [...css.matchAll(/([^{}]+)\{[^}]*position:\s*(sticky|fixed)/g)].map((m) =>
      m[1]!.replace(/\/\*[\s\S]*?\*\//g, '').trim(),
    );
    expect(positioned).toEqual(['.toast-dock.app']);
  });

  it('every action of a task card is a DS button: ≥ 48 px high in the `.hk` density (≥ 44 px – DS 6.18)', async () => {
    expect(hifi).toMatch(/\.hk \.btn,\.hk \.btn\.sm\{min-height:48px/);
    expect(hifi).toMatch(/\.hk \.icon-btn\{width:48px;height:48px/);
    mockControl.state.tasks.find((x) => x.roomNo === '202')!.type = 'priority_clean'; // an urgent card
    await start();
    await screen.findByRole('article', { name: 'Căn 202, The Valley' });
    const acts = [...document.querySelectorAll<HTMLElement>('.hk-card .acts > *')];
    expect(acts.length).toBeGreaterThan(4);
    expect(document.querySelector('.hk-card.urgent .acts > button')).not.toBeNull();
    for (const el of acts) {
      expect(el.classList.contains('btn'), el.outerHTML.slice(0, 80)).toBe(true);
      expect(el.classList.contains('sm'), el.outerHTML.slice(0, 80)).toBe(false);
    }
    expect(document.querySelector('.staff-app')).toHaveClass('hk');
  });
});
