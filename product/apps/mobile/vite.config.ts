import { createHash } from 'node:crypto';
import { readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import { collectUsedKeys, isShipped } from './scripts/used-keys';

const OUT_DIR = 'dist';
const SRC_DIR = fileURLToPath(new URL('./src', import.meta.url));

function resolveOut(root: string, outDir: string) {
  return outDir.startsWith('/') ? outDir : join(root, outDir);
}

/**
 * The PWA ships only the UXD string keys its source names (scripts/used-keys.ts – not build/, which .gitignore drops: BUG-R2-050): smaller first load
 * (ADR-005 ≤ 180 KB gzip) and no Desk wording on a personal phone.
 */
function staffStringsOnly(): Plugin {
  return {
    name: 'ottimo-staff-strings-only',
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
 * Production output: drop the MSW worker (dev only) and stamp the app service worker with a build id,
 * so a deploy replaces the cached app shell (sw.js cache name = `ottimo-staff-<id>`).
 */
function pwaOutput(): Plugin {
  let outDir = OUT_DIR;
  return {
    name: 'ottimo-staff-pwa-output',
    apply: 'build',
    configResolved(config) {
      outDir = resolveOut(config.root, config.build.outDir);
    },
    closeBundle() {
      rmSync(join(outDir, 'mockServiceWorker.js'), { force: true });
      const sw = join(outDir, 'sw.js');
      if (!existsSync(sw)) return;
      const index = existsSync(join(outDir, 'index.html'))
        ? readFileSync(join(outDir, 'index.html'), 'utf8')
        : String(Date.now());
      const id = createHash('sha256').update(index).digest('hex').slice(0, 12);
      writeFileSync(sw, readFileSync(sw, 'utf8').replaceAll('__BUILD_ID__', id));
    },
  };
}

// Dev server runs on the host (architecture.md section 17).
// VITE_API_MODE=mock (default in `pnpm dev`): MSW answers /v1/* from src/mocks (contract 0.3.7).
// VITE_API_MODE=server (`pnpm dev:server`): /v1 is proxied to the api container (BE-C housekeeping module).
export default defineConfig({
  plugins: [staffStringsOnly(), react(), pwaOutput()],
  server: {
    port: 5174,
    strictPort: true,
    proxy: {
      '/health': 'http://localhost:3000',
      '/v1': 'http://localhost:3000',
    },
  },
  // No public source maps in the image (FB-R2-SEC-FE-02, OPS S3). SOURCEMAP=1 → hidden maps, local only.
  build: { outDir: OUT_DIR, sourcemap: process.env.SOURCEMAP === '1' ? 'hidden' : false },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test/setup.ts'],
    testTimeout: 20_000,
  },
});
