# OPS – Round 2 · Sprint 2 · Rà Dependabot PRs

Ngày rà: 2026-10-16. Repo `anhvh93-tech/ottimo-hotel-app`, 11 PR mở (#1–#11), tất cả do Dependabot tạo hôm nay.
OPS **không** merge, **không** đóng, **không** comment – chỉ khuyến nghị. Người thao tác: ORC/INV.

## Bối cảnh chung
- Mọi PR tạo trên base cũ (3a1bade / e0084bc / 6837761 …), trước 3 commit Sprint 2 gần nhất → kết quả CI của PR phản ánh main *lúc đó*, không phải main hiện tại.
- Main hiện tại (26b5e39) **đang đỏ** ở `format · lint · audit · test · build`: 1 test FE `apps/admin-web/src/__tests__/reservation.test.tsx` (H11, "Unable to find role=dialog name Lê Minh"). Dòng "Worker exited unexpectedly" của api là do turbo hủy khi admin-web lỗi, không phải lỗi api. Việc của FE. **Không merge PR nào cho tới khi main xanh lại.**
- gitleaks đỏ ở #2–#5 là báo nhầm cũ (`generic-api-key` trong `rounds/round-02/outputs/QA/w1-report.md`, commit a1cd73a) – main hiện tại gitleaks xanh. Rebase là hết.
- Muốn rebase: ai có quyền comment `@dependabot rebase` trên PR (OPS không comment theo giao việc).

## Bảng khuyến nghị

| PR | Nội dung | CI trên PR | Khuyến nghị | Lý do |
|---|---|---|---|---|
| #1 | postgres 17-alpine → **18**-alpine (compose) | E2E đỏ: postgres thoát ngay – ảnh 18+ đổi chỗ lưu dữ liệu (`/var/lib/postgresql`, không còn `/var/lib/postgresql/data`) | **Đóng** | Nâng major PostgreSQL = migration dữ liệu (pg_upgrade/dump-restore), đổi mount volume, CI service vẫn 17, kiến trúc ghi PG 17. Cần ADR riêng (R3+), không merge qua bump tự động. Đề xuất thêm `ignore` major cho `postgres` |
| #2 | actions/setup-node v4.4.0 → v7.1.0 (pin SHA) | xanh trừ gitleaks (báo nhầm cũ) | **Merge sau rebase + CI xanh** | Gỡ cảnh báo "Node.js 20 is deprecated" của Actions; vẫn pin SHA. Kiểm: `cache: pnpm` + `node-version-file` vẫn chạy |
| #3 | pnpm/action-setup → v6.1.0 (pin SHA; tiêu đề ghi "from 5.0.0", SHA cũ fc06bc1 – comment trong ci.yml ghi v4.4.0, sẽ tự đúng sau merge) | xanh trừ gitleaks | **Merge sau rebase + CI xanh** | Như #2. Kiểm `package_json_file: product/package.json` còn được hỗ trợ ở v6 |
| #4 | actions/cache v4.3.0 → v6.1.0 | xanh trừ gitleaks | **Merge sau rebase + CI xanh** | Như #2 (Node 20). Cache key không đổi |
| #5 | actions/checkout v4.4.0 → v7.0.1 | xanh trừ gitleaks | **Merge sau rebase + CI xanh** | Như #2. Kiểm `persist-credentials: false` vẫn giữ (yêu cầu FB-R1-SEC-OPS-04) và gitleaks `fetch-depth: 0` |
| #6 | node 22-alpine → **25**-alpine (Dockerfile.api/web) | xanh | **Đóng** | Node 25 là bản lẻ, không LTS; `.nvmrc` = 22, ADR-012 chọn Node 22 LTS. Nếu nâng thì lên 24 LTS theo ADR, đồng bộ `.nvmrc` + CI + image. Đề xuất `ignore` major cho ảnh `node` |
| #7 | @vitejs/plugin-react 5 → **6** | build-test đỏ (test `apps/guest-web`) | **Hoãn** | Major, đi cặp với vite 8 (#9). Gộp thành 1 việc nâng toolchain FE ở R3 do FE chủ trì |
| #8 | @nestjs/platform-fastify 11 → **12** (chỉ 1 gói) | build-test đỏ: 8 file test api `Cannot find module …` (lệch với @nestjs/common 11) | **Đóng** | Nest phải nâng cả họ `@nestjs/*` cùng lúc; nâng lẻ 1 gói luôn vỡ. Việc của BE/ARC khi có kế hoạch Nest 12. Đề xuất nhóm `nestjs` trong dependabot |
| #9 | vite 7 → **8** | build-test xanh; E2E đỏ (RBAC `approveRequest` RB-0067…, trùng lỗi main lúc đó – run 38887585274) | **Hoãn** | E2E đỏ không do vite nhưng chưa chứng minh xanh; gộp với #7, rebase khi main xanh rồi FE kiểm build/HMR 3 app |
| #10 | react-dom + @types/react-dom 18 → **19** | build-test đỏ (`apps/guest-web` `App.test.tsx`) | **Đóng** | Nâng react-dom 19 mà `react` vẫn 18 → lệch phiên bản. React 19 là quyết định FE/ARC (nâng `react`, `react-dom`, types cùng lúc). Đề xuất nhóm `react` |
| #11 | @types/node 22 → **26** | build-test xanh; E2E đỏ (cùng lỗi RBAC main cũ) | **Đóng** | Kiểu phải khớp runtime Node 22; types 26 cho phép dùng API không có ở Node 22 mà tsc không báo. Đề xuất `ignore` major cho `@types/node` |

Tổng: **Merge (sau rebase, CI xanh) 4** (#2–#5) · **Hoãn 2** (#7, #9) · **Đóng 5** (#1, #6, #8, #10, #11).

Thứ tự merge đề xuất khi main xanh: #5 checkout → #2 setup-node → #3 pnpm → #4 cache, mỗi PR một lần, đợi CI xanh rồi mới tới PR kế (cùng sửa `ci.yml`, rebase lẫn nhau).

## Đề xuất chỉnh `.github/dependabot.yml` (chưa áp – sẽ khiến Dependabot tự đóng/tạo lại PR)
Chưa sửa vì giao việc cấm đóng PR; áp sau khi ORC xử lý xong 11 PR trên:

```yaml
  - package-ecosystem: npm
    directory: /product
    schedule: { interval: weekly }
    open-pull-requests-limit: 5
    ignore:
      - dependency-name: '@types/node'        # theo Node runtime (.nvmrc 22)
        update-types: ['version-update:semver-major']
    groups:
      nestjs:   { patterns: ['@nestjs/*'] }
      react:    { patterns: ['react', 'react-dom', '@types/react', '@types/react-dom'] }
      vite:     { patterns: ['vite', '@vitejs/*', 'vitest', '@vitest/*'] }
      minor-and-patch: { update-types: [minor, patch] }
  - package-ecosystem: docker
    directory: /product/infra/docker
    schedule: { interval: monthly }
    ignore:
      - dependency-name: node                 # chỉ LTS chẵn, nâng qua ADR
        update-types: ['version-update:semver-major']
  - package-ecosystem: docker-compose
    directory: /product/infra
    schedule: { interval: monthly }
    ignore:
      - dependency-name: postgres             # nâng major = migration dữ liệu, qua ADR
        update-types: ['version-update:semver-major']
```
