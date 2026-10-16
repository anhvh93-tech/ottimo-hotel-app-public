import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

// SWC is needed so NestJS decorators (and decorator metadata) work under Vitest (ADR-012).
// globalSetup applies the migrations (as ottimo_migrator) once when MIGRATION_DATABASE_URL is set; the
// integration tests then run as ottimo_app (DATABASE_URL) and create their own tenants (no shared state).
export default defineConfig({
  plugins: [swc.vite({ module: { type: 'es6' } })],
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'node',
    globalSetup: ['test/helpers/global-setup.ts'],
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
