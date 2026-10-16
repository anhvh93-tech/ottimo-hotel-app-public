# BE-A – Round 2, Sprint 2: Phản hồi & sửa (DOM, SEC, ARC, QA; OpenAPI 0.3.5 mục 5 + 8.1–8.4)

- Vai: BE (BE-A) | Ngày: 16/10/2026 | Không commit (ORC commit) | DB test riêng `ottimo_test_bea` (file môi trường riêng, không dùng chung với BE-B)
- Trả lời từng thẻ: `rounds/round-02/responses/s2-BE-A.md`

## 1. Đã làm gì
| Nhóm | Nội dung |
|---|---|
| Tiền đơn ↔ folio (DOM-BE-01 Blocker, BE-02, ARC-S2-04/10) | Cổng `reservations/public/folio-sync-port.ts` (`voidStay`, `resyncStay`) – BE-B cài trong FolioService. B5/B6/B10/B11/dời ra ngoài: đảo dòng đêm void + 1 dòng phí giữ lại (`cancellation_fee`/`no_show_fee`); B7/B8/PATCH khách/B12: đồng bộ lại. `MoneyBridge` tiêm **bắt buộc** FolioService, PaymentService, FOLIO_STAY_SYNC (api + worker); bỏ đường ghi tiền thứ hai; `reservation.folio_id` NOT NULL (folio id sinh trước, FK DEFERRED) |
| Giá (BUG-R2-017/018, DOM-BE-03, A-22, ARC 8.1) | Tham số `ota_base_rate` (json theo mã nhóm, validator đủ nhóm + 100.000–20.000.000) và `rounding.ota_rate`; OTA không gửi giá → lịch OTA nhóm; sàn–trần BR-105 theo giá nền nhóm cho mọi kênh; `stay_night.calendar_rate_vnd` + `NightRate.calendarRateVnd`; đổi số đêm → tính lại bậc BR-107 trên giá lịch đã chốt |
| Thứ tự kiểm (BUG-R2-019) | … căn bán được → OOO → chống trùng → **tiền** (`DEPOSIT_INSUFFICIENT` + `depositPaidVnd`, `shortfallVnd`) |
| Gợi ý căn (BUG-R2-020, A-05) | Chỉ cùng nhóm hoặc nhóm `sort_order` cao hơn; `orphanNight`; `MIN_STAY_NOT_MET` kèm căn đêm lẻ; `searchAvailability?reservationId=` |
| OTA vượt sức chứa (DOM-BE-04, A-20, A-24) | Cảnh báo + lý do → lưu với `capacityConflict` (cột `capacity_conflict_at/_ack_reason/_ack_by`), push, chặn `check_in`; tự xóa khi vừa căn; RackBar `capacityConflict` |
| No-show (DOM-BE-05, A-21, A-04) | OTA → FD luôn 202; MGR `roomId`/`allowUnassigned`; duyệt xong không bao giờ 409 (làn chưa gán, incident `no_show_restore`); `noShowAvailableFrom` |
| Giữ chỗ (DOM-BE-06, SEC-24/28, ARC-S2-03/08, BUG-R2-021, A-26) | Job `hold.expire`/`ooo.activate`; J1 lô + SAVEPOINT từng đơn, không hủy đơn có tiền (push sale+FD/FDL một lần, MGR sau 12:00 ngày đến), gọi `LeadsService.onHoldEnded` (B5/B6, api + worker – có test); J9 theo ngày nghiệp vụ 06:00 qua ParameterService; `max_open_holds_per_user` → 422 `HOLD_LIMIT_REACHED` (`holdHours`, `max`) |
| Bảo mật chung (SEC-21/23/25/26/30) | `dryRun` chỉ cho operation khai báo (sinh từ OpenAPI), còn lại 422 `dryRun:NOT_ALLOWED`; `lock_timeout` 5 s/`statement_timeout` 15 s mọi giao dịch (job 10 s), lỗi khóa/deadlock → 409 `CONCURRENT_UPDATE` + `Retry-After`, timeout → 503; `conflicts[]` không lộ mã đơn/tên với SAL/CTV/MT; người chốt phải đang hoạt động, đổi người chốt có audit tiền; FK `folio_line → stay_night` theo cặp tenant |
| Khác | `ROOM_OCCUPIED` khi khóa phòng trùng khách đang ở; kênh Nội bộ không áp BR-113; 1 việc thu hồi/bộ; hạn bộ đồ dùng = max(giờ nhận, xác nhận + 60'); RackBar `reservationCode`, `holdExpiresAt`, `requestedRoomGroupId/Code` (A-25, cả trên Reservation); `getBookingRules` (A-07); email khách qua `guests/public/guest-contact.ts`; chỉ mục rack; ESLint cấm `Promise.all` trên tx; `StayNightAllocationService` chuyển sang ReservationsModule |

## 2. File tạo/sửa
- Mới: `src/modules/reservations/public/folio-sync-port.ts`, `src/modules/guests/public/guest-contact.ts`, migration `0015_reservations_fix_be_a`, `0016_reservations_fix_rls_be_a`, `0017_reservations_capacity_be_a`, `0018_reservations_drop_kind_be_a` (+ snapshot/journal; 0019 của BE-B giữ sau), `test/integration/reservations-fix.test.ts` (19 ca).
- Sửa: `src/modules/reservations/**` (service, controller, rack, room-blocks, occupancy, pricing, pricing.service, money-bridge, store, dto, allowed-actions, extra-guest-kit, sales-port, worker-jobs, module), `src/jobs/{job-runner,reservation-jobs}.ts`, `src/db/{database.ts,schema/reservations.ts}`, `src/shared/{problem.ts,openapi-types.ts,http/auth.guard.ts,http/unit-of-work.ts}`, `scripts/gen-openapi-meta.mjs` (+ generated), `src/modules/platform/internal/{parameter-rules,parameters.service}.ts` (validator `ota_base_rate`), `src/modules/folio/folio.module.ts` (bỏ đăng ký StayNightAllocationService), `product/eslint.config.js`, test `reservations.test.ts`, `reservations-pricing.test.ts`, `helpers/reservations-fixture.ts`.

## 3. Kết quả lệnh (16/10/2026)
| Lệnh | Kết quả |
|---|---|
| `pnpm format:check` | xanh |
| `pnpm lint` (eslint + typecheck 12 gói) | xanh (1 warning sẵn có `mockServiceWorker.js`) |
| api `vitest run` | **31 file / 1143 ca xanh** (oracle br-examples mới BR-107-03/04, BR-110-09, BR-113-04, BR-302-03, BR-303-04, BR-315-03/04/05, BR-812-10 có ca tương ứng) |
| `turbo run test --force` | 11/12 – **admin-web đỏ 2 ca của FE** (`reservation.test.tsx` 412 on move, `s2-fix.test.tsx` A-20 – test mock MSW FE đang sửa, không gọi server); các gói khác xanh |
| `pnpm build` | 6/6 |
| `gen-openapi-meta --check` | up to date |
| `drizzle-kit generate` | No schema changes |

## 4. Giả định / đề nghị
- ARC thêm vào bảng mã lỗi: `CONCURRENT_UPDATE` (409), `SERVICE_UNAVAILABLE` (503) – đang ở `EXTRA_CODES`; mã trường `CAPACITY_EXCEEDED_WARNING` cho `assignRoom`/`moveReservation` (`field: roomId`); `ReservationPatch.capacityWarningAckReason` (server đã nhận).
- `max_open_holds_per_user` nằm ở migration 0016 (`config_parameter_def` mặc định CTV 3, SAL 5) – DOM đã chốt.
- `rounding.ota_rate` chưa có giá trị ở cơ sở cũ → tạm dùng `rounding.monthly_rent` (cùng 10.000); DS-E của QA đã có cả hai khóa.
- Đổi số đêm: đêm nhập giá tay giữ nguyên giá (không áp bậc), đêm giá lịch áp lại bậc.
- OPS: đặt `idle_in_transaction_session_timeout` cho vai `ottimo_app` (SEC-23).

## 5. Việc chưa xong
- SEC-BE-31 (truyền actor qua sales-port) – Sprint 3. ARC-S2-12 (J2/J6/J7 + "Cần chú ý") – Sprint 4. SR-RL-09 giới hạn tần suất chung – Sprint 3.
- QA: bỏ `test.fail` của BUG-R2-017…020, bỏ `JOB_ALIASES` (BUG-R2-021).
