# Nhật ký quyết định

| Ngày | Round | Quyết định | Người quyết | Lý do |
|---|---|---|---|---|
| 2026-10-15 | 0 | Đội 16 vai, tối thiểu 3 round, có QA + QC; INV chỉ nhận các việc báo lên | INV | Thống nhất khi trao đổi ý tưởng |
| 2026-10-15 | 0 | Prototype OTTIMO Desk (vibe code) được coi là Round 0; Round 1 chuẩn hóa từ baseline | INV | Đã làm trước 1 round |
| 2026-10-15 | 0 | Khóa cửa là khóa thông minh có app (mật mã / vân tay / thẻ từ, đặt mã cửa [đã ẩn – INV 19/10: đổi sang mã ngẫu nhiên 8 số]); INT tìm hãng và khả năng API ở Round 1 | INV | Trả lời /start |
| 2026-10-15 | 0 | Hóa đơn điện tử dùng MISA meInvoice | INV | Trả lời /start |
| 2026-10-15 | 0 | Cần kết nối toàn bộ OTA qua channel manager; ARC + INT so sánh Beds24 / ezCloud / phương án khác và đề xuất bằng ESC cuối Round 1 | INV | Trả lời /start |
| 2026-10-15 | 0 | Người dùng thử: chủ đầu tư, lễ tân, buồng phòng/bảo trì, CTV/sale → cần phân quyền cho cả 4 vai | INV | Trả lời /start |
| 2026-10-15 | 0 | [GIẢ ĐỊNH] Ngân sách hạ tầng ≤ 1 triệu đ/tháng, không ép thời hạn | ORC | INV chưa rõ, chọn dùng giả định |
| 2026-10-15 | 0 | [GIẢ ĐỊNH] Cổng thanh toán: VietQR chuyển khoản + VNPay/MoMo | ORC | Giữ giả định trong brief, chờ INV xác nhận |
| 2026-10-15 | 0 | [GIẢ ĐỊNH] Thiết kế sẵn đa cơ sở, MVP 1 cơ sở; chưa dùng POS | ORC | Giữ giả định trong brief, chờ INV xác nhận |
| 2026-10-15 | 0 | [GIẢ ĐỊNH] Mô hình tài chính lấy theo số liệu tháng 9/2026 trong prototype cho đến khi INV bổ sung `00-brief/context/` | ORC | Không chặn Round 1 |
| 2026-10-15 | 1 | DATA tham gia nhẹ ở Round 1 (chỉ `metrics-definitions.md`); tracking + dashboard để Round 3 | PO | Công thức chỉ số ảnh hưởng ERD (lỗi baseline 8.2 #8, #11, #22, #28, #29) |
| 2026-10-15 | 1 | MOB, FE, BE không sản xuất ở Round 1, chỉ review | PO | Round 1 là round tài liệu/thiết kế |
| 2026-10-15 | 1 | PO đề xuất ranh giới MVP trong PRD, trình ESC để INV xác nhận phạm vi | PO | Câu hỏi mở baseline mục 9 #21 |
| 2026-10-15 | 1 | Ngôn ngữ: VI + EN bắt buộc; RU là ngôn ngữ thứ 3 (thay KR/CN của prototype) | PO | Brief mục 5: khách Nga nhiều, cần tin nhắn tiếng Nga |
| 2026-10-15 | 1 | [GIẢ ĐỊNH – chờ INV xác nhận] Mọi con số quy tắc ở baseline mục 5 là giá trị mặc định cấu hình được | PO | Sẽ xác nhận qua ESC cuối Round 1 |
| 2026-10-15 | 1 | Bộ 7 persona mô phỏng (P1–P7) và 4 hành trình (J1–J4) là cơ sở nghiên cứu Round 1; mọi kết luận ghi "Mô phỏng – cần INV kiểm chứng" cho tới khi có kiểm chứng người thật | UXR | Thuộc quyền UXR (kết luận nghiên cứu); đội AI không phỏng vấn được người thật |
| 2026-10-15 | 1 | Mức nghiêm trọng heuristic prototype R0: Blocker = HR-01 (app khách chỉ tiếng Việt), HR-04 (phụ thu nhận sớm tính sẵn), HR-06 (hủy giữ chỗ không xác nhận), HR-07 (kiểm hạn hộ chiếu giả "Khớp"); chuẩn a11y mục tiêu WCAG 2.2 AA | UXR | Thuộc quyền UXR (mức nghiêm trọng vấn đề khả dụng); chi tiết `product/docs/research/heuristic-review-r0.md` |
| 2026-10-15 | 1 | [GIẢ ĐỊNH – chờ INV xác nhận] Nhân viên buồng phòng/bảo trì dùng điện thoại Android tầm trung, cần giao diện mobile riêng (nút ≥ 48px, chữ ≥ 16px, thao tác được khi mất mạng); lễ tân dùng laptop tại quầy; chủ đầu tư và CTV dùng điện thoại là chính | UXR | Persona P1–P4, giả thuyết H-01, H-02, H-05, H-07 |
| 2026-10-15 | 1 | Danh mục quy tắc kinh doanh BR-xxx trong `product/docs/business-rules.md` là nguồn sự thật duy nhất cho con số nghiệp vụ; tài liệu khác chỉ tham chiếu mã BR | DOM | Tiêu chí QC B3 |
| 2026-10-15 | 1 | Trạng thái đơn chuẩn: hold, confirmed, in_house, checked_out, cancelled, no_show; OOO là khối chặn tồn phòng, không phải đơn khách | DOM | BL 8.2 #5, #8 (BR-301, 804) |
| 2026-10-15 | 1 | Giữ chỗ không tính đêm bán; đêm khả dụng trừ đêm OOO (DATA chốt công thức) | DOM | Chuẩn ngành; BL 8.2 #8, #29 (BR-904) |
| 2026-10-15 | 1 | Hai loại giá đêm: niêm yết (bán ngắn ngày) và quy đổi dài hạn = thuê tháng ÷ 30 (ngày lẻ, phụ thu, hoàn trả) | DOM | BL 8.2 #1, #13 (BR-102) |
| 2026-10-15 | 1 | Phụ thu nhận sớm/trả muộn không tự áp theo giờ hiện tại; form mặc định giờ chuẩn | DOM | BL 8.2 #2 (BR-414) |
| 2026-10-15 | 1 | Đơn/báo giá/HĐ lưu snapshot giá và tham số; mã chứng từ do server cấp, liên tục | DOM | BL 8.2 #10, #18 (BR-006, 007) |
| 2026-10-15 | 1 | FOC phải do tài khoản người duyệt xác nhận, không tự duyệt (hạn mức chờ INV) | DOM | BL 8.2 #24 (BR-432) |
| 2026-10-15 | 1 | Ngày kết thúc HĐ dài hạn theo tháng lịch (thay × 30,4 ngày) | DOM | Chuẩn ngành (BR-209) |
| 2026-10-15 | 1 | Giá vốn kho bình quân gia quyền | DOM | Chuẩn kế toán kho (BR-705) |
| 2026-10-15 | 1 | [GIẢ ĐỊNH – chờ INV xác nhận] Hạn khai báo tạm trú người nước ngoài: áp hạn sớm hơn giữa "giờ đến + 12 giờ" và "23:00 ngày đến" cho đến khi luật sư xác nhận | DOM | An toàn pháp lý (BR-603) |
| 2026-10-15 | 1 | Lịch dọn dài hạn ngày cố định, khung 9:00–11:00 (khách đổi qua app) | DOM | BL 9 #12 – plan R1 mục 8 giao DOM tự chốt |
| 2026-10-15 | 1 | Thang phân loại dữ liệu C0–C3 (data-risk-assessment mục 3) là chuẩn chung cho RBAC, ERD, log | SEC | Một ngôn ngữ chung cho BA, ARC, QA |
| 2026-10-15 | 1 | OTTIMO không lưu/nhận/truyền dữ liệu thẻ; chỉ dùng trang thanh toán của cổng; không kéo thẻ ảo (VCC) từ channel manager | SEC | Giữ phạm vi PCI DSS tối thiểu |
| 2026-10-15 | 1 | Dữ liệu C3 lưu tách, mã hóa mức trường/tệp, ghi nhật ký mỗi lần xem; ảnh giấy tờ xóa bằng hủy khóa riêng | SEC | BL 5.13 + yêu cầu tối thiểu |
| 2026-10-15 | 1 | Đồng ý lưu ảnh giấy tờ không là điều kiện để khai báo lưu trú | SEC | Tách nghĩa vụ luật với việc cần đồng ý (F02) |
| 2026-10-15 | 1 | Không đăng ký vân tay khách; mẫu vân tay nhân viên không rời thiết bị khóa | SEC | Dữ liệu sinh trắc (F06) |
| 2026-10-15 | 1 | Link app khách gắn với đơn, hết hạn khi trả phòng | SEC | Chống lộ dữ liệu khách trước (F09) |
| 2026-10-15 | 1 | [GIẢ ĐỊNH – chờ INV/luật sư xác nhận] Thời hạn lưu/xóa dữ liệu (data-risk-assessment mục 7) là giá trị mặc định cấu hình được | SEC | Chờ ESC-001 |
| 2026-10-15 | 1 | Mọi tích hợp đặt sau adapter có bản Mock; chuyển mock/sandbox/production bằng biến môi trường; outbox/inbox chống xử lý trùng | INT | Quyền kỹ thuật INT |
| 2026-10-15 | 1 | Chỉ ghi nhận tiền từ IPN/webhook đã xác thực chữ ký và khớp số tiền; không dùng iCal; không scraping cổng Bộ Công an; VietQR tự sinh chuỗi trong app | INT | Quyền kỹ thuật INT |
| 2026-10-15 | 1 | [GIẢ ĐỊNH – chờ INV xác nhận] Thẻ quốc tế đi qua VNPay (INTCARD), MVP không cần Stripe/OnePay | INT | Chờ ESC tài khoản thanh toán |
| 2026-10-15 | 1 | [GIẢ ĐỊNH – chờ INV xác nhận] Mã cửa mặc định ngẫu nhiên 6 số; mã theo ngày sinh = ddmm + 2 số ngẫu nhiên, chỉ khi khách đồng ý; gửi mã vào ngày đến, xóa khi trả phòng | INT | Mã sinh nhật dễ đoán (SEC F05, DOM Q-D4); chờ ESC khóa cửa |
| 2026-10-15 | 1 | Ranh giới MVP theo PRD mục 5.2–5.3; ca/chấm công và ký số hợp đồng ngoài MVP; cảnh báo lệch mục tiêu là Could R4+ | PO | BL 9 #13, #17, #25 – quyền phạm vi của PO, ranh giới MVP vẫn trình ESC xác nhận |
| 2026-10-15 | 1 | [GIẢ ĐỊNH – chờ INV xác nhận] Đích kênh trực tiếp ≥ 35% doanh thu phòng, GOP ≥ 60%; các chỉ số thành công S1–S12 do đội đề xuất | PO | PRD |
| 2026-10-15 | 1 | [GIẢ ĐỊNH – chờ INV xác nhận] Không có vai F&B/kế toán riêng; quản lý thuộc nhóm chủ đầu tư; lễ tân trưởng = lễ tân có quyền duyệt FOC trong hạn mức | PO | PRD |
| 2026-10-15 | 1 | [GIẢ ĐỊNH – chờ INV xác nhận] Booking engine công khai là Should R3; khóa cửa MVP nhập mã tay, tích hợp API R4+ | PO | PRD |
| 2026-10-15 | 1 | [GIẢ ĐỊNH – chờ INV xác nhận] R2 chỉ ghi nhận thanh toán + VietQR; VNPay/MoMo, MISA, Zalo ZNS, channel manager thật ở R3; app khách VI/EN ở R2, tiếng Nga ở R3 (mẫu tin nhắn có tiếng Nga từ R2) | PO | PRD |
| 2026-10-15 | 1 | [GIẢ ĐỊNH – chờ INV xác nhận] P&L R3 nhập chi phí trong app, chưa tính thuê nhà/khấu hao | PO | BL 9 #26 |
