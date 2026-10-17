# Demo lần 1 – Điều đã biết chưa xong và giới hạn của bản demo

> Người soạn: UXR · 17/10/2026 · v1.1 (bổ sung sau khi UXR tự bấm đủ 10 kịch bản) · Đọc 2 phút **trước** khi làm theo `demo-1-guide.md`. Những điều dưới đây **không cần ghi vào phiếu** – trừ khi anh/chị muốn đổi thứ tự ưu tiên.

## A. Giới hạn của bản demo (cách dựng, không phải lỗi)
| Giới hạn | Nghĩa là |
|---|---|
| **Chỉ chạy trên máy Mac này** (localhost) | Điện thoại, máy khác không mở được, kể cả cùng Wi-Fi. Muốn xem cỡ điện thoại: Chrome → Cmd+Option+I → biểu tượng điện thoại. Thử trên điện thoại thật cần máy chủ chạy thử (staging) – đang chờ anh/chị báo VPS + tên miền. |
| **Dữ liệu giả**, dựng quanh ngày chạy lệnh | Không nhập dữ liệu thật của khách (CCCD, hộ chiếu, SĐT, số tài khoản). Sang ngày khác hoặc muốn làm lại: chạy lệnh làm mới (xóa mọi thao tác đã làm). |
| **Đồng hồ thật** | Giữ chỗ đếm ngược thật và có thể tự hết hạn trong lúc thử (D5 hết hạn khoảng 5 giờ sau lúc chạy lệnh – nên chạy lệnh ngay trước khi thử); giờ nhận 14:00, ân hạn trả 12:30, sau 18:00 là thêm đêm; "khách không đến" chỉ đánh dấu được sau giờ quy định buổi tối. Không nên thử từ 00:00 đến 06:00. |
| **Không gửi gì ra ngoài** | Không SMS, email, Zalo (văn bản báo giá chỉ để sao chép). Không gọi OTA, không TTLock (mã cửa lễ tân tạo tay trên app khóa, OTTIMO không lưu), không MISA. Bảng dữ liệu khai báo lưu trú chỉ để sao chép – **đừng dán lên cổng khai báo thật**. |
| **VietQR dùng tài khoản nhận anh/chị ghi trong `product/.env`** | OPS cài sẵn 3 dòng đó vào Tham số (không in ra đâu). Mã QR đúng chuẩn ngân hàng, nhưng app không tự biết tiền đã về: lễ tân bấm "Đã thấy tiền về", khoản đó chờ quản lý/chủ đầu tư đối soát với sao kê. Nếu đó là tài khoản thật, quét sẽ thấy đúng tên chủ tài khoản – chỉ quét để xem, **không chuyển tiền**. |
| **Đăng nhập, duyệt bằng mật khẩu** | PIN duyệt và xác thực 2 bước có ở Round 3. Sai mật khẩu 5 lần → khóa 15 phút; đăng nhập quá nhiều lần liên tục → "thử quá nhiều lần", chờ 15 phút. |
| **Tiếng Nga trên trang khách** | Có tiếng Nga, nhưng phần thông báo dữ liệu và câu đồng ý lưu ảnh đang hiện tiếng Anh tới khi người bản ngữ duyệt bản dịch (không dùng dịch máy cho câu pháp lý). Desk có tiếng Việt và tiếng Anh. |
| **Tốc độ** | Chạy trên máy cá nhân, không đại diện cho máy chủ thật. |
| **Dữ liệu dựng lùi ngày** | Các lượt ở "đã bắt đầu trước hôm nay" được dựng sẵn, nên màn **Giấy tờ & khai báo** có nhiều đơn mẫu "Thiếu người", "Đã quá hạn … giờ"; tab **Chờ đối soát** có sẵn 2 khoản mẫu; danh sách **Thiết bị được cấp** có vài máy của đội (qa-desk-01, qa-tablet-night). Đó là dữ liệu mẫu, không phải lỗi. |
| **App nhân viên 8182** | Hiện chỉ là khung trống (app điện thoại cho buồng phòng, bảo trì có ở Sprint 4). Mọi vai đăng nhập ở Desk 8181. |

## B. Chưa làm – đừng tìm (đã có trong kế hoạch)
| Phần | Khi nào |
|---|---|
| Màn **Hôm nay** (danh sách đến/đi, "Cần chú ý"), **Tổng quan** chủ đầu tư (công suất, doanh thu đêm nay) | Sprint 4 – Round 2 |
| **App buồng phòng & bảo trì** trên điện thoại (việc hôm nay, dọn, kiểm phòng, báo sự cố, phiếu sửa). Vì vậy trạng thái buồng trên sơ đồ phòng chưa đổi theo việc dọn | Sprint 4 – Round 2 |
| **Khách gửi yêu cầu** qua trang khách, trang QR đặt trong phòng | Sprint 4 – Round 2 |
| **Ghi công nợ** khi trả phòng (quản lý/chủ đầu tư) | Sprint 4 – Round 2 |
| **Xin miễn phí (FOC)** cho phụ thu trả muộn, dòng phát sinh, minibar (hiện chỉ xin được cho phụ thu nhận sớm lúc nhận phòng) | Sprint 4 – Round 2 |
| Nút **"Điều chỉnh dòng"** trên bill và **"Đảo giao dịch thu"** cho quản lý/chủ đầu tư (nhật ký tiền vẫn xem được) | Sprint 4 – Round 2 |
| **Mã VietQR cho tiền cọc** ngay sau khi giữ chỗ (hiện VietQR chỉ có ở bước trả phòng) | Sprint 4 – Round 2 |
| **Xem lại bill** của đơn đã trả phòng, **ô ảnh biên nhận** khi CTV báo đã chuyển cọc | Sprint 4 – Round 2 |
| **Trả phòng sớm** | Sprint 4 nếu kịp, không thì Round 3 |
| Quét QR CCCD / đọc dòng mã hộ chiếu | Round 3 |
| **Web đặt phòng trực tiếp** cho khách | Round 3 |
| **Hợp đồng dài hạn đầy đủ** trong app (báo giá dài hạn, lịch thu theo kỳ, nhắc gia hạn), điện nước, báo cáo tháng. Round 2 chỉ có "đơn dài hạn nhập tay" để giữ phòng trên sơ đồ | Round 3 |
| Mã cửa trên trang khách, khách tự xem bill, xác minh khách bằng mã OTP | Round 3 |
| Đơn nhóm nhiều căn, đóng ca/bàn giao tiền | Round 3 |
| Kết nối thật: OTA / channel manager, VNPay / MoMo, khóa cửa TTLock, MISA / hóa đơn điện tử, cổng khai báo lưu trú, Zalo / email | Round 3 trở đi – cần tài khoản của anh/chị (ESC-009, ESC-010) |

## C. Lỗi đội đã biết khi giao bản demo
> ORC soạn 17/10 từ danh sách việc dời sang Sprint 4 (`s4-carryover.md`) và sổ lỗi QA; QC rà lại và sửa ở cổng Sprint 3 (17/10). UXR bổ sung 17/10 trưa sau khi tự bấm đủ 10 kịch bản trên bản demo (các dòng ghi **mới**; QA đang ghi vào sổ lỗi, ORC sẽ báo lại lịch sửa). Anh/chị gặp các lỗi này thì **không cần ghi lại**. "KB" là số kịch bản trong hướng dẫn.

**Ba chỗ đang vướng (hướng dẫn đã ghi sẵn cách đi tiếp, nếu có):**

| Gặp khi | Biểu hiện | Cách đi tiếp | Khi nào sửa |
|---|---|---|---|
| **mới** · KB4 – bước Giấy tờ, nút **Nhập tay** | Nhập đủ rồi bấm **Lưu giấy tờ** vẫn báo "Bắt buộc", không lưu được. Lễ tân không nhập được giấy tờ cho khách đến quầy | Gửi ảnh giấy tờ qua link check-in online của đơn (cửa sổ ẩn danh), rồi trên Desk bấm **Sửa** ở dòng giấy tờ để điền số và thông tin (KB4 bước 2) | Đang xếp lịch – ưu tiên cao |
| **mới** · KB6 – **Gia hạn** hoặc **Thêm người** trên các đơn đang ở có sẵn (D4 và các đơn dựng lùi ngày) | Báo "Máy chủ đang gặp sự cố…". Nguyên nhân ở cách dựng bản demo: mỗi lần khởi động lại, bản demo không đọc lại được giấy tờ đã lưu trước đó. Cũng vì vậy **không tắt/bật lại Docker hay máy giữa buổi** – giấy tờ đã nhập trước lúc đó sẽ không mở lại được | Làm KB6 trên D1 (đơn anh/chị vừa nhận phòng ở KB4) | Đang xếp lịch (OPS) – trước buổi thử |
| **mới** · KB8 – chi tiền hoàn (tiền mặt hay chuyển khoản) | Đính **ảnh chứng từ** thì báo "Còn {n} ô cần sửa" (ảnh không tải lên được); không đính thì app không cho ghi. Vì vậy **chưa ghi được khoản đã hoàn** – kể cả vai chủ đầu tư. Cùng lỗi: ảnh bằng chứng khi thêm phát sinh "hư hỏng, mất đồ" | Chưa có – xem đường đi và việc chặn quyền, dừng ở bước lưu | Đang xếp lịch – ưu tiên cao |

**Lỗi khác:**

| Gặp khi | Biểu hiện | Khi nào sửa |
|---|---|---|
| **mới** · KB1, KB3, KB8 – khung chi tiết đơn, phần Folio | Dòng **"Đã thu"** tính sai khi đơn đang giữ chỗ (D5 ghi "Đã thu −1.416.000", "Còn phải thu 0 đ" dù chưa cọc), khi có phụ thu/phát sinh, hoặc khi đơn đã hủy. Số đúng: xem màn Trả phòng, Phiếu thanh toán, Nhật ký tiền | Đang xếp lịch |
| **mới** · KB8 – hộp **Hủy đơn** khi được hoàn 100 % cọc | Hộp ghi "Đơn chưa thu tiền nên không có phí hủy hay khoản hoàn" dù đơn đã cọc. App vẫn tạo đúng yêu cầu hoàn (xem Nhật ký tiền › Hoàn tiền) – chỉ là câu báo sai, lễ tân dễ báo nhầm cho khách | Đang xếp lịch |
| **mới** · KB8 – Lễ tân trưởng mở **Hoàn tiền** | Không thấy khoản hoàn quản lý đã duyệt ("Không có khoản hoàn nào cần xử lý"), nên chưa chi hoàn tiền mặt được bằng vai này | Đang xếp lịch |
| **mới** · KB8 – Quản lý tự chi khoản mình vừa duyệt | App chặn đúng, nhưng câu báo là "Máy chủ đang gặp sự cố…" thay vì nói rõ "người duyệt không được tự chi" | Đang xếp lịch |
| **mới** · KB8 – nhập nơi nhận hoàn chuyển khoản | Ô **Ngân hàng nhận** chỉ nhận mã BIN 6 số của ngân hàng (ví dụ 970436), gõ tên ngân hàng sẽ bị xóa rồi báo "Bắt buộc"; chưa có danh sách chọn ngân hàng | Đang xếp lịch |
| **mới** · KB6 – thêm người lớn vượt định mức khi khách đang ở | App báo "Giờ này có phụ thu – tick 'Tôi đã báo khách…' hoặc xin miễn" nhưng không có ô để tick và không nêu số tiền, nên chưa thêm được | Đang xếp lịch |
| **mới** · KB2 – chọn căn đang khóa rồi bấm Tạo đơn | Bị chặn đúng, nhưng câu báo còn ký hiệu `{room}`, `{from}`, `{to}` thay cho số căn và ngày | Đang xếp lịch |
| **mới** · KB2 – sau **Tạo nhanh khách** | Ô Khách đứng tên có thể vẫn hiện chữ đỏ "Bắt buộc" dù khách đã được chọn; bấm Tạo đơn vẫn được | Đang xếp lịch |
| **mới** · KB2 – nút **Dùng căn …** khi đặt trùng | Bấm là tạo đơn ngay ở căn đó, giá tính lại theo căn mới; lễ tân chưa được xem lại giá trước khi tạo | Chờ UXD/PO xem lại |
| **mới** · **Đơn đặt phòng** | Ô Tìm kiếm chỉ tìm theo mã đơn, mã OTA, mã khách (chưa theo tên); cột "Còn phải thu" đang trống | Đang xếp lịch |
| **mới** · sau khi xác nhận cọc, đóng hộp link check-in… | Phím Esc không đóng khung chi tiết đơn – dùng nút X | Đang xếp lịch |
| **mới** · KB3 – CTV gửi báo giá | Ngôn ngữ gửi khách mới có Tiếng Việt và English (chưa có tiếng Nga); lễ tân xác nhận cọc chưa thấy số tiền, ghi chú CTV đã báo | Chờ PO xác nhận phạm vi |
| **mới** · KB7 – nút **Giặt ủi** ở bước Phụ phí | Hộp "Thêm phát sinh" mở ra chưa chọn sẵn khoản – chọn lại "Giặt ủi (theo kg)" | Đang xếp lịch |
| KB3 – CTV bấm **Báo đã chuyển cọc** | Chưa có ô đính ảnh biên nhận: CTV chỉ báo số tiền. Bỏ qua phần "đính 1 ảnh" | Sprint 4 |
| KB3 – vừa giữ chỗ xong | Màn ghi "Mã QR … tạo ngay sau khi giữ chỗ" nhưng chưa có mã QR cọc, chỉ có số tiền và nội dung chuyển khoản. Mã VietQR đã có ở bước thu tiền khi trả phòng (KB7) | Sprint 4 |
| KB4 – nhận phòng sớm có phụ thu | Điều kiện "Đã thu đủ" chưa cộng phụ thu nhận sớm, nên app cho nhận phòng dù chưa thu khoản này. Khoản vẫn nằm trong phiếu thanh toán, và app đòi thu đủ lúc trả phòng | Sprint 4 |
| KB6 / hồ sơ khách – người đi cùng từng ở OTTIMO | App chưa tự nhận ra khách cũ qua số giấy tờ: lễ tân tìm hồ sơ cũ theo tên/SĐT, hoặc tạo hồ sơ mới. Hồ sơ khách chưa hiện 4 số cuối giấy tờ (màn nhận phòng và màn khai báo vẫn hiện) | Sprint 4 |
| KB7 – mở lại đơn đã trả phòng | Chưa có nút **Xem bill** để mở lại hoặc in lại phiếu đã chốt. Muốn in thì in ở bước 3, trước khi bấm Hoàn tất | Sprint 4 |
| Hủy đơn hoặc báo khách không đến, khi khách đã trả **thêm ngoài tiền cọc** (ví dụ phụ thu, dịch vụ) | Phần cọc được hoàn theo chính sách hủy thì app tự tạo yêu cầu hoàn (như ở KB8). Phần trả thêm thì chưa: lễ tân bấm **Yêu cầu hoàn …** trên chi tiết đơn | Sprint 4 |
| Dời căn cho đơn chưa đến (hoặc gán căn cho đơn OTA) sang căn có định mức người khác | Phụ thu thêm người không tự tính lại theo căn mới, nên có thể thu thừa hoặc thiếu. Xem lại phiếu thanh toán trước khi thu | Sprint 4 (ưu tiên) |
| Dời đơn chưa đến sang căn đắt hơn theo ý khách | Giá giữ như lúc đặt. Đây là chính sách đang chờ anh/chị quyết (ESC-019), không phải lỗi | Sau khi anh/chị quyết ESC-019 |
| Khách OTA đang ở đổi phòng từ lần thứ hai trở đi | Tiền chênh lệch có thể tính so với căn ngay trước, thay vì so với căn đặt ban đầu | Sprint 4 |
| Khách OTA đã gia hạn thêm đêm rồi xin đổi phòng, căn mới không trống đủ cả thời gian | App chặn và gợi ý căn khác; chưa có lựa chọn "chỉ chuyển tới hết đơn gốc" | Sprint 4 |
| Ảnh giấy tờ của khai báo chưa xác nhận tự xóa khi quá hạn | Màn khai báo chưa hiện dòng "Ảnh đã xóa lúc …". Ảnh vẫn đã bị xóa đúng hạn | Sprint 4 |
| Mở Desk (8181) và app nhân viên (8182) cùng lúc trong một trình duyệt | Đăng nhập bên này làm bên kia đổi người hoặc bị đăng xuất. Chỉ có ở bản demo trên máy; vai thứ hai dùng cửa sổ ẩn danh. (Ở bản demo này 8182 còn là khung trống nên chưa gặp) | Hết khi có máy chủ chạy thử (mỗi app một tên miền) |
| Bỏ một người khỏi đoàn khi khách đã gửi ảnh giấy tờ qua link check-in | Hệ thống có thể xóa nhầm ảnh của người **còn ở** và giữ ảnh của người đã bỏ (SEC-BE-53). Trong demo: chụp/gửi lại ảnh cho người còn ở | Sprint 4 – phải sửa trước khi dùng dữ liệu khách thật |
| *(Không gặp trong demo)* Miễn phí (FOC) trên tiền phòng hoặc phụ thu người, rồi đổi ngày, đổi căn, đổi số người, khôi phục đơn "không đến"; hủy đơn đã có dịch vụ chưa làm | Đội đã biết vài trường hợp hiếm: mất phần miễn phí, báo lỗi không lưu, hoặc dòng dịch vụ không tự bỏ. Desk hiện chỉ xin miễn được phụ thu nhận sớm và chỉ thêm dịch vụ khi khách đang ở, nên bản demo không đi tới các trường hợp này | Sprint 4 – sửa xong trước khi mở thêm nút xin miễn phí |
