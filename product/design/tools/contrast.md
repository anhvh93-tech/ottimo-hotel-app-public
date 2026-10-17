| Token CSS | Tên | HEX | Nhóm (tỷ lệ) |
|---|---|---|---|
| `--brand-ivory` | Ivory | `#F4F0E8` | Neutrals ~80% |
| `--brand-cream` | Cream | `#EDE6D8` | Neutrals ~80% |
| `--brand-stone` | Stone Grey | `#6B6760` | Neutrals ~80% |
| `--brand-ink` | Ink | `#2B2B28` | Neutrals ~80% |
| `--brand-oak` | Light Oak | `#B08D57` | Warm Woods ~15% |
| `--brand-earth` | Earth Brown | `#7A5C44` | Warm Woods ~15% |
| `--brand-sage` | Sage | `#8A9079` | Botanical ~5% |
| `--brand-white` | White | `#FFFFFF` | Cặp chữ–nền guideline p19 |

| Token | Sáng | Tối | Nguồn bảng màu | Dùng cho | v0.3 (sáng / tối) |
|---|---|---|---|---|---|
| `--bg` | `#F4F0E8` | `#1B1A18` | Ivory · tối: Ink pha đen | Nền trang | giữ |
| `--surface` | `#FBF9F4` | `#24221F` | Ivory pha White 50% · tối: Ink pha đen | Thẻ, input, modal, drawer | giữ |
| `--surface-2` | `#EDE6D8` | `#2B2B28` | Cream · tối: Ink | Nền phụ, seg control, header bảng, nút bị khóa | #EEE8DC / #2D2A26 **(đổi)** |
| `--side` | `#EDE6D8` | `#201E1C` | Cream · tối: Ink pha đen | Sidebar | #ECE5D8 / #201E1C **(đổi)** |
| `--cream` | `#EDE6D8` | `#2B2B28` | Cream · tối: Ink | Dải xen kẽ, thẻ nhấn nhẹ trên trang khách, nền phiếu/báo giá trên màn | **mới** |
| `--ink` | `#2B2B28` | `#EDE6D8` | Ink · tối: Cream | Chữ chính; nền nút chính (Desk, HK) | #2B2B2B / #EDE8DF **(đổi)** |
| `--ink-inverse` | `#F4F0E8` | `#1B1A18` | Ivory (guideline: Ivory trên Ink) | Chữ trên nền --ink (nút chính, toast) | #FBF9F4 / #1B1A18 **(đổi)** |
| `--muted` | `#6B6760` | `#A9A398` | Stone Grey · tối: tint Stone | Chữ phụ (nhãn, mô tả, header bảng) | #635F58 / #A9A398 **(đổi)** |
| `--faint` | `#6B6760` | `#A39D92` | Stone Grey · tối: tint Stone | Chữ phụ cấp 3 – từ v0.4 = Stone Grey như --muted (giữ tên để tương thích) | #6A645B / #A39D92 **(đổi)** |
| `--deco` | `#9A948A` | `#7D776E` | tint Stone (~65% Stone + Ivory) · tối: ~88% Stone + Ivory | CHỈ trang trí (icon không mang nghĩa, vạch kẻ chấm). CẤM dùng cho chữ | giữ |
| `--line` | `#E0D8CA` | `#38342F` | Cream 90% + Stone 10% · tối: ~84% Ink + Stone | Đường kẻ phân cách (trang trí) | giữ |
| `--line-strong` | `#857E71` | `#857F75` | tint Stone (~84% Stone + Ivory; sáng nắn ấm – ngoại lệ 2.4) | Viền ô nhập, checkbox, seg – thành phần UI cần ≥ 3:1 | giữ |
| `--oak` | `#B08D57` | `#BEA174` | Light Oak · tối: Light Oak 80% + Ivory 20% | Light Oak: logo, minh họa, nét kẻ nhấn, vạch trước nhãn. CẤM làm chữ trên nền sáng, CẤM làm nền cho chữ trắng | #B08D57 / #C9A56E **(đổi v0.4.1)** |
| `--oak-ink` | `#7A5C44` | `#D9B987` | Earth Brown · tối: tint Light Oak nắn sắc – ngoại lệ 2.4 | Chữ/icon nhấn, link, mục đang chọn – từ v0.4 = Earth Brown (tên cũ giữ để tương thích) | #7A5C2E / #D9B987 **(đổi)** |
| `--oak-soft` | `#F1E7D6` | `#3A3226` | Light Oak ~10% trên Ivory · tối: shade Light Oak – cả hai nắn sắc, ngoại lệ 2.4 | Nền nhấn nhẹ, mục đang chọn, dòng bảng đang chọn, cột hôm nay | giữ |
| `--earth` | `#7A5C44` | `#7A5C44` | Earth Brown | Nền nút thương hiệu (CTA trang khách, landing) – không đổi theo chế độ | **mới** |
| `--on-earth` | `#FFFFFF` | `#FFFFFF` | White (guideline: White trên Earth) | Chữ/icon trên nền --earth | **mới** |
| `--sage` | `#8A9079` | `#8A9079` | Sage | CHỈ trang trí ≤ 5% (chấm, minh họa, hoa văn). CẤM chữ và icon mang nghĩa trên nền sáng | **mới** |
| `--focus` | `#7A5C44` | `#D9B987` | Earth Brown · tối: tint Light Oak nắn sắc – ngoại lệ 2.4 | Viền focus 2px + offset 2px | #7A5C2E / #D9B987 **(đổi)** |
| `--focus-on-dark` | `#F4F0E8` | `#1B1A18` | Ivory | Viền focus trên vùng nền tối (đầu trang app khách, toast --ink) | giữ |
| `--ok` | `#356B49` | `#7FBF95` | Chức năng – ngoại lệ 2.4 | Thành công / Đạt / Sẵn sàng | giữ |
| `--ok-bg` | `#E2EEE5` | `#22352A` | Chức năng – ngoại lệ 2.4 | Nền chip/alert thành công | giữ |
| `--warn` | `#8A5214` | `#E0A866` | Chức năng – ngoại lệ 2.4 | Cảnh báo / Cần dọn / Sắp hết hạn | giữ |
| `--warn-bg` | `#F5E8D3` | `#3A2E1E` | Chức năng – ngoại lệ 2.4 | Nền chip/alert cảnh báo | giữ |
| `--bad` | `#A8403C` | `#E58A84` | Chức năng – ngoại lệ 2.4 | Lỗi / Không đạt / Khóa phòng / Quá hạn; nền nút nguy hiểm | giữ |
| `--bad-bg` | `#F7E5E2` | `#3D2422` | Chức năng – ngoại lệ 2.4 | Nền chip/alert lỗi (v0.4 nhạt hơn để chữ Stone đạt AA) | #F5DFDC / #3D2422 **(đổi)** |
| `--info` | `#3E5E78` | `#8DB0CC` | Chức năng – ngoại lệ 2.4 | CHỈ thông báo mức thông tin: alert/banner (C19), mục 'Cần chú ý' mức info (C20), khối ghi chú 6.14. KHÔNG cho trạng thái của đối tượng (chip, ô buồng, thanh, thẻ việc) – dùng chip `ink` (v0.4.1) | giữ màu · **đổi cách dùng v0.4.1** |
| `--info-bg` | `#E0E8EF` | `#22303B` | Chức năng – ngoại lệ 2.4 | Nền alert/khối thông tin (C19, 6.14), nền icon mức info trong 'Cần chú ý'. Không làm nền chip (v0.4.1) | giữ màu · **đổi cách dùng v0.4.1** |
| `--bar-in` | `#2B2B28` | `#E3DCCF` | Ink · tối: tint Cream | Thanh rack: đang ở (in_house) | #2F2D2A / #E3DCCF **(đổi)** |
| `--bar-in-t` | `#F4F0E8` | `#1B1A18` | Ivory | Chữ trên thanh đang ở | giữ |
| `--bar-cf` | `#BEA174` | `#BEA174` | Light Oak 80% + Ivory 20% – một tỷ lệ, cả hai chế độ | Thanh rack: đã xác nhận (confirmed) | #C9A56E / #B8925A **(đổi v0.4.1)** |
| `--bar-cf-t` | `#2B2B28` | `#1B1A18` | Ink | Chữ trên thanh đã xác nhận | #2B2B2B / #1B1A18 **(đổi)** |
| `--bar-long` | `#646859` | `#8A9079` | Sage Deep (Sage 60% + Ink 40%) · tối: Sage | Thanh rack + chip: hợp đồng dài hạn (thay xanh #5B7387 ngoài bảng) | #5B7387 / #7E98AD **(đổi)** |
| `--bar-long-t` | `#F4F0E8` | `#1B1A18` | Ivory · tối: Ink pha đen | Chữ trên thanh dài hạn | #FFFFFF / #111111 **(đổi)** |
| `--scrim` | `rgba(27,26,24,.48)` | `rgba(0,0,0,.6)` | Ink pha đen 48% | Nền mờ sau modal/drawer | giữ |

| Cặp (chữ/UI trên nền) | Vị trí dùng | Yêu cầu | Sáng | Tối |
|---|---|---|---|---|
| `--ink` / `--bg` | Chữ chính trên nền trang | ≥ 4,5:1 | 12,49:1 ĐẠT | 14,00:1 ĐẠT |
| `--ink` / `--surface` | Chữ chính trên thẻ; chữ chip `ink` (v0.4.1: Có khách, đã quét/đã gửi trước, đã nhận/đang xử lý…) | ≥ 4,5:1 | 13,50:1 ĐẠT | 12,78:1 ĐẠT |
| `--ink-inverse` / `--ink` | Chữ nút chính | ≥ 4,5:1 | 12,49:1 ĐẠT | 14,00:1 ĐẠT |
| `--muted` / `--bg` | Chữ phụ trên nền trang | ≥ 4,5:1 | 4,95:1 ĐẠT | 6,94:1 ĐẠT |
| `--muted` / `--surface` | Chữ phụ trên thẻ | ≥ 4,5:1 | 5,34:1 ĐẠT | 6,33:1 ĐẠT |
| `--muted` / `--surface-2` | Chữ phụ trên Cream: header bảng, chữ nút bị khóa, thanh 'Đã kín' – sát ngưỡng, không dưới 12px | ≥ 4,5:1 | 4,53:1 ĐẠT | 5,67:1 ĐẠT |
| `--muted` / `--side` | Menu chưa chọn trên sidebar (v0.3 với Stone: 4,49 – lý do sidebar chuyển sang Cream) | ≥ 4,5:1 | 4,53:1 ĐẠT | 6,63:1 ĐẠT |
| `--muted` / `--oak-soft` | Chữ phụ trên dòng đang chọn | ≥ 4,5:1 | 4,59:1 ĐẠT | 5,04:1 ĐẠT |
| `--faint` / `--bg` | Chú thích trên nền trang | ≥ 4,5:1 | 4,95:1 ĐẠT | 6,46:1 ĐẠT |
| `--faint` / `--surface` | Chú thích trên thẻ | ≥ 4,5:1 | 5,34:1 ĐẠT | 5,89:1 ĐẠT |
| `--faint` / `--side` | Nhãn nhóm menu | ≥ 4,5:1 | 4,53:1 ĐẠT | 6,17:1 ĐẠT |
| `--oak-ink` / `--bg` | Link / chữ nhấn Earth Brown trên nền trang | ≥ 4,5:1 | 5,37:1 ĐẠT | 9,31:1 ĐẠT |
| `--oak-ink` / `--surface` | Link / chữ nhấn trên thẻ | ≥ 4,5:1 | 5,80:1 ĐẠT | 8,49:1 ĐẠT |
| `--oak-ink` / `--oak-soft` | Chữ trên nền nhấn | ≥ 4,5:1 | 4,98:1 ĐẠT | 6,75:1 ĐẠT |
| `--ok` / `--ok-bg` | Chip thành công | ≥ 4,5:1 | 5,25:1 ĐẠT | 6,08:1 ĐẠT |
| `--ok` / `--surface` | Chữ/icon thành công trên thẻ | ≥ 4,5:1 | 5,96:1 ĐẠT | 7,40:1 ĐẠT |
| `--warn` / `--warn-bg` | Chip cảnh báo | ≥ 4,5:1 | 5,27:1 ĐẠT | 6,27:1 ĐẠT |
| `--warn` / `--surface` | Chữ cảnh báo trên thẻ | ≥ 4,5:1 | 6,05:1 ĐẠT | 7,53:1 ĐẠT |
| `--bad` / `--bad-bg` | Chip lỗi | ≥ 4,5:1 | 4,98:1 ĐẠT | 5,63:1 ĐẠT |
| `--bad` / `--surface` | Chữ lỗi dưới ô nhập | ≥ 4,5:1 | 5,76:1 ĐẠT | 6,27:1 ĐẠT |
| `--info` / `--info-bg` | Alert / khối thông tin (C19, 6.14) – từ v0.4.1 không còn chip info | ≥ 4,5:1 | 5,51:1 ĐẠT | 5,93:1 ĐẠT |
| `--bar-in-t` / `--bar-in` | Chữ trên thanh đang ở | ≥ 4,5:1 | 12,49:1 ĐẠT | 12,76:1 ĐẠT |
| `--bar-cf-t` / `--bar-cf` | Chữ trên thanh đã xác nhận | ≥ 4,5:1 | 5,77:1 ĐẠT | 7,07:1 ĐẠT |
| `--bar-long-t` / `--bar-long` | Chữ trên thanh / chip dài hạn (Sage Deep) | ≥ 4,5:1 | 5,04:1 ĐẠT | 5,26:1 ĐẠT |
| `--focus` / `--bg` | Viền focus trên nền trang | ≥ 3:1 | 5,37:1 ĐẠT | 9,31:1 ĐẠT |
| `--focus` / `--surface` | Viền focus trên thẻ | ≥ 3:1 | 5,80:1 ĐẠT | 8,49:1 ĐẠT |
| `--line-strong` / `--surface` | Viền ô nhập trên thẻ; viền chip `ink` (v0.4.1) | ≥ 3:1 | 3,82:1 ĐẠT | 4,00:1 ĐẠT |
| `--line-strong` / `--bg` | Viền ô nhập trên nền trang | ≥ 3:1 | 3,54:1 ĐẠT | 4,38:1 ĐẠT |
| `--oak-ink` / `--surface-2` | Chữ nhấn trên Cream / seg đang chọn | ≥ 4,5:1 | 4,91:1 ĐẠT | 7,60:1 ĐẠT |
| `--ink` / `--oak-soft` | Chữ chính trên dòng/mục đang chọn | ≥ 4,5:1 | 11,59:1 ĐẠT | 10,16:1 ĐẠT |
| `--bad` / `--bg` | Chữ lỗi / quá hạn trên nền trang | ≥ 4,5:1 | 5,33:1 ĐẠT | 6,87:1 ĐẠT |
| `--warn` / `--bg` | Chữ cảnh báo trên nền trang | ≥ 4,5:1 | 5,60:1 ĐẠT | 8,25:1 ĐẠT |
| `--bad` / `--warn-bg` | Đếm ngược quá hạn trên nền cảnh báo | ≥ 4,5:1 | 5,01:1 ĐẠT | 5,22:1 ĐẠT |
| `--focus-on-dark` / `--bar-in` | Viền focus ở đầu trang app khách | ≥ 3:1 | 12,49:1 ĐẠT | 12,76:1 ĐẠT |
| `--focus-on-dark` / `--ink` | Viền focus trên toast / nền --ink | ≥ 3:1 | 12,49:1 ĐẠT | 14,00:1 ĐẠT |
| `--focus` / `--side` | Viền focus trên sidebar | ≥ 3:1 | 4,91:1 ĐẠT | 8,89:1 ĐẠT |
| `--focus` / `--surface-2` | Viền focus trên nền phụ / seg | ≥ 3:1 | 4,91:1 ĐẠT | 7,60:1 ĐẠT |
| `--focus` / `--oak-soft` | Viền focus trên dòng đang chọn | ≥ 3:1 | 4,98:1 ĐẠT | 6,75:1 ĐẠT |
| `--focus` / `--warn-bg` | Viền focus của nút trong alert cảnh báo | ≥ 3:1 | 5,05:1 ĐẠT | 7,07:1 ĐẠT |
| `--focus` / `--bad-bg` | Viền focus của nút trong alert lỗi | ≥ 3:1 | 5,01:1 ĐẠT | 7,63:1 ĐẠT |
| `--focus` / `--info-bg` | Viền focus của nút trong alert thông tin | ≥ 3:1 | 4,93:1 ĐẠT | 7,23:1 ĐẠT |
| `--line-strong` / `--side` | Viền ô nhập/seg đặt trên sidebar | ≥ 3:1 | 3,24:1 ĐẠT | 4,19:1 ĐẠT |
| `--line-strong` / `--surface-2` | Viền seg trên nền phụ | ≥ 3:1 | 3,24:1 ĐẠT | 3,58:1 ĐẠT |
| `--oak-ink` / `--surface` | Cột biểu đồ công suất (không dùng --oak: 2,94:1) | ≥ 3:1 | 5,80:1 ĐẠT | 8,49:1 ĐẠT |
| `--ok` / `--bad` | Phân biệt Đạt vs Lỗi chỉ bằng màu – KHÔNG đủ, bắt buộc icon + chữ (HR-11) | không áp dụng | 1,03:1 | 1,18:1 |
| `--ink` / `--warn-bg` | Chữ thân trong alert cảnh báo, thanh mất mạng | ≥ 4,5:1 | 11,74:1 ĐẠT | 10,64:1 ĐẠT |
| `--ink` / `--bad-bg` | Chữ thân trong alert lỗi, thanh 'Chưa gán căn' | ≥ 4,5:1 | 11,67:1 ĐẠT | 11,47:1 ĐẠT |
| `--ink` / `--info-bg` | Chữ thân trong alert thông tin | ≥ 4,5:1 | 11,47:1 ĐẠT | 10,88:1 ĐẠT |
| `--ink` / `--ok-bg` | Chữ thân trong alert thành công | ≥ 4,5:1 | 11,90:1 ĐẠT | 10,50:1 ĐẠT |
| `--ink` / `--surface-2` | Chữ chính trên Cream (ô chỉ đọc, thanh 'Đã kín') | ≥ 4,5:1 | 11,43:1 ĐẠT | 11,43:1 ĐẠT |
| `--ink` / `--side` | Chữ chính trên sidebar | ≥ 4,5:1 | 11,43:1 ĐẠT | 13,38:1 ĐẠT |
| `--ink-inverse` / `--bad` | Chữ nút nguy hiểm (Hủy đơn, Thu hồi), badge đếm | ≥ 4,5:1 | 5,33:1 ĐẠT | 6,87:1 ĐẠT |
| `--info` / `--surface` | Icon mức info của mục 'Cần chú ý' (C20) trên thẻ; mã operationId (chỉ tài liệu hi-fi) | ≥ 4,5:1 | 6,49:1 ĐẠT | 6,96:1 ĐẠT |
| `--oak-ink` / `--side` | Icon/chữ mục đang chọn trên sidebar | ≥ 4,5:1 | 4,91:1 ĐẠT | 8,89:1 ĐẠT |
| `--ink` / `--cream` | Chữ chính trên Cream (dải/thẻ trang khách, phiếu trên màn) | ≥ 4,5:1 | 11,43:1 ĐẠT | 11,43:1 ĐẠT |
| `--muted` / `--cream` | Chữ phụ Stone trên Cream – sát ngưỡng, không dùng dưới 12px | ≥ 4,5:1 | 4,53:1 ĐẠT | 5,67:1 ĐẠT |
| `--oak-ink` / `--cream` | Link/nhãn Earth Brown trên Cream | ≥ 4,5:1 | 4,91:1 ĐẠT | 7,60:1 ĐẠT |
| `--focus` / `--cream` | Viền focus trên Cream | ≥ 3:1 | 4,91:1 ĐẠT | 7,60:1 ĐẠT |
| `--muted` / `--ok-bg` | Chữ phụ trong alert thành công | ≥ 4,5:1 | 4,71:1 ĐẠT | 5,20:1 ĐẠT |
| `--muted` / `--warn-bg` | Chữ phụ trong alert cảnh báo | ≥ 4,5:1 | 4,65:1 ĐẠT | 5,27:1 ĐẠT |
| `--muted` / `--bad-bg` | Chữ phụ trong alert lỗi (v0.3 bad-bg #F5DFDC + Stone: 4,41 – lý do làm nhạt bad-bg) | ≥ 4,5:1 | 4,62:1 ĐẠT | 5,69:1 ĐẠT |
| `--muted` / `--info-bg` | Chữ phụ trong alert thông tin – sát ngưỡng | ≥ 4,5:1 | 4,54:1 ĐẠT | 5,39:1 ĐẠT |
| `--on-earth` / `--earth` | Chữ nút thương hiệu: White trên Earth Brown | ≥ 4,5:1 | 6,10:1 ĐẠT | 6,10:1 ĐẠT |
| `--brand-ivory` / `--brand-earth` | Chữ Ivory trên Earth Brown (nhãn, huy hiệu) | ≥ 4,5:1 | 5,37:1 ĐẠT | 5,37:1 ĐẠT |
| `--brand-ink` / `--brand-oak` | Chữ Ink trên Light Oak (nhãn trên nền Oak) – sát ngưỡng | ≥ 4,5:1 | 4,59:1 ĐẠT | 4,59:1 ĐẠT |
| `--brand-white` / `--brand-oak` | White trên Light Oak – guideline p19 cho phép, đo KHÔNG đạt → CẤM cho chữ < 24px (dùng Earth Brown) | cấm (≥ 4,5:1 không đạt) | 3,09:1 KHÔNG ĐẠT – cấm | 3,09:1 KHÔNG ĐẠT – cấm |
| `--brand-ivory` / `--brand-oak` | Ivory trên Light Oak – như trên, CẤM | cấm (≥ 4,5:1 không đạt) | 2,72:1 KHÔNG ĐẠT – cấm | 2,72:1 KHÔNG ĐẠT – cấm |
| `--brand-stone` / `--brand-white` | Chữ phụ trên giấy trắng (phiếu in A5) | ≥ 4,5:1 | 5,62:1 ĐẠT | 5,62:1 ĐẠT |
| `--brand-ink` / `--brand-white` | Chữ chính trên giấy trắng (phiếu in A5) | ≥ 4,5:1 | 14,20:1 ĐẠT | 14,20:1 ĐẠT |
| `--brand-ivory` / `--brand-ink` | Ivory trên Ink (nền tối, chân trang, dải tối) | ≥ 4,5:1 | 12,49:1 ĐẠT | 12,49:1 ĐẠT |
| `--sage` / `--bg` | Sage trên Ivory – chỉ trang trí; guideline p19 'tránh Sage làm chữ trên nền sáng' | không áp dụng | 2,91:1 | 5,26:1 |
| `--oak` / `--bg` | Light Oak trên Ivory – chỉ nét kẻ/logo; guideline p19 'tránh Oak làm chữ trên nền sáng' | không áp dụng | 2,72:1 | 7,07:1 |
| `--bar-long` / `--bar-in` | Thanh dài hạn vs đang ở – khác độ sáng; vẫn bắt buộc tiền tố 'HĐ' + icon lịch tháng (D4) | không áp dụng | 2,48:1 | 2,43:1 |
| `--bar-long` / `--bar-cf` | Thanh dài hạn vs đã xác nhận – chế độ tối gần độ sáng, phân biệt bằng sắc độ + 'HĐ' + icon (D4) | không áp dụng | 2,33:1 | 1,35:1 |
| `--bar-cf` / `--bg` | Thanh đã xác nhận vs nền trang (v0.4: 2,03:1) – thanh luôn có chữ + icon ✓ (D4) | không áp dụng | 2,16:1 | 7,07:1 |
| `--bar-cf` / `--surface` | Thanh đã xác nhận vs ô lưới rack (nền --surface) | không áp dụng | 2,34:1 | 6,45:1 |
| `--bar-cf` / `--bar-in` | Thanh đã xác nhận vs đang ở – khác sắc (gỗ / Ink); icon ✓ vs giường (D4) | không áp dụng | 5,77:1 | 1,80:1 |

Kiểm nguồn tint/shade (v0.4.1): tỷ lệ gần nhất = phần màu thứ hai, cùng một tỷ lệ cho cả 3 kênh; lệch = khoảng cách RGB 8-bit tới màu pha đúng tỷ lệ đó; ≤ 4,5 = khớp.

| Token | Chế độ | Nguồn (màu 1 → màu 2) | Giá trị | Tỷ lệ gần nhất | Lệch | Kết quả |
|---|---|---|---|---|---|---|
| `--surface` | sáng | Ivory → White | `#FBF9F4` | Ivory 44% + White 56% | 1,4 | khớp |
| `--surface` | tối | Ink → đen | `#24221F` | Ink 80% + đen 20% | 1,9 | khớp |
| `--bg` | tối | Ink → đen | `#1B1A18` | Ink 61% + đen 39% | 0,9 | khớp |
| `--side` | tối | Ink → đen | `#201E1C` | Ink 71% + đen 29% | 1,6 | khớp |
| `--ink-inverse` | tối | Ink → đen | `#1B1A18` | Ink 61% + đen 39% | 0,9 | khớp |
| `--focus-on-dark` | tối | Ink → đen | `#1B1A18` | Ink 61% + đen 39% | 0,9 | khớp |
| `--bar-in-t` | tối | Ink → đen | `#1B1A18` | Ink 61% + đen 39% | 0,9 | khớp |
| `--bar-cf-t` | tối | Ink → đen | `#1B1A18` | Ink 61% + đen 39% | 0,9 | khớp |
| `--bar-long-t` | tối | Ink → đen | `#1B1A18` | Ink 61% + đen 39% | 0,9 | khớp |
| `--muted` | tối | Stone Grey → Ivory | `#A9A398` | Stone Grey 57% + Ivory 43% | 4,0 | khớp |
| `--faint` | tối | Stone Grey → Ivory | `#A39D92` | Stone Grey 61% + Ivory 39% | 4,0 | khớp |
| `--deco` | sáng | Stone Grey → Ivory | `#9A948A` | Stone Grey 67% + Ivory 33% | 3,3 | khớp |
| `--deco` | tối | Stone Grey → Ivory | `#7D776E` | Stone Grey 88% + Ivory 12% | 2,7 | khớp |
| `--line` | sáng | Cream → Stone Grey | `#E0D8CA` | Cream 89% + Stone Grey 11% | 1,5 | khớp |
| `--line` | tối | Ink → Stone Grey | `#38342F` | Ink 84% + Stone Grey 16% | 3,4 | khớp |
| `--line-strong` | sáng | Stone Grey → Ivory | `#857E71` | Stone Grey 84% + Ivory 16% | 6,4 | ngoại lệ 2.4 – viền ô nhập đã đo ≥ 3:1 trên 9 nền từ v0.3; lệch ấm nhẹ, không thấy bằng mắt |
| `--line-strong` | tối | Stone Grey → Ivory | `#857F75` | Stone Grey 83% + Ivory 17% | 3,4 | khớp |
| `--oak` | tối | Light Oak → Ivory | `#BEA174` | Light Oak 80% + Ivory 20% | 0,4 | khớp |
| `--oak-ink` | tối | Light Oak → Ivory | `#D9B987` | Light Oak 60% + Ivory 40% | 17,6 | ngoại lệ 2.4 – giữ độ bão hòa để link/chữ nhấn khác chữ Cream thường trên nền tối; tint đúng tỷ lệ xám hơn |
| `--focus` | tối | Light Oak → Ivory | `#D9B987` | Light Oak 60% + Ivory 40% | 17,6 | ngoại lệ 2.4 – cùng giá trị --oak-ink tối (viền focus phải nổi trên nền tối) |
| `--oak-soft` | sáng | Ivory → Light Oak | `#F1E7D6` | Ivory 90% + Light Oak 10% | 5,2 | ngoại lệ 2.4 – tint đúng tỷ lệ (~#EDE6DA) trùng Cream #EDE6D8 → mất nền 'đang chọn / hôm nay' |
| `--oak-soft` | tối | Light Oak → đen | `#3A3226` | Light Oak 35% + đen 65% | 8,4 | ngoại lệ 2.4 – như bản sáng: nền 'đang chọn' cần ánh gỗ để khác nền thẻ tối |
| `--bar-in` | tối | Cream → Ink | `#E3DCCF` | Cream 95% + Ink 5% | 0,3 | khớp |
| `--bar-cf` | sáng | Light Oak → Ivory | `#BEA174` | Light Oak 80% + Ivory 20% | 0,4 | khớp |
| `--bar-cf` | tối | Light Oak → Ivory | `#BEA174` | Light Oak 80% + Ivory 20% | 0,4 | khớp |
| `--bar-long` | sáng | Sage → Ink | `#646859` | Sage 60% + Ink 40% | 0,3 | khớp |
