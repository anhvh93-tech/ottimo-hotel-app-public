# Hướng dẫn dựng máy dev – OTTIMO Desk

- Người viết: OPS | Round 1 – Đợt 3, sửa ở Bước 4; chạy thật và sửa ở Round 2 – Tuần 1 (W3/W4/W18) và Đợt 0 (migrate, đồng hồ, test-support – `rounds/round-02/outputs/OPS/d0-followups.md`) | Ngày: 16/10/2026
- Liên quan: `architecture.md` mục 17, ADR-012 (công cụ), ADR-003 (PostgreSQL 17), `product/.env.example`
- Mục tiêu: người mới clone repo chạy được hệ thống ở máy local trong **< 15 phút**.

> Trạng thái kiểm chứng (R2 – Tuần 1, 16/10/2026): OPS đã làm lại toàn bộ hướng dẫn này từ đầu trên macOS (Apple Silicon) với Node 22.23.3, pnpm 9.15.4, Docker 29.8.2 + Compose v5.5.0 (OrbStack). Các bước sau đã chạy thật: `pnpm install`, audit, format, lint + typecheck, test (có PostgreSQL 17.11), build, `docker compose up` (api/worker/web/postgres), `/health` 200, 4 vai DB, image production và quét bundle, gitleaks. Lỗi gặp phải đã sửa trong khung và trong tài liệu này; nhật ký: `rounds/round-02/outputs/OPS/w1-skeleton-run.md`. **Chưa chạy:** CI trên GitHub (chưa có repo). R2 – Đợt 0 (16/10/2026): chạy thật `pnpm db:migrate`, `drizzle-kit generate` (không sinh file), compose với dịch vụ `migrate` (`/health` 200, worker chạy job), migrate từ image production (2 lần, lần 2 no-op), E2E smoke – nhật ký `rounds/round-02/outputs/OPS/d0-followups.md`.

## 1. Cài công cụ (một lần)

| Công cụ | Phiên bản | Cách cài gợi ý (macOS) | Ghi chú |
|---|---|---|---|
| Git | bất kỳ bản mới | có sẵn hoặc Xcode Command Line Tools | |
| Node.js | **22 LTS, tối thiểu 22.12** (xem `product/.nvmrc`, `engines`) | `nvm install 22` hoặc `fnm install 22` hoặc bộ cài từ nodejs.org | Không dùng Node 23/24 hay 22 < 22.12: api (CommonJS) cần `require()` được gói ESM dùng chung – chỉ có sẵn từ 22.12 (ADR-012, thẻ FB-R1-ARC-OPS-01) |
| pnpm | **9.15.x** (khóa trong `product/package.json` → `packageManager`) | `corepack enable` (Corepack có sẵn trong Node 22). Không có quyền ghi vào thư mục cài Node: `corepack enable --install-directory ~/.local/bin` (thêm `~/.local/bin` vào `PATH`) | Corepack tự tải đúng phiên bản pnpm; đặt `COREPACK_ENABLE_DOWNLOAD_PROMPT=0` để khỏi bị hỏi khi chạy script |
| Docker | Docker Desktop, OrbStack hoặc Colima (+ docker CLI, compose v2 ≥ 2.24) | tự chọn | Cần cho PostgreSQL và chạy cả hệ thống |

Windows: dùng WSL2 (Ubuntu) + Docker Desktop; làm mọi lệnh bên trong WSL.

**macOS – quyền thư mục (gặp thật ở R2):** nếu repo nằm trong `~/Desktop`, `~/Documents` hoặc `~/Downloads`, macOS bắt Docker Desktop/OrbStack xin quyền truy cập thư mục đó. Khi chưa cho phép, mọi bind mount (`infra/postgres/init`, `Caddyfile.dev`) bị treo: postgres đứng mãi ở `health: starting`, `docker logs` trống, `docker stop` báo lỗi. Cách làm: bấm **Cho phép** khi macOS hỏi (hoặc System Settings → Privacy & Security → Files and Folders → bật mục thư mục đó cho OrbStack/Docker), hoặc clone repo vào thư mục khác như `~/code/hotel-app` (khuyến nghị).

## 2. Lấy mã và cấu hình

```bash
git clone <repo-url> hotel-app
cd hotel-app/product
cp .env.example .env
```

Mở `product/.env`. Giá trị mẫu chạy được ngay ở máy dev; nên thay 3 mật khẩu mẫu, `TEST_SUPPORT_TOKEN` và `QA_SEED_PASSWORD` bằng chuỗi ngẫu nhiên (lệnh dưới đổi đồng thời cả biến mật khẩu lẫn URL, không in giá trị ra màn hình). Nếu tự đổi tay thì đổi **cho khớp từng cặp**:

```bash
chmod 600 .env
sed -i.bak -e "s/change_me_admin_dev_only/$(openssl rand -hex 24)/g" \
  -e "s/change_me_app_dev_only/$(openssl rand -hex 24)/g" \
  -e "s/change_me_migrator_dev_only/$(openssl rand -hex 24)/g" \
  -e "s/change_me_test_support_token_dev_only/$(openssl rand -hex 24)/g" \
  -e "s/^QA_SEED_PASSWORD=.*/QA_SEED_PASSWORD=$(openssl rand -hex 24)/" .env && rm .env.bak
```

**`.env` tạo trước R2 – Đợt 0** (chưa có các dòng dưới): chép từ `.env.example` vào `.env` các dòng `CLOCK_MODE`, `INCLUDE_TEST_SUPPORT`, `TEST_SUPPORT_TOKEN` (≥ 32 ký tự, `openssl rand -hex 24`), `COOKIE_SECURE_PREFIX`, `QA_SEED_PASSWORD`, và **xóa dòng `CLOCK_OVERRIDE`** – từ R2 đặt `CLOCK_OVERRIDE` khác rỗng là api/worker dừng.

Biến đồng hồ và kiểm thử (ADR-008, `docs/api/openapi.test.yaml`):

| Biến | dev (mẫu) | staging | production | Ghi chú |
|---|---|---|---|---|
| `CLOCK_MODE` | `mutable` | `mutable` hoặc `system` | **chỉ `system`** | `mutable` = đồng hồ giả dùng chung api ↔ worker (bảng `dev_clock`), chỉnh qua `POST /__test__/clock` |
| `INCLUDE_TEST_SUPPORT` | `1` | `1` khi QA cần | **cấm `1`** | Trong compose cũng là build-arg của image api: `0` → image không có `dist/test-support` |
| `TEST_SUPPORT_TOKEN` | ngẫu nhiên ≥ 32 ký tự | secret riêng | **phải trống** | Gửi qua header `X-Test-Token` **kèm** phiên owner; khác mọi khóa khác |
| `COOKIE_SECURE_PREFIX` | `false` (http://localhost) | **`true`** | **`true`** | `false` chỉ được nhận ở `dev`/`test` |
| `TRUST_PROXY` | trống | **bắt buộc** (IP/CIDR Caddy, dải nội bộ) | **bắt buộc** | Dải rộng hơn /8 (IPv4) hoặc /16 (IPv6) bị từ chối |
| `QA_SEED_PASSWORD` | ngẫu nhiên | secret riêng | **không đặt** | Mật khẩu loader DS-E gán cho mọi tài khoản `qa.*` |


| Biến mật khẩu | Phải khớp với |
|---|---|
| `POSTGRES_PASSWORD` (superuser `ottimo_admin` – chỉ để quản trị, ứng dụng **không** dùng) | – |
| `OTTIMO_APP_DB_PASSWORD` (vai `ottimo_app` – api, worker, test) | mật khẩu trong `DATABASE_URL` |
| `OTTIMO_MIGRATOR_DB_PASSWORD` (vai `ottimo_migrator` – chỉ chạy migration; `ottimo_owner` là `NOLOGIN`, không có mật khẩu) | mật khẩu trong `MIGRATION_DATABASE_URL` |

Không điền khóa thật của VNPay/MoMo/MISA/Beds24/Zalo – mặc định mọi tích hợp ở chế độ `mock`/`manual`. `APP_ENV=dev` là bắt buộc (api/worker từ chối khởi động nếu thiếu). Các khóa `SESSION_SECRET`, `DATA_KEK_CURRENT`, `ID_HASH_KEY`, `LOG_IP_HMAC_KEY`, `GUEST_CODE_SIGNING_KEY` (mỗi mục đích một khóa – ADR-013 điểm 5) được để trống ở `dev`/`test`; ở `staging`/`production` thiếu hoặc ngắn hơn 32 ký tự thì ứng dụng **dừng** (tạo bằng `openssl rand -base64 32`).

### Kiểm Origin của api trong compose (SR-SES-04/09)

Compose dev **không** bật danh sách origin của api (`ADMIN_BASE_URL`/`STAFF_BASE_URL`/`GUEST_BASE_URL` rỗng → không kiểm Origin), để FE chạy dev-server ở cổng bất kỳ. Muốn chạy stack giống staging (kiểm Origin, ví dụ để TC-SEC-024 không bị bỏ qua), thêm vào `product/.env` rồi `pnpm dev` lại:

```bash
API_ADMIN_BASE_URL=http://localhost:8081
API_STAFF_BASE_URL=http://localhost:8082
API_GUEST_BASE_URL=http://localhost:8083
```

Khi bật: mở web bằng `http://localhost:808x` (không dùng `127.0.0.1` – Origin khác → 403), và E2E gửi đúng origin đó (`E2E_ORIGIN`, `E2E_GUEST_ORIGIN`; mặc định lấy `APP_BASE_URL`/`GUEST_BASE_URL` của `.env`). Hai khóa `APP_BASE_URL`/`GUEST_BASE_URL` trong `.env` là cho bộ E2E, compose không chuyển chúng vào api. CI (job `docker-build`) luôn bật ba khóa trên và có bước kiểm TC-SEC-024 thật sự chạy.

### Vai cơ sở dữ liệu (erd.md 2.1, SR-AZ-06)

`infra/postgres/init/02-roles.sh` tạo khi volume DB mới được tạo (và CI chạy cùng script):

| Vai | Dùng cho | Thuộc tính |
|---|---|---|
| `ottimo_admin` (`POSTGRES_USER`) | quản trị, script init | superuser – **không bao giờ** nằm trong cấu hình ứng dụng |
| `ottimo_owner` | chủ database/schema `public`, hàm `SECURITY DEFINER`, schema `pgboss` | `NOLOGIN`, không mật khẩu, không superuser – không ai đăng nhập bằng vai này |
| `ottimo_migrator` | migration (`MIGRATION_DATABASE_URL`) | `LOGIN NOSUPERUSER NOBYPASSRLS`, thành viên `ottimo_owner` kiểu `NOINHERIT`: migration phải `SET ROLE ottimo_owner` trước khi chạy DDL (để lại dấu vết) |
| `ottimo_app` | api, worker, test (`DATABASE_URL`) | `NOSUPERUSER NOBYPASSRLS`, không sở hữu bảng; quyền từng bảng do migration `GRANT` |
| `ottimo_readonly` | sao lưu, tra cứu sự cố | `BYPASSRLS`, tạo ở trạng thái `NOLOGIN`; chỉ bật đăng nhập theo runbook (SR-OPS-04) |

Giới hạn mặc định của vai `ottimo_app` (FB-R2-SEC-BE-23, đặt trong `02-roles.sh` bằng `ALTER ROLE … SET`, áp khi kết nối mới): `idle_in_transaction_session_timeout = 30s` (phiên mở giao dịch rồi bỏ đó quá 30 s bị PostgreSQL ngắt, nhả khóa dòng) và `statement_timeout = 15s`. Giao dịch của api vẫn tự `SET LOCAL lock_timeout 5s / statement_timeout 15s` (job 10 s); báo cáo dài phải tự `SET LOCAL statement_timeout` lớn hơn. `ottimo_migrator` không bị giới hạn (migration có thể chạy lâu). **Volume DB tạo trước Sprint 2 – bước Phản hồi & sửa** chưa có hai giá trị này – áp bằng một trong hai cách (không mất dữ liệu):

```bash
# cách 1: chạy lại script vai (idempotent)
docker compose --env-file .env -f infra/docker-compose.yml exec postgres bash /docker-entrypoint-initdb.d/02-roles.sh
# cách 2: chỉ hai lệnh
docker compose --env-file .env -f infra/docker-compose.yml exec postgres sh -c \
  'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "ALTER ROLE ottimo_app SET idle_in_transaction_session_timeout = '"'"'30s'"'"'" -c "ALTER ROLE ottimo_app SET statement_timeout = '"'"'15s'"'"'"'
# rồi khởi động lại api/worker để kết nối mới nhận giá trị
docker compose --env-file .env -f infra/docker-compose.yml restart api worker
# kiểm tra
docker compose --env-file .env -f infra/docker-compose.yml exec postgres sh -c \
  'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tc "SELECT rolconfig FROM pg_roles WHERE rolname = '"'"'ottimo_app'"'"'"'
```

Test `services/api/test/db-role.test.ts` sẽ **đỏ** nếu `DATABASE_URL` trỏ tới superuser hoặc vai có `BYPASSRLS`, nếu `ottimo_owner` đăng nhập được, hoặc `MIGRATION_DATABASE_URL` không phải `ottimo_migrator` – đây là chủ ý: test RLS chạy bằng superuser không chứng minh được gì.

Quy tắc bí mật:
- `.env` đã nằm trong `.gitignore` – không bao giờ commit. Chỉ `.env.example` (placeholder) được commit.
- CI chạy `gitleaks` quét toàn bộ lịch sử git; commit lỡ chứa khóa sẽ làm CI đỏ → phải xoay (đổi) khóa đó, không chỉ xóa commit.

## 3. Chạy toàn hệ thống bằng 1 lệnh (Docker Compose)

```bash
cd product
pnpm dev          # = docker compose --env-file .env -f infra/docker-compose.yml up --build
```

Thứ tự khởi động: `postgres` (healthy) → **`migrate`** (một lần: `node dist/db/migrate-cli.js`, đăng nhập `ottimo_migrator` rồi `SET ROLE ottimo_owner`, áp migration còn thiếu, chạy lại = không làm gì; in `{"msg":"migrations applied"}` rồi thoát 0) → `api`, `worker` (chỉ chạy khi `migrate` thoát 0) → `web`. `migrate` lỗi thì api/worker không khởi động – xem `docker compose … logs migrate`. Chỉ dịch vụ `migrate` nhận `MIGRATION_DATABASE_URL`; api/worker chỉ có `DATABASE_URL` (`ottimo_app`).

| Dịch vụ | Địa chỉ | Ghi chú |
|---|---|---|
| PostgreSQL 17 | `localhost:5432` | DB `ottimo` (+ `ottimo_test` cho test); extension `btree_gist`, `pgcrypto`, `citext` và 4 vai `ottimo_owner` (NOLOGIN) / `ottimo_migrator` / `ottimo_app` / `ottimo_readonly` tạo sẵn khi volume mới |
| api | http://localhost:3000/health | trả `{"status":"ok","db":"ok","time":"…+07:00"}`; 503 nếu DB không trả lời. Dev có `/__test__/*` (không token → 401) |
| migrate | (không có cổng) | chạy một lần rồi thoát – `docker compose ps -a` hiện `Exited (0)` là đúng |
| worker | (không có cổng) | job chạy theo phút (`JobRunner`, hiện có `log.partitions`); log `worker started`, `job done …` |
| web – admin-web | http://localhost:8081 | Caddy (chạy user không đặc quyền) phục vụ bản build tĩnh; `/health`, `/v1/*` được chuyển tới api; Caddyfile dev được mount từ `infra/caddy/Caddyfile.dev` |
| web – mobile (PWA) | http://localhost:8082 | |
| web – guest-web | http://localhost:8083 | |

Mọi cổng chỉ mở trên `127.0.0.1` (không lộ ra mạng LAN).

Kiểm tra nhanh:
```bash
curl -i http://localhost:3000/health
curl -i http://localhost:8081/health      # qua Caddy
docker compose --env-file .env -f infra/docker-compose.yml ps
```

E2E smoke (Playwright, `tests/e2e`) trên stack đang chạy: `pnpm test:e2e`. TC-X-050c (dừng/bật postgres) chỉ chạy khi `E2E_COMPOSE_CONTROL=1` – đừng bật trên DB dev dùng chung. Chạy thử như CI mà không đụng stack dev: `COMPOSE_PROJECT_NAME=ottimo-ci POSTGRES_HOST_PORT=55432` (stack dev phải tắt api/web vì trùng cổng 3000/8081), `.env` sinh bằng `bash infra/ci/make-ci-env.sh .env.example .env` trong một bản sao thư mục `product/`.

Nạp dữ liệu QA DS-E (dữ liệu giả, `tests/fixtures/seed/ds-e.json`) vào DB dev **một lần** sau khi migrate (DB đã nạp rồi thì loader báo `DS-E is already loaded` và không đổi gì):

```bash
docker compose --env-file .env -f infra/docker-compose.yml --profile seed run --rm seed   # trong container (ottimo_app)
# hoặc từ máy (api chạy ngoài container):  set -a; source .env; set +a; pnpm seed:ds-e
```

Loader in báo cáo JSON (số user, thiết bị, tham số, so mã chứng từ); token thiết bị ghi vào `tests/fixtures/seed/.out/ds-e.map.json` (gitignore, quyền 0600), không in ra log. Mã chứng từ của fixture lệch với server → loader dừng, không để lại gì; `--allow-code-drift` để nạp vẫn nạp và chỉ cảnh báo.

Dừng: `pnpm dev:down`. Xóa sạch dữ liệu DB dev: `docker compose --env-file .env -f infra/docker-compose.yml down -v` (mất toàn bộ dữ liệu DB dev – chỉ dữ liệu giả).

## 4. Làm việc hằng ngày (chạy code ngoài container cho nhanh)

```bash
cd product
pnpm install                                   # lần đầu và khi đổi phụ thuộc
docker compose --env-file .env -f infra/docker-compose.yml up -d postgres
set -a; source .env; set +a                    # nạp biến (DATABASE_URL, MIGRATION_DATABASE_URL, CLOCK_MODE …)
pnpm exec turbo run build --filter=@ottimo/api^...   # gói dùng chung (api cần @ottimo/integrations, contracts)
pnpm db:migrate                                # áp migration vào DB dev `ottimo` (chạy lại = không làm gì)
pnpm --filter @ottimo/api dev                  # api ở http://localhost:3000 (đọc DATABASE_URL từ môi trường)
pnpm dev:web                                   # Vite: admin 5173, mobile 5174, guest 5175 (proxy /health, /v1 → :3000)
```

Ghi chú: `pnpm --filter @ottimo/api dev` không tự đọc file `.env`; nạp biến trước, ví dụ `set -a; source .env; set +a` (macOS/Linux). `DATABASE_URL` trong `.env` dùng vai `ottimo_app`.

Log của api: mỗi request chỉ ghi `method`, **mẫu route** (ví dụ `/v1/reservations/:id`), mã trạng thái, thời gian – không ghi query string, header, IP (SR-LOG-01/02). Các khóa `password`, `pin`, `otp`, `token`, `code`, `secret`, `docNumber`, `idNumber` bị che `[redacted]`. `X-Forwarded-For` chỉ được tin khi `TRUST_PROXY` liệt kê địa chỉ proxy (dev: không tin ai).

## 5. Lệnh kiểm tra (giống CI)

| Lệnh | Việc |
|---|---|
| `pnpm format:check` | Prettier (bỏ qua `docs/`, `design/`, `legacy/`, `*.md`) |
| `pnpm lint` | ESLint **một lần** cho cả workspace (cấu hình chung `eslint.config.js`, gồm `jsx-a11y`) + `tsc --noEmit` từng package (task `typecheck` qua Turborepo) |
| `pnpm audit --audit-level=high` | Quét lỗ hổng phụ thuộc (CI đỏ khi có High/Critical). Ngoại lệ có thời hạn: `package.json` → `pnpm.auditConfig.ignoreCves` |
| `pnpm db:migrate` | Áp migration (`services/api/src/db/migrations`) bằng `MIGRATION_DATABASE_URL` (`ottimo_migrator` → `SET ROLE ottimo_owner`); chạy lại = không làm gì. `pnpm test` cũng tự migrate DB test trước (globalSetup) |
| `pnpm --filter @ottimo/api exec drizzle-kit generate` | Kiểm schema Drizzle khớp migration: phải in `No schema changes, nothing to migrate` và **không** sinh file (CI đỏ nếu sinh). Đổi schema thật → `pnpm --filter @ottimo/api db:generate`, sửa SQL nếu cần, commit migration. **Không bao giờ** dùng `drizzle-kit push` |
| `pnpm seed:ds-e` | Nạp DS-E vào DB đã migrate (cần `DATABASE_URL`, `QA_SEED_PASSWORD`, `APP_ENV` ≠ production) |
| `pnpm test` | Vitest. Test với PostgreSQL thật (RLS, kiến trúc DB, nền tảng, HTTP, seed, `/health`, vai DB) chỉ chạy khi có `DATABASE_URL` và `MIGRATION_DATABASE_URL` trỏ tới DB `ottimo_test` – xem lệnh ngay dưới bảng. Thiếu biến nào thì nhóm test đó bị **bỏ qua** (skipped), không đỏ – đọc dòng `Tests … skipped` để biết |
| `pnpm build` | Build mọi package/app |
| `pnpm format` | Tự sửa định dạng |

Chạy test giống CI (postgres của compose đang chạy; lấy mật khẩu từ `.env`, không gõ tay):

```bash
cd product
docker compose --env-file .env -f infra/docker-compose.yml up -d postgres
APP=$(grep '^OTTIMO_APP_DB_PASSWORD=' .env | cut -d= -f2)
MIG=$(grep '^OTTIMO_MIGRATOR_DB_PASSWORD=' .env | cut -d= -f2)
DATABASE_URL=postgres://ottimo_app:$APP@localhost:5432/ottimo_test \
MIGRATION_DATABASE_URL=postgres://ottimo_migrator:$MIG@localhost:5432/ottimo_test pnpm test
MIGRATION_DATABASE_URL=postgres://ottimo_migrator:$MIG@localhost:5432/ottimo_test pnpm db:migrate   # tùy chọn: test cũng tự migrate
# kết quả đúng: @ottimo/api "Test Files 13 passed (13)", "Tests 121 passed (121)" – không có "skipped";
# @ottimo/integrations 46 passed; admin-web/mobile/guest-web mỗi app 1 passed; Turbo 9/9
```

Turborepo chỉ chuyển cho task `test` các biến khai báo trong `turbo.json` (`DATABASE_URL`, `MIGRATION_DATABASE_URL`); thêm biến mới cho test thì phải khai báo ở đó, nếu không test sẽ âm thầm bị bỏ qua.

## 6. Lockfile

`product/pnpm-lock.yaml` được commit (sinh lần đầu ở R2 – Tuần 1). CI và cả 2 Dockerfile chỉ cài bằng `pnpm install --frozen-lockfile`: thiếu lockfile hoặc lockfile lệch `package.json` (kể cả `pnpm.overrides`) là **đỏ** (`ERR_PNPM_OUTDATED_LOCKFILE` / `ERR_PNPM_LOCKFILE_CONFIG_MISMATCH`). Đổi phụ thuộc → chạy `pnpm install` ở `product/` → commit cả `package.json` và `pnpm-lock.yaml` trong cùng commit.

Ghi đè phiên bản (`package.json` → `pnpm.overrides`): `fastify` ≥ 5.12.7 vì `@nestjs/platform-fastify@11.2.7` khóa `fastify@5.11.3` có lỗ hổng High (GHSA-p68q-wchp-6fh7 và 3 mã khác). Bỏ ghi đè khi NestJS phát hành bản 11.x dùng fastify đã vá.

## 7. Cấu trúc khung (R1)

```
product/
├── package.json, pnpm-workspace.yaml, turbo.json, tsconfig.base.json, .nvmrc
├── eslint.config.js, .prettierrc.json, .prettierignore, .editorconfig, .dockerignore, .env.example
├── apps/admin-web | mobile | guest-web   # React 18 + Vite, mỗi app 1 trang trống + 1 test
├── apps/booking-web/README.md            # R3
├── services/api/                         # NestJS 11 (Fastify): src/main.ts (api), src/worker.ts (worker), GET /health
├── packages/contracts/                   # kiểu dùng chung (R2: sinh từ docs/api/openapi.yaml)
├── integrations/                         # @ottimo/integrations – NotificationAdapter + Mock (INT tiếp quản R2)
├── infra/docker-compose.yml              # môi trường dev: postgres → migrate (một lần) → api/worker → web; seed (profile)
├── infra/docker/Dockerfile.api|web       # image api/worker (turbo prune @ottimo/api) và web tĩnh (base image ghim digest)
├── infra/caddy/Caddyfile.dev             # mount vào container web, không nằm trong image
├── infra/postgres/init/01-extensions.sql
├── infra/postgres/init/02-roles.sh       # vai ottimo_owner (NOLOGIN) / ottimo_migrator / ottimo_app / ottimo_readonly
├── infra/ci/check-no-test-surface.sh     # CI: chặn /__test__ trong openapi.yaml và bundle api production
├── infra/ci/make-ci-env.sh               # CI: .env dùng một lần (mật khẩu, TEST_SUPPORT_TOKEN, QA_SEED_PASSWORD ngẫu nhiên)
└── tests/e2e | load | fixtures           # R2–R3
```

Ngoài `product/`: `.github/workflows/ci.yml` (job `build-test` – có bước `drizzle-kit generate` không sinh file và `pnpm db:migrate` trước test; `test-surface-guard`, `contract-lint`, `api-contract` – có `gen_rbac_cases.py --check`; `secrets-scan`; `docker-build` – migrate từ image production rồi smoke `/health`, E2E trên stack compose có `migrate`; action ghim theo SHA), `.github/gitleaks.toml` (allowlist có lý do), `.github/dependabot.yml`.

Sinh kiểu từ OpenAPI (R2): kết quả sinh vào `packages/contracts/src/generated/` và **được commit**; CI kiểm "sinh lại không đổi". Docker build không đọc `docs/` (thẻ FB-R1-ARC-OPS-06).

Lệch so với `architecture.md` mục 17: compose đặt ở `infra/docker-compose.yml` (theo plan R1) thay vì `infra/compose/`; `packages/ui`, `packages/i18n`, `packages/config-eslint` chưa tạo (cấu hình ESLint chung tạm ở `product/eslint.config.js`) – tạo ở R2 khi có nội dung.

## 8. Sự cố thường gặp

| Triệu chứng | Cách xử lý |
|---|---|
| `set POSTGRES_PASSWORD in product/.env` khi chạy compose | Chưa tạo `.env` hoặc chạy không có `--env-file .env` – dùng `pnpm dev` từ thư mục `product/` |
| Cổng 5432/3000 đã bị dùng | Tắt PostgreSQL/ứng dụng khác đang chạy ở máy, hoặc đổi cổng bên trái trong compose (chỉ ở máy mình, không commit) |
| `/health` trả 503 `db: down` | Kiểm tra `docker compose ps` postgres đã `healthy`; mật khẩu trong `DATABASE_URL` khớp `POSTGRES_PASSWORD` |
| Đổi `POSTGRES_PASSWORD` nhưng DB vẫn dùng mật khẩu cũ | Mật khẩu chỉ áp dụng khi tạo volume lần đầu → `down -v` rồi chạy lại |
| `password authentication failed for user "ottimo_app"` hoặc vai không tồn tại | Volume DB tạo **trước** khi có `02-roles.sh` (bản khung cũ) hoặc mật khẩu `.env` không khớp → `docker compose … down -v` rồi `pnpm dev` |
| api/worker thoát ngay với `ConfigError: Invalid configuration: …` | Đọc tên biến trong thông báo (giá trị không bao giờ được in). Thường gặp: thiếu `APP_ENV`, `TRUST_PROXY=true`, khóa ngắn hơn 32 ký tự |
| `ConfigError: … CLOCK_OVERRIDE is no longer supported` | `.env` cũ còn dòng `CLOCK_OVERRIDE=<giá trị>` – xóa dòng đó; dùng `CLOCK_MODE=mutable` + `POST /__test__/clock` (mục 2) |
| `required variable TEST_SUPPORT_TOKEN is missing a value` khi chạy compose, hoặc `TEST_SUPPORT_TOKEN (>= 32 characters) is required` | `.env` tạo trước R2 – Đợt 0: thêm `TEST_SUPPORT_TOKEN=$(openssl rand -hex 24)` (và các biến khác ở mục 2). Không cần endpoint kiểm thử: `INCLUDE_TEST_SUPPORT=0` (vẫn phải có dòng token, có thể là chuỗi bất kỳ ≥ 32 ký tự) |
| api/worker đứng ở `Created`, `migrate` `Exited (1)` | Migration lỗi: `docker compose … logs migrate`. `password authentication failed for user "ottimo_migrator"` → xem dòng `OTTIMO_MIGRATOR_DB_PASSWORD` bên dưới; `must use ottimo_migrator, not a superuser` → sai URL |
| `StartupCheckError: … use ottimo_app` | `DATABASE_URL` của api/worker trỏ tới migrator/superuser/vai `BYPASSRLS` – chỉ dùng `ottimo_app` |
| CI đỏ ở bước `Schema matches migrations` | Sửa `src/db/schema/*.ts` mà chưa sinh migration: `pnpm --filter @ottimo/api db:generate`, xem lại SQL, commit cả `migrations/*.sql` + `meta/` |
| CI đỏ ở bước `RBAC case matrix up to date` | OpenAPI (`x-roles`/`x-rbac`/`x-scope`) hoặc tài khoản DS-E đổi mà chưa sinh lại ma trận: `python3 product/tests/tools/gen_rbac_cases.py` (việc của QA) rồi commit `tests/fixtures/rbac-cases.json|csv` |
| `ERR_REQUIRE_ESM` / `ERR_PACKAGE_PATH_NOT_EXPORTED` khi chạy api | Node < 22.12 – nâng Node; test `workspace-packages.test.ts` bắt lỗi này |
| `set OTTIMO_MIGRATOR_DB_PASSWORD in product/.env` hoặc `password authentication failed for user "ottimo_migrator"` | `.env`/volume tạo trước khi đổi sang 4 vai (R1 bước 5, BUG-R1-SEC-06): chép dòng `OTTIMO_MIGRATOR_DB_PASSWORD` và `MIGRATION_DATABASE_URL` mới từ `.env.example`, xóa `OTTIMO_OWNER_DB_PASSWORD`; rồi `docker compose … down -v` và `pnpm dev`. Không muốn mất dữ liệu: sửa `.env` như trên, `pnpm dev` (container postgres nhận biến mới), rồi chạy lại script trên volume cũ – `docker compose --env-file .env -f infra/docker-compose.yml exec postgres bash /docker-entrypoint-initdb.d/02-roles.sh` (script chạy lại được, chuyển `ottimo_owner` sang NOLOGIN) |
| `set OTTIMO_APP_DB_PASSWORD in product/.env` | `.env` tạo từ bản `.env.example` cũ – chép lại các dòng `OTTIMO_*_DB_PASSWORD`, `APP_ENV`, `MIGRATION_DATABASE_URL` |
| Log PostgreSQL/api: `terminating connection due to idle-in-transaction timeout` hoặc `canceling statement due to statement timeout` (api trả 503) | Đúng thiết kế (SEC-BE-23): code giữ giao dịch mở > 30 s hoặc một câu lệnh > 15 s. Sửa code (không nâng giới hạn của vai); báo cáo dài tự `SET LOCAL statement_timeout` |
| `corepack` báo lỗi chữ ký khi tải pnpm | Cập nhật Node 22 lên bản vá mới nhất, hoặc `npm i -g corepack@latest` |
| macOS: postgres đứng mãi `health: starting`, `docker logs` trống, `docker stop` báo "did not receive an exit event" | Docker/OrbStack chưa được macOS cho phép đọc thư mục chứa repo (`~/Desktop`, `~/Documents`, `~/Downloads`) – xem mục 1 "macOS – quyền thư mục". Sau khi cho phép, nếu volume đã tạo mà thiếu vai/`ottimo_test` thì `docker compose … down -v` rồi chạy lại |
| `ERR_PNPM_OUTDATED_LOCKFILE` / `ERR_PNPM_LOCKFILE_CONFIG_MISMATCH` (CI hoặc `docker build`) | Đã sửa `package.json` mà chưa cập nhật lockfile: `pnpm install` ở `product/` rồi commit `pnpm-lock.yaml` |
| `ConfigError: … TRUST_PROXY hop counts are not supported` | Fastify ≥ 5.12 bỏ tin proxy theo số bước (không kiểm được địa chỉ proxy). Đặt `TRUST_PROXY` = IP/CIDR của Caddy |
| `pnpm test` xanh nhưng có `skipped` ở `db-role.test.ts` / `health.test.ts` | Thiếu `DATABASE_URL` hoặc `MIGRATION_DATABASE_URL` – xem lệnh ở mục 5 |
| `No "exports" main defined in …/@ottimo/<gói>/package.json` khi api chạy/test | Gói ESM dùng chung thiếu điều kiện `"default"` trong `exports` – api (CommonJS) `require()` gói qua điều kiện `require`/`default`, không dùng `import`. Thêm `"default"` cạnh `"import"` |
