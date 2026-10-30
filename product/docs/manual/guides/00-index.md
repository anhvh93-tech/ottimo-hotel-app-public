# Bộ hướng dẫn OTTIMO Desk v1.0 theo bộ phận

- Áp dụng cho: **OTTIMO Desk v1.0** (bản `v1.0.0`), chạy thật từ **thứ Hai 02/11/2026**
- Lập: BA · 30/10/2026 · Bản 1.0 · Theo yêu cầu của chủ đầu tư ngày 30/10: thay 5 tờ in bằng bộ hướng dẫn cho từng bộ phận, gồm cách đăng nhập và sử dụng
- Nguồn nội dung: Sổ tay sử dụng OTTIMO Desk v1.0, bản nội dung 1.5 (đã duyệt 30/10). Quy tắc, con số, tên nút và câu nói với khách giữ nguyên.
- **Tài liệu nội bộ OTTIMO – không chụp, không đăng lên mạng.**

## 1. Bộ hướng dẫn gồm gì

| Tệp | Dành cho | Thiết bị, địa chỉ | Nội dung chính |
|---|---|---|---|
| `00-index.md` (tệp này) | Chủ đầu tư, người đào tạo | – | Ai đọc tệp nào, lịch đào tạo |
| `01-chu-dau-tu-quan-ly.md` | Chủ đầu tư (OWN), quản lý (MGR), kế toán/đối soát | Máy riêng · `desk.ottimo.vn` | Đăng nhập 2 bước, cấp tài khoản và máy quầy, duyệt, đối soát, hoàn tiền, giá, tham số, tài khoản nhận VietQR, kế toán |
| `02-le-tan.md` | Lễ tân (FD), lễ tân trưởng (FDL), người trực đêm | Máy quầy đã cấp quyền · `desk.ottimo.vn`; lễ tân trưởng thêm `staff.ottimo.vn` | Báo giá, giữ chỗ, đặt phòng, nhận phòng, giấy tờ và khai báo, thu tiền, trả phòng, kiểm phòng |
| `03-buong-phong.md` | Buồng phòng (HK) | Điện thoại · `staff.ottimo.vn` | Việc dọn, minibar, bộ đồ dùng thêm, báo sự cố, mất mạng |
| `04-bao-tri.md` | Bảo trì, kỹ thuật (MT) | Điện thoại · `staff.ottimo.vn`; Desk khi khóa phòng | Phiếu sửa, khóa phòng, chốt công tơ |
| `05-sale-ctv.md` | Sale nội bộ (SAL), CTV / môi giới | Điện thoại hoặc máy tính · `desk.ottimo.vn` | Báo giá, giữ chỗ, cọc, hoa hồng |
| `screenshot-additions.md` | Đội (QA chụp ảnh) | – | Ảnh còn thiếu cho bộ hướng dẫn |

Mỗi tệp **đọc độc lập được**: người đọc chỉ cần cầm tệp của mình. Mỗi tệp có cùng khung:
1. **Đăng nhập** – viết riêng cho vai đó: địa chỉ đúng, lần đầu, hằng ngày, đăng xuất, quên mật khẩu, mất điện thoại.
2. **Việc mỗi ngày** – danh sách theo giờ.
3. Các thao tác của vai, theo thứ tự công việc thật, kèm tình huống thường gặp và **không được làm**.
4. **Tạm thời tới v1.0.1** – các cách làm tạm cho tới khi chủ đầu tư báo bản v1.0.1 đã lên (dự kiến 04/11).
5. **Bảng giờ** và **Khi có sự cố – gọi ai**.
6. Bài tập đào tạo.

Sổ tay đầy đủ (`product/docs/manual/user-manual-v1.0.md`) vẫn là bản gốc. Khi sổ tay đổi, bộ hướng dẫn đổi theo.

## 2. Ai đọc tệp nào

### 2.1 OTTIMO hiện nay

OTTIMO hiện có **chủ đầu tư** và **một người trực quầy giữ cả 6 vai** (quản lý, lễ tân trưởng, lễ tân, buồng phòng, bảo trì, sale) trên **một tài khoản**.

| Người | Đọc | Ghi chú |
|---|---|---|
| Chủ đầu tư | `01` (toàn bộ); `02` mục 7.2, 10, 17; `00` | Duyệt và chi mọi khoản hoàn người trực tạo; kiểm bảo mật mỗi sáng trước 09:00 |
| Người trực (6 vai) | `02` (chính), `01` (phần quản lý: mục 1, 4, 5, 6, 7, 15), `03`, `04`, `05` | Đăng nhập Desk **2 bước** vì tài khoản có vai quản lý |

Ba điều riêng cho tài khoản 6 vai hiện nay:
- **Đăng nhập 2 bước bắt buộc** (vì có vai quản lý): làm theo `02` mục 1.3 hoặc `01` mục 1.3.
- **Chưa vào được app nhân viên** `staff.ottimo.vn` (tài khoản có 2 bước bị app chặn ở v1.0). Vì vậy:
  - Việc dọn: đánh dấu trên Desk, **Vận hành → Buồng phòng → Làm xong** (`02` mục 13.2).
  - Phiếu sửa: xử lý trên Desk, **Vận hành → Bảo trì** (`04` mục 4.4).
  - **Không ai kiểm phòng được** (`VC` → `VI`). Lễ tân nhận khách vào căn **Đã dọn – chờ kiểm** (`VC`) như thường.
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
| `desk.ottimo.vn` | **OTTIMO Desk** | Chủ đầu tư, quản lý, lễ tân, sale, CTV; bảo trì khi khóa phòng | Máy quầy, laptop; sale/CTV dùng được trên điện thoại |
| `staff.ottimo.vn` | **App nhân viên** | Buồng phòng, bảo trì, lễ tân trưởng (kiểm phòng) | Điện thoại |
| `g.ottimo.vn` | **Trang khách** | Khách của từng đơn | Điện thoại của khách. **Từ 02/11 tới v1.0.1 chưa gửi link cho khách thật** |
| `ottimo.vn` | **Website** | Khách tìm hiểu | Form đặt phòng **đang tắt** |

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
- Bản in trong khung mica trên quầy, mặt quay ra khách (cách chính); hoặc
- Bản trên màn hình máy tính bảng/màn hình ở quầy, quay về phía khách, chỉ hiện tờ thông báo.

Chủ đầu tư đặt tờ ở quầy **tối 01/11 sau buổi đào tạo, muộn nhất 06:00 ngày 02/11**. Nguyên văn tờ: `02-le-tan.md` mục 7.2. Bản in đã dàn trang: `staff-one-pager.md` Tờ 4 và bản in của UXD.

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
- Người trực 6 vai hiện nay: học `02` (3 giờ), rồi `01` phần quản lý, `03`, `04`, `05` (mỗi phần làm bài tập của phần đó).
- Bảng **Xác nhận đã học**: `01` mục 18.2 (chủ đầu tư giữ ở OTTIMO, không gửi đội).

<!-- Desk tập = staging. Không in địa chỉ staging vào bản phát tay (PO thẻ 03). -->

## 6. Ký hiệu trong các tệp

- Chữ **in đậm**: tên nút, tên màn hình, tên ô đúng như trên Desk/app.
- `[ẢNH: Cx-yy-…]`: ảnh đã có trong `product/docs/manual/img/` (cùng mã với sổ tay). `[ẢNH: Gx-yy-…]`: ảnh mới của bộ hướng dẫn, còn chờ chụp (`screenshot-additions.md`).
- Khung **Tạm ở v1.0**: việc Desk chưa làm được và cách làm thay. **Lỗi đang sửa**: lỗi đội đã biết, làm theo cách tạm.
- Con số theo tham số ngày 27/10/2026. Desk khác tệp: làm theo Desk; khác về **tiền** mà không rõ vì sao thì báo ngay (có thể là lỗi "P0").

## 7. Lịch sử

| Bản | Ngày | Người | Thay đổi |
|---|---|---|---|
| 1.0 | 30/10/2026 | BA | Tách sổ tay 1.5 và các tờ in thành 5 tệp theo bộ phận; thêm chương Đăng nhập riêng cho từng vai, việc mỗi ngày theo giờ, phần "Tạm thời tới v1.0.1". Chờ DOM, SEC, UXD xem |
