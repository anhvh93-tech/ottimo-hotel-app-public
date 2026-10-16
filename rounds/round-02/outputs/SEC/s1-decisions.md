# SEC – Round 2, Sprint 1: quyết định bảo mật (tham số xác thực, danh sách mật khẩu, Q-S1…Q-S5, E06-06)

- Vai: SEC | Ngày: 16/10/2026 | Không commit, không sửa mã
- Đầu vào: `product/services/api` @ d7d42e4, `outputs/ARC/s1-contract.md` (mục 2, 3), `docs/api/openapi.yaml` 0.3.3-draft, `specs/EP06-registration.md` (8.1, 8.3, E06-09), `security-requirements.md` v0.2, `outputs/SEC/w1-review.md` (P-R2-4 ĐK-1…6)
- Thẻ review đi kèm: `reviews/SEC-on-BE.md` (FB-R2-SEC-BE-04…20), `reviews/SEC-on-FE.md` (FB-R2-SEC-FE-01…04)
- Các quyết định dưới đây thuộc quyền SEC (yêu cầu kỹ thuật bảo mật) – **không cần ESC**. ORC chép các dòng ở mục 6 vào `01-decisions/decision-log.md`.

---

## 1. `session_policy` và `login_lockout` → **ĐƯA VÀO `x-security-parameters`**

Lý do: hai khóa này quyết định trực tiếp TM-01/TM-02; hiện `parameter-rules.ts` cho OWN đặt phiên admin-web tới **720 giờ** và khóa đăng nhập tới 10 lần sai / 1 ngày – nới quá SR-SES-03/SR-AUTH-04 mà không ai duyệt. Đưa vào `x-security-parameters` = chỉ owner sửa, biên cứng do SEC đặt, audit `category=security` (BUG-R1-SEC-02).

Nguyên tắc biên: chỉ cho **chặt hơn hoặc bằng** SR; riêng thời gian khóa có trần để không biến khóa thành công cụ từ chối dịch vụ (FB-R2-SEC-BE-05).

| Khóa con | Kiểu | Biên (min–max) | Mặc định | Ref |
|---|---|---|---|---|
| `session_policy.admin.idleMinutes` | integer | **5–30** | 30 | SR-SES-03 |
| `session_policy.admin.maxHours` | integer | **1–12** | 12 | SR-SES-03 |
| `session_policy.staff_pwa.idleMinutes` | integer | **60–4320** (72 giờ) | 4320 | SR-SES-03 |
| `session_policy.staff_pwa.maxHours` | integer | **24–720** (30 ngày) | 720 | SR-SES-03 |
| `login_lockout.maxFailures` | integer | **3–5** | 5 | SR-AUTH-04 |
| `login_lockout.lockMinutes` | integer | **15–60** | 15 | SR-AUTH-04 |
| `login_lockout.hardLockAfterLocks` | integer | **2–3** | 3 | SR-AUTH-04 |
| `login_lockout.lockWindowHours` | integer | **24–72** | 24 | SR-AUTH-04 |

Ràng buộc chéo (giữ từ `parameter-rules.ts`): `idleMinutes ≤ maxHours × 60` cho từng kênh. Vi phạm → `422 PARAM_OUT_OF_RANGE` kèm `min`/`max` của khóa con.

Việc kéo theo:
- **ARC**: thêm 2 khóa vào `setParameter.x-security-parameters` (dạng object có khóa con – mô tả như bảng trên); quyết **phạm vi cấp tổ chức** (đăng nhập chưa có cơ sở – FB-R2-SEC-BE-20). Đề xuất SEC: cấp tổ chức; nếu giữ cấp cơ sở thì khi đăng nhập dùng giá trị **chặt nhất** trong các cơ sở của người dùng.
- **BE**: migration mới đặt `is_security = true`, `bounds` theo bảng; `parameter-rules.ts` áp biên mới; test biên (giá trị ngoài biên với owner vẫn 422).
- **SEC** (v0.3 `security-requirements.md`): SR-AUTH-04 ghi rõ "khóa tạm và khóa cứng chỉ chặn **đăng nhập mới**; không hủy phiên đang sống; OWN dùng vô hiệu hóa tài khoản khi cần đá phiên" (theo FB-R2-SEC-BE-05).

## 2. Danh sách mật khẩu phổ biến ≥ 10.000 (SR-AUTH-02)

**Quyết định nguồn** (ưu tiên giảm dần – BE/OPS kiểm lại giấy phép **tại thời điểm tải** và ghi vào tệp SOURCE; SEC không tự khẳng định thay):

| # | Nguồn | Giấy phép (cần xác minh khi tải) | Dùng thế nào |
|---|---|---|---|
| A (chọn) | **SecLists** (danielmiessler/SecLists), thư mục `Passwords/Common-Credentials/` – tệp top 1.000.000 của bộ "10-million-password-list" và tệp `100k-most-used-passwords-NCSC.txt` | Repo SecLists công bố **MIT**; tệp NCSC có nguồn gốc từ Pwned Passwords – nếu ghi chú riêng là CC BY 4.0 thì ghi nguồn trong `SOURCE.md` (CC BY cho phép dùng thương mại khi ghi công) | Hợp nhất, chuẩn hóa, **lọc độ dài 10–256** (mật khẩu < 10 ký tự đã bị chặn bởi độ dài) → mục tiêu ≥ 10.000 dòng sau lọc; nếu sau lọc < 10.000 thì lấy thêm theo thứ hạng từ tệp top 1.000.000 tới khi đủ |
| B (bổ sung, tự soạn) | Danh sách tiếng Việt/ngữ cảnh do SEC + DOM soạn: `matkhau`, `anhyeuem`, `emyeuanh`, `khachsan`, `dalat`, `ottimo`, tên cơ sở, `letan`, `quanly`, `admin`, `hotel`, `homestay`, `vietnam`, `saigon`, `hanoi` + hậu tố năm (2020–2030), `123`, `1234`, `123456`, `@123`, `!` | Nội bộ – không vướng giấy phép | Sinh tổ hợp vào cùng tệp; SEC giao danh sách gốc cho BE trong Sprint 2 |
| Loại | Pwned Passwords API trực tuyến (k-anonymity) | – | **Không dùng**: SR-AUTH-02 yêu cầu offline; phụ thuộc dịch vụ ngoài VN lúc đăng nhập/đổi mật khẩu |
| Loại | rockyou.txt và các bản dump rò rỉ không có giấy phép rõ | Không rõ | **Không dùng** |

**Cách nạp** (BE, kiểm bởi SEC):
1. Tệp `product/services/api/src/modules/identity/public/common-passwords.txt` – mỗi dòng 1 mục, đã `normalize('NFKC')`, chữ thường, bỏ khoảng trắng đầu/cuối, bỏ trùng, sắp xếp; UTF-8, không BOM. Kích thước dự kiến < 1 MB (không cần Bloom filter).
2. Tệp `common-passwords.SOURCE.md` cạnh đó: URL + commit hash nguồn, giấy phép, ngày tải, lệnh lọc tái lập được, số dòng, SHA-256 của tệp. Không tải lúc build/chạy – tệp nằm trong repo (gitleaks không coi là bí mật; nếu cảnh báo thì thêm allowlist đúng đường dẫn).
3. Nạp **một lần khi khởi động** vào `Set<string>`; script build copy tệp vào `dist/` như `copy-migrations.mjs`. Startup check (`startup-checks.ts`): ở `staging`/`production` thiếu tệp hoặc < 10.000 dòng → **dừng khởi động** (giống SR-SECR-05).
4. So khớp: chuẩn hóa như bước 1 rồi kiểm (a) nguyên chuỗi, (b) chuỗi sau khi bỏ chữ số và ký tự đặc biệt ở **cuối** (`Dalat123456!` → `dalat`), (c) chứa tên đăng nhập hoặc `ottimo` (đã có). Trả `PASSWORD_TOO_COMMON`.
5. Test: SR-AUTH-02 (`12345678abc`, `ottimo2026` bị từ chối; chuỗi 10 ký tự ngẫu nhiên được nhận), số dòng ≥ 10.000, một mẫu từ nguồn A và B bị từ chối, tệp có SHA-256 khớp `SOURCE.md`.
6. Áp cho mọi chỗ đặt mật khẩu: `changeMyPassword`, `createUser.initialPassword`, `updateUser.resetPassword`, CLI tạo OWN đầu tiên (SR-AUTH-01).

Ghi chú: SR-AUTH-02 ghi tối đa 128 ký tự; mã đang dùng 256. **SEC chấp nhận 256** (argon2id không tốn thêm đáng kể) – sửa SR ở v0.3.

## 3. Duyệt E06-06 (`x-sec-review: pending-DK2`, OpenAPI 0.3.3) = Q-S1

**Kết luận: DUYỆT CÓ ĐIỀU KIỆN.** Ba thuộc tính mức 1 mới không chứa định danh người, giấy tờ, ảnh, mã cửa hay tiền; khách chỉ đọc lại lựa chọn của chính mình → không vi phạm ĐK-2/ĐK-6. ARC đổi `x-sec-review: pending-DK2` → `x-sec-review: approved-DK2 (SEC 16/10/2026)` sau khi thêm các điều kiện dưới vào hợp đồng; BE được cài khi điều kiện 1–4 có trong hợp đồng.

| # | Mục duyệt | Kết luận | Điều kiện |
|---|---|---|---|
| a | `OnlineCheckin.noticeAccepted` (bool) | Duyệt | Chỉ `true` khi `noticeVersion` khách gửi = bản **hiện hành**; đổi bản thông báo → trả `false` và `currentStep=notice` lại. Server lưu `noticeVersion`, `locale`, thời điểm – **không** coi đây là "đồng ý" (đồng ý lưu ảnh vẫn là `recordGuestConsent` riêng, R-CON) |
| b | `OnlineCheckin.lateArrival` (bool) | Duyệt | Không kèm giờ khác ngoài `etaTime` hiện có |
| c | `OnlineCheckin.deferredPeople` (mảng chỉ số) | Duyệt | Chỉ số nguyên `1…requiredPeople`, không trùng, không kèm tên/loại giấy tờ; server bỏ chỉ số đã có ảnh |
| d | `currentStep = notice` | Duyệt | – |
| e | `updateOnlineCheckin.arrivalNote` `writeOnly` | Duyệt | (1) BE kiểm ≤ 300 ký tự + V-09 (Luhn → `CARD_NUMBER_DETECTED`) + loại ký tự điều khiển; (2) **ARC gắn `x-rbac-field: D23`** cho `Registration.onlineCheckin.arrivalNote` (hiện chưa có nhãn – nếu không, serializer cho mọi vai đọc `Registration` thấy); (3) không đưa `arrivalNote` vào thông báo đẩy/Web Push, `outbox_message.payload`, `audit_event.before/after` (chỉ ghi "có ghi chú"), log (SR-PWA-06, SR-AUD-03); (4) test serializer: JSON trả app khách **không bao giờ** có khóa `arrivalNote` |
| f | `completeOnlineCheckin.deferredPeople` | Duyệt | Như (c); `Idempotency-Key` bắt buộc như hợp đồng |
| g | Giới hạn tần suất | Bổ sung | 4 operation ghi của check-in online tính vào **SR-RL-05** (≤ 20 lần ghi/ngày/đơn cho `updateOnlineCheckin` + `completeOnlineCheckin`; upload giữ 30 tệp/đơn) – chống spam ghi chú vào Desk |
| h | Test ĐK-2 (QA, E06-11) | Bổ sung | Danh sách khóa được phép của `OnlineCheckin` mức 1 = `currentStep, requiredPeople, uploadedPeople, etaTime, consentRecorded, completedAt, noticeAccepted, lateArrival, deferredPeople`; mọi khóa khác → test đỏ |

ĐK-1, ĐK-3…ĐK-6 không bị 0.3.3 ảnh hưởng (đồng ý với mục 2 của ARC). `409 ONLINE_CHECKIN_CLOSED` chấp nhận (không lộ thông tin ngoài việc lễ tân đã nhận giấy tờ – khách vốn biết).

## 4. Câu hỏi Q-S2…Q-S5 của ARC

### Q-S2 – Phân loại `arrivalNote`
**Quyết định: C2, xóa theo T13 như `guest_request.note`.** Văn bản tự do của khách có thể chứa tên người đi cùng, SĐT, sức khỏe → không thể coi C1. Kèm: gợi ý trên guest-web "Không ghi số giấy tờ, thẻ thanh toán hay thông tin sức khỏe" (UXD, SR-INP-05); hiển thị ở Desk dạng văn bản thuần (SR-INP-04); vai thấy: theo D23 (FD+; không SAL/CTV/HK/MT trừ khi rbac đổi). Không cần C3/mã hóa riêng.

### Q-S3 – Nhật ký `portal-data`: "mỗi lần lấy = 1 dòng `view`"
**Quyết định: CHẤP NHẬN**, không ghi từng lần bấm sao chép. Lý do: một dòng ghi từ client là tín hiệu không tin cậy (client độc hại không gọi); dữ liệu đã lộ ở lần lấy. Điều kiện bù:
1. `getPortalData` trả `Cache-Control: no-store` (SR-C3-03), step-up theo SR-C3-09, giới hạn SR-RL-06 (cảnh báo 60/giờ, chặn 200/giờ), `c3_access_log view` ghi **trước** khi trả (SR-C3-07), mỗi `kind` của khai báo `mixed` là một lần lấy riêng.
2. FE **không** gọi lại `getPortalData` ngầm (polling/refetch khi focus) – mỗi lần lấy phải do người dùng mở bước; dữ liệu giữ trong bộ nhớ màn hình, xóa khi rời màn.
3. Clipboard: xem Q-S4 (d).
4. SEC sửa SR-C3-11 ở v0.3: bỏ "mỗi lần sao chép ghi `c3_access_log action=copy`", thay bằng điều 1–2 ở trên.

### Q-S4 – E06-09 (a)–(d)
- **(a) Chỉ hỏi đồng ý cho Khách 1 trên guest-web – XÁC NHẬN.** Người đi cùng tự trả lời tại quầy (R-CON-04: người đặt không quyết thay). Điều kiện: server **từ chối** `recordGuestConsent` qua `channel=guest_app` với `personIndex ≠ 1` (403/422); người đi cùng chưa trả lời khi xác nhận khai báo → coi là **không đồng ý** (ảnh xóa theo luồng `no_consent`), không có mặc định "đồng ý"; người dưới ngưỡng dữ liệu trẻ em không hỏi (giữ mục 0). Câu chữ cuối cùng vẫn cần luật sư (ESC-001 A).
- **(b) `guest.oci.withdraw_hint` – DUYỆT câu chữ**, đề xuất bản cuối: VI "Muốn rút đồng ý lưu ảnh giấy tờ? Hãy báo lễ tân – ảnh sẽ được xóa." / EN "Want to withdraw consent to keep your ID photos? Tell the front desk and they will be deleted." Không hứa thời hạn xóa cụ thể trên app khách (thời hạn phụ thuộc J16 và sao lưu ≤ 35 ngày – SR-BAK-07). Luật sư rà cùng văn bản thông báo (ESC-001).
- **(c) Chuỗi cấm R2 – XÁC NHẬN danh sách ĐK-6 ở `EP06-registration.md` 8.1** (`guest.verify.*`, `guest.door_code*`, `guest.late.done_title`, `guest.late.code_*`, `guest.late.how_*`, `guest.late.prompt`, `guest.late.arrival_hint`, `guest.tab.bill`, `guest.bill.*`, `guest.after_checkout.body`) + bản R2 của `guest.oci.done_body`. Bổ sung: không chuỗi nào ở guest-web R2 được chứa các từ "mã cửa/door code", "OTP", "hóa đơn/bill" ngoài trang "đã kết thúc". Kiểm: test CI quét bundle guest-web (`dist`) không chứa các khóa trên (QA/MOB).
- **(d) Tự ẩn số đầy đủ sau 60 giây, tự xóa clipboard sau 60 giây – DUYỆT** với bổ sung: ẩn/xóa **ngay** khi rời màn, đóng hộp, đăng xuất, phiên hết hạn hoặc tab bị ẩn (`visibilitychange`); việc ghi đè clipboard là best-effort (trình duyệt có thể từ chối khi tab không focus) → luôn có nút "Xóa bộ nhớ tạm" và nhắc trong checklist máy quầy (tắt lịch sử clipboard – SR-DEV-07). Nút "Sao chép tất cả" chỉ cho phép **theo từng người** (không cả đoàn) và **không** là nút mặc định/được focus sẵn (SR-C3-11 "không sao chép cả khối mặc định").

### Q-S5 – Cấm tự đối soát (`reconcilePayment`)
**Quyết định: ĐỦ CHẶT cho R2, kèm 3 điều kiện.**
1. Người đối soát phải khác **cả** `recordedByUserId` (người ghi/tạo QR) **và** `confirmedByUserId` (người xác nhận thấy tiền) – so theo `user_id`, không theo vai; kiểm trong SQL dưới `FOR UPDATE` **và** bằng ràng buộc CHECK ở DB (như `approval_request_no_self_approval`).
2. Ngoại lệ OWN tự đối soát chấp nhận (OWN là chủ tiền; khách sạn 10 phòng có thể chỉ 1 người cấp MGR+) nhưng phải: ghi `audit_event money` với cờ `selfReconciled=true`, hiện trong báo cáo FOC/đối soát tháng và đóng ca (BR-526). MGR **không** có ngoại lệ.
3. `disputed` không bao giờ tự đảo giao dịch (như hợp đồng) và gửi cảnh báo cho OWN + MGR **khác** người ghi.

## 5. Tóm tắt thẻ review Sprint 1 (để ORC theo dõi)

| Tệp | Blocker | Major | Minor | Suggestion |
|---|:-:|:-:|:-:|:-:|
| `reviews/SEC-on-BE.md` | 0 | 6 (BE-04 khóa đăng nhập mất cập nhật khi song song; BE-05 khóa tạm đá mọi phiên → DoS; BE-06 `request_hash` chứa SHA-256 của mật khẩu; BE-07 OWN đặt lại mật khẩu/mở khóa người có vai ở cơ sở khác; BE-08 danh sách mật khẩu 20 mục; BE-09 dò SĐT/email qua `createGuest` vượt giới hạn tra cứu) | 7 | 4 |
| `reviews/SEC-on-FE.md` | 0 | 1 (FE-01 bản nháp form khách C2 trong `sessionStorage`, không xóa khi đăng xuất) | 2 | 1 |

Không có phát hiện Critical → **không chặn**. 7 thẻ Major phải xử lý trong R2 (DoD B3).

## 6. Dòng cho `decision-log.md` (ORC chép)

| Ngày | Round | Quyết định | Người quyết | Lý do |
|---|---|---|---|---|
| 16/10/2026 | 2 | `session_policy`, `login_lockout` vào `x-security-parameters` với biên ở s1-decisions mục 1; khóa đăng nhập không hủy phiên đang sống | SEC | TM-01/02; chặn nới phiên 720 giờ; tránh DoS khóa tài khoản |
| 16/10/2026 | 2 | Danh sách mật khẩu phổ biến: SecLists (MIT) lọc 10–256 + danh sách tiếng Việt; tệp offline trong repo, startup check ≥ 10.000 | SEC | SR-AUTH-02 |
| 16/10/2026 | 2 | Duyệt có điều kiện E06-06 (`noticeAccepted`, `lateArrival`, `deferredPeople`, `currentStep=notice`, `arrivalNote` writeOnly + D23) | SEC | P-R2-4 ĐK-2 |
| 16/10/2026 | 2 | `arrivalNote` = C2, xóa theo T13 | SEC | Văn bản tự do của khách |
| 16/10/2026 | 2 | `portal-data`: 1 dòng `view` mỗi lần lấy, không ghi `copy`; SR-C3-11 sửa ở v0.3 | SEC | Tín hiệu client không tin cậy; bù bằng step-up + no-store + giới hạn |
| 16/10/2026 | 2 | E06-09: đồng ý chỉ Khách 1 trên guest-web (server chặn personIndex ≠ 1); câu `withdraw_hint`; chuỗi cấm ĐK-6; ẩn số/xóa clipboard 60 giây + khi rời màn | SEC | R-CON-04, ĐK-5/6, SR-C3-11 |
| 16/10/2026 | 2 | Tự đối soát: cấm người ghi và người xác nhận; OWN được tự đối soát có cờ + báo cáo; CHECK ở DB | SEC | BR-527, A46 |
| 16/10/2026 | 2 | Chấp nhận mật khẩu tối đa 256 ký tự (SR-AUTH-02 sửa ở v0.3) | SEC | Khớp mã; argon2id không bị ảnh hưởng |

## 7. Giả định
- Giấy phép SecLists (MIT) và tệp NCSC (nguồn Pwned Passwords) theo hiểu biết của SEC – **phải kiểm lại khi tải** và ghi vào `common-passwords.SOURCE.md`; nếu giấy phép khác dự kiến, dùng nguồn A phần MIT + nguồn B.
- MVP 1 replica api (hosting R2) – chấp nhận bộ đếm RAM cho giới hạn IP tới R3 (FB-R2-SEC-BE-14).
- Không chạy được test (máy SEC không có `pnpm`/PostgreSQL); kết luận dựa trên đọc mã d7d42e4 và kết quả test ARC báo.
