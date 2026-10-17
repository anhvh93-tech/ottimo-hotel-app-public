# Đặc tả mức trường – EP00 Nền tảng + EP10 CRM (Round 2)

- Tác giả: BA | Round 2 – Đợt 0 (đi trước Sprint 1 một sprint) | Ngày: 16/10/2026 | Phiên bản: 0.1
- Phạm vi: story Must R2 của EP00 – US-001, 002, 003, 004, 005, 006, 007, 135, 142; phần "platform" dùng chung (kênh, mã chứng từ, xác nhận lại, lỗi chung); EP10 hồ sơ khách – US-071, 072, 073.
- Nguồn (thứ tự ưu tiên khi lệch): `business-rules.md` **v0.3.1** (BR – mọi con số) → `03-backlog/backlog.md` (AC) → `state-machines.md` v0.2.2 (SM) → `rbac-matrix.md` v0.2.1 (A-xx, S-xx, Dxx) → `api/openapi.yaml` **0.3.0-draft** (operation, `Problem.code`) → `design/copy/strings-vi.json` (khóa chuỗi). Quyết định INV 16/10 (ESC-001…014) theo `01-decisions/decision-log.md`.
- Đọc cùng: `specs/EP02-reservations.md` (đơn, rack, sale).
- Tài liệu này **không thiết kế giao diện** (bố cục, màu, thành phần là của UXD) và **không chép con số nghiệp vụ** (ghi mã BR). Con số ở đây chỉ là **ràng buộc nhập liệu** (độ dài, định dạng) – thuộc quyền BA theo quy ước backlog mục 4 (loại a).

---

## 0. Quy ước chung cho mọi màn hình

### 0.1 Cách đọc bảng trường
| Cột | Ý nghĩa |
|---|---|
| Trường (API) | Tên thuộc tính JSON trong OpenAPI 0.3; `—` = chỉ có trên giao diện |
| Kiểu | `text`, `int`, `money` (số nguyên VND, BR-004), `date` (`YYYY-MM-DD`, ngày lưu trú/ngày nghiệp vụ), `time` (`HH:mm`), `instant` (ISO-8601 `+07:00`), `enum`, `bool`, `uuid` (chọn từ danh sách) |
| BB | **B** = bắt buộc · **K** = không bắt buộc · **ĐK** = bắt buộc khi có điều kiện (ghi ở cột ràng buộc) |
| Kiểm tra | Mã kiểm tra dùng chung (V-xx, mục 0.3) hoặc ràng buộc riêng. Kiểm ở **cả client (tức thời, khi rời ô) và server**; server là nguồn đúng |
| Lỗi | `Problem.code` (HTTP) khi lỗi cả request; `FieldError.code` khi lỗi một ô (nằm trong `errors[]` của `422 VALIDATION_FAILED`) → khóa chuỗi trong `strings-*.json`. Khóa có dấu **(mới)** là chuỗi BA đề xuất, UXD duyệt câu chữ và thêm VI/EN |

### 0.2 Hiển thị lỗi
1. Lỗi một ô (`errors[].field`) → dòng đỏ dưới đúng ô đó; tiêu đề form hiện `error.VALIDATION_FAILED` với `{n}` = số ô lỗi. Con trỏ nhảy tới ô lỗi đầu tiên.
2. Lỗi cả request (`code` ≠ `VALIDATION_FAILED`) → thông báo theo khóa `error.<CODE>` ở đầu form/hộp thoại; **dữ liệu đã nhập giữ nguyên** (không xóa form).
3. Client **không** hiện `detail` thô của server (OpenAPI quy ước chung). Lỗi không có trong bảng mã → `error.server` kèm `requestId`.
4. Lỗi chung cho mọi thao tác ghi (không lặp lại ở từng màn):

| HTTP / code | Hành vi giao diện | Chuỗi |
|---|---|---|
| 401 `UNAUTHENTICATED` | Chuyển về đăng nhập; lưu nháp form trên máy (sessionStorage), khôi phục sau khi đăng nhập lại cùng tài khoản | `error.UNAUTHENTICATED` |
| 403 `FORBIDDEN_ACTION` | Thông báo, không thử lại; server đã ghi nhật ký lần bị từ chối (rbac 8.5) | `error.FORBIDDEN_ACTION` |
| 403 `PASSWORD_CHANGE_REQUIRED` | Chuyển sang màn đổi mật khẩu (mục 1.3) | `error.PASSWORD_CHANGE_REQUIRED` **(mới)**: "Bạn đang dùng mật khẩu tạm. Đổi mật khẩu để tiếp tục." |
| 403 `DEVICE_NOT_TRUSTED` | Thông báo + hướng dẫn dùng máy quầy đã cấp | `error.DEVICE_NOT_TRUSTED`, `device.blocked_body` |
| 401 `REAUTH_REQUIRED` | Mở hộp xác nhận lại (mục 0.5), thành công → tự gửi lại thao tác | `error.REAUTH_REQUIRED` **(mới)**: "Nhập lại mật khẩu để tiếp tục xem dữ liệu giấy tờ." |
| 404 `NOT_FOUND` | Thông báo, quay về danh sách | `error.NOT_FOUND` |
| 412 `VERSION_CONFLICT` | Thông báo, nút "Tải lại"; giữ dữ liệu đã nhập để người dùng nhập lại | `error.VERSION_CONFLICT` |
| 428 `PRECONDITION_REQUIRED` | Lỗi lập trình client – hiện chuỗi, ghi log client | `error.PRECONDITION_REQUIRED` |
| 409 `IDEMPOTENCY_IN_PROGRESS` | Khóa nút, tự hỏi lại sau 2 giây (tối đa 5 lần) | `error.IDEMPOTENCY_IN_PROGRESS` |
| 422 `IDEMPOTENCY_KEY_REUSED` | Sinh khóa mới khi người dùng bấm lại | `error.IDEMPOTENCY_KEY_REUSED` |
| 429 `RATE_LIMITED` | Khóa nút đến hết thời gian chờ server trả (`Retry-After`) | `error.RATE_LIMITED` |
| 422 `CARD_NUMBER_DETECTED` | Dòng đỏ dưới ô ghi chú chứa dãy số giống số thẻ | `error.CARD_NUMBER_DETECTED` |

5. Mọi nút gửi bị khóa từ lúc bấm đến khi có phản hồi (chống bấm hai lần); mỗi lần bấm "Lưu" dùng **một** `Idempotency-Key` mới, gửi lại do mạng dùng **lại** khóa cũ (OpenAPI quy ước Idempotency).

### 0.3 Kiểm tra hợp lệ dùng chung (V-xx)
| Mã | Áp cho | Quy tắc (chuẩn hóa trước, kiểm sau) | `FieldError.code` → chuỗi |
|---|---|---|---|
| V-01 Họ tên | `fullName`, `displayName` | Cắt khoảng trắng đầu/cuối, gộp nhiều khoảng trắng thành một. Dài 1–120 ký tự (`displayName` 1–80). Phải có ít nhất 1 chữ cái (mọi bảng chữ, kể cả có dấu, Cyrillic, CJK). **Không** chứa chữ số. Cho phép khoảng trắng, `-`, `'`, `.` | `REQUIRED` → `common.required`; `TOO_LONG` → `field_error.too_long` **(mới)** "Tối đa {max} ký tự."; `NAME_INVALID` → `field_error.name_invalid` **(mới)** "Họ tên chỉ gồm chữ cái, dấu cách, dấu gạch ngang." |
| V-02 SĐT | `phone` (khách), `phone` (nhân viên) | Bỏ mọi ký tự trừ chữ số và dấu `+` ở đầu. Chuẩn hóa BR-951: `0…` → `84…`; `+84…` → `84…`. Hợp lệ khi **một trong**: (a) số VN: sau chuẩn hóa bắt đầu `84`, sau `84` có 9 hoặc 10 chữ số, chữ số đầu sau `84` khác 0 (di động 9 số; cố định có mã vùng `2xx` 10 số); (b) số nước ngoài: người dùng nhập có `+`, mã nước khác `84`, tổng 8–15 chữ số (E.164). Nhập không có `+` mà không bắt đầu bằng `0` hoặc `84` → lỗi "thêm mã nước". Lưu dạng `84…`/mã nước (không dấu `+`) vào `phone_e164`; hiển thị dạng nhóm số; **API trả về** dạng E.164 **có** `+` (`+84905123456`, `+79123456789`) cho mọi trường SĐT đầy đủ trong phản hồi (hiện chỉ `Guest.phone`; `User` không trả SĐT – D27, ARC B-26); trường đã che (`phoneMasked`) giữ dạng che – OpenAPI 0.3.4, FB-R2-QA-BE-04 (BA xác nhận câu chữ 16/10, Sprint 2). Request vẫn nhận mọi dạng người dùng gõ ở trên; client **không** tự chuẩn hóa trước khi gửi | `PHONE_INVALID` → `booking.error.phone` (**UXD sửa câu** thành: "Số điện thoại chưa đúng. Số Việt Nam: 10 số bắt đầu bằng 0, ví dụ 0912 345 678. Số nước ngoài: bắt đầu bằng +mã nước."); `PHONE_COUNTRY_CODE_REQUIRED` → `field_error.phone_country` **(mới)** "Số nước ngoài cần bắt đầu bằng + và mã nước, ví dụ +7 912 345 6789." |
| V-03 Email | `email`, `guestEmail` | Cắt khoảng trắng, chữ thường (BR-951). Dài ≤ 254. Đúng một `@`; phần trước `@` 1–64 ký tự, không có khoảng trắng; phần sau `@` có ít nhất một dấu `.`, mỗi nhãn 1–63 ký tự chữ/số/`-`, nhãn cuối ≥ 2 chữ cái | `EMAIL_INVALID` → `field_error.email_invalid` **(mới)** "Email chưa đúng dạng, ví dụ ten@gmail.com." |
| V-04 MST | `taxCode` | Bỏ khoảng trắng. Dạng `^[0-9]{10}(-?[0-9]{3})?$` (10 số, hoặc 13 số cho chi nhánh, có/không có `-`). Lưu dạng `NNNNNNNNNN` hoặc `NNNNNNNNNN-NNN`. **Không** kiểm số kiểm tra (chữ số thứ 10) ở R2 `[GIẢ ĐỊNH BA – có thể bật ở R3 khi tích hợp MISA]` | `TAX_CODE_INVALID` → `invoice.tax_id_error` |
| V-05 Ngày lưu trú | `arrivalDate`, `departureDate`, `stayFrom`… | Đúng lịch dương; ngày đi > ngày đến (BR-002); "hôm nay" = **ngày nghiệp vụ** (BR-010) | `DATE_INVALID`; `DATE_ORDER` → `field_error.date_order` **(mới)** "Ngày đi phải sau ngày đến."; `DATE_IN_PAST` → `booking.error.past_date` |
| V-06 Ngày sinh | `dateOfBirth` | Không ở tương lai; tuổi tại ngày nghiệp vụ hiện tại ≥ `minor_data_age_threshold` (BR-612) – người dưới ngưỡng **không có hồ sơ CRM** (rbac mục 9), chỉ được thêm vào đơn dạng trẻ em; tuổi ≤ 120 | `DOB_FUTURE`; `DOB_MINOR` → `field_error.dob_minor` **(mới)** "Khách dưới {age} tuổi không tạo hồ sơ riêng. Thêm vào đơn dạng trẻ em."; `DOB_INVALID` |
| V-07 Tiền | mọi `…Vnd` | Số nguyên, không âm; ô "giá" phải > 0 (trừ chỗ ghi riêng); không nhận số thập phân, dấu phân cách hàng nghìn tự bỏ | `AMOUNT_INVALID`; `AMOUNT_NOT_POSITIVE` → `booking.error.rate_empty` (ô giá) |
| V-08 Lý do bắt buộc | `reason`, `note` khi chọn "Khác" | Cắt khoảng trắng; dài 3–500 ký tự (theo `minLength`/`maxLength` từng operation); qua V-09 | `REASON_REQUIRED` → `field_error.reason_required` **(mới)** "Ghi lý do (ít nhất 3 ký tự)." |
| V-09 Văn bản tự do | `note`, `freeNote`, `internalNote`, `reason` | Server quét chuỗi 13–19 chữ số liền (cho phép khoảng trắng/gạch giữa) hợp Luhn → `422 CARD_NUMBER_DETECTED` (R-PAY-07, decision-log SEC 16/10 tầng A). Giao diện có câu nhắc "không ghi số giấy tờ, số thẻ, thông tin sức khỏe" (D12c) | `CARD_NUMBER_DETECTED` |
| V-10 Mật khẩu mới | `newPassword`, `initialPassword`, `resetPassword` | Dài 10–256 (`initialPassword`/`resetPassword` tối thiểu 8 theo OpenAPI – BA đề nghị ARC nâng lên 10 cho khớp, mục 13). Không trùng `username`, không trùng mật khẩu hiện tại. Không yêu cầu ký tự đặc biệt (SR-AUTH) | `PASSWORD_TOO_SHORT` → `field_error.password_short` **(mới)** "Mật khẩu cần ít nhất {min} ký tự."; `PASSWORD_SAME_AS_USERNAME`, `PASSWORD_REUSED` → `field_error.password_reused` **(mới)** "Mật khẩu mới phải khác mật khẩu cũ và tên đăng nhập." |
| V-11 Danh mục | mọi `enum`, `uuid` chọn từ danh sách | Giá trị phải có trong danh mục **đang hoạt động** của cơ sở | `NOT_IN_LIST` → `field_error.not_in_list` **(mới)** "Chọn một giá trị trong danh sách." |

### 0.4 Phân quyền chung
- Menu dựng từ `Me.properties[].screens` (mã S01…S34). Màn không có trong danh sách → không hiện menu; mở thẳng đường dẫn → trang "Không có quyền" và API trả `403 FORBIDDEN_ACTION` (US-002 AC2, rbac M4).
- Nút hành động trên tài nguyên có máy trạng thái chỉ hiện theo `allowedActions[]` server trả (US-020). Không tự suy từ vai trên client.
- Trường vắng mặt trong JSON (lọc `x-visible-to`) → giao diện **ẩn hẳn ô/cột**, không hiện "—" (tránh lộ sự tồn tại của dữ liệu).

### 0.5 Xác nhận lại bằng mật khẩu (dùng chung)
Dùng cho: duyệt yêu cầu (US-007), tự áp FOC minibar (US-007 AC6), cấp thiết bị (US-142), thao tác C3 có `x-step-up`.

| Trường | Kiểu | BB | Kiểm tra | Lỗi |
|---|---|---|---|---|
| `secret` / `password` | text (ẩn ký tự) | B | 1–256 ký tự | 401 `REAUTH_FAILED` → `error.REAUTH_FAILED` (**UXD sửa câu R2** thành "Mật khẩu chưa đúng. Còn {left} lần thử." – R2 dùng mật khẩu, PIN từ R3); 5 lần sai/15 phút → 429 `RATE_LIMITED` |

Tên người xác nhận lấy từ phiên đăng nhập, **không có ô chọn tên** (BR-432).

---

## 1. Đăng nhập, đăng xuất, đổi mật khẩu – S01 (US-001)

### 1.1 Đăng nhập – `login`
| Trường | Nhãn | Kiểu | BB | Kiểm tra | Lỗi |
|---|---|---|---|---|---|
| `username` | Tên đăng nhập | text | B | Cắt khoảng trắng, chữ thường; 3–64 ký tự `[a-z0-9._-]` | `REQUIRED` |
| `password` | Mật khẩu | text ẩn | B | 8–256 ký tự (không kiểm độ mạnh ở bước đăng nhập) | `REQUIRED` |

- Sai tên **hoặc** sai mật khẩu → 401 với một thông báo chung `auth.login.error_generic` (không phân biệt hai trường hợp – OpenAPI `login`).
- Quá 5 lần sai/tài khoản/15 phút hoặc 20 lần/IP/15 phút → 429 `RATE_LIMITED`, chuỗi `error.RATE_LIMITED` với `{minutes}` từ `Retry-After`.
- Thành công: `GET /v1/me` → chuyển tới màn mặc định của vai (rbac mục 1): OWN/MGR → Tổng quan (S02); FDL/FD → **Hôm nay** (US-001 AC1); HK → Buồng phòng – việc hôm nay; MT → Bảo trì – phiếu đang mở; SAL/CTV → Sale & báo giá (S15). Tài khoản nhiều vai → màn của vai **đầu tiên** theo thứ tự OWN, MGR, FDL, FD, SAL, CTV, HK, MT `[GIẢ ĐỊNH BA – thứ tự trình bày]`. Đầu trang hiện `Me.displayName` (AC1).
- `Me.mustChangePassword = true` → chỉ mở màn 1.3 (AC4).
- **Lệch chuỗi cần UXD sửa**: `auth.login.username` hiện là "Số điện thoại hoặc email" nhưng hợp đồng là `username` (ví dụ `hanh.fd`). Đề nghị nhãn "Tên đăng nhập".
- R3: 401 `MFA_REQUIRED` → màn nhập mã TOTP (`auth.totp.*`) – ngoài phạm vi R2.

### 1.2 Phiên và đăng xuất
- Phiên admin-web tự khóa sau 30 phút không hoạt động, tối đa 12 giờ; PWA 72 giờ không hoạt động, tối đa 30 ngày (rbac 8.8). Hết phiên → hành vi `UNAUTHENTICATED` (mục 0.2).
- Đăng xuất (`logout`) không có hộp xác nhận; nếu form đang có dữ liệu chưa lưu → hộp `common.unsaved_*`.
- **Đổi người nhanh** trên máy quầy (A117) = đăng xuất + mở màn đăng nhập ngay, không xóa cookie thiết bị `__Host-ottimo_did`.
- Mở thẳng đường dẫn màn nội bộ khi chưa đăng nhập → chuyển về đăng nhập, sau đăng nhập quay lại đường dẫn đó nếu vai được phép (AC2).

### 1.3 Đổi mật khẩu – `changeMyPassword`
| Trường | Nhãn | Kiểu | BB | Kiểm tra | Lỗi |
|---|---|---|---|---|---|
| `currentPassword` | Mật khẩu hiện tại (mật khẩu tạm) | text ẩn | B | 8–256 | 401 → `field_error.current_password_wrong` **(mới)** "Mật khẩu hiện tại chưa đúng." |
| `newPassword` | Mật khẩu mới | text ẩn | B | V-10 | V-10 |
| — | Nhập lại mật khẩu mới | text ẩn | B | Trùng `newPassword` (chỉ kiểm ở client) | `field_error.password_mismatch` **(mới)** "Hai lần nhập chưa giống nhau." |

Thành công: thu hồi mọi phiên khác, giữ phiên hiện tại (SR-SES-06), `mustChangePassword=false`, chuyển tới màn mặc định.

### 1.4 Ghi đúng người thực hiện (AC3)
Mọi thao tác ghi lưu `actor_user_id` từ phiên (không nhận từ body). Lịch sử chuyển trạng thái và `audit_event` có `actorName`, `occurredAt` (giờ VN – BR-001). Kiểm ở US-006.

---

## 2. Người dùng & vai – S26 (US-002), chỉ OWN

> AC4: R2 tạo 8 tài khoản ban đầu bằng seed/lệnh quản trị (OPS–BE). Màn S26 R2 tối thiểu gồm: danh sách người dùng, gán vai, khóa/mở, đặt lại mật khẩu, thiết bị được cấp (mục 10). **R2 ẩn nút "Thêm người dùng"** (PO quyết 16/10): tự thêm tài khoản qua giao diện là **US-008 – Must R3** (AC1–AC3); API `createUser` giữ trong hợp đồng nhưng màn S26 R2 không gọi. Người mới ở R2 do OPS–BE tạo bằng lệnh quản trị (AC4).

### 2.1 Danh sách – `listUsers`
Cột: `displayName`, `username`, vai (theo cơ sở), `status` (`active` "Đang dùng" · `locked` "Tạm khóa do sai mật khẩu" · `disabled` "Đã khóa"), `lastLoginAt`. Không phân trang (≤ 50 người `[GIẢ ĐỊNH BA]`). Rỗng: không xảy ra (luôn có OWN).

### 2.2 Gán vai – `setUserRoles`
| Trường | Kiểu | BB | Kiểm tra | Lỗi |
|---|---|---|---|---|
| `roles[]` (`propertyId`, `role`) | danh sách chọn nhiều | B (≥ 1) | `role` ∈ 8 vai (Role); `propertyId` = cơ sở OWN đang quản lý | `NOT_IN_LIST` |

- Quy tắc: OWN **không** tự bỏ vai `owner` của chính mình nếu là OWN duy nhất đang `active` → `422` `LAST_OWNER` → `field_error.last_owner` **(mới)** "Cơ sở cần ít nhất một chủ đầu tư đang hoạt động." (rbac 5.3; đề nghị ARC thêm kiểm này – mục 13).
- Hệ quả: có hiệu lực ngay, thu hồi mọi phiên của người đó (A100, SR-SES-06); lần gọi kế tiếp của họ → 401. Ghi `audit_event category=security` (trước/sau).
- Hộp xác nhận (US-135, mục 9): "Đổi vai của {name}? Người này sẽ bị đăng xuất ngay trên mọi máy."
- MGR mở S26 hoặc gọi A100 → 403 (AC4).

### 2.3 Khóa/mở, đặt lại mật khẩu – `updateUser`
| Trường | Kiểu | BB | Kiểm tra |
|---|---|---|---|
| `displayName` | text | K | V-01 (1–80) |
| `status` | enum `active`/`disabled` | K | Không khóa chính mình nếu là OWN duy nhất (`LAST_OWNER`) |
| `resetPassword` | text ẩn | K | V-10 – mật khẩu tạm; người dùng phải đổi ở lần đăng nhập kế tiếp |

`If-Match` bắt buộc. Khóa hoặc đặt lại mật khẩu → thu hồi mọi phiên. Mật khẩu tạm hiện **một lần** cho OWN sao chép, không lưu ở giao diện.

---

## 3. Ẩn dữ liệu nhạy cảm (US-003)

Không có màn riêng. Quy tắc kiểm cho từng màn R2 (nguồn: rbac mục 6, OpenAPI `x-visible-to`):

| Màn / API | SAL, CTV | HK | MT | FD |
|---|---|---|---|---|
| Hồ sơ khách `getGuest` | Không có `idDocLast4`, `dateOfBirth`, `companyName`, `taxCode`, `freeNote`, `warnings` (D01–D07, D16, D29); CTV không có `tags` (AC1) | Không gọi được (403) | 403 | Đầy đủ trừ C3 |
| Minibar/kho (EP09) | – | Không có giá vốn, giá trị tồn, thành tiền (AC2) | – | Không có giá vốn |
| P&L S21, báo cáo kênh S20 | 403 (AC3; R2 kiểm đường dẫn + API trả 403) | 403 | 403 | 403 |
| Tổng quan S02 | 403 | 403 | 403 | Không có doanh thu tháng, ADR, RevPAR, cảnh báo FOC (AC4) |
| Rack `getRack` | `availability_only` (EP02 mục 1) | `all_masked` | `all_masked` | Đầy đủ |

QA sinh test trường tự động từ `x-rbac-field` (gen_traceability `--strict`).

---

## 4. Danh mục căn – S25 (US-004)

### 4.1 Quyền
OWN/MGR xem + sửa (A101/A103). FDL/FD/SAL/CTV xem dạng tra cứu `catalog_only` (số căn, tầng, nhóm, tên, `baseOccupancy`, `maxOccupancy`, giá niêm yết hiện hành; **không** lịch sử giá). HK/MT ✖ (ghi chú 25a).

### 4.2 Bảng căn (`listRooms`) – cột
`roomNo`, `name`, nhóm (`roomGroupCode`), `floor`, **định mức** (`baseOccupancy`), **sức chứa tối đa** (`maxOccupancy`), giá tháng / giá đêm niêm yết hiện hành (`currentListPrice`), trạng thái bán (`isSellable` → "Đang bán" / "Ngừng bán").

### 4.3 Sửa căn – `updateRoom` (OWN/MGR, `If-Match` bắt buộc)
| Trường | Nhãn | Kiểu | BB | Kiểm tra | Lỗi |
|---|---|---|---|---|---|
| `name` | Tên căn | text | K | 1–60 ký tự | `TOO_LONG` |
| `roomGroupId` | Nhóm căn | uuid | K | V-11 | `NOT_IN_LIST` |
| `baseOccupancy` **(đề nghị ARC thêm vào `Room`/`RoomPatch`/erd `room` – mục 13)** | Định mức (số người đã gồm trong giá) | int | B khi tạo | 1–10; giá trị thật theo INV 16/10 (BR-110: Studio 2; 301, 401: 4; 302, 402: 3) | `VALUE_OUT_OF_RANGE` |
| `maxOccupancy` | Sức chứa tối đa | int | B khi tạo | **= định mức hoặc định mức + 1** (INV quyết ESC-014: mọi căn nhận vượt định mức tối đa 1 người, ngủ sofa). Mặc định khi tạo = định mức + 1. Trẻ dưới 6 tuổi không tính (BR-110). Giảm xuống dưới số người tính sức chứa của đơn tương lai/đang ở → chặn | `MAX_OCCUPANCY_RANGE` → `field_error.max_occupancy_range` **(mới)** "Sức chứa tối đa phải bằng định mức hoặc định mức + 1 (một người ngủ sofa)."; 409 `CAPACITY_BELOW_BOOKINGS` → `error.CAPACITY_BELOW_BOOKINGS` **(mới)** "Không giảm được: {n} đơn đã có nhiều khách hơn. Đổi căn các đơn này trước." kèm danh sách `conflicts[]` (mã đơn, ngày, số khách) |
| `isSellable` | Ngừng bán | bool | K | Bật "ngừng bán" khi có đơn tương lai → vẫn lưu, hiện cảnh báo "{n} đơn tương lai vẫn giữ căn này" (đơn đã có không bị đổi) | – |
| `listPrice.effectiveFrom` | Hiệu lực từ | date | ĐK (khi đổi giá) | ≥ ngày nghiệp vụ hôm nay (không sửa giá quá khứ – BR-006) | `DATE_IN_PAST` |
| `listPrice.monthlyListPriceVnd` | Giá tháng niêm yết | money | ĐK | V-07, > 0 | `AMOUNT_NOT_POSITIVE` |
| `listPrice.nightlyListPriceVnd` | Giá đêm niêm yết | money | K | Bỏ trống → server tính theo BR-101 và làm tròn BR-005; giao diện hiện giá tính được **trước khi lưu**; nhập tay → > 0 | `AMOUNT_NOT_POSITIVE` |
| `listPrice.reason` | Lý do đổi giá | text | ĐK | V-08 | `REASON_REQUIRED` |

- Hệ quả đổi giá (AC1): báo giá/đơn tạo **sau** ngày hiệu lực dùng giá mới; đơn, báo giá đã có giữ snapshot (BR-006, BR-106). Ghi `audit_event category=config` (trước/sau, lý do).
- Hệ quả ngừng bán (AC2): căn không còn trong danh sách chọn của form đặt phòng/báo giá; rack hiện nhãn "Ngừng bán"; tạo đơn bằng API → 409 `ROOM_NOT_SELLABLE`.
- Thêm căn (`createRoom`): như bảng trên, thêm `roomNo` (B, 1–6 ký tự `[0-9A-Z]`, duy nhất theo cơ sở → `422 DUPLICATE` → `field_error.duplicate` **(mới)** "Số căn {value} đã có.") và `monthlyListPriceVnd` (B). R2 cơ sở cố định 10 căn; thêm căn chỉ dùng cho seed/thử.

---

## 5. Tham số quy tắc – S24 (US-005)

### 5.1 Quyền theo khóa
| Nhóm khóa | Xem | Sửa |
|---|---|---|
| Vận hành (giờ, hạn, phụ thu, giá, định mức… – BR mục 13 trừ các dòng dưới) | OWN, MGR, FDL (chỉ xem) | OWN, MGR (A101) |
| `foc_limits`, `foc_self_apply.*`, `short_stay_commission_pct`, `commission_payout`, `channel_commission_pct.*`, `vat_rate`, `retention.*` | OWN, MGR, FDL | **Chỉ OWN** (A102) – MGR → 403 |
| 8 tham số bảo mật (`x-security-parameters`) | OWN, MGR | **Chỉ OWN** (A119); ngoài biên cứng → 422 `PARAM_OUT_OF_RANGE` kể cả OWN |
| `payment_receiving_account.*` | OWN, MGR | Không sửa ở S24 – dùng luồng A108 (xác nhận lại mật khẩu + bước xác nhận thứ hai, R2 chỉ OWN) |

FD, HK, MT, SAL, CTV: không có menu, API 403 (AC2).

### 5.2 Danh sách (`listParameters`)
Cột: tên tham số (nhãn tiếng Việt do UXD đặt theo khóa), giá trị hiện hành, `effectiveFrom`, mã BR (`brRef`) có liên kết sang mô tả, nhãn trạng thái (`statusLabel`: GĐ = chờ INV xác nhận, PL = chờ luật sư/kế toán), người sửa gần nhất. Nhóm theo mục BR (Giá, Giữ chỗ & hủy, Nhận/trả phòng, FOC, Buồng phòng, Kênh, Bảo mật).

### 5.3 Thêm giá trị mới – `setParameter`
| Trường | Nhãn | Kiểu | BB | Kiểm tra | Lỗi |
|---|---|---|---|---|---|
| `value` | Giá trị mới | theo khóa | B | Kiểu và khoảng theo erd mục 9 / `x-security-parameters`; tham số dạng danh sách (ví dụ `hold_hours_options`) không rỗng, không trùng phần tử; tham số tiền theo V-07; tham số giờ `HH:mm` | 422 `VALIDATION_FAILED` (sai kiểu); 422 `PARAM_OUT_OF_RANGE` → `error.PARAM_OUT_OF_RANGE` **(mới)** "Giá trị phải từ {min} đến {max}." / "Chỉ chọn trong: {allowed}." |
| `effectiveFrom` | Hiệu lực từ | date | B | ≥ ngày nghiệp vụ hôm nay; mặc định = hôm nay | `DATE_IN_PAST` |
| `reason` | Lý do thay đổi | text | B | V-08 (3–500) | `REASON_REQUIRED` |

- Không sửa giá trị quá khứ – mỗi lần lưu thêm một dòng hiệu lực mới (AC1, BR mục 0.2).
- Bản ghi đã tạo (giữ chỗ, đơn, báo giá) giữ giá trị snapshot (BR-006) – ví dụ AC1: đổi `hold_hours_default` không đổi hạn của giữ chỗ đã có.
- Nhật ký (AC3): `audit_event` ghi khóa, giá trị cũ, mới, người sửa, thời điểm, ngày hiệu lực, lý do; tham số bảo mật `category=security`, còn lại `config`.
- Lịch sử từng khóa: `getParameterHistory` – bảng các dòng hiệu lực, mới nhất trên cùng.

---

## 6. Nhật ký thao tác – S27 (US-006)

### 6.1 Ghi nhật ký (yêu cầu BE, kiểm bởi QA)
| Thao tác | `category` | Ghi |
|---|---|---|
| Thêm/điều chỉnh dòng folio, giảm giá, FOC (gửi/duyệt/từ chối/tự áp), thu tiền, đảo giao dịch, hoàn, phí hủy | `money` | người, thời điểm, giá trị trước/sau, lý do, mã đơn (BR-008) |
| Mọi chuyển trạng thái SM-01, SM-02, SM-08, SM-09, SM-10 | `state` | trạng thái cũ/mới, mã chuyển (B1…), lý do |
| Sửa tham số, giá niêm yết, căn | `config` | trước/sau, ngày hiệu lực, lý do |
| Bị từ chối quyền (403) | `access` | người, hành động, đối tượng |
| Đổi vai, khóa tài khoản, cấp/thu hồi thiết bị, tham số bảo mật | `security` | trước/sau |

Không có thao tác xóa dòng folio; sửa sai bằng bút toán điều chỉnh (AC1). Giá trị C3 và cột `_enc` không vào nhật ký (SR-AUD-03).

### 6.2 Màn xem – `listAuditEvents`
| Bộ lọc | Kiểu | BB | Kiểm tra |
|---|---|---|---|
| Từ ngày / đến ngày (`dateFrom`, `dateTo`) | date | K (mặc định 7 ngày gần nhất) | Từ ≤ đến; khoảng ≤ 92 ngày `[GIẢ ĐỊNH BA – giới hạn hiệu năng, ARC xác nhận]` → `DATE_RANGE_TOO_LONG` |
| Người làm (`actorUserId`) | uuid | K | Chỉ OWN/MGR có bộ lọc này; FDL/FD luôn bị khóa vào chính mình (`x-scope: own`, AC2) |
| Loại (`category`) | enum | K | V-11 |

Cột: thời điểm, người làm, loại, hành động (`action` → nhãn tiếng Việt do UXD đặt), mã chứng từ (`entityCode`, bấm mở chi tiết), trước → sau, lý do. Phân trang con trỏ, 50 dòng/trang. Rỗng: "Không có thao tác nào trong khoảng này."

---

## 7. Gửi và duyệt FOC / giảm giá đặc biệt – S23 (US-007, SM-10)

### 7.1 Gửi yêu cầu – `requestFoc` (từ dòng folio)
| Trường | Nhãn | Kiểu | BB | Kiểm tra | Lỗi |
|---|---|---|---|---|---|
| `kind` | Loại | enum `foc` / `special_discount` | B | `foc` chỉ cho dòng phát sinh (BR-431); `special_discount` chỉ cho dòng tiền phòng | `NOT_IN_LIST` |
| `amountVnd` | Số tiền miễn/giảm | money | B | V-07, > 0, ≤ giá trị dòng | `AMOUNT_EXCEEDS_LINE` → `field_error.amount_exceeds_line` **(mới)** "Không vượt số tiền của dòng ({max})." |
| `reasonCode` | Lý do | enum (BR-432: `regular_vip` Khách quen/VIP · `room_ready_no_impact` Phòng sẵn sàng, không ảnh hưởng khách sau · `service_recovery` Bù sự cố · `long_stay_guest` Khách dài hạn · `other` Khác) | B | V-11 | `REQUIRED` |
| `note` | Ghi chú | text | ĐK (`reasonCode=other`) | V-08, ≤ 500, V-09 | `REASON_REQUIRED` |
| — | **Không có ô chọn người duyệt** | – | – | BR-432, AC1 | – |

Kết quả:
- Thường: yêu cầu `pending`, folio hiện dòng "chờ duyệt" (`approval.status.pending`), thông báo đẩy theo `foc_approval_push_roles` (BR-432 v0.3: vai thấp nhất đủ hạn mức + quản lý; OWN khi vượt hạn mức quản lý). Mọi tài khoản đủ hạn mức (gồm OWN) thấy trong hàng chờ.
- **Tự áp FOC minibar** (AC6, BR-436, SM-10 A2): FD/FDL, `kind=foc`, dòng minibar, ≤ `foc_self_apply.front_desk.per_time` **và** tổng tự áp tháng của chính người đó + giá trị ≤ `…per_month` → giao diện hỏi xác nhận lại mật khẩu (mục 0.5) → `approved` ngay, dòng FOC ghi "tự áp trong hạn mức". Vượt → đi luồng `pending`. Giao diện hiện "Còn {remaining} trong hạn mức tháng của bạn" trước khi gửi.

### 7.2 Hộp duyệt – `listApprovalRequests`
Phạm vi: OWN/MGR tất cả; FDL yêu cầu trong hạn mức của mình + yêu cầu mình gửi; FD/HK/MT/SAL/CTV chỉ yêu cầu mình gửi (rút lại được – A6). Cột: loại, mã đơn, số tiền, lý do, người gửi, thời điểm, trạng thái (`approval.status.*`), hạn mức còn lại của người xem (`approverRemainingMonthlyVnd`, chỉ OWN/MGR/FDL).

### 7.3 Duyệt – `approveRequest` / Từ chối – `rejectRequest`
| Trường | Kiểu | BB | Kiểm tra | Lỗi |
|---|---|---|---|---|
| `authMethod` | enum | B | R2 luôn `password` | – |
| `secret` | text ẩn | B | mục 0.5 | 401 `REAUTH_FAILED` |
| `note` (duyệt) | text | K | ≤ 300, V-09 | – |
| `reason` (từ chối) | text | B | V-08 | `REASON_REQUIRED` |

Lỗi nghiệp vụ: người duyệt = người gửi và không phải MGR/OWN → 403 `SELF_APPROVAL_FORBIDDEN` (AC4; trừ tự áp AC6); vượt hạn mức lần/tháng (BR-433) → yêu cầu chuyển `escalated`, 403 `APPROVAL_LIMIT_EXCEEDED` với `{approver}` = vai cấp trên (AC3); yêu cầu đã được người khác xử lý → 409 `INVALID_TRANSITION`.

Kết quả duyệt (AC2): `approved`, folio có dòng phát sinh + dòng FOC âm cùng giá trị, lý do, **tên người duyệt thật** (BR-434); cộng vào hạn mức tháng; kiểm cảnh báo BR-435 (chỉ OWN nhận).

**Lệch hợp đồng cần ARC sửa**: `rejectRequest` đang bắt buộc `pin` trong khi R2 dùng mật khẩu (`approveRequest.authMethod=password`). Đề nghị đổi body từ chối giống duyệt (`authMethod` + `secret`) – mục 13.

Chặn trả phòng khi còn `pending`/`escalated`: 409 `PENDING_APPROVALS` (AC5 – đặc tả trả phòng EP05).

---

## 8. Platform dùng chung

### 8.1 Kênh bán – `listChannels`
Danh sách kênh theo BR-901 + "Nội bộ" (`channel_group=internal`). Traveloka chỉ `isActive=true` khi INV xác nhận có dùng (US-017 AC8). Thuộc tính `requiresOtaRef` quyết định ô "Mã đặt phòng OTA" có bắt buộc. Tỷ lệ phí kênh `commissionRatePct` chỉ FD+ thấy, chỉ OWN sửa (A102).

### 8.2 Mã chứng từ (US-023)
Server cấp, duy nhất, liên tục, không dùng lại khi hủy (BR-007, erd mục 10): đơn `OTM-{n:05}`, báo giá `BG-{n:05}`, phiếu sửa `WO-{n:05}`, nhóm đơn `NH-{n:05}` (R3), bill `F{yy}-{n:06}`, phiếu thu `PT-{n:06}`, khách `KH-{n:04}` (theo tổ chức). Client **không** gửi mã; ô mã chỉ đọc. Sửa tên/SĐT/email khách không đổi `KH-` (US-023 AC2).
- **Trùng tiền tố `NH-`**: xem đề nghị ở mục 13 (giữ `NH-` cho nhóm đơn, nhóm hộ CRM dùng `HH-`).

### 8.3 Thời gian thực
SSE `streamEvents` chỉ phát `{type, id}`; client tải lại tài nguyên theo quyền. Mất kết nối → banner `fo.rack.stale` / `common.offline_banner`, tự nối lại.

---

## 9. Hộp xác nhận hành động không đảo ngược (US-135)

Quy tắc chung (AC1–AC3): hộp nêu **hậu quả cụ thể** lấy từ dữ liệu thật (gọi `dryRun=true` hoặc API tóm tắt); nút xác nhận ghi đúng tên hành động; nút thứ hai "Không, quay lại" (`confirm.keep`) và phím Esc đóng hộp **không** thay đổi dữ liệu; tiêu điểm bàn phím vào nút an toàn ("Không, quay lại") khi mở; trình đọc màn hình đọc tiêu đề + nội dung hậu quả (`role=alertdialog`, `aria-describedby`). Server **không** dựa vào hộp để bảo vệ dữ liệu – mọi điều kiện kiểm lại khi ghi.

| Hành động | Nguồn hậu quả | Chuỗi tiêu đề / nội dung | Nút xác nhận | Story |
|---|---|---|---|---|
| Hủy giữ chỗ (B5) | `cancelReservation` `dryRun` | `cancel.title`, `cancel.consequence`, `cancel.fee_none` | `cancel.confirm` | US-021 |
| Hủy đơn đã đảm bảo (B10) | `cancelReservation` `dryRun` → `CancellationQuote` | `confirm.cancel_booking.*` | "Hủy đơn" | US-021 |
| Đánh dấu không đến (B11) | dữ liệu đơn (cọc, khoảng đêm, kênh) | `noshow.title`, `noshow.consequence_direct` / `_ota` | `noshow.confirm` | US-136 |
| Khôi phục no-show (B12) | dữ liệu đơn | `noshow.restore_title`, `noshow.restore_body` | "Khôi phục" | US-136 |
| Hoàn tất trả phòng (B18) | `getCheckoutSummary` | `checkout.complete_confirm_*` | "Hoàn tất trả phòng" | EP05 |
| Đóng/mở bán kênh (A104) | lịch giá + kênh | `confirm.channel_close.*`, `confirm.channel_open.*` | "Đóng bán" / "Mở bán" | R3 (US-098) |
| Gộp hồ sơ khách | hai hồ sơ | `confirm.merge_guest.*` | "Gộp hồ sơ" | R3 (US-074) |
| Đóng phiếu sửa, mở khóa phòng (W4 + O4) | phiếu + khối OOO | `confirm.wo_done.*` | "Đóng phiếu và mở khóa" | US-062 |
| Xóa sớm ảnh giấy tờ (A74) | đơn + người | `confirm.purge_images.*` | "Xóa ảnh" | US-049 |
| Thu hồi thiết bị được cấp (A110) | thiết bị | `device.revoke_title`, `device.revoke_body` | `device.revoke` | US-142 |
| Đổi vai / khóa tài khoản (A100) | người dùng | **(mới)** "Đổi vai của {name}? Người này bị đăng xuất ngay trên mọi máy." | "Đổi vai" / "Khóa tài khoản" | US-002 |
| Hủy khối OOO `planned` (O5) | khối | **(mới)** "Hủy khóa căn {room} {from}–{to}? Căn mở bán lại trên mọi kênh." | "Hủy khóa" | US-019 |

Lỗi khi xác nhận: trạng thái đã đổi giữa lúc mở hộp và lúc bấm → 409 `INVALID_TRANSITION` hoặc 412 `VERSION_CONFLICT`; đóng hộp, hiện chuỗi lỗi, tải lại đơn.

---

## 10. Thiết bị được cấp – S26 (US-142), chỉ OWN (A110)

### 10.1 Danh sách – `listTrustedDevices`
Cột: `name`, loại (`desk` "Máy quầy" · `facility_mobile` "Máy di động của cơ sở"), người cấp, ngày cấp, hạn (`device.expires`), dùng gần nhất (`device.last_seen`), trạng thái (còn hạn / hết hạn / đã thu hồi), nhãn "Máy này" (`isCurrentDevice`). Sắp: còn hạn trước, hạn gần trước.

### 10.2 Cấp quyền cho máy đang dùng – `trustCurrentDevice`
Chỉ hiện nút `device.grant` khi: vai OWN, mở bằng **admin-web** (không phải PWA), `Me.deviceTrusted=false`.

| Trường | Nhãn | Kiểu | BB | Kiểm tra | Lỗi |
|---|---|---|---|---|---|
| `name` | Tên máy (`device.grant_name`) | text | B | 1–80 ký tự, duy nhất trong danh sách còn hạn | `DUPLICATE` |
| `deviceKind` | Loại máy | enum | B | `desk` / `facility_mobile`; **không** có lựa chọn máy cá nhân (SR-DEV-09) | `NOT_IN_LIST` |
| `hardeningChecklistConfirmed` | Xác nhận checklist (`device.grant_checklist`) | bool | B, phải `true` | SR-DEV-07 | `CHECKLIST_REQUIRED` → `field_error.checklist_required` **(mới)** "Kiểm đủ checklist trước khi cấp quyền." |
| `currentPassword` | Nhập lại mật khẩu (`device.grant_confirm`) | text ẩn | B | mục 0.5 | 401 `REAUTH_FAILED` |

Hạn: `desk` theo `trusted_device_days`, `facility_mobile` theo `trusted_device_mobile_days` (≤ 30 ngày). Gọi từ PWA → 403 `FORBIDDEN_ACTION`.

### 10.3 Thu hồi – `revokeTrustedDevice`
Hộp xác nhận (mục 9). `reason` K, ≤ 200, V-09. Hiệu lực ngay ở request kế tiếp (SR-DEV-06).

### 10.4 Hành vi trên thiết bị chưa cấp (AC2, AC3)
- Menu và nút C3 ẩn khi `Me.deviceTrusted=false`; gọi API C3 (A11, A21, A70, A71, A73…) → 403 `DEVICE_NOT_TRUSTED`, `c3_access_log` ghi lần bị từ chối; giao diện `device.blocked_title` + `device.blocked_body`. PWA luôn hiện `device.pwa_note`.
- Người trực đêm dùng máy của cơ sở đã cấp: nhận phòng và khai báo đầy đủ như ca ngày (AC3) – không có giới hạn theo giờ.

---

## 11. Hồ sơ khách – S14 (EP10: US-071, 072, 073)

### 11.1 Quyền
FD+ ✔ toàn cơ sở; SAL/CTV chỉ khách/lead **của mình** (M – `created_by`, `assigned_to`, người chốt); HK/MT/GST ✖. Trường hiện theo vai: mục 3.

### 11.2 Form tạo/sửa – `createGuest` / `updateGuest`
| Trường | Nhãn | Kiểu | BB | Kiểm tra | Lỗi |
|---|---|---|---|---|---|
| `fullName` | Họ tên | text | B | V-01 (1–120); lưu nguyên dạng nhập (có dấu); server sinh `name_search` (bỏ dấu, in hoa – BR-951) | `REQUIRED`, `NAME_INVALID`, `TOO_LONG` |
| `phone` | SĐT | text | **ĐK**: phải có `phone` **hoặc** `email` (AC1) – **ngoại lệ duy nhất**: hồ sơ `source = document` do **server** tạo từ giấy tờ người đi cùng (EP06 2.2a; BUG-R2-033 b) được thiếu cả hai; quy tắc này chỉ áp cho form CRM (`createGuest`/`updateGuest`) và người đứng tên | V-02; trùng hồ sơ khác sau chuẩn hóa → chặn (BR-951, US-072 AC1) | `CONTACT_REQUIRED` → `field_error.contact_required` **(mới)** "Cần ít nhất SĐT hoặc email."; 409 `DUPLICATE_GUEST` |
| `email` | Email | text | ĐK (như trên) | V-03; trùng → chặn | như trên |
| `messagingHandles` | Zalo / WhatsApp / KakaoTalk | object `{zalo, whatsapp, kakaotalk}` | K | Mỗi giá trị 1–64 ký tự; Zalo/WhatsApp là SĐT thì kiểm V-02; **không** dùng làm khóa trùng ở R2 | `PHONE_INVALID` |
| `dateOfBirth` | Ngày sinh | date | K | V-06 | `DOB_FUTURE`, `DOB_MINOR` |
| `gender` | Giới tính | enum `male`/`female`/`other` | K | V-11 | – |
| `nationalityCode` | Quốc tịch | text ISO-3166 alpha-2 (chọn từ danh sách có tìm kiếm) | K (mặc định `VN`) | V-11 | `NOT_IN_LIST` |
| `preferredLocale` | Ngôn ngữ | enum `vi`/`en`/`ru` | K (mặc định: `vi` nếu quốc tịch VN, còn lại `en`) | V-11 | – |
| `preferredContact` | Liên hệ ưu tiên | enum `phone`/`zalo`/`whatsapp`/`kakaotalk`/`email` | K | Kênh được chọn phải có giá trị tương ứng (ví dụ chọn `email` mà chưa có email → lỗi) | `CONTACT_CHANNEL_EMPTY` → `field_error.contact_channel_empty` **(mới)** "Nhập {channel} trước khi chọn làm liên hệ ưu tiên." |
| `companyName` | Công ty | text | ĐK (bắt buộc khi có `taxCode`) | 1–200 | `REQUIRED` |
| `taxCode` | Mã số thuế | text | K | V-04 | `TAX_CODE_INVALID` |
| `tags` | Nhóm khách | danh sách chọn từ danh mục (VIP, Khách quen, Dài hạn, Doanh nghiệp, Đoàn) `[GIẢ ĐỊNH BA – danh mục, DOM bổ sung]` | K | V-11; SAL chọn được, CTV không thấy/không sửa (D12a) | – |
| `serviceNotes` | Sở thích / lưu ý phục vụ | danh sách chọn từ danh mục **không liên quan sức khỏe** (D12a) | K | V-11; không có ô tự do | – |
| `freeNote` | Ghi chú | text nhiều dòng | K | ≤ 1000, V-09; câu nhắc D12c "không ghi số giấy tờ, số thẻ, thông tin sức khỏe" | `TOO_LONG`, `CARD_NUMBER_DETECTED` |
| — | **Không có ô số giấy tờ** | – | – | Số giấy tờ chỉ vào từ bước giấy tờ (US-071 AC3, BL 3.16) | – |
| — | Nhóm hộ (người hay đi cùng) | – | – | **Không làm ở R2** (CRM nâng cao R3); tiền tố đề nghị `HH-` (mục 13) | – |

`updateGuest` cần `If-Match`; sửa SĐT/email sang giá trị đã thuộc hồ sơ khác → 409 `DUPLICATE_GUEST`.

**Hồ sơ nguồn "từ giấy tờ"** (`Guest.source = document`, chỉ FD+ thấy – SEC 17/10 mục 7; EP06 2.2a; **cài đặt Sprint 4**):
| Thao tác | Quy tắc |
|---|---|
| Tạo | **Chỉ** server tạo khi nhập giấy tờ người đi cùng không khớp ai – **không** tạo được qua form này (không có lựa chọn "nguồn" trên form) |
| `updateGuest` khi **chưa** có liên hệ và **chưa** đồng ý P05 | Được sửa `fullName` (sửa lỗi gõ theo giấy tờ), `nationalityCode`, `preferredLocale`. Gửi `tags`, `freeNote`, `serviceNotes`, `dateOfBirth`, `gender`, `companyName`, `taxCode` → 422 `NOT_ALLOWED` → **(mới)** `field_error.document_profile_minimal` "Hồ sơ từ giấy tờ chỉ lưu tên và quốc tịch. Thêm SĐT/email hoặc hỏi khách đồng ý ghi nhớ trước." Không áp `CONTACT_REQUIRED` |
| Thêm `phone`/`email` | Được (FD+), kiểm V-02/V-03 + chặn trùng 11.3 như thường; sau khi lưu, hồ sơ chịu **đủ** quy tắc CRM (T05/T06, có thể thêm tag/ghi chú) – chip "Từ giấy tờ" mất |
| Trở thành người đứng tên đơn mới | Phải có SĐT (kênh `direct`/`agent` – `PHONE_REQUIRED`) → thêm liên hệ như trên trước |
| Đồng ý P05 | Qua luồng EP06 4.1 (không qua form này); sau khi đồng ý: được thêm `tags`/`serviceNotes`/`freeNote` |
| Tìm kiếm / tra cứu | FD+ thấy (chip `crm.source_document`); **SAL/CTV không bao giờ thấy** trong `searchGuests`, bộ chọn khách, `lookupGuestByContact`, danh sách/xuất tiếp thị (rbac D10, ghi chú 40) | Mã `KH-` không đổi (US-023 AC2).

### 11.3 Chặn trùng (US-072)
| Tình huống | Kiểm ở | Kết quả | Chuỗi |
|---|---|---|---|
| SĐT hoặc email (sau chuẩn hóa BR-951) đã thuộc hồ sơ khác (chưa gộp, chưa ẩn danh) | Client gọi `lookupGuestByContact` khi rời ô SĐT/email; server kiểm lại khi lưu | **Chặn** lưu: 409 `DUPLICATE_GUEST` kèm `existingGuestId`; nút "Mở hồ sơ đó" (`crm.duplicate_open`) / "Dùng hồ sơ này cho đơn" (`crm.duplicate_use`) | `error.DUPLICATE_GUEST`, `crm.duplicate_title` |
| SAL/CTV gặp SĐT/email của khách **không phải của mình** | `lookupGuestByContact` (`exists_only_or_own`) | Chặn, **không** trả tên/mã khách khác: "Có thể trùng – liên hệ lễ tân" | `field_error.possible_duplicate_other` **(mới)** "SĐT/email này đã có hồ sơ. Nhờ lễ tân kiểm tra trước khi tạo." |
| Tên gần giống (BR-952) + cùng ngày sinh hoặc quốc tịch, khác SĐT/email | Server khi lưu | **Chỉ cảnh báo**, vẫn lưu; hồ sơ có `warnings[possible_duplicate_name_dob]` (chỉ FD+ thấy) | `crm.duplicate_title` |

**Lệch chuỗi cần UXD sửa**: `crm.duplicate_new_anyway` ("Vẫn tạo hồ sơ mới (ghi lý do)") chỉ được dùng cho trường hợp **nghi trùng tên + ngày sinh**; với trùng SĐT/email, BR-951 **chặn**, không có lựa chọn này.

Giới hạn tra: SAL/CTV 30 lần/giờ/người (SR-RL-07) → 429 `RATE_LIMITED`. Mỗi lần tra ghi `audit_event access` (không ghi giá trị tra).

### 11.4 Bộ chọn khách dùng chung (US-073) – `searchGuests?picker=true`
| Thuộc tính | Đặc tả |
|---|---|
| Ô tìm | Tìm theo tên có/không dấu (so khớp trên `name_search` – "do mai anh" ra "Đỗ Mai Anh", AC1), mã `KH-`, mã OTA. **Không** gửi SĐT/email qua query (SEC) – chuỗi gõ vào có dạng SĐT (≥ 8 chữ số) hoặc email (có `@`) → client chuyển sang `lookupGuestByContact` (POST) |
| Kích hoạt | Từ **2 ký tự** (sau cắt khoảng trắng); chờ 300 ms sau lần gõ cuối `[GIẢ ĐỊNH BA – UXD có thể đổi]` |
| Số kết quả | Tối đa **5** (OpenAPI `picker=true`), sắp theo: khớp mã chính xác → khớp đầu tên → lần lưu trú gần nhất |
| Mỗi dòng | `displayName`, `code`, `phoneMasked` (FD+, SAL, CTV), quốc tịch, tag (FD+, SAL) |
| Phạm vi | SAL/CTV chỉ thấy khách/lead của mình (AC3, rbac M6) |
| Không tìm thấy | Dòng "Tạo khách mới '{text}'" mở form tạo nhanh: `fullName` (điền sẵn chuỗi đã gõ), `phone`, `email`, `nationalityCode` – cùng kiểm tra 11.2; SĐT đã tồn tại → cảnh báo trùng + nút "Dùng hồ sơ này" (AC2) |
| Rỗng / lỗi | "Không có khách nào khớp '{text}'"; lỗi mạng → `common.error_generic_*` |
| Dùng ở | Form đặt phòng (khách đứng tên), người đi cùng, báo giá, lead |

---

## 12. Truy vết story → mục

| Story / AC | Mục |
|---|---|
| US-001 AC1–AC4 | 1.1–1.4, 2 |
| US-002 AC1–AC4 | 0.4, 2 |
| US-003 AC1–AC4 | 3 |
| US-004 AC1–AC3 | 4 (AC3 theo ESC-014) |
| US-005 AC1–AC3 | 5 |
| US-006 AC1–AC2 | 6 |
| US-007 AC1–AC6 | 0.5, 7 |
| US-135 AC1–AC3 | 9 |
| US-142 AC1–AC3 | 10 |
| US-023 AC1–AC2 | 8.2 |
| US-071 AC1–AC3 | 11.2 |
| US-072 AC1–AC2 | 11.3 |
| US-073 AC1–AC3 | 11.4 |

## 13. Đề nghị cho vai khác (không sửa file của vai đó – ghi để ORC chuyển)

| # | Gửi | Nội dung |
|---|---|---|
| E00-01 | ARC | Thêm `baseOccupancy` (int, not null) vào erd `room`, schema `Room`, `RoomInput`, `RoomPatch` (BR-110 v0.3: định mức là thuộc tính từng căn – 302, 402 khác 301, 401 dù cùng nhóm); kiểm `maxOccupancy ∈ {base, base+1}` (ESC-014) → `422` mã trường `MAX_OCCUPANCY_RANGE`; `x-visible-to` như `maxOccupancy` |
| E00-02 | ARC | `rejectRequest` dùng `authMethod` + `secret` giống `approveRequest` (R2 là mật khẩu, không phải `pin`) |
| E00-03 | ARC | `createUser` 409: khai `Problem.code` `USERNAME_TAKEN`; thêm kiểm `LAST_OWNER` (422) cho `setUserRoles`/`updateUser`; `initialPassword`/`resetPassword` `minLength` 10 cho khớp `newPassword` |
| E00-04 | ARC + DOM | Tiền tố `NH-`: **giữ `NH-` cho nhóm đơn** (đã có ở erd mục 10, OpenAPI `ReservationGroup.code`, BR-007/321, oracle QA); **nhóm hộ CRM dùng `HH-`** (chưa có bảng, chưa có code – đổi không tốn gì). SEC sửa ví dụ D10 trong `security/data-risk-assessment.md` từ `NH-xxxx` sang `HH-xxxx`; DOM ghi chú vào BR-007 "`HH-` dành cho nhóm hộ (R3)" |
| E00-05 | UXD | Thêm các chuỗi **(mới)** ở tài liệu này (VI/EN); sửa `auth.login.username` ("Tên đăng nhập"), `booking.error.phone` (theo V-02), `error.REAUTH_FAILED` (R2: mật khẩu), `auth.code_label.pin` (hợp đồng PIN 6 số, chuỗi đang ghi 4–6), giới hạn `crm.duplicate_new_anyway` cho nghi trùng tên; thêm `error.PASSWORD_CHANGE_REQUIRED`, `error.REAUTH_REQUIRED`, `error.CAPACITY_BELOW_BOOKINGS`, `error.PARAM_OUT_OF_RANGE`, `error.MFA_REQUIRED` (5 mã có trong OpenAPI nhưng chưa có chuỗi) |
| E00-06 | DOM | Danh mục `tags` và `serviceNotes` của hồ sơ khách (BA tạm dùng danh sách ở 11.2) |

## 14. Lịch sử thay đổi
| Ngày | Round | Thay đổi | Người |
|---|---|---|---|
| 16/10/2026 | 2 (Đợt 0) | Bản đầu: đặc tả mức trường EP00 (US-001…007, 135, 142), platform, CRM US-071…073; áp ESC-014 (sức chứa = định mức + 1) cho danh mục căn; đề nghị ARC/UXD/DOM mục 13 | BA |
| 16/10/2026 | 2 (Sprint 2) | V-02: BA xác nhận câu ARC thêm (API trả SĐT E.164 có `+`, DB lưu không `+`), ghi rõ áp cho mọi trường SĐT đầy đủ trong phản hồi (hiện chỉ `Guest.phone` – ARC B-26 từ chối `pattern` cho `User.phone` vì `User` không trả SĐT; BA đồng ý), trường che giữ dạng che; bỏ nhãn chờ xác nhận | BA |
| 16/10/2026 | 2 (Sprint 2 – PO quyết) | Mục 2: R2 ẩn nút "Thêm người dùng" (US-008 Must R3) | BA |
| 17/10/2026 | 2 (Sprint 3 – theo SEC 17/10) | 11.2: ngoại lệ liên hệ chỉ cho hồ sơ `source = document` (server tạo từ giấy tờ người đi cùng – BUG-R2-033 b); bảng quy tắc sửa/thêm liên hệ/P05/tìm kiếm cho hồ sơ loại này (cài đặt Sprint 4) | BA |
