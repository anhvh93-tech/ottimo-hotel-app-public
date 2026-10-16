# BE-A – Round 2, Sprint 2: EP02 + EP11 phần R2 + US-139 (đặt phòng, chống trùng, rack, OOO, no-show, giữ chỗ)

- Vai: BE (luồng BE-A) | Ngày: 16/10/2026 | Không commit (ORC commit) | DB test riêng `ottimo_test_bea`
- Đầu vào: plan R2 mục 4 (Sprint 2), `specs/EP02-reservations.md`, SM-01/SM-02/SM-14, BR v0.3.1 (101–113, 302–317, 804, 812, 904–906), ADR-009, erd 4.5/4.8/4.9/7/8, OpenAPI 0.3.4, `br-examples.json`, `rbac-cases.json`, `s2-be-b.md` mục 5.

## 1. Bảng operation / trạng thái
| operationId | Chuyển | Trạng thái | Ghi chú |
|---|---|---|---|
| getRack | – | Xong | 3 truy vấn/khung; làn `unassigned` (FD+); HK/MT che danh tính; SAL/CTV chỉ `unavailable` gộp; p95 < 200 ms (test 40 lần) |
| searchAvailability | – | Xong | `past_date/not_sellable/capacity/blocked/booked`; ≤ 6 gợi ý, cùng nhóm trước (BR-316, ít đêm lẻ) |
| listReservations | – | Xong | lọc status/stayFrom/stayTo/q/externalContract, con trỏ; SAL/CTV `own` trong SQL |
| createReservation | B2, B7b | Xong | giá BR-104/107/110, cọc BR-305 bắt buộc qua `initialPayment` (kênh direct/agent), BR-113 + ngoại lệ đêm lẻ + FDL bỏ qua, OTA chỉ tổng → chia đều, `allowUnassigned` → làn chưa gán + `overbooking_incident` + push FD/MGR; AC5a `manualLongStay` |
| getReservation / updateReservation | – | Xong | `allowedActions` theo trạng thái **và** vai; PATCH If-Match, sức chứa, BR-812 đồng bộ việc |
| getReservationHistory | – | Xong | audit_event + state_transition + reservation_change |
| extendHold | B3 | Xong | 1 lần, ≤ `hold_extension_max_hours`, trần 12:00 ngày đến |
| cancelReservation | B5, B10 | Xong | `dryRun` (không cần 2 header), BR-309/310, yêu cầu duyệt `refund` khi có tiền hoàn, OTA `otaPenaltyVnd` |
| moveReservation | B7, B8 | Xong | đêm giữ nguyên giữ giá (BR-106), OTA khóa ngày, B8 MGR+ 1 lần ≤ 3 tháng; xử lý cả đơn xung đột (B7a) |
| markNoShow / restoreNoShow | B11, B12 | Xong | không tự động, sau `no_show_mark_time`; BR-315 FD tự khôi phục trong ngày nghiệp vụ, ngoài điều kiện → 202 `no_show_restore`; duyệt xong → hook thực hiện B12 |
| assignRoom | B7a | Xong | khác nhóm = `upgraded` chỉ FDL+ |
| swapRoom | B7 ×2 | Xong (đơn `confirmed`) | `SET CONSTRAINTS … DEFERRED` + kiểm lại IMMEDIATE trong savepoint; đổi phòng khách đang ở (B14) – Sprint 3 |
| listOverbookingIncidents / resolveOverbookingExternal | B10 | Xong | MGR+, chi phí vào audit tiền |
| listRoomBlocks / createRoomBlock / updateRoomBlock / transitionRoomBlock | O1, O3, O4, O5 (+O2 job) | Xong | nửa mở; trùng đơn → 409 + conflicts; release không phiếu = MGR+ |
| Job `reservation.hold_expiry` (J1/B6), `room_block.activation` (O2) | B6, O2 | Xong | đúng một lần theo điều kiện dòng + `SKIP LOCKED`; đã có cọc → không hủy (US-085 AC4); worker + test-support |
| Port cho BE-B `RESERVATION_SALES_PORT` | B1, B4 | Xong | availability, createHoldFromQuote, confirmFromHold, lockForDeposit, reservationView, ownership |
| listChannels | – | Không thuộc BE-A | BE-B (platform) đã làm |
| listParty/addPartyMember/removePartyMember (US-022) | – | **Chưa làm** | cần mã hóa C3 trẻ em (CryptoService) – đề nghị Sprint 3 cùng registration |

## 2. Thiết kế chính
- **Chống trùng (ADR-009)**: `room_occupancy` EXCLUDE gist `(room_id =, stay_range &&) WHERE active DEFERRABLE INITIALLY IMMEDIATE` + CHECK `[)` không rỗng. Mọi ghi qua `OccupancyService` trong SAVEPOINT; `23P01` → rollback savepoint → đọc conflicts → 409 `ROOM_UNAVAILABLE`/`ROOM_BLOCKED` + `conflicts[]` (tên khách chỉ FD+) + `suggestions[]`. Thứ tự khóa: reservation → room tăng dần → folio. Trigger hoãn: segment `room_id NULL` chỉ khi `conflict_state=open` (erd 7).
- **Giá**: `public/pricing.ts` (hàm thuần, dùng chung với quotes của BE-B) + `PricingService` (đọc tham số 1 lần/request, snapshot BR-006 vào `pricing_snapshot`). Không số nghiệp vụ viết cứng.
- **BR-812**: `hk_task` `extra_guest_kit_prepare` sinh/cập nhật/hủy (hoặc `collect` nếu đã chuẩn bị) trong cùng giao dịch B2/B4/B7/B7a/B12/PATCH/hủy/no-show, hạn = `checkin_time` ngày đến; outbox `hk_task.changed`.
- **Tiền**: `MoneyBridge` gọi FolioService/PaymentService của BE-B (mở folio, ghi thu `initialPayment`, hạch toán đêm B2/B12, void hoa hồng B5/B6/B10/B11); audit tiền `reservation.priced/repriced/cancellation_fee/no_show_deposit_retained`, `overbooking.relocation_cost`. Không có payments → 409 `PAYMENT_NOT_CONFIGURED` (không nhận tiền mà không có sổ).
- Lịch sử: `state_transition` (phân vùng tháng như log khác), `reservation_change`, `audit_event`; outbox `channel.availability_changed` (BR-905), `staff.push`.

## 3. Việc tích hợp ORC giao thêm (BE-B mục 5) – đã xong
1. `ConfirmedStay.commissionRatePctSnapshot` (đọc `pricing_snapshot.quote.commissionRatePct`) – hoa hồng B4 theo snapshot báo giá.
2. B5/B6 gọi `LeadsService.onHoldEnded` (api + worker).
3. Bỏ `Promise.all` trên cùng `tx`: helper `src/shared/sequence.ts` (`inSequence`).
4. format/lint/tsc các file reservations, worker, jobs, schema, test.

## 4. File tạo/sửa
- Mới: `src/modules/reservations/**` (module, `public/{pricing,pricing.service,occupancy.service,reservation-hooks,sales-port,worker-jobs}.ts`, `internal/{reservations.service,reservations.controller,rack.service,room-blocks.service,sales-port.adapter,money-bridge,extra-guest-kit,allowed-actions,reservation-store,reservation-dto,booking-context,inputs}.ts`), `src/jobs/reservation-jobs.ts`, `src/shared/sequence.ts`, `src/db/schema/reservations.ts`, `src/db/migrations/0013_reservations_be_a.sql`, `0014_reservations_rls_be_a.sql` (+ snapshot, journal).
- Sửa: `src/db/schema/audit.ts` (+`state_transition`), `src/db/schema/index.ts`, `src/modules/feature-modules.ts` (+ReservationsModule), `src/worker.ts` (đăng ký job).
- Test: `test/reservations-pricing.test.ts` (66 ca, oracle br-examples), `test/integration/reservations.test.ts` (18 ca), `test/integration/rbac-sprint2-bea.test.ts` (221 ca), `test/helpers/reservations-fixture.ts`.
- Migration 0014 thêm FK chéo cho bảng của BE-B: `folio.primary_reservation_id` (deferrable), `folio_line.reservation_id/stay_night_id`, `payment`, `channel_fee`, `commission`, `deposit_notice`, `quote.converted_reservation_id`; `reservation.folio_id → folio` DEFERRABLE.

## 5. Kết quả lệnh (16/10/2026, DB `ottimo_test_bea`)
| Lệnh | Kết quả |
|---|---|
| `pnpm format:check` (toàn repo) | xanh |
| `pnpm lint` (eslint + typecheck 12 gói) | xanh (1 warning sẵn có ở `mockServiceWorker.js`) |
| `turbo run test --force` | 12/12 xanh; api **30 file / 1086 ca**; admin-web 100 ca (lần chạy đầu 1 ca `booking.test.tsx` đỏ do timeout khi máy tải nặng, chạy lại xanh 3/3 – báo FE) |
| `pnpm build` | 6/6 |
| `drizzle-kit generate` | No schema changes |
| `node scripts/gen-openapi-meta.mjs --check` | up to date |
| Đồng thời | 20 request cùng căn–đêm → đúng 1 × 201, 19 × 409; mã OTM liên tục không hở |

## 6. Giả định (tự quyết theo quyền BE – đề nghị ORC ghi decision-log)
- OTA nhập tay phải có giá (`nightlyRates` hoặc `otaRoomAmountVnd`) – chưa có tham số giá OTA nền theo nhóm; làm tròn giá OTA dùng `rounding.monthly_rent` (BR-005 gộp "thuê tháng, giá OTA → 10.000").
- OTA vượt sức chứa: **chặn** `CAPACITY_EXCEEDED` (đặc tả BA để ngỏ "cờ xung đột sức chứa" chờ DOM) – lễ tân chọn căn lớn hơn hoặc lưu chưa gán.
- Khôi phục no-show hồi sinh **chính các dòng stay_night** đã void (không sinh dòng mới như erd 8) để folio không hạch toán đêm 2 lần.
- AC5a không sinh `stay_night` (theo hợp đồng `ManualLongStayInput`) → K-02/K-03 chưa đếm đêm dài hạn nhập tay – DATA xác nhận.
- Khối OOO trùng đơn: luôn 409 kể cả MGR xác nhận (EXCLUDE không cho lưu); cờ `affectedReservationsAcknowledged` chỉ ghi người xác nhận.
- Release OOO: `end_date_actual` = hôm nay (mở bán từ đêm nay). Trạng thái buồng trên rack suy tạm (OOO/OC/VC) tới khi housekeeping có `room_status` (Sprint 4).
- `reservation.folio_id` còn NULL được (FK deferrable) – NOT NULL khi mọi đường tạo đơn đều mở folio.

## 7. Việc cần vai khác
| Gửi | Nội dung |
|---|---|
| ARC | (1) `RackBar` thiếu `extraGuestCount`, `externalContract` – server đã trả nhưng serializer bỏ vì hợp đồng chưa khai; đề nghị thêm 0.3.5. (2) Mã trường mới dùng: `HOLD_EXTENDED_ONCE` (409 extendHold), `OTA_DATES_LOCKED`; extension 409/422: `minStayNights`, `depositRequiredVnd`, `dates`, `availableFrom`, `expected`. (3) erd: cột thêm `reservation.total_room_vnd`, `no_show_contact_note`, `reschedule_count`; `hk_task`/`room_block` tạo ở 0013. |
| BE-B | (1) `ROOM_CAPACITY_CHECK` (platform) vẫn `NO_BOOKINGS_YET` – Sprint 3 nối vào bảng đơn. (2) **Sự cố của tôi**: lúc đầu tôi ghi đè `reservations/public/sales-port.ts` do BE-B tạo trước – đã dựng lại đủ thành viên từ chỗ gọi; và đã sửa DB `ottimo_test_beb` (migration 0013/0014 lỡ chạy bản nháp vào DB này do file env dùng chung trong scratchpad). BE-B kiểm lại giúp. |
| QA | TC mới: đồng thời 20 request, J1 chạy 3 lần song song chỉ hủy 1 lần, B12 trong/ngoài ngày nghiệp vụ, swap, AC5a, làn chưa gán. |
| SEC | Review: SAVEPOINT + EXCLUDE, phạm vi `own` SAL/CTV trong SQL, tên khách trong `conflicts[]` chỉ FD+. |

## 8. Việc chưa xong
- US-022 người đi cùng (cần C3 trẻ em) – đề nghị Sprint 3. B14 đổi phòng khách đang ở, B9 nhận phòng – Sprint 3. "Cần chú ý" (attention_event) và nhắc gọi no-show/giữ chỗ sắp hết – Sprint 4. ESC mới: không có.
