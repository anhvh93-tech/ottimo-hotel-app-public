# INT – Round 2, Tuần 1 (Đợt 0): W9 – interface adapter, scrubCardData, EnvCredentialProvider, assertSafeConfig

- Vai: INT | Ngày: 16/10/2026 | Không commit (theo chỉ đạo ORC)
- Máy: macOS, Node 22 (`~/.local/node`), pnpm 9.15.4, PostgreSQL 17 của compose `ottimo-dev` (đang chạy sẵn)
- Căn cứ: `product/integrations/README.md` v0.2 mục 1.3, 1.4, 1.8, 3.0–3.6; plan R2 mục 3.2 W9; OPS-responses R1 mục 5; ADR-011, ADR-012

## 1. Bảng trạng thái

| # | Việc | Trạng thái | Bằng chứng |
|---|---|---|---|
| 1 | Chép interface vào `product/integrations/contracts/`: Channel (3.1), Payment (3.2), BankFeed (3.2b), EInvoice (3.3), DoorLock (3.4), GuestRegistration (3.6); Notification (3.5) và IntegrationContext / IntegrationError / CredentialProvider (3.0) đã có từ R1 | Xong | 6 file mới, `contracts/index.ts` export đủ; typecheck xanh |
| 2 | `scrubCardData` (lọc theo tên trường + dãy 13–19 số hợp Luhn) + test | Xong | `common/scrub-card-data.ts`, 12 test |
| 3 | `EnvCredentialProvider` (đọc `<TÊN>_FILE` theo quy ước OPS) + test | Xong | `common/env-credential-provider.ts`, 7 test |
| 4 | `assertSafeConfig()` (production cấm mock/sandbox) dùng chung với `services/api/src/config.ts` | Xong | `common/safe-config.ts`, 7 test; `config.ts` gọi `findUnsafeIntegrationConfig`; thêm 1 test trong `config.test.ts` |
| 5 | `pnpm -s lint && pnpm -s test && pnpm -s build` trong `product/` | **Xanh** (exit 0) | Mục 3 |
| 6 | BUG-R1-004 (`APP_ENV`) | Đã Closed ở R1 (QA kiểm lại lượt 2) | Không cần sửa thêm |

## 2. Đã làm gì

### 2.1 Contracts (chỉ kiểu – không có mã chạy, không SDK)
- Chữ ký phương thức chép nguyên README v0.2. Khác duy nhất: các kiểu tham số/kết quả viết inline trong README được **đặt tên** để lõi và Mock dùng lại (vd. `CreatePaymentRequest`, `VerifyCallbackResult`, `AvailabilityRange`, `EInvoiceIssueRequest`). `EInvoiceAdapter.replace` dùng `EInvoiceIssueRequest` thay `Parameters<EInvoiceAdapter['issue']>[1]` (cùng kiểu). Không đổi tên trường, không thêm/bớt phương thức → không cần ARC duyệt lại, chỉ báo ARC để biết.
- Gói vẫn chỉ export kiểu ở `./contracts` (ADR-011).

### 2.2 `scrubCardData(input, { allowKeys? }) → { value, dropped }`
- Chạy **sau** khi xác thực chữ ký trên body thô, **trước** ánh xạ allowlist. Trả bản sao đã lọc (không sửa input) + **số lượng** trường bị loại để adapter tăng `integration_card_data_dropped_total{provider}`. Không log, không trả tên trường hay giá trị.
- Luật giá trị: chuỗi **và số nguyên** chứa dãy 13–19 chữ số (cho phép khoảng trắng/gạch giữa các số) hợp Luhn → loại cả trường (hoặc phần tử mảng). Không có ngoại lệ.
- Luật tên: áp theo **token** của khóa (tách `_ - .` và camelCase). Đây là thay đổi so với regex `(^|_)(card|cc|…|expir…)` của README v0.2, vì regex đó (a) bỏ sót `creditCard`, `guestCardNo`, (b) **xóa nhầm** `expiresAt`, `vnp_ExpireDate`, `ccy`, `panel`. Đã ghi decision-log và sửa README 1.8. `allowKeys` chỉ miễn luật tên (cho `vnp_CardType` = "ATM"/"QRCODE" của VNPay), không miễn luật giá trị.
- Lồng sâu > 32 cấp hoặc vòng tham chiếu → `IntegrationError('INVALID_REQUEST')`, thông báo không có chi tiết.

### 2.3 `EnvCredentialProvider(env, { readFile? })`
- `credentialsRef = env:<TIỀN_TỐ>`, vd. `env:PAYMENT_VNPAY` → `{ MODE, TMN_CODE, HASH_SECRET, … }`. Chỉ nhận nhóm biến tích hợp `CHANNEL|PAYMENT|BANKFEED|EINVOICE|DOORLOCK|EMAIL|ZALO`: adapter không lấy được `SESSION_SECRET`, `DATA_KEK_*`, `DATABASE_URL`.
- `<TÊN>_FILE`: đọc tệp (trim như `resolveFileSecrets` của OPS) khi chưa có `<TÊN>`. Nếu có cả hai: cùng giá trị thì chấp nhận (env đã qua `resolveFileSecrets` của `config.ts`), khác giá trị thì lỗi `CONFIG`. Tệp không đọc được → `CONFIG`, thông báo không có đường dẫn hay giá trị.
- Chụp env lúc khởi tạo và cache theo ref. Xoay khóa = khởi động lại, giống phần cấu hình còn lại.

### 2.4 `assertSafeConfig(env, appEnv)` / `findUnsafeIntegrationConfig(env, appEnv)`
- Một bộ luật duy nhất, `services/api/src/config.ts` gọi khi api và worker khởi động (thay đoạn kiểm tra nội tuyến của R1; vẫn giữ kiểm `CLOCK_OVERRIDE`). Mọi test cũ trong `config.test.ts` vẫn xanh.
- Production: (a) mọi `*_PROVIDER`/`*_MODE` = `mock|sandbox` (gồm cả biến thêm sau, vd. `BLOBSTORE_PROVIDER`); (b) **mới**: phương thức có trong `PAYMENT_METHODS_ENABLED` phải ở `MODE=production`; (c) **mới**: cấm đặt `*_MOCK_SCENARIO`.
- Mọi môi trường (**mới**): biến chọn ở README mục 4 phải có giá trị hợp lệ (vd. `PAYMENT_VIETQR_MODE=sandbox` bị từ chối vì VietQR không có sandbox; `CHANNEL_PROVIDER=Mock` bị từ chối). `PAYMENT_<X>_MODE` và `PAYMENT_METHODS_ENABLED` chỉ nhận `vietqr|vnpay|momo`. Ở dev/test/staging, phương thức bật mà `MODE=off` chỉ bị ẩn, không lỗi → `.env.example` hiện tại vẫn chạy.
- Thông báo lỗi chỉ nêu tên biến, không nêu giá trị (có test).
- `@ottimo/integrations` chuyển từ `devDependencies` sang `dependencies` của `@ottimo/api` (lockfile cập nhật, `--frozen-lockfile` khớp). Lý do: `config.ts` cần gói này khi chạy. Trước đây gói **không** có trong image (OPS w1 mục 9c).

## 3. Kết quả chạy thật (16/10/2026)

| Lệnh (trong `product/`) | Exit | Kết quả |
|---|---|---|
| `pnpm -s lint` (ESLint + `turbo run typecheck`) | 0 | `Tasks: 8 successful, 8 total` |
| `pnpm -s test` (không biến DB) | 0 | integrations **32 passed (32)** (cũ 6 + mới 26); api **29 passed, 6 skipped** (skipped = test cần DB, đúng thiết kế); 3 app × 1 passed; `Tasks: 8 successful` |
| `pnpm -s test` với `DATABASE_URL`/`MIGRATION_DATABASE_URL` → `ottimo_test` (lệnh của dev-setup mục 5) | 0 | api **35 passed (35)**, 0 skipped; integrations 32/32 |
| `pnpm -s build` | 0 | `Tasks: 6 successful, 6 total`; `integrations/dist/common/*` có đủ |
| `pnpm -s format:check` | 0 | `All matched files use Prettier code style!` |
| `pnpm install --frozen-lockfile --offline` | 0 | Lockfile khớp |
| Chạy `dist/config.js` (CJS `require` gói ESM `@ottimo/integrations/common`, Node 22) | – | dev hợp lệ → `dev`; `PAYMENT_VIETQR_MODE=sandbox` → `ConfigError: … must be one of off\|mock\|production` |
| `docker build -f infra/docker/Dockerfile.api` (image production) | 0 | `node_modules/@ottimo/integrations/dist` có trong image. Chạy `node dist/main.js` với `APP_ENV=production`, đủ khóa, `PAYMENT_METHODS_ENABLED=vietqr` + `PAYMENT_VIETQR_MODE=off` → exit 1 `ConfigError: … PAYMENT_VIETQR_MODE must be production when vietqr is in PAYMENT_METHODS_ENABLED`. Đã xóa image tạm |

## 4. File tạo/sửa

Tạo:
- `product/integrations/contracts/channel.ts`, `payment.ts`, `bankfeed.ts`, `einvoice.ts`, `doorlock.ts`, `guest-registration.ts`
- `product/integrations/common/index.ts`, `scrub-card-data.ts`, `scrub-card-data.test.ts`, `env-credential-provider.ts`, `env-credential-provider.test.ts`, `safe-config.ts`, `safe-config.test.ts`
- `rounds/round-02/outputs/INT/w1-report.md` (file này)

Sửa:
- `product/integrations/contracts/index.ts` (export đủ interface), `product/integrations/index.ts` (export `common`)
- `product/integrations/package.json` (export `./common`, devDependency `@types/node`), `product/integrations/tsconfig.json` (include `common`)
- `product/integrations/README.md` (trạng thái mã, 1.3, 1.4, 1.8, mục 2)
- `product/services/api/src/config.ts` (gọi `findUnsafeIntegrationConfig`), `product/services/api/test/config.test.ts` (+1 test), `product/services/api/package.json` (`@ottimo/integrations` → dependencies)
- `product/pnpm-lock.yaml` (2 thay đổi importer ở trên)
- `01-decisions/decision-log.md` (+3 dòng INT)

## 5. Giả định
- Thư mục đích là `product/integrations/contracts/` theo prompt ORC, README và ADR-011. Plan R2 dòng INT ghi `packages/contracts` (gói OpenAPI): **không** chép sang đó, để không có hai nguồn interface.
- Sửa `config.ts` (file của OPS/BE) chỉ ở khối kiểm tra adapter, theo W9 "INT + BE". Phần kiểm `BYPASSRLS` lúc khởi động vẫn thuộc BE.
- Luật (b) áp đúng chữ README 1.3: production có phương thức bật mà `MODE=off` → từ chối khởi động. Nghĩa là chép nguyên `.env.example` lên production sẽ không chạy. Đây là chủ ý: buộc chọn cấu hình rõ ràng.

## 6. Rủi ro / vướng mắc
- **Luật giá trị Luhn có thể xóa nhầm mã giao dịch dài**: một mã số 13–19 chữ số ngẫu nhiên có khoảng 10% khả năng hợp Luhn (vd. `transId` MoMo, mã giao dịch ngân hàng của SePay/payOS – độ dài thật **[Chưa xác minh]**). Hậu quả: trường bị loại → ánh xạ báo `malformed` → "Cần chú ý", **không mất tiền** (không ghi nhầm). Khi viết adapter R3 sẽ tra tài liệu định dạng mã. Nếu trùng thật, đề xuất cho trường mã giao dịch đã biết chỉ loại khi khớp thêm đầu số thương hiệu thẻ (IIN). Cần SEC đồng ý trước khi đổi.
- Thay luật tên của `scrubCardData` (regex → token) là quyết định kỹ thuật của INT, nhưng SEC-01 là Blocker R1 nên **SEC cần xem lại** `common/scrub-card-data.ts` và bộ test.
- Ràng buộc mới ở mọi môi trường (giá trị biến chọn phải hợp lệ) làm `.env` dev cũ có giá trị lạ dừng khởi động. Hiện `.env.example` vẫn hợp lệ (có test).

## 7. Yêu cầu vai khác (không sửa file của họ)
| Gửi | Yêu cầu |
|---|---|
| SEC | Review `scrubCardData` (luật token, `allowKeys`, số nguyên) và rủi ro Luhn ở mục 6 |
| OPS | `product/.env.example` dòng 7: bổ sung chú thích luật (b) và (c) (phương thức bật phải `production`; cấm `*_MOCK_SCENARIO` ở production). `hosting-plan` mục 8.1: nêu `credentialsRef = env:<TIỀN_TỐ>` khi lập sổ bí mật tích hợp |
| BE | Dùng `EnvCredentialProvider(resolveFileSecrets(process.env))` khi dựng `IntegrationRegistry`; adapter Mock/VietQR của INT (việc 2 trong plan) nhận provider này. `BYPASSRLS` vẫn do BE cài trong `config.ts` |
| ARC | Ghi nhận: subpath export mới `@ottimo/integrations/common` (mã chạy được, không SDK); `@ottimo/integrations` là dependency chạy của api (ADR-011/012). Chữ ký interface không đổi |

## 8. Việc chưa xong (tiếp trong R2)
- Adapter Mock cho Channel (outbox, lỗi giả lập BR-905), Payment VietQR (chuỗi EMVCo) + Mock, email (log). Đây là việc (2) của plan, chưa thuộc W9.
- `IntegrationRegistry` (đăng ký route webhook theo cấu hình, không đăng ký `mock` ở production) – làm cùng các adapter trên.
- Kiểm thử E2E `card_data_in_payload` (không xuất hiện trong DB/log/outbox) cần inbox/outbox của BE.
