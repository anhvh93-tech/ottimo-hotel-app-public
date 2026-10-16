# OPS – Round 2, Tuần 1 (Đợt 0): chạy thật khung kỹ thuật (W3 + W4 + W18, ĐK-2 của QC R1)

- Vai: OPS | Ngày: 16/10/2026 | Không commit (theo chỉ đạo ORC)
- Máy: macOS 27 (Apple Silicon), Node **22.23.3**, pnpm **9.15.4** (corepack, `~/.local/bin`), Docker **29.8.2** + Compose **v5.5.0** (OrbStack), PostgreSQL trong container **17.11** (image `postgres:17-alpine@sha256:b0f9…2b24`)
- Cách làm: theo đúng `product/docs/dev-setup.md` từ đầu như dev mới (`cp .env.example .env` → mật khẩu dev ngẫu nhiên → `pnpm install` → các lệnh như CI → compose → kiểm vai DB → image production → gitleaks). Mọi kết quả dưới đây là **chạy thật**. Bước nào chưa chạy được ghi rõ ở mục 4.
- `product/.env`: tạo từ `.env.example`, 3 mật khẩu thay bằng `openssl rand -hex 24`, `chmod 600`. `git check-ignore` xác nhận bị `.gitignore` (dòng `.env`). Không mật khẩu nào xuất hiện trong log/tài liệu này.

## 1. Bảng kết quả

| # | Bước (lệnh) | Kết quả | Exit | Ghi chú / log ngắn |
|---|---|---|---|---|
| 1 | `pnpm install` (lần đầu, sinh lockfile) | OK | 0 | `Packages: +427 … Done in 25.6s`; sinh `product/pnpm-lock.yaml` (149 KB) |
| 2a | `pnpm audit --audit-level=high` (lần đầu) | **FAIL** (lỗi thật) | 1 | `16 vulnerabilities found – 8 moderate, 5 high, 3 critical`: `fastify@5.11.3` (qua `@nestjs/platform-fastify@11.2.7`, 4 High: GHSA-p68q-wchp-6fh7, -667r-xxjv-c9mm, -hwr6-493r-vm6h, -9q9j-q6p8-xq58); `vitest@2.1.9`/`tinypool@1.1.1` (3 Critical: GHSA-5xrq-8626-4rwp, -85c8-ppgw-ccpr, -5gmw-xhrv-c9v3); `vite@5.4.21` (High GHSA-fx2h-pf6j-xcff) |
| 2b | Sửa (xem 2.1) rồi `pnpm install` + `pnpm audit --audit-level=high` | OK | 0 | `No known vulnerabilities found` (cả mức moderate) |
| 3 | `pnpm format:check` | FAIL → sửa → OK | 1 → 0 | 5 file chưa đúng Prettier (2.2) → `All matched files use Prettier code style!` |
| 4 | `pnpm lint` (ESLint toàn workspace + `turbo run typecheck`) | FAIL → sửa → OK | 2 → 0 | ESLint sạch ngay lần đầu. Typecheck đỏ: `src/http.ts(51,5): error TS2322: Type 'TrustProxy' is not assignable … Type 'number' is not assignable` (2.3). Chạy lại ép không cache: `eslint .` exit 0; `turbo run typecheck --force` 8/8 task, exit 0 |
| 5a | `pnpm test` (chưa có DB) | FAIL → sửa → OK | 1 → 0 | `workspace-packages.test.ts › @ottimo/integrations exposes runtime values`: `No "exports" main defined in …/@ottimo/integrations/package.json` – đúng lỗi require(esm) mà test này được viết để bắt (2.4) |
| 5b | `docker compose … up -d postgres` | OK (sau khi macOS cấp quyền) | 0 | Lần đầu postgres treo ở `health: starting`, log trống: OrbStack chưa có quyền macOS đọc `~/Desktop` (2.5). Trong lúc chờ, chạy cùng compose + override cục bộ (bản sao init/Caddyfile ngoài Desktop, project `ottimo-w1`, cổng 55432) – init chạy đúng. Sau khi quyền được cấp, chạy lại **đúng compose gốc** (project `ottimo-dev`, cổng 5432): log `running …/01-extensions.sql`, `running …/02-roles.sh`, `02-roles.sh: roles ottimo_owner (NOLOGIN), ottimo_migrator, ottimo_app, ottimo_readonly ready on: ottimo ottimo_test` |
| 5c | `pnpm test` với `DATABASE_URL` (ottimo_app) + `MIGRATION_DATABASE_URL` (ottimo_migrator) → `ottimo_test` | FAIL (âm thầm) → sửa → OK | 0 | Lần đầu xanh nhưng `db-role.test.ts (5 tests \| 2 skipped)`: Turborepo lọc mất `MIGRATION_DATABASE_URL` (2.6). Sau sửa `turbo.json`: `@ottimo/api Tests 28 passed (28)`, 0 skipped; integrations 6, 3 app × 1 test; `turbo run test --force` 8/8, exit 0. Chạy cả trên DB của compose gốc (cổng 5432): 28/28 |
| 5d | Đối chứng: `db-role.test.ts` với `DATABASE_URL` = superuser `ottimo_admin` | Đỏ đúng như thiết kế | 1 | `× is not a superuser and cannot bypass RLS`, `× is not a member of ottimo_owner and owns nothing` |
| 6 | `pnpm build` | OK | 0 | `turbo run build --force` 6/6; 3 SPA Vite 7.3.7 build ~0.3 s/app; `services/api/dist` có `main.js`, `worker.js` |
| 6b | Chạy bản build trên máy: `APP_ENV=dev node dist/main.js` | OK | – | `GET /health` → `200 {"status":"ok","db":"ok","time":"2026-10-16T12:34:10.269+07:00"}` (require(esm) chạy thật trên Node 22.23) |
| 6c | `pnpm --filter @ottimo/api dev` (ts-node) và `pnpm dev:web` (mục 4 dev-setup) | OK | – | api dev `/health` 200; Vite 5173/5174/5175 đều 200, proxy `/health` qua 5173 → 200 |
| 7 | **TC-X-050** `docker compose --env-file .env -f infra/docker-compose.yml up --build -d` (= `pnpm dev`, chạy nền) | **OK** | 0 | 4 dịch vụ: `api Up (healthy)`, `postgres Up (healthy)`, `worker Up`, `web Up`; cổng chỉ `127.0.0.1`. `curl -i :3000/health` → `HTTP/1.1 200 OK {"status":"ok","db":"ok","time":"2026-10-16T12:40:56.590+07:00"}`; qua Caddy `:8081/health` → 200; `:8081/ :8082/ :8083/` → 200. Dừng postgres → `:3000/health` và `:8081/health` → `503 {"status":"error","db":"down",…}`; bật lại → 200. Worker log `{"msg":"worker started (skeleton)","db":"ok"}`. `pg_stat_activity`: api kết nối bằng `ottimo_app` |
| 8 | **TC-X-065 / SEC-06** 4 vai DB trên PostgreSQL 17.11 thật | **OK** | 0 | Bảng 3.1. `ottimo_owner` đăng nhập → `FATAL: role "ottimo_owner" is not permitted to log in`. Test vai migrator: chỉ CREATE trên `public` sau `SET ROLE ottimo_owner` (xanh). Chạy lại `02-roles.sh` trên volume đang dùng: exit 0. Giả lập volume cũ (owner LOGIN + mật khẩu, `ottimo_app` thành viên owner, INHERIT) → chạy lại script → owner `NOLOGIN`, mật khẩu NULL; `ottimo_app` NOINHERIT, không còn là thành viên owner |
| 9 | **TC-X-066 / SEC-08** image api production (`INCLUDE_TEST_SUPPORT=0`, mặc định) + `check-no-test-surface.sh` | **OK** (a, b, c) · (d) chưa chứng minh được | 0 | (a) `spec docs/api/openapi.yaml` → exit 0. (b) đối chứng `spec docs/api/openapi.test.yaml` → exit 1, chỉ ra `/__test__/clock`, `/__test__/jobs/{jobKey}/run`. (c) `docker build -f infra/docker/Dockerfile.api -t ottimo-api:ci .` → exit 0; chép `/app/dist` (không có `/app/node_modules/@ottimo` – gói dùng chung là devDependency, không vào image) → `bundle` exit 0 `OK: no test-only code`. Đối chứng thêm: thư mục giả chứa `"/__test__/clock"` → exit 1. (d) build `INCLUDE_TEST_SUPPORT=1` → `bundle` vẫn exit 0 vì **chưa có** `src/test-support/` (BE làm ở R2) – chạy lại (d) khi BE merge TestSupportModule |
| 9b | Smoke như job `docker-build`: chạy image `ottimo-api:ci` với `APP_ENV=test` | OK | – | `/health` 200 `db: ok`; chạy **không** `APP_ENV` → thoát exit 1 `ConfigError: Invalid configuration: APP_ENV must be one of dev, test, staging, production`. Image chạy user `node` (uid 1000), web Caddy uid 10001; `node_modules` chỉ có `@nestjs`, `pg`, `reflect-metadata`, `rxjs` (31 MB) |
| 10 | **W3 / SEC-R1-24** bỏ nhánh `--no-frozen-lockfile` (CI + 2 Dockerfile), cài lại `--frozen-lockfile` | **OK** | 0 | Máy: `pnpm install --frozen-lockfile` → `Lockfile is up to date … Done`. Docker: cả 2 image build bằng `RUN pnpm install --frozen-lockfile` → exit 0. Đối chứng: build trên bản sao **không** có lockfile → exit 1 `ERR_PNPM_LOCKFILE_CONFIG_MISMATCH … Cannot proceed with the frozen installation` |
| 10b | W3 phần `turbo prune` (FB-R1-ARC-OPS-06) | OK | 0 | `Dockerfile.api` dùng `turbo prune @ottimo/api --docker` (lockfile cắt gọn vẫn `--frozen-lockfile`). Lần đầu đỏ `error TS5083: Cannot read file '/repo/tsconfig.base.json'` → chép thêm file này → xanh; image, quét bundle và smoke `/health` chạy lại với bản này: đều đạt |
| 11 | Redocly lint `npx --yes @redocly/cli@1.34.21 lint product/docs/api/openapi.yaml` (job `contract-lint`) | **FAIL** (chỉ báo cáo ở R1) | 1 | `24 errors and 77 warnings`: `operation-summary: 24` (error), `operation-4xx-response: 71`, `no-invalid-media-type-examples: 2`, `info-license`, `no-server-example.com`, `tag-description` (warning). File của ARC – OPS không sửa. Job này để `continue-on-error` ở R1; plan R2 muốn nó chặn → cần ARC sửa trước |
| 12 | gitleaks (image chính thức `ghcr.io/gitleaks/gitleaks:v8.21.2@sha256:0e99…7f46`, cùng bản ghim với CI) | FAIL → sửa → **OK** | 1 → 0 | Quét lịch sử git (18 commit, bản clone) và cây làm việc hiện tại (bỏ `node_modules`, `.env`). Lần đầu: `leaks found: 1` – `generic-api-key` ở `product/services/api/test/http.test.ts:58` (giá trị giả `tok_SECRET_123` trong test chống lộ log, commit a561414). Đã thêm allowlist có lý do (2.7) → cả hai lần quét `no leaks found`, exit 0 |
| 13 | CI trên GitHub (5 job) | **CHƯA CHẠY** | – | Chưa có repo GitHub riêng tư (INV tạo). Không báo xanh |
| 14 | Dọn: `docker compose … down` (giữ volume) | OK | 0 | Không còn container `ottimo*`. Volume giữ lại: `ottimo-dev_pgdata` (DB dev chuẩn); `ottimo-w1_pgdata` (volume tạm của lần chạy override – xóa được, xem 4) |

## 2. Lỗi gặp phải và đã sửa

### 2.1 Lỗ hổng phụ thuộc High/Critical (audit đỏ thật – không tắt bước)
- `product/package.json` → `pnpm.overrides.fastify = "^5.12.7"`: `@nestjs/platform-fastify@11.2.7` (bản 11.x mới nhất) khóa cứng `fastify@5.11.3`. Giữ NestJS 11 theo ADR-002; chỉ nâng fastify trong cùng major 5. Bỏ ghi đè khi Nest có bản 11.x dùng fastify đã vá (hoặc khi ARC quyết lên Nest 12).
- Nâng công cụ test/build: `vitest ^2.1.8 → ^4.1.12` (6 package), `vite ^5.4.11 → ^7.3.7`, `@vitejs/plugin-react ^4.3.4 → ^5.2.0` (3 app), `unplugin-swc ^1.5.1 → ^1.6.0` (api). Không phải sửa cấu hình Vitest/Vite; mọi test vẫn xanh. Đây là thay đổi phiên bản trong ADR-012 (ARC sở hữu) – đề nghị ARC ghi nhận.

### 2.2 Prettier
- `integrations/contracts/common.ts`, `integrations/contracts/notification.ts`, `integrations/notification/mock.test.ts`, `integrations/tsconfig.json`, `services/api/test/db-role.test.ts`: chỉ chạy `prettier --write`, không đổi nội dung.

### 2.3 Typecheck – `TRUST_PROXY` dạng số bước (hop count)
- Fastify ≥ 5.12 bỏ kiểu `number` khỏi `trustProxy` và lúc chạy **không tin** proxy theo số bước (bản vá GHSA-3m5p-2c4r-xxw2: không kiểm được địa chỉ proxy → giả mạo `X-Forwarded-For`).
- `services/api/src/config.ts`: `TrustProxy = false | string[]`; `TRUST_PROXY` là số → `ConfigError` (fail-fast). `services/api/test/config.test.ts`: đổi kỳ vọng `parseTrustProxy('1')` thành ném lỗi. `.env.example`: bỏ "hop count" khỏi chú thích. Không ảnh hưởng hosting-plan (production đã dùng IP Caddy). **BE/SEC xem lại** (code của BE).

### 2.4 ESM/CJS – `require(esm)` của gói `@ottimo/integrations`
- `integrations/package.json` → `exports` chỉ có điều kiện `import`; api CommonJS gọi `require()` nên không khớp. Thêm `"default"` cho `.` và `./contracts` (giống `@ottimo/contracts`). Test `workspace-packages.test.ts` bắt đúng lỗi này (thẻ FB-R1-ARC-OPS-01 có tác dụng).

### 2.5 macOS chặn bind mount từ `~/Desktop` (môi trường, không phải lỗi mã)
- Triệu chứng: postgres treo `health: starting`, `docker logs` trống, `docker top` cho thấy `ls /docker-entrypoint-initdb.d/` treo, `docker stop` báo `did not receive an exit event`.
- Nguyên nhân: OrbStack chưa được macOS cho quyền đọc thư mục Desktop. Sau khi quyền được cấp trên máy (khoảng 12:40), bind mount chạy bình thường và volume tự hoàn tất init.
- Đã bổ sung vào `dev-setup.md` (mục 1 + bảng sự cố). OPS **không** đổi cài đặt bảo mật của máy.

### 2.6 Turborepo lọc mất `MIGRATION_DATABASE_URL`
- `turbo.json` task `test` chỉ khai báo `env: ["DATABASE_URL"]`; Turbo 2 chạy chế độ env nghiêm ngặt → 2 test vai migrator **bị bỏ qua mà CI vẫn xanh** (đây là lỗ hổng của W18/SEC-06). Sửa: `env: ["DATABASE_URL", "MIGRATION_DATABASE_URL"]`. Kết quả 28/28, 0 skipped.

### 2.7 gitleaks báo nhầm giá trị giả trong test
- `.github/gitleaks.toml` thêm regex allowlist `[a-z]+_SECRET_[0-9]+` kèm lý do (giá trị đánh dấu trong test chống lộ log; khóa thật không có dạng này). Giữ nguyên bộ luật mặc định. Phải dùng allowlist (không sửa test) vì giá trị đã nằm trong lịch sử git.

### 2.8 Bỏ nhánh không có lockfile (W3, SEC-R1-24) + `turbo prune`
- `.github/workflows/ci.yml`: bước Install chỉ còn `pnpm install --frozen-lockfile`; bỏ bước tải artifact `pnpm-lock`; `setup-node` bật `cache: pnpm` cố định.
- `infra/docker/Dockerfile.api`, `Dockerfile.web`: chỉ `RUN pnpm install --frozen-lockfile`. `Dockerfile.api` thêm stage `prune` (`turbo@2.11.8`, khớp lockfile) + chép `tsconfig.base.json`.

### 2.9 Tài liệu `dev-setup.md` sai/thiếu (đã sửa)
| Chỗ | Sai/thiếu | Sửa |
|---|---|---|
| Đầu trang | Ghi "chưa được chạy thật" | Cập nhật trạng thái kiểm chứng R2 W1, trỏ tới file này |
| Mục 1 – pnpm | `corepack enable` cần quyền ghi thư mục Node; Corepack hỏi khi tải | Thêm `--install-directory ~/.local/bin`, `COREPACK_ENABLE_DOWNLOAD_PROMPT=0` |
| Mục 1 – macOS | Không nói về quyền thư mục Desktop/Documents/Downloads | Thêm đoạn "macOS – quyền thư mục" |
| Mục 2 – `.env` | Chỉ nói dùng giá trị mẫu | Thêm lệnh sinh 3 mật khẩu ngẫu nhiên đổi đồng thời biến và URL, `chmod 600` |
| Mục 5 – `pnpm test` | Chỉ nêu `DATABASE_URL` → test migrator bị bỏ qua | Lệnh đầy đủ 2 biến, lấy mật khẩu từ `.env`; kết quả mong đợi 28 passed, không skipped; giải thích Turbo lọc biến |
| Mục 6 – Lockfile | Hướng dẫn nhánh "chưa có lockfile"/artifact CI | Viết lại: lockfile bắt buộc, frozen ở CI/Docker, ghi chú ghi đè fastify |
| Mục 7 | Không nói `turbo prune` | Cập nhật dòng Dockerfile |
| Mục 8 – sự cố | Thiếu 5 tình huống gặp thật | Thêm: quyền macOS, lockfile lệch, `TRUST_PROXY` số bước, test bị skipped, `No "exports" main defined` |

Phần còn đúng nguyên văn khi làm theo: tạo `.env`, `pnpm dev` (compose), địa chỉ/cổng, dạng phản hồi `/health` `{"status":"ok","db":"ok","time":"…+07:00"}`, lệnh chạy lại `02-roles.sh` trên volume cũ, `pnpm dev:web`, nạp `.env` cho `pnpm --filter @ottimo/api dev`.

Ghi chú cho QC: tiêu chí ĐK-2 ghi "`db: up`"; hợp đồng thật (`openapi.yaml`/`dev-setup.md`/test) là `"db":"ok"` – kết quả 200 `db: ok` là đạt.

## 3. Bằng chứng chi tiết

### 3.1 Thuộc tính vai (PostgreSQL 17.11, volume `ottimo-dev_pgdata`, sau `02-roles.sh`)
```
     rolname     | login | super | bypassrls | inherit | has_pw
 ottimo_app      | t     | f     | f         | f       | t
 ottimo_migrator | t     | f     | f         | f       | t
 ottimo_owner    | f     | f     | f         | t       | f
 ottimo_readonly | f     | f     | t         | t       | f

   granted    |     member      | inherit_option | set_option
 ottimo_owner | ottimo_migrator | f              | t

 datname ottimo, ottimo_test → owner ottimo_owner; extension btree_gist, citext, pgcrypto (cả 2 DB)
```
Khớp erd.md 2.1 / dev-setup mục 2: owner NOLOGIN không mật khẩu; migrator là thành viên owner kiểu `INHERIT FALSE, SET TRUE` (cú pháp PG ≥ 16 chạy được trên 17); app không superuser, không BYPASSRLS, không thuộc owner; readonly BYPASSRLS + NOLOGIN.

### 3.2 Vitest (api, có DB)
```
✓ test/workspace-packages.test.ts (2 tests)
✓ test/config.test.ts (10 tests)
✓ test/clock.test.ts (5 tests)
✓ test/db-role.test.ts (5 tests)
✓ test/http.test.ts (3 tests)
✓ test/health.test.ts (3 tests)
Test Files 6 passed (6) · Tests 28 passed (28)
```

## 4. Việc còn lại
1. **CI trên GitHub chưa chạy** (5 job: build-test, test-surface-guard, contract-lint, secrets-scan, docker-build): cần repo GitHub riêng tư (INV tạo, ESC-013 phương án B). ĐK-2 yêu cầu "link một lần chạy CI xanh đủ 5 job" → **chưa đạt** phần này. Chưa kiểm trên runner: bước `bash infra/postgres/init/02-roles.sh` gọi `psql` có sẵn của ubuntu-24.04 (client 16 nối server 17 – kỳ vọng chạy được).
2. **Redocly đỏ** 24 lỗi `operation-summary` trong `docs/api/openapi.yaml` → ARC sửa trước khi bỏ `continue-on-error` (nếu không job `contract-lint` sẽ đỏ khi chuyển sang chặn).
3. **TC-X-066 (d)** chỉ chứng minh được khi BE merge `src/test-support/` (TestSupportModule).
4. **ARC ghi nhận** đổi phiên bản trong ADR-012: Vitest 4, Vite 7, plugin-react 5, override fastify ^5.12.7; ESLint 9.39 đã bị đánh dấu deprecated (ESLint 10 có sẵn) – lên kế hoạch nâng, không chặn.
5. **BE/SEC xem lại** thay đổi `TRUST_PROXY` (bỏ số bước) trong `config.ts`.
6. **Commit** (ORC/INV): `product/pnpm-lock.yaml` + các file ở mục 5. `product/.env` không commit.
7. Dọn máy (không bắt buộc, chủ máy tự làm): volume tạm `ottimo-w1_pgdata` (`docker volume rm ottimo-w1_pgdata`), image tạm `ottimo-api:prune`, `ottimo-api:ts1`, `ottimo-api:ci`, `ottimo-web:ci`. OPS không tự xóa volume (hành động xóa dữ liệu bị chặn quyền).
8. QA cập nhật test-report: TC-X-050 Đạt, TC-X-065 Đạt, TC-X-066 (a)(b)(c) Đạt, (d) chờ BE. SEC xem xét đóng BUG-R1-SEC-06 (vai DB) và SEC-08 (phần bundle/spec) dựa trên lần chạy cục bộ này, hoặc chờ CI.

## 5. File đã tạo/sửa
- Tạo: `product/pnpm-lock.yaml`, `rounds/round-02/outputs/OPS/w1-skeleton-run.md`, `product/.env` (cục bộ, bị .gitignore)
- Sửa: `.github/workflows/ci.yml`, `.github/gitleaks.toml`, `product/package.json`, `product/turbo.json`, `product/.env.example`, `product/apps/{admin-web,guest-web,mobile}/package.json`, `product/packages/contracts/package.json`, `product/services/api/package.json`, `product/services/api/src/config.ts`, `product/services/api/test/config.test.ts`, `product/services/api/test/db-role.test.ts` (định dạng), `product/integrations/package.json`, `product/integrations/tsconfig.json`, `product/integrations/contracts/{common,notification}.ts`, `product/integrations/notification/mock.test.ts` (định dạng), `product/infra/docker/Dockerfile.api`, `product/infra/docker/Dockerfile.web`, `product/docs/dev-setup.md`
