// E2E API – EP09 hồ sơ khách & bộ chọn khách (US-071…073, US-087 phạm vi M). TC: r1-main-flows.md 6.3.
// Guests are throwaway (fake): email miền .test, SĐT di động ngẫu nhiên đầu 0939 (test-strategy mục 4).
import { expect, test, type APIRequestContext } from '@playwright/test';
import {
  call,
  expectProblem,
  needSeedPassword,
  propertyIdOf,
  requireEndpoints,
  sessionOrSkip,
  uniq,
  type Problem,
  type StaffSession,
} from '../support/api.js';

const CREATE: [string, string, string] = [
  'POST',
  '/v1/properties/{propertyId}/guests',
  'createGuest',
];
const SEARCH: [string, string, string] = [
  'GET',
  '/v1/properties/{propertyId}/guests',
  'searchGuests',
];
const GET: [string, string, string] = [
  'GET',
  '/v1/properties/{propertyId}/guests/{guestId}',
  'getGuest',
];
const UPDATE: [string, string, string] = [
  'PATCH',
  '/v1/properties/{propertyId}/guests/{guestId}',
  'updateGuest',
];
const LOOKUP: [string, string, string] = [
  'POST',
  '/v1/properties/{propertyId}/guests/lookup',
  'lookupGuestByContact',
];

interface Guest {
  id: string;
  code?: string;
  fullName?: string;
  phone?: string;
  email?: string;
  version?: number;
  [k: string]: unknown;
}

const letters = () =>
  Array.from({ length: 5 }, () => String.fromCharCode(97 + Math.floor(Math.random() * 26))).join(
    '',
  );
const mobile = () => `0939${String(Math.floor(Math.random() * 1e6)).padStart(6, '0')}`; // 10 số, đầu 09x
const mail = (tag = 'g') => `e2e.${tag}.${uniq(8)}@example.test`;

async function create(ctx: APIRequestContext, s: StaffSession, body: Record<string, unknown>) {
  return call<Guest & Problem>(ctx, 'POST', `/v1/properties/${propertyIdOf(s)}/guests`, {
    session: s,
    idempotencyKey: true,
    body,
  });
}

function list(body: unknown): Guest[] {
  if (Array.isArray(body)) return body as Guest[];
  return ((body as { data?: Guest[] })?.data ?? []) as Guest[];
}

test.describe(
  'L5 6.3 – hồ sơ khách (US-071, US-072, US-073)',
  { tag: ['@api', '@sprint1'] },
  () => {
    test.beforeEach(() => needSeedPassword());

    test('TC-L5-040 bắt buộc họ tên + (SĐT hoặc email)', async ({ request }) => {
      await requireEndpoints(request, 'TC-L5-040', [CREATE]);
      const fd = await sessionOrSkip(request, 'qa.fd');
      expectProblem(await create(request, fd, { email: mail() }), 422, 'VALIDATION_FAILED');
      expectProblem(
        await create(request, fd, { fullName: `Chỉ Tên ${letters()}` }),
        422,
        'VALIDATION_FAILED',
      );
      const ok = await create(request, fd, { fullName: `Có Email ${letters()}`, email: mail() });
      expect(ok.status, JSON.stringify(ok.body)).toBe(201);
    });

    test('TC-L5-041 kiểm định dạng và chuẩn hóa SĐT/email (BR-951)', async ({ request }) => {
      await requireEndpoints(request, 'TC-L5-041', [CREATE]);
      const fd = await sessionOrSkip(request, 'qa.fd');
      const badPhone = expectProblem(
        await create(request, fd, { fullName: 'Sai SĐT', phone: '09012345' }),
        422,
        'VALIDATION_FAILED',
      );
      expect(JSON.stringify(badPhone.errors)).toContain('phone');
      const badMail = expectProblem(
        await create(request, fd, { fullName: 'Sai email', email: 'a@b' }),
        422,
        'VALIDATION_FAILED',
      );
      expect(JSON.stringify(badMail.errors)).toContain('email');
      const digits = mobile();
      const spaced = `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
      const local = `An.${uniq(6)}`;
      const ok = await create(request, fd, {
        fullName: `Chuẩn Hóa ${letters()}`,
        phone: spaced,
        email: ` ${local}@Mail.EXAMPLE.test `,
      });
      expect(ok.status, JSON.stringify(ok.body)).toBe(201);
      const g = ok.body;
      // V-02 stores 84… (no "+"); the API serialises E.164 with or without "+" (contract leaves it open)
      if (g.phone !== undefined) expect(g.phone.replace(/^\+/, '')).toBe(`84${digits.slice(1)}`);
      if (g.email !== undefined) expect(g.email).toBe(`${local.toLowerCase()}@mail.example.test`);
    });

    test('TC-L5-042 không có trường số giấy tờ ở hồ sơ khách', async ({ request }) => {
      await requireEndpoints(request, 'TC-L5-042', [CREATE]);
      const fd = await sessionOrSkip(request, 'qa.fd');
      const r = await create(request, fd, {
        fullName: `Giấy Tờ ${letters()}`,
        email: mail(),
        documentNumber: 'TEST001234567890',
      });
      expect([201, 422]).toContain(r.status);
      expect(JSON.stringify(r.body)).not.toContain('TEST001234567890');
    });

    test('TC-L5-043 trùng SĐT (dạng +84) → 409 DUPLICATE_GUEST kèm existingGuestId', async ({
      request,
    }) => {
      await requireEndpoints(request, 'TC-L5-043', [CREATE]);
      const fd = await sessionOrSkip(request, 'qa.fd');
      const digits = mobile();
      const first = await create(request, fd, {
        fullName: `Trùng Một ${letters()}`,
        phone: `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`,
      });
      expect(first.status, JSON.stringify(first.body)).toBe(201);
      const dup = await create(request, fd, {
        fullName: `Trùng Hai ${letters()}`,
        phone: `+84 ${digits.slice(1)}`,
      });
      const p = expectProblem(dup, 409, 'DUPLICATE_GUEST');
      expect(p.existingGuestId).toBe(first.body.id);
      // email trùng, khác hoa thường
      const email = mail('dup');
      const e1 = await create(request, fd, { fullName: `Email Một ${letters()}`, email });
      expect(e1.status).toBe(201);
      const e2 = expectProblem(
        await create(request, fd, {
          fullName: `Email Hai ${letters()}`,
          email: email.toUpperCase(),
        }),
        409,
        'DUPLICATE_GUEST',
      );
      expect(e2.existingGuestId).toBe(e1.body.id);
    });

    test('TC-L5-044 trùng tên (đảo thứ tự) + ngày sinh → cảnh báo nghi trùng nhưng vẫn lưu', async ({
      request,
    }) => {
      await requireEndpoints(request, 'TC-L5-044', [CREATE]);
      const fd = await sessionOrSkip(request, 'qa.fd');
      const a = letters();
      const b = letters();
      const dob = `19${50 + Math.floor(Math.random() * 49)}-0${1 + Math.floor(Math.random() * 9)}-1${Math.floor(Math.random() * 9)}`;
      const g1 = await create(request, fd, {
        fullName: `${a.toUpperCase()} ${b.toUpperCase()}`,
        dateOfBirth: dob,
        email: mail(),
      });
      expect(g1.status, JSON.stringify(g1.body)).toBe(201);
      const g2 = await create(request, fd, {
        fullName: `${b} ${a}`,
        dateOfBirth: dob,
        email: mail(),
      });
      expect(g2.status, 'vẫn cho lưu').toBe(201);
      expect(JSON.stringify(g2.body), 'phản hồi có cảnh báo nghi trùng chỉ tới hồ sơ 1').toContain(
        g1.body.id,
      );
      const g3 = await create(request, fd, {
        fullName: `${b} ${a}`,
        dateOfBirth: '1999-12-31',
        email: mail(),
      });
      expect(g3.status).toBe(201);
      expect(JSON.stringify(g3.body), 'khác ngày sinh → không cảnh báo').not.toContain(g1.body.id);
    });

    test('TC-L5-045 tìm khách có/không dấu, từ 2 ký tự, tối đa 5 kết quả ở bộ chọn', async ({
      request,
    }) => {
      await requireEndpoints(request, 'TC-L5-045', [CREATE, SEARCH]);
      const fd = await sessionOrSkip(request, 'qa.fd');
      const pid = propertyIdOf(fd);
      const tag = letters();
      const g = await create(request, fd, { fullName: `Đỗ Mai Anh ${tag}`, email: mail() });
      expect(g.status, JSON.stringify(g.body)).toBe(201);
      const one = await call(request, 'GET', `/v1/properties/${pid}/guests`, {
        session: fd,
        query: { q: 'd', picker: true },
      });
      expect([200, 422], '1 ký tự: chưa tìm').toContain(one.status);
      if (one.status === 200) expect(list(one.body)).toHaveLength(0);
      for (const q of [
        `do mai anh ${tag}`,
        `Đỗ Mai Anh ${tag}`,
        `DO MAI ANH ${tag}`,
        `đo mai anh ${tag}`,
      ]) {
        const r = await call(request, 'GET', `/v1/properties/${pid}/guests`, {
          session: fd,
          query: { q, picker: true },
        });
        expect(r.status).toBe(200);
        expect(
          list(r.body).map((x) => x.id),
          `q="${q}"`,
        ).toContain(g.body.id);
      }
      const many = await call(request, 'GET', `/v1/properties/${pid}/guests`, {
        session: fd,
        query: { q: 'do mai anh', picker: true },
      });
      expect(list(many.body).length).toBeLessThanOrEqual(5);
    });

    test('TC-L5-046 tra theo SĐT đã có → trả hồ sơ có sẵn (dùng hồ sơ này)', async ({
      request,
    }) => {
      await requireEndpoints(request, 'TC-L5-046', [CREATE, LOOKUP]);
      const fd = await sessionOrSkip(request, 'qa.fd');
      const digits = mobile();
      const g = await create(request, fd, { fullName: `Tra Cứu ${letters()}`, phone: digits });
      expect(g.status).toBe(201);
      const r = await call(request, 'POST', `/v1/properties/${propertyIdOf(fd)}/guests/lookup`, {
        session: fd,
        body: { phone: `+84${digits.slice(1)}` },
      });
      expect(r.status).toBe(200);
      expect(JSON.stringify(r.body)).toContain(g.body.id);
    });

    test('TC-NT-038 sửa hồ sơ giữ nguyên mã KH; khách mới nhận mã kế tiếp', async ({ request }) => {
      await requireEndpoints(request, 'TC-NT-038', [CREATE, GET, UPDATE]);
      const fd = await sessionOrSkip(request, 'qa.fd');
      const pid = propertyIdOf(fd);
      const g = await create(request, fd, { fullName: `Mã Khách ${letters()}`, email: mail() });
      expect(g.status).toBe(201);
      const code = g.body.code;
      expect(code, 'server cấp mã KH-').toMatch(/^KH-\d+$/);
      const cur = await call<Guest>(request, 'GET', `/v1/properties/${pid}/guests/${g.body.id}`, {
        session: fd,
      });
      expect(cur.status).toBe(200);
      const tagv = cur.headers.etag ?? `"${cur.body.version ?? 0}"`;
      const upd = await call<Guest>(request, 'PATCH', `/v1/properties/${pid}/guests/${g.body.id}`, {
        session: fd,
        ifMatch: tagv,
        body: { fullName: `Đổi Tên ${letters()}`, email: mail() },
      });
      expect(upd.status, JSON.stringify(upd.body)).toBe(200);
      expect(upd.body.code).toBe(code);
      const next = await create(request, fd, { fullName: `Mã Kế ${letters()}`, email: mail() });
      expect(Number(next.body.code?.split('-')[1])).toBeGreaterThan(Number(code!.split('-')[1]));
    });
  },
);

test.describe('US-087 phạm vi M – khách của SAL/CTV', { tag: ['@api', '@sprint1'] }, () => {
  test.beforeEach(() => needSeedPassword());

  test('TC-RB-010 (khách) CTV/SAL chỉ thấy khách của mình; id của người khác → 404; tra trùng chỉ báo "có thể trùng"', async ({
    request,
  }) => {
    await requireEndpoints(request, 'TC-RB-010', [CREATE, GET, SEARCH, LOOKUP]);
    const sal = await sessionOrSkip(request, 'qa.sal');
    const ctv = await sessionOrSkip(request, 'qa.ctv1');
    const fd = await sessionOrSkip(request, 'qa.fd');
    const pid = propertyIdOf(sal);
    const tag = letters();
    const mine = await create(request, ctv, { fullName: `Khách Ctv ${tag}`, email: mail() });
    const salGuestEmail = mail('sal');
    const other = await create(request, sal, {
      fullName: `Khách Sal ${tag}`,
      email: salGuestEmail,
    });
    const desk = await create(request, fd, { fullName: `Khách Quầy ${tag}`, email: mail() });
    for (const r of [mine, other, desk]) expect(r.status, JSON.stringify(r.body)).toBe(201);

    expect(
      (await call(request, 'GET', `/v1/properties/${pid}/guests/${mine.body.id}`, { session: ctv }))
        .status,
    ).toBe(200);
    expectProblem(
      await call(request, 'GET', `/v1/properties/${pid}/guests/${other.body.id}`, { session: ctv }),
      404,
      'NOT_FOUND',
    );
    expectProblem(
      await call(request, 'GET', `/v1/properties/${pid}/guests/${desk.body.id}`, { session: ctv }),
      404,
      'NOT_FOUND',
    );

    const found = list(
      (
        await call(request, 'GET', `/v1/properties/${pid}/guests`, {
          session: ctv,
          query: { q: tag },
        })
      ).body,
    ).map((x) => x.id);
    expect(found).toContain(mine.body.id);
    expect(found).not.toContain(other.body.id);
    expect(found).not.toContain(desk.body.id);

    const look = await call(request, 'POST', `/v1/properties/${pid}/guests/lookup`, {
      session: ctv,
      body: { email: salGuestEmail },
    });
    expect(look.status).toBe(200);
    const text = JSON.stringify(look.body);
    expect(text).toContain('possible_duplicate');
    expect(text).not.toContain(other.body.id);
    expect(text).not.toContain(`Khách Sal ${tag}`);
  });
});
