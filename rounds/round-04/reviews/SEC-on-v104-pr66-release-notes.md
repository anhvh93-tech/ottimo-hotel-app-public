# SEC review – PR #66 release notes v1.0.4: quét bảo mật và dữ liệu

- Người review: SEC | Ngày: 05/11/2026 | Round 4 – Bước: **Review** (chỉ đọc)
- Đối tượng: `git diff origin/main...origin/v104/po-release-notes -- product/docs/release-notes.md`.
  - Head `99d103a001122a54d56b5130826867ef846beed6`, `origin/main` @ `2268b139`.
  - Kết quả: 1 tệp, +184/−4.
  - SEC cũng quét thông điệp của 9 commit trong khoảng, mô tả PR #66 và bình luận PR.
- Repo **công khai**. Tệp này không chép dữ liệu nhạy cảm nào, chỉ ghi vị trí.
- SEC chỉ tạo tệp này. Không commit, không push, không sửa decision-log.

---

## 0. Kết luận

- **#66: ĐẠT về bảo mật, gộp được.**
- Không có dữ liệu nhạy cảm (mục 1). Không có câu nào dạy nhân viên lách kiểm soát (mục 2).
- 1 Suggestion, không chặn gộp: FB-R4-SEC-PO-PR66-01. Gạch **Minibar khi đổi phòng** nên giữ đủ giới hạn của **Bỏ cả dòng** như sổ tay.
- Không ESC mới.

## 1. Quét dữ liệu

Cách quét:
- Lấy các dòng thêm (184 dòng), thông điệp commit, mô tả và bình luận PR.
- Lọc tìm: email, IP, URL hoặc host, số điện thoại, dãy từ 6 chữ số, chuỗi hex dài, từ khóa khóa, token, mật khẩu, mã đơn dạng `OTM-…`, từ khóa hoa hồng, thưởng, doanh thu, và mọi số "n %".
- Sau đó SEC đọc tay toàn bộ phần thêm.

| Nhóm | Kết quả |
|---|---|
| PII, tên khách, số giấy tờ, số điện thoại | Không có. Các tin thông báo được mô tả là "không ghi tên khách" |
| Email | Chỉ có tiền tố chung `booking@`, `info@`, `info+…@`, không kèm tên miền (mô tả quy tắc chặn, EM-09). Thông điệp commit chỉ có dòng ký `noreply@` |
| IP, host, URL | Không có trong tệp. URL duy nhất ở mô tả PR là dòng ký của công cụ. Không có tên host staging hay production |
| Mã đơn production | Không có. Không có mã `OTM-…` thật |
| Khóa, token, mật khẩu | Không có giá trị nào. Chữ "mật khẩu" chỉ mô tả cách đăng nhập và đặt lại 2 bước. `privacy_notice_version` = `privacy-2026-10-v2` là giá trị cấu hình công khai, không phải bí mật |
| Doanh thu | Không có. Lượt kiểm chỉ đọc trên production ghi "repo chỉ ghi số lượng" (dòng 103): đúng hướng |
| Hoa hồng | **Không có tỷ lệ hay số tiền.** Ba câu nhắc hoa hồng đều không có số: "Không gửi tỷ lệ hoa hồng cho đội"; "Hoa hồng nhập theo bảng nội bộ trên Desk, không có số mặc định trong mã – Hotfix H2" (dòng 179); "Sổ tay và 6 hướng dẫn không còn ghi tỷ lệ hoa hồng (#89)" (dòng 192) |
| Số tiền, tỷ lệ % | Chỉ có giá niêm yết và chính sách công khai: tổng kiểm báo giá Studio 2 đêm (1 số đúng, 1 số khi mức tăng cuối tuần còn bật), phụ thu người, hoàn 50 % / 100 %, mức tăng và mức giảm cũ đã bỏ (ESC-045) |
| Khác | Mã commit, số migration 0092–0095, tên tham số là thông tin kỹ thuật đã có trong repo. Giờ lên production của v1.0.3 không phải dữ liệu nhạy cảm |

## 2. Có dạy nhân viên lách kiểm soát không

SEC đọc từng cách làm ở **Giới hạn đã biết và cách làm ở quầy** và **Việc anh/chị làm**.

| Cách làm | Đánh giá |
|---|---|
| Đặt lại 2 bước (dòng thêm 51) | Chỉ chủ đầu tư, gặp tận mặt, ghi lý do, xác nhận bằng mật khẩu và mã. Desk đăng xuất mọi máy, thư báo tới người đó và mọi chủ đầu tư. Đúng |
| Lễ tân trưởng bắt buộc 2 bước nhưng Desk chưa ép | Chủ đầu tư nhìn tận mắt đã bật rồi mới giao việc. Đúng hướng, chờ v1.0.5 |
| Chấp nhận cọc thiếu; **Giờ nhận tiền** ghi lùi | Chỉ chủ đầu tư/quản lý, có lý do. Không ghi giờ sau bây giờ (SEC HOLDS-01). Đúng |
| Khách đi trước 06:00, quá 12:00 gõ **12:00** (dòng 135) | Như SEC lượt 4 của #89: không phải quyền mới. Desk đòi **Ghi chú giờ trả**, sổ giao ca ghi giờ rời thật lúc khách đi. "Lỡ gõ" giờ trước 06:00 thì không thu theo số sai. Đúng |
| Trả sớm báo trong ngày rời | Nơi nhận hoàn nhập trên máy đã cấp quyền. Đúng |
| Đơn Nội bộ | "Chỉ tạo khi chủ đầu tư hoặc quản lý đã đồng ý", ghi người cho. Không dùng FOC hay giảm giá đặc biệt 100 %. Không liên lạc được quản lý thì thu đủ, hoàn phần dư sau. Hướng chặt, đúng PR72-04 |
| Đơn quá ngày đi (dòng 151) | Giảm giá đặc biệt 100 % đêm thêm **qua duyệt** (quản lý tới 1 đêm, từ 2 đêm chủ đầu tư). Xóa mã cửa ngay, khai báo ngày rời thật. Đúng PR72-01/03 |
| Căn vẫn hiện có khách | Đổi căn, không dùng khóa OOO, báo quản lý. Nâng hạng vẫn đi theo xác nhận Desk đang chặn |
| Giá ngoài sàn–trần | "Hỏi quản lý khoảng sàn–trần". Không ghi số sàn–trần, không dạy gõ vượt |
| Không thấy yêu cầu hoàn do người khác tạo | Hỏi quản lý trước khi báo khách. Không nói "không có khoản hoàn". Ghi rõ đây là phân quyền có chủ ý. Đúng |
| Nhật ký bảo mật chưa có màn xem (dòng 156) | Nhắn ORC tên đăng nhập, không kèm lý do. Kênh chat, không phải repo. Chấp nhận |
| App nhân viên không vào được | Kiểm căn bằng mắt rồi bấm **Làm xong**, ghi sổ giao ca. Đây là cách làm có từ trước |
| HTML sổ tay (dòng 192) | "Bản HTML sổ tay không lưu trong repo … UXD dựng lại từ sổ tay mới trước khi gửi ai." Khớp FB-R4-SEC-UXD-HTML-01 (a) |
| **Minibar khi đổi phòng** (dòng 145) | Không dạy lách, nhưng thiếu giới hạn: xem thẻ 01 |

## 3. Thẻ

### FB-R4-SEC-PO-PR66-01
- Mức độ: **Suggestion**. Không chặn gộp. Sửa cùng lượt nếu PO còn sửa #66.
- Vị trí: `product/docs/release-notes.md` dòng 145, gạch **Minibar khi đổi phòng**, câu "Đơn đã lỡ có dòng **Thêm phát sinh** minibar căn cũ: trước khi bấm **Trả phòng**, **Bỏ cả dòng** đó …, ghi sổ giao ca."
- Vấn đề:
  - Đây là phần nhân viên đọc như cách làm ở quầy.
  - Câu chỉ cho lễ tân nút **Bỏ cả dòng** mà thiếu hai giới hạn sổ tay đã chốt ở PR72-05: không dùng để miễn hay giảm cho khách, và quản lý xem lại.
  - Dòng 97 có "chỉ dòng trùng đó", nhưng nằm ở bảng **Sổ tay và tài liệu**, không ở cách làm.
  - Mã vẫn cho lễ tân bỏ mọi dòng phát sinh trên folio đang mở (A31-01, v1.0.5).
- Vì sao quan trọng: release notes là bản nhiều người đọc trong tuần lên bản. Câu ngắn hơn sổ tay dễ được hiểu thành "Bỏ cả dòng là cách sửa folio nhanh".
- Đề xuất sửa: thay câu bằng "… **Bỏ cả dòng** đó (chỉ dòng trùng này) với lý do "Trùng minibar tủ căn cũ", ghi sổ giao ca mã đơn, số tiền. Không dùng **Bỏ cả dòng** để miễn hay giảm cho khách. Quản lý xem lại các lần bỏ dòng này."
- Trạng thái: Open

## 4. Ghi chú cho ORC

- #66 gộp được. Thẻ 01 là Suggestion. PO có thể sửa trong lượt cuối của #66, hoặc bỏ qua vì dòng 145 đã trỏ tới sổ tay 2.14.
- Không ESC mới.

## 5. Dòng decision-log đề xuất (ORC ghi khi commit, SEC không sửa decision-log)

`| 2026-11-05 | 4 | **SEC – PR #66 release notes v1.0.4 (v104/po-release-notes @ 99d103a0): ĐẠT về bảo mật, gộp được** (rounds/round-04/reviews/SEC-on-v104-pr66-release-notes.md): quét dòng thêm, 9 thông điệp commit, mô tả và bình luận PR – không PII, không email thật (chỉ tiền tố booking@/info@ trong quy tắc chặn), không IP/host/URL, không mã đơn production, không khóa/token, không doanh thu, không tỷ lệ hay tiền hoa hồng; số tiền chỉ là giá niêm yết và chính sách công khai. Không câu nào dạy lách kiểm soát: đặt lại 2 bước chỉ chủ đầu tư gặp tận mặt, giảm đêm quá ngày đi qua duyệt, đơn Nội bộ cần người cho, gõ 12:00 có ghi chú bắt buộc. 1 Suggestion FB-R4-SEC-PO-PR66-01: gạch Minibar khi đổi phòng thêm "chỉ dòng trùng, không dùng để miễn/giảm, quản lý xem lại" như sổ tay. Không ESC mới. | SEC | Release notes là bản nhiều người đọc trên repo công khai; nội dung sạch, cách làm ở quầy giữ đúng thang duyệt. |`
