# OPS – Round 2, Đợt 0: việc theo yêu cầu BE (d0-foundation mục "Cần vai khác")

- Vai: OPS | Ngày: 16/10/2026 | Không commit (ORC commit) | Đầu vào: `rounds/round-02/outputs/BE/d0-foundation.md` mục 5 "Việc cần vai khác", `services/api/src/config.ts`, `src/db/migrate-cli.ts`, `src/db/seed/seed-cli.ts`, erd 16
- Kết quả: đủ 5 việc ORC giao + 1 việc phát sinh (cache Turbo). Chạy thật trên máy INV (macOS, Node 22.23.3, pnpm 9.15.4, OrbStack, Compose v5.5.0, PostgreSQL 17.11).

## 1. Thay đổi

| # | Việc | Nội dung | File |
|---|---|---|---|
| 1 | Biến môi trường | `.env.example`: thêm `CLOCK_MODE=mutable`, `INCLUDE_TEST_SUPPORT=1`, `TEST_SUPPORT_TOKEN=change_me_test_support_token_dev_only` (37 ký tự, khớp regex allowlist gitleaks `change_me_*dev_only`), `COOKIE_SECURE_PREFIX=false`, chú thích production/staging; **xóa `CLOCK_OVERRIDE=`**; ghi `TRUST_PROXY` bắt buộc ở staging/production + chỉ dải nội bộ. `QA_SEED_PASSWORD` đã có từ W1 | `product/.env.example` |
| 1 | Compose | `x-api-env`: bỏ `CLOCK_OVERRIDE`; thêm `CLOCK_MODE` (mặc định `mutable`), `INCLUDE_TEST_SUPPORT` (mặc định `1`, **cùng biến** với build-arg của image api – đặt `0` thì image cũng không có `dist/test-support`), `TEST_SUPPORT_TOKEN` (bắt buộc `:?`, báo rõ tên biến), `COOKIE_SECURE_PREFIX` (mặc định `false`). `QA_SEED_PASSWORD` chỉ đưa vào dịch vụ `seed`, không đưa vào api/worker | `product/infra/docker-compose.yml` |
| 1 | CI env | `make-ci-env.sh` sinh ngẫu nhiên thêm `TEST_SUPPORT_TOKEN` (48 hex), mask, kiểm dòng tồn tại, xuất ra `$GITHUB_ENV` (cho bước E2E gọi `/__test__/*` sau này) | `product/infra/ci/make-ci-env.sh` |
| 1 | `.env` máy INV (gitignore) | Xóa dòng `CLOCK_OVERRIDE` (thay bằng chú thích), thêm 5 biến (token/mật khẩu sinh bằng `secrets.token_hex(24)`, không in ra log), quyền 0600; tập khóa `.env` = tập khóa `.env.example` | `product/.env` (không commit) |
| 2 | Dịch vụ `migrate` | One-shot `node dist/db/migrate-cli.js`, dùng lại image `ottimo-api:dev` (`pull_policy: never`, chỉ `api` build – giữ FB-R1-ARC-OPS-07), chỉ dịch vụ này nhận `MIGRATION_DATABASE_URL` (`ottimo_migrator`; runner tự `SET ROLE ottimo_owner`), `restart: 'no'`. `api` và `worker` `depends_on: migrate: service_completed_successfully` | `product/infra/docker-compose.yml` |
| 2 | Dịch vụ `seed` (thêm) | Profile `seed`, không chạy khi `up`: `docker compose … --profile seed run --rm seed [--allow-code-drift]`; chạy `dist/db/seed/seed-cli.js --file /fixtures/ds-e.json` bằng `ottimo_app`, mount `tests/fixtures/seed` (token thiết bị ghi `.out/`, đã gitignore) | `product/infra/docker-compose.yml` |
| 2 | CI migrate | `build-test`: bước `pnpm db:migrate` (sau khi build gói phụ thuộc `turbo run build --filter=@ottimo/api^...` – runner import `@ottimo/integrations`) trước `pnpm test`. `docker-build`: migrate **từ image production** 2 lần (lần 2 = no-op) trước smoke `/health`. E2E: stack compose có `migrate` (đổi tên bước) | `.github/workflows/ci.yml` |
| 3 | CI schema ↔ migration | `build-test`: `drizzle-kit generate < /dev/null` (timeout 3 phút) rồi `git status --porcelain --untracked-files=all -- services/api/src/db/migrations` phải rỗng, sai thì `::error::` hướng dẫn `db:generate` | `.github/workflows/ci.yml` |
| 4 | CI RBAC | `api-contract`: bước `python3 product/tests/tools/gen_rbac_cases.py --check` (chặn) | `.github/workflows/ci.yml` |
| 5 | Tài liệu | `dev-setup.md`: lệnh sinh ngẫu nhiên thêm token/seed password; hướng dẫn nâng `.env` cũ; bảng biến đồng hồ/kiểm thử theo môi trường; thứ tự `postgres → migrate → api/worker → web`; `seed` (compose và `pnpm seed:ds-e`); lệnh `pnpm db:migrate`, kiểm `drizzle-kit generate`; số test mong đợi **121** (13 file) + integrations 46 + 3 app; 7 dòng sự cố mới (`CLOCK_OVERRIDE`, thiếu token, `migrate Exited (1)`, `StartupCheckError`, 2 bước CI mới); cây thư mục và danh sách job CI. `hosting-plan.md`: dòng kiểm cấu hình khởi động theo config mới | `product/docs/dev-setup.md`, `product/docs/hosting-plan.md` |
| 6 | Cache Turbo (phát sinh) | Test api đọc `docs/api/openapi*.yaml` và `tests/fixtures/seed/*.json` nằm **ngoài** package → Turbo không băm, có thể phát lại kết quả cũ khi fixture/OpenAPI đổi (gặp thật: lần chạy đầu `pnpm test` in kết quả cache). Thêm `services/api/turbo.json` (`extends //`, `inputs` = `$TURBO_DEFAULT$` + 4 tệp đó). Kiểm bằng `--dry=json`: 4 tệp nằm trong inputs | `product/services/api/turbo.json` |
| – | Quyết định | 3 dòng OPS | `01-decisions/decision-log.md` |

## 2. Kết quả chạy thật (16/10/2026)

| Lệnh / kiểm tra | Kết quả |
|---|---|
| `pnpm -s format:check`, `pnpm -s lint` | sạch; exit 0 |
| `pnpm exec turbo run build --filter=@ottimo/api^...` rồi `pnpm db:migrate` (ottimo_test) | `migrations applied`; exit 0 |
| `turbo run test --force` (không cache, DB thật, HEAD `d21b36d` + thay đổi OPS) | `@ottimo/api` **Test Files 13 passed, Tests 121 passed (121)**, integrations 46, 3 app × 1, Turbo 9/9, **0 cached**, không skipped |
| `drizzle-kit generate` (non-TTY) | `No schema changes, nothing to migrate`, không file mới |
| Đối chứng đỏ drizzle | thêm tạm cột `ops_probe` vào `organization` → sinh `0004_*.sql` + snapshot + journal → bước CI sẽ đỏ; đã hoàn nguyên (`git status` sạch) |
| `gen_rbac_cases.py --check` | Trước commit `d21b36d`: **STALE** (fixture lệch OpenAPI 0.3.1). Sau khi QA/ORC sinh lại: `OK – rbac-cases up to date`, exit 0 |
| `docker compose … up --build --detach --wait` (stack dev `ottimo-dev`) – 2 lần | exit 0; `migrate Exited (0)` (`migrations applied`, lần 2 no-op), api healthy, worker `worker started` + `job done log.partitions`, web up |
| `curl :3000/health`, `:8081/health` | 200 `{"status":"ok","db":"ok",…+07:00}` / 200 |
| `/__test__/clock` không token | 401 (api log `test-support endpoints enabled`) |
| `pnpm test:e2e` (stack dev) | **2 passed** (TC-X-050a, 050b), 43 skipped (pending + 050c cần `E2E_COMPOSE_CONTROL=1` – không bật trên DB dev dùng chung) |
| `docker compose … --profile seed run --rm seed` | Kết nối, chờ `migrate`, đọc fixture, báo `DS-E is already loaded in this database` (DB dev đã được nạp trước đó) – exit 1 đúng ý, không đổi dữ liệu |
| Image production (`INCLUDE_TEST_SUPPORT=0`) trên PostgreSQL tạm: `node dist/db/migrate-cli.js` × 2 | cả 2 lần exit 0; `drizzle.__drizzle_migrations` = 4 dòng; api `APP_ENV=test` `/health` 200; `dist/` không có `test-support`; đã dọn container/network/image |
| Compose thiếu `TEST_SUPPORT_TOKEN` | `required variable TEST_SUPPORT_TOKEN is missing a value: set TEST_SUPPORT_TOKEN (>= 32 chars) in product/.env` |
| `make-ci-env.sh` | `OK … (5 random values)`, 2 dòng 48 hex (token, seed password) |
| gitleaks v8.21.2 (`--no-git`, các tệp đã sửa) | `no leaks found` |
| `ci.yml` parse YAML | OK (actionlint không có trên máy) |

## 3. Giả định
- Dev mặc định `CLOCK_MODE=mutable` (E2E cần tua giờ); muốn giờ thật thì đặt `system` trong `.env`.
- Dev `COOKIE_SECURE_PREFIX=false`: http://localhost không có HTTPS, WebKit bỏ cookie `Secure` trên http. Config chỉ nhận `false` ở dev/test.
- `TEST_SUPPORT_TOKEN` bắt buộc trong compose kể cả khi `INCLUDE_TEST_SUPPORT=0` (compose không có điều kiện) – tài liệu ghi rõ.
- `QA_SEED_PASSWORD` không cấp cho api/worker (giảm bề mặt), chỉ cho dịch vụ `seed`.

## 4. Chưa xong / cần vai khác
| Việc | Ai | Ghi chú |
|---|---|---|
| CI trên GitHub với các bước mới chưa chạy (OPS không push) | ORC | Sau khi commit, xem `gh run list`; bước mới có thể đỏ thật nếu schema/rbac lệch – đó là đúng ý, không tắt |
| Tài liệu của vai khác còn nhắc `CLOCK_OVERRIDE` như cơ chế đang dùng: `docs/qa/test-strategy.md` dòng 58, 155 (QA); `docs/security/threat-model.md` TM-33, `docs/security/security-requirements.md` SR-SECR-05 (SEC) | QA, SEC | OPS không sửa tệp của vai khác; thay bằng `CLOCK_MODE`/`/__test__/clock` |
| E2E dùng `TEST_SUPPORT_TOKEN` từ `$GITHUB_ENV` + phiên owner để chạy ca theo giờ | QA | Biến đã sẵn trong CI |
| TC-X-050c (dừng/bật postgres) chưa chạy ở máy (chỉ chạy trong CI, stack dùng một lần) | – | Như W1 |
| `infra/docker-compose.prod.yml` (staging/production) với `migrate` là bước deploy riêng | OPS | Việc staging R2 (chờ ESC hạ tầng) |

Không có ESC mới.
