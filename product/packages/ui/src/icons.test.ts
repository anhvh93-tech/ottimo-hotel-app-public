// @vitest-environment node
import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
// @ts-expect-error – plain ESM script without types
import { OUT_URL, render } from '../scripts/sync.mjs';

describe('icons.ts', () => {
  it('matches design/wireframes/assets/icons.js (run `pnpm --filter @ottimo/ui sync`)', async () => {
    expect((await readFile(OUT_URL as URL, 'utf8')) === (await render())).toBe(true);
  });
});
