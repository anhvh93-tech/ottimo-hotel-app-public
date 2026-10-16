/**
 * Guard of the drizzle migration journal (ARC s3-contract 4.2 rule 7) – unit, no database.
 *
 * drizzle-orm's migrator applies only the entries whose `when` is greater than the newest row of
 * drizzle.__drizzle_migrations, in ARRAY order. A migration merged later with a smaller `when` is therefore
 * skipped SILENTLY on a database that already ran the newer one (staging) – a fresh test DB never sees it.
 * These checks make that mistake fail in CI instead.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

interface JournalEntry {
  idx: number;
  version: string;
  when: number;
  tag: string;
  breakpoints: boolean;
}

const DIR = join(__dirname, '..', 'src', 'db', 'migrations');
const journal = JSON.parse(readFileSync(join(DIR, 'meta', '_journal.json'), 'utf8')) as {
  entries: JournalEntry[];
};
const files = readdirSync(DIR)
  .filter((f) => f.endsWith('.sql'))
  .map((f) => f.slice(0, -4))
  .sort();

/** File-name ranges (namespaces, not order): legacy 0000–0029, BE-A 0030–0039, BE-B 0040–0049, BE-C 0050–0059. */
const ALLOWED: Array<[number, number]> = [
  [0, 29],
  [30, 39],
  [40, 49],
  [50, 59],
];

const prefixOf = (tag: string) => Number(tag.slice(0, 4));

describe('migrations journal (s3-contract 4.2)', () => {
  it('idx equals the position in the array', () => {
    journal.entries.forEach((e, i) => expect(e.idx, e.tag).toBe(i));
  });

  it('`when` increases strictly along the array (no silently skipped migration)', () => {
    for (let i = 1; i < journal.entries.length; i += 1) {
      const prev = journal.entries[i - 1] as JournalEntry;
      const cur = journal.entries[i] as JournalEntry;
      expect(cur.when, `${cur.tag} must be newer than ${prev.tag}`).toBeGreaterThan(prev.when);
    }
  });

  it('every entry has its .sql file and every .sql file has an entry', () => {
    const tags = journal.entries.map((e) => e.tag).sort();
    expect(tags).toEqual(files);
  });

  it('file prefixes are 4 digits inside an allowed range and never repeated', () => {
    const seen = new Set<number>();
    for (const e of journal.entries) {
      expect(e.tag, e.tag).toMatch(/^\d{4}_[a-z0-9_]+$/);
      const n = prefixOf(e.tag);
      expect(
        ALLOWED.some(([lo, hi]) => n >= lo && n <= hi),
        `${e.tag}: prefix outside 0000–0059 – ask ARC`,
      ).toBe(true);
      expect(seen.has(n), `${e.tag}: duplicate prefix`).toBe(false);
      seen.add(n);
    }
  });

  it('Sprint 3 files carry the owner suffix of their range', () => {
    const owner: Array<[number, number, string]> = [
      [30, 39, '_be_a'],
      [40, 49, '_be_b'],
      [50, 59, '_be_c'],
    ];
    for (const e of journal.entries) {
      const n = prefixOf(e.tag);
      const o = owner.find(([lo, hi]) => n >= lo && n <= hi);
      if (o) expect(e.tag.endsWith(o[2]), `${e.tag} should end with ${o[2]}`).toBe(true);
    }
  });

  it('every entry uses statement breakpoints and journal version 7', () => {
    for (const e of journal.entries) {
      expect(e.breakpoints, e.tag).toBe(true);
      expect(e.version, e.tag).toBe('7');
    }
  });
});
