/**
 * BUG-R4-012 / FB-R4-ARC-FE-LPV2-05 (OpenAPI 0.3.10 bổ sung 5): a profile quick-created from a website request
 * sends `nationalityCode: null` = unknown – stored NULL, not VN, `isForeigner` false, the send language kept.
 * Leaving the field out on create stays VN (unchanged); leaving it out on edit keeps the stored value.
 * BUG-R4-011: `preferredContact: zalo` needs `messagingHandles.zalo` (Desk sends the phone there). Fake data only.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Database } from '../../src/db/database';
import {
  Client,
  type FeatureApp,
  P,
  seedSprint1Params,
  startFeatureApp,
} from '../helpers/feature-app';
import { HAS_DB, type TestTenant, appDatabase, createTenant } from '../helpers/tenant';

describe.skipIf(!HAS_DB)('BUG-R4-012 – unknown nationality on a quick-created profile', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;

  beforeAll(async () => {
    db = appDatabase(4);
    t = await createTenant(db, { users: { fd: ['front_desk'], sal: ['sales_staff'] } });
    await seedSprint1Params(db, t);
    fa = await startFeatureApp(db);
  });
  afterAll(async () => {
    await fa?.close();
    await db.close();
  });

  const send = (
    who: string,
    method: 'POST' | 'PATCH',
    path: string,
    body?: unknown,
    ifMatch?: number,
  ) =>
    Client.of(fa, t, who).send(
      method,
      `${P(t)}${path}`,
      body,
      ifMatch === undefined ? {} : { 'if-match': `"${ifMatch}"` },
    );
  const get = (who: string, path: string) => Client.of(fa, t, who).get(`${P(t)}${path}`);

  it('nationalityCode null → stored NULL: absent in Guest, isForeigner false, preferredLocale kept (ko request → en)', async () => {
    const res = await send('fd', 'POST', '/guests', {
      fullName: 'QA Kim Ko',
      phone: '+84 900 000 121',
      preferredLocale: 'en',
      preferredContact: 'zalo',
      messagingHandles: { zalo: '+84 900 000 121' },
      nationalityCode: null,
    });
    expect(res.statusCode).toBe(201);
    const g = res.json();
    expect(g).toMatchObject({
      fullName: 'QA Kim Ko',
      phone: '+84900000121',
      preferredLocale: 'en',
      preferredContact: 'zalo',
      // Handles come back as stored (E.164 digits, no '+') – unlike `phone` (noted for BE/ARC in the FE report).
      messagingHandles: { zalo: '84900000121' },
      isForeigner: false,
    });
    expect(g.nationalityCode).toBeUndefined();
    const again = await get('fd', `/guests/${g.id}`);
    expect(again.json().nationalityCode).toBeUndefined();
    expect(again.json().isForeigner).toBe(false);
    const [row] = await db.withContext(
      t.ctx(),
      async (tx) =>
        (
          await tx.query<{ nationality_code: string | null; is_foreigner: boolean }>(
            'SELECT nationality_code, is_foreigner FROM guest WHERE id = $1',
            [g.id],
          )
        ).rows,
    );
    expect(row).toEqual({ nationality_code: null, is_foreigner: false });
  });

  it('a sales user (quote from a request) gets the same: null, ru send language kept', async () => {
    const res = await send('sal', 'POST', '/guests', {
      fullName: 'Тест Гость',
      phone: '+84 900 000 123',
      preferredLocale: 'ru',
      preferredContact: 'zalo',
      messagingHandles: { zalo: '+84900000123' },
      nationalityCode: null,
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().nationalityCode).toBeUndefined();
    expect(res.json().preferredLocale).toBe('ru');
  });

  it('left out on create → VN as before (manual profile)', async () => {
    const res = await send('fd', 'POST', '/guests', {
      fullName: 'QA Viet Nam',
      phone: '+84 900 000 124',
    });
    expect(res.statusCode).toBe(201);
    expect(res.json()).toMatchObject({
      nationalityCode: 'VN',
      isForeigner: false,
      preferredLocale: 'vi',
    });
  });

  it('edit: left out keeps NULL; KR → foreigner; null clears it again', async () => {
    const created = (
      await send('fd', 'POST', '/guests', {
        fullName: 'QA Edit Null',
        phone: '+84 900 000 125',
        preferredLocale: 'en',
        nationalityCode: null,
      })
    ).json();
    const kept = await send('fd', 'PATCH', `/guests/${created.id}`, { freeNote: 'Fake note' }, 1);
    expect(kept.statusCode).toBe(200);
    expect(kept.json().nationalityCode).toBeUndefined();
    const kr = await send('fd', 'PATCH', `/guests/${created.id}`, { nationalityCode: 'KR' }, 2);
    expect(kr.json()).toMatchObject({ nationalityCode: 'KR', isForeigner: true });
    const cleared = await send(
      'fd',
      'PATCH',
      `/guests/${created.id}`,
      { nationalityCode: null },
      3,
    );
    expect(cleared.json().nationalityCode).toBeUndefined();
    expect(cleared.json().isForeigner).toBe(false);
    expect(cleared.json().preferredLocale).toBe('en');
  });

  it('BUG-R4-011: Zalo with only the phone → 422 CONTACT_CHANNEL_EMPTY; with messagingHandles.zalo → 201', async () => {
    const bad = await send('fd', 'POST', '/guests', {
      fullName: 'QA Zalo Phone',
      phone: '+84 900 000 126',
      preferredContact: 'zalo',
      nationalityCode: null,
    });
    expect(bad.statusCode).toBe(422);
    expect(bad.json().errors).toEqual([
      { field: 'preferredContact', code: 'CONTACT_CHANNEL_EMPTY' },
    ]);
    const ok = await send('fd', 'POST', '/guests', {
      fullName: 'QA Zalo Phone',
      phone: '+84 900 000 126',
      preferredContact: 'zalo',
      messagingHandles: { zalo: '+84 900 000 126' },
      nationalityCode: null,
    });
    expect(ok.statusCode).toBe(201);
    expect(ok.json()).toMatchObject({
      preferredContact: 'zalo',
      messagingHandles: { zalo: '84900000126' },
    });
  });
});
