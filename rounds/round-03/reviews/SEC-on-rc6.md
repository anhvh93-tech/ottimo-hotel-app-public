# SEC xác nhận trên `v1.0.0-rc.6` = `8b3aec8` – điều kiện T1 của cổng QC v1.0 (SEC, 30/10/2026)

- Người ghi: SEC | Round 3 – bước **Review** | Theo `qc/v1-gate.md` mục 4.1, dòng **T1** (a), (b), (c).
- Bản kiểm: commit `8b3aec8` (`8b3aec89486f0f01…`, merge PR #14). So với `v1.0.0-rc.3` = `70fe734`, bản SEC kiểm lần trước trong `SEC-G7-5-production.md`.
- Cách làm (chỉ đọc):
  - `git diff 70fe734 8b3aec8`, đọc mã trên `8b3aec8`.
  - Tự trích allowlist audit ở cả hai commit bằng script riêng, không dùng số của QC.
  - Đọc log CI qua `gh run view`: push `40865799549` (job E2E `123423611323`, job publish `123431067238`) và T9 `40944110781` (job `123695686045`).
  - Đọc bản ghi của OPS (`outputs/OPS/j15-folio-close-check.md` 14.1).
- **Không** SSH, không đăng nhập production hay staging, không chạy ca test nào. Tệp này không ghi bí mật, IP, digest khóa hay dữ liệu khách.

## 1. Kết luận

| Ý | Nội dung | Kết quả |
|---|---|---|
| **1** | Phần chênh `70fe734..8b3aec8` (PR #14 và PR #13): không có trường nhạy cảm mới vào audit; không đổi đường xác thực; image production không có đường test-support | **Đạt** |
| **2** | Ca A.7 #16 (đồng hồ giả 2FA) trên `8b3aec8` | **Đạt – Verified.** US-143 / SR-AUTH-06 đủ 15/16 ca A.7. Ca 14 dời v1.1 (`SEC-sprint1.md` 3.6) |
| **3** | SEC-G1/G2 giữ nguyên trên rc.6 | **Đạt.** G1 **Đạt**. G2 vẫn **Đạt có điều kiện** như cũ: còn **L-1 đăng xuất** (D-INV-1, INV làm); ý 5 theo BUG-R3-032 / ESC-040; ý 6 làm ở ngày D |
| Thẻ mới | | 1 thẻ Minor (FB-R3-SEC-QA-01). Không có Critical, High hay Blocker. Không có ESC mới |

SEC **không chặn** việc gắn tag `v1.0.0` lên `8b3aec8`. Về phía SEC, T1 đã xong.

## 2. Ý 1 – Phần chênh rc.3 → rc.6

### 2.1 Phạm vi

`git diff --stat 70fe734 8b3aec8 -- product/services/api/src` cho thấy 53 tệp đổi. Toàn bộ thuộc hai việc:

- PR #13 (`d810561`, BUG-R3-037): J15 `folio.close` chạy trong worker.
- PR #14 (`6d78ec8`, BUG-R3-037/038/039): đưa allowlist audit vào `modules/<m>/audit-entities.ts`; gom ở `src/audit-entities.ts`; worker nối các listener `transitioned`.

Ngoài `src`, phần đổi gồm FE-A (Wi-Fi, in bill, đơn dài hạn, thẻ Folio), chữ giao diện, tài liệu, ảnh sổ tay và một script CI.

**Không đổi dòng nào** ở các phần sau. Lệnh `git diff --stat` trên các đường dẫn này trả về rỗng:

- `modules/crypto`, `shared` (gồm `http/auth.guard.ts`, guest session), `config.ts`, `main.ts`, `app.module.ts`, `bootstrap.ts`, `db`, `drizzle`;
- `modules/identity/internal`, `modules/guest-portal/internal`;
- `admin-web/src/session`, `admin-web/src/api`, `admin-web/src/pages/registration`, `guest-web/src/app`;
- `docs/api/openapi*.yaml`;
- toàn bộ `product/infra`, trừ `infra/ci/playwright-deps.sh`;
- `package.json` và lockfile, tức không có phụ thuộc mới.

### 2.2 Allowlist audit – SEC tự so, độc lập với QC

Script của SEC duyệt mọi tệp `.ts` trong `product/services/api/src` ở từng commit, kể cả `test-support/` và `identity/public/operator-reset.ts`. Script trích mọi lệnh `defineAuditEntity('<thực thể>', [...])` rồi gộp theo thực thể, đúng như `registry` hợp các lần gọi.

| | `70fe734` | `8b3aec8` |
|---|---|---|
| Cặp thực thể.trường | 243 | 243 |
| Có ở rc.3, không có ở rc.6 | – | 0 |
| Có ở rc.6, không có ở rc.3 | – | **0** |
| Thực thể | 32 | 32 |
| Lệnh `defineAuditEntity` không theo dạng chữ cố định (danh sách lấy từ biến) | 0 | 0 |

Kết quả khớp số 243/243 của QC.

- **Rà tên trường nhạy cảm trên `8b3aec8`.** SEC tìm các mẫu CCCD, hộ chiếu, `docNumber`, `password`, `hash`, `secret`, `totp`, `otp`, `seed`, `recovery`, số tài khoản, thẻ, `token`, ngày sinh, điện thoại, email, địa chỉ, quốc tịch, ảnh. Chỉ thấy 7 trường, và cả 7 đều **đã có từ rc.3**:
  - `app_user.passwordReset`: cờ;
  - `app_user.recoveryCodesRemaining`: số đếm;
  - `approval_request.accountNoLast4`: 4 số cuối, đã chấp nhận từ R2;
  - `registration.imagesPurgeReason`: lý do;
  - `reservation.cardsIssued`: số thẻ cửa đã giao;
  - `room.baseOccupancy`, `room.maxOccupancy`.

  Không trường nào chứa giá trị giấy tờ, mật khẩu, bí mật TOTP, mã khôi phục hay số tài khoản đầy đủ.
- **Lớp chặn cuối không đổi.** Regex `FORBIDDEN` trong `audit/public/audit-fields.ts` (`_enc|Enc|password|secret|token|pin|docNumber|cardNumber|pan`) vẫn y nguyên. Phần thêm duy nhất là hàm `auditEntitySnapshot()`. Hàm này chỉ đọc registry, và chỉ `test/helpers/worker-only-child.ts` gọi nó. Không endpoint nào gọi hàm này.
- **Đổi về hành vi theo tiến trình (không làm lộ thêm dữ liệu).** Trước rc.6, worker và 2 CLI quản trị chỉ có một phần registry. Khi gặp thực thể chưa đăng ký, chúng **ném lỗi**, không ghi gì. Nay chúng có đúng registry của api. `test/worker-audit-registry.test.ts` kiểm hai điều: worker bằng api, và mọi `modules/*/audit-entities.ts` đều được import. Nghĩa là worker/CLI ghi **đúng các trường api đã được phép ghi**, không hơn.

  Thay đổi thấy được duy nhất nằm ở CLI `production-bootstrap`. Audit `production.bootstrapped` nay giữ thêm `rooms` và `channels`. Đây là **số đếm**: `after: { users: 1, parameters: N, rooms: N, channels, devices: 0 }`. B2 đã chạy CLI này trước rc.6, nên production không bị ảnh hưởng.
- **Allowlist `rate_limit` của test-support** đã chuyển sang `test-support/audit-entities.ts`. Tệp này chỉ được `test-support.module.ts` import. `src/audit-entities.ts` cố ý không liệt kê nó. Lệnh `git grep "test-support"` trên `src` (bỏ thư mục `test-support/`) chỉ ra chú thích và lệnh `require('./test-support')` đã có sẵn trong `main.ts`. Lệnh đó vẫn chỉ chạy khi `config.testSupport.enabled && appEnv !== 'production'`, và **không đổi**.

### 2.3 Đường test-support trong image production

| Kiểm | Bằng chứng | Kết quả |
|---|---|---|
| Dockerfile xóa `dist/test-support` khi `INCLUDE_TEST_SUPPORT=0` | Job E2E `40865799549`, bước build: `RUN if [ "0" != "1" ]; then rm -rf services/api/dist/test-support; fi` | Đạt |
| Kiểm bundle của image production (`check-no-test-surface.sh bundle`) | Job E2E: `OK: no test-only code in: …/api-bundle/dist …/ottimo-packages`. Job publish: `OK: no test-only code in: …/b/dist`. Đây là chính image `ottimo-api:sha-8b3aec89486f` được đẩy lên GHCR. Biến thể `-test` có tag riêng | Đạt |
| Production chạy image không có hậu tố `-test` | OPS 14.1 (30/10 07:54): api và worker là `ottimo-api:sha-8b3aec89486f`. `deploy.sh` (không đổi) từ chối `INCLUDE_TEST_SUPPORT≠0`, `API_TAG_SUFFIX` khác rỗng và tag `*-test` | Đạt (SEC đọc bản ghi OPS, không SSH) |
| Hợp đồng production không có `/__test__` | Job `no test endpoints in production contract` xanh trên `40865799549`; `openapi.yaml` không đổi | Đạt |

### 2.4 Nối listener trong worker (B-13, K11) và guest access port

- `worker-jobs.ts` dùng **một** `ReservationHooks` chung. Ba listener `transitioned` được nối bằng **đúng hàm** mà module api dùng:
  - `wireRegistrationReservationHooks`: K11, hồ sơ khai báo tự hủy và xóa ảnh ngay;
  - `wireCancelRevocation`: B-13, thu hồi mọi link và phiên khách của đơn;
  - `wireNoShowNotices`.

  Logic trong `cancel-revocation.ts` và `reservation-hook-wiring.ts` là phần trích ra từ `frontdesk.module.ts` và `registration.module.ts`. Điều kiện và lý do thu hồi giữ nguyên.
- **Về bảo mật, đây là thay đổi có lợi.** Đến rc.5, J1 `hold.expire` hủy đơn trong worker mà không thu hồi link khách và không hủy hồ sơ khai báo. Trên production rc.3 không có đơn nào (`reservation` = 0, `SEC-G7-5` mục 2 và OPS 14.1), nên khoảng hở này chưa gây hậu quả. Test `r3-worker-only-jobs.test.ts` (d) chạy J1 trong tiến trình chỉ có worker và kiểm: `guest_access_token.revoked_at` có giá trị, `revoked_reason = 'cancelled'`, `registration.status = 'void'`.
- `guestAccessPortForWorker` dựng `GuestPortalService` từ `RegistrationService` của worker. Đó cũng là class mà `GuestPortalModule` gắn trong api. Port không mở endpoint nào.
- **J15 trong worker (PR #13):**
  - Worker dựng `RefundsService` với `RefundAccountCipherAdapter` và `C3AccessGate`. Worker đã có khóa mã hóa từ trước, vì J16 dùng `cryptoServiceFromEnv`, nên **không thêm bí mật mới** cho tiến trình worker.
  - J15 chỉ động tới yêu cầu `refund`: hủy tự động, hoặc nộp lại yêu cầu thay thế qua routing duyệt của folio, với người duyệt khác người tạo (A32). Khi một yêu cầu bị hủy thì số tài khoản của nó bị xóa (SEC-BE-45).
  - J15 không tự duyệt và không chi tiền. Các port quầy khác trong worker (`NoGuestAccessPort`, `UnwiredRegistrationPort`…) giữ mặc định từ chối.
- `identity`, `files`, `registration`, `payments`, `approvals` chỉ có thay đổi kiểu chuyển chỗ: `defineAuditEntity` và cách nối hook. Không đổi điều kiện xác thực, phân quyền hay mã hóa.

### 2.5 Phần còn lại của diff

- `infra/ci/playwright-deps.sh` chỉ chạy trên runner GitHub. Script dùng `sudo` của runner để đổi mirror apt sang `archive.ubuntu.com` (mirror chính thức của Ubuntu), không có bí mật và không vào image. Chấp nhận.
- FE-A: SEC rà phần thêm của diff tìm `dangerouslySetInnerHTML`, `innerHTML`, `localStorage`, `sessionStorage`, `eval`, `window.open`, `console.*`, số tài khoản, số giấy tờ, mật khẩu: **0** ở mã chạy thật. Chỉ có `mock-wifi-pass` trong test. Chữ mới `gw.wifi_ask_desk` không lộ thông tin.
- Ảnh sổ tay `product/docs/manual/img/*` và ảnh `esc031-shots` (đã che tên) vào repo trong khoảng này. Phần này thuộc quy tắc ảnh của QA (`qa/manual-check.md`). Các ảnh không nằm trong image, và **SEC không kiểm lại ảnh trong T1**.

## 3. Ý 2 – Ca A.7 #16 (đồng hồ giả): **Verified**

Định nghĩa ca 16 ở `outputs/SEC/s1-security-requirements.md` A.7 #16: E2E admin-web gồm đăng ký, đăng nhập 2 bước, mã khôi phục, màn hạn chế, **có ca đồng hồ giả**.

| Phần | Bằng chứng | Kết quả |
|---|---|---|
| Ca gốc (giờ thật) `ui/mfa-us143.r3s1.spec.ts:40` | `40865799549`: ✓ (#1811). T9 `40944110781`: ✓ | Đạt |
| Ca đồng hồ giả `ui-clock/mfa-us143-clock.r3s1.spec.ts:101` | `40865799549` (`headSha` = `8b3aec89486f…`, event push): ✓ (#2055, `[desk-clock]`, chạy thật, không bị bỏ qua). T9 `40944110781` (`headSha` `0b08b9e`; `git diff --stat 8b3aec8 0b08b9e -- product .github` rỗng, tức mã giống hệt): ✓ | Đạt |
| Ca có kiểm đúng điều SEC cần không | SEC đọc tệp trên `8b3aec8`. Tệp không đổi từ `5c2f5b6`. Đồng hồ stack (MutableClock) và đồng hồ trình duyệt (`page.clock`) được đặt cùng nhau. Ca kiểm: **06.17**: `mfaToken` ở 4:59 vào được, ở 5:00 nhận 401 dù mã đúng, rồi Desk về bước mật khẩu. **06.18**: bước −2 và +2 nhận 401, bước +1 và −1 được nhận. **06.19**: phát lại mã bước −1 vừa dùng nhận 401, bước 0 chưa dùng được nhận. **06.20**: lần từ chối nào cũng cùng câu `MFA_INVALID`. **06.22**: bí mật và mã chỉ nằm trong bộ nhớ ca, không in | Đạt |
| CI không thể xanh khi thiếu ca này | `ci.yml` có bước junit báo `::error::no ui-clock/ test case in junit report`. Log `40865799549`: `UI: 133 case(s), 16 allowed skip(s)`; job xanh | Đạt |

**SEC ghi Verified ca A.7 #16.** Dòng "Ca A.7 #16 đồng hồ giả – Đang làm" ở `SEC-sprint1.md` 4.4 nay **hết hiệu lực**. G2-2 của QC đủ dòng SEC.

Phần `MFA_ENFORCED=true` với OWN/MGR chưa đăng ký **không** nằm trong ca này. Ca này dùng tài khoản lễ tân trưởng tự bật 2FA trên stack có cờ tắt. Phần cờ bật đã được kiểm ở QA rc.1 trên staging (`qa3-rc1.md` mục 3) và trên production (SEC-G2 ý 2–3).

**Ghi nhận khi đọc log:** ca API `api/mfa-s2.r3s1.api.spec.ts:230` (S1-SEC-16, ARC 12.3) **flaky ở cả hai lượt** (`40865799549` và T9). Lần đầu, bước "mã khôi phục của bộ cũ bị từ chối" nhận **429** thay vì 401. Lần chạy lại thì đạt. Nguyên nhân là giới hạn 20 lần đăng nhập/IP của stack CI, QA đã ghi ở `bug-list.md` dòng 490. Về sản phẩm, mã cũ vẫn bị từ chối (429 cũng là từ chối), nên **không phải lỗi bảo mật**. Vấn đề là kết luận "bộ mã cũ đã chết" hiện chỉ đứng được nhờ lần chạy lại → FB-R3-SEC-QA-01 (Minor).

## 4. Ý 3 – SEC-G1/G2 trên rc.6

| Cổng / ý | Căn cứ trên rc.6 | Kết quả |
|---|---|---|
| **SEC-G1** (BE-53, FE-07, S4-39) | Mã G1 nằm ở `registration`, `crypto`, `files`, `admin-web/src/pages/registration`. Ở rc.6, `registration` và `files` chỉ đổi kiểu chuyển chỗ (mục 2.2, 2.4). `crypto` và `pages/registration` không đổi. Tham số lưu giữ (30 ngày / 7 ngày / 3 tháng) là dữ liệu DB, deploy không ghi lại (OPS 14.1: không có migration mới, 65 mục). Production vẫn 0 khách | **Đạt (giữ)** |
| G2 1a – cookie `__Host-`, `Secure`, `HttpOnly`, `SameSite` | `docker-compose.prod.yml` (cố định `COOKIE_SECURE_PREFIX: 'true'`), `config.ts`, `session.service` không đổi. `config.ts` dừng khởi động ở production nếu giá trị sai, mà api đang `healthy` sau deploy 07:51 | **Đạt (giữ)** |
| G2 1b – đăng xuất thu hồi phiên | Mã đăng xuất (`identity/internal`, `admin-web/src/session`) không đổi. Ý này vẫn **chưa từng chạy** trên production | **Chờ L-1 (D-INV-1)**, như cũ |
| G2 2 – `MFA_ENFORCED=true` | Căn cứ ở `SEC-G7-5` là "container không khởi động lại từ 27/10". Căn cứ này **không còn dùng được**, vì api được tạo lại lúc 07:51 30/10. Ý này vẫn đạt nhờ chốt chặn trong mã (không đổi): `config.ts:355` ném `MFA_ENFORCED must be true in production (SR-AUTH-06)`, nên api ở production **không thể khởi động** khi cờ khác `true`. OPS 14.1: api `healthy`, `RestartCount` 0. Kết luận này không cần `printenv` mới | **Đạt (giữ)** |
| G2 3 – OWN mới buộc đổi mật khẩu rồi đăng ký 2 bước | Dữ liệu trên DB không bị deploy đụng tới. Guard 06.4 (`shared/http/auth.guard.ts`) không đổi | **Đạt (giữ)** |
| G2 4 – log Caddy che IP /24, bỏ query | `Caddyfile.prod` và `docker-compose.prod.yml` không đổi trong repo. OPS 14.1: `ops-check` 7/7, 4 host trả 200 sau deploy. SEC chưa so lại sha256 tệp trên máy chủ, vì T1 không cho SSH | **Đạt (giữ)**. Lần đọc log tiếp theo (D-T6) nên đếm lại `remote_ip` đã che |
| G2 5 – thư `receiving_account_changed` | Không đổi: BUG-R3-032 (P1), biện pháp bù B1–B6, ESC-040 chờ INV | **Chưa đạt, đã có quyết định** (như cũ) |
| G2 6 – C3 và `c3_access_log` khi xem ảnh | Làm ở ngày D với giấy tờ thật đầu tiên | Ngày D (như cũ) |
| Hạ tầng G2 (edge, cổng, `ufw`, `sshd`, vai DB) | Release rc.6 không đụng edge hay cấu hình máy (infra repo không đổi; OPS 14.1 không nêu). FB-R3-SEC-OPS-06 (`fail2ban`, P3) vẫn Open | **Giữ** |

## 5. Thẻ mới

### FB-R3-SEC-QA-01
- Mức độ: Minor (không phải lỗi sản phẩm; rủi ro SEC Low)
- Vị trí: `product/tests/e2e/api/mfa-s2.r3s1.api.spec.ts:230–311` (S1-SEC-16 API + ARC 12.3 #1–#3), bước `oldRecovery`
- Vấn đề: Ở CI push `40865799549` và T9 `40944110781`, cả hai lượt đều **flaky**. Lần đầu `expect(oldRecovery.status).toBe(401)` nhận **429**, vì vượt giới hạn đăng nhập theo IP của stack CI (QA đã biết, `bug-list.md` dòng 490). Lần chạy lại thì đạt. Kết quả T9 có ghi "0 masked by retry", nhưng thực tế khẳng định "mã khôi phục của bộ cũ đã chết sau khi đăng ký lại" (ARC 12.3 #2, SEC A.7 #8) đang **chỉ được chứng minh ở lần chạy lại**.
- Vì sao quan trọng: nếu một ngày bản sửa làm mã cũ còn dùng được, lần đầu vẫn có thể ra 429 và che lỗi, lần chạy lại lại gặp cùng giới hạn IP. Khi đó CI có thể đỏ hoặc xanh tùy thứ tự chạy, không cho kết luận chắc chắn về một ca bảo mật quan trọng. Ca flaky lặp lại mỗi đêm cũng làm người đọc quen bỏ qua cảnh báo.
- Đề xuất sửa: trước bước `oldTotp` / `oldRecovery`, gọi endpoint test-support xóa cửa sổ giới hạn (`rate_limit` reset theo `usernamePrefix` `qa.*`, đã có từ BUG-R2-051), hoặc tách ca này sang project chạy tuần tự `[limits]`. Thêm một dòng: nếu nhận 429 thì đánh `fail` với thông báo rõ, không để chạy lại. Hạn: v1.0.x. **Không chặn tag `v1.0.0`.**
- Trạng thái: Open

## 6. Dòng đề xuất cho decision-log (ORC ghi; SEC không commit)

> 30/10 – SEC – T1 cổng v1.0 trên `8b3aec8` (`reviews/SEC-on-rc6.md`): (a) diff `70fe734..8b3aec8` ở identity/registration/files/audit/payments/approvals chỉ chuyển allowlist và nối hook. Allowlist audit SEC tự so: 243/243, 0 trường mới, không trường giấy tờ, mật khẩu, TOTP hay số tài khoản đầy đủ. Đường xác thực không đổi. Image production `sha-8b3aec89486f` không có test-support (CI bundle check OK ở job E2E và job publish). (b) Ca A.7 #16 đồng hồ giả **Verified** (CI `40865799549` + T9 `40944110781`), US-143/SR-AUTH-06 đủ 15/16, ca 14 dời v1.1. (c) SEC-G1 Đạt, SEC-G2 Đạt có điều kiện L-1 (D-INV-1) như cũ. Thẻ mới: FB-R3-SEC-QA-01 (Minor). SEC không chặn tag `v1.0.0`.

QC yêu cầu thêm "mục ngắn trong `SEC-G7-5-production.md`". Tệp này thay cho mục đó. Nếu QC vẫn cần, ORC thêm vào `SEC-G7-5` một dòng trỏ tới tệp này.

## 7. Giả định

- Thông tin "production chạy `sha-8b3aec89486f`, api `healthy`, `RestartCount` 0, không migration mới" lấy từ bản ghi OPS 14.1. SEC không SSH để tự kiểm, theo phạm vi T1.
- T9 `40944110781` chạy trên `0b08b9e`, khác `8b3aec8` chỉ ở tài liệu. SEC đã kiểm: `git diff --stat 8b3aec8 0b08b9e -- product .github` rỗng.
- Phần "không đổi dòng nào" ở mục 2.1 và mục 4 dựa trên `git diff` của repo, không so sha256 tệp trên máy chủ.

## 8. Điểm làm tốt

- PR #14 không chỉ vá J15/J24. Nó còn đặt một test bất biến (`worker-audit-registry.test.ts`): tiến trình worker phải có đúng registry của api, và không `*.module.ts` nào được tự gọi `defineAuditEntity`. Nhờ đó lỗi cùng loại khó quay lại.
- Logic thu hồi link khách (B-13) và hủy hồ sơ khai báo (K11) chỉ còn **một hàm** dùng chung cho api và worker, có test chạy trong tiến trình chỉ có worker. Điều này đóng một khoảng hở bảo mật có thật, trước khi production có khách.
- Ca đồng hồ giả #16 đặt cùng lúc đồng hồ server và đồng hồ trình duyệt, kiểm đúng mốc biên 4:59 / 5:00 và chống phát lại. Bí mật không ra khỏi bộ nhớ ca.
