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
| Nút **"Gửi link check-in online"** trên Desk – demo dùng link OPS cấp sẵn | `[PO xếp lịch – điền sau]` |
| Trả phòng sớm, ghi công nợ khi trả phòng, quét QR CCCD / đọc dòng mã hộ chiếu, xin miễn phí trên từng dòng phát sinh (hiện chỉ xin miễn phụ thu nhận sớm lúc nhận phòng) | Round 3 `[PO xác nhận]` |
| **Web đặt phòng trực tiếp** cho khách | Round 3 |
| **Hợp đồng dài hạn đầy đủ** trong app (báo giá dài hạn, lịch thu theo kỳ, nhắc gia hạn), điện nước, báo cáo tháng. Round 2 chỉ có "đơn dài hạn nhập tay" để giữ phòng trên sơ đồ | Round 3 |
| Mã cửa trên trang khách, khách tự xem bill, xác minh khách bằng mã OTP | Round 3 |
| Đơn nhóm nhiều căn, đóng ca/bàn giao tiền | Round 3 |
| Kết nối thật: OTA / channel manager, VNPay / MoMo, khóa cửa TTLock, MISA / hóa đơn điện tử, cổng khai báo lưu trú, Zalo / email | Round 3 trở đi – cần tài khoản của anh/chị (ESC-009, ESC-010) |

## C. Lỗi đội đã biết khi giao bản demo
`[điền sau – ORC/QC: các lỗi còn mở sau cổng QC Sprint 3, viết bằng ngôn ngữ kinh doanh, mỗi lỗi 1 dòng: gặp ở kịch bản nào · biểu hiện · khi nào sửa]`. Anh/chị gặp các lỗi này thì không cần ghi lại.
