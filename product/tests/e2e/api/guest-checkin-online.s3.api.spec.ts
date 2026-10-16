// KHUNG E2E Sprint 3 (pending) – L7 – Check-in online trên guest-web (US-106, US-107 – Sprint 3).
// Sinh từ product/tests/test-cases/r1-main-flows.md (QA, khởi động Sprint 3 – 16/10/2026). Mỗi TC một test.fixme có
// mã TC, story/AC, tầng, ưu tiên và tóm tắt bước/kỳ vọng. QA điền thân test khi ARC chốt OpenAPI 0.3.6 (nhóm B) và
// endpoint có trên build: đổi test.fixme → test, gọi requireEndpoints(...) như các spec Sprint 2.
// Không sửa tay phần mô tả: sửa TC trong r1-main-flows.md rồi chép lại.
import { test } from '@playwright/test';

const WAITING = 'OpenAPI 0.3.6 (ARC) + endpoint Sprint 3 trên build';

test.describe(
  'L7 – Check-in online trên guest-web (US-106, US-107 – Sprint 3)',
  { tag: ['@api', '@sprint3', '@pending'] },
  () => {
    test.describe('', () => {
      test.fixme(
        'TC-L7-001 US-106/AC1 [A+E · Cao]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-106/AC1' },
            { type: 'endpoints', description: 'issueGuestLink, openGuestSession, getGuestStay' },
          ],
        },
        async () => {
          // Tiền điều kiện: Đơn confirmed
          // Bước: qa.fd bấm "Gửi link check-in", sao chép; mở trên Safari iOS giả lập
          // Kỳ vọng: Link riêng của đơn; mở vào thẳng trang của đơn, không cài app, không tạo tài khoản; cookie
          //   ottimo_gsid
          // Quy tắc: ADR-006, A22
        },
      );
      test.fixme(
        'TC-L7-002 US-106/AC2 [A · Cao]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-106/AC2' },
            { type: 'endpoints', description: 'getGuestStay, getGuestFolio' },
          ],
        },
        async () => {
          // Tiền điều kiện: Link đơn A, đơn B; đơn dài hạn C
          // Bước: (a) Phiên khách A gọi API với id đơn B; (b) trả phòng A rồi mở link A; (c) C trả phòng tháng
          //   nhưng HĐ chưa closed
          // Kỳ vọng: (a) 404/không có dữ liệu B; (b) sau trả phòng (+ thời gian ân hạn guest_link_grace_hours nếu
          //   có) → 401 GUEST_LINK_INVALID; (c) link C còn hiệu lực đến khi HĐ closed
          // Quy tắc: rbac 8.6, SEC F09
        },
      );
      test.fixme(
        'TC-L7-003 US-106/AC3 [A+E · Cao]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-106/AC3' },
            { type: 'endpoints', description: 'verifyGuestSession, getGuestFolio, getGuestStay' },
          ],
        },
        async () => {
          // Tiền điều kiện: Phiên khách mức 1
          // Bước: Mở giấy tờ, hóa đơn, mã cửa; xác minh bằng OTP email đúng
          // Kỳ vọng: Mức 1: JSON không có bill, mã cửa, họ tên đầy đủ, liên hệ, người đi cùng (SR-GST-06); sau
          //   OTP đúng: mở được. Chi tiết OTP, mã lễ tân, khóa sai, hết hạn: TC-SEC-001 … TC-SEC-008
          // Quy tắc: ADR-006, SR-GST-06, SR-GST-07, decision-log 15/10 SEC (mức 2 = OTP email hoặc mã xác minh lễ
          //   tân; không dùng mã đặt phòng, 4 số cuối SĐT)
        },
      );
      test.fixme(
        'TC-L7-004 US-106/– [A · TB]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-106/–' },
            { type: 'endpoints', description: 'revokeGuestLink, issueGuestLink, openGuestSession' },
          ],
        },
        async () => {
          // Tiền điều kiện: Link đơn A đã gửi
          // Bước: qa.fd thu hồi link, tạo link mới
          // Kỳ vọng: Link cũ 401 GUEST_LINK_INVALID; link mới hoạt động; link gắn với đơn, không gắn với phòng
          // Quy tắc: SEC F09
        },
      );
      test.fixme(
        'TC-L7-010 US-107/AC1 [A+E · Cao]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-107/AC1' },
            {
              type: 'endpoints',
              description:
                'getOnlineCheckin, uploadGuestDocument, updateOnlineCheckin, recordGuestConsent, completeOnlineCheckin',
            },
          ],
        },
        async () => {
          // Tiền điều kiện: Khai báo none, 2 người lớn
          // Bước: Khách đọc thông báo xử lý dữ liệu → tải giấy tờ 2 người → giờ đến 21:30 → chọn đồng ý lưu ảnh
          //   (không tích sẵn) → hoàn tất
          // Kỳ vọng: Khai báo pre; qa.fd thấy giờ đến 21:30 và nhận thông báo
          // Quy tắc: SM-05 K2, BR-609
        },
      );
      test.fixme(
        'TC-L7-011 US-107/AC2 [E · TB]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-107/AC2' },
            { type: 'endpoints', description: 'getOnlineCheckin' },
          ],
        },
        async () => {
          // Tiền điều kiện: Khách bỏ dở sau khi tải giấy tờ người 1
          // Bước: Mở lại link
          // Kỳ vọng: Tiếp tục ở bước giấy tờ người 2; dữ liệu đã nhập còn
          // Quy tắc: –
        },
      );
      test.fixme(
        'TC-L7-012 US-107/AC3 [A · Cao]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-107/AC3' },
            { type: 'endpoints', description: 'recordGuestConsent, completeOnlineCheckin' },
          ],
        },
        async () => {
          // Tiền điều kiện: Như TC-L7-010
          // Bước: Chọn Không đồng ý
          // Kỳ vọng: Vẫn hoàn tất check-in online; ảnh đánh dấu xóa sau khi khai báo confirmed
          // Quy tắc: BR-609, R-REG-05
        },
      );
      test.fixme(
        'TC-L7-013 US-107/AC4 [A+E · TB]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-107/AC4' },
            { type: 'endpoints', description: 'uploadGuestDocument, openGuestSession' },
          ],
        },
        async () => {
          // Tiền điều kiện: –
          // Bước: Tải tệp .exe, tệp ảnh 25 MB; mở link hết hạn; mở link sai
          // Kỳ vọng: Lỗi rõ + cho tải lại; link hết hạn/sai → trang lỗi kèm cách liên hệ lễ tân
          // Quy tắc: R-REG-08
        },
      );
      test.fixme(
        'TC-L7-014 US-107/AC5 [E · Cao]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-107/AC5' },
            { type: 'endpoints', description: 'getOnlineCheckin' },
          ],
        },
        async () => {
          // Tiền điều kiện: Trình duyệt tiếng Anh
          // Bước: Đi hết các bước
          // Kỳ vọng: Mọi chữ, kể cả thông báo xử lý dữ liệu và mục đồng ý, bằng tiếng Anh đã duyệt
          // Quy tắc: HR-01
        },
      );
      test.fixme(
        'TC-L7-015 US-107/– [A · TB]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-107/–' },
            { type: 'endpoints', description: 'getOnlineCheckin' },
          ],
        },
        async () => {
          // Tiền điều kiện: Khách đã tải ảnh
          // Bước: Tìm cách xem lại ảnh đã tải
          // Kỳ vọng: Chỉ thấy trạng thái "đã nhận/đã khai", không xem lại ảnh
          // Quy tắc: rbac ghi chú 7
        },
      );
    });
  },
);
