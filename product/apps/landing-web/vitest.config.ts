import { defineConfig } from 'vitest/config';

// Unit tests (copy, i18n, language suggestion, brand CSS) and the dist checks of ADR-014 2.4–2.6 / 9.
// The dist checks read dist/: turbo runs `build` before `test` for this package (turbo.json).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
  },
});
