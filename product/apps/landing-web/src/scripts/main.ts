// The only script of the landing (external module – CSP script-src 'self'). The page works without it: every
// button is a real link; only "Copy address", the language suggestion, the hero slideshow controls and the room
// photo viewer need JavaScript (R3-Q52: without it the hero is the first photo, a room card its cover photo).
import { HERO_INTERVAL_MS } from '../content/gallery';
import { initCarousel } from './carousel';
import { preferredLang, readChoice, saveChoice, suggestion } from './lang';
import { initLightboxes } from './lightbox';

const root = document.documentElement;
const pageLang = root.lang;
const storage = (() => {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
})();

// Language: published languages of this page = its hreflang alternates (x-default excluded).
const available = [...document.querySelectorAll<HTMLLinkElement>('link[rel="alternate"][hreflang]')]
  .map((l) => l.hreflang)
  .filter((l) => l !== 'x-default');
const published = available.length ? available : [pageLang];

document.querySelectorAll<HTMLElement>('[data-set-lang]').forEach((el) => {
  el.addEventListener('click', () => saveChoice(storage, el.dataset.setLang ?? pageLang));
});

const wanted = suggestion(
  pageLang,
  preferredLang(readChoice(storage), navigator.languages ?? [navigator.language], published),
  available,
);
const strip = wanted ? document.querySelector<HTMLElement>(`[data-suggest="${wanted}"]`) : null;
if (strip) {
  strip.hidden = false;
  root.classList.add('has-suggest');
  strip.querySelector('[data-ls-close]')?.addEventListener('click', () => {
    saveChoice(storage, pageLang); // closing = keep this language
    strip.hidden = true;
    root.classList.remove('has-suggest');
  });
}

// Phone action bar (concept 3.3, N2): hidden while the hero buttons, #book, #contact or the footer are on screen –
// never two filled buttons at once, never over the keyboard in the form, never repeating Contact's Zalo button.
const bar = document.getElementById('stickybar');
if (bar) {
  if ('IntersectionObserver' in window) {
    const watched = [
      document.getElementById('hero-actions'),
      document.getElementById('book'),
      document.getElementById('contact'),
      document.querySelector('.site-f'),
    ].filter((el): el is HTMLElement => el instanceof HTMLElement);
    const onScreen = new Map<Element, boolean>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) onScreen.set(e.target, e.isIntersecting);
        bar.dataset.hidden = String([...onScreen.values()].some(Boolean));
      },
      { threshold: 0 },
    );
    watched.forEach((el) => io.observe(el));
  } else {
    bar.dataset.hidden = 'false';
    root.classList.add('no-io');
  }
}

// Copy address: status message in the page language, read from data attributes.
const copyBtn = document.getElementById('copy-addr');
const copyStatus = document.getElementById('copy-status');
copyBtn?.addEventListener('click', () => {
  const text = document.getElementById('addr-text')?.textContent?.trim() ?? '';
  const say = (msg?: string) => {
    if (copyStatus) copyStatus.textContent = msg ?? '';
  };
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(
      () => say(copyBtn.dataset.copied),
      () => say(copyBtn.dataset.failed),
    );
  } else {
    say(copyBtn.dataset.failed);
  }
});

// Mobile menu: close after choosing a section, or on Escape.
const menu = document.querySelector<HTMLDetailsElement>('details.menu');
menu?.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => (menu.open = false)));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && menu?.open) {
    menu.open = false;
    menu.querySelector('summary')?.focus();
  }
});

// A link to a FAQ entry (e.g. "Monthly stays" → #faq-monthly) opens it.
const openTarget = () => {
  let id = '';
  try {
    id = decodeURIComponent(location.hash.slice(1));
  } catch {
    return; // malformed hash: nothing to open
  }
  const el = id ? document.getElementById(id) : null;
  if (el instanceof HTMLDetailsElement) el.open = true;
};
window.addEventListener('hashchange', openTarget);
openTarget();

// A photo that fails to load keeps its Cream frame instead of a broken-image icon (US-153 AC5).
document.addEventListener(
  'error',
  (e) => {
    if (e.target instanceof HTMLImageElement) e.target.classList.add('is-broken');
  },
  true,
);
for (const img of document.images) {
  if (img.complete && img.naturalWidth === 0) img.classList.add('is-broken');
}

// Hero slideshow and room photo viewers (R3-Q52).
const hero = document.querySelector<HTMLElement>('[data-carousel]');
if (hero)
  initCarousel(hero, {
    intervalMs: HERO_INTERVAL_MS,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)'),
  });
initLightboxes();
