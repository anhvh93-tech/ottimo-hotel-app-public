import type { GuestDocumentSensitive } from '@ottimo/api-client';
import { useCallback, useEffect, useRef } from 'react';
import { C3_TTL_MS, useC3Reveal } from '../../app/c3';
import { onClientDataClear } from '../../app/clientData';

/** One revealed document: the full number (when the desk entered it) and its photos (object URLs). */
export interface RevealedDoc {
  full: GuestDocumentSensitive | null;
  /** `null` = this photo could not be read (`deleted` = 404 – removed by retention, E06-04). */
  photos: Array<{ url: string } | { url: null; deleted: boolean }>;
}

const urlsOf = (v: RevealedDoc | null): string[] =>
  (v?.photos ?? []).flatMap((p) => (p.url ? [p.url] : []));

/**
 * UXR P2 (ảnh 020) – "Xem đủ số / ảnh" shows the document photos too, under the same C3 rules as the full
 * number (SEC B5, FB-R2-SEC-FE-06): read after step-up with a reason (`getDocumentImage`, fetch
 * `cache: 'no-store'`), kept only in memory as object URLs, hidden after 60 s, when the tab is hidden, on
 * leaving the screen and on sign-out (`useC3Reveal`) – and every object URL is revoked the moment it is
 * hidden, so the decrypted image does not outlive the view. Nothing goes to any storage.
 */
export function useC3DocReveal(ttlMs = C3_TTL_MS) {
  const reveal = useC3Reveal<RevealedDoc>(ttlMs);
  const live = useRef<string[]>([]);
  /** Bumped on every hide/show: a read that finishes after the view was closed is thrown away. */
  const gen = useRef(0);

  // Revoke what is no longer shown (hidden by the timer / tab / sign-out, or replaced).
  useEffect(() => {
    const now = urlsOf(reveal.value);
    for (const u of live.current) if (!now.includes(u)) URL.revokeObjectURL(u);
    live.current = now;
    if (!reveal.value) gen.current++;
  }, [reveal.value]);
  // A read still running is cancelled by the same events that hide a shown value (tab hidden, sign-out,
  // leaving the screen) – `useC3Reveal` does not re-render when nothing is shown yet.
  useEffect(() => {
    const cancel = () => gen.current++;
    const onVis = () => document.visibilityState === 'hidden' && cancel();
    document.addEventListener('visibilitychange', onVis);
    const off = onClientDataClear(cancel);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      off();
      cancel();
      for (const u of live.current) URL.revokeObjectURL(u);
      live.current = [];
    };
  }, []);

  const { show: showValue, hide: hideValue } = reveal;
  const hide = useCallback(() => {
    gen.current++;
    hideValue();
  }, [hideValue]);
  /**
   * Read the number (`readFull`, may be skipped) and each photo (`readPhoto`), then show them together.
   * Errors of `readFull` propagate (step-up!); a photo that fails is shown as "could not open" unless
   * `classify` says to rethrow.
   */
  const show = useCallback(
    async (
      readFull: (() => Promise<GuestDocumentSensitive>) | null,
      imageIds: readonly string[],
      readPhoto: (imageId: string) => Promise<Blob>,
      /** 'rethrow' (e.g. step-up needed) stops and throws; 'deleted' = 404; else "could not open". */
      classify: (e: unknown) => 'rethrow' | 'deleted' | 'failed',
    ): Promise<void> => {
      const mine = ++gen.current;
      const full = readFull ? await readFull() : null;
      const photos: RevealedDoc['photos'] = [];
      const made: string[] = [];
      for (const id of imageIds) {
        try {
          const blob = await readPhoto(id);
          const url = URL.createObjectURL(blob);
          made.push(url);
          photos.push({ url });
        } catch (e) {
          const kind = classify(e);
          if (kind === 'rethrow') {
            for (const u of made) URL.revokeObjectURL(u);
            throw e;
          }
          photos.push({ url: null, deleted: kind === 'deleted' });
        }
        if (mine !== gen.current) break;
      }
      // Hidden or unmounted while reading → never shown, nothing kept.
      if (mine !== gen.current) {
        for (const u of made) URL.revokeObjectURL(u);
        return;
      }
      showValue({ full, photos });
    },
    [showValue],
  );
  return { value: reveal.value, show, hide };
}
