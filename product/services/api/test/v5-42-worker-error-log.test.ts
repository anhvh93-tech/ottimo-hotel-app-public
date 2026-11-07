/**
 * V5-42 (plan Gói 4; SEC FB-R4-SEC-BE-BED-02/03, BED-05; SEC S-1) – the worker never logs `err.message`.
 * Units, no database (the PostgreSQL cases are in test/integration/v5-42-worker-error-log.test.ts):
 * - the worker tick (worker-loop.ts, the loop src/worker.ts runs): a job, the e-mail run and the Chat run that throw an
 *   error whose message, code or name holds a fake guest e-mail and a fake token → one line each, class name + safe
 *   code, the fake values nowhere on stdout/stderr;
 * - the crash lines (unhandled rejection, uncaught exception) in a real child process: one JSON line, exit 1;
 * - helpers: errorTag drops a name that is not an identifier, errorText, safeCode, adapterErrorCode (what the e-mail
 *   outbox logs and stores in last_error);
 * - a static guard over EVERY source file the worker process loads (its import graph, read in a child process):
 *   no `.message`, `.stack`, `String(err)`, `${err}`, `JSON.stringify(err)` or `inspect(` except the reviewed uses.
 * Fake values only (@example.test, tok_FAKE_…).
 */
import { execFile } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { IntegrationError } from '@ottimo/integrations/contracts';
import { mapSmtpError } from '@ottimo/integrations/notification';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { adapterErrorCode } from '../src/jobs/email-dispatch';
import type { PropertyRef } from '../src/jobs/job-runner';
import { errorTag, errorText, logLine, safeCode, writeLogLine } from '../src/shared/log-line';
import { createWorkerTick } from '../src/worker-loop';
import { inWorkerProcess } from './helpers/worker-process';

const API_DIR = join(__dirname, '..');
const FAKE_EMAIL = 'guest.v542@example.test';
const FAKE_TOKEN = 'tok_FAKE_v542_0123456789';
/** Every fake value a leaked line would show. */
const FAKES = [FAKE_EMAIL, FAKE_TOKEN, 'example.test', 'tok_FAKE'];

/** An error like the ones PostgreSQL, nodemailer or fetch throw: the message quotes the value that failed. */
function leaky(code?: string): Error {
  const e = new Error(
    `duplicate key value violates unique constraint "x" (email)=(${FAKE_EMAIL}) token=${FAKE_TOKEN}`,
  );
  return code ? Object.assign(e, { code }) : e;
}

const P: PropertyRef = {
  propertyId: '00000000-0000-7000-8000-000000000001',
  organizationId: '00000000-0000-7000-8000-000000000002',
  timezone: 'Asia/Ho_Chi_Minh',
};
const EMAIL_IDLE = { sent: 0, done: 0, retry: 0, dead: 0, deferred: 0 };
const CHAT_IDLE = { ...EMAIL_IDLE, skipped: 0, levelCapped: 0 };

function expectNoFake(text: string): void {
  for (const f of FAKES) expect(text, `leaked ${f}`).not.toContain(f);
}

describe('V5-42 – the worker tick logs class name + code, never the message', () => {
  afterEach(() => vi.restoreAllMocks());

  it('job, e-mail and Chat failures: one line each through writeLogLine, no fake value on stdout/stderr', async () => {
    const out = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const err = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    // The fetch failure of a Chat post: TypeError('fetch failed', {cause}) – the cause quotes the URL with its token.
    const chatErr = new TypeError(`fetch failed ${FAKE_TOKEN}`, {
      cause: Object.assign(new Error(`connect https://chat.example.test/?token=${FAKE_TOKEN}`), {
        code: 'ECONNREFUSED',
      }),
    });
    const tick = createWorkerTick({
      runner: {
        runDue: async (key) => {
          if (key === 'a.pg') throw leaky('23505');
          if (key === 'b.thrown_string') throw `${FAKE_EMAIL} ${FAKE_TOKEN}`;
          if (key === 'c.code_with_value') throw leaky(FAKE_EMAIL); // a code that is not a short token
          if (key === 'd.name_with_value') throw Object.assign(leaky(), { name: FAKE_EMAIL });
          return [{ propertyId: P.propertyId, status: 'done', stats: {} }];
        },
        listProperties: async () => [P],
      },
      jobKeys: ['a.pg', 'b.thrown_string', 'c.code_with_value', 'd.name_with_value', 'e.ok'],
      email: {
        runForProperty: async () => {
          throw leaky('ECONNECTION');
        },
      },
      chat: {
        runForProperty: async () => {
          throw chatErr;
        },
      },
      log: writeLogLine,
    });
    await tick();
    const printed = [...out.mock.calls, ...err.mock.calls, ...warn.mock.calls].map((c) =>
      String(c[0]),
    );
    expect(printed.map((l) => JSON.parse(l))).toEqual([
      { level: 'error', msg: 'job failed', job: 'a.pg', err: 'Error', code: '23505' },
      { level: 'error', msg: 'job failed', job: 'b.thrown_string', err: 'error' },
      { level: 'error', msg: 'job failed', job: 'c.code_with_value', err: 'Error' },
      { level: 'error', msg: 'job failed', job: 'd.name_with_value', err: 'Error' },
      { level: 'info', msg: 'job done', job: 'e.ok', properties: 1 },
      { level: 'error', msg: 'email dispatch failed', err: 'Error', code: 'ECONNECTION' },
      { level: 'error', msg: 'chat dispatch failed', err: 'TypeError' },
    ]);
    expectNoFake(printed.join('\n'));
  });

  it('a failing job does not stop the others, and a tick still running is not started twice', async () => {
    const lines: string[] = [];
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const ran: string[] = [];
    const tick = createWorkerTick({
      runner: {
        runDue: async (key) => {
          ran.push(key);
          if (key === 'a') await gate;
          if (key === 'b') throw leaky('22P02');
          return [];
        },
        listProperties: async () => [P],
      },
      jobKeys: ['a', 'b', 'c'],
      email: { runForProperty: async () => EMAIL_IDLE },
      chat: { runForProperty: async () => CHAT_IDLE },
      log: (level, msg, extra) => lines.push(logLine(level, msg, extra)),
    });
    const first = tick();
    await tick(); // overlaps the first: returns at once, runs nothing
    release();
    await first;
    expect(ran).toEqual(['a', 'b', 'c']);
    expect(lines).toEqual([
      '{"level":"error","msg":"job failed","job":"b","err":"Error","code":"22P02"}',
    ]);
  });

  it('the tick lives in worker-loop.ts and worker.ts runs it (no second copy of the loop in worker.ts)', () => {
    const strip = (f: string) =>
      readFileSync(join(API_DIR, 'src', f), 'utf8').replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '');
    const worker = strip('worker.ts');
    expect(worker).toMatch(/createWorkerTick\(\{/);
    expect(worker).toMatch(/installWorkerCrashLines\(\)/);
    expect(worker).not.toMatch(/runDue\(/);
    expect(strip('worker-loop.ts')).toMatch(
      /'job failed',\s*\{\s*job: key,\s*\.\.\.errorTag\(err\)\s*\}/,
    );
  });
});

/** Runs `code` in a new Node process with ts-node (like test/helpers/worker-process.ts). */
function runNode(code: string): Promise<{ status: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    execFile(
      process.execPath,
      ['-r', 'ts-node/register/transpile-only', '-e', code],
      {
        cwd: API_DIR,
        env: { ...process.env, TS_NODE_PROJECT: join(API_DIR, 'tsconfig.json') },
        timeout: 60_000,
      },
      (error, stdout, stderr) =>
        resolve({
          status: error ? ((error as { code?: number }).code ?? null) : 0,
          stdout,
          stderr,
        }),
    );
  });
}

describe('V5-42 – crash lines of the worker process (unhandled rejection, uncaught exception)', () => {
  const setup = `const { installWorkerCrashLines } = require('./src/worker-loop'); installWorkerCrashLines();`;
  const make = (ctor: string, code: string) =>
    `Object.assign(new ${ctor}(${JSON.stringify(`password reset for ${FAKE_EMAIL} token=${FAKE_TOKEN}`)}), { code: '${code}' })`;

  it.each([
    [
      'unhandled rejection',
      `${setup} Promise.reject(${make('Error', 'E_V542_REJECT')});`,
      { level: 'error', msg: 'worker unhandled rejection', err: 'Error', code: 'E_V542_REJECT' },
    ],
    [
      'uncaught exception (timer)',
      `${setup} setTimeout(() => { throw ${make('TypeError', 'E_V542_THROW')}; }, 0);`,
      { level: 'error', msg: 'worker uncaught exception', err: 'TypeError', code: 'E_V542_THROW' },
    ],
  ])(
    '%s → one JSON line on stderr, exit 1, no message or stack',
    async (_n, code, line) => {
      const r = await runNode(code);
      expect(r.status).toBe(1);
      expect(r.stdout).toBe('');
      const lines = r.stderr.split('\n').filter((l) => l.trim() !== '');
      expect(lines.map((l) => JSON.parse(l))).toEqual([line]);
      expectNoFake(r.stderr);
      expect(r.stderr).not.toMatch(/\n\s+at /); // no stack trace
    },
    60_000,
  );

  it('without the handlers Node itself prints the message (the case is meaningful)', async () => {
    const r = await runNode(`Promise.reject(${make('Error', 'E_V542_REJECT')});`);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain(FAKE_EMAIL);
  }, 60_000);
});

describe('V5-42 – helpers', () => {
  it('errorTag: class name + short code; a name or code that is not a token is dropped', () => {
    expect(errorTag(leaky('22P02'))).toEqual({ err: 'Error', code: '22P02' });
    expect(errorTag(Object.assign(leaky(), { name: 'DatabaseError', code: '23505' }))).toEqual({
      err: 'DatabaseError',
      code: '23505',
    });
    expect(errorTag(Object.assign(leaky(), { name: `Error ${FAKE_EMAIL}` }))).toEqual({
      err: 'Error',
    });
    expect(errorTag(Object.assign(leaky(), { code: FAKE_EMAIL }))).toEqual({ err: 'Error' });
    expect(errorTag(Object.assign(leaky(), { code: 12345 }))).toEqual({ err: 'Error' });
    expect(errorTag(FAKE_EMAIL)).toEqual({ err: 'error' });
    expect(errorTag(undefined)).toEqual({ err: 'error' });
  });

  it('errorText (clock refresh, J15 Nest line, api start-up line): `Name` or `Name (code)`', () => {
    expect(errorText(leaky('57P01'))).toBe('Error (57P01)');
    expect(errorText(new RangeError(FAKE_TOKEN))).toBe('RangeError');
    expect(errorText({ message: FAKE_EMAIL })).toBe('error');
  });

  it('safeCode keeps a short machine code only', () => {
    expect(safeCode('EENVELOPE:550:5.1.1')).toBe('EENVELOPE:550:5.1.1');
    expect(safeCode('HTTP_503')).toBe('HTTP_503');
    expect(safeCode(FAKE_EMAIL)).toBeUndefined();
    expect(safeCode(`550 5.1.1 <${FAKE_EMAIL}> unknown`)).toBeUndefined();
    expect(safeCode('x'.repeat(41))).toBeUndefined();
    expect(safeCode('')).toBeUndefined();
    expect(safeCode(42)).toBeUndefined();
  });

  it('adapterErrorCode (e-mail log + last_error): the mapSmtpError tag, else the code, else UNKNOWN', () => {
    // nodemailer's error quotes the SMTP reply with the recipient's address; mapSmtpError keeps the codes only.
    const smtp = mapSmtpError({
      code: 'EENVELOPE',
      responseCode: 550,
      response: `550 5.1.1 <${FAKE_EMAIL}>: Recipient address rejected`,
      message: `Can't send mail - all recipients were rejected: 550 5.1.1 <${FAKE_EMAIL}>`,
    });
    expect(adapterErrorCode(smtp)).toBe('EENVELOPE:550:5.1.1');
    expect(adapterErrorCode(new IntegrationError('UNAVAILABLE', `down ${FAKE_EMAIL}`))).toBe(
      'UNAVAILABLE',
    );
    // A duck-typed error (not from an adapter) carrying provider text: never stored as is.
    expect(
      adapterErrorCode({
        code: 'INVALID_REQUEST',
        providerMessage: `550 5.1.1 <${FAKE_EMAIL}> user unknown`,
      }),
    ).toBe('INVALID_REQUEST');
    expect(
      adapterErrorCode({ code: FAKE_EMAIL as never, providerMessage: `token=${FAKE_TOKEN}` }),
    ).toBe('UNKNOWN');
  });
});

/**
 * Reviewed uses in the worker's import graph (file → the matched text). Not logging: a branch on a library message,
 * a value hashed for a lookup key, and describeError (api ProblemFilter only – the worker never runs it). A new
 * entry needs a reason here and SEC's look (V5-42).
 */
const REVIEWED: Record<string, string[]> = {
  // sharp's pixel-limit error is recognised by its text; the message is never logged (the upload gets 422).
  'src/modules/files/public/image-pipeline.ts': ['.message'],
  // `${e}` is the normalised contact e-mail inside the keyed hash input (dedupe key), not an error.
  'src/modules/public-site/internal/website-requests.service.ts': ['${e}', '${e}'],
  // describeError: the api's ProblemFilter line (redactText of the message); src/shared/problem.ts only.
  'src/shared/redact.ts': ['.message'],
};
const RISKY =
  /\.message\b|\.stack\b|String\(\s*(?:err|e|error)\s*\)|\$\{\s*(?:err|e|error)\s*\}|JSON\.stringify\(\s*(?:err|e|error)\s*[,)]|\binspect\(/g;

describe('V5-42 – static guard over the worker process import graph', () => {
  it('no source file the worker loads prints an error message, stack or object (except the reviewed uses)', async () => {
    const { files } = await inWorkerProcess<{ files: string[] }>({ cmd: 'worker-source-files' });
    // The graph is the real one: the entrypoint, the tick, the jobs of every module.
    expect(files).toEqual(
      expect.arrayContaining([
        'src/worker.ts',
        'src/worker-loop.ts',
        'src/bootstrap.ts',
        'src/jobs/email-dispatch.ts',
        'src/jobs/chat-dispatch.ts',
        'src/modules/folio/public/folio-close-job.ts',
        'src/modules/registration/internal/retention.service.ts',
      ]),
    );
    expect(files.length).toBeGreaterThan(150);
    const found: Record<string, string[]> = {};
    for (const f of files) {
      // Comments blanked (same length), so a comment that mentions err.message is not a use.
      const src = readFileSync(join(API_DIR, f), 'utf8').replace(/\/\/.*|\/\*[\s\S]*?\*\//g, (m) =>
        m.replace(/[^\n]/g, ' '),
      );
      const hits = [...src.matchAll(RISKY)].map((m) => m[0]);
      if (hits.length > 0) found[f] = hits;
    }
    expect(found).toEqual(REVIEWED);
  }, 120_000);
});
