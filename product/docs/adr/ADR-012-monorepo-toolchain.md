# ADR-012 – Monorepo pnpm + Turborepo; ESLint, Prettier, Vitest, Playwright, k6

- Trạng thái: Đề xuất | Người quyết: ARC | Ngày: 15/10/2026 | Round 1 – Pha A
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
| `pnpm dev` | `docker compose -f infra/compose/docker-compose.yml up` + Vite dev server |
| `pnpm db:migrate` / `db:seed` | Migration Drizzle + seed 10 căn từ dữ liệu mẫu BL 4.1 |
| `pnpm e2e` | Playwright (R2+) |

### CI tối thiểu (R1, khung rỗng) – `.github/workflows/ci.yml` tại gốc repo
`working-directory: product` → setup Node 22 + pnpm (cache) → install → `format:check` → `lint` → `test` (có service `postgres:17`) → `build` → `gitleaks`. Chạy trên `pull_request` và `push` nhánh chính. Mục tiêu < 5 phút.

## Phương án đã cân nhắc
- npm/yarn workspaces: chậm hơn hoặc ít phổ biến hơn với Turborepo; Nx: mạnh nhưng nặng cấu hình cho đội nhỏ.
- Jest: mặc định của NestJS, nhưng chạy 2 runner (Jest + Vitest cho web) là thừa.

## Hệ quả
- Tốt: một lệnh chạy toàn bộ kiểm tra; sửa `openapi.yaml` → kiểu sai lộ ra ngay ở FE/PWA khi build.
- Phải chấp nhận: dev phải dùng pnpm (Corepack bật sẵn trong Node 22).
