# Fix notes – INT – Round 1 (bước 5)

## BUG-R1-004 (= BUG-R1-SEC-09) – `APP_ENV` trong README tích hợp lệch giá trị hợp lệ
- Nguồn chuẩn: `product/services/api/src/config.ts` – `APP_ENVS = ['dev', 'test', 'staging', 'production']`.
- Đã sửa `product/integrations/README.md`:
  - Mục 4 (dòng 270): `APP_ENV=development  # development | staging | production` → `APP_ENV=dev  # dev | test | staging | production (...)`, khớp `product/.env.example`, `docker-compose.yml`, `architecture.md`, `dev-setup.md`.
  - Mục 1.2 (dòng 15): `<NHÓM>_MOCK_SCENARIO` "(chỉ dev/staging)" → "(chỉ `APP_ENV=dev|test|staging`)" – bổ sung `test` mà CI dùng.
  - Mục 1.3 (dòng 23): ví dụ `if (env === 'prod')` → `if (APP_ENV === 'production')` để không gợi ý giá trị `prod` không tồn tại.
  - Quy tắc chặn mock/sandbox khi `APP_ENV=production` giữ nguyên.
- Đã rà: `product/docs/integrations.md`, `product/integrations/**`, `rounds/round-01/outputs/INT/` – không còn `development`/`prod` làm giá trị APP_ENV. (`NODE_ENV=development` trong `product/.env.example` là biến khác, file của OPS – không đụng.)
- Trạng thái đề xuất: Fixed – chờ QA/SEC xác nhận.
