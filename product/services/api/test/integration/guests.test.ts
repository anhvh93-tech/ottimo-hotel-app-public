/**
 * guests (US-071 create/edit, US-072 duplicates, US-073 picker) on Nest/Fastify + PostgreSQL:
 * BR-951 normalisation, 409 DUPLICATE_GUEST, BR-952 warning, scope own for SAL/CTV, fields per role
 * (US-003 AC1), 412, accent-insensitive search, lookup audit, isolation between organisations.
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

describe.skipIf(!HAS_DB)('guests – profiles, duplicates, picker', () => {
  let db: Database;
  let fa: FeatureApp;
  let t: TestTenant;
  let other: TestTenant;
  let maiAnh: { id: string; code: string; version: number };

  beforeAll(async () => {
    db = appDatabase(10);
    t = await createTenant(db, {
      properties: 2,
      users: {
        owner: ['owner'],
        fd: ['front_desk'],
        sal: ['sales_staff'],
        sal2: ['sales_staff'],
        ctv: ['collaborator'],
        fdsal: ['front_desk', 'sales_staff'],
        hk: ['housekeeping'],
      },
    });
    other = await createTenant(db, { users: { fd: ['front_desk'] } });
    await seedSprint1Params(db, t);
    await seedSprint1Params(db, other);
    fa = await startFeatureApp(db);
  });
  afterAll(async () => {
    await fa?.close();
    await db.close();
  });

  const create = (who: string, body: Record<string, unknown>, tenant = t) =>
    Client.of(fa, tenant, who).send('POST', `${P(tenant)}/guests`, body);

  it('createGuest 201: KH- code, phone normalised (BR-951), name kept with accents, full fields for FD', async () => {
    const res = await create('fd', {
      fullName: '  Đỗ   Mai Anh ',
      phone: '0901 234 567',
      email: ' MaiAnh@Example.com ',
      nationalityCode: 'vn',
      preferredContact: 'zalo',
      messagingHandles: { zalo: '0901234567' },
      dateOfBirth: '1990-05-01',
      companyName: 'Công ty Giả',
      taxCode: '0101234567',
      freeNote: 'Thích phòng yên tĩnh',
    });
    expect(res.statusCode).toBe(201);
    maiAnh = res.json();
    expect(res.json()).toMatchObject({
      fullName: 'Đỗ Mai Anh',
      phone: '+84901234567',
      email: 'maianh@example.com',
      nationalityCode: 'VN',
      isForeigner: false,
      preferredLocale: 'vi',
      taxCode: '0101234567',
      version: 1,
    });
    expect(res.json().code).toMatch(/^KH-\d{4}$/);
    expect(res.headers.etag).toBe('"1"');
  });

  it('US-072 AC1: "+84 901234567" is the same phone → 409 DUPLICATE_GUEST with the existing id', async () => {
    const res = await create('fd', { fullName: 'Nguyễn Văn B', phone: '+84 901234567' });
    expect(res.statusCode).toBe(409);
    expect(res.json()).toMatchObject({
      code: 'DUPLICATE_GUEST',
      existingGuestId: maiAnh.id,
      existingGuestCode: maiAnh.code,
    });
    const byMail = await create('fd', { fullName: 'Nguyễn Văn C', email: 'MAIANH@example.com' });
    expect(byMail.statusCode).toBe(409);
  });

  it('a sales user hitting someone else’s profile gets 409 without the other profile’s id/code', async () => {
    const res = await create('sal', { fullName: 'Ai Đó', phone: '0901234567' });
    expect(res.statusCode).toBe(409);
    expect(res.json()).not.toHaveProperty('existingGuestId');
    expect(res.json()).not.toHaveProperty('existingGuestCode');
  });

  it('US-071 AC1/AC2: name and contact required, invalid phone/email per field, no ID number field', async () => {
    const res = await create('fd', { fullName: '' });
    expect(res.statusCode).toBe(422);
    expect(res.json().errors).toEqual(
      expect.arrayContaining([
        { field: 'fullName', code: 'REQUIRED' },
        { field: 'phone', code: 'CONTACT_REQUIRED' },
      ]),
    );
    const bad = await create('fd', { fullName: 'Anh 2', phone: '12345', email: 'x@y' });
    expect(bad.json().errors).toEqual(
      expect.arrayContaining([
        { field: 'fullName', code: 'NAME_INVALID' },
        { field: 'phone', code: 'PHONE_COUNTRY_CODE_REQUIRED' },
        { field: 'email', code: 'EMAIL_INVALID' },
      ]),
    );
    const minor = await create('fd', {
      fullName: 'Bé Na',
      phone: '0912000111',
      dateOfBirth: '2015-01-01',
    });
    expect(minor.json().errors).toEqual([{ field: 'dateOfBirth', code: 'DOB_MINOR' }]);
    const card = await create('fd', {
      fullName: 'Có Thẻ',
      phone: '0912000222',
      freeNote: 'số thẻ 4111-1111-1111-1111',
    });
    expect(card.statusCode).toBe(422);
    expect(card.json().code).toBe('CARD_NUMBER_DETECTED');
    const idDoc = await create('fd', {
      fullName: 'Có Giấy',
      phone: '0912000333',
      idDocLast4: '1234',
    });
    expect(idDoc.statusCode).toBe(201);
    expect(idDoc.json()).not.toHaveProperty('idDocLast4');
  });

  it('US-072 AC2: similar name + same date of birth → saved with a warning (FD+ only)', async () => {
    await create('fd', {
      fullName: 'Daniel Weber',
      phone: '+49 151 2345 6789',
      dateOfBirth: '1985-03-02',
      nationalityCode: 'DE',
    });
    const res = await create('fd', {
      fullName: 'WEBER Daniel',
      email: 'd.weber@example.de',
      dateOfBirth: '1985-03-02',
      nationalityCode: 'DE',
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().warnings).toEqual([
      expect.objectContaining({ code: 'possible_duplicate_name_dob' }),
    ]);
    // "AN NHI" vs "NHI AN" with different DOBs → no warning (BR-952 example).
    await create('fd', { fullName: 'An Nhi', phone: '0912000444', dateOfBirth: '1990-01-01' });
    const nhi = await create('fd', {
      fullName: 'Nhi An',
      phone: '0912000555',
      dateOfBirth: '1991-01-01',
    });
    expect(nhi.json().warnings).toEqual([]);
  });

  it('US-073 AC1: picker finds "Đỗ Mai Anh" from "do mai anh", max 5 results, by KH code too', async () => {
    const fd = Client.of(fa, t, 'fd');
    const res = await fd.get(`${P(t)}/guests?q=do%20mai%20anh&picker=true`);
    expect(res.statusCode).toBe(200);
    expect(res.json().data[0]).toMatchObject({
      id: maiAnh.id,
      displayName: 'Đỗ Mai Anh',
      phoneMasked: '0901***567',
    });
    const byCode = await fd.get(`${P(t)}/guests?q=${maiAnh.code}&picker=true`);
    expect(byCode.json().data[0].id).toBe(maiAnh.id);
    for (const x of ['An', 'Bình', 'Chi', 'Dung', 'Giang', 'Hà']) {
      expect(
        (
          await create('fd', {
            fullName: `Trần Thị ${x}`,
            email: `tran.${x.length}${x.charCodeAt(0)}@example.com`,
          })
        ).statusCode,
      ).toBe(201);
    }
    const many = await fd.get(`${P(t)}/guests?q=tran%20thi&picker=true`);
    expect(many.json().data).toHaveLength(5);
    const short = await fd.get(`${P(t)}/guests?q=a`);
    expect(short.statusCode).toBe(422);
    const page1 = await fd.get(`${P(t)}/guests?limit=2`);
    expect(page1.json().data).toHaveLength(2);
    const page2 = await fd.get(`${P(t)}/guests?limit=2&cursor=${page1.json().page.nextCursor}`);
    expect(page2.json().data[0].id).not.toBe(page1.json().data[0].id);
  });

  it('US-073 AC3 / scope own: SAL sees only own profiles; another one is 404; FD+SAL union sees all', async () => {
    const mine = await create('sal', {
      fullName: 'Khách Của Sale',
      phone: '0914000001',
      tags: ['VIP'],
    });
    expect(mine.statusCode).toBe(201);
    const sal = Client.of(fa, t, 'sal');
    const list = await sal.get(`${P(t)}/guests`);
    expect(list.json().data.map((g: { id: string }) => g.id)).toEqual([mine.json().id]);
    expect((await sal.get(`${P(t)}/guests/${maiAnh.id}`)).statusCode).toBe(404);
    expect(
      (await Client.of(fa, t, 'sal2').get(`${P(t)}/guests/${mine.json().id}`)).statusCode,
    ).toBe(404);
    expect((await Client.of(fa, t, 'fdsal').get(`${P(t)}/guests/${maiAnh.id}`)).statusCode).toBe(
      200,
    );
  });

  it('US-003 AC1: fields by role – SAL no DOB/company/tax/freeNote/idDocLast4/warnings; CTV no tags', async () => {
    const own = await create('sal', {
      fullName: 'Khách Sale Hai',
      phone: '0914000002',
      dateOfBirth: '1980-02-02',
      tags: ['VIP'],
      freeNote: 'ghi chú',
    });
    const got = await Client.of(fa, t, 'sal').get(`${P(t)}/guests/${own.json().id}`);
    const body = got.json();
    expect(body).toMatchObject({
      fullName: 'Khách Sale Hai',
      phone: '+84914000002',
      tags: ['VIP'],
    });
    for (const k of [
      'dateOfBirth',
      'companyName',
      'taxCode',
      'freeNote',
      'idDocLast4',
      'warnings',
      'crmConsent',
    ]) {
      expect(body).not.toHaveProperty(k);
    }
    const ctvGuest = await create('ctv', {
      fullName: 'Khách Ctv',
      phone: '0914000003',
      tags: ['VIP'],
    });
    expect(ctvGuest.statusCode).toBe(201);
    const ctvGet = await Client.of(fa, t, 'ctv').get(`${P(t)}/guests/${ctvGuest.json().id}`);
    expect(ctvGet.json()).not.toHaveProperty('tags');
    const fdGet = await Client.of(fa, t, 'fd').get(`${P(t)}/guests/${ctvGuest.json().id}`);
    expect(fdGet.json()).not.toHaveProperty('tags'); // tags sent by a collaborator are ignored (D12a)
    expect((await Client.of(fa, t, 'hk').get(`${P(t)}/guests/${maiAnh.id}`)).statusCode).toBe(403);
  });

  it('lookupGuestByContact: FD gets the profile; SAL gets no foreign data; every lookup audited without the value', async () => {
    const fd = Client.of(fa, t, 'fd');
    const res = await fd.send(
      'POST',
      `${P(t)}/guests/lookup`,
      { phone: '+84901234567' },
      { 'x-request-id': 'req-lookup-fd-1' },
    );
    expect(res.statusCode).toBe(200);
    expect(res.json().matches.map((g: { id: string }) => g.id)).toEqual([maiAnh.id]);
    const sal = await Client.of(fa, t, 'sal').send('POST', `${P(t)}/guests/lookup`, {
      email: 'maianh@example.com',
    });
    expect(sal.statusCode).toBe(200);
    expect(sal.json().matches).toEqual([]);
    expect(JSON.stringify(sal.json())).not.toContain(maiAnh.code);
    const audit = await db.withContext(t.ctx(), (tx) =>
      tx.query(
        `SELECT category, after::text AS after FROM audit_event WHERE request_id = 'req-lookup-fd-1'`,
      ),
    );
    expect(audit.rows[0]!.category).toBe('access');
    expect(audit.rows[0]!.after).not.toContain('901234567');
    const empty = await fd.send('POST', `${P(t)}/guests/lookup`, {});
    expect(empty.statusCode).toBe(422);
  });

  it('updateGuest: 412 stale; duplicate phone → 409; edit keeps the code and bumps the version', async () => {
    const fd = Client.of(fa, t, 'fd');
    const url = `${P(t)}/guests/${maiAnh.id}`;
    expect(
      (await fd.send('PATCH', url, { preferredLocale: 'en' }, { 'if-match': '"7"' })).statusCode,
    ).toBe(412);
    const dup = await fd.send('PATCH', url, { phone: '0912000444' }, { 'if-match': '"1"' });
    expect(dup.statusCode).toBe(409);
    expect(dup.json().code).toBe('DUPLICATE_GUEST');
    const ok = await fd.send(
      'PATCH',
      url,
      { preferredLocale: 'en', phone: '0909 999 888' },
      { 'if-match': '"1"' },
    );
    expect(ok.statusCode).toBe(200);
    expect(ok.json()).toMatchObject({
      code: maiAnh.code,
      preferredLocale: 'en',
      phone: '+84909999888',
      version: 2,
    });
    // Contact cannot be emptied entirely.
    const none = await fd.send('PATCH', url, { phone: null, email: null }, { 'if-match': '"2"' });
    expect(none.statusCode).toBe(422);
  });

  it('isolation: another organisation never sees these profiles; the same phone is free there', async () => {
    const res = await Client.of(fa, other, 'fd').get(`${P(other)}/guests/${maiAnh.id}`);
    expect(res.statusCode).toBe(404);
    const created = await create('fd', { fullName: 'Đỗ Mai Anh', phone: '0909999888' }, other);
    expect(created.statusCode).toBe(201);
    // Organisation-level profiles: visible from the second property of the same organisation.
    await db.withContext(t.ctx(), (tx) =>
      tx.query(
        `INSERT INTO user_property_role (user_id, property_id, organization_id, role, granted_at)
         VALUES ($1, $2, $3, 'front_desk', now())`,
        [t.users.fd!.id, t.propertyIds[1], t.organizationId],
      ),
    );
    await seedSprint1Params(db, t, 1);
    expect((await Client.of(fa, t, 'fd').get(`${P(t, 1)}/guests/${maiAnh.id}`)).statusCode).toBe(
      200,
    );
  });
});
