# DATA review ARC – ERD đủ trường cho chỉ số

- Người review: DATA | Tác giả: ARC | Round 1 – Bước 3 (review chéo, khuyến nghị theo plan mục 5) | Ngày: 15/10/2026
- Đối tượng: `product/docs/erd.md` v0.1 (mục 4, 7, 8, 12, 13.2, 14), `product/docs/api/openapi.yaml` (TonightKpi, ReservationCreate, Reservation, OverbookingIncident, move, resolve-external), `product/docs/architecture.md` mục 8, 9.1 (J1, J17)
- Chuẩn đối chiếu: `product/docs/metrics-definitions.md` (gọi tắt **MD**) mục 1–6 và **mục 9 – trường bắt buộc**; ARC report mục M5, erd mục 14 E3
- Phạm vi: chỉ góc nhìn "lưu đủ dữ liệu để tính chỉ số". Không review bảo mật (SEC), API khác (BE), tích hợp (INT).

---

## A. Đối chiếu từng dòng MD mục 9 → ERD

Ký hiệu: **Đủ** · **Đủ*** (đủ, có ghi chú nhỏ, không cần thẻ) · **Thiếu** (có thẻ).

| MD mục 9 | Bảng ERD | Kết quả | Ghi chú / thẻ |
|---|---|---|---|
| Nguyên tắc 1 – không xóa cứng | mục 1 "Xóa", K8 | Đủ | REVOKE DELETE trên bảng tiền + nhật ký. Nhưng `state_transition` bị job T15 xóa – xem FB-05 |
| Nguyên tắc 2 – lịch sử đơn | `reservation_change`, `state_transition` | Đủ* | Hai nguồn, chưa nói nguồn nào cho chỉ số và thời hạn lưu – FB-05 |
| Nguyên tắc 3 – tiền nguyên, snapshot | mục 1, `pricing_snapshot` | Đủ | |
| Nguyên tắc 4 – timestamptz, `date` theo giờ cơ sở | mục 1 | Đủ | |
| Nguyên tắc 5 – `property_id` | mục 1, 2 | Đủ | |
| Property | `property` | Đủ | `currency`, `timezone`, `month_close_day` |
| Room | `room` | Đủ | `is_sellable`, `active_from/to` |
| RoomGroup | `room_group` | Đủ | |
| RoomBlock (OOO) | `room_block` | Đủ* | `type` OOO/kế hoạch → `status planned/active`: chấp nhận. Đếm OOO dùng `status IN (active, released)` và `[start_date, coalesce(end_date_actual, end_date_planned))` |
| Channel + lịch sử tỷ lệ | `channel`, `channel_commission_rate` | Đủ | Danh mục mã kênh khớp MD Q-11, không còn kênh "HĐ dài hạn" |
| Booking – trường chính | `reservation`, `reservation_segment` | Đủ* | `sales_person_id/agent_id` gộp thành `closer_user_id`: chấp nhận vì người nhận hoa hồng nằm ở `commission.payee_type`. `*_actual` → ngày hiện hành + `booked_*`: chấp nhận |
| Booking – giữ chỗ | `reservation.hold_*` | Đủ | |
| Booking – hủy/no-show | `cancelled_*`, `no_show_marked_*` | Đủ* | Thiếu trạng thái **trước khi hủy** (hold hay confirmed) ngay trên đơn – FB-05 |
| Booking – thời gian thao tác | `checkin_*`, `checkout_*`, `checkout_mode` | Đủ* | Thiếu `checkout_started_by` (MD S3) – FB-11 |
| Booking – cờ liên hệ | `guest_link_sent_at`, `has_contact_at_send` | Đủ | |
| BookingHistory | `reservation_change` | Đủ* | FB-05 |
| **StayNight** | `stay_night` | **Thiếu** | Đủ các cột MD đã liệt kê, nhưng thiếu cột phân bổ phí kênh/hoa hồng (FB-01), thiếu mốc thời gian và lý do void (FB-04), chưa có quy tắc FOC/giảm giá (FB-02), chưa có quy tắc đêm chưa gán căn (FB-03) |
| Contract | `lease_contract` | Đủ | |
| BillingSchedule | `billing_period` | Đủ | Có thêm `kind` rent/utilities – tốt |
| FolioLine | `folio_line` | Đủ* | `revenue_group` sinh từ `category` → dòng `adjustment` không xác định được nhóm – FB-07 |
| Payment | `payment` | Đủ | |
| ChannelFee | `channel_fee` | Thiếu | Thiếu ngày ghi nhận (đơn hủy) và API đối soát thực tế – FB-01, FB-06 |
| Commission, CommissionPayout | `commission`, `commission_payout` | Thiếu | ERD chỉ ghi "theo DATA mục 9", không có từ điển cột – FB-08 |
| Expense | `expense` (R3) | Đủ | |
| InventoryIssue | `minibar_check_line` (R2) + `stock_movement` (R3) | Thiếu | R2 không chép giá vốn – FB-09 |
| FocApproval | `approval_request` | Đủ | Có snapshot vai, hạn mức, phương thức xác nhận |
| Registration | `registration` | Đủ | |
| Quote | `quote` | Đủ | |
| OverbookingIncident | `overbooking_incident` | Đủ* | Lưu theo khoảng thay vì theo đêm: chấp nhận. `cost_vnd` cần vào GOP (lỗi phía DATA, phần C) |
| MeterReading | `meter_reading` (R3) | Đủ | |
| User / UserSession / AuditLog | `app_user`, `user_session`, `audit_event` | Thiếu | `user_session` bị xóa khi hết hạn → không đếm được ngày dùng theo tuần (S11) – FB-10 |
| Guest | `guest.nationality_code`, `is_foreigner` | Đủ | |
| MonthClose, MetricRegistry | R3 | Đủ | |
| Ràng buộc chống trùng | `room_occupancy` EXCLUDE | Đủ | Nền tảng S1a – rất tốt |
| Job hết hạn giữ chỗ, kiểm trùng, sinh `StayNight` dài hạn | J1, J17, erd mục 8 | Đủ* | J17 kiểm R-06 cần sửa theo FB-03 |
| `StayNight` cập nhật cùng giao dịch | erd mục 4.5, 8 | Đủ | |

Tổng: 30 dòng, 21 Đủ/Đủ*, 9 dòng Thiếu hoặc cần sửa → 11 thẻ dưới đây.

---

## B. Thẻ feedback

### FB-R1-DATA-ARC-01
- Mức độ: Major
- Vị trí: `erd.md` mục 4.5 `stay_night`; mục 4.6 `channel_fee`, `commission`
- Vấn đề: `stay_night` chỉ có `room_revenue_vnd`. Phí kênh nằm ở `channel_fee` **một dòng cho mỗi đơn** (`reservation_id` UK), hoa hồng ở `commission` theo đơn/HĐ. MD Q-12 quy định phí kênh và hoa hồng ghi nhận **theo đêm, tỷ lệ với doanh thu phòng** để rơi vào cùng kỳ với doanh thu. ERD không có chỗ lưu phần phân bổ này. Phí dịch vụ và dọn của HĐ dài hạn (MD Q-10, phân bổ theo đêm vào doanh thu khác) cũng không có chỗ lưu theo đêm, chỉ có `folio_line.period_from/period_to` theo kỳ thu 3 tháng. `channel_fee` cũng thiếu ngày ghi nhận cho đơn hủy (MD Q-12: phí OTA trên phí hủy ghi vào ngày hủy).
  Lưu ý: MD mục 9 của DATA cũng **không liệt kê** các cột này. Lỗi xuất phát từ cả hai phía, DATA đã ghi ở phần C.
- Vì sao quan trọng: K-09 (phí kênh), K-10 (thực thu), K-15/K-16 (GOP) theo tháng đều cần phí của đơn vắt qua hai tháng. Nếu báo cáo tự chia lại mỗi lần truy vấn thì (1) tổng các tháng có thể lệch phí của đơn vài đồng do làm tròn, nên đối chiếu R-01 (phí kênh trong bảng kênh = trong P&L) khó đạt 0 lệch; (2) khi trả sớm hoặc gia hạn, các đêm đổi làm phí đã phân bổ cho tháng đã qua bị tính lại, trái Q-14; (3) dài hạn: đơn 12 tháng, hoa hồng chi 2 đợt nhưng chi phí phải chia theo đêm, không có chỗ lưu thì R3 phải thêm bảng và chạy lại dữ liệu cũ. Đây chính là lỗi BL 8.2 #11 (P&L lệch bảng kênh) ở dạng khác.
- Đề xuất sửa: thêm vào `stay_night` (R2, server ghi trong cùng giao dịch với `room_revenue_vnd`):
  - `channel_fee_vnd` bigint – phần phí OTA của đêm = phí của đơn × doanh thu đêm ÷ tổng doanh thu đêm `sold` của đơn; chia lấy phần nguyên, **phần dư dồn đêm cuối** (giống Q-10), để Σ theo đơn = `channel_fee.amount_actual` (nếu có) hoặc `amount_estimated`. Có thêm cờ `channel_fee_is_estimate` bool.
  - `agent_commission_vnd`, `staff_commission_vnd` bigint – cùng cách chia, từ `commission` tương ứng.
  - `service_fee_alloc_vnd` bigint – chỉ cho đêm dài hạn (phí dịch vụ và dọn theo gói, BR-204) → K-07 nhóm "Phí dịch vụ & dọn dài hạn".
  - Khi `channel_fee.amount_actual` được cập nhật (đối soát) thì phân bổ lại các đêm **chưa thuộc tháng đã chốt**; phần chênh của tháng đã chốt ghi vào kỳ hiện hành (Q-14, xem FB-07).
  - `channel_fee`: thêm `recognized_on date` (= ngày hủy với đơn `cancelled`/`no_show` có phí; null với đơn bình thường vì phân bổ theo đêm) và `amount_on_cancellation_vnd`.
  - Thêm vào erd mục 8 dòng sự kiện: "Ghi/đổi `channel_fee` hoặc `commission` → phân bổ lại các cột phí của `stay_night` của đơn".
- Trạng thái: Open

### FB-R1-DATA-ARC-02
- Mức độ: Major
- Vị trí: `erd.md` mục 8 (bảng quy tắc sinh `stay_night`), mục 4.5 `stay_night.is_complimentary`, mục 4.6 `folio_line` (`stay_night_id`, `related_line_id`)
- Vấn đề: mục 8 chỉ có dòng "Đêm miễn phí / kênh Nội bộ → `is_complimentary=true`, `room_revenue_vnd=0`", áp lúc tạo đơn. **Không có quy tắc** cho trường hợp phổ biến hơn: đơn có thu tiền, sau đó được **FOC một đêm** (bù sự cố, BR-431) hoặc **giảm giá đặc biệt** trên tiền phòng (BR-107, BR-111, BR-431), được duyệt qua `approval_request` và ghi thành dòng `folio_line` âm (`foc`/`discount`) trỏ về dòng `room`. Sau khi duyệt, `stay_night.room_revenue_vnd` và `is_complimentary` có đổi không thì ERD không nói.
- Vì sao quan trọng: MD Q-05 và Q-08 cần doanh thu đêm **sau giảm trừ** và tách đêm miễn phí khỏi mẫu số ADR. Nếu `stay_night` giữ giá gốc thì K-06 bị thổi phồng và R-02 (Σ đêm = Σ folio nhóm phòng) lệch ngay ở đơn đầu tiên có FOC. Nếu chỉ đặt `room_revenue_vnd=0` mà không bật `is_complimentary` thì ADR bị kéo xuống. Đây là chỗ đếm "đêm FOC" mà chủ đầu tư sẽ hỏi (K-18).
- Đề xuất sửa: thêm dòng vào erd mục 8:
  | Sự kiện | Hành động |
  |---|---|
  | `approval_request` loại `foc`/`special_discount` được **duyệt** và dòng âm trỏ (qua `related_line_id`) về dòng `room` có `stay_night_id` | Cập nhật đêm đó: `room_revenue_vnd = gross − giảm`; nếu giảm = 100% giá đêm thì `is_complimentary = true` |
  | Giảm giá áp cho cả đơn (không gắn đêm cụ thể) | Phân bổ theo tỷ lệ doanh thu đêm, dư dồn đêm cuối |
  | Yêu cầu bị từ chối hoặc dòng bị đảo (`reversal_of_id`) | Hoàn lại giá trị trước đó |

  Thêm cột `stay_night.room_revenue_gross_vnd` (giá đêm đã chốt trước giảm trừ) và `discount_vnd` để báo cáo hiện được "giá bán – giảm – thực". Ghi rõ: FOC phụ thu, minibar… **không** chạm `stay_night` (thuộc doanh thu khác, chỉ ở `folio_line`).
- Trạng thái: Open

### FB-R1-DATA-ARC-03
- Mức độ: Major
- Vị trí: `erd.md` mục 7 bước 3–4, mục 8 dòng "Kiểm định kỳ", mục 14 E3; `architecture.md` 9.1 J17; `openapi.yaml` schema `TonightKpi`; ARC report M5
- Vấn đề: đơn OTA xung đột được lưu là `stay_night` có `room_id = NULL`, `night_state='sold'`. Nếu dùng nguyên công thức MD hiện tại thì:
  1. **Occupancy có thể vượt 100%**: K-02 đếm mọi đêm `sold`. Ngày 20/10 có 10 căn đều có khách và 1 đơn Agoda chưa gán căn thì kết quả là 11 ÷ 10 = 110%.
  2. **Đề xuất E3 của ARC ("thêm vế đêm xung đột chưa gán" vào R-06) không đúng**: R-06 là đẳng thức *có khách + OOO + trống = số căn*. Đêm chưa gán **không chiếm căn nào**, nên cộng vào vế trái sẽ khiến đẳng thức luôn sai đúng bằng số đêm xung đột, và J17 sẽ báo `data_quality` mỗi ngày có xung đột dù dữ liệu đúng.
  3. `TonightKpi` không có trường cho số đơn chưa gán; `occupiedRooms` chưa nói có gồm loại này hay không.
- Vì sao quan trọng: công suất là chỉ số mục tiêu G1 (≥ 80%). Con số > 100% hoặc nhảy bậc vì đồng bộ trễ sẽ làm mất niềm tin vào cả dashboard (S9). Báo sai "dữ liệu lỗi" mỗi ngày sẽ khiến chủ đầu tư quen bỏ qua cảnh báo thật.
- Đề xuất sửa: DATA đề xuất cách tính sau. DATA sẽ sửa MD ở bước 4, ARC chỉ cần sửa ERD, J17 và API cho khớp:
  - **Đêm có khách (mẫu số và tử số công suất)** = đêm `sold` **có `room_id`**. Occupancy = đêm có khách đã gán ÷ đêm khả dụng thuần, luôn ≤ 100%.
  - **Đêm xung đột chưa gán** (chỉ số mới, đi kèm S1b) = đêm `sold` có `room_id IS NULL`. Hiện riêng, không cộng vào công suất, **không trừ** khỏi đêm khả dụng.
  - **Doanh thu phòng và ADR**: tính cả đêm chưa gán (cam kết với kênh, tiền vẫn phát sinh), nghĩa là ADR = doanh thu phòng ÷ đêm bán có thu tiền, **gồm cả đêm chưa gán**. Khi xung đột được giải quyết:
    - `reassigned_same_group` / `upgraded`: đêm có `room_id`, tự động vào công suất.
    - `relocated_external`: theo openapi, đơn chuyển `cancelled` (lý do `relocated_external`), nên đêm `void` và ra khỏi đêm bán và doanh thu phòng. `overbooking_incident.cost_vnd` vào chi phí vận hành tự động của GOP. Cần thêm `stay_night.void_reason='relocated_external'` (FB-04) để tỉ lệ hủy **loại** các đơn này ra.
  - **R-06 sửa thành 2 kiểm tra** (thay đề xuất E3):
    - R-06a: với mỗi ngày, *đêm có khách đã gán + đêm OOO + đêm trống = số căn kinh doanh* (giữ nguyên, chỉ lọc `room_id IS NOT NULL`).
    - R-06b: *đêm xung đột chưa gán > 0* **và** ngày đó còn căn trống cùng nhóm hoặc nhóm cao hơn → cảnh báo "Có căn trống mà đơn xung đột chưa được gán" (cảnh báo nghiệp vụ, không phải lỗi dữ liệu). Đêm chưa gán > 0 mà không còn căn trống là đúng thiết kế, không cảnh báo.
  - `TonightKpi`: thêm `unassignedConflictReservations` (integer). Ghi rõ `occupiedRooms` = số căn có đêm `sold` đã gán. Thêm câu vào `denominatorNote`.
  - erd mục 8, mục 14 E3 và J17: thay "R-06" bằng "R-06a, R-06b" như trên.
- Trạng thái: Open

### FB-R1-DATA-ARC-04
- Mức độ: Major
- Vị trí: `erd.md` mục 4.5 `stay_night` (`night_state` `hold|sold|void`), mục 8
- Vấn đề: `stay_night` chỉ có trạng thái hiện tại. Khi đêm chuyển `hold → sold → void` thì **không lưu lúc nào và vì sao**: không có `sold_at`, `voided_at`, `void_reason`. Đêm `void` của đơn hold hết hạn, đơn đã cọc rồi hủy, no-show, trả sớm, đổi ngày (B7/B8) và dời khách đi nơi khác đều giống hệt nhau. MD mục 9 của DATA cũng thiếu các cột này (xem phần C).
- Vì sao quan trọng:
  - **Đêm mất do hủy/no-show** (lost room nights) theo ngày lưu trú và theo kênh: không tách được đêm của đơn đã xác nhận bị hủy với đêm giữ chỗ hết hạn, đêm dời ngày (không phải mất).
  - **"Đã đặt trước tại ngày X" (pickup / on-the-books)** mà MD Q-14 hứa cho Round 3: cần biết đêm đã `sold` từ khi nào và bị `void` khi nào, để dựng lại trạng thái tại một ngày quá khứ mà không phải ghép từng dòng `reservation_change` dạng văn bản.
  - Trả sớm: Q-07 chuyển tiền không hoàn của các đêm bỏ vào doanh thu khác. Muốn đối chiếu thì phải biết các đêm void vì `early_departure`.
- Đề xuất sửa: thêm vào `stay_night`:
  - `sold_at timestamptz` (lần đầu thành `sold`), `voided_at timestamptz`
  - `void_reason text` ∈ `hold_expired | cancelled | no_show | early_departure | lease_terminated | date_change | relocated_external | channel_cancelled`
  - `prev_state text` (trạng thái ngay trước khi void: `hold`/`sold`)
  - Đổi chỉ mục: thêm (`property_id`, `stay_date`) WHERE `night_state='void'` để tính đêm mất. Ghi vào mục 8: mỗi hành động `void` phải điền đủ 3 cột này.
- Trạng thái: Open

### FB-R1-DATA-ARC-05
- Mức độ: Major
- Vị trí: `erd.md` mục 4.3 `state_transition`, mục 4.5 `reservation` và `reservation_change`, mục 12 dòng T15
- Vấn đề: lịch sử trạng thái đơn nằm ở hai nơi: `state_transition` (có `from_state`, `to_state`, `occurred_at`, `event_code`) và `reservation_change` (field `status`, giá trị dạng văn bản). Có ba điểm chưa ổn:
  1. Mục 12 xếp `state_transition` vào **T15 (`retention.audit_months`)** và cho job xóa theo phân vùng tháng. `reservation_change` không nằm trong bảng thời hạn nào.
  2. ERD không nói **bảng nào là nguồn cho chỉ số**. Hai bảng ghi riêng nên dễ lệch nhau.
  3. Trên `reservation` không có `confirmed_at` hay `status_before_cancel`. Muốn biết đơn hủy khi đang `hold` hay đã `confirmed` (để tính **tỉ lệ hủy đơn đã xác nhận**, tách khỏi giữ chỗ hết hạn) thì phải đọc nhật ký, mà nhật ký này lại bị xóa theo T15.
- Vì sao quan trọng: tỉ lệ hủy, tỉ lệ no-show, thời gian từ giữ chỗ đến cọc (phễu R3) và so sánh cùng kỳ năm trước đều cần lịch sử trạng thái **lâu hơn** thời hạn nhật ký kiểm toán. Nếu `audit_months` được đặt 12 tháng thì báo cáo so sánh năm sẽ mất dữ liệu.
- Đề xuất sửa:
  - Thêm vào `reservation`: `confirmed_at timestamptz` (lần đầu `confirmed`), `status_before_cancel text` (điền khi `cancelled`/`no_show`). Hai cột này đủ cho 90% chỉ số hủy/no-show mà không cần nhật ký.
  - Ghi rõ trong ERD: **`reservation_change` là nguồn lịch sử cho chỉ số**, thời hạn lưu theo **T08 (tài chính)**, không theo T15. Mọi chuyển SM-01 phải ghi cả `reservation_change(field='status')` trong cùng giao dịch. `state_transition` vẫn thuộc T15 cho kiểm toán.
  - Thêm `reservation.ota_booked_at` (ngày khách đặt trên OTA, nhập tay ở R2, lấy từ channel manager ở R3) để tính khoảng cách đặt trước (lead time) đúng cho đơn OTA. Không có cột này thì `created_at` là lúc lễ tân nhập đơn, có thể trễ nhiều ngày.
- Trạng thái: Open

### FB-R1-DATA-ARC-06
- Mức độ: Minor
- Vị trí: `openapi.yaml` `ReservationCreate.otaRoomAmountVnd`, `otaChannelFeeVnd`, `nightlyRates`; `erd.md` mục 8 dòng "Tạo đơn"
- Vấn đề: (1) Đơn OTA nhập tổng tiền phòng (`otaRoomAmountVnd`) nhưng chưa có quy tắc chia tổng đó thành `room_revenue_vnd` từng đêm khi không có `nightlyRates`. (2) Không có endpoint cập nhật `channel_fee.amount_actual` khi đối soát tay (`source=manual_reconcile` có trong ERD nhưng API không có đường ghi).
- Vì sao quan trọng: đơn vắt qua hai tháng sẽ chia doanh thu theo tháng tùy cách BE tự chọn. MD Q-12 dùng "thực tế nếu có" nhưng ở R2 sẽ luôn là ước tính.
- Đề xuất sửa: (1) Mục 8: "Đơn OTA chỉ có tổng → chia đều theo đêm, phần nguyên đồng, dư dồn đêm cuối; có `nightlyRates` thì dùng theo đêm, CHECK Σ = `otaRoomAmountVnd`". (2) Thêm `PUT /reservations/{id}/channel-fee` (OWN/MGR, `If-Match`) ghi `amount_actual_vnd`, `source`, `reconciled_at` → kích hoạt phân bổ lại theo FB-01. Có thể làm ở R3 nếu PO đồng ý, nhưng cột và quy tắc chia cần có từ R2.
- Trạng thái: Open

### FB-R1-DATA-ARC-07
- Mức độ: Minor
- Vị trí: `erd.md` mục 4.6 `folio_line.revenue_group` ("suy từ `category` bằng hàm `revenue_group_of()` (generated)"); mục 4.13 `month_close`
- Vấn đề: dòng `category='adjustment'` (sửa sau khi khóa bill, K7) không biết thuộc nhóm phòng hay khác. Cột sinh tự động từ category nên không gán tay được. Ngoài ra `stay_night` được **sửa tại chỗ** khi đổi giá hoặc FOC (FB-02), nên nếu sửa đêm của tháng đã chốt thì số tháng cũ sẽ đổi, trái MD Q-14.
- Vì sao quan trọng: K-06 cần "+ điều chỉnh phân loại phòng ghi trong kỳ". Nếu không phân được nhóm thì điều chỉnh rơi sai giữa doanh thu phòng và doanh thu khác.
- Đề xuất sửa: (1) Thêm `folio_line.adjusts_group` (`room|other|non_revenue`), bắt buộc khi `category='adjustment'`; `revenue_group` = `adjusts_group` nếu có, không thì suy từ category. (2) Ghi nguyên tắc (cài ở R3 cùng `month_close`): đêm thuộc tháng đã chốt thì **không sửa** `stay_night`, server sinh dòng điều chỉnh có `service_date` = ngày hiện hành, `adjusts_group='room'`. R2 chưa có chốt tháng nên chỉ cần thêm cột.
- Trạng thái: Open

### FB-R1-DATA-ARC-08
- Mức độ: Minor
- Vị trí: `erd.md` mục 4.6 dòng "`commission` (SM-11) + `commission_payout` – theo DATA mục 9"
- Vấn đề: đây là bảng duy nhất trong nhóm tiền **không có từ điển cột**. BE sẽ phải tự dịch từ MD (tiếng Việt, tên gợi ý) sang migration. Enum trạng thái SM-11 (`projected, earned, payable, paid, void`) khác tên DATA (`dự kiến/ghi nhận/hủy`) nhưng chưa có ánh xạ.
- Vì sao quan trọng: K-09 (CTV vào chi phí kênh) và K-15 (cả CTV và nhân viên vào GOP) phân biệt nhờ `payee_type`. Thiếu cột này thì hoa hồng nhân viên dễ bị cộng nhầm vào chi phí kênh, tức là lặp lại lỗi tháng 9 theo hướng ngược lại.
- Đề xuất sửa: ghi bảng cột: `reservation_id` / `lease_contract_id` (đúng một, CHECK `num_nonnulls = 1`), `payee_type` (`agent|staff`), `payee_user_id`, `rate_pct_snapshot` (gồm +1% NN), `base_amount_vnd`, `amount_vnd`, `status` (SM-11), `recognized_at`, `void_reason`; `commission_payout`: `tranche_no`, `due_condition`, `due_date`, `amount_vnd`, `paid_at`, `paid_by`. Ánh xạ: dự kiến = `projected`; ghi nhận = `earned|payable|paid`; hủy = `void`.
- Trạng thái: Open

### FB-R1-DATA-ARC-09
- Mức độ: Minor
- Vị trí: `erd.md` mục 4.6 `minibar_check_line`; mục 13.2 dòng InventoryIssue
- Vấn đề: R2 ghi bán minibar (`minibar_check_line` có `unit_price_vnd_snapshot`) nhưng **giá vốn** chỉ có ở `stock_movement.unit_cost_vnd_snapshot` (R3). Dòng bán phát sinh ở R2 sẽ không có giá vốn chốt tại thời điểm bán.
- Vì sao quan trọng: GOP (K-15) trừ giá vốn minibar/F&B. Dữ liệu chạy thử R2–R3 (và dữ liệu thật nếu INV dùng sớm) sẽ phải lấy `item.cost_price_vnd` **hiện tại** để tính lùi, sai khi giá nhập đổi.
- Đề xuất sửa: thêm `minibar_check_line.unit_cost_vnd_snapshot` (C2) ngay ở R2, lấy `item.avg_cost_vnd` nếu có, không thì lấy `item.cost_price_vnd`. Đây là một cột, chi phí thấp.
- Trạng thái: Open

### FB-R1-DATA-ARC-10
- Mức độ: Minor
- Vị trí: `erd.md` mục 4.2 `user_session` ("Xóa dòng hết hạn sau T16"), `app_user.last_login_at`; mục 13.2 dòng User/UserSession/AuditLog
- Vấn đề: S11 cần số **ngày trong tuần** mỗi nhân viên có dùng app. `user_session` bị xóa khi hết hạn, `last_login_at` chỉ giữ lần cuối, còn `audit_event` chỉ ghi thao tác ghi (nhân viên chỉ xem sơ đồ phòng hay danh sách việc sẽ không có dòng nào).
- Vì sao quan trọng: S11 sẽ đếm thiếu buồng phòng/lễ tân chỉ xem, trong khi đó chính là nhóm cần theo dõi mức dùng.
- Đề xuất sửa: thêm bảng nhỏ `user_activity_day(user_id, property_id, activity_date, first_seen_at, last_seen_at, write_count)`, PK (`user_id`,`property_id`,`activity_date`), upsert ở middleware tối đa 1 lần mỗi 5 phút cho mỗi phiên. Không chứa IP hay thiết bị (C1). Thời hạn lưu theo T15. R2 hay R3 tùy PO, nhưng nên có trước khi INV vận hành thật (R4).
- Trạng thái: Open

### FB-R1-DATA-ARC-11
- Mức độ: Suggestion
- Vị trí: `erd.md` mục 4.5 `reservation`; `openapi.yaml` `TonightKpi`
- Vấn đề: hai trường nhỏ còn thiếu so với MD: `checkout_started_by` (S3, để loại các lần lễ tân mở trả phòng rồi bỏ dở theo từng người) và `TonightKpi` chưa ghi `metricCode` cho từng số.
- Vì sao quan trọng: S9 yêu cầu mọi thẻ số liệu gắn mã chỉ số. Nếu API trả sẵn mã thì FE không phải tự ánh xạ.
- Đề xuất sửa: thêm `reservation.checkout_started_by uuid`. `TonightKpi` thêm `metricRefs: {occupancyPct: 'K-03', availableRoomsNet: 'K-01', …}` hoặc ghi mã trong `description` của từng trường.
- Trạng thái: Open

---

## C. Tự nhận lỗi để sửa ở bước 4 (trong `metrics-definitions.md` của DATA)

| # | Lỗi trong MD | Sửa ở bước 4 |
|---|---|---|
| D-1 | **R-06 chưa tính đơn OTA xung đột chưa gán căn** (ARC M5). K-02/K-03 đếm mọi đêm `sold`, nên công suất có thể > 100% | K-02 tách "đêm có khách đã gán" và "đêm xung đột chưa gán". Occupancy chỉ dùng đêm đã gán. Doanh thu phòng và ADR gồm cả đêm chưa gán. Thay R-06 bằng R-06a/R-06b như FB-03. Thêm chỉ số "đêm xung đột chưa gán" cạnh S1b |
| D-2 | Mục 9 `StayNight` **không liệt kê** cột phân bổ phí kênh, hoa hồng, phí dịch vụ dài hạn, dù Q-12 và Q-10 yêu cầu phân bổ theo đêm | Bổ sung `channel_fee_vnd`, `channel_fee_is_estimate`, `agent_commission_vnd`, `staff_commission_vnd`, `service_fee_alloc_vnd`, `room_revenue_gross_vnd`, `discount_vnd`. Ghi quy tắc làm tròn "dư dồn đêm cuối" cho phí và hoa hồng (Q-12) |
| D-3 | Mục 9 `StayNight` thiếu `sold_at`, `voided_at`, `void_reason`, `prev_state`. Q-14 hứa có pickup nhưng không nêu dữ liệu cần | Bổ sung các cột này, liên kết với Q-14 |
| D-4 | **Không có chỉ số tỉ lệ hủy / no-show** dù đã dùng `cancelled`, `no_show` ở Q-03 | Thêm K-22: tỉ lệ hủy đơn đã xác nhận (theo đơn và theo đêm, loại `hold_expired`, `relocated_external`, `channel_cancelled` khỏi tử số chính), tỉ lệ no-show = no-show ÷ (đơn có ngày đến trong kỳ, trạng thái `in_house`/`checked_out`/`no_show`), đêm mất do hủy/no-show theo kênh. Nguồn: `reservation.status_before_cancel`, `confirmed_at`, `stay_night.void_reason` |
| D-5 | GOP (K-15) chưa có **chi phí dời khách do overbooking** (`overbooking_incident.cost_vnd`, BR-312) trong nhóm chi phí tự động | Thêm vào K-15. Thêm R-08: Σ `cost_vnd` của sự cố `resolved` trong kỳ = dòng chi phí dời khách trong P&L |
| D-6 | Q-12 chưa nói cách chia **tổng tiền phòng OTA** thành từng đêm khi OTA chỉ báo tổng | Thêm: chia đều, phần nguyên đồng, dư dồn đêm cuối (giống Q-10) |
| D-7 | Q-05 và mục 3 chưa nói FOC hoặc giảm giá **sau khi đặt** cập nhật đêm thế nào (chỉ có kênh Nội bộ) | Thêm quy tắc: FOC 100% một đêm → `is_complimentary=true`, doanh thu 0. Giảm một phần → doanh thu đêm sau giảm, vẫn là đêm bán. Khớp FB-02 |
| D-8 | S11 dựa vào `UserSession` (bị xóa khi hết hạn) và `AuditLog` (chỉ thao tác ghi) | Đổi nguồn S11 sang `user_activity_day` (FB-10) |
| D-9 | Mục 9 ghi `RoomBlock.type` (OOO / có kế hoạch), không khớp mô hình trạng thái SM-02 | Đổi theo ERD: đêm OOO dùng `status IN (active, released)` và `[start_date, coalesce(end_date_actual, end_date_planned))`. Khối `cancelled` hoặc `planned` chưa kích hoạt thì không tính |
| D-10 | Mục 9 `Booking` chưa có `confirmed_at`, `status_before_cancel`, `ota_booked_at` | Bổ sung (khớp FB-05) |

---

## D. Điểm làm tốt

1. **Bảng `stay_night` là bảng vật lý, cập nhật trong cùng giao dịch, kèm bảng quy tắc sinh theo từng sự kiện (mục 8).** Bảng có giữ đêm `void` để truy vết, snapshot `channel_id` và `stay_type`, và chỉ mục theo `stay_date`. Đây đúng là nền móng để tránh lặp lỗi BL #8, #22 ở tầng báo cáo. Ánh xạ DATA → ERD (mục 13.2) rõ, đọc là đối chiếu được ngay.
2. **Chống trùng bằng `room_occupancy` + `EXCLUDE USING gist`, kèm cách biểu diễn đơn OTA xung đột không phá ràng buộc** (mục 7). Nhờ vậy S1a đo được và có thể cam kết bằng 0. Việc tách S1a/S1b trong MD có chỗ dựa kỹ thuật thật.
3. **Kênh và loại lưu trú tách hai cột** (`channel_id` + `channel_group` và `stay_type`), có lịch sử tỷ lệ hoa hồng theo hiệu lực, `booked_*` để tính pickup, và tham số có hiệu lực theo ngày (không UPDATE quá khứ). Thiết kế này đúng tinh thần snapshot của Q-14 và BR-006.
