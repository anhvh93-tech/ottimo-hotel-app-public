# FB-INV-010 – Đợt 1: landing chỉ bán dài hạn, giá tháng, FAQ dài hạn

Nguồn: `04-investor-feedback/FB-INV-010.md`. Chế độ tiết kiệm token (INV 07/11): đội nhỏ, review rút gọn.

## Mục tiêu
1. Landing chỉ bán **thuê dài hạn** (tối thiểu 1 tháng). Bỏ lựa chọn ngắn ngày/theo đêm khỏi trang và form; khách ngắn ngày không có đường đặt trên landing (không cần nhắc OTA nếu CPY thấy không hợp giọng).
2. Thân trang và form hiện **"From X / month"** theo 4 loại phòng: Studio City, Studio Garden, Premium, Signature. X = giá niêm yết tháng nhỏ nhất của các phòng thuộc loại đó, lấy từ Desk qua API (đổi trên Desk → web đổi theo). Thay quyết định ESC-043 (không hiện giá tháng).
3. FAQ có mục **Long-stay policy**: bàn giao đủ nội thất cơ bản, không gồm amenities; tối thiểu 1 tháng; cọc 1 tháng; điện 4.000đ/kWh, nước 25.000đ/m³; chốt chỉ số ngày cuối tháng, thanh toán trước ngày 5 tháng sau theo số thực tế.
4. Câu chữ landing đưa dài hạn lên đầu (hero, mô tả phòng, CTA).

## Ngoài phạm vi Đợt 1
Lịch phòng trống theo loại phòng, giữ phòng, cọc VietQR (Đợt 2); ghi chỉ số điện nước trên Desk (Đợt 3).

## Vai
| Vai | Việc | Ghi |
|---|---|---|
| CPY | Câu chữ EN dẫn + VI, KO, ZH, RU: FAQ dài hạn, hero/CTA/mô tả phòng hướng dài hạn, nhãn giá tháng | `rounds/round-05/fb-inv-010/CPY-copy.md` |
| BE | API công khai trả giá tháng "từ" theo loại phòng (đã gồm VAT nếu giá Desk gồm VAT, làm tròn 1.000), chỉ trả số công khai | nhánh + PR |
| FE | Landing: bỏ ngắn ngày, hiện giá tháng, FAQ, áp câu chữ CPY | nhánh + PR, sau CPY + BE |
| DOM + SEC | Review rút gọn (quy tắc nghiệp vụ / không lộ dữ liệu) | `rounds/round-05/reviews/` |
| QA | Kiểm trên staging trước khi xin INV OK lên production | |

## Brand
Mọi câu chữ và giao diện theo `00-brief/context/brand/brand-guidelines.md`: màu 80/15/5 (Ivory, Cream, Stone Grey, Ink; Light Oak, Earth Brown; Sage), Lora + Be Vietnam Pro + JetBrains Mono, giọng ngắn, lịch sự, điềm tĩnh, EN dẫn – VI hỗ trợ, không emoji.
