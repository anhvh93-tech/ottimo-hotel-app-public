# Kiểm lại tiền S4-38 lần 3 – commit 42fb458

Đây là lượt kiểm lại thứ ba của S4-38 (Round 2 Sprint 4, tuần Ổn định). Lượt này chạy sau vòng sửa 2 (decision-log ORC 18/10). Có 5 người kiểm: `r3pay`, `r3rate`, `r3dep`, `r3mini`, `r3regr`. Họ kiểm 10 mã đích (BUG-R2-111, 125…132), 3 chốt DOM 18/10 (BR-309-13, BR-309-14, BR-424-07) và tìm thêm 9 phát hiện mới. Mỗi phát hiện mới có 2 người tái hiện độc lập (`x-r3*`). Mỗi người tự viết test, tự tính số từ BR v0.3.8, chạy trên PostgreSQL thật, DB riêng `ottimo_test_s438_r3*` / `xr3*`, bản sao cố định 42fb458 (src không sửa).

Test nằm ở `scratchpad/s438/wt/product/services/api/test/s438/` (chưa track trong repo). Thư mục `r3*/` là của người kiểm, `x-r3*/` là của người tái hiện.

Ghi chú thời điểm:
- Báo cáo chấm commit **42fb458** (vòng sửa 2, sau 2f77889).
- Mốc BR là BR v0.3.8 và bổ sung 18/10 (BR-309-13, BR-309-14, BR-424-07, BR-434-15).
- ESC-023 vẫn chờ INV. Nếu INV chọn B/C thì bỏ phần mức giữ của BR-309-14.

## Tóm tắt

- 10 mã đích: **10 ĐÃ SỬA**, có số. Đề nghị đóng BUG-R2-111 (phần còn lại đã đóng qua BUG-R2-131).
- 3 chốt DOM 18/10 (BR-309-13, BR-309-14, BR-424-07): mã làm đúng, có số.
- 2 mã P3 hẹn tuần Ổn định (BUG-R2-123, 133): **CHƯA SỬA**, đúng hẹn. Critic chạy lại: lỗi còn.
- 9 phát hiện mới: **5 Major-fix-now** (5 mã P1), 2 Minor (1 P2, 1 P3), 2 Note, 0 CLOSED.
- Cả 18 lượt tái hiện đều tái hiện được, cùng hành vi với người báo.
- Critic đổi mức 3 phát hiện so với người báo:
  - nâng lên P1: R3MINI-04 (cả hai người tái hiện cũng xếp P1);
  - hạ xuống Note: R3PAY-02, R3MINI-05 (cả hai người tái hiện đều xếp not-a-bug).
- **Minibar là chỗ yếu**: 4/5 mã P1 mới nằm ở `minibar.service.ts` `record()` và khóa FOC minibar. Đây là vòng thứ ba liên tiếp minibar có lỗ hổng mới.
- Hồi quy:
  - R3MINI-01 có một đường do vòng sửa 2 gây ra (bản sửa BUG-R2-129, nối chuỗi từ dòng đã đảo);
  - R3RATE-01 do vòng sửa 1 (2f77889, TC-L3-013) gây ra; lượt 2 bỏ sót.
- Hồi quy chung tốt. api 2.708/2.708 × 3 lượt, admin-web 324/324. Trong 1.230 ca test cũ, không ca nào đỏ do lỗi mã mới.
- **42fb458 chưa đạt G1**: còn 6 phát hiện sai tiền (5 P1 + 1 P2 xem trước ≠ lệnh ghi). **Chưa đạt G7**: 5 mã P1 mới.

## Kết quả từng hướng kiểm

**r3pay** (BE-A là chủ chính):
- 14 tệp test cũ (123 ca) chép sang `r3pay/old-*`, xanh sau khi đổi 4 kỳ vọng. Test chính thức `checkin-payment`, `checkout-due`, `s438-money`, `s438r2-money`, `vietqr-stay-step`: 45/45.
- 26 ca tấn công mới, 24 xanh. Toàn thư mục 153/158. 5 ca đỏ đều có lý do: M8, M8b (R2FOC-03, Note), R18 (BUG-R2-133), F5b, F5c (R3PAY-01).
- Các ca đúng:
  - B9a/B18 với định mức bảo vệ: qua bậc 7 đêm, giá gõ, swap, sửa số người 3 → 2 → 3, mất bảo vệ khi khách tự xin đổi căn, Agoda trả trước và trả tại chỗ;
  - đêm trước của B9a ở mọi trạng thái (có khách, trống, vừa hủy, vừa no-show, OOO);
  - `incidentalNet` qua 2–4 tầng chênh lệch, có no-show + B12, FOC chờ, đơn con B9a.
- Lỗi còn lại: B18 khi đêm thêm không bán được (R3PAY-01). R3PAY-02 là Note.

**r3rate** (BE-A):
- 9 tệp test cũ: 17/62 đỏ trước khi đổi kỳ vọng (đúng các dòng kiểm cờ và ca "đơn cũ"), 62/62 sau khi đổi. `s438r2-money` 14/14. 11 tệp integration liên quan 150/150.
- Cờ nguồn giá trên mọi loại đơn mới và qua S4-35, B7, B13, B18: đúng (4/4).
- Migration 0064 chạy thật từ 0063, 2 tenant, 2 lần trên DB mới: 0 đơn thiếu cờ, RLS và FORCE bật lại, tiền đúng sau khi bù.
- Bậc BR-107 không giảm hai lần (8/8). BR-111 không cộng dồn.
- Lỗi còn lại: giá thỏa thuận mang sang căn mới sau B14 khách xin (R3RATE-01).

**r3dep** (BE-A):
- 33 tệp, 187/187 × 2 lượt. Test cũ `r2cancel`, `w-r2cancel-*`, `v-move-5-*`: 166/166 sau khi đổi 3 ca theo DOM 18/10 và siết 4 ca "chỉ ghi lại" thành khẳng định 409.
- BR-309-13, BR-309-14, BR-424-07 đúng. Hủy thử = hủy thật ở mọi ca.
- Không phát hiện mới. Có 2 câu hỏi cho DOM (mục Gaps).

**r3mini** (BE-B):
- `r3mini` cùng 9 tệp integration có chạm minibar: 211 ca, 203 xanh, 8 đỏ. Cả 8 ca đỏ thuộc R3MINI-01…06. 3 lượt cho cùng kết quả.
- Đối chứng `causedByFix` trên cây 2f77889 giải nén ra scratchpad, DB riêng (đã xóa).
- Các ca đúng: BR-434-15 (a), (b); hạn mức BR-433 không bị trừ hai lần qua 4 mốc; hủy `settled_while_dormant`; đếm `stayover` → 422; đếm sau B18 → 409; 16 vòng đua.
- Lỗi còn lại: 4 mã P1 (R3MINI-01…04), 1 P3 (R3MINI-06), 1 Note (R3MINI-05).

**r3regr**:
- api 2.708/2.708 × 3 lượt (lượt 3 trên DB mới). tsc build 0 lỗi. admin-web 324/324.
- 1.230 ca cũ (240 tệp), chép sang `r3regr/old/` để không ghi đè log người khác: 1.123 xanh, 106 đỏ, 1 skip, 2 lượt giống hệt. Phân loại 106 ca đỏ:
  - 45 ca: kỳ vọng trước khi DOM chốt v0.3.8; bản lượt 2 đã đổi đều xanh;
  - 24 ca: kỳ vọng cũ do vòng sửa 2 và DOM 18/10; bản sửa ở `r3regr/fixed/` 113/114 (ca còn đỏ là R18);
  - 18 ca: test sai hoặc theo hợp đồng cũ; bản lượt 2 đã sửa đều xanh;
  - 13 ca: Note chờ quyết định;
  - 6 ca: BUG-R2-133.
- 13 ca cho nhánh mới (N1–N7), xanh 2 lượt. 16 dòng `pendingFix` đã khớp oracle khi chạy thật.
- Không phát hiện mới.

## Trạng thái mã cũ

| Mã | Mức | Trạng thái ở 42fb458 | Bằng chứng có số | Ghi chú |
|---|---|---|---|---|
| BUG-R2-111 | P1 | ĐÃ SỬA | Phần P1 vẫn xanh: D4, D5, D6, G1; xem trước = ghi = −42.000, tổng 1.808.000. Phần `incidentalNet` đóng qua BUG-R2-131. | Đề nghị đóng. |
| BUG-R2-125 | P1 | ĐÃ SỬA | 302 (3 NL) → 202 bằng B7 sự cố, B9a: xem trước = trần QR = B9a = 2.026.000, phụ thu đêm B9a 0. B18 = 792.000; QR rồi B18 không thừa. Qua bậc 7 đêm: tổng 5.913.000, phải thu 4.213.000. `finalPayment` 793.000 → 422 max 792.000. Agoda: đơn con 792.000, phụ thu 0. Swap 402 ↔ 101: B18 767.000. Khách tự xin đổi sau đó: mất bảo vệ, 150.000 × 3 đêm, B9a 2.226.000. | Đối chứng không bảo vệ: 942.000, 1.061.000. |
| BUG-R2-126 | P1 | ĐÃ SỬA | 62/62 test cũ sau khi đổi dòng cờ. 203 B9a 792.000; 201 B13 708.000, tổng 1.308.000; 101 B18 667.000. Đơn thỏa thuận giữ 650.000 / 700.000. 0064 chạy thật: đơn thỏa thuận cũ → `manual_agreed`, B9a 800.000, tổng 4.000.000; 0 đơn thiếu cờ. | Thiếu 0064 thì B9a gợi ý 917.000 thay vì 800.000: **0064 phải chạy trước khi app nhận tải**. Cùng hàm `agreedRate` còn kẽ hở R3RATE-01 (mới, có từ 2f77889). |
| BUG-R2-127 | P1 | ĐÃ SỬA | 202 có khách đêm trước: `available = false`, phải thu 1.234.000; QR `addPriorNight` → 422 `NOT_ALLOWED`; B9a → 409; B9 lúc 14:00 → 0/0, tổng 1.834.000. Đêm trước vừa trống do hủy: 2.026.000. OOO: 1.234.000. FE `CheckInPage` đọc `priorNight.available` (đọc mã). | Khe hở QR tạo trước khi đêm bị bán: R3PAY-02 (Note). |
| BUG-R2-128 | P1 | ĐÃ SỬA | 201, MGR sửa còn 560.000/đêm khi còn 5 ngày: cọc yêu cầu 300.000; hủy khi còn 4 ngày: phí 150.000, hoàn 350.000. Sửa tăng 1.000.000: 600.000; no-show giữ 600.000, hoàn 100.000. Hold: 400.000 → 600.000 → 300.000; ghi 300.001 → 422. Lý do `other`: 500.000. | – |
| BUG-R2-129 | P1 | ĐÃ SỬA | 202 bia 2 → 0 → 2: FOC applied 35.000, folio 827.000, B18 thu 35.000; hạn mức FDL 35.000 ở cả 4 mốc. 2 → 0 → 1: ròng 0. Chốt khi món vẫn 0: hủy `settled_while_dormant`, trả hạn mức. Trên 2f77889 các ca này đỏ. | **Bản sửa gây hồi quy** một đường của R3MINI-01 (FOC thứ hai trên cùng món). |
| BUG-R2-130 | P1 | ĐÃ SỬA | 402 tắt bia rồi đếm lại: giữ 70.000; thêm snack + 2 nước: 100.000 (BR-702-01); B18 thu 100.000. Coca định mức 0: giữ 25.000. Có FOC trên món đã tắt: FOC vẫn applied. | Bản sửa chỉ phủ `is_active = false` và định mức 0. Còn hở: đổi sang miễn phí (R3MINI-03), hạ định mức một phần (R3MINI-04). |
| BUG-R2-131 | P2 | ĐÃ SỬA | v-foc-3-0 xanh (critic chạy lại: xanh). Agoda 203 → 302 (FOC 125.000) → 401: xem trước = trần QR = 375.000; 374.000 → 409. Bốn tầng: 291.000. Có B9a: 1.417.000. N1p: nhận phòng 708.000, phụ thu đơn con 150.000 để tới trả phòng. | – |
| BUG-R2-132 | P2 | ĐÃ SỬA | 101 sau B9a → `null`, đêm thứ Ba 667.000, tổng 2.768.000. Đơn thỏa thuận 7 đêm 700.000 → 700.000 (không phải 630.000); "Giữ giá đơn" 8 × 630.000 = 5.040.000; B18 tổng 5.670.000. | Kẽ hở sau B14 khách xin: R3RATE-01. |
| BR-309-14 (S438R2-CANCEL-02) | – | ĐÚNG | 203, 7 đêm, cọc 1.600.000; rút 7 → 2, kéo 2 → 3, S4-35, B7 sự cố: cọc yêu cầu giữ 1.600.000 ở cả 4 bước. Hủy khi còn 2 ngày: phí 1.600.000, hoàn 0. Lý do khác `guest_request`: không tạo mức giữ. | ESC-023 B/C chưa thử (chờ INV). |
| BR-424-07 (S438-MOVE-06) | P3 | ĐÃ SỬA | B14 chênh 0, gửi 119.000 → 409 `SURCHARGE_CHANGED`, version, căn, folio đứng yên; gửi 0 → 200. Chuỗi "0" → 422; `null` → 200. Đơn gốc kèm đơn con: cả hai đứng yên khi 409. | – |
| BUG-R2-123 | P3 | CHƯA SỬA | Critic chạy lại: `S1-move-preview` vẫn 422 `overbookingResolution REQUIRED`. | Tuần Ổn định, đúng hẹn. |
| BUG-R2-133 | P3 | CHƯA SỬA | Critic chạy lại: 6 ca đỏ, dòng chênh lệch `[]` thay vì 208.000 × 2; căn gốc lưu `401` thay vì `203`. | Tuần Ổn định, đúng hẹn. |

## Critic chạy lại các mã chưa sửa

Chạy một lần trên DB mới `ottimo_test_s438_r3critic`, cây 42fb458, không sửa src. Log đổi hướng về `scratchpad/s438/r3critic/`. Kết quả 45 ca: 39 xanh, 6 đỏ, đúng 6 ca r3regr đã đếm cho BUG-R2-133.

- **BUG-R2-133** (`w-r2move-1-0/origin-fallback`, `w-r2move-1-1`, `r3regr/fixed/r2move` R18):
  - W1 (203 → B7a `upgraded` 401 → sự cố 101 → khách xin 402, origin NULL): chênh lệch `[]`, xem trước = ghi = 0. Đúng là 208.000 × 2 = 416.000. Căn gốc lưu thành `401`.
  - W3 (chỉ B7a rồi khách xin 402): cũng 0.
  - W4 của w-r2move-1-1 (xin tiếp sang 302): không có dòng chênh lệch, đúng là 125.000 × 2.
  - Đối chứng xanh: W2 (origin còn lưu) 416.000; W4 của w-r2move-1-0 (không có B7a) 416.000.
  - Kết luận: lỗi P3 còn nguyên, chỉ chạm dữ liệu origin NULL từ trước 0059.
- **BUG-R2-123** (`r2regr/old__v-move-3-1__k1-restore-lane-assign`, 5/5 xanh): log `S1-move-preview` trả 422 `overbookingResolution REQUIRED`. Gán căn B7a sang 201 trả 200. Lỗi P3 còn nguyên.
- Kiểm thêm BUG-R2-131: `r2foc/orig-v-foc-3-0` (ca critic lượt 2 chạy đỏ) nay xanh, tức `amountDueAtCheckinVnd` = 208.000.

Critic đọc lại mã ở 42fb458 cho các gốc Major và Minor. Mã khớp mô tả của người báo:
- `checkout.service.ts` `dueAtCheckout` (~197–212): cộng `extraNightDelta` mỗi khi có `d.extraNight`, không xét `available`. `amountDueForQr` (221–257) không chặn đêm không trống.
- `stay-support.ts` `agreedRate` (195–206): chỉ xét cờ `manual_agreed`, rồi lấy đêm `manual` đầu/cuối của cả đơn, không xét căn.
- `stay.service.ts` `extend()`: giá gõ có kiểm sàn–trần (~315); giá mặc định `added.push({ ...d })` thì không (~323).
- `folio/public/reductions.ts` `keyOf` (148–155): khóa loại `line` = `line:${originLineId}`.
- `minibar.service.ts` `record()`:
  - 177: kiểm trần theo định mức danh mục hiện hành;
  - 221–224: lần đếm cần thay chọn theo `reservation_id`, không lọc căn;
  - 304: `used` = định mức hiện hành − còn lại;
  - 305, 311: giữ dòng cần `price` khác null;
  - 359–368: vòng `carried` chép `row.amount` của lần đếm trước.

## Critic – phân xử phát hiện mới

| Mã | Kết luận | Mức | Ai sửa | BUG đề xuất | Lý do |
|---|---|---|---|---|---|
| R3RATE-01 đơn thỏa thuận, khách xin đổi căn khi đang ở (B14): B13/B18 gợi ý và ghi giá thỏa thuận căn cũ cho đêm ở căn mới | **Major-fix-now** | P1 | BE-A (+ ARC mô tả, DOM một dòng) | BUG-R2-134 | 2/2 tái hiện, 4 bộ số khác nhau, đều P1. Đêm B13 mặc định ghi dưới sàn (700.000 / 650.000 / 600.000, sàn 740.000), gõ đúng số đó thì 422: trái BR-105 và BR-107 v0.3.8. B18: số xem trước và trần QR trả 422 khi ghi: trái BR-416 v0.3.8 và G1. Giá căn cũ mang sang căn mới: khách trả thừa 566.000–587.000, hoặc OTTIMO thu thiếu 308.000–358.000: trái BR-424, BR-429 (g). Đối chứng đúng: B7 trước ngày đến bỏ giá thỏa thuận; B14 sự cố giữ giá. Đường gợi ý B13/B18 có từ 2f77889 (TC-L3-013), lượt 2 bỏ sót; 42fb458 không gây ra. |
| R3MINI-01 hai FOC trên cùng một món, đặt ở hai mắt chuỗi khác nhau: mỗi khoản lấy min với cả dòng | **Major-fix-now** | P1 | BE-B (+ ARC xác nhận khóa) | BUG-R2-135 | 2/2 tái hiện, đều P1. Hai FOC 35.000 trên một dòng bia 35.000: ròng −35.000, folio thấp 35.000 (25.000 với coca). B18 trả 422 `OVERPAYMENT_HANDLING_REQUIRED`; lễ tân bị dẫn tới hoàn cho khách khoản không được hưởng. Hạn mức BR-433 tính 70.000. Trái DOM 18/10 điểm (1) (khóa lượt × minibar × món) và S4-23 (2). Đường 2 → 0 → 2 là **hồi quy của bản sửa BUG-R2-129** (2f77889 cho đúng 750.000); đường 1 → 2 → 1 và đường adjustments có từ trước. BE-B chọn "nối chuỗi, không đổi khóa", nên không đạt chốt DOM. |
| R3MINI-02 đổi phòng B14 giữa lượt: lần đếm checkout căn mới thay lần đếm căn cũ | **Major-fix-now** | P1 | BE-B (+ BE-A phần B14, ARC/DOM) | BUG-R2-136 | 2/2 tái hiện, đều P1. Thu thiếu 70.000; một ca mất trọn tiền tủ căn cũ. Không cảnh báo. Với port minibar thật, B18 bắt buộc đếm căn mới, nên quy trình hiện có không có đường nào giữ đúng tiền. Xem trước = ghi, nhưng số sai. Trái BR-703, BR-424, BR-702. Có từ Sprint 3 (789ac90). Tủ căn cũ cũng không sinh việc bổ sung (US-035). |
| R3MINI-03 món đổi sang miễn phí giữa hai lần đếm, đếm lại cùng số: dòng đã ghi bị đảo | **Major-fix-now** | P1 | BE-B (BE-D phối hợp) | BUG-R2-137 | 2/2 tái hiện, đều P1. Dòng 70.000 khách đã dùng bị đảo, B18 thu 0, không dấu hiệu. Giá `null` hay 0 đều sai. Đối chứng đúng: đổi giá 40.000, tắt món, không đếm lại. Desk H16 bước 1 luôn gửi lại lần đếm, nên đây là luồng mặc định. Trái US-066 AC2, BR-006, BR-702 và chính phán quyết BUG-R2-130. Có từ trước. |
| R3MINI-04 định mức tủ đổi (2 → 1) giữa hai lần đếm: số đã dùng tính lại theo định mức mới | **Major-fix-now** | P1 (nâng từ P2) | BE-B (+ DOM một dòng, ARC phần chưa có lần đếm trước) | BUG-R2-138 | 2/2 tái hiện, cả hai xếp P1. Hạ 2 → 1: 70.000 thành 35.000. Chiều ngược, nâng định mức rồi đếm lại: thu của khách món không dùng (snack 60.000 thay 30.000; bia 105.000 thay 70.000). Hạ về 0 thì giữ đúng (BUG-R2-130), nên hai ca không nhất quán. BR-703 ghi "so với mức sau lần bổ sung gần nhất"; dòng đếm trước đã lưu `standard_qty` = 2. Sai tiền hai chiều, cùng họ BUG-R2-130 (P1). Giảm nhẹ: chỉ khi OWN/MGR đổi định mức lúc có khách đang ở; lễ tân sửa tay được nếu tự phát hiện. Có từ trước. |
| R3PAY-01 B18 sau 18:00 khi đêm thêm không bán được: summary và trần QR `check_out` vẫn cộng đêm thêm | Minor (tính vào G1) | P2 | BE-A (+ FE-A, ARC; DOM phần quy trình) | BUG-R2-139 | 2/2 tái hiện, đều P2. Summary và trần QR 792.000; mọi biến thể B18 trả 409 hoặc 422; QR 792.000 tạo và xác nhận được → `unhandledCredit` 792.000; đơn kẹt `in_house`. Trái BR-416 v0.3.8 ("xem trước = lệnh ghi"). Giữ P2, không như BUG-R2-127: Desk khóa "Hoàn tất" và không dò trần khi không trống; QR `balance` trần 0; tiền mặt vượt số dư cần ghi chú. Rủi ro thu sai chỉ qua API QR `check_out`. Desk vẫn hiện "còn phải thu 792.000" (sai). Có từ S4-47/S4-10 (0b605f3). Là ca xem trước ≠ lệnh ghi nên **phải sửa trước cổng**. Lối ra hiện tại là ghi giờ rời khác giờ thật: DOM cần định nghĩa. Nếu sau này client nào thu bằng QR `check_out` thì nâng P1. |
| R3MINI-06 đổi giá món rồi đếm lại cùng số: folio giữ giá cũ, lần đếm và `latestCheck` ghi giá mới | Minor | P3 | BE-B + FE-A | BUG-R2-140 | 2/2 tái hiện, đều P3. Tiền khách, FOC, B18 đúng ở cả hai chiều giá. Bản ghi đếm tự mâu thuẫn: giá 40.000, tiền 80.000, nhưng `folio_line_id` trỏ dòng 70.000. Desk bước 1 hiện 80.000 (hoặc 60.000 khi giảm giá) trong khi bill 70.000. Cùng nhánh "giữ dòng" với BUG-R2-137, nên sửa cùng. Không chặn cổng. |
| R3PAY-02 QR `check_in` có `addPriorNight` tạo khi đêm trước còn trống; đêm đó bán trước B9a; QR vẫn xác nhận được | Note | – | DOM (BE-B/FE-A nếu DOM chọn chặn) | – | 2/2 tái hiện, cả hai not-a-bug. Lúc tạo QR, trần đúng (BR-417 (5)). Không BR nào cho QR đang chờ giữ đêm (BR-906). Phần thừa nằm ở `unhandledCredit` và đã chạy hết luồng hoàn BR-522. Desk thấy `available = false` ngay sau khi bán. Không đi hướng (a) "chặn xác nhận": tiền đã vào tài khoản, chặn chỉ làm sổ lệch ngân hàng (BR-521/527). DOM chọn: cảnh báo/chặn bán đêm B9a khi có QR `addPriorNight` chờ, hoặc đòi ghi chú khi xác nhận QR vượt số còn phải thu (khớp G-15). Gộp vào Note lượt 1 "confirm-received không kiểm số dư". |
| R3MINI-05 dòng chép sang (món rời danh mục) lấy số của lần đếm trước, không theo dòng folio lễ tân đã sửa | Note (gộp R2FOC-03) | – | DOM | – | 2/2 tái hiện, cả hai not-a-bug. Tiền khách đúng. Chênh "lần đếm ≠ folio sau khi lễ tân sửa" có sẵn cả khi không tắt món, nên cùng gốc với R2FOC-03. Desk bước 1 không đọc `latestCheck.totalVnd` cho món đã tắt, nên không hiện số khác bill như bản báo. DOM chốt R2FOC-03 thì xử lý luôn ca này. |

## Major-fix-now theo gốc (danh sách sửa cho BE)

| BUG đề xuất | Phát hiện | Ai sửa | Chỗ sửa (42fb458) | Số đúng cho test |
|---|---|---|---|---|
| BUG-R2-134 | R3RATE-01 | BE-A (+ ARC, DOM) | `frontdesk/internal/stay-support.ts` `agreedRate` (195–206): chỉ lấy giá thỏa thuận khi đêm kề đêm thêm (đêm đầu cho B9a, đêm cuối cho B13/B18) là đêm gõ tay ở **căn hiện tại**; không thì dùng lịch Trực tiếp của căn hiện tại. Cách khác: B14 `guest_request` bỏ trạng thái thỏa thuận từ đêm đổi. Áp cho mọi chỗ gọi: `stay.service.ts` 123 và 225, `checkout.service.ts` 155, `checkin.service.ts` 254. `extend()` (~323) và B18 kiểm sàn–trần cả giá mặc định. Đêm B13 mặc định không ghi nguồn `calendar` cho giá không có trên lịch. | 201 gõ 700.000 → B14 khách xin 401 từ 02/03: B13 đêm 04/03 = 1.042.000, B18 gợi ý 1.042.000. 302 gõ 1.000.000 → 101 từ 16/03: B13 18/03 = 667.000; B18 thứ Sáu 19/03 = 767.000; tổng 3.768.000. 202 gõ 650.000 × 3 → 301 từ 08/06/2027: B13 958.000, B18 thứ Sáu 1.102.000, tổng 4.626.000. 302 gõ 1.100.000 → 102: tổng 4.213.000. Gõ đúng số gợi ý = để mặc định. B18: xem trước = trần QR = lệnh ghi. Đối chứng: không đổi căn → 650.000 (BR-421-01); B14 sự cố → giữ 700.000. |
| BUG-R2-135 | R3MINI-01 (hồi quy một phần) | BE-B (+ ARC) | `folio/public/reductions.ts` `keyOf` (148–155) và `folio.service.ts` `reductionRequests` (~1777) / `planReductions` (~1809–1846). Khóa FOC minibar phải là lượt × minibar × món như DOM 18/10 điểm (1). Tối thiểu: gom các yêu cầu loại `line` có `keyLine` trỏ cùng dòng sống cuối chuỗi vào một khóa trước `allocateKey`. Kiểm cả các loại dòng khóa `line` khác bị sửa qua adjustments (giặt ủi, phí dịch vụ). | 102 bia: 2 → FOC A → 0 → 2 → FOC B → 1: A applied 35.000, B ngủ, ròng 0, folio 750.000, B18 200 thu 0; sau chốt B hủy `settled_while_dormant`, hạn mức FD 35.000. 202: 1 → A → 2 → B → 1: folio 792.000. 203 chỉ adjustments 1 → 2 → 1: 792.000. 301 coca cùng đường 0: 958.000. Đối chứng (đang xanh): hai FOC trên cùng một dòng; một FOC 2 → 0 → 2 → 1. |
| BUG-R2-136 | R3MINI-02 | BE-B (+ BE-A, ARC/DOM) | `inventory/internal/minibar.service.ts` `record()`: lần đếm cần thay (221–224) và CTE chuỗi món (~232–245) lọc theo (đơn, căn) – cùng mô hình với `MinibarCheckoutPort.checkoutStatus`. BE-A: B14 gọi `onCheckedOut` (hoặc tương đương) cho căn cũ để sinh việc bổ sung tủ (BR-703, US-035). ARC/DOM xác nhận FOC theo món đi qua hai tủ. | 202 → 203 (B14 sự cố): 202 dùng 2 bia, 203 dùng 1: minibar 105.000, B18 thu 105.000, tổng 1.689.000. 203 không dùng gì: giữ 70.000, tổng 1.654.000. 301 → 401 khách xin (chênh 84.000), 401 dùng 1 snack: B18 184.000, tổng 2.244.000. Có FOC 70.000 trên bia 202: gộp 105.000, ròng 35.000. Đối chứng: đếm lại cùng một tủ vẫn thay lần trước. |
| BUG-R2-137 | R3MINI-03 | BE-B (BE-D phối hợp) | `minibar.service.ts` 305/311: điều kiện giữ dòng không đòi giá hiện hành: `before?.live && used > 0 && before.quantity === used`. Dòng đếm mới chép giá chụp và tiền của dòng được giữ (sửa luôn BUG-R2-140). | 302, 07–08/06/2028: đổi bia sang miễn phí (`null`) rồi đếm lại 2: giữ 70.000, folio 987.000, B18 thu 70.000. Giá 0: cùng số (402: 1.070.000). Đối chứng: đổi giá 40.000 giữ 70.000; tắt món giữ 70.000. |
| BUG-R2-138 | R3MINI-04 | BE-B (+ DOM, ARC) | `minibar.service.ts` 304 và 177: món đã có trong lần đếm trước của lượt thì mốc = `standard_qty` của dòng đếm trước (đã có trong `carried`), cho cả phép tính đã dùng lẫn kiểm `MINIBAR_QTY_OVER_STANDARD`. GET `minibar-standard` trả mốc này cho lượt đó. Ca chưa có lần đếm trước cần chụp mức tủ lúc nhận phòng hoặc lúc bổ sung (US-033): ARC chọn cách; tạm thời PATCH `/items` đổi định mức chỉ áp từ lần bổ sung sau, hoặc cảnh báo khi còn lượt đang ở. | 103: bia 2 dùng hết, hạ định mức còn 1, đếm lại còn 0: giữ 70.000, folio 820.000. Snack 1 dùng hết, nâng định mức lên 2, đếm lại còn 0: 30.000 (không phải 60.000). Hạ còn 1 khi tủ còn 2: nhập được "còn 2", tiền 0. Đối chứng: hạ về 0 giữ 70.000. |

Việc chung cho 5 mã:
- Chuyển ca của người tái hiện (`x-r3*`) vào `test/integration/`, kỳ vọng theo số ở bảng trên.
- Thêm dòng oracle vào `br-examples.json`: BR-424/429 (g) đơn thỏa thuận sau B14 khách xin; BR-434-15 hai FOC trên hai mắt chuỗi; BR-703 đổi phòng giữa lượt; BR-702 đổi sang miễn phí và đổi định mức.
- Minibar có lỗ hổng mới ba vòng liên tiếp (BUG-R2-095/109 → 129/130 → 135…138, 140). BE-B sửa một lần cho cả nhóm, theo một mô hình rõ: chuỗi theo (lượt, căn, món); giữ dòng khi đếm cùng số, không phụ thuộc giá, định mức hay trạng thái danh mục hiện hành; khóa FOC theo món. ARC duyệt mô hình trước khi code. QA viết bảng ca: (đổi giá, miễn phí, tắt món, đổi định mức) × (đếm lại cùng số, tăng, giảm, về 0) × (có/không FOC, một/hai FOC) × (có/không B14).
- BUG-R2-134 là lối thứ hai của khái niệm "đơn thỏa thuận" (sau BUG-R2-126). BE-A thêm ca "xem trước = lệnh ghi" cho B13/B18 sau B14 `guest_request`.

## Minor và Note – kế hoạch

| Mã | Mức | Ai | Kế hoạch |
|---|---|---|---|
| BUG-R2-139 (B18 đêm thêm không bán được) | P2 | BE-A + FE-A + ARC; DOM | **Sửa cùng vòng (G1).** `checkout.service.ts` `dueAtCheckout`: chỉ cộng `extraNightDelta` khi `extraNight.available`. `amountDueForQr`: đêm thêm bắt buộc mà không trống thì `extraNightRateVnd` → 422 `NOT_ALLOWED`, trần = số dư, giống BUG-R2-127. FE-A: `CheckOutPage.tsx` 290–292 không hiện "còn phải thu" gồm đêm khi `extraNightAvailable = false`. ARC sửa mô tả `CheckoutSummary.amountDueAtCheckoutVnd` và `createVietQr check_out`. Số đúng: 203, 16–18/04/2030, đã thu đủ 1.584.000, kín nhà, 19:00: summary 0, trần QR 0. Đối chứng còn căn: 792.000, B18 200, tổng 2.376.000, 0/0. Dời khách đến sang 201: summary 792.000, B18 0/0. DOM định nghĩa đường B18 khi không dời được khách đến (BR-416 "trừ quản lý duyệt"). |
| BUG-R2-140 (lần đếm ghi giá mới khi folio giữ giá cũ) | P3 | BE-B + FE-A | Sửa cùng BUG-R2-137 (cùng nhánh "giữ dòng"). Số đúng: 301, đổi giá 40.000, đếm lại 2 bia: `totalVnd` = `latestCheck.totalVnd` = 70.000; Desk bước 1 hiện số trên folio. Nếu không kịp thì tuần Ổn định, không chặn cổng. |
| BUG-R2-133 (fallback căn gốc) | P3 | BE-A | Tuần Ổn định. Số đúng: 208.000 × 2; xin tiếp sang 302: 125.000 × 2. Trước khi đưa dữ liệu cũ vào dùng thử, OPS đếm đơn có origin NULL. |
| BUG-R2-123 | P3 | BE-A + ARC | Tuần Ổn định. |
| R3PAY-02 | Note | DOM | Chọn cảnh báo/chặn bán đêm B9a khi có QR `addPriorNight` chờ, hoặc đòi ghi chú khi xác nhận QR vượt số còn phải thu. Không chặn cổng. |
| R2FOC-03 + R3MINI-05 | Note | DOM, BE-B, UXD/FE-A | DOM chốt số nào thắng: số lễ tân sửa trên folio hay lần đếm. Nếu folio thắng: BE-B sửa vòng `carried`, FE cảnh báo khi folio khác `latestCheck`. M8, M8b, R17 giữ đỏ tới khi DOM chốt. Không chặn cổng. |
| S438R2-MOVE-03 | Note (đã biết) | ARC, BE-A, FE-A | R3 như đã hẹn. |

## Test cũ phải đổi kỳ vọng

Các thay đổi dưới đây không phải lỗi mã. Mỗi chỗ có ghi chú `r3pay EXPECTATION CHANGE`, `R3RATE EXPECTATION CHANGE`, `R3DEP EXPECTATION CHANGE/ADDED` hoặc `r3regr: EXPECTATION CHANGE`. Bản đã đổi nằm ở `r3pay/old-*`, `r3rate/old/`, `r3dep/old/`, `r3mini/exp-*`, `r3regr/fixed/`.

r3pay, r3rate và r3regr đổi độc lập `r2pay-defaults` D2/D3/E1b và ra cùng số. r3pay và r3regr đổi R23b giống nhau.

**(a) Theo vòng sửa 2 (BUG-R2-126, migration 0064; BE-A 13.2).** Mọi đơn mới nay có cờ; nhánh dự phòng `flag === undefined` đã bỏ.

| Tệp / ca | Cũ → mới | Căn cứ |
|---|---|---|
| w-r2pay-0-1 W-D2; r2pay-defaults D2; w-r2pay-2-0 K1, K2, K4; w-r2pay-2-1 K1; w-r2regr-0-0 SETUP; w-r2regr-0-1 setup | Cờ `null`/`undefined` → `'calendar'`. Kỳ vọng tiền và `currentBookingRateVnd` không đổi | BUG-R2-126, 132 |
| w-r2pay-3-0 L1, L3, L4, L5; w-r2pay-3-1 L1, L2, C1 (r3regr thêm C2); r2pay-defaults D3 | Ca "đơn cũ": bỏ cờ rồi chạy đúng câu UPDATE của 0064. w-r2pay-3-1 L1: cờ `null` → `'manual_agreed'`. Tiền giữ 800.000 | 0064, giả định r2-1 |

Riêng w-r2regr-0-1: setup trước đây dừng ở dòng kiểm cờ, nên các lần sửa S4-35 chưa từng chạy. Nay chạy đủ, 8/8 xanh.

**(b) Theo bản sửa BUG-R2-125 và 127.**

| Tệp / ca | Cũ → mới | Oracle |
|---|---|---|
| w-r2pay-1-0 E1b, w-r2pay-1-1 E1b, r2pay-defaults E1b | QR `check_in` có `addPriorNight` khi đêm trước có khách: 201 → 422 `NOT_ALLOWED`; thu bằng QR không cờ 1.234.000, B9 14:00 → 0/0 | BR-417 (1)/(5) |
| r2move R23b | Dò lần đầu ra 422 rồi ghi ở max → lần đầu với 2.026.000 đã 200; lần thử lại 409 `in_house` | BR-417 (5), BR-416 v0.3.8 |

**(c) Theo DOM 18/10.**

| Tệp / ca | Cũ → mới | Oracle |
|---|---|---|
| w-r2cancel-1-1 C1; w-r2cancel-1-0 W1x | Cọc yêu cầu / phí / hoàn 900.000 / 900.000 / 1.200.000 → 2.100.000 / 2.100.000 / 0 (không yêu cầu hoàn) | BR-309-14 |
| v-move-5-1 V1 | 200 → 409 `SURCHARGE_CHANGED`, căn giữ 202 | BR-424-07 |
| v-move-5-1 V2; v-move-5-0 A, B; k0-b14-sent-amount K0-1 | Trước chỉ ghi lại → nay khẳng định 409 và version không đổi | BR-424-07 |
| w-r2foc-1-0 D | Tổng / còn thu / ròng 785.000 / 35.000 / 35.000 → 750.000 / 0 / 0. FOC đầu tự khôi phục; FOC thứ hai còn chỗ min(35.000, 70.000 − 35.000) | BR-434-15, S4-23 (2) |

**(d) Giữ đỏ, vì đây là lỗi mã.** Không đổi kỳ vọng:
- BUG-R2-133: w-r2move-1-0 W1, W3; w-r2move-1-1 W2, W3, W4; r2move R18.
- Phát hiện mới: r3pay F5b, F5c (BUG-R2-139); r3rate X1, X2, X3 (BUG-R2-134); r3mini R4, R5, R5b (135), R14 (136), R12 (137), R13 (138), R11 (140).

**(e) Ghi nhận hành vi, chờ quyết định.** Không tính là lỗi, giữ nguyên: r2foc-attack M8, M8b và r3mini R17 (R2FOC-03); v-foc-3-1 C1; c-a2 Y12 (CANCEL-05); w-r2move-2-* (7 ca, MOVE-03).

## Đối chiếu điều kiện của lượt trước

Các điều kiện lấy từ `s4-money-reverification.md`, mục Khuyến nghị.

| Điều kiện | Trạng thái ở 42fb458 |
|---|---|
| 1. Đóng BUG-R2-125…130, mỗi mã có test oracle | 6 mã xong, có số. Oracle: `br-examples.json` chỉ thêm BR-309-13/14, BR-424-07, BR-434-15. **Vẫn thiếu 3 dòng** lượt 2 yêu cầu: BR-417 (1)+(5) đêm trước có khách; BR-417 (2) đơn lịch giá có mọi đêm đã sửa; BR-429 (b2) đêm thêm sau khi OTTIMO đổi căn. `s438r2-money` ghim số cứng, không đọc oracle. |
| 2. Sửa cùng vòng 131 (rồi đóng 111) và 132; 123, 133 sang Ổn định; OPS/QA xác nhận DB dùng thử không có origin NULL | 131, 132 xong; 111 đóng được. 123, 133 còn mở, đúng hẹn. **Chưa thấy** OPS/QA xác nhận origin NULL. |
| 3. DOM chốt (a)–(e) | (a) BR-434 không có ngoại lệ (m): xong. (b) BR-309-13: xong. (c) BR-309-14: xong. (e) MOVE-06 → BR-424-07: xong. **(d) R2FOC-03: chưa.** |
| 4. ARC sửa mô tả; FE-A đọc `priorNight.available` | ARC: `openapi-0.3.7.md` dòng BUG-R2-127 và 132 đã sửa. FE-A `CheckInPage` đọc `priorNight.available` và khóa nhận phòng (đọc mã, chưa chạy UI). |
| 5. Lượt kiểm lại chạy lại toàn bộ `r2*`, `w-r2*`; 0 ca đỏ ngoài Note; xem trước = trần QR = ghi ở B9a/B18 kể cả định mức bảo vệ | Xong: 1.230 ca cũ, không ca nào đỏ do lỗi mã mới; định mức bảo vệ đúng ở mọi ca. Nhưng tấn công mới tìm 2 ca xem trước ≠ ghi ở B18: đêm thêm không bán được (BUG-R2-139) và đơn thỏa thuận sau B14 khách xin (BUG-R2-134). |
| 6. ORC ghi decision-log S4-37 "không sai tiền"; S4-47 chỉ kết luận sau khi đóng 125 | **Chưa thấy** trong decision-log. 125 đã đóng, nhưng **S4-47 vẫn chưa kết luận được**: QR `check_out` còn nhận 792.000 mà B18 không ghi được (BUG-R2-139). |
| 7. QA gỡ `pendingFix` cho 14 dòng; cập nhật bug-list | Bug-list: BUG-R2-124 Closed, 131 đã tách. **`pendingFix` vẫn đủ 20 dòng.** r3regr chạy thật và thấy 16 dòng đã khớp oracle: BR-110-10/11/12/13, BR-416-02/03, BR-522-02, BR-412-12/13/14, BR-424-02/03, BR-428-04, BR-414-02, BR-527-06, BR-903-04. 4 dòng còn lại chưa có bằng chứng: BR-417-03, BR-602-05, BR-522-03, BR-522-04. |
| 8. G5 api và E2E xanh; bổ sung ca cho gap chạm tiền | api 2.708/2.708 × 3, admin-web 324/324 trên 42fb458. **Chưa chạy E2E** trên 42fb458. **Chưa làm**: hoa hồng S4-03 sau B8, khi hủy, khi no-show; đua nhận phòng ‖ duyệt FOC; đua xác nhận QR ‖ B9/B9a; B18 ‖ QR `check_out`. |

## Gaps

- Cả 5 hướng không chạy E2E/UI. Desk `CheckInPage` (`priorNight.available`), `CheckOutPage` (`extraNightAvailable`), nút "Giữ giá đơn", H16 bước 1 chỉ suy từ mã.
- Hoa hồng S4-03 và đơn CTV/SAL: vẫn chưa phủ, có từ lượt 1.
- Đua còn thiếu: xác nhận QR ‖ B9a; B18 ‖ QR `check_out`; hủy khách đêm trước ‖ B9a; nhận phòng ‖ duyệt FOC; swap ‖ B7/B14; hủy ‖ S4-35.
- Chưa phủ: đơn dài hạn hoặc HĐ ngoài làm B9a/B18 và S4-35; B13 có định mức bảo vệ rồi sửa số người; trẻ 6–11 tuổi được bảo vệ; minibar của đơn có đơn con.
- R3PAY-01 chưa thử đơn OTA và giá gõ. Chưa kiểm client ngoài Desk (MOB, web khách) có gọi QR `check_out` không.
- R3MINI-01 có thể chạm mọi dòng khóa `line` bị sửa qua adjustments (giặt ủi, phí dịch vụ): mới chạy trên minibar. Báo cáo FOC tháng (BR-435) và hạn mức BR-433 sau khi chốt cho ca áp thừa: chưa kiểm.
- Migration 0064 và giả định r2-1:
  - đơn thỏa thuận ghi thẳng bằng SQL (dữ liệu demo, nhập tay) không có audit → bị bù `calendar`, mất giá thỏa thuận (L4: 1.000.000 thay vì 800.000);
  - nếu audit `reservation.priced` đã bị dọn theo retention thì cũng vậy;
  - 0064 gắn `manual_agreed` cho đơn OTA có `nightlyRates`, trong khi app ghi `calendar`. Không đổi tiền (`agreedRate` chặn theo kênh), nhưng dữ liệu cờ không nhất quán cho báo cáo sau này.
- Quan sát r3dep, chưa chạy: `deposits.service` `stayTotal` lấy tổng báo giá làm trần phiếu thu BR-527; sau khi sửa giá hold thì trần này cũ. Hiện không đường HTTP nào chạm tới.
- Câu hỏi cho DOM, không tính là phát hiện:
  - đơn OTA bị OTTIMO dời sang căn định mức thấp: đêm con Trực tiếp B9a/B18 có hưởng định mức bảo vệ không (BE-A chọn có; N1, N2 xem trước = ghi = 0 phụ thu);
  - đơn Agoda khách tự xin đổi căn rồi B9a/B18: đêm con Trực tiếp bị phụ thu 150.000 (A3, D4) – người kiểm tự đọc BR-110 + BR-417 (3);
  - đêm thêm sau swap lấy lịch của căn hiện tại hay căn khách đặt (R22, còn từ lượt 2);
  - đơn thỏa thuận có đêm bị S4-35 sửa sau: `agreedRate` lấy cả đêm S4-35, trong khi BR-417 (2) ghi "giá nhập tay lúc đặt" – nên chốt cùng BUG-R2-134;
  - khách xin B7 dời ngày đi 8 tuần khi còn 5 ngày, hôm sau hủy: phí 0, hoàn 500.000 (Q1, BR-011). Theo đúng chữ BR thì đường lách này mở;
  - ví dụ trong BR-309 (phí 500.000) lệch cơ sở phí v0.3.8 = min(cọc đã thu, cọc yêu cầu, giá trị đơn) = 300.000. Có vẻ chữ chưa cập nhật;
  - mức giữ khi khách rút muộn có áp cho đơn hold chưa trả cọc không.
- Quy trình: lần chạy đầu của r3rate đã ghi thêm log vào `scratchpad/s438/w-r2pay-*` và `r2pay/obs-defaults.jsonl` của lượt trước. Các bản chép sau đã đổi hướng log. Critic chạy với `S438_OUT` và `K1_OUT` riêng.

## Khuyến nghị cổng QC Sprint 4

**CHƯA.** Với commit 42fb458:
- **G1 không đạt.** Còn 6 phát hiện sai tiền:
  - 5 mã P1 BUG-R2-134…138: giá thỏa thuận mang sang căn mới, ghi dưới sàn; 4 lỗi minibar (FOC áp thừa, mất tiền tủ căn cũ, mất dòng khi món thành miễn phí, tính lại theo định mức mới);
  - 2 ca "xem trước ≠ lệnh ghi", trái đúng tiêu chí G1: BUG-R2-139 (B18 đêm thêm không bán được) và BUG-R2-134 (B18 sau B14 khách xin).
- **G7 không đạt.** Có 5 mã P1 mới đang Open. Một đường của BUG-R2-135 là hồi quy của vòng sửa 2.
- Điểm tốt: cả 10 mã đích đã sửa có số; 3 chốt DOM 18/10 đúng; B9a/B18 với định mức bảo vệ và đêm trước không trống nay xem trước = trần QR = lệnh ghi ở mọi ca đã thử; hồi quy chung sạch.

Điều kiện để vào cổng:
1. Đóng BUG-R2-134…138. Mỗi mã có test oracle với số ở bảng "Major-fix-now theo gốc".
   - Minibar (135…138): BE-B sửa `record()` và khóa FOC trong một lần theo mô hình ở mục "Việc chung"; ARC duyệt mô hình trước khi code; QA chạy bảng ca tổ hợp.
   - BUG-R2-138, ca chưa có lần đếm trước: sửa, hoặc chặn bằng cách cho định mức mới chỉ áp từ lần bổ sung sau; ORC ghi decision-log cách chọn.
2. Sửa cùng vòng BUG-R2-139 (xem trước = lệnh ghi ở B18). BUG-R2-140 sửa cùng 137; nếu không kịp thì tuần Ổn định, có kế hoạch.
3. DOM chốt các điểm sau. Các điểm này không chặn BE sửa:
   - (a) BUG-R2-134: đêm thêm sau khi khách xin đổi căn lấy lịch căn mới; giá thỏa thuận chỉ gắn căn nơi nó được gõ; đêm S4-35 sửa sau có thay giá thỏa thuận không.
   - (b) BUG-R2-138: "chuẩn" ở BR-702 là mức sau lần bổ sung gần nhất (BR-703), không phải định mức danh mục hiện hành.
   - (c) BUG-R2-136: kiểm tủ căn cũ khi B14 và FOC theo món qua hai tủ (BR-703, BR-424-05, giả định BE-A (k)).
   - (d) BUG-R2-139: đường B18 khi đêm thêm không bán được và không dời được khách đến (quản lý duyệt phụ thu trả muộn thay đêm, hay cách khác). Hiện lễ tân phải ghi giờ rời khác giờ thật.
   - (e) R2FOC-03 (gộp R3MINI-05), còn treo từ lượt 2.
   - (f) R3PAY-02 và các câu hỏi ở mục Gaps.
4. ARC sửa mô tả `CheckoutSummary.amountDueAtCheckoutVnd`, `createVietQr check_out` khi `extraNightAvailable = false`, và `ExtensionOptions.currentBookingRateVnd` sau B14 khách xin. ARC xác nhận khóa FOC minibar theo món; cách "nối chuỗi, không đổi khóa" không đủ.
5. Lượt kiểm lại lần 4 (ngắn) trên commit sửa:
   - chạy lại **toàn bộ** `test/s438/r3*/` và `x-r3*/` (gồm `r3regr/old`, `r3regr/fixed`), không chỉ ca đỏ;
   - mục tiêu: 0 ca đỏ ngoài Note và BUG-R2-133; bảng ca minibar xanh; xem trước = trần QR = lệnh ghi ở B13/B18 sau B14 và khi đêm thêm không trống;
   - critic chấm lại một lượt ngắn.
6. ORC ghi decision-log:
   - S4-37 `otaPenaltyVnd`: "không sai tiền" (CANCEL-05 vẫn là Note);
   - S4-47: chỉ kết luận sau khi đóng BUG-R2-139.
7. QA:
   - ghi BUG-R2-134…140 vào bug-list; chuyển 111, 125…132 sang Closed theo báo cáo này;
   - thêm 3 dòng oracle còn thiếu từ lượt 2 và các dòng mới cho 134…139;
   - gỡ `pendingFix` cho 16 dòng đã khớp oracle.
8. OPS/DATA, trước khi đưa dữ liệu cũ vào môi trường dùng thử:
   - chạy 0064 trước khi app nhận tải;
   - đếm đơn thỏa thuận không có audit `reservation.priced` (sẽ bị bù `calendar`) và đơn có origin NULL (BUG-R2-133); có thì sửa trước.
9. G5: api và E2E xanh trên đúng commit chấm. Bổ sung ca cho gap chạm tiền còn thiếu (hoa hồng S4-03; đua xác nhận QR ‖ B9a, B18 ‖ QR `check_out`). Nếu không kịp, ORC ghi rõ việc dời.

Cổng QC Sprint 4 đã lùi sang tuần Ổn định (decision-log ORC 18/10). G1 vẫn chưa xanh, nên QC chưa chấm cổng. Không cấp ngoại lệ tiền. ORC ghi decision-log ngày chấm mới sau lượt kiểm lại lần 4.

## Tệp của critic

Thư mục `/private/tmp/claude-501/-Users-anhvh-Library-Application-Support-Claude-scratch-workspaces-00554cf2-3678-4864-82b0-830aaeaa97bd-4c0caebe-be05-49c5-a5a2-5bf357fddc6a-scratch-2026-10-15-c4f0d4/36df3adc-c586-471c-a039-340d2b696728/scratchpad/s438/r3critic/`:
- `env.sh`
- `run1.log`: 45 ca, 39 xanh, 6 đỏ (đều BUG-R2-133)
- `logs/obs.jsonl`: số W1–W4, R18
- `k1/k1.jsonl`: log BUG-R2-123 (`S1-move-preview` 422)

DB `ottimo_test_s438_r3critic` đã được xóa sau khi chạy.
