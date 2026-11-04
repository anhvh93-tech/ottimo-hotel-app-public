# QA – Kiểm che dữ liệu ảnh PR #60 (BUG-R2-216/219 hold dialog)

- Round 4 · Bước: Kiểm thử · Người kiểm: QA · Ngày: 04/11/2026
- PR: #60 `round-4: BUG-R2-216/219 hold dialog`, head `c2c2edd2b4c5e4e8690bc27a3c2ae9862b3d674c` (xác nhận bằng `gh pr view 60 --json headRefOid`). Worktree `fe-hold-dialog` đang ở đúng `c2c2edd2`, không có thay đổi chưa commit.
- Phạm vi: 8 ảnh `rounds/round-04/outputs/FE/screenshots/v1.0.4-bug-r2-21{6,9}-*.png`, kích thước 1366×900.
- **Kết luận: ĐẠT.** Không ảnh nào có vấn đề, PR gộp được nếu chỉ xét việc che dữ liệu.

## 1. Đối chiếu bản trong PR

Cách làm: `gh pr view 60 --json files` cho 8 ảnh và 2 tệp code. `git ls-tree -r c2c2edd2` lấy sha blob của ảnh, so với `git hash-object` của tệp trong worktree.

| Ảnh | sha blob | Khớp |
|---|---|---|
| 216-hold-created-after-en-1366 | 3190519b | Có |
| 216-hold-created-after-vi-1366 | 59bfb70a | Có |
| 216-hold-created-before-en-1366 | e60e9b5d | Có |
| 216-hold-created-before-vi-1366 | 98928aaf | Có |
| 219-arrival-today-after-en-1366 | 01ae14d6 | Có |
| 219-arrival-today-after-vi-1366 | fcfa603f | Có |
| 219-arrival-today-before-en-1366 | 84de3934 | Có |
| 219-arrival-today-before-vi-1366 | 81f6c792 | Có |

## 2. Metadata PNG

Script Python tự viết đọc từng chunk của PNG, chạy bằng `python3 -I` trong scratchpad. Cả 8 ảnh chỉ có `IHDR`, `IDAT` và `IEND`: không có `tEXt`, `zTXt`, `iTXt`, `eXIf` hay `tIME`. Sau `IEND` không có byte thừa, nên không có dữ liệu giấu ở cuối tệp.

## 3. Mã QR: kiểm đến từng điểm ảnh

- Ảnh 216 (×4) có thẻ VietQR. Ô QR bị phủ một khối vuông 120×120 px, màu Stone Grey `#6B6760`. Script giải nén điểm ảnh và đếm màu bên trong khối (thụt vào 3 px để bỏ viền khử răng cưa): 12.996/12.996 điểm ảnh đều đúng `#6B6760`, chỉ có 1 màu, không còn sót module QR nào. Mắt thường cũng thấy một khối xám đặc. Không quét ra được mã.
- Ảnh 219 (×4) là ca khách đến trong ngày, nên không có thẻ QR. Script không tìm thấy khối QR nào và xem bằng mắt cũng không thấy.
- Cả 8 ảnh không có mã QR nào khác.

## 4. Xem từng ảnh

Dữ liệu trên ảnh đều là seed giả của mock MSW, đồng hồ giả 04/11/2026.

| # | Ảnh | Nội dung nhìn thấy | Kết quả |
|---|---|---|---|
| 1 | 216-hold-created-before-en | Hộp "Hold": căn 203 giữ chỗ, đơn OTM-0171, cọc 500,000 VND hiện 2 lần (lỗi trùng trước khi sửa), QR đã phủ xám, "Receiving account: 9704••••7777"; lịch phòng có ô giữ chỗ "Hoàng Gia B…" | ĐẠT |
| 2 | 216-hold-created-after-en | Như #1 nhưng khối tóm tắt trùng đã bị bỏ | ĐẠT |
| 3 | 216-hold-created-before-vi | Như #1, tiếng Việt ("Tài khoản nhận: 9704••••7777") | ĐẠT |
| 4 | 216-hold-created-after-vi | Như #2, tiếng Việt | ĐẠT |
| 5 | 219-arrival-today-before-en | Hộp "Hold" cho khách đến hôm nay: thông báo không giữ chỗ được, chọn 12/24/48 h, cọc 500,000 VND, không có QR | ĐẠT |
| 6 | 219-arrival-today-after-en | Chỉ còn thông báo và nút; không số tài khoản, không QR | ĐẠT |
| 7 | 219-arrival-today-before-vi | Như #5, tiếng Việt | ĐẠT |
| 8 | 219-arrival-today-after-vi | Như #6, tiếng Việt | ĐẠT |

## 5. Đối chiếu tiêu chí

| Mục | Kết quả |
|---|---|
| QR đọc được | Không có. Khối phủ 120×120 đặc một màu (mục 3). |
| Số tài khoản thật | Không có. Chỉ thấy `9704••••7777`, đã che ở giữa, lấy từ `mocks/stay.ts` dòng 3727 (`receivingAccountMasked: '9704••••7777'`). Số đầy đủ trong mock là `19030000007777`, tên tài khoản "OTTIMO TEST", có chú thích "Test value only… not a real account" (`mocks/handlers.ts` dòng 105–107). Số này không hiện trên ảnh nào. |
| Tên khách | Chỉ có "Hoàng Gia B…", bị cắt trên ô lịch; tên đủ "Hoàng Gia Bảo" là seed KH-0032 trong `mocks/reservations.ts` dòng 410. Số điện thoại seed của khách này không hiện trên ảnh. |
| Tên người dùng | "Sơn · Sales staff / Sale nội bộ": người dùng seed `qa.sal` trong `mocks/seed.ts` dòng 83. |
| Số điện thoại, email, số giấy tờ | Không có. |
| Số hoa hồng | Không có. |
| IP, URL nội bộ | Không có, vì ảnh chụp vùng trang, không có thanh địa chỉ. |
| Thông tin đăng nhập | Không có. |
| "Transfer reference / Nội dung chuyển khoản: OTM0171" | Đây là mã đơn, không phải dữ liệu cá nhân. |

## 6. Giả định và giới hạn

- Giả định tên trong mock là tên bịa. Các tệp mock này đã có trên `main`, PR #60 không sửa `mocks/*`.
- Không chạy OCR. Phần chữ được đọc bằng mắt trên ảnh gốc. Riêng ô QR được kiểm bằng cách đếm điểm ảnh.
- Nếu ảnh được chụp lại sau `c2c2edd2`, các ảnh có sha thay đổi phải kiểm che lại.
- Không có lỗi, không tạo BUG, không cần ESC.
