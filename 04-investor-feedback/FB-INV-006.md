# FB-INV-006 – Chấm công nhân viên qua Wi-Fi OTTIMO

- Ngày: 26/10/2026 | Người gửi: INV | Ghi: ORC | Loại: tính năng mới | Ưu tiên: P2 | Đích: v1.1 (sau ngày chạy 02/11)

## Nguyên văn (tóm các câu hỏi INV trong chat 26/10)
> có cách nào để tích hợp chuyện chấm công bằng cách đăng nhập tài khoản bằng wifi ottimo mỗi ngày ko
> ngoài phương án IP tĩnh còn cách nào khác ko, mà ko cần in QR mỗi ngày
> … nhờ nhân viên số 2 ở ottimo đăng nhập tk của nhân viên số 1 để check in check out thì được ko
> ví dụ điện thoại ko có cả face id lẫn vân tay thì sao
> cái đăng nhập ở laptop ở quầy thì đâu có chấm công, tại nó onl 24/24. Bản chất lúc đó tất cả nhân viên đều phải thao tác riêng trên mobile web …
> ok. chốt thử luôn đi.

## Thiết kế INV chốt (26/10)
1. Chấm công **chỉ trên điện thoại riêng** của từng nhân viên, trong app nhân viên (`staff.ottimo.vn`): nút Vào ca / Ra ca.
2. **Wi-Fi OTTIMO, không cần IP tĩnh:** laptop quầy (thiết bị được cấp, online 24/24) báo IP công cộng của OTTIMO lên máy chủ mỗi ~5 phút ("điểm neo IP"); chấm công chỉ nhận khi IP điện thoại trùng IP neo trong vài phút gần nhất. Laptop quầy **không** dùng để chấm công.
3. **Chống chấm hộ:** mỗi tài khoản gắn đúng một điện thoại đã đăng ký và mỗi điện thoại chỉ chấm cho một người; xác nhận bằng passkey (Face ID / vân tay; máy không có sinh trắc → mã khóa màn hình). Máy chỉ có mã khóa → **bắt buộc chụp selfie**; máy có sinh trắc → selfie tùy OWN bật (mặc định tắt). Máy không đặt khóa màn hình → yêu cầu đặt mới đăng ký được.
4. **Không dùng số điện thoại** để xác minh (gắn máy, không gắn SIM); số điện thoại nhân viên chỉ để liên lạc, chỉ OWN/MGR xem.
5. Ngoại lệ: quên/hỏng máy → quản lý chấm tay có lý do, có nhật ký; đổi máy → quản lý "đăng ký lại máy"; nghỉ việc → khóa tài khoản.
6. Desk: bảng công ngày/tháng (vào, ra, muộn, sớm), đối chiếu lịch ca, báo quản lý khi chấm ngoài ca.
7. Dữ liệu nhân viên (giờ, IP, ảnh selfie) là dữ liệu cá nhân: thông báo cho nhân viên, ảnh tự xóa (đề xuất 30 ngày), SEC duyệt.

## Việc
- PO + BA: user story + AC; SEC: threat model + thông báo nhân viên; ARC: API/ERD; ước công 3–4 ngày làm việc. Làm sau ngày chạy.
