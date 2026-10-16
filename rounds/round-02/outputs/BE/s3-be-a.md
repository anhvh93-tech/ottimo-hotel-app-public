# BE-A – Round 2, Sprint 3: lễ tân (nhận phòng → lưu trú → trả phòng), người đi cùng, hub sự kiện

- Vai: BE (BE-A) | Ngày: 16/10/2026 | Bước: Sản xuất | **Không commit** (ORC commit) | DB test riêng `ottimo_test_bea`
- Đầu vào: `outputs/ARC/s3-contract.md` (vùng BE-A, cổng 4.3, quy tắc migration 4.2), `outputs/SEC/s3-checklist.md` (A1–A6, D1–D3, H2, H4), `specs/EP03-05-stay.md` v0.2, OpenAPI **0.3.6-draft**, BR v0.3.3, `br-examples.json`, `rbac-cases.json` (0.3.6).
- Làm song song với BE-B, BE-C trên cùng thư mục: chỉ sửa file vùng BE-A + "thêm dòng" ở file dùng chung (`schema/index.ts`, `feature-modules.ts`, `_journal.json`) + ngoại lệ A-39 (`platform` – `updateRoom.warnings`).

## 1. Bảng operation / trạng thái
| operationId | Chuyển | Trạng thái | Ghi chú chính |
|---|---|---|---|
| previewCheckIn | – | Xong | 6 điều kiện (`not_unassigned`, `capacity_within_max`, `room_ready` (+`overridableBy` FDL+, OOO thì không), `balance_paid` (OTA trả trước = đạt), `main_guest_document`, `document_check_block`), 4 cảnh báo, phụ thu BR-411/413/415, `priorNight` B9a, `registrationDeadlinePreview` (cổng BE-C). Giờ mặc định = giờ chuẩn (BR-414) |
| checkIn | B9, B9a | Xong | Thứ tự kiểm đúng spec 1.6; 409 `CHECKIN_CONDITIONS_NOT_MET` + `unmet[]`; `SURCHARGE_CHANGED`; FD + buồng chưa sẵn sàng → 202 `checkin_room_not_ready` (FD gọi lại với `approvalRequestId` đã duyệt trong ngày); FDL+ ghi đè có lý do → buồng `OD` + việc `priority_clean`; `documentBlockOverride` chỉ FDL+ (FD → 403). B9a: Trực tiếp/CTV thêm đêm đầu (segment + tồn phòng + đêm bán + folio), OTA/HĐ nhập tay → **đơn con kênh Trực tiếp** `in_house` cùng folio (BR-417-01). **Không sinh/lưu mã cửa** (SEC D2) – chỉ `cardsIssued` 0–2/căn, `houseRulesSent`, ô "đã giao" |
| undoCheckIn | B17 | Xong | MGR+; cùng ngày nghiệp vụ; chặn khi còn dòng folio "sống" ghi từ lúc nhận (kể cả phụ thu nhận sớm) hoặc còn đơn con; buồng về trạng thái trước nhận |
| getExtensionOptions | – | Xong | Đêm trống liên tiếp (≤ `extension_max_nights`, HĐ nhập tay không giới hạn BR-421), giá mặc định = lịch giá Trực tiếp (BR-104/421), sàn–trần BR-105, `repricing[]` D-8 (bậc BR-107 tính lại cho mọi đêm), `exceedsShortStayLimit`, `channelFeeSavingsVnd` (OTA) |
| extendStay | B13 | Xong | `EXTENSION_LIMIT_EXCEEDED`, `NIGHTLY_RATES_NOT_ALLOWED` (HĐ nhập tay), `RATE_OUT_OF_RANGE`; trùng → 409 `ROOM_UNAVAILABLE`; Trực tiếp: kéo segment + đêm mới + re-tier + folio resync; OTA: đơn con (BR-422) |
| setLateCheckout | B15 | Xong | **dryRun chạy giao dịch READ ONLY, không header, không `uow.run` (SEC A3 [CHẶN])**; `treatAsExtension` sau mốc cuối; ân hạn chỉ khi không có khách đến; FD + xung đột → 409 `LATE_CHECKOUT_CONFLICT`, `requestApproval` → 202 `late_checkout_conflict` + thông báo MGR; duyệt xong hook tự áp giờ hẹn |
| changeRoom | B14 | Xong | dryRun READ ONLY → `ChangeRoomPreview`; sức chứa chặn cứng 422 mọi kênh (A-37); buồng mới phải VI/VC (409 `ROOM_NOT_READY` + `roomStatus`); `property_fault` giữ giá, `guest_request` giá lịch căn mới (Trực tiếp/CTV, D-8) hoặc dòng `room_change_difference` (OTA); `applyDifference` + `expectedDeltaVnd`; căn cũ VD/OD + việc dọn, căn mới OC; `doorAccessHandedOver` đặt lại; bộ đồ dùng thêm chuyển/thu hồi (BR-812); `workOrderId` → 422 tới khi có phiếu sửa (Sprint 4) |
| listCheckoutReminders / recordCheckoutConfirmation | – | Xong | Trạng thái US-031 theo `checkout_reminders` (11:00 gọi, 12:00/12:31 quá giờ theo khách đến cùng ngày); nhật ký append-only |
| getCheckoutSummary | – | Xong | Dòng folio, tổng/đã thu/còn thu/`creditVnd`, `lateSurchargeRecalc` (G-10), `pendingApprovals` (không tính `refund`), `blockers` 4 loại; `checkoutAt` (E05-09) |
| checkOut | B18 | Xong | Phụ thu trả muộn theo **giờ trả thực tế**: giảm → tự đảo dòng cũ + ghi dòng mới; tăng → phải tích + `expectedSurchargeVnd`; `finalPayment` cùng giao dịch (PaymentService.recordInTx của BE-B); chặn theo thứ tự `MINIBAR_NOT_CHECKED` → `PENDING_APPROVALS` → `BALANCE_DUE` (MGR+ ghi `debt`) → `OVERPAYMENT_HANDLING_REQUIRED` (A-34: `refund_request` → yêu cầu hoàn, `retain_with_guest_consent` chỉ MGR+ → dòng `deposit_forfeit`); folio `settled` + số bill (FolioService.settle); đơn con cùng trả; buồng VD (CL giữ CL); việc `checkout_clean` (+ dòng thu hồi bộ đồ dùng thêm) |
| earlyDeparture (Should) | B16 | Xong | BR-428 đếm ngày báo theo ngày nghiệp vụ lúc báo; void đêm `early_departure`, nhả tồn phòng, phí giữ lại `early_departure_fee`, yêu cầu hoàn = min(phần hoàn, tiền khách trả dư) (G-14). Tham số mới `early_departure_refund` |
| updateReservation (B-28) | – | Xong | `doorAccessHandedOver: true` chỉ FD+, chỉ `in_house`, một lần (lần 2 → 409) |
| listParty / addPartyMember / removePartyMember | – | Xong | Người đứng tên = cột đơn (id = id đơn, không bỏ được → 409); trùng → 409 `PARTY_DUPLICATE`; trẻ em: tên + năm sinh **chỉ bản mã hóa** qua cổng crypto (DEK riêng, khóa băm chống trùng), chỉ trả `priceAgeBand`; thêm giữa kỳ `effectiveFrom` + `occupancyChange` (phụ thu BR-110 × đêm còn lại, dryRun READ ONLY, `applyExtraPersonSurcharge` + `expectedSurchargeVnd`, việc bộ đồ dùng thêm hạn giữa kỳ); `Party.version` = ETag/If-Match; bỏ người → hủy DEK + cổng registration xóa giấy tờ cùng giao dịch (A-38); SAL/CTV không thấy `members` (D10) |
| cancelReservation / markNoShow / resolveOverbookingExternal (B-13, BE-12) | – | Xong | Hook `transitioned` → `GuestAccessPort.revokeAllForReservation` cùng giao dịch; dời khách ra ngoài → yêu cầu hoàn 100 % tiền đã thu (`overbooking_relocated`) |
| updateRoom (A-39) | – | Xong | 200 = Room + `warnings[{code: FUTURE_RESERVATIONS_KEEP_ROOM, count}]` khi ngừng bán còn đơn giữ căn; mảng rỗng khi không có; không chặn |
| listApprovalRequests / approve / reject / cancel | – | Xong | Loại mới chạy qua luồng sẵn có; DTO bổ sung `targetType`, `targetCode`, `selfApplied`, `refundDestination` (che – D15), `refundedVnd` |
| streamEvents | – | Xong | SSE `{id}`; `pg_notify` trong giao dịch nghiệp vụ → chỉ phát sau COMMIT; 1 kết nối LISTEN riêng/tiến trình; lọc theo cơ sở + vai/người (`registration.changed` FD+, `payment.changed` MGR+ + người ghi, `notification.created` chỉ người nhận); nhịp 25 s, đóng sau 15 phút để xác thực lại |
| listMyNotifications | – | Xong | Hộp thư theo người (lọc SQL theo `user_id`), chưa đọc lên đầu, con trỏ, `unreadCount`; đủ 18 `kind` (gồm 5 kind mới A-36) |
| listAttentionItems | – | Xong | Mục sự kiện (`attention_event`) + mục tính lúc đọc: `capacity_conflict`, `overbooking`, `no_show_call/mark`, `hold_expiring`, `extra_guest_kit_overdue`, `room_ooo`, **`reconcile_overdue`** (`count`, `oldestDays`); `params` có allowlist theo kind trong code, khóa lạ → lỗi (B-21/SEC J) |

## 2. Thiết kế chính
- **Module mới `frontdesk`** (controller + `checkin`, `stay`, `checkout`, `party` service, `StaySupport`), **`events`** (EventsService public, SseHub, AttentionService). `frontdesk` không import `reservations/internal`: reservations mở `public/stay-port.ts` (`ReservationStayPort` + hàm lưu trữ, `createChildStay` cho BR-417/422).
- **Cổng vùng khác** (`frontdesk/public/ports.ts`): `FD_REGISTRATION_PORT`, `FD_GUEST_ACCESS_PORT`, `FD_CHILD_DATA_PORT`, `FD_MINIBAR_PORT`. Mặc định **đóng an toàn**: chưa có registration → giấy tờ người đứng tên "chưa có" (chặn nhận phòng); chưa có crypto → từ chối dữ liệu trẻ em (503, không bao giờ lưu bản rõ). BE-C đã gắn 3 cổng đầu (registration, guest-portal, crypto). Tiền dùng thẳng FolioPort/PaymentService của BE-B (`postLines`, `reverseLine`, `balance`, `settle`, `resyncStay`, `recordInTx`).
- **Trạng thái buồng SM-03**: bảng `room_status` (lưu khi lễ tân đổi; căn chưa có dòng → suy ra OOO/OC/VC như rack Sprint 2) + lịch sử `state_transition` machine `SM-03` + SSE `room.status_changed`. Housekeeping (Sprint 4) dùng lại `RoomStatusService`.
- **Quy tắc thuần** `frontdesk/public/stay-rules.ts`: BR-411/413/415/417 nhận sớm, BR-412/413/416 trả muộn trên **trục ngày nghiệp vụ** (00:00–05:59 = sau nửa đêm, G-16), BR-425 trạng thái nhắc, BR-428 hoàn trả sớm. Mọi số đọc từ tham số.
- **Migration 0030** (SQL viết tay, không snapshot – ARC 4.2): cột `reservation` (thẻ, nội quy, ghi đè, giao mã/thẻ, công nợ, trả sớm, `late_checkout_requested_time`, `party_version`), bảng `room_status`, `checkout_confirmation` (chỉ thêm), `reservation_guest`, `staff_notification`, `attention_event`, RLS + grant, khóa danh mục `early_departure_refund`. Entry journal nối cuối, `when` tăng; `test/migrations-journal.test.ts` (6 ca) chặn lỗi bỏ qua im lặng.
- **SEC**: A3 (dryRun READ ONLY ở `setLateCheckout`, `changeRoom`, `addPartyMember` – có test đếm bảng trước/sau), D1 (`checkIn` cần thiết bị được cấp – guard; test 403 `DEVICE_NOT_TRUSTED`), D2 (không mã cửa trong `Reservation`/`checkIn`/SSE/push/audit – test quét JSON), H2 (sales-port đọc đơn bằng **actor của phiên**, chỉ job dùng `SYSTEM_ACTOR`), A2 (mọi ghi tiền/C3 qua UnitOfWork: `Idempotency-Key` + `If-Match`, audit tiền cùng giao dịch), A5 (SSE/push chỉ loại + id + mã hiển thị).

## 3. File tạo / sửa
**Mới**
- `product/services/api/src/db/migrations/0030_frontdesk_be_a.sql`; `src/db/schema/frontdesk.ts`
- `src/modules/events/{events.module.ts, public/events.service.ts, internal/{events.controller,attention.service,sse-hub}.ts}`
- `src/modules/frontdesk/{frontdesk.module.ts, public/{ports,room-status.service,stay-rules}.ts, internal/{frontdesk.controller,checkin.service,stay.service,checkout.service,party.service,stay-support,attention-sources,default-ports}.ts}`
- `src/modules/reservations/public/stay-port.ts`
- Test: `test/frontdesk-rules.test.ts` (34), `test/migrations-journal.test.ts` (6), `test/integration/frontdesk.test.ts` (18), `test/integration/frontdesk-stay.test.ts` (8, gồm J24 + stayInfo), `test/integration/rbac-sprint3-bea.test.ts` (199 ca từ `rbac-cases.json`)

**Sửa**
- `src/db/migrations/meta/_journal.json` (nối 1 entry), `src/db/schema/index.ts` (+1 dòng), `src/db/schema/reservations.ts` (cột 0030), `src/modules/feature-modules.ts` (+EventsModule, FrontdeskModule)
- `src/modules/reservations/`: `reservations.module.ts` (provider/export stay-port), `internal/reservations.service.ts` (B-28, BE-12, `createChildStay`, `emitEvent`, `partyMissingCount`), `internal/reservation-store.ts` (cột mới), `internal/reservation-dto.ts` (`doorAccessHandedOverAt`, `partyMissingCount`), `internal/extra-guest-kit.ts` (giữ bộ đồ dùng khi `in_house`), `internal/money-bridge.ts` (`credit`), `internal/sales-port.adapter.ts` (SEC H2), `public/room-capacity-check.ts` (A-39)
- `src/modules/approvals/public/approval.service.ts` (DTO: targetType/targetCode/selfApplied/refundDestination/refundedVnd)
- Ngoại lệ A-39 trong `platform`: `public/room-capacity.ts` (interface + `RoomWarning`), `internal/rooms.service.ts` (trả `warnings`)
- `test/helpers/feature-app.ts` (tùy chọn `override` cho test thay cổng)

## 4. Kết quả lệnh (lần cuối 16/10/2026 ~23:05, DB `ottimo_test_bea`, sau khi BE-B và BE-C xong Sprint 3)
| Lệnh | Kết quả |
|---|---|
| `pnpm format:check` (toàn repo) | **xanh** |
| `pnpm lint` (eslint + `turbo run typecheck`) | **xanh** – 12/12; 0 lỗi, 2 cảnh báo sẵn có (`mockServiceWorker.js`) |
| `pnpm build` | **6/6** |
| `turbo run test --force --continue` | 10/12 gói xanh ngay lần đầu. **admin-web**: 1 ca `booking.test.tsx` hết giờ khi máy chạy song song 12 gói – chạy lại riêng **132/132 xanh** (ca chập chờn đã ghi ở s2-be-a). **api 2031/2033**: toàn bộ test của BE-A xanh (`frontdesk-rules` 34, `migrations-journal` 6, `frontdesk` 18, `frontdesk-stay` 9, `rbac-sprint3-bea` 199), `guest-portal` + `registration-flow` (BE-C, sau khi chuyển sang cổng của BE-A) xanh. 2 ca đỏ `payments-s3` (BE-B) do **DB riêng của BE-A cũ**: 0040/0041 của BE-B đã sửa SAU khi DB này chạy chúng (đã kiểm: `minibar_check_replaced_by_fk` trong DB chưa DEFERRABLE, chưa có `GRANT UPDATE (…) ON payment` – trong file thì có). Migration chỉ tiến nên DB cũ không nhận bản sửa; BE-A **không có quyền** xóa sạch DB để migrate lại (lệnh bị từ chối). Cần chạy lại trên DB tạo mới (CI/OPS) |
| `node scripts/gen-openapi-meta.mjs --check` | up to date (không đổi hợp đồng) |
| Drizzle | Sinh nháp vào thư mục tạm (không ghi vào repo): mọi bảng/cột/CHECK/FK/chỉ mục của 0030 trùng khớp `schema/*.ts` – không lệch. Snapshot gộp để bước ổn định cuối sprint (ARC 4.2-8) |

## 5. Giả định (tự quyết theo quyền BE – đề nghị ORC ghi decision-log)
1. Người đứng tên không có dòng `reservation_guest`; `member.id` của họ = id đơn (không backfill, xóa → 409).
2. `childDisplayName` (che bớt) **chưa trả** – cần giải mã qua crypto mỗi lần đọc danh sách; chỉ trả `priceAgeBand`, `isMinorData`. Đề nghị UXD/SEC xác nhận đủ cho R2.
3. Thêm người làm **đổi số khách** trên đơn chưa nhận phòng → 409, lễ tân sửa số khách bằng `updateReservation` trước (một đường tính lại giá); giữa kỳ ở thì tính qua `occupancyChange`.
4. Giá mặc định đêm gia hạn = lịch giá Trực tiếp của đêm đó (cuối tuần/ngày đặc biệt, BR-104) – không "bê" giá đêm cuối có phụ thu cuối tuần sang ngày thường.
5. B9a / gia hạn của đơn OTA (và HĐ nhập tay khi thêm đêm trước) → đơn con kênh Trực tiếp `in_house`, cùng căn, **cùng folio**; trả phòng gọi trên đơn chính, đơn con trả cùng.
6. `checkOut` chỉ trên đơn chính (folio chính); ngày đi = ngày đi muộn nhất của đơn chính + đơn con.
7. Trả sớm: phần giữ lại ghi `early_departure_fee`; yêu cầu hoàn = min(phần hoàn BR-428, tiền khách đã trả dư). Không tính lại bậc BR-107 khi trả sớm (BR-428 đã là chính sách riêng) – DOM xác nhận.
8. `retain_with_guest_consent` → dòng `deposit_forfeit` (theo giả định ARC).
9. Sau trả phòng căn ở `VD` → lần nhận phòng sau cần buồng phòng dọn (Sprint 4 `transitionRoomStatus`) hoặc FDL+ ghi đè / FD xin duyệt – đúng BR-402 nhưng QA cần biết khi test luồng liền mạch.
10. `room_status` nằm trong `frontdesk` (bảng + service public) cho tới khi module housekeeping nhận lại ở Sprint 4.
11. Trẻ em: tuổi tính theo năm (ngày đến − năm sinh) vì BR-612 chỉ thu năm sinh.

## 6. Việc cần vai khác
| Gửi | Nội dung |
|---|---|
| **BE-B** | (1) Gắn `FD_MINIBAR_PORT` (inventory) – hiện mặc định "không bắt buộc" nên blocker `minibar_not_checked` chưa bật. (2) Đổi minibar + `listPayments` sang `RESERVATION_SALES_PORT.stayInfo()` (mục 8) thay vì đọc thẳng `reservation`. (3) Gửi `refund_ready`, `payment_disputed`, `deposit_shortfall_accepted`, `receiving_account_changed` bằng `EventsService.notify` (kind đã có CHECK). |
| **BE-C** | Cảm ơn đã cài thẳng `FrontdeskRegistrationPort`. BE-A đã sửa 2 file vùng BE-C theo ORC (mục 9): `registration/internal/stay-reader.ts` (đọc qua cổng `stay-view`), `guest-portal/internal/guest-portal.service.ts` (+`setEta`), `guest-portal/guest-portal.module.ts` (bỏ hook thu hồi trùng). Nên truyền actor phiên vào `readStay` ở các chỗ có phiên nhân viên (mặc định SYSTEM_ACTOR). | |
| **QA** | (1) DS-E thêm `early_departure_refund = {"minNoticeDays":1,"refundPct":50}`. (2) Ca mới: SEC A3 (đếm `folio_line`/`reservation_change`/`audit_event`/`idempotency_key` trước–sau dryRun), G-10 (hẹn 17:00 trả 13:00 → đảo 354.000, ghi 212.000), A-34 (`credit_balance`), B-28 lần 2 → 409, A-37 → 422, A-39, B9a 04:40 (direct + Agoda → đơn con 917.000), BR-417-02 → 409, B16 (852.000), BR-416 FD → 409 → 202 → MGR duyệt. (3) `rbac-cases` 0.3.6 cho 18 op của BE-A đã chạy xanh (streamEvents kiểm qua socket thật). |
| **ARC** | Xác nhận tách hạn mức duyệt `refund` khỏi `foc_limits` (mục 8, ý 3). Không đổi hợp đồng. Ghi nhận: `LateCheckoutResult.reservation` trả khi `saved`; extension members của Problem: `unmet`, `expectedSurchargeVnd`, `tierPct`, `folioDeltaVnd`, `creditVnd`, `balanceDueVnd`, `pendingApprovals`. |
| **SEC** | Review: SSE (pg_notify sau COMMIT, lọc vai), `staff_notification` lọc theo user trong SQL, allowlist `params`, A3 ba đường dryRun, H2, dữ liệu trẻ em chỉ bản mã hóa + hủy DEK khi bỏ người. |

## 7. Việc chưa xong / rủi ro
- `requestFocForSurcharge`: cài bằng dòng FOC chờ duyệt + `ApprovalService.submit` (hook FOC của folio xử lý) – chưa có test tích hợp riêng.
- Job định kỳ: đã thêm J24 `payment.expire` (mục 8); nhắc trả phòng tự động US-034 là R3; trạng thái nhắc/"Cần chú ý" tính lúc đọc.
- Kiểm thị thực khi gia hạn (`visaWarningAckReason`): nhận và ghi lý do; phép kiểm hạn thị thực nằm ở registration (BE-C) – chưa nối.
- `workOrderId` của B14 luôn 422 tới khi có module bảo trì (Sprint 4).
- Không có ESC mới.

## 8. Xử lý yêu cầu ORC sau khi BE-B xong Sprint 3
| # | Yêu cầu | Đã làm |
|---|---|---|
| 1 | Gỡ đoạn tạm `TMP-BEA-CYCLE`, thư mục `tmp-bea` | Đã gỡ khỏi `test/helpers/feature-app.ts` (chỉ còn tùy chọn `override`), xóa `test/tmp-bea/`. Không còn chuỗi `TMP-BEA`/`BEA_TMP` trong `src`, `test` |
| 2 | Review sửa của BE-B trong `approval.service.ts` | **Đồng ý**: `refund` không tự áp (`selfApplication` → null, `maySelfApply` → false), người tạo không tự duyệt kể cả OWN/MGR (`assertNotSelf`) – khớp SEC F8 và CHECK `approval_request_refund_no_self_approval` (0040). Giữ nguyên |
| 3 | Duyệt `refund` bị chặn bởi hạn mức FOC | `approvals/internal/limits.ts`: `MONEY_LIMITED` (định tuyến theo `foc_limits`, ngân sách tháng FOC) chỉ còn `foc`, `special_discount`; thêm `MONEY_TYPES` (`foc`, `special_discount`, `refund`) cho kiểm số tiền > 0 và nhóm nhật ký `money`. `refund` → `requiredRole = manager`, MGR/OWN duyệt mọi số tiền (BR-522, rbac 5.1), không tính vào ngân sách FOC tháng; trần số tiền vẫn do nơi tạo/chi kiểm (≤ credit, ≤ duyệt − đã chi – A-33). Test: FD tạo hoàn khi trả phòng → MGR duyệt 200 `approved`, `requiredRole: manager` (không lên OWN). Đề nghị ARC ghi vào decision-log |
| 4 | Danh sách duyệt trả `refundDestination` (che) + `refundedVnd` | `toApprovalDto` (dùng cho list/approve/reject/cancel/202): `refundDestination {method, bankBin, accountNoLast4, setAt}` – không bao giờ số đầy đủ (D15), `refundedVnd`; kèm `targetType`, `targetCode`, `selfApplied` (0.3.3 còn thiếu). Test list kiểm `refundedVnd: 0` |
| 5 | `stayInfo` trong cổng public của reservations | `RESERVATION_SALES_PORT.stayInfo(tx, reservationId) → StayInfo \| null`: mã, trạng thái, loại lưu trú, nhóm kênh, kiểu thanh toán, folio, đơn cha, ngày đến/đi, căn hiện tại (số căn), số người, cờ HĐ nhập tay – **không** tên/SĐT; chỉ RLS, người gọi tự áp phạm vi thao tác (HK chỉ `in_house`). Test tích hợp. BE-B đổi minibar/`listPayments` sang dùng (chưa sửa code vùng BE-B) |
| 6 | Job J24 `payment.expire` | `src/jobs/payment-jobs.ts`: `pending` có `expires_at ≤ Clock.now()` → `expired` theo điều kiện dòng (`FOR UPDATE SKIP LOCKED`, lô 200, chạy mỗi tick – đúng một lần, bắt kịp), `state_transition` SM-12 actor `system`, nhật ký tiền `payment.expired`, SSE `payment.changed` (MGR+ và người ghi). Đăng ký ở `FrontdeskModule` (api/test-support) và `worker.ts`. Test: 05:59 → 0; 06:00 chạy 3 lần song song → đúng 1 dòng hết hạn, 1 lịch sử, 1 nhật ký |

File sửa thêm ở bước này: `src/modules/approvals/internal/limits.ts`, `src/modules/approvals/public/approval.service.ts`, `src/modules/reservations/public/sales-port.ts`, `src/modules/reservations/internal/sales-port.adapter.ts`, `src/jobs/payment-jobs.ts` (mới), `src/worker.ts` (+2 dòng), `src/modules/frontdesk/frontdesk.module.ts`, `test/helpers/feature-app.ts`, `test/integration/frontdesk.test.ts`, `test/integration/frontdesk-stay.test.ts`.

## 9. Xử lý yêu cầu ORC sau khi BE-C xong Sprint 3
| # | Yêu cầu | Đã làm |
|---|---|---|
| 1 | `stayView(tx, id, actor)` cho registration | Mới `reservations/public/stay-view.ts`: `stayView`/`stayViews` (mã, trạng thái, loại, ngày đến/đi, tổng người, tên + ngôn ngữ người đứng tên, số căn hiện tại, giờ đến, giờ nhận/trả thực tế, đơn cha) đọc với **actor của phiên** (SAL/CTV chỉ đơn của mình – H2; ngoài phạm vi → null); `activeRootBookings` cho bù đăng ký. BE-A **đã chuyển** `registration/internal/stay-reader.ts` sang cổng này (giữ nguyên interface `StayView`/`readStay`/`readStays`/`bookingsWithoutRegistration`, thêm tham số `actor` tùy chọn, mặc định SYSTEM_ACTOR cho job và phiên khách). Không còn file nào của BE-C đọc thẳng `reservation`/`reservation_segment`/`room` cho đơn (`bookingsWithoutRegistration` chỉ đọc bảng `registration` của BE-C) |
| 2 | `setEta(tx, reservationId, eta, late)` | Cùng file: khóa dòng đơn, chỉ `hold`/`confirmed` (đã nhận phòng → trả `false`, không ghi), giá trị trùng → không ghi; lịch sử `reservation_change` (`eta_time`, lý do `online_checkin` / `online_checkin late_arrival`), SSE `reservation.changed`; giờ sai → 422. Tham số thứ 5 `now` (Clock của người gọi – không dùng `now()` SQL). Đã nối vào `completeOnlineCheckin` của guest-portal (sau khi đánh dấu xong) |
| 3 | Thu hồi link khách: giữ một nơi | Giữ **hook của BE-A** (`frontdesk.module.ts`, gọi `FD_GUEST_ACCESS_PORT` theo ARC 4.3 / B-13) và truyền lý do (`cancelled` / `no_show` / `relocated`); **bỏ** hook `transitioned` trong `guest-portal.module.ts` (module không còn `onModuleInit`). Interface `FrontdeskGuestAccessPort.revokeAllForReservation` thêm `reason?` |
| 4 | Giữ 2 dòng J16 trong `worker.ts` | Giữ nguyên; BE-A chỉ thêm 1 dòng import + 1 dòng đăng ký J24 |

Test mới: `frontdesk-stay` ca "stayView + setEta" (phạm vi actor, ETA 22:00 + lịch sử, 25:00 → 422). Chạy lại `guest-portal.test.ts`, `registration-flow.test.ts`, `frontdesk*.test.ts`: 41/41 xanh.

## 10. Bước Phản hồi & sửa (17/10) – review ARC/SEC/DOM + OpenAPI 0.3.6 bổ sung 1 + 2
Trả lời từng thẻ: `rounds/round-02/responses/s3-BE-A.md`. Tóm tắt thiết kế:
- **Phụ thu người theo đêm** (ARC-01, DOM-16, S3-13): `stay_night.extra_person_fee_vnd` (0031); `ConfirmedStay.nights[].extraPersonVnd`; `syncStay` (BE-B) một dòng `extra_person`/đêm; `ReservationStayPort.peopleFromNight/feesForNewNights/setNightFees`. Thêm/bớt người giữa kỳ áp từ `effectiveFrom`/đêm nay; B14 theo căn đêm đó.
- **Giá đêm chỉ qua reservations** (ARC B-3 d): `pricedNights`, `retierStay`, `writeRepricedNights` (B13, B9a, E05-11) – đêm giá tay giữ giá, đêm khác tính lại bậc BR-107; snapshot ghi `source` và `extraNightDates`.
- **Phụ thu trả muộn một dòng sống** (ARC-06, DOM-17/25): `StaySupport.replaceLateCharge` (B15, G-10 ở B18, B13, B16) – đảo dòng sống + FOC kèm, ghi dòng mới, chuyển FOC đã duyệt = min(FOC, mới).
- **Lưu trú gộp đơn chính + con** (ARC-05): `StaySupport.effectiveStay`.
- **B18 mới**: `extraNight`, cửa sổ sau nửa đêm, `TIME_AFTER_ACTION`/`TIME_NOTE_REQUIRED`, `SURCHARGE_DECISION_REQUIRED`, chỉ yêu cầu tiền chặn, yêu cầu vận hành `superseded`, `unhandledCreditVnd`, `overpayment_retained`, `tryEarnCommissions`.
- **B9/B9a**: cửa sổ B9a giờ server + `availableFrom`; quyết định phụ thu bắt buộc; MGR được báo khi vượt chặn giấy tờ; hủy `checkin_room_not_ready` mở; B17 qua `FolioService.hasLiveLinesSince`.
- **B16** → `EarlyDepartureResult`; cơ sở ròng; phụ thu người đêm bỏ hoàn 100 %; OTA `otaRetainedVnd`; `noticeEvidence`.
- **Sự kiện**: SSE nối lại + backoff + đóng luồng khi hỏng, ≤ 5 luồng/người, kiểm lại phiên mỗi nhịp, `publishSse()` dùng chung, audience `reservation.changed`; params "Cần chú ý" theo định dạng khóa; dòng hỏng không làm 500; ApprovalService tạo dòng hộp thư (một push).
- **Dùng chung**: UoW đánh dấu replay đã quyết vai; job `idempotency.purge`; `MONEY_AUDIT_ACTIONS` (tập đóng của hợp đồng, AuditService từ chối mã lạ ngoài production); `ReservationReadPort`; `providePartyCount`; `Reservation.depositShortfall`; `StayViewRow.actualArrivalDate`; `readStay/readStays` bắt buộc actor.
- **Migration 0031** (journal idx 26) + tham số `manual_time_tolerance_minutes` (danh mục, mặc định 30). `.ts` thêm `reservation_capacity_ack_by_fk` (0017 có sẵn – parity). Snapshot đầu `0053_snapshot.json` sinh lại theo 4.2a-2c (giữ `id/prevId`).

**File tạo**: `src/db/migrations/0031_frontdesk_fix_be_a.sql`, `src/modules/audit/public/money-actions.ts`, `src/modules/reservations/public/read-port.ts`, `test/integration/frontdesk-s3-fixes.test.ts`, `test/integration/schema-parity.test.ts`, `test/module-boundaries.test.ts`, `rounds/round-02/responses/s3-BE-A.md`.

**File sửa (vùng BE-A)**: `db/schema/{frontdesk,reservations,approvals}.ts`, `migrations/meta/{_journal.json,0053_snapshot.json}`, `frontdesk/frontdesk.module.ts`, `frontdesk/internal/{checkin,checkout,stay,party,stay-support,attention-sources,frontdesk.controller}.ts`, `frontdesk/public/stay-rules.ts`, `reservations/internal/{reservations.service,reservation-store,reservation-dto,sales-port.adapter,reservations.controller}.ts`, `reservations/public/{stay-port,stay-view,sales-port,reservation-hooks}.ts`, `reservations.module.ts`, `approvals/public/approval.service.ts`, `audit/public/audit.service.ts`, `events/public/events.service.ts`, `events/internal/{sse-hub,events.controller,attention.service}.ts`, `jobs/builtin-jobs.ts`; test `frontdesk.test.ts`, `frontdesk-stay.test.ts`, `rbac-sprint3-bea.test.ts`.
**File sửa ngoài vùng (báo ORC)**: `folio/public/folio.service.ts` (`syncStay` phụ thu theo đêm – BE-B đã giữ), `shared/http/unit-of-work.ts` (replay → `enforced`), `registration/internal/{stay-reader,registration.service,c3-log.service,retention.service}.ts`, `registration/public/registration.service.ts`, `guest-portal/internal/guest-portal.service.ts` (truyền `SYSTEM_ACTOR` tường minh – theo yêu cầu ORC, không đổi hành vi).

**Kết quả lệnh** (17/10 ~00:35–00:45, DB `ottimo_test_bea_s3r2` rồi `ottimo_test_bea_s3r3` tạo mới sau khi BE-B sửa 0042, Node 22):

| Lệnh | Kết quả |
|---|---|
| `prettier --check .` | All matched files use Prettier code style |
| `eslint .` | 0 lỗi (2 cảnh báo có sẵn ở `mockServiceWorker.js`) |
| `turbo run typecheck` | 12/12 |
| `turbo run build` | 6/6 |
| `turbo run test --force` | 12/12 task; `@ottimo/api` **55 tệp / 2118 test xanh**; chạy lại api trên DB mới sau 0042 của BE-B: **55 tệp / 2119 xanh** (gồm `frontdesk-s3-fixes` 10, `schema-parity` 6, `module-boundaries` 5, `rbac-sprint3-bea` 214, `guard-s3` của BE-B) |
| `drizzle-kit generate` (thư mục thật + bản sao) | "No schema changes" – không tạo tệp |
| `gen-openapi-meta.mjs --check` | up to date |

## 11. Bước Kiểm thử – sửa lỗi QA, đợt 2 (17/10, HEAD `c8b83f3`, chưa commit)
| Lỗi | Trạng thái | Cách sửa / lý do |
|---|---|---|
| BUG-R2-031 (P1) | Fixed | `Reservation` trả `cardsIssued`, `houseRulesSentAt` (cột 0030), `balanceDueVnd` (`MoneyBridge.balanceDue` → FolioService), `registrationId/registrationStatus/registrationDeadlineAt` (registration module đăng ký `ReservationHooks.provideRegistrationSummary` – `registration/public/stay-facts.ts`; reservations không đọc bảng `registration`). Đơn con không có khai báo riêng → không trả |
| BUG-R2-052 (P1) | Fixed | Ngày nghiệp vụ = ngày đến và giờ < mốc đổi ngày (00:00–05:59) = khách đến khuya: không phụ thu nhận sớm, không đêm trước, B9 thường (`checkin.service.ts evaluate`). B9a chỉ trong cửa sổ ngày nghiệp vụ = ngày đến − 1 |
| BUG-R2-037 (P1) | Fixed | B13: hạn thị thực/tạm trú sớm nhất của giấy tờ NN (cổng mới `FrontdeskRegistrationPort.earliestVisaValidUntil`, BE-C cài – giải mã trong giao dịch, chỉ so ngày) < ngày đi mới và thiếu `visaWarningAckReason` → 422 `visaWarningAckReason: VISA_EXPIRES_BEFORE_DEPARTURE` |
| BUG-R2-046 (P1) | Fixed (BE-B + BE-A) | `FolioService.nightRateBasis` (BE-B): FOC trả muộn/nhận sớm/dịch vụ mang `limitBasisVnd` = giá đêm liên quan; `StaySupport.requestFoc` truyền basis. Test: MGR duyệt FOC 334.000 trên dòng trả muộn (đêm 667.000), không lên OWN |
| BUG-R2-047 (P2) | Fixed | B13: buồng `OC` → `OD` (SM-03, event B13) |
| BUG-R2-040 (P3) | Fixed | `getRack.roomStatus`: OOO hôm nay → trạng thái đã lưu `room_status` → suy ra (như `RoomStatusService.current`) |
| BUG-R2-033 (P2) | Fixed một phần (BE-A + BE-C) | `frontdesk/internal/document-party.port.ts` (gắn qua `RegistrationPartyLink.provide()` của BE-C): (1) người trong đơn có hồ sơ khớp số giấy tờ (blind index) / tên + ngày sinh; (2) hồ sơ khách khớp → thêm người đi cùng quan hệ `unknown` khi đơn còn chỗ khai trong nhóm tuổi; (3) người duy nhất chưa có giấy tờ; (4) mơ hồ → null. Ca "không khớp ai" vẫn null: hồ sơ khách bắt buộc SĐT/email (`CONTACT_REQUIRED`) → cần BE-B (hồ sơ chỉ từ giấy tờ) hoặc PO quyết |
| BUG-R2-034 (P2) | BE-C làm | BE-C đã thêm nguồn "Cần chú ý" `registration_due/overdue`, `visa_expiring` + J5; BE-A bỏ bản nháp trùng |
| BUG-R2-038 (P2) | Deferred – chờ ARC 0.3.7 | Cộng phụ thu sắp ghi vào `balance_paid` sẽ chặn mọi nhận phòng có phụ thu: `recordPayment` không cho thu quá "còn phải thu" (`AMOUNT_EXCEEDS_BALANCE`) và `checkIn` không có trường thu tiền. Cần hợp đồng `checkIn.payment` (như `checkOut.finalPayment`) hoặc nới trần thu trước nhận phòng – đổi hợp đồng, không làm trong sprint khi ARC chưa duyệt. Tới lúc đó phụ thu nằm trên folio, B18 chặn `BALANCE_DUE` |
| BUG-R2-045 (P2) | Deferred – chờ ARC | Hợp đồng chỉ có MỘT số `channelFeeSavingsVnd`, server không biết khách chọn bao nhiêu đêm (test QA so với 2 đêm). Đề nghị ARC 0.3.7: `repricing[].channelFeeSavingsVnd` (theo từng số đêm) hoặc `channelCommissionPct` để giao diện tự nhân với `repricing[k].deltaVnd`. Giữ số hiện tại (1 đêm) tới khi có hợp đồng |
| BUG-R2-043 (phần BE-A, theo BE-B) | Fixed | `createReservation.initialPayment.posAuthCode/note`: kiểm Luhn trước độ dài → 422 `CARD_NUMBER_DETECTED` |

Test mới (`frontdesk-s3-fixes.test.ts`): ca 052/031/040/047/037 (đến 01:30, trường 0.3.6, rack, OD, chặn mềm thị thực) và ca 033 (cổng gắn người). Ca ARC-06/DOM-17 nay MGR duyệt FOC (046).

**Kết quả lệnh** (DB mới `ottimo_test_bea_s3t1`): `prettier --check` xanh; `eslint` 0 lỗi; `turbo run typecheck` 12/12; `turbo run build --force` 6/6; `turbo run test --force` 12/12 – api **55 tệp / 2130 test xanh**; `drizzle-kit generate` "No schema changes"; `gen-openapi-meta --check` up to date.

**Cho QA bỏ `test.fail`**: BUG-R2-031 (TC-L3-030 (E), TC-L3-001 (E) phần `houseRulesSentAt/cardsIssued`), BUG-R2-052 (TC-L3-008 (a), TC-L3-001 (E) < 06:00), BUG-R2-037 (TC-L3-054 phần 422), BUG-R2-046 (TC-NT-029 (b), TC-NT-030 (b), TC-NT-036 (a), TC-L4-056), BUG-R2-047 (TC-L4-004), BUG-R2-033 (TC-L3-032 ca (a) khớp hồ sơ; ca (b) còn mở). Giữ `test.fail` của BUG-R2-038, BUG-R2-045 (chờ ARC).
