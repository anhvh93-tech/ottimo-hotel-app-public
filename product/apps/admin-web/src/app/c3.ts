import { useCallback, useEffect, useRef, useState } from 'react';
import { onClientDataClear } from './clientData';

/** SR-C3-11(4): full C3 values and copied C3 text live at most 60 s. */
export const C3_TTL_MS = 60_000;

/**
 * FB-R2-SEC-FE-06 – one way to show C3 data (full document number, portal data, full refund account):
 * hidden again after `ttlMs`, when the tab is hidden, on unmount and on sign-out (`clearClientData`).
 * Turning `onTabHidden` off is a SEC exception (s3-SEC §8) allowed ONLY in `GuestLinkPanel`
 * (guest link → pasted into Zalo) – never for C3 data; `c3-exception.test.ts` enforces it.
 */
export function useC3Reveal<T>(ttlMs = C3_TTL_MS, { onTabHidden = true } = {}) {
  const [value, setValue] = useState<T | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const hide = useCallback(() => {
    clearTimeout(timer.current);
    setValue(null);
  }, []);
  const show = useCallback(
    (v: T) => {
      clearTimeout(timer.current);
      setValue(v);
      timer.current = setTimeout(() => setValue(null), ttlMs);
    },
    [ttlMs],
  );
  useEffect(() => {
    const onVis = () => onTabHidden && document.visibilityState === 'hidden' && hide();
    document.addEventListener('visibilitychange', onVis);
    const off = onClientDataClear(hide);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      off();
      clearTimeout(timer.current);
    };
  }, [hide, onTabHidden]);
  return { value, show, hide };
}

/** True when the browser accepted the write (it refuses without focus / permission). */
const writeClipboard = async (text: string): Promise<boolean> => {
  const clip = globalThis.navigator?.clipboard;
  if (!clip) return false;
  try {
    await clip.writeText(text);
    return true;
  } catch {
    return false;
  }
};

/**
 * Copy C3 text and overwrite the clipboard with '' after 60 s, when the tab is hidden, when the
 * screen is left and on sign-out (best effort – the browser may refuse a background write).
 * With `onTabHidden` off (SEC exception, GuestLinkPanel only) the copy survives a tab switch so the
 * desk can paste it in Zalo; it is still wiped after `ttlMs`, on leaving the screen and on sign-out.
 * s3-SEC §8 (2): a wipe that happens while the page is hidden / unfocused usually fails silently, so
 * it stays "pending" and is written again as soon as the page is visible / focused again.
 */
export function useC3Clipboard(ttlMs = C3_TTL_MS, { onTabHidden = true } = {}) {
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const dirty = useRef(false);
  const pending = useRef(false);
  const flush = useCallback(async () => {
    pending.current = true;
    const away = document.visibilityState === 'hidden' || !document.hasFocus();
    const ok = await writeClipboard('');
    // Written while away may not have reached the system clipboard – write again on return.
    if (ok && !away) pending.current = false;
  }, []);
  const clear = useCallback(() => {
    clearTimeout(timer.current);
    if (!dirty.current) return;
    dirty.current = false;
    void flush();
  }, [flush]);
  const copy = useCallback(
    async (text: string) => {
      await writeClipboard(text);
      dirty.current = true;
      clearTimeout(timer.current);
      timer.current = setTimeout(clear, ttlMs);
    },
    [clear, ttlMs],
  );
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'hidden') {
        if (onTabHidden) clear();
      } else if (pending.current) void flush();
    };
    const onFocus = () => {
      if (pending.current) void flush();
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('focus', onFocus);
    const off = onClientDataClear(clear);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('focus', onFocus);
      off();
      clear();
    };
  }, [clear, flush, onTabHidden]);
  // "Xóa bộ nhớ tạm" – always overwrite, even if nothing was copied from this screen.
  const wipe = useCallback(() => {
    clearTimeout(timer.current);
    dirty.current = false;
    void flush();
  }, [flush]);
  return { copy, clear: wipe };
}
