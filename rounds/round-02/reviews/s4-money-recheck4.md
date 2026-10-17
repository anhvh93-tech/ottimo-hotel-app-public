# Kiểm lại tiền S4-38 lần 4 – commit 365486f

Đây là lượt kiểm lại thứ tư của S4-38 (Round 2 Sprint 4, tuần Ổn định). Lượt này chạy sau vòng sửa 3 (BE-A mục 14, BE-B M-1 mục 13, BE-C J8; decision-log 18/10). Có 4 người kiểm: `r4old`, `r4mini`, `r4late`, `r4rate`. Họ kiểm 34 mã liên quan tiền (BUG-R2-109…143, trừ 141 là lỗi FE không chạm tiền) và tìm thêm 12 phát hiện mới. Mỗi phát hiện mới có 2 người tái hiện độc lập (`y-r4*`, 24 lượt). Mỗi người tự viết test, tự tính số từ BR v0.3.8 bản 18/10, chạy trên PostgreSQL thật, DB riêng `ottimo_test_s438_r4*` / `yr4*`, bản sao cố định 365486f (src không sửa).

Test nằm ở `scratchpad/s438/wt/product/services/api/test/s438/` (chưa track trong repo). Thư mục `r4*/` là của người kiểm, `y-r4*/` là của người tái hiện, `r4critic/` là của critic.

Ghi chú thời điểm:
- Báo cáo chấm commit **365486f** (vòng sửa 3, sau 42fb458).
- Mốc BR là BR v0.3.8 và bổ sung 18/10 (BR-309-15, BR-416-06, BR-417-07…10, BR-434-16, BR-702-02…04, BR-703-01, BR-807-01). Mốc hợp đồng là `openapi-0.3.7.md` mục 16 (M-1, D5–D7) và SEC D5 (SR-AUTH-11, BE-59…64).
- ESC-023 và ESC-024 vẫn chờ INV. Không phát hiện nào trong lượt này phụ thuộc hai ESC đó.

## Tóm tắt

- 34 mã cũ liên quan tiền: **32 ĐÃ SỬA**, 2 CHƯA SỬA đúng hẹn (BUG-R2-123, 133, P3 tuần Ổn định), **0 HỒI QUY**. Critic chạy lại: 123 và 133 còn nguyên.
- 8 mã đích của vòng sửa 3 (134…139, 142, 143): đủ số, đề nghị đóng. BUG-R2-140 mới xong phần API; phần Desk H16 chưa kiểm.
- 12 phát hiện mới: **3 Major-fix-now** (3 mã P1), 8 Minor (6 P2, 2 P3), 0 Note, **1 CLOSED-not-real** (R4LATE-05).
- 24 lượt tái hiện đều tái hiện được hành vi. 22 lượt xác nhận lệch quy tắc; 2 lượt (R4LATE-05) kết luận not-a-bug.
- Critic đổi kết luận 1 phát hiện: R4LATE-05 từ P3 xuống CLOSED-not-real. Giữ mức của người báo cho 11 phát hiện còn lại.
- **Lỗ hổng bảo mật (SEC phải xem)**: R4LATE-01 (P1, quản lý đang bị khóa đăng nhập vẫn xác nhận và duyệt FOC), R4LATE-03 (P2, dò mật khẩu quản lý trên mọi đơn đang ở). R4LATE-07 và R4LATE-06 là thiếu kiểm soát phát hiện/audit (P3). R4LATE-04 cần SEC chốt thứ tự idempotency với đường xác nhận lại. **Điều kiện SEC D5 (BE-59…63) chưa đạt.**
- Hồi quy do vòng sửa 3: 2/3 mã P1 (R4RATE-01, R4LATE-01) và 6/8 Minor. Đường BR-416-06 mới sinh 6 phát hiện; hàm `addedNightRate` sinh 1; bản sửa BUG-R2-142 sinh 1.
- **Minibar vẫn là chỗ yếu**, vòng thứ tư liên tiếp: M-1 thiết kế lần nạp `refill` nhưng không đường nào ghi (R4MINI-01).
- Hồi quy chung sạch: api 2.732/2.732 × 2; 3.117 ca cũ × 3 lượt, không ca nào đỏ do lỗi mã ngoài BUG-R2-133.
- **365486f chưa đạt G1**: còn 2 lỗi thu thiếu (R4MINI-01, R4RATE-01) và 1 lệch tiền trên dữ liệu cũ sau 0065 (R4MINI-03). **Chưa đạt G7**: 3 mã P1 mới.

## Kết quả từng hướng kiểm

**r4old** (hồi quy toàn bộ):
- api toàn bộ (bỏ `test/s438`), mỗi lượt một DB mới: 2.732/2.732, 85/85 tệp, × 2 lượt. Không ca chập chờn.
- Toàn bộ test cũ `test/s438` chép sang `r4old/old/`: 579 tệp, 3.117 ca. 3 lượt giống hệt: 2.833 xanh, 277 đỏ, 7 skip. Phân loại 277 ca đỏ:
  - 209 ca đỏ y hệt ở 42fb458, cùng thông điệp. Đó là các bản kỳ vọng cũ đã có bản đổi xanh, cùng 6 ca BUG-R2-133;
  - 32 ca mới đỏ (16 ca riêng): đều là kỳ vọng cũ theo ARC 16.4 ca 9, BR-702 v0.3.8, ARC 16.2 R2/R3 và BE-A 14.1;
  - 36 ca ở `r3*`/`x-r3*`: 22 minibar M-1, 6 hợp đồng cũ BUG-R2-139, 3 QR vượt cần ghi chú (D7), 3 giá, 1 BUG-R2-133, 1 đua R15.
- Bản đổi kỳ vọng `r4old/fixed/`: 23 tệp, 54 ca, 54/54 × 2 lượt.
- R2FOC-03 (M8, M8b) nay xanh, theo DOM (e).
- Đua R15 (duyệt FOC ‖ đếm lại): 409 `CONCURRENT_UPDATE` ở 5–13/24 vòng, so với 1–3/24 ở 42fb458. Tiền luôn nhất quán. Xem Note N-2.

**r4mini** (BE-B, mô hình M-1):
- 5 lượt toàn bộ trên DB mới. Lượt cuối 125/128; 3 ca đỏ đều là phát hiện mới: B3, B6 (R4MINI-01), B4 (R4MINI-02). MIG2 chạy riêng → R4MINI-03.
- 14 tệp cũ (77 ca): 55 xanh, 22 đỏ; sau khi đổi kỳ vọng 77/77 × 5 lượt. Test chính thức `minibar-m1` (10 ca), `s438-beb`, `minibar-catalog-s4-bed` xanh.
- Các ca đúng:
  - lần nạp chụp khi danh mục đổi (N1–N6, kể cả 2 lệnh sửa đồng thời);
  - tủ theo (lượt, căn): B1, B2 (ba tủ), B5, S2 (HK đếm trên đơn con);
  - khóa FOC `item:minibar:<code>`: qua hai tủ, hai yêu cầu đua, đua duyệt ‖ đếm ‖ sửa dòng 6 vòng × 4 lượt, Σ FOC ≤ Σ món;
  - giữ dòng: đếm cùng số, bằng số folio đã sửa, void, sửa giá dòng;
  - R10: HK không thấy giá; B18 chặn theo mọi tủ.
- Lỗi còn lại: tủ quay lại trong lượt (R4MINI-01, P1), HK không đếm được tủ căn cũ ngày B14 (R4MINI-02), FOC áp thừa còn trên dữ liệu cũ sau 0065 (R4MINI-03).

**r4late** (BE-A, BR-416-06 và D5–D7):
- 39 ca mới, 2 lượt: 27 xanh, 12 đỏ. 12 ca đỏ ứng với R4LATE-01…07.
- Test cũ chép sang `r4late/old-*`: 43/43 sau khi đổi 9 ca. 13 tệp test chính thức: 234/234.
- BR-416-06 xem trước = trần QR = lệnh ghi ở 12 biến thể: thứ Năm (oracle 792.000), thứ Sáu 911.000, ngày lễ 1.030.000, thỏa thuận 850.000, Agoda, Agoda + đơn con B13, OTA bị OTTIMO dời, định mức bảo vệ, 7 đêm, FOC trả muộn đã duyệt (492.000), rời 01:00. Dòng ghi `late_fee_as_night`, nhóm doanh thu `other`.
- QR mục đích D7 đạt. Đua B18 ‖ xác nhận QR và B9 ‖ xác nhận QR, mỗi loại 10 lượt: không 5xx, không tiền thừa ngầm.
- SEC đạt phần lớn: 401 đồng nhất cho 12 loại tài khoản; trung vị thời gian tỉ lệ 1,06; bộ đếm hai phía; 429 kèm Retry-After 900; 8 lệnh song song → đúng 5 × 401 + 3 × 429; không thấy secret ở log trace, audit, idempotency, thông báo, Problem.
- Lỗi còn lại: R4LATE-01, 02, 03, 04, 06, 07.

**r4rate** (BE-A giá đêm kề, BE-A BR-309-15, BE-C J8):
- 12 tệp test chính thức 156/156. Test cũ `r3rate`, `x-r3rate-*`, `r3dep`: 275/275 sau khi đổi 3 ca (5 skip legacy-0064).
- 29 ca tấn công × 2 lượt: 301 xanh, 3 đỏ (T11, D1, D1b), 5 skip.
- `addedNightRate` đúng ở 16 ca T1–T18: đơn lịch giá, thỏa thuận, S4-35, sau B14 khách xin, sau OTTIMO đổi căn (B14, B7, swap, B7a, B12), đêm con OTA, ngày đặc biệt, kẹp sàn 740.000, bậc BR-107 khi B18 thành 7 đêm. MovePlanner (b1') đúng.
- BR-309-15 đúng ở chuỗi F1–F8. BR-807-01 đúng ở ca oracle.
- Đối chứng `causedByFix` trên cây 42fb458 giải nén (DB riêng, đã xóa).
- Lỗi còn lại: R4RATE-01 (P1), R4RATE-02 (P2). Cả hai do vòng sửa 3.

## Trạng thái mã cũ

| Mã | Mức | Trạng thái ở 365486f | Bằng chứng có số | Ghi chú |
|---|---|---|---|---|
| BUG-R2-109 | P1 | ĐÃ SỬA | 3 lượt giống nhau. BR-434-15 (a): 202 bia 2 → 0 → 2, FOC áp lại 35.000, folio 827.000, hạn mức FDL 35.000 ở 4 mốc. | M2b đổi kỳ vọng theo ARC 16.4 ca 9 (void rồi đếm cùng số → 0, FOC ngủ). Xem Note N-1. |
| BUG-R2-110 | P1 | ĐÃ SỬA | 24/24 ca × 3 lượt. BR-434-14: no-show tạm dừng, khôi phục áp lại 250.000. | – |
| BUG-R2-111 | P1 | ĐÃ SỬA | 21 ca xanh: xem trước = ghi = −42.000. 5 ca đỏ y hệt ở 42fb458 (Note, kỳ vọng cũ). | Đã Closed. |
| BUG-R2-112 | P1 | ĐÃ SỬA | Swap 202 ↔ 302 không thu thừa 300.000; 3/3 lượt. | – |
| BUG-R2-113 | P1 | ĐÃ SỬA | Chênh lệch căn gốc 250.000/đêm. Ca đỏ còn lại là 133 và Note MOVE-03, cùng thông điệp 42fb458. | – |
| BUG-R2-114 | P1 | ĐÃ SỬA | 38 ca xanh, không còn 500/23505. | – |
| BUG-R2-115 | P1 | ĐÃ SỬA | v-move-4-*, v-pay-2-* xanh; ca đỏ là kỳ vọng cờ cũ, bản `r3regr/fixed` xanh. | – |
| BUG-R2-116 | P1 | ĐÃ SỬA | 89 ca xanh; 8 ca đỏ là kỳ vọng trước DOM v0.3.8, bản đã đổi xanh. | – |
| BUG-R2-117 | P1 | ĐÃ SỬA | 147 ca xanh; 15 ca đỏ là kỳ vọng trước DOM, y hệt 42fb458. | – |
| BUG-R2-118 | P1 | ĐÃ SỬA | 54 ca xanh (r2cancel v10/v11, r3dep). | – |
| BUG-R2-119 | P1 | ĐÃ SỬA | 49 ca xanh, r3dep 187/187. | – |
| BUG-R2-120 | P2 | ĐÃ SỬA | 42 ca xanh; 16 ca đỏ là kỳ vọng trước DOM, bản `exp-` xanh. | – |
| BUG-R2-121 | P2 | ĐÃ SỬA | 27 ca xanh; X3/X3b đỏ y hệt lượt 3 (kỳ vọng cũ). | – |
| BUG-R2-122 | P3 | ĐÃ SỬA | 71 ca xanh, thử = ghi. 4 ca k1 đỏ là test sai (UUID), đã phân loại lượt 3. | – |
| BUG-R2-123 | P3 | CHƯA SỬA | Critic chạy lại: `S1-move-preview` vẫn 422 `overbookingResolution REQUIRED`. | Tuần Ổn định, đúng hẹn. |
| BUG-R2-124 | P3 | ĐÃ SỬA | 4/4 ca × 3 lượt. | – |
| BUG-R2-125 | P1 | ĐÃ SỬA | 24/24 ca. Xem trước = trần QR = B9a = 2.026.000 (BR-429-20). | – |
| BUG-R2-126 | P1 | ĐÃ SỬA | 97 ca xanh: 203 B9a 792.000; 201 B13 708.000, tổng 1.308.000. | L1 đổi nguồn `calendar` → `manual` (BE-A 14.1), tiền giữ 800.000. |
| BUG-R2-127 | P1 | ĐÃ SỬA | 23 ca: đêm trước có khách → `available = false`, thu 1.234.000; QR `addPriorNight` → 422. | – |
| BUG-R2-128 | P1 | ĐÃ SỬA | 10/10: 201 sửa 560.000 → cọc yêu cầu 300.000; hủy còn 4 ngày: phí 150.000, hoàn 350.000. | – |
| BUG-R2-129 | P1 | ĐÃ SỬA | Đường đếm về 0 xanh (BR-434-15 (a)/(b), r3mini R1/R2/R7). Void rồi đếm 1: dòng 35.000, FOC áp lại. | Void rồi đếm **cùng số** nay ra 0 theo thiết kế (BR-702 v0.3.8). Tiêu đề trong bug-list phải sửa: Note N-1. |
| BUG-R2-130 | P1 | ĐÃ SỬA | 402 bia giữ 70.000, thêm snack 100.000, B18 thu 100.000; coca giữ 25.000. | Đầu vào test đổi: lần đếm gửi đủ món của tủ (ARC 16.2 R2/R3). |
| BUG-R2-131 | P2 | ĐÃ SỬA | 26/26: Agoda 203 → 302 → 401 xem trước = trần QR = 375.000. | – |
| BUG-R2-132 | P2 | ĐÃ SỬA | 26 ca: 101 sau B9a → `null`, tổng 2.768.000. | – |
| BUG-R2-133 | P3 | CHƯA SỬA | Critic chạy lại: 6 ca đỏ; dòng chênh lệch `[]` thay 208.000 × 2; căn gốc lưu `401` thay `203`. | Tuần Ổn định, đúng hẹn. |
| BUG-R2-134 | P1 | ĐÃ SỬA | 201 thỏa thuận 700.000 → 401: B13 04/03 = 1.042.000, B18 thứ Sáu 05/03 = 1.198.000 = trần QR = ghi. 202 650.000 → 301: tổng 4.626.000. 302 → 101: 3.768.000. Kẹp sàn 740.000 ghi được. | Hàm mới gây hồi quy R4RATE-01 (S4-09) → BUG-R2-145. |
| BUG-R2-135 | P1 | ĐÃ SỬA | F1: 301 coca 2 → A → 0 → 2 → B → 1: A applied, B dormant, ròng 0, folio 958.000, B18 thu 0. F2 qua hai tủ: 70.000/−70.000, về 0 cả hai ngủ, đếm lại tự khôi phục. Đua F3/F4 không áp thừa. | Dữ liệu cũ dạng 135 còn áp thừa sau 0065: R4MINI-03 → BUG-R2-147. |
| BUG-R2-136 | P1 | ĐÃ SỬA | B1: 202 → 203, 202 dùng 2 + 203 dùng 1 = 105.000, B18 thu 105.000. B2 ba tủ: 115.000. S2 đơn con B13: 70.000. | Còn hở tủ quay lại trong lượt: R4MINI-01 → BUG-R2-144 (không do bản sửa). |
| BUG-R2-137 | P1 | ĐÃ SỬA | 302 giá `null` giữ 70.000, folio 987.000, B18 thu 70.000; giá 0 cùng số. N3 (miễn phí trước lần đếm đầu): 70.000. | – |
| BUG-R2-138 | P1 | ĐÃ SỬA | 103 hạ 2 → 1: giữ 70.000 (BR-702-02 820.000). Nâng snack 1 → 2: 30.000. Hạ còn 1 khi tủ còn 2: nhập "còn 2", tiền 0. | Mốc = lần nạp (ARC R2). |
| BUG-R2-139 | P2 | ĐÃ SỬA | 203 16–18/04/2030, kín nhà, 19:00: tóm tắt = `lateFeeAsNightVnd` = trần QR có cờ = 792.000; không cờ trần 0; `extraNightRateVnd` → 422; B18 `lateFeeInsteadOfNight` → 200, folio 2.376.000, 0/0. | Phần tiền đạt. Đường mới chưa đạt SEC D5: BUG-R2-146, 148, 149, 150, 153, 154. |
| BUG-R2-140 | P3 | ĐÃ SỬA phần API | 302 đổi giá 40.000, đếm lại 2: lần đếm = `latestCheck` = folio = 70.000, snapshot 35.000. | Phần Desk H16 bước 1 (FE-A) chưa kiểm UI. Giữ Open tới khi QA kiểm. |
| BUG-R2-142 | P3 | ĐÃ SỬA | Oracle BR-807-01: nhận phòng 14:00, J8 bù 15:00 → OC, 0 việc; 07:00 hôm sau → OD, 1 việc. Đỏ ở 42fb458. | Không chạm tiền. Bản sửa gây hồi quy R4RATE-02 → BUG-R2-151. |
| BUG-R2-143 | P1 | ĐÃ SỬA | r3dep Q1 chạy lại: phí 200.000, hoàn 300.000 (min(500.000; 400.000; 1.334.000) × 50 %). BR-309-15: hoàn 250.000, phí 250.000. F8 mức giữ + khóa: 900.000 / 900.000. Dời thử = dời thật. | – |
| SEC BE-59…64 (D5) | – | CHƯA ĐẠT | Đạt BE-59 (1)(3)(4)(5)(6), BE-60, BE-61, BE-63. Không đạt BE-59 (2), BE-62 một phần, BE-64. | Xem R4LATE-01, 03, 06, 07. |

BUG-R2-141 (FE, H16 tải lại tóm tắt) không chạm tiền, nằm ngoài bảng.

## Critic chạy lại các mã chưa sửa

Chạy một lần trên DB mới `ottimo_test_s438_r4critic`, cây 365486f, không sửa src. Log đổi hướng về `scratchpad/s438/r4critic/` (`S438_OUT`, `K1_OUT`). Ba tệp test SEC của r4late được chép sang `test/s438/r4critic/`, `h.ts` đổi `OUT_DIR` sang `r4critic/late`. Kết quả 61 ca: 47 xanh, 14 đỏ. 14 ca đỏ đúng các ca người báo đã đếm.

- **BUG-R2-133** (`w-r2move-1-0/origin-fallback`, `w-r2move-1-1`, `r3regr/fixed/r2move` R18): 6 ca đỏ.
  - W1 (203 → B7a `upgraded` 401 → sự cố 101 → khách xin 402, origin NULL): chênh lệch `[]`, xem trước = ghi = 0. Đúng là 208.000 × 2. Căn gốc lưu `401`.
  - W3 (chỉ B7a rồi khách xin 402): 0. W4 (xin tiếp sang 302): `[]`, đúng là 125.000 × 2.
  - Đối chứng xanh: W2 (origin còn lưu) 416.000; W4 không B7a 416.000.
  - Kết luận: lỗi P3 còn nguyên, chỉ chạm dữ liệu origin NULL trước 0059.
- **BUG-R2-123** (`r2regr/old__v-move-3-1__k1-restore-lane-assign`, 5/5 xanh): log `S1-move-preview` trả 422 `overbookingResolution REQUIRED`. Gán căn 201 trả 200. Lỗi P3 còn nguyên.
- **SEC BE-59…64** (báo "chưa đạt"): 8 ca đỏ, cùng hành vi người báo.
  - X1: `mTemp` (`locked_until` 2031, `active`) đăng nhập → 429; B18 với `mTemp` + FOC 396.000 → 200, đơn `checked_out`, `approval_request` do `mTemp` duyệt. S7, S1 (`login-locked`): 409 `BALANCE_DUE` thay vì 401 đồng nhất, bộ đếm người gọi +0. → R4LATE-01.
  - X2, S3: giữa kỳ 10:00, không `checkoutTime`: sai → 401, bộ đếm FD 1 / MGR 1; đúng → 422 `checkoutTime REQUIRED`. Thiếu `amountVnd`/`reason`, `requestFoc` sai khuôn: 401 và đếm 1/1. → R4LATE-03.
  - S9: gửi lại B18 cùng `Idempotency-Key` → 409 `INVALID_TRANSITION`, không có `Idempotent-Replayed`. → R4LATE-04.
  - E3: MGR gọi, OWN xác nhận: `approval_request` `requested_by` = `approver_id` = MGR. → R4LATE-06.
  - E4: 5 lần sai trên mgr2: `security_alert` chỉ tới fd4 và mgr2, không tới OWN. → R4LATE-07.
  - Đối chứng xanh: X3 (FD gọi, MGR xác nhận, `auth_method password`), S2 (trung vị 32–33,6 ms, tỉ lệ 1,05), S5, S6, S10 (0 lần lộ secret trong 864 dòng log).

Critic đọc lại mã ở 365486f cho các gốc Major và Minor. Mã khớp mô tả của người báo:
- `identity/public/password-reauth.ts` `verifyApprover`: `eligible` (159–164) chỉ xét `status`, `must_change_password`, `mfa_enabled`, vai. SELECT (~145) không lấy `locked_until`. `lockedFor` chỉ xét `approval_pin_locked_until`.
- `frontdesk/internal/checkout.service.ts` `lateFeePrecheck` (352–380): dòng 370 `if (!time && !at) return;`.
- `frontdesk/internal/frontdesk.controller.ts`: 429 gọi `lateFeeApprover` trước `uow.run` (430). `onLocked` (145–149) chỉ gửi `userIds: [userId]`.
- `folio/public/folio.service.ts` `nightRateBasis` (1097): dòng 1124 `late_checkout` → `last.unit_price_vnd`, không xét `charge_code`.
- `frontdesk/internal/stay-support.ts`: `minApplies` (246–250) gồm `'ota'`; 287 `moved = boughtRoomId !== roomId`.
- `reservations/internal/room-history.ts` `boughtRoomOf` (59–66): căn của lần `guest_request` cuối, không xét lần quay về.
- `inventory/internal/fridge.ts` `writeFill` (~111–113): `source` ghi cứng `'check_in'`. Cả `src` chỉ **đọc** `'refill'` ở `minibar.service.ts` 191, không chỗ nào ghi.
- `minibar.service.ts` 116: HK đếm `checkout` chỉ khi `departureDate === today`.
- `housekeeping/public/worker-jobs.ts` 120 và `room-status.service.ts` 131, 153: `COALESCE(p.arrival_date, r.arrival_date)`, không xét đơn con B9a đứng trước.
- `db/migrations/0065_minibar_fill.sql`: không có bước đồng bộ khóa FOC.

## Critic – phân xử phát hiện mới

| Mã | Kết luận | Mức | Ai sửa | BUG đề xuất | Lý do |
|---|---|---|---|---|---|
| R4MINI-01 tủ quay lại trong lượt (B14 về căn cũ, S4-09 ghi nhận quay về): lần đếm sau bổ sung thay lần đếm kỳ trước; B18 không đòi đếm lại | **Major-fix-now** | P1 | BE-B (+ BE-A điểm gọi, ARC câu chữ R1/R7, FE-A H16) | BUG-R2-144 | 2/2 tái hiện, 4 + 4 ca, 3–5 lượt mỗi người, đều P1. Thu thiếu 70.000–95.000 khi lễ tân đếm đúng; Y1b mất 70.000 khi kỳ 2 dùng bằng kỳ 1 (R6 coi là xác nhận lại). Không đếm thì B18 vẫn 200, mất trọn phần kỳ sau. Desk không thấy `latestCheck` trong khi server coi tủ đã đếm. Trái BR-703 ("so với mức sau lần bổ sung gần nhất, không tính trùng"), BR-703-01, BR-702, ARC R3/R7/R9. Luồng S4-09 `until_parent_departure` luôn đưa khách về căn cũ, nên không hiếm. Không do bản sửa: M-1 thiết kế nguồn `refill` nhưng chưa cài; trước M-1 lỗi rộng hơn (BUG-R2-136). Có lỗi thứ hai ẩn sau: kể cả có lần nạp `refill`, `history()` vẫn trả dòng sống của kỳ trước. |
| R4RATE-01 S4-09 khách OTA xin đổi tạm sang căn rẻ hơn rồi về căn cũ: đêm thêm B13/B18 ở căn cũ lấy min(căn rẻ, căn cũ) | **Major-fix-now** | P1 | BE-A (+ DOM/ARC một dòng) | BUG-R2-145 | 2/2 tái hiện, đều P1, 2 lượt mỗi người. Agoda 202 → 101 (`guest_request`) → về 202: gợi ý = trần QR = ghi = 767.000 thay 911.000, tổng 3.951.000 thay 4.095.000, thu thiếu 144.000/đêm. Cùng gốc làm `lateFeeAsNightVnd` (BR-416-06) ra 767.000. Sang căn đắt hơn: số đúng nhưng `currentBookingRateVnd` khác `null`. Trái BR-417 v0.3.8 (min chỉ sau OTTIMO đổi căn), BR-417-10, ARC 16.6 (a) (3), BR-416-06. **Hồi quy do vòng sửa 3**: 42fb458 cho 911.000; một người tái hiện còn trả riêng hai tệp về 42fb458 để đối chứng. Đường hẹp, gõ tay 911.000 vẫn ghi được, nhưng thu thiếu im lặng: giữ P1 theo tiền lệ R3RATE-01. |
| R4LATE-01 quản lý đang bị khóa đăng nhập tạm (`locked_until > now`, `active`) vẫn xác nhận BR-416-06 và duyệt FOC | **Major-fix-now – lỗ hổng bảo mật, SEC phải xem** | P1 | BE-A (SEC kiểm lại BE-59) | BUG-R2-146 | 2/2 tái hiện, đều P1; critic chạy lại: đỏ. Tài khoản bị khóa đăng nhập duyệt FOC 396.000 và chốt B18. Mật khẩu đúng cho 200/409, sai cho 401: kênh dò mật khẩu vòng qua khóa đăng nhập (chỉ còn SR-RL-02 5 lần/15 phút). Trái SR-AUTH-11 (2), (3), SEC BE-59 (2) (thẻ Major) và hợp đồng `checkOut` ("không khóa đăng nhập"). **Do vòng sửa 3**: `verifyApprover` mới có ở 365486f. Tiền ghi đúng số; lỗi ở người được phép duyệt. |
| R4MINI-03 0065 đổi khóa FOC minibar theo món nhưng không đồng bộ lại FOC của folio đang mở; dữ liệu dạng BUG-R2-135 vẫn áp thừa | Minor (tính vào G1 tới khi có một trong hai lối ra) | P2 | BE-B (+ OPS/DATA, ARC §16.3) | BUG-R2-147 | 2/2 tái hiện, đều P2. Cả hai người dựng dữ liệu bằng chính app 42fb458 rồi chạy 0065 thật. Z/R/J: FOC −70.000 trên 35.000, folio 715.000 / 757.000 thay 750.000 / 792.000; H16 cùng số đi nhánh giữ dòng R6, không đồng bộ; B18 422 `OVERPAYMENT_HANDLING_REQUIRED`. Không âm thầm: tóm tắt báo `credit_balance`. Chỉ chạm lượt đang ở lúc chạy 0065 có dữ liệu lỗi của bản chưa phát hành. Hạ P3 nếu OPS xác nhận không mang lượt `in_house` thời S4 sang môi trường dùng thử. |
| R4LATE-02 MGR không tự miễn đủ phụ thu thay đêm khi khoản này lớn hơn giá đêm cuối đã ở (thứ Sáu/Bảy, ngày lễ, ≥ 7 đêm) → 403 | Minor | P2 | BE-A + BE-B (`nightRateBasis`); DOM một dòng | BUG-R2-148 | 2/2 tái hiện, đều P2. 911.000 / 1.030.000 / 792.000 (đêm cuối 713.000): 403 `APPROVAL_LIMIT_EXCEEDED`, không ghi gì. Ranh giới đúng bằng giá đêm cuối (713.001 → 403). Trái BR-416-06 ("khoản này ≤ giá 1 đêm nên quản lý tự áp được") và DOM 18/10 ESC-024. Không sai tiền, đơn không kẹt (OWN xác nhận, hoặc miễn một phần). Do vòng sửa 3. |
| R4LATE-03 BE-64: thiếu `checkoutTime`, `checkoutAt` hỏng, thiếu `amountVnd`/`reason`, `requestFoc` sai khuôn, hoặc chưa tới ngày đi thì mật khẩu vẫn bị thử và đếm | Minor – **lỗ hổng bảo mật, SEC phải xem** | P2 | BE-A (SEC kiểm lại BE-64) | BUG-R2-149 | 2/2 tái hiện, đều P2; critic chạy lại: đỏ. Sai → 401 đếm 1/1; đúng → 422/409: FD dò được mật khẩu MGR trên mọi đơn `in_house`, mọi giờ, và khóa được MGR 15 phút bất kỳ lúc nào. Người tái hiện thêm biến thể có `checkoutTime` nhưng chưa tới ngày đi (409 `INVALID_TRANSITION` sau mật khẩu). Trái hợp đồng `checkOut` 18/10 ("422/409 kiểm trước mật khẩu và không đếm"). SEC xếp BE-64 Minor, nhưng hợp đồng đã ghi thành quy tắc. Do vòng sửa 3. |
| R4LATE-04 gửi lại B18 `lateFeeInsteadOfNight` cùng `Idempotency-Key` sau 200 → 409, không trả phản hồi đã lưu | Minor | P2 | BE-A (+ ARC/SEC chốt thứ tự) | BUG-R2-150 | 2/2 tái hiện, đều P2; critic chạy lại: đỏ. Đối chứng B18 thường replay đúng. Cùng key khác body cũng 409 thay 422 `IDEMPOTENCY_KEY_REUSED`. Tiền đúng, không ghi trùng, nhưng Desk báo lỗi cho B18 đã xong; hàng chờ offline xếp vào "Không áp dụng được". Trái coding-standards 6.5 và 1a. Do vòng sửa 3 (precheck chạy trước `uow.run`). |
| R4RATE-02 khách OTA nhận phòng trước 06:00 bằng B9a (đơn con đêm trước) bị coi là "đến hôm nay": J8 07:00 và B13 giữ OC, không sinh việc dọn | Minor | P2 | BE-C (+ BE-A, DOM một dòng oracle) | BUG-R2-151 | 2/2 tái hiện, đều P2, có Booking.com. Trực tiếp cùng tình huống thì OD + 1 việc. Mất trọn 1 ngày dọn ở lại mỗi lượt như vậy. Trái BR-807-01, BR-417 (3)(4). **Hồi quy của bản sửa BUG-R2-142**: trả riêng hai tệp về 42fb458 thì xanh. Không sai tiền. |
| R4MINI-02 HK không ghi được lần đếm tủ căn cũ trong ngày B14 (404), dù GET tủ đó trả 200 | Minor | P2 | BE-B (+ QA ô 16.5) | BUG-R2-152 | 2/2 tái hiện, đều P2. HK có việc `checkout_clean` căn 302 nhưng POST → 404; lễ tân làm cùng lệnh → 201 và có việc bổ sung. Cổng chặn theo ngày đi của đơn, không theo tủ. Trái BR-703 ("buồng phòng đếm khi dọn"), BR-703-01, ARC 16.5. B18 vẫn chặn nên không mất dòng; rủi ro sai số khi đếm muộn. Không do bản sửa, nhưng M-1 chưa mở phạm vi HK cho tủ căn cũ. |
| R4LATE-06 MGR gọi B18, nêu OWN xác nhận, kèm `requestFoc`: FOC do người gọi tự duyệt | Minor (SEC xem cùng BE-62) | P3 | BE-A (+ BE-B nếu cần cờ tắt tự áp; DOM/ARC một câu) | BUG-R2-153 | 2/2 tái hiện, đều P3; critic chạy lại: đỏ. Ngược lại (OWN gọi, MGR xác nhận) cũng sai. Tiền đúng, không leo thang quyền. Sai người chịu trách nhiệm ở `approval_request`, lệch audit money, lệch đếm `foc_count_per_approver` (BR-435). Hợp đồng ghi "người duyệt = người xác nhận"; DOM (r3-4) ghi "OWN/MGR tự áp trong hạn mức", cần một câu làm rõ là người xác nhận. Phụ: MGR tự xác nhận thì `auth_method` = `null`. |
| R4LATE-07 BE-62 chưa đủ: không gửi `security_alert` cho OWN khi người xác nhận bị khóa; audit money thiếu `approverRole`, có `confirmedByUsername` | Minor – **SEC phải xem** | P3 | BE-A (SEC kiểm lại BE-62) | BUG-R2-154 | 2/2 tái hiện, đều P3; critic chạy lại: đỏ. OWN không nhận gì qua mọi kênh (thông báo, push, attention). Thiếu kiểm soát phát hiện của thẻ Major BE-62 / SR-AUTH-11 (6). `confirmedByUsername` là tên chuẩn trong DB, không lộ mật khẩu; phần này nhẹ nhất, SEC quyết giữ hay bỏ. Do vòng sửa 3. |
| R4LATE-05 QR `check_out` tạo khi đêm còn bán được (`extraNightRateVnd`), sau đó đêm bị bán: số còn phải thu lúc xác nhận = 0 | **CLOSED-not-real** | – | – (NÊN: ARC/DOM gộp D8, FE-A gợi ý) | – | 2/2 tái hiện, cả hai not-a-bug. Hợp đồng `confirmPaymentReceived` tính "trần đúng mục đích … với **ngữ cảnh đã lưu** lúc tạo"; ngữ cảnh không có `lateFeeAsNight`, nên trần 0 là đúng (tạo QR cùng ngữ cảnh lúc 19:00 → 422, max 0). D6 bác "tự cộng khi không bán được"; DOM (f) bắt buộc ghi chú khi vượt. Tiền cuối đúng: B18 `lateFeeInsteadOfNight` 0/0. Người báo chỉ trích nửa câu hợp đồng. |

Phân loại bảo mật cho SEC:
- Lỗ hổng khai thác được: **BUG-R2-146** (P1) và **BUG-R2-149** (P2). Cả hai trên đường xác nhận lại mật khẩu của D5.
- Thiếu kiểm soát phát hiện / audit: BUG-R2-154 (thẻ Major BE-62), BUG-R2-153 (người duyệt FOC, BE-62).
- Cần SEC chốt thiết kế khi sửa: BUG-R2-150. `secret` không nằm trong mã băm, nên sau khi sửa, gửi lại với mật khẩu sai sẽ nhận 200 đã lưu mà không ghi gì.

## Major-fix-now theo gốc (danh sách sửa cho BE)

| BUG đề xuất | Phát hiện | Ai sửa | Chỗ sửa (365486f) | Số đúng cho test |
|---|---|---|---|---|
| BUG-R2-144 | R4MINI-01 | BE-B (+ BE-A, ARC, FE-A) | (1) `inventory/internal/fridge.ts` `writeFill` (~111): ghi lần nạp `source = 'refill'` khi xong việc `minibar_refill` (housekeeping `transitionHkTask`) và khi lượt quay lại một tủ đã đếm có tính tiền (B14 về căn cũ, `roomReturnRecorded`). (2) `minibar.service.ts` `history()` (~183–195) và `record()`: lần đếm sau lần nạp `refill` là kỳ mới, ghi dòng riêng; không đảo, không giữ dòng của kỳ trước. (3) `minibar-checkout.port.ts` `checkoutStatus`: tủ "đã đếm" chỉ khi có lần đếm sau lần nạp gần nhất. (4) `standard()`: `latestCheck` nhất quán với `checkoutStatus`. ARC: sửa R1/R7 thành "dòng sống của **kỳ nạp hiện tại**", nêu lúc ghi lần nạp `refill`, thêm ca quay lại tủ đã đếm vào 16.4. FE-A: H16 bước 1 hiện tủ cần đếm lại. | B3: 202, 19–22/03/2029, t0 2.376.000. 20/03 B14 sự cố → 203; đếm 202 dùng 2 bia: 70.000 + 1 việc bổ sung (HK xong việc). 21/03 đếm 203 dùng 0, B14 về 202; khách dùng 1 bia. 22/03: B18 chặn `minibar_not_checked` cho 202; đếm 202 còn 1/2: minibar **105.000**, dòng 70.000 không bị đảo, tổng **2.481.000**. Không đếm: B18 409. 301 bia 2 + coca 1 (95.000), kỳ sau bia 1: **130.000**. Kỳ sau dùng bằng kỳ trước (bia 2): **140.000**. S4-09: Agoda 203 + đơn con, quay về 203, kỳ sau bia 1: **105.000**. Đối chứng: đếm lại cùng tủ trong cùng kỳ vẫn thay lần trước (R1/R7), giữ dòng R6. |
| BUG-R2-145 | R4RATE-01 (hồi quy vòng sửa 3) | BE-A (+ DOM/ARC) | `frontdesk/internal/stay-support.ts` `addedNightContext` (~246–255) và `addedNightRate` (~287–294); `reservations/internal/room-history.ts` `boughtRoomOf` (59–66). Chỉ áp min khi có lần đổi căn do OTTIMO (lý do ≠ `guest_request`) **sau** lần khách xin cuối, và căn hiện tại khác căn khách mua sau lần đó. Cách tương đương: đêm con sau `until_parent_departure` đã ghi ngày về thì căn khách mua là căn cũ. Áp cho B13, B18 (`extraNightDefaultRateVnd`), `lateFeeAsNightVnd`, `currentBookingRateVnd`. DOM/ARC thêm một dòng "căn khách mua" cho S4-09 `guest_request` ở BR-417 và 16.6 (a). | Agoda 202, 2 NL, 03–05/07/2028 (1.600.000); B13 +2 đêm con ở 202, 792.000 × 2; 04/07 khách xin B14 sang 101, `until_parent_departure`, chênh 0; 05/07 ghi khách về 202. B13 đêm 07/07 (thứ Sáu): gợi ý **911.000**, `currentBookingRateVnd` = `null`; B18 gợi ý = trần QR = ghi = **911.000**; tổng **4.095.000**. 302 thay 101 (đắt hơn): 911.000, `currentBookingRateVnd` = `null`. 202 đã bán từ thứ Sáu: `lateFeeAsNightVnd` = trần QR = ghi = **911.000**. Đối chứng (đang xanh): `property_fault` cùng đường 911.000; không đổi căn 911.000; T1–T18 giữ số. |
| BUG-R2-146 | R4LATE-01 (hồi quy vòng sửa 3, bảo mật) | BE-A (SEC kiểm lại) | `identity/public/password-reauth.ts` `verifyApprover`: SELECT (~145) thêm `u.locked_until`; `eligible` (159–164) thêm `status = 'active'` và (`locked_until IS NULL` hoặc `≤ now`). Tài khoản khóa đăng nhập đi nhánh băm giả, không kiểm mật khẩu thật. Thêm ca `login-locked` vào test 401 đồng nhất (r4late S1). | `mTemp` `active`, `locked_until` 2031-01-01; đăng nhập → 429. 203, 15–17/01/2030, đã thu đủ, 19:00. B18 `lateFeeInsteadOfNight` với `mTemp`, mật khẩu đúng, FOC 396.000, tiền mặt 396.000 → **401 `REAUTH_FAILED`** trên `lateFeeInsteadOfNight.secret`, thân giống hệt 11 loại tài khoản không hợp lệ; đơn giữ `in_house`; không `approval_request`, không audit money; bộ đếm người gọi +1, `mTemp` +0 (r3-5). Không gửi `finalPayment` cũng 401 (không phải 409). Đối chứng: `mgr` đủ điều kiện → 200, FOC 396.000, 0/0, folio 1.980.000. |

Việc chung cho 3 mã:
- Chuyển ca của người tái hiện (`y-r4mini-0-*`, `y-r4rate-0-*`, `y-r4late-0-*`) vào `test/integration/`, kỳ vọng theo số ở bảng trên.
- Thêm dòng oracle vào `br-examples.json`: BR-703 tủ quay lại sau bổ sung (105.000 / 130.000 / 140.000); BR-417 S4-09 `guest_request` rồi về căn cũ (911.000); SR-AUTH-11 không có oracle tiền, thêm ca test SEC bắt buộc.
- Mỗi bản sửa kèm ca hồi quy cho các đường kề: S4-09 cả `guest_request` lẫn `property_fault`; đơn con OTA B9a/B13/B18; tủ một kỳ và nhiều kỳ; người xác nhận ở mọi trạng thái tài khoản.
- BUG-R2-144 là lỗ hổng thứ tư liên tiếp của minibar. BE-B cài trọn khái niệm "kỳ nạp" của M-1 (ghi, đọc, chặn B18), không vá riêng đường quay lại. ARC duyệt câu chữ R1/R7/R9 trước khi code.

## Minor và Note – kế hoạch

| Mã | Mức | Ai | Kế hoạch |
|---|---|---|---|
| BUG-R2-147 (R4MINI-03, FOC áp thừa sau 0065) | P2 | BE-B + OPS/DATA + ARC | **Một trong hai lối ra trước khi chấm G1.** (a) BE-B thêm bước dữ liệu chạy một lần sau 0065 (script hoặc job khởi động): `FolioService.syncReductions` cho mọi folio mở có FOC minibar. ARC thêm dòng này vào §16.3. (b) ORC/OPS ghi decision-log: không mang lượt `in_house` thời S4 sang môi trường dùng thử, kèm truy vấn "folio mở có Σ FOC minibar áp > Σ dòng sống của món" = 0; khi đó hạ P3. Số đúng: Z (102) **750.000**, R (202) và J (203) **792.000**; A applied, B dormant, ròng 0; B18 200 thu 0. Đối chứng K (một FOC): 667.000. |
| BUG-R2-148 (R4LATE-02, hạn mức MGR cho phụ thu thay đêm) | P2 | BE-A + BE-B; DOM | DOM ghi một câu: cơ sở hạn mức BR-433 cho dòng `late_fee_as_night` = giá đêm ngày đi (= chính khoản). `folio.service.ts` `nightRateBasis` (1097–1131): nhánh `charge_code = 'late_fee_as_night'` trả số tiền dòng. Số: 203, thứ Tư 18 → thứ Sáu 20/09/2030, phụ thu 911.000, MGR miễn 100 % → 200, 0/0. 14–16/04/2027 (Giỗ Tổ): 1.030.000 → 200. 7 đêm 01–08/10/2030: 792.000 → 200. Đối chứng: phụ thu trả muộn thường (BR-433-02) vẫn theo đêm cuối. Sửa cùng vòng. |
| BUG-R2-149 (R4LATE-03, BE-64) | P2 | BE-A; SEC | `frontdesk.controller.ts` `lateFeeApprover` (~98–135) và `checkout.service.ts` `lateFeePrecheck` (352–380): bỏ `if (!time && !at) return`. Trước `verifyApprover` chạy đủ: `checkoutTime` bắt buộc và đúng khuôn, `checkoutAt` (`DATE_INVALID`), `lateFeeInput` (`amountVnd`, `reason`, `requestFoc.kind`/`authMethod`/`secret`), ngày đi / cửa sổ sau nửa đêm (409 `INVALID_TRANSITION`), rồi `NOT_ALLOWED`, `SURCHARGE_CHANGED`. Số: giữa kỳ 10:00 không `checkoutTime`: sai và đúng mật khẩu cùng 422 `checkoutTime REQUIRED`, bộ đếm 0/0; thiếu `amountVnd` → 422 `REQUIRED`; `kind = special_discount` → 422 `NOT_IN_LIST`; `requestFoc.secret` → 422 `NOT_ALLOWED`; có giờ 19:00 nhưng chưa tới ngày đi → 409, 0/0. **Sửa cùng vòng** (cùng tệp với 146). |
| BUG-R2-150 (R4LATE-04, idempotency) | P2 | BE-A; ARC/SEC | `frontdesk.controller.ts` `checkOut` (~429): tra `Idempotency-Key` đã hoàn tất (cùng người gọi, method, path, băm không `secret`) **trước** `lateFeeApprover`. Khớp → 200 đã lưu, `Idempotent-Replayed: true`; băm lệch → 422 `IDEMPOTENCY_KEY_REUSED`. SEC thêm bước 0 vào thứ tự BE-64. Số: 203, 16–18/04/2030, B18 + tiền mặt 792.000 → 200; gửi lại → 200 replay; folio 2.376.000, 0/0, 1 thông báo, bộ đếm 0/0. Sửa cùng vòng. |
| BUG-R2-151 (R4RATE-02, J8 với B9a OTA) | P2 | BE-C (+ BE-A) | `worker-jobs.ts` (~112–120) và `room-status.service.ts` `arrivedToday`/`stayContinues` (131, 153): ngày đến của lượt = LEAST(ngày đến đơn, ngày đến đơn cha, MIN ngày đến các đơn con B9a `in_house`/`checked_out` cùng đơn cha), dùng chung một hàm, cả cột `nights` (luật thay ga). DOM thêm một dòng oracle BR-807-01 cho B9a. Số: Agoda 302, 14–16/08/2028, B9a 04:30 → J8 07:00 ngày 14/08: **OD + 1 `stayover_clean`** (như Trực tiếp 203). B13 cùng ngày: OD/1. Đối chứng oracle (đến 14:00, J8 bù 15:00): OC/0. Hồi quy, sửa cùng vòng. |
| BUG-R2-152 (R4MINI-02, HK tủ căn cũ ngày B14) | P2 | BE-B; QA | `minibar.service.ts` `stay()` (113–117): HK đếm `checkout` được khi `roomId` là tủ căn cũ của lượt (khác căn đang gán), có thể giới hạn khi HK có việc dọn căn đó hôm nay. Số: 302, 26–29/03/2029, B14 27/03 10:00 → 401; 11:00 HK đếm 302 dùng 2 → **201**, dòng 70.000 (HK không thấy tiền), 1 việc `minibar_refill` số lượng 2. QA thêm ô 16.5 "HK mở H16 tủ căn cũ trong ngày". Sửa cùng vòng nếu kịp (cùng BUG-R2-144), không thì tuần Ổn định. |
| BUG-R2-153 (R4LATE-06, người duyệt FOC) | P3 | BE-A (+ BE-B); DOM/ARC | `checkout.service.ts` (~647–670) và `StaySupport.requestFoc` (`stay-support.ts` 553): khi người xác nhận khác người gọi, gửi yêu cầu không tự áp rồi `approve` bằng người xác nhận (hoặc tự áp dưới danh tính người xác nhận); ghi `auth_method = password` và snapshot người xác nhận (cả khi MGR tự xác nhận). Số: 203, 29–31/01/2030, MGR gọi, OWN xác nhận, FOC 200.000, tiền mặt 592.000 → 200, `approver_id` = OWN, vai `owner`, `auth_method` `password`; 0/0. Sửa cùng 146. |
| BUG-R2-154 (R4LATE-07, BE-62) | P3 | BE-A; SEC | `frontdesk.controller.ts` `onLocked` (145–149): thêm OWN của cơ sở vào `security_alert`. `checkout.service.ts` (~675–692) và allowlist `reservations.module.ts` (58–66): thêm `approverRole`; SEC quyết bỏ hay giữ `confirmedByUsername`. Số: fd4 sai 5 lần trên mgr2 → `security_alert` tới mgr2, fd4 **và OWN**. Sửa cùng 146 (điều kiện D5). |
| N-1 Void dòng minibar rồi đếm lại cùng số → giữ "không dòng", FOC ngủ rồi hủy khi chốt | Note | DOM, QA | Đúng thiết kế (BR-702 v0.3.8 "số nào thắng", ARC 16.4 ca 9). Nhưng nếu lễ tân void nhầm, OTTIMO mất 70.000; lối ra là đếm khác số hoặc ghi lại dòng. DOM xác nhận câu chữ; QA sửa tiêu đề BUG-R2-129 (bỏ "hoặc void dòng … đếm lại > 0 → FOC tự khôi phục" cho trường hợp cùng số). Desk nên cảnh báo khi void dòng minibar có FOC. |
| N-2 Tỉ lệ 409 `CONCURRENT_UPDATE` khi duyệt FOC ‖ đếm lại tăng (5–13/24 vòng so với 1–3/24) | Note | QA/OPS, FE-A | Hợp đồng cho phép 409 (không ghi gì, có Retry-After). Có lẽ `record()` của M-1 giữ khóa folio lâu hơn (đoán từ mã, chưa đo). QA/OPS theo dõi trên stack dùng thử; Desk/HK tự thử lại hoặc báo lễ tân. Không chặn cổng. |
| R4LATE-05 | CLOSED-not-real | ARC/DOM, FE-A | NÊN: gộp vào D8 (cảnh báo khi bán đêm có QR `check_out` chờ, R3). Đổi kỳ vọng `r4late-qr` Q3 (mục dưới). |
| BUG-R2-133 (fallback căn gốc) | P3 | BE-A | Tuần Ổn định. Số đúng: 208.000 × 2; xin tiếp sang 302: 125.000 × 2. OPS đếm đơn origin NULL trước khi đưa dữ liệu cũ vào. |
| BUG-R2-123 | P3 | BE-A + ARC | Tuần Ổn định. |
| BUG-R2-140 (phần Desk) | P3 | FE-A; QA | QA kiểm H16 bước 1 hiện số folio (70.000) trên UI. Không chặn cổng. |

## Test cũ phải đổi kỳ vọng

Các thay đổi dưới đây không phải lỗi mã. Mỗi chỗ có ghi chú `r4old: EXPECTATION CHANGE (365486f)`, `r4mini EXPECTATION CHANGE`, `r4late EXPECTATION CHANGE` hoặc `r4rate EXPECTATION CHANGE`. Bản đã đổi nằm ở `r4old/fixed/`, `r4mini/old/`, `r4late/old-*`, `r4rate/old/`. Các người kiểm đổi độc lập những ca trùng nhau (R11, R13, x-r3mini-3/5, F5a–c, X1, A1, L1) và ra cùng số.

**(a) Theo mô hình minibar M-1 (ARC 16.2, BR-702 v0.3.8, DOM (e)).**

| Tệp / ca | Cũ → mới | Căn cứ |
|---|---|---|
| r2foc-attack M2b, r3pay/old-r2foc-attack M2b; w-r2foc-1-0 B, w-r2foc-1-1 K3, r3mini/exp-w-r2foc-1-0 B; w-r2foc-2-0 A/B, w-r2foc-2-1 K1/K2 | Void hoặc lễ tân sửa rồi đếm lại cùng số: 827.000 / 35.000 / `applied` → 792.000 / 0 / `dormant`, rồi `cancelled settled_while_dormant` khi chốt | ARC 16.4 ca 9, BR-702 v0.3.8; Note N-1 |
| w-r2regr-2-0 (5 ca), w-r2regr-2-1 C1/C3/C4; r3mini R9, R9b, R10, R17; x-r3mini-3-0 X3, x-r3mini-3-1 X5; x-r3mini-4-0 A/C/D, x-r3mini-4-1 A/K2 | Món tắt hoặc định mức 0 vẫn trong tủ: lệnh đếm phải gửi đủ món (thiếu → 422 `MINIBAR_ITEMS_INCOMPLETE`); ca `NOT_IN_LIST` cũ nay đếm được, giữ 70.000 | ARC 16.2 R2/R3 |
| r3mini R13; x-r3mini-3-0 X4; x-r3mini-3-1 X2 | Còn lại tính theo mốc lần nạp, không theo định mức hiện hành: "còn 2" → 201 thay 422; R13 dùng 2 trên mốc 2 → 70.000 | ARC 16.2 R2, BR-702-02 |
| r3mini R11; x-r3mini-5-0 X3; x-r3mini-5-1 X2 | Phần dùng thêm sau đổi giá tính giá lúc nạp: R11 35.000 (không 40.000); X3 35.000/−35.000, ròng 0 (không 5.000); X2 857.000 (không 862.000) | BR-702-04, R5 |
| r3mini R6; x-r3mini-4-0 B, x-r3mini-4-1 K1 | Số folio thắng: R6 → 35.000; `latestCheck` = folio 35.000 | DOM (e), R10 |
| r3mini R15 (đua duyệt ‖ đếm) | Chấp nhận 409 `CONCURRENT_UPDATE` ở một phía; bất biến tiền giữ (pending chưa áp, hoặc đếm không ghi gì) | openapi (mọi lệnh ghi), M-1 R8; Note N-2 |

**(b) Theo BUG-R2-139 / BR-416-06 (ARC 16.6 (d), D5/D6).**

| Tệp / ca | Cũ → mới | Oracle |
|---|---|---|
| r3pay-edges F5a, F5b, F5c; x-r3pay-0-0 A, C; x-r3pay-0-1 MAIN | Tóm tắt 0 → 792.000 (gồm `lateFeeAsNightVnd`); QR `check_out` phải gửi `lateFeeAsNight` (không cờ: trần 0); B18 `lateFeeInsteadOfNight` (MGR xác nhận) → 200, 0/0. MAIN phủ bằng ca A' cùng kịch bản | BR-416-06 |

**(c) Theo DOM (f) / ARC D7.**

| Tệp / ca | Cũ → mới | Căn cứ |
|---|---|---|
| x-r3pay-1-0 X1; x-r3pay-1-1 A, D | Xác nhận QR `addPriorNight` sau khi đêm trước đã bán: 200 → lần đầu 422 `REASON_REQUIRED` (max 1.084.000), gửi lại có `note` → 200 | DOM (f) 18/10 |
| r4late-qr Q3 (test mới của lượt này) | Kỳ vọng `amountDueNowVnd` 792.000 → 0 và 422 `REASON_REQUIRED` max 0 khi không ghi chú; có ghi chú → 200, B18 → 0/0 | `confirmPaymentReceived` "ngữ cảnh đã lưu", D6; R4LATE-05 CLOSED |

**(d) Theo BUG-R2-134 (BR-417-07, BR-104, BE-A 14.1).**

| Tệp / ca | Cũ → mới | Căn cứ |
|---|---|---|
| r3rate/attack-extra X1 | B18 thứ Sáu 05/03/2027 trên 401: 1.042.000 → **1.198.000** (test cũ dùng giá ngày thường) | BR-104, BR-417-07 |
| x-r3rate-0-0 A1 | Gõ đúng số gợi ý nay = để mặc định → 200; bỏ lần gia hạn thứ hai; số 958.000 / 1.102.000 | BR-417-07 |
| w-r2pay-3-0 L1 (bản r3rate/old, r3regr/fixed) | Đêm B13 mặc định 800.000: nguồn `calendar` → `manual`; tiền giữ 800.000 | BE-A 14.1 |

**(e) Giữ đỏ, vì đây là lỗi mã.** Không đổi kỳ vọng:
- BUG-R2-133: w-r2move-1-0 W1, W3; w-r2move-1-1 W2, W3, W4; r2move R18 (bản r3regr/fixed và r3pay/old).
- Phát hiện mới: r4mini B3, B6 (144), B4 (152), MIG2 (147, chạy với `R4_MIG=1`); r4rate T11 (145), D1, D1b (151); r4late X1, S1 phần `login-locked`, S7 (146), F3, F4, F8 (148), X2, S3 (149), S9 (150), E3 (153), E4 (154).

**(f) Note.** r2foc-attack M8, M8b nay xanh (DOM (e)), bỏ khỏi danh sách Note. Còn giữ: v-foc-3-1 C1; c-a2 Y12 (CANCEL-05); w-r2move-2-* (MOVE-03).

**(g) Dọn bộ test cũ.** 209 ca đỏ y hệt 42fb458 là bản kỳ vọng cũ đã có bản đổi xanh. QA đánh dấu "superseded" hoặc bỏ khỏi bộ chạy lại, để lượt sau đo được mục tiêu "0 ca đỏ ngoài Note và BUG-R2-133" mà không phải phân loại lại từng ca.

## Xu hướng

| Lượt | Commit | Phát hiện mới | Major (mã P1) mới | Do vòng sửa trước gây ra | Vùng sinh Major |
|---|---|---|---|---|---|
| 1 | 08dabd3 | 22 | 11 (109…119) | 0 | FOC, đổi căn, hủy/cọc, B9a/B18 |
| 2 | 2f77889 | 15 | 6 (125…130) | 2 (125, 126) | B9a/B18 định mức bảo vệ, giá thỏa thuận, minibar, cọc |
| 3 | 42fb458 | 9 | 5 (134…138) | 1 phần (135); 134 có từ vòng 1 | minibar ×4, giá thỏa thuận |
| 4 | 365486f | 12 | 3 (144…146) | 2 (145, 146) + 6/8 Minor | minibar (kỳ nạp), giá đêm kề, xác nhận lại mật khẩu |

Lỗi sai số tiền mới (không tính bảo mật): lượt 3 có 5 P1 + 1 P2 (139); lượt 4 có 2 P1 (144, 145) + 1 P2 trên dữ liệu cũ (147).

Nhận xét:
- **Có hội tụ, nhưng chưa về 0.** Số Major giảm đều: 11 → 6 → 5 → 3. Đường kích hoạt hẹp dần: lượt 4 cần OTA + đơn con B13 + S4-09 + căn rẻ hơn (145), hoặc quay lại một tủ đã đếm và đã bổ sung (144). Mã cũ không hồi quy lần nào trong lượt này.
- **Mỗi vòng sửa vẫn mở bề mặt mới.** Vòng sửa 3 thêm một đường có xác nhận lại mật khẩu (BR-416-06): 6 phát hiện, 1 P1 bảo mật. Mở min cho đêm con OTA (r3-1): 1 P1. Sửa J8: 1 hồi quy. Tỉ lệ phát hiện do vòng sửa trước gây ra tăng: 2/6 → 1/5 → 2/3 (P1).
- **Vùng còn sinh lỗi:**
  - minibar: vòng thứ tư liên tiếp (095/109 → 129/130 → 135…138 → 144, 147, 152). Lần này M-1 thiết kế đúng nhưng cài thiếu kỳ nạp `refill`;
  - giá đêm kề / "căn khách mua": lượt 2 (126), 3 (134), 4 (145), cùng một khái niệm;
  - đường mới BR-416-06 (bảo mật, idempotency, hạn mức).
- **Vùng đã yên** (0 Major ở lượt 3 và 4): hủy/cọc BR-309 (Q1 sửa đúng), FOC trên chênh lệch đổi căn, B9a/B18 định mức bảo vệ và đêm trước không trống, origin căn gốc (trừ 133 dữ liệu cũ).
- Dự báo: vòng sửa 4 nhỏ, không thêm khái niệm mới, thì lượt 5 có thể về 0 Major. Điều kiện: mỗi bản sửa kèm ca hồi quy cho đường kề (mục "Việc chung").

## Đối chiếu điều kiện của lượt trước

Các điều kiện lấy từ `s4-money-recheck3.md`, mục Khuyến nghị.

| Điều kiện | Trạng thái ở 365486f |
|---|---|
| 1. Đóng BUG-R2-134…138, mỗi mã có test oracle; minibar theo một mô hình ARC duyệt; QA chạy bảng ca tổ hợp | 5 mã xong, có số. Oracle mới: BR-417-07…10, BR-434-16, BR-702-02/03/04, BR-703-01. ARC duyệt M-1 trước khi code. Bảng ca tổ hợp: r4mini phủ rộng (N1–N6, F1–F5, K2–K4, B1–B6); `s4-minibar-matrix` chưa chạy lại từng biến thể. Ca chưa có lần đếm trước: ARC chọn chụp khi danh mục đổi (R2) – đúng. |
| 2. Sửa cùng vòng BUG-R2-139; 140 sửa cùng 137 | 139 xong phần tiền; đường mới chưa đạt SEC D5. 140 xong phần API; phần Desk chưa kiểm. |
| 3. DOM chốt (a)–(f) | Xong (decision-log DOM 18/10, kèm (g) J8 và xác nhận r3-1…r3-4). |
| 4. ARC sửa mô tả; xác nhận khóa FOC theo món | Xong (`openapi-0.3.7.md` mục 16). Còn: câu chữ R1/R7 (kỳ nạp) và §16.3 (đồng bộ FOC sau bù dữ liệu). |
| 5. Lượt 4 chạy lại toàn bộ `r3*`, `x-r3*`; 0 ca đỏ ngoài Note và 133; xem trước = trần QR = ghi ở B13/B18 sau B14 và khi đêm không trống | Xong: 3.117 ca × 3 lượt; 0 ca đỏ do lỗi mã ngoài 133 (sau khi đổi kỳ vọng, `r4old/fixed` 54/54). Xem trước = trần QR = ghi ở mọi ca, nhưng R4RATE-01 nhất quán **sai số**. |
| 6. ORC ghi decision-log S4-37 và S4-47 | S4-37: xong (dòng ORC 18/10). **S4-47: nay kết luận được** (139 đã sửa, QR `check_out` đòi cờ `lateFeeAsNight`) – chưa ghi. |
| 7. QA ghi 134…140; đóng 111, 125…132; thêm 3 dòng oracle lượt 2; gỡ `pendingFix` 16 dòng | Xong phần bug-list. 3 dòng lượt 2 đã có: BR-417-08, BR-417-09, BR-429-20. `pendingFix`: 16 dòng đã gỡ; còn 4 (BR-417-03, BR-602-05, BR-522-03, BR-522-04), chưa test s438 nào đọc. |
| 8. OPS/DATA: chạy 0064 trước khi nhận tải; đếm đơn thỏa thuận thiếu audit và origin NULL | **Chưa thấy** xác nhận OPS. 0065 mới chạy thật từ 0064 trên dữ liệu do app 42fb458 tạo (y-r4mini-2-*), chưa chạy trên dữ liệu thật; lộ ra BUG-R2-147. |
| 9. G5 api và E2E xanh; bổ sung ca gap chạm tiền | api 2.732/2.732 × 2 trên 365486f. **Chưa chạy E2E** trên 365486f. Đua QR ‖ B9 và B18 ‖ QR `check_out`: xong (r4late Q4, Q5). Hoa hồng S4-03: vẫn chưa phủ. |

## Gaps

- Cả 4 hướng không chạy E2E/UI. Chỉ suy từ mã hoặc hợp đồng: Desk H16 bước 1 (BUG-R2-140), bộ chọn tủ khi `minibarUncheckedRooms` có căn cũ, cảnh báo `adjustedAfterLastCheck`, hộp xác nhận `CheckOutPage` (FE-08), Desk gửi `lateFeeAsNight`, ô ghi chú khi QR vượt, xử lý 409 `CONCURRENT_UPDATE`, nút "Giữ giá đơn".
- Migration 0065:
  - chạy thật từ 0064 với dữ liệu do 42fb458 tạo, chưa chạy trên dữ liệu thật;
  - chưa mô phỏng lần đếm cũ lưu dưới id **đơn con** (42fb458 ghi `s.id` = đơn được gọi), có thể ghi trùng dòng khi đếm lại sau 0065. OPS đếm `minibar_check` có `reservation_id` là đơn con của lượt đang ở trước khi chạy 0065;
  - test `r3rate/legacy-0064` không dùng được ở 365486f (cần cột 0065).
- BUG-R2-144: chưa thử B12, B17 (undo nhận phòng bị chặn 409 ở bước dựng). Quan sát chưa xếp lỗi: đếm tủ vào ngày đi cũ rồi B13 thêm 1 đêm → tới ngày đi mới B18 vẫn coi tủ đã đếm. Cùng gốc `checkoutStatus`; DOM xác nhận có thuộc phạm vi BUG-R2-144 không.
- BUG-R2-145: chưa thử nhánh B9a (đơn con đêm trước) trong S4-09. Người tái hiện thứ hai chưa chạy biến thể căn đắt hơn (người thứ nhất đã chạy).
- BUG-R2-151: cột `nights` (luật thay ga) của J8 và `stayContinues` dùng cùng biểu thức, có thể đếm thiếu 1 đêm cho khách OTA có B9a. Chưa kiểm.
- r4late: log chỉ kiểm trên stream pino trong tiến trình, không qua transport production; thời gian phản hồi đo trong tiến trình; đua dùng độ trễ so le. Chưa phủ: dài hạn / HĐ ngoài rời sau mốc cuối khi đêm không bán được; thỏa thuận có đêm ngày đi là ngày lễ; đơn con B9a + BR-416-06; FOC trả muộn đang chờ trước B18; người gọi bị khóa duyệt nhưng chưa khóa đăng nhập; OWN gọi + MGR xác nhận với FOC vượt hạn mức MGR (hợp đồng đòi 403).
- SEC: chưa kiểm sâu ARC-26 (thiết bị tin cậy, trần theo ngày) và ARC-25/US-164 (R3). Rủi ro SEC đã chấp nhận: 429 cho biết tên người xác nhận có thật; FD khóa được màn duyệt của quản lý 15 phút – nay rộng hơn vì BUG-R2-149.
- Minibar chưa phủ: báo cáo FOC tháng (BR-435), hạn mức BR-433 khi FOC đi qua hai tủ, đếm `stayover` (US-033 vẫn đóng).
- Chưa phủ (từ các lượt trước): hoa hồng S4-03 và đơn CTV; đơn dài hạn / HĐ ngoài với `addedNightRate`; trẻ 6–11 tuổi; hủy một phần nhóm (BR-324) sau khóa bậc; đua B13 ‖ B14, B7 ‖ hủy.
- 4 dòng `pendingFix` (BR-417-03, BR-602-05, BR-522-03, BR-522-04) chưa có test đọc. BR-522-04 có thể đã phủ bởi `payments-s3` (SEC-BE-37); QA đối chiếu trước khi gỡ.
- Câu hỏi cho DOM, không tính là phát hiện:
  - T15: đơn thỏa thuận B13 vào đêm đặc biệt ghi nguồn `calendar`, lần B18 sau mất giá thỏa thuận (911.000 thay 650.000);
  - T19: MovePlanner (b1') không kẹp sàn BR-105 (101 → 401 ghi 667.000, sàn 740.000), trong khi B13 cùng căn kẹp 740.000;
  - T1/T2: kẹp sàn làm khách trả 740.000/đêm thêm sau khi OTTIMO dời từ căn 560.000/667.000 sang 401 – đúng BR-417, lệch tinh thần BR-429 (b);
  - F4/F5: dời bằng lý do `other` hoặc `force_majeure` khi còn < 7 ngày không khóa bậc (đúng r3-3), nên `other` là lối lách; FM dời rồi hủy vẫn hoàn 100 % dù BR-309 ghi FM "không hoàn tiền mặt".

## Khuyến nghị cổng QC Sprint 4

**CHƯA.** Với commit 365486f:
- **G1 không đạt** ("0 ca lệch tiền"):
  - BUG-R2-144: thu thiếu 70.000–95.000 khi khách quay lại tủ đã đếm và bổ sung; B18 không chặn;
  - BUG-R2-145: thu thiếu 144.000/đêm thêm sau S4-09 khách xin đổi tạm sang căn rẻ hơn; xem trước = trần QR = ghi nhưng cùng sai;
  - BUG-R2-147: FOC áp thừa 35.000/lượt trên dữ liệu cũ sau 0065 (tới khi có một trong hai lối ra).
- **G7 không đạt** ("0 P0/P1 mở"): 3 mã P1 mới (144, 145, 146). 145 và 146 là hồi quy của vòng sửa 3.
- **Điều kiện SEC D5 chưa đạt**: BE-59 (2) (BUG-R2-146) và BE-62 một phần (153, 154) là thẻ Major. Theo SEC, phải xong trước khi QA tính ca BR-416-06.
- Điểm tốt: 32/34 mã cũ đã sửa có số, 0 hồi quy mã cũ; 8 mã đích vòng 3 đạt; BR-416-06 xem trước = trần QR = ghi ở 12 biến thể; hồi quy chung sạch (2.732 + 3.117 ca).

Điều kiện để vào cổng:
1. Đóng BUG-R2-144, 145, 146. Mỗi mã có test oracle với số ở bảng "Major-fix-now theo gốc".
   - 144: BE-B cài trọn kỳ nạp `refill` (ghi, đọc, chặn B18); ARC duyệt câu chữ R1/R7/R9 trước khi code.
   - 146: SEC kiểm lại BE-59 trên commit sửa.
2. BUG-R2-147: BE-B thêm bước đồng bộ FOC sau 0065, **hoặc** ORC/OPS ghi decision-log không mang lượt `in_house` thời S4 sang dùng thử, kèm truy vấn kiểm = 0.
3. Sửa cùng vòng (rẻ, cùng tệp, phần lớn do vòng sửa 3 gây ra): 149, 150, 153, 154 (đường BR-416-06, cùng tệp với 146); 148 (sau khi DOM ghi một câu); 151 (hồi quy J8). 152 sửa cùng 144 nếu kịp, không thì tuần Ổn định có hạn. SEC kiểm lại BE-62, BE-64 và thứ tự idempotency.
4. DOM ghi các câu sau (không chặn BE bắt đầu sửa):
   - (a) 145: "căn khách mua" khi S4-09 `guest_request` rồi về căn cũ;
   - (b) 144: lần nạp `refill` ghi lúc nào; dòng kỳ trước không bị đảo; ca B13 sau khi đã đếm (Gaps);
   - (c) 148: cơ sở hạn mức BR-433 cho dòng `late_fee_as_night` = giá đêm ngày đi;
   - (d) 153: "OWN/MGR tự áp" ở r3-4 nghĩa là người xác nhận;
   - (e) 151: oracle BR-807-01 cho B9a OTA;
   - (f) Note N-1 và các câu hỏi T15, T19, T1/T2, F4/F5 ở mục Gaps.
5. ARC: câu chữ R1/R7/R9 (kỳ nạp), §16.3 (đồng bộ FOC sau bù dữ liệu), 16.4 (ca quay lại tủ đã đếm), 16.5 (HK tủ căn cũ), thứ tự idempotency với đường xác nhận lại.
6. Lượt kiểm lại lần 5 (ngắn) trên commit sửa:
   - chạy lại toàn bộ `test/s438/r4*/`, `y-r4*/` và `r4old/fixed/`; bộ cũ chỉ chạy các bản không bị đánh dấu "superseded";
   - mục tiêu: 0 ca đỏ ngoài Note và BUG-R2-133; xem trước = trần QR = ghi **và đúng số** ở S4-09, đơn con OTA, tủ nhiều kỳ;
   - SEC chạy lại bộ 401 đồng nhất có ca `login-locked`;
   - critic chấm lại một lượt ngắn.
7. ORC ghi decision-log: S4-47 kết luận (BUG-R2-139 đã sửa); cách chọn cho BUG-R2-147.
8. QA:
   - cấp BUG-R2-144…154 vào bug-list (R4LATE-05 không cấp);
   - đóng 134…139, 142, 143 theo báo cáo này; 140 đóng sau khi kiểm phần Desk;
   - sửa tiêu đề BUG-R2-129 (Note N-1);
   - thêm oracle cho 144, 145 và ca SEC cho 146;
   - đánh dấu 209 ca cũ "superseded" (mục Test cũ (g)); đối chiếu 4 dòng `pendingFix`.
9. OPS/DATA, trước khi đưa dữ liệu cũ vào môi trường dùng thử:
   - chạy 0064 rồi 0065 trước khi app nhận tải;
   - đếm: đơn thỏa thuận không có audit `reservation.priced`; đơn origin NULL (133); `minibar_check` dưới id đơn con; folio mở có Σ FOC minibar áp > Σ dòng sống của món (147).
10. G5: api và E2E xanh trên đúng commit chấm (E2E chưa chạy trên 365486f). Hoa hồng S4-03 vẫn thiếu: bổ sung, hoặc ORC ghi rõ việc dời.

Cổng QC Sprint 4 đang ở tuần Ổn định (decision-log ORC 18/10). G1, G7 và SEC D5 chưa xanh, nên QC chưa chấm cổng. Không cấp ngoại lệ tiền. ORC ghi decision-log ngày chấm mới sau lượt kiểm lại lần 5.

## Tệp của critic

Thư mục `/private/tmp/claude-501/-Users-anhvh-Library-Application-Support-Claude-scratch-workspaces-00554cf2-3678-4864-82b0-830aaeaa97bd-4c0caebe-be05-49c5-a5a2-5bf357fddc6a-scratch-2026-10-15-c4f0d4/36df3adc-c586-471c-a039-340d2b696728/scratchpad/s438/r4critic/`:
- `env.sh`
- `run1.log`: 61 ca, 47 xanh, 14 đỏ (6 BUG-R2-133, 8 SEC: X1, S1, S7, X2, S3, S9, E3, E4)
- `logs/obs.jsonl`: số W1–W4, R18
- `k1/k1.jsonl`: log BUG-R2-123 (`S1-move-preview` 422)
- `late/obs-sec.jsonl`, `obs-sec2.jsonl`, `obs-extra.jsonl`: số SEC

Bản chép test SEC: `scratchpad/s438/wt/product/services/api/test/s438/r4critic/` (`h.ts` đổi `OUT_DIR`, `r4late-sec.test.ts`, `r4late-sec2.test.ts`, `r4late-extra.test.ts`).

DB `ottimo_test_s438_r4critic` đã được xóa sau khi chạy.
