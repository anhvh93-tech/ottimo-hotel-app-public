# OTTIMO Desk – Release notes

Ghi chép thay đổi theo từng phiên bản, viết cho chủ đầu tư và nhân viên. Bản mới nhất ở trên.
Đánh số: `v1.0.0` bản chính · `v1.0.x` bản vá lỗi · `v1.x.0` bản thêm tính năng (quy trình: `rounds/round-03/release-v1-plan.md` mục 7).

---

## v1.0.0 – Bản vận hành đầu tiên

- Trạng thái: **NHÁP** – chờ QC "cổng v1.0". PO cập nhật ngày, tag và mục "Giới hạn đã biết" khi QC ra quyết định.
- Ngày phát hành: dự kiến 02–05/11/2026
- Địa chỉ: Desk `desk.ottimo.vn` · app buồng phòng `staff.ottimo.vn` · trang khách `g.ottimo.vn`

### Có trong bản này
- **Sơ đồ phòng và đặt phòng:** sơ đồ 14 ngày, đặt trực tiếp, chặn đặt trùng, đổi căn/đổi ngày, hủy, khách không đến, đơn OTA nhập tay, đơn dài hạn nhập tay.
- **Báo giá, giữ chỗ, cọc:** báo giá có hạn, giữ chỗ tự hết hạn, mã VietQR đúng số tiền và mã đơn, xác nhận đã nhận cọc.
- **Nhận phòng, lưu trú, trả phòng:** phụ thu nhận sớm/trả muộn tự tính, gia hạn, thêm dịch vụ vào folio, trả phòng 3 bước, bill, thu tiền nhiều lần, công nợ và thu nợ.
- **Giấy tờ và khai báo lưu trú:** nhập giấy tờ, đối chiếu, nhắc hạn khai báo; ảnh giấy tờ chỉ lễ tân và quản lý xem, tự xóa theo hạn lưu.
- **Check-in online:** khách mở trang của đơn bằng link, tải giấy tờ, chọn giờ đến, gửi yêu cầu trong lúc ở; tiếng Anh và tiếng Việt.
- **Buồng phòng và bảo trì (app điện thoại):** việc dọn tự sinh, kiểm phòng theo checklist, báo sự cố có ảnh, phiếu sửa và khóa bán căn.
- **Kiểm soát:** phân quyền theo vai, nhật ký mọi thao tác tiền, miễn giảm có hạn mức và người duyệt, báo chủ đầu tư khi tổng miễn trên một lượt ở vượt ngưỡng.
- **Bảo mật:** đăng nhập 2 bước cho chủ đầu tư và quản lý, mã khôi phục; xác thực lại trước thao tác nhạy cảm; chủ đầu tư tự đặt tài khoản nhận chuyển khoản, có cảnh báo khi vừa đổi; chủ đầu tư tự thêm nhân viên.

### Chưa có trong bản này
| Tính năng | Dự kiến |
|---|---|
| Quản lý xác nhận từ xa trên điện thoại | v1.1 |
| Form "Yêu cầu đặt phòng" trên website, landing ottimo.vn | v1.1 |
| Kết nối kênh OTA tự động (Beds24) | v1.1 |
| Mã cửa 8 số quản lý trên app; báo tự động khi khách quá giờ trả phòng | v1.1 |
| Báo cáo tháng, kênh, FOC; xuất dữ liệu; mẫu tin và lịch nhắn khách; Zalo OA | v1.2 |
| Hợp đồng dài hạn đủ vòng, điện nước; hóa đơn điện tử MISA; đóng ca; tiếng Nga | v1.3 |

### Giới hạn đã biết
- Năm chỗ trên Desk (nhắc hạn công nợ, ngày hiệu lực khi đổi giá/tham số, gợi ý chặng minibar khi trả phòng, gợi ý "khách không đến") còn dùng ngày lịch thay vì ngày kinh doanh; nhắc hạn công nợ có thể lệch 1 ngày. Đây là giá trị điền sẵn và dòng nhắc; máy chủ vẫn kiểm và tính tiền. Lễ tân xem kỹ ngày trước khi lưu. Sửa ở v1.1 (lượt kiểm tiền phần 2).
- Kiểm tra trình đọc màn hình (VoiceOver) cho hộp xác nhận chưa xong.
- *(QC bổ sung khi chấm cổng v1.0.)*

### Cách báo lỗi
Gõ `/feedback <mô tả>`. Lỗi làm không đặt, nhận, trả phòng hay thu tiền được, hoặc sai tiền: ghi "P0" ở đầu, đội sửa trong ngày.
