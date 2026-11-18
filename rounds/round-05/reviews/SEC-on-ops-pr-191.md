# SEC review – PR OPS #191 `r5-ops-audit-picomatch` (ngoại lệ audit CVE-2026-112366)

- Round 5 – bước Review. Người review: SEC. Tác giả: OPS.
- Phiên bản đã đọc: head `8cca55e1`. Diff chỉ sửa `product/package.json`: thêm `CVE-2026-112366` vào `pnpm.auditConfig.ignoreCves`. Lockfile không đổi.
- Căn cứ: SR-SUP-02 (High/Critical có bản sửa → CI đỏ; ngoại lệ phải có lý do và hạn), TM-48.
- Cách kiểm (không checkout nhánh PR):
  - `git show` lấy manifest và lockfile ở head PR. Lockfile trong checkout chung trùng với head PR (`git diff` rỗng).
  - Chạy `pnpm audit` / `pnpm why` / `pnpm list` chỉ đọc.
  - Đọc `Dockerfile.api`, `Dockerfile.web`, `Dockerfile.landing` và `ci.yml` ở head PR.

## Kết luận

**APPROVE.** Ngoại lệ hợp lệ theo SR-SUP-02: advisory chưa có bản vá, không có đường runtime, có lý do và hạn (2026-12-18 hoặc khi có bản vá). Có 2 thẻ Minor cho OPS làm tiếp, không chặn merge.

## Xác minh độc lập

| Khẳng định của OPS | Kết quả SEC |
|---|---|
| Advisory GHSA-fc5q-39xc-vjpf / CVE-2026-112366, picomatch ≤4.0.7, High, chưa có bản vá | **Đúng.** `pnpm audit --json`: `vulnerable_versions <=4.0.7`, `patched_versions <0.0.0`. Đây là advisory High duy nhất của cả repo (metadata: high 2 = 2 bản picomatch 2.3.2 và 4.0.7). Không có Critical. |
| `pnpm audit --prod --audit-level=high` sạch | **Đúng.** Exit 0. Có 13 mục Low/Moderate ở prod, dưới ngưỡng, xem thẻ 02. |
| Không có đường runtime | **Đúng.** `pnpm list -r --prod picomatch` rỗng. `pnpm why -r picomatch`: mọi workspace đều chỉ có nhóm `devDependencies` (typescript-eslint, vitest, vite, @vitejs/plugin-react, astro, @astrojs/check, unplugin-swc), không workspace nào có nhóm `dependencies`. |
| Image API không mang picomatch | **Đúng.** `Dockerfile.api` cài đủ ở stage `build`, rồi `pnpm --filter=@ottimo/api deploy --prod /out`. Stage `runtime` chỉ copy `/out/node_modules` và `dist`. Cây prod của `@ottimo/api` không có picomatch. |
| Landing và web chạy tĩnh qua Caddy | **Đúng.** `Dockerfile.landing` và `Dockerfile.web` build bằng Node, còn runtime là `caddy:2-alpine` chỉ chứa `dist`. Picomatch không phải dependency của mã ứng dụng, nên không bị bundle vào JS phía khách. |
| Đầu vào glob không phải dữ liệu người dùng | **Đúng.** Picomatch chỉ chạy trong tooling (eslint, vite, vitest, astro) với glob cấu hình trong repo. Rủi ro ReDoS dừng ở chỗ làm chậm máy dev/CI, và kẻ tấn công phải sửa được repo mới khai thác được. |

Mức rủi ro còn lại: **Low**. SEC chấp nhận tới hạn 2026-12-18.

## Thẻ feedback

### FB-R5-SEC-OPS-191-01
- Mức độ: Minor
- Vị trí: `product/package.json > pnpm.auditConfig.ignoreCves`; `.github/workflows/ci.yml` bước "Dependency audit" (dòng 102–104).
- Vấn đề:
  - `ignoreCves` bỏ qua CVE này cho **mọi** đường, kể cả prod.
  - Nếu trước hạn có một dependency runtime mới kéo picomatch vào (ví dụ thư viện upload hay glob ở API), CI vẫn xanh. Ngoại lệ khi đó che một lỗ hổng runtime thật.
  - Hạn 2026-12-18 chỉ nằm trong mô tả PR. JSON không ghi chú được, và chưa có gì nhắc khi tới hạn.
- Vì sao quan trọng: SR-SUP-02 cho phép ngoại lệ vì không có đường runtime. Điều kiện đó cần được máy kiểm liên tục, không chỉ kiểm một lần lúc review.
- Đề xuất sửa:
  - (a) Thêm bước CI chạy ngay sau audit: `test -z "$(pnpm list -r --prod --depth Infinity --parseable picomatch)"`. Bước này đỏ nếu picomatch vào cây prod khi ngoại lệ còn hiệu lực.
  - (b) Ghi ngoại lệ vào `01-decisions/decision-log.md` (CVE, lý do, hạn 2026-12-18, người duyệt SEC), hoặc vào một file `product/docs/security/audit-exceptions.md`.
  - (c) Đặt nhắc kiểm lại vào ngày 2026-12-18. Khi Renovate báo picomatch có bản vá: gỡ mục ignore, nâng hoặc override.
  - Làm (a) trong PR này hoặc một PR OPS tiếp theo trong round 5.
- Trạng thái: Open

### FB-R5-SEC-OPS-191-02
- Mức độ: Minor
- Vị trí: kết quả `pnpm audit --prod` (ngoài phạm vi diff).
- Vấn đề: cây prod còn 13 mục Low/Moderate **đã có bản vá**:
  - `fast-uri` <3.1.9 / <4.2.3, dùng ở runtime qua fastify/ajv: CVE-2026-110306, -110180, -110095, -110725;
  - `nodemailer` <10.1.4: 3 GHSA;
  - `react-router` <7.18.0: CVE-2026-53669, -53666;
  - có thêm `esbuild`, `minimatch`, `astro`, nhưng thuộc dev/build.
- Vì sao quan trọng: dưới ngưỡng High nên không làm CI đỏ, đúng SR-SUP-02. Nhưng `fast-uri` nằm trên đường xử lý request của API, và `nodemailer` là đường gửi email khách.
- Đề xuất sửa: OPS mở PR nâng hoặc override `fast-uri` ≥3.1.9/≥4.2.3, `nodemailer` ≥10.1.4, `react-router` ≥7.18.0. Trước đó kiểm Renovate có đang treo các PR này không. Không chặn PR #191.
- Trạng thái: Open

## Điểm làm tốt

- PR rất gọn (1 dòng), lockfile không đổi, không override bừa sang một bản chưa phát hành.
- Mô tả PR liệt kê đủ đường phụ thuộc, có hạn rõ ràng, và tự dừng chờ SEC duyệt, đúng quy trình SR-SUP-02.
- Dùng đúng cơ chế `auditConfig.ignoreCves` theo từng CVE, không hạ `--audit-level` chung của CI.
