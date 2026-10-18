# Kiểm lại tiền S4-38 lần 8 – commit f6803d0

Đây là lượt kiểm lại thứ tám (ngắn, đích danh) của S4-38, Round 2 Sprint 4, tuần Ổn định. Lượt này chấm vòng sửa 7 (gộp #18, `316b9ac`) và vòng sửa 8 (gộp #19, `f6803d0`). Có 4 người kiểm: `r8debt`, `r8rate`, `r8ver`, `r8all`. Họ kiểm 202…206, G-5/AN-50, N-6, N-7, FB-R2-ARC-BE-S4-16 và toàn bộ mã tiền cũ 109…200. Họ báo 8 phát hiện mới; gộp trùng gốc còn 6. Mỗi phát hiện có 2 người tái hiện độc lập (`v8-*`, 16 lượt). Mỗi người tự viết test, tự tính số từ BR bản 18/10 (BR-525, BR-427, BR-433, phụ lục 5A AN-01…AN-50), chạy trên PostgreSQL thật, DB riêng `ottimo_test_s438_r8*` / `v*`, bản sao cố định f6803d0 (`wt19`, src không sửa).

Test nằm ở `scratchpad/s438/wt19/product/services/api/test/s438/` (chưa track). Thư mục `r8*/` của người kiểm, `v8-*/` của người tái hiện. Critic không thêm test mới.

Ghi chú thời điểm:
- Báo cáo chấm commit **f6803d0** (gộp #19). ORC đã ghi decision-log 18/10: đóng băng mã tiền tới cổng QC; BE-S4-17, BE-S4-18, BE-S4-19 dời R3.
- Cây chính có thay đổi **chưa commit** (FE-A, BA SM-10 cạnh A7, DOM FB-R2-SEC-BE-83, `br-examples.json`, BR-525 sửa chữ N-7). Không có mã tiền backend. Critic chỉ đọc, không chạy.
- Số mã: bug-list đã dùng tới **BUG-R2-206**. Critic đề xuất từ **BUG-R2-207**. QA cấp số.

## Tóm tắt

- Mã đích: **202, 203, 204, 205, 206 ĐÃ SỬA**, có số. G-5/AN-50, N-6, N-7, FB-R2-ARC-BE-S4-16 **ĐÃ SỬA**. 202 đóng phần P1 (không còn mất nợ); ca B thiếu audit và thông báo cho phần tăng → tách 209.
- **0 HỒI QUY** mã tiền cũ 109…200 (bộ cũ 801 tệp × 2 lượt: 0 ca đỏ mới). api 2.947/2.947 (lượt 2: 1 ca chập chờn do test, R8ALL-03).
- Giá đêm: **0 lệch** qua 400 chuỗi fuzz G-5 mới (14.385 phép so), 400 chuỗi fuzz7 chạy lại với ref8 (12.718), 440 chuỗi fuzz r6 với ref8 (10.863). Khóa: **0 deadlock** ở mọi đua (72 lượt N-6, 10 cặp lockStay, RA…RI).
- 6 phát hiện (sau gộp), 16 lượt tái hiện đều tái hiện được hành vi:
  - **0 Major-fix-now** (0 P1).
  - 3 Minor P2: 207 (`openDebtVnd` đếm hai lần dòng FOC xóa nợ đăng lại – **sửa trước cổng**); 208 (N-7 ngõ cụt khi công nợ mở = 0); 209 (J15 trên công nợ đang mở không audit, không báo phần tăng).
  - 1 Minor P3: 210 (nợ ghi trước 0076 còn trong cửa sổ lúc deploy).
  - 2 Note: N-11 (A04 `touch` trước L3); N-12 (test tích hợp `s438r4-money` phụ thuộc thứ tự).
- 1 GAP-DOM mới (G-6): cách phân bổ khoản thu trong cửa sổ giữa công nợ và khoản phát sinh.
- Critic chạy lại một lần (DB `ottimo_test_s438_r8critic`): 5 ca, 2 xanh, 3 đỏ. Đỏ đúng chỗ: 207 × 3.
- **Bảo mật**: không có lỗ hổng xác thực, phân quyền, lộ dữ liệu mới. SEC-BE-80/81 đạt. SEC cần review cách sửa 208: nếu N-7 chuyển sang `openDebtVnd > 0` trước khi sửa 207/210 thì MGR lách được BR-433.
- Xu hướng Major: 11 → 6 → 5 → 3 → 5 → 3 → 1 → 1 → **0**. Đã hội tụ ở mức Major. Vùng công nợ vẫn sinh lỗi cùng lớp (số dẫn xuất "công nợ đang mở"), nhưng mức giảm (P1 mất nợ → P2 lệch về phía thấp).
- Khuyến nghị: **ĐẠT CÓ ĐIỀU KIỆN**. G7 đạt. G1 đạt khi sửa 207 (một điều kiện SQL, ngoại lệ hẹp cho đóng băng) và chạy lại bộ tái hiện.

## Kết quả từng hướng kiểm

**r8debt** (202, 203, 206, N-6, N-7; DB `ottimo_test_s438_r8debt`):
- SEC A/B (`reversal-debt-g4`) 27/27. Ma trận 206: nợ 5.000.000, gửi 2M/2M pending, 2M → 422 max 1.000.000, 1M pending, 1 đồng → max 0; từ chối/hủy nhả trần; FD thu 1.500.000; OWN duyệt eff 2.000.000 → 1.500.000 (cap) → `cancelled debt_cleared`. Kết quả due 0, credit 0, FOC 3.500.000, 1 audit `debt_settled`.
- R7LOCK-02 theo hợp đồng mới: 201 `approved` eff 100.000, due 0, `written_off`. BR-433: MGR/MGR2 tự duyệt 403, FD 403. Hoa hồng CTV 8 %: xóa 60.000 trên dòng phòng → 120.000 → 115.200.
- R7LOCK-01 có J15 thật: D+1 10:59 `settled`; 11:00 `closed`, nợ 70.000, 1 audit, 3 thông báo; J15 lần hai 0 thay đổi; thu 70.000 → đóng; thu thêm → 409.
- Đua RA, RB, RC, RD, RE, RF, RG, RI: hai thứ tự × 3 vòng × 2 lượt = tuần tự, deadlocks +0, 5xx 0, credit luôn 0. Quét tự nhiên 20/20.
- `debt-paths` 10/13 × 2 lượt; 3 đỏ đều là R8DEBT-01. Tấn công: R8DEBT-01, -02, -03.

**r8rate** (G-5/AN-50, hồi quy AN-01…49; DB `_r8rate`, `_b`, `_c`, `_d`):
- `min8` 17/17 × 2, số tính tay: 202 thỏa thuận 650.000 dời hẳn 20–22/05 → 23–25/05: 650.000 × 2, chênh 0; B13 thứ Bảy **650.000** (không 911.000); B18 650.000. Biến thể → 401: 650.000. GKM lưu trước min/kẹp (1.000.000; sàn 680.000, lưu 600.000). BR-107 7 đêm: 585.000 gross.
- Bảng AN chính thức 67/67 × 2. Fuzz8g5 400 chuỗi, 1.079 phép so dùng đêm kế thừa, 5.332 kiểm snapshot, 373 kiểm không rò: **0 lệch**.
- `race8` 4 ca × 3 vòng × 2 thứ tự = tuần tự = oracle tay (1.950.000 / 1.350.000 / 1.300.000 / 1.350.000), deadlocks +0.
- Không phát hiện mới. Đỏ của bộ r7rate đều là kỳ vọng cũ (AN-50, N-6).

**r8ver** (N-6, 204, migration 0076/0077):
- N-6 đọc src: mọi chỗ ghi `folio_line`/`payment` gọi `touch`, trừ 3 ngoại lệ ARC. Chạy 43 đường × 2 lượt: version tăng, A32 ETag cũ → 412, tiền y hệt. Đua A32 với 6 thao tác, 72 lượt = tuần tự.
- 204: pipeline 3 pha r7mig về f6803d0, 10 lượt. Dạng 197 RAISE và rollback; dạng R7MIG-01 MIGRATE_OK, K1 3 → 0, B18 70.000 một lần; dữ liệu sạch qua; `drizzle-kit generate` "No schema changes".
- 0076/0077 trên dữ liệu thật của 316b9ac (14 đơn): MIGRATE_OK 53 → 55, snapshot trước = sau. Yêu cầu chờ từ app cũ duyệt sau migrate: không dư thừa (ca SEC B: W1 áp 3.000.000, W2 `debt_cleared`).
- Tấn công: R8VER-01 (= R8DEBT-01), R8VER-02.

**r8all** (hồi quy 109…200, 205, 202, N-6 thứ tự khóa, lockStay):
- Bộ cũ r7all/all 801 tệp × 2: 4.038/318/159 và 4.037/319/159, y hệt hồ sơ lượt 7, 0 ca đỏ mới. Họ r6*/w-r6*/r7*/v7-* 109 tệp × 2: mọi ca đỏ đã phân loại (kỳ vọng cũ).
- 205: `partyOverCount` 1 → hết khi gỡ người thừa; 0 dòng `extra_person`; B18 không đổi.
- Audit khóa bằng `pgrowlocks`: 9.980 lần `touch` dưới L3, trừ A04 (N-11).
- `adjust-lockstay` 10/10 cặp + `child-night` 2/2 + J15 ‖ A32 void: = tuần tự, deadlocks +0.
- Tấn công: R8ALL-01 (= R8DEBT-03), R8ALL-02, R8ALL-03.

## Trạng thái mã

| Mã | Mức | Trạng thái ở f6803d0 | Bằng chứng có số | Ghi chú |
|---|---|---|---|---|
| BUG-R2-109…200 (trừ 123) | P1–P3 | ĐÃ SỬA, **0 hồi quy** | r7all/all 801 tệp × 2, 0 ca đỏ mới; api 2.947 × 2. | 18 ca keep nay xanh. |
| BUG-R2-199 | P3 | **ĐÃ SỬA** (dung sai 5 phút, ARC 16.29) | 6 ca đổi kỳ vọng (`w-r6misc-1-*`, `r6misc/k1109-hk163`) không có trong danh sách đỏ của họ r6 × 2. | Đủ điều kiện Closed của bug-list. |
| BUG-R2-201 | P2 | Closed – theo thiết kế (ARC 16.28 (b)) | Không kiểm riêng. Thu thêm trên folio `closed` → 409 (r8debt). | DOM đã đồng ý (ARC 16.30.6). |
| BUG-R2-202 | P1 | **ĐÃ SỬA** phần P1 | Ca A: J15 → `closed`, nợ 70.000, audit [70.000], 3 thông báo, hạn J15 + 3; J15 hai lần 1 công nợ; thu → đóng, thu thêm 409. Ca B tiền: 170.000, thu đủ đóng. Đua RC, J15 ‖ đảo, J15 ‖ A32 void = tuần tự. | **Ca B thiếu audit/thông báo phần 70.000** → 209. Ca C (yêu cầu hoàn mở) không kiểm lượt này. |
| BUG-R2-203 | P2 | **ĐÃ SỬA** | `debt_write_off` 100.000 trong cửa sổ và sau J15 → 201 `approved`, due 0, `written_off`; `service_recovery` 409. CTV 120.000 → 115.200. Đua RG = tuần tự. | `r7lock` ca "write-off" đổi kỳ vọng. |
| BUG-R2-204 | P2 | **ĐÃ SỬA** | 10 lượt pipeline; dạng 197 RAISE đúng tủ; R7MIG-01 qua, B18 70.000 một lần; sạch qua; repce9 đúng. | – |
| BUG-R2-205 | P2 | **ĐÃ SỬA** | 201 `partyOverCount` 1; get/PATCH giữ; DELETE → hết; 0 phụ thu; B18 không đổi. | – |
| BUG-R2-206 | P1 | **ĐÃ SỬA** | SEC A/B 27/27; ma trận 206 (số ở trên); đua RA, RB, RI (Σ áp 4M) credit 0. | Trần lúc duyệt dựa `openDebtVnd` → bị 207 làm thấp (không sinh dư thừa). |
| G-5 / AN-50 | – | **ĐÃ SỬA** | B13 thứ Bảy 650.000; fuzz8g5 0 lệch; `race8` = tuần tự. | – |
| N-6 | Note | **ĐÃ SỬA** | 43 đường × 2: 412, tiền y hệt; 72 lượt đua. | Ngoại lệ A04 → N-11. |
| N-7 / SEC-BE-81 | Note | **ĐÃ SỬA** | MGR/OWN void, hạ giá, giảm số lượng → 409; tăng → 201; đơn không nợ → 201. Đua RF đúng. | Ngõ cụt khi công nợ mở = 0 → 208. |
| FB-R2-ARC-BE-S4-16 | Major ARC | **ĐÃ SỬA** | P9, P10 (dòng đêm ‖ B7, B13), đơn con B9a ‖ B13/B18: deadlocks +0. | – |
| BUG-R2-123 | P3 | Không kiểm | – | Tuần Ổn định. |

## Critic chạy lại

Không mã nào báo chưa sửa. Critic chạy **một lần** các ca đỏ của phát hiện mới và hai ca liên quan.

- Cây `wt19` @ f6803d0, src không sửa. DB mới `ottimo_test_s438_r8critic` (`newdb.sh`). `vitest run test/s438/r8debt/debt-paths.test.ts -t "R8DEBT-01|N-7 dead end|R7LOCK-01" --no-file-parallelism`, 5 giây, load ~2,4.
- 5 ca: **2 xanh** (R7LOCK-01, N-7 dead end), **3 đỏ** (R8DEBT-01 × 3). Trùng đúng chỗ người báo.
- **R8DEBT-01 submit**: cơ sở 750.000, s = 749.000. Sau tự áp: open 4.251.000 = due. A32 +10.000: due 4.261.000, **open 3.502.000** (thiếu đúng s). Dòng FOC: [−749.000 đã bị đảo, có `approval_request_id`; +749.000 dòng đảo, không gắn; −749.000 mới, có gắn]. Gửi 4.251.000 → **422 max 3.502.000**. Hết cửa sổ: open = due 4.261.000.
- **R8DEBT-01 approval**: s = 707.000, chờ 4.293.000, không ai trả. OWN duyệt → **200 approved eff 3.586.000**, audit `approval.applied_capped` lý do `debt_collected_before_approval`. Cuối: due **717.000** (đúng 10.000), open 0, công nợ vẫn mở. MGR xóa thêm 1.000 → 409 `INVALID_TRANSITION`.
- **R8DEBT-01 auto-cancel**: 4 × 791.000 tự áp, chờ 1.836.000. Sau A32: open 0, due 1.846.000. OWN duyệt → **200 cancelled eff 0 `debt_cleared`**, 3 thông báo `approval_cancelled`. Công nợ vẫn mở.
- Hai ca xanh không in log khi đạt. Critic dùng số của `scratchpad/s438/r8debt/paths3.evidence`: R7LOCK-01 có đảo → `closed`, due 170.000, open 170.000, audit **[100.000]**, thông báo **2**; N-7 dead end → void 409, `debt_write_off` 422 max 0, đối chứng void 201.

Critic đọc lại mã f6803d0. Mã khớp mô tả:
- `frontdesk/internal/checkout.service.ts` 453–463 `debtReductionsVnd`, vế `off`: chỉ lọc `l.reversal_of_id IS NULL`, không loại dòng gốc đã bị đảo. Chú thích ghi "giữ dòng gốc dù bị đảo" – đúng cho khoản thu (đảo thu ghi phần tăng riêng), sai cho FOC xóa nợ (đăng lại không ghi phần tăng).
- Cùng tệp 300–315 `writeDebt`: mở chu kỳ mới khi `debt_opened_at IS NULL` (gốc 210). 258 `debtOnCheckout`: `checkout_mode = 'debt' && debt_settled_at === null` → `none` (gốc 209).
- `folio/internal/folio-lines.service.ts` 493: N-7 chặn khi `openDebt(...) !== null` (gốc 208).
- ARC 16.30.3 viết: "công nợ đang mở chỉ còn tụt dưới số đã duyệt khi khách trả trong lúc chờ". 207 phá giả định này, nên lý do `debt_collected_before_approval` ghi sai.

## Critic – phân xử phát hiện mới

| Mã | Kết luận | Mức | Ai sửa | BUG đề xuất | Lý do |
|---|---|---|---|---|---|
| R8DEBT-01 + R8VER-01 (cùng gốc): `openDebtVnd` đếm hai lần dòng FOC `debt_write_off` khi A32 tăng dòng làm FOC đăng lại → trần gửi thấp, OWN duyệt bị áp thiếu kèm audit sai lý do, hoặc tự hủy `debt_cleared` khi khách còn nợ | Minor, **sửa trước cổng** | P2 | BE-A (`debtReductionsVnd`) + BE-B (phối hợp: test `foc.service`) + QA | **BUG-R2-207** | 4/4 tái hiện, 4 lượt chạy độc lập cùng gốc, critic chạy lại đỏ. Sai số cộng dồn theo số lần đăng lại (C3: 70.000 → 40.000 → 10.000). Phá bất biến BR-525 (ii). Lệch hợp đồng `requestFoc`/`approveRequest` (ARC 16.30.3, 16.30.6), SM-10 cạnh A7 (tự hủy chỉ khi công nợ mở = 0). **Không P1**: luôn lệch về phía thấp, sổ khớp, không dư thừa, không mất nợ, không vượt BR-433, hết cửa sổ tự đúng. **Vẫn tính vào G1**: còn phải thu sau khi OWN duyệt khác oracle hợp đồng (10.000 → 717.000; C7: tự hủy khi còn nợ 1.351.000). Khách bị đòi nhiều hơn quyết định của OWN; thông báo "công nợ đã thu đủ" sai. Tiền lệ: 200 (P2, "có lệch tiền"). Do vòng sửa 8 (`git log -S` chỉ ra f6803d0). |
| R8DEBT-02: N-7 chặn A32 giảm khi chu kỳ nợ còn mở nhưng công nợ mở = 0; `debt_write_off` lại 422 max 0 → khoản ghi nhầm trong cửa sổ không sửa được | Minor | P2 (nâng từ P3) | DOM + ARC chốt điều kiện; BE-B (`folio-lines.service.ts` 493); BE-A (cổng `openDebt`); FE-A (câu Desk khi max = 0) | **BUG-R2-208** | 4/4 tái hiện (6/6 và 3/3 lần, hai thứ tự). Cả hai người tái hiện đề P2. Đối chứng quyết định: **cùng trạng thái tiền** (nợ mở 0, khoản trong cửa sổ 70.000) cho 409 hoặc 201 chỉ do thu nợ đến trước hay sau khoản phát sinh. Lệch BR-525 (ii), câu N-7 "khi không có công nợ giữ như cũ", mô tả `adjustFolioLine`/`requestFoc`. Mã đúng chữ ARC 16.30.4 ("`openDebt` ≠ null") → khe hở hợp đồng. Không P1: không sai tiền; sau J15 có đường `debt_write_off` (ghi chú "ghi sai" theo BR-525). **Phụ thuộc 207/210** (xem bảo mật). Do vòng sửa 8. |
| R8DEBT-03 + R8ALL-01 (cùng gốc): J15 trên folio đã có công nợ mở gộp khoản phát sinh vào nợ nhưng không audit `reservation.debt_on_checkout`, không báo `debt_recorded`, không cộng `debt_recorded_vnd`, giữ hạn cũ | Minor | P2 | ARC (sửa 16.27 mục 1 gạch 3) + BE-A (`debtOnCheckout` → `writeDebt` `keep: true` cho phần tăng) + DOM (hạn phần tăng) + QA (ca B vào TC-L4-149) | **BUG-R2-209** | 4/4 tái hiện; ba người P3, một người P2. Critic chọn **P2**: (1) BR-427 (d) đòi "báo quản lý" – thiếu thông báo là chức năng sai, không phải câu chữ; (2) thiếu một bút toán trong nhật ký tiền (Σ audit 100.000 ≠ nợ 170.000); (3) phụ thuộc thứ tự: J15 trước → 2 audit, đảo trước → 1 audit, cùng số tiền; (4) đây là tiêu chí ca B mà lượt 7 đặt để đóng 202 (P1). Tiền đúng mọi mốc, nên không P1. ARC 16.27 chỉ bỏ sót, không nói "không báo" → BR thắng. **Hạn**: critic đề nghị **giữ hạn cũ** cho công nợ gộp (khớp G-4 `keep: true`, BR-525 (b)), sửa oracle BR-525-02 `after24h.debtDueDate`; DOM chốt. Gốc ở vòng sửa 7 (J15). |
| R8VER-02: nợ ghi trước 0076 còn trong cửa sổ lúc deploy; lần ghi nợ mới mở chu kỳ chỉ với phần tăng, bỏ nợ cũ khỏi `openDebtVnd` | Minor | P3 | BE-A (`writeDebt`: đơn nợ chưa có chu kỳ → khởi tạo `recorded` = còn phải thu trước + phần tăng; hoặc migration bù mới) + OPS | **BUG-R2-210** | 4/4 tái hiện (pipeline 3 pha thật, `git archive 316b9ac`). Một người P2 (ca L4: tự hủy `debt_cleared` khi nợ 2.000.000 còn mở), một người P3. Critic chọn **P3** với điều kiện OPS: chỉ xảy ra khi dữ liệu công nợ của app trước 0076 còn trong cửa sổ 24 giờ lúc deploy **và** có lần ghi nợ mới trong cửa sổ đó. Sản phẩm chưa có dữ liệu thật. Lệch luôn về phía thấp, tự đúng ở J15. Nếu ORC/OPS không xác nhận được điều kiện → nâng P2, sửa cùng 207. Do vòng sửa 8 (0076). |
| R8ALL-02: `touch` ở A04 `confirmDeposit` chạy khi chưa giữ L3 (folio chỉ KEY SHARE, lấy NO KEY UPDATE trước L2) | Note | P3 | ARC (sửa câu 16.30.5, ghi ngoại lệ A04 hoặc dòng B4 trong 16.19) + BE-B (R3) | – (N-11) | 4/4 tái hiện bằng hai cách đo khác nhau (`pgrowlocks`; thăm `NOWAIT` từ kết nối thứ hai). Đua A04 ‖ `recordPayment` 18 ca = tuần tự, deadlocks +0. Không sai tiền, không kẹt. **Đính chính hướng sửa**: "`FolioService.lock` trước `recordManual`" vẫn trái 16.19 (L3 trước L2). Hướng đúng: A04 lấy L2 rồi L3 trước khi ghi phiếu thu, hoặc ARC ghi ngoại lệ có tên. Trong đóng băng: ARC sửa văn bản; mã để R3. |
| R8ALL-03: test tích hợp `s438r4-money` "ARC 16.16 bổ sung 2" đỏ khi khoản thu 10.000 chạy trước dòng (còn phải thu 0 → 422 `REASON_REQUIRED`) | Note (lỗi test) | P3 | BE-A (chủ test) + QA | – (N-12) | 4/4 tái hiện; ép thứ tự 2 và 3 chiều. Sản phẩm đúng DOM G-15; tiền khớp mọi thứ tự. Test đổi kỳ vọng (mục Test cũ (e)). Chỉ sửa test – được làm trong đóng băng. Ghi chú phụ: thu dư thiếu note, mã trả `VALIDATION_FAILED` `note REASON_REQUIRED`, còn văn bản (openapi bảng mã 0.3.6, EP03-05 2.2) ghi `AMOUNT_EXCEEDS_BALANCE` kèm `max`. Có từ S3 (789ac90). ARC/BA chốt một mã. |

Phân loại bảo mật cho SEC:
- Không có lỗ hổng xác thực, phân quyền hay lộ dữ liệu mới.
- **Đã đạt**: FB-R2-SEC-BE-80 (206 – dư thừa ca A/B không còn, credit 0 ở mọi đua); FB-R2-SEC-BE-81 (N-7 – MGR và OWN đều 409 khi giảm). SEC có thể ghi Verified bằng bằng chứng `r8debt`, `r8ver`.
- **Cảnh báo cho cách sửa 208**: nếu N-7 đổi sang `openDebtVnd > 0` khi 207 còn, MGR một mình làm được: tự áp vài lần ≤ giá 1 đêm, rồi A32 tăng dòng lặp lại 8–9 lần (R8VER-01 ca (5)) → `openDebtVnd` về 0 → void dòng nợ không qua OWN. Đó là lách BR-433, đúng điều SEC-BE-81 chặn. Thứ tự bắt buộc: 207 → 210 → 208, SEC review 208, test "A32 tăng lặp rồi giảm".
- **Nhật ký tiền sai hoặc thiếu** (không khai thác được để lợi): 207 ghi `debt_collected_before_approval` khi không ai trả và báo OWN/MGR "công nợ đã thu đủ"; 209 thiếu bút toán `debt_on_checkout` cho phần tăng.
- **Đã biết, R3**: FB-R2-SEC-BE-83 (chia nhỏ xóa nợ dưới giá 1 đêm – r8debt chạy lại: MGR tự áp 5 lần, mỗi lần ≤ giá 1 đêm 708.000, tổng 3.000.000, không qua OWN). DOM đã chốt cộng dồn theo folio, cài trước dữ liệu thật.

## Sửa trước cổng (danh sách cho BE)

| BUG đề xuất | Phát hiện | Ai sửa | Chỗ sửa (f6803d0) | Số đúng cho test |
|---|---|---|---|---|
| BUG-R2-207 | R8DEBT-01, R8VER-01 | BE-A (+ BE-B, QA) | `checkout.service.ts` `debtReductionsVnd`, vế `off`: thêm `AND NOT EXISTS (SELECT 1 FROM folio_line r WHERE r.reversal_of_id = l.id)` – cùng mẫu `afterWriteOff` của `foc.service.ts`. Sửa chú thích: giữ dòng gốc đã đảo chỉ áp cho khoản thu. Không đổi đường ghi, không migration. Sửa kèm câu giả định ở ARC 16.30.3. | **Submit**: G-4 5.000.000 trong cửa sổ; MGR tự áp s = 749.000 trên dòng fnb; A32 +10.000 → open **4.251.000**, due 4.261.000; gửi 4.251.000 → **201 pending**. **Approval**: s = 707.000, chờ 4.293.000, không ai trả → OWN duyệt **200 approved eff 4.293.000**, **không** `applied_capped`, due **10.000**. **Auto-cancel**: 4 × 791.000 tự áp, chờ 1.836.000, A32 +10.000 → OWN duyệt **approved eff 1.836.000**, due 10.000. **Cộng dồn**: A32 +50.000 rồi +20.000 → open giữ **70.000** (xóa 30.000 trên nợ 100.000). Dòng phòng, đổi số lượng: cùng kết quả. **Oracle độc lập**: đã xóa = −Σ dòng FOC `debt_write_off` posted, không phải dòng đảo, chưa bị đảo. **Bất biến** BR-525 (ii) ở mọi bước. **Đối chứng giữ nguyên**: không A32 (4.334.000), ma trận 206, SEC A/B 27/27, đua RA…RI = tuần tự, credit 0, hết cửa sổ open = due. |

Việc chung:
- QA chuyển 3 ca `r8debt` "R8DEBT-01", `r8ver/opendebt-probe` (C1–C3, C6, C7) vào `test/integration/`.
- OPS dựng lại DB QA/demo/staging sau gộp: chu kỳ nợ mở trên DB đã chạy f6803d0 có `debt_base_vnd` tính bằng công thức cũ, sẽ cao sau khi sửa.

## Minor, Note và GAP-DOM – kế hoạch

| Mã | Mức | Ai | Kế hoạch |
|---|---|---|---|
| BUG-R2-208 (N-7 ngõ cụt) | P2, **trước bản dùng thử**, sau 207 và 210 | DOM + ARC; BE-B; BE-A; FE-A; SEC | DOM/ARC chốt "còn công nợ mở" = theo **số** (BR-525 (ii)). Critic đề nghị: A32 giảm được khi phần giảm ≤ khoản trong cửa sổ (còn phải thu − `openDebtVnd`), tức không chạm phần nợ. Sửa ARC 16.30.4 và mô tả `adjustFolioLine`. Số: đảo 100.000, phát sinh 70.000 trong cửa sổ, FD thu 100.000 → void 70.000 → **201**, due 0 (hai thứ tự, như đối chứng C2). Còn nợ thật (thu 50.000) → void 409 như cũ. Ca SEC: tự áp + A32 tăng lặp → giảm vẫn **409**. Biến thể RE (tăng 10.000 rồi thu 100.000) → giảm về được. |
| BUG-R2-209 (J15 phần tăng) | P2, **trước bản dùng thử** | ARC; BE-A; BE-B; DOM; QA | ARC sửa 16.27 mục 1 gạch 3: đã có công nợ mở mà còn phải thu > `openDebtVnd` → ghi phần tăng bằng `writeDebt` `keep: true` (audit `reservation.debt_on_checkout` actor system, `debt_recorded` OWN + MGR, cộng `debt_recorded_vnd`), rồi đóng. Số (BR-525-02): đảo 100.000 lúc 17:00 → audit [100.000]; J15 D+1 10:00 → audit **[100.000, 70.000]**, thông báo thêm OWN + MGR, `debt_recorded_vnd` 170.000, nợ 170.000. Đua J15 ‖ đảo hai thứ tự → cùng 2 audit. Ca B18 nợ 200.000 + 70.000 → audit phần 70.000. Hạn: DOM chốt (critic đề nghị giữ hạn cũ, sửa oracle `after24h.debtDueDate`). |
| BUG-R2-210 (nợ trước 0076) | P3 | OPS/ORC; BE-A (R3) | Điều kiện cổng: OPS/ORC ghi decision-log "không môi trường nào mang công nợ ghi bởi app trước 0076 còn trong cửa sổ 24 giờ lúc deploy" (dựng lại DB, hoặc chờ J15 đóng hết cửa sổ trước khi deploy). R3: `writeDebt` khởi tạo chu kỳ cho nợ cũ bằng còn phải thu trước + phần tăng. Số: nợ G-4 cũ 100.000 + 70.000 trong cửa sổ, đảo thêm 834.000 → open **934.000**; nợ B18 cũ 2.000.000, đảo 916.000 → open **2.916.000**, OWN duyệt không tự hủy. |
| N-11 (A04 `touch` trước L3) | Note | ARC; BE-B (R3) | ARC sửa câu 16.30.5 ("hiện không có đường nào như vậy"), ghi dòng B4 `confirmDeposit` trong 16.19. R3: A04 lấy L2 → L3 trước khi ghi phiếu thu. Test `folio-version-touch` thêm khẳng định "`touch` dưới FOR UPDATE". |
| N-12 (`s438r4-money` + mã lỗi thu dư) | Note | BE-A; QA; ARC/BA | Sửa test (mục Test cũ (e)). ARC/BA chốt một mã cho "FD+ thu dư thiếu note". |
| N-13 Đảo khoản thu trên folio `closed` | Note | DOM; ARC | Mã cho `reversePayment` trên folio `closed` (200, mở chu kỳ mới, có audit – r8ver M3, ghi chú của người tái hiện R8DEBT-03). Việc này cần thật (chuyển khoản bị hoàn sau 24 giờ). Nhưng BR-525 và ARC 16.28 ghi "sau khi đóng chỉ còn thu nợ và xóa nợ". Sửa câu: thêm "đảo khoản thu (G-4)". Thêm vào ma trận đua (chưa ai chạy RD trên `closed`). |
| N-14 Văn bản và oracle | Note | DOM; QA | BR-525 ví dụ (ii) còn "17/11 **15:00**" → 10:00 (BR-427 (d) đã đổi). BR-525 "409 `INVALID_TRANSITION`" → `FOLIO_LOCKED`: đã sửa ở cây chính, chưa commit. Oracle BR-417-24 `nightSource: agreed` → `source default` + `agreedRateVnd` 650.000 (ARC 16.30.2). |
| N-15 A32 giữa hết cửa sổ và lần chạy J15 | Note | ARC | Folio còn `settled`, `checkout_mode` desk → A32 giảm được không qua `debt_write_off`. Khoảng hở bằng một chu kỳ job. Ghi vào 16.27 hoặc cho `adjustFolioLine` coi "quá `post_checkout_window_until`" như `closed`. |
| G-6 Phân bổ khoản thu trong cửa sổ | GAP-DOM | DOM | Nợ G-4 1.000.000 + phát sinh 300.000; khách trả 300.000 qua link cho khoản phát sinh, nhưng mã coi mọi khoản thu là trả nợ trước → open 700.000. Lệch thấp, J15 sửa lại. Critic đề nghị ghi đúng quy tắc mã ("khoản thu trả công nợ trước") vào BR-525 kèm ví dụ này. Quy tắc này cũng quyết định 208. |
| N-8, N-9, N-10; G-1, G-3 | Note | – | Như lượt 7, không kiểm lại. N-6, N-7 đã đóng. |
| BUG-R2-123 | P3 | BE-A + ARC | Tuần Ổn định. |

## Test cũ phải đổi kỳ vọng

Không phải lỗi mã. Bản đã đổi nằm trong thư mục của người kiểm.

**(a) Công nợ, xóa nợ (hợp đồng vòng 7–8).**

| Tệp / ca | Cũ → mới | Căn cứ |
|---|---|---|
| `r7lock/reversal-debt` "write-off" | `reasonCode` `service_recovery` → **`debt_write_off`**; `service_recovery` trên folio `settled` giữ 409 `FOLIO_LOCKED`. Thay bằng `r8debt/debt-paths` "R7LOCK-02" | ARC 16.27 mục 2 |
| `r7lock/reversal-debt` "BR-525-02 / BR-427 (d)" | Chạy J15 thật (`JobRunner.runOnce('folio.close')`), mốc trả phòng + 24 giờ. Phần tiền 170.000. **Giữ** assert `debtAudits [100.000, 70.000]` (đỏ tới khi sửa 209) | ARC 16.27; 209 |
| `v7-r7lock-1-1` × 2 | A32 giảm dòng khi còn nợ → **409 `FOLIO_LOCKED`** | N-7 |

**(b) Giá đêm (AN-50) và N-6.**

| Tệp / ca | Cũ → mới | Căn cứ |
|---|---|---|
| `r7rate/min7` "PROBE (BR-literal)" | B13 thứ Bảy **911.000 → 650.000** | AN-50 |
| Fuzz7 với `ref7` (50 chuỗi đỏ, 2 seed) | Thay bằng `fuzz8r7` (`ref8`): 400/400 xanh | AN-50 |
| `r7rate/race7` R1 "B7 first", R2 "B9a first" | [200, 201], 2.000.000, đêm 0 700.000 → **[200, 412 `VERSION_CONFLICT`]**, 1.950.000, 650.000 | N-6, ARC 16.29 |
| `r7rate/race7` etag-probe | `silent = [B7, B9a, B13]` → **[]** | N-6 |

**(c) Migration.**

| Tệp / ca | Cũ → mới | Căn cứ |
|---|---|---|
| `r7mig` p3 M6 ở biến thể `R7_EXT=M1` | 409 do kịch bản (M1 đã gia hạn) → thay bằng **M6x** (`r8ver/r7mig/p3x`, trả phòng 14/03) | kịch bản |
| `repce9` | Chạy với dmg "M1"; M9 đã trả phòng vẫn RAISE | ARC 16.17 |

**(d) Còn từ lượt 7, chưa vào `s438-superseded.json`** (r8all: vẫn đỏ y hệt): `cancel` R1 × 6; `r2move` R9 × 4; `minibar-catalog-gone` × 11; `k11lock/fridge-pairs` × 2; `q-k11period-3-0` × 3 (cả bản `r7mig/fixed`); `r5mini` A3 (cả bản `r7mig/fixed`); `z-r5mini-2-1` Z1; `r6lock/minibar` × 3; `r6fix/new/k1105` × 2; `be73-money` A202/B302; `v7-r7all-0-1` S202/S302; `w-r6fix-1-0` × 6 (COW ‖ đếm null → 201 đúng K11-02); `r7all/fixed/r2move` R23b. QA thêm cùng các ca ở (a)–(c).

**(e) Test tích hợp chính thức (CI).**

| Tệp / ca | Cũ → mới | Căn cứ |
|---|---|---|
| `test/integration/s438r4-money` "ARC 16.16 bổ sung 2 (deadlock class)" | Khoản thu 10.000 kèm `note`, hoặc chỉ thu khi còn phải thu > 0, hoặc chấp nhận {201, 422 `REASON_REQUIRED`} kèm oracle tiền. Sửa chú thích: điểm tuần tự của dòng và khoản thu là L3 folio | DOM G-15; N-12 |

**(f) Giữ đỏ, vì đây là lỗi mã.** Không đổi kỳ vọng:
- 207: `r8debt/debt-paths` "R8DEBT-01" × 3; `r8ver/opendebt-probe` (3 ca); `v8-r8debt-0-0`, `v8-r8debt-0-1`; `v8-r8ver-0-0`, `v8-r8ver-0-1` (C1, C2, C3, C6, C7).
- 209: phần audit/thông báo của `v7-r7lock-0-0`, `v7-r7lock-0-1` (BR-525-02) và `r7lock` (sau khi thêm J15).
- 210: `r8ver/mig-p2` "M4"; `v8-r8ver-1-0`; `v8-r8ver-1-1` (LEGACY 6/6).

**(g) Đang khẳng định hành vi lỗi – đảo khi sửa 208**: `r8debt` "N-7 dead end?" (quan sát); `v8-r8debt-1-0` (9 ca), `v8-r8debt-1-1` (7 ca) khẳng định 409/422 max 0.

## Xu hướng

| Lượt | Commit | Phát hiện mới | Major (mã P1) mới | Do vòng sửa trước gây ra | Vùng sinh Major |
|---|---|---|---|---|---|
| 1 | 08dabd3 | 22 | 11 (109…119) | 0 | FOC, đổi căn, hủy/cọc, B9a/B18 |
| 2 | 2f77889 | 15 | 6 (125…130) | 2 | định mức bảo vệ, giá thỏa thuận, minibar, cọc |
| 3 | 42fb458 | 9 | 5 (134…138) | 1 phần | minibar × 4, giá thỏa thuận |
| 4 | 365486f | 12 | 3 (144…146) | 2 + 6/8 Minor | minibar kỳ nạp, giá đêm kề, xác nhận mật khẩu |
| 5 | ce90d19 | 11 | 5 (158…162) | 1 hồi quy + 1 phần + 2 P2 | minibar kỳ nạp, giá đêm kề / căn khách mua |
| 5b | f04052d (#11) | 9 + 2 trùng | 3 (171…173) + 163 nâng | 1 hồi quy (171) | khóa B18/folio, định danh tủ, copy-on-write |
| 6 | 723179b (#13) | 6 | 1 (195) | 0 hồi quy; 195 sửa chưa đủ | giá đêm thêm – MovePlanner |
| 7 | cc02fba (#17) | 5 | 1 (202) | 0 hồi quy; 1 P2 (204) | công nợ sau trả phòng – J15 thiếu từ S3 |
| **8** | **f6803d0 (#19)** | **8 → 6 sau gộp** | **0** | **0 hồi quy; 5/6 do vòng 7–8 (207, 208, 210, N-11 vòng 8; 209 vòng 7)** | **– (P2: số dẫn xuất công nợ đang mở)** |

Lỗi sai số tiền mới (không tính bảo mật): lượt 7 có 1 P1 (mất nợ); lượt 8 có **0 P0/P1, 1 P2 lệch số áp xóa nợ về phía khách sạn (207), 0 lệch sổ**.

Nhận xét:
- **Hội tụ ở mức Major.** Hai lượt liền 1 → 0. Ba lượt liền 0 hồi quy mã cũ. Giá đêm thêm: hai lượt liền 0 lệch, nay có thêm trục kế thừa thỏa thuận (1.079 phép so). Khóa: 0 deadlock, kể cả thứ tự L1 mới của A32 và đơn con.
- **Vùng công nợ/xóa nợ vẫn sinh lỗi cùng lớp.** 4/4 mã mới nằm ở đây, đều do vòng 7–8 thêm vào tuần Ổn định. Lớp chung: **ba định nghĩa "công nợ mở" chạy song song** – `openDebt()` khác null (chu kỳ còn mở, theo `debt_settled_at`), `openDebtVnd` (số dẫn xuất từ cột chu kỳ + Σ giảm), và dự phòng `balanceDue` (hết cửa sổ, nợ cũ). 207 sai công thức Σ giảm; 208 dùng định nghĩa thứ nhất ở chỗ cần định nghĩa thứ hai; 210 rơi khỏi dự phòng; 209 là nhánh J15 bỏ qua ghi nợ khi chu kỳ đã mở.
- **Mức đang giảm.** Lượt 7: P1 mất nợ. Lượt 8: mọi lỗi lệch về phía thấp (trần chặt hơn), không dư thừa, không mất nợ, tự đúng ở J15. Lý do: thiết kế 206 (kẹp trong [0, còn phải thu], trần chỉ chặn) làm số dẫn xuất sai thì chỉ chặn thừa.
- **Cách chặn lớp này** (rút từ hai cách làm của lượt 7): (1) một hàm duy nhất "công nợ đang mở" đọc từ sổ (dòng FOC sống, khoản thu), mọi nơi (N-7, trần gửi, trần duyệt, tự hủy, J15) gọi hàm đó; (2) QA dựng **fuzz công nợ** so với hàm tham chiếu đọc sổ, kiểm bất biến BR-525 (ii) sau mọi thao tác (G-4, B18 nợ, J15, thu, đảo khoản thu nợ, xóa nợ tự áp/chờ/duyệt/từ chối/hủy, A32 tăng/giảm, đăng lại FOC). Bất biến (ii) bắt được cả 207, 208, 210 – người tái hiện R8VER-01 đã thấy nó vỡ. Làm trước bản dùng thử, không chặn cổng.
- Dự báo: sửa 207 đúng số thì lượt sau (nếu có) không còn lỗi tiền đã biết. Rủi ro còn lại là nguồn đăng lại FOC chưa thử (nhánh dòng đêm S4-35); cách sửa 207 phủ chung mọi nguồn đăng lại.

## Đối chiếu điều kiện của lượt 7

| Điều kiện (`s4-money-recheck7.md`, mục Khuyến nghị) | Trạng thái ở f6803d0 |
|---|---|
| 1. Đóng 202; ARC thêm J15 vào 16.19 | Xong phần P1 (ca A, tiền ca B, đua). Ca B audit/thông báo chưa → 209. Ca C (yêu cầu hoàn mở) không kiểm lượt này. J15 có trong dòng L1 của 16.19. |
| 2. Đóng 203; SEC review `debt_write_off`; DOM/ARC chốt 201 và N-7 | Xong. SEC C.12 sinh 206, đã sửa. 201 theo thiết kế (16.28 (b)). N-7 cài, 409 mọi vai. |
| 3. Đóng 204, pipeline 3 pha cả ce90d19 và f04052d | Xong, 10 lượt. |
| 4. DOM chốt G-5 | Xong: AN-50 kế thừa; fuzz8g5 0 lệch. |
| 5. Lượt kiểm 8 ngắn | Xong (báo cáo này). Đạt "0 ca đỏ ngoài keep và mã còn mở", trừ ca của phát hiện mới. |
| 6. G5: api và E2E xanh trên commit chấm | ORC ghi CI #19: API 2.947/2.947, E2E 1.947 đạt. r8all: 2.947 × 2 (1 ca chập chờn – N-12). |
| 7. QA: đóng, cấp số, superseded, `br-examples` | Cấp 202…206 xong. `pendingFix` chỉ còn BR-309-18 (R3). Superseded **chưa** có các ca lượt 7 (mục Test cũ (d)). |

## Gaps

- **202**: ca C (folio còn yêu cầu hoàn mở → J15 bỏ qua) và J15 ‖ `recordPayment` phút cuối không chạy lượt 8 (QA có TC-L4-149/150).
- **207**: chỉ thử nguồn đăng lại do A32 tăng (dòng fnb, dòng phòng, đơn giá, số lượng). Chưa thử nhánh dòng đêm S4-35. Cách sửa đề xuất phủ chung.
- **Công nợ**: chưa chạy trên đơn con (B9a, gia hạn OTA), đơn dài hạn, nhiều tổ chức; VietQR cho công nợ; đảo khoản thu nợ trên folio `closed` trong ma trận đua; hoa hồng khi áp bị cắt trên dòng tiền phòng; báo cáo FOC tách `debt_write_off` (R3).
- **Giá**: BR-110 cùng đêm kế thừa; BR-107 14 đêm; kẹp trần; đua B18 ‖ S4-35 trên đêm kế thừa, K12 ‖ MovePlanner; DB nâng cấp từ dữ liệu thật trước G-5 (đêm cũ không có `agreedRateVnd`).
- **Khóa**: job worker thật (J24, webhook OTA, đối soát tự động) không chạy dưới audit khóa. Chưa đua A32 với B14, B18 (nhánh khác), chi hoàn, J24.
- **Không E2E/UI**: Desk H17/H24 (`applied_capped`, câu khi max = 0), cảnh báo 412 trên màn folio.
- Bộ cũ và họ r6/r7 chạy song song khi máy tải 10–28; vài ca chập chờn chỉ xác nhận bằng một lần chạy riêng.
- Critic chạy một lần 5 ca; hai ca xanh không in log, số lấy từ `paths3.evidence`. Critic không chạy cây chính chưa commit.

## Khuyến nghị cổng QC Sprint 4

**ĐẠT CÓ ĐIỀU KIỆN** về tiền:
- **G7 ĐẠT** ("0 P0/P1 mở"): 0 P1 mới. Hai P1 của lượt trước (202, 206) đóng có số.
- **G1 ĐẠT CÓ ĐIỀU KIỆN** ("0 ca lệch tiền"): sổ tiền 0 lệch ở mọi oracle (không dư thừa, không mất nợ, credit 0, 0 deadlock, giá đêm 0 lệch qua 37.966 phép so). Còn 207: trong một trường hợp hẹp, còn phải thu sau khi OWN duyệt xóa nợ khác oracle hợp đồng (10.000 → 717.000), và có tự hủy `debt_cleared` khi khách còn nợ. Critic tính đây là ca lệch tiền.
- Điểm tốt: 10 mã đích đóng; 0 hồi quy ba lượt liền; 0 Major; SEC-BE-80/81 đạt; mọi phát hiện mới lệch về phía thấp.

Điều kiện (đủ 1–6 thì vào cổng):
1. **Sửa 207 trước cổng** – ngoại lệ hẹp cho đóng băng, ORC ghi decision-log. Một điều kiện SQL trong hàm chỉ đọc, không migration, không đổi đường ghi. Chạy lại **một lần** trên commit mới, DB mới: `r8debt/debt-paths` (13/13), `debt-races` (9/9), `r8ver/opendebt-probe`, `n6-paths`, `v8-r8debt-0-*`, `v8-r8ver-0-*`, SEC A/B `reversal-debt-g4` 27/27, api toàn bộ, E2E `clock/debt-collect.s5`. Số đúng theo bảng "Sửa trước cổng". QA chạy, critic đọc log – không cần lượt kiểm 9 đầy đủ.
2. **OPS/ORC**: dựng lại DB QA/demo/staging sau gộp; ghi decision-log điều kiện của 210 (không môi trường nào mang công nợ trước 0076 còn trong cửa sổ lúc deploy). Không xác nhận được → 210 lên P2, sửa cùng 207.
3. **G5**: sửa test `s438r4-money` (N-12, chỉ test). api và E2E xanh trên đúng commit chấm (gồm 207).
4. **QA**: đóng 199, 202 (tách 209), 203, 204, 205, 206; cấp 207…210; cập nhật `s438-superseded.json` (mục Test cũ (a)–(d)); oracle BR-417-24 (N-14). Giữ oracle BR-525-02 `after24h.debtDueDate` tới khi DOM chốt 209.
5. **SEC**: ghi Verified FB-R2-SEC-BE-80/81. Ghi điều kiện review cho 208 (thứ tự 207 → 210 → 208).
6. **DOM/ARC** (văn bản, trong tuần Ổn định): chốt điều kiện N-7 (208), phần tăng và hạn của J15 (209), G-6; sửa ARC 16.27 mục 1, 16.30.3 (giả định lý do `applied_capped`), 16.30.5 (N-11); BR-525 ví dụ (ii) và câu "sau khi đóng" (N-13, N-14).

Được mở khi vào cổng (ORC ghi decision-log kèm hạn và người chịu):
- 208, 209 (P2, không lệch tiền): **trước bản dùng thử**. 208 sau 207 và 210, có SEC review.
- 210 (P3): R3, với điều kiện OPS ở điều kiện 2.
- FB-R2-SEC-BE-83 (chia nhỏ xóa nợ), BE-S4-17/18/19: R3, trước dữ liệu thật (đã có quyết định 18/10).
- 123 (P3); Note N-8…N-15; GAP-DOM G-1, G-3, G-6.

Nếu ORC giữ đóng băng tuyệt đối (không sửa 207): G1 **CHƯA**. Khi đó đây là ngoại lệ tiền, phải gom ESC lên chủ đầu tư (rủi ro: số áp xóa nợ thấp hơn quyết định OWN trong cửa sổ 24 giờ; cách vòng: duyệt yêu cầu xóa nợ sau J15). Critic không đề nghị cách này.

## Tệp của critic

Thư mục `/private/tmp/claude-501/-Users-anhvh-Library-Application-Support-Claude-scratch-workspaces-00554cf2-3678-4864-82b0-830aaeaa97bd-4c0caebe-be05-49c5-a5a2-5bf357fddc6a-scratch-2026-10-15-c4f0d4/36df3adc-c586-471c-a039-340d2b696728/scratchpad/s438/r8critic/`:
- `env.sh` (từ `env-foc.sh`, đổi tên DB)
- `run1.log`: f6803d0, `r8debt/debt-paths` 5 ca, 2 xanh, 3 đỏ (R8DEBT-01 submit/approval/auto-cancel, số đầy đủ)

Critic chạy test có sẵn, không chép hay sửa test nào. DB `ottimo_test_s438_r8critic` giữ lại để soi.
