# Danh sách lỗi – Round 2

- Tác giả: QA | Mở: 16/10/2026 (tuần 1, Đợt 0) | Cập nhật: 17/10/2026 – **Sprint 3 bước Kiểm thử** (E2E S3 trên stack dùng một lần `ottimo-qa-s3`; lượt chính trên ảnh build từ **HEAD `229db99`** (commit Phản hồi & sửa) – trước đó `a297273` + `product/infra`; báo cáo `qa/s3-test-report.md`) – trước đó: khởi động Sprint 3 (ĐK-S2-1) | Mức lỗi theo `product/docs/qa/test-strategy.md` mục 8
- Lỗi tồn từ R1: `rounds/round-01/qa/bug-list.md` (không chép lại)

## 1. Tổng hợp

| Mức | Số lỗi | Open | Fixed | Closed |
|---|---|---|---|---|
| P0 | 1 | 0 | 0 | 1 |
| P1 | 11 | 6 | 1 | 4 |
| P2 | 25 | 9 | 0 | 16 |
| P3 | 15 | 3 | 0 | 12 |
| **Tổng** | **52** | **18** | **1** | **33** |

Sprint 3 kiểm thử (17/10): đóng BUG-R2-025…029 (mục 4); thêm BUG-R2-030…052. Kiểm lại trên `229db99`: đóng **044 (P0)**, 039, 042; 030 đã commit (chờ CI E2E xanh – đang chặn bởi 050). Open: P1 = 031, 035, 037, 046, **050**, **052**; P2 = 033, 034, 036, 038, 041, 045, 047, 048, 051; P3 = 032, 040, 043. Đếm lại từng dòng bảng dưới.

| ID | Mức | Tóm tắt | Vai sửa | Trạng thái |
|---|---|---|---|---|
| BUG-R2-001 | P2 | BR v0.2 chưa đổi mặc định theo INV đã quyết (ân hạn trả muộn 12:30 – ESC-007 A; ở tối thiểu bật – ESC-004 A) | DOM | **Closed** (retest S2 16/10) – BE test đọc oracle mới xanh |
| BUG-R2-002 | P3 | Ví dụ BR-321 và BR-803 dùng căn 204 – OTTIMO không có căn 204 | DOM | **Closed** (retest S2 16/10) – BE test đọc oracle mới xanh |
| BUG-R2-003 | P3 | Ví dụ BR-433 gọi "nhận sớm trước 06:00" là phí 1.042.000, trái BR-411/417 v0.2 (đó là đêm bán) | DOM | **Closed** (retest S2 16/10) – BE test đọc oracle mới xanh |
| BUG-R2-004 | P2 | Seed DS-E: bộ đếm nhóm đơn `GRP-` (đúng: `NH-`), tên `docType`/`periodKey` lệch erd mục 10 → `pnpm seed:ds-e` dừng (FB-R2-BE-QA-01) | QA | Closed (16/10) |
| BUG-R2-005 | **P1** | Vai bị cấm nhận 422/401 thay vì 403 (không ghi `access.denied`) ở thao tác có Idempotency-Key: `createUser`, `createRoom`, `trustCurrentDevice`, `rejectRequest` – kiểm body/mật khẩu trước cổng vai | BE (BE-B identity/platform, BE-A approvals) | **Closed** (retest S2 16/10) – TC-NT-008 (thứ tự kiểm) đạt |
| BUG-R2-006 | **P1** | Ảnh `ottimo-web` (Dockerfile.web) build hỏng: `packages/ui` `@import` file trong `design/` mà `.dockerignore` loại → job CI `docker-build` đỏ, không deploy staging được | FE (packages/ui) + OPS | **Closed** (retest S2 16/10) – ảnh `ottimo-web` build xanh từ cây làm việc |
| BUG-R2-007 | P2 | `setParameter hold_hours_default` = 36 (ngoài `hold_hours_options` 12/24/48) được lưu 200 – thiếu kiểm chéo erd 9.1a | BE (BE-B) | **Closed** (retest S2 16/10) – TC-NT-012 đạt (36 → 422) |
| BUG-R2-008 | P2 | `lookupGuestByContact` với SAL/CTV: SĐT/email của khách người khác → `{"matches":[]}`, mất tín hiệu `possible_duplicate` (US-087, EP00 6.3) | ARC (schema) + BE (BE-B) | **Closed** (retest S2 16/10) – SAL tra SĐT khách người khác → `match: possible_duplicate` |
| BUG-R2-009 | P2 | Test admin-web đỏ 2/64 (`auth.test.tsx` tìm nhãn cũ "Số điện thoại hoặc email") → `pnpm test` toàn repo đỏ (QC B1) | FE | **Closed** (retest S2 16/10) – admin-web 108/108 |
| BUG-R2-010 | P3 | MGR mở thẳng `/settings/users`: hiện trang Người dùng & vai + "Chưa tải được danh sách" + nút "Thử lại", câu "nhờ quản lý" – không phải trang "không có quyền" | FE (+ BA/ARC chốt `screens` S26 của MGR) | **Closed** (S3 kickoff 16/10) – TC-NT-010 (E) Chromium, web + API thật: heading "Bạn không có quyền mở trang này", không "Thử lại"/"nhờ quản lý" |
| BUG-R2-011 | P3 | `displayName` (createUser/updateUser) nhận ký tự ngoài V-01 (`(`, `_`, `@`…); `fullName` khách và FE đã chặn đúng | BE (BE-B) | **Closed** (retest S2 16/10) – `displayName` `(`/`_`/`@` → 422 `NAME_INVALID` |
| BUG-R2-012 | P2 | E2E QA lệch build thật: tên tạm có chữ số (V-01), login thiếu `Origin`, kỳ vọng `actorUserId`/`84…`, không đổi token sau `changeMyPassword`, `If-Match` cũ – 26 ca đỏ giả | QA | Closed (16/10) |
| BUG-R2-013 | P3 | `smoke/health.spec.ts` TC-X-050c dùng cố định `infra/docker-compose.yml` + `.env` của stack dev → bật `E2E_COMPOSE_CONTROL=1` sẽ dừng PostgreSQL dev thay vì stack dùng một lần | QA | Closed (16/10, sửa CI) |
| BUG-R2-014 | P3 | `POST /__test__/rate-limits/reset` (test-support) chuyển mọi tài khoản `locked` khớp tiền tố → `active`, kể cả `qa.locked` bị khóa có chủ ý (TC-NT-005) – lẽ ra chỉ xóa khóa tạm (`locked_until` có giá trị) | BE (BE-A) | **Closed** (S3 kickoff 16/10) – build `cfcf6d8` (image `ottimo-api:qa-s3`): reset tiền tố `qa.locked` → `qa.locked` vẫn `locked`, đăng nhập 401; khóa tạm `qa.mt` (`locked_until` có giá trị) → `active`, đăng nhập 200 |
| **BUG-R2-015** | **P1** | Job CI `docker images build · E2E smoke` đỏ (run 38887585274: 289 trượt): CI không nạp seed DS-E → mọi đăng nhập `qa.*` 401; harness thử đăng nhập lại ở từng ca → chạm SR-RL-01 (20/IP/15 phút) → 562 lỗi `429 RATE_LIMITED` | OPS (ci.yml) + QA (harness) | **Closed** (retest S2 16/10) – CI nạp seed DS-E, E2E chạy đủ |
| BUG-R2-016 | P2 | TC-X-050c dừng PostgreSQL trong khi project `rbac`/`api` chạy song song → có thể sinh 5xx giả ở ca khác | QA | **Closed** (retest S2 16/10) – 6 lần chạy đủ, `db-outage` chạy cuối, 0 ca 5xx |
| BUG-R2-017 | P2 | Đơn OTA nhập tay bỏ trống giá đêm → `422 nightlyRates:REQUIRED` (EP02 3.2/OpenAPI: bỏ trống = giá mặc định theo lịch giá kênh); gốc: chưa có tham số `ota_base_rate.<group>` (BR-103, BR mục 13) | BE (BE-A) + ARC (catalogue tham số) | **Closed** (retest 16/10) |
| BUG-R2-018 | P2 | Sàn–trần giá đêm BR-105 tính theo giá niêm yết từng căn, không theo giá nền nhóm: căn 203 nhận 1.901.000 (trần đúng 1.900.000) và chặn 530.000–553.000 (sàn đúng 530.000) | BE (BE-A) + ARC | **Closed** (retest 16/10) |
| BUG-R2-019 | P3 | `createReservation` kiểm cọc (`DEPOSIT_INSUFFICIENT`) **trước** khối OOO và chống trùng – trái thứ tự EP02 3.4 (… → `ROOM_BLOCKED` → `ROOM_UNAVAILABLE` → tiền) | BE (BE-A) | **Closed** (retest 16/10) |
| BUG-R2-020 | P3 | `suggestions[]` của `409 ROOM_UNAVAILABLE` gợi ý cả nhóm căn **thấp hơn** và gắn `upgrade: true` (đơn căn 402 NPLUS → gợi ý 101…202 L12) – trái BR-312/OpenAPI ("cùng nhóm hoặc nhóm cao hơn") | BE (BE-A) | **Closed** (retest 16/10) |
| BUG-R2-021 | P3 | `job_key` lệch architecture 9.1: build đăng ký `reservation.hold_expiry`, `room_block.activation` thay vì `hold.expire`, `ooo.activate` (`/__test__/jobs/{jobKey}/run`) | BE (BE-A) hoặc ARC sửa tài liệu | **Closed** (retest 16/10) |
| BUG-R2-022 | P2 | E2E Sprint 2 của QA lệch build thật – 45 ca đỏ giả ở CI 38902292311 (thiếu cọc `initialPayment`, `note` cho lý do `other`, `otherVersion` 0, mã lý do `guest_cancelled`, ngày 1 đêm rơi T6/T7, kênh OTA trong báo giá, đồng hồ hai file chạy song song…) | QA | Closed (16/10) |
| BUG-R2-023 | P2 | `createReservation` không kiểm người chốt theo US-017 AC9: kênh CTV không người chốt / người chốt là SAL, nguồn `sales_staff` không người chốt / người chốt là CTV – đều `201` | BE (BE-A) | Closed (CI 38911271416) |
| BUG-R2-024 | P3 | Harness E2E Sprint 2: dữ liệu dùng chung căn giữa các ca song song gây flaky (TC-L2-021, TC-L2-022, TC-L2-033), dò endpoint lưu kết quả 404 tạm thời → bỏ qua cả ca (TC-NT-008), ngày 1 đêm rơi T6/T7 (TC-L5-015 BR-304-02) | QA | Closed (16/10) |
| BUG-R2-025 | P2 | `CAPACITY_BELOW_BOOKINGS` không bao giờ được trả: `ROOM_CAPACITY_CHECK` vẫn là stub `NO_BOOKINGS_YET` → hạ sức chứa dưới số khách của đơn tương lai vẫn lưu được (QC-S2-01, US-004 AC3) | BE-A (+ BE-B) | **Closed** (S3 testing 17/10) – ảnh `a297273`: `api/room-capacity` + `serial` TC-NT-039/040(b)(c) → 409 `CAPACITY_BELOW_BOOKINGS`, 2 lượt sạch  |
| BUG-R2-026 | P2 | Bên thua khi lưu đồng thời có thể thấy "Máy chủ đang gặp sự cố": thiếu xử lý `409 CONCURRENT_UPDATE` / `503 SERVICE_UNAVAILABLE` (chuỗi + `Retry-After`) (QC-S2-02) | UXD (chuỗi) + FE | **Closed** (S3 testing 17/10) – UI `ui/s3-retest.spec.ts`: 503 + `Retry-After` → câu `error.SERVICE_UNAVAILABLE`/đếm ngược, tự gửi lại, đơn tạo; không `error.server`  |
| BUG-R2-027 | P2 | Văn bản báo giá tiếng Nga ra tiếng Anh: `QUOTE_COPY_MISSING.ru` thiếu 5 khóa (`sale.quote_text`, `sale.quote_text_extra_guest`, `occ.*_short`), `--check` chỉ cảnh báo (PO-S2-01, US-083 AC2) | UXD (5 chuỗi RU) + BE-B (sinh lại `quote-copy.ts`, `--check` báo lỗi) | **Closed** (S3 testing 17/10) – TC-L5-016 (ru) đạt (chữ Kirin, không lẫn câu mẫu EN); bỏ `test.fail`  |
| BUG-R2-028 | P3 | Form Đặt phòng mới: tạo nhanh khách có SĐT xong, form vẫn đòi nhập lại "Số điện thoại / Zalo" (ô đỏ "Bắt buộc với kênh Trực tiếp") rồi PATCH lại hồ sơ khách | FE | **Closed** (S3 testing 17/10) – UI: tạo nhanh khách có SĐT → form không hỏi lại, không `PATCH guests/*`  |
| BUG-R2-029 | P3 | Sơ đồ phòng luôn hiện "Dữ liệu lúc hh:mm. Đang kết nối lại…" vì `GET /v1/properties/{id}/events` (SSE) trả 404 trên build – lễ tân tưởng mất kết nối | FE (ẩn trạng thái khi endpoint chưa có) / BE-A (SSE – Sprint 4) | **Closed** (S3 testing 17/10) – UI: Sơ đồ phòng 5 giây không có "Đang kết nối lại…"  |
| **BUG-R2-030** | **P1** | Stack compose (dev + CI E2E): `api`/`worker` không khởi động – `EACCES: mkdir '/app/.data/blobs'` → job CI `docker images build · E2E smoke` đỏ ở "Start compose stack" (run 38929255451) | OPS (+ BE-C) | **Fixed** – đã commit `229db99` (volume `blobdata`, `BLOBSTORE_LOCAL_PATH`, Dockerfile `node:node 0700`); QA kiểm trên ảnh `229db99`: stack `healthy`, E2E đủ. Closed khi job CI E2E xanh (CI 38940900970 dừng ở bước lint do BUG-R2-050) |
| **BUG-R2-031** | **P1** | `Reservation` không trả các trường 0.3.6 (`registrationId`, `registrationStatus`, `registrationDeadlineAt`, `houseRulesSentAt`, `cardsIssued`, `balanceDueVnd`) → H13 bước Giấy tờ/Kiểm tra treo "Đang tải…" | BE-A | Open |
| BUG-R2-032 | P3 | H13 bước 3: nút sang bước 4 ghi "Nhận phòng căn {room}" (khóa `ci.submit` không tham số, sai nghĩa) | FE (+UXD khóa mới) | Open |
| BUG-R2-033 | P2 | Nhập giấy tờ người 2 không `partyMemberId` → không khớp hồ sơ theo BR-951, không tạo người "Chưa rõ" (US-043 AC3) | BE-C + BE-A | Open |
| BUG-R2-034 | P2 | "Cần chú ý" không có `registration_due`/`registration_overdue`/`visa_expiring` (US-025 AC4, US-044 AC4, US-050 AC2) | BE-C + BE-A | Open – **PO 17/10: thuộc Sprint 3** (nguồn API "Cần chú ý"; khung Tổng quan hiển thị ở Sprint 4), đóng trước cổng QC Sprint 3 |
| **BUG-R2-035** | **P1** | Job J5 `registration.deadline` chưa đăng ký: không nhắc hạn khai báo, không thông báo tổng hợp 22:00/07:00 (BR-611, US-042 AC2) | BE-C (+ BE-A worker) | Open |
| BUG-R2-036 | P2 | J16 chặn lượt 55 phút → ảnh người không đồng ý có thể còn quá hạn trên 24 giờ sau `confirmed` khi xóa ngay bị lỗi (BR-609-01) | BE-C | Open |
| **BUG-R2-037** | **P1** | Gia hạn vượt hạn thị thực không bị chặn mềm (thiếu 422 `VISA_EXPIRES_BEFORE_DEPARTURE`, US-050 AC2) | BE-A | Open |
| BUG-R2-038 | P2 | Điều kiện nhận phòng "Đã thu đủ" không cộng phụ thu nhận sớm / đêm B9a sắp ghi (EP03-05 1.3) | BE-A | Open |
| **BUG-R2-039** | **P1** | Nhận sớm có phụ thu mà `applyEarlySurcharge=false` vẫn nhận phòng, phụ thu bỏ qua không cần duyệt (thiếu 422 `SURCHARGE_DECISION_REQUIRED`) | BE-A | **Closed** (17/10, ảnh `229db99`) – TC-L3-014: `applyEarlySurcharge=false` có phụ thu → 422 `SURCHARGE_DECISION_REQUIRED` |
| BUG-R2-040 | P3 | Sơ đồ phòng `getRack.roomStatus` không đọc `room_status` (OC/VC thay vì OD/VD sau nhận/trả phòng) | BE-A | Open |
| BUG-R2-041 | P2 | Hóa đơn công ty (`setInvoiceRequest`) không gắn vào hồ sơ khách (US-039 AC2, D16) | BE-B | Open |
| BUG-R2-042 | P2 | `qa.sal` ghi thu cọc giữ chỗ của mình → 422 `AMOUNT_TOO_HIGH` max 0 (US-119 AC4, A33 `own_deposit_only`) | BE-B (+ARC) | **Closed** (17/10, ảnh `229db99`) – TC-L4-063: `qa.sal` ghi cọc giữ chỗ của mình → 201, `reconciliation=pending` |
| BUG-R2-043 | P3 | Số thẻ ở `posAuthCode` bị chặn nhưng mã lỗi `TOO_LONG` thay vì `CARD_NUMBER_DETECTED` (V-09) | BE-B | Open |
| **BUG-R2-044** | **P0** | Đơn OTA thu hộ (`ota_prepaid`): không có khoản "Đã thu qua OTA" → tiền phòng tính vào "Còn phải thu" (BR-307, US-119 AC2) – nguy cơ thu tiền khách 2 lần, trả phòng bị `BALANCE_DUE` | BE-B (+ cổng BE-A) | **Closed** (17/10, ảnh `229db99`) – TC-L4-061 (api), TC-L4-046, TC-L4-047 (clock): `paidViaOtaVnd` = tiền phòng, "Còn phải thu" chỉ còn khoản tại quầy; không cần ESC |
| BUG-R2-045 | P2 | `getExtensionOptions.channelFeeSavingsVnd` chỉ tính phí kênh 1 đêm (BR-422-01: theo tổng tiền gia hạn) | BE-A (+ARC hợp đồng) | Open |
| **BUG-R2-046** | **P1** | FOC trên dòng phát sinh (trả muộn, nhận sớm, minibar, dịch vụ) không có `limitBasisVnd` → quản lý không duyệt/tự áp được FOC trong hạn mức "≤ 1 đêm", mọi thứ dồn lên chủ đầu tư (BR-433) | BE-A (+ BE-B folio) | Open |
| BUG-R2-047 | P2 | Gia hạn (B13) không chuyển buồng OC → OD (SM-01 B13, BR-802) | BE-A | Open |
| BUG-R2-048 | P2 | `listC3AccessLog` bỏ qua tham số `from`/`to` của hợp đồng (server đọc `dateFrom`/`dateTo`) | BE-C | Open |
| BUG-R2-049 | P2 | Harness E2E Sprint 3 của QA: ngày nghiệp vụ lấy theo ngày lịch (đỏ 00:00–05:59), tham số tương lai 2028–2030 rò sang ngày ảo, thăm dò endpoint mang cookie phiên, ảnh mẫu PNG hỏng, kỳ vọng `balanceDueVnd` âm (trước 0.3.6), regex ngày hết hạn báo giá, cửa sổ dời ngày TC-L2-055 | QA | Closed (17/10) – 2 lượt chạy đủ trên stack mới: 0 trượt, 0 flaky |
| **BUG-R2-050** | **P1** | `apps/guest-web/build/used-keys.ts` không có trong git (bị `.gitignore` gốc `build/` loại) mà `vite.config.ts`/`guard.test.ts` import → checkout sạch: `tsc` guest-web đỏ, ảnh `ottimo-web` không build được; CI 38940900970 (`229db99`) đỏ ở Lint, E2E/publish/deploy bị bỏ | FE (guest-web) + OPS (.gitignore) | Open |
| BUG-R2-051 | P2 | Giới hạn SR-RL-09 (600 request/phút/người) ở `AuthGuard` dùng bộ đếm riêng: `/__test__/rate-limits/reset` không xóa được, không cấu hình được, cửa sổ theo MutableClock → sau khi tua đồng hồ về hiện tại `Retry-After` = 247.743.660 giây (≈ 7,8 năm), tài khoản bị khóa tới khi khởi động lại api; E2E dùng chung `qa.*` song song chạm 429 | BE-B (+ OPS) | Open |
| **BUG-R2-052** | **P1** | Khách đến sau nửa đêm (00:00–05:59, ngày nghiệp vụ vẫn = ngày đến): `checkIn` coi là nhận sớm trước 06:00 → 422 `addPriorNight: REQUIRED` (preview cùng lúc báo phụ thu 0); H13 chỉ hiện "Bắt buộc", không nhận phòng được (US-025 AC6, BR-602-02) | BE-A (+ FE thông báo) | Open |

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
- Mức: P3 (API vẫn chặn 403; chỉ là trải nghiệm/sai câu chữ) · Vai sửa: FE; BA/ARC chốt `getMe.screens` của MGR có S26 hay không (rbac 20a: MGR ◐ S26 = đổi mật khẩu/phiên của mình) · Trạng thái: **Closed** (kiểm UI 16/10, Sprint 3 kickoff – xem cuối mục)
- Bước tái hiện: admin-web (API thật) đăng nhập `qa.mgr` → mở `/settings/users`.
- Thực tế: trang "Người dùng & vai" với "Chưa tải được danh sách người dùng · Tài khoản của bạn không làm được thao tác này. Nếu cần, nhờ quản lý. · Thử lại". Menu đúng là ẩn mục này. Nguyên nhân: route guard `Screen` chỉ kiểm `screens` (`canOpen`), không kiểm `item.roles` như `isVisible`; server trả S26 cho MGR.
- Mong đợi: TC-NT-010 (E) – trang "không có quyền" (`NoAccessPage`), không nút "Thử lại", không câu "nhờ quản lý" với chính quản lý.
- Ghi chú: smoke UI TC-NT-010 vẫn "đạt" theo regex hiện tại; QA siết kỳ vọng khi FE sửa.
- **Kiểm lại 16/10 (Sprint 3 kickoff)**: stack `ottimo-qa-s3` (web + API thật, Chromium 1366×768), `ui/admin-web.smoke.spec.ts` TC-NT-010 (E) đã siết: `main` có heading "Bạn không có quyền mở trang này" (`shell.no_access_title`), 0 nút "Thử lại", 0 câu "nhờ quản lý", 0 "Chưa tải được danh sách" → **đạt**. Đóng.

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

- **Kiểm lại 16/10 (Sprint 3 kickoff, ĐK-S2-1)**: stack mới `ottimo-qa-s3`, ảnh api build từ `cfcf6d8` (`test-support.module.ts:254` chỉ mở khi `locked_until IS NOT NULL`). (1) `qa.locked` (DS-E, `locked`, `locked_until` NULL) → `POST /__test__/rate-limits/reset {usernamePrefix: "qa.locked"}` → `200 {users:1}` (chỉ xóa bộ đếm); DB vẫn `status=locked`; đăng nhập `qa.locked` → `401`. (2) Đối chứng khóa tạm: đặt `qa.mt` `locked` + `locked_until = now()+15'` → reset tiền tố `qa.mt` → DB `active`, `locked_until` NULL; đăng nhập 200. Đúng mong đợi → **Closed**.

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
- Mức: P2 (lễ tân phải tự tính giá OTA cho mọi đơn nhập tay; sai giá → sai doanh thu/KPI; có cách làm tạm là nhập giá) · Vai sửa: BE-A + ARC (thêm `ota_base_rate.<group>` vào catalogue tham số, migration 0002/seed) · Trạng thái: **Closed** (QA retest 16/10, commit `7d42e4`… cây làm việc – TC-L2-012 (b) đạt (Booking bỏ trống giá → 870.000/870.000/760.000))
- Môi trường: stack dùng một lần `ottimo-qa-s2` build từ cây làm việc (= `573547c`), DS-E, 16/10/2026.
- Các bước: `qa.fd` `POST /v1/properties/{pid}/reservations` kênh `booking`, căn 203, 3 đêm từ thứ Sáu, `paymentModel=ota_prepaid`, **không** gửi `nightlyRates`/`otaRoomAmountVnd`.
- Thực tế: `422 VALIDATION_FAILED` `errors[{field: nightlyRates, code: REQUIRED}]` (requestId `305a1a22-2d9b-4424-9fa1-67557814b9c5`). BE ghi trong `outputs/BE/s2-be-a.md` mục 6: "chưa có tham số giá OTA nền theo nhóm".
- Mong đợi: EP02 3.2 `nightlyRates` = K, "bỏ trống → giá mặc định theo lịch giá của kênh (BR-101, 103, 104)"; OpenAPI `ReservationCreate.nightlyRates` "Bỏ trống = giá mặc định". TC-L2-012 (b): 870.000 (T6), 870.000 (T7), 760.000 (CN) theo `ota_base_rate` nhóm Lầu 1–2 = 760.000 (BR mục 13, INV-004).
- Bằng chứng: E2E `api/reservations.api.spec.ts` "TC-L2-012 (b)" (đánh dấu `test.fail` có mã lỗi này – tự báo khi đã sửa). Các ca OTA khác của QA tạm gửi giá 820.000/đêm (`support/s2.ts`).

### BUG-R2-018 – Sàn–trần BR-105 tính theo giá niêm yết từng căn, không theo giá nền nhóm
- Mức: P2 (chặn giá hợp lệ 530.000–553.000, nhận giá vượt trần 1.900.001–1.980.000 – sai quy tắc tiền) · Vai sửa: BE-A (cùng gốc BUG-R2-017: thiếu giá nền nhóm) · Trạng thái: **Closed** (QA retest 16/10, commit `7d42e4`… cây làm việc – TC-L2-013 đạt (0, 529.000, 1.901.000 → RATE_OUT_OF_RANGE; 530.000, 1.900.000 → 201))
- Các bước: `qa.fd` tạo đơn kênh Trực tiếp căn 203, 1 đêm T2–T5, `nightlyRates[{amountVnd: X}]` (kèm cọc), lần lượt X = 530.000; 553.000; 555.000; 1.900.000; 1.979.000; 1.901.000; 1.981.000.
- Thực tế: 530.000 → `422 RATE_OUT_OF_RANGE` (requestId `c95b23cb-acfc-4ff4-9158-5d8bd8758a64`); 553.000 → 422; 555.000 → 201; 1.901.000 → **201** (OTM-00050 ở lần chạy E2E); 1.979.000 → 201; 1.981.000 → 422. Tức sàn ≈ 554.000 = 70% × 792.000, trần 1.980.000 = 250% × 792.000 (giá niêm yết đêm của căn 203, BR-101).
- Mong đợi: BR-105 "Mỗi **nhóm căn** có giá sàn và giá trần … Lầu 1–2: sàn 532.000 → 530.000, trần 1.900.000" (oracle `BR-105-01`, giá nền 760.000); TC-L2-013.
- Bằng chứng: E2E "TC-L2-013" (`test.fail` có mã lỗi); `services/api/src/modules/reservations/public/pricing.service.ts` dùng `rateBounds(base…)` với giá của căn.

### BUG-R2-019 – Thứ tự kiểm khi tạo đơn: tiền trước khối OOO/chống trùng
- Mức: P3 (không sai dữ liệu – giao dịch rollback; nhưng lễ tân được bảo "thu cọc 400.000" cho căn đã kín/đang khóa, phải thu rồi mới biết là trùng) · Vai sửa: BE-A · Trạng thái: **Closed** (QA retest 16/10, commit `7d42e4`… cây làm việc – TC-L2-020 (thứ tự kiểm) đạt: trùng đêm không kèm cọc → 409 ROOM_UNAVAILABLE)
- Các bước: căn 201 có đơn `confirmed` [D, D+2); `qa.fd` tạo đơn Trực tiếp 201 cùng khoảng, **không** kèm `initialPayment`.
- Thực tế: `422 DEPOSIT_INSUFFICIENT` (`depositRequiredVnd` 400.000; requestId `0442aecc-b788-418d-8a61-b2942151968f`). Tương tự đơn vào đêm có khối OOO `planned` (TC-L2-030 ở CI 38902292311 nhận 422 thay vì `409 ROOM_BLOCKED`). Mã: `reservations.service.ts` ném `DEPOSIT_INSUFFICIENT` trước `assertSellable()` và `occupancy.claim()`.
- Mong đợi: EP02 3.4 "quyền → dữ liệu trường → căn bán được → khối OOO (`ROOM_BLOCKED`) → chống trùng (`ROOM_UNAVAILABLE`) → tiền (`DEPOSIT_INSUFFICIENT`)".
- Bằng chứng: E2E `api/booking-conflicts.api.spec.ts` "TC-L2-020 (thứ tự kiểm EP02 3.4)" (`test.fail`).

### BUG-R2-020 – Gợi ý căn thay thế gồm nhóm thấp hơn, gắn `upgrade: true`
- Mức: P3 (gợi ý sai có thể khiến lễ tân dời khách xuống căn nhỏ hơn mà tưởng là nâng hạng) · Vai sửa: BE-A · Trạng thái: **Closed** (QA retest 16/10, commit `7d42e4`… cây làm việc – TC-L2-024 (gợi ý) đạt: đơn 402 chỉ được gợi ý nhóm NPLUS)
- Các bước: căn 402 (nhóm NPLUS, `sortOrder` 3 – cao nhất DS-E) có đơn [D, D+2); tạo đơn khác 402 cùng khoảng.
- Thực tế: `409 ROOM_UNAVAILABLE`, `suggestions` = 302/NPLUS (`upgrade:false`) rồi **101, 102, 103, 201, 202/L12 `upgrade:true`**. Mã: `occupancy.service.ts suggest()` xếp mọi nhóm khác theo `sort_order` tăng dần và gắn `upgrade = !same`.
- Mong đợi: OpenAPI `Problem.suggestions` "căn trống thay thế (cùng nhóm trước, `upgrade=true` nếu nhóm cao hơn)"; BR-312 "căn trống cùng nhóm hoặc cao hơn". Nhóm thấp hơn không được gợi ý (hoặc nếu DOM muốn gợi ý thì phải có cờ `downgrade`, không phải `upgrade`).
- Bằng chứng: E2E "TC-L2-024 (gợi ý)" (`test.fail`).

### BUG-R2-021 – Tên job lệch architecture 9.1
- Mức: P3 (QA/CI gọi `/__test__/jobs/hold.expire/run` → 404; tài liệu và code khác tên) · Vai sửa: BE-A đổi tên **hoặc** ARC sửa architecture 9.1 (một trong hai) · Trạng thái: **Closed** (QA retest 16/10, commit `7d42e4`… cây làm việc – clock: `hold.expire`, `ooo.activate` chạy đúng tên (TC-L5-026, TC-L6-044 đạt), đã bỏ alias)
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

### BUG-R2-023 – Người chốt đơn không được kiểm theo kênh/nguồn (US-017 AC9)
- Mức: P2 (người chốt quyết định hoa hồng BR-903 – đơn CTV không có người chốt hoặc người chốt sai loại làm sai/mất hoa hồng; AC Must R2) · Vai sửa: BE-A (`reservations.service.ts` `create` – hiện chỉ kiểm `isPropertyUser`) · Trạng thái: **Open**
- Môi trường: stack dùng một lần `ottimo-qa-s2` build từ cây làm việc (HEAD `7d42218`), DS-E mới, 16/10/2026.
- Các bước (`qa.fd`, căn 102, 2 đêm, khách có SĐT, kèm cọc): (1) kênh `collaborator` không `closerUserId`; (2) kênh `collaborator`, `closerUserId` = `qa.sal`; (3) kênh `direct` + `directSource: sales_staff` không `closerUserId`; (4) như (3) với `closerUserId` = `qa.ctv1`.
- Thực tế: cả 4 → `201` (OTM-00124 `closerUserId: null`, OTM-00125 người chốt là SAL, OTM-00126 `null`, OTM-00127 người chốt là CTV).
- Mong đợi: US-017 AC9, EP02 3.2 `closerUserId` ĐK: (1), (3) `422` `closerUserId:REQUIRED`; (2), (4) `422` `closerUserId:NOT_IN_LIST`; danh sách hợp lệ = `listCloserCandidates` `kind=agent`/`staff` (endpoint này đã đúng).
- Bằng chứng: E2E `api/s2-fix.api.spec.ts` "TC-L2-080" (đánh dấu `test.fail` có mã lỗi – tự báo khi đã sửa); phần `listCloserCandidates` của ca này chạy đạt trước bước lỗi.

### BUG-R2-024 – Harness E2E Sprint 2 flaky do dữ liệu dùng chung (QA)
- Mức: P3 · Vai sửa: QA · Trạng thái: **Closed (16/10)**
- Thực tế ở lượt retest: 1–2 ca flaky mỗi lần chạy (TC-L2-022, TC-L2-021 lần dò cọc, TC-L2-033, TC-L5-015 BR-304-02); TC-NT-008 bị bỏ qua một lần vì dò endpoint gặp 404 tạm thời và lưu kết quả.
- Sửa: chọn lại khoảng đêm khi bị ca song song chiếm (`WindowTakenError`, vòng thử TC-L2-022); TC-L2-033 kiểm lý do `requestedRoom.reason` (`blocked`) thay vì "trống"; ngày 1 đêm T2–T5; `isAvailable` thử lại 404 một lần và không lưu kết quả âm.
- Kiểm lại: 2 lần chạy đủ liên tiếp trên stack mới: 0 trượt, 0 flaky.

### BUG-R2-025 – `CAPACITY_BELOW_BOOKINGS` không bao giờ được trả (QC-S2-01)
- Mức: **P2** (sai AC US-004 AC3; lễ tân nhận đơn vượt sức chứa mà không được cảnh báo; không sai tiền) · Môi trường: đọc code `cfcf6d8` + stack `ottimo-qa-s3` (ảnh api 21:28) · Vai sửa: BE-A (provider ở reservations), BE-B (platform) · Trạng thái: **Closed** (17/10 – kiểm lại Sprint 3, mục 4; trước đó: Open (BE-A đang sửa – ĐK-S2-2))
- Bước: (1) `qa.fd` tạo đơn 302 (định mức 3, tối đa 4) 2 người lớn + 2 trẻ 6–11 tuổi (4 người tính); (2) `qa.owner` `PATCH rooms/302 {maxOccupancy: 3}` có `If-Match`.
- Thực tế: `200`, sức chứa thành 3 (ca TC-NT-039, chạy với `E2E_BUG_R2_025_FIXED=1` trước khi bỏ cờ). Gốc: `platform.module.ts:43` `{ provide: ROOM_CAPACITY_CHECK, useValue: NO_BOOKINGS_YET }`, module reservations không ghi đè; nhánh 409 ở `rooms.service.ts:375` không chạy.
- Mong đợi: `409 CAPACITY_BELOW_BOOKINGS`, `conflicts[]` có `reservationCode`, `stayFrom`, `stayTo`, `guestCount` 4; sức chứa giữ 4; trẻ dưới 6 tuổi không tính (TC-NT-040 b).
- Bằng chứng: `product/tests/e2e/serial/platform-mutations.serial.spec.ts` (TC-NT-039, TC-NT-040(b)(c), chạy tuần tự, tự trả sức chứa về cũ), `e2e/api/room-capacity.api.spec.ts` (ca của BE-A). Cây làm việc 16/10 ~22:00 đã có `ReservationCapacityCheck` + `useExisting` trong `reservations.module.ts:73` – QA chưa build được ảnh mới (mạng tải gói npm trong docker hết thời gian) nên chưa kiểm lại.

### BUG-R2-026 – Bên thua khi lưu đồng thời thấy "Máy chủ đang gặp sự cố" (QC-S2-02)
- Mức: **P2** · Vai sửa: UXD (chuỗi VI/EN), FE (`problem.ts`, thử lại theo `Retry-After`) · Trạng thái: **Closed** (17/10 – kiểm lại Sprint 3, mục 4; trước đó: Open (một phần đã sửa))
- Thực tế (đọc code 16/10 ~22:00 + E2E UI): `strings-vi/en.json` đã có `error.CONCURRENT_UPDATE`, `error.SERVICE_UNAVAILABLE`; `problemView` hiện `error.<CODE>` chỉ khi `status < 500` → `409 CONCURRENT_UPDATE` hiện đúng câu, nhưng `503 SERVICE_UNAVAILABLE` vẫn rơi về `error.server` ("Máy chủ đang gặp sự cố… mã tham chiếu"). Chưa thấy thử lại theo `Retry-After`.
- Mong đợi: cả hai mã hiện câu riêng, giữ dữ liệu form, nút/tự thử lại sau `Retry-After` (ĐK-S2-3).
- Bằng chứng: TC-L2-021 (E) `ui/rack-booking.smoke.spec.ts` – 8/8 lần lặp đạt trên stack QA (bên thua nhận `409 ROOM_UNAVAILABLE` → câu "Căn … đã có đơn của … từ … đến …", form giữ nguyên); ca coi câu `error.server` là trượt (ghi rõ "BUG-R2-026"). Chưa tạo được 503 trong E2E (cần làm nghẽn pool DB) – FE thêm test đơn vị.

### BUG-R2-027 – Văn bản báo giá tiếng Nga ra tiếng Anh (PO-S2-01)
- Mức: **P2** (sai AC Must US-083 AC2; PRD M13 cam kết mẫu VI/EN/RU; sale gửi tiếng Anh cho khách Nga mà không biết; không sai tiền) · Vai sửa: UXD (5 chuỗi RU), BE-B (sinh lại `generated/quote-copy.ts`; `--check` phải báo lỗi khi thiếu khóa) · Trạng thái: **Closed** (17/10 – kiểm lại Sprint 3, mục 4; trước đó: Open · Hạn: tuần 1 Sprint 3 (PO N-4))
- Bước: `qa.sal` lưu báo giá 401 2 đêm → `GET /quotes/{id}/text?locale=ru`.
- Thực tế: `200`, `text` = "OTTIMO Boutique Stay – Quote BG-00001 …" (mẫu tiếng Anh, không có chữ Kirin). `QUOTE_COPY_MISSING.ru` = `sale.quote_text`, `sale.quote_text_extra_guest`, `occ.*_short`.
- Mong đợi: văn bản tiếng Nga, không lẫn câu mẫu EN, có ngày hết hiệu lực.
- Bằng chứng: `e2e/api/s3-kickoff.api.spec.ts` "TC-L5-016 (ru)" – `test.fail` (tự báo khi đã sửa; chạy `E2E_BUG_R2_027_FIXED=1` để xem lỗi thật). Bản `en` (TC-L5-016 en) đạt.

### BUG-R2-028 – Tạo nhanh khách trong form Đặt phòng mới làm mất SĐT vừa nhập
- Mức: P3 (thao tác thừa, có thể lưu đè SĐT khác vào hồ sơ; không sai tiền) · Môi trường: stack `ottimo-qa-s3`, Chromium 1366×768, `qa.fd` · Vai sửa: FE · Trạng thái: **Closed** (17/10 – kiểm lại Sprint 3, mục 4; trước đó: Open)
- Bước: Sơ đồ phòng → Đặt phòng mới → ô "Khách đứng tên" gõ tên chưa có → "Tạo nhanh khách …" → nhập "Số điện thoại / Zalo" → "Lưu hồ sơ".
- Thực tế: toast "Đã lưu hồ sơ KH-…"; form đặt phòng hiện thêm ô "Số điện thoại / Zalo" trống, đỏ "Bắt buộc với kênh Trực tiếp và CTV"; khi nhập lại và Tạo đơn, FE gọi thêm `PATCH guests/{id}` ghi SĐT.
- Mong đợi: khách vừa tạo có SĐT → form không hỏi lại (EP02 3.2).
- Gốc (đọc code): `components/GuestPicker.tsx:205` `onSaved` chỉ chuyển `id, code, displayName, nationalityCode` – thiếu `phoneMasked`, nên `BookingDialog.tsx:951` coi khách chưa có SĐT.
- Bằng chứng: E2E `ui/rack-booking.smoke.spec.ts` `fillBooking` (nhánh "phone again if the form still asks"), log mạng: `PATCH guests/… 200` trước `POST reservations`.

### BUG-R2-029 – Sơ đồ phòng luôn báo "Đang kết nối lại…" khi build chưa có SSE
- Mức: P3 (thông tin sai trạng thái; lễ tân có thể tưởng mất mạng/dữ liệu cũ) · Môi trường: stack `ottimo-qa-s3` · Vai sửa: FE (không hiện "đang kết nối lại" khi `events` trả 404 – chỉ dùng polling), BE-A (SSE `streamEvents` theo kế hoạch Sprint 4) · Trạng thái: **Closed** (17/10 – kiểm lại Sprint 3, mục 4; trước đó: Open)
- Thực tế: `GET /v1/properties/{id}/events` → 404; vùng `status` của H08 hiện "Dữ liệu lúc 21:29. Đang kết nối lại…" (`fo.rack.stale`) suốt phiên, dù dữ liệu vẫn tải lại qua polling 30 giây.
- Mong đợi: chỉ báo "đang kết nối lại" khi luồng đã có rồi bị rớt; endpoint chưa có → im lặng (hoặc nhãn "Cập nhật mỗi 30 giây").

### BUG-R2-030 – Stack compose (dev + CI E2E): api và worker không khởi động – `EACCES: mkdir '/app/.data/blobs'`
- Mức: **P1** (chặn toàn bộ job CI `docker images build · E2E smoke` và mọi stack dev dựng mới; không có E2E nào chạy được trên code Sprint 3) · Môi trường: ảnh `ottimo-api` build từ `8ca2a47`/`a297273`, `infra/docker-compose.yml` của HEAD · Vai sửa: OPS (compose + Dockerfile), BE-C (mặc định đường dẫn blob) · Trạng thái: **Fixed** – bản sửa của OPS đã vào commit `229db99` (17/10 00:35); QA kiểm lại trên ảnh build từ `229db99` (git archive): stack `healthy`, thư mục blob `drwx------ node node`, ghi/xóa ảnh giấy tờ (J16) được, E2E chạy đủ 2 lượt. Chuyển **Closed** khi job CI E2E xanh – CI 38940900970 trên `229db99` dừng ở bước Lint vì BUG-R2-050 nên job E2E chưa chạy
- Bước tái hiện: `docker compose --env-file .env -f infra/docker-compose.yml up --build --wait` trên HEAD `a297273`.
- Thực tế: `api-1`, `worker-1` khởi động lại liên tục, log `Error: EACCES: permission denied, mkdir '/app/.data/blobs'` (10 dòng/30 giây), `dependency failed to start: container …-api-1 is unhealthy`. CI run 38929255451 (main, `a297273`): bước "Start compose stack" đỏ – E2E không chạy.
- Gốc: `files/internal/blob-store.ts:117` mặc định `BLOBSTORE_LOCAL_PATH = ./.data/blobs` (tương đối `/app`, thuộc root trong ảnh, tiến trình chạy `USER node`); compose không đặt biến, không mount volume; worker (J16 xóa blob) cần cùng thư mục.
- Mong đợi: api/worker khởi động; blob mã hóa nằm trên volume riêng, thư mục `node:node 0700`, chỉ api + worker mount (SEC C2, SR-FILE-04).
- Kiểm lại (17/10, QA): ảnh build từ HEAD `a297273` + `product/infra`, `.dockerignore` của cây làm việc (OPS: `BLOBSTORE_LOCAL_PATH=/var/lib/ottimo/blobs`, volume `blobdata`, Dockerfile tạo thư mục `node:node 0700`, dịch vụ `db-roles`): stack `ottimo-qa-s3` lên `healthy`, thư mục `drwx------ node node`, E2E chạy đủ (mục 2 báo cáo S3). Chuyển **Closed** khi bản sửa được commit và CI job E2E xanh.
- Ghi chú: trong lúc chờ, các stack QA dùng file override đặt `BLOBSTORE_LOCAL_PATH=/data/blobs` + bind mount chung cho api/worker.

### BUG-R2-031 – `Reservation` không trả các trường 0.3.6 (`registrationId`, `registrationStatus`, `registrationDeadlineAt`, `houseRulesSentAt`, `cardsIssued`, `balanceDueVnd`) → H13 bước Giấy tờ/Kiểm tra treo "Đang tải…"
- Mức: **P1** (màn Nhận phòng – luồng chính A1 – không hiện/nhập/kiểm được giấy tờ C3 ở bước 1–2; lễ tân phải sang H14 "Giấy tờ & khai báo" rồi quay lại; client không có cách đi từ đơn sang khai báo theo hợp đồng) · Môi trường: stack `ottimo-qa-s3` (`8ca2a47`, và `a297273` + infra), Chromium 1366×768, `qa.fd` trên máy được cấp · Vai sửa: BE-A (`reservations/internal/reservation-dto.ts`) · Trạng thái: **Open**
- Bước tái hiện: (1) tạo đơn đến hôm nay, thu đủ, nhập giấy tờ người đứng tên (API); (2) `GET /v1/properties/{p}/reservations/{id}` (đơn `confirmed`), rồi `checkIn` và `GET` lại (đơn `in_house`); (3) mở `/reservations/{id}/check-in` trên admin-web.
- Thực tế: (2) khóa trả về chỉ có `id, code, status, …, depositPaidVnd, noShowAvailableFrom, nightlyRates, totalRoomVnd, conflictState, capacityConflict, progress, (actualCheckinAt, doorAccessHandedOverAt), allowedActions, version` – **không** có `registrationId`, `registrationStatus`, `registrationDeadlineAt`, `houseRulesSentAt`, `cardsIssued`, `balanceDueVnd` dù đã có giá trị trong DB (`house_rules_sent_at`, `cards_issued` ghi khi B9). (3) khung bên phải bước "Giấy tờ" và "Kiểm tra" là skeleton + `status "Đang tải…"` mãi (`CheckInPage.tsx:100` `if (!deviceTrusted || !r?.registrationId) return;`); điều kiện "Có giấy tờ người đứng tên" vẫn đổi đúng sau khi nhập ở H14.
- Mong đợi: OpenAPI 0.3.6 `Reservation` (schema dòng ~8405–8415): `registrationId`, `registrationStatus`, `registrationDeadlineAt`, `houseRulesSentAt`, `cardsIssued`, `balanceDueVnd` có giá trị khi tồn tại; H13 bước 1 hiện giấy tờ (4 số cuối) và cho nhập.
- Bằng chứng: `ui/stay.h13-h17.spec.ts` "TC-L3-030 (E)" (`test.fail`), phần cuối "TC-L3-001 (E)" (`houseRulesSentAt`/`cardsIssued` – `test.fail`); harness `support/s3.ts registrationOf()` phải tìm khai báo qua `listRegistrations` (lật trang).

### BUG-R2-032 – H13 bước 3 "Khai báo": nút sang bước 4 ghi "Nhận phòng căn {room}" (chưa thay tham số, sai nghĩa)
- Mức: P3 (nhãn sai: nút chỉ chuyển sang bước "Giao mã & hoàn tất", không nhận phòng; hiện nguyên `{room}`) · Môi trường: như BUG-R2-031 · Vai sửa: FE · Trạng thái: **Open**
- Bước: H13 → "Tiếp tục: Kiểm tra" → "Tiếp tục: Khai báo" → xem nút chính ở chân màn.
- Thực tế: nút `Nhận phòng căn {room}`. Gốc: `CheckInPage.tsx:653` `nextKey = ['ci.go_verify','ci.go_register','ci.submit'][step]` rồi `t(nextKey!)` không truyền `{room}`.
- Mong đợi: khóa riêng kiểu "Tiếp tục: Giao mã & hoàn tất" (UXD) – nút `ci.submit` chỉ ở bước 4.
- Bằng chứng: `ui/stay.h13-h17.spec.ts` TC-L3-001 (E) annotation `observed` "nút bước 3".

### BUG-R2-033 – Nhập giấy tờ người thứ 2 không gắn người vào đơn theo BR-951 (không khớp hồ sơ, không tạo người "Chưa rõ")
- Mức: P2 (sai AC US-043 AC3; danh sách người trong đơn/khai báo thiếu người; cách vòng: `addPartyMember` trước rồi gửi `partyMemberId`) · Môi trường: stack `ottimo-qa-s3a`, ảnh `8ca2a47` · Vai sửa: BE-C (registration) + BE-A (party) + BE-B (guests) · Trạng thái: **Open** – **PO quyết 17/10 ca (b): phương án A** (decision-log 17/10, US-043 AC3 làm rõ): không khớp hồ sơ → tạo hồ sơ khách **nguồn "từ giấy tờ"** không cần SĐT/email (bỏ `CONTACT_REQUIRED` chỉ cho đường này; form CRM/người đứng tên giữ nguyên), không đồng ý marketing, không vào danh sách tiếp thị, gắn vào đơn `role=companion`, quan hệ `unknown`; vượt số khách của đơn → vẫn gắn + cảnh báo (không tự ghi phụ thu). **Chờ SEC ký** phần dữ liệu cá nhân (tối thiểu trường, hạn lưu hồ sơ không liên hệ, cách lưu khóa số giấy tờ để khớp) trước khi merge
- Bước: `qa.fd`, đơn confirmed 2 người lớn (ngày xa); `addGuestDocument` người 2 (`isMain: false`, không `partyMemberId`): (a) số CCCD trùng giấy tờ của khách G ở lần ở trước; (b) số không trùng ai.
- Thực tế: 201, giấy tờ không có `partyMemberId`; `listParty` không thêm người, không khớp G, không tạo người quan hệ "Chưa rõ".
- Mong đợi: EP06 2.2 (`partyMemberId` bỏ trống → server khớp theo BR-951: số giấy tờ → SĐT → email → tên + ngày sinh; không khớp → người mới quan hệ `unknown`), US-043 AC3.
- Gốc: `registration.service.ts:413–489` lưu nguyên `input.partyMemberId` (dòng 474), không có bước khớp/tạo người.
- Bằng chứng: `api/checkin.s3.api.spec.ts` TC-L3-032 (`test.fail`).

### BUG-R2-034 – "Cần chú ý" không có mục khai báo / thị thực (`registration_due`, `registration_overdue`, `visa_expiring`)
- Mức: P2 (sai AC US-025 AC4, US-044 AC4, US-050 AC2 – lễ tân không được nhắc hồ sơ sắp/quá hạn khai báo và thị thực sắp hết; nhãn hạn ở H14 vẫn đúng) · Vai sửa: BE-C (nguồn dữ liệu) + BE-A (`registerAttentionSource`) · Trạng thái: **Open** – **PO quyết 17/10: Sprint 3, không Deferred.** BE-C thêm 3 nguồn `registration_due`, `registration_overdue`, `visa_expiring` (tính khi đọc, dùng lại `deadlineLabel`/`isOverdue` và quy tắc BR-602/603/605) qua `registerAttentionSource` của BE-A; `visa_expiring` chỉ trả mã đơn + căn, không ngày hết hạn (US-012 AC3, SEC SR-RET-06). 3 ca TC-L3-004/037/054 giữ `test.fail` tới khi sửa. Phần hiển thị trên Tổng quan/khung "Cần chú ý" vẫn Sprint 4 (EP01) – decision-log 17/10
- Bước: ⏱ D 10:00 `qa.fd` nhận phòng đơn khách NN khai báo `review` → `GET /attention`; TC-L3-037: thị thực hết trước ngày đi.
- Thực tế: 200 `data: []` (không có 3 loại trên; enum `AttentionItem.kind` đã có).
- Mong đợi: EP06 mục 1 ("quá hạn → Cần chú ý", BR-907) và bảng 3.1.
- Gốc: `frontdesk/internal/attention-sources.ts:145` không có nguồn khai báo; `outputs/BE/s3-be-c.md` mục 6 ghi "làm đợt sau".
- Bằng chứng: `clock/checkin.s3.clock.spec.ts` TC-L3-004, TC-L3-037, TC-L3-054 (`test.fail`).

### BUG-R2-035 – Job J5 `registration.deadline` chưa đăng ký: không nhắc hạn, không thông báo tổng hợp 22:00/07:00 (BR-611)
- Mức: **P1** (test-strategy mục 8: "job theo giờ không chạy (… không nhắc khai báo)" = P1; sai AC Must US-042 AC2; hồ sơ khai báo có thể trễ hạn pháp lý mà không ai được nhắc – QA chính nâng từ đề xuất P2; nhãn `deadlineLabel`/`isOverdue` tính lúc đọc vẫn đúng ở mọi mốc) · Vai sửa: BE-C (+ BE-A worker) · Trạng thái: **Open**
- Bước: `POST /__test__/jobs/registration.deadline/run` → 404; log worker chỉ có `hold.expire`, `log.partitions`, `ooo.activate`, `payment.expire`, `retention.purge`.
- Mong đợi: architecture 9.1 J5 `registration.deadline` ở R2; BR-611 (thông báo cho FD + MGR lúc 22:00 và 07:00, không gửi trùng – `job_run`).
- Gốc: `worker.ts:20–38`, `registration/public/worker-jobs.ts` chỉ đăng ký J16.
- Bằng chứng: TC-L3-044, TC-L3-046, TC-L3-048 (`test.fail`).

### BUG-R2-036 – J16 chặn lượt chạy 55 phút → ảnh của khách không đồng ý có thể còn quá hạn trên 24 giờ sau `confirmed` (khi lệnh xóa ngay bị lỗi)
- Mức: **P2** (QA quyết – TC ghi "ảnh còn sau mốc = P0" nhưng chỉ xảy ra khi bước xóa ngay K6 đã lỗi, trễ tối đa ~55 phút; vẫn là vi phạm hạn trên SEC M3 / BR-609-01) · Vai sửa: BE-C · Trạng thái: **Open**
- Bước: khai báo confirmed D 15:20 (BR-609-01); giả lập "xóa ngay bị lỗi" (đổi `consent_record` → refused trên DB stack dùng một lần); ⏱ D+1 15:19 ▶ J16 → `done`, `t01Images: 0` (đúng); ⏱ D+1 15:20 ▶ J16 → `{"status":"done","stats":{"skipped":true}}`.
- Thực tế: `getDocumentImage` vẫn 200 sau mốc confirmed + 24 giờ.
- Mong đợi: BR-609-01 `purgeBackstopBy` = confirmed + 24 giờ; EP06 6.1 `id_image_purge_max_hours`.
- Gốc: `retention.service.ts:25, 46–51` (chặn 55 phút) cùng `cutoff = now − maxHours` (dòng 72). Đề xuất: `cutoff = now − (maxHours − 1 giờ)` hoặc bỏ chặn 55 phút cho T01.
- Bằng chứng: TC-L3-039 (`test.fail`).

### BUG-R2-037 – Gia hạn vượt hạn thị thực không bị chặn mềm (thiếu 422 `VISA_EXPIRES_BEFORE_DEPARTURE`)
- Mức: **P1** (luồng chính – gia hạn – sai quy tắc nghiệp vụ, không trực tiếp sai tiền: khách NN có thể ở quá hạn thị thực mà lễ tân không bị chặn mềm/nhắc; rủi ro pháp lý cho cơ sở – QA chính nâng từ đề xuất P2) · Vai sửa: BE-A · Trạng thái: **Open**
- Bước: ⏱ D 14:30 khách NN thị thực đến D+3, đơn D→D+2 đang ở, khai báo `scanned`; `extend {nights: 2, visaWarningAckReason}` → 200 (đúng); rồi `extend {nights: 1}` không lý do (ngày đi mới D+5 > hạn thị thực).
- Thực tế: 200, gia hạn được ghi. Mong đợi: 422 `VISA_EXPIRES_BEFORE_DEPARTURE` (OpenAPI 0.3.6, mô tả `visaWarningAckReason`; EP03-05 E04-01).
- Gốc: `stay.service.ts:244` đọc `visaWarningAckReason` nhưng không kiểm hạn thị thực; mã lỗi không có trong `src`.
- Bằng chứng: TC-L3-054 (`test.fail`); phần ngày đi khai báo = hạn thị thực (BR-605-02) đạt.

### BUG-R2-038 – Điều kiện "Đã thu đủ" không cộng phụ thu nhận sớm / đêm B9a sắp ghi
- Mức: P2 (sai EP03-05 1.3; nhận phòng xong còn nợ phụ thu, chỉ chặn khi trả phòng) · Vai sửa: BE-A · Trạng thái: **Open**
- Bước: ⏱ D 11:00, đơn Trực tiếp 700.000 đã thu đủ tiền phòng; `checkIn {checkinTime: '11:00', applyEarlySurcharge: true, expectedSurchargeVnd: 210000}` chưa thu 210.000.
- Thực tế: 200 `in_house`, folio còn phải thu 210.000. Mong đợi: 409 `CHECKIN_CONDITIONS_NOT_MET`, `unmet: [balance_paid]`.
- Gốc: `checkin.service.ts:178, 193–195` chỉ dùng số dư folio hiện tại.
- Bằng chứng: TC-L3-011 (`test.fail`).

### BUG-R2-039 – Nhận sớm có phụ thu mà `applyEarlySurcharge=false` vẫn nhận phòng, phụ thu bị bỏ qua im lặng
- Mức: **P1** (kiểm soát tiền bị vượt: lễ tân miễn phụ thu nhận sớm BR-411 không qua FOC có duyệt BR-432/433 – thất thu; số đã ghi không sai nên không xếp P0; sai OpenAPI 0.3.6 / DOM S3-12 / US-026 AC4) · Vai sửa: BE-A · Trạng thái: **Closed** (17/10) – kiểm lại trên ảnh `229db99`: TC-L3-014 `checkIn {checkinTime, applyEarlySurcharge: false}` có phụ thu → 422 `applyEarlySurcharge: SURCHARGE_DECISION_REQUIRED`, không nhận phòng; bỏ `test.fail`
- Bước: ⏱ D 11:00, đơn 700.000; `checkIn {checkinTime: '11:00', applyEarlySurcharge: false}`.
- Thực tế: 200, không dòng phụ thu. Mong đợi: 422 `SURCHARGE_DECISION_REQUIRED` (hoặc xin FOC).
- Gốc: `checkin.service.ts:340` chỉ kiểm khi `applyEarly` = true.
- Bằng chứng: TC-L3-014 (`test.fail`).

### BUG-R2-040 – Sơ đồ phòng (`getRack.roomStatus`) không đọc trạng thái buồng đã lưu
- Mức: P3 (rack hiện OC/VC trong khi buồng thực tế OD/VD sau nhận/trả phòng – lệch với H13 `previewCheckIn`; dọn buồng là Sprint 4) · Vai sửa: BE-A · Trạng thái: **Open**
- Gốc: `rack.service.ts:248` vẫn suy trạng thái theo dữ liệu hôm nay, không đọc bảng `room_status` (SM-03, Sprint 3).
- Bằng chứng: quan sát của QA ở TC-L3-002/005 (đọc `room_status` qua DB stack dùng một lần) so với `getRack`.

### BUG-R2-041 – Hóa đơn công ty không gắn vào hồ sơ khách
- Mức: P2 (sai AC US-039 AC2 – lần sau phải nhập lại; thông tin vẫn trên folio) · Môi trường: stack `ottimo-qa-s3b`, ảnh `8ca2a47` · Vai sửa: BE-B · Trạng thái: **Open**
- Bước: `qa.fd` `PUT /folios/{id}/invoice-request` `{buyerType: company, companyName, taxCode: '0312345678', email}` → `GET /guests/{booker}`.
- Thực tế: 200; `Folio.invoiceRequest` đủ, `Guest` không có `companyName`/`taxCode`. Mong đợi: EP03-05 5.4 "gắn folio + hồ sơ khách (D16)".
- Gốc: `folio/internal/bill.service.ts:208–253` `setInvoice` chỉ ghi bảng `invoice_request`. Bằng chứng: `api/stay-checkout.s3.api.spec.ts` TC-L4-059 (`test.fail`).

### BUG-R2-042 – Sale không ghi được cọc giữ chỗ của chính mình (`recordPayment` trần = 0)
- Mức: P2 (sai AC US-119 AC4 / A33 `own_deposit_only`; cách vòng `confirmDeposit`) · Vai sửa: BE-B (ARC chốt trần) · Trạng thái: **Closed** (17/10) – kiểm lại trên ảnh `229db99`: TC-L4-063 `qa.sal` ghi cọc 500.000 cho giữ chỗ của mình → 201 `reconciliation=pending`; G2 → 404, CTV → 403 vẫn đạt; bỏ `test.fail` có điều kiện
- Bước: `qa.sal` `saveQuote` + `createHoldFromQuote` (G1) → `POST /folios/{G1}/payments` `{type: deposit, method: bank_transfer, amountVnd: 500000}`.
- Thực tế: 422 `amountVnd: AMOUNT_TOO_HIGH`, `max: 0`. Mong đợi: ghi được cọc ≤ cọc còn thiếu (BR-305), như `createVietQr` trên cùng đơn.
- Gốc: `payments/public/payment.service.ts:283–290` lấy trần = `balanceDueVnd` (folio giữ chỗ = 0), khác `payments.service.ts:665–674`. Bằng chứng: TC-L4-063 (`test.fail`); G2 → 404, khoản không phải cọc → 403, CTV → 403 đều đạt.

### BUG-R2-043 – Số thẻ ở mã chuẩn chi bị chặn nhưng sai mã lỗi
- Mức: P3 (số thẻ không được lưu – R-PAY-01 đạt; chỉ thông báo sai) · Vai sửa: BE-B · Trạng thái: **Open**
- Bước: `recordPayment` `{method: card_pos, posAuthCode: '4111111111111111'}` → 422 `posAuthCode: TOO_LONG`. Mong đợi: `CARD_NUMBER_DETECTED` (EP03-05 2.2, V-09) để giao diện báo "không nhập số thẻ".
- Gốc: `payments/internal/payments.controller.ts:48` zod `max(12)` chạy trước kiểm V-09. Bằng chứng: TC-L4-066 (`test.fail`).

### BUG-R2-044 – Đơn "OTA thu hộ": tiền phòng bị tính vào "Còn phải thu"
- Mức: **P0** (sai tiền – test-strategy mục 8: "Lỗi tiền … mặc định P0": "Còn phải thu"/bill của mọi đơn `ota_prepaid` cộng cả tiền phòng OTA đã thu → lễ tân có thể thu khách lần 2; trả phòng bị `409 BALANCE_DUE`; cách vòng ghi tay `recordPayment method=ota_collect` dễ sót) · Môi trường: `ottimo-qa-s3b` (`8ca2a47`), kiểm lại trên `ottimo-qa-s3` (`a297273` + infra) · Vai sửa: BE-B (+ cổng BE-A) · Trạng thái: **Closed** (17/10) – kiểm lại trên ảnh `229db99` (BE-B `syncOtaCollect`, DOM BE-13): TC-L4-061 `paidViaOtaVnd` = tiền phòng, `balanceDueVnd` = giặt ủi 75.000 (BR-507-01); TC-L4-046 Airbnb + minibar → "Còn phải thu" 50.000; TC-L4-047 Booking + trả muộn → chỉ còn phụ thu 238.000; 2 lượt chạy đủ đạt. Bỏ `test.fail` có điều kiện (hồi quy sẽ báo đỏ). P0 đóng trong round – **không lập ESC**
- Bước: đơn Booking `ota_prepaid` 3 × 820.000 → `getFolio`: không có khoản `ota_collect`, `paidViaOtaVnd` 0, `balanceDueVnd` 2.460.000; thêm giặt ủi 75.000 → 2.535.000 (mong đợi 75.000); Airbnb `in_house` + minibar 50.000 → summary 870.000 (mong đợi 50.000); Booking có phụ thu trả muộn 238.000 → 998.000 (mong đợi 238.000).
- Mong đợi: BR-307 (oracle BR-307-01: `balanceDueVnd` 0, nhãn "Đã thu qua OTA"), US-119 AC2, US-036 AC3.
- Gốc: build không sinh khoản thu hệ thống `ota_collect`; `folio.service.ts:228` chỉ cộng "đã thu qua OTA" từ khoản đó. Bằng chứng: TC-L4-061 (api), TC-L4-046, TC-L4-047 (clock) – `test.fail`.

### BUG-R2-045 – "Tiết kiệm phí kênh" khi gia hạn đơn OTA chỉ tính 1 đêm
- Mức: P2 (con số tiền hiển thị để lễ tân tư vấn khách sai; không ghi folio) · Vai sửa: BE-A (+ARC: hợp đồng 1 số, chưa nói theo số đêm) · Trạng thái: **Open**
- Bước: đơn Airbnb căn 301 `in_house` → `GET /extension-options`. Thực tế: `channelFeeSavingsVnd` = 148.000 (15,5 % × 1 đêm), trong khi `repricing[]` 2 đêm = 1.916.000. Mong đợi: BR-422-01 (2 đêm 2.084.000 → 323.000; với 301 là 297.000).
- Gốc: `frontdesk/internal/stay.service.ts:215`. Bằng chứng: TC-L4-003 (`test.fail`); đơn con kênh Trực tiếp 1.042.000, chung folio, đơn OTA gốc không đổi – đạt.

### BUG-R2-046 – Quản lý không duyệt/tự áp được FOC phụ thu trong hạn mức "≤ 1 đêm" (FOC dòng phát sinh thiếu `limitBasisVnd`)
- Mức: **P1** (phân quyền sai ở hành động duyệt tiền + luồng chính "FOC có duyệt" của A1: mọi FOC phụ thu > 300.000 hoặc do quản lý gửi dồn lên chủ đầu tư; cách vòng: OWN duyệt) · Môi trường: `ottimo-qa-s3b`, `ottimo-qa-s3c` (`8ca2a47`) · Vai sửa: BE-A (approvals) + BE-B (folio) · Trạng thái: **Open** (gộp 2 phát hiện của QA phụ B và C)
- Bước: ngày ảo D, đơn Trực tiếp 700.000 thu đủ; nhận phòng 08:00 phụ thu 350.000; `setLateCheckout 17:00` 350.000. (1) `qa.fd` `requestFoc` 301.000 trên dòng `late_checkout` → 201 `requiredRole: owner`; `qa.fdl` duyệt → 403 `APPROVAL_LIMIT_EXCEEDED {approver: owner}`. (2) `qa.mgr` `requestFoc` 50.000/210.000 (có xác thực lại) → `pending`, `requiredRole: front_desk_lead`; `qa.mgr` tự duyệt → 403, yêu cầu `escalated` lên owner. (3) FOC 400.000 trên dòng `service_fee` 500.000 → `qa.mgr` duyệt → 403 `{approver: owner}`.
- Mong đợi: BR-433 "Quản lý ≤ giá 1 đêm/lần" (`foc_limits.manager = one_night_rate`), oracle BR-433-02 `escalateTo: manager`; SM-10 A2(a) MGR/OWN tự áp trong hạn mức.
- Gốc: `folio/internal/foc.service.ts:140` `limitBasisVnd: line.category === 'room' ? line.unit_price_vnd : null` → `approvals/internal/limits.ts:73, 78–79` coi như vượt → bỏ cấp manager; `frontdesk/internal/stay-support.ts:417–428` (FOC từ trả muộn/nhận sớm) không truyền basis. Hướng sửa: basis = giá đêm liên quan (đêm cuối – trả muộn; đêm đầu – nhận sớm; đêm của ngày dịch vụ – dòng khác).
- Bằng chứng: `clock/approvals-foc.s3.clock.spec.ts` TC-NT-029 (b), TC-NT-030 (b), TC-NT-036 (a); `clock/stay-checkout.s3.clock.spec.ts` TC-L4-056 – `test.fail`.

### BUG-R2-047 – Gia hạn không chuyển buồng sang OD
- Mức: P2 (trạng thái buồng sai → buồng phòng không biết dọn phòng khách đang ở; dọn buồng Sprint 4) · Vai sửa: BE-A · Trạng thái: **Open**
- Bước: đơn khách NN căn 203 `in_house` (OC) → `extendStay` 1 đêm → đọc `room_status` (psql, stack dùng một lần). Thực tế: vẫn OC. Mong đợi: SM-01 B13 "buồng → OD", BR-802.
- Gốc: `frontdesk/internal/stay.service.ts` `extend()` không gọi `roomStatus.set` (chỉ B9/B14/B17/B18 có). Bằng chứng: TC-L4-004 (`test.fail`); ngày đi mới, khai báo `needs_update`, 1 lệnh outbox – đạt.

### BUG-R2-048 – Nhật ký truy cập C3 (`listC3AccessLog`) bỏ qua bộ lọc ngày `from`/`to` của hợp đồng
- Mức: P2 (OWN/MGR rà truy cập giấy tờ theo ngày (S28) nhận toàn bộ nhật ký; dùng `dateFrom`/`dateTo` thì lọc được) · Vai sửa: BE-C (hoặc ARC nếu đổi hợp đồng) · Trạng thái: **Open**
- Bước: `qa.owner` `GET /v1/properties/{p}/c3-access-log?from=2000-01-01&to=2000-01-02&limit=5` → 200 với 5 dòng năm 2030; `?dateFrom=2000-01-01&dateTo=2000-01-02` → 0 dòng. Mong đợi: OpenAPI 0.3.6 tham số `from`/`to`.
- Gốc: `registration/internal/registration.controller.ts:541–542`. Bằng chứng: QA phụ C gọi tay khi viết TC-RB-022 (chưa có ca tự động – thêm ở đợt sau).

### BUG-R2-049 – Harness E2E Sprint 3 của QA lệch thời điểm/ngữ cảnh (đỏ giả)
- Mức: P2 · Vai sửa: QA · Trạng thái: **Closed** (17/10 – 2 lượt chạy đủ trên stack mới, 0 trượt, 0 flaky)
- Nội dung và cách sửa: (1) `stackToday()` trả ngày lịch – từ 00:00 tới 05:59 lệch ngày nghiệp vụ (BR-010) → TC-L2-014/053, TC-L5-005/023, H13 đỏ sau nửa đêm → tính theo mốc 06:00; (2) `platform.api.spec.ts` ghi tham số "tương lai" 2028–2030 rò sang ngày ảo của project clock (`checkin_time` 14:30 làm đỏ TC-L3-010) → dời sang 2090–2092; (3) `isAvailable` dùng chung cookie của ca → thăm dò "ẩn danh" mang phiên → 404 → bỏ qua sai (TC-L4-062) → context riêng; (4) ảnh mẫu PNG hỏng → 422 `FILE_TYPE`; (5) TC-L2-053 (b) còn kỳ vọng `balanceDueVnd` âm (0.3.5) → 0 + `creditVnd` 350.000 (0.3.6 A-34); (6) TC-L5-016 (en) so ngày hết hạn bằng regex lọt "20" của "2026" → so dd/mm/yyyy của (expiresAt − 1 ms); (7) TC-L2-055 chọn ngày dời ngẫu nhiên có lúc ngoài `reschedule_window_months` tính từ ngày đến cũ → chọn trong cửa sổ.

### BUG-R2-050 – Thiếu tệp `apps/guest-web/build/used-keys.ts` trong git → CI đỏ, ảnh `ottimo-web` không build được
- Mức: **P1** (chặn toàn bộ CI: job "format · lint · audit · test · build" đỏ ở Lint, các job `docker images build · E2E smoke`, `publish images`, `deploy staging` bị bỏ; không build được ảnh web từ một checkout sạch – cùng loại BUG-R2-006) · Môi trường: CI run 38940900970 (main, `229db99`, 17/10 00:35); máy QA: `git archive HEAD product` → `docker build -f infra/docker/Dockerfile.web` · Vai sửa: FE (guest-web) + OPS (`.gitignore`) · Trạng thái: **Open**
- Bước tái hiện: (1) checkout sạch `229db99` (hoặc `git archive HEAD product | tar -x`); (2) `pnpm --filter @ottimo/guest-web typecheck` hoặc `docker build -f infra/docker/Dockerfile.web .`.
- Thực tế: CI: `src/__tests__/guard.test.ts(5,33): error TS2307: Cannot find module '../../build/used-keys'` và `vite.config.ts(7,44): error TS2307: Cannot find module './build/used-keys'`; docker: `vite.config.ts:7:43: ERROR: Could not resolve "./build/used-keys"` → `turbo run build` exit 1. Trên máy dev tệp có thật (`apps/guest-web/build/used-keys.ts`, 1.972 byte, 16/10 23:41) nhưng `git check-ignore -v` → `.gitignore:16:build/` nên không được commit.
- Mong đợi: checkout sạch build/typecheck/test xanh; tệp nguồn của build nằm trong git.
- Gốc: `apps/guest-web/vite.config.ts:7` `import { collectUsedKeys, isShipped } from './build/used-keys'`; thư mục tên `build/` trùng mẫu bỏ qua của `.gitignore` gốc. Hướng sửa: đổi thư mục (ví dụ `apps/guest-web/tools/`) hoặc thêm ngoại lệ `!apps/guest-web/build/` và commit tệp.
- Bằng chứng: `gh run view 38940900970 --log-failed`; log build ảnh của QA (`docker build` web exit 1). QA build tiếp bằng cách chép tệp từ cây làm việc vào nguồn build (ghi trong báo cáo S3 mục 2).

### BUG-R2-051 – SR-RL-09 (600 request/phút/người): bộ đếm riêng trong `AuthGuard` không xóa được, không cấu hình được, chạy theo MutableClock
- Mức: P2 (người dùng thật không chạm 600/phút; nhưng (a) mọi stack có MutableClock – dev, CI, staging dùng tua giờ – sau khi tua đồng hồ về hiện tại thì người dùng đã chạm ngưỡng ở giờ ảo bị khóa toàn bộ API ≈ 7,8 năm, chỉ hết khi khởi động lại api; (b) E2E dùng chung tài khoản `qa.*` giữa các worker song song chạm 429 ở api/rbac/UI – có cách vòng: harness chờ `Retry-After`, chạy lại) · Môi trường: ảnh `229db99`, stack `ottimo-qa-s3` · Vai sửa: BE-B (guard chung; BE-A phần SSE) + OPS (CI) · Trạng thái: **Open**
- Bước tái hiện: (1) chạy project `clock` (tua giờ ảo tới năm 2029+, `qa.fd`/`qa.owner` gọi > 600 lần trong một phút ảo); (2) `resetClock` (về giờ thật); (3) `GET /v1/me` bằng phiên `qa.fd`; (4) `POST /__test__/rate-limits/reset` rồi gọi lại.
- Thực tế: (3) `429 RATE_LIMITED`, `Retry-After: 247743660` (cả `qa.owner`); (4) vẫn 429 – reset không chạm bộ đếm này. Chạy project `api` ngay sau `clock`: 61 ca đỏ vì 429. Trong lượt chạy như CI (song song api + rbac + desk-chromium): 15 lần harness phải chờ 42–56 giây, 2–4 ca UI flaky (trình duyệt `qa.fd` nhận "Bạn đã thử quá nhiều lần. Chờ 1 phút rồi thử lại.").
- Mong đợi: SR-RL-09 vẫn đúng 600/phút/người, nhưng (a) cửa sổ tính theo giờ thật của tiến trình hoặc tự mở lại khi `now < bắt đầu cửa sổ` (đồng hồ lùi); (b) dùng chung `RATE_LIMITER` của module identity để `/__test__/rate-limits/reset` (chỉ có ở ảnh test) xóa được như mô tả của route ("in-memory windows … cleared for the whole process"); (c) tùy chọn `staffRequestsPerMinute` ("tests may raise it") nối được từ cấu hình test/dev.
- Gốc: `shared/http/auth.guard.ts:174–200` `this.limiterRef ??= new RateLimiter(this.clock)` (thể hiện riêng, đồng hồ CLOCK), `main.ts:53–56` không truyền `staffRequestsPerMinute`; `test-support.module.ts:241` chỉ `resetAll()` thể hiện `RATE_LIMITER`.
- Bằng chứng: `curl /v1/me` (phiên `qa.fd`) sau project clock → 429 `retry-after: 247743660`; log harness `[e2e] SR-RL-09 429 … → chờ N giây (BUG-R2-051)` trong báo cáo JSON. Cách vòng của QA: `support/api.ts call()` chờ `Retry-After` ≤ 65 giây (tối đa 2 lần) rồi gửi lại cùng request; thứ tự project giữ `clock` gần cuối.

### BUG-R2-052 – Khách đến sau nửa đêm của ngày đến bị coi là nhận sớm trước 06:00 → không nhận phòng được
- Mức: **P1** (luồng chính nhận phòng A1 bị chặn cho khách đến khuya – xe/chuyến bay đêm tới Đà Lạt thường gặp – suốt 00:00–05:59; cách vòng khó đoán: gõ giờ nhận ≥ 14:00 trong ngày nghiệp vụ kèm ghi chú; thêm đêm trước (B9a) bị 409 nên không sai tiền) · Môi trường: ảnh `229db99`; clock (giờ ảo 01:30 ngày D+1) và giao diện H13 Chromium lúc 01:15 giờ thật 17/10 · Vai sửa: BE-A (+ FE: thông báo lỗi trường `addPriorNight`) · Trạng thái: **Open**
- Bước tái hiện: (1) đơn Trực tiếp đến D đã thu đủ, có giấy tờ; (2) đồng hồ 01:30 ngày D+1 (ngày nghiệp vụ vẫn D – BR-010); (3) `GET previewCheckIn` → `earlyCheckinSurcharge.amountVnd = 0`; (4) `POST checkIn {cardsIssued: 1, houseRulesSent: true}` (không gõ giờ – như H13 khi không bật "Khách nhận sớm").
- Thực tế: (4) 422 `VALIDATION_FAILED` `errors: [{field: addPriorNight, code: REQUIRED}]`; H13 bước 4 hiện alert "Bắt buộc", không có hướng dẫn, không nhận phòng được (TC-L3-001 (E) chạy lúc 01:15). `a297273` nhận phòng được (TC-L3-008 đạt) – lỗi mới của bản sửa B9a.
- Mong đợi: B9 thường, không phụ thu, `actualCheckinAt` = 01:30 D+1, hạn khai báo theo BR-602-02 / BR-603-04 (US-025 AC6; OpenAPI checkIn: B9a chỉ khi ngày nghiệp vụ = ngày đến − 1).
- Gốc: `frontdesk/internal/checkin.service.ts:143–145` khi không gõ giờ dùng giờ server (01:30) → `earlyCheckinSurcharge` coi 01:30 là trước mốc 06:00 (`addsPreviousNight=true`) mà không xét ngày lịch đã sau ngày đến; dòng 386–387 đòi `addPriorNight`. Preview (dòng 145) dùng giờ chuẩn 14:00 nên báo 0 – hai đường lệch nhau.
- Bằng chứng: `clock/checkin.s3.clock.spec.ts` TC-L3-008 (a) (`test.fail` ở cuối ca, phần (b) B9a vẫn kiểm); `ui/stay.h13-h17.spec.ts` TC-L3-001 (E) (`test.fail` khi giờ stack < 06:00).

## 3. Kiểm lại bản sửa (QA, 16/10/2026 – Đợt 0)

Cách kiểm: đọc `product/docs/business-rules.md` **v0.3.1** (cột ví dụ + mục 13), cập nhật oracle/seed theo `rounds/round-02/outputs/DOM/w1-oracle-review.md`, chạy `node product/tests/tools/validate-fixtures.mjs` → **0 lỗi** (226 dòng oracle, 157 dòng tự tính lại). Chuyển **Fixed**; chuyển **Closed** khi test unit của BE (sprint 1) đọc oracle mới và xanh – tầng code chưa có nên chưa kiểm được ở tầng A.

| ID | Bằng chứng đã sửa trong BR v0.3 | Oracle/seed QA đã đổi | Trạng thái |
|---|---|---|---|
| BUG-R2-001 | Mục 13: `late_grace_until` = **12:30** (INV-007), `min_stay[]` **bật** 2 đêm cho ngày đến T6/T7/ngày đặc biệt (INV-004), thêm `min_stay_orphan_night_exception`; BR-412 ví dụ 12:20/12:30 → 0, 12:31 → 210.000 | BR-412-01…09 params 12:30 + điều kiện không có khách đến; BR-412-04 đổi `sameDayArrival` = true (giữ ca bậc 30%); thêm BR-412-10, -11; BR-113-01 bỏ `escNote`, thêm BR-113-02, -03; seed `late_grace_until`, `min_stay` | Fixed |
| BUG-R2-002 | BR-321: gợi ý căn trống cùng nhóm (ví dụ 101), hết nhóm → nâng hạng 301 cho FDL xác nhận; BR-803: đổi sang 202 đang VD | BR-321-01 bỏ `issue`, thêm `groupCodePattern`, `suggestedRooms`, `whenGroupFull`; BR-803-02 thêm `targetRoom` 202 | Fixed |
| BUG-R2-003 | BR-433: ví dụ mới trả muộn 17:00 căn 401 = 521.000 > 300.000 → cần quản lý; ghi rõ miễn đêm trước 06:00 là "giảm giá đặc biệt" | BR-433-02 đổi ca, bỏ `issue` | Fixed |
| BUG-R2-004 | `ds-e.json` `docSequences`: `group`/`GRP-` → `reservation_group`/`NH-`, `receipt` → `payment`, `periodKey` `all` → `-`; validator thêm kiểm `docSequences` theo erd 10 (đột biến `GRP-` + `receipt` → 2 lỗi, exit 1) | `pnpm --filter @ottimo/api seed:ds-e` trên DB dev `ottimo`, **không** `--allow-code-drift`: exit 0, 13 user, 15 vai, 2 thiết bị, 136 tham số, **7/7 mã khớp** (`OTM-00001, BG-00001, WO-00001, NH-00001, PT-000001, F26-000001, KH-0001`), `aliases` [], `warnings` [] | **Closed** |

## 4. Kiểm lại Sprint 3 (QA, 17/10/2026 – bước Kiểm thử)

Cách kiểm: stack dùng một lần `ottimo-qa-s3` (compose chuẩn + bản sửa OPS của BUG-R2-030), lượt 1 trên ảnh build từ HEAD `a297273` + `product/infra` của cây làm việc, lượt chính trên ảnh build từ **HEAD `229db99`** (git archive; riêng web chép thêm `apps/guest-web/build/used-keys.ts` – BUG-R2-050); seed DS-E; Playwright như CI (`E2E_UI=1`, `E2E_CLOCK=1`, `E2E_COMPOSE_CONTROL=1`). Hai lượt chạy đủ liên tiếp trên stack dựng mới: 0 trượt, 0 flaky. Chi tiết: `qa/s3-test-report.md`.

| ID | Cách kiểm lại | Kết quả | Trạng thái |
|---|---|---|---|
| BUG-R2-025 | `api/room-capacity.api.spec.ts` (BE-A) + `serial/platform-mutations.serial.spec.ts` TC-NT-039, TC-NT-040 (b)(c): hạ sức chứa 302 từ 4 → 3 khi có đơn tương lai 4 người tính | 409 `CAPACITY_BELOW_BOOKINGS`, `conflicts[]` đủ trường; sức chứa giữ 4; trẻ dưới 6 tuổi không tính – đạt 2/2 lượt | **Closed** |
| BUG-R2-026 | `ui/s3-retest.spec.ts`: chặn đúng 1 lần `POST …/reservations` ở trình duyệt → 503 `SERVICE_UNAVAILABLE` + `Retry-After: 2`; 409 `CONCURRENT_UPDATE`/`ROOM_UNAVAILABLE` ở TC-L2-021 (E) | câu `error.SERVICE_UNAVAILABLE`/đếm ngược, không `error.server`, form giữ nguyên, tự gửi lại → đơn tạo; bên thua 409 thấy câu riêng – đạt | **Closed** |
| BUG-R2-027 | `api/s3-kickoff.api.spec.ts` TC-L5-016 (ru) – bỏ `test.fail` | văn bản báo giá tiếng Nga (chữ Kirin), không lẫn câu mẫu EN, có ngày hết hiệu lực – đạt | **Closed** |
| BUG-R2-028 | `ui/s3-retest.spec.ts`: tạo nhanh khách có SĐT trong form Đặt phòng mới | form không hiện lại ô SĐT; không có `PATCH guests/*` trước `POST reservations` – đạt | **Closed** |
| BUG-R2-029 | `ui/s3-retest.spec.ts`: mở Sơ đồ phòng 5 giây (SSE chưa có trên build) | không có "Đang kết nối lại…" – đạt | **Closed** |
| BUG-R2-030 | dựng stack mới bằng compose chuẩn từ ảnh build `229db99` (bản sửa OPS đã commit) | `api`, `worker` `healthy`; thư mục blob `drwx------ node node`; ảnh giấy tờ ghi/xóa (J16) được; E2E chạy đủ | **Fixed** – Closed khi job CI E2E xanh (CI `229db99` dừng ở Lint – BUG-R2-050) |
| BUG-R2-039 | ảnh `229db99`: TC-L3-014 (clock) – nhận phòng có phụ thu với `applyEarlySurcharge=false` | 422 `SURCHARGE_DECISION_REQUIRED`, đơn vẫn `confirmed` – đạt 2/2 lượt | **Closed** |
| BUG-R2-042 | ảnh `229db99`: TC-L4-063 (api) – `qa.sal` ghi cọc giữ chỗ của mình | 201, `reconciliation=pending`; G2 404, CTV 403 – đạt 2/2 lượt | **Closed** |
| BUG-R2-044 | ảnh `229db99`: TC-L4-061 (api), TC-L4-046, TC-L4-047 (clock) – đơn `ota_prepaid` | `paidViaOtaVnd` = tiền phòng; "Còn phải thu" = 75.000 / 50.000 / 238.000 (chỉ khoản tại quầy) – đạt 2/2 lượt | **Closed** (P0 – không cần ESC) |
| BUG-R2-031…038, 040, 041, 043, 045…048 | ảnh `229db99`: các ca `test.fail` tương ứng chạy lại 2 lượt; 032 (`CheckInPage.tsx:775/831`), 040 (`rack.service.ts:248`), 048 (`registration.controller.ts:574`) đọc lại code `229db99` | vẫn tái hiện (ca "expected fail" vẫn trượt đúng bước); 038 BE-A ghi hoãn (FB-R2-DOM-BE-30 (2) – chờ ARC 0.3.7) | Open |
