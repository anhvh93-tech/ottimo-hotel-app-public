# Hướng dẫn dựng máy dev – OTTIMO Desk

- Người viết: OPS | Round 1 – Đợt 3 | Ngày: 15/10/2026
- Liên quan: `architecture.md` mục 17, ADR-012 (công cụ), ADR-003 (PostgreSQL 17), `product/.env.example`
- Mục tiêu: người mới clone repo chạy được hệ thống ở máy local trong **< 15 phút**.

> Trạng thái kiểm chứng (R1): khung này **chưa được chạy thật** trên máy của OPS vì máy không có Node/pnpm/Docker (xem `rounds/round-01/outputs/OPS/report.md` mục 4). Người đầu tiên chạy theo hướng dẫn này hãy ghi lại lỗi gặp phải để OPS sửa.

## 1. Cài công cụ (một lần)

| Công cụ | Phiên bản | Cách cài gợi ý (macOS) | Ghi chú |
|---|---|---|---|
| Git | bất kỳ bản mới | có sẵn hoặc Xcode Command Line Tools | |
| Node.js | **22 LTS** (xem `product/.nvmrc`) | `nvm install 22` hoặc `fnm install 22` hoặc bộ cài từ nodejs.org | Không dùng Node 23/24 – `engines` sẽ cảnh báo |
| pnpm | **9.15.x** (khóa trong `product/package.json` → `packageManager`) | `corepack enable` (Corepack có sẵn trong Node 22) | Corepack tự tải đúng phiên bản pnpm |
| Docker | Docker Desktop, OrbStack hoặc Colima (+ docker CLI, compose v2 ≥ 2.24) | tự chọn | Cần cho PostgreSQL và chạy cả hệ thống |

Windows: dùng WSL2 (Ubuntu) + Docker Desktop; làm mọi lệnh bên trong WSL.

## 2. Lấy mã và cấu hình

```bash
git clone <repo-url> hotel-app
cd hotel-app/product
cp .env.example .env
```

Mở `product/.env`, đổi `POSTGRES_PASSWORD` (và phần mật khẩu trong `DATABASE_URL` cho khớp) thành một giá trị **chỉ dùng ở máy dev**. Không điền khóa thật của VNPay/MoMo/MISA/Beds24/Zalo – mặc định mọi tích hợp ở chế độ `mock`/`manual`.

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
| PostgreSQL 17 | `localhost:5432` | DB `ottimo` (+ `ottimo_test` cho test); extension `btree_gist`, `pgcrypto`, `citext` tạo sẵn khi volume mới |
| api | http://localhost:3000/health | trả `{"status":"ok","db":"ok","time":"…+07:00"}`; 503 nếu DB không trả lời |
| worker | (không có cổng) | khung R1: chỉ khởi động, ping DB, chờ tín hiệu dừng |
| web – admin-web | http://localhost:8081 | Caddy phục vụ bản build tĩnh; `/health`, `/v1/*` được chuyển tới api |
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

Ghi chú: `pnpm --filter @ottimo/api dev` không tự đọc file `.env`; nạp biến trước, ví dụ `set -a; source .env; set +a` (macOS/Linux).

## 5. Lệnh kiểm tra (giống CI)

| Lệnh | Việc |
|---|---|
| `pnpm format:check` | Prettier (bỏ qua `docs/`, `design/`, `legacy/`, `*.md`) |
| `pnpm lint` | ESLint + `tsc --noEmit` từng package (qua Turborepo) |
| `pnpm test` | Vitest. Test `/health` với PostgreSQL thật chỉ chạy khi có `DATABASE_URL`, ví dụ `DATABASE_URL=postgres://ottimo:<mật khẩu dev>@localhost:5432/ottimo_test pnpm test` |
| `pnpm build` | Build mọi package/app |
| `pnpm format` | Tự sửa định dạng |

## 6. Lockfile – việc bắt buộc của người chạy `pnpm install` đầu tiên

Repo **chưa có** `product/pnpm-lock.yaml` (OPS không có Node để sinh ở R1). Người đầu tiên có Node 22:
1. `cd product && pnpm install`
2. Chạy `pnpm format:check && pnpm lint && pnpm test && pnpm build` – sửa nếu đỏ.
3. Commit `product/pnpm-lock.yaml`.

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
├── infra/docker-compose.yml              # môi trường dev
├── infra/docker/Dockerfile.api|web       # image api/worker và web tĩnh
├── infra/caddy/Caddyfile.dev
├── infra/postgres/init/01-extensions.sql
└── tests/e2e | load | fixtures           # R2–R3
```

Lệch so với `architecture.md` mục 17: compose đặt ở `infra/docker-compose.yml` (theo plan R1) thay vì `infra/compose/`; `packages/ui`, `packages/i18n`, `packages/config-eslint` chưa tạo (cấu hình ESLint chung tạm ở `product/eslint.config.js`) – tạo ở R2 khi có nội dung.

## 8. Sự cố thường gặp

| Triệu chứng | Cách xử lý |
|---|---|
| `set POSTGRES_PASSWORD in product/.env` khi chạy compose | Chưa tạo `.env` hoặc chạy không có `--env-file .env` – dùng `pnpm dev` từ thư mục `product/` |
| Cổng 5432/3000 đã bị dùng | Tắt PostgreSQL/ứng dụng khác đang chạy ở máy, hoặc đổi cổng bên trái trong compose (chỉ ở máy mình, không commit) |
| `/health` trả 503 `db: down` | Kiểm tra `docker compose ps` postgres đã `healthy`; mật khẩu trong `DATABASE_URL` khớp `POSTGRES_PASSWORD` |
| Đổi `POSTGRES_PASSWORD` nhưng DB vẫn dùng mật khẩu cũ | Mật khẩu chỉ áp dụng khi tạo volume lần đầu → `down -v` rồi chạy lại |
| `corepack` báo lỗi chữ ký khi tải pnpm | Cập nhật Node 22 lên bản vá mới nhất, hoặc `npm i -g corepack@latest` |
