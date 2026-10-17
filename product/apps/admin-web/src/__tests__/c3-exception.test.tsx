import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useC3Clipboard } from '../app/c3';

// s3-SEC §8 – the FE-06 exception for the online check-in link, and its conditions.

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return f === '__tests__' || f === 'test' ? [] : files(p);
    return /\.tsx?$/.test(f) ? [p] : [];
  });
}

const setVisibility = (v: 'hidden' | 'visible') => {
  Object.defineProperty(document, 'visibilityState', { value: v, configurable: true });
  document.dispatchEvent(new Event('visibilitychange'));
};

describe('FE-06 exception (s3-SEC §8)', () => {
  // jsdom has no clipboard outside user-event – give the hooks one to write to.
  const original = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: () => Promise.resolve() },
      configurable: true,
    });
  });
  afterEach(() => {
    setVisibility('visible');
    if (original) Object.defineProperty(navigator, 'clipboard', original);
    else delete (navigator as unknown as Record<string, unknown>).clipboard;
  });

  it('(1) `onTabHidden: false` is used ONLY in GuestLinkPanel – never for C3 data', () => {
    const src = join(__dirname, '..');
    const users = files(src).filter((f) => /onTabHidden\s*:\s*false/.test(readFileSync(f, 'utf8')));
    expect(users.map((f) => f.slice(src.length + 1))).toEqual([
      join('pages', 'reservations', 'GuestLinkPanel.tsx'),
    ]);
  });

  it('(2) a 60 s wipe missed while the desk is in another app is written again on return', async () => {
    const write = vi
      .spyOn(navigator.clipboard, 'writeText')
      // The browser refuses clipboard writes while the page is hidden / unfocused.
      .mockImplementation((text: string) =>
        document.visibilityState === 'hidden'
          ? Promise.reject(new DOMException('Document is not focused.', 'NotAllowedError'))
          : Promise.resolve(void text),
      );
    const { result } = renderHook(() => useC3Clipboard(40, { onTabHidden: false }));
    await act(() => result.current.copy('https://guest.ottimo.local/g/abc'));
    setVisibility('hidden'); // desk switches to Zalo – the copy is kept
    expect(write).toHaveBeenLastCalledWith('https://guest.ottimo.local/g/abc');
    await act(() => new Promise((r) => setTimeout(r, 80))); // 60 s (here 40 ms) pass while away
    expect(write).toHaveBeenLastCalledWith(''); // tried – and refused
    write.mockClear();
    await act(async () => setVisibility('visible')); // back at the desk
    expect(write).toHaveBeenCalledWith('');
    write.mockRestore();
  });

  it('(2) also on window focus (the tab stayed visible, another app had focus)', async () => {
    let focused = false;
    const hasFocus = vi.spyOn(document, 'hasFocus').mockImplementation(() => focused);
    const write = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    const { result } = renderHook(() => useC3Clipboard(40, { onTabHidden: false }));
    await act(() => result.current.copy('x'));
    await act(() => new Promise((r) => setTimeout(r, 80)));
    write.mockClear();
    focused = true;
    await act(async () => {
      window.dispatchEvent(new Event('focus'));
    });
    expect(write).toHaveBeenCalledWith('');
    write.mockRestore();
    hasFocus.mockRestore();
  });
});
