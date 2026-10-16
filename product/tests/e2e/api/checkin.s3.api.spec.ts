// KHUNG E2E Sprint 3 (pending) – L3 – Nhận phòng: giấy tờ, đối chiếu, khai báo, mã cửa (EP03, EP06 – Sprint 3).
// Sinh từ product/tests/test-cases/r1-main-flows.md (QA, khởi động Sprint 3 – 16/10/2026). Mỗi TC một test.fixme có
// mã TC, story/AC, tầng, ưu tiên và tóm tắt bước/kỳ vọng. QA điền thân test khi ARC chốt OpenAPI 0.3.6 (nhóm B) và
// endpoint có trên build: đổi test.fixme → test, gọi requireEndpoints(...) như các spec Sprint 2.
// Không sửa tay phần mô tả: sửa TC trong r1-main-flows.md rồi chép lại.
import { test } from '@playwright/test';

const WAITING = 'OpenAPI 0.3.6 (ARC) + endpoint Sprint 3 trên build';

test.describe(
  'L3 – Nhận phòng: giấy tờ, đối chiếu, khai báo, mã cửa (EP03, EP06 – Sprint 3)',
  { tag: ['@api', '@sprint3', '@pending'] },
  () => {
    test.describe('4.1 Nhận phòng và phụ thu nhận sớm', () => {
      test.fixme(
        'TC-L3-001 US-025/AC1 [A+E · Cao (S)]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-025/AC1' },
            { type: 'endpoints', description: 'previewCheckIn, checkIn' },
          ],
        },
        async () => {
          // Tiền điều kiện: DS-E; đơn Trực tiếp confirmed 203 đến 15/10, đã thu đủ; buồng VI; giấy tờ người đứng
          //   tên đã nhập; ⏱ 15/10 14:30
          // Bước: qa.fd nhận phòng, giữ giờ mặc định
          // Kỳ vọng: Đơn in_house; buồng OC; giờ nhận ghi 14:30; folio không có dòng phụ thu
          // Quy tắc: SM-01 B9, BR-401, BR-402, BR-411, SM-03 R6
        },
      );
      test.fixme(
        'TC-L3-002 US-025/AC2 [A+E · Cao]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-025/AC2' },
            { type: 'endpoints', description: 'checkIn, listApprovalRequests, listHkTasks' },
          ],
        },
        async () => {
          // Tiền điều kiện: Như TC-L3-001 nhưng buồng VD
          // Bước: (a) qa.fd nhận phòng; (b) qa.fdl nhận phòng kèm lý do
          // Kỳ vọng: (a) không nhận trực tiếp, tạo yêu cầu duyệt cho FDL+ (A12 = D); (b) đơn in_house, buồng OD,
          //   việc dọn ưu tiên được tạo, nhật ký có lý do
          // Quy tắc: BR-402, A12, SM-03 R7
        },
      );
      test.fixme(
        'TC-L3-003 US-025/AC3 [A+E · Cao (S)]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-025/AC3' },
            { type: 'endpoints', description: 'previewCheckIn, checkIn, setDoorCredential' },
          ],
        },
        async () => {
          // Tiền điều kiện: (a) đơn Trực tiếp còn phải thu 1.000; (b) đơn đủ tiền nhưng chưa có giấy tờ người
          //   đứng tên; (c) đơn Airbnb "OTA thu hộ", còn phải thu = 0
          // Bước: Nhận phòng từng đơn; thử nhập mã cửa
          // Kỳ vọng: (a) 409 CHECKIN_CONDITIONS_NOT_MET, unmet=[balance_paid]; (b) unmet=[main_guest_document];
          //   cả hai không giao/nhập được mã cửa; (c) nhận được
          // Quy tắc: BR-402, BR-307
        },
      );
      test.fixme(
        'TC-L3-004 US-025/AC4 [A · Cao]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-025/AC4' },
            { type: 'endpoints', description: 'checkIn, listAttentionItems, getRegistration' },
          ],
        },
        async () => {
          // Tiền điều kiện: Đơn khách NN, khai báo review; ⏱ 15/10 10:00
          // Bước: Nhận phòng
          // Kỳ vọng: Màn hình hiện hạn khai báo tính từ giờ nhận thực tế (xem TC-L3-044); đơn vào "Cần chú ý" mục
          //   khai báo
          // Quy tắc: BR-602, BR-603, BR-907
        },
      );
      test.fixme(
        'TC-L3-005 US-025/AC5 [A · Cao]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-025/AC5' },
            { type: 'endpoints', description: 'undoCheckIn' },
          ],
        },
        async () => {
          // Tiền điều kiện: Đơn vừa nhận phòng nhầm, buồng trước đó VI, có mã cửa
          // Bước: (a) qa.fd tìm "Hoàn tác"; (b) qa.mgr hoàn tác kèm lý do; (c) dữ liệu mới: thêm 1 dòng folio rồi
          //   hoàn tác; (d) ⏱ hôm sau hoàn tác
          // Kỳ vọng: (a) không có nút, API 403; (b) đơn confirmed, buồng về VI, mã cửa hủy, nhật ký có lý do;
          //   (c), (d) bị chặn 409
          // Quy tắc: SM-01 B17, A13
        },
      );
      test.fixme(
        'TC-L3-006 US-025/– [A · TB]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-025/–' },
            { type: 'endpoints', description: 'checkIn' },
          ],
        },
        async () => {
          // Tiền điều kiện: Đơn đến hôm nay ở căn đang OOO; đơn confirmed đến ngày mai
          // Bước: Nhận phòng hai đơn
          // Kỳ vọng: Căn OOO: bị chặn; đơn ngày mai: 409 INVALID_TRANSITION, gợi ý đổi ngày đến (B7)
          // Quy tắc: SM-03 cấm nhận phòng vào OOO, BR-803
        },
      );
      test.fixme(
        'TC-L3-007 US-025/AC3 [A+E · Cao (S)]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-025/AC3' },
            {
              type: 'endpoints',
              description: 'previewCheckIn, checkIn, setDoorCredential, recordPayment',
            },
          ],
        },
        async () => {
          // Tiền điều kiện: Đơn Booking.com kiểu thanh toán khách trả tại chỗ, còn phải thu = tiền phòng
          //   2.460.000; buồng VI; giấy tờ người đứng tên đủ
          // Bước: 1. Nhận phòng. 2. Thử nhập mã cửa. 3. Ghi thu đủ 2.460.000 rồi nhận phòng
          // Kỳ vọng: (1) 409 CHECKIN_CONDITIONS_NOT_MET, unmet=[balance_paid] (không coi là "OTA đã trả"); (2)
          //   không nhập/giao được mã cửa; (3) nhận được
          // Quy tắc: BR-307, BR-402, SM-01 B9
        },
      );
      test.fixme(
        'TC-L3-008 US-025/AC6; US-026/AC3 [A · Cao]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-025/AC6; US-026/AC3' },
            { type: 'endpoints', description: 'previewCheckIn, checkIn' },
          ],
        },
        async () => {
          // Tiền điều kiện: (a) Đơn Trực tiếp 203 đến 15/10; ⏱ 16/10 01:30. (b) Đơn Booking 203 đến 20/10, đêm
          //   19/10 trống; ⏱ 20/10 04:30
          // Bước: Nhận phòng từng đơn
          // Kỳ vọng: (a) B9 bình thường (ngày nghiệp vụ 15/10 = ngày đến), không phụ thu, không bị coi là trễ
          //   ngày; hạn khai báo: khách VN 23:00 16/10 (ngày lịch của giờ đến thực tế – BR-602, không dùng ngày
          //   nghiệp vụ), khách NN 13:30 16/10 (01:30 + 12 giờ – BR-603); đơn vẫn ở "Khách đến hôm nay" của ngày
          //   nghiệp vụ 15/10; (b) B9a: tạo đơn con kênh Trực tiếp cho đêm 19/10 (đêm bán, giá BR-411), đơn con
          //   in_house cùng lúc, đơn gốc giữ ngày OTA 20/10; khai báo dùng chung bản ghi đơn gốc
          // Quy tắc: SM-01 B9, SM-01 B9a, BR-010, BR-602, BR-603, BR-411, decision-log 15/10 DOM (ngày nghiệp vụ
          //   đổi lúc 06:00; nhận trước 06:00 = đêm bán)
        },
      );
      test.fixme(
        'TC-L3-073 US-025/AC7 [A+E · Cao]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-025/AC7' },
            { type: 'endpoints', description: 'checkIn, updateReservation, getReservation' },
          ],
        },
        async () => {
          // Tiền điều kiện: Đơn Trực tiếp confirmed đến hôm nay, đủ điều kiện nhận phòng (như TC-L3-001); đơn thứ
          //   hai cùng điều kiện
          // Bước: (a) qa.fd nhận phòng đơn 1 không tick "Đã giao mã cửa/thẻ"; (b) mở chi tiết đơn 1, tick bổ
          //   sung; (c) nhận phòng đơn 2 có tick; (d) tìm ô nhập/hiện mã cửa trên màn nhận phòng và chi tiết đơn
          // Kỳ vọng: (a) nhận phòng thành công (in_house), doorAccessHandedOverAt rỗng; (b)
          //   doorAccessHandedOverAt = thời điểm tick, ghi người tick (nhật ký); (c) doorAccessHandedOverAt = giờ
          //   nhận phòng, người = qa.fd; (d) không có ô mã cửa, phản hồi API không có trường mã cửa (R2)
          // Quy tắc: ARC Q-P1, EP03-05 1.4 doorAccessHandedOver, US-128 (dời R3), [GIẢ ĐỊNH QA – chờ ARC E03-06:
          //   tick bổ sung qua ReservationPatch.doorAccessHandedOver (chỉ true)]
        },
      );
      test.fixme(
        'TC-L3-010 US-026/AC1 [A+E · Cao]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-026/AC1' },
            { type: 'endpoints', description: 'previewCheckIn' },
          ],
        },
        async () => {
          // Tiền điều kiện: Đơn đến hôm nay; ⏱ 15/10 11:05
          // Bước: Mở form nhận phòng
          // Kỳ vọng: Giờ nhận mặc định 14:00 (không phải 11:05); phụ thu 0; previewCheckIn không tạo dòng folio
          // Quy tắc: BR-414, BL #2, HR-04
        },
      );
      test.fixme(
        'TC-L3-011 US-026/AC2 [A+E · Cao]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-026/AC2' },
            { type: 'endpoints', description: 'previewCheckIn, checkIn' },
          ],
        },
        async () => {
          // Tiền điều kiện: Đơn giá đêm đầu 700.000
          // Bước: Chọn "Nhận sớm", nhập 11:00; (a) xác nhận với số đang hiển thị; (b) gửi API với số khác số
          //   server tính
          // Kỳ vọng: Đề xuất 210.000 (ví dụ BR-411), chưa ghi folio trước khi xác nhận; (a) ghi 1 dòng 210.000;
          //   (b) bị từ chối (số xác nhận lệch), không ghi
          // Quy tắc: BR-411, BR-414
        },
      );
      test.fixme(
        'TC-L3-012 US-026/AC2 [U+A · Cao]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-026/AC2' },
            { type: 'endpoints', description: 'previewCheckIn' },
          ],
        },
        async () => {
          // Tiền điều kiện: Đơn giá đêm đầu 700.000
          // Bước: Giờ nhận: 14:00; 13:59; 10:00; 09:59; 08:00; 06:00
          // Kỳ vọng: 14:00 → 0; 13:59 → 210.000; 10:00 → 210.000; 09:59 → 350.000; 08:00 → 350.000; 06:00 →
          //   350.000
          // Quy tắc: BR-411 (biên)
        },
      );
      test.fixme(
        'TC-L3-013 US-026/AC3 [A · Cao]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-026/AC3' },
            { type: 'endpoints', description: 'previewCheckIn, checkIn' },
          ],
        },
        async () => {
          // Tiền điều kiện: Đơn Trực tiếp 203 đến 20/10 giá 700.000; đêm 19/10 trống
          // Bước: Nhận phòng ⏱ 20/10 05:30; ⏱ 05:59; lặp khi đêm 19/10 đã có khách; lặp ⏱ 20/10 06:00
          // Kỳ vọng: 05:30, 05:59 (ngày nghiệp vụ 19/10 = ngày đến − 1): B9a – thêm đêm 19/10 vào đầu đơn (ngày
          //   đến = 19/10), đêm bán 700.000, không phải dòng "phụ thu nhận sớm"; đêm 19/10 có khách → không cho
          //   nhận, gợi ý gửi hành lý; 06:00 → B9, phụ thu nhận sớm theo TC-L3-012
          // Quy tắc: BR-003, BR-411, SM-01 B9a, decision-log 15/10 DOM (ngày nghiệp vụ 06:00)
        },
      );
      test.fixme(
        'TC-L3-014 US-026/AC4 [A · TB]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-026/AC4' },
            { type: 'endpoints', description: 'requestFoc' },
          ],
        },
        async () => {
          // Tiền điều kiện: Phụ thu nhận sớm 210.000 đã ghi
          // Bước: Lễ tân muốn miễn
          // Kỳ vọng: Đi qua yêu cầu FOC (pending) – không có nút xóa/sửa thẳng dòng phụ thu
          // Quy tắc: BR-431–433, US-007
        },
      );
      test.fixme(
        'TC-L3-015 US-027/AC1 [U+A · Cao]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-027/AC1' },
            { type: 'endpoints', description: 'setLateCheckout' },
          ],
        },
        async () => {
          // Tiền điều kiện: Đơn dài hạn HĐ thuê 11.130.000/tháng; chính sách miễn phí dài hạn tắt; trả muộn 15:00
          // Bước: Tính phụ thu trả muộn
          // Kỳ vọng: Cơ sở = 11.130.000 ÷ 30 = 371.000; 30% = 111.000 (không phải 3.339.000)
          // Quy tắc: BR-102, BR-213, BR-413, BL #1
        },
      );
      test.fixme(
        'TC-L3-016 US-027/AC2 [A · TB]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-027/AC2' },
            { type: 'endpoints', description: 'setLateCheckout, setParameter' },
          ],
        },
        async () => {
          // Tiền điều kiện: Như trên, chính sách miễn phí đến 15:00 bật
          // Bước: (a) Căn không có khách đến cùng ngày, trả 15:00; (b) có khách đến cùng ngày; (c) qa.owner đổi
          //   long_stay_free_late_until 15:00 → 13:00, trả 14:00
          // Kỳ vọng: (a) đề xuất 0; (b) 111.000; (c) 111.000 – thay đổi chỉ bằng tham số
          // Quy tắc: BR-413 (INV quyết ESC-007)
        },
      );
    });
    test.describe('4.2 Giấy tờ, đối chiếu, đồng ý, khai báo', () => {
      test.fixme(
        'TC-L3-030 US-043/AC1 [A · Cao]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-043/AC1' },
            { type: 'endpoints', description: 'addGuestDocument, getRegistration' },
          ],
        },
        async () => {
          // Tiền điều kiện: Đơn 2 người lớn, khai báo none
          // Bước: Nhập đủ trường người 1; rồi người 2
          // Kỳ vọng: Sau người 1: partial; sau người 2: review
          // Quy tắc: BR-601, BR-607, SM-05 K3, K4
        },
      );
      test.fixme(
        'TC-L3-031 US-043/AC2 [A · TB]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-043/AC2' },
            { type: 'endpoints', description: 'addGuestDocument' },
          ],
        },
        async () => {
          // Tiền điều kiện: Đơn có trẻ em
          // Bước: Nhập giấy tờ trẻ em
          // Kỳ vọng: Loại giấy = số định danh cá nhân; không bắt ảnh; năm sinh chỉ dùng cho khai báo + phụ thu
          // Quy tắc: BR-612
        },
      );
      test.fixme(
        'TC-L3-032 US-043/AC3 [A · TB]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-043/AC3' },
            { type: 'endpoints', description: 'addGuestDocument, listParty' },
          ],
        },
        async () => {
          // Tiền điều kiện: Đơn 2 khách; nhập giấy tờ người thứ 2 (a) trùng số giấy tờ với hồ sơ KH có sẵn; (b)
          //   không khớp ai
          // Bước: Lưu
          // Kỳ vọng: (a) gắn vào hồ sơ có sẵn; (b) tạo hồ sơ mới, quan hệ "Chưa rõ"; cả hai gắn vào đơn
          // Quy tắc: BR-951
        },
      );
      test.fixme(
        'TC-L3-033 US-043/AC4 [A · Cao]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-043/AC4' },
            {
              type: 'endpoints',
              description: 'getGuestDocumentSensitive, updateGuestDocument, listC3AccessLog',
            },
          ],
        },
        async () => {
          // Tiền điều kiện: Như TC-L3-030
          // Bước: Xem lại và sửa trường số hộ chiếu
          // Kỳ vọng: Mỗi lần xem/nhập có dòng c3_access_log (người, thời điểm, đơn)
          // Quy tắc: A70 (L), R-REG-09
        },
      );
      test.fixme(
        'TC-L3-034 US-044/AC1 [U+A · Cao]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-044/AC1' },
            { type: 'endpoints', description: 'addGuestDocument, getRegistration' },
          ],
        },
        async () => {
          // Tiền điều kiện: Đơn trả phòng 22/10; hộ chiếu hết hạn: 21/10; 22/10; 23/10
          // Bước: Chạy đối chiếu
          // Kỳ vọng: 21/10 và 22/10 → Không đạt; 23/10 → Đạt
          // Quy tắc: BR-605, BL #3, R-REG-03
        },
      );
      test.fixme(
        'TC-L3-035 US-044/AC2 [U+A · Cao]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-044/AC2' },
            { type: 'endpoints', description: 'getRegistration' },
          ],
        },
        async () => {
          // Tiền điều kiện: Chưa nhập ngày hết hạn hộ chiếu, thị thực
          // Bước: Chạy đối chiếu
          // Kỳ vọng: Kết quả "Chưa kiểm được – cần kiểm tay"; mỗi mục chỉ một trong 3 giá trị Đạt / Không đạt /
          //   Chưa kiểm được; không bao giờ "Đạt" khi thiếu dữ liệu
          // Quy tắc: HR-07
        },
      );
      test.fixme(
        'TC-L3-036 US-044/AC3 [U · TB]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-044/AC3' },
            { type: 'endpoints', description: 'getRegistration' },
          ],
        },
        async () => {
          // Tiền điều kiện: Tên đơn / tên giấy tờ
          // Bước: "Daniel Weber" / "WEBER DANIEL"; "Đỗ Mai Anh" / "DO MAI ANH"; "Daniel Weber" / "DANIELA WEBB"
          // Kỳ vọng: Đạt; Đạt; Không đạt (hoặc Chưa kiểm được)
          // Quy tắc: BR-952
        },
      );
      test.fixme(
        'TC-L3-037 US-044/AC4 [A+E · Cao]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-044/AC4' },
            {
              type: 'endpoints',
              description: 'completeRegistrationReview, checkIn, listAttentionItems',
            },
          ],
        },
        async () => {
          // Tiền điều kiện: Khách NN thị thực hết 20/10, trả phòng 22/10
          // Bước: 1. Đối chiếu. 2. Nhận phòng. 3. "Đối chiếu xong" không ghi chú; rồi có ghi chú xử lý
          // Kỳ vọng: Cảnh báo đỏ; đơn vào "Cần chú ý"; ngày đi khai báo đề xuất = 20/10; nhận phòng không bị
          //   chặn; chuyển scanned không ghi chú → 409 REGISTRATION_INCOMPLETE; có ghi chú → scanned
          // Quy tắc: BR-605, SM-05 K5
        },
      );
      test.fixme(
        'TC-L3-038 US-045/AC1 [A+E · Cao]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-045/AC1' },
            { type: 'endpoints', description: 'recordImageConsent, completeRegistrationReview' },
          ],
        },
        async () => {
          // Tiền điều kiện: Khai báo review đủ người
          // Bước: Bấm "Đối chiếu xong" không chọn đồng ý; chọn "Không"; (dữ liệu mới) chọn "Có"
          // Kỳ vọng: Không chọn: không chuyển được (ô không tích sẵn); "Không" → scanned, khai báo tiếp bình
          //   thường; "Có" → scanned
          // Quy tắc: BR-609, R-REG-05, SEC F02
        },
      );
      test.fixme(
        'TC-L3-039 US-045/AC2 [A · Cao (S)]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-045/AC2' },
            { type: 'endpoints', description: 'transitionRegistration, getDocumentImage' },
          ],
        },
        async () => {
          // Tiền điều kiện: Khai báo chọn "Không" đồng ý lưu ảnh, có 2 ảnh
          // Bước: 1. ⏱ 15/10 15:00 chuyển sent → confirmed. 2. Gọi ngay getDocumentImage. 3. Dữ liệu mới: giả lập
          //   tác vụ xóa ngay bị lỗi; ⏱ 16/10 14:59 và 15:00 ▶ J16
          // Kỳ vọng: (2) ảnh đã bị xóa ngay sau confirmed (404/410, khóa mã hóa bị hủy), không chờ J16; trường
          //   văn bản cần thiết còn; nhật ký/retention_run ghi; (3) J16 xóa bù chậm nhất 16/10 15:00 (24 giờ);
          //   sau mốc này ảnh còn = lỗi P0
          // Quy tắc: BR-609, SEC T01, J16, decision-log 15/10 SEC (xóa ngay khi confirmed, 24 giờ là hạn trên –
          //   M3)
        },
      );
      test.fixme(
        'TC-L3-040 US-045/AC3 [A · TB]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-045/AC3' },
            { type: 'endpoints', description: 'getRegistration' },
          ],
        },
        async () => {
          // Tiền điều kiện: Khách chọn đồng ý "Có" qua check-in online
          // Bước: Lễ tân mở khai báo
          // Kỳ vọng: Trạng thái đồng ý đã ghi kèm thời điểm, hình thức "qua app", mục đích; lễ tân không phải hỏi
          //   lại
          // Quy tắc: BR-609, D20
        },
      );
      test.fixme(
        'TC-L3-041 US-046/AC1 [A+E · TB]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-046/AC1' },
            { type: 'endpoints', description: 'getRegistration' },
          ],
        },
        async () => {
          // Tiền điều kiện: (a) đơn có 1 người hộ chiếu Đức + 1 CCCD VN; (b) đơn toàn CCCD VN
          // Bước: Mở khai báo
          // Kỳ vọng: (a) tiêu đề "Khai báo tạm trú người nước ngoài"; (b) "Thông báo lưu trú công dân Việt Nam"
          // Quy tắc: BR-602, BR-603, BR-606
        },
      );
      test.fixme(
        'TC-L3-042 US-046/AC2 [A+E · Cao]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-046/AC2' },
            { type: 'endpoints', description: 'getPortalData, listC3AccessLog' },
          ],
        },
        async () => {
          // Tiền điều kiện: Khai báo scanned NN; máy quầy được cấp; một điện thoại
          // Bước: Bấm "Sao chép dữ liệu" trên máy quầy; rồi bấm "Xóa bộ nhớ tạm"; thử trên điện thoại
          // Kỳ vọng: Bộ nhớ tạm có đủ trường bắt buộc từng người theo BR-606, đúng thứ tự cổng; xóa bộ nhớ tạm
          //   hoạt động; trên điện thoại không có chức năng (hoặc API từ chối); mỗi lần sao chép có log C3
          // Quy tắc: BR-606, A73, R-REG-07
        },
      );
      test.fixme(
        'TC-L3-043 US-046/AC3 [A · Cao]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-046/AC3' },
            { type: 'endpoints', description: 'transitionRegistration, listRegistrations' },
          ],
        },
        async () => {
          // Tiền điều kiện: Khai báo scanned
          // Bước: Dán mã hồ sơ → lưu; "Cổng đã xác nhận"; (dữ liệu mới) "Cổng từ chối" + lý do
          // Kỳ vọng: sent (ghi người khai, thời điểm, mã); confirmed, đơn rời danh sách cần xử lý; từ chối →
          //   scanned kèm lý do
          // Quy tắc: SM-05 K6–K8
        },
      );
      test.fixme(
        'TC-L3-044 US-042/AC1 [A+U · Cao (S)]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-042/AC1' },
            { type: 'endpoints', description: 'listRegistrations, listAttentionItems' },
          ],
        },
        async () => {
          // Tiền điều kiện: Đơn khách VN đến 15/10 chưa khai; đơn khách NN nhận phòng ⏱ 15/10 08:00
          // Bước: Xem danh sách cần khai báo; ⏱ 20:00 và 20:00:01 ▶ J5
          // Kỳ vọng: VN: hạn 23:00 15/10; NN: hạn 20:00 15/10 (ví dụ BR-603). Lúc 20:00:01 hồ sơ NN trước sent
          //   hiện "Đã quá hạn" bằng màu cảnh báo và nhãn chữ
          // Quy tắc: BR-602, BR-603 (decision-log 15/10: NN = giờ đến + 12 giờ, chờ ESC-001), J5
        },
      );
      test.fixme(
        'TC-L3-045 US-042/AC1 [U+A · Cao]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-042/AC1' },
            { type: 'endpoints', description: 'checkIn, getRegistration' },
          ],
        },
        async () => {
          // Tiền điều kiện: Khách VN nhận phòng ⏱ 20/10 22:59 và (dữ liệu khác) 23:40
          // Bước: Xem hạn
          // Kỳ vọng: 22:59 → 23:00 20/10; 23:40 → 08:00 21/10
          // Quy tắc: BR-602
        },
      );
      test.fixme(
        'TC-L3-046 US-042/AC1 [U+A · Cao]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-042/AC1' },
            { type: 'endpoints', description: 'checkIn, getRegistration, listAttentionItems' },
          ],
        },
        async () => {
          // Tiền điều kiện: Khách NN nhận phòng ⏱ 20/10 21:30
          // Bước: Xem hạn; ⏱ 21/10 09:29 và 09:30:01 ▶ J5
          // Kỳ vọng: Hạn 09:30 21/10 (21:30 + 12 giờ; không còn chế độ earlier_of); 09:29: chưa quá hạn;
          //   09:30:01: "Đã quá hạn" bằng màu và nhãn chữ
          // Quy tắc: BR-603, decision-log 15/10 DOM (NN = giờ đến + 12 giờ, bỏ mốc 23:00 với khách NN; giả định
          //   chờ luật sư qua ESC-001)
        },
      );
      test.fixme(
        'TC-L3-047 US-042/– [U · TB]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-042/–' },
            { type: 'endpoints', description: 'getRegistration' },
          ],
        },
        async () => {
          // Tiền điều kiện: Đơn 1 VN + 1 NN nhận phòng 10:00
          // Bước: Xem hạn
          // Kỳ vọng: Hạn của hồ sơ = hạn sớm nhất của các người (VN 23:00, NN 10:00 + 12 giờ = 22:00) → 22:00
          // Quy tắc: BR-602, BR-603 (decision-log 15/10), architecture 9.1 (hồ sơ hỗn hợp)
        },
      );
      test.fixme(
        'TC-L3-048 US-042/AC2 [A · Cao]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-042/AC2' },
            { type: 'endpoints', description: 'listAttentionItems' },
          ],
        },
        async () => {
          // Tiền điều kiện: 2 hồ sơ chưa khai; qa.fd trực, qa.mgr
          // Bước: ⏱ 21:59 ▶ J5; ⏱ 22:00 ▶ J5; ⏱ 16/10 07:00 ▶ J5; ▶ J5 lần 2 cùng mốc
          // Kỳ vọng: 21:59: không nhắc tổng hợp; 22:00 và 07:00: qa.fd + qa.mgr nhận thông báo trong app nêu số
          //   hồ sơ; chạy lại cùng mốc không gửi trùng (job_run)
          // Quy tắc: BR-611, J5
        },
      );
      test.fixme(
        'TC-L3-049 US-042/AC3 [A · TB]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-042/AC3' },
            { type: 'endpoints', description: 'setParameter, getRegistration' },
          ],
        },
        async () => {
          // Tiền điều kiện: Hồ sơ A chưa khai (NN, nhận 10:00, hạn 22:00); hồ sơ B đã sent
          // Bước: qa.owner đổi registration_deadline_foreigner_hours 12 → 24 (giả lập kết luận luật sư)
          // Kỳ vọng: Hạn A tính lại theo tham số mới mà không đổi code; B giữ nguyên
          // Quy tắc: BR-603, ERD 9.1 (tham số hạn)
        },
      );
      test.fixme(
        'TC-L3-050 US-047/AC1 [A · Cao]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-047/AC1' },
            {
              type: 'endpoints',
              description:
                'createReservation, createHoldFromQuote, confirmDeposit, listRegistrations',
            },
          ],
        },
        async () => {
          // Tiền điều kiện: DS-E
          // Bước: Tạo đơn bằng: đặt mới (Trực tiếp); giữ chỗ từ báo giá; đơn OTA nhập tay; giữ chỗ dài hạn → xác
          //   nhận ký quỹ
          // Kỳ vọng: Mọi đơn có đúng 1 bản ghi khai báo none, số người cần = số khách của đơn
          // Quy tắc: BR-608, SM-05 K1, BL #9
        },
      );
      test.fixme(
        'TC-L3-051 US-047/AC2 [A · TB]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-047/AC2' },
            { type: 'endpoints', description: 'extendStay, listRegistrations' },
          ],
        },
        async () => {
          // Tiền điều kiện: Đơn Booking.com in_house có khai báo confirmed
          // Bước: Gia hạn 1 đêm (sinh đơn con kênh Trực tiếp)
          // Kỳ vọng: Đơn con không có bản ghi khai báo mới; có việc "Cập nhật ngày đi"
          // Quy tắc: BR-608, BR-422
        },
      );
      test.fixme(
        'TC-L3-052 US-047/AC3 [A · TB]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-047/AC3' },
            { type: 'endpoints', description: 'updateReservation, getRegistration' },
          ],
        },
        async () => {
          // Tiền điều kiện: (a) Đơn khai báo partial 2 người; (b) đơn khai báo confirmed 2 người
          // Bước: Đổi số khách 2 → 3
          // Kỳ vọng: (a) số người cần = 3, trạng thái theo số người đã có; (b) → needs_update + việc khai bổ sung
          // Quy tắc: SM-05 K9, BR-601
        },
      );
      test.fixme(
        'TC-L3-053 US-050/AC1 [A · Cao]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-050/AC1' },
            {
              type: 'endpoints',
              description: 'extendStay, earlyDeparture, checkOut, transitionRegistration',
            },
          ],
        },
        async () => {
          // Tiền điều kiện: 3 đơn khách NN khai báo confirmed
          // Bước: Gia hạn đơn 1; trả sớm đơn 2; trả phòng đơn 3; rồi nhập ngày đi thực tế
          // Kỳ vọng: Cả 3 → needs_update + việc "Cập nhật ngày đi" trong ngày cho front_desk; sau khi nhập →
          //   updated
          // Quy tắc: BR-604, SM-05 K9, K10
        },
      );
      test.fixme(
        'TC-L3-054 US-050/AC2 [A+E · Cao]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-050/AC2' },
            { type: 'endpoints', description: 'extendStay, getRegistration, listAttentionItems' },
          ],
        },
        async () => {
          // Tiền điều kiện: Khách NN thị thực đến 20/11; ⏱ 15/10
          // Bước: Gia hạn đơn đến 04/12 (hoặc lưu HĐ đến 04/12)
          // Kỳ vọng: Cảnh báo chặn mềm, phải nhập lý do mới lưu; ngày đi khai báo không vượt 20/11; nhắc gia hạn
          //   thị thực từ 06/11 (14 ngày trước)
          // Quy tắc: BR-605
        },
      );
      test.fixme(
        'TC-L3-055 US-022/– [A · TB]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-022/–' },
            {
              type: 'endpoints',
              description: 'removePartyMember, addPartyMember, getRegistration',
            },
          ],
        },
        async () => {
          // Tiền điều kiện: Đơn 2 người, khai báo review (đủ giấy tờ 2 người)
          // Bước: 1. Bỏ người thứ 2 khỏi đơn. 2. Thêm người khác chưa có giấy tờ
          // Kỳ vọng: (1) khai báo về partial (thiếu người so với số khách), giấy tờ người bị bỏ không còn trong
          //   khai báo, ảnh xử lý theo hạn BR-609/610; (2) vẫn partial
          // Quy tắc: SM-05 review→partial, BR-609
        },
      );
      test.fixme(
        'TC-L3-056 US-022/AC4 [A+E · Cao]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-022/AC4' },
            { type: 'endpoints', description: 'addPartyMember, getFolio, listHkTasks' },
          ],
        },
        async () => {
          // Tiền điều kiện: Đơn Trực tiếp 302 in_house 15→18/10, 3 người lớn (đủ định mức 3); đơn Booking
          //   302-khác 2 người lớn
          // Bước: (a) Thêm 1 người lớn từ đêm 16/10, xem đề xuất rồi xác nhận lúc 19:10 16/10; (b) thêm người thứ
          //   5 (vượt sức chứa 4); (c) thêm người vào đơn Booking
          // Kỳ vọng: (a) đề xuất phụ thu 150.000 × 2 đêm (16, 17/10) = 300.000, chỉ ghi folio khi lễ tân xác nhận
          //   đúng số đang hiển thị; sinh việc bộ đồ dùng thêm hạn 20:10 (BR-812-09); (b) 422 CAPACITY_EXCEEDED;
          //   (c) chỉ cập nhật số khách, không phụ thu
          // Quy tắc: BR-110, BR-414, BR-812, US-004/AC3
        },
      );
    });
    test.describe('4.3 Mã cửa, xóa ảnh giấy tờ theo hạn', () => {
      test.fixme(
        'TC-L3-060 US-128/AC1 [A+E · Cao]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-128/AC1' },
            { type: 'endpoints', description: 'setDoorCredential, getGuestStay' },
          ],
        },
        async () => {
          // Tiền điều kiện: Đơn in_house nhận 14:30 15/10, đi 18/10; có trả muộn đã duyệt đến 15:00
          // Bước: qa.fd nhập mã cửa
          // Kỳ vọng: Hiệu lực mặc định 15/10 14:30 → 18/10 15:00; app khách chỉ hiện mã trong khoảng đó
          //   (TC-L7-021)
          // Quy tắc: BR-403, D22
        },
      );
      test.fixme(
        'TC-L3-061 US-128/AC3 [A · Cao]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-128/AC3' },
            { type: 'endpoints', description: 'checkOut, changeRoom, getDoorCredential' },
          ],
        },
        async () => {
          // Tiền điều kiện: Đơn có mã cửa
          // Bước: (a) Trả phòng; (b) dữ liệu mới: đổi phòng
          // Kỳ vọng: Mã cũ "đã hủy"; có việc nhắc lễ tân xóa mã trên app khóa (MVP nhập tay – INV quyết ESC-011,
          //   khóa TTLock)
          // Quy tắc: BR-403, SEC T11
        },
      );
      test.fixme(
        'TC-L3-062 US-128/–; US-025/AC3 [A · TB]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-128/–; US-025/AC3' },
            { type: 'endpoints', description: 'setDoorCredential' },
          ],
        },
        async () => {
          // Tiền điều kiện: Đơn còn phải thu > 0
          // Bước: Nhập mã cửa trước khi nhận phòng
          // Kỳ vọng: Bị chặn: chưa đạt điều kiện giao mã
          // Quy tắc: BR-402
        },
      );
      test.fixme(
        'TC-L3-070 US-049/AC1 [A · Cao (S)]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-049/AC1' },
            { type: 'endpoints', description: 'getDocumentImage' },
          ],
        },
        async () => {
          // Tiền điều kiện: (a) Đơn checked_out 14/10 10:30, có ảnh, đồng ý lưu "Có"; (b) đơn checked_out 14/10
          //   23:59, như (a)
          // Bước: ⏱ 12/11 03:00 ▶ J16; ⏱ 13/11 03:00 ▶ J16
          // Kỳ vọng: 12/11 (ngày thứ 29 sau ngày trả): ảnh (a), (b) còn; 13/11 (= 14/10 + 30 ngày): ảnh (a), (b)
          //   bị xóa (hủy khóa) – giờ trả trong ngày không làm lệch ngày; dữ liệu khai báo dạng chữ giữ theo tham
          //   số riêng; retention_run ghi lần xóa; endpoint ảnh trả 404/410
          // Quy tắc: BR-610 (chờ ESC-001), SEC T02, ADR-013, J16, [GIẢ ĐỊNH QA – chờ DOM: "30 ngày sau trả phòng"
          //   = xóa ở lần chạy J16 đầu tiên từ 00:00 ngày (ngày trả theo lịch giờ VN + 30); BA-DOM-07]
        },
      );
      test.fixme(
        'TC-L3-071 US-049/AC2 [A · Cao]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-049/AC2' },
            { type: 'endpoints', description: 'transitionRegistration, getDocumentImage' },
          ],
        },
        async () => {
          // Tiền điều kiện: Khai báo chọn không đồng ý
          // Bước: Khai báo → confirmed, ▶ J16
          // Kỳ vọng: Ảnh bị xóa ngay khi confirmed, không chờ J16; 24 giờ là hạn trên (cùng kỳ vọng TC-L3-039)
          // Quy tắc: BR-609, SEC T01, decision-log 15/10 SEC (M3)
        },
      );
      test.fixme(
        'TC-L3-072 US-049/AC3 [A+E · Cao]',
        {
          annotation: [
            { type: 'waitingFor', description: WAITING },
            { type: 'story', description: 'US-049/AC3' },
            { type: 'endpoints', description: 'purgeRegistrationImages' },
          ],
        },
        async () => {
          // Tiền điều kiện: Đơn còn ảnh trong hạn
          // Bước: (a) qa.fd tìm chức năng xóa sớm; (b) qa.mgr xóa sớm qua hộp xác nhận
          // Kỳ vọng: (a) không có, API 403; (b) ảnh bị xóa ngay, nhật ký ghi người, lý do, thời điểm
          // Quy tắc: A74, US-135
        },
      );
    });
  },
);
