/**
 * Runs test/helpers/worker-only-child.ts in a NEW Node process (ts-node, transpile only) – a process that loads
 * only what the worker entrypoint loads, unlike the Vitest worker that also holds the Nest app of other tests.
 */
import { execFile } from 'node:child_process';
import { join } from 'node:path';

const API_DIR = join(__dirname, '..', '..');
const CHILD = join(__dirname, 'worker-only-child.ts');

export async function inWorkerProcess<T = Record<string, unknown>>(
  cmd: Record<string, unknown>,
  env: NodeJS.ProcessEnv = {},
): Promise<T> {
  const stdout = await new Promise<string>((resolve, reject) => {
    execFile(
      process.execPath,
      ['-r', 'ts-node/register/transpile-only', CHILD, JSON.stringify(cmd)],
      {
        cwd: API_DIR,
        env: { ...process.env, ...env, TS_NODE_PROJECT: join(API_DIR, 'tsconfig.json') },
        timeout: 120_000,
        maxBuffer: 16 * 1024 * 1024,
      },
      // A non-zero exit still prints its RESULT line (fatal) – parsed below.
      (err, out, errOut) => {
        if (err && !out.includes('RESULT ')) reject(new Error(`${err.message}\n${errOut}`));
        else resolve(out);
      },
    );
  });
  const line = stdout
    .split('\n')
    .reverse()
    .find((l) => l.startsWith('RESULT '));
  if (!line) throw new Error(`no RESULT line from the worker process:\n${stdout}`);
  const parsed = JSON.parse(line.slice('RESULT '.length)) as T & { fatal?: string };
  if (parsed.fatal) throw new Error(`worker process failed: ${parsed.fatal}`);
  return parsed;
}
