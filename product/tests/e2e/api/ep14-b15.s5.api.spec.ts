// EP14 v0.3 (BA 18/10) E14-11 – luật B-15 cho `replyNote` qua HTTP thật (project "api"): mọi ví dụ của bảng "Không bị
// chặn / Bị chặn" mục 4.4 (gồm 5 ca SEC thêm 18/10) trên `complete` và `decline`; `note` khách tự viết có 6 chữ số liền
// không bị chặn. E14-12 (phí BR-506 mục 4.5, cạnh `in_progress → declined`) đã có ca tích hợp BE-D
// (`services/api/test/integration/guest-requests-s4-fix-bed.test.ts`) – chỉ ghi vào ma trận truy vết (TC-L6-058).
import { expect, test, type APIRequestContext } from '@playwright/test';
import {
  call,
  needSeedPassword,
  propertyIdOf,
  sessionOrSkip,
  stackToday,
  type StaffSession,
} from '../support/api.js';
import { cleanupTracked, s2Context } from '../support/s2.js';
import { guestCall, guestLink, openGuest } from '../support/s3.js';
import { farStay } from '../support/s3-checkin.js';

type Json = Record<string, unknown>;

test.describe.configure({ mode: 'default' });

/** Ngày gần hiện tại (± 1 năm của ngày nghiệp vụ) theo 3 kiểu phân cách của bảng. */
const near = (today: string, sep: string) => today.split('-').reverse().join(sep);

const BLOCKED = [
  'Mã cửa 482913',
  '482 913',
  '482-913',
  '482.913',
  '482,913',
  '482913đ',
  '482.913 đ',
  'Mã ４８２９１３',
  '0912.345.678',
  '(+84) 912 345 678',
  'Gọi 0912 345 678 giá 350.000đ',
  '0912345678đ',
  '0912.345.000đ',
  'Phòng 202,203,204',
  'Phòng 202 203 204',
  'Mã cửa 482,913',
  'CCCD 079123456789',
  '079 123 456 789 đ',
  'Hộ chiếu C1234567',
  'C1234567đ',
  'Ngày sinh 05-03-1990',
  '05.03.1990',
  '31-02-2026',
  'Mã 18.10.26',
  'giá 350.000',
  '12.345.678.901đ',
];

async function newRequests(
  request: APIRequestContext,
  fd: StaffSession,
  n: number,
): Promise<string[]> {
  const c = await s2Context(request);
  const st = await farStay(request, c, fd, await stackToday(request), { adults: 1 });
  const link = await guestLink(request, fd, st.res.id);
  const g = await openGuest(request, link.token);
  expect(g.status, JSON.stringify(g.body).slice(0, 200)).toBe(200);
  const ids: string[] = [];
  for (let i = 0; i < n; i++) {
    const r = await guestCall<Json>(request, 'POST', '/v1/guest/requests', g.cookie, {
      idempotencyKey: true,
      body: { type: 'other', note: `Hoi dich vu ${i + 1}` },
    });
    expect(r.status, `khách gửi yêu cầu ${i + 1}: ${JSON.stringify(r.body).slice(0, 200)}`).toBe(
      201,
    );
    ids.push(String(r.body.id));
  }
  return ids;
}

async function act(
  request: APIRequestContext,
  s: StaffSession,
  id: string,
  action: string,
  body: Json = {},
) {
  return call<Json>(
    request,
    'POST',
    `/v1/properties/${propertyIdOf(s)}/guest-requests/${id}/actions/${action}`,
    { session: s, idempotencyKey: true, body },
  );
}

test.describe(
  'EP14 E14-11 – luật B-15 của `replyNote` (SEC C.6 V2)',
  { tag: ['@api', '@sprint4'] },
  () => {
    test.beforeEach(() => needSeedPassword());
    test.afterEach(async ({ request }) => cleanupTracked(request));

    test('TC-L6-057 (A) EP14 E14-11 US-109/AC2 B-15: mọi ví dụ "Bị chặn" → 422 SENSITIVE_DATA_DETECTED (trường `replyNote`) trên cả `complete` và `decline`, yêu cầu không đổi; mọi ví dụ "Không bị chặn" (giá có đơn vị, ngày gần hiện tại, danh sách có khoảng trắng sau dấu phẩy/chấm phẩy) → 200; `note` của khách có 6 chữ số liền → 201', async ({
      request,
    }) => {
      test.slow();
      const fd = await sessionOrSkip(request, 'qa.fd');
      const today = await stackToday(request);
      const allowed = [
        'Xe đón lúc 15:30, giá 350.000 đ',
        '350.000đ',
        '350,000 VND',
        '350 000 ₫',
        '350000đ',
        'Tour 1.500.000 đồng/người',
        'Tổng 12.000.000 VNĐ',
        'Xe 4 chỗ 350.000đ, 7 chỗ 450.000đ',
        `Ngày ${near(today, '-')} xe đón 15:30`,
        `Đón ${near(today, '.')} lúc 07:00`,
        `Đón ${near(today, '/')}`,
        'Phòng 202, 2 khách',
        'Phòng 202, 203, 204',
        'Phòng 202; 203',
      ];
      // ── bị chặn: một yêu cầu cho `complete`, một cho `decline` (422 không đổi trạng thái) ──
      const [forComplete, forDecline] = await newRequests(request, fd, 2);
      for (const id of [forComplete!, forDecline!]) {
        const a = await act(request, fd, id, 'acknowledge');
        expect(a.status, JSON.stringify(a.body).slice(0, 200)).toBe(200);
      }
      const wrong: string[] = [];
      for (const text of BLOCKED) {
        for (const [id, action, body] of [
          [forComplete!, 'complete', { replyNote: text }],
          [forDecline!, 'decline', { declinedReasonCode: 'other', replyNote: text }],
        ] as const) {
          const r = await act(request, fd, id, action, body);
          const codes = JSON.stringify(r.body.errors ?? []);
          if (
            r.status !== 422 ||
            !codes.includes('SENSITIVE_DATA_DETECTED') ||
            !codes.includes('replyNote')
          )
            wrong.push(`${action} "${text}" → ${r.status} ${codes.slice(0, 120)}`);
        }
      }
      expect(wrong, 'ví dụ "Bị chặn" phải 422 SENSITIVE_DATA_DETECTED').toEqual([]);
      // ── không bị chặn: mỗi ví dụ đóng một yêu cầu bằng `complete` ──
      const ids: string[] = [];
      while (ids.length < allowed.length)
        ids.push(...(await newRequests(request, fd, Math.min(5, allowed.length - ids.length))));
      const refused: string[] = [];
      for (const [i, text] of allowed.entries()) {
        expect((await act(request, fd, ids[i]!, 'acknowledge')).status).toBe(200);
        const r = await act(request, fd, ids[i]!, 'complete', { replyNote: text });
        if (r.status !== 200)
          refused.push(`"${text}" → ${r.status} ${JSON.stringify(r.body).slice(0, 120)}`);
      }
      expect(refused, 'ví dụ "Không bị chặn" phải 200').toEqual([]);
      // ── `decline` với ví dụ không bị chặn cũng được ──
      const d = await act(request, fd, forDecline!, 'decline', {
        declinedReasonCode: 'other',
        replyNote: 'Xe 7 chỗ 450.000đ, phòng 202, 203',
      });
      expect(d.status, JSON.stringify(d.body).slice(0, 200)).toBe(200);
      // ── `note` của khách không qua luật B-15 (chỉ kiểm số thẻ) ──
      const c = await s2Context(request);
      const st = await farStay(request, c, fd, today, { adults: 1 });
      const g = await openGuest(request, (await guestLink(request, fd, st.res.id)).token);
      const own = await guestCall<Json>(request, 'POST', '/v1/guest/requests', g.cookie, {
        idempotencyKey: true,
        body: { type: 'other', note: 'Ma dat cho Agoda 482913' },
      });
      expect(own.status, `note khách có 6 chữ số: ${JSON.stringify(own.body).slice(0, 200)}`).toBe(
        201,
      );
    });
  },
);
