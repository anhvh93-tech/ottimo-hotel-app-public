# BE-A – Phản hồi review Sprint 2 (DOM, SEC, ARC, ARC s2-contract mục 5 + 8, QA bug-list)

- Vai: BE-A | Ngày: 16/10/2026 | Bước: Phản hồi & sửa | Chi tiết sửa + kết quả lệnh: `outputs/BE/s2-be-a-fix.md`

## DOM (`reviews/s2-DOM.md`)
| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R2-DOM-BE-01 (Blocker) | Done (BE-A + BE-B) | BE-A định nghĩa cổng `reservations/public/folio-sync-port.ts` (`FOLIO_STAY_SYNC.voidStay/resyncStay`), BE-B cài trong `FolioService` và đăng ký ở FolioModule. B10/B11/dời ra ngoài/B5/B6 gọi `voidStay` với id các đêm vừa void + `retainedVnd` (phí hủy BR-309 / giữ cọc no-show BR-311, OTA = 0) trong cùng giao dịch. `MoneyBridge` bắt buộc cổng này (không còn bỏ qua im lặng) |
| FB-R2-DOM-BE-02 | Done | B7/B8, PATCH số khách (snapshot phụ thu người tính lại), B12 gọi `resyncStay(ConfirmedStay)` |
| FB-R2-DOM-BE-03 | Done | `stay_night.calendar_rate_vnd` (A-22); đổi số đêm → bậc BR-107 theo tổng mới cho mọi đêm giá lịch (đêm giá sửa tay giữ giá). Test: 5→7 = 5.205.000, 7→5 = 4.079.000 (BR-107-03/04) |
| FB-R2-DOM-BE-04 | Done | A-20: kênh `ota` vượt sức chứa → 422 `CAPACITY_EXCEEDED_WARNING` (+`roomNo`,`max`), có `capacityWarningAckReason` → 201, `capacityConflict=true`, push `capacity_conflict`, không có `check_in` trong `allowedActions`; tự xóa khi số khách vừa căn (PATCH/B7/B7a). Kênh khác giữ `CAPACITY_EXCEEDED`. Giả định "chặn" trong `s2-be-a.md` đã bỏ |
| FB-R2-DOM-BE-05 | Done | A-21: OTA → FD/FDL luôn 202; MGR+ `roomId`/`allowUnassigned`; duyệt xong căn đã bán lại → làn chưa gán (`conflictState=open`, incident `no_show_restore`), không 409; đêm đã qua giữ giá snapshot (BR-315-03/04/05) |
| FB-R2-DOM-BE-06 | Done | D-9: J1 không hủy giữ chỗ có tiền; push đỏ sale + FD/FDL một lần/hạn, quá 12:00 ngày đến push MGR một lần; B5 hoàn 100 % (BR-303-04) |
| FB-R2-DOM-BE-07 | Done | Kênh Nội bộ không áp BR-113 (BR-113-04) |
| FB-R2-DOM-BE-08 | Done | Một việc thu hồi cho mỗi bộ đã chuẩn bị (kiểm việc `collect` đã có) |
| FB-R2-DOM-BE-09 | Done | Hạn = max(giờ nhận phòng, xác nhận + `extra_guest_kit_midstay_due_minutes`) (BR-812-10) |
| FB-R2-DOM-BE-10 | Done (BE phần mình) | `release_reason` bắt buộc như cũ; chữ nhắc dọn/kiểm thuộc UXD/FE |

## SEC (`reviews/s2-SEC.md`) – thẻ BE-A / BE chung
| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R2-SEC-BE-21 | Done | Generator sinh `dryRun: true` cho operation có `dryRun` trong body (cancelReservation, setLateCheckout, allocateGroupDeposit, cancelReservationGroupMember, cancelReservationGroup); guard + UoW chỉ miễn header khi có cờ đó, operation khác gửi `dryRun` → 422 `dryRun:NOT_ALLOWED` (fail-closed, mọi endpoint). `rejectDryRun()` của BE-B giữ làm lớp thứ hai |
| FB-R2-SEC-BE-23 | Done (phần BE) | Mọi giao dịch `lock_timeout` 5 s + `statement_timeout` 15 s (job 10 s); UoW không còn đặt `0`; lỗi 55P03/40P01/40001 → 409 `CONCURRENT_UPDATE` + `Retry-After: 1`, 57014 → 503 `SERVICE_UNAVAILABLE`. Phần vai DB (`idle_in_transaction_session_timeout`) → OPS. Hai mã mới chờ ARC ghi bảng |
| FB-R2-SEC-BE-24 | Done | J1 lô ≤ 100, SAVEPOINT từng đơn, `failures[]` (id + mã lỗi) trong `job_run.stats`; `lockRooms` trước khi giải phóng; `runDue` chạy tiếp property khác |
| FB-R2-SEC-BE-25 | Done | `conflicts[]` không có `reservationCode`/`guestDisplayName` khi người gọi không phải FD+ |
| FB-R2-SEC-BE-26 | Done | Người chốt: vai còn hiệu lực + tài khoản `active` + vai được chốt; đổi người chốt ghi `recordMoney('reservation.closer_changed')` |
| FB-R2-SEC-BE-28 | Done (phần BE-A) | `max_open_holds_per_user` (CTV 3, SAL 5, FD+ không giới hạn; đếm đơn tạo hoặc chốt) → 422 `HOLD_LIMIT_REACHED` (A-26); `searchAvailability` ≤ 90 đêm. SR-RL-09 (giới hạn tần suất chung) → Deferred Sprint 3 (BE chung, cần quyết cách đếm) |
| FB-R2-SEC-BE-29 | Done (phần BE-A) | Test CTV khác → 404 cho get/extendHold/cancel dryRun; `conflicts[]` không lộ mã |
| FB-R2-SEC-BE-30 | Done | FK `folio_line(property_id, stay_night_id)` theo cặp tenant (0016); chú thích default-deny ở `isOwnScoped` có sẵn |
| FB-R2-SEC-BE-31 | Deferred (Sprint 3) | Đổi chữ ký cổng sales-port (truyền `actor` của phiên) chạm mọi chỗ gọi của BE-B; hiện an toàn vì phía gọi kiểm phạm vi trước. Làm cùng đợt thêm đường gọi Sprint 3 |

## ARC (`reviews/s2-ARC.md`)
| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R2-ARC-BE-S2-02 | Done | = DOM BE-06 |
| FB-R2-ARC-BE-S2-03 | Done | Khóa job `hold.expire`, `ooo.activate` (= BUG-R2-021) |
| FB-R2-ARC-BE-S2-04 | Done | `MoneyBridge` tiêm bắt buộc FolioService, PaymentService, FOLIO_STAY_SYNC (api + worker); `reservation.folio_id` NOT NULL (0016, có điền folio cho đơn cũ); folio id sinh trước, FK DEFERRED |
| FB-R2-ARC-BE-S2-05 | Done | `guests/public/guest-contact.ts attachEmailIfEmpty()` – tăng `version`, audit, chỉ bỏ qua 23505 |
| FB-R2-ARC-BE-S2-06 | Done (phần BE-A) | RackBar `reservationCode`/`holdExpiresAt`/`externalContract`/`extraGuestCount` (+ A-24 `capacityConflict`, A-25 `requestedRoomGroupId/Code`); `ROOM_OCCUPIED`; `roomNo` ở CAPACITY_EXCEEDED/ROOM_NOT_SELLABLE; `expiredAt`; `depositPaidVnd`/`shortfallVnd`; `Reservation.noShowAvailableFrom`/`depositPaidVnd`; `suggestions[].orphanNight`; availability `upgrade`/`orphanNight`/`reservationId`; `getBookingRules` |
| FB-R2-ARC-BE-S2-07 | Done (phần BE-A) | Bỏ nhánh SQL dự phòng ở `depositPaid`; `StayNightAllocationService` (BE-B viết trong reservations/public) nay đăng ký ở ReservationsModule; `hk_task` chuyển cổng ở Sprint 4 |
| FB-R2-ARC-BE-S2-08 | Done | Ngày nghiệp vụ của job qua `ParameterService` (thiếu tham số → lỗi) |
| FB-R2-ARC-BE-S2-09 | Done (phần BE-A) | FK cặp `stay_night`; FK người dùng `room_block.affected_reservation_ack_by/released_by`, `reservation.capacity_ack_by` |
| FB-R2-ARC-BE-S2-10 | Done | Bỏ `registerPaymentRecorder` – một đường ghi tiền B2 qua PaymentService |
| FB-R2-ARC-BE-S2-11 | Done | Chỉ mục `reservation_segment (property_id, to_date, from_date) WHERE active`; gom mảng bằng `push`; p95 rack < 200 ms vẫn trong test |
| FB-R2-ARC-BE-S2-12 | Deferred (Sprint 4) | J2 `hold.remind`, J6 `no_show.call`, J7 `no_show.mark_prompt` cùng "Cần chú ý" – khóa đã chốt theo 9.1 |
| FB-R2-ARC-BE-S2-13 | Done | ESLint cấm `Promise.all/allSettled/any/race` trong `services/api/src/{modules,jobs}` |

## QA bug-list
| ID | Trạng thái | Ghi chú cho QA |
|---|---|---|
| BUG-R2-017 | Fixed | OTA không gửi giá → lịch OTA nhóm (`ota_base_rate`, `rounding.ota_rate`); bỏ `test.fail` TC-L2-012 (b) |
| BUG-R2-018 | Fixed | Sàn–trần theo giá nền nhóm, mọi kênh; bỏ `test.fail` TC-L2-013 |
| BUG-R2-019 | Fixed | Thứ tự: … OOO → chống trùng → tiền; bỏ `test.fail` TC-L2-020 |
| BUG-R2-020 | Fixed | Chỉ cùng nhóm hoặc nhóm cao hơn; bỏ `test.fail` TC-L2-024 |
| BUG-R2-021 | Fixed | `hold.expire`, `ooo.activate`; `JOB_ALIASES` có thể bỏ |
