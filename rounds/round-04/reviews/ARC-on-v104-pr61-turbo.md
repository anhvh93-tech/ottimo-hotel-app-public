# ARC review – PR #61 OPS "ci-turbo-inputs" (BUG-R4-029/030/031)

- Người review: ARC | Round 4 – v1.0.4 – Bước **Review** | 04/11/2026
- Đối tượng: `v104/ci-turbo-inputs` @ `d0b8fd58`, gồm 3 commit (`5d09cb86`, `4f972805`, `d0b8fd58`), base `40825ee1`. `ci.yml` không đổi.
- Đọc kèm: báo cáo `rounds/round-04/outputs/OPS/v1.0.4-ci-turbo-inputs.md` trên nhánh.
- CI của head: xanh mọi job, gồm `format · lint · audit · test · build`, `docker images build · E2E smoke`, `landing`, `infra scripts`, `API contract`, `gitleaks`. Các job deploy/publish bị bỏ qua (`skipping`), đúng với PR.

## Phán quyết: **ĐẠT**

Danh sách `inputs` đủ cho mọi task `test` mà turbo chạy. `globalDependencies` và `env` không làm mất cache quá mức. `openapi.ts` khớp hợp đồng.

Không có thẻ chặn. Thẻ 01 và 02 là Suggestion cho v1.0.5.

## 1. Kiểm độc lập của ARC

Môi trường: worktree tạm `scratchpad/wt-arc-pr61` @ `d0b8fd58` (đã xóa); turbo 2.11.8, dùng `--dry=json`, không chạy test.

Hash `landing-web#test` ra `49d5ddd2301587f9`, trùng hash trên CI trong báo cáo OPS. Vậy phép đo trên máy cho kết quả giống CI.

### 1.1 Quét tĩnh: tệp test và mã đọc ra ngoài gói
Hai lượt quét:
- Mọi chuỗi `../../…` trong `.ts/.tsx/.mjs`, giải đường dẫn theo gốc gói gần nhất (thư mục có `package.json`).
- Mọi `join(__dirname, '..', …)` trong test.

Đối chiếu với `inputs` đã khai:

| Gói | Đọc ngoài gói (ARC tìm thấy) | Đã khai / được tính |
|---|---|---|
| `api` | `docs/api/openapi.yaml`; `docs/rbac-matrix.md`; `tests/fixtures/{br-examples,rbac-cases}.json`; `tests/fixtures/seed/ds-e.json`; `apps/landing-web/src/content/en.ts`; `apps/guest-web/src/app/config.ts`; `design/copy/strings-vi.json`; `packages/i18n/src/plural-forms.cases.json`; `eslint.config.js` (ESLint `cwd = product`) | Đủ. `tests/fixtures` chỉ có 2 cấp (gốc và `seed/`), cả hai đều đã khai |
| `api` – migrations | `services/api/src/db/migrations/**` | Nằm trong gói (`$TURBO_DEFAULT$`). Sửa `_journal.json` thì `api#test` đổi hash (đã đo) |
| `integrations` | `infra/server/bin/ops-check.sh`, `requeue-email-changed.sh` | Đủ |
| `api-client` | `docs/api/openapi.yaml`, `.prettierrc.json` | Đủ |
| `ui` | `design/wireframes/assets/{tokens.css,icons.js}`. `styles/index.css` `@import` `tokens.css` + `hifi.css` | Đủ. `build.inputs` có `tokens`/`hifi`; `icons.js` chỉ test đọc, nên chỉ cần ở `test` |
| `i18n` | `design/copy/strings-en/vi.json` | Đủ (`build`, `typecheck`, `test`) |
| `admin-web` | `design/copy/strings-*.json`; `packages/ui/src/styles/app.css`; `packages/api-client/src` | Đủ. `ui` và `api-client` là phụ thuộc workspace, được tính qua `^build` |
| `guest-web` | `strings-*.json`; `design/tools/gen_strings.py` | Đủ |
| `mobile` | `design/copy` | Đủ |
| `landing-web` | `tokens.css` (qua `scripts/sync-tokens.mjs` + `brand.test.ts`); kiểu của `api-client/src/generated/openapi` | Đủ. `test.inputs` có `tokens.css`; `typecheck.inputs` có `openapi.ts`. Bản `build` dùng bản sao token trong gói, nên không cần thêm |
| `tests` (`validate-fixtures.mjs`) | `docs/business-rules.md`; `../02-escalations/ESC-*.md` | Đủ. Các spec e2e đọc `rounds/…/screenshots`, `openapi.yaml`, `strings-*` nhưng không phải task turbo (Playwright chạy riêng), nên không cần khai |

Các loại tệp ORC hỏi:
- fixtures: đủ;
- migrations: trong gói;
- contracts: `openapi.yaml` khai cho `api`/`api-client`; `openapi.test.yaml` cho `api`;
- scripts: `ops-check.sh`, `requeue-email-changed.sh`, `gen_strings.py`, `sync-tokens.mjs` trong gói.

**Không có test unit nào đọc `infra/postgres/*`** hay script ngoài gói khác. Script vai do CI chạy trước bước test, không phải test đọc.

### 1.2 Đo độ nhạy cache (bổ sung cho mục 5 của OPS)
Mỗi lần thêm một dòng trống vào tệp, so hash `--dry=json`, rồi trả lại tệp:

| Tệp đổi | Task `test` đổi hash |
|---|---|
| `../02-escalations/ESC-001.md` (**ngoài** `$TURBO_ROOT$`) | `tests`. Turbo vẫn băm đường dẫn ra ngoài gốc workspace, nên dòng khai sẵn có tác dụng |
| `design/wireframes/assets/icons.js` | `ui` |
| `tests/fixtures/seed/ds-e.json` | `api`, `tests` |
| `docs/api/openapi.test.yaml` | `api` |
| `services/api/src/db/migrations/meta/_journal.json` | `api` |

### 1.3 `globalDependencies` và `env`: có làm mất cache quá mức không
- **`tsconfig.base.json` vào `globalDependencies`: đúng.** Mọi `tsc`/esbuild/vitest đọc tệp này qua `extends`. Tệp hiếm khi đổi; mỗi lần đổi, mọi task chạy lại một lần, và đó là chi phí đúng.
- **`BOOTSTRAP_*` vào `test.env` (có băm), không dùng `passThroughEnv`: đúng.**
  - Có hay không có biến này cho ra hai kết quả khác nhau (11 ca so với 6 ca), nên khóa cache phải khác.
  - Trên CI, giá trị là hằng (`ci.yml` dòng 66–67), nên hash ổn định giữa các lượt, không gây miss lặp lại.
  - Trên máy dev, có hay không đặt biến thì ra khóa khác nhau. Như vậy là đúng.
  - `landing-web` có `env` riêng (ghi đè), nên không bị ảnh hưởng.
- **`strings-*.json` trong `api#test`** làm mỗi lần đổi chữ chạy lại bộ api (khoảng 11 phút trên CI). Đây là phụ thuộc thật, vì api đọc chữ VI cho mẫu thư. Chấp nhận: đúng quan trọng hơn nhanh.
- **Sau khi gộp:** lượt `push main` đầu tiên sẽ miss toàn bộ một lần (`globalDependencies` mới). Sau đó cache trở lại bình thường. Đo trên PR: bước test không cache mất 11 phút 38 giây, cả job 14 phút 37 giây, trong giới hạn 25 phút.

### 1.4 `api-client/src/generated/openapi.ts`
- Diff chỉ có 3 dòng mô tả `0.3.12 (SEC-BA-104-09 a)`, là đoạn P4-16 đã thêm vào `openapi.yaml` (`d22fb078`, `21aade4e`). Mỗi tệp có đúng 1 chỗ.
- `generated.test.ts` so tệp đã commit với `generate()` (đọc `openapi.yaml` và `prettier`). Trên CI, ca này chạy thật (`cache miss`) và đạt 37/37. **Khớp hợp đồng.**
- `main` đã thêm 6 commit sau `40825ee1`, nhưng không đổi `openapi.yaml`, `openapi.ts`, các `turbo.json` hay `tsconfig.base.json`. `git merge-tree` với `origin/main` sạch. Hai test admin-web mới trên `main` (`v104-hold-dialog-feb`, `v104-users-fea`) không đọc tệp ngoài gói.

### 1.5 BUG-R4-031 (test email, tệp của INT)
- Bỏ nhánh "đọc tệp lỗi thì `return`". Nhánh này từng là một kiểu xanh giả: dời `ops-check.sh` đi thì test im lặng đạt.
- Thêm ca so `email_rule` của bash với cùng hằng và cùng giới hạn 3–254 của SQL.
- Luật thật (`ops-check.sh`, `email-address.ts`) không đổi.
- Hai đột biến đều đỏ: bỏ `%`, và đổi `-le 254`.
- Về kỹ thuật, ARC đồng ý. INT duyệt nội dung, vì đây là tệp của INT.

## 2. Thẻ feedback

### FB-R4-ARC-OPS-PR61-01
- Mức độ: Suggestion (v1.0.5)
- Vị trí: `.github/workflows/ci.yml`. Đây là đường dẫn SEC, nên để sau bản cắt.
- Vấn đề: luật "test đọc tệp ngoài gói thì phải khai" hiện chỉ có trong `dev-setup.md` và điều kiện P0 của runbook. Lần tới có người quên khai, CI lại xanh giả cho tới khi có lượt `--force`.
- **ARC chọn phương án (a) của OPS:** lượt đêm `turbo run test --force` trên `main` (`schedule`, hoặc `workflow_dispatch` T9). Đỏ thì báo như lỗi P1 của cổng kiểm.
  - Phương án (b) (CI chạy lại công cụ dò của OPS) để sau. Nó đòi bảo trì một tệp `--require` trong repo; chỉ làm nếu (a) bắt được lỗi quên khai lần thứ hai.
- Trạng thái: Open (OPS, SEC duyệt `ci.yml`)

### FB-R4-ARC-OPS-PR61-02
- Mức độ: Suggestion (v1.0.5)
- Vị trí: `services/api/test/integration/production-bootstrap.test.ts` (`describe.skipIf(!BOOT_URL…)`).
- Vấn đề: nếu biến lại bị lọc, 5 ca "fresh empty database" lại im lặng bỏ qua. ADR-012 ý 4 yêu cầu thiếu biến thì đỏ.
- Đề xuất:
  - BE đổi thành: khi `CI` đặt mà thiếu `BOOTSTRAP_*` thì `throw`;
  - OPS khai `CI` vào `test.env` của turbo. Giá trị là hằng `true`, không gây miss.
  - ARC đồng ý với đề xuất ở mục 8 của OPS.
- Trạng thái: Open (BE + OPS)

## 3. Ghi nhận khác
- Ca chập chờn `s4-144-fea` mà OPS nêu ở mục 8 chính là BUG-R4-035 (P1). Lỗi đang được sửa ở PR #67, ARC đã review ĐẠT CÓ ĐK. Đúng như OPS nói, đó là khe đua của sản phẩm, không chỉ của test. Từ khi gộp PR này, các ca "chỉ đỏ khi tải nặng" sẽ hiện thường hơn. **Không** được nới bằng `retry`; ARC đồng ý.
- ARC đồng ý dòng decision-log OPS đề xuất ở mục 9. ARC duyệt danh sách `inputs` theo mục 1.1.
- Khóa cache CI lùi về `turbo-${runner.os}-` (phát lại kết quả của SHA trước). Với `inputs` đúng thì hợp lệ; giữ nguyên.

## 4. Điểm làm tốt
- Lấy danh sách bằng cách ghi lại các lần đọc thật, chứ không đoán. Có đối chiếu bằng quét tĩnh, và có bảng độ nhạy cho từng tệp.
- Phát hiện cả họ lỗi ở `build`/`typecheck` của gói chỉ có mã nguồn (`i18n`, `ui`), chứ không dừng ở `test`.
- Có bằng chứng CI trước và sau: `Cached: 13 cached`, 366 ms, thành mọi task test miss; `production-bootstrap` từ 6/11 thành 11/11.
