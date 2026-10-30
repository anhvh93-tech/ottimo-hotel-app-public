# Bộ hướng dẫn OTTIMO Desk v1.0 theo bộ phận

- Áp dụng cho: **OTTIMO Desk v1.0** (bản `v1.0.0`), chạy thật từ **thứ Hai 02/11/2026**
- Lập: BA · 30/10/2026 · Bản 1.2 (bản 1.1 sửa theo review DOM, SEC, UXD, QA ngày 30/10; bản 1.2 thêm phòng Google Chat và xóa theo yêu cầu người gửi theo SEC, ESC-041, ESC-042) · Theo yêu cầu của chủ đầu tư ngày 30/10: thay 5 tờ in bằng bộ hướng dẫn cho từng bộ phận, gồm cách đăng nhập và sử dụng
- Nguồn nội dung: Sổ tay sử dụng OTTIMO Desk v1.0, bản nội dung 1.5 (đã duyệt 30/10). Quy tắc, con số, tên nút và câu nói với khách giữ nguyên.
- **Tài liệu nội bộ OTTIMO – không chuyển tiếp cho người ngoài OTTIMO, không chụp, không đăng lên mạng.**

## 1. Bộ hướng dẫn gồm gì

| Tệp | Dành cho | Thiết bị, địa chỉ | Nội dung chính |
|---|---|---|---|
| `00-index.md` (tệp này) | Chủ đầu tư, người đào tạo | – | Ai đọc tệp nào, lịch đào tạo |
| `01-chu-dau-tu-quan-ly.md` | Chủ đầu tư (OWN), quản lý (MGR), kế toán/đối soát | Máy riêng · `desk.ottimo.vn` | Đăng nhập 2 bước, cấp tài khoản và máy quầy, duyệt, đối soát, hoàn tiền, giá, tham số, tài khoản nhận VietQR, kế toán; phòng Google Chat (cài đặt, xóa tin theo yêu cầu người gửi), phòng Báo động |
| `02-le-tan.md` | Lễ tân (FD), lễ tân trưởng (FDL), người trực đêm | Máy quầy đã cấp quyền · `desk.ottimo.vn`; lễ tân trưởng thêm `staff.ottimo.vn`; điện thoại có Google Chat (từ v1.0.1) | Báo giá, giữ chỗ, đặt phòng, nhận phòng, giấy tờ và khai báo, thu tiền, trả phòng, kiểm phòng; yêu cầu từ website, tin Google Chat, xóa theo yêu cầu người gửi |
| `03-buong-phong.md` | Buồng phòng (HK) | Điện thoại · `staff.ottimo.vn` | Việc dọn, minibar, bộ đồ dùng thêm, báo sự cố, mất mạng |
| `04-bao-tri.md` | Bảo trì, kỹ thuật (MT) | Điện thoại · `staff.ottimo.vn`; Desk để xem phiếu | Phiếu sửa, báo khóa phòng, chốt công tơ |
| `05-sale-ctv.md` | Sale nội bộ (SAL), CTV / môi giới | Điện thoại hoặc máy tính · `desk.ottimo.vn` | Báo giá, giữ chỗ, cọc, hoa hồng |
| `screenshot-additions.md` | Đội (QA chụp ảnh) | – | Ảnh còn thiếu cho bộ hướng dẫn |

Mỗi tệp **đọc độc lập được**: người đọc chỉ cần cầm tệp của mình. Mỗi tệp có cùng khung:
1. **Đăng nhập** – viết riêng cho vai đó: địa chỉ đúng, lần đầu, hằng ngày, đăng xuất, quên mật khẩu, mất điện thoại.
2. **Việc mỗi ngày** – danh sách theo giờ.
3. Các thao tác của vai, theo thứ tự công việc thật, kèm tình huống thường gặp và **không được làm**.
4. **Tạm thời tới v1.0.1** – các cách làm tạm cho tới khi chủ đầu tư báo bản v1.0.1 đã lên (dự kiến 04/11).
5. **Bảng giờ** và **Khi có sự cố – gọi ai**.
6. Bài tập đào tạo.

Sổ tay đầy đủ (`product/docs/manual/user-manual-v1.0.md`) vẫn là bản gốc. Khi sổ tay đổi, bộ hướng dẫn đổi theo. Bộ hướng dẫn bản 1.1 có thêm các điểm DOM, SEC, QA chốt ngày 30/10 mà sổ tay 1.5 chưa có (ví dụ `02` mục 13.2a, bảng việc mỗi ngày, khôi phục tài khoản): khi hai bên khác nhau, làm theo bộ hướng dẫn.

## 2. Ai đọc tệp nào

### 2.1 OTTIMO hiện nay

OTTIMO hiện có **chủ đầu tư** và **một người trực quầy giữ cả 6 vai** (quản lý, lễ tân trưởng, lễ tân, buồng phòng, bảo trì, sale) trên **một tài khoản**.

| Người | Đọc | Ghi chú |
|---|---|---|
| Chủ đầu tư | `01` (toàn bộ); `02` mục 7.2, 10, 17; `00` | Duyệt và chi mọi khoản hoàn người trực tạo; kiểm bảo mật mỗi sáng trước 09:00 |
| Người trực (6 vai) | `02` (chính), các phần của `01`, `03`, `04`, `05` theo lộ trình ở mục 5 | Đăng nhập Desk **2 bước** vì tài khoản có vai quản lý. Lần đăng nhập đầu làm trên laptop riêng, không trên máy quầy (`02` mục 1.2) |

Ba điều riêng cho tài khoản 6 vai hiện nay:
- **Đăng nhập 2 bước bắt buộc** (vì có vai quản lý): làm theo `02` mục 1.3 hoặc `01` mục 1.3.
- **Chưa vào được app nhân viên** `staff.ottimo.vn` (tài khoản có 2 bước bị app chặn ở v1.0). Vì vậy:
  - Việc dọn: đánh dấu trên Desk, **Vận hành → Buồng phòng → Làm xong** (`02` mục 13.2).
  - Phiếu sửa: xử lý trên Desk, **Vận hành → Bảo trì** (`04` mục 4.4).
  - **Không ai bấm kiểm phòng được** (`VC` → `VI`). Người trực tự đi kiểm căn theo 12 mục rồi mới bấm **Làm xong** (`02` mục 13.2a). Lễ tân nhận khách vào căn `VC` như thường.
- **Hoàn tiền**: người trực tạo yêu cầu và nhập nơi nhận; **chủ đầu tư duyệt và chi** (Desk không cho người tạo tự duyệt, tự chi).

### 2.2 Khi có nhân viên riêng

Mỗi người **một tài khoản, đúng vai của mình**, và đọc tệp của vai mình.

| Vai trên Desk | Tệp chính | Đọc thêm |
|---|---|---|
| Chủ đầu tư | `01` | `00` |
| Quản lý | `01` | `02` mục 7, 10, 11, 17 |
| Lễ tân trưởng | `02` (gồm mục 14 việc riêng) | `03` mục 3 (trạng thái phòng) |
| Lễ tân, người trực đêm | `02` | – |
| Buồng phòng | `03` | – |
| Bảo trì | `04` | `03` mục 9 (báo sự cố) |
| Sale nội bộ | `05` | – |
| CTV / môi giới | `05` | – |
| Kế toán (chưa có tài khoản ở v1.0) | `01` mục 8, 11 | Làm cùng chủ đầu tư |

## 3. Địa chỉ đăng nhập

| Địa chỉ | Tên | Ai dùng | Thiết bị |
|---|---|---|---|
| `desk.ottimo.vn` | **OTTIMO Desk** | Chủ đầu tư, quản lý, lễ tân, sale, CTV; buồng phòng, bảo trì lần đầu đổi mật khẩu tạm | Máy quầy, laptop; sale/CTV dùng được trên điện thoại |
| `staff.ottimo.vn` | **App nhân viên** | Buồng phòng, bảo trì, lễ tân trưởng (kiểm phòng) | Điện thoại |
| `g.ottimo.vn` | **Trang khách** | Khách của từng đơn | Điện thoại của khách. **Từ 02/11 tới v1.0.1 chưa gửi link cho khách thật** |
| `ottimo.vn` | **Website** | Khách tìm hiểu | Form đặt phòng **đã bật từ chiều 30/10**. Desk mở trên máy quầy và điện thoại người trực 07:00–22:00 (`02` mục 13.1) |

**Phòng Google Chat** (tài khoản `@ottimo.vn`, trên điện thoại, không mở trên máy quầy):

| Phòng | Ai ở trong phòng | Từ khi nào | Ở đâu trong bộ hướng dẫn |
|---|---|---|---|
| **"OTTIMO – Yêu cầu đặt phòng"** | Chủ đầu tư, quản lý (hai người này là quản lý phòng), lễ tân trưởng, lễ tân. Không sale, CTV, buồng phòng, bảo trì | **v1.0.1** (dự kiến khoảng 04/11/2026): tin có chi tiết khách. Trước đó chưa có tin, người trực giữ Desk mở 07:00–22:00 | `02` mục 13.1a, 13.1b; `01` mục 12.1, 12.2 |
| **"OTTIMO – Báo động"** | Chỉ chủ đầu tư | Đang chạy | `01` mục 17.1 |

Luật chung cho mọi người:
- **Mỗi người một tài khoản.** Không dùng chung, không đọc mật khẩu qua điện thoại, không gõ mật khẩu cho người khác.
- Chỉ vào bằng cách **gõ địa chỉ** hoặc dấu trang. Không bấm link đăng nhập gửi qua Zalo, email, tin nhắn.
- Trình duyệt hỏi **Lưu mật khẩu?**: **Không bao giờ**.
- Mật khẩu tạm do chủ đầu tư **đưa tận tay**. Không có nút "quên mật khẩu": quên thì báo chủ đầu tư.
- **Không ai** hỏi mật khẩu, mã 6 số hay mã khôi phục của người khác. Ai hỏi thì không đưa và báo chủ đầu tư.
- Rời máy thì **đăng xuất**.
- **Trước 02/11**: trên Desk thật chỉ đăng nhập, đổi mật khẩu tạm (quản lý: bật 2 bước), đăng xuất. Tập thao tác trên **Desk tập**.

## 4. Tờ "Your ID details" vẫn phải có ở quầy

Bộ hướng dẫn này thay **các tờ in cho nhân viên** (Tờ 1 Quầy lễ tân, Tờ 2a Tạm tới v1.0.1, Tờ 2b Khách ở quá 18:00, Tờ 3 Buồng phòng). Nội dung các tờ đó nằm trong `02` và `03`.

Riêng **Tờ 4 "Your ID details"** **không phải** hướng dẫn cho nhân viên. Đây là **thông báo cho khách** về cách OTTIMO dùng thông tin giấy tờ, điều kiện bảo mật bắt buộc từ ngày D. Lễ tân **phải cho khách xem tờ này trước khi nhận giấy tờ**:
- **Bản in khổ A4** trong khung mica trên quầy, mặt quay ra khách (cách chính, chủ đầu tư quyết 30/10).
- Bản in dự phòng trong ngăn quầy; máy tính bảng của cơ sở chỉ khi chưa thay được bản in và máy đạt đủ điều kiện ở `02` mục 7.2.

Chủ đầu tư in **2 bản A4** (một trong khung mica, một trong ngăn quầy) và đặt ở quầy **tối 01/11 sau buổi đào tạo, muộn nhất 06:00 ngày 02/11**. Nguyên văn tờ: `02-le-tan.md` mục 7.2. Bản in A4: `product/docs/print/pdf/to-4-your-id-details-a4.pdf`. Bản cho máy tính bảng: `guides/html/your-id-details-tablet.html` (chỉ chép riêng tệp này lên máy tính bảng, không chép cả bộ hướng dẫn).

## 5. Đào tạo

| Bộ phận | Tệp | Thời lượng | Bài tập |
|---|---|---|---|
| Chủ đầu tư, quản lý | `01` | 2 giờ | `01` mục 18.2 |
| Lễ tân, lễ tân trưởng | `02` | 3 giờ | `02` mục 20.3 |
| Buồng phòng | `03` | 1 giờ | `03` mục 15 |
| Bảo trì | `04` | 45 phút | `04` mục 12 |
| Sale, CTV | `05` | 45 phút | `05` mục 11 |
| Kế toán | `01` mục 8, 11 | 1 giờ | `01` mục 18.2 |

- Tập trên **Desk tập** (dữ liệu giả) bằng **tài khoản tập** đội tạo sẵn cho từng người. Địa chỉ và tài khoản tập: chủ đầu tư đưa tận tay trong buổi đào tạo. Mật khẩu tập **khác** mật khẩu thật.
- **Người trực 6 vai hiện nay** (khoảng 5 giờ, chia 31/10 và 01/11):
  - `02` toàn bộ (3 giờ, bài tập mục 20.3).
  - `01` mục 1.3–1.7, 2, 4, 5, 6, 7, 8.3–8.5, 12.1–12.2 (người trực là quản lý phòng Google Chat), 15 (1 giờ).
  - `03` mục 3, 4 (giờ cần xong), 7, 8, 11.2.
  - `04` mục 3, 4.2, 4.4, 5, 8.2.
  - `05` mục 3 (chính sách hủy), 4.2, 5.1, 8 (tổng 03–05 khoảng 1 giờ).
  - Bỏ phần đăng nhập và mất mạng của app nhân viên.
  - Bài tập thêm trên Desk tập: dọn và kiểm một căn rồi bấm **Làm xong** (`02` mục 13.2a); hủy một việc dọn với lý do **Khách nói không cần dọn**; tạo, nhận và đóng một phiếu sửa trên Desk.
- Gửi bộ hướng dẫn: chủ đầu tư gửi **riêng từng người** (không gửi nhóm), mỗi người **đúng tệp của vai mình**. CTV chỉ nhận `05`. Tệp `01` chỉ cho chủ đầu tư và người giữ vai quản lý. Người trực 6 vai nhận `01`–`05`. Ai hết hợp tác: **Khóa tài khoản** là việc chính; tệp không thu hồi được.
- Bảng **Xác nhận đã học**: `01` mục 18.2 (chủ đầu tư giữ ở OTTIMO, không gửi đội).

<!-- Desk tập = staging. Không in địa chỉ staging vào bản phát tay (PO thẻ 03). -->

## 6. Ký hiệu trong các tệp

- Chữ **in đậm**: tên nút, tên màn hình, tên ô đúng như trên Desk/app.
- `[ẢNH: Cx-yy-…]`: ảnh đã có trong `product/docs/manual/img/` (cùng mã với sổ tay). `[ẢNH: Gx-yy-…]`: ảnh mới của bộ hướng dẫn (`screenshot-additions.md`).
- Người đọc bản HTML: ảnh màn hình có mã ở dưới ảnh (ví dụ C2-05). Khung nét đứt ghi **Chưa có ảnh** hoặc **Ảnh mới · chờ chụp** là ảnh đang chờ chụp: cứ làm theo chữ.
- Khung **Tạm ở v1.0**: việc Desk chưa làm được và cách làm thay. **Lỗi đang sửa**: lỗi đội đã biết, làm theo cách tạm.
- Con số theo tham số ngày 27/10/2026. Desk khác tệp: làm theo Desk; khác về **tiền** mà không rõ vì sao thì báo ngay (có thể là lỗi "P0").

## 7. Lịch sử

| Bản | Ngày | Người | Thay đổi |
|---|---|---|---|
| 1.0 | 30/10/2026 | BA | Tách sổ tay 1.5 và các tờ in thành 5 tệp theo bộ phận; thêm chương Đăng nhập riêng cho từng vai, việc mỗi ngày theo giờ, phần "Tạm thời tới v1.0.1". Chờ DOM, SEC, UXD xem |
| 1.1 | 30/10/2026 | BA | Sửa theo DOM (16 thẻ), SEC (9 thẻ), UXD (B1–B6), QA (mục 22.6, BUG-R3-052/053): kiểm bằng mắt trước **Làm xong** (`02` 13.2a); bảng việc mỗi ngày theo đúng trình tự (đóng quầy 21:00, việc 22:00, 23:00); rà mốc 3 gồm giữ chỗ hết hạn trong đêm; nhận phòng ban đêm đủ bước; tờ Your ID details A4, 2 bản, máy tính bảng chỉ dự phòng có điều kiện; khôi phục tài khoản (chủ đầu tư quên mật khẩu chưa có đường khôi phục; người trực mất cả điện thoại lẫn mã: tài khoản mới); sale/CTV hủy và gửi mã cọc; form website dự kiến bật 31/10; lộ trình người trực ~5 giờ; tên nút theo giao diện thật |
| 1.2 | 30/10/2026 | BA | Theo SEC (ESC-041 Lượt 2, mục L2.2, ★4, ★7), ESC-041 = C, ESC-042 = B: phòng Google Chat **"OTTIMO – Yêu cầu đặt phòng"** áp dụng **từ v1.0.1** (dự kiến khoảng 04/11), khi tin bắt đầu có chi tiết khách; trước đó người trực giữ Desk mở 07:00–22:00. `02` mục 13.1a (tin Chat, cách dùng, nhận biết tin thật, cài đặt điện thoại: khóa màn hình, ẩn nội dung trên màn hình khóa iPhone/Android, tắt email thông báo Chat; chỉ tài khoản @ottimo.vn có xác minh 2 bước, không mời sale/CTV), 13.1b (xóa theo yêu cầu người gửi trên Desk + 5 bước xóa tin Chat trong 24 giờ, sổ xóa Chat chỉ ghi mã). `01` mục 12.1 (cài đặt phòng, quản lý phòng là chủ đầu tư và quản lý, rà thành viên mỗi tháng, xóa cả phòng mỗi năm), 12.2 (5 bước WR8), 17.1 (phòng **"OTTIMO – Báo động"**: tin FAIL/OK, email Healthchecks.io và UptimeRobot, làm gì khi nhận FAIL). Form website ghi đã bật 30/10 (`00`, `01`, `02`, `05`). `05` thêm: sale không ở trong phòng Chat. `03`, `04` không đổi (vẫn ghi bản 1.1) |
