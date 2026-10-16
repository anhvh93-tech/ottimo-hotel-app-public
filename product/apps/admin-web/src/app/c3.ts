import { useCallback, useEffect, useRef, useState } from 'react';
import { onClientDataClear } from './clientData';

/** SR-C3-11(4): full C3 values and copied C3 text live at most 60 s. */
export const C3_TTL_MS = 60_000;

/**
 * FB-R2-SEC-FE-06 – one way to show C3 data (full document number, portal data, full refund account):
 * hidden again after `ttlMs`, when the tab is hidden, on unmount and on sign-out (`clearClientData`).
 */
export function useC3Reveal<T>(ttlMs = C3_TTL_MS) {
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
    const onVis = () => document.visibilityState === 'hidden' && hide();
    document.addEventListener('visibilitychange', onVis);
    const off = onClientDataClear(hide);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      off();
      clearTimeout(timer.current);
    };
  }, [hide]);
  return { value, show, hide };
}

const writeClipboard = async (text: string) => {
  try {
    await globalThis.navigator?.clipboard?.writeText(text);
  } catch {
    // The browser may refuse a write (no focus / no permission) – best effort.
  }
};

/**
 * Copy C3 text and overwrite the clipboard with '' after 60 s, when the tab is hidden, when the
 * screen is left and on sign-out (best effort – the browser may refuse a background write).
 */
export function useC3Clipboard(ttlMs = C3_TTL_MS) {
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const dirty = useRef(false);
  const clear = useCallback(() => {
    clearTimeout(timer.current);
    if (!dirty.current) return;
    dirty.current = false;
    void writeClipboard('');
  }, []);
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
    const onVis = () => document.visibilityState === 'hidden' && clear();
    document.addEventListener('visibilitychange', onVis);
    const off = onClientDataClear(clear);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      off();
      clear();
    };
  }, [clear]);
  // "Xóa bộ nhớ tạm" – always overwrite, even if nothing was copied from this screen.
  const wipe = useCallback(() => {
    clearTimeout(timer.current);
    dirty.current = false;
    void writeClipboard('');
  }, []);
  return { copy, clear: wipe };
}
