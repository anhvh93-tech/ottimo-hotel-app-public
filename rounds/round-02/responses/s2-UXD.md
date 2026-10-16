# UXD – Round 2 · Sprint 2 – Phản hồi & sửa (đáp yêu cầu của FE)

- Vai: UXD | Ngày: 16/10/2026 | Đầu vào: `responses/s2-FE.md` (mục "Cần vai khác → UXD"), `reviews/s2-DOM.md` FB-R2-DOM-FE-02, OpenAPI 0.3.5-draft (`MoveReasonCode`, `CAPACITY_EXCEEDED_WARNING`, `ROOM_OCCUPIED`), `services/api` (`HOLD_LIMIT_REACHED` – SEC-BE-28)
- Vùng sửa: chỉ `product/design/**`. Chưa commit.
- Đã chạy: `gen_strings.py` → 1960 chuỗi + 8 mẫu; `check_hifi.py` → tất cả hi-fi xanh.

## 1. Chuỗi mới (22 khóa – nhóm "R2 Sprint 2 – phản hồi FE (s2-FE)")

| Yêu cầu FE | Khóa | VI | Tham số / ghi chú |
|---|---|---|---|
| Lý do đổi căn (A-19, BR-429) | `move.reason.guest_request` | Khách yêu cầu | |
| | `move.reason.property_fault` | Căn hỏng / sự cố | |
| | `move.reason.overbooking` | Xử lý trùng phòng / xung đột OTA | chỉ hiện khi `conflictState=open` hoặc `capacityConflict` |
| | `move.reason.upgrade` | Nâng hạng chủ động | FDL+ |
| | `move.reason.inventory_optimize` | Sắp căn để tránh đêm lẻ | |
| | `move.reason.force_majeure` | Bất khả kháng (ghi bằng chứng) | dời thay hủy, MGR+ |
| | `move.reason.other` | Khác (ghi rõ) | Nhãn ô: `move.reason` (đã có) |
| Gợi ý nguồn khách (DOM FE-02, D-6) | `bk.source_help` | Khách đã từng ở OTTIMO thì chọn Khách quay lại. CTV/môi giới chọn ở Kênh, không chọn ở đây. | dòng help dưới ô `directSource` |
| | `bk.source_auto_returning` | Đã chọn sẵn Khách quay lại (lần ở gần nhất {date}). Đổi được nếu không đúng. | `{date}` = `lastStayDate` dd/mm/yyyy; hiện thay `bk.source_help` khi FE tự chọn |
| "(đêm lẻ)" (A-05) | `bk.use_room_orphan` | Dùng căn {room} (đêm lẻ) | `{room}` |
| "Người chốt" (A-06) | `bk.closer_sales` | Người chốt | sale nội bộ; CTV giữ `bk.closer` |
| Toast 202 gia hạn báo giá (A-18) | `sale.extend_requested` | Đã gửi quản lý gia hạn báo giá {code} | `{code}` = mã BG |
| Vượt sức chứa OTA (A-20, DOM D-1) | `rsv.capacity_chip` | Vượt sức chứa (OTA) | chip drawer + rack (tone `bad`, icon `alert`) |
| | `rsv.capacity_conflict_body` | Đơn có {n} người, căn {room} tối đa {max}. Chưa nhận phòng được cho tới khi đổi căn, thêm căn hoặc sửa số người sau khi hỏi khách. | thay `error.CAPACITY_EXCEEDED` trong drawer |
| | `rack.capacity_conflict` | vượt sức chứa | ghi chú trên thanh + `aria-label` |
| | `booking.capacity_warning` | Căn {room} tối đa {max} người, đơn OTA có {n}. Vẫn lưu đơn? Ghi lý do và liên hệ khách. | hộp cảnh báo 422 `CAPACITY_EXCEEDED_WARNING` (H09, Đổi căn) |
| | `booking.capacity_reason` | Lý do vẫn lưu | ô `capacityWarningAckReason` (≥ 3 ký tự) |
| | `booking.capacity_reason_help` | Ví dụ: đã gọi khách, sẽ đổi sang căn lớn hơn khi có. | |
| | `field.CAPACITY_EXCEEDED_WARNING` | Số khách vượt tối đa của căn. Ghi lý do để vẫn lưu đơn OTA. | dự phòng khi không có `roomNo/max/n` |
| Chú giải "< 2 giờ" | `rack.legend_hold_urgent` | Giữ chỗ còn dưới {hours} giờ | `{hours}` = `hold_expiry_reminder_hours` (mặc định 2) |
| `HOLD_LIMIT_REACHED` | `field.HOLD_LIMIT_REACHED` | Bạn đang có {max} giữ chỗ chưa cọc – mức tối đa. Chốt cọc hoặc hủy bớt rồi giữ thêm. | mã trường `holdHours`; FE truyền `{max}` = `Problem.max` vào `fieldErrorText(t, fe, args)` |
| `ROOM_OCCUPIED` | `error.ROOM_OCCUPIED` | Căn {room} đang có khách ở trong khoảng khóa. Đổi phòng cho khách trước rồi mới khóa căn. | `{room}` từ `conflicts[0].roomNo` |

EN có đủ cho mọi khóa (xem `strings-en.json` hoặc `content-guide.md` mục 8, nhóm cùng tên).

## 2. CSS – chuyển vào `hifi/assets/hifi.css` mục 13 (DS v0.3.3a)
`.p-12`, `.row.wrap`, `.input.auto-w`, `.list-none` (+ `.plain-list` giữ tên cũ để FE không vỡ – mã mới dùng `.list-none`, tránh nhầm với `.list-plain` có dấu đầu dòng), `.rack .rm .rm-name`, `.rack-list .rowlink` (≥ 44 px), `.bar.hold.urgent` (viền + `.countdown` màu `--bad`). **FE xóa các khai báo trùng trong `packages/ui/src/styles/app.css`.** `design-system.md` mục 4.1 thêm 7 dòng ánh xạ. Hi-fi H08: chú giải có mẫu `bar hold urgent` + `rack.legend_hold_urgent`; ví dụ "Giữ chỗ còn < 2 giờ" bỏ style nội tuyến.

## 3. Giả định
- `HOLD_LIMIT_REACHED` chưa có trong OpenAPI 0.3.5 (chỉ thấy ở `services/api`, SEC-BE-28). UXD viết theo mã trường `holdHours` + `extras.max`. ARC nên thêm mã này vào bảng mã của OpenAPI.
- Nhãn lý do `force_majeure` có thêm "(ghi bằng chứng)" để nhắc ghi chú bắt buộc ngay trong danh sách.

## 4. File sửa
`product/design/tools/gen_strings.py`; `product/design/copy/strings-{vi,en,ru}.json`; `product/design/wireframes/assets/strings.js`; `product/design/tools/strings-tables.md`; `product/design/content-guide.md` (mục 8, lịch sử 0.3.6); `product/design/hifi/assets/hifi.css`; `product/design/hifi/08-rack.html`; `product/design/design-system.md` (mục 4.1).
