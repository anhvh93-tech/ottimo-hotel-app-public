// UXD Sprint 4 brand review FB-R2-UXD-MOB-S4-02 (rounds/round-02/reviews/s4-UXD-brand.md): guest-web icon
// buttons wear the DS `.btn` shell (`btn icon-btn`, hi-fi H18/H23) – never the browser's own button face
// (#EFEFEF + black border, off the OTTIMO palette – G8.3).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MOCK_TOKENS } from '../mocks/handlers';
import { openLink } from './helpers';

const SRC = join(__dirname, '..');

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return f === '__tests__' ? [] : sources(p);
    return p.endsWith('.tsx') ? [p] : [];
  });
}

describe('FB-R2-UXD-MOB-S4-02 – guest-web icon buttons are DS buttons', () => {
  it('H23 new request: the Back icon button is `btn icon-btn` (like the footer Back and H18)', async () => {
    const { user } = openLink(`/g/${MOCK_TOKENS.inHouse}`);
    await screen.findByRole('heading', { name: 'Welcome to OTTIMO, Anna.' });
    await user.click(screen.getByRole('button', { name: 'Yêu cầu' }));
    await user.click(await screen.findByRole('button', { name: 'Gửi yêu cầu mới' }));
    const backs = await screen.findAllByRole('button', { name: 'Quay lại' });
    const icon = backs.find((b) => b.classList.contains('icon-btn'));
    expect(icon).toHaveClass('btn', 'icon-btn', 'gw-back');
    for (const b of backs) expect(b).toHaveClass('btn');
    await user.click(icon!);
    expect(await screen.findByRole('button', { name: 'Gửi yêu cầu mới' })).toBeInTheDocument();
  });

  it('source guard: every element with `icon-btn` also has `btn`', () => {
    const found = sources(SRC).flatMap((file) =>
      [...readFileSync(file, 'utf8').matchAll(/className="([^"]*\bicon-btn\b[^"]*)"/g)].map(
        (m) => ({ file: file.slice(SRC.length), cls: m[1]! }),
      ),
    );
    expect(found.length).toBeGreaterThanOrEqual(2); // H18 check-in, H23 request form
    expect(found.filter((b) => !/(^|\s)btn(\s|$)/.test(b.cls))).toEqual([]);
  });
});
