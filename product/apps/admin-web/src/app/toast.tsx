import {
  createContext,
  useCallback,
  useContext,
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
}

/** Long confirmations (e.g. params.saved with an effective date) stay longer (FB-R2-UXD-FE-16). */
const toastMs = (text: string) => (text.length > 60 ? 8000 : 6000);
const Ctx = createContext<(text: string) => void>(() => undefined);

/** C18 toast for "Đã lưu" confirmations only – things that need action stay on the page (HR-09). */
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
  const push = useCallback(
    (text: string) => {
      const id = next.current++;
      setItems((xs) => [...xs, { id, text }]);
      schedule(id, text);
    },
    [schedule],
  );
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const pause = () => {
    paused.current = true;
  };
  const resume = () => {
    paused.current = false;
    itemsRef.current.forEach((x) => schedule(x.id, x.text));
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
          <div className="toast" key={t.id}>
            <Icon name="check" />
            <span>{t.text}</span>
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
