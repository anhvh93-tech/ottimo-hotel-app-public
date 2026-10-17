# Kiểm chứng đối kháng tiền S4-38 – commit 08dabd3

Workflow S4-38 (ORC 17/10/2026, kết quả thô ở `s4-38-findings-raw.md`). Có 5 skeptic: `foc`, `move`, `cancel`, `pay`, `regr`. Tổng cộng 22 phát hiện. Mỗi phát hiện có 2 người tái hiện độc lập. Mỗi người tự viết test, chạy trên PostgreSQL thật, DB riêng `ottimo_test_s438_v*`, cây cố định 08dabd3 (src không sửa).

Test tái hiện nằm ở `scratchpad/s438/wt/product/services/api/test/s438/` (chưa track trong repo).

Ghi chú thời điểm:
- Báo cáo chấm commit **08dabd3**.
- Sau khi có dữ liệu thô, DOM đã chốt cách hiểu BR (decision-log 17/10, dòng "DOM – chốt cách hiểu BR cho S4-38"). Critic dùng chốt này để xếp mức, vì DOM là người giữ BR.
- Commit 72fa486 (23:25) ghi đã sửa các phát hiện. Critic **chưa kiểm** 72fa486. Xem mục Khuyến nghị.

## Tóm tắt

- 22 phát hiện của skeptic: **16 Major-fix-now**, 4 Minor, 2 Note, 0 CLOSED.
- Người tái hiện tìm thêm: 1 Major theo DOM (S438-DOM-01), 3 Minor, 9 Note.
- Gộp theo gốc: **11 mã BUG Major** (đề xuất BUG-R2-109…119), 5 mã Minor (BUG-R2-120…124). QA cấp số chính thức.
- Mọi ca sai tiền đều tái hiện được ở cả 2 người, cùng số. Không ca nào là hồi quy: đều là kẽ hở có từ trước, hoặc tính năng mới của 0b605f3/08dabd3 chưa phủ hết đường.
- **08dabd3 chưa đạt G1** (còn ca lệch tiền) **và chưa đạt G7** (còn P1 Open).

## Kết quả từng hướng kiểm

**foc** (BE-B là chủ chính):
- Bộ `foc-keys-s4.test.ts` (oracle BR-434-07…12, BR-433-03, BR-412-15…17, BR-315-06) chạy 21/21 xanh.
- Có 18 ca tự dựng đúng tiền: BR-412 tại B18, BR-428, S4-23 thứ tự, DOM-S4-15, BR-315 (b), S4-35 + BR-429 (g).
- Có 9 tổ hợp đua bằng Promise.all: không 5xx, không 40P01, bất biến BR-434 giữ.
- Lỗi đều nằm ở chỗ một dòng bị đảo rồi ghi lại mà **không nối chuỗi `related_line_id`**: đếm lại minibar, ghi lại chênh lệch đổi căn. Lúc đó FOC ngủ rồi bị hủy khi chốt folio (FOC-01, FOC-04). `room_change_difference` bị coi là khóa "dòng" chứ không phải khóa "đêm" (FOC-03).

**move** (BE-A):
- 27 ca, 21 xanh. Xem trước = lệnh ghi ở mọi ca B7/B14 thường (T1–T26).
- Lỗi tập trung ở hai đường **đổi căn do OTTIMO nhưng không đi qua MovePlanner**: `swapRoom` (K12) và `restoreNoShow` sang căn khác (B12). Hai đường này không áp min phụ thu người, không lưu định mức bảo vệ, không ghi căn gốc.
- Thêm một lỗi 500 làm kẹt đơn sau khi khôi phục vào làn chưa gán.

**cancel**:
- 20 kịch bản đúng tiền (BR-309/310/311, S4-06, S4-08, S4-37) và 3 tổ hợp đua.
- Lỗi chính: cờ đêm cao điểm đóng băng lúc tạo đơn (CANCEL-02).
- CANCEL-01 (cọc yêu cầu đóng băng): đúng theo chữ BR tại 08dabd3. DOM đã chốt lại thành lỗi (BR-309-11).

**pay**:
- Chạy lại 44/44 test BE (checkin-payment, checkout-due, vietqr-stay-step, move-pricing, reservation-list), cộng 25 kịch bản đúng tiền.
- Lỗi tập trung ở **đêm thêm và đêm sửa tay không nhận bậc BR-107** (PAY-03, PAY-04), và **xem trước/trần QR của B9a ≠ lệnh ghi B9a** (PAY-01, PAY-02).

**regr**:
- Toàn bộ api 2.645/2.645 ca, 3 lượt, không ca chập chờn.
- `validate-fixtures` 352 dòng, 0 lỗi.
- Diff 94c711d..08dabd3: 4.060 dòng thực thi mới, 146 dòng (3,6 %) chưa test nào chạm. Đã viết test cho các nhánh tiền chưa phủ, chỉ nhánh `amountDueForQr` sai (REGR-01).
- Tìm thêm REGR-02/03, trùng gốc với MOVE-02/03 và MOVE-01.

**Critic chạy lại ca bất đồng.** Chỉ MOVE-06 có hai người tái hiện xếp khác nhau (not-a-bug và P3).
- Chạy một lần cả hai tệp `v-move-5-0/k0-b14-sent-amount.test.ts` và `v-move-5-1/b14-expected-delta.test.ts` trên DB mới `ottimo_test_s438_critic`: **9/9 xanh**.
- B14 property_fault 202 → 203, chênh 0, gửi `expectedDeltaVnd` 119.000 → 200. Folio giữ 1.584.000, đêm 29/09 sang 203.
- B7 cùng tình huống → 409 SURCHARGE_CHANGED. B14 chênh ≠ 0 gửi sai số → 409.
- Kết luận: không sai tiền, không trái hợp đồng hiện hành → Note.

Các phát hiện khác, hai người tái hiện thống nhất cả hành vi lẫn số tiền. Chỗ lệch duy nhất là mức (FOC-02, CANCEL-04) hoặc cách hiểu BR (CANCEL-01). Critic không chạy lại các ca này.

## Critic – phân xử từng phát hiện

| Mã | Kết luận | Mức | Ai sửa | BUG đề xuất | Lý do |
|---|---|---|---|---|---|
| FOC-01 đếm lại minibar làm FOC ngủ rồi hủy | **Major-fix-now** | P1 (P0 khi có S4-25) | BE-B | BUG-R2-109 | 2/2 tái hiện. Khách trả thừa 35.000 cả khi đếm lại **cùng số** (743.000 → 778.000). Đếm lại có thêm món khác cũng mất FOC. S4-25 đã gộp ở 2442d26, nên trên HEAD đây là đường Desk H16 thường gặp. Sửa kèm BUG-R2-095. |
| FOC-02 xem trước B18 đêm thêm bỏ phần FOC đổi theo | Minor | P2 | BE-A | BUG-R2-120 | 2/2 tái hiện, đều xếp P2. B18 chặn 409, folio cuối đúng, QR bị trần thấp → không thu vượt. DOM chốt là lỗi (BR-416-05, số đúng 370.000 sau khi sửa PAY-04). Cùng hàm `extraNightDelta` với PAY-04 nên **sửa cùng vòng**. |
| FOC-03 no-show hủy hẳn FOC trên `room_change_difference` | **Major-fix-now** | P1 | BE-B | BUG-R2-110 | 2/2 tái hiện (thừa 250.000 / 200.000). Audit ghi `reservation_cancelled` cho ca no-show. Trái BR-315 (g). DOM thêm BR-434-14. |
| FOC-04 đổi căn OTA lần hai: FOC trên chênh lệch ngủ, xem trước ≠ ghi | **Major-fix-now** | P1 | BE-A + BE-B | BUG-R2-111 | 2/2 tái hiện, có cả đường B14. Xem trước −84.000, ghi +166.000, BR −42.000. Khách trả thừa 208.000. Trái G1 "xem trước = lệnh ghi" B7/B14. |
| MOVE-01 `swapRoom` không áp phụ thu min / định mức bảo vệ | **Major-fix-now** | P1 | BE-A | BUG-R2-112 | 2/2 tái hiện. Thu thừa 300.000. Hiện chỉ đi được qua API (nút swap Desk dời R3), nhưng API mở cho `front_desk`. |
| MOVE-02 `swapRoom` không ghi `origin_room_id` | **Major-fix-now** | P1 | BE-A | BUG-R2-113 | 2/2 tái hiện. 375.000/đêm thay vì 250.000 (BR-424-06). Chiều ngược lại thu thiếu. |
| MOVE-03 B12 sang căn khác không ghi `origin_room_id` | **Major-fix-now** | P1 | BE-A | BUG-R2-113 | 2/2 tái hiện, cả B7 lẫn B14 (K4). Cùng gốc với MOVE-02 và REGR-02. |
| MOVE-04 gán căn sau khôi phục vào làn chưa gán → 500 (23505) | **Major-fix-now** | P1 | BE-A | BUG-R2-114 | Không sai số, nhưng đơn kẹt: không gán căn, không nhận phòng, không thu được phần còn lại. Trái BR-315 (c) "không được báo lỗi sau khi đã duyệt". Đường duyệt chuẩn luôn rơi vào ca này. G7 không cho P1 Open. Kèm lỗi: restore có `roomId` không xóa `conflict_state = 'open'`. |
| MOVE-05 đêm sửa tay không tính lại bậc khi B7/B8 qua mốc 7 đêm | **Major-fix-now** | P1 | BE-A | BUG-R2-115 | 2/2 tái hiện, có cả B13 (ca D). Mỗi đêm sửa tay lệch ±65.000–70.000. Cùng trạng thái cuối mà tổng phụ thuộc thứ tự thao tác. DOM chốt: giá gõ là giá lịch, bậc áp lên (BR-107-05/06). |
| MOVE-06 B14 bỏ qua `expectedDeltaVnd` khi chênh = 0 | Note | – | DOM (phạm vi), BE-A nếu mở rộng | – | Critic chạy lại 9/9. (d2) chỉ thuộc BR-429 (B7/B8). Hợp đồng changeRoom chỉ quy định khi chênh ≠ 0. Tiền đúng. DOM quyết có mở (d2) sang BR-424 không. |
| CANCEL-01 cọc yêu cầu đóng băng sau B7/B8 | **Major-fix-now (theo DOM)** | P1 | BE-A | BUG-R2-119 | Cả 2 người tái hiện ghi not-a-bug theo chữ BR-107/BR-429 (e) tại 08dabd3. Lập luận này đúng với văn bản lúc đó. DOM sau đó chốt là lỗi và thêm BR-309-11 (cọc cơ sở phí = 30 % tiền phòng hiện hành; giảm khi còn < 7 ngày thì giữ mức cũ; Desk vẫn không đòi cọc bổ sung). Theo BR hiện hành thì sai tiền cả hai chiều (X6 OTTIMO mất 1.100.000, X6b khách mất 1.084.000). |
| CANCEL-02 cờ đêm cao điểm đóng băng lúc tạo | **Major-fix-now** | P1 | BE-A | BUG-R2-118 | 2/2 tái hiện. Dời hoặc kéo dài vào Giỗ Tổ rồi hủy sớm → hoàn 100 % cọc (mất 400.000–500.000/đơn). Chiều ngược (X1b) DOM giữ "không hoàn" (BR-309-12), nên **chỉ chiều vào ngày đặc biệt là lỗi**. |
| CANCEL-03 B12 không dọn yêu cầu hoàn tự tạo và mục `closed_reservation_credit` | Minor | P2 | BE-B (+ BE-A điểm gọi) | BUG-R2-121 | 2/2 tái hiện. Tiền không ra (chi bị trần ≤ dư thừa). Mục chú ý kẹt vĩnh viễn, không ai đóng được. `unhandledCreditVnd` bị che nên B18 không hỏi phần dư mới (X3b). Thuộc S4-06 (CỔNG), nên sửa trước cổng. |
| CANCEL-04 `refundRequestVnd` của lệnh hủy ≠ bản thử | Minor | P3 | BE-B (+ ARC mô tả) | BUG-R2-122 | 2/2 hạ từ P2 xuống P3: Desk chỉ đọc bản thử, tiền và DB đúng. Vẫn trái hợp đồng "0 → không tạo yêu cầu". Ca K5 trả 500.000 > dư thừa 300.000. |
| CANCEL-05 phí kênh trên tiền phạt không có trần | Note | P3 | BE-B + ARC | – | Không có BR hay hợp đồng nào đặt trần. Tiền khách đúng. Bẩn dữ liệu `channel_fee` cho báo cáo R3. Nên chặn 422 như `otaChannelFeeVnd` lúc tạo đơn. |
| PAY-01 B9a qua mốc 7/14 đêm: xem trước và trần QR không tính lại bậc | **Major-fix-now** | P1 | BE-A (+ ARC mô tả) | BUG-R2-117 | 2/2 tái hiện. Theo đường QR, khách trả thừa 412.000–544.000. Theo đường `checkIn.payment`, bị 422 với chính số app gợi ý. |
| PAY-02 B9a: xem trước thiếu phụ thu người đêm thêm | Minor | P2 | BE-A | BUG-R2-117 | 2/2 tái hiện. Lệnh ghi chặn 409, không sai tiền. Preview báo "đủ điều kiện" mà B9a vẫn 409. 150.000 còn lại không thu được bằng QR. Cùng hàm với PAY-01, sửa cùng. |
| PAY-03 đêm `setNightRate` không tính lại bậc (B13, B7) | **Major-fix-now** | P1 | BE-A | BUG-R2-115 | Trùng gốc MOVE-05. S4-35 là mục CỔNG. |
| PAY-04 đêm thêm B18/B9a không nhận bậc BR-107 | **Major-fix-now** | P1 | BE-A | BUG-R2-116 | 2/2 tái hiện. Thu thừa 71.000–92.000/đêm, xảy ra với **mọi** đơn dài, không chỉ ở mốc 7 đêm (ca E, F). DOM chốt 777.000/đêm (BR-416-04). |
| REGR-01 trần QR B9a đổi giá gõ trên số đã kẹp 0 | **Major-fix-now** | P1 | BE-A (+ ARC mô tả "client cộng chênh") | BUG-R2-117 | 2/2 tái hiện. QR thu 208.000 khách không nợ. Lệnh ghi đúng (max 0). |
| REGR-02 `origin_room_id` thiếu ở B12/swap và dòng cũ trước 0059 | **Major-fix-now** | P1 | BE-A | BUG-R2-113 | Trùng MOVE-02/03. Ca Tết 488.000 thay vì 325.000. Phần dòng cũ trước 0059 chỉ là P3 (chưa có dữ liệu thật). |
| REGR-03 B12 sang căn định mức thấp không lưu định mức bảo vệ | **Major-fix-now** | P1 | BE-A | BUG-R2-112 | 2/2 tái hiện. Thu thừa 300.000. Chỉ cần thêm 1 bé dưới 6 tuổi cũng đủ kích hoạt (R3, A-bis). Đêm thêm sau B12 cũng sai (+150.000). |

Phát hiện phụ của người tái hiện:

| Mã | Kết luận | Mức | Ai sửa | BUG đề xuất | Lý do |
|---|---|---|---|---|---|
| S438-DOM-01 giá mặc định đêm B9a thứ Bảy = giá đêm đầu (667.000) thay vì lịch đêm đó (767.000) | **Major-fix-now (theo DOM)** | P1 | BE-A | BUG-R2-116 | Phát hiện từ v-pay-3-0/3-1. DOM chốt theo BR-417 (2), BR-421 v0.3.4. Gộp với PAY-04. |
| `move-preview` không nhận `overbookingResolution` | Minor | P3 | BE-A + ARC | BUG-R2-123 | Đơn `conflict_state = open` luôn nhận 422 khi xem trước B7a. Không có bản tính thử cho B7a qua move. |
| `restoreNoShow` ghi `reservation_change.new_value` = UUID phòng | Minor | P3 | BE-A | BUG-R2-124 | Lịch sử hiển thị sai. Từ 72fa486 dữ liệu này còn được đọc để suy căn gốc, nên phải đúng số căn. |
| `checkin.service incidentalNet` tính dòng đảo FOC là khoản phát sinh | Minor | P2 | BE-A | gộp BUG-R2-111 | Dời phần phải thu từ nhận phòng sang trả phòng (FOC-04, k0). |
| Giảm giá đặc biệt trên `room_change_difference` → 422 | Note | – | DOM | – | BR-429 (b) gợi ý tặng phần chênh bằng giảm giá đặc biệt. Nay chỉ có FOC làm được. |
| `stay_night` void giữ `channel_fee_vnd` cũ | Note | – | BE-B / DATA | – | Bảng `channel_fee` đúng. Chưa báo cáo R2 nào đọc. |
| `FolioService.pendingReductionsVnd` không nơi gọi | Note | – | BE-B | – | Mã chết, không chạm tiền. |
| Ca đỏ `architecture.test.ts` đọc `dev_clock` không qua `withDevClockLock` (log cũ 20:44) | Note | – | chủ S4-20, QA | – | Không tái hiện trong 3 lượt toàn bộ và 6 lượt riêng. S4-20 là CỔNG nên chủ test cần xem. |
| 10 dòng oracle còn `pendingFix` cũ; 33 dòng BR-3xx/4xx không test nào đọc | Note | P3 | QA + DOM | – | Ẩn bằng chứng G1 "mỗi mục có test oracle". |
| QR `check_in` đang chờ + lễ tân thu tiền mặt ở B9 rồi QR vẫn được xác nhận | Note (chưa chạy) | – | BE-B, DOM | – | `confirm-received` không kiểm số dư. BR chưa nói. Có thể thu hai lần. |
| `swapRoom` không có bản tính thử/tick (BR-429 (d1)) | Note | – | ARC | – | ARC đã đưa vào contract-ahead R3 (decision-log, 0.3.7 bổ sung 4). |
| FE `CheckOutPage.tsx` dòng 202–215 tự tính số cần thu, không dùng `amountDueAtCheckoutVnd` | Note → cần kiểm | – | FE-A | – | Chưa ai chạy. Sau khi sửa BE, Desk vẫn có thể hiện số khác server. |
| Sau B8 rút ngắn, dư 16.000 không tự tạo yêu cầu hoàn khi đơn còn sống | Note | – | DOM | – | Xử lý khi hủy hoặc trả phòng, đúng BR-429 (e). Ghi để không ai báo lại. |

## Major-fix-now theo gốc (danh sách sửa cho BE)

| BUG đề xuất | Phát hiện | Ai sửa | Chỗ sửa (08dabd3) | Số đúng cho test |
|---|---|---|---|---|
| BUG-R2-109 | FOC-01 (+ BUG-R2-095) | BE-B | `inventory/internal/minibar.service.ts` `record()`: đảo rồi ghi dòng mới không có `relatedLineId`; `folio.service.ts` `LineIndex.keyLine`; không ghi lại khi số đếm không đổi | 201: 743.000, còn thu 35.000, FOC applied sau B18. Đếm 2 → 1 lon: 792.000, minibar ròng 0 |
| BUG-R2-110 | FOC-03 | BE-B | `folio/public/reductions.ts` `DATED_KEY_CATEGORIES` (dòng 23) thiếu `room_change_difference`; `voidReductionKeys` phase `after` hủy FOC khi no-show; `repostVoidedDifferences` | Sau B12: 1.850.000, còn thu 250.000, FOC applied, không duyệt lại (BR-434-14) |
| BUG-R2-111 | FOC-04 | BE-A + BE-B | `reservations/internal/money-bridge.ts` `repostDifferences()`; `move-planner.ts:529` `folioDeltaVnd`; `previewStayReductions`; `checkin.service.ts` `incidentalNet` | Sang 402: 1.808.000, còn thu 208.000, xem trước = ghi = −42.000. Quay về 401: 1.850.000 |
| BUG-R2-112 | MOVE-01, REGR-03 | BE-A | `reservations.service.ts` `swapRoom` (~3656–3760) và `restoreNoShow` (~3936–3976) phải đi qua MovePlanner, lý do OTTIMO: phụ thu min, ghi `extra_person_base`, `money.resynced` | Swap A sang 302: 1.584.000. B sang 202 rồi 3 → 2 → 3: phụ thu 0. B12 302 → 202 rồi 3 → 2 → 3 hoặc thêm trẻ < 6: phụ thu 0. Thêm đêm: 0 |
| BUG-R2-113 | MOVE-02, MOVE-03, REGR-02 | BE-A | `swapRoom`, `restoreNoShow` (cả nhánh làn chưa gán) thiếu `origin_room_id = COALESCE(origin_room_id, <căn cũ>)` như dòng 3170/3416/3607; `move-planner.ts originRoom()` (254–270) dự phòng sai | 203 → (swap/B12) 101 → khách xin 401: 250.000/đêm. Tết 09/02/2027: 325.000. Quay về 203: 0 |
| BUG-R2-114 | MOVE-04 | BE-A | `restoreNoShow` nhánh unassigned để lại dòng `room_occupancy` đã nhả; `assignRoom` (~3588) và `move` (~3135) gọi `occupancy.claim` INSERT; `guarded` không đổi 23505; restore có `roomId` không xóa `conflict_state` | assign-room 201 → 200, giữ 1.600.000 / 1.700.000, nhận phòng được, thu đủ 1.000.000 (S2) |
| BUG-R2-115 | MOVE-05, PAY-03 (+ giá gõ lúc đặt) | BE-A | `move-planner.ts:400` `retier && !manual`; `reservations.service.ts:2365` `n.manual \|\| !tiered`; `pricing.service.ts` nhánh `nightlyRates` (losPct = 0); chú thích `stay-night-pricing.ts` | 4.320.000; 3.987.000; 4.898.000; 5.122.000 (BR-107-05/06) |
| BUG-R2-116 | PAY-04, S438-DOM-01 | BE-A | `checkout.service.ts:744, 836`, `checkin.service.ts:839`, `stay.service.ts:311` truyền `manual: true`; `priorNight.defaultRateVnd` lấy giá đêm đầu | B18 102/103: 777.000/đêm, tổng 4.929.000 (BR-416-04). B9a đêm thường 201: 637.000. B9a thứ Bảy: lịch 767.000 rồi áp bậc |
| BUG-R2-117 | PAY-01, REGR-01 (+ PAY-02 Minor) | BE-A (+ ARC) | `checkin.service.ts` `evaluate()` (283–286): `toPost` không tính lại bậc, thiếu phụ thu BR-110 đêm B9a, kẹp 0 trước; `amountDueForQr()` (185) đổi giá trên số đã kẹp | 101: 3.180.000 (gõ 667.000 → 3.090.000); 102 ba người lớn: 2.200.000; folio dư 1.584.000 gõ 1.000.000: 0 (BR-417-04…06). Trần QR = trần `checkIn.payment` |
| BUG-R2-118 | CANCEL-02 | BE-A | `reservations.service.ts:2764` đọc `snap.hasPeakNight`; các lệnh ghi `pricing_snapshot` B7/B8 (~2429, ~3354, ~3431) không cập nhật cờ | Dời 202 vào 15–17/4/2027, hủy 1/4: phí 500.000, hoàn 0. Dời ra khỏi Giỗ Tổ: vẫn không hoàn (BR-309-12) |
| BUG-R2-119 | CANCEL-01 (theo DOM) | BE-A | `retainableDeposit` (~2787–2803) và nhánh B7/B8 không tính lại `deposit_required_vnd` | 1.600.000 / 500.000 / 1.584.000 (BR-309-11); Desk không đòi cọc bổ sung |

Việc chung cho cả 11 mã:
- Chuyển test của người tái hiện vào repo (`test/integration/`), đổi kỳ vọng từ số quan sát sang số BR. Phần lớn test trong `v-*` đang ghim số sai hoặc chỉ ghi log.
- Mỗi mã có test đọc `br-examples.json` (DOM đã thêm BR-107-05/06, BR-309-11/12, BR-416-04/05, BR-417-04…06, BR-434-14).

## Đối chiếu phạm vi S4-38

Phạm vi lấy từ sprint-4-plan mục 3 (M1), mục 6 (S4-38) và G1.

| Mục | Đã phủ có số | Lỗi mở trên 08dabd3 | Chưa phủ |
|---|---|---|---|
| 055 – S4-01 FOC > giá đêm mới | T9: 401 → 101, FOC 667.000. Z4: không đêm âm, xem trước −375.000 = ghi. B14 202 → 302: FOC 792.000, khách trả 125.000. `foc-keys-s4` 21/21 | – | – |
| 055 – S4-03 hoa hồng | T19: CTV 8 %, 106.720 → 166.720 sau B7 đổi căn | – | **Hoa hồng sau B8 đổi ngày, khi hủy/no-show, NV sale 3 %** (tenant thử không có user CTV/SAL). Hoa hồng/phí kênh sau FOC đi theo (E4 đã biết) |
| 056 – S4-02 FOC theo số đã duyệt | B5: 4NL → 2NL → B7 → 4NL, ra 3.051.000. S4-23 ba khoản đi rồi về. E3 | FOC-01, FOC-04 | – |
| 057 – S4-05 căn gốc OTA | T4, T5, T13, T15, T18, T26. BR-424-03 và BR-424-06 = 250.000/đêm | MOVE-02, MOVE-03, REGR-02 | B7a sau khôi phục làn chưa gán (bị MOVE-04 chặn). B14 OTA phụ thu `guest_direct` |
| 058 – S4-07 phụ thu người đổi căn | T3, T7, T14, T23, T24 (BR-424-02 −50.000). Đối chứng B7 property_fault lưu định mức bảo vệ 3 | MOVE-01, REGR-03 | – |
| 059 – S4-18 FOC chờ + audit | T20. Dòng trả muộn về 0 khi FOC chờ → dormant → cancelled, trả hạn mức 225.000. B7 dời +2 ngày: FOC 300.000 sang đêm mới. Audit `folio.foc_dormant` / `foc_cancelled` | – | BR-435 / `foc_threshold` (BE-D) với FOC ngủ hoặc hủy |
| 060 – S4-22 B12 giữ FOC | Y8: 1.313.000. BR-315 (b): 1.200.000. DOM-S4-15: suspended → applied, 1.584.000. X7, Y9 | FOC-03 | Chốt folio khi FOC còn suspended (không có đường API). Số hạn mức tháng khi suspended ↔ applied (chỉ kiểm trạng thái) |
| 061 – S4-34 FOC trả muộn | K1: 150.000 = B18. K5, K7. BR-412-12 (212.000), -13 (12.000), -14 (210.000). `cancelDormantOnSettle` | – | Đua B18 ‖ B15 |
| S4-06 hoàn tự tạo + "Cần chú ý" | X5, Y2, Y4, Y6, Z1, Z3. R2: tổng yêu cầu mở = credit ở mọi vòng | CANCEL-03, CANCEL-04 | B12 sau khi đã chi hoàn; no-show lần hai; chi chuyển khoản / `original_method`; cọc CK chưa đối soát (D4); hủy do CTV/SAL |
| S4-08 dòng dịch vụ | X5, Y2, Y5 (`serviceRetainedVnd` 300.000 thử = ghi), Y10 (422). DOM-S4-15: hoàn 700.000 | – | DOM-S4-12 `performed` qua HTTP. `postpone_instead_of_cancel` và `force_majeure` rồi hủy |
| S4-13 đua | foc: 9 tổ hợp (duyệt ‖ PATCH người, ‖ B15, ‖ sửa giá, ‖ đếm minibar, ‖ B14/B16/B13, ‖ B10 retainLines). cancel: R1–R3. Y7 | – | B10 thắng trước duyệt. Nhận phòng kèm thu ‖ duyệt FOC. Xác nhận QR ‖ B9. `adjustFolioLine` ‖ duyệt FOC đêm. Xem trước B7/B14 ‖ duyệt/swap |
| S4-23 thứ tự (BR-434-11/12) | `foc-keys-s4` (BR-434-07…12). BR-433 khi chốt: 500.000 + 300.000 → FOC 167.000, hạn mức FDL 1.333.000. Ba khoản 250.000/692.000/100.000 → 302 → về 401. BR-428 + S4-23: 866.000 | – | – |
| S4-35 `setNightRate` | S3 (OTA đồng bộ "Đã thu qua OTA"). S4/S5 phụ thu sửa tay, 3 → 2 → 3 ra 1.800.000. regr (e) 1.750.000. E3. T23 | MOVE-05 / PAY-03 | `stay-night-pricing.ts:179–185`: sửa đêm không có trong snapshot (đêm gia hạn/B9a). Giá gõ lúc đặt ≥ 7 đêm |
| S4-37 `otaPenaltyVnd` | Y1: trần 1.600.000 không cộng phụ thu người/chênh lệch, 1.600.001 → 422. Y2, Y3. Z2 phí kênh 162.000 / 120.000. Y12 | CANCEL-05 (Note) | – |
| S4-47 thu trước B18 | K1: `finalPayment` +1 → 422. L2: QR `check_out` max = summary. L3. K2–K7. BR-412: summary = B18 | FOC-02 (summary thấp hơn, B18 chặn 409), PAY-04 (summary = ghi nhưng sai BR) | FE `CheckOutPage.tsx` tự tính số cần thu |
| Xem trước = lệnh ghi B7/B14 (S4-21, S4-04) | move T1–T26 mọi bước. BR-424-01/02/03/06: dryRun = ghi. B14 ví dụ BR-434: 125.000 | FOC-04 | B7a qua move (BUG-R2-123). B14 đơn con ≥ 7 đêm. B9a kết hợp B7/B14. Xem trước ‖ duyệt |
| #6 `expectedVersion` | Y7: hai MGR cùng version → 200 + 409 INVALID_TRANSITION, không 500 | – | Phần Desk (FE-A) |
| S4-10 / BUG-038 `checkIn.payment`, QR | C3–C8, BR-402-01/02, P1/P2, D1, L1 | PAY-01, PAY-02, REGR-01, S438-DOM-01 | QR chờ + tiền mặt ở B9 |
| Hồi quy chung | api 2.645/2.645 × 3; fixtures 0 lỗi; diff mới 96,4 % dòng có test chạm | – | E2E Playwright (11 dòng oracle chỉ có ở E2E). 33 dòng oracle BR-3xx/4xx không test nào đọc |

Kết luận cho hai mục "chờ S4-38" (để ORC ghi decision-log):
- **S4-37 `otaPenaltyVnd`: không sai tiền.** Trần đúng, không cộng phụ thu người hay chênh lệch. CANCEL-05 chỉ là Note dữ liệu phí kênh.
- **S4-47 thu trước B18: không thu vượt.** B18 trả 422 khi `finalPayment` > số phải thu, QR `check_out` có trần. Còn hai lỗi đã có mã: số tạm tính thấp hơn lệnh ghi khi có FOC (BUG-R2-120) và đêm thêm không nhận bậc (BUG-R2-116).

## Gaps

- Chưa ai kiểm commit 72fa486 (ghi đã sửa) hay 2442d26 (đã gộp S4-25). Báo cáo này không nói gì về HEAD.
- Không chạy E2E/UI. FE `CheckOutPage.tsx` và các màn H13/H16 gửi số xem trước vào payment/QR chưa được kiểm.
- Hoa hồng (S4-03) sau B8, khi hủy, khi no-show; NV sale 3 %: chưa dựng được đơn có CTV/SAL.
- Các tổ hợp đua còn thiếu, liệt kê ở dòng S4-13 trên.
- Luồng làn chưa gán sau B12 (BR-315 (c)) chưa đi được tới bước tính căn gốc và phụ thu, vì MOVE-04 chặn. Sau khi sửa phải chạy lại.
- Nhánh chưa test chạm: `stay-night-pricing.ts:179–185`, `folio.service.ts:2039` (suspended → dormant khi B12 mà dòng về 0), FOC xin ở B9a trên đêm trước (`stay-support.ts:444`).
- Dữ liệu cũ thật trên DB demo/staging: chưa biết bao nhiêu đơn đổi căn trước 0059 dính MOVE-02/03.
- Quy trình: nhiều thư mục `v-*` còn tệp của lượt trước trong cùng slot. Người tái hiện đều ghi rõ là chỉ dựa trên tệp mới. Vòng sau nên xóa slot trước khi giao.

## Khuyến nghị cổng QC Sprint 4

**CHƯA – cần vòng sửa.** Với commit 08dabd3:
- G1 không đạt: 16 phát hiện Major còn sai tiền, gồm mục CỔNG S4-35, S4-22 (FOC-03), S4-05/07 (đường swap/B12), và "xem trước = lệnh ghi" B7/B14 (FOC-04).
- G7 không đạt: 11 mã P1 Open (16 phát hiện), kể cả MOVE-04 (500 làm kẹt đơn).

Điều kiện để vào cổng:
1. Đóng 11 mã Major BUG-R2-109…119. Mỗi mã có test oracle với số ở bảng "Major-fix-now theo gốc".
2. Sửa cùng vòng các Minor cùng hàm: BUG-R2-120 (FOC-02, cùng `extraNightDelta`), PAY-02 (cùng `evaluate`), BUG-R2-121 và 122 (thuộc S4-06, là CỔNG). BUG-R2-123/124 (P3) có thể sang Ổn định, kèm kế hoạch.
3. **Lượt kiểm lại S4-38** (D9 theo mục 4) trên commit sửa (72fa486 hoặc mới hơn):
   - chạy lại toàn bộ test `test/s438/v-*` và 5 harness skeptic, sau khi đổi kỳ vọng sang số BR;
   - mục tiêu 0 ca lệch tiền, xem trước = lệnh ghi ở B7, B14, B9a, B18;
   - riêng FOC-01 phải kiểm qua đường S4-25 trên Desk (H16 bước 1 luôn ghi lại minibar).
4. Bổ sung ca cho các gap chạm tiền trước khi chấm: hoa hồng sau B8 (S4-03), luồng làn chưa gán sau B12, sửa giá đêm gia hạn/B9a, đua nhận phòng ‖ duyệt FOC và xác nhận QR ‖ B9, FE `CheckOutPage.tsx` dùng `amountDueAtCheckoutVnd`.
5. ORC ghi decision-log hai kết luận "không sai tiền" của S4-37 `otaPenaltyVnd` và S4-47 (mục trên). DOM quyết MOVE-06 (mở (d2) sang B14 hay không).
6. QA gỡ `pendingFix` cũ cho 10 dòng oracle và cho test đọc các dòng chưa đọc, ít nhất BR-315-03…05 và BR-429-01/02/13 (cùng vùng B12/B7).
7. G5: api và E2E xanh trên đúng commit chấm.

Nếu tới cuối D8 điều kiện 1–3 chưa xong thì áp quy tắc lùi cổng sang tuần Ổn định (mục 11.2). Không cấp ngoại lệ tiền.

## Tệp của critic

Thư mục `/private/tmp/claude-501/-Users-anhvh-Library-Application-Support-Claude-scratch-workspaces-00554cf2-3678-4864-82b0-830aaeaa97bd-4c0caebe-be05-49c5-a5a2-5bf357fddc6a-scratch-2026-10-15-c4f0d4/36df3adc-c586-471c-a039-340d2b696728/scratchpad/s438/critic/`:
- `env.sh`
- `move06-run.log`: 9/9, MOVE-06
- `move06-k0.json`: số quan sát K0-1…K0-4

`run1.log` trong cùng thư mục là của một lượt critic trước, không dùng.

DB `ottimo_test_s438_critic` đã được xóa sau khi chạy.
