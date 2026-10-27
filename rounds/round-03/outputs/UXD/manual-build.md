# UXD – Bộ dựng Sổ tay OTTIMO Desk v1.0 (HTML)

- Round 3 · Bước: Sản xuất (tài liệu phát hành v1.0) · Người làm: UXD · Ngày: 27/10/2026
- Nguồn nội dung: `product/docs/manual/user-manual-v1.0.md` (BA) – UXD **không sửa**. Ảnh: `product/docs/manual/img/<mã>.png` (QA) – UXD **không sửa**.
- Đầu ra: `product/docs/manual/ottimo-manual-v1.0.html`, một tệp tự đứng. Tiêu đề trang: "Sổ tay OTTIMO Desk v1.0".

## 1. Cách chạy

Chạy từ gốc repo. Chỉ cần Python 3.9 trở lên, thư viện chuẩn.

```
python3 -I product/design/tools/build_manual.py
```

- Mỗi lần BA sửa `.md` hoặc QA thêm ảnh: chạy lại đúng lệnh này. Tệp HTML được ghi đè.
- Màn hình in ra: số chương, số mục, ảnh đã có / tổng số mã, các mã còn thiếu, cỡ tệp.
- Tùy chọn:
  - `--md`, `--out`, `--img-dir`: đổi đường dẫn.
  - `--link-images`: trỏ ảnh bằng đường dẫn `img/…` thay vì nhúng base64. Tệp nhẹ hơn, nhưng phải gửi kèm thư mục `img/`.
- Kiểm bằng Chrome headless (không bắt buộc, cần Google Chrome trên máy):

```
python3 -I product/design/tools/check_manual.py --out-dir rounds/round-03/outputs/UXD
```

  - Đo tràn ngang ở 390 px và 1440 px. Có tràn thì thoát mã 1.
  - Chụp lại `manual-check-390.png` và `manual-check-1440.png`.
  - `--all`: chụp thêm ảnh phụ. `--pdf`: in thử A4 hai bộ (toàn bộ, bộ Lễ tân). Nên ghi các tệp này ra thư mục tạm, không đưa vào repo.

## 2. Cú pháp .md bộ dựng hiểu

| Trong .md | Ra HTML |
|---|---|
| `# …` (dòng đầu) | Tiêu đề trang bìa |
| Danh sách ngay dưới `#` | Khối thông tin nhỏ cuối trang bìa |
| `## Chương N. …` | Một chương. Trên màn hình là một phần; khi in thì sang trang mới. Id `ch-N` |
| `## …` không có "Chương" (ví dụ "Cách đọc sổ tay") | Phần mở đầu, không đánh số |
| `### N.M …` | Mục có số. Id `s-N-M`. Có trong mục lục và thanh bên |
| Bảng `\| … \|`, căn `:-:` / `-:` | Bảng có vạch mảnh, tiêu đề nền Cream. Bảng ≥ 4 cột và rộng thì cuộn ngang trên điện thoại, cột đầu đứng yên |
| `1.` `2.` … lồng `-` hoặc `1.` thụt 2–3 dấu cách | Bước đánh số: số trong vòng tròn Earth Brown, có đường nối giữa các bước. Bước con là vòng viền. Giữ đúng số tác giả ghi |
| `- …` | Danh sách chấm Light Oak |
| `> **Tạm ở v1.0:** …` | Khung **Tạm ở v1.0** |
| `> **Lỗi nhỏ đã biết…:** …` | Khung **Lỗi nhỏ đã biết** |
| `> Trước khi bắt đầu: …` | Khung **Trước khi bắt đầu** |
| `> …` khác | Khung ghi chú chung |
| Đoạn `Lưu ý:` hoặc `Luôn nhớ:` đứng ngay trên một danh sách | Khung **Lưu ý** / **Luôn nhớ** bọc cả danh sách |
| Đoạn chỉ có `**…:**` (ví dụ `**Các bước:**`) | Nhãn tiêu đề nhỏ có gạch Light Oak |
| `**Câu hỏi?** Trả lời` (mục 5.4) | Hỏi – đáp, câu hỏi một dòng riêng |
| `**đậm**`, `*nghiêng*`, `` `mã` ``, `[chữ](link)` | Đậm 600 · nghiêng · JetBrains Mono nền Cream · link |
| "mục 2.9" trong câu | Tự thành link tới mục 2.9. Không link khi đi sau tên tệp `.md` khác, ví dụ `day-one-guide.md` mục 4.5 |
| `[ẢNH: C2-15-mô tả]` | Có `img/C2-15.png` (hoặc .jpg/.webp): nhúng ảnh. Chưa có: khung giữ chỗ ghi màn hình (lấy từ `screenshot-list.md`) và tên tệp cần chụp. Chú thích dưới ảnh: mã + mô tả |
| `<!-- … -->` | Bỏ hẳn, kể cả khi viết nhiều dòng |
| `---` | Bỏ khi đứng cuối chương, vì chương đã có ngắt riêng |

Đã kiểm trên bản .md hiện tại:
- Mọi từ trong .md (trừ chú thích) đều có trong HTML.
- 260 số bước khớp đúng thứ tự.
- 0 link nội bộ gãy.
- Đã thử thêm .md giả có trường hợp khó: dòng nối tiếp trong danh sách, ảnh xen giữa danh sách, chú thích nhiều dòng, danh sách bắt đầu từ 3, ô bảng thiếu, `\|` và `|` trong mã. Kết quả đúng.

## 3. Quyết định thiết kế

1. **Một tệp, đọc tốt cả điện thoại lẫn máy tính.**
   - CSS và JS viết nội tuyến. Chỉ font tải ngoài, từ Google Fonts.
   - Không có JS vẫn đọc và in được. JS chỉ thêm 4 việc: tô chương đang đọc, nút in theo bộ phận, phóng to ảnh, mở mục lục khi in.
2. **Điều hướng theo bộ phận.**
   - Điện thoại và máy tính bảng (< 1100 px) có **thanh nút chuyển nhanh** dính đầu màn hình, cuộn ngang, cao 44 px: Mục lục · 0 Mở đầu · 1 Chủ đầu tư và quản lý · 2 Lễ tân · 3 Buồng phòng · 4.1 Bảo trì · 4.2 Sale nội bộ và CTV / môi giới · 4.3 Kế toán · 5 Phụ lục. Nút của chương đang đọc tô Ink.
   - Chương 4 gom 3 bộ phận nên tách thành 3 nút tới thẳng 4.1/4.2/4.3. Quy tắc tự động: tên chương có dấu phẩy thì tách theo mục `###`.
   - Máy tính (≥ 1100 px) có **thanh bên** nền Cream: các chương, và các mục của chương đang đọc.
3. **Mục lục ở đầu, sau bìa.**
   - Thẻ chương ghi số mục và "Dành cho" (lấy từ bảng ở "Cách đọc sổ tay"). Trên điện thoại thẻ xếp 1 cột; từ 600 px xếp 2 cột.
   - Dưới thẻ là danh sách mọi mục, mỗi chương gập/mở để giữ gọn trên điện thoại.
   - Mỗi đầu chương có thêm "Các mục trong chương (n)" (chỉ trên điện thoại).
4. **Đầu chương.**
   - Gồm: nhãn "Chương N", tên chương (Lora), vai viết thường cỡ nhỏ, dòng "Dành cho".
   - Có 2 nút in:
     - **In bộ cho bộ phận**: bìa + Cách đọc + Chương 0 + chương này + Phụ lục. Căn cứ: .md ghi "Chương 0 và chương 5 dùng chung cho mọi người".
     - **In riêng chương này**: bìa + chương.
   - Ctrl/Cmd + P thì in cả sổ tay.
5. **Ba loại khung nhìn ra ngay, khác nhau cả màu lẫn nét viền.** Lý do: in đen trắng vẫn phân biệt được.

   | Khung | Nền | Viền | Nhãn |
   |---|---|---|---|
   | Tạm ở v1.0 | Cream | trái 4 px Light Oak | nền Earth Brown, chữ trắng |
   | Lưu ý / Luôn nhớ | Ivory | 1 px quanh + trái 4 px Ink | nền Ink, chữ Ivory |
   | Lỗi nhỏ đã biết | Ivory | nét đứt Stone | viền Stone |
   | Trước khi bắt đầu | Cream | trái 4 px Sage | viền Sage, chữ Ink |

   - Nhãn khung dùng chữ thường, để không đổi "v1.0" thành "V1.0".
   - Chữ đầu câu sau nhãn tự viết hoa bằng CSS. Nguồn .md không đổi.
6. **Bước đánh số.**
   - Số trong vòng tròn 28 px, nền Earth Brown, chữ trắng, có đường nối dọc. Khi in, bước không bị cắt đôi qua trang.
   - Bước lồng (mục 1.10, 2.5, 2.10) là vòng viền nhỏ hơn.
7. **Tên nút, tên màn hình** (chữ đậm trong .md) giữ Be Vietnam Pro đậm 600, không chuyển sang JetBrains Mono.
   - Lý do: .md dùng đậm cho cả tên nút lẫn chữ nhấn mạnh. Đổi font cả loạt sẽ nặng mắt và sai nghĩa.
   - JetBrains Mono chỉ dùng cho: mã nội dòng (địa chỉ, mã đơn, `VC`/`VI`), số mục, mã ảnh, phiên bản.
8. **Ảnh.**
   - Ảnh Desk (ngang) rộng hết cột. Ảnh điện thoại (dọc) tối đa 300 px, xếp 2 cột. Nhận dạng ngang/dọc theo kích thước ảnh thật; khi chưa có ảnh thì theo `screenshot-list.md`.
   - Trên điện thoại, chạm ảnh Desk để phóng tới 960 px và vuốt ngang, chạm lần nữa để thu nhỏ.
   - Khi in, ảnh cao tối đa 105 mm, không cắt qua trang.
9. **In A4.**
   - Lề 16/15/18 mm. Chân trang "Sổ tay OTTIMO Desk v1.0 · trang N" (Chrome 131 trở lên). Bìa không có số trang.
   - Bìa một trang riêng, mục lục chia 2 cột, mỗi chương sang trang mới.
   - Ẩn thanh nút, thanh bên, nút in.
   - Nền giấy trắng. Màu khung và vòng số vẫn in.
   - Bảng không cuộn ngang khi in. Bảng quyền 9 cột (mục 5.3) vừa khổ A4 ở cỡ chữ 9 pt.
   - Đo bằng PDF: toàn bộ 63 trang (mới có 3/88 ảnh), bộ Lễ tân 37 trang. Khi đủ ảnh sẽ tăng thêm.
10. **Bìa.**
    - Chỉ thêm những gì được giao: chữ OTTIMO, tên (dòng `#` của .md), phiên bản "v1.0 · v1.0.0-rc.3", ngày (lấy từ dòng "Lập:"), câu "Desk đúng hơn sổ tay."
    - Dưới câu đó trích nguyên câu của .md: "Khi số trên Desk khác số trong sổ tay, **làm theo Desk** và báo đội sửa sổ tay."
    - Cuối tài liệu có một dòng nhỏ về bản dựng: tên tệp nguồn, mã băm nội dung, ngày dựng, số ảnh đã có. Dòng này giúp INV biết bản in là bản nào.
11. **Khả dụng.**
    - Vùng chạm ≥ 44 px (nút chương, nút in, dòng mục lục).
    - Có viền focus Earth Brown 2 px, link "Bỏ qua, tới nội dung", `lang="vi"`, `noindex`.
    - Bảng có `role="region"` và nhãn, nên bàn phím cuộn được.
    - Tôn trọng chế độ "giảm chuyển động" của máy. Chuyển cảnh 200 ms.
    - Cặp màu chữ đều đạt AA:

      | Cặp chữ / nền | Tỷ lệ |
      |---|---|
      | Ink / Ivory | ≈ 12,5:1 |
      | Stone / Ivory | 4,9:1 |
      | Stone / Cream | 4,5:1 |
      | Earth / Ivory | 5,4:1 |
      | Earth / Cream | 4,9:1 |
      | Trắng / Earth | ≈ 6:1 |

## 4. Brand guideline – đã áp và chỗ lệch

**Đã áp:**
- **Màu: chỉ 7 màu của bảng 80/15/5**, cùng trắng (guideline cho phép "White trên Oak/Earth") và 3 tint đã có sẵn trong Design System:

  | Token DS | Mã | Dùng cho |
  |---|---|---|
  | `--line` | #E0D8CA | vạch mảnh |
  | `--line-strong` | #857E71 | viền khung giữ chỗ, viền Lưu ý |
  | `--deco` | #9A948A | đường nối bước trong khung |

  Không dùng Sage hay Light Oak làm chữ.
- **Chữ:**
  - Lora cho tiêu đề bìa, chương, mục lục.
  - Be Vietnam Pro cho nội dung và UI.
  - JetBrains Mono cho mã.
  - Font tải từ Google Fonts. Dự phòng đúng guideline: Georgia / Arial / Courier New, rồi tới font hệ thống.
  - Cỡ chữ khi in theo guideline: H1 40 pt, H2 26 pt, H3 16 pt, nội dung 11 pt, nhãn và bảng 9 pt. Tracking: H1 +4, H2 +2, nhãn +10.
- **Không emoji.** Dấu ✔ ở bảng 5.3 được ép hiện dạng chữ bằng U+FE0E, để iOS/Android không tự đổi thành emoji.
- Giọng văn: không thêm chữ nào cho khách. Chữ giao diện mới (nút in, "Chưa có ảnh", "Chạm ảnh để phóng to") viết tiếng Việt nội bộ, ngắn.

**Lệch và đề xuất:**

| # | Lệch | Lý do | Đề xuất |
|---|---|---|---|
| L1 | Chữ OTTIMO trên bìa và đầu trang là chữ Lora giãn 0,12em, **không phải logo** | Repo chưa có tệp SVG logo (brand-guidelines mục 4 – đang chờ INV) | Khi INV gửi SVG, thay chữ bằng wordmark SVG: mỗi chỗ một dòng, trong `TEMPLATE` và hàm `build` |
| L2 | Thanh nút dùng mặt nạ mờ dần `#000 → transparent` | Đây là mặt nạ độ trong (alpha), không phải màu hiển thị | Giữ |
| L3 | Màn hình dùng px nhỏ hơn bảng pt (ví dụ H3 19–20 px) | Bảng cỡ chữ của guideline tính cho in. Trên 390 px, H3 21 px làm tên mục dài xuống 3 dòng | Giữ; bản in đúng pt |
| L4 | Mã nội dòng khi in nhỏ hơn 10 pt (khoảng 9,5 pt trong đoạn, 7,7 pt trong bảng) | Mono cỡ 0,86em để khớp chiều cao chữ của Be Vietnam Pro | Giữ. Nếu INV thấy khó đọc trên giấy, nâng lên 0,95em |

Không có lệch nào cần ESC.

## 5. Kiểm

- `manual-check-390.png`: Chương 2 trên điện thoại 390 × 844 (DPR 2). Có thanh nút đang tô "2 Lễ tân", đầu chương, 2 nút in, khung "Trước khi bắt đầu".
- `manual-check-1440.png`: mục 2.10 trên máy tính 1440 × 900. Có thanh bên đang mở chương 2, bảng giờ nhận phòng, bước đánh số có danh sách lồng.
- Không tràn ngang ở 390 px và 1440 px. `scrollWidth` bằng `clientWidth`; chỉ bảng rộng và ảnh đang phóng to cuộn ngang trong khung của chúng.
- Chrome headless tự giữ cửa sổ tối thiểu 500 px. Vì vậy `check_manual.py` giả lập thiết bị qua giao thức DevTools, không dùng `--window-size`.
- In thử PDF A4 (lưu ở thư mục tạm, không vào repo):
  - Bìa và mục lục mỗi phần một trang. Mỗi chương sang trang mới.
  - Có chân trang số trang.
  - Khung, bước, ảnh không bị cắt qua trang. Tiêu đề bảng lặp lại sang trang sau.

## 6. Rủi ro và việc còn lại

1. **Cỡ tệp khi đủ 88 ảnh.**
   - 3 ảnh QA đã chụp nặng 160–180 KB/ảnh PNG. Đủ 88 ảnh, tệp HTML sẽ khoảng 20 MB vì base64 nặng thêm 1/3. Bộ dựng tự cảnh báo khi tệp vượt 15 MB.
   - Đề xuất cho QA: xuất PNG 8-bit, hoặc giảm còn khoảng 1440 px chiều ngang, trước khi chép vào `img/`.
   - Nếu vẫn nặng: gửi INV bản `--link-images` kèm thư mục `img/`.
   - UXD không tự nén ảnh, vì việc giao là không sửa ảnh.
2. **Nút "In bộ cho bộ phận"** dùng sự kiện `afterprint` để hiện lại các chương đã ẩn. Đã đúng trên Chrome. Safari bản cũ có thể in cả sổ tay. Khuyên INV in bằng Chrome.
3. **Chú thích QA trong .md đã bị bỏ khỏi HTML** (đúng yêu cầu). Riêng chú thích ở mục 2.10 nhắc UXD: chữ hướng dẫn mã cửa trên màn hình (`ci.door_step1`) ghi "mã 6 số", trong khi BR-403 là 8 số. Việc này thuộc chuỗi giao diện, không thuộc sổ tay. Đề nghị ORC đưa vào việc của UXD/FE cho v1.0.1.
4. Font tải từ Google Fonts. Mở tệp khi không có mạng thì chữ hiện bằng Georgia/Arial, bố cục giữ nguyên.
5. Quyết định ở mục 3 thuộc quyền UXD (giao diện tài liệu). Đề nghị ORC ghi một dòng vào `01-decisions/decision-log.md` khi commit. UXD không tự sửa tệp này, để tránh đụng các vai đang ghi song song.
