import { readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import { collectUsedKeys, isShipped } from './build/used-keys';

const OUT_DIR = 'dist';
const SRC_DIR = fileURLToPath(new URL('./src', import.meta.url));

/**
 * The MSW worker lives in public/ for `pnpm dev` only. guest-web must not ship any service worker in R2:
 * nothing about the stay or the ID photos may be cached on the guest's phone (SEC ĐK-3, SR-PWA-03).
 */
function dropMockWorker(): Plugin {
  let outDir = OUT_DIR;
  return {
    name: 'ottimo-drop-msw-worker',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir.startsWith('/')
        ? config.build.outDir
        : join(config.root, config.build.outDir);
    },
    closeBundle() {
      rmSync(join(outDir, 'mockServiceWorker.js'), { force: true });
    },
  };
}

/**
 * The UXD string files hold every app's copy (~2 100 keys × VI/EN/RU). The guest page ships only the
 * keys its source names (FB-R2-SEC-MOB-01): no staff wording, no unused promise ("…your bill"), and
 * never the ĐK-6 keys – `src/__tests__/bundle.test.ts` builds the bundle and checks it on every run.
 */
function guestStringsOnly(): Plugin {
  return {
    name: 'ottimo-guest-strings-only',
    enforce: 'pre',
    load(id) {
      if (!/design\/copy\/strings-(vi|en|ru)\.json$/.test(id)) return null;
      const used = collectUsedKeys(SRC_DIR);
      const all = JSON.parse(readFileSync(id, 'utf8')) as Record<string, unknown>;
      return JSON.stringify(
        Object.fromEntries(Object.entries(all).filter(([k]) => isShipped(k, used))),
      );
    },
  };
}

/**
 * BUG-R4-017 / V5-24 (copy-v1.0.5 5.2): Vite inlines assets under 4 KB as `data:` URLs, which turned the small
 * JetBrains Mono faces (Cyrillic-ext 400/500, Vietnamese woff2 400/500) into `data:font/…` – blocked by the CSP
 * `font-src 'self'` (Caddyfile.prod): 6 console errors per load, and Cyrillic-ext letters in the code and Wi-Fi boxes
 * fell back to another font. Every self-hosted font stays a file under /assets/; the CSP is not loosened. Other
 * assets keep Vite's default.
 */
function keepFontsAsFiles(file: string): boolean | undefined {
  return /\.woff2?(\?|$)/i.test(file) ? false : undefined;
}

// Dev server runs on the host (architecture.md section 17).
// VITE_API_MODE=mock (default in `pnpm dev`): MSW answers /v1/guest/* from src/mocks (contract 0.3.6).
// VITE_API_MODE=server (`pnpm dev:server`): /v1 is proxied to the api container (BE-C).
export default defineConfig({
  plugins: [guestStringsOnly(), react(), dropMockWorker()],
  server: {
    port: 5175,
    strictPort: true,
    proxy: {
      '/health': 'http://localhost:3000',
      '/v1': 'http://localhost:3000',
    },
  },
  build: {
    outDir: OUT_DIR,
    // No public source maps (FB-R2-SEC-FE-02); SOURCEMAP=1 → hidden maps for local debugging only.
    sourcemap: process.env.SOURCEMAP === '1' ? 'hidden' : false,
    assetsInlineLimit: keepFontsAsFiles,
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test/setup.ts'],
    testTimeout: 15_000,
  },
});
