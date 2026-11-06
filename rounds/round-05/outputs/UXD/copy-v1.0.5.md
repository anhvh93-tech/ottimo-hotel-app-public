# Bảng chữ v1.0.5 – Gói 2 "Chữ và tham số theo bảng giá 01/11"

- Lập: UXD · Round 5 – Sản xuất · 06/11/2026 · Bản 1.0 (chờ review).
- Phạm vi: V5-20, V5-21 (phần chữ), V5-22 (phần chữ), V5-23, V5-24 của `rounds/round-05/plan.md`.
- Căn cứ:
  - mã `main` @ `b9f017f7` (06/11). Số dòng ghi trong bảng là vị trí tại commit đó;
  - `product/docs/tham-so-quy-tac.md` / `.json` bản 1.1 (DOM);
  - `rounds/round-04/outputs/DOM/pricing-spec-2026-11-01-reconcile.md` (H10), `inv-price-switch-guide.md` (B1–B11);
  - các thẻ nguồn ghi ở cột "Nguồn".
- Thương hiệu: chữ Desk nội bộ viết tiếng Việt, có bản EN cho Desk tiếng Anh. Chữ cho khách (trang khách, phiếu, mẫu tin, báo giá) ngắn, lịch sự, điềm tĩnh, không emoji, không từ cấm. Bảng này không đổi màu, font hay khoảng cách. Riêng V5-24 có một yêu cầu font cho FE (mục 5.2).
- Không có số hoa hồng, không có dữ liệu khách trong tệp này.

## Quy ước

- **Nguồn chữ duy nhất** là `product/design/tools/gen_strings.py`. FE sửa ở đó, chạy lại công cụ để sinh `strings-{vi,en,ru}.json`, `strings.js`, `strings-tables.md`. Với `sale.quote_text` thì chạy thêm `services/api/scripts/gen-quote-copy.mjs`. CI "Copy is generated" phải xanh.
- **Kiểu đổi**:
  - **Sửa**: giữ khóa, đổi chữ.
  - **Mới**: thêm khóa.
  - **Xóa**: bỏ khóa sau khi FE bỏ chỗ dùng và sửa test.
  - **FE**: chữ giữ nguyên, chỉ đổi cách mã truyền biến hoặc lúc hiện câu.
- **Biến** `{x}` theo `interpolate` của `packages/i18n`. Thiếu biến thì chữ `{x}` hiện nguyên trên màn hình, nên mọi biến ghi trong bảng là **bắt buộc truyền**.
- **Số nhiều**: khóa có hậu tố `_one`, `_few`, `_many`, `_other` chọn bằng `pluralForm(locale, n)`, giống `sale.quote_nights_*`. VI và RU của Desk dùng chung một chữ. EN có hai dạng.
- **Gạch không ngắt**: trong EN, cụm số–chữ ("1‑month", "2‑step") dùng U+2011 (content-guide mục 2, v0.4.5).
- Cột RU chỉ có ở chuỗi cho khách. Desk chỉ có VI và EN.
- **Nguyên tắc của gói này**: chữ phải đúng với **mọi giá trị tham số đang cho phép**, không chỉ với mức đội đề xuất. Số nào lấy từ tham số thì đọc từ tham số. Không đọc được thì viết câu không có số. Lý do: production vẫn đang lệch sổ tay (từ điển mục "Tham số trên production lệch sổ tay": `los_discount` còn bậc, `long_stay_required_from_nights` < 30, `special_uplift_pct` > 0).

## 0. Tóm tắt số khóa

| Việc | Sửa | Mới | Xóa | Cộng | Ghi chú |
|---|---:|---:|---:|---:|---|
| V5-20 Bỏ chữ theo mức giá cũ | 12 | 5 | 5 | **22** | Thêm 3 chỗ chỉ đổi cách hiện (FE) |
| V5-21 Tham số trên Desk | 1 | 38 | 0 | **39** | Gồm 29 tên `params.k.*` |
| V5-22 Hộp Đặt phòng mới | 2 | 6 | 0 | **8** | |
| V5-23 Chữ sai sự thật | 41 | 22 | 4 | **67** | Gồm 25 khóa EN thêm U+2011. 3 khóa ở mục 4.19 là phát hiện thêm, PO quyết |
| V5-24 Tiếng Nga | 7 | 0 | 0 | **7** | Chỉ cột RU. Kèm yêu cầu font (mục 5.2) |
| **Tổng** | **63** | **71** | **9** | **143** | |

Chỗ cần CPY duyệt trước khi FE áp: mục 7. Yêu cầu cho FE, BE: mục 6.

---

## 1. V5-20 – Bỏ chữ theo mức giá cũ

Nguồn chung: H10 (`pricing-spec-2026-11-01-reconcile.md`), FB-R4-UXD-FE-PR82-02, FB-R4-ARC-FE-PR82-02, UXD-on-v104-pr72-manual lượt 2, FB-R4-UXD-BA-PR85-02.

### 1.1 Ngưỡng thuê dài hạn ("Từ 28 đêm…")

| Khóa | Kiểu | Chữ cũ | Chữ mới VI | Chữ mới EN | Lý do |
|---|---|---|---|---|---|
| `field.LONG_STAY_REQUIRES_CONTRACT` | Sửa | Từ 28 đêm là thuê dài hạn – tạo đơn dài hạn nhập tay. | Từ {n} đêm là thuê dài hạn – tạo đơn dài hạn nhập tay. | {n} nights or more is a long stay – create a manual long-stay booking. | Số 28 viết cứng. `{n}` = `rules.longStayFromNights` (tham số `long_stay_required_from_nights`) |
| `bk.long_body` | Sửa | Từ 28 đêm phải làm hợp đồng (BR-108). Ở giai đoạn này, tạo "Đơn dài hạn nhập tay" để giữ phòng; hợp đồng vẫn làm ngoài hệ thống. | Từ {n} đêm phải làm hợp đồng (BR-108). Tạo "Đơn dài hạn nhập tay" để giữ phòng; hợp đồng làm ngoài Desk. | From {n} nights a lease is required (BR-108). Create a "Manual long-stay booking" to hold the room; the lease is handled outside the Desk. | Số 28 viết cứng; bỏ "Ở giai đoạn này" (chữ nội bộ của đội). `{n}` như trên |
| `stay.long_hint` | Sửa | Khách muốn ở thêm hơn 7 đêm hoặc tổng từ 28 đêm: lập báo giá dài hạn (R3). Ở R2 tạo "đơn dài hạn nhập tay". | Khách muốn ở thêm quá số đêm gia hạn tối đa, hoặc tổng số đêm tới mức phải thuê dài hạn: tạo "Đơn dài hạn nhập tay". | The guest wants more than the maximum extension, or the total reaches the long-stay threshold: create a "Manual long-stay booking". | Hết số 7 và 28 viết cứng, hết "R2", "R3" (cũng là BUG-R3-028 a). Câu không có số, vì cờ `exceedsShortStayLimit` bật theo 2 tham số (`extension_max_nights`, `long_stay_required_from_nights`; `stay.service.ts:219`) |

FE:
- QuoteDialog, khi lỗi `LONG_STAY_REQUIRES_CONTRACT` (dòng 393 và 584, `rsvErrorText`): truyền `n = rules.longStayFromNights`. Hiện mã truyền `n = ''`, nên câu mới sẽ ra "Từ  đêm".
- BookingDialog dòng 726 đã truyền đúng.
- `app/rules.ts`, `RULE_DEFAULTS` còn mức cũ (`longStayFromNights: 28`, `longStayCompareFromNights: 15`). Đổi theo mức đội đề xuất (30, 30). Hai số này chỉ dùng khi chưa tải được tham số, nhưng hiện chúng sẽ lọt vào câu.

### 1.2 "Trước giảm theo số đêm"

Trên production, đơn có thể **không** có mức giảm nào (bảng giá 01/11: `los_discount = []`). Cũng có thể có mức giảm theo số đêm (`los_discount` đang lệch) **hoặc** mức giảm của mã khách quay lại (BR-111, `return_guest_pct`). FolioDialog dòng 329 đặt `stepped = calendarRateVnd !== amountVnd`, nên chênh lệch có thể đến từ một trong hai mức giảm. Vì vậy:
- tiêu đề cột và chữ luôn hiện không nói "trước giảm";
- câu chỉ hiện khi có chênh thì nói "giảm giá của đơn", không gắn với số đêm.

| Khóa | Kiểu | Chữ cũ | Chữ mới VI | Chữ mới EN | Lý do |
|---|---|---|---|---|---|
| `rate.pre_tier` | Sửa | Giá lịch/đêm (trước giảm theo số đêm) | Giá đêm | Night rate | Tiêu đề cột bảng giá ở Đặt phòng mới (BookingDialog 1377, nhãn ô 1391). Cột này luôn hiện |
| `rate.pre_tier_short` | FE | giá lịch, trước giảm theo số đêm | (giữ) | (giữ) | Chỉ còn dùng ở BookingDialog 1502, nơi đã có điều kiện `losShown > 0` |
| `rate.calendar_short` | Mới | – | giá lịch | calendar rate | Thay `rate.pre_tier_short` ở 2 chỗ luôn hiện: CheckOutPage 1207 và StayDialogs 150 |
| `rate.prior_night_tier` | Sửa | Đây là giá lịch, trước giảm theo số đêm. Số cần thu ở mục Thu tiền do hệ thống tính, đã gồm giảm nếu có. | Đây là giá lịch của đêm. Số cần thu ở mục Thu tiền do hệ thống tính, đã trừ giảm giá nếu đơn có. | This is the night's calendar rate. The amount due under Payment is worked out by the system, less any discount on the booking. | Bỏ ý "giảm theo số đêm" (CheckInPage 842) |
| `checkout.extra_night_rate_help_tier` | Sửa | Giá lịch của đêm, trước giảm theo số đêm. Mặc định là giá gợi ý của hệ thống cho đêm này. Số cần thu do hệ thống tính, đã gồm giảm nếu có. | Giá lịch của đêm. Mặc định là giá gợi ý của hệ thống cho đêm này. Số cần thu do hệ thống tính, đã trừ giảm giá nếu đơn có. | The night's calendar rate. Defaults to the system's suggested rate for this night. The amount due is worked out by the system, less any discount on the booking. | Như trên (CheckOutPage 1562, 1569) |
| `folio.adjust_night_price` | Sửa | Giá đêm mới (trước giảm theo số đêm) | Giá đêm mới | New night rate | Nhãn ô ở hộp Sửa giá đêm (FolioDialog 493) |
| `folio.adjust_night_help` | Sửa | Giá lịch của đêm; giảm theo số đêm (BR-107) áp trên giá này. Ngoài sàn–trần của nhóm căn thì không lưu được – thấp hơn sàn thì xin giảm giá đặc biệt. | Giá lịch của đêm. Nếu đơn đang được giảm giá, mức giảm áp trên giá này. Ngoài sàn–trần của nhóm căn thì không lưu được; thấp hơn sàn thì xin giảm giá đặc biệt. | The night's calendar rate. If the booking has a discount, it applies on top of this rate. Outside the room group's floor–ceiling it can't be saved; below the floor, request a special discount. | Đúng cả khi không có giảm, khi giảm theo số đêm và khi giảm theo mã khách quay lại |
| `rate.night_now` | Sửa | Đêm này hiện tính {amount} sau giảm theo số đêm (giá lịch {calendar}). | Đêm này hiện tính {amount}, đã trừ giảm giá của đơn (giá lịch {calendar}). | This night is now {amount} after the booking's discount (calendar rate {calendar}). | Hiện khi `stepped`. Chênh có thể do mã khách quay lại |
| `rate.adjust_night_effect` | Sửa | Ghi bút toán đảo {old} và dòng mới theo giá lịch {new} – giảm theo số đêm áp lại khi lưu. Dòng cũ vẫn còn trong nhật ký (BR-008). | Ghi bút toán đảo {old} và dòng mới theo giá lịch {new}; giảm giá của đơn (nếu có) áp lại khi lưu. Dòng cũ vẫn còn trong nhật ký (BR-008). | Posts a reversal of {old} and a new line at the calendar rate {new}; any discount on the booking is applied again on save. The old line stays in the log (BR-008). | Như trên (FolioDialog 532) |
| `sale.los_applied` | Sửa | Đã giảm {pct}% vì ở từ 7 đêm (BR-107) | Đã giảm {pct}% theo số đêm ở (BR-107) | {pct}% length-of-stay discount applied (BR-107) | Số 7 viết cứng. Ngưỡng nằm trong `los_discount` và có thể có nhiều bậc. Khóa đã có điều kiện `losDiscountPct > 0` (BookingDialog 1510, QuoteDialog 617) |

Giữ nguyên, đã kiểm: `move.discount_los` (MovePreviewBox 146) và `extend.los_reprice` (StayDialogs 181). Cả hai có điều kiện `pct > 0` và không có số viết cứng.

### 1.3 Nguồn giá "+15 %"

| Khóa | Kiểu | Chữ cũ | Chữ mới | Lý do |
|---|---|---|---|---|
| `bk.src_weekend` | Xóa | Lịch giá: thứ Sáu/thứ Bảy +15% (BR-104) | – | App không dùng khóa này. Chỉ còn ở `hifi/09-booking.html` và test `v104-rate-source-typed.test.tsx`. Ô trong hi-fi đổi sang `bk.src_list`. Nếu sau này bật lại mức tăng, UXD cấp khóa có biến: "Lịch giá: cuối tuần +{pct}% (BR-104)", không viết số vào chữ |

### 1.4 Báo giá không tách đêm thứ Sáu, thứ Bảy (việc `sale.nights_all` trong plan)

Hiện tại, QuoteDialog 342–354 chia các đêm theo `weekend(date)` (thứ Sáu, thứ Bảy cố định ở client, không đọc `weekend_nights`), rồi lấy `rate` của **đêm đầu** mỗi nhóm. Hai nhóm "đêm thường" và "đêm thứ Sáu, thứ Bảy" có cùng giá khi mức tăng bằng 0. Còn khi một nhóm có ngày đặc biệt, "{n} đêm × {rate}" không bằng cột tổng.

Thiết kế mới: gom các đêm **theo số tiền** (`amountVnd`), không theo thứ trong tuần. Mỗi dòng là "{n} đêm × {giá}", cột phải là tổng của nhóm. Các nhóm xếp theo ngày đầu tiên của nhóm. Như vậy, với mọi giá trị của `weekend_uplift_pct`, `special_uplift_pct`, `weekend_nights`, ta luôn có n × giá = tổng.

| Khóa | Kiểu | VI | EN (`_one`) | EN (`_few`, `_many`, `_other`) |
|---|---|---|---|---|
| `sale.nights_at_rate_one` / `_few` / `_many` / `_other` | Mới (4) | {n} đêm × {rate} | {n} night × {rate} | {n} nights × {rate} |
| `sale.nights_weekday` | Xóa | {n} đêm thường × {rate} | – | – |
| `sale.nights_weekend` | Xóa | {n} đêm thứ Sáu, thứ Bảy × {rate} | – | – |

`{rate}` định dạng như hiện tại (`vnd()`).

### 1.5 Giờ trả phòng và câu cũ không còn dùng

| Khóa | Kiểu | Chữ cũ | Chữ mới VI | Chữ mới EN | Lý do |
|---|---|---|---|---|---|
| `stay.after_noon_hint` | Sửa | Giờ sau 12:00 là trả muộn – dùng nút Trả muộn để tính phụ thu. | Giờ sau {time} là trả muộn – dùng nút Trả muộn để tính phụ thu. | Times after {time} are late check-outs – use Late check-out to calculate the fee. | Mã đã so với `rules.checkoutTime` (StayDialogs 828), nhưng chữ viết cứng 12:00. `{time}` = `rules.checkoutTime` |
| `extend.keep_rate_help` | Xóa | Đơn đang có giá thỏa thuận khác lịch giá… ngày đặc biệt theo giá ngày đó. | – | – | Không mã nào dùng |
| `co.late_switch_hint` | Xóa | Khách trả sau 12:00 mà chưa hẹn… | – | – | Không mã nào dùng; đã có `co.late_switch_hint_time` thay |

Giữ: `late.std_zero` ("Trả trước 12:00 – không phụ thu"). App không dùng khóa này, chỉ prototype `hifi.js` dùng. Ghi chú trong `gen_strings.py`: "chỉ prototype, không dùng ở app".

### 1.6 Đổi số người thì bảng tổng tính lại (FB-R4-ARC-FE-PR82-02)

Không có khóa mới. FE:
- thêm số người lớn và số trẻ vào khóa bản xem (`totalsKey` / `liveKey`), để đổi số người cũng gọi lại bản xem;
- trong lúc chờ, các ô tiền của bảng tổng hiện "–", bảng có `aria-busy="true"`. Đây cũng là phần còn lại của FB-R4-UXD-FE-PR70-02 (mục 3);
- nút Tạo đơn **không** khóa riêng vì đổi số người. Nút đã chờ theo bản xem như hiện tại, và tiền do máy chủ tính.

---

## 2. V5-21 – Tham số trên Desk (phần chữ)

Nguồn: H10 (`params.k.*`), backlog 5.6b, plan mục 6 (`ota_base_rate` thu gọn), từ điển tham số bản 1.1, `paramCatalog.ts`, `ParamDialog.tsx`, `app/problem.ts`, `parameter-rules.ts`, `parameter.service.ts`.

### 2.1 Tên tiếng Việt cho khóa còn hiện mã

`paramLabel()` tìm `params.k.<khóa, dấu chấm đổi thành _>`. Chỉ cần thêm khóa chữ là tên hiện ngay, mã khóa vẫn hiện nhỏ bên dưới. Tên lấy từ trường "Ý nghĩa" của từ điển, rút gọn cho cột Tham số. Đơn vị đứng sau giá trị, nên không lặp trong tên, trừ chỗ cần nói rõ "% của giá nào".

FE: thêm các khóa dưới đây vào `KNOWN` của `paramCatalog.ts` với **nhóm `other`** (giữ nhóm "Khác" như hiện tại, để từ điển và sổ tay vẫn đúng câu "tab Khác") và đơn vị ở cột "Đơn vị Desk". Đơn vị `nights` là đơn vị mới (mục 2.2).

| Khóa tham số | Khóa chữ (Mới) | VI | EN | Đơn vị Desk | Ưu tiên |
|---|---|---|---|---|---|
| `weekend_uplift_pct` | `params.k.weekend_uplift_pct` | Tăng giá đêm cuối tuần | Weekend night uplift | pct | B1 |
| `weekend_nights` | `params.k.weekend_nights` | Đêm tính là cuối tuần | Nights counted as weekend | none | đi kèm B1 |
| `weekend_uplift_channels` | `params.k.weekend_uplift_channels` | Kênh áp tăng giá cuối tuần | Channels with weekend uplift | none | đi kèm B1 |
| `special_uplift_pct` | `params.k.special_uplift_pct` | Tăng giá ngày đặc biệt | Special-date uplift | pct | B2 |
| `special_dates` | `params.k.special_dates` | Danh sách ngày đặc biệt | Special dates | none | đi kèm B2 |
| `special_uplift_channels` | `params.k.special_uplift_channels` | Kênh áp tăng giá ngày đặc biệt | Channels with special-date uplift | none | đi kèm B2 |
| `los_discount` | `params.k.los_discount` | Giảm giá theo số đêm ở | Length-of-stay discount | none | B3 |
| `long_stay_required_from_nights` | `params.k.long_stay_required_from_nights` | Bắt buộc thuê dài hạn từ | Long-stay lease required from | nights | B4 |
| `short_stay_max_nights` | `params.k.short_stay_max_nights` | Đơn ngắn ngày dài nhất | Longest short stay | nights | B5 |
| `ota_base_rate` | `params.k.ota_base_rate` | Giá gốc riêng cho đơn OTA | Separate OTA base rate | none | B6 (mục 2.4) |
| `early_checkin_tiers` | `params.k.early_checkin_tiers` | Bậc phụ thu nhận phòng sớm | Early check-in fee tiers | none | B7 |
| `long_stay_compare_from_nights` | `params.k.long_stay_compare_from_nights` | Hiện so sánh thuê 1 tháng từ | Show 1‑month comparison from | nights | B9 |
| `rounding.monthly_rent` | `params.k.rounding_monthly_rent` | Làm tròn tiền thuê tháng | Monthly rent rounding | vnd | B11 |
| `rounding.night_rate` | `params.k.rounding_night_rate` | Làm tròn giá đêm | Night rate rounding | vnd | rounding.* |
| `rounding.deposit` | `params.k.rounding_deposit` | Làm tròn tiền cọc | Deposit rounding | vnd | rounding.* |
| `rounding.fee` | `params.k.rounding_fee` | Làm tròn phí, phụ thu | Fee rounding | vnd | rounding.* |
| `rounding.ota_rate` | `params.k.rounding_ota_rate` | Làm tròn giá đêm đơn OTA | OTA night rate rounding | vnd | rounding.* (lệch mới, từ điển mục B) |
| `late_checkout_tiers` | `params.k.late_checkout_tiers` | Bậc phụ thu trả phòng muộn | Late check-out fee tiers | none | bảng giá |
| `rate_floor_pct` | `params.k.rate_floor_pct` | Giá sàn (% giá gốc) | Rate floor (% of base rate) | pct | bảng giá |
| `rate_ceiling_pct` | `params.k.rate_ceiling_pct` | Giá trần (% giá gốc) | Rate ceiling (% of base rate) | pct | bảng giá |
| `min_stay` | `params.k.min_stay` | Ở tối thiểu | Minimum stay | none | bảng giá |
| `min_stay_orphan_night_exception` | `params.k.min_stay_orphan_night_exception` | Cho bán đêm lẻ kẹp giữa hai đơn | Allow single gap nights between bookings | none | bảng giá |
| `booking_window_days` | `params.k.booking_window_days` | Nhận đặt trước tối đa | Booking window | days | bảng giá |
| `return_guest_code` | `params.k.return_guest_code` | Mã khách quay lại | Returning-guest code | none | bảng giá |
| `return_guest_pct` | `params.k.return_guest_pct` | Giảm cho khách quay lại | Returning-guest discount | pct | bảng giá |
| `stackable` | `params.k.stackable` | Cộng dồn mã khách quay lại với giảm theo số đêm | Combine returning-guest code with length-of-stay discount | none | bảng giá |
| `prices_include_vat` | `params.k.prices_include_vat` | Giá niêm yết đã gồm VAT | Listed prices include VAT | none | bảng giá |
| `public_show_prices` | `params.k.public_show_prices` | Hiện giá ước tính trên web | Show estimated prices on the website | none | bảng giá |
| `web_estimate.open_until` | `params.k.web_estimate_open_until` | Web hiện giá cho đêm trước ngày | Website shows prices for nights before | none | bảng giá |

Đã có tên, không đổi: B8 `child_fee_6_11` (`params.extra_child`), B10 `short_stay_commission_pct`, `extra_adult_fee`, `child_free_under_age`, `adult_from_age`, `short_stay_deposit_pct`, `late_grace_until`, `vat_rate`.

Ghi chú về tên:
- `weekend_uplift_pct` đổi so với tên UXD đề xuất ở lượt 2 PR72 ("Tăng giá đêm thứ Sáu, thứ Bảy"). Lý do: những đêm nào là cuối tuần do `weekend_nights` quyết, nên tên có "thứ Sáu, thứ Bảy" sẽ sai khi tham số đó đổi. BA cập nhật sổ tay theo tên mới (V5-71).
- `rate_floor_pct` / `rate_ceiling_pct`: giữ "(% giá gốc)" trong tên, vì Desk chỉ hiện "70%" ở cột Giá trị, không nói % của giá nào.
- Sau khi FE áp, DOM thay "(chưa có tên tiếng Việt)" trong từ điển bằng tên ở bảng này.

### 2.2 Đơn vị mới

| Khóa | Kiểu | VI | EN | Dùng |
|---|---|---|---|---|
| `params.unit_nights` | Mới | đêm | nights | `ParamUnit` thêm `'nights'`, `UNIT_KEY.nights`. Cột Giá trị ra "30 đêm" |

### 2.3 Câu lỗi khi lưu tham số

Hiện tại `problemView` chỉ có 2 nhánh:
- có `allowed` thì dùng `error.PARAM_OUT_OF_RANGE` ("nằm ngoài **khoảng** cho phép. Chọn một trong: …");
- không có `allowed` thì dùng `error.PARAM_OUT_OF_RANGE_MINMAX` ("Giá trị phải từ {min} đến {max}.").

Máy chủ trả 422 `PARAM_OUT_OF_RANGE` với 6 dạng `extras`: `{allowed}` (tập số, như `rounding.*`, `vat_rate`; hoặc tập chữ, như `privacy_notice_version`), `{min, max}`, chỉ `{max}`, chỉ `{min}`, `{}` (sai cấu trúc, như `hold_hours_options` thiếu mức mặc định hay danh mục FOC sai dạng), và `{allowed, min, max}` (chỉ `ota_base_rate`). Vì vậy:
- với giá trị chữ hoặc tập giá trị, "khoảng" là sai;
- với 3 dạng sau, lễ tân thấy nguyên chữ `{min}` hoặc `{max}`.

Ngoài ra, ParamDialog (dòng 128, 137) báo `field_error.not_in_list` ("Chọn một giá trị trong danh sách.") khi gõ số sai dạng hoặc JSON sai, trong khi ô này không có danh sách nào. Giá trị chữ (ví dụ `deposit_base`) nằm trong ô JSON. Nếu bỏ dấu ngoặc kép, người sửa sẽ gặp đúng câu sai này. Ô giờ gõ sai dạng thì báo `common.required`.

| Khóa | Kiểu | Chữ cũ | Chữ mới VI | Chữ mới EN | Khi nào |
|---|---|---|---|---|---|
| `error.PARAM_OUT_OF_RANGE` | Sửa | Giá trị này nằm ngoài khoảng cho phép. Chọn một trong: {allowed}. | Giá trị này không có trong danh sách cho phép. Chọn một trong: {allowed}. | This value isn't one of the allowed values. Choose one of: {allowed}. | Chỉ có `allowed` (tập số hoặc tập chữ) |
| `error.PARAM_OUT_OF_RANGE_MINMAX` | (giữ) | Giá trị phải từ {min} đến {max}. | (giữ) | (giữ) | Có cả `min` và `max` |
| `error.PARAM_OUT_OF_RANGE_MAX` | Mới | – | Giá trị này vượt mức cho phép ({max}). | This value is above the allowed limit ({max}). | Chỉ có `max`. Cặp giờ, sàn ≤ trần, FOC mỗi lần ≤ mỗi tháng, `session_policy` |
| `error.PARAM_OUT_OF_RANGE_MIN` | Mới | – | Giá trị này dưới mức cho phép ({min}). | This value is below the allowed limit ({min}). | Chỉ có `min` |
| `error.PARAM_OUT_OF_RANGE_SHAPE` | Mới | – | Giá trị này chưa đúng dạng, hoặc chưa khớp với tham số đi kèm. | This value isn't in the right format, or doesn't fit a related setting. | `extras` rỗng |
| `error.PARAM_OUT_OF_RANGE_GROUPS` | Mới | – | Cần đủ các nhóm căn ({allowed}), mỗi nhóm một giá đêm từ {min} đến {max}. | Enter every room group ({allowed}), each with a night rate from {min} to {max}. | Có `allowed` cùng `min`/`max` (`ota_base_rate`) |
| `params.err_number` | Mới | (dùng `field_error.not_in_list`) | Nhập số, không kèm chữ hay đơn vị. | Enter a number, without letters or units. | ParamDialog 128, ô số gõ sai dạng |
| `params.err_json` | Mới | (dùng `field_error.not_in_list`) | Chưa đúng dạng JSON. Chữ phải nằm trong dấu ngoặc kép, ví dụ "all"; giữ đủ dấu ngoặc của danh sách. | This isn't valid JSON. Put text in double quotes, for example "all", and keep every bracket of the list. | ParamDialog 137, `JSON.parse` lỗi |
| `params.err_time` | Mới | (dùng `common.required`) | Nhập giờ dạng hh:mm, ví dụ 14:00. | Enter a time as hh:mm, for example 14:00. | ParamDialog, ô giờ có chữ nhưng sai dạng. Ô trống vẫn báo `common.required` |

FE (`app/problem.ts`, nhánh `PARAM_OUT_OF_RANGE`), chọn câu theo thứ tự:
1. có `allowed` và (`min` hoặc `max`): `_GROUPS`;
2. chỉ có `allowed`: `error.PARAM_OUT_OF_RANGE`;
3. có `min` và `max`: `_MINMAX`;
4. chỉ có `max`: `_MAX`;
5. chỉ có `min`: `_MIN`;
6. không có gì: `_SHAPE`.

Cách định dạng:
- số theo `vi-VN` (1.000, 100.000);
- tham số đơn vị `vnd` dùng `money()` (có "đ");
- giờ và chữ giữ nguyên;
- `allowed` nối bằng ", " như `argsFor` hiện tại.

`field_error.not_in_list` giữ cho các chỗ đúng nghĩa. GuestFormDialog 232 cũng dùng câu này cho ngày sinh: ngoài phạm vi gói này, ghi để FE xem.

### 2.4 `ota_base_rate`: tên và câu "Không cần nhập"

Không làm trình nhập theo nhóm căn (quyết định PO, plan mục 6). Chỉ thêm tên (mục 2.1) và một câu ghi chú.

| Khóa | Kiểu | VI | EN | Chỗ hiện |
|---|---|---|---|---|
| `params.ota_base_rate_note` | Mới | Không cần nhập – không có giá trị thì đơn OTA lấy giá đêm niêm yết của căn. Đã có giá trị thì giá trị này được dùng thay giá niêm yết, nên mỗi lần đổi giá căn phải sửa cùng lúc. | No need to enter this – without a value, OTA bookings use the room's listed night rate. If a value exists, it is used instead of the listed rate, so update it whenever room prices change. | ParamsPage: dòng chữ phụ dưới tên (cùng kiểu `muted` với mã khóa). ParamDialog: `Alert tone="info" role="note"` trên ô giá trị, chỉ khi `key === 'ota_base_rate'` |

Câu có 2 vế vì `pricing.service.ts` dùng `groupBase ?? listPriceOn`: có dòng giá trị thì dòng đó **thắng** giá niêm yết. Từ điển ghi cùng ý ("Có dòng thì mỗi lần đổi giá căn phải đổi dòng này cùng lúc"). Câu ngắn "Không cần nhập – đơn OTA lấy giá đêm niêm yết" trong plan chỉ đúng khi chưa có dòng, nên UXD thêm vế sau.

---

## 3. V5-22 – Hộp Đặt phòng mới (phần chữ)

Nguồn: BUG-R4-040, FB-R4-UXD-FE-PR70-02/03/04/06 (`rounds/round-04/reviews/UXD-on-v104-pr70-rate-carryover.md`). Chữ VI/EN đã soạn trong các thẻ đó, ở đây chép lại làm bảng áp. `bk.src_typed` ("Giá đã gõ") đã có từ #82.

| Khóa | Kiểu | Chữ cũ | Chữ mới VI | Chữ mới EN | Chỗ dùng |
|---|---|---|---|---|---|
| `bk.rate_help_ota` | Mới | – | Gõ giá từng đêm theo extranet. Để trống mọi đêm thì Desk tính theo lịch giá OTA của kênh. | Enter each night's rate from the extranet. Leave every night empty to use the channel's OTA calendar rate. | `.help` dưới bảng giá, chỉ khi kênh OTA (PR70-03) |
| `bk.src_ota_calendar` | Mới | – | Lịch giá OTA | OTA calendar | Cột Nguồn giá, đêm OTA chưa gõ; và ô số của hộp "Đổi sang căn …" khi chưa gõ (PR70-04) |
| `booking.error.rate_partial_ota` | Mới | (dùng `booking.error.rate_empty`) | Gõ giá cho mọi đêm, hoặc để trống hết để lấy giá theo lịch OTA. | Enter a rate for every night, or leave them all empty to use the OTA calendar rate. | `errors.rates`, OTA gõ thiếu đêm |
| `booking.error.rate_missing` | Mới | (dùng `booking.error.rate_empty`) | Gõ giá cho các đêm còn trống. | Enter a rate for the empty nights. | `errors.rates`, Trực tiếp/CTV còn đêm trống |
| `bk.use_room_ota_calendar` | Mới | (hiện "0 đ") | Chưa gõ giá: Desk tính theo lịch giá OTA của kênh khi tạo đơn. | No rates entered: the booking uses the channel's OTA calendar rate. | Thay dòng "Tổng tiền đơn" ở hộp "Đổi sang căn …" khi đơn OTA chưa gõ giá. Không bao giờ hiện "0 đ" ở ca này (PR70-04) |
| `booking.error.rate_range` | Sửa | Giá phải từ {min} đến {max} (giá sàn – trần nhóm {group}). | Giá phải từ {min} đến {max} (sàn–trần của nhóm căn). | Rate must be between {min} and {max} (the room group's floor–ceiling). | BookingDialog 717–722. Bỏ `{group}`, vì mã truyền `group: ''` nên câu bị cụt |
| `error.RATE_OUT_OF_RANGE` | Sửa | Giá phải từ {min} đến {max} (giá sàn – trần nhóm {group}). | Giá phải từ {min} đến {max} (sàn–trần của nhóm căn). | Rate must be between {min} and {max} (the room group's floor–ceiling). | Lỗi cấp Problem khi tạo đơn (`reservations.service.ts` 739–743). Bỏ `{group}` (PR70-06 = BUG-R4-040) |
| `booking.error.rate_out_of_range_dates` | Mới | – | Giá đêm {dates} nằm ngoài khoảng sàn–trần của nhóm căn. Sửa lại giá đêm đó. | The rate for {dates} is outside the room group's floor–ceiling range. Change that night's rate. | Dự phòng khi Problem không có `min`/`max`. `{dates}` dạng dd/mm, nối ", " |

FE, BE:
- BE gửi `min`, `max` (sàn và trần của đêm đầu tiên bị lỗi) theo hợp đồng ARC 0.3.13, kèm `dates` như hiện tại.
- FE định dạng `{min}` và `{max}` bằng `money()`.
- Thiếu `min` hoặc `max` thì FE dùng `booking.error.rate_out_of_range_dates`, không bao giờ để lộ `{min}`.
- Câu lỗi dưới bảng giá (`errors.rates`) gắn `role="alert"` (ghi chú ở lần review lại PR70 @ 94a28258). Khi có `errors.rates`, gắn `aria-invalid` cho từng ô trống.
- PR70-02, phần còn lại: khi `priceWaiting`, cột Nguồn giá và các ô tiền ở bảng tổng hiện "–", có `aria-busy`. Gộp với mục 1.6 (số người).

---

## 4. V5-23 – Một lượt sửa chữ sai sự thật

### 4.1 Phí trả sớm báo trong ngày rời (FB-R4-DOM-UXD-PR89-02)

Dòng phiếu này là chữ khách cầm, nên CPY duyệt (mục 7).

| Khóa | Kiểu | Chữ cũ | Chữ mới VI | Chữ mới EN |
|---|---|---|---|---|
| `bill.line.early_departure_fee_same_day` | Mới | (ra "báo trước 0 ngày") | Phí trả phòng sớm (báo trong ngày rời) | Early departure fee (same-day notice) |
| `bill.line.early_departure_fee_notice_one` | Mới | – | Phí trả phòng sớm (báo trước {noticeDays} ngày) | Early departure fee ({noticeDays} day's notice) |
| `bill.line.early_departure_fee_notice_other` | Mới | – | Phí trả phòng sớm (báo trước {noticeDays} ngày) | Early departure fee ({noticeDays} days' notice) |
| `bill.line.early_departure_fee_notice` | Xóa | Phí trả phòng sớm (báo trước {noticeDays} ngày) / ({noticeDays} days' notice) | – | – |

FE (`app/folio.ts`, `VARIANT` và `lineLabel`) chọn khóa như sau:
- `noticeDays` là `null` hoặc rỗng: khóa gốc `bill.line.early_departure_fee` (giữ như hiện tại, kể cả đơn OTA);
- `noticeDays === 0`: `_same_day`;
- `noticeDays > 0`: `_notice_` + `pluralForm`.

### 4.2 BUG-R2-094 – Ô tìm người đi cùng mang nhãn "Khách đứng tên"

| Khóa | Kiểu | VI | EN | Chỗ dùng |
|---|---|---|---|---|
| `stay.companion_field` | Mới | Người đi cùng | Companion | StayDialogs 1373, thay `booking.field.guest` ở hộp Thêm người đi cùng. Cũng là BUG-R3-028 (b) |

### 4.3 BUG-R2-096 – Câu "phí phạt" hiện cho mọi khoản

| Khóa | Kiểu | Chữ cũ | Chữ mới VI | Chữ mới EN |
|---|---|---|---|---|
| `stay.charge_default` | Sửa | Giá mặc định {amount} theo {rule}. Phí phạt không tính vào doanh thu phòng. | Giá mặc định {amount} theo {rule}. | Default price {amount} per {rule}. |
| `stay.charge_penalty_note` | Mới | – | Phí phạt không tính vào doanh thu phòng. | Fines don't count as room revenue. |

FE: ghép `stay.charge_penalty_note` sau `stay.charge_default` (StayDialogs 755), chỉ khi `item.category === 'penalty'`. DOM xác nhận có cần hiện cho `damage` không. Mặc định là không.

### 4.4 BUG-R2-098 – Hộp nhập lại mật khẩu ghi "xem giấy tờ" khi xem số tài khoản

`StepUpDialog` (`stay/common.tsx`) dùng chung cho xem giấy tờ (RegistrationPage, DocsPanel) và xem đủ số tài khoản nhận hoàn (MoneyPage, `getRefundDestination`, có `x-c3-log`). Câu "15 phút" viết cứng, trong khi `c3_stepup_minutes` cho phép từ 1 đến 15.

| Khóa | Kiểu | Chữ cũ | Chữ mới VI | Chữ mới EN |
|---|---|---|---|---|
| `ci.stepup_body` | Sửa | Xem đủ số và ảnh giấy tờ được ghi vào nhật ký truy cập. Nhập lại mật khẩu của bạn – có hiệu lực 15 phút trên máy này. | Xem đủ số và ảnh giấy tờ được ghi vào nhật ký truy cập. Nhập lại mật khẩu của bạn. Quyền xem chỉ giữ trong thời gian ngắn trên máy này. | Viewing full ID numbers and photos is recorded in the access log. Re-enter your password. Access lasts only a short time on this device. |
| `stepup.title_account` | Mới | (dùng `ci.stepup_title` "Xác nhận lại để xem giấy tờ") | Xác nhận lại để xem đủ số tài khoản | Confirm again to view the full account number |
| `stepup.body_account` | Mới | (dùng `ci.stepup_body`) | Xem đủ số tài khoản nhận hoàn tiền được ghi vào nhật ký truy cập. Nhập lại mật khẩu của bạn. Quyền xem chỉ giữ trong thời gian ngắn trên máy này. | Viewing the full refund account number is recorded in the access log. Re-enter your password. Access lasts only a short time on this device. |
| `params.k.c3_stepup_minutes` | Sửa | Thời gian xem giấy tờ sau khi nhập lại mật khẩu | Thời gian xem giấy tờ, số tài khoản sau khi nhập lại mật khẩu | Viewing time for IDs and account numbers after re-entering password |

FE: `StepUpDialog` nhận thêm `purpose: 'id' | 'account'` (mặc định `'id'`). MoneyPage truyền `'account'`. `ci.stepup_title` giữ nguyên cho giấy tờ.

### 4.5 BUG-R2-100 – Cột Lý do hiện mã thô

Không đổi chữ. MoneyPage 303 đã dùng `auditReasonText`, và `app/auditReason.ts` đã ánh xạ `guest_changed_mind`, `found_other`, `minibar_recount`. QA xác nhận trên bản v1.0.5 rồi đóng.

### 4.6 BUG-R2-218 – Trang khách ghi "ngôn ngữ theo trình duyệt"

Câu cũ nói ngôn ngữ chọn theo trình duyệt. Thực tế ngôn ngữ trong hồ sơ khách (máy chủ gán theo quốc tịch, `guests.service.ts:233`) thắng trình duyệt (P-S4-10; `rounds/round-02/qa/r1-3-ui-run.md`). Câu mới không nói nguồn, chỉ nói điều luôn đúng. Chữ hướng khách, CPY duyệt (mục 7).

| Khóa | Kiểu | Chữ cũ | Chữ mới EN | Chữ mới VI | Chữ mới RU |
|---|---|---|---|---|---|
| `gw.lang_auto` | Sửa | EN: Language set from your browser – you can change it at the top. · VI: Ngôn ngữ theo trình duyệt của bạn – bạn có thể đổi ở đầu trang. · RU: Язык выбран по настройкам браузера – его можно сменить вверху. | You can change the language at the top of the page. | Bạn có thể đổi ngôn ngữ ở đầu trang. | Язык можно сменить вверху страницы. |

Chỗ dùng: GuestShell 66, HomePage 52 (khi khách chưa tự chọn ngôn ngữ). Ca `TC-L7-053` (`ui/guest-web.h18.spec.ts:293`) đang đánh dấu `test.fail` cho lỗi này. Khi chữ mới lên, QA bỏ đánh dấu và so bằng `tv('gw.lang_auto')`.

### 4.7 BUG-R3-028 – Chữ lộ "Round", nhãn sai, hạn báo giá

| Mục | Khóa | Kiểu | Chữ cũ | Chữ mới VI | Chữ mới EN |
|---|---|---|---|---|---|
| (a) | `co.invoice_r3` | Sửa | Hóa đơn điện tử phát hành từ Round 3; R2 lưu thông tin để kế toán xuất. | Desk chưa xuất hóa đơn điện tử. Thông tin được lưu để kế toán xuất. | OTTIMO Desk doesn't issue e-invoices yet. The details are saved for accounting to issue. |
| (a) | `ci.door_title` | Sửa | Mã cửa – nhập tay trên app khóa (R2) | Mã cửa – nhập tay trên app khóa | Door code – entered manually in the lock app |
| (a) | `ci.door_not_stored` | Sửa | OTTIMO không lưu mã cửa ở R2. Khi trả phòng hoặc đổi phòng, hệ thống tạo việc "Xóa mã trên app khóa". | OTTIMO không lưu mã cửa. Khi trả phòng hoặc đổi phòng, hệ thống tạo việc "Xóa mã trên app khóa". | OTTIMO doesn't store door codes. On check-out or room change, the system creates a "Delete code in lock app" task. |
| (a) | `co.effect_door` | Sửa | Tạo việc "Xóa mã trên app khóa" cho căn {room} (R2 nhập tay). | Tạo việc "Xóa mã trên app khóa" cho căn {room}. | A "Delete code in lock app" task is created for room {room}. |
| (a) | `stay.door_manual` | Sửa | Giao tay trên app khóa – không lưu trong OTTIMO (R2) | Giao tay trên app khóa – không lưu trong OTTIMO | Handed over via the lock app – not stored in OTTIMO |
| (a) | `stay.late_door_manual` | Sửa | R2: kéo dài hiệu lực mã trên app khóa bằng tay. | Kéo dài hiệu lực mã trên app khóa bằng tay. | Extend the code's validity in the lock app manually. |
| (a) | `stay.long_hint` | (mục 1.1) | – | – | – |
| (b) | `stay.companion_field` | (mục 4.2) | – | – | – |
| (c) | `stay.agreed_time` | Mới | (dùng `checkout.departure_time` "Giờ trả phòng thực tế") | Giờ khách hẹn trả phòng | Agreed check-out time |
| (d) | `bk.room_help` | Sửa | (định mức/tối đa) – chỉ hiện căn đang bán và còn trống trong khoảng ngày | (định mức/tối đa). Căn đã có khách trong khoảng ngày sẽ được báo ngay dưới ô, kèm căn còn trống nếu có. | (standard/max guests). If a room is taken for these dates, a note below says so and suggests free rooms if there are any. |
| (e) | `sale.quote_expires` | Sửa | Hết hiệu lực {time} | Hiệu lực đến {time} | Valid until {time} |
| (f) | `rsv.list_empty_body_sales` | Mới | (dùng `rsv.list_empty_body` "…Bấm Đặt phòng mới để tạo đơn.") | Đơn bạn tạo sẽ hiện ở đây. Tạo đơn từ mục Báo giá & giữ chỗ. | Bookings you create will show here. Create one from Quotes & holds. |

FE:
- (c) StayDialogs 881, hộp Xác nhận giờ trả (`today.confirm_time`): ô giờ dùng `stay.agreed_time`. Ô giờ ở màn Trả phòng vẫn dùng `checkout.departure_time`.
- (d) Danh sách căn luôn có đủ các căn. Khi căn bận, dòng phụ đổi thành lý do và các căn thay thế (BookingDialog 1022–1026). Câu mới tả đúng hành vi đó.
- (e) QuotesPage 443 và QuoteDialog 736: truyền `{time}` = `expiresAt − 1 phút`, định dạng "HH:mm dd/MM/yyyy". Đây là cùng phút với tin gửi khách ("hiệu lực đến 23:59 …", `quotes.service.ts:365`).
- (f) ReservationsPage 156: vai sale nội bộ và CTV (trang "Đơn của tôi", không có nút Đặt phòng mới) dùng `rsv.list_empty_body_sales`. Vai lễ tân giữ `rsv.list_empty_body`.
- (g) Hộp Báo đã chuyển cọc đã định dạng số (`ReservationDialogs.tsx` 1815, `vnd()`). QA xác nhận rồi đóng mục (g).
- `co.qr_account`, `gw.cap_*` chỉ còn trong prototype hi-fi, không đổi.

### 4.8 BUG-R3-035 – Phiếu ghi "Phụ thu trả muộn (00:15)" cho khoản bằng 1 đêm

Chữ khách cầm, CPY duyệt (mục 7).

| Khóa | Kiểu | VI | EN |
|---|---|---|---|
| `bill.line.late_fee_as_night` | Mới | Phụ thu trả muộn bằng giá 1 đêm | Late check-out fee (one night's rate) |

BE-B (`folio/public/line-labels.ts`, case `late_checkout`): dòng có `chargeCode = 'late_fee_as_night'` trả `labelKey: 'bill.line.late_fee_as_night'`, không kèm `time`. Bỏ giờ khỏi dòng này vì khoản tính bằng giá một đêm, không theo giờ. Như vậy cũng hết ca "00:15" dễ đọc thành sáng của ngày dịch vụ. FE không cần sửa: `lineLabel` dùng `labelKey` khi `hasKey`.

### 4.9 BUG-R3-051 – Banner công tắc ghi "mở chat Zalo"

| Khóa | Kiểu | Chữ cũ | Chữ mới VI | Chữ mới EN |
|---|---|---|---|---|
| `webreq.form_off_body` | Sửa | Khách bấm Đặt phòng sẽ mở chat Zalo, nên yêu cầu mới chưa vào đây. Yêu cầu đã có vẫn xử lý bình thường. | Khách bấm Đặt phòng trên website sẽ thấy lời mời nhắn Zalo hoặc gọi điện, nên yêu cầu mới chưa vào đây. Yêu cầu đã có vẫn xử lý bình thường. | Guests who tap Book on the website are asked to message on Zalo or call instead, so new requests don't arrive here. Existing requests can still be handled. |

Chỗ dùng: WebRequestsPage 202. Câu đúng cho cả hai bản landing:
- landing có form: khách vẫn thấy form, chạm vào thì hiện "Online requests are paused… message us on Zalo or call…" (BUG-R3-051);
- landing chỉ có nút chat: khách được đưa sang Zalo.

Theo đúng câu mong đợi của QA.

### 4.10 BUG-R3-055 – Sau khi xóa theo yêu cầu, ghi sai lý do "theo hạn lưu"

| Khóa | Kiểu | VI | EN |
|---|---|---|---|
| `webreq.pii_erased` | Mới | Thông tin liên hệ đã xóa theo yêu cầu của người gửi ({date}). | Contact details were erased at the sender's request ({date}). |

FE: WebRequestDrawer 554 dùng `webreq.pii_erased` khi `declineReasonCode === 'erased_on_request'`. Các ca khác giữ `webreq.pii_purged`.

### 4.11 Ô sửa giá đêm của đơn Nội bộ

Chữ đã chốt ở decision-log 05/11 (UXD – chữ phụ ô A31 cho đêm Nội bộ), ở đây chép lại để áp.

| Khóa | Kiểu | VI | EN | Khi nào |
|---|---|---|---|---|
| `folio.adjust_night_help_internal` | Mới | Đêm của đơn Nội bộ: không áp sàn–trần. Miễn phí đêm này thì nhập 0 (quản lý, chủ đầu tư). | Internal stay night: no floor or ceiling. To make this night free, enter 0 (manager or owner). | Thay `folio.adjust_night_help` khi đêm thuộc đơn kênh Nội bộ. Vẫn ghép `rate.night_now` sau như hiện tại |
| `folio.adjust_night_empty_internal` | Mới | Nhập giá đêm. Miễn phí thì nhập 0. | Enter the night's rate. Enter 0 if it is free. | Thay `field_error.amount_not_positive` ở ô trống, cùng điều kiện |

Khi khóa lên, BA bỏ câu "Bỏ qua dòng chữ nhỏ dưới ô giá … Chữ cũ, sửa ở v1.0.5." trong sổ tay 2.5, `02` 5.1, `01` 14.1 (BA-reply-v104-pr72).

### 4.12 Khóa chung `error.INVALID_TRANSITION_generic` (UXD-F1-01)

`error.INVALID_TRANSITION` nói "Đơn vừa chuyển sang "{status}"…". Câu này chỉ đúng cho đơn đặt phòng có `status`. Ở trang Người dùng (UsersPage 188), mã 409 này không phải của đơn, và trang **tự tải lại**. Ở chỗ khác, trang không tự tải lại.

| Khóa | Kiểu | VI | EN | Khi nào |
|---|---|---|---|---|
| `error.INVALID_TRANSITION_generic` | Mới | Dữ liệu vừa thay đổi nên thao tác này không còn dùng được. Tải lại để xem các nút hiện có. | This just changed, so the action no longer applies. Reload to see what you can do now. | 409 `INVALID_TRANSITION` không phải của đơn, hoặc không có `status`, ở chỗ **không** tự tải lại |
| `error.INVALID_TRANSITION_generic_reloaded` | Mới | Dữ liệu vừa thay đổi nên thao tác này không còn dùng được. Danh sách đã tải lại. | This just changed, so the action no longer applies. The list has been reloaded. | Chỗ tự tải lại sau 409 (UsersPage) |

Thẻ F1 trước đây đề xuất câu "Đã tải lại…" cho mọi chỗ. Bảng này sửa lại thành 2 câu, vì chỉ UsersPage thật sự tải lại.

### 4.13 Đơn vị tiền trong `error.DEPOSIT_INSUFFICIENT` (UXD P440-06)

| Khóa | Kiểu | Chữ (giữ) | Việc của FE |
|---|---|---|---|
| `error.DEPOSIT_INSUFFICIENT` | FE | Chưa đủ cọc: cần {required}, đã ghi nhận {paid}. Ghi nhận thêm rồi xác nhận. | Truyền `{required}` và `{paid}` bằng `money()` (có "đ"), không dùng `vnd()`. Áp ở ReservationDialogs 757 và ở đường 422 qua `rsvErrorText`. Sửa test so chữ |

### 4.14 Hộp xanh "Gửi mã QR cho khách…" khi chưa có mã QR (GN-V104-QR-green-box)

QuoteDialog 773: hộp xanh luôn nói "Gửi mã QR cho khách", kể cả khi ngay dưới là câu đỏ `error.PAYMENT_NOT_CONFIGURED` ("Chưa cài tài khoản nhận chuyển khoản…") hoặc `dep.qr_failed`. Câu mới đúng cho cả hai ca. Câu nhắc giờ cũng thêm dạng số nhiều EN, vì `hold_expiry_reminder_hours` cho phép từ 0 đến 24 (sẽ có ca "1 hours").

| Khóa | Kiểu | VI | EN (`_one`) | EN (`_other`) | Khi nào |
|---|---|---|---|---|---|
| `sale.hold_next_one` / `_other` | Mới (2) | Gửi mã QR cho khách. Bạn sẽ được nhắc {hours} giờ trước khi hết hạn. | Send the QR code to the guest. You'll get a reminder {hours} hour before it expires. | Send the QR code to the guest. You'll get a reminder {hours} hours before it expires. | Sale nội bộ, mã QR đang tạo hoặc đã có |
| `sale.hold_next_ctv_one` / `_other` | Mới (2) | Nhắn lễ tân hoặc sale nội bộ gửi mã VietQR cọc cho khách. Bạn sẽ được nhắc {hours} giờ trước khi giữ chỗ hết hạn. | Ask the front desk or sales staff to send the guest the deposit VietQR. You'll get a reminder {hours} hour before the hold expires. | … {hours} hours before the hold expires. | CTV |
| `sale.hold_next_no_qr_one` / `_other` | Mới (2) | Thu cọc của khách theo hướng dẫn bên dưới. Bạn sẽ được nhắc {hours} giờ trước khi giữ chỗ hết hạn. | Collect the deposit as shown below. You'll get a reminder {hours} hour before the hold expires. | Collect the deposit as shown below. You'll get a reminder {hours} hours before the hold expires. | Sale nội bộ, `DepositQr` báo lỗi hoặc `PAYMENT_NOT_CONFIGURED` |
| `sale.hold_next` | Xóa | (chữ như dòng `_other`) | – | – | Sau khi FE chuyển sang `_one` / `_other` |
| `sale.hold_next_ctv` | Xóa | (chữ như dòng `_other`) | – | – | Như trên |

FE:
- `DepositQr` báo ra ngoài khi lỗi (ví dụ thêm `onFail`, đối xứng với `onQr`);
- QuoteDialog chọn `sale.hold_next_no_qr_*` khi đã có lỗi và chưa có mã QR;
- trong lúc đang tạo, giữ `sale.hold_next_*`.

DOM xác nhận khi `hold_expiry_reminder_hours = 0` thì có còn nhắc không. Nếu 0 nghĩa là không nhắc, UXD cấp thêm câu không có vế nhắc.

### 4.15 U+2011 cho "2-step" (CPY P401-11) và các cụm số–chữ EN

Cách (a) của thẻ: thay một lần trong `gen_strings.py`, chỉ ở cột EN. Thay "2-step" bằng "2‑step", "1-month" bằng "1‑month", "24-hour" bằng "24‑hour" (U+2011). Rà toàn bộ `strings-en.json` bằng mẫu `\b\d+-[A-Za-z]+` thì chỉ còn 25 khóa có gạch thường. 6 khóa khác đã có U+2011.

25 khóa:
- **"2-step" (22):**
  - `auth.enroll.title`, `auth.enroll.done`;
  - `mfa.nudge`, `mfa.recovery_help`, `mfa.enroll_required`, `mfa.already_on`, `mfa.codes_file_title`, `mfa.codes_low_short`, `mfa.disable`;
  - `shell.security`, `error.MFA_ENROLLMENT_REQUIRED`;
  - `users.more_help`, `users.reset_2fa`, `users.reset_2fa_title`, `users.reset_2fa_done`, `users.reset_2fa_stale`;
  - `co.late_fee_auth_try_review`, `staff.mfa_enroll_desk`, `secmail.lead`, `secnudge.both`;
  - `staff.notif.sec.mfa_reset_self`, `staff.notif.sec.mfa_reset_other`.
- **"1-month" (2):** `sale.month_option`, `sale.month_total`.
- **"24-hour" (1):** `stay.late_help`.

Test so chữ phải lấy chuỗi bằng `tv(key)`, không gõ lại (content-guide mục 2). Thư bảo mật dùng `secmail.lead`: U+2011 hiển thị bình thường trong ứng dụng thư.

### 4.16 Câu mục đích cạnh ô email nhân viên (FB-R4-SEC-ARC-EM-13, Nghị định 13)

Kiểm trên `main`:
- (a) `secmail.purpose` ("Chỉ dùng để gửi thông báo bảo mật cho tài khoản này.") **đã hiện** ở cả SecurityEmailCard 217 và hộp sửa email của OWN (UserEmailDialog 105).
- (b) Câu sau khi lưu đã là "Thông báo đã gửi…" (`secmail.saved`, `users.email_saved`…). Không còn "thư xác nhận".

Còn một ý của SEC chưa làm: ở hộp của OWN, câu nên nói rõ là tài khoản của người kia.

| Khóa | Kiểu | VI | EN | Chỗ dùng |
|---|---|---|---|---|
| `users.email_purpose` | Mới | Chỉ dùng để gửi thông báo bảo mật cho tài khoản của {name}. | Used only to send security notices for {name}'s account. | UserEmailDialog 105, thay `secmail.purpose`. `{name}` = `user.displayName` (tên hiển thị của nhân viên, đã có trong tiêu đề hộp) |

### 4.17 Câu "Bạn nhận (…)" đủ đuôi (FB-R4-UXD-BA-PR89-01)

Không đổi khóa Desk. Đây là chỗ sổ tay trích chữ Desk thiếu đuôi. BA (V5-71) chép đúng khuôn của khóa, **không ghi số**:
- CTV (`sale.commission_ctv`): "Bạn nhận (…% tiền phòng – BR-903)";
- sale nội bộ (`sale.commission`): "Sale nhận (…% tiền phòng – BR-903)".

Ghi cho DOM (V5-30): hai nhãn này khẳng định cơ sở tính là "tiền phòng". Nếu H2 đổi cơ sở tính, UXD đổi chữ cùng lượt.

### 4.18 Dọn theo ghi chú QA bug list v1.0.4

| Mục | Kết quả |
|---|---|
| GN-V104-content-guide-1335 (`rooms.night_auto` câu cũ) | **Đã sạch.** Content-guide v0.4.6 (05/11) đã chép lại dòng này theo PR #87 (dòng 1336 hiện tại). Không còn câu "Đêm ngày thường… lịch giá cộng thêm" ở đâu trong `design/`. QA đóng |
| GN-V104-fo-tabs-holds | **Xóa** `fo.tabs.holds` khỏi `gen_strings.py` (dòng 115) và dòng 326 của content-guide. App không còn chỗ dùng (Desk dùng `today.holds_waiting`) |

### 4.19 Phát hiện thêm khi rà (đề xuất, PO quyết vào v1.0.5 hay để sau)

| Khóa | Kiểu | Chữ cũ | Chữ mới VI | Chữ mới EN | Lý do |
|---|---|---|---|---|---|
| `fo.rack.empty_body` | Sửa | Cả 10 căn đang trống. Bấm vào một ô trống hoặc nút Đặt phòng mới để bắt đầu. | Mọi căn đang trống. Bấm vào một ô trống hoặc nút Đặt phòng mới để bắt đầu. | Every room is free. Click an empty cell or New booking to start. | Số căn viết cứng (RackPage 292). Số căn đổi được ở Danh mục căn |
| `desk_code.channel_off` | Sửa | Gửi qua tin nhắn đang tắt. Chủ đầu tư bật trong Tham số › Kênh gửi mã. | Gửi qua tin nhắn đang tắt. Chủ đầu tư bật trong Tham số quy tắc › Bảo mật › Kênh được gửi mã cho khách. | Sending by message is off. The owner can turn it on in Rule settings › Security › Channels allowed to send guest codes. | Đường dẫn cũ không có trên Desk. Tên mới khớp `nav.params`, `params.grp_security`, `params.k.guest_verify_code_channels` |
| `error.DELIVERY_CHANNEL_DISABLED` | Sửa | Gửi mã qua tin nhắn đang tắt. Chủ đầu tư bật trong Tham số › Kênh gửi mã, hoặc đọc mã cho khách. | Gửi mã qua tin nhắn đang tắt. Chủ đầu tư bật trong Tham số quy tắc › Bảo mật › Kênh được gửi mã cho khách, hoặc đọc mã cho khách. | Sending codes by message is off. The owner can turn it on in Rule settings › Security › Channels allowed to send guest codes, or read the code to the guest. | Như trên |

---

## 5. V5-24 – Tiếng Nga

### 5.1 Bảy chuỗi hướng khách có từ cấm "апартаменты"

Nguồn: decision-log 04/11 (backlog v1.0.5), CPY-on-v104-p4-01 mục 0, CPY `privacy-2026-10-v2-ru.md` (ngoài phạm vi), SEC-on-privacy-v2-ru, UXD-on-privacy-v2-ru S3. Từ cấm theo `rounds/round-04/outputs/CPY/lp-v2-copy.md` (`/апартамент/iu`, `/квартир/iu`, `/посуточн/iu`).

Từ thay là **"номер"** (phòng khách sạn), từ CPY đã dùng và INV đã duyệt cho landing RU (lp-v2-copy 16.2: "номер" là phòng khách sạn, không dùng апартаменты/посуточно). Mọi chỗ chia đúng cách: "номер" (nguyên cách), "в номере" (giới cách), "он готов" (giống đực).

**0 trên 7 chuỗi nằm trong bản thông báo dữ liệu**, vì đó là các khóa `gw.notice_*`, và CPY xác nhận các khóa đó không có từ cấm. Như vậy không có chuỗi nào phải chờ B-PN, cả 7 vào v1.0.5.

| Khóa | Chữ RU cũ | Chữ RU mới (đề xuất, CPY duyệt) | Chỗ dùng |
|---|---|---|---|
| `guest.stay.checkin_time` | Заезд с {time} (апартаменты всегда готовы к 14:00) | Заезд с {time} (номер всегда готов к 14:00) | Trang khách, trong lưu trú |
| `guest.oci.done_body` | Заезд с {time}, если апартаменты уже готовы; к 14:00 они готовы всегда. Код от двери администратор выдаст при заезде. | Заезд с {time}, если номер уже готов; к 14:00 он готов всегда. Код от двери администратор выдаст при заезде. | Trang khách, xong làm thủ tục trước |
| `gw.room` | Апартаменты | Номер | Nhãn ô căn, trang khách |
| `sale.quote_text` (dòng 2) | Апартаменты {room} {room_name}, {from} → {to} ({nights_text}), {guests}. | Номер {room} {room_name}, {from} → {to} ({nights_text}), {guests}. | Báo giá gửi khách RU. Các dòng khác giữ nguyên. Chạy lại `gen-quote-copy.mjs` (`services/api/src/generated/quote-copy.ts`) |
| `msg.booking_confirmed` | … бронирование {code}: апартаменты {room}, {from} → {to} ({nights_text}). Заезд с {checkin_time} (апартаменты всегда готовы к 14:00), выезд до {checkout_time}. … | … бронирование {code}: номер {room}, {from} → {to} ({nights_text}). Заезд с {checkin_time} (номер всегда готов к 14:00), выезд до {checkout_time}. … | Mẫu tin (mục `TEMPLATES`). Phần còn lại giữ nguyên |
| `msg.deposit_received` | … по бронированию {code} (апартаменты {room}, {from} → {to}). … | … по бронированию {code} (номер {room}, {from} → {to}). … | Mẫu tin |
| `msg.hot_water_issue` | … об отсутствии горячей воды в апартаментах {room}. … | … об отсутствии горячей воды в номере {room}. … | Mẫu tin |

Ghi chú:
- Bốn chuỗi `msg.*` hiện **chưa có mã nào gọi**: rà `services`, `apps`, `packages` không thấy chỗ dùng, chúng chỉ nằm trong thư viện mẫu tin và content-guide. Vẫn sửa ở nguồn để lần nối mẫu tin sau không mang từ cấm.
- Câu hỏi giọng văn cho CPY, không tính vào số khóa: `msg.hot_water_issue` kết bằng "!" ở cả 3 ngôn ngữ ("Приносим извинения за неудобства!", "Sorry for the inconvenience!", "Xin lỗi vì bất tiện!"). Giọng OTTIMO là điềm tĩnh, nên UXD nghiêng về dấu chấm. "Здравствуйте, {name}!" là cách chào chuẩn trong tiếng Nga, nên UXD đề nghị giữ.
- Đề nghị FE-B thêm một kiểm tự động: các khóa RU `guest.*`, `gw.*`, `msg.*` và `sale.quote_text` không khớp `/апартамент|квартир|посуточн/iu`, giống `landing-web/scripts/dist-checks.mjs:324`. Mục đích là không để từ cấm quay lại.

### 5.2 Font chữ Nga ở ô mã và Wi-Fi bị CSP chặn (BUG-R4-017)

Yêu cầu cho FE-A (`apps/admin-web`), MOB (`apps/mobile`, PWA nhân viên) và FE-B (`apps/guest-web`). SEC duyệt.

1. Giữ **JetBrains Mono** cho ô mã, mã đặt phòng, nội dung chuyển khoản và Wi-Fi (lớp `.mono` của DS), gồm cả tập Kirin (`cyrillic`) và tập tiếng Việt, mặt 400 và 500.
2. Không để Vite nhúng font thành `data:`. Ở cả 3 ứng dụng, `build.assetsInlineLimit` dùng dạng hàm, trả `false` cho `.woff` và `.woff2`. Font tự host là tệp dưới `/assets/`.
3. **Không** nới CSP thành `font-src 'self' data:`. Giữ `font-src 'self'` như `Caddyfile.prod` và `expected-headers.sh`.
4. Thêm kiểm `check:dist` cho cả 3 ứng dụng: CSS sau build không còn `data:font`.
5. Cách kiểm (QA, UXD):
   - mở `desk.`, `staff.`, `g.` trên staging: console 0 lỗi "violates … font-src";
   - trang khách RU: phần tử `.mono` có chữ Kirin hiện bằng JetBrains Mono, ví dụ `document.fonts.check('500 14px "JetBrains Mono"', 'Ж')` trả `true` sau khi tải;
   - chụp ảnh 390 px, có thẻ Wi-Fi.
6. Không đổi token, cỡ chữ hay màu.

---

## 6. Yêu cầu cho FE, BE (gom theo tệp)

| Vai | Tệp | Việc | Mục |
|---|---|---|---|
| FE-A | `design/tools/gen_strings.py` (+ sinh lại) | Áp mọi dòng Sửa, Mới, Xóa của bảng này. Ghi chú mỗi khóa: "v1.0.5 – V5-xx" | toàn bộ |
| FE-A | `app/rules.ts` | `RULE_DEFAULTS` theo mức đề xuất (30, 30) | 1.1 |
| FE-A | `quotes/QuoteDialog.tsx` | `n` cho `LONG_STAY_REQUIRES_CONTRACT`; gom đêm theo số tiền với `sale.nights_at_rate_*`; `sale.hold_next_*` theo số nhiều và `_no_qr`; `sale.quote_expires` truyền `expiresAt − 1 phút` | 1.1, 1.4, 4.7, 4.14 |
| FE-A | `booking/BookingDialog.tsx` | Khóa bản xem gồm số người; "–" và `aria-busy` khi chờ; chữ OTA chưa gõ giá; câu sàn–trần có số, dự phòng `rate_out_of_range_dates`; `role="alert"`, `aria-invalid` | 1.6, 3 |
| FE-A | `stay/CheckOutPage.tsx`, `stay/StayDialogs.tsx` | `rate.calendar_short` ở 2 chỗ luôn hiện; `stay.after_noon_hint` với `{time}`; `stay.agreed_time`; `stay.companion_field`; `stay.charge_penalty_note` có điều kiện | 1.2, 1.5, 4.2, 4.3, 4.7 |
| FE-A | `stay/common.tsx`, `money/MoneyPage.tsx` | `StepUpDialog` thêm `purpose` | 4.4 |
| FE-A | `pages/paramCatalog.ts`, `ParamDialog.tsx`, `ParamsPage.tsx`, `app/problem.ts` | `KNOWN` cho 29 khóa, đơn vị `nights`; 6 nhánh câu `PARAM_OUT_OF_RANGE`; `params.err_*`; câu `ota_base_rate` | 2 |
| FE-A | `app/folio.ts` | Biến thể phí trả sớm (`_same_day`, số nhiều) | 4.1 |
| FE-A | `reservations/ReservationsPage.tsx`, `ReservationDialogs.tsx`, `pages/UsersPage.tsx`, `UserEmailDialog.tsx`, `webreq/*` | `rsv.list_empty_body_sales`; `money()` trong `DEPOSIT_INSUFFICIENT`; `INVALID_TRANSITION_generic(_reloaded)`; `users.email_purpose`; `webreq.pii_erased` | 4.7, 4.10, 4.12, 4.13, 4.16 |
| FE-A | test | Sửa các test nhắc khóa bị xóa hoặc chữ cũ, ví dụ `v104-rate-source-typed.test.tsx` (`bk.src_weekend`), test so `error.DEPOSIT_INSUFFICIENT`, `sale.hold_next` | 1.3, 4.13, 4.14 |
| FE-B | `apps/guest-web` | `gw.lang_auto` 3 ngôn ngữ; 3 chuỗi RU trang khách; kiểm từ cấm RU; font (5.2) | 4.6, 5 |
| MOB | `apps/mobile` | Font (5.2). Kiểm các chuỗi U+2011 trên thẻ 362 px | 4.15, 5.2 |
| BE-A | `reservations.service.ts` 739–743 | `min`, `max` trong Problem `RATE_OUT_OF_RANGE` (theo ARC 0.3.13) | 3 |
| BE-B | `folio/public/line-labels.ts` | `bill.line.late_fee_as_night` cho `chargeCode = 'late_fee_as_night'`, không có `time` | 4.8 |
| BE | `services/api/scripts/gen-quote-copy.mjs` | Chạy lại sau khi đổi `sale.quote_text` RU | 5.1 |
| UXD | `design/content-guide.md` | Sau khi FE áp: đồng bộ mục 8 theo `strings-tables.md`, ghi phiên bản v0.4.7, xóa dòng `fo.tabs.holds`, sửa ô `bk.src_weekend` trong `hifi/09-booking.html` | 1.3, 4.18 |

Phát hiện ngoài phạm vi chữ, chuyển BE và QA (không phải ESC): validator `weekend_nights` (`parameter-rules.ts:180–187`) chỉ nhận số 1–7, trong khi giá trị đang chạy và kiểu `Weekday` dùng mã chữ `["FRI","SAT"]` (`production-defaults.ts:200`, `pricing.ts:12`). Hệ quả:
- lưu lại đúng giá trị đề xuất của từ điển sẽ bị 422, kèm câu "Chọn một trong: 1, 2, 3, 4, 5, 6, 7";
- còn lưu dạng số thì bộ tính giá không còn nhận ra đêm cuối tuần.

Hôm nay INV không cần sửa tham số này (mức tăng = 0, hướng dẫn chuyển giá giữ FRI/SAT), nên chưa gây sai tiền. Nhưng đây là bẫy. Đề xuất: BE đổi validator sang tập `MON…SUN`, và `allowed` trả các mã này.

## 7. Cần CPY duyệt trước khi FE áp

| # | Khóa | Lý do |
|---|---|---|
| C1 | 7 chuỗi RU ở mục 5.1 | Chữ khách. CPY viết lại nếu cần; người bản xứ đọc nếu có |
| C2 | `gw.lang_auto` (EN, VI, RU) | Chữ khách trên trang khách |
| C3 | `bill.line.early_departure_fee_same_day`, `bill.line.early_departure_fee_notice_one` / `_other` | Dòng phiếu khách cầm |
| C4 | `bill.line.late_fee_as_night` | Dòng phiếu khách cầm. Bản EN theo đề xuất QA |
| C5 | Dấu "!" ở `msg.hot_water_issue` (3 ngôn ngữ) | Giọng văn. Không tính vào số khóa |
| C6 | (để sau, không thuộc v1.0.5) chữ "phụ thu" ở các dòng `bill.line.*` hiện có | Từ hạn chế với khách. Dòng mới C4 giữ cùng từ với các dòng phiếu cũ cho nhất quán. Nếu CPY đổi thì đổi cả họ trong một lượt |

Mọi khóa còn lại là chữ Desk nội bộ, UXD tự quyết theo protocol.

## 8. Kiểm sau khi áp (QA, UXD review PR)

- `grep` trên `strings-vi.json` và `strings-en.json`: không còn "28 đêm", "28 nights", "7 đêm", "7+ nights", "+15", "trước giảm theo số đêm", "before length-of-stay", "(R2)", "R2:", "Round 3", "Cả 10 căn", "All 10 rooms".
- `strings-ru.json` và `quote-copy.ts`: không còn "апартамент".
- Đổi thử tham số trên stack QA: `long_stay_required_from_nights` = 21, `checkout_time` = 11:00, `los_discount` có 1 bậc, `weekend_uplift_pct` = 10. Chữ theo đúng số mới:
  - hộp thuê dài hạn;
  - gợi ý trả muộn;
  - dòng "Đã giảm … theo số đêm ở";
  - các dòng "{n} đêm × giá" của báo giá cộng đúng bằng tổng.
- ParamDialog: thử 6 dạng lỗi `PARAM_OUT_OF_RANGE`, JSON thiếu ngoặc kép, giờ sai dạng. Không còn `{min}`, `{max}` lộ ra; không còn "danh sách" ở ô không có danh sách.
- Đặt phòng mới, kênh OTA để trống giá: không có "0 đ". Trực tiếp gõ dưới sàn: câu có số sàn, trần thật.
- Desk EN ở khung 362 px (PWA) và 1440 px: các cụm U+2011 không gãy dòng.
