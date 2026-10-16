# Phản hồi BA – Round 2, Sprint 2 (bước Phản hồi & sửa)

- Người làm: BA | Ngày: 16/10/2026 | Không commit
- Đầu vào: `reviews/s2-DOM.md` (D-1…D-15, FB-R2-DOM-BA-01), `outputs/ARC/s2-contract.md` (A-03, A-04, A-05, A-06, A-08, A-13, A-18; nhóm B: B-06, B-09, B-10, B-14, B-16, B-20, B-26), OpenAPI 0.3.5-draft. Chỉ có **1 thẻ** gửi BA (`s2-ARC/SEC/UXD` không có thẻ `-BA-`).

## 1. Thẻ feedback

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R2-DOM-BA-01 | Done | Đã áp mục A của DOM vào specs và bỏ các nhãn giả định đã được trả lời. **EP02**: D-1 (mục 0 – OTA vượt sức chứa: cảnh báo + cờ `capacity` + chặn B9; kênh khác vẫn chặn 422), D-5 (9.1 – 7 lý do, ràng buộc vai/chế độ, OTA đổi ngày = hủy + tạo lại), D-7 (3.2 – Nội bộ). **EP03-05** 1.3: điều kiện `not_unassigned` gồm cờ `capacity`. **EP07-08**: D-12 a…h (bỏ nhãn; thêm cờ "Kiểm chưa đạt" + cảnh báo khi nhận phòng – đề nghị ARC E07-17; thêm loại `drain` vào nhóm mức Cao). **EP14**: D-13 a, c, d; D-13 b giữ nhãn `[GIẢ ĐỊNH – chờ INV xác nhận]` đúng như DOM yêu cầu; `report_issue` ngoài giờ báo ngay; câu trả lời tự động luôn có số điện thoại. **EP01**: D-14 a–c. Các dòng E02-07, E07-15, E14-07, E01-08 ghi "Đã trả lời" |

## 2. Việc ORC giao

| # | Việc | Kết quả |
|---|---|---|
| 1 | ARC A-03: khối OOO trùng đơn luôn 409; xác nhận của MGR không vượt được chống trùng | **EP02 mục 12**: `roomId` → `409 ROOM_OCCUPIED` khi có khách đang ở; `affectedReservationsAcknowledged` chỉ ghi nhận người xác nhận; thêm thứ tự lỗi `ROOM_NOT_SELLABLE → ROOM_OCCUPIED → ROOM_BLOCKED → ROOM_UNAVAILABLE`; mở khóa trước hạn = mở bán từ đêm nay + hộp nhắc dọn (D-4). **EP07-08** mục 6.1/6.2 (phần khóa phòng – mục 4 là kiểm phòng nên áp ở mục 6): như trên; bỏ đường "quản lý xác nhận rồi lưu"; thêm thông báo cho `ROOM_BLOCKED` |
| 2 | A-04: `markNoShow` một bước | **EP02 11.2**: nút theo `allowedActions` + `noShowAvailableFrom` ("Mở lúc {time}"), client không khóa theo giờ máy; thiếu ghi chú → `422` với `errors[{field: contactAttemptNote, code: REASON_REQUIRED}]` (kể cả khi chưa tới giờ); chưa tới mốc → `409 INVALID_TRANSITION` + `currentState` + `availableFrom`; `If-Match` lệch → 412. **11.3** khôi phục: áp D-3 (OTA luôn qua MGR+; căn đã bán lại → về làn chưa gán, không trả 409 sau khi đã duyệt; đêm đã qua vẫn tính tiền) |
| 3 | Quyết định DOM | (a) OTA vượt sức chứa – mục 0 + EP03-05 1.3. (b) Hạn báo giá **D-2** – 10.2: `expiresAt` = 00:00 ngày (ngày lập + `quote_validity_days` + 1), tính theo ngày lịch; khách thấy "đến 23:59"; có biên 23:59:59 / 00:00:00. (c) **D-5** 7 lý do – 9.1. (d) **D-6** một kênh `direct` + 5 nguồn (nghĩa, thứ tự ưu tiên, chọn sẵn `returning`) – 3.2. (e) **D-9** giữ chỗ cọc thiếu – 10.6: không tự hủy, báo đỏ, 3 lối ra trước trần 12:00 ngày đến; kèm **A-13** cọc thiếu → `200` + `status=hold` + `depositPaidVnd`. Thêm: D-8 (bậc giảm BR-107 tính lại khi đổi số đêm – 9.1), A-05 (gợi ý căn đêm lẻ – 3.2), A-18 (`extendQuote` – 10.4), D-15 (EP07-08: ảnh sau sửa bắt buộc với `[high, medium]`, gói dọn mặc định 0 cho đơn nhập tay; EP14: loại yêu cầu có phí), ARC B-09 (`lockRequested` → `blockRequested`), B-14/B-16 (`listGuestRequestOptions` + `feeAccepted` thay E14-04), B-20 (`VALUE_OUT_OF_RANGE`) |
| 4 | rbac A-06, A-18 + chạy công cụ | `rbac-matrix.json` 0.2.2: A51 `operationIds: [extendQuote]`; thêm hành động `A01-closer` → `listCloserCandidates` (FD+). `rbac-matrix.md`: dòng A51 ghi operation, D27 + ghi chú 37 (chỉ tên hiển thị người chốt ở S05). **`gen_rbac_cases.py --check` exit 0** (181 operation, 1.991 ca, rbac mismatch []). **`gen_traceability.py --strict` exit 0** (ra thư mục tạm, không ghi đè `qa/traceability.md`): AC 250/250, ops/fields mismatched 0, `x-rbac-field` 130 |

Ngoài ra: **EP00 V-02** – đồng ý ARC B-26 (`User` không trả SĐT nên không cần `pattern`); câu chữ đã sửa lại cho khớp.

## 3. File đã sửa (bước này)
- `product/docs/specs/EP02-reservations.md` (mục 0, 3.2, 9.1, 10.2, 10.4, 10.6, 11.2, 11.3, 12, 14)
- `product/docs/specs/EP03-05-stay.md` (1.3 `not_unassigned`)
- `product/docs/specs/EP07-08-housekeeping-maintenance.md`, `EP14-guest-app.md`, `EP01-dashboard.md` (+ lịch sử thay đổi)
- `product/docs/specs/EP00-platform.md` (V-02)
- `product/docs/rbac-matrix.md`, `product/docs/rbac-matrix.json`
- `rounds/round-02/responses/s2-BA.md`

## 4. Còn mở (không thuộc quyền BA)
- **ARC (FB-R2-DOM-ARC-01)**: chưa có trong 0.3.5 tên mã cảnh báo sức chứa OTA + trường lý do + `conflictKind: capacity`, enum `MoveReasonCode`, cách khôi phục no-show khi phải đổi căn. Specs đang ghi tên gợi ý, sẽ đổi khi ARC chốt. Thêm đề nghị mới: E07-17 (`warnings[] inspection_failed`, loại `drain`), `acceptShortfallReason` cho `confirmDeposit` (D-9 lối ra 2).
- **PO**: US-056 với đơn nhập tay (B-06), BR-435 ở R2 (B-22), US-012 AC3 ↔ SR-RET-06 (E01-06).
- **SEC**: duyệt ĐK-2 cho `listGuestRequestOptions`, `feeAccepted`, `replyNote`, `declinedReasonCode` (B-15, B-16) trước khi BE cài.
- **INV** (qua ESC cuối round do PO gom): cách hiểu BR-506 cho khách ngắn ngày (D-13 b).

## 5. Bổ sung – áp quyết định PO (`responses/s2-PO.md` mục 3) và đồng bộ tên OpenAPI 0.3.5-draft

| Việc | Đã sửa |
|---|---|
| US-056 dời R3 | EP07-08: phạm vi, mục 3.1 (`long_stay_clean` R3), 3.5 (khung R3, R2 không `cleaningPlan`), truy vết, E07-06 đóng |
| US-012 AC3 theo SEC + AC8 BR-435 | EP01: phạm vi, 3.1 (`foc_threshold` tính khi OWN mở trang), 3.3, 3.4 (mã đơn + căn), truy vết AC8; E01-05/06 "Đã quyết"; thêm `capacity_conflict` (0.3.5) |
| R2 ẩn nút "Thêm người dùng" | EP00 mục 2 (US-008 Must R3) |
| US-017 AC9 người chốt | EP02 3.2 `closerUserId` ĐK bắt buộc (kênh `agent` → CTV; nguồn `sales_staff` → SAL; chọn từ `listCloserCandidates`), truy vết |
| US-025 AC7 | EP03-05 1.4 `doorAccessHandedOver` không bắt buộc, tick bổ sung từ chi tiết đơn; đề nghị ARC **E03-06** (`ReservationPatch.doorAccessHandedOver` – chưa có đường API trong 0.3.5) |
| Đồng bộ tên 0.3.5 | `MoveReasonCode` (+ `overbooking` khi `capacityConflict`, `force_majeure` chỉ `postpone_instead_of_cancel`), `CAPACITY_EXCEEDED_WARNING` + `capacityWarningAckReason`, `Reservation.capacityConflict` + điều kiện nhận phòng `capacity_within_max` (EP03-05 1.3), `restoreNoShow` `roomId`/`allowUnassigned` (EP02 11.3) |

`gen_traceability.py --strict` (ra thư mục tạm): **exit 1** – chỉ vì 3 AC mới của PO chưa có TC: US-012 AC8, US-017 AC9, US-025 AC7 (AC 248/251). Không có lỗi tham chiếu, rbac lệch 0, Must R2 71/71 có phủ. TC mới là việc QA đã được PO giao (s2-PO mục 3); chạy lại sau khi QA thêm TC sẽ về 0. `acceptShortfallReason` (D-9) vẫn chưa có trong 0.3.5 – giữ ở dạng đề nghị.
