# BE-B trả lời review – R3 Sprint 1, lượt kiểm tiền (210 + 209, 208 folio-lines)

- Người trả lời: BE-B | Ngày: 23/10/2026 | Bước: Phản hồi & sửa
- Review được trả lời: `rounds/round-03/reviews/s1-SEC-on-BE-B.md`, `rounds/round-03/reviews/s1-ARC-on-BE-B.md`
- Nhánh: `worktree-agent-a4a7a7b47e3d900bf`, đã rebase lên `main` 978c62f (đã có c6b0042 = 210+209). Chưa push.
  Thứ tự commit trên nhánh:
  1. 208 folio-lines (bản cũ `ad7390c`, SHA đổi do rebase, patch giữ nguyên);
  2. báo cáo;
  3. **fix 210**;
  4. **208 – sửa theo review**.

  Lưu ý: commit fix 210 nằm **sau** commit 208 trên nhánh. Lệnh reset nhánh để đưa nó lên trước bị chặn. Hai cách xử lý:
  - ORC cherry-pick riêng commit fix 210 lên `main`: commit này chỉ chạm phần đã gộp, test của nó không phụ thuộc 208;
  - hoặc gộp cả nhánh theo kiểu merge giữ SHA.

## Thẻ SEC

### FB-R3-SEC-BE-B-01 (Blocker) – Done
- (a) **fix 210**:
  - `windowChargesVnd` dò chuỗi `related_line_id` tới tối đa `WINDOW_CHAIN_MAX_DEPTH` = 64.
  - Lá nào chạm trần mà phía trên vẫn còn dòng bị thay cùng loại thì **tính 0** vào W_cũ, không bao giờ tính cả dòng. Chuỗi chưa giải được chỉ có thể làm W nhỏ đi, nên O không bao giờ giảm.
  - Test (`r3-debt-210-209.test.ts`) tái hiện S5 của SEC: nợ cũ 100.000, tăng dòng phòng 1.000 đồng × 70 lần. Tới lần 60, O = 100.000 ở mọi bước. Từ lần 61 tới 70, O ≥ 100.000 và O ≤ B.
- (b) **208**:
  - `OpenDebt.cycleOpened` (cổng nội bộ `ReservationHooks`, không đổi OpenAPI).
  - Khi nợ ghi trước 0076 chưa có chu kỳ, A32 trên folio `settled` **chặn mọi lần giảm** như N-7 của R2, cho tới khi một lần ghi nợ tạo chu kỳ.
  - Test (`r3-folio-lines-208.test.ts`):
    - nợ cũ + khoản cửa sổ 70.000: void minibar → 409; giảm 1 đồng → 409; không ghi gì. Sau một lần đảo khoản thu (tạo chu kỳ), void minibar → 201;
    - S5: tăng 52 lần × 1.000 → O 100.000; void dòng phòng → 409, không ghi gì;
    - probe ARC 2: giảm 834.000 → 800.000 trên dòng trước trả phòng → 409.
- Cần ARC xác nhận: thêm trường `cycleOpened` vào cổng `OpenDebt`.

### FB-R3-SEC-BE-B-02 (Major) – Done
Có 3 ca đua thật trong PR 208, dùng `x.race`. Mỗi ca chạy ép thứ tự sau khóa folio (`interleaved`), cả hai thứ tự, 2 vòng mỗi thứ tự, rồi so với chạy tuần tự trên bản đặt chỗ mới. Mọi ca kiểm deadlock +0, không có 5xx, và B ≥ O:
1. Void minibar 70.000 ‖ giảm dòng phòng 40.000, cùng If-Match → đúng một `201`, lượt kia `412`; O = 100.000.
2. Void minibar ‖ MGR đảo khoản chuyển khoản 300.000 (G-4) → hai thứ tự cho kết quả giống chạy tuần tự; O ≥ 100.000. Dùng số cố định vì các lượt chạy được so trên những đơn khác nhau.
3. Void khoản cửa sổ ‖ OWN duyệt `debt_write_off` 3.000.000 đang chờ (nợ 5.000.000) → `200 approved`; O = 2.000.000.

Ca 208-G (hai lần giảm nối tiếp) vẫn giữ.

### FB-R3-SEC-BE-B-03 (Minor) – Done
- **A32**: lần giảm được phép khi còn nợ ghi **một** nhật ký `folio_line.adjusted`, gồm:
  - `before.openDebtVnd`, `before.windowVnd`, `before.actorRole` (vai cao nhất lúc làm);
  - `after.reducedVnd`;
  - `after.openDebtVnd` **đo lại** bằng `hooks.openDebt` sau `syncReductions`, trong cùng giao dịch và cùng khóa.
- Nếu O sau < O trước: ghi log mức error (chỉ id folio, không số tiền của khách) và ném lỗi để rollback (bất biến BR-525 (ii) kiểm lúc chạy).
- Allowlist `folio_line` thêm `actorRole`.
- **Nhật ký ghi nợ** (fix 210): `reservation.debt_on_checkout` có `before.actorRole` (J15 = `system`) và `after.openDebtVnd` đo lại (xem ARC S1-03).
- Hàm dùng chung: `audit/public/actor-role.ts`.

### FB-R3-SEC-BE-B-04 (Minor) – Done
- Báo cáo `outputs/BE/s1-be-b.md` trỏ sang `reviews/s1-SEC-on-BE-B.md`.
- SHA đã đổi do rebase lên `main` mới, đúng như SEC D.2 dự liệu. Patch của commit 208 cũ giữ nguyên; phần thêm nằm ở commit "208 – sửa theo review". SEC review lại phần diff thêm trên head SHA ghi trong kết quả trả ORC.
- Đề xuất gộp 208 bằng merge giữ SHA.

### FB-R3-SEC-BE-B-05 (Suggestion) – Chuyển DOM/ARC
- Đây là quy tắc nghiệp vụ (A32 chuyển doanh thu `room` sang `other` sau trả phòng), không thuộc điều kiện D. BE không đổi mã khi chưa có quyết định DOM.
- Đề xuất DOM xét đưa "A32 sau trả phòng có giảm dòng `room`" vào báo cáo kiểm soát của OWN (Sprint 2, cùng báo cáo FOC).

### FB-R3-SEC-BE-B-06 (Suggestion) – Done (ARC đã xác nhận)
- ARC đã đồng ý N-15 chặn cả chiều tăng (`s1-ARC-on-BE-B.md`, giả định 2). Không đổi mã.

## Thẻ ARC

### FB-R3-ARC-BEB-S1-01 (Minor) – Done (fix 210)
Thêm ca "210-A32", lấy từ probe ARC:
- chuỗi A32 dài 3 dòng trên dòng fnb trước trả phòng (+10.000 × 3);
- khoản cửa sổ 70.000 được A32 nâng lên 75.000 → W 105.000, O 100.000;
- đảo 834.000 → O 934.000;
- J15 → O = B = 1.039.000.

Probe 2 (giảm trên nợ cũ → 409) nằm ở test 208.

### FB-R3-ARC-BEB-S1-02 (Minor) – Done (fix 210)
- Xuất `hasOpenDebtByNumber` từ `folio-close-job.ts`. J15 thật và hai fixture `j15Unit` / `j15One` (`s438-r8/fixture.ts`, `h.ts`) dùng chung hàm này.
- Ca 209-E chạy qua `runJ15` (JobRunner thật). Ca này đi qua nhánh "X = B, không ghi gì": job vẫn đóng folio.

### FB-R3-ARC-BEB-S1-03 (Minor) – Done (fix 210)
- `writeDebt` đọc lại dòng đặt chỗ sau `UPDATE` rồi gọi `cycleOpenDebtVnd`. Số đó ghi vào `after.openDebtVnd`, không tính từ đầu vào.

### FB-R3-ARC-BEB-S1-04 (Minor) – Done (commit 208)
- `openDebt` bỏ hẳn điều kiện `debt_settled_at`, và trả `null` khi `openDebtVnd` = 0 (16.31.1). Có hai hệ quả, test đã đổi theo:
  - FOC `debt_write_off` khi O = 0 → 409 `FOLIO_LOCKED` (208-E; `reversal-debt-g4` đổi từ 422 `max` 0);
  - thu tiền khi chu kỳ đang nằm im đi nhánh thu thường.
- Lý do làm trong commit 208: đổi hành vi của 208-E, đúng như ARC đề xuất "làm cùng phần còn lại của 208".
- QA thêm bất biến fuzz "`debt_settled_at` NOT NULL ⇒ `cycleOpenDebtVnd` = 0" (ARC).

### FB-R3-ARC-BEB-S1-05 (Suggestion) – Rejected cho Sprint 1
- Lý do: lần kẹp hiện không với tới được (ARC tự chứng minh ở giả định 4). Thêm log ở đường tiền đang có lượt critic chỉ làm nhiễu.
- Làm cùng đường tiền mới đầu tiên có thể tạo R − D > B (thu hồi FOC Sprint 2), ghi vào checklist 16.31.3.

### FB-R3-ARC-BEB-S1-06 (Suggestion) – Accepted, nợ kỹ thuật
- Làm hàm đọc lô khi `Folio.totals.openDebtVnd` vào hợp đồng. Chưa làm bây giờ.

### FB-R3-ARC-BEB-S1-07 (Suggestion) – Done
- Giữ 409 với mọi vai khi folio đã quá cửa sổ. FE-A cần biết điều này (đã ghi trong báo cáo).

## Còn mở sau lượt này
- SEC review lại phần diff thêm trên head SHA mới (D.2), rồi cấp "210 Verified" (D.1).
- ARC xác nhận trường `cycleOpened` của cổng.
- `Folio.totals.openDebtVnd` (D.5) – chờ ORC xếp vào hợp đồng.
- FB-R3-SEC-BE-B-05 – chờ DOM/ARC quyết.

---

# Lượt 2 – review của `29ce3d8` (BE-83 + ESC-026 A + R3-Q25) – Phản hồi & sửa 23/10

- Review được trả lời: `reviews/s1-SEC-on-BE-B.md` (mục `29ce3d8`: FB-07, FB-08), `reviews/s1-ARC-on-BE-B.md` (mục `29ce3d8`: S1-08…S1-13).
- Căn cứ: BR-433 (d) v0.4.1; oracle DOM 5.4 (BB07-1…7, I16); "Hướng dẫn sửa FB-07" của ARC.
- Nhánh đã rebase lên `main` 5834c6a. Migration đổi số **0079 → 0080**, vì 2FA (BE-C) giữ 0079. Lúc rebase `main` chưa có 0079, nên trên `main` hiện để hở một số; điều này vô hại, test `migrations-journal` chỉ kiểm thứ tự `when`.

## Thẻ SEC

### FB-R3-SEC-BE-B-07 (Blocker) – Done, chờ SEC review lại diff
Làm đúng thiết kế ARC.

**Ba cột dữ liệu mới (migration 0080)**
- `stay_night.reference_rate_vnd` (NOT NULL): giá đêm tham chiếu do hệ thống ghi.
  - Chỉ các đường giá của hệ thống trong `reservations` ghi cột này: `insertNights`, đêm dài hạn, giá lại đêm giữ nguyên, kế hoạch dời/đổi căn (B7/B14/đổi ngày).
  - Đêm có giá gõ tay (snapshot `manual`) giữ nguyên giá tham chiếu cũ.
  - A31 `setNightRate` không ghi cột này.
- `folio_line.limit_ref_vnd`: dòng `room` mang theo giá tham chiếu của đêm qua `ConfirmedStay.nights[].referenceRateVnd`.
  - Dòng `late_fee_as_night` lấy chính số máy tính lúc ghi.
  - Dòng thay của A32 chép giá tham chiếu của dòng bị thay.
  - Dòng đảo chép theo dòng gốc.
  - CHECK `folio_line_limit_ref_required_check` chặn mọi dòng đêm thiếu giá tham chiếu (fail-closed).
- `folio.limit_basis_checkout_vnd`: chụp **một lần** trong `settle`.
- Backfill cả ba cột cho dữ liệu cũ, sau đó mới đặt NOT NULL và CHECK.

**Một cổng duy nhất `FolioService.limitBasisVnd(tx, folioId, lineId | null)`**
- Giá bảo vệ của một đêm = LEAST(giá dòng, `limit_ref_vnd`). Nếu đã có số chụp lúc B18 thì lấy thêm min với số đó.
- Đã xóa `nightRateBasis` và `folioNightBasisVnd`, nên không còn đường đọc giá chưa bảo vệ.
- Người gọi: `foc.service` (a)(b), `stay-waiver-alert` (ngưỡng MGR), `stay-support` (FOC phụ thu tại quầy).

**Test (`s438-r8/r3-bb07-limit-basis.test.ts`)**
- BB07-1: đủ 3 bước, cuối B = O = 5.000.000; Σ đã áp 0; không phát sinh `foc_stay_alert`.
- BB07-2.
- BB07-3, BB07-4: dùng giá đêm 1.900.000 vì đó là trần A31 của seed; số 3.000.000 trong oracle vượt trần. Kết luận không đổi: cơ sở vẫn 667.000.
- BB07-5: B14 theo yêu cầu khách sang 401 → cơ sở 1.042.000 → MGR tự áp được 1.000.000.
- BB07-6: dùng LT trưởng sửa giá, vượt sàn thì dùng MGR → cơ sở 540.000.
- BB07-7: số chụp B18 là trần.

**Fuzz:** QA đưa I16 vào R3-Q30. Fixture BR-433-11…15 (`pendingFix R3-SEC-BE-B-07`) chưa có trên `main`; QA thêm rồi gỡ theo test này.

### FB-R3-SEC-BE-B-08 (Suggestion) – Accepted, chuyển checklist US-143
- Khi người dùng đã bật 2FA, `PasswordReauth` cho mục đích `foc`/`debt_write_off` sẽ đòi thêm bước TOTP.
- Việc này phụ thuộc US-143 (BE-C), nên không làm trong commit này.

## Thẻ ARC

### FB-R3-ARC-BEB-S1-08 (Blocker) – Done
Như FB-07 ở trên. Test kiến trúc mới `test/money-limit-basis-architecture.test.ts` kiểm:
- chỉ ba tệp hệ thống của `reservations` ghi `reference_rate_vnd`;
- `stay-night-pricing.ts` (A31) không có `reference_rate_vnd`;
- chỉ `settle` ghi `limit_basis_checkout_vnd`;
- không còn tên `nightRateBasis` / `folioNightBasisVnd` trong mã.

### FB-R3-ARC-BEB-S1-09 (Major) – Done
- Migration 0080: CHECK kind = danh sách trên `main` (0072) **+** `foc_stay_total_exceeded`, chỉ có dòng thêm.
- Test không cần DB:
  - CHECK của migration mới nhất (có viết lại CHECK này) = `STAFF_NOTIFICATION_KINDS`;
  - mỗi lần viết lại giữ đủ kind của lần trước.
- Test có DB: chèn thử từng kind trong một giao dịch rồi rollback.
- Cột/ràng buộc của S1-08 và FK của S1-12 đã gộp vào cùng migration.

### FB-R3-ARC-BEB-S1-10 (Minor) – Done
- Thêm `FolioService.waiverLimitInput(tx, folioId, lineId, amountVnd, 'debt_write_off' | 'key')`, trả `{ perTimeAmountVnd, limitBasisVnd }`.
- `foc.service` và `stay-support` dùng hàm này.
- Test kiến trúc: mọi `approvals.submit` loại `foc`/`special_discount` phải truyền kết quả của hàm này.

### FB-R3-ARC-BEB-S1-11 (Minor) – Done
- Mục "Cần chú ý" còn mở thì cập nhật `details.count` (`EventsService.updateAttentionParams`, cấp quyền `UPDATE (details)` trong 0080).
- Mục đã "Đã xem" thì mở một mục mới và cập nhật `foc_stay_alert.attention_event_id`.
- Test S1-11: count 2 → 3, OWN bấm "Đã xem", vượt tiếp mở mục mới count 4, tổng 3 thông báo.

### FB-R3-ARC-BEB-S1-12 (Minor) – Done
- FK `foc_stay_alert_reservation_fk (property_id, stay_root_reservation_id) → reservation`.

### FB-R3-ARC-BEB-S1-13 (Suggestion) – Không làm Sprint 1
- Theo quyết định ARC: hợp đồng 0.3.9.

## Còn mở
- SEC review lại diff trên head mới (FB-07 + test kiến trúc).
- PO sửa chữ US-007 AC7 (nhật ký loại `state`) theo quyết định ARC.
- QA: thêm I16 và fixture BR-433-11…15.
- Thêm `AttentionItem.params` tổng/ngưỡng (S1-13) ở hợp đồng 0.3.9.

## Lượt 3 – điều kiện gộp ARC S1-14, S1-15 (23/10)

### FB-R3-ARC-BEB-S1-14 (Major – thao tác gộp) – Done
- Nhánh đã rebase lên `origin/main` e1f4b99, trên đó đã có 0079 (2FA) và 0081 (BE-C q17).
- Migration đổi tên thành **0082_foc_stay_alert_limit_basis**:
  - journal idx 58, `when` sau 0081;
  - `0082_snapshot.json` sinh lại bằng `drizzle-kit` trên nền 0081 (`prevId` = id snapshot 0081);
  - phần SQL viết tay giữ nguyên nội dung, chỉ đổi đoạn chú thích đầu tệp.
- CHECK kind = danh sách trên `main` (giữ như 0072) + `foc_stay_total_exceeded`.
- `drizzle-kit generate`: "No schema changes".

### FB-R3-ARC-BEB-S1-15 (Minor) – Done
- `ConfirmedStay.nights[].referenceRateVnd` chuyển thành bắt buộc. Bỏ `?? gross` khi ghi dòng đêm.

Ngoài hai thẻ trên, mã không đổi so với `41c49d7`.

---

# R3-Q51 – trả lời review ARC (`s1-ARC-on-Q51.md`) và SEC (`s1-SEC-on-Q51.md`) – 23/10

Nhánh `be-b/r3-q51-receiving-account`, đã rebase lên `origin/main` bea761f (có hợp đồng 0.3.8 bổ sung 2).

## FB-R3-ARC-Q51-01 (Major) – phần server: Done
- `getParameterHistory` chỉ trả 404 khi khóa **không có dòng nào** và cũng không có mặc định.
- Khóa có dòng nhưng chưa dòng nào tới ngày hiệu lực → 200, bỏ `current`, `history` liệt kê đủ các dòng đã lên lịch.
- Test: đặt lần đầu → GET 200, không có `current`, `history` 1 dòng (số đã che) → MGR 403 → OWN hủy → GET 404 → MGR vẫn 403.
- Phần màn hình và MSW: FE-A làm tiếp trên nhánh này, theo đúng chỉ đạo của ORC.

## FB-R3-ARC-Q51-02 (Minor) + FB-R3-SEC-Q51-02 (Minor): Done
- Migration 0084 thêm trigger `config_parameter_delete_future_only` (`BEFORE DELETE`).
  - Chỉ cho xóa dòng có `effective_from` sau ngày kinh doanh của cơ sở, tính bằng giờ địa phương − `business_day_rollover` (mặc định 06:00). Các dòng khác bị chặn bằng `check_violation`.
- Test DB: dùng chính role `ottimo_app`, xóa thẳng bằng SQL một dòng đã qua → bị từ chối; xóa một dòng tương lai → được.
- Test kiến trúc `test/parameters-delete-architecture.test.ts`:
  - `DELETE FROM config_parameter` chỉ xuất hiện trong `ParametersService.cancelScheduled`;
  - migration 0084 phải có trigger nói trên.
- Lưu ý: trigger đọc giờ thật của CSDL (`now()`), không đọc đồng hồ giả của test. Vì vậy test Q51 dùng ngày năm 2030.

## FB-R3-SEC-Q51-01 (Minor): Done
- Với khóa `payment_receiving_account`, cả khi đặt lẫn khi hủy: `reason` có dãy từ 6 chữ số trở lên (các nhóm số cách nhau bằng dấu cách tính là một dãy), hoặc chứa đúng số tài khoản vừa gửi → 422 `reason` `ACCOUNT_NUMBER_NOT_ALLOWED`.
- Kiểm tra chạy **trước** bước xác thực S2, nên không làm hỏng mã TOTP hay tốn mã khôi phục, và không ghi gì.
- Ngày dạng ISO (`2030-03-21`) vẫn được nhận.
- Có test riêng; bước quét JSON của Q51-2 vẫn xanh.
- Gợi ý chữ trên màn ("không ghi số tài khoản vào lý do"): giao FE-A.

## FB-R3-SEC-Q51-03
- Phần axe/E2E: giao QA, theo ORC.

## Kiểm đã chạy
- `r3-q51-receiving-account` 9/9; kiến trúc 2/2.
- Toàn bộ API: 116 tệp đạt, 1 bỏ qua; 3.097 test đạt, 7 bỏ qua.
- admin-web: 53 tệp, 550 test đạt.
- typecheck 13/13; eslint, prettier đạt.
- `drizzle-kit generate`: không sinh tệp.
