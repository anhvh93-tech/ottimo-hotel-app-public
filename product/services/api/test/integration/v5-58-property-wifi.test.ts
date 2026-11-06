/**
 * V5-58 (BUG-R3-021 Desk part) on the real PostgreSQL through the HTTP surface – OpenAPI 0.3.13 1.13, 1.23,
 * bổ sung 1e and 1f (contract doc 1.25, 1.26: T58-1…16), SEC `SEC-responses.md` 2.3 and 3 (the caller-password
 * comparison limit, rule id `CALLER_PASSWORD_COMPARE_RULE`):
 * - getPropertyWifi: S36 reads (OWN, MGR, FDL, FD), `configured = false` before any value, `no-store`;
 * - setPropertyWifi: OWN/MGR; trims `ssid`, 1–32 bytes, no room number as a word, no staff login name; password
 *   empty or 8–63 printable ASCII and never the caller's own login password; 422 without any value, nothing written,
 *   no config audit; 200 without the password; the guest page reads the new value at once;
 * - comparison limit: every comparison counts, 5 per user and fixed 24 h window in `rate_limit_counter`
 *   (`wifi_pw_cmp:<user_id>`), the 6th is skipped and saved (one security audit per window), the count and the
 *   audit of a matching 422 survive its rollback and an api restart, the login lockout never moves.
 * Fake clock (T0 = Thu 15/10/2026 09:00 VN). FAKE data only; Wi-Fi values are `<wifi-password…>` placeholders.
 */
import { Writable } from 'node:stream';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
import {
  CALLER_PASSWORD_COMPARE_LIMIT,
  CALLER_PASSWORD_COMPARE_RULE,
} from '../../src/modules/identity/public/caller-password-match';
import {
  Client,
  type FeatureApp,
  type LightMyRequestResponse,
  P,
  TEST_PASSWORD,
  cookieValue,
  setPassword,
  startFeatureApp,
} from '../helpers/feature-app';
import { GUEST_TEST_ORIGIN, guest, seedStay, staff } from '../helpers/registration-fixture';
import { seedBooking, touchSessions } from '../helpers/reservations-fixture';
import { HAS_DB, T0, type TestTenant, appDatabase, createTenant } from '../helpers/tenant';

const WIFI = '<wifi-password>';
const OTHER_SITE = '<wifi-password-b>';

describe.skipIf(!HAS_DB)('V5-58 property Wi-Fi on the Desk (BE-D)', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let guestSid: string;
  let lockBefore: Record<string, unknown>[];
  const lines: string[] = [];
  const bodies: string[] = [];
  const putBodies: string[] = [];
  const sink = new Writable({
    write(chunk, _enc, cb) {
      lines.push(String(chunk));
      cb();
    },
  });
  const start = () =>
    startFeatureApp(db, { guestOrigins: [GUEST_TEST_ORIGIN], logStream: sink, logLevel: 'trace' });

  beforeAll(async () => {
    db = appDatabase(6);
    t = await createTenant(db, {
      properties: 2,
      users: {
        own: ['owner'],
        own2: ['owner'],
        mgr: ['manager'],
        fdl: ['front_desk_lead'],
        fd: ['front_desk'],
        hk: ['housekeeping'],
        gone: ['front_desk'],
      },
    });
    for (const u of ['own', 'own2', 'mgr']) await setPassword(db, t, u);
    lockBefore = await lockout(['own', 'own2', 'mgr']);
    for (const r of lockBefore) {
      expect(r).toMatchObject({
        status: 'active',
        failed_login_count: 0,
        locked_until: null,
        approval_pin_failed_count: 0,
      });
    }
    const ids = await seedBooking(db, t);
    await db.withContext(t.ctx(), async (tx) => {
      await tx.query(`UPDATE app_user SET status = 'disabled' WHERE id = $1`, [t.users.gone!.id]);
      await tx.query(`UPDATE property SET wifi_info_i18n = $2::jsonb WHERE id = $1`, [
        t.propertyIds[1],
        JSON.stringify({ ssid: 'OTHER SITE', password: OTHER_SITE }),
      ]);
    });
    fa = await start();
    // A guest in house today (arrival 15/10) – sees Wi-Fi from the arrival business date (US-108 AC2).
    const { reservationId } = await seedStay(db, t, ids, { status: 'in_house' });
    const link = await staff(
      fa,
      t.users.fd!.sessionToken,
      null,
      'POST',
      `${P(t)}/reservations/${reservationId}/guest-link`,
    );
    expect(link.statusCode, link.body).toBe(201);
    const open = await guest(fa, null, 'POST', '/v1/guest/sessions', {
      json: { token: new URL(link.json().url).pathname.slice(3) },
    });
    expect(open.statusCode, open.body).toBe(200);
    guestSid = cookieValue(open, 'ottimo_gsid') as string;
  });
  afterAll(async () => {
    await fa?.close();
    await db?.close();
  });

  const q = async <R extends Record<string, unknown>>(sql: string, p: unknown[] = []) =>
    (await db.withContext(t.ctx(), (tx) => tx.query<R>(sql, p))).rows;
  const get = async (who: string) => {
    const r = await Client.of(fa, t, who).get(`${P(t)}/wifi`);
    bodies.push(r.body);
    return r;
  };
  const put = async (who: string, body: unknown) => {
    const r = await Client.of(fa, t, who).send('PUT', `${P(t)}/wifi`, body);
    bodies.push(r.body);
    putBodies.push(r.body);
    return r;
  };
  /** SR-AUTH-04 `login_lockout` state + the re-auth counter (SR-RL-02) of these people. */
  async function lockout(who: string[]) {
    return (
      await db.withContext(t.ctx(), (tx) =>
        tx.query(
          `SELECT username, status, failed_login_count, locked_until, lock_count_24h,
                  approval_pin_failed_count, approval_pin_locked_until
             FROM app_user WHERE id = ANY($1::uuid[]) ORDER BY username`,
          [who.map((u) => t.users[u]!.id)],
        ),
      )
    ).rows;
  }
  const lockoutBefore = (who: string[]) =>
    lockBefore.filter((r) => who.some((u) => t.users[u]!.username === r.username));
  const login = (who: string) =>
    fa.app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { username: t.users[who]!.username, password: TEST_PASSWORD },
    });
  const stored = async (i = 0) =>
    (
      await q<{ wifi_info_i18n: unknown }>('SELECT wifi_info_i18n FROM property WHERE id = $1', [
        t.propertyIds[i],
      ])
    )[0]!.wifi_info_i18n;
  const count = async (who: string) =>
    (
      await q<{ n: number }>(
        `SELECT COALESCE(sum(count), 0)::int AS n FROM rate_limit_counter WHERE bucket_key = $1`,
        [`wifi_pw_cmp:${t.users[who]!.id}`],
      )
    )[0]!.n;
  const audits = (action: string, who?: string) =>
    q<{
      category: string;
      entity_type: string;
      entity_id: string;
      before: unknown;
      after: unknown;
    }>(
      `SELECT category, entity_type, entity_id, before, after FROM audit_event
        WHERE organization_id = $1 AND action = $2 ${who ? 'AND actor_user_id = $3' : ''}
        ORDER BY occurred_at, id`,
      who ? [t.organizationId, action, t.users[who]!.id] : [t.organizationId, action],
    );
  const expect422 = (r: LightMyRequestResponse, errors: unknown[]) => {
    expect(r.statusCode, r.body).toBe(422);
    expect(r.headers['cache-control']).toBe('no-store');
    expect(r.json()).toMatchObject({ code: 'VALIDATION_FAILED', errors });
    expect(r.json().errors).toHaveLength(errors.length);
  };

  it('T58-4/T58-6: before any value every S36 role reads configured = false with no-store; HK → 403', async () => {
    for (const who of ['own', 'mgr', 'fdl', 'fd']) {
      const r = await get(who);
      expect(r.statusCode, r.body).toBe(200);
      expect(r.headers['cache-control']).toBe('no-store');
      expect(r.json()).toEqual({ configured: false });
    }
    const hk = await get('hk');
    expect(hk.statusCode).toBe(403);
    expect(hk.json().code).toBe('FORBIDDEN_ACTION');
  });

  it('T58-1/T58-6: OWN sets it – trimmed, 200 without the password, guest page shows it today, config audit', async () => {
    const r = await put('own', { ssid: '  OTTIMO BOUTIQUE STAY ', password: WIFI });
    expect(r.statusCode, r.body).toBe(200);
    expect(r.headers['cache-control']).toBe('no-store');
    expect(r.json()).toEqual({ configured: true, ssid: 'OTTIMO BOUTIQUE STAY', passwordSet: true });
    expect(r.body).not.toContain(WIFI);
    expect(await stored()).toEqual({ ssid: 'OTTIMO BOUTIQUE STAY', password: WIFI });
    // A well-formed new password is compared once with OWN's login password (no match).
    expect(await count('own')).toBe(1);
    const g = await guest(fa, guestSid, 'GET', '/v1/guest/stay');
    expect(g.statusCode, g.body).toBe(200);
    expect(g.json().wifi).toEqual({ ssid: 'OTTIMO BOUTIQUE STAY', password: WIFI });
    expect(await audits('property.wifi_changed')).toEqual([
      {
        category: 'config',
        entity_type: 'property',
        entity_id: t.propertyIds[0],
        before: { ssid: null },
        after: { ssid: 'OTTIMO BOUTIQUE STAY', passwordChanged: true },
      },
    ]);
  });

  it('T58-4: OWN, MGR, FDL, FD read the stored value with passwordSet; FD cannot write', async () => {
    for (const who of ['own', 'mgr', 'fdl', 'fd']) {
      const r = await get(who);
      expect(r.statusCode, r.body).toBe(200);
      expect(r.headers['cache-control']).toBe('no-store');
      expect(r.json()).toEqual({
        configured: true,
        ssid: 'OTTIMO BOUTIQUE STAY',
        password: WIFI,
        passwordSet: true,
      });
    }
    for (const who of ['fd', 'fdl', 'hk']) {
      const w = await put(who, { ssid: 'OTTIMO', password: '' });
      expect(w.statusCode, w.body).toBe(403);
      expect(w.json().code).toBe('FORBIDDEN_ACTION');
    }
    expect(await stored()).toEqual({ ssid: 'OTTIMO BOUTIQUE STAY', password: WIFI });
  });

  it('T58-7: the other property keeps its own Wi-Fi', async () => {
    expect(await stored(1)).toEqual({ ssid: 'OTHER SITE', password: OTHER_SITE });
  });

  it('T58-2/T58-3 + SEC ARC-05: shape and room-number refusals – 422, no value, nothing written, nothing counted', async () => {
    const before = await count('own');
    // Room numbers of the property as words of their own (BR-012 (7)).
    for (const ssid of ['OTTIMO 401', 'ottimo-202', '101']) {
      expect422(await put('own', { ssid, password: WIFI }), [
        { field: 'ssid', code: 'NOT_ALLOWED' },
      ]);
    }
    // Inside a longer word it is not a room number.
    const glued = await put('own', { ssid: 'OTTIMO401', password: WIFI });
    expect(glued.statusCode, glued.body).toBe(200);
    // 33 bytes (11 × 3-byte letter), empty after trimming, control character → VALUE_OUT_OF_RANGE + max 32.
    for (const ssid of ['ạ'.repeat(11), '   ', 'OTTIMO\tSTAY']) {
      const r = await put('own', { ssid, password: WIFI });
      expect422(r, [{ field: 'ssid', code: 'VALUE_OUT_OF_RANGE' }]);
      expect(r.json().max).toBe(32);
    }
    // 7 characters, 64 characters, non-ASCII → VALUE_OUT_OF_RANGE on password (never compared).
    for (const password of ['<wifi-p', 'x'.repeat(64), 'mật-khẩu-wifi-01']) {
      const r = await put('own', { ssid: 'OTTIMO BOUTIQUE STAY', password });
      expect422(r, [{ field: 'password', code: 'VALUE_OUT_OF_RANGE' }]);
      expect(r.json()).not.toHaveProperty('max');
      expect(r.body).not.toContain(password);
    }
    // Unknown field / missing field (additionalProperties: false, both required).
    expect422(await put('own', { ssid: 'OTTIMO', password: '', note: 'x' }), [
      { field: 'body', code: 'VALIDATION_FAILED' },
    ]);
    expect422(await put('own', { ssid: 'OTTIMO' }), [{ field: 'password', code: 'REQUIRED' }]);
    expect(await stored()).toEqual({ ssid: 'OTTIMO401', password: WIFI });
    // Only the two successful writes left a config audit.
    expect(await audits('property.wifi_changed')).toHaveLength(2);
    // The password never changed (same as stored) or failed its shape: nothing compared.
    expect(await count('own')).toBe(before);
  });

  it(`T58-9 + SEC ARC-22 (${CALLER_PASSWORD_COMPARE_RULE}): staff login name (any case, disabled too), caller login password, both – 422, nothing written, only the counter and the security audit kept`, async () => {
    const configAudits = (await audits('property.wifi_changed')).length;
    expect(await count('own')).toBe(1);

    const fdName = t.users.fd!.username.toUpperCase();
    const a = await put('own', { ssid: fdName, password: WIFI });
    expect422(a, [{ field: 'ssid', code: 'NOT_ALLOWED' }]);
    expect(a.body.toLowerCase()).not.toContain(t.users.fd!.username);
    expect422(await put('own', { ssid: t.users.gone!.username, password: WIFI }), [
      { field: 'ssid', code: 'NOT_ALLOWED' },
    ]);
    expect(await count('own')).toBe(1); // stored password unchanged → not compared

    // The caller's own login password (first comparison in a fresh window for this rule: count 2 of 5).
    const b = await put('own', { ssid: 'OTTIMO NEW', password: TEST_PASSWORD });
    expect422(b, [{ field: 'password', code: 'NOT_ALLOWED' }]);
    expect(b.body).not.toContain(TEST_PASSWORD);
    expect(await count('own')).toBe(2);
    const matched = await audits('property.wifi_password_matches_login', 'own');
    expect(matched).toEqual([
      {
        category: 'security',
        entity_type: 'property',
        entity_id: t.propertyIds[0],
        before: null,
        after: { rule: CALLER_PASSWORD_COMPARE_RULE },
      },
    ]);

    // Both at once: two field errors, one more comparison.
    const both = await put('own', { ssid: t.users.fd!.username, password: TEST_PASSWORD });
    expect422(both, [
      { field: 'ssid', code: 'NOT_ALLOWED' },
      { field: 'password', code: 'NOT_ALLOWED' },
    ]);
    expect(await count('own')).toBe(3);
    expect(await audits('property.wifi_password_matches_login', 'own')).toHaveLength(2);

    // Nothing written, no config audit; the login lockout and the re-auth counter never moved.
    expect(await stored()).toEqual({ ssid: 'OTTIMO401', password: WIFI });
    expect(await audits('property.wifi_changed')).toHaveLength(configAudits);
    expect(await lockout(['own'])).toEqual(await lockoutBefore(['own']));
    // MGR's login password is MGR's business: OWN typing it is not compared with anything but OWN's hash.
    const ok = await put('own', { ssid: 'OTTIMO BOUTIQUE STAY', password: WIFI });
    expect(ok.statusCode, ok.body).toBe(200);
  });

  it(`T58-13 (${CALLER_PASSWORD_COMPARE_RULE}): open network or a name change alone – no comparison, the counter does not move`, async () => {
    const before = await count('own');
    const open = await put('own', { ssid: 'OTTIMO OPEN', password: '' });
    expect(open.statusCode, open.body).toBe(200);
    expect(open.json()).toEqual({ configured: true, ssid: 'OTTIMO OPEN', passwordSet: false });
    expect((await get('fd')).json()).toEqual({
      configured: true,
      ssid: 'OTTIMO OPEN',
      password: '',
      passwordSet: false,
    });
    expect(await count('own')).toBe(before);
    // Back to a password: compared once; then renaming with the same password: not compared.
    expect((await put('own', { ssid: 'OTTIMO OPEN', password: WIFI })).statusCode).toBe(200);
    expect(await count('own')).toBe(before + 1);
    expect((await put('own', { ssid: 'OTTIMO BOUTIQUE STAY', password: WIFI })).statusCode).toBe(
      200,
    );
    expect(await count('own')).toBe(before + 1);
    const last = (await audits('property.wifi_changed')).at(-1);
    expect(last?.after).toEqual({ ssid: 'OTTIMO BOUTIQUE STAY', passwordChanged: false });
  });

  it(`T58-12 (${CALLER_PASSWORD_COMPARE_RULE}): the caller's login password, first comparison of the window – 422 NOT_ALLOWED, counter = 1 and the audit kept after the rollback`, async () => {
    const storedBefore = await stored();
    const configAudits = (await audits('property.wifi_changed')).length;
    expect(await count('own2')).toBe(0);
    const r = await put('own2', { ssid: 'OTTIMO BOUTIQUE STAY', password: TEST_PASSWORD });
    expect422(r, [{ field: 'password', code: 'NOT_ALLOWED' }]);
    expect(r.body).not.toContain(TEST_PASSWORD);
    expect(await count('own2')).toBe(1);
    expect(await audits('property.wifi_password_matches_login', 'own2')).toEqual([
      {
        category: 'security',
        entity_type: 'property',
        entity_id: t.propertyIds[0],
        before: null,
        after: { rule: CALLER_PASSWORD_COMPARE_RULE },
      },
    ]);
    // the request itself was rolled back: property and config audit unchanged (SEC ARC-22)
    expect(await stored()).toEqual(storedBefore);
    expect(await audits('property.wifi_changed')).toHaveLength(configAudits);
  });

  it(`T58-14 (${CALLER_PASSWORD_COMPARE_RULE}): counted 3 times, api restarted, one more PUT → 4 – the \`wifi_pw_cmp:<user_id>\` row survives`, async () => {
    for (const i of [1, 2]) {
      const r = await put('own2', {
        ssid: 'OTTIMO BOUTIQUE STAY',
        password: `<wifi-password-own2-${i}>`,
      });
      expect(r.statusCode, r.body).toBe(200);
    }
    expect(await count('own2')).toBe(3);
    await fa.close();
    fa = await start();
    const r = await put('own2', {
      ssid: 'OTTIMO BOUTIQUE STAY',
      password: '<wifi-password-own2-3>',
    });
    expect(r.statusCode, r.body).toBe(200);
    const rows = await q<{ bucket_key: string; count: number }>(
      `SELECT bucket_key, count FROM rate_limit_counter WHERE bucket_key = $1`,
      [`wifi_pw_cmp:${t.users.own2!.id}`],
    );
    expect(rows).toEqual([{ bucket_key: `wifi_pw_cmp:${t.users.own2!.id}`, count: 4 }]);
  });

  it(`T58-11 (${CALLER_PASSWORD_COMPARE_RULE}): 6 PUTs with other passwords in 24 h – 5 compared, the 6th skipped and saved (200), one audit; kept across a restart`, async () => {
    expect(CALLER_PASSWORD_COMPARE_LIMIT).toBe(5);
    const own = await count('own');
    for (let i = 1; i <= 6; i++) {
      const r = await put('mgr', {
        ssid: 'OTTIMO BOUTIQUE STAY',
        password: `<wifi-password-${i}>`,
      });
      expect(r.statusCode, r.body).toBe(200);
      expect(r.json()).toEqual({
        configured: true,
        ssid: 'OTTIMO BOUTIQUE STAY',
        passwordSet: true,
      });
      expect(await count('mgr')).toBe(i);
      // the security audit is written once, by the 6th (the first over the limit)
      expect(await audits('property.wifi_password_check_skipped', 'mgr')).toHaveLength(
        i === 6 ? 1 : 0,
      );
    }
    expect(await stored()).toEqual({ ssid: 'OTTIMO BOUTIQUE STAY', password: '<wifi-password-6>' });
    expect(await audits('property.wifi_password_matches_login', 'mgr')).toEqual([]);
    const skipped = await audits('property.wifi_password_check_skipped', 'mgr');
    expect(skipped).toEqual([
      {
        category: 'security',
        entity_type: 'property',
        entity_id: t.propertyIds[0],
        before: null,
        after: { rule: CALLER_PASSWORD_COMPARE_RULE },
      },
    ]);
    // 7th: still skipped, no second audit in the window.
    const seventh = await put('mgr', {
      ssid: 'OTTIMO BOUTIQUE STAY',
      password: '<wifi-password-7>',
    });
    expect(seventh.statusCode, seventh.body).toBe(200);
    expect(await count('mgr')).toBe(7);
    expect(await audits('property.wifi_password_check_skipped', 'mgr')).toHaveLength(1);

    // The counter is in PostgreSQL: a restarted api still skips – even MGR's OWN login password is saved (200).
    await fa.close();
    fa = await start();
    const after = await put('mgr', { ssid: 'OTTIMO BOUTIQUE STAY', password: TEST_PASSWORD });
    expect(after.statusCode, after.body).toBe(200);
    expect(await count('mgr')).toBe(8);
    expect(await audits('property.wifi_password_matches_login', 'mgr')).toEqual([]);
    expect(await audits('property.wifi_password_check_skipped', 'mgr')).toHaveLength(1);
    // Per user: OWN's counter did not move.
    expect(await count('own')).toBe(own);

    // Next fixed window (16/10 09:00 VN): compared again → MGR's login password is refused.
    const next = new Date(T0.getTime() + 24 * 3600_000);
    fa.clock.set(next);
    await touchSessions(db, t, next);
    expect((await put('mgr', { ssid: 'OTTIMO BOUTIQUE STAY', password: WIFI })).statusCode).toBe(
      200,
    );
    expect422(await put('mgr', { ssid: 'OTTIMO BOUTIQUE STAY', password: TEST_PASSWORD }), [
      { field: 'password', code: 'NOT_ALLOWED' },
    ]);
    expect(await audits('property.wifi_password_matches_login', 'mgr')).toHaveLength(1);
    const windows = await q<{ count: number }>(
      `SELECT count FROM rate_limit_counter WHERE bucket_key = $1 ORDER BY window_start`,
      [`wifi_pw_cmp:${t.users.mgr!.id}`],
    );
    expect(windows.map((w) => w.count)).toEqual([8, 2]);
  });

  it(`T58-15 (${CALLER_PASSWORD_COMPARE_RULE}): after T58-11 and T58-12 the callers' login_lockout is unchanged and they still log in`, async () => {
    expect(await lockout(['own', 'own2', 'mgr'])).toEqual(lockBefore);
    for (const who of ['mgr', 'own2', 'own']) {
      const r = await login(who);
      expect(r.statusCode, `${who} ${r.body}`).toBe(200);
    }
  });

  it('T58-5 + T58-16: no Wi-Fi or login password in audit rows, the request log, any PUT answer or problem body', async () => {
    const secrets = [
      WIFI,
      OTHER_SITE,
      TEST_PASSWORD,
      ...Array.from({ length: 7 }, (_, i) => `<wifi-password-${i + 1}>`),
      ...Array.from({ length: 3 }, (_, i) => `<wifi-password-own2-${i + 1}>`),
    ];
    const rows = await q<{ row: unknown }>(
      `SELECT row_to_json(a) AS row FROM audit_event a WHERE organization_id = $1`,
      [t.organizationId],
    );
    const auditText = JSON.stringify(rows);
    const logText = lines.join('');
    expect(logText.length).toBeGreaterThan(0);
    for (const s of secrets) {
      expect(auditText).not.toContain(s);
      expect(logText).not.toContain(s);
    }
    // Problem bodies never echo a value; only GET answers (S36) carry the stored password.
    const problems = bodies.filter((b) => b.includes('"code"'));
    expect(problems.length).toBeGreaterThan(10);
    for (const b of problems) for (const s of secrets) expect(b).not.toContain(s);
    // T58-16 / T58-6: a PUT answer never carries a password, whatever happened
    expect(putBodies.length).toBeGreaterThan(20);
    for (const b of putBodies) {
      const body = JSON.parse(b) as Record<string, unknown>;
      if (!('code' in body))
        expect(Object.keys(body).sort()).toEqual(['configured', 'passwordSet', 'ssid']);
      for (const s of secrets) expect(b).not.toContain(s);
    }
  });
});
