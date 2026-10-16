# QA – Round 2, khởi động Sprint 3 (điều kiện QC Sprint 2 + việc PO/DOM giao thêm)

- Tác giả: QA | Ngày: 16/10/2026 | Bước: Sprint 3 – khởi động (sau cổng QC Sprint 2 `rounds/round-02/qc/s2-qc-gate.md`)
- Không commit (ORC commit). Lưu ý: commit `4364997` của ORC đã gom một phần file QA đang làm dở (vd. `ui/a11y.axe.spec.ts`). Bản cuối của các file nằm ở cây làm việc.

## 1. Bảng trạng thái

| # | Việc | Trạng thái | Bằng chứng / ghi chú |
|---|---|---|---|
| ĐK-S2-1a | Kiểm lại và đóng BUG-R2-014 | **Xong – Closed** | Stack `ottimo-qa-s3`, ảnh api từ `cfcf6d8`: reset tiền tố `qa.locked` thì `qa.locked` vẫn `locked`, đăng nhập 401. Đối chứng: khóa tạm của `qa.mt` (`locked_until` có giá trị) được mở, đăng nhập 200 |
| ĐK-S2-1b | Sửa bảng tổng bug-list | **Xong** | Đếm lại từng dòng: 29 lỗi; Open 5 (P2: 025, 026, 027; P3: 028, 029); Fixed 0; Closed 24 |
| ĐK-S2-1c | QC-S2-01 → BUG-R2-025, QC-S2-02 → BUG-R2-026 (P2) | **Xong** | 025: E2E xác nhận lỗi trên ảnh cũ (`200` thay vì `409`). Bản sửa của BE-A đã có trong commit `4364997`, nhưng QA chưa build lại được ảnh để kiểm. 026: chuỗi VI/EN đã có, `409 CONCURRENT_UPDATE` đã hiện đúng câu; `503 SERVICE_UNAVAILABLE` vẫn ra `error.server`, chưa thử lại theo `Retry-After` |
| ĐK-S2-4a | Chạy thử E2E UI trên stack dùng một lần | **Xong** | `COMPOSE_PROJECT_NAME=ottimo-qa-s3` (cổng 35432/33000/38081–38083, ảnh riêng `*:qa-s3`, không đụng `ottimo-dev`), `CI=true`, `E2E_UI=1`. **desk-chromium 25 đạt, 0 trượt**, 2 bỏ qua (`fixme` TC-L2-020/076 có lý do) |
| ĐK-S2-4b | Axe H01–H12, ngưỡng 0 critical/serious | **Xong – đạt** | `ui/a11y.axe.spec.ts`: 9 ca, 17 lần quét (H01, H02+H03, H04, H05, H06 + form khách, H07 users/devices, H08, H09, H10, H11 drawer, H12 + tìm căn + form báo giá; giao diện tối H03/H08/H09). WCAG 2.1 A/AA + 2.2 AA: **0 critical/serious, 0 moderate/minor** |
| ĐK-S2-4c | Kiểm UI BUG-R2-010 | **Xong – Closed** | TC-NT-010 (E) đã siết: heading "Bạn không có quyền mở trang này", không có nút "Thử lại", không có câu "nhờ quản lý" |
| ĐK-S2-4d | Sửa `ci.yml` job E2E | **Xong (chờ OPS duyệt)** | Xem mục 4 |
| TC-L2-021 (E) | Hai lễ tân cùng lưu một căn | **Đạt 8/8 lần lặp** | Một bên "Đã tạo đơn", bên kia báo trùng, form còn nguyên. Coi câu `error.server` là trượt (BUG-R2-026) |
| S3-skel | Khung E2E Sprint 3 | **Xong (pending)** | 113 `test.fixme` có mã TC: TC-L3 ×49, TC-L4 ×54, check-in online TC-L7-001…015 ×10. OpenAPI đã là `0.3.6-draft` (commit `4364997`), QA điền thân test ở bước sau |
| PO N-1 | Bỏ skip TC-NT-011/018/019/039/040 | **Xong** | Chuyển sang `e2e/serial/` vì các ca đổi tham số/giá/căn đang hiệu lực. 011, 018, 019 đạt. 039, 040(b)(c) đỏ trên ảnh cũ (BUG-R2-025), dự kiến xanh khi build có bản sửa |
| PO N-2 | TC-NT-004, 009, TC-L2-055, TC-L5-016 (en/ru), 020, 035, ESC-017 (TC-L5-052), viết lại TC-L2-079 (a) | **Xong** | `api/s3-kickoff.api.spec.ts`: 7 đạt; TC-L5-016 (ru) đánh dấu `test.fail` (BUG-R2-027); TC-L5-052 bỏ qua vì chưa có `listPayments`/`reconcilePayment` trên build. TC-L2-079 (a1)(a2)(a3) theo ARC 3.3 đạt |
| PO N-3 | PO-S2-01 → BUG-R2-027 (P2) | **Xong** | E2E xác nhận: `locale=ru` trả "OTTIMO Boutique Stay – Quote BG-…" (tiếng Anh) |
| PO | TC-L5-050 → `US-084/AC1` | **Xong** | r1-main-flows v0.3.7; `gen_traceability --strict` exit 0 |
| DOM | Seed `special_dates` + 2 dòng ESC-015; đổi `calc` | **Xong** | DS-E thêm Giỗ Tổ 2027 [16/4, 17/4) và đêm trước Quốc khánh [1/9, 2/9). BR-104-06/08/09 → `calendarRate`. BR-113-05 → `minStay` (calc mới, xem mục 5). Validator 0 lỗi |
| Phát hiện mới | BUG-R2-028, BUG-R2-029 (P3, FE) | Open | Mục 3 |

Lần chạy cuối như CI (stack mới, ảnh `cfcf6d8`): **793 đạt, 1 trượt, 283 bỏ qua**. Ca trượt duy nhất là `api/room-capacity.api.spec.ts` của BE-A (BUG-R2-025, ảnh cũ chưa có bản sửa). Vì project `api` đỏ nên Playwright không chạy 30 ca của các project phụ thuộc. QA chạy riêng từng project đó (`--no-deps`): limits 2 đạt, rbac-logout 11, clock 9, db-outage 1, serial 3 đạt + 2 đỏ (BUG-R2-025). Các ca `serial` tự trả trạng thái về như cũ: đã kiểm DB, căn 202/203/302/402 đúng sức chứa và đang bán.

## 2. Cách chạy thử

- Stack: `docker compose --env-file <scratch>/qa-s3.env -f infra/docker-compose.yml -f <scratch>/compose.qa-s3.yml`. File override đổi cổng bằng `ports: !override` và đổi tên ảnh sang `ottimo-api:qa-s3` / `ottimo-web:qa-s3`, để không đè ảnh `:dev` mà stack dev đang dùng. `.env` sinh bằng `infra/ci/make-ci-env.sh`, thêm `API_*_BASE_URL=http://localhost:3808x`.
- Biến môi trường: `E2E_UI=1`, `E2E_WEB_URL=E2E_ORIGIN=http://localhost:38081` (phải trùng origin mà api cho phép), `CI=true`, `E2E_COMPOSE_CONTROL=1`, `E2E_COMPOSE_PROJECT=ottimo-qa-s3`.
- Build lại ảnh từ cây làm việc lúc ~22:00 (để kiểm bản sửa BUG-R2-025): **không được**. `pnpm install` trong docker hết thời gian tải từ registry.npmjs.org, thử 2 lần. Vì vậy dùng lại ảnh dựng lúc 21:28.

## 3. Lỗi (chi tiết ở `rounds/round-02/qa/bug-list.md`)

| ID | Mức | Tóm tắt | Vai |
|---|---|---|---|
| BUG-R2-025 | P2 | Không trả `CAPACITY_BELOW_BOOKINGS` (QC-S2-01) | BE-A (đã sửa, chờ kiểm trên build mới) |
| BUG-R2-026 | P2 | `503 SERVICE_UNAVAILABLE` vẫn ra "Máy chủ đang gặp sự cố"; chưa thử lại theo `Retry-After` (QC-S2-02) | FE (+UXD xong chuỗi) |
| BUG-R2-027 | P2 | Văn bản báo giá RU ra tiếng Anh (PO-S2-01) | UXD + BE-B |
| BUG-R2-028 | P3 | Tạo nhanh khách trong form đặt phòng làm mất SĐT. Form hỏi lại SĐT rồi PATCH hồ sơ (`GuestPicker.tsx:205` thiếu `phoneMasked`) | FE |
| BUG-R2-029 | P3 | Rack luôn hiện "Đang kết nối lại…" vì SSE `/events` trả 404 | FE (+BE-A SSE S4) |

Không có lỗi P0/P1 mới. Không có ESC mới.

## 4. Sửa `.github/workflows/ci.yml` (job `docker images build · E2E smoke`) – phối hợp OPS

1. Bước E2E: thêm `E2E_UI: '1'` và đổi `E2E_WEB_URL` từ `http://127.0.0.1:8081` sang `http://localhost:8081`. **Lý do:** trình duyệt gửi Origin là origin của trang. Api chỉ chấp nhận `API_ADMIN_BASE_URL=http://localhost:8081`, nên nếu trang mở ở 127.0.0.1 thì mọi thao tác ghi sẽ bị 403 (đã tái hiện trên stack QA).
2. Thêm bước **"UI cases ran"**: đọc `junit.xml` và báo đỏ khi không có ca `ui/`, khi ca UI bị bỏ qua vì môi trường (chỉ cho phép `TC-L2-020 (E)`, `TC-L2-076 (E)`), hoặc khi có ít hơn 9 ca axe chạy. Đây là cách xác nhận ĐK-S2-4: "0 bỏ qua vì môi trường".
3. Không đổi: bước cài trình duyệt (đã có chromium + webkit, có cache và `install-deps`), upload báo cáo khi đỏ.
4. OPS cần biết: (a) project `serial` mới chạy 1 worker, tăng thời gian khoảng 3 giây; UI + axe tăng khoảng 30 giây. Timeout job 30 phút vẫn đủ. (b) Khi job `api` đỏ thì các project `serial`/`clock`/`db-outage` không chạy (`dependencies`), giống hành vi hiện có. (c) `ci.yml` đã lệch prettier từ HEAD (không thuộc `format:check` của product/), QA không định dạng lại.

## 5. Phụ thuộc mới, seed, oracle

- `@axe-core/playwright` **4.13.0** (ghim chính xác, devDependency của `product/tests`), cài bằng `pnpm --filter @ottimo/tests add -D -E`, lockfile thêm 19 dòng. **Lý do:** ĐK-S2-4 yêu cầu kiểm axe tự động. Không chọn 4.14.0 vì bản này mới phát hành 15/10, chưa đủ 2 tuần theo quy tắc chuỗi cung ứng. `pnpm audit --audit-level=high`: 0 high/critical (3 moderate có sẵn).
- `special_dates` (DS-E): BE đọc thẳng `tests/fixtures/seed/ds-e.json` (`services/api/test/reservations-pricing.test.ts:81`, `test/helpers/reservations-fixture.ts:43`, `sales-fixture.ts:17`). **Không có fixture riêng trong `services/api/test/helpers`**, BE-A/BE-B không phải thêm. Chỉ cần chạy lại test giá vì có 2 ngày đặc biệt mới. Migration `0002` chỉ khai báo khóa, không có giá trị.
- BR-113-05: ORC đề nghị đổi sang `calendarRate`, nhưng dòng này có đầu vào/kỳ vọng về **ở tối thiểu** (`accepted`, `minStayNights`), không phải giá. QA thêm calc `minStay` vào `validate-fixtures.mjs` (T6/T7/ngày đặc biệt thì 2 đêm), đọc ngày đặc biệt từ seed. Kết quả tự tính lại khớp.
- Có 2 dòng BR-522 DOM thêm cùng lúc. QA định dạng lại một mảng bằng prettier để `format:check` xanh, không đổi nội dung.

## 6. Giả định

- "TC-L6-*" trong việc giao được hiểu là **check-in online** (TC-L7-001…015, US-106/107). Ở r1-main-flows, L6 là buồng phòng/bảo trì (Sprint 4), không thuộc phạm vi Sprint 3. Khung Sprint 3 dùng L7 cho check-in online.
- TC-NT-011: "không chọn mức" được hiểu là form lấy `getBookingRules.holdHoursDefault`, vì `createHoldFromQuote` bắt buộc `holdHours` theo OpenAPI.
- TC-NT-009: `listQuotes` không có tham số theo màn, nên API trả quyền hợp FD ∪ SAL. Phần "màn Sale chỉ thấy của mình" (rbac quy tắc 2) chưa kiểm được ở API → câu hỏi **Q-QA-S3-01** gửi BA/ARC (không cần ESC).
- TC-L2-055: "chặn lần 2" chấp nhận `409` hoặc `422`, vì hợp đồng chưa có mã riêng.

## 7. Rủi ro / việc còn lại

- Nếu commit tiếp theo không có bản build kèm sửa BUG-R2-025 thì CI đỏ ở `api/room-capacity` (BE-A) và `serial` TC-NT-039/040. Đây là tín hiệu đúng của ĐK-S2-2.
- TC-L5-052 (đối soát ESC-017) và phần hoa hồng của TC-NT-009 bỏ qua cho tới khi BE-B đưa `listPayments`/`reconcilePayment`/`listCommissions` lên build (Sprint 3).
- TC-L5-020 mới có tầng A; phần E (nút giữ chỗ bị khóa trên H12) chưa viết.
- Chưa kiểm tay VoiceOver và zoom 200 % (phần M của TC-X-040).
- Khung Sprint 3: điền thân test theo OpenAPI 0.3.6-draft (đã có), tuần 1 Sprint 3.

## 8. File tạo/sửa

- Tạo: `product/tests/e2e/ui/helpers.ts`, `ui/a11y.axe.spec.ts`, `e2e/serial/platform-mutations.serial.spec.ts`, `e2e/api/s3-kickoff.api.spec.ts`, `e2e/api/checkin.s3.api.spec.ts`, `e2e/api/stay-checkout.s3.api.spec.ts`, `e2e/api/guest-checkin-online.s3.api.spec.ts`, `rounds/round-02/outputs/QA/s3-kickoff.md`
- Sửa: `product/tests/e2e/ui/admin-web.smoke.spec.ts`, `ui/rack-booking.smoke.spec.ts`, `e2e/playwright.config.ts` (project `serial`; `limits`/`rbac-logout` chạy sau `desk-chromium`), `e2e/api/platform.api.spec.ts`, `e2e/api/reservations.api.spec.ts`, `product/tests/package.json`, `product/pnpm-lock.yaml`, `tests/fixtures/seed/ds-e.json`, `tests/fixtures/br-examples.json`, `tests/tools/validate-fixtures.mjs`, `tests/test-cases/r1-main-flows.md` (v0.3.7), `tests/README.md`, `product/docs/qa/traceability.md` (sinh lại), `.github/workflows/ci.yml`, `rounds/round-02/qa/bug-list.md`, `01-decisions/decision-log.md` (1 dòng mức lỗi/ngưỡng axe)
