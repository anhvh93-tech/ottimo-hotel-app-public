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
- Trạng thái: **Verified** (ARC 19/10, HEAD `50db5cd` (mã chạy = `d527f9c`)) – `RoomStatusService.lastActionAt` (`room-status.service.ts:134-142`, `COALESCE(performed_at, occurred_at)` SM-03), `performedBefore(…, current.actedAt)` ở `transitionRoomStatus` (`housekeeping.service.ts:434-442`) và `recordInspection` (`:1207-1212`); không còn so với `since`. Xem E.2.

### FB-R2-ARC-BE-S4-02
- Mức độ: **Major**
- Vị trí: `internal/housekeeping.service.ts:394`, `:1113` (`SELECT 1 FROM room … FOR UPDATE`); `:414-421` (`body.taskId` nhận việc bất kỳ của căn); hoàn tất việc `guest_request` → `guestRequests.onLinkedWorkDone` (`:937-943`) → `guest-portal/internal/guest-request-lifecycle.ts:91-110` `postFee` → `FolioService.postLines` (khóa folio).
- Vấn đề – lệch thứ tự khóa toàn hệ thống (16.19, "khác bảng → sửa mã"):
  - (a) `transitionRoomStatus`/`recordInspection` giữ `room FOR UPDATE` (L2) rồi khóa `hk_task` (L4) **không** `NOWAIT`. Ngoại lệ E2 của 16.19 dựa trên tiền đề "mọi bên giữ `room FOR UPDATE` chỉ chạm việc bằng `NOWAIT`". Với `taskId` = việc `minibar_refill` (không bị giới hạn loại), lệnh này giữ căn và chờ việc, trong khi `setTaskStatus` → `onRefillDone` giữ việc và chờ `KEY SHARE` căn → 40P01.
  - (b) HK xong việc `guest_request` có phí BR-506: giữ `hk_task` (L4) rồi mới khóa folio (L3) để ghi phí – chiều L4 → L3, không phải ngoại lệ có tên.
- Vì sao quan trọng: 16.19 là nguồn duy nhất chống deadlock; mỗi đường lệch là một bề mặt mới (bài học K11-01/K11-04). Hôm nay hậu quả là 409 `CONCURRENT_UPDATE` (giao dịch hủy cả gói, không sai tiền), nhưng đường nào sau này khóa folio rồi chờ `hk_task` sẽ deadlock.
- Đề xuất sửa: (1) đổi hai chỗ khóa căn sang `FOR KEY SHARE` (hoặc khóa `room_status` – bảng của housekeeping); (2) giới hạn `taskId` ở `CLEAN_TYPES` (422 `NOT_IN_LIST`); (3) việc có `guest_request_id`: lấy folio của đơn (L3) **trước** khi khóa `hk_task` – qua cổng `GuestRequestStatusPort` thêm `lockForFee(tx, guestRequestId)` gọi trước `taskById(…, true)`. ARC **không** thêm ngoại lệ mới vào 16.19. Test: HK hoàn tất việc `guest_request` có phí ‖ B18 cùng đơn, ép cả hai thứ tự → không 40P01, phí ghi đúng một lần hoặc B18 409 `PENDING`/`BALANCE_DUE` như tuần tự; HK `finish_cleaning` với `taskId` của việc `minibar_refill` → 422.
- Trạng thái: **Verified** (ARC 19/10, HEAD `50db5cd` (mã chạy = `d527f9c`)) – (1) `lockRoomForHk` `FOR KEY SHARE` + advisory `hk-room:` (`housekeeping.service.ts:564-567`); (2) `taskId` chỉ `CLEAN_TYPES`, khác → 422 `NOT_IN_LIST` (`:453-458`); (3) `lockFeeOf` (L3) trước `lockedOpenTask` (L4) ở `:469`/`:478` và `transitionHkTask` `:1048-1052`. Xem E.2.

### FB-R2-ARC-BE-S4-03
- Mức độ: **Major**
- Vị trí: đọc thẳng bảng của module khác – `internal/housekeeping.service.ts:124`, `:309-314` (`inHouseByRoom`), `:341-346` (`guest.full_name`, `guest.service_notes`, `guest.tags`), `:623-627`, `:1043`; `public/room-status.service.ts:42-48`, `:133`, `:154`; `public/worker-jobs.ts:112-122`, `:262-266`, `:329`; `public/stay-arrival.ts:11-16`; `internal/attention-sources.ts:116`, `:146`; `internal/work-orders.service.ts:341`.
- Vấn đề:
  - Housekeeping `SELECT` thẳng `reservation`, `reservation_segment`, `room_block` (reservations) và `guest` (guests – dữ liệu cá nhân). `architecture.md` 5.1 chỉ cho `reporting` đọc thẳng (danh sách khai báo + test); C5 cấm đọc thẳng bảng dữ liệu cá nhân của module khác; `s3-contract.md` 4.3 "không gọi thẳng bảng của vùng khác". `module-boundaries.test.ts` chỉ bắt import nên lọt CI.
  - Định nghĩa "khách đang ở" đã lệch thật giữa hai chỗ của chính module: `inHouseByRoom` dùng `to_date >= today` (`housekeeping.service.ts:313`), `RoomStatusService` dùng `to_date > today` (`room-status.service.ts:48`, `:135`, `:156`).
- Vì sao quan trọng: quy tắc lượt ở/ngày đến/khối OOO bị cài lại ở module thứ hai (đúng loại lỗi J8 BUG-R2-142/151 vừa gặp); dữ liệu khách ra khỏi module chủ không qua lọc trường.
- Đề xuất sửa: **BE-A** expose cổng đọc `reservations/public/stay-occupancy.port.ts` (`inHouseByRoom(tx, date)`, `arrivalsByRoom(tx, date)`, `stayArrival(tx, reservationId)`, `activeBlocks(tx, date)` – một định nghĩa "đang ở" dùng chung với J8); **BE-B** (guests) expose `displayName`, `serviceNotes`, cờ VIP (không trả `tags` thô); **BE-C** chuyển các truy vấn trên sang cổng. Nếu cần giữ SQL gộp vì hiệu năng, ARC khai `HOUSEKEEPING_READ_TABLES` (như `reporting`) và mở rộng `module-boundaries.test.ts` dò SQL bảng ngoài vùng. Test kiến trúc + ca parity "khách ở ngày đi" giữa hai nguồn. **Mức thời gian**: sửa định nghĩa "đang ở" (lệch `>=`/`>`) trong tuần Ổn định; chuyển sang cổng có thể R3 Sprint 1 nếu cổng QC đồng ý (không chạm tiền).
- Trạng thái: **Verified phần định nghĩa** (ARC 19/10, HEAD `50db5cd` (mã chạy = `d527f9c`)) – một định nghĩa `housekeeping/public/stay-occupancy.ts` `inRoomOnSql`, dùng ở `housekeeping.service.ts:329`, `room-status.service.ts:49/148/168`, `work-orders.service.ts:343`, `worker-jobs.ts:330`, `attention-sources.ts:155`; J8 dùng `stayoverNightSql` có chủ đích; không còn `to_date >=`. **Phần đọc chéo (cổng BE-A/BE-B, test SQL bảng ngoài vùng) → Deferred R3 Sprint 1** (QC chấp nhận, `qc/s4-qc-gate.md` K6; backlog K10).

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
- Trạng thái: **Verified** (ARC 19/10, HEAD `50db5cd` (mã chạy = `d527f9c`)) – `complete` của FD chỉ ghi phí khi **không** có việc liên kết (`guest-requests.service.ts:538-541`, `:568-572`); việc liên kết ghi phí ở `linkedDone` (`guest-request-lifecycle.ts:83-103`, bỏ qua yêu cầu `declined`); `decline` nhận `in_progress` khi việc đã `cancelled` (`taskStatus`, `:543-549`, `:580-581`). Xem E.2.

### FB-R2-ARC-BE-S4-08
- Mức độ: **Major**
- Vị trí: `guest-requests.service.ts:516` (`row(…, true)` – `guest_request FOR UPDATE`) rồi `:564` (`work.cancelTask` → `housekeeping/internal/guest-request-work.adapter.ts:69-75` `hk_task FOR UPDATE`); chiều ngược: `housekeeping.service.ts:969` (khóa `hk_task`) → `:937-943` `onLinkedWorkStarted/Done` → `guest-request-lifecycle.ts:56`, `:68` (`guest_request FOR UPDATE`) → `postFee` → `FolioService.postLines` (folio). FD `complete`: `guest_request` rồi folio (`:531-542`).
- Vấn đề: (1) `decline` khóa `guest_request` → `hk_task`; HK bắt đầu/xong việc khóa `hk_task` → `guest_request` – hai chiều ngược nhau → 40P01 khi lễ tân từ chối đúng lúc HK bấm. (2) Ghi phí lấy folio (L3) sau khi giữ `hk_task`/`guest_request` (L4) – ngược 16.19. `guest_request` chưa có mức trong 16.19.
- Vì sao quan trọng: 16.19 "không có ngoại lệ nào khác"; thêm một cặp khóa ngược chiều trên đường có tiền (phí folio).
- Đề xuất sửa (ARC chốt, ghi vào 16.19 bổ sung 3): `guest_request` là **L4b, sau `hk_task`** (BE-C luôn `hk_task` → `guest_request`). `decline`/`complete` của FD: đọc `hk_task_id` không khóa → (có phí) khóa folio L3 qua `FolioService.lockForPosting` → `cancelTask` (khóa `hk_task`) → `guest_request FOR UPDATE` → kiểm lại trạng thái. Đường HK có việc `guest_request` có phí: lấy folio **trước** `hk_task` (cổng `GuestRequestStatusPort.lockForFee(tx, guestRequestId)` – cùng thẻ 02). Test đua (adapter thật): `decline` ‖ `startTask`/`completeTask`; `complete` ‖ `linkedDone` – `deadlocks +0`, đúng 1 dòng phí, kết quả như tuần tự.
- Trạng thái: **Verified** (ARC 19/10, HEAD `50db5cd` (mã chạy = `d527f9c`)) – thứ tự folio (L3) → `hk_task` (L4) → `guest_request` (L4b): FD đọc không khóa rồi `lockFeeFolio` trước `row(…, true)` (`guest-requests.service.ts:526-551`); HK gọi `lockForFee` trước khóa việc (`housekeeping.service.ts:469`, `:1048-1052`); `linkedDone` ghi dòng yêu cầu một lần. Xem E.2.

### FB-R2-ARC-BE-S4-09
- Mức độ: **Major**
- Vị trí: `guest-requests.service.ts:221-228` (đọc thẳng `hk_task` + `FULL_CLEAN_TASK_TYPES` đặt trong guest-portal để quyết phí `second_full_clean`), `:383-386`, `:603-606` (`property.phone_public`), `:450-451`, `:582`, `:620` (JOIN `room`); `guest-request-lifecycle.ts:101-104` (`SELECT code FROM reservation`); `guest-portal/public/guest-request-jobs.ts:33` (`room`).
- Vấn đề: guest-portal đọc thẳng bảng của housekeeping, reservations, platform; nặng nhất là **quyết định tiền** (BR-506-03 "lần dọn đầy đủ thứ hai") dựa trên `hk_task.type/status/done_at` với danh sách loại việc dọn đặt ở module khác chủ bảng. `module-boundaries.test.ts` chỉ kiểm import.
- Vì sao quan trọng: BE-C thêm/đổi loại việc dọn là phí sai mà không test nào báo (architecture 5.1: chỉ `reporting` được đọc thẳng, có danh sách).
- Đề xuất sửa: **BE-C** thêm `lastFullCleanAt(tx, {roomId, since, until})` vào `housekeeping/public/guest-request-work.port.ts`, chuyển `FULL_CLEAN_TASK_TYPES` sang housekeeping; **BE-D** lấy mã đơn qua `reservations/public` (mở rộng `guestRoomView`), `phone_public` qua `platform/public`; đọc `room_no/name` qua cổng đọc hàng loạt. Test: khối `module-boundaries.test.ts` cấm `guest-portal` `FROM|JOIN hk_task|reservation` (mẫu C6) + ca đơn vị `lastFullCleanAt` với oracle BR-506-03. Mức thời gian: phần quyết định tiền (`lastFullCleanAt`) trong tuần Ổn định; các đọc khác có thể R3 Sprint 1.
- Trạng thái: **Verified phần tiền** (ARC 19/10, HEAD `50db5cd` (mã chạy = `d527f9c`)) – `lastFullCleanAt` qua `GUEST_REQUEST_WORK_PORT` (`housekeeping/internal/guest-request-work.adapter.ts:96-110`), `FULL_CLEAN_TASK_TYPES` ở housekeeping; guest-portal không còn `FROM/JOIN hk_task|reservation` (test `guest-portal-boundaries.test.ts`). **Phần đọc chéo `room`/`property` → Deferred R3 Sprint 1** (QC chấp nhận; danh sách trong test).

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
- Đề xuất sửa: ~~chuyển `attachmentId` sang `recordManual`~~ – không làm được (ảnh `deposit_receipt` cần `reservationId`, đơn chưa có lúc B2; BE-A 18/10). **ARC chốt hướng (B)** (`outputs/ARC/openapi-0.3.7.md` 16.23): B2 trả 422 `NOT_ALLOWED` cho `initialPayment.attachmentId`; bằng chứng lúc tạo đơn = mã giao dịch trong `note`, ảnh gắn sau qua `createDepositNotice` (SAL/CTV) hoặc `recordPayment` (FD+). Test: B2 kèm `attachmentId` → 422 `NOT_ALLOWED`, không tạo đơn.
- Trạng thái: **Verified** (ARC 19/10, HEAD `50db5cd` (mã chạy = `d527f9c`)) – B2 trả 422 `NOT_ALLOWED` cho `initialPayment.attachmentId` (`reservations.service.ts:1877-1878`), test `s4-stab-be-a.test.ts:211-256`; `money-bridge` không còn đường gắn ảnh.

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

### C.K7 – Review kỹ thuật mã registration của BE-C (K7 cổng QC Sprint 4, 19/10/2026)

- Người review: ARC | Bước 4 sau cổng QC Sprint 4 KHÔNG ĐẠT | HEAD `50db5cd` (mã chạy = `2a6d61f` = `d527f9c` cũ) | Chỉ đọc mã, không chạy test DB.
- Phạm vi:
  - (1) S4-39: `removePartyMember` + `guestUploadPersonIndex` + dồn số ô (`frontdesk/internal/frontdesk.controller.ts:57-68`, `:522-540`; `frontdesk/internal/party.service.ts:545-610`; `registration/internal/registration.service.ts:2432-2520`; `guest-portal/public/online-checkin.read.ts:49-62`);
  - (2) phần "BE 9b/9c" của M5 (vòng sửa Sprint 3 `7780d56`/`ea29582`, `51d9660`/`e6d1a7d`, đọc trên mã hiện tại): `onPartyChanged` + `markUnclaimed` (`:2408-2430`, `:2553-2580`), `claim`/`linkDocument`/`assertLiveMember` (`:940`, `:955-1030`), J16 `purgeUnclaimedDocuments`/`purgeRetiredDocuments` (`:2613-2700`), "Cần chú ý" `unclaimedDocumentStays` (`:2705-2730`), chặn gửi khi thiếu giấy tờ (SEC-BE-54), gửi lại ô đang chờ (`guestUpload` `:2854-2920`), loại khỏi nhắc thị thực (`:2983`);
  - (3) migration `0070_be73_guest_doc_person.sql` (BE-73, BE-78 a);
  - (4) lần đọc `reservation_guest` của BUG-R2-205 (`registration.service.ts:2217-2224`).
- Đối chiếu: 0.3.7 (S4-39, `GuestDocumentLink`, 16.22), `architecture.md` 5.1, mẫu migration 0055/0075 (tắt RLS khi kiểm dữ liệu), test `registration-party-removal.test.ts` (R1–R6, S4-39, SEC-BE-54…58), `guest-document-profiles.test.ts`.

**Kết luận K7: 0 Blocker · 1 Major (S4-21) · 3 Minor · 1 Suggestion.** S4-39 và 9b/9c đúng thiết kế ở các luồng chính. Major S4-21 là lỗ hổng mới mở ra khi BE-73 cho người đặt gắn với bất kỳ giấy tờ nào. Lỗ hổng làm mất ảnh giấy tờ của người đặt, không chạm tiền. BE-C sửa trước khi QC chấm lại.

#### FB-R2-ARC-BE-S4-21
- Mức độ: **Major** (mất dữ liệu C3, không chạm tiền) | Người sửa: BE-C
- Vị trí: `registration/internal/registration.repo.ts:270-280` (`isOpenGuestSlot` không xét `guest_id`), dùng ở `registration.service.ts:2462-2475` (`onPartyMemberRemoved`) và `:2556` (`markUnclaimed`); các câu SQL cùng mẫu `party_member_id IS NULL AND person_index >= 2` không xét `guest_id`: `:2622` (J16 chọn đăng ký), `:2712` ("Cần chú ý"), `:2983` (nhắc thị thực), `:3024` (`uploadedPeople` cho guest-web).
- Vấn đề:
  - Từ BE-73 (16.22), giấy tờ của **người đặt** gắn bằng `guest_id`, còn `party_member_id` để NULL. `linkDocument` (`:955-1000`) cho gắn **bất kỳ** giấy tờ nào với người đặt, kể cả ô "Khách n" (n ≥ 2) tải từ link. Ví dụ: khách nhận link nhập ở ô 1, người đặt tải ở ô 3, lễ tân gắn ô 3 cho người đặt.
  - `isUnclaimed` đã thêm `guest_id === null` (`:249-263`), nhưng `isOpenGuestSlot` thì chưa. Vì vậy giấy tờ đã gắn người đặt vẫn bị coi là "ô chưa gắn ai":
    - (a) `removePartyMember` một người chưa có giấy tờ → 422 `REQUIRED` liệt kê cả ô của người đặt. Lễ tân chọn số đó thì giấy tờ người đặt bị **hủy ngay** (DEK, tệp, trường, c3 `delete`).
    - (b) Cắt số người không chọn ô (`onPartyChanged`) → `markUnclaimed` đặt `fields_purge_after` và `document_image.delete_after` = +24 giờ cho giấy tờ người đặt. J16 bước 0b bỏ qua giấy tờ này (lọc `isUnclaimed`), nhưng **bước 1 xóa ảnh** theo `delete_after`. Ảnh giấy tờ người đặt mất sau 24 giờ.
    - (c) Guest-web không đếm ô đó (`:3024`), "Cần chú ý" `registration_party_docs_unlinked` báo sai, nhắc thị thực bỏ sót (`:2983`).
- Vì sao quan trọng: mất ảnh và số giấy tờ của người đặt sau khi lễ tân đã gắn đúng người. Giấy tờ này phải có để khai báo lưu trú (NĐ 144/2021) và là dữ liệu C3. Hai chỗ dùng chung một định nghĩa "ô chưa gắn ai" mà lệch nhau đúng là loại lỗi đã gặp ở S4-03.
- Đề xuất sửa:
  - `isOpenGuestSlot` thêm `d.guest_id === null` (khai `guest_id` vào `Pick`);
  - thêm `AND d.guest_id IS NULL` vào 4 câu SQL kể trên. Tốt nhất là một hằng `OPEN_GUEST_SLOT_SQL` dùng chung, như `inRoomOnSql` ở S4-03;
  - không cần migration.
  - Test (`registration-party-removal.test.ts`):
    - (1) ô 3 gắn người đặt qua `GuestDocumentLink` → bỏ người B chưa có giấy tờ, còn ô 2 mở → `personIndexes` = [2]; chọn 3 → 422 `NOT_IN_LIST`;
    - (2) cắt số người không chọn ô → giấy tờ người đặt ở ô 3 không có `fields_purge_after`, ảnh giữ `delete_after` cũ; J16 sau 25 giờ → còn;
    - (3) guest-web `uploadedPeople` có ô 3.
- Trạng thái: **Verified 20/10** (ARC, commit `c293ceb`, CI push 39270302984 xanh – `gh run view`: headSha `c293ceb`, success). Kiểm mã:
  - một định nghĩa `isLinkedToNobody` + hai bản SQL `LINKED_TO_NOBODY_SQL`/`UNCLAIMED_DOC_SQL` (`registration.repo.ts:243-259`); `isOpenGuestSlot` và `isUnclaimed` cùng dùng định nghĩa này, nên `onPartyMemberRemoved` và `markUnclaimed` đều đúng;
  - 4 câu SQL đã đổi sang hằng chung: J16 chọn đăng ký, "Cần chú ý" (thêm cả nhánh giấy tờ trẻ em), nhắc thị thực, `uploadedPeople`;
  - trong `registration/` không còn mẫu `party_member_id IS NULL` viết tay, trừ `registration.controller.ts:419` (đếm giấy tờ người đặt, đúng nghĩa).
  - Test `registration-party-removal.test.ts`, đủ 3 ca ARC đề xuất:
    - "ARC S4-21 (1)": ô 3 gắn người đặt → `personIndexes` = [2]; chọn 3 → 422 `NOT_IN_LIST`, giấy tờ người đặt còn;
    - "ARC S4-21 (2)(3)": cắt số người → ô 3 không có hạn; J16 sau 25 giờ còn ảnh, DEK và tệp; `uploadedPeople` = [1, 3]; "Cần chú ý" không báo.
  - Không chạm mã tiền.

#### FB-R2-ARC-BE-S4-22
- Mức độ: Minor | Người sửa: BE-C (+ OPS chuẩn CONTRIBUTING)
- Vị trí: `db/migrations/0070_be73_guest_doc_person.sql:10-17` (khối `DO` kiểm dữ liệu cũ).
- Vấn đề:
  - Migration chạy bằng `ottimo_owner`, không phải superuser (`db/migrate.ts:27-33`). `guest_document` và `guest` đều `FORCE ROW LEVEL SECURITY` (0051:174-175, 0005:18), mà lúc migrate chưa có `app_current_property()`.
  - Hai câu `count(*)` vì thế luôn ra 0, nên phần "kiểm dữ liệu cũ trước, RAISE nếu lệch" không có tác dụng. 0055 và 0075 đã tắt RLS trong lúc kiểm vì đúng lý do này.
  - Hậu quả nhỏ:
    - (2) last4 vẫn được Postgres chặn ở `VALIDATE CONSTRAINT`, vì kiểm ràng buộc không qua RLS;
    - (1) "đã có `guest_id`" thì không ai kiểm. Cột này trước đó bỏ trống nên rủi ro thấp.
- Đề xuất sửa:
  - 0070 đã gộp, không sửa.
  - Chạy `scripts/sec-be73-check.sql` bằng owner, tắt RLS, trên DB demo trước khi nâng.
  - Ghi vào `CONTRIBUTING.md` mục migration: "khối kiểm dữ liệu phải `NO FORCE`/`DISABLE` RLS rồi bật lại, theo mẫu 0055". **Migration 0078 của K1 phải theo mẫu này**, nếu không các câu UPDATE bù mốc sẽ không cập nhật dòng nào.
  - Test migration: dựng 1 dòng vi phạm rồi chạy, phải RAISE.
- Trạng thái: **Verified phần 0078 + quy tắc** (ARC 20/10, `c293ceb`):
  - 0078 tắt RLS (`NO FORCE` + `DISABLE`) đúng 4 bảng nó đọc/ghi (`attachment`, `work_order`, `inspection`, `reservation`) và bật lại `ENABLE` + `FORCE` ở cuối tệp; có chú thích theo mẫu 0075.
  - Câu UPDATE chỉ ghi dòng mốc NULL và chưa xóa. `cancelled` lấy `updated_at`; `penalty_evidence` lấy `actual_checkout_at`/`cancelled_at`/`no_show_marked_at` (các cột có ở `schema/reservations.ts:120,127`), không có thì lấy `uploaded_at`.
  - Test `sec-be65-retention.test.ts` (6b) chạy nguyên tệp bằng owner không ngữ cảnh → bù đúng dòng; đối chứng giữ RLS → 0 dòng.
  - Quy tắc "Migration dữ liệu và RLS" đã ghi ở `product/docs/coding-standards.md` mục 6.
  - **Còn mở (Minor, OPS):** chạy `scripts/sec-be73-check.sql` bằng owner, tắt RLS, trên DB demo trước khi nâng demo lên ≥ 0070 (BE-C không được đụng stack demo). Không chặn chấm lại.

#### FB-R2-ARC-BE-S4-23
- Mức độ: Minor | Người sửa: BE-C (+ MOB guest-web)
- Vị trí: `registration.service.ts:2854-2890` (`guestUpload` tìm giấy tờ theo `person_index`, không kiểm phiên bản ô); `:2484-2491` (dồn số ô).
- Vấn đề: sau khi lễ tân chọn ô n và các ô sau dồn xuống, một tab guest-web mở từ trước vẫn tải lên với số ô cũ (n+1). Máy chủ coi đó là giấy tờ của người **hiện** ở ô n+1 (trước đây là n+2). Ảnh cũ của người này bị hủy (`replaced`) và ảnh của người khác thế vào.
- Vì sao quan trọng: lẫn ảnh giấy tờ giữa hai người trong đoàn. Khả năng thấp, vì cả đoàn dùng một link và việc bỏ người thường diễn ra tại quầy.
- Đề xuất sửa: `guestProgress` trả `slotsVersion` (ví dụ `reservation.party_version`). Guest-web gửi kèm khi tải lên; lệch → 409 `CONCURRENT_UPDATE`, guest-web tải lại danh sách ô. Test: dồn ô xong, tải với phiên bản cũ → 409, ảnh không đổi.
- Trạng thái: Open – dời R3 Sprint 1 (backlog)

#### FB-R2-ARC-BE-S4-24
- Mức độ: Minor | Người sửa: BE-C
- Vị trí: `registration.service.ts:2217-2224` (BUG-R2-205 `partyOverCount` đọc thẳng `reservation_guest`).
- Vấn đề:
  - Câu SQL này trùng hệt bộ đếm frontdesk đã cung cấp qua `ReservationHooks.partyCount` (`frontdesk.module.ts:163-169`, ARC-BE-S3-15 g).
  - Registration đọc thẳng bảng của frontdesk, trái `architecture.md` 5.1, giống S3-15 (e) đang dời.
  - Không sai số: cùng điều kiện `removed_at IS NULL`, và `1 +` người đặt khớp `partyPresentCount`.
- Đề xuất sửa: dùng `hooks.partyCount(tx, reservationId)`, hoặc cổng đọc `reservations/public` của S3-15 (e). Gộp vào việc R3 "S3-15 (e) + đọc `reservation_guest` (BUG-205)" đã có ở K10; không cần dòng backlog mới.
- Trạng thái: Deferred R3 Sprint 1 (QC chấp nhận ở K10)

#### FB-R2-ARC-BE-S4-25
- Mức độ: Suggestion | Người sửa: BE-C
- Vị trí: `registration.service.ts:2484-2491` (dồn `guest_document.person_index`); `consent_record.person_index` (append-only, R-CON-02); `retention.service.ts:158-161`, `:182-185` (khớp P02b theo `person_index` khi `guest_document_id` NULL).
- Vấn đề: hiện chỉ guest-web ghi P02b không kèm giấy tờ, và chỉ cho ô 1 (`guest-portal.service.ts:657-662`, ĐK-5). Ô 1 không bao giờ bị dồn, nên hôm nay dồn ô không làm lệch quyết định P02b. Nếu sau này mở P02b cho ô ≥ 2 trên guest-web, quyết định của người bị bỏ sẽ áp sang người dồn vào ô đó, vì `consent_record` không được sửa.
- Đề xuất sửa: thêm chú thích bất biến ở `onPartyMemberRemoved` và một test khóa: guest-web P02b `personIndex` ≠ 1 → 422. Khi mở ô ≥ 2: lúc dồn ô, ghi thêm bản sao quyết định gắn `guest_document_id` (append-only).
- Trạng thái: Open – tác giả tự cân nhắc

**Những gì ARC đã kiểm và thấy đúng (không thẻ):**
- `queryGuestUpload` chỉ nhận 2…20 hoặc `none`. Lỗi 422 `REQUIRED` mang `personIndexes`, `NOT_ALLOWED` khi người có giấy tờ đã gắn (SEC-BE-58 (2)), `NOT_IN_LIST` khi số không thuộc ô mở. Lỗi ném trong cùng giao dịch với `party.remove`, nên khi bị từ chối thì cả lệnh bỏ người rollback (test R1).
- Dồn ô: không có unique index trên `person_index`, nên `UPDATE … person_index - 1` không vướng thứ tự dòng. Lựa chọn "bổ sung tại quầy" dồn theo (`shiftDeferredPeople`, hàm public của guest-portal ghi bảng của chính nó). Audit chỉ ghi số ô hoặc `none`.
- `legal_hold`: không hủy, chỉ đánh dấu rút (`retireUnderHold`). J16 `purgeRetiredDocuments` hủy khi gỡ giữ, mỗi đăng ký một SAVEPOINT.
- 9b/9c:
  - `markUnclaimed` không bao giờ dời hạn sẵn có ra muộn hơn (`LEAST`), giữ giấy tờ trẻ em chưa khai báo (BR-601 v0.3.8);
  - `claim` xóa hạn 24 giờ và trả lại hạn của lượt ở;
  - `assertLiveMember` chặn gắn cho người đã rời đoàn;
  - chặn gửi khi số giấy tờ được tính nhỏ hơn số người (SEC-BE-54, `:1811`, `:1878-1879`);
  - gửi lại ô đang chờ thì tạo giấy tờ mới, không mang P02b cũ (SEC-BE-56);
  - giấy tờ đang chờ không vào nhắc thị thực (SEC-BE-58 (1)).
- 0070: ràng buộc loại trừ `guest_id`/`party_member_id` và unique "một giấy tờ người đặt mỗi khai báo" (partial theo `removed_at`) đúng 16.22. `GRANT UPDATE (guest_id)` đủ hẹp. CHECK last4 ↔ P05 đúng BE-78 (a).

**Cập nhật 20/10 (ORC K7', `qc/s4-qc-gate.md` 10.4):** S4-21 **Verified**, S4-22 **Verified phần 0078 + quy tắc** (còn phần OPS chạy script trên demo), trên `c293ceb` CI 39270302984 xanh. K7 phía ARC: 0 Blocker, 0 Major mở.

**Điều kiện Verified K7 (19/10):** S4-21 sửa xong và ARC kiểm lại trên commit chấm lại. S4-22: BE-C chạy script kiểm tra và áp yêu cầu RLS cho 0078. S4-23 và S4-24 dời R3 Sprint 1, có dòng backlog (S4-24 đã nằm trong K10). Phần "BE 9b/9c" của M5: **Verified** trên `50db5cd`, ngoại trừ ảnh hưởng của S4-21 lên `markUnclaimed`, vốn do BE-73 mở ra sau 9b.

## D. Tổng

| Mục | Blocker | Major | Minor | Suggestion |
|---|---|---|---|---|
| A. Housekeeping (BE-C) | 0 | 3 (01, 02, 03) | 3 | 0 |
| B. EP14 (BE-D) | 0 | 3 (07, 08, 09) | 2 | 1 |
| C. Phát sinh từ ĐK-S3-5 | 0 | 1 (13 – BE-A) | 2 | 0 |
| C.K7 Registration BE-C (19/10) | 0 | 1 (21) | 3 (22, 23, 24) | 1 (25) |
| **Cộng** | **0** | **8** | **10** | **2** |

Mức cho cổng QC: thẻ chạm tiền (07, 08 phần phí, 09 phần `lastFullCleanAt`, 13) sửa trong tuần Ổn định; thẻ 01, 02 (luồng HK offline, thứ tự khóa) sửa trong tuần Ổn định; thẻ 03 (đọc chéo, không tiền) – sửa lệch định nghĩa "đang ở" ngay, chuyển sang cổng có thể dời R3 Sprint 1 nếu QC chấp nhận.


## E. Bước 4 sau cổng QC Sprint 4 KHÔNG ĐẠT (19/10/2026) – K1, K6

- Người viết: ARC | Round 2 – Sprint 4, Bước 4 (Phản hồi & sửa) | HEAD `50db5cd` (mã chạy = `2a6d61f` = `23b0c7f` = `d527f9c` cũ, repo công khai `anhvh93-tech/ottimo-hotel-app-public`) | Căn cứ: `qc/s4-qc-gate.md` mục 5 (K1, K6, K7).
- Chỉ đọc mã, không chạy test DB, không sửa `src`.

### E.1 K1 – tiền kiểm FB-R2-SEC-BE-65 (gửi ORC trước, 19/10)

**Kết luận phần (b) `penalty_evidence` gắn sau trả phòng:**

1. **Cách SEC đề xuất (truyền mốc vào `bindTo` ở `folio/internal/folio-lines.service.ts:306`) CÓ chạm đóng băng mã tiền.** Lời gọi nằm trong đường ghi dòng folio thủ công (`postLines` … `allowPostCheckout: true`, BR-427 c), cùng giao dịch với dòng tiền và yêu cầu duyệt `damage_pricing`; phải đọc thêm giờ trả phòng trong đường đó. Quyết định ORC 18/10 (decision-log, "đóng băng mã tiền tới cổng QC Sprint 4") chỉ có ngoại lệ hẹp cho BUG-R2-207. ARC **không đề nghị** mở ngoại lệ thứ hai cho việc này.
2. **Nhưng phần (b) làm được mà KHÔNG chạm mã tiền**, toàn bộ trong module `files` (không phải mã tiền) và một migration dữ liệu chỉ ghi bảng `attachment`:
   - (b1) `AttachmentService.upload` (`files/public/attachment.service.ts:143-190`): khi `purpose = 'penalty_evidence'` và có `reservationId`, đọc `this.sales.stayInfo(tx, reservationId).status` (cổng `ReservationSalesPort` đã có sẵn ở files, dùng như `ownsReservation`); trạng thái ∈ {`checked_out`, `cancelled`, `no_show`} → INSERT kèm `retention_anchor_at = now` (giờ tải lên ≥ giờ trả phòng; lệch muộn tối đa bằng cửa sổ BR-427 c, tức giữ lâu hơn, không ngắn hơn – khớp ý SEC "hoặc muộn hơn"). Ảnh tải lên **trước** trả phòng đã được `registration.service.ts:2391` đặt mốc theo `reservationId` (không cần đổi).
   - (b2) Lưới an toàn J16 trong `purgeDue` (files, job, chỉ đọc thêm): đếm ảnh đã gắn (`bound_ref_id IS NOT NULL`), `retention_anchor_at IS NULL`, `purpose IN ('work_order','inspection','penalty_evidence')`, `uploaded_at + attachment_ops_retention_months` ≤ now → ghi log/kết quả job `anchorMissing: n` (không xóa – tránh xóa bằng chứng của lượt ở dài hạn đang ở). Bắt được kẽ hở chạy đua "tải lên đúng lúc giao dịch trả phòng chưa commit" và mọi hồi quy sau này. SEC quyết có cần đẩy thành "Cần chú ý" ở R3 hay không.
   - (b3) Migration bù **0078** (xem (a)) gồm cả `penalty_evidence`: đã gắn, mốc NULL, chưa xóa, đơn ở trạng thái `checked_out`/`cancelled`/`no_show` → mốc = `COALESCE(reservation.actual_checkout_at, attachment.uploaded_at)`.
   - Không đổi `folio-lines.service.ts`, `stay.service.ts`, `payments/**`, `attachment-usage.ts`, chữ ký `bindTo`.
3. Vì vậy **SEC không cần quyết "BE-38 có cần phần (b)"** – (b) làm trong K1 như (b1)–(b3), BE-C làm cùng phần (a). Nếu ORC/SEC vẫn coi `upload` là "chạm tiền" (ảnh là bằng chứng của dòng tiền) thì đường lùi: chỉ làm (b2)+(b3), (b1) dời R3 Sprint 1 cùng lượt kiểm tiền – khi đó ảnh tải sau trả phòng từ nay tới R3 sẽ được (b2) báo, và chạy lại bù kiểu (b3) ở R3.

**Phần (a) `work_order` / `inspection` – cách cài cho BE-C (BE-B review):**

| Việc | Chỗ sửa | Cách làm |
|---|---|---|
| a1. Hàm mới ở files | `files/public/attachment.service.ts` | `setRetentionAnchorForRef(tx, ref: {type:'work_order'\|'inspection'; id}, at: Date \| null)`: `UPDATE attachment SET retention_anchor_at = $3 WHERE bound_ref_type = $1 AND bound_ref_id = $2 AND purged_at IS NULL` (null = xóa mốc; ghi đè, không "chỉ tăng" như `setRetentionAnchor`). Không nới `setRetentionAnchor` cũ (giữ chặn "mọi tệp của một mục đích", ARC FB-S3-31 (2)). |
| a2. Đóng phiếu sửa | `housekeeping/internal/work-orders.service.ts` ~`:876-912` (sau `UPDATE work_order` và sau vòng `bindTo` ảnh `donePhotos`) | `action ∈ {complete, cancel}` → `setRetentionAnchorForRef({type:'work_order', id}, c.now)` – phủ cả ảnh lúc tạo phiếu (`:600`) và ảnh sửa xong (`:914`). Mốc = giờ server lúc đóng (cùng `done_at`). |
| a3. Mở lại | cùng chỗ, nhánh `reopen` (`:903-911`) | `setRetentionAnchorForRef({type:'work_order', id}, null)`; đóng lại → a2 đặt mốc mới. Cửa sổ mở lại ≤ 7 ngày (`reopenable`, DOM D-12 g) nên không có ca J16 xóa trước khi mở lại. |
| a4. Kiểm phòng | `housekeeping/internal/housekeeping.service.ts:1304-1313` | truyền `retentionAnchorAt: body.performedAt` (= `inspected_at`) vào `bindTo` – một chỗ, không cần a1. |
| a5. Migration **0078** `attachment_retention_anchor_backfill` (dữ liệu, không đổi schema; snapshot = 0077 như mẫu 0064/0067/0075; ghi `_journal.json`) | `src/db/migrations/0078_*.sql` | Tắt/bật RLS như 0075 cho `attachment`, `work_order`, `inspection`, `reservation`. (i) `work_order` `done` → mốc = `done_at`; `cancelled` → `updated_at` (không có `cancelled_at`; `cancelled` là trạng thái cuối). (ii) `inspection` → `inspected_at`. (iii) `penalty_evidence` như (b3). Mọi câu: `AND a.retention_anchor_at IS NULL AND a.purged_at IS NULL`, khớp `bound_ref_type`/`bound_ref_id`. Không RAISE. Migration đã gộp (0076, 0077) không sửa. |
| a6. Test J16 | `test/integration/` (BE-C, file mới `sec-be65-retention.test.ts`) | (1) phiếu `done` có ảnh lúc tạo + ảnh sửa xong → `purgeDue` tại `done_at + months − 1 ngày` còn; `+ months + 1 ngày` → `purged_at`, `purge_reason='retention'`, DEK hủy (đúng ca P1 của SEC); (2) `done` → `reopen` → mốc NULL; đóng lại → mốc mới; (3) phiếu `cancelled` như (1); (4) kiểm phòng → mốc = `performedAt` (gửi offline `performedAt` sớm hơn giờ nhận); (5) `penalty_evidence` tải lên sau `checked_out` → mốc ≠ NULL; tải lên khi `in_house` → NULL tới khi trả phòng; (6) migration 0078: dựng dữ liệu kiểu cũ (mốc NULL) → chạy → mốc đúng (theo mẫu test migration 0075/0076); (7) `anchorMissing` của (b2). |

Ghi chú khóa: a1/a2/a3 là `UPDATE attachment` theo `bound_ref` trong giao dịch đã giữ khóa phiếu (`work_order` FOR UPDATE + `If-Match`); `attachment` đứng sau `work_order` trong thứ tự 16.19 như `bindTo` hiện có – không thêm cặp khóa mới. Không đụng mã tiền.

- Trạng thái K1 (phía ARC): **Đã trả lời ORC 19/10**. Chờ BE-C cài, BE-B review, SEC Verified BE-65 (8/8 SEC-G3) trên commit chấm lại.

### E.2 K6 – Verified phía ARC (19/10, HEAD `50db5cd`, mã chạy = `d527f9c`)

| Thẻ | Kết quả | Bằng chứng mã (HEAD) |
|---|---|---|
| FB-R2-ARC-BE-S3-15 (điểm mở lại, `s3-ARC.md`) | **Verified** | `stay-support.ts:592` → `FolioService.linkApprovalRequest` (`folio.service.ts:3121-3146`, khóa L3 trước khi đọc, kiểm dòng ↔ yêu cầu, idempotent); ngoài `folio/`, `payments/` không còn `UPDATE folio_line`. (e) + BUG-205 → R3 Sprint 1 (K10) |
| S4-01 | **Verified** | `lastActionAt` theo giờ người làm; `performedBefore(…, actedAt)` ở cả lệnh đổi trạng thái lẫn kiểm phòng |
| S4-02 | **Verified** | KEY SHARE + advisory; `taskId` ⊂ `CLEAN_TYPES`; `lockFeeOf` (L3) trước khóa việc (L4) ở hai đường |
| S4-03 | **Verified phần định nghĩa**; đọc chéo → **R3 Sprint 1** | `inRoomOnSql` dùng ở 7 chỗ; J8 `stayoverNightSql` có chủ đích |
| S4-07 | **Verified** | phí chỉ ở `complete` khi không có việc liên kết; `linkedDone` ghi phí; `decline` từ `in_progress` khi việc `cancelled` |
| S4-08 | **Verified** | L3 → L4 → L4b ở FD và HK; dòng yêu cầu ghi một lần |
| S4-09 | **Verified phần tiền**; đọc `room`/`property` → **R3 Sprint 1** | `lastFullCleanAt` qua cổng; test `guest-portal-boundaries` cấm `hk_task`/`reservation`/tiền |
| S4-13 | **Verified** | B2 422 `NOT_ALLOWED` + test |
| BE-S4-16 (`openapi-0.3.7.md`) | **Verified** | `lockStayBookings` trước nhánh dòng đêm (`folio-lines.service.ts:402-405`); lượt kiểm 8 deadlocks +0 |

- Không mở lại thẻ nào. Mã HEAD so với `7ac11a4`/`f6803d0` không chạm lại vùng các thẻ này ngoài phần đã sửa.
- Mọi dòng trên chỉ đọc mã, không chạy test DB. Kết quả test lấy từ CI 39244841718 (QC tự tải, 2.960 ca đạt).
- K7 (mục C.K7): thêm 1 Major mới (S4-21, BE-C). Thẻ này không thuộc K6 nhưng phải đóng trước QC chấm lại.

## F. Review nhanh hai bản sửa ngày kinh doanh BUG-R2-211 (20/10/2026, cây làm việc chưa commit)

- Người review: ARC | Round 2 – Sprint 4, Bước 4 (K2' cổng QC) | Chỉ đọc. Phạm vi:
  - (1) MOB, `outputs/MOB/s4-report.md` mục 10: `apps/mobile/src/app/{time,data,tasks}.ts`, 5 trang, mock;
  - (2) FE-A đợt 27, `outputs/FE/s4-report.md`: `apps/admin-web/src/app/{businessDay,dates}.ts` cùng 7 trang và mock.
- Đối chiếu: `openapi.yaml` (`listHkTasks` x-roles/x-scope :6750-6751; `getBookingRules` x-roles :2036; `getRack` x-roles :1785), `platform/public/property-context.ts:37-55`, `reservations/internal/booking-context.ts:29-35`, `rack.service.ts:125-135, 256`, `housekeeping.service.ts:809-813`.

**Kết luận: đồng ý gộp cả hai bản, 0 Blocker, 0 Major.** Còn 2 Minor và 1 Suggestion, đều dời R3.

| Câu hỏi của ORC | Trả lời |
|---|---|
| Đúng hợp đồng (x-roles, `ctx.today`)? | **Đúng.** MOB: `listHkTasks` không gửi `date` → server dùng `q.date ?? c.today` (`housekeeping.service.ts:809`), x-scope HK `today` qua; không gọi `getBookingRules` (HK/MNT không có trong x-roles). FE: vai đặt phòng đọc `getBookingRules().businessDate` (= `ctx.today`, `reservations.controller.ts:148`); HK/MNT đọc `getRack` (x-roles có cả HK/MNT), `days: 1` hợp lệ (`rack.service.ts:130`: 1…MAX). Không đổi hợp đồng, không thêm trường. |
| Có đổi mã tiền phía server? | **Không.** `git diff --stat -- product/services product/packages` rỗng. #1–#3 (đổi phòng, đặt đơn, dài hạn) chỉ đổi giá trị client gửi lên; server vẫn kiểm `effectiveDate === ctx.today`, `DATE_IN_PAST` theo `ctx.today`, nên không có đường nào ghi tiền khác trước. Đặt đơn D-1→D lúc 02:40 là đúng BR-010 (đêm đang diễn ra), không phải nới quy tắc. |
| `getRack().today` có đúng là ngày kinh doanh cho mọi vai? | **Đúng.** `today: ctx.today` (`rack.service.ts:256`), `ctx` từ `bookingContext` → `PropertyContextService.now()` → `businessDate(now, timezone, business_day_rollover)` (tham số thật của cơ sở, `property-context.ts:44-52`). Không có nhánh theo vai: `rackViewOf(roles)` chỉ che dữ liệu (`all_masked`, `availability_only`), không đổi `today`. Giá trị đúng với cả `from` bất kỳ. |

Điểm làm tốt:
- MOB bỏ hẳn `date` thay vì tự tính, để server là nguồn duy nhất.
- `Promise.allSettled` tách lỗi: phần nào hỏng thì dùng bản offline của phần đó. Khi thiếu danh sách việc, bản lưu không giữ tên khách (SR-PWA-01).
- Cả hai bên đều có ca đối chứng. MOB trả mã cũ thì 02:40/05:59 đỏ; FE trả mã cũ thì 13/21 ca đỏ.
- Mock nay trả lời như server: 422 khi lệch ngày, so ngày kinh doanh chứ không so ngày UTC.

### FB-R2-ARC-FE-S4-01
- Mức độ: Minor | Người sửa: FE-A
- Vị trí: `admin-web/src/app/businessDay.ts` `useBusinessDay` (`estimate = businessDayLocal(tz)` chỉ tính lại khi component render).
- Vấn đề:
  - Không có hẹn giờ tại mốc 06:00. Màn mở qua đêm (Desk để nguyên từ 05:50) sẽ giữ ngày D-1 cho mặc định và `min` cho tới khi render lại.
  - Hậu quả: lễ tân gửi ngày D-1 sau 06:00 → server trả 422 `DATE_IN_PAST` hoặc lệch `effectiveDate`, có thông báo. Không sai tiền.
- Đề xuất sửa: một `setTimeout` tới mốc đổi ngày kế tiếp (hoặc tính lại khi `visibilitychange`/focus) để cập nhật `estimate`; `useBusinessDayChange` đã có để dời mặc định. PWA cũng làm như vậy cho `businessDate()`.
- Trạng thái: Open – dời R3 Sprint 1 (backlog)

### FB-R2-ARC-MOB-S4-01
- Mức độ: Minor | Người sửa: MOB
- Vị trí: `apps/mobile/src/app/time.ts` `BUSINESS_DAY_ROLLOVER = '06:00'` (hằng), dùng cho `min`/kiểm trước ở `ReportPage.tsx:63`, `WorkOrderPage.tsx:193` và nhãn "đến hôm nay".
- Vấn đề:
  - `business_day_rollover` là tham số OWN/MGR sửa được (`0002_parameter_catalogue.sql:9`). Nếu cơ sở đổi mốc, PWA hiện sai "hôm nay" trong khoảng chênh.
  - Hậu quả: `min` chặn một ngày hợp lệ, hoặc server trả 422 cho ngày PWA cho chọn. Danh sách việc vẫn đúng, vì không gửi `date`.
  - FE đã có cách lấy ngày server cho HK/MNT (`getRack().today`); PWA không dùng.
- Đề xuất sửa: R3 theo đề xuất hợp đồng bên dưới. Tạm thời có thể đọc `getRack({days:1}).today` khi trực tuyến (HK/MNT có trong x-roles) và lưu kèm bản offline. Hằng 06:00 chỉ dùng khi chưa từng đọc được.
- Trạng thái: Open – dời R3 Sprint 1 (backlog)

### FB-R2-ARC-FE-S4-02 (Suggestion – đề xuất hợp đồng R3, ARC tự nhận)
- Vấn đề: client không có nguồn chính thức cho ngày kinh doanh và mốc đổi ngày, nên:
  - HK/MNT phải đọc `getRack` (một truy vấn rack đầy đủ) chỉ để lấy `today`;
  - FE #4 (`onBusinessDay` của `decidedAt`) và PWA dùng mặc định 06:00 thay vì tham số thật.
- Đề xuất (0.3.8, cộng thêm, không phá vỡ):
  - (a) `Me.property` thêm `businessDate` (`LocalDate` = `ctx.today` lúc trả lời) và `businessDayRollover` (`LocalTime`) cho mọi vai. Đây là nguồn chung cho Desk và PWA, có trong phiên nên PWA lưu offline được.
  - (b) `BookingRules` thêm `businessDayRollover`, để #4 dùng ngay cho vai đặt phòng.
  - (c) Không thêm vào từng phản hồi danh sách. `listHkTasks` không `date` đã đi theo `ctx.today`.
  - Khi có (a), FE bỏ nhánh `getRack` trong `useBusinessDay`, MOB bỏ hằng 06:00 (giữ làm dự phòng khi chưa có phiên).
- Trạng thái: Open – ARC đưa vào hợp đồng R3 Sprint 1 (PO thêm dòng backlog cùng hai Minor trên). Không chặn bản dùng thử, vì server luôn kiểm lại.

**Tổng F:** 0 Blocker · 0 Major · 2 Minor · 1 Suggestion. Phía ARC đồng ý ORC gộp hai bản sửa, kèm CI xanh và QA chạy lại ca 02:40/05:59/06:00 của BUG-R2-211.
