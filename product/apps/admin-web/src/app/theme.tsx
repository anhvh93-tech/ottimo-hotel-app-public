import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { readLocal, writeLocal } from './storage';

export type ThemeChoice = 'auto' | 'light' | 'dark';
const KEY = 'ottimo.theme';
const Ctx = createContext<{ theme: ThemeChoice; setTheme: (t: ThemeChoice) => void } | null>(null);

/** tokens.css switches on `:root[data-theme]`; "auto" follows prefers-color-scheme. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeChoice>(() => {
    const saved = readLocal(KEY);
    return saved === 'light' || saved === 'dark' ? saved : 'auto';
  });
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'auto') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);
  }, [theme]);
  const setTheme = useCallback((t: ThemeChoice) => {
    setThemeState(t);
    writeLocal(KEY, t);
  }, []);
  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useTheme outside ThemeProvider');
  return ctx;
}
