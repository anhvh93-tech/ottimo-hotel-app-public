# Ảnh bổ sung – Bộ hướng dẫn OTTIMO Desk v1.0 theo bộ phận

- Đi kèm: `product/docs/manual/guides/0*.md` (mã ảnh `[ẢNH: Gx-yy-…]`; x = số tệp hướng dẫn: 1 chủ đầu tư/quản lý, 2 lễ tân, 3 buồng phòng, 4 bảo trì, 5 sale/CTV)
- Lập: BA · 30/10/2026 · Người chụp: QA, trên **staging** bản `v1.0.0` (`8b3aec8`) · Người dựng: UXD
- Tổng: **19 ảnh mới** (G1: 6 · G2: 7 · G3: 2 · G4: 2 · G5: 2) + **2 ảnh cũ còn thiếu** (C1-15, C2-34).
- Ảnh dùng lại: 86 tệp có sẵn trong `product/docs/manual/img/` (mã `Cx-yy`, giữ nguyên mã). Không dùng: C0-10 (trang khách sau check-in online – check-in online đang tạm dừng tới v1.0.1).

## Quy tắc chụp

Theo đúng `product/docs/manual/screenshot-list.md` mục "Quy tắc chung khi chụp", tóm tắt:
1. **Chỉ chụp trên staging** (`desk.staging.ottimo.vn`, `staff.staging.ottimo.vn`), dữ liệu giả. Không chụp production.
2. Tên khách giả dễ đọc, không trùng người thật. SĐT, email giả.
3. **Luôn che** bằng hộp đặc màu Ink #2B2B28 (không làm mờ): mã QR, số tài khoản kể cả 4 số cuối, tên chủ tài khoản, số giấy tờ, ảnh giấy tờ, mã khôi phục, mật khẩu tạm, khóa nhập tay 2 bước, mã cửa, mã chuẩn chi POS, mã giao dịch ngân hàng, mã hồ sơ khai báo, mã tham chiếu lỗi.
4. Không để lộ thanh địa chỉ có tham số, tab khác, thông báo hệ điều hành, tên/mật khẩu Wi-Fi thật.
5. Không dùng đơn đội đang kiểm thử. Tạo đơn mới cho ảnh. Không quét VietQR trên staging để chuyển tiền.
6. Desk khung **1440 × 900**; ảnh "điện thoại" **390 × 844**. Giao diện **Sáng**, **Tiếng Việt**.
7. Tài khoản thử theo vai của QA (`qa.*`). Vai có 2 bước: mã 6 số nhập ngoài khung chụp.
8. Tên tệp `<mã>.png` (ví dụ `G2-05.png`), lưu `product/docs/manual/img/`. Chỉ commit sau khi QA kiểm che. Giao diện khác chữ trong hướng dẫn: ghi vào bảng kết quả gửi BA, không tự sửa hướng dẫn.

## Ảnh mới

### G1 – Chủ đầu tư, quản lý (`01-chu-dau-tu-quan-ly.md`)

| Mã | Mục | Màn hình | Vai đăng nhập | Dữ liệu mẫu cần có | Che / ghi chú |
|---|---|---|---|---|---|
| G1-01 | 1.4 | Menu **tên của mình → Xác thực 2 bước**: trạng thái **Đang bật từ …**, **Còn … mã khôi phục**, nút **Tạo bộ mã mới** | Quản lý thử | Tài khoản đã bật 2 bước | Không bấm **Tạo bộ mã mới** trên tài khoản dùng chung; nếu bấm thì **che toàn bộ 10 mã** |
| G1-02 | 1.7 | Màn **Dùng mã khôi phục** (sau khi bấm **Mất điện thoại? Dùng mã khôi phục**): ô **Mã khôi phục (16 ký tự)**, nút **Đăng nhập bằng mã khôi phục** | Quản lý thử dùng một lần | Tài khoản dùng một lần, xóa sau khi chụp | Ô mã để trống |
| G1-03 | 1.7 | **Đăng ký lại trên điện thoại mới** | Như G1-02 (sau khi dùng 1 mã khôi phục) | Như G1-02 | **Che mã QR và khóa nhập tay** |
| G1-04 | 1.9 | Hộp **Khóa tài khoản** với ô **Mật khẩu đăng nhập**, **Mã trong ứng dụng xác thực (6 số)** | Chủ đầu tư | Người dùng giả vai Buồng phòng | Ô trống. Bấm hủy, không khóa người dùng của QA |
| G1-05 | 1.9 | Hộp **Đặt lại mật khẩu** (xác nhận) | Chủ đầu tư | Người dùng giả | **Che mật khẩu tạm** nếu hiện. Dùng người dùng giả tạo riêng |
| G1-06 | 6 | Trả phòng bước **Bill & thu tiền**: bật **Ghi công nợ – khách trả sau**, **Hạn thanh toán**, **Lý do ghi công nợ**, nút **Ghi công nợ … – hoàn tất** | Quản lý | Đơn đi hôm nay, còn phải thu > 0 | Không bấm hoàn tất nếu đơn dùng chung; **che** mã giao dịch |

### G2 – Lễ tân (`02-le-tan.md`)

| Mã | Mục | Màn hình | Vai đăng nhập | Dữ liệu mẫu cần có | Che / ghi chú |
|---|---|---|---|---|---|
| G2-01 | 1.4 | Desk báo "Bạn đã thử quá nhiều lần. Chờ … phút rồi thử lại." ở màn **Đăng nhập** | Tài khoản lễ tân thử | Gõ sai mật khẩu tới khi bị chặn (tài khoản dùng riêng cho ảnh) | Tên đăng nhập giả |
| G2-02 | 1.6 | Hộp **Đổi mật khẩu** (từ menu tên của mình) | Lễ tân | – | Ô mật khẩu trống hoặc dạng chấm |
| G2-03 | 7.2 | **Ảnh chụp tờ in** "Your ID details" trong khung mica trên quầy, mặt quay ra khách (không phải ảnh màn hình) | – | Bản in thật của UXD (A5 dọc) | Không có người, không có giấy tờ, không có màn hình Desk trong khung |
| G2-04 | 12.2 | **Nhật ký tiền → Hoàn tiền** → hộp **Nhập nơi nhận hoàn**: **Cách hoàn** (chọn sẵn **Tiền mặt**), nút **Cùng cách khách đã trả**, **Lưu** | Lễ tân, **máy đã cấp quyền** | Một yêu cầu hoàn chờ nơi nhận (hủy giữ chỗ có cọc) | **Che** số tài khoản, tên chủ tài khoản, mã ngân hàng nếu nhập |
| G2-05 | 17.1 | **Đơn đặt phòng**, lọc **Đang hiệu lực**, có ≥ 2 dòng **Giữ chỗ · chờ cọc** (1 còn hạn, 1 quá hạn) | Lễ tân | Giữ chỗ có yêu cầu FOC đã quá hạn (không tự hủy) + 1 giữ chỗ có cọc thiếu đã quá hạn | – |
| G2-06 | 17.1 | Khung đơn giữ chỗ **có cọc** đã quá hạn: đồng hồ **còn 0 giờ 00 phút** đỏ, dòng "Giữ chỗ đã hết hạn lúc … – đơn đã tự hủy" trong khi trạng thái vẫn **Giữ chỗ · chờ cọc** | Lễ tân | Như G2-05 | Mục đích ảnh: cho thấy chữ sai cạnh trạng thái đúng. **Che** mã giao dịch |
| G2-07 | 17.2 | Hộp **Hủy giữ chỗ căn …?**, danh sách **Lý do hủy** mở | Lễ tân | Giữ chỗ chưa cọc | Không bấm **Hủy giữ chỗ** nếu đơn dùng cho G2-05 |

### G3 – Buồng phòng (`03-buong-phong.md`)

| Mã | Mục | Màn hình | Vai đăng nhập | Dữ liệu mẫu cần có | Che / ghi chú |
|---|---|---|---|---|---|
| G3-01 | 1.2 bước A | Desk ngay sau **Lưu và vào ứng dụng** với tài khoản **chỉ có vai Buồng phòng** (khung 1440 hoặc điện thoại 390) | Tài khoản buồng phòng mới, mật khẩu tạm | Tài khoản dùng một lần | Chụp cùng lúc QA kiểm câu hỏi Q2 (báo cáo BA). Màn khác chữ "Bạn không có quyền mở trang này": ghi lại chữ thật gửi BA |
| G3-02 | 1.2 bước B | Điện thoại: hộp **Thêm vào Màn hình chính** của trình duyệt khi đang mở `staff.staging.ottimo.vn` | Buồng phòng | – | Che thanh địa chỉ nếu có tham số; không lộ thông báo hệ điều hành |

### G4 – Bảo trì (`04-bao-tri.md`)

| Mã | Mục | Màn hình | Vai đăng nhập | Dữ liệu mẫu cần có | Che / ghi chú |
|---|---|---|---|---|---|
| G4-01 | 1.3 | Desk của tài khoản **chỉ có vai Bảo trì**: thanh menu và trang **Bảo trì** | Bảo trì (Desk) | ≥ 1 phiếu đang mở | Ghi lại menu thật nếu khác chữ hướng dẫn |
| G4-02 | 4.4 | Desk **Vận hành → Bảo trì** → khung một phiếu: nút **Nhận việc**, **Sửa xong**, hộp **Sửa xong WO-…** với **Đã làm gì?**, **Ảnh sau khi sửa** | Quản lý (tài khoản có 2 bước, đúng như người trực) | Phiếu Trong ngày, có khóa phòng | Ảnh đồ vật, không người. Ghi lại tên nút thật (câu Q3) |

### G5 – Sale, CTV (`05-sale-ctv.md`)

| Mã | Mục | Màn hình | Vai đăng nhập | Dữ liệu mẫu cần có | Che / ghi chú |
|---|---|---|---|---|---|
| G5-01 | 1.2 | Desk **Đăng nhập** trên điện thoại 390 × 844 | Chưa đăng nhập | – | Ô mật khẩu trống |
| G5-02 | 6.2 | **Khách của tôi** trên điện thoại | CTV | ≥ 2 khách giả của CTV | SĐT giả |

## Ảnh cũ còn thiếu (giữ mã cũ)

| Mã | Dùng ở | Màn hình | Ghi chú |
|---|---|---|---|
| C1-15 | `01` mục 5 | **Cần chú ý** – dòng **Đơn …: phụ thu trả muộn bằng giá 1 đêm chờ xem lại**, nút **Mở folio**, **Đã xem** | Như `screenshot-list.md`. Cần ca ESC-031 sau 18:00 (căn 203); QA chụp khi có ca, không kịp thì bản dựng giữ mô tả chữ |
| C2-34 | `02` mục 11.4 | Trả phòng – **Trả sau mốc trả muộn** + **Ghi phụ thu – quản lý xem lại**, ô **Lý do** | Như trên |

## Thứ tự ưu tiên chụp (nếu không kịp trước buổi đào tạo 31/10)

1. G2-05, G2-06, G2-07, G2-04 – rà giữ chỗ và hoàn cọc (việc tạm hằng ngày tới v1.0.1).
2. G3-01 cùng lúc QA kiểm câu Q2 (đổi mật khẩu tạm của buồng phòng/bảo trì).
3. G4-02 cùng lúc kiểm câu Q3.
4. Còn lại.

Không kịp: bản dựng giữ mô tả chữ như với C1-15, C2-34.
