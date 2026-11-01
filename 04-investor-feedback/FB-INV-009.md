# FB-INV-009 – Form "Plan your stay": hiện giá niêm yết ước tính khi khách chọn căn

- Ngày: 01/11/2026 | Người gửi: INV | Ghi: ORC | Loại: tính năng mới (landing ottimo.vn, form US-155) | Ưu tiên: P2 | Đích: Round 4 – sau ngày D 02/11, không đụng production trước ngày D | **Trạng thái: Đang làm – gộp vào gói LP-v2 (`rounds/round-04/plan-lp-v2.md`), dùng giả định G1–G3**

## Nguyên văn
> Cái phần lúc mà plan you stay, nó sẽ ra giá niêm yết được ước tính lúc khách hàng request chọn căn luôn.

## Hiện trạng
- Form "Plan your stay" (US-155) cho khách chọn ngày, số khách, hạng căn, ngắn ngày/theo tháng, rồi gửi yêu cầu vào Desk. **Không hiện giá**: lễ tân gửi báo giá sau.
- FB-INV-002 (17/10) chọn A (chỉ yêu cầu, không giá). B = "khách xem được giá thật trước khi gửi" (US-131) để sau. INV 24/10 chốt "không ghi giá trong thân trang".
- FB-INV-009 = làm phương án B về **giá** (chưa gồm phòng trống), chỉ trong form.

## Hiểu của ORC
- Khách chọn **hạng căn + ngày** (hoặc số tháng) → form hiện **"Giá niêm yết ước tính"** cho chuyến đi, ghi rõ: giá cuối cùng nằm trong báo giá OTTIMO gửi.
- Giá lấy từ bảng giá trên Desk (OWN chỉnh được), không gõ cứng vào web. Đổi giá trên Desk → web đổi theo.
- Thân trang vẫn không ghi giá (giữ quyết định 24/10).
- Yêu cầu gửi vào Desk kèm con số ước tính khách đã thấy, để lễ tân báo giá không lệch.

## Việc và vai
| Vai | Việc |
|---|---|
| DOM | Định nghĩa "giá niêm yết": theo đêm, cuối tuần/lễ/mùa cao điểm, giá tháng, giường phụ, đã gồm thuế/phí chưa. Kiểm **rate parity** với Booking.com/Agoda/Airbnb (giá web thấp hơn OTA có thể vi phạm hợp đồng; cao hơn thì khách chuyển sang OTA). |
| PO | User story (nâng US-131), tiêu chí nghiệm thu, câu chữ "ước tính" |
| ARC + BE | API công khai chỉ trả giá ước tính (không lộ giá OTA nền, hoa hồng, biên lợi nhuận), có giới hạn tần suất |
| CPY + UXD | Cách hiện giá theo nhận diện OTTIMO, EN dẫn – VI hỗ trợ (và ko/zh/ru nếu FB-INV-008 làm trước) |
| FE-B | Hiện giá trong form, cập nhật khi đổi căn/ngày |
| SEC | Kiểm API mới không lộ dữ liệu kinh doanh |
| QA | Kiểm giá web = giá Desk cho các ca ngày thường, cuối tuần, lễ, theo tháng |
