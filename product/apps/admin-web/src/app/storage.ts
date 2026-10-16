// Web Storage holds UI flags only (selected property in sessionStorage; theme, language in
// localStorage). Never personal data (C2/C3 – SR-PWA-07) and never session/CSRF tokens: the session is
// an HttpOnly cookie, the CSRF token stays in memory. Form drafts live in memory (app/clientData.ts).

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export const readSession = (key: string) => safe(() => sessionStorage.getItem(key), null);
export const writeSession = (key: string, value: string) =>
  safe(() => sessionStorage.setItem(key, value), undefined);
export const removeSession = (key: string) => safe(() => sessionStorage.removeItem(key), undefined);
export const readLocal = (key: string) => safe(() => localStorage.getItem(key), null);
export const writeLocal = (key: string, value: string) =>
  safe(() => localStorage.setItem(key, value), undefined);

/** Remove every `ottimo.*` key from sessionStorage (localStorage keeps theme/language only). */
export function clearSessionKeys(prefix = 'ottimo.') {
  safe(() => {
    const keys: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k?.startsWith(prefix)) keys.push(k);
    }
    keys.forEach((k) => sessionStorage.removeItem(k));
  }, undefined);
}
