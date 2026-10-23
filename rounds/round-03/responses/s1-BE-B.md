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
