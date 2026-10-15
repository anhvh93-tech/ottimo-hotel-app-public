# ADR-013 – Lưu ảnh giấy tờ: mã hóa phong bì (envelope), xóa bằng hủy khóa

- Trạng thái: Đề xuất (SEC Phần 2 có thể siết thêm) | Người quyết: ARC cùng SEC | Ngày: 15/10/2026
- Liên quan: decision-log 15/10 (SEC: C3 lưu tách, mã hóa mức trường/tệp, log mỗi lần xem, xóa bằng hủy khóa riêng); data-risk-assessment mục 3, 7, 11; BR-610; ESC-001; ADR-010

## Bối cảnh
- Dữ liệu C3: số/ảnh giấy tờ, thị thực, dấu nhập cảnh, dữ liệu trẻ em, mã cửa đang hiệu lực. Phải tự xóa theo hạn (mặc định 30 ngày sau trả phòng – BR-610, chờ luật sư), kể cả trong bản sao lưu.
- Không dùng object storage nước ngoài (ESC-002 A).

## Quyết định
1. **Kho tệp**: interface `BlobStore` (`put`, `get`, `delete`) với 2 cài đặt: `local` (thư mục volume trên VPS, MVP) và `s3` (object storage S3-compatible tại VN, khi cần). Tệp lưu dưới tên ngẫu nhiên, không chứa tên khách/số giấy tờ. **Chỉ nhận JPEG/PNG/WebP** (magic bytes, không PDF/HEIC – SR-FILE-01 v0.2), ≤ 10 MB, ≤ 40 MP; server **mã hóa lại** bằng `sharp`, bỏ EXIF/GPS trước khi mã hóa phong bì; không ghi tệp tạm dạng rõ.
2. **Mã hóa phong bì**: mỗi tệp (và mỗi trường C3 trong DB như số hộ chiếu) mã hóa bằng **khóa dữ liệu riêng (DEK)** AES-256-GCM; DEK được bọc bởi **khóa chủ (KEK)**, không nằm trong DB hay backup. KEK và `ID_HASH_KEY` nạp từ **tệp** qua `DATA_KEK_FILE`/`ID_HASH_KEY_FILE` (Docker Compose `secrets:`, tệp `0400` chủ là UID container, ngoài thư mục dự án, loại khỏi backup tệp – SR-KEY-10, SEC-ARC-25), đọc một lần khi khởi động; biến môi trường trực tiếp chỉ cho dev. Bảng `data_key(id, wrapped_key, purpose, subject_ref, expires_at, destroyed_at)`.
3. **Xóa theo hạn = hủy DEK** (crypto-shredding): job hằng ngày xóa `wrapped_key` của hồ sơ quá hạn + xóa tệp, ghi `purge_journal`. **Hủy DEK làm dữ liệu không đọc được trong DB ngay; bản sao lưu cũ vẫn chứa DEK bọc bởi KEK hiện hành nên dữ liệu chỉ hết hẳn khi backup cũ hết hạn (≤ 35 ngày, T18)** – câu chữ theo SR-KEY-09; thông báo xử lý dữ liệu phải nói rõ (SR-BAK-07). Sau khôi phục backup, áp lại `purge_journal` để không "hồi sinh" dữ liệu đã xóa. Tăng cường (R3 nếu INV/luật sư cần nhanh hơn 35 ngày): xoay KEK theo tháng (SR-KEY-06). Cờ `legal_hold` chặn xóa (SEC).
4. **Đọc** ảnh/số giấy tờ chỉ qua endpoint riêng, kiểm quyền theo vai + cơ sở, **ghi `c3_access_log`** (ai, khi nào, hồ sơ nào, lý do) trước khi trả dữ liệu; ảnh trả bằng luồng có `Cache-Control: no-store`; không có URL công khai/ký sẵn dài hạn.
5. Băm có khóa (HMAC-SHA256, khóa riêng) cho số giấy tờ khi cần so khớp khách quen (chỉ khi có đồng ý – SEC F03); CRM chỉ hiển thị 4 số cuối.
6. Xoay KEK: hỗ trợ nhiều phiên bản KEK (`kek_version`), bọc lại DEK khi xoay – runbook của OPS.

## Phương án đã cân nhắc
- Mã hóa toàn ổ đĩa (LUKS) đơn thuần: bảo vệ khi mất ổ, không bảo vệ khi ứng dụng/DB bị truy cập trái phép, không xóa được trong backup.
- `pgcrypto` mã hóa trong DB với khóa truyền vào câu SQL: khóa có thể lọt vào log truy vấn.

## Hệ quả
- Tốt: đáp ứng yêu cầu SEC tối thiểu; xóa theo hạn chứng minh được.
- Phải chấp nhận: mất KEK = mất toàn bộ ảnh giấy tờ (chấp nhận được vì ảnh chỉ giữ ngắn hạn); KEK phải được sao lưu riêng, ngoài máy chủ, do INV giữ (OPS hướng dẫn).

## Cập nhật R1 bước 4 (16/10/2026)
- Sửa điểm 3 (câu "backup cũ không giải mã được" là sai – FB-R1-SEC-ARC-05), điểm 2 (KEK qua tệp – SEC-ARC-25), điểm 1 (loại tệp, mã hóa lại – SEC-ARC-13). Đọc/ghi C3 cần thiết bị tin cậy + xác nhận lại (SR-DEV-03, SR-C3-09).
