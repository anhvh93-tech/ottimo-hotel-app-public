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

## 8. Lượt kiểm tiền bước 4 – BE-83 (R3-Q22) + ESC-026 A + R3-Q25 (23/10, Sản xuất)

Căn cứ: BR-433 (a)(b)(c) v0.4.0; DOM `s1-money-oracle.md` mục 5; SEC `s1-security-requirements.md` B.5; ARC `s1-contracts.md` 5.3; OpenAPI 0.3.8-draft (`foc_stay_total_exceeded`); erd 4.15 (`foc_stay_alert`). Nhánh đã fast-forward lên `main` 4863c5c.

### 8.1 Đã làm
- **(a) Xóa nợ cộng dồn theo folio.**
  - Σ gồm: số đang áp của mọi yêu cầu `debt_write_off` đã duyệt trên folio (mọi chu kỳ, mọi người, kể cả OWN; tính theo dòng FOC sống), cộng số xin của các yêu cầu đang chờ, cộng số xin mới. Yêu cầu bị từ chối hoặc tự hủy `debt_cleared` không tính.
  - Cơ sở so sánh = giá đêm cao nhất của folio: dòng `room` sống, phụ thu thay đêm `late_fee_as_night`, hoặc giá đêm quy đổi của đơn dài hạn (hàm mới `FolioService.folioNightBasisVnd`).
  - Σ đọc dưới khóa L1 → L3, nên hai yêu cầu gửi cùng lúc không thể cùng tự áp.
- **(b) FOC thường cộng dồn theo khóa.** Σ = phần đang áp và đang xin trên khóa (`FolioService.reductionUsage`) cộng số xin mới.
  - `ApprovalService.SubmitInput.perTimeAmountVnd` đem Σ này so với hạn mức lần và định tuyến; hạn mức tháng vẫn tính theo số của từng yêu cầu.
  - Nhật ký `approval.requested`/`self_applied` có thêm `cumulativeVnd`.
- **(c) ESC-026 A – báo OWN khi tổng miễn trên lượt ở vượt ngưỡng.**
  - `StayWaiverAlertService` chạy sau mỗi khoản được áp bởi FD/FDL/MGR, trong cùng giao dịch và dưới khóa folio.
  - Σ lượt = tổng các dòng FOC / giảm giá đặc biệt / xóa nợ đang sống, chỉ tính khoản do vai dưới OWN duyệt hoặc tự áp.
  - Ngưỡng theo vai cao nhất có khoản đang áp: MGR = giá đêm cao nhất của lượt; FDL = `foc_limits.front_desk_lead.perTimeVnd`; chỉ FD = `foc_self_apply.front_desk.per_time`.
  - Σ vượt ngưỡng →
    - mỗi lần áp gửi một thông báo `foc_stay_total_exceeded` tới mọi OWN;
    - **một** mục "Cần chú ý" cho cả lượt (nguồn `event`, chỉ OWN, `warning`, `params.count`, `dueAt` = lúc mở + `stay_waiver_review_hours`);
    - bảng `foc_stay_alert` giữ trạng thái "đã mở mục" và đếm số lần vượt;
    - nhật ký `folio.foc_stay_alerted` (loại `state`, chỉ có số tiền).
  - Không chặn thao tác nào. Phần "OWN thu hồi khoản miễn" dời Sprint 2 (ARC 5.4).
- **R3-Q25:** yêu cầu `debt_write_off` bắt buộc người xin xác thực lại (S1); thiếu → 422 `secret` `REQUIRED`.
- **Migration 0079** (`foc_stay_alert` + RLS + quyền cột; kind thông báo; khóa tham số `stay_waiver_review_hours` = 24, chỉ OWN sửa, khoảng 1–168).
- **Gỡ `pendingFix`** ở 15 dòng fixture: thẻ `R3-SEC-BE-83` (BR-433-04/05, BR-525-21…27) và thẻ `R3-ESC-026` (BR-433-06…09, 13, 14).

### 8.2 Test
- `s438-r8/r3-be83-esc026.test.ts`: **14/14 đạt**.
  - Xóa nợ: BR-525-21 + 22 (12 × 450.000, 422 `max` 50.000, biên = cơ sở), BR-525-23 (a)(b), BR-525-24 (cơ sở theo folio), BR-525-25 (hai chu kỳ), BR-525-26 (`debt_cleared` không tính), BR-525-27 (đua ép thứ tự sau khóa folio, hai thứ tự, deadlock +0).
  - FOC theo khóa: BR-433-04, BR-433-05.
  - ESC-026: E26-1 (có cả E26-9), E26-2, E26-3, E26-4, E26-5.
  - R3-Q25.
- Hai test R2 trước đây chia nhỏ xóa nợ bằng MGR (`s4-recheck8-be-a` "auto-cancel", `r8debt-01` repostStay) – đúng kiểu BE-83 nay chặn. Các khoản từ thứ hai nay do OWN áp; điều test kiểm (FOC đăng lại chỉ tính một lần) không đổi.
- Toàn bộ API: 105 tệp đạt + 1 bỏ qua; 3.008 test đạt, 2 lỗi. Hai lỗi là đúng hai test R2 ở trên; sau khi sửa, chạy lại riêng hai tệp đó: 7/7 đạt.
- `validate-fixtures`: 0 lỗi.
- typecheck, eslint, prettier: đạt.

### 8.3 Giả định (ARC/SEC xác nhận khi review)
1. "Lượt ở" = folio của đơn gốc (đơn con dùng chung folio – BR-422). Dài hạn tính theo folio hiện tại, chưa gộp nhiều kỳ HĐ.
2. Σ khóa (b) dùng phần đang áp và đang xin trên khóa, không cộng yêu cầu đã duyệt mà còn "ngủ" (áp 0).
3. Folio không có đêm nào: ngưỡng MGR = 0 (luôn báo OWN), thiên về an toàn. Với (a), trường hợp này vẫn chuyển OWN như trước.
4. Nhật ký cảnh báo ghi loại `state` (`folio.foc_stay_alerted`). Tập `money` đóng theo hợp đồng nên thêm mã `money` mới phải qua ARC + UXD (câu `mlog`). US-007 AC7 ghi "nhật ký money" → **ARC quyết**.
5. Mục "Cần chú ý" chỉ mở ở lần vượt đầu; nếu OWN đã bấm "Đã xem", lần vượt sau chỉ gửi thông báo, không mở lại mục.
6. FD tự miễn 50.000 trong ca E26-3 (thay cho "LT trưởng miễn 50.000" của oracle), vì 50.000 nằm trong hạn mức tự miễn của FD trên khóa đó. Σ và kết quả không đổi.

### 8.4 Rủi ro / việc còn lại
- **Migration 0079 khi rebase:**
  - Đổi số nếu `main` đã có 0079.
  - CHECK `staff_notification_kind_check` phải là **hợp** các kind của mọi nhánh 0.3.8, vì BE-A cũng thêm `manager_confirmation_*` và `late_fee_post_review`. Nếu không, migration chạy sau sẽ xóa kind của nhánh kia.
- FE-B làm dòng "Cần chú ý" (US-007 AC7) với kind `foc_stay_total_exceeded`. Server đã có mục event; BE-D không cần cổng đọc riêng.
- Fuzz R3-Q30 (QA): đưa ca 1–4 của SEC B.5 vào.
- R3-Q39 #8–#12 phía server: chưa làm. Theo bảng 3.1, mục này là FE-A, kèm BE-A nếu có phần server, không phải BE-B.


## 9. Phản hồi & sửa bước 4 – BR-433 (d) v0.4.1, S1-09…12 (23/10)

Trả lời từng thẻ: `rounds/round-03/responses/s1-BE-B.md`, mục "Lượt 2". Nhánh đã rebase lên `main` 5834c6a.

- **FB-07 / S1-08 (Blocker) – cơ sở hạn mức được bảo vệ.**
  - Thêm 3 cột: `stay_night.reference_rate_vnd`, `folio_line.limit_ref_vnd` (kèm CHECK fail-closed), `folio.limit_basis_checkout_vnd` (chụp trong `settle`).
  - Một cổng duy nhất `FolioService.limitBasisVnd`; xóa hai hàm cũ.
  - Chỉ các đường giá của hệ thống ghi giá tham chiếu. Đêm có giá gõ tay giữ nguyên giá tham chiếu; A31 không ghi cột này.
- **S1-10:** thêm `FolioService.waiverLimitInput`. FOC tại folio và FOC phụ thu tại quầy đều dùng nó. Ở quầy, hàm được gọi **trước** khi ghi dòng chờ duyệt của chính yêu cầu đó (nếu gọi sau thì Σ tính dòng đó hai lần).
- **S1-11:** mục "Cần chú ý" còn mở thì cập nhật số đếm; mục đã "Đã xem" thì lần vượt sau mở mục mới.
- **S1-12:** FK từ `foc_stay_alert` tới đơn gốc.
- **S1-09:** migration đổi số **0080** (2FA giữ 0079). CHECK kind = danh sách trên `main` + 1 kind mới. Có test so tập kind (không DB) và test chèn thử từng kind (có DB).
- **Test mới:**
  - `s438-r8/r3-bb07-limit-basis.test.ts`: 9 ca – BB07-1…7, S1-11, các ràng buộc của 0080.
  - `test/money-limit-basis-architecture.test.ts`: 6 ca.
- **Toàn bộ API:** xem kết quả trả ORC.
- **Giả định:**
  - Giá gõ lúc **bán** đêm (tạo đơn, gia hạn) là giá thỏa thuận, nên được làm giá tham chiếu. Chỉ sửa giá của đêm đã bán (A31/A32) mới không đổi giá tham chiếu.
  - BB07-3/4 dùng 1.900.000 (trần A31 của seed) thay cho 3.000.000 của oracle.

## 10. R3-Q51 – tài khoản nhận VietQR, phía server (23/10)

Nhánh `be-b/r3-q51-receiving-account`, rebase lên `main` 8e0b08c. Đã gộp nhánh FE-A `fe-a/r3-q51-receiving-account` (0ca52a8).

### Đã làm
Theo OpenAPI 0.3.8 + SEC mục C (Q51-1…7):
- **Chỉ OWN.** `getParameterHistory` của khóa `payment_receiving_account` chỉ OWN gọi được; MGR/FDL → 403, có ghi `access.denied`. `listParameters` bỏ khóa này với vai khác OWN.
- **Hiệu lực từ ngày mai.** `setParameter` từ chối `effectiveFrom` ≤ ngày kinh doanh, kể cả lần đặt đầu → 422 `EFFECTIVE_FROM_TOMORROW`.
- **Xác nhận lại S2** qua `StrongReauthService`: mật khẩu ở `reauth.secret` + `totpCode` hoặc `recoveryCode`.
- **`cancelScheduledParameter` (mới)**: chỉ OWN + S2. Không có dòng → 404; dòng đang hiệu lực → 409. Ghi audit `money` `config.changed`, kèm `cancelledEffectiveFrom` và số đã che.
- **Che số** trên mọi đường đọc và audit: `•••• 1234` + `bankName` tra từ bảng NAPAS tĩnh trong mã. QR giữ dạng `9704••••1234` vì hợp đồng của QR không đổi.
- **Báo khi đặt và khi hủy:**
  - thông báo `receiving_account_changed` tới mọi OWN/MGR, mã hiển thị = ngày hiệu lực, không có số tài khoản;
  - outbox `staff.email` trong cùng giao dịch, payload `{template:'receiving_account_changed', userIds:[], owners:true, effectiveDate}` (Q51-6).
- **Migration 0084** (không đổi schema): `GRANT DELETE ON config_parameter TO ottimo_app`. Snapshot sinh lại trên 0083; `drizzle-kit generate` không sinh tệp.

### Đối chiếu màn FE-A với server
- Request khớp hợp đồng: `reauth` gửi `{authMethod, secret, totpCode?, recoveryCode?}`; ô báo lỗi của S2 là `reauth.secret` / `reauth.totpCode`.
- Mã lỗi khớp: 404 khi chưa cấu hình, 409 khi hủy dòng đang hiệu lực, 422 `EFFECTIVE_FROM_TOMORROW`.
- Ngày "hôm nay" phía FE lấy từ ngày kinh doanh (`useBusinessDay`).
- Kiểm tra ở FE chặt hơn server (tên chủ tài khoản không nhận `.`/`-`) – chấp nhận được.
- Không phải sửa mã FE.

### Test
- `r3-q51-receiving-account` 6/6.
- Toàn bộ API: 115 tệp đạt, 1 bỏ qua; 3.092 test đạt, 7 bỏ qua.
- admin-web: 53 tệp, 550 test đạt.
- typecheck toàn repo, eslint, prettier: đạt.

### Còn mở – cần ARC quyết
- Lần đặt đầu, khi mới chỉ có dòng đã lên lịch: server và MSW đều trả 404 cho `getParameterHistory`, vì hợp đồng bắt buộc có `current`. Hệ quả: màn hiện "chưa cấu hình" và OWN không thấy, cũng không hủy được dòng đã lên lịch cho tới ngày hiệu lực.
- Đề xuất: hợp đồng 0.3.9 cho `current` được vắng.
