// Landing site (ADR-014): static Astro build served by Caddy at the root domain. No island, no inline script or
// style (CSP `script-src 'self'; style-src 'self'`, ADR-014 2.4), no image service at runtime (photos arrive
// pre-optimised from UXD – concept 8.3), no third-party resource (2.6).
import sitemap from '@astrojs/sitemap';
import { defineConfig, passthroughImageService } from 'astro/config';
import { fileURLToPath } from 'node:url';
import { BOOKING_FORM_RENDERED } from './src/lib/booking-request';
import { DEFAULT_LANG, LANGS, SITE_URL, alternatesFor, langOfPath } from './src/lib/i18n';
import securityHeaders from './src/lib/security-headers.json';

// Review build of the booking form goes to its own folder (never deployed): `pnpm build:booking-preview`.
const outDir = process.env.LANDING_OUT_DIR ?? 'dist';

// Same headers as production (ADR-014 1.4) on `astro preview`; keys starting with "$" are notes, not headers.
const previewHeaders = Object.fromEntries(
  Object.entries(securityHeaders).filter(([name]) => !name.startsWith('$')),
);

export default defineConfig({
  site: SITE_URL,
  outDir,
  output: 'static',
  trailingSlash: 'always',
  compressHTML: true,
  build: {
    format: 'directory',
    inlineStylesheets: 'never',
  },
  i18n: {
    defaultLocale: DEFAULT_LANG,
    locales: [...LANGS],
    routing: { prefixDefaultLocale: false },
  },
  // Never re-encode images (no sharp at build or run time): <picture> uses the UXD files as they are.
  image: { service: passthroughImageService() },
  devToolbar: { enabled: false },
  prefetch: false,
  scopedStyleStrategy: 'class',
  // CSP headers on `astro preview` only (dev needs Vite's inline HMR client).
  server: ({ command }) => ({
    port: 5176,
    headers: command === 'preview' ? previewHeaders : {},
  }),
  vite: {
    resolve: {
      // The booking form (and its script) only enters the module graph when it is rendered (review build or feature
      // on) – otherwise Vite would still emit the unused form script into dist/_astro/.
      alias: {
        '@booking-form': fileURLToPath(
          new URL(
            BOOKING_FORM_RENDERED
              ? './src/components/BookingForm.astro'
              : './src/components/NoBookingForm.astro',
            import.meta.url,
          ),
        ),
      },
    },
    build: {
      // No data: URIs for fonts/images and no inlined scripts – everything is a hashed file under /_astro/.
      assetsInlineLimit: 0,
    },
  },
  integrations: [
    sitemap({
      // 404 pages and anything not published in every language stay out (ADR-014 5).
      filter: (page) => !/\/404\/?$/.test(new URL(page).pathname),
      i18n: { defaultLocale: DEFAULT_LANG, locales: Object.fromEntries(LANGS.map((l) => [l, l])) },
      // Same alternates as <head>, plus x-default (the sitemap integration does not add it itself).
      serialize(item) {
        const path = new URL(item.url).pathname;
        const slug = langOfPath(path) === DEFAULT_LANG ? path : path.replace(/^\/[a-z]{2}\//, '/');
        item.links = alternatesFor(slug).map((a) => ({ lang: a.hreflang, url: a.href }));
        return item;
      },
    }),
  ],
});
