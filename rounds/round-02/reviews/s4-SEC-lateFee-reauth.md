# SEC review – D5: quản lý xác nhận BR-416-06 tại quầy (Round 2 · Sprint 4 · tuần Ổn định)

- Người review: SEC | Ngày: 18/10/2026 | Bước: Review (phạm vi nhỏ – ARC 16.7 D5 "[SEC xem lại]")
- Đối tượng: `rounds/round-02/outputs/ARC/openapi-0.3.7.md` mục 16.6 (d), 16.7 D5, 16.8; `product/docs/api/openapi.yaml` `checkOut` (dòng 3239–3389, khối `lateFeeInsteadOfNight` 3305–3332, gồm `requestFoc` ARC thêm 18/10); decision-log ARC 18/10 điểm (6).
- Đối chiếu: `product/docs/security/security-requirements.md` (SR-AUTH-04/06/09, SR-AZ-07, SR-RL-02, SR-LOG-01/04, SR-AUD-01/03, SR-DEV-07); mã hiện có: `identity/public/password-reauth.ts`, `http.ts` (`REDACT_PATHS`), `shared/secret-fields.ts`, `folio/internal/folio.controller.ts` + `approvals/public/approval.service.ts` (BR-436), `identity/internal/auth.service.ts` (đăng nhập); `@pinojs/redact@0.4.0` (thư viện che log của pino 10); FE `admin-web/src/pages/stay/CheckOutPage.tsx` (đã có hộp xác nhận).
- Cách làm: đọc hợp đồng và mã. BE-A **chưa** cài phía server (grep `lateFeeInsteadOfNight` trong `services/api/src` = 0), nên review này là review thiết kế + điều kiện cài. SEC không chạy test (máy SEC không có Node/DB).
- Đánh số thẻ tiếp theo: ARC …23, BE …58, FE …07.

**Tổng: 0 Blocker · 6 Major · 4 Minor (10 thẻ; thêm 1 gợi ý nằm trong BE-61)**

**Cập nhật 18/10 (vòng sửa 4):** BE-59 … BE-64 **Verified**, điều kiện server của D5 đã đủ (mục 11). **Cập nhật sau kiểm lại lần 5:** BE-62 và BE-64 mở lại một phần vì BUG-R2-167 và BUG-R2-165 (SỬA, vòng 5); BUG-R2-166 chấp nhận (mục 12). Cả ba là P3, không chặn cổng QC. **Vòng 5 (mục 13): BE-62, BE-64 Verified lại; BE-59 … BE-64 đều đạt.** Còn mở: ARC-25 (Major, chuyển sang US-164 R3 + ESC-024), ARC-24, ARC-26, FE-08 (Minor).

## 1. Kết luận: ĐỒNG Ý CÓ ĐIỀU KIỆN

D5 dùng được cho R2. Ba lý do. Số tiền do server tính và khóa lại (`amountVnd` lệch → 409). Lý do ARC đưa ra để bỏ luồng duyệt bất đồng bộ là đúng: luồng đó làm đơn kẹt ở `in_house`. Mặt bằng sẵn có cũng tốt: `secret` không vào băm idempotency ở mọi độ sâu, body không bao giờ vào log, và đã có một bộ đếm SR-RL-02 lưu ở DB.

Tuy vậy, D5 **mở một bề mặt tấn công mới** mà BR-436 và mọi chỗ xác nhận lại hiện có đều không có: **máy chủ kiểm mật khẩu của người khác** (OWN/MGR) theo tên đăng nhập mà một phiên FD gửi lên. Trước D5, `PasswordReauth` chỉ kiểm mật khẩu của chính người đang đăng nhập, nên không ai dùng được nó để dò mật khẩu tài khoản khác. Thêm vào đó, mật khẩu đăng nhập của quản lý được gõ trên máy quầy, trước mặt lễ tân. R2 chưa có 2FA, nên lộ mật khẩu này là lộ toàn quyền quản lý. Từ 18/10, `requestFoc` còn cho chính mật khẩu đó duyệt FOC trong hạn mức BR-433 của quản lý.

D5 cũng là **ngoại lệ có phạm vi** của SR-AUTH-09 và SR-AZ-07, vốn quy định "chỉ chấp nhận PIN của chính tài khoản đang đăng nhập (không chọn tên người duyệt)". SEC chấp nhận ngoại lệ này, nhưng **chỉ** cho `checkOut.lateFeeInsteadOfNight` và `requestFoc` lồng trong nó (mục 6).

**Điều kiện:**
- BE-A cài và test đủ 5 thẻ Major phía server (BE-59 … BE-63) trước khi QA chạy ca BR-416-06. SEC kiểm lại nhanh trên commit của BE-A. Không chặn BE-A bắt đầu code.
- Thẻ ARC-25 (Major) cần một câu trả lời ngay trong round: một mục backlog R3 kèm một dòng trong hướng dẫn vận hành. Phần cài đặt làm ở R3.
- Các thẻ Minor phải xong trước bản dùng thử (cuối R3).

## 2. D5 so với các quy tắc SEC hiện có

| Quy tắc | Hợp đồng D5 nói gì | Đánh giá SEC |
|---|---|---|
| Nhập lại mật khẩu (SR-AUTH-03/09, `PasswordReauth`) | Người gọi là FD/FDL: quản lý nhập `approverUsername` + `secret`. Người gọi là OWN/MGR: bỏ tên, nhập lại mật khẩu của mình | **Thiếu ở phía cài.** `PasswordReauth.verify` chỉ kiểm `ctx.userId` (`password-reauth.ts:33`). Với tài khoản không `active`, hàm trả `UNAUTHENTICATED` (`:47`, `:82`). Nếu dùng lại hàm này cho người xác nhận thì sẽ (a) đá FD ra trang đăng nhập và (b) lộ "tài khoản đã khóa". Cần một hàm riêng cho trường hợp người khác xác nhận → **BE-59** |
| Tách quyền (SR-AZ-07) | Người gọi FD ≠ người xác nhận OWN/MGR. OWN/MGR tự xác nhận được. `requestFoc`: người gửi = người gọi, người duyệt = người xác nhận | **Đạt về thiết kế.** FD không có vai OWN/MGR nên không bao giờ tự xác nhận được. MGR tự làm thì tương đương MGR tự áp FOC trong hạn mức (A2) và tương đương A19. Điều kiện: vai và hạn mức BR-433 phải lấy theo **người xác nhận** từ DB, không lấy theo principal của người gọi → BE-59 |
| Không lộ "tên đúng / mật khẩu sai" (SR-AUTH-04) | Sai tên, sai mật khẩu, không đủ vai: cùng 401 `REAUTH_FAILED` ở `lateFeeInsteadOfNight.secret` | **Đạt về thân phản hồi.** Còn thiếu: thời gian phản hồi phải đồng đều (luôn chạy argon2 đúng 1 lần, như đăng nhập ở `auth.service.ts:103`). Không được kiểm mật khẩu của tài khoản không đủ điều kiện, để không thành nơi dò mật khẩu tài khoản FD → BE-59. Cái 429 khi người xác nhận đang bị khóa vẫn cho biết tên đó tồn tại → SEC chấp nhận rủi ro này (mục 7) |
| Giới hạn thử SR-RL-02 | 5 sai/15 phút, đếm theo **người xác nhận** | **Chưa đủ.** Chỉ đếm theo người xác nhận thì (a) tên không tồn tại không bị đếm, FD thử tên thoải mái; (b) một FD rải lần thử qua nhiều tên mà không bị chặn. Cần đếm **cả người gọi** → **BE-60**. Bộ đếm hiện không có khóa cứng, tức tối đa ~480 lần đoán/ngày cho mỗi quản lý. Trước GL cần trần theo ngày → ARC-26 |
| Ghi log, che `secret` lồng (SR-LOG-01/04) | `secret` đã nằm trong `SECRET_BODY_FIELDS` | **Băm idempotency: đạt.** `withoutSecrets` xử lý mọi độ sâu. **Log: chưa đạt.** Đường che `*.secret` của `@pinojs/redact` chỉ che **đúng 1 tầng** (`index.js:280-330`, `redactIntermediateWildcard`: `beforeWildcard=[]` → duyệt khóa con cấp 1 rồi `setValue(child, ['secret'])`). Vì vậy `{body:{lateFeeInsteadOfNight:{secret}}}` **không** được che. Hôm nay log vẫn an toàn chỉ nhờ serializer không bao giờ log body (`http.ts:339-347`). Lỗi này đã có từ trước với `setParameter.reauth.secret` → **BE-61** |
| Nhật ký (SR-AUD-01/03) | Audit `money` `reservation.late_fee_instead_of_night` ghi người làm, người xác nhận, lý do, số tiền | **Đạt về nội dung.** Còn thiếu: audit `security` khi sai (ghi cả người gọi và người bị thử), kênh xác nhận (`desk`/`self`), dòng duyệt FOC ghi người duyệt = người xác nhận, và thông báo cho quản lý mỗi lần tài khoản của họ được dùng trên phiên người khác → **BE-62** |
| 2FA (SR-AUTH-06) / `authMethod` | `authMethod: [password, pin]`, R2 chỉ `password`, R3 `pin`. Không có `totpCode` | **R2 chưa ai bật được 2FA** (đăng nhập ném `MFA_REQUIRED` rồi dừng, `auth.service.ts:147-150`). Rủi ro: khi R3 bật 2FA bắt buộc cho OWN/MGR, D5 vẫn chấp nhận **mật khẩu đơn** của một tài khoản 2FA trên phiên người khác. Cần chặn từ bây giờ (fail-closed) → **BE-63**. Hợp đồng R3 → ARC-24 |
| Thiết bị được cấp (SR-DEV) | Ý định là "tại quầy", nhưng hợp đồng không ràng buộc thiết bị | Hiện server không bắt buộc máy quầy. Đề nghị bắt buộc trước GL → ARC-26 |
| Hợp đồng lỗi | `checkOut` mô tả 401/403/429 | `responses` của `checkOut` chỉ có 200/409/412/422 (`openapi.yaml:3361-3389`): thiếu `401 ReauthFailed`, `403` (`APPROVAL_LIMIT_EXCEEDED` của `requestFoc`, `FORBIDDEN_ACTION` của `debt`), `429 RateLimited` → ARC-24 |

## 3. So với BR-436 (FD tự áp FOC minibar bằng mật khẩu)

| Khía cạnh | BR-436 (`requestFoc` + `authMethod/secret`, `folio.controller.ts:155-175`, `approval.service.ts:434-466`) | D5 (`checkOut.lateFeeInsteadOfNight`) |
|---|---|---|
| Mục đích xác nhận lại | Chứng minh người đang ngồi trước phiên là chủ tài khoản (chống dùng nhờ phiên, máy để ngỏ) | **Tách quyền**: người thứ hai cho phép thao tác |
| Mật khẩu của ai | Người gọi | **Người khác** (OWN/MGR) |
| Định danh | Lấy từ phiên, không có ô tên | Ô **tên đăng nhập** → có nguy cơ dò tên tài khoản, cần thời gian phản hồi đồng đều |
| Có tạo nơi dò mật khẩu mới không | Không (chỉ thử được mật khẩu của chính mình) | **Có**: mọi phiên FD thử được mật khẩu OWN/MGR |
| Lộ mật khẩu | Lễ tân gõ mật khẩu của mình trên máy của mình | **Mật khẩu đăng nhập của quản lý gõ trên máy quầy, trước mặt lễ tân.** R2 không có 2FA nên lộ là mất toàn quyền quản lý. Trình duyệt quầy có thể còn đề nghị lưu mật khẩu này |
| Bộ đếm | Người gọi (`app_user.approval_pin_*`, dùng chung) | Người xác nhận (cần thêm người gọi – BE-60). Phụ tác dụng: FD cố tình gõ sai 5 lần sẽ khóa **mọi** màn xác nhận lại của quản lý (duyệt, step-up C3) trong 15 phút |
| Tài khoản không `active` | `UNAUTHENTICATED` (đúng, vì phiên của chính mình đã chết) | Phải là `REAUTH_FAILED` 401 giống hệt các lỗi khác |
| Chiều tiền | Tiền ra (FOC), FD có trần riêng `foc_self_apply.front_desk.*` | Tiền vào, số do server cố định. **Kèm** tiền ra tùy chọn (`requestFoc`) tới hạn mức BR-433 của quản lý |
| Audit | Người quyết = FD, `authMethod`, snapshot hạn mức | Người làm = FD, người xác nhận = OWN/MGR, `authMethod`, lý do, số tiền. Cần thêm kênh xác nhận và audit khi sai |
| Kế hoạch R3 | PIN | PIN (ARC). SEC thêm: đường xác nhận cho người khác chỉ nhận PIN hoặc mật khẩu + TOTP |

Kết luận phần so sánh: D5 **rộng hơn hẳn** BR-436 về bề mặt tấn công. Không thể coi D5 là "giống BR-436 nhưng đổi người". Phải cài theo một hàm riêng với các điều kiện ở mục 4.

## 4. Thẻ feedback

### FB-R2-SEC-BE-59
- Mức độ: Major
- Vị trí: BE-A – lệnh `checkOut`, đường `lateFeeInsteadOfNight` (chưa cài). Hàm tham chiếu `identity/public/password-reauth.ts:28-89`
- Vấn đề: Có thể BE-A dùng lại `PasswordReauth.verify` cho trường hợp người khác xác nhận. Hàm này chỉ kiểm `ctx.userId` và trả `UNAUTHENTICATED` khi tài khoản không `active`. Hợp đồng không nói rõ phải tìm người xác nhận ở đâu và tìm thế nào: tên được chuẩn hóa ra sao, có giới hạn theo cơ sở không, có xét trạng thái khóa không. Hợp đồng cũng chưa đòi thời gian phản hồi đồng đều.
- Vì sao quan trọng: Làm sai sẽ gây một trong các hậu quả sau: FD bị đăng xuất giữa lúc trả phòng; lộ "tài khoản tồn tại / đã khóa"; dò được mật khẩu cả tài khoản FD; dùng được quản lý của tổ chức khác nếu tìm bằng `auth_find_user` (hàm toàn cục).
- Đề xuất sửa: thêm một hàm riêng trong `identity/public`, ví dụ `verifyApprover(ctx, username, secret, {roles:['owner','manager'], field, purpose:'late_fee'})`, dùng cho mọi chỗ "người khác xác nhận" sau này.
  1. **Tìm người xác nhận dưới RLS** của ngữ cảnh người gọi. Kết với `user_property_role`: `property_id` = cơ sở trên đường dẫn, `revoked_at IS NULL`, vai thuộc {owner, manager}. **Không** dùng `auth_find_user`. Chuẩn hóa tên giống hệt lúc đăng nhập.
  2. **Đủ điều kiện** = `status='active'`, không `locked_until > now` (đang bị khóa đăng nhập), không khóa cứng, không `must_change_password`. Không đủ điều kiện thì xử lý như "không tìm thấy".
  3. **Luôn chạy argon2 đúng một lần**. Không tìm thấy hoặc không đủ điều kiện thì gọi `verifyPassword(null, secret)` (dùng `DUMMY_HASH`), giống `auth.service.ts:103`. **Không bao giờ** kiểm mật khẩu thật của tài khoản không đủ điều kiện.
  4. Mọi nhánh thất bại trả **cùng** 401 `REAUTH_FAILED`, `errors[{field:'lateFeeInsteadOfNight.secret'}]`. Không trả 403/404/`UNAUTHENTICATED` cho lỗi về người xác nhận.
  5. Vai và hạn mức BR-433 dùng cho `requestFoc` lấy theo người xác nhận vừa kiểm, đọc từ DB.
  6. Không mở cửa sổ step-up C3, không ghi gì vào phiên của người gọi hay người xác nhận.
  7. OWN/MGR tự xác nhận (không có tên, hoặc tên = chính mình) thì dùng `PasswordReauth.verify` như cũ, `field` = `lateFeeInsteadOfNight.secret`.
  - Test: tên không có / FD / MGR cơ sở khác / MGR `disabled` / MGR bị khóa đăng nhập / MGR `must_change_password` / sai mật khẩu → cùng thân 401. Mật khẩu **đúng** của một tài khoản FD cũng → 401. MGR đúng → 200 và audit có `approverUserId`.
- Trạng thái: **Verified 18/10** (mục 11) – đủ 401 đồng nhất cho mọi trạng thái, gồm khóa đăng nhập (BUG-R2-146)

### FB-R2-SEC-BE-60
- Mức độ: Major
- Vị trí: BE-A – bộ đếm SR-RL-02 cho `lateFeeInsteadOfNight` (hợp đồng chỉ đếm "theo người xác nhận")
- Vấn đề: Chỉ đếm theo người xác nhận thì tên không tồn tại không bị đếm, và một FD rải được lần thử qua nhiều tên. Thêm nữa: nếu người xác nhận bị khóa thì trả 429, còn tên không có thì không bao giờ 429, nên vẫn phân biệt được "tên có thật".
- Vì sao quan trọng: Đây là chỗ duy nhất trong hệ thống mà một tài khoản vai thấp thử được mật khẩu của tài khoản vai cao.
- Đề xuất sửa:
  - Mỗi lần sai, tăng **bộ đếm của người gọi** (luôn luôn) **và** của người xác nhận (khi tìm được người đủ điều kiện). Dùng cột `approval_pin_failed_count` / `approval_pin_locked_until` sẵn có, cập nhật nguyên tử trong **giao dịch riêng** (lần sai được giữ lại dù request lỗi), giống `PasswordReauth`. Kiểm trạng thái khóa của cả hai **trước** khi chạy argon2. Một trong hai đang khóa → 429 `RATE_LIMITED` + `Retry-After`.
  - Đúng thì chỉ xóa bộ đếm của người xác nhận. Bộ đếm của người gọi tự hết hạn: lỗi của người gọi không được xóa bằng mật khẩu của người khác.
  - Audit `security` khi sai: người làm = người gọi; `entityId` = người xác nhận (nếu tìm được), không thì = người gọi; `after` = `{authMethod, approverMatched: bool, failedCount, lockedUntil}`. **Không** ghi chuỗi tên gõ vào khi không khớp (người dùng hay gõ nhầm mật khẩu vào ô tên).
  - Test: một FD thử 5 tên không tồn tại → lần 6 bị 429. Một FD thử sai 5 lần trên MGR A → cả FD lẫn A bị khóa. FD thứ hai thử A → 429.
- Trạng thái: **Verified 18/10** (mục 11)

### FB-R2-SEC-BE-61
- Mức độ: Major
- Vị trí: `services/api/src/http.ts:15-35` (`REDACT_PATHS`), `@pinojs/redact@0.4.0` `index.js:280-330`
- Vấn đề: `*.secret` chỉ che khóa `secret` ở **tầng con thứ nhất** của bản ghi log. `secret` lồng ở `lateFeeInsteadOfNight.secret` (và `setParameter.reauth.secret` đã có từ trước) sẽ **không** được che nếu một đối tượng chứa body bị log. Hiện chưa lộ, nhưng chỉ nhờ một hàng rào duy nhất: serializer `req` không log body (`http.ts:339-347`) và các lệnh log đều là chuỗi (`describeError`).
- Vì sao quan trọng: Đây là mật khẩu đăng nhập của OWN/MGR. Chỉ một dòng `logger.warn({ body })` khi gỡ lỗi là mật khẩu nằm trong log 90 ngày (SR-LOG-05). ARC 16.8 đã giao BE-A "kiểm `REDACT_PATHS` che `secret` lồng".
- Đề xuất sửa:
  - Che không phụ thuộc độ sâu, ví dụ thêm `formatters.log: (o) => withoutSecrets(o)` (dùng lại danh sách `SECRET_BODY_FIELDS`), giữ `REDACT_PATHS` cho header. Hoặc thêm đường tường minh `*.lateFeeInsteadOfNight.secret`, `*.*.lateFeeInsteadOfNight.secret`, `*.reauth.secret` kèm test chặn quên.
  - Test bằng `logStream`: log một đối tượng có `secret` ở tầng 2 và tầng 3 → dòng log không chứa chuỗi gốc. Gọi `checkOut` đường `lateFeeInsteadOfNight` (401 rồi 200) → chuỗi mật khẩu thử **không** có trong log, `audit_event`, `idempotency_key` (băm + phản hồi lưu) và thân Problem.
  - (Suggestion) Thêm `approverUsername` vào `SECRET_BODY_FIELDS`, để mật khẩu gõ nhầm vào ô tên không bị băm không muối trong `idempotency_key`.
- Trạng thái: **Verified 18/10** (mục 11) – `formatters.log` + `withoutSecrets`

### FB-R2-SEC-BE-62
- Mức độ: Major
- Vị trí: BE-A – audit `reservation.late_fee_instead_of_night`, dòng duyệt FOC của `requestFoc`, thông báo
- Vấn đề: Hợp đồng chỉ nêu audit thành công. Chưa có cách nào để **quản lý biết** tài khoản của mình vừa được dùng trên phiên người khác. Đây là chốt phát hiện duy nhất trước mối nguy chính của D5: mật khẩu bị nhìn trộm tại quầy rồi bị dùng lại.
- Vì sao quan trọng: R2/R3 chưa có 2FA cho tới khi bật. Nếu không có thông báo, việc dùng lại mật khẩu sẽ không ai thấy.
- Đề xuất sửa:
  - Audit `money` ghi: người làm (người gọi), `approverUserId`, `approverRole`, `authMethod`, `confirmChannel` (`desk` khi người xác nhận ≠ người gọi, `self` khi trùng), `reason`, `amountVnd`, số FOC (nếu có). Khai báo các trường này trong `audit-fields.ts` (danh sách cho phép). Không ghi `secret` và chuỗi tên.
  - Dòng `approval_request` của `requestFoc`: người quyết = người xác nhận, vai lúc quyết của người xác nhận, `auth_method`, snapshot có `confirmedOnSessionOf: <người gọi>`.
  - Khi người xác nhận ≠ người gọi: gửi `EventsService.notify` tới **chính người xác nhận** (dùng loại có sẵn `account_security_change`, `refType=reservation`, `refCode` = mã đơn, không có số tiền hay dữ liệu khách), để họ biết mỗi lần tài khoản được dùng tại quầy. Khi người xác nhận bị khóa do thử sai: `security_alert` tới người đó và OWN.
  - Test: 200 → 1 audit `money` đủ trường + 1 thông báo cho người xác nhận. Tự xác nhận → không có thông báo.
- Trạng thái: **Verified 18/10 (vòng 5, mục 13)** – BUG-R2-153/154 (mục 11) và BUG-R2-167 (`reauth_succeeded` + thông báo, mục 12.3) đều đạt

### FB-R2-SEC-BE-63
- Mức độ: Major
- Vị trí: BE-A – xử lý `authMethod` và 2FA trên đường `lateFeeInsteadOfNight`
- Vấn đề: Hợp đồng không nói server làm gì khi người xác nhận đã bật 2FA, và cũng không nói `pin` gửi ở R2 thì sao. R3 bật 2FA bắt buộc cho OWN/MGR. Nếu R2 bỏ ngỏ thì khi đó D5 vẫn nhận mật khẩu đơn của tài khoản 2FA trên phiên người khác.
- Vì sao quan trọng: Không có hai điều trên, D5 trở thành đường vòng qua 2FA cho đúng nhóm tài khoản mạnh nhất.
- Đề xuất sửa:
  - `authMethod = 'pin'` ở R2 → 422 `NOT_IN_LIST` (`field` = `lateFeeInsteadOfNight.authMethod`), như `requestFoc`/`approveRequest`. Không lùi về kiểm mật khẩu, không đếm.
  - **Fail-closed**: người xác nhận có `mfa_enabled = true` mà server chưa kiểm được yếu tố thứ hai → xử lý như "không đủ điều kiện" (401 giống hệt, vẫn chạy argon2 giả).
  - `requestFoc.authMethod/secret` → 422 `NOT_ALLOWED` như hợp đồng.
  - Test: 3 trường hợp trên.
- Trạng thái: **Verified 18/10** (mục 11)

### FB-R2-SEC-BE-64
- Mức độ: ~~Minor~~ **Major** (nâng 18/10 sau kiểm lại lần 4: BUG-R2-149 tái hiện được – FD dò được mật khẩu MGR trên mọi đơn `in_house` và khóa được MGR 15 phút bất cứ lúc nào)
- Vị trí: BE-A – thứ tự kiểm trong `checkOut` đường `lateFeeInsteadOfNight`
- Vấn đề: Nếu kiểm mật khẩu trước khi kiểm điều kiện nghiệp vụ, FD thử được mật khẩu quản lý trên **bất kỳ** đơn đang ở nào, vào bất kỳ lúc nào.
- Vì sao quan trọng: Kiểm điều kiện nghiệp vụ trước thì nơi dò mật khẩu chỉ còn mở trong ca thật: đêm ngày đi đã bán và khách rời sau mốc cuối, chuyện hiếm gặp.
- Đề xuất sửa: kiểm theo thứ tự sau (bước 0 thêm 18/10 – BUG-R2-150, xem mục 9).
  0. **Tra Idempotency-Key đã hoàn tất** (chỉ đọc, không kiểm mật khẩu, không đếm) – mục 9.
  1. Kiểm khuôn body: `checkoutTime` bắt buộc và đúng khuôn, `checkoutAt`, `amountVnd`, `reason`, `requestFoc` (gồm `kind`, cấm `authMethod`/`secret`).
  2. Bước chỉ đọc: đơn `in_house`, đúng ngày đi hoặc trong cửa sổ sau nửa đêm, `extraNightRequired && !extraNightAvailable`, giờ trả qua mốc cuối, `amountVnd` = `lateFeeAsNightVnd`. Sai thì 422/409 **trước** khi kiểm mật khẩu và không đếm. Không có đường tắt kiểu "thiếu giờ thì bỏ qua bước này".
  3. Kiểm người xác nhận (BE-59/60).
  4. `uow.run` nhận key, kiểm lại toàn bộ rồi ghi.
  - Test: gửi `lateFeeInsteadOfNight` trên đơn còn bán được đêm, kèm mật khẩu sai → 422 `NOT_ALLOWED`, bộ đếm không tăng. Thêm các biến thể của BUG-R2-149 (thiếu `checkoutTime`, `checkoutAt` hỏng, thiếu `amountVnd`, `requestFoc` sai khuôn, chưa tới ngày đi): mật khẩu sai và mật khẩu đúng phải trả **cùng** mã lỗi, bộ đếm 0/0.
- Trạng thái: **Verified 18/10 (vòng 5, mục 13)** – BUG-R2-149/150 (mục 11), BUG-R2-165 (mục 12.1) đạt; BUG-R2-166 chấp nhận, có ca đồng thời (mục 12.2); giả định r5-2 SEC chấp nhận (mục 13)

### FB-R2-SEC-ARC-24
- Mức độ: Minor
- Vị trí: `product/docs/api/openapi.yaml` `checkOut` responses (3361–3389); `lateFeeInsteadOfNight.authMethod` (3319)
- Vấn đề: Mô tả có 401 `REAUTH_FAILED`, 403 `APPROVAL_LIMIT_EXCEEDED`/`FORBIDDEN_ACTION`, 429 khi khóa, nhưng `responses` không khai báo 401, 403 hay 429. `approveRequest` cũng thiếu 429. Hợp đồng R3 chưa nói đường xác nhận cho người khác sẽ dùng gì khi có 2FA.
- Vì sao quan trọng: Client sinh tự động và bộ test 401/403 (SR-AZ-09) đọc `responses`. Nếu thiếu, FE dễ hiểu 401 thành "hết phiên".
- Đề xuất sửa:
  - Thêm `'401': ReauthFailed`, `'403': Forbidden`, `'429': RateLimited` cho `checkOut`, và `'429'` cho `approveRequest`/`rejectRequest`. Ghi mô tả: người xác nhận có 2FA mà chưa kiểm được yếu tố thứ hai → 401 giống hệt (BE-63).
  - Contract-ahead R3: đường xác nhận cho người khác chỉ nhận `pin`. Nếu cần mật khẩu thì phải kèm `totpCode` (writeOnly, như `trustCurrentDevice`), và mọi lỗi vẫn 401 cùng `field`.
- Trạng thái: Open

### FB-R2-SEC-ARC-25
- Mức độ: Major (trả lời trong round bằng backlog R3 + hướng dẫn vận hành; cài ở R3)
- Vị trí: `openapi-0.3.7.md` 16.6 (d) "Lý do chọn xác nhận tại quầy"; 16.7 D5
- Vấn đề: Đường BR-416-06 chỉ xảy ra khi khách rời **sau mốc cuối** (tối, sau 18:00). Ở một boutique 10 căn, đó đúng là lúc quản lý thường **không có mặt** ở quầy. Khi đó FD bị kẹt: lệnh không cho trả phòng nếu thiếu cả `extraNight` lẫn `lateFeeInsteadOfNight`. Áp lực thực tế sẽ là quản lý **đọc mật khẩu qua điện thoại/Zalo**.
- Vì sao quan trọng: Mật khẩu đăng nhập của quản lý bị chia sẻ, mọi bảo vệ ở BE-59…63 mất tác dụng, và audit ghi sai người thật sự quyết.
- Đề xuất sửa:
  - (a) Thêm một dòng vào hướng dẫn vận hành (PO/DOM): **không bao giờ** đọc mật khẩu qua điện thoại/tin nhắn; nghi đã lộ thì đổi ngay. Đưa vào kịch bản test khả dụng của UXR.
  - (b) Backlog R3: đường **xác nhận từ xa trên thiết bị của chính quản lý**. Phương án gợi ý: Desk tạo yêu cầu `late_fee_as_night` đồng bộ có hạn ngắn, push tới OWN/MGR; quản lý duyệt trên phiên của mình bằng PIN/2FA; Desk nhận qua SSE rồi B18. Hoặc: B18 ghi giờ rời và treo khoản phụ thu chờ duyệt, folio chốt sau. ARC chọn cách để đơn không kẹt `in_house`, DOM xác nhận nghiệp vụ.
  - Nếu PO/DOM kết luận phải cho FD tự ghi khi vắng quản lý thì đó là chính sách kinh doanh, cần ESC. Hiện SEC **không** tạo ESC.
- Trạng thái: Open

### FB-R2-SEC-ARC-26
- Mức độ: Minor (trước GL)
- Vị trí: hợp đồng `lateFeeInsteadOfNight`; SR-RL-02; SR-DEV
- Vấn đề: (1) Bộ đếm xác nhận lại không có khóa cứng. 5 lần mỗi 15 phút, lặp lại mãi, tức khoảng 480 lần đoán/ngày cho mỗi quản lý từ một tài khoản FD. (2) "Tại quầy" chưa được ép ở server: phiên FD trên thiết bị chưa được cấp vẫn gọi được.
- Vì sao quan trọng: Giới hạn thời gian dò mật khẩu từ trong nội bộ. Gắn việc xác nhận vào máy quầy, nơi có người chứng kiến.
- Đề xuất sửa:
  - Trần theo ngày cho đường xác nhận cho người khác: ≥ 2 lần khóa / 24 giờ trên cùng người gọi hoặc cùng người xác nhận → khóa đường này 24 giờ + cảnh báo OWN (SR-LOG-06).
  - Đường xác nhận cho người khác yêu cầu phiên `device_trusted` của cơ sở. Thiếu → 403 `DEVICE_NOT_TRUSTED`, kiểm **trước** khi kiểm mật khẩu. OWN/MGR tự xác nhận không cần.
  - Tham số đặt trong `x-security-parameters`.
- Trạng thái: Open

### FB-R2-SEC-FE-08
- Mức độ: Minor
- Vị trí: `apps/admin-web/src/pages/stay/CheckOutPage.tsx:923-977` (hộp xác nhận), `:410-417`, `:430-432`
- Vấn đề:
  1. Hộp xác nhận chỉ hiện số phụ thu ở tiêu đề. Khi có `requestFoc` (ARC 18/10), quản lý phải thấy đủ những gì mình cho phép (phụ thu, FOC, khách trả) **trước khi** gõ mật khẩu.
  2. `autoComplete="off"` trên ô mật khẩu không ngăn Chrome/Edge đề nghị **lưu mật khẩu của quản lý** vào hồ sơ trình duyệt của máy quầy.
  3. `maxLength={60}` ở ô tên lệch hợp đồng (100).
- Vì sao quan trọng: Mật khẩu quản lý lưu trong trình duyệt quầy thì ai ngồi quầy cũng có. Quản lý duyệt FOC mà không thấy số tiền.
- Đề xuất sửa:
  - Hiện bảng tóm tắt 3 số trong hộp, đặt ngay trên ô tên/mật khẩu.
  - Không bọc trong `<form>` có cặp `username/password`. Ô tên dùng `autoComplete="off"` và `name` không phải `username`. Ô mật khẩu dùng `autoComplete="new-password"` để trình duyệt không tự điền mật khẩu đã lưu.
  - Ghi rõ vào checklist SR-DEV-07: trình duyệt quầy tắt trình quản lý mật khẩu bằng chính sách (`PasswordManagerEnabled=false`).
  - Sửa `maxLength` thành 100.
  - Giữ nguyên chỗ xóa `lfSecret` sau mỗi lần gọi (đúng).
- Trạng thái: Open

## 5. Điều kiện cho BE-A (tóm tắt để ORC chuyển)

1. **BE-59**: dùng hàm riêng `verifyApprover`, không dùng `PasswordReauth.verify` cho người khác. Tìm người xác nhận dưới RLS + `user_property_role` (cơ sở trên đường dẫn, OWN/MGR, chưa thu hồi), không dùng `auth_find_user`. Người xác nhận phải `active`, không khóa đăng nhập, không `must_change_password`. Luôn chạy argon2 đúng 1 lần (`DUMMY_HASH`), không bao giờ kiểm mật khẩu của tài khoản không đủ điều kiện. Mọi nhánh trả 401 `REAUTH_FAILED` giống nhau, `field` = `lateFeeInsteadOfNight.secret`. Vai/hạn mức `requestFoc` lấy theo người xác nhận. Không mở step-up C3.
2. **BE-60**: sai thì tăng bộ đếm của **cả** người gọi và người xác nhận (nguyên tử, giao dịch riêng). Một trong hai đang khóa → 429. Đúng chỉ xóa bộ đếm người xác nhận. Audit `security` không ghi chuỗi tên gõ vào.
3. **BE-61**: che `secret` ở mọi độ sâu trong log (`formatters.log` + `withoutSecrets` hoặc đường tường minh). Test: mật khẩu thử không có trong log, audit, `idempotency_key`, Problem.
4. **BE-62**: audit `money` đủ người gọi, người xác nhận, kênh, `authMethod`. Dòng duyệt FOC ghi người duyệt = người xác nhận. Thông báo `account_security_change` cho người xác nhận khi khác người gọi. Khi bị khóa → `security_alert`.
5. **BE-63**: `pin` ở R2 → 422 `NOT_IN_LIST`. Người xác nhận có `mfa_enabled` → 401 giống nhau (fail-closed).
6. **BE-64** (Major từ 18/10): bước 0 tra Idempotency-Key đã hoàn tất (mục 9), rồi khuôn body và điều kiện nghiệp vụ chỉ đọc, sau cùng mới kiểm mật khẩu.

## 6. Ngoại lệ SR-AUTH-09 – SEC ghi nhận (đã làm 18/10, bước Phản hồi & sửa)

> **Đánh lại số (18/10):** bản đầu của review này đặt nháp là SR-AUTH-10. Số này đã dùng cho quy tắc "đăng nhập gần nhất" (PO báo), nên quy tắc mới mang số **SR-AUTH-11**, số kế tiếp còn trống.

- **Đã thêm SR-AUTH-11** vào `product/docs/security/security-requirements.md`: "Người khác xác nhận tại quầy". Chỉ cho `checkOut.lateFeeInsteadOfNight` (gồm `requestFoc` lồng). Áp dụng các điều kiện BE-59…64 và ARC-26; R3 chỉ PIN hoặc mật khẩu + TOTP; xác nhận từ xa theo US-164. Mọi chỗ mới muốn kiểm mật khẩu/PIN của người không phải người gọi đều phải qua SEC review. SR-AUTH-09 thêm câu trỏ tới ngoại lệ này.
- **Đã sửa SR-RL-02**: xác nhận tại quầy đếm theo người xác nhận **và** người gọi; một trong hai đang khóa → 429; đúng chỉ xóa bộ đếm của người xác nhận.
- Dòng decision-log SEC 18/10 đã sửa số (ghi chú "đánh lại số"): `| 2026-10-18 | 2 | SEC – D5 (BR-416-06, quản lý xác nhận tại quầy): ĐỒNG Ý CÓ ĐIỀU KIỆN; ngoại lệ có phạm vi của SR-AUTH-09 (SR-AUTH-11 mới – đánh lại số 18/10, nháp ghi SR-AUTH-10 nhưng số này đã dùng cho "đăng nhập gần nhất"): chỉ checkOut.lateFeeInsteadOfNight (+ requestFoc); điều kiện BE-59…63 (BE-A), ARC-24/26, FE-08; R3 chỉ PIN hoặc mật khẩu + TOTP cho đường này, xác nhận từ xa (ARC-25 → US-164) | SEC | reviews/s4-SEC-lateFee-reauth.md |`
- ARC-25: PO đã thêm US-164 (Must R3) và mở ESC-024. Kịch bản kiểm thử khả dụng của UXR (quy tắc mật khẩu) để sang R3.
- **Còn ghi số cũ SR-AUTH-10 ở sản phẩm của vai khác** (SEC không sửa, nhờ ORC chuyển):
  - PO: `03-backlog/backlog.md` dòng 90, 1008, 1236.
  - ARC: `product/docs/api/openapi.yaml` dòng 3314, rồi sinh lại `packages/api-client/src/generated/openapi.ts`.

## 7. Rủi ro còn lại SEC chấp nhận cho R2

| Rủi ro | Vì sao chấp nhận | Hết khi |
|---|---|---|
| Lễ tân nhìn trộm mật khẩu quản lý gõ tại quầy | R2 chưa dùng dữ liệu và tài khoản thật. Có thông báo cho quản lý (BE-62) để phát hiện | R3: PIN riêng (SR-AUTH-09) + 2FA đăng nhập (SR-AUTH-06) |
| FD cố tình gõ sai 5 lần, khóa màn xác nhận lại của quản lý 15 phút (duyệt, step-up C3) | Thiệt hại nhỏ, có audit + `security_alert`, người gọi cũng bị khóa | Xem lại khi có số liệu UXR |
| 429 khi người xác nhận đang khóa cho biết tên đó có thật | Ở cơ sở 10 căn, danh sách quản lý không phải bí mật với lễ tân | – |
| Khoảng 480 lần đoán/ngày cho mỗi quản lý tới khi có trần theo ngày | Mật khẩu ≥ 10 ký tự, không nằm trong danh sách phổ biến (SR-AUTH-02). Có audit + thông báo | ARC-26 (trước GL) |

## 8. Điểm làm tốt

- Số tiền do server tính và khóa bằng `amountVnd` (lệch → 409). Người xác nhận không bị lừa ký một con số khác với số server ghi.
- Lý do bỏ luồng duyệt bất đồng bộ (đơn kẹt `in_house`) có căn cứ. `requestFoc` lồng cấm gửi `authMethod/secret` thứ hai, nên chỉ có một mật khẩu cho một lần xác nhận.
- FE xóa mật khẩu quản lý sau **mọi** lần gọi, kể cả khi lỗi (`CheckOutPage.tsx:430-432`), và đọc lỗi đúng `field` của hợp đồng.

## 9. Chốt thứ tự idempotency – BUG-R2-150 (SEC, 18/10, sau kiểm lại lần 4)

**Quyết định: CHẤP NHẬN** "gửi lại key đã hoàn tất thì trả phản hồi đã lưu, không kiểm mật khẩu". Đây là **bước 0** của thứ tự BE-64, chạy **trước** khuôn body, trước bước chỉ đọc và trước `verifyApprover`.

**SEC xác nhận chốt của ARC** (`openapi-0.3.7.md`, mục idempotency, 18/10): bước 0 và rủi ro ARC chấp nhận trùng khớp với quyết định này. SEC thêm một điểm ARC chưa ghi: key đang `in_progress` → 409 `IDEMPOTENCY_IN_PROGRESS` **ngay ở bước 0**, không kiểm mật khẩu, không đếm (điều kiện 2 bên dưới).

Vì sao chấp nhận:
- Key gắn với từng người gọi (`idempotency_key.principal_id` = người gọi, `unit-of-work.ts` `claimKey`). Gửi lại chỉ trả cho **chính người đó** đúng phản hồi họ đã nhận.
- Gửi lại không ghi gì, không cấp quyền gì mới.
- Phản hồi không phụ thuộc vào `secret`, nên không thành nơi dò mật khẩu.
- Không đếm, nên không thành đường khóa quản lý.
- Cùng chính sách sẵn có của `UnitOfWork`: gửi lại thì không kiểm lại If-Match và vai.
- Phương án ngược lại (kiểm mật khẩu cả khi gửi lại) làm hỏng gửi lại sau mất mạng, vì FE đã xóa mật khẩu sau mỗi lần gọi. Phương án đó cũng mở thêm một đường để thử và đếm.

Điều kiện cài (BE-A):
1. **Bước 0 chỉ đọc**. Dùng **cùng** hàm `requestHash` (bỏ `secret` qua `withoutSecrets`), cùng phạm vi (người gọi + tổ chức), cùng method + path như `claimKey`. Không có hàm băm thứ hai. Nên tách phần tra của `claimKey` thành một hàm dùng chung, ví dụ `peekCompleted`.
2. Kết quả của bước 0:
   - `completed` + băm khớp → trả phản hồi đã lưu, header `Idempotent-Replayed: true`. Phản hồi lỗi đã lưu thì trả lại đúng lỗi đó (`replayFailure`).
   - Băm lệch → 422 `IDEMPOTENCY_KEY_REUSED`.
   - `in_progress` **đã commit** → 409 `IDEMPOTENCY_IN_PROGRESS`. Key của một B18 đang chạy trong giao dịch chưa commit thì bước 0 không thấy; request đi tiếp bước 1–4, `claimKey` trả 409 hoặc replay, không ghi trùng – SEC chấp nhận (sửa câu 18/10, mục 12.2).
   - Ở cả ba trường hợp: không kiểm mật khẩu, không đếm, không audit, không gửi thông báo.
   - Không có dòng nào → đi tiếp bước 1–4. `uow.run` vẫn nhận key như cũ (xử lý tranh chấp giữ nguyên).
3. Không bao giờ lưu `secret` hay chuỗi tên gõ vào trong `response_body` hoặc `request_hash`. Hiện đạt: phản hồi chỉ gồm `reservation` + `billNo`.
4. Test:
   - (a) B18 `lateFeeInsteadOfNight` → 200. Gửi lại cùng key, cùng body, **mật khẩu sai** → 200 replay + header; bộ đếm 0/0; không thêm audit/thông báo; folio không đổi.
   - (b) Cùng key, đổi `amountVnd` hoặc `reason` → 422 `IDEMPOTENCY_KEY_REUSED`, bộ đếm 0/0.
   - (c) FD khác dùng cùng key → không phải replay. Đơn đã `checked_out` nên bị 409 ở bước chỉ đọc, trước khi kiểm mật khẩu; bộ đếm 0/0.
   - (d) B18 thường (không có `lateFeeInsteadOfNight`) gửi lại vẫn như cũ.
5. (Suggestion) Áp cùng bước 0 cho các lệnh xác nhận lại khác (`approveRequest`, `rejectRequest`, `requestFoc` tự áp, `setParameter` có `reauth`) khi có dịp, để gửi lại sau thành công không bị 401.

Hai điểm kiểm lại lần 4 mà BE-A đang sửa cùng tệp, SEC chốt luôn:
- **BUG-R2-153**: người duyệt FOC của `requestFoc` **luôn là người xác nhận**: `approver_id`, vai lúc duyệt = vai của người xác nhận, `auth_method = password`. Áp cả khi OWN/MGR tự xác nhận, không để `null`. Hạn mức BR-433 và `foc_count_per_approver` tính cho người xác nhận.
- **BUG-R2-154**: **bỏ** `confirmedByUsername` khỏi audit money. Giữ `approverUserId` + **thêm** `approverRole`. Lý do: danh sách cho phép tối thiểu (SR-AUD-03); id thì bền, còn tên đăng nhập có thể đổi; và tránh nhầm với quy tắc "không ghi chuỗi tên gõ vào". Tên hiển thị lấy lúc đọc audit. `security_alert` khi bị khóa gửi cho người xác nhận, người gọi **và mọi OWN của cơ sở**.

## 10. Kiểm lại BE-59 (2) – BUG-R2-146 (SEC, 18/10, cây chung chưa commit)

**Kết quả: BE-59 (2) – ĐẠT (Verified) cho tài khoản bị khóa đăng nhập.** Thẻ BE-59 còn mở vì thiếu một phần test (xem cuối mục).

Đối tượng kiểm: HEAD `2efec17` + phần sửa chưa commit của BE-A trên cây chung, gồm `identity/public/password-reauth.ts` (` M`) và `test/integration/s438r4-money.test.ts` (`??`).

Đọc mã `verifyApprover`:
- Người xác nhận được tìm dưới RLS của người gọi: `username` (citext, so như lúc đăng nhập) + `organization_id`. Vai lấy theo `user_property_role` của **cơ sở người gọi**, `revoked_at IS NULL`. Không dùng `auth_find_user`.
- Điều kiện hợp lệ:
  - `status = 'active'`, nên khóa cứng / `disabled` / `locked` cũ bị loại;
  - **`locked_until` NULL hoặc ≤ now** (BUG-R2-146);
  - không `must_change_password`;
  - không `mfa_enabled` (fail-closed, BE-63);
  - có vai OWN/MGR.
- Không hợp lệ thì gọi `verifyPassword(null, …)`, tức băm giả, **không bao giờ** kiểm mật khẩu thật.
- argon2 chạy đúng 1 lần mỗi request, và chỉ có **một** chỗ ném 401, nên thân lỗi giống nhau theo cấu trúc mã.
- Khóa SR-RL-02: kiểm **trước** argon2. Khóa của người xác nhận chỉ xét khi người đó hợp lệ, nên tài khoản đang khóa đăng nhập trả 401, không phải 429.
- Đếm: người gọi luôn +1; người xác nhận +1 chỉ khi hợp lệ. Cập nhật nguyên tử, khóa dòng `FOR UPDATE` theo thứ tự id.
- Audit `security` không có chuỗi tên gõ vào.

Chạy test: SEC chạy trên **DB riêng mới tạo** `ottimo_test_sec_r4late` (postgres dev, migrate từ đầu qua globalSetup), Node 22.23.3. `vitest run s438r4-money.test.ts s438r3-money.test.ts -t "BUG-R2-146|BUG-R2-139|masked"` → **3 passed** (14 skipped do lọc):
- BUG-R2-146: `mTemp` (`locked_until` 2031) với mật khẩu **đúng** + FOC → 401 `REAUTH_FAILED` ở `lateFeeInsteadOfNight.secret`. Thân **giống hệt** ca tên không có (bỏ `requestId`). Không có `finalPayment` cũng 401. Đơn giữ `in_house`; không `approval_request`, không audit money. Bộ đếm FD +3, `mTemp` 0. Đối chứng `mgr` → 200, FOC −396.000, folio 1.980.000, 0/0.
- BUG-R2-139 (BR-416-06): mật khẩu sai / tên không có / tài khoản FD (mật khẩu đúng của FD) → cùng 401; bộ đếm `{fd: 3, mgr: 1}`; mật khẩu thử không có trong audit, `idempotency_key`, Problem; 200 → `{fd: 3, mgr: 0}`, 1 thông báo `account_security_change`, audit `channel = desk`, FOC `approver_id` = mgr.
- `masked`: `lateFeeInsteadOfNight.secret` và `reauth.secret` được che trong log.

Bộ 401 đồng nhất trong repo đã có 5 trường hợp: mật khẩu sai, tên không có, FD, khóa đăng nhập, (đối chứng hợp lệ).

**Còn thiếu so với test BE-59** (BE-A thêm vào cùng bảng; SEC kiểm khi ORC báo 149/150/153/154 xong). Các ca dưới đây đều phải trả 401 với thân giống hệt ca "tên không có", và bộ đếm của tài khoản đó không đổi:
- `disabled`;
- khóa cứng (`status = 'locked'`, `locked_until` NULL);
- `must_change_password`;
- `mfa_enabled`;
- MGR của **cơ sở khác** cùng tổ chức;
- MGR có vai đã **thu hồi**.

Theo mã, các ca này đi cùng nhánh với ca khóa đăng nhập. Vì vậy SEC chỉ coi đây là thiếu test, không phải lỗi.

DB thử `ottimo_test_sec_r4late` để lại trên postgres dev. OPS/ORC dọn cùng các DB `ottimo_test_*` khác khi tiện.

## 11. Kiểm lại vòng sửa 4 – BUG-R2-146/149/150/153/154 (SEC, 18/10, cây chung chưa commit)

**Kết quả: ĐẠT. Sáu thẻ server BE-59 … BE-64 đều Verified, đóng BE-59.** Phía server đã đủ điều kiện SEC cho D5 / SR-AUTH-11. Còn mở, không chặn: ARC-24, ARC-26, FE-08 (Minor, trước GL) và ARC-25 (đã có US-164 R3 + ESC-024).

Đối tượng kiểm: HEAD `2efec17` + phần BE-A chưa commit (`outputs/BE/s4-be-a.md` mục 15).

### 11.1 Test SEC tự chạy

DB riêng mới tạo `ottimo_test_sec_r4fix`, migrate từ đầu qua globalSetup, Node 22.23.3. Lệnh: `vitest run test/integration/s438r4-money.test.ts test/integration/s438r3-money.test.ts test/redact.test.ts` → **3 tệp, 32/32 xanh**. DB cũ `ottimo_test_sec_r4late` đã xóa.

### 11.2 Theo thẻ

| Thẻ | Kết quả | Bằng chứng |
|---|---|---|
| **BE-59** | Verified – đóng | `verifyApprover` (`password-reauth.ts`) hợp lệ chỉ khi `active`, `locked_until` NULL hoặc ≤ now, không `must_change_password`, không `mfa_enabled`, có vai OWN/MGR chưa thu hồi ở cơ sở của người gọi. Không hợp lệ thì dùng băm giả. Test `s438r4` "6 more states": `disabled`, khóa cứng, `must_change_password`, `mfa_enabled`, MGR cơ sở khác, vai đã thu hồi, cùng ca khóa đăng nhập (BUG-R2-146), đều dùng **mật khẩu đúng**. Tất cả → 401 với thân **giống hệt** ca "tên không có" (bỏ `requestId`), bộ đếm của các tài khoản đó vẫn 0. Tài khoản FD với mật khẩu đúng của FD → 401 (`s438r3`) |
| BE-60 | Verified | Người gọi luôn +1; người xác nhận +1 chỉ khi hợp lệ (`s438r3` `{fd:3, mgr:1}` → đúng thì `{fd:3, mgr:0}`). Ca 154: FD4 sai 5 lần với MGR2 → cả hai bị khóa → lần sau 429 |
| BE-61 | Verified | `http.ts` `formatters.log: withoutSecrets`, che ở mọi độ sâu. Test "SEC BE-61": `body.lateFeeInsteadOfNight.secret` và `reauth.secret` không có trong log, câu lỗi vẫn giữ. Mật khẩu thử không có trong `audit_event` / `idempotency_key` / Problem (`s438r3`) |
| **BE-62** | Verified | Audit `money` có: `confirmedBy` (id), `approverRole`, `channel` (`desk`/`self`), `authMethod`, `focVnd`, lý do; **không** có tên đăng nhập (ca 153: `{role: owner, name: null}`). Danh sách cho phép ở `reservations.module.ts` có `approverRole`. FOC (BUG-R2-153, `noSelfApply`): người duyệt = người xác nhận, kể cả MGR tự xác nhận (`approver_id` = OWN, vai `owner`, `password`; ca 148 = MGR, `password`). `requester_id` = người gọi, kết hợp `channel` trong audit là đủ để truy, không cần trường snapshot riêng. Thông báo `account_security_change` cho người xác nhận khi khác người gọi (1 lần, gửi lại không thêm). `security_alert` khi bị khóa gửi người bị khóa, người gọi **và mọi OWN** (ca 154: MGR2, FD4, OWN, OWN2) |
| BE-63 | Verified | `pin` → 422 `NOT_IN_LIST` (`s438r3`); `mfa_enabled` → 401 giống hệt (ca 6 trạng thái) |
| **BE-64** | Verified | `frontdesk.controller.ts` `checkOut` đi theo thứ tự (1)–(4) bên dưới. `lateFeePrecheck` không còn đường tắt "thiếu giờ". Ca 149: thiếu `checkoutTime` với mật khẩu sai và đúng → cùng 422; thiếu `amountVnd` 422; `special_discount` 422; `requestFoc.secret` 422; trước ngày đi 409; bộ đếm FD/MGR không đổi |

Thứ tự BE-64 trong `checkOut`:
1. `completedReplay` (bước 0).
2. Khuôn `authMethod` / `secret` / `approverUsername`.
3. `lateFeePrecheck` trong `read()`: khuôn body (`checkoutTime` bắt buộc, `checkoutAt`, `extraNight`, `lateFeeInsteadOfNight` gồm `requestFoc`), `in_house`, ngày đi hoặc cửa sổ sau nửa đêm (409), `SURCHARGE_CHANGED`, `NOT_ALLOWED`. `read()` từ chối vai bị guard loại, nên không có mật khẩu nào bị thử cho vai không được phép.
4. `verifyApprover`, rồi `uow.run`.

### 11.3 Bước 0 (BUG-R2-150) – 3 điều kiện và 4 ca test

| Điều kiện / ca | Kết quả |
|---|---|
| ĐK 1: cùng `requestHash`, cùng phạm vi với `claimKey` | Đạt. `UnitOfWork.completedReplay` gọi `requestHash(req.method, pathOf(req.url), req.body ?? null)` y như `run`. `SELECT … WHERE principal_type='user' AND principal_id = <người gọi> AND key = $2` giống hệt `claimKey`, giao dịch chỉ đọc riêng, dưới RLS của người gọi |
| ĐK 2: `in_progress` → 409 ngay, không kiểm mật khẩu, không đếm | ~~Đạt theo mã~~ **Đạt một phần, SEC chấp nhận (mục 12.2, sửa 18/10 sau kiểm lại lần 5).** Chỉ phủ dòng `in_progress` đã commit. Key đang chạy thật trong giao dịch chưa commit thì bước 0 không thấy (BUG-R2-166) |
| ĐK 3: không lưu `secret` / tên gõ vào | Đạt. Băm bỏ `secret`; phản hồi lưu chỉ gồm `reservation`, `billNo`, `createdTaskIds`; test `s438r3` không thấy mật khẩu thử trong `idempotency_key` |
| Ca (a) gửi lại, mật khẩu sai → 200 replay, 0 đếm, 0 audit | Đạt (ca 150: `idempotent-replayed: true`, bộ đếm và số audit không đổi, folio 2.376.000) |
| Ca (b) đổi `amountVnd` → 422 | Đạt (`IDEMPOTENCY_KEY_REUSED`) |
| Ca (c) FD khác dùng cùng key → 409 ở bước chỉ đọc, không đếm | Đạt (409, bộ đếm FD4 = 0) |
| Ca (d) B18 thường gửi lại không đổi | Đạt (200 replay) |

**`completedReplay` không lộ phản hồi đã lưu cho người gọi khác:** tra theo `principal_id` = người gọi, cùng khóa chính với `claimKey`. Ca (c) chứng minh FD4 không nhận bản lưu của FD. Đặt `auth.enforced = true` trước khi trả bản lưu là đúng cách `run` vẫn làm khi gửi lại.

### 11.4 Gợi ý (không chặn)

- Ca (c) nên khẳng định cả `code = INVALID_TRANSITION`, không chỉ mã 409.
- Thêm ca ĐK 2: chèn dòng `idempotency_key` `in_progress` → 409, bộ đếm 0/0.
- Thêm ca: gửi `lateFeeInsteadOfNight` trên đêm còn bán được với mật khẩu sai → 422 `NOT_ALLOWED`, 0/0. Mã đã đúng, chỉ thiếu test.
- Nếu sau này dùng lại `completedReplay` cho operation có `dryRun`: bỏ qua bước 0 khi `dryRun`, như `run`.
- `password-reauth.ts` (tệp của SEC) giờ có `verifyApprover`. Mọi chỗ mới gọi hàm này phải qua SEC review (SR-AUTH-11).

DB `ottimo_test_sec_r4fix` còn để lại để kiểm lại nếu cần; dọn cùng các DB `ottimo_test_*` khác.

## 12. Quyết định SEC cho BUG-R2-165 / 166 / 167 (kiểm lại tiền lần 5, 18/10)

Nguồn: `reviews/s4-money-recheck5.md` (R5LATE-01/02/03, mục "Bảo mật"). Cả ba là P3, không lệch tiền, không phải lỗ hổng P1/P2. **Không chặn cổng QC Sprint 4.**

| Mã | Quyết định | Việc | Hạn |
|---|---|---|---|
| **BUG-R2-165** BE-64 còn sót | **SỬA** | BE-A (12.1) | Vòng 5. Nếu cổng QC đến trước thì SEC chấp nhận có hạn tới **trước khi bắt đầu R3** |
| **BUG-R2-166** bước 0 không thấy key đang chạy thật | **CHẤP NHẬN**, sửa câu chữ ĐK 2 và 11.3 | BE-A: thêm 1 ca test đồng thời (12.2) | Vòng 5 (chỉ test) |
| **BUG-R2-167** mật khẩu đúng, B18 lỗi, không dấu vết | **SỬA** | BE-A (12.3) | Vòng 5. Đây là mục đáng nhất trong ba |

### 12.1 BUG-R2-165 – SỬA

Lý do: hợp đồng `checkOut` 18/10 và BE-64 đã ghi là quy tắc. Cách sửa rẻ, cùng tệp. Rủi ro hiện tại thấp: precheck vẫn đòi ca thật (đúng ngày đi, đêm không bán được, đúng số tiền), nên không mở đường dò mới. Lần thử sai ở đây cũng chỉ bị đếm như mọi lần thử sai khác.

Việc BE-A:
1. Tách **một** hàm đọc input của B18 (ví dụ `readCheckoutInput(body)`): `checkoutTime`, `checkoutAt`, `checkoutTimeNote`, `applyLateSurcharge`, `expectedSurchargeVnd`, `extraNight`, `lateFeeInsteadOfNight` (gồm `requestFoc`), `finalPayment` (`paymentInput`), `overpaymentHandling`, `debt`. `lateFeePrecheck` và `checkOut` cùng gọi hàm này. Không giữ hai bộ kiểm khuôn song song.
2. Trong `lateFeePrecheck`, **trước** `verifyApprover`, thêm headroom `requestFoc.amountVnd` ≤ `lateFeeAsNightVnd` − FOC trả muộn đã duyệt/đang chờ của lượt. Phải dùng **cùng** hàm tính với lúc ghi (→ 422 `VALUE_OUT_OF_RANGE`).
3. Nên làm: `If-Match` lệch → 412 trước khi kiểm mật khẩu (đọc `version` trong cùng giao dịch chỉ đọc).
4. Sửa chú thích tự mâu thuẫn ở đầu `lateFeePrecheck` (câu "A body B18 would refuse for its own fields … passes here").
5. Test 6 ca của critic: `bitcoin`, −1, `"x"`, `keep`, `"yes"`, 792.001. Mật khẩu sai và mật khẩu đúng phải trả **cùng** một 422, bộ đếm 0/0.

Phạm vi không đổi: các từ chối phụ thuộc **danh tính người xác nhận** (403 `APPROVAL_LIMIT_EXCEEDED` theo hạn mức BR-433 của người đó) và các chặn trạng thái nặng (`MINIBAR_NOT_CHECKED`, `PENDING_APPROVALS`, `BALANCE_DUE`) vẫn đứng **sau** bước kiểm mật khẩu. Từ khi sửa 167, các ca này đều để dấu vết.

ARC: thêm một câu "khuôn body = mọi trường của B18" vào mô tả `checkOut`.

### 12.2 BUG-R2-166 – CHẤP NHẬN (sửa câu chữ)

Lý do:
- Cửa sổ chỉ kéo dài trong lúc giao dịch B18 đầu chưa commit, cỡ mili giây tới vài giây.
- Không ghi trùng: `claimKey` chờ trên khóa chính rồi trả 409 `IDEMPOTENCY_IN_PROGRESS`, hoặc trả bản lưu nếu B18 đầu đã commit.
- Lần gửi lại hợp lệ của Desk mang **đúng** mật khẩu (cùng body trong bộ nhớ), nên không bị đếm sai.
- Lần gửi lại kèm mật khẩu **sai** là một lần thử sai thật. Đếm nó là đúng với SR-RL-02, không phải tác dụng phụ.
- Cách sửa (1) thêm một lượt khóa/ghi trên đường nóng cho một cửa sổ rất hẹp, mà không giảm được rủi ro nào đáng kể.

Câu ĐK 2 mục 9 **sửa thành**: "Key có dòng `in_progress` **đã commit** → 409 `IDEMPOTENCY_IN_PROGRESS` ở bước 0, không kiểm mật khẩu, không đếm. Với `UnitOfWork` hiện tại, dòng như vậy chỉ xảy ra khi có dữ liệu chèn tay hoặc lỗi. Key của một B18 **đang chạy trong giao dịch chưa commit**: bước 0 không thấy, request đi tiếp các bước 1–4 như một lần thử mới (có kiểm và đếm mật khẩu), sau đó `claimKey` trả 409 hoặc replay. Không ghi trùng. SEC chấp nhận."

Việc BE-A: thêm ca đồng thời thật (r5late M6). B18 đầu giữ giao dịch; gửi lại cùng key:
- mật khẩu **đúng** → 409 `IDEMPOTENCY_IN_PROGRESS` (hoặc 200 replay nếu B18 đầu đã commit), bộ đếm 0/0;
- mật khẩu **sai** → 401, bộ đếm +1/+1 (hành vi được chấp nhận, ghi rõ trong tên ca);
- B18 đầu → 200, folio 2.376.000, không ghi trùng.

### 12.3 BUG-R2-167 – SỬA

Lý do: đây là khoảng trống trong kiểm soát phát hiện của BE-62 / SR-AUTH-11 (6). Kiểm soát này là chốt duy nhất trước rủi ro "nhìn trộm mật khẩu tại quầy" (mục 7). Hiện tại, một FD đã đoán hoặc nhìn được mật khẩu quản lý có thể **kiểm im lặng**: gửi một B18 chắc chắn bị từ chối sau bước kiểm mật khẩu (thiếu `finalPayment` → 409 `BALANCE_DUE`, `If-Match` cũ → 412, vượt hạn mức → 403). Mật khẩu đúng thì không có audit, không có thông báo, và bộ đếm của quản lý về 0.

Việc BE-A:
1. Trong `PasswordReauth.verifyApprover`, nhánh **đúng** với người xác nhận ≠ người gọi, trong **giao dịch riêng** của hàm (commit kể cả khi B18 sau đó lỗi):
   - (a) audit `security` `${purpose}.reauth_succeeded` (= `late_fee_as_night.reauth_succeeded`): `entityType = app_user`, `entityId` = người xác nhận, `after = {authMethod, confirmingFor: <người gọi>}`, kèm `requestId`. Không ghi tên đăng nhập.
   - (b) thông báo `account_security_change` cho người xác nhận qua callback `onSucceeded(tx, approverId)` do controller truyền vào (giống `onLocked`), `refType = reservation`, `refId` = đơn, không có số tiền.
2. **Bỏ** thông báo trùng ở nhánh thành công của `checkout.service.ts`, để mỗi lần dùng mật khẩu có đúng **1** thông báo. Audit `money` `reservation.late_fee_instead_of_night` giữ nguyên. Hai bản ghi nối với nhau qua `requestId`.
3. **Bộ đếm: giữ cách xóa về 0 khi đúng.** SR-RL-02 đếm số lần sai liên tiếp. Mật khẩu đúng đã chứng minh danh tính, và người đã biết mật khẩu thì không cần xóa bộ đếm để dò tiếp. Điều cần có là **dấu vết**: 1(a) ghi lại cả việc xóa này (`after.failedCountCleared` = số trước khi xóa, nếu > 0). Không đổi bộ đếm của người gọi.
4. Tự xác nhận (OWN/MGR, không có tên) **không** ghi `reauth_succeeded` và không thông báo (phiên của chính mình). Giữ như hiện tại.
5. Test 4 ca critic: mật khẩu đúng, sau đó 409 `BALANCE_DUE` / 412 / 403 / 422. Mỗi ca → +1 audit `security` `reauth_succeeded`, +1 thông báo cho mgr. B18 thành công → vẫn đúng 1 thông báo + 1 audit `reauth_succeeded` + 1 audit `money`.

R3, gợi ý cho SR-LOG-06: cảnh báo OWN khi có `reauth_succeeded` mà không có audit `money` cùng `requestId` từ 2 lần trở lên trong 24 giờ trên cùng người xác nhận.

### 12.4 Sửa lại đánh giá 11.3

Dòng "ĐK 2" ở 11.3 **thay bằng**: "**Đạt một phần, SEC chấp nhận (mục 12.2).** Chỉ phủ dòng `in_progress` đã commit (có test dòng chèn tay). Key đang chạy thật trong giao dịch chưa commit thì bước 0 không thấy (BUG-R2-166). Đánh giá 'Đạt theo mã' trước đây sai trong trường hợp đồng thời thật."

Sau vòng 5, SEC sẽ kiểm lại BE-64 (165), BE-62 (167) và ca đồng thời (166).

## 13. Kiểm lại vòng sửa 5 – BUG-R2-165 / 166 / 167 (SEC, 18/10, HEAD `8819c2d` + cây chung chưa commit)

**Kết quả: ĐẠT.** BE-62 và BE-64 **Verified** lại. Sáu thẻ server BE-59 … BE-64 đều đạt. Giả định r5-2 của BE-A: **SEC chấp nhận**.

### 13.1 Test SEC tự chạy

DB riêng mới tạo `ottimo_test_sec_r5`, migrate từ đầu, Node 22.23.3. Lệnh: `vitest run s438r5-money s438r4-money s438r3-money redact` → **4 tệp, 38/38 xanh**. DB cũ `ottimo_test_sec_r4fix` đã xóa.

### 13.2 Theo mã

| Mã / thẻ | Kết quả | Bằng chứng |
|---|---|---|
| **BUG-R2-165 / BE-64** | Đạt | `lateFeePrecheck` gọi đúng `readInput` (mọi trường B18, gồm `finalPayment` qua `checkPaymentShape` dùng chung với `recordInTx`) và đúng `decide` (ngày đi 409 → số tiền 409 → dữ liệu trường 422 → headroom `lateFocHeadroom` 422 + `max`) như B18. Thêm `assertVersion` (412) trước mật khẩu. Không còn bộ kiểm thứ hai. Ca r5 "165": `bitcoin`, −1, `"x"`, `keep`, `"yes"`, FOC 792.001, `If-Match` cũ → mật khẩu sai và đúng cùng mã, cùng `errors`, bộ đếm 0/0, **không thêm audit security** (chứng tỏ mật khẩu không được kiểm), 0 thông báo. Headroom khi đã có FOC 100.000 được duyệt: 692.001 → 422 `max` 692.000 trước mật khẩu; 692.000 → 200 |
| **BUG-R2-167 / BE-62** | Đạt | Xem 13.3 cho phần mã. Ca r5 "167": mật khẩu đúng rồi bị từ chối (409 `BALANCE_DUE`, 403 `debt` do FD, 422 `AMOUNT_EXCEEDS_BALANCE`, 412 do phiên bản đổi sau bước mật khẩu) → mỗi ca +1 `reauth_succeeded` (`confirmingFor` = FD; lần đầu `failedCountCleared = 2`) và +1 thông báo. MGR tự xác nhận: 0. B18 thành công: đúng 1 thông báo + 1 `reauth_succeeded` + 1 audit `money`, cùng `requestId` |
| **BUG-R2-166** (chấp nhận) | Đạt (ca test) | Ca r5 "166": B18 đầu giữ key trong giao dịch. Gửi lại với mật khẩu sai → 401, đếm +1/+1 (đúng hành vi đã chấp nhận). Mật khẩu đúng → 409 `IDEMPOTENCY_IN_PROGRESS` hoặc 200 replay, 0/0. B18 đầu → 200, folio 2.376.000, đúng 1 dòng `late_fee_as_night`, 1 audit `money` |

### 13.3 Đọc `password-reauth.ts` (giao dịch riêng)

- **Không lộ gì.**
  - `reauth_succeeded` chỉ có `authMethod`, `confirmingFor` (id người gọi), `failedCountCleared` (số, chỉ khi > 0), `requestId`. Không có mật khẩu, không có tên đăng nhập. Allowlist `app_user` thêm đúng `failedCountCleared`.
  - Thông báo (`onSucceeded` ở controller) chỉ tới **người xác nhận** (`userIds: [approverId]`), `refType = reservation`, `refId`/`refCode` = đơn, không có số tiền.
  - Người gọi không nhận gì mới.
- **Giữ khi B18 lỗi.** Audit, thông báo và việc xóa bộ đếm nằm chung giao dịch `withContext` riêng của `verifyApprover`, commit trước `uow.run`.
- **Fail-closed.** Nếu `onSucceeded` lỗi, cả giao dịch (kể cả việc xóa bộ đếm) rollback và B18 không chạy. Không có B18 nào thành công mà thiếu dấu vết.
- **Không ghi trùng.** `checkout.service.ts` đã bỏ thông báo ở nhánh thành công (còn đúng 1 chỗ gửi: `frontdesk.controller.ts` `onSucceeded`). Gửi lại qua bước 0 không gọi `verifyApprover` nên không thêm gì.
- **Chấp nhận:** gửi lại **đồng thời** với mật khẩu đúng (BUG-R2-166) tạo thêm 1 `reauth_succeeded` + 1 thông báo. Đó là một lần dùng mật khẩu thật, nên đây là dấu vết đúng, không phải trùng.
- **Ghi nhận, không phải lỗi.** `failedCountCleared` lấy từ `approval_pin_failed_count`. Ngay sau một lần khóa, bộ đếm đã về 0 (lần khóa nằm ở `approval_pin_locked_until` và có audit `reauth_locked` riêng), nên một lần đúng sau khi hết khóa sẽ không có `failedCountCleared`. Dấu vết của lần khóa vẫn đủ.
- **Tự xác nhận:** không audit, không thông báo (người gọi = người xác nhận), đúng 12.3 (4).

### 13.4 Giả định r5-2 – SEC CHẤP NHẬN

Các từ chối sau vẫn đứng sau bước mật khẩu:
- 403 theo vai **người gọi** (`debt`, `retain_with_guest_consent` do FD/FDL gửi);
- 422 `AMOUNT_EXCEEDS_BALANCE` (trần `finalPayment` sau phụ thu và FOC);
- 403 hạn mức người xác nhận và 409 `MINIBAR_NOT_CHECKED` / `PENDING_APPROVALS` / `BALANCE_DUE`, như 12.1.

Lý do chấp nhận:
- Precheck vẫn đòi đúng ca thật (đúng ngày đi, đêm không bán được, đúng số tiền, đúng phiên bản), nên không mở đường dò mới.
- Từ khi sửa 167, mật khẩu đúng mà bị từ chối luôn để lại `reauth_succeeded` + thông báo cho quản lý. Mật khẩu sai thì bị đếm và audit. Không còn "kiểm im lặng".
- `AMOUNT_EXCEEDS_BALANCE` cần tính số còn phải thu sau FOC. Đưa lên trước sẽ nhân đôi phép tính tiền nặng nhất, dễ lệch giữa hai nơi.

Gợi ý R3, không chặn: 403 theo vai người gọi chỉ phụ thuộc principal và trường body, nên có thể đưa lên `readInput`/precheck với chi phí gần như 0.

### 13.5 Còn mở

Ở thẻ của SEC: ARC-24, ARC-26, FE-08 (Minor, trước GL); ARC-25 (US-164 R3 + ESC-024). Không còn việc server nào của SEC trên đường D5 / SR-AUTH-11.

DB `ottimo_test_sec_r5` còn để lại để kiểm lại nếu cần.
