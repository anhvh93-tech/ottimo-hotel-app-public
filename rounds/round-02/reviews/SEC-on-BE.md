# SEC review – BE (Round 2, Sprint 1) – `product/services/api` @ d7d42e4

- Người review: SEC | Ngày: 16/10/2026 | Bắt buộc theo plan R2 mục 5 (PR chạm phiên, RLS, quyền)
- Phạm vi đã đọc: `modules/identity/**` (đăng nhập, khóa, rate limit, phiên/cookie, thu hồi phiên, mật khẩu, trusted device, reauth), `shared/http/{auth.guard,csrf,cookies,unit-of-work}.ts`, `shared/serialization/**`, `shared/problem.ts`, `http.ts`, `main.ts`, `config.ts` (phần origin/proxy), migrations `0001`, `0004`–`0007` (RLS, grant, hàm SECURITY DEFINER), `modules/approvals/**`, `modules/audit/**`, `modules/guests/**`, `infra/postgres/init/02-roles.sh`, `db/seed/*`.
- Đối chiếu: `security-requirements.md` v0.2, `threat-model.md`, ADR-006/007/013, `rbac-matrix.md` mục 6, OpenAPI 0.3.3-draft.
- Không chạy được test trên máy review (không có `pnpm`/PostgreSQL trong môi trường SEC) – kết luận dựa trên đọc mã; ARC đã chạy bộ unit (81 ca xanh, nhóm DB bị skip – `outputs/ARC/s1-contract.md` mục 4). Không chạy tấn công nào ra ngoài máy.
- Đánh số tiếp từ `w1-review.md` (FB-R2-SEC-BE-01…03).

Tổng: **0 Blocker · 6 Major · 7 Minor · 4 Suggestion**

---

### FB-R2-SEC-BE-04
- Mức độ: Major
- Vị trí: `src/modules/identity/internal/auth.service.ts` dòng 157–196 (`registerFailure`), dòng 71–74 (đọc `failed_login_count` trong `db.entry`)
- Vấn đề: Bộ đếm sai mật khẩu bị **mất cập nhật khi gửi song song**. `failed_login_count` được đọc trong giao dịch `auth_find_user` (không khóa), sau đó ghi giá trị tuyệt đối `failed_login_count = $2` với `$2 = giá trị đọc + 1`. N yêu cầu sai gửi cùng lúc đều đọc 0 và cùng ghi 1 → một loạt N lần đoán chỉ tính 1 lần sai. Giới hạn IP 20/15 phút (RAM) chỉ chặn một IP; nhiều IP (botnet, proxy dân dụng) thì đoán không giới hạn. `lock_count_24h` có cùng lỗi.
- Vì sao quan trọng: SR-AUTH-04 / SR-RL-01 (B, TM-01) – khóa tài khoản là lớp chống dò mật khẩu chính khi chưa có 2FA (R3). Tài khoản OWN/MGR mở được C3 và duyệt tiền.
- Đề xuất sửa: Tăng bộ đếm **nguyên tử** trong cùng câu lệnh và quyết định khóa theo giá trị trả về, ví dụ `UPDATE app_user SET failed_login_count = failed_login_count + 1 WHERE id = $1 RETURNING failed_login_count, locked_until, lock_count_24h` (hoặc `SELECT … FOR UPDATE` như `PasswordReauth`), rồi mới tính khóa. Test tích hợp: 10 yêu cầu sai `Promise.all` → tài khoản bị khóa, lần đăng nhập đúng tiếp theo trả 429.
- Trạng thái: Open

### FB-R2-SEC-BE-05
- Mức độ: Major
- Vị trí: `auth.service.ts` dòng 181–187 (khóa tạm đặt `status = 'locked'`); `shared/http/auth.guard.ts` dòng 225–233 (`user_status !== 'active'` → 401); `session-policy.interceptor.ts` dòng 75–83
- Vấn đề: Khóa tạm do sai mật khẩu đổi `app_user.status` thành `locked`, và guard từ chối **mọi phiên đang sống** của người đó khi `status ≠ active`. Ai biết tên đăng nhập (thường đoán được: `hanh.lt`, `letan1`) chỉ cần gõ sai 5 lần từ Internet là **đá lễ tân đang làm việc ra khỏi hệ thống** 15 phút, lặp lại vô hạn; lần khóa thứ 3 trong 24 giờ → `revokeAll` + khóa cứng tới khi OWN mở (dòng 187). Đây là từ chối dịch vụ có chủ đích nhắm vào ca trực (giữa lúc nhận phòng/thu tiền).
- Vì sao quan trọng: TM-01/TM-02 (sẵn sàng của quầy); SR-AUTH-04 chỉ yêu cầu khóa **đăng nhập mới**, không yêu cầu hủy phiên đã xác thực. Hiệu ứng phụ: khi khóa hết hạn và đăng nhập đúng, `status` về `active` làm các phiên cũ "sống lại" – hành vi khó đoán.
- Đề xuất sửa: Khóa tạm chỉ dùng `locked_until` (không đổi `status`), kiểm ở `login()`; giữ `status='locked'` cho **khóa cứng** nhưng khóa cứng **cũng không** thu hồi phiên (chỉ chặn đăng nhập mới) + gửi cảnh báo OWN (SR-LOG-06 "≥ 3 khóa/giờ"); OWN muốn đá phiên thì dùng `updateUser status=disabled` (đã thu hồi phiên). Test: phiên A đang mở, gửi 5 lần sai cho cùng tên từ client khác → request kế tiếp của phiên A vẫn 200. SEC sẽ ghi rõ ở SR-AUTH-04 v0.3 (xem `outputs/SEC/s1-decisions.md` mục 1).
- Trạng thái: Open

### FB-R2-SEC-BE-06
- Mức độ: Major
- Vị trí: `src/shared/http/unit-of-work.ts` dòng 85–89, 133 (`requestHash` trên toàn bộ body); áp cho `createUser` (`initialPassword`), `trustCurrentDevice` (`currentPassword`), `approveRequest`/`rejectRequest` (`secret`), sắp tới `requestFoc*` (`secret` – OpenAPI 0.3.3)
- Vấn đề: `idempotency_key.request_hash` = **SHA-256 không muối, không khóa** của JSON chính tắc chứa **mật khẩu dạng rõ**. Các trường còn lại trong body (id duyệt, ghi chú, tên thiết bị) đoán được hoặc nằm cùng hàng DB → ai có bản sao DB/sao lưu (ottimo_readonly, backup 35 ngày, TA-10) bẻ mật khẩu bằng GPU với tốc độ hàng tỷ lần/giây, bỏ qua hoàn toàn argon2id.
- Vì sao quan trọng: SR-AUTH-03 (B): mật khẩu/PIN "không bao giờ … lưu" ngoài băm argon2id; SR-C3-02 liệt kê `idempotency_key` là nơi không được chứa bí mật. Lộ mật khẩu OWN/MGR = mở C3 + duyệt tiền.
- Đề xuất sửa: Trước khi băm, thay các khóa bí mật (`password`, `currentPassword`, `newPassword`, `initialPassword`, `resetPassword`, `secret`, `pin`, `totpCode`, `otp`) bằng hằng `"[secret]"` – nhận diện lại vẫn đúng vì cùng phương thức/đường dẫn/khóa; hoặc dùng HMAC với khóa server riêng thay SHA-256. Một danh sách khóa dùng chung với redactor log (`http.ts SENSITIVE_KEYS`). Test: gọi `approveRequest` với Idempotency-Key → `request_hash` không đổi khi chỉ đổi `secret`; quét bảng không có chuỗi băm khớp `sha256(canonicalJson(body))`. Bản ghi `idempotency_key` cũ ở dev/staging: xóa sau khi sửa.
- Trạng thái: Open

### FB-R2-SEC-BE-07
- Mức độ: Major
- Vị trí: `src/modules/identity/internal/users.service.ts` dòng 118–130 (`load`), 314–395 (`update`: `resetPassword`, `status`)
- Vấn đề: OWN được sửa người dùng chỉ cần người đó có **một** vai ở **một** cơ sở mình sở hữu. Nhưng `resetPassword`, `status=disabled/active` tác động lên **toàn bộ tài khoản** (mọi cơ sở). OWN cơ sở A đặt lại mật khẩu cho người là OWN/MGR ở cả A và B → đăng nhập bằng mật khẩu tạm và có quyền ở **cơ sở B** mà mình không sở hữu (leo quyền ngang cơ sở); tương tự "mở khóa" (`status=active`) tài khoản bị OWN B khóa. `assertOwnersRemain` chỉ xét các cơ sở của người gọi.
- Vì sao quan trọng: SR-SES-05/SR-AZ-05 (cách ly cơ sở, TM-07/TM-09), ADR-007 điểm 3 (người có thể giữ vai khác nhau ở các cơ sở). MVP 1 cơ sở nên chưa khai thác được ngay, nhưng bộ seed 2 cơ sở (SR-AZ-09) phải chứng minh cách ly; sửa rẻ bây giờ, sửa sau khi có cơ sở thứ 2 là sự cố.
- Đề xuất sửa: Với `resetPassword` và đổi `status`: yêu cầu mọi vai còn hiệu lực của người đích nằm trong `owned` của người gọi, nếu không → `403 FORBIDDEN_ACTION` (hoặc 404 nếu muốn không lộ) + audit `access.denied`. `displayName` có thể giữ như hiện tại. Thêm ca vào bộ test lớp 2: OWN-A reset người có vai ở B → bị từ chối.
- Trạng thái: Open

### FB-R2-SEC-BE-08
- Mức độ: Major
- Vị trí: `src/modules/identity/public/passwords.ts` dòng 14–35, 72
- Vấn đề: Danh sách mật khẩu phổ biến có 20 mục; SR-AUTH-02 (B, R2) yêu cầu ≥ 10.000 mục offline. Kiểm hiện tại cũng chỉ so khớp nguyên chuỗi (không chuẩn hóa NFKC/khoảng trắng). BE đã ghi "asked from SEC".
- Vì sao quan trọng: TM-01 – mật khẩu kiểu `Khachsan@2026`, `Dalat123456` là đầu tiên bị thử khi dò; khóa tài khoản (BE-04) không đủ khi kẻ tấn công dùng danh sách ngắn trên nhiều tài khoản (password spraying).
- Đề xuất sửa: Theo quyết định SEC ở `outputs/SEC/s1-decisions.md` mục 2: tệp `common-passwords.txt` (nguồn SecLists – MIT, lọc độ dài 10–256, + danh sách tiếng Việt/thương hiệu do SEC bổ sung), kèm `common-passwords.SOURCE.md` (URL, commit, giấy phép, lệnh lọc, SHA-256); nạp một lần lúc khởi động vào `Set`; `config`/startup từ chối chạy ở staging/production nếu tệp thiếu hoặc < 10.000 dòng; so khớp sau `normalize('NFKC').toLowerCase().trim()` và thêm phép thử "bỏ chữ số/ký tự đặc biệt ở cuối" (`Dalat123456!` → `dalat`). Unit test theo SR-AUTH-02 (`12345678abc`, `ottimo2026` bị từ chối; chuỗi 10 ký tự ngẫu nhiên được nhận) + test đếm ≥ 10.000.
- Trạng thái: Open

### FB-R2-SEC-BE-09
- Mức độ: Major
- Vị trí: `src/modules/guests/internal/guests.service.ts` dòng 284–313 (`assertNoDuplicate`), 337–356 (`create`), 358–400 (`update`), 468–472 (`rateLimit` chỉ gọi ở `search`/`lookup`)
- Vấn đề: SAL/CTV dò được "SĐT/email này có là khách của OTTIMO không" qua `createGuest`/`updateGuest` mà **không** qua giới hạn 30 lần/giờ và **không** ghi `guest.lookup`: 409 `DUPLICATE_GUEST` trả về cho cả hồ sơ ngoài phạm vi (chỉ ẩn `existingGuestId`). `lookupGuestByContact` (có giới hạn + audit) vì thế bị vòng qua; mỗi lần thử còn có thể tạo hồ sơ rác khi số không trùng.
- Vì sao quan trọng: SR-RL-07 (B) và mục tiêu "giới hạn tra cứu chống dò" của US-072/BA 11.3 – CTV là người ngoài biên chế (TM-07, TM-11 – thu thập danh sách khách của đối thủ/cá nhân).
- Đề xuất sửa: Với người gọi `ownScopeUser(caller) !== null`: gọi `rateLimit(caller)` trong `create`/`update` **trước** `assertNoDuplicate` khi có `phone`/`email`; khi trùng hồ sơ ngoài phạm vi → ghi `audit_event access guest.lookup` (như `lookup`, không ghi giá trị). Cân nhắc dùng chung một bộ đếm cho lookup + create + update. Test: CTV tạo 31 hồ sơ với 31 SĐT khác nhau trong 1 giờ → lần 31 trả 429.
- Trạng thái: Open

### FB-R2-SEC-BE-10
- Mức độ: Minor
- Vị trí: `db/migrations/0001_rls_grants_entry_functions.sql` (`auth_find_user`, `auth_resolve_session`, `auth_resolve_device`, `worker_list_properties`, `log_ensure_month_partition`), `0005` (`auth_resolve_session` mới); `infra/postgres/init/02-roles.sh` (`GRANT … TEMPORARY … TO ottimo_app`)
- Vấn đề: Hàm SECURITY DEFINER đặt `SET search_path = pg_catalog, public` nhưng **không ghi `pg_temp` cuối**. Theo tài liệu PostgreSQL, khi `pg_temp` không có trong `search_path` nó được tìm **trước** cho bảng → `ottimo_app` (có quyền TEMPORARY) tạo được bảng tạm `app_user`/`user_session` che bảng thật trong hàm chạy quyền `ottimo_owner` (BYPASS RLS qua policy `entry_function_read`). Điều kiện: kẻ tấn công đã chạy được SQL bằng `ottimo_app` (SQLi/lộ `DATABASE_URL`), và với pool kết nối thì bảng tạm tồn tại trên kết nối dùng lại → giả mạo `password_hash` để đăng nhập thành bất kỳ ai. Phần còn lại đạt: owner `ottimo_owner`, `REVOKE ALL … FROM PUBLIC`, `GRANT EXECUTE` chỉ cho `ottimo_app`, chỉ cột cần thiết.
- Vì sao quan trọng: Phòng thủ chiều sâu cho TM-09 (biến lỗi SQLi thành chiếm tài khoản bất kỳ tổ chức).
- Đề xuất sửa: Migration mới (không sửa 0001/0005): `ALTER FUNCTION … SET search_path = pg_catalog, public, pg_temp` cho cả 5 hàm (hoặc ghi rõ `public.app_user` trong thân hàm); `REVOKE TEMPORARY ON DATABASE … FROM ottimo_app` nếu app không dùng bảng tạm (kiểm pg-boss). `architecture.test.ts` thêm kiểm `proconfig` của mọi hàm `prosecdef` có `pg_temp` ở cuối.
- Trạng thái: Open

### FB-R2-SEC-BE-11
- Mức độ: Minor
- Vị trí: `auth.service.ts` dòng 71–114
- Vấn đề: Thời gian phản hồi không đồng đều: tên không tồn tại chỉ chạy 1 argon2 rồi 401; tên tồn tại chạy argon2 **cộng** 1–2 giao dịch DB (`me.properties`, `registerFailure` + `audit.record`). Chênh vài ms, đo được qua nhiều mẫu → dò tên đăng nhập. Ngoài ra tài khoản đang khóa tạm trả 429 trước khi kiểm mật khẩu (theo SR-AUTH-04 – chấp nhận), nhưng là thêm một kênh lộ "tên này tồn tại".
- Vì sao quan trọng: SR-AUTH-04 "thời gian phản hồi đồng đều khi tên không tồn tại" (TM-01).
- Đề xuất sửa: Nhánh không tồn tại vẫn chạy một giao dịch giả cùng hình dạng (hoặc chuyển ghi `registerFailure`/audit sang sau khi đã trả lời – không khuyến nghị vì mất audit); tối thiểu: đệm thời gian phản hồi 401 tới một mức cố định (ví dụ ≥ 400 ms tính từ đầu request). Ghi một test đo trung vị 2 nhánh (không gắt, chỉ cảnh báo lệch > 50 ms).
- Trạng thái: Open

### FB-R2-SEC-BE-12
- Mức độ: Minor
- Vị trí: `shared/http/auth.guard.ts` dòng 158–165, 281–284 (`allOrigins()` gồm cả `guest`); `auth.service.ts` dòng 68–69 (`unknown` → `admin`)
- Vấn đề: `login` (operation public) chấp nhận `Origin` của **guest-web** và coi origin không xác định là `admin` → có thể tạo phiên nhân viên `client_origin=admin` trên origin khách (cookie host-only ở `g.<domain>`). Không đọc/ghi được nhiều (ghi bị chặn vì CSRF chỉ nhận origin nhân viên) nhưng phá nguyên tắc tách phiên khách/nhân viên (SR-SES-09, SR-HDR-04) và mở đường cho một XSS ở guest-web đọc dữ liệu nhân viên qua GET.
- Vì sao quan trọng: TM-27 (lẫn phiên khách – nhân viên).
- Đề xuất sửa: Danh sách origin theo **từng operation public**: `login` chỉ `staff` (admin + PWA); `openGuestSession` chỉ `guest`. Origin `unknown` khi đã cấu hình origin → 403, không mặc định `admin`.
- Trạng thái: Open

### FB-R2-SEC-BE-13
- Mức độ: Minor
- Vị trí: `shared/problem.ts` dòng 145–153 (`ProblemFilter` log `exception.message`)
- Vấn đề: Lỗi không lường trước được log nguyên `name: message`. Thông báo lỗi PostgreSQL/zod/JSON có thể chứa giá trị đầu vào (`invalid input syntax for type uuid: "…"`, `Unexpected token … in JSON`), không qua redactor của SR-LOG-04 (Luhn, CCCD 12 số, email, SĐT). Pino `redact` chỉ áp theo khóa, không áp lên chuỗi tự do.
- Vì sao quan trọng: SR-LOG-04/SR-LOG-05 (log không chứa C2/C3, giữ 90 ngày).
- Đề xuất sửa: Hàm `redactText()` dùng chung (Luhn 13–19 số, `\b\d{12}\b`, MRZ/hộ chiếu, email, SĐT VN) áp lên mọi chuỗi trước khi log; với lỗi `pg` chỉ log `code` + `constraint` + `routine`. Test: ném lỗi chứa số thẻ thử nghiệm/CCCD giả → dòng log đã che.
- Trạng thái: Open

### FB-R2-SEC-BE-14
- Mức độ: Minor
- Vị trí: `modules/identity/public/rate-limiter.ts` (bộ đếm RAM cho `loginPerIp`, `guestLookupPerUser`)
- Vấn đề: SR-RL (mục 13) quy định bộ đếm xác thực lưu PostgreSQL ("bộ đếm RAM chỉ dùng cho giới hạn chung"). Bộ đếm RAM reset khi khởi động lại/deploy (CI deploy tự động nhiều lần/ngày) và nhân theo số replica. Khóa theo tài khoản và reauth đã lưu DB (đạt). Ngoài ra chưa có `audit_event security` khi chạm ngưỡng IP (SR-RL mục 13 đoạn đầu).
- Vì sao quan trọng: Giảm hiệu lực SR-RL-01/SR-RL-07; chấp nhận được ở 1 replica R2 nếu ghi rõ.
- Đề xuất sửa: R2: giữ RAM nhưng ghi audit `security` khi một IP chạm ngưỡng đăng nhập + ghi giả định trong decision-log ("1 replica"); R3 (trước GL): chuyển sang bảng `rate_limit_counter` (UPSERT nguyên tử). SEC sẽ chỉnh SR-RL mục 13 cho khớp.
- Trạng thái: Open

### FB-R2-SEC-BE-15
- Mức độ: Minor
- Vị trí: `users.service.ts` dòng 367–379 (OWN tự `resetPassword` cho chính mình qua `updateUser`)
- Vấn đề: OWN gọi `updateUser` với `userId` của chính mình + `resetPassword` → đổi mật khẩu **không cần mật khẩu cũ**, vòng qua `changeMyPassword` (SR-AUTH-05 yêu cầu mật khẩu cũ) và bộ đếm reauth. Kẻ chiếm được phiên OWN (máy quầy quên khóa) chiếm luôn tài khoản vĩnh viễn.
- Vì sao quan trọng: TM-02 (phiên bỏ quên) → TM-03.
- Đề xuất sửa: `updateUser` với `userId === người gọi` mà có `resetPassword` hoặc `status` → 422 `NOT_ALLOWED_FOR_SELF` (hướng dẫn dùng `POST /v1/me/password`); test tương ứng.
- Trạng thái: Open

### FB-R2-SEC-BE-16
- Mức độ: Minor
- Vị trí: OpenAPI `Guest.gender` (không có `x-visible-to`, `x-rbac-field: D01`); `field-policy.ts` `D01: [MT]` – **người sửa: ARC** (ghi ở đây vì BE serializer đang trả)
- Vấn đề: rbac 6 D01 cho SAL/CTV chỉ "Tên + quốc tịch (M)", nhưng `gender` (và `isForeigner`, `preferredLocale`, `preferredContact` – mức thấp) được trả cho SAL/CTV vì chỉ gắn D01 (D01 chỉ chặn MT). `dateOfBirth` đã có `x-visible-to` đúng.
- Vì sao quan trọng: SR-AZ-04 tối thiểu dữ liệu (TM-08); giới tính là dữ liệu cá nhân cơ bản theo NĐ 13 – không cần cho SAL/CTV.
- Đề xuất sửa: ARC thêm `x-visible-to: [owner, manager, front_desk_lead, front_desk]` cho `Guest.gender`; QA thêm vào snapshot JSON theo vai.
- Trạng thái: Open

### FB-R2-SEC-BE-17
- Mức độ: Suggestion
- Vị trí: `modules/approvals/internal/reauth.ts` (toàn tệp) và cách gọi trong `approvals.controller.ts` dòng 104–109
- Vấn đề: `ApproverReauth` trùng logic `PasswordReauth` (cùng cột, cùng giới hạn) và được gọi **bên trong** giao dịch của `UnitOfWork` nhưng mở một kết nối thứ hai (`db.withContext`) → mỗi request duyệt giữ 2 kết nối; khi pool cạn có thể tự khóa chết (pool starvation). Không phải lỗ hổng, nhưng là điểm từ chối dịch vụ dễ gặp.
- Đề xuất sửa: Gọi `PasswordReauth.verify` **trước** `uow.run` như `changeMyPassword`/`trustCurrentDevice` (TODO BE-A đã ghi), xóa bản sao.
- Trạng thái: Open

### FB-R2-SEC-BE-18
- Mức độ: Suggestion
- Vị trí: `approval.service.ts` `SubmitInput.requesterReauthenticated` (boolean do module gọi truyền vào)
- Vấn đề: Tự áp FOC (BR-436) chỉ dựa vào một cờ boolean do module khác đặt; một module folio sau này quên reauth mà đặt `true` là vượt kiểm soát hai người.
- Đề xuất sửa: Thay boolean bằng một "bằng chứng" do `PasswordReauth.verify` trả (ví dụ đối tượng `{ userId, at, method }` có ký hiệu riêng không tạo được ngoài module identity) và `submit` kiểm `userId === actor.userId` và `at` trong 60 giây.
- Trạng thái: Open

### FB-R2-SEC-BE-19
- Mức độ: Suggestion
- Vị trí: `auth.service.ts` dòng 115–118 (`MFA_REQUIRED` – R3)
- Vấn đề: Khi làm 2FA (R3): hiện tại trả `MFA_REQUIRED` **sau** khi xác nhận mật khẩu đúng và không reset bộ đếm – là tín hiệu "mật khẩu đúng". Khi cài, bước TOTP phải dùng chung bộ đếm khóa đăng nhập, `mfaToken` ngắn hạn (≤ 5 phút, dùng 1 lần, lưu băm) và cấp **phiên mới** sau 2FA (SR-SES-02).
- Đề xuất sửa: Ghi vào đặc tả US-001 R3; không cần sửa R2.
- Trạng thái: Open

### FB-R2-SEC-BE-20
- Mức độ: Suggestion
- Vị trí: `modules/identity/internal/session-policy.interceptor.ts` dòng 85–87; `auth.service.ts` dòng 127, 159 (`session_policy`/`login_lockout` đọc theo cơ sở đầu tiên của người dùng, ngày UTC)
- Vấn đề: Hai tham số xác thực đang lưu theo **cơ sở** nhưng đăng nhập chưa có cơ sở → lấy cơ sở đầu tiên theo `p.code`; người có vai ở 2 cơ sở có chính sách phụ thuộc thứ tự mã cơ sở. Ngày hiệu lực tính theo UTC thay vì giờ cơ sở.
- Đề xuất sửa: Chuyển 2 khóa này thành tham số **cấp tổ chức** (hoặc lấy giá trị chặt nhất trong các cơ sở của người dùng) – ARC quyết khi đưa vào `x-security-parameters` (s1-decisions mục 1).
- Trạng thái: Open

---

## Điểm làm tốt (nên giữ)
1. Khung phiên đúng thiết kế: token 256 bit chỉ ở cookie `__Host-` (`HttpOnly; Secure; SameSite=Lax`, cookie thiết bị `SameSite=Strict`), DB chỉ giữ SHA-256; CSRF token đồng bộ HMAC theo phiên; `roles_version` đọc mỗi request nên đổi vai/khóa/đặt lại mật khẩu có hiệu lực ngay; `changeMyPassword` thu hồi mọi phiên và cấp phiên mới (SR-SES-02/06). `main.ts` từ chối khởi động staging/production khi thiếu CSRF verifier; `TRUST_PROXY` chặt (đã sửa BE-01/02).
2. Mặc định từ chối nhất quán: route thiếu `@Operation` là lỗi lập trình, serializer dựng lại JSON theo schema (bỏ khóa không khai báo, `writeOnly`, C3 ngoài `x-c3-log`, D-code chưa duyệt → ẩn), audit theo danh sách cho phép + regex cấm `password/secret/token/pin`, `guest.lookup` không ghi giá trị tra cứu.
3. RLS + vai DB làm kỹ: `ENABLE` + `FORCE` mọi bảng, policy `entry_function_read` chỉ cho `ottimo_owner`, phân vùng log thu hồi quyền trực tiếp, `CHECK` chống tự duyệt ở DB, reauth đếm sai trong giao dịch riêng có `FOR UPDATE`, khóa tư vấn chống vượt hạn mức tháng khi duyệt song song.
