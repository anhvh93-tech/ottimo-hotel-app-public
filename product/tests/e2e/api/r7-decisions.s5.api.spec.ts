// Kiểm lại tiền lần 7 – quyết định 18/10 ở tầng API (project "api", đơn ngày xa, đồng hồ thật):
// - TC-L3-087: BUG-R2-205 (R7ALL-01, ARC 16.29) – giấy tờ chính gửi không `partyMemberId` cho người đặt mà hồ sơ thiếu ngày sinh
//   → server thêm người đi cùng (không khớp người đặt chỉ bằng tên – ARC 16.22, SEC-BE-73): 201 kèm cảnh báo
//   `partyOverCount`, không phụ thu lúc nhập giấy tờ. Oracle BR-601-02.
import { expect, test } from '@playwright/test';
import { call, needSeedPassword, sessionOrSkip, stackToday } from '../support/api.js';
import { cleanupTracked, oracle, s2Context } from '../support/s2.js';
import { EP3, addDocument, getFolio, liveLines, p3, vnDoc } from '../support/s3.js';
import { farStay } from '../support/s3-checkin.js';

type Json = Record<string, unknown>;

test.describe('Kiểm lại tiền lần 7 – quyết định 18/10 (API)', { tag: ['@api', '@sprint4'] }, () => {
  test.beforeEach(() => needSeedPassword());
  test.afterEach(async ({ request }) => cleanupTracked(request));

  test('TC-L3-087 (A) BR-601-02 / BUG-R2-205: đơn 1 người lớn, hồ sơ người đặt thiếu ngày sinh; giấy tờ chính gửi không `partyMemberId` → 201, `partyOverCount` 1 (có mặt 2 > 1), không dòng phụ thu người', async ({
    request,
  }) => {
    const ex = oracle('BR-601-02');
    const exp = ex.expected as Json;
    const fd = await sessionOrSkip(request, 'qa.fd');
    const c = await s2Context(request);
    const st = await farStay(request, c, fd, await stackToday(request), { adults: 1, doc: false });
    // hồ sơ người đặt không có ngày sinh → server không khớp được giấy tờ với người đặt (không khớp chỉ bằng tên)
    const r = await addDocument(request, fd, st.regId, vnDoc(st.guestName));
    expect(r.status, `addGuestDocument: ${JSON.stringify(r.body).slice(0, 300)}`).toBe(
      Number(exp.status),
    );
    expect((r.body as Json).partyOverCount, 'cảnh báo vượt số khách').toBe(
      Number(exp.partyOverCount),
    );
    const p = await call<Json>(
      request,
      'GET',
      p3(EP3.listParty, fd, { reservationId: st.res.id }),
      {
        session: fd,
      },
    );
    expect(p.status).toBe(200);
    expect(p.body).toMatchObject({
      requiredCount: Number(exp.requiredCount),
      presentCount: Number(exp.presentCount),
    });
    const f = await getFolio(request, fd, st.res.folioId!);
    expect(liveLines(f, 'extra_person'), 'không phụ thu lúc nhập giấy tờ').toHaveLength(
      Number(exp.extraPersonLinesWritten),
    );
  });
});
