/**
 * R3-Q51 (BE-B) – VietQR receiving account, server side of the owner's screen (OpenAPI 0.3.8: getParameterHistory,
 * setParameter, cancelScheduledParameter for `payment_receiving_account`; SEC `s1-security-requirements.md` C, Q51-1…7):
 * - owner only, even the masked read (MGR / FDL / FD / SAL → 403; `listParameters` drops the key for them);
 * - `accountNoMasked = '•••• 6789'` + `bankName` on every read, audit, notification and outbox row – the full number never
 *   leaves the server here (scan of every JSON and of the stored rows, idempotency replies included);
 * - `effectiveFrom` > business date (422 `EFFECTIVE_FROM_TOMORROW`), the first time too; same scheduled day = edit;
 * - S2 in the request (`reauth.secret` – StrongReauthService; wrong → 401, nothing written; missing → 422 REQUIRED);
 * - set / cancel → money audit (masked), `receiving_account_changed` to every OWN/MGR (effective date as code) + an
 *   email to every owner through the outbox (`staff.email`).
 * Fake clock, FAKE account data only.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { TEST_PASSWORD } from '../helpers/feature-app';
import { HAS_DB } from '../helpers/tenant';
import { type Fx, startFixture } from './s438-r8/fixture';

const KEY = 'payment_receiving_account';
const NUMBER = '1903123456789';
const ACC = { bankBin: '970407', accountNo: NUMBER, accountName: 'OTTIMO TEST' };
const REAUTH = { authMethod: 'password', secret: TEST_PASSWORD };

describe.skipIf(!HAS_DB)(
  'R3-Q51 – receiving account (owner only, masked, from tomorrow, S2)',
  () => {
    let x: Fx;
    beforeAll(async () => {
      x = await startFixture();
      await x.at('2030-03-20T10:00:00+07:00');
    });
    afterAll(async () => {
      await x?.close();
    });

    const put = (who: string, body: Record<string, unknown>) =>
      x.c[who]!.send('PUT', x.url(`/parameters/${KEY}`), body);
    const history = (who: string) => x.c[who]!.get(x.url(`/parameters/${KEY}`));
    const cancel = (who: string, body: Record<string, unknown>) =>
      x.c[who]!.send('POST', x.url(`/parameters/${KEY}/actions/cancel-scheduled`), body);
    const rows = async () =>
      (
        await x.q(
          `SELECT effective_from::text AS d FROM config_parameter WHERE key = $1 ORDER BY effective_from`,
          [KEY],
        )
      ).map((r: any) => r.d as string);
    const audits = async () =>
      x.q(
        `SELECT category, before, after FROM audit_event
        WHERE action = 'config.changed' AND entity_id = $1 ORDER BY occurred_at, id`,
        [KEY],
      );
    const seen: string[] = [];
    const keep = <T extends { body: string }>(r: T): T => {
      seen.push(r.body);
      return r;
    };

    it('Q51-5: effectiveFrom = the business date (the first time too) → 422 EFFECTIVE_FROM_TOMORROW, nothing written', async () => {
      const r = keep(
        await put('owner', {
          value: ACC,
          effectiveFrom: '2030-03-20',
          reason: 'Tài khoản mới',
          reauth: REAUTH,
        }),
      );
      expect(r.statusCode, r.body).toBe(422);
      expect(r.json().errors).toEqual([
        { field: 'effectiveFrom', code: 'EFFECTIVE_FROM_TOMORROW' },
      ]);
      expect(await rows()).toEqual([]);
    });

    it('Q51-1/Q51-4: MGR → 403 (logged; FDL is not an edit role either); OWN without reauth → 422 REQUIRED; wrong password → 401, nothing written', async () => {
      for (const who of ['mgr']) {
        const r = keep(
          await put(who, {
            value: ACC,
            effectiveFrom: '2030-03-21',
            reason: 'Tài khoản mới',
            reauth: REAUTH,
          }),
        );
        expect(r.statusCode, `${who} ${r.body}`).toBe(403);
      }
      const missing = keep(
        await put('owner', { value: ACC, effectiveFrom: '2030-03-21', reason: 'Tài khoản mới' }),
      );
      expect(missing.statusCode).toBe(422);
      expect(missing.json().errors).toEqual([{ field: 'reauth', code: 'REQUIRED' }]);
      const wrong = keep(
        await put('owner', {
          value: ACC,
          effectiveFrom: '2030-03-21',
          reason: 'Tài khoản mới',
          reauth: { authMethod: 'password', secret: 'not-the-password' },
        }),
      );
      expect(wrong.statusCode, wrong.body).toBe(401);
      expect(wrong.json().code).toBe('REAUTH_FAILED');
      expect(await rows()).toEqual([]);
      const denied = await x.q(
        `SELECT count(*)::int AS n FROM audit_event WHERE action = 'access.denied' AND entity_id = $1`,
        [KEY],
      );
      expect(denied[0].n).toBeGreaterThanOrEqual(1);
    });

    it('ARC Q51-01 (0.3.8 bổ sung 2): first time, only a scheduled row → GET 200 WITHOUT current, history = that row (masked); MGR 403; OWN cancels it → GET 404; MGR still 403', async () => {
      const r = keep(
        await put('owner', {
          value: ACC,
          effectiveFrom: '2030-03-28',
          reason: 'Nhập lần đầu',
          reauth: REAUTH,
        }),
      );
      expect(r.statusCode, r.body).toBe(200);
      const h = keep(await history('owner'));
      expect(h.statusCode, h.body).toBe(200);
      expect(h.json()).not.toHaveProperty('current');
      expect(h.json().history).toEqual([
        expect.objectContaining({
          effectiveFrom: '2030-03-28',
          value: {
            bankBin: '970407',
            bankName: 'Techcombank',
            accountNoMasked: '•••• 6789',
            accountName: 'OTTIMO TEST',
          },
        }),
      ]);
      expect(keep(await history('mgr')).statusCode).toBe(403);
      const c = keep(
        await cancel('owner', { effectiveFrom: '2030-03-28', reason: 'Nhập nhầm', reauth: REAUTH }),
      );
      expect(c.statusCode, c.body).toBe(204);
      expect(keep(await history('owner')).statusCode).toBe(404);
      expect(keep(await history('mgr')).statusCode).toBe(403);
      expect(await rows()).toEqual([]);
    });

    it('FB-R3-SEC-Q51-01: an account number in the reason (≥ 6 digits, spaced groups too, or the number sent) → 422 reason ACCOUNT_NUMBER_NOT_ALLOWED before S2, nothing written; an ISO date is fine', async () => {
      for (const reason of ['Đổi sang TK 1903123456789', 'TK 1903 1234 56789', 'Mã 123456 cũ']) {
        const r = keep(
          await put('owner', { value: ACC, effectiveFrom: '2030-03-21', reason, reauth: REAUTH }),
        );
        expect(r.statusCode, `${reason} ${r.body}`).toBe(422);
        expect(r.json().errors).toEqual([{ field: 'reason', code: 'ACCOUNT_NUMBER_NOT_ALLOWED' }]);
      }
      const c = keep(
        await cancel('owner', {
          effectiveFrom: '2030-03-21',
          reason: 'Hủy TK 1903123456789',
          reauth: REAUTH,
        }),
      );
      expect(c.json().errors).toEqual([{ field: 'reason', code: 'ACCOUNT_NUMBER_NOT_ALLOWED' }]);
      expect(await rows()).toEqual([]);
      const failed = await x.q(
        `SELECT count(*)::int AS n FROM audit_event WHERE action = 'stepup.s2_failed'`,
      );
      expect(failed[0].n).toBe(1); // only the wrong password of the case above – no factor burnt here
    });

    it('Q51-2/Q51-6: OWN sets it from tomorrow → 200 masked `•••• 6789` + bankName; money audit masked; OWN/MGR told with the date; email to owners', async () => {
      const r = keep(
        await put('owner', {
          value: ACC,
          effectiveFrom: '2030-03-21',
          reason: 'Tài khoản mới',
          reauth: REAUTH,
        }),
      );
      expect(r.statusCode, r.body).toBe(200);
      expect(r.json().value).toEqual({
        bankBin: '970407',
        bankName: 'Techcombank',
        accountNoMasked: '•••• 6789',
        accountName: 'OTTIMO TEST',
      });
      const a = (await audits()).pop();
      expect(a.category).toBe('money');
      expect(a.after.value).toMatchObject({
        accountNoMasked: '•••• 6789',
        bankName: 'Techcombank',
      });
      const told = await x.q(
        `SELECT user_id, ref_code FROM staff_notification
          WHERE kind = 'receiving_account_changed' AND ref_code = '2030-03-21'`,
      );
      const ids = told.map((n: any) => n.user_id);
      expect(ids).toEqual(expect.arrayContaining([x.t.users.owner!.id, x.t.users.mgr!.id]));
      const mails = await x.q(`SELECT payload FROM outbox_message WHERE topic = 'staff.email'`);
      expect(mails.map((m: any) => m.payload)).toContainEqual({
        template: 'receiving_account_changed',
        userIds: [],
        owners: true,
        effectiveDate: '2030-03-21',
      });
    });

    it('Q51-1: history – OWN 200 with the scheduled row; MGR → 403; FD, SAL refused; listParameters drops the key for MGR', async () => {
      await x.at('2030-03-22T10:00:00+07:00');
      expect(
        keep(
          await put('owner', {
            value: { ...ACC, accountNo: '0071000123456', bankBin: '970436' },
            effectiveFrom: '2030-03-25',
            reason: 'Đổi sang tài khoản mới',
            reauth: REAUTH,
          }),
        ).statusCode,
      ).toBe(200);
      const h = keep(await history('owner'));
      expect(h.statusCode, h.body).toBe(200);
      expect(h.json().current.effectiveFrom).toBe('2030-03-21');
      expect(h.json().history.map((p: any) => p.effectiveFrom)).toEqual([
        '2030-03-25',
        '2030-03-21',
      ]);
      expect(h.json().history[0].value).toEqual({
        bankBin: '970436',
        bankName: 'Vietcombank',
        accountNoMasked: '•••• 3456',
        accountName: 'OTTIMO TEST',
      });
      for (const who of ['mgr', 'fd', 'sal']) {
        const r = keep(await history(who));
        expect(r.statusCode, `${who} ${r.body}`).toBe(403);
      }
      const mgrList = keep(await x.c.mgr!.get(x.url('/parameters')));
      expect((mgrList.json().data as any[]).map((p) => p.key)).not.toContain(KEY);
      const ownList = keep(await x.c.owner!.get(x.url('/parameters')));
      const mine = (ownList.json().data as any[]).find((p) => p.key === KEY);
      expect(mine.value.accountNoMasked).toBe('•••• 6789');
    });

    it('Q51-5: cancelScheduledParameter – MGR 403; wrong password 401; OWN → 204, money audit `cancelledEffectiveFrom` masked, told + email; the row in force → 409; no such row → 404', async () => {
      const body = { effectiveFrom: '2030-03-25', reason: 'Nhập nhầm', reauth: REAUTH };
      expect(keep(await cancel('mgr', body)).statusCode).toBe(403);
      const wrong = keep(
        await cancel('owner', {
          ...body,
          reauth: { authMethod: 'password', secret: 'not-the-password' },
        }),
      );
      expect(wrong.statusCode).toBe(401);
      expect(await rows()).toEqual(['2030-03-21', '2030-03-25']);
      const ok = keep(await cancel('owner', body));
      expect(ok.statusCode, ok.body).toBe(204);
      expect(await rows()).toEqual(['2030-03-21']);
      const last = (await audits()).pop();
      expect(last.category).toBe('money');
      expect(last.after).toEqual({ cancelledEffectiveFrom: '2030-03-25' });
      expect(last.before.value).toMatchObject({ accountNoMasked: '•••• 3456' });
      const mails = await x.q(
        `SELECT payload FROM outbox_message
          WHERE topic = 'staff.email' AND dedupe_key LIKE 'email:receiving_account_changed:cancel:%'
            AND payload->>'effectiveDate' = '2030-03-25'`,
      );
      expect(mails.map((m: any) => m.payload)).toEqual([
        {
          template: 'receiving_account_changed',
          userIds: [],
          owners: true,
          effectiveDate: '2030-03-25',
        },
      ]);
      const inForce = keep(await cancel('owner', { ...body, effectiveFrom: '2030-03-21' }));
      expect(inForce.statusCode, inForce.body).toBe(409);
      const none = keep(await cancel('owner', { ...body, effectiveFrom: '2030-03-30' }));
      expect(none.statusCode).toBe(404);
    });

    it('Q51-2: the full numbers appear in no response of this file, no audit, no notification, no outbox row, no stored idempotency reply', async () => {
      for (const n of [NUMBER, '0071000123456']) {
        for (const body of seen) expect(body).not.toContain(n);
        const [hit] = await x.q(
          `SELECT
           (SELECT count(*)::int FROM audit_event WHERE before::text LIKE $1 OR after::text LIKE $1) AS audit,
           (SELECT count(*)::int FROM outbox_message WHERE payload::text LIKE $1) AS outbox,
           (SELECT count(*)::int FROM staff_notification WHERE ref_code LIKE $1) AS notes,
           (SELECT count(*)::int FROM idempotency_key WHERE response_body::text LIKE $1) AS replies`,
          [`%${n}%`],
        );
        expect(hit, n).toEqual({ audit: 0, outbox: 0, notes: 0, replies: 0 });
      }
    });

    it('FB-R3-SEC-Q51-02 (0084 trigger): ottimo_app deleting a row in force / past straight in SQL → refused by the database; a future row is deletable (the app path)', async () => {
      // (the trigger reads the real clock: 2020 is in the past, 2031 in the future of any run of this suite)
      await x.q(
        `INSERT INTO config_parameter (id, organization_id, property_id, key, value, effective_from, reason,
           created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, 'business_day_rollover', '"06:00"', '2020-01-02', 'q51 trigger test',
           now(), now()),
                (gen_random_uuid(), $1, $2, 'business_day_rollover', '"06:00"', '2031-01-02', 'q51 trigger test',
           now(), now())`,
        [x.t.organizationId, x.t.propertyIds[0]],
      );
      await expect(
        x.q(
          `DELETE FROM config_parameter WHERE key = 'business_day_rollover' AND effective_from = '2020-01-02'`,
        ),
      ).rejects.toThrow(/only a row scheduled after the business date/);
      await x.q(
        `DELETE FROM config_parameter WHERE key = 'business_day_rollover' AND effective_from = '2031-01-02'`,
      );
      const left = await x.q(
        `SELECT effective_from::text AS d FROM config_parameter
          WHERE key = 'business_day_rollover' AND reason = 'q51 trigger test'`,
      );
      expect(left.map((r: any) => r.d)).toEqual(['2020-01-02']);
    });
  },
);
