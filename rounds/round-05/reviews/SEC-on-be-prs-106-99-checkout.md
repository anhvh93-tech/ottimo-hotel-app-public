# SEC – Review PR #106 (BE-A1, PR-A1a) và PR #99 (BE-A2, PR-A1b) – trả phòng

Round 5 · bước **Review** · SEC · 07/11/2026

Đối tượng:
- **PR #106**, nhánh `r5-a1a`, HEAD **`897656de`** (gốc `ab1fc4ae`), ready. 4 commit, 17 tệp. V5-10: một `checkoutAt` cho tóm tắt, VietQR `check_out` và B18 (BE C0313-01, 07, 08, 09). CI của HEAD xanh (run 42257678219).
- **PR #99**, nhánh `r5-a1b`, HEAD **`ba99bdb8`**, DRAFT chờ E2E. V5-15: trả phòng đơn quá ngày đi. Nhánh đã gộp `r5-a1a` @ `897656de` và `main` @ `cf3b8cb0`. Từ `ab1fc4ae` tới `cf3b8cb0`, `main` không đổi tệp nào trong `services/api/src`. Vì vậy phần riêng của #99 đúng bằng `git diff 897656de..ba99bdb8 -- product/services/api/src`. CI của HEAD xanh (run 42257839906).
- `git merge-tree` với `main` @ `a42df3ed`: cả hai PR gộp sạch, không xung đột.
- Tệp SEC đọc kỹ:
  - #106: `shared/business-day.ts`, `frontdesk/internal/checkout-at.ts`, `checkout.service.ts` (`resolveCheckoutAt`, `assertNotAfterNow`, `amountDueForQr`, `amountDueNow`, `decide`, `summary`), `reservations/audit-entities.ts`, `allowed-actions.ts`, `reporting/internal/stay-actions.ts`.
  - #99: bốn chỗ BE-A2 chỉ (`audit/public/use-case-denial.ts`, `frontdesk.controller.ts` `checkOut`/`checkOutRun`, `payments.controller.ts` `createVietQr`, `audit-log.controller.ts` `overdueOnly`), cùng `reservations/public/overdue-checkout.ts`, `checkout.service.ts` (`overdueGate`, `readInput`, `decide`, ghi `actual_checkout_at`), `frontdesk/audit-entities.ts`, `minibar-checkout.port.ts`.
- Mã có sẵn SEC đối chiếu (không đổi trong hai PR): `payments.service.ts` (`createVietQr`, `amountDueNow`, `confirmReceived`), `unit-of-work.ts` (`runInner`, `completedReplay`), `reservations/internal/inputs.ts` (`Fields.text`), `shared/validation.ts`, `shared/sensitive-number.ts`, `identity/public/password-reauth.ts`, `registration.service.ts` (`onCheckedOut`, `scheduleAfterStay`), `audit/public/audit-fields.ts`, `shared/problem.ts` (log lỗi 500), `generated/openapi-meta.ts`.
- Đối chiếu: `contract-0.3.13.md` 1.1, 1.4, 1.16 (H-01…H-04, H-09), 1.18, 1.19; `openapi.yaml` `checkOut` (dòng 4143–4157, `overdueReason` 4182–4187); thẻ BE C0313-01, 03, 07, 08, 10; SEC `FB-R5-SEC-ARC-02`, `-03`; SR-AUD-01…03; rbac D12c. Lúc SEC viết xong, ARC và DOM đã có bản review (`ARC-on-be-pr-106-99-checkout.md`, `DOM-on-be-prs-106-99-checkout.md`, chưa commit). SEC đọc để không trùng thẻ, và ghi ý kiến về A2-01, PR99-02 ở mục 2.5 và 2.7.

Cách kiểm:
- Đọc diff. Hai worktree tách riêng ở `897656de` và `ba99bdb8` trong scratchpad của SEC (thư mục `sec-pr106-99/`), không checkout bản làm việc chung. Dùng một PostgreSQL 17 tạm: container riêng, chỉ mở `127.0.0.1`, mật khẩu CI công khai của repo, migrate như CI. Xóa sau review.
- Chạy lại 4 tệp test V5-10/V5-15 ở `ba99bdb8` (`v105-overdue-checkout`, `v105-checkout-at`, `v105-overdue-checkout-units`, `be-a1-v105-units`): **54/54 qua**.
- Viết hai tệp probe chỉ trong scratchpad, **không** commit: P1–P8 tích hợp (HTTP thật, đồng hồ giả, dữ liệu giả) và PU1–PU3 (hàm thuần `resolveCheckoutAt`). Kết quả ghi ở từng mục.
- Thử bản sửa của thẻ A1B-01 trong worktree riêng, rồi chạy toàn bộ test API (mục 5).
- Không gọi staging hay production. Tệp này không có bí mật hay dữ liệu khách. Mật khẩu sai trong probe là chuỗi giả.

---

## 0. Kết luận

| PR | Kết luận | Thẻ |
|---|---|---|
| **#106** @ `897656de` | **DUYỆT.** Gộp được ngay. | 0 Blocker · 0 Major · 0 Minor · 1 Suggestion (A1A-01) |
| **#99** @ `ba99bdb8` | **DUYỆT** để gộp **sau #106**, khi hết DRAFT. E2E là việc của QA. | 0 Blocker · 0 Major · 1 Minor (A1B-01) · 2 Suggestion (A1B-02, A1B-03) |

Không thẻ nào là điều kiện gộp. SEC khuyến nghị làm **A1B-01 trước tag v1.0.5**. Sửa một chỗ, SEC đã thử, xem mục 5.

Nếu #99 thêm commit trước khi hết DRAFT mà chạm `use-case-denial.ts`, `overdue-checkout.ts`, `checkOut`/`checkOutRun`, `createVietQr` (controller) hoặc `overdueGate`/`readInput`, thì SEC đọc lại phần chênh. Commit chỉ thêm test E2E hoặc gộp `main` thì không cần.

Câu hỏi của ORC, trả lời ngắn:

| Câu hỏi | Trả lời | Mục |
|---|---|---|
| #106: `checkoutAt` client gửi có bị ghim theo giờ máy chủ và biên hợp đồng không? | **Có.** Sai ngày → 422 `DATE_INVALID`. Sau giờ máy chủ + dung sai → B18 và QR `check_out` đều 422 `TIME_AFTER_ACTION`, không tạo QR, không ghi gì. Tóm tắt (chỉ đọc) trả cờ `checkoutAtAfterNow` | 1.1 |
| #106: QR `check_out` có cho đổi số tiền không? | **Không.** Số QR ≤ trần máy chủ tính theo `checkoutAt` đã ghim. Vượt trần chỉ FD+ kèm `overBalanceReason`, như cũ. Giá đêm thêm phải nằm trong sàn–trần. Số tiền lưu lúc tạo, không có đường sửa | 1.2 |
| #99: cổng có chạy trước mọi đọc thân lệnh (H-03) không? | **Có**, ở B18 và ở bước xác nhận mật khẩu. Không mật khẩu nào bị thử, bộ đếm SR-RL-02 không tăng (P1, P2, P8). Với QR, chỉ kiểm dạng thân lệnh (không phụ thuộc dữ liệu) chạy trước cổng, đúng hợp đồng 1.18 | 2.1, 2.2 |
| #99: `access.denied` ghi đúng, không lộ dữ liệu? | **Đúng.** Mỗi lần từ chối có một dòng, `after` chỉ có `operationId` + `roles`. Không thân lệnh, không lý do, không mật khẩu (P1). Thử lại cùng `Idempotency-Key` thì vẫn 403, mỗi lần một dòng, không giữ khóa (P3) | 2.3 |
| #99: `overdueReason` có qua luật số thẻ, số giấy tờ và giới hạn độ dài không? | Luật số thẻ V-09: **có** (T15-14). Độ dài 3–500 sau khi gộp khoảng trắng: **có** (P6). Luật số giấy tờ (V5-46): **không**, đúng phạm vi V5-46 (chỉ chữ khách gõ) và chính sách D12c (nhắc trên giao diện). **Chưa bỏ ký tự điều khiển** như `openapi.yaml` 4143 ghi: thẻ A1B-01 | 2.4 |
| #99: audit `after.overdue.reason` có ghi dữ liệu nhạy cảm không? | Máy chủ không tự thêm gì nhạy cảm: chỉ ngày, giờ, số đêm và chữ người ghi gõ. Nếu người ghi gõ số CCCD thì số đó nằm lại trong audit (append-only). Rủi ro thấp, SEC chấp nhận cho v1.0.5 với lời nhắc D12c trên Desk. Thẻ A1B-02 cho v1.0.6 | 2.5 |
| #99: FD/FDL `x-scope own` còn giữ với `overdueOnly`? | **Còn.** Điều kiện `actor_user_id` thêm trước mọi bộ lọc. `overdueOnly` chỉ thêm `AND`, giá trị cố định hoặc qua tham số SQL (P7: OWN thấy 1, FD thấy 0; `category` lạ → 422) | 2.6 |

ESC mới: **không**.

---

## 1. PR #106 – V5-10

### 1.1 `checkoutAt` gửi lên bị ghim

`resolveCheckoutAt` (`checkout-at.ts`) là hàm thuần. Tóm tắt, trần QR, `amountDueNow` và B18 cùng gọi nó qua `CheckoutService.resolveCheckoutAt` (một chỗ đọc `manual_time_tolerance_minutes` và `business_day_rollover`).

| Biên | Cài đặt | Kết quả |
|---|---|---|
| Ngày | `checkoutAt` gửi lên nhận khi: ngày nghiệp vụ = ngày đi; hoặc trong cửa sổ sau nửa đêm của ngày đi; hoặc tối hôm trước, nhưng chỉ khi đồng hồ máy chủ đang trong cửa sổ đó và không sớm hơn giờ nhận phòng (C0313-07). Ngoài ra → `null` | 422 `DATE_INVALID` (`field` = `checkoutAt`) ở cả ba đường |
| Tương lai | `afterNow` = `at` > giờ máy chủ + dung sai | B18: 422 `TIME_AFTER_ACTION` (`checkoutAt`, hoặc `checkoutTime` khi chỉ gõ giờ). QR `check_out`: `assertNotAfterNow` → 422, trước `createVietQr` ghi dòng `payment` (T10-9 kiểm không có QR, không audit). Tóm tắt: chỉ cờ `checkoutAtAfterNow`, vì tóm tắt không ghi gì |
| Quá khứ | `noteRequired` = `at` < giờ máy chủ − dung sai | B18 đòi `checkoutTimeNote` như E03-07 |
| Không gửi | Giờ `t` (gõ ?? giờ hẹn ?? `checkout_time`) đặt lên các ứng viên. Chọn ứng viên muộn nhất không sau giờ máy chủ + dung sai. Không ứng viên nào đạt thì lấy ứng viên sớm nhất, và ứng viên này bị `afterNow` chặn | QR không còn "vắng = giờ máy chủ" (C0313-08). Số trên QR, tóm tắt và B18 cùng một giờ (T10-5) |

`amountDueNow` (lúc xác nhận tiền QR về) cũng gọi `assertNotAfterNow`. Nếu nó ném lỗi thì `payments.service` dùng số dư folio thay. Với `checkoutAt` lưu lúc tạo QR, lỗi này không xảy ra: QR đã không `afterNow` lúc tạo, và giờ máy chủ chỉ tiến lên. Đường dự phòng chỉ quyết định có phải ghi chú khi tiền về nhiều hơn, không đổi số tiền đã nhận.

Probe PU2: gửi 18:00 khi máy chủ 10:00 → `afterNow = true`. PU3: 04:00 ngày đi + 1 → ngày nghiệp vụ = ngày đi, nhận và tính đêm thêm như T10-2. Đúng hợp đồng.

Kẽ hở nhỏ: biên "không sớm hơn giờ nhận phòng" chỉ áp cho tối hôm trước. Probe PU1: khách nhận phòng 01:00 ngày đi, `checkoutAt` 00:30 cùng đêm vẫn được nhận. Sau #99, giờ này thành `actual_checkout_at`. Thẻ **A1A-01** (Suggestion).

### 1.2 QR `check_out` không đổi được số tiền

- Client gửi `amountVnd`, `checkoutAt`, `extraNightRateVnd`, `lateFeeAsNight`. Trần (`capVnd`) do máy chủ tính bằng đúng hàm của tóm tắt, theo `checkoutAt` đã ghim ở 1.1.
- `amountVnd` > trần → 422 `AMOUNT_EXCEEDS_BALANCE`. Chỉ FD+ được vượt trần, phải kèm `overBalanceReason` (D12c, như cũ).
- `extraNightRateVnd` phải nằm trong sàn–trần BR-105, và chỉ dùng được khi đêm thêm có thật và bán được. Ngoài khoảng → 422 `RATE_OUT_OF_RANGE`.
- Số tiền và đầu vào (`qr_context`) lưu khi tạo. Không có lệnh nào sửa số tiền của QR. Lúc xác nhận, máy chủ so `amount_vnd` đã lưu với số phải thu tính lại.
- Trước #106, client gửi được `checkoutAt` ở tương lai (vd. 23:00 ngày đi) để trần có thêm đêm thêm, rồi tạo QR lớn hơn số khách nợ mà không cần lý do. #106 đóng đường này.

### 1.3 Allowlist audit `reservation` thêm 5 khóa

`systemTime` (HH:mm), `lateSurchargeVnd` (số), `checkoutMode` (`desk`/`debt`), `extraNight` (ngày), `postMidnightWindow` (`true`).
- B18 đã ghi các khóa này từ 0.3.6, nhưng allowlist lọc mất. Giá trị do máy chủ đặt, không có chữ người dùng gõ, không dữ liệu khách.
- `lateSurchargeVnd` là tiền nằm trong bản ghi `state`. Allowlist `reservation` vốn đã có các khóa tiền (`totalRoomVnd`, `depositPaidVnd`…). FD/FDL chỉ đọc bản ghi của chính mình (`x-scope own`), mà số này họ đã thấy trên tóm tắt.
- SEC đồng ý.

### 1.4 `allowedActions.check_out` từ 00:00

- Vai không đổi (FD+). Chỉ đổi ngày: ngày đi hiệu lực (gồm đơn con gia hạn), tính theo ngày lịch.
- Nút chỉ là gợi ý; B18 tự kiểm lại bằng cùng luật (`isCheckoutDay`). Không mở thêm quyền nào.

---

## 2. PR #99 – V5-15

### 2.1 Thứ tự: cổng vai/trần trước thân lệnh

| Đường | Thứ tự trong mã | Kiểm bằng |
|---|---|---|
| B18 không có `lateFeeInsteadOfNight` | `uow.run`: Idempotency (`claimKey`) → `checkout.checkOut` → `overdueGate` (đọc đơn không khóa, `nightsNotBilled` từ ngày nghiệp vụ máy chủ) → `Fields`/`readInput` → khóa → đọc lại `overdueStay` dưới khóa, lệch thì 409 `CONCURRENT_UPDATE` → tiền | T15-1 (thân rỗng vẫn 403); P3 |
| B18 có `lateFeeInsteadOfNight` | `completedReplay` → `this.read(overdueGate)` → `lateFeeApprover` (kiểm dạng, `lateFeePrecheck`, rồi mới `verifyApprover`) → `uow.run` (cổng chạy lại) | P1: FD gửi tên OWN + mật khẩu sai, `{}`, `{postReview: true}`, `"x"` → cả 4 lần đều 403, `approval_pin_failed_count` của OWN không đổi |
| MGR trong trần + `lateFeeInsteadOfNight` | Cổng qua. `lateFeePrecheck` đọc thân theo luật quá ngày đi → 422 `NOT_ALLOWED` trước mật khẩu | P8: 422 `lateFeeInsteadOfNight NOT_ALLOWED`, bộ đếm OWN không đổi |
| QR `check_out` | Kiểm dạng thân (`amountVnd`, trường theo `purpose`) → vai desk → `overBalanceReason` → tải đơn có khóa → trạng thái `in_house` → khóa folio → `amountDueFor` → `overdueGate` → `assertOverdueQr` → kiểm ngày → giờ | H-03; P5: FD không gửi `checkoutAt` → 403, không phải 422 `REQUIRED` |

Các điểm SEC đã xem và chấp nhận, không ra thẻ:
- **QR:** lỗi 422 dạng thân lệnh (P5: `amountVnd` âm) đứng trước 403. Lỗi này chỉ phụ thuộc thân lệnh, không phụ thuộc đơn, nên không dò được gì. Hợp đồng 1.18 chỉ đòi 403 trước kiểm trạng thái. Kiểm `in_house` đứng trước cổng nhưng không che được ca nào: đơn quá ngày đi luôn đang `in_house`.
- **B18 thiếu `If-Match`:** 428 trước 403 (P4). Đây là kiểm header, cũng không phụ thuộc dữ liệu.
- **`dryRun`:** `checkOut` không khai `dryRun` trong meta, nên guard trả 422 `dryRun NOT_ALLOWED` (P4). Cột "`dryRun` cùng kết quả" của H-04 vì vậy không áp được cho B18. Bản xem trước là tóm tắt, và tóm tắt đã trả `nightsNotBilled` cho MGR. QA và ARC lưu ý khi dò lại bảng H.
- **Khóa `Idempotency-Key` đã xong mà dùng lại với thân khác:** 422 `IDEMPOTENCY_KEY_REUSED` trước cổng, không có `access.denied`. Cùng họ với thẻ S1-01, nhưng ở đây yêu cầu chưa tới bước nào của đơn và khóa gắn theo người dùng. Không lộ gì.

### 2.2 Vai và trần

- `canCheckOutOverdue`: OWN luôn; MGR khi `nightsNotBilled` ≤ 1 (hằng số, BR-433 / ESC-007 A); FDL/FD không bao giờ. Tài khoản nhiều vai qua khi một vai qua.
- `nightsNotBilled` lấy từ ngày nghiệp vụ lúc bấm, không từ `checkoutAt`. Người ghi không hạ được số đêm để lọt trần.
- 403 của MGR quá trần chỉ có `requiredRole: owner` và `nightsNotBilled`. 403 của FD/FDL không có trường mở rộng. Test so đủ mọi khóa của thân lỗi.
- Đơn con gia hạn không có đường riêng: `overdueStay` trả `null` cho đơn con, và B18/QR trên đơn con bị `primaryFor` chặn như cũ.
- `allowedActions` và dòng "Hôm nay" chỉ trả `overdue` cho người làm được (cùng hàm `canCheckOutOverdue`). Nút chỉ là gợi ý; máy chủ vẫn kiểm.

### 2.3 `access.denied`

`recordUseCaseDenial` (`use-case-denial.ts`):
- Chỉ ghi khi lỗi là `FORBIDDEN_ACTION` mang `auditReason` có trong danh sách của controller (`OVERDUE_CHECKOUT`). Lỗi 403 khác không bị ghi hai lần. Guard không ghi thêm vì FD/FDL có trong `x-roles` của cả hai operation.
- Ghi trong transaction riêng, sau khi transaction của lệnh đã rollback. Lần từ chối vì vậy để lại đúng một dòng mà không ghi được gì khác.
- Dòng ghi (P1): `entity_type = operation`, `entity_id = checkOut`, `reason = OVERDUE_CHECKOUT`, `after = { operationId, roles }`, `before = null`. SEC tìm mật khẩu sai và lý do đã gửi trong mọi bản ghi audit của FD: không có.
- Lỗi ném trong `uow.run` không lưu câu trả lời vào `idempotency_key`. P3: hai lần cùng khóa → hai lần 403, hai dòng, bảng khóa không còn dòng nào. Thử lại không bị "replay 403", mỗi lần thử đều để dấu.
- Nếu ghi `access.denied` lỗi (DB mất kết nối), người gọi nhận 500 thay vì 403. Không lộ gì, chấp nhận.

Dòng từ chối không nói đơn nào. Thẻ **A1B-03** (Suggestion).

### 2.4 `overdueReason`: bộ đọc chữ

`readInput` gọi `f.text('overdueReason', 500, { required: true, min: 3 })` (`Fields.text`, `reservations/internal/inputs.ts`). Đây cũng là hàm `checkoutTimeNote` đang dùng, đúng chữ "cùng hàm đọc chữ" của `openapi.yaml` 4143.

| Luật | Có không | Bằng chứng |
|---|---|---|
| Thiếu, rỗng, < 3 ký tự | Có → `REASON_REQUIRED` | T15-3 |
| > 500 ký tự sau khi gộp khoảng trắng | Có → `TOO_LONG` | P6: 501 ký tự → 422. Chuỗi thô 800 ký tự, gộp khoảng trắng còn 499 → nhận. Chỉ phần đã gộp được lưu |
| Số thẻ V-09 (`containsCardNumber`: luật cũ + `looksLikeCard`) | Có → 422 `CARD_NUMBER_DETECTED`, `field` = `overdueReason` | T15-14 |
| Gửi trên đơn chưa quá ngày đi | Có → `NOT_ALLOWED` | T15-6 |
| Số giấy tờ (V5-46, `looksLikeIdNumber`) | Không | Đúng phạm vi V5-46 (plan dòng 163: chỉ chữ khách gõ, "không áp cho ô nhân viên nhập") và D12c ("giao diện cảnh báo"). Xem 2.5 |
| **Bỏ ký tự điều khiển** | **Không.** `Fields.text` chỉ `trim()` và gộp khoảng trắng | P6–P8. Thẻ **A1B-01** |

Kết quả P6–P8 ở `ba99bdb8`:
- `\u0000` (NUL) qua bộ đọc. Tới lúc ghi audit `after` (jsonb), PostgreSQL báo `22P05` → 500, cả lệnh rollback.
  - Log chỉ có mã lỗi (`ProblemFilter`: `code=22P05 routine=json_errsave_error`), không có thân lệnh hay chữ lý do. SR-LOG-04 vẫn giữ.
- `‮` (đảo chiều chữ), `​` (ký tự rộng 0), `\u0007` qua bộ đọc và nằm nguyên trong `after.overdue.reason`. Đây là chữ OWN đọc trong bộ lọc "Trả phòng quá ngày đi – tuần này". Chữ đảo chiều làm câu hiện khác với thứ tự lưu.

### 2.5 Audit `after.overdue`

- Máy chủ dựng `after.overdue = { departureDate, checkoutAt, recordedAt, reason, nightsNotBilled }` với khóa cố định. Chỉ `reason` là chữ người gõ. Không số tiền, nên tập mã `money` không đổi, đúng hợp đồng.
- Allowlist `reservation` thêm `overdue` (`frontdesk/audit-entities.ts`). T15-9 đọc lại `audit_event`, không chỉ phản hồi API.
- Với đường quá ngày đi, `reason` của dòng audit chỉ đặt khi có nợ. Lý do quá ngày đi không bị ghi hai chỗ.
- `overdueReason` là D12c (C2, OWN/MGR/FDL/FD đọc đầy đủ). Chữ này nằm trong `after`, mà `audit_event` là append-only: REVOKE UPDATE/DELETE, chỉ xóa theo phân vùng tháng ở hạn T15, nằm ngoài luồng xóa dữ liệu khách. SR-AUD-03 ghi "không C3" trong `before/after`.
  - Probe P7: lý do "… CCCD 079203012345" (số giả) được nhận và lưu nguyên.
  - Rủi ro này giống mọi lý do chữ tự do khác trong hệ thống (cột `reason` của audit: `checkoutTimeNote`, `overBalanceReason`…). Biện pháp hiện có là lời nhắc trên giao diện (D12c, hợp đồng: "Desk nhắc không ghi họ tên khách").
  - SEC đánh giá mức **Low** và **chấp nhận cho v1.0.5**, với điều kiện hộp "Trả phòng quá ngày đi" của FE-A có lời nhắc D12c cạnh ô lý do: không ghi họ tên, số giấy tờ, thông tin sức khỏe của khách. Hiện chưa thấy chuỗi này trong `design/copy`. Đây là việc của UXD/FE-A, SEC sẽ xem ở PR FE. Phần máy chủ: thẻ **A1B-02** cho v1.0.6.
- **Mốc giữ dữ liệu (BE C0313-03, hợp đồng 1.18 "SEC xác nhận"):** B18 có `checkoutAt` ghi `reservation.actual_checkout_at`, `registration.actual_checkout_at`, `stay_ended_at` (qua `onCheckedOut` → `scheduleAfterStay`, `COALESCE` giữ mốc cũ nếu đã có) và mốc chứng cứ phạt 12 tháng bằng `checkoutAt`. `post_checkout_window_until` vẫn tính từ lúc ghi (T15-2 kiểm). Hạn xóa ảnh giấy tờ vì vậy sớm hơn hoặc bằng trước, tức giữ ít hơn. **SEC xác nhận** hướng này.
  - DOM nêu: đơn quá ngày đi nhiều đêm (chỉ OWN) có thể có ảnh tới hạn xóa ngay lúc ghi. SEC đồng ý với DOM là không đổi. Giữ ít hơn là đúng hướng Nghị định 13/2023, và khi có tranh chấp thì đã có `legal_hold`.
  - ARC mục 3.2 cho giờ quy đổi thành giờ rời ở mọi B18 (cả khi chỉ gõ giờ). SEC đồng ý, với cùng biên giờ nhận phòng ở thẻ A1A-01.

### 2.6 `listAuditEvents.overdueOnly`

- `overdueOnly` chỉ nhận `true`/`false`, giá trị khác → 422.
- Khi `true`, mã thêm ba điều kiện cố định (`category = 'state'`, `action` qua tham số, `after ? 'overdue'`) vào sau điều kiện phạm vi.
- FD/FDL: `actor_user_id = <mình>` luôn được thêm khi người gọi không có OWN/MGR, trước mọi bộ lọc. P7: OWN thấy 1 dòng, FD thấy 0 dòng (FD không làm được đường này).
- `category` lạ (chuỗi kiểu `' OR '1'='1`) → 422, vì `category` được so với danh sách đóng trước khi vào SQL.
- MGR thấy bản ghi của OWN và MGR khác. Đây là phạm vi có sẵn của `listAuditEvents`, không mới.

### 2.7 Khác

- **Minibar `countFrom`:** chỉ nới cho đường quá ngày đi. Lần đếm có ngày nghiệp vụ ≥ ngày đi hiệu lực được tính (hợp đồng 1.4). Lần đếm trước ngày đi vẫn không tính (test).
  - SEC đồng ý thẻ ARC **A2-01** (Major): `GET minibar-standard` chưa theo cửa sổ này, nên Desk sẽ báo "cần đếm lại" một tủ đã đếm.
  - Đếm lại tủ đã bù hàng sẽ làm giảm dòng minibar không qua BR-438. Đây đúng là đường của thẻ SEC **V516-01** (Major). Sửa A2-01 trước hộp "Trả phòng quá ngày đi" của FE-A thì đơn quá ngày đi không mở thêm lối vào đường đó.
- **Tóm tắt** vẫn cho FD+ đọc, kể cả `overdue` và `nightsNotBilled`, đúng hợp đồng. Không có số tiền hay dữ liệu mới.
- **Không** có thông báo, SSE hay outbox mới mang lý do.

---

## 3. Thẻ

### FB-R5-SEC-BE-A1A-01
- Mức độ: **Suggestion**
- Vị trí: `frontdesk/internal/checkout-at.ts` `resolveCheckoutAt`, nhánh `if (i.sent)`: biên `checkedInAt` chỉ áp cho tối hôm trước (`eveningBeforeAllowed`). Ảnh hưởng qua #99: `checkout.service.ts` `departedAt` → `actual_checkout_at`, `onCheckedOut` → `stay_ended_at`, khai báo lúc đi (BR-604).
- Vấn đề:
  - `checkoutAt` gửi lên trong cửa sổ sau nửa đêm của ngày đi hoặc trong ngày đi được nhận, kể cả khi sớm hơn giờ nhận phòng thật.
  - Probe PU1: đơn 1 đêm 23/11 → 24/11. Khách nhận phòng 01:00 ngày 24/11 (ngày nghiệp vụ 23/11). Gửi `checkoutAt` = 00:30 ngày 24/11 → nhận, `postMidnight = true`, chỉ đòi ghi chú.
  - Trên đường quá ngày đi, `noteRequired` bị tắt, nên ca này qua chỉ với `overdueReason`.
- Vì sao quan trọng: không lộ dữ liệu, không lệch tiền. Nhưng sau #99, giờ này thành giờ rời thật: khai báo đi trước giờ đến, mốc xóa ảnh tính từ trước lúc khách tới. Đây là lỗi gõ hiếm, nhưng ghi vào dữ liệu pháp lý.
- Đề xuất sửa:
  - Áp `!i.checkedInAt || at >= i.checkedInAt` cho mọi `checkoutAt` gửi lên. Không đạt → `null` (422 `DATE_INVALID`, `field` = `checkoutAt`), như tối hôm trước.
  - ARC (review #99 mục 3.2) cho `actual_checkout_at` = giờ đã quy đổi ở **mọi** B18, kể cả khi chỉ gõ giờ. Khi đó áp cùng biên cho nhánh quy đổi: bỏ ứng viên sớm hơn giờ nhận phòng. Không còn ứng viên nào thì 422 `DATE_INVALID`, `field` = `checkoutTime`.
  - Thêm PU1 vào `be-a1-v105-units`.
  - Làm cùng DOM PR106-01 nếu tiện, hoặc ở #99. Không chặn gộp #106.
  - DOM (`DOM-on-be-prs-106-99-checkout.md`) và ARC (`ARC-on-be-pr-106-99-checkout.md` mục 1.4) đã đồng ý hướng này. ARC ghi chữ vào 0.3.14.
- Trạng thái: Open

### FB-R5-SEC-BE-A1B-01
- Mức độ: **Minor**. Không chặn gộp #99. Khuyến nghị làm trước tag v1.0.5.
- Vị trí: `reservations/internal/inputs.ts` `Fields.text` (dòng 147–171 ở `ba99bdb8`). Có 38 chỗ gọi `.text(` trong `src/modules` (reservations, frontdesk), gồm `checkout.service.ts` `readInput` (`overdueReason`, `checkoutTimeNote`). Đối chiếu: `openapi.yaml` 4143 ("D12c: bỏ ký tự điều khiển"); `shared/validation.ts` `stripControlChars` (SEC-BE-44, A4), mà `requireReason`/`optionalText` đã dùng.
- Vấn đề:
  - `Fields.text` không bỏ ký tự điều khiển hay ký tự định dạng ẩn, trái với chữ của hợp đồng.
  - P8: `overdueReason` có `\u0000` → B18 chạy hết các bước kiểm, tới lúc ghi audit jsonb thì 500 (`22P05`), rollback.
  - P6–P7: `‮`, `​`, `\u0007` được lưu nguyên vào `after.overdue.reason`. OWN đọc chữ này để hậu kiểm.
  - `checkoutTimeNote` dùng cùng hàm, nên có cùng lỗi từ trước (ghi vào cột `reason`).
- Vì sao quan trọng:
  - Lý do quá ngày đi là chứng cứ OWN dùng để hậu kiểm MGR (SEC ARC-03). Ký tự đảo chiều cho phép chữ hiện ra khác chữ đã lưu.
  - NUL làm lệnh trả 500 thay vì 422. Từ Desk không gõ được NUL, nên chỉ xảy ra qua API.
  - Không lộ dữ liệu: log 500 chỉ có mã lỗi.
- Đề xuất sửa (không đổi hợp đồng, không migration):
  1. Trong `Fields.text`: `const t = stripControlChars(v).trim().replace(/\s+/g, ' ');`. Thêm nhánh: `t === ''` sau khi bỏ thì xử như vắng (`REQUIRED`/`REASON_REQUIRED` khi bắt buộc, `undefined` khi không). Import `stripControlChars` từ `shared/validation`.
  2. Test (`v105-overdue-checkout`): `overdueReason` có `\u0000`, `‮…‬`, `​` → 200, `after.overdue.reason` đọc lại không còn các ký tự đó; lý do chỉ gồm ký tự điều khiển → 422 `REASON_REQUIRED`. Một ca như vậy cho `checkoutTimeNote`.
  3. SEC đã thử bước 1 trong worktree riêng. Kết quả ở mục 5.
- Trạng thái: Open

### FB-R5-SEC-BE-A1B-02
- Mức độ: **Suggestion** (v1.0.6). SEC chấp nhận rủi ro Low cho v1.0.5 với lời nhắc D12c trên Desk (mục 2.5).
- Vị trí: `checkout.service.ts` `readInput` (`overdueReason`); audit `reservation.checked_out` `after.overdue.reason`; `shared/sensitive-number.ts` `looksLikeIdNumber`; SR-AUD-03.
- Vấn đề:
  - `overdueReason` vào `audit_event.after`, bảng append-only, nằm ngoài luồng xóa dữ liệu khách. Máy chủ chỉ kiểm số thẻ.
  - Probe P7: lý do có số CCCD giả được nhận và lưu nguyên.
  - SR-AUD-03 nói `before/after` không chứa C3. Ở đây C3 chỉ vào được khi người ghi gõ, và chỉ được chặn bằng lời nhắc trên giao diện.
- Vì sao quan trọng:
  - Một số giấy tờ lọt vào audit thì không gỡ được tới hạn T15.
  - Đường quá ngày đi hay có lý do kiểu "khách gọi báo, đã đối chiếu CCCD…". Lý do này dễ chứa số giấy tờ hơn ghi chú giờ trả.
- Đề xuất sửa (v1.0.6, chọn một):
  - (a) Áp nửa "giấy tờ" của bộ dò chung (`looksLikeIdNumber`) cho các lý do chữ tự do ghi vào audit `after`, bắt đầu từ `overdueReason` → 422 `ID_NUMBER_DETECTED`, `field` = `overdueReason`, không ghi gì. Mã này đã có ở V5-46, và `design/copy` đã có câu `error.ID_NUMBER_DETECTED`. UXD xem lại giọng câu cho Desk. Bộ dò có danh sách che thừa đã biết (ba số phòng liền nhau, số 9 chữ số trần), nên DOM xem các lý do mẫu ở mục 7.1 trước khi bật.
  - (b) Hoặc chuyển chữ lý do ra cột `reason` của dòng audit, chỉ giữ trong `after.overdue` các khóa cố định. Như vậy SR-AUD-03 chỉ còn áp cho dữ liệu máy chủ dựng. Việc này đổi hợp đồng (`after.overdue.reason`), nên ARC quyết.
  - SEC nghiêng về (a): cùng một bộ dò với trang khách, không đổi hợp đồng.
- Trạng thái: Open

### FB-R5-SEC-BE-A1B-03
- Mức độ: **Suggestion**
- Vị trí: `audit/public/use-case-denial.ts` `recordUseCaseDenial` (`entityId = operationId`, `after = { operationId, roles }`); `overdue-checkout.ts` `assertOverdueCheckoutRole`.
- Vấn đề: dòng `access.denied` của đường quá ngày đi không cho biết đơn nào. Khác với guard, use case biết đơn. OWN thấy "MGR bị từ chối `checkOut` (OVERDUE_CHECKOUT)", nhưng phải hỏi lại mới biết căn nào, đơn nào.
- Vì sao quan trọng: H-04 (MGR quá trần) là ca OWN cần làm tiếp trên đúng đơn đó. Lễ tân thử đường này nhiều lần cũng cần lần ra đơn. Mã đơn không phải dữ liệu khách.
- Đề xuất sửa: `assertOverdueCheckoutRole` nhận mã đơn và để vào `ProblemError.options` (ví dụ `auditEntityCode`). `recordUseCaseDenial` ghi vào cột `entity_code`. Không thêm khóa nào vào `after`, không đổi thân lỗi 403. Test H-09 kiểm thêm `entity_code`. Nếu ARC muốn giữ "cùng dạng với dòng của guard" thì đóng thẻ này.
- Trạng thái: Open

---

## 4. Dòng decision-log đề xuất (ORC ghi khi gộp)

```
| 2026-11-07 | 5 | **SEC – review PR #106 (BE-A1 PR-A1a, V5-10) @ 897656de: DUYỆT** (rounds/round-05/reviews/SEC-on-be-prs-106-99-checkout.md mục 1). `checkoutAt` client gửi bị ghim: ngày ngoài ngày đi/cửa sổ sau nửa đêm/tối hôm trước (C0313-07) → 422 DATE_INVALID; sau giờ server + dung sai → B18 và QR check_out 422 TIME_AFTER_ACTION, không tạo QR, không ghi; tóm tắt chỉ trả cờ. QR check_out không đổi được số tiền: amountVnd ≤ trần máy chủ tại checkoutAt đã ghim (vượt trần chỉ FD+ có overBalanceReason), giá đêm thêm trong sàn–trần, số lưu lúc tạo. Allowlist reservation +5 khóa máy chủ đặt, không dữ liệu khách. A1A-01 Suggestion (biên giờ nhận phòng cho mọi checkoutAt gửi lên). Không ESC | SEC | Quyền SEC (mức rủi ro, yêu cầu bảo mật kỹ thuật) |
| 2026-11-07 | 5 | **SEC – review PR #99 (BE-A2 PR-A1b, V5-15) @ ba99bdb8: DUYỆT, gộp sau #106 khi hết DRAFT** (cùng tệp, mục 2). Cổng vai/trần (OWN; MGR ≤ 1 đêm; FD/FDL không) chạy trước mọi đọc thân lệnh và trước mật khẩu (probe: không mật khẩu nào bị thử); nightsNotBilled từ ngày nghiệp vụ máy chủ; mỗi lần từ chối một access.denied, after chỉ operationId + roles. overdueReason qua V-09, 3–500 ký tự. Không áp luật số giấy tờ (đúng phạm vi V5-46/D12c): SEC chấp nhận rủi ro Low cho v1.0.5 với điều kiện Desk có lời nhắc D12c cạnh ô lý do, A1B-02 cho v1.0.6. Bộ đọc chưa bỏ ký tự điều khiển (NUL → 500, chữ đảo chiều lưu vào audit): A1B-01 Minor, trước tag v1.0.5. overdueOnly giữ x-scope own. SEC xác nhận stay_ended_at và mốc chứng cứ phạt = checkoutAt (giữ ít hơn), post_checkout_window_until từ lúc ghi. Không ESC | SEC | Quyền SEC (mức rủi ro, yêu cầu bảo mật kỹ thuật) |
```

---

## 5. Bản sửa thử A1B-01

SEC sửa `Fields.text` như đề xuất 1 trong worktree riêng ở `ba99bdb8`. Không commit, không đẩy lên nhánh `r5-a1b`.
- Probe P6–P8 chạy lại: NUL → 200, `after.overdue.reason` không còn `‮`/`​`/`\u0007`/`\u0000`.
- Toàn bộ test API (gồm hai tệp probe): 176 tệp qua, 1 tệp có ca hỏng, 2 tệp tự bỏ qua (`skipIf`). 4224 ca qua, 2 ca hỏng. Cả hai ca hỏng là ca chạy song song có hạn 30 giây trong `reversal-debt-g4.test.ts`, khi máy đang chạy cùng lúc các PostgreSQL của vai khác. Chạy riêng tệp này thì 27/27 qua, cả khi **có** và khi **không** có bản sửa. SEC kết luận hai ca hỏng do tải máy, không do bản sửa. BE vẫn chạy lại cả bộ trên CI khi làm thẻ.
- Không có test cũ nào đổi kết quả vì bỏ ký tự điều khiển. Vì vậy sửa ở `Fields.text` (cho cả 38 chỗ gọi) an toàn hơn sửa riêng `overdueReason`.

---

## 6. Điểm làm tốt

- Hai PR có **một** luật cho mỗi việc: `resolveCheckoutAt` cho giờ trả, `overdue-checkout.ts` cho vai/trần. B18, QR, tóm tắt, `allowedActions` và dòng "Hôm nay" cùng gọi. Không chỗ nào chép lại luật vai.
- Cổng quá ngày đi được đặt trước bước xác nhận mật khẩu, nên lễ tân không dùng được đường này để thử mật khẩu quản lý. Đơn được đọc lại dưới khóa: nếu trạng thái quá ngày đi đổi giữa chừng thì trả 409, không chạy nhầm luật của đường kia.
- `access.denied` ghi sau rollback, chỉ cho đúng mã lý do, `after` không có gì từ thân lệnh. Test đếm số dòng (H-09) và đọc lại `audit_event` (T15-9), không chỉ xem phản hồi API.

---

## 7. Phạm vi và giới hạn

- SEC không review phần nghiệp vụ: phụ thu, đêm thêm, BR-416, minibar K11-09. Phần đó thuộc ARC và DOM. Phần E2E (#99 DRAFT) thuộc QA.
- Worktree, tệp probe và container PostgreSQL tạm chỉ nằm trong scratchpad `sec-pr106-99/`, xóa sau review. Không commit vào `r5-a1a` hay `r5-a1b`.
- SEC không approve hay gộp trên GitHub. ORC gộp.
