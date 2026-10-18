# Phản hồi BE-C – review Sprint 4 (tuần Ổn định, 18/10)

Nguồn thẻ: `reviews/s4-ARC.md` (A. housekeeping; S4-09 phần cổng), `reviews/s4-SEC.md` (BE-73, BE-78 (a), BE-77 phần registration), `outputs/DATA/s4-a7-reconciliation.md` (A7-02, A7-03).
Chi tiết sửa và test: `outputs/BE/s4-be-c.md` mục 14–17. Chưa commit.

| Thẻ | Mức | Trạng thái | Trả lời |
|---|---|---|---|
| FB-R2-ARC-BE-S4-01 | Major | Done | `performedAt` so với lần thao tác cuối trên căn theo giờ người làm (`RoomStatusService.lastActionAt`, `COALESCE(performed_at, occurred_at)` của SM-03), cho lệch 5'. Không còn so với `since`. R5 tự ghi lúc đọc mang mốc tới hạn. Ca chuỗi offline start → finish → kiểm phòng cùng lúc: 200/200/201 → VI |
| FB-R2-ARC-BE-S4-02 | Major | Done | Đường HK khóa căn `FOR KEY SHARE` + advisory `hk-room:<id>` (hai HK vẫn xếp hàng). `taskId` chỉ `CLEAN_TYPES`, khác → 422 `NOT_IN_LIST`. Việc `guest_request` tới `done` gọi `lockForFee` (BE-D đã cài) **trước** khi khóa `hk_task`; việc chọn từ danh sách được khóa và kiểm lại. Test: KEY SHARE không chờ, FOR UPDATE chờ, 200/409; giữ folio → việc không bị khóa; đua tiền 4 vòng = chạy tuần tự |
| FB-R2-ARC-BE-S4-03 | Major | Done phần định nghĩa; **Deferred R3** phần chuyển sang cổng BE-A/BE-B (chờ QC đồng ý, theo thẻ) | Một định nghĩa `housekeeping/public/stay-occupancy.ts` `inRoomOnSql`, cùng quy tắc `currentRoomOfStay` của BE-B. Áp cho trạng thái suy ra, B13, danh sách buồng, `room_status_mismatch`, phiếu sửa. J8 giữ câu hỏi "đêm D có ở" (`stayoverNightSql`). Ca parity: ngày đi, quá ngày đi, ngày đổi căn |
| FB-R2-ARC-BE-S4-04 | Minor | Open (sau cổng) | Chưa làm `expectedFrom` cho J8/R5 |
| FB-R2-ARC-BE-S4-05 | Minor | Done | `complete` sớm hơn `started_at` quá 5' → 422 |
| FB-R2-ARC-BE-S4-06 | Minor | Done một phần | Đã có ca chuỗi offline và ca thứ tự khóa. Còn ca "J8 chạy lại sau khi hủy `dnd`" |
| FB-R2-ARC-BE-S4-09 (phần BE-C) | Major | Done (chờ ORC chốt chữ ký với BE-D) | `GuestRequestWorkPort.lastFullCleanAt(tx, {roomId, since, until, fullCleanRequestIds?})`, `FULL_CLEAN_TASK_TYPES` chuyển về housekeeping, test oracle BR-506-03. Có thêm `taskStatus` (kiểu `HkTaskStatus`, ARC 16.24) cho S4-07 của BE-D |
| FB-R2-SEC-BE-73 | Major | Done – chờ SEC kiểm | Theo ARC 16.22: không suy người từ `isMain`. Thiếu `partyMemberId` thì giấy tờ chính cũng đi cổng khớp (người đặt/thành viên theo khóa → tên + ngày sinh → hồ sơ P05 → hồ sơ "từ giấy tờ"). Người đặt chọn bằng id đơn (`party[]`), lưu ở `guest_document.guest_id`. Khóa/last4/P05 chỉ lên hồ sơ người đã gắn; giấy tờ chưa gắn + P05 → 422 `REQUIRED`. Migration 0070, script kiểm `scripts/sec-be73-check.sql`. Ca đủ 3 bước tái hiện. **Cần FE-A/FE-B: Desk luôn chọn người** |
| FB-R2-SEC-BE-78 (a) | Suggestion | Done | CHECK `guest_id_doc_last4_consent_check` (0070, kiểm dữ liệu cũ trước). Test: 23514. (b), (c) không thuộc phần BE-C được giao lần này |
| FB-R2-SEC-BE-77 (phần registration) | Minor | Done | `hasLongDigitRun`: thêm `,`, kiểm trên NFKC; không thêm ngoại lệ tiền/ngày. Có ca test |
| DATA A7-02 | P3 | Done | `work_order_overdue` chỉ phiếu TB/Thấp (`warning`). `work_order_high_open` `warning`, chuyển `critical` khi quá hạn (EP01 3.1). Chạy lại DS-0: còn 1 dòng |
| DATA A7-03 | P3 | Done | Theo `inRoomOnSql`, khách quá ngày đi chưa trả phòng vẫn ở căn → hết `room_status_mismatch` sai. Có ca test; DS-0 T3 khớp số tay |

Điểm cần ORC/ARC biết:
- **BE-73:** tới khi Desk gửi `partyMemberId` cho giấy tờ của người đặt, giấy tờ người đặt không khớp khóa hoặc tên + ngày sinh sẽ thành một người đi cùng "từ giấy tờ". Dữ liệu vẫn an toàn nhưng danh sách đoàn bị thừa người.
- Rủi ro còn lại: `updateGuestDocument` đổi người không gỡ khóa/last4 đã ghi lên hồ sơ người cũ (có từ trước). Đề xuất làm cùng BE-74/75 trước dữ liệu thật.
