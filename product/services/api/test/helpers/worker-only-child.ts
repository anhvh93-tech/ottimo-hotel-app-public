/**
 * Child process for test/helpers/worker-process.ts – run with `node -r ts-node/register/transpile-only`.
 *
 * It loads what a process entrypoint loads and NOTHING from the tests (no feature app, no fixture), so the audit
 * allowlist registry and every module-level state are exactly those of that process. A Vitest worker cannot give
 * this: the integration tests start the Nest app (all `*.module.ts`) in the same process, which hid the missing
 * allowlists of the worker until staging (OPS j15-folio-close-check 10.2, BUG-R3-037 test (b)).
 *
 * argv[2] = JSON command:
 * - `{ "cmd": "audit-registry", "load": "worker" }` – import src/worker-jobs.ts (what src/worker.ts imports) and
 *   build the job list; `"load": "api"` – import what src/main.ts imports (AppModule + feature modules).
 * - `{ "cmd": "run-job", "key", "propertyId", "now" }` – the worker's composition (buildWorkerJobs) and JobRunner on
 *   DATABASE_URL, fixed clock `now`: `runOnce(key)` for that property only (other test files share the database).
 * - `{ "cmd": "run-chat", "propertyId", "now", "jobs"?, "chatEnv"?, "fakeUrl"? }` – Google Chat: worker composition +
 *   buildWorkerChat (src/worker-chat.ts), jobs then one dispatcher run, posts to a local fake webhook.
 * Prints ONE line `RESULT <json>`; fake data only, no secret in the output.
 */
import 'reflect-metadata';

const PREFIX = 'RESULT ';

/**
 * CommonJS `require` on purpose: what is loaded depends on the command (a static import would load the api modules
 * in the worker run), and ts-node keeps a dynamic `import()` as native ESM, which cannot resolve the .ts sources.
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const load = <T>(path: string): T => require(path) as T;

function loadedModuleFiles(): string[] {
  return Object.keys(require.cache)
    .filter((f) => /\.module\.ts$/.test(f))
    .map((f) => f.replace(/^.*\/src\//, 'src/'))
    .sort();
}

async function main(): Promise<unknown> {
  const cmd = JSON.parse(process.argv[2] ?? '{}') as Record<string, string>;
  const env: NodeJS.ProcessEnv = { ...process.env, APP_ENV: 'test', BLOBSTORE_PROVIDER: 'memory' };

  if (cmd.cmd === 'audit-registry') {
    if (cmd.load === 'worker') {
      const { buildWorkerJobs } =
        load<typeof import('../../src/worker-jobs')>('../../src/worker-jobs');
      const { FixedClock } = load<typeof import('../../src/clock')>('../../src/clock');
      // Built like src/worker.ts (no database call at build time).
      const jobs = buildWorkerJobs({
        clock: new FixedClock(new Date('2026-11-02T00:00:00Z')),
        database: {} as never,
        env,
      });
      const { auditEntitySnapshot } = load<
        typeof import('../../src/modules/audit/public/audit-fields')
      >('../../src/modules/audit/public/audit-fields');
      return {
        registry: auditEntitySnapshot(),
        jobs: jobs.registry.keys(),
        moduleFiles: loadedModuleFiles(),
      };
    }
    if (cmd.load === 'api') {
      load<typeof import('../../src/app.module')>('../../src/app.module');
      load<typeof import('../../src/modules/feature-modules')>('../../src/modules/feature-modules');
      const { auditEntitySnapshot } = load<
        typeof import('../../src/modules/audit/public/audit-fields')
      >('../../src/modules/audit/public/audit-fields');
      return { registry: auditEntitySnapshot(), moduleFiles: loadedModuleFiles() };
    }
    throw new Error(`unknown load ${cmd.load}`);
  }

  if (cmd.cmd === 'run-job') {
    const { buildWorkerJobs } =
      load<typeof import('../../src/worker-jobs')>('../../src/worker-jobs');
    const { FixedClock } = load<typeof import('../../src/clock')>('../../src/clock');
    const { JobRunner } = load<typeof import('../../src/jobs/job-runner')>(
      '../../src/jobs/job-runner',
    );
    const { createPool } = load<typeof import('../../src/db/pool')>('../../src/db/pool');
    const { Database } = load<typeof import('../../src/db/database')>('../../src/db/database');
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL missing');
    const database = new Database(createPool(url));
    try {
      const clock = new FixedClock(new Date(cmd.now!));
      const { registry, parameters } = buildWorkerJobs({ clock, database, env });
      const runner = new JobRunner(database, clock, registry, parameters);
      const property = (await runner.listProperties()).find((p) => p.propertyId === cmd.propertyId);
      if (!property) throw new Error('property not found');
      // Errors the jobs log with Nest's Logger (J15 per folio) are collected so the test can show them.
      const errors: string[] = [];
      const { Logger } = load<typeof import('@nestjs/common')>('@nestjs/common');
      Logger.overrideLogger({
        log: () => undefined,
        warn: () => undefined,
        debug: () => undefined,
        verbose: () => undefined,
        error: (m: unknown) => {
          errors.push(String(m));
        },
      });
      try {
        const out = await runner.runOnce(cmd.key!, property);
        return { ok: true, stats: out.stats, errors, moduleFiles: loadedModuleFiles() };
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? `${err.name}: ${err.message}` : String(err),
          errors,
          moduleFiles: loadedModuleFiles(),
        };
      }
    } finally {
      await database.close();
    }
  }
  if (cmd.cmd === 'run-chat') {
    // Google Chat (ARC gchat-booking-request-notify 5.2 tests 7–8): the worker's composition (buildWorkerJobs +
    // buildWorkerChat, as src/worker.ts) on DATABASE_URL. `chatEnv` = the worker variables (BOOKING_REQUEST_CHAT_*,
    // *_FILE resolved like bootstrap); `jobs` run first (runOnce, this property); then ONE dispatcher run. Posts go to
    // `fakeUrl` (a local fake webhook) – never to Google. Returns the log lines the composition wrote.
    const { buildWorkerJobs } =
      load<typeof import('../../src/worker-jobs')>('../../src/worker-jobs');
    const { buildWorkerChat } =
      load<typeof import('../../src/worker-chat')>('../../src/worker-chat');
    const { resolveFileSecrets } = load<typeof import('../../src/config')>('../../src/config');
    const { postChatText } = load<typeof import('@ottimo/integrations/notification')>(
      '@ottimo/integrations/notification',
    );
    const { FixedClock } = load<typeof import('../../src/clock')>('../../src/clock');
    const { JobRunner } = load<typeof import('../../src/jobs/job-runner')>(
      '../../src/jobs/job-runner',
    );
    const { createPool } = load<typeof import('../../src/db/pool')>('../../src/db/pool');
    const { Database } = load<typeof import('../../src/db/database')>('../../src/db/database');
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL missing');
    const database = new Database(createPool(url));
    const c = cmd as unknown as {
      propertyId: string;
      now: string;
      jobs?: string[];
      chatEnv?: Record<string, string>;
      fakeUrl?: string;
    };
    try {
      const clock = new FixedClock(new Date(c.now));
      const { registry, parameters } = buildWorkerJobs({ clock, database, env });
      const runner = new JobRunner(database, clock, registry, parameters);
      const property = (await runner.listProperties()).find((p) => p.propertyId === c.propertyId);
      if (!property) throw new Error('property not found');
      const logs: Array<{ level: string; msg: string; extra: Record<string, unknown> }> = [];
      const chatEnv = resolveFileSecrets({ ...(c.chatEnv ?? {}) });
      const fakeUrl = c.fakeUrl;
      const chat = buildWorkerChat({
        database,
        clock,
        env: chatEnv,
        appEnv: 'test',
        parameters,
        log: (level, msg, extra) => logs.push({ level, msg, extra }),
        ...(fakeUrl ? { post: (_u, text, o) => postChatText(fakeUrl, text, o) } : {}),
      });
      const jobs: Record<string, unknown> = {};
      for (const key of c.jobs ?? []) {
        const out = await runner.runOnce(key, property);
        jobs[key] = { status: out.status, stats: out.stats };
      }
      const stats = await chat.dispatcher.runForProperty(property);
      return {
        ok: true,
        mode: chat.config.target.mode,
        jobs,
        stats,
        logs,
        moduleFiles: loadedModuleFiles(),
      };
    } finally {
      await database.close();
    }
  }
  throw new Error(`unknown cmd ${cmd.cmd}`);
}

main()
  .then((r) => {
    process.stdout.write(`\n${PREFIX}${JSON.stringify(r)}\n`);
    process.exit(0);
  })
  .catch((err: unknown) => {
    process.stdout.write(
      `\n${PREFIX}${JSON.stringify({ fatal: err instanceof Error ? `${err.name}: ${err.message}` : String(err) })}\n`,
    );
    process.exit(1);
  });
