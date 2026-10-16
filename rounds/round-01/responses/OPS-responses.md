# OPS – Phản hồi thẻ review Round 1 (Bước 4)

- Vai: OPS | Ngày: 15/10/2026 | Nguồn thẻ: `reviews/ARC-on-OPS.md` (12), `reviews/SEC-on-OPS.md` (13), `reviews/BE-on-ARC.md` thẻ FB-R1-BE-ARC-03 (phần OPS), yêu cầu INT (`responses/INT-responses.md` mục 4)
- **Kiểm chứng:** máy vẫn chưa có `node`, `pnpm`, `docker` (`which` → không tìm thấy) → **chưa chạy** install/lint/test/build/compose/`/health`. Chỉ kiểm tĩnh: YAML (4 tệp), JSON (22 tệp), `bash -n` script vai DB, độ dài dòng, cân ngoặc TS, dò chuỗi giống khóa bí mật. **Không báo xanh.**

## 1. Tổng hợp

| Trạng thái | Số thẻ |
|---|---|
| Done | 22 |
| Escalated | 1 (FB-R1-ARC-OPS-02 – phần đẩy GitHub, cần INV) |
| Deferred | 3 (Suggestion SEC-11, SEC-12, SEC-13 → R2) |
| Rejected | 0 |
| **Tổng** | **26** |

Blocker/Major còn Open: **0** (ARC-01, ARC-02, ARC-09, SEC-01, SEC-02, SEC-03, BE-ARC-03 đều đã xử lý; ARC-02 phần trong quyền OPS đã làm, phần còn lại chờ INV).

## 2. Thẻ ARC → OPS

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R1-ARC-OPS-01 (Major) | Done | Chọn cách (a): `engines` `>=22.12.0 <23` (gốc + api), `.nvmrc` `22` (bản 22 mới nhất ≥ 22.12), Docker `node:22-alpine@sha256:…`; `exports` của `@ottimo/contracts` và `@ottimo/integrations` thêm điều kiện `default`. `services/api/tsconfig.json` → `module/moduleResolution: NodeNext` và **TypeScript ~5.8.3** (TS 5.8 `nodenext` mô hình đúng `require(esm)` của Node 22; TS 5.7 + Node16 sẽ báo TS1479 chặn luôn cách (a)). Test chặn tái phát `services/api/test/workspace-packages.test.ts` gọi `require()` thật qua `createRequire`. ARC ghi lựa chọn vào ADR-012. |
| FB-R1-ARC-OPS-02 (Major) | Escalated – **ESC-013** (ORC lập 16/10 theo QC ĐK-1; INV đã chọn cài Node/Docker tại máy) | Phần OPS đã làm: `.github/gitleaks.toml` (allowlist có lý do: `product/legacy/`, lockfile, chuỗi `change_me_*dev_only`, `ci_*only`); CI khi chưa có lockfile tải `product/pnpm-lock.yaml` lên artifact `pnpm-lock` (7 ngày) để commit không cần Node ở máy; dev-setup mục 6 hướng dẫn. **Đẩy nhánh lên GitHub để chạy CI thật: OPS không tự làm** – cần INV cho phép (đề xuất ESC ở mục 6). Nếu INV cài xong Node/Docker trước: OPS/QA chạy đủ dev-setup ở máy (bước 5). Cho tới khi đó QC C2 "CI xanh" **chưa có bằng chứng**. |
| FB-R1-ARC-OPS-03 | Done | Cách (b): mỗi package bỏ `eslint .`, script `lint` đổi thành `typecheck` (`tsc --noEmit`); gốc `lint` = `eslint . && turbo run typecheck`; `turbo.json` task `typecheck`. |
| FB-R1-ARC-OPS-04 | Done | `TRUST_PROXY` (mặc định rỗng = không tin ai; số hop hoặc danh sách IP/CIDR; `true` bị từ chối khi khởi động) – `src/config.ts`; compose dev đặt rỗng; `.env.example` mục Core. Test `test/http.test.ts`: XFF bị bỏ qua khi không tin proxy, chỉ dùng khi đến từ proxy được liệt kê. |
| FB-R1-ARC-OPS-05 | Done | `src/http.ts`: serializer `req` chỉ ghi `id`, `method`, **mẫu route** (`routeOptions.url`); `res` chỉ `statusCode`; bỏ `url`, header, `remoteAddress`; che `x-csrf-token` + các khóa nhạy cảm. Test: `?phone=…&token=…` không xuất hiện trong log. |
| FB-R1-ARC-OPS-06 | Done | (1) Quyết định: kiểu sinh từ OpenAPI vào `packages/contracts/src/generated/` và **commit**, Docker không đọc `docs/` (ghi trong `.dockerignore`, dev-setup mục 7). (2) Bỏ `tests` khỏi `.dockerignore` → `tests/e2e` vào workspace không làm lệch lockfile. (3) `turbo prune @ottimo/api --docker` **dời R2** (cần lockfile) – đã ghi chú trong `Dockerfile.api`. |
| FB-R1-ARC-OPS-07 | Done | Chỉ `api` có `build`; `worker` dùng `image: ottimo-api:dev`, `pull_policy: never`, `depends_on api: service_started`. `Dockerfile.web` không `COPY` Caddyfile; compose dev mount `./caddy/Caddyfile.dev:/etc/caddy/Caddyfile:ro`. |
| FB-R1-ARC-OPS-08 | Done | Thêm `eslint-plugin-jsx-a11y` (recommended, `apps/**/*.tsx`); job CI `contract-lint`: `npx --yes @redocly/cli@1.34.21 lint product/docs/api/openapi.yaml`, `continue-on-error: true` ở R1, R2 bật chặn. Số lỗi lint chưa có (chưa chạy CI). |
| FB-R1-ARC-OPS-09 (Major) | Done | `hosting-plan.md` mục 7 + 7.1 viết lại: diễn tập trong compose project dùng một lần `ottimo-restore-<ngày>` (không publish cổng, volume tạm), KEK production chỉ nạp tạm trên tmpfs lúc diễn tập, áp `purge_journal`, kiểm `/health` + đếm bản ghi + giải mã 1 ảnh, `down -v`, biên bản; trước khi có dữ liệu thật diễn tập bằng backup staging; staging và môi trường diễn tập không dùng chung volume; **cấm** khôi phục backup production vào staging/dev. |
| FB-R1-ARC-OPS-10 | Done | `hosting-plan.md` mục 5.1: 3 tên miền con `desk.`/`staff.`/`g.` + tên miền gửi mail (SPF/DKIM/DMARC, bắt buộc từ R2); mục 9: chọn nhà cung cấp email + DNS trước staging R2; mục 7: tắt snapshot hãng hoặc ≤ 7 ngày. |
| FB-R1-ARC-OPS-11 | Done | Không cần OPS sửa (ARC chấp nhận vị trí compose); dev-setup đã ghi `infra/docker-compose.prod.yml` cho R2. |
| FB-R1-ARC-OPS-12 | Done | (1) Bỏ qua quy tắc Clock chỉ đúng `services/api/src/clock.ts`. (2) Thêm selector `Number.parseFloat` (toàn workspace và khối services). (3) Đổi `dev` sang `@swc-node/register`: **dời R2, BE quyết** khi có module thật (đổi giờ thêm phụ thuộc mà không chạy thử được). |

## 3. Thẻ SEC → OPS

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R1-SEC-OPS-01 (Major) | Done | `infra/postgres/init/02-roles.sh`: `ottimo_owner` (chủ DB/schema, migration), `ottimo_app` (`NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE NOINHERIT`, không sở hữu bảng, không có quyền DML mặc định – migration GRANT từng bảng), `ottimo_readonly` (`BYPASSRLS`, **NOLOGIN**, bật theo runbook). Áp cho `ottimo` và `ottimo_test`. Tên vai theo ERD 2.1 (`ottimo_owner`, không phải `ottimo_migrator` như thẻ đề xuất – cùng ý nghĩa). `DATABASE_URL` (app) / `MIGRATION_DATABASE_URL` (owner) tách trong `.env.example`, compose, CI. Superuser đổi tên mặc định `ottimo_admin`, ứng dụng không dùng. CI chạy cùng script rồi test bằng `ottimo_app`; `test/db-role.test.ts` kiểm `rolsuper`, `rolbypassrls` = false. Smoke test Docker cũng dùng `ottimo_app`. |
| FB-R1-SEC-OPS-02 (Major) | Done | Phần khung: như ARC-05 + `redact` `*.password/pin/otp/token/code/secret/docNumber/idNumber/authorization/cookie` với `censor: '[redacted]'`; không log body. Caddy dev không có access log (đã ghi chú). Caddyfile production (che `/g/*` và mọi query, gồm `/v1/webhooks/*`) là việc R2 đã ghi trong hosting-plan mục 7 và 9. |
| FB-R1-SEC-OPS-03 (Major) | Done | `hosting-plan.md` mục 7: tắt snapshot hãng (≤ 7 ngày nếu bắt buộc, thủ công xóa trong 24 giờ); đích backup chỉ ghi thêm (PA1 khóa chỉ `PutObject` + vòng đời ở đích; PA2 đích tự kéo bằng SSH chỉ đọc); PA2 backup trong tài khoản OS `backup` riêng, 0700, không mount vào container, staging không đọc được; diễn tập cách ly + `purge_journal` (mục 7.1). |
| FB-R1-SEC-OPS-04 | Done | Mọi action ghim SHA kèm tag (`checkout` v4.4.0, `setup-node` v4.4.0, `pnpm/action-setup` v4.4.0, `cache` v4.3.0, `upload-artifact` v4.6.2 – SHA tra bằng `git ls-remote` 15/10/2026); gitleaks theo digest; `persist-credentials: false` cho cả 4 checkout; ghi chú quyền cấp job cho deploy R2. |
| FB-R1-SEC-OPS-05 | Done | Thêm bước `pnpm audit --audit-level=high` (ngoại lệ có hạn ở `pnpm.auditConfig.ignoreCves`). Nhánh cài không lockfile: **giữ đến khi lockfile được commit** (không có Node để sinh), xóa ở cả CI và 2 Dockerfile ngay đầu R2 đúng như thẻ đề xuất; trivy image ở R3. |
| FB-R1-SEC-OPS-06 | Done | `.dockerignore` thêm `**/.data`, `*.pem`, `*.key`, `*.age`, `*.p12`, `*.pfx`, `id_rsa*`, `id_ed25519*`, `*.kdbx`, `*.dump`, `*.sql.gz`; `.gitignore` thêm `*.p12`, `*.pfx`, `id_rsa*`, `id_ed25519*`, `*.kdbx`. Gitleaks trên image: R2. |
| FB-R1-SEC-OPS-07 | Done | `Dockerfile.web`: Caddy chạy uid 10001, gỡ `cap_net_bind_service` khỏi binary (chỉ nghe cổng > 1024; tránh lỗi khi `cap_drop: [ALL]`), thư mục dữ liệu riêng. Base image `node`, `caddy`, `postgres` ghim digest (compose, Dockerfile, CI); Dependabot thêm hệ `docker-compose`. `cap_drop`/`read_only`/`no-new-privileges` ghi vào hosting-plan mục 5 cho compose production R2. |
| FB-R1-SEC-OPS-08 | Done | Như ARC-04. Production: `TRUST_PROXY` = IP cố định container Caddy, api không publish cổng (hosting-plan mục 5). |
| FB-R1-SEC-OPS-09 | Done | `src/config.ts` kiểm khi khởi động api + worker: `APP_ENV ∈ {dev,test,staging,production}` bắt buộc, tách khỏi `NODE_ENV` (Dockerfile không đặt `APP_ENV` → image không tự chạy); staging/production thiếu hoặc < 32 ký tự `SESSION_SECRET`/`ID_HASH_KEY`/`LOG_IP_HMAC_KEY`, `DATA_KEK_CURRENT` ≠ 32 byte → dừng; production cấm `CLOCK_OVERRIDE`, cấm `*_PROVIDER/*_MODE` = `mock`/`sandbox`; thông báo lỗi không chứa giá trị. `clockFromEnv` theo `APP_ENV`. Thêm biến `APP_ENV`, `MIGRATION_DATABASE_URL`, `LOG_IP_HMAC_KEY`, `GUEST_CODE_SIGNING_KEY` (tên tạm, BE/SEC chốt). 10 test ở `test/config.test.ts` + CI kiểm image từ chối chạy khi thiếu `APP_ENV`. Kiểm `BYPASSRLS` lúc khởi động (SR-SECR-05 d) để BE làm cùng `assertSafeConfig()` R2; hiện có test CI. |
| FB-R1-SEC-OPS-10 | Done | Hỗ trợ `<TÊN>_FILE` (Docker secrets 0400) cho mọi biến – `resolveFileSecrets`, có test; `hosting-plan.md` mục 8.1 "Sổ bí mật" (tên, môi trường, chủ, nơi giữ, chu kỳ xoay – không giá trị), dẫn `integrations.md` 4.1 cho bí mật tích hợp. Runbook xoay KEK: R2. |
| FB-R1-SEC-OPS-11 | Deferred | Caddyfile production R2 (CSP, HSTS, `Referrer-Policy: no-referrer`, 3 origin, che log, `curl -I` trong CI) – đã đưa vào hosting-plan mục 9. |
| FB-R1-SEC-OPS-12 | Deferred | R2 cùng Caddyfile production: `/health` công khai chỉ cho IP giám sát hoặc trả `{status}` – hosting-plan mục 5. |
| FB-R1-SEC-OPS-13 | Deferred | R2 khi có repo GitHub: CODEOWNERS cần tên tài khoản GitHub thật của đội (chưa có); branch protection, push protection, GHCR private – hosting-plan mục 9. |

## 4. Thẻ BE → ARC (phần OPS) và yêu cầu INT

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R1-BE-ARC-03 (Major, phần OPS) | Done | Như SEC-01 (3 vai, URL tách, áp cả `ottimo_test`, test `rolsuper/rolbypassrls`) + ARC-04 (`trustProxy`). Phần ARC (ERD 2.1/dev-setup) – ARC trả lời. |
| INT-responses mục 4 (yêu cầu OPS) | Done | `.env.example` theo README INT v0.2: mọi cổng mặc định `off` (`CHANNEL_PROVIDER`, `PAYMENT_*_MODE`, `BANKFEED_PROVIDER`, `EINVOICE_PROVIDER`), thêm `PAYMENT_METHODS_ENABLED`, `*_MOCK_SCENARIO`, `BANKFEED_API_KEY`, `BANKFEED_SOURCE_IP_ALLOWLIST`, `CHANNEL_WEBHOOK_PATH_TOKEN`, `CHANNEL_SYNC_FAILURE_ALERT_MINUTES`, `EMAIL_SES_REGION`, `PAYMENT_VIETQR_MODE`. Log Caddy production che query `/v1/webhooks/*` (hosting-plan mục 7, Caddyfile.dev ghi chú). Sổ bí mật mục 8.1 dẫn `integrations.md` 4.1. Khuôn bản ghi DNS SES Singapore (Easy DKIM ×3, MAIL FROM MX + SPF, DMARC) ở hosting-plan mục 5.1. **Lệch cần INT sửa:** README INT ghi `APP_ENV=development`; khung dùng `dev` theo SEC (thẻ SEC-OPS-09) và OpenAPI (`dev, test, staging`) – giá trị `development` sẽ bị từ chối khi khởi động. |

## 5. Yêu cầu ngược lại cho vai khác (OPS không sửa file của họ)

| Gửi | Yêu cầu |
|---|---|
| ARC | ADR-012: ghi Node ≥ 22.12 + `require(esm)`, TS 5.8 `nodenext` cho api, lint chạy một lần ở gốc + task `typecheck`, kiểu sinh từ OpenAPI được commit. Sửa lỗi Redocly khi job `contract-lint` có kết quả. |
| INT | `integrations/README.md` mục 4: đổi `APP_ENV=development` → `dev` (tập giá trị `dev | test | staging | production`). |
| BE | R2: migration GRANT quyền từng bảng cho `ottimo_app` (không có quyền mặc định), pg-boss cần schema do `ottimo_owner` tạo trước; `assertSafeConfig()` mở rộng từ `src/config.ts` (thêm kiểm `BYPASSRLS` lúc khởi động). |

## 6. Đề xuất ESC (ORC quyết có tạo hay gộp – OPS không sửa `02-escalations/`)

**ESC đề xuất – Cho phép đưa mã nguồn lên GitHub (repo riêng tư) để chạy kiểm tra tự động**
- Người tạo: OPS | Round: 1 | Mức khẩn: Bình thường (cần trước bước 2 Round 2)
- Bối cảnh: Bộ kiểm tra tự động (CI) đã viết xong nhưng chưa từng chạy, vì máy làm việc chưa có công cụ và mã chưa ở trên GitHub. Chưa chạy thì chưa chứng minh được khung sản phẩm "xanh" – QC sẽ không cho đạt tiêu chí khung + CI.
- Câu hỏi: Có cho đội tạo repo **riêng tư** trên GitHub (tài khoản do anh/chị đứng tên) và đẩy mã lên để chạy CI không?
- Phương án: A – repo riêng tư trên GitHub, gói miễn phí (2.000 phút CI/tháng cho repo riêng tư [Chưa xác minh hạn mức hiện tại]) – Ưu: CI chạy ngay, có lockfile từ artifact – Nhược: mã nằm trên dịch vụ nước ngoài (không có dữ liệu khách) – Chi phí: 0 đ. B – chỉ chạy ở máy sau khi cài Node/Docker – Ưu: không cần tài khoản – Nhược: không có kiểm tra tự động cho mỗi thay đổi ở R2.
- Đội đề xuất: A (và vẫn chạy thử ở máy khi cài xong).
- Nếu chưa quyết: QA/OPS chạy dev-setup ở máy khi có Node/Docker; CI để R2.

## Dòng decision-log đề xuất

| Ngày | Round | Quyết định | Người quyết | Lý do |
|---|---|---|---|---|
| 2026-10-15 | 1 | api CommonJS dùng gói ESM dùng chung qua `require(esm)`: Node ≥ 22.12, `exports` có `default`, TypeScript ~5.8 `nodenext` cho api, test `createRequire` chặn tái phát | OPS (ARC đồng ý cách a) | FB-R1-ARC-OPS-01 |
| 2026-10-15 | 1 | 3 vai DB `ottimo_owner` (migration) / `ottimo_app` (api, worker, test; NOSUPERUSER NOBYPASSRLS) / `ottimo_readonly` (BYPASSRLS, NOLOGIN, theo runbook); superuser `ottimo_admin` không bao giờ trong cấu hình ứng dụng; `DATABASE_URL` và `MIGRATION_DATABASE_URL` tách | OPS | FB-R1-SEC-OPS-01, FB-R1-BE-ARC-03, ERD 2.1 |
| 2026-10-15 | 1 | `APP_ENV` (`dev|test|staging|production`) quyết hành vi môi trường, không dùng `NODE_ENV`; api/worker dừng khi cấu hình sai (khóa thiếu/yếu ở staging/production, `CLOCK_OVERRIDE`/mock/sandbox ở production, `TRUST_PROXY=true`) | OPS | FB-R1-SEC-OPS-09, SR-SECR-05 |
| 2026-10-15 | 1 | Log request chỉ ghi method + mẫu route + status; không query, header, IP; `TRUST_PROXY` mặc định không tin ai | OPS | FB-R1-ARC-OPS-04/05, FB-R1-SEC-OPS-02/08 |
| 2026-10-15 | 1 | CI: action ghim SHA, image ghim digest, `persist-credentials: false`, `pnpm audit --audit-level=high`, Redocly lint (R1 không chặn), gitleaks có allowlist kèm lý do | OPS | FB-R1-SEC-OPS-04/05, FB-R1-ARC-OPS-02/08 |
| 2026-10-15 | 1 | Không khôi phục backup production vào staging/dev; diễn tập trong môi trường dùng một lần; tắt snapshot hãng (≤ 7 ngày nếu bắt buộc); đích backup chỉ ghi thêm | OPS | FB-R1-ARC-OPS-09, FB-R1-SEC-OPS-03, SR-BAK-03…06 |
| 2026-10-15 | 1 | Bí mật mạnh nạp qua Docker secrets (`<TÊN>_FILE`), sổ bí mật trong hosting-plan 8.1 | OPS | FB-R1-SEC-OPS-10 |
| 2026-10-15 | 1 | ESLint chạy một lần ở gốc workspace, mỗi package chỉ `typecheck`; thêm `jsx-a11y` | OPS (ARC chọn b) | FB-R1-ARC-OPS-03/08 |
