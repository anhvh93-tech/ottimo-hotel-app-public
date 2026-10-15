# Hướng dẫn dựng máy dev – OTTIMO Desk

- Người viết: OPS | Round 1 – Đợt 3, sửa ở Bước 4 | Ngày: 15/10/2026
- Liên quan: `architecture.md` mục 17, ADR-012 (công cụ), ADR-003 (PostgreSQL 17), `product/.env.example`
- Mục tiêu: người mới clone repo chạy được hệ thống ở máy local trong **< 15 phút**.

> Trạng thái kiểm chứng (R1, sau Bước 4): khung này **vẫn chưa được chạy thật** – máy của OPS chưa có Node/pnpm/Docker (chủ đầu tư đang cài). Mọi kiểm tra mới là kiểm tĩnh (YAML/JSON/cú pháp shell, dò bí mật). Xem `rounds/round-01/outputs/OPS/report.md` mục "Bước 4". Người đầu tiên chạy theo hướng dẫn này hãy ghi lại lỗi gặp phải để OPS sửa.

## 1. Cài công cụ (một lần)

| Công cụ | Phiên bản | Cách cài gợi ý (macOS) | Ghi chú |
|---|---|---|---|
| Git | bất kỳ bản mới | có sẵn hoặc Xcode Command Line Tools | |
| Node.js | **22 LTS, tối thiểu 22.12** (xem `product/.nvmrc`, `engines`) | `nvm install 22` hoặc `fnm install 22` hoặc bộ cài từ nodejs.org | Không dùng Node 23/24 hay 22 < 22.12: api (CommonJS) cần `require()` được gói ESM dùng chung – chỉ có sẵn từ 22.12 (ADR-012, thẻ FB-R1-ARC-OPS-01) |
| pnpm | **9.15.x** (khóa trong `product/package.json` → `packageManager`) | `corepack enable` (Corepack có sẵn trong Node 22) | Corepack tự tải đúng phiên bản pnpm |
| Docker | Docker Desktop, OrbStack hoặc Colima (+ docker CLI, compose v2 ≥ 2.24) | tự chọn | Cần cho PostgreSQL và chạy cả hệ thống |

Windows: dùng WSL2 (Ubuntu) + Docker Desktop; làm mọi lệnh bên trong WSL.

## 2. Lấy mã và cấu hình

```bash
git clone <repo-url> hotel-app
cd hotel-app/product
cp .env.example .env
```

Mở `product/.env`. Giá trị mẫu chạy được ngay ở máy dev; nếu đổi mật khẩu thì đổi **cho khớp từng cặp**:

| Biến mật khẩu | Phải khớp với |
|---|---|
| `POSTGRES_PASSWORD` (superuser `ottimo_admin` – chỉ để quản trị, ứng dụng **không** dùng) | – |
| `OTTIMO_APP_DB_PASSWORD` (vai `ottimo_app` – api, worker, test) | mật khẩu trong `DATABASE_URL` |
| `OTTIMO_OWNER_DB_PASSWORD` (vai `ottimo_owner` – chỉ chạy migration) | mật khẩu trong `MIGRATION_DATABASE_URL` |

Không điền khóa thật của VNPay/MoMo/MISA/Beds24/Zalo – mặc định mọi tích hợp ở chế độ `mock`/`manual`. `APP_ENV=dev` là bắt buộc (api/worker từ chối khởi động nếu thiếu). Các khóa `SESSION_SECRET`, `DATA_KEK_CURRENT`, `ID_HASH_KEY`, `LOG_IP_HMAC_KEY` được để trống ở `dev`/`test`; ở `staging`/`production` thiếu hoặc ngắn hơn 32 ký tự thì ứng dụng **dừng** (tạo bằng `openssl rand -base64 32`).

### Vai cơ sở dữ liệu (erd.md 2.1, SR-AZ-06)

`infra/postgres/init/02-roles.sh` tạo khi volume DB mới được tạo (và CI chạy cùng script):

| Vai | Dùng cho | Thuộc tính |
|---|---|---|
| `ottimo_admin` (`POSTGRES_USER`) | quản trị, script init | superuser – **không bao giờ** nằm trong cấu hình ứng dụng |
| `ottimo_owner` | migration (`MIGRATION_DATABASE_URL`) | chủ database/schema `public`, không superuser |
| `ottimo_app` | api, worker, test (`DATABASE_URL`) | `NOSUPERUSER NOBYPASSRLS`, không sở hữu bảng; quyền từng bảng do migration `GRANT` |
| `ottimo_readonly` | sao lưu, tra cứu sự cố | `BYPASSRLS`, tạo ở trạng thái `NOLOGIN`; chỉ bật đăng nhập theo runbook (SR-OPS-04) |

Test `services/api/test/db-role.test.ts` sẽ **đỏ** nếu `DATABASE_URL` trỏ tới superuser hoặc vai có `BYPASSRLS` – đây là chủ ý: test RLS chạy bằng superuser không chứng minh được gì.

Quy tắc bí mật:
- `.env` đã nằm trong `.gitignore` – không bao giờ commit. Chỉ `.env.example` (placeholder) được commit.
- CI chạy `gitleaks` quét toàn bộ lịch sử git; commit lỡ chứa khóa sẽ làm CI đỏ → phải xoay (đổi) khóa đó, không chỉ xóa commit.

## 3. Chạy toàn hệ thống bằng 1 lệnh (Docker Compose)

```bash
cd product
pnpm dev          # = docker compose --env-file .env -f infra/docker-compose.yml up --build
```

| Dịch vụ | Địa chỉ | Ghi chú |
|---|---|---|
| PostgreSQL 17 | `localhost:5432` | DB `ottimo` (+ `ottimo_test` cho test); extension `btree_gist`, `pgcrypto`, `citext` và 3 vai `ottimo_owner/app/readonly` tạo sẵn khi volume mới |
| api | http://localhost:3000/health | trả `{"status":"ok","db":"ok","time":"…+07:00"}`; 503 nếu DB không trả lời |
| worker | (không có cổng) | khung R1: chỉ khởi động, ping DB, chờ tín hiệu dừng |
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

Dừng: `pnpm dev:down`. Xóa sạch dữ liệu DB dev: `docker compose --env-file .env -f infra/docker-compose.yml down -v` (mất toàn bộ dữ liệu DB dev – chỉ dữ liệu giả).

## 4. Làm việc hằng ngày (chạy code ngoài container cho nhanh)

```bash
cd product
pnpm install                                   # lần đầu và khi đổi phụ thuộc
docker compose --env-file .env -f infra/docker-compose.yml up -d postgres
pnpm --filter @ottimo/contracts build          # gói dùng chung (api cần kiểu của nó)
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
| `pnpm test` | Vitest. Test với PostgreSQL thật (`/health`, kiểm vai DB) chỉ chạy khi có `DATABASE_URL`, ví dụ `DATABASE_URL=postgres://ottimo_app:<mật khẩu app>@localhost:5432/ottimo_test pnpm test` |
| `pnpm build` | Build mọi package/app |
| `pnpm format` | Tự sửa định dạng |

## 6. Lockfile – việc bắt buộc của người chạy `pnpm install` đầu tiên

Repo **chưa có** `product/pnpm-lock.yaml` (OPS không có Node để sinh ở R1). Có 2 cách:

- **Máy có Node ≥ 22.12:** `cd product && pnpm install` → chạy `pnpm format:check && pnpm lint && pnpm test && pnpm build` – sửa nếu đỏ → commit `product/pnpm-lock.yaml`.
- **Không có Node ở máy:** khi CI chạy mà chưa có lockfile, job `build-test` tải lockfile vừa sinh lên thành artifact `pnpm-lock` (giữ 7 ngày). Tải về, đặt vào `product/pnpm-lock.yaml`, commit, chạy lại CI (lần này `--frozen-lockfile`). Việc đẩy repo lên GitHub cần INV cho phép (xem report OPS R1).

Khi lockfile đã có, CI và Dockerfile tự chuyển sang `--frozen-lockfile`. OPS sẽ xóa nhánh dự phòng "không có lockfile" trong CI/Dockerfile ở Round 2.

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
├── infra/docker-compose.yml              # môi trường dev (R2: infra/docker-compose.prod.yml riêng)
├── infra/docker/Dockerfile.api|web       # image api/worker và web tĩnh (base image ghim digest)
├── infra/caddy/Caddyfile.dev             # mount vào container web, không nằm trong image
├── infra/postgres/init/01-extensions.sql
├── infra/postgres/init/02-roles.sh       # vai ottimo_owner / ottimo_app / ottimo_readonly
└── tests/e2e | load | fixtures           # R2–R3
```

Ngoài `product/`: `.github/workflows/ci.yml` (job `build-test`, `contract-lint`, `secrets-scan`, `docker-build`; action ghim theo SHA), `.github/gitleaks.toml` (allowlist có lý do), `.github/dependabot.yml`.

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
| `ERR_REQUIRE_ESM` / `ERR_PACKAGE_PATH_NOT_EXPORTED` khi chạy api | Node < 22.12 – nâng Node; test `workspace-packages.test.ts` bắt lỗi này |
| `set OTTIMO_APP_DB_PASSWORD in product/.env` | `.env` tạo từ bản `.env.example` cũ – chép lại các dòng `OTTIMO_*_DB_PASSWORD`, `APP_ENV`, `MIGRATION_DATABASE_URL` |
| `corepack` báo lỗi chữ ký khi tải pnpm | Cập nhật Node 22 lên bản vá mới nhất, hoặc `npm i -g corepack@latest` |
