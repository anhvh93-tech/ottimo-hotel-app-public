import { createRequire } from 'node:module';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// FB-R1-ARC-OPS-01: the api is CommonJS, the shared packages are ESM. At runtime dist/main.js uses
// require(); this only works on Node >= 22.12 (require(esm)) with a "default" export condition.
// Vitest itself runs ESM, so this test calls the real Node require() to catch regressions.
const requireFromApi = createRequire(join(process.cwd(), 'package.json'));

describe('shared workspace packages load through require()', () => {
  it('@ottimo/integrations exposes runtime values', () => {
    const mod = requireFromApi('@ottimo/integrations') as Record<string, unknown>;
    expect(typeof mod.MockNotificationAdapter).toBe('function');
  });

  it('@ottimo/contracts resolves', () => {
    expect(() => requireFromApi('@ottimo/contracts')).not.toThrow();
  });
});
