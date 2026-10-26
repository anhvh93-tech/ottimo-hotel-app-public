// STAGING ONLY (R3 B1, G7-4): add ONE `owner` account to the existing staging property, for the investor's trial
// sign-in (never `qa.*`). Same rules as the production bootstrap's first owner (admin/production-bootstrap.ts):
// random 24-character temporary password (V-10 policy), must_change_password, 2FA enrolment forced at first sign-in by
// MFA_ENFORCED (SEC 06.4), audit security `user.created_by_operator` (operator name only – never the password).
// Not in the image and not on the server: piped from the Mac into the RUNNING staging api container (`exec`, not
// `run`: exec output is not kept by the docker log driver):
//   [ -t 1 ] && ssh -i ~/.ssh/ottimo_ops ottimo-admin@<IP> 'cd /tmp && sudo -u ottimo /opt/ottimo/infra/server/bin/dc \
//     exec -T -e ADD_OWNER_USERNAME=inv.owner -e ADD_OWNER_NAME="…" -e ADD_OWNER_OPERATOR="…" [-e ADD_OWNER_DRY_RUN=1] \
//     api node --input-type=module -' < product/infra/server/staging-add-owner.mjs
// ADD_OWNER_DRY_RUN=1: every check + the inserts inside a transaction that is ROLLED BACK; no password is printed.
// Refuses: APP_ENV other than staging, MFA_ENFORCED not true, not exactly one active property, username taken.
// Output: one status line; on a real run also the temporary password, ONCE, to the operator's terminal.
// Exit 0 ok, 2 refused, 1 error.
import { createRequire } from 'node:module';

const require = createRequire(`${process.cwd()}/`);
const { resolveFileSecrets } = require('./dist/config.js');
const { SystemClock } = require('./dist/clock.js');
const { Database } = require('./dist/db/database.js');
const { createPool } = require('./dist/db/pool.js');
const { assertSafeDbRole } = require('./dist/db/startup-checks.js');
const { temporaryPassword } = require('./dist/admin/production-bootstrap.js');
const { hashPassword } = require('./dist/modules/identity/public/passwords.js');
const { AuditService } = require('./dist/modules/audit/public/audit.service.js');
const { v7: uuidv7 } = require('uuid');

const refuse = (msg) => {
  console.error(`staging-add-owner: refused (${msg})`);
  process.exit(2);
};

const env = resolveFileSecrets(process.env);
if ((env.APP_ENV ?? '').trim() !== 'staging') refuse('APP_ENV is not staging');
if ((env.MFA_ENFORCED ?? '').trim() !== 'true') refuse('MFA_ENFORCED is not true');
const username = (env.ADD_OWNER_USERNAME ?? '').trim().toLowerCase();
const displayName = (env.ADD_OWNER_NAME ?? '').trim();
const operator = (env.ADD_OWNER_OPERATOR ?? '').trim();
const dryRun = (env.ADD_OWNER_DRY_RUN ?? '') === '1';
if (!/^[a-z0-9][a-z0-9._-]{2,63}$/.test(username))
  refuse('ADD_OWNER_USERNAME: 3–64 of a-z 0-9 . _ -');
if (username.startsWith('qa.')) refuse('qa.* names belong to QA');
if (displayName.length < 1 || displayName.length > 100)
  refuse('ADD_OWNER_NAME is required (≤ 100)');
if (operator.length < 1 || operator.length > 100) refuse('ADD_OWNER_OPERATOR is required (≤ 100)');

class DryRunRollback extends Error {}

const pool = createPool(env.DATABASE_URL ?? '', { max: 2 });
let code = 0;
try {
  await assertSafeDbRole(pool);
  const db = new Database(pool);
  const found = await db.entry(async (tx) => {
    const p = await tx.query('SELECT property_id, organization_id FROM worker_list_properties()');
    const u = await tx.query('SELECT user_id FROM auth_find_user($1)', [username]);
    return { properties: p.rows, taken: u.rows.length > 0 };
  });
  if (found.properties.length !== 1)
    refuse(`expected 1 active property, found ${found.properties.length}`);
  if (found.taken) refuse('username already exists');
  const { property_id: propertyId, organization_id: organizationId } = found.properties[0];

  const clock = new SystemClock();
  const password = temporaryPassword(username);
  const passwordHash = await hashPassword(password);
  const userId = uuidv7();
  const now = clock.now();
  const audit = new AuditService(clock, db);
  const ctx = { organizationId, propertyId, userId: null, actorType: 'system' };
  try {
    await db.withContext(ctx, async (tx) => {
      await tx.query(
        `INSERT INTO app_user (id, organization_id, username, display_name, password_hash, status,
           must_change_password, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, 'active', true, $6, $6)`,
        [userId, organizationId, username, displayName, passwordHash, now],
      );
      await tx.query(
        `INSERT INTO user_property_role (user_id, property_id, organization_id, role, granted_at)
         VALUES ($1, $2, $3, 'owner', $4)`,
        [userId, propertyId, organizationId, now],
      );
      await audit.record(tx, {
        category: 'security',
        action: 'user.created_by_operator',
        entityType: 'app_user',
        entityId: userId,
        reason: `staging trial owner – temporary password, must change; operator: ${operator}`,
      });
      if (dryRun) throw new DryRunRollback();
    });
  } catch (err) {
    if (!(err instanceof DryRunRollback)) throw err;
    console.log(
      'staging-add-owner: dry-run ok (checks and inserts passed, rolled back – nothing written)',
    );
  }
  if (!dryRun) {
    process.stdout.write(
      [
        'staging-add-owner: done (role owner, must change password, 2FA enrolment at first sign-in)',
        '',
        '  Temporary password (shown ONCE – type it into desk.staging.ottimo.vn, then run `clear`):',
        `    ${password}`,
        '',
      ].join('\n'),
    );
  }
} catch (err) {
  console.error(
    `staging-add-owner: failed (${err instanceof Error ? `${err.name}: ${err.message}` : 'error'})`,
  );
  code = 1;
} finally {
  await pool.end();
}
process.exit(code);
