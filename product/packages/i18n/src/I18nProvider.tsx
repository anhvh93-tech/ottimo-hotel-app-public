import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  formatInstant,
  formatLocalDate,
  formatNumber,
  isLocaleLoaded,
  loadLocale,
  translate,
  type Args,
  type Locale,
} from './translate';

export interface I18n {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, args?: Args) => string;
  vnd: (amount: number) => string;
  date: (value: string | undefined | null) => string;
  dateTime: (value: string | undefined | null) => string;
}

const Ctx = createContext<I18n | null>(null);
const STORAGE_KEY = 'ottimo.locale';

function initialLocale(fallback: Locale): Locale {
  try {
    const saved = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (saved === 'vi' || saved === 'en') return saved;
  } catch {
    /* storage blocked – use default */
  }
  return fallback;
}

/** Staff UI language: VI/EN in R2 (RU in R3). Preference is not sensitive, so localStorage is fine. */
export function I18nProvider({
  children,
  defaultLocale = 'vi',
}: {
  children: ReactNode;
  defaultLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(() => initialLocale(defaultLocale));

  // EN strings are a lazy chunk: until they arrive, `translate` shows VI (never a blank screen).
  const [loaded, setLoaded] = useState(() => isLocaleLoaded(locale));
  useEffect(() => {
    document.documentElement.lang = locale;
    if (isLocaleLoaded(locale)) {
      setLoaded(true);
      return;
    }
    let stale = false;
    setLoaded(false);
    loadLocale(locale).then(
      () => !stale && setLoaded(true),
      () => undefined,
    );
    return () => {
      stale = true;
    };
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      globalThis.localStorage?.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<I18n>(
    () => ({
      locale,
      setLocale,
      t: (key, args) => translate(locale, key, args),
      vnd: (amount) => formatNumber(locale, amount),
      date: formatLocalDate,
      dateTime: (v) => formatInstant(locale, v),
    }),
    // `loaded` re-creates `t` once the lazy locale chunk is in.
    [locale, setLocale, loaded],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n(): I18n {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useI18n outside I18nProvider');
  return ctx;
}
