# Kiểm lại tiền S4-38 lần 5 – commit ce90d19

Đây là lượt kiểm lại thứ năm (ngắn) của S4-38, Round 2 Sprint 4, tuần Ổn định. Lượt này chạy sau vòng sửa 4 (gộp #10, decision-log ORC 18/10). Có 4 người kiểm: `r5old`, `r5mini`, `r5late`, `r5rate`. Họ kiểm 14 mã đích (BUG-R2-144…157), BUG-R2-140 và toàn bộ mã tiền cũ. Họ báo 12 phát hiện mới. Mỗi phát hiện có 2 người tái hiện độc lập (`z-r5*`, 24 lượt). Mỗi người tự viết test, tự tính số từ BR v0.3.8 bản 18/10, chạy trên PostgreSQL thật, DB riêng `ottimo_test_s438_r5*` / `zr5*`, bản sao cố định ce90d19 (src không sửa).

Test nằm ở `scratchpad/s438/wt/product/services/api/test/s438/` (chưa track trong repo). Thư mục `r5*/` là của người kiểm, `z-r5*/` là của người tái hiện, `r5critic/` là của critic.

Ghi chú thời điểm:
- Báo cáo chấm commit **ce90d19** (gộp #10).
- Cây chính đã ở **f04052d** (gộp #11, vòng 4b/4c: khóa theo tủ `lockFridge`, `periodId` + 409 `MINIBAR_PERIOD_CHANGED`, khóa đơn `FOR NO KEY UPDATE`). Critic chạy thêm `r5mini-attack` trên f04052d (mục "Critic chạy lại"). Kết quả: R5MINI-01 và ĐÃ BIẾT (1) đã sửa ở #11; R5MINI-02, 03, 04 còn nguyên.
- f04052d không đổi `stay-support.ts`, `room-history.ts`, `unit-of-work.ts`, `password-reauth.ts`, `lateFeePrecheck`. Các phát hiện r5rate và r5late vì thế còn nguyên ở #11 (đọc diff, chưa chạy).
- Mốc BR: BR v0.3.8 và bổ sung 18/10 (BR-309-16, BR-416-07, BR-417-11…14, BR-703-02 ghi chú 1–4, BR-807-02). Mốc hợp đồng: `openapi-0.3.7.md` mục 16 (16.2 R1–R10, 16.13–16.16). SEC: `s4-SEC-lateFee-reauth.md` mục 9–11.

## Tóm tắt

- 14 mã đích 144…157: **14 ĐÃ SỬA**, có số. BUG-R2-140: phần API xong, phần Desk chưa kiểm. BUG-R2-123, 133 CHƯA SỬA (P3, đúng hẹn tuần Ổn định). **0 HỒI QUY** mã cũ 109…143.
- 12 báo cáo, gộp còn **11 phát hiện**: R5OLD-01 và R5MINI-04 là cùng một lỗi.
  - **5 Major-fix-now** (P1, sai tiền): đề xuất BUG-R2-158…162.
  - 2 Minor có lệch tiền (P2): 163, 164.
  - 3 Minor P3, **SEC phải xem**, không lệch tiền: 165, 166, 167.
  - 1 **CLOSED-not-real**: R5RATE-04 (oracle sai, mã đúng).
- 24 lượt tái hiện đều tái hiện được hành vi. 21 lượt xác nhận lệch quy tắc. 3 lượt kết luận không lệch quy tắc (2 × R5RATE-04, 1 × R5LATE-03).
- Critic đổi mức 3 phát hiện: R5RATE-03 P2 → **P1** (2/2 người tái hiện cùng ý). R5MINI-02 P1 → **P2** (chưa client nào gửi đếm minibar offline). R5RATE-04 P3 → CLOSED-not-real.
- Do vòng sửa 4: 158 (hồi quy, **đã sửa ở #11**), phần tiền của 159 (`onRefillDone`), 163, 164. Không do vòng sửa 4: 160, 161, 162 (sót từ trước, lộ khi tấn công quanh 145/155/156).
- **Bảo mật**: không có lỗ hổng P1/P2 mới. BUG-R2-146 (P1 lượt 4) đã sửa đúng. SEC phải xem 3 mục P3 trên đường xác nhận lại: 165 (BE-64 còn sót), 166 (bước 0 không thấy key đang chạy thật), 167 (mật khẩu đúng mà B18 lỗi thì không để dấu vết).
- Hồi quy chung sạch: api 2.763/2.763 × 2 lượt. 3.920 ca cũ × 2 lượt: 0 ca đỏ do lỗi mã, ngoài BUG-R2-133 và phát hiện mới.
- **ce90d19 chưa đạt G1**: 7 đường lệch tiền (158…164). **Chưa đạt G7**: 5 mã P1 mới. Ở f04052d còn 4 P1 (159…162) và 2 P2 lệch tiền (163, 164).

## Kết quả từng hướng kiểm

**r5old** (hồi quy toàn bộ):
- api toàn bộ (bỏ `test/s438`), mỗi lượt một DB mới: 87/87 tệp, 2.763/2.763 ca, × 2 lượt. Không ca chập chờn.
- Test cũ `test/s438` (gồm `r4*`, `y-r4*`) chép sang `r5old/old/`: 712 tệp, 3.920 ca, 2 lượt. Lượt 1: 3.466 xanh / 299 đỏ / 155 skip. Lượt 2: 3.467 / 298 / 155. Chập chờn 1 ca: `r4late-qr` Q4 hết giờ 30 s khi máy tải nặng.
- Phân loại 299 ca đỏ:
  - 178 ca superseded, khớp đúng danh sách `s438-superseded.json`;
  - 31 ca giữ đỏ có chủ đích: 13 BUG-R2-133, 14 Note MOVE-03, 2 CANCEL-05, 2 `v-foc-3-1` C1;
  - 67 ca đỏ y hệt 365486f, cùng thông điệp: kỳ vọng cũ recheck4 (a)–(d), đã có bản đổi xanh;
  - 23 ca kỳ vọng cũ hoặc test sai: chép sang `r5old/fixed/`, đổi kỳ vọng, 99/99 × 2 lượt;
  - 1 ca lỗi mã mới: `y-r4mini-1-0` C2 (→ BUG-R2-159).
- BUG-R2-151: luồng B9a thật, J8 qua job handler thật, oracle BR-807-02 O1–O3 xanh × 2.
- Tấn công mới: R5OLD-01 (→ 159).

**r5mini** (BE-B, kỳ nạp DOM R9):
- Test chính thức `minibar-m1` 23/23 × 2. Số khớp oracle BR-703-02 và ARC 16.4: ca 12 105.000 / 2.481.000; ca 13/14 140.000 / 130.000; ca 16 100.000; 16b 135.000; 16c 100.000; 18 70.000; 19 35.000; 20 ròng 0.
- Hồi quy liên quan 8 tệp 108/108. Test cũ `r4mini`, `y-r4mini-*`: 33/40; 7 ca đỏ đã phân loại.
- BUG-R2-147 qua đường khởi động thật (`RUN_DATA_FIXES=1`): chạy đúng một lần mỗi cơ sở.
- Đối chứng `causedByFix` trên cây 365486f giải nén: A1 đúng 70.000 ở 365486f (hồi quy vòng 4); A4b cũng 2 việc (việc trùng có từ trước).
- Tấn công: R5MINI-01, 02, 03, 04. ĐÃ BIẾT (1) tái hiện được (K1 6/6 ra 130.000 thay 100.000), chỉ ghi coverage.

**r5late** (BE-A, đường BR-416-06 và SEC):
- 11 ca × 2 lượt: 9 xanh, 2 đỏ có chủ đích (A4 → R5LATE-01/03, M6 → R5LATE-02).
- 146: 11 loại tài khoản (kể cả khóa đăng nhập) cho cùng một 401; ranh giới `locked_until` đúng (`≤ now`); trung vị thời gian tỉ lệ 1,14.
- 148: MGR miễn đủ 911.000 / 1.030.000 / 792.000 → 200, `limit_basis` = chính khoản.
- 149: 9 ca đã liệt kê → 422/409 trước mật khẩu, bộ đếm 0/0.
- 150: replay mật khẩu sai → 200 `Idempotent-Replayed`, 0/0; đổi thân → 422 `IDEMPOTENCY_KEY_REUSED`.
- 153: người duyệt FOC = người xác nhận, `auth_method` `password`. 154: `security_alert` tới mọi OWN của cơ sở; audit có `approverRole`, không có tên đăng nhập.
- Test BE-A `s438r4-money`, `s438r3-money`, `redact`: 33/33.

**r5rate** (BE-A giá đêm kề, khóa bậc hoàn):
- 69 ca, 65 xanh; 4 ca đỏ đều là phát hiện mới. Test chính thức `s438r4-money` 13/13.
- 145: Agoda 202 → 101 → về 202, đêm thứ Sáu 911.000, tổng 4.095.000. 155: oracle BR-417-12 650.000; R5-04 (đêm đặc biệt ở đầu đơn, B9a) 650.000. 156: BR-417-13 667.000; 401 ở yên giữ sàn 740.000. 157: BR-309-16 và 7 biến thể R5-10…R5-16.
- `r4rate` T1/T2/T16/T18/T19 và F4/F5 đổi kỳ vọng theo oracle mới: 19/19 và 10/10.
- Xem trước = trần QR = ghi ở mọi ca B9a/B18 đã chạy, kể cả ở các phát hiện (nhất quán nhưng cùng sai số).
- Tấn công: R5RATE-01…04.

## Trạng thái mã

| Mã | Mức | Trạng thái ở ce90d19 | Bằng chứng có số | Ghi chú |
|---|---|---|---|---|
| BUG-R2-109…122, 124…132, 134…139, 142, 143 | P1–P3 | ĐÃ SỬA, **0 hồi quy** | r5old: 2 lượt test cũ trên DB mới. Ca đỏ đều là superseded, keep hoặc đỏ y hệt 365486f (đã có bản đổi). r2cancel 133/133, r3dep 187/187 × 2. | Không đổi trạng thái. |
| BUG-R2-123 | P3 | CHƯA SỬA | Critic chạy lại: `S1-move-preview` vẫn 422 `overbookingResolution REQUIRED`. | Tuần Ổn định, đúng hẹn. |
| BUG-R2-133 | P3 | CHƯA SỬA | Critic chạy lại: 6 ca đỏ. W1: chênh lệch `[]`, xem trước = ghi = 0 (đúng 208.000 × 2 = 416.000); căn gốc lưu `401` (đúng `203`). W4: `[]` (đúng 125.000 × 2). | Chỉ dữ liệu origin NULL trước 0059. |
| BUG-R2-140 | P3 | ĐÃ SỬA phần API | `minibar-m1` ca 6 xanh × 2 (và lượt critic): đổi giá 40.000, đếm lại 2 → lần đếm = `latestCheck` = folio = 70.000. | Phần Desk H16 bước 1 chưa chạy UI. Giữ Open tới khi QA kiểm. Không chặn cổng. |
| BUG-R2-144 | P1 | ĐÃ SỬA | `minibar-m1` 23/23 × 2: ca 12 (b3) B18 409 tới khi đếm lại, rồi 105.000 / 2.481.000; ca 13/14 140.000 / 130.000; ca 16 100.000; 16b 135.000; 16c 100.000; 18 70.000; S4-09 Agoda 105.000. | Kỳ nạp còn 4 lỗi ở chỗ giao: 158, 159, 163, 164. |
| BUG-R2-145 | P1 | ĐÃ SỬA | Oracle BR-417-11: Agoda 202 → 101 → về 202, đêm thứ Sáu 911.000, `currentBookingRateVnd` null, tổng 4.095.000. Biến thể 302 và `property_fault`: 911.000. | Còn sót: OTTIMO đổi căn **sau** lần về → 160. |
| BUG-R2-146 | P1 (bảo mật) | ĐÃ SỬA | 11 loại tài khoản → cùng một 401, thân giống hệt; `mTemp` khóa đăng nhập +0. Ranh giới `locked_until` now+1s / now / quá khứ đúng. | SEC kiểm BE-59 đạt. |
| BUG-R2-147 | P2 | ĐÃ SỬA | 102: 715.000 → 750.000, A `applied`, B `dormant`; đường khởi động thật chạy một lần (`job_run` n = 1). | Lệch cùng dạng ở 0066: 164. |
| BUG-R2-148 | P2 | ĐÃ SỬA | 911.000 / 1.030.000 / 792.000 (đêm cuối 713.000) → 200, due 0, `limit_basis` = khoản. | – |
| BUG-R2-149 | P2 (bảo mật) | ĐÃ SỬA phần đã liệt kê | 9 ca (thiếu `checkoutTime`, `checkoutAt` hỏng, thiếu `amountVnd`/`reason`, `kind`, `secret`, `SURCHARGE_CHANGED`, giữa kỳ, `extraNight`) → 422/409, bộ đếm 0/0. | Còn sót các trường B18 khác: 165. |
| BUG-R2-150 | P2 | ĐÃ SỬA | Replay mật khẩu sai → 200 replay, 0/0, 0 audit; đổi `amountVnd`/`reason`/path → 422 `REUSED`; dòng `in_progress` đã commit → 409. | Key đang chạy thật chưa phủ: 166. |
| BUG-R2-151 | P2 | ĐÃ SỬA | O1 Agoda 302 B9a 04:30 → J8 07:00: OD + 1 `stayover_clean`. O2 Booking.com 203: 16/08 thay ga. O3 gia hạn hai lần: không trùng việc. | QA gỡ `pendingFix` dòng BR-807-02. |
| BUG-R2-152 | P2 | ĐÃ SỬA | 302 → 401 lúc 10:00; HK đếm 302 lúc 11:00 → 201, 70.000, 1 việc số lượng 2. | Đường này mở ra 159. |
| BUG-R2-153 | P3 | ĐÃ SỬA | MGR gọi, OWN xác nhận, FOC 200.000: `approver` = OWN, `password`, `self_applied` false. | – |
| BUG-R2-154 | P3 | ĐÃ SỬA | 5 lần sai trên mgr2: `security_alert` tới mgr2, fd4, owner, own2; không tới OWN cơ sở khác. | – |
| BUG-R2-155 | P1 | ĐÃ SỬA | Oracle BR-417-12: B18 thứ Bảy 650.000 = trần QR = ghi. R5-04 (đêm đặc biệt đầu đơn, B9a): 650.000. | Còn sót: 161, 162. |
| BUG-R2-156 | P1 | ĐÃ SỬA | BR-417-13: B13 667.000, B7 tính thử 3 × 667.000; 401 ở yên giữ 740.000. T1 560.000 / 2.800.000; T2 667.000 / 2.668.000. | – |
| BUG-R2-157 | P1 | ĐÃ SỬA | BR-309-16: `other` 250.000/250.000; bất khả kháng 0/500.000. R5-16: phí 1.584.000, hoàn 16.000. | – |
| ĐÃ BIẾT (1) đua `record()` ‖ `onRefillDone` | (P1) | Còn ở ce90d19; **đã sửa ở f04052d** | ce90d19: K1 6/6 ra 130.000 (đúng 100.000). f04052d: K1 6/6 = 100.000 (critic chạy). | Không cấp mã mới. |

## Critic chạy lại các mã chưa sửa

**Lượt 1, cây ce90d19.** Chạy một lần trên DB mới `ottimo_test_s438_r5critic`, không sửa src. Log đổi hướng về `scratchpad/s438/r5critic/` (`K1_OUT`, `S438_OUT`, `R5_LOG`). `rate5.test.ts` và hai tệp r5late được chép sang `test/s438/r5critic/`, chỉ đổi thư mục ghi số. Kết quả 10 tệp, 125 ca: 104 xanh, 21 đỏ. 21 ca đỏ đúng các ca người báo đã đếm.

- **BUG-R2-123** (`r2regr/old__v-move-3-1__k1-restore-lane-assign`, 5/5 xanh): log `S1-move-preview` vẫn 422 `overbookingResolution REQUIRED`. Lỗi P3 còn nguyên.
- **BUG-R2-133** (`w-r2move-1-0`, `w-r2move-1-1`, `r3regr/fixed/r2move` R18): 6 ca đỏ.
  - W1 (203 → B7a `upgraded` 401 → sự cố 101 → khách xin 402, origin NULL): chênh lệch `[]`, xem trước = ghi = 0. Đúng là 208.000 × 2. Căn gốc lưu `401`.
  - W4 (xin tiếp sang 302): `[]`, đúng là 125.000 × 2.
  - Đối chứng xanh: W2 (origin còn lưu) 416.000.
- **BUG-R2-140** phần API: `minibar-m1` 23/23 xanh, gồm ca 6.
- Xác nhận các phát hiện Major và Minor (một lượt):
  - R5MINI-01 (A1): 8/8 căn, cả hai lệnh 201, 2 lần nạp, 2 lần đếm sống, minibar 140.000.
  - R5OLD-01 (R5-D1/D3): 2 việc, mốc bia 4, minibar 175.000 (đúng 105.000). D2: việc `[{bia:2},{bia:1}]`.
  - R5MINI-04 (A4/A4b): 2 việc, mốc 4; 140.000 (đúng 70.000) và 105.000 (đúng 35.000).
  - R5MINI-02 (A3): kỳ `carry`, mốc bia 0, 70.000 (đúng 105.000). Đối chứng A3c online: 105.000.
  - R5MINI-03 (A2): 140.000, 2 lần đếm sống, folio 1.140.000 (đúng 1.070.000).
  - R5RATE-01 (R5-01): 767.000, tổng 3.951.000 (đúng 911.000 / 4.095.000). Đối chứng R5-01c: 911.000.
  - R5RATE-02 (R5-03): 911.000, tổng 3.241.000 (đúng 650.000 / 2.980.000).
  - R5RATE-03 (R5-05): 911.000, tổng 3.287.000 (đúng 792.000 / 3.168.000). R5-02: 917.000.
  - R5LATE-01 (A4): 6 ca mật khẩu sai → 401 và đếm 1/1; mật khẩu đúng → 422.
  - R5LATE-02 (M6): gửi lại cùng key khi B18 đầu đang chạy → 401 `REAUTH_FAILED`, bộ đếm 1/1.
  - Xanh: r5late A1/A2/A3/A5, M1–M5 (146, 148, 149, 150, 153, 154).

**Lượt 2, cây f04052d (gộp #11).** Critic giải nén f04052d (`git archive`, `node_modules` dùng symlink), DB mới `ottimo_test_s438_r5critic_f`, chạy `r5mini-attack.test.ts` một lần. Kết quả 12 ca: 8 xanh, 4 đỏ.
- **A1 xanh**: 8/8 căn ra 70.000, 1 lần nạp, 1 lần đếm sống. `record()` ở f04052d gọi `registerFridge` sau `lockFridge`. R5MINI-01 đã sửa ở #11.
- **K1 xanh**: 6/6 vòng ra 100.000. ĐÃ BIẾT (1) đã sửa ở #11.
- **A2, A3, A4, A4b vẫn đỏ**, cùng số như ce90d19. R5MINI-03, 02, 04 còn nguyên ở #11.

Critic đọc lại mã ce90d19 cho các gốc. Mã khớp mô tả của người báo:
- `inventory/internal/minibar.service.ts` `record()`: `registerFridge` (306) và `fridgeItems` (312) chạy trước `lockForPosting` (339); khi thay `prev` chỉ đặt `replaced_by_check_id` (350–355), không chuyển `refill_task_id`; dòng 487 gọi `onCheckedOut` cho tủ căn cũ.
- `inventory/public/minibar-checkout.port.ts` `openNextPeriod`: `AND done_at > $3` (126), với `$3` = `count.created_at`.
- `reservations/internal/room-history.ts` `roomChangeHistory`: chỉ đọc `c.field = 'room'` (33). Lần về S4-09 ghi `room_return` trên đơn con.
- `frontdesk/internal/stay-support.ts` `agreedRate` (216–250): `if (!n || !n.manual) return null;` và `if (rows[0]?.room_id !== at.roomId) return null;`.
- f04052d thêm cảnh báo log khi `room_entered` gặp lần đếm sống chưa gắn việc, nhưng không xử lý việc của lần đếm bị thay.

## Critic – phân xử phát hiện mới

| Mã | Kết luận | Mức | Ai sửa | BUG đề xuất | Lý do |
|---|---|---|---|---|---|
| R5MINI-01 lễ tân ‖ HK đếm cùng lúc một tủ chưa có lần nạp → hai lần nạp `check_in`, hai lần đếm sống, thu 140.000 thay 70.000 | **Major-fix-now** (đã sửa ở #11, cần test) | P1 | BE-B; QA; ARC | BUG-R2-158 | 2/2 tái hiện, đều P1; critic chạy lại: đỏ 8/8. B18 thu 140.000, folio đã chốt. Trái BR-703 ("không tính trùng"), ARC 16.2 R1/R6, R10 (`latestCheck` 70.000 ≠ B18 140.000). **Hồi quy vòng sửa 4**: 365486f cho 70.000 (người báo chạy đối chứng). Critic chạy trên f04052d: xanh 8/8. Còn lại: đưa ca A1 (tủ chưa nạp, hai thứ tự) vào test chính thức; ARC bỏ câu "an toàn nhờ khóa folio" ở 16.15. QA đóng sau khi có test. |
| R5OLD-01 + R5MINI-04 (gộp): đếm lại tủ căn cũ trong cùng kỳ sinh việc bổ sung thứ hai; HK xong cả hai khi khách đã quay về → `onRefillDone` cộng mốc hai lần | **Major-fix-now** | P1 | BE-B (+ ARC 16.2 R9; DOM một câu) | BUG-R2-159 | 4/4 lượt tái hiện, đều P1; critic chạy lại: đỏ ở ce90d19 và f04052d. Mốc bia 4 trên định mức 2. Khách không uống thêm vẫn bị tính 70.000 (D1, A4: 175.000 thay 105.000; 140.000 thay 70.000). Sửa lần đếm 2 → 1: 105.000 thay 35.000. Không cảnh báo. Trái DOM BR-703-02 ghi chú 4 và ARC R9 ("một lần đếm sống có dùng ↔ đúng một việc"), ghi chú 2, BR-702 ("chuẩn = số sau lần bổ sung gần nhất"). Đường kích hoạt là quy trình thường: HK đếm khi dọn rồi lễ tân xác nhận, hoặc lễ tân sửa nhầm; về căn cũ là ca 12–16 của ARC. Việc trùng đã có ở 365486f; **phần sai tiền do `onRefillDone` của vòng sửa 4**. Không hạ P2: nếu HK nạp đúng từng việc thì tủ vượt định mức, lượt sau lệch tồn; HK làm cách nào cũng sai. |
| R5RATE-01 S4-09 khách đổi tạm rồi về căn cũ, sau đó OTTIMO đổi căn: căn ở tạm vẫn bị coi là căn khách mua | **Major-fix-now** | P1 | BE-A (+ DOM/ARC một dòng 16.6 (a)) | BUG-R2-160 | 2/2 tái hiện, đều P1; critic chạy lại: đỏ. Căn tạm rẻ hơn: thu thiếu 144.000/đêm (767.000 thay 911.000, tổng 3.951.000 thay 4.095.000). Căn tạm đắt hơn (302): thu **thừa** 144.000 (1.055.000). `lateFeeAsNightVnd` cũng 767.000. Xem trước = trần QR = ghi, cùng sai. Trái BR-417 (1) bản 18/10 ("lần về là một phần yêu cầu của khách → căn khách mua = căn cũ") và DOM 18/10 (a). Bản sửa 145 chỉ cài một nửa đề xuất lượt 4; nửa "đêm con sau `until_parent_departure` đã ghi về" chưa cài. Không phải hồi quy (365486f cũng 767.000). |
| R5RATE-02 OTTIMO đổi căn đúng đêm ngày đặc biệt: mất giá thỏa thuận, đêm thêm lấy lịch căn mua | **Major-fix-now** | P1 | BE-A (+ DOM một dòng BR-417 (2)) | BUG-R2-161 | 2/2 tái hiện, đều P1; critic chạy lại: đỏ. 202 thỏa thuận 650.000: B18 thứ Bảy 911.000 thay 650.000, thu thừa 261.000. Biến thể 103 → 101: 767.000 thay 650.000, thừa 117.000. Khách trả **nhiều hơn** so với không đổi căn (650.000), trái mục đích quy tắc min (DOM 18/10). Trái BR-417 thân, BR-417-12, ARC 16.6 (a)(1). Cùng đơn, đổi từ 15/04 ra 650.000, đổi từ 16/04 ra 911.000. Không phải hồi quy; bản sửa 155 làm lộ tổ hợp này. |
| R5RATE-03 B13 ghi đêm mặc định trùng lịch thành đêm `calendar` → mất giá thỏa thuận cho đêm thêm sau | **Major-fix-now** (nâng từ P2) | P1 | BE-A (+ ARC sửa 16.6 (a)(2) theo BR-417 (2)) | BUG-R2-162 | 2/2 tái hiện, cả hai đề nghị P1; critic chạy lại: đỏ. Thỏa thuận 792.000 (= lịch ngày thường): gia hạn 1 đêm rồi B18 → 911.000, tổng 3.287.000; gia hạn 2 đêm một lần → 792.000, tổng 3.168.000. Cùng một đêm, hai giá. Chiều ngược (thỏa thuận đồng giá 911.000): thu thiếu 119.000. Lễ tân gõ đúng 792.000 ở B13 vẫn bị ghi `calendar`. Trái BR-417 (2) ("giá nhập tay gần nhất ở căn hiện tại"), BR-416/BR-421 (đêm thêm giá như gia hạn). Cùng cơ chế với BUG-R2-155 (P1); giá thỏa thuận trùng một đêm lịch là cách đặt phổ biến, nên giữ P1 theo tiền lệ R3RATE-01, R4RATE-01. Có từ vòng 3. |
| R5MINI-02 HK offline: so "việc xong sau lần đếm" trộn giờ làm (`done_at`) với giờ xử lý (`created_at`) → kỳ `carry` thay `refill`, thu thiếu 35.000 | Minor (sửa cùng 159, **bắt buộc**) | P2 (hạ từ P1) | BE-B (+ BE-C P3 kèm; ARC 16.16 (x)) | BUG-R2-163 | 2/2 tái hiện; một người P2, một người P1. Kịch bản gốc không xảy ra với client đúng hợp đồng (việc "xong" trước khi việc tồn tại). Biến thể Z2 hợp lệ: việc xong sau lần đếm theo cả hai hệ giờ mà vẫn ra `carry`, mốc bia 0, 70.000 thay 105.000. Critic hạ P2 vì ở ce90d19 không client nào gửi lần đếm minibar offline: PWA HK chỉ gửi `performedAt` cho việc HK, Desk đếm online. **Phải sửa cùng 159**: nếu 159 sửa bằng cách chuyển T1 cho lần đếm mới, Z2 mất tiền chắc chắn. Nâng P1 khi MOB phát hành đếm minibar offline. Kèm P3: `transitionHkTask` từ chối `performedAt` sớm hơn `hk_task.created_at`. |
| R5MINI-03 0066 trên dữ liệu đếm bằng 365486f (tủ chưa có lần nạp, `fill_id` NULL): mọi lần đếm lại ghi thêm dòng, thu thừa 70.000 | Minor (tính vào G1 tới khi có bản sửa) | P2 | BE-B (+ OPS/DATA, ARC 16.3) | BUG-R2-164 | 2/2 tái hiện, đều P2. Người tái hiện dựng dữ liệu bằng chính app 365486f rồi chạy 0066 thật, không can thiệp SQL. Xác nhận lại cùng số: 140.000, folio 1.140.000 (đúng 1.070.000). Đếm số mới 1: 105.000 thay 35.000; về 0: không đảo. Không chặn B18, không cảnh báo. Trái BR-702 ("xác nhận lại không ghi đè"), BR-703, ARC R1/R6/R7, 16.3. Critic chạy f04052d: vẫn đỏ. Theo tiền lệ 147 (ORC chọn lối (a), không dựa vào việc không mang dữ liệu sang): sửa mã, không hạ P3. |
| R5LATE-01 BE-64 còn sót: lỗi khuôn các trường B18 khác và 422 `VALUE_OUT_OF_RANGE` của `requestFoc` trả **sau** mật khẩu | Minor – **SEC phải xem** | P3 | BE-A (SEC kiểm lại BE-64; ARC làm rõ "khuôn body") | BUG-R2-165 | 2/2 tái hiện, đều P3; critic chạy lại: đỏ 6/6. Mật khẩu sai → 401 và đếm 1/1; đúng → 422. Trái câu hợp đồng `checkOut` 18/10 ("422/409 kiểm trước mật khẩu và không đếm"). Rõ nhất là `requestFoc.amountVnd > lateFeeAsNightVnd` (422 nghiệp vụ chỉ đọc). Không mở đường dò mới: precheck vẫn đòi đúng ngày đi, đêm không bán được, đúng số tiền. Không lệch tiền. Không do vòng 4. |
| R5LATE-02 bước 0 không thấy key đang chạy thật: gửi lại cùng `Idempotency-Key` khi B18 đầu còn trong giao dịch → mật khẩu vẫn bị thử và đếm | Minor – **SEC phải xem** | P3 | BE-A; SEC chọn cách | BUG-R2-166 | 2/2 tái hiện, đều P3; critic chạy lại: đỏ. Dòng `in_progress` chèn và chuyển `completed` trong cùng một giao dịch, nên không phiên nào khác thấy. Nhánh 409 của bước 0 chỉ chạm được với dòng chèn tay. SEC 11.3 ghi ĐK 2 "Đạt theo mã" – chưa đúng khi đồng thời thật. Không sai tiền, không ghi trùng; lần hai mật khẩu đúng vẫn ra 409 nhờ `claimKey`. Sửa chưa đủ, không phải hồi quy. |
| R5LATE-03 mật khẩu người xác nhận kiểm **đúng** nhưng B18 bị từ chối sau đó (409/412/403/422) → không thông báo, không audit; bộ đếm của quản lý bị xóa về 0 | Minor – **SEC phải quyết** | P3 | SEC quyết; nếu sửa thì BE-A | BUG-R2-167 | 2/2 tái hiện hành vi; một người thấy lệch câu chữ, một người không. Câu hợp đồng "Người xác nhận ≠ người gọi → thông báo" và SR-AUTH-11 (6) ("mỗi lần tài khoản được dùng trên phiên người khác") đọc được theo cả hai nghĩa. Đây là khoảng trống phát hiện của BE-62 / rủi ro "nhìn trộm" (mục 7): người gọi xác minh được mật khẩu quản lý mà không để dấu vết. Lần thử sai vẫn bị đếm và audit. SEC chọn: ghi `reauth_succeeded` + thông báo trong giao dịch riêng của `verifyApprover`, hoặc chấp nhận bằng văn bản. |
| R5RATE-04 oracle BR-417-14 `then401` (302 thỏa thuận 1.000.000 → 101 → 401, đều OTTIMO) = 667.000; mã cho 1.000.000 | **CLOSED-not-real** | – | QA sửa oracle; DOM xác nhận câu chữ | – | 2/2 tái hiện, cả hai not-a-bug. Mã đúng BR-417 (3) và ARC 16.6 (a): căn khách mua 302, min(1.000.000; 1.042.000) = 1.000.000; xem trước = trần QR = ghi. Số 667.000 còn bị 422 `RATE_OUT_OF_RANGE` (min 690.000). Dòng oracle chép nhầm vế "101 → 401 = 667.000" của BR-417-13 (đơn lịch ở 101) thành đường đi [302, 101, 401]. |

Phân loại bảo mật cho SEC:
- Không có lỗ hổng khai thác mới mức P1/P2. BUG-R2-146 và 149 (phần đã liệt kê) đạt.
- Ba mục P3 trên đường xác nhận lại, SEC phải xem:
  - **BUG-R2-167**: khoảng trống phát hiện. Đáng nhất trong ba mục.
  - **BUG-R2-165**: BE-64 còn sót trường khuôn và headroom FOC.
  - **BUG-R2-166**: điều kiện ĐK 2 mục 9 chỉ đạt với dòng đã commit. SEC chọn sửa mã hoặc sửa câu chữ, và sửa đánh giá 11.3.
- Số mã: QA cấp. Hai nhãn tạm ở bug-list mục 1b (`ARC-16.16-ab`, `ARC-16.16-deadlock`) cũng chờ số từ 158. Critic đề xuất cấp chúng 168, 169 để giữ dãy trên; QA quyết thứ tự.

## Major-fix-now theo gốc (danh sách sửa cho BE)

| BUG đề xuất | Phát hiện | Ai sửa | Chỗ sửa (ce90d19) | Số đúng cho test |
|---|---|---|---|---|
| BUG-R2-158 | R5MINI-01 (hồi quy vòng 4) | BE-B; QA; ARC | Đã sửa ở f04052d: `record()` lấy `lockFridge` trước `registerFridge`/`fridgeItems`. Việc còn lại: thêm ca A1 vào test chính thức; ARC sửa 16.15 bỏ "an toàn nhờ khóa folio", ghi "lần nạp `check_in` tạo sau khóa tủ". | 8 lượt Trực tiếp 02–03/01/2030, danh mục không đổi. 03/01 09:00 lễ tân ‖ HK gửi cùng thân (bia dùng 2), cả hai thứ tự: hai lệnh 201; **1** lần nạp `check_in`, **1** lần đếm sống; minibar **70.000**; `latestCheck.totalVnd` = B18 = 70.000; 1 việc `{bia: 2}`. Đối chứng tuần tự: 70.000. |
| BUG-R2-159 | R5OLD-01 + R5MINI-04 | BE-B (+ ARC, DOM) | (1) `minibar.service.ts` `record()` (350–355): khi thay `prev` mà `prev.refill_task_id` còn mở, chuyển việc sang lần đếm mới, cập nhật `quantity`/`refill_items` theo số dùng mới; dùng 0 thì hủy việc. Không tạo việc mới. (2) `minibar-checkout.port.ts` `createRefillTasks` (370–380): không sinh việc khi tủ đã có việc mở cho kỳ. (3) `onRefillDone` (~269): bỏ qua việc gắn lần đếm đã bị thay. ARC bổ sung R9: việc của lần đếm bị thay trong cùng kỳ; trường hợp việc cũ đã xong thì lần nạp chỉ bù phần chênh. DOM một câu xác nhận. | **D1**: 202 Trực tiếp 11–14/06/2029. 12/06 10:00 B14 `property_fault` → 203. 10:30 lễ tân đếm tủ 202 dùng 2 bia → 70.000. 11:00 HK đếm lại cùng số → 201, giữ 70.000, **1 việc** mở `{bia: 2}`. Đếm 203 dùng 0, B14 về 202 → kỳ `carry`, bia 0. 14:00 HK xong việc trong căn → mốc bia **2**. 13/06 đếm còn 1 → +35.000, minibar **105.000**. **D2**: đếm 2 rồi sửa 1 → 1 việc `{bia: 1}`, 35.000. **A4**: 302, 08–11/04/2030, HK 11:00 + lễ tân 12:00 cùng 2 bia; về 302, HK xong; không uống thêm → **70.000**. **A4b**: → **35.000**. `y-r4mini-1-0` C2: 1 việc. Đối chứng D0 (đếm một lần): 105.000 (đang xanh). |
| BUG-R2-160 | R5RATE-01 | BE-A (+ DOM/ARC) | `reservations/internal/room-history.ts` `roomChangeHistory`/`boughtRoomOf`: tính lần về S4-09 (`room_return` trên đơn con) là một phần yêu cầu của khách → căn khách mua = căn cũ. Áp chung B9a/B13/B18, `lateFeeAsNightVnd`, `currentBookingRateVnd`, MovePlanner. ARC sửa câu "căn khách mua = căn của lần khách xin cuối" ở 16.6 (a). | Agoda 202, 02–04/07/2029, B13 +2 đêm con. 03/07 khách xin B14 sang 101, `until_parent_departure`. 04/07 ghi về 202. 05/07 OTTIMO 202 → 401 (`property_fault`, đơn cha). Đêm 06/07 (thứ Sáu): gợi ý = `currentBookingRateVnd` = B18 = trần QR = ghi = **911.000**; tổng **4.095.000**. Căn tạm 302 (đắt hơn): **911.000**, folio **4.220.000** (gồm chênh lệch 125.000 hợp lệ), khoảng Desk 530.000–2.630.000. 401 bán từ thứ Sáu: `lateFeeAsNightVnd` = **911.000**. Đối chứng (đang xanh): không có OTTIMO 911.000, `currentBookingRateVnd` null; không đổi tạm 911.000. |
| BUG-R2-161 | R5RATE-02 | BE-A (+ DOM) | `frontdesk/internal/stay-support.ts` `agreedRate` (~245): khi quy tắc min áp (căn hiện tại ≠ căn khách mua sau OTTIMO đổi căn), nhận giá nhập tay của đêm kề (bỏ đêm đặc biệt) ở căn khách mua, không đòi đêm đó ở căn hiện tại; kẹp sàn–trần căn mua rồi min với lịch căn hiện tại. DOM một dòng: chữ "ở căn hiện tại" ở BR-417 (2) không áp cho nhánh OTTIMO đổi căn. | 202 thỏa thuận 650.000 × 2 (14–16/04/2027). B13 thêm 16/04 (Giỗ Tổ) 1.030.000. OTTIMO B14 hiệu lực 16/04 → 401, chênh 0. 17/04 (thứ Bảy): gợi ý = `currentBookingRateVnd` = B18 = trần QR = ghi = **650.000**; tổng **2.980.000**. 103 → 101 từ 16/04: **650.000**. Đối chứng (đang xanh): không đổi căn 650.000 / 2.980.000; OTTIMO từ 15/04 → 650.000; khách xin 401 → 1.198.000, `currentBookingRateVnd` null. |
| BUG-R2-162 | R5RATE-03 (nâng P1) | BE-A (+ ARC) | `stay-support.ts` `agreedRate` (216–247) tìm đêm nhập tay **gần nhất** ở căn hiện tại (bỏ đêm đặc biệt và đêm mặc định), đúng BR-417 (2). Hoặc B13/B9a ghi đêm mặc định của đơn thỏa thuận là nhập tay khi giá = giá thỏa thuận (`addedNightRate` dòng 334, `stay.service.ts` 122, 293). ARC sửa 16.6 (a)(2) "đêm kề" thành "gần nhất". | 202 Trực tiếp, `manual_agreed`, 792.000 × 2, 07–09/08/2029 (thứ Ba–thứ Năm). Thứ Tư B13 +1 mặc định 792.000. B18 thứ Sáu 10/08 19:00: gợi ý = trần QR = ghi = **792.000**, tổng **3.168.000** (bằng gia hạn 2 đêm một lần). Gõ 792.000 ở B13: cùng số. Chiều ngược: đồng giá 911.000 thứ Năm–thứ Sáu, B13 thứ Bảy, B18 Chủ nhật = **911.000**, tổng **3.644.000**. Đối chứng (đang xanh): thỏa thuận 700.000 → 700.000. Ca B (302 → 101 → B13 → 401): theo câu chữ BR-417 (3) là 1.000.000; DOM chốt cùng R5RATE-04. |

Việc chung cho 5 mã:
- Chuyển ca của người tái hiện (`z-r5mini-0-*`, `z-r5old-0-*`, `z-r5mini-1-*`, `z-r5rate-0-*`, `z-r5rate-1-*`, `z-r5rate-2-*`) vào `test/integration/`, kỳ vọng theo số ở bảng trên.
- Oracle mới trong `br-examples.json`:
  - BR-703-02: đếm lại tủ căn cũ trong cùng kỳ → 1 việc, 105.000 / 35.000;
  - BR-417-11 biến thể: OTTIMO đổi căn sau lần về, căn tạm rẻ hơn và đắt hơn → 911.000;
  - BR-417-12 biến thể: OTTIMO đổi căn đúng đêm đặc biệt → 650.000;
  - BR-421 / BR-417 (2): thỏa thuận trùng lịch, gia hạn từng đêm → 792.000 / 3.168.000.
- **Giá đêm kề: không vá thêm một nhánh.** Đây là lượt thứ tư liên tiếp cùng một hàm sinh P1 (126 → 134 → 145 → 155/156 → 160–162). DOM và ARC viết **bảng quyết định** đủ tổ hợp: căn khách mua (khách xin, S4-09 về, OTTIMO một hay nhiều lần), đêm kề hay gần nhất, đêm đặc biệt, đêm mặc định trùng lịch, kẹp sàn–trần. QA sinh test theo bảng. BE-A viết lại `addedNightContext`/`agreedRate`/`boughtRoomOf` theo bảng một lần.
- **Minibar: giữ bất biến ở một chỗ.** Mọi đường tạo, chuyển, đóng việc `minibar_refill` đi qua một hàm, dưới `lockFridge`. Thêm truy vấn kiểm: "tủ có > 1 việc `minibar_refill` mở cho một kỳ" = 0. Sửa 159 cùng 163 và chạy lại K1, A1.

## Minor và Note – kế hoạch

| Mã | Mức | Ai | Kế hoạch |
|---|---|---|---|
| BUG-R2-163 (R5MINI-02, hệ giờ của "việc xong sau lần đếm") | P2 | BE-B (+ BE-C, ARC) | `minibar-checkout.port.ts` `openNextPeriod` (~123–128): so cùng một hệ giờ. Ưu tiên giờ xử lý lệnh xong việc (`state_transition.occurred_at` của `complete`, không dùng `hk_task.updated_at`) với `count.created_at`, khớp 16.16 (x). ARC thêm một câu vào 16.16 (x). BE-C (P3): `transitionHkTask` từ chối `performedAt` < `hk_task.created_at`. Số: 301, 04–07/05/2030; 10:20 lễ tân đếm tủ cũ dùng 2 → T1; HK offline đếm lại 10:30, xong T1 10:45; đồng bộ 12:00 và 12:05; 06/05 về 301; 07/05 uống 1 → kỳ `refill`, mốc bia 2, +35.000, minibar **105.000**. **Sửa cùng 159.** |
| BUG-R2-164 (R5MINI-03, 0066 trên dữ liệu 365486f) | P2 | BE-B + OPS/DATA + ARC | Migration mới 0067 (0066 đã gộp): bù lần nạp `backfill` cho tủ của lượt `in_house` có lần đếm `checkout` mà chưa có `minibar_fill` (như 0065: qty = `standard_qty`, giá = snapshot của lần đếm, `filled_at` = lần đếm đầu − 1 ms), rồi gán `fill_id`. Cách khác: `registerFridge` nhận lần đếm `fill_id` NULL vào kỳ `check_in` vừa ghi. ARC thêm dòng vào 16.3. OPS/DATA: truy vấn "lần đếm sống `fill_id` NULL của lượt `in_house`" = 0 sau migrate. Số: 402, 04–05/02/2030, đếm bia 2 dưới 365486f → 0066 → lễ tân xác nhận lại cùng số: giữ dòng, 1 lần đếm sống, folio **1.070.000**. Đếm 1: đảo 70.000, ghi 35.000. Đếm 0: chỉ đảo. HK đếm cùng số: 70.000. Đối chứng không đếm lại: 1.070.000 (đang xanh). Sửa cùng vòng. |
| BUG-R2-165 (R5LATE-01, BE-64 còn sót) | P3 | BE-A; SEC; ARC | `checkout.service.ts` `lateFeePrecheck` (352–392): dùng chung hàm đọc input của `checkOut` (`text(checkoutTimeNote)`, `bool(applyLateSurcharge)`, `money(expectedSurchargeVnd)`, `overpayment()`, `debt()`, `paymentInput()`), và headroom `requestFoc.amountVnd` ≤ `lateFeeAsNightVnd` − FOC đã duyệt/đang xin, **trước** `verifyApprover`. Sửa chú thích tự mâu thuẫn (349 với 358). Số: 203, 15–17/01/2030, kín nhà, 19:00, 792.000; 6 ca (`bitcoin`, −1, `"x"`, `keep`, `"yes"`, 792.001): mật khẩu sai và đúng cùng một 422, bộ đếm 0/0. ARC làm rõ "khuôn body" trong mô tả `checkOut`. Sửa cùng vòng nếu kịp; không chặn cổng nếu SEC ghi chấp nhận có hạn. |
| BUG-R2-166 (R5LATE-02, bước 0 với key đang chạy) | P3 | BE-A; SEC; ARC | SEC chọn một trong hai. (1) Bước 0 phát hiện key đang chạy: `INSERT … ON CONFLICT DO NOTHING` trong giao dịch ngắn có `lock_timeout` nhỏ rồi ROLLBACK, gặp 55P03 → 409; hoặc khóa advisory theo (người gọi, key). (2) Sửa ĐK 2 thành "dòng `in_progress` đã commit", chấp nhận đếm khi đồng thời; sửa 11.3. Cả hai: thêm ca đồng thời thật (r5late M6). Số theo (1): 203, 12–14/02/2030; B18 đầu chờ khóa; gửi lại cùng key, mật khẩu sai → **409 `IDEMPOTENCY_IN_PROGRESS`**, bộ đếm 0/0, audit không đổi; B18 đầu → 200, folio 2.376.000. |
| BUG-R2-167 (R5LATE-03, mật khẩu đúng không dấu vết) | P3 | SEC; BE-A nếu sửa | SEC quyết. Nếu sửa: `PasswordReauth.verifyApprover` nhánh đúng, người xác nhận ≠ người gọi → audit security `late_fee_as_night.reauth_succeeded` và `account_security_change` trong giao dịch riêng; bỏ thông báo trùng trong `checkout.service.ts` (703–738). Số: 4 ca mật khẩu đúng (409 `BALANCE_DUE`, 412, 403, 422) → +1 audit security, +1 thông báo cho mgr; B18 thành công vẫn đúng 1 thông báo. Nếu không sửa: SEC ghi chấp nhận vào mục 7. |
| BUG-R2-123 | P3 | BE-A + ARC | Tuần Ổn định. |
| BUG-R2-133 (fallback căn gốc) | P3 | BE-A; OPS | Tuần Ổn định. Số đúng: 208.000 × 2; xin tiếp sang 302: 125.000 × 2. Là lệch tiền trên dữ liệu cũ: OPS đếm đơn origin NULL trước khi đưa dữ liệu vào dùng thử. |
| BUG-R2-140 (phần Desk) | P3 | FE-A; QA | QA kiểm H16 bước 1 hiện 70.000 trên UI (f04052d đã đổi `CheckOutPage.tsx`). Không chặn cổng. |
| R5RATE-04 | CLOSED-not-real | QA; DOM | QA sửa `br-examples.json` BR-417-14: `expected.addedNightVnd.then401` = **1.000.000**; `wrongVnd.then401` = 667.000; ghi chú "căn khách mua = 302, không tính căn trung gian của OTTIMO". DOM xác nhận câu chữ BR-417 (3), làm rõ BR-429 (b1') khi OTTIMO đổi căn nhiều lần. |
| N-1 void dòng minibar rồi đếm lại cùng số | Note | DOM, QA | Giữ như lượt 4 (đúng thiết kế). |
| N-2 409 `CONCURRENT_UPDATE` khi duyệt FOC ‖ đếm (R15) | Note | QA, FE-A | Tỉ lệ 409 nay 1/24 (lượt 4: 5–13/24). Vòng lặp 24 lần còn chạm 403 `APPROVAL_LIMIT_EXCEEDED` của FDL. Bất biến tiền giữ ở mọi vòng. QA viết bản đổi kỳ vọng chấp nhận 409/403. |
| N-3 phạm vi HK đếm tủ căn cũ (bản sửa 152) | Note | DOM, ARC | (a) Mã cho HK đếm khi căn có **bất kỳ** việc HK hôm nay, kể cả việc của khách khác. (b) Hôm sau ngày B14 (việc dọn `carried_over`) vẫn 404. ARC 16.5 / R1 ghi "trong ngày". DOM/ARC chốt câu chữ; không chặn cổng. |
| N-4 câu chữ giá đêm kề | Note | DOM, ARC | BR-417 (2) "ở căn hiện tại" và ARC 16.6 (a)(1)(2) "đêm kề" lệch nhau. Chốt cùng bảng quyết định (mục trên). |
| N-5 nhỏ ở đường BR-416-06 | Note | BE-A, ARC | `checkoutTimeNote` 1 ký tự → mã `REASON_REQUIRED` thay mã độ dài. Thân bỏ hẳn khóa `secret` → 422 `IDEMPOTENCY_KEY_REUSED` (Desk luôn gửi, không phải lỗi). |

## Test cũ phải đổi kỳ vọng

Các thay đổi dưới đây không phải lỗi mã. Mỗi chỗ có ghi chú `r5old EXPECTATION CHANGE` hoặc dòng `r5rate:` / `r5mini`. Bản đã đổi nằm ở `r5old/fixed/` (99/99 × 2), `r5mini/old/` (4/4), `r5rate/r4rate-fixed.test.ts` (19/19), `r5rate/r4refund-fixed.test.ts` (10/10). Người kiểm đổi độc lập các ca trùng (T1/T2/T16/T18/T19, F4/F5, B3/B6/Y1b/Y3) và ra cùng số.

**(a) Theo BR-417-13/14 (DOM r4-1, BUG-R2-156).**

| Tệp / ca | Cũ → mới | Căn cứ |
|---|---|---|
| `r4rate/rate.test.ts` T1 | Kẹp sàn 401 740.000 → **560.000**, sàn Desk 530.000, tổng **2.800.000** | BR-417-13/14 |
| T2 | → **667.000**, tổng **2.668.000** | BR-417-13 |
| T16 | Chênh lệch khi khách xin 302 sau đó: 917.000 − 667.000 = **250.000** | BR-417-13 |
| T18 | B9a sau B7 sự cố: **560.000**, tổng **1.680.000** | BR-417-13 |
| T19 | MovePlanner `force_majeure` rồi B13: **667.000** (MovePlanner = B13) | BR-417-13 |

**(b) Theo BR-309-16 (DOM F4/F5, BUG-R2-157).**

| Tệp / ca | Cũ → mới | Căn cứ |
|---|---|---|
| `r4rate/refund-j8.test.ts` F4, F5 | Không khóa (0/0) → bất khả kháng giữ **400.000**, hoàn 0; `other` giữ **200.000**, hoàn **200.000** | BR-309-16 |

**(c) Theo DOM R9 / ghi chú BR-703-02 (BUG-R2-144).**

| Tệp / ca | Cũ → mới | Căn cứ |
|---|---|---|
| `r4mini` B3; `r4mini/attack2` B6; `y-r4mini-0-1` Y1b, Y3 | Thêm bước HK xong việc bổ sung (khi khách ở căn khác): 70.000 → **105.000**; S4-09 Agoda **105.000**; **140.000**; S4-09 Booking **105.000**. Không có bước này thì 70.000 là đúng (ca 16, kỳ `carry`) | DOM 18/10 ca 16, R9 |
| `y-r4mini-0-0` Y4 | Khẳng định lỗi 144 ("không đếm nổi 105.000") → nay **140.000** theo `samePeriodUse` | BR-703-02 |
| `y-r4mini-1-1` Y4 | Khẳng định 404 của 152 → nay **201** và 1 việc | BUG-R2-152 |

**(d) Theo đường BR-416-06 và hợp đồng.**

| Tệp / ca | Cũ → mới | Căn cứ |
|---|---|---|
| `y-r4late-2-0` ctrl19; `y-r4late-2-1` A5 | Giữa kỳ có giờ 19:00 → **409 `INVALID_TRANSITION` trước mật khẩu**, bộ đếm 0/0 | BUG-R2-149, thứ tự BE-64 |
| `r4late-qr` Q3 | Nợ hiện tại 0, 422 `REASON_REQUIRED` khi không ghi chú (đã nêu ở recheck4 (c), nay có bản chép) | recheck4 (c), D6 |
| `r2regr` M1; bản `r3regr/old` | Test tắt món bằng SQL, bỏ qua đường chụp lần nạp. Gửi đủ món (bia còn 0) → **201**, giữ 70.000 | ARC 16.2 R2/R3 |

**(e) Giữ đỏ, vì đây là lỗi mã.** Không đổi kỳ vọng:
- BUG-R2-133: `w-r2move-1-0` W1, W3; `w-r2move-1-1` W2, W3, W4; `r2move` R18 (các bản `r3regr/fixed`, `r3pay/old`).
- Phát hiện mới:
  - 158: `r5mini-attack` A1 (xanh ở f04052d);
  - 159: `r5mini-attack` A4, A4b; `r5old/attack/mb-r5` R5-D1, D2, D3; `y-r4mini-1-0` C2;
  - 160: `rate5` R5-01; 161: R5-03; 162: R5-05; R5-02 (161 + 162, chờ DOM chốt số ca B);
  - 163: `r5mini-attack` A3; 164: A2;
  - 165, 167: `r5late-sec` A4; 166: `r5late-money` M6.
- ĐÃ BIẾT (1): `r5mini-attack` K1 (xanh ở f04052d).

**(f) Đỏ có chủ đích, chưa có bản đổi.** R15 đua duyệt FOC ‖ đếm (`r4old/race` × 3, `r3mini` R15): chấp nhận 409 `CONCURRENT_UPDATE` và 403 `APPROVAL_LIMIT_EXCEEDED` (Note N-2). Q4 `r4late-qr`: chập chờn hết giờ khi máy tải nặng; tăng thời gian chờ.

**(g) Dọn bộ test cũ.**
- QA thêm vào `s438-superseded.json`: 23 ca ở mục (a)–(d) (trỏ tới `r5old/fixed/`, `r5mini/old/`, `r5rate/*-fixed`) và 67 ca đỏ y hệt 365486f (trỏ tới `r4old/fixed/`, `r4mini/old/`, `r4late/old-*`, `r4rate/old/`). Mục tiêu lượt sau: "0 ca đỏ ngoài Note, BUG-R2-133 và mã đang mở", không phải phân loại lại.
- `br-examples.json`: gỡ `pendingFix` dòng BR-807-02 (151 đã sửa). Sửa note BR-703-02 còn ghi "CHỜ SỬA r9_16, r9_16b, r9_16c, r9_18" (đã xanh). Sửa BR-417-14 `then401` (R5RATE-04). Còn `pendingFix`: BR-309-18 (dời R3), BR-417-03, BR-602-05 (QA giữ).

## Xu hướng

| Lượt | Commit | Phát hiện mới | Major (mã P1) mới | Do vòng sửa trước gây ra | Vùng sinh Major |
|---|---|---|---|---|---|
| 1 | 08dabd3 | 22 | 11 (109…119) | 0 | FOC, đổi căn, hủy/cọc, B9a/B18 |
| 2 | 2f77889 | 15 | 6 (125…130) | 2 (125, 126) | B9a/B18 định mức bảo vệ, giá thỏa thuận, minibar, cọc |
| 3 | 42fb458 | 9 | 5 (134…138) | 1 phần (135) | minibar ×4, giá thỏa thuận |
| 4 | 365486f | 12 | 3 (144…146) | 2 (145, 146) + 6/8 Minor | minibar (kỳ nạp), giá đêm kề, xác nhận lại mật khẩu |
| 5 | ce90d19 | 11 (12 báo cáo, gộp 1) | **5 (158…162)** | 1 hồi quy (158, đã sửa ở #11) + 1 phần (159) + 2/2 P2 tiền (163, 164) | minibar kỳ nạp ×2, giá đêm kề / căn khách mua ×3 |

Lỗi sai số tiền mới (không tính bảo mật): lượt 4 có 2 P1 + 1 P2; lượt 5 có 5 P1 + 2 P2 (163 chỉ qua API chưa client dùng; 164 trên dữ liệu 365486f).

Nhận xét:
- **Số Major không hội tụ**: 11 → 6 → 5 → 3 → **5**. Lượt này tăng lại.
- **Nhưng vùng hội tụ**: cả 5 Major nằm trong đúng hai khái niệm. Mọi vùng khác 0 Major từ hai lượt trở lên: FOC, chênh lệch đổi căn, hủy/cọc BR-309 (157 sạch qua 7 biến thể), B9a/B18 định mức bảo vệ, J8 (151), tiền của đường BR-416-06 (148, 153).
- **Giá đêm kề / "căn khách mua"**: lượt thứ tư liên tiếp, cùng một hàm (126 → 134 → 145 → 155/156 → 160–162). Ba P1 lượt này **không phải hồi quy**. Chúng là tổ hợp chưa có trong đặc tả: S4-09 + OTTIMO đổi căn, OTTIMO đổi đúng đêm đặc biệt, đêm mặc định trùng lịch. Mỗi bản vá thêm một nhánh, người kiểm tìm được tổ hợp kế tiếp. Không đóng bằng vá từng nhánh; cần bảng quyết định (mục "Việc chung").
- **Minibar**: vòng thứ năm liên tiếp. Kỳ nạp của vòng 4 đúng ở 23 ca oracle, nhưng sinh 4 lỗi ở chỗ giao với đường khác: đua tạo kỳ (158), đếm lại trong kỳ (159), hai hệ giờ (163), dữ liệu cũ (164). 158 đã sửa ở #11. 159 và 163 dính nhau, phải sửa cùng lúc.
- **Đường BR-416-06**: tiền sạch; SEC D5 đạt các thẻ Major. Còn 3 P3 về thứ tự kiểm và dấu vết.
- Mã cũ không hồi quy lần nào trong lượt này (3.920 ca × 2).
- Dự báo: nếu vòng sửa 5 đóng 159–164 theo bảng quyết định (giá) và một hàm giữ bất biến (minibar), lượt 6 ngắn, đích danh có thể về 0 Major. Rủi ro chính: bản sửa 159 chạm `onRefillDone`/`createRefillTasks`; phải chạy lại K1, A1, A3 cùng lúc.

## Đối chiếu điều kiện của lượt trước

Các điều kiện lấy từ `s4-money-recheck4.md`, mục Khuyến nghị.

| Điều kiện | Trạng thái ở ce90d19 |
|---|---|
| 1. Đóng 144, 145, 146, mỗi mã có test oracle; 144 cài trọn kỳ nạp; SEC kiểm lại BE-59 | Xong, có số. Oracle BR-703-02, BR-417-11; ca SEC 146. Kỳ nạp cài trọn (ghi, đọc, chặn B18) nhưng còn 158, 159, 163, 164. |
| 2. 147: đồng bộ FOC sau 0065 hoặc decision-log | Xong theo lối (a); chạy qua đường khởi động thật. |
| 3. Sửa cùng vòng 148–151, 153, 154; 152; SEC kiểm lại BE-62, BE-64, thứ tự idempotency | Xong. SEC ghi BE-59…64 Verified (ORC gộp #10). Còn sót: 165 (BE-64), 166 (ĐK 2), 167 (BE-62). |
| 4. DOM ghi (a)–(f) | Xong (decision-log DOM 18/10), kèm T15, T19, F4/F5 thành 155–157. |
| 5. ARC: R1/R7/R9, §16.3, 16.4, 16.5, thứ tự idempotency | Xong (16.13–16.16). Còn: R9 cho việc của lần đếm bị thay; 16.16 (x) hệ giờ; 16.3 cho 0066; 16.15 câu "an toàn nhờ khóa folio"; 16.6 (a). |
| 6. Lượt 5 chạy lại toàn bộ `r4*`, `y-r4*`, `r4old/fixed`; 0 ca đỏ ngoài Note và 133; xem trước = trần QR = ghi **và đúng số** | Chạy đủ (3.920 ca × 2). 0 ca đỏ do lỗi mã ngoài 133 và phát hiện mới. Xem trước = trần QR = ghi ở mọi ca, nhưng 4 đường giá **nhất quán sai số** (160–162). |
| 7. ORC ghi S4-47 và cách chọn 147 | Xong. |
| 8. QA cấp 144…154, đóng 134…139/142/143, sửa tiêu đề 129, oracle 144/145, superseded, `pendingFix` | Xong phần lớn. Danh sách superseded có 178 ca. Còn: gỡ `pendingFix` BR-807-02; sửa note BR-703-02. |
| 9. OPS/DATA: chạy 0064, 0065 trước khi nhận tải; các truy vấn đếm | **Chưa thấy** xác nhận OPS. Nay thêm 0066 và truy vấn của 164. |
| 10. G5: api và E2E xanh trên commit chấm; hoa hồng S4-03 | api 2.763/2.763 × 2 ở ce90d19; CI #10 xanh (E2E 1.907). #11: api 2.773/2.773, QA trước gộp 101/0 (ORC). **Hoa hồng S4-03: chưa thấy phủ.** |

## Gaps

- Cả 4 hướng không chạy E2E/UI. Chưa kiểm: Desk H16 bước 1 (140), hiển thị `reason` ở H16, Desk xử lý 409 `MINIBAR_PERIOD_CHANGED` (#11), hộp xác nhận FE-08, H16 khi định mức bia bị cộng thành 4.
- Gộp #11: critic chỉ chạy `r5mini-attack` trên f04052d. Chưa kiểm đích danh `periodId` / 409 (nhãn `ARC-16.16-ab`) và các cặp đua B13 ‖ `record()`, B18 ‖ `onRefillDone`, `adjustFolioLine` ‖ `onRefillDone`. Kết luận "r5rate, r5late còn nguyên ở #11" suy từ diff, chưa chạy.
- 159: chưa chạy biến thể S4-09 (đơn con quay về) và FOC trên kỳ bị cộng mốc. Một người tái hiện thêm đường vào khác (đếm tủ khi khách còn ở, rồi B14, rồi đếm lại) cũng ra 2 việc.
- 163: chỉ chạy qua API. Chưa client nào gửi lần đếm minibar offline.
- 160–162: chưa chạy `lateFeeAsNightVnd` trên đường 161; chưa đối chiếu MovePlanner (B7) cho đơn thỏa thuận sau OTTIMO đổi căn với BR-429 (b1'); chưa thử khách xin dời vào làn chưa gán rồi OTTIMO gán căn; chưa kết hợp S4-09 với K12 swap, B12, B7a.
- r5late: khóa đăng nhập dựng bằng SQL; thời gian đo trong tiến trình; chưa thử replay phản hồi lỗi đã lưu; chưa đo `foc_count_per_approver` (BR-435) qua báo cáo; chưa kiểm ARC-26 và R3 PIN/TOTP.
- Test cũ chỉ chạy 2 lượt (lượt 4 là 3). Ca phụ thuộc biến môi trường chưa chạy (`R4_MIG`, `Y_PHASE`).
- Không quét lại các vùng đã sạch hai lượt liền (hủy/cọc, FOC chênh lệch, B9a/B18 định mức), ngoài phần chạy lại test cũ.
- Chưa phủ (từ các lượt trước): hoa hồng S4-03 và đơn CTV; dài hạn / HĐ ngoài với `addedNightRate`; trẻ 6–11 tuổi; hủy một phần nhóm sau khóa bậc; chuỗi đơn con của đơn con (B13 qua API luôn gắn đơn gốc).

## Khuyến nghị cổng QC Sprint 4

**CHƯA.** Với commit ce90d19, và cả f04052d:
- **G1 không đạt** ("0 ca lệch tiền"):
  - 159: thu thừa 70.000 mỗi bộ món khi tủ căn cũ được đếm lại trong kỳ rồi khách quay về;
  - 160: lệch ±144.000/đêm thêm sau S4-09 + OTTIMO đổi căn;
  - 161: thu thừa 261.000 / 117.000 khi OTTIMO đổi căn đúng đêm đặc biệt;
  - 162: lệch ±119.000 khi đêm gia hạn mặc định trùng lịch;
  - 164: thu thừa 70.000 mỗi tủ trên dữ liệu 365486f sau 0066;
  - 163: thu thiếu 35.000 qua API offline (chưa client dùng);
  - 158: thu thừa 70.000 (chỉ ở ce90d19; đã sửa ở #11).
- **G7 không đạt** ("0 P0/P1 mở"): 5 P1 ở ce90d19; **4 P1 ở f04052d** (159…162).
- Điểm tốt: 14/14 mã đích đã sửa có số; 0 hồi quy mã cũ; BUG-R2-146 (lỗ hổng P1 lượt 4) đóng; SEC D5 đạt các thẻ Major; hồi quy chung sạch (2.763 + 3.920 ca × 2).

Điều kiện để vào cổng:
1. Đóng **159, 160, 161, 162**. Mỗi mã có test oracle với số ở bảng "Major-fix-now theo gốc".
   - 160–162: DOM/ARC viết bảng quyết định giá đêm thêm **trước khi** BE-A sửa; BE-A sửa một lần theo bảng.
   - 159: ARC bổ sung R9 trước khi code; sửa cùng 163.
2. 158: QA đưa ca A1 vào test chính thức trên commit có #11, rồi đóng.
3. **163, 164 sửa cùng vòng** (P2 nhưng lệch tiền):
   - 164: migration 0067 hoặc `registerFridge` nhận lần đếm NULL, theo cách ORC đã chọn cho 147;
   - 163: so cùng hệ giờ. Nếu không kịp, lối tạm: server từ chối `performedAt` trên lệnh đếm minibar (chưa client nào gửi) cho tới khi sửa; ORC ghi decision-log.
4. SEC ghi quyết định cho 165, 166, 167: sửa trong vòng, hoặc chấp nhận bằng văn bản kèm hạn. Sửa SEC 11.3 (ĐK 2).
5. DOM ghi: bảng quyết định giá (gồm câu chữ BR-417 (2)/(3), BR-429 (b1'), ca B "302 → 101 → B13 → 401"); một câu R9 cho việc của lần đếm bị thay; N-3 phạm vi HK đếm tủ căn cũ.
6. ARC: 16.2 R9, 16.3 (0066), 16.6 (a), 16.15 (bỏ "an toàn nhờ khóa folio"), 16.16 (x) hệ giờ.
7. QA: cấp BUG-R2-158…167 (và hai nhãn ARC mục 1b); đóng 144…157 theo báo cáo này (140 đóng sau khi kiểm Desk); sửa oracle BR-417-14, gỡ `pendingFix` BR-807-02, sửa note BR-703-02; thêm 90 ca vào superseded (mục Test cũ (g)); chuyển ca `z-r5*` vào `test/integration/`.
8. Lượt kiểm lại lần 6 (ngắn, đích danh) trên commit có #11 và vòng sửa 5:
   - chạy lại `test/s438/r5*/`, `z-r5*/`, `r5old/fixed/` và bộ test theo bảng quyết định giá;
   - kiểm đích danh #11: `periodId` / 409, các cặp đua B13/B18/`adjustFolioLine` với `onRefillDone`;
   - mục tiêu: 0 ca đỏ ngoài Note, 123, 133; xem trước = trần QR = ghi **và đúng số**;
   - critic chấm lại một lượt ngắn.
9. OPS/DATA, trước khi đưa dữ liệu vào môi trường dùng thử: chạy 0064 → 0065 → 0066 (→ 0067) trước khi app nhận tải; truy vấn kiểm = 0: lần đếm sống `fill_id` NULL (164), đơn origin NULL (133), folio mở có Σ FOC minibar áp > Σ dòng sống (147), tủ có > 1 việc `minibar_refill` mở trong một kỳ (159).
10. G5: api và E2E xanh trên đúng commit chấm. Hoa hồng S4-03: bổ sung, hoặc ORC ghi rõ việc dời.

**Nếu chỉ còn P2/P3 không lệch tiền**, có thể vào cổng với điều kiện:
- Đã đóng 158…164 (mọi đường lệch tiền), mỗi mã có test oracle xanh trên commit chấm.
- Còn mở được: 165, 166, 167 (P3 SEC, không lệch tiền) khi SEC ghi chấp nhận có hạn; 123 (P3, không lệch tiền); 140 phần Desk (P3, hiển thị).
- 133 lệch tiền nhưng chỉ trên dữ liệu origin NULL trước 0059: được mở khi OPS ghi truy vấn đếm = 0 trên dữ liệu dùng thử; nếu > 0 thì phải sửa trước cổng.
- ORC ghi decision-log danh sách mã mở kèm hạn (tuần Ổn định hoặc R3) và người chịu.

Cổng QC Sprint 4 đang ở tuần Ổn định. G1, G7 chưa xanh, nên QC chưa chấm cổng. Không cấp ngoại lệ tiền. ORC ghi decision-log ngày chấm mới sau lượt kiểm lại lần 6.

## Tệp của critic

Thư mục `/private/tmp/claude-501/-Users-anhvh-Library-Application-Support-Claude-scratch-workspaces-00554cf2-3678-4864-82b0-830aaeaa97bd-4c0caebe-be05-49c5-a5a2-5bf357fddc6a-scratch-2026-10-15-c4f0d4/36df3adc-c586-471c-a039-340d2b696728/scratchpad/s438/r5critic/`:
- `env.sh`, `env-f.sh`
- `run1.log`: ce90d19, 10 tệp, 125 ca, 104 xanh, 21 đỏ (6 BUG-R2-133; r5mini A1, A2, A3, A4, A4b, K1; mb-r5 D1, D2, D3; rate5 R5-01, 02, 03, 05; r5late A4, M6)
- `run-f04.log`: f04052d, `r5mini-attack` 12 ca, 8 xanh (A1, K1 xanh), 4 đỏ (A2, A3, A4, A4b)
- `k1/k1.jsonl`: log BUG-R2-123 (`S1-move-preview` 422)
- `obs-133.jsonl`: số W1–W4, R18
- `r5mini.log`, `r5mini-f04.log`: số A1–A7, K1 trên hai cây
- `rate-obs/rate5.jsonl`: số R5-01…R5-05
- `late/obs-*.jsonl`: số r5late
- `f04/`: cây f04052d giải nén (`git archive`), `node_modules` symlink

Bản chép test: `scratchpad/s438/wt/product/services/api/test/s438/r5critic/` (`rate/` và `late/`, chỉ đổi thư mục ghi số và đường import).

DB `ottimo_test_s438_r5critic` và `ottimo_test_s438_r5critic_f` đã được xóa sau khi chạy.
