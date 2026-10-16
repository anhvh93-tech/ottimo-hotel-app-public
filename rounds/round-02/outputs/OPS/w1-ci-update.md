# OPS – Round 2, Tuần 1: cập nhật CI (E2E smoke, QA_SEED_PASSWORD, contract chặn, api-contract)

- Vai: OPS | Ngày: 16/10/2026 | Không commit (theo chỉ đạo ORC)
- Máy: macOS, Node 22 (`~/.local/node`), pnpm 9.15.4, Docker + Compose (OrbStack), Python 3.9.6
- Căn cứ: QA `w1-report.md` mục 5 (2); plan R2 dòng OPS (1) (bật chặn `contract-lint`, job `api-contract`); BUG-R1-021; INT `w1-report.md` mục "OPS" (chú thích luật (b)/(c))
- Mọi kết quả dưới đây là **chạy thật trên máy này**. CI GitHub cho thay đổi này **chưa chạy** (chưa push – ORC push).

## 1. Bảng thay đổi

| # | Việc | Thay đổi | File |
|---|---|---|---|
| 1 | E2E smoke trong CI | Job `docker-build` (tên mới "docker images build · E2E smoke", timeout 20 → 30 phút): sau smoke image production cũ → dọn container `api`/`pg` (giải phóng cổng 3000) → pnpm + Node (cache pnpm) → `pnpm install --frozen-lockfile` → lấy phiên bản Playwright → **cache `~/.cache/ms-playwright`** (khóa `playwright-<os>-<phiên bản>-chromium-webkit`) → miss: `playwright install --with-deps chromium webkit`, hit: chỉ `install-deps` (thư viện apt không cache được) → sinh `.env` dùng một lần → `docker compose … up --build --detach --wait` → `pnpm test:e2e` với `E2E_API_URL=:3000`, `E2E_WEB_URL=:8081`, **`E2E_COMPOSE_CONTROL=1`** → khi đỏ: log compose + upload `playwright-report`/`test-results` (7 ngày) → luôn `down --volumes` và xóa `.env` | `.github/workflows/ci.yml` |
| 2 | `QA_SEED_PASSWORD` | `.env.example`: khối mới "QA seed" với placeholder `change_me_qa_seed_dev_only` (khớp allowlist gitleaks `change_me_*dev_only`), ghi rõ chỉ dev/test/staging, không đặt ở production. CI: script mới sinh ngẫu nhiên (openssl 24 byte hex) cho `QA_SEED_PASSWORD` **và** 3 mật khẩu DB (`POSTGRES_PASSWORD`, migrator, app) mỗi lần chạy, `::add-mask::` trước khi in, xuất `QA_SEED_PASSWORD` sang `$GITHUB_ENV` cho loader seed sau này; dừng nếu template còn `change_me_` lạ hoặc thiếu dòng `QA_SEED_PASSWORD`. Không dùng secret repo | `product/.env.example`, `product/infra/ci/make-ci-env.sh` (mới) |
| 3a | `contract-lint` chặn | Bỏ `continue-on-error: true`, sửa chú thích (R2 chặn) | `ci.yml` |
| 3b | Job `api-contract` (BUG-R1-021) | Job mới: `openapi-spec-validator==0.7.2` (venv, ghim phiên bản) cho `openapi.yaml` + `openapi.test.yaml` (plan R2 W5 có nêu) và `python3 product/tests/tools/gen_traceability.py --strict --out $RUNNER_TEMP/traceability.md` (ghi ra thư mục tạm – không đụng `docs/qa/traceability.md` của QA) | `ci.yml` |
| 4 | Chú thích assertSafeConfig | Đầu `.env.example`: thay 1 dòng "Production rejects…" bằng khối mô tả: mọi môi trường (giá trị biến chọn hợp lệ), production (a) cấm mock/sandbox, **(b)** phương thức trong `PAYMENT_METHODS_ENABLED` phải `MODE=production` – chép nguyên file lên production sẽ **cố ý** không khởi động, **(c)** không được đặt `*_MOCK_SCENARIO` (xóa/để trống 2 biến) | `product/.env.example` |
| 5 | Phụ: chạy thử song song stack dev | Cổng host postgres đọc `${POSTGRES_HOST_PORT:-5432}` (mặc định không đổi) để chạy một stack compose thứ hai (`COMPOSE_PROJECT_NAME=ottimo-ci`) khi DB dev đang dùng chung; ghi chú trong `.env.example` (dòng comment) và `dev-setup.md` mục 3 | `product/infra/docker-compose.yml`, `product/docs/dev-setup.md` |
| 6 | Quyết định OPS | 1 dòng decision-log (CI: contract chặn, api-contract, E2E, mật khẩu CI ngẫu nhiên) | `01-decisions/decision-log.md` (xem mục 4 – đã lọt vào commit `588b1df` của ORC) |

## 2. Kết quả chạy thật (16/10/2026)

| Lệnh | Kết quả |
|---|---|
| `python3 product/tests/tools/gen_traceability.py --strict --out <tạm>` | **exit 0**. RBAC: ops mismatched 0, fields mismatched 0, unknown codes []; x-rbac-field tagged 115, untagged []; Must R2 68/68, AC 232/232. Thông tin (không làm đỏ `--strict`): 3 tham chiếu AC sai trong TC (`TC-L5-033`→US-086/AC3, `TC-L5-039`→US-119/AC5, `TC-L8-006`→US-012/AC2), 20 chuyển trạng thái chưa có TC, 31 BR có story nhưng chưa có TC |
| `python3 -m openapi_spec_validator` openapi.yaml / openapi.test.yaml (0.7.2) | OK / OK |
| `npx @redocly/cli@1.34.21 lint product/docs/api/openapi.yaml` | **valid, exit 0**, 0 lỗi, 4 cảnh báo → bỏ `continue-on-error` an toàn |
| `pnpm format:check` / `pnpm lint` | xanh / xanh (ESLint + typecheck 9/9) |
| `turbo run test --force` (DB `ottimo_test`, vai `ottimo_app`/`ottimo_migrator`) | 9/9 task: api 35 passed, integrations 32, 3 app × 1, `@ottimo/tests` validator OK (0 lỗi, 1 cảnh báo đã biết) |
| `make-ci-env.sh .env.example <tạm>` | OK; 4 giá trị 48 hex thay đúng `DATABASE_URL`, `MIGRATION_DATABASE_URL`, 3 mật khẩu DB, `QA_SEED_PASSWORD`; với `GITHUB_ACTIONS=true` in 4 dòng `::add-mask::` và ghi `QA_SEED_PASSWORD` vào `$GITHUB_ENV`; template thiếu dòng `QA_SEED_PASSWORD` → exit 1; thiếu tham số → exit 2 |
| shellcheck v0.10.0 `make-ci-env.sh` | sạch (sau khi sửa 1 info SC2015) |
| actionlint 1.7.7 `ci.yml` | 0 lỗi ở phần mới; 2 ghi chú shellcheck ở **bước cũ** (SC2086 info dòng `bundle $dirs` – cố ý tách từ; SC2034 biến vòng lặp `i`) – không sửa trong lượt này |
| **Mô phỏng job docker-build** trong bản sao `product/` ở thư mục tạm, `COMPOSE_PROJECT_NAME=ottimo-ci POSTGRES_HOST_PORT=55432` (không đụng stack dev): `pnpm install --frozen-lockfile` → `make-ci-env.sh` → `docker compose … up --build --detach --wait --wait-timeout 300` | 34 giây; postgres/api/web/worker **Healthy** |
| `CI=true E2E_COMPOSE_CONTROL=1 pnpm test:e2e` (trên stack trên) | **45 tests: 3 passed (TC-X-050a, b, c), 42 skipped, 0 failed**, 1,2 s. TC-X-050c dừng postgres → 503 → bật lại → 200 chạy thật lần đầu dưới QA framework; tạo `junit.xml` + `playwright-report/index.html`; junit không chứa mật khẩu |
| Đối chứng: `E2E_API_URL=http://127.0.0.1:3999 pnpm test:e2e` | exit 1 (bước CI sẽ đỏ khi api không lên) |
| `docker compose … down --volumes --remove-orphans` + xóa `.env` | Volume `ottimo-ci_pgdata`, network xóa; `ottimo-dev-postgres-1` vẫn Up (healthy) – stack dev không bị ảnh hưởng |
| gitleaks v8.21.2 (`dir`, config repo) trên `.env.example`, `product/infra`, `.github` | no leaks found |
| `gh run list` | run `38859765585` (main, commit `a1cd73a`) success – trước thay đổi này |

Chưa chạy được ở máy:
- Cài trình duyệt Playwright (`install --with-deps chromium webkit`) và bước cache: chỉ có trên runner Ubuntu (apt); bộ smoke hiện chỉ dùng `request`, không cần trình duyệt, nên kết quả E2E ở trên vẫn đại diện. Khóa cache và lệnh `playwright --version` → `1.63.0` đã kiểm.
- Toàn bộ `ci.yml` mới trên GitHub: chờ ORC push, sau đó xem `gh run view`.

## 3. Giả định
- Giữ bước smoke image production (`ottimo-api:ci`, APP_ENV=test, kiểm fail-fast APP_ENV) – E2E chạy trên **image dev** (`INCLUDE_TEST_SUPPORT=1`, như `pnpm dev`) vì E2E sau này cần `/__test__` (ADR-008). Hai mục đích khác nhau, cùng job.
- Cài cả `chromium` và `webkit` (đúng 4 project trong `playwright.config.ts`) dù hiện chưa có ca UI; thêm ~1–2 phút ở lần miss cache. Có thể rút lại chỉ chromium nếu thời gian job thành vấn đề.
- `api-contract` không chạy trên `needs` nào (song song, ~30 s); không yêu cầu `docs/qa/traceability.md` đã cập nhật (đó là việc QA sinh lại khi đổi TC).
- `QA_SEED_PASSWORD` placeholder có giá trị (không để trống) để `pnpm seed:*` chạy ngay ở dev khi BE có loader; staging lấy giá trị riêng.

## 4. Rủi ro / việc chưa xong
1. Dòng decision-log của OPS đã nằm trong commit `588b1df` ("note test-only VietQR account…") do ORC commit file lúc tôi đang làm – nội dung đúng, nhưng ORC lưu ý commit đó không chỉ có ghi chú INV.
2. Lần chạy CI đầu sẽ miss cache trình duyệt; `docker compose up --build` dựng lại `ottimo-api:dev` (khác ARG `INCLUDE_TEST_SUPPORT`) – job dài hơn, đã nâng timeout 30 phút.
3. `gen_traceability --strict` còn báo 3 tham chiếu AC sai trong TC (không làm đỏ) – QA nên sửa; nếu muốn chặn cả lỗi này cần QA thêm vào điều kiện `--strict`.
4. 2 ghi chú actionlint ở bước cũ (không ảnh hưởng chạy).
5. Việc OPS R2 còn lại: staging + deploy, migration service, CODEOWNERS/branch protection, lọc `Dockerfile.web` để không kéo `@playwright/test` (QA mục 5.5).

## 5. File tạo/sửa
- Tạo: `product/infra/ci/make-ci-env.sh`, `rounds/round-02/outputs/OPS/w1-ci-update.md`
- Sửa: `.github/workflows/ci.yml`, `product/.env.example`, `product/infra/docker-compose.yml`, `product/docs/dev-setup.md`, `01-decisions/decision-log.md` (đã bị commit kèm `588b1df`)
