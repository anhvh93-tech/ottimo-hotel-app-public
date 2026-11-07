/**
 * V5-17 (BUG-R4-043; BR-904 v0.5.5) – unit, no database. Every SQL statement of the api that writes the room money
 * of a night (`INSERT INTO stay_night`, or `UPDATE stay_night … room_revenue_vnd =`) writes `is_complimentary` from
 * that money in the same statement, and no writer passes a channel-based value any more. Migration 0097's trigger
 * keeps the rule on any write; this guard keeps the application saying the same thing (so a restore without the
 * trigger, or a review of the code alone, still sees the rule).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = join(__dirname, '..', 'src');

function tsFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory())
      return name === 'migrations' || name === 'generated' ? [] : tsFiles(p);
    return p.endsWith('.ts') ? [p] : [];
  });
}

/** Template-literal bodies of a file (the SQL of this code base is written in backticks). */
function templates(text: string): string[] {
  return text.split('`').filter((_, i) => i % 2 === 1);
}

const writers = tsFiles(SRC).flatMap((file) =>
  templates(readFileSync(file, 'utf8'))
    .filter(
      (sql) =>
        /\bINSERT\s+INTO\s+stay_night\b/i.test(sql) ||
        (/\bUPDATE\s+stay_night\b/i.test(sql) && /\broom_revenue_vnd\s*=/i.test(sql)),
    )
    .map((sql) => ({ where: relative(SRC, file), sql })),
);

describe('V5-17 – writers of a night’s room money also write is_complimentary from it', () => {
  it('finds the writers (insertNights, lease nights, A31, the allocation service, re-price / move writers)', () => {
    const files = new Set(writers.map((w) => w.where));
    expect([...files].sort()).toEqual([
      'modules/reservations/internal/lease-nights.ts',
      'modules/reservations/internal/reservation-store.ts',
      'modules/reservations/internal/reservations.service.ts',
      'modules/reservations/public/stay-night-allocation.ts',
      'modules/reservations/public/stay-night-pricing.ts',
    ]);
    expect(writers.length).toBeGreaterThanOrEqual(9);
  });

  it('each one sets is_complimentary in the same statement', () => {
    for (const w of writers) {
      expect(/\bis_complimentary\b/.test(w.sql), `${w.where}: ${w.sql.slice(0, 120)}`).toBe(true);
    }
  });

  it('no flag by channel is left (BUG-R4-043: `group === internal`, a copied booking flag, `isComplimentary ||`)', () => {
    for (const file of tsFiles(SRC)) {
      const text = readFileSync(file, 'utf8');
      expect(text, relative(SRC, file)).not.toMatch(
        /isComplimentary\s*:\s*(group|row\.is_complimentary)/,
      );
      expect(text, relative(SRC, file)).not.toMatch(/\.isComplimentary\s*\|\|/);
      expect(text, relative(SRC, file)).not.toMatch(/group === 'internal' \|\| \(priced/);
    }
  });
});
