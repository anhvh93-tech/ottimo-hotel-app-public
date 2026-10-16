# Danh sách lỗi – Round 2

- Tác giả: QA | Mở: 16/10/2026 (tuần 1, Đợt 0) | Cập nhật: 16/10/2026 – Sprint 2, bước Kiểm thử (commit `573547c`, CI 38902292311) | Mức lỗi theo `product/docs/qa/test-strategy.md` mục 8
- Lỗi tồn từ R1: `rounds/round-01/qa/bug-list.md` (không chép lại)

## 1. Tổng hợp

| Mức | Số lỗi | Open | Fixed | Closed |
|---|---|---|---|---|
| P0 | 0 | 0 | 0 | 0 |
| P1 | 3 | 2 | 1 | 0 |
| P2 | 10 | 5 | 2 | 3 |
| P3 | 9 | 6 | 1 | 2 |
| **Tổng** | **22** | **13** | **4** | **5** |

| ID | Mức | Tóm tắt | Vai sửa | Trạng thái |
|---|---|---|---|---|
| BUG-R2-001 | P2 | BR v0.2 chưa đổi mặc định theo INV đã quyết (ân hạn trả muộn 12:30 – ESC-007 A; ở tối thiểu bật – ESC-004 A) | DOM | Fixed (BR v0.3) |
| BUG-R2-002 | P3 | Ví dụ BR-321 và BR-803 dùng căn 204 – OTTIMO không có căn 204 | DOM | Fixed (BR v0.3) |
| BUG-R2-003 | P3 | Ví dụ BR-433 gọi "nhận sớm trước 06:00" là phí 1.042.000, trái BR-411/417 v0.2 (đó là đêm bán) | DOM | Fixed (BR v0.3) |
| BUG-R2-004 | P2 | Seed DS-E: bộ đếm nhóm đơn `GRP-` (đúng: `NH-`), tên `docType`/`periodKey` lệch erd mục 10 → `pnpm seed:ds-e` dừng (FB-R2-BE-QA-01) | QA | Closed (16/10) |
| BUG-R2-005 | **P1** | Vai bị cấm nhận 422/401 thay vì 403 (không ghi `access.denied`) ở thao tác có Idempotency-Key: `createUser`, `createRoom`, `trustCurrentDevice`, `rejectRequest` – kiểm body/mật khẩu trước cổng vai | BE (BE-B identity/platform, BE-A approvals) | Open |
| BUG-R2-006 | **P1** | Ảnh `ottimo-web` (Dockerfile.web) build hỏng: `packages/ui` `@import` file trong `design/` mà `.dockerignore` loại → job CI `docker-build` đỏ, không deploy staging được | FE (packages/ui) + OPS | Open |
| BUG-R2-007 | P2 | `setParameter hold_hours_default` = 36 (ngoài `hold_hours_options` 12/24/48) được lưu 200 – thiếu kiểm chéo erd 9.1a | BE (BE-B) | Open |
| BUG-R2-008 | P2 | `lookupGuestByContact` với SAL/CTV: SĐT/email của khách người khác → `{"matches":[]}`, mất tín hiệu `possible_duplicate` (US-087, EP00 6.3) | ARC (schema) + BE (BE-B) | Open |
| BUG-R2-009 | P2 | Test admin-web đỏ 2/64 (`auth.test.tsx` tìm nhãn cũ "Số điện thoại hoặc email") → `pnpm test` toàn repo đỏ (QC B1) | FE | Open |
| BUG-R2-010 | P3 | MGR mở thẳng `/settings/users`: hiện trang Người dùng & vai + "Chưa tải được danh sách" + nút "Thử lại", câu "nhờ quản lý" – không phải trang "không có quyền" | FE (+ BA/ARC chốt `screens` S26 của MGR) | Open |
| BUG-R2-011 | P3 | `displayName` (createUser/updateUser) nhận ký tự ngoài V-01 (`(`, `_`, `@`…); `fullName` khách và FE đã chặn đúng | BE (BE-B) | Open |
| BUG-R2-012 | P2 | E2E QA lệch build thật: tên tạm có chữ số (V-01), login thiếu `Origin`, kỳ vọng `actorUserId`/`84…`, không đổi token sau `changeMyPassword`, `If-Match` cũ – 26 ca đỏ giả | QA | Closed (16/10) |
| BUG-R2-013 | P3 | `smoke/health.spec.ts` TC-X-050c dùng cố định `infra/docker-compose.yml` + `.env` của stack dev → bật `E2E_COMPOSE_CONTROL=1` sẽ dừng PostgreSQL dev thay vì stack dùng một lần | QA | Closed (16/10, sửa CI) |
| BUG-R2-014 | P3 | `POST /__test__/rate-limits/reset` (test-support) chuyển mọi tài khoản `locked` khớp tiền tố → `active`, kể cả `qa.locked` bị khóa có chủ ý (TC-NT-005) – lẽ ra chỉ xóa khóa tạm (`locked_until` có giá trị) | BE (BE-A) | Open |
| **BUG-R2-015** | **P1** | Job CI `docker images build · E2E smoke` đỏ (run 38887585274: 289 trượt): CI không nạp seed DS-E → mọi đăng nhập `qa.*` 401; harness thử đăng nhập lại ở từng ca → chạm SR-RL-01 (20/IP/15 phút) → 562 lỗi `429 RATE_LIMITED` | OPS (ci.yml) + QA (harness) | Fixed (16/10, chờ CI GitHub xanh) |
| BUG-R2-016 | P2 | TC-X-050c dừng PostgreSQL trong khi project `rbac`/`api` chạy song song → có thể sinh 5xx giả ở ca khác | QA | Fixed (16/10) |
| BUG-R2-017 | P2 | Đơn OTA nhập tay bỏ trống giá đêm → `422 nightlyRates:REQUIRED` (EP02 3.2/OpenAPI: bỏ trống = giá mặc định theo lịch giá kênh); gốc: chưa có tham số `ota_base_rate.<group>` (BR-103, BR mục 13) | BE (BE-A) + ARC (catalogue tham số) | Open |
| BUG-R2-018 | P2 | Sàn–trần giá đêm BR-105 tính theo giá niêm yết từng căn, không theo giá nền nhóm: căn 203 nhận 1.901.000 (trần đúng 1.900.000) và chặn 530.000–553.000 (sàn đúng 530.000) | BE (BE-A) + ARC | Open |
| BUG-R2-019 | P3 | `createReservation` kiểm cọc (`DEPOSIT_INSUFFICIENT`) **trước** khối OOO và chống trùng – trái thứ tự EP02 3.4 (… → `ROOM_BLOCKED` → `ROOM_UNAVAILABLE` → tiền) | BE (BE-A) | Open |
| BUG-R2-020 | P3 | `suggestions[]` của `409 ROOM_UNAVAILABLE` gợi ý cả nhóm căn **thấp hơn** và gắn `upgrade: true` (đơn căn 402 NPLUS → gợi ý 101…202 L12) – trái BR-312/OpenAPI ("cùng nhóm hoặc nhóm cao hơn") | BE (BE-A) | Open |
| BUG-R2-021 | P3 | `job_key` lệch architecture 9.1: build đăng ký `reservation.hold_expiry`, `room_block.activation` thay vì `hold.expire`, `ooo.activate` (`/__test__/jobs/{jobKey}/run`) | BE (BE-A) hoặc ARC sửa tài liệu | Open |
| BUG-R2-022 | P2 | E2E Sprint 2 của QA lệch build thật – 45 ca đỏ giả ở CI 38902292311 (thiếu cọc `initialPayment`, `note` cho lý do `other`, `otherVersion` 0, mã lý do `guest_cancelled`, ngày 1 đêm rơi T6/T7, kênh OTA trong báo giá, đồng hồ hai file chạy song song…) | QA | Closed (16/10) |

## 2. Chi tiết

### BUG-R2-001 – BR v0.2 chưa đổi mặc định theo quyết định INV 16/10
- Mức: **P2** (tài liệu nguồn con số lệch quyết định đã chốt; code theo BR sẽ thu sai tiền trả muộn) · Môi trường: tài liệu · Vai sửa: DOM (plan R2 mục 2, việc DOM (4)) · Trạng thái: **Fixed** (BR v0.3, 16/10)
- Bước tái hiện: so `02-escalations/escalations-index.md` (ESC-007 "A – ân hạn 12:30…", ESC-004 "A – bộ chính sách giá khuyến nghị", gồm M-A ở tối thiểu 2 đêm cho đến T6, T7, ngày lễ) với `product/docs/business-rules.md` mục 13.
- Thực tế: `late_grace_until` = 12:00 (không ân hạn); `min_stay[]` = 1 đêm (tắt). BR vẫn ghi "INV chọn ở ESC-007".
- Mong đợi: BR v0.3 đổi mặc định (`late_grace_until` 12:30; `min_stay` theo M-A) hoặc ghi rõ R2 vẫn dùng mặc định cũ và lý do.
- Bằng chứng: `product/tests/fixtures/br-examples.json` dòng BR-412-08, BR-412-09, BR-113-01 (trường `escNote`); `fixtures/seed/ds-e.json` tham số `late_grace_until`, `min_stay` (trường `note`). Ví dụ: trả 12:20, căn không có khách đến → theo INV 0 đ, theo BR hiện hành 210.000 đ.
- Khi DOM sửa: QA đổi giá trị seed DS-E và chạy lại `pnpm test:fixtures`.

### BUG-R2-002 – Ví dụ BR-321 và BR-803 dùng căn 204 không tồn tại
- Mức: P3 · Vai sửa: DOM · Trạng thái: **Fixed** (BR v0.3, 16/10)
- Thực tế: BR-321 "203 hết, gợi ý 204"; BR-803 "Đổi phòng khách đang ở sang 204 đang VD → chặn". BL 4.1 chỉ có 101–103, 201–203, 301, 302, 401, 402.
- Mong đợi: ví dụ dùng căn có thật (vd. BR-321: nhóm Lầu 1–2 hết → gợi ý nâng hạng 301 cho lễ tân trưởng xác nhận theo BR-316; BR-803: 202 đang VD).
- Bằng chứng: oracle BR-321-01, BR-803-02 (trường `issue`) – QA ghi kỳ vọng không phụ thuộc số căn.

### BUG-R2-003 – Ví dụ BR-433 trái BR-411/417 v0.2
- Mức: P3 · Vai sửa: DOM · Trạng thái: **Fixed** (BR v0.3, 16/10)
- Thực tế: BR-433 ví dụ "nhận sớm trước 06:00 phí 1.042.000: cần quản lý". Từ v0.2, BR-411 ghi "trước 06:00 không phải phụ thu" và BR-417 xử lý là đêm bán (doanh thu phòng); miễn tiền đêm này là "giảm giá đặc biệt" (BR-431), không phải FOC phụ thu.
- Mong đợi: đổi ví dụ sang khoản phát sinh thật vượt 300.000 (vd. trả muộn 17:00 căn 401: 50% × 1.042.000 = 521.000 → cần quản lý).
- Bằng chứng: oracle BR-433-02 (trường `issue`).

### BUG-R2-004 – Seed DS-E ghi mã nhóm đơn `GRP-`, tên bộ đếm lệch erd mục 10
- Mức: **P2** (seed là hợp đồng mã giữa DB, TC và E2E; loader dừng nên không nạp được DS-E nếu không dùng `--allow-code-drift`) · Môi trường: dev, PostgreSQL 17 `ottimo` (Docker `ottimo-dev-postgres-1`), loader `services/api/src/db/seed/ds-e.ts` · Vai sửa: QA (chủ fixture) · Nguồn: thẻ FB-R2-BE-QA-01 (BE) · Trạng thái: **Closed** (QA tự chạy lại 16/10)
- Bước tái hiện: DB đã migrate, chưa có tổ chức `OTTIMO` → `pnpm --filter @ottimo/api seed:ds-e` (không cờ).
- Thực tế (trước sửa): `SeedCodeMismatchError: … group: server NH-00001 ≠ fixture GRP-00001`, exit 1; báo cáo có `aliases` `group → reservation_group`, `receipt → payment`.
- Mong đợi: fixture theo BR-007 v0.3 / erd mục 10: `reservation_group` `NH-{n:05}` (`HH-` dành cho nhóm hộ CRM R3), `payment` `PT-{n:06}`, `periodKey` `-` (bill giữ `year`); loader chạy qua, 7/7 mã khớp, `aliases` rỗng.
- Bằng chứng sau sửa: xem mục 3 dòng BUG-R2-004.

### BUG-R2-005 – Vai bị cấm nhận 422/401 thay vì 403 ở thao tác có Idempotency-Key
- Mức: **P1** (phân quyền – mặc định P1: lần bị từ chối không có `audit_event access.denied` (US-002 AC2, TC-NT-008); vai bị cấm dò được cấu trúc body qua 422; vai bị cấm làm tốn bộ đếm 5 lần sai xác nhận mật khẩu của chính mình (429 sau vài lần). Không leo thang quyền: body hợp lệ vẫn bị 403) · Vai sửa: BE-B (`users.controller`, `devices.controller`, `platform.controller`), BE-A (`approvals.controller` reject) · Trạng thái: **Open**
- Môi trường: stack compose dùng một lần `ottimo-qa-r2s1` (api `127.0.0.1:13000`, build từ `d7d42e4`, `APP_ENV=dev`, `ADMIN_BASE_URL=http://127.0.0.1:18081`), DS-E.
- Bước tái hiện: (1) đăng nhập `qa.mgr`; `POST /v1/users` + `Idempotency-Key` + body `{username:"x",displayName:"1"}`. (2) `qa.fd`: `POST /v1/properties/{pid}/rooms` body `{}`. (3) `qa.fd`: `POST /v1/properties/{pid}/trusted-devices` body `{name,deviceKind:"desk",currentPassword:"sai",hardeningChecklistConfirmed:false}`. (4) `qa.hk`: `POST …/approval-requests/{id}/actions/reject` body `{}`.
- Thực tế: (1) `422 VALIDATION_FAILED` (`username`, `displayName`…); (2) `422`; (3) `422`, và khi đủ checklist → `401 REAUTH_FAILED` (9/9 vai bị cấm trong runner RB-1784…1792); sau ~5 lần → `429 RATE_LIMITED`; (4) `422`. Không có dòng `access.denied`.
- Mong đợi: OpenAPI mục "Thứ tự kiểm": … → `If-Match` → **quyền vai/phạm vi** → nghiệp vụ. Vai không thuộc `x-roles` → `403 FORBIDDEN_ACTION` + `audit_event access.denied`, trước mọi kiểm body/mật khẩu. (Đối chứng: `createGuest` với `qa.hk` body sai → 403 đúng; `setParameter`, `revokeTrustedDevice` → 403 đúng.)
- Nguyên nhân (đọc code): `AuthGuard` hoãn quyết định vai của operation có Idempotency-Key sang `UnitOfWork.run` (để replay), nhưng controller gọi `parseBody(...)` và `reauth.verify(...)` **trước** `uow.run` (`users.controller.ts:110`, `devices.controller.ts:70-73`, `platform.controller.ts:139`, `approvals.controller.ts` reject parse lý do trước).
- Đề xuất sửa: gọi `authGuard.enforce(req)` (hoặc helper `assertAllowed(req)`) ngay đầu handler khi chưa có replay, hoặc chuyển `parseBody`/`reauth.verify` vào trong callback của `uow.run` sau bước tra khóa. Thêm test tầng A: vai bị cấm + body sai → 403 + audit cho mọi operation có Idempotency-Key.
- Bằng chứng: E2E `TC-NT-008 (thứ tự kiểm, BUG-R2-005)` (mới, `product/tests/e2e/api/identity.api.spec.ts`) đỏ: `createUser_mgr: 422 VALIDATION_FAILED`, `trustCurrentDevice_fd: 422 VALIDATION_FAILED`; RBAC runner lần chạy cuối: RB-1784…RB-1792 đỏ (`401 REAUTH_FAILED`), lần chạy đầu RB-0387…0395 đỏ (`422 NAME_INVALID`). Thử tay: `createRoom` FD `{}` → 422, `rejectRequest` HK `{}` → 422.

### BUG-R2-006 – Ảnh web không build được (Dockerfile.web)
- Mức: **P1** (chặn CI `docker-build`, chặn deploy staging – tiêu chí "đủ dùng" Sprint 1 "deploy tự động" và QC B1/B5) · Vai sửa: FE (chủ `packages/ui`) + OPS (`.dockerignore`/Dockerfile) · Trạng thái: **Open**
- Bước tái hiện: `cd product && docker build -f infra/docker/Dockerfile.web .` (hoặc `docker compose … build web`).
- Thực tế: `@ottimo/admin-web:build: [vite:css] [postcss] ENOENT … '../../../../design/wireframes/assets/tokens.css'` (file `packages/ui/src/styles/index.css`), exit 1. `.dockerignore` loại `design`. Build trên máy (ngoài Docker) vẫn chạy.
- Mong đợi: ảnh build xanh như job CI `Build web image` (`.github/workflows/ci.yml` dòng ~216).
- Đề xuất sửa: (a) UXD/FE sinh `tokens.css` vào `packages/ui/src/styles/` (script `pnpm --filter @ottimo/ui sync` đang dùng cho icon) và import nội bộ gói; hoặc (b) OPS bỏ loại trừ `design/wireframes/assets/` trong `.dockerignore`. QA nghiêng (a) – gói không phụ thuộc thư mục ngoài workspace.
- Bằng chứng: log build ở stack QA (scratchpad, đã dọn); QA chạy UI bằng `vite build` trên máy + Caddy cùng digest để tiếp tục kiểm.

### BUG-R2-007 – `hold_hours_default` nhận giá trị ngoài danh sách 12/24/48
- Mức: P2 (sai quy tắc nghiệp vụ BR-302 qua API; FE H05 đã chỉ cho chọn 12/24/48 nên người dùng thường không gặp; hạn giữ chỗ không phải tiền) · Vai sửa: BE-B · Trạng thái: **Open**
- Bước tái hiện: `qa.owner` (hoặc `qa.mgr`) `PUT /v1/properties/{pid}/parameters/hold_hours_default` `{value:36, effectiveFrom:<ngày tương lai>, reason:"…"}`.
- Thực tế: `200`, giá trị 36 lưu và hiện ở lịch sử H05 ("24 giờ → 36 giờ"). `value:100` → 422 `PARAM_OUT_OF_RANGE` min 1 max 72 (biên đơn có kiểm).
- Mong đợi: TC-NT-012 / erd 9.1a "**chéo**: ∈ `hold_hours_options`" → `422` lỗi tại `value`, tham số giữ nguyên.
- Bằng chứng: E2E `TC-NT-012` đỏ (3/3 lần chạy); thử tay với `qa.mgr` 200.

### BUG-R2-008 – SAL/CTV tra SĐT/email của khách người khác không nhận `possible_duplicate`
- Mức: P2 (lệch AC US-087/US-072 và EP00 6.3 dòng "Có thể trùng – liên hệ lễ tân"; **không** lộ dữ liệu: `createGuest` trùng vẫn bị chặn `409 DUPLICATE_GUEST` không kèm id – nên không xếp P1) · Vai sửa: ARC (thêm `match: enum [possible_duplicate]` vào schema 200 – BE-B đã nêu R1) + BE-B · Trạng thái: **Open**
- Bước tái hiện: `qa.sal` tạo khách email E; `qa.ctv1` `POST /v1/properties/{pid}/guests/lookup` `{email:E}`.
- Thực tế: `200 {"matches":[]}` (serializer chung bỏ trường `match` vì schema đóng). `qa.fd` tra cùng E → thấy hồ sơ (đúng).
- Mong đợi: `{"matches":[], "match":"possible_duplicate"}` (OpenAPI mô tả `lookupGuestByContact`), không tên/mã khách.
- Bằng chứng: E2E `TC-RB-010` đỏ (`Expected substring: "possible_duplicate"`, `Received: {"matches":[]}`); thử tay CTV tạo trùng → 409 không có `existingGuestId` (đúng).

### BUG-R2-009 – Test đơn vị admin-web đỏ 2 ca
- Mức: P2 (CI `pnpm test` đỏ – QC B1; không ảnh hưởng người dùng) · Vai sửa: FE · Trạng thái: **Open**
- Bước tái hiện: `cd product/apps/admin-web && npx vitest run`.
- Thực tế: `Tests 2 failed | 62 passed (64)` – `auth.test.tsx` "deep link while signed out…" và "logout from the user menu…": `Unable to find a label with the text of: /Số điện thoại hoặc email/`. Màn thật (và `strings-vi.json` `auth.login.username`) là "Tên đăng nhập". Báo cáo FE S1 ghi 64 xanh – lệch sau khi đổi chuỗi.
- Mong đợi: 64/64 xanh; test dùng khóa i18n `auth.login.username` thay vì chữ cứng.

### BUG-R2-010 – MGR mở thẳng URL Người dùng & vai thấy trang lỗi tải thay vì "không có quyền"
- Mức: P3 (API vẫn chặn 403; chỉ là trải nghiệm/sai câu chữ) · Vai sửa: FE; BA/ARC chốt `getMe.screens` của MGR có S26 hay không (rbac 20a: MGR ◐ S26 = đổi mật khẩu/phiên của mình) · Trạng thái: **Open**
- Bước tái hiện: admin-web (API thật) đăng nhập `qa.mgr` → mở `/settings/users`.
- Thực tế: trang "Người dùng & vai" với "Chưa tải được danh sách người dùng · Tài khoản của bạn không làm được thao tác này. Nếu cần, nhờ quản lý. · Thử lại". Menu đúng là ẩn mục này. Nguyên nhân: route guard `Screen` chỉ kiểm `screens` (`canOpen`), không kiểm `item.roles` như `isVisible`; server trả S26 cho MGR.
- Mong đợi: TC-NT-010 (E) – trang "không có quyền" (`NoAccessPage`), không nút "Thử lại", không câu "nhờ quản lý" với chính quản lý.
- Ghi chú: smoke UI TC-NT-010 vẫn "đạt" theo regex hiện tại; QA siết kỳ vọng khi FE sửa.

### BUG-R2-011 – `displayName` nhận ký tự ngoài V-01
- Mức: P3 · Vai sửa: BE-B · Trạng thái: **Open**
- Thực tế: `users.controller.ts` chỉ kiểm "có chữ cái, không chữ số" → `"Qa Rbac (tạm)"`, `"a_b"`, `"a@b"` được nhận; `fullName` khách (guests.service `isValidName`) và FE (`validation.ts`) chặn đúng.
- Mong đợi: V-01 (EP00 mục 3): chỉ chữ cái mọi bảng chữ, khoảng trắng, `-`, `'`, `.` → `NAME_INVALID`. Dùng chung hàm `isValidName`.

### BUG-R2-012 – E2E QA lệch build thật (ca đỏ giả)
- Mức: P2 (26/72 ca đỏ giả ở lần chạy đầu sẽ che lỗi thật) · Vai sửa: QA · Trạng thái: **Closed** (sửa + chạy lại trên stack mới 16/10)
- Nguyên nhân và sửa: (1) tên tạm `E2E …`, `… ${uniq()}` có chữ số → V-01 `NAME_INVALID` – thêm `uniqName()` chỉ chữ cái (`support/api.ts`, `rbac/sprint1-ops.ts`, `api/identity.api.spec.ts`); (2) TC-SEC-020 gọi login không gửi `Origin` – stack có `ADMIN_BASE_URL` nên 403 đúng (login CSRF) → gửi `Origin`; (3) TC-NT-017 đòi `actorUserId` – `AuditEvent` 0.3.3 chỉ có `actorName` → so theo tên hiển thị; (4) TC-L5-041 đòi `84…` – API trả `+84…` (hợp đồng không quy định; ghi thẻ cho BE/ARC) → chấp nhận cả hai; (5) `activateUser` dùng token cũ sau `changeMyPassword` – server cấp cookie mới (SR-SES-02) → lấy token mới; (6) TC-NT-007 gửi `If-Match` của lúc tạo – đổi mật khẩu đã tăng `version` → đọc lại version; (7) runner `changeMyPassword` chấp nhận thêm `401 REAUTH_FAILED` (cổng vai đã cho qua).

### BUG-R2-013 – TC-X-050c điều khiển nhầm stack dev
- Mức: P3 · Vai sửa: QA · Trạng thái: **Closed** (16/10: chạy `E2E_COMPOSE_CONTROL=1` + `E2E_COMPOSE_PROJECT=ottimo-qa-ci` trên stack dùng một lần – TC-X-050c đạt, PostgreSQL dev `ottimo-dev` không bị dừng)
- Thực tế: `smoke/health.spec.ts` gọi `docker compose --env-file .env -f infra/docker-compose.yml stop postgres` cố định → chạy với stack dùng một lần ở cổng khác sẽ dừng PostgreSQL **dev**. Lần này QA không bật `E2E_COMPOSE_CONTROL`, kiểm TC-X-050c bằng tay trên stack QA (đạt).
- Sửa: đọc `E2E_COMPOSE_FILE`, `E2E_COMPOSE_ENV_FILE`, `E2E_COMPOSE_PROJECT` (mặc định giữ như cũ cho CI).

### BUG-R2-014 – Reset giới hạn (test-support) mở khóa cả tài khoản bị khóa có chủ ý
- Mức: P3 (chỉ code test-support, không có trong ảnh production) · Môi trường: stack compose dùng một lần `ottimo-qa-ci`, build 16/10 · Vai sửa: BE (BE-A) · Trạng thái: **Open**
- Bước: đọc `services/api/src/test-support/test-support.module.ts` `TestRateLimitsController.reset`; gọi `POST /__test__/rate-limits/reset` với `usernamePrefix` mặc định `qa.`.
- Thực tế: câu UPDATE đặt `status = CASE WHEN status = 'locked' THEN 'active' …` cho mọi tài khoản khớp tiền tố → `qa.locked` (DS-E khóa có chủ ý, `locked_until` NULL) thành `active`, TC-NT-005 sẽ đỏ ở lần chạy sau.
- Mong đợi: chỉ mở khóa tạm do sai mật khẩu (`status='locked' AND locked_until IS NOT NULL`), giống điều kiện `auth.service` dùng khi đăng nhập.
- Tạm tránh (QA): harness không bao giờ gửi tiền tố `qa.`; dùng `RESET_PREFIXES` = `qa.owner, qa.mgr, qa.fd, qa.hk, qa.mt, qa.sal, qa.ctv` (+ `qa.e2e.lock` chỉ trong project `limits`).

### BUG-R2-015 – CI E2E đỏ: thiếu seed DS-E, harness khuếch đại thành 429
- Mức: P1 (chặn merge – job bắt buộc đỏ) · Môi trường: GitHub Actions run 38887585274, job `docker images build · E2E smoke` · Vai sửa: OPS (ci.yml) + QA (harness) · Trạng thái: **Fixed** (chờ lần chạy CI trên GitHub)
- Bằng chứng: log `[e2e setup] qa.owner: login qa.owner: {… "status":401,"code":"UNAUTHENTICATED"…}` cho cả 10 tài khoản → `phiên DS-E sẵn sàng: 0/10`; sau đó 562 dòng `Error: login qa.owner: 429 RATE_LIMITED` (`support/api.ts:263`); tổng 289 trượt / 174 bỏ qua / 4 đạt. Tái hiện tại chỗ: stack mới chưa seed + `CI=true` → globalSetup báo đúng nguyên nhân.
- Nguyên nhân: (1) bước CI tạo `QA_SEED_PASSWORD` ngẫu nhiên nhưng không chạy service `seed` → không có tài khoản `qa.*`; (2) mỗi ca gọi lại `freshSession` khi cache trống → 20 lần đăng nhập/IP cạn ngay, phần còn lại 429.
- Sửa: ci.yml thêm bước `docker compose … run --rm seed` sau khi dựng stack; harness: reset giới hạn qua `/__test__/rate-limits/reset` ở globalSetup + reset và thử lại 1 lần khi 429; cache phiên theo tài khoản; globalSetup dừng sớm với 1 thông báo rõ khi CI không đăng nhập được tài khoản DS-E nào (401). Kiểm lại: s1-report mục 8.

### BUG-R2-016 – TC-X-050c dừng DB giữa lúc các project khác chạy
- Mức: P2 (đỏ giả ngẫu nhiên che lỗi thật) · Vai sửa: QA · Trạng thái: **Fixed**
- Thực tế: `smoke/health.spec.ts` TC-X-050c (`docker compose stop postgres`) thuộc project `smoke`, chạy song song với `rbac`/`api` (fullyParallel) → ca khác có thể nhận 5xx/`ECONNREFUSED` trong ~2–5 giây DB tắt.
- Sửa: tách sang `e2e/outage/db-outage.spec.ts`, project `db-outage` phụ thuộc mọi project khác (chạy cuối). Kiểm: 3 lần chạy đủ bộ, TC-X-050c đạt, 0 ca 5xx.

### BUG-R2-017 – Đơn OTA nhập tay bắt buộc giá đêm (không có giá mặc định theo kênh)
- Mức: P2 (lễ tân phải tự tính giá OTA cho mọi đơn nhập tay; sai giá → sai doanh thu/KPI; có cách làm tạm là nhập giá) · Vai sửa: BE-A + ARC (thêm `ota_base_rate.<group>` vào catalogue tham số, migration 0002/seed) · Trạng thái: **Open**
- Môi trường: stack dùng một lần `ottimo-qa-s2` build từ cây làm việc (= `573547c`), DS-E, 16/10/2026.
- Các bước: `qa.fd` `POST /v1/properties/{pid}/reservations` kênh `booking`, căn 203, 3 đêm từ thứ Sáu, `paymentModel=ota_prepaid`, **không** gửi `nightlyRates`/`otaRoomAmountVnd`.
- Thực tế: `422 VALIDATION_FAILED` `errors[{field: nightlyRates, code: REQUIRED}]` (requestId `305a1a22-2d9b-4424-9fa1-67557814b9c5`). BE ghi trong `outputs/BE/s2-be-a.md` mục 6: "chưa có tham số giá OTA nền theo nhóm".
- Mong đợi: EP02 3.2 `nightlyRates` = K, "bỏ trống → giá mặc định theo lịch giá của kênh (BR-101, 103, 104)"; OpenAPI `ReservationCreate.nightlyRates` "Bỏ trống = giá mặc định". TC-L2-012 (b): 870.000 (T6), 870.000 (T7), 760.000 (CN) theo `ota_base_rate` nhóm Lầu 1–2 = 760.000 (BR mục 13, INV-004).
- Bằng chứng: E2E `api/reservations.api.spec.ts` "TC-L2-012 (b)" (đánh dấu `test.fail` có mã lỗi này – tự báo khi đã sửa). Các ca OTA khác của QA tạm gửi giá 820.000/đêm (`support/s2.ts`).

### BUG-R2-018 – Sàn–trần BR-105 tính theo giá niêm yết từng căn, không theo giá nền nhóm
- Mức: P2 (chặn giá hợp lệ 530.000–553.000, nhận giá vượt trần 1.900.001–1.980.000 – sai quy tắc tiền) · Vai sửa: BE-A (cùng gốc BUG-R2-017: thiếu giá nền nhóm) · Trạng thái: **Open**
- Các bước: `qa.fd` tạo đơn kênh Trực tiếp căn 203, 1 đêm T2–T5, `nightlyRates[{amountVnd: X}]` (kèm cọc), lần lượt X = 530.000; 553.000; 555.000; 1.900.000; 1.979.000; 1.901.000; 1.981.000.
- Thực tế: 530.000 → `422 RATE_OUT_OF_RANGE` (requestId `c95b23cb-acfc-4ff4-9158-5d8bd8758a64`); 553.000 → 422; 555.000 → 201; 1.901.000 → **201** (OTM-00050 ở lần chạy E2E); 1.979.000 → 201; 1.981.000 → 422. Tức sàn ≈ 554.000 = 70% × 792.000, trần 1.980.000 = 250% × 792.000 (giá niêm yết đêm của căn 203, BR-101).
- Mong đợi: BR-105 "Mỗi **nhóm căn** có giá sàn và giá trần … Lầu 1–2: sàn 532.000 → 530.000, trần 1.900.000" (oracle `BR-105-01`, giá nền 760.000); TC-L2-013.
- Bằng chứng: E2E "TC-L2-013" (`test.fail` có mã lỗi); `services/api/src/modules/reservations/public/pricing.service.ts` dùng `rateBounds(base…)` với giá của căn.

### BUG-R2-019 – Thứ tự kiểm khi tạo đơn: tiền trước khối OOO/chống trùng
- Mức: P3 (không sai dữ liệu – giao dịch rollback; nhưng lễ tân được bảo "thu cọc 400.000" cho căn đã kín/đang khóa, phải thu rồi mới biết là trùng) · Vai sửa: BE-A · Trạng thái: **Open**
- Các bước: căn 201 có đơn `confirmed` [D, D+2); `qa.fd` tạo đơn Trực tiếp 201 cùng khoảng, **không** kèm `initialPayment`.
- Thực tế: `422 DEPOSIT_INSUFFICIENT` (`depositRequiredVnd` 400.000; requestId `0442aecc-b788-418d-8a61-b2942151968f`). Tương tự đơn vào đêm có khối OOO `planned` (TC-L2-030 ở CI 38902292311 nhận 422 thay vì `409 ROOM_BLOCKED`). Mã: `reservations.service.ts` ném `DEPOSIT_INSUFFICIENT` trước `assertSellable()` và `occupancy.claim()`.
- Mong đợi: EP02 3.4 "quyền → dữ liệu trường → căn bán được → khối OOO (`ROOM_BLOCKED`) → chống trùng (`ROOM_UNAVAILABLE`) → tiền (`DEPOSIT_INSUFFICIENT`)".
- Bằng chứng: E2E `api/booking-conflicts.api.spec.ts` "TC-L2-020 (thứ tự kiểm EP02 3.4)" (`test.fail`).

### BUG-R2-020 – Gợi ý căn thay thế gồm nhóm thấp hơn, gắn `upgrade: true`
- Mức: P3 (gợi ý sai có thể khiến lễ tân dời khách xuống căn nhỏ hơn mà tưởng là nâng hạng) · Vai sửa: BE-A · Trạng thái: **Open**
- Các bước: căn 402 (nhóm NPLUS, `sortOrder` 3 – cao nhất DS-E) có đơn [D, D+2); tạo đơn khác 402 cùng khoảng.
- Thực tế: `409 ROOM_UNAVAILABLE`, `suggestions` = 302/NPLUS (`upgrade:false`) rồi **101, 102, 103, 201, 202/L12 `upgrade:true`**. Mã: `occupancy.service.ts suggest()` xếp mọi nhóm khác theo `sort_order` tăng dần và gắn `upgrade = !same`.
- Mong đợi: OpenAPI `Problem.suggestions` "căn trống thay thế (cùng nhóm trước, `upgrade=true` nếu nhóm cao hơn)"; BR-312 "căn trống cùng nhóm hoặc cao hơn". Nhóm thấp hơn không được gợi ý (hoặc nếu DOM muốn gợi ý thì phải có cờ `downgrade`, không phải `upgrade`).
- Bằng chứng: E2E "TC-L2-024 (gợi ý)" (`test.fail`).

### BUG-R2-021 – Tên job lệch architecture 9.1
- Mức: P3 (QA/CI gọi `/__test__/jobs/hold.expire/run` → 404; tài liệu và code khác tên) · Vai sửa: BE-A đổi tên **hoặc** ARC sửa architecture 9.1 (một trong hai) · Trạng thái: **Open**
- Thực tế: `jobs/reservation-jobs.ts` đăng ký `reservation.hold_expiry` (J1) và `room_block.activation` (J9). Architecture 9.1 bảng job: `hold.expire`, `ooo.activate`.
- Tạm thời: `support/clock.ts` `JOB_ALIASES` thử cả hai tên. Ghi chú thêm (không phải lỗi, BE đã báo Sprint 4): J2 `hold.remind`, J3 `quote.expire`, J6/J7 no-show và "Cần chú ý" chưa có; trạng thái báo giá vẫn chuyển `expired` đúng khi đọc lúc 00:05 (TC-L5-015 đạt).

### BUG-R2-022 – E2E Sprint 2 của QA lệch build thật (ca đỏ giả ở CI 38902292311)
- Mức: P2 (45 ca đỏ giả che kết quả thật, chặn project phụ thuộc) · Vai sửa: QA · Trạng thái: **Closed (16/10)**
- Nguyên nhân và sửa (chi tiết `rounds/round-02/outputs/QA/s2-report.md` mục 7):
  1. Đơn Trực tiếp/CTV bắt buộc cọc qua `initialPayment` (EP02 3.2, B2 điều kiện b) → `createReservation()` tự kèm đúng `depositRequiredVnd` khi gặp `DEPOSIT_INSUFFICIENT`; `withDeposit()` cho ca đua đồng thời/Idempotency.
  2. Runner quyền: `moveReservation` lý do `other` cần `note`; `swapRoom.otherVersion` ≥ 1.
  3. Mã lý do hủy nhân viên chọn không có `guest_cancelled` (EP02 6, chỉ khách tự hủy) → `guest_changed_mind`.
  4. Ngày 1 đêm ngẫu nhiên rơi T6/T7/ngày đặc biệt → `MIN_STAY_NOT_MET` (BR-113) → chọn T2–T5, tránh ngày đặc biệt; `makeHold` tự tăng lên 2 đêm.
  5. Báo giá chỉ nhận kênh Trực tiếp/CTV (EP02 10.1) → bỏ kênh OTA khỏi `calculateQuote`; 28 đêm → `422 LONG_STAY_REQUIRES_CONTRACT`.
  6. Cọc thiếu tính `required − 500.000` âm → `required / 2`; lọc dòng phụ thu folio theo `category`; `ApprovalRequest.requestedBy` là tên.
  7. `affectedReservationsAcknowledged` chỉ ghi nhận (ARC A-03) → khối trùng đơn luôn 409; J9 theo ngày nghiệp vụ 06:00 (BR-010).
  8. Hai file project `clock` chạy song song làm lệch đồng hồ chung → `workers: 1`; chờ cache đồng hồ ≤ 1 giây sau `set`.
- Kiểm lại: stack dùng một lần mới (`down --volumes`, migrate, seed DS-E), chạy như CI: **932 test – 734 đạt, 4 "phải trượt" (BUG-R2-017…020), 194 bỏ qua, 0 trượt, 0 flaky**.

## 3. Kiểm lại bản sửa (QA, 16/10/2026 – Đợt 0)

Cách kiểm: đọc `product/docs/business-rules.md` **v0.3.1** (cột ví dụ + mục 13), cập nhật oracle/seed theo `rounds/round-02/outputs/DOM/w1-oracle-review.md`, chạy `node product/tests/tools/validate-fixtures.mjs` → **0 lỗi** (226 dòng oracle, 157 dòng tự tính lại). Chuyển **Fixed**; chuyển **Closed** khi test unit của BE (sprint 1) đọc oracle mới và xanh – tầng code chưa có nên chưa kiểm được ở tầng A.

| ID | Bằng chứng đã sửa trong BR v0.3 | Oracle/seed QA đã đổi | Trạng thái |
|---|---|---|---|
| BUG-R2-001 | Mục 13: `late_grace_until` = **12:30** (INV-007), `min_stay[]` **bật** 2 đêm cho ngày đến T6/T7/ngày đặc biệt (INV-004), thêm `min_stay_orphan_night_exception`; BR-412 ví dụ 12:20/12:30 → 0, 12:31 → 210.000 | BR-412-01…09 params 12:30 + điều kiện không có khách đến; BR-412-04 đổi `sameDayArrival` = true (giữ ca bậc 30%); thêm BR-412-10, -11; BR-113-01 bỏ `escNote`, thêm BR-113-02, -03; seed `late_grace_until`, `min_stay` | Fixed |
| BUG-R2-002 | BR-321: gợi ý căn trống cùng nhóm (ví dụ 101), hết nhóm → nâng hạng 301 cho FDL xác nhận; BR-803: đổi sang 202 đang VD | BR-321-01 bỏ `issue`, thêm `groupCodePattern`, `suggestedRooms`, `whenGroupFull`; BR-803-02 thêm `targetRoom` 202 | Fixed |
| BUG-R2-003 | BR-433: ví dụ mới trả muộn 17:00 căn 401 = 521.000 > 300.000 → cần quản lý; ghi rõ miễn đêm trước 06:00 là "giảm giá đặc biệt" | BR-433-02 đổi ca, bỏ `issue` | Fixed |
| BUG-R2-004 | `ds-e.json` `docSequences`: `group`/`GRP-` → `reservation_group`/`NH-`, `receipt` → `payment`, `periodKey` `all` → `-`; validator thêm kiểm `docSequences` theo erd 10 (đột biến `GRP-` + `receipt` → 2 lỗi, exit 1) | `pnpm --filter @ottimo/api seed:ds-e` trên DB dev `ottimo`, **không** `--allow-code-drift`: exit 0, 13 user, 15 vai, 2 thiết bị, 136 tham số, **7/7 mã khớp** (`OTM-00001, BG-00001, WO-00001, NH-00001, PT-000001, F26-000001, KH-0001`), `aliases` [], `warnings` [] | **Closed** |
