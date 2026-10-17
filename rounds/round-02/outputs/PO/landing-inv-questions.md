# Câu cần anh/chị xác nhận cùng bản mẫu landing v1.2.1

- Người soạn: PO | Round 2, Sprint 4 – Phản hồi & sửa sau workflow landing | Ngày: 17/10/2026 | Để ORC trình cùng `product/design/landing/mock/index.html` v1.2.1.
- Bối cảnh: anh/chị đã chọn **ESC-020 L7 = A** ngày 17/10 (yêu cầu đặt phòng vào Desk, lễ tân xác nhận qua Zalo, chưa thanh toán online). Các câu dưới đây **không phải ESC mới**: chúng thuộc phần anh/chị duyệt nội dung một lần (ESC-020 L5-A) và cách hiểu nút fanpage (ESC-020 L7). Mỗi câu đội đã có đề xuất; anh/chị chỉ cần trả lời "đồng ý" hoặc chọn chữ cái khác.
- Chỉ gồm câu protocol buộc hỏi anh/chị: chính sách và cam kết với khách, dữ liệu khách, nội dung mang tên OTTIMO. Việc giao diện (bố cục, khoảng cách, thứ tự mục) đội tự sửa theo phản biện, không hỏi.
- Hạn: trước khi FE dựng form theo v1.2.1 (giữa Sprint 4). Chưa trả lời thì đội làm theo đề xuất; trang **không** lên mạng khi anh/chị chưa duyệt nội dung (US-146 AC4).

---

## Q1 – Nút "Đặt ngay" trên fanpage dẫn về đâu
Anh/chị muốn khách "đặt phòng trên fanpage" và yêu cầu về Desk với nguồn website/facebook. Đội cần chốt cách làm vì nó quyết định dữ liệu khách nằm ở đâu.
- **A (đội đề xuất):** nút "Book now / Đặt ngay" của fanpage chỉ là **đường link** mở mục đặt phòng trên website OTTIMO. Khách điền ở website; dữ liệu nằm trên máy chủ của OTTIMO tại Việt Nam; Desk ghi "Website · Facebook". – Ưu: đúng quyết định giữ dữ liệu khách ở Việt Nam (ESC-002); một hàng chờ duy nhất trong Desk; link vẫn dùng được khi form chưa bật (lúc đó mở chat Zalo). – Nhược: khách phải rời Facebook sang website (một lần bấm). – Chi phí: 0 đ.
- **B:** dùng tính năng đặt lịch/biểu mẫu có sẵn của Facebook. – Nhược: dữ liệu khách nằm ở Facebook, không tự về Desk, lễ tân phải chép tay; trái ESC-002. Đội không đề xuất.
- Đội đề xuất **A**. Anh/chị tự đặt nút khi trang lên mạng (đội gửi link có gắn nhãn nguồn – xem ESC-020 mục "Việc anh/chị tự làm cho fanpage").

## Q2 – Câu hứa thời gian trả lời và giờ lễ tân
Trang ghi: *"Within 1 hour, 07:00–22:00 Da Lat time. Later requests by 09:00 the next morning."* / *"Trong 1 giờ, 07:00–22:00 giờ Đà Lạt. Gửi ngoài giờ: trả lời trước 09:00 sáng hôm sau."* và *"Reception 07:00–22:00"* (không ghi 24/7). Đây là cam kết công khai với khách nên cần anh/chị duyệt.
- **A (đội đề xuất):** giữ như trên. Mục tiêu nội bộ chặt hơn (phản hồi đầu trong 15 phút, quá 30 phút báo lễ tân trưởng và quản lý – BR-912); câu công khai để lỏng hơn để giờ cao điểm nhận phòng không thất hứa. Ngoài giờ là 09:00 (không phải 08:00) vì khách chỉ để số điện thoại thì từ 08:00 mới được gọi. Yêu cầu có ngày đến là hôm nay thì trang luôn hiện số gọi. – Chi phí: 0 đ.
- **B:** hứa chặt hơn, ví dụ "trong 30 phút". – Ưu: hấp dẫn hơn. – Nhược: dễ thất hứa lúc 14:00–16:00 khi chỉ 1–2 lễ tân vừa nhận phòng vừa trả lời.
- **C:** không ghi số ("chúng tôi trả lời sớm nhất có thể"). – Nhược: khách không biết chờ bao lâu, dễ gửi lại hoặc chuyển sang OTA.
- Đội đề xuất **A**. Số giờ đọc từ cấu hình, anh/chị đổi sau không cần sửa giao diện.

## Q3 – Nói công khai mức cọc 30%
Mục đặt phòng và hỏi đáp ghi: *"Your room is held once you confirm and pay a 30% deposit by QR transfer. No payment on this website."* / *"Phòng được giữ khi bạn xác nhận và chuyển cọc 30% qua mã QR. Không thanh toán trên website."* Mức 30% là chính sách anh/chị đã quyết (ESC-006 A, BR-305); câu hỏi là có nói con số này trên trang công khai không.
- **A (đội đề xuất):** nói rõ 30%. – Ưu: khách biết trước, ít hỏi lại; giúp khách nhận ra tin nhắn lừa đảo đòi cọc khác mức; khớp phần tóm tắt chính sách (US-149). – Nhược: đổi mức cọc thì phải phát hành lại trang (con số lấy từ cấu hình, không viết tay).
- **B:** chỉ ghi "đặt cọc một phần, OTTIMO báo số khi xác nhận". – Ưu: linh hoạt theo mùa. – Nhược: kém minh bạch, khách hỏi lại; phần chính sách vẫn phải nêu cọc.
- Đội đề xuất **A**.

## Q4 – Các câu nội dung cần anh/chị duyệt (ESC-020 L5)
Anh/chị chỉ cần đánh dấu từng dòng "đồng ý" hoặc ghi chỉnh sửa.

| # | Nội dung | Đề xuất của đội | Vì sao cần anh/chị |
|---|---|---|---|
| 4a | Định vị và lời hứa kép: "OTTIMO Boutique Stay · Đà Lạt"; "Stay a night, or a season."; khách ngắn ngày: "Beyond what a hotel room gives you" / "Vượt những gì một phòng khách sạn mang lại"; khách ở dài: "Made for living here" / "Sinh ra cho những kỳ ở dài" | Duyệt như bản mẫu | Ý 2 của anh/chị (FB-INV-002); câu mang tên OTTIMO |
| 4b | Không tự gọi là "khách sạn"/"hotel", không nêu hạng sao, không "luxury"; dùng "boutique stay", "sự chăm chút của một khách sạn nhỏ", "chăn ga chuẩn khách sạn" | Giữ cách viết này tới khi luật sư trả lời ESC-001 LZ-9 | Tự nhận loại/hạng cơ sở lưu trú có thể vướng Luật Du lịch 2017 [Chưa xác minh – luật sư]. Anh/chị cho luật sư biết OTTIMO đăng ký loại hình gì |
| 4c | Hạng Premium đang ghi "an extra bed" (thêm một giường) | Sửa thành "a sofa that sleeps one more" / "sofa ngủ thêm một người" | Theo ESC-014 anh/chị đã quyết: người thứ thêm ngủ sofa, không có nệm phụ – ghi "extra bed" là hứa sai |
| 4d | Câu chống giả danh: "We only contact you from the channels listed on this page, or your booking platform's inbox. We never ask for card numbers. Deposits go only to an account in the name of {tên chủ tài khoản}…" | Duyệt; tên chủ tài khoản nhận cọc lấy theo tài khoản anh/chị chốt (ESC-008, ESC-010) | Câu nêu tên người/công ty nhận tiền của OTTIMO |
| 4e | Tin nhắn Facebook (Messenger): trang ghi "Our Facebook page is for news. We do not confirm bookings or take deposits through Facebook messages." | **Đồng ý**: Messenger không nhận đặt phòng/cọc; anh/chị bật tin trả lời tự động trên fanpage dẫn khách về Zalo hoặc mục đặt phòng trên website | Nếu anh/chị muốn lễ tân trả lời đặt phòng qua Messenger thì phải có người trực kênh này trong giờ trực (cùng chuẩn 15 phút) và câu trên phải bỏ |
| 4f | E-brochure bản hiện tại có "mười căn hộ", "5 sao" | **Không** đăng cho khách tải; muốn đăng thì sửa brochure trước | Trái ý 1 (không nhắc số phòng) và mục 4b |

## Để anh/chị biết – không cần trả lời (trừ khi muốn khác)
- **Kênh khác ở bản tiếng Anh:** WhatsApp, Telegram, Viber nằm trong ô gập "Other channels" ở cả hai bản, đúng ý "khó tìm một xíu". Riêng trong form, ô "Reply on" để Zalo đầu tiên và mặc định, WhatsApp đứng ngay sau – **cố ý**, vì khách nước ngoài ít dùng Zalo và form là lối chính của họ.
- **Nút Zalo** hiện mở Zalo của số hotline cơ sở; khi Zalo OA được xác thực, đội đổi sang OA bằng một chỗ cấu hình.
- **Form "Yêu cầu đặt phòng"** xem được trên bản mẫu nhưng chỉ bật trên trang thật khi: luật sư trả lời hai câu về website và dữ liệu khách (ESC-001 LZ-2, LZ-8), Desk chạy thật và đạt kiểm tra bảo mật. Trước đó nút "Đặt phòng" mở chat Zalo. Dự kiến sớm nhất đầu Round 3.
- **Việc anh/chị tự làm cho fanpage (0 đ):** đặt tên người dùng cho fanpage, bật xác thực 2 lớp cho mọi quản trị viên, ghim bài "Kênh chính thức của OTTIMO", đặt nút "Đặt ngay" khi trang lên mạng – chi tiết ở ESC-020.
- **Thông tin còn thiếu** (đã nêu trong ESC-020, nhắc lại): bảng ghép tên phòng ↔ hạng; chỗ đậu xe, thang máy, thú cưng, gửi hành lý, đưa đón sân bay (chưa xác nhận thì trang không viết); logo SVG; quyền dùng ảnh.
