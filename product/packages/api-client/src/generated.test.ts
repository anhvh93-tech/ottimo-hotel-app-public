import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
// @ts-expect-error – plain ESM script without types
import { OUT_URL, generate } from '../scripts/gen.mjs';

describe('generated OpenAPI types', () => {
  it('match docs/api/openapi.yaml (run `pnpm --filter @ottimo/api-client gen`)', async () => {
    const committed = await readFile(OUT_URL as URL, 'utf8');
    expect(committed === (await generate())).toBe(true);
  }, 30_000);
});
