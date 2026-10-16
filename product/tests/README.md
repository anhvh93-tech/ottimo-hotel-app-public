# product/tests

Gói workspace `@ottimo/tests` (QA). Chiến lược: `docs/qa/test-strategy.md`.

| Thư mục / file | Nội dung | Lệnh |
|---|---|---|
| `fixtures/br-examples.json` | Oracle từ cột "Mặc định & ví dụ số" của `docs/business-rules.md` (test-strategy 2.1). Test unit của BE đọc file này | `pnpm test:fixtures` |
| `fixtures/seed/ds-e.json`, `ds-0.json` | Bộ dữ liệu chuẩn DS-E (rỗng) và DS-0 (mẫu BL, T0 = 15/10/2026) – **dữ liệu giả**; quy ước mã DS-0 = nhãn seed (test-strategy 4.5) | loader của BE (sprint 1) |
| `tools/validate-fixtures.mjs` | Kiểm oracle (cấu trúc, độ phủ BR, tự tính lại), seed (mã, tham chiếu, chống trùng, cọc), manifest smoke. Chạy trong `pnpm test` | `pnpm test:fixtures` |
| `e2e/` | Playwright: `smoke/` (bộ (S) mọi PR – `smoke-manifest.json`), `flows/` (luồng L1–L8, từ sprint 1) | `pnpm test:e2e` (cần `pnpm dev` hoặc `E2E_API_URL`/`E2E_WEB_URL`) |
| `test-cases/` | Tài liệu test case | – |
| `tools/gen_traceability.py` | Sinh `docs/qa/traceability.md`, kiểm tĩnh rbac ↔ OpenAPI | `python3 tools/gen_traceability.py --strict` |
| `load/` | k6 – kịch bản p95 API | R3 |

Biến môi trường E2E: `E2E_API_URL` (mặc định `http://127.0.0.1:3000`), `E2E_WEB_URL` (`http://127.0.0.1:8081`), `E2E_COMPOSE_CONTROL=1` cho phép ca dừng/bật PostgreSQL (chỉ stack dùng một lần). Ca UI cần trình duyệt: `pnpm --filter @ottimo/tests exec playwright install chromium webkit` (lần đầu).
