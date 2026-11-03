# BA review – Release notes mục v1.0.3 (đối chiếu sổ tay 1.9 / bộ hướng dẫn 1.7)

- Người review: BA | Round 4 – Review (QC v1.0.3 ĐK5, phần BA) | Ngày: 03/11/2026
- Tác giả: PO. Tệp: `product/docs/release-notes.md` mục **v1.0.3 – Email nhận thông báo bảo mật** (chưa commit; đọc bằng `git diff` trên checkout chính).
- Đối chiếu với: sổ tay `product/docs/manual/user-manual-v1.0.md` bản nội dung 1.9 (mục 0.3a, 0.5, 1.1, 1.5, 1.7, 1.16, 3.1, 3.6, 4.1, 5.0) và bộ hướng dẫn 1.7 (`01` 1.6a, 1.7, 1.9, 2.2, 10.1, 10.2, 15.1; `02` 1.3, 1.5, 1.6, 1.8; `03` 1.6; `04` 1.5; `05` 1.5). Cả hai BA vừa sửa theo DOM/ARC M18 và RN103-02. Câu chữ Desk lấy từ `product/design/copy/strings-vi.json`, tiêu đề thư lấy từ `product/integrations/notification/email-templates.ts`.
- Phạm vi: chữ trong release notes có khớp sổ tay ở 5 điểm ORC nêu không: menu, 4 loại thư, `info@` và `booking@`, 2 bước, thứ tự nhập email. BA không sửa release notes.

## Kết luận: **ĐẠT**

Năm điểm chính khớp sổ tay:

| Điểm | Release notes | Sổ tay 1.9 / bộ 1.7 | KQ |
|---|---|---|---|
| Menu | **tên của mình → Bảo mật tài khoản** (trước là **Xác thực 2 bước**) | Như vậy (0.2, `01` 1.6) | Khớp |
| 4 loại thư | Liệt kê đủ 4 việc. Thư cọc "OTTIMO – Notice: …" không có chữ Security notice, đừng lọc theo chữ này. Dẫn tới bảng **Thư nào – làm gì** | Bảng 4 dòng (0.3a, `01` 1.6a) | Khớp. Thiếu một bước, xem thẻ 03 |
| `info@` / `booking@` | Desk chỉ chặn `info@`. `booking@`, Gmail OTA, hộp thư quầy: không dùng. Hộp thư một người đọc, không mở trên máy quầy | Như vậy, thêm "không tự chuyển tiếp" và thời điểm Desk báo | Khớp. Xem S1 |
| 2 bước, người dùng app nhân viên | "Không bật ở v1.0.x". Câu **Lỡ bật** giống từng chữ với sổ tay | `01` 1.9 bước 8, `02` 1.8, `03` 1.6, `04` 1.5, sổ tay 1.5 bước 7, 3.1 | Khớp |
| Thứ tự nhập email | Chủ đầu tư nhập trước, người trực sau. Thư báo email người trực là bình thường. Báo "đã nhận", không dán địa chỉ. B1–B6 tiếp tục tới khi đội bảo mật báo bỏ | Sổ tay 1.16, `01` 15.1, `02` 1.3/1.6 | Khớp |

Còn 3 Minor và 3 Suggestion về chữ. Không có chỗ nào làm người đọc làm sai việc liên quan tiền hay bảo mật. Đề nghị PO sửa Minor 01–03 cùng lượt ĐK5, trước khi ORC báo INV "v1.0.3 đã lên". Đây không phải điều kiện chặn.

## Thẻ feedback

### FB-R4-BA-PO-RN103-01
- Mức độ: Minor
- Vị trí: release notes v1.0.3, "Việc anh/chị làm sau khi lên", bước 1 ("… → **Lưu email** → nhập mật khẩu và mã 6 số").
- Vấn đề: Desk chạy theo thứ tự khác. Lần đầu bấm **Thêm email** (`secmail.add`), Desk mở hộp **Lưu email nhận thông báo bảo mật**, nhập mật khẩu và mã, rồi mới bấm **Lưu email** (`secmail.save`). Sổ tay 0.3a bước 2–3 và `01` 1.6a viết đúng thứ tự này.
- Vì sao quan trọng: đây là việc đầu tiên INV làm trên v1.0.3. Tìm nút **Lưu email** không thấy (vì nút đang là **Thêm email**) thì dễ tưởng Desk chưa lên bản.
- Đề xuất sửa: "Desk → **tên của mình → Bảo mật tài khoản** → nhập **hộp thư riêng** … vào ô **Email** → bấm **Thêm email** → trong hộp xác nhận, đọc lại **Địa chỉ mới**, nhập mật khẩu và mã 6 số → **Lưu email**."
- Trạng thái: Open

### FB-R4-BA-PO-RN103-02
- Mức độ: Minor
- Vị trí: release notes v1.0.3, gạch "Áp dụng từ khi anh/chị báo…" (danh sách mục hướng dẫn).
- Vấn đề: danh sách chưa khớp các mục đã sửa.
  - `01`: thiếu 10.1, là khung lỗi có tiêu đề thư cọc "Notice:".
  - Sổ tay gốc chỉ ghi 0.2, 0.3a, 0.4, 1.5. Thiếu 0.5 (máy quầy không đăng nhập hộp thư riêng), 1.1 (kiểm sáng tới khi đội báo bỏ), 1.7, 1.16 (thứ tự ngày lên bản), 3.1, 3.6, 4.1 (không bật 2 bước) và 5.0 (thuật ngữ Security notice).
  - Không ghi số bản của bộ hướng dẫn (1.7).
- Vì sao quan trọng: INV đào tạo theo danh sách này. Thiếu 1.16 hay 3.1 thì người đọc sổ tay gốc bỏ qua đúng hai việc ORC muốn dặn ngày lên bản.
- Đề xuất sửa: "Bộ hướng dẫn bản 1.7 – `01` mục 1.6a, 1.7, 1.9, 2.2, 10.1, 10.2, 15.1; `02` 1.3, 1.5, 1.6, 1.8; `03` 1.6; `04` 1.5; `05` 1.5. Sổ tay gốc bản nội dung 1.9 – mục 0.2, 0.3a, 0.4, 0.5, 1.1, 1.5, 1.7, 1.16, 3.1, 3.6, 4.1, 5.0."
- Trạng thái: Open

### FB-R4-BA-PO-RN103-03
- Mức độ: Minor
- Vị trí: bảng "Có trong bản này", dòng **Email nhận thông báo bảo mật**, câu cuối ("Với thư tài khoản nhận cọc: **Hủy lịch**, đổi mật khẩu, báo đội").
- Vấn đề: sổ tay 1.7 và `01` 10.2 có thêm hai bước: **tạo bộ mã khôi phục mới**, và lễ tân **ngừng gửi mã VietQR** tới khi chủ đầu tư xác nhận. Release notes bỏ cả hai.
- Vì sao quan trọng: đây là thư về tiền. Ai đã đổi được tài khoản nhận thì có thể đang giữ mã khôi phục. Còn nếu lễ tân vẫn gửi mã VietQR trong lúc chờ xác nhận, tiền khách có thể vào tài khoản lạ.
- Đề xuất sửa: "… **Hủy lịch**, đổi mật khẩu, tạo bộ mã khôi phục mới, báo đội. Lễ tân ngừng gửi mã VietQR tới khi anh/chị xác nhận (`01` mục 10.2, sổ tay 1.7)."
- Trạng thái: Open

### FB-R4-BA-PO-RN103-S1
- Mức độ: Suggestion
- Vị trí: dòng **Chặn `info@`**, và "Việc anh/chị làm sau khi lên" bước 3 (thử `info@` một lần).
- Vấn đề: chưa nói Desk báo câu này **sau khi** bấm **Lưu email** trong hộp xác nhận, và mật khẩu, mã **không bị tính là sai** (ARC-M18-01, sổ tay 0.3a bước 3). Dòng này cũng thiếu ý "không cài tự chuyển tiếp" (DOM M18-04).
- Đề xuất sửa: thêm "Câu báo hiện sau khi bấm **Lưu email**; mật khẩu và mã không bị tính là sai. Hộp thư không tự chuyển tiếp sang hộp khác."
- Trạng thái: Open

### FB-R4-BA-PO-RN103-S2
- Mức độ: Suggestion
- Vị trí: "Việc anh/chị làm sau khi lên" bước 2 ("đánh dấu 'Không phải spam'", "rồi báo đội").
- Vấn đề: sổ tay và bộ hướng dẫn viết **Không phải thư rác**. Sổ tay còn có bước "kiểm lại địa chỉ" trước khi báo đội, khớp câu Desk "Sau 15 phút chưa thấy thư, hãy xem mục Spam hoặc kiểm tra lại địa chỉ."
- Đề xuất sửa: "… xem mục Spam (thấy thì đánh dấu **Không phải thư rác**), kiểm lại địa chỉ, rồi báo đội."
- Trạng thái: Open

### FB-R4-BA-PO-RN103-S3
- Mức độ: Suggestion
- Vị trí: "Thay đổi cấu trúc dữ liệu", gạch 2 (lùi phần mềm). Dòng **Ai đặt email của ai**.
- Vấn đề:
  1. Sổ tay 0.3a (ARC-M18-04) nói khi lùi bản: menu về tên **Xác thực 2 bước**, khối email tạm ẩn, **email đã lưu vẫn dùng, thư báo vẫn tới, không cần nhập lại**. Release notes chỉ có "Desk không có khối email: anh/chị không lưu email". Người đọc có thể tưởng phải nhập lại email sau khi lên lại.
  2. Release notes chưa có ý "lễ tân trưởng: không bắt buộc, khuyến khích có email" (sổ tay 0.3a, DOM M18-09).
- Đề xuất sửa: (1) thêm "Email đã lưu vẫn dùng, thư báo bảo mật vẫn tới, không cần nhập lại." (2) Ở dòng **Email nhận thông báo bảo mật** thêm "Lễ tân trưởng: khuyến khích".
- Trạng thái: Open

## Ghi chú cho ORC
- BA không thấy release notes và sổ tay mâu thuẫn ở số liệu hay quy tắc nào.
- Có một khác biệt nằm ngoài release notes, ORC nên biết. Người trực (vai quản lý) mất cả điện thoại lẫn mã khôi phục thì dùng cách **tài khoản mới** (release notes "Giới hạn đã biết", `01` 1.7). Người dùng app nhân viên lỡ bật 2 bước rồi mất máy thì dùng cách **báo chủ đầu tư, chủ đầu tư báo đội** (lệnh đặt lại của đội, ARC RN103-02). Hai cách khác nhau là có chủ ý: release notes ghi "đội bảo mật đang chốt lại". Nếu SEC chốt dùng lệnh của đội cho cả vai quản lý thì BA sửa `01` 1.7 và sổ tay 0.4 cùng lúc với PO sửa release notes.
- **Cập nhật 03/11 (sau SEC chốt RN103-05):** khác biệt trên đã hết. SEC chọn một cách cho cả hai nhóm: chủ đầu tư gặp tận mặt, khóa tài khoản cũ, tạo tài khoản mới theo `01` mục 1.7. BA đã sửa `01` 1.7, 1.9; `02` 1.7, 1.8; `03` 1.6; `04` 1.5; sổ tay gốc 0.4, 1.5, 3.1. Release notes dòng RN103-02 và BUG-R4-020 cần PO sửa cùng ý (SEC ý 1).

## Điểm làm tốt
1. Câu **Lỡ bật** và câu "Thư đổi tài khoản nhận cọc có tiêu đề 'OTTIMO – Notice: …', không có chữ Security notice" giống từng chữ với sổ tay. Như vậy INV và nhân viên đọc cùng một câu.
2. Thứ tự "anh/chị nhập trước, người trực nhập sau" có kèm lý do (thư không có người nhận, đội phải chờ thêm). Rõ hơn bản trong sổ tay.
3. Phần lùi bản nói rõ "thư không tới **không** phải lý do lùi phần mềm". Câu này giúp INV không yêu cầu lùi bản sai lúc.

---

## Phản hồi PO

- Người phản hồi: PO | Round 4 – Phản hồi & sửa (QC v1.0.3 ĐK5) | Ngày: 03/11/2026
- Tệp đã sửa: `product/docs/release-notes.md` mục v1.0.3. Chưa commit; ORC commit cùng bước. Đã đối chiếu chuỗi `secmail.add`, `secmail.save`, `secmail.new_label` trong `product/design/copy/strings-vi.json` và sổ tay 0.3a (khung lùi bản).

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R4-BA-PO-RN103-01 | **Done** | Bước 1 theo đúng thứ tự Desk: nhập vào ô **Email** → **Thêm email** → hộp xác nhận, đọc lại **Địa chỉ mới**, nhập mật khẩu và mã 6 số → **Lưu email** |
| FB-R4-BA-PO-RN103-02 | **Done** | Ghi "bộ hướng dẫn theo bộ phận bản 1.7"; `01` thêm 10.1; sổ tay gốc bản nội dung 1.9 thêm 0.5, 1.1, 1.7, 1.16, 3.1, 3.6, 4.1, 5.0 |
| FB-R4-BA-PO-RN103-03 | **Done** | Thư tài khoản nhận cọc: thêm "tạo bộ mã khôi phục mới" và "Lễ tân **ngừng gửi mã VietQR** tới khi anh/chị xác nhận" |
| FB-R4-BA-PO-RN103-S1 | **Done** | Dòng **Chặn `info@`** thêm: không tự chuyển tiếp sang hộp khác; câu báo hiện sau khi bấm **Lưu email** trong hộp xác nhận, mật khẩu và mã không bị tính là sai |
| FB-R4-BA-PO-RN103-S2 | **Done** | Bước 2 đổi thành **Không phải thư rác**, thêm "kiểm lại địa chỉ" trước khi báo đội |
| FB-R4-BA-PO-RN103-S3 | **Done** | (1) Phần lùi bản: menu trở lại **Xác thực 2 bước**, khối email tạm ẩn; email đã lưu vẫn dùng, thư báo vẫn tới, không cần nhập lại. (2) Dòng **Email nhận thông báo bảo mật** thêm "Lễ tân trưởng: không bắt buộc, khuyến khích có" |

Về ghi chú cho ORC (hai cách khôi phục 2 bước): SEC đã chốt 03/11 (cuối `DOM-on-release-notes-v1.0.3.md`, mục "RN103-05 – SEC chốt"): cách `01` 1.7 là cách duy nhất ở v1.0.3, cho cả vai quản lý và người dùng app lỡ bật rồi mất máy. Release notes đã bỏ "chủ đầu tư báo đội" và câu "đội bảo mật đang chốt lại". BA sửa `01` 1.7 bước (4), `03` 1.6, `04` 1.5, `02` 1.8 theo ý 2 của SEC khi ORC giao.
