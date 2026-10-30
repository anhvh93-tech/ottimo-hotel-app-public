/**
 * The worker's audit allowlists (no DB) – OPS j15-folio-close-check 10.2/10.3 (rc.5 on staging 29/10): every J15
 * `folio.close` threw AuditEntityNotRegisteredError and rolled back, every J24 `payment.expire` tick failed, because
 * `defineAuditEntity(...)` ran only when a `*.module.ts` was imported and the worker never imports one.
 *
 * Each check runs in a NEW Node process (test/helpers/worker-process.ts) that loads only what the entrypoint loads:
 * the Vitest worker holds the registry of every module other tests imported, which is how BUG-R3-037 test (b)
 * passed while the worker failed.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { inWorkerProcess } from './helpers/worker-process';

const SRC = join(__dirname, '..', 'src');

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? files(p) : p.endsWith('.ts') ? [p] : [];
  });
}
const rel = (f: string) => relative(SRC, f).split(sep).join('/');

type Registry = Record<string, string[]>;

describe('audit allowlists in the worker process (only src/worker-jobs.ts loaded)', () => {
  let worker: { registry: Registry; jobs: string[]; moduleFiles: string[] };
  let api: { registry: Registry; moduleFiles: string[] };
  beforeAll(async () => {
    [worker, api] = await Promise.all([
      inWorkerProcess<typeof worker>({ cmd: 'audit-registry', load: 'worker' }),
      inWorkerProcess<typeof api>({ cmd: 'audit-registry', load: 'api' }),
    ]);
  }, 180_000);

  it('the child process is the worker: its 20 jobs, and no Nest module file loaded', () => {
    expect(worker.jobs).toEqual(
      expect.arrayContaining(['folio.close', 'payment.expire', 'hold.expire']),
    );
    expect(worker.moduleFiles).toEqual([]);
    // The api child really loads the modules (otherwise the comparison below proves nothing).
    expect(api.moduleFiles).toEqual(
      expect.arrayContaining([
        'src/modules/folio/folio.module.ts',
        'src/modules/payments/payments.module.ts',
      ]),
    );
  });

  it('the worker registers exactly the allowlists of the api (same entity types, same fields)', () => {
    expect(worker.registry).toEqual(api.registry);
  });

  it('every entity type written by the code (entityType literal) has an allowlist in the worker', () => {
    const written = new Set<string>();
    for (const f of files(SRC).filter((x) => !rel(x).startsWith('test-support/'))) {
      for (const m of readFileSync(f, 'utf8').matchAll(/entityType: '([a-z_]+)'/g)) {
        written.add(m[1] as string);
      }
    }
    expect(written.size).toBeGreaterThan(20);
    const missing = [...written].filter((t) => !worker.registry[t]).sort();
    expect(missing).toEqual([]);
    // The two entity types of OPS 10.2/10.3 by name.
    expect(worker.registry.folio).toEqual(expect.arrayContaining(['status', 'balanceDueVnd']));
    expect(worker.registry.payment).toEqual(expect.arrayContaining(['status', 'amountVnd']));
  });
});

describe('allowlists live outside the Nest module files (no DB)', () => {
  it('no `*.module.ts` calls defineAuditEntity; every modules/*/audit-entities.ts is in src/audit-entities.ts', () => {
    const inModules = files(SRC)
      .filter((f) => f.endsWith('.module.ts'))
      .filter((f) => /^defineAuditEntity\(/m.test(readFileSync(f, 'utf8')))
      .map(rel);
    expect(inModules).toEqual([]);
    const entityFiles = files(join(SRC, 'modules'))
      .filter((f) => f.endsWith('/audit-entities.ts'))
      .map((f) => `./${rel(f).replace(/\.ts$/, '')}`)
      .sort();
    expect(entityFiles.length).toBeGreaterThan(10);
    const central = readFileSync(join(SRC, 'audit-entities.ts'), 'utf8');
    const imported = [...central.matchAll(/^import '([^']+)';$/gm)].map((m) => m[1]).sort();
    expect(imported).toEqual(entityFiles);
    // Every process entrypoint without a Nest container loads the central file.
    for (const entry of [
      'worker-jobs.ts',
      'admin/production-bootstrap-cli.ts',
      'admin/mfa-operator-reset-cli.ts',
    ]) {
      expect(readFileSync(join(SRC, entry), 'utf8'), entry).toMatch(
        /^import '\.\.?\/(\.\.\/)?audit-entities';$/m,
      );
    }
  });
});
