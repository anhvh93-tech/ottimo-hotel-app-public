import { readFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

const OUT_DIR = 'dist';

/**
 * The MSW worker lives in public/ for `pnpm dev` only. guest-web must not ship any service worker in R2:
 * nothing about the stay or the ID photos may be cached on the guest's phone (SEC ĐK-3, SR-PWA-03).
 */
function dropMockWorker(): Plugin {
  return {
    name: 'ottimo-drop-msw-worker',
    apply: 'build',
    closeBundle() {
      const out = fileURLToPath(new URL(`./${OUT_DIR}/mockServiceWorker.js`, import.meta.url));
      rmSync(out, { force: true });
    },
  };
}

/**
 * The UXD string files hold every app's copy (~290 KB for VI+EN+RU). The guest page ships only the key
 * families it can use – mobile data on a 3G hallway matters (MOB checklist) and staff wording such as
 * Desk/registration text never reaches the guest bundle.
 */
const GUEST_KEY_PREFIXES = ['guest.', 'gw.', 'common.', 'error.', 'field.', 'shell.skip'];

/** SEC ĐK-6: level-2 / bill / door-code copy is not even shipped in R2 (s3-checklist G8 scans dist). */
const R2_FORBIDDEN_KEYS =
  /^(guest\.verify\.|guest\.door_code|guest\.late\.(done_title|code_|how_|prompt|arrival_hint)|guest\.tab\.bill|guest\.bill\.|guest\.after_checkout\.body)/;

function guestStringsOnly(): Plugin {
  return {
    name: 'ottimo-guest-strings-only',
    enforce: 'pre',
    load(id) {
      if (!/design\/copy\/strings-(vi|en|ru)\.json$/.test(id)) return null;
      const all = JSON.parse(readFileSync(id, 'utf8')) as Record<string, unknown>;
      const kept = Object.fromEntries(
        Object.entries(all).filter(
          ([k]) => GUEST_KEY_PREFIXES.some((p) => k.startsWith(p)) && !R2_FORBIDDEN_KEYS.test(k),
        ),
      );
      return JSON.stringify(kept);
    },
  };
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
  // No public source maps (FB-R2-SEC-FE-02); SOURCEMAP=1 → hidden maps for local debugging only.
  build: { outDir: OUT_DIR, sourcemap: process.env.SOURCEMAP === '1' ? 'hidden' : false },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test/setup.ts'],
    testTimeout: 15_000,
  },
});
