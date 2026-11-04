# SEC review – PR #78, sửa seed/smoke demo P-1…P-5 (`v104/ops-demo-seed-fixes`)

- Người review: SEC | Round 4, đợt v1.0.4, bước **Review chéo** | 05/11/2026
- Đối tượng: PR #78 @ **`b62995a9`**, cắt từ `476fd9b8`, gồm 4 commit `55552db6`, `210407cd`, `d4e35bd4`, `b62995a9`. SEC đọc `gh pr diff 78` và mục 7 của `rounds/round-04/outputs/OPS/bug-r4-039-demo-impact.md` trên nhánh PR.
  - Tệp đổi: `product/infra/demo/lib.sh`, `seed-demo.mjs`, `smoke-demo.mjs`, và tệp OPS ở trên. Không đổi mã sản phẩm, không đổi migration, không đổi cấu hình.
  - Đọc thêm để đối chiếu:
    - cổng hiệu lực: `services/api/src/modules/platform/internal/parameters.service.ts` (`set`);
    - guard môi trường: `services/api/src/config.ts`, `services/api/src/db/startup-checks.ts`, `infra/server/bin/deploy.sh`, `infra/server/env.example`, `infra/server/env.production.example`;
    - Origin, phiên, lỗi: `shared/http/auth.guard.ts`, `platform/public/validation.ts`, `shared/secret-fields.ts`;
    - stack demo: `infra/demo/demo-up.sh`, `infra/demo/docker-compose.demo.yml`, `infra/ci/make-ci-env.sh`, `tests/fixtures/seed/ds-e.json`;
    - harness E2E để so cách làm: `tests/e2e/support/api.ts` (`seedReauthFor`), `tests/e2e/support/s3-stay.ts` (`ensureReceivingAccount`).
- Giới hạn: chỉ đọc mã. Không chạy stack, không chạy test, không sửa mã, không push, không gộp. Số liệu chạy thật (audit `stepup.*`, 13/13 `qa.*` tắt) là bằng chứng của OPS. SEC đối chiếu bằng cách đọc mã, không chạy lại.

## 0. Kết luận

**ĐẠT, rủi ro Low. SEC chấp nhận P-3** (mục 1). Không có Blocker hay Major. Có 2 Minor (thẻ 01, 02) và 2 Suggestion (thẻ 03, 04). Cả bốn thẻ không chặn gộp và dời được sang v1.0.5.

Ngoài phạm vi SEC, ghi để ORC biết:
- Ở head `b62995a9`, CI run `41879577846` đỏ job "Format · lint · audit · test · build". Nguyên nhân là 2 ca trong `admin-web` `v104-holds-feb.test.tsx`, PR này không đụng tới. Đây là 2 ca chạy ban đêm mà #76 (`7f0ef3fb`) đã sửa trên main. Nhánh cắt trước #76, nên cần `gh pr update-branch` và chờ CI xanh trước khi gộp.
- Job `gitleaks` xanh ở đúng head này.

## 1. P-3: quyết định của SEC

**Chấp nhận.** Lên lịch tài khoản nhận VietQR ở pha 1, khi đồng hồ giả đang ở D−35, với `effectiveFrom` = D.

Vì sao chấp nhận:
- **Cổng máy chủ không đổi.** `parameters.service.ts` `set()` vẫn trả 422 `EFFECTIVE_FROM_TOMORROW` khi `effectiveFrom <= pc.today`. `pc.today` lấy theo đồng hồ của máy chủ. Script đi đúng đường "từ ngày kinh doanh sau", có S2: OWN demo gửi mật khẩu của chính mình. Không có cờ bỏ qua, không gọi endpoint kiểm thử nào để ghi tham số.
- **Kết quả "có hiệu lực ngay" chỉ có được khi máy chủ có đồng hồ giả.** Muốn vậy cần đủ 4 thứ: `CLOCK_MODE=mutable`, image có test support, `INCLUDE_TEST_SUPPORT=1` và `TEST_SUPPORT_TOKEN`. Production bị chặn ở mục 2.1.
- **Mục đích của SEC Q51-5 không bị ảnh hưởng.** Q51-5 đặt ra để người cầm phiên OWN bị lộ, hoặc OWN bị ép, không đổi được nơi nhận tiền ngay trong ngày. Chủ nhà có một ngày để thấy thư báo và hủy. Trong demo thì khác:
  - DB mới tinh, dựng trên máy của chủ đầu tư;
  - giá trị lấy từ tệp riêng của chủ đầu tư (`product/.env`);
  - lúc dựng chưa ai khác có phiên.

  Vì vậy cửa sổ một ngày không bảo vệ được gì trong demo.
- **Cách làm giống harness E2E** (`ensureReceivingAccount`: lùi đồng hồ về D−1 rồi ghi dòng từ D). Harness đó cũng tự bỏ qua bước này khi đích không có test support (BUG-R3-015).

Hệ quả SEC chấp nhận: trong demo, tài khoản nhận có hiệu lực ngay ngày dựng. Bản thật thì từ ngày kinh doanh sau mới có hiệu lực. Thẻ 03 đề nghị ghi rõ điều này cho chủ đầu tư.

## 2. Năm câu ORC hỏi

### 2.1 Lối tắt qua cổng S2 hoặc cổng hiệu lực có lọt sang staging/production không: **Không**

**Phía máy chủ (chặn chính):**

| Cần có | Production | Staging |
|---|---|---|
| Đồng hồ giả | `config.ts` dừng khởi động: "CLOCK_MODE must be system in production". `startup-checks.ts` `assertProductionClock` từ chối khi `dev_clock` có dòng. `deploy.sh` dòng 90 chặn ở bước `config` | Mặc định `CLOCK_MODE=system`. Chỉ đổi sang `mutable` khi OPS bật cho QA (`env.example` dòng 11–13) |
| Endpoint `/__test__/*` | `config.ts` từ chối `INCLUDE_TEST_SUPPORT=1` và từ chối `TEST_SUPPORT_TOKEN` khác rỗng. Image mặc định không có thư mục test support. `deploy.sh` dòng 91–94 chặn tag/suffix `-test`. Job CI "no test endpoints in production contract" xanh | Chỉ có khi đủ: image `-test`, `INCLUDE_TEST_SUPPORT=1`, token, và IP nằm trong `TEST_SUPPORT_ALLOW_IPS` của Caddy (mặc định `127.0.0.1/32`) |
| S2 chỉ bằng mật khẩu | `MFA_ENFORCED=true` là bắt buộc (`config.ts` dòng 355). OWN phải có 2FA, nên mật khẩu một mình không qua S2 | Như cấu hình hiện có. PR không đổi |

PR không sửa tệp nào ở trên. Lối "lên lịch khi đồng hồ còn ở quá khứ" không tồn tại ở production. Ở staging, lối này chỉ có khi OPS đã bật chế độ kiểm thử. Khi đó mọi luật theo ngày đều tua được, và đó là tính chất có sẵn của staging chế độ kiểm thử, không do PR này mở.

**Phía script: không có chặn đích tường minh (thẻ 01).** `DEMO_API_URL` ghi đè được:
- `lib.sh` dòng 22: `export DEMO_API_URL="${DEMO_API_URL:-…}"`;
- `seed-demo.mjs` dòng 19 và `smoke-demo.mjs` dòng 13: `process.env.DEMO_API_URL ?? …`.

SEC suy ra từ đọc mã (chưa thử) chuyện gì xảy ra nếu biến này trỏ tới staging hoặc production:
- Lệnh đầu tiên là `POST /v1/auth/login` của `qa.owner`, với Origin `http://localhost:8181`. `auth.guard.ts` kiểm Origin cả ở operation công khai như đăng nhập, nên trả 403 "Origin not allowed". Production còn không có `qa.*`, vì `seed-cli` từ chối `APP_ENV=production`. Staging có `qa.*` nhưng mật khẩu khác.
- Giả sử vẫn đăng nhập được thì vẫn hỏng: staging/production dùng cookie `__Host-ottimo_sid` (`COOKIE_SECURE_PREFIX=false` chỉ cho dev/test), còn script gửi `ottimo_sid`. `/__test__/clock` cũng bị Caddy chặn.
- `must()` ném lỗi ngay ở bước 1. Script dừng trước `createUser`, trước khi gửi `TEST_SUPPORT_TOKEN` (chỉ gửi sau khi đăng nhập được) và trước khi đọc tài khoản nhận.
- Thứ duy nhất rời máy là `QA_SEED_PASSWORD` của stack demo. Giá trị này là 48 ký tự hex ngẫu nhiên, sinh mỗi lần build bằng `make-ci-env.sh`, và chỉ dùng được trên stack dùng một lần ở máy chủ đầu tư. Với smoke thì là 8 mật khẩu demo trong `state.json`, cũng chỉ dùng được ở máy đó.
- Pha `now` và smoke cần state của pha 1. Các tài khoản trong state không tồn tại ở nơi khác.
- `dc()` chỉ điều khiển docker trên máy, project `ottimo-demo`.

### 2.2 Mật khẩu, khóa, số tài khoản; có log bí mật không: **Sạch**

- Trong diff không có giá trị bí mật viết cứng. SEC quét tay 273 dòng thêm, tìm chuỗi dài, dãy số ≥ 8 chữ số và từ khóa. Kết quả:
  - dãy số duy nhất là mã run CI `41865436564`;
  - từ khóa `password`/`secret` chỉ là tên trường hoặc `process.env`/`st.accounts`.
- Nguồn giá trị:
  - `QA_SEED_PASSWORD` và `TEST_SUPPORT_TOKEN`: ngẫu nhiên mỗi lần build (`make-ci-env.sh`), nằm trong `~/.ottimo-demo/demo.env` quyền 0600;
  - mật khẩu 8 vai demo: `password()` dùng `crypto`;
  - tài khoản nhận: `product/.env` của chủ đầu tư, đã gitignore (`.env`). Ở lượt chạy chứng minh, OPS dùng `TEST_RECEIVING_ACCOUNT` có sẵn trong repo (`0123456789` / `OTTIMO TEST`, giả) và không đọc `product/.env`.
- Log mới chỉ in những thứ sau, không in giá trị nào:
  - mã HTTP và `code`;
  - `field code` của lỗi;
  - ngày hiệu lực;
  - username `qa.*`;
  - số tiền và mã đơn của dữ liệu giả.

  `must()` in tối đa 600 ký tự thân lỗi. Thân lỗi chỉ có `field` + `code` (`validation.ts` dòng 38) và không lặp lại dữ liệu gửi lên.
- `state.json` chỉ giữ trạng thái `set` / `missing` / `failed <mã>` của tài khoản nhận. `demo-accounts.md` (0600) không ghi số tài khoản.
- Phía máy chủ: `password`, `secret` và `accountNo` ở mọi tầng đều nằm trong `SECRET_BODY_FIELDS`. Nhờ vậy chúng không vào hash idempotency và bị che trong log (`createUser` và `updateUser` của script đều gửi `Idempotency-Key`).
- `lib.sh` vẫn truyền bí mật qua biến môi trường, không qua tham số dòng lệnh. Không đổi so với trước.
- Pha 1 giờ đọc `product/.env` (`DEMO_ENV_FILE`), pha 2 thì thôi đọc. Pha 1 có endpoint kiểm thử, nhưng chạy chung DB và chung máy với pha 2, và chỉ sống vài phút. Mức lộ không tăng, và bớt được một chỗ đọc tệp.

### 2.3 `MFA_ENFORCED=false` chỉ ở demo: **Đúng, PR không đụng cấu hình**

- Diff không sửa tệp cấu hình nào. Giá trị `false` của demo đi theo đường: `.env.example` dòng 57 (mặc định dev/CI) → `make-ci-env.sh` → `demo.env`. `APP_ENV=dev`.
- Các chốt sẵn có ngăn giá trị này lọt sang production:
  - `config.ts` dòng 355 dừng khởi động;
  - `deploy.sh` dòng 89;
  - `check-compose.sh` dòng 143 kiểm `env.production.example`, và `test-deploy-from-ci.sh` dòng 164 có test cho guard này;
  - `production-bootstrap-cli.ts` dòng 95;
  - `staging-add-owner.mjs` dòng 34.
- Script **đóng khi lỗi**. Nếu một ngày stack demo chạy `MFA_ENFORCED=true`, OWN demo chưa có 2FA sẽ chỉ có phiên hạn chế (403 `MFA_ENROLLMENT_REQUIRED`), và `must()` sẽ dừng. Script không có nhánh nào hạ cờ.
- Mẫu staging (`infra/server/env.example`) vẫn để `MFA_ENFORCED=false`, kèm ghi chú "đặt true trước dữ liệu thật". Điều này có từ trước, không thuộc PR này.

### 2.4 `qa.*` có bị tắt hết không: **Có, khi pha 2 chạy xong (xem thẻ 02 và 04)**

- DS-E có 13 tài khoản `qa.*`: 12 `active` và `qa.locked` ở trạng thái `locked`. Script lọc `status !== 'disabled'`, nên `locked` cũng bị tắt.
- Mỗi `PATCH` phải trả 200 (`must`), nếu không thì dừng. Sau vòng tắt, script đọc lại danh sách và ném lỗi nếu còn tài khoản bật. Lượt chạy của OPS cho kết quả 13/13 `disabled` và 13 `stepup.s2_granted` cho `updateUser`.
- Bằng chứng S2 gắn đúng người gọi:
  - `createUser` do `qa.owner` gọi, kèm mật khẩu của `qa.owner`;
  - `updateUser` và `setParameter` do `chunha` gọi, kèm mật khẩu của `chunha`.

  Không dùng chung mật khẩu, không có cờ bỏ qua.
- `listUsers` chỉ trả tài khoản của cơ sở đang chọn. DS-E chỉ có 1 cơ sở, nên mọi `qa.*` đều hiện ra.
- Còn hai chỗ hở: khung thời gian trước khi tắt (thẻ 02) và chỉ đọc trang đầu (thẻ 04).

### 2.5 Regex SEC và gitleaks: **Sạch**

- Migration: `git diff 476fd9b8...b62995a9 -- '**/migrations/*.sql'` không có tệp nào, regex SEC (`SEC-on-v104-ops-scripts.md` mục 5.2 (a)) khớp 0 dòng.
- Quét cả diff, bỏ dòng chú thích: khớp 1 dòng, là nhiễu. Đó là `stepup.s2_granted` trong bảng của tệp OPS, khớp `GRANT`.
- gitleaks: máy này không cài. Job CI `gitleaks` xanh ở run `41879577846`, sự kiện `pull_request`, `headSha` = `b62995a9`.

## 3. Điểm khác SEC đã xem (không có thẻ)

- Smoke P-4 không tự xin quyền. Nếu đêm ngày đi không bán được, script báo FAIL "cần OWN/MGR xác nhận" và dừng, không thử đường duyệt. Số tiền của VietQR lấy từ máy chủ (`amountDueAtCheckoutVnd`).
- P-5: `roomId` và `periodId` lấy từ `getMinibarStandard`, không tự đoán.
- `createUser` gửi `reauth: { password }` theo `StrongReauth`. `setParameter` giữ dạng `{ authMethod: 'password', secret }` như contract của operation đó. Cả hai dạng đều đã qua thật ở lượt chạy của OPS (`stepup.s2_failed` = 0).

## 4. Thẻ feedback

### FB-R4-SEC-OPS-PR78-01
- Mức độ: Minor
- Vị trí: `product/infra/demo/seed-demo.mjs` dòng 19, `product/infra/demo/smoke-demo.mjs` dòng 13, `product/infra/demo/lib.sh` dòng 22.
- Vấn đề: Hai script không tự kiểm đích. `DEMO_API_URL` lấy từ môi trường, và `lib.sh` giữ giá trị có sẵn trong shell. Hiện việc chặn dựa vào guard máy chủ (mục 2.1) và vào hai chỗ lệch ngẫu nhiên (Origin `localhost`, cookie không có `__Host-`). Nếu shell còn `DEMO_API_URL` trỏ chỗ khác, lệnh đầu tiên vẫn gửi `QA_SEED_PASSWORD` đi, có thể qua `http`. Smoke thì gửi 8 mật khẩu demo.
- Vì sao quan trọng: Đây là lớp phòng thủ thêm. Script cầm bằng chứng S2 và, ở pha 1, cầm số tài khoản thật của chủ đầu tư. Nên dừng trước khi có bất kỳ thông tin đăng nhập nào rời máy, thay vì trông vào chỗ lệch ngẫu nhiên.
- Đề xuất sửa:
  1. Đầu cả hai `.mjs`, lấy `new URL(API).hostname` và cho chạy chỉ khi nó thuộc `127.0.0.1`, `localhost`, `::1` hoặc `[::1]` (cổng nào cũng được, để wrapper chứng minh của OPS dùng cổng 3414 vẫn chạy). Ngoài danh sách đó thì in một câu và `process.exit(2)`, trước lệnh `fetch` đầu tiên.
  2. Tùy chọn: trong `lib.sh`, kiểm cùng điều kiện ngay sau dòng 22.
- Trạng thái: Open

### FB-R4-SEC-OPS-PR78-02
- Mức độ: Minor
- Vị trí: `product/infra/demo/seed-demo.mjs` `phaseNow`, khối tắt `qa.*` (dòng 1026–1048, ở gần cuối pha 2); `product/infra/demo/lib.sh` `seed_all` pha 2 (dòng 155–159).
- Vấn đề:
  - Stack demo thật (`api`, `worker`, `web`) đã lên **trước** khi pha 2 chạy. `qa.*` chỉ bị tắt ở gần cuối pha 2.
  - Nếu pha 2 dừng ở bất kỳ bước nào trước đó (đặt phòng lỗi, 429 hết lượt thử lại, Ctrl-C), `die` thoát nhưng stack vẫn chạy, với 13 `qa.*` còn bật, trong đó có `qa.owner`.
  - Bản sửa P-2 làm lỗi kêu to, nhưng trạng thái cuối "không còn `qa.*` bật" chỉ đạt khi cả pha 2 xong.
  - Pha 2 không dùng `qa.*` ở đâu: theo grep, `qa.*` chỉ có ở pha 1.
- Vì sao quan trọng: Rủi ro thấp, vì cổng chỉ mở ở `127.0.0.1` và mật khẩu nằm trong tệp 0600. Nhưng đây đúng là điều P-2 cam kết ("demo chỉ có nhân viên demo"), và chủ đầu tư hay chạy lại `demo-reset.sh` sau một lần lỗi mà không xem log.
- Đề xuất sửa:
  1. Chuyển khối `qaActive` / tắt / đọc lại lên **đầu** `phaseNow`, ngay sau vòng đăng nhập 8 vai (dòng 753, lúc đó đã có `S.OWN`). Như vậy mọi lỗi sau đó đều để lại `qa.*` đã tắt.
  2. Tùy chọn: trong `lib.sh`, khi pha 2 lỗi thì `dc stop api worker web` trước `die`, hoặc in một dòng "tài khoản kiểm thử có thể còn bật – chạy lại demo-reset.sh".
- Trạng thái: Open

### FB-R4-SEC-OPS-PR78-03
- Mức độ: Suggestion
- Vị trí: `product/infra/demo/seed-demo.mjs` dòng 1086 (mục "Tài khoản nhận VietQR" của `demo-accounts.md`, nhánh `set`).
- Vấn đề: Nhánh "CHƯA cấu hình" đã giải thích quy tắc "nhập hôm nay, mai mới có hiệu lực". Nhánh "Đã cấu hình" chỉ ghi "hiệu lực từ D". Vì vậy chủ đầu tư có thể nghĩ bản thật cũng cho dùng ngay. Ngoài ra, lịch sử tham số và nhật ký tiền sẽ ghi ngày tạo theo đồng hồ giả, khoảng 35 ngày trước buổi demo.
- Vì sao quan trọng: Đây là hệ quả của P-3 mà SEC chấp nhận (mục 1). Chủ đầu tư dùng demo để duyệt luật kinh doanh, nên cần thấy đúng luật thật.
- Đề xuất sửa: Thêm vào nhánh `set` một câu, ví dụ: "Trong demo, tài khoản đã được lên lịch sẵn nên dùng được ngay. Ở bản thật, tài khoản nhập hoặc đổi hôm nay chỉ có hiệu lực từ ngày kinh doanh sau (quy tắc bảo mật). Ngày tạo trong lịch sử là ngày của đồng hồ giả lúc dựng dữ liệu."
- Trạng thái: Open

### FB-R4-SEC-OPS-PR78-04
- Mức độ: Suggestion
- Vị trí: `product/infra/demo/seed-demo.mjs` `qaActive` (dòng 1029–1032).
- Vấn đề: `listUsers` phân trang theo cursor, `limit` tối đa 100 (`PageInfo.nextCursor`). Lần đọc lại "để chứng minh" chỉ đọc trang đầu và bỏ qua `page.nextCursor`. Hiện có 21 tài khoản nên chưa sao. Nếu DS-E lớn quá 100 tài khoản, phép kiểm sẽ báo "không còn `qa.*` bật" dù chưa xem hết.
- Vì sao quan trọng: Phép kiểm nên tự biết khi nó không thấy hết danh sách.
- Đề xuất sửa: Đọc lần lượt theo `page.nextCursor` cho tới hết, hoặc ném lỗi khi `page.nextCursor` khác null.
- Trạng thái: Open

## 5. Điểm làm tốt

- P-2 đóng khi lỗi: lỗi của từng lệnh tắt làm script dừng, rồi đọc lại danh sách để kiểm. Đây là cách đúng cho một bước "tắt quyền".
- P-3 không nới cổng máy chủ và đi đúng đường S2. Khi bị từ chối, script chỉ log mã lỗi, không log giá trị. Chú thích trong mã nói rõ vì sao làm vậy và dẫn tới harness E2E.
- Lượt chạy chứng minh tách biệt hẳn: project, cổng và tag riêng; tài khoản nhận THỬ; dọn sạch sau khi chạy; stack của chủ đầu tư không bị đụng. Có cả số đếm audit `stepup.s2_granted` / `s2_failed` để đối chiếu.
