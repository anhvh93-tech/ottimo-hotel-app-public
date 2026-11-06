# BE – Review hợp đồng 0.3.13 bổ sung 1g (ARC, PR #132)

Round 5 · bước **Review** · BE (làn BE-A1) · 07/11/2026

Đối tượng:
- PR #132, nhánh `r5-contract-docs-1g`, commit `c249deb0` (gốc `main` @ `7a141dbf`), 4 tệp, chỉ chữ:
  - `openapi.yaml`: mô tả ở bảng mã lỗi, `setPropertyWifi`, `resolveAttentionEvent`, `recordPayment` (B), `executeRefund.bankReference`, `PaymentCreate.bankReference`;
  - mã sinh `api-client/src/generated/openapi.ts`;
  - `contract-0.3.13.md`: T14-4, T58-11/15/17, dòng C0313-25 ở 1.26, danh sách 0.3.14, mục mới 1.28;
  - `ARC-on-contract-0.3.13-reviews.md` mục 9.
- Phạm vi ORC giao: đọc từ góc người cài đặt và viết test.
  1. Mọi luật cài và test được, không trái mã đã có trên `main` (#112, #119, #127, #139, #114 đã gộp).
  2. Câu trả lời C0313-26…30 khớp điều BE hỏi ở `BE-on-contract-0313-addendum-1f.md`.
  3. Danh sách test bắt buộc ở PR-B3 đủ và test được.

BE đối chiếu với `main` @ `6a805da1` (phần `src/` giống `04ebdf46`):
- `shared/validation.ts` 90–113 (`isCardNumberReference`, `assertNotCardNumberReference`);
- `payments/public/payment.service.ts` 149–211 (`checkPaymentShape`);
- `payments/internal/refunds.service.ts` 655–677, 715–768 (`payOut` của `executeRefund`);
- `reservations/internal/reservations.service.ts` 1941–1972 (`parseInitialPayment`);
- các bộ đọc `PaymentCreate`:
  - `payments.controller.ts` 46–56;
  - `deposits.controller.ts` 27–37;
  - `checkin.service.ts` 1258–1276;
  - `checkout.service.ts` 2157;
  - `platform/public/validation.ts` 42–46 (`parseBody`);
- `events/internal/attention.service.ts` 100–141;
- `audit/public/money-actions.ts` 69;
- `audit/internal/audit-log.controller.ts` 83;
- `shared/http/auth.guard.ts` 196, 439, 492–513;
- `files/internal/upload-session.check.ts` 58;
- `identity/public/mfa-roles.ts`;
- `folio/public/folio.service.ts` 1150–1155;
- `folio/internal/folio.controller.ts` 89;
- test:
  - `v09-reference-card-units.test.ts`;
  - `payments-s3.test.ts` 2510;
  - `architecture.test.ts` 205, 244–245, 295–297, 306–331;
  - `v105-be-d1-mfa-fdl.test.ts` 130;
- `product/docs/security/security-requirements.md` 180 (SR-PAY-10 bản 07/11);
- `rounds/round-05/outputs/UXD/copy-v1.0.5.md` 994.

PR đang mở, BE đọc ở SHA ghi dưới. Mục đích chỉ là xem chữ 1g rơi vào mã ra sao; đây không phải review các PR này:
- #148 (`r5-b3` @ `d533a387`, BE-D2, PR-B3);
- #120 (`r5-v5-58` @ `9a22e0ef`, BE-D, V5-58).

BE chỉ đọc (`gh pr diff`, `git show`), không sửa mã của PR nào, không gọi staging hay production. Tệp này không có mật khẩu, bí mật, số thẻ thật hay dữ liệu khách. Số thẻ nhắc tới đều là số thẻ thử công khai.

---

## 0. Kết luận: **DUYỆT** để gộp PR #132 @ `c249deb0`

0 Blocker · 0 Major · 2 Minor · 1 Suggestion. Không thẻ nào chặn gộp #132.

- Câu trả lời C0313-26…30 khớp điều BE hỏi ở 1f, phần lớn dùng đúng chữ BE đề nghị.
  - Chữ C0313-26 và 27 khớp mã #120.
  - Chữ C0313-28 khớp mã #148.
  - Luật ô mã theo SR-PAY-10 bản 07/11 khớp từng nhánh `isCardNumberReference` trên `main`.
  - "8 chữ số cuối" khớp chuỗi UXD.
- Chỗ chưa chặt nằm ở chữ hướng dẫn cài đặt và test, không ở schema:
  - câu thứ tự lỗi "như `note`" có thể đọc hai cách, và #148 đang làm ngược chữ (thẻ 31);
  - danh sách test PR-B3 dẫn danh sách cũ, thiếu ca thứ tự, và giữ một câu mô tả trái `main` (thẻ 32);
  - mục 0.3.14 về `auth_resolve_session` chưa tính tới chỗ gọi hàm với một tham số (thẻ 33).
- Cả ba sửa bằng chữ ở delta tài liệu sau (cùng 1h #147 hoặc 1i) và bằng test trong #148. Hạn của thẻ 31 và 32 là trước khi gộp #148. Không cần ESC.

| Thẻ | Mức | Nội dung | Hạn |
|---|---|---|---|
| C0313-31 | Minor | "Thứ tự lỗi như `note`" không có nghĩa duy nhất: trên `main`, `note` có hai thứ tự khác nhau. Đọc theo chữ thì trái BUG-R2-043 (`posAuthCode`). Câu "`executeRefund` đã theo thứ tự này" chỉ đúng một phần. #148 giữ thứ tự số thẻ trước | Trước khi gộp #148 |
| C0313-32 | Minor | Danh sách test PR-B3: (ii) dẫn SEC-responses 4.3 (luật 1f) thay vì SR-PAY-10 bản 07/11. Chưa buộc ca HTTP ở từng đường, mà bộ đọc quên khai trường thì bị bỏ im lặng. Thiếu ca thứ tự. Câu "từ chối trường lạ" trái `main`. `GroupDepositInput` là R3 | Trước khi gộp #148 |
| C0313-33 | Suggestion | 0.3.14 `auth_resolve_session(p_mfa_roles)`: đổi chữ ký nên phải DROP và cấp quyền lại. Có 2 chỗ gọi trong `src` (guard và `upload-session.check.ts`) và 4 chỗ trong test. Đề nghị `DEFAULT NULL` | Khi viết migration 0.3.14 |

---

## 1. Đối chiếu với mã – từng mục

### (1) "8 chữ số cuối" (UXD ARC-111-01, SEC ARC-24 ý 2)

- Khớp từng chữ chuỗi `pay.bank_reference_card_like` ở `copy-v1.0.5.md` 994, cả VI lẫn EN (bản 2.1, 1022).
- Đúng với luật: 8 chữ số ngắn hơn ngưỡng 13, nên không bao giờ thành ranh giới bị chặn.
- Chặn trùng S4 vẫn chạy, vì ai gặp cùng mã cũng nhập cùng 8 chữ số. Không có việc cho BE.

### (2) Luật ô mã theo SR-PAY-10 bản 07/11 (C0313-25 cập nhật; SEC 119-01, ARC 119-03)

Chữ 1g khớp `isCardNumberReference` (`shared/validation.ts` 90–98, #119) ở từng nhánh:

| Chữ 1g | Mã trên `main` |
|---|---|
| "tách theo `.` `/` `_` `-`, ghép dần các nhóm từ đầu" | `split(REFERENCE_SEPARATOR)`, `digits += group` |
| "Vượt 19 ký tự trước ranh giới đạt → nhận" | `digits.length > 19 → false`. Mã đếm **ký tự**, kể cả chữ cái, đúng như chữ "ký tự" của 1g |
| "13–19 chữ số, không chữ cái, **và** qua Luhn" | `length >= 13 && luhnValid(digits)`. `luhnValid` trả `false` khi có ký tự không phải số, nên chữ cái làm hỏng mọi ranh giới sau nó |
| "mã chữ đứng đầu luôn được nhận; … `…-EXP1228` bị chặn" | `FT2629-0012345671`, `FT-4111…` được nhận; `…-EXP1228`, `…-CVV123`, `…/1228` bị chặn (`v09-reference-card-units.test.ts` 22–70) |

- Số thẻ dính liền chữ, không dấu tách (`4111111111111111EXP1228`), được nhận. SEC đã chấp nhận rủi ro này ở SR-PAY-10. Chữ "nối sau" của 1g hiểu là nối sau dấu tách, nên khớp mã.
- Không mã lỗi mới, không đổi schema.
- Chuẩn hóa chữ hoa (ARC-15) không đụng tới chữ số, nên không đổi kết quả luật.
- Mô tả `executeRefund.bankReference` "sửa ở v1.0.5 (#119)": đúng, #119 đã gộp ở `f84cd605`.

### (3) C0313-29 – nơi cài và thứ tự lỗi

(a) **Khớp điều BE hỏi.**
- Hàm nằm ở #119. `executeRefund` được sửa cùng #119. PR-B3 chỉ dùng lại; #148 đúng như vậy (`readBankReference` gọi `assertNotCardNumberReference`).
- Câu "trước đó trường chưa tới được qua HTTP" đúng: cả 5 bộ đọc trên `main` đều không khai `bankReference`.

(b) **Khớp điều BE hỏi, nhưng chính đề nghị của BE ở 1f chưa đủ chặt.** Đối chiếu mã thấy bốn điểm, gom ở thẻ 31:
- `note` không có một thứ tự chung:
  - ở `checkPaymentShape` (209), V-09 của `note` chạy **sau** lỗi dạng;
  - ở `parseInitialPayment` (1952–1955) và `executeRefund` (662), V-09 của `note` chạy **trước** mọi lỗi khác.
- `posAuthCode` cố ý chạy V-09 trước độ dài (BUG-R2-043: `payment.service.ts` 185–186, `payments.controller.ts` 51, `deposits.controller.ts` 32, test `payments-s3.test.ts` 2510).
  - Nếu đọc câu "lỗi dạng của mọi trường trước; chỉ trả `CARD_NUMBER_DETECTED` khi không còn lỗi dạng" cho cả ô này, thì số thẻ 16 chữ số ở `posAuthCode` sẽ trả `TOO_LONG`, và test BUG-R2-043 đỏ.
- "`executeRefund` đã theo thứ tự này" chỉ đúng một phần:
  - Đúng với các kiểm từ thân lệnh, ném trước luật số thẻ: `paidAt` dạng, `amountVnd`, mẫu `bankReference` (663–673).
  - Các lỗi `VALIDATION_FAILED` cần dòng yêu cầu chạy **sau** luật số thẻ (677): `REQUIRED` và `EVIDENCE_REQUIRED` (760–766), hạn `paidAt` (715–718).
  - Ví dụ: thân thiếu ảnh chứng từ, ô mã giống số thẻ → hôm nay trả `CARD_NUMBER_DETECTED`.
- #148 @ `d533a387` làm ngược chữ 1g:
  - `readBankReference` (`shared/validation.ts` 142 của #148) ném `CARD_NUMBER_DETECTED` ngay, trước khi `checkPaymentShape` (240–244) và `deposits.controller.ts` (99–101) trả lỗi đã gom;
  - kiểm phương thức (`NOT_ALLOWED`) chạy sau kiểm số thẻ;
  - tức là #148 giữ thứ tự của #119 (số thẻ trước).

An toàn không bị ảnh hưởng: theo cách nào cũng không ghi gì. Vấn đề chỉ là hợp đồng, mã và test sắp tới nói ba điều khác nhau.

### (4) Danh sách test bắt buộc ở PR-B3 (SEC ARC-24 ý 1)

Mọi ca đều test được với dữ liệu thử.
- **(i) ARC-21.** SAL có `recordPayment` và có `confirmDeposit` (`x-roles` gồm `sales_staff`, `x-scope: own`), nên cả hai ca viết được.
  - #148 có ca SAL ở `recordPayment` (`pr-b3-bank-reference.test.ts` 228) và ca FD ở `confirmDeposit` (317).
  - **Chưa có ca SAL `confirmDeposit` 409 không có mã đơn.** Chữ 1g đã rõ, nên BE-D2 chỉ cần thêm ca, không cần thẻ.
- **(ii) C0313-25.** Danh sách dẫn nguồn cũ (thẻ 32 (a)).
- **(iii) ARC-20.**
  - Cài được: `MONEY_AUDIT_ACTIONS` đã có `attention_event.resolved` (`money-actions.ts` 69, #111); PR-B3 thêm vào `AFTER_CLOSURE_ACTIONS` (`audit-log.controller.ts` 83).
  - #148 có ca đọc lại `audit_event` và ca qua `afterClosureOnly` (`pr-b3-after-closure.test.ts` 613).
- Thiếu (thẻ 32):
  - ca HTTP ở **từng** đường;
  - ca thứ tự lỗi;
  - ca âm của C0313-28.

### (5) C0313-26, 27 – bộ đếm Wi-Fi (đối chiếu #120 @ `9a22e0ef`)

- **26 khớp.** Hàm nằm ở `shared/rate-limit-counter.ts` (#120 đã chuyển tệp), nên `identity` không còn import `public-site`. Lý do "phụ thuộc vòng" ở 1.28 đúng với điều BE nêu.
- **27 khớp.**
  - `callerPasswordWindowStart` = `floor(now / 24 h)` qua `CLOCK`, nên `window_start` = 00:00Z.
  - `bumpRateLimitCounter` đặt `expires_at` = `window_start` + `windowMs` (+24 giờ). Cách tính giống khóa ngày theo IP của SR-RL-11.
  - T58-11 chạy trên đồng hồ giả (T0 15/10/2026 09:00 giờ Việt Nam). T58-15 kiểm `app_user.failed_login_count`, `locked_until`, `status`.
  - **T58-17 chưa có ở #120.** 1.28 đã giao BE-D thêm ca này; BE-D thêm trước khi gộp #120.

### (6) C0313-28 – `resolveAttentionEvent` với `deposit_after_cancel`

- Chữ 1g khớp nguyên văn đề nghị 1f: `note` bắt buộc 3–500 ký tự (`REASON_REQUIRED`); audit `money` `attention_event.resolved` với `after = {kind, afterClosure: true}`, không có `note`. 1g cập nhật cả mô tả 422 và mô tả trường `note`.
- Cài được bằng một nhánh, không migration:
  - `attention.service.ts` 129–134 (`severity === 'critical'`) thêm điều kiện `kind = deposit_after_cancel`;
  - ghi `recordMoney` cùng giao dịch.
  - `deposit_after_cancel` không thuộc `ATTENTION_SYSTEM_CLOSED`, nên đóng tay được.
  - Thứ tự 404/409 (đọc dòng) trước 422 (ghi chú) giữ như mục `critical` hôm nay.
  - #148 làm đúng như vậy.

### (7) C0313-30 – T14-4

Chữ 1g khớp nguyên văn đề nghị 1f và khớp `quote-pricing.ts` (#103): thân lệnh được kiểm trước, rồi mới tới kênh. Không đổi mã.

### (8) Danh sách 0.3.14

- **SEC ARC-23 (`auth_resolve_session(p_mfa_roles)`).**
  - Hướng đúng, cài được.
  - Ba điều kiện SEC kiểm được trên mã hiện có. Từ #124, guard dùng chung một vị từ `holdsMfaRequiredRole` với đăng nhập và `getMe`.
  - Còn thiếu phần chỗ gọi hàm và quyền (thẻ 33).
- **UXD ARC-112-02.** BE ghi chú, không lập thẻ:
  - Trên `main`, `OpenRefund` chỉ gom `approval_request` có `type = 'refund'` (`folio.service.ts` 1150–1155). Mã lý do của các dòng này do máy chủ đặt (`overpayment` và các mã tương tự).
  - Mã gõ tay duy nhất là `requestFoc.reasonCode` (`folio.controller.ts` 89, `type = 'foc'`), mà loại này không vào `OpenRefund`. Vậy hôm nay không có đường nào làm mã trùng.
  - Khi làm 0.3.14, ARC nên nêu operation cụ thể trước khi chọn 422. Nếu 422 đặt ở `requestFoc`, nó sẽ chặn cả mã FOC hợp lệ như `other` mà không đem lại gì.
- **DOM ARC-120-01, DOM BE-121-02.** Đã có ở 1.27, không có việc mới.
- **Chữ nhỏ.** Câu mở đầu 1.28 ghi "Chỉ mô tả `openapi.yaml`, `erd.md` …", nhưng PR không đổi `erd.md`; dòng "ORC (3)" giải thích lý do. Không lập thẻ.

---

## 2. Thẻ feedback

#### FB-R5-BE-ARC-C0313-31
- Mức độ: Minor – gửi ARC (chữ), BE-D2 (#148), QA
- Vị trí:
  - `recordPayment` (B), `openapi.yaml` 5883–5884 @ `c249deb0`: "Thứ tự lỗi như `note` … (`executeRefund` đã theo thứ tự này …)";
  - contract 1.28, dòng BE C0313-29 (822);
  - mã: như mục 1 (3) (b).
- Vấn đề:
  - "Như `note`" không có nghĩa duy nhất: `note` chạy sau lỗi dạng ở `checkPaymentShape`, nhưng chạy trước mọi lỗi ở `parseInitialPayment` và `executeRefund`.
  - "Lỗi dạng của mọi trường trước; chỉ trả `CARD_NUMBER_DETECTED` khi …" chưa giới hạn ô. Áp cho `posAuthCode` thì trái BUG-R2-043 và làm đỏ test hồi quy của lỗi đó.
  - "`executeRefund` đã theo thứ tự này" sai với `EVIDENCE_REQUIRED`, `REQUIRED` và hạn `paidAt`, vì các kiểm này chạy sau luật số thẻ.
  - #148 giữ thứ tự số thẻ trước, tức là làm ngược chữ 1g, và không có test ghim thứ tự.
- Vì sao quan trọng:
  - ARC review #148 theo chữ 1g sẽ bắt đổi thứ tự.
  - Người cài đọc chữ "mọi trường" có thể đụng vào `posAuthCode`.
  - QA viết ca "thân có cả hai lỗi" theo cách đọc nào cũng có thể đỏ.
- Đề xuất sửa: ARC chọn một trong hai cách và giới hạn câu vào ô `bankReference`.
  - **(B) – BE đề nghị: số thẻ ở ô mã báo trước.** `bankReference` qua mẫu mà giống số thẻ thì trả 422 `CARD_NUMBER_DETECTED` ngay, như `posAuthCode` (BUG-R2-043), như `main` (#119) và như #148 đang làm. Không đổi mã.
    - Một luật chung cho cả hai ô mã của cùng thân `PaymentCreate`.
    - Giá trị bị chặn sớm nhất.
    - An toàn như cách (A), vì cả hai cách đều không ghi gì. Người dùng sửa hai lượt ở cả hai cách.
  - (A) Giữ lựa chọn của 1g, nhưng ghi rõ:
    > "Chỉ ô `bankReference`: lỗi kiểm được từ thân lệnh, không đọc DB, của mọi trường (kể cả mẫu và `NOT_ALLOWED` của chính ô này) được gom và báo trước. `CARD_NUMBER_DETECTED` của `bankReference` chỉ trả khi không còn lỗi đó. `posAuthCode` giữ BUG-R2-043. `note` giữ thứ tự hiện có của từng đường. Ở `executeRefund`, các kiểm cần dòng yêu cầu chạy sau, giữ nguyên."

    Với cách này, #148 phải đổi `readBankReference` thành trả cờ "giống số thẻ" thay vì ném lỗi. 3 chỗ gọi (`checkPaymentShape` – dùng cho `recordPayment`, `checkIn`, `checkOut`; `deposits.controller.ts`; `parseInitialPayment`) kiểm cờ đó sau `errors.length`. `recordManual` giữ kiểm chốt cuối như hiện có. Ước khoảng 0,25 ngày kể cả test.
  - Cách nào cũng vậy: bỏ chữ "như `note`", và bỏ câu "`executeRefund` đã theo thứ tự này" hoặc giới hạn nó vào các kiểm từ thân lệnh.
  - BE nhận phần của mình: đề xuất C0313-29 (b) ở 1f viết "như `note`" khi chưa đối chiếu đủ các đường.
- Hạn: trước khi gộp #148. Không chặn #132.
- Trạng thái: Open

#### FB-R5-BE-ARC-C0313-32
- Mức độ: Minor – gửi ARC (chữ), BE-D2 (#148), QA
- Vị trí:
  - `recordPayment` (B), `openapi.yaml` 5889 ("mọi đường … `GroupDepositInput`") và 5892–5897 (test bắt buộc ở PR-B3);
  - `PaymentCreate.bankReference`, 12957 ("Máy chủ chưa có PR 5B-1 thì từ chối trường lạ").
- Vấn đề:
  - **(a) (ii) dẫn nguồn cũ.**
    - `SEC-responses.md` 4.3 là danh sách viết cho luật 1f ("toàn bộ giá trị").
    - 1g đã sửa vài ca ngay trong câu (mã chữ đứng đầu, 8 chữ số cuối, `…-EXP1228`, `…/1228`). Nhưng nguồn chuẩn hiện là cột kiểm của SR-PAY-10 bản 07/11 (`security-requirements.md` 180), và nguồn này có thêm:
      - `…-CVV123` → 422;
      - `20261107-000105` → 422 (cố ý chặn thừa);
      - `20261107-000123`, `FT2629-0012345671`, `FT-4111…` → nhận.
    - Hai nguồn khác nhau thì QA không biết theo nguồn nào.
    - Mọi ca này đã có ở mức hàm và mức `checkPaymentShape` trên `main` (`v09-reference-card-units.test.ts`, #119).
  - **(b) Chưa buộc ca HTTP ở từng đường.**
    - `parseBody` dùng `z.object` thường: khóa lạ bị bỏ, không báo lỗi (`platform/public/validation.ts` 42–46).
    - `checkIn`, `checkOut`, `parseInitialPayment` dựng object riêng, nên trường không khai cũng mất.
    - Hệ quả: bộ đọc nào quên khai `bankReference` thì trả 201, không lưu mã, mất chặn trùng S4, mà không ca nào đỏ trừ ca HTTP của chính đường đó.
    - Cùng lý do đó, câu "Máy chủ chưa có PR 5B-1 thì từ chối trường lạ" trái `main`: hôm nay máy chủ bỏ trường này im lặng. 1g sửa đúng dòng mô tả này nhưng giữ câu.
  - **(c) Không có ca thứ tự lỗi** (thẻ 31). 1.28 để QA viết "sau PR-B3", nên #148 lên mà không có test ghim thứ tự.
  - **(d) `GroupDepositInput` là R3.** `allocateGroupDeposit` và `createReservationGroup` chưa có trên `main`, nên ca "mọi đường" ở đường này chưa viết được.
  - **(e) (iii) chỉ có ca dương.** Chưa có ca thiếu ghi chú. #148 đã có ca này (613), nhưng danh sách bắt buộc nên ghi để hồi quy không mất.
- Đề xuất sửa (chữ; #148 thêm test còn thiếu):
  - (ii) đổi thành:
    > "C0313-25 theo SR-PAY-10 bản 07/11. Cả danh sách ở mức hàm và `checkPaymentShape` đã có ở `v09-reference-card-units.test.ts` (#119), PR-B3 không chép lại. PR-B3 thêm ca HTTP ở **từng** đường `recordPayment`, `confirmDeposit`, `checkIn.payment`, `checkOut.finalPayment`, `ReservationCreate.initialPayment`: một số thẻ thử → 422 có tiền tố trường, không ghi gì; một mã thường viết chữ thường → 201, lưu chữ hoa; một mã trùng → 409. `GroupDepositInput`: khi R3 làm."
  - Thêm (iv):
    > "Thứ tự lỗi theo C0313-31: thân có lỗi dạng ở trường khác **và** `bankReference` giống số thẻ → mã đã chốt, không ghi gì."
  - Thêm vào (iii):
    > "`note` thiếu, ngắn hoặc chỉ có ký tự ẩn → 422 `REASON_REQUIRED`, mục còn mở, không có dòng audit."
  - Sửa câu ở `PaymentCreate.bankReference`:
    > "Máy chủ chưa có PR-B3 bỏ qua trường này, không báo lỗi – Desk chỉ gửi khi PR-B3 lên."
  - #148 đã có ca HTTP ở cả 5 đường và ở `recordManual`. Còn thiếu: SAL `confirmDeposit` 409 không có mã đơn (i), và ca thứ tự (iv).
- Hạn: phần test trước khi gộp #148; phần chữ ở delta tài liệu sau. Không chặn #132.
- Trạng thái: Open

#### FB-R5-BE-ARC-C0313-33
- Mức độ: Suggestion – gửi ARC (chữ 0.3.14), BE-D (khi viết migration), SEC
- Vị trí:
  - contract 1.26, danh sách 0.3.14 (795) và mục 7 @ `c249deb0`;
  - mã trên `main`:
    - `auth.guard.ts` 439;
    - `upload-session.check.ts` 58;
    - `architecture.test.ts` 205, 244–245, 295–297, 306, 309, 331;
    - `v105-be-d1-mfa-fdl.test.ts` 130;
    - `mfa-roles.ts` (chú thích dòng 5–8);
    - migration 0005 dòng 45–62 (tiền lệ DROP rồi cấp quyền lại).
- Vấn đề:
  - Thêm `p_mfa_roles text[]` là đổi chữ ký hàm. PostgreSQL không cho `CREATE OR REPLACE` khi danh sách tham số đổi. Migration phải `DROP FUNCTION auth_resolve_session(text)`, tạo hàm mới, rồi `REVOKE … FROM PUBLIC` / `GRANT EXECUTE … TO ottimo_app` theo chữ ký mới.
  - Trong `src` có **2** chỗ gọi hàm với một tham số, không chỉ guard: `upload-session.check.ts` 58 cũng gọi. Trong test có thêm 4 chỗ.
  - Nếu không DROP bản cũ:
    - bản `(text)` còn ghi cứng `owner`, `manager`, trái điều kiện "SQL không chứa tên vai";
    - `architecture.test.ts` (295–297) kiểm quyền của mọi bản cùng tên.
  - Nếu DROP mà không có `DEFAULT`:
    - `upload-session.check.ts` lỗi lúc chạy (hàm không tồn tại);
    - trong khoảng migration đã chạy mà api cũ còn nhận request, mọi request có phiên đều lỗi.
- Đề xuất sửa: chữ 0.3.14 ghi thêm:
  - `p_mfa_roles text[] DEFAULT NULL`; NULL → `mfa_required = false`, và SQL vẫn không chứa tên vai;
  - `DROP` bản `(text)`, cấp quyền theo chữ ký mới như 0005;
  - guard truyền `MFA_REQUIRED_ROLES`; `upload-session.check.ts` giữ một tham số (chỗ này không đọc `mfa_required`);
  - `architecture.test.ts` thêm ca "chỉ có đúng một bản `auth_resolve_session`";
  - sửa chú thích `mfa-roles.ts` và phần đầu `v105-be-d1-mfa-fdl.test.ts`.

  Có `DEFAULT NULL` thì api cũ vẫn chạy trong lúc deploy, và vẫn bắt 2FA đúng: `mfaRequired()` của guard cũ tự kiểm đủ ba vai (#124) khi `mfa_required` không phải `true`.
- Hạn: khi viết migration 0.3.14. Không chặn #132.
- Trạng thái: Open

---

## 3. Ảnh hưởng tới các làn

| Làn | Việc thêm | Ước |
|---|---|---|
| BE-D2 (#148) | Thẻ 31: theo (B) không đổi mã, thêm 1 ca ghim thứ tự; theo (A) đổi `readBankReference` và 3 chỗ gọi. Thẻ 32: thêm ca SAL `confirmDeposit` 409 không có mã đơn, ca thứ tự | (B) < 0,1 ngày; (A) ~0,35 ngày |
| BE-D (#120) | T58-17 (đã giao ở 1.28) | < 0,1 ngày |
| BE-D (migration 0.3.14) | Thẻ 33, khi làm | 0 lúc này |
| BE-B | Không. #119 đã gộp; cách (A) cũng không mở lại #119 | 0 |
| BE-A1, BE-A2, BE-H | Không. Không tệp nào của 1g chạm làn này | 0 |
| QA | Ca thứ tự theo thẻ 31, viết cùng PR-B3; dẫn SR-PAY-10 bản 07/11 thay cho 4.3 | – |
| FE | Không. #130 hiện câu theo `field` và `code`, không phụ thuộc thứ tự | 0 |

- Không làn nào phải chờ #132 mới chạy được.
- #148 nên gộp **sau** khi ARC chốt thẻ 31, để review #148 có một chuẩn duy nhất.

---

## 4. Điểm làm tốt (nên giữ)

- Bảng 1.28 ghi từng thẻ kèm "ai làm tiếp", nên mỗi làn tìm được việc của mình trong một bảng.
- Luật ô mã viết theo ranh giới nhóm, khớp từng nhánh của hàm, đúng cả chữ "ký tự" (không phải "chữ số") ở ngưỡng 19. QA viết ca từ chữ hợp đồng là ra đúng kết quả của mã.
- C0313-28 sửa cả mô tả 422 lẫn mô tả trường `note`, nên Desk đọc mã sinh là biết ô ghi chú bắt buộc.
- 0.3.14 ARC-23 ghi đủ ba điều kiện SEC và "bỏ phần guard cùng PR migration", nên không có lúc nào hai nơi tính 2FA khác nhau.
- Đúng "chỉ chữ": diff chỉ đổi mô tả và tệp `.md`, mã sinh khớp, CI xanh.

---

## 5. Giả định đã dùng

- Mã đối chiếu là `main` @ `6a805da1`. Phần `src/` giống `04ebdf46`, đã có #112, #119 (`f84cd605`), #127 (`17cbcd6f`), #139 (`3d9f1a63`) và #114 (`54a7815a`). GitHub báo #132 `MERGEABLE`, mọi job CI đạt lúc đọc (gốc `7a141dbf`).
- SR-PAY-10 bản 07/11 là dòng 180 của `product/docs/security/security-requirements.md` trên `main`.
- #148 và #120 còn mở. BE đọc ở `d533a387` và `9a22e0ef`; các PR này có thể còn đổi. Nhận xét về hai PR này chỉ để chỉ chỗ chữ 1g rơi vào mã, không thay review của ARC, SEC.
- Không cần ESC. Các điểm cần chốt thuộc quyền ARC (chữ), BE-D2 và BE-D (mã của PR đang mở) và QA (ca).

---

Dòng đề xuất cho `01-decisions/decision-log.md` (ORC ghi):

`| 2026-11-07 | 5 | **BE – review vai BE hợp đồng 0.3.13 bổ sung 1g (PR #132 @ c249deb0): DUYỆT**. 0 Blocker, 0 Major. C0313-26…30 khớp điều BE hỏi ở 1f (shared/rate-limit-counter.ts, cửa sổ ngày UTC + T58-11/15/17 khớp #120 @ 9a22e0ef trừ T58-17 còn thiếu; note bắt buộc + audit attention_event.resolved khớp #148; hàm ở #119; T14-4); luật ô mã SR-PAY-10 07/11 khớp từng nhánh isCardNumberReference; "8 chữ số cuối" khớp UXD. Minor C0313-31 (thứ tự lỗi "như note" không có nghĩa duy nhất, trái BUG-R2-043 nếu áp cho posAuthCode, #148 giữ thứ tự số thẻ trước – BE đề nghị ARC chốt số thẻ ở ô mã báo trước, trước khi gộp #148). Minor C0313-32 (test PR-B3: dẫn SR-PAY-10 thay SEC-responses 4.3, ca HTTP ở từng đường vì zod bỏ khóa lạ im lặng, ca thứ tự, ca thiếu ghi chú, câu "từ chối trường lạ" trái main, GroupDepositInput R3; #148 còn thiếu SAL confirmDeposit 409). Suggestion C0313-33 (0.3.14 auth_resolve_session: DROP + cấp quyền lại, 2 chỗ gọi trong src gồm upload-session.check.ts, đề nghị p_mfa_roles DEFAULT NULL). Không ESC | BE | rounds/round-05/reviews/BE-on-contract-0313-addendum-1g.md |`
