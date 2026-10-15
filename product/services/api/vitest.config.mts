import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

// SWC is needed so NestJS decorators (and decorator metadata) work under Vitest (ADR-012).
export default defineConfig({
  plugins: [swc.vite({ module: { type: 'es6' } })],
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'node',
  },
});
