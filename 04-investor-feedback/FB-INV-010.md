# FB-INV-010 – Chuyển trọng tâm sang thuê dài hạn: landing có phòng trống theo loại phòng, giá tháng, cọc 1 tháng, FAQ dài hạn

- Ngày: 16/11/2026 | Người gửi: INV | Ghi: ORC | Loại: thay đổi định hướng kinh doanh + tính năng mới (landing, Desk) | Ưu tiên: P1 | Đích: v1.1 (sau v1.0.4 đang chạy) | **Trạng thái: Chờ INV đồng ý bắt đầu Đợt 1**

## Nguyên văn
> Tôi muốn cập nhật 2 điểm này, sau khi quá trình thực tế vận hành:
> 1. Biz của tôi hầu như là ở dài hạn, chiếm 95%
> 2. Build cái landing page vẫn sync với desk, nhưng lúc ở giai đoạn booking họ sẽ thấy là phòng studio city/studio garden sẽ trống từ khung nào tới khung nào, premium sẽ trống từ khung nào tới khung nào, signature sẽ trống từ khung nào tới khung nào để booking luôn => để xác nhận booking thì phải cọc 1 tháng cho loại phòng đó.
> 3. Trên desk sẽ cho cấu hình giá của ở dài hạn tính theo tháng, và lúc khách booking trên landing page sẽ thấy giá dài hạn
> 4. Tập trung promote chuyện bán phòng dài hạn
> 5. FAQ nên có một chính sách riêng cho ở dài hạn, cụ thể: bàn giao toàn bộ nội thất cơ bản, không bao gồm đồ amenities, thuê tối thiểu 1 tháng, cọc 1 tháng, điện 4.000 vnđ 1kwh, nước 25k/m3. Cut off time là ngày cuối tháng, thanh toán trước ngày 5 của tháng tiếp theo, sau khi tổng kết điện nước thực tế sử dụng

## INV chốt thêm (16/11, trả lời ORC)
- **Landing bỏ hẳn ngắn ngày**: landing chỉ bán dài hạn; khách ngắn ngày đi qua OTA.
- **Cọc 1 tháng**: khách chọn khung trống và gửi yêu cầu → phòng giữ tạm → lễ tân xác nhận trên Desk và gửi VietQR → nhận cọc mới chốt. Không dùng cổng thanh toán online.
- **Điện nước trên Desk (Đợt 3)**: làm sau Đợt 1 và 2; trước mắt lễ tân tính tay như hiện nay.

## Hiện trạng
- Desk đã có thuê dài hạn (`stay_type = long`, hợp đồng, `monthly_list_price_vnd` theo phòng, phân bổ doanh thu tháng – `lease-nights.ts`, BR-108/209/210).
- Landing: form gửi yêu cầu, không có lịch phòng trống (US-176 để sau); giá tháng **cố ý không hiện** (ESC-043, 01/11). FB-INV-010 thay quyết định đó: landing hiện "từ X/tháng" lấy từ Desk.
- Chưa có chức năng ghi chỉ số điện nước.

## Kế hoạch
| Đợt | Nội dung | Vai | Mức |
|---|---|---|---|
| 1 | FAQ dài hạn (5 ngôn ngữ), landing chỉ bán dài hạn, hiện giá tháng theo loại phòng từ Desk | CPY, BE, FE (+ review DOM/SEC rút gọn) | Nhẹ |
| 2 | Lịch trống theo loại phòng (Studio City, Studio Garden, Premium, Signature), giữ tạm, lễ tân xác nhận + VietQR cọc 1 tháng, đồng bộ Desk | ARC, BE, FE, QA | Vừa–nặng |
| 3 | Ghi chỉ số điện (4.000đ/kWh) và nước (25.000đ/m³), chốt cuối tháng, phiếu thu hạn trước ngày 5 | DOM, BE, FE | Vừa |

Đơn giá điện nước, cọc, tối thiểu 1 tháng là tham số Desk (OWN chỉnh), không gõ cứng.
