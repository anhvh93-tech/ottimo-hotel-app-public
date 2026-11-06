# BE – Review hợp đồng 0.3.13 bổ sung 1f (ARC, PR #111)

Round 5 · bước **Review** · BE (làn BE-C) · 07/11/2026

Đối tượng:
- PR #111, nhánh `r5-contract-0313-arc16`, commit `90adc56d` (gốc `main` @ `dce1c0fd`), 16 tệp:
  - `openapi.yaml` (+50/−27), `erd.md` (1 dòng);
  - mã sinh `openapi-schemas.ts` (ARC-16) và `api-client/src/generated/openapi.ts`;
  - `audit/public/money-actions.ts` (+3, ARC-20), `test/serializer.test.ts` (+21);
  - Desk `MoneyPage.tsx` và chuỗi `mlog.a_money_not_found`;
  - `contract-0.3.13.md` (1.3 T14-4, 1.20, 1.21, 1.25, mục mới 1.26, danh sách 0.3.14), `ARC-on-contract-0.3.13-reviews.md` mục 8.
- Phạm vi ORC giao: đọc từ góc người cài đặt. Các chỗ BE phải làm có rõ, đủ, khớp mã hiện có không: SR-RL-15 (bộ đếm Wi-Fi), C0313-25 (`bankReference`), ARC-20 (audit `attention_event.resolved` ở PR-B3), chữ FDL 2FA. BE xem thêm T14-4, ARC-16, A2 (`serializeSchema`) và BR-438 "gõ tay".

BE đối chiếu với `main` @ `16ea5183` (đã có #103, #109, #117):
- `public-site/internal/public-booking.service.ts` 393–429 (`countIp`, `bumpAt`, `bump`), `public-site/public/worker-jobs.ts` 250–266 (`public_site.cleanup`), migration 0086 (bảng, quyền, ngoại lệ RLS);
- `db/schema/identity.ts` 49–50, 67–68;
- `shared/validation.ts` 35–68, `payments/internal/refunds.service.ts` 668–676, 761, `refunds.controller.ts` 232;
- `events/internal/attention.service.ts` 100–141;
- `identity/public/mfa-roles.ts`, `identity/internal/auth.service.ts` 202, 262–270, `mfa.service.ts` 96, 319, 333, `me.service.ts` 209–213, `shared/http/auth.guard.ts` 492–513;
- `shared/serialization/serializer.ts` 83–98, 177–191;
- `sales/internal/quote-pricing.ts` 209–236;
- `test/module-boundaries.test.ts`.

PR đang mở có liên quan, đọc ở SHA ghi dưới:
- #120 (`r5-v5-58` @ `b790b09f`, BE-D): `public-site/public/rate-limit-counter.ts`, `identity/public/caller-password-match.ts`, `platform/internal/property-wifi.controller.ts`;
- #119 (`r5-v09-reference` @ `4cc06646`, BE-B, BUG-R5-006): `shared/validation.ts`, `refunds.service.ts`, `payments/public/payment.service.ts`;
- #110 (`r5-b2` @ `c71ae350`, BE-H): `folio/public/line-reduction.ts` (`typedByHand`).

BE chỉ đọc (`git show`), không sửa mã của PR nào, không gọi staging hay production. Tệp này không có mật khẩu, bí mật, số thẻ hay dữ liệu khách.

Thẻ SEC đã nêu ở `SEC-on-prs-111-118-122.md` thì BE không lặp lại, chỉ dẫn số:
- SEC ARC-23: chữ 0.3.14 về hàm `auth_resolve_session` (`p_mfa_roles`);
- SEC ARC-24: danh sách test PR-B3 (ARC-21, C0313-25, ARC-20), "8 chữ số cuối";
- SEC mục 4: PR-B3 thêm `attention_event.resolved` vào `AFTER_CLOSURE_ACTIONS`.

---

## 0. Kết luận: **DUYỆT** để gộp PR #111 @ `90adc56d`

0 Blocker · 0 Major · 3 Minor · 2 Suggestion. Không thẻ nào chặn gộp #111.

- Mọi chữ chạm làn BE cài được với mã hiện có, **không migration**, đúng câu mở đầu của 1.26.
- Chữ FDL 2FA khớp mã ở cả 6 chỗ. ARC-16 và A2 khớp serializer. T14-4 mới khớp mã #103. BR-438 "gõ tay" khớp `typedByHand` của #110.
- Chỗ chưa đủ chặt nằm ở chữ hướng dẫn cài đặt và ở một PR cài đặt (#120). Hợp đồng không đổi kiểu sinh, FE không phải làm lại.
- Không cần ESC.

| Thẻ | Mức | Nội dung | Hạn |
|---|---|---|---|
| C0313-26 | Minor | Hàm UPSERT bộ đếm: 1.26 chốt ở `shared/`, #120 đặt ở `public-site/public` và làm `identity` phụ thuộc ngược `public-site` | Trước khi gộp #120 |
| C0313-27 | Minor | Cửa sổ 24 giờ chưa nói mốc (#120: ngày UTC, đổi lúc 07:00 giờ Việt Nam). T58-11 chạy trên đồng hồ thật sẽ chập chờn. T58-15 kiểm "`login_lockout`", vốn là tham số chứ không phải trạng thái | Trước khi QA viết ca T58 |
| C0313-28 | Minor | Mô tả `resolveAttentionEvent` chưa có luật ghi chú bắt buộc và audit cho `deposit_after_cancel` (mục mức `warning`) | Trước khi PR-B3 viết `resolve` |
| C0313-29 | Suggestion | C0313-25 đã cài ở #119, nhưng 1.26 còn ghi "ở PR-B3". Thứ tự giữa `CARD_NUMBER_DETECTED` và lỗi dạng các trường khác chưa chốt | Trước khi gộp #119 |
| C0313-30 | Suggestion | T14-4: OTA kèm `nightlyRates` **sai dạng** trả lỗi `nightlyRates`, không phải `channelId` | Khi QA dẫn T14-4 vào ca |

---

## 1. Đối chiếu với mã – từng mục ORC hỏi

### (1) SR-RL-15 – bộ đếm Wi-Fi trên `rate_limit_counter`

Rõ, đủ, khớp mã:
- **Bảng 0086 dùng được nguyên trạng, không migration.**
  - Khóa chính `(bucket_key, window_start)`. CHECK độ dài khóa ≤ 200; khóa `wifi_pw_cmp:<uuid>` dài 48 ký tự.
  - Đã cấp `SELECT, INSERT, UPDATE, DELETE` cho `ottimo_app`. Ngoại lệ RLS có ghi (khóa chỉ có mã luật và id).
  - Job `public_site.cleanup` (tick) xóa mọi dòng `expires_at < now`, không lọc theo tiền tố khóa hay cơ sở, nên dòng Wi-Fi cũng được dọn.
- **Câu UPSERT** trong mô tả `setPropertyWifi` (`openapi.yaml` 1956–1966) trùng từng chữ câu của `bumpAt` (`public-booking.service.ts` 415–423). Tách ra hàm dùng chung thì SR-RL-11 không đổi hành vi.
- **Thứ tự giao dịch** cài được, không lồng kết nối:
  1. giao dịch riêng thứ nhất: UPSERT; nếu `count` = 6 thì ghi audit `property.wifi_password_check_skipped`; nếu `count` ≤ 5 thì đọc hash của người gọi; commit;
  2. một lần argon2 ngoài giao dịch;
  3. trùng thì ghi audit `property.wifi_password_matches_login` ở giao dịch riêng thứ hai, commit, rồi mới trả 422.

  Cả hai giao dịch chạy trước `UnitOfWork.run`, như `PasswordReauth` và `approvals.controller`. #120 làm đúng như vậy (`CallerPasswordMatch.check`).
- **"Không cộng vào `login_lockout`"**: bộ đếm này khác hẳn `app_user.failed_login_count`, `locked_until` (`identity.ts` 67–68) và `approval_pin_*` (49–50). #120 không chạm hai nhóm cột đó.
- **"Không `x-rate-limit`"**: đúng. Có khai thì `rbac-cases` và QA sinh ca 429 cho một luật không bao giờ trả 429.
- **"Chỉ so khi `password` đã qua kiểm dạng và khác giá trị đang lưu"**: lỗi của `ssid` không chặn phép so. Lần so đó vẫn đếm, nên ngưỡng 5 lần vẫn giữ. #120 làm đúng chữ này.

Chưa rõ: nơi đặt hàm (thẻ 26); mốc cửa sổ, T58-11 và T58-15 (thẻ 27).

### (2) C0313-25 – luật số thẻ cho ô `bankReference`

Rõ, đủ, khớp mã:
- **Luật**:
  - giá trị đã qua mẫu `^[A-Za-z0-9./_-]{1,64}$` và đã bỏ khoảng trắng đầu/cuối (`refunds.controller.ts` 232; #119 ở `checkPaymentShape`);
  - bỏ `.` `/` `_` `-`;
  - phần còn lại khớp `^\d{13,19}$` **và** `luhnValid` (có sẵn ở `shared/redact.ts`, `validation.ts` export lại);
  - không cộng `looksLikeCard` (SEC 4.1).

  Lỗi: `CARD_NUMBER_DETECTED` kèm `errors[{field: bankReference, code: CARD_NUMBER_DETECTED}]`, cùng dạng `assertNoCardNumber`. Không mã lỗi mới.
- **Không làm hỏng mã đang qua ở `executeRefund`.** Giá trị bị luật mới chặn luôn là cả một dãy 13–19 chữ số qua Luhn. Luật gốc V-09 đã chặn mọi dãy như vậy khi viết liền hoặc nối bằng `-`. `looksLikeCard` bắt thêm dạng nối bằng `_`, `/`. Vậy luật mới chỉ có thể chặn thêm dạng nối bằng `.` hoặc trộn nhiều loại dấu, mà đó đúng là số thẻ (ca SEC 4.3). Ngoài dạng đó, luật mới chỉ nhận thêm, không chặn thêm.
- **Phạm vi chỉ có hai chỗ kiểm**:
  - mọi đường `PaymentCreate` đi qua `checkPaymentShape` rồi `recordInTx`;
  - `executeRefund` (`refunds.service.ts` 673).

  #119 đã cài đúng hai chỗ. Câu "máy chủ v1.0.4 còn quét cả đoạn bên trong – sửa ở v1.0.5" khớp BUG-R5-006.
- **Chuẩn hóa chữ hoa** (ARC-15, PR-B3) không đụng tới chữ số, nên không đổi kết quả luật này.

Chưa rõ: nơi cài và thứ tự lỗi (thẻ 29).

### (3) ARC-20 – audit `attention_event.resolved` ở PR-B3

Phần tập đóng rõ và đủ:
- `MONEY_AUDIT_ACTIONS` thêm cùng PR với dòng hợp đồng. Vì vậy `module-boundaries.test.ts` (tập của máy chủ = tập của hợp đồng) giữ xanh, đúng điều kiện 1 của SEC mục 5.
- Trên `main` chưa có mã nào sinh `deposit_after_cancel`: chỉ có CHECK `kind` ở các migration và danh sách `kind` ở `events.service.ts`. Điều kiện 2 của SEC giữ tới nay.

Việc của PR-B3 (BE-D) cài được mà không đổi hợp đồng:
- thực thể audit `attention_event` (`kind`, `afterClosure`):
  - đặt ở `events/audit-entities.ts`, không import Nest;
  - nạp ở `src/audit-entities.ts` cho cả api và worker; thiếu thì `worker-audit-registry.test.ts` báo lệch;
- `recordMoney` với chuỗi `'attention_event.resolved'` viết thẳng, để `module-boundaries.test.ts` kiểm được;
- ghi cùng giao dịch đóng mục; `after` không có ghi chú;
- thêm `attention_event.resolved` vào tập ghim của `afterClosureOnly` (SEC mục 4);
- test đọc lại `audit_event`.

Chưa rõ: luật ghi chú bắt buộc ở chính `resolveAttentionEvent` (thẻ 28).

### (4) Chữ FDL 2FA – 6 chỗ và `erd.md`

Mọi chỗ trong mã đọc cùng một hằng `MFA_REQUIRED_ROLES` = `owner`, `manager`, `front_desk_lead` (`mfa-roles.ts` 12):

| Chỗ trong hợp đồng | Mã trên `main` | Khớp |
|---|---|---|
| `MFA_ENROLLMENT_REQUIRED` (guard chung) | `auth.guard.ts` 492–513: truy vấn vai còn hiệu lực theo `MFA_REQUIRED_ROLES`, bù cho `auth_resolve_session().mfa_required` (0079) vốn chỉ có OWN, MGR | Có |
| `login` – phiên hạn chế | `auth.service.ts` 202, 262–270 | Có |
| summary `getMy2fa`, `getMy2fa.required` | `mfa.service.ts` 96 | Có |
| `disableMy2fa` → 403 | `mfa.service.ts` 319, 333 | Có |
| `Me.mfaRequiredButMissing` (cả `mfaEnrollmentRequired`) | `me.service.ts` 209, 213 (`isMfaRequiredRole`) | Có |
| `erd.md` `mfa_enabled` | – (chỉ chữ) | Có |

- v1.0.5 không có việc BE mới.
- 0.3.14: thay hàm 0079 (có migration, theo QC R4 ĐK-2), rồi mới bỏ truy vấn bù ở guard. BE đồng ý thứ tự này và điều kiện của SEC ARC-23. Test FDL của #100 giữ nguyên, dùng làm test hồi quy khi bỏ.

### (5) Các mục khác của 1f chạm BE

- **ARC-16**:
  - `openapi-schemas.ts` thêm `v` cho `ApprovalRequest.possibleDuplicateCodes`.
  - `propertyAllowed` (`serializer.ts` 92) áp `x-visible-to` cho cả `serializeResponse` lẫn `serializeSchema`. Vì vậy HK, MT, SAL, CTV không nhận trường này cả qua SSE.
  - Trên `main` trường này chưa có nguồn (PR-B3 tính lúc đọc), nên thay đổi không làm khác phản hồi nào hôm nay.
- **A2** (`serializeSchema` không trả `x-self-data`): khớp `serializer.ts` 177–191 (owner `null` → bỏ mọi thuộc tính `sd`).
- **T14-4 mới**: khớp `quote-pricing.ts` 210–236 (#103):
  - `type` ≠ `short` mà có `nightlyRates` → `NOT_ALLOWED` (kiểm trước);
  - kênh ngoài `direct`/`agent` → `NOT_IN_LIST` (`channelId`).

  Lưu ý thứ tự kiểm ở thẻ 30.
- **BR-438 "gõ tay"**: khớp `typedByHand` của #110 (`line-reduction.ts` 80–85):
  - "gõ tay" = nguồn `manual` + danh mục A30 (`cleaning`, `laundry`, `penalty`, `damage`, `fnb`, `service_fee`), hoặc nguồn `minibar_check` + danh mục `minibar`;
  - phụ thu trả muộn không thuộc danh mục A30;
  - phí dọn từ yêu cầu khách lưu nguồn `guest_app` (`guest-request-lifecycle.ts` 165–170).

  Hai loại dòng sau không bao giờ thành "gõ tay", đúng câu "dòng hệ thống luôn đi FOC".
- **ARC-21, ARC-22, A3**: chỉ chữ. ARC-21 là một nhánh trong bộ dựng lỗi ở PR-B3 (đã nêu ở 7.8.2 của `BE-on-contract-0.3.13.md`).

---

## 2. Thẻ feedback

#### FB-R5-BE-ARC-C0313-26
- Mức độ: Minor – gửi BE-D (#120), ARC (chữ, nếu giữ chỗ cũ)
- Vị trí:
  - contract 1.26, đoạn "Quyết định ARC cho V5-58" (dòng 785);
  - #120 @ `b790b09f`: `public-site/public/rate-limit-counter.ts`, `identity/public/caller-password-match.ts` dòng 10 và 28.
- Vấn đề:
  - 1.26 chốt hàm UPSERT dùng chung "ở `shared/`". #120 đặt hàm ở `public-site/public/`, và `identity` import nó.
  - `public-site` vốn đã import `identity/public`: `RateLimiter` ở 3 tệp, `staff-directory` ở 1 tệp. Sau #120, `identity` lại import `public-site/public`, nên hai module phụ thuộc lẫn nhau.
  - Lúc chạy không vỡ: tệp bộ đếm chỉ import `db/database`, không có module Nest. `module-boundaries.test.ts` cũng không bắt, vì nó chỉ cấm `internal/`. Nhưng đây là kiểu phụ thuộc vòng mà ARC-BE-S3-16 muốn tránh.
  - Chú thích ở `caller-password-match.ts` ghi "public-site `bumpRateLimitCounter`", trái chữ hợp đồng.
- Vì sao quan trọng: hợp đồng và mã chỉ hai nơi khác nhau. Người làm bộ đếm thứ ba (ví dụ PIN duyệt ở V5-61) sẽ không biết nơi nào là chuẩn.
- Đề xuất sửa:
  - BE-D chuyển tệp sang `shared/rate-limit-counter.ts` trước khi gộp #120: một tệp, 2 import, không đổi hành vi. `shared/savepoint.ts` đã là tiền lệ hàm chạm DB đặt ở `shared/`. Test SR-RL-11 giữ nguyên (SEC mục 4).
  - Nếu ARC muốn giữ ở `public-site/public`, ARC sửa chữ 1.26 ở 0.3.14 và ghi lý do. BE đề nghị cách thứ nhất.
- Hạn: trước khi gộp #120. Không chặn #111.
- Trạng thái: Open

#### FB-R5-BE-ARC-C0313-27
- Mức độ: Minor – gửi ARC (chữ), QA (ca T58), BE-D (test #120)
- Vị trí:
  - `setPropertyWifi` (`openapi.yaml` 1956–1966);
  - contract 1.25, T58-11, T58-14, T58-15 (dòng 746–750);
  - #120 `callerPasswordWindowStart`.
- Vấn đề:
  - "Cửa sổ cố định 24 giờ" chưa nói cửa sổ bắt đầu lúc nào.
    - #120 lấy `floor(now / 86 400 000)`: cửa sổ là ngày UTC, đổi lúc **07:00 giờ Việt Nam**, giống khóa ngày theo IP của SR-RL-11 (`countIp`).
    - Trang công khai còn cách thứ hai: ngày theo giờ cơ sở (`bump`, `expires_at` = đầu ngày + 2 ngày).
    - Hai BE đọc cùng chữ có thể chọn khác nhau.
  - T58-11 ghi "6 lần … trong 24 giờ". Nếu 6 lần nằm hai bên 07:00 thì lần thứ 6 vẫn được so, vì đếm lại từ 1 ở cửa sổ mới. Ca chạy trên đồng hồ thật sẽ chập chờn quanh 07:00.
  - T58-15 ghi "`login_lockout` của người gọi không đổi". Nhưng `login_lockout` là **tham số** (erd 9.3), không phải trạng thái. Trạng thái khóa nằm ở `app_user.failed_login_count`, `locked_until`, `status`. Ca chưa nói kiểm cột nào.
- Vì sao quan trọng: ca kiểm sai chỗ thì vẫn xanh mà không chứng minh gì; ca chạy theo đồng hồ thật thì đỏ giả.
- Đề xuất sửa:
  1. ARC ghi (0.3.14, hoặc ngay ở #111 nếu còn sửa chữ): "cửa sổ = ngày UTC (07:00 → 07:00 giờ Việt Nam); `window_start` = 00:00Z; `expires_at` = `window_start` + 24 giờ; cùng cách tính với khóa ngày theo IP của SR-RL-11".
  2. T58-11: "trong cùng một cửa sổ (đồng hồ thử cố định)". Thêm **T58-17**: 5 lần lúc 06:50 và lần thứ 6 lúc 07:05 giờ Việt Nam → lần thứ 6 có so, đếm = 1 ở dòng mới. Ca này ghi lại đúng điều SEC đã chấp nhận ("tới 10 lần ở chỗ giáp hai cửa sổ").
  3. T58-15: "`app_user.failed_login_count`, `locked_until`, `status` không đổi; đăng nhập lại được ngay".
- Hạn: trước khi QA viết ca T58. BE-D sửa test của #120 nếu đang khác. Không chặn #111.
- Trạng thái: Open

#### FB-R5-BE-ARC-C0313-28
- Mức độ: Minor – gửi ARC (chữ), BE-D (PR-B3)
- Vị trí:
  - `resolveAttentionEvent` (`openapi.yaml` 2434–2475);
  - `recordPayment` (B), dòng 5880–5882; `listAuditEvents.afterClosureOnly`, 7308–7316;
  - `AttentionItem` 11341 (`deposit_after_cancel` mức `warning`);
  - mã `attention.service.ts` 100–141 (`note` chỉ bắt buộc khi `severity = critical`).
- Vấn đề:
  - SEC S8, chữ ở `recordPayment` (B) và ở `afterClosureOnly` đều nói "Không thấy tiền" **bắt buộc ghi chú** và ghi audit `money` `attention_event.resolved`.
  - Mô tả của chính `resolveAttentionEvent` chưa có hai điều này:
    - mô tả chỉ bắt `note` với mục `critical`, mà `deposit_after_cancel` ở mức `warning`;
    - mô tả 422 của operation chưa có `REASON_REQUIRED` cho kind này.
  - Người viết PR-B3 đọc operation sẽ hiểu ghi chú không bắt buộc. Desk đọc operation sẽ không bắt điền ô ghi chú.
- Vì sao quan trọng: S8 là tiêu chí SEC bắt buộc khi 5B-1 lên. Chữ ở chỗ người cài đọc trước lại nói ngược.
- Đề xuất sửa:
  - ARC thêm vào mô tả `resolveAttentionEvent` (chỉ chữ, ở #111 hoặc delta tài liệu trước PR-B3): "`deposit_after_cancel` (0.3.13 bổ sung 1, SEC S8): đóng tay = 'Không thấy tiền'; `note` bắt buộc 3–500 ký tự ở mọi mức (`REASON_REQUIRED`); cùng giao dịch ghi audit `money` `attention_event.resolved`, `after = {kind, afterClosure: true}`, không có `note`". Thêm `REASON_REQUIRED` của kind này vào mô tả 422.
  - Mã PR-B3: một nhánh trong `resolve()` (theo `kind`: bắt ghi chú, ghi audit). Không migration.
- Hạn: trước khi PR-B3 viết `resolve`. Không chặn #111.
- Trạng thái: Open

#### FB-R5-BE-ARC-C0313-29
- Mức độ: Suggestion – gửi ARC (chữ), BE-B (#119), QA
- Vị trí:
  - contract 1.26, dòng C0313-25 ("BE-B/BE-D: hàm `isCardNumberReference`"; "BE làm ở PR-B3 và bản sửa `executeRefund`" ở mục 8 của tệp phản hồi ARC);
  - `recordPayment` (B) 5870–5873;
  - #119 @ `4cc06646`, `payment.service.ts` `checkPaymentShape`.
- Vấn đề:
  - (a) Đã có nơi cài: #119 (BE-B, BUG-R5-006) thêm `isCardNumberReference` và `assertNotCardNumberReference` ở `shared/validation.ts`, áp cho `executeRefund` và `checkPaymentShape` (mọi đường `PaymentCreate`). Chữ 1.26 còn ghi người làm "BE-B/BE-D" và "ở PR-B3", nên dễ hiểu là PR-B3 viết lại hàm này.
  - (b) Thứ tự lỗi chưa chốt.
    - Ở #119, `bankReference` giống số thẻ ném 422 `CARD_NUMBER_DETECTED` ngay trong `checkPaymentShape`, kể cả khi trường khác đã có lỗi dạng.
    - Còn `note` chỉ được kiểm V-09 sau khi không còn lỗi dạng nào.
    - Hai lỗi mang mã khác nhau (`CARD_NUMBER_DETECTED` và `VALIDATION_FAILED`). Thân có cả hai lỗi thì trả mã nào là tùy người viết.
    - An toàn không bị ảnh hưởng: cả hai đường đều không ghi gì.
- Đề xuất sửa:
  - (a) ARC ghi: "hàm ở #119 (BUG-R5-006); PR-B3 chỉ dùng lại; bản sửa `executeRefund` lên cùng #119, không chờ PR-B3" (khớp SEC 4.4).
  - (b) ARC chọn một thứ tự. BE đề nghị làm như `note`: báo lỗi dạng của mọi trường trước (`VALIDATION_FAILED`); chỉ trả `CARD_NUMBER_DETECTED` khi không còn lỗi dạng. Nếu ARC chọn cách này, BE-B chỉnh trong #119. QA chưa viết ca "thân có cả hai lỗi" cho tới khi chốt.
- Hạn: trước khi gộp #119. Không chặn #111.
- Trạng thái: Open

#### FB-R5-BE-ARC-C0313-30
- Mức độ: Suggestion – gửi ARC (chữ), QA
- Vị trí: contract 1.3, T14-4 (dòng 173); `quote-pricing.ts` 220–224.
- Vấn đề: T14-4 ghi "Kênh OTA (có hoặc không `nightlyRates`) → `NOT_IN_LIST` (`channelId`)". Nhưng mã kiểm thân `nightlyRates` (đủ đêm, đúng ngày, số dương) **trước** kênh, theo 1.17 "thân lệnh → kênh". Vì vậy OTA kèm `nightlyRates` sai dạng trả lỗi ở `nightlyRates`, không phải ở `channelId`.
- Đề xuất sửa: đổi thành "Kênh OTA (không có `nightlyRates`, hoặc `nightlyRates` đúng dạng)". Không đổi mã.
- Trạng thái: Open

---

## 3. Ảnh hưởng tới các làn

| Làn | Việc thêm | Ước |
|---|---|---|
| BE-C | Không. PR-C1 (#121) không chạm tệp nào của 1f | 0 |
| BE-D | #120: chuyển hàm sang `shared/` (thẻ 26), sửa test T58 theo mốc cửa sổ (thẻ 27). PR-B3: nhánh `resolve` theo `kind` đã tính ở 7.8.2 của review 0.3.13 | +0,1 ngày |
| BE-B | #119: chỉnh thứ tự lỗi nếu ARC chọn như đề xuất (thẻ 29 (b)) | < 0,1 ngày |
| BE-H | Không. #110 khớp chữ "gõ tay" | 0 |

- Không làn nào phải chờ #111 mới chạy được: #119 và #120 không dựa vào chữ 1f để cài.
- PR-B3 phải gộp **sau** #111 (điều kiện 1 của ARC-20).

---

## 4. Điểm làm tốt (nên giữ)

- 1.26 tách rõ phần "đổi phần mở rộng" (một chỗ) khỏi phần "chỉ chữ". Mã sinh và hằng `MONEY_AUDIT_ACTIONS` lên cùng PR, nên CI không có lúc đỏ.
- Test ARC-16 so danh sách vai của `ApprovalRequest` với `Payment` qua mã sinh. Về sau hai trường không lệch nhau được.
- "Không `x-rate-limit`" ghi kèm lý do, nên QA không sinh ca 429 giả.
- Chữ FDL 2FA đủ 6 chỗ, có mục 0.3.14 cho hàm 0079. BE tìm trong mã không thấy chỗ nào còn dùng danh sách vai riêng.

---

## 5. Giả định đã dùng

- Mã ở `main` @ `16ea5183` dùng để đối chiếu. Từ gốc #111 (`dce1c0fd`) tới đó, các PR đã gộp (#103, #109, #117) và các commit tài liệu, fixture không chạm tệp hợp đồng của #111. GitHub báo #111 `MERGEABLE`.
- `deposit_after_cancel` ở mức `warning`, theo mô tả `AttentionItem` (dòng 11341). Chưa có mã sinh mục này để kiểm.
- #110, #119, #120 còn mở; BE đọc ở SHA ghi trên, các PR này có thể còn đổi.
- CI của #111 lúc đọc: 8 job đạt, E2E smoke còn chạy. Kết luận DUYỆT không phụ thuộc E2E, vì #111 chỉ đổi chữ, một khóa mở rộng và một hằng. ORC gộp khi E2E xanh, như SEC đã ghi.
- Không cần ESC: các điểm cần chốt thuộc quyền ARC (chữ), BE-D và BE-B (mã của PR đang mở) và QA (ca).

---

Dòng đề xuất cho `01-decisions/decision-log.md` (ORC ghi):

`| 2026-11-07 | 5 | **BE – review vai BE hợp đồng 0.3.13 bổ sung 1f (PR #111 @ 90adc56d): DUYỆT** (rounds/round-05/reviews/BE-on-contract-0313-addendum-1f.md). 0 Blocker, 0 Major. Mọi chữ chạm BE cài được không migration: SR-RL-15 trên rate_limit_counter 0086 (UPSERT trùng bumpAt, job public_site.cleanup dọn cả dòng Wi-Fi, giao dịch riêng trước UnitOfWork như PasswordReauth); C0313-25 chỉ hai chỗ kiểm (checkPaymentShape, executeRefund) và không chặn thêm mã đang qua; ARC-20 cài được ở PR-B3; chữ FDL 2FA khớp MFA_REQUIRED_ROLES ở 6 chỗ; ARC-16, A2, T14-4, BR-438 typedByHand khớp mã. Thẻ Minor: C0313-26 (hàm UPSERT về shared/ trước khi gộp #120 – #120 đang để ở public-site/public, identity phụ thuộc ngược), C0313-27 (cửa sổ = ngày UTC 07:00 giờ VN; T58-11 đồng hồ cố định, thêm T58-17, T58-15 kiểm app_user.failed_login_count/locked_until/status), C0313-28 (resolveAttentionEvent: note bắt buộc và audit attention_event.resolved cho deposit_after_cancel, trước PR-B3). Suggestion: C0313-29 (C0313-25 đã ở #119, thứ tự CARD_NUMBER_DETECTED với lỗi dạng), C0313-30 (T14-4 nightlyRates đúng dạng). Không ESC | BE | Quyền BE (review vai người cài đặt) |`
