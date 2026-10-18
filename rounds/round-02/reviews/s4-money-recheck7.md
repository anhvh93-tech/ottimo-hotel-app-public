# Kiểm lại tiền S4-38 lần 7 – commit cc02fba

Đây là lượt kiểm lại thứ bảy (ngắn, đích danh) của S4-38, Round 2 Sprint 4, tuần Ổn định. Lượt này chấm vòng sửa 6 (gộp #17, `cc02fba`). Có 4 người kiểm: `r7rate`, `r7mig`, `r7lock`, `r7all`. Họ kiểm 6 mã đích (BUG-R2-195…200), AN-48/AN-49, A7-01, BR-506 và toàn bộ mã tiền cũ 109…178. Họ báo 5 phát hiện mới. Mỗi phát hiện có 2 người tái hiện độc lập (`v7-*`, 10 lượt). Mỗi người tự viết test, tự tính số từ BR bản 18/10 (phụ lục 5A AN-01…AN-49, BR-525 G-4, BR-427), chạy trên PostgreSQL thật, DB riêng `ottimo_test_s438_r7*` / `v*`, bản sao cố định cc02fba (`wt17`, src không sửa).

Test nằm ở `scratchpad/s438/wt17/product/services/api/test/s438/` (chưa track). Thư mục `r7*/` của người kiểm, `v7-*/` của người tái hiện. Critic không thêm test mới.

Ghi chú thời điểm:
- Báo cáo chấm commit **cc02fba** (gộp #17).
- Cây chính đang có **vòng sửa 7 chưa commit** (44 tệp sửa, 4 tệp mới: `0075_minibar_period_backfill_all.sql`, `folio-close-job.ts`, test `foc-debt-write-off-s4-bed`). Kèm ARC 16.27, DOM 18/10 (R7LOCK-01, R7LOCK-02), ORC cho sửa 0071. Critic chỉ đọc decision-log, ARC, bug-list; **không chạy** vòng sửa 7.
- Số mã: đề bài ghi "đề xuất từ BUG-R2-201". Bug-list chưa commit đã dùng **BUG-R2-201** cho SM-13 (`adjustFolioLine` 409 trên folio `closed`, lộ ra do J15 của vòng 7). Critic đề xuất từ **BUG-R2-202**. QA cấp số.

## Tóm tắt

- 6 mã đích: **195, 196, 197, 198, 200 ĐÃ SỬA**, có số. **199 sửa một phần**: BE-C cho dung sai 5 phút, lệch câu chữ ARC 16.17 mục 2; tiền không đổi.
- **0 HỒI QUY** mã tiền cũ 109…178. 133 nay xanh (13 ca keep). Hồi quy chung: api 2.925/2.925 × 2 lượt; bộ cũ 801 tệp × 2 lượt, 0 ca đỏ do mã.
- Giá đêm thêm: **0 lệch** qua 700 chuỗi fuzz mới (12.189 phép so) và 340 chuỗi fuzz cũ (4.435 phép so). Khóa: **0 deadlock** ở mọi DB, ma trận duyệt 29 ca = tuần tự.
- 5 phát hiện, 10 lượt tái hiện đều tái hiện được hành vi:
  - **1 Major-fix-now** (P1, mất nợ): R7LOCK-01 → đề xuất BUG-R2-202. Phát sinh sau trả phòng quá 24 giờ không thành công nợ và không còn đường thu.
  - 3 Minor P2: R7LOCK-02 (thiếu đường xóa nợ) → 203; R7MIG-01 (0071 chặn migrate trên dữ liệu sạch) → 204; R7ALL-01 (thiếu cảnh báo vượt số khách) → 205.
  - 1 Note: R7ALL-02 (nhãn `pendingFix` cũ).
- 1 GAP-DOM mới (G-5): nguồn `default` của đêm MovePlanner thêm làm mất giá thỏa thuận sau khi dời hẳn ngày.
- Critic chạy lại một lần (DB `ottimo_test_s438_r7critic`): 5 tệp, 24 ca, 14 xanh, 10 đỏ. Đỏ đúng chỗ: 199 × 6, R7LOCK-01, R7LOCK-02, R7ALL-01 × 2.
- **Bảo mật**: không có lỗ hổng xác thực, phân quyền, lộ dữ liệu mới. SEC nên xem: A32 xóa nợ ngoài hạn mức BR-433 (N-7); đường `debt_write_off` mới của vòng 7.
- Xu hướng Major: 11 → 6 → 5 → 3 → 5 → 3 → 1 → **1**. Lõi tính tiền đã hội tụ. Major mới nằm ở chức năng mới (công nợ sau trả phòng), gốc thiếu từ S3 (job J15).
- **cc02fba chưa đạt G1, G7** vì R7LOCK-01. Vòng sửa 7 đang làm đúng hướng. Đóng 202, 203, 204 và một lượt kiểm 8 ngắn là đủ để vào cổng có điều kiện.

## Kết quả từng hướng kiểm

**r7rate** (195, AN-48, AN-49, hồi quy AN-01…47):
- Bản chép `r6rate/min` 11/11 × 2: MP-1 650.000 (lượt 6: 792.000), MP-2 650.000, MP-3 900.000 (lượt 6: 750.000), MP-4 650.000, MP-c 792.000.
- `w-r6rate-*` 26/26 × 2. `old` 88/88 × 2. `br417-an-table` + `s4-recheck6-be-a` 64/64.
- Fuzz r6 hai seed: lượt 1 chỉ đỏ 4 phép `prepend(literal)` (kỳ vọng cũ, đổi theo AN-48); lượt 2 340 chuỗi, 0 lệch.
- Fuzz mới `fuzz7` (hàm tham chiếu `ref7` viết lại từ BR): 700 chuỗi, 12.189 phép so, 693 lần ghi MovePlanner, **0 lệch**. Xem trước = trần QR = ghi ở mọi lần.
- `min7` 20/20 × 2, có số tính tay (AN-48, AN-49, B8, CTV, S4-35, K12). Đua `race7` 12/12 = tuần tự, deadlocks +0.
- Gap: G-5 (GAP-DOM), N-6 (Folio.version).

**r7mig** (196, 197, 164/168 không hồi quy):
- 196: `k1103` 7/7 × 2, `w-r6misc-0-*` 6/6 × 2, test mới `k1108-null` 4/4 (3 vai, `null` đúng nghĩa, đua 2 kết nối × 3 vòng = tuần tự, 35.000).
- 197: 17 lượt migration 3 pha thật (365486f → ce90d19/f04052d → cc02fba). Dữ liệu hỏng → 0071 RAISE liệt kê đúng tủ, rollback trọn (44 → 44). Dữ liệu sạch → qua, K1…K4 = 0, B18 70.000 / 35.000 / 70.000 một lần.
- `minibar-m1` 50/50. Bản chép `r6fix/fixed` với shim r7: 186/190; 4 ca đỏ là kỳ vọng cũ.
- Tấn công: R7MIG-01.

**r7lock** (198, 200):
- `approval-order` 6/6 (lượt 6: 3 đỏ, deadlocks +3/+3/+1). `w-r6lock-*` 21/21 + 8 bỏ qua (CONTROL).
- Ma trận mới `approval-matrix` 29/29: foc, refund, no_show_restore, late_checkout_conflict × approve/reject/cancel ‖ B18, B13, B7, `addFolioLine`, `recordPayment`, `reversePayment`. Hai thứ tự × 3 vòng = tuần tự, 0 deadlock, 0 × 409 `CONCURRENT_UPDATE`.
- `prelock-structure` 2/2: 7 loại có `onDecided` đều khai preLock. Đột biến lúc chạy chứng minh test bắt được loại thiếu.
- BR-525: `reversal-debt` 9/11. BR-525-01, BR-525-03, mở lại công nợ, đua thu ‖ đảo, thu ‖ thu, chi hoàn ‖ đảo: đúng số, deadlocks +0.
- Tấn công: R7LOCK-01, R7LOCK-02.

**r7all** (hồi quy mã tiền 109…200, tấn công quanh #15/#16):
- api toàn bộ 99 tệp, 2.925 + 2 bỏ qua × 2 lượt, 0 đỏ.
- Bộ cũ 801 tệp (4.515 ca): lượt 1 4.040 / 316 đỏ / 159 bỏ qua; lượt 2 4.037 / 319 / 159. Đỏ = 264 superseded + 19 keep + 28 NEW. 28 NEW đều do hợp đồng đổi hoặc test sai; bản sửa xanh. 3 ca chỉ đỏ ở lượt 2 do tải: chạy riêng 16/16 × 2.
- Họ r6 (41 tệp, 263 ca): 244 / 11 đỏ / 8 bỏ qua. 11 đỏ: 5 do hợp đồng 196 (bản sửa 11/11), 6 do 199.
- A7-01: 0 dòng `room`/`extra_person` qua mọi lệnh; so 723179b 38 bản ghi, 0 khác. BR-506: 6/6, đua = tuần tự. preLock damage/FOC: 9/9.
- Tấn công: R7ALL-01, R7ALL-02.

## Trạng thái mã

| Mã | Mức | Trạng thái ở cc02fba | Bằng chứng có số | Ghi chú |
|---|---|---|---|---|
| BUG-R2-109…122, 124…132, 134…177 | P1–P3 | ĐÃ SỬA, **0 hồi quy** | r7all: 801 tệp × 2 lượt, 0 ca đỏ do mã; api 2.925 × 2. | – |
| BUG-R2-133 | P3 | **ĐÃ SỬA** | 13 ca keep xanh × 2: R18 208.000; W1–W4 125.000 × 2. | QA bỏ 13 ca khỏi keep, đóng. |
| BUG-R2-178 | P2 | ĐÃ SỬA (ghi nhận) | B6 ở `r5mini/old` và `r5old/fixed` xanh × 2; `minibar-m1` "BUG-R2-178" × 2. | Biến thể đang mở không kiểm. |
| BUG-R2-195 | P1 | **ĐÃ SỬA** | MP-1 650.000, folio 1.300.000 → 1.950.000; MP-2 650.000; MP-3 900.000. Fuzz r6 + fuzz7: 1.040 chuỗi, 0 lệch. `race7` 12/12. | Kèm AN-48 (G-2), AN-49 (G-3). |
| BUG-R2-196 | P2 | **ĐÃ SỬA** | FD/HK/MGR thiếu một hay cả hai trường → 422 `REQUIRED`, 0 lần đếm. `null` trên tủ chưa nạp → 201; lần hai 409 → tải lại 201; minibar [35.000]. | – |
| BUG-R2-197 | P2 | **ĐÃ SỬA** | 0071 RAISE liệt kê đúng tủ (dmg, k1b, 2 tổ chức, w-r6fix); snapshot trước = sau. Dữ liệu sạch qua. Quy trình tay ARC (repce9) → migrate OK, M1 70.000 một lần. | Sinh R7MIG-01 (0071 chặn thừa). |
| BUG-R2-198 | P2 | **ĐÃ SỬA** | Ép "B18 trước" ‖ approve: 200 / 409 `INVALID_TRANSITION`, 917.000, due 0. "Approve trước": 200 / 412, agreed 14:00. B13 trước: 1.834.000, due 917.000. Ma trận 29/29, deadlocks +0. | Test cấu trúc chặn loại mới thiếu preLock. |
| BUG-R2-199 | P3 | **SỬA MỘT PHẦN** | Critic chạy lại: −1 s → 200; −5 phút (start) → 200; 09:55 so với việc tạo 10:00 → 200; −10 phút → 422. Tiền 140.000, minibar [70.000, 70.000]. | Dung sai `CLOCK_SKEW_MS` 5 phút. ARC chốt câu chữ. |
| BUG-R2-200 | P2 | **ĐÃ SỬA** | BR-525-01: công nợ 100.000, hạn +3, báo OWN (người đảo không nhận), `checkout_debt` MGR+. BR-525-03: 70.000, yêu cầu hoàn 30.000 `superseded`. Thu 70.000 → đóng. Đua = tuần tự. | `pendingFix` BR-525-03 còn (R7ALL-02). |
| BUG-R2-123 | P3 | Không kiểm lượt này | – | Tuần Ổn định. |

## Critic chạy lại

Mã báo chưa sửa: 199. Critic chạy **một lần** các ca của 199 và các ca đỏ của phát hiện mới.

- Cây `wt17` @ cc02fba, src không sửa. DB mới `ottimo_test_s438_r7critic` (`newdb.sh`). `vitest run --no-file-parallelism`, 70 giây, load ~5.
- 5 tệp, 24 ca: **14 xanh, 10 đỏ**. 10 ca đỏ trùng đúng chỗ người báo đã đếm.
- **199** (`r6misc/k1109-hk163` 1 đỏ / 5; `w-r6misc-1-0` 2/2 đỏ; `w-r6misc-1-1` 3 đỏ / 4):
  - `complete` 09:55 cho việc tạo 10:00 → **200** (1 + 3 + 3 lượt). −1 s → 200. `start` −5 phút → 200. −10 phút → 422. Đúng-giờ và +1 phút → 200.
  - `hk_task.done_at` = 09:55, trước `created_at` 10:00: dữ liệu truy vết lệch, không vào tiền.
  - Tiền: mốc bia 2, minibar [70.000, 70.000] = 140.000. Máy nhanh: đếm lại 409, mốc 2. Quá 24 giờ và +6 phút → 422.
- **R7LOCK-01** (`r7lock/reversal-debt` "BR-525-02 / BR-427 (d)"):
  - Chỉ có phát sinh 70.000, kiểm sau 24 giờ: `checkout_mode` **desk**, due 70.000, audit công nợ **[]**, thông báo **[]**, khách trả 70.000 → **409 `FOLIO_LOCKED`**.
  - Có đảo 100.000 trước: mode debt, due 170.000, audit chỉ **[100.000]**, thu được (201).
- **R7LOCK-02** (`reversal-debt` "write-off"): MGR FOC 100.000 trên dòng fnb của đơn đang nợ, d1 15:00 và d3 10:00 → **409 `FOLIO_LOCKED`**, due 100.000, mục chú ý chuyển `critical`.
- 9 ca xanh của `reversal-debt`: BR-525-01, BR-525-03, đua thu ‖ đảo, thu ‖ thu, FOC ‖ thu, chi hoàn ‖ đảo. Deadlocks +0, 409c 0, 5xx 0, mismatches 0. Quét tự nhiên 14 lượt: 0 sai.
- **R7ALL-01** (`r7all/new/be73-money`, `R7_WORLD=new`):
  - Phản hồi `addGuestDocument` 19 khóa, không có `overCount` hay cảnh báo. Đoàn sau giấy tờ: 3 người lớn, `adults` khai 2.
  - 202: dry run và ghi trẻ → **422 `CAPACITY_EXCEEDED`**; B18 406.000.
  - 302: preview `adults` 3, `surchargeVnd` 200.000; ghi → 2 dòng 100.000; sau B13 300.000; B18 **1.217.000**.

Critic đọc lại mã cc02fba cho các gốc. Mã khớp mô tả:
- `src/jobs`, `worker.ts`: không có job `folio.close` (J15). `post_checkout_window_until` chỉ dùng ở settle, `lockForPosting`, folio-lines.
- `folio/internal/foc.service.ts` 70: `if (folio.status !== 'open') throw problem('FOLIO_LOCKED')`.
- `frontdesk/internal/document-party.port.ts` 186 tính `overCount`, chỉ đưa vào lý do audit (219–220). Chú thích dòng 13 ghi "the desk is warned" nhưng phản hồi không mang trường này.
- `housekeeping/internal/rules.ts` 295–304: `CLOCK_SKEW_MS` = 5 phút; `performedBefore` dùng cho `created_at` (199) và `started_at` (S4-05).

## Critic – phân xử phát hiện mới

| Mã | Kết luận | Mức | Ai sửa | BUG đề xuất | Lý do |
|---|---|---|---|---|---|
| R7LOCK-01: phát sinh sau trả phòng chưa trả quá 24 giờ không thành công nợ, không báo quản lý, sau đó không thu được (409 `FOLIO_LOCKED`) | **Major-fix-now** | **P1** (nâng từ P2) | BE-B (J15 `folio.close`) + BE-A (`debtOnCheckout`) + ARC (16.27 mục 1) + QA (oracle) | BUG-R2-202 | 2/2 tái hiện, cả hai đề nghị P1; critic chạy lại: đỏ. 4 + 4 lần chạy cùng số. Sau 24 giờ khoản 70.000 vẫn trên folio nhưng: không công nợ, không audit, không báo ai, không có trong "Cần chú ý", FD/MGR ghi thu và VietQR đều 409. Khách chuyển khoản muộn cũng không ghi được → lệch đối soát. Đây là **mất nợ**. Trái BR-427 (d) (có từ v0.2), BR-427-01, BR-525 "ngoại lệ tự động", bất biến BR-525 (ii), oracle BR-525-02 after24h (170.000). Gốc: thiếu job J15 (architecture xếp R2; TC-L4-068 bỏ qua "có lý do" từ S3, chưa có mã). Nhánh thu nợ 16.26 đòi `checkout_mode = debt` nên không phủ. Không do vòng sửa (`causedByFix` false), nhưng lộ ra vì vòng 6 làm đường công nợ sau trả phòng thành thật. Không phải P0: số trên folio đúng, chưa ghi sai tiền. |
| R7LOCK-02: không có đường xóa nợ/FOC cho công nợ sau trả phòng; MGR FOC trên folio `settled` luôn 409 | Minor | P2 | BE-B (`foc.service.ts` 70, ngoại lệ `debt_write_off`) + BE-A (`debtSettled` `written_off`, hoa hồng) + FE-A + DATA | BUG-R2-203 | 2/2 tái hiện phần lõi; một người P2, một người P3 chờ DOM. **DOM đã chốt 18/10: xóa nợ làm ở R2** bằng FOC `debt_write_off`, hạn mức BR-433 → lệch BR thật, giữ **P2**. Không P1: không sai tiền, đua FOC ‖ thu = tuần tự, có đường A32 cho MGR+. **Đính chính phát hiện**: "công nợ treo vĩnh viễn, không có API xóa nợ" là sai. A32 `adjustFolioLine` (MGR+, có lý do) đóng được nợ, nhưng không tính hạn mức BR-433, không vào báo cáo FOC, không ghi `debt_settled_at` (xem N-7). |
| R7MIG-01: 0067 (a) bỏ sót tủ có kỳ `carry` mở sau lần đếm 365486f → K1 = 1 trên dữ liệu không thu trùng → 0071 RAISE chặn migrate | Minor | P2 | BE-B (0075 + sửa thân 0071) + ARC (16.17 mục 3, 16.27 mục 3) + OPS | BUG-R2-204 | 2/2 tái hiện (3 và 5 lượt pipeline); một người P3 (mã đúng chữ 16.17), một người P2. Critic giữ **P2**: hậu điều kiện "sau 0067 K1 = 0" của chính ARC bị vi phạm; quy trình tay chỉ có cho dạng K1b, nếu OPS làm bước (2) thì khách mất khoản minibar đã dùng. Không lệch tiền: RAISE rollback trọn. Đối chứng bỏ 0071 rồi chạy app → B18 135.000, đúng oracle BR-703. Phản thực tế "backfill trước lần đếm đầu" → migrate OK, K = 0, B18 100.000 = 65.000 + 35.000. **Do vòng sửa 6** (`causedByFix` true): lỗ của 0067 (a) có từ 3bd4ac4 (723179b cho K1 = 1 không báo), 0071 biến nó thành chặn triển khai. Phạm vi: chỉ dữ liệu ce90d19…8819c2d có gia hạn sau lần đếm 365486f. ARC 16.27 mục 3 và ORC đã chốt cách sửa. |
| R7ALL-01: giấy tờ chính của người đặt (thiếu ngày sinh) gửi không có `partyMemberId` → server thêm người đi cùng `unknown`/adult im lặng; lần đổi người sau tính phụ thu cho người này hoặc chặn trẻ thật | Minor | P2 (hạ phạm vi) | BE-C (trả `overCount`) + ARC (trường cảnh báo trong phản hồi) + FE-A (Desk cảnh báo) + BE-A (xem `PartyService.add`) | BUG-R2-205 | 2/2 tái hiện số; cả hai kết luận **phần tiền không lệch hợp đồng**. ARC 16.22 cố ý bỏ nhánh `isMain` → người đặt (lỗi SEC-BE-73); khớp chỉ bằng tên bị cấm. Tiền theo BR-110 trên đoàn server đang giữ; xem trước = ghi; có đường sửa (DELETE party → 204, gắn lại → 202 ra 300.000). Kỳ vọng "giống 723179b" của người báo **sai**. Phần lệch thật: **thiếu cảnh báo vượt số khách** mà openapi `addGuestDocument` ("vẫn gắn + cảnh báo"), decision-log 17/10 BUG-R2-033 (b) và chuỗi `checkin.docs.over_party` đều đòi. Critic chọn **P2** (một người P2, một người P3): đoàn sai im lặng, kéo theo thu thừa 300.000 hoặc trẻ không vào khai báo. Không vào G1. Không do vòng sửa 6 (723179b cũng bỏ `overCount`); BE-73 (#15) mở rộng đường vào. |
| R7ALL-02: `br-examples.json` BR-525-03 vẫn gắn `pendingFix` BUG-R2-200 dù ca chạy thật ra đúng số | Note | P3 | QA | – | 2/2 tái hiện số (70.000 / 70.000 / hạn +3 / `superseded` / thu 70.000 thì đóng). Một người cho là lệch quy ước fixture, một người không. Không lệch tiền, không ảnh hưởng CI. Lỗ thật: CI chưa có ca "folio đang thừa → đảo → công nợ = phần tăng". QA đưa ca vào test chính thức rồi gỡ nhãn (đã xếp ở `qc/s4-gate-readiness.md`). Sửa luôn chú thích cũ ở `debt-collect.s5.clock.spec.ts`, `ui-clock/debt-collect.s5.spec.ts`. |

Phân loại bảo mật cho SEC:
- Không có lỗ hổng xác thực, phân quyền hay lộ dữ liệu mới.
- Đã đóng: 196 (server thực thi `required` của yaml: mục checklist SEC đề nghị ở lượt 6 đã đạt); 198 (tính sẵn sàng).
- SEC nên biết, không phải lỗ hổng xác thực:
  - **N-7 (vượt hạn mức qua A32)**: MGR một mình `voidLine` 1.500.000 và 1.200.000 trên folio `settled` đang nợ → 201, 0 approval, không vào báo cáo FOC, `debt_settled_at` null. Trên folio mở, cùng số phải chờ OWN (BR-433). A32 đúng rbac (MGR+, không hạn mức) và có audit, nên là câu hỏi thiết kế phân quyền. SEC + DOM chốt khi vòng 7 có đường `debt_write_off`.
  - **Vòng sửa 7 thêm một đường giảm tiền mới** trên folio `settled`/`closed` (`debt_write_off`). SEC review trước gộp #18: vai OWN/MGR, FD 403, ghi chú bắt buộc, trần ≤ min(dòng, còn phải thu), hạn mức BR-433, audit, idempotency.
  - **R7ALL-01**: bản sửa chỉ thêm cảnh báo. Không quay lại nhánh `isMain` → người đặt, không khớp chỉ bằng tên (SEC-BE-73).
  - **199**: truy vết HK có giờ làm sớm hơn giờ tạo việc tới 5 phút. Không vào tiền.

## Major-fix-now theo gốc (danh sách sửa cho BE)

| BUG đề xuất | Phát hiện | Ai sửa | Chỗ sửa (cc02fba) | Số đúng cho test |
|---|---|---|---|---|
| BUG-R2-202 | R7LOCK-01 | BE-B + BE-A (+ ARC, QA) | Thêm J15 `folio.close` theo ARC 16.27 mục 1: mỗi folio một giao dịch, L1 mọi đơn `NO KEY UPDATE` → L3 folio, tính còn phải thu dưới khóa; > 0 và chưa có công nợ mở → `ReservationHooks.debtOnCheckout` (cùng cấu trúc công nợ B18) rồi `closed`. Bỏ qua folio còn yêu cầu hoàn mở. Idempotent. Một folio lỗi không chặn folio khác. Đăng ký vào `JobRegistry`. | **A (BR-427 (d), BR-525-13)**: 302 d0 → d1, B18 16/11 10:00 còn phải thu 0; 15:00 phát sinh 70.000 → 201. 17/11 09:59 J15: không đổi gì. 17/11 10:00 (± 1 phút): folio `closed`, `checkout_mode` debt, audit `reservation.debt_on_checkout` **70.000** actor system, hạn **20/11**, `debt_recorded` tới OWN + MGR, `checkout_debt` warning. Thu 70.000 → **201**, công nợ đóng. **B (BR-525-02)**: đảo 100.000 lúc 16/11 17:00 → công nợ 100.000; 17/11 10:00 → thêm **70.000**, mở **170.000**, có audit và thông báo cho phần 70.000. Bất biến (ii) đúng ở mọi mốc. **C (BR-427-02)**: folio còn yêu cầu hoàn mở → J15 bỏ qua. **Đối chứng**: thu trong cửa sổ → 201, không công nợ; không phát sinh → `closed`, thu → 409. **Đua** (2 kết nối, hai thứ tự × 3, = tuần tự, deadlocks +0): J15 ‖ `recordPayment` phút cuối; J15 ‖ `addFolioLine` sát mốc; J15 ‖ `reversePayment`. J15 chạy hai lần → một công nợ. |

Việc chung:
- Chuyển `r7lock/reversal-debt` "BR-525-02 / BR-427 (d)", `v7-r7lock-0-0/overdue-charge-debt`, `v7-r7lock-0-1/post-checkout-debt` vào `test/integration/`.
- QA gỡ "bỏ qua có lý do" của TC-L4-068 (đã đổi kỳ vọng ở bug-list 11.29).

## Minor, Note và GAP-DOM – kế hoạch

| Mã | Mức | Ai | Kế hoạch |
|---|---|---|---|
| BUG-R2-203 (R7LOCK-02, xóa nợ) | P2, **trước cổng** (cùng vòng với 202) | BE-B; BE-A; FE-A; DATA | Theo ARC 16.27 mục 2: ngoại lệ duy nhất của `requestFoc` trên folio `settled`/`closed` khi có công nợ mở và `reasonCode = debt_write_off`. Số: 302 B18 1.067.000; đảo 100.000 → công nợ 100.000; MGR `debt_write_off` 100.000 trên dòng fnb → 201 `approved`, due 0, `debt_settled_at` có giá trị, `checkout_debt` hết (cả d1 15:00 và d3 10:00). Oracle BR-525-14 (CTV 8 %: xóa 100.000 trên tiền phòng → **408.400**; trên minibar giữ **416.400**), BR-525-15 (MGR vượt giá 1 đêm → chờ OWN; FD 403; thiếu ghi chú, vượt trần, `kind` khác → 422; hết nợ → 409). Đua `debt_write_off` ‖ thu nợ, hai thứ tự × 3: due ≥ 0, credit 0, = tuần tự. Kèm BUG-R2-201 của QA (A32 trên folio `closed`, SM-13). |
| BUG-R2-204 (R7MIG-01, 0071 chặn thừa) | P2, **trước cổng** (vì vòng 7 sửa migration đã gộp) | BE-B; ARC; OPS | Theo ARC 16.27 mục 3: 0075 bù kỳ mọi lần đếm `fill_id` NULL theo thời điểm, K1b′ theo kỳ; 0071 chỉ kiểm K1b′. Chạy lại pipeline 3 pha của `r7mig` trên commit mới: **dạng 197** (dmgce9, dmgf04, k1bce9, k1bf04, multice9, `w-r6fix-0-*`) vẫn RAISE liệt kê đúng tủ, snapshot trước = sau; **dạng R7MIG-01** (extm1ce9, extm1f04, `v7-r7mig-0-*`) → MIGRATE_OK, K1 = K1b′ = 0, lần đếm NULL có kỳ `backfill` riêng, B18 thu **70.000** một lần (+ phần dùng thêm của kỳ `carry`: ví dụ 65.000 + 35.000 = **100.000**); **dữ liệu sạch** qua; repce9 vẫn đúng. OPS dựng lại DB QA sau gộp. |
| BUG-R2-205 (R7ALL-01, cảnh báo vượt số khách) | P2, tuần Ổn định, **trước bản dùng thử** | BE-C; ARC; FE-A; BE-A | ARC thêm trường cảnh báo (ví dụ `partyOverCount`) vào phản hồi `addGuestDocument`, sinh lại generated. BE-C trả `overCount` từ `document-party.port.ts`. FE-A hiện `checkin.docs.over_party` sau khi lưu và ở panel đoàn khi `presentCount > requiredCount`. Số: S302 (người đặt thiếu ngày sinh, không `partyMemberId`) → 201 **có cảnh báo**, `presentCount` 3 > `requiredCount` 2, 0 dòng phụ thu lúc nhập giấy tờ. Tiền giữ như hợp đồng (preview `adults` 3, 200.000 = ghi). Đường sửa R202: DELETE → 204, gắn lại có `partyMemberId` → trẻ 200.000, sau B13 **300.000**. W202 (người lớn thật chưa khai) → có cảnh báo. QA thêm ca "người đặt thiếu ngày sinh" vào E2E Desk. |
| BUG-R2-199 (phần dung sai) | P3 | ARC; QA (hoặc BE-C) | Critic đề nghị **ARC chấp nhận dung sai 5 phút**: một hằng `CLOCK_SKEW_MS` cho S4-01, S4-05 và 199; thứ tự kỳ dùng giờ xử lý nên tiền không đổi. ARC sửa câu 16.17 mục 2 thành "sớm hơn `created_at` quá 5 phút → 422". QA đổi 6 ca (mục Test cũ (e)). Nếu ARC không nhận: BE-C bỏ dung sai, số: 09:55 → 422, −1 s → 422. |
| R7ALL-02 | Note | QA | Như bảng phân xử. |
| G-5 Nguồn đêm MovePlanner thêm và giá thỏa thuận | GAP-DOM, **chốt trước cổng** | DOM (+ BE-A nếu đổi) | Đêm MovePlanner thêm ghi nguồn `default`; bước 3 bỏ đêm mặc định khi tìm đêm tham chiếu. Khách dời hẳn ngày (không chồng) làm mất mọi đêm đã gõ → đêm thêm sau đó ra lịch. Probe: 202 thỏa thuận 650.000 × 2 (20–22/05/2030) dời 23–25/05 → hai đêm 650.000 (`default`); B13 thứ Bảy 25/05 → **911.000** (lịch), không 650.000. Mã đúng chữ BR. Critic đề nghị **kế thừa**: đêm MovePlanner lấy từ đêm tham chiếu thỏa thuận mang nguồn thỏa thuận (cùng lý do AN-48: một đêm không đổi giá theo lệnh). Nếu DOM chọn kế thừa → BE-A sửa nhỏ cùng vòng 7, thêm dòng AN-50. Nếu giữ chữ BR → thêm ví dụ 911.000 vào phụ lục 5A. |
| N-6 Phạm vi `Folio.version` | Note | ARC; BE-B | `Folio.version` không tăng khi B7/B9a/B13 ghi dòng đêm và khi `recordPayment`; chỉ `adjustFolioLine` tăng. Câu openapi `adjustFolioLine` ("mọi thay đổi dòng của folio tăng version") rộng hơn decision-log 16/10. Hệ quả quan sát: A32 ‖ thu nợ với If-Match đọc trước → [201, 201], dư 100.000 (tiền không mất, phải hoàn). ARC sửa câu chữ; cân nhắc tăng version cho `recordPayment` trên folio `settled`/`closed` để quyết định xóa nợ dựa trên số cũ nhận 412. |
| N-7 A32 xóa nợ ngoài hạn mức | Note (SEC + DOM) | SEC; DOM | Xem phân loại bảo mật. DOM chốt: khi đơn có công nợ mở, giảm dòng bằng A32 phải đi `debt_write_off` (có hạn mức), hoặc chấp nhận A32 là sửa sai có audit. |
| N-8 Câu chữ 16.19 cho `quote_extension` | Note | ARC | Bảng ghi "L1 đơn giữ chỗ của báo giá"; mã khóa `quote` trước yêu cầu. Sửa câu. |
| N-9 Thông điệp RAISE của 0071 | Note | BE-B; OPS | Chỉ có mã đơn, số căn, id, số tiền. Hai tổ chức trùng "OTM-00001 room 402" chỉ phân biệt bằng id. Thêm tổ chức/cơ sở khi viết lại 0071/0075. |
| N-10 Fixture tên | Note | QA | `seedGuestRow` ghi `name_search` = UPPER(tên) còn dấu; app dùng `nameSearchKey` không dấu. Test dựa vào khớp tên + ngày sinh với hồ sơ seed báo nhầm "không khớp". |
| N-1…N-5, G-1 | Note | – | Như lượt 6, không kiểm lại. |
| BUG-R2-123 | P3 | BE-A + ARC | Tuần Ổn định. |

## Test cũ phải đổi kỳ vọng

Không phải lỗi mã. Bản đã đổi nằm trong thư mục của người kiểm, mỗi chỗ có chú thích `r7*`.

**(a) Giá đêm thêm (AN-47 (b), AN-48).**

| Tệp / ca | Cũ → mới | Căn cứ |
|---|---|---|
| `r7rate/r6copy/driver.ts` phép `MovePlanner.prepend(literal)` | Đổi thành `prepend(AN-48)`: đêm thêm đầu lượt lấy đêm nhập tay **sớm nhất sau** nó | AN-48, DOM 18/10 G-2 |
| `r2move` R9 (× 4 bản chép) | **4.493.000 → 4.410.000** (7 × 700.000 × 0,9): đêm khách kéo dài giữ căn của đơn thỏa thuận lấy giá thỏa thuận | AN-47 (b), BR-417-21 |

**(b) Minibar `roomId` + `periodId` bắt buộc (196).**

| Tệp / ca | Cũ → mới | Căn cứ |
|---|---|---|
| `r6fix/fixed/q-k11period-3-0` 3 ca "stale count no periodId → refill period (70.000)" | → **409 `MINIBAR_PERIOD_CHANGED`**. Thay bằng `r7mig/k1108-null`, `r6misc/k1103` | K11-08, (ah) |
| `minibar-catalog-gone` × 11; `k11lock/fridge-pairs` × 2 | Gửi đủ `roomId` + `periodId` (đọc kỳ lúc gửi) | K11-08 |
| `r6lock/minibar` 175 (b) | Client cũ → **422 `VALIDATION_FAILED` `REQUIRED`** ngay, không xếp sau B14 | 196 |
| `r6fix-new-k1105`; 13 tệp cũ gửi lần đếm thiếu `periodId` | `countNow` gửi `roomId` + `periodId`; shim r7 | K11-08 |

**(c) Hủy, đua và HK.**

| Tệp / ca | Cũ → mới | Căn cứ |
|---|---|---|
| `cancel` R1 × 6 bản chép | Oracle phụ thuộc thứ tự → "đua = một trong hai thứ tự tuần tự, pending ≤ credit" (bản sửa `fixed/cancel/a4-races-r1` 6/6) | 16.19 |
| `r5mini` A3; `z-r5mini-2-1` Z1 | `performedAt` sớm hơn lúc tạo việc quá 5 phút → **422 `PERFORMED_AT_OUT_OF_RANGE`**. Thay A3 bằng A3c (online, 105.000) | 199 |

**(d) Công nợ sau trả phòng.**

| Tệp / ca | Cũ → mới | Căn cứ |
|---|---|---|
| Oracle BR-525-02 after24h | Mốc **15:00 → 10:00** (24 giờ từ lúc trả phòng) | DOM 18/10 R7LOCK-01 (QA đã sửa ở cây chính) |
| TC-L4-068 | "F2 không tự đóng" → F2 đóng kèm công nợ 50.000 | R7LOCK-01 (QA đã sửa) |
| `r7all/new/be73-money` A202, B302 | Bỏ kỳ vọng "giống 723179b" (sai theo ARC 16.22). Đoàn 3 người lớn, 202 trẻ 422, 302 phụ thu 300.000 là đúng hợp đồng. Thay bằng kiểm cảnh báo vượt số khách (đỏ tới khi sửa 205) | ARC 16.22, openapi `addGuestDocument` |

**(e) Chờ ARC chốt 199.** Nếu ARC nhận dung sai 5 phút, đổi 6 ca: `r6misc/k1109-hk163` ca 163; `w-r6misc-1-0` (lượt × 3, biên); `w-r6misc-1-1` (lượt × 3, biên, `start`). Kỳ vọng mới: 09:55 so với 10:00 → 200; −1 s → 200; `start` −5 phút → 200; −5 phút 01 giây → 422; tiền 140.000. Assert "`performed_at` không bao giờ trước `created_at`" đổi thành "không trước quá 5 phút".

**(f) Giữ đỏ, vì đây là lỗi mã.** Không đổi kỳ vọng:
- 202: `r7lock/reversal-debt` "BR-525-02 / BR-427 (d)"; `v7-r7lock-0-0`, `v7-r7lock-0-1` (A, B).
- 203: `r7lock/reversal-debt` "write-off"; `v7-r7lock-1-0`, `v7-r7lock-1-1` (FOC trên folio đang nợ).
- 204: `r7mig/run.sh` extm1ce9, extm1f04; `v7-r7mig-0-0`, `v7-r7mig-0-1`.
- 205: `v7-r7all-0-1` W202 (assert cảnh báo).

**(g) Dọn bộ test cũ.**
- QA thêm vào `s438-superseded.json`: các ca ở (a)–(d) (trỏ tới `r7all/fixed/`, `r7mig/`, `r7rate/r6copy/`); bỏ 13 ca keep của 133.
- `br-examples.json`: gỡ `pendingFix` BR-525-03 sau khi có ca chính thức. Còn lại chỉ BR-309-18 (R3).

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
| **7** | **cc02fba (#17)** | **5** | **1 (202)** | **0 hồi quy; 1 P2 do vòng sửa (204)** | **công nợ sau trả phòng – job J15 thiếu từ S3** |

Lỗi sai số tiền mới (không tính bảo mật): lượt 6 có 1 P1 + 2 P2; lượt 7 có **1 P1 (mất nợ), 0 P2 lệch tiền**.

Nhận xét:
- **Lõi tính tiền đã hội tụ.** Hai lượt liền không hồi quy mã cũ. Giá đêm thêm: lượt đầu 0 lệch sau 6 lượt cùng họ (126 → … → 195). Khóa: 0 deadlock ở mọi DB, cả ma trận duyệt. Minibar: lượt thứ hai liền 0 P1.
- **Major còn lại không thuộc lõi cũ.** 202 nằm ở chức năng mới của vòng 6 (G-4/BR-525, thu nợ 16.26). Chức năng này làm đường "công nợ sau trả phòng" thành thật, nên lộ ra job J15 thiếu từ S3. 203 cùng vùng. QA đã thấy thêm 201 (A32 trên folio `closed`) khi J15 của vòng 7 bắt đầu đóng folio. Vùng này còn non: ba mã trong một lượt, và vòng 7 đang sửa chính đường B18/thanh toán (`checkout.service.ts`, `payments.service.ts`, `folio.service.ts`, `foc.service.ts`, `approval.service.ts`).
- Vùng còn sinh lỗi:
  - **Công nợ sau trả phòng** (202, 203, 201): chức năng thêm trong tuần Ổn định, chưa có ma trận trạng thái folio × công nợ × job.
  - **Migration sửa dữ liệu qua nhiều bản**, lượt thứ ba cùng họ (164 → 197 → 204). Mỗi lượt chỉ dựng dữ liệu theo đúng dạng đã biết. Cần test sinh dữ liệu theo các lệnh hợp lệ (B13, B14, HK tạo tay) trên mỗi bản trung gian.
  - **Hợp đồng ghi trên giấy, mã chưa theo** (205: cảnh báo; 199: câu chữ dung sai).

**Đánh giá riêng hai cách làm mới.**

(1) **Bảng quyết định giá đêm thêm (phụ lục 5A, AN-01…AN-49).**
- Lượt 6 kết luận bảng cần đi kèm (a) một hàm cho mọi bên tiêu thụ, (b) trục "nguồn giá × lịch sử đổi căn", (c) fuzz so với hàm tham chiếu độc lập. Vòng 6 làm đủ (a) (`stayRooms`, `referenceSide`) và (c). Kết quả: 195 đóng, AN-48/49 đúng, 1.040 chuỗi fuzz 0 lệch, MovePlanner = B13 trên cùng trạng thái.
- **Đã chặn được lỗi cùng lớp "nối sai đầu vào"**: hai hàm tham chiếu viết độc lập (`ref`, `ref7`) đều khớp mã.
- **Không chặn được khoảng trống của chính bảng.** G-5 không lộ qua fuzz vì hàm tham chiếu viết theo chữ BR nên cũng ra 911.000; chỉ lộ qua probe có chủ ý. Bảng chặn lỗi cài đặt, không chặn lỗi đặc tả.
- Đề nghị: DOM thêm trục "nguồn đêm sau MovePlanner/S4-35" vào bảng; QA giữ fuzz r6 + fuzz7 trong CI hằng đêm; mở rộng bộ sinh cho BR-107 (≥ 7 đêm) và BR-110 (phụ thu người) – hai trục chưa phủ.

(2) **Quy tắc khóa một nguồn (ARC 16.19) + preLock bắt buộc theo loại.**
- Lượt 6 kết luận phải đổi bộ máy duyệt để preLock là bắt buộc và có test liệt kê. Vòng 6 làm đủ: `decisionHooks()`, `PRELOCK_OWED` rỗng, test cấu trúc bắt được loại mới thiếu preLock (đã thử đột biến).
- **Đã chặn được lỗi cùng lớp**: 198 đóng; ma trận 29 ca (4 loại duyệt × approve/reject/cancel ‖ 6 lệnh) 0 deadlock, 0 × 409 thừa, = tuần tự; BR-525 đua 4 cặp + 14 lượt tự nhiên 0 sai. Không có phát hiện khóa nào trong lượt 7.
- Lỗi của lượt 7 (202, 203) không thuộc lớp khóa: là chức năng thiếu. 16.19 không có nhiệm vụ chặn lớp này.
- Còn lại: câu chữ `quote_extension` (N-8); `late_checkout_conflict` ‖ `addFolioLine` không ép xen được (KEY SHARE); phạm vi `Folio.version` (N-6). J15 mới của vòng 7 phải có dòng trong bảng 16.19 và vào ma trận đua.

Dự báo: nếu vòng sửa 7 đóng 202, 203, 204 đúng số, lượt 8 (ngắn) có thể về 0 Major. Rủi ro chính: vòng 7 sửa đường B18/thanh toán/FOC/duyệt và sửa một migration đã gộp.

## Đối chiếu điều kiện của lượt 6

| Điều kiện (`s4-money-recheck6.md`, mục Khuyến nghị) | Trạng thái ở cc02fba |
|---|---|
| 1. Đóng 195; DOM chốt G-2 trước | Xong. AN-48 (G-2), AN-49 (G-3). Fuzz r6 hai seed 0 lệch; thêm fuzz7. |
| 2. Đóng 196; ARC, QA đổi ca | Xong. 422 `REQUIRED` mọi vai; ca "client cũ" của `minibar-m1` đổi 422. |
| 3. 197: sửa hoặc chứng nhận | Sửa (0071 RAISE). Sinh 204 (chặn thừa). ORC ghi: chưa môi trường thật nào chạy 0071. |
| 4. QA: đóng 158…177, cấp 195…198, superseded, `br-examples` | Xong cấp số 195…200. Đóng chờ CI #17 + lượt 7. Còn `pendingFix` BR-525-03 (R7ALL-02). |
| 5. Lượt 7 chạy lại `r6*`, `w-r6*`, `r6fix/all`; mục tiêu 0 ca đỏ ngoài keep và mã còn mở | Xong. Đạt mục tiêu, trừ 6 ca của 199 (chờ ARC) và các ca của phát hiện mới. |
| 6. G5: api và E2E xanh trên commit chấm | api 2.925 × 2 trên cc02fba. ORC ghi QA trước gộp #17: 0 ca hỏng do mã. Critic không kiểm CI #17. |
| Mở khi vào cổng: 198, 199, 123, 133 | 198 đóng; 133 đóng; 199 một phần; 123 không kiểm. |

## Gaps

- **202/203**: chưa có J15 để chạy; chưa có ma trận folio `settled`/`closed` × công nợ × đảo × xóa nợ × hoàn. Đảo ‖ B18 của đơn khác cùng folio (S4-09 đơn con) chưa chạy. Công nợ trên lượt có đơn con chưa kiểm. Hoa hồng BR-525 (iii) chỉ dựa test BE.
- **204**: chỉ chạy B13 gia hạn. Chưa chạy B14 quay lại căn đã đếm, việc HK tạo tay trên tủ căn hiện tại. Quy trình tay chưa thử với tủ đã trả phòng (folio `settled`).
- **205**: chỉ chạy CCCD + người đặt thiếu ngày sinh. Chưa chạy hộ chiếu, ngày sinh khác giấy tờ, giấy tờ từ app khách gắn sau, Desk thật. Chưa kiểm khai báo lưu trú có trùng người.
- **G-5 và giá**: chưa phủ BR-107 (≥ 7 đêm), BR-110 (luôn 2 người lớn), `inventory_optimize`, B8 chỉ dời muộn, CTV trong fuzz. Chưa đua MovePlanner ‖ B13/B18.
- **Khóa**: `quote_extension` chưa có ca đua; B7 chỉ ép với `no_show_restore`; B14 ‖ các loại duyệt chưa chạy.
- **BR-506**: chưa thử HK xong sau khi hết cửa sổ 24 giờ (mã bỏ ghi phí, chỉ log) – liên quan trực tiếp J15 của vòng 7.
- **A7-01**: chưa chạy B8, gia hạn có giá qua đơn con của đơn AC5a, đổi giá thuê giữa hợp đồng.
- Bộ cũ chạy song song khi máy tải 10–13; bộ đếm deadlock theo cả DB chỉ dùng số của lượt chạy riêng.
- Không E2E/UI cho "Thu công nợ", `checkout_debt`, FE/MOB gửi đủ `roomId` + `periodId`.
- Critic không chạy vòng sửa 7 (chưa commit); nhận định về vòng 7 dựa trên decision-log và ARC 16.27.

## Khuyến nghị cổng QC Sprint 4

**CHƯA** với commit cc02fba:
- **G1 không đạt** ("0 ca lệch tiền"): 202 – khoản phát sinh sau trả phòng chưa trả quá 24 giờ không thành công nợ, không ai được báo, không thu được (FD/MGR/VietQR 409). Khoản nợ mất dấu, như cách bug-list đã xếp 200 ("có lệch tiền – khoản nợ không được theo dõi").
- **G7 không đạt** ("0 P0/P1 mở"): 1 P1 (202).
- Điểm tốt: 6 mã đích đóng (199 một phần); 0 hồi quy hai lượt liền; giá đêm thêm 0 lệch qua 16.624 phép so; 0 deadlock; preLock có test cấu trúc; A7-01 và BR-506 sạch; api 2.925 × 2.

Điều kiện để vào cổng (**ĐẠT CÓ ĐIỀU KIỆN** khi đủ 1–7):
1. **Đóng 202** theo bảng Major-fix-now: J15 + `debtOnCheckout`, ca A/B/C, đối chứng, đua J15 ‖ thu / ‖ ghi phát sinh / ‖ đảo. ARC thêm J15 vào bảng 16.19.
2. **Đóng 203** theo ARC 16.27 mục 2, oracle BR-525-14/15, đua xóa nợ ‖ thu nợ (due ≥ 0, credit 0). SEC review đường `debt_write_off` trước gộp #18. DOM/ARC chốt BUG-R2-201 (A32 trên folio `closed`) và N-7 cùng lúc.
3. **Đóng 204**: chạy lại pipeline 3 pha `r7mig` trên commit mới cho cả ba dạng (197 vẫn RAISE; R7MIG-01 qua với K1 = K1b′ = 0, B18 đúng một lần; dữ liệu sạch qua), cả ce90d19 và f04052d. ORC/OPS ghi decision-log việc sửa 0071 đã gộp và dựng lại DB QA.
4. **DOM chốt G-5** (kế thừa hay giữ chữ BR). Nếu kế thừa: BE-A sửa cùng vòng 7, fuzz7 thêm trục này, 0 chuỗi lệch.
5. **Lượt kiểm lại 8 (ngắn, đích danh)** trên commit gộp vòng 7:
   - `r7lock/reversal-debt`, `v7-r7lock-*`, `approval-matrix` (vòng 7 sửa `approval.service.ts`, `foc.service.ts`), ca BR-525 mới;
   - `r7mig` 3 pha (điều kiện 3);
   - một seed fuzz7 và `min7` (vòng 7 sửa `checkout.service.ts`, `folio.service.ts`);
   - các tệp B18/thanh toán của `r7all/all` (`b18-*`, `nokey-b18`, `q-k11nokey-*`, `pay`, `r2pay`) và api toàn bộ;
   - mục tiêu: 0 ca đỏ ngoài keep và mã còn mở; xem trước = trần QR = ghi và đúng số; critic chấm lại một lượt ngắn.
6. **G5**: api và E2E xanh trên đúng commit chấm (CI #18).
7. **QA**: đóng 195, 196, 197, 198, 200, 133; giữ 199 tới khi ARC chốt; cấp 202…205; cập nhật superseded và `br-examples.json` (mục Test cũ (g)).

Được mở khi vào cổng (ORC ghi decision-log kèm hạn và người chịu):
- 205 (P2, không lệch tiền theo hợp đồng): tuần Ổn định, **trước bản dùng thử**.
- 199 (P3): ARC chốt câu chữ trong tuần Ổn định.
- 123 (P3); Note N-1…N-10; GAP-DOM G-1, G-3; R7ALL-02.

Không cấp ngoại lệ tiền. ORC ghi decision-log ngày chấm mới sau lượt kiểm lại lần 8.

## Tệp của critic

Thư mục `/private/tmp/claude-501/-Users-anhvh-Library-Application-Support-Claude-scratch-workspaces-00554cf2-3678-4864-82b0-830aaeaa97bd-4c0caebe-be05-49c5-a5a2-5bf357fddc6a-scratch-2026-10-15-c4f0d4/36df3adc-c586-471c-a039-340d2b696728/scratchpad/s438/r7critic/`:
- `env.sh` (từ `env-foc.sh`, đổi tên DB)
- `run1.log`: cc02fba, 5 tệp, 24 ca, 14 xanh, 10 đỏ
- `misc.evidence`: số 199 (`performedAt`, mốc, 140.000)
- `lock.evidence`: BR-525-01/03, R7LOCK-01/02, đua, deadlocks
- `be73.jsonl`: R7ALL-01 (đoàn, phản hồi, preview, B18)

Critic chạy test có sẵn, không chép hay sửa test nào. DB `ottimo_test_s438_r7critic` giữ lại để soi.
