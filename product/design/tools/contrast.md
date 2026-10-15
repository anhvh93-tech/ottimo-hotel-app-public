| Token | Sáng | Tối | Dùng cho | Round 0 (sáng / tối) |
|---|---|---|---|---|
| `--bg` | `#F4F0E8` | `#1B1A18` | Nền trang | #F4F0E8 / #1B1A18 |
| `--surface` | `#FBF9F4` | `#24221F` | Thẻ, input, modal, drawer | #FBF9F4 / #24221F |
| `--surface-2` | `#EEE8DC` | `#2D2A26` | Nền phụ, seg control, header bảng | #EEE8DC / #2D2A26 |
| `--side` | `#ECE5D8` | `#201E1C` | Sidebar | #ECE5D8 / #201E1C |
| `--ink` | `#2B2B2B` | `#EDE8DF` | Chữ chính; nền nút chính | #2B2B2B / #EDE8DF |
| `--ink-inverse` | `#FBF9F4` | `#1B1A18` | Chữ trên nền --ink (nút chính) | mới |
| `--muted` | `#635F58` | `#A9A398` | Chữ phụ (nhãn, mô tả) | #6B6760 / #A9A398 **(đổi)** |
| `--faint` | `#6A645B` | `#A39D92` | Chữ phụ cấp 3 (chú thích, nhãn nhóm menu) – vẫn đạt 4,5:1 | #9A948A / #7D776E **(đổi)** |
| `--deco` | `#9A948A` | `#7D776E` | CHỈ trang trí (icon không mang nghĩa, vạch kẻ chấm). CẤM dùng cho chữ | mới |
| `--line` | `#E0D8CA` | `#38342F` | Đường kẻ phân cách (trang trí) | #E0D8CA / #38342F |
| `--line-strong` | `#857E71` | `#857F75` | Viền ô nhập, checkbox, seg – thành phần UI cần ≥ 3:1 (R1 bước 4: #8C8578 → #857E71 để đạt 3:1 trên --side) | mới |
| `--oak` | `#B08D57` | `#C9A56E` | Màu thương hiệu: logo, minh họa, thanh biểu đồ, viền nhấn. Không dùng cho chữ nhỏ trên nền sáng | #B08D57 / #C9A56E |
| `--oak-ink` | `#7A5C2E` | `#D9B987` | Chữ/icon màu gỗ sồi, link, mục đang chọn | #86693B / #D9B987 **(đổi)** |
| `--oak-soft` | `#F1E7D6` | `#3A3226` | Nền nhấn nhẹ, mục đang chọn, dòng bảng đang chọn | #F1E7D6 / #3A3226 |
| `--focus` | `#7A5C2E` | `#D9B987` | Viền focus 2px + offset 2px | #B08D57 / #C9A56E **(đổi)** |
| `--focus-on-dark` | `#F4F0E8` | `#1B1A18` | Viền focus trên vùng nền tối (đầu trang app khách --bar-in, toast --ink) – R1 bước 4 | mới |
| `--ok` | `#356B49` | `#7FBF95` | Thành công / Đạt / Sẵn sàng | #3D7552 / #7FBF95 **(đổi)** |
| `--ok-bg` | `#E2EEE5` | `#22352A` | Nền chip thành công | #E2EEE5 / #22352A |
| `--warn` | `#8A5214` | `#E0A866` | Cảnh báo / Cần dọn / Sắp hết hạn | #9A5F1C / #E0A866 **(đổi)** |
| `--warn-bg` | `#F5E8D3` | `#3A2E1E` | Nền chip cảnh báo | #F5E8D3 / #3A2E1E |
| `--bad` | `#A8403C` | `#E58A84` | Lỗi / Không đạt / Khóa phòng / Quá hạn | #A8403C / #E58A84 |
| `--bad-bg` | `#F5DFDC` | `#3D2422` | Nền chip lỗi | #F5DFDC / #3D2422 |
| `--info` | `#3E5E78` | `#8DB0CC` | Thông tin / Có khách | #3E5E78 / #8DB0CC |
| `--info-bg` | `#E0E8EF` | `#22303B` | Nền chip thông tin | #E0E8EF / #22303B |
| `--bar-in` | `#2F2D2A` | `#E3DCCF` | Thanh rack: đang ở (in_house) | #2F2D2A / #E3DCCF |
| `--bar-in-t` | `#F4F0E8` | `#1B1A18` | Chữ trên thanh đang ở | #F4F0E8 / #1B1A18 |
| `--bar-cf` | `#C9A56E` | `#B8925A` | Thanh rack: đã xác nhận (confirmed) | #C9A56E / #B8925A |
| `--bar-cf-t` | `#2B2B2B` | `#1B1A18` | Chữ trên thanh đã xác nhận | #2B2B2B / #1B1A18 |
| `--bar-long` | `#5B7387` | `#7E98AD` | Thanh rack: hợp đồng dài hạn (đang ở/đã xác nhận) | #5B7387 / #7E98AD |
| `--bar-long-t` | `#FFFFFF` | `#111111` | Chữ trên thanh dài hạn | #FFFFFF / #111111 |
| `--scrim` | `rgba(27,26,24,.48)` | `rgba(0,0,0,.6)` | Nền mờ sau modal/drawer | mới |

| Cặp (chữ/UI trên nền) | Vị trí dùng | Yêu cầu | Sáng | Tối |
|---|---|---|---|---|
| `--ink` / `--bg` | Chữ chính trên nền trang | ≥ 4,5:1 | 12,46:1 ĐẠT | 14,25:1 ĐẠT |
| `--ink` / `--surface` | Chữ chính trên thẻ | ≥ 4,5:1 | 13,46:1 ĐẠT | 13,00:1 ĐẠT |
| `--ink-inverse` / `--ink` | Chữ nút chính | ≥ 4,5:1 | 13,46:1 ĐẠT | 14,25:1 ĐẠT |
| `--muted` / `--bg` | Chữ phụ trên nền trang | ≥ 4,5:1 | 5,58:1 ĐẠT | 6,94:1 ĐẠT |
| `--muted` / `--surface` | Chữ phụ trên thẻ | ≥ 4,5:1 | 6,03:1 ĐẠT | 6,33:1 ĐẠT |
| `--muted` / `--surface-2` | Chữ phụ trên nền phụ / header bảng; chữ nút bị khóa (thay opacity .5); thanh 'Đã kín' | ≥ 4,5:1 | 5,20:1 ĐẠT | 5,70:1 ĐẠT |
| `--muted` / `--side` | Menu chưa chọn trên sidebar | ≥ 4,5:1 | 5,07:1 ĐẠT | 6,63:1 ĐẠT |
| `--muted` / `--oak-soft` | Chữ phụ trên dòng đang chọn | ≥ 4,5:1 | 5,18:1 ĐẠT | 5,04:1 ĐẠT |
| `--faint` / `--bg` | Chú thích trên nền trang (R0: 2,65:1) | ≥ 4,5:1 | 5,15:1 ĐẠT | 6,46:1 ĐẠT |
| `--faint` / `--surface` | Chú thích trên thẻ (R0: 2,86:1) | ≥ 4,5:1 | 5,56:1 ĐẠT | 5,89:1 ĐẠT |
| `--faint` / `--side` | Nhãn nhóm menu | ≥ 4,5:1 | 4,67:1 ĐẠT | 6,17:1 ĐẠT |
| `--oak-ink` / `--bg` | Link / chữ nhấn trên nền trang | ≥ 4,5:1 | 5,44:1 ĐẠT | 9,31:1 ĐẠT |
| `--oak-ink` / `--surface` | Link / chữ nhấn trên thẻ | ≥ 4,5:1 | 5,87:1 ĐẠT | 8,49:1 ĐẠT |
| `--oak-ink` / `--oak-soft` | Chữ trên nền nhấn (R0: 4,18:1) | ≥ 4,5:1 | 5,04:1 ĐẠT | 6,75:1 ĐẠT |
| `--ok` / `--ok-bg` | Chip thành công | ≥ 4,5:1 | 5,25:1 ĐẠT | 6,08:1 ĐẠT |
| `--ok` / `--surface` | Chữ/icon thành công trên thẻ | ≥ 4,5:1 | 5,96:1 ĐẠT | 7,40:1 ĐẠT |
| `--warn` / `--warn-bg` | Chip cảnh báo (R0: 4,31:1) | ≥ 4,5:1 | 5,27:1 ĐẠT | 6,27:1 ĐẠT |
| `--warn` / `--surface` | Chữ cảnh báo trên thẻ | ≥ 4,5:1 | 6,05:1 ĐẠT | 7,53:1 ĐẠT |
| `--bad` / `--bad-bg` | Chip lỗi | ≥ 4,5:1 | 4,76:1 ĐẠT | 5,63:1 ĐẠT |
| `--bad` / `--surface` | Chữ lỗi dưới ô nhập | ≥ 4,5:1 | 5,76:1 ĐẠT | 6,27:1 ĐẠT |
| `--info` / `--info-bg` | Chip thông tin | ≥ 4,5:1 | 5,51:1 ĐẠT | 5,93:1 ĐẠT |
| `--bar-in-t` / `--bar-in` | Chữ trên thanh đang ở | ≥ 4,5:1 | 12,08:1 ĐẠT | 12,76:1 ĐẠT |
| `--bar-cf-t` / `--bar-cf` | Chữ trên thanh đã xác nhận | ≥ 4,5:1 | 6,13:1 ĐẠT | 6,04:1 ĐẠT |
| `--bar-long-t` / `--bar-long` | Chữ trên thanh dài hạn | ≥ 4,5:1 | 4,94:1 ĐẠT | 6,28:1 ĐẠT |
| `--focus` / `--bg` | Viền focus trên nền trang (R0: 2,72:1) | ≥ 3:1 | 5,44:1 ĐẠT | 9,31:1 ĐẠT |
| `--focus` / `--surface` | Viền focus trên thẻ | ≥ 3:1 | 5,87:1 ĐẠT | 8,49:1 ĐẠT |
| `--line-strong` / `--surface` | Viền ô nhập trên thẻ | ≥ 3:1 | 3,82:1 ĐẠT | 4,00:1 ĐẠT |
| `--line-strong` / `--bg` | Viền ô nhập trên nền trang | ≥ 3:1 | 3,54:1 ĐẠT | 4,38:1 ĐẠT |
| `--oak-ink` / `--surface-2` | Chữ nhấn trên nền phụ / seg đang chọn | ≥ 4,5:1 | 5,07:1 ĐẠT | 7,64:1 ĐẠT |
| `--ink` / `--oak-soft` | Chữ chính trên dòng/mục đang chọn | ≥ 4,5:1 | 11,56:1 ĐẠT | 10,34:1 ĐẠT |
| `--bad` / `--bg` | Chữ lỗi / quá hạn trên nền trang | ≥ 4,5:1 | 5,33:1 ĐẠT | 6,87:1 ĐẠT |
| `--warn` / `--bg` | Chữ cảnh báo trên nền trang | ≥ 4,5:1 | 5,60:1 ĐẠT | 8,25:1 ĐẠT |
| `--bad` / `--warn-bg` | Đếm ngược quá hạn trên nền cảnh báo | ≥ 4,5:1 | 5,01:1 ĐẠT | 5,22:1 ĐẠT |
| `--focus-on-dark` / `--bar-in` | Viền focus ở đầu trang app khách (R1 đo thực tế 2,22:1 – FB-R1-UXR-UXD-05) | ≥ 3:1 | 12,08:1 ĐẠT | 12,76:1 ĐẠT |
| `--focus-on-dark` / `--ink` | Viền focus trên toast / nền --ink | ≥ 3:1 | 12,46:1 ĐẠT | 14,25:1 ĐẠT |
| `--focus` / `--side` | Viền focus trên sidebar | ≥ 3:1 | 4,93:1 ĐẠT | 8,89:1 ĐẠT |
| `--focus` / `--surface-2` | Viền focus trên nền phụ / seg | ≥ 3:1 | 5,07:1 ĐẠT | 7,64:1 ĐẠT |
| `--focus` / `--oak-soft` | Viền focus trên dòng đang chọn | ≥ 3:1 | 5,04:1 ĐẠT | 6,75:1 ĐẠT |
| `--focus` / `--warn-bg` | Viền focus của nút trong alert cảnh báo | ≥ 3:1 | 5,11:1 ĐẠT | 7,07:1 ĐẠT |
| `--focus` / `--bad-bg` | Viền focus của nút trong alert lỗi | ≥ 3:1 | 4,85:1 ĐẠT | 7,63:1 ĐẠT |
| `--focus` / `--info-bg` | Viền focus của nút trong alert thông tin | ≥ 3:1 | 4,99:1 ĐẠT | 7,23:1 ĐẠT |
| `--line-strong` / `--side` | Viền ô nhập/seg đặt trên sidebar (R1: 2,92:1 – FB-R1-UXR-UXD-13) | ≥ 3:1 | 3,21:1 ĐẠT | 4,19:1 ĐẠT |
| `--line-strong` / `--surface-2` | Viền seg trên nền phụ | ≥ 3:1 | 3,30:1 ĐẠT | 3,60:1 ĐẠT |
| `--oak-ink` / `--surface` | Cột biểu đồ công suất (thay --oak 2,94:1 – FB-R1-UXR-UXD-03) | ≥ 3:1 | 5,87:1 ĐẠT | 8,49:1 ĐẠT |
| `--ok` / `--bad` | Phân biệt Đạt vs Lỗi chỉ bằng màu – KHÔNG đủ, bắt buộc icon + chữ (HR-11) | không áp dụng | 1,03:1 | 1,18:1 |
