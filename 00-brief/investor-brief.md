# Brief của Chủ đầu tư – OTTIMO Boutique Stay · App All-in-one

> Tổng hợp ngày 15/10/2026 từ: (1) buổi trao đổi ý tưởng trên Claude, (2) bản prototype "OTTIMO Desk" chủ đầu tư đã vibe code (Round 0), (3) kinh nghiệm vận hành thực tế với khách thuê.
> Chi tiết đầy đủ của prototype: `product/docs/round-0-baseline.md`. Mã nguồn prototype: `product/legacy/round-0-prototype/ottimo-desk.html`.
> Mục 7 đã được chủ đầu tư trả lời khi chạy `/start` ngày 15/10/2026. Các mục **[GIẢ ĐỊNH]** được ghi trong `01-decisions/decision-log.md`.

## 1. Doanh nghiệp
- **Thương hiệu:** OTTIMO Boutique Stay. Nhận diện trong prototype: tông kem – gỗ sồi (oak), chữ serif Lora + Be Vietnam Pro, tên phòng kiểu "The Amber", "The Fern"…
- **Địa điểm:** Đà Lạt (phường Xuân Hương).
- **Quy mô:** 10 căn, 3 nhóm: Lầu 1–2 (6 căn: 101–103, 201–203), Căn N (301, 401), Căn N+ (302, 402).
- **Mô hình lai:** vừa cho thuê **ngắn ngày** (OTA + trực tiếp), vừa cho thuê **dài hạn theo tháng** (mục tiêu 4–6 căn dài hạn). Khách gồm nội địa và nhiều khách nước ngoài (Nga, Pháp, Đức, Hàn, Singapore…), có người làm việc từ xa.
- **Giá niêm yết tháng:** 8,0 – 12,5 triệu/căn. Giá OTA nền theo nhóm 760k / 1.050k / 980k mỗi đêm, cuối tuần +15%.
- **Kết quả tháng 9/2026 (theo prototype):** công suất 71,3%, doanh thu 186,4 tr, GOP ~61%. Mục tiêu công suất tháng 10: 80%.
- **Kênh bán:** Airbnb, Booking.com, Agoda, Expedia, Trip.com, Traveloka (chờ duyệt), CTV/môi giới, trực tiếp (website/Zalo), hợp đồng dài hạn. Dự kiến dùng channel manager (Beds24 hoặc ezCloud).

## 2. Tầm nhìn sản phẩm
Một app **all-in-one** cho OTTIMO, phục vụ cả nhân viên và khách: **"cực xịn, mượt mà, giao diện thân thiện"**. Nâng cấp từ prototype Round 0 (một file HTML, dữ liệu mẫu) thành sản phẩm thật: có backend, lưu dữ liệu, phân quyền thật, tích hợp thật, dùng hằng ngày.

## 3. Phân hệ (đã có trong prototype – giữ và làm thật)
| Phân hệ | Đã có ở Round 0 |
|---|---|
| Tổng quan (dashboard) | KPI công suất/ADR/RevPAR, khách đến/đi, cần chú ý, việc trong ngày |
| Lễ tân | Room rack 14 ngày, nhận phòng, trả phòng, bill, gia hạn, nhận sớm/trả muộn, FOC, đặt phòng mới |
| Giấy tờ & khai báo lưu trú | Quét giấy tờ, khai báo (bán tự động) lên cổng Bộ Công an, hạn 23:00, lưu trữ có mã hóa và tự xóa |
| Buồng phòng | Trạng thái phòng (VC/VI/VD/CL/OC/OD/OOO), việc hôm nay, checklist kiểm phòng |
| Bảo trì | Phiếu sửa chữa, bảo trì định kỳ, chốt số điện nước |
| Kho F&B / minibar | Xuất nhập tồn, minibar từng căn, bán chạy |
| Khách hàng (CRM) | Hồ sơ, phân khúc, chống trùng & gộp hồ sơ, người đi cùng |
| Sale & báo giá | Công cụ báo giá dài hạn, giữ chỗ/đặt cọc, khách tiềm năng (kanban), hợp đồng dài hạn, hoa hồng CTV/sale |
| Kênh OTA | Giá và phòng trống 7 ngày, nhật ký đồng bộ (giả lập) |
| Báo cáo | Chỉ số tháng, cơ cấu đêm-phòng, doanh thu & chi phí kênh, kết quả kinh doanh, đánh giá khách |
| App khách | Gửi yêu cầu (dọn phòng, sửa chữa…), xem hóa đơn, thông tin lưu trú |

## 4. Quy tắc kinh doanh đã có (chi tiết ở `round-0-baseline.md` mục 5)
- Báo giá dài hạn theo kỳ hạn (giảm 0/5/8/12/15%), +10% với khách nước ngoài, ký quỹ 0,5–2 tháng, thu theo quý, phí dịch vụ và phí dọn theo gói.
- Ngắn ngày: ở từ 7 đêm giảm 10%, từ 14 đêm giảm 15%; cọc 30%; giữ chỗ 12/24/48 giờ.
- Nhận phòng 14:00, trả phòng 12:00, có bậc phụ thu nhận sớm/trả muộn, FOC phải có lý do và người duyệt.
- Hoa hồng CTV và nhân viên sale theo tỉ lệ.
- Điện 3.500 đ/kWh, nước 25.000 đ/m³ theo công tơ.

## 5. Kinh nghiệm vận hành thực tế (từ trao đổi với khách thuê tháng 9–10/2026)
- **Giao tiếp với khách** chủ yếu qua nhóm chat; cần soạn tin nhanh bằng **Anh, Nga** (và ngôn ngữ khác) → app nên có mẫu tin nhắn đa ngôn ngữ.
- **Khách thuê tháng:** ví dụ 10 tr/tháng chỉ gồm tiền thuê; điện nước tính theo thực tế (~1,2–2 tr/tháng); dọn phòng không bắt buộc 100k/lần (lau dọn, thay ga gối, vệ sinh nhà tắm, bếp).
- **Phí phạt thực tế:** khử mùi thuốc lá 500k/lần (chỉ hút ở ban công); làm lại thẻ phòng 200k (được cấp thẻ dự phòng, trả đủ 2 thẻ khi đi thì miễn phí).
- **Khai báo tạm trú người nước ngoài:** qua cổng tbltkbtt.bocongan.gov.vn; cần ảnh trang thông tin hộ chiếu, dấu nhập cảnh, visa hoặc diện miễn thị thực, ngày đến/đi, mục đích, SĐT; phải cập nhật ngày đi thực tế; ngày đi dự kiến không vượt hạn tạm trú.
- **Sự cố thường gặp:** mất nước nóng, mất/nhầm thẻ phòng, đồ khách để quên, lịch dọn phòng theo yêu cầu.

## 6. Cách làm việc chủ đầu tư mong muốn
- Chủ đầu tư đóng vai **nhà đầu tư**; đội agent tự làm, review chéo, chỉ báo lên những gì không tự giải quyết được.
- **Tối thiểu 3 round**, có **QA và QC**. Prototype đã là **Round 0**, nên Round 1 bắt đầu từ đặc tả ngược của prototype, không làm lại khám phá từ con số 0.
- Sau đó chủ đầu tư **dùng sản phẩm để vận hành OTTIMO thật** và feedback trực tiếp.

## 7. Thông tin cần bổ sung
| # | Câu hỏi | Trả lời |
|---|---|---|
| 1 | Mô hình tài chính cho thuê phòng (chi phí thuê tòa, chi phí vận hành, mục tiêu lợi nhuận) | [GIẢ ĐỊNH] Dùng số liệu tháng 9/2026 trong prototype (doanh thu 186,4 tr, GOP ~61%). Chủ đầu tư bổ sung file vào `00-brief/context/` khi có – không chặn Round 1 |
| 2 | Tài liệu trong project "OTTIMO BOUTIQUE STAY" | [GIẢ ĐỊNH] Chưa có; chủ đầu tư bổ sung vào `00-brief/context/` khi có – không chặn Round 1 |
| 3 | Đang dùng phần mềm/thiết bị gì: khóa cửa (thẻ từ hãng nào), channel manager, hóa đơn điện tử, POS? | **Khóa cửa:** khóa thông minh điều khiển qua app – mở bằng mật mã, vân tay hoặc thẻ từ; đặt mã cửa [đã ẩn – INV 19/10: đổi sang mã ngẫu nhiên 8 số] (hãng: chưa rõ). **Hóa đơn điện tử:** MISA meInvoice. **Channel manager:** chưa chọn – đội đề xuất; có nhu cầu kết nối **toàn bộ** OTA. **POS:** [GIẢ ĐỊNH] chưa dùng |
| 4 | Cổng thanh toán mong muốn? | [GIẢ ĐỊNH] VietQR chuyển khoản + VNPay/MoMo |
| 5 | Ngân sách hạ tầng/tháng, thời hạn mong muốn? | [GIẢ ĐỊNH] Hạ tầng ≤ 1 triệu đ/tháng (chưa gồm phí channel manager, SMS/Zalo); không ép thời hạn, chạy đủ 3 round |
| 6 | Ai dùng thử: chủ đầu tư, lễ tân, buồng phòng (anh Long?), CTV? | Cả 4 nhóm: chủ đầu tư, lễ tân, buồng phòng/bảo trì, CTV/sale |
| 7 | Có dự định mở thêm cơ sở (cần đa cơ sở / chuỗi) không? | [GIẢ ĐỊNH] Thiết kế sẵn đa cơ sở, MVP 1 cơ sở |
| 8 | 26 câu hỏi mở trong `round-0-baseline.md` mục 9 | Đội sẽ gom và đề xuất phương án ở cuối Round 1 |
