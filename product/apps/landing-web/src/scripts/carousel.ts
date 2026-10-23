// Hero slideshow (R3-Q52, INV 22/10): next photo every 3 s, swipe on phones (CSS scroll snap does the gesture),
// discreet dots + pause button. No library, no inline style (CSP). Autoplay never runs with prefers-reduced-motion,
// and waits while the tab is hidden, the hero is off screen, the pointer rests on it or focus is inside it.
// Bytes (concept 11.2): slides after the first are display:none (`is-pending`) until needed, so a phone loads the
// next photo only ~0.8 s before it is shown, and every photo only when a guest swipes or picks a dot.

/** State that decides whether the slideshow may advance on its own. */
export interface AutoplayGate {
  reducedMotion: boolean;
  userPaused: boolean;
  tabHidden: boolean;
  offScreen: boolean;
  hovered: boolean;
  focused: boolean;
}

export function mayAutoplay(g: AutoplayGate): boolean {
  return (
    !g.reducedMotion && !g.userPaused && !g.tabHidden && !g.offScreen && !g.hovered && !g.focused
  );
}

/** Next index with wrap-around (last → first). */
export function nextIndex(i: number, n: number): number {
  return n > 0 ? (i + 1) % n : 0;
}

/** Index of the slide closest to a scroll position (one slide = one track width). */
export function indexAt(scrollLeft: number, width: number, n: number): number {
  if (width <= 0 || n <= 0) return 0;
  return Math.min(n - 1, Math.max(0, Math.round(Math.abs(scrollLeft) / width)));
}

/** Index after a key press, or null when the key is not a slideshow key. */
export function indexForKey(key: string, i: number, n: number): number | null {
  switch (key) {
    case 'ArrowRight':
      return nextIndex(i, n);
    case 'ArrowLeft':
      return (i - 1 + n) % n;
    case 'Home':
      return 0;
    case 'End':
      return n - 1;
    default:
      return null;
  }
}

interface Options {
  intervalMs: number;
  /** How long before an automatic step the next photo is revealed (so it has time to load). */
  preloadMs?: number;
  reducedMotion: MediaQueryList;
}

export function initCarousel(
  root: HTMLElement,
  { intervalMs, preloadMs = 800, reducedMotion }: Options,
) {
  const track = root.querySelector<HTMLElement>('[data-car-track]');
  const slides = [...root.querySelectorAll<HTMLElement>('[data-car-slide]')];
  const ctrl = root.querySelector<HTMLElement>('[data-car-ctrl]');
  const toggle = root.querySelector<HTMLButtonElement>('[data-car-toggle]');
  const dots = [...root.querySelectorAll<HTMLButtonElement>('[data-car-dot]')];
  const n = slides.length;
  if (!track || n < 2) return;

  const gate: AutoplayGate = {
    reducedMotion: reducedMotion.matches,
    userPaused: false,
    tabHidden: document.hidden,
    offScreen: false,
    hovered: false,
    focused: false,
  };
  let current = 0;
  let stepTimer: number | undefined;
  let preloadTimer: number | undefined;

  const reveal = (i: number) => slides[i]?.classList.remove('is-pending');
  const revealAll = () => slides.forEach((_, i) => reveal(i));
  const imgOf = (i: number) => slides[i]?.querySelector('img') ?? null;

  const scrollToIndex = (i: number, smooth: boolean) => {
    for (let k = 0; k <= i; k++) reveal(k); // a slide's position needs every slide before it
    track.scrollTo({ left: i * track.clientWidth, behavior: smooth ? 'smooth' : 'auto' });
  };

  const setCurrent = (i: number) => {
    current = i;
    dots.forEach((d, k) => {
      if (k === i) d.setAttribute('aria-current', 'true');
      else d.removeAttribute('aria-current');
    });
  };

  const goTo = (i: number, smooth = !gate.reducedMotion) => {
    if (i === 0 && current === n - 1 && smooth && typeof track.animate === 'function') {
      // Wrap-around: a short fade instead of rewinding through every photo.
      const out = track.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 200,
        easing: 'ease-out',
      });
      out.onfinish = () => {
        scrollToIndex(0, false);
        track.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-in' });
      };
    } else scrollToIndex(i, smooth);
    setCurrent(i);
  };

  const clearTimers = () => {
    window.clearTimeout(stepTimer);
    window.clearTimeout(preloadTimer);
    stepTimer = preloadTimer = undefined;
  };

  const step = () => {
    stepTimer = undefined;
    if (!mayAutoplay(gate)) return;
    const next = nextIndex(current, n);
    reveal(next);
    const img = imgOf(next);
    if (img && !(img.complete && img.naturalWidth > 0)) {
      // Not loaded yet (slow network): show it as soon as it arrives rather than an empty frame.
      img.addEventListener('load', () => schedule(0), { once: true });
      img.addEventListener('error', () => schedule(intervalMs), { once: true });
      return;
    }
    goTo(next);
    schedule(intervalMs);
  };

  const schedule = (delay: number) => {
    clearTimers();
    if (!mayAutoplay(gate)) return;
    const next = nextIndex(current, n);
    preloadTimer = window.setTimeout(() => reveal(next), Math.max(0, delay - preloadMs));
    stepTimer = window.setTimeout(step, delay);
  };

  const update = () => {
    if (!mayAutoplay(gate)) clearTimers();
    else if (stepTimer === undefined) schedule(intervalMs);
  };

  // Controls exist only with JavaScript. Nothing to pause when the slideshow never moves on its own.
  if (ctrl) ctrl.hidden = false;
  const syncToggle = () => {
    if (!toggle) return;
    toggle.hidden = gate.reducedMotion;
    const label = gate.userPaused ? toggle.dataset.labelPlay : toggle.dataset.labelPause;
    if (label) toggle.setAttribute('aria-label', label);
    toggle.classList.toggle('is-paused', gate.userPaused);
  };
  syncToggle();
  toggle?.addEventListener('click', () => {
    gate.userPaused = !gate.userPaused;
    syncToggle();
    update();
  });

  dots.forEach((d, i) =>
    d.addEventListener('click', () => {
      revealAll();
      goTo(i);
      clearTimers();
      update();
    }),
  );

  // Swipe / trackpad / keyboard: every photo becomes reachable; the dots follow the scroll position.
  const onInteract = () => {
    revealAll();
    clearTimers();
    update();
  };
  track.addEventListener('pointerdown', onInteract, { passive: true });
  track.addEventListener('touchstart', onInteract, { passive: true });
  track.addEventListener('wheel', onInteract, { passive: true });
  track.addEventListener('keydown', (e) => {
    const i = indexForKey(e.key, current, n);
    if (i === null) return;
    e.preventDefault();
    revealAll();
    goTo(i);
  });
  let raf = 0;
  track.addEventListener(
    'scroll',
    () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const i = indexAt(track.scrollLeft, track.clientWidth, n);
        if (i !== current && !track.getAnimations().length) setCurrent(i);
      });
    },
    { passive: true },
  );

  root.addEventListener('pointerenter', (e) => {
    if (e.pointerType === 'mouse') {
      gate.hovered = true;
      update();
    }
  });
  root.addEventListener('pointerleave', () => {
    gate.hovered = false;
    update();
  });
  root.addEventListener('focusin', () => {
    gate.focused = true;
    revealAll();
    update();
  });
  root.addEventListener('focusout', (e) => {
    if (!root.contains(e.relatedTarget as Node | null)) {
      gate.focused = false;
      update();
    }
  });
  document.addEventListener('visibilitychange', () => {
    gate.tabHidden = document.hidden;
    update();
  });
  reducedMotion.addEventListener('change', () => {
    gate.reducedMotion = reducedMotion.matches;
    syncToggle();
    update();
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(
      ([e]) => {
        gate.offScreen = !e?.isIntersecting;
        update();
      },
      { threshold: 0.25 },
    ).observe(root);
  }
  // Keep the photo in place when the window (and so one slide) changes width.
  window.addEventListener('resize', () => scrollToIndex(current, false), { passive: true });

  // Start after the page has loaded, so the next photo never competes with the first view (concept 11.2 budget).
  const start = () => update();
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start, { once: true });
}
