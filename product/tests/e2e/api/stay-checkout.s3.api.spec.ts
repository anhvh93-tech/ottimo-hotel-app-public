// KHUNG E2E Sprint 3 (pending) – L4 – Lưu trú, trả phòng 3 bước, bill, VietQR, thu tiền (EP04, EP05, EP15 – Sprint 3).
// Sinh từ product/tests/test-cases/r1-main-flows.md (QA, khởi động Sprint 3 – 16/10/2026). Mỗi TC một test.fixme có
// mã TC, story/AC, tầng, ưu tiên và tóm tắt bước/kỳ vọng. QA điền thân test khi ARC chốt OpenAPI 0.3.6 (nhóm B) và
// endpoint có trên build: đổi test.fixme → test, gọi requireEndpoints(...) như các spec Sprint 2.
// Không sửa tay phần mô tả: sửa TC trong r1-main-flows.md rồi chép lại.
import { test } from '@playwright/test';

const WAITING = 'OpenAPI 0.3.6 (ARC) + endpoint Sprint 3 trên build';

test.describe(
  'L4 – Lưu trú, trả phòng 3 bước, bill, VietQR, thu tiền (EP04, EP05, EP15 – Sprint 3)',
  { tag: ['@api', '@sprint3', '@pending'] },
  () => {
    test.describe('5.1 Gia hạn, trả muộn, nhắc trả phòng, phát sinh', () => {
      test.fixme(
        'TC-L4-001 US-028/AC1 [A+E · Cao]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-028/AC1' },
            { type: 'endpoints', description: 'getExtensionOptions' },
          ],
        },
        async () => {
          // Tiền điều kiện: DS-E; đơn Trực tiếp 201 in_house 13→16/10; 201 trống 16, 17, 18/10, đêm 19/10 đã có
          //   đơn
          // Bước: Mở gia hạn; thử chọn 4 đêm; (dữ liệu mới, 201 trống 10 đêm) thử 8 đêm
          // Kỳ vọng: Chọn tối đa 3 đêm, mỗi đêm ghi "Trống"; 4 đêm → không chọn được (đêm 19/10 kín); 8 đêm →
          //   vượt giới hạn 7 đêm BR-421, hướng sang báo giá dài hạn
          // Quy tắc: BR-421, BR-108
        },
      );
      test.fixme(
        'TC-L4-002 US-028/AC2 [A+U · Cao]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-028/AC2' },
            { type: 'endpoints', description: 'getExtensionOptions, extendStay' },
          ],
        },
        async () => {
          // Tiền điều kiện: Đơn Trực tiếp 201 giá 700.000; (dữ liệu mới) đơn Trực tiếp có đêm gia hạn rơi vào
          //   24/12
          // Bước: Gia hạn 2 đêm ngày thường; gia hạn qua 24/12
          // Kỳ vọng: 2 đêm = 1.400.000 (giữ giá đơn – ví dụ BR-421); đêm 24/12 lấy giá ngày đặc biệt của lịch giá
          //   kênh Trực tiếp
          // Quy tắc: BR-421, BR-104, SM-01 B13
        },
      );
      test.fixme(
        'TC-L4-003 US-028/AC3 [A · Cao]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-028/AC3' },
            { type: 'endpoints', description: 'extendStay, getReservation, getFolio' },
          ],
        },
        async () => {
          // Tiền điều kiện: (a) Đơn Booking.com 401 giá 990.000 in_house; (b) đơn Airbnb in_house
          // Bước: (a) Gia hạn 1 đêm; (b) gia hạn 2 đêm
          // Kỳ vọng: (a) tạo đơn con kênh Trực tiếp liên kết đơn gốc, giá 1.042.000 (giá trực tiếp hiện hành),
          //   folio chung, đơn OTA gốc không đổi; (b) thông báo "tiết kiệm 15,5% phí kênh ≈ 323.000" – tỷ lệ đọc
          //   từ cấu hình kênh (đổi tỷ lệ cấu hình → thông báo đổi theo)
          // Quy tắc: BR-422, BR-421, BR-901, BL #12, BL #13
        },
      );
      test.fixme(
        'TC-L4-004 US-028/AC4 [A · Cao]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-028/AC4' },
            { type: 'endpoints', description: 'extendStay, listHkTasks, getRegistration' },
          ],
        },
        async () => {
          // Tiền điều kiện: Đơn khách NN in_house, khai báo confirmed, buồng OC, có việc "Dọn trả phòng" ngày đi
          // Bước: Gia hạn 1 đêm
          // Kỳ vọng: Ngày đi cập nhật; buồng → OD; việc "Dọn trả phòng" đổi thành "Dọn phòng khách đang ở"; 1
          //   lệnh outbox; khai báo → needs_update; hạn thu tiền gia hạn = muộn nhất 14:00 ngày đầu phần gia hạn
          //   (BR-423)
          // Quy tắc: BR-802, BR-423, BR-604, BR-905
        },
      );
      test.fixme(
        'TC-L4-005 US-028/AC5 [P+A · Cao]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-028/AC5' },
            { type: 'endpoints', description: 'extendStay, createReservation' },
          ],
        },
        async () => {
          // Tiền điều kiện: Đơn in_house 201 đi 16/10; 201 trống 16/10
          // Bước: Đồng thời: qa.fd gia hạn đêm 16/10 và qa.fd2 tạo đơn mới 201 đêm 16/10 (lặp 20 lần)
          // Kỳ vọng: Mỗi lần đúng 1 thao tác thành công, thao tác kia 409 ROOM_UNAVAILABLE
          // Quy tắc: BR-906
        },
      );
      test.fixme(
        'TC-L4-010 US-029/AC1 [A+E · Cao]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-029/AC1' },
            { type: 'endpoints', description: 'setLateCheckout' },
          ],
        },
        async () => {
          // Tiền điều kiện: Đơn giá đêm cuối 700.000, đi hôm nay, căn không có khách đến
          // Bước: Đặt trả muộn 15:00 (dryRun rồi ghi); dữ liệu mới: 17:00
          // Kỳ vọng: 15:00 → 210.000, 17:00 → 350.000 (ví dụ BR-412); số tiền hiện trước khi lưu (dryRun không
          //   ghi dữ liệu); chỉ ghi folio khi lễ tân xác nhận
          // Quy tắc: BR-412, BR-414, SM-01 B15
        },
      );
      test.fixme(
        'TC-L4-011 US-029/AC1 [U+A · Cao]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-029/AC1' },
            { type: 'endpoints', description: 'setLateCheckout, setParameter' },
          ],
        },
        async () => {
          // Tiền điều kiện: Như trên; giá đêm cuối 700.000; ân hạn mặc định 12:30
          // Bước: Căn không có khách đến hôm nay, giờ trả: 12:00; 12:30; 12:31; 15:00; 15:01; 18:00. Căn có khách
          //   đến hôm nay: 12:01; 12:20. Sau đó qa.owner đặt ân hạn 13:00, thử 13:00 và 13:01 (không có khách
          //   đến)
          // Kỳ vọng: Không có khách đến: 12:00 → 0; 12:30 → 0; 12:31 → 210.000; 15:00 → 210.000; 15:01 → 350.000;
          //   18:00 → 350.000 (oracle BR-412-01…11). Có khách đến: 12:01 → 210.000; 12:20 → 210.000 (không ân
          //   hạn). Ân hạn 13:00: 13:00 → 0; 13:01 → 210.000 (ân hạn không dời mốc bậc)
          // Quy tắc: BR-412 (biên, INV quyết ESC-007), late_grace_until, late_grace_requires_no_same_day_arrival,
          //   BL #4
        },
      );
      test.fixme(
        'TC-L4-012 US-029/AC2 [A · Cao]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-029/AC2' },
            { type: 'endpoints', description: 'setLateCheckout' },
          ],
        },
        async () => {
          // Tiền điều kiện: Căn 203 trả muộn 15:00; có khách đến 203 hôm nay ETA 14:00; (a) không còn căn Lầu 1–2
          //   trống; (b) còn 202 trống
          // Bước: (a) qa.fd đặt trả muộn; qa.mgr đặt trả muộn. (b) qa.fd đặt trả muộn
          // Kỳ vọng: (a) qa.fd: 409 LATE_CHECKOUT_CONFLICT; qa.mgr: được (duyệt). (b) được kèm cảnh báo nêu tên
          //   khách đến và giờ đến dự kiến 14:00
          // Quy tắc: BR-416, A16
        },
      );
      test.fixme(
        'TC-L4-013 US-029/AC3 [A · Cao]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-029/AC3' },
            { type: 'endpoints', description: 'setLateCheckout, getExtensionOptions' },
          ],
        },
        async () => {
          // Tiền điều kiện: Đơn đi hôm nay
          // Bước: Đặt trả muộn 18:01; 19:00
          // Kỳ vọng: Không ghi phụ thu; chuyển sang luồng gia hạn 1 đêm (kiểm trùng, khóa đêm trên kênh)
          // Quy tắc: BR-416, BR-421
        },
      );
      test.fixme(
        'TC-L4-014 US-029/AC4 [A · TB]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-029/AC4' },
            {
              type: 'endpoints',
              description: 'setLateCheckout, listHkTasks, getDoorCredential, listCheckoutReminders',
            },
          ],
        },
        async () => {
          // Tiền điều kiện: Như TC-L4-010 (15:00)
          // Bước: Lưu trả muộn
          // Kỳ vọng: Việc dọn của căn ghi "dọn sau 15:00"; hiệu lực mã cửa kéo tới 15:00; nhật ký nhắc ghi giờ
          //   trả đã chốt
          // Quy tắc: BR-403, SM-14
        },
      );
      test.fixme(
        'TC-L4-020 US-030/AC1 [A+E · TB]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-030/AC1' },
            { type: 'endpoints', description: 'recordCheckoutConfirmation, listCheckoutReminders' },
          ],
        },
        async () => {
          // Tiền điều kiện: Đơn đi hôm nay
          // Bước: Lễ tân chọn giờ 11:00, ghi chú "Gọi điện"
          // Kỳ vọng: Nhật ký nhắc có dòng "Gọi điện – khách trả lúc 11:00", người ghi, thời điểm
          // Quy tắc: UC-14
        },
      );
      test.fixme(
        'TC-L4-021 US-030/AC2 [A+E · TB]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-030/AC2' },
            { type: 'endpoints', description: 'getArrivalsDepartures' },
          ],
        },
        async () => {
          // Tiền điều kiện: Sau TC-L4-020
          // Bước: Xem thẻ "khách trả phòng hôm nay"
          // Kỳ vọng: Thẻ đơn đó chuyển "đã trả lời"
          // Quy tắc: –
        },
      );
      test.fixme(
        'TC-L4-022 US-031/AC1 [A · Cao]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-031/AC1' },
            { type: 'endpoints', description: 'getArrivalsDepartures, listCheckoutReminders' },
          ],
        },
        async () => {
          // Tiền điều kiện: Đơn in_house đi 16/10, khách chưa trả lời
          // Bước: ⏱ 15/10 19:59, 20:00; 16/10 08:59, 09:00; 10:59, 11:00; 11:59, 12:00 – mỗi mốc ▶ J4
          // Kỳ vọng: Thẻ đổi đúng thứ tự: (20:00) nhắc lần 1 → (09:00) "Đã nhắc, chờ khách trả lời" → (11:00)
          //   "Chưa trả lời – lễ tân gọi xác nhận" → (12:00) "Quá giờ trả phòng" báo đỏ cho qa.fd + qa.mgr; trước
          //   mỗi mốc 1 phút chưa đổi; chạy J4 hai lần cùng mốc không nhắc trùng
          // Quy tắc: BR-425, BR-001, J4
        },
      );
      test.fixme(
        'TC-L4-023 US-031/AC2 [A+E · TB]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-031/AC2' },
            { type: 'endpoints', description: 'getArrivalsDepartures' },
          ],
        },
        async () => {
          // Tiền điều kiện: 2 đơn đi hôm nay chưa trả lời; căn của đơn thứ 2 có khách đến hôm nay
          // Bước: Xem danh sách thẻ
          // Kỳ vọng: Đơn thứ 2 được xếp lên đầu
          // Quy tắc: BR-425
        },
      );
      test.fixme(
        'TC-L4-024 US-031/– [A · Thấp]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-031/–' },
            { type: 'endpoints', description: 'listCheckoutReminders' },
          ],
        },
        async () => {
          // Tiền điều kiện: Worker dừng từ 19:00 đến 08:30 hôm sau
          // Bước: Khởi động worker lúc 08:30
          // Kỳ vọng: Nhắc "20:00 hôm trước" không gửi bù (trễ > job_catchup_minutes), job_run ghi skipped
          // Quy tắc: BR-425, architecture 9.1 J4 (bắt kịp)
        },
      );
      test.fixme(
        'TC-L4-025 US-137/– [A · TB]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-137/–' },
            { type: 'endpoints', description: 'earlyDeparture, listApprovalRequests' },
          ],
        },
        async () => {
          // Tiền điều kiện: Đơn Trực tiếp 4 đêm × 700.000 in_house; story Should R2
          // Bước: (a) Khách báo trước 1 ngày, bỏ 2 đêm cuối; (b) dữ liệu mới: báo trong ngày
          // Kỳ vọng: (a) hoàn 700.000 (50% của 2 đêm – ví dụ BR-428), yêu cầu hoàn chờ qa.mgr duyệt, 2 đêm mở bán
          //   + outbox, khai báo NN needs_update; (b) không hoàn, các đêm còn lại vẫn mở bán
          // Quy tắc: BR-428, SM-01 B16, BR-522, BR-011 (ngày mốc = ngày rời đi mới)
        },
      );
      test.fixme(
        'TC-L4-030 US-032/AC1 [A+E · Cao]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-032/AC1' },
            { type: 'endpoints', description: 'getChargeCatalog, addFolioLine, adjustFolioLine' },
          ],
        },
        async () => {
          // Tiền điều kiện: Đơn in_house; danh mục phí BR-511
          // Bước: Thêm "Khử mùi thuốc lá" và "Mất/hỏng thẻ phòng" (kèm ảnh); sửa số lượng thẻ 1 → 2
          // Kỳ vọng: Giá mặc định 500.000 và 200.000/thẻ; loại dòng "Phí phạt" (không vào doanh thu phòng); sửa
          //   số lượng được, có nhật ký; 1 khử mùi + 1 thẻ = 700.000
          // Quy tắc: BR-511, BR-904, BR-008
        },
      );
      test.fixme(
        'TC-L4-031 US-032/AC2 [A · Cao]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-032/AC2' },
            { type: 'endpoints', description: 'addFolioLine' },
          ],
        },
        async () => {
          // Tiền điều kiện: Như trên
          // Bước: Thêm dòng phí phạt/hư hỏng không ảnh và không ghi chú
          // Kỳ vọng: 422 VALIDATION_FAILED (thiếu bằng chứng)
          // Quy tắc: BR-511, BR-512
        },
      );
      test.fixme(
        'TC-L4-032 US-032/AC3 [A+E · Cao]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-032/AC3' },
            { type: 'endpoints', description: 'addFolioLine, getFolio, getGuestFolio' },
          ],
        },
        async () => {
          // Tiền điều kiện: Đơn còn phải thu 0
          // Bước: Thêm phí 200.000
          // Kỳ vọng: "Còn phải thu" = 200.000 ở chi tiết đơn và app khách (cùng số)
          // Quy tắc: –
        },
      );
      test.fixme(
        'TC-L4-033 US-032/AC4 [A · TB]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-032/AC4' },
            { type: 'endpoints', description: 'addFolioLine, listApprovalRequests' },
          ],
        },
        async () => {
          // Tiền điều kiện: Món hư "Đèn ngủ" không có trong bảng BR-512
          // Bước: Lễ tân thêm dòng
          // Kỳ vọng: Tạo yêu cầu định giá cho qa.mgr/qa.owner (SM-10), chưa có số tiền trên folio
          // Quy tắc: BR-512, SM-10
        },
      );
      test.fixme(
        'TC-L4-034 US-032/– [U · Thấp]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-032/–' },
            { type: 'endpoints', description: 'getChargeCatalog' },
          ],
        },
        async () => {
          // Tiền điều kiện: Bảng đền bù tạm
          // Bước: Thêm khăn tắm, ly, remote
          // Kỳ vọng: 150.000; 50.000; 200.000
          // Quy tắc: BR-512
        },
      );
    });
    test.describe('5.2 Trả phòng 3 bước, bill, thu tiền', () => {
      test.fixme(
        'TC-L4-040 US-035/AC1 [A+E · Cao]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-035/AC1' },
            { type: 'endpoints', description: 'recordMinibarCheck, getCheckoutSummary' },
          ],
        },
        async () => {
          // Tiền điều kiện: Căn 201 tủ chuẩn có 2 lon Coca
          // Bước: Bước 1: nhập Coca còn 0
          // Kỳ vọng: Đã dùng 2; tiền = 2 × giá bán Coca trong danh mục
          // Quy tắc: BR-702, BR-703, BR-426
        },
      );
      test.fixme(
        'TC-L4-041 US-035/AC2 [A · TB]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-035/AC2' },
            { type: 'endpoints', description: 'recordMinibarCheck' },
          ],
        },
        async () => {
          // Tiền điều kiện: Nước suối "miễn phí", chuẩn 2
          // Bước: Nhập còn 0
          // Kỳ vọng: Dòng ghi "Miễn phí", 0 đ; tiêu hao 2 vẫn ghi (trừ kho)
          // Quy tắc: BR-701
        },
      );
      test.fixme(
        'TC-L4-042 US-035/AC3 [A+E · TB]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-035/AC3' },
            { type: 'endpoints', description: 'recordMinibarCheck' },
          ],
        },
        async () => {
          // Tiền điều kiện: Chuẩn Coca 2
          // Bước: Nhập còn 3; nhập −1
          // Kỳ vọng: Bị chặn (422); giao diện dùng nút +/− không cho vượt khoảng 0…chuẩn
          // Quy tắc: BR-702
        },
      );
      test.fixme(
        'TC-L4-043 US-035/– [U · Cao]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-035/–' },
            { type: 'endpoints', description: 'recordMinibarCheck' },
          ],
        },
        async () => {
          // Tiền điều kiện: Bia 35.000, snack 30.000, nước suối miễn phí
          // Bước: Dùng 2 bia, 1 snack, 2 nước
          // Kỳ vọng: Tổng 100.000
          // Quy tắc: BR-702 (ví dụ)
        },
      );
      test.fixme(
        'TC-L4-044 US-036/AC1 [A+E · Cao]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-036/AC1' },
            { type: 'endpoints', description: 'getCheckoutSummary' },
          ],
        },
        async () => {
          // Tiền điều kiện: (a) đơn đã hẹn trả muộn 15:00 giá đêm cuối 700.000; (b) đơn không hẹn
          // Bước: Mở bước 2
          // Kỳ vọng: (a) giờ trả mặc định 15:00, phụ thu 210.000; (b) giờ trả mặc định 12:00, phụ thu 0
          // Quy tắc: BR-412, BR-414, BR-401
        },
      );
      test.fixme(
        'TC-L4-045 US-036/AC2 [E · TB]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-036/AC2' },
            { type: 'endpoints', description: 'getCheckoutSummary' },
          ],
        },
        async () => {
          // Tiền điều kiện: Bước 2
          // Bước: Nhập giặt ủi 120.000, chọn "Chuyển khoản QR"
          // Kỳ vọng: Bảng tóm tắt "Còn phải thu" tăng 120.000 ngay (không cần lưu)
          // Quy tắc: BR-521, BR-507
        },
      );
      test.fixme(
        'TC-L4-046 US-036/AC3 [A+E · TB]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-036/AC3' },
            { type: 'endpoints', description: 'getCheckoutSummary' },
          ],
        },
        async () => {
          // Tiền điều kiện: Đơn Airbnb "OTA thu hộ" có minibar 50.000
          // Bước: Mở bước 2, bước 3
          // Kỳ vọng: Tiền phòng không nằm trong "Còn phải thu"; chỉ còn 50.000 phát sinh tại quầy
          // Quy tắc: BR-307
        },
      );
      test.fixme(
        'TC-L4-047 US-036/AC3 [A · TB]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-036/AC3' },
            { type: 'endpoints', description: 'getCheckoutSummary' },
          ],
        },
        async () => {
          // Tiền điều kiện: Đơn Booking.com "OTA thu hộ", giá đêm cuối 760.000, trả muộn 15:00 đã hẹn
          // Bước: Mở bước 2 và 3
          // Kỳ vọng: Phụ thu trả muộn tính theo chính sách OTTIMO trên giá đêm cuối của đơn (30% = 228.000), là
          //   khoản thu trực tiếp tại quầy; tiền phòng vẫn "Đã thu qua OTA"
          // Quy tắc: BR-415, BR-412
        },
      );
      test.fixme(
        'TC-L4-048 US-036/AC3 [A · Cao]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-036/AC3' },
            { type: 'endpoints', description: 'getCheckoutSummary, checkOut' },
          ],
        },
        async () => {
          // Tiền điều kiện: Đơn Booking.com khách trả tại chỗ in_house, chưa thu tiền phòng 2.460.000, minibar
          //   50.000
          // Bước: Mở bước 2, 3; hoàn tất khi chưa thu; khách bấm "trả phòng nhanh" trên app
          // Kỳ vọng: "Còn phải thu" = 2.460.000 + 50.000 (khác TC-L4-046 kiểu OTA thu hộ); hoàn tất → 409
          //   BALANCE_DUE; trả phòng nhanh của khách bị chặn (BR-427)
          // Quy tắc: BR-307, SM-01 B18
        },
      );
      test.fixme(
        'TC-L4-050 US-037/AC1 [A+U · Cao (S)]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-037/AC1' },
            { type: 'endpoints', description: 'getCheckoutSummary, getBill' },
          ],
        },
        async () => {
          // Tiền điều kiện: Đơn 3 đêm × 820.000; minibar 25.000; phụ thu trả muộn 210.000 có FOC approved; chưa
          //   cọc
          // Bước: Mở bước 3 – bill
          // Kỳ vọng: Bill: 3 dòng tiền phòng 820.000; 1 dòng minibar 25.000; 1 dòng phụ thu 210.000; 1 dòng FOC
          //   −210.000; tổng 2.485.000; còn phải thu 2.485.000
          // Quy tắc: BR-412, BR-434, BR-008
        },
      );
      test.fixme(
        'TC-L4-051 US-037/AC2 [A+E · TB]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-037/AC2' },
            { type: 'endpoints', description: 'getBill' },
          ],
        },
        async () => {
          // Tiền điều kiện: (a) khách đứng tên hộ chiếu nước ngoài; (b) khách VN hồ sơ ngôn ngữ "English"; (c)
          //   khách VN tiếng Việt; tỷ giá 26.200 cập nhật 10/10
          // Bước: Xem bill
          // Kỳ vọng: (a), (b) bill song ngữ Việt – Anh + dòng quy đổi USD tham khảo kèm ngày cập nhật tỷ giá
          //   (13.908.000 đ ≈ 530,8 USD); (c) chỉ tiếng Việt
          // Quy tắc: BR-004, BR-009
        },
      );
      test.fixme(
        'TC-L4-052 US-037/AC3 [A · Cao]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-037/AC3' },
            { type: 'endpoints', description: 'getBill' },
          ],
        },
        async () => {
          // Tiền điều kiện: Đơn có giao dịch: cọc 700.000 succeeded; 300.000 failed; 200.000 reversed (+ dòng
          //   đảo); 100.000 pending
          // Bước: Xem bill
          // Kỳ vọng: "Đã thu" = 700.000 (chỉ succeeded thuần, đã trừ giao dịch đảo)
          // Quy tắc: SM-12, US-119
        },
      );
      test.fixme(
        'TC-L4-053 US-038/AC1 [A+E · Cao (S)]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-038/AC1' },
            { type: 'endpoints', description: 'getCheckoutSummary, checkOut' },
          ],
        },
        async () => {
          // Tiền điều kiện: Đơn khách NN in_house 201, đã thu đủ X, có tiêu hao minibar; ⏱ 15/10 11:40
          // Bước: Bấm "Đã thu X đ – hoàn tất" + xác nhận
          // Kỳ vọng: Đơn checked_out; folio settled với số bill dạng F26-nnnnnn (BR-007); buồng VD; mã cửa "đã
          //   hủy"; việc "Dọn trả phòng" + "Bổ sung minibar"; khai báo → needs_update
          // Quy tắc: SM-01 B18, SM-13 open→settled, SM-14 *→open, SM-11 projected→earned, BR-007, BR-604, SM-03
          //   R9
        },
      );
      test.fixme(
        'TC-L4-054 US-038/AC2 [A · Cao]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-038/AC2' },
            { type: 'endpoints', description: 'addFolioLine, adjustFolioLine' },
          ],
        },
        async () => {
          // Tiền điều kiện: Folio settled
          // Bước: (a) qa.fd thêm/sửa dòng; (b) qa.mgr tạo bút toán điều chỉnh có lý do; (c) qa.mgr không lý do
          // Kỳ vọng: (a) 409 FOLIO_LOCKED (hoặc 403); (b) được, dòng adjustment, nhật ký; (c) 422
          // Quy tắc: A32, ERD K7
        },
      );
      test.fixme(
        'TC-L4-055 US-038/AC3 [A · Cao (S)]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-038/AC3' },
            { type: 'endpoints', description: 'checkOut' },
          ],
        },
        async () => {
          // Tiền điều kiện: Còn phải thu 500.000, chưa ghi giao dịch
          // Bước: (a) qa.fd hoàn tất; (b) qa.mgr ghi công nợ có hạn thanh toán rồi hoàn tất
          // Kỳ vọng: (a) 409 BALANCE_DUE; (b) hoàn tất được, folio có debt_due_date, người duyệt qa.mgr
          // Quy tắc: BR-426, BR-525, A19
        },
      );
      test.fixme(
        'TC-L4-056 US-038/AC4 [A · Cao]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-038/AC4' },
            { type: 'endpoints', description: 'checkOut' },
          ],
        },
        async () => {
          // Tiền điều kiện: Folio có FOC escalated
          // Bước: Hoàn tất trả phòng
          // Kỳ vọng: 409 PENDING_APPROVALS
          // Quy tắc: SM-10
        },
      );
      test.fixme(
        'TC-L4-057 US-038/– [A · Cao]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-038/–' },
            { type: 'endpoints', description: 'checkOut' },
          ],
        },
        async () => {
          // Tiền điều kiện: Đơn đủ điều kiện trả phòng
          // Bước: Bấm hoàn tất 2 lần nhanh (cùng Idempotency-Key); gửi lại sau mất mạng
          // Kỳ vọng: Chỉ 1 lần chuyển trạng thái, 1 số bill; lần 2 trả phản hồi cũ Idempotent-Replayed: true
          // Quy tắc: ADR-009 mục 8
        },
      );
      test.fixme(
        'TC-L4-058 US-039/AC1 [A+U · TB]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-039/AC1' },
            { type: 'endpoints', description: 'setInvoiceRequest' },
          ],
        },
        async () => {
          // Tiền điều kiện: Tích "Khách lấy hóa đơn công ty"
          // Bước: MST: 0101234567; 0101234567-001; 0101234567001; 010123456; 01012345678; 01A1234567
          // Kỳ vọng: 10 số, 13 số (có/không gạch ngang) hợp lệ; 9 số, 11 số, có chữ → lỗi rõ tại ô MST
          // Quy tắc: BL 5.16, ERD invoice_request
        },
      );
      test.fixme(
        'TC-L4-059 US-039/AC2 [A · TB]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-039/AC2' },
            { type: 'endpoints', description: 'setInvoiceRequest, getBill, getGuest' },
          ],
        },
        async () => {
          // Tiền điều kiện: MST hợp lệ
          // Bước: Lưu tên công ty, MST, email
          // Kỳ vọng: Thông tin gắn với bill và hồ sơ khách; hóa đơn điện tử thật để R3 (US-122)
          // Quy tắc: BR-524, D16
        },
      );
      test.fixme(
        'TC-L4-060 US-119/AC1 [A+E · Cao (S)]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-119/AC1' },
            { type: 'endpoints', description: 'recordPayment, getFolio' },
          ],
        },
        async () => {
          // Tiền điều kiện: Đơn tổng 2.460.000 đã thu cọc 800.000
          // Bước: Ghi thu 1.660.000 chuyển khoản
          // Kỳ vọng: Còn phải thu 0; đơn có 2 giao dịch succeeded với cách thanh toán, người thu, thời điểm, mã
          //   PT-xxxxxx
          // Quy tắc: BR-521, SM-12 *→succeeded
        },
      );
      test.fixme(
        'TC-L4-061 US-119/AC2 [A · TB]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-119/AC2' },
            { type: 'endpoints', description: 'getFolio' },
          ],
        },
        async () => {
          // Tiền điều kiện: Đơn Booking "OTA thu hộ" 3 đêm, phát sinh 75.000
          // Bước: Xem còn phải thu
          // Kỳ vọng: Chỉ 75.000; tiền phòng không cộng
          // Quy tắc: BR-307
        },
      );
      test.fixme(
        'TC-L4-062 US-119/AC3 [A · Cao]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-119/AC3' },
            { type: 'endpoints', description: 'reversePayment' },
          ],
        },
        async () => {
          // Tiền điều kiện: Giao dịch ghi sai 1.660.000
          // Bước: (a) qa.fd đảo; (b) qa.mgr đảo không lý do; (c) qa.mgr đảo có lý do; (d) thử xóa giao dịch
          // Kỳ vọng: (a) 403; (b) 422; (c) giao dịch gốc reversed + giao dịch âm có lý do; (d) không có endpoint,
          //   DB từ chối DELETE
          // Quy tắc: A34, BR-008, ERD K8, SM-12 succeeded→reversed
        },
      );
      test.fixme(
        'TC-L4-063 US-119/AC4 [A · Cao]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-119/AC4' },
            { type: 'endpoints', description: 'recordPayment' },
          ],
        },
        async () => {
          // Tiền điều kiện: Giữ chỗ G1 do qa.sal chốt; giữ chỗ G2 của người khác
          // Bước: qa.sal ghi thu cọc G1; ghi thu G2; ghi thu tiền phòng còn lại (không phải cọc) cho G1; qa.ctv1
          //   ghi thu G1
          // Kỳ vọng: G1 cọc: được; G2: 404; khoản không phải cọc: 403; qa.ctv1: 403
          // Quy tắc: A33, x-scope own_deposit_only
        },
      );
      test.fixme(
        'TC-L4-064 US-120/AC1 [A+U · Cao]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-120/AC1' },
            { type: 'endpoints', description: 'createVietQr' },
          ],
        },
        async () => {
          // Tiền điều kiện: Đã cấu hình tài khoản nhận (dữ liệu test); còn phải thu 1.660.000; mã đơn OTM-00171
          // Bước: Chọn chuyển khoản → tạo VietQR
          // Kỳ vọng: Chuỗi QR theo chuẩn VietQR/EMVCo (CRC hợp lệ), số tiền 1660000, nội dung OTM00171 (không dấu
          //   cách, không gạch)
          // Quy tắc: BR-521, I2, SM-12 *→pending
        },
      );
      test.fixme(
        'TC-L4-065 US-120/AC2 [A+E · Cao]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-120/AC2' },
            { type: 'endpoints', description: 'createVietQr' },
          ],
        },
        async () => {
          // Tiền điều kiện: Chưa cấu hình tài khoản nhận
          // Bước: Chọn chuyển khoản bằng qa.fd, qa.mgr
          // Kỳ vọng: Không hiện QR giả; API 409 PAYMENT_NOT_CONFIGURED; qa.mgr/qa.owner thấy "Chưa cấu hình tài
          //   khoản nhận"; qa.fd thấy hướng dẫn liên hệ quản lý
          // Quy tắc: ESC-010
        },
      );
      test.fixme(
        'TC-L4-066 US-119/– [A · Cao]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-119/–' },
            { type: 'endpoints', description: 'recordPayment' },
          ],
        },
        async () => {
          // Tiền điều kiện: –
          // Bước: Kiểm schema recordPayment và màn thu tiền bằng thẻ
          // Kỳ vọng: Không có trường số thẻ/CVV/hạn thẻ; thẻ tại quầy chỉ nhận "đã thu bằng thẻ" + 4 số cuối/mã
          //   chuẩn chi
          // Quy tắc: R-PAY-01, R-PAY-03, R-PAY-04
        },
      );
      test.fixme(
        'TC-L4-067 US-038/– [A · TB]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-038/–' },
            { type: 'endpoints', description: 'checkOut, listRoomStatuses, listHkTasks' },
          ],
        },
        async () => {
          // Tiền điều kiện: Đơn in_house 201, buồng CL (HK đang dọn phòng khách đang ở)
          // Bước: Hoàn tất trả phòng
          // Kỳ vọng: Đơn checked_out; buồng CL → VD (không kẹt ở CL); việc dọn đang làm chuyển thành "Dọn trả
          //   phòng" hoặc sinh việc mới, qa.hk được báo
          // Quy tắc: SM-03 R9 (từ CL), SM-01 B18
        },
      );
      test.fixme(
        'TC-L4-068 US-038/– [A · TB]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-038/–' },
            {
              type: 'endpoints',
              description: 'getFolio, addFolioLine, adjustFolioLine, listAttentionItems',
            },
          ],
        },
        async () => {
          // Tiền điều kiện: Folio F1 settled ⏱ 15/10 11:40, còn phải thu 0; folio F2 settled, còn phải thu
          //   50.000, không ghi công nợ
          // Bước: ⏱ ngay trước và ngay sau hết thời hạn phát sinh BR-427 ▶ job đóng folio; qa.fd thêm dòng vào
          //   F1; qa.mgr điều chỉnh F1 có lý do
          // Kỳ vọng: Trước hạn: F1 settled, FD ghi phát sinh sau trả phòng nhanh được; sau hạn: F1 closed, FD
          //   thêm dòng → 409 FOLIO_LOCKED, MGR điều chỉnh có lý do được; F2 không tự closed, vào "Cần chú ý"
          // Quy tắc: SM-13 settled→closed, BR-427
        },
      );
      test.fixme(
        'TC-L4-069 US-120/–; US-119/AC6 [A · Cao]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-120/–; US-119/AC6' },
            { type: 'endpoints', description: 'createVietQr, recordPayment, getFolio' },
          ],
        },
        async () => {
          // Tiền điều kiện: VietQR 1.660.000 tạo ⏱ 15/10 10:00 (pending)
          // Bước: (a) qa.fd xác nhận đã thấy tiền; (b) dữ liệu mới: để quá hạn link ▶ job; (c) qa.mgr đối soát
          //   giao dịch (a) với sao kê; (d) qa.fd thử đối soát; (e) ghi thu tiền mặt 500.000; (f) giao dịch
          //   chuyển khoản ghi tay, quá mốc BR-526 không thấy trên sao kê, qa.mgr đánh dấu; (g) qa.sal ghi cọc
          //   chuyển khoản "đã nhận"; qa.mgr lọc danh sách chờ đối soát theo ngày và người ghi
          // Kỳ vọng: (a) succeeded, reconciliation = pending, còn phải thu giảm 1.660.000; (b) expired, còn phải
          //   thu không đổi, tạo được QR mới; (c) reconciled, có reconciled_by, reconciled_at; (d) 403; (e)
          //   reconciliation = not_required, gắn ca đang mở; (f) disputed, cảnh báo đỏ OWN + MGR, đơn giữ trạng
          //   thái; (g) giao dịch mang cờ "chờ đối soát" tới khi MGR/OWN tick; lọc theo ngày/người ghi trả đúng
          //   danh sách
          // Quy tắc: SM-12 pending→succeeded, SM-12 pending→expired, SM-12 pending→reconciled, SM-12
          //   *→not_required, SM-12 pending→disputed, BR-526
        },
      );
      test.fixme(
        'TC-L4-070 US-066/AC1 [A · TB]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-066/AC1' },
            { type: 'endpoints', description: 'createItem, recordMinibarCheck' },
          ],
        },
        async () => {
          // Tiền điều kiện: qa.owner
          // Bước: Thêm mặt hàng "Trà gừng" giá "miễn phí", chuẩn 2; kiểm minibar dùng 1
          // Kỳ vọng: Không tính tiền, vẫn ghi tiêu hao
          // Quy tắc: BR-701
        },
      );
      test.fixme(
        'TC-L4-071 US-066/AC2 [A · TB]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-066/AC2' },
            { type: 'endpoints', description: 'updateItem, recordMinibarCheck, getFolio' },
          ],
        },
        async () => {
          // Tiền điều kiện: Folio đã có dòng Coca giá cũ
          // Bước: qa.owner đổi giá Coca; kiểm minibar đơn khác
          // Kỳ vọng: Lần kiểm sau dùng giá mới; dòng folio cũ giữ giá cũ
          // Quy tắc: BR-006
        },
      );
    });
    test.describe('5.3 Biến thể trả phòng dài hạn có khấu trừ ký quỹ (US-041 Must R3 – ca chính)', () => {
      test.fixme(
        'TC-L4-080 US-041/– [A+E · TB]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-041/–' },
            { type: 'endpoints', description: '—' },
          ],
        },
        async () => {
          // Tiền điều kiện: HĐ Daniel 301, ký quỹ 22.300.000; điện nước kỳ cuối 650.000; khách làm mất 1 thẻ;
          //   biên bản kiểm phòng có ảnh
          // Bước: Trả phòng dài hạn, quyết toán
          // Kỳ vọng: Bill cuối: tiền thuê ngày lẻ chưa thu (nếu có) + điện nước 650.000 + phạt 200.000 − ký quỹ
          //   22.300.000 → hoàn 21.450.000; tạo yêu cầu hoàn cho qa.mgr duyệt, hạn hoàn 7 ngày làm việc; không có
          //   biên bản ảnh → không cho khấu trừ. Endpoint quyết toán chưa có trong OpenAPI R2
          // Quy tắc: BR-214, BR-522, BR-511, BL #6
        },
      );
      test.fixme(
        'TC-L4-081 US-041/– [U · Thấp]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-041/–' },
            { type: 'endpoints', description: '—' },
          ],
        },
        async () => {
          // Tiền điều kiện: HĐ kết thúc 01/05/2027, khách ở thêm 5 ngày
          // Bước: Tính tiền ngày lẻ
          // Kỳ vọng: 371.000 × 5 = 1.855.000 + phí dịch vụ 350.000 × 5/30 = 58.000 (ví dụ BR-210)
          // Quy tắc: BR-214, BR-210
        },
      );
    });
  },
);
