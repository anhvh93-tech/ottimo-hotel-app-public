import { useEffect, useState } from 'react';

/**
 * hi-fi `hifi.css` hides the Desk sidebar at ≤ 860 px (`.side{display:none}`); from there the shell shows the
 * H24 bottom bar instead (UXR S4 P-02). One query for both so exactly one menu exists at any width.
 */
export const NARROW_QUERY = '(max-width: 860px)';

/** `window.matchMedia(query).matches`, kept in sync; false where matchMedia does not exist (old jsdom). */
export function useMedia(query: string): boolean {
  const get = () =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(query).matches
      : false;
  const [match, setMatch] = useState(get);
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia(query);
    const on = () => setMatch(mq.matches);
    on();
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, [query]);
  return match;
}

/** Phone / small tablet layout of the Desk (bottom bar, back button, compact header). */
export function useNarrow(): boolean {
  return useMedia(NARROW_QUERY);
}
