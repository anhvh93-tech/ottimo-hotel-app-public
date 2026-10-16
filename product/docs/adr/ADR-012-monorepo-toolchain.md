# ADR-012 – Monorepo pnpm + Turborepo; ESLint, Prettier, Vitest, Playwright, k6

- Trạng thái: **Chấp nhận** (khung đã chạy thật – R2 tuần 1) | Người quyết: ARC | Ngày: 15/10/2026 | Round 1 – Pha A; cập nhật 16/10/2026 (R2 tuần 1)
- Liên quan: architecture.md mục 17 (cấu trúc thư mục cho OPS); plan R1 mục 3.1 dòng OPS; QC C2

## Bối cảnh
- Mã nguồn nằm trong `product/` (protocol); CI ở `.github/workflows/` tại gốc repo.
- Nhiều app (admin-web, mobile, guest-web, api) chia sẻ hợp đồng API, UI, i18n, adapter → cần monorepo với workspace.

## Quyết định
| Hạng mục | Chọn | Ghi chú |
|---|---|---|
| Quản lý gói | **pnpm 9** workspaces; `product/pnpm-workspace.yaml` là gốc workspace | Nhanh, tiết kiệm đĩa; khóa phiên bản qua `pnpm-lock.yaml` (commit) |
| Điều phối build | **Turborepo** (`product/turbo.json`), chỉ cache cục bộ + cache CI (không dùng cache từ xa trả phí) | `turbo run lint test build --filter=...[origin/main]` |
| Node | 22 LTS, ghi trong `product/.nvmrc` và `engines` | |
| TypeScript | 5.x, `product/tsconfig.base.json` dùng chung, `strict: true` | |
| Lint | **ESLint 9 (flat config)** + `typescript-eslint` + `eslint-plugin-react-hooks` + `eslint-plugin-jsx-a11y`; quy tắc riêng: cấm `new Date()` ngoài `Clock` (ADR-008), cấm `parseFloat` trên tiền, cấm import chéo `modules/*/internal` | Cấu hình chung ở `product/packages/config-eslint` |
| Format | **Prettier** | `pnpm format:check` trong CI |
| Unit/integration test | **Vitest** cho mọi package (api dùng `unplugin-swc` để chạy decorator NestJS) | Một test runner cho toàn repo |
| Test API với DB thật | Vitest + PostgreSQL thật (service container trong CI; `docker compose` ở máy dev) – không mock DB cho logic chống trùng | ADR-009 cần constraint thật |
| E2E | **Playwright** (`product/tests/e2e`), chạy trên Chromium + WebKit mobile viewport (iPhone) + Android viewport | R2 trở đi |
| Hiệu năng | **k6** (`product/tests/load`) – kịch bản p95 API | R3 |
| Kiểm hợp đồng | `@redocly/cli lint` cho `openapi.yaml`; `openapi-typescript` sinh `packages/contracts` | Pha B |
| Kiểm bảo mật phụ thuộc | `pnpm audit --prod` (mức high) + Dependabot/Renovate (OPS chọn) | |
| Quét bí mật | `gitleaks` trong CI | Quy tắc cứng: không khóa thật trong repo |
| Docker | `node:22-alpine`, `postgres:17-alpine`, `caddy:2-alpine`; Dockerfile multi-stage trong `product/infra/docker/` | |
| Commit | Thông điệp theo protocol: `round-<n>: <bước> – <tóm tắt>` cho commit của ORC; commit code dùng tiếng Anh, khuyến nghị Conventional Commits (`feat(api): …`) | Không bắt buộc commitlint ở R1 |

### Lệnh chuẩn (OPS hiện thực trong `product/package.json`)
| Lệnh | Việc |
|---|---|
| `pnpm install --frozen-lockfile` | Cài đặt |
| `pnpm lint` | `turbo run lint` (ESLint + `tsc --noEmit`) |
| `pnpm format:check` | Prettier |
| `pnpm test` | `turbo run test` (Vitest) |
| `pnpm build` | `turbo run build` |
| `pnpm dev` | `docker compose -f infra/docker-compose.yml up` + Vite dev server (vị trí thực tế OPS đã dựng) |
| `pnpm db:migrate` / `db:seed` | Chạy migration SQL (erd mục 16) bằng `MIGRATION_DATABASE_URL` + seed 10 căn giả từ BL 4.1. Cấm `drizzle-kit push` |
| `pnpm api:lint` | `redocly lint docs/api/openapi.yaml` + `openapi-spec-validator` + script kiểm `x-roles`/`x-stories` (SR-AZ-01) |
| `pnpm e2e` | Playwright (R2+) |

### CI tối thiểu (R1, khung rỗng) – `.github/workflows/ci.yml` tại gốc repo
`working-directory: product` → setup Node 22 + pnpm (cache) → install → `format:check` → `lint` → `test` (có service `postgres:17`) → `build` → `gitleaks`. Chạy trên `pull_request` và `push` nhánh chính. Mục tiêu < 5 phút.

## Phương án đã cân nhắc
- npm/yarn workspaces: chậm hơn hoặc ít phổ biến hơn với Turborepo; Nx: mạnh nhưng nặng cấu hình cho đội nhỏ.
- Jest: mặc định của NestJS, nhưng chạy 2 runner (Jest + Vitest cho web) là thừa.

## Hệ quả
- Tốt: một lệnh chạy toàn bộ kiểm tra; sửa `openapi.yaml` → kiểu sai lộ ra ngay ở FE/PWA khi build.
- Phải chấp nhận: dev phải dùng pnpm (Corepack bật sẵn trong Node 22).

## Cập nhật R1 bước 4 (16/10/2026)

### Đóng gói ESM/CJS (ARC tự nhận; FB-R1-ARC-OPS-01)
- Node **≥ 22.12** (`engines`, `.nvmrc`).
- **Mọi package nội bộ là ESM** (`"type": "module"`), xuất **kép** qua `exports` có điều kiện: `"import"` → `dist/esm/*.js`, `"require"` → `dist/cjs/*.cjs`, `"types"` → `dist/types/*.d.ts`, `"default"` → bản ESM. Build bằng `tsup` (format `esm,cjs`).
- `services/api` (NestJS, decorator) build **CommonJS** (`module: Node16`, `moduleResolution: Node16`) và import package nội bộ qua điều kiện `require`. Chuyển api sang ESM thuần là việc R3 nếu cần.
- Web/PWA (Vite) dùng điều kiện `import`. CI kiểm `require('@ottimo/integrations/contracts')` và `import()` đều chạy được.

### Kiểm hợp đồng trong CI (yêu cầu OPS – FB-R1-ARC-OPS-08)
- Job `api-contract`: `redocly lint` (rule kiểm ví dụ, operationId duy nhất, component không dùng), `openapi-spec-validator`, script kiểm mọi operation có `x-roles` và mọi story Must R2 có `x-stories`. ARC đã chạy `openapi-spec-validator` 0.7.2 cho `openapi.yaml` 0.2.0-draft và `openapi.test.yaml`: hợp lệ. `redocly` chưa chạy được trên máy ARC (không có Node/npx) – OPS chạy trong CI.
- Migration: 2 bước CI ở erd mục 16. Bundle production không chứa chuỗi `__test__` (ADR-008).

## Cập nhật R2 tuần 1 (16/10/2026) – phiên bản thực tế sau lần chạy thật của OPS

Nguồn: `rounds/round-02/outputs/OPS/w1-skeleton-run.md` (mục 2.1, 2.3, 2.6, 4.4). `pnpm audit --audit-level=high` lần đầu **đỏ thật**
(16 lỗ hổng: 5 High, 3 Critical) → OPS nâng phiên bản trong cùng major của khung đã chọn hoặc lên major mới của công cụ dev. ARC **chấp nhận** cả bộ.

### Phiên bản đã khóa trong `product/pnpm-lock.yaml`
| Gói | Trước | Nay | Lý do | Ảnh hưởng |
|---|---|---|---|---|
| `fastify` (qua `@nestjs/platform-fastify@11.2.7`) | 5.11.3 | **5.12.7** – `pnpm.overrides.fastify: ^5.12.7` ở `product/package.json` | 4 High (GHSA-p68q-wchp-6fh7, -667r-xxjv-c9mm, -hwr6-493r-vm6h, -9q9j-q6p8-xq58); Nest 11.x mới nhất vẫn khóa 5.11.3 | Fastify ≥ 5.12 bỏ `trustProxy` dạng **số bước** (GHSA-3m5p-2c4r-xxw2) → `TRUST_PROXY` chỉ nhận danh sách IP/CIDR của Caddy (số → `ConfigError`); khớp hosting-plan (production đã dùng IP Caddy). Architecture mục 13 cập nhật theo |
| `vitest` (6 package) | 2.1.9 | **4.1.12** | 3 Critical qua `tinypool@1.1.1` | Không đổi cấu hình; 28/28 test api xanh |
| `vite` (3 app) | 5.4.21 | **7.3.7** | High GHSA-fx2h-pf6j-xcff | Build ~0,3 s/app |
| `@vitejs/plugin-react` | 4.3.4 | **5.2.0** | đi cùng Vite 7 | – |
| `unplugin-swc` (api) | 1.5.1 | **1.6.0** | tương thích Vitest 4 | – |
| Giữ nguyên | – | NestJS **11.2.7**, TypeScript **5.8.3**, ESLint **9.39.5**, Prettier **3.9.10**, Turborepo **2.11.8**, pnpm **9.15.4**, Node **22.x (≥ 22.12)**, PostgreSQL **17.11** | – | – |

### Quy tắc đi kèm (ARC quyết)
1. **Bỏ ghi đè `fastify`** khi `@nestjs/platform-fastify` 11.x phát hành bản dùng fastify đã vá (hoặc khi lên Nest 12 – cần ADR mới). OPS kiểm mỗi lần Renovate/Dependabot mở PR Nest; ghi chú ở `dev-setup.md` mục 6.
2. **Không tắt `pnpm audit`** để qua CI; lỗ hổng không vá được trong major hiện tại → ghi `auditConfig.ignoreCves` **kèm** ID lỗi, lý do, ngày hết hạn và chữ ký SEC (hiện danh sách rỗng).
3. **Major mới của công cụ dev** (Vitest, Vite, plugin) được phép khi để vá High/Critical, với điều kiện cả bộ `format:check → lint → test (có DB, 0 skipped) → build` xanh – đúng như lần nâng này. **Major mới của khung chạy production** (NestJS, Fastify, React, PostgreSQL) cần ADR.
4. `turbo.json`: mọi biến môi trường test đọc phải khai báo trong `env` của task (bài học `MIGRATION_DATABASE_URL` bị lọc → test bỏ qua mà CI vẫn xanh). Test đọc biến mà thiếu biến → **fail**, không `skip`, trừ khi chạy với `--allow-missing-db` ở máy dev (BE cài ở R2).
5. Gói nội bộ ESM xuất thêm điều kiện `"default"` cạnh `"import"` (lỗi `No "exports" main defined` khi api CJS `require`) – bổ sung cho mục "Đóng gói ESM/CJS" ở trên.

### Kế hoạch nâng ESLint (không chặn R2)
- Hiện: ESLint **9.39.5** + `typescript-eslint` 8 + `eslint-plugin-react-hooks` 5 + `eslint-plugin-jsx-a11y` 6 (flat config). Dòng 9.x đã bị đánh dấu deprecated vì ESLint 10 đã phát hành.
- **Chưa nâng ngay**: các plugin cần bản hỗ trợ ESLint 10 (đặc biệt `eslint-plugin-jsx-a11y`, `eslint-plugin-react-hooks`); ESLint 9.39 vẫn nhận bản vá bảo mật trong thời gian hỗ trợ; nâng giữa Sprint 1 làm đỏ CI không vì lỗi mã.
- **Lịch**: (1) **Sprint 2 R2** – OPS mở nhánh thử `eslint@10` + plugin tương thích, chạy `pnpm lint` toàn workspace, báo số lỗi mới; ARC duyệt quy tắc đổi mặc định. (2) Nếu cả 4 plugin có bản hỗ trợ và lỗi mới ≤ 1 ngày công → nâng trong **Sprint 3 R2**; nếu không → nâng **đầu R3** (trước khi đóng băng RC). (3) Điều kiện chặn sớm: có CVE High/Critical trên ESLint 9 hoặc plugin → nâng ngay theo quy tắc 3.
- Giữ nguyên các quy tắc riêng (cấm `new Date()` ngoài `Clock`, cấm `parseFloat` trên tiền, cấm import chéo `internal`) – kiểm lại sau nâng bằng test quy tắc trong `packages/config-eslint`.

### Kiểm hợp đồng (cập nhật FB-R1-ARC-OPS-08, BUG-R1-021)
- `openapi.yaml` 0.3.0-draft: `@redocly/cli@1.34.21 lint` **0 lỗi** (còn 4 cảnh báo: 3 `operation-4xx-response` ở `/health`, `getPublicUnitPage`, `webhookGet` – có chủ đích; 1 `no-server-example.com` cho `localhost` dev); `openapi-spec-validator` hợp lệ.
  → OPS **bỏ `continue-on-error`** của job `contract-lint` (W5). Cảnh báo không làm đỏ job.
- Job `api-contract` (W5): `python3 product/tests/tools/gen_traceability.py --strict` – nay đỏ khi (a) operation cho thêm vai so với rbac, (b) thuộc tính có `x-visible-to` cho vai mà rbac mục 6 ghi **K**, (c) thuộc tính `x-classification` thiếu `x-rbac-field`, (d) mã `x-rbac-field` không có trong rbac mục 6.

