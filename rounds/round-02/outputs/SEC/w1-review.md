# SEC – Round 2, Tuần 1: đóng lỗi R1 sau chạy thật, review mã W9/W17, kiểm OpenAPI 0.3.0, quyết P-R2-4

- Vai: SEC | Ngày: 16/10/2026 | Không commit, không sửa file vai khác
- Đầu vào: CI run 38859182678 (đọc log từng job bằng `gh run view`), `outputs/OPS/w1-skeleton-run.md`, `outputs/QA/w1-report.md`, `outputs/INT/w1-report.md`, `outputs/BE/w1-report.md`, `outputs/ARC/w1-report.md`, `product/integrations/common/*`, `product/services/api/src/config.ts` (+ `test/config.test.ts`, `http.ts`, `main.ts`), `.github/workflows/ci.yml`, `infra/ci/check-no-test-surface.sh`, `infra/docker/Dockerfile.api`, `docs/api/openapi.yaml` 0.3.0-draft, `security-requirements.md` SR-GST, `backlog.md` EP14, `plan.md` R2 mục 2.3
- Cách soát: đọc mã + log CI; đo tỉ lệ nhận nhầm của luật Luhn bằng script Python dựng lại đúng thuật toán `containsPan` (không chạy mã thật vì máy SEC không có `node`/`docker` trong PATH); soát OpenAPI bằng script Ruby (YAML) liệt kê mọi operation C3 và operation app khách. Không dùng dữ liệu thật, không tấn công hệ thống nào.

## 1. Bảng quyết định

| # | Việc | Quyết định SEC | Ghi ở |
|---|---|---|---|
| 1 | BUG-R1-SEC-06 (vai PostgreSQL) | **Đóng** – chạy thật trên PG 17.11 + CI xanh, `db-role` 5/5 không bỏ qua ca nào | `rounds/round-01/qa/sec-findings.md` Phần E |
| 2 | BUG-R1-SEC-08 phần spec + `openapi.test.yaml` | **Đóng** | như trên |
| 3 | BUG-R1-SEC-08 phần bundle `dist` | **Đóng**; TC-X-066 (d) theo dõi ở PR TestSupportModule; thêm thẻ FB-R2-SEC-OPS-01 (bước quét bỏ sót gói `@ottimo/*` nhưng vẫn báo OK) | như trên + mục 3 |
| 4 | BUG-R1-SEC-07 phần BE; SEC-R1-24 (lockfile) | **Đóng** / **Đạt** | như trên |
| 5 | BUG-R1-SEC-10 (step-up mã cửa) | **Đạt – Đóng** | mục 2 |
| 6 | BUG-R1-SEC-11 (chú thích máy đọc, A119) | **Đạt – Đóng** | mục 2 |
| 7 | `scrubCardData` – luật token (thay regex) | **Chấp nhận** | mục 3 |
| 8 | `scrubCardData` – luật giá trị Luhn | **Phải sửa trong R2, trước adapter thật đầu tiên**: Major nhận nhầm (≈ 10% mã số dài bị xóa) + Major bỏ sót (số thẻ dính liền số khác) | FB-R2-SEC-INT-01, 02 |
| 9 | Đề xuất IIN của INT | **Đồng ý có điều kiện**: chỉ dùng IIN cho trường mã/số do adapter **khai báo kiểu**; trường văn bản tự do và trường chưa khai báo giữ luật Luhn chặt (không IIN) | FB-R2-SEC-INT-01 |
| 10 | `EnvCredentialProvider`, `assertSafeConfig` | **Chấp nhận** kèm 1 Minor + 1 Suggestion | FB-R2-SEC-INT-04, 05 |
| 11 | `config.ts` – `REQUIRED_SECRETS`, kiểm trùng khóa | **Chấp nhận** (đúng ADR-013 điểm 5, thông báo lỗi không lộ giá trị) | mục 3 |
| 12 | `parseTrustProxy` | **Major**: nhận `0.0.0.0/0`, `::/0` = tin mọi nguồn (đúng thứ mà `TRUST_PROXY=true` đã bị cấm) | FB-R2-SEC-BE-01 |
| 13 | Ý kiến BE: bắt buộc `TRUST_PROXY` ở staging/production | **Đồng ý** – làm ngay trong `config.ts` (không đợi compose production) | FB-R2-SEC-BE-02 |
| 14 | P-R2-4 (dời US-141) | **XÁC NHẬN có điều kiện** – 6 điều kiện ĐK-1…ĐK-6 ở mục 4; vi phạm điều kiện nào thì US-141 quay lại R2 | mục 4 |

Không có lỗi Critical/Blocker; SEC không chặn. Không tạo ESC mới.

## 2. Kiểm lại BUG-R1-SEC-10/11 trên `openapi.yaml` 0.3.0-draft

Soát tự động 11 operation `x-classification: C3`: `getDoorCredential`, `setDoorCredential`, `addGuestDocument`, `updateGuestDocument`, `getGuestDocumentSensitive`, `getDocumentImage`, `purgeRegistrationImages`, `getPortalData`, `renderDoorCodeMessage`, `getGuestStay`, `uploadGuestDocument`. Quy tắc: C3 → có `x-c3-log`; C3 nhân viên → có 401; `x-requires-trusted-device` → có 403; `x-step-up` → có 401; `x-rate-limit` → có 429. **Kết quả: 0 vi phạm.**

| Lỗi | Kết quả | Bằng chứng |
|---|:-:|---|
| BUG-R1-SEC-10 | **Đạt** | `getDoorCredential`: `x-requires-trusted-device`, `x-step-up: true`, `x-c3-log {door_credential, view}`, `x-rate-limit` chung bộ đếm với `renderDoorCodeMessage`, response 200 (`Cache-Control: no-store`)/401/403/404/429; mô tả thứ tự kiểm, ghi log **trước khi** trả, ghi log lỗi → 500 không trả mã. `setDoorCredential`: `x-step-up: true`, `x-c3-log {update, onCreate: create}` trong cùng giao dịch, trả **bản che** (`DoorCredentialMasked`), `If-Match` khi sửa, `Idempotency-Key` không lưu C3, 401/403. Đã xong trước khi BE cài A21 – đúng hạn |
| BUG-R1-SEC-11 | **Đạt** | `x-c3-log` có ở cả 11 operation C3 (thêm `addGuestDocument` create, `updateGuestDocument` update, `getGuestDocumentSensitive`/`getDocumentImage`/`getPortalData` view, `purgeRegistrationImages` purge, `uploadGuestDocument`); mọi op có thiết bị tin cậy có 403, mọi op step-up có 401, mọi op có rate limit có 429; `setParameter` `x-rbac: [A101, A102, A118, A119]` |

Ghi chú: `startMy2faSetup` có `x-c3-log {mfa_secret, create}` + `no-store` + 401 – SEC chấp nhận (ghi dấu vết việc cấp bí mật 2FA là đúng; bí mật TOTP không phải dữ liệu cá nhân C3 nhưng nhạy cảm tương đương). Việc của SEC còn lại: thêm `door-credential` GET/PUT và `render-door-code` vào câu chữ SR-C3-09 (SR-DEV-03 đã có) – chưa làm trong lượt này vì ngoài 2 file được giao; làm ở lượt SEC kế tiếp.

## 3. Thẻ feedback

### FB-R2-SEC-INT-01
- Mức độ: Major
- Vị trí: `product/integrations/common/scrub-card-data.ts` – `containsPan`, `valueHasPan` (luật giá trị); README 1.8 (b)
- Vấn đề: luật "mọi dãy 13–19 chữ số hợp Luhn → xóa cả trường" xóa nhầm khoảng **10%** các mã số dài do cổng sinh ra. SEC đo bằng bản dựng lại đúng thuật toán: `vnp_PayDate` dạng `yyyyMMddHHmmss` (14 số) cho 86.400 giá trị của một ngày → **10,0%** bị coi là số thẻ (ví dụ `20261016000006`); dấu thời gian mili-giây 13 số (kiểu `responseTime` của MoMo) trên 100.000 mẫu → **9,9%** (ví dụ `1792130015838`). Mã giao dịch MoMo/SePay/payOS, mã đặt phòng OTA 13 số (dạng Expedia) cùng số phận. INT đã tự nêu rủi ro này (w1-report mục 6) nhưng ước "không mất tiền" – đúng là không ghi sai tiền, nhưng có hậu quả vận hành và bảo mật bên dưới.
- Vì sao quan trọng: (1) cứ khoảng 1/10 IPN VNPay thiếu trường bắt buộc → ánh xạ `malformed` → giao dịch không tự ghi, lễ tân phải xử lý tay, khách đã trả tiền vẫn thấy "chưa thanh toán"; lỗi **lặp lại y hệt** mỗi lần cổng gửi lại (giá trị không đổi). (2) Mỗi lần xóa nhầm bắn cảnh báo "dữ liệu thẻ" cho SEC/OWN → hàng chục cảnh báo giả mỗi tuần → khi có số thẻ thật thì không ai đọc (mệt cảnh báo). Cả hai làm yếu chính biện pháp SEC-01 (Blocker R1).
- Đề xuất sửa (SEC quyết, thuộc thẩm quyền yêu cầu kỹ thuật – đồng ý đề xuất IIN của INT **có điều kiện**):
  1. **Tầng A – văn bản tự do và trường chưa khai báo** (ghi chú, yêu cầu đặc biệt, tin nhắn, mọi chuỗi có ký tự khác chữ số, mọi khóa adapter không khai kiểu): giữ luật Luhn **chặt, không dùng IIN** (xóa nhầm một ghi chú là rẻ) – và sửa lỗi bỏ sót ở FB-R2-SEC-INT-02.
  2. **Tầng B – trường mã/số do adapter khai báo kiểu** trong allowlist ánh xạ (vd. `fieldKinds: { vnp_PayDate: 'timestamp14', vnp_TransactionNo: 'numericId', transId: 'numericId', responseTime: 'epochMs' }`), giá trị chỉ gồm chữ số: chỉ xóa khi **Luhn + IIN + độ dài khớp thương hiệu**. Bảng IIN cố định trong code (đổi bảng = SEC duyệt): Visa `4` (13, 16, 19) · Mastercard `51–55`, `2221–2720` (16) · Amex `34`, `37` (15) · JCB `3528–3589` (16–19) · UnionPay `62` (16–19) · Discover `6011`, `644–649`, `65` (16–19) · Diners `300–305`, `36`, `38–39` (14–19) · Maestro `50`, `56–69` (12–19) · NAPAS nội địa `9704` (16, 19). Kiểu `timestamp14`/`epochMs`: nếu giá trị là ngày giờ hợp lệ trong khoảng ±2 năm → giữ.
  3. **Không có miễn trừ tuyệt đối**: `allowKeys` vẫn chỉ miễn luật tên; tầng B vẫn xóa số thẻ thật đặt vào trường mã (tiền tố thương hiệu).
  4. Trường **bắt buộc** của ánh xạ bị xóa → không trả "thành công" im lặng: tạo mục "Cần chú ý" lý do `card_suspect` (không kèm giá trị), metric tách nhãn `rule=name|value_text|value_id` để SEC phân biệt cảnh báo thật/giả.
  5. Test bắt buộc: 86.400 giá trị `vnp_PayDate` của một ngày khai kiểu `timestamp14` → 0 bị xóa; 10.000 mẫu `epochMs` → 0; mã 13–19 số không tiền tố thương hiệu ở trường `numericId` → giữ; `4111111111111111`, `5555555555554444`, `378282246310005`, một số NAPAS thử hợp Luhn đặt vào trường `numericId` → vẫn xóa; cùng các giá trị đó trong trường ghi chú → xóa.
  Hạn: trong R2, **trước khi viết adapter thật đầu tiên** (VietQR/bank feed); cập nhật README 1.8.
- Trạng thái: Open

### FB-R2-SEC-INT-02
- Mức độ: Major
- Vị trí: `scrub-card-data.ts` – `DIGIT_RUN = /\d(?:[ -]?\d)*/g` + kiểm độ dài **cả dãy**
- Vấn đề: số thẻ đứng sát số khác, cách một khoảng trắng hoặc gạch, bị gộp thành một dãy dài hơn 19 số hoặc không hợp Luhn → **không bị phát hiện**. SEC đo: `"4111111111111111 123"` (thẻ + CVV) → không phát hiện; `"4111 1111 1111 1111 12-28"` (thẻ + hạn) → không phát hiện; `"4111111111111111-0901234567"` → không phát hiện. Chỉ phát hiện khi có chữ chen giữa (`"… 4111111111111111 cvv 123"`).
- Vì sao quan trọng: "số thẻ + CVV/hạn" là đúng dạng khách/OTA hay gõ vào ghi chú (VCC Booking/Agoda, khách nhắn "thẻ … hạn …") – chính trường hợp SEC-01 cần chặn; dữ liệu thẻ khi lọt sẽ vào `inbox_message.rawFiltered`, log, outbox → hệ thống bị kéo vào phạm vi PCI DSS.
- Đề xuất sửa: với mỗi dãy, kiểm **mọi cửa sổ liên tiếp 13–19 chữ số** (sau khi bỏ khoảng trắng/gạch) bằng Luhn ở tầng A (tối đa 7 × n phép kiểm – rẻ); giữ nguyên 4 test hiện có và thêm 3 chuỗi trên làm test đỏ trước khi sửa.
- Trạng thái: Open

### FB-R2-SEC-INT-03
- Mức độ: Minor
- Vị trí: `scrub-card-data.ts` – `valueHasPan` nhánh `number`
- Vấn đề: payload JSON có số nguyên > `Number.MAX_SAFE_INTEGER` (≥ 16 chữ số lớn, mọi số 17–19 chữ số) bị `JSON.parse` làm tròn trước khi tới `scrubCardData` → Luhn chạy trên chữ số đã sai → có thể bỏ sót số thẻ 17–19 số gửi dạng number.
- Vì sao quan trọng: bỏ sót ít gặp nhưng không phát hiện được về sau (giá trị đã méo).
- Đề xuất sửa: số nguyên vượt `MAX_SAFE_INTEGER` → coi là đáng ngờ và xóa (mã định danh hợp lệ của cổng ở cỡ đó phải là chuỗi); hoặc adapter parse body bằng bộ đọc JSON giữ nguyên chuỗi số (lossless) trước khi lọc. Thêm test.
- Trạng thái: Open

### FB-R2-SEC-INT-04
- Mức độ: Minor
- Vị trí: `product/integrations/common/env-credential-provider.ts` – `get()` nhận `env:<GROUP>` một đoạn
- Vấn đề: `credentialsRef = env:PAYMENT` trả về **mọi** biến `PAYMENT_*` – adapter VNPay nhận cả `MOMO_SECRET_KEY`, adapter bank feed (`env:BANKFEED`) nhận cả khóa của SePay lẫn payOS.
- Vì sao quan trọng: nguyên tắc quyền tối thiểu (SR-KEY): lỗi hoặc log sai ở một adapter làm lộ bí mật của cổng khác; xoay vòng/thu hồi khó khoanh vùng.
- Đề xuất sửa: với nhóm có nhiều nhà cung cấp (`PAYMENT`, `BANKFEED`, `EMAIL`, `CHANNEL`, `EINVOICE`, `DOORLOCK`, `ZALO`) bắt buộc ref có ít nhất 2 đoạn `env:<GROUP>_<PROVIDER>`; `env:PAYMENT` → `IntegrationError('CONFIG')`. Thêm test.
- Trạng thái: Open

### FB-R2-SEC-INT-05
- Mức độ: Suggestion
- Vị trí: `product/integrations/common/safe-config.ts`
- Vấn đề: (a) với biến chọn chưa có trong `INTEGRATION_SELECTORS` (vd. `BLOBSTORE_PROVIDER` sau này), kiểm "mock/sandbox cấm ở production" so khớp phân biệt hoa thường → `MOCK` lọt; (b) dev/test/staging cho phép `PAYMENT_VNPAY_MODE=production` / `PAYMENT_MOMO_MODE=production` → môi trường thử có thể gọi cổng thật, thu tiền thật.
- Vì sao quan trọng: cả hai là cấu hình nhầm hay gặp; chặn ở một chỗ duy nhất rẻ hơn sửa sự cố tiền.
- Đề xuất sửa: (a) so khớp không phân biệt hoa thường; (b) ngoài production, `PAYMENT_{VNPAY,MOMO}_MODE=production` → từ chối khởi động (VietQR giữ nguyên vì R2 dùng tài khoản thử – P-R2-6).
- Trạng thái: Open

### FB-R2-SEC-BE-01
- Mức độ: Major
- Vị trí: `product/services/api/src/config.ts` – `parseTrustProxy` / `isIpOrCidr`
- Vấn đề: `TRUST_PROXY=0.0.0.0/0` hoặc `::/0` (và dải rất rộng như `0.0.0.0/1`) được chấp nhận vì `isIP('0.0.0.0') = 4` và tiền tố `0 ≤ 32`. Kết quả tương đương `trustProxy: true` – đúng giá trị mà mã đang cố ý cấm ("trusts any X-Forwarded-For").
- Vì sao quan trọng: ai cũng tự đặt `X-Forwarded-For` → vượt giới hạn tần suất theo IP (đăng nhập nhân viên, xác minh khách, gửi lại link SR-GST), giả IP trong nhật ký audit/`c3_access_log`; một người cấu hình "cho chạy được" bằng `0.0.0.0/0` là lỗi rất dễ xảy ra.
- Đề xuất sửa: từ chối tiền tố < /8 (IPv4) và < /16 (IPv6) ở mọi môi trường (đặc biệt `/0`); ở staging/production chỉ nhận địa chỉ loopback, RFC 1918, `fc00::/7` (Caddy nằm trong mạng Docker nội bộ – hosting-plan). Khi nào đặt CDN phía trước thì SEC duyệt nới. Test: `0.0.0.0/0`, `::/0`, `0.0.0.0/1`, `8.8.8.8` (staging) → `ConfigError`; `172.18.0.2`, `172.18.0.0/16`, `127.0.0.1` → nhận.
- Trạng thái: Open

### FB-R2-SEC-BE-02
- Mức độ: Minor
- Vị trí: `config.ts` – `loadConfig` (khối `strict`); `.env.example` d.28
- Vấn đề: ý kiến BE (w1-report mục 4) – staging/production sau Caddy mà để trống `TRUST_PROXY` → mọi yêu cầu mang IP của Caddy → bộ đếm theo IP gộp làm một: một người gõ sai có thể khóa tạm cả quầy, kẻ dò mật khẩu bị trộn lẫn với nhân viên. **SEC đồng ý.**
- Vì sao quan trọng: giới hạn tần suất và khóa đăng nhập (SR-RL, SR-GST-08) là hàng rào chính chống dò mật khẩu/mã.
- Đề xuất sửa: khi `APP_ENV` là staging/production, `TRUST_PROXY` trống hoặc `false` → `ConfigError("TRUST_PROXY is required when APP_ENV=…; set the reverse proxy IP/CIDR")`. Làm ngay ở R2 tuần 1–2 (không đợi compose production) để staging đầu tiên đã đúng; OPS đặt giá trị trong compose staging; `.env.example` ghi chú "bắt buộc ở staging/production". Test như các khóa bắt buộc.
- Trạng thái: Open

### FB-R2-SEC-BE-03
- Mức độ: Suggestion
- Vị trí: `config.ts` – vòng `REQUIRED_SECRETS`
- Vấn đề: chỉ kiểm độ dài ≥ 32 → `"aaaa…a"` (32 ký tự giống nhau) hoặc chuỗi mẫu kiểu `change-me-change-me-change-me-123` vẫn qua ở production.
- Vì sao quan trọng: khóa yếu/khóa mẫu là lỗi cấu hình phổ biến khi dựng môi trường gấp.
- Đề xuất sửa: ở staging/production từ chối khi số ký tự khác nhau < 10 hoặc chứa `change`, `example`, `secret`, `password`, `test` (không phân biệt hoa thường); thông báo vẫn không in giá trị. `openssl rand -hex 32` vẫn qua.
- Trạng thái: Open

### FB-R2-SEC-OPS-01
- Mức độ: Minor
- Vị trí: `.github/workflows/ci.yml` job `docker-build` bước "Production api bundle has no test-only code"; `product/infra/ci/check-no-test-surface.sh` nhánh `bundle`
- Vấn đề: log CI run 38859182678: `grep: /home/runner/work/_temp/api-bundle/ottimo-packages/integrations: No such file or directory` rồi `OK: no test-only code in: …`. `node_modules/@ottimo/*` trong image do `pnpm deploy` tạo là **symlink** tới `.pnpm/…`; `docker cp` chép symlink nhưng không chép đích → mã `@ottimo/integrations` trong image **không được quét**, và `grep -R` báo lỗi (exit 2) bị coi như "không thấy" (fail-open).
- Vì sao quan trọng: bước này là lớp chặn chính của SEC-08 trước khi BE merge TestSupportModule; một lớp chặn im lặng bỏ qua phần không đọc được thì cho cảm giác an toàn giả.
- Đề xuất sửa: (1) chép theo đích symlink (`docker cp -L`) hoặc `docker export` rồi quét `/app/dist` + `/app/node_modules/.pnpm/@ottimo+*`; (2) script: `grep` trả 2 (lỗi đọc) → script exit 2 (thất bại), và thất bại nếu thư mục quét rỗng; (3) đối chứng trong CI: một thư mục giả có symlink hỏng → bước phải đỏ. Làm trước PR TestSupportModule; khi đó chạy TC-X-066 (d).
- Trạng thái: Open

### FB-R2-SEC-OPS-02
- Mức độ: Suggestion
- Vị trí: `.github/workflows/ci.yml` – job `contract-lint`; các action ghim SHA
- Vấn đề: (a) Redocly nay xanh ("Your API description is valid") nhưng job vẫn `continue-on-error: true` – plan R2 muốn chặn; (b) CI cảnh báo `actions/checkout`, `setup-node`, `cache` bản Node 20 đã bị đánh dấu cũ.
- Vì sao quan trọng: (a) hợp đồng API là nơi gắn `x-roles`/`x-step-up`/`x-c3-log` – hỏng định dạng phải chặn PR; (b) chuỗi cung ứng.
- Đề xuất sửa: bỏ `continue-on-error` của `contract-lint`; để Dependabot nâng các action lên bản Node 24 (vẫn ghim SHA).
- Trạng thái: Open

### FB-R2-SEC-ARC-01
- Mức độ: Suggestion
- Vị trí: `product/docs/api/openapi.yaml` d.2082 và d.3378 (`example: { …, note: Gọi điện – khách trả lúc 11:00 }`, `reason: Khách trả 14:00 không phải 15:00`)
- Vấn đề: chuỗi không đặt trong nháy chứa `:` bên trong mapping dạng `{ }` – bộ đọc YAML chặt (Ruby Psych/libyaml) báo lỗi cú pháp; Redocly (js-yaml) vẫn đọc được.
- Vì sao quan trọng: công cụ soát tự động của SEC/QA (script sinh test quyền, `x-c3-log`) có thể dừng ở file hợp đồng.
- Đề xuất sửa: đặt hai chuỗi trong nháy đơn.
- Trạng thái: Open

### Điểm làm tốt (giữ lại)
- INT: `scrubCardData` trả về **số lượng** chứ không trả tên/giá trị bị xóa; chống vòng lặp/độ sâu không lộ chi tiết; luật tên theo token sửa đúng cả bỏ sót (`creditCard`) lẫn xóa nhầm (`expiresAt`, `vnp_ExpireDate`) – SEC chấp nhận thay regex README v0.2. `allowKeys` chỉ miễn luật tên, có test chứng minh luật giá trị vẫn chạy.
- BE/INT: kiểm "mỗi mục đích một khóa" ở mọi môi trường kể cả KEK, test chứng minh thông báo lỗi không chứa giá trị; `assertSafeConfig` là **một** chỗ quyết định cấu hình an toàn, gọi từ `config.ts`.
- OPS: tự phát hiện Turbo lọc mất `MIGRATION_DATABASE_URL` (test bị bỏ qua mà CI xanh) – đúng kiểu lỗi "xanh giả" SEC lo nhất; bản vá fastify bằng override trong cùng major thay vì tắt `audit`.

## 4. P-R2-4 – Dời US-141 (xác minh mức 2 trên app khách): **XÁC NHẬN có điều kiện**

Căn cứ: soát toàn bộ operation `/v1/guest/*` trong `openapi.yaml` 0.3.0-draft. Ở mức 1 (chỉ có link) hợp đồng trả: số đơn, trạng thái, số căn, ngày/giờ đến–đi, thông tin cơ sở, nội quy, Wi-Fi (từ ngày nhận phòng), **tên** (không họ đầy đủ), email đã che, tiến độ check-in (`uploadedPeople` chỉ là **chỉ số người**, "không trả lại ảnh/số"), yêu cầu của chính khách. `guestFullName` và `doorCode` gắn `x-guest-level: 2`; `getGuestFolio`, `withdrawGuestConsent` cần mức 2. Khi R2 không có đường lên mức 2, các trường/endpoint này **không thể tới được** – khớp SR-GST-06 (mức 1 không có bill, hợp đồng, mã cửa, họ tên đầy đủ, liên hệ, người đi cùng) và P-R2-5 (mã cửa không trên app). Rủi ro còn lại của mức 1 (người cầm link biết số căn, ngày ở; tải giấy tờ giả; gửi yêu cầu rác) đã được chấp nhận từ thiết kế R1 (ADR-006, SR-GST-06) và giảm nhẹ bằng đối chiếu bản gốc tại quầy.

Điều kiện (QA/SEC kiểm trên staging; vi phạm bất kỳ điều nào → US-141 quay lại R2 trước khi phát hành phần app khách):

| ĐK | Nội dung | Vai | Kiểm chứng |
|---|---|---|---|
| ĐK-1 | R2 **không đăng ký** route `sendGuestOtp`, `verifyGuestSession`, `getGuestFolio`, `withdrawGuestConsent`, `issueGuestVerificationCode` (hoặc trả cố định `403 GUEST_VERIFICATION_REQUIRED`); `openGuestSession` luôn `level: 1`, `verification.emailOtpAvailable: false`, `level2ExpiresAt: null` | BE | Test API |
| ĐK-2 | Serializer app khách lọc theo `x-guest-level`: JSON mức 1 của `getGuestStay` **không bao giờ** có khóa `guestFullName`, `doorCode` (kể cả `null`); không thêm trường mới vào `GuestStay`/`OnlineCheckin`/`GuestRequest` ở R2 mà không qua SEC | BE, ARC | Test tự động "JSON mức 1 không có trường cấm" (SR-GST-06) chạy mỗi PR |
| ĐK-3 | guest-web: không hiện lại ảnh/số giấy tờ khi mở lại link (chỉ "đã tải n/m người" + tải lại); **không lưu** ảnh/số giấy tờ ở `localStorage`/`sessionStorage`/IndexedDB/Cache Storage/service worker (kể cả để gửi lại khi mất mạng), thu hồi object URL sau khi gửi; không có màn OTP, folio, mã cửa | MOB | SEC review bắt buộc PR guest-web; kiểm DevTools trên staging |
| ĐK-4 | Các SR-GST bắt buộc R2 vẫn giữ nguyên: -01 (token 256 bit, lưu băm), -02 (token rời URL, `no-referrer`), -03 (không script bên thứ ba, che `/g/*` trong log), -04/-05 (thu hồi, hết hạn), -11 (sau trả phòng: mọi thứ 403 – R2 không có bill nên khách chỉ thấy trang "đã kết thúc"), -12 (QR trong phòng không có token) | BE, MOB, OPS | TC hiện có của QA |
| ĐK-5 | Quyền rút đồng ý lưu ảnh (NĐ 13/2023) ở R2 thực hiện **qua lễ tân**: Desk ghi `recordImageConsent` `decision: refused` cho người đã đồng ý trước đó → kích hoạt xóa ảnh (T01/J16); trang khách hiện dòng hướng dẫn "liên hệ lễ tân để rút đồng ý". BA/BE xác nhận API cho phép ghi đè `granted → refused` | BA, BE, UXD | TC Desk; SEC xem lại câu chữ |
| ĐK-6 | Nếu PO/INV muốn hiện trên app khách ở R2 bất kỳ thứ gì đang gắn mức 2 (mã cửa, folio, họ tên đầy đủ) → phải làm US-141 trước, không có ngoại lệ | PO, ORC | Theo dõi qua backlog |

## 5. Giả định
- Không tự chạy lại PostgreSQL/Docker/Node: kết luận đóng lỗi dựa trên log CI (đọc trực tiếp) + báo cáo OPS/QA; tỉ lệ nhận nhầm Luhn đo bằng bản dựng lại thuật toán bằng Python (cùng regex, cùng phép Luhn).
- Bảng IIN trong FB-R2-SEC-INT-01 là bảng công khai phổ biến của các thương hiệu thẻ; INT đối chiếu tài liệu chính thức khi cài, chỉ được **mở rộng** (không thu hẹp) khi chưa có SEC duyệt.
- Độ dài/định dạng thật của mã giao dịch MoMo/SePay/payOS/OTA chưa xác minh (INT ghi [Chưa xác minh]) – đề xuất tầng B không phụ thuộc vào độ dài cụ thể.

## 6. Việc chưa xong / đề nghị ORC
- ORC ghi `decision-log.md`: (1) đóng BUG-R1-SEC-06/07/08 (spec + bundle `dist`); (2) luật lọc thẻ 2 tầng + bảng IIN (quyết định SEC); (3) `TRUST_PROXY` bắt buộc + giới hạn dải ở staging/production (quyết định SEC); (4) SEC xác nhận P-R2-4 có điều kiện ĐK-1…6.
- SEC: cập nhật câu chữ SR-C3-09 (thêm `door-credential` GET/PUT, `render-door-code`) – lượt SEC kế tiếp.
- TC-X-066 (d): chạy trong PR TestSupportModule, sau khi sửa FB-R2-SEC-OPS-01.
