/**
 * Migrations 0090 + 0095 – `privacy_notice_version` is append-only for every role, ottimo_owner included, at the DML
 * level (SEC FB-R3-SEC-ARC-PN-01; ARC-on-OPS-us155-enable "Trả lời OPS" 1). 0095 (v1.0.4 P4-13): whole row compared
 * except superseded_at (ARC PR29-01), superseded_at within [published_at, now()] (ARC PR29-02, SEC PN01-03),
 * tgenabled = 'O' and ottimo_app SELECT only pinned in CI (SEC PN01-01). Runs as ottimo_owner (the migrator's SET
 * ROLE, like OPS publish-privacy-notice). Fake hashes only.
 */
import { Client as PgClient } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
import { HAS_DB, type TestTenant, appDatabase, createTenant } from '../helpers/tenant';

const REFUSED = /privacy_notice_version is append-only/;

describe.skipIf(!HAS_DB)('privacy_notice_version append-only (0090, 0095)', () => {
  let db: Database;
  let t: TestTenant;

  /** Statements as ottimo_owner in the organisation context, one transaction (rolled back on error or on demand). */
  async function asOwnerTx(
    statements: [string, unknown[]][],
    { rollback = false } = {},
  ): Promise<number[]> {
    const pg = new PgClient({ connectionString: process.env.MIGRATION_DATABASE_URL });
    await pg.connect();
    try {
      await pg.query('BEGIN');
      await pg.query('SET LOCAL ROLE ottimo_owner');
      await pg.query(`SELECT set_config('app.organization_id', $1, true)`, [t.organizationId]);
      const counts: number[] = [];
      for (const [sql, params] of statements)
        counts.push((await pg.query(sql, params)).rowCount ?? 0);
      await pg.query(rollback ? 'ROLLBACK' : 'COMMIT');
      return counts;
    } catch (e) {
      await pg.query('ROLLBACK');
      throw e;
    } finally {
      await pg.end();
    }
  }
  const asOwner = async (sql: string, params: unknown[] = []): Promise<number> =>
    (await asOwnerTx([[sql, params]]))[0]!;

  const INSERT = `INSERT INTO privacy_notice_version (organization_id, version, locale, body_sha256, url_path, published_at)
       VALUES ($1, $2, 'vi', $3, '/vi/privacy/', $4)`;
  const insert = (version: string, publishedAt = '2026-10-24T00:00:00Z') =>
    asOwner(INSERT, [t.organizationId, version, 'd'.repeat(64), publishedAt]);
  const where = `WHERE organization_id = $1 AND version = $2 AND locale = 'vi'`;

  beforeAll(async () => {
    db = appDatabase(2);
    t = await createTenant(db);
    await insert('2026-10-24');
    await insert('2026-10-31');
    await insert('2026-11-01');
    await insert('2026-11-02');
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

  it('superseded_at = published_at is allowed (lower bound inclusive)', async () => {
    expect(
      await asOwner(
        `UPDATE privacy_notice_version SET superseded_at = published_at ${where} AND superseded_at IS NULL`,
        [t.organizationId, '2026-11-02'],
      ),
    ).toBe(1);
  });

  it('publish-privacy-notice pattern: INSERT the next version with published_at = now() and supersede the previous one with now(), one transaction', async () => {
    const counts = await asOwnerTx(
      [
        [
          `INSERT INTO privacy_notice_version (organization_id, version, locale, body_sha256, url_path, published_at)
           VALUES ($1, '2026-11-04', 'vi', $2, '/vi/privacy/', now())`,
          [t.organizationId, 'f'.repeat(64)],
        ],
        [
          `UPDATE privacy_notice_version SET superseded_at = now()
            WHERE organization_id = $1 AND locale = 'vi' AND version <> '2026-11-04' AND superseded_at IS NULL
           RETURNING version`,
          [t.organizationId],
        ],
      ],
      { rollback: true },
    );
    // 2026-10-31 and 2026-11-01 were still active
    expect(counts).toEqual([1, 2]);
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
      'change published_at',
      `UPDATE privacy_notice_version SET published_at = now() ${where}`,
      '2026-10-31',
    ],
    // 0095 (ARC PR29-02, SEC PN01-03): superseded_at outside [published_at, now()]
    [
      'supersede in the future (would keep the old text inside the 7-day grace window for ever)',
      `UPDATE privacy_notice_version SET superseded_at = now() + interval '1 day' ${where}`,
      '2026-10-31',
    ],
    [
      'supersede one second after now()',
      `UPDATE privacy_notice_version SET superseded_at = now() + interval '1 second' ${where}`,
      '2026-10-31',
    ],
    [
      'supersede with clock_timestamp() (later than the transaction start)',
      `UPDATE privacy_notice_version SET superseded_at = clock_timestamp() ${where}`,
      '2026-10-31',
    ],
    [
      'supersede before published_at',
      `UPDATE privacy_notice_version SET superseded_at = published_at - interval '1 second' ${where}`,
      '2026-10-31',
    ],
    // 0095 (ARC PR29-01): supersede AND change any other column – whole row compared
    [
      'supersede AND change the hash',
      `UPDATE privacy_notice_version SET superseded_at = now(), body_sha256 = repeat('e', 64) ${where}`,
      '2026-10-31',
    ],
    [
      'supersede AND change url_path',
      `UPDATE privacy_notice_version SET superseded_at = now(), url_path = '/vi/privacy/x/' ${where}`,
      '2026-10-31',
    ],
    [
      'supersede AND change published_at',
      `UPDATE privacy_notice_version SET superseded_at = now(), published_at = published_at - interval '1 day' ${where}`,
      '2026-10-31',
    ],
    [
      'supersede AND change version',
      `UPDATE privacy_notice_version SET superseded_at = now(), version = '2026-10-30' ${where}`,
      '2026-10-31',
    ],
    [
      'supersede AND change locale',
      `UPDATE privacy_notice_version SET superseded_at = now(), locale = 'en' ${where}`,
      '2026-10-31',
    ],
    [
      'supersede AND change organization_id',
      `UPDATE privacy_notice_version SET superseded_at = now(), organization_id = gen_random_uuid() ${where}`,
      '2026-10-31',
    ],
    ['delete', `DELETE FROM privacy_notice_version ${where}`, '2026-10-31'],
  ])('%s → refused (check_violation), even as ottimo_owner', async (_n, sql, version) => {
    // Rolled back even if it passed: every case is independent (a too-lax body fails each one, not only the first).
    await expect(
      asOwnerTx([[sql, [t.organizationId, version]]], { rollback: true }),
    ).rejects.toMatchObject({
      code: '23514',
      message: expect.stringMatching(REFUSED),
    });
  });

  it('refused rows are unchanged', async () => {
    const pg = new PgClient({ connectionString: process.env.MIGRATION_DATABASE_URL });
    await pg.connect();
    try {
      await pg.query('BEGIN');
      await pg.query('SET LOCAL ROLE ottimo_owner');
      await pg.query(`SELECT set_config('app.organization_id', $1, true)`, [t.organizationId]);
      const r = await pg.query<{ version: string; body_sha256: string; superseded: boolean }>(
        `SELECT version, body_sha256, superseded_at IS NOT NULL AS superseded FROM privacy_notice_version
          WHERE organization_id = $1 ORDER BY version`,
        [t.organizationId],
      );
      await pg.query('COMMIT');
      expect(r.rows).toEqual([
        { version: '2026-10-24', body_sha256: 'd'.repeat(64), superseded: true },
        { version: '2026-10-31', body_sha256: 'd'.repeat(64), superseded: false },
        { version: '2026-11-01', body_sha256: 'd'.repeat(64), superseded: false },
        { version: '2026-11-02', body_sha256: 'd'.repeat(64), superseded: true },
      ]);
    } finally {
      await pg.end();
    }
  });

  // ARC PR29-01: a column added later is covered without editing the function – shown on a temporary copy of the
  // table with one extra column (rolled back). The 0090 body (6 columns by hand) let this UPDATE through.
  it('a column added later is compared too (temporary copy + extra column, rolled back)', async () => {
    const copy: [string, unknown[]][] = [
      [`CREATE TEMP TABLE pnv_wide (LIKE privacy_notice_version, extra text) ON COMMIT DROP`, []],
      [
        `CREATE TRIGGER pnv_wide_append_only BEFORE UPDATE OR DELETE ON pnv_wide
           FOR EACH ROW EXECUTE FUNCTION privacy_notice_version_append_only()`,
        [],
      ],
      [
        `INSERT INTO pnv_wide (organization_id, version, locale, body_sha256, url_path, published_at, extra)
         VALUES ($1, '2026-10-24', 'vi', repeat('d', 64), '/vi/privacy/', '2026-10-24T00:00:00Z', 'a')`,
        [t.organizationId],
      ],
    ];
    await expect(
      asOwnerTx([...copy, [`UPDATE pnv_wide SET superseded_at = now(), extra = 'b'`, []]], {
        rollback: true,
      }),
    ).rejects.toThrow(REFUSED);
    expect(
      await asOwnerTx([...copy, [`UPDATE pnv_wide SET superseded_at = now()`, []]], {
        rollback: true,
      }),
    ).toEqual([0, 0, 1, 1]);
  });

  // No TRUNCATE on the shared test database (the FK from website_booking_request refuses it first anyway): the same
  // function on a temporary copy of the table proves the statement branch refuses (no OLD/NEW read); the real
  // trigger is checked in the catalogue below.
  it('TRUNCATE branch of the function refuses (temporary copy of the table, rolled back)', async () => {
    await expect(
      asOwnerTx(
        [
          [`CREATE TEMP TABLE pnv_copy (LIKE privacy_notice_version) ON COMMIT DROP`, []],
          [
            `CREATE TRIGGER pnv_copy_no_truncate BEFORE TRUNCATE ON pnv_copy
               FOR EACH STATEMENT EXECUTE FUNCTION privacy_notice_version_append_only()`,
            [],
          ],
          [`TRUNCATE pnv_copy`, []],
        ],
        { rollback: true },
      ),
    ).rejects.toThrow(/append-only .*TRUNCATE refused/);
  });

  // ops-check (P4-04) and the production check K3 read these two triggers BY NAME: names, events and enabled mode
  // are a contract (SEC PN01-01 (a)).
  it('both triggers exist under their 0090 names, are enabled in origin mode (tgenabled = O) and run the 0095 function', async () => {
    const rows = (
      await db.withContext(t.ctx(), (tx) =>
        tx.query<{
          tgname: string;
          tgenabled: string;
          tgtype: number;
          proname: string;
          prosecdef: boolean;
          proconfig: string[];
          owner: string;
        }>(
          `SELECT g.tgname, g.tgenabled, g.tgtype, f.proname, f.prosecdef, f.proconfig,
                  pg_get_userbyid(f.proowner) AS owner
             FROM pg_trigger g JOIN pg_proc f ON f.oid = g.tgfoid
            WHERE g.tgrelid = 'privacy_notice_version'::regclass AND NOT g.tgisinternal ORDER BY g.tgname`,
        ),
      )
    ).rows;
    const fn = {
      proname: 'privacy_notice_version_append_only',
      prosecdef: false,
      proconfig: ['search_path=pg_catalog, pg_temp'],
      owner: 'ottimo_owner',
    };
    // tgtype bits: 1 ROW, 2 BEFORE, 8 DELETE, 16 UPDATE, 32 TRUNCATE
    expect(rows).toEqual([
      {
        tgname: 'privacy_notice_version_append_only',
        tgenabled: 'O',
        tgtype: 1 | 2 | 8 | 16,
        ...fn,
      },
      { tgname: 'privacy_notice_version_no_truncate', tgenabled: 'O', tgtype: 2 | 32, ...fn },
    ]);
  });

  it('ottimo_app has SELECT only on privacy_notice_version (INSERT is not trapped by the trigger – privileges are the guard; SEC PN01-01 (b))', async () => {
    const r = await db.withContext(t.ctx(), (tx) =>
      tx.query(
        `SELECT has_table_privilege('ottimo_app', 'privacy_notice_version', 'SELECT') AS sel,
                has_table_privilege('ottimo_app', 'privacy_notice_version', 'INSERT') AS ins,
                has_table_privilege('ottimo_app', 'privacy_notice_version', 'UPDATE') AS upd,
                has_table_privilege('ottimo_app', 'privacy_notice_version', 'DELETE') AS del,
                has_table_privilege('ottimo_app', 'privacy_notice_version', 'TRUNCATE') AS trunc,
                has_table_privilege('ottimo_app', 'privacy_notice_version', 'TRIGGER') AS trig,
                has_any_column_privilege('ottimo_app', 'privacy_notice_version', 'UPDATE') AS col_upd,
                has_any_column_privilege('ottimo_app', 'privacy_notice_version', 'INSERT') AS col_ins`,
      ),
    );
    expect(r.rows).toEqual([
      {
        sel: true,
        ins: false,
        upd: false,
        del: false,
        trunc: false,
        trig: false,
        col_upd: false,
        col_ins: false,
      },
    ]);
  });

  // ARC PR29-01: the function compares the whole row, but a new column still deserves a review of this table (proof
  // of consent): adding one makes this test red on purpose.
  it('the table has exactly the 7 reviewed columns', async () => {
    const r = await db.withContext(t.ctx(), (tx) =>
      tx.query<{ column_name: string }>(
        `SELECT column_name FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'privacy_notice_version' ORDER BY ordinal_position`,
      ),
    );
    expect(r.rows.map((x) => x.column_name)).toEqual([
      'organization_id',
      'version',
      'locale',
      'body_sha256',
      'url_path',
      'published_at',
      'superseded_at',
    ]);
  });
});
