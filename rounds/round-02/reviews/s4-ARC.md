# ARC review mã Sprint 4 – module `housekeeping` (BE-C, 0056) · EP14 (BE-D)

- Người review: ARC | Round 2 – Sprint 4, tuần Ổn định, bước Review trước cổng QC (G3.3 `qc/s4-gate-readiness.md`) | Ngày: 18/10/2026 | HEAD `7ac11a4`
- Phạm vi:
  - **A. Housekeeping (BE-C)**: `services/api/src/modules/housekeeping/**` (`housekeeping.module.ts`, `internal/housekeeping.service.ts`, `internal/rules.ts`, `internal/work-orders.service.ts`, `internal/attention-sources.ts`, `public/room-status.service.ts`, `public/worker-jobs.ts`, `public/stay-arrival.ts`, các cổng), migration `0056`, `test/integration/housekeeping-s4.test.ts`, `test/module-boundaries.test.ts`.
  - **B. EP14 (BE-D)** – app khách mức 1: US-108 (`getGuestStay`/`openGuestSession`: tên phòng, bản đồ, Wi-Fi theo ngày nghiệp vụ), US-109 (`listGuestRequestOptions`, `createGuestRequest`, `listMyRequests`), US-110 (`listGuestRequests`, `transitionGuestRequest`, J10 `guest_request.sla`, "Cần chú ý" `guest_request_overdue`), P-S4-10 (`setGuestLocale`). Mã: `guest-portal/internal/{guest-requests.service,guest-requests.controller,guest-request-rules,guest-request-lifecycle,guest-locale,guest-portal.service}.ts`, `guest-portal/public/{guest-request-ports,guest-request-status.port,guest-request-jobs}.ts`, `reservations/public/guest-room-view.ts`; migration `0058_guest_request.sql`; test `test/integration/guest-requests-s4-bed.test.ts`.
  - Đối chiếu: OpenAPI 0.3.7, `erd.md`, `architecture.md` 5.1, `business-rules.md` mục 10 (BR-801…812), `outputs/ARC/s3-contract.md` 4.2/4.3, **thứ tự khóa 16.19** (`outputs/ARC/openapi-0.3.7.md`).
- Cách làm: ARC chia đọc sâu cho hai lượt đọc song song (chỉ đọc), rồi **tự mở mã kiểm lại mọi thẻ Blocker/Major** ở HEAD (dòng trích dẫn đúng ở `7ac11a4`). Không chạy test DB.
- Kết quả cũng ghi kèm vào `s3-ARC.md` (đối chiếu ĐK-S3-5, mục "Đối chiếu tại HEAD 7ac11a4").

## A. Module `housekeeping` (BE-C, migration 0056)

### FB-R2-ARC-BE-S4-01
- Mức độ: **Major**
- Vị trí: `public/room-status.service.ts:99-104` (`since = input.now` – giờ server); `internal/housekeeping.service.ts:396-401` (`transitionRoomStatus`) và `:1117-1118` (`recordInspection`) kiểm `performedAt < current.since`; lời gọi `rooms.set(… now: c.now …)` ở `:427-430`, `:1174`.
- Vấn đề:
  - `room_status.since` ghi **giờ server lúc nhận lệnh**, còn lệnh sau lại bị từ chối nếu `performedAt` (giờ máy, hàng đợi offline) sớm hơn `since`.
  - Hàng đợi offline có từ hai bước trên cùng căn luôn hỏng: "Bắt đầu dọn" 10:00 và "Dọn xong" 10:30 cùng đồng bộ lúc 11:00 → lệnh 1 đặt `since = 11:00` → lệnh 2 (`performedAt` 10:30) 422 `PERFORMED_AT_OUT_OF_RANGE`. Chuỗi "dọn xong → tự kiểm" offline cũng vậy.
  - Ca US-058 hiện có dựng sẵn `CL` bằng SQL nên không bắt được (`housekeeping-s4.test.ts` ~1154-1215).
- Vì sao quan trọng: US-058 / SR-PWA-05 là luồng chính của HK khi mất mạng; căn kẹt `CL`, lễ tân không thấy căn sạch để giao.
- Đề xuất sửa: so `performedAt` với mốc **cùng hệ giờ máy** – lưu `room_status.last_performed_at` (hoặc lấy `performed_at` của dòng SM-03 cuối) và kiểm `performedAt ≥ last_performed_at`; `since` vẫn là giờ server để hiển thị. Thứ tự giờ xử lý giữ nguyên bằng `expectedFrom`. Test tích hợp: căn `VD`, gửi `start_cleaning` (now−60'), `finish_cleaning` (now−30'), `recordInspection` (now−20') cùng lúc → 200/200/201, căn `VI`, lịch sử giữ giờ máy.
- Trạng thái: Open – **BE-C**

### FB-R2-ARC-BE-S4-02
- Mức độ: **Major**
- Vị trí: `internal/housekeeping.service.ts:394`, `:1113` (`SELECT 1 FROM room … FOR UPDATE`); `:414-421` (`body.taskId` nhận việc bất kỳ của căn); hoàn tất việc `guest_request` → `guestRequests.onLinkedWorkDone` (`:937-943`) → `guest-portal/internal/guest-request-lifecycle.ts:91-110` `postFee` → `FolioService.postLines` (khóa folio).
- Vấn đề – lệch thứ tự khóa toàn hệ thống (16.19, "khác bảng → sửa mã"):
  - (a) `transitionRoomStatus`/`recordInspection` giữ `room FOR UPDATE` (L2) rồi khóa `hk_task` (L4) **không** `NOWAIT`. Ngoại lệ E2 của 16.19 dựa trên tiền đề "mọi bên giữ `room FOR UPDATE` chỉ chạm việc bằng `NOWAIT`". Với `taskId` = việc `minibar_refill` (không bị giới hạn loại), lệnh này giữ căn và chờ việc, trong khi `setTaskStatus` → `onRefillDone` giữ việc và chờ `KEY SHARE` căn → 40P01.
  - (b) HK xong việc `guest_request` có phí BR-506: giữ `hk_task` (L4) rồi mới khóa folio (L3) để ghi phí – chiều L4 → L3, không phải ngoại lệ có tên.
- Vì sao quan trọng: 16.19 là nguồn duy nhất chống deadlock; mỗi đường lệch là một bề mặt mới (bài học K11-01/K11-04). Hôm nay hậu quả là 409 `CONCURRENT_UPDATE` (giao dịch hủy cả gói, không sai tiền), nhưng đường nào sau này khóa folio rồi chờ `hk_task` sẽ deadlock.
- Đề xuất sửa: (1) đổi hai chỗ khóa căn sang `FOR KEY SHARE` (hoặc khóa `room_status` – bảng của housekeeping); (2) giới hạn `taskId` ở `CLEAN_TYPES` (422 `NOT_IN_LIST`); (3) việc có `guest_request_id`: lấy folio của đơn (L3) **trước** khi khóa `hk_task` – qua cổng `GuestRequestStatusPort` thêm `lockForFee(tx, guestRequestId)` gọi trước `taskById(…, true)`. ARC **không** thêm ngoại lệ mới vào 16.19. Test: HK hoàn tất việc `guest_request` có phí ‖ B18 cùng đơn, ép cả hai thứ tự → không 40P01, phí ghi đúng một lần hoặc B18 409 `PENDING`/`BALANCE_DUE` như tuần tự; HK `finish_cleaning` với `taskId` của việc `minibar_refill` → 422.
- Trạng thái: Open – **BE-C** (+ **BE-D** cổng `lockForFee` phía guest-portal)

### FB-R2-ARC-BE-S4-03
- Mức độ: **Major**
- Vị trí: đọc thẳng bảng của module khác – `internal/housekeeping.service.ts:124`, `:309-314` (`inHouseByRoom`), `:341-346` (`guest.full_name`, `guest.service_notes`, `guest.tags`), `:623-627`, `:1043`; `public/room-status.service.ts:42-48`, `:133`, `:154`; `public/worker-jobs.ts:112-122`, `:262-266`, `:329`; `public/stay-arrival.ts:11-16`; `internal/attention-sources.ts:116`, `:146`; `internal/work-orders.service.ts:341`.
- Vấn đề:
  - Housekeeping `SELECT` thẳng `reservation`, `reservation_segment`, `room_block` (reservations) và `guest` (guests – dữ liệu cá nhân). `architecture.md` 5.1 chỉ cho `reporting` đọc thẳng (danh sách khai báo + test); C5 cấm đọc thẳng bảng dữ liệu cá nhân của module khác; `s3-contract.md` 4.3 "không gọi thẳng bảng của vùng khác". `module-boundaries.test.ts` chỉ bắt import nên lọt CI.
  - Định nghĩa "khách đang ở" đã lệch thật giữa hai chỗ của chính module: `inHouseByRoom` dùng `to_date >= today` (`housekeeping.service.ts:313`), `RoomStatusService` dùng `to_date > today` (`room-status.service.ts:48`, `:135`, `:156`).
- Vì sao quan trọng: quy tắc lượt ở/ngày đến/khối OOO bị cài lại ở module thứ hai (đúng loại lỗi J8 BUG-R2-142/151 vừa gặp); dữ liệu khách ra khỏi module chủ không qua lọc trường.
- Đề xuất sửa: **BE-A** expose cổng đọc `reservations/public/stay-occupancy.port.ts` (`inHouseByRoom(tx, date)`, `arrivalsByRoom(tx, date)`, `stayArrival(tx, reservationId)`, `activeBlocks(tx, date)` – một định nghĩa "đang ở" dùng chung với J8); **BE-B** (guests) expose `displayName`, `serviceNotes`, cờ VIP (không trả `tags` thô); **BE-C** chuyển các truy vấn trên sang cổng. Nếu cần giữ SQL gộp vì hiệu năng, ARC khai `HOUSEKEEPING_READ_TABLES` (như `reporting`) và mở rộng `module-boundaries.test.ts` dò SQL bảng ngoài vùng. Test kiến trúc + ca parity "khách ở ngày đi" giữa hai nguồn. **Mức thời gian**: sửa định nghĩa "đang ở" (lệch `>=`/`>`) trong tuần Ổn định; chuyển sang cổng có thể R3 Sprint 1 nếu cổng QC đồng ý (không chạm tiền).
- Trạng thái: Open – **BE-C** (+ **BE-A**, **BE-B** cổng)

### FB-R2-ARC-BE-S4-04
- Mức độ: Minor
- Vị trí: `public/worker-jobs.ts:133-136` (J8 đọc `rooms.of` không khóa rồi `rooms.set(… 'OD')`); `public/room-status.service.ts:82-87` (`set` chỉ bỏ qua khi trạng thái đang lưu bằng đích).
- Vấn đề: HK kịp chuyển `OC → OD → CL` giữa hai lệnh thì J8 ghi đè `CL` thành `OD` (cửa sổ vài ms lúc 07:00). Cùng mẫu ở R5 (`statusOf` `:497`).
- Vì sao quan trọng: căn đang dọn hiện "cần dọn", lịch sử SM-03 sai.
- Đề xuất sửa: `RoomStatusService.set` nhận `expectedFrom?`, kiểm sau `FOR UPDATE`, lệch thì không ghi; J8 truyền `'OC'`, R5 truyền `'VI'`. Test giả lập trạng thái đổi giữa `of` và `set`.
- Trạng thái: Open – BE-C

### FB-R2-ARC-BE-S4-05
- Mức độ: Minor
- Vị trí: `internal/housekeeping.service.ts:1001-1004` (`transitionHkTask` chỉ kiểm khoảng [−24 giờ, +5 phút]).
- Vấn đề: `complete` mang `performedAt` sớm hơn `started_at` vẫn được nhận → `done_at < started_at`.
- Vì sao quan trọng: thời lượng dọn và báo cáo năng suất HK sai; lịch sử SM-14 không đơn điệu.
- Đề xuất sửa: `complete` với `performedAt < started_at` → 422 `PERFORMED_AT_OUT_OF_RANGE` (cùng hệ giờ máy với thẻ 01). Test start (now−10') rồi complete (now−30') → 422.
- Trạng thái: Open – BE-C

### FB-R2-ARC-BE-S4-06
- Mức độ: Minor (thiếu test)
- Vị trí: `test/integration/housekeeping-s4.test.ts` (ca US-058 ~1154-1215; J8).
- Vấn đề: chưa có ca phát lại cả chuỗi hàng đợi offline (start → finish → inspect); chưa có ca J8 chạy lại trong ngày sau khi HK hủy `stayover_clean` (`dnd`/`guest_refused`) – `hk_task_clean_uk` chỉ phủ `open`/`in_progress`, nên chống sinh lại dựa vào job runner; chưa có ca thứ tự khóa (thẻ 02).
- Vì sao quan trọng: thẻ 01, 02 lọt CI vì các khoảng trống này.
- Đề xuất sửa: thêm ba ca trên; J8 gọi hai lần cùng ngày nghiệp vụ sau khi hủy `dnd` → không sinh lại việc, không đổi lại `OC → OD`.
- Trạng thái: Open – BE-C

**Làm tốt (giữ)**: luật thuần tách ở `rules.ts` (`roomTarget`, `allowedEvents`, `woAllowedActions`, `priorityRank`, `linenChangeDue`) có unit test trạng thái × vai, `allowedEvents` do server tính; 0056 – ba bảng mới `ENABLE` + `FORCE RLS`, policy có `WITH CHECK`, `inspection` chỉ `GRANT SELECT, INSERT` (chỉ-thêm), đủ CHECK trạng thái/mức/loại/ảnh/ghi chú; không `ModuleRef`, cổng đảo chiều `@Optional` (`GUEST_REQUEST_STATUS_PORT`, `MINIBAR_REFILL_DONE_PORT`) tránh vòng provider; tranh chấp hai HK xử lý đúng (`FOR UPDATE` + `expectedFrom` → 409 `currentState`), replay `Idempotency-Key` có test; job dùng ngày nghiệp vụ (`business_day_rollover`) và Clock của runner, J11 `SKIP LOCKED`, `stayover_clean` `ON CONFLICT DO NOTHING`; audit có allowlist, SSE chỉ mang id.

**Tổng A: 0 Blocker · 3 Major · 3 Minor.**

## B. EP14 – yêu cầu khách, phòng của khách, ngôn ngữ (BE-D, migration 0058)

### FB-R2-ARC-BE-S4-07
- Mức độ: **Major** (sai tiền – sửa trước cổng QC)
- Vị trí: `guest-portal/internal/guest-requests.service.ts:531-542` (`complete` của FD gọi `lifecycle.postFee` không xét việc liên kết); `guest-request-lifecycle.ts:80-84` (`linkedCancelled` giữ nguyên trạng thái yêu cầu), `:91-98` (`postFee` chỉ kiểm `fee_vnd_snapshot > 0` và `fee_folio_line_id`).
- Vấn đề: yêu cầu có phí (BR-506, ví dụ "Dọn thêm" 100.000) có việc HK liên kết bị **hủy** (khách từ chối dọn, khối OOO) → yêu cầu vẫn mở; EP14 4.4 bảo lễ tân "complete hoặc decline", nhưng `decline` chỉ nhận `new`/`acknowledged` (`:545`), nên yêu cầu đã `in_progress` chỉ còn `complete` → **chắc chắn ghi phí** cho dịch vụ không làm. Lễ tân bấm `complete` khi việc còn `open` cũng ghi phí trước khi dọn; việc bị hủy sau đó thì phí vẫn nằm trên folio.
- Vì sao quan trọng: BR-506 "ghi folio **tự động khi việc `done`**" – thu tiền khách cho việc chưa làm, không có tín hiệu nào báo lễ tân đảo dòng.
- Đề xuất sửa: yêu cầu có `hk_task_id`/`work_order_id` chỉ ghi phí ở `linkedDone`; `complete` của FD **không** ghi phí khi có việc liên kết (thêm `taskStatus(tx, hkTaskId)` vào `GUEST_REQUEST_WORK_PORT` nếu cần hiển thị). Cho `decline` nhận cả `in_progress` khi việc liên kết đã `cancelled`. Giữ ghi phí ở `complete` chỉ khi **không** có việc liên kết. Test (adapter BE-C thật): (a) có phí → HK hủy việc → FD `complete` → folio không có dòng `adhoc_cleaning`, `fee_folio_line_id` NULL; (b) việc `in_progress` bị hủy → FD `decline` được; (c) HK `done` rồi FD `complete` → đúng 1 dòng.
- Trạng thái: Open – **BE-D**

### FB-R2-ARC-BE-S4-08
- Mức độ: **Major**
- Vị trí: `guest-requests.service.ts:516` (`row(…, true)` – `guest_request FOR UPDATE`) rồi `:564` (`work.cancelTask` → `housekeeping/internal/guest-request-work.adapter.ts:69-75` `hk_task FOR UPDATE`); chiều ngược: `housekeeping.service.ts:969` (khóa `hk_task`) → `:937-943` `onLinkedWorkStarted/Done` → `guest-request-lifecycle.ts:56`, `:68` (`guest_request FOR UPDATE`) → `postFee` → `FolioService.postLines` (folio). FD `complete`: `guest_request` rồi folio (`:531-542`).
- Vấn đề: (1) `decline` khóa `guest_request` → `hk_task`; HK bắt đầu/xong việc khóa `hk_task` → `guest_request` – hai chiều ngược nhau → 40P01 khi lễ tân từ chối đúng lúc HK bấm. (2) Ghi phí lấy folio (L3) sau khi giữ `hk_task`/`guest_request` (L4) – ngược 16.19. `guest_request` chưa có mức trong 16.19.
- Vì sao quan trọng: 16.19 "không có ngoại lệ nào khác"; thêm một cặp khóa ngược chiều trên đường có tiền (phí folio).
- Đề xuất sửa (ARC chốt, ghi vào 16.19 bổ sung 3): `guest_request` là **L4b, sau `hk_task`** (BE-C luôn `hk_task` → `guest_request`). `decline`/`complete` của FD: đọc `hk_task_id` không khóa → (có phí) khóa folio L3 qua `FolioService.lockForPosting` → `cancelTask` (khóa `hk_task`) → `guest_request FOR UPDATE` → kiểm lại trạng thái. Đường HK có việc `guest_request` có phí: lấy folio **trước** `hk_task` (cổng `GuestRequestStatusPort.lockForFee(tx, guestRequestId)` – cùng thẻ 02). Test đua (adapter thật): `decline` ‖ `startTask`/`completeTask`; `complete` ‖ `linkedDone` – `deadlocks +0`, đúng 1 dòng phí, kết quả như tuần tự.
- Trạng thái: Open – **BE-D** (+ **BE-C** điểm gọi `lockForFee`)

### FB-R2-ARC-BE-S4-09
- Mức độ: **Major**
- Vị trí: `guest-requests.service.ts:221-228` (đọc thẳng `hk_task` + `FULL_CLEAN_TASK_TYPES` đặt trong guest-portal để quyết phí `second_full_clean`), `:383-386`, `:603-606` (`property.phone_public`), `:450-451`, `:582`, `:620` (JOIN `room`); `guest-request-lifecycle.ts:101-104` (`SELECT code FROM reservation`); `guest-portal/public/guest-request-jobs.ts:33` (`room`).
- Vấn đề: guest-portal đọc thẳng bảng của housekeeping, reservations, platform; nặng nhất là **quyết định tiền** (BR-506-03 "lần dọn đầy đủ thứ hai") dựa trên `hk_task.type/status/done_at` với danh sách loại việc dọn đặt ở module khác chủ bảng. `module-boundaries.test.ts` chỉ kiểm import.
- Vì sao quan trọng: BE-C thêm/đổi loại việc dọn là phí sai mà không test nào báo (architecture 5.1: chỉ `reporting` được đọc thẳng, có danh sách).
- Đề xuất sửa: **BE-C** thêm `lastFullCleanAt(tx, {roomId, since, until})` vào `housekeeping/public/guest-request-work.port.ts`, chuyển `FULL_CLEAN_TASK_TYPES` sang housekeeping; **BE-D** lấy mã đơn qua `reservations/public` (mở rộng `guestRoomView`), `phone_public` qua `platform/public`; đọc `room_no/name` qua cổng đọc hàng loạt. Test: khối `module-boundaries.test.ts` cấm `guest-portal` `FROM|JOIN hk_task|reservation` (mẫu C6) + ca đơn vị `lastFullCleanAt` với oracle BR-506-03. Mức thời gian: phần quyết định tiền (`lastFullCleanAt`) trong tuần Ổn định; các đọc khác có thể R3 Sprint 1.
- Trạng thái: Open – **BE-D** (+ **BE-C** cổng)

### FB-R2-ARC-BE-S4-10
- Mức độ: Minor
- Vị trí: `guest-requests.service.ts:439-458`, `:470-475`, `:619-631`.
- Vấn đề: (a) `listGuestRequests?status=done|declined` sắp `ack_due_at` tăng dần rồi `LIMIT 200` → khi quá 200 yêu cầu đã đóng, màn hình chỉ thấy 200 cái **cũ nhất**; hợp đồng không có cursor. (b) `staffDto` gọi `guestRoomView` từng dòng thiếu `room_id` (N+1, tối đa 200). (c) "Cần chú ý" `count = rows.length` sau `LIMIT 100`.
- Vì sao quan trọng: danh sách mất phần mới nhất không dấu hiệu; N+1 trên đường request.
- Đề xuất sửa: trạng thái đã đóng sắp `closed_at DESC` (giới hạn N ngày); ARC thêm `limit`/`cursor` cho `listGuestRequests` ở 0.3.8; gộp `guestRoomViews(tx, ids[])`; đếm quá hạn bằng `count(*)` riêng. Test 201 yêu cầu `done` → có yêu cầu mới nhất.
- Trạng thái: Open – BE-D (+ ARC hợp đồng cursor, R3)

### FB-R2-ARC-BE-S4-11
- Mức độ: Minor (thiếu test)
- Vị trí: `test/integration/guest-requests-s4-bed.test.ts:45-75` (cổng việc **giả** tự `UPDATE hk_task`), `:476-563`.
- Vấn đề: test EP14 không chạy `GuestRequestWorkAdapter`/`HousekeepingService` thật (dù `housekeeping.module.ts:35` đã gắn cổng), nên đường khóa thật (thẻ 08) và nhánh "việc bị hủy rồi FD complete" (thẻ 07) chưa được chạy.
- Đề xuất sửa: khối test dùng cây Nest thật có `HousekeepingModule` cho các ca thẻ 07/08; giữ cổng giả chỉ cho ca "cổng chưa gắn".
- Trạng thái: Open – BE-D

### FB-R2-ARC-BE-S4-12
- Mức độ: Suggestion
- Vị trí: `test/integration/schema-parity.test.ts:64-66` (chú thích ghi FK chéo ở "0057", thực tế `0058`); `0058_guest_request.sql:33`, `:89-91` (`purge_after` không đường nào ghi).
- Đề xuất sửa: sửa chú thích; đặt `purge_after = closed_at + retention.guest_request_months` trong cùng UPDATE đóng yêu cầu, hoặc ghi vào phạm vi T13 (R3). Test: yêu cầu đóng → `purge_after` khác NULL.
- Trạng thái: Open – BE-D

**Làm tốt (giữ)**: 0058 chặt – FORCE RLS + `tenant_isolation`, không GRANT DELETE, FK kép `(property_id, id)`, 11 CHECK giữ bất biến hai chiều (`declined` ⇔ có lý do, `closed_at` ⇔ đóng, có phí ⇒ đã đồng ý); J10 nhắc đúng một lần (`UPDATE … FROM (SELECT … FOR UPDATE SKIP LOCKED)` đặt `overdue_notified_at`); ghi phí không trùng (`fee_folio_line_id` kiểm dưới khóa, qua `FolioService.postLines`, xử lý `FOLIO_LOCKED`); tách `GuestRequestLifecycle` gỡ vòng DI mà không sửa mã BE-C; quyền riêng tư đúng (SSE chỉ id, khách không nhận `roomNo`, `feeVnd` có `x-visible-to` và test HK không thấy, `ackDueOf` thuần có test mốc 21:59/22:00/06:30, `replyNote` kiểm Luhn + ≥ 6 chữ số).

**Tổng B: 0 Blocker · 3 Major · 2 Minor · 1 Suggestion.**

## C. Thẻ mới phát sinh khi đối chiếu ĐK-S3-5 (`s3-ARC.md`)

### FB-R2-ARC-BE-S4-13
- Mức độ: **Major**
- Vị trí: `reservations/internal/money-bridge.ts:85-101` (`recordInitialPayment` không chuyển `attachmentId`); B2 nhận `initialPayment.attachmentId` (`reservations.service.ts` ~1799, kiểu ở `reservation-hooks.ts:174`).
- Vấn đề: ảnh biên nhận gửi kèm khoản thu lúc tạo đơn (B2 – SAL/CTV chuyển khoản) bị **bỏ im lặng**; khoản thu `pending` đối soát mà không có bằng chứng.
- Vì sao quan trọng: BR-527 / A46a – đối soát tiền sale/CTV dựa vào ảnh biên nhận; mất bằng chứng tiền mà không báo lỗi.
- Đề xuất sửa: chuyển `attachmentId` sang `PaymentService.recordManual` (kiểm `purpose = deposit_receipt`, cùng đơn – như `recordPayment`). Test: CTV tạo đơn kèm chuyển khoản + ảnh → `Payment.attachmentId` có giá trị.
- Trạng thái: Open – **BE-A**

### FB-R2-ARC-BE-S4-14
- Mức độ: Minor (thiếu test đường tiền)
- Vị trí: `test/integration/frontdesk-s3-fixes.test.ts:535` (ca ARC-05 trả phòng lúc 11:00).
- Vấn đề: phần "phụ thu trả muộn đúng, đúng 1 dòng" của S3-05 (OTA + đơn con, trả muộn ngày đi mới) chưa có test.
- Đề xuất sửa: OTA 2 đêm + đơn con 1 đêm → `checkOut {checkoutAt: ngày đi mới 13:00}` → đúng 1 dòng `late_checkout` sống, số đúng bậc 30 %.
- Trạng thái: Open – BE-A

### FB-R2-ARC-BE-S4-15
- Mức độ: Minor (thiếu test)
- Vị trí: `test/integration/payments-s3.test.ts` ~2257-2271 (S3-12c chỉ assert trong `if (r.id)`; yêu cầu hoàn 1 đồng trên folio không dư bị từ chối ở `refunds.service.ts:173-178` nên assert có thể không chạy).
- Đề xuất sửa: tạo dư thừa trước rồi assert vô điều kiện 23514 cho `approval_request_refund_account_check` (`refund_method` NULL + `refund_account_enc`).
- Trạng thái: Open – BE-B

## D. Tổng

| Mục | Blocker | Major | Minor | Suggestion |
|---|---|---|---|---|
| A. Housekeeping (BE-C) | 0 | 3 (01, 02, 03) | 3 | 0 |
| B. EP14 (BE-D) | 0 | 3 (07, 08, 09) | 2 | 1 |
| C. Phát sinh từ ĐK-S3-5 | 0 | 1 (13 – BE-A) | 2 | 0 |
| **Cộng** | **0** | **7** | **7** | **1** |

Mức cho cổng QC: thẻ chạm tiền (07, 08 phần phí, 09 phần `lastFullCleanAt`, 13) sửa trong tuần Ổn định; thẻ 01, 02 (luồng HK offline, thứ tự khóa) sửa trong tuần Ổn định; thẻ 03 (đọc chéo, không tiền) – sửa lệch định nghĩa "đang ở" ngay, chuyển sang cổng có thể dời R3 Sprint 1 nếu QC chấp nhận.

