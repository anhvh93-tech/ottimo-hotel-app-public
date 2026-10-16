# Định nghĩa chỉ số – OTTIMO Desk

- Tác giả: DATA | Round 1 – Bước 4 (Phản hồi & sửa) | Ngày: 15/10/2026 | Phiên bản: 0.2 (đã xử lý PO-on-DATA và lỗi tự nhận D-1…D-10 trong DATA-on-ARC; xem mục 10)
- Đầu vào: `product/docs/round-0-baseline.md` (gọi tắt **BL**) mục 3.2, 3.20, 5.11, 8.2; `product/docs/business-rules.md` (gọi tắt **BR**), nhất là BR-002, 003, 215, 301, 804, 901–904; `product/docs/PRD.md` mục 3; `product/docs/baseline-issues-triage.md`; `product/docs/security/data-risk-assessment.md` mục 3; `01-decisions/decision-log.md`.
- Phạm vi Round 1 (quyết định P1): **chỉ định nghĩa công thức và dữ liệu cần lưu**. Tracking sự kiện, truy vấn mẫu, dashboard, đặc tả báo cáo để Round 2–3.
- Tài liệu này là **nguồn sự thật cho công thức chỉ số**. Con số quy tắc (giá, %, giờ, phí) vẫn lấy từ `business-rules.md`; ở đây chỉ tham chiếu mã BR.
- Mọi con số ví dụ lấy từ dữ liệu mẫu tháng 9–10/2026 trong prototype (BL) hoặc là ví dụ giả lập ghi rõ "ví dụ". Không dùng số liệu thị trường/benchmark bên ngoài.

---

## 0. Cách đọc

| Ký hiệu | Ý nghĩa |
|---|---|
| **Q-xx** | Quy ước nền, áp dụng cho mọi chỉ số |
| **K-xx** | Chỉ số kinh doanh (vận hành, doanh thu, kênh, lợi nhuận) |
| **S1–S12** | Chỉ số thành công sản phẩm trong PRD mục 3.2 |
| `Thực_thể.trường` | Trường dữ liệu cần lưu – danh sách đầy đủ gửi ARC ở **mục 9** |
| **[DATA chốt]** | Quy ước công thức thuộc quyền DATA (ghi decision-log qua ORC) |
| **[GIẢ ĐỊNH – chờ INV xác nhận]** | Phụ thuộc chính sách hoặc mục tiêu của INV |

Mỗi chỉ số có: định nghĩa · công thức · nguồn dữ liệu · quy ước biên · ví dụ tính.

---

## 1. Quy ước nền (Q-xx)

### Q-01. Múi giờ, ngày kinh doanh
- Mọi mốc thời gian lưu dạng thời điểm có múi giờ (UTC trong DB), **quy đổi về Asia/Ho_Chi_Minh khi tính chỉ số** (BR-001).
- **Ngày lưu trú (stay date)** của một đêm = ngày lịch khách bắt đầu ngủ đêm đó (BR-002, BR-003). Đơn đến 19/10, đi 22/10 có 3 ngày lưu trú: 19, 20, 21/10.
- Kỳ báo cáo (ngày/tuần/tháng/quý/năm) **lọc theo ngày lưu trú** cho chỉ số đêm và doanh thu; **lọc theo thời điểm sự kiện** cho chỉ số dòng tiền và chỉ số quy trình (S2–S8).
- **Ngày nghiệp vụ (business date) đổi lúc 06:00** (decision-log DOM 15/10/2026): một thời điểm `t` thuộc ngày nghiệp vụ = ngày lịch của (`t` giờ VN − 6 giờ). Khách đến 01:30 ngày 21/10 thuộc ngày nghiệp vụ 20/10, khớp BR-003 (đêm 20/10). Áp dụng cho: "đêm nay" trên Tổng quan (K-03 biến thể đêm nay, chuyển ngày lúc 06:00), ngày ghi nhận phí hủy/no-show/phí trả sớm (Q-09), ngày phát hiện sự cố (S1), kỳ của chỉ số quy trình S2–S8 và K-22. **Ngoại lệ**: dòng tiền K-20 lọc theo **ngày lịch** của `received_at` để khớp sao kê ngân hàng/cổng thanh toán (báo cáo ghi rõ "theo ngày thu"). **[DATA chốt]**
- Tuần bắt đầu Thứ Hai. Tháng = tháng lịch (của ngày lưu trú hoặc ngày nghiệp vụ tương ứng).

### Q-02. Đêm-phòng là đơn vị gốc
Mọi chỉ số đêm và doanh thu phòng tính trên **bảng đêm-phòng** (mỗi dòng = 1 căn × 1 ngày lưu trú × 1 đơn hoặc 1 khối OOO). Không tính lại từ `ngày đi − ngày đến` ở tầng báo cáo, để các trường hợp gia hạn, đổi phòng giữa kỳ, trả sớm, giá khác nhau từng đêm đều đúng. **[DATA chốt]** – lý do và cấu trúc ở mục 9 (thực thể `StayNight`).

### Q-03. Trạng thái đơn và việc tính đêm/doanh thu (theo BR-301, BR-904)

| Trạng thái đơn | Khóa tồn phòng? | Là **đêm bán**? | Có **doanh thu phòng**? | Ghi chú |
|---|:-:|:-:|:-:|---|
| `hold` | Có | **Không** | Không | Hiện riêng ở chỉ số "giữ chỗ đang treo" và "đã đặt trước (gồm giữ chỗ)" |
| `confirmed` | Có | Có | Có (dồn tích theo đêm) | Đêm tương lai = "đã đặt trước" (on the books) |
| `in_house` | Có | Có | Có | |
| `checked_out` | – | Có (các đêm đã ở thật) | Có | Trả sớm: các đêm bỏ không còn là đêm bán (Q-07) |
| `cancelled` | Không | **Không** | Không | Phí hủy, cọc giữ lại → **doanh thu khác** (Q-09) |
| `no_show` | Không | **Không** | Không | Cọc giữ lại / phí no-show → **doanh thu khác** |
| Khối OOO (không phải đơn, BR-804) | Có | Không | Không | Bị **trừ khỏi đêm khả dụng** (Q-04) |

### Q-04. Đêm khả dụng và OOO
- **Đêm khả dụng (gộp)** = Σ theo ngày trong kỳ của số căn **đang kinh doanh** ngày đó (`Room.active_from ≤ ngày < Room.active_to`, `Room.is_sellable = true`). MVP: 10 căn × số ngày.
- **Đêm OOO** = số cặp (căn, ngày lưu trú) nằm trong khối OOO `room_block` có `status IN (active, released)` và `start_date ≤ ngày < coalesce(end_date_actual, end_date_planned)`. Khoảng **nửa mở** [ngày bắt đầu, ngày mở bán lại) – theo quyết định DOM "Khối OOO lưu nửa mở; mở bán lại mặc định = ngày xong + 1", cùng cách tính đơn BR-002. Khối `planned` (chưa kích hoạt) và `cancelled` **không tính**. Khối mở sớm (sửa xong sớm) chỉ tính tới `end_date_actual`. Ví dụ: căn 401 sửa 15–17/10, xong chiều 17/10 → mở bán lại 18/10 → khối [15/10, 18/10) = **3 đêm** OOO (15, 16, 17).
- **Đêm khả dụng (thuần)** = Đêm khả dụng (gộp) − Đêm OOO. **Mọi chỉ số Occupancy, RevPAR, GOPPAR dùng đêm khả dụng thuần.** **[DATA chốt]** (sửa BL 8.2 #29, BR-804, BR-904).
- Một đêm vừa có đơn bán vừa nằm trong khối OOO (dữ liệu sai, BR-804 cấm) → **tính là đêm bán, không trừ OOO** và sinh cảnh báo chất lượng dữ liệu (mục 6, R-05).
- **Đêm xung đột chưa gán căn** (đơn OTA về khi đã hết căn, `stay_night.room_id IS NULL`, xem Q-05) **không trừ** khỏi đêm khả dụng và không làm thay đổi mẫu số.
- Khối "dùng nội bộ" (chủ đầu tư/nhân viên ở, không thu tiền) **không phải OOO**: tạo thành đơn kênh `Nội bộ`, giá 0 → là đêm có khách miễn phí (Q-05).
- Báo cáo luôn hiện **cả hai mẫu số** (gộp và thuần) cùng số đêm OOO để chủ đầu tư thấy công suất mất do sửa chữa.

### Q-05. Đêm bán, đêm miễn phí, đêm có khách
- **Đêm `sold`** = đêm-phòng (`stay_night.night_state = 'sold'`) thuộc đơn `confirmed`/`in_house`/`checked_out`. Chia làm hai loại **[DATA chốt]** (sửa D-1, FB-R1-DATA-ARC-03):
  - **Đêm có khách (đã gán căn)** = đêm `sold` có `room_id IS NOT NULL`. Đây là **tử số Occupancy** → công suất luôn ≤ 100%.
  - **Đêm xung đột chưa gán căn** = đêm `sold` có `room_id IS NULL` (đơn OTA về khi đã hết căn, BR-312, erd mục 7). Không chiếm căn nào → **không** vào Occupancy, **không** trừ đêm khả dụng; báo riêng ở chỉ số giám sát **S1c** (mục 4) cạnh S1b.
- **Đêm miễn phí (comp)** = đêm `sold` có `StayNight.is_complimentary = true`.
- **Đêm bán (có thu tiền)** = Đêm `sold` (gồm cả đêm chưa gán) − Đêm miễn phí. **Doanh thu phòng và ADR gồm cả đêm chưa gán căn** (đã cam kết với kênh, tiền vẫn phát sinh). Khi xung đột được giải quyết: `reassigned_same_group`/`upgraded` → đêm có `room_id`, tự vào công suất; `relocated_external` (giá trị `overbooking_incident.resolution`) → đơn `cancelled` với `cancel_reason_code = overbooking_relocated` (BR-308), đêm `void` với `void_reason = relocated_external`, ra khỏi đêm bán và doanh thu phòng, chi phí dời khách vào GOP (K-15).
- **Occupancy dùng đêm có khách đã gán** (căn thật sự bị chiếm, gồm đêm miễn phí); **ADR dùng đêm bán có thu tiền** (để đêm 0 đồng không kéo giá trung bình xuống). **[DATA chốt]**. Với OTTIMO số đêm miễn phí rất ít, nhưng phải tách để chỉ số không bị bóp méo khi có.
- **Nguồn đêm miễn phí** (sửa D-7, khớp FB-R1-DATA-ARC-02):
  - Đơn kênh `Nội bộ` giá 0 → `is_complimentary = true` ngay khi tạo.
  - Đơn có thu tiền, **sau đó** được FOC 100% một đêm (bù sự cố BR-431, duyệt qua BR-432–433) → khi duyệt, đêm đó: `discount_vnd = room_revenue_gross_vnd`, `room_revenue = 0`, `is_complimentary = true`.
  - **Giảm một phần** trên tiền phòng (BR-107, BR-111, giảm giá đặc biệt BR-431) gắn một đêm → `room_revenue = gross − giảm`, đêm **vẫn là đêm bán**. Giảm cho cả đơn (không gắn đêm) → phân bổ theo tỷ lệ doanh thu đêm, phần nguyên đồng, dư dồn đêm cuối (Q-12).
  - Yêu cầu bị từ chối hoặc dòng FOC/giảm bị đảo bút toán → trả lại giá trị trước đó.
  - FOC phụ thu, minibar, dịch vụ **không chạm** `stay_night` (thuộc doanh thu khác, chỉ ở `folio_line`).

### Q-06. Nhận phòng trước 06:00 và trả phòng sau 18:00
- Nhận trước 06:00 = dùng đêm hôm trước (BR-003, BR-411 mức 100%) → **sinh thêm 1 đêm-phòng** cho ngày hôm trước; tiền đó là **doanh thu phòng**, không phải phụ thu.
- Trả sau 18:00 = thêm 1 đêm, xử lý như gia hạn (BR-416) → **là đêm bán, doanh thu phòng**.
- Phụ thu nhận sớm 30%/50% và trả muộn 30%/50% **không** sinh đêm → **doanh thu khác** (BR-904).
- **Đã chốt** – DOM xác nhận "BR-411: nhận trước 06:00 = đêm bán" (decision-log 15/10/2026), đóng câu O-5. Đêm thêm này có `rate_source = early_night`, thuộc **ngày nghiệp vụ** hôm trước (Q-01).

### Q-07. Thay đổi đơn: gia hạn, đổi phòng, trả sớm
- **Gia hạn**: các đêm thêm là đêm-phòng mới. Đơn OTA gia hạn tạo **đơn con kênh Trực tiếp** liên kết đơn gốc (BR-422) → doanh thu đêm gia hạn tính vào kênh Trực tiếp; cùng một **lượt lưu trú** (stay) cho ALOS (K-14).
- **Đổi phòng giữa kỳ** (BR-424): đêm-phòng từ ngày đổi chuyển sang căn mới; đơn vẫn là một lượt lưu trú.
- **Trả sớm** (BR-428): các đêm không ở chuyển `void` với `void_reason = early_departure` (không còn đêm bán, vẫn giữ dòng để truy vết); phần tiền không hoàn của các đêm đó → **doanh thu khác** (dòng "phí trả phòng sớm").
- **Đổi ngày** (B7/B8): đêm cũ `void` với `void_reason = date_change`, đêm mới sinh với `sold_at` mới. Đêm `date_change` **không** phải đêm mất (K-22).
- **No-show một phần** (đến trễ 1 đêm, đã báo): đêm vẫn tính (BR-311).

### Q-08. Doanh thu phòng ngắn ngày
- Doanh thu phòng của một đêm = **giá đêm đã chốt của đêm đó** (snapshot, BR-106) sau mọi giảm giá áp trên tiền phòng (BR-107, BR-111, giảm giá đặc biệt BR-431), **trước** phí kênh/hoa hồng.
- Đơn OTA: doanh thu phòng = **tiền phòng của đơn trên OTA trước khi OTA trừ hoa hồng** (giá khách trả cho phòng), **không gồm** phí dịch vụ OTA thu riêng của khách và thuế OTA tự thu hộ. Ưu tiên số từ channel manager; nhập tay thì lễ tân nhập "tiền phòng" theo extranet.
- **VAT**: giá niêm yết đã gồm VAT (BR-523). Báo cáo vận hành **dùng số gồm VAT** để khớp giá bán và số liệu tháng 9 trong BL; lưu sẵn thuế suất snapshot để xuất thêm cột "trước VAT" khi kế toán chốt thuế suất (BL 9 #16). **[GIẢ ĐỊNH – chờ INV/kế toán xác nhận]**.

### Q-09. Phân loại khoản thu (dùng cho doanh thu phòng / doanh thu khác / không phải doanh thu)

| Nhóm | Gồm | Ghi nhận vào kỳ nào |
|---|---|---|
| **Doanh thu phòng** | Tiền phòng ngắn ngày theo đêm; tiền thuê dài hạn (phân bổ theo đêm, Q-10); đêm gia hạn; đêm thêm do nhận trước 06:00 / trả sau 18:00; tiền ngày lẻ dài hạn (BR-210) | Ngày lưu trú của đêm |
| **Doanh thu khác** | Phụ thu nhận sớm/trả muộn (không sinh đêm); phụ thu người thêm (BR-110); minibar, F&B, giặt ủi, dọn lẻ; **phí dịch vụ & dọn theo gói của dài hạn** (BR-204); **điện nước thu lại** (BR-501); phí phạt, bồi thường (BR-511, 512); phí hủy, cọc/ký quỹ bị giữ lại, phí no-show, phí trả sớm, phạt chấm dứt HĐ | Phát sinh theo ngày dịch vụ (`FolioLine.service_date`); phí dịch vụ dài hạn phân bổ theo đêm như tiền thuê; điện nước theo kỳ công tơ; phí hủy/no-show theo ngày hủy/ngày đánh dấu no-show |
| **Không phải doanh thu** | Cọc, ký quỹ khi đang giữ (BR-206, BR-523); tiền thu trước cho kỳ chưa tới; tiền hoàn | Theo dõi ở dòng tiền (K-20) và sổ ký quỹ |
| **Giảm trừ** | Dòng FOC âm (BR-434) triệt tiêu đúng nhóm của dòng gốc | Cùng kỳ, cùng nhóm với dòng được miễn |

Phụ thu người thêm xếp vào doanh thu khác **[DATA chốt]** vì BR-904 nêu "doanh thu phòng không gồm phụ thu"; nếu INV muốn tính vào giá phòng (ADR) thì chỉ đổi phân loại, không đổi dữ liệu.

### Q-10. Doanh thu dài hạn: phân bổ **theo đêm**, không theo kỳ thu **[DATA chốt]** (BR-215, sửa BL 8.2 #22)

**Lựa chọn:** doanh thu phòng dài hạn được ghi nhận **theo đêm ở**, mỗi **tháng hợp đồng** chia đều cho số đêm của tháng hợp đồng đó. Tiền thu theo kỳ (thường 3 tháng/lần) là **dòng tiền**, theo dõi riêng (K-20).

- **Thay thế câu "÷ số đêm của tháng lịch" ở BR-215**: DOM đã chốt "BR-215: phân bổ dài hạn chia theo số đêm của tháng hợp đồng" (decision-log 15/10/2026). Nếu `business-rules.md` chưa đổi câu chữ thì Q-10 là nguồn đúng – chờ DOM cập nhật văn bản BR-215 (FB-R1-PO-DATA-03).
- **Tháng hợp đồng** thứ k = [ngày bắt đầu + (k−1) tháng lịch, ngày bắt đầu + k tháng lịch) theo BR-209.
- **Doanh thu phòng 1 đêm** = tiền thuê tháng (snapshot HĐ) ÷ số đêm của tháng hợp đồng chứa đêm đó.
- HĐ bắt đầu ngày 1 → tháng hợp đồng trùng tháng lịch → đúng ví dụ BR-215.
- Làm tròn: chia lấy phần nguyên đồng cho từng đêm, **phần dư dồn vào đêm cuối của tháng hợp đồng** để tổng tháng = đúng tiền thuê tháng.
- Phí dịch vụ & dọn theo gói (BR-204) phân bổ theo đêm theo cùng cách nhưng vào **doanh thu khác**.
- Ngày lẻ ngoài kỳ (BR-210): đêm lẻ mang đúng số tiền đã tính cho ngày lẻ.
- Chấm dứt sớm (BR-313): các đêm sau ngày trả phòng thực tế bị xóa khỏi bảng đêm-phòng; ký quỹ bị giữ lại → doanh thu khác (dòng "phạt chấm dứt HĐ") ngày chấm dứt; tiền thuê đã thu nhưng không hoàn của tháng đang ở vẫn là doanh thu phòng của các đêm đã ở; phần dư (nếu có) vào doanh thu khác.

**Vì sao chọn theo đêm, không theo kỳ thu:**
1. ADR, RevPAR, Occupancy so sánh **đêm với tiền của chính đêm đó**. Nếu ghi theo kỳ thu, tháng thu quý (ví dụ 1/8 thu 36,03 tr của Daniel) có doanh thu phòng gấp 3 trong khi 2 tháng sau có đêm bán mà doanh thu = 0 → ADR tháng 8 phồng, tháng 9–10 tụt, sai hướng cho quyết định giá.
2. So sánh công bằng ngắn ngày và dài hạn trên cùng bảng đêm-phòng (cùng đơn vị "đồng/đêm").
3. Không cần quy ước làm tròn tháng như prototype (`round(ngày/30)`), vốn làm doanh thu nhảy bậc và sai khi HĐ bắt đầu giữa tháng (BL 8.2 #22).
4. Chia theo **tháng hợp đồng** (thay vì chia theo số đêm của tháng lịch như câu chữ BR-215) giữ đúng **tổng HĐ = Σ doanh thu các đêm**, kể cả HĐ bắt đầu giữa tháng; khi HĐ bắt đầu ngày 1 hai cách cho kết quả giống hệt.
5. Dòng tiền theo kỳ vẫn đủ thông tin cho việc nhắc thu (BR-207) nhờ chỉ số riêng K-20.

**Ví dụ:**
- Daniel (301, HĐ từ 1/8/2026, thuê 11.130.000): tháng 10 có 31 đêm → 11.130.000 ÷ 31 = 359.032,26 → 30 đêm × 359.032 + đêm 31/10 = 359.040 → **tổng tháng 10 = 11.130.000** (khớp BR-215). Tháng 11 (30 đêm): **371.000/đêm**. Tiền thu 36.030.000 ngày 1/8 là dòng tiền tháng 8, không phải doanh thu phòng tháng 8.
- Ví dụ HĐ bắt đầu 15/10, thuê 9.500.000: tháng HĐ 1 = 15/10–14/11 (31 đêm). Tháng 10 nhận 17 đêm = **5.209.677**; tháng 11 nhận 14 đêm = **4.290.323**; tổng = 9.500.000 ✔. Nếu chia theo tháng lịch, 14 đêm tháng 11 ÷ 30 → 4.433.333, tổng 9.643.333 ≠ tiền thuê (sai 143.333).
- Prototype (cách cũ): Daniel tính `round(ngày đã ở / 30)` tháng × tiền thuê, tới 14/10 = 75 ngày → round(2,5) = 3 tháng = 33.390.000: hôm trước (74 ngày) chỉ là 2 tháng = 22.260.000, tức doanh thu nhảy 11,13 tr trong một ngày và không chia được theo tháng.

### Q-11. Kênh và loại lưu trú là **hai chiều tách biệt** **[DATA chốt]**
- **Loại lưu trú** (`Booking.stay_type`): `short` (ngắn ngày) · `long` (hợp đồng dài hạn). Dùng cho cơ cấu dài hạn/ngắn ngày (K-12).
- **Cấu trúc "kênh + nguồn"** (quyết định PO, decision-log "Kênh đặt phòng R2 = danh sách BR-901 + trường nguồn"; sửa theo FB-R1-PO-DATA-04):
  - **Kênh** (`Booking.channel_id`, bắt buộc): Airbnb, Booking.com, Agoda, Expedia, Trip.com (BR-901) · **Trực tiếp** · **CTV/môi giới** · **Nội bộ** (không bán). Traveloka và Google chỉ thêm khi INV xác nhận có dùng (ESC-012) – thêm là thêm một dòng danh mục, không đổi công thức.
  - **Nguồn** (`Booking.direct_source`, **không bắt buộc**, chỉ cho kênh Trực tiếp): Website · Zalo/điện thoại · Khách vãng lai · Khách quay lại · Sale nội bộ · (trống = chưa rõ). Dùng để phân tích bên trong kênh Trực tiếp; báo cáo hiện dòng "Chưa rõ nguồn" thay vì đoán.
  - "HĐ dài hạn" trong prototype (`BK.ch`) **không còn là kênh**; HĐ dài hạn mang kênh của người mang khách về (Trực tiếp + nguồn Sale nội bộ/Zalo…, hoặc CTV).
- Mỗi kênh có thuộc tính `Channel.group`: `direct` (Trực tiếp) · `agent` (CTV/môi giới) · `ota` · `internal` (Nội bộ). Tỉ lệ kênh trực tiếp (K-11) dùng `group = direct`.
- Lý do: báo cáo kênh tháng 9 trong BL không có dòng "HĐ dài hạn" dù có 60 đêm dài hạn → thực tế INV đã coi dài hạn thuộc kênh nguồn. Tách hai chiều cho phép hỏi cả "kênh nào mang khách dài hạn" và "dài hạn chiếm bao nhiêu".

### Q-12. Phí kênh và hoa hồng
- **Phí kênh OTA** của đơn = số tiền OTA giữ lại trên **tiền phòng** của đơn. Lưu theo từng đơn (BR-901): `ChannelFee.amount_actual` từ channel manager/đối soát nếu có; không có thì `amount_estimated = tiền phòng × tỷ lệ kênh snapshot`. Báo cáo dùng **thực tế nếu có, không thì ước tính**, có cờ hiển thị "ước tính".
- **Hoa hồng CTV/môi giới** (BR-903, BR-212) và **hoa hồng nhân viên sale** lưu theo đơn/HĐ (`Commission`).
- **Chi phí kênh** (dùng cho "thực thu") = phí kênh OTA + hoa hồng CTV/môi giới. **Hoa hồng nhân viên sale không thuộc chi phí kênh** (là chi phí bán hàng nội bộ, nằm trong P&L ở dòng riêng) – đúng cấu trúc bảng kênh tháng 9 (CTV 7% có trong bảng kênh, nhân viên không có). **[DATA chốt]**
- **Kỳ ghi nhận** (dồn tích): phí kênh và hoa hồng phân bổ **theo đêm, tỷ lệ với doanh thu phòng** của đơn/HĐ → cùng kỳ với doanh thu tạo ra nó. Đơn hủy/no-show: phí kênh = phí OTA thực tế tính trên phí hủy (nếu OTA có thu), ghi ngày hủy; hoa hồng = 0 (BR-903).
- Hoa hồng dài hạn chi 2 đợt (BR-212): chi phí ghi nhận theo đêm (tỷ lệ × tiền thuê phân bổ); **lịch chi** là dòng tiền (phải trả / đã chi). Chấm dứt sớm trước đợt 2 → điều chỉnh giảm chi phí trong tháng chấm dứt.
- **Phân bổ theo đêm, làm tròn** (sửa D-2): phí/hoa hồng của đêm = phí (hoặc hoa hồng) của đơn × doanh thu phòng đêm ÷ Σ doanh thu phòng các đêm `sold` của đơn; lấy phần nguyên đồng, **phần dư dồn vào đêm cuối** để Σ theo đơn = `amount_actual` (nếu có) hoặc `amount_estimated`. Lưu sẵn trên `stay_night` (`channel_fee_vnd`, `channel_fee_is_estimate`, `agent_commission_vnd`, `staff_commission_vnd`) trong cùng giao dịch, báo cáo **không tự chia lại**. Khi `amount_actual` được cập nhật (đối soát) → phân bổ lại các đêm chưa thuộc tháng đã chốt; chênh lệch của tháng đã chốt ghi vào kỳ hiện hành (Q-14).
- **Chia tổng tiền phòng OTA thành từng đêm** (sửa D-6): có giá từng đêm (`nightlyRates`) thì dùng theo đêm, Σ phải = tổng tiền phòng OTA. Chỉ có tổng → **chia đều theo số đêm, phần nguyên đồng, dư dồn đêm cuối**. Ví dụ: Agoda 3 đêm, tổng 2.000.000 → 666.666 + 666.666 + 666.668.
- Thông báo "tiết kiệm phí kênh" khi gia hạn (BR-422) lấy tỷ lệ từ `Channel.commission_rate` hiện hành (sửa BL 8.2 #12).

### Q-13. Dồn tích và dòng tiền
- **Chỉ số kinh doanh (K-01…K-19) dùng dồn tích** (theo đêm/ngày dịch vụ).
- **Dòng tiền (K-20)** theo thời điểm giao dịch thanh toán (`Payment.received_at`).
- Không trộn hai loại trong cùng một bảng; mọi màn hình ghi rõ "theo đêm ở" hay "theo ngày thu".

### Q-14. Đóng kỳ và sửa dữ liệu quá khứ
> **Phạm vi**: tính năng "Chốt số liệu tháng" và pickup là **R3 – chờ story PO** (PO: "Chốt số liệu tháng" là Could R3; R-01…R-08 là AC của story báo cáo EP13). R2 **chỉ cần lưu đủ trường** ở mục 9, không làm luồng chốt tháng.

- Số liệu tháng **đóng ngày 5 tháng sau** (chủ đầu tư bấm "Chốt tháng") **[GIẢ ĐỊNH – chờ INV xác nhận]**. Sau khi chốt, sửa giá/đơn của tháng đã chốt **không sửa ngược**: ghi bút toán điều chỉnh vào tháng hiện hành (BR-008), báo cáo tháng cũ giữ nguyên.
- Trước khi chốt: báo cáo tính lại theo dữ liệu mới nhất.
- **Nguồn lịch sử cho chỉ số = `reservation_change`** (append-only; mọi chuyển trạng thái SM-01 ghi `field='status'` trong cùng giao dịch; thời hạn lưu theo T08 – tài chính). `state_transition` chỉ dùng cho kiểm toán (T15), **không** dùng cho chỉ số vì có thể bị xóa theo thời hạn nhật ký (FB-R1-DATA-ARC-05).
- **Pickup / "đã đặt trước tại ngày X"** (R3): số đêm `sold` của ngày lưu trú D tính tại thời điểm X = đếm `stay_night` có `stay_date = D`, `sold_at ≤ X` và (`voided_at IS NULL` hoặc `voided_at > X`). Không cần ghép văn bản `reservation_change`. Dữ liệu cần: `stay_night.sold_at`, `voided_at`, `void_reason`, `prev_state` (mục 9).

### Q-15. Làm tròn và hiển thị
- Tính toán trên số nguyên đồng; chỉ làm tròn **khi hiển thị**: tiền → đồng (hoặc nghìn/triệu tùy thẻ), tỷ lệ → 1 chữ số thập phân (71,3%), ALOS → 1 chữ số thập phân.
- Mẫu số = 0 → hiển thị "–", không hiển thị 0% hay lỗi.

---

## 2. Chỉ số kinh doanh (K-xx)

### K-01. Đêm khả dụng
- **Công thức**: thuần = Σ ngày trong kỳ (số căn kinh doanh) − đêm OOO (Q-04). Hiện kèm "gộp" và "OOO".
- **Nguồn**: `Room.active_from/active_to/is_sellable`, `room_block.room_id/start_date/end_date_planned/end_date_actual/status` với `status IN (active, released)` (Q-04).
- **Ví dụ**: Tháng 10/2026: 10 × 31 = 310; khối OOO 401 [15/10, 18/10) = 3 đêm → **307** (BR-804).

### K-02. Đêm có khách / đêm bán
- **Công thức**: đếm `stay_night` trong kỳ có `night_state = 'sold'` (Q-03), tách thành (a) **đêm có khách đã gán** (`room_id IS NOT NULL`) – dùng cho Occupancy; (b) **đêm xung đột chưa gán** (`room_id IS NULL`) – báo riêng (S1c); (c) đêm miễn phí (Q-05). Đêm bán có thu tiền = (a) + (b) − (c).
- **Nguồn**: `stay_night.stay_date/room_id/reservation_id/night_state/is_complimentary`.
- **Ví dụ**: tháng 9 (BL): 214 đêm có khách, 0 miễn phí → đêm bán 214.

### K-03. Công suất (Occupancy)
- **Công thức**: `Occupancy = Đêm có khách đã gán căn ÷ Đêm khả dụng thuần` (luôn ≤ 100%; đêm xung đột chưa gán không vào tử số – Q-05).
- Biến thể: **Công suất đêm nay** (1 ngày); **Công suất đã đặt trước** cho kỳ tương lai = đêm `confirmed` tương lai ÷ đêm khả dụng thuần tương lai, hiện thêm dòng "+ giữ chỗ" riêng (đêm `hold`) nhưng **không cộng vào** công suất.
- **Nguồn**: K-01, K-02.
- **Ví dụ**: tháng 9: 214 ÷ 300 = **71,3%**. Ví dụ tháng 10 giả lập: 250 đêm có khách, 3 OOO → 250 ÷ 307 = **81,4%** (nếu không trừ OOO: 250 ÷ 310 = 80,6%).
- **Đêm nay (dashboard)**: "đêm nay" = ngày nghiệp vụ hiện tại (đổi lúc 06:00, Q-01). Số căn có đêm `sold` **đã gán căn** đêm nay ÷ (số căn kinh doanh − số căn có OOO đêm nay). Hiện kèm "+ N đơn xung đột chưa gán căn" (không cộng vào tử số). Dữ liệu mẫu BL 3.2: 6 căn có khách, 1 căn khóa → 6 ÷ 9 = **66,7%** (prototype hiện 6/10 = 60%).

### K-04. ADR (giá phòng bình quân đêm bán)
- **Công thức**: `ADR = Doanh thu phòng ÷ Đêm bán (có thu tiền)`.
- Biến thể: ADR ngắn ngày, ADR dài hạn (quy đổi theo đêm), ADR theo kênh, theo nhóm căn.
- **Nguồn**: `stay_night.room_revenue_vnd` (sau giảm trừ), K-02 (đêm bán có thu tiền, **gồm đêm chưa gán căn**).
- **Ví dụ**: tháng 9: 186.400.000 ÷ 214 = **871.028 đ**. ADR tháng 10 trên dashboard prototype là số cứng 891.000 (BL 8.2 #28) → thay bằng công thức này.

### K-05. RevPAR
- **Công thức**: `RevPAR = Doanh thu phòng ÷ Đêm khả dụng thuần` (= ADR × Occupancy khi không có đêm miễn phí).
- **Ví dụ**: tháng 9: 186.400.000 ÷ 300 = **621.333 đ**.

### K-06. Doanh thu phòng
- **Công thức**: Σ `stay_night.room_revenue_vnd` của mọi đêm `sold` trong kỳ (gồm đêm chưa gán căn; Q-05, Q-08, Q-10) + dòng điều chỉnh `folio_line` có nhóm "phòng" ghi trong kỳ (Q-14).
- Báo cáo có thể hiện thêm "giá bán – giảm – thực": Σ `room_revenue_gross_vnd` − Σ `discount_vnd` = K-06.
- Không gồm khoản ở Q-09 nhóm "doanh thu khác" và "không phải doanh thu".
- **Ví dụ**: tháng 9 (BL 5.11): **186.400.000 đ**.

### K-07. Doanh thu khác (theo nhóm)
- **Công thức**: Σ `FolioLine.amount` có `category` thuộc nhóm "khác" (Q-09), theo `service_date`, trừ dòng FOC âm cùng nhóm; **riêng phí dịch vụ & dọn dài hạn** lấy Σ `stay_night.service_fee_alloc_vnd` theo ngày lưu trú (không lấy dòng folio theo kỳ thu, tránh đếm hai lần).
- Nhóm hiển thị: Phụ thu giờ & người thêm · Minibar/F&B · Dọn lẻ & giặt ủi · Phí dịch vụ & dọn dài hạn · Điện nước · Phạt & bồi thường · Phí hủy/no-show/chấm dứt.
- **Ví dụ**: tháng 9 (BL): phí dịch vụ & dọn 6.200.000 + điện nước 3.100.000 = **9.300.000**.

### K-08. Tổng doanh thu
- `Tổng doanh thu = K-06 + K-07`. Tháng 9: 186.400.000 + 9.300.000 = **195.700.000**.

### K-09. Phí kênh và chi phí kênh
- **Phí kênh OTA** = Σ phí kênh OTA phân bổ vào kỳ (Q-12). **Chi phí kênh** = phí kênh OTA + hoa hồng CTV/môi giới.
- **Tỷ lệ phí kênh hiệu dụng** của kênh c = chi phí kênh của c ÷ doanh thu phòng của c.
- **Nguồn**: `ChannelFee.amount_actual/amount_estimated/rate_snapshot/base_amount`, `Commission(payee_type=agent)`, `Channel.group`.
- **Ví dụ tháng 9 (BL 5.11)**: Airbnb 7.517.500 + Booking.com 5.595.000 + Agoda 2.682.000 = **phí OTA 15.794.500**; + CTV 2.345.000 = **chi phí kênh 18.139.500**. Đơn Agoda 2.000.000 × 18% → **360.000** (BR-901).

### K-10. Thực thu (doanh thu phòng sau chi phí kênh)
- **Công thức**: `Thực thu = Doanh thu phòng − Chi phí kênh`, tính theo kênh và tổng.
- Tên hiển thị đầy đủ: "Thực thu sau phí kênh". **Không nhầm với "tiền đã thu"** (K-20).
- **Ví dụ tháng 9**: 186.400.000 − 18.139.500 = **168.260.500** (khớp BL 5.11).

### K-11. Tỉ lệ kênh trực tiếp
- **Công thức chính** (dùng cho mục tiêu G3): `Doanh thu phòng của đơn có Channel.group = direct ÷ Doanh thu phòng`.
- Biến thể phụ: theo đêm bán; theo số đơn.
- Kênh trực tiếp gồm: kênh **Trực tiếp** với mọi nguồn (Website, Zalo/điện thoại, Khách vãng lai, Khách quay lại, Sale nội bộ, chưa rõ nguồn) và **đơn con gia hạn của đơn OTA** (BR-422, tạo với kênh Trực tiếp). Biến thể phụ theo nguồn chỉ tính trên đơn có ghi nguồn. **Không gồm CTV/môi giới** (có hoa hồng bên thứ ba) – **[GIẢ ĐỊNH – chờ INV xác nhận]** vì đây là định nghĩa của mục tiêu G3 (mục 8, câu hỏi O-2).
- **Ví dụ tháng 9**: 52.200.000 ÷ 186.400.000 = **28,0%** (đích G3 ≥ 35%).

### K-12. Cơ cấu dài hạn / ngắn ngày
- **(a) Theo đêm**: `Đêm có khách dài hạn ÷ Đêm có khách` (dài hạn = `Booking.stay_type = long`).
- **(b) Theo doanh thu phòng**: `Doanh thu phòng dài hạn ÷ Doanh thu phòng`.
- **(c) Đóng góp vào công suất**: `Đêm dài hạn ÷ Đêm khả dụng thuần` và tương tự cho ngắn ngày (hai phần cộng lại = Occupancy).
- **Ví dụ tháng 9**: (a) 60 ÷ 214 = **28,0%** dài hạn, 72,0% ngắn ngày; (c) 60 ÷ 300 = 20,0% + 154 ÷ 300 = 51,3% = 71,3%.

### K-13. Số căn dài hạn (mục tiêu G2: 4–6 căn)
- **Tại một ngày**: số căn có đơn `stay_type = long` trạng thái `in_house` (hoặc `confirmed` với ngày tương lai) đêm đó.
- **Bình quân kỳ**: `Đêm có khách dài hạn ÷ số ngày trong kỳ`.
- **Ví dụ tháng 9**: 60 ÷ 30 = **2,0 căn** bình quân (đích 4–6).

### K-14. ALOS (thời gian ở trung bình)
- **Đơn vị đếm**: **lượt lưu trú** = đơn gốc + mọi đơn con gia hạn của nó + đổi phòng (Q-07) (`Booking.stay_group_id`).
- **Công thức**: `ALOS = Σ đêm có khách của các lượt lưu trú kết thúc trong kỳ ÷ số lượt lưu trú kết thúc trong kỳ`. "Kết thúc" = ngày trả phòng thực tế thuộc kỳ (lượt `checked_out`).
- **Tách riêng**: ALOS **ngắn ngày** (chỉ `short`) là chỉ số chính, ALOS theo kênh tính theo **kênh của đơn gốc**. Dài hạn báo **thời hạn HĐ bình quân (tháng)** và **thời gian ở thực tế bình quân (đêm)** riêng – không trộn vào ALOS ngắn ngày vì một HĐ 1 năm (365 đêm) sẽ làm ALOS vô nghĩa.
- Không tính `cancelled`, `no_show`. Trả sớm tính số đêm thực ở.
- **Nguồn**: `StayNight`, `Booking.stay_group_id/parent_booking_id/stay_type/channel_id/actual_checkout_at`.
- **Ví dụ** (giả lập): 3 lượt ngắn ngày trả phòng trong tuần: 2, 3 và 4 + gia hạn 2 = 6 đêm → (2 + 3 + 6) ÷ 3 = **3,7 đêm**. Số ALOS theo kênh trong BL (3,4 / 2,6 / 2,2 / 4,1) là số cứng, bỏ.

### K-15. GOP (lợi nhuận gộp hoạt động)
- **Công thức**: `GOP = Tổng doanh thu (K-08) − Chi phí vận hành`.
- **Chi phí vận hành** gồm (cùng kỳ, dồn tích):
  - **Tự động từ dữ liệu giao dịch** (không nhập tay, BR-902): phí kênh OTA (Σ `stay_night.channel_fee_vnd` + phí trên phí hủy ghi theo `channel_fee.recognized_on`); hoa hồng CTV/môi giới (Σ `agent_commission_vnd`); hoa hồng nhân viên sale (Σ `staff_commission_vnd`); giá vốn minibar/F&B đã bán (snapshot lúc bán, BR-705); **chi phí dời khách do overbooking** = Σ `overbooking_incident.cost_vnd` của sự cố `status = resolved` có `resolved_at` (ngày nghiệp vụ) trong kỳ (BR-312 bước 2 – OTTIMO trả chênh lệch đêm đầu + xe). Đối chiếu R-08.
  - **Nhập tay theo khoản mục và tháng** (PO A12, decision-log BL 9 #26): lương; điện nước internet (đầu vào); giặt là & amenity; marketing; sửa chữa bảo trì; phần mềm & khác.
- **Không gồm**: tiền thuê tòa nhà, khấu hao, lãi vay, thuế TNDN (chưa có trong MVP, decision-log 15/10/2026) → tên đầy đủ "GOP – chưa gồm thuê nhà và khấu hao".
- **Ví dụ tháng 9 (BL 5.11) sau khi sửa BL 8.2 #11**: chi phí = 75.750.000 − 15.500.000 (phí OTA nhập tay) + 15.794.500 (tổng phí OTA theo đơn) − 2.350.000 + 2.345.000 (hoa hồng CTV theo đơn) = **76.039.500**; GOP = 195.700.000 − 76.039.500 = **119.660.500** (prototype: 119.950.000).

### K-16. Biên GOP
- `Biên GOP = GOP ÷ Tổng doanh thu`. Tháng 9: 119.660.500 ÷ 195.700.000 = **61,1%** (prototype 61,3%; đích G4 ≥ 60%).

### K-17. GOPPAR
- `GOPPAR = GOP ÷ Đêm khả dụng thuần`. Tháng 9: 119.660.500 ÷ 300 = **398.868 đ**.

### K-18. FOC
- **Giá trị FOC kỳ** = Σ |dòng FOC âm| có ngày áp dụng trong kỳ; số lần; theo lý do; theo người duyệt.
- **Tỉ lệ FOC** = giá trị FOC ÷ doanh thu phòng (ngưỡng cảnh báo BR-435).
- **Ví dụ**: ngưỡng 3% × 186.400.000 = **5.592.000**.

### K-19. Khách/phòng và doanh thu/khách
- `Khách/đơn = Σ số khách (người lớn + trẻ em) ÷ số lượt lưu trú` (kỳ theo ngày trả phòng).
- `Doanh thu/khách = (Doanh thu phòng + khác) của các lượt đó ÷ Σ số khách`.
- Số khách lấy `Booking.adults + Booking.children` (không cần dữ liệu giấy tờ). Giữ "doanh thu thanh toán" (theo người đứng tên) và "doanh thu phân bổ" (chia đều người lớn có hồ sơ) như BL 5.11 cho CRM ở Round 3.

### K-20. Dòng tiền: tiền đã thu, thu trước, phải thu (không phải doanh thu)
- **Tiền đã thu kỳ** = Σ `Payment.amount` (dương) − hoàn tiền theo `received_at` trong kỳ, tách theo phương thức và loại (thu phòng/khác, cọc, ký quỹ).
- **Doanh thu nhận trước** tại ngày D = Σ tiền đã thu cho đêm/kỳ sau D (ví dụ Daniel trả quý).
- **Phải thu dài hạn** = các kỳ thu (`BillingSchedule`) đến hạn chưa thu đủ; phục vụ "Cần chú ý" (BR-207, BR-907).
- **Số dư ký quỹ đang giữ** = Σ ký quỹ nhận − hoàn − khấu trừ.
- **Ví dụ**: Daniel ngày 1/8 trả 36.030.000 cho quý 8–10 → dòng tiền tháng 8 = 36.030.000; doanh thu phòng tháng 8, 9, 10 mỗi tháng 11.130.000 (Q-10), phần còn lại là phí dịch vụ theo thỏa thuận riêng (BR-006).

### K-21. So sánh kỳ trước (thay cho "% tăng" viết cứng, BL 8.2 #28)
- `% thay đổi = (Giá trị kỳ này − Giá trị kỳ so sánh) ÷ Giá trị kỳ so sánh`.
- Kỳ đang chạy so với **cùng số ngày** của kỳ trước (1–14/10 so với 1–14/9), không so tháng chạy dở với cả tháng trước.
- Với tỷ lệ (Occupancy, biên GOP, tỉ lệ trực tiếp) hiển thị **chênh lệch điểm %** (71,3% → 82,1% = **+10,8 điểm**), không dùng % của %.
- Kỳ so sánh không có dữ liệu → "–".

### K-22. Tỉ lệ hủy, tỉ lệ no-show, đêm mất (mới – sửa D-4)
Kỳ lọc theo **ngày đến dự kiến** (`arrival_date`) của đơn, trừ khi ghi khác. Chỉ đơn ngắn ngày (`stay_type = short`); dài hạn chấm dứt sớm báo ở chỉ số HĐ riêng.

| Chỉ số | Công thức | Ghi chú |
|---|---|---|
| **K-22a Tỉ lệ hủy đơn đã xác nhận (theo đơn)** | `Số đơn cancelled có status_before_cancel = confirmed và cancel_reason_code ∉ {hold_expired, overbooking_relocated, ota_cancelled} ÷ Số đơn có confirmed_at ≠ null và arrival_date trong kỳ` | Mã lý do theo **BR-308 v0.2** / ERD `reservation.cancel_reason_code`. **Loại trừ**: `hold_expired` (giữ chỗ hết hạn, đo ở S7), `overbooking_relocated` (dời khách do overbooking, BR-312, đo ở S1b/S1c), `ota_cancelled` (OTA/kênh báo hủy, BR-310). **Được tính**: `guest_cancelled` (khách tự hủy qua app/web/kênh, gồm hủy chủ động trên OTA), `guest_changed_mind`, `found_other`, `price`, `date_change`, `unreachable`, `group_partial`, `other` |
| **K-22b Tỉ lệ hủy theo đêm** | `Số đêm void có void_reason = cancelled và prev_state = sold ÷ Số đêm từng sold (sold_at ≠ null) có stay_date trong kỳ` | Kỳ theo **ngày lưu trú**; đo đêm mất thật |
| **K-22c Tỉ lệ no-show** | `Số đơn no_show ÷ Số đơn có arrival_date trong kỳ và trạng thái ∈ {in_house, checked_out, no_show}` | Mẫu số là đơn "đến hạn đến" thật; loại đơn đã hủy trước ngày đến |
| **K-22d Đêm mất do hủy / no-show** | Σ đêm `void` có `void_reason ∈ {cancelled, no_show}` và `prev_state = sold`, theo ngày lưu trú, theo kênh (`stay_night.channel_id`) | **Không** gồm `date_change` (không mất), `hold_expired` (chưa bán), `early_departure` (báo dòng riêng "đêm bỏ do trả sớm") |
| **K-22e Doanh thu bù từ hủy/no-show** | Σ `folio_line` nhóm `cancellation_fee`, `no_show_fee`, `deposit_forfeit` theo ngày nghiệp vụ hủy/đánh dấu no-show | Doanh thu khác (Q-09); so sánh với doanh thu phòng của đêm mất |

- **Nguồn**: `reservation.status`, `status_before_cancel`, `confirmed_at`, `cancel_reason_code`, `cancelled_at`, `no_show_marked_at`, `channel_id`; `stay_night.night_state/sold_at/voided_at/void_reason/prev_state`; lịch sử đầy đủ ở `reservation_change` (Q-14).
- **Ví dụ** (giả lập): tháng 11 có 60 đơn ngắn ngày đã xác nhận có ngày đến trong tháng; 6 đơn khách hủy (`guest_cancelled`/`guest_changed_mind`…), 1 đơn `overbooking_relocated` → K-22a = 6 ÷ 60 = **10,0%**. Trong 53 đơn còn lại đến hạn: 51 nhận phòng, 2 no-show → K-22c = 2 ÷ 53 = **3,8%**. 6 đơn hủy × 2 đêm + 2 no-show × 3 đêm = **18 đêm mất**.
- Kênh OTA: phân tích theo kênh (Agoda, Booking…) để INV thấy kênh nào hủy nhiều. Không tính "lý do hủy" chi tiết ngoài mã lý do (không ghi văn bản tự do của khách vào chỉ số).

### Lộ trình hiển thị (sửa FB-R1-PO-DATA-06)
"Hiển thị từ" = round chỉ số xuất hiện trên màn hình. **Mọi trường dữ liệu ở mục 9 vẫn phải lưu từ R2**, kể cả khi chỉ số hiện ở R3/R4.

| Hiển thị từ | Chỉ số | Màn hình / story |
|---|---|---|
| **R2** | K-01 (đêm khả dụng đêm nay), K-02 (đêm có khách đêm nay), K-03 biến thể **đêm nay** + số đơn xung đột chưa gán; S7 giám sát "giữ chỗ treo = 0"; S1c (cảnh báo "Cần chú ý") | Tổng quan US-010, US-011, US-012 |
| **R3** | K-01…K-22 theo tháng (ADR, RevPAR, doanh thu, kênh, GOP, FOC, dòng tiền, hủy/no-show), K-21 so sánh kỳ; R-01…R-08 (AC của story báo cáo EP13); pickup (Q-14); S9 | Báo cáo EP13; "Chốt số liệu tháng" (Could R3) |
| **R4** | S1–S8, S10–S12 (đo khi INV vận hành thật); K-22 phân tích kênh | `insights-r4.md`, round-summary |

---

## 3. Xử lý 5 lỗi số liệu của baseline (BL 8.2)

| BL 8.2 | Lỗi trong prototype | Quy ước mới | Chỉ số bị ảnh hưởng | Trước → sau (ví dụ) | Dữ liệu bắt buộc phải lưu |
|---|---|---|---|---|---|
| **#8** | Đơn `hold` tính là đêm đã bán trong công suất và biểu đồ | Đêm bán chỉ gồm `confirmed`/`in_house`/`checked_out` (Q-03, BR-904). Giữ chỗ hiện thành lớp riêng "giữ chỗ chưa cọc" trên biểu đồ 14 ngày tới, không cộng vào công suất | K-02, K-03, K-04, K-05 | Ví dụ: 14 ngày tới có 120 đêm `confirmed` + 8 đêm `hold`, 140 đêm khả dụng: prototype 128/140 = 91,4% → đúng 120/140 = **85,7%** (+ 8 đêm giữ chỗ hiện riêng) | `Booking.status` + lịch sử trạng thái có thời điểm; `Booking.hold_expires_at` |
| **#11** | Phí OTA trong P&L (15,5 tr, nhập tay) ≠ bảng kênh (15,79 tr) | Một nguồn (BR-902): P&L lấy **tổng phí kênh theo đơn** (Q-12); không có ô nhập tay cho phí kênh/hoa hồng ở P&L. Đối chiếu bắt buộc R-01 (mục 6) | K-09, K-10, K-15, K-16, K-17 | Phí OTA 15.500.000 → **15.794.500**; GOP 119.950.000 → **119.660.500**; biên 61,3% → **61,1%** | `ChannelFee` theo đơn (thực tế/ước tính, tỷ lệ snapshot, cơ sở tính), `Commission` theo đơn/HĐ, `Expense.category` không cho phép mã "phí kênh" |
| **#22** | Doanh thu dài hạn = tiền thuê × `round(ngày đã ở/30)`; CRM dùng số cứng `LEGACY` | Phân bổ theo đêm, chia theo tháng hợp đồng (Q-10, BR-215); dòng tiền kỳ thu tách riêng (K-20). Số cứng `LEGACY` bỏ khi nhập dữ liệu thật (triage) | K-04, K-05, K-06, K-12, K-20 | Daniel tới 14/10: 33.390.000 (3 tháng làm tròn) → tháng 8 11.130.000, tháng 9 11.130.000, 1–14/10 14 × 359.032 = **5.026.448** | `Contract.start_date/end_date/monthly_rent/service_fee` snapshot, `BillingSchedule`, `StayNight.room_revenue` sinh theo Q-10, `Contract.actual_end_date` |
| **#28** | Số cứng trên Tổng quan (ADR 891.000, "▲ 2,3%", "▲ 12%", thẻ "Cần chú ý", "1 phiếu mức độ cao", cảnh báo thị thực) | Mọi số trên Tổng quan/Báo cáo gắn với **mã chỉ số** trong tài liệu này; % thay đổi theo K-21; "Cần chú ý" sinh từ quy tắc BR-907. Đây cũng là S9 | K-03, K-04, K-05, K-06, K-21, S9 | ADR 891.000 cứng → K-04 tính từ dữ liệu; "▲ 2,3%" → K-21 | Đủ các trường ở mục 9; bảng ánh xạ "thẻ dashboard → mã chỉ số" (FE dựng ở R2–R3) |
| **#29** | Đêm khả dụng không trừ phòng khóa (OOO) | Đêm khả dụng thuần = gộp − đêm OOO (Q-04, BR-804); hiện cả gộp và OOO | K-01, K-03, K-05, K-17 | Tháng 10 giả lập 250 đêm có khách: 250/310 = 80,6% → **250/307 = 81,4%** | `RoomBlock` (OOO) có `start_date`, `end_date_planned`, `end_date_actual`, `status`, liên kết phiếu sửa; **không xóa cứng** khối OOO đã kết thúc |

Thêm hai lỗi liên quan số liệu DATA xử lý luôn:
- **BL 8.2 #12** (thông báo gia hạn ghi "15%" cho Airbnb): lấy tỷ lệ từ `Channel.commission_rate` (Q-12).
- **Mâu thuẫn hoa hồng CTV 8% / 7%** (triage X-03, Q-D2): chỉ số **không dùng tỷ lệ cố định** mà cộng hoa hồng thực tế từng đơn (`Commission.amount`); tỷ lệ nào là đúng do INV chốt qua ESC của PO/DOM.

---

## 4. Chỉ số thành công S1–S12 (PRD mục 3.2)

Đích là đề xuất của đội `[GIẢ ĐỊNH – chờ INV xác nhận]` (decision-log 15/10/2026). Đo từ khi INV vận hành thật (Round 4). Cột "Dữ liệu cần" là trường ARC phải lưu từ Round 2, để Round 3 dựng báo cáo không phải sửa ERD.

| # | Chỉ số | Công thức chính xác | Kỳ / lọc | Dữ liệu cần | Ví dụ |
|---|---|---|---|---|---|
| **S1** | Đặt trùng phòng do hệ thống (đích 0) | **S1a** = số cặp (căn, ngày lưu trú) mà tại **bất kỳ thời điểm nào** có ≥ 2 khối chiếm tồn phòng cùng hiệu lực (đơn `hold`/`confirmed`/`in_house` hoặc OOO) **trong dữ liệu Desk**. **S1b** (báo riêng, không tính vào đích 0) = số cảnh báo overbooking do đơn OTA về khi Desk đã hết phòng (đồng bộ trễ, BR-312), kèm số khách phải dời. **S1c** (giám sát, mới – sửa D-1) = số **đêm xung đột chưa gán căn** (`stay_night` `sold`, `room_id IS NULL`) tại thời điểm xem + số đơn tương ứng; hiện ở "Cần chú ý". Kèm cảnh báo R-06b khi còn căn trống cùng/cao hơn nhóm mà đơn chưa được gán | Tháng; theo ngày nghiệp vụ phát hiện. S1c theo thời gian thực | Ràng buộc chống trùng ở DB (BR-906) + job kiểm hằng ngày; `overbooking_incident(reservation_id, requested_room_id, stay_from, stay_to, conflicting_reservation_ids, source, status, resolution, cost_vnd, detected_at, resolved_at)`; `stay_night.room_id` | Đơn Agoda và đơn trực tiếp cùng vào 203 đêm 20/10 do đồng bộ trễ → S1a = 0, S1b = 1; trước khi lễ tân gán sang 202: S1c = 1 đêm |
| **S2** | Khai báo lưu trú đúng hạn (≥ 98%; 100% với khách nhận phòng trong giờ trực lễ tân) | `Số bản ghi khai báo có sent_at ≤ deadline_at ÷ Số bản ghi khai báo đến hạn trong kỳ`. Hạn theo BR-602 (VN) / BR-603 (NN). `sent_at` = lúc nhập mã hồ sơ cổng BCA. Mẫu số: đơn `in_house`/`checked_out` nhận phòng trong kỳ; loại `cancelled`, `no_show`. **Phụ (S2-trực)**: cùng công thức, chỉ với đơn có `actual_checkin_at` nằm trong khung `front_desk_hours` (BR-811, tham số – không viết cứng giờ) **và** cách giờ kết thúc khung ít nhất `s2_shift_end_buffer_minutes` phút (DATA đề xuất mặc định **60 phút**: khách nhận phòng sát giờ hết ca vẫn có thể rơi vào quy trình ca tối BR-611). Tham số này DATA gửi DOM đưa vào BR mục 13 (sửa FB-R1-PO-DATA-01) | Tháng; theo ngày nghiệp vụ nhận phòng | `Registration.deadline_at` (tính lúc nhận phòng, lưu lại), `Registration.sent_at`, `Registration.type` (VN/NN), `Booking.actual_checkin_at`, `Registration.status` + lịch sử; tham số `front_desk_hours` **có hiệu lực theo ngày** (để đổi giờ trực không làm sai số tháng cũ) | 40 khai báo, 39 đúng hạn → **97,5%** (chưa đạt); trong đó 32 khai báo nhận phòng 07:00–21:00 (giờ trực 07:00–22:00, đệm 60 phút), 32 đúng hạn → S2-trực **100%** |
| **S3** | Thời gian trả phòng tại quầy (≤ 5 phút trung vị) | Trung vị của `checkout_completed_at − checkout_started_at`. Bắt đầu = lễ tân mở bước 1 (minibar) của trả phòng; kết thúc = đơn chuyển `checked_out` sau khi đã ghi đủ thanh toán. Chỉ đơn **ngắn ngày** tại quầy; loại trả phòng tự phục vụ (BR-427), có ghi công nợ (BR-525), và lần mở bị bỏ dở > 60 phút (ghi riêng) | Tháng | `Booking.checkout_started_at`, `Booking.checkout_completed_at`, `Booking.checkout_mode` (quầy / tự phục vụ), `checkout_started_by` | 5 lần: 3, 4, 4, 6, 9 phút → trung vị **4 phút** |
| **S4** | Thời gian nhận phòng với khách đã check-in online (≤ 3 phút trung vị) | Trung vị của `checkin_completed_at − checkin_started_at` với đơn có `Registration.pre_submitted_at` < `checkin_started_at`. Kết thúc = đơn chuyển `in_house` | Tháng | `Booking.checkin_started_at`, `Booking.checkin_completed_at`, `Registration.pre_submitted_at` | 4 lần: 2, 2, 3, 5 phút → **2,5 phút** |
| **S5** | Tỉ lệ check-in online trước khi đến (≥ 40% sau 2 tháng) | `Số đơn đủ điều kiện có pre_submitted_at < giờ đến ÷ Số đơn đủ điều kiện`. Đủ điều kiện = đơn ngắn ngày nhận phòng trong kỳ, kênh trực tiếp/CTV hoặc OTA **có SĐT hoặc email của khách** tại thời điểm 48 giờ trước ngày đến – **không lọc** theo việc đã gửi link (sửa FB-R1-PO-DATA-05, để lễ tân quên gửi link vẫn kéo S5 xuống). Hiện kèm **S5-pre** = `Số đơn đủ điều kiện có guest_link_sent_at ≤ giờ đến − 48 giờ ÷ Số đơn đủ điều kiện` và **S5-link** = S5 chỉ trên đơn đã được gửi link (đo sức hút của app khi khách đã nhận link). Ba số luôn hiện cùng nhau | Tháng; theo ngày nghiệp vụ nhận phòng | `Registration.pre_submitted_at`, `Booking.guest_link_sent_at`, cờ `has_contact_at_eligibility` (có/không tại mốc 48 giờ, không lấy giá trị) | 30 đơn đủ điều kiện, 24 được gửi link đúng hạn, 11 check-in online → S5 = **36,7%**; S5-pre = **80,0%**; S5-link = 11 ÷ 24 = **45,8%** |
| **S6** | Thời gian lập + gửi báo giá dài hạn (≤ 3 phút) | Trung vị của `Quote.sent_at − Quote.started_at` với `Quote.type = long`. `started_at` = mở công cụ báo giá (tạo nháp); `sent_at` = bấm "Sao chép/Gửi" lần đầu | Tháng | `Quote.started_at`, `Quote.sent_at`, `Quote.type`, `Quote.created_by` | 3 báo giá: 2, 3, 6 phút → **3 phút** |
| **S7** | Giữ chỗ hết hạn được tự xử lý (100%) | `Số đơn hold có hold_expires_at trong kỳ và được xử lý trong ≤ 5 phút sau hạn ÷ Số đơn hold có hold_expires_at trong kỳ mà chưa được xác nhận/gia hạn trước hạn`. "Xử lý" = chuyển `cancelled` (lý do hết hạn) và mở lại tồn. Chỉ số giám sát kèm: **số đơn hold treo hiện tại** = `status = hold` và `now > hold_expires_at + 5 phút` (phải = 0) | Tháng + theo thời gian thực | `Booking.hold_expires_at`, `Booking.status_changed_at`, `Booking.cancel_reason_code`, `Booking.cancelled_by` (hệ thống/người) | 12 giữ chỗ hết hạn, 12 tự hủy trong 1 phút → **100%** |
| **S8** | FOC có người duyệt hợp lệ (100%) | `Số dòng FOC có approver ≠ requester (trừ quản lý/chủ đầu tư), approver có quyền duyệt và giá trị ≤ hạn mức tại thời điểm duyệt (BR-433), đã xác nhận bằng PIN/mật khẩu ÷ Tổng dòng FOC áp vào folio trong kỳ` | Tháng | `FocApproval(folio_line_id, requested_by, approver_id, approver_role_snapshot, approver_limit_snapshot, approved_at, method)` | 20 FOC, 20 hợp lệ → **100%** |
| **S9** | Số trên Tổng quan/Báo cáo tính từ dữ liệu thật (100%) | `Số thẻ/ô số liệu gắn mã chỉ số K-xx/S-xx và lấy từ API ÷ Tổng thẻ/ô số liệu` – QC rà soát mỗi round | Mỗi round | Bảng ánh xạ thẻ → mã chỉ số (FE), không có hằng số số liệu trong code giao diện | 18/18 thẻ → **100%** |
| **S10** | Lỗi tiền sau phát hành (0 lỗi P0) | Đếm lỗi mức P0 loại "tiền" (bill sai công thức, thu sai, hoàn sai) mở sau ngày phát hành, nguồn `qa/bug-list.md` và `04-investor-feedback/` | Tháng / round | Không cần trường trong app; đối chiếu bổ sung bằng R-03 (mục 6) | – |
| **S11** | Nhân viên dùng hằng ngày (≥ 5/7 ngày/tuần mỗi người) | Với mỗi tài khoản vai lễ tân, buồng phòng/bảo trì đang hoạt động: `Số ngày trong tuần có ≥ 1 thao tác ghi dữ liệu hoặc phiên hoạt động ≥ 1 phút`. Chỉ số = **% nhân viên đạt ≥ 5 ngày** và trung vị số ngày/tuần. Loại tuần nghỉ phép (nếu INV ghi) | Tuần (Thứ Hai–Chủ Nhật) | `user_activity_day(user_id, property_id, activity_date, first_seen_at, last_seen_at, write_count)` – một dòng/người/ngày, ghi cả khi chỉ xem (sửa D-8; `user_session` bị xóa khi hết hạn, `audit_event` chỉ có thao tác ghi nên không dùng); `app_user.role`, `app_user.active`. "Phiên hoạt động ≥ 1 phút" = `last_seen_at − first_seen_at ≥ 1 phút` hoặc `write_count ≥ 1` | 4 nhân viên: 7, 6, 5, 3 ngày → **75%** đạt |
| **S12** | Hài lòng của INV về độ "mượt, thân thiện" (≥ 4/5) | Điểm 1–5 INV chấm trong phiếu ở `round-summary.md`; trung bình nếu nhiều người chấm | Mỗi round từ R3 | Không cần trường trong app | – |

---

## 5. Gắn mục tiêu kinh doanh (PRD mục 3.1) với chỉ số

| Mục tiêu | Chỉ số đo | Ghi chú |
|---|---|---|
| G1 Công suất ≥ 80% | K-03 (đêm khả dụng thuần) | Báo kèm công suất gộp để thấy ảnh hưởng OOO |
| G2 4–6 căn dài hạn | K-13 (tại ngày + bình quân tháng) | |
| G3 Trực tiếp ≥ 35% doanh thu phòng | K-11 (theo doanh thu phòng) | Định nghĩa "trực tiếp" chờ INV (O-2) |
| G4 GOP ≥ 60% | K-16 | Chưa gồm thuê nhà, khấu hao |
| G5 Tuân thủ | S2 + số sự cố lộ dữ liệu (SEC theo dõi) | |

---

## 6. Quy tắc đối chiếu (để báo cáo khớp dữ liệu gốc)

> **Phạm vi: R3 – chờ story PO.** R-01…R-08 là tiêu chí nghiệm thu của story báo cáo EP13 (PO). Việc "lệch là lỗi chặn chốt" chỉ áp khi có story "Chốt số liệu tháng" (Could R3). R2 không dựng bộ đối chiếu; riêng R-06a/R-06b có thể chạy trong job kiểm hằng ngày (J17) nếu ARC đã đưa vào.

Chạy tự động khi chốt tháng (Round 3 dựng), lệch là lỗi chặn chốt:

| Mã | Đối chiếu | Phải bằng |
|---|---|---|
| R-01 | Tổng chi phí kênh trong báo cáo kênh | Dòng "phí kênh OTA" + "hoa hồng CTV" trong P&L cùng kỳ (BR-902) |
| R-02 | Σ `StayNight.room_revenue` của một đơn ngắn ngày đã trả phòng | Σ dòng folio nhóm "phòng" của đơn (sau FOC/giảm giá) |
| R-03 | Σ doanh thu phòng các đêm của một HĐ dài hạn trong mỗi tháng hợp đồng đã qua | Tiền thuê tháng snapshot (Q-10) |
| R-04 | Số `stay_night` không `void` của đơn | `departure_date_actual − arrival_date_actual` (sau gia hạn/trả sớm) |
| R-05 | Số cặp (căn, ngày) vừa có đêm có khách vừa có OOO | 0 (khác 0 → cảnh báo dữ liệu, Q-04) |
| R-06a | Với mỗi ngày: đêm có khách **đã gán căn** (`sold`, `room_id IS NOT NULL`) + đêm OOO + đêm trống | Số căn kinh doanh ngày đó. Đêm xung đột chưa gán **không** cộng vào (không chiếm căn) – nếu cộng thì đẳng thức sai mỗi ngày có xung đột dù dữ liệu đúng |
| R-06b | Với mỗi ngày có đêm xung đột chưa gán > 0: còn căn trống cùng nhóm hoặc nhóm cao hơn? | **Cảnh báo nghiệp vụ** (không phải lỗi dữ liệu): "Có căn trống mà đơn xung đột chưa được gán". Chưa gán mà không còn căn trống là đúng thiết kế → không cảnh báo |
| R-07 | Tiền đã thu − hoàn (K-20) theo đơn đã đóng folio | Tổng phải thu của bill + cọc/ký quỹ còn giữ |
| R-08 | Σ `overbooking_incident.cost_vnd` của sự cố `resolved` trong kỳ | Dòng "chi phí dời khách" trong P&L cùng kỳ (K-15) |
| R-09 | Σ `stay_night.channel_fee_vnd` (và `agent_commission_vnd`, `staff_commission_vnd`) theo đơn, mọi tháng | `channel_fee.amount_actual` (hoặc `amount_estimated`) và `commission.amount_vnd` của đơn – lệch 0 đồng (nhờ quy tắc dư dồn đêm cuối, Q-12) |

---

## 7. Dữ liệu cá nhân trong chỉ số

- Chỉ số **không dùng** dữ liệu C3 (số/ảnh giấy tờ, thị thực, ngày sinh, mã cửa) – theo thang SEC (data-risk-assessment mục 3).
- Dùng dữ liệu C2 ở dạng **gộp**: quốc tịch (cho cơ cấu khách nội địa/nước ngoài), số khách, cờ có/không có liên hệ (S5, không đọc SĐT/email), doanh thu, hoa hồng. Báo cáo không hiển thị tên khách trừ màn hình có quyền (RBAC của BA).
- S11 dùng bảng `user_activity_day` (chỉ ngày + mốc giờ đầu/cuối + số thao tác ghi; **không** IP, thiết bị) của **nhân viên** – chỉ để đo mức sử dụng, không xếp hạng cá nhân công khai; INV xem ở mức tổng. Cần nêu trong nội quy nhân viên (SEC/BA xác nhận).
- Chỉ số P&L, hoa hồng, giá vốn là C2 – chỉ vai chủ đầu tư/quản lý xem (theo RBAC).

---

## 8. Câu hỏi mở và giả định

| # | Nội dung | Phương án DATA đang dùng | Ai quyết |
|---|---|---|---|
| O-1 | Báo cáo dùng doanh thu **gồm VAT** hay **trước VAT**? | Gồm VAT (khớp giá bán và số tháng 9), lưu thuế suất để thêm cột trước VAT | INV + kế toán (gộp vào ESC "Hóa đơn điện tử/VAT" – BL 9 #16) |
| O-2 | CTV/môi giới có tính là "kênh trực tiếp" trong mục tiêu G3 không? | Không tính | INV (gộp vào ESC mục tiêu/S1–S12 của PO) |
| O-3 | Ngày chốt số liệu tháng | Ngày 5 tháng sau, chủ đầu tư bấm chốt – tính năng là Could R3 (Q-14) | INV (có thể đội tự chốt nếu INV không có ý kiến) |
| O-4 | Phụ thu người thêm vào doanh thu phòng hay doanh thu khác? | Doanh thu khác (theo BR-904) | DOM xác nhận ở bước review |
| O-5 | Nhận phòng trước 06:00 / trả sau 18:00 là đêm bán (Q-06) | **Đã đóng** – DOM chốt BR-411 trước 06:00 = đêm bán (decision-log 15/10/2026) | DOM |
| O-6 | Ngưỡng "tự xử lý" giữ chỗ hết hạn trong S7 | 5 phút (chu kỳ job) | ARC xác nhận theo thiết kế job |
| O-7 | Đệm cuối ca cho S2-trực (`s2_shift_end_buffer_minutes`) | 60 phút | DOM đưa vào BR mục 13 (tham số) |
| O-8 | Câu chữ BR-215 "÷ số đêm của tháng lịch" | Q-10 (tháng hợp đồng) là nguồn đúng theo quyết định DOM | DOM sửa văn bản BR-215 |

---

## 9. TRƯỜNG DỮ LIỆU BẮT BUỘC gửi ARC (cho ERD đợt 3)

Mục đích: Round 2 lưu đủ để Round 3 tính mọi chỉ số ở mục 2–4 **không phải sửa ERD**. Tên thực thể/trường là gợi ý; ARC đặt tên chuẩn (tiếng Anh), miễn giữ nghĩa. Từ v0.2, chỗ nào ERD đã có tên thì ghi theo tên ERD (`erd.md` v0.1) trong ngoặc. Cột "Dùng cho" ghi mã quy ước/chỉ số. Dòng có nhãn **(mới v0.2)** là phần bổ sung ở bước 4 – ARC đối chiếu cùng thẻ FB-R1-DATA-ARC-01…11.

**Nguyên tắc chung gửi ARC**
1. **Không xóa cứng** đơn, khối OOO, dòng folio, giao dịch, FOC, kỳ thu, chi phí: dùng trạng thái + bút toán điều chỉnh (BR-008) – nếu xóa thì số tháng cũ đổi (Q-14).
2. **Lịch sử thay đổi** cho đơn (trạng thái, ngày, căn, giá) có thời điểm và người thực hiện. **Nguồn lịch sử cho chỉ số = `reservation_change`** (append-only, mọi chuyển trạng thái ghi `field='status'` trong cùng giao dịch, thời hạn lưu T08 – tài chính). `state_transition` chỉ cho kiểm toán (T15).
3. Mọi tiền: số nguyên VND; mọi tỷ lệ/tham số dùng để tính tiền: **snapshot** trên bản ghi (BR-006).
4. Mọi thời điểm: có múi giờ; mọi "ngày lưu trú": kiểu `date` theo giờ Việt Nam.
5. Mọi bản ghi có `property_id` (đa cơ sở về thiết kế).

| Thực thể | Trường | Vì sao cần (dùng cho) |
|---|---|---|
| **Property** | `id`, `timezone` (mặc định Asia/Ho_Chi_Minh), `currency` (VND), `month_close_day` | Q-01, Q-14 |
| **Room** | `id`, `property_id`, `room_no`, `room_group_id`, `is_sellable`, `active_from`, `active_to` | Đêm khả dụng gộp (K-01) khi thêm/bớt căn; theo nhóm căn |
| **RoomGroup** | `id`, `name` (Lầu 1–2 / Căn N / Căn N+) | ADR, Occupancy theo nhóm |
| **RoomBlock** (OOO) (`room_block`) | `id`, `room_id`, `status` (`planned` / `active` / `released` / `cancelled`, SM-02 – **bỏ** cột `type` của v0.1, sửa D-9), `start_date`, `end_date_planned`, `end_date_actual` (= **ngày mở bán lại**, nửa mở), `reason`, `work_order_id`, `created_at/by`, `released_at/by` | Đêm OOO = `status IN (active, released)` và `[start_date, coalesce(end_date_actual, end_date_planned))` (Q-04, K-01, BL #29); R-05, R-06a; giữ lịch sử, không xóa |
| **Channel** | `id`, `code`, `name`, `group` (direct / agent / ota / internal), `commission_rate` + `effective_from` (bảng lịch sử tỷ lệ), `is_active`. Danh mục R2: 5 OTA BR-901 + Trực tiếp + CTV/môi giới + Nội bộ | Q-11, Q-12, K-09, K-11; thông báo gia hạn (BL #12) |
| **Booking** (đơn ngắn ngày và HĐ dài hạn) | `id`, `code`, `property_id`, `room_id` (hiện tại), `stay_type` (short/long), `channel_id`, `sales_person_id` (nhân viên/CTV), `agent_id`, `parent_booking_id` (đơn con gia hạn), `stay_group_id` (lượt lưu trú), `status` (hold/confirmed/in_house/checked_out/cancelled/no_show), `arrival_date`, `departure_date` (dự kiến), `arrival_date_actual`, `departure_date_actual`, `actual_checkin_at`, `actual_checkout_at`, `adults`, `children`, `ota_ref`, `payment_model` (OTA thu hộ / thu tại chỗ, BR-307), `is_complimentary`, `created_at/by`. **(mới v0.2)** `direct_source` (Website / Zalo-điện thoại / vãng lai / quay lại / Sale nội bộ / null – chỉ kênh Trực tiếp, không bắt buộc), `confirmed_at` (lần đầu `confirmed`), `ota_booked_at` (ngày khách đặt trên OTA – lead time), `conflict_state` | Q-03, Q-07, Q-11, K-02, K-11, K-12, K-14, K-19, K-22, S1, S2 |
| Booking – giữ chỗ | `hold_created_at`, `hold_hours`, `hold_expires_at`, `hold_extended_count` | BL #8, S7 |
| Booking – hủy/no-show | `cancelled_at`, `cancelled_by` (user hoặc `system`), `cancel_reason_code` (danh mục BR-308 v0.2: `guest_cancelled`, `guest_changed_mind`, `found_other`, `price`, `date_change`, `unreachable`, `hold_expired`, `ota_cancelled`, `overbooking_relocated`, `group_partial`, `other`), `no_show_marked_at/by`; **(mới v0.2)** `status_before_cancel` (`hold`/`confirmed`, điền khi `cancelled`/`no_show`) | Q-03, S7, K-22, phí hủy vào doanh thu khác |
| Booking – thời gian thao tác | `checkin_started_at`, `checkin_completed_at`, `checkout_started_at`, `checkout_started_by`, `checkout_completed_at`, `checkout_mode` (quầy/tự phục vụ/công nợ) | S3, S4 |
| Booking – liên hệ khách (cờ) | `guest_link_sent_at`, `has_contact_at_send` (bool); **(mới v0.2)** `has_contact_at_eligibility` (bool, chốt tại mốc 48 giờ trước ngày đến) | S5, S5-pre, S5-link – chỉ cờ, không sao chép SĐT/email |
| **BookingHistory** (`reservation_change`) | `reservation_id`, `changed_at`, `changed_by`, `field`, `old_value`, `new_value`, `reason` (trạng thái, ngày, căn, giá) – **nguồn lịch sử cho chỉ số**, thời hạn T08 | Q-14, pickup R3, K-22, R-04, kiểm toán |
| **StayNight** (`stay_night`, bảng đêm-phòng, sinh/cập nhật bởi server **trong cùng giao dịch** khi đơn, phí, hoa hồng, FOC/giảm giá đổi) | **Cột lõi**: `reservation_id`, `room_id` (**null = đêm xung đột chưa gán căn**), `stay_date`, `night_state` (`hold`/`sold`/`void`), `room_revenue_vnd` (sau giảm trừ, gồm VAT), `vat_rate_snapshot`, `is_complimentary`, `rate_source` (giá đêm ngắn ngày / phân bổ HĐ / đêm thêm sớm–muộn / gia hạn / chia đều tổng OTA), `channel_id` (snapshot), `stay_type`. **(mới v0.2) Cột phân bổ theo đêm** (sửa D-2, D-7; Q-05, Q-10, Q-12): `room_revenue_gross_vnd` (giá đêm đã chốt trước giảm trừ), `discount_vnd` (giảm giá + FOC tiền phòng của đêm; `room_revenue_vnd = gross − discount`), `channel_fee_vnd`, `channel_fee_is_estimate` (bool), `agent_commission_vnd`, `staff_commission_vnd`, `service_fee_alloc_vnd` (phí dịch vụ & dọn dài hạn, BR-204 – doanh thu khác). Quy tắc chia: phần nguyên đồng, **dư dồn đêm cuối** (của đơn với phí/hoa hồng/giảm cả đơn/tổng OTA; của tháng hợp đồng với tiền thuê và phí dịch vụ dài hạn). **(mới v0.2) Cột mốc thời gian** (sửa D-3): `sold_at` (lần đầu thành `sold`), `voided_at`, `void_reason` ∈ `hold_expired \| cancelled \| no_show \| early_departure \| lease_terminated \| date_change \| relocated_external \| channel_cancelled`, `prev_state` (`hold`/`sold` ngay trước khi void). Mỗi lần void phải điền đủ 3 cột | Q-02, Q-05, Q-06, Q-07, Q-08, Q-10, Q-12, Q-14 (pickup); K-02…K-07, K-09, K-10, K-11, K-12, K-14, K-15, K-22; S1c; R-02…R-06b, R-09. **Lý do quan trọng nhất**: một nguồn cho đếm đêm, doanh thu và chi phí theo đêm, tránh lặp lại lỗi #8, #11, #22 ở tầng báo cáo; báo cáo **không tự chia lại** để tổng các tháng khớp đúng từng đồng. Chỉ mục gợi ý: (`property_id`,`stay_date`) WHERE `night_state='sold'` và WHERE `night_state='void'` |
| **Contract** (phần dài hạn của Booking) | `booking_id`, `start_date`, `term_months`, `end_date` (BR-209), `actual_end_date`, `monthly_rent` (snapshot), `service_fee_monthly`, `cleaning_package`, `billing_cycle_months`, `deposit_amount`, `foreigner_surcharge_applied`, `term_discount_rate`, `termination_type` (đúng hạn / sớm có báo trước / sớm không báo), `terminated_at` | Q-10, K-12, K-13, K-14 (thời hạn HĐ bình quân), R-03, BL #22 |
| **BillingSchedule** (kỳ thu dài hạn) | `contract_id`, `period_from`, `period_to`, `due_date`, `amount_rent`, `amount_service`, `status`, `paid_amount`, `paid_at` | K-20 (phải thu, thu trước), "Cần chú ý" BR-207 |
| **FolioLine** | `id`, `booking_id`, `category` (room / early_checkin / late_checkout / extra_person / minibar / fnb / laundry / cleaning / service_fee / utilities / penalty / damage / cancellation_fee / no_show_fee / early_departure_fee / deposit_forfeit / discount / foc / adjustment), `revenue_group` (room / other / non_revenue – suy từ category; **(mới v0.2)** `adjusts_group` bắt buộc khi `category = adjustment`, khi đó `revenue_group = adjusts_group`), `stay_night_id` (dòng phòng/FOC/giảm gắn đêm), `amount` (VND, gồm VAT, âm cho FOC/giảm), `vat_rate_snapshot`, `service_date` hoặc `period_from/period_to`, `quantity`, `unit_price`, `related_line_id` (dòng FOC trỏ dòng gốc), `reversal_of_id`, `posted_at`, `posted_by` | Q-09, K-06, K-07, K-18, R-02; không xóa – đảo bút toán |
| **Payment** | `id`, `folio_id/booking_id`, `type` (charge / deposit / security_deposit / refund / deposit_deduction), `method` (VietQR / VNPay / MoMo / thẻ / tiền mặt / OTA thu hộ), `amount`, `received_at`, `recorded_by`, `gateway_ref` | K-20, R-07 |
| **ChannelFee** | `booking_id`, `channel_id`, `base_amount` (tiền phòng chịu phí), `rate_snapshot`, `amount_estimated`, `amount_actual`, `source` (channel manager / đối soát tay / ước tính), `reconciled_at`; **(mới v0.2)** `recognized_on` (date – ngày nghiệp vụ hủy/no-show với đơn có phí trên phí hủy; null với đơn bình thường vì đã phân bổ theo đêm), `amount_on_cancellation` | Q-12, K-09, K-10, K-15; sửa BL #11; R-01, R-09 |
| **Commission** | `id`, `reservation_id` hoặc `lease_contract_id` (đúng một), `payee_type` (agent / staff), `payee_user_id`, `rate_snapshot` (gồm +1% NN nếu có), `base_amount`, `amount`, `status` (SM-11: `projected` = dự kiến; `earned`/`payable`/`paid` = ghi nhận; `void` = hủy), `recognized_at`, `void_reason` | K-09 (chỉ `agent`), K-15 (cả hai), R-09, Q-D2 7%/8% |
| **CommissionPayout** | `commission_id`, `tranche_no`, `due_condition`, `due_date`, `amount`, `paid_at`, `paid_by` | Dòng tiền hoa hồng dài hạn (BR-212), điều chỉnh khi chấm dứt sớm |
| **Expense** (chi phí nhập tay) | `property_id`, `month`, `category` (lương / điện nước internet / giặt là & amenity / marketing / sửa chữa bảo trì / phần mềm & khác – **không có** mục phí kênh, hoa hồng, giá vốn), `amount`, `note`, `entered_by`, `entered_at`, `adjusts_expense_id` | K-15; BR-902 |
| **InventoryIssue** (xuất kho bán minibar/F&B) | R2: `minibar_check_line.unit_cost_vnd_snapshot` (**mới v0.2** – lấy `item.avg_cost_vnd` nếu có, không thì `item.cost_price_vnd` tại lúc bán); R3: `stock_movement` (`folio_line_id`/`ref_id`, `item_id`, `quantity`, `unit_cost_vnd_snapshot` bình quân gia quyền BR-705, `occurred_at`) | Giá vốn trong GOP (K-15) – không tính lùi theo giá hiện tại |
| **FocApproval** | `folio_line_id`, `reason_code`, `requested_by`, `approver_id`, `approver_role_snapshot`, `approver_limit_snapshot`, `approved_at`, `method` (PIN/mật khẩu), `status` (chờ / duyệt / từ chối) | K-18, S8, BR-432–435 |
| **Registration** (khai báo lưu trú) | `booking_id`, `type` (VN thông báo lưu trú / NN tạm trú), `required_count`, `submitted_count`, `status` + lịch sử, `pre_submitted_at` (khách gửi qua app), `deadline_at` (tính theo BR-602/603 khi nhận phòng, lưu lại), `sent_at` (nhập mã hồ sơ), `police_code_entered_by` | S2, S4, S5 – chỉ dùng thời điểm và trạng thái, không dùng nội dung giấy tờ |
| **Quote** | `id`, `type` (short/long), `started_at`, `sent_at`, `expires_at`, `status`, `created_by`, `converted_booking_id` | S6; tỉ lệ chuyển đổi báo giá → giữ chỗ → cọc (R3) |
| **OverbookingIncident** (`overbooking_incident`) | `reservation_id`, `requested_room_id`, `stay_from`, `stay_to`, `conflicting_reservation_ids`, `detected_at`, `source` (`desk` / `channel_sync`), `status` (`open`/`resolved`), `resolution` (`reassigned_same_group` / `upgraded` / `relocated_external` / `cancelled_by_channel`), `cost_vnd`, `resolved_at`, `resolved_by` | S1a, S1b, S1c, BR-312; **chi phí dời khách trong GOP (K-15), R-08** |
| **MeterReading** | `room_id`, `contract_id`, `period_from`, `period_to`, `electric_start/end`, `water_start/end`, `read_at`, `read_by` | Doanh thu khác "điện nước" theo kỳ công tơ (Q-09) |
| **User / UserActivityDay / AuditLog** | `app_user.role`, `app_user.active`; **(mới v0.2, thay `UserSession`)** `user_activity_day(user_id, property_id, activity_date, first_seen_at, last_seen_at, write_count)`, PK (`user_id`,`property_id`,`activity_date`), upsert tối đa 1 lần/5 phút/phiên, không IP/thiết bị, thời hạn T15; `audit_event.user_id/action/entity/at` | S11 (sửa D-8); kiểm toán chỉ số tiền |
| **Guest** (chỉ phần chỉ số dùng) | `nationality` (mã quốc gia), `is_foreigner` (BR-009) | Cơ cấu khách nội địa/nước ngoài, phụ thu NN – dữ liệu C2, chỉ dùng gộp |
| **MonthClose** – *R3, chờ story PO* | `property_id`, `month`, `closed_at`, `closed_by`, `snapshot_ref` | Q-14 – giữ nguyên số tháng đã chốt. Bảng có thể tạo sẵn ở R2 (chi phí thấp) nhưng **không** làm luồng chốt tháng ở R2 |
| **MetricRegistry** – *R3, chờ story PO* (cấu hình, có thể là file trong code) | `metric_code` (K-xx, S-xx), `name`, `formula_version` | S9 – mọi thẻ số liệu tham chiếu mã chỉ số. R2 chỉ cần API trả kèm mã chỉ số (ví dụ `TonightKpi.metricRefs`) |
| **Tham số** (bảng tham số có hiệu lực theo ngày của ARC) | **(mới v0.2)** `front_desk_hours` (BR-811), `s2_shift_end_buffer_minutes` (đề xuất 60), `business_day_start` (06:00, DOM) | S2-trực, Q-01 |

**Ràng buộc kỹ thuật DATA đề nghị ARC đưa vào thiết kế:**
- Ràng buộc chống trùng (căn, ngày lưu trú) ở DB cho các khối đang hiệu lực (đơn `hold`/`confirmed`/`in_house` và OOO `active`) – nền tảng của S1a (BR-906).
- Job theo lịch: hết hạn giữ chỗ (S7), kiểm trùng hằng ngày (S1) + R-06a/R-06b (J17), sinh/điều chỉnh `StayNight` cho HĐ dài hạn khi đổi ngày/chấm dứt.
- Ghi/đổi `channel_fee` hoặc `commission`, duyệt/đảo FOC hoặc giảm giá tiền phòng → phân bổ lại các cột phí/giảm của `stay_night` của đơn (trừ đêm thuộc tháng đã chốt – Q-14).
- `StayNight` cập nhật **trong cùng giao dịch** với thay đổi đơn để báo cáo luôn khớp (R-02, R-04).

---

## 10. Lịch sử thay đổi

| Ngày | Round | Thay đổi | Người |
|---|---|---|---|
| 15/10/2026 | 1 (đợt 2) | Bản nháp đầu tiên | DATA |
| 15/10/2026 | 1 (bước 4) | v0.2: Q-01 ngày nghiệp vụ 06:00; Q-04 OOO nửa mở theo `status`; Q-05 tách đêm đã gán/chưa gán + FOC/giảm giá sau đặt; Q-06 đóng O-5; Q-07 `void_reason`; Q-10 thay BR-215 tháng lịch; Q-11 kênh + nguồn; Q-12 chia tổng OTA, phân bổ phí/hoa hồng theo đêm; Q-14 nhãn R3, nguồn lịch sử `reservation_change`, công thức pickup; K-15 thêm chi phí dời khách; K-22 hủy/no-show mới; lộ trình hiển thị; S1c, S2-trực theo `front_desk_hours`, S5-pre/S5-link, S11 nguồn `user_activity_day`; R-06a/R-06b/R-08/R-09; mục 9 bổ sung cột. Xử lý FB-R1-PO-DATA-01…06 và D-1…D-10 | DATA |
| 16/10/2026 | 1 (bước 5) | Sửa BUG-R1-003: K-22a và mục 9 dùng mã lý do hủy theo BR-308 v0.2 (`relocated_external` → `overbooking_relocated`, `channel_cancelled` → `ota_cancelled`; ghi rõ `guest_cancelled` được tính) | DATA |
