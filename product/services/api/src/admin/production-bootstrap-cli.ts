/**
 * Admin command (R3-OPS-02, no HTTP endpoint): one-time initialisation of an EMPTY production database –
 * organisation, property OTTIMO Đà Lạt, 10 units, channels, BR section 13 parameters and the first owner.
 * Run by OPS inside the api container after `migrate` (wrapper: scripts/production-bootstrap.sh):
 *   node dist/admin/production-bootstrap-cli.js --owner-username <u> --owner-name "<display name>" --operator <who>
 * - Needs an interactive terminal: the owner's temporary password is printed ONCE to it and never written to a
 *   log or a file (refused when stdout is not a TTY – `docker compose exec` without -T allocates one).
 * - Refuses a database that already holds a property (second run) – nothing is written.
 * - APP_ENV=production also requires MFA_ENFORCED=true (the owner must enrol 2FA at the first sign-in).
 * - V3-04 (v1.0.4): `--owner-email` (a flag, NO value) asks for the first owner's security e-mail at a hidden
 *   prompt (no echo – the address never lands in the shell history, the terminal scroll-back or `ps`). Enter alone =
 *   none (the owner enters it on Desk). A value after the flag is refused. Same rules as setMyEmail.
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

/** `--owner-email` given as a flag (and nothing that looks like a value after it)? */
export function ownerEmailFlag(argv: readonly string[]): boolean {
  // SEC FB-R4-SEC-BE-V104-03: `--owner-email=<address>` must fail loudly (exit 2), never be ignored – the address is
  // already in the shell history and `ps`. The message never repeats the value.
  if (argv.some((a) => a.startsWith('--owner-email='))) {
    throw new BootstrapRefusedError(
      '--owner-email takes no value (the address is asked at a hidden prompt); remove that line from the shell history',
    );
  }
  const i = argv.indexOf('--owner-email');
  if (i < 0) return false;
  const next = argv[i + 1];
  if (next !== undefined && !next.startsWith('--')) {
    throw new BootstrapRefusedError(
      '--owner-email takes no value (the address is asked at a hidden prompt); remove that line from the shell history',
    );
  }
  return true;
}

/** One line from a TTY without echo (raw mode). Ctrl-C aborts; Backspace edits; Enter ends. */
export function readHidden(
  prompt: string,
  input: NodeJS.ReadStream = process.stdin,
  output: NodeJS.WriteStream = process.stdout,
): Promise<string> {
  if (!input.isTTY) {
    return Promise.reject(new Error('--owner-email needs an interactive terminal'));
  }
  output.write(prompt);
  return new Promise((resolve, reject) => {
    let value = '';
    const done = (err: Error | null) => {
      input.setRawMode(false);
      input.pause();
      input.removeListener('data', onData);
      output.write('\n');
      if (err) reject(err);
      else resolve(value);
    };
    const onData = (chunk: Buffer) => {
      for (const ch of chunk.toString('utf8')) {
        if (ch === '\r' || ch === '\n') return done(null);
        if (ch === '\u0003') return done(new Error('aborted'));
        if (ch === '\u007f' || ch === '\b') value = value.slice(0, -1);
        else if (ch >= ' ') value += ch;
      }
    };
    input.setRawMode(true);
    input.resume();
    input.on('data', onData);
  });
}

function arg(name: string): string {
  const i = process.argv.indexOf(`--${name}`);
  const v = i >= 0 ? process.argv[i + 1] : undefined;
  if (!v) throw new Error(`--${name} is required`);
  return v;
}

async function main(): Promise<void> {
  // First, before anything else: a refused `--owner-email=<value>` must stop the command (exit 2).
  const wantsOwnerEmail = ownerEmailFlag(process.argv);
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
  const ownerEmail = wantsOwnerEmail
    ? await readHidden('Owner security e-mail (hidden; Enter = none, set it on Desk later): ')
    : null;
  const pool = createPool(url, { max: 2 });
  try {
    await assertSafeDbRole(pool);
    const out = await bootstrapProduction(new Database(pool), {
      ownerUsername: arg('owner-username'),
      ownerDisplayName: arg('owner-name'),
      operator: arg('operator'),
      clock: new SystemClock(),
      ownerEmail,
      sharedMailboxes: {
        sharedMailboxes: env.EMAIL_SHARED_MAILBOXES,
        emailFrom: env.EMAIL_FROM,
      },
    });
    process.stdout.write(
      [
        'OTTIMO production bootstrap: done',
        `  owner security e-mail: ${ownerEmail?.trim() ? 'set' : 'not set (enter it on Desk)'}`,
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

// Imported by a test (ownerEmailFlag / readHidden) → do not run.
if (require.main === module) {
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
}
