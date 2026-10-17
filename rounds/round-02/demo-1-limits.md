# Demo lần 1 – Điều đã biết chưa xong và giới hạn của bản demo

> Người soạn: UXR · 17/10/2026 · v1.0 · Đọc 2 phút **trước** khi làm theo `demo-1-guide.md`. Những điều dưới đây **không cần ghi vào phiếu** – trừ khi anh/chị muốn đổi thứ tự ưu tiên.

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
> ORC soạn 17/10 từ danh sách việc dời sang Sprint 4 (`s4-carryover.md`) và sổ lỗi QA; QC rà lại và sửa ở cổng Sprint 3 (17/10). Anh/chị gặp các lỗi này thì **không cần ghi lại**. "KB" là số kịch bản trong hướng dẫn.

| Gặp khi | Biểu hiện | Khi nào sửa |
|---|---|---|
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
| Mở Desk (8181) và app nhân viên (8182) cùng lúc trong một trình duyệt | Đăng nhập bên này làm bên kia đổi người hoặc bị đăng xuất. Chỉ có ở bản demo trên máy; vai thứ hai dùng cửa sổ ẩn danh | Hết khi có máy chủ chạy thử (mỗi app một tên miền) |
| *(Không gặp trong demo)* Miễn phí (FOC) trên tiền phòng hoặc phụ thu người, rồi đổi ngày, đổi căn, đổi số người, khôi phục đơn "không đến"; hủy đơn đã có dịch vụ chưa làm | Đội đã biết vài trường hợp hiếm: mất phần miễn phí, báo lỗi không lưu, hoặc dòng dịch vụ không tự bỏ. Desk hiện chỉ xin miễn được phụ thu nhận sớm và chỉ thêm dịch vụ khi khách đang ở, nên bản demo không đi tới các trường hợp này | Sprint 4 – sửa xong trước khi mở thêm nút xin miễn phí |
