# FB-INV-012 – Desk: phiếu thanh toán hằng tháng cho khách dài hạn (điện, nước, tiền phòng, dịch vụ)

- Ngày: 17/11/2026 | Người gửi: INV | Ghi: ORC | Loại: tính năng (Desk, folio, phiếu in) | Ưu tiên: P2 | Đích: Đợt 3 dài hạn (FB-INV-010) | **Trạng thái: Đang làm (INV xác nhận 17/11: "Phiếu thanh toán bao gồm, tiền thuê, điện, nước, dịch vụ phòng")**

## Nguyên văn
> bây giờ trên phần desk, tôi cần có 1 funtion là đối với khách ở dài hạn, sẽ có input về số điện, số nước đầu kỳ, rồi nhập số cuối kỳ, rồi nó sẽ ra số lượng tiêu thụ trong kỳ giá tiền, dạng một phiếu thanh toán để in ra gửi cho khách.

## INV chốt (17/11)
- Phiếu gồm: tiền phòng tháng + điện + nước + **dịch vụ phòng dùng trong kỳ** (INV ghi "Và dịch vụ phòng dùng trong kỳ").
- Có theo dõi: phiếu ghi vào folio khách, lễ tân đánh dấu đã thu, Desk nhắc phiếu quá hạn ngày 5.
- Đơn giá điện 4.000/kWh, nước 25.000/m³ **chưa gồm VAT** → phiếu cộng VAT.

## Hiểu của ORC (chờ INV xác nhận)
- Lễ tân nhập chỉ số đầu kỳ và cuối kỳ cho điện, nước. Kỳ sau tự lấy chỉ số cuối kỳ trước làm đầu kỳ.
- Desk tính: tiêu thụ = cuối − đầu; tiền = tiêu thụ × đơn giá; cộng VAT; cộng tiền phòng tháng và dịch vụ phòng phát sinh trong kỳ (dọn phòng thêm 150.000 / 200.000…).
- Phiếu in theo brand OTTIMO, song ngữ EN dẫn – VI hỗ trợ, có VietQR, hạn thanh toán hết ngày 5.
- Đơn giá và % VAT là tham số OWN đổi được trên Desk (GIẢ ĐỊNH, DOM đề xuất % VAT).

## Việc cho đội (nhỏ)
- DOM: quy tắc kỳ, VAT điện/nước, số liệu đồng hồ sai (cuối < đầu, thay đồng hồ), khách trả phòng giữa kỳ.
- ARC → BE → FE: dữ liệu chỉ số đồng hồ, phiếu thu vào folio, trang in. SEC + QA trước khi lên.

## INV bổ sung (17/11)
> note là vẫn nên nhập số điện nước đầu kỳ nha, tại vì có khả năng vận hành nó có những khoảng gap về mặt thời gian, và trong gap đó vẫn có mở tham quan phòng, hoặc dùng nước dọn phòng thì bị hao hụt

→ Chỉ số đầu kỳ là **ô lễ tân nhập**, bắt buộc, không tự lấy cuối kỳ trước làm số chốt. Desk chỉ gợi ý số cuối kỳ trước để so; nếu đầu kỳ > cuối kỳ trước thì phần chênh là hao hụt khoảng trống (tham quan, dọn phòng), **không tính cho khách**, ghi lại để OWN xem. Đầu kỳ < cuối kỳ trước thì cảnh báo (nghi nhập sai/thay đồng hồ).
