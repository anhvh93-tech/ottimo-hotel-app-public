// @vitest-environment node
// Guard rails of the staff PWA over the source (ADR-005 mục 6, SR-DEV-09, SR-PWA-07, DoD VI + EN).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { appSourceFiles, collectUsedKeys } from '../../scripts/used-keys';

const SRC = join(__dirname, '..');
const COPY = join(__dirname, '..', '..', '..', '..', 'design', 'copy');
/** App code without comments (comments may name what is forbidden). */
const source = () =>
  appSourceFiles(SRC)
    .map((f) =>
      readFileSync(f, 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/(^|[^:'"`])\/\/.*$/gm, '$1'),
    )
    .join('\n');

describe('OTTIMO Staff guard rails', () => {
  it('never calls C3 or money operations – a personal phone is never a trusted device', () => {
    const src = source();
    for (const p of [
      '/sensitive',
      'door-credential',
      'door-code',
      '/documents',
      '/registrations',
      '/folio',
      '/payments',
      '/refund',
      'step-up',
      '/approval-requests',
    ]) {
      expect(src, p).not.toContain(p);
    }
  });

  it('keeps no data in localStorage / sessionStorage (SR-PWA-07) – IndexedDB store only', () => {
    const src = source();
    expect(src).not.toMatch(/localStorage|sessionStorage/);
  });

  it('every string key the source names exists in VI and EN (UXD files, unfiltered)', () => {
    const vi = JSON.parse(readFileSync(join(COPY, 'strings-vi.json'), 'utf8')) as Record<
      string,
      unknown
    >;
    const en = JSON.parse(readFileSync(join(COPY, 'strings-en.json'), 'utf8')) as Record<
      string,
      unknown
    >;
    const used = collectUsedKeys(SRC);
    expect(used.exact.size).toBeGreaterThan(150);
    expect([...used.exact].filter((k) => typeof vi[k] !== 'string')).toEqual([]);
    expect([...used.exact].filter((k) => typeof en[k] !== 'string')).toEqual([]);
    // Template keys stay narrow families, and every member of an enum has its string.
    expect(used.prefixes.sort()).toEqual([
      'hk.status.',
      'hk.type.',
      'role.',
      'wo.sev.',
      'wo.status.',
    ]);
    for (const code of ['VC', 'VI', 'VD', 'CL', 'OC', 'OD', 'OOO']) {
      expect(vi[`hk.status.${code}`], code).toBeTypeOf('string');
      expect(en[`hk.status.${code}`], code).toBeTypeOf('string');
    }
    for (const s of ['new', 'in_progress', 'waiting_parts', 'done', 'cancelled']) {
      expect(en[`wo.status.${s}`], s).toBeTypeOf('string');
    }
  });
});
