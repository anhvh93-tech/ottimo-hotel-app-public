# Kiểm lại toàn bộ Sprint 3 – Round 2 (QA)

- Người làm: QA · Ngày: 17/10/2026 08:00–08:12 · Bản kiểm: **HEAD `9e9fd64`** (sau vòng sửa 4 của BE-A/B/C, FE; cây làm việc chỉ khác 2 tệp test QA chưa commit: `api/ota-rules.s3.api.spec.ts`, `clock/ota-rules.s3.clock.spec.ts` – đổi điều kiện "pending" thành kiểm bắt buộc).
- Báo cáo trước: `qa/s3-test-report.md` (lượt `229db99`); danh sách lỗi: `qa/bug-list.md` (mục 5, 6).

## 1. Cách chạy (như CI)

- Ảnh `ottimo-api` (`--build-arg INCLUDE_TEST_SUPPORT=1`) và `ottimo-web` build từ cây làm việc tại `9e9fd64`.
- Mỗi lượt: hạ stack + xóa volume → dựng stack dùng một lần `ottimo-qa-s3` bằng `infra/docker-compose.yml` chuẩn → nạp seed DS-E (0 cảnh báo, 7/7 mã chứng từ) → `playwright test -c e2e/playwright.config.ts` đủ mọi project theo phụ thuộc: smoke, rbac (Sprint 1–3), api, limits, rbac-logout, desk-chromium (UI + axe + guest-web H18), serial, clock, desk-clock, db-outage.
- Env như CI mới: `CI=true` (retries 1), `E2E_UI=1`, `E2E_COMPOSE_CONTROL=1`, Origin bật (admin/staff/guest), `STAFF_REQUESTS_PER_MINUTE=5000` (`infra/ci/make-ci-env.sh` mới), token thiết bị đọc từ seed.
- Kiểm tĩnh: `tsc` / `eslint` / `prettier --check` (tests) đạt; `validate-fixtures` 0 lỗi; `gen_traceability --strict` exit 0 (408 TC, 251/251 AC); `gen_rbac_cases --check` OK.

## 2. Kết quả theo project (2 lượt, mỗi lượt một stack mới)

| Project | Đạt | Trượt | Bỏ qua | Trượt dự kiến | Flaky |
|---|---|---|---|---|---|
| api | 153 | 0 | 11 | 1 | 1 |
| clock | 87 | 0 | 7 | 2 | 0 |
| db-outage | 1 | 0 | 0 | 0 | 0 |
| desk-chromium (UI + axe + H18) | 37 | 0 | 2 | 0 | 0 |
| desk-clock (H16) | 1 | 0 | 0 | 0 | 0 |
| limits | 2 | 0 | 1 | 0 | 0 |
| rbac | 1.474 | 0 | 55 | 0 | 0 |
| rbac-logout | 11 | 0 | 0 | 0 | 0 |
| serial | 5 | 0 | 0 | 0 | 0 |
| smoke | 2 | 0 | 6 | 0 | 0 |
| **Tổng (lượt 1 = lượt 2)** | **1.773** | **0** | **82** | **3** | **1** |

Thời gian mỗi lượt ~87 giây; 0 lần harness phải chờ 429 SR-RL-09. Flaky: TC-L2-057 cả 2 lượt – `confirm-deposit` ngay sau khi tạo giữ chỗ trả `409 CONCURRENT_UPDATE` (Retry-After 1), qua ở lần chạy lại (xem mục 5).

| Phần Sprint 3 | Kết quả |
|---|---|
| 118 ca S3 (TC-L3 50, TC-L4 57, TC-L7 10, TC-L2-083) | **105 đạt · 3 trượt dự kiến · 10 bỏ qua · 0 trượt** |
| RBAC Sprint 3 (67 operation) | **737/737 đạt** |
| axe WCAG 2.1 A/AA + 2.2 AA | **45 lần quét (H01–H18, sáng/tối, VI/EN), 0 vi phạm ở mọi mức** |
| C3 (thiết bị, vai, lúc lưu) | TC-SEC-010, SEC-C3 lúc lưu, TC-RB-001/002/022 (+ lọc `from`/`to`) đạt |

- 3 trượt dự kiến = lỗi còn mở/hoãn: TC-L3-011 (BUG-R2-038, Deferred 0.3.7), TC-L3-032 (BUG-R2-033 (a)), TC-L3-074 bước cuối (BUG-R2-054).
- 10 bỏ qua có lý do: TC-L3-060/061 (US-128 mã cửa – R3), TC-L4-080/081 (US-041 – R3), TC-L4-021/023 (`getArrivalsDepartures` – Sprint 4), TC-L4-024 (job J4 chưa đăng ký), TC-L4-068 (job J15 chưa đăng ký), TC-L4-070/071 (US-066 chưa có sprint). Ngoài S3: RBAC 2FA (R3) ×44 + `setMyApprovalPin` ×11, `listHkTasks` (Sprint 4) ×7, smoke chờ tính năng ×6, `hold.remind`, TC-NT-043 (b).

## 3. Ca mới / đổi ở lượt này

| Ca | Nội dung | Kết quả |
|---|---|---|
| TC-L3-074 (clock, mới) | Ảnh của khai báo dừng ở `sent`: trả phòng (a) / hủy đơn khi đã `sent` (b) + `id_image_unconfirmed_max_days` (7): ngày 6 còn, hạn + 1 phút mất (404), hủy khi `sent` không `void`, nhật ký C3 purge, "Cần chú ý" `registration_overdue` | đạt, trừ bước cuối `imagesPurgedAt` (BUG-R2-054, mới) |
| TC-L4-090 (api, mới) | Đổi số người đơn OTA trước nhận phòng: thiếu `partyChangeSource` → 422; `ota_modification` thiếu mã → 422; có mã → `otaGuestCount` cập nhật, không phụ thu; `guest_direct` giữ `otaGuestCount`; đơn Trực tiếp → 422 `NOT_ALLOWED` | đạt |
| TC-L4-091 (api, mới) | FOC / giảm giá đặc biệt trên dòng phòng đơn OTA trả trước → 422 `FOC_NOT_ALLOWED_OTA_PREPAID`, "Đã thu qua OTA" không đổi | đạt |
| TC-L2-083 (api, mới) | Hủy OTA: tiền phạt → dòng `cancellation_fee` + `ota_collect` (còn phải thu 0); phí kênh không kèm tiền phạt → 422; đơn Trực tiếp gửi tiền phạt → 422 `OTA_PENALTY_OTA_ONLY` | đạt |
| TC-L4-092 (clock, mới) | B16 đơn OTA có người thứ 3: đã thu → `extraPersonRefundVnd` = phụ thu đêm bỏ, một yêu cầu hoàn; chưa thu → `extraPersonReversedVnd`, dòng đêm bỏ đã đảo | đạt |
| TC-L4-063 (sửa) | SAL/CTV ghi khoản không phải cọc (kể cả `refund`, kể cả đơn người khác) → 403 trước mọi kiểm thân request; lễ tân ghi `charge` trên giữ chỗ → 422 `NOT_IN_LIST` | đạt |
| TC-L3-050 (sửa) | Quốc tịch trên dữ liệu cổng = mã alpha-3 (`DEU`) – ESC-018 INV 17/10; ngày dd/mm/yyyy | đạt |

Harness: thiết bị quầy dự phòng khi token seed không đọc được (BUG-R2-053); reset/chờ khi 429 SR-RL-09 và khi cổng tải lên đầy (429/503 "too many uploads in progress", Retry-After 5); `createReservation` gửi lại khi 409 `CONCURRENT_UPDATE` (trừ ca đo đua đồng thời). Oracle bỏ `pendingFix` cho BR-110-14/15/16, BR-307-02/03/04, BR-310-01/02, BR-428-06 (BE đã có test xanh đọc các dòng này). `smoke-manifest.json` có TC-L3-074.

## 4. Lỗi còn mở theo mức

| Mức | Mở | Mã |
|---|---|---|
| **P0** | **0** | – (BUG-R2-044 Closed) |
| **P1** | **0** mở · 1 Fixed | BUG-R2-053 (CI không đọc được token thiết bị của seed) – đã sửa `ci.yml` ở `c52d149`, chờ job CI E2E xanh để đóng |
| P2 | 1 mở · 1 hoãn | BUG-R2-033 (a) khớp hồ sơ theo số giấy tờ không xảy ra – `guest.id_doc_hmac` không được ghi (BE-C + BE-B); BUG-R2-038 Deferred 0.3.7 |
| P3 | 1 mở | BUG-R2-054 xóa ảnh khai báo chưa `confirmed` không ghi `imagesPurgedAt`/`imagesPurgeReason` (BE-C + ARC enum) |

Tổng danh sách: 54 lỗi – 2 Open, 1 Fixed, 1 Deferred, 50 Closed. BUG-R2-033 (b) (người "Chưa rõ") dời Sprint 4 theo ORC.

## 5. Quan sát (không ghi lỗi)

- `confirm-deposit` ngay sau `createHoldFromQuote` khi các ca khác chạy song song: 409 `CONCURRENT_UPDATE` (Retry-After 1) ở TC-L2-057 cả 2 lượt, lần thử lại đạt; giao diện đã tự thử lại theo Retry-After (BUG-R2-026). Đề nghị BE-A xem khóa nào giữ đơn giữ chỗ vừa tạo (hook sau commit / job mỗi phút) – rủi ro thấp với người dùng thật.
- CI 38989147610 (`9e9fd64`): job `gitleaks` đỏ ở bước quét toàn lịch sử (lúc QA ghi run chưa xong nên chưa đọc được chi tiết) – thuộc OPS/SEC; job "format · lint · audit · test · build" xanh; job E2E đang chạy.
- OpenAPI vẫn liệt kê `mode: stayover` cho `recordMinibarCheck` mà server từ chối tới US-033 (ARC sửa enum hoặc ghi chú).

## 6. Chưa kiểm / hạn chế

- Không có điện thoại/máy quầy thật (H18 trên Chromium giả lập 390×844, chọn tệp thay camera) – đề xuất cho Round 3.
- Dọn buồng (HK) Sprint 4: buồng sạch giả lập bằng psql trên stack dùng một lần.
- Giao diện H13 lúc 00:00–05:59 (thông báo khi nhận phòng sau nửa đêm) chưa chạy lại ban đêm ở lượt này; phần API (TC-L3-008 (a)) đạt.
- Staging: chưa có lượt chạy trên staging.

## 7. Đề xuất cho QC

**Đủ điều kiện vào cổng QC Sprint 3, có điều kiện:**
1. Job CI `docker images build · E2E smoke` của `9e9fd64` phải xanh (đóng BUG-R2-053); `gitleaks` đỏ cần OPS/SEC giải trình hoặc sửa trước cổng.
2. Còn 0 lỗi P0/P1 mở. Còn 2 lỗi mở mức thấp (BUG-R2-033 (a) P2, BUG-R2-054 P3) và 1 lỗi hoãn có chủ đích (BUG-R2-038 – 0.3.7, B18 chặn `BALANCE_DUE` nên không mất tiền): QC quyết nhận kèm điều kiện sửa ở Sprint 4 hay chặn.
3. Toàn bộ luồng tiền Sprint 3 (OTA thu hộ, cọc của sale, phụ thu nhận sớm/trả muộn, FOC trong hạn mức, hoàn tiền tách nhiệm, 4 luật OTA của DOM) và C3 (thiết bị, vai, mã hóa lúc lưu, xóa ảnh theo hạn) đạt 2/2 lượt.
