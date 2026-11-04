# QA – Kiểm che dữ liệu ảnh PR #64 (P4-32 fe-checkout)

- Round 4 · Bước: Kiểm thử · Người kiểm: QA · Ngày: 04/11/2026
- PR: #64 `round-4: P4-32 fe-checkout`, head `558c2b013032010610f825bb370f25cdfd545ed1`. Đã xác nhận bằng `gh pr view 64 --json headRefOid`. Worktree `scratchpad/wt-p432` đứng đúng `558c2b01`, không có thay đổi chưa commit.
- Phạm vi: 6 ảnh `rounds/round-04/outputs/FE/screenshots/v1.0.4-p4-32-*.png`, cỡ 1366×900.
- **Kết luận: ĐẠT** – không có ảnh nào có vấn đề. Về mặt che dữ liệu, PR gộp được.

## 1. Đối chiếu bản trong PR

`gh pr view 64 --json files` liệt kê 6 ảnh, 4 tệp code và 1 tệp md. Tôi so `git ls-tree -r 558c2b01` với `git hash-object` của từng tệp trong worktree: 6/6 khớp. PR không sửa `mocks/*`.

| Ảnh | sha blob | Khớp |
|---|---|---|
| before-departure-en-1366 | 87b0e0d0 | Có |
| before-departure-vi-1366 | 128257bb | Có |
| bill-pending-refund-en-1366 | 2609a985 | Có |
| bill-pending-refund-vi-1366 | 73f5d675 | Có |
| result-pending-refund-en-1366 | adc3b461 | Có |
| result-pending-refund-vi-1366 | e21997a8 | Có |

## 2. Metadata PNG

Dùng cùng script đọc chunk như PR #60 (`python3 -I`, đặt trong scratchpad). Cả 6 ảnh chỉ có `IHDR`/`IDAT`/`IEND`. Không có `tEXt`/`zTXt`/`iTXt`/`eXIf`/`tIME`, và không có byte thừa sau `IEND`.

## 3. Xem từng ảnh

Dữ liệu trên ảnh là seed giả của mock MSW. FE ghi cách chụp ở `rounds/round-04/outputs/FE/v1.0.4-p4-32-fe-checkout.md` mục 4: vite chế độ mock, dữ liệu đặt qua `mockControl`/`server.use`.

| # | Ảnh | Nội dung nhìn thấy | Kết quả |
|---|---|---|---|
| 1 | before-departure-en | Màn trả phòng căn 402 · Kim Seo-yeon · OTM-0158. Thông báo "chưa tới ngày đi 07/11/2026", nút về đơn | ĐẠT |
| 2 | before-departure-vi | Như #1, tiếng Việt | ĐẠT |
| 3 | bill-pending-refund-en | Trả phòng căn 201 · Phạm Huy · OTM-0147. Folio 3 đêm × 820,000, đã thu 3,192,000, còn 0, chờ hoàn 732,000. Có công tắc hóa đơn công ty nhưng đang tắt, không có mã số thuế hay tên công ty | ĐẠT |
| 4 | bill-pending-refund-vi | Như #3, tiếng Việt | ĐẠT |
| 5 | result-pending-refund-en | Kết quả trả phòng: "Folio F26-000302", danh sách việc đã tạo, folio và dòng chờ hoàn 732,000 | ĐẠT |
| 6 | result-pending-refund-vi | Như #5, tiếng Việt ("Phiếu F26-000302") | ĐẠT |

## 4. Đối chiếu tiêu chí

| Mục | Kết quả |
|---|---|
| Tên khách | Kim Seo-yeon và Phạm Huy là seed (`mocks/reservations.ts` dòng 350 và 320, `mocks/ops.ts`, `mocks/stay.ts`) |
| Tên người dùng | "Hạnh · Receptionist / Lễ tân" là người dùng seed `qa.fd` (`mocks/seed.ts` dòng 80) |
| Số điện thoại, email, số giấy tờ | Không có |
| Số tài khoản ngân hàng, mã QR | Không có. Dòng chờ hoàn chỉ ghi số tiền, không có tài khoản nhận hoàn |
| Mã số thuế / thông tin hóa đơn công ty | Không có (công tắc tắt) |
| Số hoa hồng | Không có. Kênh Agoda/Airbnb không hiện trên các ảnh này |
| IP, URL nội bộ | Không có. Ảnh chụp vùng trang, không có thanh địa chỉ |
| Thông tin đăng nhập | Không có. Mục "xóa mã trên app khóa" chỉ là tên việc, không có mã khóa cửa |
| Số phiếu F26-000302, mã đơn OTM-0147/0158 | Mã nội bộ do mock sinh ra (`mocks/stay.ts` dòng 3306), không phải dữ liệu cá nhân |

## 5. Giả định và giới hạn

- Giả định tên trong mock là tên bịa. Các tên này đã có sẵn trên `main`.
- Đọc chữ bằng mắt trên ảnh gốc, không chạy OCR. Không có ô QR nào nên không cần đếm điểm ảnh.
- Nếu ảnh được chụp lại sau `558c2b01`, phải kiểm che lại những ảnh đổi sha.
- Không có lỗi, không tạo BUG, không cần ESC.

## Lượt 2 @ 56e9e72f

- Ngày 04/11/2026 tối · QA. Head mới `56e9e72f961faaef33fb5ed12d210a7eff4c096a` (`round-4: Phản hồi & sửa – P4-32 UXD cards 01–03, ARC cards 03–04`), đã xác nhận bằng `gh pr view 64 --json headRefOid`.
- **Kết luận: ĐẠT.** Không ảnh nào có vấn đề. Về mặt che dữ liệu, PR gộp được ở head này.

### Đối chiếu bản trong PR

- `gh pr view 64 --json files` có 8 ảnh. `git diff --name-status 558c2b01 56e9e72f`: 4 ảnh đổi (M), 2 ảnh mới (A). Hai ảnh `before-departure-*` giữ nguyên blob (`87b0e0d0`, `128257bb`), nên dùng kết quả lượt 1.
- Ảnh lấy thẳng từ blob của `git ls-tree -r 56e9e72f`, ra thư mục riêng trong scratchpad (`mask-pr64-r2/img/`). Không lấy từ worktree.

| Ảnh | sha blob | Đổi so với lượt 1 |
|---|---|---|
| bill-pending-refund-en-1366 | a8e80926 | Chụp lại |
| bill-pending-refund-vi-1366 | 7d9a41ce | Chụp lại |
| result-pending-refund-en-1366 | cd3dac4b | Chụp lại |
| result-pending-refund-vi-1366 | e04c042b | Chụp lại |
| bill-refund-unavailable-en-1366 | 440271ec | Mới |
| bill-refund-unavailable-vi-1366 | 94655406 | Mới |

### Metadata PNG

Đọc chunk bằng cùng script như lượt 1 (`python3 -I`, đặt trong scratchpad). Cả 6 ảnh cỡ 1366×900, chỉ có `IHDR`/`IDAT`/`IEND`. Không có `tEXt`/`zTXt`/`iTXt`/`eXIf`/`tIME`, không có byte thừa sau `IEND`.

### Xem từng ảnh

| # | Ảnh | Nội dung nhìn thấy | Kết quả |
|---|---|---|---|
| 1 | bill-pending-refund-vi | Trả phòng · Căn 201 · Phạm Huy · OTM-0147, bước ③. Folio 3 đêm × 820.000, đã thu −3.192.000, còn phải thu 0 đ. Dòng "Đang chờ hoàn cho khách 732.000 đ (yêu cầu từ Trả sớm)." và ghi chú "Số có thể giảm khi duyệt…". Công tắc hóa đơn công ty tắt. Nút "Hoàn tất trả phòng" | ĐẠT |
| 2 | bill-pending-refund-en | Như #1, tiếng Anh ("Refund pending for the guest: 732,000 VND…", "Complete check-out") | ĐẠT |
| 3 | result-pending-refund-vi | Màn Kết quả: "Đã trả phòng. Bill đã lưu.", Phiếu F26-000302, các việc đã tạo, folio và dòng chờ hoàn 732.000 đ | ĐẠT |
| 4 | result-pending-refund-en | Như #3, tiếng Anh ("Folio F26-000302") | ĐẠT |
| 5 | bill-refund-unavailable-vi | Như #1, nhưng thay dòng chờ hoàn là câu U5 "Chưa tải được khoản chờ hoàn từ Trả sớm. Hỏi quản lý trước khi báo khách." (chữ Stone, không đỏ, không nút). "Hoàn tất trả phòng" vẫn bật | ĐẠT |
| 6 | bill-refund-unavailable-en | Như #5, tiếng Anh ("Couldn't load the refund pending from Early departure. Ask a manager before telling the guest.") | ĐẠT |

### Đối chiếu tiêu chí

| Mục | Kết quả |
|---|---|
| Tên khách | Chỉ "Phạm Huy", tên seed như lượt 1 (`mocks/reservations.ts`) |
| Tên người dùng | "Hạnh · Lễ tân / Receptionist", người dùng seed `qa.fd` |
| Số điện thoại, email, số giấy tờ | Không có |
| Số tài khoản ngân hàng, mã QR | Không có. Dòng chờ hoàn và câu U5 chỉ có số tiền, không có nơi nhận hoàn |
| Mã số thuế / hóa đơn công ty | Không có (công tắc tắt) |
| Số hoa hồng, kênh OTA | Không có |
| IP, URL nội bộ, thanh địa chỉ | Không có (ảnh chụp vùng trang) |
| Thông tin đăng nhập, mã khóa cửa | Không có. "Xóa mã trên app khóa" chỉ là tên việc |
| Mã nội bộ (OTM-0147, F26-000302) | Mã mock sinh ra, không phải dữ liệu cá nhân |

### Ghi chú

- Diff `mocks/stay.ts` từ `558c2b01` tới `56e9e72f` chỉ đổi phạm vi lọc `approval-requests` theo FB-R4-ARC-FE-P432-03. Không thêm khách, email, số điện thoại hay số tài khoản.
- Chữ U5 trên ảnh #5/#6 khớp bản đổi chữ ngày 04/11 của UXD ("Hỏi quản lý…"). Câu không chỉ sang Nhật ký tiền.
- Đọc chữ bằng mắt trên ảnh gốc, không chạy OCR.
- Nếu ảnh được chụp lại sau `56e9e72f`, phải kiểm che lại những ảnh đổi sha.
- Không có lỗi, không tạo BUG, không cần ESC. Tệp chưa commit, ORC commit.
