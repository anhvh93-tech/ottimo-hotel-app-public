# OPS – Round 2 · Sprint 2 · Bước Phản hồi & sửa

## Đã làm gì

### 1. FB-R2-SEC-BE-23 (phần OPS) – giới hạn vai `ottimo_app`
- `infra/postgres/init/02-roles.sh`: thêm `ALTER ROLE ottimo_app SET idle_in_transaction_session_timeout = '30s'` và `ALTER ROLE ottimo_app SET statement_timeout = '15s'` (SEC đề xuất cả hai, mục (2) của thẻ). Script chạy bằng superuser `POSTGRES_USER` (init/CI) nên làm được trong infra – **không cần migration** (migrator không có quyền `ALTER ROLE` trên vai khác, và cũng không nên có).
- `ottimo_migrator` không bị giới hạn (thiết lập theo vai đăng nhập, không theo `SET ROLE ottimo_owner`) → migration dài không bị cắt.
- Áp cho volume đã có: `docs/dev-setup.md` (mục Vai cơ sở dữ liệu) – chạy lại `02-roles.sh` hoặc 2 lệnh `ALTER ROLE`, rồi `restart api worker`; thêm dòng xử lý lỗi "idle-in-transaction timeout / statement timeout". Đã áp lên PostgreSQL dev đang chạy (`ottimo-dev`) – chỉ `ALTER ROLE`, không restart api/worker (kết nối mới của pool tự nhận).
- `docs/hosting-plan.md`: staging/production dùng cùng script; không nới giới hạn để chữa lỗi.
- Kiểm chứng: (a) Postgres 17 tạm: `rolconfig` đúng, chạy lại script idempotent, phiên `BEGIN` rồi để yên 32 s bị server ngắt, migrator `statement_timeout = 0`; (b) stack compose riêng (project `ottimo-ops-s2`, cổng 3100/5442, đã gỡ) có giới hạn: E2E api+rbac+limits 753 pass, gồm cả nhóm concurrency TC-X-001..003; vitest api 1147/1149 pass – 2 ca đồng hồ (http-foundation clock, platform NOTIFY) đỏ khi chạy cả bộ nhưng **xanh khi chạy riêng có giới hạn** → không phải do timeout (ca chập chờn, báo BE/QA theo dõi).

### 2. ADMIN_BASE_URL/GUEST_BASE_URL trong CI (việc treo Sprint 1 – TC-SEC-024)
- `infra/docker-compose.yml` (`x-api-env`): `ADMIN_BASE_URL/STAFF_BASE_URL/GUEST_BASE_URL` lấy từ khóa opt-in `API_ADMIN_BASE_URL/API_STAFF_BASE_URL/API_GUEST_BASE_URL` của `.env`, mặc định rỗng → **dev giữ nguyên** (không kiểm Origin, FE dùng cổng dev-server tùy ý). Không tái dùng `APP_BASE_URL/GUEST_BASE_URL` của `.env` (đang có giá trị, dùng cho harness E2E) để không bật nửa vời ở dev.
- `.github/workflows/ci.yml` (job `docker-build`): bước "Enable api Origin checks" ghi 3 khóa `API_*` (localhost:8081/8082/8083) vào `.env` tạm; bước E2E đặt `E2E_ORIGIN`/`E2E_GUEST_ORIGIN` khớp; bước mới "Origin checks ran (TC-SEC-024 not skipped)" đọc `junit.xml`, **đỏ nếu TC-SEC-024 bị skip hoặc không có** – để việc này không âm thầm quay lại.
- Kiểm chứng trên stack riêng: có origin → TC-SEC-024 **pass**; không origin → skip (như cũ). Các ca đỏ khác (TC-SEC-022(b)(c) 404, TC-L6-041, TC-L2-080, TC-L2-053(b)) đỏ **y hệt khi tắt origin** → không do thay đổi này (code/test Sprint 2 đang sửa dở trong cây làm việc lúc chạy). Bước guard thử với junit giả: pass/skip → 0/1.
- `docs/dev-setup.md`: mục mới "Kiểm Origin của api trong compose" (cách bật ở máy, lưu ý `localhost` vs `127.0.0.1`).

### 3. Dependabot – xem `s2-dependabot.md`
11 PR: merge sau rebase + CI xanh 4 (#2–#5 actions), hoãn 2 (#7 plugin-react 6, #9 vite 8), đóng 5 (#1 postgres 18, #6 node 25, #8 nest platform-fastify 12 lẻ, #10 react-dom 19 lẻ, #11 @types/node 26). Không merge/đóng/comment. Kèm đề xuất `dependabot.yml` (nhóm nestjs/react/vite, bỏ major cho `@types/node`, `node`, `postgres`) – **chưa áp** vì sẽ làm Dependabot tự đóng PR.

### 4. Luật ESLint cấm `Promise.all` trên tx (BE-A)
- `pnpm lint` (ESLint toàn workspace + tsc) xanh, `pnpm format:check` xanh. Luật kích hoạt đúng (thử stdin file `services/api/src/modules/x/probe.ts` → 1 error). Không có `Promise.all|allSettled|any|race` nào trong `services/api/src`. CI không bị ảnh hưởng (bước Lint giữ nguyên, không cần sửa ci.yml).
- Ghi chú cho BE/ARC: luật chỉ áp `services/api/src/modules/**` và `jobs/**`; `shared/**` (unit-of-work, sequence) không được che – hiện sạch, cân nhắc mở rộng.

### Docker compose config
`docker compose --env-file .env -f infra/docker-compose.yml config --quiet` OK; với `.env.example` OK; khi không đặt `API_*`, ba biến origin của api = `""`.

## File tạo/sửa
- `product/infra/postgres/init/02-roles.sh`
- `product/infra/docker-compose.yml`
- `.github/workflows/ci.yml`
- `product/docs/dev-setup.md`
- `product/docs/hosting-plan.md`
- `rounds/round-02/outputs/OPS/s2-dependabot.md`
- `rounds/round-02/outputs/OPS/s2-report.md`

Lưu ý: commit 26b5e39 (ORC) đã gom phần sửa `02-roles.sh`, `docker-compose.yml`, `ci.yml` và một phần `dev-setup.md` lúc OPS đang làm; phần còn lại (mục origin trong `dev-setup.md`, `hosting-plan.md`, 2 file output) chưa commit.

## Giả định
- `statement_timeout = 15s` cấp vai được thêm cùng `idle_in_transaction` (SEC đề xuất cả hai; khớp giá trị BE đặt `SET LOCAL`).
- Origin trong CI là `http://localhost:808x` (khớp `APP_BASE_URL`/`GUEST_BASE_URL` của `.env.example`); UI E2E (`E2E_UI`) không chạy trong CI nên `E2E_WEB_URL=127.0.0.1` không bị ảnh hưởng.

## Rủi ro / vướng mắc
- **Main đang đỏ** (26b5e39): test FE `apps/admin-web/src/__tests__/reservation.test.tsx` H11 ("Unable to find role=dialog name Lê Minh"); E2E chưa chạy trên main mới (job bị skip). Việc của FE; chặn mọi merge Dependabot.
- Bước guard TC-SEC-024 mới sẽ đỏ CI nếu ai đổi tên ca test hoặc bỏ origin – chủ ý.
- 2 ca vitest đồng hồ (MutableClock) chập chờn khi chạy cả bộ.

## Việc chưa xong
- Áp đề xuất `dependabot.yml` sau khi ORC xử lý 11 PR.
- Xác nhận CI xanh thật trên GitHub với bước origin mới (cần main xanh trước).

## ESC mới
Không.
