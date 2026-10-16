# UXD – Round 2, Đợt 0: hi-fi EP00/EP02 (Sprint 1–2)

- Người viết: UXD | Bước 2 (Sản xuất) – Đợt 0 | Ngày: 16/10/2026
- Việc giao: plan R2 mục 4 (Đợt 0 "UXD hi-fi EP00/EP02"; UXD đi trước dev một sprint) + plan 3.1 dòng UXD (1)(2)(4).
- Đầu vào: plan R2, backlog (AC đã áp R-C), OpenAPI **0.3.1-draft**, business-rules v0.3 (BR-110), ESC-014 (INV quyết 16/10), decision-log 16/10 (sofa, bộ đồ dùng thêm), Design System v0.3, wireframe R1 L1/L2/L5/L10, DS-0 (test-strategy 4.2).

## 1. Đã làm gì

### 1.1 Thiết kế hi-fi – `product/design/hifi/` (12 màn + danh sách)
| Mã | Màn | Story chính | Sprint |
|---|---|---|---|
| H01 | Đăng nhập · đổi mật khẩu tạm · nhập mã 2 bước · bật 2FA (nền) · chọn cơ sở | US-001, US-002; nền US-143 | 1 |
| H02 | Khung ứng dụng + điều hướng 8 vai · không có quyền · máy chưa cấp · phiên hết | US-001/002/003, US-142 | 1 |
| H03 | Hôm nay (máy quầy) – màn mặc định lễ tân | US-001 AC1, US-011, US-012, US-085, US-136, US-139 | 1 (khung) |
| H04 | Danh mục căn – định mức/tối đa (Studio 2/3; 301, 401 4/5; 302, 402 3/4), giá, bán | US-004 | 1 |
| H05 | Tham số quy tắc + lịch sử | US-005 | 1 |
| H06 | Khách hàng – hồ sơ, chặn trùng, bộ chọn khách | US-071/072/073 | 1 |
| H07 | Người dùng & vai · thiết bị được cấp (owner) | US-002, US-142 | 1 |
| H08 | Sơ đồ phòng 14 ngày + làn "Chưa gán căn" + dạng xem theo vai + điện thoại | US-016, US-019, US-139, US-017 AC5a | 2 |
| H09 | Đặt phòng mới (bấm thử: số khách, phụ thu, bộ đồ dùng thêm, OTA xung đột, lỗi) | US-017, US-018, US-019, US-022, US-073 | 2 |
| H10 | Đơn dài hạn nhập tay + danh sách lọc + chi tiết | US-017 AC5a (P-R2-3) | 2 |
| H11 | Chi tiết đơn – giữ chỗ, xác nhận cọc, đổi căn/ngày, hủy, không đến, gán căn OTA, người đi cùng, biến thể CTV | US-020/021/022/024/085/086/087/135/136/139 | 2 |
| H12 | Sale/CTV điện thoại – căn trống, báo giá ngắn, gửi VI/EN, giữ chỗ | US-080/082/083/084/085/086 AC4/087 | 2 |

Mỗi màn có khung đặc tả: Story/AC, **operationId** (OpenAPI 0.3.1), **Problem.code**, hành vi, a11y; trạng thái tải/rỗng/lỗi/mất mạng chuyển được trên thanh công cụ; sáng/tối; VI/EN. `index.html` liệt kê đủ bảng màn × story × operationId × Problem.code.

### 1.2 Theo quyết định INV 16/10 (ESC-014 + bộ đồ dùng thêm) và OpenAPI 0.3.1
- Ô số khách = 3 stepper (người lớn / trẻ 6–11 / trẻ dưới 6 – không tính); vượt **tối đa** → `CAPACITY_EXCEEDED` tại ô; vượt **định mức** → dòng phụ thu (Trực tiếp/CTV, OTA không cộng) + nhắc **"chuẩn bị bộ đồ dùng thêm"** = 1 mền, 1 khăn tắm, 1 khăn mặt, bàn chải, đồ vệ sinh cá nhân – **không gối**; chip ở Hôm nay, drawer đơn, rack (icon sofa), việc buồng phòng `extra_guest_kit_prepare/collect/transfer`.
- "Nệm phụ" → **"sofa"**: trong file của UXD không có chữ "nệm phụ" (đã rà wireframe, chuỗi, DS, content-guide); thêm thuật ngữ "Sofa / Không dùng: nệm phụ" vào content-guide 3.1. Chữ "nệm phụ" còn trong `business-rules.md` (BR-110, mục 13) – file của DOM, không sửa (xem mục 4).
- 0.3.1: H04 dùng `Room.baseOccupancy`/`maxOccupancy` + mã trường `MAX_OCCUPANCY_RANGE` (tối đa ∈ {định mức, định mức+1}); H09 "Nguồn" = `directSource` (website / zalo_phone / walk_in / returning / sales_staff – thêm "Sale nội bộ"); H07 `USERNAME_TAKEN`, `LAST_OWNER`; H11 `PARTY_DUPLICATE`, `ROOM_NOT_READY`.

### 1.3 Design System + chuỗi
- `hifi/assets/hifi.css` (component hi-fi C1–C32, chỉ dùng token), `hifi/assets/hifi.js` (i18n, trạng thái, `<dialog>` có bẫy focus/Esc/hỏi bỏ thay đổi/trả focus, stepper tính định mức – phụ thu – bộ đồ dùng).
- Icon mới: `monitor`, `sofa`, `sliders`, `chevron`, `filter` (`wireframes/assets/icons.js`).
- `design-system.md` v0.3.1: mẫu **6.14** (số khách định mức/tối đa + bộ đồ dùng thêm), **6.15** (đơn dài hạn nhập tay), bảng 2.2 thêm 8 cặp tương phản, lịch sử.
- **502 chuỗi VI/EN mới** trong `tools/gen_strings.py` (nhóm "R2 hi-fi – …", tổng 1124 + 8 mẫu tin) → sinh `copy/strings-*.json`, `wireframes/assets/strings.js`; gồm 17 mã `error.*` (đủ 55/55 mã của OpenAPI 0.3.1) còn thiếu so với OpenAPI 0.3.1 và 6 mã trường `field.*`. EN đủ; RU để R3 (fallback EN). Sửa `error.FILE_REJECTED` theo hợp đồng (JPG/PNG/WebP ≤ 10 MB – trước ghi sai HEIC/PDF). Content-guide mục 8 sinh lại.
- Công cụ mới `tools/check_hifi.py`: kiểm thẻ đóng/mở, id trùng, tham chiếu `for`/`aria-*`/`data-open`, `<title>`/`lang`, và mọi `data-i18n` có VI+EN, chữ trong HTML khớp chuỗi VI.

## 2. Kiểm tra
| Kiểm | Kết quả |
|---|---|
| `python3 product/design/tools/check_hifi.py` | 13/13 trang ✓, 0 lỗi cú pháp/tham chiếu, ~1.160 lượt chuỗi khớp VI, mọi key có EN |
| `python3 product/design/tools/gen_tokens.py` | `fails: 0` (53 cặp, sáng + tối) |
| `python3 product/design/tools/gen_strings.py` | 1124 chuỗi + 8 mẫu |
| Mở thử trên trình duyệt (server tĩnh cục bộ) | H09: tăng 4 người lớn → chặn `CAPACITY_EXCEEDED`; 3 người lớn → hiện nhắc bộ đồ dùng thêm, tổng 2.945.000; đổi EN → chữ đổi đúng. H08 1440px: không tràn ngang trang, 37 thanh đúng hàng căn. Chưa đo bằng trình đọc màn hình và phóng chữ 200% (để UXR test R2). |

## 3. Giả định (UXD tự quyết – ORC ghi decision-log khi commit)
1. Hi-fi dùng chung token/strings/icon của `wireframes/assets/` (một nguồn sinh), không sao chép.
2. Bộ chọn khách: tìm từ 2 ký tự, 250ms, ≤ 20 kết quả `[GIẢ ĐỊNH UXD]` chờ đặc tả trường BA.
3. Mật khẩu tối thiểu 10 ký tự trên màn đổi mật khẩu `[GIẢ ĐỊNH]` – SEC chốt.
4. Vai "Chủ đầu tư" không gán được từ màn H07 (chỉ đội kỹ thuật cấp) `[GIẢ ĐỊNH UXD]` – SEC xác nhận.
5. Hoa hồng sale nội bộ hiển thị số lẻ (156.150) vì BR-903 không nói làm tròn – hỏi DOM.
6. OTM-0152 (302) giả định 4 người lớn, cọc 1.200.000; dữ liệu ngoài DS-0 ghi ở `hifi/index.html` mục 4.
7. Sale/CTV bỏ mục "Hoa hồng" khỏi thanh dưới (S17 là US-089 – R3); Bảo trì bỏ "Công tơ" (R3).

## 4. Rủi ro / vướng mắc – cần vai khác
| # | Vấn đề | Gửi | Đề xuất |
|---|---|---|---|
| 1 | `RackBar` 0.3.1 chưa có `externalContract` và `extraGuestCount` → FE không vẽ được nhãn "Nhập tay" và icon sofa trên rack | ARC | Thêm 2 trường vào `RackBar` (chỉ FD+) |
| 2 | `business-rules.md` BR-110 + mục 13 còn chữ "nệm phụ" và "GĐ (ESC-014)" | DOM | Đổi thành "sofa", nhãn "INV quyết ESC-014 16/10"; danh sách bộ đồ dùng thêm có khăn mặt, không gối |
| 3 | US-001 AC4 nói tài khoản R2 tạo bằng seed, nhưng OpenAPI có `createUser` (US-002); H07 có nút "Thêm người dùng" | PO | Quyết giữ hay ẩn nút ở R2 (không ảnh hưởng phần còn lại) |
| 4 | Văn bản báo giá do server sinh (`getQuoteText`) – UXD cung cấp mẫu `sale.quote_text`, `sale.quote_text_extra_guest` | ARC/BE | Dùng 2 key này làm mẫu |
| 5 | Wireframe R1 đánh số thứ tự gợi ý căn cho đơn OTA (202 trước) không theo BR-316 "ít đêm lẻ"; hi-fi đã sửa (101, 103, 201, 202) | QA | Test case theo thứ tự server trả |

Không có ESC mới (mọi việc trong quyền UXD hoặc chuyển vai khác).

## 5. Việc chưa xong
- Hi-fi Sprint 3–4 (nhận phòng, giấy tờ C3, trả phòng/bill/VietQR, PWA buồng phòng, guest-web VI/EN, Tổng quan) – phải xong trước Sprint 3 (tuần 6).
- Màn nhật ký tiền (US-006) và phê duyệt FOC (US-007) chưa vẽ hi-fi – wireframe L10 10.4 / L8 vẫn dùng được cho Sprint 1; hi-fi bổ sung cùng đợt Sprint 3.
- Sửa BUG-R1-015 (`WO-00031`) đã áp trong hi-fi; BUG-R1-007 phía UXD: chuỗi `error.CAPACITY_BELOW_BOOKINGS`, `error.PARAM_OUT_OF_RANGE` đã thêm – QA xác nhận để đóng.
- Kiểm VoiceOver, phóng chữ 200%, mô phỏng mù màu trên bản build FE (review UXD-on-FE).
