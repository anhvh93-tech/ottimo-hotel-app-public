import { clearSessionKeys } from './storage';

/**
 * Browser-side data that must not outlive the signed-in user (SR-PWA-04, SR-PWA-07, TM-02, TM-42).
 *
 * - Form drafts (DS D5) may hold C2 data (name, phone, email, date of birth, notes), so they are kept
 *   in memory only – never Web Storage. They survive closing the dialog and an expired session of the
 *   SAME user in this tab (the page is not reloaded); a reload, sign-out or a different user drops them.
 * - `clearClientData()` is the single wipe point: sign-out, a different user signing in, and later
 *   (Sprint 3) query caches / C3 clipboard hooks register here.
 */
const drafts = new Map<string, string>();
const wipers = new Set<() => void>();

export const readDraft = (key: string): string | null => drafts.get(key) ?? null;
export const writeDraft = (key: string, value: string) => {
  drafts.set(key, value);
};
export const removeDraft = (key: string) => {
  drafts.delete(key);
};

/** Register extra in-memory state to wipe (query cache, copied C3 values…). Returns unregister. */
export function onClientDataClear(fn: () => void): () => void {
  wipers.add(fn);
  return () => wipers.delete(fn);
}

export function clearClientData() {
  drafts.clear();
  clearSessionKeys('ottimo.');
  wipers.forEach((fn) => {
    try {
      fn();
    } catch {
      /* a failing wiper must not stop the others */
    }
  });
  // Admin-web registers no service worker (SR-PWA-03); drop any Cache Storage left on this origin.
  try {
    if (typeof caches !== 'undefined')
      void caches
        .keys()
        .then((names) => Promise.all(names.map((n) => caches.delete(n))))
        .catch(() => undefined);
  } catch {
    /* Cache Storage unavailable (insecure context, tests) */
  }
}
