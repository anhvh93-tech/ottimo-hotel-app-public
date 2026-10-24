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

## 11. Sửa lỗi tiền từ fuzz R3-Q30 – BUG-R3-002/003/004 (24/10)

Nhánh `be-b/r3-fuzz-bugs-002-004`, tách từ `origin/main` dabcb99 (đã có harness fuzz của QA).

### BUG-R3-002 (P0) – tiền dư phát sinh sau trả phòng
Trước: J15 đóng folio dù vẫn còn tiền dư của khách.

Sửa ở hai chỗ:
- **A32 trên folio `settled`.** Nếu sau thao tác còn tiền dư chưa có yêu cầu hoàn (`unhandledCreditVnd` > 0):
  - trong cùng giao dịch, tạo một yêu cầu hoàn `overpayment` đúng bằng phần chưa yêu cầu, người xin = MGR+ vừa thao tác (`FolioService.closeStayCredit`, như đường hủy/no-show S4-06);
  - mở "Cần chú ý" `closed_reservation_credit`.

  Căn cứ: BR-522 K11-06, "mọi thay đổi folio của đơn đã đóng chạy lại refundPlan".
- **Lưới an toàn ở J15 (`closeAfterWindow`).** Còn tiền dư chưa có yêu cầu hoàn (ví dụ khách trả thừa sau trả phòng) → không đóng folio, trả `waiting_refund`, mở "Cần chú ý" `closed_reservation_credit`. J15 không tự tạo yêu cầu hoàn vì yêu cầu phải có người xin là người thật (FK `requested_by`).

### BUG-R3-003 (P0) – xóa nợ bị chuyển cho lễ tân trưởng duyệt
Sửa: định tuyến `debt_write_off` không bao giờ thấp hơn MGR (BR-525):
- Σ ≤ cơ sở bảo vệ → manager;
- vượt cơ sở, hoặc không có cơ sở → owner.

Lễ tân trưởng bấm duyệt → 403.

### BUG-R3-004 (P1) – không còn đêm sống mà MGR vẫn tự áp xóa nợ
Sửa: `limitBasisVnd` trả `null` khi không còn đêm phòng sống. Số chụp lúc B18 chỉ dùng để **hạ** cơ sở đang có, không thay cho cơ sở đã mất. Theo BR-433 (a): không có đêm → chờ OWN.

### Test
- 3 ca tái hiện của QA (`test/fuzz/bug-r3-00{2,3,4}.test.ts`): bỏ cờ `FUZZ_KNOWN_BUGS`, nay luôn chạy, đều xanh.
- Test oracle mới `s438-r8/r3-bug-002-credit-after-checkout.test.ts`, 2 ca:
  - void dòng phòng → đúng một yêu cầu hoàn bằng đúng tiền dư, người xin là MGR, có "Cần chú ý", J15 chờ;
  - khách trả thừa không có yêu cầu hoàn → J15 không đóng, có "Cần chú ý".
- Toàn bộ API: 122 tệp đạt, 2 bỏ qua; 3.120 test đạt, 18 bỏ qua (gồm harness fuzz, chỉ chạy khi đặt `FUZZ`).
- Fuzz chạy lại trên bản sửa: `FUZZ=1 FUZZ_BE83=1 FUZZ_CHAINS=30 FUZZ_SHRINK=1`, 9 họ, 270 chuỗi, 10.359 bước, deadlock 0, 5xx 0.
  - I4, I8, I13, I16: **0 vi phạm**.
  - Còn 12 vi phạm I3/I7, đều ở họ **FZ-08** (seed 1012, 1026; đã thu gọn còn 3–6 bước). Xem phần dưới.

### Phát hiện mới từ fuzz (chưa sửa – cần ORC/DOM quyết)
- Họ FZ-08 là dữ liệu **công nợ ghi trước migration 0076** (chưa có chu kỳ).
- Chuỗi gây lỗi:
  - MGR xóa hết nợ cũ bằng FOC `debt_write_off`;
  - sau đó A32 void đúng dòng phòng mang khoản xóa nợ đó, nên FOC tự hủy;
  - mô hình tham chiếu cho rằng công nợ cũ 100.000 sống lại;
  - mã tính theo công thức nợ cũ (B − W_cũ) thì ra 0, và vì O = 0 nên A32 giảm sau đó không bị chặn (I7).
- Phạm vi: chỉ dữ liệu trước 0076. Staging dựng từ DB trống, production chưa có dữ liệu (điều kiện OPS C2), nên đề xuất **P3**. Cần DOM chốt có coi nợ cũ sống lại sau khi xóa nợ bị hủy hay không. Nếu có: tạo chu kỳ cho nợ cũ ngay lần xóa nợ đầu tiên.
- Log gốc nằm ngoài repo (thư mục scratchpad); có thể chạy lại tất định bằng seed.

## 12. Hợp đồng 0.3.8 bổ sung 3 + BR-433 (e) v0.4.3 (24/10)

Nhánh `be-b/r3-0.3.8-add3`, tách từ `main` cục bộ `ee88134`, đã fast-forward lên `0281e20` (DOM BR v0.4.3). Một PR, cần ARC + SEC review (mã tiền).

### (a) `createRefundRequest` trên folio `settled` (ARC 13.2 điểm 1)
- `RefundsService.create` nhận folio `open` hoặc `settled`, kể cả khi đã qua cửa sổ phát sinh mà J15 đang chờ (`waiting_refund`).
- Folio `closed` → 409 `FOLIO_LOCKED`.
- Vai, trần `unhandledCreditVnd` (422 + `max`) và luật người duyệt giữ như cũ.

### (b) Quy tắc K11-06 dùng chung (ARC 13.2 điểm 2, FUZZ-01 + FUZZ-02)
- Hàm duy nhất `FolioService.afterSettledMoneyChange(tx, folioId, actor, a32?)`. Ba đường **có người bấm** gọi hàm này, cùng giao dịch, dưới L1 → L3:
  - `adjustFolioLine` (A32);
  - `recordPayment`: mọi khoản thu trên đơn đã trả phòng, không chỉ khoản thu nợ;
  - `confirmPaymentReceived`.
- Hàm chỉ chạy khi folio `settled`, và khi có một trong hai điều kiện:
  - `unhandledCreditVnd` > 0;
  - `openRefundVnd` > `rawCreditVnd`.

  Khi đó chạy `closeStayCredit`: `refundPlan` hủy các yêu cầu chờ với lý do `superseded`, tạo **một** yêu cầu `overpayment` bằng phần chưa yêu cầu (người xin = người bấm), và mở "Cần chú ý" `closed_reservation_credit`.
- Đường **không** có người bấm không gọi hàm này: J15 giữ `waiting_refund` và mở "Cần chú ý"; lễ tân tạo yêu cầu bằng điểm (a).
- Lý do hủy `superseded` truyền qua tham số mới `cancelReason` của `closeStayCredit`.

### FUZZ-03 – một hằng `debt_write_off`
- `DEBT_WRITE_OFF` khai một lần, export ở `approvals/public/approval.service.ts`. Folio (`foc.service.ts`) import hằng này; hằng riêng của folio đã bỏ.
- JSDoc "Reason codes of BR-432" đã về đúng chỗ, trên `FOC_REASON_CODES`.
- `reporting/internal/attention-sources.ts` vẫn còn `DEBT_WRITE_OFF_REASON` riêng. Module này không thuộc BE-B, nên chưa sửa; đề xuất chủ module đổi sang import hằng chung.

### SEC FZ-01 – kiểm vai ở bước quyết định
- Hàm `decisionFloor` dùng cho cả `approve` và `reject`: với `debt_write_off`, vai tối thiểu là `manager`, bất kể `required_role` đã lưu.
- Dòng cũ có `required_role = front_desk_lead`: lễ tân trưởng bấm duyệt hoặc từ chối → 403 `APPROVAL_LIMIT_EXCEEDED`, không ghi gì.

### BR-433 (e) v0.4.3 – A32 giảm sau trả phòng là một lần miễn (SEC FZ-02, oracle FZ02-1…8, I17)
**Migration 0085** `settled_reduction_a32_refund`. Số kế tiếp sau 0084 trên `main` cục bộ; ORC xác nhận khi gộp. Journal `when` sau 0084, snapshot `prevId` = 0084.
- Bảng `folio_settled_reduction`: mỗi lần A32 giảm trên folio `settled` ghi một dòng (phần giảm, người làm, vai lúc làm).
  - Chỉ thêm, không sửa (app chỉ có SELECT, INSERT).
  - Có RLS `tenant_isolation`.
- Cột `approval_request.origin_actor_id`: người làm A32 sinh ra yêu cầu hoàn.
  - CHECK `approval_request_origin_check`: chỉ dùng cho `refund`, và người duyệt khác người làm A32.

**(1) Tính vào Σ lượt ESC-026.**
- `StayWaiverAlertService.afterSettledReduction`, dùng chung phần đánh giá với `afterApplied`.
- Σ = FOC đang áp + phần giảm sau trả phòng của vai dưới OWN.
- Ngưỡng theo vai cao nhất có trong Σ. Thông báo, "Cần chú ý" và audit giữ như (c).

**Phần giảm tính vào Σ** = max(0, min(dòng trước, số lúc khách rời) − dòng sau).
- "Số lúc khách rời": lần theo chuỗi A32 (`related_line_id`, cùng loại dòng) về dòng ghi trước trả phòng, hoặc về dòng đầu của khoản phát sinh trong cửa sổ.
- Đêm phòng không bao giờ vượt `limit_ref_vnd`.
- Vì vậy tăng tay rồi hạ lại **không** tính (giữ đúng BB07-1 / I16).

**(2) Yêu cầu hoàn tự sinh** (khi người làm A32 không phải OWN).
- Số tiền = min(tiền dư chưa yêu cầu, phần giảm). Tiền dư mà OWN đã từ chối hoàn không bị A32 sau xin lại (FZ02-8).
- Định tuyến theo Σ hoàn từ A32 của folio (đã duyệt + chờ + mới, bỏ yêu cầu bị từ chối hoặc hủy), so với cơ sở (d) `limitBasisVnd`:
  - vượt cơ sở, hoặc cơ sở null → `owner`, qua `SubmitInput.minRequiredRole`;
  - còn lại → `manager`.
- Người làm A32 duyệt → 403 `SELF_APPROVAL_FORBIDDEN`.

**(3) `reason_note`** = "Tự sinh từ A32: <void/giảm> dòng <loại> <dd/mm> <số> – <tên người làm> – lý do: <lý do A32>", tối đa 500 ký tự (cắt phần lý do).
- Yêu cầu thay thế (`superseded`) giữ `origin_actor_id`, ghi chú và cách định tuyến của yêu cầu A32 mà nó thay. Áp dụng ở cả `closeStayCredit` và `refundsDownToCredit`.
- OWN tự làm A32 thì không tính, và yêu cầu hoàn đi theo đường BR-522 cũ (FZ02-6).

### Test
- `s438-r8/r3-add3-settled-credit.test.ts` (6 ca):
  - QR về muộn, người bấm xác nhận → yêu cầu đúng số;
  - `recordPayment` thừa → yêu cầu do FD xin;
  - khoản không có người bấm → J15 `waiting_refund` + "Cần chú ý" → FD tạo yêu cầu trên folio `settled` (vượt → 422 `max`) → MGR duyệt → lễ tân trưởng chi tiền mặt → J15 đóng;
  - folio `closed` → 409;
  - FUZZ-02: hủy `superseded` rồi tạo lại 60.000, giữ nguồn A32;
  - SEC FZ-01.
- `s438-r8/r3-br433e-a32-waiver.test.ts` (8 ca):
  - FZ02-1, 2, 4, 6, 7, 8;
  - FZ02-3 làm trên dòng F&B 1.500.000 > cơ sở, vì đơn hai đêm không void được hai đêm trong một lần A32;
  - BB07-1/I16: tăng rồi hạ lại không tính.
  - FZ02-5 (FOC lúc ở + giảm sau trả phòng) cùng đường cộng Σ với FZ02-2; để QA đưa vào fuzz.
- `r3-bug-002-credit-after-checkout`, ca 2: `recordPayment` thừa nay tự sinh yêu cầu. Ca kiểm lưới an toàn J15 nay rút yêu cầu trước.
- Toàn bộ API: 124 tệp đạt, 2 bỏ qua; 3.134 test đạt, 18 bỏ qua. typecheck, eslint, prettier đạt; `drizzle-kit generate` không sinh tệp.
- Fuzz `FUZZ=1 FUZZ_BE83=1 FUZZ_CHAINS=30 FUZZ_SHRINK=1`: 270 chuỗi, 10.359 bước, deadlock 0, 5xx 0.
  - I4, I8, I13, I16: 0 vi phạm.
  - Còn 12 vi phạm I3/I7, chỉ ở họ FZ-08 (seed 1012, 1026) – nợ trước 0076, P3, để v1.1.

### Việc cho vai khác
- **ARC**:
  - cập nhật `erd.md` cho bảng `folio_settled_reduction` và cột `approval_request.origin_actor_id`;
  - xác nhận số migration 0085.
- **QA**:
  - đưa vào fuzz: thao tác "QR về muộn dư", "khoản tự động dư", FZ02-5 và bất biến I17;
  - thêm fixture BR-433-16…19 (bỏ `pendingFix R3-SEC-FZ-02`).
- **FE-A**:
  - nút "Tạo yêu cầu hoàn" trên folio `settled`;
  - hiện `reasonNote` "Tự sinh từ A32" cho người duyệt.

## 13. Sửa Blocker ADD3-01 (ARC + SEC, ORC duyệt 24/10)

Nhánh `be-b/r3-0.3.8-add3`, rebase lên `main` cục bộ `784db59`. Migration `0085` sửa thẳng, không tạo 0086 (ARC).

### Lỗ đã bịt
Trước đây, tiền dư do A32 sinh ra xin lại được theo đường khác: lập tay `createRefundRequest`, hoặc qua khoản thu dư. Yêu cầu khi đó đi đường BR-522 thường, nên chính người làm A32 duyệt được, hoặc một MGR khác duyệt thay OWN.

### Cách sửa
**Một hàm định tuyến** `FolioService.refundRouting`.
- `ApprovalService.submit` gọi hàm này qua `provideRefundRouting` cho **mọi** yêu cầu `refund`, bất kể đường nào: lập tay, khoản thu, hủy hoặc no-show, A32, bản thay thế `superseded`.
- Nhờ vậy không đường xin hoàn nào, kể cả đường thêm sau này, đi vòng qua được quy tắc.

**Folio có A32 giảm của người dưới OWN** (có dòng trong `folio_settled_reduction`):
- nguồn `a32` (yêu cầu do A32 tự sinh): như cũ, Σ hoàn A32 so với cơ sở (d); vượt hoặc cơ sở null → `owner`, còn lại → `manager`. FZ02-1…9 giữ đúng số;
- nguồn `other` (mọi đường khác) → `owner`;
- folio không có A32: không đổi gì. QR về muộn dư thông thường vẫn `manager`.

**Người không được duyệt:**
- cột `approval_request.origin_actor_ids uuid[]` = mọi người đã làm A32 giảm trên folio, cộng người làm A32 của chính yêu cầu;
- gán cho mọi yêu cầu hoàn của folio đó, kể cả nguồn `other`;
- `assertNotSelf` trả 403 `SELF_APPROVAL_FORBIDDEN`;
- CHECK `approver_id` không thuộc mảng, và CHECK mảng chỉ dùng cho `refund`.

**Cột `refund_source`** (`a32` | `other`, chỉ cho `refund`):
- yêu cầu thay thế `superseded` chép nguồn, ghi chú và mảng của yêu cầu nó thay (`carriedOrigin`), ở cả `closeStayCredit` và `refundsDownToCredit`;
- bản thay thế của yêu cầu `a32` giữ luôn **người xin = người làm A32** (đúng I17), không lấy người vừa thao tác. Đây là cùng yêu cầu A32 đó, chỉ ghi lại với số đúng;
- Σ hoàn A32 đếm theo `refund_source = 'a32'`.

**Kiểm lại lúc duyệt:** `approve` hỏi `FolioService.isA32Maker`, tức người duyệt đã làm A32 giảm trên folio chưa, kể cả lần làm **sau** khi yêu cầu đã lập. Có → 403. Lỗ còn lại (MGR2 làm A32 sau rồi duyệt yêu cầu của MGR1) vì thế đã đóng.

**Người làm A32 không tự hủy được** yêu cầu A32 tự sinh: 403 `FORBIDDEN_ACTION`. Yêu cầu chỉ ra khỏi hàng đợi bằng quyết định của người khác, hoặc bằng `refundPlan` của server.

**SEC ADD3-03:** `origin_actor_ids` và `refund_source` chỉ ghi lúc INSERT.
- `ottimo_app` vốn chỉ có quyền UPDATE theo cột (0042), không gồm hai cột này.
- Thêm trigger `approval_request_refund_origin_immutable`, chặn đổi giá trị kể cả khi chạy bằng role chủ.

**Lỗi phát hiện khi chạy fuzz bản cuối của QA** (thao tác `qrLate`, FZ-02 seed 1013, I3; tái hiện được cả trên `main` `784db59`):
- Lỗi: `confirmPaymentReceived` trên đơn đã trả phòng còn công nợ không đóng chu kỳ nợ như `recordPayment`.
- Sửa: sau trả phòng thì khóa `lockStay`, đọc `openDebt`, rồi gọi `debtSettled` khi còn phải thu ≤ 0 và `tryEarn`. Seed 1013 hết I3.
- Có test riêng: QR về muộn trả hết nợ 300.000 + dư 50.000 → nợ đóng, có yêu cầu hoàn 50.000.

**Audit:** mọi A32 giảm trên folio `settled` nay đều ghi `folio_line.adjusted`, kèm `after.reducedVnd` (phần giảm thực) và `before.actorRole` (vai lúc làm). Trước đây chỉ nhánh có nợ mới ghi hai trường này.

**SEC ADD3-02:** yêu cầu sinh từ khoản thu có `reason_note` "Tự sinh từ khoản thu <mã> <phương thức>". Việc tiền mặt phải đối soát xong mới được duyệt thì chờ DOM chọn, chưa làm.

### Test
`r3-add3-settled-credit` (13 ca):
- probe 1 của ARC: OWN từ chối → FD lập tay → `owner`; MGR làm A32 duyệt → 403; MGR khác → 403; OWN → 200;
- probe 2 của ARC + SEC P1: người làm A32 hủy → 403; MGR khác từ chối → FD lập tay → `owner`; người làm A32 duyệt → 403;
- SEC P2: void hai đêm, OWN từ chối yêu cầu thứ hai → FD lập tay → `owner`; MGR khác → 403;
- `recordPayment` dư trên folio có A32 → `owner`, có ghi chú khoản thu;
- folio không A32 → `manager`;
- hai cột không UPDATE được;
- MGR2 làm A32 sau khi yêu cầu của MGR1 đã lập → MGR2 duyệt → 403;
- QR về muộn trên đơn còn nợ → nợ đóng.

`r3-br433e-a32-waiver` (11 ca): FZ02-1…8 như trước, cộng FZ02-9 (a)(b)(c) theo oracle DOM mới.

Kết quả chạy:
- Toàn bộ API: 124 tệp đạt, 2 bỏ qua; 3.144 test đạt, 19 bỏ qua.
- tsc, eslint, prettier đạt; `drizzle-kit generate` không sinh tệp.

### Fuzz bản cuối của QA (`FUZZ=1 FUZZ_BE83=1 FUZZ_FZ02=1 FUZZ_K1106=1 FUZZ_CHAINS=30 FUZZ_SHRINK=1`, lệnh đủ theo test plan 3.x)
**Chạy dở:** OrbStack (Docker) treo lúc 04:28 ở họ FZ-07.
- Đã chạy xong: FZ-01, FZ-02, FZ-06 (cả hai tổ chức), 30 chuỗi mỗi họ; FZ-07 được 8 chuỗi. Tổng 5.102 bước.
- FZ-07 phần còn lại, FZ-08, FZ-09, FZ-10, FZ-11, FZ-12: **chưa chạy**.
- Không khởi động lại OrbStack, vì máy đang chạy container của các vai khác. Cần ORC cho chạy lại.

Để so sánh: lượt trước trên `943e7f2`, chạy harness cũ (trước khi QA gộp `d5d963b`), được 270 chuỗi ở 9 họ, deadlock 0, 5xx 0.

**Vi phạm đếm được, theo nguyên nhân:**
1. **I4, 30 vi phạm (FZ-01): harness lệch quy tắc đã chốt.**
   - Theo quy tắc min (FZ02-8, ARC và DOM đồng ý), A32 của MGR chỉ xin phần của lần giảm đó. Tiền dư có trước (từ khoản không người bấm, hoặc phần OWN đã từ chối) vẫn để J15 chờ + "Cần chú ý".
   - Harness lại đòi tiền dư chưa yêu cầu = 0 sau **mọi** thao tác có người bấm, kể cả thao tác bị 4xx.
   - Đề xuất QA: với bước A32, chỉ kiểm "tiền dư chưa yêu cầu sau ≤ trước"; bỏ qua bước trả 4xx.
2. **I17, 201 vi phạm (FZ-01 159, FZ-02 42): harness ghép sai cặp.**
   - Harness ghép mỗi yêu cầu "Tự sinh từ A32" với lần A32 **gần nhất trước nó**.
   - Bản thay thế (`superseded`) gộp nhiều yêu cầu cũ. Mã giữ người xin = người làm A32 của yêu cầu cũ nhất, và luôn có trong `origin_actor_ids`.
   - Đề xuất QA: kiểm `requested_by ∈ origin_actor_ids` và `refund_source = 'a32'`.
3. **I13, 56 vi phạm (FZ-01 1006; FZ-02 1007, 1026; FZ-06 1006, 1021): harness đếm theo cách cũ.**
   - Harness lấy `after.reducedVnd` trong audit (phần giảm thực) làm Σ lượt ESC-026.
   - DOM đã chốt FZ02-9 (b) ngày 24/10: chỉ tính phần xuống dưới số lúc khách rời. Ví dụ tăng 750.000 → 1.500.000 rồi hạ về 700.000: Σ = 50.000, không phải 800.000.
   - Đề xuất QA: đọc `folio_settled_reduction.reduced_vnd`.
4. **I5 (FZ-01 1023, 7 vi phạm) và I3 (FZ-02 1013, 1 + 4 `I3?`): lỗi có sẵn.**
   - Cả hai tái hiện được trên `main` `784db59` (mã trước PR này) với harness này: chạy seed bằng bản trích từ `784db59`, DB riêng.
   - Cả hai nằm trong chuỗi có đua "QR về muộn ‖ đảo khoản thu".
   - Bản sửa `confirmPaymentReceived` ở trên đã làm seed 1013 xanh trong một lần chạy riêng. Lần chạy đủ lại đỏ; nhiều khả năng do thứ tự đua thật khác nhau giữa các lần.
   - Cần ARC/QA phân loại: thêm ca đó vào `I3?`/`I5?`, hay lỗi khóa giữa xác nhận QR và đảo khoản thu.
5. **Ba ca có hướng FZ02 của QA đỏ vì test cũ:**
   - FZ02-1/2 và FZ02-8 duyệt/từ chối yêu cầu hoàn không gửi `expectedVersion`, nên nhận 422 (B-6) thay vì 403/200;
   - FZ02-4 vẫn đòi mọi yêu cầu là `owner`, trong khi DOM 24/10 đã sửa: đơn 2 đêm thì yêu cầu đầu `manager`, yêu cầu sau `owner`.
   - Test tích hợp của BE-B phủ đúng các ca này và xanh.

Không có vi phạm I1, I2, I7, I8, I11, I16, không deadlock, không 5xx trong các họ đã chạy.

### Còn mở
- FE-A: hiện câu "Sẽ chờ chủ cơ sở duyệt" khi yêu cầu lập tay chuyển `owner` (SEC 5, ARC ADD3-02).
- QA: fuzz thêm thao tác "người xin hủy yêu cầu hoàn" và "lập yêu cầu tay sau A32", kèm bất biến I18.

## 14. Sửa BUG-R3-012 (P0) và BUG-R3-013 (P1) – fuzz G1 cuối (24/10)

Nhánh `be-b/r3-bug-012-013`, tách từ `origin/main` `593ce95`. Không cần migration: lý do `superseded` đã có trong CHECK `auto_cancel_reason`.

### BUG-R3-013 (gốc) – yêu cầu hoàn đang mở phải theo tiền dư
Mọi thay đổi làm **giảm** tiền dư của folio `settled` nay chạy lại `refundPlan` (BR-522 K11-06):
- yêu cầu đang chờ lớn hơn tiền dư → hủy `superseded`, xin lại đúng số. Yêu cầu A32 giữ nguyên nguồn, ghi chú, người xin và mảng `origin_actor_ids`;
- **không còn tiền dư**:
  - yêu cầu **đã duyệt** mà chưa chi (hoặc chi dở) được đóng: `cancelled`, `superseded`;
  - có audit; người xin và người được hỏi duyệt được báo;
  - hook của payments chạy (xóa tài khoản nhận – SEC-BE-45);
- vẫn còn tiền dư thì yêu cầu đã duyệt giữ nguyên; lúc chi vẫn kẹp ở `min(còn lại, tiền dư)`.

Các đường đã gắn:
- `afterSettledMoneyChange` chạy lập lại kế hoạch **trước** mọi việc khác, nên cả A32 giảm khi yêu cầu đang vượt cũng được xử lý;
- ghi phát sinh sau trả phòng (`addFolioLine`, gồm `late`) gọi `afterSettledMoneyChange`;
- duyệt giá hư hỏng (`damage_pricing`) trên folio `settled` gọi hàm mới `replanSettledRefunds`;
- J15 tự lập lại kế hoạch khi không có người bấm. Bản thay thế lấy người xin của yêu cầu cũ nhất mà nó thay.

`ApprovalService.cancelApproved` nhận thêm lý do `superseded` (chỉ dùng cho refund) và chạy hook quyết định của refund.

### BUG-R3-012 – J15
- `closeAfterWindow` chỉ trả `waiting_refund` khi **còn tiền phải trả lại khách** (tiền dư > 0 và còn yêu cầu mở).
- Yêu cầu vượt tiền dư được lập lại trước. Khi tiền dư = 0, các yêu cầu đều đã đóng, nên J15 ghi công nợ `post_checkout_unpaid` qua đường `debtOnCheckout` sẵn có rồi đóng folio.
- Đóng folio thì giải "Cần chú ý" `closed_reservation_credit`.

### Test
- `fuzz/bug-r3-012.test.ts` (ca tái hiện của QA): bỏ cờ `FUZZ_KNOWN_BUGS`, nay luôn chạy, đạt.
- `s438-r8/r3-bug-012-013.test.ts` (5 ca):
  - ca của QA: yêu cầu đã duyệt 300.000, ghi phát sinh 500.000 → yêu cầu đóng ngay; J15 → `closed`, nợ 200.000, "Cần chú ý" giải;
  - J15 tự xử lý: phát sinh ghi thẳng vào bảng, không qua hook → J15 đóng yêu cầu, ghi nợ, đóng folio, `waitingRefund` = 0;
  - còn tiền dư 200.000 → yêu cầu đã duyệt giữ nguyên, J15 vẫn chờ;
  - yêu cầu chờ 300.000, phát sinh 100.000 → hủy `superseded`, xin lại 200.000 (giữ nguồn A32, người xin, ghi chú);
  - phát sinh vượt tiền dư → hủy, không xin lại; J15 ghi nợ 50.000.
- Toàn bộ API: 128 tệp đạt, 2 bỏ qua; 3.227 test đạt, 21 bỏ qua. tsc, eslint, prettier đạt. Không có migration.
- Fuzz `FUZZ=1 FUZZ_BE83=1 FUZZ_FZ02=1 FUZZ_K1106=1 FUZZ_ADD3=1 FUZZ_CHAINS=30` (harness `593ce95`): 9 họ, 270 chuỗi, 10.359 bước, deadlock 0, 5xx 0.
  - Mọi ca có hướng đạt: FZ02, ADD3/I18, SEC.
  - Không còn J15 `waiting_refund` khi tiền dư = 0, không còn yêu cầu mở vượt tiền dư.
  - Còn 2 vi phạm cứng I7, đều không do bản sửa này:
    - FZ-08 seed 1026: nợ trước 0076, P3, không tính G1 (ARC);
    - FZ-02 seed 1006 bước 29: nối tiếp `I3?`/`I5?` của bước đua "QR về muộn ‖ đảo khoản thu" ở bước 27, khi harness đoán thứ tự đua (critic: loại (b)). Chạy seed này trên `origin/main` `593ce95` (trước bản sửa) ra đúng vi phạm I7 đó.

## 15. Sau BUG-R3-012/013 – lớp chặn ở bước duyệt (ARC BUG012-01), SEC FB-1213-01/02 (24/10)

Nhánh `be-b/r3-bug012-followups`, tách từ `origin/main` `27c5dcc` (đã có hợp đồng 0.3.8 bổ sung 6). Không có migration, không đổi hình dạng API.

### ARC BUG012-01 – hợp đồng 13.3 điểm 5
- `ApprovalService.approve` với `type = refund`, đang giữ khóa folio (preLock của refund), hỏi `FolioService.refundAboveFreeCredit`. Hàm này đăng ký qua `provideRefundRouting`, tham số thứ 3.
- **Tiền dư còn trống** = `rawCreditVnd` − phần còn phải chi của các yêu cầu hoàn **đã duyệt khác** của lượt ở.
- Phần còn lại của yêu cầu lớn hơn tiền dư còn trống:
  - chạy `refundPlan` (`refundsDownToCredit`, không có người bấm): yêu cầu thành `cancelled` `superseded`, xin lại đúng số nếu còn dư, bản thay giữ nguồn, người xin và cấp duyệt;
  - phần này được **commit**;
  - API trả 409 `INVALID_TRANSITION`, `currentState = cancelled`, `autoCancelReason = superseded`, không duyệt gì. Dùng cùng mẫu `fail` sau commit như A4.

### SEC FB-1213-01 – bản thay không hạ cấp duyệt
- `carriedOrigin` lấy cấp cao nhất (`owner` > `manager`) của các yêu cầu bị thay, rồi truyền vào `submit` dưới dạng `minRequiredRole`.
- Định tuyến BR-433 (e) và ADD3-01 vẫn chạy và chỉ có thể nâng cấp, không hạ.

### SEC FB-1213-02 – OWN thao tác thì giữ người xin cũ
- `replacementActor`:
  - yêu cầu `a32` → người làm A32 (I17);
  - OWN thao tác, hoặc không có người bấm (J15) → người xin của yêu cầu cũ nhất bị thay;
  - còn lại → người đang thao tác.
- Nhờ vậy OWN vẫn duyệt được bản thay, không bị kẹt ở luật F8 với cơ sở chỉ có một OWN.

### Test
`s438-r8/r3-bug012-followups.test.ts` (4 ca):
1. Yêu cầu chờ 300.000, tiền dư giảm còn 100.000 qua đường không gắn hook (ghi thẳng bảng) → duyệt → 409 `superseded`, có yêu cầu thay 100.000 (nguồn A32, người xin cũ); duyệt bản thay → 200.
2. Đã duyệt 300.000, yêu cầu thứ hai 50.000, tiền dư còn trống 20.000 → 409; bản thay 20.000; yêu cầu đã duyệt giữ nguyên.
3. Yêu cầu A32 cấp `owner` bị thay bằng số mà quản lý đủ quyền duyệt → bản thay vẫn `owner`.
4. OWN ghi phát sinh làm thay yêu cầu do lễ tân lập → bản thay có người xin là lễ tân, cấp `owner`, OWN duyệt được (200).

Kết quả chạy:
- Toàn bộ API: 129 tệp đạt, 2 bỏ qua; 3.231 test đạt, 21 bỏ qua.
- tsc, eslint, prettier đạt. `r3-bug-012-013.test.ts` chỉ định dạng lại.

## 16. BUG-R3-014 (P1) – chi hoàn không lập lại kế hoạch hoàn (critic rerun M-2, 24/10)

Nhánh `be-b/r3-bug-014`, tách từ `origin/main` `ae93e48`. Không có migration, không đổi hình dạng API.

### Sửa
- `RefundsService.payOut` (dùng cho cả `executeCashRefund` và `executeRefund`): ghi phiếu hoàn xong, trong cùng giao dịch và dưới khóa folio mà lần chi đang giữ, gọi `FolioService.replanRefundsAfterPayout`.
- Hàm này chạy `refundsDownToCredit` trên folio đang mở hoặc `settled` (folio `closed` không chi được), không có người bấm, theo hợp đồng 13.3 điểm 1 + 3:
  - yêu cầu chờ vượt tiền dư → `superseded`, xin lại đúng số. Bản thay giữ người xin, nguồn và cấp duyệt (FB-1213-01/02);
  - **hết tiền dư** → mọi yêu cầu **đã duyệt còn tiền** đóng `cancelled` `superseded`, kể cả chính yêu cầu vừa chi dở; có audit, báo người xin/người duyệt, hook xóa tài khoản nhận (SEC-BE-45);
  - còn tiền dư → yêu cầu đã duyệt giữ nguyên, lần chi sau vẫn kẹp `min(còn lại, tiền dư)`.
- Hệ quả: tiền khách trả thêm sau khi tiền dư đã về 0 luôn sinh yêu cầu mới, đi qua định tuyến ADD3-01 (folio có A32 → `owner`). Lần duyệt cũ không còn "hút" được tiền mới.

### ARC quyết (hợp đồng 0.3.8 bổ sung 7, `s1-contracts.md` 13.4) – đã làm
- **BUG014-01 – bất biến K11-06**, thay cho quy tắc "chỉ đóng yêu cầu đã duyệt khi hết tiền dư":
  - Trong `refundsDownToCredit`, sau mọi thay đổi tiền, giữ Σ (yêu cầu chờ + phần còn phải chi của yêu cầu đã duyệt) ≤ `rawCreditVnd`.
  - Vượt thì:
    - hủy `superseded` mọi yêu cầu chờ (`refundPlan`);
    - đóng `superseded` các yêu cầu **đã duyệt** đang vượt, **mới nhất trước**, cho tới khi phần giữ lại nằm gọn trong tiền dư;
    - xin lại đúng phần còn lại.
  - Bản thay lấy nguồn, ghi chú, `origin_actor_ids`, người xin và cấp duyệt cao nhất từ **mọi** yêu cầu bị đóng, cả yêu cầu đã duyệt (FB-1213-01/02).
  - Mọi đường đã gắn quy tắc dùng chung một hàm, nên bất biến áp cho cả chi hoàn, phát sinh, A32, khoản thu, đảo, J15 và lớp chặn ở bước duyệt.
- **BUG014-02:**
  - Người có dòng `folio_settled_reduction` (vai dưới OWN) trên folio gọi `executeCashRefund`, `executeRefund` hoặc `setRefundDestination` cho yêu cầu hoàn của folio đó → 403 `SELF_REFUND_FORBIDDEN`.
  - Kiểm dưới khóa folio, cùng chỗ với "người chi ≠ người tạo". OWN (vai hiện tại) không bị chặn.

### Test
- `fuzz/bug-r3-014.test.ts` (ca tái hiện của QA): bỏ cờ `FUZZ_KNOWN_BUGS`, nay luôn chạy.
- `fuzz/bug-r3-014.test.ts`: các bước được BE-B viết lại theo oracle 13.4 (QA xác nhận).
  - Lần phát sinh 100.000 làm yêu cầu đã duyệt 300.000 thành `superseded` và xin lại 200.000.
  - Duyệt rồi chi 200.000 → không còn gì mở.
  - QR mới 500.000 → yêu cầu 500.000.
- `s438-r8/r3-bug-014-payout-replan.test.ts` (4 ca):
  1. ca test 1 của ARC: duyệt 300.000 khi tiền dư 300.000 → phát sinh 200.000 → yêu cầu đã duyệt `superseded` + xin lại 100.000 (giữ nguồn, người xin, cấp) → MGR A32 giảm 150.000 → yêu cầu `a32` 150.000 riêng → chi theo lần duyệt cũ → 409;
  2. chi 100.000 → phần còn 200.000 = tiền dư, giữ nguyên; chi 250.000 → 422 `max` 200.000; chi nốt → không còn gì mở;
  3. tiền mới sau khi tiền dư về 0 → yêu cầu riêng `owner`;
  4. BUG014-02: người làm A32 đặt nơi nhận → 403, chi → 403; lễ tân đặt nơi nhận, OWN chi → 201.
- `r3-bug-012-013`: ca "J15 vẫn chờ" sửa theo 13.4 (yêu cầu đã duyệt vượt tiền dư → `superseded` + xin lại 200.000 cùng cấp).
- **Đã chạy sau khi OrbStack khởi động lại** (Postgres riêng, migrate từ đầu):
  - test oracle `r3-bug-014-payout-replan` 4/4, ca tái hiện `fuzz/bug-r3-014` 1/1, `r3-bug-012-013` 5/5 – đạt;
    - sửa trong test BUG014-02: lệnh đặt nơi nhận của MGR chạy trên thiết bị desk tin cậy, vì nếu không, kiểm thiết bị trả `DEVICE_NOT_TRUSTED` trước kiểm người làm A32;
  - toàn bộ API (`--maxWorkers=3`, máy đang tải cao): 3.233 đạt, 24 bỏ qua, 3 đỏ;
    - `close-stay-dom-s4` (1 ca) chạy lại riêng: đạt;
    - `upload-gate-socket` (2 ca): đỏ do quá giờ ở phép thử socket/khe upload, không liên quan mã tiền. Lúc 16:10 tệp này chạy lại riêng thì đạt, lúc 16:35 chạy riêng lại đỏ khi máy tải cao;
  - hai lần chạy cả bộ với số worker mặc định có 30–34 ca đỏ, gần hết là quá giờ 30 giây, 401 phiên hết hạn hoặc ngày giả lệch vì test chạy chậm (load average 4–10). Mọi tệp đỏ ở lần 1 khi chạy lại đều đạt, trừ `upload-gate-socket`.

