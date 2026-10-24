// R3-Q52 – rules of the hero slideshow and the room photo viewer that do not need a browser (the DOM side is in
// product/tests/e2e/landing/gallery.landing.spec.ts).
import { describe, expect, it } from 'vitest';
import { indexAt, indexForKey, mayAutoplay, nextIndex, type AutoplayGate } from './carousel';
import { wrapTarget } from './lightbox';

const running: AutoplayGate = {
  reducedMotion: false,
  userPaused: false,
  tabHidden: false,
  offScreen: false,
  hovered: false,
  focused: false,
};

describe('hero slideshow autoplay gate', () => {
  it('runs only when nothing holds it', () => {
    expect(mayAutoplay(running)).toBe(true);
  });
  it.each(Object.keys(running) as (keyof AutoplayGate)[])('stops when %s', (k) => {
    expect(mayAutoplay({ ...running, [k]: true })).toBe(false);
  });
});

describe('slide index', () => {
  it('next wraps from the last photo to the first', () => {
    expect(nextIndex(0, 5)).toBe(1);
    expect(nextIndex(4, 5)).toBe(0);
    expect(nextIndex(0, 0)).toBe(0);
  });
  it('index from the scroll position snaps to the nearest slide and stays in range', () => {
    expect(indexAt(0, 375, 5)).toBe(0);
    expect(indexAt(375 * 2 + 100, 375, 5)).toBe(2);
    expect(indexAt(375 * 2 + 200, 375, 5)).toBe(3);
    expect(indexAt(99999, 375, 5)).toBe(4);
    expect(indexAt(-375, 375, 5)).toBe(1); // RTL scrollLeft is negative
    expect(indexAt(100, 0, 5)).toBe(0);
  });
  it('arrow keys move one photo and wrap; Home/End jump; other keys are left alone', () => {
    expect(indexForKey('ArrowRight', 0, 3)).toBe(1);
    expect(indexForKey('ArrowRight', 2, 3)).toBe(0);
    expect(indexForKey('ArrowLeft', 0, 3)).toBe(2);
    expect(indexForKey('Home', 2, 3)).toBe(0);
    expect(indexForKey('End', 0, 3)).toBe(2);
    expect(indexForKey('Enter', 0, 3)).toBeNull();
    expect(indexForKey('Escape', 0, 3)).toBeNull();
  });
});

describe('viewer focus trap', () => {
  const list = ['close', 'track', 'prev', 'next'];
  it('Tab on the last control goes back to the first, Shift+Tab on the first to the last', () => {
    expect(wrapTarget(list, 'next', false)).toBe('close');
    expect(wrapTarget(list, 'close', true)).toBe('next');
  });
  it('focus outside the list is pulled back in', () => {
    expect(wrapTarget(list, null, false)).toBe('close');
    expect(wrapTarget(list, 'elsewhere', true)).toBe('next');
  });
  it('in the middle the browser moves focus itself', () => {
    expect(wrapTarget(list, 'track', false)).toBeNull();
    expect(wrapTarget(list, 'prev', true)).toBeNull();
    expect(wrapTarget([], 'x', false)).toBeNull();
  });
});
