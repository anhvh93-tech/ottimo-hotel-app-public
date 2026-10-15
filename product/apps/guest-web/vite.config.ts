import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Dev server runs on the host (architecture.md section 17); API calls are proxied to the api container.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
    strictPort: true,
    proxy: {
      '/health': 'http://localhost:3000',
      '/v1': 'http://localhost:3000',
    },
  },
  build: { outDir: 'dist', sourcemap: true },
  test: { environment: 'node', include: ['src/**/*.test.{ts,tsx}'] },
});
