# Giá trị khởi tạo production v1.0 – DOM đối chiếu với BR v0.4.2 (23/10/2026)

- Tệp đối chiếu: `product/services/api/src/admin/production-defaults.ts`, nhánh `r3-v1-prod-bootstrap`. Đối chiếu trên commit `6b5c8ae`; DOM sửa ở commit **`309822b`** (chưa push).
- Căn cứ: `product/docs/business-rules.md` v0.4.2, mục 13 và các BR nguồn (BR-201, 403, 512, 610, 901). Kiểm: tsc sạch, prettier sạch. Test `production-bootstrap` đòi ghi đủ mọi khóa catalogue không có mặc định – không bỏ khóa nào.

## 1. Đã sửa trong tệp (5 khóa: 2 giá trị, 5 nhãn trạng thái)
| Khóa | Cũ | Mới | Lý do |
|---|---|---|---|
| `door_code_min_digits` | 6, nhãn INV-011 | **8**, nhãn INV 19/10 + SEC | BR-403 v0.3.9: mã ngẫu nhiên 8 số (biên catalogue 6–9) |
| `birthday_code_random_digits` | nhãn INV-011 | nhãn **OBSOLETE**, giá trị 3 giữ | Biến thể ngày sinh đã bỏ (v0.3.9); giữ dòng vì catalogue không có mặc định. ARC/BE: gỡ khóa khỏi catalogue ở migration sau |
| `id_image_retention_days_after_checkout` | 30, nhãn PL | **1**, nhãn INV-ESC-001 + SEC | Mục 2 dưới đây; BR-610 sửa theo (v0.4.2) |
| `lease_terms` | nhãn GD | nhãn **INV-005** | BR-201: INV quyết ESC-005 (giá trị khớp từng dòng) |
| `max_open_holds_per_user` | nhãn GD | nhãn **INV-017** | BR mục 13 |

Đúng, không sửa: múi giờ, ngày nghiệp vụ, làm tròn, cuối tuần/ngày đặc biệt (+15%/+30%, mọi kênh), sàn/trần giá, giảm theo số đêm, định mức/sức chứa 10 căn, phụ thu người, ở tối thiểu, cọc 30%, chính sách hủy, no-show, chấm dứt HĐ, giờ nhận/trả, bậc nhận sớm/trả muộn, ân hạn 12:30, FOC và hạn mức, điện nước, VAT, hoa hồng ngắn ngày, khai báo lưu trú, buồng phòng, phí kênh (khớp BR-901), bảng hư hỏng tạm (khớp BR-512). Cách đặt `special_dates` dạng nửa mở đúng (Giỗ Tổ đêm 16/4/2027, đêm 1/9, 24/12–1/1 gồm hai đầu).

Khác biệt ngoài tệp (báo ORC, không chặn lần chạy):
- Catalogue chưa có `stay_waiver_alert_mode`, `stay_waiver_review_hours` (ESC-026), `remote_confirm_timeout_minutes`, `late_fee_fallback_review_hours` (ESC-024), `wifi.ssid`. Nếu mã dùng hằng số thì phải khớp BR mục 13 (notify / 24 / 15 / 24 / "OTTIMO BOUTIQUE STAY"). ARC xác nhận trước khi chạy thật.
- `special_dates` chỉ có tới hết 2027-09: lịch 2027-12-24 → 2028-01-01 và Tết 2028 phải nhập trước 01/2027 (việc hằng năm của OWN). Hướng dẫn vận hành phải ghi việc này.
- Chuỗi đồng ý lưu ảnh (`guest.oci.consent`, VI/EN/RU) đang viết "{days} ngày/days": với 1 ngày, tiếng Anh thành "1 days". UXD cần thêm dạng số ít, hoặc câu "trong vòng 24 giờ sau khi trả phòng".

## 2. Hạn lưu dữ liệu giấy tờ – đề xuất DOM + góc nhìn SEC (INV chấp nhận rủi ro ESC-001 với hạn ngắn nhất)
| Khóa | Hiện | Đề xuất | Lý do nghiệp vụ |
|---|---|---|---|
| `id_image_retention_days_after_checkout` | 30 | **1** (đã đặt) | 0 là mức tối thiểu của catalogue, nhưng sau trả phòng còn cửa sổ 24 giờ (BR-427): buồng phòng phát hiện hư hỏng/mất đồ cần xác định đúng người. Khai báo lưu trú đã xong và có mã hồ sơ, nên ảnh không còn cần cho pháp lý |
| `id_image_purge_max_hours` | 24 | **24** (giữ) | Hạn trên của job dự phòng khi lệnh xóa ngay bị lỗi. Giảm thêm không có lợi thật nếu job không chạy dày hơn |
| `id_image_unconfirmed_max_days` (mặc định catalogue 7, biên 1–7) | 7 | **2** – OWN đặt trên app sau lần đăng nhập đầu | Khai báo chưa xong sau ngày đi dự kiến thì đã trễ hạn luật (BR-602/603). 2 ngày đủ để lễ tân khai bù sau cuối tuần. 1 ngày dễ mất ảnh khi khách đi đêm |
| `document_profile_retention_months` (mặc định 12, biên 1–12) | 12 | **3** – OWN đặt trên app | Hồ sơ giấy tờ chỉ để điền sẵn khi khách quay lại. Khách quay lại vẫn được mã giảm 12 tháng (BR-111) mà không cần hồ sơ giấy tờ. 3 tháng phủ khách ở lặp lại trong mùa |
| Ảnh khách **không đồng ý** | xóa khi khai báo `confirmed` | giữ (BR-609) | Đã là mức ngắn nhất |

Dữ liệu văn bản của khai báo lưu trú (số giấy tờ đầy đủ trong bản ghi khai báo) theo hạn luật – vẫn chờ luật sư (ESC-001), không đổi ở đây.

## 3. Câu cần INV xác nhận (ngắn, có số đề xuất)
1. **Hạng 6 căn Studio**: căn nào là City View, căn nào Garden View? Đội đề xuất theo tầng: **101, 102, 103 Garden View; 201, 202, 203 City View** – anh/chị sửa nếu khác. Tới lúc trả lời, khách thấy chung "Studio".
2. **Tên phòng trên Desk** (R3-Q53, anh/chị nói 22/10 "bỏ qua tên phòng, tập trung số phòng"): đề xuất Desk chỉ hiện **số căn** ("401"), bỏ tên ("The Pine") ở mọi màn nhân viên. Khách vẫn thấy tên phòng theo Brand Guidelines. Hay anh/chị muốn khách cũng chỉ thấy số căn?
3. **Phí từng kênh OTA** đang dùng: Airbnb 15,5% · Booking 15% · Agoda 18% · Expedia 18% · Trip.com 15% · trực tiếp/website/Zalo 0%. Anh/chị gửi số đúng theo hợp đồng từng kênh (có Traveloka không?).
4. **VAT 8% và giá niêm yết đã gồm VAT** (giá 792.000/đêm là giá khách trả, đã có thuế): xác nhận, và nhờ kế toán cho biết ngày mức 8% hết hiệu lực để đội cài mức 10% từ ngày đó.
5. **Giá điện nước khách dài hạn**: **3.500 đ/kWh, 25.000 đ/m³** – giữ nguyên? (kế toán/luật sư xác nhận không vượt giá mua vào theo quy định).
6. **Tết 2027 tăng 30%**: áp các đêm **05/02 – 10/02/2027** (30 Tết tới mùng 5)? Có thêm mùa cao điểm Đà Lạt nào (ví dụ Festival Hoa) không?
7. **Hạn lưu dữ liệu giấy tờ** theo mục 2: ảnh **1 ngày** sau trả phòng; khai báo chưa xong giữ ảnh tối đa **2 ngày**; hồ sơ điền sẵn **3 tháng** – đồng ý?
8. **Các mục còn chờ luật sư/kế toán** (đội dùng giá trị dưới đây tới khi có ý kiến; anh/chị chỉ cần xác nhận đã chuyển luật sư):
   - Hạn khai báo lưu trú: khách Việt trước 23:00 ngày đến (đến khuya thì trước 08:00 hôm sau); khách nước ngoài trong 12 giờ.
   - Dữ liệu trẻ em: dưới 16 tuổi xử lý như dữ liệu nhạy cảm.
   - Tài khoản nhận cọc là tài khoản cá nhân, trong khi doanh nghiệp xuất hóa đơn là CTCP UTMG Living – kế toán xác nhận cách hạch toán.
