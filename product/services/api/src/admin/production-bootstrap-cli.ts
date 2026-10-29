/**
 * Admin command (R3-OPS-02, no HTTP endpoint): one-time initialisation of an EMPTY production database –
 * organisation, property OTTIMO Đà Lạt, 10 units, channels, BR section 13 parameters and the first owner.
 * Run by OPS inside the api container after `migrate` (wrapper: scripts/production-bootstrap.sh):
 *   node dist/admin/production-bootstrap-cli.js --owner-username <u> --owner-name "<display name>" --operator <who>
 * - Needs an interactive terminal: the owner's temporary password is printed ONCE to it and never written to a
 *   log or a file (refused when stdout is not a TTY – `docker compose exec` without -T allocates one).
 * - Refuses a database that already holds a property (second run) – nothing is written.
 * - APP_ENV=production also requires MFA_ENFORCED=true (the owner must enrol 2FA at the first sign-in).
 * Uses DATABASE_URL (ottimo_app).
 */
import { SystemClock } from '../clock';
import { resolveFileSecrets } from '../config';
import { Database } from '../db/database';
import { createPool } from '../db/pool';
import { assertSafeDbRole } from '../db/startup-checks';
import { BootstrapRefusedError, bootstrapProduction } from './production-bootstrap';
// Every audit allowlist, as in the api (`dataset` rooms/channels are the platform module's – without them the
// `production.bootstrapped` audit kept users/parameters/devices only).
import '../audit-entities';

function arg(name: string): string {
  const i = process.argv.indexOf(`--${name}`);
  const v = i >= 0 ? process.argv[i + 1] : undefined;
  if (!v) throw new Error(`--${name} is required`);
  return v;
}

async function main(): Promise<void> {
  const env = resolveFileSecrets(process.env);
  if (!process.stdout.isTTY) {
    throw new Error(
      'run it from an interactive terminal (the temporary password is shown once, never logged)',
    );
  }
  if (env.APP_ENV === 'production' && (env.MFA_ENFORCED ?? '').trim() !== 'true') {
    throw new Error('APP_ENV=production needs MFA_ENFORCED=true before the first owner is created');
  }
  const url = env.DATABASE_URL ?? '';
  if (!url) throw new Error('DATABASE_URL is required');
  const pool = createPool(url, { max: 2 });
  try {
    await assertSafeDbRole(pool);
    const out = await bootstrapProduction(new Database(pool), {
      ownerUsername: arg('owner-username'),
      ownerDisplayName: arg('owner-name'),
      operator: arg('operator'),
      clock: new SystemClock(),
    });
    process.stdout.write(
      [
        'OTTIMO production bootstrap: done',
        `  rooms ${out.rooms} · room groups ${out.roomGroups} · channels ${out.channels} · parameters ${out.parameters}`,
        '',
        '  Temporary password of the first owner (shown ONCE – hand it over in person, then clear the screen):',
        `    ${out.temporaryPassword}`,
        '',
        '  First sign-in: change the password, then enrol two-step sign-in and store the 10 recovery codes.',
        '  Then enter in the app: room prices, OTA base rates, VietQR receiving account, Wi-Fi password.',
        '',
      ].join('\n'),
    );
  } finally {
    await pool.end();
  }
}

main().catch((err: unknown) => {
  const refused = err instanceof BootstrapRefusedError;
  console.error(
    refused
      ? `refused: ${err.message}`
      : err instanceof Error
        ? `${err.name}: ${err.message}`
        : 'failed',
  );
  process.exit(refused ? 2 : 1);
});
