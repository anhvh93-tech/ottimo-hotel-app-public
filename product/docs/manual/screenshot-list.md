# Danh sách ảnh chụp – Sổ tay sử dụng OTTIMO Desk v1.0

- Đi kèm: `product/docs/manual/user-manual-v1.0.md` (mã ảnh `[ẢNH: Cx-yy-…]`)
- Lập: BA · 27/10/2026 · Người chụp: QA, trên **staging** bản `v1.0.0-rc.3` (`70fe734`) · Người dựng HTML: UXD
- Tổng: 89 ảnh (C0: 11 · C1: 21 · C2: 40 · C3: 9 · C4: 8). C2-19 dùng hai lần (mục 2.10 và 2.13). C0-11 thêm ngày 27/10 (bản 1.2).

## Quy tắc chung khi chụp

1. **Chỉ chụp trên staging** (`desk.staging.ottimo.vn`, `staff.staging.ottimo.vn`, `g.staging.ottimo.vn`), dữ liệu giả. Không chụp production.
2. Tên khách giả dễ đọc, không trùng người thật (ví dụ "Nguyễn Minh An", "Emma Laurent"). SĐT, email giả.
3. **Luôn che** (hộp đặc màu Ink #2B2B28, không làm mờ): mã QR (VietQR, QR đăng ký 2 bước), số tài khoản kể cả 4 số cuối, tên chủ tài khoản, số giấy tờ (CCCD, hộ chiếu, thị thực, số định danh trẻ), ảnh giấy tờ, mã khôi phục, mật khẩu tạm, khóa nhập tay 2 bước, mã cửa, mã chuẩn chi POS, mã giao dịch ngân hàng, mã hồ sơ khai báo, mã tham chiếu lỗi.
4. Không để lộ: thanh địa chỉ có tham số, tab trình duyệt khác, thông báo hệ điều hành, tên Wi-Fi/mật khẩu Wi-Fi thật.
5. Không dùng đơn đội đang kiểm thử (QA giữ danh sách, ví dụ OTM-00239, OTM-00357, OTM-00358). Tạo đơn mới cho ảnh.
6. Không quét mã VietQR trên staging để chuyển tiền.
7. Kích thước: Desk ở khung **1440 × 900** (máy quầy); ảnh ghi "điện thoại" ở **390 × 844**. Giao diện **Sáng**, ngôn ngữ **Tiếng Việt**.
8. Tài khoản: dùng tài khoản thử theo vai của QA (`qa.*`). Vai có 2 bước (chủ đầu tư, quản lý): mã 6 số nhập ngoài khung chụp.
9. Tên tệp: `<mã>.png` (ví dụ `C2-15.png`), lưu `product/docs/manual/img/`. Ảnh nào giao diện khác chữ trong sổ tay: ghi vào cột cuối bảng kết quả gửi BA, không tự sửa sổ tay.

## Chương 0 – Mở đầu

| Mã | Màn hình | Vai đăng nhập | Dữ liệu mẫu cần có | Che / ghi chú |
|---|---|---|---|---|
| C0-01 | Desk – màn **Đăng nhập** | Chưa đăng nhập | – | Ô mật khẩu để trống hoặc dạng chấm |
| C0-02 | Desk – **Đặt mật khẩu của bạn** (lần đầu) | Tài khoản lễ tân mới tạo, mật khẩu tạm | Một tài khoản lễ tân chưa đăng nhập lần nào | Không chụp lúc đang hiện mật khẩu |
| C0-03 | **Bật xác thực 2 bước** – bước mã QR | Tài khoản quản lý thử chưa bật 2 bước | Tài khoản dùng một lần, xóa sau khi chụp | **Che mã QR và khóa nhập tay** |
| C0-04 | **Bật xác thực 2 bước** – 10 mã khôi phục, ô tích **Tôi đã cất…**, nút **Hoàn tất** | Như C0-03 | Như C0-03 | **Che toàn bộ 10 mã** |
| C0-05 | **Nhập mã xác thực** khi đăng nhập | Quản lý thử | – | Ô mã để trống |
| C0-06 | Menu **Tài khoản** mở: **Đổi mật khẩu**, **Xác thực 2 bước**, **Ngôn ngữ giao diện**, **Giao diện**, **Đăng xuất** | Quản lý | – | – |
| C0-07 | Thanh menu bên của Desk, đủ 4 nhóm | Lễ tân | – | – |
| C0-08 | Chip **Máy quầy đã cấp quyền** (máy chưa cấp: ảnh C0-11) | Lễ tân trên máy đã cấp / chưa cấp | Máy staging đã cấp quyền | – |
| C0-11 | Chip **Máy chưa cấp quyền giấy tờ** (góc dưới trái) và menu không có **Giấy tờ & khai báo** | Lễ tân trên máy chưa cấp quyền | – | – (QA chụp 27/10 dưới tên C0-08b, đổi mã thành C0-11 vì bộ dựng chỉ nhận mã dạng Cx-yy) |
| C0-09 | App nhân viên – **Đăng nhập** (điện thoại) | Chưa đăng nhập | – | – |
| C0-10 | Trang khách – trang lưu trú sau khi làm thủ tục trước (điện thoại) | Link khách của một đơn thử | Đơn đã xác nhận, đã check-in online | **Che Wi-Fi**, mã đơn trên URL |

## Chương 1 – Chủ đầu tư và quản lý

| Mã | Màn hình | Vai đăng nhập | Dữ liệu mẫu cần có | Che / ghi chú |
|---|---|---|---|---|
| C1-01 | **Tổng quan**: số liệu đêm nay, **Cần duyệt (n)**, **Cần chú ý (n)** | Chủ đầu tư | ≥ 1 yêu cầu chờ duyệt, ≥ 3 dòng Cần chú ý (khai báo sắp hạn, công nợ, phụ thu chờ xem lại) | – |
| C1-02 | **Danh mục căn** – bảng 10 căn, cột **Giá tháng**, **Giá đêm niêm yết**, **Bán** | Chủ đầu tư | Giá mẫu staging | – |
| C1-03 | Hộp **Sửa căn …**: **Số người**, **Giá niêm yết**, **Hiệu lực từ**, **Lý do đổi giá**, **Đang bán** | Chủ đầu tư | Căn 201 | – |
| C1-04 | Hộp **Sửa căn** khi chọn đúng ngày của giá đã lên lịch (câu "Lưu để giữ giá này từ …") | Chủ đầu tư | Căn có một giá tương lai đã lên lịch | – |
| C1-05 | **Tham số quy tắc** – các nhóm | Chủ đầu tư | – | **Che** khối tài khoản nhận nếu lọt vào khung |
| C1-06 | Hộp **Sửa: …** – **Giá trị mới**, **Hiệu lực từ**, **Lý do**, **Lịch sử thay đổi** | Quản lý | Tham số "Hạn giữ chỗ mặc định" có ≥ 1 dòng lịch sử | – |
| C1-07 | **Người dùng & vai** – danh sách, cột **Thao tác** | Chủ đầu tư | ≥ 5 người dùng giả, đủ vai | Tên đăng nhập giả |
| C1-08 | Hộp **Thêm người dùng** | Chủ đầu tư | – | **Che mật khẩu tạm** |
| C1-09 | **Mật khẩu tạm của …** (hiện một lần) | Chủ đầu tư | – | **Che mật khẩu tạm** |
| C1-10 | **Thiết bị được cấp** – form cấp quyền máy này + bảng thiết bị | Chủ đầu tư | ≥ 1 máy đã cấp | – |
| C1-11 | Khối **Tài khoản nhận chuyển khoản (VietQR)** – **Đang dùng** | Chủ đầu tư | Tài khoản "STAGING KHONG CHUYEN TIEN" | **Che 4 số cuối, tên chủ tài khoản, mã BIN** |
| C1-12 | **Đổi tài khoản nhận** – bước **Kiểm tra trước khi lưu** | Chủ đầu tư | Số giả | **Che số tài khoản, tên, BIN**. Bấm **Hủy** sau khi chụp, không lưu |
| C1-13 | **Cần duyệt** – danh sách có miễn phí và hoàn tiền | Quản lý | 1 FOC chờ duyệt, 1 hoàn tiền chờ duyệt | **Che** số tài khoản nhận hoàn (dạng che vẫn che) |
| C1-14 | Hộp **Duyệt miễn … cho …?** với ô **Mật khẩu đăng nhập** | Quản lý | Như C1-13 | Ô mật khẩu trống |
| C1-15 | **Cần chú ý** – dòng **Đơn …: phụ thu trả muộn bằng giá 1 đêm chờ xem lại**, nút **Mở folio**, **Đã xem** | Quản lý | Đơn đã trả phòng theo đường ESC-031 (căn 203) | – |
| C1-16 | Folio – hộp **Điều chỉnh: …** | Quản lý | Đơn ở C1-15 | – |
| C1-17 | Hộp **Xóa công nợ · …** | Quản lý | Một đơn có công nợ | – |
| C1-18 | **Nhật ký tiền** – tab **Nhật ký thao tác tiền**, lọc một ngày | Chủ đầu tư | ≥ 10 thao tác các loại | **Che** mã giao dịch ngân hàng, mã POS |
| C1-19 | **Nhật ký tiền** – tab **Chờ đối soát** | Chủ đầu tư | ≥ 2 khoản chuyển khoản chờ, 1 khoản tiền mặt sale | **Che** mã giao dịch |
| C1-20 | **Nhật ký tiền** – tab **Hoàn tiền** | Chủ đầu tư | 1 khoản hoàn đã duyệt chưa chi | **Che** số tài khoản, tên chủ tài khoản |
| C1-21 | **Minibar** – danh mục | Quản lý | Danh mục 17 món | Không cần che |

## Chương 2 – Lễ tân

| Mã | Màn hình | Vai đăng nhập | Dữ liệu mẫu cần có | Che / ghi chú |
|---|---|---|---|---|
| C2-01 | **Hôm nay** – đủ các khối | Lễ tân | ≥ 2 khách đến (1 đã làm thủ tục trước), ≥ 2 khách đi (1 có khách đến cùng căn), 1 giữ chỗ chưa cọc, 1 yêu cầu của khách | – |
| C2-02 | **Sơ đồ phòng** – lưới 14 ngày + **Chú giải** | Lễ tân | Đủ trạng thái: giữ chỗ, đã xác nhận, đang ở, dài hạn nhập tay, khóa phòng, 1 đơn OTA chưa gán căn | – |
| C2-03 | **Báo giá & giữ chỗ** – tab **Căn trống** | Lễ tân | Khoảng ngày có cả đêm thứ Sáu | – |
| C2-04 | Hộp **Báo giá** – **Ngôn ngữ gửi khách**, **Sao chép gửi Zalo** | Lễ tân | 3 đêm có 1 đêm thứ Sáu | – |
| C2-05 | **Giữ chỗ** vừa tạo + thẻ VietQR cọc | Lễ tân | Đơn giữ chỗ mới | **Che mã QR, tài khoản nhận**; giữ số tiền và nội dung chuyển khoản |
| C2-06 | Hộp **Xác nhận cọc · …** | Lễ tân | Đơn ở C2-05 | **Che** mã giao dịch |
| C2-07 | **Đặt phòng mới** – kênh **Trực tiếp**, nguồn **Zalo / điện thoại** | Lễ tân | Khách giả có SĐT | SĐT giả |
| C2-08 | **Đặt phòng mới** – kênh **OTA**, **Kênh OTA**, **Mã đặt phòng OTA**, **Thanh toán** | Lễ tân | Mã OTA giả | – |
| C2-09 | **Đơn dài hạn nhập tay** | Lễ tân | 3 tháng, căn 102 | Số hợp đồng giả |
| C2-10 | Khung đơn (đã xác nhận): **Tiến trình đơn** và các nút | Lễ tân | Đơn đã cọc | – |
| C2-11 | **Đổi căn / đổi ngày** – khối **Tính thử trước khi lưu** | Lễ tân | Đơn đã xác nhận, đổi sang căn đắt hơn | – |
| C2-12 | Hộp **Hủy đơn … của …?** – phí hủy, khoản hoàn | Lễ tân | Đơn Trực tiếp đã cọc, đến sau 4 ngày | – |
| C2-13 | Hộp **Đánh dấu … không đến?** | Lễ tân | Đơn đến hôm nay, chụp sau 23:00 hoặc dùng bản chụp đã có từ QA ca đêm | – |
| C2-14 | Hộp **Link check-in online · đơn …** | Lễ tân | Đơn đã xác nhận | **Che toàn bộ link** |
| C2-15 | **Nhận phòng** – **Điều kiện nhận phòng** + bước **Giấy tờ** | Lễ tân, máy đã cấp quyền | Đơn khách nước ngoài 2 người, 1 giấy tờ đã gửi qua link | **Che số giấy tờ, ảnh giấy tờ** |
| C2-16 | Nhận phòng – bước **Kiểm tra** (có 1 dòng **Chưa kiểm được**) | Như C2-15 | Hộ chiếu nhập tay thiếu ngày nhập cảnh | **Che** số giấy tờ |
| C2-17 | Nhận phòng – bước **Khai báo** (hạn khai báo) | Như C2-15 | – | – |
| C2-18 | Nhận phòng – **Giờ nhận & phụ thu**, bật **Khách nhận sớm**, giờ 11:00 → phụ thu 30 % | Như C2-15 | Đơn Trực tiếp | – |
| C2-19 | Nhận phòng – **Thu tiền trước khi giao mã** (VietQR đang chờ hoặc tiền mặt) | Như C2-15 | Đơn còn phải thu | **Che mã QR, tài khoản nhận** |
| C2-20 | Nhận phòng – mã cửa, **Số thẻ phòng đã giao**, tích nội quy, khối **Khi bấm Nhận phòng**, nút **Nhận phòng căn …** | Như C2-15 | – | Không nhập mã cửa thật |
| C2-21 | **Giấy tờ & khai báo** – tab **Cần xử lý** | Lễ tân, máy đã cấp | ≥ 3 hồ sơ: 1 công dân VN, 1 người nước ngoài, 1 quá hạn | **Che** số giấy tờ (nếu hiện) |
| C2-22 | Màn khai báo – 3 khối (đối chiếu/đồng ý, sao chép lên cổng, ghi kết quả) | Như C2-21 | Hồ sơ đủ giấy tờ | **Che toàn bộ cột Giá trị**, mã hồ sơ |
| C2-23 | Hộp **Thêm phát sinh** – danh sách **Khoản** mở | Lễ tân | Đơn đang ở | – |
| C2-24 | **Thêm người đi cùng** – phụ thu người vượt định mức | Lễ tân | Đơn studio 2 người, thêm 1 người lớn | – |
| C2-25 | Hộp **Gia hạn · Căn … · …** | Lễ tân | Đơn đang ở, còn 2 đêm trống sau | – |
| C2-26 | Hộp **Đổi phòng · Căn … · …** | Lễ tân | Đơn đang ở, có căn VI cùng nhóm | – |
| C2-27 | Hộp **Trả muộn · Căn … · …** – phụ thu đề xuất | Lễ tân | Đơn đi hôm nay | – |
| C2-28 | Hộp **Xác nhận giờ trả** | Lễ tân | Đơn đi hôm nay | – |
| C2-29 | Khối **Yêu cầu của khách** trên **Hôm nay** | Lễ tân | 1 yêu cầu "Khăn, đồ dùng", 1 "Báo hỏng" | Lời nhắn giả, không số |
| C2-30 | Hộp **Miễn phí · …** – loại, số tiền, lý do, **Gửi duyệt** | Lễ tân | Dòng phụ thu nhận sớm | – |
| C2-31 | Trả phòng – bước **Minibar** | Lễ tân | Đơn đi hôm nay | – |
| C2-32 | Trả phòng – bước **Phụ phí**, phụ thu trả muộn 30 % | Lễ tân | Giờ trả 13:30 | – |
| C2-33 | Trả phòng – bước **Bill & thu tiền** | Lễ tân | Còn phải thu > 0 | **Che** mã POS / mã giao dịch |
| C2-34 | Trả phòng – **Trả sau mốc trả muộn** + **Ghi phụ thu – quản lý xem lại**, ô **Lý do** | Lễ tân (staging có 2 bước bật) | Căn 203, giờ trả sau 18:00, đêm đó căn đã có đơn đến | – |
| C2-35 | **Phiếu thanh toán** – **Ngôn ngữ phiếu**, **In phiếu** | Lễ tân | Đơn đã trả phòng | **Che** MST nếu là số thật; dùng MST giả |
| C2-36 | Bước 3 – **Khách lấy hóa đơn công ty** bật | Lễ tân | Công ty giả, MST giả | – |
| C2-37 | Hộp **Thu công nợ · …** | Lễ tân | Đơn có công nợ | – |
| C2-38 | **Nhật ký tiền → Hoàn tiền** – **Chi hoàn tiền mặt** | Lễ tân (không phải người tạo yêu cầu) | Khoản hoàn tiền mặt đã duyệt | – |
| C2-39 | **Yêu cầu từ website** – thông báo **Form đặt phòng trên website đang tắt** | Lễ tân | Form tắt (mặc định) | – |
| C2-40 | **Buồng phòng** trên Desk – hộp **Tạo việc buồng phòng** | Lễ tân trưởng | Có việc trong ngày | – |

## Chương 3 – Buồng phòng (điện thoại 390 × 844)

| Mã | Màn hình | Vai đăng nhập | Dữ liệu mẫu cần có | Che / ghi chú |
|---|---|---|---|---|
| C3-01 | **Việc của tôi** – các nhóm việc | Buồng phòng | ≥ 1 việc mỗi nhóm: Làm trước, Khách đang ở, Sau khi khách trả phòng; 1 việc **Chờ khách trả phòng** | – |
| C3-02 | Màn **Căn …** – **Bắt đầu dọn** / **Dọn xong** | Buồng phòng | Căn VD | – |
| C3-03 | **Khách không muốn dọn hôm nay?** | Buồng phòng | Căn có khách | – |
| C3-04 | **Các căn** – thanh lọc | Buồng phòng | Đủ trạng thái | Tên khách chỉ tên gọi |
| C3-05 | **Kiểm phòng …** – danh mục, **Kiểm đạt – sẵn sàng** | Lễ tân trưởng trên app nhân viên | Căn VC | – |
| C3-06 | **Báo sự cố** – loại, mô tả, ảnh, mức độ, đề nghị khóa | Buồng phòng | – | Ảnh chụp đồ vật, không người |
| C3-07 | **Thao tác trên máy** – có thao tác chờ gửi | Buồng phòng | Bật chế độ máy bay khi bấm 1 việc | – |
| C3-08 | **Thông báo** | Buồng phòng | ≥ 3 thông báo | – |
| C3-09 | **Tôi** – ngôn ngữ, **Đăng xuất** | Buồng phòng | – | – |

## Chương 4 – Bảo trì, sale

| Mã | Màn hình | Vai đăng nhập | Dữ liệu mẫu cần có | Che / ghi chú |
|---|---|---|---|---|
| C4-01 | **Phiếu sửa** trên app – bộ lọc, hạn | Bảo trì (điện thoại) | 1 phiếu Gấp, 1 Trong ngày, 1 Chờ vật tư | – |
| C4-02 | Chi tiết phiếu – **Nhận việc**, hộp **Chờ vật tư** | Bảo trì | Phiếu mới | – |
| C4-03 | Hộp **Sửa xong …** – **Đã làm gì?**, **Ảnh sau khi sửa**, hiệu ứng khi xác nhận | Bảo trì | Phiếu có khóa phòng | – |
| C4-04 | Desk **Bảo trì** – tab **Khóa phòng** | Lễ tân | 1 khóa đang hiệu lực, 1 sắp khóa | – |
| C4-05 | Desk – **Phiếu sửa mới** với **Khóa căn – không bán đến khi sửa xong** | Lễ tân | Căn trống | – |
| C4-06 | **Báo giá & giữ chỗ** trên điện thoại – báo giá có dòng hoa hồng | CTV (điện thoại) | – | – |
| C4-07 | Hộp **Báo đã chuyển cọc** – số tiền, ảnh biên nhận | CTV | Đơn giữ chỗ của CTV | Ảnh biên nhận giả, **che số tài khoản** trên ảnh |
| C4-08 | **Đơn của tôi** / khung đơn – **Hoa hồng dự kiến của bạn** | Sale nội bộ | Đơn sale chốt | – |
