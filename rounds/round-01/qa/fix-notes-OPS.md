# Fix notes – OPS (Round 1, Bước 5 – vòng sửa lỗi)

Ngày: 16/10/2026 · Người sửa: OPS · Nguồn: `sec-findings.md` Phần B (BUG-R1-SEC-06, -08, phần OPS của -07) và `fix-notes-ARC.md` (ARC chốt mô hình 4 vai erd 2.1, giao OPS). Không commit.

| BUG | Trạng thái | Ghi chú |
|---|---|---|
| BUG-R1-SEC-06 (P3) | Fixed | Mô hình 4 vai theo erd 2.1. `product/infra/postgres/init/02-roles.sh`: `ottimo_owner` **NOLOGIN, PASSWORD NULL** (chủ DB/schema `public`); thêm `ottimo_migrator` `LOGIN NOSUPERUSER NOBYPASSRLS NOINHERIT`, `GRANT ottimo_owner … WITH INHERIT FALSE, SET TRUE` → migration phải `SET ROLE ottimo_owner` (để lại dấu vết), `CONNECT` trên DB; `ottimo_app` giữ `NOSUPERUSER NOBYPASSRLS NOINHERIT`, `REVOKE ottimo_owner FROM ottimo_app/readonly`; `ottimo_readonly` `BYPASSRLS NOLOGIN` (bật theo runbook). Script **chạy lại được** (tạo nếu thiếu bằng `\gexec`, rồi `ALTER ROLE` về đúng thuộc tính) → volume dev cũ chuyển được không cần `down -v`. Biến `OTTIMO_OWNER_DB_PASSWORD` → `OTTIMO_MIGRATOR_DB_PASSWORD`. `MIGRATION_DATABASE_URL=postgres://ottimo_migrator:…` ở `.env.example` và CI (`build-test` env, bước tạo vai, smoke test docker-build). Compose: postgres nhận `OTTIMO_MIGRATOR_DB_PASSWORD`; ghi chú api/worker **không** nhận `MIGRATION_DATABASE_URL` (service `migrate` một lần ở R2). Test `services/api/test/db-role.test.ts`: thêm kiểm `ottimo_app` không thuộc `ottimo_owner`, không sở hữu DB; 4 vai đúng thuộc tính (`ottimo_owner rolcanlogin=false`); khối `MIGRATION_DATABASE_URL`: đăng nhập là `ottimo_migrator`, không superuser/BYPASSRLS, **không** có quyền CREATE trên `public` trước `SET ROLE`, có sau `SET LOCAL ROLE ottimo_owner`. Tài liệu: `dev-setup.md` (bảng mật khẩu, bảng vai, cây thư mục, sự cố thường gặp – cách chuyển volume cũ), `hosting-plan.md` 8.1 (mật khẩu `ottimo_migrator`, owner không mật khẩu). |
| BUG-R1-SEC-08 (P3) – phần OPS | Fixed | Script mới `product/infra/ci/check-no-test-surface.sh`: `spec <openapi.yaml>` lỗi nếu có path item `/__test__` dưới `paths:` (mô tả nhắc `/__test__/*` không tính); `bundle <dir>…` lỗi nếu có chuỗi `__test__`/`TestSupportModule` hoặc thư mục `test-support`. CI: job mới **`test-surface-guard`** (chặn, không `continue-on-error`) chạy `spec` trên `docs/api/openapi.yaml`; job `docker-build` thêm bước sau khi build image api: `docker cp /app/dist` (+ `node_modules/@ottimo` nếu có) rồi chạy `bundle`. `Dockerfile.api`: `ARG INCLUDE_TEST_SUPPORT=0` – mặc định (production) xóa `services/api/dist/test-support`; compose dev build với `INCLUDE_TEST_SUPPORT=1` để E2E local dùng `/__test__`. Phần ARC (`openapi.test.yaml` security AND) ARC đã sửa. |
| BUG-R1-SEC-07 (P3) – phần OPS | Fixed | `.env.example`: `GUEST_CODE_SIGNING_KEY` (đã có tên tạm) – sửa chú thích: HMAC-SHA256 cho `guest_verification_code.code_hash`, mỗi mục đích một khóa (ADR-013 điểm 5), staging/production ≥ 32 ký tự qua `GUEST_CODE_SIGNING_KEY_FILE`. `hosting-plan.md` 8.1 thêm dòng sổ bí mật. `dev-setup.md` liệt kê khóa này trong nhóm được để trống ở dev/test. Phần BE (`REQUIRED_SECRETS`) làm ở R2. |

## Kiểm tĩnh (máy chưa có Node/Docker)

| Kiểm | Kết quả |
|---|---|
| `bash -n` `02-roles.sh`, `check-no-test-surface.sh` | OK |
| YAML `ci.yml`, `docker-compose.yml` (PyYAML) | OK |
| `check-no-test-surface.sh spec docs/api/openapi.yaml` | exit 0 |
| `check-no-test-surface.sh spec docs/api/openapi.test.yaml` (đối chứng, phải đỏ) | exit 1 – bắt đúng 2 path |
| `bundle` trên thư mục giả sạch / có `'/__test__/clock'` | exit 0 / exit 1 |
| `grep __test__\|TestSupportModule` trong `services/api/src` hiện tại | không có → bước bundle CI sẽ xanh ở R1 |
| Placeholder mới `change_me_migrator_dev_only`, `ci_migrator_only` | khớp allowlist `.github/gitleaks.toml` |
| `02-roles.sh` trên PostgreSQL thật, `db-role.test.ts`, build image, CI | **chưa chạy** (không có Node/Docker) – chạy lần đầu ở CI khi commit |

## Giả định / lưu ý cho đội
- `ottimo_readonly` giữ **NOLOGIN** (erd 2.1 ghi `LOGIN BYPASSRLS`): chặt hơn, đăng nhập chỉ bật tạm theo runbook (SR-OPS-04) như đã chốt ở FB-R1-SEC-OPS-01. ARC có thể ghi chú cột "Thuộc tính" erd 2.1 cho khớp.
- `GRANT … WITH INHERIT FALSE, SET TRUE` cần PostgreSQL ≥ 16 (dự án ghim 17).
- **BE (R2)**: `TestSupportModule` + controller phải nằm trong `services/api/src/test-support/`; `app.module.ts` import động thư mục đó (default export) **không** viết chuỗi `__test__`/`TestSupportModule` trong file ngoài thư mục này, nếu không bước bundle CI sẽ đỏ. Migration chạy `SET ROLE ottimo_owner` ở đầu (erd 16); pg-boss cài bằng `ottimo_migrator` → `SET ROLE ottimo_owner`.
- Dev có volume cũ: sửa `.env` theo `.env.example` (đổi `OTTIMO_OWNER_DB_PASSWORD` → `OTTIMO_MIGRATOR_DB_PASSWORD`, `MIGRATION_DATABASE_URL` mới); compose sẽ báo thiếu biến nếu chưa sửa (fail rõ ràng).
- Ngoài phạm vi vòng này: BUG-R1-021 (job `api-contract` / `gen_traceability.py --strict`) vẫn Open – ARC báo `--strict` đã exit 0, có thể thêm ở vòng sau.
