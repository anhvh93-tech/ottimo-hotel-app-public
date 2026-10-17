# Danh sách lỗi – Round 2

- Tác giả: QA | Mở: 16/10/2026 (tuần 1, Đợt 0) | Cập nhật: 17/10/2026 ~19:40 – **Sprint 4 D1** (ca E2E tự động cho BUG-R2-055…061 + quy tắc mới, `test.fail` ở đầu ca qua `support/known-bugs.ts`; thêm **BUG-R2-104** (P2) và **BUG-R2-105** (P1, CI 39028814256); BUG-R2-064 **Fixed** – mục 11, `qa/s4-test-report.md`) – trước đó: 17/10/2026 ~16:20 – **cổng QC Sprint 3 bản 3: ĐK-S3-12, ĐK-S3-3 bản 3, ĐK-S3-13** (đóng BUG-R2-083 phần P0, tách phần còn lại thành **BUG-R2-085** (P1, S4-39); ghi 18 điểm UXR mới thành BUG-R2-086…103; sửa bộ sinh truy vết cho luồng riêng "R2 – LP-v1" – mục 10) – trước đó: 17/10 15:40 – **chấm lại cổng QC Sprint 3 sau vòng sửa 9, 9b, 9c** (HEAD `fe4b166`, CI 39015560449 xanh; đóng 065…073, 074 Deferred, thêm và đóng BUG-R2-084 (KB7), gán TC-L4-096; 083 chờ SEC – mục 9, `qa/s3-retest-2.md`) – trước đó: 17/10 chiều – **vòng sửa 9 Sprint 3** (ghi lỗi UXR #1–#11 và FB-R2-SEC-BE-53 thành BUG-R2-065…083; 7 ca E2E-UI bấm thật bước ghi – QC-S3-09, mục 8) – trước đó: **cổng QC Sprint 3** (ĐK-S3-3 mở rộng theo ORC: lỗi tiền đã biết của `s4-carryover.md`, PO-S3-04/07, QC-S3-04, đóng BUG-R2-053, điều tra TC-L3-011 – mục 7) – trước đó: **Sprint 3 bước Kiểm thử** (E2E S3 trên stack dùng một lần `ottimo-qa-s3`; lượt chính trên ảnh build từ **HEAD `229db99`** (commit Phản hồi & sửa) – trước đó `a297273` + `product/infra`; báo cáo `qa/s3-test-report.md`) – trước đó: khởi động Sprint 3 (ĐK-S2-1) | Mức lỗi theo `product/docs/qa/test-strategy.md` mục 8
- Lỗi tồn từ R1: `rounds/round-01/qa/bug-list.md` (không chép lại)

## 1. Tổng hợp

| Mức | Số lỗi | Open | Fixed | Deferred | Closed |
|---|---|---|---|---|---|
| P0 | 10 | 6 | 0 | 0 | 4 |
| P1 | 21 | 2 | 1 | 0 | 18 |
| P2 | 39 | 12 | 0 | 2 | 25 |
| P3 | 36 | 20 | 1 | 0 | 15 |
| **Tổng** | **106** | **40** | **2** | **2** | **62** |

**Sprint 4 D1 (QA, 17/10 ~17:00–19:40, mục 11):**
- **Ca tự động cho 7 lỗi tiền 055…061 đã có trong repo**, cùng ca cho S4-21, S4-04, S4-23, S4-35, B-6 (`expectedVersion`), BR-402-01 và tập đóng `AuditEvent.action`:
  - tệp: `e2e/api/money-s4.api.spec.ts`, `e2e/clock/money-s4.clock.spec.ts`;
  - ca lỗi đã biết đánh `test.fail` ở **đầu ca** qua `e2e/support/known-bugs.ts`.
- Chạy trên ảnh dựng từ HEAD `94c711d` (stack QA `ottimo-qa-s4`): **mọi ca lỗi đã biết hỏng đúng chỗ của lỗi**, mọi ca hồi quy xanh, 2 lượt, 0 chập chờn. **Không lỗi nào trong 055…061 đổi trạng thái** (bản sửa BE chưa gộp).
- **Mới:**
  - **BUG-R2-104 (P2):** giảm giá đặc biệt luôn định tuyến lên quản lý;
  - **BUG-R2-105 (P1):** CI 39028814256 đỏ TC-L7-010 do chính ca test, không phải API hay migration `0055`.
- **BUG-R2-064 Fixed:** 3 ca đã tách, chờ commit + CI.

**Cổng QC Sprint 3 bản 3 – ĐK-S3-12, ĐK-S3-3 bản 3, ĐK-S3-13 (QA, 17/10 ~15:55–16:20, mục 10):** **BUG-R2-083 Closed** (phần P0: hủy/giữ nhầm giấy tờ C3 theo vị trí ô khi bỏ người – đã sửa ở `ea29582` + `e6d1a7d` + `fe4b166`; SEC `s3-SEC.md` 9.6 f: FE-07 Verified, SEC-G1 (a) ĐẠT, đồng ý đóng; QA tự đọc log CI 39015560449 trên `fe4b166`: TC-L3-077 ✓, `registration-party-removal.test.ts` 12/12 ✓, `registration-flow.test.ts` 22/22 ✓ trên PostgreSQL thật; đọc mã `onPartyMemberRemoved`). Phần còn lại tách thành **BUG-R2-085 – P1, Open, S4-39** (phương án chính `guestUploadPersonIndex`, contract 0.3.7, BE-57, BE-58 (2), giấy tờ lễ tân tự nhập chưa gắn người; hạn: trước cổng QC Sprint 4 – SEC-G1 (b)). **P0 Open nay chỉ còn 056…061** (sai tiền, ngoại lệ ORC dòng 593 (1)/597). **Ghi sổ điểm UXR mới:** N1–N6 (lượt đi lại `fe4b166` 15:20–15:45) → BUG-R2-086…091; 12 dòng "mới" còn lại của limits mục C (lượt v1.2) → BUG-R2-092…103. Mức do QA quyết: **không hạ mức nào** so với UXR (UXR đề xuất P3 cho N1–N6); **nâng** N2, N4, N5 lên P2 (lý do ở mục 10.2 và bảng chi tiết 086…103). Mới: 1 P1, 6 P2, 12 P3; không có P0. **Truy vết:** `gen_traceability.py` tách story cột Round "R2 – LP-v1" (EP19) ra mục 9 của `traceability.md`, `--strict` exit 0 (251/251 AC Must R2) trên cây làm việc; 3 bước kiểm của job CI "API contract" chạy ở máy đều xanh (mục 10.5).

**Chấm lại cổng QC Sprint 3 (17/10 15:00–15:40, HEAD `fe4b166`, mục 9):** CI 39015560449 xanh 7/7 job chạy (2 job staging/GHCR bỏ qua theo thiết kế), E2E **1.786 đạt / 0 trượt / 0 flaky / 0 lượt chạy lại**, 82 bỏ qua có chủ đích, 3 ca `test.fail` đã biết (TC-L3-011, TC-L3-032, TC-L3-074 – BUG-R2-038, 033, 054) vẫn "đúng dự kiến"; 9 ca bước ghi bấm thật (danh sách `WRITES` của CI, gồm TC-L3-077 và nay TC-L4-096) chạy và xanh. **Đóng:** 065, 066 (P0); 067…071 (P1); 072, 073 (P2 – QA bấm thật trên stack QA + unit); **thêm và đóng BUG-R2-084** (P1 – KB7 trả phòng sau giờ ân hạn, UXR đi lại 17/10 chiều; ca chống tái phát **TC-L4-096**). **Deferred:** 074 → S4-45. **Còn Open sau chấm lại:** 7 P0 – 056…061 (tiền, ngoại lệ dòng 593 (1), hạn trước cổng QC Sprint 4) và **083 (chờ SEC xác nhận FE-07)**; 1 P1 – 055 (tiền, cùng ngoại lệ). Nhóm UXR #11 (075…082): **không mục nào được vòng 9/9c sửa**; 075 tái hiện được, 082 rộng hơn ghi lúc đầu; trừ 077 (S4-44) đều **chưa có mục S4** – ORC thêm. Gốc lần đỏ TC-L3-076 ở CI 39010774166 ghi ở BUG-R2-071.

**Vòng sửa 9 (17/10 chiều – QC gate bản 2 KHÔNG ĐẠT, ĐK-S3-3 phần bản 2, mục 8):** ghi 10 lỗi UXR đi thử demo (#1–#10) thành BUG-R2-065…074, 8 điểm nhỏ (#11) thành BUG-R2-075…082, thẻ SEC FB-R2-SEC-BE-53 thành **BUG-R2-083**. Mức do QA quyết theo test-strategy mục 8; mức UXR chỉ là đề xuất. **Không hạ mức lỗi nào** so với UXR/SEC. **Nâng:** BUG-R2-083 (SEC Major → **P0**: hủy nhầm giấy tờ C3 của khách còn ở = mất dữ liệu C3), BUG-R2-076, 078, 080 (P3 → P2). **Giữ như UXR:** P0 – 065 (#1), 066 (#2); P1 – 067…071 (#3…#7; BUG-R2-070 là lỗi tiền nhưng chỉ hiển thị – lý do ghi ở mục chi tiết); P2 – 072…074. **3 P0 mới**, không thuộc ngoại lệ "sai tiền đường hiếm" của ORC (dòng 593 (1)): 066 đã **Fixed** trên cây làm việc; 065 **Fixed** phần compose dev/CI (phần demo chờ OPS smoke, ĐK-S3-10); 083 có hạn SEC-G1 (trước cổng QC Sprint 4 và trước dữ liệu thật) – việc cho qua cổng Sprint 3 khi 083 còn mở là quyền QC/ORC. Ca UI mới bấm thật bước ghi: TC-L3-075, TC-L3-076, TC-L4-093, TC-L4-094, TC-L4-095, TC-L2-085, TC-L2-086 – **7/7 đỏ đúng lỗi trên mã cũ, 7/7 xanh trên ảnh dựng từ cây làm việc** (17/10 13:23–13:25) → 066…071 chuyển **Fixed**, Closed khi có commit + CI xanh.

**Cổng QC Sprint 3 (17/10, ĐK-S3-3 mở rộng theo ORC – mục 7):** ghi 7 lỗi tiền đã biết trong `s4-carryover.md` thành BUG-R2-055…061 (S4-01/03, S4-02 + mở rộng, S4-05, S4-07, S4-18 + mở rộng, S4-22, S4-34/QC-S3-03), PO-S3-04 → BUG-R2-062, PO-S3-07 → BUG-R2-063, QC-S3-04 → BUG-R2-064; đóng BUG-R2-053. **6 lỗi P0 Open** – đều là sai tiền, mức theo test-strategy mục 8 ("sai tiền" = P0, lỗi tiền mặc định P0) và protocol mục 6/9; **không hạ mức vì đường đi hiếm** – đường đi/tần suất ghi ở từng dòng chỉ dùng để xếp thứ tự sửa. Được vào Sprint 4 nhờ ngoại lệ cổng sprint của ORC (decision-log ORC 17/10): **hạn sửa xong trước cổng QC Sprint 4**, mỗi mục có test oracle; còn sót thì cổng cuối Round 2 KHÔNG ĐẠT, và QA lập ESC nếu P0 không sửa kịp trong Round 2. Hai mục với tới từ Desk: **BUG-R2-058** (S4-07) và **BUG-R2-057** (S4-05) – sửa trước. BUG-R2-055 (S4-01) là P1: giao dịch rollback, không sai tiền, nhưng đổi đơn bị chặn bằng lỗi 500. Thẻ trong bảng đã đếm lại từng dòng.

Sprint 3 kiểm thử (17/10): đóng BUG-R2-025…029 (mục 4); thêm BUG-R2-030…054. Kiểm lại lần 2 trên cây làm việc = `16941c6` (vòng sửa 2 + 3, 2 lượt CI-like, stack mới): đóng 030, 031, 032, 034–037, 040, 041, 043, 045–048, 050–052 (trước đó 039, 042, 044 trên `229db99`). Còn: **033 (a) Open** (P2 – `guest.id_doc_hmac` không được ghi), **054 Open** (P3 – mới, TC-L3-074), **038 Deferred** (0.3.7), **053 Fixed** (P1 – chờ commit `ci.yml` + CI E2E xanh). Đếm lại từng dòng bảng dưới. **Kiểm lại toàn bộ trên `9e9fd64` (vòng sửa 4, 08:05–08:10, mục 6): 2 lượt như CI 1.773 đạt / 0 trượt – trạng thái các lỗi không đổi.**

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
| **BUG-R2-030** | **P1** | Stack compose (dev + CI E2E): `api`/`worker` không khởi động – `EACCES: mkdir '/app/.data/blobs'` → job CI `docker images build · E2E smoke` đỏ ở "Start compose stack" (run 38929255451) | OPS (+ BE-C) | **Closed** (17/10, cây làm việc = `16941c6`, 2 lượt CI-like trên stack mới) – CI 38980363276 (`c8b83f3`): bước "Start compose stack" xanh, api/worker healthy; job E2E còn đỏ vì BUG-R2-053 (nguyên nhân khác) |
| **BUG-R2-031** | **P1** | `Reservation` không trả các trường 0.3.6 (`registrationId`, `registrationStatus`, `registrationDeadlineAt`, `houseRulesSentAt`, `cardsIssued`, `balanceDueVnd`) → H13 bước Giấy tờ/Kiểm tra treo "Đang tải…" | BE-A | **Closed** (17/10, cây làm việc = `16941c6`, 2 lượt CI-like trên stack mới) – TC-L3-030 (E): bước Giấy tờ hiện 4 số cuối; TC-L3-001 (E): `houseRulesSentAt`, `cardsIssued` có giá trị |
| BUG-R2-032 | P3 | H13 bước 3: nút sang bước 4 ghi "Nhận phòng căn {room}" (khóa `ci.submit` không tham số, sai nghĩa) | FE (+UXD khóa mới) | **Closed** (17/10, cây làm việc = `16941c6`, 2 lượt CI-like trên stack mới) – TC-L3-001 (E): nút bước 3 "Tiếp tục: Giao mã & hoàn tất", không còn nhãn `{room}` |
| BUG-R2-033 | P2 | Nhập giấy tờ người 2 không `partyMemberId` → không khớp hồ sơ theo BR-951, không tạo người "Chưa rõ" (US-043 AC3) | BE-C + BE-A | **Open** – (a) vẫn trượt (17/10, cây làm việc = `16941c6`, 2 lượt CI-like trên stack mới): cổng khớp `frontdesk/internal/document-party.port.ts:72–85` chỉ so `guest.id_doc_hmac` mà **không có chỗ nào ghi cột này** (`db/schema/guests.ts:49` – không có lệnh ghi) → không bao giờ khớp hồ sơ; (b) người "Chưa rõ" – ORC 17/10: dời Sprint 4 |
| BUG-R2-034 | P2 | "Cần chú ý" không có `registration_due`/`registration_overdue`/`visa_expiring` (US-025 AC4, US-044 AC4, US-050 AC2) | BE-C + BE-A | **Closed** (17/10, cây làm việc = `16941c6`, 2 lượt CI-like trên stack mới) – TC-L3-004, TC-L3-037: "Cần chú ý" có mục khai báo/thị thực |
| **BUG-R2-035** | **P1** | Job J5 `registration.deadline` chưa đăng ký: không nhắc hạn khai báo, không thông báo tổng hợp 22:00/07:00 (BR-611, US-042 AC2) | BE-C (+ BE-A worker) | **Closed** (17/10, cây làm việc = `16941c6`, 2 lượt CI-like trên stack mới) – TC-L3-044, 046, 048: J5 `registration.deadline` chạy, quá hạn vào "Cần chú ý", thông báo tổng hợp FD + MGR |
| BUG-R2-036 | P2 | J16 chặn lượt 55 phút → ảnh người không đồng ý có thể còn quá hạn trên 24 giờ sau `confirmed` khi xóa ngay bị lỗi (BR-609-01) | BE-C | **Closed** (17/10, cây làm việc = `16941c6`, 2 lượt CI-like trên stack mới) – TC-L3-039: J16 tại đúng hạn trên xóa ảnh (getDocumentImage → 404) |
| **BUG-R2-037** | **P1** | Gia hạn vượt hạn thị thực không bị chặn mềm (thiếu 422 `VISA_EXPIRES_BEFORE_DEPARTURE`, US-050 AC2) | BE-A | **Closed** (17/10, cây làm việc = `16941c6`, 2 lượt CI-like trên stack mới) – TC-L3-054: gia hạn vượt hạn thị thực không lý do → 422 `VISA_EXPIRES_BEFORE_DEPARTURE` |
| BUG-R2-038 | P2 | Điều kiện nhận phòng "Đã thu đủ" không cộng phụ thu nhận sớm / đêm B9a sắp ghi (EP03-05 1.3) | BE-A | **Deferred** – 0.3.7 (ARC/ORC 17/10: `checkIn.payment` + `CheckInPreview.amountDueAtCheckinVnd`; tới lúc đó B18 chặn `BALANCE_DUE`) – TC-L3-011 giữ `test.fail` |
| **BUG-R2-039** | **P1** | Nhận sớm có phụ thu mà `applyEarlySurcharge=false` vẫn nhận phòng, phụ thu bỏ qua không cần duyệt (thiếu 422 `SURCHARGE_DECISION_REQUIRED`) | BE-A | **Closed** (17/10, ảnh `229db99`) – TC-L3-014: `applyEarlySurcharge=false` có phụ thu → 422 `SURCHARGE_DECISION_REQUIRED` |
| BUG-R2-040 | P3 | Sơ đồ phòng `getRack.roomStatus` không đọc `room_status` (OC/VC thay vì OD/VD sau nhận/trả phòng) | BE-A | **Closed** (17/10, cây làm việc = `16941c6`, 2 lượt CI-like trên stack mới) – ca tự động mới trong TC-L3-002 (b): `getRack.roomStatus` = OD khớp `room_status` |
| BUG-R2-041 | P2 | Hóa đơn công ty (`setInvoiceRequest`) không gắn vào hồ sơ khách (US-039 AC2, D16) | BE-B | **Closed** (17/10, cây làm việc = `16941c6`, 2 lượt CI-like trên stack mới) – TC-L4-059: tên công ty/MST gắn vào hồ sơ khách |
| BUG-R2-042 | P2 | `qa.sal` ghi thu cọc giữ chỗ của mình → 422 `AMOUNT_TOO_HIGH` max 0 (US-119 AC4, A33 `own_deposit_only`) | BE-B (+ARC) | **Closed** (17/10, ảnh `229db99`) – TC-L4-063: `qa.sal` ghi cọc giữ chỗ của mình → 201, `reconciliation=pending` |
| BUG-R2-043 | P3 | Số thẻ ở `posAuthCode` bị chặn nhưng mã lỗi `TOO_LONG` thay vì `CARD_NUMBER_DETECTED` (V-09) | BE-B | **Closed** (17/10, cây làm việc = `16941c6`, 2 lượt CI-like trên stack mới) – TC-L4-066: số thẻ ở `posAuthCode` → `CARD_NUMBER_DETECTED` |
| **BUG-R2-044** | **P0** | Đơn OTA thu hộ (`ota_prepaid`): không có khoản "Đã thu qua OTA" → tiền phòng tính vào "Còn phải thu" (BR-307, US-119 AC2) – nguy cơ thu tiền khách 2 lần, trả phòng bị `BALANCE_DUE` | BE-B (+ cổng BE-A) | **Closed** (17/10, ảnh `229db99`) – TC-L4-061 (api), TC-L4-046, TC-L4-047 (clock): `paidViaOtaVnd` = tiền phòng, "Còn phải thu" chỉ còn khoản tại quầy; không cần ESC |
| BUG-R2-045 | P2 | `getExtensionOptions.channelFeeSavingsVnd` chỉ tính phí kênh 1 đêm (BR-422-01: theo tổng tiền gia hạn) | BE-A (+ARC hợp đồng) | **Closed** (17/10, cây làm việc = `16941c6`, 2 lượt CI-like trên stack mới) – TC-L4-003 theo 0.3.6 bổ sung 3: `repricing[].channelFeeSavingsVnd` theo số đêm |
| **BUG-R2-046** | **P1** | FOC trên dòng phát sinh (trả muộn, nhận sớm, minibar, dịch vụ) không có `limitBasisVnd` → quản lý không duyệt/tự áp được FOC trong hạn mức "≤ 1 đêm", mọi thứ dồn lên chủ đầu tư (BR-433) | BE-A (+ BE-B folio) | **Closed** (17/10, cây làm việc = `16941c6`, 2 lượt CI-like trên stack mới) – TC-NT-029 (b), TC-NT-030 (b), TC-NT-036 (a), TC-L4-056: MGR duyệt/tự áp FOC phát sinh trong hạn mức 1 đêm |
| BUG-R2-047 | P2 | Gia hạn (B13) không chuyển buồng OC → OD (SM-01 B13, BR-802) | BE-A | **Closed** (17/10, cây làm việc = `16941c6`, 2 lượt CI-like trên stack mới) – TC-L4-004: gia hạn chuyển buồng OC → OD |
| BUG-R2-048 | P2 | `listC3AccessLog` bỏ qua tham số `from`/`to` của hợp đồng (server đọc `dateFrom`/`dateTo`) | BE-C | **Closed** (17/10, cây làm việc = `16941c6`, 2 lượt CI-like trên stack mới) – ca tự động mới trong TC-RB-022: `from`/`to` năm 2000 → 0 dòng, khoảng hôm nay → có dòng, sai định dạng → 422 |
| BUG-R2-049 | P2 | Harness E2E Sprint 3 của QA: ngày nghiệp vụ lấy theo ngày lịch (đỏ 00:00–05:59), tham số tương lai 2028–2030 rò sang ngày ảo, thăm dò endpoint mang cookie phiên, ảnh mẫu PNG hỏng, kỳ vọng `balanceDueVnd` âm (trước 0.3.6), regex ngày hết hạn báo giá, cửa sổ dời ngày TC-L2-055 | QA | Closed (17/10) – 2 lượt chạy đủ trên stack mới: 0 trượt, 0 flaky |
| **BUG-R2-050** | **P1** | `apps/guest-web/build/used-keys.ts` không có trong git (bị `.gitignore` gốc `build/` loại) mà `vite.config.ts`/`guard.test.ts` import → checkout sạch: `tsc` guest-web đỏ, ảnh `ottimo-web` không build được; CI 38940900970 (`229db99`) đỏ ở Lint, E2E/publish/deploy bị bỏ | FE (guest-web) + OPS (.gitignore) | **Closed** (CI 38980363276, `c8b83f3`: job "format · lint · audit · test · build" xanh, ảnh web build được) |
| BUG-R2-051 | P2 | Giới hạn SR-RL-09 (600 request/phút/người) ở `AuthGuard` dùng bộ đếm riêng: `/__test__/rate-limits/reset` không xóa được, không cấu hình được, cửa sổ theo MutableClock → sau khi tua đồng hồ về hiện tại `Retry-After` = 247.743.660 giây (≈ 7,8 năm), tài khoản bị khóa tới khi khởi động lại api; E2E dùng chung `qa.*` song song chạm 429 | BE-B (+ OPS) | **Closed** (17/10, cây làm việc = `16941c6`, 2 lượt CI-like trên stack mới) – STAFF_REQUESTS_PER_MINUTE=60: 429 `Retry-After: 60`; `/__test__/rate-limits/reset` xóa được; đồng hồ đóng băng +20 phút rồi trả về → `Retry-After` vẫn 60 (không còn hàng năm); CI dùng 5000 (`make-ci-env.sh`) |
| **BUG-R2-052** | **P1** | Khách đến sau nửa đêm (00:00–05:59, ngày nghiệp vụ vẫn = ngày đến): `checkIn` coi là nhận sớm trước 06:00 → 422 `addPriorNight: REQUIRED` (preview cùng lúc báo phụ thu 0); H13 chỉ hiện "Bắt buộc", không nhận phòng được (US-025 AC6, BR-602-02) | BE-A (+ FE thông báo) | **Closed** (17/10, cây làm việc = `16941c6`, 2 lượt CI-like trên stack mới) – TC-L3-008 (a): 01:30 ngày D+1 → B9 thường, không phụ thu (BE); phần chữ báo lỗi của H13 lúc 00:00–05:59 chưa chạy được giao diện ban đêm ở lượt này |
| **BUG-R2-053** | **P1** | CI E2E (run 38980363276, `c8b83f3`): 28 ca đỏ `403 DEVICE_NOT_TRUSTED` + 103 ca C3/RBAC bị bỏ qua im lặng – seed chạy bằng uid `node` 1000 ghi `tests/fixtures/seed/.out/ds-e.map.json` mode 0600, runner (uid 1001) không đọc được → harness không có token thiết bị | OPS (ci.yml) + QA (harness) | **Closed** (cổng QC S3, 17/10 – mục 7) – CI 38998735861 (`6af7173`): bước seed `--user` + `test -r` chạy, global-setup đọc token thiết bị từ seed (không dùng dự phòng), TC-RB-001/002/022 ✓, TC-SEC-010 ✓, RBAC Sprint 3 737 ✓, 0 ca trượt `DEVICE_NOT_TRUSTED`, job E2E xanh; cũng đúng ở CI 38989147610 (`9e9fd64`) và 38995279907 (`aeb479e`) |
| BUG-R2-054 | P3 | Xóa ảnh của khai báo chưa `confirmed` (SR-RET-02, lý do `unconfirmed`) không ghi `Registration.imagesPurgedAt`/`imagesPurgeReason` → H14 không hiện "Ảnh đã xóa lúc …" (ảnh vẫn bị xóa đúng hạn) | BE-C (+ ARC enum) | Open |
| **BUG-R2-055** | **P1** | Đơn có người chốt (CTV/sale) có FOC trên đêm phòng **lớn hơn giá đêm mới**: B14 sang căn rẻ hơn, B7 làm hạ bậc giảm theo số đêm, B13 trên đơn FOC 100 % → `500 INTERNAL_ERROR` (`RangeError` `allocate.ts:13`), giao dịch rollback – không sai tiền nhưng không đổi được đơn. Kèm S4-03: base hoa hồng còn cũ ngay sau B8 dời FOC (đúng lại ở lần đồng bộ sau). Đường: **chỉ API** (Desk chưa xin FOC trên đêm phòng) · Tần suất: hiếm | BE-B | **Open** – S4-01 (+S4-03). Hạn: trước cổng QC Sprint 4 (decision-log ORC 17/10) · Ca E2E S4: TC-NT-051 (knownBug – xanh khi bản sửa gộp và mã rời `OPEN`) |
| **BUG-R2-056** | **P0** | FOC đi theo dòng mới lấy min(FOC **đang có**, giá mới) thay vì min(**số đã duyệt**, giá mới) (BR-434): giá đêm xuống rồi lên lại thì FOC không hồi (FOC 100 % 1.000.000 → còn 900.000, khách trả thừa 100.000); **mở rộng**: phụ thu người về 0 rồi tăng lại thì FOC mất hẳn (4A→2A→4A: 2.901.000 thay vì 2.751.000, +150.000). Đường: **chỉ API** · Tần suất: hiếm | BE-B | **Open** – S4-02 (gồm mở rộng s3-round8). Hạn: trước cổng QC Sprint 4 (decision-log ORC 17/10) · Ca E2E S4: TC-NT-047 phần S4-02 (BR-434-07), TC-NT-049 (2) (BR-434-08) (knownBug – xanh khi bản sửa gộp và mã rời `OPEN`) |
| **BUG-R2-057** | **P0** | B14 đơn OTA đổi phòng nhiều lần: chênh lệch BR-424 tính so với căn **đang ở** và chỉ ghi thêm dòng, không đảo dòng cũ → 203→401→203→401 thu 750.000 thay vì 250.000 (+500.000; một đêm bị thu 2 lần, đêm ngủ ở chính căn đã đặt vẫn bị thu). Đường: **Desk** (Đổi phòng, H15) · Tần suất: hiếm (≥ 2 lần đổi theo yêu cầu khách, có lần quay về căn rẻ hơn) | BE-A | **Open** – S4-05. Hạn: trước cổng QC Sprint 4 (decision-log ORC 17/10) · Ca E2E S4: TC-L4-097 (BR-424-04) (knownBug – xanh khi bản sửa gộp và mã rời `OPEN`) |
| **BUG-R2-058** | **P0** | B7 (dời căn/ngày) và B7a (gán căn) sang căn **khác định mức** không tính lại phụ thu người từng đêm (BR-429 bổ sung 17/10): nâng hạng 202→302 vẫn thu 300.000 (đúng 0); khách xin 302→202 mất 300.000; OTA 101→301 thu 2.400.000 thay vì 2.100.000; đơn OTA chưa gán căn không bao giờ có phụ thu "khách báo trực tiếp". Đường: **Desk** (dời căn, gán căn) · Tần suất: thường gặp nhất trong nhóm này (xếp lại căn trước ngày đến cho đơn có người vượt định mức) | BE-A | **Open** – S4-07. Hạn: trước cổng QC Sprint 4 (decision-log ORC 17/10) · Ca E2E S4: TC-L2-084 (a)(b) (BR-429-08) (knownBug – xanh khi bản sửa gộp và mã rời `OPEN`) |
| **BUG-R2-059** | **P0** | FOC **chờ duyệt** mà dòng đêm bị ghi lại (B8 dời đơn; đổi giá do giảm theo số đêm khi B7 thêm đêm, B9a, B13, B14) → duyệt xong yêu cầu `approved` nhưng dòng FOC `rejected`, khách không được miễn (X2b: 5.205.000, FOC 300.000 không trừ), hạn mức tháng người duyệt vẫn bị trừ; **mở rộng**: FOC đã duyệt bị hủy theo quy tắc (đêm bỏ, phụ thu về 0) không có audit `folio.*`, vẫn tính vào `monthlyApprovedBy`/báo cáo FOC tháng. Đường: **chỉ API** · Tần suất: hiếm | BE-B | **Open** – S4-18 (gồm mở rộng s3-round8). Hạn: trước cổng QC Sprint 4 (decision-log ORC 17/10) · Ca E2E S4: TC-NT-046 phần B7 (BR-434-09), TC-NT-049 (4)(5)(6) (BR-433-03, BR-434-10), TC-NT-046 (a) (BR-412-17) (knownBug – xanh khi bản sửa gộp và mã rời `OPEN`) |
| **BUG-R2-060** | **P0** (tạm – chờ DOM) | B12 khôi phục đơn no-show có FOC đã duyệt: đêm phòng ghi lại không có FOC, khách trả thêm đúng số FOC (căn 103: 1.200.000 → 1.500.000, +300.000), yêu cầu vẫn `approved`. BR-434 chưa nói B12; BR-315(a) "dùng lại đêm cũ, giữ giá" → nhiều khả năng FOC phải quay lại. Đường: **chỉ API** (FOC đêm phòng) + B12 · Tần suất: rất hiếm | DOM (chốt) → BE-B | **Open** – S4-22. Hạn: DOM chốt trước (ĐK-S3-5), sửa trước cổng QC Sprint 4 (decision-log ORC 17/10) · Ca E2E S4: TC-NT-049 (3) (BR-315-06) (knownBug – xanh khi bản sửa gộp và mã rời `OPEN`) |
| **BUG-R2-061** | **P0** | FOC trên **phụ thu trả muộn** khi đổi giờ trả (B15 `setLateCheckout` → `replaceLateCharge`): FOC 210.000 đã duyệt → đổi 12:30 → đổi lại 15:00: FOC mất, còn phải thu 210.000; FOC 350.000 → 15:00 → 17:00: FOC còn 210.000, khách trả thêm 140.000; FOC **chờ duyệt** rồi đổi giờ → duyệt `approved`, dòng `rejected`, hạn mức lễ tân trưởng bị trừ 210.000. QA tái hiện trên `6af7173`. Đường: hôm nay **chỉ API**; thành thao tác **hằng ngày** khi S4-25* mở nút xin FOC trả muộn trên Desk (QC-S3-03) | BE-B (+ BE-A, DOM) | **Open** – S4-34/QC-S3-03. Hạn: trước cổng QC Sprint 4 (decision-log ORC 17/10), và **trước khi phát hành S4-25*** · Ca E2E S4: TC-NT-045 (a)(b), TC-NT-046 (a) (BR-412-15/16/17) (knownBug – xanh khi bản sửa gộp và mã rời `OPEN`) |
| BUG-R2-062 | P3 | H12 trước khi giữ chỗ ghi "Mã QR có nội dung là mã đơn, tạo ngay sau khi giữ chỗ" (`sale.qr_after`) nhưng sau giữ chỗ H12/H11 không vẽ mã QR cọc (PO-S3-04) | FE (+ UXD chuỗi) | **Open** – sửa cùng S4-28* (vẽ QR) hoặc sửa chuỗi |
| BUG-R2-063 | P2 | `guest.id_doc_last4` không có lệnh ghi nào → hồ sơ CRM không hiện 4 ký tự cuối giấy tờ (US-048 AC3, PO-S3-07); cùng gốc BUG-R2-033 (a) | BE-C (+ BE-B, SEC) | **Open** – S4-32*/S4-11 |
| BUG-R2-064 | P3 | Harness E2E: TC-L3-011, TC-L3-032, TC-L3-074 gọi `test.fail()` **giữa ca** → lỗi xảy ra trước dòng đó làm Playwright chạy lại, lượt 2 tới được `test.fail` nên cả ca tính "đúng dự kiến", không ghi flaky (CI 38998735861: TC-L3-011 lượt 1 hỏng bị che – QC-S3-04, mục 7) | QA | **Fixed** (17/10 Sprint 4 D1, cây làm việc – TC-L3-011/032/074 tách phần lỗi đã biết thành ca riêng, `knownBug` ở đầu ca; chờ commit + CI) – S4-24 |
| **BUG-R2-065** | **P0** | Demo/dev compose: api, worker và pha seed không nhận `DATA_KEK_CURRENT`/`ID_HASH_KEY` (`x-api-env` của `infra/docker-compose.yml:21-51` không truyền dù `demo.env` có) → mỗi tiến trình tự sinh khóa ngẫu nhiên (`keyring.ts:56-68`): giấy tờ của đơn dựng sẵn báo 500 `DecryptionError` (Gia hạn, Thêm người trên D4); khởi động lại là mọi giấy tờ trước đó không đọc được. Prod không bị (`*_FILE` + strict) (UXR #1) | OPS | **Closed** (chấm lại cổng 17/10) – CI 39015560449 (`fe4b166`): bước `check-compose.sh` OK "one keyring for api/worker/seed in dev + demo"; QA kiểm dev/CI 13:29 (khởi động lại api + worker vẫn đọc giấy tờ + ảnh, đối chứng không khóa → 500); demo: smoke OPS trên `9a221ee` ĐẠT, khởi động lại api + worker mở lại được số và ảnh (`outputs/OPS/demo-1.md` 6b), UXR đi lại KB6 đạt |
| **BUG-R2-066** | **P0** | Mọi lần tải ảnh đính kèm từ Desk trả 422: `Idempotency-Key` = `${idem}-a` không phải UUID (`MoneyPage.tsx:771`, `StayDialogs.tsx:645`; `auth.guard.ts:575`) → không ghi được khoản chi hoàn (tiền mặt và chuyển khoản, kể cả chủ đầu tư) vì API bắt buộc ảnh (`EVIDENCE_REQUIRED`); phát sinh phạt/hư hỏng kèm ảnh cũng hỏng (UXR #2) | FE | **Closed** (chấm lại cổng 17/10) – CI 39015560449 (`fe4b166`): TC-L4-093, TC-L4-094, TC-L4-095 xanh ngay lượt đầu; bước CI "UI write-step cases" bắt buộc các ca này chạy |
| **BUG-R2-067** | **P1** | Desk không thêm được giấy tờ (Nhập tay, có hay không ảnh): `addGuestDocument` gửi phần `data` dạng Blob → trình duyệt gắn filename → `textPart` của API bỏ qua → 422 `data REQUIRED` ("Bắt buộc") (`api-client/src/endpoints.ts:769`, `files/public/multipart.ts:70-72`) (UXR #3) | FE (api-client) | **Closed** (chấm lại cổng 17/10) – CI 39015560449 (`fe4b166`): TC-L3-075 xanh ngay lượt đầu |
| **BUG-R2-068** | **P1** | Lễ tân trưởng (và lễ tân khác người tạo yêu cầu) không thấy khoản hoàn quản lý đã duyệt ở tab Hoàn tiền → không chi tiền mặt được bằng vai quầy (`approval.service.ts:704-707`: FDL/FD chỉ thấy yêu cầu "của mình") (UXR #4) | BE-A | **Closed** (chấm lại cổng 17/10) – CI 39015560449 (`fe4b166`): TC-L4-093 bước (3) xanh (`qa.fdl` thấy và chi khoản quản lý đã duyệt); hàng chờ chi hoàn ghi lệch x-scope OpenAPI → S4-40 |
| **BUG-R2-069** | **P1** | Hộp Hủy đơn ghi "Đơn chưa thu tiền nên không có phí hủy hay khoản hoàn" khi khách được hoàn 100 % cọc (BR-309-03); app vẫn tạo đúng yêu cầu hoàn – lễ tân dễ báo sai cho khách (`ReservationDialogs.tsx:262-279`, thiếu nhánh hoàn > 0, giữ lại = 0) (UXR #5) | FE (+ UXD câu) | **Closed** (chấm lại cổng 17/10) – CI 39015560449 (`fe4b166`): TC-L2-085 xanh |
| **BUG-R2-070** | **P1** | Drawer: "Đã thu" = tiền phòng − còn phải thu (`ReservationDrawer.tsx:515`): giữ chỗ chưa cọc hiện −1.416.000 (D5), đơn đã hủy mới cọc 500.000 hiện −1.822.000, D1 đang ở có phụ thu hiện 1.354.000 thay vì 1.613.000. Folio, bill, màn trả phòng vẫn đúng (UXR #6) | FE | **Closed** (chấm lại cổng 17/10) – CI 39015560449 (`fe4b166`): TC-L2-086 và phần "Đã thu" của TC-L3-076 xanh |
| **BUG-R2-071** | **P1** | Thêm người lớn vượt định mức khi khách đang ở bị chặn: Desk luôn gửi `applyExtraPersonSurcharge: false`, không hiện số phụ thu, không có ô xác nhận → 422 `SURCHARGE_DECISION_REQUIRED` (450.000 ở D1); câu báo là câu của màn nhận phòng ("tick 'Tôi đã báo khách…'" – không có ô nào để tick) (`StayDialogs.tsx:988, 996`) (UXR #7) | FE + UXD | **Closed** (chấm lại cổng 17/10) – CI 39015560449 (`fe4b166`): TC-L3-076 xanh ngay lượt đầu. Lần đỏ 2/2 lượt ở CI 39010774166 (`9a221ee`) là **lỗi sản phẩm khác** – ô chọn khách đua kết quả tìm kiếm + ngày nghiệp vụ lấy theo máy (gốc ở mục chi tiết), sửa ở `fe4b166`. UXD duyệt chuỗi của hộp: S4-41 |
| BUG-R2-072 | P2 | Quản lý tự chi khoản mình đã duyệt: API trả đúng 403 `SELF_REFUND_FORBIDDEN`, nhưng Desk hiện "Máy chủ đang gặp sự cố…" (`MoneyPage.tsx:877` so mã `SELF_APPROVAL_FORBIDDEN`; chưa có chuỗi `error.SELF_REFUND_FORBIDDEN` → `problemView` rơi về `error.server`) (UXR #8) | FE (+ UXD chuỗi) | **Closed** (chấm lại cổng 17/10) – QA bấm thật trên stack QA (mã các màn này giống hệt `fe4b166`), 2/2 lượt: `qa.mgr` tự ghi hoàn chuyển khoản khoản mình đã duyệt → 403 `SELF_REFUND_FORBIDDEN` → câu riêng, không "Máy chủ đang gặp sự cố"; unit `problem.test.ts` (403 không có câu riêng → `error.FORBIDDEN_ACTION`) |
| BUG-R2-073 | P2 | Câu báo còn ký hiệu thô: `{n}` ở "Còn {n} ô cần sửa" khi lỗi 422 đi qua `problemView` (không truyền `n` – `app/problem.ts:65-66`; ảnh 121); `{room}`/`{from}`/`{to}` ở câu báo căn đang khóa khi tạo đơn (ảnh 141) (UXR #9) | FE | **Closed** (chấm lại cổng 17/10) – (b) QA bấm thật 2/2: tạo đơn ở căn 401 đang khóa → "Căn 401 đang khóa sửa chữa từ 02/08/2027 đến 04/08/2027. Chọn căn khác.", không còn `{…}` trên màn; (a) `{n}`: unit `problem.test.ts` (đếm số ô; mọi câu `error.*` điền đủ tham số) – QA chạy lại 17/10, chưa có đường bấm thật nào còn ra 422 qua `problemView` |
| BUG-R2-074 | P2 | Ô "Ngân hàng nhận" (nơi nhận hoàn chuyển khoản) chỉ nhận mã BIN 6 số: chữ gõ vào bị xóa im lặng (`MoneyPage.tsx:680-690`: `replace(/\D/g, '')`, `maxLength 6`) rồi báo "Bắt buộc"; chưa có danh sách chọn ngân hàng (UXR #10) | FE + UXD | **Deferred** – S4-45 (danh sách ngân hàng VietQR chưa có trong repo; FE + UXD + INT) |
| BUG-R2-075 | P3 | KB2: sau **Tạo nhanh khách**, ô "Khách đứng tên" có lúc vẫn đỏ "Bắt buộc" dù đã chọn khách; bấm Tạo đơn vẫn được (UXR #11) | FE | Open – S4 (**chưa có mục S4** – ORC thêm). QA tái hiện 2/2 trên stack QA: bấm Tạo đơn khi chưa chọn khách → Tạo nhanh khách → ô vẫn đỏ "Bắt buộc" tới lần bấm sau. Gốc: `BookingDialog` chỉ tính lại `errors` khi bấm Tạo đơn; bản sửa ô chọn khách (`fe4b166`) không chạm chỗ này |
| BUG-R2-076 | P2 | KB2: nút **Dùng căn …** (khi đặt trùng) tạo đơn ngay ở căn gợi ý với giá tính lại theo căn mới; lễ tân không được xem giá trước khi tạo (UXR #11 – QA nâng P3 → P2) | FE + UXD/PO | Open – chờ UXD/PO (**chưa có mục S4** – ORC thêm) |
| BUG-R2-077 | P3 | Danh sách Đơn đặt phòng: ô Tìm kiếm chỉ tìm theo mã đơn, mã OTA, mã khách; chưa tìm theo tên khách (UXR #11) | FE (+ BE-A nếu API chưa hỗ trợ) | Open – S4-44 |
| BUG-R2-078 | P2 | Danh sách Đơn đặt phòng: cột "Còn phải thu" luôn trống – dữ liệu danh sách không có `balanceDueVnd` (`ReservationsPage.tsx:204`) (UXR #11 – QA nâng P3 → P2) | FE + BE-A | Open – S4 (**chưa có mục S4** – ORC thêm; FE + BE-A: dữ liệu `listReservations` không có `balanceDueVnd`) |
| BUG-R2-079 | P3 | Phím Esc không đóng khung chi tiết đơn sau khi đã mở rồi đóng hộp link check-in / xác nhận cọc; nút X vẫn đóng được (UXR #11) | FE | Open – S4 (**chưa có mục S4** – ORC thêm) |
| BUG-R2-080 | P2 | KB3: hộp báo giá chỉ cho chọn Tiếng Việt/English, không có tiếng Nga (`QuoteDialog.tsx:79, 634-635`), trong khi US-083 AC2 (Must R2) yêu cầu Việt/Anh/Nga và API đã có bản RU (BUG-R2-027) (UXR #11 – QA nâng P3 → P2) | FE (+ PO xác nhận phạm vi) | Open – chờ PO (US-083 AC2 Must R2; **chưa có mục S4**) |
| BUG-R2-081 | P3 | KB3: lễ tân xác nhận cọc không thấy số tiền và ghi chú CTV đã báo chuyển (UXR #11) | FE (+ PO phạm vi) | Open – chờ PO (**chưa có mục S4**) |
| BUG-R2-082 | P3 | KB7: nút ở bước Phụ phí mở hộp "Thêm phát sinh" chưa chọn sẵn khoản – preset `LAUNDRY_KG`, `FNB`, `SMOKING`, `CARD_LOST` (`CheckOutPage.tsx:38-42`) không khớp mã/nhóm danh mục API (`laundry`, `fnb`, `smoking_fee`, `key_card_fee`); chỉ "Hư hỏng" đúng (UXR #11) | FE | Open – S4 (**chưa có mục S4** – ORC thêm). Rộng hơn ghi lúc đầu – xem mục chi tiết: 4/5 nút ở bước Phụ phí không chọn sẵn khoản |
| **BUG-R2-083** | **P0** | Bỏ người khỏi đoàn hủy giấy tờ khách tải qua link **theo vị trí ô**, không theo người (`registration.service.ts:1921-1955`, điều kiện `person_index > persons` ở :1931): bỏ người giữa → hủy không hoàn tác giấy tờ của khách **còn ở**, giữ giấy tờ của người đã rời đoàn; bỏ người trước ngày đến → không hủy gì, link báo đủ người bằng hộ chiếu của người không ở; `required_count` không giảm. SEC tái hiện trên PostgreSQL thật (FB-R2-SEC-BE-53, SEC xếp Major) – QA xếp **P0** theo test-strategy mục 8 (mất/hỏng dữ liệu C3; C3 mặc định P0) | BE-C, BE-A, ARC (+ FE/UXD hộp xác nhận) | **Closed** (cổng QC S3 bản 3, 17/10 – ĐK-S3-12, mục 10.1) – phần P0 đã sửa: 9b BE phương án dự phòng (`ea29582`), 9c BE-54/55/56 + visa (`e6d1a7d`), 9c FE-07 (`fe4b166`). SEC 9.6 f: FE-07 Verified, SEC-G1 (a) ĐẠT, đồng ý đóng. QA kiểm lại qua log CI 39015560449 (`fe4b166`): TC-L3-077 ✓, `registration-party-removal` 12/12, `registration-flow` 22/22 (PostgreSQL thật). Phần còn lại (phương án chính, contract 0.3.7, BE-57, BE-58 (2), giấy tờ lễ tân tự nhập chưa gắn người) → **BUG-R2-085** (P1, S4-39) |
| **BUG-R2-084** | **P1** | KB7: trả phòng **sau giờ ân hạn** mà chưa hẹn trả muộn, vào thẳng H16: bước Phụ phí để sẵn 12:00 + "Trả đúng giờ – không phụ thu"; sửa sang giờ thật thì có phụ thu nhưng bước Bill không cộng vào số cần thu ("Đã thanh toán đủ", không có ô thu) → không hoàn tất được với giờ thật nếu không bấm "Trả muộn" ở drawer trước (UXR đi lại 17/10 chiều trên `9a221ee`; `demo-1-limits.md` mục C) | FE (+ ARC/BE-A `serverTime` – S4-47) | **Closed** (chấm lại cổng 17/10) – sửa ở `fe4b166`; CI 39015560449: **TC-L4-096** xanh ngay lượt đầu; unit `checkout.test.tsx` (3 ca KB7) QA chạy lại 17/10 |
| **BUG-R2-085** | **P1** | Bỏ người khỏi đoàn – **phần còn lại của BUG-R2-083** sau phương án dự phòng: chưa có phương án chính (lễ tân chọn ô "Khách n" của người bị bỏ – `removePartyMember.guestUploadPersonIndex`), nên giấy tờ khách gửi qua link từ Khách 2 của người **còn ở** tự xóa sau 24 giờ nếu lễ tân không "Gắn người"; "Gắn người" phải đọc đủ trường C3 (step-up) rồi nhập/gửi lại cả bộ (chưa có PATCH chỉ `partyMemberId`); 409 `PARTY_DUPLICATE` chưa kèm id giấy tờ chờ (mở nhầm khi ≥ 2 giấy tờ chờ); BE-57 (`retireUnclaimed` ghi log C3 `delete` khi đang hold; `removeDocument` khi `legal_hold`), BE-58 (2); giấy tờ lễ tân tự nhập chưa gắn người không được xử lý khi bỏ người | BE-C, BE-A, ARC (contract 0.3.7), FE, UXD | **Open** – S4-39 (SEC-G1 b). Hạn: trước cổng QC Sprint 4. SEC: FB-R2-SEC-BE-53 còn Open chỉ vì phần này |
| BUG-R2-086 | P3 | N1 · KB4 H14 "Xem đủ số / ảnh": chip "Đã có" và nút "Ẩn số" bên phải ảnh đè lên nhau (UXR `fe4b166`) | FE | Open – S4-50 |
| **BUG-R2-087** | **P2** | N2 · KB7 H16 bước 1–2 sau 12:30: khung Folio ghi "Còn phải thu" **đã gồm** phụ thu trả muộn (552.000) nhưng danh sách dòng chưa có dòng "Phụ thu trả muộn" (các dòng cộng ra 120.000) – `CheckOutPage.tsx:209` cộng `lateDelta`, bảng :384–410 chỉ thêm dòng giả cho đêm thêm. Bill và số thu đúng (QA nâng P3 → P2) | FE | Open – S4-50 |
| BUG-R2-088 | P3 | N3 · KB7 H16 bước 2: cạnh nút "Tiếp tục" đang khóa chỉ lặp lại câu "Tôi đã báo khách khoản phụ thu này", không nói phải tick ô đó | FE + UXD | Open – S4-48 (UXD duyệt chữ) |
| **BUG-R2-089** | **P2** | N4 · KB9 H14: màn chi tiết ghi "Đã có giấy tờ 2/2 người" và chip "Đã có" cho dòng "Chưa nhập thông tin giấy tờ", danh sách Giấy tờ & khai báo ghi "0/2" – `DocsPanel.tsx:98` đếm `docs.length` (cả giấy tờ chỉ có ảnh), danh sách đếm `submittedCount` (`RegistrationPage.tsx:192`). Mark-sent vẫn bị chặn đúng (SEC-BE-54) (QA nâng P3 → P2) | FE (+ UXD chữ) | Open – S4-50 |
| **BUG-R2-090** | **P2** | N5 · Hộp "Bỏ … khỏi đơn?" (`party.remove_confirm`: "Giấy tờ và ảnh của người này sẽ bị xóa ngay") không nói giấy tờ khách gửi qua link từ Khách 2 sẽ chuyển "Chờ gắn người – tự xóa sau 24 giờ" và phải "Gắn người" (QA nâng P3 → P2: lời nhắc duy nhất ở lúc quyết định, liên quan dữ liệu C3 của khách còn ở) | FE + UXD | Open – S4-39 (phương án chính thay hộp này bằng hộp chọn ô) |
| BUG-R2-091 | P3 | N6 · Hộp "Gắn người": thiếu trường thì đầu hộp chỉ ghi chung "Bắt buộc" (dòng đỏ ở từng ô vẫn có). Việc phải nhập lại mọi trường thuộc BUG-R2-085 (contract 0.3.7) | FE + UXD | Open – S4-39 / S4-48 |
| BUG-R2-092 | P3 | KB4 H13: sau khi app đòi "Ghi chú giờ nhận (vì sao ghi bù)", gõ ghi chú hoặc sửa giờ thì dòng đỏ "Giờ này sớm hơn lúc bấm khá lâu…" vẫn còn tới lần bấm sau (`CheckInPage.tsx:630`; H16 đã sửa ở `fe4b166`) | FE | Open – S4-50 |
| **BUG-R2-093** | **P2** | KB6 thêm người lớn vượt định mức khi đang ở: chỉ có "ghi phụ thu" ("Vẫn ghi phụ thu rồi báo quản lý"), thiếu lựa chọn "ghi phụ thu kèm đề nghị FOC" – BR-414 (hai cách), US-022 AC4 ("như BR-414") | FE (+ UXD, BE-B) | Open – S4-25 (ORC mở rộng mục cho phụ thu người); **chỉ phát hành sau S4-02/S4-18** (BUG-R2-056/059 chạm FOC phụ thu người – S4-34) |
| BUG-R2-094 | P3 | KB6: ô tìm người đi cùng mang nhãn "Khách đứng tên" (`StayDialogs.tsx:1221` dùng `booking.field.guest`) | FE (+ UXD) | Open – S4-50 |
| BUG-R2-095 | P3 | KB7 mở lại H16 lần hai: khung Folio hiện thêm cặp dòng minibar âm/dương; mỗi lần qua bước 1, `recordMinibarCheck` (checkout) đảo và ghi lại dòng minibar kể cả khi số đếm không đổi (`minibar.service.ts`, lý do `minibar_recount`) → Nhật ký tiền thêm dòng. Bill và số tiền đúng | FE (ẩn cặp đã đảo) + BE-B (không ghi lại khi không đổi) | Open – S4-50 |
| BUG-R2-096 | P3 | KB7 hộp Thêm phát sinh: câu `stay.charge_default` "… Phí phạt không tính vào doanh thu phòng." hiện cho mọi khoản, kể cả Giặt ủi | UXD + FE | Open – S4-50 |
| BUG-R2-097 | P3 | KB8 sau khi chi hoàn: thông báo "Đã ghi hoàn -500.000 đ." thừa dấu trừ (`MoneyPage.tsx:802` dùng `amountVnd` âm của giao dịch; danh sách :540 dùng `refundedVnd` – đúng) | FE | Open – S4-50 |
| BUG-R2-098 | P3 | KB8 chủ đầu tư "Xem đủ số tài khoản": hộp nhập mật khẩu ghi "Xác nhận lại để xem giấy tờ" (`StepUpDialog` dùng chung `ci.stepup_title`, `stay/common.tsx:180`) | FE + UXD | Open – S4-50 |
| BUG-R2-099 | P3 | KB8: dòng "Ngân hàng nhận" hiện mã BIN (970436) thay vì tên ngân hàng (`MoneyPage.tsx:839`); cùng gốc BUG-R2-074 (chưa có danh sách ngân hàng VietQR) | FE + UXD + INT | Open – S4-45 |
| BUG-R2-100 | P3 | KB8, KB10 Nhật ký tiền › Nhật ký thao tác tiền: cột Lý do hiện mã thô (`guest_changed_mind`, `found_other`, `minibar_recount`) (`MoneyPage.tsx:275` in `e.reason`) | FE + UXD | Open – S4-50 |
| **BUG-R2-101** | **P2** | KB1 drawer đơn **giữ chỗ** chưa cọc (D5): "Còn phải thu 0 đ" (`ReservationDrawer.tsx:526-529` in `r.balanceDueVnd` = 0 khi chưa có dòng folio); số cần thu chỉ ở dòng "Cọc cần thu" – dễ hiểu thành "không còn nợ" (như BUG-R2-078) | FE + UXD (+ ARC nghĩa `balanceDueVnd` trước nhận phòng) | Open – S4-50 |
| **BUG-R2-102** | **P2** | KB8 drawer đơn **đã hủy và đã hoàn**: Folio ghi "Đã thu −500.000", không có dòng "Đã hoàn" (`ReservationDrawer.tsx:522` in số đã thu kiểu khấu trừ; `paidVnd` của server không trừ khoản hoàn – QC đọc `folio.service.ts:252`) – dễ hiểu là khách sạn còn giữ tiền | FE (+ BE-B nếu cần `refundedVnd`) | Open – S4-50 |
| BUG-R2-103 | P3 | KB4, KB6, KB7 drawer đơn đang ở: Folio có 2 dòng "Còn phải thu" cùng số (`ReservationDrawer.tsx:526` và :571) | FE | Open – S4-45 |
| **BUG-R2-104** | **P2** | Giảm giá đặc biệt (`requestFoc kind=special_discount`) luôn định tuyến tới **quản lý** (`limits.ts:36` `minRoleFor` chỉ cho `foc` mức lễ tân trưởng) → lễ tân trưởng không duyệt được khoản ≤ 300.000 trong hạn mức (BR-431 "cùng cơ chế duyệt", BR-433, rbac A36 ²⁵; oracle BR-433-03, BR-434-11) | BE-B | Open – Sprint 4 (cùng S4-18/S4-23); ca: TC-NT-049 (4) phần hạn mức (`e2e/clock/money-s4.clock.spec.ts`) |
| **BUG-R2-105** | **P1** | CI 39028814256 (`cc218b2`) đỏ ở TC-L7-010 (guest-web H18), 121 ca phụ thuộc không chạy: hàm `photo()` của ca chọn nút "Chụp" theo vị trí (`.nth(n-1)`) và không chờ tải ảnh người 1 xong – khi người 1 xong, ô đó chỉ còn "Gửi lại" nên `.nth(1)` không còn (race, đã chập chờn ở CI 38980363276). **Không** do API/migration `0055`/hợp đồng 0.3.7 | QA (test) | **Fixed** (cây làm việc 17/10 – `guest-web.h18.spec.ts` chọn nút theo `aria-describedby` của người, chờ tải xong; QA rà, chạy 3/3 qua bước chụp trên stack QA) – Closed khi CI xanh trên commit có bản sửa |
| BUG-R2-106 | P3 | H17 Cần duyệt (FE-A, cây làm việc 17/10): sau 412 `VERSION_CONFLICT` bấm "Tải lại" rồi mở lại hộp duyệt hoàn, **đôi khi** Desk vẫn gửi `expectedVersion` cũ → 412 lần hai (1/4–1/2 lượt TC-NT-052 (E)) | FE-A | Open – cùng PR B-6 (#6); TC-NT-052 (E) chờ sửa mới vào `WRITES` |

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
- Mức: **P1** (chặn toàn bộ job CI `docker images build · E2E smoke` và mọi stack dev dựng mới; không có E2E nào chạy được trên code Sprint 3) · Môi trường: ảnh `ottimo-api` build từ `8ca2a47`/`a297273`, `infra/docker-compose.yml` của HEAD · Vai sửa: OPS (compose + Dockerfile), BE-C (mặc định đường dẫn blob) · Trạng thái: **Closed** (17/10 – QA kiểm lại trên cây làm việc = `16941c6`, mục 5)
- Bước tái hiện: `docker compose --env-file .env -f infra/docker-compose.yml up --build --wait` trên HEAD `a297273`.
- Thực tế: `api-1`, `worker-1` khởi động lại liên tục, log `Error: EACCES: permission denied, mkdir '/app/.data/blobs'` (10 dòng/30 giây), `dependency failed to start: container …-api-1 is unhealthy`. CI run 38929255451 (main, `a297273`): bước "Start compose stack" đỏ – E2E không chạy.
- Gốc: `files/internal/blob-store.ts:117` mặc định `BLOBSTORE_LOCAL_PATH = ./.data/blobs` (tương đối `/app`, thuộc root trong ảnh, tiến trình chạy `USER node`); compose không đặt biến, không mount volume; worker (J16 xóa blob) cần cùng thư mục.
- Mong đợi: api/worker khởi động; blob mã hóa nằm trên volume riêng, thư mục `node:node 0700`, chỉ api + worker mount (SEC C2, SR-FILE-04).
- Kiểm lại (17/10, QA): ảnh build từ HEAD `a297273` + `product/infra`, `.dockerignore` của cây làm việc (OPS: `BLOBSTORE_LOCAL_PATH=/var/lib/ottimo/blobs`, volume `blobdata`, Dockerfile tạo thư mục `node:node 0700`, dịch vụ `db-roles`): stack `ottimo-qa-s3` lên `healthy`, thư mục `drwx------ node node`, E2E chạy đủ (mục 2 báo cáo S3). Chuyển **Closed** khi bản sửa được commit và CI job E2E xanh.
- Ghi chú: trong lúc chờ, các stack QA dùng file override đặt `BLOBSTORE_LOCAL_PATH=/data/blobs` + bind mount chung cho api/worker.

### BUG-R2-031 – `Reservation` không trả các trường 0.3.6 (`registrationId`, `registrationStatus`, `registrationDeadlineAt`, `houseRulesSentAt`, `cardsIssued`, `balanceDueVnd`) → H13 bước Giấy tờ/Kiểm tra treo "Đang tải…"
- Mức: **P1** (màn Nhận phòng – luồng chính A1 – không hiện/nhập/kiểm được giấy tờ C3 ở bước 1–2; lễ tân phải sang H14 "Giấy tờ & khai báo" rồi quay lại; client không có cách đi từ đơn sang khai báo theo hợp đồng) · Môi trường: stack `ottimo-qa-s3` (`8ca2a47`, và `a297273` + infra), Chromium 1366×768, `qa.fd` trên máy được cấp · Vai sửa: BE-A (`reservations/internal/reservation-dto.ts`) · Trạng thái: **Closed** (17/10 – QA kiểm lại trên cây làm việc = `16941c6`, mục 5)
- Bước tái hiện: (1) tạo đơn đến hôm nay, thu đủ, nhập giấy tờ người đứng tên (API); (2) `GET /v1/properties/{p}/reservations/{id}` (đơn `confirmed`), rồi `checkIn` và `GET` lại (đơn `in_house`); (3) mở `/reservations/{id}/check-in` trên admin-web.
- Thực tế: (2) khóa trả về chỉ có `id, code, status, …, depositPaidVnd, noShowAvailableFrom, nightlyRates, totalRoomVnd, conflictState, capacityConflict, progress, (actualCheckinAt, doorAccessHandedOverAt), allowedActions, version` – **không** có `registrationId`, `registrationStatus`, `registrationDeadlineAt`, `houseRulesSentAt`, `cardsIssued`, `balanceDueVnd` dù đã có giá trị trong DB (`house_rules_sent_at`, `cards_issued` ghi khi B9). (3) khung bên phải bước "Giấy tờ" và "Kiểm tra" là skeleton + `status "Đang tải…"` mãi (`CheckInPage.tsx:100` `if (!deviceTrusted || !r?.registrationId) return;`); điều kiện "Có giấy tờ người đứng tên" vẫn đổi đúng sau khi nhập ở H14.
- Mong đợi: OpenAPI 0.3.6 `Reservation` (schema dòng ~8405–8415): `registrationId`, `registrationStatus`, `registrationDeadlineAt`, `houseRulesSentAt`, `cardsIssued`, `balanceDueVnd` có giá trị khi tồn tại; H13 bước 1 hiện giấy tờ (4 số cuối) và cho nhập.
- Bằng chứng: `ui/stay.h13-h17.spec.ts` "TC-L3-030 (E)" (`test.fail`), phần cuối "TC-L3-001 (E)" (`houseRulesSentAt`/`cardsIssued` – `test.fail`); harness `support/s3.ts registrationOf()` phải tìm khai báo qua `listRegistrations` (lật trang).

### BUG-R2-032 – H13 bước 3 "Khai báo": nút sang bước 4 ghi "Nhận phòng căn {room}" (chưa thay tham số, sai nghĩa)
- Mức: P3 (nhãn sai: nút chỉ chuyển sang bước "Giao mã & hoàn tất", không nhận phòng; hiện nguyên `{room}`) · Môi trường: như BUG-R2-031 · Vai sửa: FE · Trạng thái: **Closed** (17/10 – QA kiểm lại trên cây làm việc = `16941c6`, mục 5)
- Bước: H13 → "Tiếp tục: Kiểm tra" → "Tiếp tục: Khai báo" → xem nút chính ở chân màn.
- Thực tế: nút `Nhận phòng căn {room}`. Gốc: `CheckInPage.tsx:653` `nextKey = ['ci.go_verify','ci.go_register','ci.submit'][step]` rồi `t(nextKey!)` không truyền `{room}`.
- Mong đợi: khóa riêng kiểu "Tiếp tục: Giao mã & hoàn tất" (UXD) – nút `ci.submit` chỉ ở bước 4.
- Bằng chứng: `ui/stay.h13-h17.spec.ts` TC-L3-001 (E) annotation `observed` "nút bước 3".

### BUG-R2-033 – Nhập giấy tờ người thứ 2 không gắn người vào đơn theo BR-951 (không khớp hồ sơ, không tạo người "Chưa rõ")
- Mức: P2 (sai AC US-043 AC3; danh sách người trong đơn/khai báo thiếu người; cách vòng: `addPartyMember` trước rồi gửi `partyMemberId`) · Môi trường: stack `ottimo-qa-s3a`, ảnh `8ca2a47` · Vai sửa: BE-C (registration) + BE-A (party) + BE-B (guests) · Trạng thái: **Open** – (a) vẫn trượt trên `16941c6` (mục 5: `guest.id_doc_hmac` không được ghi ở đâu); (b) người "Chưa rõ" dời Sprint 4 (ORC 17/10)
- Bước: `qa.fd`, đơn confirmed 2 người lớn (ngày xa); `addGuestDocument` người 2 (`isMain: false`, không `partyMemberId`): (a) số CCCD trùng giấy tờ của khách G ở lần ở trước; (b) số không trùng ai.
- Thực tế: 201, giấy tờ không có `partyMemberId`; `listParty` không thêm người, không khớp G, không tạo người quan hệ "Chưa rõ".
- Mong đợi: EP06 2.2 (`partyMemberId` bỏ trống → server khớp theo BR-951: số giấy tờ → SĐT → email → tên + ngày sinh; không khớp → người mới quan hệ `unknown`), US-043 AC3.
- Gốc: `registration.service.ts:413–489` lưu nguyên `input.partyMemberId` (dòng 474), không có bước khớp/tạo người.
- Bằng chứng: `api/checkin.s3.api.spec.ts` TC-L3-032 (`test.fail`).

### BUG-R2-034 – "Cần chú ý" không có mục khai báo / thị thực (`registration_due`, `registration_overdue`, `visa_expiring`)
- Mức: P2 (sai AC US-025 AC4, US-044 AC4, US-050 AC2 – lễ tân không được nhắc hồ sơ sắp/quá hạn khai báo và thị thực sắp hết; nhãn hạn ở H14 vẫn đúng) · Vai sửa: BE-C (nguồn dữ liệu) + BE-A (`registerAttentionSource`) · Trạng thái: **Closed** (17/10 – QA kiểm lại trên cây làm việc = `16941c6`, mục 5)
- Bước: ⏱ D 10:00 `qa.fd` nhận phòng đơn khách NN khai báo `review` → `GET /attention`; TC-L3-037: thị thực hết trước ngày đi.
- Thực tế: 200 `data: []` (không có 3 loại trên; enum `AttentionItem.kind` đã có).
- Mong đợi: EP06 mục 1 ("quá hạn → Cần chú ý", BR-907) và bảng 3.1.
- Gốc: `frontdesk/internal/attention-sources.ts:145` không có nguồn khai báo; `outputs/BE/s3-be-c.md` mục 6 ghi "làm đợt sau".
- Bằng chứng: `clock/checkin.s3.clock.spec.ts` TC-L3-004, TC-L3-037, TC-L3-054 (`test.fail`).

### BUG-R2-035 – Job J5 `registration.deadline` chưa đăng ký: không nhắc hạn, không thông báo tổng hợp 22:00/07:00 (BR-611)
- Mức: **P1** (test-strategy mục 8: "job theo giờ không chạy (… không nhắc khai báo)" = P1; sai AC Must US-042 AC2; hồ sơ khai báo có thể trễ hạn pháp lý mà không ai được nhắc – QA chính nâng từ đề xuất P2; nhãn `deadlineLabel`/`isOverdue` tính lúc đọc vẫn đúng ở mọi mốc) · Vai sửa: BE-C (+ BE-A worker) · Trạng thái: **Closed** (17/10 – QA kiểm lại trên cây làm việc = `16941c6`, mục 5)
- Bước: `POST /__test__/jobs/registration.deadline/run` → 404; log worker chỉ có `hold.expire`, `log.partitions`, `ooo.activate`, `payment.expire`, `retention.purge`.
- Mong đợi: architecture 9.1 J5 `registration.deadline` ở R2; BR-611 (thông báo cho FD + MGR lúc 22:00 và 07:00, không gửi trùng – `job_run`).
- Gốc: `worker.ts:20–38`, `registration/public/worker-jobs.ts` chỉ đăng ký J16.
- Bằng chứng: TC-L3-044, TC-L3-046, TC-L3-048 (`test.fail`).

### BUG-R2-036 – J16 chặn lượt chạy 55 phút → ảnh của khách không đồng ý có thể còn quá hạn trên 24 giờ sau `confirmed` (khi lệnh xóa ngay bị lỗi)
- Mức: **P2** (QA quyết – TC ghi "ảnh còn sau mốc = P0" nhưng chỉ xảy ra khi bước xóa ngay K6 đã lỗi, trễ tối đa ~55 phút; vẫn là vi phạm hạn trên SEC M3 / BR-609-01) · Vai sửa: BE-C · Trạng thái: **Closed** (17/10 – QA kiểm lại trên cây làm việc = `16941c6`, mục 5)
- Bước: khai báo confirmed D 15:20 (BR-609-01); giả lập "xóa ngay bị lỗi" (đổi `consent_record` → refused trên DB stack dùng một lần); ⏱ D+1 15:19 ▶ J16 → `done`, `t01Images: 0` (đúng); ⏱ D+1 15:20 ▶ J16 → `{"status":"done","stats":{"skipped":true}}`.
- Thực tế: `getDocumentImage` vẫn 200 sau mốc confirmed + 24 giờ.
- Mong đợi: BR-609-01 `purgeBackstopBy` = confirmed + 24 giờ; EP06 6.1 `id_image_purge_max_hours`.
- Gốc: `retention.service.ts:25, 46–51` (chặn 55 phút) cùng `cutoff = now − maxHours` (dòng 72). Đề xuất: `cutoff = now − (maxHours − 1 giờ)` hoặc bỏ chặn 55 phút cho T01.
- Bằng chứng: TC-L3-039 (`test.fail`).

### BUG-R2-037 – Gia hạn vượt hạn thị thực không bị chặn mềm (thiếu 422 `VISA_EXPIRES_BEFORE_DEPARTURE`)
- Mức: **P1** (luồng chính – gia hạn – sai quy tắc nghiệp vụ, không trực tiếp sai tiền: khách NN có thể ở quá hạn thị thực mà lễ tân không bị chặn mềm/nhắc; rủi ro pháp lý cho cơ sở – QA chính nâng từ đề xuất P2) · Vai sửa: BE-A · Trạng thái: **Closed** (17/10 – QA kiểm lại trên cây làm việc = `16941c6`, mục 5)
- Bước: ⏱ D 14:30 khách NN thị thực đến D+3, đơn D→D+2 đang ở, khai báo `scanned`; `extend {nights: 2, visaWarningAckReason}` → 200 (đúng); rồi `extend {nights: 1}` không lý do (ngày đi mới D+5 > hạn thị thực).
- Thực tế: 200, gia hạn được ghi. Mong đợi: 422 `VISA_EXPIRES_BEFORE_DEPARTURE` (OpenAPI 0.3.6, mô tả `visaWarningAckReason`; EP03-05 E04-01).
- Gốc: `stay.service.ts:244` đọc `visaWarningAckReason` nhưng không kiểm hạn thị thực; mã lỗi không có trong `src`.
- Bằng chứng: TC-L3-054 (`test.fail`); phần ngày đi khai báo = hạn thị thực (BR-605-02) đạt.

### BUG-R2-038 – Điều kiện "Đã thu đủ" không cộng phụ thu nhận sớm / đêm B9a sắp ghi
- Mức: P2 (sai EP03-05 1.3; nhận phòng xong còn nợ phụ thu, chỉ chặn khi trả phòng) · Vai sửa: BE-A · Trạng thái: **Deferred** – 0.3.7 (`checkIn.payment`, `CheckInPreview.amountDueAtCheckinVnd` – OpenAPI 0.3.6 bổ sung 3); tới lúc đó B18 chặn `BALANCE_DUE` nên không mất tiền
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
- Mức: P3 (rack hiện OC/VC trong khi buồng thực tế OD/VD sau nhận/trả phòng – lệch với H13 `previewCheckIn`; dọn buồng là Sprint 4) · Vai sửa: BE-A · Trạng thái: **Closed** (17/10 – QA kiểm lại trên cây làm việc = `16941c6`, mục 5)
- Gốc: `rack.service.ts:248` vẫn suy trạng thái theo dữ liệu hôm nay, không đọc bảng `room_status` (SM-03, Sprint 3).
- Bằng chứng: quan sát của QA ở TC-L3-002/005 (đọc `room_status` qua DB stack dùng một lần) so với `getRack`.

### BUG-R2-041 – Hóa đơn công ty không gắn vào hồ sơ khách
- Mức: P2 (sai AC US-039 AC2 – lần sau phải nhập lại; thông tin vẫn trên folio) · Môi trường: stack `ottimo-qa-s3b`, ảnh `8ca2a47` · Vai sửa: BE-B · Trạng thái: **Closed** (17/10 – QA kiểm lại trên cây làm việc = `16941c6`, mục 5)
- Bước: `qa.fd` `PUT /folios/{id}/invoice-request` `{buyerType: company, companyName, taxCode: '0312345678', email}` → `GET /guests/{booker}`.
- Thực tế: 200; `Folio.invoiceRequest` đủ, `Guest` không có `companyName`/`taxCode`. Mong đợi: EP03-05 5.4 "gắn folio + hồ sơ khách (D16)".
- Gốc: `folio/internal/bill.service.ts:208–253` `setInvoice` chỉ ghi bảng `invoice_request`. Bằng chứng: `api/stay-checkout.s3.api.spec.ts` TC-L4-059 (`test.fail`).

### BUG-R2-042 – Sale không ghi được cọc giữ chỗ của chính mình (`recordPayment` trần = 0)
- Mức: P2 (sai AC US-119 AC4 / A33 `own_deposit_only`; cách vòng `confirmDeposit`) · Vai sửa: BE-B (ARC chốt trần) · Trạng thái: **Closed** (17/10) – kiểm lại trên ảnh `229db99`: TC-L4-063 `qa.sal` ghi cọc 500.000 cho giữ chỗ của mình → 201 `reconciliation=pending`; G2 → 404, CTV → 403 vẫn đạt; bỏ `test.fail` có điều kiện
- Bước: `qa.sal` `saveQuote` + `createHoldFromQuote` (G1) → `POST /folios/{G1}/payments` `{type: deposit, method: bank_transfer, amountVnd: 500000}`.
- Thực tế: 422 `amountVnd: AMOUNT_TOO_HIGH`, `max: 0`. Mong đợi: ghi được cọc ≤ cọc còn thiếu (BR-305), như `createVietQr` trên cùng đơn.
- Gốc: `payments/public/payment.service.ts:283–290` lấy trần = `balanceDueVnd` (folio giữ chỗ = 0), khác `payments.service.ts:665–674`. Bằng chứng: TC-L4-063 (`test.fail`); G2 → 404, khoản không phải cọc → 403, CTV → 403 đều đạt.

### BUG-R2-043 – Số thẻ ở mã chuẩn chi bị chặn nhưng sai mã lỗi
- Mức: P3 (số thẻ không được lưu – R-PAY-01 đạt; chỉ thông báo sai) · Vai sửa: BE-B · Trạng thái: **Closed** (17/10 – QA kiểm lại trên cây làm việc = `16941c6`, mục 5)
- Bước: `recordPayment` `{method: card_pos, posAuthCode: '4111111111111111'}` → 422 `posAuthCode: TOO_LONG`. Mong đợi: `CARD_NUMBER_DETECTED` (EP03-05 2.2, V-09) để giao diện báo "không nhập số thẻ".
- Gốc: `payments/internal/payments.controller.ts:48` zod `max(12)` chạy trước kiểm V-09. Bằng chứng: TC-L4-066 (`test.fail`).

### BUG-R2-044 – Đơn "OTA thu hộ": tiền phòng bị tính vào "Còn phải thu"
- Mức: **P0** (sai tiền – test-strategy mục 8: "Lỗi tiền … mặc định P0": "Còn phải thu"/bill của mọi đơn `ota_prepaid` cộng cả tiền phòng OTA đã thu → lễ tân có thể thu khách lần 2; trả phòng bị `409 BALANCE_DUE`; cách vòng ghi tay `recordPayment method=ota_collect` dễ sót) · Môi trường: `ottimo-qa-s3b` (`8ca2a47`), kiểm lại trên `ottimo-qa-s3` (`a297273` + infra) · Vai sửa: BE-B (+ cổng BE-A) · Trạng thái: **Closed** (17/10) – kiểm lại trên ảnh `229db99` (BE-B `syncOtaCollect`, DOM BE-13): TC-L4-061 `paidViaOtaVnd` = tiền phòng, `balanceDueVnd` = giặt ủi 75.000 (BR-507-01); TC-L4-046 Airbnb + minibar → "Còn phải thu" 50.000; TC-L4-047 Booking + trả muộn → chỉ còn phụ thu 238.000; 2 lượt chạy đủ đạt. Bỏ `test.fail` có điều kiện (hồi quy sẽ báo đỏ). P0 đóng trong round – **không lập ESC**
- Bước: đơn Booking `ota_prepaid` 3 × 820.000 → `getFolio`: không có khoản `ota_collect`, `paidViaOtaVnd` 0, `balanceDueVnd` 2.460.000; thêm giặt ủi 75.000 → 2.535.000 (mong đợi 75.000); Airbnb `in_house` + minibar 50.000 → summary 870.000 (mong đợi 50.000); Booking có phụ thu trả muộn 238.000 → 998.000 (mong đợi 238.000).
- Mong đợi: BR-307 (oracle BR-307-01: `balanceDueVnd` 0, nhãn "Đã thu qua OTA"), US-119 AC2, US-036 AC3.
- Gốc: build không sinh khoản thu hệ thống `ota_collect`; `folio.service.ts:228` chỉ cộng "đã thu qua OTA" từ khoản đó. Bằng chứng: TC-L4-061 (api), TC-L4-046, TC-L4-047 (clock) – `test.fail`.

### BUG-R2-045 – "Tiết kiệm phí kênh" khi gia hạn đơn OTA chỉ tính 1 đêm
- Mức: P2 (con số tiền hiển thị để lễ tân tư vấn khách sai; không ghi folio) · Vai sửa: BE-A (+ARC: hợp đồng 1 số, chưa nói theo số đêm) · Trạng thái: **Closed** (17/10 – QA kiểm lại trên cây làm việc = `16941c6`, mục 5)
- Bước: đơn Airbnb căn 301 `in_house` → `GET /extension-options`. Thực tế: `channelFeeSavingsVnd` = 148.000 (15,5 % × 1 đêm), trong khi `repricing[]` 2 đêm = 1.916.000. Mong đợi: BR-422-01 (2 đêm 2.084.000 → 323.000; với 301 là 297.000).
- Gốc: `frontdesk/internal/stay.service.ts:215`. Bằng chứng: TC-L4-003 (`test.fail`); đơn con kênh Trực tiếp 1.042.000, chung folio, đơn OTA gốc không đổi – đạt.

### BUG-R2-046 – Quản lý không duyệt/tự áp được FOC phụ thu trong hạn mức "≤ 1 đêm" (FOC dòng phát sinh thiếu `limitBasisVnd`)
- Mức: **P1** (phân quyền sai ở hành động duyệt tiền + luồng chính "FOC có duyệt" của A1: mọi FOC phụ thu > 300.000 hoặc do quản lý gửi dồn lên chủ đầu tư; cách vòng: OWN duyệt) · Môi trường: `ottimo-qa-s3b`, `ottimo-qa-s3c` (`8ca2a47`) · Vai sửa: BE-A (approvals) + BE-B (folio) · Trạng thái: **Closed** (17/10 – QA kiểm lại trên cây làm việc = `16941c6`, mục 5)
- Bước: ngày ảo D, đơn Trực tiếp 700.000 thu đủ; nhận phòng 08:00 phụ thu 350.000; `setLateCheckout 17:00` 350.000. (1) `qa.fd` `requestFoc` 301.000 trên dòng `late_checkout` → 201 `requiredRole: owner`; `qa.fdl` duyệt → 403 `APPROVAL_LIMIT_EXCEEDED {approver: owner}`. (2) `qa.mgr` `requestFoc` 50.000/210.000 (có xác thực lại) → `pending`, `requiredRole: front_desk_lead`; `qa.mgr` tự duyệt → 403, yêu cầu `escalated` lên owner. (3) FOC 400.000 trên dòng `service_fee` 500.000 → `qa.mgr` duyệt → 403 `{approver: owner}`.
- Mong đợi: BR-433 "Quản lý ≤ giá 1 đêm/lần" (`foc_limits.manager = one_night_rate`), oracle BR-433-02 `escalateTo: manager`; SM-10 A2(a) MGR/OWN tự áp trong hạn mức.
- Gốc: `folio/internal/foc.service.ts:140` `limitBasisVnd: line.category === 'room' ? line.unit_price_vnd : null` → `approvals/internal/limits.ts:73, 78–79` coi như vượt → bỏ cấp manager; `frontdesk/internal/stay-support.ts:417–428` (FOC từ trả muộn/nhận sớm) không truyền basis. Hướng sửa: basis = giá đêm liên quan (đêm cuối – trả muộn; đêm đầu – nhận sớm; đêm của ngày dịch vụ – dòng khác).
- Bằng chứng: `clock/approvals-foc.s3.clock.spec.ts` TC-NT-029 (b), TC-NT-030 (b), TC-NT-036 (a); `clock/stay-checkout.s3.clock.spec.ts` TC-L4-056 – `test.fail`.

### BUG-R2-047 – Gia hạn không chuyển buồng sang OD
- Mức: P2 (trạng thái buồng sai → buồng phòng không biết dọn phòng khách đang ở; dọn buồng Sprint 4) · Vai sửa: BE-A · Trạng thái: **Closed** (17/10 – QA kiểm lại trên cây làm việc = `16941c6`, mục 5)
- Bước: đơn khách NN căn 203 `in_house` (OC) → `extendStay` 1 đêm → đọc `room_status` (psql, stack dùng một lần). Thực tế: vẫn OC. Mong đợi: SM-01 B13 "buồng → OD", BR-802.
- Gốc: `frontdesk/internal/stay.service.ts` `extend()` không gọi `roomStatus.set` (chỉ B9/B14/B17/B18 có). Bằng chứng: TC-L4-004 (`test.fail`); ngày đi mới, khai báo `needs_update`, 1 lệnh outbox – đạt.

### BUG-R2-048 – Nhật ký truy cập C3 (`listC3AccessLog`) bỏ qua bộ lọc ngày `from`/`to` của hợp đồng
- Mức: P2 (OWN/MGR rà truy cập giấy tờ theo ngày (S28) nhận toàn bộ nhật ký; dùng `dateFrom`/`dateTo` thì lọc được) · Vai sửa: BE-C (hoặc ARC nếu đổi hợp đồng) · Trạng thái: **Closed** (17/10 – QA kiểm lại trên cây làm việc = `16941c6`, mục 5)
- Bước: `qa.owner` `GET /v1/properties/{p}/c3-access-log?from=2000-01-01&to=2000-01-02&limit=5` → 200 với 5 dòng năm 2030; `?dateFrom=2000-01-01&dateTo=2000-01-02` → 0 dòng. Mong đợi: OpenAPI 0.3.6 tham số `from`/`to`.
- Gốc: `registration/internal/registration.controller.ts:541–542`. Bằng chứng: QA phụ C gọi tay khi viết TC-RB-022 (chưa có ca tự động – thêm ở đợt sau).

### BUG-R2-049 – Harness E2E Sprint 3 của QA lệch thời điểm/ngữ cảnh (đỏ giả)
- Mức: P2 · Vai sửa: QA · Trạng thái: **Closed** (17/10 – 2 lượt chạy đủ trên stack mới, 0 trượt, 0 flaky)
- Nội dung và cách sửa: (1) `stackToday()` trả ngày lịch – từ 00:00 tới 05:59 lệch ngày nghiệp vụ (BR-010) → TC-L2-014/053, TC-L5-005/023, H13 đỏ sau nửa đêm → tính theo mốc 06:00; (2) `platform.api.spec.ts` ghi tham số "tương lai" 2028–2030 rò sang ngày ảo của project clock (`checkin_time` 14:30 làm đỏ TC-L3-010) → dời sang 2090–2092; (3) `isAvailable` dùng chung cookie của ca → thăm dò "ẩn danh" mang phiên → 404 → bỏ qua sai (TC-L4-062) → context riêng; (4) ảnh mẫu PNG hỏng → 422 `FILE_TYPE`; (5) TC-L2-053 (b) còn kỳ vọng `balanceDueVnd` âm (0.3.5) → 0 + `creditVnd` 350.000 (0.3.6 A-34); (6) TC-L5-016 (en) so ngày hết hạn bằng regex lọt "20" của "2026" → so dd/mm/yyyy của (expiresAt − 1 ms); (7) TC-L2-055 chọn ngày dời ngẫu nhiên có lúc ngoài `reschedule_window_months` tính từ ngày đến cũ → chọn trong cửa sổ.

### BUG-R2-050 – Thiếu tệp `apps/guest-web/build/used-keys.ts` trong git → CI đỏ, ảnh `ottimo-web` không build được
- Mức: **P1** (chặn toàn bộ CI: job "format · lint · audit · test · build" đỏ ở Lint, các job `docker images build · E2E smoke`, `publish images`, `deploy staging` bị bỏ; không build được ảnh web từ một checkout sạch – cùng loại BUG-R2-006) · Môi trường: CI run 38940900970 (main, `229db99`, 17/10 00:35); máy QA: `git archive HEAD product` → `docker build -f infra/docker/Dockerfile.web` · Vai sửa: FE (guest-web) + OPS (`.gitignore`) · Trạng thái: **Closed** (17/10 – QA kiểm lại trên cây làm việc = `16941c6`, mục 5)
- Bước tái hiện: (1) checkout sạch `229db99` (hoặc `git archive HEAD product | tar -x`); (2) `pnpm --filter @ottimo/guest-web typecheck` hoặc `docker build -f infra/docker/Dockerfile.web .`.
- Thực tế: CI: `src/__tests__/guard.test.ts(5,33): error TS2307: Cannot find module '../../build/used-keys'` và `vite.config.ts(7,44): error TS2307: Cannot find module './build/used-keys'`; docker: `vite.config.ts:7:43: ERROR: Could not resolve "./build/used-keys"` → `turbo run build` exit 1. Trên máy dev tệp có thật (`apps/guest-web/build/used-keys.ts`, 1.972 byte, 16/10 23:41) nhưng `git check-ignore -v` → `.gitignore:16:build/` nên không được commit.
- Mong đợi: checkout sạch build/typecheck/test xanh; tệp nguồn của build nằm trong git.
- Gốc: `apps/guest-web/vite.config.ts:7` `import { collectUsedKeys, isShipped } from './build/used-keys'`; thư mục tên `build/` trùng mẫu bỏ qua của `.gitignore` gốc. Hướng sửa: đổi thư mục (ví dụ `apps/guest-web/tools/`) hoặc thêm ngoại lệ `!apps/guest-web/build/` và commit tệp.
- Bằng chứng: `gh run view 38940900970 --log-failed`; log build ảnh của QA (`docker build` web exit 1). QA build tiếp bằng cách chép tệp từ cây làm việc vào nguồn build (ghi trong báo cáo S3 mục 2).

### BUG-R2-051 – SR-RL-09 (600 request/phút/người): bộ đếm riêng trong `AuthGuard` không xóa được, không cấu hình được, chạy theo MutableClock
- Mức: P2 (người dùng thật không chạm 600/phút; nhưng (a) mọi stack có MutableClock – dev, CI, staging dùng tua giờ – sau khi tua đồng hồ về hiện tại thì người dùng đã chạm ngưỡng ở giờ ảo bị khóa toàn bộ API ≈ 7,8 năm, chỉ hết khi khởi động lại api; (b) E2E dùng chung tài khoản `qa.*` giữa các worker song song chạm 429 ở api/rbac/UI – có cách vòng: harness chờ `Retry-After`, chạy lại) · Môi trường: ảnh `229db99`, stack `ottimo-qa-s3` · Vai sửa: BE-B (guard chung; BE-A phần SSE) + OPS (CI) · Trạng thái: **Closed** (17/10 – QA kiểm lại trên cây làm việc = `16941c6`, mục 5)
- Bước tái hiện: (1) chạy project `clock` (tua giờ ảo tới năm 2029+, `qa.fd`/`qa.owner` gọi > 600 lần trong một phút ảo); (2) `resetClock` (về giờ thật); (3) `GET /v1/me` bằng phiên `qa.fd`; (4) `POST /__test__/rate-limits/reset` rồi gọi lại.
- Thực tế: (3) `429 RATE_LIMITED`, `Retry-After: 247743660` (cả `qa.owner`); (4) vẫn 429 – reset không chạm bộ đếm này. Chạy project `api` ngay sau `clock`: 61 ca đỏ vì 429. Trong lượt chạy như CI (song song api + rbac + desk-chromium): 15 lần harness phải chờ 42–56 giây, 2–4 ca UI flaky (trình duyệt `qa.fd` nhận "Bạn đã thử quá nhiều lần. Chờ 1 phút rồi thử lại.").
- Mong đợi: SR-RL-09 vẫn đúng 600/phút/người, nhưng (a) cửa sổ tính theo giờ thật của tiến trình hoặc tự mở lại khi `now < bắt đầu cửa sổ` (đồng hồ lùi); (b) dùng chung `RATE_LIMITER` của module identity để `/__test__/rate-limits/reset` (chỉ có ở ảnh test) xóa được như mô tả của route ("in-memory windows … cleared for the whole process"); (c) tùy chọn `staffRequestsPerMinute` ("tests may raise it") nối được từ cấu hình test/dev.
- Gốc: `shared/http/auth.guard.ts:174–200` `this.limiterRef ??= new RateLimiter(this.clock)` (thể hiện riêng, đồng hồ CLOCK), `main.ts:53–56` không truyền `staffRequestsPerMinute`; `test-support.module.ts:241` chỉ `resetAll()` thể hiện `RATE_LIMITER`.
- Bằng chứng: `curl /v1/me` (phiên `qa.fd`) sau project clock → 429 `retry-after: 247743660`; log harness `[e2e] SR-RL-09 429 … → chờ N giây (BUG-R2-051)` trong báo cáo JSON. Cách vòng của QA: `support/api.ts call()` chờ `Retry-After` ≤ 65 giây (tối đa 2 lần) rồi gửi lại cùng request; thứ tự project giữ `clock` gần cuối.

### BUG-R2-052 – Khách đến sau nửa đêm của ngày đến bị coi là nhận sớm trước 06:00 → không nhận phòng được
- Mức: **P1** (luồng chính nhận phòng A1 bị chặn cho khách đến khuya – xe/chuyến bay đêm tới Đà Lạt thường gặp – suốt 00:00–05:59; cách vòng khó đoán: gõ giờ nhận ≥ 14:00 trong ngày nghiệp vụ kèm ghi chú; thêm đêm trước (B9a) bị 409 nên không sai tiền) · Môi trường: ảnh `229db99`; clock (giờ ảo 01:30 ngày D+1) và giao diện H13 Chromium lúc 01:15 giờ thật 17/10 · Vai sửa: BE-A (+ FE: thông báo lỗi trường `addPriorNight`) · Trạng thái: **Closed** (17/10 – QA kiểm lại trên cây làm việc = `16941c6`, mục 5)
- Bước tái hiện: (1) đơn Trực tiếp đến D đã thu đủ, có giấy tờ; (2) đồng hồ 01:30 ngày D+1 (ngày nghiệp vụ vẫn D – BR-010); (3) `GET previewCheckIn` → `earlyCheckinSurcharge.amountVnd = 0`; (4) `POST checkIn {cardsIssued: 1, houseRulesSent: true}` (không gõ giờ – như H13 khi không bật "Khách nhận sớm").
- Thực tế: (4) 422 `VALIDATION_FAILED` `errors: [{field: addPriorNight, code: REQUIRED}]`; H13 bước 4 hiện alert "Bắt buộc", không có hướng dẫn, không nhận phòng được (TC-L3-001 (E) chạy lúc 01:15). `a297273` nhận phòng được (TC-L3-008 đạt) – lỗi mới của bản sửa B9a.
- Mong đợi: B9 thường, không phụ thu, `actualCheckinAt` = 01:30 D+1, hạn khai báo theo BR-602-02 / BR-603-04 (US-025 AC6; OpenAPI checkIn: B9a chỉ khi ngày nghiệp vụ = ngày đến − 1).
- Gốc: `frontdesk/internal/checkin.service.ts:143–145` khi không gõ giờ dùng giờ server (01:30) → `earlyCheckinSurcharge` coi 01:30 là trước mốc 06:00 (`addsPreviousNight=true`) mà không xét ngày lịch đã sau ngày đến; dòng 386–387 đòi `addPriorNight`. Preview (dòng 145) dùng giờ chuẩn 14:00 nên báo 0 – hai đường lệch nhau.
- Bằng chứng: `clock/checkin.s3.clock.spec.ts` TC-L3-008 (a) (`test.fail` ở cuối ca, phần (b) B9a vẫn kiểm); `ui/stay.h13-h17.spec.ts` TC-L3-001 (E) (`test.fail` khi giờ stack < 06:00).

### BUG-R2-053 – CI E2E: token thiết bị của seed không đọc được trên runner → `403 DEVICE_NOT_TRUSTED` ở mọi ca C3
- Mức: **P1** (cổng CI E2E đỏ: 28 ca trượt – c3-at-rest, checkin.s3 mục 4.2/4.3, stay-checkout.s3 TC-L4-051/062, UI H13/H14; tệ hơn là **103 ca bị bỏ qua im lặng**: 100 ca RBAC Sprint 3 cần thiết bị + TC-RB-001/002/022 – kết quả "xanh" giả nếu không có các ca đỏ kia; không ảnh hưởng sản phẩm) · Môi trường: CI run 38980363276 (main `c8b83f3`, GitHub-hosted ubuntu, runner uid 1001), job `docker images build · E2E smoke` · Vai sửa: OPS (`.github/workflows/ci.yml`) + QA (harness) · Trạng thái: **Closed** (17/10, cổng QC Sprint 3 – QA kiểm lại trên log CI 38998735861, mục 7.1)
- Gốc (đã tái hiện): `services/api/src/db/seed/ds-e.ts:430–436` ghi `ds-e.map.json` với `{ mode: 0o600 }`; container `seed` chạy bằng user của ảnh `node` (uid 1000); `ci.yml:364–366` tạo `.out` 0777 rồi `docker compose … run --rm seed` → tệp thuộc uid 1000, mode 600; tiến trình Playwright chạy bằng `runner` (uid 1001) → `readFileSync` EACCES; `tests/e2e/support/s3.ts` (bản `c8b83f3`, `deviceToken()` dòng ~211–220) nuốt lỗi trong `catch {}` → `dev()` không gửi cookie `ottimo_did` → 403; `needDevice()`/runner RBAC (`rbac-sprint3.spec.ts:117`) coi là "môi trường" → skip. Không phải giả thuyết (a): SEC-BE-34 chỉ loại phiên `staff_pwa` và Origin ngoài danh sách admin – CI gửi `E2E_ORIGIN=http://localhost:8081` = `API_ADMIN_BASE_URL`, đăng nhập bằng Origin admin → phiên `admin`; stack QA cũng bật danh sách Origin (38081/38082/38083) và qua.
- Tái hiện: (1) Docker volume Linux: ghi tệp bằng `node` uid 1000 với `mode 0o600` đúng như loader, đọc bằng uid 1001 theo đúng logic `deviceToken()` → `EACCES`, `deviceToken() = undefined`. (2) Stack dùng một lần `ottimo-qa-s3`, Origin bật như CI, `chmod 000` tệp map → chạy c3-at-rest, c3-access, checkin.s3.api, rbac-sprint3, ui/stay.h13-h17: **26 trượt `DEVICE_NOT_TRUSTED` + 100 ca RBAC + 3 ca TC-RB bỏ qua** – khớp log CI. (3) Cùng điều kiện sau khi sửa harness: **775 đạt, 0 trượt vì thiết bị**, RBAC S3 737/737 không bỏ qua; global-setup in cảnh báo rõ nguyên nhân.
- Sửa: OPS (cây làm việc): `ci.yml` bước "Load QA seed DS-E" chạy `run --rm --user "$(id -u):$(id -g)" seed`, `.out` 0700, `test -r …/ds-e.map.json || exit 1`. QA (`e3959ec` + cây làm việc): `tests/e2e/support/device.ts` – đọc map và phân biệt ENOENT/EACCES; `global-setup.ts` kiểm token thiết bị, không đọc được thì đăng ký thiết bị quầy dự phòng qua `qa.owner` (trustCurrentDevice, xác thực lại – cùng đường của project clock) và in `CẢNH BÁO … BUG-R2-053`; trên CI cả hai cách đều hỏng → dừng ở global-setup với một thông báo thay vì ~30 ca đỏ + skip im lặng.
- Kèm theo (cùng run): TC-L7-010 (E) flaky – lần click "Chụp" đầu chưa mở hộp chọn tệp trên runner chậm → harness thử lại 1 lần (`ui/guest-web.h18.spec.ts` `photo()`).

### BUG-R2-054 – Xóa ảnh khai báo chưa `confirmed` (SR-RET-02) không cập nhật `imagesPurgedAt`/`imagesPurgeReason`
- Mức: P3 (ảnh vẫn bị xóa đúng hạn, nhật ký C3 `purge` và "Cần chú ý" `registration_overdue` có; chỉ thiếu thông tin hiển thị – H14/khai báo không nói ảnh đã xóa lúc nào, vì sao; EP06 6.1 "mỗi lần xóa … `imagesPurgedAt` cập nhật") · Môi trường: stack `ottimo-qa-s3`, api `5304fc8` (cây làm việc 17/10 07:40) · Vai sửa: BE-C (+ ARC thêm giá trị enum) · Trạng thái: **Open**
- Bước: TC-L3-074 – (a) khai báo `sent` (chưa `confirmed`), trả phòng D+1 10:30; (b) khai báo `sent`, hủy đơn D 15:00; ⏱ mốc + 7 ngày + 1 phút ▶ J16 → `GET registrations/{id}`.
- Thực tế: ảnh đã xóa (`getDocumentImage` 404, `imageIds` rỗng, `c3_access_log` purge system), nhưng `imagesPurgedAt`, `imagesPurgeReason` vắng mặt.
- Mong đợi: `imagesPurgedAt` = thời điểm xóa, `imagesPurgeReason` có giá trị (hợp đồng chưa có giá trị cho trường hợp này: enum `[retention, no_consent, consent_withdrawn, guest_request, void]` – ARC chọn thêm `unconfirmed` hoặc ánh xạ).
- Gốc: `registration/internal/registration.service.ts:118–124` `SUMMARY_REASONS` không có `unconfirmed` → dòng 435–439 không ghi `images_purged_at`; OpenAPI `Registration.imagesPurgeReason` (≈ dòng 9584) thiếu giá trị.
- Bằng chứng: `clock/checkin.s3.clock.spec.ts` TC-L3-074 (`test.fail` ở bước cuối; các bước còn ảnh ngày 6 / mất ảnh ở hạn + 1 phút / hủy khi `sent` không `void` đều đạt).

> **BUG-R2-055…061 – quy ước chung (cổng QC Sprint 3, 17/10).** Nguồn: kiểm chứng đối kháng vòng 4–8 (`reviews/s3-round4…8-verification.md`, chạy trên PostgreSQL thật hoặc code thật + SQL giả lập như ghi ở từng mục) và lượt tái hiện của QA (BUG-R2-061). Mã nguồn đối chiếu: `6af7173` (= `product/` của HEAD). **Mức:** test-strategy mục 8 – "sai tiền" là P0, "lỗi tiền … mặc định P0 cho đến khi chứng minh không ảnh hưởng tiền"; protocol mục 6 (Blocker = sai tiền) và mục 9 (P0 = sai tiền). Mức **không** hạ vì đường đi hiếm hay chỉ qua API: API là sản phẩm, và Sprint 4 sẽ mở thêm nút trên Desk (S4-25*). **Đường đi** = nơi người dùng thật với tới được hôm nay (Desk / chỉ API). **Tần suất** = ước lượng định tính của QA theo điều kiện cần có, chưa có số liệu vận hành. **Hạn:** trước cổng QC Sprint 4 (decision-log ORC 17/10 – ngoại lệ cổng sprint); còn sót thì cổng cuối Round 2 KHÔNG ĐẠT; P0 không sửa kịp trong Round 2 → QA lập ESC. Mỗi bản sửa phải có test đọc `fixtures/br-examples.json` và qua kiểm chứng đối kháng lại phần FOC (ĐK-S3-6). Môi trường chung: code `6af7173`, CI 38998735861 xanh (không ca nào phủ các kịch bản này).

### BUG-R2-055 – FOC lớn hơn giá đêm mới trên đơn có người chốt → đổi đơn trả 500 (S4-01, kèm S4-03)
- Mức: **P1** (không sai tiền – giao dịch rollback sạch, s3-round6 "repro C"; nhưng B14/B7/B13 trên đơn đó bị chặn bằng `500 INTERNAL_ERROR` "Máy chủ đang gặp sự cố", không có cách vòng trên Desk – test-strategy P1 "cách vòng rất tốn công") · Vai sửa: BE-B · Trạng thái: **Open** – S4-01 (+S4-03) · Hạn: trước cổng QC Sprint 4 (decision-log ORC 17/10)
- Đường đi: **chỉ API** – cần FOC trên đêm phòng (`requestFoc` dòng `room`), Desk chỉ xin FOC phụ thu nhận sớm (`CheckInPage.tsx:234`). Tần suất: hiếm (đơn CTV/sale + FOC đêm phòng + giá đêm mới < FOC).
- Bước (ví dụ BR-434): đơn Trực tiếp có người chốt `qa.ctv1`, đêm 202 giá 792.000, FOC 100 % 792.000 đã duyệt → khách xin B14 sang căn giá 700.000 (hoặc B7 kéo dài làm hạ bậc BR-107, hoặc B13 trên đơn FOC 100 %).
- Thực tế: `500 INTERNAL_ERROR`; log `RangeError: allocate: weights must be non-negative safe integers`; đơn giữ nguyên. Đơn không có người chốt: đúng (FOC 700.000, khách trả 0).
- Mong đợi: 200; FOC mới = min(792.000, 700.000) = 700.000, khách trả 0 (BR-434); hoa hồng tính trên doanh thu phòng sau FOC.
- Gốc: `frontdesk/internal/stay.service.ts:970` ghi `room_revenue_vnd = giá mới − discount_vnd` (FOC cũ) → âm; `folio/public/folio.service.ts:1794-1799` (`syncCommission`) lấy `roomRevenueVnd` làm trọng số `allocate` (`folio/public/allocate.ts:13` ném lỗi, không map). Nghi vấn chưa chạy: phân bổ phí kênh `folio.service.ts:1901` dùng cùng trọng số → đơn OTA trả tại chỗ có FOC có thể gặp cùng lỗi.
- Kèm (S4-03, Minor tiền hoa hồng): sau B8 dời FOC, base hoa hồng còn tính trên đêm đọc trước khi chuyển FOC (2.000.000 thay vì 1.700.000 – s3-round6 repro H), đúng lại ở lần đồng bộ sau; trả phòng có gọi `resyncStay` (`checkout.service.ts:650`) nên QA chưa thấy đường hoa hồng chốt sai – QA kiểm lại khi sửa (đọc lại đêm sau khi chuyển FOC).
- Bằng chứng: `reviews/s3-round6-verification.md` FOC-RESYNC phản chứng 2 + Minor (b); critic: Major-defer-S4.

### BUG-R2-056 – FOC đi theo dòng mới lấy min(FOC đang có) thay vì min(số đã duyệt); FOC mất hẳn khi phụ thu về 0 rồi tăng lại (S4-02 + mở rộng)
- Mức: **P0** (sai tiền – khách trả thừa phần FOC đã được duyệt) · Vai sửa: BE-B · Trạng thái: **Open** – S4-02 (gồm mở rộng s3-round8) · Hạn: trước cổng QC Sprint 4 (decision-log ORC 17/10)
- Đường đi: **chỉ API** (FOC trên đêm phòng/phụ thu người). Tần suất: hiếm (≥ 2 lần đổi giá ngược chiều trên cùng đêm có FOC).
- Bước / thực tế: (a) FOC 100 % trên đêm 1.000.000; đổi giá đêm xuống 900.000 (FOC → 900.000, đúng) rồi lên lại 1.000.000 → FOC giữ 900.000, khách trả 100.000 (s3-round6 repro D); phụ thu người 150.000 → 100.000 → 200.000 → FOC còn 100.000 (repro G). (b) Mở rộng: căn 302, 4 người lớn, FOC 150.000 trên phụ thu ngày 20/01; sửa số khách 3 NL + 1 trẻ (FOC 100.000, đúng) → 2 NL (phụ thu 0, FOC hủy) → 4 NL: phụ thu 150.000 × 3 quay lại, FOC **không** quay lại – tổng 2.901.000 (s3-round8 N11, PostgreSQL thật).
- Mong đợi: BR-434 – FOC mới = min(**số đã duyệt** = số trên yêu cầu duyệt, giá trị dòng mới); ngày 20/01 vẫn là ngày giữ → (a) FOC 1.000.000, khách trả 0; (b) tổng **2.751.000**.
- Gốc: `folio/public/folio.service.ts:1486` `Math.min(-r.amount_vnd, left)` lấy số của dòng FOC đang có; phụ thu về 0 → `wanted` không có ngày đó (`:1337-1362`) → dòng và FOC bị đảo, lần đồng bộ sau không còn dòng FOC nào để mang theo. Sửa phải đọc số đã duyệt từ `approval_request` (kể cả khi dòng FOC đã bị đảo) – kèm test 4A→2A→4A.
- Bằng chứng: `reviews/s3-round6-verification.md` Minor (a); `reviews/s3-round8-verification.md` mny-2 / N11; DOM 17/10 "số đã duyệt" (decision-log, BR-434).

### BUG-R2-057 – B14 đơn OTA đổi phòng nhiều lần: chênh lệch BR-424 cộng dồn, không so căn gốc (S4-05)
- Mức: **P0** (sai tiền – thu thừa 500.000 trong ví dụ) · Vai sửa: BE-A · Trạng thái: **Open** – S4-05 · Hạn: trước cổng QC Sprint 4 (decision-log ORC 17/10) – **sửa trong tuần đầu Sprint 4** (thứ tự ORC: S4-28 → S4-07, S4-05 → …)
- Đường đi: **Desk** – "Đổi phòng" khách đang ở (H15, `StayDialogs.tsx:465` → `changeRoom`). Tần suất: hiếm (đơn OTA đang ở, khách xin đổi ≥ 2 lần, có lần quay về căn rẻ hơn) – nhưng lễ tân không được báo gì: bản xem trước chỉ hiện chênh lệch của lần đổi hiện tại.
- Bước: Agoda 203, 01–04/05 giá 900.000, đơn con Trực tiếp 04–06; giá Trực tiếp 203 = 792.000, 401 = 1.042.000; mọi lần đổi `guest_request`. (1) Ngày 02 đổi 203→401; (2) cùng ngày quay lại 203; (3) ngày 03 đổi 203→401.
- Thực tế: chênh lệch đã ghi: đêm 02 = 250.000, đêm 03 = 500.000 → **750.000**.
- Mong đợi: DOM 17/10 (2) + BR-424: so với **căn gốc** (căn gán lúc nhận phòng, trước nâng hạng do OTTIMO), mỗi lần đổi đảo dòng chênh lệch từ đêm đổi và ghi lại max(0, giá Trực tiếp căn mới − căn gốc), không cộng dồn → đêm 02 = 0 (ngủ ở 203), đêm 03 = 250.000 → **250.000**.
- Gốc: `frontdesk/internal/stay.service.ts:809-820` `otaDiffs` = max(0, direct(căn mới) − direct(căn **hiện tại** của đêm)); `:1061-1082` chỉ ghi thêm dòng `room_change_difference`, không đảo dòng cũ; chỉ B16 đảo loại dòng này.
- Bằng chứng: `reviews/s3-round5-verification.md` B14-STAY (script `scratchpad/r5/b14-stay-repro.ts`, `StayService.changeRoom` thật + folio giả lập); decision-log DOM 17/10 (2).

### BUG-R2-058 – B7/B7a đổi/gán căn khác định mức không tính lại phụ thu người (S4-07)
- Mức: **P0** (sai tiền cả hai chiều: thu thừa khi OTTIMO nâng hạng, thất thu khi khách xin xuống căn nhỏ) · Vai sửa: BE-A · Trạng thái: **Open** – S4-07 · Hạn: trước cổng QC Sprint 4 (decision-log ORC 17/10) – **sửa trong tuần đầu Sprint 4**
- Đường đi: **Desk** – dời căn/ngày (`ReservationDialogs.tsx:695` → `moveReservation`), gán căn (`:1152` → `assignRoom`). Tần suất: **thường gặp nhất trong nhóm lỗi tiền này** – xếp lại căn trước ngày đến là việc hằng tuần; chỉ cần đơn có người vượt định mức (gia đình 3–4 người) và căn mới khác định mức (OTTIMO có căn định mức 2, 3, 4). [GIẢ ĐỊNH QA – chưa có số liệu đặt phòng thật]
- Bước / thực tế: (a) 3 người lớn, 2 đêm, 202 (định mức 2, phụ thu 300.000) → nâng hạng `upgrade` sang 302 (định mức 3): phụ thu giữ 300.000; (b) ngược lại khách xin 302 → 202: phụ thu giữ 0; (c) Agoda trả trước căn 101, "khách báo trực tiếp" 3 người lớn (150.000 × 3 đêm), dời 101 → 102 → 301 (định mức 4): phụ thu vẫn 150.000 × 3, tổng **2.400.000** (s3-round8 N16, PostgreSQL thật); (d) đơn OTA chưa gán căn: PATCH "khách báo trực tiếp" có `baseOccupancy` null → không bao giờ có phụ thu.
- Mong đợi: BR-429 (bổ sung 17/10, ví dụ trong BR): tính lại **từng đêm** theo nguyên nhân – `guest_request` theo định mức căn mới; do OTTIMO (`property_fault`, `overbooking`, `upgrade`, `inventory_optimize`, B7a đơn xung đột) lấy min(cũ, mới); OTA tính trên max(định mức, số khách OTA); giá đêm giữ nguyên, bộ đồ dùng theo căn mới → (a) **0**; (b) **300.000**; (c) **2.100.000**.
- Gốc: `reservations/internal/reservations.service.ts:2639` `move` chỉ đổi `room_id`; `:3024` `assignRoom` không đồng bộ tiền; phụ thu từng đêm chỉ do `repriceExtraPersons` (`:1350`) ghi khi sửa số khách.
- Bằng chứng: `reviews/s3-round4-verification.md` (E); `reviews/s3-round8-verification.md` N16 (ca đỏ duy nhất của 29 ca tiền vòng 8). Ca kiểm: TC-L2-084 (mới, `tests/test-cases/r1-main-flows.md`).

### BUG-R2-059 – FOC chờ duyệt bị "duyệt" mà không áp; FOC bị hủy theo quy tắc vẫn trừ hạn mức, không audit (S4-18 + mở rộng)
- Mức: **P0** (sai tiền so với quyết định đã duyệt: người duyệt thấy `approved`, khách không được miễn và không ai được báo; kèm lệch hạn mức FOC tháng và báo cáo FOC – BR-433/434). QA không chấp nhận lập luận "tiền folio đúng theo A5": A5 là *từ chối* yêu cầu khi dòng bị đảo, còn build để yêu cầu ở `approved` · Vai sửa: BE-B · Trạng thái: **Open** – S4-18 (gồm mở rộng s3-round8) · Hạn: trước cổng QC Sprint 4 (decision-log ORC 17/10)
- Đường đi: **chỉ API** cho đêm phòng/phụ thu người; cùng cơ chế trên phụ thu trả muộn – xem BUG-R2-061 (c). Tần suất: hiếm (FOC đang chờ duyệt khi dòng đêm bị ghi lại).
- Bước / thực tế: (a) căn 203, 23–26/11, lễ tân xin FOC 300.000 cho đêm 24/11 (chờ duyệt); B7 đổi ngày đi thành 30/11 (7 đêm, giảm theo số đêm 10 % → đêm 24/11 đổi giá, dòng ghi lại); quản lý duyệt: HTTP 200, yêu cầu `approved`, dòng FOC `rejected`, tổng **5.205.000** (s3-round8 X2b, PostgreSQL thật; X2a đối chứng giữ giá → `posted`, 1.703.000 – đúng). Cùng hiện tượng khi B8 dời đơn (s3-round7 (j), FOC-5). (b) Mở rộng: căn 203, 03–06/12 → 04–06/12, FOC 792.000 đã duyệt trên 03/12 bị hủy đúng quy tắc (đêm bỏ không có đêm thêm) – folio đúng 1.822.000 nhưng không có audit `folio.*`, yêu cầu vẫn `approved`, `monthlyApprovedBy` vẫn cộng 792.000 (s3-round8 R1c, N2: 200.000).
- Mong đợi: FOC chờ duyệt đi theo dòng mới khi được duyệt = min(số xin, dòng mới) – hoặc yêu cầu bị hủy/báo người gửi trước khi duyệt và **không** trừ hạn mức (DOM chốt – ĐK-S3-5); FOC bị hủy theo quy tắc có audit `folio.foc_cancelled`, không tính vào hạn mức tháng/báo cáo FOC.
- Gốc: `folio/public/folio.service.ts` – dòng đêm có FOC đang chờ bị đảo trong đồng bộ; `folio/internal/foc.service.ts` (≈ `:184` theo s3-round7) duyệt khi dòng liên quan đã đảo → dòng FOC `rejected` nhưng yêu cầu vẫn `approved`; audit đồng bộ chỉ ghi khi `roomVnd`/`extraPersonVnd`/`reversedVnd` ≠ 0 (`folio.service.ts:1407`) – FOC và dòng đêm triệt tiêu nhau nên không có audit; `approvals/public/approval.service.ts` `monthlyApprovedBy` cộng mọi yêu cầu `approved`.
- Bằng chứng: `reviews/s3-round7-verification.md` FOC-5 / (j); `reviews/s3-round8-verification.md` mny-3 (X2b), code-1 + breg-2 (R1c, N2). Ca kiểm: TC-NT-046.

### BUG-R2-060 – B12 khôi phục no-show làm mất FOC đã duyệt (S4-22)
- Mức: **P0 – tạm, chờ DOM** (khách trả thêm đúng số FOC đã duyệt; test-strategy: lỗi tiền mặc định P0 tới khi chứng minh không ảnh hưởng tiền). DOM chốt "FOC hủy là đúng" → QA đóng "Không sửa (đúng quy tắc)" và ghi lý do · Vai sửa: DOM (chốt quy tắc, ĐK-S3-5) → BE-B · Trạng thái: **Open** – S4-22 · Hạn: DOM chốt trước; sửa trước cổng QC Sprint 4 (decision-log ORC 17/10)
- Đường đi: **chỉ API** (FOC đêm phòng trước ngày đến) + khôi phục no-show (Desk có). Tần suất: rất hiếm (FOC trước khi đến → no-show → khôi phục).
- Bước: căn 103, 07–09/12, FOC 300.000 trên đêm 07/12 (tổng 1.200.000) → đánh dấu no-show 23:30 (tổng 500.000 – giữ cọc) → khôi phục 01:30 cùng ngày nghiệp vụ.
- Thực tế: 2 dòng phòng 750.000 ghi lại, 0 dòng FOC → tổng **1.500.000** (+300.000); yêu cầu FOC vẫn `approved` (s3-round8 X1, PostgreSQL thật; vòng 7 giống hệt – không phải hồi quy).
- Mong đợi: [chờ DOM] BR-315(a) "khôi phục dùng lại chính các đêm-phòng đã hủy, giữ giá snapshot" + điều kiện (3) "không đổi giá" → FOC quay lại, tổng **1.200.000**.
- Gốc: `folio.service.ts:997` `voidStay` đảo cả dòng phòng lẫn FOC; `reservations.service.ts:3328` `restoreNoShow` chỉ đồng bộ lại – không còn dòng phòng sống nên `focDateMap` không có gì để chuyển.
- Bằng chứng: `reviews/s3-round8-verification.md` mny-1 / X1.

### BUG-R2-061 – FOC trên phụ thu trả muộn bị giảm/mất hoặc "duyệt mà không áp" khi đổi giờ trả (S4-34, QC-S3-03)
- Mức: **P0** (sai tiền: khách trả thêm 210.000 / 140.000 trong ví dụ; hạn mức FOC bị trừ cho khoản không áp) · Môi trường: stack dùng một lần `ottimo-qa-s3`, ảnh api build từ `6af7173` (`ottimo-api:qa-gate-6af`, `INCLUDE_TEST_SUPPORT=1`), seed DS-E, ⏱ MutableClock (ngày ảo 2036-06/07), 17/10 12:10 · Vai sửa: BE-B (+ BE-A `stay-support`, DOM chốt phần (c)) · Trạng thái: **Open** – S4-34/QC-S3-03 · Hạn: trước cổng QC Sprint 4 (decision-log ORC 17/10) và **trước khi phát hành S4-25*** (QC: phát hành S4-25* khi lỗi này chưa sửa → Sprint 4 KHÔNG ĐẠT mục tiền)
- Đường đi: hôm nay **chỉ API** (`requestFoc` trên dòng `late_checkout`; Desk chưa có nút). Khi S4-25* mở nút xin FOC trả muộn trên Desk, đây là thao tác **hằng ngày** (khách đổi giờ trả) → tần suất cao.
- Bước (oracle BR-412, giá đêm 700.000; đơn Trực tiếp 1 đêm `in_house`, ⏱ ngày đến 14:30): (a) hẹn trả 15:00 (210.000) → `qa.fd` xin FOC 210.000 → `qa.fdl` duyệt → đổi giờ trả 12:30 (0) → đổi lại 15:00; (b) hẹn 17:00 (350.000) → FOC 350.000, `qa.mgr` duyệt → đổi 15:00 → đổi lại 17:00; (c) hẹn 15:00, FOC 210.000 **chờ duyệt** → đổi 17:00 → `qa.fdl` duyệt.
- Thực tế: (a) sau 12:30 dòng trả muộn và FOC bị đảo; sau 15:00 dòng 210.000 **không có FOC**, còn phải thu **210.000**, yêu cầu vẫn `approved`. (b) 15:00: FOC −210.000 (đúng, min); 17:00: FOC vẫn −210.000, còn phải thu **140.000**. (c) duyệt trả 200 `approved`, dòng FOC `rejected`, còn phải thu **350.000**, hạn mức tháng còn lại của `qa.fdl` 1.500.000 → **1.290.000**.
- Mong đợi: BR-434 / BR-412-12, -13 (G-10): FOC mới = min(**số đã duyệt**, dòng mới), không duyệt lại → (a) FOC 210.000, còn phải thu **0**; (b) FOC 350.000, còn phải thu **0**; (c) như BUG-R2-059 – không để `approved` mà không áp; nếu FOC đi theo dòng mới thì min(210.000, 350.000), còn phải thu 140.000 [chờ DOM chốt, ĐK-S3-5].
- Gốc: `frontdesk/internal/stay-support.ts:515-575` `replaceLateCharge`: đảo dòng cũ (FOC đi theo), `if (input.amountVnd <= 0) return` → không giữ lại gì để mang sang; `carried = Math.min(old.focVnd, input.amountVnd)` với `old.focVnd` = FOC **đang có** (`liveSurchargeLines` `:469-507`, chỉ dòng `posted`) – cùng lớp BUG-R2-056 / BUG-R2-059. Cùng hàm được gọi từ B13 gia hạn và trả phòng (`stay.service.ts:375, 581, 1429`; `checkout.service.ts:356`) – B13 chưa chạy thử.
- Bằng chứng: spec tạm của QA (không commit) `scratchpad/gate/QA/tests-copy/e2e/clock/zz-qa-gate-latefoc.clock.spec.ts`, log `scratchpad/gate/QA/gate-latefoc.log` (QA-GATE-1/2/3, 3/3 tái hiện). Ca kiểm: TC-NT-045 (a)(b), TC-NT-046 (c)(d).

### BUG-R2-062 – H12 hứa "Mã QR … tạo ngay sau khi giữ chỗ" nhưng không vẽ mã QR cọc (PO-S3-04)
- Mức: P3 (câu chữ sai/hứa điều chưa có; sale vẫn có số tiền + nội dung chuyển khoản `pay.qr_note` để gửi khách). Phần thiếu chức năng (vẽ QR – US-084 AC4, US-120, Must R2) là S4-28*, không tính vào lỗi này · Môi trường: đọc code `6af7173` · Vai sửa: FE (+ UXD nếu đổi chuỗi) · Trạng thái: **Open**
- Bước: H12 báo giá → bước giữ chỗ: dòng `sale.qr_after` (`QuoteDialog.tsx:684`): VI "Mã QR có nội dung là mã đơn, tạo ngay sau khi giữ chỗ." / EN "The QR code uses the booking ID as the transfer note and is created right after the hold." → bấm giữ chỗ.
- Thực tế: sau giữ chỗ H12 chỉ hiện số tiền cọc và `pay.qr_note` (`QuoteDialog.tsx:658`), không có mã QR; H11 Xác nhận cọc cũng không. Admin-web chỉ gọi `createVietQr` ở `pages/stay/PaymentPanel.tsx` (thu tiền lưu trú).
- Mong đợi: hoặc vẽ mã VietQR `purpose=deposit` sau giữ chỗ (S4-28*), hoặc chuỗi không hứa QR.
- Bằng chứng: `outputs/PO/s3-acceptance.md` US-084 AC4 (PO-S3-04); QA đọc lại `QuoteDialog.tsx`, `design/copy/strings-vi.json:1045`, `strings-en.json:1045`.

### BUG-R2-063 – `guest.id_doc_last4` không được ghi → CRM không hiện 4 ký tự cuối giấy tờ (PO-S3-07)
- Mức: **P2** – QA nâng so với đề nghị P3 của PO/QC/ORC: đây không phải câu chữ mà là trường dữ liệu không bao giờ được ghi (US-048 AC3, Must R2), cùng lớp BUG-R2-033 (a) đang là P2; có cách khắc phục (bản ghi khai báo vẫn có `docNumberLast4`) nên không lên P1 · Môi trường: đọc code `6af7173` · Vai sửa: BE-C (+ BE-B hồ sơ khách, SEC chốt điều kiện ghi như `id_doc_hmac` – 0.3.7) · Trạng thái: **Open** – S4-32* (gộp S4-11)
- Bước: nhận phòng có giấy tờ người đứng tên → mở hồ sơ khách (CRM) bằng `qa.fd`.
- Thực tế: `idDocLast4` rỗng. `grep id_doc_last4|idDocLast4` trong `services/api/src` (trừ migration): chỉ khai báo cột `db/schema/guests.ts:48` và 2 chỗ đọc (`guests.service.ts:72`, `guest-mapper.ts:68`) – không có lệnh ghi.
- Mong đợi: US-048 AC3 – CRM chỉ hiện 4 ký tự cuối (không lộ số đầy đủ – TC-RB-001 đạt phần này).
- Bằng chứng: `outputs/PO/s3-acceptance.md` US-048 AC3 (PO-S3-07); QA grep lại trên `6af7173`.

### BUG-R2-064 – `test.fail()` gọi giữa ca che lỗi thật của lượt chạy đầu (QC-S3-04)
- Mức: P3 (hạ tầng test – không ảnh hưởng sản phẩm, nhưng làm mất tín hiệu hồi quy ở bước trước dòng `test.fail`) · Môi trường: CI 38998735861 (`6af7173`), Playwright `retries: 1` trên CI · Vai sửa: QA · Trạng thái: **Open** – S4-24 (ĐK-S3-7: "không có `test.fail` giữa chuỗi")
- Vị trí: `e2e/clock/checkin.s3.clock.spec.ts` TC-L3-011 (`:773`, `test.fail` ở `:834` – BUG-R2-038), TC-L3-074 (`:2098`, `test.fail` ở `:2215` – BUG-R2-054); `e2e/api/checkin.s3.api.spec.ts` TC-L3-032 (`:231`, `test.fail` ở `:257` và `:268` – BUG-R2-033 (a)(b)).
- Cơ chế: lỗi xảy ra **trước** dòng `test.fail` → kết quả `failed` trong khi `expectedStatus` còn `passed` → Playwright chạy lại; lượt 2 tới được `test.fail` và hỏng đúng dự kiến → cả ca tính "expected" (cả hai lượt `failed` = `expectedStatus` cuối), không ghi flaky, reporter `list` không in lỗi, artifact chỉ tải lên khi job đỏ → lỗi lượt 1 mất dấu. Đã xảy ra ở TC-L3-011 trong CI 38998735861 (mục 7).
- Sửa (QA, Sprint 4): tách bước lỗi đã biết thành ca riêng chỉ chứa bước đó (`test.fail` ở đầu ca), phần còn lại phải xanh; CI báo đỏ khi một ca có annotation BUG/`test.fail` bị chạy lại; tải `junit.xml` + `test-results` lên **mọi** lần chạy (`if: always()` – báo OPS vì sửa `ci.yml`).

### BUG-R2-065 – Demo/dev: api, worker, seed không nhận khóa mã hóa cố định → giấy tờ không đọc được, 500 sau khi khởi động lại (UXR #1)
- Mức: **P0** (mất/hỏng dữ liệu C3 trên bản demo giao INV: giấy tờ đã lưu không giải mã được; Gia hạn, Thêm người trên đơn dựng sẵn trả 500). Chỉ ở cách dựng demo/dev – prod đọc khóa qua `*_FILE` + chế độ strict (`docker-compose.prod.yml:42-44`, `keyring.ts:47`) nên không bị. QA không hạ mức: bản demo là thứ INV dùng thử · Môi trường: demo `ottimo-demo` (`adc0a47` = mã `6af7173`), UXR bấm 17/10 12:31–13:00; dev compose `infra/docker-compose.yml`; CI E2E cũng chạy với khóa ngẫu nhiên theo tiến trình (chưa gây đỏ vì CI không khởi động lại giữa chừng) · Vai sửa: OPS · Trạng thái: **Closed** (chấm lại cổng 17/10, mục 9 – CI 39015560449 `fe4b166`) – trước đó **Fixed** (cây làm việc: `infra/docker-compose.yml`, `infra/demo/docker-compose.demo.yml`, `infra/demo/lib.sh`, `infra/ci/make-ci-env.sh`) – QA kiểm phần compose dev/CI (mục 8.3); phần demo chờ OPS smoke + UXR đi lại KB6 (ĐK-S3-10) rồi mới Closed
- Liên quan: ADR-013 (mã hóa C3), ĐK-S3-10, QC-S3-08
- Bước: dựng demo (`demo-up.sh`: pha seed chạy riêng, rồi api/worker) → mở D4 (đơn đang ở dựng sẵn) → Gia hạn hoặc Thêm người; hoặc nhập giấy tờ cho D1, khởi động lại api, mở lại giấy tờ.
- Thực tế: 500 "Máy chủ đang gặp sự cố…" (`DecryptionError` trong log api – ảnh 073, 077); giấy tờ lưu trước lần khởi động lại không mở được.
- Mong đợi: api, worker, seed dùng chung một bộ khóa từ `demo.env`/`.env`; khởi động lại không mất khả năng đọc dữ liệu (ĐK-S3-10: "khởi động lại api rồi mở giấy tờ D4").
- Gốc: `x-api-env` (`infra/docker-compose.yml:21-51`) không có `DATA_KEK_CURRENT`, `ID_HASH_KEY` → `keyring.ts:56-68` dùng khóa `ephemeral` khi biến rỗng và `APP_ENV=dev`.
- Bằng chứng: ảnh UXR 073, 077 (`scratchpad/gate/uxr/shots/`); QC-S3-08 (đọc mã).
- Kiểm lại (QA 17/10 13:29, mục 8.3): stack dùng một lần dựng từ cây làm việc, khóa sinh như `make-ci-env.sh`: tạo giấy tờ có ảnh → đọc đủ số (step-up) + ảnh: 200 → khởi động lại api + worker → đọc lại: **200**, đúng 4 số cuối, log không có `DecryptionError`. Đối chứng cùng stack nhưng env không có khóa: sau khi khởi động lại → **500**, log có lỗi giải mã – cách kiểm phân biệt được lỗi. Chưa kiểm: bản demo (QA không đụng `ottimo-demo`), J16 sau khởi động lại. Chưa có ca tự động – ghi vào S4-24: ca smoke "khởi động lại api giữa chừng".
- Chấm lại (QA 17/10 15:10, mục 9): bản sửa vào `cc8c875`; CI 39015560449 (`fe4b166`) bước "Production compose rules" in `OK: compose rules (… one keyring for api/worker/seed in dev + demo, demo refuses …)`. Phần demo: OPS smoke `demo-up.sh --smoke` trên `9a221ee` ĐẠT và khởi động lại api + worker vẫn mở lại được số và ảnh giấy tờ (`outputs/OPS/demo-1.md` mục 6b, ORC ghi); UXR đi lại KB6 trên bản đó đạt (guide v1.2). QA không tự đăng nhập bản demo (theo quy tắc), nên phần demo dựa vào bản ghi OPS/ORC + luật `check-compose.sh` chạy trong CI. Ca smoke tự động "khởi động lại api giữa chừng" vẫn ở S4-24 → **Closed**.

### BUG-R2-066 – Tải ảnh đính kèm từ Desk luôn 422 (`Idempotency-Key` "…-a") → không ghi được khoản chi hoàn, phát sinh kèm ảnh (UXR #2)
- Mức: **P0** (không thanh toán được – chi hoàn tiền – và không có cách vòng trên Desk: API bắt buộc ảnh chứng từ cho cả tiền mặt và chuyển khoản, kể cả vai chủ đầu tư) · Môi trường: demo `ottimo-demo` (`adc0a47`), UXR 17/10; QA tái hiện bằng ca UI mới trên stack dùng một lần `ottimo-qa-s3` (api `6af7173`, web dựng từ `9e9fd64` – các dòng lỗi giống hệt `6af7173`), 17/10 13:15–13:25 · Vai sửa: FE · Trạng thái: **Closed** (chấm lại cổng 17/10, mục 9 – CI 39015560449 `fe4b166`) – trước đó **Fixed** (cây làm việc: `deriveIdempotencyKey` ở api-client, `MoneyPage.tsx`, `StayDialogs.tsx`, test FE `idempotency-keys.test.ts`) – QA kiểm 17/10 13:23 trên ảnh dựng từ cây làm việc: TC-L4-093, TC-L4-094, TC-L4-095 xanh (mục 8.3); Closed khi có commit + CI xanh
- Liên quan: US-021 AC4, US-032 AC2, BR-522, rbac A47/A47a, E15-02; `uploadAttachment`, `executeCashRefund`, `executeRefund`, `addFolioLine`
- Bước: Nhật ký tiền › Hoàn tiền › khoản đã duyệt › Chi hoàn tiền mặt (hoặc Ghi đã hoàn chuyển khoản) → đính ảnh → bấm chi. Hoặc drawer đơn đang ở › Thêm phát sinh › khoản phạt/hư hỏng › Thêm ảnh từ buồng phòng › Thêm vào folio.
- Thực tế: `POST …/attachments` → **422** `{"errors":[{"field":"Idempotency-Key","code":"VALIDATION_FAILED"}]}`, Desk báo "Còn {n} ô cần sửa" (BUG-R2-073); không đính ảnh thì nút chi tiền mặt bị khóa, chuyển khoản → 422 `EVIDENCE_REQUIRED` (ảnh 111, 121, 123).
- Mong đợi: lần tải ảnh có khóa Idempotency là một UUID riêng; ảnh trả 201; giao dịch chi / dòng phát sinh mang đúng `attachmentId`.
- Gốc: `MoneyPage.tsx:771`, `StayDialogs.tsx:645` gửi `${idem}-a`; `auth.guard.ts:575` chỉ nhận UUID. Test FE giả lập API nên không bắt được (QC-S3-09).
- Bằng chứng: mục 8 – TC-L4-094 trên mã cũ: `uploadAttachment refund_proof … 422 … "field":"Idempotency-Key"`; TC-L4-095: cùng lỗi với `penalty_evidence`.
- Ca chống tái phát: TC-L4-093, TC-L4-094 (`e2e/ui/desk-writes.s3.spec.ts`), TC-L4-095 (`e2e/ui-clock/stay-writes.h15.spec.ts`).
- Chấm lại (QA 17/10, mục 9): bản sửa vào `cc8c875`; CI 39015560449 (`fe4b166`): TC-L4-093, TC-L4-094, TC-L4-095 xanh ngay lượt đầu (cả lượt chạy không có lần chạy lại nào), bước CI "UI write-step cases" xác nhận ca không bị bỏ qua → **Closed**.

### BUG-R2-067 – "Nhập tay giấy tờ" trên Desk luôn 422 `data REQUIRED` (UXR #3)
- Mức: **P1** (bước Giấy tờ của nhận phòng không làm được trên Desk; có cách vòng nhưng rất tốn công: mở link check-in cho khách đang đứng ở quầy, khách tự tải ảnh, lễ tân mở và sửa – test-strategy mục 8 P1) · Môi trường: như BUG-R2-066 · Vai sửa: FE (api-client) · Trạng thái: **Closed** (chấm lại cổng 17/10, mục 9 – CI 39015560449 `fe4b166`) – trước đó **Fixed** (`endpoints.ts`: phần `data` gửi dạng chuỗi) – TC-L3-075 xanh trên cây làm việc 17/10 13:23 (mục 8.3); Closed khi có commit + CI xanh
- Liên quan: US-043 AC1, US-025, EP06 3.1, BR-601; `addGuestDocument`
- Bước: H13 bước Giấy tờ (hoặc H14) → Nhập tay → điền đủ → Lưu giấy tờ (có hoặc không ảnh).
- Thực tế: 422 `{"errors":[{"field":"data","code":"REQUIRED"}]}`, ô báo "Bắt buộc", không lưu (ảnh 042).
- Mong đợi: 201; dòng "CCCD · số cuối xxxx"; khai báo `none → partial → review` (BR-601).
- Gốc: `packages/api-client/src/endpoints.ts:769` `form.append('data', new Blob(...))` → trình duyệt gửi `filename="blob"`; `services/api/src/modules/files/public/multipart.ts:70-72` `textPart` chỉ đọc phần không phải tệp. Ca API (`callMultipart`) gửi `data` dạng chuỗi nên luôn xanh.
- Bằng chứng: mục 8 – TC-L3-075 trên mã cũ: `addGuestDocument người 1 (nhập tay, không ảnh): mong đợi 201, thực tế: 422 … "field":"data","code":"REQUIRED"`.
- Chấm lại (QA 17/10, mục 9): bản sửa vào `cc8c875`; CI 39015560449 (`fe4b166`): TC-L3-075 xanh ngay lượt đầu (cả lượt chạy không có lần chạy lại nào), bước CI "UI write-step cases" xác nhận ca không bị bỏ qua → **Closed**.

### BUG-R2-068 – Lễ tân trưởng không thấy khoản hoàn quản lý đã duyệt (UXR #4)
- Mức: **P1** (phân quyền sai ở hành động: rbac A47a cho FD+ chi hoàn tiền mặt, nhưng danh sách chỉ trả yêu cầu "của mình" → vai quầy không chi được; cách vòng: chủ đầu tư hoặc quản lý khác chi) · Môi trường: như BUG-R2-066 · Vai sửa: BE-A · Trạng thái: **Closed** (chấm lại cổng 17/10, mục 9 – CI 39015560449 `fe4b166`) – trước đó **Fixed** (cây làm việc: `approval.service.ts` thêm hàng chờ chi hoàn cho FD/FDL + `approvals-refund-payout.test.ts`) – TC-L4-093 bước (3) xanh trên cây làm việc 17/10 13:23 (mục 8.3); Closed khi có commit + CI xanh
- Liên quan: US-021 AC4, BR-522, rbac A47a; `listApprovalRequests`
- Bước: FD tạo yêu cầu hoàn, quản lý duyệt → `qa.fdl` mở Nhật ký tiền › Hoàn tiền.
- Thực tế: "Không có khoản hoàn nào cần xử lý" (ảnh 113, 115).
- Mong đợi: khoản `approved` chưa chi đủ hiện cho FD/FDL để chi tiền mặt; người tạo yêu cầu vẫn bị chặn tự chi (SEC F8).
- Gốc: `approval.service.ts:704-707` – FDL chỉ thấy `requested_by = me OR approver_id = me OR required_role = front_desk_lead`; FD chỉ `requested_by = me`.
- Bằng chứng: mục 8 – TC-L4-093 trên mã cũ: bước (1) FD nhập nơi nhận đạt; bước (3) `qa.fdl` không thấy khoản của đơn `OTM-00680`.
- Chấm lại (QA 17/10, mục 9): bản sửa vào `cc8c875`; CI 39015560449 (`fe4b166`): TC-L4-093 bước (3) xanh ngay lượt đầu (cả lượt chạy không có lần chạy lại nào), bước CI "UI write-step cases" xác nhận ca không bị bỏ qua → **Closed**.

### BUG-R2-069 – Hộp Hủy đơn nói "chưa thu tiền" khi khách được hoàn 100 % cọc (UXR #5)
- Mức: **P1** (US-021 AC2/AC4 Must: hộp xác nhận phải nêu khoản hoàn; câu sai ngay ở thao tác tiền không hoàn tác được → lễ tân báo nhầm cho khách. Không P0 vì số tiền ghi đúng: yêu cầu hoàn vẫn tạo đúng số, chờ duyệt) · Môi trường: như BUG-R2-066 · Vai sửa: FE (+ UXD câu) · Trạng thái: **Closed** (chấm lại cổng 17/10, mục 9 – CI 39015560449 `fe4b166`) – trước đó **Fixed** (cây làm việc: nhánh `confirm.cancel_booking.body_full_refund`) – TC-L2-085 xanh 17/10 13:25 (mục 8.3); Closed khi có commit + CI xanh
- Liên quan: US-021 AC2, AC4; BR-309 (oracle BR-309-03), BR-522; `cancelReservation` (dryRun)
- Bước: đơn Trực tiếp đã cọc, ngày đến còn ≥ 7 ngày → Hủy đơn.
- Thực tế: "…Đơn chưa thu tiền nên không có phí hủy hay khoản hoàn." (ảnh 099).
- Mong đợi: câu nêu hoàn đủ cọc (có số tiền), cần quản lý duyệt.
- Gốc: `ReservationDialogs.tsx:262-279` thiếu nhánh `refundableVnd > 0 && retainedVnd = 0`.
- Bằng chứng: mục 8 – TC-L2-085 trên mã cũ: hộp có đúng câu "Đơn chưa thu tiền nên không có phí hủy hay khoản hoàn.".
- Chấm lại (QA 17/10, mục 9): bản sửa vào `cc8c875`; CI 39015560449 (`fe4b166`): TC-L2-085 xanh ngay lượt đầu (cả lượt chạy không có lần chạy lại nào), bước CI "UI write-step cases" xác nhận ca không bị bỏ qua → **Closed**.

### BUG-R2-070 – Dòng "Đã thu" trên drawer tính sai (UXR #6)
- Mức: **P1**. Lỗi tiền mặc định P0 (test-strategy mục 8). QA xếp P1 vì đã kiểm là **không ảnh hưởng tiền đã ghi**: số này chỉ hiển thị, không đi vào lệnh ghi nào; "Còn phải thu" cùng khối lấy `balanceDueVnd` của server (đúng); thu tiền, điều kiện nhận phòng `balance_paid`, bill, màn trả phòng đều tính ở server. Vẫn P1 vì là số tiền sai trên màn dùng hằng ngày (US-020) · Môi trường: như BUG-R2-066 · Vai sửa: FE · Trạng thái: **Closed** (chấm lại cổng 17/10, mục 9 – CI 39015560449 `fe4b166`) – trước đó **Fixed** (cây làm việc: đọc `folio.totals.paidVnd`) – TC-L2-086 và phần "Đã thu" của TC-L3-076 xanh 17/10 13:23–13:25 (mục 8.3); Closed khi có commit + CI xanh
- Liên quan: US-020, US-032 AC3; `getFolio`
- Bước: mở drawer của (a) giữ chỗ chưa cọc D5; (b) đơn A đã cọc 500.000 rồi hủy; (c) D1 đang ở có phụ thu nhận sớm.
- Thực tế: (a) "Đã thu −1.416.000", "Còn phải thu 0 đ" (ảnh 006); (b) "Đã thu −1.822.000" (ảnh 100); (c) "Đã thu −1.354.000" thay vì 1.613.000 (ảnh 081, 033).
- Mong đợi: "Đã thu" = tiền đã thu thật của folio (`totals.paidVnd`): (a) 0; (b) 500.000; (c) 1.613.000.
- Gốc: `ReservationDrawer.tsx:515` `−{vnd(r.totalRoomVnd - r.balanceDueVnd)}`.
- Ghi chú: "Còn phải thu 0 đ" của giữ chỗ chưa cọc là số server trả (`balanceDueVnd` khi đơn `hold`); nên để "Cọc cần thu" là dòng chính khi đơn `hold` – UXD/PO xem, không tính vào lỗi này.
- Bằng chứng: mục 8 – TC-L2-086 trên mã cũ: giữ chỗ chưa cọc "Đã thu" = 750.000, mong đợi 0.
- Chấm lại (QA 17/10, mục 9): bản sửa vào `cc8c875`; CI 39015560449 (`fe4b166`): TC-L2-086, phần "Đã thu" của TC-L3-076 xanh ngay lượt đầu (cả lượt chạy không có lần chạy lại nào), bước CI "UI write-step cases" xác nhận ca không bị bỏ qua → **Closed**.

### BUG-R2-071 – Không thêm được người lớn vượt định mức khi khách đang ở (UXR #7)
- Mức: **P1** (US-022 AC4 Must không làm được trên Desk, không có cách vòng ngoài API; hệ quả: không thu được phụ thu người, người đó không vào khai báo lưu trú. Không P0 vì không có số tiền bị ghi sai – thao tác bị chặn) · Môi trường: như BUG-R2-066 · Vai sửa: FE + UXD · Trạng thái: **Closed** (chấm lại cổng 17/10, mục 9 – CI 39015560449 `fe4b166`) – trước đó **Fixed** (cây làm việc: thử trước `dryRun`, hiện số phụ thu, ô xác nhận, câu `party.surcharge_*`) – TC-L3-076 xanh 17/10 13:25 (mục 8.3); UXD còn phải duyệt hộp (ĐK-S3-9); Closed khi có commit + CI xanh
- Liên quan: US-022 AC4, BR-110 (oracle BR-110-06), BR-414, DOM S3-12; `addPartyMember`
- Bước: D1 đang ở (2 người lớn, định mức 2) → Thêm người đi cùng → người lớn thứ 3 → Thêm vào đơn.
- Thực tế: 422 `SURCHARGE_DECISION_REQUIRED` (450.000); hộp báo "Giờ này có phụ thu – tick 'Tôi đã báo khách khoản phụ thu này' hoặc xin miễn." nhưng không có ô nào, không nêu số tiền (ảnh 081, 082).
- Mong đợi: hộp hiện phụ thu (150.000 × số đêm còn lại); lễ tân xác nhận đã báo khách → gửi `applyExtraPersonSurcharge: true` + `expectedSurchargeVnd` → 201; folio có dòng `extra_person`.
- Gốc: `StayDialogs.tsx:988`, `:996` gửi cứng `applyExtraPersonSurcharge: false`; câu báo dùng `field.SURCHARGE_DECISION_REQUIRED` của màn nhận phòng.
- Bằng chứng: mục 8 – TC-L3-076 trên mã cũ: hộp Người ở chỉ có câu báo trên và nút "Thêm vào đơn", không có số 450.000. TC-L3-056 chỉ chạy API (đã sửa nhãn tầng "A+E" → "A").
- Chấm lại (QA 17/10, mục 9): CI 39015560449 (`fe4b166`): TC-L3-076 xanh ngay lượt đầu → **Closed**. UXD duyệt chuỗi của hộp phụ thu: S4-41 (không chặn đóng lỗi chức năng).
- **Gốc lần đỏ TC-L3-076 ở CI 39010774166 (`9a221ee`, 2/2 lượt, `locator.click` hết 90 s ở bước xác nhận phụ thu)** – lỗi **sản phẩm**, không phải harness, do FE tìm (trace CI + tái hiện chắc chắn trên stack riêng `ottimo-fe076`, decision-log FE 17/10) và QA đọc lại mã:
  1. **Ô chọn khách dùng chung (`components/GuestPicker.tsx`) đua kết quả tìm kiếm:** trong 300 ms chờ gõ + lúc chờ API, danh sách đã hiện "Chưa có khách nào khớp" + "Tạo nhanh khách" (là option đầu tiên); kết quả về thì chen lên trên, "Tạo nhanh" tụt xuống vị trí 2. Cú bấm rơi đúng lúc đó mở form "Hồ sơ khách mới" thay vì chọn khách (hoặc chọn khách của chữ gõ trước). Ở TC-L3-076: không có người đi cùng được chọn → không gọi `dryRun` → không có số phụ thu → nút xác nhận khóa → hết giờ. Với lễ tân thật: dễ tạo **hồ sơ khách trùng**; ô này dùng ở form Đặt phòng mới, Thêm người đi cùng, báo giá. Sửa (`fe4b166`): danh sách chỉ đưa lựa chọn thuộc **đúng chữ đang gõ**; lúc chờ chỉ ghi "Đang tải…", không có gì để bấm.
  2. **Thêm người khi đang ở lấy `effectiveFrom` theo ngày của máy quầy**, không theo ngày nghiệp vụ máy chủ: lệch khi ngày máy ≠ ngày nghiệp vụ (00:00–05:59 – ngày nghiệp vụ còn là hôm trước; hoặc đồng hồ máy sai) → API 422 `effectiveFrom`, Desk khóa nút im lặng. Sửa (`fe4b166`): dùng `BookingRules.businessDate`; API từ chối thì nói rõ + "Thử lại".
  - Chống tái phát: unit `guest-picker-race.test.tsx` (5 ca: đang tìm thì không có gì để bấm; kết quả về rồi mới bấm → chọn đúng khách; chữ đổi thì không đưa kết quả cũ; ngày máy ≠ ngày nghiệp vụ; xem trước bị từ chối thì báo) – QA chạy lại 17/10: xanh. FE cũng neo locator của TC-L3-076 vào **tên khách ở đầu option** (`^tên`) – hợp lý (người dùng bấm vào tên), nhưng vì vậy **TC-L3-076 không còn bắt được lỗi đua này**; lớp lỗi được giữ bằng unit trên. Không mở BUG mới: lỗi tìm ra và sửa trong cùng vòng 9c, ghi ở đây theo yêu cầu ORC.

### BUG-R2-072 – Người duyệt tự chi hoàn: Desk báo "Máy chủ đang gặp sự cố" (UXR #8)
- Mức: P2 (thông báo gây hiểu nhầm – lễ tân tưởng hệ thống hỏng; có cách khắc phục: nhờ người khác chi; API chặn đúng) · Môi trường: như BUG-R2-066 · Vai sửa: FE (+ UXD chuỗi) · Trạng thái: **Closed** (chấm lại cổng 17/10, mục 9)
- Bước: `qa.mgr` duyệt khoản hoàn chuyển khoản rồi tự bấm Ghi đã hoàn chuyển khoản.
- Thực tế: "Máy chủ đang gặp sự cố…" (ảnh 112). API: 403 `SELF_REFUND_FORBIDDEN` (đúng – SEC-37).
- Mong đợi: câu riêng "người tạo/duyệt/nhập nơi nhận không tự chi".
- Gốc: `MoneyPage.tsx:877` so `act.code === 'SELF_APPROVAL_FORBIDDEN'`; chưa có chuỗi `error.SELF_REFUND_FORBIDDEN` → `problemView` (`app/problem.ts:65-68`) rơi về `error.server`.
- Chấm lại (QA 17/10 15:22–15:23, mục 9.3): sửa ở `cc8c875` (`MoneyPage.tsx` so `SELF_REFUND_FORBIDDEN`; câu `refund.self_execute_forbidden_transfer`; `problemView`: 403 không có câu riêng → `error.FORBIDDEN_ACTION`). Ca bấm thật ngoài repo (`scratchpad/regate/qa/adhoc/…/regate-adhoc.spec.ts`) trên stack QA `ottimo-qa-s3` (ảnh dựng từ `cc8c875`; `MoneyPage.tsx`, `problem.ts` không đổi tới `fe4b166`): FD tạo yêu cầu + nơi nhận chuyển khoản, `qa.mgr` duyệt (API) rồi tự bấm Ghi đã hoàn chuyển khoản kèm ảnh → `executeRefund` **403** `SELF_REFUND_FORBIDDEN`, hộp hiện "Bạn đã tạo, duyệt hoặc nhập tài khoản nhận cho khoản hoàn này nên không tự chi được…", không có câu "Máy chủ đang gặp sự cố" – 2/2 lượt. Unit `problem.test.ts` xanh → **Closed**.

### BUG-R2-073 – Câu báo còn ký hiệu thô `{n}`, `{room}`/`{from}`/`{to}` (UXR #9)
- Mức: P2 (thông báo lỗi không nêu số ô sai, căn và ngày bị chặn – test-strategy mục 8 P2) · Vai sửa: FE · Trạng thái: **Closed** (chấm lại cổng 17/10, mục 9)
- Bước và thực tế: (a) lỗi 422 đi qua `problemView` → "Còn {n} ô cần sửa – xem dòng đỏ dưới từng ô." (ảnh 121, lúc tải ảnh 422 – BUG-R2-066); (b) KB2 chọn căn đang khóa rồi Tạo đơn → "Căn {room} đang khóa sửa chữa từ {from} đến {to}…" (ảnh 141).
- Gốc (đọc mã): (a) `app/problem.ts:65-66` gọi `t('error.VALIDATION_FAILED', args)` mà `argsFor` không đặt `n`; (b) đường lỗi của form Đặt phòng mới không qua `rsvErrorText` (`app/reservations.ts:125-126` có điền `room`/`from`/`to`) – FE xác nhận đường cụ thể.
- Mong đợi: không câu nào hiện `{…}`. QA đề nghị FE thêm kiểm tự động "không chuỗi hiển thị nào còn `{`" trong test FE.
- Chấm lại (QA 17/10, mục 9.3): sửa ở `cc8c875` – (a) `problem.ts` `argsFor` đặt `n` = số ô server báo cho `VALIDATION_FAILED`, câu ô không dùng câu tóm tắt; (b) form Đặt phòng mới đi qua `rsvErrorText` (có số căn) + `argsFor` điền `{room}/{from}/{to}` từ `conflicts`. (b) bấm thật 2/2 trên stack QA: khối OOO căn 401 [02/08/2027, 04/08/2027) → Tạo đơn → `createReservation` 409 `ROOM_BLOCKED` → "Căn 401 đang khóa sửa chữa từ 02/08/2027 đến 04/08/2027. Chọn căn khác.", trên màn không còn `{room}/{from}/{to}/{n}`. (a) chưa có đường bấm thật nào còn trả 422 đi qua `problemView` (lỗi tải ảnh 422 đã hết – BUG-R2-066) → kiểm bằng unit `problem.test.ts` ("Còn {n} ô" đếm số ô; **mọi** câu `error.*` render không còn ký hiệu thô – đúng đề nghị của QA), QA chạy lại 17/10: xanh → **Closed**.

### BUG-R2-074 – Ô "Ngân hàng nhận" chỉ nhận mã BIN, xóa chữ im lặng (UXR #10)
- Mức: P2 (UX gây nhầm, có cách khắc phục: gõ mã BIN 6 số) · Vai sửa: FE + UXD · Trạng thái: **Deferred** – S4-45 (chấm lại cổng 17/10)
- Bước: Hoàn tiền › Nhập nơi nhận hoàn › Chuyển khoản › gõ "Vietcombank".
- Thực tế: chữ bị xóa, ô trống, báo "Bắt buộc" (ảnh 103). `MoneyPage.tsx:680-690`: `inputMode="numeric"`, `maxLength={6}`, `replace(/\D/g, '')`.
- Mong đợi: danh sách chọn ngân hàng (tên + BIN), hoặc ít nhất câu hướng dẫn "nhập mã BIN 6 số, ví dụ 970436".
- Chấm lại (QA 17/10): vòng 9 không sửa (FE: chưa có danh sách ngân hàng VietQR trong repo – cần UXD/INT) → **Deferred** sang S4-45; mức P2 giữ nguyên. Cách đi tiếp trên demo: `demo-1-limits.md` mục C.

### BUG-R2-075…082 – Điểm nhỏ UXR #11 (đi thử demo 17/10)
Môi trường: demo `ottimo-demo` (`adc0a47`), UXR 17/10. Đường đi và bằng chứng: `demo-1-limits.md` mục C (dòng "mới" của UXR) và ảnh UXR. QA đọc mã các điểm có ghi vị trí; các điểm khác ghi theo quan sát của UXR, QA chưa tái hiện riêng. Trạng thái cả nhóm: **Open**, PO xếp vào Sprint 4 (ĐK-S3-4: "thêm mục cho lỗi UXR P2/P3 không sửa ở vòng 9"). **Chấm lại 17/10 (mục 9):** vòng 9/9b/9c **không sửa mục nào** của nhóm này (QA so mã `6af7173`…`fe4b166` ở `BookingDialog.tsx`, `ReservationsPage.tsx`, `ReservationDrawer.tsx` (phần Esc), `QuoteDialog.tsx`, hộp Xác nhận cọc, `CheckOutPage.tsx` dòng preset; danh sách đơn của API). Chỉ 077 có mục S4 (S4-44); 075, 076, 078, 079, 080, 081, 082 **chưa có mục trong `s4-carryover.md`** – ORC thêm (076, 080, 081 chờ UXD/PO chốt).

| ID | Mức | Điểm (thực tế → mong đợi) | Vai sửa | Vì sao mức này |
|---|---|---|---|---|
| BUG-R2-075 | P3 | KB2 Tạo nhanh khách → ô "Khách đứng tên" có lúc vẫn đỏ "Bắt buộc" (ảnh 013–014) → hết đỏ khi đã chọn khách. **QA tái hiện 2/2 (17/10, stack QA, mã giống `fe4b166`):** bấm Tạo đơn khi chưa chọn khách → Tạo nhanh khách → ô vẫn `aria-invalid` + "Bắt buộc" tới lần bấm sau. Gốc: `BookingDialog.tsx` chỉ tính `errors` trong `validate()` lúc bấm Tạo đơn; `set()` khi chọn khách không xóa lỗi của ô | FE | Chỉ hiển thị, tạo đơn vẫn được |
| BUG-R2-076 | **P2** (nâng từ P3) | KB2 "Dùng căn …" tạo đơn ngay, giá tính lại theo căn mới, lễ tân không xem lại giá (ảnh 018–019) → xem giá mới rồi mới tạo | FE + UXD/PO | Tiền của đơn đổi mà người tạo không thấy trước – dễ báo khách giá cũ; có cách khắc phục (mở drawer, dời căn) nên không P1. Chờ UXD/PO chốt luồng |
| BUG-R2-077 | P3 | Ô Tìm kiếm danh sách đơn chưa tìm theo tên khách (ảnh 097, 100) → tìm được theo tên | FE (+ BE-A nếu API chưa có) | Chưa có AC riêng; tìm theo mã vẫn được |
| BUG-R2-078 | **P2** (nâng từ P3) | Cột "Còn phải thu" của danh sách đơn luôn trống (`ReservationsPage.tsx:204` – dữ liệu danh sách không có `balanceDueVnd`) → hiện số | FE + BE-A | Cột tiền trống dễ hiểu thành "không còn nợ"; chức năng phụ sai |
| BUG-R2-079 | P3 | Esc không đóng khung chi tiết đơn sau khi đóng hộp con → Esc đóng | FE | Nút X vẫn tới được bằng Tab |
| BUG-R2-080 | **P2** (nâng từ P3) | Hộp báo giá chỉ có Tiếng Việt/English (`QuoteDialog.tsx:79, 634-635`) → có tiếng Nga | FE (+ PO xác nhận) | US-083 AC2 (Must R2) yêu cầu Việt/Anh/Nga và API đã có bản RU (BUG-R2-027 đóng bằng ca API) → PO nên rà lại "Đạt" của US-083 AC2 trên giao diện. Có cách khắc phục (sale tự dịch) nên không P1 |
| BUG-R2-081 | P3 | Lễ tân xác nhận cọc không thấy số tiền, ghi chú CTV đã báo → hiện để đối chiếu | FE (+ PO phạm vi) | Lễ tân vẫn đối chiếu với sao kê; chờ PO |
| BUG-R2-082 | P3 | Nút Giặt ủi mở hộp phát sinh chưa chọn khoản (ảnh 086) → chọn sẵn "Giặt ủi (theo kg)". **Chấm lại 17/10 (đọc mã, chưa bấm): rộng hơn** – `CheckOutPage.tsx:38-42` preset `LAUNDRY_KG`, `FNB`, `SMOKING`, `CARD_LOST`, `damage`; `StayDialogs.tsx:630` tìm theo `code` hoặc `category` (phân biệt hoa thường); `getChargeCatalog` (`folio-lines.service.ts:99-160`) trả `laundry`/`laundry`, `fnb`/`fnb`, `smoking_fee`/`penalty`, `key_card_fee`/`penalty`, `damage.*`/`damage` → 4/5 nút (Giặt ủi, Ăn uống, Hút thuốc, Mất thẻ) không chọn sẵn, chỉ "Hư hỏng" đúng. Mock FE (`mocks/stay.ts:310`) dùng `LAUNDRY_KG` nên unit xanh (cùng lớp QC-S3-09). Ghi đính chính: `laundry_per_kg` là mã của fixture seed, không phải mã API | FE | Chọn lại được trong danh sách; không ghi sai tiền |

Ghi chú: QC ghi "9 điểm P3". Trong `demo-1-limits.md` mục C, ngoài #1–#10, QA đếm được 8 điểm "mới" (bảng trên). Nếu danh sách gốc của UXR có điểm thứ 9 không nằm trong limits, ORC/UXR chuyển để QA ghi thêm.

### BUG-R2-083 – Bỏ người khỏi đoàn hủy nhầm / giữ nhầm giấy tờ khách tải qua link (FB-R2-SEC-BE-53)
- Mức: **P0**. SEC xếp thẻ Major (rủi ro bảo mật Trung bình: không lộ cho người không có quyền, hạn giữ có trần nhờ J16). Mức lỗi sản phẩm do QA quyết theo test-strategy mục 8: (1) **hủy không hoàn tác** giấy tờ C3 của khách **còn ở** = mất dữ liệu; (2) giữ hộ chiếu/CCCD của người đã rời đoàn quá mục đích (A-38/T03, NĐ 13/2023); (3) link báo đủ người bằng giấy tờ của người không ở → nguy cơ khai báo lưu trú sai người. Quy tắc "C3 mặc định P0 cho đến khi chứng minh không ảnh hưởng dữ liệu" không loại được lỗi này. QA không hạ mức vì tần suất hay vì hạn SEC đặt ở Sprint 4 · Môi trường: SEC tái hiện trên PostgreSQL thật, mã `6af7173` (DB `ottimo_verify_sec_gate`, endpoint thật `DELETE …/party/{memberId}`), 17/10 · Vai sửa: BE-C (`registration.service.ts`), BE-A (`party.service.ts` – số người của khai báo), ARC (`removePartyMember` nhận `guestUploadPersonIndex`), FE + UXD (hộp hỏi "ảnh nào là của <tên>") · Trạng thái: **Closed** (cổng QC S3 bản 3, 17/10 – ĐK-S3-12; trước đó: Open chờ SEC xác nhận FE-07); phần còn lại → **BUG-R2-085** (P1, S4-39) · Hạn (SEC-G1, lịch sử): trước cổng QC Sprint 4 **và** trước dữ liệu khách thật (gửi link check-in cho khách thật hoặc nhập giấy tờ thật), mốc nào trước. Không cần trước buổi INV thử demo (dữ liệu giả); demo có câu cảnh báo SEC-G4 trong limits mục C
- Liên quan: US-022, US-049, A-38, T03, FB-R2-SEC-BE-32 (Major b); `removePartyMember`, `guestUpload`
- Bước (SEC mục 9.3): đơn `in_house` 3 người lớn, thành viên A (thứ 1), B (thứ 2); khách tải giấy tờ Khách 1/2/3 qua link; lễ tân bỏ A (giữa) – R1; bỏ B – R2; đơn `confirmed` bỏ người đi cùng – R3; khai 3 người, chỉ ghi 1 người đi cùng rồi bỏ – R4.
- Thực tế: R1, R2, R4: giấy tờ Khách 3 (người còn ở) bị hủy (DEK hủy, tệp mất), Khách 2 giữ nguyên; `required_count` vẫn 3. R3: không hủy giấy tờ nào; link báo đủ 2/2 bằng hộ chiếu của người đã bỏ.
- Mong đợi: hủy đúng giấy tờ của người bị bỏ (theo lựa chọn của lễ tân hoặc theo `party_member_id`) trong cùng giao dịch; dồn số ô; `required_count` theo số người mới (đề xuất 1–5 của thẻ SEC).
- Bằng chứng: `reviews/s3-SEC.md` mục 9.3 (bảng R1–R6); test tái hiện của SEC ngoài repo (`scratchpad/gate/sec/a38.test.ts`, `report.json`). QA không chạy lại (SEC đã đo trên DB thật).
- Hệ quả cổng: ngoại lệ ORC dòng 593 (1) chỉ áp cho "sai tiền đã biết ở đường hiếm"; lỗi này là C3/dữ liệu và chưa có ngoại lệ → QC/ORC quyết khi chấm lại cổng Sprint 3 (QA chỉ quyết mức). Nếu không sửa kịp trong Round 2, QA lập ESC theo protocol.
- Chấm lại (QA 17/10, mục 9): đã có (1) vòng 9b BE phương án dự phòng (`ea29582`) – SEC Verified phần BE (`s3-SEC.md` 9.5: không còn hủy theo số ô, giấy tờ chưa gắn chờ 24 giờ, `required_count` theo đoàn); (2) vòng 9c BE (`e6d1a7d`): SEC-BE-54 (mark-sent `REGISTRATION_INCOMPLETE`), BE-55/56 (khách gửi lại ô chờ → giấy tờ mới, không mang đồng ý cũ, hold giữ hạn), loại giấy tờ chờ khỏi cảnh báo visa (BE-58 (1)); (3) vòng 9c FE (`fe4b166`) – FE-07 bước 1–3: gắn giấy tờ vào người, nhãn "Chờ gắn người – tự xóa lúc …", mục "Cần chú ý", xem ảnh giấy tờ: **TC-L3-077** (E2E-UI bấm thật, MutableClock) xanh ở CI 39015560449. QA không tự kiểm C3/xóa theo hạn ngoài TC-L3-077 – SEC đang kiểm song song (SEC-G1 a).
- Quyết định QA (15:40): **giữ Open, giữ P0** tới khi SEC ghi kết luận về FE-07 trong `s3-SEC.md`. Khi SEC Verified, QA chấm lại mức phần còn lại (phương án chính `guestUploadPersonIndex`, contract 0.3.7 – PATCH chỉ gắn người, `DOCUMENT_UNCLAIMED_EXISTS` –, BE-57, BE-58 (2), giấy tờ lễ tân tự nhập chưa gắn người) ở S4-39 và đóng/tách lỗi. Hạn SEC-G1 không đổi.
- **Chấm lại lần 2 (QA 17/10 ~16:00, ĐK-S3-12 – cổng QC S3 bản 3) → Closed (phần P0), tách phần còn lại thành BUG-R2-085 (P1).**
  - Điều kiện QA đặt ra lúc 15:40 đã có: `s3-SEC.md` 9.6 f – FB-R2-SEC-FE-07 **Verified** đầu–cuối trên `fe4b166` (stack dựng từ `git archive fe4b166`, Desk bấm thật: nhãn chờ, "Cần chú ý", step-up trước khi xem ảnh, `reason=registration`, no-store, thu hồi object URL, gắn người, J16 giữ giấy tờ đã gắn và xóa giấy tờ không ai nhận qua C5), SEC-G1 (a) ĐẠT, "SEC đồng ý đóng (Closed)" (decision-log dòng SEC 606).
  - QA tự kiểm lại (không chỉ dựa vào SEC): đọc log CI 39015560449 trên `fe4b166` (QC đã đối chiếu `headSha`) – **TC-L3-077 ✓** (#1865, desk-clock, bấm thật tới API thật, có trong `WRITES` nên không bị bỏ qua im lặng); job api trên PostgreSQL thật: **`registration-party-removal.test.ts` 12/12 ✓**, **`registration-flow.test.ts` 22/22 ✓** (các ca SEC-BE-53/54/55/56/58 (1)). Đọc mã `registration.service.ts` `onPartyMemberRemoved` (~2041–2097): chỉ hủy ngay giấy tờ gắn đúng người bị bỏ (`party_member_id = memberId`); giấy tờ chưa gắn từ Khách 2 chỉ được đặt hạn 24 giờ (`fields_purge_after`, `delete_after`, không lùi hạn đã có); không còn điều kiện `person_index > persons`; `required_count` theo số người của đơn. QA không dựng lại stack (môi trường từ chối `docker build`) – các số đo DB trên là của SEC 9.6 b.
  - Ba hiện tượng P0 của lỗi gốc đều hết: (1) không còn hủy không hoàn tác giấy tờ của khách còn ở theo vị trí ô; (2) không còn giữ/tính đủ người bằng giấy tờ của người đã rời đoàn (giấy tờ chưa gắn thôi được tính, mark-sent chặn `REGISTRATION_INCOMPLETE`); (3) link không còn báo đủ người bằng giấy tờ của người không ở. Rủi ro còn lại (lễ tân bỏ qua "Cần chú ý" quá 24 giờ thì giấy tờ của người còn ở bị xóa) là thiết kế dự phòng SEC chấp nhận; khách gửi lại được – không còn là "mất dữ liệu ngoài ý muốn".
  - **Không hạ mức vì tiến độ:** mức P0 giữ nguyên cho lỗi đã sửa (đóng ở P0). Phần chưa làm là việc khác, có mức riêng – **BUG-R2-085, P1** (lý do ở mục chi tiết 085). Không cần ESC: 083 đã sửa trong Round 2; 085 là P1 có hạn trước cổng QC Sprint 4.

### BUG-R2-084 – KB7: trả phòng sau giờ ân hạn vào thẳng H16 không thu được phụ thu trả muộn (UXR đi lại 17/10 chiều)
- Mức: **P1** (trả phòng – luồng chính hằng ngày – không làm trọn được trên Desk với giờ thật sau 12:30 nếu lễ tân không biết bấm "Trả muộn" ở drawer trước; có cách vòng). Lỗi tiền mặc định P0 (test-strategy mục 8); QA xếp P1 vì **không thu thiếu im lặng**: để giờ mặc định 12:00 thì B18 đòi ghi chú "vì sao ghi bù" (giờ sớm hơn lúc bấm), sửa sang giờ thật thì B18 tự tính phụ thu theo giờ, đòi quyết định phụ thu (422 `SURCHARGE_DECISION_REQUIRED`) rồi không cho hoàn tất khi còn phải thu (409 `BALANCE_DUE`) – lễ tân phải chủ động khai giờ sai kèm lý do mới bỏ được phụ thu (QA đọc mã `checkout.service.ts:299-345, 410-414`; chưa bấm lại trên mã cũ) · Môi trường: demo dựng từ `9a221ee`, UXR đi lại 17/10 chiều (`demo-1-limits.md` mục C dòng "mới · KB7", guide v1.2 KB7 bước 0) · Vai sửa: FE (+ ARC/BE-A `serverTime` cho `CheckoutSummary` – S4-47) · Trạng thái: **Closed** (chấm lại cổng 17/10, mục 9)
- Liên quan: US-036 AC1, US-038 AC1, BR-401, BR-412 (oracle BR-412-01), BR-414, ESC-007 A (ân hạn 12:30), SM-01 B15/B18; `getCheckoutSummary`, `setLateCheckout`, `checkOut`
- Bước: đơn đang ở, không hẹn trả muộn, sau 12:30 → mở thẳng Trả phòng (H16) → bước 2 → bước 3.
- Thực tế (trước sửa): bước 2 để sẵn giờ trả 12:00 + "Trả đúng giờ – không phụ thu"; Hoàn tất → đòi ghi chú ghi bù (ô ghi chú ở bước 2); sửa giờ thành giờ thật thì bước 2 nêu phụ thu nhưng bước 3 không cộng vào số cần thu ("Đã thanh toán đủ", không có ô thu).
- Mong đợi: giờ mặc định = giờ hiện tại; phụ thu theo BR-412 ở bước 2, lễ tân xác nhận đã báo khách; bước 3 thu đủ cả phụ thu; hoàn tất không `409 BALANCE_DUE`; phụ thu ghi đúng một lần.
- Sửa (`fe4b166`, decision-log FE "KB7"): giờ mặc định = giờ máy quầy; phụ thu cao hơn số đã ghi → tick ở bước 2 (nút Tiếp tục khóa + nêu lý do) → ghi B15 `setLateCheckout` (giờ thực tế, `expectedSurchargeVnd`) trước bước Bill; thấp hơn để B18 tự đảo; lỗi giờ/ghi chú của B18 đưa về bước 2.
- Kiểm lại: CI 39015560449 (`fe4b166`): ca KB7 trong `ui-clock/checkout.h16.spec.ts` (nay **TC-L4-096**) xanh ngay lượt đầu – bước 2 giờ 14:00, phụ thu 30 % × giá đêm cuối theo oracle, "Tiếp tục" khóa khi chưa tick, folio chưa có dòng `late_checkout`; bước 3 còn phải thu = phụ thu; thu tiền mặt → hoàn tất: `checked_out`, folio `settled`, dòng `late_checkout` đúng một lần. Unit `checkout.test.tsx` (3 ca KB7) QA chạy lại 17/10: xanh. Chưa kiểm: giờ mặc định khi đồng hồ máy quầy lệch máy chủ (S4-47 – chờ `serverTime`); UXR chưa đi lại KB7 trên bản có `fe4b166` (guide v1.2 còn bước 0 "bấm Trả muộn trước" – ORC/UXR bỏ khi dựng lại demo).
- Ca chống tái phát: TC-L4-096 (E), có trong danh sách `WRITES` của CI.

### BUG-R2-085 – Bỏ người khỏi đoàn: phần còn lại của BUG-R2-083 (phương án chính, contract 0.3.7, BE-57, BE-58 (2)) – S4-39
- Mức: **P1** · Môi trường: mã `fe4b166` (FE) + `e6d1a7d` (BE-C); SEC kiểm trên stack dựng từ `git archive fe4b166` (`s3-SEC.md` 9.6), QA đọc log CI 39015560449 và đọc mã, 17/10 · Vai sửa: ARC (contract 0.3.7), BE-C (`registration.service.ts`), BE-A (`party.service.ts` – `removePartyMember`), FE + UXD (hộp chọn ô, gắn người không đọc C3) · Trạng thái: **Open** – S4-39 · Hạn: **trước cổng QC Sprint 4** (SEC-G1 b – SEC Verified); tách từ BUG-R2-083 ngày 17/10 (ĐK-S3-12)
- Liên quan: US-022, US-047 AC2, US-049, A-38, T03; FB-R2-SEC-BE-53 (Major – còn Open chỉ vì phần này), BE-57 (Minor), BE-58 (2) (Suggestion), `s3-SEC.md` 9.6 e1/e2; `removePartyMember`, `updateGuestDocument`, `addGuestDocument`; TC-L3-077 (phương án dự phòng)
- Bước: đơn đang ở 3 người lớn (người đi cùng A, B), khách gửi giấy tờ Khách 1/2/3 qua link; lễ tân bỏ A.
- Thực tế (sau vòng 9b/9c – đúng thiết kế dự phòng, chưa phải đích):
  1. Desk không hỏi giấy tờ nào là của A (chưa có `guestUploadPersonIndex`) → mọi giấy tờ chưa gắn từ Khách 2 thành "Chờ gắn người – tự xóa lúc …" (24 giờ). Lễ tân không gắn kịp thì giấy tờ của **B (còn ở)** bị J16 xóa; khách phải gửi lại.
  2. "Gắn người" (OpenAPI 0.3.6) bắt lễ tân đọc đủ trường C3 (step-up, log C3) rồi nhập/gửi lại cả bộ; hộp sửa không tự đóng sau 60 giây hay khi ẩn tab (SEC 9.6 e2). Cách vòng tốn công, dễ bỏ dở (UXR N6 – BUG-R2-091).
  3. 409 `PARTY_DUPLICATE` không kèm id → nút "Mở giấy tờ chờ gắn người" chỉ mở giấy tờ chờ **đầu tiên**; từ 2 giấy tờ chờ trở lên dễ mở nhầm (SEC 9.6 b7, e1).
  4. BE-57: `retireUnclaimed` ghi log C3 `delete` cả khi đơn đang hold và chưa xóa gì; nhánh `legal_hold` của `removeDocument`. BE-58 (2) (Suggestion).
  5. Giấy tờ lễ tân tự nhập mà chưa gắn người (dữ liệu trước `fe4b166` hoặc tạo qua API không có `partyMemberId`; `person_index` NULL) không được xử lý khi bỏ người: không hủy, không chờ gắn (`onPartyMemberRemoved` chỉ xét `person_index ≥ 2`).
- Mong đợi: thẻ SEC-BE-53 đề xuất 2–5 và S4-39: `removePartyMember` nhận `guestUploadPersonIndex` (bắt buộc khi còn giấy tờ chưa gắn; 422 `REQUIRED` chỉ kèm số "Khách n"), BE-C hủy **đúng** giấy tờ được chọn trong cùng giao dịch (DEK, ảnh, trường, `removed_at`, log C3, `purge_journal`) và dồn số ô; PATCH chỉ `partyMemberId` (FE không đọc C3 chỉ để gắn người); `DOCUMENT_UNCLAIMED_EXISTS` kèm id; BE-57, BE-58 (2) theo SEC; quy tắc cho giấy tờ lễ tân tự nhập chưa gắn người.
- Vì sao **P1** (không P0, không P2): không còn mất dữ liệu C3 ngoài ý muốn, không lộ C3, không sai tiền (SEC 9.6 f4; QA mục 10.1) → hết tiêu chí P0. Nhưng đây là luồng chính hằng ngày có hệ quả pháp lý (khai báo lưu trú, giấy tờ của khách còn ở), cách vòng hiện tại **rất tốn công** (nhập lại mọi trường C3, phải gắn trong 24 giờ) và một thẻ Major của SEC còn mở → đúng định nghĩa P1 (test-strategy mục 8). P1 cũng khớp hạn: "không còn P1 mở khi qua QC" – trùng điều kiện SEC-G1 (b) của cổng QC Sprint 4.
- Bằng chứng: `reviews/s3-SEC.md` 9.3 (thẻ BE-53), 9.5 (BE-57, BE-58), 9.6 b/e/f; `s4-carryover.md` S4-39; mã `registration.service.ts` `onPartyMemberRemoved`.
- Ca kiểm khi sửa: TC-L3-077 (giữ cho đường dự phòng) + ca mới cho hộp chọn ô và PATCH chỉ `partyMemberId` (QA viết khi ARC chốt 0.3.7).

### BUG-R2-086…103 – Điểm UXR mới: N1–N6 (đi lại `fe4b166`) và các dòng "mới" của `demo-1-limits.md` mục C (cổng QC S3 bản 3, ĐK-S3-3)
Môi trường: demo `ottimo-demo` – N1–N6: dựng từ `fe4b166`, UXR đi lại 17/10 15:20–15:45 (ảnh `scratchpad/regate/uxr/shots/` trong scratchpad của phiên, không đưa vào git); 092…103: UXR đi lại sau vòng sửa 9 (17/10 chiều, `9a221ee`, ảnh `scratchpad/gate/uxr/shots/`) và vẫn còn ở v1.3. Dữ liệu giả. QA ghi theo quan sát của UXR, đọc mã để tìm gốc và chốt mức (cột "Gốc"); QA **chưa bấm lại riêng** các điểm này. Mức UXR đề xuất cho N1–N6 là P3 – QA giữ P3 hoặc **nâng** có lý do, không hạ. Trạng thái cả nhóm: **Open**.

**Đánh số N1–N6 (giả định QA):** UXR không có tệp đánh số N1–N6; QA lấy theo thứ tự các điểm ghi **mới** ở v1.3 của limits mục C (4 dòng "mới" + 2 điểm "mới:" trong dòng "Bỏ một người khỏi đoàn"). Khớp hai mốc QC dùng: N2 = khung Folio KB7 (QC K4), N6 = "Gắn người" (QC V3.7). UXR/ORC báo nếu thứ tự khác – mã BUG không đổi.

| ID | Mức | Điểm (gặp khi → thực tế → mong đợi) | Gốc (QA đọc mã) | Bằng chứng | Vai sửa | Vì sao mức này |
|---|---|---|---|---|---|---|
| BUG-R2-086 (N1) | P3 | KB4 H14, bấm "Xem đủ số / ảnh" khi giấy tờ có ảnh → chip "Đã có" và nút "Ẩn số" bên phải ảnh đè lên nhau → hai phần tử không chồng nhau ở 1366×768 | Bố cục hàng giấy tờ `DocsPanel.tsx` khi khung ảnh mở | ảnh 017, 018 (lượt `fe4b166`) | FE | Thẩm mỹ; nút vẫn bấm được, số và ảnh vẫn tự ẩn sau 60 giây |
| BUG-R2-087 (N2) | **P2** (nâng từ P3) | KB7 trả phòng sau 12:30, bước Minibar/Phụ phí → khung Folio: dòng 750.000 + 863.000 + 60.000 + 35.000 + 25.000, Đã thu −1.613.000, "Còn phải thu **552.000**" (= 120.000 + phụ thu trả muộn 432.000 chưa có dòng) → có dòng "Phụ thu trả muộn (dự tính)" như dòng đêm thêm, hoặc chưa cộng tới khi ghi | `CheckOutPage.tsx:209` `balance = balanceDueVnd + extraNightVnd + lateDelta − credit`; bảng :384–410 chỉ có dòng giả cho đêm thêm (`extraNightVnd`), không có cho `lateDelta` | ảnh 032 (lượt `fe4b166`) | FE | Lỗi tiền mặc định P0; đã chứng minh không sai tiền (bill 2.195.000, cần thu 582.000, VietQR 582.000 – UXR 15:33; QC K4). Nhưng khung tiền chính của màn trả phòng có các dòng không cộng ra tổng → lễ tân khó giải thích cho khách, dễ nghi app sai = "UX gây nhầm có cách khắc phục" (bước Bill đúng) → P2, như BUG-R2-078 |
| BUG-R2-088 (N3) | P3 | KB7 bước Phụ phí sau 12:30 → cạnh nút "Tiếp tục" đang khóa chỉ lặp lại câu "Tôi đã báo khách khoản phụ thu này" → câu nói rõ "Tick ô … để tiếp tục" (như `ci.submit_needs_told` ở H13) | Lý do khóa cạnh nút dùng lại chuỗi `ci.told_guest` | ảnh 032 | FE + UXD (S4-48) | Câu chữ; ô tick ở ngay trên |
| BUG-R2-089 (N4) | **P2** (nâng từ P3) | KB9 phần lễ tân, đơn khách đã gửi ảnh qua link, lễ tân chưa nhập trường → danh sách Giấy tờ & khai báo "0/2", màn chi tiết "Đã có giấy tờ 2/2 người" + chip "Đã có" cho dòng "Chưa nhập thông tin giấy tờ" → hai màn cùng một cách đếm (giấy tờ đủ trường để khai báo); dòng chưa có trường không mang chip "Đã có" | `DocsPanel.tsx:98` `checkin.docs.progress` với `have: docs.length` (mọi giấy tờ, kể cả chỉ có ảnh); danh sách dùng `submittedCount/requiredCount` của server (`RegistrationPage.tsx:192`) | ảnh 047 (lượt `fe4b166`) | FE (+ UXD chữ) | Màn khai báo lưu trú (pháp lý) tự mâu thuẫn, câu "Đã có 2/2" sai với dữ liệu → lễ tân có thể tưởng đủ để khai báo. Có chặn ở server (mark-sent 409 `REGISTRATION_INCOMPLETE`, SEC-BE-54) và danh sách đúng → P2, không P1 |
| BUG-R2-090 (N5) | **P2** (nâng từ P3) | Bỏ một người khỏi đoàn khi khách đã gửi ảnh qua link → hộp "Bỏ {tên} khỏi đơn? Giấy tờ và ảnh của người này sẽ bị xóa ngay." không nhắc giấy tờ khách gửi qua link từ Khách 2 sẽ "Chờ gắn người – tự xóa sau 24 giờ" → hộp nêu số giấy tờ sẽ chờ gắn, hạn tự xóa và việc phải "Gắn người" | Chuỗi `party.remove_confirm` có từ trước vòng 9b, chưa đổi theo phương án dự phòng | limits v1.3 dòng "Bỏ một người…" (UXR thử trên demo) | FE + UXD | Rủi ro còn lại SEC chấp nhận (9.6 f4) dựa vào việc lễ tân thấy và gắn kịp; hộp xác nhận là lúc lễ tân quyết định mà lại nói thiếu (và phần "xóa ngay" không đúng với giấy tờ qua link) → dễ mất giấy tờ của khách còn ở. Có cách khắc phục (nhãn chờ, "Cần chú ý", dải cảnh báo trong đơn) → P2. Phương án chính S4-39 (BUG-R2-085) thay hộp này |
| BUG-R2-091 (N6) | P3 | Gắn người cho giấy tờ chờ, thiếu trường → đầu hộp chỉ ghi chung "Bắt buộc" (dòng đỏ ở từng ô vẫn có) → đầu hộp nêu số ô cần sửa ("Còn {n} ô cần sửa") như form khác | Hộp sửa giấy tờ dùng câu lỗi chung | limits v1.3 dòng "Bỏ một người…" | FE + UXD | Câu chữ; dòng đỏ từng ô vẫn có. Việc phải nhập lại mọi trường là BUG-R2-085 |
| BUG-R2-092 | P3 | KB4 H13, giờ nhận sớm hơn lúc bấm → app đòi "Ghi chú giờ nhận (vì sao ghi bù)"; gõ ghi chú hoặc sửa giờ → dòng đỏ "Giờ này sớm hơn lúc bấm khá lâu…" vẫn còn tới lần bấm sau → dòng đỏ mất khi đã gõ ghi chú/sửa giờ | `CheckInPage.tsx:630` giữ `act.fields.checkinTimeNote` tới lần gửi sau; H16 đã sửa ở `fe4b166` (KB7), H13 chưa | limits mục C dòng KB4; UXR v1.3 xác nhận còn | FE | Thông báo cũ trên màn; không chặn thao tác |
| BUG-R2-093 | **P2** | KB6 thêm người lớn vượt định mức khi đang ở → hộp có ô xác nhận và số phụ thu nhưng chỉ "Vẫn ghi phụ thu rồi báo quản lý" → thêm lựa chọn "ghi phụ thu kèm đề nghị FOC" (BR-414: hai cách – ghi, hoặc ghi + đề nghị FOC BR-432/433; US-022 AC4 "như BR-414") | Hộp thêm người (vòng 9 – BUG-R2-071) chưa có nhánh xin FOC; API `requestFoc` có | limits mục C dòng KB6; ảnh 029–030 (`gate/uxr/shots`) | FE (+ UXD, BE-B) | Quy tắc BR-414 thiếu một nhánh ở chức năng phụ; có cách khắc phục (ghi rồi quản lý xử lý) → P2. **Chỉ phát hành sau khi sửa BUG-R2-056/059** (FOC phụ thu người mất/không áp – S4-34) |
| BUG-R2-094 | P3 | KB6 → ô tìm người đi cùng mang nhãn "Khách đứng tên" → nhãn "Người đi cùng" | `StayDialogs.tsx:1221` `GuestPicker label={t('booking.field.guest')}` | limits mục C dòng KB6 | FE (+ UXD) | Câu chữ |
| BUG-R2-095 | P3 | KB7 mở lại màn Trả phòng lần hai → khung Folio hiện thêm cặp dòng minibar âm/dương → không đảo/ghi lại khi số đếm không đổi; khung Folio ẩn cặp đã đảo | Bước 1 luôn gọi `recordMinibarCheck(mode: checkout)`; BE thay lần kiểm cũ: đảo dòng minibar cũ (`minibar.service.ts`, lý do `minibar_recount`) rồi ghi lại, kể cả khi không đổi → Nhật ký tiền thêm dòng | limits mục C dòng KB7 "mở lại" | FE + BE-B | Bill và tổng đúng (cặp dòng cộng 0); nhiễu nhật ký tiền. Không sai tiền → P3 |
| BUG-R2-096 | P3 | KB7 Thêm phát sinh, khoản Giặt ủi → dòng hướng dẫn "… Phí phạt không tính vào doanh thu phòng." → câu theo nhóm khoản (chỉ nhóm phạt/hư hỏng có câu này) | `stay.charge_default` dùng cho mọi khoản | limits mục C dòng KB7 "Giặt ủi" | UXD + FE | Câu chữ sai nghĩa, không sai tiền |
| BUG-R2-097 | P3 | KB8 sau khi chi hoàn → thông báo "Đã ghi hoàn -500.000 đ." → "Đã ghi hoàn 500.000 đ." | `MoneyPage.tsx:802` `money(out.data.amountVnd)` (giao dịch hoàn mang số âm); danh sách :540 dùng `a.refundedVnd` (đúng) | limits mục C dòng KB8 | FE | Định dạng số |
| BUG-R2-098 | P3 | KB8 chủ đầu tư bấm "Xem đủ số tài khoản" → hộp nhập mật khẩu ghi "Xác nhận lại để xem giấy tờ" → tiêu đề theo thứ đang xem ("… số tài khoản") | `StepUpDialog` (`stay/common.tsx:180`) dùng cố định `ci.stepup_title` | limits mục C dòng KB8; ảnh 055 (`gate/uxr/shots`) | FE + UXD | Câu chữ; step-up vẫn đúng |
| BUG-R2-099 | P3 | KB8 → dòng "Ngân hàng nhận" hiện mã BIN (970436) → tên ngân hàng | `MoneyPage.tsx:839` in `full.bankBin`; chưa có danh sách ngân hàng VietQR (cùng gốc BUG-R2-074) | limits mục C dòng KB8 | FE + UXD + INT | Hiển thị; tài khoản và số tiền vẫn đúng |
| BUG-R2-100 | P3 | KB8, KB10 Nhật ký tiền › Nhật ký thao tác tiền → cột Lý do hiện `guest_changed_mind`, `found_other`, `minibar_recount` → câu tiếng Việt/Anh | `MoneyPage.tsx:275` in `e.reason` thô | limits mục C; ảnh 057 (`gate/uxr/shots`) | FE + UXD | Câu chữ; mã vẫn đọc được |
| BUG-R2-101 | **P2** | KB1 drawer đơn **giữ chỗ** chưa cọc (D5) → Folio "Đã thu 0", "Còn phải thu **0 đ**"; số cần thu chỉ ở dòng "Cọc cần thu" → không ghi "Còn phải thu 0" khi khách chưa trả gì (hiện số cọc cần thu / tiền phòng còn lại, hoặc bỏ dòng trước khi có folio) | `ReservationDrawer.tsx:526-529` in `r.balanceDueVnd` – = 0 khi đơn chưa có dòng folio | limits mục C dòng KB1; ảnh 003 | FE + UXD (+ ARC nghĩa `balanceDueVnd` trước nhận phòng) | Số tiền hiển thị sai nghĩa ở khung tiền của đơn → dễ hiểu "không còn nợ" (cùng lý do BUG-R2-078 P2); có cách khắc phục (dòng "Cọc cần thu") → P2 |
| BUG-R2-102 | **P2** | KB8 drawer đơn **đã hủy và đã hoàn** → Folio "Đã thu −500.000", không có dòng "Đã hoàn" → có dòng "Đã hoàn 500.000" và số đã thu ròng | `ReservationDrawer.tsx:522` in số đã thu kiểu khấu trừ; `paidVnd` của server không trừ hoàn (QC đọc `folio.service.ts:252`) | limits mục C dòng KB8 "đã hủy và đã hoàn"; ảnh 048 (`gate/uxr/shots`) | FE (+ BE-B/ARC nếu cần `refundedVnd`) | Khung tiền gây hiểu là khách sạn còn giữ 500.000 của khách đã được hoàn; số đúng ở Nhật ký tiền › Hoàn tiền → P2 |
| BUG-R2-103 | P3 | KB4, KB6, KB7 drawer đơn đang ở → Folio có 2 dòng "Còn phải thu" cùng số → một dòng | `ReservationDrawer.tsx:526` (`r.balanceDueVnd`) và :571 (`folio.totals.balanceDueVnd`) cùng hiện khi có folio | limits mục C dòng KB4/6/7 | FE | Trùng dòng, cùng số. Đã có ở S4-45 |

Ghi chú: (1) Ảnh nằm trong scratchpad của phiên (không đưa vào git vì là ảnh màn hình demo; dữ liệu giả, không có mật khẩu/token/link). (2) 3 điểm của limits v1.2 đã được `fe4b166` sửa và UXR v1.3 đã bỏ: KB7 trả phòng sau 12:30 (BUG-R2-084), KB4 nút "Xem đủ số / ảnh" chưa mở ảnh (FE-07), phần KB7 của dòng "ghi chú giờ". (3) Các dòng không ghi "mới" của limits mục C đã có mã từ trước – bảng đối chiếu ở mục 10.4.

### BUG-R2-104 – Giảm giá đặc biệt luôn định tuyến lên quản lý: lễ tân trưởng không duyệt được trong hạn mức
- Mức: **P2**. Lệch quy tắc kinh doanh/RBAC, có cách vòng (quản lý duyệt). Không sai tiền khách, nhưng lễ tân trưởng bị chặn khoản trong hạn mức, hàng chờ của quản lý dồn thêm, và hạn mức tháng BR-433 tính sai người.
- Môi trường: stack QA `ottimo-qa-s4`, ảnh api dựng từ HEAD `94c711d` (`INCLUDE_TEST_SUPPORT=1`), seed DS-E, ⏱ ngày ảo, 17/10 ~19:20.
- Vai sửa: BE-B.
- Trạng thái: **Open**. Hạn: Sprint 4, cùng S4-18/S4-23 (ca BR-433-03 nằm trong G1).
- Bước:
  1. Đơn Trực tiếp căn 203, 3 đêm từ thứ Năm.
  2. `qa.fd` `requestFoc` `kind=special_discount` 300.000 (`regular_vip`) trên dòng `room` đêm đầu.
  3. `qa.fdl` `approveRequest` (mật khẩu của chính mình).
- Thực tế:
  - yêu cầu tạo với `requiredRole = manager`;
  - lễ tân trưởng duyệt → `403 APPROVAL_LIMIT_EXCEEDED` (`approver: manager`).
  Gốc: `services/api/src/modules/approvals/internal/limits.ts:36` `minRoleFor()` trả `front_desk_lead` chỉ cho `foc` và `checkin_room_not_ready`; `special_discount` luôn bắt đầu từ `manager`.
- Mong đợi:
  - BR-431: giảm giá đặc biệt "đi qua cùng cơ chế duyệt";
  - BR-433: lễ tân trưởng ≤ 300.000/lần, ≤ 1.500.000/tháng;
  - rbac-matrix A36: FDL ✔ ²⁵ "trong hạn mức lần và tháng của vai";
  - oracle BR-433-03 (`approverRole: front_desk_lead`, còn 1.200.000) và BR-434-11 (giảm giá 250.000 do lễ tân trưởng duyệt).
  Kết quả: `requiredRole = front_desk_lead`, lễ tân trưởng duyệt được, trừ hạn mức tháng của chính người đó.
- Bằng chứng: `e2e/clock/money-s4.clock.spec.ts` TC-NT-049 (4) phần hạn mức. Lượt chẩn đoán `E2E_FIXED_BUGS=…` hỏng đúng ở `requiredRole` (`manager` ≠ `front_desk_lead`); log `scratchpad/qa-s4/run-clock-*.json`.
- Ghi chú: nếu đội muốn giữ "giảm giá đặc biệt cần quản lý" thì đó là đổi chính sách. DOM sửa BR-431/433 và oracle, BA sửa rbac A36; khi đó QA đổi ca. Không tự chọn thay.

### BUG-R2-105 – CI 39028814256 đỏ TC-L7-010 do chính ca test (race khi chọn nút "Chụp" theo vị trí)
- Mức: **P1**. CI đỏ, 121 ca phụ thuộc không chạy (`limits`, `rbac-logout`, `serial`, `clock`, `desk-clock`, `db-outage`), chặn G5. Tiền lệ: BUG-R2-015, 053.
- Môi trường: GitHub Actions run 39028814256, job 117386390431, commit `cc218b2`, Playwright `retries: 1`.
- Vai sửa: QA (ca test).
- Trạng thái: **Fixed** (cây làm việc 17/10). **Closed** khi CI xanh trên commit có bản sửa.
- Bước: CI chạy `ui/guest-web.h18.spec.ts` TC-L7-010: khách 1 chụp CCCD, khách 2 chọn Hộ chiếu rồi bấm "Chụp".
- Thực tế: `locator.click: Test ended … getByRole('button', { name: 'Chụp' }).nth(1)`, hết 90 giây ở cả hai lượt.
  - Trace lượt 1: lệnh tải ảnh khách 1 xong ở ~218,956 s; lệnh bấm `.nth(1)` bắt đầu ở 218,962 s.
  - Khi khách 1 tải xong, ô khách 1 chỉ còn "Đã gửi" + "Gửi lại" (đúng thiết kế ĐK-3, `apps/guest-web/src/checkin/DocumentsStep.tsx:238-257`), nên chỉ còn một nút "Chụp" và `.nth(1)` không còn.
  - Mọi lệnh API của guest-web trong trace đều 2xx. Log PostgreSQL trong khoảng chạy ca không có "violates check constraint".
  - `cc218b2` không đổi `apps/` hay `tests/e2e/`. Ca đã chập chờn cùng chỗ ở CI 38980363276; lần xanh 39022807917 là nhờ thời điểm.
- Mong đợi: ca chọn nút "Chụp" **của đúng người** và chờ ảnh của người đó tải xong trước bước sau.
- Sửa (cây làm việc, chưa commit):
  - `photo()` chọn nút bằng `aria-describedby~="gw-p{n}-name"`;
  - sau `setFiles` chờ nút đó biến mất (`toHaveCount(0)`).
  QA rà: thuộc tính có ở `DocumentsStep.tsx:369`. Chạy trên stack `ottimo-qa-s4` (api HEAD; ảnh web cũ `qa-r9` cùng mã guest-web): 3/3 lượt qua bước chụp của cả hai khách.
  Bước cuối của ca ("Thủ tục đã xong…") chưa kiểm được ở máy: chuỗi `guest.oci.done_title` trên cây làm việc đã được UXD đổi, ảnh web cũ chưa có chuỗi mới. CI dựng ảnh mới từ cùng commit sẽ khớp.
- **Kết luận cho ORC:** nguyên nhân ở **test**, không ở API hay CHECK của `0055`. BE-C không cần sửa gì cho TC-L7-010.
- Bằng chứng: `scratchpad/ci/job.log`, `ci/artifact/` (`error-context.md`, `trace.zip`), `ci/trace0/`, `ci/trace1/`; QA chạy lại: `scratchpad/qa-s4/run-ui-1.json`.

### BUG-R2-106 – Duyệt hoàn sau "Tải lại" đôi khi vẫn gửi phiên bản cũ (B-6, H17)
- Mức: **P3**. Không sai tiền: server chặn bằng 412, không duyệt nhầm. Quản lý phải bấm "Tải lại" thêm lần nữa. Ca TC-NT-052 (E) chập chờn, không vào `WRITES` được (G5: 0 lần chạy lại).
- Môi trường: stack QA `ottimo-qa-s4`, api = cây làm việc 17/10 ~20:25 + patch B-6 (`outputs/BE/s4-be-b-b6-expected-version.patch`), admin-web build từ cây làm việc ~20:27, Chromium 1366×768.
- Vai sửa: FE-A (cùng PR B-6). Trạng thái: **Open**.
- Bước (TC-NT-052 (E)):
  1. `qa.mgr` mở hộp duyệt hoàn 200.000 (phiên bản v0).
  2. Lễ tân đổi nơi nhận (v1).
  3. Quản lý bấm Duyệt → 412, hộp báo "vừa được sửa…", bấm "Tải lại".
  4. Mở lại hộp duyệt, nhập mật khẩu, bấm Duyệt.
- Thực tế: 3/4 lượt gửi v1 → 200. 1/4 lượt hộp lại báo "vừa được sửa…", nút Duyệt khóa (lệnh thứ hai vẫn mang v0 → 412). Đã chờ danh sách vẽ lại xong (`networkidle`, thẻ hiện lại) trước khi mở lại – vẫn gặp.
- Mong đợi: sau "Tải lại", hộp duyệt mở lại luôn dùng `ApprovalRequest.version` mới nhất.
- Bằng chứng: `scratchpad/qa-s4/run-ui-7.json`, `run-ui-8.json`, `results-ui8/*/error-context.md`.

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

## 5. Kiểm lại lần 2 – vòng sửa 2 + 3 (QA, 17/10/2026 06:40–07:35)

Cách kiểm: ảnh `ottimo-api`/`ottimo-web` build từ **cây làm việc lúc 06:48** (nội dung trùng commit `16941c6` – không tệp nguồn nào đổi sau đó), `--build-arg INCLUDE_TEST_SUPPORT=1`; stack dùng một lần dựng mới mỗi lượt, `STAFF_REQUESTS_PER_MINUTE=5000` như `make-ci-env.sh` mới, Origin bật như CI; bỏ `test.fail` theo danh sách ORC (giữ 038, 033 (b)). **2 lượt như CI: 1.770 đạt / 0 trượt / 82 bỏ qua / 2 trượt dự kiến / 0 flaky và 1.769 / 0 / 82 / 2 / 1 flaky** (TC-L5-050 – 409 `CONCURRENT_UPDATE` giữa ca song song, qua ở lần chạy lại). 45 lần quét axe, 0 vi phạm. 0 lần chờ 429.

| ID | Ca kiểm lại | Kết quả | Trạng thái |
|---|---|---|---|
| BUG-R2-030 | CI 38980363276 bước "Start compose stack" + 4 lượt stack mới của QA | api/worker healthy, ghi/xóa blob được | **Closed** |
| BUG-R2-031 | TC-L3-030 (E), TC-L3-001 (E) | bước Giấy tờ hiện 4 số cuối; `houseRulesSentAt`, `cardsIssued` có | **Closed** |
| BUG-R2-032 | TC-L3-001 (E) | nút bước 3 = "Tiếp tục: Giao mã & hoàn tất", không còn `{room}` | **Closed** |
| BUG-R2-033 | TC-L3-032 | (a) vẫn trượt: `docA.partyMemberId` rỗng – `document-party.port.ts:72–85` chỉ khớp theo `guest.id_doc_hmac`, cột này không được ghi ở đâu (grep toàn `services/api/src`: chỉ schema + 2 chỗ đọc) → cần ghi chỉ mục khi giấy tờ gắn với hồ sơ (người đứng tên / người có `guestId`) | **Open** (BE-C + BE-B); (b) Sprint 4 |
| BUG-R2-034 | TC-L3-004, TC-L3-037 | có mục khai báo/thị thực trong "Cần chú ý" | **Closed** |
| BUG-R2-035 | TC-L3-044, 046, 048 | J5 chạy; quá hạn + tổng hợp 22:00 cho FD/MGR | **Closed** |
| BUG-R2-036 | TC-L3-039 | J16 tại đúng hạn trên xóa ảnh | **Closed** |
| BUG-R2-037 | TC-L3-054 | 422 `VISA_EXPIRES_BEFORE_DEPARTURE` | **Closed** |
| BUG-R2-038 | TC-L3-011 | vẫn trượt đúng dự kiến | **Deferred** (0.3.7) |
| BUG-R2-040 | TC-L3-002 (b) (ca mới) | `getRack.roomStatus` = OD = `room_status` | **Closed** |
| BUG-R2-041 | TC-L4-059 | MST/tên công ty trên hồ sơ khách | **Closed** |
| BUG-R2-043 | TC-L4-066 | `CARD_NUMBER_DETECTED` | **Closed** |
| BUG-R2-045 | TC-L4-003 (theo 0.3.6 bổ sung 3) | `repricing[2 đêm].channelFeeSavingsVnd` đúng BR-422-01; trường gốc = 1 đêm | **Closed** |
| BUG-R2-046 | TC-NT-029 (b), TC-NT-030 (b), TC-NT-036 (a), TC-L4-056 | MGR duyệt/tự áp trong hạn mức 1 đêm | **Closed** |
| BUG-R2-047 | TC-L4-004 | OC → OD khi gia hạn | **Closed** |
| BUG-R2-048 | TC-RB-022 (phần mới) | `from`/`to` lọc đúng; sai định dạng 422 | **Closed** |
| BUG-R2-050 | CI 38980363276 | lint/test/build xanh, ảnh web build được | **Closed** |
| BUG-R2-051 | kịch bản riêng trên stack (`STAFF_REQUESTS_PER_MINUTE=60`) | 429 `Retry-After: 60`; reset xóa được; đóng băng +20 phút rồi trả đồng hồ → `Retry-After` 60 (trước: 247.743.660 giây) | **Closed** |
| BUG-R2-052 | TC-L3-008 (a) | 01:30 D+1 → B9 thường, không phụ thu | **Closed** (giao diện ban đêm chưa chạy lại) |
| BUG-R2-053 | tái hiện + harness dự phòng (mục 2) | xem chi tiết | **Fixed** – chờ commit `ci.yml` + CI E2E xanh |

Ca đổi theo build mới (không phải lỗi): TC-L4-063 – SAL ghi `charge` trên **giữ chỗ** → 422 `type: NOT_IN_LIST` cho mọi vai (16941c6, ARC-S3-02: tiền nhận trên giữ chỗ là cọc); phần 403 `own_deposit_only` chỉ kiểm khi đơn đã `confirmed` (lượt này G1 vẫn `hold` sau cọc của SAL – chờ xác nhận cọc, ghi chú trên ca). TC-L3-001 (E) 06:00–13:59: H13 bật "Khách nhận sớm", giờ = bây giờ, tick "đã báo khách" (luồng thật).

## 6. Kiểm lại toàn bộ Sprint 3 trên HEAD `9e9fd64` (QA, 17/10/2026 08:00–08:10 – sau vòng sửa 4)

Ảnh api/web build từ cây làm việc = `9e9fd64` (chỉ khác 2 tệp test QA chưa commit), stack dùng một lần dựng mới mỗi lượt, env như CI mới (`STAFF_REQUESTS_PER_MINUTE=5000`, Origin bật, seed DS-E). Chi tiết: `qa/s3-retest.md`. **2 lượt: 1.773 đạt · 0 trượt · 82 bỏ qua · 3 trượt dự kiến · 1 flaky** (TC-L2-057 – `confirm-deposit` ngay sau tạo giữ chỗ trả 409 `CONCURRENT_UPDATE`, qua ở lần chạy lại; ghi nhận, chưa đủ chứng cứ để ghi lỗi).

| ID | Kết quả trên `9e9fd64` | Trạng thái |
|---|---|---|
| BUG-R2-030…032, 034–037, 039–052 | ca kiểm lại đều đạt 2/2 lượt (không hồi quy) | **Closed** (giữ) |
| BUG-R2-033 | (a) TC-L3-032 vẫn trượt đúng bước (`guest.id_doc_hmac` không được ghi); (b) Sprint 4 | **Open** |
| BUG-R2-038 | TC-L3-011 trượt đúng dự kiến | **Deferred** (0.3.7) |
| BUG-R2-053 | `ci.yml` đã sửa (`c52d149`); stack QA đọc token seed bình thường; nhánh dự phòng của harness đã kiểm khi tệp map không đọc được | **Fixed** – chờ CI E2E xanh |
| BUG-R2-054 | TC-L3-074 vẫn trượt đúng bước cuối (`imagesPurgedAt` vắng mặt); mọi bước xóa ảnh đúng hạn đạt | **Open** (P3) |

Ca mới đạt ở lượt này: TC-L4-090, TC-L4-091, TC-L2-083 (api), TC-L4-092 (clock) – OpenAPI 0.3.6 bổ sung 4 (BE vòng 4); TC-L3-074 (SR-RET-02) trừ bước BUG-R2-054. Oracle bỏ `pendingFix` (BE đã xanh): BR-110-14/15/16, BR-307-02/03/04, BR-310-01/02, BR-428-06.

## 7. Cổng QC Sprint 3 – ĐK-S3-3 mở rộng theo ORC (QA, 17/10/2026 11:45–12:20)

Cách kiểm: đọc log CI bằng `gh run view --job … --log` (run 38998735861 và 5 run khác trên `main`); dựng lại stack dùng một lần `ottimo-qa-s3` với ảnh api build từ **`6af7173`** (git archive, `INCLUDE_TEST_SUPPORT=1`; web giữ ảnh cũ – không dùng ở các ca dưới), seed DS-E mới, Playwright như CI (`CI=true`, project `clock`, `--no-deps`); đọc code `6af7173` (= `product/` của HEAD, cây làm việc sạch trong `product/` trước khi QA sửa test case). Không đăng nhập bản demo.

### 7.1 Kiểm lại BUG-R2-053 → **Closed**

| Bằng chứng | Kết quả |
|---|---|
| `ci.yml` tại `6af7173` (dòng 372–373): seed chạy `--user "$(id -u):$(id -g)"`, `test -r …/ds-e.map.json` | Có; log run 38998735861 cho thấy bước này chạy và qua |
| global-setup run 38998735861 | `[e2e setup] token thiết bị quầy: seed (…/tests/fixtures/seed/.out/ds-e.map.json)` – đọc được tệp của seed, **không** dùng thiết bị dự phòng |
| Ca C3 cần thiết bị | TC-RB-001 ✓, TC-RB-002 ✓, TC-RB-022 ✓, TC-SEC-010 ✓; RBAC Sprint 3 (`rbac-sprint3`) **737 ✓**; 0 ca trượt `DEVICE_NOT_TRUSTED`; 21 dòng "bỏ qua" in ra đều là ca bỏ qua có chủ đích từ trước (extra-guest-kit, TC-L4-070/071, TC-L2-020/076 …), không ca C3/RBAC nào |
| Các run khác sau bản sửa | 38989147610 (`9e9fd64`), 38995279907 (`aeb479e`), 39000299109 (`adc0a47`): global-setup đều đọc token từ seed. Run `9e9fd64` đỏ vì TC-L4-092 (luật OTA, đã sửa sau) – không liên quan |

### 7.2 TC-L3-011 ở CI 38998735861 – lượt 1 hỏng vì sao, có che lỗi thật không

**Dữ kiện:**
- Log job E2E: `✘ 1784 … TC-L3-011 … (966ms)` rồi `✘ 1785 … (retry #1) (1.5s)`. Run chạy 1 worker, `retries: 1`.
- Có lượt chạy lại nghĩa là lượt 1 hỏng **trước** dòng `test.fail` (`checkin.s3.clock.spec.ts:834`). Nếu lượt 1 đã tới dòng đó thì nó được tính "đúng dự kiến" và không chạy lại – như TC-L3-032 (#1555) và TC-L3-074 (#1804) cùng run.
- **Không tìm được thông điệp lỗi của lượt 1.** Run không có artifact: `gh api …/runs/38998735861/artifacts` → `total_count: 0`, vì bước "Upload Playwright report" chỉ chạy `if: failure()` mà job xanh. Reporter `list` không in lỗi của ca có kết quả cuối "expected", và quanh dòng #1784 không có dòng stdout nào (không có chờ 429, không có cảnh báo harness).
- Thời lượng: ở 5 run CI khác (38989147610, 38995279907, 38995318918, 38995426050, 39000299109 – run cuối cùng mã `6af7173`), TC-L3-011 chạy **một lượt**, tới `test.fail` và hỏng đúng dự kiến trong **840 ms – 1,3 s**. Lượt 1 ở run này kéo dài 966 ms, tức đã đi gần hết ca. Nhiều khả năng nó hỏng ở nửa sau: tạo đơn thứ hai 202 (`makeStay`: tạo khách, tạo đơn, thu đủ, thêm giấy tờ) hoặc bước nhận phòng có xác nhận phụ thu trước đó. Đây là suy luận, không phải bằng chứng.
- 17 lượt chạy đủ của QA trên stack dùng một lần, ở ba build `229db99`, `16941c6`, `9e9fd64` (`scratchpad/qa-s3/*.json`): TC-L3-011 lượt 1 luôn tới `test.fail`, 0 lần chạy lại.
- **Tái hiện trên `6af7173`:** chạy riêng TC-L3-011 **300 lần liên tiếp** (`--repeat-each=300 --retries=0`, 3,5 phút, có worker tick mỗi 60 giây chạy song song). Kết quả 300/300 tới `test.fail` và hỏng đúng bước BUG-R2-038 (`r2` nhận 200); 0 lần hỏng sớm. Log api trong khoảng đó: 0 lỗi 5xx; 300 lần `409` (SURCHARGE_CHANGED, đúng dự kiến); 600 lần `422` và 1.800 lần `401` là các bước dự kiến của harness (quyết định phụ thu, phiên hết hạn khi tua đồng hồ). Thêm một lượt chạy đủ cả tệp `checkin.s3.clock.spec.ts`: 30/30 đúng dự kiến.

**Kết luận:**
1. **Có che lỗi.** Một lỗi thật đã xảy ra ở lượt 1 rồi bị lượt chạy lại che đi (cơ chế BUG-R2-064). Nguyên nhân **không xác định được** từ dữ liệu của run, vì không có artifact và log không in lỗi. QA không tái hiện được lỗi này trong 300 + 17 lượt (cùng mã và mã trước đó). Vậy lỗi này **không xảy ra thường xuyên**, và không thuộc loại "mã sai cố định" ở các bước AC2. Nó có thể là lỗi chập chờn của sản phẩm (ví dụ `409 CONCURRENT_UPDATE` do khóa – cùng họ với TC-L2-057, S4-37) hoặc của harness (ví dụ trùng số điện thoại ngẫu nhiên – S4-24). QA không loại trừ được khả năng nào.
2. **US-026 AC2 giữ được "Accepted (stack tạm)"**, kèm điều kiện. Lý do:
   - Ở chính run này, lượt 2 trên cùng mã `6af7173` đã qua mọi bước AC2 trước `test.fail`: đề xuất phụ thu khớp BR-411-01; số xác nhận lệch → `409 SURCHARGE_CHANGED`, không ghi folio; xác nhận đúng → đúng 1 dòng `early_checkin`.
   - TC-L3-012 (các bậc giờ) đạt ngay lượt đầu.
   - 5 run CI khác và 300 lần chạy của QA đều qua các bước này.
   - **Điều kiện:** khi QA tách ca (BUG-R2-064, S4-24) mà phần AC2 của TC-L3-011 đỏ ở bất kỳ run CI nào, AC2 quay về "Đang nghiệm thu" và QA ghi lỗi mới.
3. **Để lần sau không mất dấu**, đề nghị OPS cho bước tải `junit.xml` + `test-results` chạy với `if: always()` (thời hạn lưu 7 ngày), và cho CI báo đỏ khi một ca có annotation BUG/`test.fail` bị chạy lại. Ghi ở BUG-R2-064.

### 7.3 Lượt tái hiện lỗi FOC trả muộn (BUG-R2-061) và hồi quy FOC trên `6af7173`
- Spec tạm `zz-qa-gate-latefoc.clock.spec.ts`: bản chép `approvals-foc.s3.clock.spec.ts` cộng 3 ca QA-GATE, đặt trong `scratchpad/gate/QA/tests-copy/`, ngoài repo, không commit.
- Kết quả: 15/15 ca chạy hết. 12 ca TC-NT-016…036 có sẵn **đạt** trên `6af7173`, nên luồng duyệt FOC thường không hồi quy. 3 ca QA-GATE ghi lại số thực tế (đã ghi ở BUG-R2-061): **3/3 tái hiện** lỗi tiền.
- Chưa chạy: FOC đã duyệt rồi gia hạn (B13), và FOC khi trả phòng thật sớm hơn giờ hẹn (BR-412-12/13).
- Tính lại phụ thu theo giờ trả thật (G-10) có ca tích hợp của BE: `services/api/test/integration/frontdesk.test.ts:665`. QA không thấy test nào trong repo dùng oracle BR-412-12/13 (FOC mang sang) → thêm vào S4-24.

## 8. Vòng sửa 9 – lỗi UXR đi thử demo, FB-R2-SEC-BE-53, ca UI bấm thật bước ghi (QA, 17/10/2026 13:00–)

Việc ORC giao: (1) ghi UXR #1–#11 và FB-R2-SEC-BE-53 vào sổ, QA chốt mức; (2) sửa QC-S3-09 – ca E2E-UI bấm thật các bước ghi, đỏ trên mã cũ và xanh sau bản sửa FE; (3) chạy các ca mới trên stack dựng từ cây làm việc khi FE báo xong. QA không đăng nhập bản demo `ottimo-demo` (INV có thể đang dùng); mọi lượt chạy dùng stack dùng một lần `ottimo-qa-s3` của QA.

### 8.1 Mức lỗi – QA chốt (test-strategy mục 8)

| UXR / SEC | Mức đề xuất | Mức QA | BUG | Lý do khi khác đề xuất, hoặc điểm cần nói rõ |
|---|---|---|---|---|
| #1 | P0 | **P0** | 065 | Giữ. Chỉ ở cách dựng demo/dev, nhưng demo là thứ INV dùng thử và dữ liệu C3 không đọc lại được |
| #2 | P0 | **P0** | 066 | Giữ. Không chi hoàn được, không có cách vòng |
| #3 | P1 | **P1** | 067 | Giữ. Có cách vòng (link khách) nhưng rất tốn công |
| #4 | P1 | **P1** | 068 | Giữ. Phân quyền sai ở hành động |
| #5 | P1 | **P1** | 069 | Giữ. Câu sai ở thao tác tiền; số tiền ghi vẫn đúng nên không lên P0 |
| #6 | P1 | **P1** | 070 | Giữ. Lỗi tiền mặc định P0; QA đã kiểm số này chỉ hiển thị, không vào lệnh ghi nào (chi tiết ở BUG-R2-070) |
| #7 | P1 | **P1** | 071 | Giữ. Thao tác bị chặn, không có tiền ghi sai |
| #8, #9, #10 | P2 | **P2** | 072, 073, 074 | Giữ |
| #11 (8 điểm) | P3 | P3 ×5, **P2 ×3** | 075…082 | Nâng 076 (giá đổi mà lễ tân không thấy), 078 (cột tiền trống), 080 (thiếu phần Nga của US-083 AC2 – Must) |
| FB-R2-SEC-BE-53 | Major (SEC) | **P0** | 083 | Nâng: hủy không hoàn tác giấy tờ C3 của khách còn ở, giữ C3 quá mục đích, nguy cơ khai báo sai người – C3 mặc định P0 |

Không hạ mức lỗi nào. Hai P0 phải sửa ở vòng 9 (065, 066) – ĐK-S3-9, ĐK-S3-10. BUG-R2-083 có hạn SEC-G1 (trước cổng QC Sprint 4 và trước dữ liệu thật); đây là P0 mới không thuộc ngoại lệ "sai tiền đường hiếm" (dòng 593 (1)) → QC/ORC quyết khi chấm lại cổng Sprint 3. Nếu P0 nào không sửa kịp trong Round 2, QA lập ESC.

### 8.2 Ca UI mới bấm thật bước ghi (QC-S3-09)

Cách viết: dữ liệu chuẩn bị bằng API (không phải đối tượng kiểm); bước đang kiểm bấm trên giao diện; request trình duyệt thật sự gửi được ghi lại (`e2e/ui/write-steps.ts` `recordWrites`) và phải trả 2xx – khi đỏ, thông báo in nguyên câu trả lời của server; kết quả đọc lại bằng API; tiền so với oracle `br-examples.json` hoặc folio. Ca cần đơn **đang ở** chạy ở project `desk-clock` trên ngày ảo (không chiếm căn của hôm nay, không cần hoàn tác nhận phòng sau khi đã ghi folio).

| TC | Tệp (project) | Lỗi | Bước ghi bấm thật | Trên mã cũ (17/10 13:15–13:25) |
|---|---|---|---|---|
| TC-L3-075 | `ui/desk-writes.s3.spec.ts` (desk-chromium) | 067 | Nhập tay giấy tờ người 1 (không ảnh), người 2 (kèm ảnh) ở H13 | **Đỏ**: `addGuestDocument` 422 `data REQUIRED` |
| TC-L4-093 | như trên | 066, 068 | FD nhập nơi nhận tiền mặt; FDL chi hoàn tiền mặt kèm ảnh biên nhận | **Đỏ**: FD nhập nơi nhận đạt (200); FDL không thấy khoản đã duyệt |
| TC-L4-094 | như trên | 066 | Chủ đầu tư ghi hoàn chuyển khoản: mã giao dịch + ảnh ủy nhiệm chi | **Đỏ**: `uploadAttachment` 422 `Idempotency-Key` |
| TC-L2-085 | như trên | 069 | Hủy đơn đã cọc, hoàn 100 % (BR-309-03) | **Đỏ**: hộp có câu "Đơn chưa thu tiền…" |
| TC-L2-086 | như trên | 070 | (đọc) drawer giữ chỗ chưa cọc, đơn đã hủy có cọc | **Đỏ**: giữ chỗ chưa cọc "Đã thu" 750.000, mong đợi 0 |
| TC-L3-076 | `ui-clock/stay-writes.h15.spec.ts` (desk-clock) | 071, 070 | Thêm người lớn thứ 3 khi đang ở, xác nhận phụ thu 450.000 | **Đỏ**: hộp không hiện số phụ thu, chỉ có câu "tick…" của màn nhận phòng |
| TC-L4-095 | như trên | 066 | Thêm phát sinh phạt/hư hỏng kèm ảnh | **Đỏ**: `uploadAttachment` 422 `Idempotency-Key` |

Stack mã cũ: `ottimo-qa-s3`, api `6af7173` (`ottimo-api:qa-gate-6af`), web dựng từ `9e9fd64` (`ottimo-web:qa-s3-head`) – QA đối chiếu các dòng lỗi (`${idem}-a`, `new Blob` cho `data`, `totalRoomVnd - balanceDueVnd`, nhánh `body_no_money`, `applyExtraPersonSurcharge: false`) giống hệt ở `6af7173`. Lệnh: `playwright test --project desk-chromium|desk-clock --no-deps --retries=0 <tệp>`; log `scratchpad/r9/run-old-*.log`. Ca chạy song song trên đồng hồ thật (5 worker) không đụng nhau.

### 8.3 Chạy lại sau bản sửa (cây làm việc, 17/10 13:23–13:31)

- Ảnh: `ottimo-api:qa-r9`, `ottimo-web:qa-r9` dựng từ bản chụp `product/` của cây làm việc lúc 13:23 (HEAD `1e62da8` + thay đổi chưa commit của FE, BE-A, OPS, UXD; `INCLUDE_TEST_SUPPORT=1`). Sau bản chụp, FE/BE/OPS không đổi tệp nào nữa (QA so lại lúc 13:26: chỉ khác tệp test của QA). Stack `ottimo-qa-s3` dựng mới, seed DS-E mới, khóa mã hóa sinh như `make-ci-env.sh`.
- **7 ca mới riêng:** 7/7 **đạt** (`--retries=0`). Một lần đỏ đầu của TC-L2-085 do harness QA (cắt thân phản hồi 500 ký tự rồi `JSON.parse`) – QA sửa `write-steps.ts`, chạy lại đạt; không phải lỗi sản phẩm.
- **Toàn bộ E2E như CI** (mọi project, `CI=true`, `retries: 1`, stack dựng mới): **1.783 đạt, 0 trượt**, 82 bỏ qua (có chủ đích, như các lượt trước), **1 flaky**: TC-L2-057 (`quotes-holds.api`, lượt 2 đạt – cùng họ `409 CONCURRENT_UPDATE` đã biết, S4-37). 7 ca mới đạt ngay lượt đầu trong lượt chạy đủ. Các ca `test.fail` đã biết (TC-L3-011, TC-L3-032, TC-L3-074 – BUG-R2-038, 033, 054) vẫn "đúng dự kiến". Log `scratchpad/r9/full.log`, `full.json`.
- **BUG-R2-065 phần compose dev/CI:** xem mục chi tiết BUG-R2-065 (đọc lại giấy tờ + ảnh sau khi khởi động lại api + worker: 200; đối chứng không truyền khóa: 500).
- Kết luận: BUG-R2-066…071 **Fixed**, BUG-R2-065 **Fixed** phần dev/CI. Chuyển **Closed** khi ORC commit và CI xanh trên commit đó (ca mới chạy trong job E2E). UXD còn phải duyệt hộp phụ thu (BUG-R2-071, ĐK-S3-9); UXR đi lại KB4, KB6, KB8 trên bản demo dựng mới (ĐK-S3-10).

### 8.4 Giới hạn và việc còn lại

- Bước "UI cases ran" của CI chỉ kiểm ca `ui/` không bị bỏ qua. Hai ca mới ở `ui-clock/` (TC-L3-076, TC-L4-095) chạy trong project `desk-clock` mà bước này không kiểm → đề nghị OPS mở rộng bước kiểm sang `ui-clock/` (sửa `ci.yml` – không thuộc tệp của QA).
- `product/docs/qa/traceability.md` chưa sinh lại cho 7 TC mới (vòng này QA chỉ sửa `product/tests/**` và `rounds/round-02/qa/**`). `gen_traceability.py --strict` chạy qua (exit 0), 251/251 AC R2 có TC. ORC cho phép thì QA sinh lại tệp này trong lần commit vòng 9.
- Chưa có ca UI bấm thật cho: BUG-R2-072 (403 tự chi), 073 (ký hiệu thô), 074 (ô ngân hàng) – P2, FE sửa một phần ở cây làm việc nhưng QA chưa kiểm; giữ **Open**.
- BUG-R2-083 (SEC-BE-53) chưa sửa (S4-39); QA không chạy lại, dùng số đo của SEC.
- Không đăng nhập bản demo, không dùng tài khoản demo. Mọi dữ liệu là dữ liệu giả của DS-E.

## 9. Chấm lại cổng QC Sprint 3 sau vòng sửa 9, 9b, 9c (QA, 17/10/2026 15:00–15:40)

Việc ORC giao: dùng CI 39015560449 + chạy cục bộ có chọn lọc để kiểm lại và đóng BUG-R2-065…074; ghi gốc lần đỏ TC-L3-076; xem 075…082 mục nào đã sửa; gán mã TC cho ca KB7; giữ 083 Open chờ SEC. Ghi chú ngắn: `qa/s3-retest-2.md`.

### 9.1 Nguồn và cách kiểm
- **CI 39015560449** (push `fe4b166`, 07:57–08:12Z): 7 job chạy đều xanh, `publish images (GHCR)` và `deploy staging` bỏ qua theo thiết kế (chưa có staging). Job E2E: **1.786 đạt, 0 trượt, 0 flaky, 0 lần chạy lại** (log không có `retry #`), 82 bỏ qua có chủ đích; 3 ca `test.fail` đã biết (TC-L3-011, TC-L3-032, TC-L3-074) hiện ✘ "đúng dự kiến". Bước kiểm CI: `TC-SEC-024: 1 case(s) ran`; `UI: 49 case(s), 2 allowed skip(s), axe 13 case(s) ran`; 8 ca `WRITES` (TC-L3-075, TC-L4-093, TC-L4-094, TC-L2-085, TC-L2-086, TC-L3-076, TC-L4-095, TC-L3-077) chạy và xanh; ca KB7 (nay TC-L4-096) cũng xanh. `check-compose.sh` in "one keyring for api/worker/seed in dev + demo". Run không có artifact; log job lưu ở `scratchpad/regate/qa/ci/e2e-job.log`.
- **Chạy cục bộ:**
  - (a) ca bấm thật ngoài repo (`scratchpad/regate/qa/adhoc/…/regate-adhoc.spec.ts`, project desk-chromium, `--retries=0`) trên stack QA `ottimo-qa-s3`. Ảnh của stack dựng từ bản chụp `cc8c875`. QA đã so: `problem.ts`, `BookingDialog.tsx`, `MoneyPage.tsx`, `reservations.ts`, module approvals **không đổi** từ `cc8c875` tới `fe4b166` (chỉ thêm chuỗi). Kết quả 2 lượt: 072 đạt, 073 (b) đạt, 075 tái hiện.
  - (b) unit admin-web trên HEAD: `problem.test.ts`, `guest-picker-race.test.tsx`, `s3-fix9.test.tsx`, `checkout.test.tsx` – **32/32** xanh.
  - (c) `gen_traceability.py --strict`: exit 0 (xem 9.4).
- **Không làm được:** dựng ảnh mới từ `fe4b166` để chạy lại 9 ca bước ghi trên máy. Môi trường từ chối lệnh `docker build`. Việc này **không chặn kết luận**: CI đã chạy đúng các ca đó trên `fe4b166`. QA không đụng bản demo `ottimo-demo` và stack `ottimo-fe07` của FE.

### 9.2 Kết luận từng lỗi

| BUG | Mức | Trước | Sau | Bằng chứng |
|---|---|---|---|---|
| 065 | P0 | Fixed (dev/CI) | **Closed** | CI `check-compose.sh` (dev + demo); QA kiểm khởi động lại dev 13:29; OPS smoke demo `9a221ee` + khởi động lại api/worker mở lại giấy tờ (demo-1.md 6b); UXR đi lại KB6 |
| 066 | P0 | Fixed | **Closed** | CI: TC-L4-093/094/095 xanh lượt đầu |
| 067 | P1 | Fixed | **Closed** | CI: TC-L3-075 |
| 068 | P1 | Fixed | **Closed** | CI: TC-L4-093 bước (3) |
| 069 | P1 | Fixed | **Closed** | CI: TC-L2-085 |
| 070 | P1 | Fixed | **Closed** | CI: TC-L2-086, TC-L3-076 ("Đã thu") |
| 071 | P1 | Fixed | **Closed** | CI: TC-L3-076 xanh lượt đầu; gốc lần đỏ CI 39010774166 ghi ở BUG-R2-071 |
| 072 | P2 | Open | **Closed** | Bấm thật 2/2 (403 `SELF_REFUND_FORBIDDEN` → câu riêng); unit |
| 073 | P2 | Open | **Closed** | (b) bấm thật 2/2; (a) unit `problem.test.ts` |
| 074 | P2 | Open | **Deferred** (S4-45) | FE không sửa ở vòng 9 |
| 075 | P3 | Open | Open (S4 – chưa có mục) | Tái hiện 2/2 |
| 076 | P2 | Open | Open (chờ UXD/PO) | Mã không đổi |
| 077 | P3 | Open | Open (S4-44) | Mã không đổi |
| 078 | P2 | Open | Open (S4 – chưa có mục) | Mã không đổi |
| 079 | P3 | Open | Open (S4 – chưa có mục) | Mã không đổi |
| 080 | P2 | Open | Open (chờ PO) | `QuoteDialog.tsx:79, 634-635` vẫn chỉ vi/en |
| 081 | P3 | Open | Open (chờ PO) | Mã không đổi |
| 082 | P3 | Open | Open (S4 – chưa có mục) | Rộng hơn: 4/5 nút preset sai mã |
| 083 | P0 | Open | **Open – chờ SEC xác nhận FE-07** | 9b/9c đã vào; TC-L3-077 xanh ở CI |
| **084** (mới) | P1 | – | **Closed** | KB7 sau giờ ân hạn; sửa `fe4b166`; CI: TC-L4-096 |

### 9.3 Mã TC mới
- **TC-L4-096** (E, US-036/AC1, Cao): ca KB7 trong `e2e/ui-clock/checkout.h16.spec.ts` (desk-clock). QA đổi tên ca thành "TC-L4-096 (E) US-036/AC1 KB7 …". Thêm vào `r1-main-flows.md` v0.3.12 và danh sách `WRITES` của `ci.yml` (chỉ sửa dòng đó). Tên mới chỉ có hiệu lực ở CI từ lần chạy sau commit; ca đã xanh với tên cũ ở CI 39015560449.

### 9.4 Giới hạn và việc còn lại
- **`traceability.md` sinh từ `backlog.md` đã commit**, không từ cây làm việc. Trên cây làm việc, PO đang sửa (chưa commit) thêm EP19 Landing: US-146…153 Must, cột Round "R2 – LP-v1". `gen_traceability.py` đọc cột này thành "R2", nên `--strict` trên cây làm việc **exit 1** (32 AC R2 chưa có TC). Hệ quả: commit backlog như hiện tại sẽ làm **đỏ job CI "API contract"**. ORC/PO cần chọn một trong hai:
  - đổi cột Round (ví dụ "LP-v1"), vì backlog ghi EP19 "không thuộc cổng QC R2";
  - hoặc giao QA sửa bộ sinh, coi "R2 – LP…" là luồng riêng.
- Nhóm UXR #11: 075, 076, 078, 079, 080, 081, 082 chưa có mục trong `s4-carryover.md` (ĐK-S3-4) → ORC thêm.
- Lượt đi lại của UXR 17/10 chiều (`demo-1-limits.md` mục C, các dòng "mới") có thêm khoảng 10 điểm chưa vào sổ lỗi, ngoài KB7 (nay là BUG-R2-084).
  - Theo đọc mã của QA, không điểm nào là P0/P1.
  - Ba điểm đã được `fe4b166` sửa theo commit/decision-log FE: xem ảnh giấy tờ, dòng đỏ ghi chú giờ ở H16 (KB7; ở H13 – KB4 – chưa rõ), KB7. QA chưa bấm lại các điểm này.
  - Các điểm còn lại là hiển thị/chữ, P2–P3: dấu trừ thừa "Đã ghi hoàn -500.000 đ"; mã lý do thô trong Nhật ký tiền; hộp step-up ghi "giấy tờ" khi xem số tài khoản; BIN thay tên ngân hàng; cặp dòng minibar đảo/ghi lại khi mở lại H16; câu "Phí phạt…" ở khoản Giặt ủi; "Đã thu −500.000" khi đơn đã hủy và đã hoàn; "Còn phải thu 0 đ" của giữ chỗ.
  - QA ghi vào sổ ở lượt sau, khi UXR chuyển danh sách và ảnh.
- TC-L3-076 sau khi FE neo locator không còn bắt được lỗi đua của ô chọn khách. Lớp lỗi này được giữ bằng unit `guest-picker-race.test.tsx`.
- BUG-R2-084: UXR chưa đi lại KB7 trên bản có `fe4b166`. Guide v1.2 còn bước 0 "bấm Trả muộn trước".
- Ba stack QA cũ `ottimo-qa-s3a/b/c` (từ 15 giờ trước) đang khởi động lại liên tục: postgres đã dừng, còn api/worker lặp. QA đã thử dừng nhưng môi trường từ chối. Cần chủ máy hoặc ORC dừng (`docker compose -p ottimo-qa-s3a|b|c down`) để giải phóng tài nguyên.

## 10. Cổng QC Sprint 3 bản 3 – ĐK-S3-12, ĐK-S3-3 bản 3, ĐK-S3-13 (QA, 17/10/2026 ~15:55–16:20)

Việc ORC giao: (1) ĐK-S3-12 – chấm lại BUG-R2-083 theo `s3-SEC.md` 9.6, đóng phần P0, tách phần còn lại thành lỗi mới ≤ P1 gắn S4-39, sửa bảng tổng, 1 dòng decision-log; (2) ĐK-S3-3 bản 3 – ghi N1–N6 và các dòng "mới" của `demo-1-limits.md` mục C chưa có mã; (3) ĐK-S3-13 – sửa `gen_traceability.py` để story cột Round "R2 – LP-v1" không làm `--strict` đỏ, sinh lại `traceability.md`; (4) chạy ở máy các kiểm của job CI "API contract". QA không sửa mã sản phẩm, không commit.

### 10.1 ĐK-S3-12 – BUG-R2-083 → **Closed** (P0); phần còn lại → **BUG-R2-085 (P1, S4-39)**
- Căn cứ: `s3-SEC.md` 9.6 f (FE-07 Verified, SEC-G1 (a) ĐẠT, SEC đồng ý đóng; decision-log dòng SEC 606) + QA tự kiểm qua log CI 39015560449 (`fe4b166`): TC-L3-077 ✓, `registration-party-removal.test.ts` 12/12, `registration-flow.test.ts` 22/22 trên PostgreSQL thật + đọc mã `onPartyMemberRemoved`. Chi tiết và lý do mức: mục chi tiết BUG-R2-083 ("Chấm lại lần 2") và BUG-R2-085.
- Bảng tổng sau lượt này: P0 10 (6 Open – chỉ 056…061, đều thuộc ngoại lệ tiền; 4 Closed). **Không còn P0 nào ngoài ngoại lệ ORC.** P1 Open: 055 (ngoại lệ tiền), 085 (S4-39).

### 10.2 Mức lỗi mới – QA chốt (test-strategy mục 8)
- 19 lỗi mới: 085 (P1); 087, 089, 090, 093, 101, 102 (P2); 086, 088, 091, 092, 094, 095, 096, 097, 098, 099, 100, 103 (P3). **Không có P0.**
- **Không hạ mức** so với đề xuất UXR (N1–N6 = P3). **Nâng** 3 điểm N lên P2: N2/087 (khung tiền của màn trả phòng có dòng không cộng ra tổng), N4/089 (màn khai báo lưu trú tự mâu thuẫn "2/2" ↔ "0/2"), N5/090 (hộp bỏ người không nhắc giấy tờ sẽ tự xóa sau 24 giờ – điều kiện của rủi ro SEC chấp nhận). Hai dòng tiền hiển thị sai nghĩa của lượt v1.2 (101 "Còn phải thu 0" của giữ chỗ chưa cọc, 102 "Đã thu −500.000" của đơn đã hoàn) xếp **P2** cùng lý do BUG-R2-078.
- Lỗi tiền mặc định P0: 087, 095, 097, 101, 102 đã được chứng minh **không sai tiền** (bill, số cần thu, VietQR, folio server đúng – UXR, QC K4, QA đọc mã) → không P0/P1.

### 10.3 Việc cho ORC/PO (không phải quyền QA)
- `s4-carryover.md`: S4-39 thêm mã BUG-R2-085 (và 090, 091); S4-50 thay "N1–N6 (P3)" bằng BUG-R2-086…091 với mức mới (087, 089, 090 = P2) và thêm 092, 094, 095, 096, 097, 098, 100, 101, 102; S4-45 thêm 099, 103; S4-48 thêm 088; **S4-25 mở rộng cho BUG-R2-093** (FOC phụ thu người khi thêm người đang ở) – giữ ràng buộc S4-34 (chỉ phát hành sau S4-02/S4-18).
- `demo-1-limits.md` mục C (UXR/ORC): có thể ghi mã BUG cạnh từng dòng theo bảng 10.4. Không đổi nội dung cho INV (đều là lỗi đã biết, không cần ghi phiếu).

### 10.4 Đối chiếu `demo-1-limits.md` mục C (v1.3) → mã BUG
| Dòng mục C (gặp khi) | Mã |
|---|---|
| **mới** KB4 – Xem đủ số / ảnh: chữ "Đã có" và "Ẩn số" đè nhau | BUG-R2-086 (N1) |
| **mới** KB7 – bước Minibar/Phụ phí: "Còn phải thu" gồm phụ thu chưa có dòng | BUG-R2-087 (N2) |
| **mới** KB7 – bước Phụ phí: lý do cạnh nút Tiếp tục | BUG-R2-088 (N3) |
| **mới** KB9 – "0/2" ↔ "Đã có giấy tờ 2/2 người" | BUG-R2-089 (N4) |
| Bỏ một người khỏi đoàn (phần đã làm) · **mới:** hộp "Bỏ … khỏi đơn?" · **mới:** "Bắt buộc" chung khi gắn | BUG-R2-083 (Closed) / 085; 090 (N5); 091 (N6) |
| KB4 – Ghi chú giờ nhận: dòng đỏ còn | BUG-R2-092 |
| KB6 – chưa có xin miễn phụ thu người · nhãn "Khách đứng tên" | BUG-R2-093 · 094 |
| KB7 – mở lại Trả phòng: cặp dòng minibar | BUG-R2-095 |
| KB7 – Thêm phát sinh Giặt ủi: câu "Phí phạt…" | BUG-R2-096 |
| KB8 – "Đã ghi hoàn -500.000 đ." | BUG-R2-097 |
| KB8 – Xem đủ số tài khoản: tiêu đề hộp · mã BIN | BUG-R2-098 · 099 |
| KB8, KB10 – mã lý do thô | BUG-R2-100 |
| KB1 – giữ chỗ D5 "Còn phải thu 0 đ" | BUG-R2-101 |
| KB8 – đơn đã hủy và đã hoàn "Đã thu −500.000" | BUG-R2-102 |
| KB4, KB6, KB7 – 2 dòng "Còn phải thu" | BUG-R2-103 |
| KB8 – ô Ngân hàng nhận chỉ nhận BIN | BUG-R2-074 (Deferred, S4-45) |
| KB2 Tạo nhanh khách · KB2 Dùng căn · Tìm kiếm · cột Còn phải thu · Esc · KB3 tiếng Nga + ghi chú CTV · KB7 nút Giặt ủi | BUG-R2-075 · 076 · 077 · 078 · 079 · 080 + 081 · 082 |
| KB3 vừa giữ chỗ: hứa mã QR | BUG-R2-062 |
| KB4 nhận phòng sớm có phụ thu: "Đã thu đủ" | BUG-R2-038 (Deferred, 0.3.7) |
| KB6 / hồ sơ khách: không nhận ra khách cũ, thiếu 4 số cuối | BUG-R2-033 (a) · 063 |
| Dời căn sang căn khác định mức | BUG-R2-058 |
| Khách OTA đổi phòng từ lần hai | BUG-R2-057 |
| Ảnh khai báo chưa xác nhận tự xóa: thiếu dòng "Ảnh đã xóa lúc …" | BUG-R2-054 |
| *(Không gặp trong demo)* FOC khi đổi ngày/căn/số người, khôi phục no-show | BUG-R2-055…061 |
| KB3 Báo đã chuyển cọc không có ô ảnh · KB7 Xem bill đơn đã trả · hoàn phần trả thêm khi hủy/no-show · OTA gia hạn rồi đổi phòng | Chưa làm, đã có kế hoạch – không phải lỗi: S4-30 · S4-29 · S4-06 · S4-09 |
| Dời đơn sang căn đắt hơn theo ý khách | Chính sách chờ INV (ESC-019) – không phải lỗi |
| Mở Desk 8181 và 8182 cùng trình duyệt | Giới hạn bản demo localhost (cookie theo host, `outputs/OPS/demo-1.md` mục 8) – hết khi có staging; không phải lỗi sản phẩm |

### 10.5 ĐK-S3-13 – truy vết và job CI "API contract"
- **Gốc:** `backlog.md` (commit `1e273b2`) có EP19 landing, cột Round "R2 – LP-v1" (US-146…154: 7 Must + 2 Should). Regex cột Round của `gen_traceability.py` đọc thành "R2" → 78 story "Must R2", AC 251/287 → `--strict` exit 1 (36 AC Must của US-146…149, 151…153 chưa có TC; QC K10 và QA 9.4 ghi 32 – đếm trên cây làm việc trước commit `1e273b2`).
- **Sửa (QA, không đổi nội dung story của PO):** `product/tests/tools/gen_traceability.py` – cột Round "R<n> – <luồng>" (luồng dạng `LP-v1`) = **luồng riêng có cổng riêng**: không tính vào Must R2 và các chỉ số mục 1–2, không làm `--strict` đỏ; báo cáo ở **mục 9** của `traceability.md` (story, mức, cột Round, AC → TC, AC Must chưa có TC) + 1 dòng tóm tắt ở mục 1. Cờ mới `--strict-track LP-v1` dùng ở cổng LP-v1 (AC Must của luồng thiếu TC → exit 1; tên luồng gõ sai → exit 1). Quy ước ghi ở `product/docs/qa/test-strategy.md` mục 2.0 (bản 0.5) và `product/tests/README.md`.
- **Kết quả trên cây làm việc (17/10 16:15):**
  - `python3 product/tests/tools/gen_traceability.py --strict` → **exit 0**: Must R2 71/71 story, **AC 251/251**, chạy được ở R2 251/251, 420 TC, 0 mã trùng, 0 operationId lạ, 0 tham chiếu AC sai, rbac ↔ OpenAPI 0 lệch, `x-rbac-field` 148 gắn / 0 thiếu; luồng LP-v1: 7 Must + 2 Should, AC Must có TC **0/36** (báo cáo, không chặn).
  - Trước khi sửa (cùng cây): exit 1, 78 story, AC 251/287.
  - Kiểm cờ mới: `--strict --strict-track LP-v1` → exit 1 (đúng: 36 AC chưa có TC); `--strict --strict-track LP-v9` → exit 1 (tên sai); không `--strict` → exit 0.
  - Mục 1–8 của `traceability.md` sinh lại **giống hệt** bản trước (chỉ khác dòng phiên bản, nhãn dòng "Story Must R2" và dòng tóm tắt luồng mới) + mục 9 mới.
- **Job "API contract" chạy ở máy** (đúng 3 bước của `.github/workflows/ci.yml` job `api-contract`):
  1. `openapi-spec-validator` 0.7.2 (`python3 -m openapi_spec_validator product/docs/api/openapi.yaml product/docs/api/openapi.test.yaml`) → cả hai **OK**, exit 0;
  2. `gen_traceability.py --strict --out <tạm>` → **exit 0**;
  3. `gen_rbac_cases.py --check` → "OK – rbac-cases up to date" (189 operation, 2.079 ca), exit 0. (Script không có cờ `--strict`; CI chỉ chạy `--check`.)
- Thêm: `prettier --check tests/e2e/ui-clock/checkout.h16.spec.ts` (tệp đổi tên ca TC-L4-096) → đạt; `ci.yml` đọc được bằng YAML (9 job), dòng `WRITES` có 9 ca gồm TC-L4-096.
- **Giả lập commit:** `git archive HEAD` (`1e273b2`) + đúng các tệp QA của lượt này (`ci.yml`, spec TC-L4-096, `r1-main-flows.md`, `traceability.md`, `gen_traceability.py`, `test-strategy.md`, `tests/README.md`) chạy 3 bước trên → spec 0, truy vết 0, rbac 0; `traceability.md` sinh trên bản giả lập **giống hệt** tệp trong cây làm việc. Đối chứng: cùng bản giả lập nhưng dùng `gen_traceability.py` cũ của HEAD → **exit 1** (đúng cảnh báo K10).
- `03-backlog/backlog.md` trên cây làm việc có thay đổi chưa commit của ARC (16:05 – US-152 AC2, "chờ PO xác nhận"). US-152 thuộc luồng LP-v1 nên không đổi kết quả: `--strict` exit 0 và `traceability.md` giống nhau với cả backlog HEAD lẫn backlog cây làm việc. Việc commit thay đổi này là của ORC/PO.
- **Lưu ý cho commit (ORC):** job "API contract" xanh **chỉ khi** `gen_traceability.py` mới đi cùng commit với `backlog.md` có EP19 (đã ở `1e273b2` – HEAD hiện tại). Nếu commit bước QC mà thiếu `gen_traceability.py` thì job đỏ như QC K10 cảnh báo. Không cần tách backlog/landing khỏi commit vì `--strict` trên cây làm việc đã exit 0.

### 10.6 Giới hạn
- QA không bấm lại riêng N1–N6 và các dòng 092…103 trên demo (không đăng nhập demo – dữ liệu INV sắp dùng); ghi theo UXR + ảnh + đọc mã. Khi FE sửa, QA kiểm bằng ca UI hoặc bấm thật.
- QA không chạy lại test BE/E2E của 083 trên máy (môi trường từ chối `docker build`; không tạo DB mới trên stack của vai khác); dùng log CI trên đúng commit + số đo DB của SEC.
- Không đổi nội dung story của PO; không sửa `s4-carryover.md`, `demo-1-limits.md` (việc của ORC/UXR – mục 10.3).

## 11. Sprint 4 D1 – ca tự động tiền, BUG-R2-064, CI 39028814256 (QA, 17/10/2026 ~17:00–19:40)

### 11.1 Môi trường
- Stack dùng một lần `ottimo-qa-s4`:
  - ảnh `ottimo-api:qa-s4` dựng bằng `git archive` từ HEAD `94c711d` (`INCLUDE_TEST_SUPPORT=1`);
  - compose chuẩn `infra/docker-compose.yml` + file đổi cổng (43000, 45432, 48081–48083);
  - seed DS-E 0 cảnh báo.
- QA không đụng `ottimo-demo`, `ottimo-dev`, `ottimo-fe07`.
- Playwright 1.63 như CI (`CI=true`, `E2E_COMPOSE_CONTROL=1`). Mỗi lượt chạy `--retries=0` để thấy lỗi ngay lượt đầu.
- Ảnh web từ HEAD chưa dựng xong (cài gói chậm). Phần UI dùng ảnh `ottimo-web:qa-r9` – mã guest-web giống HEAD.

### 11.2 Kết quả
- **`money-s4.api.spec.ts` + `checkin.s3.api.spec.ts`:** 2 lượt × 55 ca, 0 lệch dự kiến, 0 chập chờn:
  - 29 lỗi đã biết hỏng đúng dự kiến;
  - 24 đạt;
  - 2 bỏ qua có chủ đích (Sprint 3).
- **`money-s4.clock.spec.ts` + TC-L3-011/074 (`checkin.s3.clock.spec.ts`):** 13 ca, 0 lệch dự kiến. 10 lỗi đã biết, 3 đạt.
- **Lượt chẩn đoán** (`E2E_FIXED_BUGS` = mọi mã): mỗi ca lỗi đã biết hỏng **đúng chỗ của lỗi**:
  - 055: 500 `INTERNAL_ERROR`;
  - 056: FOC 900.000 thay vì 1.000.000; FOC phụ thu người 0 thay vì 150.000;
  - 057: đêm 2 còn 250.000;
  - 058: phụ thu người 300.000 thay vì 0;
  - 059: FOC sau duyệt 0, yêu cầu vẫn `pending`;
  - 060: hạn mức không trả khi no-show;
  - 061: FOC 0 / 210.000 thay vì 210.000 / 350.000;
  - S4-21: `previewMoveReservation` 404;
  - S4-04: số ghi 0 ≠ số xem trước −125.000;
  - B-6: thiếu `expectedVersion` vẫn duyệt/từ chối được;
  - BUG-038: thiếu `amountDueAtCheckinVnd`.
  Không ca nào hỏng vì dữ liệu dựng.
- **Kiểm cơ chế:** lượt đầu, khi bước dựng dữ liệu còn lỗi (thiếu `bookerGuestId`), **mọi** ca – kể cả ca có `knownBug` – báo đỏ thật. `precondition()` hoạt động đúng: lỗi dựng dữ liệu không bị `test.fail` che.
- Trạng thái 055…061: **giữ Open** (bản sửa BE chưa gộp vào HEAD). Mỗi lỗi nay có ca E2E (cột Trạng thái ở bảng mục 1).

### 11.3 Ghi chú cho người sửa
- PR sửa lỗi phải xóa mã lỗi khỏi `OPEN` trong `e2e/support/known-bugs.ts` (`s4-test-plan.md` mục 3.3). Kiểm trước ở máy bằng `E2E_FIXED_BUGS`.
- Cây làm việc hiện đã bỏ `pendingFix` của BR-315-06, BR-412-15/16/17, BR-433-03, BR-434-07/08 (BE-B đang sửa). PR đó xóa luôn BUG-R2-056/059/060/061 khỏi `OPEN`.
- TC-L3-032 (a)(b): kỳ vọng còn theo R2 Sprint 3. QA viết lại theo 0.3.7 nhóm D mục A cùng PR S4-11 (BE-C).

### 11.4 Đối chiếu trên cây làm việc 17/10 tối (bản sửa BE-A, BE-B chưa commit)
- **Môi trường:** api biên dịch từ cây làm việc lúc 20:18 (`tsc`, gắn vào ảnh `qa-s4` – `package.json` api không đổi), migration 0056…0061 áp được. guest-web, admin-web build từ cây làm việc. Ảnh docker từ cây làm việc không dựng được (cài gói từ registry treo).
- **`money-s4.api` + `checkin.s3.api` (6 worker):** 51 đúng dự kiến.
  - 055, 056, 057, 058, 059, 060, 061, 104, S4-21, S4-04, S4-23 – mã BE-A/BE-B đã xóa khỏi `OPEN` – **đều xanh**.
  - Còn hỏng đúng dự kiến: B-6, BUG-R2-033 (a).
  - "Expected to fail but passed": TC-L2-099 (c) (S4-35) và TC-L3-032 (b) (BUG-R2-033 b). QA bỏ đánh dấu ở hai ca này. Dòng S4-35 giữ trong `OPEN` để patch B-6 áp đúng ngữ cảnh.
- **`money-s4.clock` + `approvals-foc` + `checkin.s3.clock`:** 53 đúng dự kiến.
  - TC-NT-029/036 xanh nhờ harness thu tiền khi nhận sớm (`checkIn` mặc định gửi `payment` = `amountDueAtCheckinVnd`, annotation `harness`).
  - TC-L3-074 (b) (BUG-R2-054) còn hỏng đúng dự kiến.
- **Patch B-6 (api biên dịch kèm patch):**
  - `money-s4.api` (`E2E_FIXED_BUGS=B-6`), `stay-checkout.s3.api`, `audit-approvals.api`: 47 đúng dự kiến;
  - helper `approve()` tự gửi `expectedVersion` khi gặp 422 `REQUIRED` (TC-L4-062 có annotation);
  - UI: TC-L4-093/094 xanh; TC-NT-052 (E) chập chờn → BUG-R2-106.
- **Kết luận cho đóng lỗi:** 055…061 và 104 **chưa đóng**. Ca đã xanh trên cây làm việc, nhưng QA chỉ đóng khi CI của commit gộp xanh (mục 3.3 kế hoạch).
- **S4-37 / TC-L2-057 (`quotes-holds.api`):** 409 `CONCURRENT_UPDATE` khi nhiều worker chạy song song là **khóa dòng `room` + `lock_timeout` đúng thiết kế (fail-fast, SEC-BE-23), không phải lỗi nghiệp vụ** (BE-A 17/10). Harness `action()` gửi lại tối đa 2 lần theo `Retry-After` với khóa Idempotency mới, như Desk. Không ghi lỗi.

