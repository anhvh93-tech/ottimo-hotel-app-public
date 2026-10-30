# UXD – Bản in ngày D: one-pager 4 tờ + "Your ID details" (v1.0.0)

- Round 3 · Bước **Phản hồi & sửa** (D-T1) · Người làm: UXD · 30/10/2026 · Hạn giao OWN: trước 12:00 ngày 01/11
- Nguồn chữ: `product/docs/staff-one-pager.md` (PO, commit `67be8f1`), các phần `## Tờ 1` … `## Tờ 4`. UXD **không sửa** tệp này và không viết lại chữ. Phần "Cách in và dán" không in.
- Quy cách: `rounds/round-03/reviews/UXD-on-PO-v1.0.0-docs.md` mục 1.3 (Tờ 4) và mục 2 (Tờ 1–3), brand guideline (`00-brief/context/brand/brand-guidelines.md`).
- Kết luận: **cả 4 tờ vừa một mặt**, đo bằng PDF Chrome headless với font thật. Không phải cắt chữ, không phải đưa 2a lên A4.

## 1. Tệp giao

| Lần in | HTML (nguồn in) | PDF cho OWN in | Khổ PDF đo được |
|---|---|---|---|
| Tờ 1 – Quầy lễ tân | `product/docs/print/to-1-quay-le-tan.html` | `product/docs/print/pdf/to-1-quay-le-tan.pdf` | A4 dọc 210 × 297 mm, 1 trang |
| Tờ 2a + 2b (cắt đôi) | `product/docs/print/to-2a-2b-a4-cat-doi.html` | `product/docs/print/pdf/to-2a-2b-a4-cat-doi.pdf` | A4 ngang 297 × 210 mm, 1 trang |
| Tờ 3 – Buồng phòng | `product/docs/print/to-3-buong-phong.html` | `product/docs/print/pdf/to-3-buong-phong.pdf` | A4 dọc, 1 trang |
| Tờ 4 – khổ A5 | `product/docs/print/to-4-your-id-details-a5.html` | `product/docs/print/pdf/to-4-your-id-details-a5.pdf` | A5 dọc 148 × 210 mm, 1 trang |
| Tờ 4 – 2 bản trên A4 | `product/docs/print/to-4-your-id-details-a4-2-ban.html` | `product/docs/print/pdf/to-4-your-id-details-a4-2-ban.pdf` | A4 ngang, 1 trang, 2 bản A5 |

- Bộ dựng: `product/design/tools/build_print_sheets.py`. Dùng lại bộ đọc Markdown của `build_manual.py` và trình điều khiển Chrome của `check_manual.py`, chỉ thư viện chuẩn.
- Font: Google Fonts (Lora 500, Be Vietnam Pro 400/600, JetBrains Mono 400). Fallback theo guideline: Georgia / Arial / Courier New. Trong PDF, cả 4 font đều đã nhúng.
  - Ký tự mũi tên "→" không có trong bộ Be Vietnam Pro mà Google Fonts cấp, nên in bằng Arial. Đây là font dự phòng có trong guideline.
- Không có dữ liệu khách, IP, mật khẩu hay khóa. Chỉ có hai tên miền công khai `desk.ottimo.vn` và `staff.ottimo.vn` (đã có trong .md). Đã rà: mọi từ trong 5 phần `## Tờ` của .md đều có trong HTML.

Dựng lại khi PO sửa `.md`, chạy từ gốc repo:

```
python3 -I product/design/tools/build_print_sheets.py --pdf
```

- Lệnh này ghi đè HTML và PDF.
- Màn hình in ra từng tờ: vừa hay tràn, cỡ chữ đo được, cỡ lớn nhất còn vừa, chỗ trống còn lại.
- Tờ nào tràn, hoặc PDF dài hơn 1 trang: lệnh thoát mã 1.

## 2. Kết quả đo (Chrome headless, giao thức DevTools, `printToPDF` theo khổ trong CSS)

| Tờ | Khổ | Chữ thân đo được | Vừa một mặt | Chỗ trống còn lại |
|---|---|---|---|---|
| 1 – Quầy lễ tân | A4 dọc, 2 cột | Be Vietnam Pro **9 pt**, cách dòng 1,3 | **Vừa** | ~0,5 mm mỗi cột. **Hết chỗ**: ở 9,25 pt là tràn |
| 2a – Tạm tới v1.0.1 | A5 dọc (nửa trái A4 ngang), viền Light Oak | **10 pt**, cách dòng 1,3 | **Vừa** | ~0,5 mm. **Hết chỗ** |
| 2b – Quá 18:00 | A5 dọc (nửa phải A4 ngang) | **12 pt**, cách dòng 1,42 | Vừa | ~49 mm (khoảng 8 dòng). Vừa tới 14 pt |
| 3 – Buồng phòng | A4 dọc, 2 cột | **12 pt**, cách dòng 1,42 | Vừa | ~61 mm mỗi cột. Vừa tới 14 pt |
| 4 – Your ID details | A5 dọc | EN **11,5 pt** / VI **11 pt**, cách dòng 1,5 | **Vừa** | ~2 mm. Ở 11,75 / 11,25 pt là tràn (giống lần đo 30/10) |

Cỡ các phần khác:
- **Tờ 1–3:**
  - tiêu đề tờ Lora 500: 15 pt (Tờ 1), 17 pt (Tờ 3), 1,25 × cỡ thân (2a: 12,5 pt; 2b: 15 pt);
  - tiêu đề mục Lora 500: 1,22–1,3 × cỡ thân, gạch dưới Light Oak 0,4 pt;
  - nhãn "OTTIMO DESK · TỜ x": chữ hoa 8 pt, Stone Grey;
  - chân tờ: 8 pt (A4) hoặc 7,5 pt (A5), Stone Grey;
  - tiêu đề bảng có nền Cream;
  - URL bằng JetBrains Mono.
- **Tờ 4** (đúng quy cách 1.3):
  - "OTTIMO" chữ hoa 9 pt, Stone Grey;
  - "Your ID details" Lora 500, 24 pt; dòng phụ Lora 500, 13 pt, Stone Grey, chữ đứng;
  - nét Light Oak 0,6 pt × 22 mm;
  - chân "OTTIMO · ID notice" bên trái, "11/2026" bên phải, 8 pt;
  - lề 16 / 14 / 12 mm;
  - không ngắt dòng trong "check-out", "3 months", "35 days", "3 tháng", "35 ngày", "N days".
- **Màu:** chỉ Ink, Stone Grey, Light Oak, Earth Brown (số thứ tự ở 2b), Cream (nền tiêu đề bảng), giấy trắng. Không in nền màu cả tờ. Không emoji.

### Chỗ UXD đổi so với quy cách đã giao (quyền UXD, dàn trang)
1. **Tờ 2b và Tờ 3 in 12 pt, không phải 10 pt.** Ở 10 pt, hai tờ này còn trống gần nửa mặt giấy. 12 pt nằm trong mức Body 11–13 pt của guideline. Người đọc đứng xa hơn: tờ kẹp ở quầy, và tờ dán tường ở phòng buồng.
2. **Tờ 1 xếp dày hơn để giữ 9 pt:**
   - lề 7 / 6 / 5 mm;
   - cách dòng 1,3;
   - dòng địa chỉ Desk/app nằm cùng hàng với tiêu đề, nhãn "OTTIMO Desk · Tờ 1" chuyển xuống chân tờ.
   - Với lề và cách dòng thường, Tờ 1 chỉ vừa ở 8,75 pt. Không xuống dưới 9 pt.
3. **Tờ 2a** cách dòng 1,3. Viền Light Oak cách mép giấy 6 mm, để không rơi vào vùng máy in không in được.
4. **Tờ 4**: nhãn cách tiêu đề 5 mm (quy cách: 6 mm), nét Oak cách trên dưới 4,5 mm (quy cách: 5 mm). Lý do: để dòng chân trang cách thân 2 mm. Lề ngoài và cỡ chữ giữ đúng 1.3.
5. Thêm **bản Tờ 4 hai bản trên một tờ A4** cho máy in không có khay A5. Cắt đôi ra 2 tờ A5 đúng cỡ: một tờ dùng, một tờ dự phòng.

Dòng decision-log đề xuất (ORC ghi khi gom commit):
`| 2026-10-30 | 3 | UXD – bản in ngày D v1.0.0: Tờ 1 A4 9 pt (lề 7/6/5 mm, cách dòng 1,3), 2a A5 10 pt + 2b A5 12 pt in chung A4 ngang rồi cắt, Tờ 3 A4 12 pt, Tờ 4 A5 EN 11,5 / VI 11 pt (thêm bản 2-up A4); đo PDF Chrome: cả 4 tờ vừa một mặt | UXD | Quyền UXD (dàn trang trong khuôn khổ thương hiệu) |`

## 3. Cách in (cho OWN, D−1 ngày 01/11)

- In từ **PDF** trong `product/docs/print/pdf/`, mở bằng Chrome hoặc Preview. Font đã nhúng nên không cần mạng.
- Hộp in:
  - **Tỉ lệ: Thực tế / Actual size / 100%**. Không bật "Vừa trang / Fit to page", vì sẽ thu nhỏ chữ dưới 9 pt;
  - **một mặt**;
  - in màu nếu có (nét Oak, nền Cream). In đen trắng vẫn đọc được: nền Cream thành xám rất nhạt.
- Giấy:
  - Tờ 1–3: giấy văn phòng trắng.
  - Tờ 4: giấy trắng hoặc ngà 120–160 gsm. In thử, rồi xem dưới đèn quầy 2700K trước khi đặt vào khung.
- In:
  - `to-1-quay-le-tan.pdf`: A4 dọc, 1 tờ.
  - `to-2a-2b-a4-cat-doi.pdf`: A4 **ngang**, 1 tờ. Cắt theo nét đứt giữa tờ (148,5 mm từ mép trái), ra 2 tờ A5: trái là 2a (có viền), phải là 2b.
  - `to-3-buong-phong.pdf`: A4 dọc, 1 tờ.
  - Tờ 4, chọn một trong hai:
    - máy có khay A5: `to-4-your-id-details-a5.pdf`, khổ A5;
    - chỉ có A4: `to-4-your-id-details-a4-2-ban.pdf`, A4 ngang, cắt theo nét đứt, ra 2 tờ A5 giống nhau.
- **Kiểm tờ in thử Tờ 1:** dòng chân "Bản 30/10/2026 · v1.0.0 …" phải nằm trọn ở đáy tờ (cách mép 5 mm).
  - Nếu máy cắt mất dòng chân (máy in phun đời cũ có lề đáy lớn): báo UXD, không tự bật "Vừa trang".

## 4. Chỗ dán

| Tờ | Chỗ | Khi v1.0.1 lên |
|---|---|---|
| 1 – Quầy lễ tân | Phía trong quầy, chỗ nhân viên. Khách không đọc được | Giữ |
| 2a – Tạm tới v1.0.1 | Cạnh Tờ 1 | Gỡ khi chủ đầu tư báo hết tạm |
| 2b – Khách ở quá 18:00 | Kẹp sau Tờ 1, hoặc trong bìa quầy | Giữ |
| 3 – Buồng phòng | Phòng buồng / kho đồ vải | Giữ |
| 4 – Your ID details | Khung mica A5 đứng trên quầy, mặt quay ra khách, chỗ khách đứng làm thủ tục, không bị che. Đặt **tối 01/11 sau buổi đào tạo, muộn nhất 06:00 ngày 02/11** | Giữ |

## 5. Việc còn lại

**PO:**
- **Tờ 1, 2a và 4 đã hết chỗ.** Thêm một dòng vào ba phần này của `.md` thì tờ đó tràn; bộ dựng sẽ báo và thoát mã 1.
- Trước ngày D không nên thêm chữ. Nếu buộc phải thêm, chọn một trong ba cách. UXD không tự chọn chỗ cắt:
  - (a) cắt chữ ở chỗ khác cùng tờ. Gợi ý chỗ có thể cắt:
    - Tờ 1: đoạn "Giờ nhận phòng nói với khách" trùng một phần dòng 12:00 và 14:00 của bảng "Giờ cần nhớ";
    - Tờ 2a: ý "Đã có cọc" (khoảng 8 dòng) có thể rút còn hành động chính, phần còn lại trỏ "sổ tay 2.4";
  - (b) 2a in riêng trên A4 ở 10 pt (khi đó 2b in A5 riêng);
  - (c) Tờ 4: đổi chữ thì phải qua SEC (D08) và đổi chân trang.
- Đã duyệt lại theo mục 9 của PO:
  - câu mời "Before I take your ID, please read this note on how we use it." / "Trước khi nhận giấy tờ, mời anh/chị đọc tờ này về cách chúng tôi dùng thông tin." **Đạt**, đúng bản UXD.
  - câu "Hiện OTTIMO có một người trực quầy, giữ cả 6 vai…" ở đầu Tờ 1: **Đạt**, rõ và đúng giọng nội bộ.
  - Một gợi ý, không bắt buộc: "việc rà làm ở đầu mỗi ca" → "việc rà giữ chỗ làm ở đầu mỗi ca", để người mới không phải đoán "rà" là rà gì. Thêm chữ này có thể làm Tờ 1 tràn. Nếu PO sửa, UXD dựng lại và đo.

**OWN:**
- In theo mục 3 vào ngày 01/11.
- In thử Tờ 4 và xem dưới đèn quầy.
- Đặt Tờ 4 vào khung mica trước 06:00 ngày 02/11.

**UXD:**
- Khi có SVG lockup ngang của INV: thay nhãn chữ "OTTIMO" ở Tờ 4 bằng logo, rộng ≥ 180 px.
- Khi có bản RU v2 đã duyệt: thêm khối RU, đổi Tờ 4 sang A4 (mục 1.3).
- Chữ v1.0.1 (BUG-R3-043, 044, 045, khối "Giữ chỗ chờ cọc (n)") làm theo việc PO giao riêng.

## 6. Giả định

- OWN in từ PDF ở tỉ lệ 100%. Máy in văn phòng có lề không in được ≤ 5 mm (máy laser thường 4–4,2 mm).
- Thời điểm đo, Google Fonts tải được. HTML có fallback, nhưng **chỉ PDF** là bản đã đo vừa. In thẳng từ HTML khi máy không có mạng sẽ ra Arial/Georgia, và có thể tràn.
- Không tạo ESC: mọi quyết định ở đây thuộc quyền UXD (dàn trang trong khuôn khổ thương hiệu).
- Không commit, theo yêu cầu ORC.
