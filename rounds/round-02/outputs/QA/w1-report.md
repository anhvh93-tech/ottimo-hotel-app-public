# QA – Round 2, Tuần 1 (Đợt 0): W6 seed, W7 br-examples, W8 khung E2E, cập nhật TC-X-050/065/066

- Vai: QA | Ngày: 16/10/2026 | Không commit (theo chỉ đạo ORC)
- Máy: macOS, Node 22.23.3, pnpm 9.15.4, Docker + Compose (OrbStack) – môi trường của OPS (`outputs/OPS/w1-skeleton-run.md`)
- Mọi kết quả "chạy" dưới đây là **chạy thật** trên máy này. Phần chưa chạy được ghi ở mục 5.

## 1. Bảng trạng thái

| Việc | Tiêu chí plan R2 mục 3.2 | Kết quả | Trạng thái |
|---|---|---|---|
| **W7** `br-examples.json` | BE test unit đọc được file | 196 dòng oracle, phủ **113/118** BR có ví dụ số (5 BR ghi lý do `notCovered`); 133 dòng **tự tính lại** bằng bộ tính độc lập → 0 lệch; 28 dòng có `qaAssumption`, nhãn BR (NGÀNH / GIẢ ĐỊNH / PHÁP LÝ) kiểm khớp bảng BR | **Xong bản 1** – chờ DOM rà (plan: QA + DOM) |
| **W6** seed DS-E / DS-0 + quy ước mã | `pnpm seed:ds-e`, `seed:ds-0` chạy được trên dev | Dữ liệu dạng JSON xong: DS-E (10 căn, 3 nhóm, 122 tham số BR mục 13, 12 kênh, 10 món minibar = 17 đơn vị chuẩn, phí phạt, checklist 12 điểm, 13 tài khoản `qa.*`, 2 thiết bị, bộ đếm mã); DS-0 (17 khách, 17 đơn, 1 khối OOO, 4 phiếu sửa, 2 HĐ, công tơ, trạng thái buồng T0, khai báo, quy trình nạp 7 bước). Quy ước mã DS-0 chốt (BUG-R1-016 → Fixed) | **Dữ liệu xong**; lệnh `seed:*` **chưa có** – chưa có bảng, loader là việc BE sprint 1 (đúng chỉ đạo ORC) |
| **W8** khung E2E Playwright + smoke | Smoke chạy mỗi PR, ca chưa có tính năng skip | `@playwright/test` 1.63.0 trong gói `@ottimo/tests`; 4 project (smoke, desk-chromium 1366×768, mobile-webkit 390×844, android-chromium 360×800); `pnpm test:e2e` ở gốc. **Chạy thật: 2 passed (TC-X-050a, b), 43 skipped** (42 ca (S) + TC-X-050c) | **Xong khung**; bước CI chờ OPS thêm (mục 5) |
| Kiểm fixture trong CI | – | `tools/validate-fixtures.mjs` là script `test` của gói → chạy trong `pnpm test` (turbo) – job `build-test` tự chạy, không phải sửa `ci.yml` | **Xong** |
| TC-X-050 | `/health` qua compose | (a) api 200 `db: ok`, `time` `+07:00` – **Đạt**; (b) qua Caddy 200 – **Đạt**; (c) dừng PG → 503 – **Đạt theo log OPS**, QA không chạy lại vì DB dev đang dùng chung | Đạt (a, b), (c) theo OPS |
| TC-X-065 | 4 vai DB | `db-role.test.ts` 5/5, 0 skipped (api 35/35); `ottimo_owner` đăng nhập → `FATAL … not permitted to log in`; `pg_roles` đúng | **Đạt** |
| TC-X-066 | không có bề mặt test | (a) exit 0; (b) đối chứng exit 1; (c) bundle image `ottimo-api:ci` exit 0; (d) image `INCLUDE_TEST_SUPPORT=1` vẫn exit 0 vì chưa có `src/test-support/` | (a)(b)(c) **Đạt**; (d) **chưa chứng minh được** (chờ BE) |
| CI GitHub | link 1 lần chạy xanh | Chưa có repo (ESC-013 B) | **Chưa có** – không báo xanh |
| test-report R1 | cập nhật theo OPS | Mục 5, C2 và mục 9 mới | **Xong** |

Kiểm chung sau khi thêm gói: `pnpm install` (lockfile +`tests` importer, +3 gói Playwright), `pnpm audit --audit-level=high` → *No known vulnerabilities found*; `pnpm format:check` xanh; `pnpm lint` (ESLint + typecheck 9/9 task) xanh; `turbo run test --force` có DB 9/9 task xanh; gitleaks (bản ghim của CI, config `.github/gitleaks.toml`) trên file mới → *no leaks found*.

## 2. Đã làm gì

### 2.1 W7 – `product/tests/fixtures/br-examples.json`
- Mỗi dòng: `id` (`BR-411-01`), `br`, `case`, `origin` (`example` = đúng cột ví dụ BR · `rule-boundary` = mốc biên suy từ câu quy tắc, vd. 09:59/10:00/14:00 của BR-411 · `derived-table`), `labels`, `params` (khóa BR mục 13), `calc`, `input`, `expected`; thêm `qaAssumption` khi ví dụ BR thiếu ngày/giờ (nhãn [GIẢ ĐỊNH QA]), `escNote` (INV đã quyết, BR chưa cập nhật), `issue` (lỗi ví dụ đã báo DOM).
- Quy ước: tiền số nguyên VND (`…Vnd`), phần trăm basis point (`…Bp`), thời điểm ISO `+07:00`, khoảng ngày nửa mở, hệ số ký quỹ dạng chuỗi ("1.5") để không qua số thực (ADR-002).
- Bộ tính tham chiếu trong `validate-fixtures.mjs` (≈ 60 hàm: làm tròn half-up, ngày nghiệp vụ 06:00, đếm ngày báo trước, giữ chỗ + trần 12:00, phụ thu sớm/muộn + ân hạn, OTA dùng giá trực tiếp, dài hạn: kỳ hạn/thuê/ký quỹ/hoa hồng/ngày kết thúc theo tháng lịch/phân bổ doanh thu, hủy/hoàn, nhóm, VAT, hạn khai báo VN/NN cả `earlier_of`, OOO, VI→VC 72 giờ…). Thử đột biến: sửa cọc BR-305 thành 1.497.300 và kéo dài OTM-0155 → script báo đúng 3 lỗi, exit 1.
- Phát hiện khi lập oracle (đã ghi `rounds/round-02/qa/bug-list.md`): BUG-R2-001 (P2), 002, 003 (P3). Ghi chú cho BE/DATA: BR-215 ví dụ 6.103.548 nghĩa là phân bổ = làm tròn của `thuê × số đêm trong tháng ÷ số đêm tháng HĐ`, **không** phải `359.032 × 17` (= 6.103.544); tháng cuối nhận phần còn lại.

### 2.2 W6 – seed `product/tests/fixtures/seed/ds-e.json`, `ds-0.json`
- Dữ liệu giả theo test-strategy mục 4: SĐT dạng `0000 000 nnn` (đầu số không tồn tại ở VN), email miền `.test`, số giấy tờ tiền tố `TEST`. **Không ghi mật khẩu**: loader đọc `QA_SEED_PASSWORD` (đổi so với test-strategy 0.2 – ghi ở 0.3).
- DS-0: giá đơn trực tiếp/CTV = giá niêm yết kênh Trực tiếp (BR-104) nên OTM-0151 cọc 1.000.000 khớp test-strategy; OTM-0155 cọc thu 500.000 (BL) lớn hơn mức BR-305 400.000 – hợp lệ, có ghi chú. HĐ Emma: thuê 9.410.000 và ký quỹ 9.400.000 khớp BR-203/206 (3 tháng, NN); hoa hồng theo BR-212 = 1.411.500 (prototype ghi 1.975.000 theo tỷ lệ cũ – không dùng).
- Quy ước mã (BUG-R1-016): mã 4 số là **nhãn seed**; nạp theo `loadOrder` vào DB mới → mã thật xác định trước (`expectedCode`: `OTM-0091` → `OTM-00001` … `OTM-0158` → `OTM-00017`; `g1…g17` → `KH-0001…0017`; `WO-031` → `WO-00001`); loader so và dừng nếu lệch; TC tra theo nhãn qua `.out/ds-0.map.json`. Ghi ở test-strategy 0.3 mục 4.5, `ds-0.json` `codeConvention`, decision-log.
- Script kiểm seed: mã liên tục, tham chiếu khách/kênh/căn/người dùng, **không đặt trùng** (gồm khối OOO, khoảng nửa mở), sức chứa, cọc BR-305, giá niêm yết BR-101, thuê/ký quỹ/hoa hồng HĐ theo BR-203/206/212, trạng thái buồng T0 khớp đơn (BR-806), không có trường `password`.

### 2.3 W8 – khung E2E `product/tests/e2e/`
- `playwright.config.ts`: `E2E_API_URL` / `E2E_WEB_URL`, múi giờ `Asia/Ho_Chi_Minh`, reporter list + html (+ junit trên CI), retry 1 trên CI.
- `smoke/health.spec.ts`: TC-X-050a/b chạy thật; TC-X-050c (dừng/bật PostgreSQL qua `docker compose`) chỉ chạy khi `E2E_COMPOSE_CONTROL=1` – không bao giờ trên staging.
- `smoke-manifest.json`: 42 ca (S) từ `r1-main-flows.md` + TC-X-050, mỗi ca có `waitingFor` (sprint). `smoke/pending.spec.ts` sinh 1 test skipped/ca, tiêu đề bắt đầu bằng mã TC. Script kiểm manifest khớp nhãn (S) của test case (thêm/bớt (S) mà quên manifest → CI đỏ).
- Ca UI cần trình duyệt chưa có (chưa có màn hình); khi có: `pnpm --filter @ottimo/tests exec playwright install chromium webkit`.

### 2.4 Cập nhật tài liệu R1
- `rounds/round-01/qa/test-report.md`: mục 5 (TC-X-050/065/066), C2 (Đạt một phần – thiếu link CI GitHub), mục 9 mới (bảng OPS ↔ QA chạy lại).
- `rounds/round-01/qa/bug-list.md`: BUG-R1-016 → **Fixed (quy ước)**, đóng khi loader BE khớp `expectedCode`. Đề nghị SEC đóng SEC-06 và phần spec/bundle của SEC-08 (SEC quyết).

## 3. Lệnh đã chạy và kết quả

| Lệnh | Kết quả |
|---|---|
| `node tests/tools/validate-fixtures.mjs` | `br-examples: rows 196, recomputed 133, brWithExample 118, brCovered 113, notCovered 5` · `seeds: rooms 10, parameters 122, channels 12, users 13, guests 17, reservations 17, blocks 1` · `smoke-manifest: 42 (S), implemented 1, pending 42` · **OK – 0 lỗi, 1 cảnh báo** (HĐ OTM-0108 kết thúc 04/12 theo BL ≠ BR-209 05/12 – snapshot, đã ghi chú) |
| `pnpm install` / `pnpm audit --audit-level=high` | OK / No known vulnerabilities found |
| `pnpm format:check` / `pnpm lint` | xanh / ESLint sạch, typecheck 9/9 |
| `docker compose --env-file .env -f infra/docker-compose.yml up --build -d` | api healthy, worker, web Up (postgres đã chạy sẵn) |
| `pnpm test:e2e` | **45 tests: 2 passed, 43 skipped**, 0 failed (267 ms) |
| `turbo run test --force` với `DATABASE_URL`/`MIGRATION_DATABASE_URL` → `ottimo_test` | 9/9 task; api 35 passed (db-role 5, 0 skipped); integrations 32; 3 app × 1; `@ottimo/tests` OK |
| `psql -U ottimo_owner` | `FATAL: role "ottimo_owner" is not permitted to log in` |
| `check-no-test-surface.sh spec docs/api/openapi.yaml` / `openapi.test.yaml` | exit 0 / exit 1 (`/__test__/clock`, `/__test__/jobs/{jobKey}/run`) |
| `check-no-test-surface.sh bundle` trên `/app/dist` của `ottimo-api:ci` và `ottimo-api:dev` | exit 0 / exit 0 (dev chưa có test-support → (d) chưa chứng minh) |
| gitleaks v8.21.2 (`dir`, config repo) trên `product/tests` + `package.json` + `pnpm-workspace.yaml` | Lần đầu 1 cảnh báo nhầm (`"key": "meter_anomaly_default_m3"`) → đổi trường thành `param` → **no leaks found** |
| `docker compose … stop api worker web` | Trả máy về trạng thái trước khi QA chạy (postgres giữ nguyên) |

## 4. Giả định
- [GIẢ ĐỊNH QA] 28 dòng oracle tự điền ngày/giờ khi ví dụ BR không ghi (ghi trong từng dòng), không đổi kết quả của BR.
- Oracle và seed theo **BR v0.2** (nguồn sự thật), kể cả 2 mặc định INV đã đổi (BUG-R2-001); dòng ân hạn 12:30 có sẵn với `params` riêng.
- Seed: thứ tự nâng hạng nhóm L12 < N < N+; kênh "Trực tiếp" của prototype → `zalo_phone`, khách quen g5 → `returning`; Booking.com = trả tại chỗ, Airbnb/Agoda = OTA thu hộ; ngày sinh 2 trẻ OTM-0152; cọc tính trên tiền phòng, không gồm phụ thu người (hỏi DOM); ngày Tết 2027 trong `special_dates`; `partsExpectedDate` WO-030.
- BR-432: định tuyến FOC gồm cả `owner` (BR-433 cho chủ đầu tư duyệt không giới hạn) – cần BA/DOM xác nhận.

## 5. Rủi ro / việc chưa xong
1. **Loader seed** (`pnpm seed:ds-e`, `seed:ds-0`) chưa có – BE sprint 1, theo `loadProcedure` trong `ds-0.json`. Tiêu chí W6 chưa đạt đủ cho tới khi chạy được trên dev.
2. **Smoke E2E trong CI**: `pnpm test` đã chạy validator; bước Playwright cần OPS thêm vào job `docker-build` sau khi stack lên (đề xuất: `pnpm test:e2e` với `E2E_API_URL=http://127.0.0.1:3000`, `E2E_WEB_URL=…:8081`, `E2E_COMPOSE_CONTROL=1` vì stack CI dùng một lần; upload `tests/e2e/playwright-report` khi đỏ). Chưa có repo GitHub nên chưa kiểm được trên runner.
3. TC-X-050c, phần "volume cũ" của TC-X-065: QA chưa tự chạy lại (DB dùng chung) – dựa log OPS.
4. TC-X-066 (d) chờ BE TestSupportModule.
5. `Dockerfile.web` cài cả workspace nên kéo thêm `@playwright/test` (không tải trình duyệt) – OPS có thể lọc `--filter` sau, không chặn.
6. DOM chưa rà `br-examples.json` (plan: QA + DOM). Đề nghị ORC giao DOM rà 196 dòng, ưu tiên 28 dòng `qaAssumption` và 3 lỗi BUG-R2-001…003.
7. Sửa nhỏ ngoài thư mục QA: `product/package.json` (2 script), `product/pnpm-workspace.yaml` (`tests`), `product/.prettierignore` (output Playwright), `product/pnpm-lock.yaml` – OPS/ARC lưu ý khi commit.
8. Việc QA tuần 1 chưa làm trong lượt này (plan mục 2 dòng QA (1)): script ma trận quyền tự sinh từ `x-roles`; TC cho 2 mã lỗi mới (BUG-R1-007) và 17 `operationId` chưa có TC; TC AC5a đơn dài hạn nhập tay.

## 6. File tạo/sửa
- Tạo: `product/tests/package.json`, `product/tests/tsconfig.json`, `product/tests/.gitignore`, `product/tests/fixtures/br-examples.json`, `product/tests/fixtures/seed/ds-e.json`, `product/tests/fixtures/seed/ds-0.json`, `product/tests/tools/validate-fixtures.mjs`, `product/tests/e2e/playwright.config.ts`, `product/tests/e2e/smoke-manifest.json`, `product/tests/e2e/smoke/health.spec.ts`, `product/tests/e2e/smoke/pending.spec.ts`, `rounds/round-02/qa/bug-list.md`, `rounds/round-02/outputs/QA/w1-report.md`
- Sửa: `product/tests/README.md`, `product/package.json`, `product/pnpm-workspace.yaml`, `product/pnpm-lock.yaml`, `product/.prettierignore`, `product/docs/qa/test-strategy.md` (0.3), `rounds/round-01/qa/test-report.md`, `rounds/round-01/qa/bug-list.md`, `01-decisions/decision-log.md` (2 dòng QA)
