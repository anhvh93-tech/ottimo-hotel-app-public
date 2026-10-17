// Known open defects / contract items not built yet that an E2E case marks with test.fail (rounds/round-02/qa/s4-test-plan.md mục 3.3).
//
// Bài học BUG-R2-064 (QC-S3-04): `test.fail` gọi GIỮA ca thì lỗi xảy ra trước dòng đó bị lượt chạy lại che mất.
// Quy ước Sprint 4:
//   1. knownBug(...) là lệnh ĐẦU TIÊN của ca (trước mọi bước) – ca chỉ chứa các bước của lỗi đã biết;
//   2. bước dựng dữ liệu không thuộc lỗi đó chạy trong precondition(): hỏng → ca chuyển lại "phải đạt" và báo ĐỎ,
//      không bị test.fail che (annotation `precondition-failed`);
//   3. đóng lỗi = PR sửa lỗi XÓA dòng của nó trong OPEN (QA review). Quên xóa → Playwright báo
//      "expected to fail but passed" → CI đỏ, nên không có ca nào "xanh giả" sau khi sửa;
//   4. kiểm nhánh sửa ở máy mà không sửa tệp này: E2E_FIXED_BUGS=BUG-R2-058,S4-21 (danh sách mã, cách nhau dấu phẩy).
import { test } from '@playwright/test';

/** Mã → mô tả ngắn (mục S4, vai sửa). Chỉ ghi mục ĐANG MỞ trên nhánh chính. */
export const OPEN: Readonly<Record<string, string>> = {
  'US-151/AC7':
    'Landing mock v1.2 (FB-INV-002 ý 4): thanh cố định/đầu trang chỉ "Đặt phòng" + "Chat Zalo"; WhatsApp/Telegram/Viber trong "Kênh khác" thu gọn – FE-LP',
};

function fixedByEnv(): Set<string> {
  return new Set(
    (process.env.E2E_FIXED_BUGS ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

/**
 * Gọi ở DÒNG ĐẦU của ca. Ghi annotation `bug` cho mọi mã; nếu còn ít nhất một mã đang mở (không có trong
 * E2E_FIXED_BUGS) thì đánh `test.fail` ngay – trước mọi bước, nên lượt chạy lại không còn che được lỗi khác.
 * Mã lạ (không có trong OPEN) coi như đã đóng: ca phải đạt.
 */
export function knownBug(...ids: string[]): void {
  const bad = ids.filter(
    (id) =>
      !/^(BUG-R2-\d{3}|S4-\d{2}[a-c]?|DOM-S4-\d{2}|B-\d{1,2}|US-\d{3}(\/AC\d+[a-z]?)?)$/.test(id),
  );
  if (bad.length) throw new Error(`knownBug: mã không đúng dạng ${bad.join(', ')}`);
  const fixed = fixedByEnv();
  const open = ids.filter((id) => OPEN[id] !== undefined && !fixed.has(id));
  for (const id of ids) {
    test.info().annotations.push({
      type: 'bug',
      description: `${id}${OPEN[id] ? ` – ${OPEN[id]}` : ' – đã đóng'}${fixed.has(id) ? ' (E2E_FIXED_BUGS)' : ''}`,
    });
  }
  if (open.length > 0) test.fail(true, `Lỗi đã biết còn mở: ${open.join(', ')}`);
}

/**
 * Bước dựng dữ liệu (không phải chủ đề của lỗi đã biết). Hỏng → ca chuyển lại "phải đạt" (đỏ) và ghi annotation,
 * để test.fail không che lỗi môi trường/hồi quy ở bước trước (BUG-R2-064). test.skip bên trong vẫn là bỏ qua.
 */
export async function precondition<T>(title: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await test.step(`tiền điều kiện: ${title}`, fn);
  } catch (e) {
    const info = test.info();
    if (info.expectedStatus === 'failed') {
      info.expectedStatus = 'passed';
      info.annotations.push({
        type: 'precondition-failed',
        description: `${title} – hỏng ở bước dựng dữ liệu, không thuộc lỗi đã biết → ca báo đỏ (BUG-R2-064)`,
      });
    }
    throw e;
  }
}
