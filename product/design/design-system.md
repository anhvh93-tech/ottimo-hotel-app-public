# Design System OTTIMO – v0.3.5

- Người viết: UXD | Round 1 – Bước 2 (Sản xuất), đợt 2; cập nhật Bước 4 (phản hồi review) | Ngày: 15–16/10/2026
- Trạng thái: **Bản nháp chờ review** (bắt buộc: UXR, PO; khuyến nghị: FE, MOB, DOM). Đợt 4 đã chỉnh theo `rbac-matrix.md`, `state-machines.md` (BA), `erd.md`, `openapi.yaml` (ARC) và `security-requirements.md` (SEC) – xem mục 11.
- Token máy đọc: `product/design/tokens.json` (định dạng W3C Design Tokens). CSS sinh ra: `product/design/wireframes/assets/tokens.css`. Không sửa tay CSS/JSON – sửa nguồn trong `product/design/tools/gen_tokens.py` rồi chạy lại.
- Minh họa sống: `product/design/wireframes/index.html` (9 luồng, có công tắc sáng/tối, trạng thái tải/rỗng/lỗi/mất mạng, ngôn ngữ).
- **Hi-fi R2**: `product/design/hifi/index.html` – 24 màn (H01–H12 Đợt 0, H13–H18 Sprint 3, H19–H24 Sprint 4), component thật trong `hifi/assets/hifi.css`, kiểm bằng `tools/check_hifi.py`.
- Nội dung chữ: `product/design/content-guide.md`, chuỗi `product/design/copy/strings-{vi,en,ru}.json`.
- Đầu vào: BL mục 6 (design system prototype), BL 8.3 (a11y), `research/heuristic-review-r0.md` (HR-01…HR-25), `research/personas.md`, PRD, `business-rules.md`.

---

## 1. Nguyên tắc

| # | Nguyên tắc | Hệ quả thiết kế |
|---|---|---|
| D1 | **Giữ nhận diện OTTIMO, sửa cho đạt chuẩn** – kem giấy, chữ than, nhấn gỗ sồi, Lora + Be Vietnam Pro (BL 6.1) | Không đổi màu thương hiệu `--oak` #B08D57; chỉ thêm biến thể đậm `--oak-ink` cho chữ/focus và làm đậm các màu chữ không đạt AA |
| D2 | **Hai giọng giao diện, một hệ thống** – nhân viên cần nhanh, dày thông tin; khách cần ấm, thoáng, ít bước | Cùng token; khác mật độ: *Desk* (máy tính quầy), *Touch* (điện thoại – lễ tân/sale/chủ đầu tư/khách), *HK* (buồng phòng – nút to, chữ to) |
| D3 | **Đúng tiền, đúng luật trước** – không mặc định phát sinh phí, không báo "Đạt" giả, không xóa không hỏi | Mẫu bắt buộc: Phụ thu chủ động (mục 6.3), Kiểm tra 3 trạng thái (6.4), Xác nhận phá hủy (6.1) |
| D4 | **Không chỉ bằng màu** | Mọi trạng thái = chữ + icon (+ hoa văn ở rack) – HR-11 |
| D5 | **Không mất dữ liệu khi bị ngắt quãng** | Nháp tự lưu, hỏi trước khi bỏ thay đổi, thao tác offline xếp hàng (HR-05, US-058) |
| D6 | **Số nghiệp vụ không nằm trong thiết kế** | Nhãn chỉ tham chiếu mã BR; số tiền trên wireframe là ví dụ tính từ BR (QC B3) |

## 2. Màu

### 2.1 Bảng token (sáng + tối)

Token đổi so với Round 0 được đánh dấu **(đổi)**. Màu nền, bề mặt, thương hiệu giữ nguyên để giữ cảm giác OTTIMO.

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

Quy tắc dùng:
- **Chữ** chỉ dùng: `--ink`, `--muted`, `--faint`, `--oak-ink`, `--ok`, `--warn`, `--bad`, `--info`, `--bar-*-t`, `--ink-inverse`. **Cấm** dùng `--deco`, `--line`, `--line-strong`, `--oak` cho chữ (trừ chữ ≥ 24px đậm trên nền tối).
- `--faint` R0 (#9A948A) được đổi tên thành `--deco` và **chỉ dùng trang trí**; `--faint` mới đạt ≥ 4,5:1 trên mọi nền.
- **Viền thành phần UI** cần nhận biết (ô nhập, checkbox, seg, nút phụ) dùng `--line-strong` (≥ 3:1). `--line` chỉ cho đường kẻ phân cách.
- **Focus** luôn `--focus` 2px + offset 2px (không dùng `--oak` như R0: 2,72:1). Trên **vùng nền tối** (đầu trang app khách `--bar-in`, toast `--ink`) dùng `--focus-on-dark` (12,08:1 sáng / 12,76:1 tối) – lớp `.on-dark` (Bước 4, FB-R1-UXR-UXD-05). Bảng 2.2 đo cả viền focus trên mọi nền có điều khiển (side, surface-2, oak-soft, nền alert).
- **Nút bị khóa** không dùng `opacity`: nền `--surface-2`, chữ `--muted` (5,20:1), viền đứt `--line-strong` – lý do ghi trên nút phải đọc được (Bước 4).
- Nền chip `*-bg` chỉ đi với chữ cùng tông (`--ok` trên `--ok-bg`…).

### 2.2 Bảng kiểm tương phản (đo theo công thức WCAG 2.2, cả sáng và tối)

Dùng mục 3–4 của `heuristic-review-r0.md` làm checklist. Mọi cặp chữ ≥ 4,5:1, thành phần UI ≥ 3:1. Kết quả: **0 cặp không đạt**.

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
| `--ink-inverse` / `--bad` | Chữ nút "nguy hiểm", badge đếm | ≥ 4,5:1 | 5,76:1 ĐẠT | 6,87:1 ĐẠT |
| `--ink` / `--warn-bg` | Chữ thân trong alert cảnh báo, thanh mất mạng (hi-fi R2) | ≥ 4,5:1 | 11,71:1 ĐẠT | 10,83:1 ĐẠT |
| `--ink` / `--bad-bg` | Chữ thân trong alert lỗi, thanh 'Chưa gán căn' (hi-fi R2) | ≥ 4,5:1 | 11,11:1 ĐẠT | 11,68:1 ĐẠT |
| `--ink` / `--info-bg` | Chữ thân trong alert thông tin, khối 'bộ đồ dùng thêm' (hi-fi R2) | ≥ 4,5:1 | 11,43:1 ĐẠT | 11,07:1 ĐẠT |
| `--ink` / `--ok-bg` | Chữ thân trong alert thành công (hi-fi R2) | ≥ 4,5:1 | 11,86:1 ĐẠT | 10,68:1 ĐẠT |
| `--ink` / `--surface-2` | Chữ chính trên nền phụ (ô chỉ đọc, thanh 'Đã kín') (hi-fi R2) | ≥ 4,5:1 | 11,60:1 ĐẠT | 11,70:1 ĐẠT |
| `--ink` / `--side` | Chữ chính trên sidebar (hi-fi R2) | ≥ 4,5:1 | 11,30:1 ĐẠT | 13,62:1 ĐẠT |
| `--info` / `--surface` | Chữ/icon thông tin trên thẻ, mã operationId (hi-fi R2) | ≥ 4,5:1 | 6,49:1 ĐẠT | 6,96:1 ĐẠT |
| `--oak-ink` / `--side` | Icon/chữ mục đang chọn trên sidebar (hi-fi R2) | ≥ 4,5:1 | 4,93:1 ĐẠT | 8,89:1 ĐẠT |
| `#2B2B2B` / `--oak` | Số chú thích tròn trong wireframe (chỉ tài liệu) | ≥ 4,5:1 | 4,58:1 ĐẠT | – |

Ghi chú: `--ok` vs `--bad` chỉ khác nhau 1,03:1 về độ sáng → người mù màu đỏ–lục không phân biệt được (HR-11). Vì vậy **mọi** chỗ dùng hai màu này đều có icon khác nhau (✓ / ✕ / ?) và chữ.

### 2.3 Màu trạng thái

**Trạng thái đơn** (tên kỹ thuật theo BR-301 / decision-log – không đổi tên):

| `status` | Nhãn VI | Nhãn EN | Thanh rack | Icon | Phân biệt không cần màu |
|---|---|---|---|---|---|
| `hold` | Giữ chỗ · chờ cọc | On hold · awaiting deposit | nền `--surface`, viền **đứt** 2px `--oak-ink` | đồng hồ cát | viền đứt + bộ đếm "còn 5 giờ 20 phút" |
| `confirmed` | Đã xác nhận | Confirmed | `--bar-cf` | dấu ✓ | icon + nhãn trong drawer |
| `in_house` | Đang ở | In house | `--bar-in` (đậm) | giường | icon |
| `checked_out` | Đã trả phòng | Checked out | `--surface-2`, chữ `--muted` | cửa ra | icon, nhạt |
| `cancelled` | Đã hủy | Cancelled | **không hiện trên rack** | ✕ | chip gạch ngang trong danh sách/CRM |
| `no_show` | Không đến | No-show | **không hiện trên rack** | người ✕ | chip `bad` |
| (loại) dài hạn | Hợp đồng dài hạn | Long-term lease | `--bar-long` + tiền tố "HĐ" | lịch tháng | tiền tố chữ "HĐ" |
| (khối) OOO | Khóa phòng | Out of order | sọc chéo 45° `--bad-bg`/`--surface`, viền `--bad` | ổ khóa | sọc + ổ khóa + lý do |
| `confirmed` + `conflictState=open` | Chưa gán căn – xung đột OTA | Unassigned – OTA conflict | làn riêng trên lưới; thanh `--bad-bg`, viền **đứt** 2px `--bad` | cảnh báo | làn có tiêu đề chữ + "cần gán căn" |
| (dạng xem sale/CTV) `unavailable` | Đã kín / Không bán | Taken / Not for sale | nền đặc `--surface-2`, viền đứt `--line-strong`, chữ `--ink` (Bước 4: bỏ sọc dưới chữ – 4,49:1) | – | chữ "Đã kín"; không tên khách |

**Trạng thái buồng** (BR-801): giao diện quản lý hiện **mã + nhãn** ("VD · Trống, cần dọn"); giao diện buồng phòng hiện **câu thường** không mã (HR-13) – xem `content-guide.md` mục 5.

| Mã | Tông | Icon |
|---|---|---|
| VC | **oak** (Bước 4: không dùng `ok` để khỏi nhầm với "Sẵn sàng" – FB-R1-UXR-UXD-09) | lấp lánh |
| VI | ok | khiên ✓ |
| VD | warn | chổi |
| CL | oak | chổi (nền oak-soft) |
| OC | info | người |
| OD | warn | người + chổi |
| OOO | bad | ổ khóa |

**Kết quả kiểm tra** (HR-07): `pass` Đạt (ok, ✓, viền liền) · `fail` Không đạt (bad, ✕, viền liền 2px) · `unknown` Chưa kiểm được – cần kiểm tay (warn, ?, viền **đứt** 2px).

**Khai báo lưu trú** (BR-607, SM-05): `none` neutral · `partial` warn · `review` warn · `scanned` info · `pre` info · `sent` oak · `confirmed` ok · `needs_update` warn · `updated` ok · `void` neutral gạch ngang.

**Yêu cầu khách** (SM-15): `new` neutral · `acknowledged` info · `in_progress` info · `done` ok · `declined` neutral. **Yêu cầu duyệt** (SM-10): `pending` warn · `approved` ok · `rejected` bad · `escalated` warn · `cancelled` neutral. **Hoa hồng** (SM-11): `projected` neutral · `earned` info · `payable` warn · `paid` ok · `void` neutral gạch ngang.

## 3. Chữ

| Token | Font | Cỡ / dòng | Dùng cho |
|---|---|---|---|
| `display` | Lora 600 | 32 / 1,2 | Màn hoàn tất của khách, tiêu đề lớn app khách |
| `h1` | Lora 600 | 24 / 1,25 | Tiêu đề màn hình (R0: 22) |
| `h2` | Lora 600 | 19 / 1,3 | Tiêu đề thẻ, modal |
| `h3-label` | Be Vietnam Pro 600, chữ hoa, giãn .1em | **12** / 1,4 | Nhãn nhóm (R0: 11px – tăng lên 12) |
| `kpi` | Lora 600, tabular-nums | 26 / 1,15 | Số KPI, số căn, tổng bill |
| `body-desk` | Be Vietnam Pro 400 | 14 / 1,5 | Thân chữ máy tính quầy |
| `body-mobile` | Be Vietnam Pro 400 | **16** / 1,5 | Thân chữ mọi màn điện thoại (tránh iOS tự phóng ô nhập) |
| `body-hk` | Be Vietnam Pro 500 | **17** / 1,45 | Giao diện buồng phòng/bảo trì |
| `caption` | Be Vietnam Pro 400 | **12** / 1,45 | Chữ phụ nhỏ nhất trên máy tính |

Quy tắc:
- **Cỡ tối thiểu**: máy tính 12px (kể cả nhãn chú thích wireframe, `.api`, `.role-tag` – Bước 4 bỏ 11px); điện thoại 14px (chữ phụ, chip, nhãn thanh dưới, chữ toast 16px), 16px (thân, ô nhập); buồng phòng **16px cho mọi chữ** (thân 17px; nhãn ô nhập, chip, alert, thanh dưới 16px). Bỏ hết cỡ 9,5 / 10 / 10,5px của R0 (HR-10).
- Đơn vị `rem` trong code, để phóng chữ của hệ điều hành/trình duyệt có tác dụng tới 200% không vỡ bố cục (WCAG 1.4.4).
- Số tiền, giờ, số căn: `font-variant-numeric: tabular-nums`. Định dạng tiền theo `content-guide.md` mục 4.
- **Tự host font** (SIL Open Font License 1.1 – miễn phí, không cần ESC): Lora (biến thiên 500–600 + italic 500), Be Vietnam Pro 400/500/600, định dạng woff2, `font-display: swap`, subset `latin`, `latin-ext`, `vietnamese`. Be Vietnam Pro **không có ký tự Cyrillic** → chuỗi tiếng Nga rơi về `system-ui` (Roboto/San Francisco/Segoe đều có Cyrillic); Lora có Cyrillic → tiêu đề RU vẫn dùng Lora. FE/MOB kiểm tra lại ở R3 (chữ Nga dài).
- Mã đơn, mã hồ sơ khai báo, nội dung chuyển khoản: `mono`.

## 4. Khoảng cách, bo góc, kích thước, chuyển động

- **Lưới 4px**: `space` 0, 2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64. Lề trang: máy tính 16–24px, điện thoại 16px. Khoảng cách giữa thẻ 12px; trong thẻ 14–16px.
- **Bo góc**: `sm` 6 (seg trong), `md` 8 (nút, ô nhập), `lg` 12 (thẻ, thẻ buồng phòng 14), `xl` 16 (modal, bottom sheet 20), `pill` 999 (chip), `phone` 36 (khung minh họa).
- **Vùng chạm**: máy tính ≥ 32px chiều cao (WCAG 2.5.8 yêu cầu 24px); điện thoại ≥ 44×44px; buồng phòng ≥ **48px**, nút chính **56px**, khoảng cách giữa hai nút ≥ 8px. Áp cho **mọi** điều khiển trong mật độ đó, kể cả nút trong toast (Hoàn tác 48px ở HK), seg (44 / 48px), `.btn.sm` (44 / 48px), ô tích (44px). Kiểm bằng DevTools ở 360px cho mọi điều khiển của HK trước khi nộp (Bước 4, FB-R1-UXR-UXD-04).
- **Kích thước khung**: sidebar 240 (R0 232), drawer 460, modal 480 / 720, cột rack 72 (tối thiểu 56), dòng rack 48.
- **Breakpoint**: 360 (điện thoại nhỏ), 480, 768 (dưới mức này: rack chuyển dạng danh sách, sidebar → thanh điều hướng dưới ≤ 5 mục), 1024, 1280.
- **Bóng**: `sm` cho thẻ nổi nhẹ; `lg` cho drawer, modal, toast, bottom sheet.
- **Chuyển động**: 150ms (hover, công tắc), 200ms (mở modal mờ dần), 280ms (drawer/bottom sheet trượt); easing `cubic-bezier(.2,0,0,1)`. `prefers-reduced-motion` → 0ms, skeleton không chạy sóng.
- **Thời gian**: toast tự ẩn ≥ 6 giây, dừng khi rê chuột/focus; hoàn tác 10 giây; skeleton chỉ hiện nếu tải > 300ms.
- **z-index**: sticky 10 · drawer 40 · modal 50 · toast 60.

### 4.1 Lớp tiện ích dùng chung FE/MOB thay style nội tuyến (v0.3.3 – FB-R2-UXD-FE-15)
Định nghĩa ở `hifi/assets/hifi.css` mục 13 (FE/MOB dùng thẳng file này như hiện nay). Chỉ giá trị trên lưới 4px; giá trị lệch lưới trong code (6, 10, 14, 18px) quy về lớp gần nhất bên dưới. Hi-fi H04, H19–H24, index đã bỏ hết `style=` (trừ vị trí lưới rack H08 – dữ liệu động, được phép).

| Mẫu nội tuyến đang gặp (admin-web) | Lớp thay thế |
|---|---|
| `<p className="muted" style={{fontSize:'.75rem', margin…}}>` (chú thích nhỏ) | `.caption` (+ `.mt-8` / `.mt-12`) |
| `<fieldset style={{border:0, margin:'0 0 14px', padding:0}}>` + `<legend style={{fontWeight:500, fontSize:'.8125rem', marginBottom:4}}>` | `.fieldset-plain` (legend tự đúng kiểu; `.fieldset-plain.flush` khi không cần lề dưới) |
| `<fieldset className="card" style={{background:'var(--bg)', margin:'0 0 14px'}}>` | `.card.inset` |
| `<hr className="hr" style={{margin:'4px 0'}}>` | `.hr.tight` |
| `<div style={{padding:'8px 10px'}}>` (đầu menu người dùng) | `.menu-head` (8px 12px) |
| `<div className="rowlink" style={{cursor:'default'}}>` | `.rowlink.static` |
| `<div style={{display:'contents'}}>` | `.contents` |
| `<div className="alert warn" style={{margin:0, borderRadius:0}}>` (thanh dev) | `.alert.flush` |
| `<div className="field invalid" style={{margin…}}>` / alert lỗi sát nhóm | `.field.flush` / `.alert.tight` |
| `style={{borderRadius:0}}` trên ô nhập ghép | `.input.square` |
| `style={{maxWidth:440}}` | `.maxw-sm` |
| `<label className="search" style={{width:380}}>` | `.search.wide` |
| `<div className="row" style={{gap:4}}>` | `.row.tight` |
| `<div style={{alignSelf:'end', marginBottom:14}}>` | `.self-end` |
| `<div className="brand" style={{padding:0, marginBottom:18}}>` | `.brand.flush` (16px) |
| `<ul style={{margin:'6px 0 0', paddingLeft:18}}>` | `.list-plain` |
| `<Button style={{marginTop:8}}>` | `.btn.mt` hoặc `.mt-8` |
| `style={{padding:12}}` | `.p-12` (v0.3.3a – từ FE S2) |
| `<div className="row" style={{flexWrap:'wrap', gap:6}}>` | `.row.wrap` |
| `<select className="input" style={{width:'auto', minHeight:32}}>` (bộ lọc gọn trên Desk) | `.input.auto-w` – chỉ Desk dùng chuột; màn chạm giữ 44px |
| `<ul style={{listStyle:'none', padding:0}}>` | `.list-none` (`.plain-list` = tên cũ, giữ tương thích) |
| Tên căn phụ ở đầu dòng rack | `.rack .rm .rm-name` |
| Dòng bấm được trong danh sách rack điện thoại | `.rack-list .rowlink` (cao ≥ 44px) |
| Giữ chỗ sắp hết hạn trên rack | `.bar.hold.urgent` (viền + chữ `--bad`; chú giải `rack.legend_hold_urgent`) |
| `margin-top/bottom` 4 · 8 · 12 · 16, `margin:0`, `padding:8px` | `.mt-4 .mt-8 .mt-12 .mt-16 .mb-4 .mb-8 .mb-12 .mb-16 .my-8 .m-0 .p-0 .p-8` |
| skeleton `style={{height:…}}` | `.sk.h-6 .h-12 .h-32 .h-36 .h-56 .h-80 .h-96 .h-120 .h-300`, `.sk.w-60`; các `.sk` liền nhau tự cách 10px |
| `<tr aria-selected>` để tô hàng đang sửa | `tr.is-editing` (FB-R2-UXD-FE-13) |
| `[hidden]` bị `display` của lớp khác đè (vd `.rowlink`) | đã có `[hidden]{display:none !important}` toàn cục |

## 5. Component (32)

Mỗi component có: mục đích · biến thể · trạng thái · quy tắc a11y. Minh họa trong wireframe (mã luồng trong ngoặc).

| # | Component | Biến thể / trạng thái | Quy tắc chính |
|---|---|---|---|
| C1 | **Button** | `primary` (nền `--ink`), `secondary` (viền `--line-strong`), `ghost` (chữ `--oak-ink`), `danger` (nền `--bad`), `sm`; trạng thái hover, focus, đang xử lý ("Đang lưu…" + vô hiệu), disabled (`aria-disabled` + lý do gần nút) | Nhãn là **động từ + đối tượng** ("Hoàn tất trả phòng", không "OK"). Mỗi vùng tối đa 1 nút primary. Nút bị khóa phải có chữ giải thích vì sao (ví dụ "Dọn xong (còn 3 mục)") |
| C2 | **IconButton** | 32 / 44 / 48px | Bắt buộc `aria-label`; tooltip hiện cả khi focus |
| C3 | **Field (Input, Select, Textarea)** | mặc định, focus, lỗi (viền 2px `--bad` + dòng lỗi có icon ✕), chỉ đọc, đang kiểm (spinner nhỏ) | Nhãn luôn hiển thị phía trên (không dùng placeholder thay nhãn); `*` bắt buộc + chữ "Bắt buộc" cho trình đọc; lỗi gắn `aria-describedby`, `aria-invalid`; trợ giúp dưới ô; điện thoại cỡ 16px |
| C4 | **Stepper +/−** | 44px (Touch), 56px (HK); có `data-max` | Thay ô số cho minibar, số thẻ, số khách (BL 8.3). `output aria-live="polite"` |
| C5 | **Segmented control** | 2–5 lựa chọn | `aria-pressed`; dùng cho bộ lọc, kiểu xem, chọn phương thức |
| C6 | **Checkbox / Radio / Switch** | Switch = `role="switch"` + `aria-checked` | Không tích sẵn cho đồng ý pháp lý (BR-609) |
| C7 | **Chip trạng thái** | ok, warn, bad, info, oak, neutral, hold (viền đứt), strike | **Luôn có icon + chữ**; không dùng chip chỉ có chấm màu |
| C8 | **Badge đếm** | số trên nền `--bad` | Kèm chữ ẩn "4 mục cần chú ý" |
| C9 | **Card / KPI tile** | card, KPI (`kpi` + nhãn + diễn giải) | KPI luôn có nhãn đầy đủ và nguồn/công thức khi bấm |
| C10 | **List row / Task item** | thường, `urgent` (viền trái 4px `--bad`), `soon` (`--warn`) | Toàn bộ dòng bấm được bằng một `button`/`a` thật (không bấm vào `tr`/`div` – BL 8.3) |
| C11 | **Table** | header chữ hoa 12px nền `--surface-2`, dòng tổng đậm, dòng chọn `--oak-soft`, cột số canh phải | Chọn dòng bằng nút trong dòng hoặc `role="grid"` có focus; `aria-selected` |
| C12 | **Room rack** | lưới 10 căn × 14 ngày; thanh đơn 6 loại (mục 2.3); **làn "Chưa gán căn"** phía trên lưới khi `Rack.unassigned` có đơn; 2 dạng xem rút gọn theo vai (buồng phòng/bảo trì: trạng thái + có khách đến; sale/CTV: "Đã kín"); ô trống bấm được (từ hôm nay); cột hôm nay nền `--oak-soft`; chú giải luôn hiện; dạng danh sách < 768px | Mỗi thanh là `button` có `aria-label` đủ "Căn 203, Ji-woo Park, đã xác nhận, 19/10 đến 22/10, Booking.com". Bản thật: `role="grid"`, phím mũi tên di chuyển ô, Enter mở, tab-index lưu động (roving tabindex) |
| C13 | **Booking bar** | xem C12 | Chữ trong thanh: tên khách + ghi chú ngắn ("đi hôm nay", "còn 5 giờ 20 phút"); không chỉ `title` |
| C14 | **Drawer** (phải, 460px) | chi tiết đơn, khách | Như Modal (C15); trên điện thoại thành trang toàn màn |
| C15 | **Modal / Dialog** | `sm` 480, `lg` 720; có tiêu đề, thân cuộn, chân cố định | Mở → focus tiêu đề/ô đầu; **bẫy focus**; Esc/nền **không đóng khi form đã sửa** → hỏi "Bỏ các thay đổi chưa lưu?"; đóng → **trả focus** về nút gọi; nội dung phía sau `inert` |
| C16 | **Confirm dialog (phá hủy / tiền)** | `role="alertdialog"` | Mục 6.1 |
| C17 | **Stepper tiến trình (Steps)** | bước đã xong (✓), hiện tại, chưa tới | `aria-current="step"`; có "← Sửa lại" ở mọi bước |
| C18 | **Toast** | xác nhận thường + nút Hoàn tác | Chỉ cho thông tin **không quan trọng**; `role="status"`; ≥ 6 giây, dừng khi rê/focus, có nút đóng. **Cấm** dùng toast cho nhắc pháp lý/tiền (HR-09) |
| C19 | **Alert / Banner** | ok, warn, bad, info; banner mất mạng | Lỗi chặn: `role="alert"`; nhắc: `role="status"`. Câu theo mẫu content-guide mục 6 |
| C20 | **Persistent task ("Cần chú ý")** | urgent, soon, normal | Ở lại tới khi xử lý xong; sinh từ quy tắc (BR-907); có nút hành động trực tiếp |
| C21 | **Countdown** | bình thường, `warn` (< 2 giờ), `bad` (quá hạn → "Đã quá hạn 15 phút") | Hiện chữ, không chỉ màu; `aria-live` chỉ khi đổi mức, không đọc mỗi giây |
| C22 | **CheckRow (kiểm tra 3 trạng thái)** | pass / fail / unknown (mục 6.4) | Không bao giờ hiện pass khi hệ thống chưa kiểm; unknown có nút "Tôi đã kiểm – Đạt/Không đạt" ghi tên người kiểm |
| C23 | **Scan frame / Upload** | trống, đang đọc (skeleton), đọc lỗi, xong | Luôn có lựa chọn "Nhập tay"; ảnh không đọc được → giữ dữ liệu khác |
| C24 | **Bill / Folio** | tạm tính, đã thu (dấu "ĐÃ THU ĐỦ"), song ngữ | Dòng miễn phí ghi "Miễn phí · lý do" (không "FOC"); USD chỉ tham khảo (BR-004) |
| C25 | **VietQR block** | QR + số tiền + nội dung CK + nút sao chép; chờ xác nhận | QR có `aria-label` nêu số tiền và nội dung |
| C26 | **Chart** | cột, cột tương lai **sọc**, đường mục tiêu | Cột là nút: chạm/focus hiện số; luôn có "Xem dạng bảng" (HR-12) |
| C27 | **Navigation** | sidebar có nhóm (máy tính), thanh dưới **≤ 5 mục** (điện thoại), mục "Thêm" | `aria-current="page"`; nhãn đầy đủ, không viết tắt khó hiểu |
| C28 | **Language switcher** | VI / EN / RU | Tên ngôn ngữ viết bằng chính ngôn ngữ đó; đổi `<html lang>` |
| C29 | **Empty / Loading (skeleton) / Error / Offline state** | mục 7 | – |
| C30 | **Date range picker** | chọn khoảng, đêm đã kín gạch chéo + nhãn, ngày quá khứ khóa | Nhập được bằng bàn phím (ô ngày gõ tay `dd/mm/yyyy`) |
| C31 | **Code input (OTP / TOTP / PIN / mã xác minh)** *(đợt 4)* | 6 ô số liền một trường; trạng thái sai (còn N lần), khóa, gửi lại có đếm ngược | `inputmode="numeric"`, `autocomplete="one-time-code"`; một `input` (không 6 ô rời) để trình đọc màn hình và dán mã dùng được; lỗi gắn `aria-describedby` |
| C32 | **Code display (mã cấp cho khách)** *(đợt 4)* | mã lớn đơn cách + đếm ngược hiệu lực | Chỉ hiện trong modal, không ghi vào thông báo/toast; cảnh báo không gửi kèm link |

Icon: bộ line icon 24×24, nét 1,7, đầu tròn (giữ phong cách BL 6.5), vẽ lại trong `wireframes/assets/icons.js` (34 icon). Không mua bộ icon. Icon luôn đi kèm chữ, trừ IconButton có `aria-label`.

## 6. Mẫu tương tác bắt buộc (khắc phục heuristic)

### 6.1 Xác nhận hành động phá hủy / tiền (HR-06 – Blocker; US-135)
Áp dụng: hủy giữ chỗ, hủy đơn, **đánh dấu không đến**, hoàn tất trả phòng, đóng/mở bán kênh, gộp hồ sơ, đổi phiếu sửa sang "Xong" (mở khóa phòng), hoàn cọc, xóa ảnh giấy tờ sớm, **thu hồi thiết bị được cấp**. Số tiền/khoảng ngày trong hộp lấy từ API (`dryRun=true`, `checkout-summary`) – bảng 7 hành động: `wireframes/09-stay-changes.html` mục 9.6.
1. Tiêu đề là câu hỏi cụ thể có đối tượng: "Hủy giữ chỗ căn 103?".
2. Thân nêu **hậu quả cụ thể**: "Căn 103 sẽ mở bán lại từ 16/10 đến 18/10 trên 7 kênh."
3. **Lý do bắt buộc** khi quy tắc yêu cầu (BR-308, 424, 432) – nút xác nhận khóa đến khi chọn.
4. Nút an toàn ("Giữ lại đơn") nhận focus mặc định; nút xác nhận dùng `danger`, nhãn lặp lại động từ ("Hủy giữ chỗ"). Không dùng "OK / Có / Không".
5. Ghi nhật ký (BR-008). Hành động đảo ngược được (đổi trạng thái buồng) → **không hỏi**, dùng **Hoàn tác 10 giây** (HR-17).

### 6.2 Không mất dữ liệu (HR-05)
- Form nhiều bước tự lưu nháp mỗi khi rời ô; hiện "Nháp tự lưu 10:41".
- Esc / bấm nền đóng modal **chỉ khi form chưa sửa**; nếu đã sửa → hộp "Bỏ các thay đổi chưa lưu?" (Tiếp tục nhập / Bỏ thay đổi).
- Không dựng lại toàn trang khi lưu (ghi chú cho FE – BL 8.4).

### 6.3 Phụ thu chủ động (HR-04 – Blocker; BR-414)
- Ô giờ nhận/trả mặc định **giờ chuẩn** (BR-401), phụ thu = 0, hiện câu xanh "Nhận đúng giờ chuẩn – không phụ thu".
- Lễ tân phải **bật công tắc** "Khách nhận sớm / trả muộn" → nhập giờ → thấy số tiền + bậc BR → tick "Tôi đã báo khách khoản phụ thu này" mới lưu được.
- Miễn phí (FOC) là nhánh riêng: lý do bắt buộc, vượt hạn mức → gửi người duyệt (BR-432/433); không có ô "chọn tên người duyệt".

### 6.4 Kiểm tra 3 trạng thái (HR-07 – Blocker; BR-605)
- `pass` chỉ khi hệ thống **đã so sánh dữ liệu thật** (ví dụ hạn hộ chiếu > ngày trả phòng).
- Thiếu dữ liệu → `unknown` "Chưa kiểm được – cần kiểm tay" (viền đứt, icon ?), người dùng đánh dấu sau khi xem giấy tờ gốc; ghi tên người kiểm.
- `fail` **không chặn** nhận phòng (SEC R-REG-03, state-machines K5) nhưng bắt buộc ô "Cách xử lý" cho từng mục `fail`/`unknown` trước khi sang bước khai báo; người ghi = mọi vai `front_desk` trở lên, lưu tên + thời điểm (`warningNotes`). *(Đợt 4 – thay "chỉ quản lý ghi ngoại lệ".)* **[GIẢ ĐỊNH – chờ ESC-001]**; biến thể nếu luật sư/INV chọn "phải duyệt": nút "Tiếp tục" → "Gửi lễ tân trưởng duyệt" (FB-R1-PO-UXD-06).
- **Ngoại lệ chặn (Bước 4 – BR-613 c, DOM v0.2):** hộ chiếu/thị thực khách NN **đã hết hạn tại ngày nhận phòng** → `fail` có cờ chặn: icon ổ khóa, chip "Không đạt – chặn giao mã", bước Giao mã khóa ô mã cửa và nút Hoàn tất nêu lý do. Hết hạn trong thời gian ở → vẫn chỉ cảnh báo.
- **R2 (BA EP03-05 1.3, giả định G-1 – v0.3.2):** chưa có mã cửa trong app nên cờ chặn BR-613 (c) khóa **nút Nhận phòng** (chip "Không đạt – chưa nhận phòng được", điều kiện `checkin.cond.document_ok`); FD thấy "Gửi lễ tân trưởng xác nhận", FDL+ xác nhận nhận tiếp có lý do + cách xử lý. Nhãn kết quả hệ thống: `checkin.verify.result.pass/fail/unknown` = Đạt / Không đạt / Chưa kiểm được. R3 (US-128) quay về chặn cấp mã. Minh họa `hifi/13-check-in.html` 13.3, 13.5.

### 6.5 Nhắc việc bền vững thay toast (HR-09)
Nhắc pháp lý/tiền (khai báo còn thiếu, kỳ thu, căn quá giờ trả, đơn vừa về từ OTA) → **Task item** trên Tổng quan/"Hôm nay" + badge, ở lại tới khi xong; nhắc lại theo mốc giờ (BR-611, BR-425).

### 6.6 Trạng thái hệ thống trung thực (HR-20, HR-15)
Chỉ hiện "Đã khóa – ngừng bán trên mọi kênh" sau khi server xác nhận khối OOO; trước đó hiện "Đang gửi yêu cầu khóa…". Áp dụng tương tự cho đồng bộ kênh (Đang gửi / Thành công / Lỗi – thử lại).

### 6.7 Nguồn giá (HR-18)
Mọi nơi đề xuất giá (đặt mới, gia hạn ở quầy và app khách) hiện **giá sẽ thu** + **nguồn giá** ("Giá trực tiếp hôm nay – BR-104", "Giá đơn gốc – BR-421").

### 6.8 Lối tắt cho việc lặp lại (HR-22)
Bấm ô trống trên rack → Đặt phòng mới điền sẵn căn + ngày; tìm kiếm toàn cục (phím `/`); điện thoại: nút hành động chính ở vùng ngón cái.

### 6.9 Điều hướng theo vai (HR-03)
Trang chủ theo vai (bảng 9 mã vai ở `wireframes/01-login-role-nav.html` mục 1.2, khớp `rbac-matrix.md`). Không có bộ chọn "Xem với vai trò". **Nút = `allowedActions[]` của API** (theo trạng thái + vai; bảng `02-fo-rack-booking.html` mục 2.6); hành động `requiresApproval` vẽ thành "Gửi … duyệt". **Không vẽ nút cho hành động vai không có quyền** (ẩn, không hiện rồi báo lỗi); trường nhạy cảm ẩn hẳn – API không trả (`x-visible-to`), giao diện không để chỗ trống "••••". Dữ liệu C3 chỉ hiện trên thiết bị được cấp (`deviceTrusted`), không bao giờ trên PWA điện thoại (SR-DEV-03/04).

### 6.10 Đa ngôn ngữ (HR-01 – Blocker)
App khách: VI + EN (R2), RU (R3) – mọi chuỗi từ file chuỗi, không ghép câu bằng code; ngôn ngữ mặc định theo trình duyệt, đổi tay ở đầu trang, ghi nhớ theo đơn. Bố cục chịu được chuỗi dài hơn 40% (RU/DE): nút xuống dòng, không cắt chữ, không cố định chiều rộng theo chữ VI.

### 6.11 Đến muộn / tự nhận phòng (Bước 4 – FB-R1-UXR-UXD-01, PHÂN XỬ ORC 15/10)
- Khách có giờ đến ≥ 22:00: trang lưu trú đưa thẻ "Đến muộn? Tự nhận phòng" lên đầu, khuyến khích làm thủ tục trước. Hoàn tất thủ tục (đã xác minh mức 2 trong luồng) → **mã cửa hiện ngay** + hướng dẫn mở khóa có ảnh.
- Mã đã hiện được **giữ trong phiên** (sessionStorage, hết khi đóng phiên/hết khoảng hiệu lực – SEC chốt), xem lại được khi mạng yếu. Không đưa mã vào URL, thông báo đẩy, tiêu đề tab.
- **Luôn có lối thoát người thật**: nút "Gọi người trực" + "Nhắn Zalo / WhatsApp" ở trang lưu trú, màn hoàn tất, màn mã cửa và màn bị khóa/hết phiên.
- Người trực đêm làm việc C3 trên **thiết bị của cơ sở đã cấp** (máy quầy / máy tính bảng của cơ sở, hạn ≤ 30 ngày với thiết bị di động), không trên điện thoại cá nhân. Minh họa: L7 7.2, L3 3.6, L1 1.4.

### 6.12 Chữ tự do của nhân viên hiện cho khách (Bước 4 – FB-R1-UXR-UXD-06)
Lý do/phản hồi gửi khách chọn từ **danh sách lý do đã dịch**; ghi chú tự do là tùy chọn, hiện dưới nhãn "Ghi chú của lễ tân (tiếng Việt)" và bọc `lang="vi"`. Chuỗi dự phòng EN khi đang ở RU gắn `lang="en"`; khi màn chưa đủ RU hiện câu "Русская версия скоро".

### 6.13 Dữ liệu mẫu (Bước 4 – FB-R1-PO-UXD-02)
Mọi wireframe dùng **DS-0** của QA (`product/docs/qa/test-strategy.md` 4.2) làm bộ dữ liệu mẫu duy nhất; số tiền tính lại theo ví dụ BR; đơn kịch bản ngoài DS-0 phải ghi rõ ở `wireframes/index.html`. Không đặt dữ liệu cho một vai thấy điều RBAC cấm (vd. "Hoa hồng của tôi" chỉ có mục của đúng người xem).

### 6.14 Số khách theo định mức / tối đa – bộ đồ dùng thêm (R2 – INV quyết ESC-014 16/10)
- Ô số khách = 3 stepper: **Người lớn (từ 12 tuổi)**, **Trẻ 6–11 tuổi**, **Trẻ dưới 6 tuổi**; dòng tóm tắt "Tính n/tối đa người (định mức m) · trẻ dưới 6 tuổi: k" (trẻ dưới 6 không tính – BR-110).
- Vượt **tối đa** (định mức + 1, khách thứ +1 ngủ **sofa**; không dùng chữ "nệm phụ") → lỗi tại ô `CAPACITY_EXCEEDED`, nút lưu khóa (US-004 AC3).
- Vượt **định mức** → khối thông tin (icon sofa, nền `--info-bg`): "Vượt định mức n người – khách ngủ sofa. Nhớ chuẩn bị bộ đồ dùng thêm…" + dòng phụ thu người (Trực tiếp/CTV; OTA không cộng – US-017 AC7). Sau khi lưu: chip "Vượt định mức n · chuẩn bị bộ đồ dùng thêm" ở Hôm nay, drawer đơn, rack (icon sofa trên thanh) và việc buồng phòng `hk.task.extra_kit` (`HkTaskType` `extra_guest_kit_prepare` / `_collect` / `_transfer`, OpenAPI 0.3.1). Bộ = 1 mền, 1 khăn tắm, 1 khăn mặt, bàn chải, đồ vệ sinh cá nhân – không gối (INV 16/10).
- Minh họa: `hifi/09-booking.html` (bấm thử), `03-today.html`, `08-rack.html`, `11-reservation.html`, `12-sales-quote.html`.

### 6.15 Đơn dài hạn nhập tay (R2 tạm – US-017 AC5a)
- Thanh rack kiểu dài hạn + nhãn "Nhập tay"; chip "HĐ ngoài hệ thống – chuyển vào app ở R3" ở drawer và danh sách lọc. Không vẽ lịch kỳ thu, nhắc thu, hoa hồng; thu tiền ghi từng lần. Minh họa `hifi/10-long-stay-manual.html`.

### 6.16 Nhận/trả phòng R2 – phụ thu chủ động, mã cửa ngoài app, "chờ đối soát" (Sprint 3)
- Phụ thu nhận sớm / trả muộn: công tắc → ô giờ → câu kết quả `aria-live` (0 đ màu xanh; có tiền màu chữ thường) → tick "Tôi đã báo khách" mới lưu. Trả muộn: ân hạn đến **12:30 (gồm 12:30)** chỉ khi căn không có khách đến cùng ngày; mốc 15:00/18:00 không dời; sau 18:00 → Gia hạn; trước 06:00 → thêm đêm (tiền phòng, không phụ thu). Bản bấm thử: `hifi.js` `[data-sur]` (H13 13.5, H15 15.3) – chỉ minh họa, số thật lấy từ `previewCheckIn` / `setLateCheckout dryRun`.
- Mã cửa R2 (P-R2-5, US-128 dời R3): OTTIMO không lưu mã. Bước "Giao mã & hoàn tất" là hướng dẫn tạo mã trên app TTLock với hiệu lực BR-403 + số thẻ đã phát (stepper 0–2, bắt buộc) + tick **"Đã gửi/giao nội quy"** (bắt buộc – là điều kiện bật nút Nhận phòng) + tick **"Đã giao mã cửa/thẻ"** (**không bắt buộc** – PO 16/10, US-025 AC7; tick bổ sung sau ở chi tiết đơn Đang ở, có hộp xác nhận, ghi rồi không bỏ). Trả phòng / đổi phòng / hoàn tác sinh việc "Xóa mã trên app khóa". Không hiện "mã cửa bị hủy".
- Điều kiện nhận phòng là danh sách chữ "Đã đủ/Còn thiếu"; **vượt sức chứa** (`capacity_within_max`, OTA `capacityConflict`) là khối khóa không có nút bỏ qua cho bất kỳ vai nào – chỉ có lối ra "Đổi sang căn đủ chỗ" / "Sửa số người". Phụ thu server tính lại khác số đã báo khách (`SURCHARGE_CHANGED`) → hiện số mới, **bỏ tick "đã báo khách"**, bắt xác nhận lại.
- Thu tiền: chuyển khoản/VietQR lễ tân tự ghi mang chip viền đứt `.chip.recon` "Chờ đối soát" – vẫn tính là đã thu; quản lý đối soát ở H16 16.6. Không có ô số thẻ ở bất kỳ đâu (POS: chỉ mã chuẩn chi).
- Duyệt FOC: không có ô chọn người duyệt; R2 xác nhận lại bằng **mật khẩu đăng nhập** (không dùng chữ "PIN" tới R3).
- **VietQR (C25) – bố cục (v0.3.5, review s3):** QR bên trái; bên phải mỗi thông tin là **một dòng khối riêng** theo thứ tự: số tiền (`.price-big`), "Nội dung chuyển khoản: {ref}" (chữ đơn cách, có nút "Sao chép nội dung"), "Tài khoản nhận: …" (`pay.qr_account`), nút "Sao chép số tiền". Không đặt `span` nội tuyến trực tiếp trong `.stack` (lớp `.stack` chỉ tạo khoảng cách dọc giữa phần tử khối) – số tài khoản dính liền nội dung CK là lỗi tiền. `aria-label` QR = `pay.qr_label`.
- **In Phiếu thanh toán (C24):** tờ phiếu có tiêu đề `bill.title` (+ `.en` "Guest folio" khi song ngữ), số phiếu + giờ lập, MST có nhãn, tiêu đề cột `bill.col_desc` / `bill.col_amount` (đơn vị ở tiêu đề cột), dòng "Đã thu" (`bill.paid`); nhãn EN đặt trong `<span class="en" lang="en">` dưới nhãn VI (không ghép " / "). Nút In: render bản sao tờ phiếu vào `<div class="print-root">` con trực tiếp của `<body>` rồi `window.print()` – `hifi.css` mục 16 chỉ in phần này, nền trắng, khổ A5, kể cả khi app đang ở chế độ tối.

### 6.17 guest-web mức 1 (R2 – SEC P-R2-4 ĐK-1…6)
- Chỉ dữ liệu mức 1: tên (không họ tên đầy đủ), ngày/giờ, chỉ đường, nội quy, Wi-Fi từ ngày nhận. **Không** có tab Hóa đơn, màn OTP/mã xác minh, mã cửa. Các chuỗi `guest.verify.*`, `guest.door_code*`, `guest.late.*` (mã cửa), `guest.tab.bill`, `guest.bill.*` không dùng ở R2; mẫu 6.11 chỉ áp từ R3 – R2 thay bằng "Lễ tân giao mã cửa khi bạn đến / gọi người trực".
- Check-in online: màn thông báo dữ liệu ("Tôi đã đọc") → 3 bước Giấy tờ · Giờ đến · Xác nhận. Mở lại link chỉ thấy "Đã có giấy tờ của n/m khách" – không hiện lại ảnh/số; không lưu ảnh trên máy khách (mất mạng → chụp lại). Đồng ý lưu ảnh: hai lựa chọn ngang hàng, không chọn sẵn, chỉ hỏi Khách 1; dòng "Muốn rút đồng ý… báo lễ tân". Minh họa `hifi/18-guest-checkin.html`.
- Loại giấy tờ (R2 Sprint 3, duyệt bản MOB): nhóm 2 nút ngang hàng **trước** nút Chụp, có nhãn nhìn thấy "Loại giấy tờ"; khách 1 không chọn sẵn (nút Chụp khóa kèm câu lý do), khách sau chọn sẵn theo khách trước; tiếng Việt → CCCD trước, ngôn ngữ khác → Hộ chiếu trước; gợi ý chụp đổi theo loại. Dùng chuỗi `gw.doc.*` của khách, không dùng chuỗi Desk. Người chưa có giấy tờ → nút phụ "Bổ sung tại quầy" (đổi lại được). Sau khi hoàn tất, trang Lưu trú thay thẻ "Làm thủ tục trước" bằng thẻ "Đã làm thủ tục trước" (số khách đã gửi, giờ đến, số người bổ sung tại quầy, nút "Xem lại"). Lỗi 5xx ở trang khách dùng `gw.error_server` (nhắn OTTIMO), không dùng câu "báo quản lý" của nhân viên.
- **Trang RU (v0.3.5, review s3 – quyết định UXD, chờ SEC đồng ký):** 7 chuỗi pháp lý (thông báo dữ liệu + câu đồng ý) hiện bản EN đã duyệt trong một khối `lang="en"`, ngay trên khối là câu `gw.legal_en_notice`; các màn đã đủ RU không hiện banner `guest.lang.ru_soon`. Bằng chứng đồng ý ghi `locale=en`. Chi tiết: content-guide mục 6.
- Nút chính bị khóa ở guest-web dùng `aria-disabled` + câu lý do (`gw.next_needs_docs`, `gw.eta_first`, `gw.consent_first`) như C1; tiến trình tải ảnh `gw.upload_progress` hiện trên màn, vùng `aria-live` chỉ đọc lúc bắt đầu và `gw.upload_done`.

### 6.18 PWA buồng phòng / bảo trì (R2 Sprint 4 – H19–H22)
- Mật độ **HK** (lớp `.hk` trên khung): thân 17px, mọi chữ ≥ 16px, mọi điều khiển ≥ 48px (nút, chip lọc, ô tích, radio `.choice` 56px, stepper 56px, thanh dưới 64px), nút chính `.btn.xl` 56px ghim đáy (vùng ngón cái), một thẻ = một căn = **một nút chính**. Trạng thái buồng = câu thường `hk.status.*` + icon + màu, không mã (mã chỉ ở Desk).
- **Hoàn tác 10 giây = gửi trễ**: mọi lệnh ghi qua hàng đợi trên máy (đổi trạng thái buồng, xong việc, kiểm phòng, đếm minibar) nằm chờ 10 giây rồi mới gửi; toast `role="status"` có nút "Hoàn tác (n)" 48px đếm lùi, dừng khi focus. Hoàn tác = xóa khỏi hàng đợi, **không** gọi API; `performedAt` = giờ bấm, `Idempotency-Key` sinh lúc bấm. Không áp cho tạo phiếu sự cố và mọi thao tác tiền / tồn phòng.
- **Mất mạng**: banner vàng + nút đếm "n thao tác đang chờ gửi" (`.qpill`) ở đầu mọi màn; màn "Thao tác trên máy" chia **Đang chờ gửi** và **Cần xem lại** (server từ chối 409 – có câu giải thích trạng thái hiện tại, nút "Đã hiểu"); không bao giờ âm thầm bỏ. Thao tác không được offline (tiền, tồn phòng, C3, đóng phiếu có khóa phòng) → nút khóa "Cần có mạng".
- **Phiếu sửa**: mức **Gấp / Trong ngày / Không gấp** (`high/medium/low`, BR-809) luôn là chữ + icon + viền trái; hạn kế tiếp viết thành câu ("Nhận việc trước 10:47 – còn 5 phút", "Hạn tạm dừng – vật tư dự kiến 17/10"). Sửa xong: ghi kết quả + **≥ 1 ảnh sau sửa** `[GIẢ ĐỊNH UXD]`, hộp hậu quả (mở bán lại, căn "Cần dọn", việc dọn sau sửa) và trạng thái trung thực "Đang mở bán…" → "Đã mở bán lại". Khóa phòng hiện cả "dự kiến xong" và "mở bán lại từ" (BR-804). Bảo trì không thấy tên khách.
- Lỗi tải ở PWA: nút **Gọi lễ tân** thay "Gửi lỗi cho lễ tân" (không có API); mã tham chiếu chỉ là chữ nhỏ.

### 6.19 Yêu cầu khách có phí (R2 Sprint 4 – H23)
- Ô loại yêu cầu ghi phí ngay trên ô ("100.000 đ/lần", "Miễn phí") theo `feeVnd` **server tính cho chính khách đó tại thời điểm mở** – client không tự suy luận; loại có phí phải **tick "Tôi đồng ý phí …"** mới mở nút Gửi (cùng tinh thần 6.3 – không phát sinh phí bất ngờ).
- **Dọn phòng thêm – ESC-016 A (INV 16/10)**: khách ngắn ngày chưa có lần dọn đầy đủ trong ngày (kể cả đã từ chối dọn sáng) → "Miễn phí" + câu dọn bù, **không** có ô tick; đã dọn đầy đủ → câu nêu giờ đã dọn + phí lần hai + tick; khách dài hạn → câu "gói thuê chưa gồm dọn" + phí mỗi lần + tick. Thay khăn/đồ dùng luôn miễn phí. Chưa có API phí → câu quy tắc đủ 3 trường hợp (`gw.req.clean_fee_rule`).
- guest-web R2 không dùng chữ "hóa đơn / bill / mã cửa / OTP" (SEC ĐK-6): dùng `gw.req.fee_notice` ("thanh toán khi trả phòng") thay `guest.req.fee_notice`.
- Ngoài giờ trực [07:00, 22:00): báo trước khi gửi + trả lời tự động; việc gấp → nút gọi người trực. Mất mạng: không xếp hàng ở trang khách – nút "Cần có mạng để gửi yêu cầu".

### 6.20 Tổng quan + "Cần chú ý" + SSE (R2 Sprint 4 – H24)
- Điện thoại chủ đầu tư: **Cần duyệt → Cần chú ý → KPI đêm nay**. Mỗi mục "Cần chú ý" là một nút mở màn xử lý; mức `critical/warning/info` = viền + icon + chữ. Câu cho 19 `AttentionItem.kind` ở `attn.*` (H24 24.3).
- Chỉ báo kết nối luôn có chữ: **Trực tiếp** (chấm xanh) · **Đang kết nối lại** (chấm vàng, poll 30 giây) · **Ngoại tuyến** (vòng rỗng đỏ – khác hình). Mục mới từ SSE chèn đầu danh sách, sáng nền 2,4 giây (tắt khi giảm chuyển động), `aria-live="polite"` đọc một câu `ov.sse_new_announce`, không cướp focus. Mỗi khối (KPI, Cần chú ý, Cần duyệt) lỗi độc lập.

### 6.21 Lưu đồng thời / hệ thống bận – tự thử lại theo `Retry-After` (R2 Sprint 3 – ĐK-S2-3, QC-S2-02)
- Áp cho `409 CONCURRENT_UPDATE` và `503 SERVICE_UNAVAILABLE` (server **không ghi gì**). Không bao giờ hiện "Máy chủ đang gặp sự cố" (`error.server`) cho hai mã này; không hiện mã tham chiếu ở lần đầu.
- **Giữ nguyên** form, hộp thoại, bước wizard và mọi dữ liệu đã nhập; không đóng hộp, không tải lại trang.
- Hiện cảnh báo vàng tại chỗ (`role="status"`, không phải toast tự tắt) với câu `error.CONCURRENT_UPDATE` / `error.SERVICE_UNAVAILABLE` + nút chính chuyển thành "Tự thử lại sau {seconds} giây…" (`retry.countdown`, `aria-disabled`) + nút phụ "Dừng thử lại" (`retry.stop`) / "Thử lại ngay" (`retry.now`).
- Chờ đúng `Retry-After` (thiếu header → 2 giây; trần 10 giây) rồi **tự gửi lại cùng `Idempotency-Key` và `If-Match`**: `CONCURRENT_UPDATE` tối đa 2 lần, `SERVICE_UNAVAILABLE` 1 lần. Thành công → toast thường của thao tác (có thể kèm `retry.done`). Lần thử lại trả mã khác (`VERSION_CONFLICT`, `ROOM_UNAVAILABLE`…) → xử lý theo mã đó.
- Hết lượt tự thử → dừng, câu `retry.gave_up_concurrent` hoặc `retry.gave_up_unavailable` (kèm `{request_id}` nếu có) + nút "Thử lại" thủ công. Rời màn / đóng hộp → hủy hẹn giờ.
- Đọc (GET) nhận 503 → khung lỗi màn hiện `error.SERVICE_UNAVAILABLE` + `retry.load_countdown`, tự tải lại 1 lần.
- PWA (hàng đợi ADR-005): hai mã này **giữ thao tác ở "Đang chờ gửi"** (`hk.queue.busy_retry`) và thử lại theo `Retry-After`, **không** đưa vào "Cần xem lại".
- a11y: `aria-live="polite"` đọc câu lỗi một lần và kết quả cuối; **không** đọc từng giây đếm lùi; focus giữ nguyên tại nút vừa bấm. Giảm chuyển động: không nhấp nháy.
- Minh họa: H13 13.5 biến thể "Lưu đồng thời". Ghi chú FE: `problem.ts` hiện đổi `Retry-After` thành `{minutes}` – cần thêm tham số `{seconds}`.

## 7. Trạng thái màn hình (loading / rỗng / lỗi / mất mạng)

| Trạng thái | Khi nào | Mẫu | Ví dụ |
|---|---|---|---|
| **Đang tải** | > 300ms | Skeleton đúng hình bố cục thật (không spinner giữa trang); `aria-busy="true"`; nút đang xử lý đổi chữ "Đang lưu…" | Rack: dải xám theo hàng căn (L2) |
| **Rỗng** | Không có dữ liệu hợp lệ | Hình tròn icon + tiêu đề nói **sự thật tích cực** + 1 câu hướng dẫn + (nếu có) 1 nút hành động | "Hết việc rồi!" (L6), "Không có gì cần chú ý" (L8), "Không dùng gì – tủ đủ" (L4) |
| **Lỗi** | Tải/lưu thất bại (5xx, không có `code`) | Icon cảnh báo + "Chưa tải được …" + nguyên nhân dễ hiểu + **dữ liệu không mất** + nút Thử lại + **mã tham chiếu** (`Problem.requestId`) để báo quản lý; `role="alert"` | "Chưa tải được sơ đồ phòng … mã tham chiếu 01JB-7Q4K" (đợt 2 dùng mã minh họa RK-503 – đã bỏ) |
| **Lỗi nghiệp vụ** | Server từ chối với `Problem.code` (37 mã + `DEVICE_NOT_TRUSTED`) | Alert `bad` tại chỗ, câu lấy từ `error.<CODE>` (content-guide 5.2b), nêu vấn đề + cách sửa + gợi ý thay thế, giữ dữ liệu; `VALIDATION_FAILED` gắn lỗi vào từng ô | `ROOM_UNAVAILABLE` kèm căn trống thay thế (L2) |
| **Mất mạng** | Mất kết nối | Banner `warn` đầu màn; **Desk**: chỉ xem, khóa tạo/sửa đơn (chống đặt trùng – BR-906); **HK**: vẫn thao tác, xếp hàng, đếm "2 thao tác đang chờ", tự gửi; **khách**: xem dữ liệu đã tải | L2, L6, L7 |
| **Hết hạn / không có quyền** | Link khách hết hạn (`GUEST_LINK_INVALID`); cần xác minh (`GUEST_VERIFICATION_REQUIRED`); máy chưa cấp (`DEVICE_NOT_TRUSTED`); vai không có quyền | Trang giải thích + cách tiếp tục + kênh liên hệ; không lộ dữ liệu | "Liên kết đã hết hạn" (L7), "Máy này chưa được cấp quyền" (L3 3.5) |

## 8. Quy tắc a11y – khắc phục từng mục BL 8.3

Chuẩn mục tiêu: **WCAG 2.2 AA** (decision-log UXR 15/10/2026).

| # | Mục BL 8.3 / HR | Tiêu chí WCAG | Quy tắc Design System | Minh họa |
|---|---|---|---|---|
| A1 | Modal/drawer không bẫy focus, không đưa focus vào, không trả focus (HR-08) | 2.1.2, 2.4.3, 2.4.11 | C15: focus vào tiêu đề khi mở, bẫy focus, nội dung sau `inert`, đóng → trả focus về nút gọi; phần tử đang focus không bị header dính che (scroll-padding) | L2 2.2, L3 |
| A2 | Dòng bảng khai báo bấm bằng `tr` | 2.1.1, 4.1.2 | C10/C11: hành động trên dòng luôn là `button`/`a` thật hoặc `role="grid"` có quản lý focus; cấm gắn click vào `tr`/`div` | L1 chọn cơ sở, L2 danh sách |
| A3 | Tooltip biểu đồ chỉ theo chuột; SVG không có bảng (HR-12) | 1.1.1, 1.4.13 | C26: cột là nút có `aria-label`, chạm/focus hiện số, tooltip không biến mất khi rê vào, có "Xem dạng bảng" | L8 |
| A4 | Trạng thái chủ yếu bằng màu (HR-11) | 1.4.1, 1.4.11 | Mục 2.3: mọi trạng thái = chữ + icon; rack có viền đứt/sọc/tiền tố "HĐ"; chú giải luôn hiện; kiểm bằng mô phỏng mù màu (deuteranopia/protanopia) trước mỗi round | L2, L6 |
| A5 | Alert trong modal thiếu `role="alert"` (HR-24) | 4.1.3 | C19: lỗi chặn `role="alert"`, thông tin `role="status"`; lỗi trường `aria-describedby` + `aria-invalid` | L2, L3, L4 |
| A6 | Ô số/giá nhỏ, tab dưới 9–11 mục (HR-02) | 2.5.8, 1.4.10 | Mục 4 vùng chạm; C4 stepper thay ô số; C27 thanh dưới ≤ 5 mục; không cuộn ngang ở 320px (trừ rack có chế độ danh sách) | L4, L6 |
| A7 | `<title>` trong `<body>`, thiếu `lang` | 2.4.2, 3.1.1, 3.1.2 | Mỗi màn có `<title>` "Tên màn – OTTIMO"; `<html lang>` theo ngôn ngữ đang dùng; đoạn khác ngôn ngữ (song ngữ bill) gắn `lang` riêng | mọi trang |
| A8 | (bổ sung) Tương phản chữ `--faint` 2,65:1 (HR-10) | 1.4.3 | Mục 2.2: đo cả sáng/tối, 0 cặp không đạt | tokens |
| A9 | (bổ sung) Chữ 9,5–10,5px (HR-10) | 1.4.4 | Mục 3: tối thiểu 12px máy tính, 14/16px điện thoại, 16px buồng phòng; dùng `rem` | – |
| A10 | (bổ sung) Focus ring 2,72:1 | 2.4.7, 1.4.11 | `--focus` 5,44:1 trở lên, 2px + offset 2px; không bỏ outline | mọi trang |
| A11 | (bổ sung) Toast 2,8 giây (HR-09) | 2.2.1, 4.1.3 | C18: ≥ 6 giây, dừng khi rê/focus, nút đóng; việc quan trọng → C20 | L6 |
| A12 | (bổ sung) Chuyển động | 2.3.3 | Tôn trọng `prefers-reduced-motion` | tokens |
| A13 | (bổ sung) Bỏ qua điều hướng | 2.4.1 | Link "Bỏ qua tới nội dung" đầu trang; landmark `nav`/`main` | mọi trang |
| A14 | (bổ sung) Kéo thả trên rack (nếu làm ở R2+) | 2.5.7 | Mọi thao tác kéo thả phải có cách thay thế bằng nút/form (đổi căn, đổi ngày qua drawer) | – |
| A15 | (bổ sung) Nhập lại dữ liệu | 3.3.7 | Không bắt nhập lại thông tin đã có (giấy tờ khách gửi trước qua app hiện sẵn ở quầy) | L3 |

Kiểm tra trước khi nộp mỗi round (UXD + QA): bàn phím đi hết luồng không chuột; trình đọc màn hình (VoiceOver/TalkBack) đọc đúng nhãn thanh rack và chip; phóng chữ 200%; sáng/tối; mô phỏng mù màu.

## 9. Ba giao diện theo thiết bị

| | **Desk** (lễ tân, quản lý – máy tính) | **Touch** (lễ tân/sale/chủ đầu tư/khách – điện thoại) | **HK** (buồng phòng/bảo trì – điện thoại) |
|---|---|---|---|
| Thân chữ | 14px | 16px | 17px (tối thiểu 16) |
| Vùng chạm | ≥ 32px | ≥ 44px | ≥ 48px, nút chính 56px |
| Bố cục | sidebar + nội dung, drawer phải | 1 cột, thanh dưới ≤ 5 mục, bottom sheet | 1 cột, 1 việc = 1 thẻ, nút toàn chiều rộng |
| Ngôn ngữ | mã + nhãn (VC · Đã dọn, chờ kiểm) | như Desk, rút gọn | **câu thường, không mã** |
| Mạng yếu | chỉ xem khi mất mạng | chỉ xem (khách: xem dữ liệu đã tải) | thao tác offline, tự gửi lại |

## 10. Quản trị Design System

- Nguồn sự thật: `tokens.json` → sinh `tokens.css` (và theme cho MOB). Component code (R2) đặt trong thư viện dùng chung FE/MOB; tên component theo mục 5.
- Thay đổi token/component: UXD cập nhật file này + `tokens.json`, ghi lịch sử bên dưới, báo FE/MOB trong review.
- Sinh lại và kiểm tương phản: `python3 product/design/tools/gen_tokens.py` (in số cặp không đạt; phải là 0) và `python3 product/design/tools/gen_strings.py` (sinh `copy/strings-*.json` + `wireframes/assets/strings.js`). Đề nghị OPS đưa bước kiểm tương phản vào CI ở R2.

## 11. Lịch sử thay đổi
| Phiên bản | Ngày | Người | Nội dung |
|---|---|---|---|
| 0.3.5 | 17/10/2026 | UXD | R2 Sprint 3 – review chéo FE H13–H17 + MOB guest-web (`rounds/round-02/reviews/s3-UXD.md`): 6.16 thêm bố cục khối VietQR (mỗi thông tin một dòng, sao chép nội dung/số tiền riêng) và quy tắc in Phiếu thanh toán (`.print-root`, `hifi.css` mục 16 – chỉ in tờ phiếu, A5, nền trắng cả khi chế độ tối); 6.17 thêm quy tắc văn bản pháp lý EN trên trang RU và lý do nút khóa ở guest-web; 91 chuỗi mới + quy ước `{amount}` kèm đơn vị (content-guide 0.3.10). |
| 0.3.4 | 17/10/2026 | UXD | R2 Sprint 3 – 6.17 bổ sung chọn loại giấy tờ / bổ sung tại quầy / thẻ "Đã làm thủ tục trước" (MOB S3); mẫu **6.21** tự thử lại theo `Retry-After` cho `CONCURRENT_UPDATE`/`SERVICE_UNAVAILABLE` (ĐK-S2-3, QC-S2-02); 6.16 theo quyết định Sprint 2 (nội quy bắt buộc, "đã giao mã/thẻ" không bắt buộc + tick sau, số thẻ, vượt sức chứa chặn cứng, `SURCHARGE_CHANGED`); 6.19 áp ESC-016 A (phí dọn chỉ khi lần dọn đầy đủ thứ hai trong ngày / dọn lẻ dài hạn); rà H13–H18 theo OpenAPI 0.3.5 + BR v0.3.2; chuỗi mới (xem `rounds/round-02/outputs/UXD/s3-report.md`); 5 chuỗi RU báo giá (PO-S2-01). |
| 0.3.3 | 16/10/2026 | UXD | R2 Sprint 2 – hi-fi Sprint 4 (H19–H24): mẫu 6.18 PWA buồng phòng/bảo trì (mật độ HK, hoàn tác 10 giây = gửi trễ, hàng đợi + "Cần xem lại", mức phiếu, ảnh bằng chứng), 6.19 yêu cầu khách có phí, 6.20 Tổng quan + SSE; mục 4.1 lớp tiện ích thay style nội tuyến (FB-R2-UXD-FE-15) + `[hidden]` toàn cục + `tr.is-editing` (FE-13); component `.hk-card`, `.filters`, `.qpill`, `.toast-dock`, `.photo-row`, `.tl`, `.req-grid/.req-tile/.req-card`, `.live`, `.kpis.two`; H04 thêm cột/ô **số giường** (`bedCount`) và **diện tích** (`areaM2`) theo OpenAPI 0.3.4 Q6; 303 chuỗi VI/EN mới (`hk.*`, `wo.*`, `gw.req.*`, `ov.*`, `attn.*`, `rooms.*`); sửa `hk.task.extra_kit_items` ("1 1 mền"). |
| 0.3.2 | 16/10/2026 | UXD | R2 Sprint 1 – hi-fi Sprint 3 (H13–H18): mẫu 6.16 (phụ thu chủ động + ân hạn 12:30, mã cửa ngoài app R2, "chờ đối soát", duyệt bằng mật khẩu), 6.17 guest-web mức 1; 6.4 bổ sung BR-613 c ở R2 = chặn nhận phòng (BA G-1); component `.conds`, `.chk3`, `.lock-box`, `.person`, `.bill-paper` (in A5), `.upload-slot`, `.choice`, `.chip.recon`, `.wiz-foot`; icon `printer`, `cash`, `scan`; 363 chuỗi VI/EN mới; sửa `guest.oci.done_body`, `pay.card`, `approval.pin_*`, `error.REAUTH_FAILED`, `checkout.complete_confirm_body`, bỏ `handover.foc_approver` (BA E05-07, E06-10). |
| 0.3.1 | 16/10/2026 | UXD | R2 Đợt 0 – hi-fi EP00/EP02/EP10/EP11 (`hifi/`, 12 màn): component hi-fi `hifi.css` (chỉ dùng token), bảng 2.2 thêm 8 cặp chữ trên nền màu (0 cặp không đạt); mẫu 6.14 số khách định mức/tối đa + bộ đồ dùng thêm (ESC-014, sofa), 6.15 đơn dài hạn nhập tay; icon mới `monitor`, `sofa`, `sliders`, `chevron`, `filter`; 502 chuỗi VI/EN mới (RU ở R3; gồm mã lỗi OpenAPI 0.3.1); sửa `error.FILE_REJECTED` theo OpenAPI 0.3 (JPG/PNG/WebP ≤ 10 MB). |
| 0.3 | 16/10/2026 | UXD | Bước 4 (phản hồi UXR, PO, QA): thêm token `--focus-on-dark`; `--line-strong` sáng #8C8578 → #857E71 (đạt 3:1 trên `--side`); bảng 2.2 thêm 12 cặp (focus trên mọi nền có điều khiển, line-strong trên side/surface-2, cột biểu đồ) – 0 cặp không đạt; nút khóa bỏ opacity; cỡ chữ/vùng chạm tối thiểu áp cho toast, seg, thanh dưới, chip, nhãn; VC một tên "Đã dọn – chờ kiểm" tông gỗ sồi; mẫu 6.11 đến muộn, 6.12 chữ tự do của nhân viên, 6.13 dữ liệu mẫu DS-0; wireframe L10 mới. |
| 0.2 | 15/10/2026 | UXD | Đợt 4: khớp RBAC/máy trạng thái/ERD/API/SEC – thêm màu trạng thái làn "Chưa gán căn", dạng xem `unavailable`, SM-05 `void`, SM-10/11/15; C12 mở rộng; thêm C31 Code input, C32 Code display (32 component); 6.1 theo US-135 (+ không đến, thu hồi thiết bị); 6.4 "Không đạt" không chặn, bắt buộc ghi xử lý; 6.9 nút = `allowedActions`, C3 chỉ trên thiết bị được cấp; mục 7 lỗi theo `Problem.code` + `requestId` |
| 0.1 | 15/10/2026 | UXD | Bản đầu: token sáng/tối đạt AA (đổi `--muted`, `--faint`, `--oak-ink`, `--ok`, `--warn`, focus; thêm `--deco`, `--line-strong`, `--ink-inverse`), thang chữ, 30 component, 10 mẫu tương tác, 15 quy tắc a11y |
