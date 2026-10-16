# BE-A – Phản hồi review Sprint 3 (ARC, SEC, DOM) + OpenAPI 0.3.6 bổ sung 1 + 2

- Vai: BE-A | Ngày: 17/10/2026 | Bước: Phản hồi & sửa | Chi tiết sửa + kết quả lệnh: `outputs/BE/s3-be-a.md` mục 10.
- Phạm vi trả lời: mọi thẻ có Vị trí BE-A hoặc "BE (chung)"; thẻ thuộc BE-B/BE-C/INT/OPS chỉ ghi phần BE-A (nếu có).
- Hợp đồng áp: 0.3.6 bổ sung 1 (`reviews/s3-ARC.md` mục C) và bổ sung 2 (`outputs/ARC/s3-contract.md` mục 7.1–7.2).
- Chưa commit (theo lệnh ORC).

## ARC (`reviews/s3-ARC.md`)
| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R2-ARC-BE-S3-01 (Blocker) | Done | Phụ thu người **theo từng đêm** (DOM S3-13 a): cột `stay_night.extra_person_fee_vnd` (0031, NULL = mức của snapshot). `ConfirmedStay.nights[].extraPersonVnd`; `syncStay` (BE-B) sinh **một dòng `extra_person` mỗi đêm**, giữ dòng khớp, không còn dòng gộp từ frontdesk. Thêm/bớt người giữa kỳ đi qua `ReservationStayPort.peopleFromNight(from effectiveFrom)`; đêm mới B13/B9a/E05-11 nhận phụ thu qua `feesForNewNights`. Test: thêm người lớn 03/11 → gia hạn 1 đêm → còn 03, 04 và thêm 05 (mỗi đêm 150.000); người rời 05/11 → đêm 05 bỏ, 03–04 giữ (`frontdesk-s3-fixes.test.ts`) |
| FB-R2-ARC-BE-S3-04 | Done (BE chung – guard: BE-B; BE-A: lớp hai + test) | Guard: dryRun → quyết vai ngay, `hasCompletedKey` khớp method + path (BE-B). BE-A: `read()` của frontdesk/reservations từ chối khi `allowed=false`; UoW đánh dấu `enforced` khi phát lại đúng khóa (lưới an toàn ở serializer không chặn nhầm replay hợp lệ). Test: 15 ca vai bị cấm × 3 op dryRun (setLateCheckout/changeRoom/addPartyMember) với khóa ĐÃ XONG của chính đường đó → 403 (`rbac-sprint3-bea.test.ts`) |
| FB-R2-ARC-BE-S3-05 | Done | `StaySupport.effectiveStay()` (đơn chính + đơn con in_house): ngày đi, căn và giá đêm cuối, dòng phụ thu của cả nhóm. `checkOut`/`getCheckoutSummary`/`setLateCheckout` dùng chung; B13/B15/B16 trên đơn con → 409 `INVALID_TRANSITION`. Test: OTA 2 đêm + đơn con gia hạn → `checkOut {checkoutAt: ngày đi mới}` 200, cả hai `checked_out` |
| FB-R2-ARC-BE-S3-06 | Done | `StaySupport.replaceLateCharge()` (logic G-10 dùng chung): B15 hẹn lại giờ → đảo dòng sống rồi ghi dòng mới trong cùng giao dịch; B13 đảo phụ thu trả muộn của ngày đi cũ, xóa `agreedCheckoutTime`, hủy `late_checkout_conflict` mở (superseded). Test: 17:00 → 15:00 còn đúng 1 dòng; gia hạn → 0 dòng sống |
| FB-R2-ARC-BE-S3-07 | Done | Cửa sổ B9a: giờ nhận luôn là giờ server; thiếu `addPriorNight` → 409 `INVALID_TRANSITION` + `availableFrom` = mốc đổi ngày (hợp đồng bổ sung 2); `expectedSurchargeVnd` = `priorNightRateVnd` bắt buộc, lệch → `SURCHARGE_CHANGED`. Test 04:40 gửi `checkinTime 14:00` → 409 |
| FB-R2-ARC-BE-S3-08 | Done | `effectiveDate` ≠ hôm nay → 422 `DATE_INVALID`; OTA `guest_request`: chênh = direct(mới) − direct(cũ), dòng `room_change_difference` nhóm `room` (DOM S3-15); phụ thu người theo căn mới, `property_fault` lấy min |
| FB-R2-ARC-BE-S3-09 | Done | `SseHub`: bắt `error` + `end`, nối lại backoff 1 s → 30 s khi còn luồng, quá 5 lần → đóng mọi luồng (client tự nối lại), `keepAlive`. Test: `pg_terminate_backend` kết nối LISTEN → sự kiện kế tiếp vẫn tới |
| FB-R2-ARC-BE-S3-11 | Done (BE-B) | `PaymentService.recordManual` tự lấy vai người ghi, SAL/CTV → `pending` (BE-B sửa). B2 vẫn một đường ghi tiền; BE-A không đổi |
| FB-R2-ARC-BE-S3-15 | Done (phần BE-A) | (a) J24 → `payments/public/payment-expiry.ts` (BE-B); (b) `reconcile_overdue` do payments đăng ký (BE-B); (c) B17 dùng `FolioService.hasLiveLinesSince`; (d) `ApprovalService.reopenForRedecision/addRefunded` (BE-B viết trong file BE-A – BE-A đã xem, giữ) + `cancelSuperseded` (BE-A); (g) `partyMissingCount`: frontdesk cấp số người qua `ReservationHooks.providePartyCount`, reservations không đọc `reservation_guest`. (e)(f) thuộc BE-C |
| FB-R2-ARC-BE-S3-16 | Done (phần BE-A) | `reservations/public/read-port.ts` `ReservationReadPort` (ownership, stayInfo, stayView, stayViews – chỉ dùng `tx`, không MoneyBridge), đăng ký global. `RESERVATION_SALES_PORT` ủy quyền sang cùng hàm. Test kiến trúc `module-boundaries.test.ts`: `ModuleRef` trong `src/modules` chỉ ở danh sách cho phép có lý do (attachment.service – BE-C, payment.service – BE-B, chờ chuyển sang tiêm qua constructor) |
| FB-R2-ARC-BE-S3-21 | Done | `test/integration/schema-parity.test.ts`: sau migrate so `pg_catalog` với snapshot đầu (tên = tiền tố lớn nhất): bảng, cột (kiểu, NOT NULL), CHECK (tên + thân – cả hai do PostgreSQL chuẩn hóa: thân snapshot dựng lại trên bảng TEMP rồi `pg_get_constraintdef`), tên PK/FK/UK/chỉ mục; DEFERRABLE của ERD; ngoại lệ 2e đặt cứng có lý do và có test chống mục cũ. Lệch tìm thấy: `reservation_capacity_ack_by_fk` (0017) thiếu trong `.ts` → thêm vào `.ts`, sinh lại snapshot đầu `0053` theo 4.2a-2c |
| FB-R2-ARC-BE-S3-22 | Done (phần BE-A) | 0031: FK `reservation_guest.child_data_key_id → data_key`, FK người dùng (cặp tenant) của 0030, CHECK cặp `removed_at/removed_by`, `ref_type/ref_id`, `resolved_at/resolved_by`, GRANT UPDATE theo cột (`reservation_guest`, `staff_notification`, `attention_event`) |
| FB-R2-ARC-BE-S3-23 | Done | (1) bỏ `events.notify` trùng sau `approvals.submit`; ApprovalService là nơi duy nhất báo người duyệt/người gửi: outbox push + **dòng hộp thư** (`EventsService.notify(..., {push:false})`) – (2) yêu cầu `refund` nay có dòng hộp thư; (3) B18 không phát `payment.changed` với id yêu cầu duyệt; (4) `count(*) OVER ()` thay vì độ dài danh sách bị LIMIT; (5) `publishSse()` dùng chung, bỏ `new EventsService()` ở `stay-view.ts` (J24 do BE-B chuyển); (6) gắn `close` trước khi đăng ký, kiểm `raw.destroyed` sau đăng ký, `write()` trả `false` > 20 lần liền → đóng luồng |
| FB-R2-ARC-BE-S3-24 | Done | (1) `SURCHARGE_CHANGED` trước kiểm trường, extras `surchargeVnd` (mọi chỗ); (2) `documentBlockOverride` → `staff_notification` `security_alert` cho MGR/OWN; (3) đêm B9a Trực tiếp đánh dấu giá tay trong snapshot, tính lại bậc BR-107 cho đêm khác; (4) không có bậc trả muộn → không "sau mốc cuối"; (5) `stayInfo` không cần actor (không có dữ liệu cá nhân – SEC xác nhận), ghi chú trong `ReservationReadPort`; (6) bỏ người giữa kỳ → giảm số khách khai, phụ thu từ đêm nay; (7) B16 trên giá ròng |
| FB-R2-ARC-BE-S3-30 | Deferred (Sprint 4) | Hiệu năng `getExtensionOptions/extend` (truy vấn theo đêm) – 10 căn vẫn trong ngân sách; gộp truy vấn theo khoảng ngày khi làm housekeeping/maintenance Sprint 4. Nhờ QA đo p95 với 62 đêm |
| B-1 #7, #8, #11 | Done | #7 B16 cơ sở ròng + phụ thu người đêm bỏ hoàn 100 %; #8 `deposit_forfeit` + `charge_code = overpayment_retained`, doanh thu khác; #11 tuổi = năm đến − năm sinh − 1 |
| B-3 | Done | Luật "không module ngoài frontdesk/reservations import `stay-port`" + "không import `internal/` module khác" thành test (`module-boundaries.test.ts`). Ghi giá/snapshot qua hàm định giá của reservations (`retierStay`, `writeRepricedNights`, `setNightFees`) |
| C – `Reservation.depositShortfall` | Done | Map trong `reservation-dto.ts` từ cột 0040 (+ tên người chấp nhận) |
| D – quy tắc 4.2a | Done | 0031 + `.ts` đồng bộ; snapshot đầu (0053 – tiền tố lớn nhất sau BE-B 0042, BE-C 0053) sinh lại theo 2c, giữ `id/prevId`; `drizzle-kit generate` (thư mục thật + bản sao) "No schema changes" |

## SEC (`reviews/s3-SEC.md`)
| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R2-SEC-BE-33 | Done | Như ARC-04 (guard: BE-B; lớp hai + test 4 op: BE-A, `cancelReservation` dryRun có trong test của BE-B/guard) |
| FB-R2-SEC-BE-34 | Done (BE-B) | Guard từ chối phiên `staff_pwa` + Origin không phải admin; test `guard-s3.test.ts` |
| FB-R2-SEC-BE-35 | Done (BE-B + BE-A) | 600 request/phút/người ở guard (BE-B). BE-A: SSE ≤ 5 luồng mở/người → 429 `RATE_LIMITED` + `Retry-After` |
| FB-R2-SEC-BE-37 | Done (phần BE-A) | CHECK `approval_request_refund_destination_not_approver` (0031; BE-B 0042 thêm ngoại lệ OWN khi nơi nhận ≠ tiền mặt theo PO 17/10 – BE-A đồng ý, `.ts` + snapshot khớp, test `schema-parity` xanh) + `assertNotSelf` (BE-B viết trong `approval.service.ts`). `If-Match` cho `approveRequest` loại `refund` cần hợp đồng → ARC 0.3.7 |
| FB-R2-SEC-BE-39 | Done | Job `idempotency.purge` (BUILTIN_JOBS, mỗi tick, lô 5.000): xóa khóa cũ hơn `idempotency_ttl_hours`. Test khóa 49 giờ bị xóa, khóa 1 giờ còn |
| FB-R2-SEC-BE-40 | Done | Mỗi nhịp 25 s kiểm lại phiên (thu hồi, hết hạn, nhàn rỗi, tài khoản bị khóa) + vai tại cơ sở; khác → đóng luồng. ≤ 5 luồng/người. `reservation.changed` không có audience → FD+ và người tạo/người chốt đơn |
| FB-R2-SEC-BE-41 | Done | Bỏ người → `child_name_hmac = NULL` cùng giao dịch hủy DEK; CHECK `reservation_guest_removed_hmac_check` |
| FB-R2-SEC-BE-52 | Done | (1) định dạng theo khóa `params` (count số nguyên, time HH:mm, code dạng mã chứng từ…); dòng `attention_event` hỏng bị bỏ qua + log, không 500; (2) `readStay/readStays` bắt buộc actor – các chỗ gọi của BE-C truyền `SYSTEM_ACTOR` tường minh (theo yêu cầu ORC); (3) api không khởi động khi thiếu `FD_GUEST_ACCESS_PORT` (trừ `NODE_ENV=test`) |

## DOM (`reviews/s3-DOM.md`) – thẻ BE
| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R2-DOM-BE-13 (Blocker) | Done (BE-B) | `ota_collect` hệ thống (BE-B). BE-A: phí OTA giữ lại B16 ghi `early_departure_fee` (`charge_code = ota_retained`) – nằm trong phần OTA thu hộ |
| FB-R2-DOM-BE-14 (Blocker) | Done (phần BE-A) | B16/B18 chỉ xử lý `unhandledCreditVnd` (= credit − yêu cầu hoàn đang mở – BE-B tính); blocker `credit_balance` và `overpaymentHandling` theo số này → B16 rồi B18 không tạo yêu cầu thứ hai. Chặn chi theo đối soát: BE-B |
| FB-R2-DOM-BE-15 | Done (phần BE-A) | B18 gọi `FolioService.tryEarnCommissions` sau `settle` (BE-B cài điều kiện S3-3) |
| FB-R2-DOM-BE-16 | Done | Như ARC-01; `updateReservation` khi `in_house` áp từ đêm nay; OTA thu phần vượt số khách trên đơn (`bookedParty`); B14 theo định mức căn mới, `property_fault` lấy min; người vượt tính mức thấp hơn; tuổi theo S3-7 |
| FB-R2-DOM-BE-17 | Done | So theo giá trị ròng; FOC đã duyệt đi theo dòng mới = min(FOC, phụ thu mới), không duyệt lại. Test: FOC 334.000 trên 17:00, trả 13:00 → dòng 200.000 + FOC −200.000 (ròng 0) |
| FB-R2-DOM-BE-18 | Done | Phụ thu > 0 mà không quyết → 422 `SURCHARGE_DECISION_REQUIRED` (checkIn, setLateCheckout, checkOut, addPartyMember); giờ nhập tay: muộn hơn giờ server > `manual_time_tolerance_minutes` → 422 `TIME_AFTER_ACTION`; sớm hơn → `checkinTimeNote`/`checkoutTimeNote` bắt buộc (`TIME_NOTE_REQUIRED`), ghi cả hai giờ vào lịch sử đơn + audit. Tham số mới trong danh mục (0031, mặc định 30, biên 5–240). Danh sách đóng ca: R3 |
| FB-R2-DOM-BE-19 | Done | (a) `checkOut.extraNight {rateVnd}`: thêm đêm ngày đi (Trực tiếp/CTV kéo đơn + tính lại bậc; OTA/HĐ nhập tay → đơn con), không phụ thu trả muộn, B18 cùng giao dịch, audit `reservation.extra_night_on_checkout`, dòng `room` `charge_code = extra_night`; `CheckoutSummary.extraNightRequired/DefaultRateVnd/Available`. (b) cửa sổ sau nửa đêm: B18 hợp lệ, phụ thu 0, `postMidnightWindow`. Test 19:00 và 01:00 |
| FB-R2-DOM-BE-20 | Done | Chỉ `foc`, `special_discount`, `damage_pricing` chặn B18; B9/B9a hủy `checkin_room_not_ready` mở, B13 và B18 hủy `late_checkout_conflict` (+ `checkin_room_not_ready` ở B18) với lý do `superseded` qua `ApprovalService.cancelSuperseded` (audit `approval.cancelled`, báo người gửi) |
| FB-R2-DOM-BE-22 | Done (phần BE-A) | `StayViewRow.actualArrivalDate` = ngày lịch (giờ cơ sở) của `actual_checkin_at`. BE-C dùng trường này cho "Ngày đến" của dữ liệu cổng |
| FB-R2-DOM-BE-23 | Done | (1) cơ sở ròng; (2) phụ thu người đêm bỏ vào cùng yêu cầu hoàn; (3) OTA `otaRetainedVnd` bắt buộc (khác OTA → `NOT_ALLOWED`, > tiền đêm bỏ → `VALUE_OUT_OF_RANGE`); (4) `noticeGivenAt` lùi > ngưỡng hoặc khác ngày nghiệp vụ → `noticeEvidence` bắt buộc (`EVIDENCE_REQUIRED`), ảnh `penalty_evidence` cùng đơn được kiểm và gắn. Phản hồi `EarlyDepartureResult` |
| FB-R2-DOM-BE-24 | Done (một phần) | `charge_code = overpayment_retained`, doanh thu khác, nhãn bill `bill.line.overpayment_retained` (BE-B). `guestConsentEvidence` chưa có trong hợp đồng → **ARC 0.3.7**; tới lúc đó bằng chứng ghi trong `reason` (bắt buộc ≥ 3 ký tự) |
| FB-R2-DOM-BE-25 | Done | Như ARC-06 (B13) |
| FB-R2-DOM-BE-26 | Done (1)(2), Deferred (3) | (1) chỉ hôm nay; (2) S3-15. (3) việc HK "kiểm minibar căn cũ" khi đổi phòng: cần loại việc HK mới + màn → Sprint 4 (housekeeping) |
| FB-R2-DOM-BE-27 | Deferred (phần BE-A) | `cardsReturnedOld/cardsIssuedNew` của B14 chưa có trong hợp đồng → ARC 0.3.7. (1)(2) thuộc `addFolioLine` (BE-B) |
| FB-R2-DOM-BE-28 | Done | Khách đến cùng ngày gồm `confirmed` và `hold`. Test: hold đến 18/11, trả 12:20 → 30 % (225.000), không ân hạn |
| FB-R2-DOM-BE-30 | Done (1), Deferred (2) | (1) B9a Trực tiếp tính lại bậc BR-107 như B13 (`retierStay` + `writeRepricedNights`). (2) Cộng phụ thu sắp ghi vào `balance_paid` sẽ chặn mọi nhận phòng sớm: `recordPayment` bị chặn ở "còn phải thu" (`AMOUNT_EXCEEDS_BALANCE`) nên không thu trước được, `checkIn` không có trường thu tiền → đề nghị **ARC 0.3.7** `checkIn.payment` (như `checkOut.finalPayment`). Tới lúc đó phụ thu nằm ngay trên folio, B18 chặn `BALANCE_DUE` |
| FB-R2-DOM-BE-31 | Done | `ExtensionOptions.currentBookingRateVnd` = giá ròng đêm giá thỏa thuận (nguồn `manual`) gần nhất; `null` khi theo lịch giá / OTA |
| FB-R2-DOM-BE-21, 29 | Không thuộc BE-A | BE-B (bill `labelKey`, minibar `stayover`). BE-A truyền `labelParams` cho dòng phụ thu nhận sớm/trả muộn, phí trả sớm |

## Thay đổi hành vi bên gọi cần biết (FE, QA, BE-B, BE-C)
1. `checkIn`: không gửi `checkinTime` → server dùng giờ thực (không còn mặc định 14:00); phụ thu > 0 phải có `applyEarlySurcharge` (+ `expectedSurchargeVnd`); cửa sổ B9a cần `addPriorNight` + `expectedSurchargeVnd = priorNightRateVnd`.
2. `setLateCheckout`/`checkOut`: phụ thu > 0 (hoặc tăng) phải có quyết định; giờ nhập tay theo ngưỡng 30 phút; `checkOut` sau 18:00 cần `extraNight`.
3. `earlyDeparture` 200 = `EarlyDepartureResult`; OTA bắt buộc `otaRetainedVnd`.
4. `SURCHARGE_CHANGED` mang `surchargeVnd` (không còn `expectedSurchargeVnd`).
5. Mọi yêu cầu duyệt có dòng hộp thư cho người duyệt và người gửi (một push duy nhất từ ApprovalService).
6. `readStay/readStays` (BE-C) bắt buộc actor; `ReservationReadPort` sẵn để BE-C/BE-B tiêm qua constructor thay `ModuleRef`.
7. `AuditService`: hành động nhóm `money` ngoài tập đóng của hợp đồng → lỗi (ngoài production).

## Đề nghị ARC (0.3.7)
- `checkIn.payment` (thu phụ thu nhận sớm/đêm B9a ngay trong màn – DOM-30 (2)).
- `checkOut.overpaymentHandling.guestConsentEvidence` (DOM-24), `changeRoom.cardsReturnedOld/cardsIssuedNew` (DOM-27 (3)).
- `If-Match` cho `approveRequest` loại `refund` (SEC-37 (3)).
- Ghi `manual_time_tolerance_minutes` vào erd 9.1 / 9.1a (đã có trong danh mục 0031, biên 5–240).
