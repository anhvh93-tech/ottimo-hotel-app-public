# Báo cáo OPS – Round 1, Bước 2 Sản xuất, Đợt 3

- Vai: OPS (DevOps/SRE) | Ngày: 15/10/2026
- Việc giao: plan R1 mục 3.1 dòng OPS (khung repo, môi trường dev Docker Compose, `.env.example`, CI, dev-setup, hosting-plan)
- **Trạng thái kiểm chứng: CHƯA CHẠY ĐƯỢC.** Máy làm việc không có `node`, `npm`, `pnpm`, `corepack`, `docker`. Theo chỉ đạo không cài phần mềm hệ thống. Vì vậy **không báo xanh**: cài đặt, lint, test, build, `docker compose up`, gọi `/health` đều chưa chạy thật.

> Ghi chú ORC: OPS không ghi được file này (bị chặn quyền khi chạy nền); ORC ghi lại nội dung OPS gửi, với sự đồng ý của INV. Các dòng decision-log đề xuất đã được ORC ghi; ESC hosting đã chuyển PO gom.

## 1. Đã làm gì
1. **Khung monorepo** trong `product/` theo `architecture.md` mục 17 và ADR-012: pnpm 9.15.4 (khóa qua `packageManager`), Turborepo 2, TypeScript 5.7 strict, ESLint 9 (flat config), Prettier, Vitest, Node 22 (`.nvmrc`).
   - `services/api`: NestJS 11 + Fastify. `GET /health` trả `{status:"ok", db:"ok", time:"<ISO +07:00>"}`; trả 503 khi DB không trả lời (`SELECT 1`, timeout 2 giây). Có `Clock` duy nhất (ADR-008); `CLOCK_OVERRIDE` chỉ dùng cho dev/staging. `src/worker.ts` là khung. Log che `authorization`, `cookie`, `set-cookie`. Test: 4 test Clock; 2 test `/health` với DB giả (200/503); 1 test với PostgreSQL thật khi có `DATABASE_URL`.
   - `apps/admin-web`, `apps/mobile` (PWA có manifest), `apps/guest-web`: React 18 + Vite 5, mỗi app 1 trang trống + 1 test. `apps/booking-web` chỉ có README (R3).
   - `packages/contracts`: kiểu `HealthResponse`.
   - `integrations` (`@ottimo/integrations`): interface `NotificationAdapter` theo README INT mục 3.5 + `MockNotificationAdapter` idempotent + 2 test. INT tiếp quản từ R2.
   - Lint riêng: cấm `new Date()`/`Date.now()` ngoài `clock.ts` trong `services/`, `integrations/` (ADR-008); cấm `parseFloat` (ADR-002 – tiền).
2. **Docker Compose** `product/infra/docker-compose.yml`: `postgres:17-alpine` (btree_gist, pgcrypto, citext, DB `ottimo_test`), `api`, `worker`, `web` (Caddy 8081/8082/8083). Cổng chỉ bind `127.0.0.1`; không có mật khẩu mặc định (`${POSTGRES_PASSWORD:?…}`); chạy 1 lệnh `pnpm dev`; Dockerfile multi-stage `node:22-alpine`, user `node`.
3. **`product/.env.example`**: chỉ placeholder hoặc `mock`/`manual`; đủ biến ARC (architecture mục 13) và **35/35 biến INT**.
4. **CI** `.github/workflows/ci.yml` (gốc repo, `working-directory: product`): job `build-test` (format:check → lint → test với postgres → build, cache Turbo); job `secrets-scan` (gitleaks v8.21.2 image CLI, quét toàn lịch sử, `--redact`); job `docker-build` (build 2 image + smoke test `/health`). Quyền `contents: read`, `concurrency`. Thêm `.github/dependabot.yml`.
5. **`.gitignore`**: bổ sung `.turbo/`, `coverage/`, `*.tsbuildinfo`, `.pnpm-store/`, `.vite/`, `*.log`, `.data/`, `*.dump`, `*.sql.gz`, `*.pem`, `*.key`, `*.age`, `.idea/`, `.vscode/*`; thêm `product/.dockerignore`.
6. **`product/docs/dev-setup.md`**: cài công cụ, `.env`, chạy 1 lệnh, lệnh giống CI, sinh lockfile, sự cố thường gặp.
7. **`product/docs/hosting-plan.md`**: 3 phương án, đều đặt dữ liệu tại VN (ESC-002 A), khoảng 0,35–0,95 tr/tháng; đề xuất PA2 (~0,43–0,54 tr). Giá BizFly tra trực tiếp ngày 15/10/2026 (VPS 2 vCPU/4 GB/40 GB 240.000 đ chưa VAT; Simple Storage 864 đ/GB/tháng); Viettel IDC lấy từ ADR-010 (bên thứ ba); hãng khác chưa xác minh. Sao lưu và vòng đời log khớp SEC T15/T16/T18.
8. Thêm mục "Chạy sản phẩm ở máy local" vào `README.md` gốc.

### Kết quả kiểm chứng thật
| Lệnh / kiểm tra | Kết quả |
|---|---|
| `which node pnpm npm docker corepack` | Không có (exit 127) → **không chạy được** install, lint, test, build, `docker compose up`, `curl /health` |
| YAML (`ruby -ryaml`): `ci.yml`, `dependabot.yml`, `docker-compose.yml`, `pnpm-workspace.yaml` | Hợp lệ |
| JSON (`python3 -m json.tool`): 15 file package.json/tsconfig/turbo/prettierrc/manifest | Hợp lệ |
| Dòng code > 100 ký tự (Prettier printWidth) | Đã sửa |
| Dò chuỗi giống khóa bí mật toàn repo | Không thấy |
| Biến INT trong `.env.example` | 35/35 |

## 2. File tạo/sửa
Tạo mới: `.github/workflows/ci.yml`, `.github/dependabot.yml`; `product/` (package.json, pnpm-workspace.yaml, turbo.json, tsconfig.base.json, .nvmrc, .editorconfig, .prettierrc.json, .prettierignore, .dockerignore, eslint.config.js, .env.example); `product/services/api/**`; `product/apps/{admin-web,mobile,guest-web}/**`; `product/apps/booking-web/README.md`; `product/packages/contracts/**`; `product/integrations/` (package.json, tsconfig*, index.ts, notification/*); `product/infra/**`; `product/tests/**`; `product/docs/dev-setup.md`, `product/docs/hosting-plan.md`; `rounds/round-01/outputs/OPS/report.md`.
Sửa: `.gitignore` (chỉ bổ sung), `README.md` gốc (thêm 1 mục cuối).
Không đụng: `01-decisions/`, `02-escalations/`, docs của vai khác, `product/design/`.

## 3. Giả định
| # | Giả định | Lý do |
|---|---|---|
| G1 | NestJS 11, Vite 5, React 18 | Bản mới nhất tương thích |
| G2 | Compose ở `product/infra/docker-compose.yml` (theo plan) thay vì `infra/compose/` (architecture mục 17) | ARC cập nhật mục 17 hoặc gửi thẻ |
| G3 | Web chạy trong compose (Caddy + bản build); dev hằng ngày chạy Vite ngoài container | Có cả hai cách |
| G4 | Chưa tạo `packages/ui`, `i18n`, `config-eslint` | Khung tối thiểu; R2 |
| G5 | Prettier bỏ qua `docs/`, `design/`, `legacy/`, `*.md` | Tài liệu không làm đỏ CI |
| G6 | `pnpm audit` dời sang R2; dùng Dependabot | Tránh CI đỏ vì cảnh báo bên ngoài |
| G7 | Giá BizFly là giá niêm yết; vị trí trung tâm dữ liệu chưa xác minh | Ghi rõ trong hosting-plan |

## 4. Rủi ro / vướng mắc
| # | Mức | Nội dung | Đề xuất |
|---|---|---|---|
| R1 | **Cao** | Chưa chạy được gì (thiếu Node/pnpm/Docker); có thể còn lỗi TS, ESLint/Vitest, Prettier, Dockerfile | Chạy `dev-setup.md` mục 6 trên máy có Node 22 + Docker, hoặc CI GitHub lần đầu; OPS sửa ở bước 4 |
| R2 | **Cao** | Chưa có `pnpm-lock.yaml`; CI/Dockerfile có nhánh dự phòng cài không khóa phiên bản | Lần `pnpm install` đầu commit lockfile; xóa nhánh dự phòng ở R2 |
| R3 | Trung bình | ADR-010 giữ backup "3 tháng", mâu thuẫn SEC T18 (≤ 35 ngày) | Thẻ OPS→ARC ở bước 3 |
| R4 | Trung bình | Giá VPS VN chỉ BizFly có nguồn chính thức | Xin báo giá văn bản ≥ 2 hãng đầu R2 |
| R5 | Thấp | `integrations/` có mã khung do OPS viết | INT review và tiếp quản R2 |
| R6 | Thấp | gitleaks có thể báo nhầm trên file prototype | `.gitleaks.toml` allowlist có lý do |

**ESC đề xuất – Duyệt chi phí hosting và phương án máy chủ** (Bình thường; cần trước bước 2 Round 2; có thể gộp ESC-002): A tối giản ~350–390 nghìn đ/tháng; **B (đề xuất)** máy chính + máy phụ ở hãng VN khác ~425–535 nghìn đ/tháng (R2 chỉ thuê 1 máy ~264 nghìn đ); C dư dả ~720–940 nghìn đ/tháng. Chưa quyết thì R2 không có môi trường chạy thử trên Internet (code không bị chặn).

## 5. Việc chưa xong
| Việc | Khi |
|---|---|
| Chạy thật: `pnpm install` → commit lockfile → format/lint/test/build → `pnpm dev` + `curl /health`; sửa lỗi | Khi có Node 22 + Docker hoặc CI lần đầu (bước 4 R1) |
| Xóa nhánh "không lockfile"; thêm `pnpm audit` | R2 |
| CI lint `openapi.yaml` + sinh `packages/contracts` | Khi ARC Pha B xong |
| `db:migrate`, `db:seed` (Drizzle) | R2 cùng BE |
| Staging + deploy tự động, Caddyfile production, quản lý bí mật | R2 |
| Sao lưu tự động + diễn tập khôi phục, runbook, giám sát | R3 |
| Review chéo ARC (thẻ ADR-010 backup vs T18) | Bước 3 R1 |

Nguồn giá: https://bizflycloud.vn/cloud-server/bang-gia, https://bizflycloud.vn/s3-simple-storage/bang-gia; Viettel IDC lấy từ ADR-010 (bên thứ ba).
