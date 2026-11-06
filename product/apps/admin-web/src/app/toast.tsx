import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useI18n } from '@ottimo/i18n';
import { Icon } from '@ottimo/ui';

interface Toast {
  id: number;
  text: string;
  /** A second line in the warn tone; such a toast never hides by itself (UXD copy-v1.0.5 9.3). */
  warn?: string;
}

export interface ToastOptions {
  /** v1.0.5 V5-5C: "saved, but check this" – e.g. `rooms.warn.nightly_price_unusual` after a room price save. */
  warn?: string;
}

/** Long confirmations (e.g. params.saved with an effective date) stay longer (FB-R2-UXD-FE-16). */
const toastMs = (text: string) => (text.length > 60 ? 8000 : 6000);
type Push = (text: string, opts?: ToastOptions) => void;
const Ctx = createContext<Push>(() => undefined);

/**
 * C18 toast for "Đã lưu" confirmations only – things that need action stay on the page (HR-09). v1.0.5 V5-5C: a
 * "saved" toast may carry one warning line (`opts.warn`, UXD copy-v1.0.5 9.3) – then it does not hide by itself.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const { t: tr } = useI18n();
  const closeLabel = tr('common.close');
  const [items, setItems] = useState<Toast[]>([]);
  const next = useRef(1);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  /** Hover/focus on the toast area pauses auto-hide (WCAG 2.2.1); leaving restarts the countdown. */
  const paused = useRef(false);
  const remove = useCallback((id: number) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setItems((xs) => xs.filter((x) => x.id !== id));
  }, []);
  const schedule = useCallback(
    (id: number, text: string) => {
      clearTimeout(timers.current.get(id));
      timers.current.set(
        id,
        setTimeout(() => (paused.current ? undefined : remove(id)), toastMs(text)),
      );
    },
    [remove],
  );
  const push = useCallback<Push>(
    (text, opts) => {
      const id = next.current++;
      const warn = opts?.warn;
      setItems((xs) => [...xs, warn ? { id, text, warn } : { id, text }]);
      // A warning stays until the user closes it (it asks for a check, not just "saved").
      if (!warn) schedule(id, text);
    },
    [schedule],
  );
  // Auto-hide timers die with the provider (sign-out, test cleanup): a late `remove` would set state on an
  // unmounted provider – after the Vitest jsdom teardown that throws "window is not defined".
  useEffect(() => {
    const live = timers.current;
    return () => {
      live.forEach((t) => clearTimeout(t));
      live.clear();
    };
  }, []);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const pause = () => {
    paused.current = true;
  };
  const resume = () => {
    paused.current = false;
    itemsRef.current.forEach((x) => (x.warn ? undefined : schedule(x.id, x.text)));
  };
  const value = useMemo(() => push, [push]);
  return (
    <Ctx.Provider value={value}>
      {children}
      <div
        className="toasts"
        role="status"
        aria-live="polite"
        onMouseEnter={pause}
        onMouseLeave={resume}
        onFocus={pause}
        onBlur={resume}
      >
        {items.map((t) => (
          <div className={t.warn ? 'toast toast-warn' : 'toast'} key={t.id}>
            <Icon name={t.warn ? 'alert' : 'check'} />
            {t.warn ? (
              <span className="grow">
                {t.text}
                <span className="toast-warn-line">{t.warn}</span>
              </span>
            ) : (
              <span>{t.text}</span>
            )}
            <button
              type="button"
              className="btn ghost sm"
              aria-label={closeLabel}
              onClick={() => remove(t.id)}
            >
              <Icon name="x" size="sm" />
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
