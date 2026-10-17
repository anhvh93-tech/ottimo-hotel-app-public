# Kiểm lại tiền S4-38 – commit 2f77889

Đây là lượt kiểm lại S4-38 (Round 2 Sprint 4, D9 theo sprint-4-plan mục 4). Có 5 người kiểm: `r2foc`, `r2move`, `r2cancel`, `r2pay`, `r2regr`. Họ kiểm 17 mã cũ (BUG-R2-095, BUG-R2-109…124) và tìm thêm 15 phát hiện mới. Mỗi phát hiện mới có 2 người tái hiện độc lập. Mỗi người tự viết test, tự tính số từ BR v0.3.8, chạy trên PostgreSQL thật, DB riêng `ottimo_test_s438_w*`, bản sao cố định 2f77889 (src không sửa).

Test nằm ở `scratchpad/s438/wt/product/services/api/test/s438/` (chưa track trong repo). Thư mục `r2*/` là của người kiểm, `w-r2*/` là của người tái hiện.

Ghi chú thời điểm:
- Báo cáo chấm commit **2f77889** (đã gồm vòng sửa 72fa486).
- Mốc BR là BR v0.3.8 và các chốt DOM ngày 17/10 (S4-38; CI 72fa486 TC-L3-013).
- ESC-023 (rút ngắn đơn khi còn < 7 ngày) đang chờ INV. ESC này chạm BR-309-11.

## Tóm tắt

- 17 mã cũ: **15 ĐÃ SỬA**, có số. **2 CHƯA SỬA**:
  - BUG-R2-111: phần `incidentalNet` chưa sửa. Phần P1 đã sửa.
  - BUG-R2-123 (P3): đã hẹn sang tuần Ổn định.
  - Critic chạy lại cả hai: lỗi vẫn còn.
- 15 phát hiện mới, gộp theo gốc còn 12: **7 Major-fix-now** (6 mã P1), 5 Minor (3 mã), 3 Note, 0 CLOSED.
- Cả 30 lượt tái hiện đều tái hiện được, cùng hành vi và cùng số với người báo.
- Critic đổi mức 6 phát hiện so với người báo:
  - nâng lên P1: R2FOC-02, S438R2-CANCEL-01, R2REGR-03;
  - hạ xuống Note: R2FOC-03, S438R2-MOVE-03, S438R2-CANCEL-02.
- **2 Major là hồi quy do vòng sửa gây ra**:
  - S438R2-MOVE-01: do bản sửa BUG-R2-112 ở 72fa486;
  - R2PAY-01 / R2REGR-01: do hàm `agreedRate` thêm ở 2f77889.
- Hồi quy chung tốt. Bộ api chạy 2.689/2.689 ca, 2 lượt. Trong 460 ca test cũ, chỉ 1 ca đỏ do mã (v-foc-3-0, là phần còn lại của BUG-R2-111).
- **2f77889 chưa đạt G1**: còn 7 phát hiện sai tiền, trong đó 2 ca xem trước ≠ lệnh ghi. **Chưa đạt G7**: 6 mã P1 mới đang Open.

## Kết quả từng hướng kiểm

**r2foc** (BE-B là chủ chính):
- Test lượt 1: `foc-attack` 30 xanh, 1 skip. 15 tệp `v-foc-*` cho 36/47 xanh. Trong 11 ca đỏ: 8 ca dùng số cũ từ trước khi DOM chốt, 1 ca test sai (C3), 1 ca Note (C1), 1 ca lỗi thật (v-foc-3-0).
- Test chính thức `foc-keys-s4`, `s438-beb`, `s438-money`: 45/45.
- 28 ca tấn công mới, 23 xanh.
- Các ca đúng:
  - đếm lại minibar cùng số, đếm 2 → 1, và đua ×2–×3;
  - FOC trên chênh lệch khóa theo đêm khi đi qua no-show/B12, làn chưa gán, B14, B16 và FOC chờ.
- Lỗi còn lại: minibar đếm về 0 rồi tăng lại (R2FOC-02); `incidentalNet` (R2FOC-01).

**r2move** (BE-A):
- 38 tệp, 212 ca. Test lượt 1 xanh. Riêng v-move-3-1 phải đổi kỳ vọng vì thứ tự thao tác.
- Swap và B12 nay đi qua MovePlanner. Phụ thu min, định mức bảo vệ, căn gốc, giá gõ và bậc đều giữ đúng. Gán căn sau khi khôi phục vào làn chưa gán không còn trả 500.
- Lỗi còn lại:
  - xem trước và trần QR của đêm thêm B9a/B18 không dùng định mức bảo vệ (S438R2-MOVE-01, hồi quy);
  - fallback căn gốc cho dòng cũ (P3).

**r2cancel**:
- Test lượt 1: 104/104 sau khi đổi kỳ vọng. `s438-money` 18/18, `s438-beb` 6/6. 29 ca mới, 27 xanh.
- Các ca đúng:
  - BR-309-11/12: qua mốc 7/6 ngày, chuỗi tăng rồi giảm, OTA, no-show;
  - B12 dọn yêu cầu hoàn;
  - hủy thử = hủy thật trên cả 7 trường tiền;
  - 3 tổ hợp đua.
- Lỗi còn lại: sửa giá đêm S4-35 không tính lại cọc yêu cầu (S438R2-CANCEL-01).

**r2pay**:
- 39 tệp, 215 ca, 208 xanh. Test lượt 1: 147/147 sau khi đổi kỳ vọng. Test BE: 32/32.
- Các ca thường đều đúng: đêm thêm nhận bậc, và xem trước = trần QR = lệnh ghi ở B9a, B18 và OTA B9a (BR-416-04/05, BR-417-04…06).
- Lỗi còn lại:
  - giá mặc định của đơn lịch giá khi mọi đêm đã sửa bằng S4-35 (R2PAY-01, hồi quy);
  - B9a cộng tiền đêm trước dù đêm đó không trống (R2PAY-02);
  - nút "Giữ giá đơn" (R2PAY-03).

**r2regr**:
- api 2.689/2.689 ca × 2 lượt trên DB mới, cộng 1 lượt có coverage. Không có ca chập chờn.
- 460 ca cũ trong `test/s438`, 57 đỏ: 39 ca dùng số cũ trước khi DOM chốt, 15 ca test sai hoặc theo hợp đồng cũ, 2 ca Note, 1 ca lỗi mã (v-foc-3-0).
- Diff 72fa486^..2f77889: 577 dòng thực thi mới, có 6 dòng chưa test nào chạm. Test viết cho nhánh minibar trong số đó tìm ra R2REGR-03.
- 15 ca nhắm vào nhánh mới tìm ra R2REGR-01 (trùng R2PAY-01) và R2REGR-02 (trùng R2FOC-01).

## Trạng thái mã cũ

| Mã | Mức | Trạng thái ở 2f77889 | Bằng chứng có số | Ghi chú |
|---|---|---|---|---|
| BUG-R2-095 | P3 | ĐÃ SỬA | Đếm lại cùng số: số dòng 3 → 3, không đảo (M1, K0). | Ca lễ tân đã sửa số lượng dòng rồi đếm lại: Note R2FOC-03. |
| BUG-R2-109 | P1 | ĐÃ SỬA | 201 đếm lại cùng số: 743.000, còn thu 35.000, FOC applied sau B18. Đếm 2 → 1 lon: FOC 35.000, ròng 0. v-foc-0-0 và 0-1: 14/14. Đua ×2, ×3 đúng. | Cùng hàm `record()` còn hai kẽ hở: BUG-R2-129, BUG-R2-130 (mới). |
| BUG-R2-110 | P1 | ĐÃ SỬA | No-show: FOC suspended. Sau B12: applied 250.000, tổng 1.850.000, còn thu 250.000. Đúng cả D1, D9 (sang căn khác, làn chưa gán). v-foc-2-*: 9/9. | – |
| BUG-R2-111 | P1 | **CHƯA SỬA (một phần)** | Phần P1 đúng: xem trước = ghi = −42.000, tổng 1.808.000, FOC 208.000; D4, D5, D6, G1 đúng. Phần `incidentalNet` (P2, gộp vào mã này từ lượt 1) không đổi: nhận phòng đòi 0 thay vì 208.000. Critic chạy lại vẫn đỏ. | Đề xuất tách phần còn lại thành BUG-R2-131 (P2) để đóng được phần P1. |
| BUG-R2-112 | P1 | ĐÃ SỬA | Swap 202 (3 NL) ↔ 302: đơn A 1.884.000 → 1.584.000; sửa 3 → 2 → 3 NL phụ thu vẫn 0. B12 302 → 202: phụ thu 0. R1 7 đêm: phụ thu 1.050.000 → 0. | **Bản sửa gây hồi quy** S438R2-MOVE-01 (BUG-R2-125). |
| BUG-R2-113 | P1 | ĐÃ SỬA | Swap hoặc B12 rồi khách xin 401: 250.000/đêm (500.000), origin 203. Đúng ở R2, R3, R4, R6c, R15, R19. H2: dryRun = ghi = 250.000. | Fallback cho dòng cũ trước 0059 có B7a `upgraded` còn sai: BUG-R2-133 (P3). |
| BUG-R2-114 | P1 | ĐÃ SỬA | Gán 201 sau khi khôi phục vào làn chưa gán → 200, còn 1 dòng occupancy; nhận phòng thu 1.084.000, dư 0 (R6). Gán vào căn đang có khách → 409, không còn 500. Hai vòng no-show (R25) đúng. Ca G: FOC applied, tổng 1.200.000. | – |
| BUG-R2-115 | P1 | ĐÃ SỬA | T12a/b: 4.898.000 / 5.122.000. v-pay-2-*: 4.320.000 / 3.987.000. Gõ 7 × 700.000 → 4.410.000; 14 đêm → 8.330.000. | – |
| BUG-R2-116 | P1 | ĐÃ SỬA | B13 = B18 = 777.000, tổng 4.929.000 (BR-416-04). B9a thứ Bảy: lịch 767.000, sau bậc 690.000, tổng 4.380.000. Đơn thỏa thuận 700.000 giữ 700.000 (TC-L3-013). | Nhánh giá thỏa thuận thêm ở 2f77889 **gây hồi quy** R2PAY-01 / R2REGR-01 (BUG-R2-126). |
| BUG-R2-117 | P1 | ĐÃ SỬA | 101: 3.180.000; gõ 667.000 → 3.090.000; thu 3.091.000 → 422. 102 ba NL: 2.200.000 qua cả hai đường. Folio đang thừa: trần 0. FOC đi theo: 3.770.000. | Ca đêm trước không trống còn sai: BUG-R2-127 (mới, có từ trước). |
| BUG-R2-118 | P1 | ĐÃ SỬA | Dời vào Giỗ Tổ rồi hủy trước 14 ngày: phí 500.000, hoàn 0. Dời ra: phí 500.000, hoàn 100.000 (BR-309-12). B3, B4, B10 đúng. | – |
| BUG-R2-119 | P1 | ĐÃ SỬA | 1.600.000 / 500.000 / 1.584.000 (BR-309-11). Rút khi còn 7 ngày: 500.000; còn 6 ngày: giữ 1.600.000. V4: 600.000 / 300.000. | Đường S4-35 chưa phủ: BUG-R2-128 (mới). |
| BUG-R2-120 | P2 | ĐÃ SỬA | B18 có đêm thêm và FOC: xem trước = ghi = QR = 370.000, tổng 5.670.000 (BR-416-05). F1, F2, F3 đúng. | – |
| BUG-R2-121 | P2 | ĐÃ SỬA | Sau B12, yêu cầu 300.000 chuyển cancelled `no_show_restored`, mục chú ý đóng. X3b tạo lại 178.000. C1, C2, C3, C10 và đua 20 vòng đúng. | – |
| BUG-R2-122 | P3 | ĐÃ SỬA | `refundRequestVnd` thử = ghi ở mọi ca: 0 / 300.000 / 1.200.000 / 200.000 / 500.000. | – |
| BUG-R2-123 | P3 | CHƯA SỬA | Critic chạy lại: move-preview kèm `overbookingResolution` vẫn trả 422 REQUIRED. | Bug-list đã hẹn tuần Ổn định. |
| BUG-R2-124 | P3 | ĐÃ SỬA | B12: lịch sử `room` = '203' → '101', lý do `no_show_restore` (số căn, không còn UUID). Dòng cũ ghi UUID vẫn đọc ra 203. | Bug-list còn ghi "Open – BE-A đang sửa". QA cập nhật. |

CANCEL-05 (phí kênh không có trần) là Note, không có mã BUG. Mã không đổi, tiền khách vẫn đúng. Vẫn chờ ARC/DOM quyết có chặn không.

## Critic chạy lại các mã chưa sửa

Chạy một lần trên DB mới `ottimo_test_s438_rcritic`, cây 2f77889, không sửa src. Kết quả 5/6 xanh, 1 đỏ đúng chỗ dự kiến.

- **BUG-R2-111** (`r2foc/orig-v-foc-3-0-foc04-ota-diff-second-move.test.ts`; Agoda 203, 20–22/12/2027 → 401 → FOC 250.000 → 402):
  - Phần P1 xanh: xem trước −42.000 = ghi −42.000; chênh lệch 208.000 × 2; FOC applied 208.000; tổng 1.808.000; còn thu 208.000.
  - Phần BR-402 đỏ: check-in-preview trả `amountDueAtCheckinVnd` = 0, BR đòi 208.000. Nhận phòng không thu tiền vẫn trả 200. Sau nhận phòng folio còn thu 208.000.
  - B18 thu 208.000, folio settled. Tổng tiền đúng, chỉ sai thời điểm thu.
- **BUG-R2-123** (`r2regr/old__v-move-3-1__k1-restore-lane-assign.test.ts`, 5/5 xanh): log `S1-move-preview` trả 422 `overbookingResolution REQUIRED`. Gán căn B7a sang 201 trả 200. Lỗi P3 còn nguyên.

Critic đọc lại mã ở 2f77889 cho các gốc Major và Minor. Mã khớp mô tả của người báo:
- `incidentalNet`: `checkin.service.ts` 433–449.
- `priorNightDelta` và `extraNightDelta` dùng `room.base_occupancy` (`checkin.service.ts` 382/394, `checkout.service.ts` 835/847). Trong khi đó `nightBases` dùng `protectedBaseOf` (`reservations.service.ts` 2160–2175).
- `evaluate()` không xét `priorNight.available` (288–300).
- `agreedRate` có nhánh `flag === undefined` (`stay-support.ts` 195–209).
- `currentBookingRate` lọc theo `n.manual`.
- Vòng `gone` ở `minibar.service.ts` 310–316.
- `setNightRate` không ghi `deposit_required_vnd`.

## Critic – phân xử phát hiện mới

| Mã | Kết luận | Mức | Ai sửa | BUG đề xuất | Lý do |
|---|---|---|---|---|---|
| S438R2-MOVE-01 xem trước/trần QR đêm thêm B9a, B18 tính phụ thu theo định mức căn, lệnh ghi dùng định mức bảo vệ | **Major-fix-now** | P1 | BE-A | BUG-R2-125 | 2/2 tái hiện, cùng số. B9a: xem trước và trần QR 2.176.000, lệnh ghi cho tối đa 2.026.000. B18: 942.000 so với 792.000. QR `check_out` 942.000 tạo và xác nhận được, rồi B18 trả 422 OVERPAYMENT: khách trả thừa 150.000. Trái BR-417 (5), BR-416 v0.3.8 và G1 "xem trước = lệnh ghi". Hồi quy: bản sửa BUG-R2-112 chỉ đổi phía ghi. |
| R2PAY-01 đơn lịch giá có mọi đêm đã sửa S4-35 bị coi là đơn giá thỏa thuận | **Major-fix-now** | P1 | BE-A | BUG-R2-126 | 2/2 tái hiện, cùng số. B13 không gõ giá ghi thẳng 600.000 thay vì 708.000. B9a gợi ý 650.000 thay vì 792.000. B18 gợi ý 600.000 thay vì 667.000. Sửa tăng giá thì thu thừa. Theo BR-417 (2) v0.3.8, "thỏa thuận" là giá nhập tay lúc đặt. Hồi quy do 2f77889. |
| R2REGR-01 (cùng gốc R2PAY-01) | **Major-fix-now** | P1 | BE-A | gộp BUG-R2-126 | 2/2 tái hiện. A1 thu thiếu 164.000. Sửa tăng thì thu thừa 39.000 / 158.000. |
| R2PAY-02 B9a khi đêm trước có khách | **Major-fix-now** | P1 | BE-A (+ FE-A, ARC mô tả) | BUG-R2-127 | 2/2 tái hiện. Xem trước và trần QR cộng tiền một đêm không bán được: 1.750.000 thay vì 1.000.000. QR thu 2.151.000, khách thừa 917.000, phải đi luồng hoàn BR-522. Desk không đọc `priorNight.available`. Lỗi có từ trước vòng sửa. |
| S438R2-CANCEL-01 sửa giá đêm S4-35 không tính lại cọc yêu cầu | **Major-fix-now** | P1 (nâng từ P2) | BE-A (DOM xác nhận một dòng) | BUG-R2-128 | 2/2 tái hiện, cả hai xếp P1. BR-309 ghi cơ sở phí = 30 % tiền phòng **hiện hành**. Sai cả hai chiều: khách mất 100.000, hoặc OTTIMO mất 100.000–200.000. Ca A9c/W4: cùng trạng thái tiền mà phí là 400.000 hay 300.000 tùy có một lệnh B7 không đổi tiền xen vào. Chính lệnh B7 đã coi giá S4-35 là tiền phòng hiện hành. Đọc "tính lại sau mỗi B7/B8" thành danh sách đóng thì ra kết quả vô lý như vậy. |
| R2FOC-02 minibar đếm về 0 (hoặc void dòng) rồi đếm lại > 0: FOC không tự khôi phục | **Major-fix-now** | P1 (nâng từ P2) | BE-B (+ ARC xác nhận cách nối chuỗi) | BUG-R2-129 | 2/2 tái hiện, cả hai xếp P1. Khách trả thừa 35.000 (862.000 thay vì 827.000). BR-434 v0.3.8 ghi rõ FOC "tự khôi phục khi dòng có lại", và S4-23 (4) ghi "bất kể lịch sử thao tác". Giả định (m) của BE-B chỉ mang nhãn chờ ARC, DOM chưa xác nhận, nên không thắng BR. Cách vòng "tự áp lại" làm hạn mức BR-433 bị trừ đôi. |
| R2REGR-03 đếm lại minibar sau khi một món bị gỡ khỏi danh mục | **Major-fix-now** | P1 (nâng từ P2) | BE-B (BE-D phối hợp) | BUG-R2-130 | 2/2 tái hiện qua API thật (PATCH /items), cả hai xếp P1. Dòng 70.000 khách đã dùng bị đảo, B18 hỏi 0. Không có dấu hiệu gì. Lễ tân không sửa lại được (422 NOT_IN_LIST). Trái BR-702 và US-066 AC2. Lỗi có từ trước vòng sửa. |
| R2FOC-01 `incidentalNet` tính dòng đảo FOC trên chênh lệch là khoản phát sinh | Minor | P2 | BE-A | BUG-R2-131 (tách khỏi BUG-R2-111) | 2/2 tái hiện, đều P2. Tổng đúng, B18 chặn trả phòng tới khi thu. Phần sai là cổng nhận phòng (BR-402 v0.3.8). Biến thể D (203 → 302 → 401) gợi ý thu 250.000 thay vì 375.000, tức không chỉ kẹp về 0. Lượt 1 đã gộp vào mã P1 mà chưa sửa. Sửa cùng vòng, vì cùng tệp với BUG-R2-125 và 127. |
| R2REGR-02 | Minor | P2 | BE-A | gộp BUG-R2-131 | Trùng R2FOC-01 đường 2. |
| R2PAY-03 `currentBookingRateVnd` khác null với đơn lịch giá có đêm `manual` | Minor | P2 | BE-A (+ ARC mô tả) | BUG-R2-132 | 2/2 tái hiện, đều P2. Tiền chỉ sai khi lễ tân bấm "Giữ giá đơn", và nút có hiện số. D9 thu thừa 100.000; K2 thu thiếu 150.000–192.000. Trái hợp đồng "null = đơn theo lịch giá". Lỗi có từ Sprint 3. Cùng khái niệm "đơn thỏa thuận" với BUG-R2-126 nên sửa cùng. |
| R2PAY-04 đơn thỏa thuận cũ không có cờ mất giá thỏa thuận sau một lần B13 | Minor | P3 | BE-A | gộp BUG-R2-126 | 2/2 tái hiện, đều P3. Chỉ chạm đơn tạo trước 2f77889. Cùng nhánh dự phòng `flag === undefined`; bù cờ cho đơn cũ là sửa luôn. |
| S438R2-MOVE-02 fallback căn gốc cho dòng cũ bỏ qua dòng B7a `upgraded` | Minor | P3 | BE-A | BUG-R2-133 | 2/2 tái hiện, đều P3. Thu thiếu 416.000, nhưng chỉ với dữ liệu có origin NULL từ trước 0059. Mã hiện hành không có đường nào đặt lại NULL. Làm ở tuần Ổn định, hoặc trước khi đưa dữ liệu cũ vào môi trường dùng thử. |
| R2FOC-03 lễ tân sửa số lượng dòng minibar rồi qua H16 bước 1 với số đếm cũ | Note | – | DOM (quy tắc), UXD/FE-A | – | 2/2 tái hiện hành vi. Cả hai kết luận không lệch BR (một người xếp P3, một người not-a-bug). Theo BR-702/703, lần xác nhận ở H16 bước 1 là lần mới nhất, và màn hình hiện 70.000 trước khi bấm. Câu "giữ số lễ tân đã sửa" ở s4-be-b mục 11 là mô tả thiết kế; giả định (l) chỉ nói về sửa giá. Đề nghị DOM chốt thứ tự ưu tiên; FE cảnh báo khi số lượng trên folio khác `latestCheck`. |
| S438R2-MOVE-03 swap ghi giảm phụ thu mà không có bản tính thử/tick | Note (đã biết) | – | ARC, BE-A, FE-A (R3) | – | Đã ghi ở lượt 1, và ARC đưa vào 0.3.7 bổ sung 4 (3), `x-round R3`. Tiền đúng BR và có lợi cho khách. Desk chưa gọi swap. Khi cài phải bắt cả (d2). Ghi chú phụ: swap ghi `change_reason_code = other`, mà BR-429 (b) nói "other sang căn giá cao hơn cần FDL+". DOM xem. |
| S438R2-CANCEL-02 rút muộn rồi kéo dài vẫn giữ mức cọc yêu cầu cũ | Note | – | DOM | – | 2/2 tái hiện, đều P3. Lệch chữ BR-309-11 nhưng đúng ý chống lách: làm theo chữ thì khách lách được 1.200.000. DOM sửa chữ: mức giữ còn hiệu lực qua các lần B7/B8 sau, và nói rõ trường hợp lần sau không phải `guest_request` (C3/C5). Xử lý cùng ESC-023. Nếu DOM giữ chữ hiện tại thì ca này thành P1, BE-A sửa. |

## Major-fix-now theo gốc (danh sách sửa cho BE)

| BUG đề xuất | Phát hiện | Ai sửa | Chỗ sửa (2f77889) | Số đúng cho test |
|---|---|---|---|---|
| BUG-R2-125 | S438R2-MOVE-01 (hồi quy) | BE-A | `frontdesk/internal/checkin.service.ts` `priorNightDelta` (382, 394) và `checkout.service.ts` `extraNightDelta` (835, 847) đang dùng `room.base_occupancy`. Phải lấy định mức cùng nguồn với lệnh ghi: `ReservationsService.nightBases` = max(`protectedBaseOf`, định mức căn). Áp cho xem trước, trần QR và kiểm `finalPayment`. Xem cả nhánh OTA. | 302 (3 NL) → 202 bằng B7 sự cố hoặc swap, B9a giá 792.000: xem trước = trần QR = B9a = 2.026.000, tổng 2.626.000. Swap 402 ↔ 101, B9a 667.000: 2.067.000. B14 sự cố rồi B18 19:00: 792.000 (402 → 203) và 708.000 (302 → 201); QR không thừa. Đối chứng đơn đặt thẳng 3 NL: giữ 2.226.000 và 2.200.000. |
| BUG-R2-126 | R2PAY-01, R2REGR-01 (hồi quy) + R2PAY-04 (P3) | BE-A | `frontdesk/internal/stay-support.ts` `agreedRate` (195–209), nhánh `flag === undefined`. `reservations/public/pricing.service.ts:434` chỉ ghi cờ cho đơn thỏa thuận. Hướng sửa: ghi cờ cho mọi đơn (ví dụ `calendar`); thêm migration bù cờ cho đơn cũ, xét theo các đêm lúc đặt; rồi bỏ nhánh dự phòng. Đêm S4-35, B9a, B13, B18 không được làm đổi nguồn giá của đơn. | Đơn lịch giá có mọi đêm đã sửa: 203 B9a 792.000. 201 B13 708.000, tổng 1.308.000. 101 B18 667.000. 201 thứ Sáu 814.000. 101 thứ Bảy 767.000. 103 thứ Sáu 863.000. Sửa tăng: 203 thứ Sáu 911.000, 202 thứ Tư 792.000. Đơn thỏa thuận giữ nguyên: 650.000, 700.000 (TC-L3-013). Đơn thỏa thuận cũ, sau B13 theo giá mặc định: B18 800.000, tổng 4.000.000. |
| BUG-R2-127 | R2PAY-02 | BE-A (+ FE-A, ARC) | `checkin.service.ts` `evaluate()` (288–300): chỉ cộng `priorDeltaVnd` khi `priorNight.available`. `amountDueForQr()` (164–185): từ chối `addPriorNight` (422 `NOT_ALLOWED`) khi đêm không trống. FE-A: `CheckInPage.tsx` (228, 251, 826–828) đọc `priorNight.available`. ARC: sửa mô tả `CheckInPreview.amountDueAtCheckinVnd`. | 103: 1.000.000 (không phải 1.750.000); QR có `addPriorNight` → 422. 302: 1.234.000; sau B9 lúc 14:00 folio 0/0, credit 0. Đối chứng 203 có đêm trước trống: giữ 1.876.000. |
| BUG-R2-128 | S438R2-CANCEL-01 | BE-A (DOM xác nhận) | `reservations/public/stay-night-pricing.ts` `setNightRate`: ghi lại `deposit_required_vnd` theo cùng quy tắc của `requiredDepositAfter` (`reservations.service.ts` ~2806–2824). Kiểm cả đơn `hold`. DOM chốt ngoại lệ < 7 ngày cho lần sửa giá của nhân viên. | 201 hai đêm 540.000 (tổng 1.080.000): cọc yêu cầu 300.000; hủy khi còn 2 ngày: phí 300.000, hoàn 200.000; no-show: giữ 300.000, hoàn 200.000. Hai đêm 900.000: cọc yêu cầu 500.000, phí 500.000, hoàn 0. Hai đêm 1.000.000, khách cọc 700.000: phí 600.000, hoàn 100.000. Có hay không có lệnh B7 xen vào thì cùng số. |
| BUG-R2-129 | R2FOC-02 | BE-B (+ ARC) | `inventory/internal/minibar.service.ts` `record()`: khi món không còn dòng sống (đếm 0, hoặc dòng bị void bằng adjustments), nối `relatedLineId` của dòng mới vào cuối chuỗi của chính món đó trong lượt. Cách khác: đổi khóa minibar trong `folio/public/reductions.ts` thành lượt × minibar × món. Gỡ giả định (m) trong decision-log. | 202, bia 2 → 0 → 2: FOC applied 35.000, tổng 827.000, còn thu 35.000, ròng 35.000. Void dòng rồi đếm 2: cùng số. 2 → 0 → 1: ròng 0. 101, 2 → 1 → 2 → 0 → 1: tổng 667.000, còn thu 0. Hạn mức BR-433 không bị trừ đôi. |
| BUG-R2-130 | R2REGR-03 | BE-B (BE-D phối hợp) | `minibar.service.ts` 310–316, vòng `gone`: món vắng mặt vì đã rời danh mục chuẩn (`is_active = false` hoặc định mức 0) thì giữ nguyên dòng và chép sang lần đếm mới, không đảo. | 402, đếm lại sau khi tắt bia: minibar giữ 70.000. Có thêm 1 snack: 100.000 (ví dụ BR-702). Coca đặt định mức 0: giữ 25.000. B18: 958.000 + 70.000 = 1.028.000. Đối chứng đổi giá món: giữ 70.000 (hiện đã đúng). |

Việc chung cho 6 mã:
- Chuyển ca của người tái hiện (`w-r2*`) vào `test/integration/`, kỳ vọng theo số ở bảng trên.
- Thêm dòng oracle vào `br-examples.json` cho:
  - BR-434: minibar đếm về 0 rồi > 0;
  - BR-309-11: sửa giá S4-35;
  - BR-417 (1) + (5): đêm trước không trống;
  - BR-417 (2): đơn lịch giá có mọi đêm đã sửa;
  - BR-429 (b2): đêm thêm sau khi OTTIMO đổi căn.
- Mã 125 và 126 là hồi quy. Khi đổi một phía của cặp xem trước/ghi (`nightBases`, `agreedRate`), BE-A thêm ca "xem trước = lệnh ghi" cho đường đó.

## Minor và Note – kế hoạch

| Mã | Mức | Ai | Kế hoạch |
|---|---|---|---|
| BUG-R2-131 (`incidentalNet`) | P2 | BE-A | Sửa cùng vòng (cùng tệp `checkin.service.ts`). Dòng đảo của foc/discount lấy loại theo `related_line_id` của dòng gốc (gọi đệ quy `categoryOf`). Số đúng: đường 1 (B12) 250.000; đường 2 (v-foc-3-0) 208.000; biến thể 203 → 302 → 401: 375.000. Nhận phòng không thu → 409. Đối chứng D3 giữ 250.000. Sửa xong thì đóng BUG-R2-111. |
| BUG-R2-132 (`currentBookingRateVnd`) | P2 | BE-A + ARC | Sửa cùng BUG-R2-126: `stay.service.ts` `currentBookingRate` (222–227) gọi `agreedRate(tx, row, 'last')`. Số đúng: 101 sau B9a → null, đêm 8/12 667.000, tổng 2.768.000. Đơn lịch giá có đêm S4-35 hoặc đêm B13 gõ → null. Đơn thỏa thuận 700.000 giữ 700.000. ARC sửa mô tả trường. |
| BUG-R2-133 (fallback căn gốc) | P3 | BE-A | Tuần Ổn định. Lịch sử bắt đầu bằng dòng ∅ → X `upgraded` thì căn gốc = `overbooking_incident.requested_room_id`. Số đúng: 208.000 × 2; xin tiếp sang 302: 125.000 × 2. Trước khi đưa dữ liệu demo/staging cũ vào dùng thử, OPS đếm số đơn có origin NULL; có thì sửa trước. |
| BUG-R2-123 | P3 | BE-A + ARC | Giữ hẹn tuần Ổn định. |
| R2FOC-03 | Note | DOM, UXD/FE-A | DOM chốt số nào thắng: số lượng sửa trên folio hay lần đếm. Không chặn cổng. |
| S438R2-MOVE-03 | Note | ARC, BE-A, FE-A | Làm ở R3 như đã hẹn. |
| S438R2-CANCEL-02 | Note | DOM | Sửa chữ BR-309-11, xử lý cùng ESC-023. |

## Test cũ phải đổi kỳ vọng

Các thay đổi dưới đây không phải lỗi mã. Bản đã đổi nằm ở:
- `r2foc/exp-*`;
- `r2move/old-*`;
- `r2cancel/` (ghi chú "R2 EXPECTATION CHANGE");
- `r2pay/old-*` (ghi chú "r2pay:");
- `r2regr/old__*` (ghi chú "r2regr:").

Ba người kiểm đổi độc lập và ra cùng số.

**(a) Theo DOM chốt BR v0.3.8.** Số cũ ghim hành vi lỗi hoặc theo chữ BR trước khi DOM chốt.

| Tệp / ca | Cũ → mới | Oracle |
|---|---|---|
| v-foc-1-0 (main, control A, control B, variant C, variant D); v-foc-1-1 (R1, R2, R3) | Đêm thêm 1.000.000 → 900.000. Tổng 5.770.000 → 5.670.000; 6.670.000 → 6.570.000; 6.370.000 → 6.270.000; 5.635.000 → 5.535.000. Cần thu 470.000 → 370.000; 370.000 → 270.000; 420.000 → 320.000; 485.000 → 385.000 | BR-416-04/05 |
| pay/added-night-tier N2 | Đêm 21/11: 600.000 → 690.000 | BR-417-04, DOM-01 |
| v-pay-3-0 N1-Y2, k0 C | Coi giá gõ 777.000 là giá cuối → gõ 863.000 là giá lịch, ra 4.929.000 | BR-107-05 |
| v-pay-3-1 | F 917.000 → 825.000. N2 667.000 / 4.357.000 → 767.000 / 4.380.000. N2w 708.000 / 4.722.000 → 637.000 / 4.651.000. T 911.000 / 5.296.000 → 820.000 / 5.205.000. Y 863.000 / 5.015.000 → 777.000 / 4.929.000 | BR-107-05/06, BR-416-04, BR-417-04 |
| pay/b9a-due A, A2; v-pay-0-0 A, A2, A3; v-pay-0-1 c1–c3 | A: 667.000 / 3.569.000 / 4.357.000 → 767.000 / 3.180.000 / 4.380.000. A2: 3.762.000 → 3.351.000 (bản v-pay-0-0: 708.000 / 3.326.000 / 4.626.000 → 814.000 / 3.351.000 / 4.651.000). A3: tổng → 9.316.000. c1–c3: cộng tier(R) thay vì R | BR-417-04…06 |
| v-pay-1-1 A, B | 2.050.000 và 409 → 2.200.000 và 200 | BR-417-05 |
| c-a1 X1b, v10 X1b-B7, v10-peak-flag VK10 X1b, v11 V3, v11-peak-flag X1b-B8 | Phí 0, hoàn 100 % → phí 500.000, hoàn 100.000 | BR-309-12 |
| v00 V1–V6 (cọc yêu cầu đóng băng) | V1 1.584.000 / 16.000 → 500.000 / 1.100.000. V2 500.000 → 1.600.000. V3 1.584.000 → 500.000 / 1.100.000. V4 900.000 → 600.000 / 300.000. V5 600.000 → 400.000 / 300.000. V6 600.000 → 900.000 | BR-309-11, BR-311-03 |

**(b) Test viết sai hoặc theo hợp đồng cũ.** Không phải DOM, không phải lỗi mã:
- v-foc-3-1 C3: khách đã trả 250.000, sau B14 chỉ còn nợ 208.000, tức thừa 42.000. B18 trả 422 `OVERPAYMENT_HANDLING_REQUIRED` kèm `unhandledCredit` 42.000 là đúng BR-522.
- v-move-3-1 k1 S1 (assignMgr 200 → 409, move 200 → 422) và restore-unassigned A (move 200 → 422): lần gán đầu nay thành công, nên các lần thử sau chạy trên đơn đã hết xung đột.
- v-pay-1-0 A, C, pay02-independent: bỏ lần nhận phòng thứ hai, vì lần đầu nay đã thành công.
- v-pay-3-0 N2b: biểu thức `preview-paid` bị đảo dấu.
- v-regr-0-1 ca (2) và B; regr/money-regr hai ca (B): công thức "client cộng chênh" đã bị ARC bỏ ở OpenAPI 0.3.7 bổ sung 4 (1). Trần bằng 0 thì không tạo QR (BR-417-06).
- v20 X3, v21 X3b: yêu cầu hoàn cũ đã tự hủy ở B12, nên duyệt hoặc chi đều trả 409 (không còn 200 hay 422).
- v31 K1, K2, K4, K5: `refundApprovalRequestId` ở lần ghi là id yêu cầu đang mở, đúng hợp đồng CancellationQuote. Trường này chỉ vắng ở dryRun.

**(c) Ghi nhận hành vi hiện tại, chờ quyết định.** Không tính là lỗi:
- v-foc-3-1 C1: giảm giá đặc biệt trên `room_change_difference` trả 422. Đây là Note từ lượt 1, chờ DOM.
- c-a2 Y12: kỳ vọng "phải 422" đổi thành 200 (CANCEL-05). Không BR hay hợp đồng nào đặt trần. Chờ ARC/DOM.

**(d) Giữ đỏ, vì đây là lỗi mã:** v-foc-3-0 `foc04-ota-diff-second-move` (BUG-R2-131). Không đổi kỳ vọng.

r2regr đếm 57 ca đỏ trên 460 ca cũ. Chia theo nhóm: 39 ca nhóm (a), 15 ca nhóm (b), 2 ca nhóm (c), 1 ca nhóm (d).

## Đối chiếu điều kiện của lượt trước

Các điều kiện lấy từ `s4-money-verification.md`, mục Khuyến nghị.

| Điều kiện | Trạng thái ở 2f77889 |
|---|---|
| 1. Đóng 11 mã Major BUG-R2-109…119 | 10 mã xong, có số. BUG-R2-111 còn phần `incidentalNet`. |
| 2. Sửa cùng vòng 120, 121, 122; 123 và 124 sang Ổn định | 120, 121, 122, 124 xong. 123 còn mở, đúng hẹn. |
| 3. Lượt kiểm lại | Xong (báo cáo này). Riêng FOC-01 qua Desk H16 thật **chưa chạy**; mới chỉ suy từ mã FE. |
| 4. Bổ sung ca cho gap chạm tiền | Đã làm: luồng làn chưa gán sau B12 (R6, R6b, R6c, R7, R25, G, D9). Làm một phần: sửa giá đêm B9a/gia hạn; phần này sinh ra BUG-R2-126 và 132. FE `CheckOutPage.tsx`: critic đọc mã 2f77889, thấy đã dùng `amountDueAtCheckoutVnd` của server (dòng 286–294); chưa chạy UI. **Chưa làm**: hoa hồng S4-03 sau B8, khi hủy, khi no-show (tenant thử không có CTV/SAL); đua nhận phòng ‖ duyệt FOC; đua xác nhận QR ‖ B9. |
| 5. ORC ghi decision-log "không sai tiền" cho S4-37 và S4-47; DOM quyết MOVE-06 | Chưa thấy trong decision-log. S4-37 vẫn "không sai tiền". **S4-47 nay chưa kết luận được**: BUG-R2-125 làm QR `check_out` thu thừa 150.000 khi đơn có định mức bảo vệ. |
| 6. QA gỡ `pendingFix` cũ | Còn 20 dòng `pendingFix`, không dòng nào thuộc S4-38. Gỡ được 11 dòng vì đã khớp oracle trên 2f77889: BR-110-10/11/12, BR-416-03, BR-522-02, BR-412-12/13/14, BR-424-02/03, BR-428-04. Ba dòng BR-416-02, BR-527-06, BR-903-04 có test đọc theo id và đang xanh mà vẫn `pendingFix`, trái quy ước. 6 dòng còn lại chưa ai chạy. |
| 7. G5 api và E2E xanh | api 2.689/2.689 × 2 trên 2f77889. Lượt này chưa chạy E2E. |

## Gaps

- Cả 5 hướng đều không chạy E2E/UI. Desk H13/H16, nút "Giữ giá đơn" và luồng H16 bước 1 (R2FOC-03) chỉ suy từ mã.
- Harness r2foc không thử được trần VietQR `check_in` (409 PAYMENT_NOT_CONFIGURED). Các hướng khác thử được.
- Hoa hồng S4-03 sau B8, khi hủy, khi no-show, và NV sale 3 %: vẫn chưa dựng được đơn CTV/SAL. Gap này có từ lượt 1.
- Chưa phủ: đơn dài hạn (B8 nhập tay trả 422; đơn theo HĐ chưa dựng); kênh CTV; đơn hold bị sửa giá S4-35.
- Đua còn thiếu:
  - nhận phòng ‖ duyệt FOC;
  - xác nhận QR ‖ B9/B9a;
  - B18 ‖ QR `check_out`;
  - swap ‖ B7/B14/`adjustFolioLine`;
  - duyệt ‖ khôi phục no-show.
- Có một lần B12 trả 409 khi đua với lệnh chi. 15 vòng sau không tái hiện được. Tiền vẫn nhất quán.
- Hạn mức BR-433 khi FOC đổi trạng thái do tự đồng bộ: mới kiểm trạng thái, chưa kiểm số hạn mức.
- Trần QR `check_in` so với trần `checkIn.payment` khi có FOC chờ trên khoản phát sinh (giả định (f)): chưa kiểm phía QR.
- Câu hỏi cho DOM, không tính là phát hiện:
  - đêm thêm sau khi OTTIMO swap lấy lịch của căn hiện tại hay căn khách đặt (R22);
  - đơn OTA bị OTTIMO dời sang căn định mức thấp rồi B9a/B18: đơn con Trực tiếp không mang định mức bảo vệ;
  - ngoại lệ chống lách có áp cho lý do khác `guest_request` không (force_majeure, other);
  - MOVE-06 (B14 với `expectedDeltaVnd` khi chênh 0) vẫn treo.
- `causedByFix` của S438R2-MOVE-01 suy từ diff, chưa chạy trên cây 08dabd3. Hai người tái hiện đều đối chiếu `git show 72fa486` và ra cùng kết luận.
- Quy trình: một số test gốc ghi log vào đường cố định (`/tmp/k1`, `/tmp/vmove31`, `scratchpad/s438/v-*`). Khi chạy lại, r2regr đã ghi đè một phần log của lượt 1. Vòng sau nên đổi hướng log trước khi chạy.

## Khuyến nghị cổng QC Sprint 4

**CHƯA.** Với commit 2f77889:
- **G1 không đạt.** Còn 7 phát hiện sai tiền, gộp thành 6 mã BUG-R2-125…130. Trong đó 2 mã là "xem trước ≠ lệnh ghi", trái đúng tiêu chí G1: BUG-R2-125 ở B9a/B18 và BUG-R2-127 ở B9a. Ngoài ra BUG-R2-131 và 132 cho số phải thu hoặc số gợi ý sai, dù tổng folio đúng.
- **G7 không đạt.** Có 6 mã P1 mới đang Open, trong đó 2 mã do chính vòng sửa gây ra.

Điều kiện để vào cổng:
1. Đóng BUG-R2-125…130. Mỗi mã có test oracle với số ở bảng "Major-fix-now theo gốc".
2. Sửa cùng vòng BUG-R2-131 (rồi đóng BUG-R2-111) và BUG-R2-132. BUG-R2-123 và 133 sang tuần Ổn định, kèm kế hoạch. Riêng với 133, OPS/QA xác nhận DB dùng thử không có đơn origin NULL từ trước 0059, hoặc đã sửa các đơn đó.
3. DOM chốt các điểm sau. Các điểm này không chặn BE sửa 125–130.
   - (a) Ghi rõ BR-434 không có ngoại lệ (m). BE-B gỡ giả định (m).
   - (b) Thêm vào BR-309-11: "tiền phòng hiện hành" gồm giá sửa S4-35. Chốt ngoại lệ < 7 ngày cho lần sửa giá của nhân viên.
   - (c) Sửa chữ BR-309-11 cho chuỗi rút muộn rồi kéo dài (S438R2-CANCEL-02), xử lý cùng ESC-023.
   - (d) Chốt R2FOC-03.
   - (e) Quyết MOVE-06, còn treo từ lượt 1.
4. ARC sửa mô tả `CheckInPreview.amountDueAtCheckinVnd` (chỉ cộng đêm B9a khi `priorNight.available`) và `ExtensionOptions.currentBookingRateVnd`. FE-A sửa `CheckInPage.tsx` để đọc `priorNight.available`.
5. Lượt kiểm lại trên commit sửa:
   - chạy lại **toàn bộ** `test/s438/r2*/` và `w-r2*/`, không chỉ ca đỏ, vì 2 lỗi mới là hồi quy của vòng sửa trước. Trước đó đổi kỳ vọng của 3 ca Note theo quyết định DOM;
   - mục tiêu: 0 ca đỏ ngoài Note; xem trước = trần QR = lệnh ghi ở B9a và B18, kể cả đơn có định mức bảo vệ;
   - critic chấm lại một lượt ngắn.
6. ORC ghi decision-log:
   - S4-37 `otaPenaltyVnd`: "không sai tiền" (CANCEL-05 vẫn là Note);
   - S4-47: chỉ kết luận sau khi đóng BUG-R2-125.
7. QA:
   - gỡ `pendingFix` cho 14 dòng nêu ở mục đối chiếu (11 dòng khớp oracle, 3 dòng đang xanh);
   - cập nhật bug-list: BUG-R2-124 đã sửa; tách phần còn lại của BUG-R2-111 thành BUG-R2-131.
8. G5: api và E2E xanh trên đúng commit chấm. Bổ sung ca cho các gap chạm tiền còn thiếu: hoa hồng S4-03 sau B8, khi hủy, khi no-show; đua nhận phòng ‖ duyệt FOC; đua xác nhận QR ‖ B9. Nếu không kịp, ORC ghi rõ việc dời sang tuần Ổn định.

G1 chưa xanh nên áp quy tắc lùi cổng (sprint-4-plan mục 11.2): cổng QC Sprint 4 lùi sang tuần Ổn định. Không cấp ngoại lệ tiền.

## Tệp của critic

Thư mục `/private/tmp/claude-501/-Users-anhvh-Library-Application-Support-Claude-scratch-workspaces-00554cf2-3678-4864-82b0-830aaeaa97bd-4c0caebe-be05-49c5-a5a2-5bf357fddc6a-scratch-2026-10-15-c4f0d4/36df3adc-c586-471c-a039-340d2b696728/scratchpad/s438/rcritic/`:
- `env.sh`
- `run1.log`: 5/6 xanh; 1 đỏ (v-foc-3-0, BR-402, `amountDueAtCheckinVnd` 0 ≠ 208.000)
- `k1/k1.jsonl`: log BUG-R2-123 (`S1-move-preview` 422)

DB `ottimo_test_s438_rcritic` đã được xóa sau khi chạy.
