# Kịch bản dùng thử OTTIMO Desk v1.0

- Dành cho: Chủ đầu tư (và lễ tân trưởng nếu tiện) | Lập: PO, 23/10/2026 · Sửa PO 26/10: việc 6 theo giờ nhận phòng từ 12:00 (BR v0.4.6; đội đặt tham số trên staging trước buổi B1 – việc F2 của DOM) | Phiên bản thử: `v1.0.0-rc.1` trên staging
- Nơi thử: Desk `desk.staging.ottimo.vn` · app buồng phòng `staff.staging.ottimo.vn` (mở trên điện thoại) · trang khách `g.staging.ottimo.vn` (mở từ link của đơn)
- Thời gian: khoảng 2 giờ cho việc 1–9; việc 10 làm riêng **sau 00:00** (khoảng 20 phút).
- **Lưu ý:**
  - Staging chỉ có dữ liệu giả. Không nhập giấy tờ, số điện thoại hay tài khoản thật. **Không quét VietQR để chuyển tiền.**
  - Không đụng đơn `OTM-00239` (đội đang dùng để kiểm thử).
  - Mỗi việc ghi kết quả: **Đạt** / **Chưa** + ghi chú ngắn. Gặp lỗi gõ `/feedback` kèm số việc, ví dụ "UAT việc 8 – …".
  - Phiên bản tiếp theo có thể khác giao diện một chút; kết quả mong đợi là điều phải đúng, không phải vị trí nút.

| # | Việc | Ai | Các bước chính | Kết quả mong đợi | Kết quả |
|---|---|---|---|---|---|
| 1 | **Đăng nhập 2 bước** | Chủ | Đăng nhập → đăng ký 2 bước bằng ứng dụng xác thực → lưu 10 mã khôi phục (bản thử, không dùng cho bản thật) → đăng xuất → đăng nhập lại bằng mã 6 số | Không có mã 6 số thì không vào được. Mã khôi phục hiện **một lần**, chữ đơn cách dễ chép | |
| 2 | **Người dùng và tài khoản nhận tiền** | Chủ | Thêm một lễ tân và một buồng phòng, gán vai → mở màn "Tài khoản nhận chuyển khoản", lên lịch lại tài khoản thử đang có cho ngày mai → hủy dòng đã lên lịch | Mật khẩu tạm hiện một lần. Mỗi lần lưu đều hỏi xác thực lại. Số tài khoản luôn bị che, chỉ hiện 4 số cuối | |
| 3 | **Báo giá → giữ chỗ → cọc** | Lễ tân / sale | Tạo báo giá 2 đêm cho một căn → chuyển thành giữ chỗ → mở VietQR cọc → bấm "đã nhận cọc" | Giá đúng bảng giá. QR đúng số tiền và nội dung chuyển khoản là mã đơn. Đơn chuyển sang đã đảm bảo; sơ đồ phòng chặn căn | |
| 4 | **Đặt trực tiếp, chống trùng, đổi ngày** | Lễ tân | Tạo đơn trực tiếp → thử đặt **trùng** căn và đêm đó → đổi đơn sang ngày khác | Đặt trùng bị chặn, có câu giải thích. Đổi ngày tính lại tiền và báo phần chênh trước khi lưu | |
| 5 | **Check-in online của khách** | Lễ tân + điện thoại | Gửi link trang khách của đơn ở việc 3 → mở trên điện thoại → khách điền thông tin, tải ảnh giấy tờ giả, chọn giờ đến → đổi ngôn ngữ EN/VI | Trang theo phong cách OTTIMO, tiếng Anh dẫn. Desk thấy khách đã check-in online | |
| 6 | **Nhận phòng** | Lễ tân | Mở đơn ở việc 5 → kiểm giấy tờ, đối chiếu → nhận phòng → xem danh sách cần khai báo lưu trú và đánh dấu đã khai | Nhận từ 12:00: **không** phụ thu. Thử nhập giờ nhận 11:00: Desk đề xuất phụ thu 30 % giá đêm đầu (từ 26/10: nhận phòng từ 12:00, phòng chắc chắn sẵn sàng 14:00). Khai báo có hạn rõ ràng. Buồng phòng không xem được ảnh giấy tờ | |
| 7 | **Lưu trú** | Lễ tân + khách + buồng phòng | Thêm dịch vụ (giặt ủi) và minibar vào folio → gia hạn 1 đêm → trên trang khách gửi yêu cầu "thêm khăn" → buồng phòng nhận việc trên điện thoại | Folio cộng đúng. Gia hạn chỉ cho đêm còn trống. Yêu cầu của khách hiện trên app buồng phòng | |
| 8 | **Trả phòng, thu tiền, công nợ** | Lễ tân + quản lý | Trả phòng 3 bước (minibar → phụ phí → bill) → thu một phần, phần còn lại để nợ → hôm sau thu nốt → thử xin miễn một khoản lớn | Bill đúng công thức. Công nợ hiện ở "Cần chú ý" tới khi thu đủ. Khoản miễn vượt hạn mức phải chờ duyệt; nhật ký tiền ghi đủ người, giờ, số | |
| 9 | **Buồng phòng và bảo trì** | Buồng phòng (điện thoại) + lễ tân | Căn vừa trả hiện việc dọn → dọn → kiểm theo checklist → sẵn sàng → báo một sự cố có ảnh → lễ tân mở phiếu sửa, khóa bán căn | Trạng thái đổi theo đúng bước. Desk cập nhật ngay. Căn khóa không bán được trên sơ đồ | |
| 10 | **Ca đêm (sau 00:00, trước 06:00)** | Lễ tân | Lúc khoảng 00:30–02:00: xem Desk "hôm nay" → nhận một khách đến muộn của đêm hôm trước → tạo một đơn khách vãng lai ở luôn đêm nay → mở app buồng phòng "Các căn". Sau 06:00 mở lại Desk | Trước 06:00 Desk và app vẫn tính **ngày kinh doanh hôm trước**: đơn vãng lai có ngày đến là hôm trước, tính 1 đêm. Không ai bị tính thêm đêm vì qua 00:00. Sau 06:00 mới sang ngày mới | |

## Sau khi thử

- Đạt 8/10 việc trở lên và không có lỗi P0/P1: đủ để anh/chị chọn ngày chạy.
- Lỗi P0/P1 đội sửa trước khi lên bản thật. Lỗi nhỏ ghi vào bản vá tuần (v1.0.x).
- Điều chưa có trong v1.0 (xác nhận từ xa của quản lý, kênh OTA tự động, báo cáo, mẫu tin, dài hạn đủ vòng): xem `product/docs/release-notes.md` mục "Chưa có trong bản này". Form "Yêu cầu đặt phòng" trên website có trong v1.0 nhưng đang tắt tới khi anh/chị quyết ESC-030.
- Trên staging đã bật 2 bước cho chủ và quản lý: ở việc 8, khoản miễn vượt hạn mức gửi chờ duyệt rồi duyệt ở "Cần duyệt" bằng tài khoản của chính người duyệt; Desk từ chối ô "mật khẩu của quản lý" trên màn lễ tân (xem ESC-031).
