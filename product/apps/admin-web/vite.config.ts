import { rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

const OUT_DIR = 'dist';

/**
 * The MSW worker lives in public/ for `pnpm dev` only; a production build must not ship a service
 * worker script on the admin origin (FB-R2-SEC-FE-04, SR-PWA-03).
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

// Dev server runs on the host (architecture.md section 17).
// VITE_API_MODE=mock (default in `pnpm dev`): MSW answers /v1 from src/mocks (examples of openapi.yaml).
// VITE_API_MODE=server (`pnpm dev:server`): /v1 is proxied to the api container.
export default defineConfig({
  plugins: [react(), dropMockWorker()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/health': 'http://localhost:3000',
      '/v1': 'http://localhost:3000',
    },
  },
  // No public source maps in the image (FB-R2-SEC-FE-02). SOURCEMAP=1 → `hidden` maps (no
  // sourceMappingURL comment) for local debugging; never copy them to a web root.
  build: { outDir: OUT_DIR, sourcemap: process.env.SOURCEMAP === '1' ? 'hidden' : false },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test/setup.ts'],
    testTimeout: 15_000,
  },
});
