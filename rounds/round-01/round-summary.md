# Tổng kết Round 1 – Chuẩn hóa từ Baseline & Thiết kế nền móng

- Người viết: ORC (Điều phối viên) | Ngày: 16/10/2026 | Thời gian chạy: 15/10 – 16/10/2026
- Chi tiết: `rounds/round-01/plan.md`, `qc/qc-gate.md`, `qa/test-report.md`, `qa/bug-list.md`, `01-decisions/decision-log.md`

> Lưu ý quan trọng: phần **nghiên cứu người dùng** (persona, hành trình khách, đánh giá trải nghiệm) là **mô phỏng** của đội AI dựa trên kiến thức và brief – đội không gặp được khách hay nhân viên thật. Anh/chị cần kiểm chứng với người thật (ESC-003, có phiếu 1 trang soạn sẵn).

## 1. Kết quả chính

Round 1 biến prototype "OTTIMO Desk" thành **bộ hồ sơ đủ để bắt tay code ở Round 2**:

- **Sản phẩm & quy tắc**: PRD (mục tiêu công suất 80%, 4–6 căn dài hạn, kênh trực tiếp ≥ 35%), **145 user story** (77 story bắt buộc cho Round 2, mỗi story có tiêu chí nghiệm thu), **150 quy tắc kinh doanh** (giá, cọc, hủy, phụ thu, FOC, điện nước, khai báo lưu trú, đóng ca…) – mọi con số là tham số chỉnh được. 30/30 lỗi của prototype đã được phân loại và có hướng xử lý.
- **Giao diện**: Design System OTTIMO (giữ tông kem – gỗ sồi, Lora + Be Vietnam Pro, đạt chuẩn tương phản cho người lớn tuổi/mù màu, có chế độ tối) và **wireframe 10 luồng** bấm thử được trên trình duyệt: lễ tân, nhận/trả phòng, sale/CTV, buồng phòng trên điện thoại, app khách (Việt/Anh/Nga), tổng quan chủ đầu tư, cấu hình.
- **Kỹ thuật**: kiến trúc, 13 quyết định công nghệ, cơ sở dữ liệu ~70 bảng, API 164 thao tác (hợp lệ, đối chiếu đủ phân quyền), chống đặt trùng ở tầng cơ sở dữ liệu, chi phí máy chủ tại Việt Nam ước **0,43–0,54 triệu đ/tháng**. Khung mã nguồn + môi trường chạy thử + kiểm tra tự động **đã viết nhưng chưa chạy được** (máy chưa có Node/Docker – xem mục 4, ESC-013).
- **Bảo mật & pháp lý**: đánh giá dữ liệu cá nhân theo NĐ 13/2023 và Luật 91/2025, 62 mối đe dọa đã phân tích (sau biện pháp: 0 nghiêm trọng, còn 2 mức cao – xem mục 5), ~165 yêu cầu bảo mật. Ảnh giấy tờ khách chỉ xem được trên máy quầy được cấp quyền, mã cửa không lộ qua link bị chuyển tiếp.
- **Kiểm thử**: chiến lược test + **383 kịch bản kiểm thử**; ma trận truy vết phủ 77/77 story bắt buộc và 267/267 tiêu chí nghiệm thu.

## 2. Quyết định QC: **ĐẠT CÓ ĐIỀU KIỆN**

Tài liệu đủ, nhất quán (nhóm A 16/16, nhóm B 5/5); chỉ còn **khung kỹ thuật chưa chạy thử thật** – phải chạy được trước khi hết tuần 1 Round 2, nếu không QC chặn việc code tính năng.

- ĐK-1 (đã đóng): lập ESC-013 về môi trường chạy thử.
- ĐK-2 (mở): cài Node/Docker → OPS chạy khung, `/health` OK, kiểm tra tự động xanh – hạn hết tuần 1 Round 2.

## 3. Chỉ số round

- Thẻ feedback (review chéo): tạo **286** (3 Blocker, 115 Major) | đã xử lý **286** (0 Rejected, 0 còn mở; một số Minor/Suggestion dời Round 2–3 có nơi theo dõi).
- Lỗi (kiểm thử tài liệu + bảo mật): tìm **34** | đã sửa và kiểm lại **20** | còn mở **4** (đều P3 – lỗi nhỏ) | dời có kế hoạch **10** (1 P2 phải xong trước khi code phần mã cửa). **0 lỗi P0/P1 mở** (lỗi P0 "CTV lấy được mã cửa" đã sửa và SEC xác nhận).
- Quyết định đã ghi: ~250 dòng trong `decision-log.md` (giả định đều gắn nhãn `[GIẢ ĐỊNH – chờ INV xác nhận]`).

## 4. CẦN ANH/CHỊ QUYẾT ĐỊNH (13 việc – chi tiết và bảng chọn trong `02-escalations/`)

Mỗi ESC có phương án đội đề xuất. **Anh/chị có thể trả lời "đồng ý đề xuất" cho cả loạt**, chỉ nêu những mục muốn khác. Chưa trả lời thì đội chạy theo đề xuất (riêng ESC-013 cần anh/chị cài đặt).

**Cần sớm – trước khi bắt đầu Round 2**

| ESC | Việc | Đội đề xuất |
|---|---|---|
| **013 (Gấp)** | Môi trường chạy thử | Anh/chị cài Node 22 + Docker (đã chọn, ~15 phút); thêm repo GitHub riêng tư miễn phí để kiểm tra tự động mỗi thay đổi |
| 012 | Phạm vi bản đầu + phạm vi Round 2 + logo | Đồng ý phạm vi MVP; Round 2 theo **R-C** (dời báo giá/HĐ dài hạn, app khách nâng cao, nhắc tự động, mẫu tin sang đầu Round 3 – vì ước lượng vượt); logo dùng chữ "OTTIMO" tới khi có file gốc |
| 003 | Kiểm chứng với người thật | Dành ~1–1,5 giờ theo phiếu 1 trang (`product/docs/research/real-user-check-guide.md`); ưu tiên thử app buồng phòng với nhân viên (20 phút) |
| 002 | Nơi đặt dữ liệu + chi phí máy chủ + tên miền | Toàn bộ dữ liệu khách ở **Việt Nam**; gói máy chủ ~425–535 nghìn đ/tháng (R2 chỉ ~264 nghìn đ) |
| 004 (một phần) | Sức chứa thật từng căn | Anh/chị gửi số người/giường từng căn |
| 010 (một phần) | Tài khoản ngân hàng nhận VietQR + tên miền | Mở/chọn đầu Round 2 |
| 011 (một phần) | Thông tin khóa cửa đang dùng | Gửi ảnh khóa + tên app quản lý khóa |

**Trong Round 2 (chính sách – đã có mặc định để code)**

| ESC | Việc | Đội đề xuất |
|---|---|---|
| 004 | Giá ngắn ngày | Lễ/Tết +30%, T6–T7 +15% cho mọi kênh; phụ thu khách nước ngoài 10% chỉ cho thuê dài hạn; ở tối thiểu để tắt |
| 005 | Thuê dài hạn & hoa hồng | Giữ bảng kỳ hạn; hoa hồng tính trên tiền thuê, chi 2 đợt; CTV ngắn ngày 8% |
| 006 | Hủy & hoàn cọc | "Linh hoạt vừa": hủy ≥ 7 ngày hoàn 100%, 3–6 ngày 50%, < 3 ngày không hoàn; được dời ngày 1 lần |
| 007 | Phụ thu nhận sớm/trả muộn, FOC | Ân hạn trả phòng 12:30 khi căn không có khách đến; lễ tân tự miễn minibar ≤ 500.000 đ/người/tháng |
| 008 | Điện nước, giặt ủi, VAT | Đơn giá cố định sau khi kế toán xác nhận; giá đã gồm VAT; cần biết doanh nghiệp hay hộ kinh doanh |
| 009 | Channel manager | **Beds24** (~0,9–2,3 triệu đ/tháng, ngoài ngân sách máy chủ) – đủ 6 OTA, có API |
| 010 | Tài khoản thu tiền, hóa đơn, tin nhắn; ca tối | VietQR + VNPay (thẻ quốc tế) + MISA + email; chưa dùng MoMo/Zalo ZNS; ai trực tối và dùng thiết bị gì (máy tính bảng của cơ sở ~4–8 triệu đ nếu cần) |
| 011 | Mã cửa theo ngày sinh | ngày-tháng sinh + 3 số ngẫu nhiên, chỉ khi khách muốn |
| 001 | Thuê luật sư | Thuê rà soát trước khi đưa dữ liệu khách thật vào (cuối Round 2) – gồm hạn khai báo khách nước ngoài (đội đang dùng "giờ đến + 12 giờ") |

## 5. Giả định đội đang dùng – nhờ xác nhận

- Ngân sách máy chủ ≤ 1 triệu đ/tháng (chưa gồm channel manager, tin nhắn); không ép thời hạn.
- Thiết bị: lễ tân dùng laptop tại quầy; buồng phòng dùng điện thoại Android; chủ đầu tư và CTV dùng điện thoại.
- Ngôn ngữ: Việt + Anh bắt buộc, **tiếng Nga** là ngôn ngữ thứ 3 (thay Hàn/Trung của prototype). Bản tiếng Nga và văn bản pháp lý tiếng Anh do AI soạn – cần người bản ngữ/luật sư duyệt.
- Ngày làm việc của khách sạn đổi lúc **06:00** (khách đến 1h30 sáng vẫn thuộc ngày hôm trước).
- Không nhận tiền mã hóa; khách không cọc online được (ví dụ khách Nga) thì giữ chỗ ngắn, thu đủ khi đến.
- **Rủi ro còn lại cần anh/chị biết**: (1) ai chiếm được máy chủ thì có cả khóa giải mã và dữ liệu – giảm bằng bảo vệ máy chủ, sao lưu ngoại tuyến; (2) ảnh giấy tờ khách đang gửi qua điện thoại/nhóm chat – nên ban hành **quy định nội bộ không nhận/gửi giấy tờ qua chat**; (3) nếu bật gửi mã xác minh qua Zalo/OTA thì rủi ro mức trung bình (mặc định tắt). Đội đề nghị **kiểm thử bảo mật độc lập trước khi vận hành thật** – sẽ trình ở cuối Round 2.

## 6. Kế hoạch Round 2 – Xây dựng lõi MVP (dự thảo: `rounds/round-02/plan.md`)

- **Tuần 1**: chạy thật khung + kiểm tra tự động (cần ESC-013), dữ liệu mẫu, khung kiểm thử tự động, xử lý việc tồn Round 1 (W1–W18).
- **4 đợt × 2 tuần**: đặt phòng & room rack, nhận/trả phòng + khai báo, thu tiền (VietQR thử), buồng phòng trên điện thoại, tổng quan chủ đầu tư; dựng máy chủ chạy thử (staging).
- **Đạt Round 2 khi**: 7 luồng chính chạy trọn từ đầu đến cuối trên staging, kiểm tra tự động xanh, 0 lỗi P0/P1.
- Ước lượng: lõi máy chủ khoảng 16–21 tuần-người theo phương án R-C (đội AI làm song song nên thời gian thực tế ngắn hơn nhiều, nhưng con số cho thấy Round 2 nặng – vì vậy đề xuất R-C).

## 7. Cách xem/dùng thử sản phẩm hiện tại

- **Wireframe bấm thử**: mở file `product/design/wireframes/index.html` bằng trình duyệt (Finder → Desktop → hotel-app → product → design → wireframes → nhấp đúp `index.html`). Có công tắc Sáng/Tối, Ngôn ngữ, và trạng thái Đang tải/Rỗng/Lỗi/Mất mạng. Màn buồng phòng `06-housekeeping-mobile.html` mở trên điện thoại để làm ESC-003.
- **Phiếu kiểm chứng người thật**: `product/docs/research/real-user-check-guide.md`.
- **Prototype cũ để so sánh**: `product/legacy/round-0-prototype/ottimo-desk.html`.
- Chưa có bản chạy thật – bắt đầu từ Round 2.
