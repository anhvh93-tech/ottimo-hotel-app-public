import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Dev server runs on the host (architecture.md section 17); API calls are proxied to the api container.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true,
    proxy: {
      '/health': 'http://localhost:3000',
      '/v1': 'http://localhost:3000',
    },
  },
  // No public source maps in the image (FB-R2-SEC-FE-02, OPS S3). Local debugging only:
  // `pnpm --filter @ottimo/mobile build --sourcemap hidden` – never copy the maps to a web root.
  build: { outDir: 'dist', sourcemap: false },
  test: { environment: 'node', include: ['src/**/*.test.{ts,tsx}'] },
});
