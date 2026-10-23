/**
 * Admin command (SEC 06.33, no HTTP endpoint): reset the 2FA of a user who lost the phone AND the recovery
 * codes when no other owner can do it. Run by OPS inside the api container, only after the off-repo identity
 * verification procedure approved by SEC:
 *   node dist/admin/mfa-operator-reset-cli.js --username <u> --operator <who> --ticket <ref> --reason "<text>"
 * (wrapper: scripts/mfa-operator-reset.sh). Uses DATABASE_URL (ottimo_app) and the crypto keys of the api.
 * Prints only ok/failed – never a username, a secret or a URL.
 */
import { SystemClock } from '../clock';
import { resolveFileSecrets } from '../config';
import { Database } from '../db/database';
import { createPool } from '../db/pool';
import { cryptoServiceFromEnv } from '../modules/crypto/public/factory';
import { resetMfaByOperator } from '../modules/identity/public/operator-reset';

function arg(name: string): string {
  const i = process.argv.indexOf(`--${name}`);
  const v = i >= 0 ? process.argv[i + 1] : undefined;
  if (!v) throw new Error(`--${name} is required`);
  return v;
}

async function main(): Promise<void> {
  const env = resolveFileSecrets(process.env);
  const url = env.DATABASE_URL ?? '';
  if (!url) throw new Error('DATABASE_URL is required');
  const clock = new SystemClock();
  const pool = createPool(url, { max: 2 });
  try {
    const out = await resetMfaByOperator(new Database(pool), {
      username: arg('username'),
      operator: arg('operator'),
      ticketRef: arg('ticket'),
      reason: arg('reason'),
      clock,
      crypto: cryptoServiceFromEnv(env, clock),
    });
    console.log(JSON.stringify({ level: 'info', msg: 'mfa operator reset', reset: out.reset }));
  } finally {
    await pool.end();
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? `${err.name}: ${err.message}` : 'failed');
  process.exit(1);
});
