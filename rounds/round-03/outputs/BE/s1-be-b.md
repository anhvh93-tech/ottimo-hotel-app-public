# BE-B – Round 3 Sprint 1 – Sản xuất: lượt kiểm tiền bước 1–3 (210 + 209, phần folio-lines của 208)

- Vai: BE-B | Ngày: 23/10/2026 | Nhánh: `worktree-agent-a4a7a7b47e3d900bf` (cắt từ `main` 8228f33, chưa push)
- Căn cứ: `sprint-1-plan.md` mục 3.1, 4, 5; ARC `outputs/ARC/s1-contracts.md` mục 5.1, 5.2, 10; ARC `round-02/outputs/ARC/openapi-0.3.7.md` 16.31; DOM `outputs/DOM/s1-money-oracle.md` mục 2, 3, 4; SEC `outputs/SEC/s1-security-requirements.md` mục D; bug-list BUG-R2-208/209/210.
- Ngoại lệ đóng băng mã tiền: ORC mở một lần (decision-log 22/10). Không làm BE-83/ESC-026 lần này.

## 1. Đã làm gì

### 1.1 Commit 1 – 210 + 209 chung một PR (cùng `writeDebt`)
`CheckoutService.writeDebt` quyết theo số ngay lúc ghi, dưới L1 → L3 người gọi đã giữ (ARC 16.31.2 (b)):
- X = `cycleOpenDebtVnd` **trước** lần ghi (công thức `openDebtVnd` bỏ quy tắc "hết cửa sổ"; G-4 kẹp theo còn phải thu **trước** khi đảo).
- X > 0 → **nối**: `debt_recorded_vnd` += phần ghi; giữ `debt_opened_at`, `debt_base_vnd`, hạn, lý do.
- X = 0 → **công nợ mới**: `debt_opened_at` = now, `debt_recorded_vnd` = phần ghi, `debt_base_vnd` = Σ giảm hiện tại, hạn = ngày nghiệp vụ + `debt_default_due_days`, lý do mới. Chu kỳ "nằm im" (số về 0, `debt_settled_at` NULL) không còn giữ hạn cũ.
- Bỏ cờ `keep`.
- **210** (nợ ghi trước 0076, `debt_opened_at` NULL, `checkout_mode = debt`): X = max(0, B − W_cũ). W_cũ = min(B, Σ dòng sống `post_checkout` + phần tăng A32 sau trả phòng). Phần tăng A32 = dòng thay − dòng trước trả phòng mà nó thay, dò qua `related_line_id` cùng loại. Không trừ khoản thu (G-6), không tính FOC `debt_write_off`. Folio `closed` → X = B.
  - Lần ghi đầu sau deploy tạo chu kỳ: `debt_opened_at` = `actual_checkout_at`, `debt_recorded_vnd` = X + phần ghi, `debt_base_vnd` = Σ giảm hiện tại, giữ hạn và lý do cũ.
- **209** – J15 (`debtOnCheckout`):
  - X = 0 → công nợ mới;
  - 0 < X < B → ghi phần chênh B − X, có nhật ký, thông báo `debt_recorded` OWN + MGR và cộng `debt_recorded_vnd`, giữ hạn;
  - X = B → chỉ đóng.
  - `folio-close-job` `hasOpenDebt` đọc `openDebtVnd > 0`.
- "Cần chú ý" `checkout_debt` lọc theo `openDebtVnd > 0` qua biến thể chỉ đọc, không khóa (`CheckoutService.openDebtVndView`). Chu kỳ nằm im không hiện, nên không thành "critical quá hạn".
- Nhật ký tiền `reservation.debt_on_checkout` thêm `before.openDebtVnd` và `after.openDebtVnd` (thêm vào allowlist `reservation`, chỉ là số).
- Gỡ `pendingFix BUG-R2-209` ở BR-525-02 và BR-525-33 (`br-examples.json`), có ghi chú.

### 1.2 Commit 2 – phần `folio-lines` của 208 (commit riêng, **chưa được gộp**)
`FolioLinesService.adjust`:
- **N-7 theo số**: trên folio `settled` trong cửa sổ, nếu `openDebtVnd` > 0 thì phần giảm phải ≤ W = max(0, B) − O. Vượt → 409 `FOLIO_LOCKED` với mọi vai, không ghi gì. O = 0 → A32 như đơn không công nợ. Tăng → 201.
- **N-15**: folio `settled` đã quá `post_checkout_window_until` (J15 chưa chạy) → 409 `FOLIO_LOCKED`, như `closed`.
- **SEC D.4**: mỗi lần giảm được phép khi O > 0 đều có nhật ký `folio_line.adjusted`, ghi `openDebtVnd`, `windowVnd`, `reducedVnd` (thêm vào allowlist `folio_line`). Vai người làm nằm ở actor của nhật ký. Với void, đây là nhật ký thêm, bên cạnh `folio.line_reversed`.

**Điều kiện gộp 208 (ghi rõ):** chỉ gộp sau khi commit 210/209 đã gộp và xanh (CI + QA/SEC xác nhận `openDebtVnd` trên dữ liệu ghi trước 0076). SEC phải review trên head SHA sẽ gộp, ghi ở `rounds/round-03/reviews/s1-SEC-on-BE-B.md` (SEC D.1–D.2). Commit thêm sau khi SEC duyệt thì SEC review lại phần diff.

## 2. Test đã chạy (CSDL Postgres 17 riêng trong docker, role `ottimo_app`, migration bằng `ottimo_migrator`)

| Lệnh | Kết quả |
|---|---|
| `turbo run typecheck --filter=@ottimo/api` | đạt (sau mỗi commit) |
| `eslint` + `prettier` trên các tệp sửa | đạt |
| `vitest run test/integration/s438-r8/r3-debt-210-209.test.ts` | 9/9 – 210-A, 210-A tiếp, 210-B, 210-B tiếp, 210-C, 209-A, 209-B, 209-C, 209-D (tuần tự hai thứ tự + đua ép thứ tự sau khóa folio, deadlock +0), 209-E |
| `vitest run test/integration/s438-r8/r3-folio-lines-208.test.ts` | 7/7 – 208-A (hai thứ tự ghi minibar), 208-B (FD + OWN 409, biến thể giảm phòng 80.000 → 409), 208-C (SEC D.3 a/b: A32 +10.000 × 9, void 409, 90.001 409, 90.000 201, có nhật ký), 208-D (hai thứ tự), 208-F (N-15), 208-G (hai thứ tự + hai lần giảm tổng vượt W → đúng một 409), tăng → 201 |
| Toàn bộ api `vitest run` sau commit 1 | **105 tệp đạt, 1 bỏ qua; 2.980 test đạt, 2 bỏ qua** |
| Toàn bộ api `vitest run` sau commit 2 | 106 tệp đạt, 1 lỗi → sửa test, chạy lại tệp đó + `s438-r8` 51/51: **2.987 đạt, 2 bỏ qua** |

Sửa test cũ:
- `s4-recheck6-be-a.test.ts` (commit 1): 4 chỗ so `after` nhật ký `debt_on_checkout` bằng `toEqual` nay có thêm `openDebtVnd`; giá trị cũ giữ nguyên.
- `reversal-debt-g4.test.ts` (commit 2): ca N-7 R2 có bước cuối "A32 tăng → 201" chạy ở D+2, tức đã hết cửa sổ mà J15 chưa chạy. Theo N-15 (ARC 16.31.1: quá cửa sổ = `closed` trong `adjustFolioLine`), bước này nay ra 409 `FOLIO_LOCKED`. Ca tăng trong cửa sổ → 201 đã có ở `r3-folio-lines-208.test.ts`. **Cần ARC/SEC xác nhận** N-15 áp cả chiều tăng (đọc theo chữ "coi như closed").

## 3. Đối chiếu oracle DOM (số đo trên test)

Ánh xạ giờ: fixture trả phòng 11:00 (oracle 10:00). Hạn "19/11" = D+3, "20/11" = D+4. Ca 209-B dùng hạn B18 D+5 thay cho "30/11"; điều được kiểm là hạn **giữ nguyên**. Ca 208-C dùng xóa nợ 600.000 trên dòng fnb 5.000.000 (cơ sở ≥ 667.000).

| Ca | Kết quả |
|---|---|
| 210-A | B 1.004.000, O **934.000**, W 70.000, nhật ký 834.000, hạn giữ D+3, "Cần chú ý" có |
| 210-A tiếp | J15 +70.000, O = B = 1.004.000, hạn D+3, `closed`, báo lần hai |
| 210-B | O **2.916.000**, yêu cầu vẫn chờ |
| 210-B tiếp | OWN duyệt: áp 1.500.000, không `applied_capped`, O 1.416.000, credit 0 |
| 210-C | O 500.000, hạn D+3 |
| 209-A | Nhật ký [100.000, 70.000], báo hai lần, recorded 170.000, hạn D+3 |
| 209-B | O 270.000, hạn D+5 giữ |
| 209-C | O 0 lúc chờ, không có mục "Cần chú ý"; J15 tạo công nợ mới 70.000, hạn D+4 |
| 209-D | Cả hai thứ tự cho O 170.000, hạn D+4 |
| 209-E | Không thêm nhật ký, không báo |
| 208-A … 208-D, 208-F, 208-G | Đúng số mục 4 của oracle |

## 4. File tạo/sửa
- `product/services/api/src/modules/frontdesk/internal/checkout.service.ts` (commit 1)
- `product/services/api/src/modules/frontdesk/internal/attention-sources.ts` (commit 1)
- `product/services/api/src/modules/frontdesk/frontdesk.module.ts` (commit 1)
- `product/services/api/src/modules/folio/public/folio-close-job.ts` (commit 1)
- `product/services/api/test/integration/s438-r8/r3-debt-210-209.test.ts` (mới, commit 1)
- `product/services/api/test/integration/s4-recheck6-be-a.test.ts` (commit 1)
- `product/tests/fixtures/br-examples.json` (commit 1 – gỡ `pendingFix BUG-R2-209`)
- `product/services/api/src/modules/folio/internal/folio-lines.service.ts` (commit 2)
- `product/services/api/src/modules/folio/folio.module.ts` (commit 2)
- `product/services/api/test/integration/s438-r8/r3-folio-lines-208.test.ts` (mới, commit 2)
- `rounds/round-03/outputs/BE/s1-be-b.md` (tệp này, commit 3)

## 5. Giả định (thuộc quyền BE, ARC kiểm khi review – không ESC)
1. **Đường đọc dùng cùng định nghĩa nợ cũ**: `openDebtVnd` của nợ ghi trước 0076 khi chưa có lần ghi mới = B − W_cũ, không còn bằng B như R2. Lý do: DOM "một định nghĩa công nợ". Ảnh hưởng: trần xóa nợ và "Cần chú ý" trên dữ liệu cũ thấp hơn, tức an toàn hơn. ARC mục 5.2 chỉ nói tới `writeDebt`, nên ARC cần xác nhận.
2. `debt_opened_at` khi tạo chu kỳ cho nợ cũ = `actual_checkout_at`. Không đọc audit cũ nhất vì frontdesk không có cổng đọc audit. ARC 5.2 cho phép cách này; số này không dùng trong phép tính.
3. "Cần chú ý" vẫn giữ `debt_settled_at IS NULL` làm bộ lọc SQL rẻ. Đây là tập lớn hơn tập O > 0: chu kỳ đã `settled` thì O = 0, vì mọi lần tăng đều qua `writeDebt` và được đặt lại NULL. Quyết định cuối vẫn theo số.
4. Nhánh nối giữ `debt_recorded_vnd` += phần ghi đúng chữ ARC. Khi R − D > B trước (chỉ xảy ra với A32 giảm cũ), O vẫn bị kẹp theo B nên không lệch tiền.
5. Hai lần A32 giảm đồng thời được tuần tự hóa bằng If-Match (version folio) + L3. Lần sau luôn 412/409. Vì vậy ca SEC D.3 (c) kiểm bằng hai lần giảm nối tiếp trên cùng trạng thái.

6. N-15 áp cho mọi A32 trên folio `settled` đã quá cửa sổ, cả tăng lẫn giảm, giống `closed`.

## 6. Rủi ro / vướng mắc / việc còn lại
- **Phần còn lại của 208** (ARC 5.1 bước 3 – chưa làm lần này):
  - `ReservationHooks.openDebt` trả `null` khi `openDebtVnd` = 0. Hệ quả: 208-E, FOC `debt_write_off` khi O = 0 → 409 thay cho 422 `max` 0.
  - Xuất `cycleOpenDebtVnd` qua cổng.
  - `openDebt` còn đọc `debt_settled_at` trong điều kiện null, cần bỏ.
  - `Folio.totals.openDebtVnd` (hợp đồng đi trước, chờ ORC xếp).
  - Gỡ `pendingFix BUG-R2-208` ở BR-525-29…32 – để QA gỡ khi 208 đủ phần và SEC Verified.
- Sau 208 (theo thứ tự): N-11 (A04 L2 → L3) cùng khẳng định `touch` dưới `FOR UPDATE`; bước 4 BE-83 + ESC-026 A + R3-Q25; R3-Q24, Q23 phần B, Q01 phần hoàn, Q10, Q51 server, Q27 payments.
- Fuzz R3-Q30 (QA) cần chạy trên bản đã có 210/209/208.
- FE-A: không đổi màn cho 209/210. Câu 409 của 208 đã có trong bảng việc ARC 16.31.7.
- N-15 chặn mọi A32 trên folio quá cửa sổ, kể cả chiều tăng (giả định 6, ARC/SEC xác nhận khi review 208).

## 7. Phản hồi & sửa (23/10, sau review SEC + ARC)

Trả lời từng thẻ: `rounds/round-03/responses/s1-BE-B.md`. ARC đã đồng ý cả 5 giả định ở mục 5; SEC đồng ý giả định 6.

- **Commit "fix 210"** – sửa trên phần đã gộp c6b0042:
  - W_cũ an toàn khi chuỗi A32 vượt độ sâu 64 (SEC-01 a);
  - test chuỗi A32 (ARC S1-01);
  - `hasOpenDebtByNumber` dùng chung cho J15 và fixture; 209-E chạy qua JobRunner (S1-02);
  - nhật ký ghi nợ đo lại O và có `actorRole` (S1-03, SEC-03).
- **Commit "208 – sửa theo review"**:
  - nợ trước 0076 giữ N-7 cũ qua `OpenDebt.cycleOpened` (SEC-01 b);
  - `openDebt` theo số: trả null khi O = 0 và bỏ `debt_settled_at` (S1-04; 208-E → 409);
  - nhật ký A32 đo lại O, có vai, rollback nếu O giảm (SEC-03);
  - 3 ca đua thật (SEC-02).
- Mục 6 cập nhật: đã làm phần `openDebt` null khi O = 0 và bỏ `debt_settled_at`. Còn lại:
  - `Folio.totals.openDebtVnd`;
  - export `cycleOpenDebtVnd` – không cần nữa, vì J15 dùng `hasOpenDebtByNumber`;
  - gỡ `pendingFix BUG-R2-208` (QA).
