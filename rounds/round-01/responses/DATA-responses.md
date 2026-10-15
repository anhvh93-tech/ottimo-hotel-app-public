# DATA – Phản hồi review Round 1 (Bước 4)

- Tác giả: DATA | Ngày: 15/10/2026
- Thẻ nhận: `reviews/PO-on-DATA.md` (6 thẻ: 0 Blocker · 0 Major · 4 Minor · 2 Suggestion) + 10 lỗi tự nhận D-1…D-10 (`reviews/DATA-on-ARC.md` phần C)
- Sản phẩm đã sửa: `product/docs/metrics-definitions.md` v0.1 → **v0.2** (lịch sử thay đổi ở mục 10)
- Tổng: **16/16 Done** · 0 Rejected · 0 Deferred · 0 Escalated

## 1. Thẻ của PO

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| FB-R1-PO-DATA-01 | Done | S2 bỏ mốc cứng 21:00. Đích phụ đổi thành "100% với khách nhận phòng trong giờ trực lễ tân" (S2-trực): `actual_checkin_at` nằm trong `front_desk_hours` (BR-811) và cách giờ hết khung ít nhất `s2_shift_end_buffer_minutes`, DATA đề xuất 60 phút. Tham số có hiệu lực theo ngày nên đổi giờ trực không làm sai số tháng cũ. Đã thêm tham số vào mục 9, câu hỏi mở O-7. **Đề nghị DOM** đưa `s2_shift_end_buffer_minutes` vào BR mục 13 (ORC chuyển giúp, vì DATA không sửa file DOM). |
| FB-R1-PO-DATA-02 | Done | Gắn nhãn "**R3 – chờ story PO**" ở Q-14 (chốt tháng, pickup), mục 6 (R-01…R-09 là AC của story báo cáo EP13; "lệch chặn chốt" chỉ áp khi có story Chốt số liệu tháng), `MonthClose` và `MetricRegistry` ở mục 9. Vẫn giữ các trường dữ liệu. Thêm bảng "Lộ trình hiển thị" (xem thẻ 06). |
| FB-R1-PO-DATA-03 | Done | Q-10 thêm dòng "Thay thế câu '÷ số đêm của tháng lịch' ở BR-215". DOM đã chốt trong decision-log ("BR-215: phân bổ dài hạn chia theo số đêm của tháng hợp đồng"), nhưng văn bản `business-rules.md` dòng BR-215 vẫn ghi "tháng lịch" → ghi O-8 "chờ DOM sửa văn bản". Không cần thẻ mới vì PO đã nêu ở FB-R1-PO-DOM-09. |
| FB-R1-PO-DATA-04 | Done | Q-11 viết lại theo cấu trúc "kênh + nguồn". Kênh R2 = 5 OTA BR-901 + Trực tiếp + CTV/môi giới + Nội bộ. `direct_source` không bắt buộc, chỉ dùng cho kênh Trực tiếp (Website, Zalo/điện thoại, vãng lai, quay lại, Sale nội bộ, trống thì hiện "chưa rõ nguồn"). Traveloka/Google chỉ thêm khi có ESC-012. K-11 tính theo `group = direct` và gồm mọi nguồn cộng đơn con gia hạn. Mục 9 có thêm `Booking.direct_source`. |
| FB-R1-PO-DATA-05 | Done | Chọn cả hai cách. S5 tính trên **mọi đơn đủ điều kiện có liên hệ**, không lọc theo việc đã gửi link. Thêm S5-pre (tỉ lệ đơn được gửi link trước 48 giờ) và S5-link (S5 chỉ trên đơn đã nhận link). Ba số luôn hiện cùng nhau. Ví dụ: 36,7% / 80,0% / 45,8%. Cờ liên hệ chốt ở mốc 48 giờ, `has_contact_at_eligibility`, chỉ là cờ có/không. |
| FB-R1-PO-DATA-06 | Done | Thêm mục "Lộ trình hiển thị" ngay sau K-22. R2: K-01/K-02/K-03 đêm nay + số đơn xung đột chưa gán, S7 giám sát giữ chỗ treo, S1c. R3: K-01…K-22 theo tháng, K-21, R-01…R-09, pickup, S9. R4: S1–S8, S10–S12 khi INV vận hành thật. Ghi rõ: mọi trường mục 9 vẫn phải lưu từ R2. |

## 2. Lỗi tự nhận (DATA-on-ARC phần C)

| ID | Trạng thái mới | Ghi chú |
|---|---|---|
| D-1 | Done | Q-05 chia đêm `sold` thành **đã gán căn** (tử số Occupancy, luôn ≤ 100%) và **xung đột chưa gán** (`room_id IS NULL`). Đêm chưa gán: không vào công suất, không trừ đêm khả dụng (Q-04), vẫn tính vào doanh thu phòng và ADR. K-02, K-03 (cả biến thể đêm nay), K-04, K-06 sửa theo. R-06 được thay bằng **R-06a** (đẳng thức chỉ với đêm đã gán) và **R-06b** (cảnh báo nghiệp vụ khi còn căn trống cùng nhóm hoặc nhóm cao hơn mà đơn chưa được gán). Thêm **S1c** (đêm xung đột chưa gán) cạnh S1b. |
| D-2 | Done | Mục 9 `stay_night` thêm `room_revenue_gross_vnd`, `discount_vnd`, `channel_fee_vnd`, `channel_fee_is_estimate`, `agent_commission_vnd`, `staff_commission_vnd`, `service_fee_alloc_vnd`. Q-12 ghi quy tắc phân bổ tỷ lệ theo doanh thu đêm: lấy phần nguyên, dư dồn vào đêm cuối, báo cáo không tự chia lại. Thêm R-09 (Σ theo đêm = số của đơn, lệch 0 đồng). K-07 lấy phí dịch vụ dài hạn từ `service_fee_alloc_vnd`. K-15 lấy phí và hoa hồng từ các cột theo đêm. `channel_fee` thêm `recognized_on`, `amount_on_cancellation`. |
| D-3 | Done | `stay_night` thêm `sold_at`, `voided_at`, `void_reason` (8 giá trị), `prev_state`. Q-14 có công thức pickup: đêm `sold` của ngày D tại thời điểm X, dùng `sold_at ≤ X` và `voided_at` null hoặc sau X. Q-07 ghi `void_reason` cho trả sớm và đổi ngày. |
| D-4 | Done | Thêm **K-22** gồm 5 chỉ số: hủy đơn đã xác nhận theo đơn (loại `hold_expired`, `relocated_external`, `channel_cancelled`), hủy theo đêm, no-show (mẫu số là đơn `in_house`/`checked_out`/`no_show`), đêm mất theo kênh (không gồm `date_change`, trả sớm báo dòng riêng), và doanh thu bù từ phí hủy/no-show. Có ví dụ tính. |
| D-5 | Done | K-15 thêm "chi phí dời khách do overbooking" = Σ `overbooking_incident.cost_vnd` của sự cố `resolved` trong kỳ (BR-312). Thêm R-08 đối chiếu với dòng P&L. |
| D-6 | Done | Q-12 thêm cách chia tổng tiền phòng OTA: có `nightlyRates` thì Σ phải bằng tổng, chỉ có tổng thì chia đều, phần nguyên, dư dồn đêm cuối. Ví dụ: 2.000.000 / 3 đêm → 666.666 + 666.666 + 666.668. `rate_source` thêm giá trị "chia đều tổng OTA". |
| D-7 | Done | Q-05 thêm quy tắc FOC hoặc giảm giá **sau khi đặt**. FOC 100% một đêm → `is_complimentary = true`, doanh thu 0. Giảm một phần → doanh thu sau giảm, đêm vẫn là đêm bán. Giảm cả đơn → phân bổ theo đêm. Từ chối hoặc đảo bút toán → trả lại giá trị cũ. FOC phụ thu/minibar không chạm `stay_night`. Mục 9 thêm `folio_line.adjusts_group`, `stay_night_id`. |
| D-8 | Done | S11 đổi nguồn sang `user_activity_day` (có ghi nhận cả khi chỉ xem; không lưu IP/thiết bị). Mục 9 thay `UserSession`, mục 7 cập nhật câu dữ liệu nhân viên. |
| D-9 | Done | Q-04, K-01, mục 9 `RoomBlock` bỏ cột `type`. Đêm OOO = `status IN (active, released)` và `[start_date, coalesce(end_date_actual, end_date_planned))`, nửa mở theo quyết định DOM (mở bán lại = ngày xong + 1). Khối `planned`/`cancelled` không tính. Ví dụ 401 [15/10, 18/10) = 3 đêm, vẫn ra 307 đêm khả dụng tháng 10. |
| D-10 | Done | Mục 9 `Booking` thêm `confirmed_at`, `status_before_cancel`, `ota_booked_at` (cùng `direct_source`, `conflict_state`, `checkout_started_by`, `has_contact_at_eligibility`). Nguồn lịch sử cho chỉ số là `reservation_change` (thời hạn T08), ghi ở nguyên tắc 2 mục 9 và Q-14. |

## 3. Áp quyết định DOM trong decision-log

| Quyết định DOM | Đã áp ở |
|---|---|
| BR-411: nhận trước 06:00 = đêm bán | Q-06 đổi thành "Đã chốt", O-5 đóng |
| BR-215: chia theo số đêm của tháng hợp đồng | Q-10 ghi dòng thay thế, O-8 (chờ DOM sửa văn bản BR) |
| Khối OOO nửa mở [bắt đầu, ngày mở bán lại) | Q-04, K-01, mục 9 RoomBlock |
| Ngày nghiệp vụ đổi lúc 06:00 | Q-01 (định nghĩa, phạm vi áp dụng; ngoại lệ K-20 theo ngày lịch để khớp sao kê), K-03 đêm nay, S1/S2/S5, K-22, tham số `business_day_start` mục 9 |

## 4. Việc phụ thuộc vai khác (không sửa file của họ)

- **ARC**: các cột "(mới v0.2)" ở mục 9 phải khớp với các thẻ FB-R1-DATA-ARC-01…11 mà ARC đang sửa trong `erd.md`. Ngoài các thẻ đó, có thêm `reservation.direct_source`, `has_contact_at_eligibility`, tham số `s2_shift_end_buffer_minutes`. DATA sẽ đối chiếu lại ERD sau khi ARC sửa xong.
- **DOM**: (1) sửa văn bản BR-215; (2) thêm tham số `s2_shift_end_buffer_minutes` vào BR mục 13.
- **PO**: sửa câu chữ PRD S2 cho khớp (PO đã nhận); story R3 cho "Chốt số liệu tháng" và EP13 dùng R-01…R-09 làm AC.

## 5. Dòng decision-log đề xuất

ORC chép vào `01-decisions/decision-log.md` (DATA không sửa file này):

| Ngày | Round | Quyết định | Người quyết | Lý do |
|---|---|---|---|---|
| 2026-10-15 | 1 | Occupancy chỉ đếm đêm `sold` đã gán căn (luôn ≤ 100%). Đêm OTA xung đột chưa gán vẫn vào doanh thu phòng và ADR, không trừ đêm khả dụng, báo riêng ở S1c. Đối chiếu R-06 tách thành R-06a (đẳng thức đêm đã gán + OOO + trống = số căn) và R-06b (cảnh báo nghiệp vụ) | DATA | ARC M5, FB-R1-DATA-ARC-03 |
| 2026-10-15 | 1 | Phí kênh, hoa hồng, giảm giá/FOC tiền phòng, phí dịch vụ dài hạn được phân bổ và lưu theo đêm trên `stay_night`: phần nguyên đồng, dư dồn đêm cuối. Báo cáo không tự chia lại. Tổng OTA không có giá từng đêm thì chia đều | DATA | BL 8.2 #11; Σ các tháng khớp đúng số của đơn (R-09) |
| 2026-10-15 | 1 | Nguồn lịch sử đơn cho chỉ số là `reservation_change` (thời hạn T08). `stay_night` giữ `sold_at`/`voided_at`/`void_reason`/`prev_state` để tính pickup và đêm mất | DATA | FB-R1-DATA-ARC-04, 05 |
| 2026-10-15 | 1 | Thêm K-22: tỉ lệ hủy đơn đã xác nhận (loại giữ chỗ hết hạn, dời khách, kênh hủy do xung đột), tỉ lệ no-show (mẫu số = đơn đến hạn đến), đêm mất theo kênh | DATA | Thiếu chỉ số hủy/no-show (D-4) |
| 2026-10-15 | 1 | GOP gồm chi phí dời khách do overbooking (Σ `overbooking_incident.cost_vnd` đã giải quyết trong kỳ) | DATA | BR-312 |
| 2026-10-15 | 1 | S2 đích phụ đo theo tham số `front_desk_hours` cùng đệm cuối ca 60 phút (tham số, chờ DOM đưa vào BR mục 13). S5 tính trên mọi đơn đủ điều kiện, kèm S5-pre (đã gửi link trước 48 giờ) và S5-link. S11 dùng `user_activity_day` | DATA | FB-R1-PO-DATA-01, 05; D-8 |
| 2026-10-15 | 1 | Chỉ số theo thời điểm sự kiện dùng ngày nghiệp vụ (đổi lúc 06:00). Riêng dòng tiền K-20 dùng ngày lịch để khớp sao kê | DATA | Áp quyết định DOM ngày nghiệp vụ 06:00 |
| 2026-10-15 | 1 | Chốt tháng, pickup, bộ đối chiếu R-01…R-09 và MetricRegistry là R3 (chờ story PO). R2 chỉ lưu đủ trường và hiện K-01/K-02/K-03 đêm nay, S1c, S7 giám sát | DATA (theo PO) | FB-R1-PO-DATA-02, 06 |
