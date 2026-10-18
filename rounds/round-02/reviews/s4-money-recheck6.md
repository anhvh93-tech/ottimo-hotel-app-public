# Kiểm lại tiền S4-38 lần 6 – commit 723179b

Đây là lượt kiểm lại thứ sáu (ngắn, đích danh) của S4-38, Round 2 Sprint 4, tuần Ổn định. Lượt này chạy sau vòng sửa 5 (gộp #12, `3bd4ac4`) và vòng sửa 5b (gộp #13, `723179b`). Có 4 người kiểm: `r6fix`, `r6lock`, `r6rate`, `r6misc`. Họ kiểm 20 mã đích (BUG-R2-158…177) và toàn bộ mã tiền cũ 109…157. Họ báo 7 phát hiện mới. Mỗi phát hiện có 2 người tái hiện độc lập (`w-r6*`, 14 lượt). Mỗi người tự viết test, tự tính số từ BR v0.3.8 bản 18/10 (gồm phụ lục 5A, BR-703 ghi chú 7, BR-522-06), chạy trên PostgreSQL thật, DB riêng `ottimo_test_s438_r6*` / `wr6*`, bản sao cố định 723179b (`wt13`, src không sửa).

Test nằm ở `scratchpad/s438/wt13/product/services/api/test/s438/` (chưa track trong repo). Thư mục `r6*/` là của người kiểm, `w-r6*/` là của người tái hiện, `r6critic/` là của critic.

Ghi chú thời điểm:
- Báo cáo chấm commit **723179b** (gộp #13).
- Cây chính đã ở **8073a3d** (gộp #15), sau 7ac11a4 (gộp #14, BUG-R2-178). Critic đọc diff 723179b..8073a3d cho các gốc, không chạy:
  - `move-planner.ts` chỉ thêm `upgradedFromRoom` (BUG-R2-133) và bỏ đêm `lease_allocation`. Dòng truyền `stayView?.originRoomId ?? null` vẫn còn (nay dòng 505). Phát hiện giá MovePlanner còn nguyên.
  - `minibar.controller.ts`: `roomId`, `periodId` vẫn `.optional()`. `approvals/`, `frontdesk.module.ts`, 0067 không đổi.
  - `housekeeping.service.ts` thêm kiểm `complete` có `performedAt` < `started_at`. Chưa có kiểm `performedAt` < `hk_task.created_at`.
  - `stay-support.ts` đổi đường đọc giá (`RoomPriceCache` theo lệnh, S4-36). Lượt sau phải chạy lại fuzz `r6rate` trên commit gộp.
- Mốc BR: v0.3.8 bản 18/10, phụ lục 5A (AN-01…AN-47, bảng 5 bước giá đêm thêm), BR-703 ghi chú 7, BR-522-06. Mốc hợp đồng: `openapi-0.3.7.md` 16.17–16.19 (16.18 nguồn đêm, 16.19 thứ tự khóa L0–L5, ngoại lệ E1–E3, K11-01…K11-08) và `openapi.yaml` cùng commit. SEC: `s4-SEC-lateFee-reauth.md` mục 12.
- Số mã: đề bài ghi "đề xuất từ BUG-R2-178". Bug-list đã cấp 178…194 (178 = tủ căn tạm S4-09, Closed ở #14). Critic đề xuất từ **BUG-R2-195**. QA cấp số.

## Tóm tắt

- 20 mã đích 158…177: **20 ĐÃ SỬA**, có số. Riêng 163: phần tiền đã sửa, phần BE-C (P3) chưa làm. Riêng 164: sửa đúng cho dữ liệu 365486f, sót dữ liệu ghi bởi ce90d19/f04052d. **0 HỒI QUY** mã cũ 109…157.
- Hồi quy chung sạch: api 2.849/2.849 × 2 lượt. Bộ cũ 804 tệp (4.535 ca) × 2 lượt: 0 ca đỏ do lỗi mã mới. Ca đỏ còn lại đều là superseded, keep (133, Note) hoặc B6 × 2 (BUG-R2-178, đã sửa ở #14).
- 7 báo cáo, gộp còn **6 phát hiện**: R6RATE-01 và R6RATE-02 cùng một dòng mã.
  - **1 Major-fix-now** (P1, sai tiền): đề xuất BUG-R2-195.
  - 2 Minor P2 có lệch tiền, **bắt buộc trước cổng**: 196 (server chưa bắt buộc `roomId`/`periodId`), 197 (0067 bỏ sót tủ bị 164 làm hỏng).
  - 1 Minor P2 không lệch tiền: 198 (deadlock duyệt trả muộn).
  - 1 Minor P3: 199 (phần BE-C của 163).
  - 1 **CLOSED-not-real**: R6FIX-02.
- 14 lượt tái hiện đều tái hiện được hành vi. 12 lượt xác nhận lệch quy tắc. 2 lượt kết luận không lệch quy tắc (R6FIX-02 × 2).
- Critic không đổi mức phát hiện nào. Critic gộp R6RATE-01 + 02 và đóng R6FIX-02.
- Critic chạy lại một lần (DB `ottimo_test_s438_r6critic`): 29 ca, 20 xanh, 9 đỏ. 9 ca đỏ đúng 4 phát hiện còn mở (195, 196, 198, 199).
- **Bảo mật**: không có lỗ hổng P1/P2 mới. 165, 167 đã sửa; 166 đóng theo SEC 12.2. Vượt kiểm soát A19 qua đua (171) đã đóng. SEC nên biết: 196 là lệch giữa hợp đồng và kiểm đầu vào phía server.
- Xu hướng Major: 11 → 6 → 5 → 3 → 5 → 3 → **1**. Lần đầu kể từ lượt 2: **0 hồi quy do vòng sửa**. Minibar lần đầu 0 P1 sau 6 lượt. **Đang hội tụ.**
- **723179b chưa đạt G1, G7**: còn 1 P1 sai tiền (195) và 2 đường lệch tiền P2 (196, 197). Đóng 195, 196 và xử lý 197 là đủ để vào cổng có điều kiện.

## Kết quả từng hướng kiểm

**r6fix** (đích danh 158…177, hồi quy toàn bộ):
- api toàn bộ (bỏ `test/s438`), mỗi lượt một DB mới: 90/90 tệp, 2.849/2.849 ca × 2. Không ca chập chờn.
- Bộ cũ `test/s438` (bỏ `r6*`, `s6*`) chép sang `r6fix/old`: 804 tệp.
  - Lượt 1: 4.535 ca, 3.872 đạt / 477 đỏ / 186 skip. 477 đỏ = 265 superseded + 32 keep + 180 NEW.
  - 180 NEW: 89 ca chỉ do hợp đồng `roomId` (K11-03, xử lý bằng shim `_shim/contract-r6.ts`, có log từng lần); 89 ca kỳ vọng cũ hoặc test sai (51 tệp chép sang `r6fix/fixed`, có chú thích `r6fix`); 2 ca B6 (BUG-R2-178). **0 ca lỗi mã mới.**
  - Lượt 2 (shim + 51 tệp sửa, song song): 4.515 ca, 3.829 / 319 đỏ / 367 skip. Máy quá tải (load ~13, 78 phút thay 11). Chạy lại tuần tự 73 tệp liên quan: chỉ còn B6 × 2, 28 superseded, 7 keep.
  - Chạy tuần tự 51 tệp `fixed`: chỉ còn B6 × 2 và 5 superseded.
- Migration 3 pha thật (365486f → ce90d19 → 0067–0069 của 723179b): tiền 9 lượt không đổi qua migrate. 0067 (a)(c), 0068 đúng. RAISE đúng cho `dup67`, `dup69` (rollback, 44 → 44 bản ghi). K1 = 1 → R6FIX-01.
- Test mới `r6fix/new/k1105` (K11-05, 2 kết nối thật, holder folio): 12/12 giống tuần tự, minibar 70.000, 0 deadlock.
- Tấn công: R6FIX-01, R6FIX-02.

**r6lock** (quy tắc khóa 16.19):
- 7 tệp `r6lock/`, 36 ca, lượt cuối chạy nối tiếp: 32 đạt, 4 hỏng (đều R6LOCK-01).
- Mỗi ca đua: 2 kết nối thật, bên thứ ba giữ khóa thật, đếm waiter qua `pg_blocking_pids`, hai thứ tự × 3 vòng, đối chứng tuần tự trên lượt mới. Oracle tiền gồm status, `checkout_mode`, folio, due/paid/total/credit, từng dòng, từng payment.
- `pg_stat_database.deadlocks`: 22 bộ đếm +0. Chỉ 4 bộ của R6LOCK-01 khác 0.
- B18 ‖ `addFolioLine`, `adjustFolioLine`, FOC tự duyệt, `recordPayment`, `createVietQr`, `confirm-received`, `reversePayment`, duyệt damage: giống tuần tự. Tự nhiên B18 ‖ payment 9/9 không thu hai lần.
- B9 ‖ dòng, B9 ‖ payment: giống tuần tự. `record()` ‖ B13/B14/B18/`onRefillDone`/copy-on-write: giống tuần tự; quét tự nhiên 41 lượt, deadlocks +0.
- Rà mã theo bảng 16.19: B5, B11, B12, B7, thanh toán, J24, `record()` khớp. Lệch: quyết định `late_checkout_conflict` (L4 → L1).
- Tấn công: R6LOCK-01.

**r6rate** (bảng quyết định giá đêm thêm, phụ lục 5A):
- Hàm tham chiếu độc lập `ref.ts` viết chỉ từ `business-rules.md` và lịch DS-E. Lịch khớp `stay_night.calendar_rate_vnd` của 10 căn.
- Fuzz có hạt giống, PostgreSQL thật: seed 20261018 × 220 chuỗi (2.805 phép so) và seed 424242 × 120 chuỗi (1.630 phép so). Tổng 340 chuỗi / 4.435 phép so, 0 lỗi chạy. **15 chuỗi lệch, đều là MovePlanner trên đơn thỏa thuận.**
- Mỗi bước so: B9a (giá, sàn, trần, trần QR, ghi), B13 (`nights`, `currentBookingRateVnd`, đêm đã ghi), MovePlanner (từng đêm, delta, ghi = xem trước), B18 (`extraNight*`, trần QR, ghi), `lateFeeAsNightVnd`, nguồn đêm và `anchorRoomId` (ARC 16.18): 0 khác biệt ngoài MovePlanner.
- `min.test.ts` 11 ca: MP-1/2/3 đỏ; MP-4, MP-c, LANE, AN-11, AN-12, AN-25, mép khoảng r5-3, AN-47 (a) xanh. Bộ cũ `r6rate/old` (12 tệp) 88/88.
- Đối chứng f04052d (`wt11`): MP-1/2/3 cùng số.
- Tấn công: R6RATE-01, R6RATE-02.

**r6misc** (K11-03, K11-06, K11-08, K11-09, 163, 165, 167, 170):
- 9 tệp, 48 ca, 2 lượt đầy đủ: 45 xanh, 3 đỏ (R6MISC-01 × 2, R6MISC-02 × 1).
- 170: hơn 1.000 hồ sơ mở cũ + 400 hồ sơ mới đã kết thúc. "Cần khai báo" 104 trang × 7 dòng = 722 dòng, đủ 2 khách mới, không trùng, không lẫn hồ sơ đã kết thúc. Hạn quá riêng VN 21:00, nước ngoài 03:00.
- 173: B14 một lần và hai lần, dò `periodId` tủ khác, lượt khác, tổ chức khác, `null` cũ: đều 409. Đua 2 kết nối × 3 vòng khớp tuần tự. K1–K4 = 0.
- 176: 4 vai × fnb/damage/penalty vào đơn `cancelled`/`no_show` → 409; chi đủ 2.000.000.
- K11-09: not_today đúng oracle BR-703-03; cửa sổ sau nửa đêm đúng.
- 165/167: 8 thân tấn công mới × mật khẩu sai/đúng: cùng Problem, bộ đếm [0, 0], 0 audit; 167 có `reauth_succeeded` + thông báo.
- Tấn công: R6MISC-01, R6MISC-02.

## Trạng thái mã

| Mã | Mức | Trạng thái ở 723179b | Bằng chứng có số | Ghi chú |
|---|---|---|---|---|
| BUG-R2-109…122, 124…132, 134…157 | P1–P3 | ĐÃ SỬA, **0 hồi quy** | r6fix: 804 tệp cũ × 2 lượt; ca đỏ đều superseded, keep hoặc B6. Không ca nào của 109…157 đỏ do mã. | Không đổi trạng thái. |
| BUG-R2-123 | P3 | CHƯA SỬA (không kiểm lượt này) | – | Tuần Ổn định. |
| BUG-R2-133 | P3 | CHƯA SỬA | 13 ca keep vẫn đỏ đúng chỗ. | 8073a3d thêm `upgradedFromRoom`. Lượt 7 kiểm. |
| BUG-R2-158 | P1 | ĐÃ SỬA | `minibar-m1` "BUG-R2-158 (A1)" xanh × 2 (DB mới). `r5mini-attack` A1 xanh × 2. `q-k11period-1-0` C1/C2: 1 `check_in`, B18 200, 70.000. | Ca A1 đã vào test chính thức. QA đóng. |
| BUG-R2-159 | P1 | ĐÃ SỬA | `minibar-m1` ca 21–25 × 2. `z-r5old-0-0` Z1b: đếm tủ 202 hai lần → 1 việc `{bia: 2}`; về 202, HK xong, uống 1 → 105.000. `q-k11lock-3-1` E × 3: 1 việc, mốc bia 2, 201. Y1b/Y3/B3: 140.000 / 105.000 / 105.000. | Kỳ vọng đổi: HK xong qua API, không còn việc thứ hai. |
| BUG-R2-160 | P1 | ĐÃ SỬA | AN-10 × 2: 911.000, tổng 4.095.000; căn tạm 302 → folio 4.220.000. `z-r5rate-0-1` C1/C2/Z1–Z3 xanh khi chạy cô lập. r6rate AN-11: 911.000 = trần QR = ghi. Fuzz 21 chuỗi S4-09 × OTTIMO: 0 lệch. | Ca đỏ ở lượt 2 song song là hết giờ do quá tải. |
| BUG-R2-161 | P1 | ĐÃ SỬA | AN-34 × 2: 650.000, tổng 2.980.000, `currentBookingRateVnd` 650.000. `z-r5rate-1-1` A/B/D/E xanh. Fuzz đêm đặc biệt đầu/giữa/cuối: 0 lệch. | Oracle ca C sửa: 2.870.000. |
| BUG-R2-162 | P1 | ĐÃ SỬA | AN-22/AN-43 × 2: 792.000, tổng 3.168.000. AN-35: 1.000.000, tổng 3.667.000. Chiều ngược 911.000 / 3.644.000. Fuzz: nguồn đêm và `anchorRoomId` 0 khác biệt. | Kỳ vọng đổi theo ARC 16.18. |
| BUG-R2-163 | P1 | ĐÃ SỬA **phần tiền**; phần BE-C CHƯA | `minibar-m1` ca 26 × 2. `q-k11lock-4-1` 3/3: máy chậm (09:55) = đối chứng 10:05, [70.000, 70.000]. r6misc và critic: 140.000; máy nhanh [35.000, 70.000]. `performedAt` 09:55 < `created_at` 10:00 vẫn 200. | Phần BE-C tách thành 199 (P3). QA đóng 163. |
| BUG-R2-164 | P2 | ĐÃ SỬA cho dữ liệu 365486f | Migration 3 pha thật: M1c 70.000, M2 35.000, B18 200. `r5mini` A2 có bước 0067 thật: 70.000. `minibar-m1` "BUG-R2-164 (0067, two phases)" × 2. | Sót dữ liệu đã xác nhận lại trên ce90d19/f04052d → 197. |
| BUG-R2-165 | P3 (SEC) | ĐÃ SỬA | `s438r5-money` 165 × 2. `r5late-sec` A5: If-Match cũ → 412 trước mật khẩu, 0/0. `z-r5late-2-0`: 412 và 422 (`bitcoin`) trước mật khẩu. r6misc 8 thân mới: [0, 0], 0 audit. | Theo SEC 12.1. |
| BUG-R2-166 | P3 (SEC) | ĐÃ ĐÓNG theo SEC 12.2 | Mật khẩu sai khi B18 đầu còn chạy → 401, đếm +1/+1, có audit (M6 × 2, Z1, Z1.1/Z1.2). Mật khẩu đúng → 409 `IDEMPOTENCY_IN_PROGRESS`, không ghi trùng, bộ đếm về 0. Lần ba → 200 replay. | Kỳ vọng đổi theo SEC 12.2. |
| BUG-R2-167 | P3 (SEC) | ĐÃ SỬA | `s438r5-money` 167 × 2. Mật khẩu đúng rồi 409/403/422 → audit `reauth_succeeded` + thông báo. MGR tự xác nhận → 0 audit. | Theo SEC 12.3. |
| BUG-R2-168 | P1 | ĐÃ SỬA | `k11period` 29/29 cô lập: A1/A2/B1/B3 → 409, tải lại → 201, 35.000 + 35.000. `minibar-m1` (ab)/(ac) × 2. | – |
| BUG-R2-169 | P2 | ĐÃ SỬA | Cơ chế gốc không tái hiện. `k11period` D2 × 3: 200/201/201. `pg_stat_database.deadlocks` = 0 ở mọi DB r6fix; 22 bộ đếm r6lock +0. | Deadlock của 198 là cơ chế khác. QA đóng 169. |
| BUG-R2-170 | P2 | ĐÃ SỬA | `registration-open-cap` 5/5 × 2; r6misc `reg170` 4/4 × 2 (722 dòng). | Đã Closed (CI 2b134fb). |
| BUG-R2-171 | P1 | ĐÃ SỬA | r6lock `b18-folio`: Q (dòng ‖ B18, 2 thứ tự × 3) = tuần tự; W → 409 `BALANCE_DUE`; P → dòng chờ, B18 200, dòng `post_checkout`; N 16 lượt 0 vi phạm. `nokey-b18` A0–A2, `q-k11nokey-3-1` × 3, `s438r5-money` × 2. | Đóng cả vượt kiểm soát A19. |
| BUG-R2-172 | P1 | ĐÃ SỬA | `q-k11period-1-0` R/U/O/C và `1-1` R/V: 1 `check_in`, 70.000, 1 việc. `k11period` D5/D6 × 3. 0069 RAISE trên `dup69`. r6lock `cow`: 12 lượt tự nhiên 0 sai. | R6FIX-02 không phải lỗi. |
| BUG-R2-173 | P1 | ĐÃ SỬA | Có `periodId` mà vắng `roomId` → 422. r6misc K11-03 5/5 × 2. `k11lock scope` 3/3: đếm lại 202 → 35.000. FE `s4-144-fea` 10/10 (mock). | Desk E2E: QA đã kiểm (bug-list 11.22). Phần K11-08 chưa thực thi → 196. |
| BUG-R2-174 | P2 | ĐÃ SỬA | `q-k11nokey-1-0` S1/S2, `1-1` A/B = tuần tự; N-B18/N-B13 20 + 20 vòng, 0 deadlock. `q-k11lock-0-1` (a) × 3: 12/12, 0 deadlock. r6lock `minibar` 41 lượt +0. | – |
| BUG-R2-175 | P2 | ĐÃ SỬA | `r6fix/new/k1105` 12/12. r6lock ca 175 × 3: (a) 201 vào tủ 202, 1 việc `{bia: 2}`; (b) client cũ → 409, tủ 302 0 lần đếm. | – |
| BUG-R2-176 | P3 | ĐÃ SỬA | `q-k11nokey-2-0/2-1`: 409 `INVALID_TRANSITION`, credit 2.000.000, chi đủ 2.000.000. `approvals-refund-payout` × 2. r6misc 4 vai, đua × 3. | Theo BR-522-06. |
| BUG-R2-177 | P3 | ĐÃ SỬA phần test | `s438r4-money` "deadlock class" có oracle tiền, xanh × 2. | Chú thích `record()` chỉ đọc mã. |
| BUG-R2-178 | P2 | Còn ở 723179b (B6 × 2 đỏ đúng chỗ) | – | Đã sửa ở #14, Closed (TC-L4-124). Lượt 7 chạy lại B6. |

## Critic chạy lại

Không mã đích nào bị báo CHƯA SỬA. Critic chạy **một lần** các ca đỏ còn lại (phần BE-C của 163) và các ca của phát hiện mới, để xác nhận trên DB riêng.

- Cây `wt13` @ 723179b, src không sửa. DB mới `ottimo_test_s438_r6critic` (`newdb.sh`). `vitest run --no-file-parallelism`, 52 giây.
- 4 tệp, 29 ca: **20 xanh, 9 đỏ**. 9 ca đỏ đúng các ca người báo đã đếm.
- `r6critic/rate-min.test.ts` (bản chép `r6rate/min.test.ts`, chỉ đổi thư mục ghi số): 11 ca, 3 đỏ.
  - MP-1 (202 thỏa thuận 650.000, khách xin +1 giữ 202): đêm thứ Tư **792.000**, delta 792.000. Đúng 650.000.
  - MP-2 (OTTIMO 202 → 401 kèm +1): **792.000**. Đúng min(650.000; 1.042.000) = 650.000. Đơn sinh đôi B13 cùng đêm: 650.000, keep 650.000, khoảng 530.000–2.630.000.
  - MP-3 (102 thỏa thuận 900.000, khách xin +1): **750.000**. Đúng 900.000.
  - Xanh: MP-4 650.000; MP-c 792.000; AN-11, AN-12, AN-25, mép khoảng r5-3, AN-47 (a) 917.000.
- `r6misc/k1103.test.ts`: 7 ca, 2 đỏ.
  - Vắng cả hai trường → 201; chỉ có `roomId` → 201. Đúng 422 `REQUIRED`.
  - Tiền: có `periodId` kỳ `carry` → 409 (đúng). Vắng `periodId` → 201, minibar **[35.000, 35.000]**. Đúng [35.000].
  - 5 ca K11-03 xanh: mọi đầu dò `periodId` sai → 409.
- `r6misc/k1109-hk163.test.ts`: 5 ca, 1 đỏ.
  - `performedAt` 09:55 trước khi T1 tồn tại (10:00) → **200**. ARC 16.17 mục 2 đòi 422.
  - Tiền đúng: mốc bia 2, minibar [70.000, 70.000] = 140.000. Máy nhanh: đếm lại 409, [35.000, 70.000]. Ngoài khoảng ± → 422 `PERFORMED_AT_OUT_OF_RANGE`. K11-09 2 ca xanh.
- `r6lock/approval-order.test.ts`: 6 ca, 3 đỏ.
  - Ép "B18 xếp trước" ‖ approve: deadlocks **+3**. Ép "B13 xếp trước": **+3**.
  - Tự nhiên B13 ‖ approve: +1, nạn nhân là B13 (409 `CONCURRENT_UPDATE` → gửi lại 412). Tự nhiên B18 lượt này +0 trên 9 lượt.
  - Thứ tự ép "approve trước" của r6lock: +0. Wrong 0 ở mọi lượt.

Critic đọc lại mã 723179b cho các gốc. Mã khớp mô tả:
- `reservations/internal/move-planner.ts` 493–499: `referenceNightRate(…, bought, stayView?.originRoomId ?? null, special)`. B13 (`frontdesk/internal/stay-support.ts` ~234) dùng `view.originRoomId ?? roomId`.
- `inventory/internal/minibar.controller.ts` 33–35: `roomId` và `periodId` `.optional()`. `minibar.service.ts` 359 chỉ chặn "có `periodId` mà vắng `roomId`"; 371 `if (input.periodId === undefined) return;`. `openapi.yaml` 11202: `required: [mode, lines, roomId, periodId]`.
- 0067 (88–101): câu UPDATE gán kỳ bỏ qua lần đếm khi đã có lần đếm sống khác cùng kỳ (`NOT (… EXISTS …)`), không báo. Bước (b) (42–55) chỉ đếm lần đếm sống `fill_id` NULL.
- `approvals.onBeforeDecide` chỉ đăng ký ở `folio.module.ts` 156. `late_checkout_conflict`, `no_show_restore`, `refund`, `quote_extension` chỉ có `onDecided`.

## Critic – phân xử phát hiện mới

| Mã | Kết luận | Mức | Ai sửa | BUG đề xuất | Lý do |
|---|---|---|---|---|---|
| R6RATE-01 + R6RATE-02 (gộp): MovePlanner (B7) bỏ qua đêm tham chiếu của đơn thỏa thuận **chưa từng đổi căn**: đêm thêm lấy lịch căn khách mua. Gặp cả OTTIMO đổi căn kèm thêm đêm (AN-46) lẫn khách xin dời/kéo dài giữ căn (AN-47 (b)) | **Major-fix-now** | P1 | BE-A (+ DOM/ARC câu chữ, QA dòng oracle) | BUG-R2-195 | 4/4 tái hiện, đều P1; critic chạy lại: đỏ 3/3. Thừa 142.000/đêm (650.000 → 792.000), thiếu 150.000 (900.000 → 750.000), thiếu 108.000 (900.000 → 792.000), thừa 305.000 (seed2 seq 103). Tiền ghi thật vào folio. Xem trước = ghi nên không phải P0. B7 không có ô giá từng đêm, lễ tân chỉ sửa được sau bằng S4-35. Cùng một lượt có đêm 650 / 650 / 792 / 650. Trái phụ lục 5A AN-46 ("MovePlanner = B13"), AN-47 (b), bước 3, AN-02, AN-05; oracle BR-417-13 `sameInMovePlannerAndB13`. Gốc: `origin_room_id` NULL khi đơn chưa đổi căn, B1 không ghi `anchorRoomId`, MovePlanner truyền `null` làm căn gốc nên `(anchor ?? origin) === bought` luôn sai. Đối chứng F của người tái hiện (OTTIMO 202 → 203 → 202, cùng trạng thái CKM/CĐT) ra 650.000: giá phụ thuộc cột lưu trữ có giá trị hay không. **Gộp** vì cùng một dòng mã, một bản sửa đóng cả hai. Không hồi quy (f04052d cùng số). Là **sửa chưa đủ** của vòng 5 (3bd4ac4 thêm phần tìm đêm tham chiếu) và 5b (r5-5 đổi điều kiện nhưng giữ `?? null`). |
| R6MISC-01: `recordMinibarCheck` vẫn nhận lần đếm thiếu `periodId` (và thiếu cả hai trường) → 201, mở lại đường thu thừa của BUG-R2-168 | Minor – **bắt buộc trước cổng** | P2 | BE-B (+ ARC xóa câu K11-03 cũ; QA đổi ca) | BUG-R2-196 | 2/2 tái hiện, đều P2; critic chạy lại: đỏ. FD và HK, vắng cả hai hoặc chỉ `roomId`: 8/8 → 201. Kịch bản kỳ `carry` → HK nạp → gửi bản soạn trên kỳ cũ: minibar [35.000, 35.000], B18 thu 70.000 (đúng 35.000), 6/6. Cùng thân có `periodId` → 409 (đúng). Trái `openapi.yaml` cùng commit (`required: [mode, lines, roomId, periodId]`), ARC 16.19 K11-08 ("từ #13 bắt buộc với mọi vai"). Giữ P2: Desk #13 gửi đủ, PWA HK chưa có màn đếm. Đường vào: gọi API tay, tab Desk mở từ trước #11, màn đếm HK của MOB sau này. **Bắt buộc trước cổng** vì là đường lệch tiền và sửa chỉ là kiểm khuôn. Nâng P1 nếu màn đếm HK ra trước bản sửa. Không do vòng sửa: nhánh cũ còn sót; BE-B ghi chưa làm (`s4-be-b.md` 486). |
| R6FIX-01: 0067 bỏ sót tủ đã bị BUG-R2-164 làm hỏng trên ce90d19/f04052d: không RAISE, K1 ≠ 0, B18 thu minibar hai lần | Minor – **bắt buộc trước cổng** (sửa hoặc OPS chứng nhận) | P2 | BE-B (migration mới) + ARC (16.17 mục 3) + OPS/DATA | BUG-R2-197 | 2/2 tái hiện, đều P2; 7/7 lượt pipeline (pha 2 bằng ce90d19 và bằng f04052d). Tủ xác nhận lại cùng số trên ce90d19: K1 = 1–2, B18 thu 140.000 (đúng 70.000); đếm số mới 1 → 105.000 (đúng 35.000). Tóm tắt trả phòng không chặn. Sau B18 còn 2 việc mở mỗi tủ, HK nạp thừa. Sau B18, K1 = 0 vì K1 chỉ xét lượt `in_house`: dấu vết mất. Trái ARC 16.17 mục 3 ("sau 0067, K1–K3 = 0"), chính sách 0067 (b) ("không tự sửa tiền, RAISE kèm danh sách"), BR-702/BR-703. **Đính chính cơ chế** (cả hai người tái hiện): lần nạp `check_in` của ce90d19 có `filled_at` = lần đếm đầu − 1 ms, nên có hiệu lực; điều kiện chặn của câu UPDATE bỏ qua lặng lẽ. Chỉ xảy ra với dữ liệu đã chạy qua ce90d19…8819c2d có đếm lại. Theo tiền lệ 147 và 164: không dựa vào việc "chưa có dữ liệu thật". Không do 723179b. |
| R6LOCK-01: duyệt/từ chối/hủy yêu cầu `late_checkout_conflict` khóa `approval_request` (L4) trước đơn (L1); song song với B18 hoặc B13 → 40P01, 409 `CONCURRENT_UPDATE` sau ~1 s | Minor | P2 | BE-A (frontdesk preLock) + BE-B (`ApprovalService`) + ARC (bảng 16.19) | BUG-R2-198 | 2/2 tái hiện, đều P2; critic chạy lại: +3/+3/+1. Ép xen 6 ca × 3 vòng: deadlocks +3 mỗi ca, cả hai lượt. Tự nhiên: 21/44 và 14/44 lượt (người 1); 2/9, 4/9, 3/9 (người 2). Log PG 27 dòng "deadlock detected" = 27 lần 409. Nạn nhân có khi là B18/B13 (409 → gửi lại 412, Desk phải tải lại). **Bổ sung so với báo cáo gốc**: thứ tự "approve bắt đầu trước" cũng deadlock 3/3 nếu approve chưa UPDATE xong đơn. Wrong 0 ở mọi lượt: không lệch tiền. Trái ARC 16.19 ("mọi lệnh theo chiều L1 → L5, không có ngoại lệ nào khác ngoài E1–E3"). Đối chứng của người tái hiện: đăng ký `onBeforeDecide` khóa đơn trước → 8/8 xanh, +0. P2 nhất quán với 169, 174. Có từ Sprint 3 (789ac90), không do vòng sửa. |
| R6MISC-02: HK complete/start chấp nhận `performedAt` sớm hơn lúc việc được tạo → 200 | Minor | P3 | BE-C | BUG-R2-199 | 2/2 tái hiện, đều P3; critic chạy lại: đỏ. 3/3 lần 200; biên −1 s → 200; `start` −5 phút → 200; mọi loại việc HK (cả `adhoc_clean`). Tiền đúng 140.000 vì thứ tự kỳ dùng giờ xử lý. Trái ARC 16.17 mục 2 (việc BE-C kèm 163) và recheck5b ("`performedAt` < `hk_task.created_at` → 422"). `transitionRoomStatus` đã có mẫu kiểm tương tự. 8073a3d chỉ thêm kiểm `complete` < `started_at`, chưa đủ. QA đóng 163 (phần tiền), mở 199 cho phần BE-C. |
| R6FIX-02: lần đếm `periodId: null` nhận 201 khi copy-on-write chưa commit đã ghi `check_in` trước (tuần tự thì 409) | **CLOSED-not-real** | – | ARC thêm một câu vào (ac) | – | 2/2 tái hiện hành vi, cả hai not-a-bug. 18/18 và 9/9 lần 201, tiền đúng ở mọi thứ tự (1 `check_in`, giá trước khi sửa, 70.000, 1 việc, B18 200). ARC 16.19 K11-02 chủ ý cho copy-on-write không lấy L5 và "lần đếm dùng `fill_id` của lần nạp thắng"; ca chuẩn K11-02 (lần đếm `null` ‖ POST /items, hai thứ tự) kỳ vọng 201, không có bước 409. Test của BE-B (`minibar-m1` 2006) khẳng định [201, 201]. Đọc kỳ sau L5 đúng quy tắc đọc; lúc đó lần nạp chưa commit nên "chưa có". Kết quả đua trùng thứ tự tuần tự "đếm trước", chỉ khác `minibar_fill.created_by` (không đường nào đọc). ARC (ah) gọi 409 ở đây là "một lần tải lại thừa". |

Phân loại bảo mật cho SEC:
- Không có lỗ hổng xác thực, phân quyền hay lộ dữ liệu mới.
- Đã đóng: 165 (lỗi khuôn và 412 trước mật khẩu), 167 (dấu vết khi mật khẩu đúng), 166 (theo SEC 12.2). Vượt kiểm soát A19 qua đua (171): đã đóng, r6lock 0 vi phạm.
- SEC nên biết, không phải lỗ hổng:
  - **196**: server không thực thi hợp đồng bắt buộc của `recordMinibarCheck`. Người dùng FD/HK đã đăng nhập gọi API tay là bỏ qua được chốt chặn kỳ (ab), làm folio khách bị tính thừa. Có dấu vết (lần đếm, dòng folio, audit). Đề nghị SEC thêm "kiểm khuôn server = `required` của yaml" vào checklist review.
  - **199**: dữ liệu truy vết HK có giờ làm sớm hơn giờ tạo việc (trong khoảng 24 giờ). Không ảnh hưởng tiền. Ảnh hưởng tính tin cậy khi đối soát.
  - **198**: chỉ ảnh hưởng tính sẵn sàng (409, tải lại); không dùng được để đổi tiền.

## Major-fix-now theo gốc (danh sách sửa cho BE)

| BUG đề xuất | Phát hiện | Ai sửa | Chỗ sửa (723179b) | Số đúng cho test |
|---|---|---|---|---|
| BUG-R2-195 | R6RATE-01 + R6RATE-02 | BE-A (+ QA, DOM/ARC câu chữ) | `reservations/internal/move-planner.ts` 493–499 (8073a3d: 505): căn gốc truyền cho `referenceNightRate` dùng **cùng dự phòng như B13** (`view.originRoomId ?? căn hiện tại`), hoặc dùng căn gốc đã tính ở `originRoom(...)` (~425). Tốt hơn: tách **một hàm** tính (CKM, CĐT, căn gốc, đêm tham chiếu, khoảng) cho B9a, B13, B18, `lateFeeAsNightVnd` và MovePlanner, để không còn hai cách dự phòng. Không dựa vào việc B1 ghi `anchorRoomId` (đơn cũ không có). | **A / MP-1** (AN-47 (b)): Trực tiếp 202, thỏa thuận 650.000 × 2, 01–03/10/2029 (thứ Hai–thứ Tư). B7 `guest_request` departure 04/10, giữ 202: đêm thứ Tư = xem trước = `folioDeltaVnd` = ghi = **650.000**; folio 1.300.000 → **1.950.000**. **MP-2** (AN-46): cùng đơn, B7 `property_fault` → 401 kèm +1: **650.000** = min(650.000; 1.042.000); ghi với `expectedDeltaVnd` 650.000 → 200. **MP-3**: 102 thỏa thuận 900.000 × 2, khách xin +1: **900.000**. **E**: thỏa thuận 900.000, OTTIMO → 401 kèm +1: **900.000**. **D**: dời ngày giữ căn 12–14/11 → 13–15/11: đêm thêm **650.000**, delta **0**. Bất biến: MovePlanner = B13 trên cùng trạng thái (BR-417-13, BR-417-16 AN-46). Đối chứng (đang xanh): MP-4 650.000; F (OTTIMO 202 → 203 → 202 rồi khách +1) 650.000; MP-c lịch 792.000; AN-47 (a) 917.000. Fuzz `r6rate` hai seed: **0 chuỗi lệch**. |

Việc chung:
- Chuyển ca `w-r6rate-0-*`, `w-r6rate-1-*` và `r6rate/min.test.ts` MP-1…MP-4, MP-c vào `test/integration/`.
- Oracle mới trong `br-examples.json`: dòng biến thể "đơn thỏa thuận × lần đổi căn đầu tiên" cho AN-46 và AN-47 (b) (A, MP-2, MP-3, E, D, F ở trên).
- Đưa fuzz `r6rate` (hàm tham chiếu độc lập + 2 seed) vào CI hằng đêm (T9). Đây là test bắt được lỗi này; bảng 47 dòng thì không.

## Minor, Note và GAP-DOM – kế hoạch

| Mã | Mức | Ai | Kế hoạch |
|---|---|---|---|
| BUG-R2-196 (R6MISC-01, `periodId`/`roomId` bắt buộc) | P2, **trước cổng** | BE-B; ARC; QA | `minibar.controller.ts` `checkSchema`: `roomId` bắt buộc, `periodId` bắt buộc và `nullable` → thiếu 422 `REQUIRED`. `minibar.service.ts` `record()`: bỏ nhánh 371 "vắng = không so"; `fridgeOf` (165): bỏ "vắng = căn đang gán". Sửa ca K11-05 "client cũ" của `minibar-m1` sang 422. ARC xóa câu K11-03 "vắng cả hai (client cũ) → căn đang gán (quy tắc cũ)" ở 16.19 (mâu thuẫn K11-08). QA: 89 ca dùng shim `contract-r6.ts` chuyển sang gửi đủ hai trường. Số: FD/HK × (vắng cả hai, chỉ `roomId`) → **422**, 0 lần đếm. Kịch bản kỳ `carry` (202, d0–d3; d1 B14 202 → 203, đếm 202 dùng 1; d2 về 202; 09:30 soạn "còn 1"; 09:40 HK xong T1; 09:45 gửi): thiếu `periodId` → **422**; có `periodId` → 409, tải lại → 201; B18 thu **35.000**. |
| BUG-R2-197 (R6FIX-01, 0067 bỏ sót) | P2, **trước cổng** | BE-B; ARC; OPS/DATA | Migration mới (ORC cấp số; 0070 đã dùng cho BE-73): `RAISE EXCEPTION` kèm danh sách tủ khi một tủ có hơn 1 lần đếm sống `checkout` ở mọi kỳ mà trong đó có lần đếm `fill_id` NULL; hoặc chạy K1 trong giao dịch, K1 ≠ 0 → RAISE. Không tự sửa tiền (chính sách 0067). ARC 16.17 mục 3: chốt cách xử lý tay cho dạng "1 lần đếm NULL + 1 lần đếm kỳ `check_in`" (void dòng của lần đếm NULL, hủy việc thừa). Thêm ca 3 pha 365486f → ce90d19 (xác nhận lại cùng số) → bản mới, và biến thể f04052d, vào test migration. Số: tủ 402 → migrate **RAISE** liệt kê 402; dữ liệu chỉ đếm bằng 365486f → không RAISE, B18 **70.000**. **Lối thay thế**: OPS/DATA ghi decision-log: liệt kê mọi môi trường từng chạy ce90d19…8819c2d, K1–K4 = 0 trên từng môi trường trước khi nhận tải; khi đó 197 được mở tới tuần Ổn định. |
| BUG-R2-198 (R6LOCK-01, duyệt trả muộn L4 → L1) | P2 | BE-A, BE-B; ARC | `frontdesk.module.ts`: đăng ký `approvals.onBeforeDecide` cho `late_checkout_conflict`, khóa đơn đích `FOR NO KEY UPDATE` trước dòng yêu cầu (một chỗ phủ approve/reject/cancel). Sửa theo cấu trúc: `ApprovalService` đòi mỗi loại có `onDecided` ghi đơn/folio phải có preLock; một test liệt kê các loại đã đăng ký và kiểm có preLock. ARC thêm dòng "quyết định yêu cầu vận hành: L1 → L3 → L4" vào bảng 16.19, rà `no_show_restore`, `refund`, `quote_extension`. Số: 302 ở d0 → d1, 402 có khách, 302 có khách đến d1; B15 14:00 `requestApproval` → 202. d1 10:00, hai thứ tự × 3 vòng: B18 trước → 200, approve **409 `INVALID_TRANSITION`**, đơn `checked_out`, yêu cầu `cancelled`, total 917.000, due 0. Approve trước → 200, B18 **412**, agreed 14:00, due 0. B13 trước → 2 đêm 1.834.000, due 917.000. Deadlocks **+0**, 0 × 409 `CONCURRENT_UPDATE`; quét tự nhiên d = 0…30 ms: 0 deadlock. Reject/cancel cùng số. Sửa cùng vòng nếu kịp; không chặn G1/G7. |
| BUG-R2-199 (R6MISC-02, phần BE-C của 163) | P3 | BE-C | `housekeeping.service.ts` `transitionHkTask` (~1001): `performedAt` < `hk_task.created_at` → 422 `VALIDATION_FAILED` / `PERFORMED_AT_OUT_OF_RANGE` cho `start`, `complete`, `cancel`. Số: T1 tạo 10:00, `complete` 09:55 → **422**; −1 s → 422; đúng `created_at` → 200; +1 phút → 200; tiền 140.000 không đổi. Tuần Ổn định. |
| N-1 (từ R6FIX-02) câu (ac) | Note | ARC | Thêm vào (ac) hoặc K11-02: "lần nạp copy-on-write chưa commit lúc đọc dưới L5, thắng ở `ON CONFLICT` → coi như lần đếm đi trước → 201". |
| N-2 422 `MINIBAR_ITEMS_INCOMPLETE` thay 409 khi đua tự nhiên | Note (P3 nếu tái hiện) | QA; BE-B | 3/72 lượt (một người tái hiện thấy). `assertCountLines` sớm trong `record()` đọc `fridgeItems` bằng hai câu trước khóa: lần nạp chưa commit + danh mục đã commit. Tiền đúng (tải lại → 201). Lễ tân nhận "thiếu món" thay "cần đếm lại". Lệch quy tắc đọc 16.19. QA tái hiện rồi cấp số P3; BE-B trả 409 hoặc bỏ kiểm sớm. |
| N-3 `cancelSuperseded` không ghi `auto_cancel_reason = 'superseded'` | Note | ARC; BE-A | API không có `autoCancelReason`. ARC đối chiếu hợp đồng. |
| N-4 QR `check_out` còn `pending` sau khi B18 thu tiền mặt | Note | DOM; QA | Xác nhận sau đó cần ghi chú (422 `REASON_REQUIRED`) rồi thành credit. Tuần tự cũng vậy. DOM xác nhận là đúng ý. |
| N-5 Vệ sinh test | Note | QA; OPS | Hai tệp cài trigger toàn bảng (`q-k11period-1-0`, harness `q-k11nokey-0-0`) và các test đếm waiter theo cả DB phải chạy DB riêng hoặc tuần tự. CI tách ra. |
| G-1 Câu chữ cũ thua bảng 5A | GAP-DOM | DOM; ARC | Câu cuối BR-429 (a)/(g) ("đêm thêm khi đổi ngày lấy lịch hiện hành; đơn thỏa thuận lễ tân nhập lại"), ARC 16.6 (a) ("khách xin → AN-47 ngoài bảng"), mô tả `previewMoveReservation` trong `openapi.yaml` chưa sửa theo r5-5. B7 không có ô giá để "nhập lại". Xóa hoặc chuyển vào danh sách "câu chữ thua bảng". |
| G-2 MovePlanner dời ngày **đến sớm hơn**, giữ căn, đơn thỏa thuận | GAP-DOM, **chốt trước cổng** | DOM | Bảng 5A không có dòng. Bước 3 ghi "MovePlanner: đêm muộn nhất trước d" nên đêm thêm ở đầu đơn không có đêm tham chiếu, ra lịch: seq 57 650.000 → 750.000; seq 136 750.000 → 792.000; seq 175 900.000 → 1.000.000. B9a cùng đêm lấy "đêm sớm nhất sau d" và ra giá thỏa thuận. DOM chốt. Nếu chốt "giá thỏa thuận" thì gộp vào 195. |
| G-3 Đơn OTA vào làn ngay lúc đặt rồi B7a | GAP-DOM | DOM | Mã theo BR-424: `reassigned_same_group` → CKM = căn được gán (101 → 102: 750.000, keep null); `upgraded` → CKM = căn xin (203 → 401: 792.000, keep 792.000). AN-13/AN-17 không nêu ngoại lệ `upgraded`. Thêm dòng. |
| G-4 MGR `reversePayment` sau B18 | GAP-DOM | DOM | Đảo 100.000 sau trả phòng để lại folio `settled`, due 100.000, `checkout_mode = desk`, không công nợ, không dòng `post_checkout`. Tuần tự cũng vậy. Không có BR. DOM chốt; nếu cần thì thành mã cho BE-A. |
| BUG-R2-123 | P3 | BE-A + ARC | Tuần Ổn định. |
| BUG-R2-133 | P3 | BE-A; OPS | 8073a3d đã có `upgradedFromRoom`. Lượt 7 chạy lại 13 ca keep (208.000 × 2; 125.000 × 2). |

## Test cũ phải đổi kỳ vọng

Các thay đổi dưới đây không phải lỗi mã. Bản đã đổi nằm ở `r6fix/fixed/` (51 tệp, mỗi chỗ có chú thích `r6fix`), `r6misc/old-*`, `r6rate/old/`. Bản thay thế bằng ca mới nằm ở `r6lock/`.

**(a) HK "xong" qua API complete, không UPDATE SQL (ARC 16.17 mục 2, BUG-R2-159).**

| Tệp / ca | Cũ → mới | Căn cứ |
|---|---|---|
| `y-fridge-return` Y1b, Y3; `r4mini` B3; `r5mini` | Bước HK xong đổi sang API: **140.000 / 105.000 / 105.000** | ARC 16.17 mục 2 |
| `z-r5old-0-0` Z1b; `q-k11lock-3-1` E × 3 | Bỏ tiền đề "2 việc, HK nạp 1 + 1 + 1 = 3": nay **1 việc** (`{bia: 2}` / `{bia: 1}`); Z1b 105.000; E mốc bia 2 | BUG-R2-159 |
| `r5mini` A2 | Thêm bước chạy 0067 thật: giữ **70.000**, 1 lần đếm sống | BUG-R2-164 |

**(b) Nguồn đêm và giá đêm thêm (ARC 16.18, phụ lục 5A).**

| Tệp / ca | Cũ → mới | Căn cứ |
|---|---|---|
| `w-r2pay-3-0` (2 bản) | Nguồn đêm B13 mặc định: `manual` → **`default`**; số giữ 800.000 | ARC 16.18 |
| `x-agreed-after-guest-move` (2 bản) | Đêm B13 có gõ (kể cả gõ đúng số gợi ý) là đêm tham chiếu: B18 **958.000**, không phải lịch 1.102.000 | AN-23, AN-26 |
| `r3rate` T4 (2 bản); `r4rate` T15 (3 bản) | `currentBookingRateVnd` → **null** khi đêm thêm kế tiếp là ngày đặc biệt | AN-29, AN-45 |
| `z-r5rate-1-1` C | Oracle sai (dùng lịch 202 cho 201): tổng 2.980.000 → **2.870.000** (201 đêm Giỗ Tổ 920.000 = 708.000 × 1,3) | BR-417-18 |

**(c) Khóa và kỳ minibar (ARC 16.19).**

| Tệp / ca | Cũ → mới | Căn cứ |
|---|---|---|
| `nokey-b18` A0–A2; assert "dòng commit được trong B18" (`q-k11nokey-3-1`) | Vị từ `bad` bỏ sót `post_checkout` (test sai) → oracle `lost`; assert → **0**. B18 trước: dòng `post_checkout` trên folio `settled`, due 150.000 với `desk` là đúng (BR-427 c). Thay bằng r6lock `b18-folio` P | K11-01 |
| `q-k11period-1-0`, `1-1` (cổng giữ tới lock_timeout); `cow-race` R/U | Danh mục chờ `check_in` chưa commit của lần đếm (`ON CONFLICT`): harness nhả sau **1,5 s**. Ca gửi `periodId: null` không `roomId` → **422** | K11-02, K11-03 |
| `k11period` B2; `cow-race` C3, O; `k11lock scope` | Lần đếm `null` sau copy-on-write tuần tự → **409 → tải lại → 201**. Ca đối chứng `scope` (202 đã nạp, `periodId` đúng, gửi sau B14) → **201** vào tủ 202 | (ac) viết lại, (ah) |
| Ca 30 / BR-703-04; `q-k11lock-1-0` | "201 ngay" → **409 → tải lại → 201**; mọi POST gửi `roomId`; ca (4) đếm lại 202 trong ngày đi | (ah), K11-09 |
| `q-k11nokey-1-0/1-1`, `k11lock fridge-pairs`, `nokey-period` ab-1/ab-2 | Assert `dl ≥ 1` → **0 deadlock** + kết quả = đối chứng tuần tự | K11-04 |
| `k11period` D1/D6; `q-k11lock-0-1` | Đầu dò "chờ ở folio" → **"chờ bắc cầu sau holder"** (L2 trước L3) | K11-04 |
| `k11lock stale-room` (1) | Chỗ chờ dời từ folio lên `room`; thân dạng Desk vắng `roomId` → 422. Thay bằng r6lock 175 (a)(b), r6misc K11-03 | K11-05 |
| `q-k11lock-4-1` | Ca tái hiện → **"lệch giờ = đối chứng"** | BUG-R2-163 |
| `k11period` E1; `q-k11period-2-0/2-1/3-1`; `r5mini` A7 | Lần đếm không trong ngày đi → `not_today` | BR-703 ghi chú 7 |
| 89 ca cũ vắng `roomId` | Shim `contract-r6.ts` thêm `roomId`. Khi 196 sửa: chuyển hẳn sang gửi `roomId` + `periodId` | K11-03, K11-08 |

**(d) Đơn đã đóng và SEC.**

| Tệp / ca | Cũ → mới | Căn cứ |
|---|---|---|
| `q-k11nokey-2-0`, `2-1` | Dòng vào đơn đã đóng 201 → **409 `INVALID_TRANSITION`**; chi kẹt 1.910.000 → chi đủ **2.000.000** | BR-522-06 |
| `r5late-sec` A5(c); `z-r5late-2-0` | 409 `INVALID_TRANSITION` / 401 → **412 `VERSION_CONFLICT`** và **422** (`bitcoin`) trước mật khẩu, không đếm | SEC 12.1 (3) |
| `r5late` M6; `z-r5late-1-0`, `1-1` | "409, không đếm, không audit" → **401, đếm +1/+1, có audit**; mật khẩu đúng → 409, bộ đếm về 0 | SEC 12.2 |

**(e) Test sai khác.** `r6fix/mig` p3 M4 (giờ 09:00 với `checkoutTime` 10:00). `r5critic` bản chép r5late theo (d).

**(f) Giữ đỏ, vì đây là lỗi mã.** Không đổi kỳ vọng:
- 195: `r6rate/min.test.ts` MP-1, MP-2, MP-3; `w-r6rate-0-0`, `0-1`, `1-0`, `1-1`.
- 196: `r6misc/k1103` K11-08 × 2; `w-r6misc-0-0`, `0-1`.
- 197: `r6fix/mig` p3 M1, M6; `w-r6fix-0-0`, `0-1` (chạy bằng `run.sh` 3 pha).
- 198: `r6lock/approval-order` (ép B18, ép B13, tự nhiên); `w-r6lock-0-0`, `0-1`.
- 199: `r6misc/k1109-hk163` ca 163 (`expect.soft`); `w-r6misc-1-0`, `1-1`.
- BUG-R2-133: 13 ca keep. B6 × 2 (178): xanh từ #14, lượt 7 xác nhận.

**(g) Dọn bộ test cũ.**
- QA thêm vào `s438-superseded.json`: 89 ca đã đổi (trỏ tới `r6fix/fixed/`), các ca thay bằng `r6lock/` và `r6misc/old-*`. Mục tiêu lượt 7: "0 ca đỏ ngoài keep và mã đang mở", không phân loại lại.
- `br-examples.json`: sửa câu "BR-417-20 (pendingFix BUG-R2-AN47)" ở dòng AN-47 của BR-417-16 (đã cũ). Còn `pendingFix`: BR-309-18, BR-417-03, BR-602-05. Thêm dòng oracle của 195.

## Xu hướng

| Lượt | Commit | Phát hiện mới | Major (mã P1) mới | Do vòng sửa trước gây ra | Vùng sinh Major |
|---|---|---|---|---|---|
| 1 | 08dabd3 | 22 | 11 (109…119) | 0 | FOC, đổi căn, hủy/cọc, B9a/B18 |
| 2 | 2f77889 | 15 | 6 (125…130) | 2 | định mức bảo vệ, giá thỏa thuận, minibar, cọc |
| 3 | 42fb458 | 9 | 5 (134…138) | 1 phần | minibar × 4, giá thỏa thuận |
| 4 | 365486f | 12 | 3 (144…146) | 2 + 6/8 Minor | minibar kỳ nạp, giá đêm kề, xác nhận mật khẩu |
| 5 | ce90d19 | 11 | 5 (158…162) | 1 hồi quy + 1 phần + 2 P2 | minibar kỳ nạp, giá đêm kề / căn khách mua |
| 5b | f04052d (#11) | 9 + 2 trùng | 3 (171…173) + 163 nâng | 1 hồi quy (171) | khóa B18/folio, định danh tủ, copy-on-write |
| **6** | **723179b (#13)** | **6 (7 báo cáo, gộp 1)** | **1 (195)** | **0 hồi quy**; 195 là sửa chưa đủ | giá đêm thêm – MovePlanner, đơn thỏa thuận chưa đổi căn |

Lỗi sai số tiền mới (không tính bảo mật): lượt 5b có 4 P1; lượt 6 có **1 P1 + 2 P2**. Hai P2 chỉ mở với bên gọi lệch hợp đồng (196) hoặc dữ liệu của bản trung gian (197).

Nhận xét:
- **Đang hội tụ.** Major 3 → 1. Lần đầu kể từ lượt 2 không có hồi quy do vòng sửa (lượt 5 có 158, lượt 5b có 171). 20/20 mã đích đóng có số. Mã cũ 0 hồi quy qua ~4.500 ca × 2.
- **Minibar lần đầu 0 P1** sau 6 lượt liền. Bất biến "một hàm ghi việc" (`reconcileRefillTasks`) và chỉ mục 0069 giữ được qua mọi ca đua và tuần tự. Lỗi minibar còn lại nằm ngoài lõi: dữ liệu của bản trung gian (197), server chưa thực thi hợp đồng (196), giờ truy vết (199).
- Vùng còn sinh lỗi:
  - **Giá đêm thêm**, lượt thứ sáu cùng họ (126 → 134 → 145 → 155/156 → 160–162 → 195). Nay thu hẹp còn một bên tiêu thụ (MovePlanner) và một đầu vào (căn gốc NULL). B9a, B13, B18, `lateFee`, QR: 0 lệch qua 4.435 phép so.
  - **Thứ tự khóa ở đường duyệt** (198). Cùng lớp, ARC tự rà cũng tìm thêm ở module khác: BUG-R2-185 (housekeeping), 188 (guest request ‖ HK). Lớp lỗi chưa hết vì chưa rà xong mọi module, không vì quy tắc sai.
  - **Hợp đồng đổi trên giấy, mã chưa theo** (196, 199): yaml/ARC ghi "bắt buộc" nhưng kiểm đầu vào và việc kèm chưa làm.
  - **Migration sửa dữ liệu qua nhiều bản** (164 → 197): test migration chỉ dựng dữ liệu từ bản đầu, không từ các bản trung gian.

**Đánh giá riêng hai cách làm mới.**

(1) **Bảng quyết định giá đêm thêm (BR-417 phụ lục 5A, AN-01…AN-47).**
- Chặn được lớp lỗi "chọn sai quy tắc". 160, 161, 162 đóng. Fuzz độc lập 340 chuỗi: 0 lệch ở B9a, B13, B18, `lateFee`, trần QR, nguồn đêm. Bộ cũ 88/88.
- Không chặn lớp lỗi "nối sai đầu vào". 195 lọt vì ba lý do:
  - Dòng AN-46, AN-47 (b) chỉ có ví dụ đơn lịch giá. Test sinh từ 47 ví dụ không có biến thể "đơn thỏa thuận × lần đổi căn đầu".
  - BE-A cài bảng ở nhiều chỗ với hai cách dự phòng căn gốc (B13 `?? roomId`, MovePlanner `?? null`). Recheck5 đề nghị "viết lại một lần"; thực tế vẫn hai đường.
  - Câu chữ cũ (BR-429 (g), ARC 16.6 (a), mô tả yaml) vẫn nói "lịch hiện hành", nên 792.000 trông như đúng.
- Kết luận: bảng là cách đúng, nhưng phải đi kèm (a) một hàm duy nhất cho mọi bên tiêu thụ, (b) trục biến thể "nguồn giá đơn × lịch sử đổi căn" trong ví dụ, (c) fuzz so với hàm tham chiếu độc lập trong CI.

(2) **Quy tắc khóa một nguồn (ARC 16.19, L0–L5, E1–E3).**
- Chặn được lớp lỗi nó nhắm: 169, 171, 174, 175 đóng. 22 bộ đếm deadlock +0. B18 ‖ 8 lệnh tiền, B9, `record()` ‖ B13/B14/B18/HK/copy-on-write giống tuần tự. Quét tự nhiên 0 vi phạm tiền.
- Quy tắc còn là công cụ rà: r6lock tìm ra 198 chính nhờ đối chiếu mã với bảng.
- Không tự chặn được lỗi ở chỗ bảng chưa liệt kê. Bảng theo lệnh chỉ có dòng FOC/damage cho đường duyệt. Bộ máy duyệt có hình dạng ngược sẵn: khóa yêu cầu (L4) rồi mới chạy hook ghi đơn (L1). Mỗi hook mới sẽ lặp lại lỗi.
- R6FIX-02 cho thấy hai câu trong cùng 16.19 ((ac) và K11-02) có thể đọc chọi nhau.
- Kết luận: giữ quy tắc; đổi bộ máy duyệt để preLock là bắt buộc theo loại; thêm test liệt kê mọi lệnh/hook và kiểm có dòng trong bảng; ARC hoàn tất rà các module ngoài S4-38.

Dự báo: nếu vòng sửa tiếp theo đóng 195, 196, 197 (và 198), lượt 7 ngắn, đích danh có thể về 0 Major. Rủi ro chính: gộp #15 đổi đường đọc giá B13 (`RoomPriceCache`) và `housekeeping.service.ts`; phải chạy lại fuzz `r6rate` và bộ HK trên commit gộp.

## Đối chiếu điều kiện của lượt trước

Các điều kiện lấy từ `s4-money-recheck5.md` và `s4-money-recheck5b.md`, mục Khuyến nghị.

| Điều kiện | Trạng thái ở 723179b |
|---|---|
| R5-1. Đóng 159–162 có oracle; bảng quyết định trước khi BE-A sửa; 159 theo R9 | Xong. Bảng 5A 47 dòng, `br417-an-table` 47 AN; 159 theo 16.17. Còn sót 195 (MovePlanner). |
| R5-2. 158: ca A1 vào test chính thức | Xong (`minibar-m1` "BUG-R2-158 (A1)"). |
| R5-3. 163, 164 sửa cùng vòng | Xong phần tiền. 163 phần BE-C → 199. 164 sót dữ liệu ce90d19 → 197. |
| R5-4. SEC quyết 165, 166, 167; sửa 11.3 | Xong (SEC mục 12.1–12.4). |
| R5-5. DOM: bảng giá, R9, N-3 | Xong. Còn câu chữ BR-429 (g) (G-1), G-2, G-3. |
| R5-6. ARC: R9, 16.3, 16.6 (a), 16.15, 16.16 (x) | Xong qua 16.17–16.19. Còn 16.6 (a) theo r5-5 (G-1), 16.17 mục 3 cho 197. |
| R5-7. QA cấp 158…169, oracle, superseded | Xong. |
| R5-9. OPS/DATA chạy truy vấn kiểm trước khi nhận tải | **Chưa thấy** xác nhận OPS cho K1–K4. Nay thêm 197. |
| R5-10. G5: api và E2E xanh trên commit chấm | api 2.849 × 2 trên 723179b; CI #12 xanh (E2E 1.912). #15: api 2.895 (ORC). Hoa hồng S4-03: không thuộc lượt này. |
| R5b-1. K11-01 sửa trước tiên | Xong (171). |
| R5b-2/3/4. K11-02…05, 159, 163 | Xong. 173 Desk E2E do QA kiểm (bug-list 11.22). |
| R5b-5. ARC: quy tắc khóa, hợp đồng `roomId`/`periodId`, K11-08 | Xong trên giấy (16.19, yaml). Mã chưa thực thi K11-08 → 196. Bảng thiếu dòng đường duyệt → 198. |
| R5b-6. DOM: K11-09, K11-06 | Xong (BR-703 ghi chú 7, BR-522-06). |
| R5b-7. QA cấp 171…177 | Xong. |
| R5b-8. Lượt 6 chạy lại `k11*`, `q-k11*` | Xong: chép vào `r6fix/old`, đổi kỳ vọng ở (c); deadlocks +0; tự nhiên B18 ‖ dòng 0 vi phạm. |

## Gaps

- **E2E/UI**: chưa chạy Desk E2E với API thật cho K11-03 (chỉ mock admin-web; QA đã có E2E riêng). PWA HK và MOB chưa có màn đếm minibar, chưa kiểm luồng offline thật.
- **195**: chưa chạy bậc BR-107 (≥ 7 đêm) trên MovePlanner/B13; B7 "dời hẳn" (đổi cả hai ngày); B8; lý do `force_majeure`/`upgrade`/`inventory_optimize`/`other` trong fuzz; kênh CTV; 0068 trên dữ liệu cũ. Người tái hiện chưa tự chạy f04052d (chỉ người báo chạy).
- **197**: chưa phủ dữ liệu S4-09 có đơn con, lượt đã `checked_out` có lần đếm NULL, nhiều cơ sở. Chưa biết môi trường nào giữ dữ liệu ce90d19…8819c2d.
- **198**: chưa chạy `no_show_restore`, `refund`, `quote_extension`. B7, B16, B5/B11/B12 chỉ rà mã, chưa đua có ép. `swapRoom` khóa hai folio theo id đơn, không theo id folio.
- **163/199**: chưa có ca đua 2 kết nối HK complete ‖ lần đếm cùng tủ.
- **R6FIX-02**: chưa thử hai thay đổi danh mục chồng nhau.
- **Lượt 2 bộ cũ** chạy khi máy quá tải; 42 ca đỏ do môi trường xanh khi chạy lại tuần tự; chưa có lượt song song thứ ba sạch tải. Lượt 2 dùng bản cũ của 3 tệp sửa sau cùng (đã kiểm riêng).
- **170**: chỉ ~1.400 hồ sơ, chưa thử 10.000+ hay thời gian phản hồi.
- Không kiểm lại 178, BR-309-18, 123, 166 (đã biết hoặc đã chấp nhận). 177 phần chú thích chỉ đọc mã.
- Critic không chạy trên 8073a3d; các nhận định về #14/#15 dựa trên đọc diff.

## Khuyến nghị cổng QC Sprint 4

**CHƯA** với commit 723179b (và với 8073a3d theo đọc diff):
- **G1 không đạt** ("0 ca lệch tiền"):
  - 195: lệch ±108.000…305.000 mỗi đêm thêm khi B7 thêm đêm cho đơn thỏa thuận chưa từng đổi căn (cả hai chiều, ghi thật vào folio);
  - 196: thu thừa 35.000/món khi lần đếm thiếu `periodId` (bên gọi lệch hợp đồng);
  - 197: thu thừa 70.000/tủ trên dữ liệu đã xác nhận lại bằng ce90d19/f04052d.
- **G7 không đạt** ("0 P0/P1 mở"): 1 P1 (195).
- Điểm tốt: 20/20 mã đích đóng có số; 0 hồi quy, lần đầu kể từ lượt 2 không có hồi quy do vòng sửa; minibar 0 P1; 22 bộ đếm deadlock +0; fuzz giá 4.435 phép so chỉ lệch ở một hàm; SEC 165–167 đóng; hồi quy chung sạch (2.849 + ~4.500 ca × 2).

Điều kiện để vào cổng (**ĐẠT CÓ ĐIỀU KIỆN** khi đủ 1–6):
1. **Đóng 195.** BE-A sửa căn gốc của MovePlanner theo cùng hàm với B13. Test oracle theo bảng "Major-fix-now" (A, MP-2, MP-3, E, D, F). Fuzz `r6rate` hai seed: 0 chuỗi lệch. DOM chốt G-2 **trước** khi BE-A sửa; nếu chốt giá thỏa thuận thì gộp vào 195.
2. **Đóng 196.** BE-B bắt buộc `roomId` + `periodId`, bỏ nhánh cũ; ARC xóa câu K11-03 "vắng cả hai"; QA đổi ca K11-05 và 89 ca shim.
3. **197: sửa hoặc chứng nhận.** BE-B migration mới RAISE khi K1 ≠ 0 (ưu tiên). Hoặc OPS/DATA ghi decision-log: mọi môi trường từng chạy ce90d19…8819c2d, K1–K4 = 0 trước khi nhận tải. Không có một trong hai thì 197 tính vào G1.
4. QA: đóng 158…162, 164…169, 171…177 theo báo cáo này; đóng 163 phần tiền và cấp 199; cấp 195…198; cập nhật superseded và `br-examples.json` (mục Test cũ (g)).
5. Lượt kiểm lại lần 7 (ngắn, đích danh) trên commit gộp có bản sửa (sau #15):
   - chạy lại `r6rate` (min, fuzz hai seed, old), `r6fix/mig` 3 pha (cả biến thể f04052d), `r6lock/approval-order`, `r6misc/k1103`, `k1109-hk163`, các `w-r6*`;
   - chạy lại `r6fix/all` (DB riêng cho tệp cài trigger) vì #15 đổi `stay-support.ts`, `housekeeping.service.ts`, `move-planner.ts`;
   - mục tiêu: 0 ca đỏ ngoài keep và mã còn mở được; xem trước = trần QR = ghi **và đúng số**;
   - critic chấm lại một lượt ngắn.
6. G5: api và E2E xanh trên đúng commit chấm.

Được mở khi vào cổng (ORC ghi decision-log kèm hạn và người chịu):
- 198 (P2, không lệch tiền): sửa cùng vòng nếu kịp; nếu không, hạn tuần Ổn định. ARC thêm dòng đường duyệt vào 16.19.
- 199 (P3), 123 (P3), 133 (P3, khi OPS ghi truy vấn origin NULL = 0 trên dữ liệu dùng thử).
- Note N-1…N-5, GAP-DOM G-1, G-3, G-4 (câu chữ, không đổi tiền).

Không cấp ngoại lệ tiền. ORC ghi decision-log ngày chấm mới sau lượt kiểm lại lần 7.

## Tệp của critic

Thư mục `/private/tmp/claude-501/-Users-anhvh-Library-Application-Support-Claude-scratch-workspaces-00554cf2-3678-4864-82b0-830aaeaa97bd-4c0caebe-be05-49c5-a5a2-5bf357fddc6a-scratch-2026-10-15-c4f0d4/36df3adc-c586-471c-a039-340d2b696728/scratchpad/s438/r6critic/`:
- `env.sh` (từ `env-foc.sh`, đổi tên DB)
- `run1.log`: 723179b, 4 tệp, 29 ca, 20 xanh, 9 đỏ
- `rate-min.jsonl`: số MP-1…MP-4, MP-c, AN-11, AN-12, AN-25, r5-3, AN-47 (a)
- `misc.evidence`: số K11-03, K11-08, K11-09, 163
- `lock.evidence`: deadlocks và trạng thái cuối của `approval-order`

Bản chép test: `scratchpad/s438/wt13/product/services/api/test/s438/r6critic/rate-min.test.ts` (chỉ đổi thư mục ghi số và đường import).

DB `ottimo_test_s438_r6critic` đã được xóa sau khi chạy.
