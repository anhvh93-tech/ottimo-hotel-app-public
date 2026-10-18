# BE-D – Round 2, Sprint 4: EP01 đọc (Tổng quan / Hôm nay), "Cần chú ý", SSE theo vai, EP14 yêu cầu khách

- Vai: BE (luồng BE-D, mới) | Ngày: 17/10/2026 | Bước: Sản xuất – mốc 1 (mục 1–5) + **mốc 2 (mục 6 EP14 – ORC đồng ý 17/10)** | **Không commit** (ORC commit) | DB test riêng `ottimo_test_bed` (PostgreSQL 17 `ottimo-dev`, mô hình 4 vai) – không đụng stack demo.
- Đầu vào: `sprint-4-plan.md` (đóng băng D1) mục 4, 4.2, 8.3, 11; `openapi.yaml` 0.3.7 + `outputs/ARC/openapi-0.3.7.md` (mục 3, 7, 10.5, 10.6); `specs/EP01-dashboard.md`, `specs/EP14-guest-app.md`; `business-rules.md` v0.3.6 (BR-010, 303, 311, 404, 425, 435, 811, 904, 907); `metrics-definitions.md` (Q-03…Q-05, K-01…K-03, S1c); `rbac-matrix.md` (S02 ghi chú 1); backlog US-003 AC4, US-010, 011, 012, 019 AC2, 031, 085 AC2, 136, 108, 109, 110; erd 4.11; state-machines SM-15; rbac S30.

## 1. Đã làm

### 1.1 Mục 1 – US-010 `getTonightKpi` (`GET …/dashboard/tonight`)
Module mới **`reporting`** (architecture 5.1 – M1), tính khi đọc trong giao dịch chỉ đọc (RLS):
- Mẫu số: căn đang kinh doanh đêm đó, `is_sellable`; trừ căn bán được nằm trong khối OOO `active`/`released` phủ đêm (khối `planned`/`cancelled` không trừ – Q-04); đêm vừa bán vừa OOO (dữ liệu sai) tính là bán, không trừ OOO.
- Tử số: căn có đêm `sold` **đã gán căn** (K-02); `holdOnlyRooms` riêng (BR-904); `unassignedConflictReservations` = số đơn có đêm `sold` chưa gán căn (S1c), không vào công suất.
- `occupancyPct` 1 chữ số thập phân, `null` khi mẫu số 0 (Q-15); `metricRefs` K-01/K-02/K-03/S1c; **không trường tiền** (US-003 AC4 – FD thấy đủ đối tượng).
- `arrivals`/`arrivalsCheckedIn`/`departures`/`departuresCheckedOut` lấy **cùng bộ đọc** với danh sách mục 1.2 → "{đã nhận}/{tổng}" luôn khớp; `inHouse` = lượt ở (đơn chính) đang ở.
- Đêm nay = ngày nghiệp vụ (BR-010): 01:30/02:15 ngày 16/10 vẫn là đêm 15/10 (US-010 AC3 – có ca test).
- US-019 AC2: căn khóa `active` không vào đêm khả dụng; khối `planned` không trừ (có ca test).

### 1.2 Mục 2 – US-011 + S4-31 `getArrivalsDepartures` (`GET …/arrivals-departures?date=`)
- `date` vắng = ngày nghiệp vụ; ngoài ±7 ngày → 422 `VALUE_OUT_OF_RANGE` (`field=date`, kèm `min`/`max`); sai dạng/sai lịch → `DATE_INVALID`.
- **Khách đến**: đơn chính, ngày đến = `date`, `confirmed` + `in_house`; sắp: chưa nhận trước → chưa gán căn trước → ETA (vắng = `checkin_time`) theo trục ngày nghiệp vụ → mã đơn. `allowedActions` = `check_in` (B9, `requiresTrustedDevice: true`) chỉ khi FD+, `confirmed`, không xung đột/không vượt sức chứa, `today = arrivalDate`.
- **Khách đi** (thẻ "khách trả phòng hôm nay" – S4-31, US-031): đơn chính `in_house`/`checked_out` có **ngày đi hiệu lực** = `date` (lượt ở có đơn con gia hạn → ngày của đơn con; `departureDate` của dòng trả ngày hiệu lực); `reminderState` theo BR-425 (`frontdesk/public/stay-rules` – cùng luật với `listCheckoutReminders`), `hasArrivalSameRoomToday`; sắp: chưa trả trước → **căn có khách đến hôm nay lên đầu (US-031 AC2)** → `overdue` > `call_needed` > `reminded_waiting` > `replied`. `allowedActions` = `check_out` (B18) khi FD+ và `today = ngày đi`, **gồm cửa sổ sau nửa đêm** (ngày nghiệp vụ = ngày đi − 1, ngày lịch = ngày đi – 0.3.7 B-20).
- **Giữ chỗ chưa cọc**: `hold` đến ngày `date`, sắp theo hạn, không có nút.
- Mỗi dòng `ReservationSummary`: `balanceDueVnd` qua `FolioService.balance` (cùng số với `getFolio`), `registrationStatus` qua `ReservationHooks.registrationSummary` – không đọc bảng của folio/registration.
- Ngày khác hôm nay: chỉ xem, không nút (EP01 2.4). Parity test: `check_in`/`check_out` khớp `Reservation.allowedActions` của module reservations ở mọi vai × trạng thái × ngày.

### 1.3 Mục 3 – US-012 "Cần chú ý" đủ nguồn (phần BE-D)
| Nguồn | Cách làm |
|---|---|
| **Lọc theo vai ở server** (AC6, US-003 AC4, rbac S02 ghi chú 1) | `attentionAudience`: OWN riêng `foc_threshold`, `security_alert`, `data_quality` của kiểm DATA; MGR+ `reconcile_overdue`; FD+ mọi loại vận hành (gồm `data_quality` có `check` = `registration_*` – lễ tân xử lý, S4-39; `closed_reservation_credit`). Trước đây danh sách không lọc (FD thấy `reconcile_overdue`) – đã sửa ca test Sprint 3 tương ứng |
| Thứ tự (EP01 3.2) | critical → warning → info, rồi `dueAt` tăng dần (không hạn xếp sau) |
| **J2 `hold.remind`** (US-085 AC2) | Job mỗi tick: đơn `hold` còn ≤ `hold_expiry_reminder_hours` → thông báo `hold_expiring` cho người tạo + sale phụ trách (lỗi tài khoản → FD/FDL), đúng một lần mỗi hạn (`job_run` slot `id@hạn`; gia hạn B3 → nhắc lại). Dòng "Cần chú ý" `hold_expiring` có `dueAt` = hạn (nguồn frontdesk sẵn có). Đăng ký ở api (test-support) và `worker.ts` |
| **US-136 AC1** (J6/J7) | Nguồn `no_show_call`/`no_show_mark` (frontdesk) sửa: đơn có giờ đến dự kiến còn ở phía trước không vào dòng tới khi qua giờ đó (BR-311 "đã báo đến trễ") – so trên trục ngày nghiệp vụ |
| **US-136 AC2/AC4/AC5** | Qua cổng sự kiện `ReservationHooks('transitioned')` cùng giao dịch B11/B12: `no_show_marked` → OWN + MGR; `no_show_restored` → OWN + MGR trừ người khôi phục; đơn OTA → mục sự kiện `ota_no_show_report` (`params.action` `report`/`revoke`, `channel`, `refCode` = mã đơn, warning, FD+, lễ tân đóng bằng `resolveAttentionEvent` – lưu người, lúc). Trạng thái "kênh đã biết no-show" suy từ dòng do **người** đóng gần nhất; khôi phục trước khi báo → dòng `report` hệ thống tự đóng, không sinh `revoke`; đánh dấu lại trước khi báo hủy → dòng `revoke` tự đóng |
| **S4-06 `closed_reservation_credit`** | Thêm loại vào tập `AttentionKind`, không tham số, hiện cho OWN/MGR/FDL/FD; `resolveAttentionEvent` từ chối (409) – chỉ hệ thống đóng. **BE-B phát** (xem 3.2) |
| **`registration_party_docs_unlinked`** | BE-C đã phát (`data_quality`, `params.check`, `dueAt` = hạn tự xóa); BE-D làm phần hiển thị: FD+ thấy (trước đây `data_quality` theo EP01 chỉ OWN) – có ca test |
| `vip_arrival` (AC7) | Nguồn mới: đơn chính còn `confirmed` đến hôm nay, người đặt có tag VIP/Khách quen → mỗi đơn một dòng (info), `refCode`, `roomNos`, `dueAt` = ETA/giờ nhận chuẩn; không tên trong `params` |
| `foc_threshold` (AC8, BR-435) | Nguồn mới, chỉ OWN, tính khi đọc: (a) FOC lũy kế tháng (dòng `foc` `posted` net đảo) > `foc_alert_pct_of_room_revenue` % doanh thu phòng lũy kế → `params {check: foc_pct_of_room_revenue, pct?, threshold}`; (b) số FOC đã duyệt theo người duyệt (gồm tự áp) > `foc_alert_count_per_approver` → mỗi người một dòng `params {check: foc_count_per_approver, count, max}`, không nêu tên – `link` lọc theo `approverId` |
| **`resolveAttentionEvent`** (chưa có trước Sprint 4) | `POST …/attention-events/{eventId}/actions/resolve` (Idempotency-Key, UnitOfWork): mục không thấy/đã đóng/không tồn tại → 404; loại hệ thống đóng (`overbooking`, `unassigned_with_free_room`, `closed_reservation_credit`) → 409 `INVALID_TRANSITION`; `note` ≤ 500, V-09 (`CARD_NUMBER_DETECTED`), bắt buộc với mục critical (EP01 3.2 → 422 `REASON_REQUIRED`); SSE `attention.changed` |
| Allowlist `params` (SEC J) | Thêm khóa + định dạng: `ota_no_show_report` (`action` ∈ report/revoke, `channel` mã kênh), `ooo_ending_work_open` (`roomNo`, `endDate` – cho BE-C), `foc_threshold` (`check`, `pct`, `threshold`, `count`, `max`) |

### 1.4 Mục 4 – SSE quyền theo vai (OpenAPI 0.3.7 "người nhận theo vai")
- `SSE_ROLE_FLOOR`: FD+ mọi loại (trừ `payment.changed` = MGR+ và người ghi – A-35); HK: `room.status_changed`, `hk_task.changed`; MT: `room.status_changed`, `work_order.changed`; `guest_request.changed` = FD+ **cộng** bộ phận người phát truyền (`housekeeping`/`maintenance`); `notification.created` chỉ người nhận; SAL/CTV chỉ `reservation.changed` của đơn mình (người tạo/người chốt) + thông báo của mình.
- Vai người phát truyền vào chỉ **cộng thêm** vào mức sàn, không thu hẹp; mọi payload luôn có `r`; payload không người nhận nào → lỗi lập trình; hub coi payload thiếu người nhận là FD+ (đóng an toàn – trước đây là "mọi nhân viên").
- Kiểm qua LISTEN thật: HK nhận `room.status_changed`, không nhận `reservation.changed`/`attention.changed`; SAL không nhận gì khi không phải đơn của mình.

### 1.5 Mục 5 (làm kèm) – US-003 AC4, US-019 AC2
- US-003 AC4: KPI không có trường tiền; FD/FDL/MGR không nhận `foc_threshold` (test). Doanh thu tháng/ADR/RevPAR không có ở R2 (US-014 R3).
- US-019 AC2: đêm khả dụng trừ căn khóa `active` đêm đó (test 6/9 = 66,7 %); khối `planned` không trừ.

### 1.6 Mục 6 – EP14 (US-108, US-109, US-110) + migration `0058`
**Migration `0058_guest_request`** (SQL + `src/db/schema/guest-requests.ts` + 1 dòng journal, **không snapshot**): bảng `guest_request` theo erd 4.11 + trường 0.3.6/0.3.7 (`room_id` chụp lúc tạo, `fee_vnd_snapshot`/`fee_accepted_at`/`fee_folio_line_id`, `declined_reason_code` + `reply_note` thay `declined_reason_i18n`, `overdue_notified_at`, `closed_at/by`, `purge_after`); 11 CHECK (loại, trạng thái, định tuyến, độ dài, lý do từ chối ⇔ `declined`, `other` cần lời nhắn, phí > 0 cần đồng ý, đóng ⇔ `done/declined`); FK tới đơn, căn, `hk_task`, `folio_line`, `app_user`; RLS + `tenant_isolation`, GRANT không DELETE. Thêm khóa danh mục **`property_map_url`** (OWN). Tự kiểm đồng bộ SQL ↔ `.ts`: sinh snapshot tạm bằng `drizzle-kit generate` trong bản sao rồi chạy `schema-parity` → 6/6 xanh (snapshot thật ORC sinh khi tích hợp).

**US-108 – `getGuestStay` / `openGuestSession`** (sửa `guest-portal.service.ts`):
- Không bao giờ trả `roomNo` cho khách; `roomName` chỉ khi đơn đã báo căn cho khách (`room_disclosed_to_guest`, BR-012 (4)), `publicRoomType` khi đã gán căn – qua cổng đọc mới `reservations/public/guest-room-view.ts` (guest-portal không đọc bảng đơn – ARC 4.3; BE-A review).
- Ghim bản đồ (S4-51, P-S4-7): tham số `property_map_url` là **một nguồn**; mặc định danh mục = ghim INV 17/10; OWN đổi ở Tham số, host ngoài danh sách SEC E14-08 → 422 `NOT_IN_LIST` (thêm vào `platform/internal/parameter-rules.ts`); host còn kiểm lại mỗi lần đọc.
- Wi-Fi theo **ngày nghiệp vụ** (BR-010) hoặc khi đã `in_house` (trước đây so ngày lịch).

**US-109 – phía khách** (`guest-portal/internal/guest-requests.*`, mức 1, `x-after-checkout: blocked`):
- `listGuestRequestOptions`: loại HK/MT chỉ khi `in_house` (`not_in_house`); `extra_cleaning` – khách dài hạn luôn có phí (`long_stay_adhoc`), ngắn ngày chỉ khi đã có **lần dọn đầy đủ trong ngày nghiệp vụ** sau giờ nhận phòng (`second_full_clean` + `lastFullCleanTime`) – BR-506/ESC-016 A; loại có phí khóa khi đã 3 yêu cầu có phí đang mở (`paid_limit_reached`); `noteRequired` cho báo hỏng / xe-tour / khác.
- `createGuestRequest` (Idempotency-Key, 201): `type` (REQUIRED/NOT_IN_LIST), `note` (3–500 khi bắt buộc, V-09 `CARD_NUMBER_DETECTED`), `REQUEST_TYPE_NOT_AVAILABLE` (+ `unavailableReason`), `FEE_NOT_ACCEPTED`; ≤ 20 yêu cầu/đơn/ngày nghiệp vụ → 429 `RATE_LIMITED` + `Retry-After` (SR-RL-05); định tuyến BR-811; `ackDueAt` = lúc gửi + `guest_request_response_minutes` trong giờ trực `[07:00, 22:00)`, ngoài giờ = mốc mở trực kế tiếp + 10 phút và ghi `auto_replied_at` (21:59 → 22:09; 22:00 → 07:10 hôm sau – đúng ví dụ BR-811); việc HK/phiếu sửa qua cổng của BE-C cùng giao dịch; thông báo `guest_request_new` tới bộ phận + FD/FDL; SSE `guest_request.changed` (bộ phận + FD+); lịch sử SM-15.
- `listMyRequests`: chỉ yêu cầu của đơn trong phiên, mới nhất trước, `statusLabel` theo ngôn ngữ phiên (sinh từ chuỗi UXD – `scripts/gen-guest-request-copy.mjs`, có `--check`), `no-store`.

**US-110 – phía nhân viên (S30)**:
- `listGuestRequests`: FD+ thấy hết; HK chỉ `housekeeping`, MT chỉ `maintenance` (US-110 AC3); mặc định chưa kết thúc; quá hạn trả lời lên đầu rồi theo `ackDueAt`; `roomNo` + `roomName` (BR-012 (2)); `feeVnd` bị serializer bỏ với HK/MT.
- `transitionGuestRequest`: `acknowledge` (`new` → `acknowledged`, HK/MT chỉ yêu cầu của mình – khác bộ phận → 404); `complete` (`acknowledged/in_progress` → `done`, FD+; HK/MT chỉ khi yêu cầu không có việc/phiếu liên kết); `decline` (FD+ – HK/MT → 403; `new/acknowledged`; `declinedReasonCode` bắt buộc; `replyNote` bắt buộc khi `other`; việc HK còn mở bị hủy qua cổng); `replyNote` ≤ 300, V-09, **SEC B-15**: dãy ≥ 6 chữ số (bỏ dấu cách/chấm/gạch) trừ hotline công khai → `SENSITIVE_DATA_DETECTED`; sai bước → 409 `INVALID_TRANSITION`.
- Cổng với BE-C: dùng **hợp đồng BE-C đã viết** (`housekeeping/public/guest-request-work.port.ts` – `GUEST_REQUEST_WORK_PORT` BE-C cài, `GUEST_REQUEST_STATUS_PORT` BE-D cài = `GuestRequestStatusPort`, xuất toàn cục). Chưa gắn → stub `UnwiredGuestRequestWorkPort` (không tạo gì, HK/MT xử lý từ danh sách) – có test.
- Việc liên kết: bắt đầu → `in_progress` (ghi luôn `acknowledgedAt` nếu còn `new`); xong → `done` + **phí BR-506 ghi folio đúng một lần** qua `FolioService.postLines` (dòng `cleaning`, nguồn `guest_app`, mã `adhoc_cleaning`, cho phép trong cửa sổ sau trả phòng; folio đã khóa → bỏ qua, lễ tân ghi tay); hủy → không đổi trạng thái (lễ tân trả lời khách).
- **J10 `guest_request.sla`** (tick): yêu cầu còn `new` quá `ackDueAt` → `guest_request_overdue` tới bộ phận + FD/FDL **một lần** (`overdue_notified_at` trong cùng UPDATE … `SKIP LOCKED`), SSE; "Cần chú ý" `guest_request_overdue` (FD+, `count`, `roomNos`, `dueAt`) tính khi đọc. Đăng ký ở api và `worker.ts`.

### 1.7 Đợt 3 (ORC 17/10 tối) – điều kiện ARC `reporting`, ngôn ngữ phiên khách, trả lời tự động, US-066 + US-003 AC2, S4-20
**ARC 11.4 C2/C5/C6 + 11.2 #10** (làm trước theo ORC):
- C2: `no-show-notices.ts` không còn SQL trên `attention_event`. `EventsService` (events/public) thêm `attentionHistory(tx, {kind, refType, refId})` (khóa dòng, mới nhất trước) và `resolveAttentionById(tx, id, now, note)` (hệ thống đóng, `resolved_by` NULL, phát `attention.changed`).
- C5: `reporting.module.ts` khai `REPORTING_READ_TABLES` (10 bảng: `reservation`, `reservation_segment`, `stay_night`, `room`, `room_block`, `checkout_confirmation`, `channel`, `guest`, `folio_line`, `approval_request`) và `REPORTING_WRITE_TABLES` (`job_run`).
- C6: `module-boundaries.test.ts` thêm khối "reporting read model": không `INSERT` ngoài `job_run`, không `UPDATE … SET`/`DELETE`/`FOR UPDATE|SHARE`, chỉ đọc bảng đã khai (bỏ tên CTE). Test parity `stay-actions.ts` giữ nguyên.
- `GuestRequest.roomNo` = `null` khi đơn chưa có căn (không còn `''`).

**Vòng phụ thuộc DI làm Nest không khởi động** (mọi test tích hợp treo khi `HousekeepingModule` vào `feature-modules.ts`):
- Vòng cũ: `HousekeepingService` → `GUEST_REQUEST_STATUS_PORT` (= `GuestRequestStatusPort`) → `GuestRequestsService` → `GUEST_REQUEST_WORK_PORT` → `HousekeepingService`.
- Sửa **trong module của BE-D**, không đụng mã BE-C: tách `guest-portal/internal/guest-request-lifecycle.ts` (`GuestRequestLifecycle`: lịch sử SM-15, phí BR-506, việc liên kết bắt đầu/xong/hủy), chỉ phụ thuộc `EventsService` + `FolioService`. `GuestRequestStatusPort` và `GuestRequestsService` cùng dùng lớp này.
- Kết quả: cây chung khởi động lại bình thường, toàn bộ 2596 test chạy được (mục 4).

**Ngôn ngữ phiên khách P-S4-10** (0.3.7 bổ sung 1 #12; erd `guest_session`):
- Cột `guest_session.locale_chosen_at` + chỉ mục `guest_session_locale_chosen_idx` thêm vào `0058` (chưa gộp); schema `guest-portal.ts` (tệp BE-C, sửa 2 chỗ nhỏ sau khi đọc lại).
- `guest-locale.ts` `pickGuestLocale` chọn theo thứ tự:
  1. lựa chọn mới nhất của khách cho **cùng đơn** – kể cả phiên đã bị thu hồi khi lễ tân cấp lại link;
  2. `preferred_locale` của người đứng tên (vi/en/ru – nay nhận `ru`);
  3. thẻ đầu `Accept-Language`: `vi*` → vi, `ru*` → ru, `*`/khác/vắng → **en**.
- Phiên mới chép mốc đã chọn.
- `setGuestLocale` ghi `locale_chosen_at` và không đổi hồ sơ khách.
- `openGuestSession` trả `localeChosenByGuest`.
- Test: 3 ca tích hợp (`fr-FR` → en, `ru-RU` → ru, `vi-VN` → vi, vắng → en; hồ sơ `ru` thắng trình duyệt; chọn rồi cấp lại link → giữ + cờ `true`, hồ sơ không đổi, `fr` → 422 `NOT_IN_LIST`) + 1 ca đơn vị (9 nhánh).

**Trả lời tự động ngoài giờ** (UXD `guest.req.auto_reply` VI/EN/RU):
- Đã sinh lại `guest-request-copy.ts`; `autoReply` nay trả.
- **`property.phone_public` trống → bỏ câu chứa `{phone}`** (không số dự phòng, không để trống số) – `renderAutoReply` trong `guest-request-rules.ts`.
- Test đơn vị VI/EN/RU có/không số; ca tích hợp 22:00 kiểm câu EN đầy đủ.

**US-066 + US-003 AC2 – danh mục minibar** (nhận từ BE-B):
- Migration **`0061_item_name_i18n`** (SQL + schema `inventory.ts` + 1 dòng journal, không snapshot): `item.name_i18n` jsonb + CHECK object; `GRANT UPDATE (name_i18n)` vì 0042 giới hạn cột được sửa.
- `inventory/internal/items.service.ts` + `items.controller.ts`:
  - `listItems` (OWN/MGR/FDL/FD/HK);
  - `createItem` (201 + ETag, Idempotency-Key);
  - `updateItem` (If-Match → 412 `VERSION_CONFLICT`).
- Kiểm `ItemInput`: `code` `^[a-z0-9_]{1,32}$`; tên `vi|en|ru` (ít nhất một – `name.vi` `REQUIRED`); đơn vị 1–20; tiền 0…100.000.000 (`VALUE_OUT_OF_RANGE`); số lượng nguyên (2,5 → `VALIDATION_FAILED`); trùng mã → 422 `DUPLICATE`.
- **`code` không đổi được** → 422 `NOT_EDITABLE` (FB-R2-ARC-BE-S3-32).
- `salePriceVnd` null/0 = miễn phí (`isFree`, kiểm minibar ghi tiêu thụ, không ghi tiền – BR-701).
- Giá mới áp cho lần kiểm sau, dòng folio cũ giữ nguyên (BR-006).
- Giá vốn chỉ OWN/MGR (serializer); audit `config` `item.created`/`item.updated` không chứa giá vốn, chỉ `costChanged`.
- HK đếm minibar không thấy tiền (US-003 AC2 – kiểm lại cả `minibar-standard` và phản hồi `minibar-checks`).
- Test `minibar-catalog-s4-bed.test.ts` (5 ca).
- RBAC: 33 ca `rbac-cases.json` của 3 operation thêm vào `rbac-sprint4-bed.test.ts` (nay 122).

**S4-20 – test `dev_clock` chập chờn**:
- Nguyên nhân: `platform.test.ts` (NOTIFY api ↔ worker, đặt 2026-10-15T15:59Z) và `http-foundation.test.ts` chạy song song trên cùng một dòng `dev_clock`. Khi đồng hồ đổi giữa hai lần "chạy job ngay", ngày nghiệp vụ và slot đổi, nên lần hai ra `done` thay vì `skipped_already_ran`.
- Sửa:
  - `test/helpers/dev-clock-lock.ts` `withDevClockLock` (khóa tư vấn PostgreSQL trên kết nối riêng);
  - mọi đoạn ghi `dev_clock` (2 test + 2 `afterAll`) chạy trong khóa;
  - "chạy job ngay" đóng băng đồng hồ ở 16/10 03:30 và gửi `slot: '03:00'`.
- Kết quả: chạy 3 lần liền 2 tệp song song – xanh.

### 1.8 Phản hồi & sửa – DOM v0.3.8 (DOM-S4-07…11)
| Mã | Sửa | Ở đâu | Oracle / test |
|---|---|---|---|
| DOM-S4-07 (BR-311) | Đơn chính còn `confirmed` có ngày đến < ngày nghiệp vụ luôn ở `no_show_mark` (critical), mọi giờ – không rơi lúc 06:00; hạn dòng = giờ đánh dấu của ngày đến cũ nhất. Trước 23:00 hôm nay: dòng "đánh dấu" (đơn quá ngày) + dòng "gọi" (đơn hôm nay) | `frontdesk/internal/attention-sources.ts` (`noShows` – **nhờ BE-A review**) | BR-311-02 (a/b/c + ngày nghiệp vụ) – `attention-dom-s4-bed.test.ts` |
| DOM-S4-08 (BR-435, K-18) | Giá trị = FOC **+ giảm giá đặc biệt** (dòng `foc` + `discount` đã ghi, đảo dòng tự trừ), ngày ghi quy về ngày nghiệp vụ; số lần = yêu cầu `foc` + `special_discount` còn sống (`foc_state` applied/dormant – cùng tập BR-433), đầu kỳ = 1 của tháng lúc đổi ngày nghiệp vụ. `pct` (K-18 trên Tổng quan) theo cùng giá trị. Hàm thuần `focValueCheck`, `focCountAlert` | `reporting/internal/attention-sources.ts` | BR-435-02 (2.900.000 > 2.700.000; đếm 10 → không) – units; dashboard: giảm giá đặc biệt nâng `pct`, đếm 2; bị hủy theo quy tắc → 1 |
| DOM-S4-09 (BR-506) | "Lần dọn đầy đủ" = `stayover_clean`, `long_stay_clean`, `adhoc_clean` + việc "Dọn thêm"; bỏ `priority_clean` | `guest-request-rules.ts` (`FULL_CLEAN_TASK_TYPES`, `countsAsFullClean`) | BR-506-03 – units; guest-requests: dọn gấp 08:40 → `feeVnd` null |
| DOM-S4-10 (BR-811) | Quá hạn trả lời → bộ phận + FD + FDL + **MGR**; OWN không nhận | `guest-request-rules.ts` (`overdueRecipients`), J10 | BR-811-04 – units; guest-requests J10: fd, fdl, mgr |
| DOM-S4-11 (BR-956, NÊN) | `vip_arrival` thêm người đứng tên đã có đơn `checked_out` (khách quay lại, không cần nhãn); cờ "có thể là khách quen" từ giấy tờ không tính; nhận phòng → hết dòng | `reporting/internal/attention-sources.ts` | BR-956-01 – `attention-dom-s4-bed.test.ts` |

- Đã bỏ `pendingFix` của 5 oracle trên trong `product/tests/fixtures/br-examples.json`; `validate-fixtures.mjs` OK (1 cảnh báo cũ của `ds-0.json`).
- Chưa làm (NÊN, BR-956 (2)): người đi cùng mang nhãn VIP/Khách quen. Lý do: `reporting` không đọc bảng người đi cùng; thêm bảng cần ARC duyệt (C5).
- Danh mục nhóm khách (VIP, Khách quen, Dài hạn, Doanh nghiệp, Đoàn) thuộc module `guests`; `vip_arrival` chỉ xét VIP, Khách quen (giữ bí danh `returning`, `regular`).

## 2. Interface / việc cho vai khác
### 2.1 FE-B (Hôm nay H03 / Tổng quan H24)
- `getTonightKpi`, `getArrivalsDepartures` đúng schema 0.3.7; dòng khách đi dùng `departureDate` = ngày đi hiệu lực; nút chỉ theo `allowedActions` (ngày khác hôm nay → rỗng).
- "Cần chú ý": server đã lọc theo vai và sắp xếp; `ota_no_show_report` → nút "Đã báo kênh" = `resolveAttentionEvent` (đọc `params.action` để chọn câu report/revoke); `closed_reservation_credit`, `overbooking`, `unassigned_with_free_room` **không** có nút đóng (409). `foc_threshold`: đọc `params.check` để chọn câu; không có tên người duyệt – dùng `link`.
- SSE: HK/MT/SAL/CTV chỉ nhận loại theo vai (mục 1.4) – FE không cần lọc thêm.

### 2.2 BE-B – S4-06 `closed_reservation_credit`
Phát bằng `EventsService.openAttention(tx, { kind: 'closed_reservation_credit', severity: 'warning', dedupeKey: 'closed_reservation_credit:<reservationId>', refType: 'reservation', refId, refCode: <mã đơn>, now })` – **không `params`** (khóa nào cũng bị từ chối). Tự đóng: `EventsService.resolveAttention(tx, 'closed_reservation_credit:<reservationId>', now, '<ghi chú hệ thống>')` khi yêu cầu hoàn chi đủ hoặc khách để lại. Endpoint đóng tay trả 409 cho loại này.

### 2.3 BE-C
- **Nguồn "Cần chú ý" thuộc bảng của BE-C** (đăng ký từ module của BE-C bằng `EventsService.registerAttentionSource`, như registration): `work_order_high_open` (US-012 **AC4** – mỗi phiếu một dòng, `refCode` mã WO), `work_order_overdue`, `ooo_ending_work_open` (`params {roomNo, endDate}` đã có trong allowlist, `refCode` mã WO), `room_status_mismatch` (BR-806). Khóa `params` mới khác cần thêm vào `ATTENTION_PARAM_KEYS` (events, BE-D) – báo BE-D. Tất cả hiện FD+ (mặc định).
- SSE: phát `hk_task.changed`, `work_order.changed`, `room.status_changed` **không cần** truyền vai (mức sàn đã đủ theo 0.3.7).
- **Vòng DI (17/10 tối) – BE-D đã gỡ phía guest-portal** (mục 1.7): BE-C **không cần** sửa `HousekeepingModule` vì lý do treo khởi động; giữ nguyên inject `GUEST_REQUEST_STATUS_PORT`. Nếu BE-C đang sửa "treo `startFeatureApp`" thì đối chiếu với bản đã gỡ trước khi đổi gì.
- `guest_session` (schema `guest-portal.ts` của BE-C): BE-D thêm cột `localeChosenAt` + chỉ mục (P-S4-10) – BE-C đọc lại khi sửa tệp.
- **Cổng EP14 – đã khớp:** BE-C đã viết hợp đồng ở `housekeeping/public/guest-request-work.port.ts` (từ đề xuất mục này); guest-portal re-export và dùng đúng tín hiệu/kiểu đó. BE-C cần: (1) gắn `{ provide: GUEST_REQUEST_WORK_PORT, useExisting: <impl> }` toàn cục khi đưa module `housekeeping` vào `feature-modules.ts`; (2) inject `GUEST_REQUEST_STATUS_PORT` (BE-D đã cung cấp, toàn cục); (3) thêm FK `hk_task.guest_request_id` / `work_order.guest_request_id` → `guest_request(property_id, id)` ở migration của BE-C (bảng `guest_request` có từ `0058`); `guest_request.work_order_id` → `work_order` cũng do BE-C thêm (bảng của BE-C). Cổng được gọi trong giao dịch **có actor `guest`** (createGuestRequest) – `created_by` = null.

### 2.4 BE-A (review)
- BE-D sửa `frontdesk/internal/attention-sources.ts` (`noShows` – điều kiện ETA, US-136 AC1) – nhờ BE-A review.
- B11/B12 trong `reservations.service.ts` còn 2 lệnh `outboxStaffPush` cũ (`ota_no_show_report` cho FD, `no_show_restored` cho MGR – Sprint 2) trùng với thông báo mới (inbox + push của BE-D qua hook) → đề nghị BE-A **bỏ 2 lệnh đó** trong lần sửa tới (BE-D không sửa tệp đang nóng của BE-A). Push R2 là Mock nên chưa ảnh hưởng người dùng.

- File mới `reservations/public/guest-room-view.ts` (cổng đọc tên phòng phía khách, BR-012 (4)) – nhờ BE-A review.

### 2.5 ARC (ghi vào hợp đồng – không đổi trường/operation)
1. `resolveAttentionEvent`: khai `409` (`INVALID_TRANSITION` – loại hệ thống đóng) và `422` (`note` bắt buộc với mục critical – EP01 3.2; `CARD_NUMBER_DETECTED`).
2. `AttentionItem.params` của `foc_threshold`: `check` ∈ `foc_pct_of_room_revenue` | `foc_count_per_approver`, `pct`, `threshold`, `count`, `max`; người duyệt chỉ qua `link` (`approverId`).
3. `streamEvents`: ghi thêm "SAL/CTV: `reservation.changed` của đơn mình + `notification.created`"; "vai người phát chỉ cộng thêm".
4. `ArrivalsDepartures.departures[].departureDate` = ngày đi hiệu lực của lượt ở (đơn con gia hạn).
5. Review module `reporting` đọc trực tiếp bảng đơn/đêm/căn/khối OOO (mô hình đọc, chỉ SELECT) – nếu ARC muốn cổng đọc riêng thì BE-D chuyển.
6. erd 4.11 `guest_request`: cập nhật cột theo `0058` (mục 1.6); erd 9: khóa `property_map_url` (OWN, text, host E14-08); `GuestRequest.roomNo` (required) trả `''` khi đơn chưa có căn (yêu cầu lễ tân trước ngày đến của đơn xung đột) – đề nghị cho `null`.
7. `createGuestRequest` 429 `Retry-After` (giới hạn ngày) và `listGuestRequestOptions.unavailableReason = outside_service_hours`/`not_offered` chưa dùng ở R2 [GIẢ ĐỊNH BE-D].
8. Bảng "Mã lỗi theo trường": thêm `NOT_EDITABLE` – `updateItem.code` (mã danh mục không đổi, FB-R2-ARC-BE-S3-32). Ghi chú: mapper chung `platform/public/validation.ts` đổi lỗi `.int()` của zod 4 thành `REQUIRED` (zod 4 không kèm `input`) – BE-D tránh bằng `refine` ở `items.controller.ts`; chủ mapper nên sửa chung (số lẻ/sai kiểu không phải "thiếu").

### 2.6 SEC – review bắt buộc SSE (G2): `events.service.ts` (`SSE_ROLE_FLOOR`, `publishSse`), `sse-hub.ts` (`matches` đóng an toàn); guest-web yêu cầu khách (P-R2-4): `guest-requests.service.ts` (ghi chú D23 không vào thông báo/push/SSE/log), `replyNote` B-15. **Cần SEC quyết:** luật "≥ 6 chữ số" chặn cả **giá tiền** viết kiểu `350.000` – mâu thuẫn EP14 3.2 (lễ tân báo giá xe/tour trong `replyNote`). Đề xuất: cho phép số tiền dạng nhóm nghìn kèm `đ`/`VND`/`k`, hoặc lễ tân viết "350 nghìn". Hiện cài đúng luật SEC (chặn).
### 2.6b UXD – `guest.req.auto_reply` đã có (VI/EN/RU) → server trả `autoReply`; cơ sở chưa có `phone_public` thì bỏ câu "gọi {phone}" (mục 1.7). Khóa `guest.req.decline.<mã>` theo enum 0.3.7 có VI/EN; **RU chưa có** 5 khóa decline (client sẽ rơi về EN) – server không dùng các khóa này (chỉ trả `declinedReasonCode`).
### 2.7 QA – ca mới: `test/be-d-s4-units.test.ts` (23), `test/integration/dashboard-s4-bed.test.ts` (17), `test/integration/guest-requests-s4-bed.test.ts` (12), `test/integration/rbac-sprint4-bed.test.ts` (88 ca `rbac-cases.json` của 8 operation, 401 dùng phiên THẬT của loại kia). Đề xuất E2E A7: KPI 6/9, "Cần chú ý" theo vai, SSE mất/nối lại; T6: giờ trực 06:59/07:00/21:59/22:00, phí dọn lần 2 trong ngày, tên phòng không lộ số căn. DS-E nên có tên phòng BL 4.1 (`room.name`) để demo thấy `roomName`.
### 2.7b MOB (guest-web H23) – dùng `listGuestRequestOptions` để hiện loại/phí, gửi `feeAccepted: true` khi `feeVnd > 0`; đọc `roomName`/`publicRoomType` (không còn `roomNo`); `autoReply` nay có (vắng khi gửi trong giờ trực). Ngôn ngữ: dùng nguyên `locale` của phiên + `localeChosenByGuest` (P-S4-10, mục 1.7); nút ngôn ngữ gọi `setGuestLocale`.
### 2.7d QA – thêm: `guest-locale-s4-bed.test.ts` (3), `minibar-catalog-s4-bed.test.ts` (5), units +2 (`renderAutoReply`, `pickGuestLocale`), RBAC +33 ca (listItems/createItem/updateItem). S4-20: `withDevClockLock` – test mới nào ghi `dev_clock` phải dùng khóa này.
### 2.7c FE-B (hàng yêu cầu khách S30) – `listGuestRequests` + `transitionGuestRequest`; chip việc/phiếu theo `hkTaskId`/`workOrderId`; SSE `guest_request.changed`.
### 2.8 DATA – đối chiếu K-01…K-03 đêm nay, S1c với DS-0 (A7).

## 3. File tạo / sửa
**Tạo** (`product/services/api/`):
- `src/modules/reporting/reporting.module.ts`
- `src/modules/reporting/internal/dashboard.controller.ts`, `dashboard.service.ts`, `stay-lists.ts`, `tonight-kpi.ts`, `stay-actions.ts`, `attention-sources.ts`, `no-show-notices.ts`
- `src/modules/reporting/public/hold-reminder-job.ts`
- `test/be-d-s4-units.test.ts`, `test/integration/dashboard-s4-bed.test.ts`, `test/integration/rbac-sprint4-bed.test.ts`
- Mục 6: `src/db/migrations/0058_guest_request.sql`, `src/db/schema/guest-requests.ts`; `src/modules/guest-portal/internal/guest-requests.service.ts`, `guest-requests.controller.ts`, `guest-request-rules.ts`; `src/modules/guest-portal/public/guest-request-ports.ts`, `guest-request-status.port.ts`, `guest-request-jobs.ts`; `src/modules/reservations/public/guest-room-view.ts` (BE-A review); `scripts/gen-guest-request-copy.mjs` → `src/generated/guest-request-copy.ts`; `test/integration/guest-requests-s4-bed.test.ts`

**Sửa**:
- `src/modules/events/public/events.service.ts` (kind 0.3.7, allowlist, `attentionAudience`, `ATTENTION_SYSTEM_CLOSED`, `SSE_ROLE_FLOOR`, `publishSse`)
- `src/modules/events/internal/attention.service.ts` (lọc vai, sắp xếp, `resolve`), `events.controller.ts` (`resolveAttentionEvent`), `sse-hub.ts` (`matches` đóng an toàn)
- `src/modules/frontdesk/internal/attention-sources.ts` (`noShows` – ETA; BE-A review)
- `src/modules/feature-modules.ts` (+`ReportingModule`), `src/worker.ts` (+J2) – tệp dùng chung, đọc lại trước khi sửa
- `test/integration/frontdesk.test.ts` (ca Sprint 3: `reconcile_overdue` nay MGR+, FD không thấy)
- Mục 6: `src/db/migrations/meta/_journal.json` (+1 dòng `0058`), `src/db/schema/index.ts` (+export), `src/modules/guest-portal/guest-portal.module.ts` (đăng ký), `src/modules/guest-portal/internal/guest-portal.service.ts` (`getGuestStay`/`openSession`: tên phòng, ghim, Wi-Fi; `activeStay` public), `src/modules/platform/internal/parameter-rules.ts` (`property_map_url`), `src/modules/events/public/events.service.ts` (allowlist `guest_request_overdue`), `src/worker.ts` (+J10)
- `01-decisions/decision-log.md` (4 dòng BE-D)
- **Đợt 3 – tạo**: `src/db/migrations/0061_item_name_i18n.sql`; `src/modules/inventory/internal/items.service.ts`, `items.controller.ts`; `src/modules/guest-portal/internal/guest-request-lifecycle.ts`, `guest-locale.ts`; `test/helpers/dev-clock-lock.ts`; `test/integration/minibar-catalog-s4-bed.test.ts`, `test/integration/guest-locale-s4-bed.test.ts`
- **Đợt 3 – sửa**:
  - Migration, schema:
    - `src/db/migrations/0058_guest_request.sql` (+`guest_session.locale_chosen_at` + chỉ mục);
    - `src/db/migrations/meta/_journal.json` (+1 dòng `0061`);
    - `src/db/schema/inventory.ts` (`nameI18n`);
    - `src/db/schema/guest-portal.ts` (`localeChosenAt` + chỉ mục – tệp BE-C).
  - Module inventory: `src/modules/inventory/inventory.module.ts` (controller, service, audit entity `item`).
  - Module events, reporting:
    - `src/modules/events/public/events.service.ts` (`attentionHistory`, `resolveAttentionById`);
    - `src/modules/reporting/reporting.module.ts` (danh sách bảng);
    - `src/modules/reporting/internal/no-show-notices.ts` (C2).
  - Module guest-portal:
    - `internal/guest-requests.service.ts` (`roomNo` null, dùng `GuestRequestLifecycle`, `renderAutoReply`);
    - `internal/guest-request-rules.ts` (`renderAutoReply`);
    - `internal/guest-portal.service.ts` (chọn ngôn ngữ, `setLocale`, `localeChosenByGuest`);
    - `public/guest-request-status.port.ts`;
    - `guest-portal.module.ts`;
    - `src/generated/guest-request-copy.ts` (sinh lại).
  - Test:
    - `test/module-boundaries.test.ts` (C6);
    - `test/be-d-s4-units.test.ts`;
    - `test/integration/guest-requests-s4-bed.test.ts`;
    - `test/integration/rbac-sprint4-bed.test.ts`;
    - `test/integration/platform.test.ts`, `test/integration/http-foundation.test.ts` (S4-20).
  - `01-decisions/decision-log.md` (+2 dòng BE-D).

- **Phản hồi & sửa (DOM v0.3.8)**:
  - Tạo: `test/integration/attention-dom-s4-bed.test.ts`.
  - Sửa mã:
    - `src/modules/frontdesk/internal/attention-sources.ts` (nhờ BE-A review);
    - `src/modules/reporting/internal/attention-sources.ts`;
    - `src/modules/guest-portal/internal/guest-request-rules.ts`, `guest-requests.service.ts`;
    - `src/modules/guest-portal/public/guest-request-jobs.ts`.
  - Sửa test: `test/be-d-s4-units.test.ts`, `test/integration/dashboard-s4-bed.test.ts`, `test/integration/guest-requests-s4-bed.test.ts`.
  - Ngoài api: `product/tests/fixtures/br-examples.json` (bỏ 5 `pendingFix`), `01-decisions/decision-log.md` (+1 dòng BE-D).

## 4. Kết quả lệnh
**Phản hồi & sửa** (17/10/2026 ~21:30, DB `ottimo_test_bed` tạo lại sau khi ORC sắp journal theo số):
| Lệnh | Kết quả |
|---|---|
| `vitest run` toàn bộ api | **67/77 tệp, 2603/2625 test xanh**. `schema-parity` nay xanh. **22 ca đỏ ở 10 tệp – không thuộc BE-D**: việc đang làm của luồng khác trên cây chung. 14 ca là 422 `applyDifference` `REQUIRED` (DOM-S4-06, BE-A), ví dụ `move-pricing`, `reservations`, `foc-keys-s4`, `foc-resync`, `folio-payments`. 2 ca là 409 `balance_paid` trước khi nhận phòng (DOM-S4-05). Còn lại: `payments-s3` (3), `sales` (1) |
| Tệp BE-D + liên quan (units, attention-dom, dashboard, guest-requests, module-boundaries, frontdesk) | 6 tệp, 85 test xanh; trong lần chạy toàn bộ cũng xanh |
| `validate-fixtures.mjs` | OK – 0 lỗi, 1 cảnh báo cũ (`ds-0.json` OTM-0108) |
| `tsc --noEmit`, `eslint`, `prettier --check` (tệp đã sửa, cả `br-examples.json`) | sạch |

**Đợt 3** (17/10/2026 ~20:20, Node 22.23, DB riêng `ottimo_test_bed`, script `scratchpad/bed-s4/` – chỉ nhận DB này):
| Lệnh | Kết quả |
|---|---|
| `vitest run` toàn bộ api (cây chung, có `HousekeepingModule`) | **72/73 tệp, 2596/2596 test xanh**. Đỏ đúng dự kiến: `schema-parity` (snapshot đầu phải là `0061_snapshot.json` – ORC sinh khi tích hợp). `registration-flow` nay xanh |
| `schema-parity` trên snapshot tạm sinh từ `.ts` (bản sao, `drizzle-kit generate`) | 6/6 xanh – SQL `0000…0061` khớp schema `.ts` |
| Tệp BE-D + liên quan | units 25, guest-locale 3, guest-requests 12, minibar 5, dashboard 17, rbac S4 122, module-boundaries, platform + http-foundation (3 lần liền), guest-portal (BE-C) – xanh (10 tệp, 237 test) |
| `tsc --noEmit` (api, gồm test) | 0 lỗi |
| `prettier --check`, `eslint` (tệp BE-D) | sạch |
| `gen-openapi-meta --check`, `gen-guest-request-copy --check` | up to date |

**Đợt 1–2** (~19:45): 66/68 tệp, 2389/2390 test xanh (đỏ đúng dự kiến `schema-parity`, `registration-flow` BUG-R2-083).

## 5. Giả định
- [GIẢ ĐỊNH BE-D – DOM xác nhận] tag VIP/Khách quen so không dấu: `vip`, `khach quen`, `returning`, `regular` (E00-06 chờ DOM); `vip_arrival` chỉ đơn còn `confirmed`.
- [GIẢ ĐỊNH BE-D – DOM xác nhận] đơn có giờ đến dự kiến còn ở phía trước không vào `no_show_call`/`no_show_mark` tới khi qua giờ đó.
- [GIẢ ĐỊNH BE-D] `foc_threshold`: FOC theo ngày dịch vụ (không có thì ngày ghi); số lần theo `decided_at`; doanh thu phòng = Σ `room_revenue_vnd` đêm `sold` từ ngày 1 tới hôm nay.
- [GIẢ ĐỊNH BE-D] `inHouse` đếm lượt ở (đơn chính); dòng khách đi dùng ngày đi hiệu lực.
- `denominatorNote` trả tiếng Việt như ví dụ hợp đồng (FE dùng chuỗi `today.kpi_occupancy_note`).
- [GIẢ ĐỊNH BE-D – OWN đổi ở Tham số] mặc định `property_map_url` = ghim INV 17/10 (R2 một cơ sở).
- [GIẢ ĐỊNH BE-D – DOM xác nhận] "lần dọn đầy đủ" cho BR-506 = việc `stayover_clean`/`long_stay_clean`/`adhoc_clean`/`priority_clean` hoặc việc của yêu cầu `extra_cleaning` đã `done` trong ngày nghiệp vụ, sau giờ nhận phòng; dọn trả phòng chuẩn bị căn không tính.
- [GIẢ ĐỊNH BE-D] Thông báo `guest_request_new`/`_overdue` gửi bộ phận + FD/FDL (không MGR/OWN); HK/MT được `complete` yêu cầu của mình khi không có việc/phiếu liên kết (cổng BE-C chưa gắn).
- [GIẢ ĐỊNH BE-D] Giới hạn 20 yêu cầu/ngày tính theo ngày nghiệp vụ; 3 yêu cầu có phí đang mở mới khóa loại có phí.
- [GIẢ ĐỊNH BE-D – ORC/UXD xác nhận] `phone_public` trống → `autoReply` bỏ câu "gọi {phone}", không dùng số dự phòng.
- [GIẢ ĐỊNH BE-D – ARC xác nhận] `updateItem` đổi `code` → 422 mã trường `NOT_EDITABLE` (mã mới trong tập mở); `item.name` = tên VI (rồi EN, RU) cho nhãn folio/bill.
- [GIẢ ĐỊNH BE-D] Lựa chọn ngôn ngữ của khách giữ cho mọi phiên sau của cùng đơn, kể cả khi lễ tân cấp lại link (phiên cũ bị thu hồi) – đúng ý "mở lại link, link cấp lại" của ARC 11.3 (8).
- Ghi vào `decision-log.md` (4 + 2 dòng BE-D).

## 6. Rủi ro / việc chưa xong
- EP14 chạy thật với buồng phòng/bảo trì khi BE-C gắn `GUEST_REQUEST_WORK_PORT` và đưa module `housekeeping` vào `feature-modules.ts`; tới đó yêu cầu HK/MT xử lý từ danh sách (đã test).
- `autoReply`: đã có (UXD 17/10). RU thiếu 5 khóa `guest.req.decline.*` (phía client).
- Snapshot `0061_snapshot.json` – ORC sinh khi tích hợp (tới đó `schema-parity` đỏ).
- Mapper lỗi chung đổi `.int()` thành `REQUIRED` (mục 2.5 #8) – chưa sửa (không phải tệp BE-D).
- Luật SEC B-15 chặn giá tiền trong `replyNote` – chờ SEC (mục 2.6).
- T13 (xóa `note` sau `retention.guest_request_months`) chưa làm – J16 phần R3.
- US-012 còn thiếu nguồn của vai khác: `work_order_high_open` (AC4) và `work_order_overdue`/`ooo_ending_work_open`/`room_status_mismatch` (BE-C, cần bảng `work_order`); `channel_sync_error` (AC7) cần J18 `outbox.dispatch` – **chưa có người làm** (ORC xếp sau, 17/10); `guest_request_overdue` – đã làm (mục 1.6).
- J4 "báo đỏ" bằng thông báo đẩy (BR-425 12:00/12:31) không làm – S4-31 BE-D chỉ phần thẻ (trạng thái `overdue` + xếp đầu); hợp đồng chưa có loại thông báo "quá giờ trả phòng" (chỉ `checkout_call_needed`).
- Hiệu năng: mỗi dòng danh sách gọi `FolioService.balance` (3 truy vấn) – với 10 căn ≈ 30–60 truy vấn/lần đọc, nằm trong p95 300 ms ở DS-E; R3 cần gộp nếu quy mô lớn.

---

## 7. Tuần Ổn định 18/10 – Phản hồi & sửa trước cổng QC Sprint 4 (ARC S4-07/08/09, A7-01 KPI, SEC BE-77)

- Vai: BE-D | Bước: **Phản hồi & sửa** | Đầu vào: `reviews/s4-ARC.md` (FB-R2-ARC-BE-S4-07, -08, -09; -11 phần test), `outputs/ARC/openapi-0.3.7.md` 16.19 (+ bổ sung 3), 16.21; `business-rules.md` BR-506; `outputs/DATA/s4-a7-reconciliation.md`; `reviews/s4-SEC.md` C.6 + FB-R2-SEC-BE-77. **Không commit, không chạy codegen.** Chỉ sửa module `guest-portal` (tệp EP14) + test; một khai báo interface tùy chọn ở `housekeeping/public` (ORC cho phép).
- DB riêng: `ottimo_test_bed_s4fix` (test của mục này), `ottimo_test_bed_s4full` (toàn bộ suite) – tạo bằng script có chặn tên `ottimo_test_bed_*` (scratchpad `bed-s4fix/newdb.sh`, env sinh từ env ORC bằng `sed`, không in giá trị).

### 7.1 S4-07 (Major, chạm tiền) – không thu phí BR-506 cho việc chưa làm
- **Quy tắc mới** (`guest-request-lifecycle.ts` đầu tệp):
  - Yêu cầu **có việc HK / phiếu liên kết**: phí chỉ ghi folio khi **việc đó `done`** (`linkedDone`). `complete` của lễ tân **không bao giờ** ghi phí, dù việc còn `open` hay đã `cancelled`.
  - Lễ tân đóng yêu cầu trước rồi HK mới dọn xong → phí vẫn ghi **một lần** lúc việc `done` (`linkedDone` nay ghi phí cả khi yêu cầu đã `done`, trừ khi `declined`).
  - Yêu cầu **không có việc liên kết** (cổng chưa gắn, khách gửi lúc chưa có căn): `complete` ghi phí như cũ (ARC "giữ ghi phí ở complete chỉ khi không có việc liên kết").
  - `decline` nhận thêm `in_progress` **khi việc liên kết đã `cancelled`**. Trạng thái việc đọc qua cổng `taskStatus` – BE-D đề xuất (khai `taskStatus?` tùy chọn ở `housekeeping/public/guest-request-work.port.ts`), **BE-C đã cài trong adapter** (cây làm việc 18/10, chưa commit). Cổng nào thiếu `taskStatus` thì yêu cầu đó chỉ `complete` được, **không phí** – an toàn tiền (có ca test riêng).
  - Không thêm mã lỗi mới (không đổi hợp đồng): lễ tân `complete` sau khi HK xong → 409 `INVALID_TRANSITION` như cũ.
- Ghi chú: hôm nay **không đường nào** hủy việc `guest_request` đang `in_progress` (hủy tay chỉ từ `open`; J8 `day_ended` và OOO bỏ qua loại `guest_request`). Ca (b) dựng trạng thái này bằng SQL để phủ đường tương lai (ARC nêu "khối OOO").

### 7.2 S4-08 (Major) – thứ tự khóa theo 16.19 bổ sung 3
| Lệnh | Trước | Sau |
|---|---|---|
| FD `decline` | `guest_request` → `hk_task` (ngược chiều HK → 40P01) | đọc không khóa → `cancelTask` (L4 `hk_task`) → `guest_request` (L4b) → kiểm lại trạng thái |
| FD `complete`, có việc liên kết | `guest_request` → folio | chỉ `guest_request` (L4b) – không ghi phí nên không cần L3 |
| FD/HK `complete`, không việc liên kết, có phí | `guest_request` → folio | folio (L3, `lockFeeFolio`) → `guest_request` (L4b) → ghi dòng |
| HK xong việc có phí (BE-C) | `hk_task` → `guest_request` → folio | BE-C gọi `GuestRequestStatusPort.lockForFee` (**BE-D đã cài**) trước khi khóa việc → folio → `hk_task` → `guest_request` |
- `lockForFee`: đọc yêu cầu **không khóa** (`fee_vnd_snapshot` bất biến; `fee_folio_line_id`, `declined` chỉ đi một chiều) → còn phí phải ghi thì `FolioService.lock` folio của đơn; không phí / đã ghi / đã từ chối / id lạ → không khóa gì.
- Dòng yêu cầu chỉ **UPDATE một lần** mỗi giao dịch (trạng thái + `fee_folio_line_id` cùng câu; `postFee` đổi thành `postFeeLine` trả id dòng). Lý do: chạy bản cũ trên ca đua ép xen, log PostgreSQL cho thấy deadlock tại câu UPDATE lần hai của chính dòng đang có phiên khác chờ.
- **Lệch nhỏ so với chữ của 16.19 bổ sung 3 (ARC xem):** `decline` **không** lấy folio. `decline` không ghi tiền, nên không cần L3. Nếu lấy folio trước `hk_task` thì còn deadlock với đường HK chưa gọi `lockForFee`. Thứ tự L3 → L4 → L4b vẫn giữ: lệnh nào lấy folio thì lấy trước.

### 7.3 S4-09 (Major, phần tiền) – phí "dọn đầy đủ lần hai" đọc qua cổng
- `GuestRequestsService.lastFullClean` gọi `GUEST_REQUEST_WORK_PORT.lastFullCleanAt(tx, {roomId, since, until, fullCleanRequestIds})`. Chữ ký này BE-C đã thêm trong cùng tuần (cây làm việc, chưa commit). BE-D truyền id các yêu cầu `extra_cleaning` của **chính đơn** trong căn đó. Housekeeping quyết theo loại việc (`FULL_CLEAN_TASK_TYPES` chuyển sang `housekeeping/public`). guest-portal không còn đọc `hk_task`.
- Đơn dài hạn không gọi cổng nữa: đơn dài hạn luôn tính phí, không cần biết lần dọn trước.
- `SELECT code FROM reservation` (mã đơn cho audit tiền) đổi sang `reservations/public/read-port.readStayInfo`.
- Test ranh giới mới `test/guest-portal-boundaries.test.ts`:
  - guest-portal không `FROM`/`JOIN` bảng `hk_task`, `reservation*`, `stay_night`, `folio*`, `payment`;
  - không ghi bảng của module khác;
  - mọi bảng đọc thẳng còn lại phải nằm trong danh sách. Còn `room` và `property`, để R3 Sprint 1 như ARC cho phép.
- Viết riêng tệp, không sửa khối `module-boundaries.test.ts`, để tránh đụng BE-C đang sửa song song.

### 7.4 A7-01 – ca KPI dùng đơn AC5a (ORC giao thêm, ARC 16.21)
- `test/integration/kpi-ac5a-s4-bed.test.ts`: dựng bố cục DS-0 theo căn qua API thật:
  - 301, 102 là đơn dài hạn nhập tay `manualLongStay`, đã nhận phòng;
  - 101, 402 đang ở; 103, 302 đến 15/10; 202 đến 16/10;
  - 401 OOO [15/10, 17/10).
- Oracle: đêm 15/10 **6/9 = 66,7 %**, cả lúc 08:00 và 02:00 ngày 16/10 (BR-010); đêm 16/10 **7/9 = 77,8 %**. Thêm ca tiền đề: mỗi đơn AC5a có đêm `sold` 15/10 và 16/10 đúng căn.
- **Công thức K-02/K-03 không đổi.**
- Đã kiểm hai phía:
  - trên **HEAD `7ac11a4`** (xuất `git archive`): ca **đỏ** đúng như DATA (4 căn, 44,4 %; không có đêm cho 301/102);
  - trên **cây làm việc** (có bản sửa A7-01 chưa commit của BE-A): **xanh**.
- Đầu tệp ghi rõ: "đỏ cho tới khi BE-A gộp; không sửa số kỳ vọng hay công thức".

### 7.5 SEC FB-R2-SEC-BE-77 (Minor) – luật B-15 phương án V2 (C.6)
- `hasSensitiveDigits(text, publicPhone, currentYear)` cài đúng C.6:
  - Luhn trước, như cũ;
  - kiểm trên chuỗi đã NFKC;
  - thay bằng `|` các token **ngày** hợp lệ trong ±1 năm của năm cơ sở, và **tiền VND có đơn vị** (chữ số đầu 1–9, cùng một dấu nhóm, ≤ 10 chữ số, từ 6 chữ số phải tận cùng `000`);
  - bỏ dấu phân cách `[\s.,\-_+()]` và gạch Unicode, giữ `/`;
  - chặn `\p{Nd}{6,}`; ngoại lệ hotline giữ như cũ.
- **Siết thêm** so với C.6 (chỉ chặn nhiều hơn): token tiền hoặc ngày không được là đuôi của một số nhóm dài hơn. Ví dụ `0912.345.000đ` vẫn bị chặn.
- Năm cơ sở lấy từ ngày nghiệp vụ.
- Có đủ ca bắt buộc của C.6: 13 ca không chặn, 22 ca chặn, 7 ca chặn nhầm SEC chấp nhận, cộng ca cửa sổ năm (`be-d-s4-units`). Thêm ca HTTP (từ chối/hoàn tất có `replyNote`).
- **Chưa làm phần `hasLongDigitRun`** (`registration/internal/rules.ts:550`: thêm `,` + NFKC). Tệp này thuộc module registration của BE-C, ORC dặn chỉ sửa module của mình. Cần ORC giao BE-C, hoặc cho phép BE-D sửa 2 dòng.
- Đồng bộ cùng PR theo C.6 (việc của vai khác):
  - FE-B: mock `admin-web/src/mocks/ops.ts:557-566`;
  - ARC: mô tả `openapi.yaml:281, :7538` và api-client;
  - BA: EP14 4.4 và E14-11;
  - UXD: câu nhắc "Ghi giá kèm đ/VND, ví dụ 350.000 đ".

### 7.5b SEC bổ sung 18/10 (C.6, s6/s7) – ORC giao
- **(s6) Giữ nguyên.** Đuôi của số nhóm dài hơn không được coi là tiền hay ngày, nên `0912.345.000đ` vẫn bị chặn.
- **(s7) Đã nới hẹp.** Sau bước thay token, dấu phẩy hoặc chấm phẩy **có khoảng trắng phía sau** (`/[,;]\s+/gu`) được thay bằng `|`, tức ranh giới danh sách.
  - Không chặn: `Phòng 202, 203, 204`, `Phòng 202; 203`.
  - Vẫn chặn: `Phòng 202,203,204`, `Phòng 202 203 204`, `Mã cửa 482,913`.
- **Phạm vi:** B-15 chỉ áp cho `replyNote` của nhân viên. Ca HTTP xác nhận ghi chú khách tự gõ có chuỗi số dài vẫn nhận (201), vì chỉ kiểm Luhn.
- `hasLongDigitRun` **không** nới (BE-C làm phần `,` và NFKC).
- Test: 5 ca SEC trong `be-d-s4-units`, cộng ca HTTP ở `guest-requests-s4-fix-bed`. 56/56 xanh; `tsc`, eslint sạch.

### 7.6 Test
- `test/integration/guest-requests-s4-fix-bed.test.ts` (13 ca, mới). Dùng **cổng BE-C thật** (`GuestRequestWorkAdapter` → `HousekeepingService`) và `GuestRequestStatusPort` thật; ứng với ARC S4-11 cho thẻ 07/08.
  - S4-09: dọn gấp chuẩn bị căn và việc khăn tắm (`amenities`) không tính; việc "Dọn thêm" HK làm xong lúc 10:00 thì tính → lần dọn sau 100.000, mốc `10:00`.
  - S4-07:
    - (a) lễ tân hủy việc → `complete` không phí;
    - `complete` khi việc còn `open` → không phí, việc bị hủy sau đó → vẫn không;
    - lễ tân đóng trước, HK dọn xong sau → đúng 1 dòng;
    - (c) HK xong → 1 dòng, lễ tân `complete` → 409, vẫn 1 dòng;
    - (b) `in_progress` + việc đã hủy: có `taskStatus` → `decline` 200; không có → 409 và `complete` không phí; việc đang làm thật → `decline` 409;
    - yêu cầu không có việc liên kết → `complete` ghi 1 dòng, `complete` lần hai 409.
  - S4-08, ba cặp, mỗi cặp **2 đối chứng tuần tự + 2 lượt ép xen** (một phiên giữ dòng yêu cầu; lệnh thứ nhất xếp hàng trên dòng đó, lệnh thứ hai xếp sau lệnh thứ nhất; kiểm `pg_blocking_pids` = [1, 2], không lệnh nào trả lời khi còn bị giữ):
    - `decline ‖ HK complete` (có phí);
    - `decline ‖ HK start`;
    - `FD complete ‖ HK complete` (có phí).
    - Oracle: mã trả lời giống hệt chạy tuần tự, trạng thái yêu cầu/việc, số dòng `adhoc_cleaning` (mỗi yêu cầu đúng 1 dòng 100.000 khi việc xong, 0 khi bị từ chối/hủy). Không có `409 CONCURRENT_UPDATE` (40P01 / lock timeout).
  - `lockForFee`: khóa folio khi còn phí (phiên khác `FOR UPDATE NOWAIT` → 55P03). Không khóa khi yêu cầu miễn phí, đã ghi phí, đã từ chối, hoặc id lạ.
  - BE-77 qua HTTP: `replyNote` có ngày sinh / mã cửa kèm `đ` / SĐT / chữ số toàn khổ → 422 `SENSITIVE_DATA_DETECTED`; giá kèm đơn vị và ngày gần → 200, khách đọc được.
- **Bằng chứng ca test bắt được lỗi cũ.** Cùng tệp test chạy trên bản sao cây làm việc, thay 5 tệp guest-portal bằng HEAD: **8/12 ca đỏ**, gồm:
  - ép xen `decline ‖ HK start` và `FD complete ‖ HK complete` → `409 CONCURRENT_UPDATE`; log PostgreSQL ghi `deadlock detected` (`guest_request FOR UPDATE` ↔ `hk_task FOR UPDATE`);
  - các ca tiền S4-07 → ghi phí khi việc đã hủy hoặc còn `open`.
- `test/integration/kpi-ac5a-s4-bed.test.ts` (3), `test/guest-portal-boundaries.test.ts` (3).
- Sửa test:
  - `be-d-s4-units` (B-15 V2; BR-506-03 đọc `FULL_CLEAN_TASK_TYPES` từ housekeeping);
  - `guest-requests-s4-bed` (cổng giả chuyển `lastFullCleanAt` sang adapter thật).
- Chạy lặp 3 lần nhóm test EP14: xanh cả 3.
- `tsc --noEmit` sạch; eslint và prettier sạch trên các tệp của mục 7.
- **Toàn bộ suite api** trên DB mới `ottimo_test_bed_s4full` (cây làm việc 18/10 ~09:40): 97 tệp, **2880 đạt / 11 đỏ / 2 bỏ qua**.
  - 11 ca đỏ nằm ở 4 tệp, **không thuộc EP14**: `schema-parity` (CHECK `guest_id_doc_last4_consent_check`, `guest_document_booker_uk` thiếu trong SQL), `guest-document-profiles`, `registration-flow`, `registration-party-removal`.
  - Nguyên nhân: cùng lúc đó migration `0070_be73_guest_doc_person.sql` chưa xong (BE-73, nhóm D) và module registration đang được sửa song song. Mọi tệp của BE-D đều xanh.

### 7.7 Giả định cần DOM / ARC xác nhận
- **(s1) DOM – BR-506:** phí theo **việc HK đã làm**, không theo lúc lễ tân đóng yêu cầu.
  - Lễ tân đóng yêu cầu khi việc còn `open`, sau đó HK dọn xong → vẫn thu (khách đã đồng ý phí).
  - Việc bị hủy → không thu, dù yêu cầu đóng bằng `complete` hay `decline`.
  - BR-506 chỉ ghi "ghi folio tự động khi việc `done`", chưa nói tới hai trường hợp này.
- **(s2) DOM:** yêu cầu có phí **không có việc liên kết** (cổng chưa gắn / gửi lúc chưa có căn) thì thu lúc lễ tân/HK bấm `complete`. Đây là cách cũ, ARC đã đồng ý giữ.
- **(s3) ARC:** `decline` không lấy folio (lệch chữ 16.19 bổ sung 3, lý do ở 7.2). `complete` có việc liên kết chỉ lấy L4b.
- **(s4) ARC/BE-C:** chữ ký đề xuất `taskStatus?(tx, hkTaskId): Promise<string | null>` trên `GuestRequestWorkPort` (BE-C cài trong adapter; gọi sau `cancelTask`, khi việc đang bị giữ khóa). Khi có, `decline` từ `in_progress` nhận trong trường hợp việc đã hủy.
- **(s5) ARC/BA:** SM-15 và EP14 4.4 thêm cạnh `in_progress → declined` khi việc liên kết đã hủy (ARC đề xuất trong thẻ 07).
- **(s6), (s7) SEC:** đã chốt và đã cài – xem 7.5b.

### 7.8 Việc cho vai khác
- **BE-C:**
  - `taskStatus` trong `GuestRequestWorkAdapter` và việc bỏ lớp `FeeLockingStatusPort` trong `housekeeping-s4-arc.test.ts`: **BE-C đã làm** trên cây làm việc (kiểm 09:45; `housekeeping-s4-arc` xanh cùng mã BE-D);
  - `hasLongDigitRun` (BE-77 phần registration), nếu ORC giao.
- **FE-B / ARC / BA / UXD:** đồng bộ B-15 V2 như 7.5.
- **QA:** chạy lại A7 sau khi BE-A gộp. Ca đua EP14 có trong `guest-requests-s4-fix-bed`.

### 7.9 Phản hồi thẻ
| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R2-ARC-BE-S4-07 | Done | 7.1; giả định s1, s2 chờ DOM; `decline` từ `in_progress` dùng `taskStatus` – BE-C đã cài (cây làm việc), ARC xác nhận chữ ký (s4) |
| FB-R2-ARC-BE-S4-08 | Done (phần BE-D) | 7.2; `lockForFee` đã cài, BE-C đã gọi (cây làm việc); lệch s3 chờ ARC |
| FB-R2-ARC-BE-S4-09 | Done (phần tiền) | 7.3; `room`/`property` đọc thẳng dời R3 Sprint 1 như ARC cho phép |
| FB-R2-ARC-BE-S4-11 | Done một phần | Thẻ 07/08 chạy trên adapter thật; tệp cũ giữ cổng giả cho ca "cổng chưa gắn" |
| FB-R2-SEC-BE-77 | Done (phần `replyNote`) | 7.5; `hasLongDigitRun` chờ ORC giao (module BE-C) |
| A7-01 (DATA) – phần BE-D | Done | 7.4; ca đỏ ở HEAD, xanh khi có bản sửa BE-A |

### 7.10 Tệp tạo / sửa (mục 7)
- Sửa:
  - `services/api/src/modules/guest-portal/internal/guest-requests.service.ts`
  - `services/api/src/modules/guest-portal/internal/guest-request-lifecycle.ts`
  - `services/api/src/modules/guest-portal/internal/guest-request-rules.ts`
  - `services/api/src/modules/guest-portal/public/guest-request-ports.ts`
  - `services/api/src/modules/guest-portal/public/guest-request-status.port.ts`
  - `services/api/src/modules/housekeeping/public/guest-request-work.port.ts` (chỉ thêm `taskStatus?`)
  - `services/api/test/be-d-s4-units.test.ts`
  - `services/api/test/integration/guest-requests-s4-bed.test.ts`
- Tạo:
  - `services/api/test/integration/guest-requests-s4-fix-bed.test.ts`
  - `services/api/test/integration/kpi-ac5a-s4-bed.test.ts`
  - `services/api/test/guest-portal-boundaries.test.ts`

### 7.11 ARC 16.27 / BR-525 – FOC `debt_write_off` ra khỏi cảnh báo BR-435 (ORC giao 18/10)
- `reporting/internal/attention-sources.ts` `focThreshold`: FOC có lý do `debt_write_off` (xóa công nợ sau trả phòng) **không** tính vào:
  - (a) giá trị giảm so với `foc_alert_pct_of_room_revenue`. Bỏ cả dòng FOC và dòng đảo của nó, nhận theo `approval_request.reason_code` của dòng gốc;
  - (b) số lần duyệt của mỗi người duyệt.
- **Báo cáo FOC** (tách riêng mã này) **không thuộc module của BE-D**. R2 chưa có endpoint báo cáo FOC K-18; danh sách `/approvals?type=foc` là của BE-B. ARC 16.27 giao phần này cho BE-B và DATA.
- Test `test/integration/foc-debt-write-off-s4-bed.test.ts` (2 ca):
  - X = 100.000 `service_recovery` dưới 15 %, 1 lần duyệt → không có dòng cảnh báo;
  - thêm W = 400.000 → có cả dòng giá trị và dòng số lần;
  - W đổi lý do thành `debt_write_off` → không còn dòng nào;
  - ở mức 5 %: dòng giá trị quay lại với pct = X / R.
- Đổi lý do của W bằng vai `ottimo_owner`, vì vai app không có quyền UPDATE `reason_code`; đường xóa nợ thật của BE-B cần folio có công nợ. `dashboard-s4-bed`, `be-d-s4-units`, `module-boundaries` xanh; `tsc` sạch.
- **Câu hỏi cho DATA/DOM:** mẫu số K-06 là doanh thu phòng **thực** (Σ `stay_night.room_revenue_vnd`, đã trừ FOC gắn đêm). Nếu đường xóa nợ của BE-B cũng trừ vào `stay_night`, mẫu số nhỏ đi nên tỷ lệ FOC vẫn bị phồng nhẹ. Có cần cộng lại phần xóa nợ vào mẫu số không? BE-D chưa đổi.
