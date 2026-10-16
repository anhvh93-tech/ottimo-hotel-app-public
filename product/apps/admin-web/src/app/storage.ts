// Only non-secret UI state goes to Web Storage (selected property, theme, language, form drafts).
// Session/CSRF tokens never do: the session is an HttpOnly cookie, the CSRF token stays in memory.

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
