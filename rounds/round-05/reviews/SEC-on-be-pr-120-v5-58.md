# SEC – Review PR #120 (BE-D V5-58, Wi-Fi trên Desk phía máy chủ, SR-RL-15)

Round 5 · bước **Review** · SEC · 07/11/2026

Đối tượng:

| PR | Nhánh | HEAD | Gốc (merge-base với `main`) | CI lúc đọc |
|---|---|---|---|---|
| #120 | `r5-v5-58` | **`b790b09f`** | `4003471e` (**chưa** có #111 `ce404dd6`) | Xanh hết ở đúng SHA (run 42261991416: API test, contract `RBAC --strict`, OpenAPI lint, gitleaks, E2E smoke) |

ORC báo BE-D sẽ chuyển câu UPSERT `rate_limit_counter` sang một hàm ở `shared/` theo quyết định ARC, nên HEAD sẽ đổi. Lúc SEC đọc (và kiểm lại ngay trước khi commit tệp này), HEAD vẫn là `b790b09f`. Mục 3 ghi những gì SEC cần thấy ở HEAD mới.

Đối chiếu:
- `product/docs/security/security-requirements.md` SR-RL-15 (mục 13), SR-LOG, SR-AZ;
- `rounds/round-05/responses/SEC-responses.md` mục 2 (C0313-23: luật, 6 test bắt buộc ở 2.3) và mục 3 (C0313-24: `rate_limit_counter`, khóa `wifi_pw_cmp:<user_id>`, một câu UPSERT);
- `openapi.yaml` `setPropertyWifi`, `getPropertyWifi` (bổ sung 1, 1e; chữ 1f trên `main`).

Cách kiểm:
- Đọc diff `4003471e..b790b09f` (14 tệp) bằng `git show`/`git diff`; không checkout nhánh vào bản làm việc chung, không chạy stack, không gọi staging hay production.
- Đọc 4 nhóm test: `v5-58-property-wifi.test.ts` (T58-1…13), `v5-58-caller-password-units.test.ts` (thứ tự bước), `v5-58-wifi-units.test.ts`, `rbac-r5-bed.test.ts` (11 ca mỗi thao tác, sinh từ `rbac-cases.json`). SEC không tự chạy test; dựa vào CI của đúng SHA.
- `git merge-tree` HEAD với `main` @ `547f2123`: không xung đột.

Tệp này không có mật khẩu Wi-Fi, mật khẩu seed, mã TOTP hay dữ liệu khách.

---

## 0. Kết luận

| PR | SHA | Kết luận | Gộp khi |
|---|---|---|---|
| #120 | `b790b09f` | **DUYỆT** | Gộp `main` trước (để có chữ hợp đồng 1f của #111), CI xanh. Nếu HEAD đổi vì chuyển hàm UPSERT sang `shared/`, phần đổi phải đạt 5 điểm ở mục 3; đạt thì duyệt này áp cho HEAD mới, không cần SEC đọc lại toàn bộ |

0 Blocker · 0 Major · 0 Minor · 2 Suggestion (không chặn gộp). ESC mới: **không**.

---

## 1. Ba điểm BE-D hỏi

### 1.1 Thứ tự hai giao dịch: đúng

`CallerPasswordMatch.check` (`identity/public/caller-password-match.ts`) chạy **trước** `UnitOfWork.run`:
1. Giao dịch 1 (`withContext`): `bumpRateLimitCounter` (UPSERT nguyên tử, `RETURNING count`). Quá ngưỡng thì ghi audit `skipped` khi `count = 6` rồi trả `skipped`. Trong ngưỡng thì đọc `password_hash` của **chính** `ctx.userId`. Giao dịch commit ở đây.
2. Một lần `verifyPassword` (argon2) **ngoài** mọi giao dịch. Không có hash thì so với hash giả, kết quả luôn `false`.
3. Trùng: audit `security` `property.wifi_password_matches_login` ở giao dịch riêng, commit rồi mới trả 422.

Hệ quả:
- 422 làm rollback request vẫn giữ bộ đếm và cả hai audit. Test T58-9/12 kiểm điều này trên DB thật; test đơn vị kiểm thứ tự "commit trước khi so".
- Hai request song song: mỗi UPSERT nhận một `count` riêng, nên không quá 5 lần so trong một cửa sổ. Audit `skipped` chỉ ghi một lần, vì chỉ đúng một request nhận `count = 6`.
- Quá ngưỡng thì không chạy argon2, nên đường này cũng không thành chỗ đốt CPU.
- Không đụng `failed_login_count`, `locked_until`, `approval_pin_*`. T58-9 so các cột khóa và đếm của `app_user` (`status`, `failed_login_count`, `locked_until`, `lock_count_24h`, `approval_pin_*`) trước và sau.

### 1.2 Ngưỡng 5 lần, cửa sổ cố định: đúng

- `CALLER_PASSWORD_COMPARE_LIMIT = 5`, cửa sổ 24 giờ. `window_start` = `floor(now / 24 h)`, tức 00:00 UTC (07:00 giờ Việt Nam). `expires_at` = cuối cửa sổ. Khóa `wifi_pw_cmp:<user_id>`: chỉ mã luật và id, đúng điều kiện ngoại lệ RLS của 0086.
- Chỉ so (và đếm) khi mật khẩu qua kiểm dạng, khác chuỗi rỗng và khác mật khẩu đang lưu. Mạng mở hoặc chỉ đổi `ssid` thì không đếm (T58-13).
- Đủ 6 test bắt buộc ở `SEC-responses.md` 2.3: lần 6 bỏ qua, trả 200, có một audit; lần 7 không thêm audit; bộ đếm còn sau khi khởi động lại API; 422 giữ audit và bộ đếm sau rollback; khóa đăng nhập không đổi; mạng mở và đổi tên không đếm; không có chuỗi mật khẩu nào trong audit, log hay phản hồi (T58-5). Có thêm ca sang cửa sổ mới thì lại so, và ca theo người (bộ đếm OWN không đổi khi MGR so).
- Hằng `CALLER_PASSWORD_COMPARE_RULE = 'SR-RL-15'` là chỗ duy nhất ghi số luật. Audit chỉ có `after.rule`.

### 1.3 Không lộ giá trị: đạt

- `setPropertyWifi` trả `{ configured, ssid, passwordSet }`, không có `password` (T58-1, T58-11 so nguyên JSON).
- `getPropertyWifi` trả mật khẩu cho OWN, MGR, FDL, FD (S36). Đây là thiết kế của hợp đồng: lễ tân cần đọc cho khách. HK và các vai khác nhận 403 (rbac 11 ca mỗi thao tác).
- `Cache-Control: no-store` ở cả hai thao tác, gồm cả 422 (`problem(..., { headers: NO_STORE })`).
- 422 chỉ có `field`, `code`, `max`. Khi `ssid` trùng tên đăng nhập nhân viên, phản hồi không lặp lại tên đó (T58-9). Lỗi `zod` của `parseBody` đi qua `fieldErrors`, cũng chỉ có `field`, `code`.
- Audit `config` `property.wifi_changed`: `before.ssid`, `after.ssid`, `after.passwordChanged`. Thực thể `property` chỉ đăng ký `ssid`, `passwordChanged`, `rule`, nên khóa lạ bị bỏ ở serializer.
- T58-5 gom mọi dòng audit của tổ chức, mọi dòng log của request và mọi phản hồi lỗi (> 10), rồi kiểm không chứa mật khẩu Wi-Fi nào hay mật khẩu đăng nhập thử.
- Chỉ so với hash của người gọi (`SELECT password_hash FROM app_user WHERE id = ctx.userId`), không bao giờ với tài khoản khác, nên đường này không thành kênh dò mật khẩu người khác.

---

## 2. Các điểm khác đã kiểm

- **Phân quyền:** `x-roles` của hợp đồng qua guard, 403 trước khi đọc body. Không SSE. Ghi `UPDATE … WHERE id = $propertyId` dưới RLS `property`; đọc `FOR UPDATE` trong unit of work.
- **`wifiOf`:** chuyển nguyên văn từ `guest-portal.service.ts` sang `platform/public/property-wifi.ts`. Trang khách và Desk dùng chung một luật đọc, hành vi trang khách không đổi.
- **Kiểm `ssid`:** 1–32 byte UTF-8, không ký tự điều khiển. Không chứa số căn như một từ riêng. Không trùng tên đăng nhập nhân viên của cơ sở, kể cả tài khoản đã khóa hay đã thu vai (SEC ARC-04 (a)). Kiểm này cho OWN/MGR biết một tên đăng nhập có tồn tại hay không, nhưng hai vai này vốn đã xem được danh sách nhân viên, nên không thêm quyền gì.
- **Một câu UPSERT:** `public-booking.service.ts` nay gọi `bumpRateLimitCounter`; câu SQL chỉ còn ở `public-site/public/rate-limit-counter.ts`. Đúng điều SEC đặt ở `SEC-responses.md` 3.1 ("không chép câu SQL sang module thứ hai"). Việc chuyển ra `shared/` là quyết định cấu trúc của ARC; SEC không có điều kiện thêm ngoài mục 3.
- **Rủi ro còn lại đã chấp nhận ở SR-RL-15, ghi lại cho đủ:**
  - quá ngưỡng thì có thể lưu một mật khẩu Wi-Fi trùng mật khẩu đăng nhập; giá trị đó nằm ở `property` như mọi mật khẩu Wi-Fi;
  - chỗ giáp hai cửa sổ cho tới 10 lần so.
- **Info, không thẻ:** lần so bị bỏ qua không chạy argon2 nên trả nhanh hơn khoảng một lần verify. Người gọi đoán được mình đã quá ngưỡng. Thân phản hồi vẫn giống hệt. Người gọi vốn đếm được số lần mình gửi, nên việc này không lộ thêm gì.

---

## 3. Khi HEAD đổi (chuyển hàm UPSERT sang `shared/`)

SEC coi duyệt ở mục 0 áp cho HEAD mới nếu phần đổi so với `b790b09f` đạt cả 5 điểm sau. ARC hoặc ORC kiểm được bằng `git diff b790b09f..<HEAD mới>`:
1. Câu SQL giữ nguyên (`INSERT … ON CONFLICT (bucket_key, window_start) DO UPDATE SET count = rate_limit_counter.count + 1 RETURNING count`, `expires_at` = cuối cửa sổ) và chỉ có **một** bản, ở `shared/`. `public-site` và `identity` đều gọi hàm đó.
2. Trong `CallerPasswordMatch.check`, lời gọi đếm vẫn nằm trong giao dịch 1, trước khi đọc hash và trước argon2. Thứ tự 1 → 2 → 3 ở mục 1.1 không đổi.
3. Khóa vẫn là `wifi_pw_cmp:` + `user_id`; hàm dùng chung không tự ghép thêm gì vào khóa (không email, không tên).
4. Test T58-9, T58-11, T58-12, T58-13, test thứ tự ở `v5-58-caller-password-units.test.ts`, và test SR-RL-11 của trang công khai giữ nguyên và xanh.
5. Ngoài các tệp chuyển hàm và chỗ import, không đổi gì khác. Có đổi mã khác thì gửi lại SEC.

---

## 4. Thẻ

#### FB-R5-SEC-BE-V558-01
- Mức độ: Suggestion
- Người nhận: BE-D (PR sau, không cần trong #120); SEC sửa chữ SR-RL-15 nếu BE làm
- Vị trí: `platform/internal/property-wifi.controller.ts`, `setPropertyWifi` (phép so chạy cả khi `ssid` đã có lỗi; ca "both" ở T58-9)
- Vấn đề: phép so chạy cả khi field khác đã lỗi. Người cầm phiên OWN/MGR bị lộ có thể gửi `ssid` sai dạng hoặc trùng số căn kèm một mật khẩu đoán thử. Đoán sai: 422 chỉ có lỗi `ssid`, không ghi gì, không audit. Đoán đúng: thêm lỗi `password`. Như vậy 5 lần đoán/ngày không để lại dấu nào, trừ khi đoán trúng. Ở `SEC-responses.md` 2.1, SEC đã tính rằng mỗi lần đoán sai sẽ ghi đè Wi-Fi của khách và để lại audit `config`. Lối trên bỏ qua dấu vết đó.
- Vì sao quan trọng: ngưỡng 5 lần/ngày vẫn là lớp chặn chính, nên rủi ro thấp: mật khẩu đăng nhập ≥ 10 ký tự và đã lọc danh sách mật khẩu phổ biến. Đây chỉ là thêm dấu vết cho người kiểm audit.
- Đề xuất sửa: chỉ so khi mọi kiểm khác đã qua, tức `errors.length === 0` trước bước so. Khi đó mỗi lần đoán sai đều ghi Wi-Fi mới và audit `property.wifi_changed`. Cái giá cho người dùng thật: gõ trùng mật khẩu đăng nhập kèm `ssid` sai thì thấy hai lỗi lần lượt, không cùng lúc. Sửa ca "both" ở T58-9 thành hai bước. Nếu BE làm, SEC thêm vào SR-RL-15 câu "chỉ so khi mọi kiểm khác đã qua".
- Trạng thái: Open

#### FB-R5-SEC-BE-V558-02
- Mức độ: Suggestion
- Người nhận: BE-D (cùng commit chuyển hàm sang `shared/`)
- Vị trí: `identity/identity.module.ts` dòng 96, chú thích `// SR-RL-10 (V5-58): …`
- Vấn đề: số luật cũ. SR-RL-10 là bước 0 RAM của trang công khai; luật Wi-Fi là SR-RL-15 (`SEC-responses.md` 3.2). Mã và test khác đã dùng hằng `CALLER_PASSWORD_COMPARE_RULE`.
- Vì sao quan trọng: người sau tìm theo SR-RL-10 sẽ lạc sang luật trang công khai.
- Đề xuất sửa: đổi thành `SR-RL-15` hoặc dẫn `CALLER_PASSWORD_COMPARE_RULE`. Khi gộp `main`, nhánh nhận chữ hợp đồng 1f (#111), bỏ luôn chữ cũ "SEC SR-RL-10 … cùng nơi lưu với SR-RL-02" đang còn trên nhánh.
- Trạng thái: Open

---

## 5. Giới hạn

- SEC không chạy test, chỉ dựa vào CI của `b790b09f` và đọc mã.
- SEC không review phần Desk (FE-A: ô không `type="password"`, `autocomplete="off"`, bước xác nhận). Phần đó review ở PR FE.
- SEC không approve hay comment trên GitHub; ORC gộp.

---

Dòng đề xuất cho `01-decisions/decision-log.md` (ORC ghi):

`| 2026-11-07 | 5 | **SEC – review PR #120 (BE-D V5-58) @ b790b09f: DUYỆT** (rounds/round-05/reviews/SEC-on-be-pr-120-v5-58.md). SR-RL-15 đúng: đếm (UPSERT rate_limit_counter, khóa wifi_pw_cmp:<user_id>, cửa sổ cố định 24 h, 5 lần) và audit skipped commit ở giao dịch riêng trước argon2, audit trùng commit trước 422; quá ngưỡng bỏ qua phép so, không 429; không đụng khóa đăng nhập; PUT không trả password, no-store cả 422, audit chỉ ssid/passwordChanged/rule, T58-5 quét audit, log, phản hồi lỗi. Gộp main trước (chữ 1f của #111). HEAD mới do chuyển UPSERT sang shared/ được duyệt theo nếu đạt 5 điểm ở mục 3 (một câu SQL, thứ tự giữ nguyên, khóa chỉ id, test T58-9/11/12/13 và SR-RL-11 xanh, không đổi gì khác). Thẻ mới không chặn gộp: V558-01 (chỉ so khi mọi kiểm khác đã qua), V558-02 (chú thích SR-RL-10 → SR-RL-15). | SEC |`
