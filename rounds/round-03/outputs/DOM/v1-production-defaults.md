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

## 8. FB-INV-004 (INV 26/10) – nhận phòng từ 12:00; giá "từ" trên landing (Phản hồi & sửa – DOM, 26/10/2026)
BR nâng lên **v0.4.6** (`product/docs/business-rules.md` mục 18). Ngày chạy D = 02/11/2026.

### 8.1 Nhận phòng từ 12:00 – quy tắc
INV chốt: trả phòng 12:00 giữ nguyên; **nhận phòng từ 12:00 nếu căn đã sẵn sàng**; căn **chắc chắn sẵn sàng 14:00**; **không phụ thu nhận sớm từ 12:00**.

| BR | Trước | Sau (v0.4.6) | Ghi chú |
|---|---|---|---|
| BR-401 | Nhận 14:00 [GIẢ ĐỊNH], trả 12:00 | Nhận **từ 12:00** khi `VI`/`VC`; chắc chắn sẵn sàng 14:00; trả 12:00 | Thêm (a)–(g): 12:00–14:00 căn chưa sẵn sàng → giữ hành lý, không phụ thu, không giảm giá; quá 14:00 do OTTIMO → sự cố (đổi căn/nâng hạng, FOC tùy trường hợp); chữ khách thấy không hứa "sẵn sàng từ 12:00"; OTA extranet phải cập nhật |
| BR-411 | 0 % từ 14:00; 30 % 10:00–13:59; 50 % 06:00–09:59 | **0 % từ 12:00**; 30 % 10:00–11:59; 50 % 06:00–09:59 | Giữ mốc 10:00/06:00 (ESC-007) – INV xác nhận ở ESC-035 câu 2. Giá 792.000, vào 12:10: trước 238.000 → nay **0** |
| BR-302 | Trần giữ chỗ 12:00 ngày đến | **Giữ 12:00** | Trần = giờ nhận phòng sớm nhất: khách chưa cọc không vào ở; căn được mở bán lại trước giờ khách khác có thể nhận. Luật kiểm `hold_latest_time_on_arrival` ≤ `checkin_time` (cho bằng) vẫn đạt |
| BR-425 nhắc trả phòng | 20:00 hôm trước, 09:00, 11:00; báo đỏ 12:00 (có khách đến) / 12:31 | **Giữ nguyên** | Giờ trả không đổi; căn có khách đến báo đỏ đúng 12:00 vì khách đến có thể tới ngay |
| BR-807 ưu tiên dọn | Khách đến hôm nay theo giờ đến (mặc định 14:00) | Mặc định theo `checkin_time` 12:00 (mã tự theo tham số) + **mục tiêu giờ** (NÊN): căn trống đêm qua có khách đến → kiểm `VI` trước 12:00; căn trả–đến cùng ngày → xong trước 14:00 | Khung dọn căn trả–đến vẫn 12:00–14:00 như trước – không thêm việc, chỉ thêm việc kiểm sớm căn trống |
| BR-812 | Hạn bộ đồ dùng thêm 14:00 ngày đến | 12:00 (mã đọc `checkin_time`) | Buồng phòng chuẩn bị sớm hơn 2 giờ |
| BR-317 | Critical khi ≤ 24 giờ tới 14:00 ngày đến | Tới `checkin_time` (12:00) | Mã đã đọc tham số |
| BR-403 | Mã cửa hiệu lực từ giờ nhận chuẩn | Mã gửi trước chỉ hiệu lực từ 12:00 khi căn sẵn sàng; căn trả–đến cùng ngày từ lúc dọn xong / 14:00 | Chỉ áp khi có TTLock tự động (R3+); v1.0 lễ tân giao mã lúc nhận phòng |
| BR-975 TP-03 | "giờ nhận 14:00" | "nhận từ 12:00 khi phòng sẵn sàng, chắc chắn 14:00; trước 12:00 có phụ thu" | Mẫu tin |
| BR-423 hạn thu tiền gia hạn | 14:00 ngày đầu phần gia hạn [GIẢ ĐỊNH] | Không đổi | Không gắn với giờ nhận phòng |

### 8.2 Kiểm mã: chỉ đổi tham số hay phải sửa mã?
Đọc mã nhận sớm: `frontdesk/public/stay-rules.ts` `earlyCheckinSurcharge` – `t >= standardCheckinTime → 0 %` rồi mới tra bậc; `checkin.service.ts` lấy `standardCheckinTime` từ tham số `checkin_time`, bậc từ `early_checkin_tiers`. Các chỗ khác cũng đọc tham số: `dashboard.service.ts` (thứ tự khách đến), `housekeeping.service.ts` (xếp ưu tiên dọn theo giờ đến), `reservations.service.ts` (mốc critical xung đột), `extra-guest-kit.ts`, `guest-portal.service.ts` (giờ trả về trang khách), `pricing.service.ts`, `getBookingRules`. Không có "14:00" viết cứng trong logic tiền.

**Kết luận: logic chỉ cần đổi tham số. Không sửa mã logic.**

| Khóa (`production-defaults.ts` / catalogue) | Hiện | Đổi thành | Nhãn trạng thái |
|---|---|---|---|
| `checkin_time` | `'14:00'`, `GD` | **`'12:00'`** | `INV-2610` |
| `early_checkin_tiers` | `[{from:'10:00',to:'14:00',pct:30},{from:'06:00',to:'10:00',pct:50}]` | **`[{from:'10:00',to:'12:00',pct:30},{from:'06:00',to:'10:00',pct:50}]`** | `INV-007+INV-2610` |
| `hold_latest_time_on_arrival` | `'12:00'` | Giữ | – |
| `late_checkout_tiers`, `late_grace_until`, `checkout_time`, `checkout_reminders`, `extension_payment_deadline`, `long_stay_free_late_until` | – | Giữ | – |
| `room_ready_guaranteed_time` (mới, 14:00) | Không có | Đề xuất thêm ở **v1.0.1** (migration catalogue + luật kiểm `checkin_time` ≤ khóa + trả về trang khách) | `INV-2610` |

Ghi chú cho BE:
- Bậc 30 % đang là `to:'14:00'`: với `checkin_time` 12:00 thì 12:00–13:59 đã ra 0 % trước khi tra bậc (kết quả đúng ngay cả khi quên đổi bậc), nhưng vẫn phải đổi để dữ liệu khớp BR và để màn Tham số không hiển thị sai. Catalogue chưa kiểm bậc so với `checkin_time` (TODO trong `parameter-rules.ts`) – không chặn.
- Nếu bootstrap production (B2) **đã chạy** trước khi sửa tệp: OWN đổi hai khóa trên màn Tham số của Desk, hiệu lực từ ngày đổi (không cần đội). Staging: QA/OPS đặt cùng giá trị để diễn tập.
- Mã phụ (không chặn D): `reporting/internal/attention-sources.ts` dòng 52 dự phòng `?? '14:00'` → `'12:00'`; `integrations/doorlock/access.ts` mặc định `'14:00'` (chỉ dự phòng, lõi truyền tham số) → `'12:00'` khi INT làm TTLock; `housekeeping/internal/attention-sources.ts` dòng 112 chỉ là chú thích (cảnh báo khóa phòng sắp hết vẫn chạy từ 12:00 hôm trước – vẫn đủ ~24 giờ).
- `apps/admin-web/src/app/rules.ts` `RULE_DEFAULTS.checkinTime: '14:00'` → `'12:00'` (giá trị dự phòng của FE khi vai không đọc được tham số; màn nhận phòng lấy `standardCheckinTime` từ máy chủ).
- `apps/guest-web/src/checkin/eta.ts`: khung giờ đến tự bắt đầu từ `checkinTime` → 12–14, 14–16, 16–22, sau 22. Khung 16–22 rộng 6 giờ (vòng lặp chỉ cho 3 mốc) – FE/MOB nên cho 4 khung (12–14, 14–16, 16–18, 18–22). Minor, không chặn.

### 8.3 Mọi chỗ chữ khách thấy có "14:00" (chỉ liệt kê – CPY/UXD/FE/INT sửa)
Câu chuẩn (BR-401 (e)): **EN "Check-in from 12:00 (your room is always ready by 14:00) · Check-out by 12:00"** / **VI "Nhận phòng từ 12:00 (phòng luôn sẵn sàng lúc 14:00) · Trả phòng trước 12:00"**. Không viết "phòng sẵn sàng từ 12:00". CPY chốt chữ theo Brand Guidelines.

| # | Tệp / chỗ | Hiện | Việc | Ai | Trước D? |
|---|---|---|---|---|---|
| 1 | `product/apps/landing-web/src/content/site.json` `checkinTime` | `"14:00"` | → `"12:00"` (cũng là `checkinTime` trong JSON-LD Hotel của `src/lib/seo.ts`) | FE-LP | Nên (trang đang chạy) |
| 2 | `product/apps/landing-web/src/content/en.ts` dòng 183 (thẻ lễ tân) | "Check-in from 14:00, check-out by 12:00." | Câu chuẩn EN | CPY → FE-LP | Nên |
| 3 | `en.ts` dòng 286 (FAQ boutique stay) | "Check-in from 14:00, check-out by 12:00." | Câu chuẩn EN | CPY → FE-LP | Nên |
| 4 | `product/apps/landing-web/src/content/vi.ts` dòng 183 | "Nhận phòng từ 14:00, trả phòng trước 12:00." | Câu chuẩn VI | CPY → FE-LP | Nên |
| 5 | `vi.ts` dòng 285 | như trên | Câu chuẩn VI | CPY → FE-LP | Nên |
| 6 | `product/design/copy/strings-{en,vi,ru}.json` `guest.oci.done_body` (trang khách – check-in online xong) | "Your room is ready from {time}" / "Phòng sẵn sàng từ {time}" – với tham số mới sẽ thành **"ready from 12:00" = hứa sai** | Đổi thành "Check-in from {time}, once your room is ready – it is always ready by 14:00." (VI/RU tương ứng). v1.0: 14:00 viết trong chuỗi; v1.0.1 thay bằng biến từ `room_ready_guaranteed_time` | UXD/CPY → FE (guest-web) | **Có** – nếu không sửa, khách nhận lời hứa sai ngay khi đổi tham số |
| 7 | `strings-*.json` `guest.stay.checkin_time` (HomePage, InfoPage) | "Check-in from {time}" | Giữ biến; thêm vế "(ready by 14:00)" nếu UXD đủ chỗ | UXD → FE | Nên |
| 8 | `strings-*.json` `msg.booking_confirmed` (mẫu tin xác nhận – Zalo/email; cũng trong `design/content-guide.md`, `design/tools/gen_strings.py`, `design/tools/strings-tables.md`, `design/design-system.md`) | "Check-in from 14:00, check-out by 12:00" viết cứng | Câu chuẩn, dùng biến `{checkin_time}`/`{checkout_time}` như content-guide dòng 180 đã yêu cầu | UXD/CPY → INT | Nên (v1.0 tin gửi tay) |
| 9 | Mẫu ZNS `zns.arrival_reminder` (`integrations/notification/zalo-policy.ts`, biến `checkin_time`) | Giá trị lấy từ tham số → tự thành 12:00 | Nếu chữ mẫu đã đăng ký với Zalo ghi "Giờ nhận phòng: {checkin_time}" thì đổi thành "Nhận phòng từ" khi đăng ký lại; không gửi ZNS trước khi mẫu được duyệt | INT | Không (ZNS chưa chạy ở v1.0) |
| 10 | Mẫu TP-03 (BR-975) nhắc trước 1 ngày | "giờ nhận 14:00" | Câu chuẩn + phụ thu trước 12:00 | UXD/CPY → INT | Nên (v1.0 gửi tay theo mẫu) |
| 11 | Email (`integrations/notification/email-templates.ts`) | Không có giờ nhận phòng | Không việc | – | – |
| 12 | Bill / phiếu in (`CheckOutPage`, bill tạm) | Không in giờ nhận phòng | Không việc | – | – |
| 13 | Ngoài repo: extranet Booking/Agoda/Airbnb, Google Maps, e-brochure, fanpage, thẻ trong căn, biển quầy | 14:00 | INV/OWN cập nhật câu chuẩn – điều kiện thu phụ thu nhận sớm khách OTA (BR-415) | INV | **Có** cho extranet (trước D) |
| 14 | Tài liệu nhân viên: `product/docs/staff-one-pager.md` dòng 18 ("14:00 – Giờ nhận phòng"), `product/docs/day-one-guide.md` (mục 0 "Mốc chuyển = 14:00 (giờ nhận phòng chuẩn)", mục 2 "giờ nhận 14:00") | 14:00 | One-pager: "12:00 nhận phòng nếu căn `VI`/`VC`; 14:00 chắc chắn sẵn sàng; trước 12:00 Desk tính phụ thu". Day-one: **giữ mốc chuyển 14:00** (mốc sổ sách, ≥ 12:00 nên không phát sinh phụ thu) nhưng sửa chữ "giờ nhận phòng chuẩn" → "giờ phòng chắc chắn sẵn sàng"; khách mới đến ngày D từ 12:00 nhận trên Desk ngay khi căn đã cập nhật `VI`/`VC` (buổi đi căn 12:30–13:45 làm căn có khách đến trước) | PO | **Có** (phát cho nhân viên D−1) |
| 15 | Wireframe/hi-fi/mock (`design/wireframes/*`, `design/landing/mock/index.html`, `design/landing/concept.md`, `apps/*/src/mocks/*`) | 14:00 | Không chặn; UXD sửa khi chạm lại | UXD | Không |

### 8.4 Giá "chỉ từ 700.000 đ" – kiểm bảng giá thật
Nguồn: BR-101 (giá đêm = giá tháng ÷ 12, BL 4.1), BR-104 (thứ Sáu/thứ Bảy +15 %, ngày đặc biệt +30 %, mọi kênh), BR-523 (giá đã gồm VAT 8 %), BR-110 (giá cho định mức). Giá phòng production **không** nằm trong `production-defaults.ts` – OWN nhập trên Desk sau đăng nhập đầu (tệp ghi rõ); con số dưới đây đúng khi OWN nhập đúng bảng giá ESC-004.

| Căn | Hạng công khai | Ngày thường | T6, T7 (+15 %) | Ngày đặc biệt (+30 %) |
|---|---|--:|--:|--:|
| 101 | Standard Studio · City View | **667.000** | 767.000 | 867.000 |
| 201 | Standard Studio · City View | 708.000 | 814.000 | 920.000 |
| 102, 103 | Standard Studio · Garden View | 750.000 | 863.000 | 975.000 |
| 202, 203 | Standard Studio · Garden View | 792.000 | 911.000 | 1.030.000 |
| 302 | Premium · One Bedroom + 1 | 917.000 | 1.055.000 | 1.192.000 |
| 301 | Signature · Two Bedrooms | 958.000 | 1.102.000 | 1.245.000 |
| 402 | Premium · One Bedroom + 1 | 1.000.000 | 1.150.000 | 1.300.000 |
| 401 | Signature · Two Bedrooms | 1.042.000 | 1.198.000 | 1.355.000 |

- Đêm khách thực trả ≤ 700.000: **chỉ căn 101, đêm Chủ nhật – thứ Năm không phải ngày đặc biệt, 1–2 khách, kênh Trực tiếp: 667.000 đ** (đã gồm VAT, không phụ phí; người thứ 3 +150.000). Không có đêm đúng 700.000. OTA thấp nhất 760.000 (Lầu 1–2). Giảm ≥ 7 đêm (101: 600.000) và mã khách quay lại không dùng làm giá "từ" (điều kiện nặng).
- Khách staycation hay đi cuối tuần: thấp nhất **767.000**/đêm, tối thiểu 2 đêm (BR-113) → 2 đêm 1.534.000.
- Kết luận: "chỉ từ 700.000 đ" không sai hướng (có giá thấp hơn) nhưng không phải giá thật nào. INV 26/10 (decision-log) đã đồng ý **"chỉ từ" với con số theo DOM kiểm giá thật** → landing ghi **"Chỉ từ 667.000 đ/đêm"** + câu điều kiện; quy tắc mới **BR-114**. Không cần ESC cho con số; ESC-035 chỉ hỏi bậc phụ thu trước 12:00 và báo con số.

**Ghi cho CPY** (Brand Guidelines: EN dẫn, VI hỗ trợ, ngắn, điềm tĩnh, không emoji; VI dùng "chỉ từ" theo INV 26/10; không dùng "giá sốc", "rẻ nhất"):
- Bản tối thiểu: EN "From 667,000 VND a night" + dòng nhỏ ngay dưới, cùng khối: "For two, taxes included. Weekday nights, booked direct; weekends and holidays are higher." / VI "Chỉ từ 667.000 đ/đêm" + "Cho 2 khách, đã gồm thuế. Đêm ngày thường, đặt trực tiếp; cuối tuần và ngày lễ cao hơn."
- Bản có cuối tuần (DOM gợi ý vì khách staycation hay đi cuối tuần – CPY quyết): EN "Weekdays from 667,000 VND · Weekends from 767,000 VND, a night" + "For two, taxes included, booked direct. Weekends: two nights minimum; holidays are higher." / VI "Chỉ từ 667.000 đ/đêm ngày thường · cuối tuần từ 767.000 đ" + "Cho 2 khách, đã gồm thuế, đặt trực tiếp. Cuối tuần tối thiểu 2 đêm; ngày lễ cao hơn."
- Câu điều kiện là bắt buộc (BR-114 (2)), không đưa xuống chú thích cuối trang. Định dạng số theo content-guide (VI "667.000 đ", EN "667,000 VND").
- Một nguồn: FE-LP thêm `booking.fromNightlyVnd` (667000) và `booking.fromWeekendNightlyVnd` (767000) vào `site.json`, chữ đọc từ đó; `copy.test.ts` kiểm chữ khớp số.
- Đăng sau khi INV tự kiểm điều khoản ngang giá OTA (ESC-035 mục "Việc anh/chị làm"); đích: bản landing kế tiếp sau ngày D (decision-log INV 26/10).

### 8.5 Việc cụ thể theo vai
| Mã | Việc | Ai | Ước công | Chặn D 02/11? |
|---|---|---|---|---|
| F1 | `production-defaults.ts`: `checkin_time` 12:00, `early_checkin_tiers` bậc 30 % `to:'12:00'`, nhãn `INV-2610`; chạy test `production-bootstrap`. Nếu B2 đã chạy: OWN đổi trên màn Tham số | BE-A (ARC duyệt) | ~15 phút | **Có** – không đổi thì Desk thu 30 % khách vào 12:00–13:59, trái chính sách INV (sai tiền) |
| F2 | Staging: đặt hai khóa như F1; QA chạy lại ca nhận sớm: 11:59 → 30 %, 12:00 → 0, 13:30 → 0, 09:59 → 50 %, 05:59 → đêm B9a; ưu tiên dọn khách đến không báo giờ = 12:00; hạn bộ đồ dùng thêm 12:00 | QA | ~1 giờ | Có (xác nhận F1) |
| F3 | Chuỗi `guest.oci.done_body` (EN/VI/RU) theo 8.3 #6; xem #7 | UXD/CPY → FE | ~30 phút | **Có** (hứa sai với khách) |
| F4 | `RULE_DEFAULTS.checkinTime` 12:00 (admin-web); khung giờ đến 4 khung (guest-web) | FE | ~30 phút | Không (F4b Minor) |
| F5 | Landing: `site.json` 12:00 + 4 câu ở 8.3 #1–5 | CPY → FE-LP | ~30 phút | Nên trước D |
| F6 | Mẫu tin `msg.booking_confirmed`, TP-03 theo câu chuẩn, dùng biến | UXD/CPY → INT | ~30 phút | Nên (tin gửi tay ở v1.0) |
| F7 | `staff-one-pager.md`, `day-one-guide.md` theo 8.3 #14 | PO | ~20 phút | **Có** (phát D−1) |
| F8 | Khóa `room_ready_guaranteed_time` (migration, luật kiểm, `GuestStay`), thay 14:00 viết trong chuỗi bằng biến; mã cửa TTLock theo BR-403 v0.4.6 | ARC → BE, INT | ~2 giờ | Không – v1.0.1 / khi làm TTLock |
| F9 | Landing "Chỉ từ 667.000 đ/đêm" + câu điều kiện theo BR-114, số trong `site.json` | CPY → FE-LP | ~2 giờ | Không – bản landing sau D |
| F10 | Extranet OTA, Google Maps, fanpage, thẻ trong căn: giờ nhận từ 12:00 (chắc chắn 14:00); kiểm điều khoản ngang giá | INV/OWN | – | **Có** cho extranet OTA |

### 8.6 Câu cho INV
- **ESC-035** (mới): giữ bậc phụ thu trước 12:00 (đề xuất A, đang áp). Hạn 01/11. Kèm báo con số landing 667.000 đ (INV đã đồng ý "chỉ từ" theo giá thật – không hỏi lại).
- Việc INV tự làm: cập nhật giờ nhận phòng trên extranet OTA trước D; xem điều khoản ngang giá trước khi đăng giá.
