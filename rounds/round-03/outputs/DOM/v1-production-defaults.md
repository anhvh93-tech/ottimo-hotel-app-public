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

## 3. Câu cần INV xác nhận (ngắn, có số đề xuất) – **INV đã trả lời 26/10, xem mục 4**
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

## 4. Áp câu trả lời INV 26/10 (Phản hồi & sửa – DOM, 26/10/2026)
Nguồn: `01-decisions/decision-log.md` dòng "INV – trả lời 8 câu DOM". BR nâng lên **v0.4.4** (`product/docs/business-rules.md` mục 18).

| # | INV trả lời | Giá trị nghiệp vụ DOM chốt | BR | Cách đưa vào v1.0 |
|---|---|---|---|---|
| 1 | City View 101, 201; Garden View 102, 103, 202, 203 | `public_room_type`: 101, 201 = **Standard Studio · City View**; 102, 103, 202, 203 = **Standard Studio · Garden View** (chữ theo e-brochure) | BR-012 (6) | Sửa `PRODUCTION_ROOMS` trước B2 (việc T1). Desk không có ô sửa hạng phòng. Nếu để trống, khách đơn OTA chưa báo căn sẽ thấy ô hạng phòng trống (`roomLabel` trả `''`) |
| 2 | Nhân viên và khách đều thấy số + tên phòng | Desk giữ "401 · The Pine". Khách thấy "The Pine · 401" sau khi đã báo căn; chưa báo căn thì dùng hạng phòng. Không gửi số/tên căn cùng mã cửa trong một tin (BR-978 giữ). Landing không liệt kê số căn | BR-012 (1) | **Desk đang hiện tên**, không cần sửa (`packages/i18n/src/roomLabel.ts` – staff = "401 · The Pine"; rack, drawer, phiếu sửa đều dùng). Đóng R3-Q53 / giả định G3: không bỏ tên. Phía khách v1.0 chỉ có tên → thêm số ở v1.0.1 (việc T3) |
| 3 | Phí OTA tạm theo đề xuất | Airbnb 15,5 · Booking 15 · Agoda 18 · Expedia 18 · Trip.com 15 · trực tiếp 0 %. Chưa tạo kênh Traveloka | BR-901 | Đã đúng trong tệp; chỉ đổi nhãn trạng thái |
| 4 | Giá niêm yết đã gồm VAT 8 %, ngày hết hiệu lực cập nhật sau | `vat_rate` 8, `prices_include_vat` true. Theo DOM hiểu, 8 % áp tới 31/12/2026 → **ESC-033** | BR-523 | Đã đúng; mức 10 % từ 01/01/2027 OWN nhập trên app nếu kế toán xác nhận |
| 5 | Điện 5.000 đ/kWh; nước 100.000 đ/người | `electricity_price` 5.000; `water_price` 100.000 **đ/người/tháng** (khóa đổi nghĩa từ đ/m³). Giả định cách tính nước: người ở đăng ký trên HĐ/khai báo, trẻ dưới 6 tuổi miễn, tính theo ngày ở trong tháng (ngày vào tính, ngày trả không tính), làm tròn 1.000, vắng tạm không trừ. Ví dụ: 2 người vào 10/10, tháng 31 ngày → 100.000 × 2 × 22 ÷ 31 = **142.000** | BR-501, 205, 502 | v1.0 chưa có điện nước trong app (release notes: theo sổ tới v1.3). Hai khóa không có mã nào đọc ở v1.0 – chỉ đổi giá trị trong tệp để ghi đúng chính sách |
| 6 | Tết 2027 +30 % 05–10/02; đề xuất thêm mùa | Giữ `[2027-02-05, 2027-02-11)`. Bảng mùa → mục 6 và **ESC-032** | BR-104 | Dòng 1–5 nhập được trên app ở v1.0 |
| 7 | Hạn lưu giấy tờ: toàn bộ 3 tháng, không cần nhấn mạnh với khách | Ảnh người **đã đồng ý**: **90 ngày** sau trả phòng (v1.0 tạm **30** – biên tối đa hiện có). Ảnh khai báo chưa xong: giữ **7 ngày** (biên tối đa; nhóm này gồm cả người không đồng ý, nên "3 tháng" không áp). Hồ sơ điền sẵn: **3 tháng**. Người không đồng ý: vẫn xóa khi khai báo `confirmed` (BR-609). Câu đồng ý vẫn nêu số ngày (bắt buộc khi xin đồng ý), không nhắc thêm ở tin chào hay trang khác | BR-610, 609 | Xem mục 5 (b). SEC đang đánh giá song song – DOM chỉ ghi giá trị nghiệp vụ |
| 8 | Tài khoản cọc chuyển sang tài khoản doanh nghiệp sớm; khai báo lưu trú, trẻ em < 16 làm đúng luật | Giữ: VN trước 23:00 ngày đến (đến từ 23:00 → 08:00 hôm sau) – Luật Cư trú 68/2020/QH14 Điều 30, TT 55/2021/TT-BCA; NN 12 giờ – Luật 47/2014/QH13 (sửa đổi) Điều 33; trẻ em dưới 16 – Luật Trẻ em 102/2016/QH13 Điều 1, NĐ 13/2023 Điều 20 (theo DOM hiểu, luật sư rà) | BR-602, 603, 612 | Đã đúng. Đổi tài khoản nhận cọc: OWN sửa trên app khi có (R3-Q51), không cần đội |

## 5. Kiểm mã: v1.0 làm được mà không sửa mã không?
| Câu | Kết quả kiểm | Kết luận |
|---|---|---|
| (a) Nước theo đầu người | `water_price`, `electricity_price`, `utility_estimate` chỉ có trong catalogue (`db/migrations/0002`, `0003`), seed và `admin/production-defaults.ts`. **Không mã nào đọc** chúng; chưa có bảng chỉ số công tơ (`files/public/attachment.service.ts`: "Meter readings land in R3"). US-064, 065, 041, 081, 114 đều đích **v1.3**. Folio có loại dòng `utilities` nhưng nhân viên không gõ tay được (`FREE_CATEGORIES` = fnb, service_fee, damage) | v1.0 **không cần sửa mã**: điện nước dài hạn theo sổ như release notes và `day-one-guide.md` mục 4.5. Không khuyên ghi tiền nước vào Desk bằng dòng `service_fee` – lệch với sổ, dễ tính hai lần. v1.3: thiết kế US-064/065 theo nghĩa mới (việc T5) |
| (b) Hạn lưu 90 ngày | `id_image_retention_days_after_checkout` biên **0–30** (`db/migrations/0003_parameter_bounds.sql` dòng 78; erd 9.1a: "SEC T02 chỉ được giảm"); `ParameterService.set` từ chối 90 → `PARAM_OUT_OF_RANGE`. `id_image_unconfirmed_max_days` biên 1–7. `document_profile_retention_months` biên 1–12 → 3 đặt được. J16 dùng min(số ngày lúc khách đồng ý, giá trị hiện hành) | **Chặn ở mức tham số** → việc BE T2 (v1.0.1). v1.0 chạy 30 ngày: không chặn ngày chạy, ngắn hơn ý INV (an toàn hơn) |
| (c) Desk hiện tên phòng | `roomLabel(…, 'staff')` = "401 · The Pine", dùng ở `app/rooms.ts`, `RackPage`, `ReservationDrawer`, `WorkOrderDrawer`; giả định G3 chưa được làm ở mã | **Đã hiện**, không có việc FE cho Desk |

### Việc code phát sinh
| Mã | Việc | Ai | Ước công | Chặn v1.0? |
|---|---|---|---|---|
| T1 | `admin/production-defaults.ts` trước B2: `publicRoomType` 6 căn Studio theo mục 4 #1; `electricity_price` 5000, `water_price` 100000 (ghi chú đ/người/tháng); `id_image_retention_days_after_checkout` 1 → **30**; nhãn INV 26/10 cho phí kênh, VAT. Chạy lại test `production-bootstrap` | BE-A (ARC duyệt) | ~30 phút | **Nên làm trước B2.** Không phải logic. Nếu bỏ: OWN sửa giá điện nước và hạn lưu trên app, còn hạng Studio phải OPS sửa SQL |
| T2 | Migration nới biên `id_image_retention_days_after_checkout` lên 0–92, sửa erd 9.1a/4.14, đặt 90, test J16 với 90 ngày | BE-C + SEC duyệt | BE ~2 giờ, SEC ~1 giờ, QA ~1 giờ | Không – v1.0.1 |
| T3 | Khách thấy số căn: BE trả `guestRoomNo` khi đã báo căn (`reservations/public/guest-room-view.ts`, OpenAPI `GuestStay`); guest-web, bill (`CheckOutPage` dòng bill), mẫu tin dạng "The Pine · 401"; giữ BR-978 | BE-D, FE (guest), UXD chuỗi, INT mẫu tin | ~1 ngày-người cả nhóm | Không – v1.0.1 |
| T4 | Mức tăng riêng từng kỳ trong `special_dates` (`upliftPct`, cờ có áp không hoàn cọc), lấy mức cao hơn giữa kỳ và cuối tuần | BE-A, FE, QA | ~1 ngày-người | Không – v1.1, chỉ khi INV chọn dòng 6–7 của ESC-032 |
| T5 | Nước theo người trong US-064/065/081/114: BA/ARC sửa đặc tả (chỉ chốt công tơ điện; nước = người × ngày; trẻ < 6 miễn) | BA, ARC, BE | +0,5 ngày so với ước tính cũ | Không – v1.3 |

## 6. Mùa cao điểm Đà Lạt 2026–2027 (đề xuất – INV chọn ở ESC-032)
Giới hạn v1.0: mọi ngày đặc biệt cùng **+30 %** và tự áp **không hoàn cọc mùa cao điểm** (`cancel_peak_no_refund`). Lưu dạng nửa mở [từ, đến).

| # | Mùa | Đêm áp | % đề xuất | Lý do | Ngày |
|---|---|---|---|---|---|
| 1 | Giáng sinh – Tết Dương lịch | 24/12/2026 → 02/01/2027 `[2026-12-24, 2027-01-03)` (thêm đêm 02/01) | +30 % (v1.0) | 01/01/2027 thứ Sáu → nghỉ 1–3/01 | Chắc |
| 2 | Tết Nguyên đán | 05/02 → 10/02/2027 (đã có) | +30 % (v1.0) | INV xác nhận 26/10; 12–13/02 là T6–T7 tự +15 % | Chắc |
| 3 | Giỗ Tổ | 16/04/2027 (đã có) | +30 % (v1.0) | ESC-015 | Chắc |
| 4 | 30/4–1/5 | 29/04 → 02/05/2027 `[2027-04-29, 2027-05-03)` | +30 % (v1.0) | 1/5 thứ Bảy → nghỉ bù thứ Hai 3/5 (BLLĐ 2019 Điều 111 khoản 3, theo DOM hiểu) | INV xác nhận theo thông báo nghỉ lễ |
| 5 | Quốc khánh | Tạm 01/09 → 02/09/2027 (đã có); thêm 03–04/09 nếu ngày nghỉ thứ hai là 3/9 | +30 % (v1.0) | Lễ 2 ngày, 2/9 thứ Năm | INV/ORC xác nhận theo thông báo |
| 6 | Hè | 01/06 → 15/08/2027, đêm CN–T5 | +10 % (v1.1) | Nghỉ hè học sinh; cuối tuần đã +15 % | INV xác nhận theo số đặt phòng các năm trước |
| 7 | Festival Hoa Đà Lạt | Thường tháng 12, khoảng 2 năm/lần – kỳ 2026 chưa có lịch chắc | +20 % (v1.1) hoặc +30 % nếu 2–3 đêm (v1.0) | Cầu tăng quanh khai mạc, bế mạc | **INV xác nhận ngày** |

Việc hằng năm (giữ từ mục 1): trước 01/2027 nhập 24/12/2027 → 02/01/2028 và Tết 2028 (mùng 1 = 26/01/2028, theo DOM hiểu – kiểm lịch âm khi nhập).

## 7. Câu còn lại cho INV
1. **ESC-032** – mùa cao điểm (bảng mục 6). Đề xuất A: dòng 1–5 cho v1.0, hè và Festival Hoa ở v1.1. Hạn 15/11/2026.
2. **ESC-033** – VAT từ 01/01/2027. Đề xuất A: giữ giá khách trả. Hạn 01/12/2026.
3. Câu xác nhận ngắn (đội đã dùng giả định, không cần ESC): nước 100.000 là **/người/tháng, tính theo ngày ở, trẻ dưới 6 tuổi miễn** – đúng ý anh/chị không? Cần trước v1.3.
4. Câu xác nhận ngắn: v1.0 lưu ảnh giấy tờ **30 ngày**, bản v1.0.1 (tuần đầu) nâng lên 3 tháng – chấp nhận? (đề xuất: chấp nhận, không lùi ngày chạy).
5. Nhắc kế toán/luật sư (không chặn): điện 5.000 đ/kWh có vượt quy định giá điện bán cho người thuê nhà không – cần trước khi in đơn giá vào HĐ dài hạn mới (v1.3). Nếu vượt, phương án: thu điện theo giá bậc EVN, phần chênh gộp vào phí dịch vụ tháng (BR-204).
