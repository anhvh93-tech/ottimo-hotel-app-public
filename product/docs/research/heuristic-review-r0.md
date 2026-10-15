# Đánh giá heuristic – Prototype Round 0 "OTTIMO Desk"

> **Mô phỏng – cần INV kiểm chứng.**
> Đây là đánh giá **chuyên gia** (UXR – agent AI) theo 10 heuristic của Nielsen và WCAG 2.2 mức AA, **không phải** kết quả test với người dùng thật. Mức nghiêm trọng là nhận định của UXR; mức độ ảnh hưởng thật trên lễ tân, buồng phòng, khách cần INV kiểm chứng (giả thuyết H-xx ở `personas.md` mục 9).
>
> Đối tượng: `product/legacy/round-0-prototype/ottimo-desk.html` (2.173 dòng) và đặc tả ngược `product/docs/round-0-baseline.md` (**BL**).
> Người đánh giá: UXR · Round 1 · Bước 2 · 15/10/2026 · Phiên bản 0.1

---

## 1. Phạm vi và phương pháp

- **Cách làm**: đọc mã nguồn HTML/CSS/JS (cấu trúc DOM, thuộc tính ARIA, CSS kích thước, luồng sự kiện) và đối chiếu với mô tả màn hình ở BL mục 3. Đi qua các nhiệm vụ chính theo từng persona (P1–P7) bằng cách lần theo mã.
- **Giới hạn**: chưa render được giao diện trong trình duyệt của phiên làm việc này (trình duyệt tích hợp không mở được tệp cục bộ) → các phát hiện về bố cục thị giác dựa trên CSS, chưa có ảnh chụp màn hình. UXD/QA nên mở tệp bằng trình duyệt để xác nhận khi review.
- **Độ tương phản** được **tính** theo công thức WCAG từ token màu ở BL 6.2 (số liệu đo được, không phải ước lượng).
- **Ngữ cảnh**: prototype là bản demo dữ liệu mẫu. Mục tiêu đánh giá không phải "chấm điểm prototype" mà là **chỉ ra cái gì giữ, cái gì phải khác** khi UXD làm Design System và wireframe Round 1.

### Thang mức nghiêm trọng

| Mức (protocol) | Nielsen | Ý nghĩa trong báo cáo này |
|---|---|---|
| **Blocker** | 4 | Nếu giữ nguyên vào sản phẩm thật sẽ gây sai tiền, vi phạm pháp lý, hoặc một nhóm người dùng chính không dùng được |
| **Major** | 3 | Ảnh hưởng rõ tới tốc độ/độ chính xác công việc hằng ngày hoặc không đạt WCAG 2.2 AA; phải xử lý trong thiết kế Round 1–2 |
| **Minor** | 2 | Gây chậm/bối rối nhỏ; xử lý khi làm UI chi tiết |
| **Suggestion** | 1 | Cải thiện thêm |

---

## 2. Tóm tắt

- Tổng **25 phát hiện**: **4 Blocker**, **12 Major**, **7 Minor**, **2 Suggestion** (mục 4).
- Điểm mạnh lớn nhất: ngôn ngữ nghiệp vụ gần thực tế, luồng trả phòng 3 bước, thẻ "khách trả phòng hôm nay", FOC có lý do, kiểm trùng lịch có báo tên khách trùng, đã có nền ARIA (mục 5).
- Vấn đề lớn nhất theo nhóm:
  1. **Một giao diện cho mọi vai và mọi thiết bị** – buồng phòng dùng giao diện desktop thu nhỏ, app khách chỉ tiếng Việt (HR-01, HR-02, HR-03).
  2. **Phòng ngừa lỗi tiền/pháp lý dựa vào trí nhớ người dùng** – phụ thu mặc định, hủy giữ chỗ không xác nhận, kiểm hạn hộ chiếu giả (HR-04, HR-06, HR-07).
  3. **Mất dữ liệu khi bị ngắt quãng** – Esc/bấm nền đóng modal không hỏi (HR-05).
  4. **Khả năng tiếp cận**: focus không quản lý trong modal/drawer, chữ màu `--faint` tương phản 2,65:1, vùng chạm nhỏ, trạng thái truyền bằng màu (HR-08, HR-10, HR-11, HR-12).

### 2.1 Số phát hiện theo heuristic

| Heuristic Nielsen | Số phát hiện | Mã |
|---|:-:|---|
| H1 Hiển thị trạng thái hệ thống | 3 | HR-09, HR-15, HR-16 |
| H2 Khớp với thế giới thực | 4 | HR-01, HR-13, HR-14, HR-25 |
| H3 Quyền kiểm soát và tự do | 2 | HR-05, HR-17 |
| H4 Nhất quán và chuẩn | 2 | HR-18, HR-19 |
| H5 Phòng ngừa lỗi | 4 | HR-04, HR-06, HR-07, HR-20 |
| H6 Nhận biết hơn nhớ lại | 1 | HR-21 |
| H7 Linh hoạt và hiệu quả | 3 | HR-02, HR-03, HR-22 |
| H8 Thẩm mỹ và tối giản | 1 | HR-23 |
| H9 Giúp nhận biết, chẩn đoán, phục hồi lỗi | 1 | HR-24 |
| H10 Trợ giúp và tài liệu | – | (ghi chú inline trong prototype là điểm mạnh; xem mục 5) |
| WCAG 2.2 AA (gắn BL 8.3) | 4 (+ phần a11y trong các mã trên) | HR-08, HR-10, HR-11, HR-12 |

---

## 3. Đối chiếu BL 8.3 (khả năng truy cập) → tiêu chí WCAG 2.2 → phát hiện

| BL 8.3 | Tiêu chí WCAG 2.2 | Kết quả kiểm tra mã | Mã phát hiện |
|---|---|---|---|
| Modal/drawer không bẫy focus, không đưa focus vào khi mở, không trả focus khi đóng | 2.4.3 Focus Order (A), 2.4.11 Focus Not Obscured (AA, mới ở 2.2), 2.1.2 No Keyboard Trap (A) | Xác nhận: `closeLayer()` (dòng 524) chỉ xóa phần tử `.scrim`, không trả focus; không có mã đặt focus khi mở. Có `role="dialog"` + `aria-modal` (15 chỗ) nhưng nội dung phía sau vẫn tab tới được | HR-08 |
| Dòng bảng khai báo bấm bằng `tr` | 2.1.1 Keyboard (A), 4.1.2 Name, Role, Value (A) | Xác nhận: `<tr … data-regsel>` (dòng 1142), xử lý ở dòng 1258 bằng `closest('button,[data-regsel]')` – `tr` không nhận focus bàn phím | HR-08 |
| Tooltip biểu đồ chỉ theo chuột; SVG không có bảng thay thế | 1.1.1 Non-text Content (A), 1.4.13 Content on Hover or Focus (AA) | Xác nhận: có `role="img"` (2 chỗ) nhưng số liệu chi tiết chỉ có trong tooltip chuột/`title` | HR-12 |
| Trạng thái truyền chủ yếu bằng màu | 1.4.1 Use of Color (A), 1.4.11 Non-text Contrast (AA) | Một phần: thanh rack có chữ tên khách + `title`, nhưng **loại** đơn (đang ở / đã xác nhận / giữ chỗ / dài hạn) chỉ phân biệt bằng màu và kiểu viền; viền trên thẻ buồng 4px chỉ có màu (chip bên trong có chữ). Màu `--ok` #3D7552 và `--bad` #A8403C có độ sáng gần nhau (tỷ lệ 1,12:1) → người mù màu đỏ–lục gần như không phân biệt được | HR-11 |
| `alert` trong modal không có `role="alert"` | 4.1.3 Status Messages (AA) | Xác nhận: chỉ 3 chỗ có `role="alert"`; toast có `role="status"` nhưng tự tắt sau 2,8 giây | HR-09, HR-24 |
| Ô số lượng/giá nhỏ; tab dưới mobile 9–11 mục | 2.5.8 Target Size (Minimum) (AA, mới ở 2.2), 1.4.10 Reflow (AA) | Nút `.btn.sm` ≈ 26px cao (padding 4px + chữ 12px) – **đạt** tối thiểu 24px của 2.5.8 nhưng **dưới 44px** khuyến nghị cho người lớn tuổi/tay ướt; tab dưới `.mnav` mỗi mục 64px rộng, chữ 10,5px, cuộn ngang | HR-02, HR-10 |
| `<title>` trong `<body>`, thiếu `lang="vi"` | 3.1.1 Language of Page (A), 2.4.2 Page Titled (A) | Xác nhận: dòng 1 `<html>` không có `lang`; `<title>` nằm sau `<body>` | HR-08 |
| (Bổ sung, BL chưa nêu) Tương phản chữ | 1.4.3 Contrast (Minimum) (AA) | Đo được: `--faint` #9A948A trên `--bg` **2,65:1**, trên `--surface` **2,86:1** (cần 4,5:1) – dùng cho nhãn nhóm menu, chữ tiếng Anh trên bill, nhật ký nhắc; `--oak` trên `--surface` **2,94:1**; `--oak-ink` trên `--oak-soft` **4,18:1**; `--warn` trên `--warn-bg` **4,31:1** (chữ nhỏ không đạt) | HR-10 |
| (Bổ sung) Chữ rất nhỏ | 1.4.4 Resize Text (AA) – không vi phạm trực tiếp nhưng ảnh hưởng người lớn tuổi | Có chữ 9,5px (dòng 52), 10px, 10,5px (nhãn menu, tab dưới, trục biểu đồ, chú thích thanh rack) | HR-10 |
| (Bổ sung) Focus nhìn thấy | 2.4.7 Focus Visible (AA), 1.4.11 | Có `:focus-visible` viền 2px màu `--oak` – tốt; nhưng `--oak` trên nền `--bg` chỉ **2,72:1** (< 3:1 cho thành phần phi văn bản) | HR-10 |
| (Bổ sung) Ngôn ngữ app khách | 3.1.2 Language of Parts (AA) + không phải WCAG: dùng được với khách NN | App khách chào "Chào {tên}" và toàn bộ nội dung tiếng Việt, kể cả cho khách mẫu Daniel (Đức) và Ji-woo (Hàn) (dòng 815, 1633) | HR-01 |

---

## 4. Danh sách phát hiện

Định dạng: Mức · Heuristic/WCAG · Bằng chứng (màn hình, dòng mã, mục BL) · Persona bị ảnh hưởng · Đề xuất (cho UXD/BA/PO – UXR không tự thiết kế lại).

### Blocker

**HR-01 – App khách chỉ có tiếng Việt**
- Mức: **Blocker** · H2 Khớp thế giới thực; WCAG 3.1.2
- Bằng chứng: màn `gapp` – lời chào "Chào {tên}", tab Yêu cầu, Hóa đơn, check-in online đều tiếng Việt (dòng 815, 1633, 799), dù khách mẫu là Daniel (NN, dài hạn) và Ji-woo (Hàn, Booking.com). BL 1 ghi "dự kiến thêm Anh, Hàn, Trung" nhưng chưa có.
- Ảnh hưởng: P6, P7 – nhóm khách lớn của OTTIMO (brief mục 1, 5) không dùng được app khách; check-in online (giảm tải quầy, chuẩn bị khai báo) mất tác dụng.
- Đề xuất: i18n từ đầu cho app khách (VI/EN bắt buộc, RU thứ 3 theo decision-log P4); ngôn ngữ mặc định theo trình duyệt + chọn tay ở đầu trang; chuỗi pháp lý (đồng ý lưu giấy tờ, chính sách hủy) dịch bởi người, không dịch máy. → UXD (content-guide, bảng chuỗi), PO (AC).

**HR-04 – Phụ thu nhận sớm bị tính sẵn khi mở modal**
- Mức: **Blocker** (sai tiền) · H5 Phòng ngừa lỗi
- Bằng chứng: Modal Nhận phòng – giờ nhận mặc định = giờ demo nếu trước 14:00 → phụ thu 30% hiện ngay (BL 3.6, 8.2 #2). Lễ tân bận có thể bấm Lưu mà không để ý.
- Ảnh hưởng: P2 (thu sai), P5/P7 (bị tính phí không báo trước → tranh chấp, đánh giá xấu).
- Đề xuất: mặc định **không có phụ thu**; lễ tân phải chủ động chọn "Nhận sớm" và thấy số tiền trước khi lưu; hiển thị chính sách áp dụng (chờ ESC phụ thu của PO/DOM). → UXD (L3), DOM (BR).

**HR-06 – Hủy giữ chỗ một chạm, không xác nhận, không lý do, không hoàn tác**
- Mức: **Blocker** (mất đơn/doanh thu, không truy vết) · H5, H3
- Bằng chứng: Drawer đơn `hold` – nút "Huỷ giữ chỗ" (dòng 1027) gọi thẳng `cancelHold` (dòng 970): đổi trạng thái `cx`, đưa lead về "Đã báo giá", không hỏi lại, không lý do (BL 8.2 #23). Toàn bộ prototype có **0** lệnh xác nhận (`confirm`) cho hành động không đảo ngược.
- Ảnh hưởng: P2, P4 (bấm nhầm khi đang thao tác trên điện thoại), P1 (không biết vì sao mất đơn).
- Đề xuất: mẫu chung cho hành động phá hủy/tiền: hộp xác nhận nêu hậu quả cụ thể ("Căn 203 sẽ mở bán lại trên 7 kênh") + lý do bắt buộc; hoặc hoàn tác trong 10 giây với hành động đảo được. Áp dụng cho: hủy giữ chỗ, hoàn tất trả phòng, đóng/mở bán kênh, gộp hồ sơ, đổi phiếu sửa sang "Xong" (mở khóa phòng). → UXD (Design System: pattern xác nhận), BA (lý do hủy trong state machine).

**HR-07 – Đối chiếu giấy tờ báo "Khớp" giả cho hạn hộ chiếu**
- Mức: **Blocker** (pháp lý) · H5; H1 (trạng thái hệ thống sai)
- Bằng chứng: Panel Giấy tờ & khai báo – kiểm "hộ chiếu còn hạn sau ngày trả phòng" luôn đánh dấu đạt (BL 5.12, 8.2 #3).
- Ảnh hưởng: P2 tin vào dấu tích xanh → không kiểm tay; rủi ro nhận khách hộ chiếu hết hạn, khai báo sai.
- Đề xuất: không hiển thị dấu "Khớp" khi hệ thống chưa thật sự kiểm; dùng 3 trạng thái **Đạt / Không đạt / Chưa kiểm được (cần kiểm tay)**. → UXD (component trạng thái kiểm tra), BE/QA (Round 2).

### Major

**HR-02 – Buồng phòng/bảo trì dùng giao diện desktop thu nhỏ**
- Mức: **Major** · H7 Linh hoạt & hiệu quả; WCAG 2.5.8
- Bằng chứng: ≤900px chỉ ẩn sidebar, thêm tab dưới cuộn ngang 9–11 mục, chữ 10,5px (dòng 78); thẻ buồng dùng nút `.btn.sm` ≈ 26px; ô nhập minibar `type=number` 64–96px (dòng 1327; BL 8.3); phiếu sửa là bảng nhiều cột (dòng 693).
- Ảnh hưởng: P3 (tay ướt, một tay, mắt kém – H-05, H-07).
- Đề xuất: giao diện mobile riêng cho vai buồng phòng: "Việc của tôi" 1 cột, nút ≥ 48px, nút +/− cho minibar, chụp ảnh báo hỏng, thao tác offline. → UXD (L6), ARC (offline/PWA).

**HR-03 – Không có điều hướng theo vai: mọi vai thấy cùng dashboard tài chính**
- Mức: **Major** · H7; H8
- Bằng chứng: Bộ chọn "Xem với vai trò" (dòng 354) chỉ ẩn/hiện menu (BL 2); màn Tổng quan mở đầu bằng KPI ADR/RevPAR (BL 3.2) – lễ tân đầu ca cần "khách đến/đi, khai báo còn thiếu" trước.
- Ảnh hưởng: P2, P1.
- Đề xuất: trang chủ khác nhau theo vai (lễ tân: việc theo giờ; chủ đầu tư: rủi ro tiền/pháp lý; CTV: căn trống + báo giá). → UXD (L1, L8), BA (RBAC).

**HR-05 – Esc hoặc bấm nền đóng modal ngay, mất dữ liệu đang nhập**
- Mức: **Major** · H3 Quyền kiểm soát
- Bằng chứng: `keydown Escape → closeLayer()` (dòng 2166); bấm vùng tối `[data-scrim]` → `closeLayer()` (dòng 2127). Không kiểm tra form đã sửa. Thêm vào đó `render()` dựng lại toàn màn hình bằng `innerHTML` (dòng 521) → mất vị trí cuộn và nội dung ô đang gõ ở màn chính (BL 8.4).
- Ảnh hưởng: P2 (bị ngắt quãng liên tục, J3 11:30), đặc biệt ở Trả phòng 3 bước và Đặt phòng mới.
- Đề xuất: modal có dữ liệu đã nhập thì hỏi "Bỏ thay đổi?"; luồng nhiều bước tự lưu nháp; bấm nền **không** đóng modal có form. → UXD (pattern modal), FE (Round 2).

**HR-08 – Quản lý focus và bàn phím (BL 8.3)**
- Mức: **Major** · WCAG 2.1.1, 2.4.3, 2.4.11, 3.1.1, 2.4.2
- Bằng chứng: xem mục 3 (dòng 524, 1142, 1258, dòng 1).
- Ảnh hưởng: lễ tân thao tác nhanh bằng bàn phím; người dùng trình đọc màn hình.
- Đề xuất: Design System quy định: mở modal → focus vào phần tử đầu/tiêu đề; bẫy focus; đóng → trả focus về nút gọi; dòng bảng chọn được bằng nút/link thật; `<html lang>` theo ngôn ngữ hiện tại; tiêu đề trang theo màn hình. → UXD (quy tắc a11y), FE.

**HR-09 – Phản hồi quan trọng chỉ là toast 2,8 giây**
- Mức: **Major** · H1; WCAG 2.2.1 Timing Adjustable, 4.1.3
- Bằng chứng: `toast()` tự xóa sau 2.800 ms (dòng 523); được dùng cho cả thông tin quan trọng: "nhớ khai báo trước 23:00" sau nhận phòng (BL 3.6), "Căn vừa có người đặt" (dòng 950), "Đã tạo … đã gửi link thanh toán" (dòng 958).
- Ảnh hưởng: P2 (đang nhìn khách, không nhìn màn hình), người đọc chậm/lớn tuổi.
- Đề xuất: toast chỉ cho xác nhận thường; nhắc việc pháp lý/tiền thì thành **mục việc bền vững** trên dashboard đến khi xử lý xong; toast có nút đóng và thời gian ≥ 5 giây hoặc dừng khi rê chuột. → UXD.

**HR-10 – Tương phản chữ và kích thước chữ không đạt AA**
- Mức: **Major** · WCAG 1.4.3, 1.4.11
- Bằng chứng: số đo ở mục 3 – `--faint` 2,65–2,86:1 (dùng cho `.nav .sec` dòng 59, chữ `.en` trên bill, `.dep-log`, cách đọc giấy tờ…), `--oak` 2,94:1, focus ring 2,72:1; chữ 9,5–10,5px.
- Ảnh hưởng: P3, mẹ của P5, mọi người dùng dưới nắng/màn hình rẻ.
- Đề xuất: tăng độ đậm `--faint` (hoặc chỉ dùng cho trang trí, không cho chữ); thêm token `--oak` đậm hơn cho chữ/viền focus; tối thiểu 12px cho chữ phụ trên desktop, 14–16px trên mobile. Giữ cảm giác kem – gỗ sồi là việc của UXD; UXR chỉ yêu cầu **mọi cặp màu chữ ≥ 4,5:1, thành phần UI ≥ 3:1**. → UXD (tokens.json + bảng kiểm tương phản cả sáng và tối).

**HR-11 – Trạng thái truyền bằng màu; xanh/đỏ khó phân biệt với người mù màu**
- Mức: **Major** · WCAG 1.4.1; H2
- Bằng chứng: loại thanh rack phân biệt bằng màu + kiểu viền (BL 3.3a); viền trên thẻ buồng 4px theo màu; `--ok` vs `--bad` độ sáng gần nhau (1,12:1).
- Ảnh hưởng: P2, P3 (nam giới lao động – ~8% nam mù màu đỏ–lục).
- Đề xuất: mọi trạng thái có **nhãn chữ + icon**; thanh rack có tiền tố ngắn (ví dụ biểu tượng ổ khóa cho OOO, đồng hồ cát cho giữ chỗ); chú giải màu luôn hiển thị; kiểm tra bằng mô phỏng mù màu. → UXD.

**HR-12 – Biểu đồ không có dữ liệu thay thế; tooltip chỉ theo chuột**
- Mức: **Major** (với chủ đầu tư dùng điện thoại – không có chuột) · WCAG 1.1.1, 1.4.13
- Bằng chứng: biểu đồ công suất SVG tooltip khi rê chuột (BL 3.2); `.hbar` dùng `title` (dòng 563).
- Ảnh hưởng: P1 trên điện thoại (H-01) không xem được số từng ngày.
- Đề xuất: chạm để xem giá trị; nút "Xem dạng bảng"; số chính in thẳng trên biểu đồ. → UXD, DATA.

**HR-13 – Thuật ngữ khách sạn (VC/VI/VD/OD/OOO, FOC, ADR, RevPAR) không giải thích cho người không chuyên**
- Mức: **Major** cho giao diện buồng phòng; Minor cho chủ đầu tư · H2
- Bằng chứng: chip trạng thái buồng hiển thị mã kèm nhãn ngắn (BL 4.5); nút chuyển trạng thái theo mã (BL 5.15); "FOC" xuất hiện trên bill và form.
- Ảnh hưởng: P3 (H-06), khách thấy chữ "FOC" trên bill (P5, P7).
- Đề xuất: giao diện buồng phòng dùng câu thường ("Cần dọn", "Đang dọn", "Sẵn sàng đón khách"), mã chỉ hiện trong giao diện quản lý; trên bill khách ghi "Miễn phí" thay vì "FOC". → UXD (content-guide).

**HR-14 – Hóa đơn/tiền điện nước dài hạn không đủ minh bạch cho khách**
- Mức: **Major** · H2; H1
- Bằng chứng: app khách Daniel hiển thị chỉ số × đơn giá (BL 3.21) nhưng không ảnh công tơ, không kỳ chốt; chỉ số mới < cũ bị ép 0 không báo (BL 8.2 #21); trả phòng dài hạn không có khấu trừ/hoàn ký quỹ (BL 8.2 #6).
- Ảnh hưởng: P6 (tranh chấp tiền), P3 (ghi sai không ai phát hiện).
- Đề xuất: hóa đơn tháng có kỳ chốt, chỉ số đầu/cuối + ảnh; cảnh báo bất thường khi nhập; màn trả phòng dài hạn có bảng ký quỹ. → UXD (L4 biến thể, L7), DOM (BR ký quỹ).

**HR-20 – Khóa phòng từ phiếu sửa chữa không chặn bán nhưng giao diện cho cảm giác đã khóa**
- Mức: **Major** (bán nhầm phòng hỏng) · H5; H1
- Bằng chứng: tick "Khoá phòng đến khi sửa xong" chỉ đổi trạng thái buồng = OOO, không tạo đơn khóa → rack và phòng trống OTA vẫn coi là trống (BL 8.2 #5).
- Ảnh hưởng: P3 tin đã khóa; P2 đặt khách vào phòng hỏng; P7 nhận phòng hỏng.
- Đề xuất: giao diện chỉ báo "Đã khóa – ngừng bán trên mọi kênh" khi hệ thống thật sự đã chặn; hiện khoảng ngày khóa trên rack. → UXD, BA (state machine), BE.

**HR-21 – Lễ tân phải nhớ và chép dữ liệu khai báo sang cổng Bộ Công an**
- Mức: **Major** · H6 Nhận biết hơn nhớ lại; H7
- Bằng chứng: Modal khai báo 3 bước: sao chép text → mở cổng ngoài → dán mã hồ sơ tay (BL 3.11). Không nhắc lại nếu bỏ dở.
- Ảnh hưởng: P2 (J3 14:00), đặc biệt ca tối (H-04).
- Đề xuất: giữ bán tự động (chờ INT) nhưng: sao chép từng trường theo đúng thứ tự form của cổng; trạng thái "Đã mở cổng – chưa dán mã" có nhắc theo mốc giờ; danh sách khai báo còn thiếu luôn hiện trên dashboard lễ tân. → UXD (L3), INT.

### Minor

**HR-15 – Không thấy tiến độ đồng bộ kênh thật / lỗi đồng bộ**
- Mức: Minor (prototype giả lập; sẽ thành Major khi có channel manager) · H1
- Bằng chứng: Kênh OTA – "Đẩy lên tất cả kênh" chỉ ghi log "Vừa xong" (BL 3.19).
- Đề xuất: trạng thái từng kênh (Đang gửi / Thành công / Lỗi – thử lại) và cảnh báo khi một kênh lỗi. → UXD, INT.

**HR-16 – Bộ đếm giữ chỗ và hiệu lực báo giá không hiển thị**
- Mức: Minor (UX) – lỗi logic thuộc BL 8.2 #19 · H1
- Bằng chứng: hạn giữ chỗ 12/24/48h chỉ là chữ; báo giá "hiệu lực 3 ngày" không theo dõi (BL 5.4, 5.5).
- Đề xuất: hiển thị "còn 5 giờ 20 phút" trên thanh rack, kanban sale, và trang khách. → UXD (L5).

**HR-17 – Không có hoàn tác cho thao tác buồng phòng**
- Mức: Minor · H3
- Bằng chứng: nút chuyển trạng thái buồng (BL 5.15) không có quay lại; "Dọn xong" tự đánh dấu việc xong.
- Đề xuất: "Hoàn tác" 10 giây sau mỗi chuyển trạng thái. → UXD (L6).

**HR-18 – Hai quy ước giá khác nhau cho cùng một việc (gia hạn dùng giá niêm yết, không phải giá đơn)**
- Mức: Minor (UX) – logic thuộc BL 8.2 #13 · H4 Nhất quán
- Bằng chứng: Modal Gia hạn mặc định giá niêm yết làm tròn 10.000 (BL 3.9); app khách "Ở thêm 1 đêm" cũng vậy; khách OTA giá đơn khác.
- Đề xuất: luôn hiển thị **giá sẽ thu** + nguồn giá ("giá trực tiếp hôm nay") trước khi xác nhận, cùng một cách ở quầy và app khách. → UXD, DOM.

**HR-19 – Đặt tên/nhãn không thống nhất giữa màn hình**
- Mức: Minor · H4
- Bằng chứng: "Huỷ"/"Hủy" (cả hai cách bỏ dấu), "Khoá"/"Khóa", "Bill"/"Phiếu thanh toán"/"Hoá đơn", "CTV / môi giới" vs "Sale" vs "Người chốt"; vai "Lễ tân Hạnh" / "Lễ tân trưởng Hạnh" (BL 2).
- Đề xuất: bảng thuật ngữ trong content-guide (một cách viết chính tả; một tên cho mỗi khái niệm, khớp với tên trạng thái của BA). → UXD, BA, QA (kiểm nhất quán B1).

**HR-22 – Không có lối tắt cho việc lặp lại hằng ngày**
- Mức: Minor · H7
- Bằng chứng: Đặt phòng mới luôn mặc định căn 203, 2 đêm (BL 3.5) thay vì lấy từ ô trống được bấm trên rack; không có tìm nhanh đơn/khách toàn cục.
- Đề xuất: bấm ô trống trên rack → mở đặt phòng điền sẵn căn + ngày; ô tìm kiếm toàn cục (tên, SĐT, mã đơn, số căn). → UXD (L2).

**HR-24 – Thông báo lỗi chưa luôn chỉ cách sửa**
- Mức: Minor · H9
- Bằng chứng: điểm tốt – trùng lịch báo tên khách và khoảng ngày (BL 3.5), trùng hồ sơ có nút "Gộp vào hồ sơ đó" (BL 3.16). Điểm chưa tốt – sửa giá OTA rỗng/0 bị bỏ qua lặng lẽ (BL 8.2 #20); công tơ nhỏ hơn số cũ bị ép 0 không báo (8.2 #21); cảnh báo trong modal thiếu `role="alert"`.
- Đề xuất: mọi lỗi nhập: nêu vấn đề + cách sửa + giữ nguyên dữ liệu đã nhập; gắn `role="alert"`/`aria-describedby` cho lỗi trường. → UXD (content-guide: mẫu thông báo lỗi).

### Suggestion

**HR-23 – Màn hình mật độ cao, nhiều ghi chú giải thích dành cho người xem demo**
- Mức: Suggestion · H8
- Bằng chứng: huy hiệu "Demo · dữ liệu mẫu", nhiều đoạn "note" giải thích nghiệp vụ trong giao diện (BL 8.1), sơ đồ kiến trúc trong màn Kênh OTA.
- Đề xuất: ghi chú này rất có giá trị cho BA – chuyển vào tài liệu/hướng dẫn; giao diện vận hành chỉ giữ thông tin hành động được. Có thể có chế độ "Hướng dẫn" bật/tắt cho người mới. → UXD, PO.

**HR-25 – Bill song ngữ nên mở rộng ngôn ngữ**
- Mức: Suggestion · H2
- Bằng chứng/đề xuất: Bill đã có song ngữ + quy đổi USD cho khách NN: nên mở rộng sang tiếng Nga và cho chọn ngôn ngữ bill theo hồ sơ khách. → UXD (Suggestion).

> Ghi chú đếm: tổng 25 = 4 Blocker (HR-01, 04, 06, 07) + 12 Major (HR-02, 03, 05, 08, 09, 10, 11, 12, 13, 14, 20, 21) + 7 Minor (HR-15, 16, 17, 18, 19, 22, 24) + 2 Suggestion (HR-23, 25). Thứ tự mã theo nhóm heuristic, không theo mức.

---

## 5. Điểm làm tốt – nên giữ trong sản phẩm thật

1. **Ngôn ngữ nghiệp vụ gần thực tế Việt Nam** và ghi chú ngay trong giao diện (giờ nhận/trả, hạn khai báo 23:00, thu trực tiếp khi khách OTA gia hạn) – giúp người mới hiểu "vì sao" (H10).
2. **Thẻ "Khách trả phòng hôm nay chưa trả"** đổi trạng thái theo giờ (đã nhắc → gọi điện → quá giờ) – ví dụ tốt của H1 hiển thị trạng thái theo ngữ cảnh.
3. **Trả phòng 3 bước có "← Sửa lại"** trước khi thu tiền (dòng 1449) – phòng ngừa lỗi tốt; nên áp dụng mẫu này cho nhận phòng.
4. **Kiểm trùng lịch báo rõ tên khách và khoảng ngày trùng**, gợi ý căn trống thay thế – thông báo lỗi giúp tự sửa (H9).
5. **Nền a11y đã có**: `:focus-visible`, `aria-current` cho menu, `aria-pressed` cho seg control, `aria-label` cho ô nhập trong bảng, `role="dialog"`/`aria-modal`, `prefers-reduced-motion`, dark mode, safe-area iOS.
6. **Nhận diện OTTIMO** (kem – gỗ sồi, Lora + Be Vietnam Pro) tạo cảm giác boutique, phù hợp kỳ vọng "cực xịn" của INV – giữ, chỉ chỉnh độ tương phản.

---

## 6. Việc tiếp theo

- UXD: dùng mục 3 + mục 4 làm checklist khi viết `design-system.md` (quy tắc a11y) và wireframe L1–L8. UXR sẽ review lại theo đúng các mã HR này ở bước 3 (`rounds/round-01/reviews/UXR-on-UXD.md`).
- PO: các Blocker HR-01, HR-04, HR-06, HR-07 nên có tiêu chí nghiệm thu tương ứng trong backlog (đề xuất, không phải quyết định của UXR).
- QA: dùng bảng mục 3 làm test case a11y cơ bản (bàn phím, tương phản, lang, focus).
- Round 2: UXR chạy "test kịch bản" theo persona trên wireframe/bản build và soạn `real-user-test-guide.md` để INV test với 3–5 người thật.

## 7. Lịch sử thay đổi
| Phiên bản | Ngày | Người | Nội dung |
|---|---|---|---|
| 0.1 | 15/10/2026 | UXR | Bản đầu |
