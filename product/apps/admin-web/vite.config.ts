import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Dev server runs on the host (architecture.md section 17).
// VITE_API_MODE=mock (default in `pnpm dev`): MSW answers /v1 from src/mocks (examples of openapi.yaml).
// VITE_API_MODE=server (`pnpm dev:server`): /v1 is proxied to the api container.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/health': 'http://localhost:3000',
      '/v1': 'http://localhost:3000',
    },
  },
  build: { outDir: 'dist', sourcemap: true },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test/setup.ts'],
    testTimeout: 15_000,
  },
});
