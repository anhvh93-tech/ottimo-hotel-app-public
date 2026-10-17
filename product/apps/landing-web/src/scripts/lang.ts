// Language suggestion and the guest's choice (ADR-014 3.2 points 3–4). Pure logic, unit-tested in lang.test.ts.
// Never redirects: it only reveals a hidden strip that links to the same page in the preferred language.

export const STORAGE_KEY = 'ottimo.lang';

/** Primary subtag, lower case: 'vi-VN' → 'vi'. */
export function primaryLang(tag: string | undefined | null): string {
  return (tag ?? '').trim().toLowerCase().split(/[-_]/)[0] ?? '';
}

/**
 * Preferred language: the guest's stored choice if it is published, else the first browser language if
 * published, else English (= x-default).
 */
export function preferredLang(
  stored: string | null,
  browserLangs: readonly string[],
  published: readonly string[],
): string {
  if (stored && published.includes(stored)) return stored;
  const first = primaryLang(browserLangs[0]);
  return published.includes(first) ? first : 'en';
}

/** Language to suggest on this page, or null when the page already matches or has no version in it. */
export function suggestion(
  pageLang: string,
  preferred: string,
  availableOnPage: readonly string[],
): string | null {
  return preferred !== pageLang && availableOnPage.includes(preferred) ? preferred : null;
}

export function readChoice(storage: Pick<Storage, 'getItem'> | undefined): string | null {
  try {
    return storage?.getItem(STORAGE_KEY) ?? null;
  } catch {
    return null; // storage blocked: fall back to the browser language every time
  }
}

export function saveChoice(storage: Pick<Storage, 'setItem'> | undefined, lang: string): void {
  try {
    storage?.setItem(STORAGE_KEY, lang);
  } catch {
    /* storage blocked: the strip may show again, the page stays correct */
  }
}
