// Room photo viewer (R3-Q52, OTA style) on a native modal <dialog> (components/RoomGallery.astro): showModal() makes
// the page behind inert, Esc closes (native "cancel"), Tab stays inside, focus returns to the "n photos" button.
// Photos: scroll-snap row (swipe), ← → Home End keys, previous/next buttons that wrap around, counter "2 / 6".
import { indexAt, indexForKey } from './carousel';

/** Elements Tab may reach inside the dialog, in order. */
function tabbables(root: HTMLElement): HTMLElement[] {
  return [
    ...root.querySelectorAll<HTMLElement>('button, [href], [tabindex]:not([tabindex="-1"])'),
  ].filter((el) => !el.hidden && !(el as HTMLButtonElement).disabled && el.getClientRects().length);
}

/** Target of Tab / Shift+Tab when focus would leave the dialog; null = let the browser move focus. */
export function wrapTarget<T>(list: readonly T[], active: T | null, shift: boolean): T | null {
  if (!list.length) return null;
  const first = list[0]!;
  const last = list[list.length - 1]!;
  const i = active === null ? -1 : list.indexOf(active);
  if (shift && i <= 0) return last;
  if (!shift && (i === -1 || i === list.length - 1)) return first;
  return null;
}

export function initLightbox(dialog: HTMLDialogElement, opener: HTMLElement) {
  const track = dialog.querySelector<HTMLElement>('[data-lb-track]');
  const slides = [...dialog.querySelectorAll<HTMLElement>('.lb-slide')];
  const count = dialog.querySelector<HTMLElement>('[data-lb-count]');
  const countSr = dialog.querySelector<HTMLElement>('[data-lb-count-sr]');
  const n = slides.length;
  if (!track || !n || typeof dialog.showModal !== 'function') return;
  let current = 0;
  let returnTo: HTMLElement = opener;

  const eagerAround = (i: number) => {
    for (const k of [i, (i + 1) % n, (i - 1 + n) % n]) {
      const img = slides[k]?.querySelector('img');
      if (img && img.loading === 'lazy') img.loading = 'eager';
    }
  };
  const show = (i: number) => {
    current = i;
    if (count) count.textContent = `${i + 1} / ${n}`;
    if (countSr)
      countSr.textContent = (countSr.dataset.template ?? '').replace('{i}', String(i + 1));
    eagerAround(i);
  };
  const goTo = (i: number, smooth = true) => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const wrap = Math.abs(i - current) > 1; // last ↔ first: jump, never rewind through every photo
    track.scrollTo({
      left: i * track.clientWidth,
      behavior: smooth && !reduce && !wrap ? 'smooth' : 'auto',
    });
    show(i);
  };

  opener.hidden = false;
  opener.addEventListener('click', () => {
    returnTo = opener;
    document.documentElement.classList.add('lb-open');
    dialog.showModal();
    goTo(0, false);
    dialog.querySelector<HTMLElement>('[data-lb-close]')?.focus();
  });
  dialog.querySelector('[data-lb-close]')?.addEventListener('click', () => dialog.close());
  dialog
    .querySelector('[data-lb-prev]')
    ?.addEventListener('click', () => goTo((current - 1 + n) % n));
  dialog.querySelector('[data-lb-next]')?.addEventListener('click', () => goTo((current + 1) % n));
  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('lb-open');
    returnTo.focus();
  });
  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      const list = tabbables(dialog);
      const target = wrapTarget(list, document.activeElement as HTMLElement | null, e.shiftKey);
      if (target) {
        e.preventDefault();
        target.focus();
      }
      return;
    }
    const i = indexForKey(e.key, current, n);
    if (i === null) return;
    e.preventDefault();
    goTo(i);
  });
  let raf = 0;
  track.addEventListener(
    'scroll',
    () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const i = indexAt(track.scrollLeft, track.clientWidth, n);
        if (i !== current) show(i);
      });
    },
    { passive: true },
  );
  window.addEventListener(
    'resize',
    () => {
      if (dialog.open) track.scrollTo({ left: current * track.clientWidth, behavior: 'auto' });
    },
    { passive: true },
  );
}

export function initLightboxes(doc: Document = document) {
  doc.querySelectorAll<HTMLElement>('[data-gallery-open]').forEach((btn) => {
    const dialog = doc.getElementById(btn.dataset.galleryOpen ?? '');
    if (dialog instanceof HTMLDialogElement) initLightbox(dialog, btn);
  });
}
