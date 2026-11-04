# QA – Kiểm che dữ liệu ảnh PR #54 (P4-40 fe-holds)

- Round 4 · Bước: Kiểm thử · Người kiểm: QA · Ngày: 04/11/2026
- PR: #54 `round-4: P4-40 fe-holds`, head `a00218cc4c0c6fbed47c9aeb119a74444ab39636`
- Phạm vi: 20 ảnh `rounds/round-04/outputs/FE/screenshots/v1.0.4-p4-40-*.png`
- **Kết luận: ĐẠT** – 0 ảnh có vấn đề. Gộp được về mặt che dữ liệu.

## 1. Đối chiếu đúng bản trong PR

Cách làm: `gh pr view 54 --json files` (20 ảnh + 6 tệp code + 2 tệp md), `git ls-tree -r a00218cc -- rounds/round-04/outputs/FE/screenshots/`, so blob sha với `git hash-object` của tệp trong worktree `agent-a793e9814e965c294` (HEAD = `a00218cc`, sạch).

Kết quả: 20/20 sha khớp. Không có ảnh nào ngoài danh sách PR, không thiếu ảnh.

## 2. Tiêu chí kiểm

| Mục | Cách kiểm | Kết quả |
|---|---|---|
| Tên khách thật | Đối chiếu từng tên hiện trên ảnh với mã nguồn mock `product/apps/admin-web/src/mocks/{reservations,ops,seed,stay}.ts` (đã có trên `main`) | Toàn bộ là tên seed giả của mock |
| Số điện thoại | Xem từng ảnh | Không có |
| Email (chỉ @example.test) | Xem từng ảnh; banner bảo mật chỉ nói "chưa có email", không hiện địa chỉ | Không có email nào |
| Số CCCD / hộ chiếu | Xem từng ảnh; chỉ có nhãn "No IDs yet / Chưa có giấy tờ" và "1 guest(s) missing" | Không có |
| Số tài khoản ngân hàng, mã QR thanh toán | Xem hộp xác nhận cọc | Không có QR, không có số tài khoản. "Transfer reference: OTM0146" là mã đơn, không phải số tài khoản |
| Số hoa hồng | Kênh "CTV / môi giới" chỉ hiện tên kênh | Không có số hoa hồng |
| IP máy chủ, URL nội bộ | Ảnh chụp vùng trang, không có thanh địa chỉ | Không có |
| Thông tin đăng nhập | Chỉ hiện "Quân · Manager / Quản lý" (người dùng seed) | Không có mật khẩu, mã OTP, token |

## 3. Kết quả từng ảnh

Dữ liệu trên mọi ảnh: seed giả của mock MSW, đồng hồ giả 04/11/2026. FE ghi cách chụp ở `rounds/round-04/responses/FE-P4-40.md`: Playwright trên dev server chế độ mock, script chỉ sửa 2 câu trả lời API (số hoàn tính thử, 2 loại cảnh báo mới), không thêm dữ liệu cá nhân.

| # | Ảnh | Nội dung nhìn thấy | Kết quả |
|---|---|---|---|
| 1 | today-mgr-en-1366 | Hôm nay: Gia đình anh Hưng, Anna Martin, Phạm Huy, Lê Minh; OTM-0145/0146/0147/0155/0160; 3 yêu cầu khách (text mock); người dùng Quân | ĐẠT |
| 2 | today-mgr-en-1440 | Như #1 | ĐẠT |
| 3 | today-mgr-vi-1366 | Như #1, tiếng Việt | ĐẠT |
| 4 | today-mgr-vi-1440 | Như #1, tiếng Việt | ĐẠT |
| 5 | drawer-paid-keep-en-1366 | Danh sách đơn (15 tên seed) + ngăn chi tiết OTM-0146 Lê Minh, số tiền mock | ĐẠT |
| 6 | drawer-paid-keep-en-1440 | Như #5 | ĐẠT |
| 7 | drawer-paid-keep-vi-1366 | Như #5, tiếng Việt | ĐẠT |
| 8 | drawer-paid-keep-vi-1440 | Như #5, tiếng Việt | ĐẠT |
| 9 | drawer-paid-overdue-en-1366 | Như #5, banner quá hạn | ĐẠT |
| 10 | drawer-paid-overdue-en-1440 | Như #9 | ĐẠT |
| 11 | drawer-paid-overdue-vi-1366 | Như #9, tiếng Việt | ĐẠT |
| 12 | drawer-paid-overdue-vi-1440 | Như #9, tiếng Việt | ĐẠT |
| 13 | cancel-hold-paid-en-1366 | Hộp hủy giữ chỗ căn 103, lý do chưa chọn | ĐẠT |
| 14 | cancel-hold-paid-en-1440 | Như #13 | ĐẠT |
| 15 | cancel-hold-paid-vi-1366 | Như #13, tiếng Việt | ĐẠT |
| 16 | cancel-hold-paid-vi-1440 | Như #13, tiếng Việt | ĐẠT |
| 17 | deposit-shortfall-mgr-en-1366 | Hộp xác nhận cọc OTM-0146: số tiền nhập 200000, tiền mặt, mã chuyển khoản OTM0146, lý do để trống | ĐẠT |
| 18 | deposit-shortfall-mgr-en-1440 | Như #17 | ĐẠT |
| 19 | deposit-shortfall-mgr-vi-1366 | Như #17, tiếng Việt | ĐẠT |
| 20 | deposit-shortfall-mgr-vi-1440 | Như #17, tiếng Việt | ĐẠT |

Tên xuất hiện và nơi có trong mock: Lê Minh, Lê Thu Trang, Chen Wei, Ji-woo Park, Trần Quốc Bảo, Olga Ivanova (`mocks/reservations.ts`); Gia đình anh Hưng, Phạm Huy, Trần Thu Nga, Kim Seo-yeon (`mocks/ops.ts` + `reservations.ts`); Anna Martin, Nguyễn Văn An (`mocks/seed.ts` + `reservations.ts`); Daniel Weber, Emma Laurent, Sophie Martin (`mocks/stay.ts` + `reservations.ts`); Quân (`mocks/seed.ts`). Câu khách nhắn "Đặt xe ra sân bay lúc 13:00", "Thêm 2 khăn tắm", "Vòi sen nước yếu": `mocks/ops.ts`. Tên căn (The Ivory, The Bloom…) là tên tạm seed DS-E, không phải dữ liệu cá nhân.

## 4. Giả định và giới hạn

- Giả định tên trong mock là tên bịa (đã nằm trên `main` công khai từ trước, không phải PR này thêm vào). QA không có danh sách khách thật để đối chiếu trùng ngẫu nhiên. Tên phổ biến như "Lê Minh", "Phạm Huy" có thể trùng người thật nhưng không gắn với giấy tờ, số điện thoại hay ngày ở thật.
- Kiểm bằng mắt trên ảnh gốc độ phân giải đầy đủ; không chạy OCR.
- Không kiểm metadata PNG (ảnh do Playwright xuất, không có EXIF/GPS).

## 5. Việc tiếp theo

- Không có lỗi, không tạo BUG, không cần ESC.
- Nếu FE chụp lại sau commit `a00218cc`, phải kiểm che lại phần ảnh đổi sha.

---

## 6. Kiểm che lại – head 170aaa16 (sau lượt 3)

- Ngày: 04/11/2026 · Head PR #54: `170aaa16301ddf5e07530bac652ffd57e9aa85ff` (xác nhận bằng `gh pr view 54 --json headRefOid`). Worktree `agent-a793e9814e965c294` đứng đúng `170aaa16`, sạch.
- **Kết luận: ĐẠT** – 0 ảnh có vấn đề. PR vẫn có đủ 20 ảnh.

### 6.1 Đối chiếu sha

Cách làm: `diff` giữa `git ls-tree -r a00218cc` và `git ls-tree -r 170aaa16` cho `rounds/round-04/outputs/FE/screenshots/`, rồi so `git hash-object` của 20 tệp trong worktree với blob ở `170aaa16`: 20/20 khớp.

- Đúng 8 ảnh đổi sha, khớp danh sách ORC gửi:

| Ảnh | sha a00218cc | sha 170aaa16 |
|---|---|---|
| today-mgr-en-1366 | a6e981b7 | 5907319f |
| today-mgr-en-1440 | 224c4b86 | 4b2f6757 |
| today-mgr-vi-1366 | 1aa1954a | 72de41bb |
| today-mgr-vi-1440 | eee3bb61 | fb0fd5b4 |
| deposit-shortfall-mgr-en-1366 | 527228bf | 7d78704c |
| deposit-shortfall-mgr-en-1440 | 8e300524 | afc67b3f |
| deposit-shortfall-mgr-vi-1366 | 7862524f | 928d2a4e |
| deposit-shortfall-mgr-vi-1440 | 841768d6 | 6a94166e |

- 12 ảnh còn lại (cancel-hold-paid ×4, drawer-paid-keep ×4, drawer-paid-overdue ×4) giữ nguyên sha so với `a00218cc`. Kết quả ĐẠT ở mục 3 vẫn có hiệu lực, không cần xem lại.

### 6.2 Xem lại 8 ảnh đổi

Tôi xem cả 8 ảnh ở độ phân giải gốc. So với lượt trước, chỉ thay đổi những điểm sau, và không có dữ liệu mới nào thuộc loại cần che:
- today-mgr ×4: thẻ "Holds awaiting deposit / Giữ chỗ chờ cọc" giờ ghi "Past its deadline since 04/11/2026 14:43 – action needed / Quá hạn từ … – cần xử lý". Các mốc giờ trên đồng hồ giả dời 10 phút (14:33 thành 14:43, 14:53 thành 15:03…). Tên khách vẫn là tên seed đã kiểm (Gia đình anh Hưng, Anna Martin, Phạm Huy, Lê Minh), người dùng vẫn là Quân. Ba câu khách nhắn vẫn lấy từ `mocks/ops.ts`.
- deposit-shortfall-mgr ×4: hộp xác nhận cọc OTM-0146 bỏ khung cảnh báo "Deposit not enough"; giờ nhận tiền đổi thành 03:13 PM. Phần còn lại không đổi: 200000 tiền mặt, "Transfer reference: OTM0146" (mã đơn, không phải số tài khoản), lý do để trống. Không có QR, số tài khoản hay số hoa hồng. Danh sách đơn phía sau vẫn là các tên seed đã kiểm ở mục 3.

| # | Ảnh | Kết quả |
|---|---|---|
| 1 | today-mgr-en-1366 | ĐẠT |
| 2 | today-mgr-en-1440 | ĐẠT |
| 3 | today-mgr-vi-1366 | ĐẠT |
| 4 | today-mgr-vi-1440 | ĐẠT |
| 5 | deposit-shortfall-mgr-en-1366 | ĐẠT |
| 6 | deposit-shortfall-mgr-en-1440 | ĐẠT |
| 7 | deposit-shortfall-mgr-vi-1366 | ĐẠT |
| 8 | deposit-shortfall-mgr-vi-1440 | ĐẠT |

Kiểm đủ các mục: không có số điện thoại, email, số giấy tờ, số tài khoản ngân hàng, mã QR, số hoa hồng, IP hay URL nội bộ (ảnh chụp vùng trang, không có thanh địa chỉ), không có thông tin đăng nhập. Các giả định ở mục 4 vẫn áp dụng. Nếu có commit nào sau `170aaa16` đổi ảnh, phải kiểm che lại những ảnh đổi sha.
