# UXD – Bộ hướng dẫn theo bộ phận: bản HTML + tờ "Your ID details" cho máy tính bảng

- Round 3 · Bước **Sản xuất** (bộ hướng dẫn theo bộ phận – bản HTML) · UXD · 30/10/2026 · Hạn: trước buổi đào tạo C3a tối 31/10
- Nguồn chữ: `product/docs/manual/guides/00-index.md` … `05-sale-ctv.md` (BA, báo cáo `rounds/round-03/outputs/BA/department-guides.md`). UXD **không sửa** các tệp .md. Chỗ chữ cần BA sửa ở mục 5.
- Brand: `00-brief/context/brand/brand-guidelines.md`. Chỉ dùng Ivory, Cream, Stone Grey, Ink, Light Oak, Earth Brown, Sage (dùng lại CSS của sổ tay HTML); Lora tiêu đề, Be Vietnam Pro nội dung, JetBrains Mono mã. Không emoji.
- Chưa commit (theo giao việc).

## 1. Đã làm gì

- **Bộ dựng mới** `product/design/tools/build_guides.py`: dùng chung lõi đọc Markdown và CSS của `build_manual.py`. Mỗi tệp guides thành một trang HTML riêng, `00-index.md` thành trang mục lục có thẻ "Chọn tệp của bộ phận".
- **`build_manual.py`**: thêm 3 hook nhỏ (`ctx.xref_hook`, `ctx.render_shots`, `ctx.render_quote`) để bộ dựng mới tự nối mục và vẽ ảnh. Sổ tay dựng lại **giống hệt từng byte** so với trước khi sửa (đã `cmp`).
- **Bản điện tử tờ "Your ID details"** cho máy tính bảng ở quầy: `your-id-details-tablet.html`. Chữ lấy **nguyên văn** từ `product/docs/print/to-4-your-id-details-a4.html`.

Mỗi trang:
- **Tự đứng được.** Ảnh và font nhúng base64, không gọi mạng. Gửi qua Zalo hoặc email nội bộ, mở trên điện thoại khi không có mạng vẫn đúng font thương hiệu.
- **Ảnh:** nhận cả mã `Cx-yy` (sổ tay) và `Gx-yy` (bộ hướng dẫn) trong `product/docs/manual/img/`. Ảnh thiếu thì hiện khung nét đứt gồm: nhãn "Chưa có ảnh" (mã C) hoặc "Ảnh mới · chờ chụp" (mã G), **mã ảnh in to**, mô tả màn hình (lấy từ `screenshot-list.md` hoặc `screenshot-additions.md`) và tên tệp cần đặt.
  - QA chép ảnh vào `img/` rồi chạy lại lệnh dựng là ảnh tự vào chỗ, không phải sửa gì khác.
  - Trên điện thoại, chạm ảnh máy tính để phóng to, rồi vuốt ngang để xem.
- **Nối mục:**
  - "mục 7.2", "mục 15" nối tới mục trong cùng tệp.
  - "`02` mục 7.2", "`02-le-tan.md` mục 7.2", "tệp 02 mục 17.1" nối sang tệp khác. "`02`" đứng riêng nối tới tệp đó.
  - Không nối số mục của sổ tay ("sổ tay 1.5 mục 2.13").
  - Kết quả: 213 liên kết mục, 49 liên kết tệp, **0 liên kết hỏng** (đã kiểm mọi `href` với `id` đích). Mọi "mục N" trong 6 tệp đều tìm được đích.
- **Điều hướng:**
  - **Điện thoại (≤ 1099 px):** thanh trên có OTTIMO, tên tệp và nút "Bộ hướng dẫn" (về mục lục). Dưới đó là thanh mục dính đầu trang, cuộn ngang, sáng đúng phần đang đọc, kèm nút **Tìm**. Mỗi phần nhiều mục có thêm danh sách "Các mục trong phần này".
  - **Máy quầy (≥ 1100 px):** thanh bên trái liệt kê 6 tệp của bộ (tệp đang xem được đánh dấu), ô tìm, rồi các phần và mục của tệp. Phần đang đọc tự mở danh sách mục.
  - Cuối trang có nút sang tệp trước và tệp sau.
- **Tìm trong trang:**
  - Gõ có dấu hay không dấu đều được ("hoan coc" tìm ra "hoàn cọc").
  - Kết quả gồm số mục, tên mục và đoạn trích có tô màu. Nếu không có cụm liền nhau thì tìm mục chứa đủ các từ.
  - Chạm một kết quả: nhảy tới mục đó, tô chữ tìm được, đóng khung tìm trên điện thoại.
  - Enter mở kết quả đầu, Esc đóng.
- **In:**
  - Nút "In tệp này" ở bìa. In A4, chân trang ghi "Hướng dẫn · Lễ tân · trang N".
  - Khi in, ẩn thanh mục, ô tìm và nút; mở hết mục lục; không tách khung, bảng, ảnh hay tờ thông báo giữa hai trang.
  - Phần mới không ép sang trang mới, để đỡ giấy.
- **Tờ "Your ID details" trong `02` mục 7.2** hiện thành bản xem trước giống tờ in (giấy trắng, Lora, nét Light Oak, chân tờ). Ngay dưới có đường mở bản cho máy tính bảng.

## 2. Lệnh dựng

Chạy từ gốc repo, chỉ cần Python 3.9+ (thư viện chuẩn):

```
python3 -I product/design/tools/build_guides.py
```

- Ghi đè `product/docs/manual/guides/html/*.html`. Màn hình in ra số phần, số mục, chỗ ảnh, ảnh có/thiếu của từng tệp, rồi đối chiếu chữ tờ Your ID details trong `02-le-tan.md` với bản A4. Chữ khác thì in từng đoạn khác và **thoát mã 1**.
- Thêm `--check-dir <thư mục>` để kiểm bằng Chrome headless:
  - đo tràn ngang ở 390 px và 1440 px;
  - chụp ảnh kiểm;
  - thử tìm "hoan coc";
  - in thử PDF tệp 02;
  - đo tờ máy tính bảng ở 1180 × 820, 820 × 1180 và 1024 × 768.
  - Nên để ảnh kiểm ngoài repo (scratchpad), vì trong ảnh có ảnh chụp Desk.
- Tùy chọn khác: `--link-images` (trỏ ảnh thay vì nhúng, tệp nhẹ nhưng không tự đứng được), `--no-embed-fonts` (dùng Google Fonts).
- Font nhúng lấy từ `product/apps/landing-web/node_modules/@fontsource` (SIL OFL, được nhúng). Không có thư mục đó thì bộ dựng tự chuyển sang Google Fonts.
- Dựng lại mỗi khi BA, DOM hoặc SEC sửa .md, hoặc QA thêm ảnh.

## 3. Tệp đầu ra và kết quả chạy với nội dung hiện tại (30/10, 14:36)

Thư mục `product/docs/manual/guides/html/`:

| Tệp | Phần (`##` có số) | Mục (`###`) | Chỗ ảnh | Ảnh có / mã | Còn thiếu | Cỡ |
|---|---:|---:|---:|---:|---|---:|
| `00-index.html` (mục lục) | 7 | 2 | 0 | – | – | 0,3 MB |
| `01-chu-dau-tu-quan-ly.html` | 18 + "Cách đọc" | 42 | 34 | **27 / 34** | G1-01…G1-06, C1-15 | 2,5 MB |
| `02-le-tan.html` | 20 + "Cách đọc" | 71 | 63 | **54 / 62** | G2-01…G2-07, C2-34 | 4,5 MB |
| `03-buong-phong.html` | 15 + "Cách đọc" | 11 | 12 | **10 / 12** | G3-01, G3-02 | 0,8 MB |
| `04-bao-tri.html` | 12 + "Cách đọc" | 11 | 13 | **10 / 12** | G4-01, G4-02 | 0,8 MB |
| `05-sale-ctv.html` | 11 + "Cách đọc" | 20 | 13 | **11 / 13** | G5-01, G5-02 | 1,1 MB |
| `your-id-details-tablet.html` | – | – | – | – | – | 85 KB |

- Tổng: **112 mã ảnh có / 133**. Còn thiếu **21**: 19 ảnh G mới + C1-15, C2-34. Khớp đúng số trong báo cáo BA. Một mã đặt 2 lần (C2-19, C4-01) chỉ tính một lần.
- Kiểm Chrome headless: **không tràn ngang** ở 390 px và 1440 px cả 6 tệp. Tìm không dấu chạy cả trên điện thoại và máy quầy. In thử `02-le-tan.html` ra **79 trang A4**, tờ thông báo nằm trọn một trang.
- Mọi tệp dưới 5 MB: gửi Zalo, email nội bộ đều được.

## 4. Tờ "Your ID details" – bản cho máy tính bảng ở quầy

Tệp: `product/docs/manual/guides/html/your-id-details-tablet.html`. Đặt cùng thư mục bộ hướng dẫn để link trong `00` và `02` mục 7.2 mở được.

- **Chữ:** lấy thẳng từ HTML bản A4 đã dựng (`to-4-your-id-details-a4.html`), không gõ lại. Gồm nhãn OTTIMO, tiêu đề, dòng phụ, 4 đoạn EN, 4 đoạn VI và chân tờ "OTTIMO · ID notice" / "11/2026". Thẻ `<meta name="ottimo-source">` ghi mã của bản A4 (`b17695841e`) để truy lại tờ khách đã thấy (SEC D08).
  - Bộ dựng cũng đối chiếu bản A4 với nguyên văn BA chép ở `02-le-tan.md` mục 7.2: **khớp cả 11 phần**.
- **Chỉ có tờ thông báo.** Không có menu, liên kết, nút hay chữ cho nhân viên, không có Desk hay dữ liệu khách, không gọi mạng. Đúng điều kiện BA nêu ở A4 (chờ SEC S1).
- **Dàn trang:**
  - Máy tính bảng nằm ngang: EN bên trái, VI bên phải, ngăn bằng nét đứng Light Oak.
  - Máy dựng đứng: EN trên, VI dưới, giống tờ A4.
  - Nền Ivory, chữ Ink, dòng phụ và chân tờ Stone Grey.
  - Chữ tự phóng to tới cỡ lớn nhất còn vừa một màn hình. Kết quả đo: 22 px ở 1180 × 820, 24 px ở 820 × 1180, 21 px ở 1024 × 768. Cả ba đều vừa, không phải cuộn. Màn quá nhỏ (dưới 15 px) thì cho cuộn.
  - Không ngắt dòng trong "check-out", "3 months", "35 days", "3 tháng", "35 ngày" (giữ như bản A4).
- **Toàn màn hình:** chạm một lần vào màn hình thì trình duyệt hiện toàn màn hình (nếu cho phép) và giữ màn hình không tắt khi tệp đang mở (Wake Lock, nếu trình duyệt hỗ trợ).
  - iPad Safari không cho toàn màn hình kiểu này. Cách làm: **Chia sẻ → Thêm vào Màn hình chính** rồi mở từ biểu tượng "ID notice" (tệp đã khai báo chế độ mở không có thanh trình duyệt).
- **Font:** Lora 500 và Be Vietnam Pro 400 nhúng sẵn, nên không có mạng vẫn đúng font.

## 5. Đối chiếu câu nói với khách và chỗ chữ cần BA sửa

### 5.1 Câu nói với khách: đối chiếu với bản đã duyệt

Căn cứ: `rounds/round-03/reviews/UXD-on-PO-v1.0.0-docs.md` (chữ UXD 30/10: mục 1.1, 1.2, thẻ 01, 05, S01), sổ tay 1.5, bản A4.

| Câu | Ở đâu trong guides | So với bản duyệt |
|---|---|---|
| Mời khách đọc tờ: "Before I take your ID, please read this note on how we use it." / "Trước khi nhận giấy tờ, mời anh/chị đọc tờ này…" | `02` 7.2 | **Khớp** thẻ FB-R3-UXD-PO-DT1-01 |
| Tờ Your ID details (nhãn, tiêu đề, 8 đoạn, chân tờ) | `02` 7.2 | **Khớp** mục 1.2 và bản A4 (bộ dựng kiểm từng đoạn) |
| Câu hỏi đồng ý lưu ảnh N ngày, EN/VI, kèm dặn "đọc đúng N", "gọi anh hoặc chị" | `02` 8.2 | **Khớp** mục 1.1 |
| "N ngày hay 3 tháng": "Your photos are deleted N days after check-out…" | `02` 8.2 | **Khớp** thẻ 05 |
| Giờ nhận phòng: "Check-in is from 12:00. Your room is always ready by 14:00." / "Nhận phòng từ 12:00. Phòng luôn sẵn sàng lúc 14:00." | `02` 7.1, `05` 3 | **Khớp** thẻ S01 |
| Từ chối gửi mã cửa (EN/VI) | `02` 7.5 | **Khớp** sổ tay 1.5 |
| Chống giả danh: "OTTIMO only messages you from this account and your OTA inbox, and never changes bank details by message." | `02` 4.1, `05` 5.1 | **Khớp** sổ tay 1.5 mục 2.4. Ghi chú trong sổ tay "UXD hoàn thiện câu chống giả danh" (SEC thẻ 09): **UXD xác nhận giữ nguyên.** Câu ngắn, điềm tĩnh, đúng giọng thương hiệu |
| Hẹn hoàn cọc: "We will transfer your 300,000 VND deposit back to you within 24 hours." | `02` 17.1, `01` 8.4 | **Khớp** sổ tay 1.5 |

Kết luận: **không có câu nói với khách nào lệch bản đã duyệt.**

### 5.2 Chỗ chữ cần BA sửa (UXD không tự sửa .md)

| # | Mức | Chỗ | Vấn đề | Đề xuất chữ |
|---|---|---|---|---|
| B1 | Major (trước C3a) | `02` mục 7.2 gạch "Bản trên màn hình"; `00` mục 4 gạch thứ 2 | "mở đúng tờ này trên máy tính bảng…" chưa nói mở tệp nào, làm thế nào. Lễ tân dễ mở sổ tay hoặc Desk cho khách xem | "**Bản trên màn hình**: trên máy tính bảng của cơ sở, mở tệp `your-id-details-tablet.html` (trong bộ hướng dẫn), chạm một lần để hiện toàn màn hình, quay màn hình về phía khách. Lúc đó máy chỉ mở tệp này: không mở Desk, Zalo hay tab khác." Thiết bị nào được dùng: chờ SEC S1 |
| B2 | Minor | `00` mục 4 câu cuối | "Bản in đã dàn trang: `staff-one-pager.md` Tờ 4 và bản in của UXD" chưa theo quyết định INV 30/10 (A4) | "Bản in A4: `product/docs/print/pdf/to-4-your-id-details-a4.pdf`. Bản cho máy tính bảng: `guides/html/your-id-details-tablet.html`." |
| B3 | Minor | `screenshot-additions.md` dòng G2-03, cột "Dữ liệu mẫu" | "Bản in thật của UXD (A5 dọc)", trong khi tờ đặt ở quầy nay là A4 | "Bản in A4 dọc của UXD (`to-4-your-id-details-a4.pdf`)" |
| B4 | Minor | "Cách đọc tệp này" của `01`–`05` (gạch 1 hoặc 2); `00` mục 6 | Câu "`[ẢNH: mã-mô tả]` là chỗ chèn ảnh" tả cú pháp Markdown. Trên bản HTML, người đọc không thấy cú pháp này mà thấy ảnh hoặc khung trống | "Ảnh màn hình có mã ở dưới ảnh (ví dụ C2-05). Khung nét đứt ghi **Chưa có ảnh** hoặc **Ảnh mới · chờ chụp** là ảnh đang chờ chụp: cứ làm theo chữ." (`00` mục 6 giữ cú pháp cho đội, thêm câu này cho người đọc) |
| B5 | Minor | `05` mục 6.1, khung Tạm ở v1.0 | "nhắn tay bằng **câu chuẩn**": tệp 05 không có câu nào tên là "câu chuẩn" | Trỏ rõ ("dùng câu giờ nhận phòng ở mục 3 và câu ở mục 5.1") hoặc bỏ cụm "bằng câu chuẩn" |
| B6 | Suggestion | Dòng "Tài liệu nội bộ…" ở đầu `02`–`05` | "Nghỉ việc thì trả lại": bộ hướng dẫn nay gửi bằng tệp qua Zalo, không còn bản giấy để trả | "Nghỉ việc (hết hợp tác) thì xóa tệp trên máy mình và báo chủ đầu tư." Nếu chủ đầu tư còn phát bản in thì giữ cả hai vế |

Các mục BA đánh dấu để UXD xem (báo cáo BA mục 4):
- **U1:** xong, mục 5.1.
- **U2:** xong, mục 4.
- **U3:** xong, bộ dựng đã nhận mã `G`.
- **U4 (câu báo lỗi đăng nhập, A13):** chưa đối chiếu từng chuỗi với `strings-vi.json` trong lượt này. Đưa vào bước Review.

## 6. Quyết định UXD (quyền giao diện, đề xuất ORC ghi decision-log)

`| 2026-10-30 | 3 | UXD – Bộ hướng dẫn theo bộ phận phát bằng HTML tự đứng (ảnh, font nhúng; mỗi bộ phận một tệp + mục lục; tìm không dấu; in A4) dựng bằng build_guides.py; tờ Your ID details có bản máy tính bảng your-id-details-tablet.html, chữ lấy nguyên văn bản A4, chỉ hiện tờ thông báo | UXD | Quyền UXD (giao diện, dàn trang trong khuôn khổ thương hiệu) |`

## 7. Giả định, rủi ro, việc chưa xong

- `[GIẢ ĐỊNH UXD]` Bộ hướng dẫn phát dưới dạng **thư mục `guides/html/` gửi nguyên** (hoặc từng tệp). Tệp bộ phận tự đứng được; chỉ link sang tệp khác và tới tờ máy tính bảng cần các tệp nằm cùng thư mục.
- `[GIẢ ĐỊNH UXD]` Máy tính bảng ở quầy là máy của cơ sở, có Safari hoặc Chrome đời mới. Wake Lock và toàn màn hình là phần thêm: trình duyệt không hỗ trợ thì tờ vẫn hiện đúng.
- **Rủi ro:** tệp chứa ảnh chụp Desk (dữ liệu giả, QA đã che) và là tài liệu nội bộ. Tờ máy tính bảng không chứa gì nội bộ. Ảnh kiểm của UXD để ngoài repo; chỉ commit ảnh G sau khi QA kiểm che (theo quy tắc).
- **Bản in tệp 02 dài 79 trang A4.** In được, nhưng chủ đầu tư nên in theo phần cần dùng (hộp in của trình duyệt chọn được dải trang), hoặc dùng bản điện thoại. Chưa làm nút "in riêng phần này" như sổ tay: làm sau nếu chủ đầu tư cần.
- Nội dung còn đổi (DOM, SEC, QA đang xem và chụp ảnh): chạy lại lệnh ở mục 2 sau mỗi lần sửa. Lệnh tự báo ảnh còn thiếu và chữ tờ thông báo lệch.
- Chưa thử trên máy thật (iPad, điện thoại Android). Đã đo bằng Chrome headless giả lập 390 × 844, 1440 × 900 và 3 cỡ máy tính bảng.
