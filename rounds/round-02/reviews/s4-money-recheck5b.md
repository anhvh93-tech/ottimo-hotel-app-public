# Kiểm đích danh gộp #11 – commit f04052d

Đây là lượt kiểm đích danh gộp #11 của S4-38 (Round 2 Sprint 4, tuần Ổn định). Gộp #11 là vòng sửa 4b/4c: khóa theo tủ `lockFridge`, `periodId` + 409 `MINIBAR_PERIOD_CHANGED`, khóa đơn `FOR NO KEY UPDATE`. Có 3 hướng kiểm: `k11lock` (thứ tự khóa, phạm vi khóa tủ), `k11period` (`periodId`, kỳ nạp), `k11nokey` (hệ quả của `FOR NO KEY UPDATE`). Ba hướng báo 13 phát hiện. Mỗi phát hiện có 2 người tái hiện độc lập (`q-k11*`, 26 lượt). Mỗi người tự viết test, chạy trên PostgreSQL 17 thật, DB riêng `ottimo_test_s438_k11*` / `qk11*`, bản sao cố định f04052d (`wt11`, src không sửa). Nhiều người tái hiện dùng cơ chế xen khác người báo (trigger + khóa advisory, giữ folio, giữ dòng guest `FOR SHARE`, `vi.mock`) và có đối chứng: ce90d19, bản trả 4c về `FOR UPDATE`, bản thử sửa.

Test nằm ở `scratchpad/s438/wt11/product/services/api/test/s438/` (chưa track). Thư mục `k11*/` là của người kiểm, `q-k11*/` là của người tái hiện. Log ở `scratchpad/s438/k11*/`, `scratchpad/s438/q-k11*/`.

Ghi chú thời điểm:
- Báo cáo chấm commit **f04052d** (gộp #11). Cây chính đã có 8819c2d (QA cấp 158…169) và vòng sửa 5 **chưa commit**. Critic chỉ đọc nhanh vòng 5, không chạy (mục "Critic đọc lại mã").
- Mốc hợp đồng: `openapi-0.3.7.md` 16.16 bổ sung, bổ sung 2 (aa)(ab), 16.17 và 16.17 bổ sung (vòng 5). Mốc BR: v0.3.8 bản 18/10, BR-703-02 ghi chú 1–4. Mã đích: BUG-R2-168 (ARC-16.16-ab), BUG-R2-169 (ARC-16.16-deadlock), chỗ đua `record()` ‖ `onRefillDone` (ARC 16.16 bổ sung, không có mã riêng).
- **Nhãn K11-01…K11-09 trong báo cáo này là nhãn tạm của critic.** Mã gốc ghi kèm tên hướng, vì `k11period` và `k11nokey` cùng dùng K11-01…04. QA cấp số sau.

## Tóm tắt

- 3 đích của #11:
  - ARC-16.16-ab (168): **ĐÃ SỬA** cho kịch bản ARC nêu. Ba hướng đều xanh.
  - ARC-16.16-deadlock (169): **ĐÃ SỬA trên bảng `reservation`**. Nhưng bản sửa 4c gây **hồi quy P1** (K11-01). Cùng lớp deadlock còn trên bảng `room` (K11-04).
  - Đua `record()` ‖ `onRefillDone`: **ĐÃ SỬA**, cả hai thứ tự giống chạy tuần tự.
- 13 báo cáo → **9 phát hiện + 2 trùng mã cũ**. Ba báo cáo deadlock qua `room` gộp thành K11-04. `k11lock:K11LOCK-04` trùng BUG-R2-159. `k11lock:K11LOCK-05` trùng BUG-R2-163.
  - **3 Major-fix-now** (P1): K11-01 (hồi quy #11), K11-02, K11-03 (có từ trước, lộ khi tấn công quanh khóa).
  - 2 Minor P2, **bắt buộc sửa cùng vòng 5**: K11-04, K11-05.
  - 2 Minor P3: K11-06, K11-07.
  - 2 Note: K11-08, K11-09.
  - 0 CLOSED-not-real.
- 26 lượt tái hiện đều tái hiện được hành vi. 22 lượt xác nhận lệch quy tắc. 4 lượt không lệch quy tắc (`k11period:K11-03` × 1, `k11period:K11-04` × 2, `k11nokey:K11-04` × 1).
- Critic đổi kết luận:
  - Deadlock qua `room`: hai hướng báo P1 → **P2**, nhất quán với 169.
  - BUG-R2-163: **P2 → P1**, vì có đường vào qua PWA HK hiện có.
  - `k11nokey:K11-03`: P2 → **P3** (Desk không có đường vào).
  - `k11period:K11-03`: P2 → **Note** (đúng R9, không phải lỗi mã).
  - Ghép phát hiện phụ của người tái hiện (Desk lấy `segments[0]` làm căn hiện tại) vào K11-03.
- **Bảo mật**: không có lỗ hổng xác thực hay phân quyền mới. Thân 409 `MINIBAR_PERIOD_CHANGED` chỉ có mã, không lộ id. K11-01 là vượt kiểm soát A19 qua đua; SEC biết, sửa K11-01 là đủ.
- **#11 chưa đạt G1, G7.** Lệch tiền mới: K11-01 (mất nợ âm thầm), K11-02 (thu thừa 70.000), K11-03 (70.000 cho 1 bia, B18 kẹt). P1 mở sau lượt này: 159…163, K11-01…03 = **8**.

## Kết quả từng hướng kiểm

**k11lock** (BE-B khóa tủ, thứ tự khóa):
- 9 tệp trong `test/s438/k11lock/`, DB `ottimo_test_s438_k11lock`, `deadlock_timeout` 1 s. `minibar-m1` 31/31 trên DB này trước khi viết test.
- Xen bằng khóa thật (advisory của tủ hoặc folio `FOR UPDATE`), kiểm thứ tự bằng `pg_blocking_pids`. Mỗi kịch bản 3 vòng, mỗi vòng so với chạy tuần tự trên lượt ở mới.
- Lượt cuối: 32 ca, 22 đạt, 10 đỏ. 10 ca đỏ là bằng chứng của K11LOCK-01…05.
- Sạch: 12 cặp dưới khóa tủ, cả hai thứ tự; phạm vi khóa đơn cha/con B9a; hai tủ không chặn nhau.

**k11period** (`periodId`, kỳ nạp):
- `k11period.test.ts` 29 ca, 3 lượt đủ tệp. Đối chứng cùng tệp trên ce90d19 cho D2, D3, D3b, D5, D6.
- Chạy lại: `minibar-m1` 31/31, `s438r4-money` + `schema-parity` 23/23, admin-web `s4-144-fea` 7/7.
- Sạch: periodId lạ, của tủ khác, lượt khác, tổ chức khác; idempotency sau 409; HK không thấy giá.

**k11nokey** (`FOR NO KEY UPDATE`):
- `nokey-b18`, `nokey-more`, `nokey-period`, DB `ottimo_test_s438_k11nokey`. Đối chứng: bản sao chỉ trả 7 tệp 4c về `FOR UPDATE` (DB `_ctrl`).
- Chạy lại `minibar-m1` 8 ca đua × 3 lượt, `s438r4-money` "deadlock class" × 3 lượt: xanh.
- Rà mọi khóa trên `reservation` sau 4c. Kiểm thứ tự "khóa folio trước khi đọc số dư" ở B18, `createVietQr`, `recordInTx`, hủy/no-show.

## Trạng thái 3 đích của #11

| Đích | Mã | Ở f04052d | Bằng chứng có số | Ghi chú |
|---|---|---|---|---|
| ARC-16.16-ab | BUG-R2-168 (P1) | **ĐÃ SỬA** | k11lock: đếm có `periodId` ‖ lần nạp, ‖ B13, thứ tự BA → 409, không ghi; 6/6, deadlocks +0; thứ tự AB 201. k11period: A1 B14 về căn cũ sau lần nạp → 409, gửi lại cùng key thân mới → 201, tổng 70.000; A2 B13 mở `carry` → 409, tải lại → 201 (35.000 + 35.000); B1 `null` trên tủ có `carry`/`refill` → 409; B2 `null` + copy-on-write → 70.000 (không 105.000); B3 cùng một thân 409, `not-a-uuid` → 422. k11nokey ab-1, ab-2: 3/3. | QA đóng 168 khi CI #11 xanh. Lỗ còn lại không thuộc kịch bản ARC: `null` trên tủ chưa nạp khi vắng `roomId` (K11-03, P1); vắng `periodId` (K11-08); lần đếm không tính tiền + B13 (K11-09). |
| ARC-16.16-deadlock | BUG-R2-169 (P2) | **ĐÃ SỬA phần đơn; bản sửa gây hồi quy P1** | k11lock: `adjustFolioLine` ‖ B13, duyệt FOC ‖ B18, thu tiền ‖ B13, `addFolioLine` ‖ B14, FOC tự duyệt ‖ B13: 15/15 vòng như tuần tự, deadlocks +0, 2 lượt. k11period D2: 3 × 3 vòng 200/201/201; ce90d19 409 `CONCURRENT_UPDATE` 3/3. k11nokey: B13 ‖ dòng ‖ phiếu thu sạch; `requestFoc` tự áp ‖ B18 → FOC 409 `FOLIO_LOCKED` sau B18 (G0–G2). | 4c bỏ sự tuần tự hóa ngầm giữa đăng dòng folio và bước đọc số dư của B18 → K11-01. Cùng lớp còn trên `room` → K11-04. **Không đóng 169** tới khi K11-01 và K11-04 xong (cùng thay đổi khóa). |
| Đua `record()` ‖ `onRefillDone` | – (ARC 16.16 bổ sung) | **ĐÃ SỬA** | k11lock 12/12 (cả hai thứ tự, có/không `periodId`, HK offline sớm 20'): nạp trước → 422 `MINIBAR_ITEMS_INCOMPLETE` hoặc 409; đếm trước → mốc bia 2, bỏ snack (16c), minibar [30.000, 70.000]. k11period D1 3 vòng × 3 lượt: nạp trước 409, folio [35.000]; đếm trước 201, mốc 0 + 1, [35.000, 35.000]. k11nokey `onRefillDone` ‖ B18 (C0–C2): HK không mở kỳ sau B18. | `onRefillDone` ‖ B18 đúng **nhờ khóa `room FOR UPDATE` của B18**, không nhờ khóa đơn. Điều này quyết định cách sửa K11-04. Đường kề còn lỗi: K11-05, 159, 163. |

## Critic đọc lại mã

Critic không chạy test riêng ở lượt này. Mỗi phát hiện đã có 2 người tái hiện trên PostgreSQL thật, với cơ chế xen khác nhau và có đối chứng. Critic đọc mã f04052d (`wt11`) cho mọi gốc Major và Minor. Mã khớp mô tả:
- `frontdesk/internal/checkout.service.ts` B18: `loadReservation(forUpdate)` (559) = `FOR NO KEY UPDATE` (`reservation-store.ts` 145); `lockRooms` (629); đọc số dư (787); khóa folio lần đầu trong `settle()` (893). Không có `finalPayment`, phụ thu hay đêm thêm thì giữa 787 và 893 không khóa folio.
- `reservations/public/occupancy.service.ts` 80: `room … FOR UPDATE`.
- `inventory/internal/minibar.service.ts` `record()`: `fridgeOf` (350) trước mọi khóa; `lockStayBookingsShared` (368) → `lockForPosting` (369) → `fresh` (370, chỉ kiểm `status`) → `lockFridge` (377); dòng 533 so `fr.roomId !== s.roomId` với `s` cũ. Chú thích 364–365 "check-out locks the folio before settling" sai.
- `inventory/internal/fridge.ts` `lockFridge` (42–48): `reservation FOR KEY SHARE`, `room FOR KEY SHARE`, rồi advisory. `snapshotFridgesBeforeCatalogueChange`: `NOT EXISTS` rồi `writeFill`, không `lockFridge`.
- `inventory/internal/items.service.ts`: `update()` khóa item `row(tx, id, true)` (175) **trước** `keepFridgesBeforeChange` (181).
- `admin-web/src/pages/stay/CheckOutPage.tsx` 294: `currentRoomId = r.segments?.[0]?.roomId`. `reservation-store.ts` 168 `activeSegments` `ORDER BY s.from_date` (tăng dần). Lần đếm gửi `roomId: counted` (424, vắng khi đếm căn "hiện tại") và `periodId` (426).
- `inventory/public/minibar-checkout.port.ts` `openNextPeriod` (148–162): `done_at > count.created_at`.

Cây chính, vòng 5 chưa commit (chỉ đọc, chưa chạy):
- `record()` vẫn khóa `lockStayBookings` → `lockForPosting` → `lockFridge` (căn `KEY SHARE` sau folio, nay thêm khóa việc). `lockRooms` vẫn `FOR UPDATE`.
- `checkout.service.ts` vẫn đọc số dư (~714) khi chưa khóa folio, nếu không có đêm thêm, phụ thu hay thu tiền.
- `CheckOutPage.tsx` 295 vẫn `segments[0]`.
- ARC 16.17 bổ sung (thứ tự khóa mới) ghi: "`FOR KEY SHARE` đơn/căn trong `lockFridge` không xung đột với `NO KEY UPDATE`". Câu này đúng với đơn, **sai với căn**: căn bị B13/B14/B18 giữ `FOR UPDATE`.
- Như vậy vòng 5 hiện chưa đóng K11-01, K11-03, K11-04.

## Critic – phân xử phát hiện mới

| Nhãn | Nguồn | Kết luận | Mức | Ai sửa | Lý do |
|---|---|---|---|---|---|
| K11-01 B18 đọc số dư khi chưa khóa folio; `addFolioLine`/`adjustFolioLine` chen vào → folio `settled` còn nợ, `checkout_mode = desk`, không ghi công nợ | `k11nokey:K11-01` | **Major-fix-now** (hồi quy #11) | P1 | BE-A (+ ARC quy tắc) | 2/2 tái hiện, đều P1. Ép xen 27/27 và 28/28: B18 200, `checked_out`, folio `settled`, nợ 150.000, dòng không `post_checkout`. Đua tự nhiên không giữ khóa: 39/72 và 43/48. Đối chứng trả 4c về `FOR UPDATE` (hai người tự dựng): 0 vi phạm tiền, chỉ ra 409 `CONCURRENT_UPDATE` / `BALANCE_DUE` hoặc dòng `post_checkout`. Kết quả không trùng thứ tự tuần tự nào. Trái spec 5.5 / BR-426 (còn nợ → 409 `BALANCE_DUE`), A19 (chỉ OWN/MGR ghi công nợ), BR-427 c. Đơn `desk` không vào danh sách công nợ, không ai được báo. Gốc: ARC 16.16 bổ sung 2 (aa) cho rằng `NO KEY UPDATE` "vẫn tuần tự hóa", bỏ sót việc khóa `KEY SHARE` của kiểm FK là thứ duy nhất tuần tự hóa đăng dòng với bước đọc số dư. Ca "deadlock class" của BE-A xanh nhưng không bắt được (K11-07). |
| K11-02 copy-on-write khi OWN tạo/sửa món minibar không lấy khóa tủ; chen với lần đếm đầu của tủ chưa nạp → hai lần nạp `check_in`, tính trùng | `k11period:K11-02` | **Major-fix-now** | P1 | BE-B (+ BE-D `items.service.ts`, ARC) | 2/2 tái hiện, đều P1, cả hai dùng cơ chế xen khác người báo. 18/18 và 6/6: `fills = check_in, check_in`; lần đếm kẹt ở kỳ cũ; B18 409 `MINIBAR_NOT_CHECKED` với lý do sai `stay_continued`; `latestCheck` null; lễ tân đếm lại → [70.000, 70.000], B18 thu 140.000 (thừa 70.000); 2 việc bổ sung. **Đua tự nhiên** (lệch 0–3 ms, không khóa): 36/36 hai `check_in`, 12/36 kẹt, 4/12 tính trùng. Chỉ `createItem` và `updateItem` món chưa có trong tủ; sửa giá món đang có tự tuần tự (đối chứng C1). Thứ tự ngược: không sai tiền nhưng `periodId: null` bị 409 (phá (ac)). Có từ 365486f (ce90d19 giống hệt). Vẫn thuộc #11: ARC 16.16 bổ sung đòi khóa tủ ở "mọi đường đổi tủ"; (ac) dựa trên một `check_in` mỗi tủ. Giữ P1 theo tiền lệ 158 (cùng hình). Tần suất thấp. |
| K11-03 lần đếm minibar không định danh được tủ: (a) `periodId: null` + vắng `roomId`, B14 xen giữa GET và POST → ghi vào tủ căn mới; (b) Desk lấy `segments[0]` làm căn hiện tại → sau B14 giữa lượt, chọn tủ căn cũ thì gửi vắng `roomId`, ghi vào tủ căn mới | `k11lock:K11LOCK-02` + phát hiện phụ của `q-k11lock-1-0` | **Major-fix-now** | P1 | FE-A (chính) + BE-B (phòng thủ) + ARC (hợp đồng) | (a) 2/2 tái hiện, đều P1, 3/3 mỗi lượt: 201, lần đếm của 202 nằm ở tủ 203; đếm 202 sau đó → [35.000, 35.000] = **70.000 cho 1 bia**; tủ 203 bị coi là đã đếm; việc bổ sung 203 thừa. Xem trước (`roomNo` 202) ≠ ghi (203). Đối chứng: `periodId` là id → 409; gửi `roomId` 202 → đúng. Gốc: `fridgeOf` đổi "vắng" thành căn lúc ghi; `isCurrentPeriod(null)` gặp tủ 203 chưa nạp trả true. (b) Không cần đua. Người tái hiện chạy đúng thân lệnh Desk dựng, 3/3; critic đọc mã xác nhận (`CheckOutPage.tsx` 294, `activeSegments` tăng dần). Desk không ghi được tủ căn cũ → B18 kẹt `MINIBAR_NOT_CHECKED` (trừ khi HK đếm trong ngày B14). Mock `stay.ts` chỉ có một đoạn nên test FE không bắt; `ui-clock` không có ca B14 rồi H16. Có từ 365486f. Trái BR-703-01, BR-702, ý (ab). Gộp hai gốc vì một bản sửa FE đóng đường Desk của cả hai. Phần (b) P1 tạm tới khi QA chạy E2E UI. |
| K11-04 deadlock 40P01 giữa lần đếm (`record()`) và B13/B14/B18 qua dòng `room`: đếm giữ folio rồi xin `room KEY SHARE`; B13/B14/B18 giữ `room FOR UPDATE` rồi chờ folio | `k11lock:K11LOCK-01` + `k11period:K11-01` + `k11nokey:K11-02` | Minor – **bắt buộc sửa cùng vòng 5** | P2 (hai hướng báo P1) | BE-B (+ ARC câu thứ tự khóa) | 6/6 lượt tái hiện. Ép xen: 119/119 ca 40P01 sau ~1,0–1,1 s, `pg_stat_database.deadlocks` +1 mỗi ca, log Postgres đúng cặp `room … FOR KEY SHARE` / `folio … FOR UPDATE`. Tự nhiên: 29/194 khi lệch 6–14 ms; gửi cùng lúc 0/116. Cả lần đếm đầu và đếm lại; cả HK đếm ngày đi. Lịch sử: ce90d19 đã deadlock với đếm lại (qua FK đơn); 4b đơn thuần sạch; 4c chuyển điểm chờ sang `room` và mở thêm cho lần đếm đầu. Không sai tiền: giao dịch rút cả gói, 409 `CONCURRENT_UPDATE` + `Retry-After`, gửi lại cùng key → đúng; `useWrite` của Desk tự gửi lại. **P2 nhất quán với BUG-R2-169** (cùng lớp, ARC xếp P2). Bắt buộc sửa ở vòng 5 vì ARC 16.17 bổ sung vừa ghi lại câu sai về căn, `s4-be-b.md` mục 15 ghi "không còn 40P01", và vòng 5 thêm khóa việc vào `lockFridge` sau folio. |
| K11-05 `record()` xác định tủ và `s.roomId` trước khi khóa, không đọc lại sau khóa; B14 commit trong lúc lần đếm chờ → lần đếm tủ cũ không bao giờ có việc bổ sung, hoặc sinh việc sớm | `k11lock:K11LOCK-03` | Minor – sửa cùng vòng 5 (cùng `record()`) | P2 | BE-B (+ ARC câu chữ) | 2/2 tái hiện, đều P2. (1) Đếm căn hiện tại xen sau B14: 12/12 và 18/18 lần đếm sống có dùng món mà **không có việc bổ sung**; tuần tự 0. Đua tự nhiên lệch 5–15 ms: 8/8 mất việc. (2) Đếm tủ cũ xen sau B14 quay lại: việc sinh sớm; cuối lượt giống tuần tự (P3). Trái DOM BR-703-02 ghi chú 4, ARC 16.17 I3, ARC 16.16 bổ sung ("đọc sau khi khóa"). Câu 16.16 bổ sung 2 "bất biến 4 đã bảo đảm `onCheckedOut` lúc B18…" sai với tủ căn cũ: B18 chỉ gọi cho căn hiện tại. Không sai tiền trong lượt; khách sau có thể bị tính (suy luận, chưa chạy) → P2. |
| K11-06 đơn `cancelled`/`no_show` vẫn nhận dòng folio; dư thừa giảm dưới yêu cầu hoàn đã tạo; yêu cầu kẹt `approved` | `k11nokey:K11-03` | Minor | P3 (hạ từ P2) | BE-B (folio) / BE-A (`refundPlan`); DOM/PO chốt | 2/2 tái hiện, đều P2. FD, FDL, MGR đều 201. Cọc 2.000.000 → dư thừa 1.910.000, yêu cầu 2.000.000 vẫn chờ; chi tối đa 1.910.000; phần còn lại không chi được, không hủy được; mục chú ý tự đóng. No-show cùng hình. Trái BR-522 v0.3.8 (yêu cầu hoàn = dư thừa; lớn hơn thì tự hủy, tạo lại). Critic hạ P3: Desk không có đường vào (nút "Thêm phí" chỉ khi `in_house`; `AddChargeDialog` chỉ mở từ `ReservationDrawer` và `CheckOutPage`); tiền chi không sai (giới hạn ở dư thừa thật); void dòng gỡ được. Có từ Sprint 3. |
| K11-07 ca "deadlock class" của BE-A chỉ kiểm khác 500; chú thích `record()` nói B18 khóa folio trước khi chốt | `k11nokey:K11-04` | Minor | P3 | BE-A (test), BE-B (chú thích) | 2/2 tái hiện; một người thấy lệch chuẩn test đua của ARC, một người coi là lỗi test. Ca BE-A xanh 3/3, oracle tiền đỏ 10/10 (ép) và 32/32 (tự nhiên). Chỉ thêm assert tiền vào ca hiện có **chưa đủ**: ca gửi `finalPayment` nên `recordInTx` khóa folio trước (0/18 vi phạm); nhánh số dư 0 không `finalPayment` mới lộ lỗi (24/24). Sửa cùng K11-01. |
| K11-08 lần đếm vắng `periodId`, danh sách món trùng kỳ mới → tính thừa 35.000 | `k11period:K11-04` | Note | P3 | ARC quyết; BE-B; MOB | 2/2 tái hiện, cả hai không lệch quy tắc. Đúng hợp đồng (ab) "vắng = không so". `periodId: null` tường minh → 409 (đúng). Desk luôn gửi; PWA HK chưa có màn đếm. Server nhận lần đếm vai HK không `periodId` (H1). ARC quyết bắt buộc `periodId` khi tủ đã có kỳ khác `check_in` (hoặc với vai HK) **trước khi** MOB làm màn đếm. |
| K11-09 lần đếm soạn trước B13 (lần đếm sống không tính tiền) vẫn được nhận sau B13 | `k11period:K11-03` | Note (không phải lỗi mã) | – | DOM + ARC | 2/2 tái hiện hành vi 201. Một người not-a-bug, một người P2. Critic theo người thứ nhất: kỳ không đổi, thân lệnh soạn trước B13 trùng từng byte với thân soạn lại sau B13; lần đếm hợp lệ ngay sau B13 cũng cho cùng kết quả hôm sau. Đúng R9 (không lọc ngày) và (t)/(v); không có xem trước ≠ ghi, không sai tiền. Rủi ro thật (món đêm gia hạn không bị tính nếu không ai đếm lại) nằm ở định nghĩa mốc R9, không ở `periodId`. DOM/ARC quyết có đòi đếm trong ngày đi mới sau B13 hay không. |

Trùng mã cũ (không cấp nhãn mới):

| Nguồn | Gộp vào | Kết luận | Lý do |
|---|---|---|---|
| `k11lock:K11LOCK-04` đếm lại tủ căn cũ sinh việc thứ hai, việc của lần đếm bị thay vẫn mở → nạp thừa | **BUG-R2-159** (Open, P1) | Thêm ca vào 159 | 2/2 tái hiện, tuần tự, 3/3 mỗi biến thể. Cùng gốc 159: `record()` không xử lý `prev.refill_task_id`, `onCheckedOut` sinh việc thứ hai. Biến thể mới cho test 159: FD → FD (không riêng HK), sửa 2 → 1, đếm trước B14 rồi đếm lại tủ cũ, khách sau đếm "còn 3" → 422 `MINIBAR_QTY_OVER_STANDARD`, về căn cũ rồi HK xong cả hai việc → thu thêm 35.000. ARC 16.17 (`reconcileRefillTasks`) và 0067 (c) đã phủ. |
| `k11lock:K11LOCK-05` máy HK chậm giờ → `onStayContinued` mở kỳ `carry` thay `refill`, thu thiếu | **BUG-R2-163**, **nâng P2 → P1** | Thêm ca vào 163 | 2/2 tái hiện (một P1, một P2); 3/3 nhánh lỗi, đối chứng 6/6. Gốc trùng 163 (`done_at > count.created_at`). Lượt 5 hạ 163 xuống P2 vì "chưa client gửi đếm offline". Đường này đi qua **PWA HK hiện có**: bấm xong việc gửi `performedAt` theo giờ máy. Máy chậm hơn khoảng từ lần đếm tới lúc nạp là đủ, vài phút nếu HK nạp ngay. Hậu quả: thu thiếu 70.000 (dùng 2) hoặc 35.000 (dùng 1); lần đếm đúng thực tế bị 422 `NOT_IN_LIST`; khách sau bị tính món không dùng. Cách sửa đã có: ARC 16.17 mục 2. |

Phân loại bảo mật cho SEC:
- Không có lỗ hổng xác thực hay phân quyền mới. 409 `MINIBAR_PERIOD_CHANGED` cùng một thân cho mọi `periodId` sai, không lộ id. HK đọc `minibar-standard` không có giá; HK gọi `getFolio` → 403/404.
- K11-01 là **vượt kiểm soát A19 qua đua**: FD kết thúc trả phòng với folio còn nợ mà không cần OWN/MGR, khoản nợ không vào danh sách công nợ. Có dấu vết (dòng folio, audit) nhưng không ai được báo. SEC ghi nhận như rủi ro kiểm soát nội bộ; sửa K11-01 là đủ.
- K11-06: FD ghi dòng vào đơn đã hủy làm giảm số hoàn của khách, có audit. DOM/PO chốt vai khi chốt quy tắc.

## Major-fix-now theo gốc (danh sách sửa)

| Nhãn | Ai sửa | Chỗ sửa (f04052d) | Số đúng cho test |
|---|---|---|---|
| K11-01 | BE-A (+ ARC) | `checkout.service.ts` `checkOut`: khóa folio (`FolioService.lock` / `lockStayFolio`) **ngay sau `lockRooms` (629)**, trước kiểm minibar, `pendingApprovals`, `resyncOtaCollect` và số dư (787). Thứ tự đơn → căn → folio. Rà mọi lệnh quyết định theo số dư khi chưa khóa folio: B9 `checkin.service.ts` ~758, `postFee` khi HK xong việc, dòng damage `pending_approval`. ARC thêm quy tắc "lệnh quyết định theo số dư phải khóa folio trước khi đọc" vào 16.16 bổ sung 2 và erd 4.5, sửa nhận định (aa). **Lối tạm nếu vòng 5 không kịp**: trả 7 tệp 4c về `FOR UPDATE` ở gộp #12 (hai bản đối chứng: 0 vi phạm tiền); 169 mở lại P2; ORC ghi decision-log. | Đơn `in_house`, folio 0, tủ đã đếm, B18 10:00 không `finalPayment`, chen `addFolioLine` fnb 150.000: hoặc B18 409 `BALANCE_DUE` (đơn `in_house`, folio `open`, nợ 150.000), hoặc B18 200 rồi dòng 201 `post_checkout = true`. `adjustFolioLine` fnb 100.000 → 250.000: cùng hai lối, nợ 150.000. Bất biến cho mọi ca đua: "B18 200 + `desk` ⇒ `balanceDueVnd` = 0, hoặc dòng chen là `post_checkout`". Đua tự nhiên 24 vòng (`Promise.all`, dòng 120.000): **0 vi phạm**. Đối chứng: tuần tự dòng trước → 409; B18 trước → `post_checkout` (đang xanh). |
| K11-02 | BE-B (+ BE-D, ARC) | Ưu tiên: unique partial index `minibar_fill(reservation_id, room_id) WHERE source = 'check_in'` (migration ORC cấp số; kiểm dữ liệu có > 1 `check_in` trước khi tạo); `registerFridge` và `snapshotFridgesBeforeCatalogueChange` ghi `check_in` bằng `ON CONFLICT DO NOTHING` rồi đọc lại. Cách khác: snapshot lấy `lockFridge` từng tủ rồi kiểm lại `NOT EXISTS`; khi đó `items.service.ts` `update()` phải gọi `keepFridgesBeforeChange` (181) **trước** `row(tx, id, true)` (175), nếu không thành 40P01 (đếm giữ tủ chờ `KEY SHARE` item; sửa món giữ item chờ tủ). ARC ghi thứ tự item ↔ tủ. | Căn 201, ngày đi 09:00, tủ chưa nạp. HK đếm đầu (bia dùng 2, `periodId: null`) chen `POST /items` của OWN, cả hai thứ tự: **1** lần nạp `check_in`; lần đếm thuộc kỳ hiện tại; tóm tắt trả phòng không chặn minibar; minibar **70.000**; **1** việc `{bia: 2}`. Thứ tự ngược (snapshot trước): 1 `check_in`, lần đếm sau với `periodId: null` → 201. Bật lại món ngoài tủ chen lần đếm: như trên. Đối chứng: sửa giá món đang có chen lần đếm → 70.000 (đang xanh); tuần tự → 70.000. |
| K11-03 | FE-A + BE-B + ARC | **FE-A** `CheckOutPage.tsx`: căn hiện tại = đoạn hiệu lực hôm nay (`from_date ≤ hôm nay < to_date`), không `segments[0]` (294; rà cùng 465, 801, 1198, 1303). `saveMinibar` luôn gửi `roomId` của tủ đang hiển thị (`countingRoomId`), không gửi vắng; GET `minibar-standard` cũng gửi `roomId`. Mock `stay.ts` có hai đoạn sau B14. **ARC** chốt hợp đồng, một trong hai: `MinibarCheckInput.roomId` bắt buộc khi có `periodId` (kể cả `null`); hoặc thêm `MinibarStandard.roomId` và `periodId: null` gắn với tủ. **BE-B**: theo cách ARC chọn, lệnh không định danh được tủ → 409 `MINIBAR_PERIOD_CHANGED`. | Khách 202, d0–d2, tủ 202 chưa nạp. d1 09:00 GET (`roomId` 202) → `roomNo` 202, `periodId` null. 09:05 FD khác B14 202 → 203. 09:06 đếm bia dùng 1, `roomId` 202 → 201, ghi **tủ 202** (tủ căn cũ), 35.000, 1 việc `{bia: 1}`. d2: B18 đòi đếm 203; đếm 203 dùng 0; B18 200; minibar **35.000**. Lệnh vắng `roomId` + `periodId: null` sau khi căn đổi → 409, không ghi. Desk, B14 giữa lượt, không đua: H16 hiện tủ 202 và 203; đếm 202 qua UI → lệnh có `roomId` 202, ghi tủ 202; B18 200. QA thêm E2E UI cho ca này. |

Việc chung cho 3 mã:
- Chuyển ca của người tái hiện (`q-k11nokey-0-*`, `q-k11period-1-*`, `q-k11lock-1-*`) vào `test/integration/`, kỳ vọng theo số ở bảng trên.
- **Mọi ca đua có oracle tiền và đối chứng tuần tự.** Không chấp nhận ca chỉ kiểm "khác 500" (bài học K11-07).
- **Mọi thay đổi nới khóa phải kèm ca đua có oracle tiền** cho các lệnh từng bị khóa cũ tuần tự hóa ngầm. 4c đổi một 409 thử lại thành mất tiền âm thầm.

## Minor và Note – kế hoạch

| Mã | Mức | Ai | Kế hoạch |
|---|---|---|---|
| K11-04 (deadlock qua `room`) | P2 | BE-B; ARC | `record()`: lấy `KEY SHARE` đơn chính và căn của tủ (tách phần đầu `lockFridge`) ngay sau `lockStayBookingsShared`, **trước** `lockForPosting`; advisory và khóa việc của vòng 5 giữ sau folio. Thứ tự: đơn/căn → folio → việc → tủ. Hai người tái hiện k11period đã thử cách này trên bản sao: 7/7 và 9/9 xanh, deadlocks 0, `minibar-m1` 31/31. **Không đổi `lockRooms` sang `FOR NO KEY UPDATE`** dù đối chứng cũng xanh: `onRefillDone` ‖ B18 đang đúng chính nhờ `room FOR UPDATE` của B18; nới khóa căn lặp lại bài học K11-01. ARC sửa câu thứ tự ở 16.17 bổ sung, ghi rõ căn bị B13/B14/B18 giữ `FOR UPDATE`. BE-B sửa `s4-be-b.md` mục 15. Test: đếm / HK đếm ngày đi ‖ B18, B13, B14, ép cả hai thứ tự, và quét tự nhiên d = 0…30 ms: deadlocks +0, kết quả như tuần tự. Chạy lại sau khi sửa K11-01 (B18 khóa folio sớm hơn). |
| K11-05 (tủ đọc trước khóa) | P2 | BE-B; ARC | `record()`: dùng `stayInfo` đọc **dưới khóa folio** để xác định lại tủ (`fridgeOf`) và cờ `create` của `reconcileRefillTasks` / lời gọi `onCheckedOut` (so với căn hiện tại dưới khóa). Vắng `roomId` mà căn hiện tại dưới khóa khác tủ đã chọn → 409 (cùng K11-03). ARC sửa câu "bất biến 4 đã bảo đảm…" (16.16 bổ sung 2) và bảng 16.17 ("tủ không phải căn đang gán" → xét dưới khóa). Truy vấn kiểm thêm cho OPS/QA: lần đếm sống có dùng món của tủ lượt đã rời (hoặc lượt `checked_out`) mà `refill_task_id` NULL = 0. Số: 202, B14 202 → 203 chen lần đếm 202 bia dùng 2 (B14 trước): lần đếm vắng `roomId` ghi tủ 203 như tuần tự (hoặc 409 nếu có `periodId` của 202); lần đếm có `roomId` 202 có **1** việc `{bia: 2}` ngay; sau B18 0 lần đếm mồ côi. B14 về 202 chen đếm tủ 202: không sinh việc tới B18. |
| K11-06 (đơn đã đóng nhận dòng folio) | P3 | DOM/PO; BE-B, BE-A | DOM/PO chốt: đơn `cancelled`/`no_show` có nhận dòng không, vai nào. Hướng (a): `addFolioLine` trả 409 `INVALID_TRANSITION` cho đơn đã đóng (hoặc chỉ MGR+ kèm lý do). Hướng (b): ghi dòng vào đơn đã đóng thì chạy lại `refundPlan` (BR-522: yêu cầu chờ duyệt tự hủy, tạo lại đúng số). Số: cọc 2.000.000, hủy `found_other`, yêu cầu 2.000.000; dòng fnb 90.000 → (a) 409, totals giữ; (b) yêu cầu mới 1.910.000, chi đủ → `refunded`. Tuần Ổn định hoặc R3; không chặn cổng. |
| K11-07 (test và chú thích) | P3 | BE-A; BE-B | Sửa cùng K11-01. Thêm nhánh B18 số dư 0 không `finalPayment` vào ca đua `s438r4-money`, assert bất biến tiền. Sửa chú thích `minibar.service.ts` 364–365 theo thứ tự khóa thật. |
| K11-08 (vắng `periodId`) | Note | ARC; MOB | ARC quyết trước khi MOB làm màn đếm minibar HK (H16/H20.4). Không chặn cổng. |
| K11-09 (mốc R9 sau B13) | Note | DOM; ARC | DOM/ARC quyết B18 sau gia hạn có đòi lần đếm trong ngày đi mới không. Nếu đổi: sửa mốc R9, không sửa `periodId`. Không chặn cổng. |
| BUG-R2-159 (+ `k11lock:K11LOCK-04`) | P1 | BE-B | Sửa theo ARC 16.17 ở vòng 5. Thêm các ca `q-k11lock-3-0`, `q-k11lock-3-1` (5 biến thể ở bảng trùng mã) vào test 159. Truy vấn K2, K3 của 16.17 phải = 0 sau mỗi ca. |
| BUG-R2-163 (+ `k11lock:K11LOCK-05`, nâng P1) | P1 | BE-B (+ BE-C) | Sửa theo ARC 16.17 mục 2 (`state_transition.occurred_at` của `complete`). BE-C: `performedAt` < `hk_task.created_at` → 422. Số: d1 10:00 B14 202 → 203, đếm tủ cũ 202 dùng 2 bia (70.000), sinh T1. 10:05 giờ server HK xong T1 với `performedAt` 09:55 → 200. 12:00 đếm 203, B14 về 202. d2 09:00 đếm "bia còn 0" → kỳ `refill` mốc bia 2, 201, minibar [70.000, 70.000] = **140.000**; sau B18 có việc `{bia: 2}`; khách sau không bị tính. Đối chứng `performedAt` 10:05 (đang xanh). |

## Xu hướng

| Lượt | Commit | Phát hiện mới | Major (P1) mới | Do vòng sửa trước gây ra | Vùng sinh Major |
|---|---|---|---|---|---|
| 5 | ce90d19 | 11 | 5 (158…162) | 158, một phần 159, 163, 164 | minibar kỳ nạp, giá đêm kề |
| 5b | f04052d (#11, đích danh) | 9 + 2 trùng mã cũ | 3 (K11-01…03) + 163 nâng P1 | **K11-01** (4c); K11-04 mở rộng | khóa B18/folio, minibar định danh tủ, copy-on-write |

Nhận xét:
- #11 sửa đúng cả 3 đích, nhưng **mỗi thay đổi khóa mở bề mặt mới**. 4c đổi một deadlock P2 (169) thành mất tiền âm thầm P1 (K11-01) và chuyển deadlock sang bảng `room`.
- Minibar vẫn là vùng sinh lỗi chính. 3/4 lỗi minibar mới (K11-02, K11-03, K11-05) có từ trước #11; chúng lộ khi tấn công quanh khóa tủ.
- Kiểm đích danh có giá trị: ca "deadlock class" của BE-A xanh 3/3 mà không bắt được K11-01.

## Gaps

- K11-01 cùng lớp chưa chạy: `postFee` khi HK xong việc ‖ B18; dòng damage `pending_approval` trong cửa sổ B18; B9 đọc số dư trước khóa folio (`checkin.service.ts` ~758).
- K11-04: chưa quét tự nhiên cho B14 và HK đếm ‖ B18; B18 qua `addExtraNight` chưa ép. Trạng thái "4b đơn thuần" chỉ có một bản đối chứng (k11nokey).
- S4-09 `roomReturnRecorded` (`room_entered` qua đơn con) chưa chạy ở cả 3 hướng.
- Chưa đua: ba bên (lần nạp ‖ đếm ‖ B13), duyệt FOC ‖ lần nạp, `adjustFolioLine` ‖ B18, `onRefillDone` ‖ `onRefillDone`, copy-on-write ‖ `onRefillDone` / `onStayContinued`.
- Job hết hạn giữ chỗ (`FOR NO KEY UPDATE SKIP LOCKED`) đổi ngữ nghĩa; chưa dựng được ca.
- Không chạy E2E/UI Desk hay PWA, không chạy hàng đợi offline thật; `performedAt` giả lập qua API. Chưa kiểm header `Retry-After`, chưa kiểm Desk xử lý 409 `CONCURRENT_UPDATE` đúng lúc kỳ đổi.
- K11-03 (b) và K11-05 "có từ trước" dựa trên đọc mã. K11-02 chưa đo tần suất dưới tải.
- Vòng 5 chưa commit: critic chỉ đọc, chưa chạy.

## Khuyến nghị cổng QC Sprint 4 (riêng phần #11)

**CHƯA.** Riêng phần #11:
- 3 đích: 168 đóng được khi CI #11 xanh. Đua `record()` ‖ `onRefillDone` đạt. 169 giữ Fixed, chưa đóng.
- **G1 không đạt**: K11-01 (nợ 120.000–150.000 mất âm thầm, đua tự nhiên 39/72 và 43/48), K11-02 (thừa 70.000), K11-03 (70.000 cho 1 bia; B18 kẹt), 163 (thu thiếu 70.000 qua PWA hiện có).
- **G7 không đạt**: thêm 3 P1 (K11-01…03) và 163 nâng P1. Tổng P1 mở: 8.
- Điểm tốt: 3/3 đích có số; khóa tủ đúng phạm vi (đơn cha/con, hai tủ độc lập); 12 cặp đua dưới khóa tủ giống tuần tự; không có 500 nào; 40P01 luôn map về 409.

Điều kiện (gắn vào vòng 5 và gộp #12):
1. **K11-01 sửa trước tiên** (hồi quy mất tiền). Không kịp thì trả 4c về `FOR UPDATE` ở gộp #12 và mở lại 169 (P2). Không cấp ngoại lệ tiền.
2. K11-02, K11-03 sửa cùng vòng 5, có test oracle theo bảng trên. K11-03 kèm E2E UI "B14 giữa lượt → H16 hai tủ".
3. K11-04, K11-05 sửa cùng vòng 5, vì cùng `record()` / `lockFridge` đang viết lại cho 16.17. ARC sửa câu thứ tự khóa ở 16.17 bổ sung **trước khi** BE-B code tiếp.
4. 159, 163 sửa theo 16.17, kèm ca mới của `k11lock`.
5. ARC: quy tắc khóa folio trước khi đọc số dư; thứ tự đơn/căn → folio → việc → tủ; sửa (aa) "vẫn tuần tự hóa" và câu "bất biến 4 đã bảo đảm"; hợp đồng `roomId`/`periodId` (K11-03); quyết K11-08.
6. DOM: K11-09 (mốc R9 sau B13); K11-06 cùng PO.
7. QA: cấp số K11-01…07 (K11-08, 09 là Note); gắn `K11LOCK-04` vào 159, `K11LOCK-05` vào 163 và nâng 163 lên P1; giữ 169 ở Fixed; chuyển ca `q-k11*` cần thiết vào `test/integration/`. OPS/QA thêm hai truy vấn kiểm = 0: tủ có > 1 lần nạp `check_in` (K11-02); lần đếm sống mồ côi (K11-05).
8. Kiểm lại lần 6 (sau gộp #12) chạy lại `test/s438/k11*/` và `q-k11*/` trên commit gộp. Mục tiêu: 0 ca đỏ ngoài Note; `pg_stat_database.deadlocks` +0 ở mọi cặp đã liệt kê; quét tự nhiên B18 ‖ dòng folio 0 vi phạm tiền.

## Tệp

- Test người kiểm: `scratchpad/s438/wt11/product/services/api/test/s438/k11lock/`, `k11period/`, `k11nokey/`.
- Test người tái hiện: `scratchpad/s438/wt11/product/services/api/test/s438/q-k11lock-{0..4}-{0,1}/`, `q-k11period-{0..3}-{0,1}/`, `q-k11nokey-{0..3}-{0,1}/`.
- Log, bản đối chứng ce90d19, bản trả 4c, bản thử sửa: `scratchpad/s438/k11*/`, `scratchpad/s438/q-k11*/` (ví dụ `q-k11period-0-0/fix`, `q-k11nokey-1-1/ctl`, `q-k11nokey-0-1/ctrl`).
- `scratchpad` = `/private/tmp/claude-501/-Users-anhvh-Library-Application-Support-Claude-scratch-workspaces-00554cf2-3678-4864-82b0-830aaeaa97bd-4c0caebe-be05-49c5-a5a2-5bf357fddc6a-scratch-2026-10-15-c4f0d4/36df3adc-c586-471c-a039-340d2b696728/scratchpad`.
- Critic không viết test, không tạo DB ở lượt này.
