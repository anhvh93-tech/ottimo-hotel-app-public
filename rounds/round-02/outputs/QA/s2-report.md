# QA – Round 2, Sprint 2: E2E viết sẵn cho đặt phòng, chống trùng, giữ chỗ/cọc, OOO, no-show, BR-812

- Vai: QA | Ngày: 16/10/2026 | Không commit (ORC commit)
- Máy: macOS, Node 22.23, pnpm, OrbStack (Docker Compose v5.5)
- Phạm vi: story Sprint 2 theo plan R2 mục 4 – EP02 (US-016…024, 136), EP11 phần R2 (US-080, 082…087 trừ AC3 của 086), US-139, US-017 AC5a, BR-812 (việc bộ đồ dùng thêm). TC lấy từ `product/tests/test-cases/r1-main-flows.md` (TC-L2-*, TC-L5-*, TC-L6-041/044/053/055, TC-X-001…004, TC-NT-008); số liệu đọc từ oracle `product/tests/fixtures/br-examples.json`.
- **Build lúc chạy chưa có endpoint Sprint 2.** Thư mục `services/api/src/modules/reservations`, `sales`, `folio` của BE đang viết dở: chưa có controller nào của Sprint 2, module chưa đăng ký trong `feature-modules.ts`, và cây làm việc hiện **không build được** (`db/schema` chưa export `ReservationStatus`, `OccupancyKind`). Vì vậy mọi ca Sprint 2 đều được **bỏ qua có lý do** (pending, ghi mã TC và operation đang chờ). Không có ca nào đỏ.

## 1. Bảng trạng thái

| Việc ORC giao | Kết quả | Trạng thái |
|---|---|---|
| E2E API cho story Sprint 2 (EP02/EP11, US-139, US-017 AC5a, báo giá/giữ chỗ/cọc, OOO, no-show, BR-812) | 6 file `e2e/api/*.api.spec.ts` mới, **63 test** mang mã TC. Mỗi ca tự tìm khoảng đêm còn trống và hủy đơn/khối đã tạo ở `afterEach`. Số tiền, hạn giờ, số đêm đều đọc từ `br-examples.json` | **Viết xong.** Chạy thật: 0 đạt / 0 trượt / 63 bỏ qua (chờ endpoint) |
| **Test đồng thời chống đặt trùng** (TC-L2-021: N yêu cầu song song cùng căn – đêm → đúng 1 thành công) | `e2e/api/concurrency.api.spec.ts`. TC-L2-021: N = 8 yêu cầu song song từ 4 phiên (fd, fdl, mgr, owner), mỗi yêu cầu một Idempotency-Key, lặp 20 vòng với 20 đêm khác nhau. Mỗi vòng phải đúng 1 × `201`, N−1 × `409 ROOM_UNAVAILABLE`, 0 lỗi 5xx; căn – đêm phải hết trống; hủy đơn thắng thì căn – đêm trống lại. Cùng file: TC-X-001 (50 yêu cầu song song), TC-X-002 (tạo đơn + giữ chỗ + khối OOO cùng lúc → 1 thành công), TC-X-003 (FD và SAL cùng xác nhận cọc → 1 lần `200`, lần kia `412`/`409`) | **Viết xong + tự kiểm cơ chế** trên API giả lập (mục 3.3): API đúng → đạt; API cố ý cho đặt trùng → **trượt** (`201×8`). Trên build thật: chờ endpoint |
| Hết hạn giữ chỗ bằng `/__test__/clock` + `/__test__/jobs/{key}/run`, chạy tuần tự trong project riêng | Project **`clock`** mới (`fullyParallel: false`). Chạy sau `smoke`, `rbac`, `api`, `limits`, `rbac-logout`, `desk-chromium`; `db-outage` chạy sau nó. `support/clock.ts`: freeze rồi set đồng hồ để dừng **đúng mốc**, chạy job, reset ở `afterAll`. Có 8 test: TC-L5-022 (biên BR-302), TC-L5-026 (J1 hết hạn, 1 giây trước/sau hạn), TC-L5-028 (J2 nhắc), TC-L5-029 (gia hạn BR-303-02/03, quá hạn → `HOLD_EXPIRED`), TC-L5-030 (a) + TC-X-004 (cọc đua với J1), TC-L5-015 + TC-L5-017 (a) (J3 báo giá hết hạn), TC-L2-070…075 (một ngày no-show J6/J7), TC-L6-044 (J9). Chỉ bật khi có `TEST_SUPPORT_TOKEN` và (`CI` hoặc `E2E_CLOCK_CONTROL=1`), nên không tua giờ trên stack dev dùng chung | **Viết xong.** Đã chạy thật helper đồng hồ trên stack thật: đồng hồ dừng đúng mốc, phiên tự đăng nhập lại sau khi nhảy giờ, reset đúng. Các ca nghiệp vụ: chờ endpoint |
| Ca chưa có endpoint → pending có mã TC (không đỏ) | Dùng `requireEndpoints()`. `skip` ghi "TC-xxx: chờ endpoint opA, opB". TC-L2-079 (a) để `fixme` có lý do (mục 5) | **Đạt** – 0 đỏ |
| Mở rộng runner RBAC cho operation Sprint 2 | `rbac/sprint2-ops.ts` + `rbac/rbac-sprint2.spec.ts`. Phủ **35 operation, 385 ca** (EP02 rack/đơn/hành động, EP11 báo giá/giữ chỗ/lead/hoa hồng, khối OOO, nhắc, thông báo). Dùng id ngẫu nhiên nên không ghi dữ liệu, không giữ tồn. Project `rbac` giờ khớp `rbac-sprint\d.spec.ts` | **Viết xong.** Chạy thật: 385 bỏ qua (pending) |
| UI smoke rack/đặt phòng (skip chờ FE) | `ui/rack-booking.smoke.spec.ts`, 7 test: TC-L2-001 (E), 002 (E), 004 (E) mất mạng, 016 (E), **021 (E) hai lễ tân lưu cùng lúc** (một bên "Đã tạo đơn", bên kia "Căn vừa được người khác đặt…", form giữ nguyên), 020/076 (E) để `fixme`. Nhãn đọc từ `design/copy/strings-vi.json` | **Viết xong dạng skip** (`E2E_UI=1`) |
| Kiểm traceability `--strict` | `gen_traceability.py --strict` **exit 0**: 395 TC, 72/72 story, AC 250/250, ops mismatched 0, x-rbac-field untagged 0. `gen_rbac_cases.py --check` OK (1958 ca). `validate-fixtures` 0 lỗi | **Đạt** |
| Chạy những gì chạy được | Stack compose dùng một lần `ottimo-qa-s2`, build từ `git archive HEAD` (bản Sprint 1, vì cây làm việc không build được). Kết quả: **928 test – 331 đạt / 597 bỏ qua / 0 trượt / 0 flaky**. Hồi quy Sprint 1 giữ nguyên số của lần chạy CI cuối Sprint 1. Chi tiết ở mục 3 | Đã chạy |

## 2. Đã làm gì

### 2.1 Helper dùng chung (`e2e/support/s2.ts`, `e2e/support/clock.ts`)
- `EP`: bảng `[method, path, operationId]` cho 30 operation Sprint 2, dùng cho `requireEndpoints`.
- `oracle(id)` / `oracleNum(id, key)` đọc `br-examples.json`. Thiếu ví dụ thì ném lỗi, để BR đổi tên là test đỏ ngay.
- `s2Context()` lấy căn và kênh của cơ sở DS-E. Thiếu 10 căn hoặc chưa có danh mục kênh thì skip với lý do "môi trường". `channel('direct')` chọn kênh mã `direct` nếu có, không thì `zalo_phone` (nhóm direct) và gửi `directSource` (mục 5, điểm 3).
- `freeWindow()` / `freeRoom()` / `bookFree()` / `makeHold()` chọn khoảng còn trống qua `searchAvailability`, và thử lại khi gặp `409` vì stack dùng chung. `track()` + `cleanupTracked()` hủy đơn hoặc khối ở `afterEach`.
- Ngày cố định của oracle (9/11/2026, 31/12/2026) chỉ dùng cho `calculateQuote`, không giữ tồn. `needFutureDate()` tự skip khi ngày đã qua.
- `clock.ts`: `setClock()` = `freeze` → `set` (MutableClock giữ đóng băng đúng `at`), `expectNear()`, `runJob()` (job chưa đăng ký → skip), `scenarioDate()` lấy ngày ngẫu nhiên > hôm nay + 365. Project `api` không đặt phòng ở khoảng đó nên kịch bản giờ giả không đụng dữ liệu của các ca chạy song song.

### 2.2 Ca theo file (mã TC)

| File | TC |
|---|---|
| `api/reservations.api.spec.ts` (20) | TC-L2-010, 011, 013 (BR-105-01), 014 (BR-112-01), 015, 016, **TC-NT-008 (ca gốc createReservation)**, 018 (Idempotency), 079 (b)(c)(e) (BR-113-01), 079 (a) `fixme`, 042, 043, 052, **053 × 4 (dryRun, BR-309-02/03/05/06)**, 076 + 077 (a)(b), 077 (c)(d)(e), 078 |
| `api/booking-conflicts.api.spec.ts` (5) | TC-L2-020, 022 (BR-002-01), 023 (4), 024 (1)(2), 024 (3) + 027 + 028 (mọi căn kín → làn "Chưa gán căn", incident open → gán căn → resolved) |
| `api/concurrency.api.spec.ts` (4) | **TC-L2-021**, TC-X-001, TC-X-002, TC-X-003 |
| `api/room-blocks.api.spec.ts` (4) | TC-L2-030, 031 + 032 (BR-804-02), 033 (BR-804-01), TC-L6-041 + TC-L2-023 (7)(8) |
| `api/quotes-holds.api.spec.ts` (23) | **TC-L2-012** (lịch giá BR-104-01/02/03/04), TC-L5-001 (BR-107-01, BR-305-01, BR-903-01), 002 (BR-107-02), 003, 004 (BR-108-01), 005 (BR-110-05), 006 × 5 (BR-110-01/02/03/06/08), 036, 021 (giờ thật, dung sai 2 phút), 023 (BR-302-02), 024, 025 (a), 029, 031, 032, 034, TC-L2-040, 050 + 051, 057 |
| `api/extra-guest-kit.api.spec.ts` (7) | TC-L6-053 (a)–(d) / TC-L2-019 × 5 (BR-110-01/03, BR-812-04/05/07 – `extraGuestCount`, việc `extra_guest_kit_prepare` hạn 14:00 ngày đến theo BR-812-01, phụ thu trên folio khi `getFolio` có), 053 (f), 055 (a)(e) (BR-812-06) |
| `clock/hold-expiry.clock.spec.ts` (6) | TC-L5-022 (BR-302-01), 026 (BR-303-01), 028, 029 (BR-303-02/03), 030 (a) + TC-X-004, 015 + 017 (a) |
| `clock/no-show.clock.spec.ts` (2) | TC-L2-070, 071, 072, 073, 074 (BR-315-01), 075 (b) (BR-315-02) trong một dòng thời gian; TC-L6-044 |

### 2.3 Tài liệu
- Test case **v0.3.3**:
  - TC-L2-073 (b): theo hợp đồng `markNoShow` (`contactAttemptNote` bắt buộc) nên kết quả là `422`.
  - TC-L6-053…055: bỏ phần BLOCKED của ARC, vì OpenAPI 0.3.1 đã có `extra_guest_kit_*`, `HkTask.dueAt`, `extraGuestCount`. Vẫn chờ PO thêm AC.
  - TC-L2-079 (a): gắn `[UNDECIDED]`.
- `smoke-manifest.json`: 14 ca (S) chuyển `implemented` kèm spec và project (TC-NT-008, TC-L2-020, 021, 024, 052, 053, 074, TC-L5-001, 021, 026, TC-X-001…004). Còn 23 pending (Sprint 3+). Tiêu đề TC-L5-001 cập nhật theo số mới (5.205.000 / 1.600.000).
- `README.md` của tests (thư mục `clock/`, biến `E2E_DOUBLE_BOOK_*`) và `docs/qa/traceability.md` đã sinh lại.

## 3. Lệnh đã chạy và kết quả

| Lệnh | Kết quả |
|---|---|
| `curl` stack dev `ottimo-dev` (cổng 3000): `/v1/me`, `/rooms`, `/reservations` | Tất cả `404`. Image `ottimo-api:dev` (15:08) chỉ có module `audit`, `platform`, thiếu `identity`, nên stack dev **không dùng được** cho E2E (mục 5, điểm 1) |
| `docker compose build api web` trên cây làm việc | **Lỗi** `TS2305` ở `modules/reservations/*`: BE đang viết dở Sprint 2 (mục 5, điểm 2) |
| Build `git archive HEAD` (00f59b7, bản Sprint 1) → stack `ottimo-qa-s2` (cổng 25432/23000/28081–28083, image `:qa-s2`, `.env` sinh bằng `make-ci-env.sh`), migrate + `run --rm seed` DS-E | Lên khỏe; `/health` ok; `/v1/me` `401` |
| `CI=true … playwright test` (mọi project) – lần 2, sau khi thêm TC-NT-008 | **928 test: 331 đạt, 597 bỏ qua, 0 trượt, 0 flaky** (6 giây). Chi tiết: rbac-sprint1 286/0/88 · rbac-sprint2 0/0/385 (pending) · api Sprint 1 30/0/11 · api Sprint 2 0/0/62 · clock 0/0/8 (đồng hồ được bật vì `CI=true`; các ca skip ở bước kiểm endpoint) · limits 2/0/1 · rbac-logout 11/0/0 · smoke 2/0/23 (pending đã giảm từ 37 xuống 23) · desk-chromium 0/0/18 · db-outage 0/0/1 |
| Sau lần chạy trên: thêm TC-L2-012 | `--list`: 929 test, 21 file. Đã qua typecheck/lint, **chưa chạy lại trên stack** (stack đã dọn). Lúc này ca này cũng chỉ skip pending |
| 3.3 Tự kiểm cơ chế đồng thời trên API giả lập (Node, 127.0.0.1:3998, file ở scratchpad, đã tắt) | API đúng: TC-L2-021 (20 vòng × 8) và TC-X-001 (50) **đạt**. API cố ý cho đặt trùng (kiểm trùng trước rồi mới chờ): TC-L2-021 **trượt** với `201×8, 409×0`, chứng minh test bắt được đặt trùng. Lần tự kiểm đầu cũng tìm ra **lỗi của chính harness**: bên thua có `code = ROOM_UNAVAILABLE` nên không được kiểm "không có mã đơn" bằng `code`. Đã sửa thành kiểm "không có `id`" |
| Tự kiểm helper đồng hồ trên stack thật `ottimo-qa-s2` | **Đạt**: `setClock` dừng đúng mốc (sau 1,5 giây `/health` vẫn đúng giờ đó), phiên `qa.fd` tự đăng nhập lại sau khi nhảy giờ, `resetClock` về giờ thật |
| Tự kiểm helper thuần (ngày, oracle, `paxOf`, `vnTime`, `scenarioDate`) | Đạt (spec tạm, đã xóa) |
| `tsc` tests, `eslint tests`, `prettier --check tests docs/qa` | Xanh |
| `node tools/validate-fixtures.mjs` | 0 lỗi, 1 cảnh báo cũ (OTM-0108); smoke 42 (S): implemented 20, pending 23 |
| `python3 tools/gen_traceability.py --strict` | **exit 0** (395 TC, 72/72 story, 250/250 AC, ops mismatched 0) |
| `python3 tools/gen_rbac_cases.py --check` | OK – up to date (178 operation, 1958 ca) |
| Dọn | `down --volumes` stack `ottimo-qa-s2`, xóa image `:qa-s2`, `.env` tạm, bản export HEAD. Stack dev `ottimo-dev` không bị đụng |

## 4. Giả định
- Hình dạng phản hồi theo OpenAPI 0.3.x:
  - `Reservation.hold.expiresAt`, `extraGuestCount`, `allowedActions[].action`, `segments[].roomId`.
  - Phản hồi cancel có dạng `{reservation, cancellation}`.
  - `Problem.conflicts[].nights`, `suggestions[{roomId, roomNo, upgrade}]`.
  - `Rack.unassigned[]`, `AttentionItem.kind/reservationIds`, `HkTask.type/dueAt/reservationId`.
  - Danh sách có thể là `{data: []}` hoặc mảng.
  
  Chỗ hợp đồng chưa rõ thì kiểm lỏng (TC-L2-032 chấp nhận `ROOM_BLOCKED` hoặc `ROOM_UNAVAILABLE`).
- Mã job theo architecture 9.1: `hold.expire`, `hold.remind`, `quote.expire`, `no_show.call`, `no_show.mark_prompt`, `ooo.activate`.
- `[GIẢ ĐỊNH QA – chờ DOM]` (đã có trong TC-L5-015): báo giá hết hạn lúc 23:59 của (ngày lập + `quote_validity_days` = 3).
- TC-L2-053 dùng `cancel dryRun` nên không ghi dữ liệu. Phần "yêu cầu duyệt hoàn tiền `pending`" cần lần hủy thật: kiểm khi có `listApprovalRequests` + nguồn duyệt (Sprint 3).
- Phụ thu người trên folio (TC-L2-019) nhận dòng có mã/loại khớp `extra_person|extra_guest|phu_thu_nguoi`. Chờ BE chốt mã dòng folio rồi chỉnh.
- Ngày đến ở `scenarioDate()` > hôm nay + 365 của giờ thật. Đồng hồ được đặt tới đó trước khi đặt phòng, nên cửa sổ BR-112 tính theo giờ giả.
- Các quyết định trong quyền QA, **đề nghị ORC ghi decision-log khi commit** (file này ngoài vùng của QA):
  - (1) project `clock` chạy tuần tự, sau mọi project dùng API, và chỉ bật trên CI/stack dùng một lần;
  - (2) runner RBAC Sprint 2 dùng id ngẫu nhiên, không tạo dữ liệu;
  - (3) kỳ vọng TC-L2-073 (b) = `422` theo hợp đồng.

## 5. Rủi ro / vướng mắc / việc chưa xong
1. **Stack dev `ottimo-dev` chạy image api cũ** (`ottimo-api:dev` 15:08: chỉ có `audit` và `platform`, thiếu `identity`; `/v1/me` → `404`). Ai dùng stack dev để thử sẽ thấy "không đăng nhập được". Đề nghị OPS/BE build lại image dev khi cây Sprint 2 build được. Đây là môi trường, không phải lỗi sản phẩm, nên chưa ghi BUG.
2. **Cây làm việc không build được** (BE đang viết Sprint 2: `db/schema` chưa export `ReservationStatus`, `OccupancyKind`). Bình thường giữa sprint. Nhưng **CI sẽ đỏ** nếu ORC commit `services/api` ở trạng thái này: cần BE xác nhận trước khi commit chung với phần QA. Phần QA (`product/tests/**`) commit độc lập được: CI vẫn chạy trên build Sprint 1 → Sprint 2 skip pending.
3. **Câu hỏi hợp đồng cho ARC/BA** (không cần INV quyết, nên không tạo ESC):
   - (a) TC-L2-079 (a) "không chọn căn cụ thể → server gán căn đêm lẻ 202" nhưng `ReservationCreate.roomId` là trường **bắt buộc** → cần endpoint hoặc cờ gợi ý căn, hoặc sửa TC.
   - (b) TC-L2-073: `markNoShow` gộp ghi kết quả liên lạc vào lệnh đánh dấu. QA đã sửa TC theo hợp đồng; BA xác nhận "Cần chú ý `no_show_mark` mở khóa nút khi đã ghi kết quả liên lạc" giờ hiểu thế nào.
   - (c) Kênh "Trực tiếp": DS-E seed 5 nguồn trực tiếp thành 5 kênh (`zalo_phone`, `walk_in`, `direct_web`, `returning`, `sales_staff`), trong khi OpenAPI 0.3.1 có `directSource` (bắt buộc với nhóm direct). Hai cách mô hình chồng nhau. Harness chọn `direct` → `zalo_phone` và luôn gửi `directSource`. BE/ARC cần chốt một cách; nếu đổi thì QA sửa `ds-e.json`.
4. **Chưa có kết quả đạt/không đạt nào cho Sprint 2.** Khi BE-A/BE-B đẩy endpoint: chạy `--project=api --project=rbac` trên stack dùng một lần, sau đó `--project=clock` với `CI=1` hoặc `E2E_CLOCK_CONTROL=1`. Dự kiến phải chỉnh nhỏ theo hình dạng phản hồi thật (mục 4).
5. Chưa phủ ở tầng E2E, chờ tính năng hoặc ghi lý do:
   - TC-L2-001 (A) cần seed **DS-0** (loader hiện chỉ nạp DS-E);
   - phần outbox `channel.availability_changed` của TC-L2-010/052, TC-X-010: chưa có API đọc outbox, kiểm ở tầng A của BE;
   - "mã đơn không bị tiêu" của TC-X-001 không kiểm được khi nhiều project song song cùng tạo đơn, cần test tầng A;
   - TC-L5-017 (b)(c) gia hạn báo giá qua duyệt: chưa có operation gia hạn báo giá;
   - TC-L6-042: cần nhận phòng (Sprint 3);
   - TC-L5-025 (b), 033, 039: dời R3;
   - TC-L2-002/003 phần a11y (axe): chưa có `@axe-core/playwright` trong devDependencies, thêm khi FE có màn.
6. UI smoke dùng selector dự kiến (label `booking.field.*`, nút `booking.create`). FE chốt DOM rồi QA chỉnh. Máy này vẫn chưa cài trình duyệt Playwright.
7. TC-L5-025 (a) dùng đúng ngày oracle 9/11–16/11/2026 cho căn 202 (giá phụ thuộc thứ). Trên stack dùng chung, nếu khoảng đó đã có đơn thì ca tự skip "môi trường".

## 6. File tạo/sửa
- Tạo:
  - `product/tests/e2e/support/s2.ts`, `product/tests/e2e/support/clock.ts`
  - `product/tests/e2e/api/reservations.api.spec.ts`, `booking-conflicts.api.spec.ts`, `concurrency.api.spec.ts`, `room-blocks.api.spec.ts`, `quotes-holds.api.spec.ts`, `extra-guest-kit.api.spec.ts`
  - `product/tests/e2e/clock/hold-expiry.clock.spec.ts`, `product/tests/e2e/clock/no-show.clock.spec.ts`
  - `product/tests/e2e/rbac/sprint2-ops.ts`, `product/tests/e2e/rbac/rbac-sprint2.spec.ts`
  - `product/tests/e2e/ui/rack-booking.smoke.spec.ts`
  - `rounds/round-02/outputs/QA/s2-report.md`
- Sửa:
  - `product/tests/e2e/playwright.config.ts` (rbac khớp `rbac-sprint\d`, thêm project `clock`, `db-outage` phụ thuộc `clock`)
  - `product/tests/e2e/rbac/cases.ts` (`SPRINT2_CASES`)
  - `product/tests/e2e/smoke-manifest.json`
  - `product/tests/test-cases/r1-main-flows.md` (v0.3.3)
  - `product/tests/README.md`
  - `product/docs/qa/traceability.md` (sinh lại)
- Không sửa file ngoài vùng QA. Cache `e2e/.auth/sessions.json` (gitignore) bị ghi đè trong lúc chạy stack tạm: chỉ là cache, lần chạy sau tự đăng nhập lại.
