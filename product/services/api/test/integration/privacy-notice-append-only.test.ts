/**
 * Migration 0090 – `privacy_notice_version` is append-only for every role, ottimo_owner included (SEC
 * FB-R3-SEC-ARC-PN-01; ARC-on-OPS-us155-enable "Trả lời OPS" 1). Runs as ottimo_owner (the migrator's SET ROLE,
 * like OPS publish-privacy-notice). Fake hashes only.
 */
import { Client as PgClient } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
import { HAS_DB, type TestTenant, appDatabase, createTenant } from '../helpers/tenant';

describe.skipIf(!HAS_DB)('privacy_notice_version append-only (0090)', () => {
  let db: Database;
  let t: TestTenant;

  /** One statement as ottimo_owner in the organisation context (rolled back on error). */
  async function asOwner(sql: string, params: unknown[] = []): Promise<number> {
    const pg = new PgClient({ connectionString: process.env.MIGRATION_DATABASE_URL });
    await pg.connect();
    try {
      await pg.query('BEGIN');
      await pg.query('SET LOCAL ROLE ottimo_owner');
      await pg.query(`SELECT set_config('app.organization_id', $1, true)`, [t.organizationId]);
      const r = await pg.query(sql, params);
      await pg.query('COMMIT');
      return r.rowCount ?? 0;
    } catch (e) {
      await pg.query('ROLLBACK');
      throw e;
    } finally {
      await pg.end();
    }
  }
  const insert = (version: string) =>
    asOwner(
      `INSERT INTO privacy_notice_version (organization_id, version, locale, body_sha256, url_path, published_at)
       VALUES ($1, $2, 'vi', $3, '/vi/privacy/', '2026-10-24T00:00:00Z')`,
      [t.organizationId, version, 'd'.repeat(64)],
    );
  const where = `WHERE organization_id = $1 AND version = $2 AND locale = 'vi'`;

  beforeAll(async () => {
    db = appDatabase(2);
    t = await createTenant(db);
    await insert('2026-10-24');
    await insert('2026-10-31');
  });
  afterAll(async () => {
    await db?.close();
  });

  it('setting superseded_at once is allowed (what publish-privacy-notice does for the next version)', async () => {
    expect(
      await asOwner(
        `UPDATE privacy_notice_version SET superseded_at = now() ${where} AND superseded_at IS NULL`,
        [t.organizationId, '2026-10-24'],
      ),
    ).toBe(1);
  });

  it.each([
    [
      'set superseded_at a second time',
      `UPDATE privacy_notice_version SET superseded_at = now() ${where}`,
      '2026-10-24',
    ],
    [
      'clear superseded_at',
      `UPDATE privacy_notice_version SET superseded_at = NULL ${where}`,
      '2026-10-24',
    ],
    [
      'change the hash',
      `UPDATE privacy_notice_version SET body_sha256 = repeat('e', 64) ${where}`,
      '2026-10-31',
    ],
    [
      'supersede AND change the hash',
      `UPDATE privacy_notice_version SET superseded_at = now(), body_sha256 = repeat('e', 64) ${where}`,
      '2026-10-31',
    ],
    [
      'change published_at',
      `UPDATE privacy_notice_version SET published_at = now() ${where}`,
      '2026-10-31',
    ],
    ['delete', `DELETE FROM privacy_notice_version ${where}`, '2026-10-31'],
  ])('%s → refused (check_violation), even as ottimo_owner', async (_n, sql, version) => {
    await expect(asOwner(sql, [t.organizationId, version])).rejects.toThrow(
      /privacy_notice_version is append-only/,
    );
  });

  // No TRUNCATE on the shared test database (the FK from website_booking_request refuses it first anyway): the
  // statement trigger is checked in the catalogue.
  it('the row trigger (UPDATE, DELETE) and the TRUNCATE trigger exist', async () => {
    const rows = (
      await db.withContext(t.ctx(), (tx) =>
        tx.query<{ tgname: string }>(
          `SELECT tgname FROM pg_trigger
            WHERE tgrelid = 'privacy_notice_version'::regclass AND NOT tgisinternal ORDER BY tgname`,
        ),
      )
    ).rows.map((r) => r.tgname);
    expect(rows).toEqual([
      'privacy_notice_version_append_only',
      'privacy_notice_version_no_truncate',
    ]);
  });
});
