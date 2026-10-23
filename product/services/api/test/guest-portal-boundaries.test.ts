/**
 * guest-portal reads other zones only through their public ports (ARC review s4-ARC.md FB-R2-ARC-BE-S4-09, pattern
 * of the reporting C5/C6 block in module-boundaries.test.ts; no DB):
 * - never `FROM`/`JOIN` the housekeeping task table (the BR-506 "second full clean" money decision goes through
 *   GUEST_REQUEST_WORK_PORT `lastFullCleanAt`), the reservation tables (`reservations/public` read ports) or the
 *   folio tables (FolioService);
 * - never writes or locks them (`INSERT INTO` / `UPDATE … SET` / `DELETE FROM`).
 * Still read directly, listed here and due in R3 Sprint 1 (ARC S4-09 "các đọc khác có thể R3 Sprint 1"): `room`
 * (room number/name of a request) and `property` (`phone_public`, timezone) – platform/inventory reference data.
 * SQL keywords are upper case in this code base, so `FROM`/`JOIN` match case-sensitively (JS `from '…'` never does).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = join(__dirname, '..', 'src');
const GUEST_PORTAL = join(SRC, 'modules', 'guest-portal');
const FORBIDDEN = /^(hk_task|reservation|reservation_segment|stay_night|folio|folio_line|payment)$/;
const READ_UNTIL_R3 = ['room', 'property'];

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? files(p) : p.endsWith('.ts') ? [p] : [];
  });
}
const rel = (f: string) => relative(SRC, f).split(sep).join('/');
const codeOf = (f: string) =>
  readFileSync(f, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');

describe('guest-portal boundaries (ARC S4-09)', () => {
  it('never reads the task, booking or folio tables of other modules', () => {
    const bad: string[] = [];
    for (const f of files(GUEST_PORTAL)) {
      for (const m of codeOf(f).matchAll(/\b(?:FROM|JOIN)\s+([a-z_][a-z0-9_]*)/g)) {
        if (FORBIDDEN.test(m[1] as string)) bad.push(`${rel(f)}: ${m[1]}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('never writes the tables of other modules', () => {
    const own = new Set([
      'guest_request',
      'state_transition',
      'guest_session',
      'guest_access_token',
      'online_checkin',
      'idempotency_key',
      // SR-RET-03 shared purge journal (append-only, ids only): every module that purges writes its rows –
      // T13 `guest_request.purge` (R3-Q15).
      'purge_journal',
    ]);
    const bad: string[] = [];
    for (const f of files(GUEST_PORTAL)) {
      const code = codeOf(f);
      const writes = [
        ...code.matchAll(/\bINSERT\s+INTO\s+([a-z_][a-z0-9_]*)/g),
        ...code.matchAll(/\bUPDATE\s+([a-z_][a-z0-9_]*)\s+(?:[a-z]\s+)?SET\b/g),
        ...code.matchAll(/\bDELETE\s+FROM\s+([a-z_][a-z0-9_]*)/g),
      ];
      for (const m of writes) if (!own.has(m[1] as string)) bad.push(`${rel(f)}: ${m[0]}`);
    }
    expect(bad).toEqual([]);
  });

  it('every other table it reads is its own, or listed for R3', () => {
    const own = [
      'guest_request',
      'guest_session',
      'online_checkin',
      'idempotency_key',
      'guest_resolve_session', // SECURITY DEFINER entry functions (no tenant visible)
      'guest_resolve_token',
      'unnest',
    ];
    const unlisted: string[] = [];
    for (const f of files(GUEST_PORTAL)) {
      for (const m of codeOf(f).matchAll(/\b(?:FROM|JOIN)\s+([a-z_][a-z0-9_]*)/g)) {
        const t = m[1] as string;
        if (!own.includes(t) && !READ_UNTIL_R3.includes(t)) unlisted.push(`${rel(f)}: ${t}`);
      }
    }
    expect(unlisted).toEqual([]);
  });
});
