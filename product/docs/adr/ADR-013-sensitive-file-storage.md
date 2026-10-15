# ADR-013 – Lưu ảnh giấy tờ: mã hóa phong bì (envelope), xóa bằng hủy khóa

- Trạng thái: Đề xuất (SEC Phần 2 có thể siết thêm) | Người quyết: ARC cùng SEC | Ngày: 15/10/2026
- Liên quan: decision-log 15/10 (SEC: C3 lưu tách, mã hóa mức trường/tệp, log mỗi lần xem, xóa bằng hủy khóa riêng); data-risk-assessment mục 3, 7, 11; BR-610; ESC-001; ADR-010

## Bối cảnh
- Dữ liệu C3: số/ảnh giấy tờ, thị thực, dấu nhập cảnh, dữ liệu trẻ em, mã cửa đang hiệu lực. Phải tự xóa theo hạn (mặc định 30 ngày sau trả phòng – BR-610, chờ luật sư), kể cả trong bản sao lưu.
- Không dùng object storage nước ngoài (ESC-002 A).

## Quyết định
1. **Kho tệp**: interface `BlobStore` (`put`, `get`, `delete`) với 2 cài đặt: `local` (thư mục volume trên VPS, MVP) và `s3` (object storage S3-compatible tại VN, khi cần). Tệp lưu dưới tên ngẫu nhiên, không chứa tên khách/số giấy tờ.
2. **Mã hóa phong bì**: mỗi tệp (và mỗi trường C3 trong DB như số hộ chiếu) mã hóa bằng **khóa dữ liệu riêng (DEK)** AES-256-GCM; DEK được bọc bởi **khóa chủ (KEK)** nạp từ biến môi trường/kho bí mật, không nằm trong DB hay backup. Bảng `data_key(id, wrapped_key, purpose, subject_ref, expires_at, destroyed_at)`.
3. **Xóa theo hạn = hủy DEK** (crypto-shredding): job hằng ngày xóa `wrapped_key` của hồ sơ quá hạn + xóa tệp. Bản sao lưu cũ vẫn chứa tệp mã hóa nhưng **không giải mã được** → đáp ứng "xóa cả trong backup" mà không phải sửa backup. Cờ `legal_hold` chặn xóa (SEC).
4. **Đọc** ảnh/số giấy tờ chỉ qua endpoint riêng, kiểm quyền theo vai + cơ sở, **ghi `c3_access_log`** (ai, khi nào, hồ sơ nào, lý do) trước khi trả dữ liệu; ảnh trả bằng luồng có `Cache-Control: no-store`; không có URL công khai/ký sẵn dài hạn.
5. Băm có khóa (HMAC-SHA256, khóa riêng) cho số giấy tờ khi cần so khớp khách quen (chỉ khi có đồng ý – SEC F03); CRM chỉ hiển thị 4 số cuối.
6. Xoay KEK: hỗ trợ nhiều phiên bản KEK (`kek_version`), bọc lại DEK khi xoay – runbook của OPS.

## Phương án đã cân nhắc
- Mã hóa toàn ổ đĩa (LUKS) đơn thuần: bảo vệ khi mất ổ, không bảo vệ khi ứng dụng/DB bị truy cập trái phép, không xóa được trong backup.
- `pgcrypto` mã hóa trong DB với khóa truyền vào câu SQL: khóa có thể lọt vào log truy vấn.

## Hệ quả
- Tốt: đáp ứng yêu cầu SEC tối thiểu; xóa theo hạn chứng minh được.
- Phải chấp nhận: mất KEK = mất toàn bộ ảnh giấy tờ (chấp nhận được vì ảnh chỉ giữ ngắn hạn); KEK phải được sao lưu riêng, ngoài máy chủ, do INV giữ (OPS hướng dẫn).
