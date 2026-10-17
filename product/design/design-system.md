# Design System OTTIMO – v0.4.1

- Người viết: UXD | v0.1–v0.3.5: Round 1 → Round 2 Sprint 3 (15–17/10/2026) | **v0.4: Round 2 – Sprint 4, bước Lập kế hoạch, S4-49 "áp brand guideline vào sản phẩm"** | **v0.4.1: Sprint 4 D1 – sửa phát hiện #18, #19 của critic kickoff** | Ngày: 17/10/2026
- Trạng thái: **v0.4.1 chờ review** (bắt buộc: UXR, PO; khuyến nghị: FE, MOB, DOM). v0.4.1 chỉ đổi mục 2 (`--bar-cf` và `--oak` tối pha một tỷ lệ; kiểm nguồn tint tự động; `--info` chỉ cho thông báo, chip mới `ink`), C7, C20, 11.1.1, 11.6 (đợt B0b) – lý do ở mục 12. v0.4 khớp **OTTIMO Brand Guidelines v1.0** (INV 17/10/2026: mọi đầu ra áp dụng guideline; lệch với tài liệu cũ thì guideline thắng). Phần đổi: mục 1 (D1), 2 (màu), 3 (chữ), 5 (C1, C7, C33, C34) và mục 11 mới (giọng văn khách, tên phòng, logo, việc FE/MOB). Lịch sử: mục 12.
- Căn cứ thương hiệu: `00-brief/context/brand/brand-guidelines.md` (tóm tắt), ảnh trang `00-brief/context/brand/pages/p18.jpg` (bảng màu), `p19.jpg` (tỷ lệ 80/15/5, cặp chữ–nền), `p21.jpg`–`p22.jpg` (chữ). Landing dùng cùng bảng màu và cách đo: `product/design/landing/concept.md` mục 2–3.
- Token máy đọc: `product/design/tokens.json` (định dạng W3C Design Tokens). CSS sinh ra: `product/design/wireframes/assets/tokens.css` – `@ottimo/ui` import thẳng file này, nên **mọi app nhận màu v0.4 ở lần build kế tiếp, không phải sửa code**. Không sửa tay CSS/JSON – sửa nguồn trong `product/design/tools/gen_tokens.py` rồi chạy lại (in `fails: 0`).
- Minh họa sống: `product/design/wireframes/index.html` (9 luồng, có công tắc sáng/tối, trạng thái tải/rỗng/lỗi/mất mạng, ngôn ngữ).
- **Hi-fi R2**: `product/design/hifi/index.html` – 24 màn (H01–H12 Đợt 0, H13–H18 Sprint 3, H19–H24 Sprint 4), component thật trong `hifi/assets/hifi.css`, kiểm bằng `tools/check_hifi.py`. Hi-fi dùng chung `tokens.css` nên đã mang màu v0.4; phần chữ/component v0.4 (mục 3, C1 `brand`) vào `hifi.css` ở đợt B2 (mục 11.6).
- Nội dung chữ: `product/design/content-guide.md`, chuỗi `product/design/copy/strings-{vi,en,ru}.json`.
- Đầu vào: BL mục 6 (design system prototype), BL 8.3 (a11y), `research/heuristic-review-r0.md` (HR-01…HR-25), `research/personas.md`, PRD, `business-rules.md`, Brand Guidelines v1.0.

---

## 1. Nguyên tắc

| # | Nguyên tắc | Hệ quả thiết kế |
|---|---|---|
| D1 | **Theo OTTIMO Brand Guidelines v1.0, sửa cho đạt chuẩn** – nền Ivory/Cream, chữ Ink, nhấn gỗ (Light Oak, Earth Brown), Sage điểm xuyết; Lora + Be Vietnam Pro + JetBrains Mono (v0.4 – thay "giữ nhận diện prototype BL 6.1") | Chỉ dùng 7 màu của bảng 80/15/5 + trắng và tint/shade pha từ chúng (mục 2.0). Màu trạng thái là ngoại lệ chức năng có giới hạn (2.4). Chỗ guideline không đạt WCAG AA thì DS chọn cặp đạt và ghi lệch (2.5) – không tự đổi màu thương hiệu |
| D2 | **Hai giọng giao diện, một hệ thống** – nhân viên cần nhanh, dày thông tin; khách cần ấm, thoáng, ít bước | Cùng token; khác mật độ: *Desk* (máy tính quầy), *Touch* (điện thoại – lễ tân/sale/chủ đầu tư/khách), *HK* (buồng phòng – nút to, chữ to). **Chữ khách nhìn thấy mang giọng thương hiệu** (tiếng Anh dẫn dắt, tiếng Việt hỗ trợ – 11.2); giao diện nhân viên tiếng Việt, chức năng |
| D3 | **Đúng tiền, đúng luật trước** – không mặc định phát sinh phí, không báo "Đạt" giả, không xóa không hỏi | Mẫu bắt buộc: Phụ thu chủ động (mục 6.3), Kiểm tra 3 trạng thái (6.4), Xác nhận phá hủy (6.1) |
| D4 | **Không chỉ bằng màu** | Mọi trạng thái = chữ + icon (+ hoa văn ở rack) – HR-11 |
| D5 | **Không mất dữ liệu khi bị ngắt quãng** | Nháp tự lưu, hỏi trước khi bỏ thay đổi, thao tác offline xếp hàng (HR-05, US-058) |
| D6 | **Số nghiệp vụ không nằm trong thiết kế** | Nhãn chỉ tham chiếu mã BR; số tiền trên wireframe là ví dụ tính từ BR (QC B3) |

## 2. Màu

### 2.0 Bảng màu thương hiệu (Brand Guidelines v1.0 p18–p19)

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

**Tỷ lệ 80 / 15 / 5 trong sản phẩm**
- **Neutrals ~80%:** nền trang Ivory; thẻ Ivory pha trắng; Cream cho nền phụ, sidebar, header bảng, dải xen kẽ; chữ Ink; chữ phụ Stone Grey.
- **Warm Woods ~15%:**
  - Earth Brown: link, mục đang chọn, viền focus, nút thương hiệu.
  - Light Oak: logo, nét kẻ nhấn, vạch trước nhãn.
  - Tint của Light Oak: thanh "đã xác nhận" (Light Oak 80% + Ivory 20% – v0.4.1), cột hôm nay, nền mục đang chọn.
- **Botanical ~5%:** Sage cho trang trí; Sage Deep (Sage pha Ink) cho thanh và chip "hợp đồng dài hạn".
- **Ngoài bảng – chức năng:** ok / warn / bad / info và nền nhạt của chúng (mục 2.4). Từ v0.4.1 `info` chỉ dùng cho **thông báo** (alert, "Cần chú ý" mức info); trạng thái của đối tượng dùng Ink/Stone + icon (chip `ink` / `neutral`, mục 2.3).

**Cách tạo màu phụ:** chỉ pha **một** màu của bảng với Ivory, White hoặc Ink (tint/shade), **cùng một tỷ lệ cho cả ba kênh R, G, B**. Không tạo sắc mới. Mỗi token ghi nguồn ở cột "Nguồn bảng màu" của bảng 2.1. Chế độ tối dùng cùng cách (Ink pha đen, tint Stone, tint Light Oak).
- Màu pha mới viết bằng hàm `mix(màu 1, màu 2, tỷ lệ)` trong `gen_tokens.py`, không gõ mã HEX tay (v0.4.1: `--bar-cf`, `--oak` tối).
- `gen_tokens.py` tự kiểm mọi token "pha / tint / shade" (danh sách `TINT`): tìm tỷ lệ gần nhất, đo khoảng cách tới màu pha đúng tỷ lệ đó. Lệch ≤ 4,5 (RGB 8-bit) là sai số làm tròn. Lệch hơn mà không nằm trong ngoại lệ 2.4 thì script báo `tint_fails` > 0. Bảng đầy đủ: cuối `tools/contrast.md`.

### 2.1 Bảng token (sáng + tối)

Cột "v0.3" ghi giá trị trước S4-49. **(đổi)** = đổi ở v0.4; **(đổi v0.4.1)** = đổi ở v0.4.1 (critic kickoff #18/#19 – 11.1.1); **mới** = token mới ở v0.4; "giữ" = không đổi. Bảng màu `--brand-*` (2.0) không đổi theo chế độ.

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

Quy tắc dùng (v0.4):
- **Chữ chỉ dùng** các token:
  - `--ink`, `--muted` (= Stone), `--faint` (= Stone);
  - `--oak-ink` (= Earth Brown);
  - `--ok`, `--warn`, `--bad`, `--info` (`--info` chỉ trong thông báo – v0.4.1, mục 2.3);
  - `--bar-*-t`, `--ink-inverse`, `--on-earth`.
- **Cấm** dùng `--oak`, `--sage`, `--deco`, `--line`, `--line-strong` cho chữ. Guideline p19: "tránh Sage/Oak làm chữ trên nền sáng" (Light Oak 2,72:1, Sage 2,91:1 trên Ivory).
- **Không chữ trắng (hay Ivory) trên nền Light Oak.**
  - Đo được 3,09:1 (trắng) và 2,72:1 (Ivory) – không đạt AA, dù guideline p19 ghi "White trên Oak/Earth – nút, nhãn".
  - Nút và nhãn màu gỗ dùng **Earth Brown**: `--earth` + `--on-earth`, 6,10:1.
  - Trên nền Oak chỉ đặt chữ Ink (4,59:1, sát ngưỡng): chữ ≥ 14px, đậm 600, chỉ cho nhãn ngắn.
- **`--oak-ink` và `--focus` = Earth Brown #7A5C44** từ v0.4.
  - v0.3 dùng #7A5C2E – một sắc gỗ ngoài bảng.
  - Giữ tên `--oak-ink` để FE/MOB không phải sửa code. Tài liệu mới gọi là "Earth Brown (chữ nhấn)".
- **`--muted` và `--faint` = Stone Grey #6B6760** trên mọi nền sáng đã đo; thấp nhất 4,53:1 trên Cream.
  - Ba nền sát ngưỡng (4,5–4,6:1): Cream (`--surface-2`, `--side`, `--cream`), `--info-bg`, `--oak-soft`. Trên ba nền này **không dùng chữ Stone dưới 12px**.
  - Muốn đặt Stone lên nền khác thì phải thêm cặp vào `gen_tokens.py` và đo trước.
  - `--bad-bg` làm nhạt #F5DFDC → #F7E5E2 để Stone đạt trên nền lỗi (4,41 → 4,62:1). Chữ `--bad` trên nền này cũng tăng: 4,76 → 4,98:1.
  - Không cần ngoại lệ nào cho Stone.
- **Sidebar và nền phụ dùng Cream**: `--side` = `--surface-2` = #EDE6D8. Stone trên sidebar v0.3 (#ECE5D8) chỉ được 4,49:1 – không đạt.
  - Mục menu hover/đang chọn vẫn dùng `--surface`, nên sidebar trùng màu nền phụ không làm mất trạng thái.
  - Seg control đặt trên sidebar nhận biết nhờ viền `--line-strong` (3,24:1).
- **`--cream` (mới):** dải xen kẽ và thẻ nhấn nhẹ trên trang khách, nền báo giá/phiếu trên màn.
- **`--sage` (mới):** chỉ trang trí, ≤ 5% diện tích màn – chấm danh sách, hoa văn minh họa, nét nhấn mảnh. Không làm icon mang nghĩa.
- **`--earth` / `--on-earth` (mới):** chỉ cho `.btn.brand` (C1) và nhãn thương hiệu.
- **`--brand-*`:** màu bảng không đổi theo chế độ. Dùng cho logo, phiếu in (`.print-root` trong `hifi.css` đã chuyển sang `--brand-ink`/`--brand-stone`/`--brand-white`) và hình xuất file. Màn hình vẫn dùng token ngữ nghĩa.
- **Giữ từ v0.3:**
  - viền focus 2px + offset 2px;
  - trên vùng tối dùng `--focus-on-dark`;
  - nút bị khóa: nền Cream, chữ Stone, viền đứt `--line-strong`, không dùng `opacity`;
  - nền chip `*-bg` chỉ đi với chữ cùng tông;
  - viền thành phần UI dùng `--line-strong`.

### 2.2 Bảng kiểm tương phản (đo theo công thức WCAG 2.2, cả sáng và tối)

- Nguồn: bảng sinh bởi `gen_tokens.py`, lưu ở `tools/contrast.md`.
- Yêu cầu: chữ ≥ 4,5:1, thành phần UI ≥ 3:1.
- Kết quả v0.4.1: **0 cặp bắt buộc không đạt** (`fails: 0`) và **0 tint/shade lệch chưa khai** (`tint_fails: 0` – bảng kiểm nguồn ở cuối `tools/contrast.md`, ngoại lệ ở 2.4).
- Cặp `forbidden`: guideline cho phép nhưng đo không đạt → DS cấm. Đó là chữ trắng/Ivory trên Light Oak.
- Cặp `info-only`: chỉ ghi để biết, không bao giờ dùng làm chữ.

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

Ghi chú:
- `--ok` và `--bad` chỉ khác nhau 1,03:1 về độ sáng, nên người mù màu đỏ–lục không phân biệt được (HR-11). Vì vậy **mọi** chỗ dùng hai màu này đều có icon khác nhau (✓ / ✕ / ?) và chữ.
- Thanh dài hạn và thanh đã xác nhận ở chế độ tối gần cùng độ sáng (1,35:1; v0.4: 1,15:1). Hai thanh phân biệt bằng sắc độ (xanh rêu / vàng gỗ), tiền tố "HĐ" và icon lịch tháng (D4) – như v0.3.
- `--bar-cf` v0.4.1 = Light Oak 80% + Ivory 20% = `#BEA174`, cùng giá trị ở hai chế độ (critic kickoff #18):
  - chữ trên thanh: Ink 5,77:1 (sáng; v0.4: 6,15), `#1B1A18` 7,07:1 (tối; v0.4: 6,04);
  - thanh so với nền trang 2,16:1 (v0.4: 2,03), so với ô lưới rack 2,34:1 – thanh tách nền rõ hơn một chút;
  - chế độ tối, thanh đã xác nhận so với thanh đang ở (Cream nhạt) còn 1,80:1 (v0.4: 2,11). Hai thanh khác sắc (gỗ / kem trung tính) và khác icon (✓ / giường), nên vẫn đúng D4.
- Số chú thích tròn trong wireframe (chữ Ink trên `--oak`, chỉ trong tài liệu): 4,59:1.

### 2.3 Màu trạng thái

**Tông chip / ô trạng thái (C7) – v0.4.1.** Mỗi trạng thái chọn **một** tông dưới đây và **luôn kèm icon + chữ** (D4).

| Tông | Nền / chữ / viền | Dùng cho | Không dùng cho |
|---|---|---|---|
| `ok` | `--ok-bg` / `--ok` | Thành công, Đạt, Sẵn sàng, Đã xong | – |
| `warn` | `--warn-bg` / `--warn` | Cần hành động sớm, sắp hết hạn, chờ duyệt | – |
| `bad` | `--bad-bg` / `--bad` | Lỗi, Không đạt, Khóa, Quá hạn | – |
| `oak` | `--oak-soft` / `--oak-ink` | Bước trung gian trong quy trình riêng của OTTIMO: VC chờ kiểm, CL, đã gửi khai báo | – |
| **`ink`** *(mới v0.4.1)* | `--surface` / `--ink` / viền 1px `--line-strong` (13,50:1; viền 3,82:1) | Trạng thái **đang diễn ra hoặc đã tiếp nhận, đúng tiến độ**: OC "Có khách", khai báo `scanned`/`pre`, yêu cầu khách `acknowledged`/`in_progress`, phiếu sửa "Đang sửa", hoa hồng `earned`, "Máy này", đơn `in_house` (chip) | Trạng thái cần hành động (dùng `warn`/`bad`) |
| `neutral` | `--surface-2` / `--muted` (Stone) | Trạng thái **thụ động, mới tạo hoặc đã đóng**: chưa có, đã gửi, đã hủy, không tính, đã trả phòng | – |
| `info` | `--info-bg` / `--info` | **Chỉ thông báo**: Alert/Banner C19, mục "Cần chú ý" mức `info` C20, khối ghi chú 6.14 (`.amenity`) | **Mọi trạng thái của đối tượng** (chip, ô buồng, thanh rack, thẻ việc) – critic kickoff #19: xanh lam nằm ngoài bảng màu, chỉ được giữ ở chỗ có chức năng báo tin (2.4) |

- Phân biệt `ink` với `neutral` không chỉ bằng màu: `ink` có viền và chữ Ink đậm, `neutral` không viền, chữ Stone; hai nhóm còn khác icon.
- `.chip.info` trong `hifi.css`/`wf.css` từ v0.4.1 là **bí danh** của `.chip.ink`. Code đang truyền `tone="info"` sẽ tự hiện Ink ở bản build kế tiếp mà không phải sửa. FE/MOB đổi sang `ink` theo đợt B0b (11.6); bí danh bị xóa ở v0.5.
- Chú thích tài liệu trong wireframe/hi-fi (`.rbac-note`, `.role-tag`, `.note-rbac`, `.spec .op`) vẫn dùng `--info`. Đó là chú thích cho người đọc thiết kế, không lên sản phẩm.

**Trạng thái đơn** (tên kỹ thuật theo BR-301 / decision-log – không đổi tên):

| `status` | Nhãn VI | Nhãn EN | Thanh rack | Icon | Phân biệt không cần màu |
|---|---|---|---|---|---|
| `hold` | Giữ chỗ · chờ cọc | On hold · awaiting deposit | nền `--surface`, viền **đứt** 2px `--oak-ink` | đồng hồ cát | viền đứt + bộ đếm "còn 5 giờ 20 phút" |
| `confirmed` | Đã xác nhận | Confirmed | `--bar-cf` (Light Oak 80% + Ivory 20%) | dấu ✓ | icon + nhãn trong drawer |
| `in_house` | Đang ở | In house | `--bar-in` (đậm) | giường | icon |
| `checked_out` | Đã trả phòng | Checked out | `--surface-2`, chữ `--muted` | cửa ra | icon, nhạt |
| `cancelled` | Đã hủy | Cancelled | **không hiện trên rack** | ✕ | chip gạch ngang trong danh sách/CRM |
| `no_show` | Không đến | No-show | **không hiện trên rack** | người ✕ | chip `bad` |
| (loại) dài hạn | Hợp đồng dài hạn | Long-term lease | `--bar-long` (v0.4: Sage Deep, chữ Ivory) + tiền tố "HĐ" | lịch tháng | tiền tố chữ "HĐ" |
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
| OC | **ink** (v0.4.1: chữ Ink, viền `--line-strong` – bỏ `info`) | người |
| OD | warn | người + chổi |
| OOO | bad | ổ khóa |

**Kết quả kiểm tra** (HR-07): `pass` Đạt (ok, ✓, viền liền) · `fail` Không đạt (bad, ✕, viền liền 2px) · `unknown` Chưa kiểm được – cần kiểm tay (warn, ?, viền **đứt** 2px).

**Khai báo lưu trú** (BR-607, SM-05): `none` neutral (thẻ) · `partial` warn (người) · `review` warn (cảnh báo) · `scanned` **ink (quét)** · `pre` **ink (quả địa cầu)** · `sent` oak (gửi đi) · `confirmed` ok (khiên) · `needs_update` warn (lịch) · `updated` ok (✓) · `void` neutral gạch ngang (✕). Sắp/quá hạn khai báo hiện thêm chip warn "Khai báo quá hạn" – không đổi tông của trạng thái.

**Yêu cầu khách** (SM-15): `new` neutral (tin nhắn) · `acknowledged` **ink (chuông)** · `in_progress` **ink (đồng hồ cát)** · `done` ok (✓) · `declined` neutral (✕). **Yêu cầu duyệt** (SM-10): `pending` warn · `approved` ok · `rejected` bad · `escalated` warn · `cancelled` neutral. **Hoa hồng** (SM-11): `projected` neutral (đồng hồ) · `earned` **ink (ngôi sao)** · `payable` warn (tiền) · `paid` ok (✓) · `void` neutral gạch ngang (✕).

Tên icon theo bộ `@ottimo/ui` (`icons.ts`): id, users, alert, scan, globe, out, shield, calendar, check, x, chat, bell, hourglass, clock, star, cash. Máy đọc: `tokens.json` → `status.registration`, `status.guestRequest`, `status.commission`.

### 2.4 Ngoại lệ chức năng – màu ngoài bảng thương hiệu (v0.4, cập nhật v0.4.1)

| Nhóm | Token | Vì sao giữ | Giới hạn dùng |
|---|---|---|---|
| **Trạng thái** | `--ok`/`--ok-bg`, `--warn`/`--warn-bg`, `--bad`/`--bad-bg`, `--info`/`--info-bg` | Bảng thương hiệu không có màu báo thành công/cảnh báo/lỗi. Nhân viên cần nhận ra Đạt / Cảnh báo / Lỗi / Thông tin ngay, theo quy ước quen thuộc (xanh lá – nâu vàng – đỏ – xanh lam). Bốn màu đã ngả ấm, ít bão hòa, đậm ngang Ink/Earth Brown để không lấn bảng màu | Chỉ để nói **trạng thái**: chip, icon, viền và nền alert, chữ lỗi dưới ô nhập. Không trang trí, không tô mảng lớn (nền `*-bg` chỉ sau chip/alert). Luôn kèm icon + chữ (D4). Trang khách: chỉ ở alert và lỗi ô nhập. Landing: không dùng. **v0.4.1: `--info`/`--info-bg` hẹp hơn nữa – chỉ cho thông báo (C19 alert/banner, C20 mức `info`, khối ghi chú 6.14).** Trạng thái của đối tượng trước đây tông `info` (OC, `scanned`, `pre`, `acknowledged`, `in_progress`, `earned`…) chuyển sang chip `ink` (2.3), cùng lý do v0.4 đã bỏ xanh khỏi thanh "dài hạn" |
| **Thanh "dài hạn"** | `--bar-long`, `--bar-long-t` | v0.3: xanh xám #5B7387, ngoài bảng → v0.4: **Sage Deep** #646859 (Sage pha Ink 40%), chữ Ivory 5,04:1. Chế độ tối: Sage #8A9079, chữ tối 5,26:1. **Đã về bảng màu – không còn là ngoại lệ về sắc** | Rack và chip "HĐ" có thể vượt 5% diện tích khi nhiều căn dài hạn. Chấp nhận vì rack là màn vận hành nội bộ |
| **Chế độ tối** | mọi giá trị `dark` | Guideline không quy định nền tối. Bản tối là tint/shade của bảng, dành cho nhân viên làm ca đêm | **Trang khách (guest-web) và landing chỉ chế độ sáng** (11.5). Desk/PWA giữ theo hệ điều hành + công tắc |
| **Tint/shade** | `--surface`, `--line`, `--line-strong`, `--deco`, `--oak-soft`, `--bar-cf`, `--oak` (tối) và các nền tối pha đen | Giao diện cần nhiều bậc nền/viền hơn 7 màu | Pha từ đúng một màu bảng, **một tỷ lệ cho cả ba kênh** (cột nguồn ở 2.1); không tạo sắc mới. `gen_tokens.py` kiểm từng token (`tint_fails: 0`). **v0.4.1:** `--bar-cf` (hai chế độ) và `--oak` tối sinh lại bằng `mix()` = Light Oak 80% + Ivory 20% `#BEA174`. Bản v0.4 `#C9A56E`/`#B8925A` pha R 37% / G 24% / B 16% – thực chất là một sắc vàng cam mới (critic kickoff #18) |
| **Tint nắn sắc** *(v0.4.1 – ngoại lệ có kiểm)* | `--oak-ink`/`--focus` tối `#D9B987` (lệch 17,6); `--oak-soft` sáng `#F1E7D6` (5,2) và tối `#3A3226` (8,4); `--line-strong` sáng `#857E71` (6,4) | Đo bằng bảng kiểm nguồn trong `tools/contrast.md`. Giữ vì:<br>• `--oak-ink`/`--focus` tối: link, chữ nhấn và viền focus cần ánh gỗ đủ đậm để khác chữ Cream thường trên nền tối. Pha đúng tỷ lệ (Light Oak 60% + Ivory 40% = `#CBB591`) xám hơn, gần chữ thường.<br>• `--oak-soft`: pha đúng tỷ lệ (Ivory 90% + Light Oak 10% = `#EDE6DA`) gần như trùng Cream `#EDE6D8` của sidebar, header bảng, nút khóa → mất nền "đang chọn / hôm nay". Bản tối cũng vậy.<br>• `--line-strong` sáng: lệch ấm nhẹ, mắt không thấy; viền ô nhập đã đo ≥ 3:1 trên 9 nền từ v0.3 | Chỉ các token này, chỉ đúng giá trị này. Mỗi ngoại lệ có lý do trong `TINT_EXCEPTIONS` của `gen_tokens.py`. Token mới không được nắn sắc: lệch > 4,5 mà không khai ở đây thì script báo lỗi. Xét lại cả nhóm khi đo chế độ tối ở R3 |

### 2.5 Chỗ guideline chưa đạt chuẩn tiếp cận – DS chọn gì và đề xuất guideline v1.1

UXD ghi lệch theo yêu cầu INV ("lệch thì guideline thắng; UXD ghi lại chỗ lệch và đề xuất sửa"). Các đề xuất dưới đây trùng với `landing/concept.md` 2.3 và 3.1 và gom chung một lượt gửi người làm guideline.

| Guideline nói | Đo / thực tế | DS v0.4 làm | Đề xuất guideline v1.1 |
|---|---|---|---|
| p19 "White trên Oak/Earth – nút, nhãn" | White/Oak 3,09:1 – không đạt AA cho chữ thường | Nút/nhãn màu gỗ = Earth Brown (6,10:1). Oak không làm nền chữ trắng | "White trên Earth Brown cho nút; Oak chỉ cho nét kẻ, chữ ≥ 24px, hoặc chữ Ink trên Oak" |
| p22 H1 40–64pt, H2 26–32pt (thang in) | Màn quầy dày thông tin; điện thoại 360px | Thang chữ màn hình nhỏ hơn (3.1). Trang khách/landing dùng thang lớn hơn | Thêm "thang chữ màn hình" bên cạnh thang in |
| p22 H3 Subhead = Be Vietnam Pro SemiBold | v0.3 dùng Lora 600 | v0.4 về Be Vietnam Pro 600 | – (DS sửa theo guideline) |
| p22 tracking "+4 / +2 / +10" không ghi đơn vị | – | Hiểu là % cỡ chữ: 0,04em / 0,02em / 0,1em **[GIẢ ĐỊNH]** (như landing G-6) | Ghi rõ đơn vị |
| p21 "Lora: tên phòng" so với bảng cấp chữ p22 | Hai trang không nói cùng một ý | Tên phòng cho khách dùng Lora. Trên Desk tên phòng là nhãn phụ nhỏ, dùng sans (11.3) | Ghi "Tên phòng: Lora 400–500, cỡ giữa H2 và H3; nhãn phụ trên màn vận hành dùng sans" |
| Không nói tới màu trạng thái, chế độ tối | – | 2.4 | Thêm mục "màu chức năng" |

## 3. Chữ

| Token | Font | Cỡ / dòng / giãn chữ | Dùng cho | Cấp guideline (p22) |
|---|---|---|---|---|
| `display` | Lora **500** | 32 / 1,2 / 0,02em | Màn hoàn tất của khách, tiêu đề lớn app khách | H1 Display (trang khách ≥ 768px tới 40px, giãn 0,04em) |
| `h1` | Lora **500** | 24 / 1,25 / 0,02em | Tiêu đề màn hình | H2 Heading – thang màn hình |
| `h2` | Lora **500** | 19 / 1,3 / 0,02em | Tiêu đề thẻ, modal | H2 Heading – thang màn hình |
| `h3` *(v0.4)* | **Be Vietnam Pro 600** | 16 / 1,3 / 0 | Tiêu đề nhóm trong thẻ, mục con (v0.3: Lora 600 – lệch guideline) | H3 Subhead |
| `h3-label` | Be Vietnam Pro 600, CHỮ HOA | 12 / 1,4 / 0,1em | Nhãn nhóm | Label |
| `room-name` *(v0.4)* | Lora 500 | theo ngữ cảnh (trang khách 20) | Tên phòng cho khách – "The Pine" (11.3) | p21 "Lora: tên phòng" |
| `kpi` | Lora 600, tabular-nums | 26 / 1,15 | Số KPI, số căn, tổng bill | – (số cần đậm) |
| `body-desk` | Be Vietnam Pro 400 | 14 / 1,5 | Thân chữ máy tính quầy | Body |
| `body-mobile` | Be Vietnam Pro 400 | 16 / 1,5 | Thân chữ mọi màn điện thoại (tránh iOS tự phóng ô nhập) | Body |
| `body-hk` | Be Vietnam Pro 500 | 17 / 1,45 | Giao diện buồng phòng/bảo trì | Body |
| `caption` | Be Vietnam Pro 400 | 12 / 1,45 | Chữ phụ nhỏ nhất trên máy tính | Body |
| `mono` *(v0.4)* | **JetBrains Mono 400** | 13 / 1,4 (Desk); **16** (điện thoại, trang khách) | Mã đặt phòng (`OTM-0150`), số bill (`F26-000123`), Wi-Fi (tên mạng, mật khẩu), nội dung chuyển khoản VietQR, mã hồ sơ khai báo, mã phiếu sửa (`WO-00001`), ô mã OTP (C31), mã cấp cho khách (C32) | Mono |

Quy tắc:
- **Lora 500 cho tiêu đề** (v0.3: 600) **[GIẢ ĐỊNH]**.
  - Guideline không ghi độ đậm; mẫu p21–p22 là Lora thường.
  - 500 giữ nét thanh của thương hiệu mà vẫn rõ ở 19–24px trên màn. Lora 400 ở 19px trên nền Cream hơi mảnh.
  - Lora 600 chỉ cho số: KPI, số căn, tổng tiền.
  - `@fontsource/lora` 500/600 đã có sẵn trong `@ottimo/ui`.
- **JetBrains Mono chỉ cho chuỗi mã**, không dùng cho câu.
  - Font phân biệt rõ 0/O và 1/l/I – lý do guideline chọn cho Wi-Fi và mã đặt phòng.
  - Tự host `@fontsource/jetbrains-mono` 400 + 500, ghim đúng phiên bản như hai font kia.
  - Giấy phép SIL OFL 1.1, miễn phí – không cần ESC.
  - Subset latin + latin-ext + vietnamese, `font-display: swap`.
  - Mã dài trên điện thoại: giãn chữ 0,02em, không ngắt dòng giữa mã (`white-space: nowrap` + cuộn ngang trong ô nếu cần).
- **Fallback theo guideline p22:** Georgia / Arial / Courier New – đã đưa vào `--serif`, `--sans`, `--mono`.
  - Be Vietnam Pro không có Cyrillic, nên chuỗi RU rơi về Arial (có Cyrillic). Trên Android không có Arial thì dùng `system-ui`.
  - Lora có Cyrillic, nên tiêu đề RU vẫn là Lora.
- **Chữ hoa** chỉ cho Label (giãn 0,1em) và con dấu "ĐÃ THU ĐỦ / PAID IN FULL" (con dấu dạng Label). Không viết hoa cả câu để nhấn (guideline mục 2).
- **Cỡ tối thiểu:**
  - máy tính 12px;
  - điện thoại 14px cho chữ phụ, chip, nhãn thanh dưới; 16px cho thân chữ, ô nhập, toast;
  - buồng phòng 16px cho mọi chữ, thân 17px.
- Đơn vị `rem` trong code, để phóng chữ tới 200% không vỡ bố cục (WCAG 1.4.4).
- Số tiền, giờ, số căn dùng `font-variant-numeric: tabular-nums`. Định dạng tiền theo `content-guide.md` mục 4.
- **Tự host mọi font** (SIL OFL 1.1, không CDN – CSP): Lora 500/600, Be Vietnam Pro 400/500/600, JetBrains Mono 400/500.

### 3.1 Thang chữ màn hình so với guideline (ngoại lệ có chủ đích)

Quy đổi: 1 pt = 1,333 px (định nghĩa CSS).

| Cấp guideline | Guideline (in) | = px | Desk / PWA | Trang khách (điện thoại → ≥ 768px) | Lý do |
|---|---|---|---|---|---|
| H1 Display | 40–64 pt | 53–85 | `display` 32 | 32 → 40 | Màn 360px. Lời chào trên guest-web dài 25–35 ký tự |
| H2 Heading | 26–32 pt | 35–43 | `h1` 24, `h2` 19 | 24 → 28 | Màn quầy có nhiều khối. Tiêu đề lớn đẩy dữ liệu xuống dưới nếp gấp |
| H3 Subhead | 16–20 pt | 21–27 | `h3` 16 | 18 | Đứng ngay trên thân chữ 14–16px. 16–18px đậm 600 vẫn khác rõ thân chữ |
| Body | 11–13 pt | 15–17 | 14 (Desk) / 16 / 17 (HK) | 16 | Trong khoảng; riêng Desk 14px cho mật độ |
| Label | 9–11 pt | 12–15 | 12 | 13 | Trong khoảng |
| Mono | 10–13 pt | 13–17 | 13 | 16 | Trong khoảng |

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

## 5. Component (34)

Mỗi component có: mục đích · biến thể · trạng thái · quy tắc a11y. Minh họa trong wireframe (mã luồng trong ngoặc).

| # | Component | Biến thể / trạng thái | Quy tắc chính |
|---|---|---|---|
| C1 | **Button** | `primary` (nền `--ink`, chữ `--ink-inverse` – Desk, HK, mọi màn nhân viên), **`brand`** *(v0.4)* (nền `--earth` Earth Brown, chữ `--on-earth` trắng 6,10:1 – nút chính trên trang khách, báo giá trên màn, landing), `secondary` (viền `--line-strong`), `ghost` (chữ `--oak-ink` = Earth Brown), `danger` (nền `--bad`), `sm`; trạng thái hover, focus, đang xử lý ("Đang lưu…" + vô hiệu), disabled (`aria-disabled` + lý do gần nút) | Nhãn là **động từ + đối tượng** ("Hoàn tất trả phòng", không "OK"). Mỗi vùng tối đa 1 nút primary hoặc brand. Nút bị khóa phải có chữ giải thích vì sao (ví dụ "Dọn xong (còn 3 mục)"). **Cấm nút nền Light Oak chữ trắng** (3,09:1 – mục 2.5) |
| C2 | **IconButton** | 32 / 44 / 48px | Bắt buộc `aria-label`; tooltip hiện cả khi focus |
| C3 | **Field (Input, Select, Textarea)** | mặc định, focus, lỗi (viền 2px `--bad` + dòng lỗi có icon ✕), chỉ đọc, đang kiểm (spinner nhỏ) | Nhãn luôn hiển thị phía trên (không dùng placeholder thay nhãn); `*` bắt buộc + chữ "Bắt buộc" cho trình đọc; lỗi gắn `aria-describedby`, `aria-invalid`; trợ giúp dưới ô; điện thoại cỡ 16px |
| C4 | **Stepper +/−** | 44px (Touch), 56px (HK); có `data-max` | Thay ô số cho minibar, số thẻ, số khách (BL 8.3). `output aria-live="polite"` |
| C5 | **Segmented control** | 2–5 lựa chọn | `aria-pressed`; dùng cho bộ lọc, kiểu xem, chọn phương thức |
| C6 | **Checkbox / Radio / Switch** | Switch = `role="switch"` + `aria-checked` | Không tích sẵn cho đồng ý pháp lý (BR-609) |
| C7 | **Chip trạng thái** | ok, warn, bad, oak, **ink** (v0.4.1), neutral, hold (viền đứt), strike, long (Sage Deep – "HĐ", v0.4). `info` bỏ ở v0.4.1 – `.chip.info` là bí danh của `.chip.ink` tới v0.5 | **Luôn có icon + chữ**; không dùng chip chỉ có chấm màu. Chọn tông theo bảng đầu mục 2.3 (trạng thái đối tượng không dùng `info`). Không dùng `--sage` làm nền chip có chữ (Ink trên Sage 4,29:1 – không đạt) |
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
| C20 | **Persistent task ("Cần chú ý")** | urgent, soon, info (mức `info` của mục cần chú ý – thông báo nên được dùng `--info`), normal | Ở lại tới khi xử lý xong; sinh từ quy tắc (BR-907); có nút hành động trực tiếp |
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
| C32 | **Code display (mã cấp cho khách)** *(đợt 4)* | mã lớn JetBrains Mono (v0.4) + đếm ngược hiệu lực | Chỉ hiện trong modal, không ghi vào thông báo/toast; cảnh báo không gửi kèm link |
| C33 | **Brand mark (logo)** *(v0.4)* | wordmark "OTTIMO" (Lora), lockup ngang, lockup dọc (biển hiệu), monogram núi; 4 phiên bản màu (trên Ivory, trắng, Ink, Oak) | Cỡ tối thiểu: wordmark 120px, lockup ngang 180px, monogram 32px (`size.logo.*`); vùng an toàn ≥ chiều cao chữ "x"; không kéo giãn/xoay/đổi màu/thay font. Tên truy cập đọc từ chữ, không `aria-label` lặp. Chỗ dùng: mục 11.4. Chờ SVG của INV |
| C34 | **Room label (tên phòng)** *(v0.4)* | `guest` ("The Pine", Lora 500; hạng phòng khi đơn chưa báo căn), `staff` ("401 · The Pine": số Lora 600 + tên sans 12–13px `--muted`), `fallback` khi chưa có tên | Theo BR-012. Một helper `roomLabel()` dùng chung; `aria-label` "Căn 401, The Pine"; khách không thấy số căn (mục 11.3) |

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
App khách: VI + EN (R2), RU (R3) – mọi chuỗi từ file chuỗi, không ghép câu bằng code; ngôn ngữ mặc định theo trình duyệt (v0.4: trình duyệt không phải vi/ru → EN, "tiếng Anh dẫn dắt" – mục 11.2), đổi tay ở đầu trang, ghi nhớ theo đơn. Bố cục chịu được chuỗi dài hơn 40% (RU/DE): nút xuống dòng, không cắt chữ, không cố định chiều rộng theo chữ VI.

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
| A10 | (bổ sung) Focus ring 2,72:1 | 2.4.7, 1.4.11 | `--focus` (v0.4: Earth Brown) ≥ 4,91:1 trên mọi nền sáng (thấp nhất trên Cream), 2px + offset 2px; không bỏ outline | mọi trang |
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
- v0.4: `gen_tokens.py` sinh thêm bảng màu `--brand-*`, cột "Nguồn bảng màu" và loại cặp `forbidden` (cặp guideline cho phép nhưng không đạt AA). Thêm token màu: thêm vào `COLORS` kèm nguồn bảng màu; thêm nền mới cho chữ Stone: thêm cặp vào `PAIRS` trước khi dùng.

## 11. Thương hiệu OTTIMO trong sản phẩm (v0.4 – S4-49)

Phạm vi: Desk (admin-web), PWA buồng phòng/bảo trì, guest-web (`g.`), báo giá, mẫu tin nhắn, phiếu thanh toán, phiếu in. Landing đã theo guideline từ concept v1.1 (`landing/concept.md`), chỉ chờ logo và bảng tên phòng.

### 11.1 Token đổi ở v0.4 – app thấy gì sau khi build lại

| Token | v0.3 → v0.4 (sáng) | v0.3 → v0.4 (tối) | Thấy ở đâu | Mức thay đổi nhìn thấy |
|---|---|---|---|---|
| `--ink`, `--bar-cf-t` | #2B2B2B → **#2B2B28** (Ink) | #EDE8DF → #EDE6D8 (Cream) – chỉ `--ink` | Chữ chính, nút chính | Gần như không thấy |
| `--ink-inverse` | #FBF9F4 → **#F4F0E8** (Ivory) | giữ | Chữ trên nút chính, toast | Gần như không thấy |
| `--muted`, `--faint` | #635F58 / #6A645B → **#6B6760** (Stone) | giữ | Chữ phụ, header bảng, menu, chú thích | Nhạt hơn một chút (trên nền trang 5,58 → 4,95:1) |
| `--oak-ink`, `--focus` | #7A5C2E → **#7A5C44** (Earth Brown) | giữ | Link, mục đang chọn, viền focus, cột biểu đồ, icon nhấn | Bớt vàng ô-liu, nâu ấm hơn |
| `--surface-2`, `--side` | #EEE8DC / #ECE5D8 → **#EDE6D8** (Cream) | `--surface-2` #2D2A26 → #2B2B28 | Sidebar, header bảng, seg, nút bị khóa | Không thấy |
| `--bad-bg` | #F5DFDC → **#F7E5E2** | giữ | Alert/chip lỗi, khối OOO, làn "Chưa gán căn" | Hồng nhạt hơn một chút |
| `--bar-in` | #2F2D2A → **#2B2B28** (Ink) | giữ | Thanh "đang ở" | Không thấy |
| `--bar-long`, `--bar-long-t` | #5B7387 / #FFFFFF → **#646859 / #F4F0E8** (Sage Deep / Ivory) | #7E98AD / #111111 → #8A9079 / #1B1A18 (Sage) | Thanh và chip "HĐ" dài hạn trên rack | **Thấy rõ**: xanh xám → xanh rêu |
| *mới* | `--cream`, `--earth`, `--on-earth`, `--sage`, `--brand-ivory/cream/stone/ink/oak/earth/sage/white` | | Chưa có màn nào dùng – vào ở B2/B4 (11.6) | – |
| `--sans` | thêm **Arial** ngay sau Be Vietnam Pro (guideline p22) | | Chỉ khi thiếu glyph (chuỗi RU) | RU: Arial thay `system-ui` |
| `--mono` | `ui-monospace…` → **"JetBrains Mono", "Courier New", ui-monospace…** | | Mọi `.mono`, `.code-input`, `kbd`, `.masked` | **Cần B1 cùng bản build**: chưa tải JetBrains Mono thì mã hiện bằng Courier New |
| `tokens.json` | typography: `h1`/`h2`/`display` Lora 500 + giãn 0,02em; thêm `h3`, `room-name`, `mono`; `size.logo.*`; `status.room.VC` tone `ok` → `oak` (khớp 2.3 – JSON v0.3 lệch tài liệu) | | Chỉ là đặc tả – `hifi.css` áp ở B2 | – |

Đã kiểm: `gen_tokens.py` báo `fails: 0`. Unit test vẫn xanh với chuỗi + token mới: admin-web 202/202, guest-web 50/50, `@ottimo/ui` 10/10, `@ottimo/i18n` 4/4. Hi-fi H08 (rack sáng/tối), H16, H18 đã chụp lại bằng Chromium không giao diện: không vỡ bố cục. Demo đang chạy dùng ảnh build sẵn, không bị ảnh hưởng.

#### 11.1.1 Đổi ở v0.4.1 (critic kickoff Sprint 4 #18, #19)

| Token / lớp CSS | v0.4 → v0.4.1 (sáng) | v0.4 → v0.4.1 (tối) | Thấy ở đâu | Mức thay đổi nhìn thấy |
|---|---|---|---|---|
| `--bar-cf` | #C9A56E → **#BEA174** (Light Oak 80% + Ivory 20%) | #B8925A → **#BEA174** | Thanh "Đã xác nhận" trên rack, chú giải rack | Bớt cam, ngả gỗ sồi tự nhiên hơn; chữ Ink 6,15 → 5,77:1 (sáng), 6,04 → 7,07:1 (tối) |
| `--oak` (chỉ tối) | giữ #B08D57 | #C9A56E → **#BEA174** | Logo, nét kẻ nhấn ở chế độ tối | Gần như không thấy |
| `--info`, `--info-bg` | giữ màu | giữ màu | Chỉ còn alert/banner, "Cần chú ý" mức info, khối ghi chú 6.14 | – |
| `.chip.ink` (mới) và `.chip.info` (bí danh) | chip `info` xanh lam → **Ink trên `--surface`, viền `--line-strong`** | như sáng | Mọi `Chip tone="info"` đang có trong admin-web: "Đang ở" (danh sách/drawer đơn), "Máy này", chip bộ đồ dùng thêm trên rack, chip "HĐ" ở drawer/hộp dài hạn (đúng ra là `long` – B0b) | **Thấy rõ**: chip xanh lam → chip viền kem, chữ Ink |
| `.hk-card.kit` | viền trái `--info` → **`--line-strong`** | như sáng | Thẻ việc "chuẩn bị bộ đồ dùng thêm" (PWA – chưa có code) | Viền xanh → viền xám ấm |
| `tokens.json` | `status.room.OC` tone `info` → `ink`; thêm `status.tone`, `status.registration`, `status.guestRequest`, `status.commission` | | Đặc tả máy đọc cho FE/MOB | – |

Đã kiểm (17/10, v0.4.1): `gen_tokens.py` báo `fails: 0`, `tint_fails: 0`. Unit test xanh, không phải sửa test: admin-web 202/202, guest-web 50/50, `@ottimo/ui` 10/10. `check_hifi.py` xanh 24 màn. Đã chụp lại H08 rack và H23 bằng Chromium không giao diện: thanh đã xác nhận và chip `ink` hiển thị đúng, không vỡ bố cục. Không đụng demo đang chạy.

### 11.2 Giọng văn chữ khách nhìn thấy – "tiếng Anh dẫn dắt, tiếng Việt hỗ trợ"

Áp cho: guest-web (`g.`), báo giá gửi khách, mẫu tin nhắn (M13, sau này Zalo/ZNS), phiếu thanh toán, email. Giao diện nhân viên giữ tiếng Việt (content-guide mục 1).

1. **Khoảnh khắc thương hiệu tiếng Anh ở mọi ngôn ngữ.** Gồm lời chào đầu trang, tagline, lời kết, tên thương hiệu và tên phòng.
   - Ngay dưới là một dòng hỗ trợ nhỏ (Stone, gắn `lang`): trang VI/RU có dòng cùng ý bằng ngôn ngữ trang; trang EN có dòng tiếng Việt.
   - Cách làm giống landing (`concept.md` mục 5).
2. **Nội dung chức năng dùng một ngôn ngữ – ngôn ngữ khách chọn.** Gồm nút, ô nhập, hướng dẫn, văn bản pháp lý, lỗi.
   - Không trộn hai ngôn ngữ trong một câu hay một ô (WCAG 3.1.2).
   - Văn bản đồng ý phải đúng ngôn ngữ khách đọc (SEC R-CON-02, content-guide 6).
3. **Ngôn ngữ mặc định khi chưa biết** **[GIẢ ĐỊNH – PO xác nhận]**:
   - Thứ tự: phiên/hồ sơ khách → trình duyệt. Trình duyệt `vi*` → VI, `ru*` → RU, **còn lại → EN** (v0.3: còn lại → VI).
   - Mẫu tin và báo giá: theo ngôn ngữ hồ sơ khách. Chưa có thì VI cho quốc tịch VNM hoặc số +84, EN cho mọi trường hợp khác.
4. **Viết bản EN trước** khi soạn chữ khách mới, rồi chuyển ý sang VI (không dịch máy). RU nháp theo bản EN, cần người bản ngữ duyệt.
5. **Giọng:** ngắn, lịch sự, điềm tĩnh, giữ khoảng cách vừa đủ.
   - Không emoji, không "!", không viết hoa để nhấn.
   - Không dùng "Quý khách", "Gia đình OTTIMO", "rất hân hạnh được phục vụ", "dạ thưa anh chị yêu quý".
   - Xưng "bạn" (VI), "you" (EN), «Вы» (RU).
   - Câu chuẩn: "Welcome to OTTIMO. We hope you enjoy your stay."
6. **Tên thương hiệu và tagline:** viết "OTTIMO" (tên riêng, chữ hoa), tagline giữ nguyên văn "A refined stay inspired by the calm spirit of Dalat." Tên phòng theo 11.3.

**Danh sách cần đổi**

| # | Bề mặt | Hiện trạng | Đổi thành | Ai | Phụ thuộc |
|---|---|---|---|---|---|
| G1 | guest-web – ngôn ngữ mặc định | `browserLocale()`: trình duyệt không phải en/ru → VI | không phải vi/ru → **EN** | MOB | PO xác nhận mục 3 |
| G2 | guest-web – đầu trang, lời chào | "Xin chào, Anna" (H18); nút chính nền Ink | H1 "Welcome to OTTIMO, Anna." ở mọi ngôn ngữ (gắn `lang="en"`) + dòng hỗ trợ (11.2.2); wordmark Lora; nút chính `.btn.brand` (Earth Brown, chữ trắng) | UXD (chuỗi `gw.welcome*`, hi-fi H18), MOB | B2 |
| G3 | guest-web – tên phòng | "Căn: 103" (`roomNo`) | "Room: The Bloom" / "Phòng: The Bloom" (Lora) | ARC (`GuestStay.roomName` + hạng phòng công khai, OpenAPI 0.3.7), BE, MOB | Contract 0.3.7; ánh xạ tạm BL 4.1 |
| G4 | guest-web – dấu "!" | `guest.oci.done_title` "Xong! Hẹn gặp bạn ngày {date}" / "All set! See you on {date}"; `guest.late.done_title` (R3) | "Thủ tục đã xong. Hẹn gặp bạn ngày {date}." / "You're all set. See you on {date}." | UXD (chuỗi v0.4.1) | – |
| G5 | guest-web – Wi-Fi, mã đặt phòng | `.mono` 13px, font hệ thống | JetBrains Mono 16px; nút "Sao chép" giữ | MOB | B1 |
| G6 | guest-web – chế độ màu | theo hệ điều hành (có thể tối) | **chỉ sáng**: `<html data-theme="light">`, `theme-color` #F4F0E8 (đã có) | MOB | – |
| G7 | guest-web – favicon, icon màn hình chính | chưa có | monogram núi ≥ 32px | MOB | Logo SVG INV |
| Q1 | Báo giá `sale.quote_text` | dòng đầu "OTTIMO Boutique Stay – Báo giá {code}"; "Căn {room} {room_name}" | dòng đầu tiếng Anh cố định "OTTIMO · Boutique Stay – Quote {code}"; thân theo ngôn ngữ khách; phòng = **tên phòng**, không số căn; dòng cuối là tagline | UXD (chuỗi), FE (truyền tên phòng) | PO duyệt 11.2.1 |
| M1 | 8 mẫu tin `msg.*` (M13) | "Hi {name}", "Thank you!", "Xin lỗi vì bất tiện!", "căn/room {room}", "Bill" | Bản 11.2.1: "Hello {name},", bỏ "!", `{room}` = tên phòng, "Phiếu thanh toán" | UXD (chuỗi v0.4.1), FE (ngôn ngữ mặc định theo hồ sơ + truyền tên phòng) | PO duyệt 11.2.1 |
| M2 | Mẫu tin tự động R3 (TP-00…15, ZNS) | DOM/INT đang soạn | Viết theo 11.2 ngay từ đầu; mẫu ZNS gửi Zalo duyệt phải là bản đã theo guideline | INT, DOM, UXD | US-161/162 (R3) |
| B1 | Phiếu thanh toán cho khách (C24) | VI/EN; dòng "Tiền phòng căn {room}"; chưa có logo | Đầu phiếu: lockup ngang + "Guest folio · Phiếu thanh toán". Khách nước ngoài: song ngữ, **EN dòng trên, VI dòng dưới** (Stone). Khách VN: VI. Dòng tiền phòng "Tiền phòng – The Valley · 3 đêm" (BR-012); số bill JetBrains Mono | FE, UXD (biến thể `bill.line.*` theo tên phòng) | Logo SVG, `Room.name` |
| B2 | Con dấu "PAID IN FULL / ĐÃ THU ĐỦ" | chữ hoa | giữ (dạng Label, giãn 0,1em) | – | – |
| L1 | Landing | concept v1.1 đã theo guideline | giữ; thay logo + gán tên phòng khi INV gửi | UXD, FE (luồng landing) | INV 19/10 |

#### 11.2.1 Bản đề xuất 8 mẫu tin (EN gốc – VI hỗ trợ) – chờ PO duyệt, UXD đưa vào `gen_strings.py` ở v0.4.1

Quy ước: `{room}` = tên phòng ("The Pine") theo BR-012. Đơn chưa báo căn dùng hạng phòng ("Studio"). Khi chưa nhập tên dùng "room 401" / "phòng 401". Chữ mẫu không tự thêm "căn/room" trước `{room}`. Không mẫu nào chứa mã cửa (BR-978). Giờ 14:00/12:00 vẫn thay bằng tham số BR-401 như ghi chú mục 7 content-guide. RU viết lại theo bản EN ở v0.4.1 (nháp, cần người bản ngữ duyệt).

| Key | English (gốc) | Tiếng Việt |
|---|---|---|
| `msg.booking_confirmed` | Hello {name}, your booking {code} at OTTIMO is confirmed: {room}, {from} → {to} ({nights} nights). Check-in from 14:00, check-out by 12:00. Deposit received: {deposit}; {balance} is due at check-in. Cancellation: {cancel_policy_short}. Check in online for a quicker arrival: {link} | Chào {name}, OTTIMO xác nhận đặt phòng {code}: {room}, {from} → {to} ({nights} đêm). Nhận phòng từ 14:00, trả phòng trước 12:00. Đã nhận cọc {deposit}; còn {balance} thanh toán khi nhận phòng. Hủy: {cancel_policy_short}. Làm thủ tục trước để nhận phòng nhanh hơn: {link} |
| `msg.deposit_received` | Hello {name}, OTTIMO has received your deposit of {deposit} for booking {code} ({room}, {from} → {to}). {balance} is due at check-in. Cancellation: {cancel_policy_short} | Chào {name}, OTTIMO đã nhận cọc {deposit} cho đặt phòng {code} ({room}, {from} → {to}). Còn {balance} thanh toán khi nhận phòng. Chính sách hủy: {cancel_policy_short} |
| `msg.checkin_link` | Hello {name}, for a quicker arrival, please send your ID and arrival time here: {link} (about 2 minutes). | Chào {name}, để nhận phòng nhanh hơn, bạn vui lòng gửi giấy tờ và giờ đến tại: {link} (khoảng 2 phút). |
| `msg.checkout_reminder` | Hello {name}, tomorrow, {date}, is your check-out day (by 12:00). If you would like to stay longer or check out later, reply here: {link} | Chào {name}, ngày mai {date} là ngày trả phòng (trước 12:00). Nếu bạn muốn ở thêm hoặc trả muộn, trả lời tại: {link} |
| `msg.bill` | Thank you for staying at OTTIMO, {name}. Your guest folio {bill_no}: {amount}. Details: {link} | Cảm ơn {name} đã lưu trú tại OTTIMO. Phiếu thanh toán {bill_no}: {amount}. Chi tiết: {link} |
| `msg.utility_bill` | Hello {name}, your utilities for {period}: electricity {kwh} kWh, water {m3} m³, total {amount}, due {due}. Meter photos and details: {link} | Chào {name}, tiền điện nước kỳ {period}: điện {kwh} kWh, nước {m3} m³, tổng {amount}, hạn thanh toán {due}. Ảnh công tơ và chi tiết: {link} |
| `msg.house_rules_smoking` | Hello {name}, a gentle reminder: smoking is permitted on the balcony only. Smoking indoors incurs an odour-treatment fee under our house rules. Thank you. | Chào {name}, OTTIMO xin nhắc nhẹ: chỉ hút thuốc ở ban công. Hút thuốc trong phòng sẽ tính phí khử mùi theo nội quy. Cảm ơn bạn. |
| `msg.hot_water_issue` | Hello {name}, thank you for letting us know about the hot water in {room}. Our technician will be with you by {time}. We apologise for the inconvenience. | Chào {name}, cảm ơn bạn đã báo về nước nóng ở {room}. Kỹ thuật sẽ đến trước {time}. OTTIMO xin lỗi vì sự bất tiện này. |

Đổi so với bản hiện hành:
- Bỏ "!" ở 2 mẫu.
- "Hi" → "Hello".
- Bỏ "căn/room" đứng trước `{room}`.
- "Bill" → "Phiếu thanh toán" / "guest folio" (content-guide 3.1).
- "hóa đơn điện nước" → "tiền điện nước": "hóa đơn" chỉ dùng cho hóa đơn GTGT.
- Tham số giữ nguyên, nên FE không phải đổi code ngoài cách truyền `{room}`.

#### 11.2.2 Chuỗi guest-web mới (đề xuất – vào v0.4.1 cùng G2–G4)

| Key | EN | VI | Ghi chú |
|---|---|---|---|
| `gw.welcome_title` | Welcome to OTTIMO, {name}. | – (luôn hiện bản EN, `lang="en"`) | H1 trang lưu trú |
| `gw.welcome_sub` | We hope you enjoy your stay. | Chúc bạn có một kỳ nghỉ an yên. | Dòng hỗ trợ dưới H1. Trang VI/RU hiện bản của ngôn ngữ trang. Trang EN hiện **bản VI** (tra từ điển VI, gắn `lang="vi"`) – tiếng Việt hỗ trợ. "An yên" là cảm xúc lõi trong guideline |
| `gw.room_label` | Room | Phòng | Nhãn dòng tên phòng (thay `gw.room` "Căn") |
| `gw.room_fallback` | room {no} | phòng {no} | Khi chưa có tên phòng |
| `guest.oci.done_title` | You're all set. See you on {date}. | Thủ tục đã xong. Hẹn gặp bạn ngày {date}. | Sửa (bỏ "!") |

### 11.3 Hiển thị tên phòng – khách thấy "The Pine", nhân viên thấy số căn + tên

**Quy tắc nghiệp vụ:** **BR-012** của DOM (`business-rules.md` v0.3.5, 17/10). Mục này chỉ thêm cách trình bày.
- Dữ liệu: `Room.name` (đã có trong OpenAPI, sửa ở H04 Danh mục căn). Hạng phòng công khai `room.<no>.public_room_type` là trường mới – ARC đưa vào contract 0.3.7.
- Client không viết cứng tên. Tên đọc theo căn **lúc hiển thị**. Riêng phiếu thanh toán đã chốt và HĐ đã ký giữ tên lúc chốt/ký.
- Ánh xạ tạm (BL 4.1, đang có trong seed DS-E) **[GIẢ ĐỊNH – chờ INV gửi bảng 19/10]**: 101 The Amber · 102 The Fern · 103 The Bloom · 201 The Mist · 202 The Valley · 203 The Sage · 301 The Velvet · 302 The Ivory · 401 The Pine · 402 The Ember.

| Bề mặt | Người xem | Hiển thị | Ví dụ | Kiểu chữ |
|---|---|---|---|---|
| guest-web, báo giá, xác nhận, mẫu tin (M13), email, phiếu thanh toán, hóa đơn điện tử, landing, thẻ/biển trong căn | Khách | **Chỉ tên phòng**; cần mô tả thì kèm hạng phòng công khai. **Không in số căn** | The Pine · Studio | Lora 500 khi đứng riêng (`room-name`); trong câu theo chữ của câu |
| Đơn bán theo nhóm **chưa báo căn** (OTA nhóm BR-316, còn tối ưu tồn BR-429) – trước nhận phòng | Khách | **Hạng phòng**, không tên phòng | Studio | – |
| Tin Zalo/ZNS **tự động** (R3) | Khách | **Hạng phòng** (SEC INT-10, BR-978) | Studio | – |
| Rack, danh sách đơn, drawer, nhận/trả phòng, Tổng quan, Cần chú ý, đóng ca, báo cáo, nhật ký | Nhân viên | **Số căn · tên**, sắp theo số căn | 401 · The Pine | Số căn Lora 600 tabular (`.roomno`); tên Be Vietnam Pro 500, 12–13px, `--muted` (`.rm-name` trên rack đã có) |
| PWA buồng phòng/bảo trì (thẻ việc, phiếu sửa) | Nhân viên | Số căn to, tên ngay dưới | **401** / The Pine | Số `.hk-card .room`; tên 16px (tối thiểu HK) |
| Ô chọn căn, tìm kiếm | Nhân viên | 401 · The Pine; gõ "pine", "The Pine" hoặc "401" đều ra (không phân biệt hoa thường, bỏ qua "The") | – | – |
| Câu thông báo, toast, hộp xác nhận | Nhân viên | căn 401 · The Pine | "Hủy giữ chỗ căn 401 · The Pine?" | – |
| Khai báo lưu trú | Pháp lý | **Số căn** (nơi ở thực tế) | 401 | – |
| Hợp đồng dài hạn | Pháp lý | Cả hai | căn hộ 401 – The Pine | – |
| `aria-label` | Trình đọc màn hình | "Căn 401, The Pine, …" | – | – |

Quy tắc trình bày:
- **Cách viết tên:**
  - luôn có "The", viết hoa chữ đầu mỗi từ;
  - không dịch, không viết tắt;
  - không viết hoa toàn bộ, trừ biển hiệu theo lockup dọc.
- **Câu VI cho khách:** "phòng The Pine" (không "căn"). **Câu EN:** "The Pine".
- **Dòng tiền phòng trên phiếu thanh toán:** "Tiền phòng – The Valley · 3 đêm" / "Room – The Valley · 3 nights" (BR-012, không có số căn).
- **Tên phòng khác tên hạng phòng.** Bốn hạng của e-brochure là hạng; landing hiện hạng.
- **Tên phòng nhạy cảm như số căn** (BR-012 (4), BR-978): không đặt cùng mã cửa hay hướng dẫn vào căn trong một tin nhắn.
  - Trang khách có token và phiếu thanh toán vẫn hiện tên phòng.
  - Mã cửa chỉ hiện trong C32, không ghi kèm tên vào toast/tin.
- **Đổi căn** (BR-424, BR-429): khách thấy tên phòng mới. Nhật ký nội bộ ghi số căn + tên cũ/mới.
- **Chưa có tên** (OWN chưa nhập ở H04): khách thấy "phòng 401" / "room 401" – tạm, trái BR-012 (1), chỉ tới khi nhập xong. Nhân viên thấy "401" như hiện nay.
- **Một helper dùng chung** cho FE/MOB: `roomLabel(room, audience: 'guest' | 'staff', locale, opts?)`, đặt trong `@ottimo/ui` hoặc `@ottimo/i18n`.
  - Biến thể `guest` trả hạng phòng khi đơn chưa báo căn.
  - Không để mỗi màn tự ghép.
- **Chỉ đường tự nhận phòng** (`guest.late.how_1` "Đến cửa căn {room}", R3) **[GIẢ ĐỊNH – chờ INV xác nhận, như BR-012]**: biển cửa gắn tên phòng theo lockup dọc, nên khách không cần số căn.

### 11.4 Logo trong sản phẩm (chờ tệp SVG của INV, hẹn 19/10)

| Chỗ | Thành phần | Cỡ tối thiểu (guideline p13) | Hiện tại (tạm) |
|---|---|---|---|
| Desk – đầu sidebar | Wordmark "OTTIMO" + "BOUTIQUE STAY · DESK" | wordmark ≥ 120px | Chữ Lora giãn 0,3em (`.brand`) – giữ tới khi có SVG |
| guest-web – đầu trang | Lockup ngang (≥ 375px), wordmark (< 375px) | lockup ≥ 180px, wordmark ≥ 120px | Chữ Lora "OTTIMO" |
| Favicon, icon PWA/màn hình chính | Monogram núi | ≥ 32px | Chưa có |
| Phiếu thanh toán in A5, email, chữ ký | Lockup ngang | ≥ 180px | Chưa có |
| Landing | Lockup ngang + wordmark | như trên | Bản vẽ lại tạm (`concept.md` mục 4) |

Quy tắc (guideline mục 4):
- Vùng an toàn ≥ chiều cao chữ "x".
- Chỉ 4 phiên bản màu: trên Ivory, trên trắng, trên Ink, trên Oak.
- Không kéo giãn, không xoay, không đổi màu ngoài bảng, không thay font.
- Chữ "OTTIMO" giữ chỗ (font Lora thật) được dùng tạm vì không thay font; không vẽ lại monogram trong app.
- Khi có SVG: UXD xuất bộ `logo-wordmark.svg`, `logo-lockup-h.svg`, `logo-lockup-v.svg`, `logo-monogram.svg` (mỗi bộ 4 màu) + favicon 32/180/512 vào `product/design/brand/`.

### 11.5 Chế độ sáng/tối theo bề mặt (quyết định UXD v0.4)
- **guest-web và landing: chỉ chế độ sáng.**
  - Thương hiệu dựa trên nền Ivory.
  - Khách mở link một vài lần; không cần chế độ tối.
  - Tránh trình duyệt tự đảo màu: `color-scheme: light` (tokens.css đã hỗ trợ `data-theme="light"`).
- **Desk và PWA:** giữ chế độ tối theo hệ điều hành + công tắc, vì nhân viên làm ca đêm. Bản tối là ngoại lệ 2.4.

### 11.6 Việc FE / MOB và thứ tự đề xuất

Sprint 4 ưu tiên sửa lỗi sai tiền trước cổng QC (S4-28 → S4-07, S4-05 → S4-02 + S4-18 → S4-25). Việc thương hiệu không chen vào các mục đó. Việc xếp theo rủi ro từ thấp đến cao, mỗi đợt một PR riêng để kết quả QA không lẫn.

| Đợt | Việc | Ai | Khi nào | Phụ thuộc | Kiểm |
|---|---|---|---|---|---|
| **B0** | Màu v0.4 vào app **không cần sửa code** – `@ottimo/ui` import `tokens.css`. Build lại admin-web, guest-web, PWA | FE, MOB | Bản build kế tiếp | – | QA chụp so sánh H08 rack (thanh dài hạn), H11, H16, H18; axe 0 critical/serious ở 7 luồng (C2) |
| **B1** | (a) Thêm `@fontsource/jetbrains-mono` 400 + 500 vào `packages/ui/src/styles/index.css`, sau Be Vietnam Pro, ghim đúng phiên bản. (b) Áp `.mono` cho: mã đơn, số bill, nội dung chuyển khoản VietQR, mã hồ sơ khai báo, mã phiếu sửa; guest-web: Wi-Fi + mã đặt phòng 16px (G5). (c) KB7 – S4-48: dùng `co.go_bill_needs_told` (lý do khóa "Tiếp tục" bước 2 H16, thay `ci.told_guest`), `checkout.complete_needs_told` (whyLocked bước 3), `co.late_switch_hint_time` với `{time}` = giờ trả chuẩn từ `BookingRules` (thay `co.late_switch_hint` – viết cứng 12:00) | FE (a, b, c), MOB (G5) | **Cùng bản build với B0** (để mã không hiện Courier New) | – | Unit test theo khóa; xem ô mã OTP, VietQR, Wi-Fi ở 360px |
| **B2** | UXD sửa `hifi.css` – nguồn chung, FE/MOB chỉ chạy lại test: `h1`/`h2` Lora 500 + giãn 0,02em; `h3` → Be Vietnam Pro 600; thêm `.btn.brand` (`--earth`/`--on-earth`, focus `--focus`); `.room-name`. Hi-fi H18 làm lại đầu trang khách (G2) | UXD → FE, MOB kiểm | Tuần 1 Sprint 4, sau khi B0/B1 vào | – | `check_hifi.py`; axe; ảnh trước/sau |
| **B3** | Helper `roomLabel()` + "101 · The Pine" trên Desk (rack đã có `.rm-name`, danh sách đơn, drawer, tiêu đề nhận/trả phòng H13/H16, Cần chú ý, Tổng quan) và PWA (thẻ việc); ô chọn/tìm căn theo tên | FE (FE-B), MOB | **Ngay tuần 1** – dùng ánh xạ tạm BL 4.1 (seed DS-E đã có tên; sprint-4-plan S4-49 là CỔNG) | – (bảng INV 19/10 chỉ sửa cấu hình căn) | Unit test helper (có tên / chưa có tên); E2E không đổi (vẫn tìm theo số) |
| **B4** | guest-web: G1 mặc định EN, G2 lời chào + `.btn.brand`, G3 tên phòng, G4 bỏ "!", G6 chỉ sáng, G7 favicon | MOB; ARC thêm `GuestStay.roomName` + hạng phòng công khai (0.3.7, BR-012), BE trả dữ liệu | Sau B2 + contract 0.3.7 | PO xác nhận G1; logo (G7) | Test i18n `browserLocale`; ảnh 360/768px VI/EN/RU |
| **B5** | Chuỗi v0.4.1 (UXD) sau khi PO duyệt 11.2.1/11.2.2 → FE: mẫu tin M1 (ngôn ngữ mặc định theo hồ sơ, `{room}` = tên phòng), báo giá Q1, phiếu thanh toán B1 (song ngữ EN trên – VI dưới, tham số `{room}` của `bill.line.*` = tên phòng – FE tra từ danh mục căn) | UXD → FE | Tuần 2 Sprint 4 hoặc đầu R3 nếu Sprint 4 trễ việc sai tiền | B3; PO duyệt | Unit test mẫu tin theo khóa; in thử phiếu A5 |
| **B6** | Logo SVG: favicon + icon PWA (monogram), đầu guest-web, sidebar Desk, phiếu in, landing | UXD xuất bộ SVG → FE, MOB | Khi INV gửi tệp (hẹn 19/10) | Logo SVG | Cỡ tối thiểu đo trên DOM (như landing 11.1) |
| R3 | Mẫu tin tự động Zalo/ZNS (US-161/162) viết theo 11.2 ngay từ đầu | INT, DOM, UXD | Round 3 | ESC-021 A | – |

Không đổi trong S4-49: màu trạng thái (2.4), bố cục, component khác ngoài C1 `brand`.

**B0b – v0.4.1, chip `ink` thay `info` (critic kickoff #19).** Không chặn bản build nào: bí danh `.chip.info` đã cho kết quả đúng ngay ở bản build kế tiếp, cùng B0. Phần dưới là dọn mã, làm khi chạm file, trước v0.5 (lúc đó xóa bí danh). Không chen vào việc sai tiền.

| Việc | Ai | Chỗ |
|---|---|---|
| Thêm `'ink'` vào kiểu `tone` của `Chip` trong `@ottimo/ui` (không có icon mặc định – bắt buộc truyền `icon`). Bỏ `'info'` khỏi kiểu của `Chip`; `Alert` giữ `info` | FE (FE-B) | `packages/ui/src/Feedback.tsx` |
| `STATUS_TONE.in_house: 'info'` → `'ink'` + icon `bed` (khớp thanh `--bar-in`) | FE-B | `apps/admin-web/src/app/reservations.ts` |
| Chip "HĐ"/`status.booking.long_term` đang `tone="info"` → lớp `long` (C7, Sage Deep) – lệch DS từ v0.4 | FE-B | `ReservationDrawer.tsx`, `booking/LongStayDialog.tsx` |
| Chip bộ đồ dùng thêm (icon sofa) → `ink`; "Máy này" → `ink` + icon `monitor` | FE-B | `rack/RackPage.tsx`, `DevicesPage.tsx` |
| Chip trạng thái khai báo ở trang chi tiết: đang `confirmed ? ok : warn` cho mọi trạng thái → theo bảng 2.3 (`tokens.json` `status.registration`; `scanned`/`pre` = `ink`, `sent` = `oak`) | FE-B | `registration/RegistrationPage.tsx` |
| PWA buồng phòng/bảo trì và guest-web: ô/chip OC, yêu cầu khách `acknowledged`/`in_progress`, phiếu sửa "Đang sửa" dùng `ink` + icon theo 2.3 ngay từ đầu | MOB | PWA (H19–H22), guest-web (H23) |

### 11.7 Giả định và việc chờ
- **[GIẢ ĐỊNH]** Tracking "+4/+2/+10" của guideline = 0,04/0,02/0,1em (như landing G-6).
- **[GIẢ ĐỊNH]** Tiêu đề Lora 500; guideline không ghi độ đậm.
- **[GIẢ ĐỊNH – PO xác nhận]** guest-web mặc định EN khi trình duyệt không phải vi/ru (11.2 mục 3).
- **[GIẢ ĐỊNH – chờ INV xác nhận]** (cùng BR-012 của DOM): ánh xạ tạm BL 4.1; biển cửa gắn tên phòng, khách không cần số căn (11.3).
- Chờ INV (hẹn 19/10, đã có trong `pending-for-INV.md`):
  - bảng tên phòng ↔ số căn: **không chặn** B3–B5, vì đội dùng ánh xạ tạm BL 4.1 rồi chỉ sửa cấu hình căn khi INV gửi; landing chờ bảng để gán tên theo hạng;
  - logo SVG → B6, G7. Theo `sprint-4-plan.md`, logo là CỔNG nếu INV gửi trước D7, không thì NÊN-ÔĐ.
- Không mở ESC mới: thương hiệu đã có, đây là phần INV đã hẹn gửi.
- Đề xuất guideline v1.1 (2.5): gom một lượt với landing `concept.md` mục 14 để ORC trình INV ở tổng kết Round 2 – chỉ để biết, không chặn việc.

## 12. Lịch sử thay đổi
| Phiên bản | Ngày | Người | Nội dung |
|---|---|---|---|
| 0.4.1a | 17/10/2026 | UXD | Review bố cục FE-A giữa Sprint 4 (`rounds/round-02/reviews/s4-UXD.md`), chưa có hi-fi cho 3 hộp mới: `hifi.css` thêm `.sum th` (tiêu đề cột 12px đậm, màu Stone, không viết hoa để giữ ký hiệu "(đ)"), `.sum th+th/td+td` cách cột 12px, `.sum th.r/td.r` canh phải + không xuống dòng giữa số – cho bảng tính thử đổi căn theo đêm (`MovePreviewBox`), FE không phải sửa mã để nhận. Quy ước bố cục cho 3 hộp (tính thử đổi căn, thu khi nhận phòng, dòng dịch vụ khi hủy/no-show) ghi ở các thẻ FB-R2-UXD-FE-S4-*; đưa vào hi-fi H11/H13 ở đợt B2 |
| 0.4.1 | 17/10/2026 | UXD | **R2 Sprint 4 D1 – sửa phát hiện #18, #19 của critic kickoff (`rounds/round-02/reviews/s4-kickoff-critic.md`).** #18: `--bar-cf` v0.4 `#C9A56E`/`#B8925A` ghi "tint Light Oak" nhưng pha R 37% / G 24% / B 16% (sắc mới) → sinh lại bằng `mix()` = Light Oak 80% + Ivory 20% `#BEA174` cả hai chế độ (Ink 5,77:1; tối 7,07:1; thanh/nền 2,03 → 2,16:1); `--oak` tối dùng chung mã cũ nên đổi theo. `gen_tokens.py` thêm bảng kiểm nguồn tint/shade cho 26 token (`tint_fails: 0`); 4 token nắn sắc có lý do được ghi là ngoại lệ có kiểm ở 2.4 (`--oak-ink`/`--focus` tối, `--oak-soft`, `--line-strong` sáng); sửa nhãn nguồn của `--deco`, `--line`, `--line-strong` cho đúng số đo. #19: `--info` chỉ cho thông báo (C19, C20 mức info, 6.14); thêm tông chip **`ink`** (Ink trên `--surface`, viền `--line-strong`, icon bắt buộc) cho OC "Có khách", khai báo `scanned`/`pre`, yêu cầu khách `acknowledged`/`in_progress`, hoa hồng `earned`, phiếu sửa "Đang sửa"; bảng tông chip đầu 2.3; `tokens.json` thêm `status.tone`/`registration`/`guestRequest`/`commission`, OC → `ink`. `hifi.css`/`wf.css`: `.chip.ink`, `.chip.info` thành bí danh của `.chip.ink`, `.hk-card.kit` bỏ viền `--info`. Hi-fi/wireframe: 25 chip `info` đổi – 23 → `ink`, H14 `sent` → `oak`, H17 `escalated` → `warn` (theo 2.3); thêm 3 chip chỉnh theo 2.3: H14 `scanned` (warn) và `pre` (neutral) → `ink`, H23 `acknowledged` (neutral) → `ink`; chip trạng thái ở H07, H14, H22, H23 thêm icon. Việc dọn mã FE/MOB: đợt B0b (11.6) |
| 0.4 | 17/10/2026 | UXD | **R2 Sprint 4 – S4-49: khớp OTTIMO Brand Guidelines v1.0.** Màu: bảng `--brand-*` (2.0); `--ink` #2B2B28; `--muted`/`--faint` = Stone Grey #6B6760; `--oak-ink`/`--focus` = Earth Brown #7A5C44; `--surface-2`/`--side` = Cream; `--bad-bg` #F7E5E2 (Stone đạt AA); `--bar-long` xanh xám #5B7387 → Sage Deep #646859; thêm `--cream`, `--sage`, `--earth`, `--on-earth`. 0 cặp bắt buộc không đạt; cấm chữ trắng/Ivory trên Light Oak. Ngoại lệ chức năng (2.4), lệch guideline + đề xuất v1.1 (2.5). Chữ: Lora 500 + giãn 0,02em cho tiêu đề, H3 về Be Vietnam Pro 600, JetBrains Mono cho mã/Wi-Fi, fallback Georgia/Arial/Courier New, thang màn hình 3.1. Component: C1 `brand`, C7 `long`, C33 logo, C34 tên phòng. Mục 11 mới: giọng văn khách (tiếng Anh dẫn dắt), 8 mẫu tin đề xuất, quy tắc tên phòng, logo, sáng/tối theo bề mặt, việc FE/MOB B0–B6. `hifi.css`: `.print-root` dùng `--brand-*` |
| 0.3.5 | 17/10/2026 | UXD | R2 Sprint 3 – review chéo FE H13–H17 + MOB guest-web (`rounds/round-02/reviews/s3-UXD.md`): 6.16 thêm bố cục khối VietQR (mỗi thông tin một dòng, sao chép nội dung/số tiền riêng) và quy tắc in Phiếu thanh toán (`.print-root`, `hifi.css` mục 16 – chỉ in tờ phiếu, A5, nền trắng cả khi chế độ tối); 6.17 thêm quy tắc văn bản pháp lý EN trên trang RU và lý do nút khóa ở guest-web; 91 chuỗi mới + quy ước `{amount}` kèm đơn vị (content-guide 0.3.10). |
| 0.3.4 | 17/10/2026 | UXD | R2 Sprint 3 – 6.17 bổ sung chọn loại giấy tờ / bổ sung tại quầy / thẻ "Đã làm thủ tục trước" (MOB S3); mẫu **6.21** tự thử lại theo `Retry-After` cho `CONCURRENT_UPDATE`/`SERVICE_UNAVAILABLE` (ĐK-S2-3, QC-S2-02); 6.16 theo quyết định Sprint 2 (nội quy bắt buộc, "đã giao mã/thẻ" không bắt buộc + tick sau, số thẻ, vượt sức chứa chặn cứng, `SURCHARGE_CHANGED`); 6.19 áp ESC-016 A (phí dọn chỉ khi lần dọn đầy đủ thứ hai trong ngày / dọn lẻ dài hạn); rà H13–H18 theo OpenAPI 0.3.5 + BR v0.3.2; chuỗi mới (xem `rounds/round-02/outputs/UXD/s3-report.md`); 5 chuỗi RU báo giá (PO-S2-01). |
| 0.3.3 | 16/10/2026 | UXD | R2 Sprint 2 – hi-fi Sprint 4 (H19–H24): mẫu 6.18 PWA buồng phòng/bảo trì (mật độ HK, hoàn tác 10 giây = gửi trễ, hàng đợi + "Cần xem lại", mức phiếu, ảnh bằng chứng), 6.19 yêu cầu khách có phí, 6.20 Tổng quan + SSE; mục 4.1 lớp tiện ích thay style nội tuyến (FB-R2-UXD-FE-15) + `[hidden]` toàn cục + `tr.is-editing` (FE-13); component `.hk-card`, `.filters`, `.qpill`, `.toast-dock`, `.photo-row`, `.tl`, `.req-grid/.req-tile/.req-card`, `.live`, `.kpis.two`; H04 thêm cột/ô **số giường** (`bedCount`) và **diện tích** (`areaM2`) theo OpenAPI 0.3.4 Q6; 303 chuỗi VI/EN mới (`hk.*`, `wo.*`, `gw.req.*`, `ov.*`, `attn.*`, `rooms.*`); sửa `hk.task.extra_kit_items` ("1 1 mền"). |
| 0.3.2 | 16/10/2026 | UXD | R2 Sprint 1 – hi-fi Sprint 3 (H13–H18): mẫu 6.16 (phụ thu chủ động + ân hạn 12:30, mã cửa ngoài app R2, "chờ đối soát", duyệt bằng mật khẩu), 6.17 guest-web mức 1; 6.4 bổ sung BR-613 c ở R2 = chặn nhận phòng (BA G-1); component `.conds`, `.chk3`, `.lock-box`, `.person`, `.bill-paper` (in A5), `.upload-slot`, `.choice`, `.chip.recon`, `.wiz-foot`; icon `printer`, `cash`, `scan`; 363 chuỗi VI/EN mới; sửa `guest.oci.done_body`, `pay.card`, `approval.pin_*`, `error.REAUTH_FAILED`, `checkout.complete_confirm_body`, bỏ `handover.foc_approver` (BA E05-07, E06-10). |
| 0.3.1 | 16/10/2026 | UXD | R2 Đợt 0 – hi-fi EP00/EP02/EP10/EP11 (`hifi/`, 12 màn): component hi-fi `hifi.css` (chỉ dùng token), bảng 2.2 thêm 8 cặp chữ trên nền màu (0 cặp không đạt); mẫu 6.14 số khách định mức/tối đa + bộ đồ dùng thêm (ESC-014, sofa), 6.15 đơn dài hạn nhập tay; icon mới `monitor`, `sofa`, `sliders`, `chevron`, `filter`; 502 chuỗi VI/EN mới (RU ở R3; gồm mã lỗi OpenAPI 0.3.1); sửa `error.FILE_REJECTED` theo OpenAPI 0.3 (JPG/PNG/WebP ≤ 10 MB). |
| 0.3 | 16/10/2026 | UXD | Bước 4 (phản hồi UXR, PO, QA): thêm token `--focus-on-dark`; `--line-strong` sáng #8C8578 → #857E71 (đạt 3:1 trên `--side`); bảng 2.2 thêm 12 cặp (focus trên mọi nền có điều khiển, line-strong trên side/surface-2, cột biểu đồ) – 0 cặp không đạt; nút khóa bỏ opacity; cỡ chữ/vùng chạm tối thiểu áp cho toast, seg, thanh dưới, chip, nhãn; VC một tên "Đã dọn – chờ kiểm" tông gỗ sồi; mẫu 6.11 đến muộn, 6.12 chữ tự do của nhân viên, 6.13 dữ liệu mẫu DS-0; wireframe L10 mới. |
| 0.2 | 15/10/2026 | UXD | Đợt 4: khớp RBAC/máy trạng thái/ERD/API/SEC – thêm màu trạng thái làn "Chưa gán căn", dạng xem `unavailable`, SM-05 `void`, SM-10/11/15; C12 mở rộng; thêm C31 Code input, C32 Code display (32 component); 6.1 theo US-135 (+ không đến, thu hồi thiết bị); 6.4 "Không đạt" không chặn, bắt buộc ghi xử lý; 6.9 nút = `allowedActions`, C3 chỉ trên thiết bị được cấp; mục 7 lỗi theo `Problem.code` + `requestId` |
| 0.1 | 15/10/2026 | UXD | Bản đầu: token sáng/tối đạt AA (đổi `--muted`, `--faint`, `--oak-ink`, `--ok`, `--warn`, focus; thêm `--deco`, `--line-strong`, `--ink-inverse`), thang chữ, 30 component, 10 mẫu tương tác, 15 quy tắc a11y |
