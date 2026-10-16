// Smoke (S) cases whose feature is not on the build yet (plan R2 W8: "allowed red/skip for
// features not built – mark skip"). One skipped test per TC so the report always shows the full
// smoke list with its TC code. When a feature lands: write the real spec, set the manifest entry
// to status "implemented" + "spec", and it disappears from here automatically.
import { readFileSync } from 'node:fs';
import { test } from '@playwright/test';

type SmokeCase = {
  tc: string;
  status: 'implemented' | 'pending';
  waitingFor?: string;
  title: string;
  story?: string;
  endpoints?: string;
};

const manifest = JSON.parse(
  readFileSync(new URL('../smoke-manifest.json', import.meta.url), 'utf8'),
) as {
  cases: SmokeCase[];
};

test.describe('Smoke (S) – chờ tính năng', { tag: ['@smoke', '@pending'] }, () => {
  for (const c of manifest.cases.filter((x) => x.status === 'pending')) {
    test.skip(
      `${c.tc} ${c.title}`,
      {
        annotation: [
          { type: 'waitingFor', description: c.waitingFor ?? '' },
          { type: 'story', description: c.story ?? '' },
          { type: 'endpoints', description: c.endpoints ?? '' },
        ],
      },
      async () => {},
    );
  }
});
