/**
 * v1.0.4 P4-14 – the worker log line (ARC FB-R4-ARC-BE-PR24PM-03, -04). Units, no database.
 * - `logLine` never throws: BigInt, a cycle, a throwing getter or `toJSON` give `logError: "UNSERIALIZABLE"`;
 * - the startup failure is one JSON line with the error name and code, never `err.message` (SEC S-1);
 * - ESLint `no-console` holds for `src/worker*.ts` and `src/jobs/**`, and none of them calls `console` today.
 * Fake values only.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { ESLint } from 'eslint';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { errorTag, logLine, writeErrorLine, writeLogLine } from '../src/shared/log-line';

const PRODUCT = join(__dirname, '..', '..', '..');
const SRC = join(__dirname, '..', 'src');

describe('PR24PM-03 – logLine never throws', () => {
  const cycle: Record<string, unknown> = { a: 1 };
  cycle.self = cycle;
  it.each([
    ['BigInt', { n: 10n }],
    ['a cycle', { c: cycle }],
    [
      'a throwing getter',
      Object.defineProperty({}, 'g', {
        enumerable: true,
        get() {
          throw new Error('getter');
        },
      }),
    ],
    [
      'a nested toJSON that throws',
      {
        d: {
          toJSON() {
            throw new Error('toJSON');
          },
        },
      },
    ],
  ])('%s → {level, msg, logError: UNSERIALIZABLE}', (_n, extra) => {
    const line = logLine('error', 'email dispatch failed', extra as Record<string, unknown>);
    expect(JSON.parse(line)).toEqual({
      level: 'error',
      msg: 'email dispatch failed',
      logError: 'UNSERIALIZABLE',
    });
    // `grep '"msg":"…'` of the infra README 13.2 still matches.
    expect(line.startsWith('{"level":"error","msg":"email dispatch failed"')).toBe(true);
  });

  it('the other fields are dropped, never printed half-way', () => {
    const line = logLine('info', 'm', { code: 'VALUE_NOT_PRINTED', n: 1n });
    expect(line).not.toContain('VALUE_NOT_PRINTED');
  });

  it('a serializable line is unchanged (level and msg first, extras cannot overwrite them, toJSON dropped)', () => {
    expect(logLine('info', 'job done', { job: 'J1', properties: 1 })).toBe(
      '{"level":"info","msg":"job done","job":"J1","properties":1}',
    );
    expect(JSON.parse(logLine('error', 'x', { level: 'A', msg: 'y', toJSON: () => 1 }))).toEqual({
      level: 'error',
      msg: 'x',
    });
  });
});

describe('PR24PM-04 – the worker startup failure line', () => {
  afterEach(() => vi.restoreAllMocks());

  it('errorTag keeps the name and a short code, never the message', () => {
    const err = Object.assign(new TypeError('guest Test Guest 0905111222'), {
      code: 'ECONNREFUSED',
    });
    expect(errorTag(err)).toEqual({ err: 'TypeError', code: 'ECONNREFUSED' });
    expect(errorTag(Object.assign(new Error('x'), { code: 'has space and value 0905' }))).toEqual({
      err: 'Error',
    });
    expect(errorTag('a string thrown')).toEqual({ err: 'error' });
    expect(errorTag(null)).toEqual({ err: 'error' });
  });

  it('is one JSON line on stderr without err.message', () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    writeErrorLine(
      'worker failed',
      errorTag(new Error('password=not-a-real-one for user x@example.test')),
    );
    expect(errSpy).toHaveBeenCalledTimes(1);
    const line = String(errSpy.mock.calls[0]![0]);
    expect(JSON.parse(line)).toEqual({ level: 'error', msg: 'worker failed', err: 'Error' });
    expect(line).not.toContain('not-a-real-one');
    expect(line).not.toContain('example.test');
  });

  it('writeLogLine prints one logLine on stdout', () => {
    const outSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    writeLogLine('info', 'worker started', { email: 'smtp' });
    expect(outSpy).toHaveBeenCalledWith('{"level":"info","msg":"worker started","email":"smtp"}');
  });
});

function tsFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return tsFiles(p);
    return p.endsWith('.ts') ? [p] : [];
  });
}

describe('PR24PM-04 – no console in the worker and the jobs', () => {
  const workerFiles = [
    ...readdirSync(SRC)
      .filter((f) => /^worker.*\.ts$/.test(f))
      .map((f) => join(SRC, f)),
    ...tsFiles(join(SRC, 'jobs')),
  ];

  it('the files are found (worker.ts, worker-chat.ts, worker-jobs.ts, jobs/*)', () => {
    const names = workerFiles.map((p) => relative(SRC, p));
    expect(names).toEqual(
      expect.arrayContaining(['worker.ts', 'worker-chat.ts', 'worker-jobs.ts']),
    );
    expect(names.some((n) => n.startsWith('jobs'))).toBe(true);
  });

  it('no file calls console (they log through shared/log-line)', () => {
    const offenders = workerFiles
      .filter((p) =>
        /\bconsole\s*\./.test(readFileSync(p, 'utf8').replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '')),
      )
      .map((p) => relative(SRC, p));
    expect(offenders).toEqual([]);
  });

  it('ESLint refuses console in a job and in a worker file, not in shared/log-line.ts', async () => {
    const eslint = new ESLint({ cwd: PRODUCT });
    const code = "export const f = (): void => {\n  console.log('x');\n};\n";
    const ruleIds = async (file: string) =>
      (await eslint.lintText(code, { filePath: join(PRODUCT, file) }))[0]!.messages.map(
        (m) => m.ruleId,
      );
    expect(await ruleIds('services/api/src/jobs/new-job.ts')).toContain('no-console');
    expect(await ruleIds('services/api/src/worker-new.ts')).toContain('no-console');
    expect(await ruleIds('services/api/src/shared/log-line.ts')).not.toContain('no-console');
  }, 60_000);
});
