// S4-33 (NÊN-ÔĐ) – ca bổ sung tầng API (project "api", đơn ngày xa, đồng hồ thật):
// - TC-L2-060 US-022/AC1: đơn 2 khách chỉ có người đứng tên → danh sách người báo thiếu 1 người.
// - TC-L2-061 US-022/AC2: thêm trẻ 5 tuổi và 8 tuổi → dữ liệu trẻ em (`isMinorData`), không hồ sơ CRM; bậc giá BR-110.
// - TC-L2-062 US-022/AC3: thêm cùng một người lần nữa → 409 PARTY_DUPLICATE, danh sách không đổi.
// - TC-RB-009 US-048/AC4: không có đường xuất giấy tờ hàng loạt; danh sách khai báo không chứa trường C3.
// - TC-SEC-015 US-142/AC3 (phần API): thao tác C3 khi nhận phòng chỉ trên thiết bị được cấp – máy không được cấp
//   (điện thoại cá nhân) → 403 DEVICE_NOT_TRUSTED; máy được cấp → được. Phần mật độ Touch trên máy tính bảng: chạy tay.
import { expect, test } from '@playwright/test';
import { call, needSeedPassword, sessionOrSkip, stackToday } from '../support/api.js';
import { cleanupTracked, getReservation, s2Context } from '../support/s2.js';
import { EP3, addDocument, namedGuest, p3, vnDoc } from '../support/s3.js';
import { farStay, patchReservation } from '../support/s3-checkin.js';

type Json = Record<string, unknown>;
interface PartyBody {
  requiredCount?: number;
  presentCount?: number;
  missingCount?: number;
  members?: Array<{
    id: string;
    role: string;
    guest?: { id?: string } | null;
    priceAgeBand?: string;
    isMinorData?: boolean;
  }>;
}

/** Từ khóa C3 / giấy tờ không được có trong danh sách khai báo (TC-RB-009). */
const C3_KEYS = [
  'docNumber',
  'docNumberLast4',
  'idDocLast4',
  'dateOfBirth',
  'address',
  'imageIds',
  'documents',
  'fullNameOnDoc',
  'passportNumber',
  'visaNumber',
];

test.describe('S4-33 – ca bổ sung tầng API', { tag: ['@api', '@sprint4'] }, () => {
  test.beforeEach(() => needSeedPassword());
  test.afterEach(async ({ request }) => cleanupTracked(request));

  test('TC-L2-060 (A) US-022/AC1 BR-601: đơn 2 người lớn chỉ có người đứng tên → listParty `requiredCount` 2, `presentCount` 1, `missingCount` 1', async ({
    request,
  }) => {
    const fd = await sessionOrSkip(request, 'qa.fd');
    const c = await s2Context(request);
    const st = await farStay(request, c, fd, await stackToday(request), { adults: 2, doc: false });
    const p = await call<PartyBody>(
      request,
      'GET',
      p3(EP3.listParty, fd, { reservationId: st.res.id }),
      {
        session: fd,
      },
    );
    expect(p.status, JSON.stringify(p.body).slice(0, 200)).toBe(200);
    expect(p.body).toMatchObject({ requiredCount: 2, presentCount: 1, missingCount: 1 });
  });

  test('TC-L2-061 (A) US-022/AC2 BR-110, BR-612: thêm trẻ 5 tuổi và trẻ 8 tuổi → `isMinorData`, không hồ sơ CRM (không `guest`), bậc giá `child_under_6` / `child_6_11`', async ({
    request,
  }) => {
    const fd = await sessionOrSkip(request, 'qa.fd');
    const c = await s2Context(request);
    const st = await farStay(request, c, fd, await stackToday(request), { adults: 2, doc: false });
    const year = Number(st.res.arrivalDate.slice(0, 4));
    // số khách của đơn trước (updateReservation), rồi mới thêm từng trẻ vào danh sách người
    const cur = await getReservation(request, fd, st.res.id);
    const counts = await patchReservation(request, fd, st.res.id, cur.body.version, {
      children6to11: 1,
      childrenUnder6: 1,
    });
    expect(
      counts.status,
      `updateReservation số trẻ: ${JSON.stringify(counts.body).slice(0, 300)}`,
    ).toBe(200);
    const add = async (name: string, age: number) =>
      call<PartyBody & Json>(
        request,
        'POST',
        p3(EP3.addPartyMember, fd, { reservationId: st.res.id }),
        {
          session: fd,
          idempotencyKey: true,
          body: {
            role: 'child',
            childName: name,
            childBirthYear: year - age,
            relationship: 'family',
          },
        },
      );
    const k5 = await add('Be Na', 5);
    expect(k5.status, JSON.stringify(k5.body).slice(0, 300)).toBe(201);
    const k8 = await add('Be Bo', 8);
    expect(k8.status, JSON.stringify(k8.body).slice(0, 300)).toBe(201);
    const p = await call<PartyBody>(
      request,
      'GET',
      p3(EP3.listParty, fd, { reservationId: st.res.id }),
      {
        session: fd,
      },
    );
    const kids = (p.body.members ?? []).filter((m) => m.role === 'child');
    expect(kids, 'hai trẻ').toHaveLength(2);
    for (const k of kids) {
      expect(k.isMinorData, 'dữ liệu trẻ em').toBe(true);
      expect(k.guest ?? null, 'không tạo hồ sơ CRM cho trẻ').toBeNull();
    }
    expect(kids.map((k) => k.priceAgeBand).sort()).toEqual(['child_6_11', 'child_under_6']);
    expect(JSON.stringify(p.body), 'không trả năm sinh').not.toContain(String(year - 5));
  });

  test('TC-L2-062 (A) US-022/AC3: thêm người P đã có trong đơn lần nữa → 409 PARTY_DUPLICATE, danh sách không đổi', async ({
    request,
  }) => {
    const fd = await sessionOrSkip(request, 'qa.fd');
    const c = await s2Context(request);
    const st = await farStay(request, c, fd, await stackToday(request), { adults: 2, doc: false });
    const g = await namedGuest(request, fd);
    const body = { role: 'companion', guestId: g.id, relationship: 'friend' };
    const first = await call<PartyBody & Json>(
      request,
      'POST',
      p3(EP3.addPartyMember, fd, { reservationId: st.res.id }),
      { session: fd, idempotencyKey: true, body },
    );
    expect(first.status, JSON.stringify(first.body).slice(0, 200)).toBe(201);
    const before = await call<PartyBody>(
      request,
      'GET',
      p3(EP3.listParty, fd, { reservationId: st.res.id }),
      {
        session: fd,
      },
    );
    const again = await call<Json>(
      request,
      'POST',
      p3(EP3.addPartyMember, fd, { reservationId: st.res.id }),
      {
        session: fd,
        idempotencyKey: true,
        body,
      },
    );
    expect(again.status, JSON.stringify(again.body).slice(0, 200)).toBe(409);
    expect(again.body.code).toBe('PARTY_DUPLICATE');
    const after = await call<PartyBody>(
      request,
      'GET',
      p3(EP3.listParty, fd, { reservationId: st.res.id }),
      {
        session: fd,
      },
    );
    expect((after.body.members ?? []).map((m) => m.id).sort()).toEqual(
      (before.body.members ?? []).map((m) => m.id).sort(),
    );
  });

  test('TC-RB-009 (A) US-048/AC4 A75: không có endpoint xuất giấy tờ hàng loạt (404); `listRegistrations?limit=100` không chứa trường C3 (chỉ trạng thái, số người, hạn)', async ({
    request,
  }) => {
    const fd = await sessionOrSkip(request, 'qa.fd');
    const mgr = await sessionOrSkip(request, 'qa.mgr');
    const c = await s2Context(request);
    const st = await farStay(request, c, fd, await stackToday(request), { adults: 1, doc: false });
    const add = await addDocument(request, fd, st.regId, vnDoc(st.guestName));
    expect(add.status, JSON.stringify(add.body).slice(0, 200)).toBe(201);
    for (const s of [fd, mgr]) {
      const l = await call<{ data: Json[] }>(request, 'GET', p3(EP3.listRegistrations, s), {
        session: s,
        query: { view: 'all', limit: 100 },
      });
      expect(l.status).toBe(200);
      const text = JSON.stringify(l.body);
      for (const k of C3_KEYS) expect(text, `không có trường "${k}"`).not.toContain(`"${k}"`);
    }
    for (const path of [
      'registrations/export',
      'registrations/documents/export',
      'guest-documents/export',
    ]) {
      const r = await call(
        request,
        'GET',
        `${p3(EP3.listRegistrations, mgr).replace(/registrations$/, '')}${path}`,
        {
          session: mgr,
        },
      );
      expect([404, 405], `${path}: không có đường xuất hàng loạt`).toContain(r.status);
    }
  });

  test('TC-SEC-015 (A) US-142/AC3 SR-DEV-03 (phần API): nhập giấy tờ khi nhận phòng từ máy không được cấp (điện thoại cá nhân) → 403 DEVICE_NOT_TRUSTED, không lưu; từ máy được cấp → 201', async ({
    request,
  }) => {
    const fd = await sessionOrSkip(request, 'qa.fd');
    const c = await s2Context(request);
    const st = await farStay(request, c, fd, await stackToday(request), { adults: 1, doc: false });
    const phone = await addDocument(request, fd, st.regId, vnDoc(st.guestName), 0, {
      device: false,
    });
    expect(phone.status, JSON.stringify(phone.body).slice(0, 200)).toBe(403);
    expect((phone.body as Json).code).toBe('DEVICE_NOT_TRUSTED');
    const desk = await addDocument(request, fd, st.regId, vnDoc(st.guestName));
    expect(desk.status, JSON.stringify(desk.body).slice(0, 200)).toBe(201);
    expect(desk.body.documents).toHaveLength(1);
  });
});
